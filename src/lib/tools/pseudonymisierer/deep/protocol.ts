/** messages between the page and the model worker */

/** the model: a multilingual GLiNER for personal data, int8, at a fixed revision */
export const MODEL_REPO = 'onnx-community/gliner_multi_pii-v1';
export const MODEL_REVISION = '2e0397a7e8a250d76c37122232b3cbde42c8d629';
export const MODEL_URL = `https://huggingface.co/${MODEL_REPO}/resolve/${MODEL_REVISION}/onnx/model_int8.onnx`;
/** the download size shown before anything is fetched */
export const MODEL_MB = 349;
/** where the browser keeps the model between visits */
export const MODEL_CACHE = 'daily-gliner-v1';

export type ToWorker = { type: 'load' } | { type: 'find'; id: number; text: string };

export type FromWorker =
	| { type: 'progress'; loaded: number; total: number }
	| { type: 'ready' }
	| { type: 'error'; message: string }
	| { type: 'found'; id: number; names: { value: string; score: number }[] };
