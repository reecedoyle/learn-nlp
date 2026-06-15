import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// transformers.js ships large WASM/ONNX assets; keep them external to the
// dependency pre-bundler so Vite doesn't try to crawl them.
export default defineConfig({
  plugins: [react()],
  base: './',
  optimizeDeps: {
    exclude: ['@huggingface/transformers'],
  },
})
