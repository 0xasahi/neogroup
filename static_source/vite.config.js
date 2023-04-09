import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": process.env,
  },
  terserOptions: {
    // 生产环境下移除console
    compress: {
      drop_console: true,
      drop_debugger: true
    }
  },
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: {
        group: resolve(__dirname, "src/index.jsx"),
        editor: resolve(__dirname, "src/components/Editor/editor.jsx"),
      },
      output: {
        dir: "../common/static/react/",
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
});
