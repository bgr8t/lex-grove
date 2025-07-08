import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { lazy, Suspense } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useIdlePreload } from '@/hooks/use-idle-preload';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime)
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

// Lazy load ALL components to enable proper code splitting
const Index = lazy(() => import('@/pages/Index'));
const Library = lazy(() => import('@/pages/Library'));
const About = lazy(() => import('@/pages/About'));
const CaseBrief = lazy(() => import('@/pages/case-brief'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Contribute = lazy(() => import('@/pages/Contribute'));
const PaymentSuccess = lazy(() => import('@/pages/payment-success'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const PineconeTest = lazy(() => import('@/pages/PineconeTest'));
const FlashDeck = lazy(() => import('@/pages/FlashDeck'));
const Blog = lazy(() => import('@/pages/Blog'));
const MyLibrary = lazy(() => import('@/pages/MyLibrary'));
const ResearchGrove = lazy(() => import('@/pages/ResearchGrove'));
const Agora = lazy(() => import('@/pages/Agora'));

function App() {
  // Enable idle-time preloading for better UX
  useIdlePreload();
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <Suspense fallback={null}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/research-grove" element={<ResearchGrove />} />
                <Route path="/research-grove/:mandateId" element={<ResearchGrove />} />
                <Route path="/pinecone-test" element={<PineconeTest />} />
                <Route path="/library" element={<Library />} />
                
                {/* Agora routes - mix of public and protected */}
                <Route path="/agora/*" element={<Agora />} />
                
                {/* Auth routes - redirect to home if already logged in */}
                <Route 
                  path="/login" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <Login />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <Register />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Contribution route - requires auth but not completed contributions */}
                <Route 
                  path="/contribute" 
                  element={
                    <ProtectedRoute requireAuth={true} requireContribution={false}>
                      <Contribute />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Protected routes with contribution requirement */}
                <Route 
                  path="/library/pro" 
                  element={
                    <ProtectedRoute requireAuth={true} requireContribution={true}>
                      <Library />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/flash-deck" 
                  element={
                    <ProtectedRoute requireAuth={true} requireContribution={true}>
                      <FlashDeck />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/case-brief/:id" 
                  element={<CaseBrief />} 
                />
                <Route 
                  path="/payment-success" 
                  element={
                    <ProtectedRoute>
                      <PaymentSuccess />
                    </ProtectedRoute>
                  } 
                />
                
                {/* MyLibrary route */}
                <Route 
                  path="/my-library" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <MyLibrary />
                    </ProtectedRoute>
                  } 
                />
                
                {/* 404 page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Toaster />
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
