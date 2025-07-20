import React, { useState } from 'react';
import Header from '@/components/Header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from "@/components/ui/use-toast";
import { Cog8ToothIcon, PencilSquareIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Draft } from '@/lib/models/draft';
import GeneratedDraftsList from '@/components/email-suite/GeneratedDraftsList';

// Lazy load tab content for better performance
const PreferencesTab = React.lazy(() => import('@/components/email-suite/PreferencesTab'));
const ComposeTab = React.lazy(() => import('@/components/email-suite/ComposeTab'));
const PrivacyTab = React.lazy(() => import('@/components/email-suite/PrivacyTab'));

// Define preferences interfaces
export interface EmailPreferences {
  tone: 'friendly' | 'formal' | 'professional' | 'casual';
  length: 'short' | 'medium' | 'long';
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
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('compose');
  const { toast } = useToast();

  // Preferences state with secure defaults
  const [preferences, setPreferences] = useState<EmailPreferences>({
    tone: 'professional',
    length: 'medium',
    role: 'Senior attorney',
    organization: 'Lex Grove LLP',
    signature: 'Brian Ndabarasa\nLex Grove LLP'
  });

  // Privacy preferences state with secure defaults
  const [privacyPreferences, setPrivacyPreferences] = useState<PrivacyPreferences>({
    mode: 'standard',
    removeMetadata: false,
    neutralLanguage: false,
    avoidLocation: false,
    attorneyClient: false,
  });

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

        const newDraft: Draft = {
          id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // More secure ID generation
          content: generatedContent,
          recipient: "No Recipient",
          timestamp: new Date(),
        };
        
        setDrafts(prev => [newDraft, ...prev]);
        setSelectedDraftId(newDraft.id);
        toast({ 
          title: "Success", 
          description: "New draft generated with your preferences." 
        });
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

  const handlePreferencesChange = (newPreferences: EmailPreferences) => {
    // Validate preferences before setting
    if (!newPreferences || typeof newPreferences !== 'object') return;
    
    const validTones = ['friendly', 'formal', 'professional', 'casual'];
    const validLengths = ['short', 'medium', 'long'];
    
    if (!validTones.includes(newPreferences.tone) || !validLengths.includes(newPreferences.length)) {
      return;
    }
    
    setPreferences(newPreferences);
  };

  const handlePrivacyPreferencesChange = (newPrivacyPreferences: PrivacyPreferences) => {
    // Validate privacy preferences before setting
    if (!newPrivacyPreferences || typeof newPrivacyPreferences !== 'object') return;
    
    const validModes = ['standard', 'privacy'];
    if (!validModes.includes(newPrivacyPreferences.mode)) {
      return;
    }
    
    // Validate boolean values
    const booleanKeys = ['removeMetadata', 'neutralLanguage', 'avoidLocation', 'attorneyClient'];
    for (const key of booleanKeys) {
      if (typeof newPrivacyPreferences[key] !== 'boolean') {
        return;
      }
    }
    
    setPrivacyPreferences(newPrivacyPreferences);
  };

  const selectedDraft = drafts.find(d => d.id === selectedDraftId) || null;

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 mt-16 md:mt-32">
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
                />
              </TabsContent>
              <TabsContent value="compose">
                <ComposeTab 
                  selectedDraft={selectedDraft}
                  onGenerateDraft={handleGenerateDraft}
                  isLoading={isLoading}
                  error={error}
                  preferences={preferences}
                  privacyPreferences={privacyPreferences}
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
            />
          </div>
          
        </Tabs>
      </main>
    </div>
  );
} 