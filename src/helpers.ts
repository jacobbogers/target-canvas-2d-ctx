// reads intBool, int8, int16, int32 and int64 to js number (wich is a float64)

const { decode } = new TextDecoder();
const { encode } = new TextEncoder();

const EmptyUint8 = new Uint8Array(0);

// there is really no difference between
export function getFloat32Or64Bit(data: Uint8Array, offset: number): number {
	const nrBytes = data[offset] & 0x0f;
	const method = nrBytes === 8 ? 'getFloat64' : 'getFloat32';
	// need to natively detect floats but this is good for now
	return new DataView(data.buffer, offset, nrBytes)[method](0, true);
}

export function getUint8Array(data: Uint8Array, offset: number): Uint8Array {
	const nrLengthBytes = getLength(data, offset) as number;
	if (nrLengthBytes === 0) {
		return EmptyUint8;
	}
	return data.slice(offset, offset + nrLengthBytes);
}

export function getString(data: Uint8Array, offset: number): string {
	//   - string 0x10 (0 last nummble means emoty string) (includes nr of lengthbytes)  0x11-0x18
	const nrLengthBytes = getLength(data, offset) as number;
	if (nrLengthBytes === 0) {
		return '';
	}
	return decode(data.slice(offset + 1, offset + 1 + nrLengthBytes));
}

export function getBool(data: Uint8Array, offset: number): boolean {
	return (data[offset + 1] & 0x01) === 1;
}

export function littleEndian2Int(
	data: Uint8Array,
	offset: number,
	numBytes: number,
): number {
	let value = 0;
	switch (numBytes) {
		// biome-ignore lint/suspicious/noFallthroughSwitchClause: <explanation>
		case 4:
			value += data[offset + 3] << 24;
			value += data[offset + 2] << 16;
		// biome-ignore lint/suspicious/noFallthroughSwitchClause: <explanation>
		case 2:
			value += data[offset + 1] << 8;
		// biome-ignore lint/suspicious/noFallthroughSwitchClause: <explanation>
		case 1:
			value += data[offset];
		// case 0:
		default:
	}
	return value;
}

export function getLength(
	data: Uint8Array,
	offset: number
): number {
	const numBytes = (data[offset] & 0x0f);
	let value = 0;
	for (let i = 0; i < numBytes; i++) {
		value += (data[offset + i + 1] << (i << 3));
	}
	return value;
}

export function setLength(
	value: number,
	data: Uint8Array,
	offset: number,
): number {
	const numBytes = Math.ceil(Math.ceil(Math.log2(value)) / 8);
	let _value = value;
	data[offset] |= numBytes; // adjust the type
	let count = 0;
	while (count < numBytes) {
		data[offset + 1 + count] = _value & 0xff;
		// for next round
		_value >>= 8;
		count++;
	}
	return numBytes + 1;
}
