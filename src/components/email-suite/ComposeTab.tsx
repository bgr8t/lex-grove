import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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
  const [context, setContext] = useState('');
  const [instructions, setInstructions] = useState('');
  const { toast } = useToast();

  // Update form when a draft is selected
  useEffect(() => {
    if (selectedEmailDraft) {
      setContext(selectedEmailDraft.context);
      setInstructions(selectedEmailDraft.instructions);
    }
  }, [selectedEmailDraft]);

  // Input validation and sanitization
  const validateAndSanitizeInput = (input: string, maxLength: number = 5000): string => {
    if (!input || typeof input !== 'string') return '';
    return input.slice(0, maxLength);
  };

  const sanitizeForSubmission = (input: string): string => {
    return input.trim();
  };

  const handleGenerateClick = () => {
    // Validate and sanitize inputs before passing to parent
    const sanitizedContext = sanitizeForSubmission(context);
    const sanitizedInstructions = sanitizeForSubmission(instructions);
    
    if (!sanitizedContext) {
      return; // Parent component will handle the error
    }
    
    onGenerateDraft({ 
      context: sanitizedContext, 
      instructions: sanitizedInstructions 
    });
  };

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = validateAndSanitizeInput(e.target.value);
    setContext(value);
  };

  const handleInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = validateAndSanitizeInput(e.target.value);
    setInstructions(value);
  };

  // Handle language preference changes
  const handleLanguageChange = (language: 'en' | 'fr') => {
    onPreferencesChange({
      ...preferences,
      language
    });
  };

  // Function to extract subject and body from draft content with proper validation
  const extractEmailParts = (content: string) => {
    if (!content || typeof content !== 'string') {
      return { subject: '', body: '' };
    }

    // Sanitize content to prevent any potential issues
    const sanitizedContent = content.trim();
    
    // Extract subject line (case-insensitive)
    const subjectMatch = sanitizedContent.match(/Subject:\s*(.+?)(?:\n|$)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : '';
    
    // Remove the subject line and clean up the body
    let body = sanitizedContent.replace(/Subject:\s*.+?(?:\n|$)/i, '').trim();
    
    // Additional sanitization for email body
    body = body.replace(/[\r\n]{3,}/g, '\n\n'); // Normalize line breaks
    
    return { subject, body };
  };

  // Function to open email client with pre-populated draft
  const openEmailClient = () => {
    if (!selectedDraft?.content) {
      toast({
        title: "Error",
        description: "No draft content available to open in email client.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { subject, body } = extractEmailParts(selectedDraft.content);
      
      // Validate extracted content
      if (!body.trim()) {
        toast({
          title: "Warning",
          description: "Draft appears to be empty. Opening email client anyway.",
        });
      }
      
      // Encode the subject and body for URL with proper length limits
      const maxSubjectLength = 200; // Reasonable email subject limit
      const maxBodyLength = 5000; // Reasonable email body limit for mailto
      
      const truncatedSubject = subject.slice(0, maxSubjectLength);
      const truncatedBody = body.slice(0, maxBodyLength);
      
      const encodedSubject = encodeURIComponent(truncatedSubject);
      const encodedBody = encodeURIComponent(truncatedBody);
      
      // Create mailto URL
      const mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
      
      // Validate mailto URL length (some email clients have limits)
      if (mailtoUrl.length > 8000) {
        toast({
          title: "Warning", 
          description: "Email content is very long and may be truncated by your email client.",
        });
      }
      
      // Open the email client
      window.open(mailtoUrl, '_blank', 'noopener,noreferrer');
      
      toast({
        title: "Success",
        description: "Opening in your default email client...",
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

  // Utility function to create Gmail compose URL
  const createGmailUrl = (subject: string, body: string): string => {
    const encodedSubject = encodeURIComponent(subject.slice(0, 200));
    const encodedBody = encodeURIComponent(body.slice(0, 5000));
    return `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=${encodedSubject}&body=${encodedBody}`;
  };

  // Utility function to create Outlook compose URL
  const createOutlookUrl = (subject: string, body: string): string => {
    const encodedSubject = encodeURIComponent(subject.slice(0, 200));
    const encodedBody = encodeURIComponent(body.slice(0, 5000));
    return `https://outlook.live.com/mail/0/deeplink/compose?subject=${encodedSubject}&body=${encodedBody}`;
  };

  // Enhanced email client handler with provider selection
  const handleEmailClientOpen = (provider: 'default' | 'gmail' | 'outlook') => {
    if (!selectedDraft?.content) {
      toast({
        title: "Error",
        description: "No draft content available to open in email client.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { subject, body } = extractEmailParts(selectedDraft.content);
      
      if (!body.trim()) {
        toast({
          title: "Warning",
          description: "Draft appears to be empty. Opening email client anyway.",
        });
      }

      let url: string;
      let successMessage: string;

      switch (provider) {
        case 'gmail':
          url = createGmailUrl(subject, body);
          successMessage = "Opening Gmail compose window...";
          break;
        case 'outlook':
          url = createOutlookUrl(subject, body);
          successMessage = "Opening Outlook compose window...";
          break;
        default:
          // Use existing mailto functionality
          const encodedSubject = encodeURIComponent(subject.slice(0, 200));
          const encodedBody = encodeURIComponent(body.slice(0, 5000));
          url = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
          successMessage = "Opening in your default email client...";
      }

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

            {/* Current Preferences Display */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Current Settings:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {preferences.tone} tone
                  </Badge>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {preferences.length} length
                  </Badge>
                </div>
                {privacyPreferences.mode === 'privacy' && (
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="h-4 w-4 text-green-600" />
                    <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                      Privacy Mode Active
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">              
              <div>
                <label htmlFor="context" className="text-sm font-medium">Email Context *</label>
                <Textarea 
                  id="context" 
                  placeholder="e.g., Follow up on our last meeting..." 
                  className="mt-1 min-h-[120px]" 
                  value={context} 
                  onChange={handleContextChange}
                  maxLength={5000}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {context.length}/5000 characters
                </p>
              </div>

              <div>
                <label htmlFor="instructions" className="text-sm font-medium">Instructions</label>
                <Textarea 
                  id="instructions" 
                  placeholder="e.g., Be polite but firm..." 
                  className="mt-1 min-h-[80px]" 
                  value={instructions} 
                  onChange={handleInstructionsChange}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {instructions.length}/5000 characters
                </p>
              </div>
            </div>

            {/* Generate Button Row with Language Toggle - 90/10 split */}
            <div className="flex gap-2">
              {/* Generate Draft Button - 90% width */}
              <Button 
                size="lg" 
                className="flex-1 gap-2" 
                onClick={handleGenerateClick} 
                disabled={isLoading || !context.trim()}
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
                <p className="text-sm mb-4">Generated emails will use your current preferences:</p>
                <div className="bg-muted/30 p-4 rounded-lg text-xs space-y-2 max-w-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span>Writing Style:</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {preferences.tone} tone
                      </Badge>
                      <span className="text-muted-foreground">•</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {preferences.length} length
                      </Badge>
                    </div>
                  </div>
                  <div className="pt-2 border-t text-center text-muted-foreground">
                    <span className="text-xs">You can adjust these in Preferences</span>
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