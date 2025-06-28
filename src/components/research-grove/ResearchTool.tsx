import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { Mandate, Source, SourceFormData, LegalQuestion } from '@/lib/models/mandate';
import { useAsyncResearchGroveStorage } from '@/lib/services/researchGroveStorage';
import { useToast } from '@/hooks/use-toast';

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

  const form = useForm<SourceFormData>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      quote: '',
      fullSource: '',
      note: '',
      questionId: undefined,
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
  }, [mandate.id]);

  const handleAddSource = async (data: SourceFormData) => {
    try {
      setIsLoading(true);
      
      // Convert "unassigned" value to undefined to match existing logic
      const processedData = {
        ...data,
        questionId: data.questionId === 'unassigned' ? undefined : data.questionId,
      };
      
      const sourceData = {
        mandateId: mandate.id,
        ...processedData,
        createdAt: new Date().toISOString(),
      };

      const newSource = await storage.addSource(sourceData);
      setSources(prev => [...prev, newSource]);
      form.reset();

      toast({
        title: "Success",
        description: "Research source added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add research source.",
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Filter sources based on selected question
  const filteredSources = selectedQuestionFilter === 'all' 
    ? sources 
    : selectedQuestionFilter === 'unassigned'
    ? sources.filter(s => !s.questionId)
    : sources.filter(s => s.questionId === selectedQuestionFilter);

  // Group sources by question for display
  const groupedSources = () => {
    const groups: { question: LegalQuestion | null; sources: Source[] }[] = [];
    
    // Add question groups
    questions.forEach(question => {
      const questionSources = sources.filter(s => s.questionId === question.id);
      groups.push({ question, sources: questionSources });
    });
    
    // Add unassigned sources
    const unassignedSources = sources.filter(s => !s.questionId);
    if (unassignedSources.length > 0) {
      groups.push({ question: null, sources: unassignedSources });
    }
    
    return groups;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="hover:bg-primary/10"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-semibold">{mandate.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {mandate.clientName} • {mandate.legalArea}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Generate Document Button */}
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
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5" />
                        Document Preview - {mandate.title}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                        className="flex items-center gap-2"
                      >
                        <ClipboardIcon className="w-4 h-4" />
                        Copy
                      </Button>
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[65vh] mt-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
                        {generateMarkdownPreview()}
                      </pre>
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

          {/* Right Panel - Sources List (grouped by questions) */}
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
                  ) : selectedQuestionFilter !== 'all' ? (
                    // Filtered view
                    <div className="space-y-4">
                      {filteredSources.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No sources found for this filter.</p>
                        </div>
                      ) : (
                        filteredSources.map((source, index) => (
                          <div key={source.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <Badge variant="secondary" className="text-xs">
                                Source {index + 1}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSource(source.id)}
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </div>

                            {source.questionId && (
                              <div className="mb-3">
                                <Badge variant="outline" className="text-xs">
                                  Q: {questions.find(q => q.id === source.questionId)?.question.substring(0, 30)}...
                                </Badge>
                              </div>
                            )}

                            {source.quote && (
                              <div className="mb-3">
                                <div className="flex items-center gap-1 mb-1">
                                  <ChatBubbleLeftRightIcon className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs font-medium text-muted-foreground">Quote</span>
                                </div>
                                <blockquote className="text-sm italic text-foreground border-l-2 border-primary/20 pl-2">
                                  "{source.quote}"
                                </blockquote>
                              </div>
                            )}

                            {source.fullSource && (
                              <div className="mb-3">
                                <span className="text-xs font-medium text-muted-foreground">Source</span>
                                <p className="text-sm text-foreground">{source.fullSource}</p>
                              </div>
                            )}

                            {source.note && (
                              <div className="mb-3">
                                <span className="text-xs font-medium text-muted-foreground">Analysis</span>
                                <p className="text-sm text-foreground">{source.note}</p>
                              </div>
                            )}

                            <div className="text-xs text-muted-foreground">
                              Added {formatDate(source.createdAt)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    // Grouped view (default)
                    <div className="space-y-6">
                      {groupedSources().map((group, groupIndex) => (
                        <div key={group.question?.id || 'unassigned'}>
                          {/* Group Header */}
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                            {group.question ? (
                              <>
                                <QuestionMarkCircleIcon className="w-4 h-4 text-primary" />
                                <h3 className="font-medium text-sm">
                                  Question {questions.findIndex(q => q.id === group.question?.id) + 1}: {group.question.question}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {group.sources.length} sources
                                </Badge>
                              </>
                            ) : (
                              <>
                                <DocumentTextIcon className="w-4 h-4 text-muted-foreground" />
                                <h3 className="font-medium text-sm text-muted-foreground">
                                  General Research
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {group.sources.length} sources
                                </Badge>
                              </>
                            )}
                          </div>

                          {/* Sources in this group */}
                          <div className="space-y-3 ml-6">
                            {group.sources.length === 0 && group.question ? (
                              <p className="text-sm text-muted-foreground italic">
                                No sources assigned to this question yet.
                              </p>
                            ) : (
                              group.sources.map((source, index) => (
                                <div key={source.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow bg-muted/30">
                                  <div className="flex items-start justify-between mb-3">
                                    <Badge variant="secondary" className="text-xs">
                                      Source {index + 1}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteSource(source.id)}
                                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </Button>
                                  </div>

                                  {source.quote && (
                                    <div className="mb-3">
                                      <div className="flex items-center gap-1 mb-1">
                                        <ChatBubbleLeftRightIcon className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-xs font-medium text-muted-foreground">Quote</span>
                                      </div>
                                      <blockquote className="text-sm italic text-foreground border-l-2 border-primary/20 pl-2">
                                        "{source.quote}"
                                      </blockquote>
                                    </div>
                                  )}

                                  {source.fullSource && (
                                    <div className="mb-3">
                                      <span className="text-xs font-medium text-muted-foreground">Source</span>
                                      <p className="text-sm text-foreground">{source.fullSource}</p>
                                    </div>
                                  )}

                                  {source.note && (
                                    <div className="mb-3">
                                      <span className="text-xs font-medium text-muted-foreground">Analysis</span>
                                      <p className="text-sm text-foreground">{source.note}</p>
                                    </div>
                                  )}

                                  <div className="text-xs text-muted-foreground">
                                    Added {formatDate(source.createdAt)}
                                  </div>
                                </div>
                              ))
                            )}
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
    </div>
  );
}; 