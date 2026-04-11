// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	integrations: [react()],
	vite: {
		plugins: [tailwindcss()],
		optimizeDeps: {
			include: ['react', 'react-dom', 'react-dom/client'],
		},
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./', import.meta.url)),
				'next/image': fileURLToPath(new URL('./src/shims/next-image.tsx', import.meta.url)),
				'next/navigation': fileURLToPath(new URL('./src/shims/next-navigation.ts', import.meta.url)),
				'next/dynamic': fileURLToPath(new URL('./src/shims/next-dynamic.ts', import.meta.url)),
				'next/server': fileURLToPath(new URL('./src/shims/next-server.ts', import.meta.url)),
			},
		},
		ssr: {
			external: ['bcryptjs'],
		},
	},
});
