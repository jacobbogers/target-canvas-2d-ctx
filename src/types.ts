export type Advance = {
	offsetForArguments: number;
	offsetForReturnArguments: number;
};
// composite types
export type OIDType = 0x88;
export type NullType = 0x00;
export type SequenceType = 0x80;

// scalars
export type OptionalType = 0x50;
export type StringValuetype = 0x10;
export type IntValueType = 0x20;
export type BoolType = 0x30 | 0x31;
export type FloatType = 0x44 | 0x48;
export type UbyteValueType = 0x60;

export type AllBinTypes =
	| OIDType
	| NullType
	| StringValuetype
	| IntValueType
	| BoolType
	| FloatType
	| OptionalType
	| UbyteValueType
	| SequenceType;

