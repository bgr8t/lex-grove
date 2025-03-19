import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { userProfileService } from '@/lib/services/userProfileService';
import { setUserAsPremium } from '@/lib/services/stripeService';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { currentUser, checkMembershipStatus } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        
        // Check if user profile exists
        const userProfile = await userProfileService.getCurrentUserProfile();
        
        if (!userProfile) {
          // Create a new user profile with complete information
          await userProfileService.createUserProfile({
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || '',
            // Initialize contributions
            contributions: {
              count: 0,
              target: 3,
              completed: true, // Premium users get automatic completion
              briefIds: []
            },
            membershipStatus: 'premium'
          });
          console.log('Created new user profile for premium subscriber');
        } else {
          // Update existing profile to premium status
          await userProfileService.updateMembershipStatus(currentUser.uid, 'premium');
          console.log('Updated existing user profile to premium status');
        }
          
        // Set the user as premium in localStorage
        setUserAsPremium(currentUser.uid);
        
        // Log success for debugging
        console.log('Successfully updated membership status to premium');
      } catch (error) {
        console.error('Error verifying payment:', error);
        setError('There was an error updating your membership. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [currentUser, navigate]);

  const handleGoToLibrary = async () => {
    if (currentUser) {
      // Force a membership status check before navigating
      console.log('Payment Success: Checking membership status before navigation');
      const status = await checkMembershipStatus();
      console.log('Payment Success: Membership status updated to', status);
      
      // Add a small delay to ensure the status update has propagated
      setTimeout(() => {
        navigate('/library');
      }, 300);
    } else {
      navigate('/library');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 pt-24">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <CheckCircleIcon className="h-24 w-24 text-green-500" />
          </div>
          
          <h1 className="text-3xl font-bold mb-3">Payment Successful!</h1>
          
          {loading ? (
            <p className="text-muted-foreground mb-6">Finalizing your subscription...</p>
          ) : error ? (
            <p className="text-red-500 mb-6">{error}</p>
          ) : (
            <>
              <p className="text-muted-foreground mb-6">
                Thank you for your subscription! You now have full access to Lex Grove's library of case briefs.
              </p>
              
              <div className="bg-muted/30 p-4 rounded-md mb-8 text-left">
                <h2 className="font-medium mb-2">What's included in your subscription:</h2>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Full access to all case briefs</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>AI-powered semantic search</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Personal collections and bookmarks</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Option to contribute briefs if you wish</span>
                  </li>
                </ul>
              </div>
            </>
          )}
          
          <div className="space-y-3">
            <Button className="w-full" onClick={handleGoToLibrary} disabled={loading}>
              Go to Library
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
              Return to Home
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            Have questions about your subscription? Contact us at{' '}
            <a href="mailto:support@lexgrove.com" className="text-primary underline">
              support@lexgrove.com
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess; 