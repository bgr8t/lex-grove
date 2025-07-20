import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { Mandate, Source, LegalQuestion } from '../../lib/models/mandate';

interface DocumentGenerationOptions {
  includeAnalysis: boolean;
  includeRecommendations: boolean;
  citationStyle: 'bluebook' | 'mcgill' | 'chicago';
  documentType: 'memo' | 'brief' | 'report';
}

// Initialize OpenAI client securely on the server
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateDocumentContent(
  mandate: Mandate,
  sources: Source[],
  questions: LegalQuestion[],
  options: DocumentGenerationOptions
): Promise<string | null> {
  const sourcesText = sources.map((source, index) =>
    `[Source ${index + 1}]: "${source.quote}"\nFull Citation: ${source.fullSource}\nAnalysis Note: ${source.note || 'No additional notes'}\n`
  ).join('\n');

  const questionsText = questions.length > 0 ? questions.map((q, index) =>
    `${index + 1}. ${q.question}${q.description ? ` - ${q.description}` : ''}`
  ).join('\n') : 'No specific legal questions provided.';

  const systemPrompt = `You are a legal research assistant tasked with creating a coherent, citation-ready document. 

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

  const userPrompt = `
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

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate document from server.');
  }
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mandate, sources, questions, options } = req.body;

    // Basic validation
    if (!mandate || !sources || !questions || !options) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }
    
    const generatedContent = await generateDocumentContent(mandate, sources, questions, options);

    if (generatedContent) {
      res.status(200).json({ content: generatedContent });
    } else {
      res.status(500).json({ error: 'Failed to generate document content.' });
    }
  } catch (error: any) {
    console.error('Error in generate-document handler:', error);
    res.status(500).json({ error: error.message || 'An unexpected error occurred.' });
  }
} 