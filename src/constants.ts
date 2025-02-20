import type {
	OIDType,
	NullType,
	OptionalType,
	StringType,
	IntType,
	BoolType,
	Float32Type,
	Float64Type,
	UbyteType,
	ObjectType,
} from './types';

export const baseUrlMatcher =
	/^data\:image\/(?<type>[A-Za-z]+)[,;]+base64,(?<imgData>.*)$/;

export const EMPTY_UBYTE = new Uint8Array();

// composites
export const oidTypeVal: OIDType = 136;
export const nullTypVal: NullType = 0x00 as const;
export const objectTypeVal: ObjectType = 0x80;

export const optionalTypeVal: OptionalType = 0x50;
export const stringTypeVal: StringType = 0x10;
export const intTypeVal: IntType = 0x20;
export const boolTypeVal: BoolType = 0x30;
export const float32TypeVal: Float32Type = 0x44;
export const float64TypeVal: Float64Type = 0x48;
export const ubyteTypeVal: UbyteType = 0x60;

// masks
export const redactedMask = 0xf8;
