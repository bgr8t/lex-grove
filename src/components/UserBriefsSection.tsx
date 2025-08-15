import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { caseBriefService } from '@/lib/services/caseBriefService';
import { CaseBrief } from '@/lib/models/caseBrief';
import { Brief } from './BriefCard';
import { BriefModal } from './BriefModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { 
  BookOpenIcon, 
  EyeIcon, 
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface UserBriefsSectionProps {
  className?: string;
}

export function UserBriefsSection({ className = '' }: UserBriefsSectionProps) {
  const [briefs, setBriefs] = useState<CaseBrief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Convert CaseBrief to Brief interface for compatibility with existing components
  const mapCaseBriefToBrief = (caseBrief: CaseBrief): Brief => {
    // Sanitize and validate data before mapping
    const sanitizedTitle = caseBrief.title?.trim() || 'Untitled Brief';
    const sanitizedFacts = caseBrief.facts?.substring(0, 150) || 'No facts available';
    const sanitizedCourt = caseBrief.court?.trim() || 'General';
    
    return {
      id: caseBrief.id || '',
      title: sanitizedTitle,
      snippet: sanitizedFacts + (caseBrief.facts && caseBrief.facts.length > 150 ? '...' : ''),
      courseName: sanitizedCourt,
      court: sanitizedCourt,
      date: formatDistanceToNow(new Date(caseBrief.createdAt), { addSuffix: true }),
      savedCount: Math.max(0, caseBrief.upvotes || 0),
      viewCount: Math.max(0, caseBrief.viewCount || 0),
      author: 'You',
      facts: caseBrief.facts || '',
      issue: caseBrief.issue || '',
      rule: caseBrief.holding || '', 
      analysis: caseBrief.reasoning || '',
      conclusion: caseBrief.holding || '',
      tags: Array.isArray(caseBrief.tags) ? caseBrief.tags : []
    };
  };

  useEffect(() => {
    let mounted = true;
    
    const loadUserBriefs = async () => {
      // Authentication check
      if (!currentUser?.uid) {
        setBriefs([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Efficient Firebase query - only get user's briefs, limited to 10 for performance
        const userBriefs = await caseBriefService.getUserBriefsPreview(currentUser.uid, 10);
        
        if (mounted) {
          // Validate and sanitize the received data
          const validBriefs = userBriefs.filter(brief => 
            brief && 
            brief.id && 
            brief.title && 
            brief.userId === currentUser.uid // Additional security check
          );
          
          setBriefs(validBriefs);
        }
      } catch (error) {
        console.error('Error loading user briefs:', error);
        if (mounted) {
          toast({
            title: "Error loading briefs",
            description: "Unable to load your case briefs. Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadUserBriefs();
    
    return () => {
      mounted = false;
    };
  }, [currentUser?.uid, toast]);

  const handleQuickView = (caseBrief: CaseBrief) => {
    // Security check - ensure user owns this brief
    if (caseBrief.userId !== currentUser?.uid) {
      toast({
        title: "Access denied",
        description: "You can only view your own briefs.",
        variant: "destructive",
      });
      return;
    }
    
    const brief = mapCaseBriefToBrief(caseBrief);
    setSelectedBrief(brief);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBrief(null);
  };

  const handleViewAllBriefs = () => {
    // Use React Router navigation instead of window.location for better UX
    window.location.href = '/library';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)} aria-label="Loading case briefs">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  // Authentication guard
  if (!currentUser) {
    return null;
  }

  // Empty state
  if (briefs.length === 0) {
    return (
      <div className={cn("text-center py-8 space-y-3", className)}>
        <ExclamationCircleIcon 
          className="h-12 w-12 text-muted-foreground mx-auto" 
          aria-hidden="true"
        />
        <div>
          <h3 className="text-sm font-medium text-foreground">No briefs yet</h3>
          <p className="text-xs text-muted-foreground">
            Create your first case brief to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            Your Case Briefs ({briefs.length})
          </h3>
          {briefs.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 px-3 min-h-[48px] sm:min-h-0 sm:h-6 sm:px-2 touch-target-large sm:touch-target-none"
              onClick={handleViewAllBriefs}
              aria-label="View all case briefs"
            >
              View all
            </Button>
          )}
        </div>
        
        <div className="space-y-2" role="list" aria-label="Case briefs list">
          {briefs.slice(0, 5).map((brief) => (
            <div
              key={brief.id}
              role="listitem"
              className="group p-4 sm:p-3 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm hover:border-border hover:shadow-sm transition-all duration-200 cursor-pointer min-h-[48px] touch-target-large"
              onClick={() => handleQuickView(brief)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleQuickView(brief);
                }
              }}
              tabIndex={0}
              aria-label={`View case brief: ${brief.title}`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                    {brief.title}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity min-h-[48px] sm:min-h-0 sm:h-6 sm:w-6 touch-target-large sm:touch-target-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickView(brief);
                    }}
                    aria-label={`Quick view ${brief.title}`}
                  >
                    <BookOpenIcon className="h-4 w-4 sm:h-3 sm:w-3" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                      {brief.court || 'General'}
                    </Badge>
                    <span>{formatDistanceToNow(new Date(brief.createdAt), { addSuffix: true })}</span>
                  </div>
                  
                  {brief.viewCount !== undefined && brief.viewCount > 0 && (
                    <div className="flex items-center gap-1" aria-label={`${brief.viewCount} views`}>
                      <EyeIcon className="h-3 w-3" aria-hidden="true" />
                      <span>{brief.viewCount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick View Modal */}
      {selectedBrief && (
        <BriefModal
          brief={selectedBrief}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
