import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { definition } from './definition.js';

/** asking again, while nobody has said what became of the recommendation */
function deadlines(record: RecordView): DeadlineSpec[] {
	const day = record.data.nachfragen_am;
	const open = !record.data.umsetzung || record.data.umsetzung === 'offen';
	if (typeof day !== 'string' || !day || !open) return [];
	return [
		{
			kind: 'nachfragen',
			label: {
				de: 'Nachfragen: Wurde die Empfehlung umgesetzt?',
				en: 'Ask again: was the recommendation followed?'
			},
			dueAt: dayAt(day),
			cite: { law: 'DSGVO', ref: 'Art. 39 Abs. 1 lit. b' }
		}
	];
}

export const engine: RecordEngine = { deadlines };
export { definition };
