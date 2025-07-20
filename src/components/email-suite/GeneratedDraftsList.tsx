import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Draft } from '@/lib/models/draft';
import { Card } from '@/components/ui/card';

interface GeneratedDraftsListProps {
  drafts: Draft[];
  selectedDraftId: string | null;
  onSelectDraft: (id: string) => void;
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

export default function GeneratedDraftsList({ drafts, selectedDraftId, onSelectDraft }: GeneratedDraftsListProps) {
  return (
    <Card className="p-2">
      <h3 className="text-sm font-medium mb-2 px-1">History</h3>
      {drafts.length === 0 ? (
        <div className="p-2 text-center bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">No drafts yet</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-20rem)] w-full rounded-md">
          <div className="space-y-0.5">
            {drafts.map((d) => {
              const subject = extractEmailSubject(d.content);
              return (
                <button
                  key={d.id}
                  onClick={() => onSelectDraft(d.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-sm transition-colors ${
                    selectedDraftId === d.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                  }`}
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
              );
            })}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
} 