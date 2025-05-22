import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Brief, BriefCard } from '@/components/BriefCard';
import { useAuth } from '@/contexts/AuthContext';
import { caseBriefService } from '@/lib/services/caseBriefService';
import { userProfileService } from '@/lib/services/userProfileService';
import { Skeleton } from '@/components/ui/skeleton';
import { Collection } from '@/lib/models/userProfile';
import { caseBriefToBrief, caseBriefsToBriefs } from '@/lib/utils';
import { CollectionDetail } from '@/components/CollectionDetail';
import { FolderIcon, BookmarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const MyLibrary = () => {
  const { currentUser } = useAuth();
  const [submittedBriefs, setSubmittedBriefs] = useState<Brief[]>([]);
  const [bookmarkedBriefs, setBookmarkedBriefs] = useState<Brief[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('my-briefs');
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionDetailOpen, setCollectionDetailOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!currentUser) return;
        // Fetch submitted briefs
        const submittedCaseBriefs = await caseBriefService.getCaseBriefsByUser(currentUser.uid);
        setSubmittedBriefs(caseBriefsToBriefs(submittedCaseBriefs || []));
        // Fetch bookmarked brief IDs, then fetch each brief
        const bookmarkedIds = await userProfileService.getBookmarkedBriefs();
        let bookmarked: Brief[] = [];
        if (bookmarkedIds && bookmarkedIds.length > 0) {
          const fetches = bookmarkedIds.map(async (id: string) => {
            const cb = await caseBriefService.getById(id);
            return cb ? caseBriefToBrief(cb) : null;
          });
          const results = await Promise.all(fetches);
          bookmarked = results.filter(Boolean) as Brief[];
        }
        setBookmarkedBriefs(bookmarked);
        // Fetch collections
        const userCollections = await userProfileService.getUserCollections();
        setCollections(userCollections || []);
      } catch (err: any) {
        setError('Failed to load your library. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  // Handler for opening a collection detail modal
  const handleCollectionClick = (collection: Collection) => {
    setSelectedCollection(collection);
    setCollectionDetailOpen(true);
  };

  // Handler for opening a brief (navigates to full page)
  const handleOpenBrief = (brief: Brief) => {
    window.location.href = `/case-brief/${brief.id}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/10 to-background">
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-6 py-8 mt-16 sm:mt-20">
        <h1 className="text-3xl font-bold mb-6 text-center">My Library</h1>
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-12 w-full rounded-xl" aria-label="Loading submitted briefs" />
            <Skeleton className="h-12 w-full rounded-xl" aria-label="Loading bookmarked briefs" />
            <Skeleton className="h-12 w-full rounded-xl" aria-label="Loading collections" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList
                className="flex bg-[#f7f8fa] rounded-full shadow-neumorphic px-0.5 py-1 gap-1 w-auto max-w-full"
                style={{ boxShadow: '0 2px 8px 0 rgba(30, 32, 38, 0.06), 0 1.5px 4px 0 rgba(30, 32, 38, 0.03)' }}
                aria-label="Library navigation tabs"
              >
                <TabsTrigger
                  value="my-briefs"
                  className="flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-2 rounded-full text-sm sm:text-base font-medium h-10 sm:h-12 transition-all duration-200 focus:outline-none data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:scale-105 data-[state=active]:ring-2 data-[state=active]:ring-primary/10"
                  aria-label="My Case Briefs"
                >
                  <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  My Case Briefs
                </TabsTrigger>
                <span className="mx-1 text-muted-foreground/40 select-none">·</span>
                <TabsTrigger
                  value="bookmarks"
                  className="flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-2 rounded-full text-sm sm:text-base font-medium h-10 sm:h-12 transition-all duration-200 focus:outline-none data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:scale-105 data-[state=active]:ring-2 data-[state=active]:ring-primary/10"
                  aria-label="Bookmarks"
                >
                  <BookmarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  Bookmarks
                </TabsTrigger>
                <span className="mx-1 text-muted-foreground/40 select-none">·</span>
                <TabsTrigger
                  value="collections"
                  className="flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-2 rounded-full text-sm sm:text-base font-medium h-10 sm:h-12 transition-all duration-200 focus:outline-none data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:scale-105 data-[state=active]:ring-2 data-[state=active]:ring-primary/10"
                  aria-label="Collections"
                >
                  <FolderIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  Collections
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="my-briefs" className="space-y-6 mt-2">
              {submittedBriefs.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {submittedBriefs.map((brief) => (
                    <BriefCard
                      key={brief.id}
                      brief={brief}
                      saved={true}
                      onOpen={handleOpenBrief}
                      className="min-h-[180px]"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No submitted briefs yet</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="bookmarks" className="space-y-6 mt-2">
              {bookmarkedBriefs.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {bookmarkedBriefs.map((brief) => (
                    <BriefCard
                      key={brief.id}
                      brief={brief}
                      saved={true}
                      onOpen={handleOpenBrief}
                      className="min-h-[180px]"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No bookmarked briefs yet</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="collections" className="space-y-6 mt-2">
              {collections.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {collections.map((collection) => (
                    <div
                      key={collection.id}
                      className="p-5 border rounded-xl bg-card/80 hover:bg-accent/10 transition-colors cursor-pointer flex flex-col min-h-[120px] shadow-neumorphic"
                      onClick={() => handleCollectionClick(collection)}
                      tabIndex={0}
                      role="button"
                      aria-label={`View collection ${collection.name}`}
                      style={{ minHeight: 120 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FolderIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-lg">{collection.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2 mb-2">{collection.description}</div>
                      <div className="flex items-center gap-3 mt-auto">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{collection.briefs.length} briefs</span>
                        <span className="text-xs text-muted-foreground">Created {new Date(collection.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No collections yet</p>
                </div>
              )}
              <CollectionDetail
                open={collectionDetailOpen}
                onOpenChange={setCollectionDetailOpen}
                collection={selectedCollection}
                allBriefs={[...submittedBriefs, ...bookmarkedBriefs]}
                onSaveBrief={() => {}}
                onOpenBrief={handleOpenBrief}
                onRemoveFromCollection={() => {}}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyLibrary; 