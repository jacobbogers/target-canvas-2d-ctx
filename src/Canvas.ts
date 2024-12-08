import IEnqueue from "./IEnqueue";
import { getFloat32Or64Bit, getInt } from './helpers';

export default class TargetCanvas implements IEnqueue {
    #canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.#canvas = canvas;
    }
    enqueue(command: Uint8Array, offset: number) {
        throw new Error("Method not implemented.");
    }
    // just interpret the binary packet
    // 0x31 -> get, 0X32 -> set, 0x33 -> set & get
    width(data: Uint8Array, offset: number) {
        const cmd = data[offset];
        if (cmd & 0x02) { // setter
            // there is an argument
            const type = data[offset + 1];
            let width: number | undefined = undefined;
            if (type >= 21 && type <= 24) {
                width = getInt(data, offset + 1) as number;
            }
            if (type >= 44 && type <= 48 ) {
                width = getFloat32Or64Bit(data, offset + 1);
            }
            if (width !== undefined) {
                this.#canvas.width = width;
            }
        }
        if (cmd & 0x01) {
            
        }
    }

    // 
    getHeight(height: Uint8Array, offset: number) {

    }

}