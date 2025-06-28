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

  // Check if user has access to Research Grove (premium feature)
  if (membershipStatus !== 'premium' && membershipStatus !== 'contributor') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-8">
            <div className="mb-6">
              <svg 
                className="w-16 h-16 mx-auto text-primary mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
            
            <h2 className="text-2xl font-semibold mb-4">Research Grove Access Required</h2>
            
            <p className="text-muted-foreground mb-6">
              Research Grove is a premium feature designed for advanced legal research. 
              Upgrade your account or contribute to the community to unlock these powerful tools.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = '/pricing'}
                className="w-full"
                size="lg"
              >
                View Pricing Plans
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/contribute'}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Contribute to Get Access
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/'}
                variant="ghost"
                className="w-full text-sm"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated and has access
  return <>{children}</>;
}; 