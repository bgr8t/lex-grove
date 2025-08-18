import { FirestoreService } from '../firestore';
import { ProofreadingDraft } from '../models/proofreadingDraft';
import { auth, db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

class ProofreadingService extends FirestoreService<ProofreadingDraft> {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    super('proofreadingDrafts');
    this.initializeGemini();
  }

  private initializeGemini() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      console.warn('Gemini API key not found. Proofreading functionality will be limited.');
    }
  }

  /**
   * Get all proofreading drafts for current user with security validation
   */
  async getDraftsByUser(userId: string, limitCount: number = 50): Promise<ProofreadingDraft[]> {
    // Validate user authentication
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error('Unauthorized access to proofreading drafts');
    }

    try {
      const draftsRef = collection(db, 'proofreadingDrafts');
      const q = query(
        draftsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }) as ProofreadingDraft);
    } catch (error) {
      console.error('Error fetching proofreading drafts:', error);
      throw new Error('Failed to load proofreading history');
    }
  }

  /**
   * Create a new proofreading draft with security validation
   */
  async createDraft(draftData: Omit<ProofreadingDraft, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // Validate user authentication
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== draftData.userId) {
      throw new Error('Unauthorized access');
    }

    // Validate and sanitize input
    if (!draftData.originalText || draftData.originalText.trim().length === 0) {
      throw new Error('Original text is required');
    }

    // Sanitize input length (max 15KB for legal documents)
    if (draftData.originalText.length > 15000) {
      throw new Error('Document too long. Maximum 15,000 characters allowed.');
    }

    try {
      const docRef = doc(collection(db, 'proofreadingDrafts'));

      // Create document data with proper typing for Firestore
      const docData = {
        userId: draftData.userId,
        originalText: draftData.originalText,
        correctedText: draftData.correctedText,
        corrections: draftData.corrections,
        documentType: draftData.documentType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(docRef, docData);

      return docRef.id;
    } catch (error) {
      console.error('Error creating proofreading draft:', error);
      throw new Error('Failed to save proofreading draft');
    }
  }

  /**
   * Delete a proofreading draft with proper authorization
   */
  async deleteDraft(draftId: string, userId: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error('Unauthorized access');
    }

    try {
      await deleteDoc(doc(db, 'proofreadingDrafts', draftId));
    } catch (error) {
      console.error('Error deleting proofreading draft:', error);
      throw new Error('Failed to delete proofreading draft');
    }
  }

  /**
   * Generate proofreading corrections using Gemini API
   */
  async generateProofreadingCorrections(
    originalText: string,
    documentType: string,
    outputLanguage: 'en' | 'fr' = 'en'
  ): Promise<{
    correctedText: string;
    corrections: any[];
  }> {
    // Validate and sanitize input
    if (!originalText || originalText.trim().length === 0) {
      throw new Error('Text is required');
    }

    if (originalText.length > 15000) {
      throw new Error('Document too long. Maximum 15,000 characters allowed.');
    }

    if (!this.genAI) {
      throw new Error('Gemini API not available. Please check your configuration.');
    }

    // Try different current model names in order of preference
    const modelNames = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
    let model;
    let modelUsed = '';

    for (const modelName of modelNames) {
      try {
        model = this.genAI.getGenerativeModel({ model: modelName });
        modelUsed = modelName;
        console.log(`Using Gemini model: ${modelName}`);
        break;
      } catch (modelError) {
        console.warn(`Model ${modelName} not available, trying next...`);
        continue;
      }
    }

    if (!model) {
      throw new Error('No available Gemini models found. Please verify your API key and model access.');
    }

    try {
      // Language-specific prompts
      const languageInstructions = outputLanguage === 'fr' 
        ? 'Vous devez répondre en français. Corrigez le texte en français tout en préservant le sens juridique exact.'
        : 'You must respond in English. Correct the text in English while preserving the exact legal meaning.';

      // Conservative legal proofreading system prompt
      const systemPrompt = `You are a hyper-conservative legal proofreading assistant 🧐. Your sole function is to correct grammar, spelling, punctuation, and syntax in legal course notes. Your absolute, non-negotiable priority is the 100% preservation of the original legal meaning and substance.

${languageInstructions}

You must operate under a "do no harm" principle regarding the content.

Core Directives:
Preserve Meaning Above All: Every correction must maintain the precise legal meaning of the original text. If a grammatical correction could in any way alter the interpretation of a legal rule, principle, or fact, you must leave the original text unchanged. When in doubt, make no change.

No Content Creation or Deletion: You are forbidden from adding new information, legal analysis, or examples. You are also forbidden from deleting or summarizing any content, even if it appears redundant. Every word in the original notes is considered potentially significant. Do not "clean up" the text by removing content.

Minimal Intervention: Your approach should be surgical. Correct only what is definitively an error in grammar, spelling, or punctuation. Avoid stylistic changes or rephrasing for "better flow" if the original text is understandable. Clarity improvements are acceptable only if they carry zero risk of altering nuance.

Allowed Actions ✅
Correcting Typos and Spelling Errors: Fix misspelled words (e.g., "judgement" to "judgment," "liable" from "liabel").
Fixing Punctuation: Correct misplaced commas, semicolons, apostrophes, and periods that create grammatical errors.
Correcting Grammatical Errors: Fix clear errors like subject-verb agreement, incorrect tense, or pronoun-antecedent disagreement.
Ensuring Consistency: If you see inconsistent capitalization of a key term (e.g., "Plaintiff" and "plaintiff"), you may standardize it to the more common usage within the document.

Strict Prohibitions ❌
DO NOT alter or "correct" legal terms of art, Latin phrases (e.g., mens rea, res judicata), or specific statutory language. These must be preserved exactly as written, even if they seem unusual.
DO NOT paraphrase or rephrase sentences. You are a proofreader, not an editor or a summarizer.
DO NOT modify the structure or content of citations.
DO NOT add, invent, or "hallucinate" any facts, principles, or analysis.
DO NOT simplify complex legal language. Legal precision is critical and must be maintained.
DO NOT offer any form of legal advice, opinion, or interpretation.

Please return ONLY the corrected text with minimal changes, preserving 100% of the legal meaning and substance.`;

      const prompt = `${systemPrompt}

Document Type: ${documentType}
Output Language: ${outputLanguage === 'fr' ? 'French' : 'English'}

Original Legal Text:
"${originalText.trim()}"

Please proofread this legal document following the conservative principles outlined above. Return only the corrected text with minimal changes that preserve all legal meaning. Respond in ${outputLanguage === 'fr' ? 'French' : 'English'}.`;

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const correctedText = response.text();

        // For now, return the corrected text
        // In a more sophisticated implementation, you would parse differences
        // and create detailed correction objects
        return {
          correctedText: correctedText.trim(),
          corrections: [] // Would be populated by comparing original vs corrected
        };
      } catch (apiError: any) {
        console.error(`Gemini API Error (using model: ${modelUsed}):`, apiError);
        
        // Handle specific API errors with user-friendly messages
        if (apiError.message?.includes('is not found') || apiError.message?.includes('not supported')) {
          throw new Error(`AI model "${modelUsed}" is temporarily unavailable. Please try again later or contact support.`);
        } else if (apiError.message?.includes('PERMISSION_DENIED')) {
          throw new Error('API access denied. Please check your Gemini API key configuration.');
        } else if (apiError.message?.includes('QUOTA_EXCEEDED')) {
          throw new Error('AI service quota exceeded. Please try again later.');
        } else if (apiError.message?.includes('INVALID_ARGUMENT')) {
          throw new Error('Invalid request. Please check your input and try again.');
        } else {
          throw new Error(`AI service error (${modelUsed}): ${apiError.message || 'Unknown error occurred'}`);
        }
      }

    } catch (error) {
      console.error('Error generating proofreading corrections:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to process proofreading request');
    }
  }
}

export const proofreadingService = new ProofreadingService();
