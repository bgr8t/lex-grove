import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  ClipboardIcon,
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Mandate, Source, SourceFormData, LegalQuestion } from '@/lib/models/mandate';
import { useAsyncResearchGroveStorage } from '@/lib/services/researchGroveStorage';
import { useToast } from '@/hooks/use-toast';
import { DocumentGenerationService } from '@/lib/services/documentGenerationService';
import { AIGenerationWarning, AIGenerationGuidelines } from './AIGenerationWarning';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Form validation schema
const sourceSchema = z.object({
  quote: z.string().min(1, 'Quote is required'),
  fullSource: z.string().min(1, 'Full source is required'),
  note: z.string().optional().default(''),
  questionId: z.string().optional(),
});

interface ResearchToolProps {
  mandate: Mandate;
  onBack: () => void;
}

export const ResearchTool: React.FC<ResearchToolProps> = ({ mandate, onBack }) => {
  const { toast } = useToast();
  const storage = useAsyncResearchGroveStorage();
  const [sources, setSources] = useState<Source[]>([]);
  const [questions, setQuestions] = useState<LegalQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedQuestionFilter, setSelectedQuestionFilter] = useState<string>('all');
  const [isQuestionsCollapsed, setIsQuestionsCollapsed] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);
  
  // AI Document Generation State
  const [isGeneratingAIDocument, setIsGeneratingAIDocument] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);
  const [showAIDocumentPreview, setShowAIDocumentPreview] = useState(false);
  const [showAIWarning, setShowAIWarning] = useState(false);
  const [documentOptions, setDocumentOptions] = useState({
    includeAnalysis: true,
    includeRecommendations: true,
    citationStyle: 'mcgill' as const,
    documentType: 'memo' as const,
  });

  const form = useForm<SourceFormData>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      quote: '',
      fullSource: '',
      note: '',
      questionId: '',
    },
  });

  // Load sources and questions on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsDataLoading(true);
        const [loadedSources, loadedQuestions] = await Promise.all([
          storage.getSourcesByMandateId(mandate.id),
          storage.getQuestionsByMandateId(mandate.id)
        ]);
        setSources(loadedSources);
        setQuestions(loadedQuestions);
      } catch (error) {
        console.error('Error loading research data:', error);
        toast({
          title: "Error",
          description: "Failed to load research data.",
          variant: "destructive",
        });
      } finally {
        setIsDataLoading(false);
      }
    };

    loadData();
  }, [mandate.id]); // Only depend on mandate.id to prevent flickering

  const handleAddSource = async (data: SourceFormData) => {
    // Prevent multiple submissions
    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Convert "unassigned" or empty values to null for Firestore compatibility
      const processedData = {
        ...data,
        questionId: (data.questionId === 'unassigned' || !data.questionId) ? null : data.questionId,
      };
      
      const sourceData = {
        mandateId: mandate.id,
        ...processedData,
        createdAt: new Date().toISOString(),
      };

      // Create the source first
      const newSource = await storage.addSource(sourceData);
      
      // Only update UI state after successful creation
      setSources(prev => [...prev, newSource]);
      
      // Reset form only after everything succeeds
      form.reset({
        quote: '',
        fullSource: '',
        note: '',
        questionId: '',
      });

      toast({
        title: "Success",
        description: "Research source added successfully.",
      });
    } catch (error) {
      console.error('Error adding source:', error);
      
      // Provide more specific error messaging
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to add research source. Please try again.";
        
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    try {
      await storage.deleteSource(sourceId);
      setSources(prev => prev.filter(s => s.id !== sourceId));
      
      toast({
        title: "Success",
        description: "Research source deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete research source.",
        variant: "destructive",
      });
    }
  };

  // AI Document Generation Handler
  const handleGenerateAIDocument = async () => {
    if (sources.length < 2) {
      toast({
        title: "Insufficient Sources",
        description: "Please add at least 2 research sources before generating an AI document.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingAIDocument(true);
      
      const documentService = new DocumentGenerationService();
      const document = await documentService.generateDocument(
        mandate,
        sources,
        questions,
        documentOptions
      );
      
      setGeneratedDocument(document);
      setShowAIDocumentPreview(true);
      setShowAIWarning(false); // Close warning dialog
      
      toast({
        title: "Success",
        description: "AI document generated successfully! Please review carefully.",
      });
    } catch (error) {
      console.error('Error generating AI document:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAIDocument(false);
    }
  };

  const generateMarkdownPreview = () => {
    let markdown = `# ${mandate.title}\n\n`;
    markdown += `**Client:** ${mandate.clientName}\n`;
    markdown += `**Legal Area:** ${mandate.legalArea}\n`;
    markdown += `**Priority:** ${mandate.priority}\n`;
    markdown += `**Deadline:** ${new Date(mandate.deadline).toLocaleDateString()}\n`;
    if (mandate.assignedLawyer) {
      markdown += `**Assigned Lawyer:** ${mandate.assignedLawyer}\n`;
    }
    markdown += `\n## Research Objective\n\n${mandate.researchObjective}\n\n`;

    // Organize by questions
    if (questions.length > 0) {
      markdown += `## Legal Questions and Analysis\n\n`;
      
      questions.forEach((question, qIndex) => {
        markdown += `### ${qIndex + 1}. ${question.question}\n\n`;
        if (question.description) {
          markdown += `${question.description}\n\n`;
        }
        
        const questionSources = sources.filter(s => s.questionId === question.id);
        if (questionSources.length > 0) {
          markdown += `#### Sources:\n\n`;
          questionSources.forEach((source, sIndex) => {
            markdown += `**Source ${sIndex + 1}:**\n\n`;
            if (source.quote) {
              markdown += `> "${source.quote}"\n\n`;
            }
            if (source.fullSource) {
              markdown += `**Citation:** ${source.fullSource}\n\n`;
            }
            if (source.note) {
              markdown += `**Analysis:** ${source.note}\n\n`;
            }
            markdown += `---\n\n`;
          });
        } else {
          markdown += `*No sources assigned to this question yet.*\n\n`;
        }
        markdown += `\n`;
      });

      // Unassigned sources
      const unassignedSources = sources.filter(s => !s.questionId);
      if (unassignedSources.length > 0) {
        markdown += `## Additional Sources\n\n`;
        unassignedSources.forEach((source, index) => {
          markdown += `### Source ${index + 1}\n\n`;
          if (source.quote) {
            markdown += `> "${source.quote}"\n\n`;
          }
          if (source.fullSource) {
            markdown += `**Citation:** ${source.fullSource}\n\n`;
          }
          if (source.note) {
            markdown += `**Analysis:** ${source.note}\n\n`;
          }
          markdown += `---\n\n`;
        });
      }
    } else {
      // Fallback to old format if no questions
      markdown += `## Sources and Analysis\n\n`;
      sources.forEach((source, index) => {
        markdown += `### Source ${index + 1}\n\n`;
        if (source.quote) {
          markdown += `> "${source.quote}"\n\n`;
        }
        if (source.fullSource) {
          markdown += `**Source:** ${source.fullSource}\n\n`;
        }
        if (source.note) {
          markdown += `**Analysis:** ${source.note}\n\n`;
        }
        markdown += `---\n\n`;
      });
    }

    return markdown;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdownPreview());
      toast({
        title: "Copied to clipboard",
        description: "Document preview has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const generatePDF = async () => {
    if (!documentRef.current) return;
    
    setIsGeneratingPdf(true);
    try {
      const element = documentRef.current;
      
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `${mandate.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_research_document.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait' 
        }
      };

      await html2pdf().set(opt).from(element).save();
      
      toast({
        title: "PDF Generated",
        description: "Your research document has been downloaded as PDF.",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "PDF Generation Failed",
        description: "Unable to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const generateDOCX = async () => {
    setIsGeneratingDoc(true);
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Document Title
            new Paragraph({
              children: [
                new TextRun({
                  text: mandate.title,
                  bold: true,
                  size: 32,
                }),
              ],
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Document Metadata
            new Paragraph({
              children: [
                new TextRun({ text: "Client: ", bold: true }),
                new TextRun({ text: mandate.clientName }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Legal Area: ", bold: true }),
                new TextRun({ text: mandate.legalArea }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Priority: ", bold: true }),
                new TextRun({ text: mandate.priority }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Deadline: ", bold: true }),
                new TextRun({ text: new Date(mandate.deadline).toLocaleDateString() }),
              ],
              spacing: { after: 200 },
            }),
            
            ...(mandate.assignedLawyer ? [
              new Paragraph({
                children: [
                  new TextRun({ text: "Assigned Lawyer: ", bold: true }),
                  new TextRun({ text: mandate.assignedLawyer }),
                ],
                spacing: { after: 400 },
              })
            ] : []),

            // Research Objective
            new Paragraph({
              children: [
                new TextRun({
                  text: "Research Objective",
                  bold: true,
                  size: 24,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: mandate.researchObjective }),
              ],
              spacing: { after: 400 },
            }),

            // Sources Section
            new Paragraph({
              children: [
                new TextRun({
                  text: "Sources and Analysis",
                  bold: true,
                  size: 24,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),

            // Add sources
            ...sources.flatMap((source, index) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Source ${index + 1}`,
                    bold: true,
                    size: 20,
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 },
              }),
              ...(source.quote ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: `"${source.quote}"`, italics: true }),
                  ],
                  spacing: { after: 200 },
                }),
              ] : []),
              ...(source.fullSource ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Citation: ", bold: true }),
                    new TextRun({ text: source.fullSource }),
                  ],
                  spacing: { after: 200 },
                }),
              ] : []),
              ...(source.note ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Analysis: ", bold: true }),
                    new TextRun({ text: source.note }),
                  ],
                  spacing: { after: 300 },
                }),
              ] : []),
            ]),

            // Footer
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
                  size: 18,
                  color: "666666",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 600 },
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const filename = `${mandate.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_research_document.docx`;
      
      saveAs(blob, filename);
      
      toast({
        title: "Word Document Generated",
        description: "Your research document has been downloaded as DOCX.",
      });
    } catch (error) {
      console.error('DOCX generation error:', error);
      toast({
        title: "Document Generation Failed",
        description: "Unable to generate Word document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Filter sources based on selected question
  const filteredSources = selectedQuestionFilter === 'all' 
    ? sources 
    : selectedQuestionFilter === 'unassigned'
    ? sources.filter(s => !s.questionId)
    : sources.filter(s => s.questionId === selectedQuestionFilter);

  const groupedSources = () => {
    if (questions.length === 0) {
      return [{
        question: null,
        sources: sources
      }];
    }

    const groups = [];
    
    // Add sources for each question
    questions.forEach(question => {
      const questionSources = sources.filter(s => s.questionId === question.id);
      if (questionSources.length > 0) {
        groups.push({
          question,
          sources: questionSources
        });
      }
    });

    // Add unassigned sources
    const unassignedSources = sources.filter(s => !s.questionId);
    if (unassignedSources.length > 0) {
      groups.push({
        question: null,
        sources: unassignedSources
      });
    }

    return groups;
  };

  if (isDataLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading research data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Mandates
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{mandate.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {mandate.clientName} • Due {formatDate(mandate.deadline)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* AI Generate Document Button */}
              <Dialog open={showAIWarning} onOpenChange={setShowAIWarning}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center gap-2"
                    disabled={isGeneratingAIDocument}
                  >
                    {isGeneratingAIDocument ? (
                      <>
                        <SparklesIcon className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-4 h-4" />
                        AI Generate
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <SparklesIcon className="h-5 w-5 text-blue-600" />
                      AI Document Generation
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-1 rounded-full hover:bg-amber-100 transition-colors ml-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 hover:text-amber-700" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-80 bg-amber-50 border-amber-200" 
                          align="start"
                          sideOffset={5}
                        >
                          <AIGenerationGuidelines />
                        </PopoverContent>
                      </Popover>
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    <AIGenerationWarning 
                      sourceCount={sources.length}
                      questionCount={questions.length}
                    />
                    
                    {/* Document Options */}
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <CogIcon className="h-4 w-4 text-gray-600" />
                        Document Options
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Document Type</label>
                          <Select 
                            value={documentOptions.documentType} 
                            onValueChange={(value: any) => setDocumentOptions(prev => ({...prev, documentType: value}))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="memo">Legal Memo</SelectItem>
                              <SelectItem value="brief">Legal Brief</SelectItem>
                              <SelectItem value="report">Research Report</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700">Citation Style</label>
                          <Select 
                            value={documentOptions.citationStyle} 
                            onValueChange={(value: any) => setDocumentOptions(prev => ({...prev, citationStyle: value}))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mcgill">McGill Guide</SelectItem>
                              <SelectItem value="bluebook">Bluebook</SelectItem>
                              <SelectItem value="chicago">Chicago</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={documentOptions.includeAnalysis}
                            onChange={(e) => setDocumentOptions(prev => ({...prev, includeAnalysis: e.target.checked}))}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">Include detailed legal analysis</span>
                        </label>
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={documentOptions.includeRecommendations}
                            onChange={(e) => setDocumentOptions(prev => ({...prev, includeRecommendations: e.target.checked}))}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">Include strategic recommendations</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Generate Button */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setShowAIWarning(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleGenerateAIDocument}
                        disabled={sources.length < 2 || isGeneratingAIDocument}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        {isGeneratingAIDocument ? (
                          <>
                            <SparklesIcon className="w-4 h-4 mr-2 animate-spin" />
                            Generating Document...
                          </>
                        ) : (
                          <>
                            <SparklesIcon className="w-4 h-4 mr-2" />
                            Generate AI Document
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Traditional Generate Document Button */}
              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    disabled={sources.length === 0}
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                    Generate Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5" />
                        Document Preview - {mandate.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateDOCX}
                          disabled={isGeneratingDoc}
                          className="flex items-center gap-2"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          {isGeneratingDoc ? 'Generating...' : 'Download DOC'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generatePDF}
                          disabled={isGeneratingPdf}
                          className="flex items-center gap-2"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyToClipboard}
                          className="flex items-center gap-2"
                        >
                          <ClipboardIcon className="w-4 h-4" />
                          Copy
                        </Button>
                      </div>
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[75vh] mt-4">
                    <div 
                      ref={documentRef}
                      className="bg-white border border-gray-200 shadow-lg mx-auto max-w-4xl"
                    >
                      {/* Document Header - Word-like styling */}
                      <div className="px-16 py-12 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
                        <div className="text-center space-y-2">
                          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                            {mandate.title}
                          </h1>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><span className="font-semibold">Client:</span> {mandate.clientName}</p>
                            <p><span className="font-semibold">Legal Area:</span> {mandate.legalArea}</p>
                            <div className="flex justify-center items-center gap-4">
                              <span><span className="font-semibold">Priority:</span> {mandate.priority}</span>
                              <span><span className="font-semibold">Deadline:</span> {new Date(mandate.deadline).toLocaleDateString()}</span>
                            </div>
                            {mandate.assignedLawyer && (
                              <p><span className="font-semibold">Assigned Lawyer:</span> {mandate.assignedLawyer}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Document Body with Word-like typography */}
                      <div className="px-16 py-8">
                        <div className="prose prose-lg prose-gray max-w-none leading-relaxed">
                          <ReactMarkdown
                            components={{
                              h1: ({children}) => (
                                <h1 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                                  {children}
                                </h1>
                              ),
                              h2: ({children}) => (
                                <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4 pb-1 border-b border-gray-100">
                                  {children}
                                </h2>
                              ),
                              h3: ({children}) => (
                                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">
                                  {children}
                                </h3>
                              ),
                              h4: ({children}) => (
                                <h4 className="text-base font-semibold text-gray-700 mt-4 mb-2">
                                  {children}
                                </h4>
                              ),
                              p: ({children}) => (
                                <p className="mb-4 text-gray-700 leading-7 text-justify">
                                  {children}
                                </p>
                              ),
                              blockquote: ({children}) => (
                                <blockquote className="border-l-4 border-blue-500 pl-6 py-2 my-6 bg-blue-50 italic text-gray-700 rounded-r-lg">
                                  {children}
                                </blockquote>
                              ),
                              strong: ({children}) => (
                                <strong className="font-semibold text-gray-900">
                                  {children}
                                </strong>
                              ),
                              hr: () => (
                                <hr className="my-8 border-0 border-t border-gray-300" />
                              ),
                              ul: ({children}) => (
                                <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700">
                                  {children}
                                </ul>
                              ),
                              ol: ({children}) => (
                                <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700">
                                  {children}
                                </ol>
                              ),
                            }}
                          >
                            {generateMarkdownPreview()}
                          </ReactMarkdown>
                        </div>
                      </div>
                      
                      {/* Document Footer */}
                      <div className="px-16 py-6 bg-gray-50 border-t border-gray-100 text-center text-sm text-gray-500">
                        Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              <Badge 
                variant="outline" 
                className={`${
                  mandate.priority === 'Urgent' ? 'bg-red-100 text-red-800 border-red-200' :
                  mandate.priority === 'High' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                  mandate.priority === 'Medium' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  'bg-green-100 text-green-800 border-green-200'
                }`}
              >
                {mandate.priority} Priority
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
          
          {/* Left Panel - Add Source Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusIcon className="w-5 h-5" />
                Add Research Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddSource)} className="space-y-4">
                  {questions.length > 0 && (
                    <FormField
                      control={form.control}
                      name="questionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign to Question (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a question or leave unassigned" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="unassigned">General Research</SelectItem>
                              {questions.map((question, index) => (
                                <SelectItem key={question.id} value={question.id}>
                                  {index + 1}. {question.question.substring(0, 50)}
                                  {question.question.length > 50 ? '...' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="quote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quote / Key Text *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter relevant quote or key excerpt..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fullSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Source Citation *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter complete citation information..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add your analysis or context..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Adding...' : 'Add Source'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Right Panel - Sources List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  Research Sources ({sources.length})
                </span>
                <div className="flex items-center gap-2">
                  {questions.length > 0 && (
                    <Select value={selectedQuestionFilter} onValueChange={setSelectedQuestionFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="unassigned">General Research</SelectItem>
                        {questions.map((question, index) => (
                          <SelectItem key={question.id} value={question.id}>
                            Question {index + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {sources.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPreviewOpen(true)}
                      className="flex items-center gap-2 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <DocumentTextIcon className="w-4 h-4" />
                      Preview
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="p-6">
                  {sources.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No research sources added yet.</p>
                      <p className="text-sm">Add your first source using the form on the left.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredSources.map((source, index) => (
                        <div
                          key={source.id}
                          className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              Source {index + 1}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSource(source.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {source.quote && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">Quote:</p>
                              <blockquote className="text-sm text-gray-600 italic pl-3 border-l-2 border-blue-300">
                                "{source.quote}"
                              </blockquote>
                            </div>
                          )}
                          
                          {source.fullSource && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">Citation:</p>
                              <p className="text-sm text-gray-600">{source.fullSource}</p>
                            </div>
                          )}
                          
                          {source.note && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">Analysis:</p>
                              <p className="text-sm text-gray-600">{source.note}</p>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-400 mt-2">
                            Added {formatDate(source.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Generated Document Preview Dialog */}
      <Dialog open={showAIDocumentPreview} onOpenChange={setShowAIDocumentPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-blue-600" />
              AI-Generated Legal Document
            </DialogTitle>
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-amber-800">
                This document was generated using AI. Please review carefully and verify all citations and legal conclusions.
              </p>
            </div>
          </DialogHeader>
          
          {generatedDocument && (
            <div className="space-y-6">
              {/* Document Metadata */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Generation Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Sources Used: {generatedDocument.metadata.sourceCount}</div>
                  <div>Questions Addressed: {generatedDocument.metadata.questionCount}</div>
                  <div>Citation Style: {generatedDocument.metadata.citationStyle}</div>
                  <div>Generated: {new Date(generatedDocument.metadata.generatedAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Document Content */}
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap font-serif text-sm bg-white p-6 border rounded-lg leading-relaxed">
                  {generatedDocument.content}
                </div>
              </div>

              {/* Citations Summary */}
              {generatedDocument.citations.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Citations Included</h3>
                  <ul className="text-sm space-y-1">
                    {generatedDocument.citations.map((citation: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 font-medium">{index + 1}.</span>
                        <span>{citation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedDocument.content);
                    toast({ title: "Copied to clipboard" });
                  }}
                  variant="outline"
                >
                  <ClipboardIcon className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
                
                <Button 
                  onClick={() => {
                    // Create a downloadable PDF of the AI generated content
                    const element = document.createElement('div');
                    element.innerHTML = `
                      <div style="font-family: serif; line-height: 1.6; max-width: 8.5in; margin: 0 auto; padding: 1in;">
                        <div style="text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #333; padding-bottom: 1rem;">
                          <h1 style="font-size: 24px; margin-bottom: 0.5rem;">${mandate.title}</h1>
                          <p style="font-size: 14px; color: #666;">AI-Generated Legal Document</p>
                          <p style="font-size: 12px; color: #666;">Generated on ${new Date().toLocaleDateString()}</p>
                        </div>
                        <pre style="white-space: pre-wrap; font-family: serif; font-size: 12px; line-height: 1.6;">${generatedDocument.content}</pre>
                        <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ccc; font-size: 10px; color: #666;">
                          <p><strong>Disclaimer:</strong> This document was generated using artificial intelligence based on provided research sources. Please review all content, verify citations, and ensure accuracy before use.</p>
                        </div>
                      </div>
                    `;
                    document.body.appendChild(element);
                    
                    const opt = {
                      margin: 0.5,
                      filename: `${mandate.title}_AI_Generated.pdf`,
                      image: { type: 'jpeg', quality: 0.98 },
                      html2canvas: { scale: 2 },
                      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                    };
                    
                    html2pdf().set(opt).from(element).save().then(() => {
                      document.body.removeChild(element);
                    });
                  }}
                  variant="outline"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                
                <Button 
                  onClick={() => setShowAIDocumentPreview(false)}
                  className="ml-auto"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 