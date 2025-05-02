import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { userProfileService } from '@/lib/services/userProfileService';
import { ContributionProgress } from './ContributionProgress';
import { redirectToPayment } from '@/lib/services/stripeService';

interface PricingSectionProps {
  className?: string;
}

const PricingSection = ({ className = '' }: PricingSectionProps) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const handleJoinCommunity = async () => {
    if (!currentUser) {
      // Redirect to sign up
      return navigate('/register');
    }
    
    // Create user profile if it doesn't exist
    const userHasProfile = await userProfileService.getCurrentUserProfile();
    
    if (!userHasProfile) {
      try {
        setIsCreatingProfile(true);
        
        // Create a new user profile
        await userProfileService.createUserProfile({
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || '',
          photoURL: currentUser.photoURL || '',
          contributions: {
            count: 0,
            target: 3,
            completed: false,
            briefIds: []
          },
          membershipStatus: 'free',
        });
        
        toast({
          title: "Welcome to the community!",
          description: "Your profile has been created. Complete the contribution target to unlock full access.",
        });
      } catch (error) {
        console.error('Error creating user profile:', error);
        toast({
          title: "Error",
          description: "Failed to join the community. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsCreatingProfile(false);
      }
    }
    
    // Navigate to contribution page
    navigate('/contribute');
  };

  const handleContributionComplete = () => {
    toast({
      title: "Congratulations!",
      description: "You've completed your contribution goal and now have full access to the library!",
    });
  };

  const handleSubscribe = async () => {
    if (!currentUser) {
      // Redirect to sign up
      return navigate('/register');
    }
    
    try {
      setIsProcessingPayment(true);
      
      // Create or update user profile if necessary
      const userProfile = await userProfileService.getCurrentUserProfile();
      
      if (!userProfile) {
        // Create a new user profile
        await userProfileService.createUserProfile({
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || '',
          photoURL: currentUser.photoURL || '',
          contributions: {
            count: 0,
            target: 3,
            completed: false,
            briefIds: []
          },
          membershipStatus: 'free',
        });
      }
      
      // Redirect to payment link
      redirectToPayment(currentUser.uid);
      
    } catch (error) {
      console.error('Error processing subscription:', error);
      toast({
        title: "Payment Error",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
      
      setIsProcessingPayment(false);
    }
  };
  
  return (
    <section id="pricing" className={`py-20 bg-muted/30 ${className}`}>
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">Access Premium Legal Content</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose between contributing or subscribing to gain full access to our comprehensive library of case briefs
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contribute Option */}
          <Card className="border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">Community Contribution</CardTitle>
              <CardDescription className="text-base">
                Join our community model
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl font-bold">Free</span>
                </div>
              </div>
              
              <ul className="mt-8 space-y-4">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Contribute 3 quality case briefs</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Receive lifetime access to all content</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Support the legal student community</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Share your knowledge with peers</span>
                </li>
              </ul>
                
                {currentUser && (
                  <div className="py-3">
                    <h4 className="font-medium mb-2">Your contribution progress:</h4>
                    <ContributionProgress 
                      onComplete={handleContributionComplete}
                    />
                  </div>
                )}
                
                <div className="border-t pt-6 mt-6">
                  <p className="text-sm mb-4">
                    Start contributing high-quality case briefs to gain full access to our library. Your contributions help fellow law students succeed.
                  </p>
                </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full py-6" 
                onClick={handleJoinCommunity}
                disabled={isCreatingProfile}
              >
                {isCreatingProfile ? 'Joining...' : 'Join the Community'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Start by browsing available briefs or creating your first contribution
              </p>
            </CardFooter>
          </Card>
          
          {/* Premium Subscription Option */}
          <Card className="border-2 border-primary shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-2">
              <div className="bg-primary text-primary-foreground text-xs font-medium py-1 px-3 rounded-full w-fit mx-auto mb-2">
                Premium Access
              </div>
              <CardTitle className="text-2xl font-bold">Monthly Subscription</CardTitle>
              <CardDescription className="text-base">
                Instant access without contributing
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl font-bold">$7</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              
              <ul className="mt-8 space-y-4">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Immediate access to all case briefs</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>No contribution requirement</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Cancel anytime</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Support the platform financially</span>
                </li>
              </ul>
                
                <div className="border-t pt-6 mt-6">
                  <p className="text-sm mb-4">
                    Get full access instantly without the contribution requirement. Perfect for busy students who need immediate access to quality case briefs.
                  </p>
                </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full py-6 bg-primary hover:bg-primary/90" 
                onClick={handleSubscribe}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? 'Processing...' : 'Subscribe for $7/month'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Secure payment via Stripe. Cancel anytime.
              </p>
            </CardFooter>
          </Card>
        </div>
        
        <div className="text-center mt-12 max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground">
            Both options provide the same level of access to our complete library of case briefs. 
            Choose the option that works best for you. Questions? <a href="mailto:support@lexgrove.com" className="text-primary underline">Contact support</a>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection; 