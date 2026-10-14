import { error, fail } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import {
	cleanName,
	createClientOrganisation,
	listOrganisations,
	ORG_COOKIE,
	renameOrganisation
} from '#lib/server/org.js';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

/** Needs a signed-in user and the database; never part of a static build. */
export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) error(401, 'Not signed in');
	return {
		organisations: await listOrganisations(db, locals.user.id),
		activeId: locals.organisation?.id ?? null
	};
};

function remember(event: RequestEvent, organisationId: string) {
	event.cookies.set(ORG_COOKIE, organisationId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: event.url.protocol === 'https:',
		maxAge: 60 * 60 * 24 * 365
	});
}

export const actions: Actions = {
	create: async (event) => {
		if (!event.locals.user) error(401, 'Not signed in');
		const name = cleanName((await event.request.formData()).get('name'));
		if (!name) return fail(400, { action: 'create' as const, invalid: true });
		const org = await createClientOrganisation(db, event.locals.user.id, name);
		remember(event, org.id);
		return { switched: org.name };
	},

	switch: async (event) => {
		if (!event.locals.user) error(401, 'Not signed in');
		const id = (await event.request.formData()).get('id');
		const org = (await listOrganisations(db, event.locals.user.id)).find((o) => o.id === id);
		if (!org) error(404, 'Organisation not found');
		remember(event, org.id);
		return { switched: org.name };
	},

	rename: async ({ request, locals }) => {
		if (!locals.user) error(401, 'Not signed in');
		const form = await request.formData();
		const id = form.get('id');
		const name = cleanName(form.get('name'));
		if (typeof id !== 'string') error(400, 'id missing');
		if (!name) return fail(400, { action: 'rename' as const, id, invalid: true });
		if (!(await renameOrganisation(db, locals.user.id, id, name))) error(403, 'Not an owner');
		return { renamed: id };
	}
};
