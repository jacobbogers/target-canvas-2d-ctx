import type { ErrorNumType } from './types';

export const errors: Record<ErrorNumType, string> = {
	1024: 'Oid Error, no Oid or Optional placeholder found',
	1025: 'There must at least be an OID call or return ID',
};
