import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Collection } from './CreateCollectionModal';
import { Brief } from './BriefCard';
import { 
  FolderIcon, 
  PlusCircleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { useToast } from '@/components/ui/use-toast';

interface BookmarkCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: Collection[];
  brief: Brief | null;
  onCreateCollectionClick: () => void;
  onAddToCollection: (brief: Brief, collectionId: string) => void;
  onBookmarkOnly: (brief: Brief) => void;
}

export function BookmarkCollectionDialog({
  open,
  onOpenChange,
  collections,
  brief,
  onCreateCollectionClick,
  onAddToCollection,
  onBookmarkOnly,
}: BookmarkCollectionDialogProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const { toast } = useToast();

  // Reset selected collection when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setSelectedCollectionId(null);
    }
  }, [open]);

  const handleSave = () => {
    if (!brief) return;
    
    if (selectedCollectionId) {
      onAddToCollection(brief, selectedCollectionId);
      
      // Get the collection name for the toast
      const collection = collections.find(c => c.id === selectedCollectionId);
      toast({
        title: "Brief added to collection",
        description: `"${brief.title}" has been added to "${collection?.name}"`,
      });
    } else {
      onBookmarkOnly(brief);
      toast({
        title: "Brief bookmarked",
        description: "The brief has been added to your bookmarks",
      });
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bookmark Brief</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              You can simply bookmark this brief or add it to a collection:
            </p>
            <div 
              className={`
                p-3 border rounded-md mb-3 cursor-pointer
                ${!selectedCollectionId ? 'border-primary bg-primary/5' : 'hover:bg-accent/10'}
              `}
              onClick={() => setSelectedCollectionId(null)}
            >
              <div className="flex items-center">
                <div className="mr-3">
                  {!selectedCollectionId ? (
                    <CheckCircleIcon className="h-5 w-5 text-primary" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">Bookmark only</p>
                  <p className="text-xs text-muted-foreground">
                    Save to your bookmarks without adding to a collection
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            <p className="text-sm font-medium mb-1">Add to collection:</p>
            
            {collections.length > 0 ? (
              collections.map((collection) => (
                <div 
                  key={collection.id}
                  className={`
                    p-3 border rounded-md cursor-pointer
                    ${selectedCollectionId === collection.id ? 'border-primary bg-primary/5' : 'hover:bg-accent/10'}
                  `}
                  onClick={() => setSelectedCollectionId(collection.id)}
                >
                  <div className="flex items-center">
                    <div className="mr-3">
                      {selectedCollectionId === collection.id ? (
                        <CheckCircleIcon className="h-5 w-5 text-primary" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{collection.name}</p>
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
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 border rounded-md bg-muted/20">
                <FolderIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No collections yet</p>
              </div>
            )}
            
            <Button 
              variant="outline" 
              className="w-full justify-start mt-2"
              onClick={() => {
                onOpenChange(false);
                onCreateCollectionClick();
              }}
            >
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Create new collection
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 