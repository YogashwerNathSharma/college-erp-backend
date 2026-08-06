import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    // ── Minification ─────────────────────────────────────────────────────────
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // remove console.log in prod → smaller bundle
        drop_debugger: true,
        passes: 2,               // extra compression pass
      },
    },

    // ── Output ───────────────────────────────────────────────────────────────
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,

    // ── Asset caching: hash in filename so browser caches forever ────────────
    rollupOptions: {
      output: {
        // Content-hash filenames → long-term caching (one year)
        entryFileNames:  'assets/[name]-[hash].js',
        chunkFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',

        // ── Manual chunks: split big libs into separate cached files ─────────
        // Each chunk is loaded only when that feature is first visited.
        // On subsequent visits the browser uses the cached version.
        manualChunks(id) {
          // React core — tiny, changes rarely, always cached first
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }

          // Router
          if (id.includes('node_modules/react-router') ||
              id.includes('node_modules/@remix-run/')) {
            return 'vendor-router';
          }

          // Charts — large library, only used on dashboard/reports
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-')) {
            return 'vendor-charts';
          }

          // PDF / canvas — very large, only used for print/export
          if (id.includes('node_modules/jspdf') ||
              id.includes('node_modules/html2canvas') ||
              id.includes('node_modules/canvg') ||
              id.includes('node_modules/dompurify')) {
            return 'vendor-pdf';
          }

          // Icons — big set, rarely changes
          if (id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/react-icons')) {
            return 'vendor-icons';
          }

          // Toast / UI utils
          if (id.includes('node_modules/react-hot-toast') ||
              id.includes('node_modules/sonner')) {
            return 'vendor-toast';
          }

          // Date utils
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-dates';
          }

          // Axios + other small utils
          if (id.includes('node_modules/axios') ||
              id.includes('node_modules/qs')) {
            return 'vendor-http';
          }

          // Everything else in node_modules → one shared vendor chunk
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },

  // ── Dev server ───────────────────────────────────────────────────────────
  server: {
    port: 5174,
    proxy: {
      '/api/designer': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/designer/, '/api'),
      },
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})
