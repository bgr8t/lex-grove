
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
  placeholder = "Search for legal briefs, cases, or concepts...",
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
    <div className={cn("w-full space-y-2", className)}>
      <div className={cn(
        "relative flex items-center transition-all duration-300 ease-in-out",
        isFocused ? "scale-[1.02] transform" : ""
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
              "pl-10 pr-4 py-6 border border-input bg-white dark:bg-black rounded-l-xl transition-all duration-200",
              isFocused ? "border-primary ring-1 ring-primary/20" : "",
              "text-base placeholder:text-muted-foreground/70"
            )}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        <Button
          onClick={handleSearch}
          className={cn(
            "h-[56px] rounded-l-none rounded-r-xl text-sm px-5 py-6",
            "bg-[#384358] hover:bg-[#2b344a] transition-all duration-300",
            "font-medium shadow-none border-0"
          )}
        >
          Search
        </Button>
      </div>
      
      {showExamples && (
        <div className="flex flex-wrap justify-center gap-2 mt-3 animate-fade-in">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs text-primary bg-accent/50 border border-border/50 transition-all duration-300",
                "hover:bg-accent hover:border-primary/20 hover:shadow-sm",
                "animate-scale-in",
                `animate-delay-${(index + 1) * 100}`
              )}
            >
              <span className="flex items-center gap-1">
                <SparklesIcon className="h-3 w-3" />
                {example}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
