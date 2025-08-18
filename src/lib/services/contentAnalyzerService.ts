import { FirestoreService } from '../firestore';
import { ContentAnalysisDraft, ContentAnalysisResult } from '../models/contentAnalysisDraft';
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

class ContentAnalyzerService extends FirestoreService<ContentAnalysisDraft> {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    super('contentAnalysisDrafts');
    this.initializeGemini();
  }

  private initializeGemini() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      console.warn('Gemini API key not found. Content analysis functionality will be limited.');
    }
  }

  /**
   * Get all content analysis drafts for current user with security validation
   */
  async getDraftsByUser(userId: string, limitCount: number = 50): Promise<ContentAnalysisDraft[]> {
    // Validate user authentication
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error('Unauthorized access to content analysis drafts');
    }

    try {
      const draftsRef = collection(db, 'contentAnalysisDrafts');
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
      }) as ContentAnalysisDraft);
    } catch (error) {
      console.error('Error fetching content analysis drafts:', error);
      throw new Error('Failed to load analysis history');
    }
  }

  /**
   * Create a new content analysis draft with security validation
   */
  async createDraft(draftData: Omit<ContentAnalysisDraft, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // Validate user authentication
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== draftData.userId) {
      throw new Error('Unauthorized access');
    }

    // Validate and sanitize input
    if (!draftData.originalText || draftData.originalText.trim().length === 0) {
      throw new Error('Original text is required');
    }

    // Sanitize input length (max 25KB for documents)
    if (draftData.originalText.length > 25000) {
      throw new Error('Document too long. Maximum 25,000 characters allowed.');
    }

    try {
      const docRef = doc(collection(db, 'contentAnalysisDrafts'));

      // Create document data with proper typing for Firestore
      const docData = {
        userId: draftData.userId,
        originalText: draftData.originalText,
        summary: draftData.summary,
        analysis: draftData.analysis,
        documentType: draftData.documentType,
        language: draftData.language,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(docRef, docData);

      return docRef.id;
    } catch (error) {
      console.error('Error creating content analysis draft:', error);
      throw new Error('Failed to save content analysis draft');
    }
  }

  /**
   * Delete a content analysis draft with proper authorization
   */
  async deleteDraft(draftId: string, userId: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error('Unauthorized access');
    }

    try {
      await deleteDoc(doc(db, 'contentAnalysisDrafts', draftId));
    } catch (error) {
      console.error('Error deleting content analysis draft:', error);
      throw new Error('Failed to delete content analysis draft');
    }
  }

  /**
   * Process a PDF file and extract text for content analysis
   * Validates input, ensures auth, handles errors gracefully
   */
  async processPdfFile(file: File, documentType: string): Promise<{
    summary: string;
    analysis: ContentAnalysisResult;
    detectedLanguage: string;
  }> {
    if (!this.genAI) {
      throw new Error('PDF processing service not available - API key not configured');
    }

    // Ensure user is authenticated - security requirement
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Authentication required for PDF processing');
    }

    // Comprehensive file validation - security first
    this.validatePdfFile(file);

    // Convert file with progress tracking
    const base64Data = await this.fileToBase64WithProgress(file);
    
    // Process with Gemini directly for content analysis
    return this.processPdfWithGemini(base64Data, documentType);
  }

  /**
   * Validate uploaded PDF file against security and size constraints
   * Implements multiple validation layers as per Cursor security rules
   */
  private validatePdfFile(file: File): void {
    // Type validation - prevent malicious file uploads
    if (file.type !== 'application/pdf') {
      throw new Error('Invalid file type. Only PDF files are supported.');
    }

    // Size validation - prevent DoS attacks (10MB limit for content analysis)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      const sizeMB = (maxFileSize / (1024 * 1024)).toFixed(1);
      throw new Error(`File too large. Maximum size is ${sizeMB}MB.`);
    }

    // Empty file check
    if (file.size === 0) {
      throw new Error('File appears to be empty. Please upload a valid PDF.');
    }

    // Name validation - basic security against path traversal
    if (file.name.length > 255) {
      throw new Error('File name too long.');
    }

    // Extension double-check - prevent MIME type spoofing
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('File must have .pdf extension.');
    }

    // Sanitize filename - remove dangerous characters
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/g;
    if (dangerousChars.test(file.name)) {
      throw new Error('File name contains invalid characters.');
    }
  }

  /**
   * Convert file to base64 with progress tracking
   * Handles errors gracefully for better UX
   */
  private async fileToBase64WithProgress(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          
          if (!base64) {
            throw new Error('Failed to convert file to base64');
          }
          
          resolve(base64);
        } catch (error) {
          reject(new Error('File conversion failed'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Process PDF with Gemini AI for content analysis
   * Uses the same conservative approach as text analysis
   */
  private async processPdfWithGemini(
    base64Data: string, 
    documentType: string
  ): Promise<{
    summary: string;
    analysis: ContentAnalysisResult;
    detectedLanguage: string;
  }> {
    if (!this.genAI) {
      throw new Error('Gemini AI not initialized');
    }

    // Try different model names in order of preference
    const modelNames = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
    let model;
    let modelUsed = '';

    for (const modelName of modelNames) {
      try {
        model = this.genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.2, // Low temperature for consistent legal analysis
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 8192,
          }
        });
        modelUsed = modelName;
        console.log(`Using Gemini model for PDF: ${modelName}`);
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
      // Quick legal document summarization system prompt for PDF
      const systemPrompt = `You are a legal document quick summarization expert 📋 processing a PDF document. Your primary function is to help users understand legal documents rapidly by providing actionable summaries focused on what they need to know and do.

Core Principles:
🎯 ACTION-ORIENTED: Focus on what the reader needs to do, know, and watch out for
⚡ SPEED: Provide information that can be quickly understood and acted upon
🛡️ ACCURACY: Preserve all legal meaning while making it accessible
⚖️ PRACTICAL: Emphasize practical implications and next steps
📅 TIME-SENSITIVE: Highlight deadlines, dates, and urgent items
📄 PDF EXTRACTION: Extract and analyze all readable text content from the PDF

Your summary must be:
- Clear and immediately actionable
- Focused on practical implications
- Respectful of legal terminology
- Organized for quick scanning
- Highlighting time-sensitive elements

You MUST return ONLY valid JSON with no markdown or explanations.

Required JSON structure:
{
  "detectedLanguage": "language_code (e.g., en, fr, es)",
  "summary": "Quick actionable summary highlighting key points and next steps (max 500 words)",
  "analysis": {
    "readabilityScore": {
      "score": number_0_to_100,
      "grade": "reading_level_description",
      "avgSentenceLength": number,
      "avgWordLength": number,
      "complexWords": number
    },
    "toneAnalysis": {
      "primary": "formal|informal|technical|persuasive|analytical|neutral",
      "confidence": number_0_to_1,
      "emotions": {
        "authority": number_0_to_1,
        "clarity": number_0_to_1,
        "objectivity": number_0_to_1
      }
    },
    "grammarIssues": [
      {
        "type": "grammar|punctuation|style|clarity",
        "message": "conservative_description",
        "suggestion": "minimal_conservative_fix",
        "position": {"start": number, "end": number},
        "severity": "high|medium|low"
      }
    ],
    "styleRecommendations": [
      {
        "category": "legal-terminology|sentence-structure|passive-voice|word-choice|formatting",
        "description": "conservative_recommendation",
        "examples": ["example1", "example2"],
        "impact": "high|medium|low"
      }
    ],
    "keyInsights": [
      {
        "type": "strength|weakness|recommendation",
        "title": "insight_title",
        "description": "conservative_description",
        "relevance": "high|medium|low"
      }
    ],
    "documentPurpose": "brief_analysis_of_document_purpose",
    "confidenceLevel": "high|medium|low"
  }
}`;

      const prompt = `${systemPrompt}

Document Type: ${documentType}

Please analyze the PDF document and provide a quick, actionable summary focused on what the reader needs to know and do. Extract all text content, detect the language, and organize the information for rapid understanding with emphasis on practical next steps. Return only valid JSON.`;

      // Create timeout promise to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('PDF processing timeout - try a smaller PDF')), 120000); // 2 minute timeout
      });

      // Race between processing and timeout
      const processingPromise = model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: 'application/pdf'
          }
        }
      ]);

      const result = await Promise.race([processingPromise, timeoutPromise]);
      const responseText = result.response.text();
      
      if (!responseText) {
        throw new Error('Empty response from AI model');
      }

      // Parse and validate response
      const analysisData = this.parseAndValidateResponse(responseText);
      
      return {
        summary: analysisData.summary,
        analysis: analysisData.analysis,
        detectedLanguage: analysisData.detectedLanguage
      };

    } catch (apiError: any) {
      console.error(`Gemini API Error (PDF processing with model: ${modelUsed}):`, apiError);
      
      // Handle specific API errors with user-friendly messages
      if (apiError.message?.includes('is not found') || apiError.message?.includes('not supported')) {
        throw new Error(`AI model "${modelUsed}" is temporarily unavailable. Please try again later or contact support.`);
      } else if (apiError.message?.includes('PERMISSION_DENIED')) {
        throw new Error('API access denied. Please check your Gemini API key configuration.');
      } else if (apiError.message?.includes('QUOTA_EXCEEDED')) {
        throw new Error('AI service quota exceeded. Please try again later.');
      } else if (apiError.message?.includes('INVALID_ARGUMENT')) {
        throw new Error('Invalid PDF or request. Please check your file and try again.');
      } else if (apiError.message?.includes('timeout')) {
        throw new Error('PDF processing timeout. Please try a smaller PDF file.');
      } else {
        throw new Error(`PDF processing error (${modelUsed}): ${apiError.message || 'Unknown error occurred'}`);
      }
    }
  }

  /**
   * Generate comprehensive content analysis using Gemini API
   * Conservative approach that preserves legal meaning while providing insights
   */
  async generateContentAnalysis(
    originalText: string,
    documentType: string,
    outputLanguage: 'en' | 'fr' = 'en'
  ): Promise<{
    summary: string;
    analysis: ContentAnalysisResult;
    detectedLanguage: string;
  }> {
    // Validate and sanitize input
    if (!originalText || originalText.trim().length === 0) {
      throw new Error('Text is required');
    }

    if (originalText.length > 25000) {
      throw new Error('Document too long. Maximum 25,000 characters allowed.');
    }

    if (!this.genAI) {
      throw new Error('Gemini API not available. Please check your configuration.');
    }

    // Try different model names in order of preference
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
      // Language-specific instructions
      const languageInstructions = outputLanguage === 'fr' 
        ? 'IMPORTANT: Vous devez répondre ENTIÈREMENT en français. Toutes les analyses, résumés et recommandations doivent être en français.'
        : 'IMPORTANT: You must respond ENTIRELY in English. All analysis, summaries, and recommendations must be in English.';

      // Quick legal document summarization system prompt
      const systemPrompt = `You are a legal document quick summarization expert 📋. Your primary function is to help users understand legal documents rapidly by providing actionable summaries focused on what they need to know and do.

${languageInstructions}

Core Principles:
🎯 ACTION-ORIENTED: Focus on what the reader needs to do, know, and watch out for
⚡ SPEED: Provide information that can be quickly understood and acted upon
🛡️ ACCURACY: Preserve all legal meaning while making it accessible
⚖️ PRACTICAL: Emphasize practical implications and next steps
📅 TIME-SENSITIVE: Highlight deadlines, dates, and urgent items

Your summary must be:
- Clear and immediately actionable
- Focused on practical implications
- Respectful of legal terminology
- Organized for quick scanning
- Highlighting time-sensitive elements

You MUST return ONLY valid JSON with no markdown or explanations.

Required JSON structure:
{
  "detectedLanguage": "language_code (e.g., en, fr, es)",
  "summary": "Quick actionable summary highlighting key points and next steps (max 500 words) - in ${outputLanguage}",
  "analysis": {
    "readabilityScore": {
      "score": number_0_to_100,
      "grade": "reading_level_description - in ${outputLanguage}",
      "avgSentenceLength": number,
      "avgWordLength": number,
      "complexWords": number
    },
    "toneAnalysis": {
      "primary": "formal|informal|technical|persuasive|analytical|neutral",
      "confidence": number_0_to_1,
      "emotions": {
        "authority": number_0_to_1,
        "clarity": number_0_to_1,
        "objectivity": number_0_to_1
      }
    },
    "grammarIssues": [
      {
        "type": "grammar|punctuation|style|clarity",
        "message": "conservative_description - in ${outputLanguage}",
        "suggestion": "minimal_conservative_fix - in ${outputLanguage}",
        "position": {"start": number, "end": number},
        "severity": "high|medium|low"
      }
    ],
    "styleRecommendations": [
      {
        "category": "legal-terminology|sentence-structure|passive-voice|word-choice|formatting",
        "description": "conservative_recommendation - in ${outputLanguage}",
        "examples": ["example1", "example2"],
        "impact": "high|medium|low"
      }
    ],
    "keyInsights": [
      {
        "type": "strength|weakness|recommendation",
        "title": "insight_title - in ${outputLanguage}",
        "description": "conservative_description - in ${outputLanguage}",
        "relevance": "high|medium|low"
      }
    ],
    "documentPurpose": "brief_analysis_of_document_purpose - in ${outputLanguage}",
    "confidenceLevel": "high|medium|low"
  }
}`;

      const prompt = `${systemPrompt}

Document Type: ${documentType}
Target Output Language: ${outputLanguage}

Text to Analyze:
"${originalText.trim()}"

Analyze this ${documentType} and provide a quick, actionable summary focused on what the reader needs to know and do. Detect the source language but provide ALL analysis content in ${outputLanguage}. Organize the information for rapid understanding with emphasis on practical next steps. Return only valid JSON.`;

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        // Parse and validate response
        const analysisData = this.parseAndValidateResponse(responseText);
        
        return {
          summary: analysisData.summary,
          analysis: analysisData.analysis,
          detectedLanguage: analysisData.detectedLanguage
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
      console.error('Error generating content analysis:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to process content analysis request');
    }
  }

  /**
   * Parse and validate AI response
   */
  private parseAndValidateResponse(responseText: string): {
    summary: string;
    analysis: ContentAnalysisResult;
    detectedLanguage: string;
  } {
    // Clean response - remove code blocks if present
    const cleanJson = responseText
      .replace(/```json\n?|\n?```/g, '')
      .replace(/```\n?|\n?```/g, '')
      .trim();

    let parsedData: any;
    try {
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', responseText);
      throw new Error('AI returned invalid response format');
    }

    // Validate required fields
    if (!parsedData.detectedLanguage || !parsedData.summary || !parsedData.analysis) {
      throw new Error('AI response missing required fields');
    }

    // Sanitize and validate
    return {
      summary: this.sanitizeString(parsedData.summary, 5000),
      analysis: this.sanitizeAnalysis(parsedData.analysis),
      detectedLanguage: this.sanitizeString(parsedData.detectedLanguage, 10)
    };
  }

  /**
   * Sanitize analysis object
   */
  private sanitizeAnalysis(analysis: any): ContentAnalysisResult {
    return {
      readabilityScore: {
        score: Math.max(0, Math.min(100, Number(analysis.readabilityScore?.score) || 0)),
        grade: this.sanitizeString(analysis.readabilityScore?.grade || 'Unknown', 50),
        avgSentenceLength: Math.max(0, Number(analysis.readabilityScore?.avgSentenceLength) || 0),
        avgWordLength: Math.max(0, Number(analysis.readabilityScore?.avgWordLength) || 0),
        complexWords: Math.max(0, Number(analysis.readabilityScore?.complexWords) || 0)
      },
      toneAnalysis: {
        primary: ['formal', 'informal', 'technical', 'persuasive', 'analytical', 'neutral'].includes(analysis.toneAnalysis?.primary) 
          ? analysis.toneAnalysis.primary : 'neutral',
        confidence: Math.max(0, Math.min(1, Number(analysis.toneAnalysis?.confidence) || 0)),
        emotions: {
          authority: Math.max(0, Math.min(1, Number(analysis.toneAnalysis?.emotions?.authority) || 0)),
          clarity: Math.max(0, Math.min(1, Number(analysis.toneAnalysis?.emotions?.clarity) || 0)),
          objectivity: Math.max(0, Math.min(1, Number(analysis.toneAnalysis?.emotions?.objectivity) || 0))
        }
      },
      grammarIssues: Array.isArray(analysis.grammarIssues) 
        ? analysis.grammarIssues.slice(0, 20).map((issue: any) => ({
            type: ['grammar', 'punctuation', 'style', 'clarity'].includes(issue.type) ? issue.type : 'style',
            message: this.sanitizeString(issue.message || '', 200),
            suggestion: this.sanitizeString(issue.suggestion || '', 200),
            position: {
              start: Math.max(0, Number(issue.position?.start) || 0),
              end: Math.max(0, Number(issue.position?.end) || 0)
            },
            severity: ['high', 'medium', 'low'].includes(issue.severity) ? issue.severity : 'medium'
          }))
        : [],
      styleRecommendations: Array.isArray(analysis.styleRecommendations)
        ? analysis.styleRecommendations.slice(0, 10).map((rec: any) => ({
            category: ['legal-terminology', 'sentence-structure', 'passive-voice', 'word-choice', 'formatting'].includes(rec.category) 
              ? rec.category : 'word-choice',
            description: this.sanitizeString(rec.description || '', 500),
            examples: Array.isArray(rec.examples) 
              ? rec.examples.slice(0, 3).map((ex: any) => this.sanitizeString(String(ex), 100))
              : [],
            impact: ['high', 'medium', 'low'].includes(rec.impact) ? rec.impact : 'medium'
          }))
        : [],
      keyInsights: Array.isArray(analysis.keyInsights)
        ? analysis.keyInsights.slice(0, 8).map((insight: any) => ({
            type: ['strength', 'weakness', 'recommendation'].includes(insight.type) ? insight.type : 'recommendation',
            title: this.sanitizeString(insight.title || '', 100),
            description: this.sanitizeString(insight.description || '', 300),
            relevance: ['high', 'medium', 'low'].includes(insight.relevance) ? insight.relevance : 'medium'
          }))
        : [],
      documentPurpose: this.sanitizeString(analysis.documentPurpose || '', 200),
      confidenceLevel: ['high', 'medium', 'low'].includes(analysis.confidenceLevel) ? analysis.confidenceLevel : 'medium'
    };
  }

  /**
   * Sanitize string input by removing dangerous characters
   */
  private sanitizeString(input: string, maxLength: number): string {
    return String(input || '')
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .slice(0, maxLength)
      .trim();
  }
}

export const contentAnalyzerService = new ContentAnalyzerService();
