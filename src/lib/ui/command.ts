/** lower case without accents (Unicode marks) and with ß as ss, so "prufung" finds "Prüfung" */
const fold = (text: string) =>
	text.toLocaleLowerCase('de').normalize('NFD').replace(/\p{M}/gu, '').replace(/ß/g, 'ss');

/**
 * how well an entry matches, for the palette's filter: 1 when the label
 * starts with the query (or the query is empty), 0.75 when the label contains
 * it, 0.5 when a keyword does, 0 when nothing matches
 */
export function score(label: string, query: string, keywords: string[] = []): number {
	const q = fold(query.trim());
	if (q === '') return 1;
	const folded = fold(label);
	if (folded.startsWith(q)) return 1;
	if (folded.includes(q)) return 0.75;
	if (keywords.some((keyword) => fold(keyword).includes(q))) return 0.5;
	return 0;
}
