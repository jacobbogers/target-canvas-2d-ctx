import createBuilder from '../../builder/Builder';
import { createAdvance, printToBin } from '../../helpers';
import { EMPTY_UBYTE } from '../../constants';
import createParser from '../Parser';

describe.concurrent('parser/parser', () => {
	describe('oid', () => {
		it('fidelity using structures and terminals', () => {
			const builder = createBuilder();
			builder.oid('000', '001', '004')()((b) => {
				b.i(127)
					.i(-1)
					.s('Hello world!')
					.skip()
					.f32(1e-9)
					.f64(1e-308)
					.b(true)
					.b(false)
					.buf(Uint8Array.from([99, 100, 101]));
				b.obj(() => {
					b.obj((build3) => {
						build3.s('the quick brown fox');
					});
					b.s('jumps over the lazy dog');
					b.n(() => {
						b.obj(() => {
							b.i(123);
						});
					});
				});
			});
			const { len, len2, target, advance } = printToBin(builder);
			expect(len).toBe(len2);
			expect(advance).toEqual({
				offsetForReturnArguments: 0,
				offsetForArguments: 104,
			});
			expect(target).toEqual(
				Uint8Array.from([
					137, 102, 97, 3, 0, 1, 4, 96, 33, 127, 33, 255, 17, 12, 72, 101, 108,
					108, 111, 32, 119, 111, 114, 108, 100, 33, 80, 68, 95, 112, 137, 48,
					72, 210, 232, 25, 120, 214, 48, 7, 0, 49, 48, 97, 3, 99, 100, 101,
					129, 54, 129, 21, 17, 19, 116, 104, 101, 32, 113, 117, 105, 99, 107,
					32, 98, 114, 111, 119, 110, 32, 102, 111, 120, 17, 23, 106, 117, 109,
					112, 115, 32, 111, 118, 101, 114, 32, 116, 104, 101, 32, 108, 97, 122,
					121, 32, 100, 111, 103, 1, 4, 129, 2, 33, 123,
				]),
			);
			const parser = createParser();
			const ast = parser.parse(target);
			expect(ast).toEqual({
				type: 'root',
				range: {
					start: 0,
					end: 104,
				},
				children: [
					{
						type: 'oid',
						range: {
							start: 0,
							end: 104,
						},
						value: [
							{
								type: 'ubyte',
								range: {
									start: 2,
									end: 7,
								},
								value: Uint8Array.from([0, 1, 4]),
							},
							{
								type: 'ubyte',
								range: {
									start: 7,
									end: 8,
								},
								value: EMPTY_UBYTE,
							},
						],

						children: [
							{
								type: 'intN',
								value: 127,
								range: {
									start: 8,
									end: 10,
								},
							},
							{
								type: 'intN',
								value: -1,
								range: {
									start: 10,
									end: 12,
								},
							},
							{
								type: 'string',
								value: 'Hello world!',
								range: {
									start: 12,
									end: 26,
								},
							},
							{
								type: 'skip',
								range: {
									start: 26,
									end: 27,
								},
							},
							{
								type: 'float32',
								range: {
									start: 27,
									end: 32,
								},
								value: 9.999999717180685e-10,
							},
							{
								type: 'float64',
								range: {
									start: 32,
									end: 41,
								},
								value: 1e-308,
							},
							{
								type: 'boolean',
								value: true,
								range: {
									start: 41,
									end: 42,
								},
							},
							{
								type: 'boolean',
								value: false,
								range: {
									start: 42,
									end: 43,
								},
							},
							{
								type: 'ubyte',
								value: Uint8Array.from([99, 100, 101]),
								range: {
									start: 43,
									end: 48,
								},
							},
							{
								type: 'object',
								range: {
									start: 48,
									end: 104,
								},
								children: [
									{
										type: 'object',
										range: {
											start: 50,
											end: 73,
										},
										children: [
											{
												type: 'string',
												value: 'the quick brown fox',
												range: {
													start: 52,
													end: 73,
												},
											},
										],
									},
									{
										type: 'string',
										value: 'jumps over the lazy dog',
										range: {
											start: 73,
											end: 98,
										},
									},
									{
										type: 'null',
										range: {
											start: 98,
											end: 104,
										},
										children: [
											{
												type: 'object',
												range: {
													start: 100,
													end: 104,
												},
												children: [
													{
														type: 'intN',
														value: 123,
														range: {
															start: 102,
															end: 104,
														},
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			});
		});
	});
});
