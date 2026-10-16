const WEEK = 7 * 24 * 60 * 60 * 1000;

/** open deadlines due within the next seven days (overdue ones included), and whether any is overdue */
export function dueSoon(
	deadlines: { dueAt: string }[],
	now: Date
): { count: number; overdue: boolean } {
	const limit = now.getTime() + WEEK;
	const due = deadlines.filter((d) => new Date(d.dueAt).getTime() <= limit);
	return {
		count: due.length,
		overdue: due.some((d) => new Date(d.dueAt).getTime() < now.getTime())
	};
}
