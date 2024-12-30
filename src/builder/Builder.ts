import { off } from "node:process";
import { Advance } from "../types";

export type NullArgument = {
    valueType: 0x00;
};

export type NullWithPayloadArgument<T extends Exclude<InputArguments, NullWithPayloadArgument> = StringArgument> = {
    valueType: 0x01;
    value: T;
};

export type StringArgument = {
    valueType: 0x10 | 0x11 | 0x12 | 0x13 | 0x14;
    value: string;
}

export type IntArgument = {
    // this mapping gives negative or positive numbers between -4.2 and + 4.2 billion
    //      0x20 boolean false  0x30 (boolean true)
    //      0x21 1 byte      (-128, 127)
    //      0x22 2 bytes     (-32768, 32767)
    //      0x23 3 bytes     (-8388608, 8388607)
    //      0x24 4 bytes     (-2147483648, 2147483647)
    //      0x25 5 bytes     0x35 (negative)
    //      0x26 6 bytes     0x36 (negative)
    //      0x27 7 bytes     0x37 (negative)  beyond safe integer
    //      0x28 8 bytes     0x38 (negative)  beyond safe integer
    // this means we go from negative
    valueType: 0x21 | 0x22 | 0x23 | 0x24 | 0x25 | 0x26 | 0x31 | 0x32 | 0x33 | 0x34 | 0x35 | 0x36;
    value: number;
}

export type BoolArgument = {
    valueType: 0x20 | 0x30;
}

export type FloatArgument = {
    valueType: 0x44 | 0x48;
    value: number;
}

export type OptionalArgument = {
    valueType: 0x50;
}

export type UbyteArgument = {
    valueType: 0x60 | 0x61 | 0x62 | 0x63 | 0x64;
    value: Uint8Array;
}

export type ObjectArgument<T extends Exclude<InputArguments, NullWithPayloadArgument> = StringArgument> = {
    valueType: 0x80;
    value: T;
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

export function storeFloat32(u: number, buffer: Uint8Array, offset: number, advance: Advance) {
    buffer[offset] = 0x44;
    const dv = new DataView(buffer.buffer, offset + 1);
    dv.setFloat32(0, u, true);
    advance.offsetForArguments += 5;
}

export function storeInt(u: number, buffer: Uint8Array, offset: number, advance: Advance) {
    const fp = intFootprint(u);
    if (u > 6) {
        storeFloat32(u, buffer, offset, advance);
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
    const dv = new DataView(new Uint8Array(8).buffer);
    dv.setBigUint64()
        * 
    const storage: InputArguments[] = [];
    function i(v: number): IntArgument {
        if (Number.isInteger(v))
            // throw
        }
    const numBytes = lengthStorage(Number(v));
    if (numBytes > 6) {
        if (numBytes <= 8) { //bigint or float32/float64
            if (typeof v === 'bigint') {
                return;
            }
        }
        // use float32/float64
    }
    // store as uint
    const commands =
    // function names
    //i(34234234).s('somestring').bf.bt.n.nps().npi().npf32().npf64().skip.byte(...).obs.obe.
    const handler: ProxyHandler<Record<never, never>> = {

    }
    return new Proxy(Object.create(null) as Record<never, never>, handler);
}