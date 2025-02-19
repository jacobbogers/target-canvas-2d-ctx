import type {
	Advance,
	BoolType,
	Float32Type,
	Float64Type,
	IntType,
	NullType,
	OIDType,
	OptionalType,
	ObjectType,
	StringType,
	UbyteType,
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
	valueType: StringType;
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
	valueType: IntType;
	value: number;
};

export type BoolArgument = {
	valueType: BoolType;
	value: boolean;
};

export type FloatArgument = {
	valueType: Float32Type | Float64Type;
	value: number;
};

export type OptionalArgument = {
	valueType: OptionalType;
};

export type UbyteArgument = {
	valueType: UbyteType;
	value: Uint8Array;
};

export type ObjectArgument = {
	valueType: ObjectType;
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

export interface BuilderCommands {
	foot(): number;
	comp(buffer: Uint8Array, offset?: number, advance?: Advance): number;
	clear(): Builder;
}
export interface BuilderCore {
	n(fn?: (builder: Builder) => void): Builder;
	s(s: string): Builder;
	i(v: number): Builder;
	b(b: boolean): Builder;
	f32(n: number): Builder;
	f64(n: number): Builder;
	skip(): Builder;
	buf(v: Uint8Array): Builder;
	debug(): InputArguments[];
	obj(fn?: (builder: BuilderCore) => void): Builder;
}

export interface Builder extends BuilderCore, BuilderCommands {
	oid: (...callOids: UpToThreeDigitNumberString[]) => (...returnOids: UpToThreeDigitNumberString[]) => (fn?: (builder: BuilderCore) => void) => Builder;
}


