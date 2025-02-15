export const baseUrlMatcher =
	/^data\:image\/(?<type>[A-Za-z]+)[,;]+base64,(?<imgData>.*)$/;

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

// composites
export const oidTypeVal: OIDType = 136;
export const nullTypVal: NullType = 0x00 as const;
export const sequenceTypeVal: SequenceType = 0x80;

export const optionalTypeVal: OptionalType = 0x50;
export const stringTypeVal: StringType = 0x10;
export const intTypeVal: IntType = 0x20;
export const boolTypeVal: BoolType = 0x30;
export const float32TypeVal: Float32Type = 0x44;
export const float64TypeVal: Float64Type = 0x48;
export const ubyteTypeVal: UbyteType = 0x60;
