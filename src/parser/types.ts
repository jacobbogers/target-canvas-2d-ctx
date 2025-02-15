export type ASTWalkerOptions = {
	retainParents: boolean;
	showLocations: boolean;
};

export interface ASTWalker {
	enter(): void;
	leave(): void;
}
export interface Parser {
	parse(data: Uint8Array, offset?: number, length?: number): Parser;
	walk(handler: ASTWalker, options: ASTWalkerOptions): Parser;
}

export type TerminalTypeNameMapToJS = {
	'skip': undefined;
	'float32': number;
	'float64': number;
	'intN': number;
	'boolean': boolean;
	'string': string;
	'ubyte': Uint8Array;
};

export type TerminalTypeName = keyof TerminalTypeNameMapToJS;

export type JSType<Key extends TerminalTypeName> = TerminalTypeNameMapToJS[Key];

export type AstTerminal<T extends TerminalTypeName> = {
	type: T;
	range?: Range;
	value: JSType<T>;
}

type Range = {
	start: number;
	end?: number;
}

export type AstSkip = AstTerminal<'skip'>;
export type AstOptionalUnion<T extends TerminalTypeName> = AstTerminal<T> | AstSkip;

export type AstNested = AstStructure | AstTerminal<TerminalTypeName>;

export type AstStructure = {
	type: 'structure';
	range?: Range;
	children: AstNested[];
	parent?: AstStructure;
}

export type AstOid = {
	type: 'oid';
	range?: Range;
	value: [AstOptionalUnion<'ubyte'>, AstOptionalUnion<'ubyte'>];
	children?: AstNested[];
}

export type AstNull = {
	type: 'null';
	range?: Range;
	children?: AstNested[];
}

export interface StructuredWalkerPrototype {
	skip(): void;
	getCurrentBytePosition(): number;
}
export interface Walker {
	enterOid?(this: StructuredWalkerPrototype, struct: AstOid): void;
	enterStructure?(this: StructuredWalkerPrototype, struct: AstStructure, parent: AstStructure | AstOid | AstNull, nesting: number): void;
	leaveStructure?(this: WalkerPrototype, struct: AstStructure, parent: AstStructure | AstOid | AstNull, nesting: number): void;
	enterNull?(this: WalkerPrototype, value: AstNull): void;
	leaveNull?(this: WalkerPrototype, value: AstNull): void;
	enterOid?(this: WalkerPrototype, value: AstOid, parent?: AstStructure | AstOid | AstNull, nesting?: number): void;
	leaveOid?(this: WalkerPrototype, value: AstOid, parent?: AstStructure | AstOid | AstNull, nesting?: number): void;
	enterFloat?(this: WalkerPrototype, value: AstTerminal<'float32' | 'float64'>, parent?: AstStructure | AstOid | AstNull, nesting?: number): void;
	enterIntN?(this: WalkerPrototype, value: AstTerminal<'intN'>, parent?: AstStructure | AstOid | AstNull, nesting?: number): void;
	enterBoolean?(this: WalkerPrototype, value: AstTerminal<'boolean'>, parent?: AstStructure | AstOid | AstNull, nesting?: number): void;
	enterString?(this: WalkerPrototype, value: AstTerminal<'string'>, parent?: AstStructure | AstOid | AstNull, nesting?: number): void;
	enterUbyte?(this: WalkerPrototype, value: AstTerminal<'string'>, parent?: AstStructure | AstOid | AstNull, nesting?: number): void;
}
// Parent is structure (object or nullist)
// Elt -> Elt -> Parent -> Elt
//                  |
//                  > Elt -> Elt -> Elt


