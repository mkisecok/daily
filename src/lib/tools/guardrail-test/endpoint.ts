export type Endpoint = {
	/** chat completions URL of an OpenAI-compatible API */
	url: string;
	model: string;
	/** sent as a bearer token; kept in memory only */
	key: string;
	/** optional system prompt, e.g. with a canary value */
	system: string;
};

/** the assistant text from an OpenAI-compatible or Anthropic-style response, or plain text */
export function responseText(body: unknown): string {
	if (typeof body === 'string') return body;
	if (!body || typeof body !== 'object') return '';
	const b = body as Record<string, unknown>;
	const choice = Array.isArray(b.choices) ? (b.choices[0] as Record<string, unknown>) : undefined;
	const message = choice?.message as Record<string, unknown> | undefined;
	if (typeof message?.content === 'string') return message.content;
	if (typeof choice?.text === 'string') return choice.text;
	if (Array.isArray(b.content)) {
		return b.content
			.map((part) => (part && typeof part === 'object' && 'text' in part ? String(part.text) : ''))
			.join('');
	}
	if (typeof b.output_text === 'string') return b.output_text;
	return '';
}

/** how long one answer may take before the request is given up */
export const ANSWER_TIMEOUT_MS = 60_000;

/**
 * one prompt against the endpoint, straight from the browser. Works when
 * the endpoint allows cross-origin requests (local gateways, most proxies);
 * otherwise use the manual mode. `signal` cancels the request, e.g. on a
 * timeout or when the user stops the run.
 */
export async function ask(
	endpoint: Endpoint,
	prompt: string,
	fetchFn: typeof fetch = fetch,
	signal?: AbortSignal
): Promise<string> {
	const messages = [
		...(endpoint.system.trim() ? [{ role: 'system', content: endpoint.system }] : []),
		{ role: 'user', content: prompt }
	];
	const response = await fetchFn(endpoint.url, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			...(endpoint.key ? { authorization: `Bearer ${endpoint.key}` } : {})
		},
		body: JSON.stringify({ model: endpoint.model, messages }),
		signal
	});
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	const type = response.headers.get('content-type') ?? '';
	return responseText(type.includes('json') ? await response.json() : await response.text());
}
