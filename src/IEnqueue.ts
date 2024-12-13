export default interface IEnqueue {
	enqueue(command: Uint8Array, offset: number): void;
}
