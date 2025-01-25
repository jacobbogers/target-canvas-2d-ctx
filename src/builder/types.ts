import type { Advance } from '../types';

export type OIDArgument = {
	valueType: 0x03; // start Oid sequence,
};

export type NullArgument = {
	valueType: 0x00;
};

export type NullWithPayloadArgumentValue = Exclude<
	Exclude<InputArguments, NullWithPayloadArgumentStart>,
	NullArgument
>;

export type NullWithPayloadArgumentStart = {
	valueType: 0x01;
};

export type NullWithPayloadArgumentEnd = {
	valueType: 0x02;
};

export type StringValuetype = 0x11 | 0x12 | 0x13 | 0x14;

export type StringArgument = {
	valueType: StringValuetype;
	value: Uint8Array;
};

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
};

export type BoolArgument = {
	valueType: 0x30 | 0x31;
};

export type FloatArgument = {
	valueType: 0x44 | 0x48;
	value: number;
};

export type OptionalArgument = {
	valueType: 0x50;
};

export type UbyteValueType = 0x61 | 0x62 | 0x63 | 0x64;

export type UbyteArgument = {
	valueType: UbyteValueType;
	value: Uint8Array;
};

export type ObjectArgumentEnd = {
	valueType: 0x81;
};

export type ObjectArgumentStart = {
	valueType: 0x80;
};

export type InputArguments =
	| OIDArgument
	| ObjectArgumentStart
	| ObjectArgumentEnd
	| UbyteArgument
	| OptionalArgument
	| FloatArgument
	| BoolArgument
	| NullArgument
	| NullWithPayloadArgumentStart
	| NullWithPayloadArgumentEnd
	| IntArgument
	| StringArgument;

export type InputArgumentsSansNullPayload = Exclude<
	Exclude<InputArguments, NullWithPayloadArgumentStart>,
	NullArgument
>;

export type UpToTwo = 0 | 1 | 2;
export type UpToFour = UpToTwo | 3 | 4;
export type UptoFive = UpToFour | 5;
export type Digit = UptoFive | 6 | 7 | 8 | 9;
export type NonZeroDigit = Exclude<Digit, 0>;

export type UpToThreeDigitNumberString =
	| `${Digit}`
	| `${NonZeroDigit}${Digit}`
	| `${UpToTwo}${UpToFour}${Digit}`
	| `${UpToTwo}${UptoFive}${UptoFive}`;

export interface Builder {
	n(fn?: (builder: Builder) => void): Builder;
	s(s: string): Builder;
	i(v: number): Builder;
	b(b: boolean): Builder;
	f32(n: number): Builder;
	f64(n: number): Builder;
	skip(): Builder;
	buf(v: Uint8Array): Builder;
	obj(fn?: (builder: Builder) => void): Builder;
	debug(): InputArguments[];
	foot(): number;
	comp(buffer: Uint8Array, offset?: number, advance?: Advance): number;
	clear(): Builder;
	oid: (...d: UpToThreeDigitNumberString[]) => Builder;
	oidE: () => Builder;
}

export type ASTWalkerOptions = {
	retainParents: boolean;
};

export interface ASTWalker {
	enter(): void;
	leave(): void;
}
export interface Parser {
	parse(data: Uint8Array): Parser;
	walk(handler: ASTWalker, options: ASTWalkerOptions): Parser;
}

export type Terminals = null | number | boolean | string | Uint8Array;
export type Structure = Array<Terminals>;
export type IndexDataType = Structure | Terminals;
export type Scope = 'null' | 'sequence';

export interface IndexedHandler {
	//scan(data: Uint8Array, offset?: number, maxlength?: number, advance?: Advance): number;
	enter: <T extends IndexDataType>(
		data: T,
		nesting: number,
		next: (stop?: boolean) => void,
	) => void;
	leave?: <T extends IndexDataType>(
		data: T,
		nesting: number,
		next: (stop?: boolean) => void,
	) => void;
}
// Parent is structure (object or nullist)
// Elt -> Elt -> Parent -> Elt
//                  |
//                  > Elt -> Elt -> Elt
//
//
