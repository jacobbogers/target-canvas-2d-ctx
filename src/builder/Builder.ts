import type { Advance } from "../types";
import { encode } from '../helpers';

export type NullArgument = {
    valueType: 0x00;
};

export type NullWithPayloadArgument = {
    valueType: 0x01;
    value: Exclude<Exclude<InputArguments, NullWithPayloadArgument>, NullArgument>;
};

export type StringValuetype = 0x10 | 0x11 | 0x12 | 0x13 | 0x14;

export type StringArgument = {
    valueType: StringValuetype;
    value: Uint8Array;
}

export type IntValueType = 0x21 | 0x22 | 0x23 | 0x24;

export type IntArgument = {
    // this mapping gives negative or positive numbers between -4.2 and + 4.2 billion
    //      0x20 boolean false  0x30 (boolean true)
    //      0x21 1 byte      (-128, 127)
    //      0x22 2 bytes     (-32768, 32767)
    //      0x23 3 bytes     (-8388608, 8388607)
    //      0x24 4 bytes     (-2147483648, 2147483647)   
    // this means we go from negative
    valueType: IntValueType;
    value: number;
}

export type BoolArgument = {
    valueType: 0x30 | 0x31;
}

export type FloatArgument = {
    valueType: 0x44 | 0x48;
    value: number;
}

export type OptionalArgument = {
    valueType: 0x50;
}

export type UbyteValueType = 0x61 | 0x62 | 0x63 | 0x64;

export type UbyteArgument = {
    valueType: UbyteValueType;
    value: Uint8Array;
}

export type ObjectArgument = {
    valueType: 0x80;
    value: InputArguments[];
}

export type InputArguments =
    ObjectArgument |
    UbyteArgument |
    OptionalArgument |
    FloatArgument |
    BoolArgument |
    NullArgument |
    NullWithPayloadArgument |
    IntArgument |
    StringArgument;

export type InputArgumentsSansNullPayload = Exclude<Exclude<InputArguments, NullWithPayloadArgument>, NullArgument>


export interface Builder {
    i(v: number): Builder;
    s(s: string): Builder;
}

export function lengthStorage(v: number): number {
    return Math.ceil(Math.log2(v) / 8);
}


/**
 * 
Exmaple:
var r = () => Math.random()*256;
var ta = new Uint8Array(6).map(r);
// -> Uint8Array(6) [ 161, 0, 86, 223, 237, 16 ];
// since second part is 6-4 = 2 => 16 bites we get this 
ta.reduceRight((c,v,i)=> { return c + v*(256**(i)); },0);
// -> 18613840248993
var maxPos48Bit = 2**(48-1)-1
// -> 140737488355327
var final = maxPos48Bit-uint
// -> -36285341232401

 * 
 * 
 */

// ints are always stored 2's complement so need to add one 1 bit extra for footprint
export function intFootprint(u: number): number {
    return Math.ceil((1 + Math.log2(Math.abs(u))) / 8);
}

export function setFloat32(u: number, buffer: Uint8Array, offset: number, advance: Advance) {
    buffer[offset] = 0x44;
    const dv = new DataView(buffer.buffer, offset + 1);
    dv.setFloat32(0, u, true);
    advance.offsetForArguments += 5;
}

export function setInt(u: number, buffer: Uint8Array, offset: number, advance: Advance) {
    const fp = intFootprint(u);
    if (u > 6) {
        setFloat32(u, buffer, offset, advance);
        return;
    }
    const maxPositiveTwosComplement = 2 ** (fp * 8 - 1) - 1;
    const p = (u < 0) ?
        // u = max2Compl - p
        // p = max2Compl - u
        maxPositiveTwosComplement - u :
        u;
    // bit shifting with ints bigger then 32 bits is not possible in js 
    buffer[offset] = 0x20 + fp;
    let np = p;
    for (let i = 0; i < fp; i++) {
        const b = np % 256;
        np = (np - b) / 256;
        buffer[offset + i + 1] = b;
    }
    advance.offsetForArguments += fp + 1;
}

export function getInt(buffer: Uint8Array, offset: number, advance: Advance): number {
    const footPrint = buffer[offset] & 0x0f;
    let answer = 0;
    for (let i = 0; i < footPrint; i++) {
        answer += buffer[offset + i + 1];
        answer *= 256;
    }
    const max2Compl = 2 ** (footPrint * 8 - 1) - 1;
    // u = max2Compl - p
    // p = max2Compl - u
    advance.offsetForReturnArguments += 1 + footPrint;
    return max2Compl > answer ? answer : max2Compl - answer;
}



export function createBuilder() {
    const instructions: InputArguments[] = [];

    function clear() {
        instructions.splice(0);
    }

    function storeInt(n: number) {
        const fp = intFootprint(n);
        const valueType: 0x44 | IntValueType = fp > 6 ? 0x44 : (0x20 + fp) as IntValueType;
        const instr: FloatArgument | IntArgument = {
            value: n,
            valueType,
        };
        instructions.push(instr);
        return rc;
    }

    function storeBool(b: boolean) {
        instructions.push({
            valueType: b ? 0x30 : 0X31,
        });
    }

    function storeNull(payload?: InputArgumentsSansNullPayload) {
        const input: NullArgument |
            NullWithPayloadArgument = payload ? {
                valueType: 0x01,
                value: payload,
            } : {
                valueType: 0x00,
            }
        instructions.push(input);
    }

    function storeObject(payload: InputArguments[]) {
        const input: ObjectArgument = {
            valueType: 0x80,
            value: payload,
        };
        instructions.push(input);
    }

    function storeString(payload: string) {
        const ubytes = encode(payload);
        const fp = intFootprint(ubytes.byteLength);
        if (fp > 4) {
            throw new RangeError('string length bigger then 2Gig');
        }
        instructions.push({
            valueType: 0x10 + fp as StringValuetype,
            value: ubytes,
        });
        return rc;
    }

    function storeFloat32(value: number) {
        instructions.push({
            value,
            valueType: 0x44,
        });
    }

    function storeFloat64(value: number) {
        instructions.push({
            value,
            valueType: 0x48,
        })
    }

    function storeSkip() {
        instructions.push({
            valueType: 0x50,
        });
    }

    function storeUbyte(value: Uint8Array) {
        const fp = intFootprint(value.byteLength);
        if (fp > 4) {
            throw new RangeError('Uint8Array length bigger then 2Gig');
        }
        instructions.push({
            valueType: 0x60 + fp as UbyteValueType,
            value,
        });
    }

    const map = {
        i: storeInt,
        s: storeString,
    };

    // function names
    const handler: ProxyHandler<Record<never, never>> = {
        get(target, p: keyof typeof map, receiver) {
            return map[p];
        }
    }

    const rc = new Proxy(Object.create(null), handler) as Builder;
    return rc;
}

