import { EMPTY_UBYTE, redactedMask, ubyteTypeVal } from '../constants';
import { decode } from '../helpers';
import ParseError from '../ParseError';
import type {
	Advance,
	ASTNull,
	ASTObject,
	ASTOid,
	ASTTerminal,
} from '../types';

export function getFloat32Or64(buffer: Uint8Array, advance: Advance): number {
	const type = buffer[advance.offsetForReturnArguments];
	const dv = new DataView(buffer.buffer, advance.offsetForReturnArguments + 1);
	if (type === 0x44 || type === 0x48) {
		advance.offsetForReturnArguments += type === 0x44 ? 5 : 9;
		return type === 0x44 ? dv.getFloat32(0, true) : dv.getFloat64(0, true);
	}
	throw new SyntaxError(`float is not correct type: 0x${type.toString(16)}`);
}

export function getString(buffer: Uint8Array, advance: Advance): string {
	const asBin = getUbyte(buffer, advance);
	return decode(asBin);
}

function getBoolean(buffer: Uint8Array, advance: Advance): boolean {
	const value = (buffer[advance.offsetForReturnArguments] & 0x01) === 1;
	advance.offsetForReturnArguments++;
	return value;
}

export function getInt(buffer: Uint8Array, advance: Advance): number {
	const footPrint = buffer[advance.offsetForReturnArguments] & 0x07;
	if (footPrint === 0) {
		advance.offsetForReturnArguments += 1;
		return 0;
	}
	let answer = 0;
	let power = 1;
	for (let i = 0; i < footPrint; i++) {
		answer += buffer[advance.offsetForReturnArguments + i + 1] * power;
		power *= 256;
	}
	const max2Compl = 2 ** (footPrint * 8 - 1) - 1;
	const border = 2 ** (footPrint * 8);
	advance.offsetForReturnArguments += 1 + footPrint;
	return max2Compl >= answer ? answer : answer - border;
}

export function getUbyte(buffer: Uint8Array, advance: Advance): Uint8Array {
	const byteLength = getInt(buffer, advance);
	if (byteLength > buffer.byteLength - advance.offsetForReturnArguments) {
		// signal a specific Error for Ubyte, maybe transfer meta info to "Advance"
		throw new RangeError('Size of Ubyte type exceeds un parsed memory');
	}
	const b =
		byteLength === 0
			? EMPTY_UBYTE
			: buffer.slice(
					advance.offsetForReturnArguments,
					advance.offsetForReturnArguments + byteLength,
				);
	advance.offsetForReturnArguments += byteLength;
	return b;
}

export function readOptionalFragment(
	data: Uint8Array,
	advance: Advance,
): ASTTerminal<'skip'> {
	advance.offsetForReturnArguments++;
	return {
		type: 'skip',
		range: {
			start: advance.offsetForReturnArguments - 1,
			end: advance.offsetForReturnArguments,
		},
	};
}

export function readFloat32Or64Fragment(
	data: Uint8Array,
	advance: Advance,
): ASTTerminal<'float32' | 'float64'> {
	const start = advance.offsetForReturnArguments;
	const value = getFloat32Or64(data, advance);
	const type = data[start] === 0x44 ? 'float32' : 'float64';
	return {
		type,
		range: {
			start,
			end: advance.offsetForReturnArguments,
		},
		value,
	};
}

export function readStringFragment(
	data: Uint8Array,
	advance: Advance,
): ASTTerminal<'string'> {
	const start = advance.offsetForReturnArguments;
	const value = getString(data, advance);
	return {
		type: 'string',
		value,
		range: {
			start,
			end: advance.offsetForReturnArguments,
		},
	};
}

export function readBooleanFragment(
	data: Uint8Array,
	advance: Advance,
): ASTTerminal<'boolean'> {
	const start = advance.offsetForReturnArguments;
	const value = getBoolean(data, advance);
	return {
		type: 'boolean',
		value,
		range: {
			start,
			end: advance.offsetForReturnArguments,
		},
	};
}

export function readIntFragment(
	data: Uint8Array,
	advance: Advance,
): ASTTerminal<'intN'> {
	const start = advance.offsetForReturnArguments;
	const value = getInt(data, advance);
	return {
		type: 'intN',
		value,
		range: {
			start,
			end: advance.offsetForReturnArguments,
		},
	};
}

export function readUbyteFragment(
	data: Uint8Array,
	advance: Advance,
): ASTTerminal<'ubyte'> {
	const rootStart = advance.offsetForReturnArguments;
	const value = getUbyte(data, advance);
	return {
		type: 'ubyte',
		range: {
			start: rootStart,
			end: advance.offsetForReturnArguments,
		},
		value,
	};
}

export function readNullOrObjectFragment(
	type: 'null' | 'object',
	data: Uint8Array,
	advance: Advance,
): ASTNull | ASTObject {
	const rootStart = advance.offsetForReturnArguments;
	const aggregateSize = getInt(data, advance);
	return {
		type,
		range: {
			start: rootStart,
			end: advance.offsetForReturnArguments + aggregateSize,
		},
		...(aggregateSize > 0 && { children: [] }),
	};
}

export function readOIDFragment(data: Uint8Array, advance: Advance): ASTOid {
	const rootStart = advance.offsetForReturnArguments;
	const aggregateSize = getInt(data, advance);
	const footPrintOidSize = advance.offsetForReturnArguments - rootStart;
	const callOidType = data[advance.offsetForReturnArguments] & redactedMask;
	// ubyte
	if (callOidType !== ubyteTypeVal) {
		throw new ParseError(1024); // no valid type found
	}
	const wpCOS = advance.offsetForReturnArguments;
	const astCOS: ASTTerminal<'ubyte'> = readUbyteFragment(data, advance);

	const returnOidType = data[advance.offsetForReturnArguments] & redactedMask;
	// ubyte
	if (returnOidType !== ubyteTypeVal) {
		throw new ParseError(1024); // 'Oid Error, no Oid or Optional placeholder found',
	}
	const astROS: ASTTerminal<'ubyte'> = readUbyteFragment(data, advance);
	advance.offsetForReturnArguments =
		rootStart + aggregateSize + footPrintOidSize;
	return {
		type: 'oid',
		value: [astCOS, astROS],
		range: {
			start: rootStart,
			end: rootStart + aggregateSize + footPrintOidSize,
		},
		children: [], // payload of the oid
	};
}
