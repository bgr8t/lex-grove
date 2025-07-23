import { SearchBar } from './SearchBar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { SparklesIcon, BookOpenIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface HeroProps {
  className?: string;
  onSearch?: (query: string) => void;
}

export const Hero = ({ className, onSearch }: HeroProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    
    if (onSearch) {
      onSearch(query);
    } else {
      // If no onSearch provided, redirect to library with search query
      navigate(`/library?q=${encodeURIComponent(query)}`);
      
      toast({
        title: t('search.initiated'),
        description: `${t('search.searching_for')}: "${query}"`,
      });
    }
  };
  
  return (
    <section 
      className={cn(
        "relative w-full overflow-hidden pt-28 md:pt-36 pb-16 min-h-[90vh] flex items-center",
        "bg-gradient-to-br from-background via-muted/20 to-background",
        className
      )}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating orbs with neumorphic styling */}
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 blur-3xl animate-float-slow opacity-60"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-gradient-to-br from-accent/20 to-muted/30 blur-3xl animate-float-slow-reverse opacity-40"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-gradient-to-br from-primary/8 to-secondary/5 blur-2xl animate-pulse-subtle opacity-30"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-[length:50px_50px] opacity-20"></div>
      </div>
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* AI Badge with enhanced neumorphic styling */}
          <div className="inline-flex items-center mb-8 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border border-white/30 dark:border-gray-700/30 rounded-full px-4 py-2 shadow-lg animate-slide-down-fade">
              <SparklesIcon className="h-4 w-4 mr-2 text-primary animate-pulse-subtle inline" />
              <span className="text-sm font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AI-Powered Legal Assistant
              </span>
            </div>
          </div>
          
          {/* Main heading with staggered animation */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6 md:mb-8 text-balance leading-[1.1]">
            <span 
              className="inline-block opacity-0 animate-slide-up"
              style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
            >
              Master Your Legal Work
            </span>
            <br />
            <span 
              className="inline-block opacity-0 animate-slide-up"
              style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
            >
              in <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent font-medium">Minutes, Not Hours</span>
            </span>
          </h1>
          
          {/* Subtitle with fade-in animation */}
          <p 
            className="text-xl md:text-2xl text-muted-foreground mb-10 md:mb-12 max-w-3xl mx-auto text-balance leading-relaxed opacity-0 animate-fade-in"
            style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
          >
            Generate AI-powered case briefs, access a collaborative library of legal knowledge, and draft professional emails instantly. The ultimate legal assistant for students and professionals.
          </p>
          
          {/* CTA Buttons with enhanced neumorphic styling */}
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 opacity-0 animate-scale-up"
            style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}
          >
            <Button 
              size="lg" 
              className="h-14 px-8 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group relative overflow-hidden"
              onClick={() => navigate('/case-brief')}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <BookOpenIcon className="h-5 w-5 mr-2 relative z-10" />
              <span className="relative z-10">Generate Your First Brief for Free</span>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-8 text-base font-medium backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 border border-white/30 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <ChatBubbleBottomCenterTextIcon className="h-5 w-5 mr-2" />
              Explore Features
            </Button>
          </div>
          
          {/* Search section with enhanced styling */}
          <div 
            className="search-container opacity-0 animate-scale-up"
            style={{ animationDelay: '1000ms', animationFillMode: 'forwards' }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 rounded-2xl p-1 shadow-xl border border-white/30 dark:border-gray-700/30">
                <SearchBar 
                  onSearch={handleSearch} 
                  placeholder="Search thousands of case briefs..." 
                  showExamples={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative geometric elements */}
      <div className="absolute bottom-10 left-10 w-20 h-20 border border-primary/20 rounded-lg rotate-45 animate-float-slow opacity-30"></div>
      <div className="absolute top-32 right-16 w-16 h-16 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full animate-pulse-subtle"></div>
      <div className="absolute bottom-32 right-32 w-12 h-12 border-2 border-accent/30 rounded-full animate-subtle-bounce"></div>
    </section>
  );
};

export default Hero;
