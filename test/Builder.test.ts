import createBuilder from "../src/builder/Builder";
import type { Advance } from "../src/types";


describe('Builder', () => {
    it('integers', () => {
        const builder = createBuilder();
        builder.i(0)
            .i(-1)  // 0xff
            .i(-2)  // 0xfe
            .i(-128)  // 0x80
            .i(-129)  // 0xff 7f
            .i(-(2 ** (16 - 1))) // -32768 , 0x8000, LE =  0x00 0x80 
            .i(32767) // 0x7fff 2 bytes
            .i(32768)  // 0x008000 // 3 bytes
            .i(-32768)  // 2 bytes, 0x8000, LE = 0x00 0x80 
            .i(-32769)  // 3 bytes 0xff.7f.ff LE = 0xff 0x7f 0xff
            .i(2 ** 47 - 1) // 0x7fffffffffff should still be an integer
            .i(2 ** 47)// should be a float32
            .i(-(2 ** 47))// should be an integer 0x80.00.00.00.00.00
            .i(-(2 ** 47) - 1)// should be a float32
            .i(255) // 16 bit number 0x00.ff
            .i(-129) // 16 bit number 0xff.7f
        const u8buf = new Uint8Array(58);
        const advance = {
            offsetForArguments: 0,
            offsetForReturnArguments: 0,
        };
        builder.comp(u8buf, 0, advance);
        expect(u8buf).toEqual(new Uint8Array([
            33, 0, 33, 255, 33, 254, 33, 128, 34, 127, 255, 34,
            0, 128, 34, 255, 127, 35, 0, 128, 0, 34, 0, 128,
            35, 255, 127, 255, 38, 255, 255, 255, 255, 255, 127, 68,
            0, 0, 0, 87, 38, 0, 0, 0, 0, 0, 128, 68,
            0, 0, 0, 215, 34, 255, 0, 34, 127, 255
        ]));
        expect(builder.peek()).toEqual([
            { value: +0, valueType: 33 },
            { value: -1, valueType: 33 },
            { value: -2, valueType: 33 },
            { value: -128, valueType: 33 },
            { value: -129, valueType: 34 },
            { value: -32768, valueType: 34 },
            { value: 32767, valueType: 34 },
            { value: 32768, valueType: 35 },
            { value: -32768, valueType: 34 },
            { value: -32769, valueType: 35 },
            { value: 140737488355327, valueType: 38 },
            { value: 140737488355328, valueType: 68 },
            { value: -140737488355328, valueType: 38 },
            { value: -140737488355329, valueType: 68 },
            { value: 255, valueType: 34 },
            { value: -129, valueType: 34 }
        ]);
        expect(builder.foot()).toBe(58);
    });
    it('float32 & float64 & builder.clear() test', () => {
        const builder = createBuilder();
        builder.f32(45E99).f64(1E-124);
        expect(builder.peek()).toEqual([
            { value: 4.5e+100, valueType: 68 },
            { value: 1e-124, valueType: 72 }
        ]);
        expect(builder.foot()).toBe(14);
        const buffer = new Uint8Array(14)
        const advance: Advance = { offsetForArguments: 0, offsetForReturnArguments: 0 }
        const byteCount = builder.comp(buffer, 0, advance);
        expect(byteCount).toBe(14);
        expect(buffer).toEqual(new Uint8Array([
            68, 0, 0, 128, 127, 72, 137,
            143, 173, 224, 75, 236, 48, 38,
        ]));

        // builder clear test
        builder.clear();
        expect(builder.foot()).toBe(0);
        expect(builder.peek()).toEqual([]);
    });
    it('boolean', () => {
        const builder = createBuilder();
        builder.b(true).b(false);
        expect(builder.peek()).toEqual([{ valueType: 48 }, { valueType: 49 }])
        expect(builder.foot()).toBe(2);
        const advance: Advance = { offsetForArguments: 0, offsetForReturnArguments: 0 };
        const buffer = new Uint8Array(2);
        const byteCount = builder.comp(buffer, 0, advance);
        expect(byteCount).toBe(2);
        expect(advance).toEqual({ offsetForArguments: 2, offsetForReturnArguments: 0 });
        expect(buffer).toEqual(new Uint8Array([48, 49]));
    });
    it('skip/optional', () => {
        const builder = createBuilder();
        builder.skip().i(4).skip();
        expect(builder.peek()).toEqual([
            {
                "valueType": 80,
            },
            {
                "value": 4,
                "valueType": 33,
            },
            {
                "valueType": 80,
            },
        ]);
        expect(builder.foot()).toBe(4);
        const buf = new Uint8Array([80, 33, 4, 80]);
        const length = builder.comp(buf, 0);
        expect(length).toBe(4);
        expect(buf).toEqual(new Uint8Array([80, 33, 4, 80]));
    });
    it('strings', () => {
        const builder = createBuilder();
        const qbf = 'the quick brown fox jumps over the lazy dog';
        const qbfLength = qbf.length;
        const tmas = 'tell me another story';
        const tmasLength = tmas.length;
        builder.s(qbf).s(tmas);
        expect(builder.peek()).toEqual([
            {
                valueType: 17,
                value: new Uint8Array([
                    116, 104, 101, 32, 113, 117, 105, 99,
                    107, 32, 98, 114, 111, 119, 110, 32,
                    102, 111, 120, 32, 106, 117, 109, 112,
                    115, 32, 111, 118, 101, 114, 32, 116,
                    104, 101, 32, 108, 97, 122, 121, 32,
                    100, 111, 103 // 8x5+3 = 43
                ])
            },
            {
                valueType: 17,
                value: new Uint8Array([
                    116, 101, 108, 108, 32, 109,
                    101, 32, 97, 110, 111, 116,
                    104, 101, 114, 32, 115, 116,
                    111, 114, 121 // 3*6 + 3 = 21
                ])
            }
        ])
        console.log(builder.peek());
        expect(builder.foot()).toBe(68)
        expect(builder.foot()).toBe(68);
        const footPrintQbf = qbfLength + 1 + 1;
        const footPrintTmas = tmasLength + 1 + 1;
        expect(footPrintQbf + footPrintTmas).toBe(68);
        const ubuf = new Uint8Array(68);
        builder.comp(ubuf, 0);
        expect(ubuf).toEqual([
            // string 1
            17, 43, 116, 104, 101, 32, 113, 117, 105, 99, 107,
            32, 98, 114, 111, 119, 110, 32, 102, 111, 120, 32,
            106, 117, 109, 112, 115, 32, 111, 118, 101, 114, 32,
            116, 104, 101, 32, 108, 97, 122, 121, 32, 100, 111,
            103,
            // string 2
            17, 21, 116, 101, 108, 108, 32, 109, 101, 32,
            97, 110, 111, 116, 104, 101, 114, 32, 115, 116, 111,
            114, 121
        ]);
    });
});