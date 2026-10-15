// see https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { SessionInfo, SessionUser } from '#lib/server/auth/session.js';
import type { OrganisationSummary } from '#lib/server/org.js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: SessionInfo | undefined;
			user: SessionUser | undefined;
			/** the organisation the signed-in user works in (cookie, checked against memberships) */
			organisation: OrganisationSummary | undefined;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
