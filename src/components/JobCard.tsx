import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  BuildingOfficeIcon, 
  MapPinIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  ArrowTopRightOnSquareIcon,
  HomeIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Job } from '@/types/job';

// Utility function for relative time formatting
const getRelativeTimeString = (date: Date) => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Use Intl.RelativeTimeFormat for better i18n support and performance
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  
  if (diffDays === 0) return rtf.format(0, 'day');
  if (diffDays === 1) return rtf.format(-1, 'day');
  if (diffDays < 7) return rtf.format(-diffDays, 'day');
  if (diffDays < 30) return rtf.format(-Math.floor(diffDays / 7), 'week');
  if (diffDays < 365) return rtf.format(-Math.floor(diffDays / 30), 'month');
  return rtf.format(-Math.floor(diffDays / 365), 'year');
};

interface JobCardProps {
  job: Job;
  className?: string;
  onApply?: (job: Job) => void;
}

export const JobCard = ({
  job,
  className,
  onApply
}: JobCardProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (job.applyUrl.startsWith('mailto:')) {
      window.location.href = job.applyUrl;
    } else {
      window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
    }
    
    if (onApply) {
      onApply(job);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'part-time': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'internship': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'contract': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'student': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'entry-level': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'experienced': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on buttons or dialog triggers
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="dialog"]')) {
      return;
    }
    navigate(`/akazi/job/${job.id}`);
  };

  return (
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
          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <Badge className={getTypeColor(job.type)}>
                {t(`akazi.${job.type.replace('-', '_')}`)}
              </Badge>
              <Badge className={getLevelColor(job.level)}>
                {t(`akazi.${job.level.replace('-', '_')}`)}
              </Badge>
              {job.remote && (
                <Badge variant="outline" className="text-xs">
                  <HomeIcon className="w-3 h-3 mr-1" />
                  {t('akazi.remote')}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg font-medium line-clamp-2 leading-tight">
              {job.title}
            </CardTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <BuildingOfficeIcon className="w-4 h-4" />
              <span>{job.company}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPinIcon className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
            <div 
              className="flex items-center gap-1 min-h-[48px] items-center" 
              title={new Date(job.posted).toLocaleDateString()}
            >
              <ClockIcon className="w-4 h-4" />
              <span>{getRelativeTimeString(new Date(job.posted))}</span>
            </div>
          </div>
          
          {job.salary && (
            <div className="flex items-center gap-1 text-sm">
              <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-600">{job.salary}</span>
            </div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {job.shortDescription}
        </p>
        
        <div className="flex flex-wrap gap-1">
          {job.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {job.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{job.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div 
          className="text-xs text-muted-foreground flex items-center gap-1"
          title={new Date(job.posted).toLocaleDateString()}
        >
          <ClockIcon className="w-3.5 h-3.5" />
          {getRelativeTimeString(new Date(job.posted))}
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-3 text-xs transition-all duration-300 hover:bg-accent"
              >
                <EyeIcon className="h-3.5 w-3.5 mr-1" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge className={getTypeColor(job.type)}>
                    {t(`akazi.${job.type.replace('-', '_')}`)}
                  </Badge>
                  <Badge className={getLevelColor(job.level)}>
                    {t(`akazi.${job.level.replace('-', '_')}`)}
                  </Badge>
                  {job.remote && (
                    <Badge variant="outline" className="text-xs">
                      <HomeIcon className="w-3 h-3 mr-1" />
                      {t('akazi.remote')}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-xl font-semibold text-left">
                  {job.title}
                </DialogTitle>
                <DialogDescription className="text-left">
                  <div className="flex items-center gap-1 text-muted-foreground mb-2">
                    <BuildingOfficeIcon className="w-4 h-4" />
                    <span className="font-medium">{job.company}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                    <div 
                      className="flex items-center gap-1"
                      title={new Date(job.posted).toLocaleDateString()}
                    >
                      <ClockIcon className="w-4 h-4" />
                      <span>{getRelativeTimeString(new Date(job.posted))}</span>
                    </div>
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-1 text-sm mb-4">
                      <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-600">{job.salary}</span>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Job Description</h4>
                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {job.fullDescription}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Skills & Requirements</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {job.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleApply}
                    className="w-full"
                    size="sm"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                    Apply Now
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/akazi/job/${job.id}`)}
            className="h-8 px-3 text-xs transition-all duration-300 hover:bg-accent"
          >
            View Details
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-xs transition-all duration-300 hover:bg-accent"
            onClick={handleApply}
          >
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 mr-1" />
            {t('akazi.apply_now')}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default JobCard; 