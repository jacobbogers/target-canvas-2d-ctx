export function createCanvasTarget(canvas: HTMLCanvasElement) {
	const map = {};

	type KeyOfMap = keyof typeof map;

	// function names
	const handler: ProxyHandler<Record<never, never>> = {
		get(target, p: KeyOfMap, receiver) {
			return map[p];
		},
	};

	return new Proxy(Object.create(null), handler);
}
