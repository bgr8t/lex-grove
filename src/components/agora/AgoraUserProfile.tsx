import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { agoraArticleService } from '@/lib/services/agoraService';
import { userProfileService } from '@/lib/services/userProfileService';
import { AgoraArticle } from '@/lib/models/agoraArticle';
import { UserProfile } from '@/lib/models/userProfile';
import {
  MapPin,
  Globe,
  Calendar,
  Eye,
  Users,
  BookOpen,
  Crown,
  Clock,
  ExternalLink,
  UserPlus,
  UserMinus,
  Twitter,
  Linkedin,
  Github,
  ArrowLeft,
  Tag
} from 'lucide-react';

export default function AgoraUserProfile() {
  const { authorId } = useParams<{ authorId: string }>();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<AgoraArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (authorId) {
      loadUserProfile();
      loadUserArticles();
      checkFollowStatus();
    }
  }, [authorId, currentUser]);

  const loadUserProfile = async () => {
    try {
      const userProfile = await userProfileService.getUserProfileByUid(authorId!);
      if (!userProfile || userProfile.isPublicProfile === false) {
        throw new Error('Profile not found or not public');
      }
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast({
        title: "Profile not found",
        description: "This user profile doesn't exist or is not public.",
        variant: "destructive"
      });
    }
  };

  const loadUserArticles = async () => {
    try {
      const userArticles = await agoraArticleService.searchArticles('', { authorId });
      setArticles(userArticles);
    } catch (error) {
      console.error('Error loading user articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser || !authorId) return;
    
    try {
      const isUserFollowing = await userProfileService.isFollowing(currentUser.uid, authorId);
      setIsFollowing(isUserFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !authorId) {
      toast({
        title: "Login required",
        description: "Please log in to follow authors.",
        variant: "destructive"
      });
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await userProfileService.unfollowUser(currentUser.uid, authorId);
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You are no longer following ${profile?.displayName}.`
        });
      } else {
        await userProfileService.followUser(currentUser.uid, authorId);
        setIsFollowing(true);
        toast({
          title: "Following",
          description: `You are now following ${profile?.displayName}.`
        });
      }
      // Refresh profile to update follower count
      await loadUserProfile();
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setFollowLoading(false);
    }
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 bg-muted rounded-full" />
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded w-48" />
              <div className="h-4 bg-muted rounded w-32" />
            </div>
          </div>
          <div className="h-32 bg-muted rounded-xl" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This user profile doesn't exist or is not public.
            </p>
            <Link to="/agora">
              <Button className="rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Agora
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Profile Header */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center lg:items-start">
              <div className="relative">
                <Avatar className="w-32 h-32 mb-6 shadow-lg border-4 border-white">
                  <AvatarImage src={profile.photoURL} alt={profile.displayName} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/10">
                    {profile.displayName?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {profile.membershipStatus === 'premium' && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white p-2 rounded-full shadow-lg">
                    <Crown className="w-4 h-4" />
                  </div>
                )}
              </div>
              
              {/* Follow Button */}
              {currentUser && currentUser.uid !== authorId && (
                <Button
                  onClick={handleFollow}
                  disabled={followLoading}
                  variant={isFollowing ? "outline" : "default"}
                  className="w-full lg:w-auto rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Profile Details */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {profile.displayName || 'Anonymous Author'}
                  </h1>
                  {profile.membershipStatus === 'premium' && (
                    <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300 rounded-full">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium Author
                    </Badge>
                  )}
                </div>
              </div>
              
              {profile.bio && (
                <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{articles.length}</div>
                  <div className="text-sm text-blue-700">Articles</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-900">{profile.followerCount || 0}</div>
                  <div className="text-sm text-green-700">Followers</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <Eye className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-purple-900">{profile.totalViews || 0}</div>
                  <div className="text-sm text-purple-700">Total Views</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                {profile.location && (
                  <div className="flex items-center gap-2 bg-white/50 rounded-full px-3 py-1">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white/50 rounded-full px-3 py-1">
                  <Calendar className="w-4 h-4" />
                  Joined {formatDate(profile.createdAt)}
                </div>
              </div>

              {/* Social Links */}
              {(profile.website || profile.socialLinks) && (
                <div className="flex gap-3">
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/80 hover:bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 text-muted-foreground hover:text-primary"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                  {profile.socialLinks?.twitter && (
                    <a
                      href={`https://twitter.com/${profile.socialLinks.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/80 hover:bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 text-muted-foreground hover:text-blue-500"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {profile.socialLinks?.linkedin && (
                    <a
                      href={profile.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/80 hover:bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 text-muted-foreground hover:text-blue-700"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {profile.socialLinks?.github && (
                    <a
                      href={`https://github.com/${profile.socialLinks.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/80 hover:bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 text-muted-foreground hover:text-gray-900"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles Section */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <BookOpen className="w-6 h-6" />
            Articles by {profile.displayName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium mb-3">No articles yet</h3>
              <p className="text-muted-foreground">
                {profile.displayName} hasn't published any articles yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
              {articles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Article Card Component
function ArticleCard({ article }: { article: AgoraArticle }) {
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
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/30 rounded-xl overflow-hidden">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Article Header */}
          <div className="space-y-3">
            <Link
              to={`/agora/article/${article.slug}`}
              className="block"
            >
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors duration-200 line-clamp-2">
                {article.title}
              </h3>
            </Link>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(article.publishedAt || article.createdAt)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {getReadingTime(article.content)} min
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {article.viewCount}
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <p className="text-muted-foreground leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {article.tags && article.tags.length > 0 && (
                <>
                  {article.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs bg-white/50 rounded-full">
                      {tag}
                    </Badge>
                  ))}
                  {article.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs bg-white/50 rounded-full">
                      +{article.tags.length - 2}
                    </Badge>
                  )}
                </>
              )}
            </div>

            {/* Premium Badge */}
            {article.isPremium && (
              <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300 rounded-full">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 