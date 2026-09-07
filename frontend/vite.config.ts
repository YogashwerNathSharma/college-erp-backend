import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true, passes: 2 },
    },
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) return 'vendor-react';
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run/')) return 'vendor-router';
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-')) return 'vendor-charts';
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas') || id.includes('node_modules/canvg') || id.includes('node_modules/dompurify')) return 'vendor-pdf';
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-icons')) return 'vendor-icons';
          if (id.includes('node_modules/react-hot-toast') || id.includes('node_modules/sonner')) return 'vendor-toast';
          if (id.includes('node_modules/date-fns')) return 'vendor-dates';
          if (id.includes('node_modules/axios') || id.includes('node_modules/qs')) return 'vendor-http';
          if (id.includes('node_modules/')) return 'vendor-misc';
        },
      },
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api/designer': { target: 'http://localhost:5001', changeOrigin: true, rewrite: (path) => path.replace(/^\/api\/designer/, '/api') },
      '/api': { target: 'http://localhost:5001', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5001', changeOrigin: true },
    },
  },
})
