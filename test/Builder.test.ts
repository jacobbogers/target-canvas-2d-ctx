import createBuilder from "../src/builder/Builder";
import { createLedger } from "../src/builder/helpers";
import type { Advance } from "../src/types";
import u8intFixture from './fixture/byte-buffer-fixtures';


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
        expect(builder.debug()).toEqual([
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
        expect(builder.debug()).toEqual([
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
        expect(builder.debug()).toEqual([]);
    });
    it('boolean', () => {
        const builder = createBuilder();
        builder.b(true).b(false);
        expect(builder.debug()).toEqual([{ valueType: 48 }, { valueType: 49 }])
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
        expect(builder.debug()).toEqual([
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
        expect(builder.debug()).toEqual([
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
        expect(builder.foot()).toBe(68)
        expect(builder.foot()).toBe(68);
        const footPrintQbf = qbfLength + 1 + 1;
        const footPrintTmas = tmasLength + 1 + 1;
        expect(footPrintQbf + footPrintTmas).toBe(68);
        const ubuf = new Uint8Array(68);
        builder.comp(ubuf, 0);
        expect(ubuf).toEqual(new Uint8Array([
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
        ]));

        // empty string
        builder.clear().s('');
        const target = new Uint8Array(2);
        builder.comp(target, 0);
        expect(target).toEqual(new Uint8Array([17, 0]));
    });
    it('byte arrays', () => {
        const builder = createBuilder();
        const buf1 = u8intFixture.slice(3, 3 + 128);
        const buf2 = u8intFixture.slice(3 + 128 + 2, 3 + 128 + 2 + 127);
        builder.buf(buf1).buf(buf2);
        expect(builder.foot()).toBe((1 + 2 + 128) + (1 + 1 + 127));
        const target = new Uint8Array(builder.foot());
        builder.comp(target, 0);
        expect(target).toEqual(u8intFixture);
    });
    it('objects', () => {
        const builder = createBuilder();
        const buf1 = u8intFixture.slice(3, 3 + 128);
        const buf2 = u8intFixture.slice(3 + 128 + 2, 3 + 128 + 2 + 127);
        builder.obj(b => b.buf(buf1).buf(buf2));
        expect(builder.debug()).toEqual(
            [
                { valueType: 128 },
                {
                    valueType: 98,
                    value: buf1.slice(),
                },
                {
                    valueType: 97,
                    value: buf2.slice(),
                },
                { valueType: 129 }
            ]);
        expect(builder.foot()).toBe(262);
        const target = new Uint8Array(262);
        expect(builder.comp(target, 0)).toBe(262);
        expect(target).toEqual(new Uint8Array([
            128, // object start
            98, 128, 0, 197, 222, 34, 122, 70, 141, 10, 120, 157, 105, 79, 96, 135,
            36, 220, 5, 37, 79, 217, 142, 120, 90, 174, 117, 68, 229, 36, 143, 0,
            123, 153, 126, 31, 248, 253, 9, 105, 61, 109, 137, 205, 43, 35, 103, 187,
            107, 79, 26, 70, 218, 59, 16, 13, 2, 53, 154, 92, 241, 77, 142, 153,
            197, 227, 96, 205, 133, 83, 82, 14, 245, 153, 224, 31, 58, 221, 155, 174,
            255, 216, 171, 170, 200, 39, 2, 230, 105, 142, 177, 26, 115, 117, 28, 215,
            174, 213, 146, 46, 80, 90, 28, 112, 112, 3, 153, 233, 246, 205, 9, 107,
            218, 46, 86, 133, 206, 32, 42, 4, 1, 236, 195, 149, 254, 24, 169, 105,
            220, 252, 170,
            //buf2
            97, 127, 233, 243, 66, 39, 240, 10, 173, 37, 177, 6, 111,
            159, 158, 112, 35, 115, 192, 34, 69, 88, 46, 4, 190, 35, 164, 192, 75,
            107, 121, 144, 173, 40, 28, 254, 119, 163, 130, 176, 224, 189, 131, 152, 200,
            42, 143, 244, 164, 223, 196, 182, 80, 160, 89, 3, 252, 82, 9, 151, 246,
            155, 254, 176, 48, 196, 28, 62, 222, 233, 45, 40, 17, 245, 201, 49, 218,
            255, 243, 112, 77, 157, 140, 74, 64, 46, 130, 5, 8, 164, 245, 165, 87,
            170, 232, 251, 60, 163, 186, 19, 212, 161, 201, 214, 77, 173, 81, 237, 171,
            205, 114, 70, 129, 157, 113, 250, 248, 80, 59, 59, 87, 94, 126, 82, 58,
            60, 8, 154, 199,
            129, // object end
        ]));
        builder.clear().obj(bNested => bNested.buf(buf1).obj(bNested2 => bNested2.buf(buf2)));
        expect(builder.debug()).toEqual([
            { valueType: 128 },
            {
                valueType: 98,
                value: buf1,
            },
            { valueType: 128 },
            {
                valueType: 97,
                value: buf2,
            },
            { valueType: 129 },
            { valueType: 129 }
        ]);
        expect(builder.foot()).toBe(264);
        const targetEmbedded = new Uint8Array(264);
        expect(builder.comp(targetEmbedded, 0)).toBe(264);
        expect(targetEmbedded).toEqual(new Uint8Array([
            128, // object start
            98, 128, 0, 197, 222, 34, 122, 70, 141, 10, 120, 157, 105, 79, 96, 135,
            36, 220, 5, 37, 79, 217, 142, 120, 90, 174, 117, 68, 229, 36, 143, 0,
            123, 153, 126, 31, 248, 253, 9, 105, 61, 109, 137, 205, 43, 35, 103, 187,
            107, 79, 26, 70, 218, 59, 16, 13, 2, 53, 154, 92, 241, 77, 142, 153,
            197, 227, 96, 205, 133, 83, 82, 14, 245, 153, 224, 31, 58, 221, 155, 174,
            255, 216, 171, 170, 200, 39, 2, 230, 105, 142, 177, 26, 115, 117, 28, 215,
            174, 213, 146, 46, 80, 90, 28, 112, 112, 3, 153, 233, 246, 205, 9, 107,
            218, 46, 86, 133, 206, 32, 42, 4, 1, 236, 195, 149, 254, 24, 169, 105,
            220, 252, 170,
            //buf2
            128,
            97, 127, 233, 243, 66, 39, 240, 10, 173, 37, 177, 6, 111,
            159, 158, 112, 35, 115, 192, 34, 69, 88, 46, 4, 190, 35, 164, 192, 75,
            107, 121, 144, 173, 40, 28, 254, 119, 163, 130, 176, 224, 189, 131, 152, 200,
            42, 143, 244, 164, 223, 196, 182, 80, 160, 89, 3, 252, 82, 9, 151, 246,
            155, 254, 176, 48, 196, 28, 62, 222, 233, 45, 40, 17, 245, 201, 49, 218,
            255, 243, 112, 77, 157, 140, 74, 64, 46, 130, 5, 8, 164, 245, 165, 87,
            170, 232, 251, 60, 163, 186, 19, 212, 161, 201, 214, 77, 173, 81, 237, 171,
            205, 114, 70, 129, 157, 113, 250, 248, 80, 59, 59, 87, 94, 126, 82, 58,
            60, 8, 154, 199,
            129, 129
        ]));
        builder.clear();
        builder.obj(b => b.obj()).obj();
        expect(builder.debug()).toEqual([
            { valueType: 128 },
            { valueType: 128 },
            { valueType: 129 },
            { valueType: 129 },
            { valueType: 128 },
            { valueType: 129 },
        ]);

        expect(builder.foot()).toEqual(6);
        const targetNested3 = new Uint8Array(6);
        expect(builder.comp(targetNested3)).toBe(6);
        expect(targetNested3).toEqual(new Uint8Array([128, 128, 129, 129, 128, 129]));
    });
    it('nulls (exceptions)', async () => {
        const builder = createBuilder();
        const buf1 = u8intFixture.slice(3, 3 + 128);
        const buf2 = u8intFixture.slice(3 + 128 + 2, 3 + 128 + 2 + 127);
        expect(() => builder.n(b => b.n())).toThrow('"null payloads" cannot contain other nulls or "null payloads"');
        expect(builder.debug()).toEqual([]);
        const targetTestEmpty = new Uint8Array(2).fill(0);
        expect(builder.comp(targetTestEmpty)).toBe(0);
        expect(builder.foot()).toBe(0);
        //
        builder.n((b) =>
            b.obj(b =>
                b.i(4).i(127).i(-127)
            )
        );
        expect(builder.debug()).toEqual([
            { valueType: 1 },
            { valueType: 128 },
            { value: 4, valueType: 33 },
            { value: 127, valueType: 33 },
            { value: -127, valueType: 33 },
            { valueType: 129 },
            { valueType: 2 }
        ]);
        expect(builder.foot()).toBe(4 + 6);
        const targetTestNullPayload = new Uint8Array(10);
        const advTestNullPayload = createLedger();
        expect(builder.comp(targetTestNullPayload, 0, advTestNullPayload)).toBe(10);
        expect(targetTestNullPayload).toEqual(Uint8Array.from([
            1, 128, 33, 4, 33,
            127, 33, 129, 129, 2
        ]));
        expect(advTestNullPayload).toEqual({ offsetForArguments: 10, offsetForReturnArguments: 0 });
        // empty null
        builder.clear();
        builder.n();
        expect(builder.foot()).toBe(1);
        expect(builder.debug()).toEqual([{
            valueType: 0x00
        }]);
        const onlyNullTarget = new Uint8Array(1);
        expect(builder.comp((onlyNullTarget))).toBe(1);
        expect(onlyNullTarget).toEqual(Uint8Array.from([0]));
        // if the payload of a null is empty it reverts to 0x00 type
        builder.clear().n(b => {
            // do nothing
        });
        expect(builder.foot()).toBe(1);
        expect(builder.debug()).toEqual([{
            valueType: 0x00
        }]);
        expect(builder.comp((onlyNullTarget))).toBe(1);
        expect(onlyNullTarget).toEqual(Uint8Array.from([0]));
    });
});