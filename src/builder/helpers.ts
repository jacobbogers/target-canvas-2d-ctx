import type { Advance } from '../types';

// ints are always stored 2's complement so need to add one 1 bit extra for footprint
export function intFootprint(u: number): number {
	if (Math.trunc(u) === 0) {
		return 1;
	}
	const adj = u > 0 ? u + 1 : u;
	return Math.ceil((1 + Math.log2(Math.abs(adj))) / 8);
}

export function setFloat32(
	u: number,
	buffer: Uint8Array,
	offset: number,
	advance: Advance,
) {
	buffer[offset] = 0x44;
	const dv = new DataView(buffer.buffer, offset + 1);
	dv.setFloat32(0, u, true);
	advance.offsetForArguments += 5;
	return 5;
}

export function setFloat64(
	u: number,
	buffer: Uint8Array,
	offset: number,
	advance: Advance,
) {
	buffer[offset] = 0x48;
	const dv = new DataView(buffer.buffer, offset + 1);
	dv.setFloat64(0, u, true);
	advance.offsetForArguments += 9;
	return 9;
}

export function setInt(
	type: 0x20 | 0x10 | 0x60,
	u: number,
	buffer: Uint8Array,
	offset: number,
	advance: Advance,
): number {
	const fp = intFootprint(u);
	// if (fp > 6) {
	//    return setFloat32(u, buffer, offset, advance);
	// }
	const maxPositiveTwosComplement = 2 ** (fp * 8);
	const p =
		u < 0
			? // u = max2Compl - p
				// p = max2Compl - u
				maxPositiveTwosComplement + u
			: u;
	// bit shifting with ints bigger then 32 bits is not possible in js
	buffer[offset] = type + fp;
	let np = p;
	for (let i = 0; i < fp; i++) {
		const b = np % 256;
		np = (np - b) / 256;
		buffer[offset + i + 1] = b;
	}
	advance.offsetForArguments += fp + 1;
	return fp + 1;
}

export function getInt(
	buffer: Uint8Array,
	offset: number,
	advance: Advance,
): number {
	const footPrint = buffer[offset] & 0x0f;
	let answer = 0;
	let power = 1;
	for (let i = 0; i < footPrint; i++) {
		answer += buffer[offset + i + 1] * power;
		power *= 256;
	}
	const max2Compl = 2 ** (footPrint * 8 - 1) - 1;
	// u = max2Compl - p
	// p = max2Compl - u
	advance.offsetForReturnArguments += 1 + footPrint;
	return max2Compl > answer ? answer : max2Compl - answer;
}
