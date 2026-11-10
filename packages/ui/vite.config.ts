import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Builds the component preview page (preview/index.html) into dist/.
export default defineConfig({
  root: fileURLToPath(new URL('./preview', import.meta.url)),
  base: './',
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
  },
  server: { fs: { allow: ['..', '../../..'] } },
});
