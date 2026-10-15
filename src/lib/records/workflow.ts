import type { Localized } from '../tools/types.js';
import type { RecordToolDefinition, RecordView, StateDef, TransitionDef } from './types.js';
import { isEmpty } from './validate.js';

export function initialState(definition: RecordToolDefinition): string | null {
	return definition.workflow?.initialState ?? null;
}

export function stateById(
	definition: RecordToolDefinition,
	id: string | null
): StateDef | undefined {
	return definition.workflow?.states.find((state) => state.id === id);
}

export function isTerminal(definition: RecordToolDefinition, state: string | null): boolean {
	return stateById(definition, state)?.terminal === true;
}

export type AvailableTransition = {
	transition: TransitionDef;
	missing: string[];
	/** why the transition's own check blocks it, if it does */
	blocked: Localized | null;
};

/** transitions out of the record's current state, with what still stands in their way */
export function allowedTransitions(
	definition: RecordToolDefinition,
	record: RecordView
): AvailableTransition[] {
	if (!definition.workflow) return [];
	return definition.workflow.transitions
		.filter((transition) => transition.from === record.state)
		.map((transition) => ({
			transition,
			missing: (transition.requires ?? []).filter((id) => isEmpty(record.data[id])),
			blocked: transition.check?.(record) ?? null
		}));
}

export type TransitionResult =
	| { ok: true; state: string }
	| { ok: false; error: 'not-workflow' | 'not-allowed' }
	| { ok: false; error: 'missing'; missing: string[] }
	| { ok: false; error: 'blocked'; reason: Localized };

/** checks a transition; the caller persists the new state */
export function applyTransition(
	definition: RecordToolDefinition,
	record: RecordView,
	to: string
): TransitionResult {
	if (!definition.workflow) return { ok: false, error: 'not-workflow' };
	const option = allowedTransitions(definition, record).find((o) => o.transition.to === to);
	if (!option) return { ok: false, error: 'not-allowed' };
	if (option.missing.length > 0) return { ok: false, error: 'missing', missing: option.missing };
	if (option.blocked) return { ok: false, error: 'blocked', reason: option.blocked };
	return { ok: true, state: to };
}
