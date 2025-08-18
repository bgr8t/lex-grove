import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from "@/components/ui/use-toast";
import { Cog8ToothIcon, PencilSquareIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Draft } from '@/lib/models/draft';
import GeneratedDraftsList from '@/components/email-suite/GeneratedDraftsList';
import { emailPreferencesService } from '@/lib/services/emailPreferencesService';
import { useAuth } from '@/contexts/AuthContext';
import { emailDraftService } from '@/lib/services/emailDraftService';
import { EmailDraft, emailDraftToLegacyDraft } from '@/lib/models/emailDraft';

// Lazy load tab content for better performance
const PreferencesTab = React.lazy(() => import('@/components/email-suite/PreferencesTab'));
const ComposeTab = React.lazy(() => import('@/components/email-suite/ComposeTab'));
const PrivacyTab = React.lazy(() => import('@/components/email-suite/PrivacyTab'));

// Define preferences interfaces
export interface EmailPreferences {
  tone: 'friendly' | 'formal' | 'professional' | 'casual';
  length: 'short' | 'medium' | 'long';
  language: 'en' | 'fr';
  role: string;
  organization: string;
  signature: string;
}

export interface PrivacyPreferences {
  mode: 'standard' | 'privacy';
  removeMetadata: boolean;
  neutralLanguage: boolean;
  avoidLocation: boolean;
  attorneyClient: boolean;
}

export default function EmailSuite() {
  // State for drafts and UI, lifted up to the parent
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [emailDrafts, setEmailDrafts] = useState<EmailDraft[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [draftsError, setDraftsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('compose');
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();

  // Preferences state with loading state
  const [preferences, setPreferences] = useState<EmailPreferences>(
    emailPreferencesService.getDefaultEmailPreferences()
  );
  const [privacyPreferences, setPrivacyPreferences] = useState<PrivacyPreferences>(
    emailPreferencesService.getDefaultPrivacyPreferences()
  );
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Load user preferences when user is authenticated
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (authLoading) return; // Wait for auth to complete
      
      if (!currentUser) {
        // User not authenticated, use defaults
        setPreferencesLoading(false);
        return;
      }

      try {
        setPreferencesLoading(true);
        setPreferencesError(null);
        
        const userPreferences = await emailPreferencesService.getCurrentUserPreferences();
        
        if (userPreferences) {
          // User has existing preferences
          setPreferences(userPreferences.emailPreferences);
          setPrivacyPreferences(userPreferences.privacyPreferences);
        } else {
          // New user, initialize with defaults
          try {
            const newPreferences = await emailPreferencesService.initializeUserPreferences();
            setPreferences(newPreferences.emailPreferences);
            setPrivacyPreferences(newPreferences.privacyPreferences);
          } catch (initError) {
            console.error('Error initializing user preferences:', initError);
            // Keep using defaults
          }
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
        setPreferencesError('Failed to load your preferences. Using defaults.');
        // Keep using defaults on error
      } finally {
        setPreferencesLoading(false);
      }
    };

    loadUserPreferences();
  }, [currentUser, authLoading]);

  // Load drafts when user is authenticated
  useEffect(() => {
    const loadDrafts = async () => {
      if (authLoading) return;
      
      if (!currentUser) {
        setEmailDrafts([]);
        setDrafts([]);
        setDraftsLoading(false);
        return;
      }

      try {
        setDraftsLoading(true);
        setDraftsError(null);
        
        const userDrafts = await emailDraftService.getDraftsByUser(currentUser.uid);
        setEmailDrafts(userDrafts);
        
        // Convert to legacy Draft format for compatibility with existing components
        const legacyDrafts = userDrafts.map(emailDraftToLegacyDraft);
        setDrafts(legacyDrafts);
      } catch (error) {
        console.error('Error loading drafts:', error);
        setDraftsError('Failed to load your draft history');
        toast({
          title: "Error",
          description: "Failed to load your draft history",
          variant: "destructive"
        });
      } finally {
        setDraftsLoading(false);
      }
    };

    loadDrafts();
  }, [currentUser, authLoading, toast]);

  // Input validation and sanitization
  const validateAndSanitizeInput = (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    return input.trim().slice(0, 5000); // Limit input length for security
  };

  // Helper function to build privacy instructions for email generation
  const buildPrivacyInstructions = (privacy: PrivacyPreferences): string => {
    const instructions = [];
    
    if (privacy.removeMetadata) {
      instructions.push("- Remove or avoid including specific names, addresses, phone numbers, or other identifying metadata unless absolutely necessary");
    }
    
    if (privacy.neutralLanguage) {
      instructions.push("- Use neutral, professional language that doesn't reveal personal characteristics or writing style patterns");
    }
    
    if (privacy.avoidLocation) {
      instructions.push("- Avoid location-specific references, time zones, or geographical identifiers unless required for the email's purpose");
    }
    
    if (privacy.attorneyClient) {
      instructions.push("- Maintain attorney-client privilege awareness and include appropriate confidentiality disclaimers if needed");
      instructions.push("- Ensure the communication maintains professional legal standards and confidentiality");
    }
    
    return instructions.length > 0 ? instructions.join('\n') : "- Standard email practices apply";
  };

  const handleGenerateDraft = async (formData: { context: string; instructions: string; }) => {
    // Validate and sanitize inputs
    const sanitizedContext = validateAndSanitizeInput(formData.context);
    const sanitizedInstructions = validateAndSanitizeInput(formData.instructions);
    
    if (!sanitizedContext) {
      setError("Email Context is required to generate a draft.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setActiveTab('compose');

    try {
      // Validate API key exists
      const apiKey = import.meta.env.VITE_GROK_API_KEY;
      if (!apiKey) {
        throw new Error("API key for Grok is not configured.");
      }

      // Sanitize preferences for prompt injection protection
      const sanitizedPreferences = {
        tone: preferences.tone,
        length: preferences.length,
        role: validateAndSanitizeInput(preferences.role),
        organization: validateAndSanitizeInput(preferences.organization),
        signature: validateAndSanitizeInput(preferences.signature)
      };

      // Build enhanced prompt with preferences, privacy, and security considerations
      const privacyInstructions = buildPrivacyInstructions(privacyPreferences);
      
      const prompt = `You are an expert email assistant. Generate a professional email draft based on the following details:

**Context:** ${sanitizedContext}
**Instructions:** ${sanitizedInstructions}

**Style Guidelines:**
- Tone: ${sanitizedPreferences.tone}
- Length: ${sanitizedPreferences.length}
- Writer's Role: ${sanitizedPreferences.role}
- Organization: ${sanitizedPreferences.organization}

**Privacy & Security Requirements:**
${privacyInstructions}

**Additional Requirements:**
- Use a ${sanitizedPreferences.tone} tone throughout the email
- Keep the email ${sanitizedPreferences.length} in length (short: 1-2 paragraphs, medium: 3-4 paragraphs, long: 5+ paragraphs)
- Write as a ${sanitizedPreferences.role} from ${sanitizedPreferences.organization}
- Include the signature: "${sanitizedPreferences.signature}" at the end
- Ensure the email is professional and appropriate for legal communication
- Do not include any harmful, inappropriate, or unprofessional content
- Focus on clear, concise, and respectful communication

Generate only the email content without any additional commentary or explanations.`;
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${apiKey}` 
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1000, // Limit response length for cost control
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const generatedContent = data.choices[0]?.message?.content?.trim();
      
      if (generatedContent && generatedContent.length > 0) {
        // Validate generated content is reasonable
        if (generatedContent.length > 10000) {
          throw new Error("Generated content exceeds reasonable length limits.");
        }

        if (!currentUser) {
          // For non-authenticated users, fall back to in-memory storage
          const newDraft: Draft = {
            id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: generatedContent,
            recipient: "No Recipient",
            timestamp: new Date(),
          };
          
          setDrafts(prev => [newDraft, ...prev]);
          setSelectedDraftId(newDraft.id);
          toast({ 
            title: "Success", 
            description: "Draft generated (sign in to save permanently)" 
          });
        } else {
          // For authenticated users, save to Firestore
          try {
            const emailDraftData: Omit<EmailDraft, 'id' | 'createdAt' | 'updatedAt'> = {
              userId: currentUser.uid,
              content: generatedContent,
              context: sanitizedContext,
              instructions: sanitizedInstructions,
              preferences: {
                tone: preferences.tone,
                length: preferences.length,
                role: preferences.role,
                organization: preferences.organization,
                signature: preferences.signature
              },
              privacySettings: {
                mode: privacyPreferences.mode,
                removeMetadata: privacyPreferences.removeMetadata,
                neutralLanguage: privacyPreferences.neutralLanguage,
                avoidLocation: privacyPreferences.avoidLocation,
                attorneyClient: privacyPreferences.attorneyClient
              }
            };

            const savedDraft = await emailDraftService.saveDraft(emailDraftData);
            
            // Update both email drafts and legacy drafts state
            setEmailDrafts(prev => [savedDraft, ...prev]);
            const legacyDraft = emailDraftToLegacyDraft(savedDraft);
            setDrafts(prev => [legacyDraft, ...prev]);
            setSelectedDraftId(savedDraft.id!);
            
            toast({ 
              title: "Success", 
              description: "Draft saved to your history" 
            });
          } catch (saveError) {
            console.error('Error saving draft:', saveError);
            
            // Fall back to in-memory storage if save fails
            const newDraft: Draft = {
              id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              content: generatedContent,
              recipient: "No Recipient",
              timestamp: new Date(),
            };
            
            setDrafts(prev => [newDraft, ...prev]);
            setSelectedDraftId(newDraft.id);
            toast({ 
              title: "Warning", 
              description: "Draft generated but not saved to cloud. Changes may be lost on refresh.",
              variant: "destructive"
            });
          }
        }
      } else {
        throw new Error("The generated draft was empty or invalid.");
      }
    } catch (err: unknown) {
      const errorMessage = (err instanceof Error ? err.message : String(err)) || "An unexpected error occurred.";
      setError(errorMessage);
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
      
      // Log error for debugging (without sensitive data)
      console.error('Draft generation error:', {
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDraft = (id: string) => {
    // Validate draft ID
    if (!id || typeof id !== 'string') return;
    
    setSelectedDraftId(id);
    setActiveTab('compose');
  };

  // Add function to delete draft
  const handleDeleteDraft = async (draftId: string) => {
    if (!currentUser) {
      // For non-authenticated users, just remove from in-memory state
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      if (selectedDraftId === draftId) {
        setSelectedDraftId(null);
      }
      return;
    }

    try {
      await emailDraftService.deleteDraft(draftId);
      
      // Update both states
      setEmailDrafts(prev => prev.filter(d => d.id !== draftId));
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      
      if (selectedDraftId === draftId) {
        setSelectedDraftId(null);
      }
      
      toast({
        title: "Success",
        description: "Draft deleted from history"
      });
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error",
        description: "Failed to delete draft",
        variant: "destructive"
      });
    }
  };
  const handlePreferencesChange = (newPreferences: EmailPreferences) => {
    // Validate preferences before setting
    if (!newPreferences || typeof newPreferences !== 'object') return;
    
    const validTones = ['friendly', 'formal', 'professional', 'casual'];
    const validLengths = ['short', 'medium', 'long'];
    
    if (!validTones.includes(newPreferences.tone) || !validLengths.includes(newPreferences.length)) {
      return;
    }
    
    // Update local state immediately for responsive UI (no saving)
    setPreferences(newPreferences);
  };

  const handleSavePreferences = async (newPreferences: EmailPreferences): Promise<void> => {
    // Validate preferences before saving
    if (!newPreferences || typeof newPreferences !== 'object') {
      toast({
        title: "Error",
        description: "Invalid preferences data",
        variant: "destructive"
      });
      throw new Error("Invalid preferences data");
    }
    
    const validTones = ['friendly', 'formal', 'professional', 'casual'];
    const validLengths = ['short', 'medium', 'long'];
    
    if (!validTones.includes(newPreferences.tone) || !validLengths.includes(newPreferences.length)) {
      toast({
        title: "Error",
        description: "Please select valid tone and length options",
        variant: "destructive"
      });
      throw new Error("Invalid tone or length values");
    }

    if (!currentUser) {
      toast({
        title: "Error",
        description: "Please log in to save your preferences",
        variant: "destructive"
      });
      throw new Error("User not authenticated");
    }

    setIsSavingPreferences(true);
    
    try {
      await emailPreferencesService.updateEmailPreferences(newPreferences);
      setPreferences(newPreferences); // Update local state with saved values
      toast({
        title: "Success",
        description: "Email preferences saved successfully",
      });
    } catch (error) {
      console.error('Error saving email preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive"
      });
      throw error; // Re-throw to let the PreferencesTab handle it
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handlePrivacyPreferencesChange = async (newPrivacyPreferences: PrivacyPreferences) => {
    // Validate privacy preferences before setting
    if (!newPrivacyPreferences || typeof newPrivacyPreferences !== 'object') {
      toast({
        title: "Error",
        description: "Invalid privacy preferences data",
        variant: "destructive"
      });
      return;
    }
    
    const validModes = ['standard', 'privacy'];
    if (!validModes.includes(newPrivacyPreferences.mode)) {
      toast({
        title: "Error",
        description: "Invalid privacy mode selected",
        variant: "destructive"
      });
      return;
    }
    
    // Validate boolean values
    const booleanKeys = ['removeMetadata', 'neutralLanguage', 'avoidLocation', 'attorneyClient'];
    for (const key of booleanKeys) {
      if (typeof newPrivacyPreferences[key as keyof PrivacyPreferences] !== 'boolean') {
        toast({
          title: "Error",
          description: "Invalid privacy preference values",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Update local state immediately for responsive UI
    setPrivacyPreferences(newPrivacyPreferences);
    
    // Save to Firestore if user is authenticated
    if (currentUser) {
      try {
        await emailPreferencesService.updatePrivacyPreferences(newPrivacyPreferences);
        toast({
          title: "Success",
          description: "Privacy preferences saved successfully",
        });
      } catch (error) {
        console.error('Error saving privacy preferences:', error);
        toast({
          title: "Warning",
          description: "Privacy settings updated locally but failed to sync to cloud. Changes may be lost on refresh.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Warning",
        description: "Please log in to save your privacy preferences permanently",
        variant: "destructive"
      });
    }
  };

  const selectedDraft = drafts.find(d => d.id === selectedDraftId) || null;
  const selectedEmailDraft = emailDrafts.find(d => d.id === selectedDraftId) || null;

  // Show loading state while auth or preferences are loading
  if (authLoading || preferencesLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/40">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 mt-16 md:mt-32">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading your preferences...</span>
          </div>
        </main>
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 mt-16 md:mt-32">
        {preferencesError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-600">{preferencesError}</p>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Navigation */}
          <div className="w-full md:w-48 shrink-0 order-1 md:order-none">
            <TabsList className="flex md:flex-col w-full bg-transparent p-0 space-x-2 md:space-x-0 md:space-y-1">
              <TabsTrigger value="preferences" className="w-full justify-start gap-2">
                <Cog8ToothIcon className="h-5 w-5" /> Preferences
              </TabsTrigger>
              <TabsTrigger value="compose" className="w-full justify-start gap-2">
                <PencilSquareIcon className="h-5 w-5" /> Compose
              </TabsTrigger>
              <TabsTrigger value="privacy" className="w-full justify-start gap-2">
                <ShieldCheckIcon className="h-5 w-5" /> Privacy
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Right Column: Tab Content */}
          <div className="flex-1 min-w-0 order-2 md:order-none">
            <React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
              <TabsContent value="preferences">
                <PreferencesTab 
                  preferences={preferences} 
                  onPreferencesChange={handlePreferencesChange} 
                  onSavePreferences={handleSavePreferences}
                  isSaving={isSavingPreferences}
                />
              </TabsContent>
              <TabsContent value="compose">
                <ComposeTab 
                  selectedDraft={selectedDraft}
                  selectedEmailDraft={selectedEmailDraft}
                  onGenerateDraft={handleGenerateDraft}
                  isLoading={isLoading}
                  error={error}
                  preferences={preferences}
                  privacyPreferences={privacyPreferences}
                  onPreferencesChange={handlePreferencesChange}
                />
              </TabsContent>
              <TabsContent value="privacy">
                <PrivacyTab 
                  privacyPreferences={privacyPreferences}
                  onPrivacyPreferencesChange={handlePrivacyPreferencesChange}
                />
              </TabsContent>
            </React.Suspense>
          </div>

          {/* History Section */}
          <div className="w-full md:w-48 shrink-0 order-3 md:order-none mt-8 md:mt-0">
            <GeneratedDraftsList 
              drafts={drafts}
              selectedDraftId={selectedDraftId}
              onSelectDraft={handleSelectDraft}
              onDeleteDraft={handleDeleteDraft}
              isLoading={draftsLoading}
              error={draftsError}
            />
          </div>
          
        </Tabs>
      </main>
    </div>
  );
} 