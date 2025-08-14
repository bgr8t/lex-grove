import { DocumentData } from 'firebase/firestore';

export interface EmailDraft extends DocumentData {
  id?: string;
  userId: string;
  content: string;
  context: string;
  instructions: string;
  preferences: {
    tone: 'friendly' | 'formal' | 'professional' | 'casual';
    length: 'short' | 'medium' | 'long';
    role: string;
    organization: string;
    signature: string;
  };
  privacySettings: {
    mode: 'standard' | 'privacy';
    removeMetadata: boolean;
    neutralLanguage: boolean;
    avoidLocation: boolean;
    attorneyClient: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

// Helper function to convert EmailDraft to legacy Draft format for compatibility
export interface LegacyDraft {
  id: string;
  content: string;
  recipient?: string;
  timestamp: Date;
}

export function emailDraftToLegacyDraft(emailDraft: EmailDraft): LegacyDraft {
  return {
    id: emailDraft.id || '',
    content: emailDraft.content,
    recipient: 'No Recipient',
    timestamp: new Date(emailDraft.createdAt)
  };
}
