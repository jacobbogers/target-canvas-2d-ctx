import { errors } from './errors';
import type { ErrorNumType } from './types';

export default class ParseError extends Error {
	constructor(private readonly code: ErrorNumType) {
		super(String(code));
		this.message = errors[code];
	}
}
