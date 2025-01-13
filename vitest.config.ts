import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		exclude: [...configDefaults.exclude],
		include: [
			'**/Builder.test.ts'
		],
		environment: 'happy-dom',
		globals: true,
		coverage: {
			provider: 'v8'
		}
	},
});
