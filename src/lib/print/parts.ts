/**
 * a document that follows a form part by part, such as a notification:
 * each row the question, the answer and, where the law numbers it, its
 * letter. `fill` marks a line to fill in by hand.
 */
export type PrintRow = { letter: string; label: string; value: string; fill?: boolean };
export type PrintPart = { id: string; title: string; rows: PrintRow[] };
