import type { Advance } from '../types';
import { encode } from '../helpers';
import type {
    Builder,
    FloatArgument,
    InputArguments,
    IntArgument,
    IntValueType,
    StringValuetype,
    UbyteValueType,
} from './types';
import { intFootprint, setFloat32, setFloat64, setInt } from './helpers';

export default function createBuilder() {
    const instructions: InputArguments[] = [];
    let inNullPayloadMode = false; // cannot nest nullWithPayloadArguments so its only true or false
    let inObjectPayloadMode = 0; // you can have multiple levels of nested object hence this is a counter
    // 0 = no oid this could be a fragment
    // 1 = oid is used but not finalized, cant embed other oids
    // 2 = oid is used and finalized
    let iodMarked = 0; // 0 = no oid this could be a fragment


    function clear() {
        instructions.splice(0);
        inNullPayloadMode = false;
        inObjectPayloadMode = 0;
        iodMarked = 0;
        return rc;
    }

    function storeInt(n: number) {
        const fp = intFootprint(n);
        const valueType: 0x44 | IntValueType =
            fp > 6 ? 0x44 : ((0x20 + fp) as IntValueType);
        const instr: FloatArgument | IntArgument = {
            value: n,
            valueType,
        };
        instructions.push(instr);
        return rc;
    }

    function storeBool(b: boolean) {
        instructions.push({
            valueType: b ? 0x30 : 0x31,
        });
        return rc;
    }

    function storeNull(fn?: (builder: Builder) => void) {
        if (inNullPayloadMode) {
            clear();
            throw new TypeError('"null payloads" cannot contain other nulls or "null payloads"');
        }
        if (!fn) {
            instructions.push({
                valueType: 0x00,
            });
            return rc;
        }


        inNullPayloadMode = true;
        const beforeLastEntry = instructions.length - 1;
        fn(rc);
        const nextLastEntry = instructions.length - 1;
        if (beforeLastEntry === nextLastEntry) { // nothing was added so this is just a null without a payload
            instructions.push({
                valueType: 0x00,
            });
            inNullPayloadMode = false;
            return rc;
        }
        // array is enlarged if copy moves a block forward
        instructions.length += 1;
        instructions.copyWithin(beforeLastEntry + 2, beforeLastEntry + 1);
        instructions[beforeLastEntry + 1] = {
            valueType: 0x01,
        }
        // closure
        instructions.push({
            valueType: 0x02,
        });
        inNullPayloadMode = false;
        return rc;
    }


    function storeObject(fn?: (builder: Builder) => void) {
        instructions.push({
            valueType: 0x80,
        });
        if (!fn) {
            instructions.push({
                valueType: 0x81,
            });
            return rc;
        }
        inObjectPayloadMode += 1;
        fn(rc);
        inObjectPayloadMode -= 1;
        instructions.push({
            valueType: 0x81,
        });
        return rc;
    }

    function storeString(payload: string) {
        const ubytes = encode(payload);
        const fp = intFootprint(ubytes.byteLength);
        if (fp > 4) {
            clear();
            throw new RangeError('string length bigger then 2Gig');
        }
        instructions.push({
            valueType: (0x10 + fp) as StringValuetype,
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
            clear();
            throw new RangeError('Uint8Array length bigger then 2Gig');
        }
        instructions.push({
            valueType: (0x60 + fp) as UbyteValueType,
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
                case 0x81:
                    count += 1;
                    break;
                case 0x00:
                case 0x01:
                case 0x02:
                    count += 1;
                    break;
                // string or ubyte
                case 0x11:
                case 0x12:
                case 0x13:
                case 0x14:
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
                    clear();
                    throw new TypeError(`undefined type: ${JSON.stringify(command)}`);
            }
        }
        return count;
    }

    function startFootPrint(): number {
        return footPrint(instructions);
    }

    function compile(
        commands: InputArguments[],
        buffer: Uint8Array,
        offset: number,
        advance: Advance = {
            offsetForArguments: 0,
            offsetForReturnArguments: 0,
        },
    ): number {
        let csr = offset;
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            switch (command.valueType) {
                case 0x81:
                case 0x80:
                    buffer[csr] = command.valueType;
                    advance.offsetForArguments += 1;
                    csr += 1;
                    break;
                case 0x02:
                case 0x01:
                case 0x00:
                    advance.offsetForArguments += 1;
                    buffer[csr] = command.valueType;
                    csr += 1;
                    break;
                // string or ubyte
                case 0x11:
                case 0x12:
                case 0x13:
                case 0x14:
                case 0x61:
                case 0x62:
                case 0x63:
                case 0x64:
                    csr += setInt(
                        (command.valueType & 0xf0) as 0x10 | 0x60,
                        command.value.byteLength,
                        buffer,
                        csr,
                        advance,
                    );
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
                    throw new TypeError(`undefined type: ${JSON.stringify(command)}`);
            }
        }
        return csr;
    }

    function compileInit(
        buffer: Uint8Array,
        offset = 0,
        advance?: Advance,
    ): number {
        return compile(instructions, buffer, offset, advance);
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
        debug: getAllInstructions,
        foot: startFootPrint,
        comp: compileInit,
        clear: clear,
    };

    // function names
    const handler: ProxyHandler<Record<never, never>> = {
        get(target, p: keyof typeof map, receiver) {
            return map[p];
        },
    };

    const rc = new Proxy(Object.create(null), handler) as Builder;
    return rc;
}
