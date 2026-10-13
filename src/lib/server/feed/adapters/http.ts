export const USER_AGENT = 'DailyBot/0.1 (+https://dai-ly.de; feed reader for data-protection news)';

/** GET with a timeout and an honest User-Agent; throws on non-2xx. */
export async function fetchText(url: string, timeoutMs = 15_000): Promise<string> {
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
