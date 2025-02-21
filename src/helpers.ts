import type { Builder } from './builder/types';
import type { Advance } from './types';

export const decode = (() => {
	const td = new TextDecoder();
	return td.decode.bind(td);
})();

export const encode = (() => {
	const te = new TextEncoder();
	return te.encode.bind(te);
})();

export function createAdvance(): Advance {
	return { offsetForArguments: 0, offsetForReturnArguments: 0 };
}

export function printToBin(builder: Builder) {
	const len = builder.foot();
	const target = new Uint8Array(len);
	const advance = createAdvance();
	const len2 = builder.comp(target, 0, advance);
	return { len, len2, advance, target };
}
