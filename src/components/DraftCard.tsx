import { PencilIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Draft {
  id: string;
  authorId: string;
  title: string;
  excerpt: string;
  lastSaved: number;
}

interface DraftCardProps {
  draft: Draft;
  currentUserId: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export const DraftCard = ({ draft, currentUserId, onEdit, onDelete, className }: DraftCardProps) => {
  const lastSavedDate = new Date(draft.lastSaved).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className={`p-5 border rounded-xl bg-card/80 hover:bg-accent/10 transition-colors cursor-pointer flex flex-col min-h-[180px] shadow-neumorphic ${className}`}
      onClick={() => onEdit(draft.id)}
      tabIndex={0}
      role="button"
      aria-label={`Edit draft ${draft.title}`}
    >
      <div className="flex-grow">
        <h3 className="font-semibold text-lg line-clamp-2 mb-2">{draft.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-3">{draft.excerpt}</p>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
        <div className="flex items-center gap-1">
          <ClockIcon className="h-4 w-4" />
          <span>Last saved: {lastSavedDate}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-1 text-primary hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(draft.id);
            }}
          >
            <PencilIcon className="h-4 w-4" />
            <span>Continue Editing</span>
          </button>
          {currentUserId === draft.authorId && (
            <button
              className="flex items-center gap-1 text-red-500 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(draft.id);
              }}
            >
              <TrashIcon className="h-4 w-4" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 