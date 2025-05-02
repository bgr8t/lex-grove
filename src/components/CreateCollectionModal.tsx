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
import { Collection } from '@/lib/models/userProfile';

// Collection schema for the form
const collectionFormSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(50, 'Collection name must be 50 characters or less'),
  description: z.string().max(200, 'Description must be 200 characters or less').optional(),
});

type CollectionFormValues = z.infer<typeof collectionFormSchema>;

interface CreateCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCollection?: (collection: Collection) => void;
}

export function CreateCollectionModal({
  open,
  onOpenChange,
  onCreateCollection,
}: CreateCollectionModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  async function onSubmit(values: CollectionFormValues) {
    setIsSubmitting(true);
    
    try {
      // Create a new collection object
      const newCollection: Collection = {
        id: crypto.randomUUID(), // Generate a unique ID
        name: values.name,
        description: values.description || '',
        createdAt: Date.now(), // Store as timestamp number
        briefs: [], // Start with empty briefs array
      };
      
      // Call the callback function if provided
      onCreateCollection?.(newCollection);
      
      // Show success toast
      toast({
        title: "Collection created",
        description: `Successfully created "${values.name}" collection`,
      });
      
      // Close the modal and reset the form
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Show error toast
      toast({
        title: "Failed to create collection",
        description: "An error occurred while creating your collection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Collection</DialogTitle>
          <DialogDescription>
            Create a new collection to organize your case briefs.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collection Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Constitutional Law Cases" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add a brief description of this collection..."
                      className="resize-none"
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
                {isSubmitting ? 'Creating...' : 'Create Collection'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 