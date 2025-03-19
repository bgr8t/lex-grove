import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { userProfileService } from "@/lib/services/userProfileService";
import { checkSubscriptionStatus } from "@/lib/services/stripeService";

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
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const [accessGranted, setAccessGranted] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(requireContribution);

  useEffect(() => {
    // Check user contribution status and subscription when required
    const checkAccess = async () => {
      if (requireContribution && currentUser) {
        try {
          // First check if they have a premium subscription
          const hasPremium = await checkSubscriptionStatus(currentUser.uid);
          
          if (hasPremium) {
            // If they have premium subscription, grant access
            setAccessGranted(true);
          } else {
            // If not premium, check if they've completed contributions
            const profile = await userProfileService.getCurrentUserProfile();
            
            if (profile) {
              if (profile.membershipStatus === 'premium') {
                // Also grant access if their profile shows premium membership
                setAccessGranted(true);
              } else if (profile.contributions.completed) {
                // Or if they've completed their contributions
                setAccessGranted(true);
              }
            }
          }
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
  }, [currentUser, requireContribution]);

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
  if (requireContribution && currentUser && !accessGranted) {
    return <Navigate to="/contribute" state={{ from: location }} replace />;
  }

  // Otherwise render children
  return <>{children}</>;
} 