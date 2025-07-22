import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Lazy load Agora components
const AgoraBrowse = React.lazy(() => import('@/components/agora/AgoraBrowse'));
const AgoraEditor = React.lazy(() => import('@/components/agora/AgoraEditor'));
const AgoraArticleReader = React.lazy(() => import('@/components/agora/AgoraArticleReader'));
const AgoraDashboard = React.lazy(() => import('@/components/agora/AgoraDashboard'));
const AgoraUserProfile = React.lazy(() => import('@/components/agora/AgoraUserProfile'));
const AgoraProfileSettings = React.lazy(() => import('@/components/agora/AgoraProfileSettings'));

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
            <Route path="user/:authorId" element={<AgoraUserProfile />} />
            
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
            <Route 
              path="settings" 
              element={
                <ProtectedRoute requireContribution>
                  <AgoraProfileSettings />
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