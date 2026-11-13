import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { definition } from './definition.js';

/** the next step as a deadline while the matter is not done; its text is the label */
function deadlines(record: RecordView): DeadlineSpec[] {
	const due = record.data.faellig_am;
	if (typeof due !== 'string' || !due || record.state === 'erledigt') return [];
	const step = record.data.naechster_schritt;
	const label = typeof step === 'string' && step ? step : null;
	return [
		{
			kind: 'naechster-schritt',
			label: label
				? { de: label, en: label }
				: { de: 'Nächster Schritt im Vorgang', en: 'Next step of the matter' },
			dueAt: dayAt(due)
		}
	];
}

export const engine: RecordEngine = { deadlines };
export { definition };
