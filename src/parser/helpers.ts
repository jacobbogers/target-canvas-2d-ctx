import { EMPTY_UBYTE, redactedMask, ubyteTypeVal } from "../constants";
import { advanceByAndReturn } from "../helpers";
import ParseError from "../ParseError";
import type { Advance, ASTOid, ASTTerminal } from "../types";


export function getInt(
    buffer: Uint8Array,
    advance: Advance,
): number {
    const footPrint = buffer[advance.offsetForReturnArguments] & 0x07;
    if (footPrint === 0) {
        advance.offsetForReturnArguments += 1;
        return 0;
    }
    let answer = 0;
    let power = 1;
    for (let i = 0; i < footPrint; i++) {
        answer += buffer[advance.offsetForReturnArguments + i + 1] * power;
        power *= 256;
    }
    const max2Compl = 2 ** (footPrint * 8 - 1) - 1;
    const border = 2 ** (footPrint * 8);
    advance.offsetForReturnArguments += 1 + footPrint;
    return max2Compl >= answer ? answer : answer - border;
}


export function getUbyte(
    buffer: Uint8Array,
    advance: Advance,
): Uint8Array {
    const byteLength = getInt(buffer, advance);
    if (byteLength > (buffer.byteLength - advance.offsetForReturnArguments)) {
        // signal a specific Error for Ubyte, maybe transfer meta info to "Advance"
        throw new RangeError('Size of Ubyte type exceeds un parsed memory');
    }
    const b = buffer.slice(advance.offsetForReturnArguments, advance.offsetForReturnArguments + byteLength);
    advance.offsetForReturnArguments += byteLength;
    return b;
}

export function readIntFragment(data: Uint8Array, advance: Advance): ASTTerminal<'intN'> {
    const start = advance.offsetForReturnArguments;
    const value = getInt(data, advance);
    return {
        type: 'intN',
        value,
        range: {
            start,
            end: advance.offsetForReturnArguments
        },
    };
}


export function readOIDFragment(data: Uint8Array, advance: Advance): ASTOid {
    const rootStart = advance.offsetForReturnArguments;
    const aggregateSize = getInt(data, advance);
    const footPrintOidSize = advance.offsetForReturnArguments - rootStart;
    const callOidType = data[advance.offsetForReturnArguments] & redactedMask;
    // ubyte
    if (callOidType !== ubyteTypeVal) {
        throw new ParseError(1024); // no valid type found
    }
    const wpCOS = advance.offsetForReturnArguments;
    const callOidSignature = (callOidType === ubyteTypeVal) ? getUbyte(data, advance) : advanceByAndReturn(advance, EMPTY_UBYTE);

    const astCOS: ASTTerminal<'ubyte'> = {
        type: 'ubyte',
        range: {
            start: wpCOS,
            end: advance.offsetForReturnArguments,
        },
        value: callOidSignature,
    };

    const returnOidType = data[advance.offsetForReturnArguments] & redactedMask;
    // ubyte
    if (returnOidType !== ubyteTypeVal) {
        throw new ParseError(1024); // no valid type found
    }
    const wpROS = advance.offsetForReturnArguments;
    const returnOidSignature = (returnOidType === ubyteTypeVal) ? getUbyte(data, advance) : advanceByAndReturn(advance, EMPTY_UBYTE);
    const astROS: ASTTerminal<'ubyte'> = {
        type: 'ubyte',
        range: {
            start: wpROS,
            end: advance.offsetForReturnArguments,
        },
        value: returnOidSignature,
    };
    advance.offsetForReturnArguments = rootStart + aggregateSize + footPrintOidSize;
    return {
        type: 'oid',
        value: [astCOS, astROS],
        range: {
            start: rootStart,
            end: rootStart + aggregateSize + footPrintOidSize
        },
        children: [], // payload of the oid
    };
}

