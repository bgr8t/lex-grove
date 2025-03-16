import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Brief } from '@/components/BriefCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  BookmarkIcon,
  ArrowTopRightOnSquareIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ShareIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { sampleBriefs } from '@/data/sampleBriefs';

const CaseBrief = () => {
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  
  const [brief, setBrief] = useState<Brief | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [votes, setVotes] = useState(0);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    console.log("Params:", params);
    console.log("ID from params:", id);
    console.log("Available briefs:", sampleBriefs.map(b => b.id));
    
    if (id) {
      // In a real app, this would be an API call
      const foundBrief = sampleBriefs.find(b => b.id === id);
      console.log("Found brief:", foundBrief);
      
      if (foundBrief) {
        setBrief(foundBrief);
        setVotes(foundBrief.savedCount); // Using savedCount as initial votes for demo
      } else {
        // Handle case when brief is not found
        console.error(`Brief with id ${id} not found`);
        // You could add a toast notification here
        toast({
          title: "Brief not found",
          description: `We couldn't find a brief with the ID ${id}`,
          variant: "destructive"
        });
      }
    } else {
      // Handle case when id is undefined
      console.error("No brief ID provided in URL");
    }
  }, [id, toast, params]);

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Removed from library" : "Added to library",
      description: isSaved 
        ? "The brief has been removed from your library" 
        : "The brief has been added to your library",
    });
  };

  const handleVote = (direction: 'up' | 'down') => {
    if (userVote === direction) {
      setUserVote(null);
      setVotes(votes + (direction === 'up' ? -1 : 1));
    } else {
      setUserVote(direction);
      setVotes(votes + (
        direction === 'up' 
          ? (userVote === 'down' ? 2 : 1)
          : (userVote === 'up' ? -2 : -1)
      ));
    }
  };

  const handleCite = () => {
    // In a real app, this would generate a proper legal citation
    const citation = `${brief?.title}, ${brief?.courseName} (${brief?.date})`;
    navigator.clipboard.writeText(citation);
    toast({
      title: "Citation copied",
      description: "The citation has been copied to your clipboard",
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "The link has been copied to your clipboard",
    });
  };

  if (!brief) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading brief...</p>
          </div>
        </main>
        <Footer className="mt-auto" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {brief.courseName}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 transition-all duration-300 hover:bg-accent"
                  onClick={handleShare}
                >
                  <ShareIcon className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 transition-all duration-300 hover:bg-accent"
                  onClick={handleCite}
                >
                  <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                  Cite
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 transition-all duration-300 hover:bg-accent"
                  onClick={handleSave}
                >
                  {isSaved ? (
                    <BookmarkSolidIcon className="h-4 w-4 mr-2" />
                  ) : (
                    <BookmarkIcon className="h-4 w-4 mr-2" />
                  )}
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">{brief.title}</h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  By {brief.author} • {brief.date}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 ${userVote === 'up' ? 'text-primary' : ''}`}
                  onClick={() => handleVote('up')}
                >
                  <ChevronUpIcon className="h-5 w-5" />
                </Button>
                <span className="text-sm font-medium min-w-[2rem] text-center">
                  {votes}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 ${userVote === 'down' ? 'text-destructive' : ''}`}
                  onClick={() => handleVote('down')}
                >
                  <ChevronDownIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* REPLACE WITH NEW LAYOUT FOR ACTIONS */}
          {/* Action Bar - Fixed to top on scroll */}
          <div className="sticky top-4 z-10 bg-background/80 backdrop-blur-sm border rounded-lg shadow-sm mb-8 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant={userVote === 'up' ? 'default' : 'outline'}
                  size="sm"
                  className={`h-9 px-4 transition-all duration-300 ${userVote === 'up' ? 'bg-primary text-primary-foreground' : ''}`}
                  onClick={() => handleVote('up')}
                >
                  <ChevronUpIcon className="h-5 w-5 mr-1" />
                  Upvote
                  <span className="ml-1.5 text-xs bg-background/20 px-1.5 py-0.5 rounded-full">
                    {votes}
                  </span>
                </Button>
                <Button
                  variant={userVote === 'down' ? 'default' : 'outline'}
                  size="sm"
                  className={`h-9 px-4 transition-all duration-300 ${userVote === 'down' ? 'bg-destructive text-destructive-foreground' : ''}`}
                  onClick={() => handleVote('down')}
                >
                  <ChevronDownIcon className="h-5 w-5 mr-1" />
                  Downvote
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant={isSaved ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 px-4 transition-all duration-300"
                  onClick={handleSave}
                >
                  {isSaved ? (
                    <BookmarkSolidIcon className="h-4 w-4 mr-2" />
                  ) : (
                    <BookmarkIcon className="h-4 w-4 mr-2" />
                  )}
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 transition-all duration-300"
                  onClick={handleCite}
                >
                  <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                  Cite
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 transition-all duration-300"
                  onClick={handleShare}
                >
                  <ShareIcon className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-8 mb-12">
            {/* Context Sections (before I.R.A.C) */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Summary</h2>
              <p className="text-muted-foreground leading-relaxed">
                {brief.snippet}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Facts</h2>
              <p className="text-muted-foreground leading-relaxed">
                {brief.facts || "Facts of the case will be displayed here."}
              </p>
            </section>

            {/* I.R.A.C Methodology */}
            <div className="border-t pt-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded mr-3 text-sm font-medium">I.R.A.C</span>
                Legal Analysis
              </h2>
              
              {/* Issue */}
              <section className="mb-8">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">I</span>
                  Issue
                </h3>
                <div className="pl-10">
                  <p className="text-muted-foreground leading-relaxed">
                    {brief.issue || "Legal issue(s) will be displayed here."}
                  </p>
                </div>
              </section>

              {/* Rule */}
              <section className="mb-8">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">R</span>
                  Rule
                </h3>
                <div className="pl-10">
                  <p className="text-muted-foreground leading-relaxed">
                    {brief.rule || "Legal rule(s) will be displayed here."}
                  </p>
                </div>
              </section>

              {/* Application */}
              <section className="mb-8">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">A</span>
                  Application
                </h3>
                <div className="pl-10">
                  <p className="text-muted-foreground leading-relaxed">
                    {brief.analysis || "Application of the rule to the facts will be displayed here."}
                  </p>
                </div>
              </section>

              {/* Conclusion */}
              <section>
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">C</span>
                  Conclusion
                </h3>
                <div className="pl-10">
                  <p className="text-muted-foreground leading-relaxed">
                    {brief.conclusion || "Court's conclusion will be displayed here."}
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer className="mt-auto" />
    </div>
  );
};

export default CaseBrief; 