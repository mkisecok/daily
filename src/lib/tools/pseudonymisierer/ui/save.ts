export const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** hands a file made in the browser to the browser's download */
export function saveFile(data: Uint8Array | string, name: string, type: string): void {
	const url = URL.createObjectURL(new Blob([data as BlobPart], { type }));
	const link = document.createElement('a');
	link.href = url;
	link.download = name;
	link.click();
	URL.revokeObjectURL(url);
}
