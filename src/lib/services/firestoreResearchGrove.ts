import { FirestoreService } from '../firestore';
import { Mandate, LegalQuestion, Source } from '../models/mandate';
import { useAuth } from '../../contexts/AuthContext';

// Extend interfaces to include userId for security
interface FirestoreMandate extends Mandate {
  userId: string;
}

interface FirestoreLegalQuestion extends LegalQuestion {
  userId: string;
}

interface FirestoreSource extends Source {
  userId: string;
}

// Create service instances
export const mandatesService = new FirestoreService<FirestoreMandate>('mandates');
export const questionsService = new FirestoreService<FirestoreLegalQuestion>('legal_questions');
export const sourcesService = new FirestoreService<FirestoreSource>('research_sources');

// Protected Research Grove Firestore Service
export class ProtectedResearchGroveService {
  private userId: string;

  constructor(userId: string) {
    if (!userId) {
      throw new Error('User must be authenticated to access Research Grove');
    }
    this.userId = userId;
  }

  // === MANDATE OPERATIONS ===
  async createMandate(mandate: Omit<Mandate, 'id'>): Promise<Mandate> {
    const mandateWithUser = { ...mandate, userId: this.userId };
    const result = await mandatesService.create(mandateWithUser);
    return result as Mandate;
  }

  async getUserMandates(): Promise<Mandate[]> {
    const results = await mandatesService.query([
      { field: 'userId', operator: '==', value: this.userId }
    ], { field: 'createdAt', direction: 'desc' });
    return results as Mandate[];
  }

  async getMandateById(mandateId: string): Promise<Mandate | null> {
    const mandate = await mandatesService.getById(mandateId);
    // Security check: ensure mandate belongs to current user
    if (mandate && (mandate as any).userId !== this.userId) {
      throw new Error('Unauthorized access to mandate');
    }
    return mandate as Mandate | null;
  }

  async updateMandate(mandateId: string, updates: Partial<Mandate>): Promise<void> {
    // Verify ownership first
    await this.getMandateById(mandateId);
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await mandatesService.update(mandateId, updatesWithTimestamp);
  }

  async deleteMandate(mandateId: string): Promise<void> {
    // Verify ownership first
    await this.getMandateById(mandateId);
    
    // Cascade delete: remove all questions and sources
    const questions = await this.getQuestionsByMandate(mandateId);
    const sources = await this.getSourcesByMandate(mandateId);

    // Delete all questions
    await Promise.all(questions.map(q => questionsService.delete(q.id!)));
    
    // Delete all sources  
    await Promise.all(sources.map(s => sourcesService.delete(s.id!)));
    
    // Delete mandate
    await mandatesService.delete(mandateId);
  }

  // === QUESTION OPERATIONS ===
  async createQuestion(question: Omit<LegalQuestion, 'id'>): Promise<LegalQuestion> {
    // Verify mandate ownership
    await this.getMandateById(question.mandateId);
    
    const questionWithUser = { ...question, userId: this.userId };
    const result = await questionsService.create(questionWithUser);
    return result as LegalQuestion;
  }

  async getQuestionsByMandate(mandateId: string): Promise<LegalQuestion[]> {
    // Verify mandate ownership
    await this.getMandateById(mandateId);
    
    const results = await questionsService.query([
      { field: 'userId', operator: '==', value: this.userId },
      { field: 'mandateId', operator: '==', value: mandateId }
    ], { field: 'createdAt', direction: 'asc' });
    return results as LegalQuestion[];
  }

  async updateQuestion(questionId: string, updates: Partial<LegalQuestion>): Promise<void> {
    const question = await questionsService.getById(questionId);
    if (!question || (question as any).userId !== this.userId) {
      throw new Error('Unauthorized access to question');
    }
    
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await questionsService.update(questionId, updatesWithTimestamp);
  }

  async deleteQuestion(questionId: string): Promise<void> {
    const question = await questionsService.getById(questionId);
    if (!question || (question as any).userId !== this.userId) {
      throw new Error('Unauthorized access to question');
    }

    // Unassign sources from this question
    const sources = await sourcesService.query([
      { field: 'userId', operator: '==', value: this.userId },
      { field: 'questionId', operator: '==', value: questionId }
    ]);

    await Promise.all(
      sources.map(source => 
        sourcesService.update(source.id!, { questionId: undefined })
      )
    );

    // Delete question
    await questionsService.delete(questionId);
  }

  // === SOURCE OPERATIONS ===
  async createSource(source: Omit<Source, 'id'>): Promise<Source> {
    // Verify mandate ownership
    await this.getMandateById(source.mandateId);
    
    // If assigned to question, verify question ownership
    if (source.questionId) {
      const question = await questionsService.getById(source.questionId);
      if (!question || (question as any).userId !== this.userId) {
        throw new Error('Unauthorized access to question');
      }
    }

    const sourceWithUser = { ...source, userId: this.userId };
    const result = await sourcesService.create(sourceWithUser);
    return result as Source;
  }

  async getSourcesByMandate(mandateId: string): Promise<Source[]> {
    // Verify mandate ownership
    await this.getMandateById(mandateId);
    
    const results = await sourcesService.query([
      { field: 'userId', operator: '==', value: this.userId },
      { field: 'mandateId', operator: '==', value: mandateId }
    ], { field: 'createdAt', direction: 'desc' });
    return results as Source[];
  }

  async getSourcesByQuestion(questionId: string): Promise<Source[]> {
    const question = await questionsService.getById(questionId);
    if (!question || (question as any).userId !== this.userId) {
      throw new Error('Unauthorized access to question');
    }

    const results = await sourcesService.query([
      { field: 'userId', operator: '==', value: this.userId },
      { field: 'questionId', operator: '==', value: questionId }
    ], { field: 'createdAt', direction: 'desc' });
    return results as Source[];
  }

  async getUnassignedSourcesByMandate(mandateId: string): Promise<Source[]> {
    // Verify mandate ownership
    await this.getMandateById(mandateId);
    
    const allSources = await this.getSourcesByMandate(mandateId);
    return allSources.filter(source => !source.questionId);
  }

  async updateSource(sourceId: string, updates: Partial<Source>): Promise<void> {
    const source = await sourcesService.getById(sourceId);
    if (!source || (source as any).userId !== this.userId) {
      throw new Error('Unauthorized access to source');
    }

    await sourcesService.update(sourceId, updates);
  }

  async deleteSource(sourceId: string): Promise<void> {
    const source = await sourcesService.getById(sourceId);
    if (!source || (source as any).userId !== this.userId) {
      throw new Error('Unauthorized access to source');
    }

    await sourcesService.delete(sourceId);
  }
}

// Hook to get authenticated Research Grove service
export function useResearchGroveService(): ProtectedResearchGroveService {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    throw new Error('User must be authenticated to access Research Grove');
  }

  return new ProtectedResearchGroveService(currentUser.uid);
} 