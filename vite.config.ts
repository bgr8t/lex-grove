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
          manualChunks: (id) => {
            // Dynamic chunking for better optimization
            if (id.includes('node_modules')) {
              // Core React ecosystem
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react';
              }
              
              // Firebase - split into separate chunk
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              
              // Heavy AI/ML dependencies
              if (id.includes('openai') || id.includes('pinecone')) {
                return 'vendor-ai';
              }
              
              // UI component libraries
              if (id.includes('@radix-ui') || id.includes('lucide-react')) {
                return 'vendor-ui';
              }
              
              // Form libraries
              if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
                return 'vendor-forms';
              }
              
              // Icons
              if (id.includes('@heroicons') || id.includes('lucide')) {
                return 'vendor-icons';
              }
              
              // Animation libraries
              if (id.includes('framer-motion')) {
                return 'vendor-animation';
              }
              
              // Charts and visualization
              if (id.includes('recharts') || id.includes('embla-carousel')) {
                return 'vendor-charts';
              }
              
              // Other utilities
              if (id.includes('clsx') || id.includes('tailwind') || id.includes('date-fns')) {
                return 'vendor-utils';
              }
              
              // Stripe and payment related
              if (id.includes('stripe')) {
                return 'vendor-payments';
              }
              
              // Remaining vendor dependencies
              return 'vendor-misc';
            }
            
            // App code chunking
            if (id.includes('/pages/')) {
              // Each page gets its own chunk
              const pageName = id.split('/pages/')[1]?.split('.')[0];
              return `page-${pageName}`;
            }
            
            if (id.includes('/components/')) {
              // Group components by feature
              if (id.includes('/components/ui/')) {
                return 'components-ui';
              }
              if (id.includes('/components/auth/')) {
                return 'components-auth';
              }
              if (id.includes('/components/agora/')) {
                return 'components-agora';
              }
              if (id.includes('/components/research-grove/')) {
                return 'components-research';
              }
              return 'components-common';
            }
            
            if (id.includes('/lib/services/')) {
              return 'services';
            }
            
            if (id.includes('/contexts/')) {
              return 'contexts';
            }
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
