import { DocumentData } from 'firebase/firestore';

export interface ProofreadingDraft extends DocumentData {
  id?: string;
  userId: string;
  originalText: string;
  correctedText: string;
  corrections: ProofreadingCorrection[];
  documentType: 'course-notes' | 'case-brief' | 'legal-memo' | 'statute-analysis' | 'other';
  createdAt: number;
  updatedAt: number;
}

export interface ProofreadingCorrection {
  type: 'spelling' | 'grammar' | 'punctuation' | 'consistency';
  original: string;
  corrected: string;
  explanation: string;
  position: {
    start: number;
    end: number;
  };
  confidence: 'high' | 'medium' | 'low'; // Conservative approach - only apply high confidence corrections
}

// Helper function to convert to legacy Draft format for compatibility
export interface LegacyDraft {
  id: string;
  content: string;
  recipient?: string;
  timestamp: Date;
}

export function proofreadingDraftToLegacyDraft(draft: ProofreadingDraft): LegacyDraft {
  return {
    id: draft.id || '',
    content: draft.correctedText,
    recipient: 'Proofread Notes',
    timestamp: new Date(draft.createdAt)
  };
}
