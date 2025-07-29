import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  XMarkIcon, 
  ArrowLeftIcon, 
  DocumentTextIcon, 
  SparklesIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { userProfileService } from '@/lib/services/userProfileService';
import { caseBriefService } from '@/lib/services/caseBriefService';
import { ContributionProgress } from '@/components/ContributionProgress';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
// import Select components removed - no longer needed without court field
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  secureCreateBriefSchema, 
  SecureCreateBriefFormValues,
  sanitizeBriefInput,
  validateCaseBriefContent,
  checkBriefCreationRateLimit
} from '@/utils/createBriefSecurity';
import { writeBatch, doc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Court options removed - no longer needed

export default function CreateBrief() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [securityErrors, setSecurityErrors] = useState<string[]>([]);
  
  const form = useForm<SecureCreateBriefFormValues>({
    resolver: zodResolver(secureCreateBriefSchema),
    defaultValues: {
      title: '',
      facts: '',
      issue: '',
      rule: '',
      analysis: '',
      conclusion: '',
      tags: [],
    },
  });

  // Check authentication on mount
  React.useEffect(() => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create case briefs.",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [currentUser, navigate, toast]);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      form.setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    form.setValue('tags', newTags);
  };

  async function onSubmit(values: SecureCreateBriefFormValues) {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create case briefs.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    // Check rate limiting
    if (!checkBriefCreationRateLimit(currentUser.uid)) {
      toast({
        title: "Rate limit exceeded",
        description: "You can only create 3 briefs per hour. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setSecurityErrors([]);
    
    try {
      // Sanitize all inputs
      const sanitizedValues = sanitizeBriefInput(values);
      
      // Additional security validation
      const contentErrors = validateCaseBriefContent(sanitizedValues);
      if (contentErrors.length > 0) {
        setSecurityErrors(contentErrors);
        setIsSubmitting(false);
        return;
      }
      
      // Use Firebase batch operation for cost efficiency and atomicity
      const batch = writeBatch(db);
      
      // Create case brief document
      const briefRef = doc(db, 'caseBriefs');
      const caseBrief = {
        title: sanitizedValues.title,
        citation: sanitizedValues.title, // Use title as citation since course was removed
        court: 'General', // Default court value since field was removed
        date: new Date().toISOString(),
        facts: sanitizedValues.facts,
        issue: sanitizedValues.issue,
        holding: sanitizedValues.conclusion,
        reasoning: sanitizedValues.analysis,
        userId: currentUser.uid,
        tags: sanitizedValues.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewCount: 0,
        upvotes: 0,
        published: true,
      };
      
      batch.set(briefRef, caseBrief);
      
             // Update user profile contribution count
       const userRef = doc(db, 'userProfiles', currentUser.uid);
       batch.update(userRef, {
         contributionCount: increment(1),
         updatedAt: new Date().toISOString(),
       });
      
      // Commit batch operation
      await batch.commit();
      
      toast({
        title: "Brief created successfully!",
        description: `"${sanitizedValues.title}" has been created and added to the library.`,
      });
      
      // Navigate to library instead of the specific brief for better UX
      navigate('/library');
    } catch (error) {
      console.error('Error creating brief:', error);
      toast({
        title: "Failed to create brief",
        description: "An error occurred while creating your brief. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!currentUser) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="lg:grid lg:grid-cols-[1fr,300px] lg:gap-6 max-w-7xl mx-auto">
            {/* Main content column */}
            <div>
              {/* Mobile-first header */}
              <div className="mb-6 md:mb-8">
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="mb-4 h-12 px-4 touch-target-large"
                  aria-label="Go back"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Back
                </Button>
                
                <div className="flex items-start gap-3 mb-6">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <DocumentTextIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">Create Case Brief</h1>
                    <p className="text-muted-foreground text-sm md:text-base">
                      Create a comprehensive case brief using the IRAC method
                    </p>
                  </div>
                </div>

                {/* Security info */}
                <Alert className="mb-6">
                  <ShieldCheckIcon className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    All content is automatically secured and validated. Your brief will be reviewed before publication.
                  </AlertDescription>
                </Alert>

                {/* Security errors */}
                {securityErrors.length > 0 && (
                  <Alert variant="destructive" className="mb-6">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside">
                        {securityErrors.map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Basic Information</CardTitle>
                      <CardDescription>
                        Essential case details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Case Title *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Marbury v. Madison" 
                                className="h-12 touch-target-large"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Tags */}
                      <FormField
                        control={form.control}
                        name="tags"
                        render={() => (
                          <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {tags.map((tag, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="secondary"
                                    className="flex items-center gap-1 py-1 px-2"
                                  >
                                    {tag}
                                    <button
                                      type="button"
                                      onClick={() => removeTag(tag)}
                                      className="text-muted-foreground hover:text-foreground w-5 h-5 flex items-center justify-center touch-target-large"
                                      aria-label={`Remove ${tag} tag`}
                                    >
                                      <XMarkIcon className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  value={tagInput}
                                  onChange={e => setTagInput(e.target.value)}
                                  onKeyDown={handleTagKeyDown}
                                  onBlur={addTag}
                                  placeholder="Add tags (press Enter)"
                                  className="flex-1 h-12 touch-target-large"
                                  maxLength={30}
                                />
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={addTag}
                                  className="h-12 px-4 touch-target-large"
                                  disabled={tags.length >= 10}
                                >
                                  Add
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {tags.length}/10 tags. Tags help others find your brief.
                              </p>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* IRAC Analysis Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">IRAC Analysis</CardTitle>
                      <CardDescription>
                        Structure your analysis using the IRAC method
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="facts"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Facts *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the relevant facts of the case..."
                                className="min-h-[120px] resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="issue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issue *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What is the legal question presented?"
                                className="min-h-[120px] resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="rule"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rule *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="State the legal rule or principle applied..."
                                className="min-h-[120px] resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="analysis"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Analysis *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="How does the court apply the rule to the facts?"
                                className="min-h-[150px] resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="conclusion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conclusion *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What was the court's decision?"
                                className="min-h-[120px] resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Submit Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate(-1)}
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-initial h-12 touch-target-large"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-initial h-12 touch-target-large"
                    >
                      {isSubmitting ? 'Creating Brief...' : 'Create Brief'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            {/* Progress sidebar */}
            <div className="lg:block">
              <div className="lg:sticky lg:top-36">
                {/* Contribution Progress - shown in sidebar on desktop, above form on mobile */}
                <Card className="mb-6 lg:mb-0 shadow-lg bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <SparklesIcon className="h-5 w-5 text-primary" />
                      Your Progress
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Contribute 3 case briefs to gain full library access
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ContributionProgress />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 