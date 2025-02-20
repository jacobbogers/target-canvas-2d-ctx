import createBuilder from '../../builder/Builder';
import { createAdvance, printToBin } from '../../helpers';
import { EMPTY_UBYTE } from '../../constants';
import createParser from '../Parser';

describe('parser/parser', () => {
	describe('oid', () => {
		it('fidelity', () => {
			const builder = createBuilder();
			builder.oid('000', '001', '004')()((b) => {
				b.i(127).i(-1);
			});
			const { len, len2, target, advance } = printToBin(builder);
			const parser = createParser();
			const ast = parser.parse(target, 0);
			// for (const child of ast.children) {
			//     // biome-ignore lint/performance/noDelete: <explanation>
			//     delete child.parent;
			//     // biome-ignore lint/suspicious/noExplicitAny: <explanation>
			//     for (const schild of (child as any).children) {
			//         // biome-ignore lint/performance/noDelete: <explanation>
			//         delete schild.parent;
			//     }
			// }
			expect(ast).toEqual({
				type: 'root',
				range: {
					start: 0,
					end: 12,
				},
				children: [
					{
						type: 'oid',
						value: [
							{
								type: 'ubyte',
								range: {
									start: 2,
									end: 7,
								},
								value: Int8Array.from([0, 1, 4]),
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
						range: {
							start: 0,
							end: 12,
						},
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
						],
					},
				],
			});
		});
		// console.log(JSON.stringify(ast, null, 4));
	});
});
