import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { lazy, Suspense } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useIdlePreload } from '@/hooks/use-idle-preload';
import { EmailVerificationGuard } from '@/components/auth/EmailVerificationGuard';

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
const Blog = lazy(() => import('@/pages/Blog'));
const MyLibrary = lazy(() => import('@/pages/MyLibrary'));
const Agora = lazy(() => import('@/pages/Agora'));
const Akazi = lazy(() => import('@/pages/Akazi'));
const JobDetail = lazy(() => import('@/pages/JobDetail'));
const EmailSuite = lazy(() => import('@/pages/EmailSuite'));
const CreateBrief = lazy(() => import('@/pages/CreateBrief'));
const Compose = lazy(() => import('@/pages/Compose'));
const EmailDraft = lazy(() => import('@/pages/compose/EmailDraft'));
const Proofreading = lazy(() => import('@/pages/compose/Proofreading'));
const ComingSoon = lazy(() => import('@/pages/compose/ComingSoon'));

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
                <Route path="/pinecone-test" element={<PineconeTest />} />
                <Route path="/library" element={<Library />} />
                
                {/* Create Brief Route - Protected with limited email verification */}
                <Route 
                  path="/create-brief" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <EmailVerificationGuard allowLimitedAccess={true}>
                        <CreateBrief />
                      </EmailVerificationGuard>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Compose Routes - Grid layout with individual tools */}
                <Route 
                  path="/compose" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <EmailVerificationGuard>
                        <Compose />
                      </EmailVerificationGuard>
                    </ProtectedRoute>
                  } 
                />
                
                                {/* Individual Compose Tools */}
                <Route 
                  path="/compose/email-draft"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <EmailVerificationGuard>
                        <EmailDraft />
                      </EmailVerificationGuard>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Proofreading Tool */}
                <Route 
                  path="/compose/proofreading"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <EmailVerificationGuard>
                        <Proofreading />
                      </EmailVerificationGuard>
                    </ProtectedRoute>
                  } 
                />

                {/* Coming Soon Tools */}
                <Route 
                  path="/compose/:toolId" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <EmailVerificationGuard>
                        <ComingSoon />
                      </EmailVerificationGuard>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Legacy Email Suite Route - Keep for direct access */}
                <Route 
                  path="/email-suite" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <EmailVerificationGuard>
                        <EmailSuite />
                      </EmailVerificationGuard>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Agora routes - mix of public and protected */}
                <Route path="/agora/*" element={<Agora />} />
                
                {/* Akazi (Jobs) routes - public */}
                <Route path="/akazi" element={<Akazi />} />
                <Route path="/akazi/job/:jobId" element={<JobDetail />} />
                
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
                
                {/* Contribution route - Limited access allowed for unverified users */}
                <Route 
                  path="/contribute" 
                  element={
                    <ProtectedRoute requireAuth={true} requireContribution={false}>
                      <EmailVerificationGuard allowLimitedAccess={true}>
                        <Contribute />
                      </EmailVerificationGuard>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Protected routes with contribution requirement */}
                <Route 
                  path="/library/pro" 
                  element={
                    <ProtectedRoute requireAuth={true} requireContribution={true}>
                      <EmailVerificationGuard>
                        <Library />
                      </EmailVerificationGuard>
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
                      <EmailVerificationGuard>
                        <PaymentSuccess />
                      </EmailVerificationGuard>
                    </ProtectedRoute>
                  } 
                />
                
                {/* MyLibrary route - Limited access allowed for unverified users */}
                <Route 
                  path="/my-library" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <EmailVerificationGuard allowLimitedAccess={true}>
                        <MyLibrary />
                      </EmailVerificationGuard>
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
