import { createCanvas } from 'canvas';
import TargetCanvas from '../src/Canvas';
import { setLength } from '../src/helpers';
import type { Advance } from '../src/types';


describe('Canvas-base', () => {
	it('set & get the canvas width', () => {
		const canvas: HTMLCanvasElement = window.document.createElement('canvas');
		const target = new TargetCanvas(canvas);
		// set the length
		const intr = new Uint8Array([0x33, 0x22, 0xff, 0x01])
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
		console.log(response);
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
		console.log(response);
		// no error return status, offsetForReturnArguments = 0
		expect(advance).toEqual({ offsetForArguments: 4, offsetForReturnArguments: 0 });
		// unchanged
		expect(response).toEqual(new Uint8Array([0xff]));
	});
});
