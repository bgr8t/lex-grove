import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { agoraArticleService } from '@/lib/services/agoraService';
import { userProfileService } from '@/lib/services/userProfileService';
import { AgoraArticle } from '@/lib/models/agoraArticle';
import { UserProfile } from '@/lib/models/userProfile';
import {
  Plus,
  Eye,
  Edit,
  ExternalLink,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Crown,
  Calendar,
  Clock,
  TrendingUp,
  FileText,
  PenTool
} from 'lucide-react';

export default function AgoraDashboard() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [publishedArticles, setPublishedArticles] = useState<AgoraArticle[]>([]);
  const [draftArticles, setDraftArticles] = useState<AgoraArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalArticles: 0,
    followers: 0,
    avgViewsPerArticle: 0
  });

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Load user profile
      const userProfile = await userProfileService.getCurrentUserProfile();
      setProfile(userProfile);

      // Load articles
      const [published, drafts] = await Promise.all([
        agoraArticleService.searchArticles('', { authorId: currentUser.uid }).then(articles => 
          articles.filter(article => article.status === 'published')
        ),
        agoraArticleService.getDraftsByAuthor(currentUser.uid)
      ]);

      setPublishedArticles(published);
      setDraftArticles(drafts);

      // Calculate stats
      const totalViews = published.reduce((sum, article) => sum + (article.viewCount || 0), 0);
      const avgViews = published.length > 0 ? Math.round(totalViews / published.length) : 0;

      setStats({
        totalViews,
        totalArticles: published.length,
        followers: userProfile?.followerCount || 0,
        avgViewsPerArticle: avgViews
      });

      // Update article stats in profile
      await userProfileService.updateArticleStats(currentUser.uid);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error loading dashboard",
        description: "Failed to load your dashboard data.",
        variant: "destructive"
      });
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="grid gap-6 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 shadow-lg border-2 border-white">
            <AvatarImage src={currentUser?.photoURL || ''} alt={profile?.displayName} />
            <AvatarFallback className="text-xl bg-gradient-to-br from-primary/20 to-primary/10">
              {profile?.displayName?.charAt(0) || currentUser?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Author Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.displayName || 'Author'}! Manage your content and track your impact.
            </p>
          </div>
        </div>
                 <div className="flex flex-col sm:flex-row gap-3">
           <Link to={`/agora/user/${currentUser?.uid}`}>
             <Button variant="outline" className="w-full sm:w-auto rounded-full shadow-md hover:shadow-lg transition-all duration-200">
               <ExternalLink className="w-4 h-4 mr-2" />
               View Public Profile
             </Button>
           </Link>
           <Link to="/agora/settings">
             <Button variant="outline" className="w-full sm:w-auto rounded-full shadow-md hover:shadow-lg transition-all duration-200">
               <Settings className="w-4 h-4 mr-2" />
               Profile Settings
             </Button>
           </Link>
           <Link to="/agora/new">
             <Button className="w-full sm:w-auto rounded-full shadow-md hover:shadow-lg transition-all duration-200">
               <PenTool className="w-4 h-4 mr-2" />
               Write New Article
             </Button>
           </Link>
         </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Published Articles</p>
                <p className="text-3xl font-bold text-blue-900">{stats.totalArticles}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {draftArticles.length} drafts
                </p>
              </div>
              <div className="p-3 bg-blue-200/50 rounded-full">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Views</p>
                <p className="text-3xl font-bold text-green-900">{stats.totalViews.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">
                  Avg {stats.avgViewsPerArticle} per article
                </p>
              </div>
              <div className="p-3 bg-green-200/50 rounded-full">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Followers</p>
                <p className="text-3xl font-bold text-purple-900">{stats.followers}</p>
                <p className="text-xs text-purple-600 mt-1">
                  Growing community
                </p>
              </div>
              <div className="p-3 bg-purple-200/50 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Engagement</p>
                <p className="text-3xl font-bold text-orange-900">
                  {stats.totalArticles > 0 ? Math.round((stats.totalViews / stats.totalArticles) * 0.05) : 0}%
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Reader interaction
                </p>
              </div>
              <div className="p-3 bg-orange-200/50 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Articles Management */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <FileText className="w-6 h-6" />
            Your Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="published" className="space-y-6">
            <TabsList className="bg-gray-100/50 rounded-xl p-1">
              <TabsTrigger value="published" className="rounded-lg">
                Published ({publishedArticles.length})
              </TabsTrigger>
              <TabsTrigger value="drafts" className="rounded-lg">
                Drafts ({draftArticles.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="published" className="space-y-4">
              {publishedArticles.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-medium mb-3">No published articles</h3>
                  <p className="text-muted-foreground mb-6">
                    Start writing and share your legal insights with the community.
                  </p>
                  <Link to="/agora/new">
                    <Button className="rounded-full">
                      <PenTool className="w-4 h-4 mr-2" />
                      Write Your First Article
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {publishedArticles.map(article => (
                    <ArticleRow key={article.id} article={article} type="published" />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="drafts" className="space-y-4">
              {draftArticles.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                    <Edit className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-medium mb-3">No drafts</h3>
                  <p className="text-muted-foreground">
                    All your draft articles will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {draftArticles.map(article => (
                    <ArticleRow key={article.id} article={article} type="draft" />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Article Row Component
function ArticleRow({ article, type }: { article: AgoraArticle; type: 'published' | 'draft' }) {
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

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-r from-white to-gray-50/30 rounded-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-semibold text-lg text-gray-900 truncate">{article.title}</h3>
              <div className="flex items-center gap-2">
                {article.isPremium && (
                  <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300 rounded-full">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
                <Badge 
                  variant="outline" 
                  className={`rounded-full ${
                    type === 'published' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-orange-50 text-orange-700 border-orange-200'
                  }`}
                >
                  {type === 'published' ? 'Published' : 'Draft'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {type === 'published' 
                  ? formatDate(article.publishedAt || article.createdAt)
                  : `Updated ${formatDate(article.updatedAt)}`
                }
              </div>
              
              {type === 'published' && (
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {article.viewCount} views
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {getReadingTime(article.content)} min read
              </div>
              
              {article.tags && article.tags.length > 0 && (
                <div className="flex gap-1">
                  {article.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs bg-white/50 rounded-full">
                      {tag}
                    </Badge>
                  ))}
                  {article.tags.length > 2 && (
                    <span className="text-xs text-muted-foreground">+{article.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {type === 'published' && (
              <Link to={`/agora/article/${article.slug}`}>
                <Button variant="outline" size="sm" className="rounded-full">
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
              </Link>
            )}
            <Link to={`/agora/edit/${article.id}`}>
              <Button variant="outline" size="sm" className="rounded-full">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 