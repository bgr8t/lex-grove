import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { sampleBriefs } from '@/data/sampleBriefs';
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
import { CreateCollectionModal, Collection } from '@/components/CreateCollectionModal';
import { BookmarkCollectionDialog } from '@/components/BookmarkCollectionDialog';
import { CollectionDetail } from '@/components/CollectionDetail';
import { CreateBriefModal } from '@/components/CreateBriefModal';
import { AuroraButton } from '@/components/ui/aurora-button';
import { useAuth } from '@/contexts/AuthContext';
import { caseBriefService } from '@/lib/services/caseBriefService';
import { caseBriefsToBriefs } from '@/lib/utils';
import { semanticSearchExamples } from '@/examples/semanticSearchExamples';
import { userProfileService } from '@/lib/services/userProfileService';

// Add these suggested search terms
const SUGGESTED_SEARCH_TERMS = [
  "proximate cause", "miranda rights", "choice of law", "negligence", 
  "fifth amendment", "torts", "criminal procedure", "civil procedure",
  "constitutional law", "contracts", "property law", "legal precedent"
];

const Library = () => {
  const navigate = useNavigate();
  const { currentUser, membershipStatus, checkMembershipStatus } = useAuth();
  const [savedBriefs, setSavedBriefs] = useState<Brief[]>([]);
  const [communityBriefs, setCommunityBriefs] = useState<Brief[]>([]);
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
  const [searchHelpOpen, setSearchHelpOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allBriefsLoaded, setAllBriefsLoaded] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Check authentication and membership status immediately
  useEffect(() => {
    async function checkUserAccess() {
      try {
        if (currentUser) {
          // Check membership status first
          const status = await checkMembershipStatus();
          console.log('Library: Membership status check result:', status);
          
          // If status is still null, check if we need to update it
          if (status === null) {
            console.log('Library: User status is null, checking contributions');
            const profile = await userProfileService.getCurrentUserProfile();
            
            if (profile && profile.contributions && profile.contributions.completed) {
              console.log('Library: User has completed contributions, updating status to contributor');
              await userProfileService.update(profile.id!, {
                membershipStatus: 'contributor',
                updatedAt: Date.now()
              });
              
              // Check again
              await checkMembershipStatus();
            } else {
              console.log('Library: User has not completed contributions, redirecting to home');
              // User is authenticated but doesn't have access - redirect
              toast({
                title: "Access Required",
                description: "Complete your contributions or upgrade to access the library.",
                variant: "destructive",
              });
              navigate('/');
              return;
            }
          }
        }
      } catch (error) {
        console.error("Error checking library access:", error);
      } finally {
        setAuthChecked(true);
      }
    }
    
    checkUserAccess();
  }, [currentUser, navigate, checkMembershipStatus]);

  // Suggested search terms based on the current input
  const suggestedTerms = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return SUGGESTED_SEARCH_TERMS.filter(term => 
      term.toLowerCase().includes(searchQuery.toLowerCase()) && 
      term.toLowerCase() !== searchQuery.toLowerCase()
    ).slice(0, 5);
  }, [searchQuery]);

  // Load community briefs on component mount
  useEffect(() => {
    // Only load briefs if auth check is complete and user has access
    if (!authChecked) return;
    
    let mounted = true;
    
    async function loadBriefs() {
      try {
        setIsLoading(true);
        // Fetch community briefs from Firebase
        const firebaseBriefs = await caseBriefService.getAllCommunityBriefs();
        const briefs = caseBriefsToBriefs(firebaseBriefs);
        
        // Only update state if component is still mounted
        if (!mounted) return;
        
        // If we have briefs from Firebase, use those
        if (briefs.length > 0) {
          setCommunityBriefs(briefs);
        } else {
          // Fallback to sample briefs if no community briefs exist yet
          setCommunityBriefs(sampleBriefs.slice(0, 6));
        }
        
        // Load saved briefs for current user if logged in
        if (currentUser) {
          const userBriefs = await caseBriefService.getCaseBriefsByUser(currentUser.uid);
          const userBriefsFormatted = caseBriefsToBriefs(userBriefs);
          
          if (!mounted) return;
          
          if (userBriefsFormatted.length > 0) {
            // Set user's submitted briefs
            setSubmittedBriefs(userBriefsFormatted);
            setSavedBriefs(userBriefsFormatted);
          } else {
            // Fallback to sample briefs if user has no saved briefs
            setSubmittedBriefs([]);
            setSavedBriefs(sampleBriefs.slice(0, 3));
          }
        } else {
          setSubmittedBriefs([]);
          setSavedBriefs(sampleBriefs.slice(0, 3));
        }
      } catch (error) {
        console.error("Error loading briefs:", error);
        
        if (!mounted) return;
        
        // Fallback to sample data if loading fails
        setCommunityBriefs(sampleBriefs.slice(0, 6));
        setSubmittedBriefs([]);
        setSavedBriefs(sampleBriefs.slice(0, 3));
        
        toast({
          title: "Error loading briefs",
          description: "Could not load community briefs. Showing sample data instead.",
          variant: "destructive",
        });
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    
    loadBriefs();
    
    return () => {
      mounted = false;
    };
  }, [currentUser, authChecked]);

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      // Refresh briefs from Firebase
      const firebaseBriefs = await caseBriefService.getAllCommunityBriefs();
      const briefs = caseBriefsToBriefs(firebaseBriefs);
      
      if (briefs.length > 0) {
        setCommunityBriefs(briefs);
      }
      
      toast({
        title: "Library refreshed",
        description: "Your library has been updated with the latest content."
      });
    } catch (error) {
      console.error("Error refreshing briefs:", error);
      toast({
        title: "Error refreshing library",
        description: "Could not refresh community briefs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      return;
    }
    
    // Add to recent searches
    setRecentSearches(prev => {
      const newSearches = [searchQuery, ...prev.filter(s => s !== searchQuery)].slice(0, 5);
      return newSearches;
    });
    
    setIsLoading(true);
    
    try {
      // Search for briefs using the new search functionality
      const searchResults = await caseBriefService.searchCaseBriefs(
        searchQuery,
        searchFilter,
        'relevant',
        20
      );
      
      // Convert to UI Brief model
      const results = caseBriefsToBriefs(searchResults);
      
      setSearchResults(results);
      setShowSearchResults(true);
      
      toast({
        title: results.length > 0 ? "Search results found" : "No results found",
        description: results.length > 0 
          ? `Found ${results.length} briefs matching "${searchQuery}"`
          : `No briefs found matching "${searchQuery}". Try different keywords.`
      });
    } catch (error) {
      console.error("Error searching briefs:", error);
      toast({
        title: "Search error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
      
      // Fallback to sample briefs if search fails
      const query = searchQuery.toLowerCase().trim();
      const results = sampleBriefs.filter(brief => {
        // Apply filter based on selected search scope
        if (searchFilter === 'title') {
          return brief.title.toLowerCase().includes(query);
        }
        
        if (searchFilter === 'content') {
          return (
            (brief.facts?.toLowerCase().includes(query) || false) ||
            (brief.issue?.toLowerCase().includes(query) || false) ||
            (brief.rule?.toLowerCase().includes(query) || false) ||
            (brief.analysis?.toLowerCase().includes(query) || false) ||
            (brief.conclusion?.toLowerCase().includes(query) || false) ||
            brief.snippet.toLowerCase().includes(query)
          );
        }
        
        if (searchFilter === 'course') {
          return brief.courseName.toLowerCase().includes(query);
        }
        
        // If filter is 'all', search in all fields
        return (
          brief.title.toLowerCase().includes(query) ||
          brief.snippet.toLowerCase().includes(query) ||
          (brief.facts?.toLowerCase().includes(query) || false) ||
          (brief.issue?.toLowerCase().includes(query) || false) ||
          (brief.rule?.toLowerCase().includes(query) || false) ||
          (brief.analysis?.toLowerCase().includes(query) || false) ||
          (brief.conclusion?.toLowerCase().includes(query) || false) ||
          brief.courseName.toLowerCase().includes(query) ||
          brief.author.toLowerCase().includes(query)
        );
      });
      
      setSearchResults(results);
      setShowSearchResults(true);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleSuggestedSearch = async (term: string) => {
    setSearchQuery(term);
    
    // Add to recent searches
    setRecentSearches(prev => {
      const newSearches = [term, ...prev.filter(s => s !== term)].slice(0, 5);
      return newSearches;
    });
    
    setIsLoading(true);
    
    try {
      // Search for briefs using the new search functionality
      const searchResults = await caseBriefService.searchCaseBriefs(
        term,
        searchFilter,
        'relevant',
        20
      );
      
      // Convert to UI Brief model
      const results = caseBriefsToBriefs(searchResults);
      
      setSearchResults(results);
      setShowSearchResults(true);
      
      toast({
        title: results.length > 0 ? "Search results found" : "No results found",
        description: results.length > 0 
          ? `Found ${results.length} briefs matching "${term}"`
          : `No briefs found matching "${term}". Try different keywords.`
      });
    } catch (error) {
      console.error("Error searching briefs:", error);
      toast({
        title: "Search error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
      
      // Fallback to sample briefs if search fails
      const query = term.toLowerCase().trim();
      const results = sampleBriefs.filter(brief => {
        if (searchFilter === 'title') {
          return brief.title.toLowerCase().includes(query);
        }
        
        if (searchFilter === 'content') {
          return (
            (brief.facts?.toLowerCase().includes(query) || false) ||
            (brief.issue?.toLowerCase().includes(query) || false) ||
            (brief.rule?.toLowerCase().includes(query) || false) ||
            (brief.analysis?.toLowerCase().includes(query) || false) ||
            (brief.conclusion?.toLowerCase().includes(query) || false) ||
            brief.snippet.toLowerCase().includes(query)
          );
        }
        
        if (searchFilter === 'course') {
          return brief.courseName.toLowerCase().includes(query);
        }
        
        return (
          brief.title.toLowerCase().includes(query) ||
          brief.snippet.toLowerCase().includes(query) ||
          (brief.facts?.toLowerCase().includes(query) || false) ||
          (brief.issue?.toLowerCase().includes(query) || false) ||
          (brief.rule?.toLowerCase().includes(query) || false) ||
          (brief.analysis?.toLowerCase().includes(query) || false) ||
          (brief.conclusion?.toLowerCase().includes(query) || false) ||
          brief.courseName.toLowerCase().includes(query) ||
          brief.author.toLowerCase().includes(query)
        );
      });
      
      setSearchResults(results);
      setShowSearchResults(true);
    } finally {
      setIsLoading(false);
    }
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
    setSavedBriefs(prev => [brief, ...prev]);
    
    // Also add the brief to community briefs
    setCommunityBriefs(prev => [brief, ...prev]);
    
    // If a collection ID was provided, add the brief to that collection
    if (collectionId) {
      setCollections(collections.map(collection => {
        if (collection.id === collectionId) {
          return {
            ...collection,
            briefs: [...collection.briefs, brief.id]
          };
        }
        return collection;
      }));
    }
    
    toast({
      title: "Brief created",
      description: `"${brief.title}" has been created${collectionId ? ' and added to collection' : ''} and shared with the community.`
    });
  };

  const handleCreateCollection = (collection: Collection) => {
    setCollections(prev => [...prev, collection]);
    toast({
      title: "Collection created",
      description: `"${collection.name}" collection has been created.`
    });
    
    // If there was a brief in the process of being bookmarked, add it to the new collection
    if (briefToBookmark) {
      handleAddToCollection(briefToBookmark, collection.id);
      setBriefToBookmark(null);
    }
  };

  const handleBookmarkClick = (brief: Brief, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent card click event
    }
    
    // Check if already bookmarked
    if (savedBriefs.some(saved => saved.id === brief.id)) {
      // Remove from bookmarks
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
      
      toast({
        title: "Brief removed",
        description: "The brief has been removed from your bookmarks"
      });
    } else {
      // Show bookmark dialog
      setBriefToBookmark(brief);
      setBookmarkDialogOpen(true);
    }
  };
  
  const handleBookmarkOnly = (brief: Brief) => {
    setSavedBriefs(prev => [...prev, brief]);
  };
  
  const handleAddToCollection = (brief: Brief, collectionId: string) => {
    // Add to bookmarks if not already there
    if (!savedBriefs.some(b => b.id === brief.id)) {
      setSavedBriefs(prev => [...prev, brief]);
    }
    
    // Add to the selected collection
    setCollections(prev => 
      prev.map(collection => {
        if (collection.id === collectionId) {
          // Avoid duplicates
          if (!collection.briefs.includes(brief.id)) {
            return {
              ...collection,
              briefs: [...collection.briefs, brief.id]
            };
          }
        }
        return collection;
      })
    );
  };

  const handleCollectionClick = (collection: Collection) => {
    setSelectedCollection(collection);
    setCollectionDetailOpen(true);
  };
  
  const handleRemoveFromCollection = (collectionId: string, briefId: string) => {
    // Update the collection by removing the brief
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
    
    toast({
      title: "Brief removed",
      description: "The brief has been removed from the collection"
    });
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
        // Update the community briefs with all briefs
        setCommunityBriefs(briefs);
        
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
          <h1 className="text-3xl font-bold mb-2">Case Brief Library</h1>
          <p className="text-muted-foreground">
            Discover and explore case briefs from the legal community
          </p>
        </div>

        {/* Intelligent Search-Powered Research Section */}
        <div className="max-w-7xl mx-auto mb-10 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-100 dark:border-blue-900">
          <div className="flex items-start gap-4 sm:gap-6 flex-col md:flex-row">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg sm:text-xl font-semibold">Intelligent Search-Powered Legal Research</h2>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Use our advanced intelligent search to find relevant case briefs, analyze legal concepts, or get insights on specific cases. 
                Powered by Voyage AI's "voyage-law-2" legal embeddings model for semantic understanding of legal concepts.
              </p>
              
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
              
              <div className="mt-3 flex justify-between items-center">
                <Button variant="link" size="sm" className="text-xs sm:text-sm p-0 h-auto" onClick={() => setSearchHelpOpen(true)}>
                  How to use intelligent search
                </Button>
                
                <Button variant="ghost" size="sm" onClick={() => setCreateBriefOpen(true)} className="text-xs sm:text-sm h-8 mt-2 sm:mt-0">
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>
                    Loading...
                  </span>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
            
            {isLoading ? (
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
          
          {/* Sidebar - Personal Library */}
          <div className="lg:col-span-1">
            <div className="border rounded-xl p-5 bg-card">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Your Library</h2>
                  <p className="text-muted-foreground text-sm">
                    Your saved briefs and collections
                  </p>
                </div>
              </div>

              {/* Submitted Briefs Section */}
              {currentUser && submittedBriefs.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium flex items-center gap-1.5">
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      Your Submitted Briefs
                    </h3>
                    <Button variant="link" size="sm" className="h-auto p-0">
                      View All
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {submittedBriefs.slice(0, 3).map((brief) => (
                      <div 
                        key={brief.id} 
                        className="p-3 border rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                        onClick={() => handleViewFullBrief(brief)}
                      >
                        <h4 className="font-medium text-sm line-clamp-1">{brief.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{brief.courseName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved Briefs Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-1.5">
                    <BookmarkIcon className="h-4 w-4" />
                    Bookmarked Briefs
                  </h3>
                  <Button variant="link" size="sm" className="h-auto p-0">
                    View All
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {savedBriefs.length > 0 ? (
                    <>
                      {savedBriefs.map((brief) => (
                        <div 
                          key={brief.id} 
                          className="p-3 border rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                          onClick={() => handleViewFullBrief(brief)}
                        >
                          <h4 className="font-medium text-sm line-clamp-1">{brief.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{brief.courseName}</p>
                        </div>
                      ))}
                      
                      {/* Add Brief button at the end of the list */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center justify-center gap-1.5 group hover:bg-accent/30 border-dashed border-2 transition-all duration-300 py-5"
                        onClick={() => setCreateBriefOpen(true)}
                      >
                        <PlusIcon className="h-4 w-4 group-hover:scale-125 transition-transform duration-300" />
                        <span>Add New Brief</span>
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-6 border rounded-lg bg-gradient-to-b from-muted/5 to-muted/20 border-dashed">
                      <div className="relative">
                        <BookmarkIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-subtle-bounce" />
                        <span className="absolute inset-0 mx-auto rounded-full h-12 w-12 animate-pulse-slow bg-primary/10 -z-10 top-[-8px]"></span>
                      </div>
                      <h4 className="text-sm font-medium mb-1">No saved briefs</h4>
                      <p className="text-xs text-muted-foreground mb-4">
                        Create your first brief or bookmark an existing one
                      </p>
                      <Button 
                        size="sm"
                        className="relative overflow-hidden group animate-subtle-bounce bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
                        onClick={() => setCreateBriefOpen(true)}
                      >
                        <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative z-10 flex items-center gap-1.5">
                          <PlusIcon className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                          <span>Create First Brief</span>
                        </span>
                        <span className="absolute inset-0 -z-10 animate-shimmer opacity-0 group-hover:opacity-100 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0"></span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Collections Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-1.5">
                    <FolderIcon className="h-4 w-4" />
                    Your Collections
                  </h3>
                  <Button variant="link" size="sm" className="h-auto p-0">
                    View All
                  </Button>
                </div>
                
                {collections.length > 0 ? (
                  <div className="space-y-3">
                    {collections.map((collection) => (
                      <div 
                        key={collection.id} 
                        className="p-3 border rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                        onClick={() => handleCollectionClick(collection)}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{collection.name}</h4>
                          <span className="text-xs text-muted-foreground">
                            {collection.briefs.length} {collection.briefs.length === 1 ? 'brief' : 'briefs'}
                          </span>
                        </div>
                        {collection.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {collection.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border rounded-lg bg-gradient-to-b from-muted/5 to-muted/20 border-dashed">
                    <div className="relative">
                      <FolderIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-subtle-bounce" />
                      <span className="absolute inset-0 mx-auto rounded-full h-12 w-12 animate-pulse-slow bg-primary/10 -z-10 top-[-8px]"></span>
                    </div>
                    <h4 className="text-sm font-medium mb-1">No collections yet</h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      Create collections to organize your briefs
                    </p>
                    <Button 
                      size="sm"
                      className="relative overflow-hidden group bg-gradient-to-r from-primary/80 to-primary/70 hover:from-primary/90 hover:to-primary/80 shadow-sm"
                      onClick={() => setCreateCollectionOpen(true)}
                    >
                      <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      <span className="relative z-10 flex items-center gap-1.5">
                        <FolderIcon className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                        <span>Create Collection</span>
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </main>
      <Footer className="mt-auto" />
      
      {/* Citation Dialog - Alternative to DropdownMenu if you prefer a dialog */}
      <Dialog>
        <DialogContent className="sm:max-w-md">
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
        allBriefs={[...savedBriefs, ...communityBriefs]}
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
      
      {/* Intelligent Search Help Dialog */}
      <Dialog open={searchHelpOpen} onOpenChange={setSearchHelpOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>How to use intelligent search</DialogTitle>
            <DialogDescription>
              Get the most out of our AI-powered semantic search for legal research.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Semantic understanding</h3>
              <p className="text-sm text-muted-foreground">
                Our search is powered by Voyage AI's "voyage-law-2" legal embeddings model, which understands legal concepts and relationships, not just keywords.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Natural language queries</h3>
              <p className="text-sm text-muted-foreground">
                Ask questions in plain language. For example: "What is the doctrine of stare decisis?" or "Find cases about proximate cause in medical malpractice."
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Filter by category</h3>
              <p className="text-sm text-muted-foreground">
                Use the filter buttons to narrow your search to case titles, content, or specific courses.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Use legal terminology</h3>
              <p className="text-sm text-muted-foreground">
                Our search engine understands legal concepts. Try searching for specific legal doctrines, principles, or case elements.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Combine concepts</h3>
              <p className="text-sm text-muted-foreground">
                Search for relationships between concepts, like "tort law negligence duty of care" to find briefs connecting these ideas, even if they don't use those exact words.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Example searches</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                <li>"Criminal procedure exclusionary rule exceptions"</li>
                <li>"Constitutional law equal protection scrutiny levels"</li>
                <li>"Contract law consideration requirement cases"</li>
                <li>"Quebec civil code property servitudes"</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setSearchHelpOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Library; 