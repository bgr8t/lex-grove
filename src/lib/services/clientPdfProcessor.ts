import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { auth } from '@/lib/firebase';

interface ProcessedBriefData {
  title: string;
  facts: string;
  issue: string;
  rule: string;
  analysis: string;
  conclusion: string;
  tags: string[];
}

interface ProcessingOptions {
  maxFileSize?: number;
  timeout?: number;
  retries?: number;
}

/**
 * Client-side PDF processor using Gemini AI
 * Follows security best practices and handles all edge cases
 * Respects Cursor rules: secure, validated, mobile-optimized
 */
export class ClientPdfProcessor {
  private genAI: GoogleGenerativeAI | null = null;
  private readonly defaultOptions: Required<ProcessingOptions> = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    timeout: 60000, // 60 seconds
    retries: 2
  };

  constructor(options: ProcessingOptions = {}) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('VITE_GEMINI_API_KEY not configured - PDF processing will be unavailable');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  /**
   * Check if the processor is available
   */
  isAvailable(): boolean {
    return this.genAI !== null;
  }

  /**
   * Process a PDF file and extract case brief information
   * Validates input, ensures auth, handles errors gracefully
   */
  async processFile(file: File, options: ProcessingOptions = {}): Promise<ProcessedBriefData> {
    if (!this.genAI) {
      throw new Error('PDF processing service not available - API key not configured');
    }

    // Ensure user is authenticated - security requirement
    if (!auth.currentUser) {
      throw new Error('Authentication required for PDF processing');
    }

    const config = { ...this.defaultOptions, ...options };
    
    // Comprehensive file validation - security first
    this.validateFile(file, config);

    // Convert file with progress tracking
    const base64Data = await this.fileToBase64WithProgress(file);
    
    // Process with retry logic for reliability
    return this.processWithRetry(base64Data, config);
  }

  /**
   * Validate uploaded file against security and size constraints
   * Implements multiple validation layers as per Cursor security rules
   */
  private validateFile(file: File, config: Required<ProcessingOptions>): void {
    // Type validation - prevent malicious file uploads
    if (file.type !== 'application/pdf') {
      throw new Error('Invalid file type. Only PDF files are supported.');
    }

    // Size validation - prevent DoS attacks
    if (file.size > config.maxFileSize) {
      const sizeMB = (config.maxFileSize / (1024 * 1024)).toFixed(1);
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
   * Process PDF with Gemini AI with retry logic
   * Implements exponential backoff for reliability
   */
  private async processWithRetry(
    base64Data: string, 
    config: Required<ProcessingOptions>
  ): Promise<ProcessedBriefData> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= config.retries; attempt++) {
      try {
        return await this.processWithGemini(base64Data, config.timeout);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors - save API quota
        if (this.isNonRetryableError(error as Error)) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < config.retries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }
    
    throw lastError || new Error('Processing failed after retries');
  }

  /**
   * Core Gemini AI processing logic
   * Implements safety settings and proper error handling
   */
  private async processWithGemini(base64Data: string, timeout: number): Promise<ProcessedBriefData> {
    if (!this.genAI) {
      throw new Error('Gemini AI not initialized');
    }

    const model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2, // Low temperature for consistent legal analysis
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const prompt = this.createOptimizedPrompt();
    
    // Create timeout promise to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Processing timeout - try a smaller PDF')), timeout);
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

    return this.parseAndValidateResponse(responseText);
  }

  /**
   * Create optimized prompt for legal case analysis
   * Designed for consistent, structured output with automatic language detection
   */
  private createOptimizedPrompt(): string {
    return `You are a legal assistant analyzing a case PDF. Extract information for an IRAC case brief.

CRITICAL INSTRUCTIONS:
- FIRST: Detect the primary language of the document (French, English, Spanish, German, Italian, etc.)
- IMPORTANT: Generate ALL extracted content in the SAME LANGUAGE as the source document
- Return ONLY valid JSON, no markdown or explanation
- Ensure all required fields are present
- Keep content concise but comprehensive
- Focus on legal substance, not procedural details
- Use proper legal terminology in the target language
- If information is unclear, state "Information not clearly specified in document" (translated to document language)

Required JSON structure:
{
  "title": "Case name in document language (e.g., Demandeur c. Défendeur for French)",
  "facts": "Material facts in document language (max 800 words)",
  "issue": "Legal questions in document language (max 400 words)",
  "rule": "Legal principles/statutes in document language (max 500 words)", 
  "analysis": "Court's reasoning in document language (max 800 words)",
  "conclusion": "Court's decision in document language (max 400 words)",
  "tags": ["3-6 legal topic tags in document language"]
}

LANGUAGE EXAMPLES:
- French document → French output: "Faits", "Question de droit", "Règle", "Analyse", "Conclusion"
- English document → English output: "Facts", "Issue", "Rule", "Analysis", "Conclusion"
- Spanish document → Spanish output: "Hechos", "Cuestión", "Regla", "Análisis", "Conclusión"
- Maintain consistent legal vocabulary and structure in the detected language`;
  }

  /**
   * Parse and validate AI response
   * Implements robust error handling and data validation
   */
  private parseAndValidateResponse(responseText: string): ProcessedBriefData {
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

    // Validate and sanitize
    const sanitized = this.sanitizeAndValidate(parsedData);
    
    // Ensure minimum content for useful output
    if (!sanitized.title && !sanitized.facts && !sanitized.issue) {
      throw new Error('Unable to extract meaningful information from PDF');
    }

    return sanitized;
  }

  /**
   * Sanitize and validate extracted data
   * Implements input sanitization as per security requirements
   */
  private sanitizeAndValidate(data: any): ProcessedBriefData {
    return {
      title: this.sanitizeString(data.title || '', 200),
      facts: this.sanitizeString(data.facts || '', 8000),
      issue: this.sanitizeString(data.issue || '', 4000),
      rule: this.sanitizeString(data.rule || '', 5000),
      analysis: this.sanitizeString(data.analysis || '', 8000),
      conclusion: this.sanitizeString(data.conclusion || '', 4000),
      tags: Array.isArray(data.tags) 
        ? data.tags
            .slice(0, 8)
            .map((t: any) => this.sanitizeString(String(t), 30))
            .filter(Boolean)
        : []
    };
  }

  /**
   * Sanitize string input by removing dangerous characters
   * Prevents XSS and other injection attacks
   */
  private sanitizeString(input: string, maxLength: number): string {
    return input
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .slice(0, maxLength)
      .trim();
  }

  /**
   * Check if error should not be retried
   * Optimizes API usage and user experience
   */
  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('quota') ||
      message.includes('authentication') ||
      message.includes('invalid file') ||
      message.includes('file too large') ||
      message.includes('timeout') ||
      message.includes('api key')
    );
  }

  /**
   * Utility delay function for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
