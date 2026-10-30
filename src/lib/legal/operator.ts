/**
 * who runs Daily, for the privacy notice (Art. 13(1)(a), (b) DSGVO) and the
 * imprint (§ 5 DDG). Fill in before going live; while a required field is
 * empty the pages show that the details are missing.
 */
export type Operator = {
	/** natural person or company with legal form */
	name: string;
	street: string;
	/** postcode and town */
	city: string;
	country: string;
	email: string;
	phone?: string;
	/** a data protection officer, only if one is designated (Art. 37 DSGVO) */
	dpo?: { name: string; email: string };
	/** the supervisory authority for the operator's seat (Art. 77 DSGVO) */
	authority?: { name: string; url: string };
	/** who sends Keycloak's mails (verification, password reset) */
	mailProvider?: { name: string; seat: string };
};

export const OPERATOR: Operator = {
	name: '',
	street: '',
	city: '',
	country: 'Deutschland',
	email: ''
};

/** date of the current privacy notice */
export const PRIVACY_VERSION = '2026-10-30';

export function operatorMissing(operator: Operator = OPERATOR): boolean {
	return !operator.name || !operator.street || !operator.city || !operator.email;
}
