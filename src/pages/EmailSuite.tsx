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

export default function EmailSuite() {
  // State for drafts and UI, lifted up to the parent
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('compose');
  const { toast } = useToast();

  const handleGenerateDraft = async (formData: { recipient: string; context: string; instructions: string; }) => {
    if (!formData.context.trim()) {
      setError("Email Context is required to generate a draft.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setActiveTab('compose');

    try {
      const apiKey = import.meta.env.VITE_GROK_API_KEY;
      if (!apiKey) throw new Error("API key for Grok is not configured.");

      const prompt = `
        You are an expert email assistant. Generate a professional email draft based on the following details:
        **Recipient:** ${formData.recipient || 'recipient'}
        **Context:** ${formData.context}
        **Instructions:** ${formData.instructions}
        ---
        Draft the email below:
      `;
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const generatedContent = data.choices[0]?.message?.content?.trim();
      
      if (generatedContent) {
        const newDraft: Draft = {
          id: `draft_${Date.now()}`,
          content: generatedContent,
          recipient: formData.recipient || "No Recipient",
          timestamp: new Date(),
        };
        setDrafts(prev => [newDraft, ...prev]);
        setSelectedDraftId(newDraft.id);
        toast({ title: "Success", description: "New draft generated." });
      } else {
        throw new Error("The generated draft was empty.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDraft = (id: string) => {
    setSelectedDraftId(id);
    setActiveTab('compose');
  };

  const selectedDraft = drafts.find(d => d.id === selectedDraftId) || null;

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 mt-16 md:mt-32">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Navigation */}
          <div className="w-full md:w-60 shrink-0 order-1 md:order-none">
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
              <TabsContent value="preferences"><PreferencesTab /></TabsContent>
              <TabsContent value="compose">
                <ComposeTab 
                  selectedDraft={selectedDraft}
                  onGenerateDraft={handleGenerateDraft}
                  isLoading={isLoading}
                  error={error}
                />
              </TabsContent>
              <TabsContent value="privacy"><PrivacyTab /></TabsContent>
            </React.Suspense>
          </div>

          {/* History Section */}
          <div className="w-full md:w-60 shrink-0 order-3 md:order-none mt-8 md:mt-0">
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