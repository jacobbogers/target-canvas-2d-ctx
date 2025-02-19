import createBuilder from "../../builder/Builder";
import { createAdvance, printToBin } from "../../helpers";
import { getInt, getUbyte, readOIDFragment } from "../helpers";
import { EMPTY_UBYTE } from "../../constants";

describe('parser/helper', () => {
    describe('oid', () => {
        it('fragment', () => {
            const builder = createBuilder();
            builder.oid('000', '001', '004')()(b => {
                b.i(127).i(-1);
            });
            const { len, len2, target, advance } = printToBin(builder);
            const ast = readOIDFragment(target, advance);
            expect(ast).toEqual({
                type: 'oid',
                value: [
                    {
                        type: 'ubyte',
                        range: {
                            start: 2,
                            end: 7
                        },
                        value: Uint8Array.from([0, 1, 4]),
                    },
                    {
                        type: 'ubyte',
                        range: {
                            start: 7,
                            end: 8
                        },
                        value: EMPTY_UBYTE,
                    }
                ],
                range: {
                    start: 0,
                    end: 12
                },
                children: []
            })
        });
    });
    describe('ubyte', () => {
        it('fidelity', () => {
            const build = createBuilder();
            const advance = createAdvance();
            build.oid('000', '001', '004')()(b => {
                b.i(127).i(-1);
            });
            const size = build.foot();
            const data = new Uint8Array(size);
            const size2 = build.comp(data, 0, advance);
            expect(size2).toBe(12);
            expect(size).toBe(12);
            expect(advance).toEqual({ offsetForArguments: 12, offsetForReturnArguments: 0 });
            /*  console.log(data);
             [
             0x00   137,  10, // oid type marker and 10 bytes in length for the body
             0x02   97,  3,   0, 1,   4, // call Oid as a Ubyte
                
             0x07   96, // return Oid (empty)
             0x08   33, 127, // 127 int
             0x0a   33, 255  // -1 integer
             ]
            */
            const adv2 = createAdvance();
            adv2.offsetForReturnArguments = 2;
            const callUbytes = getUbyte(data, adv2);
            expect(adv2).toEqual({ offsetForArguments: 0, offsetForReturnArguments: 7 });

            const retUbytes = getUbyte(data, adv2);
            expect(adv2).toEqual({ offsetForArguments: 0, offsetForReturnArguments: 8 });

            const int1 = getInt(data, adv2);
            expect(adv2).toEqual({ offsetForArguments: 0, offsetForReturnArguments: 10 });

            const int2 = getInt(data, adv2);
            expect(adv2).toEqual({ offsetForArguments: 0, offsetForReturnArguments: 12 });
            expect(int1).toBe(127);
            expect(int2).toBe(-1);
            expect(callUbytes).toEqual(Uint8Array.from([0, 1, 4]));
            expect(retUbytes).toEqual(EMPTY_UBYTE);
        });
        it('parse ubyte', () => {
            const build = createBuilder();
            const advance = createAdvance();
            build.oid('000', '001', '004')()(b => {
                b.i(127).i(-1);
            });
            const size = build.foot();
            const data = new Uint8Array(size);
            const size2 = build.comp(data, 0, advance);
            expect(size2).toBe(12);
            expect(size).toBe(12);
            expect(advance).toEqual({ offsetForArguments: 12, offsetForReturnArguments: 0 });
            /*  console.log(data);
             [
             0x00   137,  10, // oid type marker and 10 bytes in length for the body
             0x02   97,  3,   0, 1,   4, // call Oid as a Ubyte
                
             0x07   96, // return Oid (empty)
             0x08   33, 127, // 127 int
             0x0a   33, 255  // -1 integer
             ]
            */
            const adv2 = createAdvance();
            adv2.offsetForReturnArguments = 2;
            const callUbytes = getUbyte(data, adv2);
            expect(adv2).toEqual({ offsetForArguments: 0, offsetForReturnArguments: 7 });

            const retUbytes = getUbyte(data, adv2);
            expect(adv2).toEqual({ offsetForArguments: 0, offsetForReturnArguments: 8 });

            const int1 = getInt(data, adv2);
            expect(adv2).toEqual({ offsetForArguments: 0, offsetForReturnArguments: 10 });

            const int2 = getInt(data, adv2);
            expect(adv2).toEqual({ offsetForArguments: 0, offsetForReturnArguments: 12 });
            expect(int1).toBe(127);
            expect(int2).toBe(-1);
            expect(callUbytes).toEqual(Uint8Array.from([0, 1, 4]));
            expect(retUbytes).toEqual(EMPTY_UBYTE);
        });
        it('ubyte misalignment', () => {
            const build = createBuilder();
            const advance = createAdvance();
            build.oid('000', '001', '004')()(b => {
                b.i(127).i(-1);
            });
            const size = build.foot();
            const data = new Uint8Array(size);
            const size2 = build.comp(data, 0, advance);
            const dataMalformed = data.slice(0, size2 - 6);
            advance.offsetForReturnArguments = 2;
            expect(() => getUbyte(dataMalformed, advance)).toThrow('Size of Ubyte type exceeds un parsed memory');
        });
    });
});

