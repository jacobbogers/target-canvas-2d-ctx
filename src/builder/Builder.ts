import type {
	Advance,
} from '../types';
import { encode } from '../helpers';
import type {
	Builder,
	FloatArgument,
	InputArguments,
	IntArgument,
	NullArgument,
	ObjectArgument,
	UbyteArgument,
	OIDArgument,
	UpToThreeDigitNumberString,
} from './types';
import { intFootprint, setFloat32, setFloat64, setInt } from './helpers';
import { nullTypVal, oidTypeVal, sequenceTypeVal, boolTypeVal, stringTypeVal, ubyteTypeVal } from '../constants';

export default function createBuilder() {
	const instructions: InputArguments[] = [];
	let inNullPayloadMode = false; // cannot nest nullWithPayloadArguments so its only true or false
	let inObjectPayloadMode = 0; // you can have multiple levels of nested object hence this is a counter
	// 0 = no oid this could be a fragment
	// 1 = oid is used but not finalized, cant embed other oids
	// 2 = oid is used and finalized
	let iodMarked = false; // 0 = no oid this could be a fragment
	// oid mode

	function clear() {
		instructions.splice(0);
		inNullPayloadMode = false;
		inObjectPayloadMode = 0;
		iodMarked = false;
		return rc;
	}

	function storeInt(n: number) {
		const fp = intFootprint(n);
		const valueType: 0x44 | 0x20 =
			fp > 6 ? 0x44 : 0x20;
		const instr: FloatArgument | IntArgument = {
			value: n,
			valueType,
		};
		instructions.push(instr);
		return rc;
	}

	function storeBool(b: boolean) {
		instructions.push({
			valueType: 0x30,
			value: b,
		});
		return rc;
	}

	// it is impossible to call this function when inNullPayloadMode = true,
	// this prevents embedding a null struct into another null struct
	function storeNull(fn?: (builder: Builder) => void) {
		const nullInstr: NullArgument = {
			valueType: 0x00,
			value: 0,
		};
		instructions.push(nullInstr);
		const beforeLastEntry = instructions.length - 1;
		inNullPayloadMode = true;
		if (fn) { // no payload
			fn(rc);
		}
		nullInstr.value = instructions.length - beforeLastEntry;
		inNullPayloadMode = false;
		return rc;
	}

	// storeObjects mode prevents command functions being called
	function storeObject(fn?: (builder: Builder) => void) {
		const obj: ObjectArgument = {
			valueType: 0x80,
			value: 0,
		};
		instructions.push(obj);
		inObjectPayloadMode += 1;
		const beforeLastEntry = instructions.length - 1;
		if (fn) {
			fn(rc);
		}
		inObjectPayloadMode -= 1;
		obj.value = instructions.length - beforeLastEntry
		return rc;
	}
	// store strings
	function storeString(payload: string) {
		const ubytes = encode(payload);
		const fp = intFootprint(ubytes.byteLength);
		if (fp > 4) {
			clear();
			throw new RangeError('string length larger then 2.1Gig');
		}
		instructions.push({
			valueType: 0x10,
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
			throw new RangeError('Uint8Array length bigger then 2.1Gig');
		}
		instructions.push({
			valueType: 0x60,
			value,
		});
		return rc;
	}

	function getAllInstructions(): InputArguments[] {
		return structuredClone(instructions);
	}

	function footPrint(commands: InputArguments[]): number {
		let byteCount = 0;
		let i = 0
		for (i = 0; i < commands.length;) {
			const command: InputArguments = commands[i];
			switch (command.valueType) {
				case oidTypeVal:
				case sequenceTypeVal:
				case nullTypVal:
					{
						const fp = footPrint(commands.slice(i + 1, i + command.value));
						const fpInt = intFootprint(fp);
						byteCount += 1 + fpInt + fp;
						i += command.value;
					}
					break;
				// string or ubyte
				case stringTypeVal:
				case ubyteTypeVal:
					{
						const fp = command.value.byteLength;
						const fpInt = intFootprint(fp);
						byteCount += 1 + fpInt + fp;
						i++;
					}
					break;
				// boolean
				case 0x30:
					byteCount += 1;
					i++;
					break;
				// integer
				case 0x20:
					byteCount += 1 + intFootprint(command.value);
					i++;
					break;
				// skip	
				case 0x50:
					byteCount += 1;
					i++;
					break;
				case 0x44:
					byteCount += 1 + 4;
					i++;
					break;
				case 0x48:
					byteCount += 1 + 8;
					i++;
					break;
				default:
					clear();
					throw new TypeError(`undefined type: ${JSON.stringify(command)}`);
			}
		}
		return byteCount;
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
		let byteCount = 0
		let i = 0;
		for (i = 0; i < commands.length;) {
			const command = commands[i];
			buffer[csr] = command.valueType;
			switch (command.valueType) {
				case oidTypeVal:
				case sequenceTypeVal:
				case nullTypVal:
					{
						const fragment = commands.slice(i + 1, i + command.value)
						const fp = footPrint(fragment);
						const fpInt = intFootprint(fp);
						setInt(command.valueType, fp, buffer, csr, advance);
						csr += fpInt + 1;
						const newCursorPos = compile(fragment, buffer, csr, advance);
						csr = newCursorPos;
						i += 1 + command.value;
					}
					break;
				case boolTypeVal:
					buffer[csr] = command.valueType;
					if (command.value) {
						buffer[csr] = (command.valueType | 1);
					}
					csr++;
					advance.offsetForArguments += 1;
					byteCount++;
					i++;
					break;
				// string or ubyte array
				case 0x60:
				case 0x10:
					{
						// sum of type and length value
						const intBytes = setInt(command.valueType, command.value.byteLength, buffer, csr, advance);
						if (intBytes > 1) {
							buffer.set(command.value, csr + intBytes);
							advance.offsetForArguments += command.value.byteLength;
						}
						csr += command.value.byteLength + intBytes;
						i++;
					}
					break;
				// integer
				case 0x20:
					csr += setInt(0x20, command.value, buffer, csr, advance);
					i++;
					break;
				// optional, skip
				case 0x50:
					buffer[csr] = 0x50;
					csr += 1;
					advance.offsetForArguments += 1;
					i++;
					break;
				case 0x44:
				case 0x48:
					{
						const callSpec = command.valueType === 0x44 ? setFloat32 : setFloat64;
						csr += callSpec(command.value, buffer, csr, advance);
						i++;
						break;
					}
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

	// 0 = no oid this could be a fragment
	// 1 = oid is used but not finalized, cant embed other oids
	// 2 = oid is used and finalized
	/*
	rules:
		1. function with no forward paylaod and no return payload  (like function doit(): void; )
		2. function with forward payload but no return (like function(a:number, b: string): void)
		3. function with no forward payload but has return payload (like function(): string )
		4. function with forward payload AND return payload (like function(a: number): string)
	*/
	function callOid(...callOids: UpToThreeDigitNumberString[]) {
		return function rcOid(...returnOids: UpToThreeDigitNumberString[]) {
			if (callOids.length === 0 && returnOids.length === 0) {
				throw new TypeError('Must at least specify call Oid or/and return Oid');
			}
			const callOidInts = callOids
				.map((s) => Number.parseInt(s, 10)).filter(Number.isFinite); // runtime protection for non ts coders
			const rcOidInts = returnOids
				.map((s) => Number.parseInt(s, 10)).filter(Number.isFinite); // runtime protection for non ts coders
			const errMsg = '":fn Oid" has invalid sequence must be in range [0,255]'
			if (callOidInts.length !== callOids.length) {
				throw new TypeError(
					errMsg.replace(':fn', 'call')
				);
			}
			if (rcOidInts.length !== returnOids.length) {
				throw new TypeError(
					errMsg.replace(':fn', 'return')
				);
			}
			const oidEntry: OIDArgument = { valueType: 0x88, value: 0 };
			instructions.push(oidEntry);
			const beforeLastEntry = instructions.length - 1;
			instructions.push({ valueType: 0x60, value: Uint8Array.from(callOidInts) });
			instructions.push({ valueType: 0x60, value: Uint8Array.from(returnOids) });
			iodMarked = true;
			// we are in the clear
			return function useBuilder(fn?: (buid: Builder) => void) {
				if (fn) {
					fn(rc);
				}
				iodMarked = false;
				oidEntry.value += instructions.length - beforeLastEntry
				return rc;
			};
		};
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
		oid: callOid,
	};

	type KeyOfMap = keyof typeof map;

	function isBlocked(command: KeyOfMap) {
		const blockList: Partial<Record<KeyOfMap, boolean>> = {};
		if (inNullPayloadMode) {
			blockList.n = true;
		}
		if (iodMarked) {
			blockList.oid = true;
		}
		if (inNullPayloadMode || inObjectPayloadMode || iodMarked) {
			blockList.clear = true;
			blockList.comp = true;
			blockList.foot = true;
		}
		if (command in blockList) {
			return true;
		}
		return false;
	}



	// function names
	const handler: ProxyHandler<Record<never, never>> = {
		get(target, p: KeyOfMap, receiver) {
			if (isBlocked(p)) {
				return undefined;
			}
			return map[p];
		},
	};

	const rc = new Proxy(Object.create(null), handler) as Builder;
	return rc;
}
