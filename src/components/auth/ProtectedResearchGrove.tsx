import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

interface ProtectedResearchGroveProps {
  children: React.ReactNode;
}

export const ProtectedResearchGrove: React.FC<ProtectedResearchGroveProps> = ({ children }) => {
  const { currentUser, loading, membershipStatus } = useAuth();

  // Show loading skeleton while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }



  // User is authenticated and has access
  return <>{children}</>;
}; 