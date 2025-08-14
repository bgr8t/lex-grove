import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Draft } from '@/lib/models/draft';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2Icon, AlertCircleIcon } from 'lucide-react';

interface GeneratedDraftsListProps {
  drafts: Draft[];
  selectedDraftId: string | null;
  onSelectDraft: (id: string) => void;
  onDeleteDraft: (id: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

const extractEmailSubject = (content: string): string => {
  // Try to find a subject line in the content
  const subjectMatch = content.match(/Subject:?\s*([^\n]+)/i);
  if (subjectMatch) {
    return subjectMatch[1].trim();
  }

  // If no subject, take the first non-empty line that's not "Dear" or a greeting
  const lines = content.split('\n').map(line => line.trim());
  const firstMeaningfulLine = lines.find(line => 
    line && 
    !line.toLowerCase().startsWith('dear') &&
    !line.toLowerCase().startsWith('hello') &&
    !line.toLowerCase().startsWith('hi') &&
    !line.match(/^[0-9]{1,2}:[0-9]{2}/) // Skip timestamps
  );

  if (firstMeaningfulLine) {
    // Truncate and add ellipsis if too long
    return firstMeaningfulLine.length > 50 
      ? `${firstMeaningfulLine.slice(0, 47)}...`
      : firstMeaningfulLine;
  }

  // Fallback: take first few words of content
  const words = content.split(' ').slice(0, 5).join(' ');
  return words.length < content.length ? `${words}...` : words;
};

export default function GeneratedDraftsList({ 
  drafts, 
  selectedDraftId, 
  onSelectDraft, 
  onDeleteDraft, 
  isLoading = false, 
  error = null 
}: GeneratedDraftsListProps) {
  return (
    <Card className="p-2">
      <h3 className="text-sm font-medium mb-2 px-1">History</h3>
      {error ? (
        <div className="p-2 text-center bg-destructive/10 rounded-md">
          <AlertCircleIcon className="h-4 w-4 text-destructive mx-auto mb-1" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      ) : isLoading ? (
        <div className="p-2 text-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
          <p className="text-xs text-muted-foreground mt-1">Loading...</p>
        </div>
      ) : drafts.length === 0 ? (
        <div className="p-2 text-center bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">No drafts yet</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-20rem)] w-full rounded-md">
          <div className="space-y-0.5">
            {drafts.map((d) => {
              const subject = extractEmailSubject(d.content);
              return (
                <div
                  key={d.id}
                  className={`group relative w-full text-left px-2 py-1.5 rounded-sm transition-colors ${
                    selectedDraftId === d.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                  }`}
                >
                  <button
                    onClick={() => onSelectDraft(d.id)}
                    className="w-full text-left pr-6"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium truncate flex-1">
                        {subject}
                      </p>
                      <p className="text-[10px] text-muted-foreground ml-2 whitespace-nowrap">
                        {d.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {d.content.split('\n')[0]}
                    </p>
                  </button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDraft(d.id);
                    }}
                    title="Delete draft"
                  >
                    <Trash2Icon className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
} 