import { DocumentData } from 'firebase/firestore';

export interface ContentAnalysisDraft extends DocumentData {
  id?: string;
  userId: string;
  originalText: string;
  summary: string;
  analysis: ContentAnalysisResult;
  documentType: 'legal-document' | 'contract' | 'case-brief' | 'statute' | 'academic-paper' | 'other';
  language: string; // Detected language (en, fr, es, etc.)
  createdAt: number;
  updatedAt: number;
}

export interface ContentAnalysisResult {
  readabilityScore: ReadabilityMetrics;
  toneAnalysis: ToneAnalysis;
  grammarIssues: GrammarIssue[];
  styleRecommendations: StyleRecommendation[];
  keyInsights: KeyInsight[];
  documentPurpose: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface ReadabilityMetrics {
  score: number; // 0-100 scale
  grade: string; // e.g., "College level", "Graduate level"
  avgSentenceLength: number;
  avgWordLength: number;
  complexWords: number;
}

export interface ToneAnalysis {
  primary: 'formal' | 'informal' | 'technical' | 'persuasive' | 'analytical' | 'neutral';
  confidence: number; // 0-1 scale
  emotions: {
    authority: number;
    clarity: number;
    objectivity: number;
  };
}

export interface GrammarIssue {
  type: 'grammar' | 'punctuation' | 'style' | 'clarity';
  message: string;
  suggestion: string;
  position: {
    start: number;
    end: number;
  };
  severity: 'high' | 'medium' | 'low';
}

export interface StyleRecommendation {
  category: 'legal-terminology' | 'sentence-structure' | 'passive-voice' | 'word-choice' | 'formatting';
  description: string;
  examples: string[];
  impact: 'high' | 'medium' | 'low';
}

export interface KeyInsight {
  type: 'strength' | 'weakness' | 'recommendation';
  title: string;
  description: string;
  relevance: 'high' | 'medium' | 'low';
}
