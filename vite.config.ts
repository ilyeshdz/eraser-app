import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 2000,
  },
  optimizeDeps: {
    exclude: ['@huggingface/transformers']
  },
  worker: {
    format: 'es'
  },
  define: {
    'process.env': {},
    'lit.dev.mode': JSON.stringify(false)
  }
})
