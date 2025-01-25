import type {
	NullSansPayloadType,
	NullWithPayloadEndType,
	NullWithPayloadStartType,
	OIDType,
	OptionalType,
	SequenceEndType,
	SequenceStartType,
} from './types';

export const baseUrlMatcher =
	/^data\:image\/(?<type>[A-Za-z]+)[,;]+base64,(?<imgData>.*)$/;

export const oidTypeVal: OIDType = 0x03;
export const nullSansPayloadTypVal: NullSansPayloadType = 0x00;
export const nullWithPayloadStartTypVal: NullWithPayloadStartType = 0x01;
export const nullWithPayloadEndTypVal: NullWithPayloadEndType = 0x02;
export const optionalTypeVal: OptionalType = 0x50;
export const sequenceStartTypeVal: SequenceStartType = 0x80;
export const sequenceEndTypeVal: SequenceEndType = 0x81;
