import { DocumentData } from 'firebase/firestore';

export interface CaseBrief extends DocumentData {
  id?: string;
  title: string;
  citation: string;
  court: string;
  date: string;
  facts: string;
  issue: string;
  holding: string;
  reasoning: string;
  userId: string;
  upvotes?: number;     // Number of upvotes
  viewCount?: number;   // Number of times viewed
  createdAt: number;
  updatedAt: number;
} 