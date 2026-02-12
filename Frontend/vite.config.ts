import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
  },
  build: {
    target: 'es2015',
    minify: 'esbuild',
    sourcemap: false,
    reportCompressedSize: false,
    cssCodeSplit: false,
    rollupOptions: {
      treeshake: 'recommended'
    }
  },
  esbuild: {
    // drop: ['console', 'debugger']
  },
  server: {
    host: true,
    port: 5173,
    hmr: {
      overlay: false,
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    proxy: {
      '/ml': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ml/, '')
      },
      '/ergast': {
        target: 'https://api.jolpi.ca',
        changeOrigin: true,
        secure: false
      },
      '/fastf1': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Vercel-specific configuration
  define: {
    __VERCEL__: JSON.stringify(process.env.VERCEL || false)
  },
  base: '/'
});
