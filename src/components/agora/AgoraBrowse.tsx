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
import {
  Search,
  Clock,
  Eye,
  Crown,
  Plus,
  Calendar,
  Filter,
  Tag,
  X,
  TrendingUp,
  Hash,
  Sparkles,
  ExternalLink
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
  const [featuredArticle, setFeaturedArticle] = useState<AgoraArticle | null>(null);
  const [trendingArticles, setTrendingArticles] = useState<AgoraArticle[]>([]);
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
    // Auto-search when filters change (but not on initial load)
    if (selectedTags.length > 0 || selectedLegalArea || selectedDifficulty) {
      handleSearch();
    }
  }, [selectedTags, selectedLegalArea, selectedDifficulty]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const fetchedArticles = await agoraArticleService.getPublishedArticles(20);
      
      if (fetchedArticles.length > 0) {
        // Sort by view count and recent date for featured selection
        const sortedByEngagement = [...fetchedArticles].sort((a, b) => {
          const scoreA = (a.viewCount || 0) + (a.likeCount || 0) * 2;
          const scoreB = (b.viewCount || 0) + (b.likeCount || 0) * 2;
          return scoreB - scoreA;
        });
        
        // Only set featured article if we have 3+ articles to avoid empty articles list
        if (sortedByEngagement.length >= 3) {
          setFeaturedArticle(sortedByEngagement[0]);
          setArticles(sortedByEngagement.slice(1));
        } else {
          // If we have 1-2 articles, show all in the articles list without featured
          setFeaturedArticle(null);
          setArticles(sortedByEngagement);
        }
        
        // Set trending articles (top 5 by views from last week)
        const trending = sortedByEngagement
          .filter(article => {
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            return (article.publishedAt || article.createdAt) > weekAgo;
          })
          .slice(0, 5);
        setTrendingArticles(trending);
      } else {
        setFeaturedArticle(null);
        setArticles(fetchedArticles);
      }
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
      
      if (searchResults.length > 0 && !searchQuery && selectedTags.length === 0 && !selectedLegalArea && !selectedDifficulty) {
        // If no active search/filters, maintain featured article logic
        const sortedResults = [...searchResults].sort((a, b) => {
          const scoreA = (a.viewCount || 0) + (a.likeCount || 0) * 2;
          const scoreB = (b.viewCount || 0) + (b.likeCount || 0) * 2;
          return scoreB - scoreA;
        });
        
        // Only set featured article if we have 3+ articles
        if (sortedResults.length >= 3) {
          setFeaturedArticle(sortedResults[0]);
          setArticles(sortedResults.slice(1));
        } else {
          setFeaturedArticle(null);
          setArticles(sortedResults);
        }
      } else {
        // Active search/filters - show all results without featured
        setFeaturedArticle(null);
        setArticles(searchResults);
      }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <div className="space-y-2">
              <div className="h-10 bg-slate-200 rounded-lg w-32" />
              <div className="h-6 bg-slate-200 rounded-lg w-96" />
            </div>
            
            {/* Featured article skeleton */}
            <div className="h-80 bg-slate-200 rounded-2xl" />
            
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Main content skeleton */}
              <div className="lg:col-span-3 space-y-6">
                <div className="h-20 bg-slate-200 rounded-xl" />
                <div className="h-8 bg-slate-200 rounded w-48" />
                <div className="grid gap-6 md:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-64 bg-slate-200 rounded-xl" />
                  ))}
                </div>
              </div>
              
              {/* Sidebar skeleton */}
              <div className="space-y-6">
                <div className="h-64 bg-slate-200 rounded-xl" />
                <div className="h-80 bg-slate-200 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Agora
            </h1>
            <p className="text-slate-600 leading-relaxed max-w-2xl">
              Legal commentary and analysis from legal practitioners and law students
            </p>
            
            {/* Welcome message */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100 shadow-sm">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-blue-900 text-sm mb-1">Welcome to the Knowledge Zone!</h3>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    While our brilliant authors share amazing legal insights, remember this is like a really good study group – 
                    perfect for learning, but not a substitute for professional legal counsel. Enjoy the wisdom! ✨
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {(membershipStatus === 'premium' || membershipStatus === 'contributor') && (
            <Link to="/agora/new">
              <Button 
                className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-primary to-primary/90 min-h-[40px] px-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Write Article
              </Button>
            </Link>
          )}
        </div>

        {/* Featured Article Section */}
        {featuredArticle && !hasActiveFilters && (
          <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-white via-white to-slate-50/30 rounded-xl group hover:shadow-xl transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className="bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full px-3 py-1 text-xs font-medium">
                  Featured
                </Badge>
                {featuredArticle.tags && featuredArticle.tags.slice(0, 2).map(tag => (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    className="rounded-full bg-white/80 border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors text-xs"
                    onClick={() => handleTagClick(tag)}
                  >
                    #{tag}
                  </Badge>
                ))}
                {featuredArticle.isPremium && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-full text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              
              <Link to={`/agora/article/${featuredArticle.slug}`}>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 hover:text-primary transition-colors leading-tight group-hover:text-primary">
                  {featuredArticle.title}
                </h2>
              </Link>
              
              <p className="text-slate-600 mb-4 leading-relaxed line-clamp-2">
                {featuredArticle.excerpt}
              </p>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Link 
                  to={`/agora/user/${featuredArticle.authorId}`} 
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity group/author"
                >
                  <Avatar className="w-8 h-8 shadow-md border border-white">
                    <AvatarImage src={featuredArticle.authorAvatar} alt={featuredArticle.authorName} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-medium">
                      {featuredArticle.authorName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium text-slate-900 text-sm group-hover/author:text-primary transition-colors">{featuredArticle.authorName}</p>
                      <p className="text-slate-500 text-xs">{formatDate(featuredArticle.publishedAt || featuredArticle.createdAt)}</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover/author:text-primary transition-colors" />
                  </div>
                </Link>
                
                <div className="flex items-center gap-4 text-slate-500 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{getReadingTime(featuredArticle.content)} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{featuredArticle.viewCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Layout: Content + Sidebar */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Filters */}
            <Card className="shadow-lg border-0 rounded-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10 rounded-lg border-slate-200 bg-white/50 focus:bg-white transition-colors min-h-[48px]"
                      aria-label="Search articles"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowFilters(!showFilters)}
                    className="rounded-lg min-h-[48px] px-4"
                    aria-expanded={showFilters}
                    aria-controls="filters-section"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                        {selectedTags.length + (selectedLegalArea && selectedLegalArea !== 'any' ? 1 : 0) + (selectedDifficulty && selectedDifficulty !== 'any' ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                  <Button 
                    onClick={handleSearch}
                    className="rounded-lg min-h-[48px] px-6"
                  >
                    Search
                  </Button>
                </div>

                {/* Filters */}
                {showFilters && (
                  <div id="filters-section" className="border-t pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="legal-area-select" className="text-sm font-medium mb-2 block text-slate-700">
                          Legal Area
                        </label>
                        <Select value={selectedLegalArea || undefined} onValueChange={(value) => setSelectedLegalArea(value || '')}>
                          <SelectTrigger id="legal-area-select" className="rounded-lg">
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
                        <label htmlFor="difficulty-select" className="text-sm font-medium mb-2 block text-slate-700">
                          Difficulty
                        </label>
                        <Select value={selectedDifficulty || undefined} onValueChange={(value) => setSelectedDifficulty(value || '')}>
                          <SelectTrigger id="difficulty-select" className="rounded-lg">
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
                            className="w-full rounded-lg min-h-[48px]"
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
                        <label className="text-sm font-medium mb-3 block text-slate-700">Selected Tags:</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedTags.map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="secondary" 
                              className="cursor-pointer bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-full min-h-[32px] px-3"
                              onClick={() => handleTagClick(tag)}
                            >
                              #{tag}
                              <X className="w-3 h-3 ml-2" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Latest Articles Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {hasActiveFilters ? 'Search Results' : 'Latest Articles'}
                  </h2>
                </div>
                {articles.length > 0 && (
                  <Badge variant="outline" className="bg-white/50 rounded-full text-xs">
                    {articles.length} article{articles.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {articles.length === 0 ? (
                <Card className="text-center py-16 bg-gradient-to-br from-white to-slate-50/50 rounded-xl border-0 shadow-lg">
                  <CardContent className="space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                      <Search className="w-10 h-10 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-3">No articles found</h3>
                      <p className="text-slate-600 mb-6 max-w-md mx-auto">
                        {searchQuery || hasActiveFilters
                          ? 'Try adjusting your search terms or filters to find more content.'
                          : 'Be the first to share your legal insights with the community!'
                        }
                      </p>
                      {(membershipStatus === 'premium' || membershipStatus === 'contributor') && (
                        <Link to="/agora/new">
                          <Button size="lg" className="rounded-full min-h-[48px]">
                            <Plus className="w-4 h-4 mr-2" />
                            {articles.length === 0 && !hasActiveFilters ? 'Write First Article' : 'Write Article'}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {articles.map(article => (
                    <ModernArticleCard 
                      key={article.id} 
                      article={article} 
                      canAccessPremium={canAccessPremium()}
                      onTagClick={handleTagClick}
                      selectedTags={selectedTags}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular Tags */}
            <Card className="shadow-lg border-0 rounded-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Hash className="w-5 h-5 text-primary" />
                  Popular Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {popularTags.slice(0, 12).map(({ tag, count }) => (
                  <button
                    key={tag}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px]"
                    onClick={() => handleTagClick(tag)}
                    type="button"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-slate-700 group-hover:text-primary transition-colors truncate">
                        #{tag}
                      </span>
                      {selectedTags.includes(tag) && (
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                          selected
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs bg-white/50 flex-shrink-0">
                      {count}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Most Read This Week */}
            {trendingArticles.length > 0 && (
              <Card className="shadow-lg border-0 rounded-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Most Read This Week
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trendingArticles.map((article, index) => (
                    <Link 
                      key={article.id} 
                      to={`/agora/article/${article.slug}`}
                      className="block p-3 rounded-lg hover:bg-slate-50 transition-colors group focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-tight">
                            {article.title}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{article.viewCount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{getReadingTime(article.content)} min</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Modern Article Card Component
interface ModernArticleCardProps {
  article: AgoraArticle;
  canAccessPremium: boolean;
  onTagClick: (tag: string) => void;
  selectedTags: string[];
}

function ModernArticleCard({ article, canAccessPremium, onTagClick, selectedTags }: ModernArticleCardProps) {
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
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden rounded-xl bg-gradient-to-br from-white via-white to-slate-50/30 h-full flex flex-col">
      <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Tags and Premium Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2 flex-1 min-w-0">
            {article.tags && article.tags.slice(0, 3).map(tag => (
              <Badge 
                key={tag} 
                variant="outline" 
                className={`text-xs rounded-full bg-white/80 cursor-pointer hover:bg-slate-50 transition-colors ${
                  selectedTags.includes(tag) ? 'bg-primary/10 text-primary border-primary/20' : ''
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTagClick(tag);
                }}
              >
                #{tag}
              </Badge>
            ))}
            {article.tags && article.tags.length > 3 && (
              <Badge variant="outline" className="text-xs rounded-full bg-white/80">
                +{article.tags.length - 3}
              </Badge>
            )}
          </div>
          {article.isPremium && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-full flex-shrink-0">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>

        {/* Title and Excerpt */}
        <div className="flex-1 space-y-2">
          <Link to={`/agora/article/${article.slug}`}>
            <h3 className="font-bold text-base text-slate-900 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {article.title}
            </h3>
          </Link>

          <Link to={`/agora/article/${article.slug}`}>
            <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed group-hover:text-slate-700 transition-colors">
              {article.excerpt}
            </p>
          </Link>

          {/* Legal Area and Difficulty */}
          {(article.legalArea || article.difficulty) && (
            <div className="flex items-center gap-2 pt-2">
              {article.legalArea && (
                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
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
        </div>

        {/* Author and Metadata */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
          <Link 
            to={`/agora/user/${article.authorId}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0 flex-1 group/author"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar className="w-7 h-7 flex-shrink-0">
              <AvatarImage src={article.authorAvatar} alt={article.authorName} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10">
                {article.authorName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="text-xs font-medium text-slate-700 truncate group-hover/author:text-primary transition-colors">{article.authorName}</p>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover/author:text-primary transition-colors flex-shrink-0" />
              </div>
              <p className="text-xs text-slate-500">{formatDate(article.publishedAt || article.createdAt)}</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
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

        {/* Access indicator for premium content */}
        {article.isPremium && !canAccessPremium && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Premium subscription required for full access
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 