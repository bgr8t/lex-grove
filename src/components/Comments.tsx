import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { commentsService } from '@/lib/services/commentsService';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  briefId: string;
  userId: string;
  userDisplayName: string;
  content: string;
  createdAt: number;
}

interface CommentsProps {
  briefId: string;
}

export function Comments({ briefId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const fetchedComments = await commentsService.getCommentsByBriefId(briefId);
        setComments(fetchedComments);
      } catch (error) {
        console.error("Error fetching comments:", error);
        toast({
          title: "Failed to load comments",
          description: "There was an error loading the comments. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
    
    // Set up real-time listener for comments
    const unsubscribe = commentsService.subscribeToComments(briefId, (updatedComments) => {
      setComments(updatedComments);
    });

    return () => unsubscribe();
  }, [briefId, toast]);

  const handleSubmitComment = async () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add a comment.",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await commentsService.addComment({
        briefId,
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || 'Anonymous',
        content: newComment.trim(),
        createdAt: Date.now(),
      });

      setNewComment('');
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Failed to add comment",
        description: "There was an error adding your comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-4 mt-8">
      <h2 className="text-xl font-semibold">Comments</h2>
      
      {/* Comment input */}
      {currentUser ? (
        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-24 text-base"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmitComment} 
              disabled={isSubmitting || !newComment.trim()}
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-muted/50 rounded-md p-4 text-center">
          <p className="text-muted-foreground">Please sign in to add a comment.</p>
        </div>
      )}
      
      {/* Comments list */}
      <div className="space-y-4 mt-6">
        {isLoading ? (
          // Loading skeletons
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 p-4 rounded-md border bg-card/50">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{getUserInitials(comment.userDisplayName)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-sm">{comment.userDisplayName}</h4>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
} 