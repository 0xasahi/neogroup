import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env,
  },
  build: {
    lib: {
      formats: ['cjs'],
      entry: {
        group: 'src/index.js',
      },
      name: 'group',
      fileName: 'group',
    },
    outDir: '../common/static/react/',
    rollupOptions: {},
  },
});
