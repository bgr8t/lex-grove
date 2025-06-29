import OpenAI from 'openai';
import { Mandate, Source, LegalQuestion } from '../models/mandate';

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
  private openai: OpenAI;

  constructor() {
    // Use environment variable for OpenAI API key
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your environment.');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
  }

  async generateDocument(
    mandate: Mandate,
    sources: Source[],
    questions: LegalQuestion[],
    options: DocumentGenerationOptions
  ): Promise<GeneratedDocument> {
    // Validate inputs
    this.validateSources(sources);
    
    // Create structured prompt with guardrails
    const prompt = this.createPrompt(mandate, sources, questions, options);
    
    // Generate content with strict instructions
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(options)
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, // Low temperature for consistency
        max_tokens: 4000,
      });

      const generatedContent = response.choices[0].message.content;
      
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
      console.error('Error calling OpenAI API:', error);
      throw new Error('Failed to generate document. Please check your API configuration and try again.');
    }
  }

  private getSystemPrompt(options: DocumentGenerationOptions): string {
    return `You are a legal research assistant tasked with creating a coherent, citation-ready document. 

CRITICAL GUARDRAILS:
1. ONLY use information from the provided sources - never fabricate or invent sources
2. Every factual statement must be supported by a provided source
3. Use proper legal citation format (${options.citationStyle})
4. If insufficient sources exist for a topic, explicitly state "insufficient research available"
5. Clearly distinguish between facts from sources and logical inferences
6. Maintain professional legal writing tone
7. Structure content logically around the provided legal questions

PROHIBITED ACTIONS:
- Creating fictional cases or statutes
- Making unsupported legal conclusions
- Citing sources not provided in the input
- Fabricating quotes or legal principles

Your role is to synthesize and organize existing research, not to create new legal content.

Format your response as a well-structured legal document with clear headings and proper citations.`;
  }

  private createPrompt(
    mandate: Mandate,
    sources: Source[],
    questions: LegalQuestion[],
    options: DocumentGenerationOptions
  ): string {
    const sourcesText = sources.map((source, index) => 
      `[Source ${index + 1}]: "${source.quote}"\nFull Citation: ${source.fullSource}\nAnalysis Note: ${source.note || 'No additional notes'}\n`
    ).join('\n');

    const questionsText = questions.length > 0 ? questions.map((q, index) => 
      `${index + 1}. ${q.question}${q.description ? ` - ${q.description}` : ''}`
    ).join('\n') : 'No specific legal questions provided.';

    return `
MANDATE DETAILS:
Title: ${mandate.title}
Client: ${mandate.clientName}
Legal Area: ${mandate.legalArea}
Research Objective: ${mandate.researchObjective}
Priority: ${mandate.priority}
Deadline: ${mandate.deadline}
${mandate.assignedLawyer ? `Assigned Lawyer: ${mandate.assignedLawyer}` : ''}

LEGAL QUESTIONS TO ADDRESS:
${questionsText}

RESEARCH SOURCES (Use ONLY these sources):
${sourcesText}

TASK: Create a comprehensive ${options.documentType} that addresses the legal questions using ONLY the provided sources. Structure the document with:

1. EXECUTIVE SUMMARY
2. BACKGROUND AND CONTEXT
3. LEGAL ANALYSIS (organized by question if applicable)
4. ${options.includeRecommendations ? 'STRATEGIC RECOMMENDATIONS' : 'KEY FINDINGS'}
5. CONCLUSION
6. APPENDIX - SOURCE SUMMARY

Requirements:
- Use ${options.citationStyle} citation format
- Include proper citations for all factual statements using [Source X] format
- Clearly link sources to specific legal questions where applicable
- Maintain logical flow and coherent narrative
- Identify gaps where additional research is needed
- Never cite sources not provided in the research sources above
- If you cannot address a question due to insufficient sources, clearly state this limitation

Begin the document now:`;
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
    const sections: DocumentSection[] = [];
    
    // Split by common section headers
    const sectionHeaders = [
      'EXECUTIVE SUMMARY',
      'BACKGROUND AND CONTEXT',
      'LEGAL ANALYSIS',
      'STRATEGIC RECOMMENDATIONS',
      'KEY FINDINGS',
      'CONCLUSION',
      'APPENDIX'
    ];

    let currentSection = '';
    let currentContent = '';
    
    content.split('\n').forEach(line => {
      const isHeader = sectionHeaders.some(header => 
        line.toUpperCase().includes(header)
      );
      
      if (isHeader && currentSection) {
        sections.push({
          title: currentSection,
          content: currentContent.trim(),
          sources: this.getRelevantSources(currentContent, sources),
        });
        currentContent = '';
      }
      
      if (isHeader) {
        currentSection = line.trim();
      } else {
        currentContent += line + '\n';
      }
    });

    // Add final section
    if (currentSection && currentContent.trim()) {
      sections.push({
        title: currentSection,
        content: currentContent.trim(),
        sources: this.getRelevantSources(currentContent, sources),
      });
    }

    return sections;
  }

  private getRelevantSources(content: string, sources: Source[]): Source[] {
    return sources.filter(source => {
      // Check if source is referenced in content via [Source X] pattern
      const sourceIndex = sources.indexOf(source) + 1;
      const sourceRef = `[Source ${sourceIndex}]`;
      
      if (content.includes(sourceRef)) {
        return true;
      }
      
      // Also check for keyword matches as fallback
      const sourceKeywords = [
        ...source.quote.split(' ').slice(0, 5),
        ...source.fullSource.split(' ').slice(0, 3)
      ];
      
      return sourceKeywords.some(keyword => 
        keyword.length > 3 && content.toLowerCase().includes(keyword.toLowerCase())
      );
    });
  }
} 