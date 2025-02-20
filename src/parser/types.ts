import type {
	ASTNull,
	ASTObject,
	ASTOid,
	ASTStructured,
	ASTTerminal,
} from '../types';

export interface WalkerPrototype {
	getCurrentBytePosition(): number;
}
export interface StructuredWalkerPrototype extends WalkerPrototype {
	skip(): void;
}
export interface Walker {
	// non terminals
	enterOid?(
		this: StructuredWalkerPrototype,
		struct: ASTOid,
		parent?: ASTStructured,
		nesting?: number,
	): void;
	leaveOid?(
		this: StructuredWalkerPrototype,
		struct: ASTOid,
		parent?: ASTStructured,
		nesting?: number,
	): void;
	enterObject?(
		this: StructuredWalkerPrototype,
		struct: ASTObject,
		parent?: ASTStructured,
		nesting?: number,
	): void;
	leaveObject?(
		this: StructuredWalkerPrototype,
		struct: ASTObject,
		parent?: ASTStructured,
		nesting?: number,
	): void;
	enterNull?(
		this: StructuredWalkerPrototype,
		struct: ASTNull,
		parent?: ASTStructured,
		nesting?: number,
	): void;
	leaveNull?(
		this: StructuredWalkerPrototype,
		struct: ASTNull,
		parent?: ASTStructured,
		nesting?: number,
	): void;
	// terminals
	skip?(
		this: WalkerPrototype,
		value: ASTTerminal<'skip'>,
		parent?: ASTStructured,
		nesting?: number,
	): void;
	float?(
		this: WalkerPrototype,
		value: ASTTerminal<'float32' | 'float64'>,
		parent?: ASTStructured,
		nesting?: number,
	): void;
	intN?(
		this: WalkerPrototype,
		value: ASTTerminal<'intN'>,
		parent?: ASTStructured,
		nesting?: number,
	): void;
	boolean?(
		this: WalkerPrototype,
		value: ASTTerminal<'boolean'>,
		parent?: ASTStructured,
		nesting?: number,
	): void;
	string?(
		this: WalkerPrototype,
		value: ASTTerminal<'string'>,
		parent?: ASTStructured,
		nesting?: number,
	): void;
	ubyte?(
		this: WalkerPrototype,
		value: ASTTerminal<'ubyte'>,
		parent?: ASTStructured,
		nesting?: number,
	): void;
}
// Parent is structure (object or nullist)
// Elt -> Elt -> Parent -> Elt
//                  |
//                  > Elt -> Elt -> Elt
