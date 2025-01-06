import { createBuilder } from "../src/builder/Builder";
import { setInt, getInt } from "../src/builder/Builder";


describe('Builder', () => {
    it('integers', () => {
        const builder = createBuilder();
        builder.i(8).i(9);
        expect(builder.peek()).toEqual([
            { value: 8, valueType: 33 },
            { value: 9, valueType: 33 },
        ]);
        builder.clear();
        builder.i(2 ** 47 - 1); // should still be an integer
        builder.i(2 ** 47);// should be a float32
        builder.i(-(2 ** 47));// should be an integer
        builder.i(-(2 ** 47) - 1);// should be a float32
        builder.i(255); // 16 bit number
        builder.i(-129); // 16 bit number
        expect(builder.peek()).toEqual([
            { value: 140737488355327, valueType: 0x26 },
            { value: 140737488355328, valueType: 0x44 },
            { value: -140737488355328, valueType: 0x26 },
            { value: -140737488355329, valueType: 0x44 },
            { value: 255, valueType: 0x22 },
            { value: -129, valueType: 0x22 }
        ]);
        const ubytes = new Uint8Array(3)
        const advance = {
            offsetForArguments: 0,
            offsetForReturnArguments: 0,
        };
        // twos complement, 255 will be 2 bytes
        setInt(255, ubytes, 0, advance);
        expect(ubytes).toEqual(new Uint8Array([34, 255, 0]));
        expect(advance).toEqual({ offsetForArguments: 3, offsetForReturnArguments: 0 });

        const fidelity = getInt(ubytes, 0, advance);
        expect(fidelity).toBe(255);
        expect(advance).toEqual({ offsetForArguments: 3, offsetForReturnArguments: 3 });

        setInt(-255, ubytes, 0, advance);
        expect(ubytes).toEqual(new Uint8Array([0x22, 0xfe, 0x80]));
        expect(advance).toEqual({ offsetForArguments: 6, offsetForReturnArguments: 3 });

        const fidelity2 = getInt(ubytes, 0, advance);
        expect(fidelity2).toBe(-255);
        expect(advance).toEqual({ offsetForArguments: 6, offsetForReturnArguments: 6 });
    })
});