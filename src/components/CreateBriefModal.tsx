import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Collection } from './CreateCollectionModal';
import { BookmarkCollectionDialog } from './BookmarkCollectionDialog';
import { Brief } from './BriefCard';
import { CreateCollectionModal } from './CreateCollectionModal';
import { Badge } from '@/components/ui/badge';
import { XMarkIcon } from '@heroicons/react/24/outline';

const createBriefSchema = z.object({
  title: z.string().min(1, 'Brief title is required').max(100, 'Title must be 100 characters or less'),
  courseName: z.string().min(1, 'Course name is required'),
  facts: z.string().min(1, 'Facts are required'),
  issue: z.string().min(1, 'Issue is required'),
  rule: z.string().min(1, 'Rule is required'),
  analysis: z.string().min(1, 'Analysis is required'),
  conclusion: z.string().min(1, 'Conclusion is required'),
  tags: z.array(z.string()).optional(),
});

type CreateBriefFormValues = z.infer<typeof createBriefSchema>;

interface CreateBriefModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: Collection[];
  onCreateBrief: (brief: Brief, collectionId?: string) => void;
  onCreateCollection: (collection: Collection) => void;
}

export function CreateBriefModal({
  open,
  onOpenChange,
  collections,
  onCreateBrief,
  onCreateCollection,
}: CreateBriefModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBrief, setNewBrief] = useState<Brief | null>(null);
  const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  const form = useForm<CreateBriefFormValues>({
    resolver: zodResolver(createBriefSchema),
    defaultValues: {
      title: '',
      courseName: '',
      facts: '',
      issue: '',
      rule: '',
      analysis: '',
      conclusion: '',
      tags: [],
    },
  });

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Add tag when Enter or comma is pressed
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      form.setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    form.setValue('tags', newTags);
  };

  async function onSubmit(values: CreateBriefFormValues) {
    setIsSubmitting(true);
    
    try {
      // Create a new brief object
      const brief: Brief = {
        id: crypto.randomUUID(),
        title: values.title,
        courseName: values.courseName,
        facts: values.facts,
        issue: values.issue,
        rule: values.rule,
        analysis: values.analysis,
        conclusion: values.conclusion,
        author: 'You', // Default to current user
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        savedCount: 0,
        snippet: values.facts.substring(0, 150) + (values.facts.length > 150 ? '...' : ''),
        tags: values.tags || [],
      };
      
      setNewBrief(brief);
      
      // Open the bookmark dialog to choose a collection
      setBookmarkDialogOpen(true);
    } catch (error) {
      // Show error toast
      toast({
        title: "Failed to create brief",
        description: "An error occurred while creating your brief. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleAddToCollection = (brief: Brief, collectionId: string) => {
    onCreateBrief(brief, collectionId);
    
    // Close the dialog and reset the form
    onOpenChange(false);
    form.reset();
    
    toast({
      title: "Brief created and added to collection",
      description: `"${brief.title}" has been created and added to your collection.`,
    });
  };

  const handleBookmarkOnly = (brief: Brief) => {
    onCreateBrief(brief);
    
    // Close the dialog and reset the form
    onOpenChange(false);
    form.reset();
    
    toast({
      title: "Brief created",
      description: `"${brief.title}" has been created and added to your library.`,
    });
  };

  const handleCreateCollectionClick = () => {
    setCreateCollectionOpen(true);
  };

  const handleCollectionCreated = (collection: Collection) => {
    onCreateCollection(collection);
    
    // If a brief is waiting to be added to a collection, reopen the bookmark dialog
    if (newBrief) {
      setTimeout(() => {
        setBookmarkDialogOpen(true);
      }, 100);
    }
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen && !bookmarkDialogOpen) {
          form.reset();
          setTags([]);
        }
        onOpenChange(isOpen);
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Case Brief</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new case brief.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Case Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Marbury v. Madison" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="courseName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Constitutional Law" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Tags Input */}
              <FormField
                control={form.control}
                name="tags"
                render={() => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary"
                            className="flex items-center gap-1 py-1 px-2"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <XMarkIcon className="h-3 w-3" />
                              <span className="sr-only">Remove tag</span>
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                          onBlur={addTag}
                          placeholder="Add tags (press Enter or comma to add)"
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={addTag}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="facts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facts</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the relevant facts of the case..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="issue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the legal issue(s) presented in the case..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the legal rule(s) applied in the case..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="analysis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Analysis</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the court's analysis of the facts and application of the rule..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="conclusion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conclusion</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the court's conclusion..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Brief'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {newBrief && (
        <BookmarkCollectionDialog
          open={bookmarkDialogOpen}
          onOpenChange={setBookmarkDialogOpen}
          collections={collections}
          brief={newBrief}
          onCreateCollectionClick={handleCreateCollectionClick}
          onAddToCollection={handleAddToCollection}
          onBookmarkOnly={handleBookmarkOnly}
        />
      )}
      
      <CreateCollectionModal
        open={createCollectionOpen}
        onOpenChange={setCreateCollectionOpen}
        onCreateCollection={handleCollectionCreated}
      />
    </>
  );
} 