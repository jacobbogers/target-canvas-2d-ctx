import type { Advance } from "../types";
import { encode } from "../helpers";
import type {
    Builder,
    FloatArgument,
    InputArguments,
    InputArgumentsSansNullPayload,
    IntArgument,
    IntValueType,
    NullArgument,
    NullWithPayloadArgument,
    ObjectArgumentStart,
    StringValuetype,
    UbyteValueType
} from "./types";
import { intFootprint, setFloat32, setFloat64, setInt } from "./helpers";

export default function createBuilder() {
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

    function compile(commands: InputArguments[], buffer: Uint8Array, offset: number, advance: Advance = {
        offsetForArguments: 0,
        offsetForReturnArguments: 0
    }): number {
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
                    csr += setInt((command.valueType & 0xf0) as 0x10 | 0x60, command.value.byteLength, buffer, csr, advance);
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
                    csr += setInt(0x20, command.value, buffer, csr, advance);
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

