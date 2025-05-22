import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Brief, BriefCard } from '@/components/BriefCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FolderIcon, 
  BookmarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { CreateCollectionModal } from '@/components/CreateCollectionModal';
import { BookmarkCollectionDialog } from '@/components/BookmarkCollectionDialog';
import { CollectionDetail } from '@/components/CollectionDetail';
import { CreateBriefModal } from '@/components/CreateBriefModal';
import { AuroraButton } from '@/components/ui/aurora-button';
import { useAuth } from '@/contexts/AuthContext';
import { caseBriefService } from '@/lib/services/caseBriefService';
import { caseBriefsToBriefs } from '@/lib/utils';
import { semanticSearchExamples } from '@/examples/semanticSearchExamples';
import { userProfileService } from '@/lib/services/userProfileService';
import { Collection as UserCollection } from '@/lib/models/userProfile';
import { caseBriefToBrief } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { FireIcon } from '@heroicons/react/24/solid';
import { useQuery } from '@tanstack/react-query';

// Add these suggested search terms
const SUGGESTED_SEARCH_TERMS = [
  "proximate cause", "miranda rights", "choice of law", "negligence", 
  "fifth amendment", "torts", "criminal procedure", "civil procedure",
  "constitutional law", "contracts", "property law", "legal precedent"
];

// Define the UI Collection type to match CreateCollectionModal's type
interface Collection {
  id: string;
  name: string;
  description: string;
  createdAt: Date | number;
  briefs: string[];
}

// Function to convert from UI Collection to User Profile Collection
function toUserCollection(collection: Collection): UserCollection {
  return {
    ...collection,
    createdAt: typeof collection.createdAt === 'number' 
      ? collection.createdAt 
      : collection.createdAt.getTime()
  };
}

// Function to convert from User Profile Collection to UI Collection
function toUICollection(collection: UserCollection): Collection {
  return {
    ...collection,
    createdAt: collection.createdAt
  };
}

const Library = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, membershipStatus, checkMembershipStatus } = useAuth();
  const isProLibrary = location.pathname === '/library/pro';
  const [savedBriefs, setSavedBriefs] = useState<Brief[]>([]);
  const [submittedBriefs, setSubmittedBriefs] = useState<Brief[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Brief[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [citationFormat, setCitationFormat] = useState<string>('mcgill');
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState<'all' | 'title' | 'content' | 'course'>('all');
  const { toast } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false);
  const [briefToBookmark, setBriefToBookmark] = useState<Brief | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionDetailOpen, setCollectionDetailOpen] = useState(false);
  const [createBriefOpen, setCreateBriefOpen] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allBriefsLoaded, setAllBriefsLoaded] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // React Query for community briefs
  const {
    data: communityBriefs = [],
    isLoading: isBriefsLoading,
    isFetching: isBriefsFetching,
    refetch: refetchBriefs,
  } = useQuery({
    queryKey: ['communityBriefs'],
    queryFn: async () => {
      const firebaseBriefs = await caseBriefService.getAllCommunityBriefs();
      return caseBriefsToBriefs(firebaseBriefs);
    },
    staleTime: 20 * 60 * 1000, // 20 minutes
    refetchOnWindowFocus: false,
    enabled: authChecked, // Only run after auth check
  });

  // Extract search query from URL parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const queryFromUrl = queryParams.get('q');
    
    if (queryFromUrl) {
      setSearchQuery(queryFromUrl);
      // Perform search with the query from URL
      performSearch(queryFromUrl);
    }
  }, [location.search]);
  
  // Function to perform search
  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setShowSearchResults(true);
    
    try {
      // Use semantic search with caseBriefService
      console.log(`Starting search for query: "${query}" with filter: ${searchFilter}`);
      const briefs = await caseBriefService.searchCaseBriefs(
        query,
        searchFilter,
        'relevant', // Default sort
        20 // Limit results
      );
      
      console.log(`Search returned ${briefs?.length || 0} results`);
      
      // Convert results to UI format - safely handle potentially null results
      const results = (briefs || []).map(brief => caseBriefToBrief(brief));
      
      setSearchResults(results);
      
      // Save to recent searches if not already in there
      if (!recentSearches.includes(query)) {
        const newRecentSearches = [query, ...recentSearches].slice(0, 5);
        setRecentSearches(newRecentSearches);
        // Could save to localStorage here
      }
      
      // Update URL to reflect the search query
      navigate(`/library?q=${encodeURIComponent(query)}`, { replace: true });
      
    } catch (error) {
      console.error('Search error:', error);
      // Log detailed error for debugging
      if (error instanceof Error) {
        console.error(`Error details: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      toast({
        title: "Search Error",
        description: "There was an error processing your search. Please try again.",
        variant: "destructive"
      });
      setSearchResults([]);
    }
  };

  // Check authentication and membership status immediately
  useEffect(() => {
    async function checkUserAccess() {
      try {
        if (currentUser) {
          const status = await checkMembershipStatus();
          
          // If user is on pro route but doesn't have access, redirect to public library
          if (isProLibrary && status !== 'contributor' && status !== 'premium') {
            navigate('/library');
            return;
          }
        }
      } catch (error) {
        console.error("Error checking library access:", error);
      } finally {
        setAuthChecked(true);
      }
    }
    
    checkUserAccess();
  }, [currentUser, navigate, checkMembershipStatus, isProLibrary]);

  // Suggested search terms based on the current input
  const suggestedTerms = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return SUGGESTED_SEARCH_TERMS.filter(term => 
      term.toLowerCase().includes(searchQuery.toLowerCase()) && 
      term.toLowerCase() !== searchQuery.toLowerCase()
    ).slice(0, 5);
  }, [searchQuery]);

  // Replace handleRefresh with React Query refetch
  const handleRefresh = async () => {
    try {
      await refetchBriefs();
      toast({
        title: 'Library refreshed',
        description: 'Your library has been updated with the latest content.'
      });
    } catch (error) {
      toast({
        title: 'Error refreshing library',
        description: 'Could not refresh community briefs. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(searchQuery);
  };

  const handleSuggestedSearch = async (term: string) => {
    setSearchQuery(term);
    await performSearch(term);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleCite = (brief: Brief) => {
    setSelectedBrief(brief);
  };

  const handleQuickView = (brief: Brief, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    setSelectedBrief(brief);
    setQuickViewOpen(true);
  };

  const handleViewFullBrief = (brief: Brief, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent other events if called from nested element
    }
    navigate(`/case-brief/${brief.id}`);
  };

  const handleCopyToClipboard = (citation: string) => {
    navigator.clipboard.writeText(citation);
    toast({
      title: "Citation copied",
      description: "The citation has been copied to your clipboard."
    });
  };

  const generateCitation = (brief: Brief, format: string): string => {
    switch (format) {
      case 'mcgill':
        return `${brief.title.split(' - ')[0]}, [${new Date().getFullYear()}] (${brief.author || 'Unknown'}).`;
      case 'apa':
        return `${brief.author || 'Unknown'} (${new Date().getFullYear()}). ${brief.title.split(' - ')[0]}.`;
      case 'mla':
        return `${brief.author || 'Unknown'}. "${brief.title.split(' - ')[0]}." ${new Date().getFullYear()}.`;
      case 'chicago':
        return `${brief.author || 'Unknown'}, "${brief.title.split(' - ')[0]}," ${new Date().getFullYear()}.`;
      default:
        return `${brief.title.split(' - ')[0]}, [${new Date().getFullYear()}] (${brief.author || 'Unknown'}).`;
    }
  };

  const handleCreateBrief = (brief: Brief, collectionId?: string) => {
    // First, add the brief to saved briefs
    setSavedBriefs(prev => {
      // Check if already exists to prevent duplication
      if (prev.some(b => b.id === brief.id)) {
        return prev;
      }
      return [brief, ...prev];
    });
    
    // If a collection ID was provided, add the brief to that collection
    if (collectionId) {
      setCollections(collections.map(collection => {
        if (collection.id === collectionId) {
          // Only add if not already in the collection
          if (!collection.briefs.includes(brief.id)) {
            return {
              ...collection,
              briefs: [...collection.briefs, brief.id]
            };
          }
        }
        return collection;
      }));
    }
    
    toast({
      title: "Brief created",
      description: `"${brief.title}" has been created${collectionId ? ' and added to collection' : ''} and shared with the community.`
    });
  };

  const handleCreateCollection = async (collection: Collection) => {
    try {
      // Add to local state first for immediate UI update
      setCollections(prev => [...prev, collection]);
      
      // Then persist to database if user is logged in
      if (currentUser) {
        // Convert to UserCollection before saving
        const userCollection = toUserCollection(collection);
        await userProfileService.createCollection(userCollection);
      }
      
      toast({
        title: "Collection created",
        description: `"${collection.name}" collection has been created.`
      });
      
      // If there was a brief in the process of being bookmarked, add it to the new collection
      if (briefToBookmark) {
        handleAddToCollection(briefToBookmark, collection.id);
        setBriefToBookmark(null);
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      toast({
        title: "Error creating collection",
        description: "Failed to save your collection. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBookmarkClick = async (brief: Brief, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent card click event
    }

    if (!currentUser) {
      navigate('/login');
      return;
    }
    // Check if already bookmarked
    if (savedBriefs.some(saved => saved.id === brief.id)) {
      try {
        // Remove from bookmarks in UI
        const filteredBriefs = savedBriefs.filter(b => b.id !== brief.id);
        setSavedBriefs(filteredBriefs);
        
        // Also remove from any collections
        const updatedCollections = collections.map(collection => {
          if (collection.briefs.includes(brief.id)) {
            return {
              ...collection,
              briefs: collection.briefs.filter(id => id !== brief.id)
            };
          }
          return collection;
        });
        
        setCollections(updatedCollections);
        
        // Persist to database
        if (currentUser) {
          // Remove from bookmarked briefs
          await userProfileService.removeBookmarkedBrief(brief.id);
          
          // Update collections that contained this brief
          for (const collection of collections) {
            if (collection.briefs.includes(brief.id)) {
              await userProfileService.removeBriefFromCollection(collection.id, brief.id);
            }
          }
        }
        
        toast({
          title: "Brief removed",
          description: "The brief has been removed from your bookmarks"
        });
      } catch (error) {
        console.error("Error removing bookmark:", error);
        toast({
          title: "Error removing bookmark",
          description: "Failed to remove the bookmark. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      // Show bookmark dialog
      setBriefToBookmark(brief);
      setBookmarkDialogOpen(true);
    }
  };
  
  const handleBookmarkOnly = async (brief: Brief) => {
    try {
      // Add to local state
      setSavedBriefs(prev => [...prev, brief]);
      
      // Persist to database
      if (currentUser) {
        await userProfileService.addBookmarkedBrief(brief.id);
      }
    } catch (error) {
      console.error("Error bookmarking brief:", error);
      toast({
        title: "Error bookmarking",
        description: "Failed to bookmark the brief. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleAddToCollection = async (brief: Brief, collectionId: string) => {
    try {
      // Add to bookmarks if not already there
      if (!savedBriefs.some(b => b.id === brief.id)) {
        setSavedBriefs(prev => [...prev, brief]);
        
        // Persist bookmark
        if (currentUser) {
          await userProfileService.addBookmarkedBrief(brief.id);
        }
      }
      
      // Add to the selected collection only if not already present
      setCollections(prev => {
        // Find the target collection
        const targetCollection = prev.find(c => c.id === collectionId);
        
        // If brief is already in collection, don't modify anything
        if (targetCollection && targetCollection.briefs.includes(brief.id)) {
          return prev;
        }
        
        // Otherwise, add brief to collection
        return prev.map(collection => {
          if (collection.id === collectionId) {
            return {
              ...collection,
              briefs: [...collection.briefs, brief.id]
            };
          }
          return collection;
        });
      });
      
      // Persist to database
      if (currentUser) {
        await userProfileService.addBriefToCollection(collectionId, brief.id);
      }
    } catch (error) {
      console.error("Error adding to collection:", error);
      toast({
        title: "Error adding to collection",
        description: "Failed to add the brief to the collection. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCollectionClick = (collection: Collection) => {
    setSelectedCollection(collection);
    setCollectionDetailOpen(true);
  };
  
  const handleRemoveFromCollection = async (collectionId: string, briefId: string) => {
    try {
      // Update the collection by removing the brief in UI
      setCollections(prev => 
        prev.map(collection => {
          if (collection.id === collectionId) {
            return {
              ...collection,
              briefs: collection.briefs.filter(id => id !== briefId)
            };
          }
          return collection;
        })
      );
      
      // Persist to database
      if (currentUser) {
        await userProfileService.removeBriefFromCollection(collectionId, briefId);
      }
      
      toast({
        title: "Brief removed",
        description: "The brief has been removed from the collection"
      });
    } catch (error) {
      console.error("Error removing from collection:", error);
      toast({
        title: "Error removing from collection",
        description: "Failed to remove the brief from the collection. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to handle search filter change
  const handleSearchFilterChange = (filter: 'all' | 'title' | 'content' | 'course') => {
    setSearchFilter(filter);
    // If there's an active search, re-run it with the new filter
    if (searchQuery.trim() && showSearchResults) {
      handleSearch(new Event('submit') as any);
    }
  };

  // Handle loading more briefs
  const handleLoadMore = async () => {
    try {
      setLoadingMore(true);
      
      // Get all briefs from Firebase (with a higher limit)
      const firebaseBriefs = await caseBriefService.getAllCommunityBriefs(100);
      const briefs = caseBriefsToBriefs(firebaseBriefs);
      
      if (briefs.length > 0) {
        // Mark that we've loaded all briefs
        setAllBriefsLoaded(true);
        
        toast({
          title: "All briefs loaded",
          description: `Showing all ${briefs.length} case briefs available in the library.`
        });
      } else {
        toast({
          title: "No additional briefs",
          description: "There are no more case briefs to load."
        });
      }
    } catch (error) {
      console.error("Error loading more briefs:", error);
      toast({
        title: "Error loading briefs",
        description: "Could not load additional briefs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        {/* Page Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Case Brief Library</h1>
              <p className="text-muted-foreground">
                {isProLibrary ? 'Full access to all case briefs and features' : 'Browse case briefs from the legal community'}
              </p>
            </div>
            {!isProLibrary && currentUser && membershipStatus !== 'premium' && membershipStatus !== 'contributor' && (
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                <p className="text-blue-800 dark:text-blue-200">
                  Want full access to all case briefs?{' '}
                  <Link to="/contribute" className="font-medium underline">
                    Contribute to unlock premium features
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Search Section */}
        <div className="max-w-7xl mx-auto mb-10 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-100 dark:border-blue-900">
          <div className="flex items-start gap-4 sm:gap-6 flex-col md:flex-row">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg sm:text-xl font-semibold">Search Legal Resources</h2>
              </div>

              {/* Search Input */}
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center mb-2 gap-2 sm:gap-3 text-sm">
                  <span className="font-medium">Search in:</span>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={searchFilter === 'all' ? 'secondary' : 'outline'} 
                      size="sm" 
                      onClick={() => handleSearchFilterChange('all')}
                      className="h-8 px-3 text-xs sm:text-sm"
                    >
                      All
                    </Button>
                    <Button 
                      variant={searchFilter === 'title' ? 'secondary' : 'outline'} 
                      size="sm" 
                      onClick={() => handleSearchFilterChange('title')}
                      className="h-8 px-3 text-xs sm:text-sm"
                    >
                      Case Titles
                    </Button>
                    <Button 
                      variant={searchFilter === 'content' ? 'secondary' : 'outline'} 
                      size="sm" 
                      onClick={() => handleSearchFilterChange('content')}
                      className="h-8 px-3 text-xs sm:text-sm"
                    >
                      Content
                    </Button>
                    <Button 
                      variant={searchFilter === 'course' ? 'secondary' : 'outline'} 
                      size="sm" 
                      onClick={() => handleSearchFilterChange('course')}
                      className="h-8 px-3 text-xs sm:text-sm"
                    >
                      Course
                    </Button>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl relative">
                <div className="flex-1 relative">
                  <Input 
                    type="text" 
                    placeholder="Search cases, legal concepts..." 
                    className="pr-10 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button 
                      type="button" 
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      <span className="sr-only">Clear search</span>
                    </button>
                  )}
                  
                  {/* Suggestions dropdown */}
                  {suggestedTerms.length > 0 && searchQuery && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
                      <ul className="py-1">
                        {suggestedTerms.map((term, index) => (
                          <li key={index}>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
                              onClick={() => handleSuggestedSearch(term)}
                            >
                              {term}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full sm:w-auto">
                  <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>
              
              <div className="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setCreateBriefOpen(true)} className="text-xs sm:text-sm h-8">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Create Brief
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Results Section */}
        {showSearchResults && (
          <div className="max-w-7xl mx-auto mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Search Results <span className="text-muted-foreground font-normal text-sm ml-2">({searchResults.length} briefs found)</span>
              </h2>
              <Button variant="ghost" size="sm" onClick={clearSearch}>
                <XMarkIcon className="h-4 w-4 mr-2" />
                Clear results
              </Button>
            </div>
            
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map(brief => (
                  <BriefCard 
                    key={brief.id}
                    brief={brief}
                    saved={savedBriefs.some(b => b.id === brief.id)}
                    onSave={() => handleBookmarkClick(brief)}
                    onOpen={() => handleViewFullBrief(brief)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium mb-1">No results found</h3>
                <p className="text-muted-foreground mb-4">Try one of these semantic search examples to see our AI in action:</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                  {semanticSearchExamples.slice(0, 6).map((term, index) => (
                    <Button 
                      key={index}
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleSuggestedSearch(term)}
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Two-Column Layout */}
        {!showSearchResults && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Community Briefs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">Community Briefs</h2>
                <p className="text-muted-foreground text-sm">
                  Briefs shared by law students and professionals
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9"
                onClick={handleRefresh}
                disabled={isBriefsFetching}
              >
                <ArrowPathIcon
                  className={`h-5 w-5 mr-2 ${isBriefsFetching ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                Refresh
              </Button>
            </div>
            
            {isBriefsLoading ? (
              <div className="flex items-center justify-center p-12 border rounded-lg">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  <p className="text-sm text-muted-foreground">Loading community briefs...</p>
                </div>
              </div>
            ) : (
              <>
                {communityBriefs.length > 0 ? (
                  <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                    {communityBriefs.map((brief) => (
                      <div 
                        key={brief.id} 
                        className="border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow duration-300 cursor-pointer"
                        onClick={() => handleViewFullBrief(brief)}
                      >
                        <div className="p-5">
                          <div className="flex flex-col h-full">
                            <div className="mb-2">
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted">{brief.courseName}</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-2 line-clamp-2">{brief.title}</h3>
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{brief.snippet}</p>
                            <div className="text-xs text-muted-foreground mb-4">
                              <span>{brief.author || 'Anonymous'}</span>
                              <span className="mx-2">•</span>
                              <span>{brief.date || 'Unknown date'}</span>
                            </div>
                            <div className="flex items-center justify-between mt-auto pt-3 border-t">
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => handleViewFullBrief(brief, e)} 
                                >
                                  View
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => handleQuickView(brief, e)} 
                                  className="flex items-center gap-1"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                  Quick view
                                </Button>
                              </div>
                              <div className="flex items-center gap-2">
                                {currentUser ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCite(brief);
                                        }}
                                      >
                                        <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                                        Cite
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        setCitationFormat('mcgill');
                                        handleCopyToClipboard(generateCitation(brief, 'mcgill'));
                                      }}>
                                        McGill Guide
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        setCitationFormat('apa');
                                        handleCopyToClipboard(generateCitation(brief, 'apa'));
                                      }}>
                                        APA
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        setCitationFormat('mla');
                                        handleCopyToClipboard(generateCitation(brief, 'mla'));
                                      }}>
                                        MLA
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        setCitationFormat('chicago');
                                        handleCopyToClipboard(generateCitation(brief, 'chicago'));
                                      }}>
                                        Chicago
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                ) : (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate('/login');
                                    }}
                                  >
                                    <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                                    Cite
                                  </Button>
                                )}
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className={`h-8 ${savedBriefs.some(saved => saved.id === brief.id) ? 'text-primary' : ''}`}
                                  onClick={(e) => handleBookmarkClick(brief, e)}
                                >
                                  {savedBriefs.some(saved => saved.id === brief.id) ? (
                                    <BookmarkSolidIcon className="h-4 w-4" />
                                  ) : (
                                    <BookmarkIcon className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg bg-muted/20">
                    <h3 className="text-lg font-medium mb-2">No community briefs found</h3>
                    <p className="text-muted-foreground mb-4">
                      Be the first to create a case brief and share it with the community!
                    </p>
                    <Button onClick={() => setCreateBriefOpen(true)}>Create Your First Brief</Button>
                  </div>
                )}
              </>
            )}
            
            {communityBriefs.length > 0 && !allBriefsLoaded && (
              <div className="flex justify-center mt-6">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore} 
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
          
          {/* Sidebar - Top 3 Most Viewed Briefs */}
          <div className="lg:col-span-1">
            <div className="border rounded-xl p-5 bg-card">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Top 3 Most Viewed</h2>
                  <p className="text-muted-foreground text-sm">
                    Most popular case briefs this week
                  </p>
                </div>
              </div>
              {/* Ranking List */}
              <TopViewedBriefsRanking limit={3} />
            </div>
          </div>
        </div>
        )}
      </main>
      <Footer className="mt-auto" />
      
      {/* Citation Dialog - Alternative to DropdownMenu if you prefer a dialog */}
      <Dialog>
        <DialogContent className="sm:max-w-md">
          {/* Visually hidden DialogTitle for accessibility */}
          <DialogTitle className="sr-only">Citation Formats</DialogTitle>
          <DialogHeader>
            <DialogTitle>Citation Formats</DialogTitle>
            <DialogDescription>
              Choose a citation format for this case brief.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedBrief && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">McGill Guide</h4>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm border rounded-md p-2 bg-muted/30 flex-1">
                      {generateCitation(selectedBrief, 'mcgill')}
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCopyToClipboard(generateCitation(selectedBrief, 'mcgill'))}
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">APA</h4>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm border rounded-md p-2 bg-muted/30 flex-1">
                      {generateCitation(selectedBrief, 'apa')}
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCopyToClipboard(generateCitation(selectedBrief, 'apa'))}
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Additional citation formats */}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Quick View Dialog */}
      <Dialog open={quickViewOpen} onOpenChange={setQuickViewOpen}>
        <DialogContent className="max-w-full sm:max-w-xl md:max-w-3xl w-[95%] sm:w-auto h-[90vh] sm:h-[80vh] p-4 sm:p-6 flex flex-col">
          <DialogHeader className="pb-2 space-y-2">
            <div className="flex items-center gap-2">
              {selectedBrief && (
                <Badge variant="outline" className="px-2 py-0.5 text-xs">
                  {selectedBrief.courseName}
                </Badge>
              )}
              <DialogTitle className="text-lg sm:text-xl">
                {selectedBrief?.title || 'Case Brief'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs sm:text-sm">
              Quick preview of this case brief. View the full brief for more details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto mt-2 sm:mt-4 pr-1 sm:pr-2">
            {selectedBrief && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-1">FACTS</h3>
                  <div className="text-xs sm:text-sm p-3 sm:p-4 bg-muted/20 rounded-md">
                    {selectedBrief.facts || 'No facts available.'}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-1">ISSUE</h3>
                  <div className="text-xs sm:text-sm p-3 sm:p-4 bg-muted/20 rounded-md">
                    {selectedBrief.issue || 'No issues available.'}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-1">RULE</h3>
                  <div className="text-xs sm:text-sm p-3 sm:p-4 bg-muted/20 rounded-md">
                    {selectedBrief.rule || 'No rule available.'}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-1">CONCLUSION</h3>
                  <div className="text-xs sm:text-sm p-3 sm:p-4 bg-muted/20 rounded-md">
                    {selectedBrief.conclusion || 'No conclusion available.'}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t pt-3 sm:pt-4 mt-2 sm:mt-4 gap-3 sm:gap-0">
            <div className="text-xs text-muted-foreground">
              <span>{selectedBrief?.author || 'Anonymous'}</span>
              <span className="mx-2">•</span>
              <span>{selectedBrief?.date || 'Unknown date'}</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setQuickViewOpen(false)}
                className="flex-1 sm:flex-none"
              >
                Close
              </Button>
              <Button 
                size="sm" 
                className="flex-1 sm:flex-none"
                onClick={() => {
                  setQuickViewOpen(false);
                  if (selectedBrief) {
                    handleViewFullBrief(selectedBrief);
                  }
                }}
              >
                View Full Brief
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <CreateCollectionModal
        open={createCollectionOpen}
        onOpenChange={setCreateCollectionOpen}
        onCreateCollection={handleCreateCollection}
      />
      
      <BookmarkCollectionDialog
        open={bookmarkDialogOpen}
        onOpenChange={setBookmarkDialogOpen}
        collections={collections}
        brief={briefToBookmark}
        onCreateCollectionClick={() => setCreateCollectionOpen(true)}
        onAddToCollection={handleAddToCollection}
        onBookmarkOnly={handleBookmarkOnly}
      />
      
      <CollectionDetail
        open={collectionDetailOpen}
        onOpenChange={setCollectionDetailOpen}
        collection={selectedCollection}
        allBriefs={Array.from(new Map(
          [...communityBriefs, ...savedBriefs].map(brief => [brief.id, brief])
        ).values())}
        onSaveBrief={handleBookmarkClick}
        onOpenBrief={handleViewFullBrief}
        onRemoveFromCollection={handleRemoveFromCollection}
      />
      
      {/* Create Brief Modal */}
      <CreateBriefModal
        open={createBriefOpen}
        onOpenChange={setCreateBriefOpen}
        collections={collections}
        onCreateBrief={handleCreateBrief}
        onCreateCollection={handleCreateCollection}
      />
    </div>
  );
};

function TopViewedBriefsRanking({ limit = 3 }: { limit?: number }) {
  const { data: briefs, isLoading, error } = useQuery<Brief[]>({
    queryKey: ['topViewedBriefs', limit],
    queryFn: () => caseBriefService.getTopViewedBriefs(limit).then(caseBriefsToBriefs),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="py-8 space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }
  if (error) {
    return <div className="text-center text-red-500 py-8">Failed to load top briefs.</div>;
  }
  if (!briefs || !briefs.length) {
    return <div className="text-center text-muted-foreground py-8">No briefs found.</div>;
  }
  return (
    <ol className="space-y-3">
      {briefs.map((brief, idx) => (
        <li key={brief.id}>
          <button
            className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent/10 transition-colors cursor-pointer text-left"
            onClick={() => window.location.href = `/case-brief/${brief.id}`}
            aria-label={`View ${brief.title}`}
            style={{ minHeight: 48 }}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-lg text-primary/80 flex items-center gap-1">
                {idx + 1}.
                {idx === 0 && <FireIcon className="h-5 w-5 text-red-500" title="Hottest" />}
                {idx === 1 && <FireIcon className="h-5 w-5 text-orange-400" title="2nd hottest" />}
                {idx === 2 && <FireIcon className="h-5 w-5 text-yellow-400" title="3rd hottest" />}
              </span>
              <span className="font-medium text-sm line-clamp-1 min-w-0 truncate">{brief.title}</span>
            </span>
            <span className="text-sm font-mono font-medium text-blue-900/80 text-right min-w-[60px]">
              {brief.viewCount} <span className="text-xs font-normal text-muted-foreground">views</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export default Library; 