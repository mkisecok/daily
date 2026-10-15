/** whether the typed text confirms; no word means there is nothing to type */
export function confirmMatches(typed: string, word: string | undefined): boolean {
	if (word === undefined) return true;
	const wanted = word.trim().toLocaleLowerCase('de');
	return wanted !== '' && typed.trim().toLocaleLowerCase('de') === wanted;
}
