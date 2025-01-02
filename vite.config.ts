import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		exclude: ['better-sqlite3']
	},
	server: {
		fs: {
			allow: ['static']
		}
	}
});
