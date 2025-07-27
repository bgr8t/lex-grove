import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load Agora components
const AgoraBrowse = React.lazy(() => import('@/components/agora/AgoraBrowse'));
const AgoraEditor = React.lazy(() => import('@/components/agora/AgoraEditor'));
const AgoraArticleReader = React.lazy(() => import('@/components/agora/AgoraArticleReader'));
const AgoraDashboard = React.lazy(() => import('@/components/agora/AgoraDashboard'));
const AgoraUserProfile = React.lazy(() => import('@/components/agora/AgoraUserProfile'));
const AgoraProfileSettings = React.lazy(() => import('@/components/agora/AgoraProfileSettings'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-6 w-96" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function Agora() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        <React.Suspense fallback={<LoadingFallback />}>
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