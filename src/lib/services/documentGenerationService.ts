import { Mandate, Source, LegalQuestion } from '../models/mandate';
import { apiRequest } from '../apiClient';

interface DocumentGenerationOptions {
  includeAnalysis: boolean;
  includeRecommendations: boolean;
  citationStyle: 'bluebook' | 'mcgill' | 'chicago';
  documentType: 'memo' | 'brief' | 'report';
}

interface GeneratedDocument {
  content: string;
  metadata: {
    sourceCount: number;
    questionCount: number;
    generatedAt: string;
    mandate: Mandate;
    citationStyle: string;
  };
  citations: string[];
  sections: DocumentSection[];
}

interface DocumentSection {
  title: string;
  content: string;
  sources: Source[];
  questionId?: string;
}

export class DocumentGenerationService {
  constructor() {
    // No longer need to initialize OpenAI client here
  }

  async generateDocument(
    mandate: Mandate,
    sources: Source[],
    questions: LegalQuestion[],
    options: DocumentGenerationOptions
  ): Promise<GeneratedDocument> {
    // Validate inputs
    this.validateSources(sources);
    
    try {
      const response = await apiRequest<{ content: string }>('/api/generate-document', {
        method: 'POST',
        body: JSON.stringify({
          mandate,
          sources,
          questions,
          options,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const generatedContent = response.content;
      
      // Validate and parse response
      const document = this.parseAndValidateResponse(
        generatedContent,
        mandate,
        sources,
        questions,
        options
      );

      return document;
    } catch (error) {
      console.error('Error calling document generation API:', error);
      throw new Error('Failed to generate document. Please try again.');
    }
  }

  private validateSources(sources: Source[]): void {
    if (sources.length === 0) {
      throw new Error('At least one source is required for document generation');
    }
    
    // Validate each source has required fields
    sources.forEach((source, index) => {
      if (!source.quote || !source.fullSource) {
        throw new Error(`Source ${index + 1} is missing required quote or citation information`);
      }
    });
  }

  private parseAndValidateResponse(
    content: string | null,
    mandate: Mandate,
    sources: Source[],
    questions: LegalQuestion[],
    options: DocumentGenerationOptions
  ): GeneratedDocument {
    if (!content) {
      throw new Error('No content generated from AI service');
    }

    // Extract citations from content
    const citations = this.extractCitations(content);
    
    // Validate that no new sources were introduced
    this.validateNoFabricatedSources(content, sources);

    // Parse document sections
    const sections = this.parseSections(content, sources, questions);

    return {
      content,
      metadata: {
        sourceCount: sources.length,
        questionCount: questions.length,
        generatedAt: new Date().toISOString(),
        mandate,
        citationStyle: options.citationStyle,
      },
      citations,
      sections,
    };
  }

  private extractCitations(content: string): string[] {
    const citations: string[] = [];
    
    // Extract [Source X] references
    const sourceRefs = content.match(/\[Source \d+\]/g) || [];
    citations.push(...sourceRefs);
    
    // Extract formal legal citations (basic patterns)
    const legalCitations = content.match(/\b[A-Z][^.]*\s+v\.?\s+[A-Z][^.]*,?\s+\d+/g) || [];
    citations.push(...legalCitations);
    
    return [...new Set(citations)]; // Remove duplicates
  }

  private validateNoFabricatedSources(content: string, providedSources: Source[]): void {
    // Check for patterns that might indicate fabricated sources
    const suspiciousPatterns = [
      /\b(Smith v\.?\s+Jones|Doe v\.?\s+Roe|John v\.?\s+Jane)\b/gi,
      /\b\d{4}\s+SCC\s+\d+\b/g,
      /\b\[\d{4}\]\s+\d+\s+SCR\s+\d+\b/g,
    ];

    const providedCitations = providedSources.map(s => s.fullSource.toLowerCase());
    
    suspiciousPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const isProvided = providedCitations.some(citation => 
            citation.includes(match.toLowerCase())
          );
          if (!isProvided) {
            console.warn(`Potentially fabricated source detected: ${match}`);
            // Note: We log but don't throw to avoid false positives
          }
        });
      }
    });
  }

  private parseSections(
    content: string,
    sources: Source[],
    questions: LegalQuestion[]
  ): DocumentSection[] {
    // Basic section parsing - can be made more robust
    const sections: DocumentSection[] = [];
    const lines = content.split('\n');
    let currentSection: DocumentSection | null = null;

    for (const line of lines) {
      if (line.startsWith('# ')) { // Assuming H1 for main sections
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.substring(2).trim(),
          content: '',
          sources: [],
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }
    
    // Associate sources with sections
    sections.forEach(section => {
      section.sources = this.getRelevantSources(section.content, sources);
    });

    return sections;
  }

  private getRelevantSources(content: string, sources: Source[]): Source[] {
    const relevantSources: Source[] = [];
    const sourceRefs = content.match(/\[Source (\d+)\]/g) || [];

    for (const ref of sourceRefs) {
      const indexMatch = ref.match(/(\d+)/);
      if (indexMatch) {
        const index = parseInt(indexMatch[1], 10) - 1;
        if (sources[index] && !relevantSources.includes(sources[index])) {
          relevantSources.push(sources[index]);
        }
      }
    }

    return relevantSources;
  }
} 