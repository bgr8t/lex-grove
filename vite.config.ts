// vite.config.ts - Complete fix for React useLayoutEffect error
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force single React instance - CRITICAL FIX
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    // Ensure React is always resolved to the same instance
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      '@tanstack/react-query',
      'use-sync-external-store/shim'
    ],
    // Force optimization of React
    force: true
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Keep React and React-DOM together - CRITICAL
          'vendor-react': ['react', 'react-dom'],
          'vendor-react-router': ['react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-query': ['@tanstack/react-query']
        }
      },
      // Prevent React from being externalized
      external: (id) => {
        // Never externalize React
        if (id === 'react' || id === 'react-dom' || id.startsWith('react/') || id.startsWith('react-dom/')) {
          return false;
        }
        return false;
      }
    }
  }
})
