
import { SearchBar } from './SearchBar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { SparklesIcon, BookOpenIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface HeroProps {
  className?: string;
  onSearch?: (query: string) => void;
}

export const Hero = ({ className, onSearch }: HeroProps) => {
  const { toast } = useToast();
  
  const handleSearch = (query: string) => {
    if (onSearch) {
      onSearch(query);
    } else {
      toast({
        title: "Search initiated",
        description: `Searching for: "${query}"`,
      });
    }
  };
  
  return (
    <section 
      className={cn(
        "relative w-full overflow-hidden hero-gradient pt-28 md:pt-36 pb-16",
        className
      )}
    >
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-16">
          <div className="inline-flex items-center mb-4 backdrop-blur-sm bg-accent/40 border border-border/50 rounded-full px-3 py-1 animate-fade-in">
            <SparklesIcon className="h-4 w-4 mr-2 text-primary" />
            <span className="text-sm font-medium">AI-Powered Legal Research</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-4 md:mb-6 text-balance animate-slide-down">
            <span className="text-primary">Lex Grove:</span> Legal Briefs With <span className="text-primary">Intelligent Search</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto text-balance animate-slide-down animate-delay-100">
            Access a database of case briefs created by law students, organized by an AI that understands your needs.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 animate-fade-in animate-delay-200">
            <Button 
              size="lg" 
              className="h-11 px-6 bg-[#384358] hover:bg-[#2b344a] transition-all duration-300"
            >
              <BookOpenIcon className="h-5 w-5 mr-2" />
              Browse Library
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-11 px-6 transition-all duration-300 hover:bg-accent"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <ChatBubbleBottomCenterTextIcon className="h-5 w-5 mr-2" />
              How It Works
            </Button>
          </div>
          
          <div className="search-container animate-scale-in animate-delay-300">
            <SearchBar 
              onSearch={handleSearch} 
              placeholder="Search cases, legal concepts, or doctrines..." 
              showExamples={true}
            />
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
    </section>
  );
};

export default Hero;
