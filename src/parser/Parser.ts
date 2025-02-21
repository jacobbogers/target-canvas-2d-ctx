import {
	boolTypeVal,
	intTypeVal,
	nullTypeVal,
	objectTypeVal,
	oidTypeVal,
	optionalTypeVal,
	redactedMask,
	stringTypeVal,
	ubyteTypeVal,
} from '../constants';
import { createAdvance } from '../helpers';
import type {
	Advance,
	AllBinTypes,
	ASTParent,
	ASTRoot,
	Parser,
} from '../types';
import {
	readBooleanFragment,
	readFloat32Or64Fragment,
	readIntFragment,
	readNullOrObjectFragment,
	readOIDFragment,
	readOptionalFragment,
	readStringFragment,
	readUbyteFragment,
} from './helpers';

export default function createParser(): Parser {
	const root: ASTRoot = {
		type: 'root',
		range: {
			start: 0,
			end: 0,
		},
		children: [],
	};

	function parse(
		data: Uint8Array,
		limit: number,
		parent: ASTParent,
		advance: Advance,
	): void {
		for (;;) {
			if (advance.offsetForReturnArguments === limit) {
				if (parent === root) {
					root.range.end = advance.offsetForReturnArguments;
				}
				return;
			}
			if (advance.offsetForReturnArguments > limit) {
				throw new RangeError(
					`advanced beyond specified position limit: ${limit}`,
				);
			}
			const valType =
				data[advance.offsetForReturnArguments] & (redactedMask as AllBinTypes);
			switch (valType) {
				case objectTypeVal:
					{
						const start = advance.offsetForReturnArguments;
						const ast = readNullOrObjectFragment('object', data, advance);
						// advance is NOT moved to the end of the null structure
						const startPayload = advance.offsetForReturnArguments;
						const endPayload = ast.range.end;
						parent.children.push(ast);
						// yield null enter
						// do we have a payload?
						if (endPayload > startPayload) {
							parse(data, ast.range.end, ast as ASTParent, advance);
							// yield null leave
						}
					}
					break;
				case nullTypeVal:
					{
						const start = advance.offsetForReturnArguments;
						const ast = readNullOrObjectFragment('null', data, advance);
						// advance is NOT moved to the end of the null structure
						const startPayload = advance.offsetForReturnArguments;
						const endPayload = ast.range.end;
						parent.children.push(ast);
						// yield null enter
						// do we have a payload?
						if (endPayload > startPayload) {
							parse(data, ast.range.end, ast as ASTParent, advance);
							// yield null leave
						}
					}
					break;
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
				case optionalTypeVal:
					{
						const ast = readOptionalFragment(data, advance);
						parent.children.push(ast);
					}
					break;
				case stringTypeVal:
					{
						const ast = readStringFragment(data, advance);
						parent.children.push(ast);
					}
					break;
				case intTypeVal:
					{
						const ast = readIntFragment(data, advance);
						parent.children.push(ast);
					}
					break;
				case boolTypeVal:
					{
						const ast = readBooleanFragment(data, advance);
						parent.children.push(ast);
					}
					break;
				case 0x40:
				case 0x48:
					{
						const ast = readFloat32Or64Fragment(data, advance);
						parent.children.push(ast);
					}
					break;
				case ubyteTypeVal:
					{
						const ast = readUbyteFragment(data, advance);
						parent.children.push(ast);
					}
					break;
				default:
					throw new SyntaxError(`unknown type: 0x${valType.toString(16)}`);
			}
		}
	}

	function parseStart(
		data: Uint8Array,
		offset?: number,
		limit?: number,
	): ASTRoot {
		const maxLen = limit ?? data.byteLength;
		const csr = offset ?? 0;
		root.range.start = 0;
		root.range.end = -1;
		root.children.splice(0);
		const advance = createAdvance();
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
