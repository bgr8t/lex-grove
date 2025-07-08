import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Brief } from '@/components/BriefCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Comments } from '@/components/Comments';
import {
  BookmarkIcon,
  ArrowTopRightOnSquareIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ShareIcon,
  DocumentDuplicateIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { caseBriefService } from '@/lib/services/caseBriefService';
import { caseBriefToBrief } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const CaseBrief = () => {
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [brief, setBrief] = useState<Brief | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [votes, setVotes] = useState(0);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBrief = async () => {
      if (!id) {
        console.error("No brief ID provided in URL");
        toast({
          title: t('brief.error'),
          description: "No brief ID provided",
          variant: "destructive"
        });
        navigate('/library');
        return;
      }

      setIsLoading(true);
      try {
        // Fetch from Firebase
        const caseBrief = await caseBriefService.getCaseBriefById(id);
        
        if (caseBrief) {
          // Convert Firebase model to UI model
          const uiBrief = caseBriefToBrief(caseBrief);
          setBrief(uiBrief);
          setVotes(caseBrief.upvotes || 0);
          
          // Only increment view count if user is authenticated
          if (currentUser) {
            await caseBriefService.incrementViewCount(id);
          }
        } else {
          // Brief not found
          toast({
            title: t('brief.not_found'),
            description: `We couldn't find a brief with the ID ${id}`,
            variant: "destructive"
          });
          // Navigate back to library after showing the error
          setTimeout(() => navigate('/library'), 2000);
        }
      } catch (error) {
        console.error("Error fetching brief:", error);
        toast({
          title: t('brief.error'),
          description: "Failed to load the brief",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrief();
  }, [id, toast, t, navigate, currentUser]);

  const handleSave = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? t('brief.removed') : t('brief.added'),
      description: isSaved 
        ? t('brief.removed_desc') 
        : t('brief.added_desc'),
    });
  };

  const handleVote = async (direction: 'up' | 'down') => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!id) return;
    let voteChange = 0;
    if (userVote === direction) {
      setUserVote(null);
      voteChange = direction === 'up' ? -1 : 1;
    } else {
      setUserVote(direction);
      if (userVote === null) {
        voteChange = direction === 'up' ? 1 : -1;
      } else {
        voteChange = direction === 'up' ? 2 : -2;
      }
    }
    setVotes(prevVotes => prevVotes + voteChange);
    try {
      await caseBriefService.updateUpvotes(id, voteChange);
    } catch (error) {
      console.error("Error updating votes:", error);
      setVotes(prevVotes => prevVotes - voteChange);
      setUserVote(prevUserVote => prevUserVote);
      toast({
        title: t('brief.error'),
        description: "Failed to update vote",
        variant: "destructive"
      });
    }
  };

  const handleCite = () => {
    // In a real app, this would generate a proper legal citation
    const citation = `${brief?.title}, ${brief?.courseName} (${brief?.date})`;
    navigator.clipboard.writeText(citation);
    toast({
      title: t('brief.citation_copied'),
      description: t('brief.citation_copied_desc'),
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: t('brief.link_copied'),
      description: t('brief.link_copied_desc'),
    });
  };

  if (!brief) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 mt-16">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center text-foreground hover:text-foreground/70"
                onClick={() => navigate('/library')}
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Go back
              </Button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
                <p className="text-muted-foreground">{t('brief.loading')}</p>
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-destructive/10 text-destructive">
                <h2 className="text-xl font-semibold mb-2">{t('brief.not_found')}</h2>
                <p className="mb-4">{t('We couldn\'t find the requested brief.')}</p>
                <Button onClick={() => navigate('/library')}>
                  Return to Library
                </Button>
              </div>
            )}
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
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center text-foreground hover:text-foreground/70"
              onClick={() => navigate('/library')}
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Go back
            </Button>
          </div>
          
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {brief.courseName}
                </div>
                {brief.court && (
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                    {brief.court}
                  </div>
                )}
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">{brief.title}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {t('brief.by')} {brief.author} • {brief.date}
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar - Fixed to top on scroll */}
          <div className="sticky top-4 z-10 bg-background/80 backdrop-blur-sm border rounded-lg shadow-sm mb-8 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button
                  variant={userVote === 'up' ? 'default' : 'outline'}
                  size="sm"
                  className={`h-9 px-3 sm:px-4 transition-all duration-300 ${userVote === 'up' ? 'bg-primary text-primary-foreground' : ''}`}
                  onClick={() => handleVote('up')}
                >
                  <ChevronUpIcon className="h-5 w-5 mr-1" />
                  <span className="hidden sm:inline">{t('brief.upvote')}</span>
                  <span className="ml-1.5 text-xs bg-background/20 px-1.5 py-0.5 rounded-full">
                    {votes}
                  </span>
                </Button>
                <Button
                  variant={userVote === 'down' ? 'default' : 'outline'}
                  size="sm"
                  className={`h-9 px-3 sm:px-4 transition-all duration-300 ${userVote === 'down' ? 'bg-destructive text-destructive-foreground' : ''}`}
                  onClick={() => handleVote('down')}
                >
                  <ChevronDownIcon className="h-5 w-5 mr-1" />
                  <span className="hidden sm:inline">{t('brief.downvote')}</span>
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 w-full sm:w-auto sm:flex sm:flex-wrap sm:gap-2">
                <Button
                  variant={isSaved ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 px-3 sm:px-4 transition-all duration-300 flex justify-center"
                  onClick={handleSave}
                >
                  {isSaved ? (
                    <>
                      <BookmarkSolidIcon className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">{isSaved ? t('brief.saved') : t('brief.save')}</span>
                    </>
                  ) : (
                    <>
                      <BookmarkIcon className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">{isSaved ? t('brief.saved') : t('brief.save')}</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 sm:px-4 transition-all duration-300 flex justify-center"
                  onClick={handleCite}
                >
                  <DocumentDuplicateIcon className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('brief.cite')}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 sm:px-4 transition-all duration-300 flex justify-center"
                  onClick={handleShare}
                >
                  <ShareIcon className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('brief.share')}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-8 mb-12">
            {/* Context Sections (before I.R.A.C) */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('brief.facts')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {brief.facts || t('brief.facts_placeholder')}
              </p>
            </section>

            {/* I.R.A.C Methodology */}
            <div className="border-t pt-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded mr-3 text-sm font-medium">I.R.A.C</span>
                {t('brief.legal_analysis')}
              </h2>
              
              {/* Issue */}
              <section className="mb-8">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">I</span>
                  {t('brief.issue')}
                </h3>
                <div className="pl-10">
                  <p className="text-muted-foreground leading-relaxed">
                    {brief.issue || t('brief.issue_placeholder')}
                  </p>
                </div>
              </section>

              {/* Rule */}
              <section className="mb-8">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">R</span>
                  {t('brief.rule')}
                </h3>
                <div className="pl-10">
                  <p className="text-muted-foreground leading-relaxed">
                    {brief.rule || t('brief.rule_placeholder')}
                  </p>
                </div>
              </section>

              {/* Application */}
              <section className="mb-8">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">A</span>
                  {t('brief.analysis')}
                </h3>
                <div className="pl-10">
                  <p className="text-muted-foreground leading-relaxed">
                    {brief.analysis || t('brief.analysis_placeholder')}
                  </p>
                </div>
              </section>

              {/* Conclusion */}
              <section>
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">C</span>
                  {t('brief.conclusion')}
                </h3>
                <div className="pl-10">
                  <p className="text-muted-foreground leading-relaxed">
                    {brief.conclusion || t('brief.conclusion_placeholder')}
                  </p>
                </div>
              </section>
            </div>
            
            {/* Comments Section */}
            <div className="border-t pt-8 mt-12">
              <Comments briefId={id || ''} />
            </div>
          </div>
        </div>
      </main>
      <Footer className="mt-auto" />
    </div>
  );
};

export default CaseBrief; 