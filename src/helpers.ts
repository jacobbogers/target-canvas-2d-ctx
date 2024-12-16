const decode = (() => {
	const td = new TextDecoder();
	return td.decode.bind(td);
})();

const encode = (() => {
	const te = new TextEncoder();
	return te.encode.bind(te);
})();


const EmptyUint8 = new Uint8Array(0);

// decoders
// decoders
// decoders

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
	return decode(data.slice(offset + 2, offset + 2 + nrLengthBytes));
}

export function getBool(data: Uint8Array, offset: number): boolean {
	return (data[offset + 1] & 0x01) === 1;
}

// encoders
// encoders
// encoders

export function setString(value: string, data: Uint8Array, offset: number, maxLen: number): number {
	const bin = encode(value);
	const numBytesForLength = Math.ceil(Math.ceil(Math.log2(bin.byteLength)) / 8);
	const footPrint = 1 + numBytesForLength + bin.byteLength
	if (footPrint > maxLen){
		data[offset] = 0x10;
		return 1;
	}
	data[offset] = 0x10;
	const skip = setLength(numBytesForLength, data, offset);
	data.set(bin, offset+ skip);
	return footPrint;
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
