import createBuilder from '../src/builder/Builder';
import { createLedger } from '../src/builder/helpers';
import type { Builder, UpToThreeDigitNumberString } from '../src/builder/types';
import type { Advance } from '../src/types';
import u8intFixture from './fixture/byte-buffer-fixtures';


function printToBin(builder: Builder) {
	const len = builder.foot();
	const target = new Uint8Array(len);
	const advance = createLedger();
	const len2 = builder.comp(target, 0, advance);
	return { len, len2, advance, target };
}

describe('Builder', () => {
	it('integers', () => {
		const builder = createBuilder();
		builder
			.i(0)
			.i(-1) // 0xff
			.i(-2) // 0xfe
			.i(-128) // 0x80
			.i(-129) // 0xff 7f
			.i(-(2 ** (16 - 1))) // -32768 , 0x8000, LE =  0x00 0x80
			.i(32767) // 0x7fff 2 bytes
			.i(32768) // 0x008000 // 3 bytes
			.i(-32768) // 2 bytes, 0x8000, LE = 0x00 0x80
			.i(-32769) // 3 bytes 0xff.7f.ff LE = 0xff 0x7f 0xff
			.i(2 ** 47 - 1) // 0x7fffffffffff should still be an integer
			.i(2 ** 47) // should be a float32
			.i(-(2 ** 47)) // should be an integer 0x80.00.00.00.00.00
			.i(-(2 ** 47) - 1) // should be a float32
			.i(255) // 16 bit number 0x00.ff
			.i(-129); // 16 bit number 0xff.7f
		const { len, len2, target, advance } = printToBin(builder);
		expect(len).toBe(len2);
		expect(len).toBe(57);
		expect(target).toEqual(new Uint8Array(
			[
				32, // i0
				33, 255, // -1
				33, 254, // -2
				33, 128, // - 128 because the range 0xff80-0xff can be encoded in 1 byte
				34, 127, 255, // 0xff7f -129 
				34, 0, 128, // 0x8000 = - 32768
				34, 255, 127, // 0x7fff = 32767
				35, 0, 128, 0, // 008000 = + 32768
				34, 0, 128, // 0x8000 = -32768
				35, 255, 127, 255, // 0xff7fff = -32769 (range 0xff8000 - 0xffffff is already covered by 2 byte encoding sequence)
				38, 255, 255, 255, 255, 255, 127, //  // 0x7fffffffffff
				68, 0, 0, 0, 87, // float32 2 ** 47
				38, 0, 0, 0, 0, 0, 128, // (-(2 ** 47)) 0x8000 0000 00 
				68, 0, 0, 0, 215, // 215 = 0xd7
				34, 255, 0, // 0x00FF   +255
				34, 127, 255  // 0xff7f  -129
			]));
	});
	it('booleans', () => {
		const builder = createBuilder();
		builder.b(true).b(false);
		const length = builder.foot();
		const target = new Uint8Array(length);
		expect(builder.comp(target)).toBe(length);
		expect(target).toEqual(new Uint8Array([
			0x30,
			0x31,
		]))
	});
	it('string', () => {
		const builder = createBuilder();
		builder.s('true').s('false').s('');
		const length = builder.foot();
		const target = new Uint8Array(length);
		expect(builder.comp(target)).toBe(length);
		expect(target).toEqual(Uint8Array.from([
			17, 4, 116, 114, 117, 101,
			17, 5, 102, 97, 108, 115, 101,
			16
		]));
	});
	it('ubytes', () => {
		const builder = createBuilder();
		const buf1 = new Uint8Array(4).map((v, i) => i);
		const buf2 = new Uint8Array(4).map((v, i) => i * 2);
		const buf3 = new Uint8Array(0);
		builder.buf(buf1).buf(buf2).buf(buf3);
		const length = builder.foot();
		const target = new Uint8Array(length);
		expect(builder.comp(target)).toBe(length);
		expect(target).toEqual(Uint8Array.from([
			97, 4, 0, 1, 2, 3,  // first buffer
			97, 4, 0, 2, 4, 6,  // second  buffer
			96 // empty buffer
		]));
	});
	it('skip', () => {
		const builder = createBuilder();
		const buf1 = new Uint8Array(4).map((v, i) => i);
		builder.buf(buf1).skip().skip();
		const length = builder.foot();
		const target = new Uint8Array(length);
		expect(builder.comp(target)).toBe(length);
		expect(target).toEqual(Uint8Array.from([
			97, 4, 0, 1, 2, 3,
			80, // skip
			80  // skip
		]))
	});
	it('skip', () => {
		const builder = createBuilder();
		const buf1 = new Uint8Array(4).map((v, i) => i);
		builder.buf(buf1).skip().skip();
		const length = builder.foot();
		const target = new Uint8Array(length);
		expect(builder.comp(target)).toBe(length);
		expect(target).toEqual(Uint8Array.from([
			97, 4, 0, 1, 2, 3,
			80, // skip
			80  // skip
		]))
	});
	it('skip', () => {
		const builder = createBuilder();
		const buf1 = new Uint8Array(4).map((v, i) => i);
		builder.buf(buf1).skip().skip();
		const length = builder.foot();
		const target = new Uint8Array(length);
		expect(builder.comp(target)).toBe(length);
		expect(target).toEqual(Uint8Array.from([
			97, 4, 0, 1, 2, 3,
			80, // skip
			80  // skip
		]))
	});
	describe('oid', () => {
		it('oid no payload', () => {
			const builder = createBuilder();
			const buildAlias = builder.oid('000', '99', '255')('123', '22')()
			expect(buildAlias).toBe(builder);

			expect(buildAlias.debug()).toEqual([
				{ valueType: 136, value: 3 },
				{ valueType: 96, value: Uint8Array.from([0, 99, 255]) },
				{ valueType: 96, value: Uint8Array.from([123, 22]) }
			]);

			const { len, len2, target, advance } = printToBin(builder);
			expect(len).toBe(len2);
			expect(len).toBe(11);
			expect(advance).toEqual({ offsetForArguments: 11, offsetForReturnArguments: 0 })
			expect(target).toEqual(Uint8Array.from([
				137,
				9,
				97, 3, 0,
				99, 255, 97, 2, 123,
				22
			]));
		});
		it('oid no call or return oid', () => {
			const builder = createBuilder();
			expect(() => builder.oid()()((build: Builder) => {
				build.debug();
			})).toThrow('Must at least specify call Oid or/and return Oid')
		});
		it('only return oid defined, oid prohibits build commmands', () => {
			const target = new Uint8Array(0)
			const builder = createBuilder();
			expect(() => builder.oid()('1', '2', '0')((build: Builder) => {
				build.skip();
				// il
				build.foot();
			})).toThrow('build.foot is not a function');

			// builder is unsusable here, because error happened

			// in Oid mode debug is allowed
			expect(builder.debug).toBeDefined();

			// builder is unsusable here 

			// in Oid mode, build commands are not allowed
			expect(builder.oid).toBeUndefined()
			expect(builder.comp).toBeUndefined();
			expect(builder.clear).toBeUndefined();
		});
		it('only call oid defined, oid prohibits build commmands', () => {
			const builder = createBuilder();
			builder.oid('1', '2', '0')()((build: Builder) => {
				build.skip();
			});
			const { len, len2, target, advance } = printToBin(builder);
			expect(len).toBe(len2);
			expect(len).toBe(9);
			expect(advance).toEqual({ offsetForArguments: 9, offsetForReturnArguments: 0 })
			expect(target).toEqual(Uint8Array.from([
				137,
				7,
				97, 3, 1, 2, 0,
				96,
				0x50
			]));

		});
		it('call oids will resolve to NaN', () => {
			const builder = createBuilder();
			expect(() => builder.oid('Poi' as UpToThreeDigitNumberString, '2', '0')()((build: Builder) => {
				build.skip();
			})).toThrow('"call Oid" has invalid sequence must be in range [0,255]')
		});
		it('return oids will resolve to NaN', () => {
			const builder = createBuilder();
			expect(() => builder.oid()('Poi' as UpToThreeDigitNumberString, '2', '0')((build: Builder) => {
				build.skip();
			})).toThrow('"return Oid" has invalid sequence must be in range [0,255]')
		});
	});
	describe('null', () => {
		it('null with payload', () => {
			const builder = createBuilder();
			builder.n(build => {
				build.skip();
				expect(build.n).toBeUndefined();
				expect(build.obj).toBeDefined();
				expect(build.comp).toBeUndefined();
			});
			const { len, len2, target, advance } = printToBin(builder);
			expect(len).toEqual(len2);
			expect(advance.offsetForArguments).toBe(len);
			expect(target).toEqual(Uint8Array.from([
				1, // null with payload
				1, // length of payload (1)
				80 // payload 0x50 5*16 = 64 + 16 = 80 
			]));
		});
		it('empty null', () => {
			const builder = createBuilder();
			builder.n();
			const { len, len2, target, advance } = printToBin(builder);
			expect(len).toEqual(len2);
			expect(len).toEqual(1);
			expect(advance.offsetForArguments).toBe(len);
			expect(target).toEqual(Uint8Array.from([0]));
		});
	});
	describe('object', () => {
		it('nested objects', () => {
			const builder = createBuilder();
			builder.obj(build1 => {
				build1.obj(build2 => {
					expect(build1).toBe(build2);
					expect(build1).toBe(builder);
					//
					expect(build2.comp).toBeUndefined();
					expect(build2.foot).toBeUndefined();
					expect(build2.debug).toBeDefined();
					expect(build2.clear).toBeUndefined();
				})
			})
			const { len, len2, target, advance } = printToBin(builder);
			expect(len).toEqual(len2);
			expect(len).toEqual(3);
			expect(advance.offsetForArguments).toBe(len);
			expect(target).toEqual(Uint8Array.from([129, 1, 128]));
		});
	});

	it('float32 & float64', () => {
		const builder = createBuilder();
		builder.f32(123).f64(456);
		const { len, len2, target, advance } = printToBin(builder);
		expect(len).toEqual(len2);
		expect(len).toEqual(14);
		expect(advance.offsetForArguments).toBe(len);
		expect(target).toEqual(Uint8Array.from([
			// 0x44
			68,
			// 4 byte value
			0,
			0,
			246,
			66,

			// 0x48
			72,
			// 8 byte value
			0,
			0,
			0,
			0,

			0,
			128,
			124,
			64,
		]));
	});

	it('clear()', () => {
		const builder = createBuilder();
		builder.i(123).i(456);
		expect(builder.debug()).toEqual([{ value: 123, valueType: 32 }, { value: 456, valueType: 32 }]);
		builder.clear();
		expect(builder.debug()).toEqual([]);
	});
});
