import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		exclude: [...configDefaults.exclude],
		environment: 'happy-dom',
		globals: true,
		coverage: {
			provider: 'v8'
		}
	},
});
