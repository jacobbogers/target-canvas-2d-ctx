import type {
	Advance,
	BoolType,
	FloatType,
	IntValueType,
	NullType,
	OIDType,
	OptionalType,
	SequenceType,
	StringValuetype,
	UbyteValueType,
} from '../types';

export type OIDArgument = {
	valueType: OIDType;
	value: number; // length of the OID in binary
};

export type NullArgument = {
	valueType: NullType;
	value: number; // length of the payload in binary
};


export type StringArgument = {
	valueType: StringValuetype;
	value: Uint8Array;
};

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
	valueType: BoolType;
};

export type FloatArgument = {
	valueType: FloatType;
	value: number;
};

export type OptionalArgument = {
	valueType: OptionalType;
};

export type UbyteArgument = {
	valueType: UbyteValueType;
	value: Uint8Array;
};

export type ObjectArgument = {
	valueType: SequenceType;
	value: number;
};

export type InputArguments =
	| OIDArgument
	| ObjectArgument
	| UbyteArgument
	| OptionalArgument
	| FloatArgument
	| BoolArgument
	| NullArgument
	| IntArgument
	| StringArgument;

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
