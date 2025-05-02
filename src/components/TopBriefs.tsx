import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brief } from '@/components/BriefCard';
import { caseBriefService } from '@/lib/services/caseBriefService';
import { caseBriefToBrief } from '@/lib/utils';
import { EyeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface TopBriefsProps {
  className?: string;
}

const TopBriefs = ({ className }: TopBriefsProps) => {
  const navigate = useNavigate();
  const [topBriefs, setTopBriefs] = useState<Brief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, membershipStatus } = useAuth();
  
  // Check if user has premium access
  const hasPremiumAccess = currentUser && 
    (membershipStatus === 'premium' || membershipStatus === 'contributor');

  useEffect(() => {
    const fetchTopBriefs = async () => {
      try {
        setIsLoading(true);
        // Fetch the top briefs by view count (5 most viewed)
        const briefs = await caseBriefService.getTopViewedBriefs(5);
        const formattedBriefs = briefs.map(brief => caseBriefToBrief(brief));
        setTopBriefs(formattedBriefs);
      } catch (error) {
        console.error('Error fetching top briefs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopBriefs();
  }, []);
  
  // Handler for brief click
  const handleBriefClick = (briefId: string) => {
    if (hasPremiumAccess) {
      // Redirect to case brief page directly
      navigate(`/case-brief/${briefId}`);
    } else {
      // Redirect to library with search query
      navigate(`/library?q=${encodeURIComponent(briefId)}`);
    }
  };

  return (
    <section className={cn("py-16 bg-gradient-to-b from-muted/30 to-background", className)}>
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Most Popular Case Briefs</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {hasPremiumAccess 
              ? "Discover and access the most viewed case briefs on our platform." 
              : "Discover the most viewed case briefs on our platform. Sign up to access full content and contribute to our growing legal knowledge base."}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <>
            {topBriefs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {topBriefs.map((brief, index) => (
                  <div 
                    key={brief.id}
                    className={cn(
                      "relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md",
                      hasPremiumAccess && "cursor-pointer hover:scale-[1.02]",
                      index === 0 && "md:col-span-2 lg:col-span-3 md:flex md:items-center"
                    )}
                    onClick={hasPremiumAccess ? () => handleBriefClick(brief.id) : undefined}
                  >
                    {/* Top viewed badge for first brief */}
                    {index === 0 && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
                        Top Viewed
                      </div>
                    )}
                    
                    <div className={cn(
                      "p-6",
                      index === 0 && "md:flex-1"
                    )}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                          {brief.courseName}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">
                          <EyeIcon className="h-3 w-3 mr-1" />
                          {brief.viewCount || 0} views
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold line-clamp-2 mb-2">{brief.title}</h3>
                      
                      <p className="text-muted-foreground line-clamp-3 text-sm mb-4">
                        {brief.snippet}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {brief.author} • {brief.date}
                        </span>
                        
                        {!hasPremiumAccess && (
                          <div className="flex items-center text-muted-foreground gap-1 text-xs">
                            <LockClosedIcon className="h-3 w-3" />
                            Sign in to view
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* For the first item in larger screens, show a preview section */}
                    {index === 0 && (
                      <div className="hidden md:block md:w-1/3 bg-muted/30 p-6 border-l">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">Preview</h4>
                          {!hasPremiumAccess && (
                            <span className="inline-flex items-center text-xs text-muted-foreground">
                              <LockClosedIcon className="h-3 w-3 mr-1" />
                              Limited Access
                            </span>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div>
                            <span className="text-xs text-muted-foreground block mb-1">FACTS</span>
                            <p className="text-xs line-clamp-2 relative">
                              {brief.facts?.substring(0, 100)}
                              {!hasPremiumAccess && (
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background"></span>
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block mb-1">ISSUE</span>
                            <p className="text-xs line-clamp-2 relative">
                              {brief.issue?.substring(0, 100)}
                              {!hasPremiumAccess && (
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background"></span>
                              )}
                            </p>
                          </div>
                          <div className="pt-2 text-center">
                            {hasPremiumAccess ? (
                              <Button 
                                size="sm" 
                                className="w-full" 
                                variant="default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBriefClick(brief.id);
                                }}
                              >
                                Read Full Brief
                              </Button>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">
                                Sign in to access the full content
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">No case briefs available yet. Be the first to contribute!</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default TopBriefs; 