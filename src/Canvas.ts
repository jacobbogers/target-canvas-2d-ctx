
import { getFloat32Or64Bit, getInt, getString, setInt32 } from './helpers';

export default class TargetCanvas {
    #canvas: HTMLCanvasElement;
    #ctx: CanvasRenderingContext2DSettings;

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
        let cursor = offsetForSet + (stringType & 0x0f) + 1 + (getInt(dataForSet, offsetForSet + 1) as number);
        // is there an optional second argument? then process
        {
            const  type = dataForGet[cursor];
            if ((type >> 4) === 5) { // skip
                advance.offsetForArguments += 1;
                cursor 
            }
            if (type === 0x80) {
                const type = dataForGet[cursor]
            }
        }
        
        advance.offsetForArguments += cursor;
        const ctx = this.#canvas.getContext(str);
        dataForGet[offsetForGet] = 0x80;
        dataForGet[offsetForGet+1] = 0x01;
        dataForGet[offsetForGet+1] = ctx.alpha ? 0x31 : 0x30;
    }

}