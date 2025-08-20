import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SparklesIcon, EnvelopeIcon, GlobeAltIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import GeneratedDraftsList from '@/components/email-suite/GeneratedDraftsList';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/components/ui/use-toast";
import { Draft } from '@/lib/models/draft';
import { EmailPreferences, PrivacyPreferences } from '@/pages/EmailSuite';
import { Badge } from '@/components/ui/badge';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';
import { EmailDraft } from '@/lib/models/emailDraft';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface ComposeTabProps {
  selectedDraft: Draft | null;
  selectedEmailDraft: EmailDraft | null;
  onGenerateDraft: (data: { context: string; instructions: string; }) => void;
  isLoading: boolean;
  error: string | null;
  preferences: EmailPreferences;
  privacyPreferences: PrivacyPreferences;
  onPreferencesChange: (preferences: EmailPreferences) => void;
  onSavePreferences?: (preferences: EmailPreferences) => Promise<void>;
  // History panel props
  drafts?: Draft[];
  selectedDraftId?: string | null;
  onSelectDraft?: (id: string) => void;
  onDeleteDraft?: (id: string) => void;
  draftsLoading?: boolean;
  draftsError?: string | null;

  isHistoryOpen?: boolean;
  setIsHistoryOpen?: (open: boolean) => void;
}

export default function ComposeTab({ 
  selectedDraft, 
  selectedEmailDraft, 
  onGenerateDraft, 
  isLoading, 
  error, 
  preferences, 
  privacyPreferences, 
  onPreferencesChange,
  onSavePreferences,
  // History props
  drafts = [],
  selectedDraftId,
  onSelectDraft,
  onDeleteDraft,
  draftsLoading = false,
  draftsError,
  isHistoryOpen = false,
  setIsHistoryOpen
}: ComposeTabProps) {
  
  // Updated state for the 3 simplified inputs
  const [emailAbout, setEmailAbout] = useState(''); // Question 1: What is the email about?
  const [emailContent, setEmailContent] = useState(''); // Question 2: What do you want to say?
  
  // Local state for inline tone and length controls (Question 3: How to say it?)
  const [localTone, setLocalTone] = useState<EmailPreferences['tone']>(preferences.tone);
  const [localLength, setLocalLength] = useState<EmailPreferences['length']>(preferences.length);
  
  const { toast } = useToast();

  // Update form when a draft is selected
  useEffect(() => {
    if (selectedEmailDraft) {
      setEmailAbout(selectedEmailDraft.context);
      setEmailContent(selectedEmailDraft.instructions);
    }
  }, [selectedEmailDraft]);

  // Update local preferences when parent preferences change
  useEffect(() => {
    setLocalTone(preferences.tone);
    setLocalLength(preferences.length);
  }, [preferences.tone, preferences.length]);

  // Input validation and sanitization
  const validateAndSanitizeInput = (input: string, maxLength: number = 5000): string => {
    if (!input || typeof input !== 'string') return '';
    return input.slice(0, maxLength);
  };

  const sanitizeForSubmission = (input: string): string => {
    return input.trim();
  };

  const handleGenerateClick = async () => {
    // Create updated preferences object
    const updatedPreferences = {
      ...preferences,
      tone: localTone,
      length: localLength
    };

    // Check if preferences have changed and save them if user is authenticated
    const preferencesChanged = 
      localTone !== preferences.tone || 
      localLength !== preferences.length;

    if (preferencesChanged && onSavePreferences) {
      try {
        // Save preferences to Firestore automatically
        await onSavePreferences(updatedPreferences);
        toast({
          title: "Preferences Updated",
          description: "Your tone and length preferences have been saved",
          duration: 2000,
        });
      } catch (error) {
        console.error('Error saving preferences:', error);
        // Still continue with draft generation even if save fails
        toast({
          title: "Warning",
          description: "Preferences updated locally but not saved to cloud",
          variant: "destructive",
          duration: 3000,
        });
      }
    }

    // Update parent preferences with local selections (for immediate use)
    onPreferencesChange(updatedPreferences);

    // Validate and sanitize inputs before passing to parent
    const sanitizedContext = sanitizeForSubmission(emailAbout);
    const sanitizedInstructions = sanitizeForSubmission(emailContent);
    
    if (!sanitizedContext) {
      return; // Parent component will handle the error
    }
    
    onGenerateDraft({ 
      context: sanitizedContext, 
      instructions: sanitizedInstructions 
    });
  };

  const handleEmailAboutChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = validateAndSanitizeInput(e.target.value);
    setEmailAbout(value);
  };

  const handleEmailContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = validateAndSanitizeInput(e.target.value);
    setEmailContent(value);
  };

  // Handle language preference changes
  const handleLanguageChange = async (language: 'en' | 'fr') => {
    const updatedPreferences = {
      ...preferences,
      language
    };

    // Save language change immediately if user is authenticated
    if (onSavePreferences) {
      try {
        await onSavePreferences(updatedPreferences);
        toast({
          title: "Language Updated",
          description: `Language changed to ${language === 'fr' ? 'Français' : 'English'}`,
          duration: 2000,
        });
      } catch (error) {
        console.error('Error saving language preference:', error);
        toast({
          title: "Warning",
          description: "Language updated locally but not saved to cloud",
          variant: "destructive",
          duration: 3000,
        });
      }
    }

    // Update parent preferences (for immediate use)
    onPreferencesChange(updatedPreferences);
  };

  // Function to extract subject and body from draft content with proper validation
  const extractEmailParts = (content: string) => {
    if (!content || typeof content !== 'string') {
      return { subject: '', body: '' };
    }

    // Sanitize content to prevent any potential issues
    const sanitizedContent = content.trim();

    // Try to extract subject
    const subjectMatch = sanitizedContent.match(/Subject:\s*(.+?)(?:\n|$)/i);
    const subject = subjectMatch?.[1]?.trim() || '';
    
    // Extract body by removing subject line if present
    let body = sanitizedContent;
    if (subjectMatch) {
      body = sanitizedContent.replace(/Subject:\s*.+?(?:\n|$)/i, '').trim();
    }
    
    return { subject, body };
  };

  // Email client handlers with proper validation and sanitization
  const handleEmailClientOpen = (client: 'default' | 'gmail' | 'outlook') => {
    if (!selectedDraft?.content) {
      toast({
        title: "No Draft Available",
        description: "Please generate a draft first.",
        variant: "destructive",
      });
      return;
    }

    const { subject, body } = extractEmailParts(selectedDraft.content);
    
    if (!body.trim()) {
      toast({
        title: "Invalid Draft",
        description: "The draft appears to be empty or invalid.",
        variant: "destructive",
      });
      return;
    }

    try {
      let url = '';
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      
      switch (client) {
        case 'gmail':
          url = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${encodedSubject}&body=${encodedBody}`;
          break;
        case 'outlook':
          url = `https://outlook.live.com/mail/0/deeplink/compose?subject=${encodedSubject}&body=${encodedBody}`;
          break;
        case 'default':
        default:
          url = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
          break;
      }

      // Validate URL length to prevent issues
      if (url.length > 8192) { // Most browsers have ~8000 char limit for URLs
        toast({
          title: "Draft Too Long",
          description: "The email draft is too long to open directly. Please copy the content manually.",
          variant: "destructive",
        });
        return;
      }

      const clientNames = {
        'default': 'default email client',
        'gmail': 'Gmail',
        'outlook': 'Outlook'
      };

      const successMessage = `Opening draft in ${clientNames[client]}...`;

      window.open(url, '_blank', 'noopener,noreferrer');
      
      toast({
        title: "Success",
        description: successMessage,
      });

    } catch (error) {
      console.error('Error opening email client:', error);
      toast({
        title: "Error",
        description: "Failed to open email client. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* Left Panel: Control Center (Form) */}
      <div className="w-full md:w-[45%] space-y-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium">Compose Your Email</h3>
                <p className="text-sm text-muted-foreground">Fill in the details below to generate a new draft.</p>
              </div>
              
              {/* History Button - shows in mobile/all views */}
              {setIsHistoryOpen && onSelectDraft && onDeleteDraft && (
                <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2 hover:bg-primary/10 shrink-0"
                    >
                      <ClockIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">History</span>
                      {drafts.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs px-1.5">
                          {drafts.length}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 sm:w-96">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <ClockIcon className="h-5 w-5" />
                        Draft History
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <GeneratedDraftsList 
                        drafts={drafts}
                        selectedDraftId={selectedDraftId}
                        onSelectDraft={onSelectDraft}
                        onDeleteDraft={onDeleteDraft}
                        isLoading={draftsLoading}
                        error={draftsError}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>

            {/* Privacy Mode Indicator */}
            {privacyPreferences.mode === 'privacy' && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-green-600" />
                  <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                    Privacy Mode Active
                  </Badge>
                </div>
              </div>
            )}
            
            <div className="space-y-4">              
              {/* Question 1: What is the email about? */}
              <div>
                <label htmlFor="emailAbout" className="text-sm font-medium">1. What is the email about? *</label>
                <Textarea 
                  id="emailAbout" 
                  placeholder="e.g., Following up on yesterday's meeting about the project timeline..." 
                  className="mt-1 min-h-[100px]" 
                  value={emailAbout} 
                  onChange={handleEmailAboutChange}
                  maxLength={5000}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {emailAbout.length}/5000 characters
                </p>
              </div>

              {/* Question 2: What do you want to say? */}
              <div>
                <label htmlFor="emailContent" className="text-sm font-medium">2. What do you want to say?</label>
                <Textarea 
                  id="emailContent" 
                  placeholder="e.g., I need to reschedule our next meeting and get an update on the deliverables..." 
                  className="mt-1 min-h-[100px]" 
                  value={emailContent} 
                  onChange={handleEmailContentChange}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {emailContent.length}/5000 characters
                </p>
              </div>

              {/* Question 3: How would you want to say it? */}
              <div>
                <label className="text-sm font-medium mb-3 block">3. How would you want to say it?</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Tone</label>
                    <Select value={localTone} onValueChange={(value) => setLocalTone(value as EmailPreferences['tone'])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Length</label>
                    <Select value={localLength} onValueChange={(value) => setLocalLength(value as EmailPreferences['length'])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button Row with Language Toggle - 90/10 split */}
            <div className="flex gap-2">
              {/* Generate Draft Button - 90% width */}
              <Button 
                size="lg" 
                className="flex-1 gap-2" 
                onClick={handleGenerateClick} 
                disabled={isLoading || !emailAbout.trim()}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5" /> 
                    Generate Draft
                  </>
                )}
              </Button>

              {/* Language Toggle - 10% width */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-3 gap-1 min-w-fit"
                    disabled={isLoading}
                    title={`Language: ${preferences.language === 'fr' ? 'Français' : 'English'}`}
                  >
                    <GlobeAltIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {preferences.language === 'fr' ? '🇫🇷' : '🇺🇸'}
                    </span>
                    <ChevronDownIcon className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem
                    onClick={() => handleLanguageChange('en')}
                    className={`flex items-center gap-2 ${
                      preferences.language === 'en' ? 'bg-accent' : ''
                    }`}
                  >
                    <span>🇺🇸</span>
                    <span className="text-sm">English</span>
                    {preferences.language === 'en' && (
                      <span className="ml-auto text-xs text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleLanguageChange('fr')}
                    className={`flex items-center gap-2 ${
                      preferences.language === 'fr' ? 'bg-accent' : ''
                    }`}
                  >
                    <span>🇫🇷</span>
                    <span className="text-sm">Français</span>
                    {preferences.language === 'fr' && (
                      <span className="ml-auto text-xs text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: Viewing Area */}
      <div className="flex-1 w-full">
        <Card className="min-h-[calc(100vh-16rem)] sticky top-24">
          <CardContent className="p-4 h-full">
            {selectedDraft ? (
              <ScrollArea className="h-full w-full">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Generated Draft</h4>
                      <p className="text-xs text-muted-foreground">
                        Created: {selectedDraft.timestamp.toLocaleString()}
                      </p>
                    </div>
                    
                    {/* Email Client Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 min-w-fit"
                          title="Open this draft in an email client"
                        >
                          <EnvelopeIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">Open in Email Client</span>
                          <span className="sm:hidden">Open</span>
                          <ChevronDownIcon className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => handleEmailClientOpen('default')}>
                          <EnvelopeIcon className="h-4 w-4 mr-2" />
                          Default Email Client
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEmailClientOpen('gmail')}>
                          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h.819L12 10.183l9.545-6.362h.819A1.636 1.636 0 0 1 24 5.457z"/>
                          </svg>
                          Gmail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEmailClientOpen('outlook')}>
                          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.88 12.05L0 7.03v10.1l7.88-5.02v-.06zm8.11-.05L24 6.98v10.1L15.99 12v.05-.05zM7.86 8.78l4.14 2.64 4.14-2.64v4.44l-4.14 2.64-4.14-2.64V8.78z"/>
                          </svg>
                          Outlook
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {selectedEmailDraft && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {selectedEmailDraft.preferences.tone}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {selectedEmailDraft.preferences.length}
                        </Badge>
                        {selectedEmailDraft.privacySettings.mode === 'privacy' && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <ShieldCheckIcon className="h-3 w-3" />
                            Privacy
                          </Badge>
                        )}
                      </div>
                      
                      {selectedEmailDraft.preferences.role && (
                        <p className="text-xs text-muted-foreground">
                          Role: {selectedEmailDraft.preferences.role}
                          {selectedEmailDraft.preferences.organization && 
                            ` at ${selectedEmailDraft.preferences.organization}`
                          }
                        </p>
                      )}
                      
                      {selectedEmailDraft.context !== selectedDraft.content && (
                        <div className="bg-muted/30 rounded-lg p-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Original Context:</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {selectedEmailDraft.context}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Simple Subject and Body Separation */}
                <div className="space-y-4">
                  {/* Subject Section - Extract first line that looks like a subject */}
                  {selectedDraft.content.includes('Subject:') && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Subject:</label>
                      <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                        <p className="text-sm font-medium">
                          {selectedDraft.content.match(/Subject:\s*(.+?)(?:\n|$)/i)?.[1] || 'No subject'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Body Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Email Body:</label>
                    <Textarea
                      readOnly
                      className="w-full min-h-[calc(100vh-24rem)] resize-none border-0 focus:ring-0 p-3 bg-muted/30 rounded-lg"
                      value={selectedDraft.content}
                    />
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <SparklesIcon className="h-10 w-10 mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">Your generated draft will appear here</h3>
                <p className="text-sm mb-4">Answer the 3 questions above and click Generate Draft to get started.</p>
                <div className="bg-muted/30 p-4 rounded-lg text-xs space-y-2 max-w-sm">
                  <div className="text-center">
                    <span className="font-medium">Current Language:</span>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs">
                        {preferences.language === 'fr' ? '🇫🇷 Français' : '🇺🇸 English'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 