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
export type StringType = 0x10;
export type IntType = 0x20;
export type BoolType = 0x30;
export type Float32Type = 0x44;
export type Float64Type = 0x48;
export type UbyteType = 0x60;

export type AllBinTypes =
	| OIDType
	| NullType
	| StringType
	| IntType
	| BoolType
	| Float32Type
	| Float64Type
	| OptionalType
	| UbyteType
	| SequenceType;

