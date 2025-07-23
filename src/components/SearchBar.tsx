import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
  className?: string;
  placeholder?: string;
  showExamples?: boolean;
}

const examples = [
  "Describe the elements of negligence",
  "Criminal procedure exclusionary rule", 
  "Contract law consideration doctrine",
  "When can hearsay evidence be admitted?"
];

export const SearchBar = ({
  onSearch,
  initialQuery = '',
  className,
  placeholder = "Search with AI-powered legal understanding...",
  showExamples = false
}: SearchBarProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = () => {
    if (!query.trim()) {
      toast({
        title: "Please enter a search query",
        description: "Your search query cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    onSearch(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    setTimeout(() => {
      onSearch(example);
    }, 100);
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Main search container */}
      <div className="relative group">
        {/* Background glow effect */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl transition-opacity duration-500",
          isFocused ? "opacity-100" : "opacity-0"
        )}></div>
        
        {/* Search input container */}
        <div className={cn(
          "relative flex items-center backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-2xl shadow-xl transition-all duration-300",
          "bg-white/90 dark:bg-gray-900/90",
          isFocused ? "scale-[1.02] shadow-2xl" : "hover:scale-[1.01]"
        )}>
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="search"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                "pl-12 pr-4 py-4 h-14 border-0 bg-transparent rounded-l-2xl transition-all duration-300",
                "text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0",
                "font-medium"
              )}
            />
            {/* Enhanced search icon */}
            <div className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300",
              isFocused ? "text-primary scale-110" : "text-muted-foreground"
            )}>
              <MagnifyingGlassIcon className="h-5 w-5" />
            </div>
          </div>
          
          {/* Enhanced search button */}
          <Button
            onClick={handleSearch}
            className={cn(
              "h-14 rounded-l-none rounded-r-2xl text-base px-8 font-medium relative overflow-hidden group border-0",
              "bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary",
              "shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10">Search</span>
          </Button>
        </div>
      </div>
      
      {/* Example queries */}
      {showExamples && (
        <div className="space-y-3">
          <div className="text-center">
            <span className="text-sm text-muted-foreground font-medium">Try these examples:</span>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className={cn(
                  "group relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 opacity-0 animate-slide-up",
                  "backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-white/30 dark:border-gray-700/30",
                  "hover:bg-white/80 dark:hover:bg-gray-900/80 hover:scale-105 hover:shadow-lg",
                  "hover:border-primary/30"
                )}
                style={{ 
                  animationDelay: `${800 + index * 100}ms`, 
                  animationFillMode: 'forwards' 
                }}
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <span className="relative z-10 flex items-center gap-2 text-muted-foreground group-hover:text-foreground">
                  <SparklesIcon className="h-3 w-3 text-primary group-hover:animate-pulse-subtle" />
                  {example}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
