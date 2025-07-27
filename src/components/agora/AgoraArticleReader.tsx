import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { agoraArticleService } from '@/lib/services/agoraService';
import { AgoraArticle } from '@/lib/models/agoraArticle';
import { SecureMarkdown } from '@/components/ui/SecureMarkdown';
import { SEO } from '@/components/SEO';
import {
  Calendar,
  Clock,
  Eye,
  Heart,
  Share2,
  Crown,
  Lock,
  ArrowLeft,
  BookOpen,
  User
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AgoraArticleReader() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentUser, membershipStatus } = useAuth();
  const { toast } = useToast();
  
  const [article, setArticle] = useState<AgoraArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadArticle();
    }
  }, [slug]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedArticle = await agoraArticleService.getArticleBySlug(slug!);
      
      if (!fetchedArticle) {
        setError('Article not found');
        return;
      }

      setArticle(fetchedArticle);
      
      // Increment view count
      if (fetchedArticle.id) {
        await agoraArticleService.incrementViewCount(fetchedArticle.id);
        // Update local state to reflect the incremented view count
        setArticle(prev => prev ? { ...prev, viewCount: prev.viewCount + 1 } : null);
      }
    } catch (error) {
      console.error('Error loading article:', error);
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const canAccessFullArticle = () => {
    if (!article?.isPremium) return true;
    if (!currentUser) return false;
    return membershipStatus === 'premium' || membershipStatus === 'contributor';
  };

  const getDisplayContent = () => {
    if (!article) return '';
    if (canAccessFullArticle()) return article.content;
    
    // Show only first 500 characters for non-premium users
    const previewLength = 500;
    if (article.content.length <= previewLength) return article.content;
    
    return article.content.substring(0, previewLength) + '...';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReadingTime = (content: string) => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    return Math.ceil(words / 200);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Article link has been copied to clipboard"
      });
    }
  };

  const handleSubscribe = () => {
    navigate('/contribute');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-64 bg-muted rounded" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Article Not Found</h2>
              <p className="text-muted-foreground">
                {error || 'The article you\'re looking for doesn\'t exist or has been removed.'}
              </p>
              <Button onClick={() => navigate('/agora')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAuthor = currentUser && currentUser.uid === article.authorId;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.excerpt,
    "author": {
      "@type": "Person",
      "name": article.authorName 
    },
    "datePublished": new Date(article.publishedAt || article.createdAt).toISOString(),
    "image": article.coverImage || 'https://www.lexgrove.com/og-image.png'
  };

  return (
    <>
      <SEO
        title={article.title}
        description={article.excerpt}
        ogType="article"
        canonicalUrl={`https://www.lexgrove.com/agora/article/${article.slug}`}
        ogImage={article.coverImage}
        structuredData={structuredData}
      />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/agora')}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Agora
          </Button>
        </div>

        {/* Article Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {article.isPremium && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              {article.title}
            </h1>
            {article.difficulty && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div 
                      className={`w-3 h-3 rounded-full shadow-sm ${
                        article.difficulty === 'beginner' ? 'bg-green-400' :
                        article.difficulty === 'intermediate' ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{article.difficulty.charAt(0).toUpperCase() + article.difficulty.slice(1)} Level</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Tags and Categories */}
          <div className="space-y-4">
            {/* All Tags Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Legal Area Tag */}
              {article.legalArea && (
                <Badge 
                  variant="outline" 
                  className="text-sm px-3 py-1 bg-slate-50/50 shadow-sm hover:bg-slate-100/50 transition-colors"
                >
                  {article.legalArea}
                </Badge>
              )}
              
              {/* Regular Tags */}
              {article.tags && article.tags.length > 0 && (
                article.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    className="text-sm px-3 py-1 bg-slate-50/50 shadow-sm hover:bg-slate-100/50 transition-colors"
                  >
                    {tag}
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Article metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Link
              to={`/agora/user/${article.authorId}`}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={article.authorAvatar} />
                <AvatarFallback>
                  {article.authorName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{article.authorName}</span>
            </Link>
            
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(article.publishedAt || article.createdAt)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{getReadingTime(article.content)} min read</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{article.viewCount} views</span>
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </div>

          <p className="text-xl text-muted-foreground">
            {article.excerpt}
          </p>

          
        </div>

        {/* Article Content */}
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="prose prose-lg max-w-none">
              <SecureMarkdown contentType="article">{getDisplayContent()}</SecureMarkdown>
            </div>

            {/* Premium paywall */}
            {article.isPremium && !canAccessFullArticle() && (
              <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Lock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-800">Premium Content</h3>
                    <p className="text-sm text-yellow-700">
                      This article is available to premium subscribers and contributors
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleSubscribe} className="flex-1">
                    <Crown className="w-4 h-4 mr-2" />
                    Get Premium Access
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/contribute')}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Contribute to Access
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sources */}
        {article.sources && (
          <Card>
            <CardHeader>
              <CardTitle>Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <SecureMarkdown contentType="article">{article.sources}</SecureMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </>
  );
} 