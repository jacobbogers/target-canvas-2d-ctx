import type { Advance, AllBinTypes } from '../types';
import { getType } from './helpers';
import type { Parser } from './types';
import {
    oidTypeVal,
    nullSansPayloadTypVal,
    nullWithPayloadStartTypVal,
    nullWithPayloadEndTypVal,
    optionalTypeVal,
    sequenceStartTypeVal,
    sequenceEndTypeVal,
} from '../constants';

import {
    stringRedactedTypeVal,
    intRedactedTypeVal,
    boolRedactedTypeVal,
    flatRedactedTypeVal,
    ubyteRedactedTypeVal,
} from './constants';

export default function createParser(
    buf: Uint8Array,
    rootOffset: number,
    rootEnd?: number,
): Parser {
    let parseStarted = true;
    const csrEnd = rootEnd ?? buf.byteLength;

    function parseStart(
        start: number,
        end?: number,
        advance: Advance = {
            offsetForArguments: 0,
            offsetForReturnArguments: 0,
        },
    ): Parser {
        let csr = start;
        while (csr < csrEnd) {
            const rawType = buf[csr];
            const binType = getType(rawType as AllBinTypes);
            // check first for non redacted types
            // after we check redacted types,
            //      redacted types only check the high nibble bytes of a type (0xf0 mask)
            //  this checking  order avoids future type ambiguity processing
            switch (binType) {
                case oidTypeVal:
                    break;
                case nullSansPayloadTypVal:
                    break;
                case nullWithPayloadStartTypVal:
                    break;
                case nullWithPayloadEndTypVal:
                    break;
                case optionalTypeVal:
                    break;
                case sequenceStartTypeVal:
                    break;
                case sequenceEndTypeVal:
                    break;
                // now check for redacted types
                case stringRedactedTypeVal:
                    break;
                case intRedactedTypeVal:
                    break;
                case boolRedactedTypeVal:
                    break;
                case flatRedactedTypeVal:
                    break;
                case ubyteRedactedTypeVal:
                    break;
            }
        }
        return rc;
    }

    const map = {
        parse: parseStart,
    };

    type KeyOfMap = keyof typeof map;

    // function names
    const handler: ProxyHandler<Record<never, never>> = {
        get(target, p: KeyOfMap, receiver) {
            return map[p];
        },
    };
    const rc = new Proxy(Object.create(null), handler) as Parser;
    return rc;
}
