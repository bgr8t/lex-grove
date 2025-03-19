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
        
        if (profile && mounted) {
          const { count, target, completed } = profile.contributions;
          setCount(count);
          setTarget(target);
          setProgress(Math.min(Math.floor((count / target) * 100), 100));
          
          // If completed, check if we've shown the message before
          if (completed && count >= target && onComplete) {
            // Get the localStorage key for this user
            const congratsShownKey = `congratsShown_${currentUser.uid}`;
            
            // Check if we've shown the congrats message before
            const congratsShown = localStorage.getItem(congratsShownKey);
            
            // If we haven't shown it yet, show it and mark as shown
            if (!congratsShown) {
              onComplete();
              localStorage.setItem(congratsShownKey, 'true');
            }
          }
        } else if (mounted) {
          // No profile found
          setProgress(0);
          setCount(0);
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