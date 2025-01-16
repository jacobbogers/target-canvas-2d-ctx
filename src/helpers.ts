export const decode = (() => {
	const td = new TextDecoder();
	return td.decode.bind(td);
})();

export const encode = (() => {
	const te = new TextEncoder();
	return te.encode.bind(te);
})();

export const EmptyUint8 = new Uint8Array(0);
