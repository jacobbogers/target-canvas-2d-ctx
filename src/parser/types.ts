import type {
	OIDType,
	NullSansPayloadType,
	NullWithPayloadStartType,
	NullWithPayloadEndType,
	OptionalType,
	SequenceStartType,
	SequenceEndType,
	NonRedactedTypes,
} from '../types';

export type StringRedactedType = 0x10;
export type IntRedactedType = 0x20;
export type BoolRedactedType = 0x30;
export type FloatRedactedType = 0x40;
export type UbyteRedactedType = 0x60;

export type RedactedTypes =
	| StringRedactedType
	| IntRedactedType
	| BoolRedactedType
	| FloatRedactedType
	| UbyteRedactedType;

export type AllBinTypes =
	NonRedactedTypes
	| RedactedTypes;

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
