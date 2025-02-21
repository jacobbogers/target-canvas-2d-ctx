export type Advance = {
	offsetForArguments: number;
	offsetForReturnArguments: number;
	pathParentTypes?: (OIDType | ObjectType | NullType)[];
	error?: {
		code: number;
		range: Range;
	};
};

// composite types
export type OIDType = 0x88;
export type NullType = 0x00;
export type ObjectType = 0x80;

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
	| ObjectType
	//
	| OptionalType
	| StringType
	| IntType
	| BoolType
	| Float32Type
	| Float64Type
	| UbyteType;

export interface Parser {
	parse: (data: Uint8Array, offset?: number, length?: number) => ASTRoot;
	// add new memory to the parsing, (added memory does not have to be continues, with previously added memory)
	merge: (data: Uint8Array, offset?: number, length?: number) => void;
}

export type TerminalTypeNameMapToJS = {
	skip: never;
	float32: number;
	float64: number;
	intN: number;
	boolean: boolean;
	string: string;
	ubyte: Uint8Array;
};

type Range = {
	start: number;
	end: number;
};

export type TerminalTypeName = keyof TerminalTypeNameMapToJS;

export type JSType<Key extends TerminalTypeName> = TerminalTypeNameMapToJS[Key];

export type ASTTerminal<T extends TerminalTypeName> = {
	type: T;
	range: Range;
	value?: T extends 'skip' ? never : JSType<T>;
};

export type ASTOptionalTerminal<T extends TerminalTypeName> =
	| ASTTerminal<T>
	| ASTTerminal<'skip'>;
export type ASTStructured = ASTNull | ASTOid | ASTObject;
export type ASTNested = ASTStructured | ASTOptionalTerminal<TerminalTypeName>;
export type ASTParent = Required<ASTRoot | ASTStructured>;

export interface ASTCore {
	range: Range;
	children?: ASTNested[]; // omitted if it is an empty object/structure
}

export interface ASTObject extends ASTCore {
	type: 'object';
}

export interface ASTOid extends ASTCore {
	type: 'oid';
	value: [ASTOptionalTerminal<'ubyte'>, ASTOptionalTerminal<'ubyte'>];
}

export interface ASTNull extends ASTCore {
	type: 'null';
}

export interface ASTRoot extends ASTCore {
	type: 'root';
	range: Range;
	children: (ASTStructured | ASTTerminal<TerminalTypeName>)[];
}

export type ErrorNumType = 1024 | 1025;
