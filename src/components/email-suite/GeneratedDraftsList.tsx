import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Draft } from '@/lib/models/draft';

interface GeneratedDraftsListProps {
  drafts: Draft[];
  selectedDraftId: string | null;
  onSelectDraft: (id: string) => void;
}

export default function GeneratedDraftsList({ drafts, selectedDraftId, onSelectDraft }: GeneratedDraftsListProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium px-1">History</h3>
      {drafts.length === 0 ? (
        <div className="p-4 text-center bg-muted rounded-lg border">
          <p className="text-sm text-muted-foreground">Your email history will appear here.</p>
        </div>
      ) : (
        <ScrollArea className="h-60 w-full rounded-md border">
          <div className="p-2 space-y-1">
            {drafts.map((d) => (
              <button
                key={d.id}
                onClick={() => onSelectDraft(d.id)}
                className={`w-full text-left p-2 rounded-md transition-colors ${
                  selectedDraftId === d.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                }`}
              >
                <p className="font-semibold text-sm truncate">{d.recipient}</p>
                <p className="text-xs text-muted-foreground">
                  {d.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
} 