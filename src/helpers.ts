// reads intBool, int8, int16, int32 and int64 to js number (wich is a float64)

const { decode } = new TextDecoder();
const { encode } = new TextEncoder();

const EmptyUint8 = new Uint8Array(0);

// there is really no difference between 
export function getFloat32Or64Bit(data: Uint8Array, offset: number): number {
    const nrBytes = data[offset] & 0x0f;
    const method = nrBytes === 8 ? 'getFloat64' : 'getFloat32'
    // need to natively detect floats but this is good for now
    return new DataView(data.buffer, offset, nrBytes )[method](0, true);
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
     if (nrLengthBytes=== 0) {
        return '';
     }
     return decode(data.slice(offset + 1, offset + 1 + nrLengthBytes));
}

export function getBool(data: Uint8Array, offset: number): boolean {
    return (data[offset + 1] & 0x01) === 1;
}

export function littleEndian2Int(data: Uint8Array, offset: number, numBytes: number): number {
    let value = 0;
    switch(numBytes) {
        case 4:
            value += data[offset + 3] << 24;
            value += data[offset + 2] << 16;
        case 2:
            value += data[offset + 1] << 8;
        case 1:
            value +=  data[offset];
        case 0:
        default:    
    }
    return value;
}

export function getInt(data: Uint8Array, offset: number): number | bigint  {
    // we already know the high nibble of data[ofst] is 0x2
    switch(data[offset] & 0xf) {
        case 8:
            const high = BigInt(littleEndian2Int(data, offset + 1 + 4, 4)) << 32n;
            const low =  BigInt(littleEndian2Int(data, offset + 1 , 4));
            return high + low; 
        case 4:
            return littleEndian2Int(data, offset + 1, 4);
        case 2:
            return littleEndian2Int(data, offset + 1, 2);
        case 1:
            return  littleEndian2Int(data, offset + 1, 2);
        case 0:
        default:
              
    }
    return 0;
}

export function setInt(data: Uint8Array, offset: number): number | bigint  {
    // we already know the high nibble of data[ofst] is 0x2
    switch(data[offset] & 0xf) {
        case 8:
            const high = BigInt(littleEndian2Int(data, offset + 1 + 4, 4)) << 32n;
            const low =  BigInt(littleEndian2Int(data, offset + 1 , 4));
            return high + low; 
        case 4:
            return littleEndian2Int(data, offset + 1, 4);
        case 2:
            return littleEndian2Int(data, offset + 1, 2);
        case 1:
            return  littleEndian2Int(data, offset + 1, 2);
        case 0:
        default:
              
    }
    return 0;
}

