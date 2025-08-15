import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { userProfileService } from '@/lib/services/userProfileService';
import { ContributionProgress } from '@/components/ContributionProgress';
import { Sparkles, Star } from 'lucide-react';

export function AuthButtons({ isMobile = false }: { isMobile?: boolean }) {
  const { currentUser, logout, membershipStatus, checkMembershipStatus } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [contributionStatus, setContributionStatus] = useState<{
    count: number;
    target: number;
    completed: boolean;
  } | null>(null);

  useEffect(() => {
    // Load user contribution status and membership status
    const loadUserStatus = async () => {
      if (currentUser) {
        try {
          // Check membership status
          await checkMembershipStatus();
          
          // Get user profile for contribution status
          const profile = await userProfileService.getCurrentUserProfile();
          if (profile) {
            setContributionStatus(profile.contributions);
          }
        } catch (error) {
          console.error('Error loading user status:', error);
        }
      }
    };

    loadUserStatus();
  }, [currentUser, checkMembershipStatus]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Get the user's initials for the avatar
  const getUserInitials = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email[0].toUpperCase();
    }
    return 'U';
  };

  if (currentUser) {
    // User is logged in, show avatar with dropdown
    if (isMobile) {
      // Mobile view
      return (
        <div className="py-4 flex flex-col space-y-4">
          {/* User info section */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar>
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              {membershipStatus === 'premium' && (
                <span className="absolute -top-1 -right-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-yellow-500" />
                </span>
              )}
              {membershipStatus === 'contributor' && (
                <span className="absolute -top-1 -right-1 bg-green-500 rounded-full w-3 h-3 border-2 border-background" />
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium truncate">
                {currentUser.displayName || currentUser.email}
              </span>
            </div>
          </div>
          
          {/* Buttons section - stacked for better mobile UX */}
          <div className="flex flex-col gap-2 w-full">
            <Link to="/my-library" className="w-full">
              <Button 
                variant="secondary" 
                size="sm"
                className="w-full justify-center"
              >
                My Library
              </Button>
            </Link>
            <Link to="/agora/dashboard" className="w-full">
              <Button 
                variant="secondary" 
                size="sm"
                className="w-full justify-center"
              >
                Dashboard
              </Button>
            </Link>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full justify-center"
            >
              {isLoggingOut ? 'Logging out...' : 'Sign out'}
            </Button>
          </div>
          
          {/* Show contribution status on mobile */}
          {contributionStatus && (
            <div className="p-3 bg-background rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Contribution Status</span>
                {membershipStatus === 'premium' && (
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 mr-1 fill-yellow-500" />
                    <span className="text-xs font-medium">Premium</span>
                  </div>
                )}
                {membershipStatus === 'contributor' && (
                  <div className="flex items-center text-green-500">
                    <Sparkles className="h-4 w-4 mr-1" />
                    <span className="text-xs font-medium">Contributor</span>
                  </div>
                )}
              </div>
              <ContributionProgress size="sm" />
            </div>
          )}
        </div>
      );
    }

    // Desktop view
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar>
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            {membershipStatus === 'premium' && (
              <span className="absolute -top-1 -right-1 text-yellow-500">
                <Star className="h-4 w-4 fill-yellow-500" />
              </span>
            )}
            {membershipStatus === 'contributor' && (
              <span className="absolute -top-1 -right-1 bg-green-500 rounded-full w-3 h-3 border-2 border-background" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="end" forceMount>
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {currentUser.displayName || 'User'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {currentUser.email}
              </p>
            </div>
          </DropdownMenuLabel>
          
          {/* Membership status in dropdown */}
          {contributionStatus && (
            <>
              <div className="px-2 py-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Membership Status</span>
                  {membershipStatus === 'premium' && (
                    <div className="flex items-center text-yellow-500">
                      <Star className="h-4 w-4 mr-1 fill-yellow-500" />
                      <span className="text-xs font-medium">Premium</span>
                    </div>
                  )}
                  {membershipStatus === 'contributor' && (
                    <div className="flex items-center text-green-500">
                      <Sparkles className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">Contributor</span>
                    </div>
                  )}
                </div>
                <ContributionProgress size="sm" />
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          
          <Link to="/my-library">
            <DropdownMenuItem>
              My Library
            </DropdownMenuItem>
          </Link>
          <Link to="/agora/dashboard">
            <DropdownMenuItem>
              Dashboard
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? 'Logging out...' : 'Sign out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // User is not logged in, show login/signup buttons
  if (isMobile) {
    // Mobile view
    return (
      <>
        <Link 
          to="/login" 
          className="py-4 text-[22px] font-normal transition-colors hover:text-primary"
        >
          Sign In
        </Link>
        <Link 
          to="/register" 
          className="py-4 text-[22px] font-normal transition-colors hover:text-primary"
        >
          Sign Up
        </Link>
      </>
    );
  }

  // Desktop view
  return (
    <>
      <Link to="/login">
        <Button variant="ghost" className="text-sm px-4 transition-all duration-200 hover:bg-accent mr-3">
          Sign In
        </Button>
      </Link>
      <Link to="/register">
        <Button className="bg-primary hover:bg-primary/90 text-sm px-4 transition-all duration-200">
          Sign Up
        </Button>
      </Link>
    </>
  );
} 