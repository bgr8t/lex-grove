import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { userProfileService } from '@/lib/services/userProfileService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface ContributionProgressProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'default' | 'lg';
  onComplete?: () => void;
}

export function ContributionProgress({
  className = '',
  showText = true,
  size = 'default',
  onComplete
}: ContributionProgressProps) {
  const [progress, setProgress] = useState(0);
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(3);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const loadProgress = async () => {
      if (!currentUser) {
        setProgress(0);
        setCount(0);
        setIsLoading(false);
        return;
      }
      
      try {
        // Get user profile
        const profile = await userProfileService.getCurrentUserProfile();
        
        if (profile && profile.contributions && mounted) {
          const { count, target, completed } = profile.contributions;
          setCount(count);
          setTarget(target);
          setProgress(Math.min(Math.floor((count / target) * 100), 100));
          
          // If completed and count meets target, update membership status
          if (count >= target) {
            // Check if membership status needs to be updated
            if (!completed || profile.membershipStatus !== 'contributor') {
              try {
                // Update both completed status and membership status
                await userProfileService.update(profile.id!, {
                  contributions: {
                    ...profile.contributions,
                    completed: true
                  },
                  membershipStatus: 'contributor'
                });
                
                console.log("Updated user to contributor status");
              } catch (error) {
                console.error("Error updating contributor status:", error);
              }
            }
            
            // Show congratulation message if needed
            if (completed && onComplete) {
              const congratsShownKey = `congratsShown_${currentUser.uid}`;
              const congratsShown = localStorage.getItem(congratsShownKey);
              
              if (!congratsShown) {
                onComplete();
                localStorage.setItem(congratsShownKey, 'true');
              }
            }
          }
        } else if (mounted) {
          // No profile found or no contributions data
          setProgress(0);
          setCount(0);
          
          // Initialize contributions if it doesn't exist and we have a profile
          if (profile && !profile.contributions && currentUser) {
            try {
              await userProfileService.update(profile.id!, {
                contributions: {
                  count: 0,
                  target: 3,
                  completed: false,
                  briefIds: []
                }
              });
            } catch (error) {
              console.error('Error initializing contributions:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading contribution progress:', error);
        if (mounted) {
          toast({
            title: "Error",
            description: "Failed to load contribution progress",
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadProgress();
    
    return () => {
      mounted = false;
    };
  }, [currentUser, toast, onComplete]);

  const getProgressSize = () => {
    switch (size) {
      case 'sm':
        return 'h-2';
      case 'lg':
        return 'h-4';
      default:
        return 'h-3';
    }
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className="animate-pulse bg-muted h-3 w-full rounded-full" />
        {showText && (
          <div className="animate-pulse bg-muted h-4 w-24 mt-2 rounded" />
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <Progress 
        value={progress} 
        className={cn(getProgressSize(), 
          progress === 100 ? "bg-green-500/20" : ""
        )}
      />
      {showText && (
        <div className="text-sm text-muted-foreground mt-1">
          {count} of {target} case briefs contributed
          {progress === 100 && (
            <span className="text-green-500 font-medium ml-1">
              (Complete!)
            </span>
          )}
        </div>
      )}
    </div>
  );
} 