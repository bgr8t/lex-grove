import React from 'react';
import { Mandate, Source, LegalQuestion } from '../models/mandate';
import { useResearchGroveService } from './firestoreResearchGrove';

// Legacy storage keys (for migration)
const MANDATES_KEY = 'research-grove-mandates';
const SOURCES_KEY = 'research-grove-sources';
const QUESTIONS_KEY = 'research-grove-questions';

// Migration utility to move data from sessionStorage to Firestore
export const migrateToFirestore = async () => {
  try {
    const service = useResearchGroveService();
    
    // Migrate mandates
    const mandatesData = sessionStorage.getItem(MANDATES_KEY);
    if (mandatesData) {
      const mandates: Mandate[] = JSON.parse(mandatesData);
      for (const mandate of mandates) {
        const { id, ...mandateData } = mandate;
        await service.createMandate(mandateData);
      }
      sessionStorage.removeItem(MANDATES_KEY);
    }

    // Migrate questions
    const questionsData = sessionStorage.getItem(QUESTIONS_KEY);
    if (questionsData) {
      const questions: LegalQuestion[] = JSON.parse(questionsData);
      for (const question of questions) {
        const { id, ...questionData } = question;
        await service.createQuestion(questionData);
      }
      sessionStorage.removeItem(QUESTIONS_KEY);
    }

    // Migrate sources
    const sourcesData = sessionStorage.getItem(SOURCES_KEY);
    if (sourcesData) {
      const sources: Source[] = JSON.parse(sourcesData);
      for (const source of sources) {
        const { id, ...sourceData } = source;
        await service.createSource(sourceData);
      }
      sessionStorage.removeItem(SOURCES_KEY);
    }

    console.log('Migration to Firestore completed successfully');
  } catch (error) {
    console.error('Migration to Firestore failed:', error);
  }
};

// Async wrapper for Research Grove operations
// This maintains backward compatibility while using Firestore
export const useAsyncResearchGroveStorage = () => {
  const service = useResearchGroveService();

  return React.useMemo(() => ({
    // Mandate operations
    async getMandates(): Promise<Mandate[]> {
      return await service.getUserMandates();
    },

    async addMandate(mandate: Omit<Mandate, 'id'>): Promise<Mandate> {
      return await service.createMandate(mandate);
    },

    async updateMandate(id: string, updates: Partial<Mandate>): Promise<void> {
      return await service.updateMandate(id, updates);
    },

    async deleteMandate(id: string): Promise<void> {
      return await service.deleteMandate(id);
    },

    // Question operations
    async getQuestionsByMandateId(mandateId: string): Promise<LegalQuestion[]> {
      return await service.getQuestionsByMandate(mandateId);
    },

    async addQuestion(question: Omit<LegalQuestion, 'id'>): Promise<LegalQuestion> {
      return await service.createQuestion(question);
    },

    async updateQuestion(id: string, updates: Partial<LegalQuestion>): Promise<void> {
      return await service.updateQuestion(id, updates);
    },

    async deleteQuestion(id: string): Promise<void> {
      return await service.deleteQuestion(id);
    },

    // Source operations
    async getSourcesByMandateId(mandateId: string): Promise<Source[]> {
      return await service.getSourcesByMandate(mandateId);
    },

    async getSourcesByQuestionId(questionId: string): Promise<Source[]> {
      return await service.getSourcesByQuestion(questionId);
    },

    async getUnassignedSourcesByMandateId(mandateId: string): Promise<Source[]> {
      return await service.getUnassignedSourcesByMandate(mandateId);
    },

    async addSource(source: Omit<Source, 'id'>): Promise<Source> {
      return await service.createSource(source);
    },

    async updateSource(id: string, updates: Partial<Source>): Promise<void> {
      return await service.updateSource(id, updates);
    },

    async deleteSource(id: string): Promise<void> {
      return await service.deleteSource(id);
    }
  }), [service]);
};

// Legacy synchronous storage (throws errors to force migration)
export const researchGroveStorage = {
  // Mandate operations
  getMandates(): Mandate[] {
    throw new Error('getMandates() is now async. Use useAsyncResearchGroveStorage().getMandates() instead.');
  },

  saveMandates(mandates: Mandate[]): void {
    throw new Error('saveMandates() is deprecated. Use Firestore service methods instead.');
  },

  addMandate(mandate: Mandate): void {
    throw new Error('addMandate() is now async. Use useAsyncResearchGroveStorage().addMandate() instead.');
  },

  updateMandate(id: string, updates: Partial<Mandate>): void {
    throw new Error('updateMandate() is now async. Use useAsyncResearchGroveStorage().updateMandate() instead.');
  },

  deleteMandate(id: string): void {
    throw new Error('deleteMandate() is now async. Use useAsyncResearchGroveStorage().deleteMandate() instead.');
  },

  // Question operations
  getQuestions(): LegalQuestion[] {
    throw new Error('getQuestions() is deprecated. Use useAsyncResearchGroveStorage().getQuestionsByMandateId() instead.');
  },

  saveQuestions(questions: LegalQuestion[]): void {
    throw new Error('saveQuestions() is deprecated. Use Firestore service methods instead.');
  },

  getQuestionsByMandateId(mandateId: string): LegalQuestion[] {
    throw new Error('getQuestionsByMandateId() is now async. Use useAsyncResearchGroveStorage().getQuestionsByMandateId() instead.');
  },

  addQuestion(question: LegalQuestion): void {
    throw new Error('addQuestion() is now async. Use useAsyncResearchGroveStorage().addQuestion() instead.');
  },

  updateQuestion(id: string, updates: Partial<LegalQuestion>): void {
    throw new Error('updateQuestion() is now async. Use useAsyncResearchGroveStorage().updateQuestion() instead.');
  },

  deleteQuestion(id: string): void {
    throw new Error('deleteQuestion() is now async. Use useAsyncResearchGroveStorage().deleteQuestion() instead.');
  },

  // Source operations
  getSources(): Source[] {
    throw new Error('getSources() is deprecated. Use useAsyncResearchGroveStorage().getSourcesByMandateId() instead.');
  },

  saveSources(sources: Source[]): void {
    throw new Error('saveSources() is deprecated. Use Firestore service methods instead.');
  },

  getSourcesByMandateId(mandateId: string): Source[] {
    throw new Error('getSourcesByMandateId() is now async. Use useAsyncResearchGroveStorage().getSourcesByMandateId() instead.');
  },

  getSourcesByQuestionId(questionId: string): Source[] {
    throw new Error('getSourcesByQuestionId() is now async. Use useAsyncResearchGroveStorage().getSourcesByQuestionId() instead.');
  },

  getUnassignedSourcesByMandateId(mandateId: string): Source[] {
    throw new Error('getUnassignedSourcesByMandateId() is now async. Use useAsyncResearchGroveStorage().getUnassignedSourcesByMandateId() instead.');
  },

  addSource(source: Source): void {
    throw new Error('addSource() is now async. Use useAsyncResearchGroveStorage().addSource() instead.');
  },

  updateSource(id: string, updates: Partial<Source>): void {
    throw new Error('updateSource() is now async. Use useAsyncResearchGroveStorage().updateSource() instead.');
  },

  deleteSource(id: string): void {
    throw new Error('deleteSource() is now async. Use useAsyncResearchGroveStorage().deleteSource() instead.');
  }
}; 