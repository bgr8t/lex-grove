import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { userProfileService } from '@/lib/services/userProfileService';
import { Button } from '@/components/ui/button';
import { ContributionProgress } from '@/components/ContributionProgress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PencilIcon, BookOpenIcon, ArrowRightIcon, CreditCardIcon, ArrowUpRightIcon, Sparkles } from 'lucide-react';
// import { CreateBriefModal } from '@/components/CreateBriefModal'; // Replaced with navigation
import { toast } from '@/components/ui/use-toast';
import { redirectToPayment } from '@/lib/services/stripeService';
import { Separator } from '@/components/ui/separator';

export default function Contribute() {
  const { currentUser, membershipStatus, checkMembershipStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // const [createModalOpen, setCreateModalOpen] = useState(false); // Replaced with navigation
  const [contributions, setContributions] = useState<{
    count: number;
    target: number;
    completed: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Get the return path from location state, or default to library
  const returnPath = location.state?.from?.pathname || '/library';

  useEffect(() => {
    // Check membership status first
    const checkUserStatus = async () => {
      if (currentUser) {
        try {
          // Ensure user profile exists
          let profile = await userProfileService.getCurrentUserProfile();
          if (!profile) {
            profile = await userProfileService.createUserProfile({
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              membershipStatus: 'contributor',
              contributions: {
                count: 0,
                target: 3,
                completed: false,
                briefIds: []
              }
            });
          }

          // If the user already has contributor or premium status, redirect them
          if (membershipStatus === 'contributor' || membershipStatus === 'premium') {
            navigate(returnPath, { replace: true });
            return;
          }
          
          // Force a fresh check of membership status
          const status = await checkMembershipStatus();
          if (status === 'contributor' || status === 'premium') {
            navigate(returnPath, { replace: true });
            return;
          }
          
          // Load user contribution status
          if (profile) {
            setContributions(profile.contributions);
            
            // If contributions are already completed, update status and redirect to library
            if (profile.contributions.completed) {
              // Ensure the status is set to contributor
              if (profile.membershipStatus !== 'contributor') {
                await userProfileService.update(profile.id!, {
                  membershipStatus: 'contributor',
                  updatedAt: Date.now()
                });
                await checkMembershipStatus();
              }
              navigate(returnPath, { replace: true });
            }
          }
        } catch (error) {
          console.error('Error loading contribution status:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, [currentUser, navigate, returnPath, membershipStatus, checkMembershipStatus]);

  const handleCreateBrief = () => {
    navigate('/create-brief');
  };

  const handleContributionComplete = () => {
    // Get the user ID
    const userId = currentUser?.uid;
    if (!userId) return;
    
    // Check if we've already shown the congrats message for this user
    const congratsShownKey = `congratsShown_${userId}`;
    const congratsShown = localStorage.getItem(congratsShownKey);
    
    // If we haven't shown it yet, show it now
    if (!congratsShown) {
      toast({
        title: "Congratulations!",
        description: "You've completed your contribution goal and now have full access to the library!",
      });
      
      // Mark that we've shown the congrats message
      localStorage.setItem(congratsShownKey, 'true');
    }
    
    // Redirect to library when contributions are complete
    navigate(returnPath, { replace: true });
  };

  const handleSubscribe = () => {
    if (!currentUser) {
      return navigate('/login');
    }
    
    try {
      setIsProcessingPayment(true);
      
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-24">
      <h1 className="text-3xl font-bold mb-8 text-center">Access the Library</h1>
      
      <div className="text-center mb-10">
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose between contributing case briefs or subscribing for immediate access
        </p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 mb-10">
        {/* Main Content */}
        <div className="flex-1">
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Contribute</CardTitle>
              <CardDescription>
                Share your knowledge with the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Submit 3 high-quality case briefs to unlock full library access
              </p>
              
              <div className="bg-muted/40 rounded-lg p-4 text-sm">
                <div className="flex items-center text-primary font-medium mb-2">
                  <BookOpenIcon className="h-4 w-4 mr-2" />
                  <span>{contributions?.count || 0} of {contributions?.target || 3} case briefs contributed</span>
                </div>
                <p>
                  Contribute quality briefs to support the community model.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleCreateBrief}
                className="w-full"
                variant="outline"
                disabled={contributions?.completed}
              >
                <PencilIcon className="h-4 w-4 mr-2" /> 
                Create a Case Brief
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Side Progress Box */}
        <div className="lg:w-80">
          <Card className="border border-border/50 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Your Progress</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ContributionProgress 
                className="mb-3" 
                onComplete={handleContributionComplete}
              />
              <p className="text-xs text-muted-foreground">
                Contribute 3 case briefs to gain full library access
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="bg-primary text-primary-foreground text-xs font-medium py-1 px-3 rounded-full w-fit mb-2">
              Premium Access
            </div>
            <CardTitle>Subscribe</CardTitle>
            <CardDescription>
              Get immediate access without contributing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="text-2xl font-bold mb-2">$7 <span className="text-sm font-normal text-muted-foreground">/month</span></h3>
            <p className="text-sm text-muted-foreground mb-6">
              Instant access to the complete library of case briefs
            </p>
            
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <ArrowRightIcon className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>Immediate full access to all case briefs</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRightIcon className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>No contribution requirement</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRightIcon className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>Cancel anytime</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSubscribe}
              className="w-full"
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <>Processing...</>
              ) : (
                <>
                  <CreditCardIcon className="h-4 w-4 mr-2" /> 
                  Subscribe Now
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Separator className="my-10" />
      
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-center">Why Join Lex Grove?</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Save Time</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                Focus on fewer cases but create high-quality briefs. Everyone benefits from shared knowledge.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Learn Better</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                Deepen your understanding through the briefing process and reviewing peer submissions.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Community</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                Join a community of law students helping each other succeed through knowledge sharing.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mt-8">
          <Button variant="link" onClick={() => navigate('/library')} className="gap-1">
            Browse the Library <ArrowUpRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* CreateBriefModal replaced with navigation to /create-brief */}
    </div>
  );
} 