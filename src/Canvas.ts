
import { getBool, getFloat32Or64Bit, getInt, getString, setInt32 } from './helpers';
import { Advance } from './types';

export default class TargetCanvas {
    #canvas: HTMLCanvasElement;
    #ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.#canvas = canvas;
    }
    // just interpret the binary packet
    // 0x31 -> get, 0X32 -> set, 0x33 -> set & get
    width(dataForSet: Uint8Array, offsetForSet: number,dataForGet: Uint8Array, offsetForGet: number, advance: Advance ) {
        const cmd = dataForSet[offsetForSet];
        if (cmd & 0x02) { // setter
            // there is an argument
            const type = dataForSet[offsetForSet + 1];
            advance.offsetForArguments += type & 0x0f + 1
            let width: number | undefined = undefined;
            if (type >= 21 && type <= 24) {
                width = getInt(dataForSet, offsetForSet + 1) as number;
            }
            if (type >= 44 && type <= 48 ) {
                width = getFloat32Or64Bit(dataForSet, offsetForSet + 1);            
            }
            if (width !== undefined) {
                this.#canvas.width = width;
            }
        }
        if (cmd & 0x01) { // getter
            let width = this.#canvas.width;
            advance.offsetForReturnArguments += setInt32(width, dataForGet, offsetForGet);
        }
    }

    // 
    height(dataForSet: Uint8Array, offsetForSet: number,dataForGet: Uint8Array, offsetForGet: number, advance ) {
        const cmd = dataForSet[offsetForSet];
        if (cmd & 0x02) { // setter
            // there is an argument
            const type = dataForSet[offsetForSet + 1];
            advance.offsetForArguments += type & 0x0f + 1
            let height: number | undefined = undefined;
            if (type >= 21 && type <= 24) {
                height = getInt(dataForSet, offsetForSet + 1) as number;
            }
            if (type >= 44 && type <= 48 ) {
                height = getFloat32Or64Bit(dataForSet, offsetForSet + 1);
            }
            if (height !== undefined) {
                this.#canvas.height = height;
            }
        }
        if (cmd & 0x01) { // getter
            let height = this.#canvas.height;
            advance.offsetForReturnArguments += setInt32(height, dataForGet, offsetForGet); // return the advance cursor 5 bytes
        }
    }

    getContext(dataForSet: Uint8Array, offsetForSet: number, dataForGet: Uint8Array, offsetForGet : number, advance: Advance) {
        const stringType = dataForSet[offsetForSet];
        if (!(stringType >= 0x11 && stringType <= 0x14)){
            return; // abort
        }
        const str = getString(dataForGet, offsetForSet);
        if (str !== "2d") {
            return;
        }
        let cursor = offsetForSet + (stringType & 0x0f) + 1 + (getInt(dataForSet, offsetForSet + 1) as number);
        let ctxSettings: CanvasRenderingContext2DSettings | undefined = undefined;
        // is there an optional second argument? then process
        {
            const  type = offsetForSet[cursor];
            if ((type >> 4) === 5) { // skip, there is no optional second argument
                advance.offsetForArguments += 1;    
            }
            else if (type === 0x80 && offsetForSet[cursor + 1] === 1) { // is CanvasRenderingContext2DSettings?
                // get boolean "alpha"
                const alpha = getBool(dataForSet, cursor);
                const desynchronized = getBool(dataForSet, cursor + 1);
                const colorSpace = getString(dataForSet, cursor + 2) as PredefinedColorSpace;
                advance.offsetForReturnArguments += (dataForSet[cursor + 2] & 0x0f) + 1 + (getInt(dataForSet, cursor + 2) as number);
                const willReadFrequently = getBool(dataForSet, cursor + 3);
                advance.offsetForReturnArguments += 3 /* for booleans */;
                ctxSettings = { alpha, desynchronized, colorSpace, willReadFrequently}
            }
        }
        const ctx = this.#canvas.getContext(str, ctxSettings);
        if (ctx === null) {
            dataForGet[offsetForGet] = 0x00;
            advance.offsetForReturnArguments += 1;
            return;
        }
        this.#ctx = ctx;

    }

    toDataURL(dataForSet: Uint8Array, offsetForSet: number, dataForGet: Uint8Array, offsetForGet : number, numBytesGet: number, advance: Advance) {
        
    }

}