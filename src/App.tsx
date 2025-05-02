import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Index from '@/pages/Index';
import CaseBrief from '@/pages/case-brief';
import Library from '@/pages/Library';
import About from '@/pages/About';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Contribute from '@/pages/Contribute';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import PaymentSuccess from '@/pages/payment-success';
import NotFound from '@/pages/NotFound';
import { PineconeTest } from '@/pages/PineconeTest';
import FlashDeck from '@/pages/FlashDeck';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/pinecone-test" element={<PineconeTest />} />
            
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
              path="/library" 
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
              element={
                <ProtectedRoute requireAuth={true} requireContribution={true}>
                  <CaseBrief />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment-success" 
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              } 
            />
            
            {/* 404 page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
