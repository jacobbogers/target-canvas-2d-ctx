import type { AllBinTypes, NonRedactedTypes } from '../types';
import type { RedactedTypes } from './types';

import {
	oidTypeVal,
	nullSansPayloadTypVal,
	nullWithPayloadStartTypVal,
	nullWithPayloadEndTypVal,
	optionalTypeVal,
	sequenceStartTypeVal,
	sequenceEndTypeVal,
} from '../constants';

import {
	stringRedactedTypeVal,
	intRedactedTypeVal,
	boolRedactedTypeVal,
	flatRedactedTypeVal,
	ubyteRedactedTypeVal,
} from './constants';

const domain: NonRedactedTypes[] = [
	oidTypeVal,
	nullSansPayloadTypVal,
	nullWithPayloadStartTypVal,
	nullWithPayloadEndTypVal,
	optionalTypeVal,
	sequenceStartTypeVal,
	sequenceEndTypeVal,
];
const redactedDomain: RedactedTypes[] = [
	stringRedactedTypeVal,
	intRedactedTypeVal,
	boolRedactedTypeVal,
	flatRedactedTypeVal,
	ubyteRedactedTypeVal,
];

export function getType(
	binType: AllBinTypes,
): NonRedactedTypes | RedactedTypes | undefined {
	const idx = domain.indexOf(binType as NonRedactedTypes);
	if (idx >= 0) {
		return domain[idx];
	}
	const redactedType = (binType & 0xf0) as RedactedTypes;
	const idxRedacted = redactedDomain.indexOf(redactedType);
	return redactedDomain[idxRedacted];
}
