import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/components/ui/use-toast";
import { Draft } from '@/lib/models/draft';

interface ComposeTabProps {
  selectedDraft: Draft | null;
  onGenerateDraft: (data: { context: string; instructions: string; }) => void;
  isLoading: boolean;
  error: string | null;
}

export default function ComposeTab({ selectedDraft, onGenerateDraft, isLoading, error }: ComposeTabProps) {
  const [context, setContext] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleGenerateClick = () => {
    onGenerateDraft({ context, instructions });
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      {/* Left Panel: Control Center (Form) */}
      <div className="w-full md:w-2/5 lg:w-1/3 space-y-6">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <h3 className="text-lg font-medium">Compose Your Email</h3>
              <p className="text-sm text-muted-foreground">Fill in the details below to generate a new draft.</p>
            </div>
            
            <div className="space-y-3">              
              <div>
                <label htmlFor="context" className="text-sm font-medium">Email Context</label>
                <Textarea id="context" placeholder="e.g., Follow up on our last meeting..." className="mt-1 min-h-[100px]" value={context} onChange={(e) => setContext(e.target.value)} />
              </div>

              <div>
                <label htmlFor="instructions" className="text-sm font-medium">Instructions</label>
                <Textarea id="instructions" placeholder="e.g., Be polite but firm..." className="mt-1" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
              </div>
            </div>

            <Button size="lg" className="w-full gap-2" onClick={handleGenerateClick} disabled={isLoading || !context.trim()}>
              {isLoading ? 'Generating...' : <><SparklesIcon className="h-5 w-5" /> Generate Draft</>}
            </Button>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: Viewing Area */}
      <div className="flex-1 w-full">
        <Card className="min-h-[60vh] sticky top-24">
          <CardContent className="p-4 h-full">
            {selectedDraft ? (
              <ScrollArea className="h-full w-full">
                <Textarea
                  readOnly
                  className="w-full h-full min-h-[55vh] resize-none border-0 focus:ring-0 p-1 bg-transparent"
                  value={selectedDraft.content}
                />
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <SparklesIcon className="h-10 w-10 mb-2" />
                <h3 className="text-lg font-semibold">Your generated draft will appear here</h3>
                <p className="text-sm">Select a draft from the list on the left, or generate a new one.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 