import { intTypeVal, oidTypeVal, optionalTypeVal, redactedMask, ubyteTypeVal } from '../constants';
import { createAdvance } from '../helpers';
import type { Advance, AllBinTypes, ASTOid, ASTParent, ASTRoot, Parser } from '../types';
import { readIntFragment, readOIDFragment } from './helpers';



export default function createParser(): Parser {

    const root: ASTRoot = {
        type: 'root',
        range: {
            start: 0,
            end: 0,
        },
        children: [],
    };

    function parse(data: Uint8Array, limit: number, parent: ASTParent, advance: Advance): void {
        for (; ;) {
            if (advance.offsetForReturnArguments === limit) {
                if (parent === root) {
                    root.range.end = advance.offsetForReturnArguments;
                }
                return;
            }
            if (advance.offsetForReturnArguments > limit) {
                throw new RangeError(`advanced beyond specified position limit: ${limit}`);
            }
            const valType = data[advance.offsetForReturnArguments] & redactedMask as AllBinTypes;
            switch (valType) {
                case oidTypeVal:
                    {
                        const ast = readOIDFragment(data, advance);
                        // get the last oid
                        const payLoadOffset = ast.value[1].range.end;
                        // ast.parent = parent;
                        parent.children.push(ast);
                        // yield oid enter
                        if (payLoadOffset !== ast.range.end) {
                            const advanceForChild = structuredClone(advance);
                            advanceForChild.offsetForReturnArguments = payLoadOffset;
                            parse(data, ast.range.end, ast as ASTParent, advanceForChild);
                            // yield oid leave
                        }
                    }
                    break;
                case intTypeVal:
                    {
                        const ast = readIntFragment(data, advance);
                        // ast.parent = parent;
                        parent.children.push(ast);
                    }
                    break;
            }
        }
    }


    function parseStart(data: Uint8Array, offset?: number, limit?: number): ASTRoot {
        const maxLen = limit ?? data.byteLength;
        const csr = offset ?? 0;
        root.range.start = 0;
        root.range.end = -1;
        root.children.splice(0);
        const advance = createAdvance()
        advance.offsetForReturnArguments = csr;
        parse(data, maxLen, root as ASTParent, advance);
        return root;
    }

    // instruction map for the js Proxy object
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
