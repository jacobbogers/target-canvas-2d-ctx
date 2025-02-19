import createBuilder from "../../builder/Builder";
import { createAdvance, printToBin } from "../../helpers";
import { EMPTY_UBYTE } from "../../constants";
import createParser from "../Parser";


describe('parser/parser', () => {
    describe('oid', () => {
        it('fidelity', () => {
            const builder = createBuilder();
            builder.oid('000', '001', '004')()(b => {
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
            console.log(JSON.stringify(ast, null, 4));
        });
    });
});

