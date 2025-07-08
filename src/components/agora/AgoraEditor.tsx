import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { agoraArticleService } from '@/lib/services/agoraService';
import { AgoraArticle } from '@/lib/models/agoraArticle';
import ReactMarkdown from 'react-markdown';
import {
  Save,
  Send,
  X,
  Eye,
  ArrowLeft
} from 'lucide-react';

export default function AgoraEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  // Editor state
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [article, setArticle] = useState<AgoraArticle | null>(null);

  // Calculate word count and reading time
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
    setReadingTime(Math.ceil(words / 200)); // Average reading speed
  }, [content]);

  // Generate excerpt from content if not provided
  useEffect(() => {
    if (!excerpt && content) {
      const plainText = content.replace(/[#*`_\[\]()]/g, '').trim();
      setExcerpt(plainText.substring(0, 200) + (plainText.length > 200 ? '...' : ''));
    }
  }, [content, excerpt]);

  // Load article for editing
  useEffect(() => {
    if (id) {
      loadArticle();
    }
  }, [id]);

  const loadArticle = async () => {
    if (!id) return;
    
    try {
      const fetchedArticle = await agoraArticleService.getById(id);
      if (fetchedArticle) {
        setArticle(fetchedArticle);
        setTitle(fetchedArticle.title);
        setContent(fetchedArticle.content);
        setExcerpt(fetchedArticle.excerpt);
        setIsPremium(fetchedArticle.isPremium);
      }
    } catch (error) {
      console.error('Error loading article:', error);
      toast({
        title: "Error loading article",
        description: "Failed to load the article for editing.",
        variant: "destructive"
      });
    }
  };

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Save draft
  const handleSave = async () => {
    if (!currentUser || !title.trim() || !content.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title and content before saving.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
             if (article?.id) {
         // Update existing article
         await agoraArticleService.update(article.id, {
           title: title.trim(),
           content,
           excerpt: excerpt.trim(),
           isPremium,
           updatedAt: Date.now()
         });
         // Update local state
         setArticle({
           ...article,
           title: title.trim(),
           content,
           excerpt: excerpt.trim(),
           isPremium,
           updatedAt: Date.now()
         });
      } else {
        // Create new article
        const savedArticle = await agoraArticleService.createArticle({
          title: title.trim(),
          content,
          excerpt: excerpt.trim(),
          isPremium,
          status: 'draft'
        });
        setArticle(savedArticle);
        // Update URL to edit mode
        navigate(`/agora/edit/${savedArticle.id}`, { replace: true });
      }

      toast({
        title: "Draft saved",
        description: "Your article has been saved as a draft."
      });
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: "Save failed",
        description: "Failed to save your article. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Publish article
  const handlePublish = async () => {
    if (!currentUser || !title.trim() || !content.trim() || !excerpt.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, content, and excerpt before publishing.",
        variant: "destructive"
      });
      return;
    }

    setIsPublishing(true);
    try {
      // First save if it's a new article
      if (!article?.id) {
        await handleSave();
        // Wait a moment for the save to complete and article to be set
        setTimeout(async () => {
          if (article?.id) {
            await agoraArticleService.publishArticle(article.id);
            toast({
              title: "Article published!",
              description: "Your article is now live and available to readers."
            });
            navigate('/agora');
          }
        }, 500);
        return;
      }

      // Publish existing article
      await agoraArticleService.publishArticle(article.id);
      
      toast({
        title: "Article published!",
        description: "Your article is now live and available to readers."
      });
      navigate('/agora');
    } catch (error) {
      console.error('Error publishing article:', error);
      toast({
        title: "Publish failed",
        description: "Failed to publish your article. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCancel = () => {
    navigate('/agora');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {article?.id ? 'Edit Article' : 'New Article'}
          </h1>
          <p className="text-muted-foreground">
            Create compelling legal commentary for your readers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {wordCount} words · {readingTime} min read
          </span>
          <Button variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button onClick={handlePublish} disabled={isPublishing}>
            <Send className="w-4 h-4 mr-2" />
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-3 space-y-4">
          {/* Article Details */}
          <Card>
            <CardHeader>
              <CardTitle>Article Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter article title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-medium"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt *</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Brief description that will appear in previews..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'write' | 'preview')}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="write">Write</TabsTrigger>
                    <TabsTrigger value="preview">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="write" className="space-y-4">
                  <Textarea
                    placeholder="Start writing your article... Use Markdown for formatting."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[500px] font-mono text-sm"
                  />
                  <div className="text-sm text-muted-foreground">
                    Tip: You can use Markdown formatting like **bold**, *italic*, # headings, and [links](url)
                  </div>
                </TabsContent>

                <TabsContent value="preview">
                  <div className="prose prose-sm max-w-none min-h-[500px] p-4 border rounded-md bg-background">
                    <h1 className="text-2xl font-bold mb-2">{title || 'Article Title'}</h1>
                    <p className="text-xl text-muted-foreground mb-4">{excerpt}</p>
                    <div className="prose-content">
                      <ReactMarkdown>{content || 'Start writing to see preview...'}</ReactMarkdown>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-4">
          {/* Publication Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isPremium">Premium Content</Label>
                  <p className="text-xs text-muted-foreground">Requires subscription to read</p>
                </div>
                <Switch
                  id="isPremium"
                  checked={isPremium}
                  onCheckedChange={setIsPremium}
                />
              </div>
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Writing Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Focus on practical legal insights</p>
              <p>• Use clear, accessible language</p>
              <p>• Include relevant case references</p>
              <p>• Maintain professional tone</p>
              <p>• Provide actionable takeaways</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 