import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean; // If true, require auth to access. If false, hide when authenticated.
  requireContribution?: boolean; // If true, require completed contributions or premium subscription to access
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true,
  requireContribution = false
}: ProtectedRouteProps) {
  const { currentUser, loading, membershipStatus, checkMembershipStatus } = useAuth();
  const location = useLocation();
  const [checkingAccess, setCheckingAccess] = useState(requireContribution);

  useEffect(() => {
    // Check user membership status when required
    const checkAccess = async () => {
      if (requireContribution && currentUser) {
        try {
          // Check membership status
          await checkMembershipStatus();
        } catch (error) {
          console.error("Error checking access status:", error);
        } finally {
          setCheckingAccess(false);
        }
      } else {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [currentUser, requireContribution, checkMembershipStatus]);

  // Show loading if auth state is still loading or checking access
  if (loading || (requireContribution && checkingAccess)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Require auth case - redirect to login if not logged in
  if (requireAuth && !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Hide when authenticated case - redirect to home if logged in
  if (!requireAuth && currentUser) {
    return <Navigate to="/" replace />;
  }

  // Check contribution requirement
  if (requireContribution && currentUser && 
      !(membershipStatus === 'contributor' || membershipStatus === 'premium')) {
    return <Navigate to="/contribute" state={{ from: location }} replace />;
  }

  // Otherwise render children
  return <>{children}</>;
} 