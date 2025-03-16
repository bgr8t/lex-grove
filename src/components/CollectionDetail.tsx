import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Collection } from './CreateCollectionModal';
import { Brief, BriefCard } from './BriefCard';
import { FolderIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';

interface CollectionDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: Collection | null;
  allBriefs: Brief[];
  onSaveBrief: (brief: Brief) => void;
  onOpenBrief: (brief: Brief) => void;
  onRemoveFromCollection: (collectionId: string, briefId: string) => void;
}

export function CollectionDetail({
  open,
  onOpenChange,
  collection,
  allBriefs,
  onSaveBrief,
  onOpenBrief,
  onRemoveFromCollection
}: CollectionDetailProps) {
  const [collectionBriefs, setCollectionBriefs] = useState<Brief[]>([]);

  // Filter briefs that belong to this collection whenever collection or allBriefs changes
  useEffect(() => {
    if (!collection || !allBriefs.length) {
      setCollectionBriefs([]);
      return;
    }

    const briefs = allBriefs.filter(brief => 
      collection.briefs.includes(brief.id)
    );
    setCollectionBriefs(briefs);
  }, [collection, allBriefs]);

  if (!collection) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[80vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <FolderIcon className="h-5 w-5 text-muted-foreground" />
            <DialogTitle className="text-xl">{collection.name}</DialogTitle>
          </div>
          <DialogDescription>
            {collection.description || "A collection of case briefs."}
          </DialogDescription>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
            <div className="flex items-center gap-1">
              <Badge variant="outline">{collectionBriefs.length} {collectionBriefs.length === 1 ? 'brief' : 'briefs'}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Created {new Date(collection.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 pr-2">
          {collectionBriefs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collectionBriefs.map(brief => (
                <BriefCard
                  key={brief.id}
                  brief={brief}
                  saved={true}
                  onSave={onSaveBrief}
                  onOpen={() => onOpenBrief(brief)}
                  actions={
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFromCollection(collection.id, brief.id);
                      }}
                      className="text-xs"
                    >
                      Remove from collection
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No briefs in this collection yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Bookmark briefs and add them to this collection.</p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}