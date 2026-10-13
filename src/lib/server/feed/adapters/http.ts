export const USER_AGENT = 'DailyBot/0.1 (+https://dai-ly.de; feed reader for data-protection news)';

const RETRY_DELAY_MS = 3_000;

/**
 * GET with a timeout and an honest User-Agent; throws on non-2xx. A
 * network-level failure (no HTTP response at all) is retried once, and the
 * thrown message names the underlying cause, e.g. `ECONNRESET`.
 */
export async function fetchText(url: string, timeoutMs = 15_000): Promise<string> {
	try {
		return await fetchOnce(url, timeoutMs);
	} catch (error) {
		if (!isNetworkError(error)) throw error;
		await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
		try {
			return await fetchOnce(url, timeoutMs);
		} catch (retryError) {
			throw new Error(describe(retryError), { cause: retryError });
		}
	}
}

/** undici reports connection problems as `TypeError: fetch failed` with a cause. */
function isNetworkError(error: unknown): boolean {
	return error instanceof TypeError || (error instanceof Error && error.name === 'AbortError');
}

export function describe(error: unknown): string {
	if (!(error instanceof Error)) return String(error);
	if (error.name === 'AbortError') return 'timeout';
	const cause = error.cause as { code?: string; message?: string } | undefined;
	const detail = cause?.code ?? cause?.message;
	return detail ? `${error.message} (${detail})` : error.message;
}

async function fetchOnce(url: string, timeoutMs: number): Promise<string> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetch(url, {
			headers: {
				'user-agent': USER_AGENT,
				accept:
					'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8'
			},
			signal: controller.signal,
			redirect: 'follow'
		});
		if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
		return await response.text();
	} finally {
		clearTimeout(timer);
	}
}

export function stripHtml(value: string): string {
	return value
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/\s+/g, ' ')
		.trim();
}
