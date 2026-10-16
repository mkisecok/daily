import type { RecordEvent, RecordToolDefinition } from './types.js';

export type StepStatus = 'done' | 'current' | 'upcoming' | 'skipped';

/**
 * where a workflow record stands, per state: `done` only for states the
 * record actually passed (replayed from its transition events, steps taken
 * back are forgotten), `upcoming` for states still reachable from the current
 * one, `skipped` for branches not taken. Workflows have alternatives (reported
 * or not reportable), so the definition order alone says nothing about what
 * happened.
 */
export function stateProgress(
	definition: RecordToolDefinition,
	state: string | null,
	events: RecordEvent[]
): { id: string; status: StepStatus }[] {
	const workflow = definition.workflow;
	if (!workflow) return [];

	const moves = events
		.map((event, index) => ({ event, index }))
		.filter(({ event }) => event.kind === 'transition' && event.toState)
		.sort((a, b) => a.event.at.localeCompare(b.event.at) || a.index - b.index)
		.map(({ event }) => event.toState as string);

	let path = [workflow.initialState];
	const visit = (to: string) => {
		const back = path.indexOf(to);
		path = back >= 0 ? path.slice(0, back + 1) : [...path, to];
	};
	moves.forEach(visit);
	if (state && path.at(-1) !== state) visit(state);

	const reachable = new Set<string>();
	const queue = state ? [state] : [];
	while (queue.length > 0) {
		const from = queue.shift() as string;
		for (const transition of workflow.transitions) {
			if (transition.from !== from) continue;
			if (path.includes(transition.to) || reachable.has(transition.to)) continue;
			reachable.add(transition.to);
			queue.push(transition.to);
		}
	}

	return workflow.states.map(({ id }) => ({
		id,
		status:
			id === state
				? 'current'
				: path.includes(id)
					? 'done'
					: reachable.has(id)
						? 'upcoming'
						: 'skipped'
	}));
}
