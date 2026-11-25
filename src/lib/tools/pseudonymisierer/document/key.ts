/**
 * the key to a pseudonymised document: which placeholder stands for which
 * original value. It is the "additional information" of Art. 4 Nr. 5 DSGVO,
 * so it never goes into the document, and it is locked with a password:
 * AES-GCM, with the key derived by PBKDF2 (SHA-256, 600 000 rounds, as OWASP
 * recommends in 2025). All of it runs in the browser's Web Crypto.
 */

export const KEY_FORMAT = 'daily-pseudonymisierer-schluessel';
export const ITERATIONS = 600_000;
/** shorter passwords are refused */
export const MIN_PASSWORD = 10;

export type KeyContent = {
	/** SHA-256 of the pseudonymised document's text, to tell whether it changed since */
	fingerprint: string;
	created: string;
	/** placeholder → original value */
	values: Record<string, string>;
	/**
	 * PDF only: each covered line, where it stood on its page (points from
	 * the top left) and what it said, so a restore can write it back there
	 */
	regions?: {
		/** the first line of a value; the lines up to the next first one belong to it */
		first?: boolean;
		page: number;
		x: number;
		y: number;
		w: number;
		h: number;
		token: string;
		text: string;
	}[];
};

/** what the key file holds: nothing readable but the format and a note */
type Envelope = {
	format: typeof KEY_FORMAT;
	version: 1;
	hinweis: string;
	kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
	cipher: { name: 'AES-GCM'; iv: string };
	data: string;
};

export class KeyError extends Error {
	constructor(public readonly reason: 'format' | 'password') {
		super(reason);
		this.name = 'KeyError';
	}
}

const toBase64 = (bytes: Uint8Array) => {
	let binary = '';
	for (let i = 0; i < bytes.length; i += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	}
	return btoa(binary);
};
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
	const base = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		'PBKDF2',
		false,
		['deriveKey']
	);
	return crypto.subtle.deriveKey(
		{ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
		base,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

/** the key file's text, locked with `password` */
export async function lockKey(
	content: KeyContent,
	password: string,
	iterations = ITERATIONS
): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const key = await derive(password, salt, iterations);
	const data = new Uint8Array(
		await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv },
			key,
			new TextEncoder().encode(JSON.stringify(content))
		)
	);
	const envelope: Envelope = {
		format: KEY_FORMAT,
		version: 1,
		hinweis:
			'Schlüssel zu einem pseudonymisierten Dokument (Art. 4 Nr. 5 DSGVO). Getrennt vom Dokument aufbewahren.',
		kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations, salt: toBase64(salt) },
		cipher: { name: 'AES-GCM', iv: toBase64(iv) },
		data: toBase64(data)
	};
	return JSON.stringify(envelope, null, 2);
}

/** the key's content; a wrong password and a damaged file both fail the AES-GCM check */
export async function unlockKey(file: string, password: string): Promise<KeyContent> {
	let envelope: Envelope;
	try {
		envelope = JSON.parse(file);
	} catch {
		throw new KeyError('format');
	}
	if (
		envelope?.format !== KEY_FORMAT ||
		envelope.version !== 1 ||
		!envelope.kdf ||
		!envelope.cipher
	) {
		throw new KeyError('format');
	}
	const key = await derive(password, fromBase64(envelope.kdf.salt), envelope.kdf.iterations);
	let plain: ArrayBuffer;
	try {
		plain = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: fromBase64(envelope.cipher.iv) as BufferSource },
			key,
			fromBase64(envelope.data) as BufferSource
		);
	} catch {
		throw new KeyError('password');
	}
	return JSON.parse(new TextDecoder().decode(plain)) as KeyContent;
}

/** SHA-256 of a text, as hex */
export async function fingerprint(text: string): Promise<string> {
	const hash = new Uint8Array(
		await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
	);
	return [...hash].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
