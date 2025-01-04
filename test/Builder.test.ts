import { createBuilder } from "../src/builder/Builder";


describe('Builder', () => {
    it('create integers', () => {
        const builder = createBuilder();
        builder.i(8).i(9).s('uio');
        console.log(builder);
    })
});