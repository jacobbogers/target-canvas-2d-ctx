import type {
	Advance,
	IntValueType,
	StringValuetype,
	UbyteValueType,
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
	UpToThreeDigitNumberString,
} from './types';
import { intFootprint, setFloat32, setFloat64, setInt } from './helpers';
import { isNull } from 'node:util';

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

	// it is impossible to call this function when inNullPayloadMode = true,
	// this prevents embedding a null struct into another null struct
	function storeNull(fn?: (builder: Builder) => void) {
		const nullInstr: NullArgument = {
			valueType: 0x00,
			value: 0, // we dont know the value yet of the null body if any
		};
		instructions.push(nullInstr);
		if (!fn) { // no payload
			return rc;
		}
		const beforeLastEntry = instructions.length - 1;
		inNullPayloadMode = true;
		fn(rc);
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
		if (!fn) {
			return rc;
		}
		inObjectPayloadMode += 1;
		const beforeLastEntry = instructions.length - 1;
		fn(rc);
		inObjectPayloadMode -= 1;
		beforeLastEntry === instructions.length - beforeLastEntry
		return rc;
	}
	// store strings
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
				case 0x03:
					count += 1;
					break;
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
				case 0x03:
					buffer[csr] = command.valueType;
					advance.offsetForArguments += 1;
					csr += 1;
					break;
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

	// 0 = no oid this could be a fragment
	// 1 = oid is used but not finalized, cant embed other oids
	// 2 = oid is used and finalized
	/*
	rules:
		1. function with no forward paylaod or return payload  (like function doit(): void; )
		2. function with forward payload but no return (like function(a:number, b: string): void)
		3. function with no forward payload but has return payload (like function(): string )
		4. function with forward payload AND return payload (like function(a: number): string)
	*/
	function createOid(...oids: UpToThreeDigitNumberString[]): Builder {
		if (iodMarked === true) {
			throw new TypeError("Oid body not finalized, cannot embed other oid's");
		}
		if (oids.length === 0) {
			throw new TypeError('No oid argument specified');
		}
		const oidsAsInts = oids
			.map((s) => Number.parseInt(s, 10))
			.filter(Number.isFinite); // runtime protection for non ts coders
		if (oidsAsInts.length === 0) {
			throw new TypeError(
				'oid valid arguments are STRINGS up to 3 digits (max "255") "0", "1", ..."255"',
			);
		}
		iodMarked = true;
		// typecast to number

		// is there a return oid
		// multiple '0' values are possible but the first one is a devider
		const idx = oidsAsInts.indexOf(0);
		const call = idx < 0 ? oidsAsInts.slice(0) : oidsAsInts.slice(0, idx);
		const response = idx < 0 ? [] : oidsAsInts.slice(idx + 1);

		// they cannot both be zero length
		if (call.length === 0 && response.length === 0) {
			iodMarked = false;
			throw new TypeError('specify a forward oid and/or backward oid');
		}
		instructions.push({
			valueType: 0x03,
		});
		storeUbyte(Uint8Array.from(call));
		storeUbyte(Uint8Array.from(response));
		if (call.length === 0) {
			return endOid();
		}
		return storeInt(0); // marker for bodysize, to be changed later
	}

	function endOid(): Builder {
		if (iodMarked === false) {
			throw new Error('Trying to end an Oid body without starting one');
		}
		iodMarked = false;
		const lastOidUsedPos = instructions.findLastIndex(
			(command) => command.valueType === 0x03,
		);
		const callOid = instructions[lastOidUsedPos + 1] as UbyteArgument;
		if (callOid.value.length === 0) {
			// there is no payload
			return rc;
		}
		const fp = footPrint(instructions.slice(lastOidUsedPos + 4));
		(instructions[lastOidUsedPos + 3] as IntArgument).value = fp;
		return rc;
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
		oid: createOid,
		oidE: endOid,
	};

	const mapWhenNull = {
		i: storeInt,
		s: storeString,
		b: storeBool,
		f32: storeFloat32,
		f64: storeFloat64,
		skip: storeSkip,
		buf: storeUbyte,
		obj: storeObject,
		debug: getAllInstructions,
		oid: createOid,
		oidE: endOid,
	}

	const mapNoCommands = {
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
		oid: createOid,
		oidE: endOid,
	};

	type KeyOfMap = keyof typeof map;
	type KeyOfmapWhenNull = keyof typeof mapWhenNull;
	type KeyOfmapNoCommands = keyof typeof mapNoCommands;

	// function names
	const handler: ProxyHandler<Record<never, never>> = {
		get(target, p: unknown, receiver) {
			if (inNullPayloadMode) {
				return mapWhenNull[p as KeyOfmapWhenNull];
			}
			if (inObjectPayloadMode) {
				return mapNoCommands[p as KeyOfmapNoCommands];
			}
			return map[p as KeyOfMap];
		},
	};

	const rc = new Proxy(Object.create(null), handler) as Builder;
	return rc;
}
