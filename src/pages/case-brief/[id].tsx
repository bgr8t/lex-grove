import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Bookmark, 
  Share2, 
  Quote,
  BookmarkCheck
} from 'lucide-react';
import { toast } from 'sonner';

export default function CaseBriefDetail() {
  const { id } = useParams();
  const [votes, setVotes] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Mock data - replace with actual data fetching
  const briefData = {
    title: "Smith v. Jones",
    citation: "123 F.3d 456 (2024)",
    facts: "This case involves a contract dispute between...",
    issue: "Whether the defendant breached the contract...",
    holding: "The court held that...",
    reasoning: "The court reasoned that..."
  };

  const handleVote = (type: 'up' | 'down') => {
    setVotes(prev => type === 'up' ? prev + 1 : prev - 1);
    toast.success(`Vote ${type === 'up' ? 'up' : 'down'} recorded`);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleCite = () => {
    navigator.clipboard.writeText(briefData.citation);
    toast.success('Citation copied to clipboard');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{briefData.title}</h1>
            <p className="text-gray-600">{briefData.citation}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleVote('up')}
              className="hover:bg-green-100"
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <span className="mx-2 font-semibold">{votes}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleVote('down')}
              className="hover:bg-red-100"
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleBookmark}
              className={isBookmarked ? "bg-yellow-100" : ""}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCite}
            >
              <Quote className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">Facts</h2>
            <p className="text-gray-700">{briefData.facts}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Issue</h2>
            <p className="text-gray-700">{briefData.issue}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Holding</h2>
            <p className="text-gray-700">{briefData.holding}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Reasoning</h2>
            <p className="text-gray-700">{briefData.reasoning}</p>
          </section>
        </div>
      </Card>
    </div>
  );
} 