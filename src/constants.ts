import { getFloat32Or64Bit, getInt, getString, getUint8Array, getBool } from "./helpers"

export const SKIP_VALUE = 5;
export const OBJECT_TYPE = 8;

export const decoderMap = {
    '1': getString,
    '2': getInt,
    '3': getBool,
    '4': getFloat32Or64Bit,
    // '5': skip , this value is blessed 
    '6': getUint8Array,
};

export const baseUrlMatcher = /^data\:image\/(?<type>webp)[,;]+(?<imgData>.*)$/;