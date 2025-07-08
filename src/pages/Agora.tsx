import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Placeholder components - we'll implement these next
const AgoraBrowse = React.lazy(() => import('@/components/agora/AgoraBrowse'));
const AgoraEditor = React.lazy(() => import('@/components/agora/AgoraEditor'));
const AgoraArticleReader = React.lazy(() => import('@/components/agora/AgoraArticleReader'));
const AgoraDashboard = React.lazy(() => import('@/components/agora/AgoraDashboard'));

export default function Agora() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        <React.Suspense fallback={null}>
          <Routes>
            {/* Public routes */}
            <Route index element={<AgoraBrowse />} />
            <Route path="article/:slug" element={<AgoraArticleReader />} />
            
            {/* Protected routes - require contribution or premium */}
            <Route 
              path="new" 
              element={
                <ProtectedRoute requireContribution>
                  <AgoraEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="edit/:id" 
              element={
                <ProtectedRoute requireContribution>
                  <AgoraEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="dashboard" 
              element={
                <ProtectedRoute requireContribution>
                  <AgoraDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </React.Suspense>
      </main>
      <Footer />
    </div>
  );
} 