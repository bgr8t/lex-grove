
import { useState, useEffect } from 'react';
import { Brief, BriefCard } from './BriefCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { SearchBar } from './SearchBar';
import { useToast } from '@/components/ui/use-toast';
import { FunnelIcon, ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface SearchResultsProps {
  query: string;
  results: Brief[];
  loading?: boolean;
  onSearch: (query: string) => void;
  className?: string;
}

export const SearchResults = ({
  query,
  results,
  loading = false,
  onSearch,
  className
}: SearchResultsProps) => {
  const [activeTab, setActiveTab] = useState('all');
  const [savedBriefs, setSavedBriefs] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOption, setSortOption] = useState('relevant');
  const { toast } = useToast();
  
  const handleSave = (brief: Brief) => {
    if (savedBriefs.includes(brief.id)) {
      setSavedBriefs(savedBriefs.filter(id => id !== brief.id));
      toast({
        title: "Brief removed",
        description: "The brief has been removed from your library",
      });
    } else {
      setSavedBriefs([...savedBriefs, brief.id]);
      toast({
        title: "Brief saved",
        description: "The brief has been added to your library",
      });
    }
  };
  
  const handleOpen = (brief: Brief) => {
    toast({
      title: "Opening brief",
      description: `Opening "${brief.title}"`,
    });
  };
  
  const filteredResults = results.filter(brief => {
    if (activeTab === 'all') return true;
    if (activeTab === 'saved') return savedBriefs.includes(brief.id);
    return brief.courseName.toLowerCase() === activeTab;
  });
  
  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortOption === 'recent') {
      // Sort by date (most recent first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortOption === 'popular') {
      // Sort by saved count
      return b.savedCount - a.savedCount;
    }
    // Default sort (by relevance)
    return 0;
  });
  
  return (
    <section className={cn("py-8", className)}>
      <div className="container px-4 mx-auto">
        <div className="search-container mb-8">
          <SearchBar 
            onSearch={onSearch} 
            initialQuery={query} 
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters sidebar */}
          <div className="w-full md:w-64 space-y-6">
            <div className="glass-panel p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Filters</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 md:hidden"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <div className={cn(
                "space-y-4 transition-all duration-300",
                filterOpen ? "block" : "hidden md:block"
              )}>
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Sort By</h4>
                  <RadioGroup value={sortOption} onValueChange={setSortOption}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="relevant" id="sort-relevant" />
                      <Label htmlFor="sort-relevant" className="text-sm cursor-pointer">Most Relevant</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="recent" id="sort-recent" />
                      <Label htmlFor="sort-recent" className="text-sm cursor-pointer">Most Recent</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="popular" id="sort-popular" />
                      <Label htmlFor="sort-popular" className="text-sm cursor-pointer">Most Popular</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Courses</h4>
                  {Array.from(new Set(results.map(brief => brief.courseName))).map((course) => (
                    <div key={course} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`course-${course}`}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <Label htmlFor={`course-${course}`} className="text-sm cursor-pointer">{course}</Label>
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full transition-all duration-300 hover:bg-accent"
                >
                  <FunnelIcon className="h-3.5 w-3.5 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
          
          {/* Results area */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <h2 className="text-xl font-medium mb-2 md:mb-0">
                {loading ? (
                  "Searching..."
                ) : (
                  <>Results for <span className="text-primary">"{query}"</span></>
                )}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{sortedResults.length} results</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full transition-all duration-300 hover:bg-accent"
                  onClick={() => onSearch(query)}
                  aria-label="Refresh results"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Tabs 
              defaultValue="all" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full mb-6"
            >
              <TabsList className="w-full sm:w-auto mb-6 bg-muted/80 backdrop-blur-sm">
                <TabsTrigger value="all" className="text-sm">
                  All Results
                </TabsTrigger>
                <TabsTrigger value="saved" className="text-sm">
                  Saved
                </TabsTrigger>
                {Array.from(new Set(results.map(brief => brief.courseName)))
                  .slice(0, 2)
                  .map((course) => (
                    <TabsTrigger key={course} value={course.toLowerCase()} className="text-sm hidden md:flex">
                      {course}
                    </TabsTrigger>
                  ))}
              </TabsList>
              
              <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div 
                      key={i} 
                      className="h-40 rounded-xl bg-accent/30 animate-pulse"
                    />
                  ))
                ) : sortedResults.length > 0 ? (
                  sortedResults.map((brief, index) => (
                    <BriefCard
                      key={brief.id}
                      brief={brief}
                      saved={savedBriefs.includes(brief.id)}
                      onSave={handleSave}
                      onOpen={handleOpen}
                      className={`animate-scale-in animate-delay-${index % 4 * 100}`}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground mb-4">No results found for this query.</p>
                    <Button onClick={() => onSearch("Contract law")}>
                      Try a different search
                    </Button>
                  </div>
                )}
              </div>
              
              {sortedResults.length > 0 && !loading && (
                <div className="flex justify-center mt-8">
                  <Button variant="outline" className="transition-all duration-300 hover:bg-accent">
                    Load More Results
                  </Button>
                </div>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchResults;
