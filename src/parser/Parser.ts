import type { Advance } from '../types';
import type { Parser } from './types';

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
        while (csr < csrEnd) { }
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
