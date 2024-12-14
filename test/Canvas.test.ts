import TargetCanvas from '../src/Canvas';
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
		target.height(intr, 0, response, 0, advance);
		expect(canvas.height).toBe(511);
		expect(advance).toEqual({ offsetForArguments: 3, offsetForReturnArguments: 3 });
		expect(response).toEqual(new Uint8Array([0x22, 0xff, 0x01, 0, 0, 0, 0, 0]));
	});
});
