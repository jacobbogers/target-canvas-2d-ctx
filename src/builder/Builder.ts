import type { Advance } from "../types";

export const decode = (() => {
    const td = new TextDecoder();
    return td.decode.bind(td);
})();

export const encode = (() => {
    const te = new TextEncoder();
    return te.encode.bind(te);
})();


export const EmptyUint8 = new Uint8Array(0);

export type NullArgument = {
    valueType: 0x00;
};

export type NullWithPayloadArgumentValue = Exclude<Exclude<InputArguments, NullWithPayloadArgument>, NullArgument>;

export type NullWithPayloadArgument = {
    valueType: 0x01;
    value: NullWithPayloadArgumentValue[];
};

export type StringValuetype = 0x10 | 0x11 | 0x12 | 0x13 | 0x14;

export type StringArgument = {
    valueType: StringValuetype;
    value: Uint8Array;
}

export type IntValueType = 0x21 | 0x22 | 0x23 | 0x24 | 0x25 | 0x26;

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

export type UbyteValueType = 0x60 | 0x61 | 0x62 | 0x63 | 0x64;

export type UbyteArgument = {
    valueType: UbyteValueType;
    value: Uint8Array;
}

export type ObjectArgumentEnd = {
    valueType: 0x81;
}

export type ObjectArgumentStart = {
    valueType: 0x80;
    value: [...InputArguments[], ObjectArgumentEnd];
}

export type InputArguments =
    ObjectArgumentStart |
    ObjectArgumentEnd |
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
    n(payload?: InputArgumentsSansNullPayload[]): Builder;
    s(s: string): Builder;
    i(v: number): Builder;
    b(b: boolean): Builder;
    f32(n: number): Builder;
    f64(n: number): Builder;
    skip(): Builder;
    buf(v: Uint8Array): Builder;
    obj(payload: InputArguments[]): Builder;
    peek(): InputArguments[];
    foot(): number;
    comp(buffer: Uint8Array, offset: number, advance: Advance): number;
    clear(): Builder;
}

// ints are always stored 2's complement so need to add one 1 bit extra for footprint
export function intFootprint(u: number): number {
    if (Math.trunc(u) === 0) {
        return 1;
    }
    const adj = u > 0 ? u + 1 : u;
    return Math.ceil((1 + Math.log2(Math.abs(adj))) / 8);
}

export function setFloat32(u: number, buffer: Uint8Array, offset: number, advance: Advance) {
    buffer[offset] = 0x44;
    const dv = new DataView(buffer.buffer, offset + 1);
    dv.setFloat32(0, u, true);
    advance.offsetForArguments += 5;
    return 5;
}

export function setFloat64(u: number, buffer: Uint8Array, offset: number, advance: Advance) {
    buffer[offset] = 0x48;
    const dv = new DataView(buffer.buffer, offset + 1);
    dv.setFloat64(0, u, true);
    advance.offsetForArguments += 9;
    return 9;
}

export function setInt(u: number, buffer: Uint8Array, offset: number, advance: Advance): number {
    const fp = intFootprint(u);
    // if (fp > 6) {
    //    return setFloat32(u, buffer, offset, advance);
    // }
    const maxPositiveTwosComplement = 2 ** (fp * 8);
    const p = (u < 0) ?
        // u = max2Compl - p
        // p = max2Compl - u
        maxPositiveTwosComplement + u :
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
    return fp + 1;
}

export function getInt(buffer: Uint8Array, offset: number, advance: Advance): number {
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

export function createBuilder() {
    const instructions: InputArguments[] = [];

    function clear() {
        instructions.splice(0);
        return rc;
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
        return rc;
    }

    function storeNull(payload?: InputArgumentsSansNullPayload[]) {
        const input: NullArgument |
            NullWithPayloadArgument = payload ? {
                valueType: 0x01,
                value: payload,
            } : {
                valueType: 0x00,
            }
        instructions.push(input);
        return rc;
    }

    function storeObject(payload: InputArguments[]) {
        const input: ObjectArgumentStart = {
            valueType: 0x80,
            value: [...payload, { valueType: 0x81 }],
        };
        instructions.push(input);
        return rc;
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
        return rc;
    }

    function storeFloat64(value: number) {
        instructions.push({
            value,
            valueType: 0x48,
        });
        return rc;
    }

    function storeSkip() {
        instructions.push({
            valueType: 0x50,
        });
        return rc;
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
        return rc;
    }

    function getAllInstructions(): InputArguments[] {
        return structuredClone(instructions);
    }

    function footPrint(commands: InputArguments[]): number {
        let count = 0;
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            switch (command.valueType) {
                case 0x80:
                    count += 1 + footPrint(command.value);
                    break;
                case 0x00:
                    count += 1;
                    break;
                case 0x01:
                    count += 1 + footPrint(command.value);
                    break;
                // string or ubyte   
                case 0x10:
                case 0x11:
                case 0x12:
                case 0x13:
                case 0x14:
                case 0x60:
                case 0x61:
                case 0x62:
                case 0x63:
                case 0x64:
                    count += 1 + (command.valueType & 0x0f) + command.value.byteLength;
                    break;
                case 0x30:
                case 0x31:
                    count += 1;
                    break;
                // integer    
                case 0x21:
                case 0x22:
                case 0x23:
                case 0x24:
                case 0x25:
                case 0x26:
                    count += 1 + (command.valueType & 0x0f);
                    break;
                case 0x50:
                    count += 1;
                    break;
                case 0x44:
                    count += 1 + 4;
                    break;
                case 0x48:
                    count += 1 + 8;
                    break;
                default:
            }
        }
        return count;
    }

    function startFootPrint(): number {
        return footPrint(instructions);
    }

    function compile(commands: InputArguments[], buffer: Uint8Array, offset: number, advance: Advance): number {
        let csr = offset;
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            switch (command.valueType) {
                case 0x80:
                    buffer[csr] = 0x80;
                    advance.offsetForArguments += 1;
                    csr += 1;
                    csr += compile(command.value, buffer, csr, advance);
                    break;
                case 0x00:
                    advance.offsetForArguments += 1;
                    buffer[csr] = 0x00;
                    break;
                case 0x01:
                    buffer[csr] = 0x01;
                    advance.offsetForArguments += 1;
                    csr += 1;
                    csr += compile(command.value, buffer, csr, advance);
                    break;
                // string or ubyte   
                case 0x10:
                case 0x11:
                case 0x12:
                case 0x13:
                case 0x14:
                case 0x60:
                case 0x61:
                case 0x62:
                case 0x63:
                case 0x64:
                    buffer[csr++] = command.valueType;
                    csr += setInt(command.value.byteLength, buffer, csr, advance);
                    buffer.set(command.value, csr);
                    csr += command.value.byteLength;
                    advance.offsetForArguments = command.value.byteLength;
                    break;
                case 0x30:
                case 0x31:
                    buffer[csr] = command.valueType;
                    csr += 1;
                    advance.offsetForArguments += 1;
                    break;
                // integer    
                case 0x21:
                case 0x22:
                case 0x23:
                case 0x24:
                case 0x25:
                case 0x26:
                    csr += setInt(command.value, buffer, csr, advance);
                    break;
                // optional, skip    
                case 0x50:
                    buffer[offset + csr] = 0x50;
                    csr += 1;
                    advance.offsetForArguments = +1;
                    break;
                case 0x44:
                    csr += setFloat32(command.value, buffer, csr, advance);
                    break;
                case 0x48:
                    csr += setFloat64(command.value, buffer, csr, advance);
                    break;
                default:
            }
        }
        return csr;
    }

    function compileInit(buffer: Uint8Array, offset: number, advance: Advance): number {
        return compile(instructions, buffer, offset, advance,);
    }

    const map = {
        n: storeNull,
        i: storeInt,
        s: storeString,
        b: storeBool,
        f32: storeFloat32,
        f64: storeFloat64,
        skip: storeSkip,
        buf: storeUbyte,
        obj: storeObject,
        peek: getAllInstructions,
        foot: startFootPrint,
        comp: compileInit,
        clear: clear,
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

