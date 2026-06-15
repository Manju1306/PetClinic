/// <reference types="vitest" />
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const isTest = !!process.env.VITEST;

const apiServerUrl = isTest
  ? 'http://localhost:30000'
  : process.env.API_SERVER_URL || 'http://localhost:3000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  define: {
    __API_SERVER_URL__: JSON.stringify(apiServerUrl),
  },
  server: {
    port: Number(process.env.PORT) || 4000,
  },
  build: {
    outDir: 'public/dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/__tests__/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    css: false,
  },
});
