// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { SessionInfo, SessionUser } from '#lib/server/auth/session.js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: SessionInfo | undefined;
			user: SessionUser | undefined;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
