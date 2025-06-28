// Research Grove mandate data model
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface LegalQuestion {
  // Primary key
  id: string;                    // UUID v4 format
  
  // Foreign key relationship
  mandateId: string;             // References Mandate.id
  
  // Question content
  question: string;              // The legal question text
  description?: string;          // Optional detailed description
  priority?: Priority;           // Question-specific priority (optional)
  
  // Metadata
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}

export interface Mandate {
  // Primary key
  id: string;                    // UUID v4 format
  
  // Core mandate information
  title: string;                 // Mandate display name
  clientName: string;            // Client organization/person
  legalArea: string;             // Practice area category
  priority: Priority;            // Urgency level
  researchObjective: string;     // Detailed research goals
  
  // Assignment and timeline
  deadline: string;              // ISO 8601 date string
  assignedLawyer: string;        // Attorney name (optional)
  
  // Metadata
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}

export interface Source {
  // Primary key
  id: string;                    // UUID v4 format
  
  // Foreign key relationships
  mandateId: string;             // References Mandate.id
  questionId?: string;           // Optional: References LegalQuestion.id
  
  // Source content
  quote: string;                 // Key excerpt or quote
  fullSource: string;            // Complete citation
  note: string;                  // Personal analysis/context
  
  // Metadata
  createdAt: string;             // ISO 8601 timestamp
}

// Predefined legal areas
export const LEGAL_AREAS = [
  'Contract Law',
  'Corporate Law', 
  'Employment Law',
  'Intellectual Property',
  'Litigation',
  'Real Estate Law',
  'Tax Law',
  'Family Law',
  'Criminal Law',
  'Environmental Law'
] as const;

// Form data interfaces
export interface LegalQuestionFormData {
  question: string;
  description?: string;
  priority?: Priority;
}

export interface MandateFormData {
  title: string;
  clientName: string;
  legalArea: string;
  priority: Priority;
  researchObjective: string;
  deadline: string;
  assignedLawyer: string;
  questions: LegalQuestionFormData[];
}

export interface SourceFormData {
  quote: string;
  fullSource: string;
  note: string;
  questionId?: string;           // Optional question assignment
} 