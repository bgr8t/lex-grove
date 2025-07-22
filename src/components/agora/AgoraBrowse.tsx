import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  User,
  Filter,
  Tag,
  X
} from 'lucide-react';

const LEGAL_AREAS = [
  'Constitutional Law', 'Contract Law', 'Tort Law', 'Criminal Law', 'Property Law',
  'Family Law', 'Administrative Law', 'Employment Law', 'Corporate Law', 'Tax Law',
  'Intellectual Property', 'Environmental Law', 'Human Rights', 'Civil Procedure',
  'Evidence', 'International Law', 'Other'
];

export default function AgoraBrowse() {
  const { currentUser, membershipStatus } = useAuth();
  const [articles, setArticles] = useState<AgoraArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLegalArea, setSelectedLegalArea] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [popularTags, setPopularTags] = useState<{tag: string; count: number}[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadArticles();
    loadPopularTags();
  }, []);

  useEffect(() => {
    // Auto-search when filters change
    handleSearch();
  }, [selectedTags, selectedLegalArea, selectedDifficulty]);

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

  const loadPopularTags = async () => {
    try {
      const tags = await agoraArticleService.getPopularTags(15);
      setPopularTags(tags);
    } catch (error) {
      console.error('Error loading popular tags:', error);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const filters = {
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        legalArea: selectedLegalArea && selectedLegalArea !== 'any' ? selectedLegalArea : undefined,
        difficulty: selectedDifficulty && selectedDifficulty !== 'any' ? (selectedDifficulty as 'beginner' | 'intermediate' | 'advanced') : undefined,
      };
      const searchResults = await agoraArticleService.searchArticles(searchQuery, filters);
      setArticles(searchResults);
    } catch (error) {
      console.error('Error searching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedLegalArea('');
    setSelectedDifficulty('');
    setSearchQuery('');
    loadArticles();
  };

  const hasActiveFilters = selectedTags.length > 0 || (selectedLegalArea && selectedLegalArea !== 'any') || (selectedDifficulty && selectedDifficulty !== 'any') || searchQuery;

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

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Search Bar */}
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
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && <Badge variant="secondary" className="ml-1">!</Badge>}
            </Button>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Legal Area</label>
                  <Select value={selectedLegalArea || undefined} onValueChange={(value) => setSelectedLegalArea(value || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any area</SelectItem>
                      {LEGAL_AREAS.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <Select value={selectedDifficulty || undefined} onValueChange={(value) => setSelectedDifficulty(value || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any level</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  {hasActiveFilters && (
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>

              {/* Active Tag Filters */}
              {selectedTags.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Selected Tags:</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="cursor-pointer"
                        onClick={() => handleTagClick(tag)}
                      >
                        {tag}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Popular Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {popularTags.map(({ tag, count }) => (
                <Badge 
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
    <Card className="h-full group hover:shadow-lg transition-all duration-200 overflow-hidden">
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
          <Link to={`/agora/article/${article.slug}`} className="block">
            <h3 className="font-semibold text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {article.title}
            </h3>
          </Link>
        </div>

        {/* Excerpt */}
        <Link to={`/agora/article/${article.slug}`} className="block">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {article.excerpt}
          </p>
        </Link>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {article.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{article.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Legal Area and Difficulty */}
          {(article.legalArea || article.difficulty) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {article.legalArea && (
                <Badge variant="secondary" className="text-xs">
                  {article.legalArea}
                </Badge>
              )}
              {article.difficulty && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    article.difficulty === 'beginner' ? 'border-green-200 text-green-700 bg-green-50' :
                    article.difficulty === 'intermediate' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                    'border-red-200 text-red-700 bg-red-50'
                  }`}
                >
                  {article.difficulty.charAt(0).toUpperCase() + article.difficulty.slice(1)}
                </Badge>
              )}
            </div>
          )}

          {/* Author and metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Link
                to={`/agora/user/${article.authorId}`}
                className="flex items-center gap-1 hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar className="h-4 w-4">
                  <AvatarImage src={article.authorAvatar} />
                  <AvatarFallback className="text-xs">
                    {article.authorName.substring(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{article.authorName}</span>
              </Link>
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
  );
} 