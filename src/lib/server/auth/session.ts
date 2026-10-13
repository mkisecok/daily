import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import * as client from 'openid-client';
import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/env';
import { db } from '#lib/server/db/index.js';
import { memberships, organisations, sessions, users, type User } from '#lib/server/db/schema.js';
import { readRealmRoles } from './jwt.js';
import { getOidcConfiguration } from './oidc.js';

export const SESSION_COOKIE = 'daily_session';
const SESSION_DAYS = 30;
const REFRESH_LEEWAY_SECONDS = 60;

export type SessionUser = {
	id: string;
	email: string;
	displayName: string;
	locale: string;
	roles: string[];
};

export type SessionInfo = {
	id: string;
	user: SessionUser;
	idToken: string;
};

type TokenSet = client.TokenEndpointResponse & client.TokenEndpointResponseHelpers;

function cookieOptions(maxAge: number) {
	return { path: '/', httpOnly: true, sameSite: 'lax' as const, secure: !dev, maxAge };
}

/**
 * Called from the OIDC callback: upserts the user from the ID token, makes
 * sure they own an organisation, and stores a server-side session.
 */
export async function createSession(cookies: Cookies, tokens: TokenSet): Promise<SessionUser> {
	const claims = tokens.claims();
	if (!claims) throw new Error('Token response without id_token');

	const user = await upsertUser(claims);
	await ensureOwnOrganisation(user);

	const id = randomBytes(32).toString('base64url');
	const now = Date.now();
	await db.insert(sessions).values({
		id,
		userId: user.id,
		idToken: tokens.id_token ?? '',
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token ?? null,
		accessExpiresAt: new Date(now + (tokens.expiresIn() ?? 300) * 1000),
		expiresAt: new Date(now + SESSION_DAYS * 24 * 60 * 60 * 1000)
	});
	cookies.set(SESSION_COOKIE, id, cookieOptions(SESSION_DAYS * 24 * 60 * 60));

	return toSessionUser(user, readRealmRoles(tokens.access_token));
}

/**
 * Resolves the session cookie to a user, refreshing the Keycloak access
 * token when it is about to expire. An unusable session is deleted.
 */
export async function loadSession(cookies: Cookies): Promise<SessionInfo | undefined> {
	const id = cookies.get(SESSION_COOKIE);
	if (!id) return undefined;

	const row = await db
		.select({ session: sessions, user: users })
		.from(sessions)
		.innerJoin(users, eq(users.id, sessions.userId))
		.where(eq(sessions.id, id))
		.limit(1)
		.then((rows) => rows[0]);

	if (!row || row.session.expiresAt.getTime() < Date.now()) {
		await destroySession(cookies);
		return undefined;
	}

	let { accessToken, idToken } = row.session;
	const needsRefresh =
		row.session.accessExpiresAt.getTime() - Date.now() < REFRESH_LEEWAY_SECONDS * 1000;

	if (needsRefresh) {
		if (!row.session.refreshToken) {
			await destroySession(cookies);
			return undefined;
		}
		try {
			const configuration = await getOidcConfiguration();
			const refreshed = await client.refreshTokenGrant(configuration, row.session.refreshToken);
			accessToken = refreshed.access_token;
			idToken = refreshed.id_token ?? idToken;
			await db
				.update(sessions)
				.set({
					accessToken,
					idToken,
					refreshToken: refreshed.refresh_token ?? row.session.refreshToken,
					accessExpiresAt: new Date(Date.now() + (refreshed.expiresIn() ?? 300) * 1000)
				})
				.where(eq(sessions.id, id));
		} catch {
			// Keycloak rejected the refresh token (SSO session ended, user disabled…).
			await destroySession(cookies);
			return undefined;
		}
	}

	return { id, user: toSessionUser(row.user, readRealmRoles(accessToken)), idToken };
}

export async function destroySession(cookies: Cookies): Promise<void> {
	const id = cookies.get(SESSION_COOKIE);
	if (id) await db.delete(sessions).where(eq(sessions.id, id));
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

async function upsertUser(claims: client.IDToken): Promise<User> {
	const email = typeof claims.email === 'string' ? claims.email : `${claims.sub}@unknown.invalid`;
	const displayName =
		(typeof claims.name === 'string' && claims.name) ||
		(typeof claims.preferred_username === 'string' && claims.preferred_username) ||
		email;
	const locale = typeof claims.locale === 'string' ? claims.locale.slice(0, 2) : 'de';

	const [user] = await db
		.insert(users)
		.values({ id: claims.sub, email, displayName, locale })
		.onConflictDoUpdate({
			target: users.id,
			set: { email, displayName, lastLoginAt: new Date() }
		})
		.returning();
	return user;
}

async function ensureOwnOrganisation(user: User): Promise<void> {
	const existing = await db
		.select({ id: memberships.organisationId })
		.from(memberships)
		.where(eq(memberships.userId, user.id))
		.limit(1);
	if (existing.length > 0) return;

	await db.transaction(async (tx) => {
		const [organisation] = await tx
			.insert(organisations)
			.values({ name: user.displayName, kind: 'eigene' })
			.returning();
		await tx
			.insert(memberships)
			.values({ userId: user.id, organisationId: organisation.id, role: 'owner' });
	});
}

function toSessionUser(user: User, roles: string[]): SessionUser {
	return {
		id: user.id,
		email: user.email,
		displayName: user.displayName,
		locale: user.locale,
		roles
	};
}
