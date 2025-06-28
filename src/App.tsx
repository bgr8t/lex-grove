import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { lazy, Suspense } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const Index = lazy(() => import('@/pages/Index'));
const CaseBrief = lazy(() => import('@/pages/case-brief'));
const Library = lazy(() => import('@/pages/Library'));
const About = lazy(() => import('@/pages/About'));
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><span className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></span></div>}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/research-grove" element={<ResearchGrove />} />
                <Route path="/pinecone-test" element={<PineconeTest />} />
                <Route path="/library" element={<Library />} />
                
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
