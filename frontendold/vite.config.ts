import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // ✅ Build optimizations for production speed
  build: {
    // Split vendor chunks — each cached separately by browser
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-pdf': ['jspdf', 'html2canvas'],
          'vendor-ui': ['lucide-react', 'react-icons', 'sonner', 'react-hot-toast'],
          'vendor-utils': ['axios', 'date-fns'],
        },
      },
    },
    // Don't warn for large chunks (lazy loading handles it)
    chunkSizeWarningLimit: 500,
    // No source maps in production (smaller + faster)
    sourcemap: false,
    // Fast minification
    minify: 'esbuild',
    // Target modern browsers (smaller output)
    target: 'es2020',
  },

  server: {
    port: 5174,
    proxy: {
      '/api/designer': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/designer/, '/api'),
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
