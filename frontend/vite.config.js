import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
    })
  ],
  build: {
    // Output directory
    outDir: 'dist',
    // Generate sourcemaps for debugging (false em produção)
    sourcemap: false,
    // Minify with esbuild (mais rápido que terser)
    minify: 'esbuild',
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunks para melhor code splitting com hash para cache busting
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['react-toastify', 'react-calendar'],
          'utils': ['axios', 'date-fns', 'zustand']
        },
        // Asset file names com hash para evitar cache
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'images';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      }
    },
    // Target para browsers modernos
    target: 'es2015',
    // CSS code splitting
    cssCodeSplit: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'zustand'],
  },
  // Dev server config
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    open: false,
    // Headers para evitar cache no desenvolvimento
    headers: {
      'Cache-Control': 'no-store',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  // Preview server config
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
    open: false
  }
})
