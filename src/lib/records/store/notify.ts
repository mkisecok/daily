import type { RecordStore } from './types.js';

type Clearable = RecordStore & { clear?: () => void };

/**
 * the same store, calling `changed` after every write (and after clearing the
 * browser's data), so views outside the page, such as the sidebar's deadline
 * counter, can refresh without a navigation
 */
export function notifying(inner: Clearable, changed: () => void): Clearable {
	const after = <T>(result: Promise<T>) =>
		result.then((value) => {
			changed();
			return value;
		});
	return {
		list: (toolSlug) => inner.list(toolSlug),
		get: (id) => inner.get(id),
		deadlines: () => inner.deadlines(),
		create: (toolSlug, input) => after(inner.create(toolSlug, input)),
		update: (id, input, expectedVersion) => after(inner.update(id, input, expectedVersion)),
		transition: (id, to, expectedVersion) => after(inner.transition(id, to, expectedVersion)),
		attachAssessment: (id, field, snapshot, derived) =>
			after(inner.attachAssessment(id, field, snapshot, derived)),
		archive: (id) => after(inner.archive(id)),
		clear: inner.clear
			? () => {
					inner.clear?.();
					changed();
				}
			: undefined
	};
}
