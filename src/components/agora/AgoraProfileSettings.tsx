import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { userProfileService } from '@/lib/services/userProfileService';
import { UserProfile } from '@/lib/models/userProfile';
import {
  Save,
  Eye,
  EyeOff,
  User,
  MapPin,
  Globe,
  Twitter,
  Linkedin,
  Github,
  ArrowLeft,
  Settings
} from 'lucide-react';

export default function AgoraProfileSettings() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    isPublicProfile: true,
    socialLinks: {
      twitter: '',
      linkedin: '',
      github: ''
    }
  });

  useEffect(() => {
    if (currentUser) {
      loadProfile();
    }
  }, [currentUser]);

  const loadProfile = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const userProfile = await userProfileService.getCurrentUserProfile();
      if (userProfile) {
        setProfile(userProfile);
        setFormData({
          displayName: userProfile.displayName || '',
          bio: userProfile.bio || '',
          location: userProfile.location || '',
          website: userProfile.website || '',
          isPublicProfile: userProfile.isPublicProfile !== false, // Default to true
          socialLinks: {
            twitter: userProfile.socialLinks?.twitter || '',
            linkedin: userProfile.socialLinks?.linkedin || '',
            github: userProfile.socialLinks?.github || ''
          }
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error loading profile",
        description: "Failed to load your profile settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    // Validate URLs
    if (formData.website && !validateUrl(formData.website)) {
      toast({
        title: "Invalid website URL",
        description: "Please enter a valid website URL (e.g., https://example.com)",
        variant: "destructive"
      });
      return;
    }

    if (formData.socialLinks.linkedin && !validateUrl(formData.socialLinks.linkedin)) {
      toast({
        title: "Invalid LinkedIn URL",
        description: "Please enter a valid LinkedIn URL",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Update display name in user profile service instead of Firebase Auth
      // Firebase Auth display name will be updated through the user profile service

      // Clean social links (remove empty values)
      const cleanSocialLinks = Object.fromEntries(
        Object.entries(formData.socialLinks).filter(([_, value]) => value.trim() !== '')
      );

      // Update profile
      await userProfileService.updatePublicProfile(currentUser.uid, {
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
        socialLinks: Object.keys(cleanSocialLinks).length > 0 ? cleanSocialLinks : undefined,
        isPublicProfile: formData.isPublicProfile
      });

      // Update local state
      await loadProfile();

      toast({
        title: "Profile updated",
        description: "Your profile settings have been saved successfully."
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error saving profile",
        description: "Failed to save your profile settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/agora/dashboard')}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your public profile and author information
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Preview */}
        <div className="lg:col-span-1">
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Profile Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4 shadow-lg border-4 border-white">
                  <AvatarImage src={currentUser?.photoURL || ''} alt={formData.displayName} />
                  <AvatarFallback className="text-xl bg-gradient-to-br from-primary/20 to-primary/10">
                    {formData.displayName?.charAt(0) || currentUser?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">
                  {formData.displayName || 'Your Name'}
                </h3>
                {formData.bio && (
                  <p className="text-muted-foreground text-sm mt-2">{formData.bio}</p>
                )}
              </div>

              {(formData.location || formData.website || Object.values(formData.socialLinks).some(link => link)) && (
                <div className="space-y-2 pt-4 border-t">
                  {formData.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {formData.location}
                    </div>
                  )}
                  {formData.website && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="w-4 h-4" />
                      Website
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {formData.socialLinks.twitter && (
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Twitter className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    {formData.socialLinks.linkedin && (
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Linkedin className="w-4 h-4 text-blue-700" />
                      </div>
                    )}
                    {formData.socialLinks.github && (
                      <div className="p-2 bg-gray-100 rounded-full">
                        <Github className="w-4 h-4 text-gray-700" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  {formData.isPublicProfile ? (
                    <>
                      <Eye className="w-4 h-4 text-green-600" />
                      <span className="text-green-700">Public Profile</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">Private Profile</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="Your name"
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell readers about yourself and your legal expertise..."
                  rows={3}
                  maxLength={500}
                  className="rounded-xl resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Toronto, Canada"
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Links */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Links & Social Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="twitter">Twitter Username</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-xl">
                    @
                  </span>
                  <Input
                    id="twitter"
                    value={formData.socialLinks.twitter}
                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                    placeholder="username"
                    className="rounded-l-none rounded-r-xl"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="linkedin">LinkedIn Profile</Label>
                <Input
                  id="linkedin"
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="github">GitHub Username</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-xl">
                    github.com/
                  </span>
                  <Input
                    id="github"
                    value={formData.socialLinks.github}
                    onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                    placeholder="username"
                    className="rounded-l-none rounded-r-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Privacy Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="publicProfile" className="text-base font-medium">
                    Public Profile
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow other users to view your profile and follow you
                  </p>
                </div>
                                 <Switch
                   id="publicProfile"
                   checked={formData.isPublicProfile}
                   onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublicProfile: checked }))}
                 />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full px-8 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 