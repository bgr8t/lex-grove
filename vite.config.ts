import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log('Mode:', mode);
  console.log('Loaded environment variables:', Object.keys(env).filter(key => key.startsWith('VITE_')));
  
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        // Proxy API requests to a separate Next.js server if you're running one
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Build optimizations
    build: {
      target: 'es2020',
      minify: 'terser',
      cssMinify: true,
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React bundle
            vendor: ['react', 'react-dom', 'react-router-dom'],
            
            // Firebase services
            firebase: [
              'firebase/app', 
              'firebase/auth', 
              'firebase/firestore'
            ],
            
            // UI components library
            ui: [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-accordion',
              '@radix-ui/react-tabs',
              '@radix-ui/react-select',
              '@radix-ui/react-toast'
            ],
            
            // Form handling
            forms: [
              'react-hook-form',
              '@hookform/resolvers',
              'zod'
            ],
            
            // Icons
            icons: ['@heroicons/react/24/outline', '@heroicons/react/24/solid'],
            
            // Utilities
            utils: [
              'clsx',
              'tailwind-merge',
              'class-variance-authority',
              'date-fns'
            ],
            
            // Data fetching
            query: ['@tanstack/react-query'],
            
            // Heavy third-party libs
            external: [
              'framer-motion',
              'embla-carousel-react',
              'recharts'
            ]
          },
          // Optimize chunk file names
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId 
              ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '') || 'chunk'
              : 'chunk';
            return `js/${facadeModuleId}-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) return `assets/[name]-[hash][extname]`;
            const info = assetInfo.name.split('.');
            const extType = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return `images/[name]-[hash][extname]`;
            }
            if (/css/i.test(extType)) {
              return `css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      // Enable source maps for production debugging (disable if not needed)
      sourcemap: mode === 'development',
    },
    
    // Dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        '@tanstack/react-query'
      ],
      exclude: ['@heroicons/react'],
    },
    
    // CSS optimization
    css: {
      devSourcemap: mode === 'development',
    },
    
    // Pass the loaded env to the client
    define: {
      'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
      'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
      'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
      'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
      'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      'process.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID),
      'process.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID),
      'process.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY),
      'process.env.VITE_STRIPE_PRICE_ID': JSON.stringify(env.VITE_STRIPE_PRICE_ID),
    }
  };
});
