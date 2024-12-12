// reads intBool, int8, int16, int32 and int64 to js number (wich is a float64)

const { decode } = new TextDecoder();
const { encode } = new TextEncoder();

const EmptyUint8 = new Uint8Array(0);

// there is really no difference between 
export function getFloat32Or64Bit(data: Uint8Array, offset: number): number {
    const nrBytes = data[offset] & 0x0f;
    const method = nrBytes === 8 ? 'getFloat64' : 'getFloat32'
    // need to natively detect floats but this is good for now
    return new DataView(data.buffer, offset, nrBytes)[method](0, true);
}

export function getUint8Array(data: Uint8Array, offset: number): Uint8Array {
    const nrLengthBytes = getInt(data, offset) as number;
    if (nrLengthBytes === 0) {
        return EmptyUint8;
    }
    return data.slice(offset, offset + nrLengthBytes);
}

export function getString(data: Uint8Array, offset: number): string {
    //   - string 0x10 (0 last nummble means emoty string) (includes nr of lengthbytes)  0x11-0x18  
    const nrLengthBytes = getInt(data, offset) as number;
    if (nrLengthBytes === 0) {
        return '';
    }
    return decode(data.slice(offset + 1, offset + 1 + nrLengthBytes));
}

export function getBool(data: Uint8Array, offset: number): boolean {
    return (data[offset + 1] & 0x01) === 1;
}

export function littleEndian2Int(data: Uint8Array, offset: number, numBytes: number): number {
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

export function getInt(data: Uint8Array, offset: number): number | bigint {
    // we already know the high nibble of data[ofst] is 0x2
    switch (data[offset] & 0xf) {
        case 8:
            {
                const high = BigInt(littleEndian2Int(data, offset + 1 + 4, 4)) << 32n;
                const low = BigInt(littleEndian2Int(data, offset + 1, 4));
                return high + low;
            }
        case 4:
            return littleEndian2Int(data, offset + 1, 4);
        case 2:
            return littleEndian2Int(data, offset + 1, 2);
        case 1:
            return littleEndian2Int(data, offset + 1, 2);
        // case 0:
        default:

    }
    return 0;
}

export function setInt32(value: number, data: Uint8Array, offset: number): number {
    data[offset] = 0x24; // int32 data type marker
    data[offset + 1] = value & 0xff;
    data[offset + 2] = (value >> 8) & 0xff;
    data[offset + 3] = (value >> 16) & 0xff;
    data[offset + 4] = (value >> 24) & 0xff;
    return 5;
}

export function setLength(value: number, data: Uint8Array, offset: number): number {
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
