import { createCanvas } from 'canvas';
import TargetCanvas from '../src/Canvas';
import { getLength, setLength } from '../src/helpers';
import type { Advance } from '../src/types';
import { createBuilder } from '../src/builder/Builder';

import { readFileSync } from 'node:fs';
import { platform } from 'node:os';
import { resolve } from 'node:path';


describe.concurrent('Canvas-base', () => {
	it('set & get the canvas width', () => {
		const canvas: HTMLCanvasElement = window.document.createElement('canvas');
		const target = new TargetCanvas(canvas);
		// set the length
		const build = createBuilder();
		build
		.i(0x33) // oid set and get marker
		.i(0x1ff); // 511 is the width
		// console.log(build.peek());
		// -> [ { value: 51, valueType: 33 }, { value: 511, valueType: 34 } ]
		const intr = new Uint8Array([0x33, 0x22, 0xff, 0x01]);
		const response = new Uint8Array(8);
		const advance: Advance = { offsetForArguments: 0, offsetForReturnArguments: 0 };
		// test
		target.width(intr, 0, response, 0, advance);
		expect(canvas.width).toBe(511);
		expect(advance).toEqual({ offsetForArguments: 3, offsetForReturnArguments: 3 });
		expect(response).toEqual(new Uint8Array([0x22, 0xff, 0x01, 0, 0, 0, 0, 0]));
	});
	it('set & get the canvas height', () => {
		const canvas: HTMLCanvasElement = window.document.createElement('canvas');
		const target = new TargetCanvas(canvas);
		// set the length
		const intr = new Uint8Array([0x33, 0x22, 0xff, 0x01])
		const response = new Uint8Array(8);
		const advance: Advance = { offsetForArguments: 0, offsetForReturnArguments: 0 };
		// test
		target.height(intr, 0, response, 0, advance);
		expect(canvas.height).toBe(511);
		expect(advance).toEqual({ offsetForArguments: 3, offsetForReturnArguments: 3 });
		expect(response).toEqual(new Uint8Array([0x22, 0xff, 0x01, 0, 0, 0, 0, 0]));
	});
	it('getContext (using happy-dom)', () => {
		const canvas: HTMLCanvasElement = window.document.createElement('canvas');
		const target = new TargetCanvas(canvas);
		// set the length
		const _2d = new TextEncoder().encode('2d');
		const intLength = Math.ceil(Math.ceil(Math.log2(_2d.byteLength)) / 8)
		const byteLength = _2d.byteLength + 1 + intLength;
		const intr = new Uint8Array(byteLength);
		intr[0] = 0x10;
		setLength(_2d.byteLength, intr, 0);
		intr.set(_2d, 0 + 1 + intLength);
		const response = new Uint8Array([0xff]);
		const advance: Advance = { offsetForArguments: 0, offsetForReturnArguments: 0 };
		// test
		target.getContext(intr, 0, response, 0, advance);
		expect(advance).toEqual({ offsetForArguments: 4, offsetForReturnArguments: 1 });
		expect(response).toEqual(new Uint8Array([0]));
	});
	it('getContext (using canvas)', () => {
		const canvas = createCanvas(511, 511);
		const target = new TargetCanvas(canvas as unknown as HTMLCanvasElement);
		// set the length
		const _2d = new TextEncoder().encode('2d');
		const intLength = Math.ceil(Math.ceil(Math.log2(_2d.byteLength)) / 8)
		const byteLength = _2d.byteLength + 1 + intLength;
		const intr = new Uint8Array(byteLength);
		intr[0] = 0x10;
		setLength(_2d.byteLength, intr, 0);
		intr.set(_2d, 0 + 1 + intLength);
		const response = new Uint8Array([0xff]);
		const advance: Advance = { offsetForArguments: 0, offsetForReturnArguments: 0 };
		// test
		target.getContext(intr, 0, response, 0, advance);
		// no error return status, offsetForReturnArguments = 0
		expect(advance).toEqual({ offsetForArguments: 4, offsetForReturnArguments: 0 });
		// unchanged
		expect(response).toEqual(new Uint8Array([0xff]));
	});
	it('toDataURL (using canvas)', () => {
		const canvas = createCanvas(256, 256);
		const ctx = canvas.getContext('2d');
		ctx.fillText('hello world', 10, 50);
		ctx.closePath();
		const target = new TargetCanvas(canvas as unknown as HTMLCanvasElement);

		const imagePNG = new TextEncoder().encode('image/png');
		const lengthDescr = Math.ceil(Math.ceil(Math.log2(imagePNG.byteLength)) / 8)
		const byteLength = 1 /*for type*/ + lengthDescr /*for length*/ + imagePNG.byteLength /*for value*/;
		// we have 1st size calculated, 2nd argument is optional (needs 0x50 byte)
		const intr = new Uint8Array(byteLength + 1 /* for 0x50 */);
		intr[0] = 0x10;
		setLength(imagePNG.byteLength, intr, 0);
		intr.set(imagePNG, 0 /*offset*/ + 1 + lengthDescr);
		intr[byteLength] = 0x50; // no second argument
		const response = new Uint8Array(8192);
		const advance: Advance = { offsetForArguments: 0, offsetForReturnArguments: 0 };
		// test
		target.toDataURL(intr, 0, response, 0, 8192, advance);
		const length = getLength(response, 0);
		const fileName = platform() === 'linux' ? 'test-linux.png': 'test.png';
		const fixtureImage = readFileSync(resolve(__dirname, 'fixture', fileName));
		const offsetForReturnArguments =  platform() === 'linux' ? 893: 828;

		expect(new Uint8Array(fixtureImage)).toEqual(response.slice(3, length + 3));

		expect(advance).toEqual({ offsetForArguments: 11, offsetForReturnArguments });
	});
});
