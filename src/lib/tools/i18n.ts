import { getLocale } from '#lib/paraglide/runtime.js';
import type { LegalBasis, Localized } from './types.js';

/** Picks the current locale's string from tool content. */
export function text(value: Localized, locale: string = getLocale()): string {
	return locale === 'en' ? value.en : value.de;
}

const BODIES = new Set<LegalBasis['law']>(['EDPB', 'DSK', 'WP29']);

/**
 * Statutes cite law-last, as German practice has it: "Art. 35 Abs. 3 DSGVO".
 * Documents of a body cite body-first: "DSK Kurzpapier Nr. 5", "WP29 WP 248".
 */
export function cite(basis: LegalBasis): string {
	return BODIES.has(basis.law) ? `${basis.law} ${basis.ref}` : `${basis.ref} ${basis.law}`;
}
