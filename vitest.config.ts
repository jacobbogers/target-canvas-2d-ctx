import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		exclude: [...configDefaults.exclude, '**/fixture/*.*'],
		include: ['**/tests/*.test.ts'],
		environment: 'happy-dom',
		globals: true,
		coverage: {
			provider: 'v8',
			include: ['src'],
			exclude: ['**/tests/fixture/*.*', '**/**/*.test.ts'],
		},
	},
});
