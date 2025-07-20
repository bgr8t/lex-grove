import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { agoraArticleService } from '@/lib/services/agoraService';
import { AgoraArticle } from '@/lib/models/agoraArticle';
import { OptimizedImage } from '@/components/ui/optimized-image';
import {
  Search,
  Clock,
  Eye,
  Crown,
  Plus,
  Calendar,
  User
} from 'lucide-react';

export default function AgoraBrowse() {
  const { currentUser, membershipStatus } = useAuth();
  const [articles, setArticles] = useState<AgoraArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const fetchedArticles = await agoraArticleService.getPublishedArticles(20);
      setArticles(fetchedArticles);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const searchResults = await agoraArticleService.searchArticles(searchQuery);
      setArticles(searchResults);
    } catch (error) {
      console.error('Error searching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getReadingTime = (content: string) => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    return Math.ceil(words / 200);
  };

  const canAccessPremium = () => {
    if (!currentUser) return false;
    return membershipStatus === 'premium' || membershipStatus === 'contributor';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agora</h1>
          <p className="text-muted-foreground">
            Legal commentary and analysis from legal practitioners and law students
          </p>
          <div className="text-sm text-muted-foreground mt-2 bg-primary/5 rounded-lg p-3 border border-primary/10">
            <div className="flex items-center gap-3">
              <span className="text-xl">📚</span>
              <div>
                <p className="font-medium text-primary">Welcome to the Knowledge Zone!</p>
                <p className="mt-1">
                  While our brilliant authors share amazing legal insights, remember this is like a really good study group – 
                  perfect for learning, but not a substitute for professional legal counsel. Enjoy the wisdom! ✨
                </p>
              </div>
            </div>
          </div>
        </div>
        {(membershipStatus === 'premium' || membershipStatus === 'contributor') && (
          <Link to="/agora/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Write Article
            </Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-3">
              <h3 className="text-lg font-medium">No articles found</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Be the first to publish legal commentary!'
                }
              </p>
              {(membershipStatus === 'premium' || membershipStatus === 'contributor') && (
                <Link to="/agora/new">
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Write First Article
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map(article => (
            <ArticleCard 
              key={article.id} 
              article={article} 
              canAccessPremium={canAccessPremium()}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ArticleCardProps {
  article: AgoraArticle;
  canAccessPremium: boolean;
}

function ArticleCard({ article, canAccessPremium }: ArticleCardProps) {
  const getReadingTime = (content: string) => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    return Math.ceil(words / 200);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Link 
      to={`/agora/article/${article.slug}`}
      className="block group"
    >
      <Card className="h-full hover:shadow-lg transition-all duration-200 overflow-hidden">
        <CardContent className="p-4 space-y-3">
          {/* Premium badge */}
          {article.isPremium && (
            <div className="flex justify-end">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            </div>
          )}

          {/* Title */}
          <div>
            <h3 className="font-semibold text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {article.title}
            </h3>
          </div>

          {/* Excerpt */}
          <p className="text-sm text-muted-foreground line-clamp-3">
            {article.excerpt}
          </p>

          {/* Author and metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={article.authorAvatar} />
                  <AvatarFallback className="text-xs">
                    {article.authorName.substring(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{article.authorName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(article.publishedAt || article.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{getReadingTime(article.content)} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{article.viewCount}</span>
              </div>
            </div>
          </div>

          {/* Access indicator */}
          {article.isPremium && !canAccessPremium && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <Crown className="w-3 h-3 inline mr-1" />
                Requires premium subscription to read full article
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
} 