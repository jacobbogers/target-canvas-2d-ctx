export type Advance = {
	offsetForArguments: number;
	offsetForReturnArguments: number;
};

export type OIDType = 0x03;
export type NullSansPayloadType = 0x00;
export type NullWithPayloadStartType = 0x01;
export type NullWithPayloadEndType = 0x02;
export type OptionalType = 0x50;
export type SequenceStartType = 0x80;
export type SequenceEndType = 0x81;

export type NonRedactedTypes =
	| OIDType
	| NullSansPayloadType
	| NullWithPayloadStartType
	| NullWithPayloadEndType
	| OptionalType
	| SequenceStartType
	| SequenceEndType;

export type StringValuetype = 0x11 | 0x12 | 0x13 | 0x14;
export type IntValueType = 0x21 | 0x22 | 0x23 | 0x24 | 0x25 | 0x26;
export type BoolType = 0x30 | 0x31;
export type FloatType = 0x44 | 0x48;
export type UbyteValueType = 0x61 | 0x62 | 0x63 | 0x64;

export type AllBinTypes =
	| OIDType
	| NullSansPayloadType
	| NullWithPayloadStartType
	| NullWithPayloadEndType
	| StringValuetype
	| IntValueType
	| BoolType
	| FloatType
	| OptionalType
	| UbyteValueType
	| SequenceStartType
	| SequenceEndType;
