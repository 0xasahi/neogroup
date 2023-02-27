import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env,
  },
  terserOptions: {
    // 生产环境下移除console
    compress: {
      drop_console: true,
      drop_debugger: true
    }
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
