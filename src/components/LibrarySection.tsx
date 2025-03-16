import { useState } from 'react';
import { Brief, BriefCard } from './BriefCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { FolderIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { CreateCollectionModal, Collection } from './CreateCollectionModal';
import { BookmarkCollectionDialog } from './BookmarkCollectionDialog';
import { CollectionDetail } from './CollectionDetail';

interface LibrarySectionProps {
  title?: string;
  description?: string;
  briefs: Brief[];
  className?: string;
}

export const LibrarySection = ({
  title = "Your Library",
  description = "Access your saved briefs and collections",
  briefs,
  className
}: LibrarySectionProps) => {
  const [activeTab, setActiveTab] = useState('saved');
  const [savedBriefs, setSavedBriefs] = useState<Brief[]>(
    briefs.slice(0, 4)
  );
  const [recentBriefs, setRecentBriefs] = useState<Brief[]>(
    briefs.slice(0, 3)
  );
  const [collections, setCollections] = useState<Collection[]>([]);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false);
  const [currentBrief, setCurrentBrief] = useState<Brief | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionDetailOpen, setCollectionDetailOpen] = useState(false);
  const { toast } = useToast();

  const handleSave = (brief: Brief) => {
    // Check if brief is already saved
    const briefIndex = savedBriefs.findIndex(b => b.id === brief.id);
    
    if (briefIndex === -1) {
      // If not saved, show the bookmark collection dialog
      setCurrentBrief(brief);
      setBookmarkDialogOpen(true);
    } else {
      // If already saved, remove it
      const newSavedBriefs = [...savedBriefs];
      newSavedBriefs.splice(briefIndex, 1);
      setSavedBriefs(newSavedBriefs);
      
      // Also remove from any collections it might be in
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
        description: "The brief has been removed from your library",
      });
    }
  };
  
  const handleBookmarkOnly = (brief: Brief) => {
    setSavedBriefs(prev => [...prev, brief]);
  };
  
  const handleAddToCollection = (brief: Brief, collectionId: string) => {
    // Add to saved briefs if not already there
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
  
  const handleOpen = (brief: Brief) => {
    toast({
      title: "Opening brief",
      description: `Opening "${brief.title}"`,
    });
  };

  const handleCreateCollection = (collection: Collection) => {
    setCollections((prev) => [...prev, collection]);
    // Automatically switch to the collections tab
    setActiveTab('collections');
    
    // If there was a brief in the process of being bookmarked, add it to the new collection
    if (currentBrief) {
      handleAddToCollection(currentBrief, collection.id);
      setCurrentBrief(null);
    }
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

  return (
    <section className={cn("w-full", className)}>
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="space-y-2 mb-4 md:mb-0">
            <h2 className="text-2xl font-medium tracking-tight">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 transition-all duration-300 hover:bg-accent"
              onClick={() => setCreateCollectionOpen(true)}
            >
              <FolderIcon className="h-4 w-4 mr-2" />
              Collections
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 transition-all duration-300 hover:bg-accent"
              onClick={() => {
                toast({
                  title: "Refreshed",
                  description: "Your library has been refreshed",
                });
              }}
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        <Tabs 
          defaultValue="saved" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full sm:w-auto mb-6 bg-muted/80 backdrop-blur-sm">
            <TabsTrigger value="saved" className="flex-1 sm:flex-none text-sm">
              Saved Briefs
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex-1 sm:flex-none text-sm">
              Recently Viewed
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex-1 sm:flex-none text-sm">
              Collections
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="saved" className="space-y-6 mt-2">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
              {savedBriefs.map((brief, index) => (
                <BriefCard
                  key={brief.id}
                  brief={brief}
                  saved={true}
                  onSave={handleSave}
                  onOpen={handleOpen}
                  className={`animate-scale-in animate-delay-${index * 100}`}
                />
              ))}
            </div>
            {savedBriefs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No saved briefs yet</p>
                <Button className="mt-4">Browse Briefs</Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recent" className="space-y-6 mt-2">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {recentBriefs.map((brief, index) => (
                <BriefCard
                  key={brief.id}
                  brief={brief}
                  saved={false}
                  onSave={handleSave}
                  onOpen={handleOpen}
                  className={`animate-scale-in animate-delay-${index * 100}`}
                />
              ))}
            </div>
            {recentBriefs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No recently viewed briefs</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="collections" className="space-y-6 mt-2">
            {collections.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {collections.map((collection) => (
                  <div 
                    key={collection.id}
                    className="p-5 border rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                    onClick={() => handleCollectionClick(collection)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{collection.name}</h3>
                        {collection.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {collection.description}
                          </p>
                        )}
                      </div>
                      <FolderIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {collection.briefs.length} {collection.briefs.length === 1 ? 'brief' : 'briefs'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(collection.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No collections yet</p>
                <Button 
                  className="mt-4" 
                  variant="outline"
                  onClick={() => setCreateCollectionOpen(true)}
                >
                  Create Collection
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <CreateCollectionModal 
        open={createCollectionOpen}
        onOpenChange={setCreateCollectionOpen}
        onCreateCollection={handleCreateCollection}
      />
      
      <BookmarkCollectionDialog
        open={bookmarkDialogOpen}
        onOpenChange={setBookmarkDialogOpen}
        collections={collections}
        brief={currentBrief}
        onCreateCollectionClick={() => setCreateCollectionOpen(true)}
        onAddToCollection={handleAddToCollection}
        onBookmarkOnly={handleBookmarkOnly}
      />
      
      <CollectionDetail
        open={collectionDetailOpen}
        onOpenChange={setCollectionDetailOpen}
        collection={selectedCollection}
        allBriefs={briefs}
        onSaveBrief={handleSave}
        onOpenBrief={handleOpen}
        onRemoveFromCollection={handleRemoveFromCollection}
      />
    </section>
  );
};

export default LibrarySection;
