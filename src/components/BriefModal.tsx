import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Brief } from "./BriefCard";
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { BookmarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { cn } from "@/lib/utils";

interface BriefModalProps {
  brief: Brief;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (brief: Brief) => void;
  saved?: boolean;
}

export const BriefModal = ({
  brief,
  isOpen,
  onClose,
  onSave,
  saved = false,
}: BriefModalProps) => {
  const handleSave = () => {
    if (onSave) {
      onSave(brief);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mb-2">
                {brief.courseName}
              </div>
              <DialogTitle className="text-2xl font-medium">
                {brief.title}
              </DialogTitle>
              <DialogDescription className="flex items-center space-x-2 text-sm">
                <DocumentTextIcon className="h-4 w-4" />
                <span>{brief.author} • {brief.date}</span>
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full transition-all duration-300 hover:bg-accent"
              onClick={handleSave}
              aria-label="Save brief"
            >
              {saved ? (
                <BookmarkSolidIcon className="h-4 w-4 text-primary" />
              ) : (
                <BookmarkIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Case Summary */}
          <section>
            <h3 className="text-lg font-medium mb-2">Summary</h3>
            <p className="text-muted-foreground">{brief.snippet}</p>
          </section>

          {/* Facts */}
          <section>
            <h3 className="text-lg font-medium mb-2">Facts</h3>
            <p className="text-muted-foreground">{brief.facts || "Facts of the case will be displayed here."}</p>
          </section>

          {/* Issue */}
          <section>
            <h3 className="text-lg font-medium mb-2">Issue</h3>
            <p className="text-muted-foreground">{brief.issue || "Legal issue(s) will be displayed here."}</p>
          </section>

          {/* Rule */}
          <section>
            <h3 className="text-lg font-medium mb-2">Rule</h3>
            <p className="text-muted-foreground">{brief.rule || "Legal rule(s) will be displayed here."}</p>
          </section>

          {/* Analysis */}
          <section>
            <h3 className="text-lg font-medium mb-2">Analysis</h3>
            <p className="text-muted-foreground">{brief.analysis || "Court's analysis will be displayed here."}</p>
          </section>

          {/* Conclusion */}
          <section>
            <h3 className="text-lg font-medium mb-2">Conclusion</h3>
            <p className="text-muted-foreground">{brief.conclusion || "Court's conclusion will be displayed here."}</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 