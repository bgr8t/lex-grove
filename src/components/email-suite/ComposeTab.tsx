import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/components/ui/use-toast";
import { Draft } from '@/lib/models/draft';
import { EmailPreferences, PrivacyPreferences } from '@/pages/EmailSuite';
import { Badge } from '@/components/ui/badge';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';

interface ComposeTabProps {
  selectedDraft: Draft | null;
  onGenerateDraft: (data: { context: string; instructions: string; }) => void;
  isLoading: boolean;
  error: string | null;
  preferences: EmailPreferences;
  privacyPreferences: PrivacyPreferences;
}

export default function ComposeTab({ selectedDraft, onGenerateDraft, isLoading, error, preferences, privacyPreferences }: ComposeTabProps) {
  const [context, setContext] = useState('');
  const [instructions, setInstructions] = useState('');

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

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* Left Panel: Control Center (Form) */}
      <div className="w-full md:w-[45%] space-y-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <h3 className="text-lg font-medium">Compose Your Email</h3>
              <p className="text-sm text-muted-foreground">Fill in the details below to generate a new draft.</p>
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

            <Button 
              size="lg" 
              className="w-full gap-2" 
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
                <div className="space-y-2 mb-4">
                  <h4 className="font-medium">Generated Draft</h4>
                  <p className="text-xs text-muted-foreground">
                    Created: {selectedDraft.timestamp.toLocaleString()}
                  </p>
                </div>
                <Textarea
                  readOnly
                  className="w-full h-full min-h-[calc(100vh-20rem)] resize-none border-0 focus:ring-0 p-1 bg-transparent"
                  value={selectedDraft.content}
                />
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