import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookmarkIcon, DocumentTextIcon, ArrowTopRightOnSquareIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { BriefModal } from './BriefModal';
import { Badge } from '@/components/ui/badge';

export interface Brief {
  id: string;
  title: string;
  snippet: string;
  courseName: string;
  court?: string;
  date: string;
  savedCount: number;
  viewCount?: number;
  author: string;
  facts?: string;
  issue?: string;
  rule?: string;
  analysis?: string;
  conclusion?: string;
  summary?: string;
  tags?: string[]; // Array of tag strings
}

interface BriefCardProps {
  brief: Brief;
  className?: string;
  saved?: boolean;
  onSave?: (brief: Brief) => void;
  onOpen?: (brief: Brief) => void;
  actions?: React.ReactNode; // Custom actions to render in the card footer
}

export const BriefCard = ({
  brief,
  className,
  saved = false,
  onSave,
  onOpen,
  actions
}: BriefCardProps) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(saved);
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking save button
    setIsSaved(!isSaved);
    if (onSave) {
      onSave(brief);
    }
  };
  
  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking read button
    setIsModalOpen(true);
    if (onOpen) {
      onOpen(brief);
    }
  };

  const handleCardClick = () => {
    navigate(`/case-brief/${brief.id}`);
  };

  const handleCite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking cite button
  };
  
  return (
    <>
      <Card 
        className={cn(
          "overflow-hidden transition-all duration-300 border border-border/50 hover:border-border",
          "bg-card/80 backdrop-blur-sm hover:shadow-md cursor-pointer",
          isHovered ? "transform scale-[1.01]" : "",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <CardHeader className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {brief.courseName}
                </div>
                
                {/* Display tags if they exist */}
                {brief.tags && brief.tags.length > 0 && 
                  brief.tags.map((tag, index) => (
                    <Badge 
                      key={index}
                      variant="outline" 
                      className="text-xs px-2 py-0.5"
                    >
                      {tag}
                    </Badge>
                  ))
                }
              </div>
              <CardTitle className="text-lg font-medium line-clamp-2 leading-tight">
                {brief.title}
              </CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full transition-all duration-300 hover:bg-accent"
              onClick={handleSave} 
              aria-label="Save brief"
            >
              {isSaved ? (
                <BookmarkSolidIcon className="h-4 w-4 text-primary" />
              ) : (
                <BookmarkIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <p className="text-sm text-muted-foreground">
            {brief.snippet}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {brief.author} • {brief.date}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {actions ? (
              actions
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-xs transition-all duration-300 hover:bg-accent"
                  onClick={handleOpen}
                >
                  <BookOpenIcon className="h-3.5 w-3.5 mr-1" />
                  Read
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2 text-xs transition-all duration-300 hover:bg-accent"
                  onClick={handleCite}
                >
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 mr-1" />
                  Cite
                </Button>
              </>
            )}
          </div>
        </CardFooter>
      </Card>

      <BriefModal
        brief={brief}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSave}
        saved={isSaved}
      />
    </>
  );
};

export default BriefCard;
