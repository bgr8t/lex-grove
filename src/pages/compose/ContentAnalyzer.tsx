import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from "@/components/ui/use-toast";
import { 
  ArrowLeftIcon, 
  DocumentMagnifyingGlassIcon, 
  SparklesIcon, 
  ClipboardDocumentIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { contentAnalyzerService } from '@/lib/services/contentAnalyzerService';
import { ContentAnalysisResult } from '@/lib/models/contentAnalysisDraft';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

type DocumentType = 'legal-document' | 'contract' | 'case-brief' | 'statute' | 'academic-paper' | 'other';

export default function ContentAnalyzer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [originalText, setOriginalText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [summary, setSummary] = useState('');
  const [analysis, setAnalysis] = useState<ContentAnalysisResult | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('legal-document');
  const [outputLanguage, setOutputLanguage] = useState<'en' | 'fr'>('en');

  // Input validation and sanitization
  const validateAndSanitizeInput = (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    return input.slice(0, 25000); // 25KB limit for documents
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = validateAndSanitizeInput(e.target.value);
    setOriginalText(value);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - support both text and PDF files
    const isTextFile = file.type === 'text/plain' || file.name.endsWith('.txt');
    const isPdfFile = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    
    if (!isTextFile && !isPdfFile) {
      setError('Please upload a text file (.txt) or PDF file (.pdf).');
      return;
    }

    // Different size limits for different file types
    const maxSize = isPdfFile ? 10 * 1024 * 1024 : 1024 * 1024; // 10MB for PDF, 1MB for text
    if (file.size > maxSize) {
      const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      setError(`File too large. Maximum size is ${sizeMB}MB for ${isPdfFile ? 'PDF' : 'text'} files.`);
      return;
    }

    if (isPdfFile) {
      // Handle PDF files - store for later processing
      setSelectedFile(file);
      setOriginalText(''); // Clear text input when PDF is selected
      setError(null);
    } else {
      // Handle text files as before
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const sanitized = validateAndSanitizeInput(content);
        setOriginalText(sanitized);
        setSelectedFile(null); // Clear PDF when text is uploaded
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read file. Please try again.');
      };
      reader.readAsText(file);
    }
  };

  const handleSummarize = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use the quick summary tool.",
        variant: "destructive"
      });
      return;
    }

    const sanitizedText = originalText.trim();
    
    // Check if we have either text input or a PDF file
    if (!sanitizedText && !selectedFile) {
      setError('Please enter some text or upload a document to summarize.');
      return;
    }

    if (sanitizedText && sanitizedText.length < 50) {
      setError('Please enter at least 50 characters for meaningful summarization.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let result;
      let sourceText = '';

      if (selectedFile) {
        // Process PDF file
        toast({
          title: "Processing PDF...",
          description: "Extracting and summarizing content from your PDF file."
        });
        
        result = await contentAnalyzerService.processPdfFile(selectedFile, documentType);
        sourceText = `[PDF File: ${selectedFile.name}]`;
      } else {
        // Process text input with output language
        result = await contentAnalyzerService.generateContentAnalysis(
          sanitizedText,
          documentType,
          outputLanguage
        );
        sourceText = sanitizedText;
      }

      setSummary(result.summary);
      setAnalysis(result.analysis);
      setDetectedLanguage(result.detectedLanguage);

      // Save to history
      if (currentUser) {
        await contentAnalyzerService.createDraft({
          userId: currentUser.uid,
          originalText: sourceText,
          summary: result.summary,
          analysis: result.analysis,
          documentType,
          language: result.detectedLanguage
        });
      }

      toast({
        title: "Summary Complete!",
        description: `${selectedFile ? 'PDF' : 'Document'} summarized in ${outputLanguage === 'en' ? 'English' : 'French'}. Check the results below.`
      });

    } catch (error: any) {
      console.error('Error during quick summarization:', error);
      setError(`Failed to generate analysis: ${error.message}`);
      toast({
        title: "Error",
        description: "Failed to generate content analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-4 pt-32 pb-8 max-w-6xl">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/compose')}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Compose
          </Button>
          
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quick Summary</h1>
              <p className="text-gray-600">Get key points and actionable insights from legal documents quickly</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DocumentArrowUpIcon className="h-5 w-5" />
                  Document Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Document Type Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Document Type
                  </label>
                  <Select value={documentType} onValueChange={(value: DocumentType) => setDocumentType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="legal-document">Legal Document</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="case-brief">Case Brief</SelectItem>
                      <SelectItem value="statute">Statute</SelectItem>
                      <SelectItem value="academic-paper">Academic Paper</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* File Upload */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Upload Document (Optional)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.pdf"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supports PDF files up to 10MB and text files (.txt) up to 1MB.
                  </p>
                  {selectedFile && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DocumentArrowUpIcon className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-700 font-medium">{selectedFile.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {selectedFile.type === 'application/pdf' ? 'PDF' : 'Text'} • {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
                        </Badge>
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="ml-auto text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Text Input */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Document Content {selectedFile ? '(Optional - PDF selected above)' : ''}
                  </label>
                  <Textarea
                    value={originalText}
                    onChange={handleTextChange}
                    placeholder={selectedFile ? "Text input is optional when a PDF is uploaded..." : "Paste or type your document content here..."}
                    className={cn("min-h-[300px] font-mono text-sm", selectedFile && "opacity-50")}
                    maxLength={25000}
                    disabled={isLoading}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {originalText.length.toLocaleString()} / 25,000 characters
                    </span>
                    {detectedLanguage && (
                      <Badge variant="outline" className="text-xs">
                        Language: {detectedLanguage.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  </div>
                )}

                {/* Summarize Button with Language Toggle */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSummarize}
                    disabled={isLoading || (!originalText.trim() && !selectedFile)}
                    className="flex-1"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2 animate-spin" />
                        {selectedFile ? 'Processing PDF...' : 'Summarizing Document...'}
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        {selectedFile ? 'Summarize PDF' : 'Summarize Content'}
                      </>
                    )}
                  </Button>
                  
                  {/* Language Toggle Button */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setOutputLanguage(outputLanguage === 'en' ? 'fr' : 'en')}
                    disabled={isLoading}
                    className="px-3 flex-shrink-0 min-w-[60px]"
                    title={`Output Language: ${outputLanguage === 'en' ? 'English' : 'Français'}`}
                  >
                    <GlobeAltIcon className="h-4 w-4" />
                    <span className="ml-1 text-xs font-medium">
                      {outputLanguage.toUpperCase()}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {summary && analysis && (
              <>
                {/* Summary Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <SparklesIcon className="h-5 w-5" />
                        Executive Summary
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(summary, 'Summary')}
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-32">
                      <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Analysis Tabs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LightBulbIcon className="h-5 w-5" />
                      Key Insights & Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="readability" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="readability">Key Points</TabsTrigger>
                        <TabsTrigger value="tone">Content</TabsTrigger>
                        <TabsTrigger value="issues">Action Items</TabsTrigger>
                        <TabsTrigger value="insights">Takeaways</TabsTrigger>
                      </TabsList>

                      {/* Key Points Tab */}
                      <TabsContent value="readability" className="space-y-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Document Clarity Score</span>
                            <Badge variant={getScoreBadgeVariant(analysis.readabilityScore.score)}>
                              {analysis.readabilityScore.score}/100
                            </Badge>
                          </div>
                          <Progress value={analysis.readabilityScore.score} className="w-full" />
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Grade Level:</span>
                              <p className="font-medium">{analysis.readabilityScore.grade}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Avg Sentence Length:</span>
                              <p className="font-medium">{analysis.readabilityScore.avgSentenceLength.toFixed(1)} words</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Avg Word Length:</span>
                              <p className="font-medium">{analysis.readabilityScore.avgWordLength.toFixed(1)} chars</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Complex Words:</span>
                              <p className="font-medium">{analysis.readabilityScore.complexWords}</p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Content Tab */}
                      <TabsContent value="tone" className="space-y-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Primary Tone</span>
                            <Badge variant="secondary" className="capitalize">
                              {analysis.toneAnalysis.primary}
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Authority</span>
                              <span className="text-sm font-medium">
                                {(analysis.toneAnalysis.emotions.authority * 100).toFixed(0)}%
                              </span>
                            </div>
                            <Progress value={analysis.toneAnalysis.emotions.authority * 100} />
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Clarity</span>
                              <span className="text-sm font-medium">
                                {(analysis.toneAnalysis.emotions.clarity * 100).toFixed(0)}%
                              </span>
                            </div>
                            <Progress value={analysis.toneAnalysis.emotions.clarity * 100} />
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Objectivity</span>
                              <span className="text-sm font-medium">
                                {(analysis.toneAnalysis.emotions.objectivity * 100).toFixed(0)}%
                              </span>
                            </div>
                            <Progress value={analysis.toneAnalysis.emotions.objectivity * 100} />
                          </div>
                        </div>
                      </TabsContent>

                      {/* Action Items Tab */}
                      <TabsContent value="issues" className="space-y-4">
                        <ScrollArea className="h-64">
                          {analysis.grammarIssues.length > 0 ? (
                            <div className="space-y-3">
                              {analysis.grammarIssues.map((issue, index) => (
                                <div key={index} className="p-3 rounded-lg border border-gray-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge 
                                      variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'secondary' : 'outline'}
                                      className="text-xs"
                                    >
                                      {issue.type}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {issue.severity}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-1">{issue.message}</p>
                                  <p className="text-xs text-green-600">{issue.suggestion}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
                              <p className="text-sm text-gray-600">No issues found!</p>
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>

                      {/* Takeaways Tab */}
                      <TabsContent value="insights" className="space-y-4">
                        <ScrollArea className="h-64">
                          <div className="space-y-3">
                            {analysis.keyInsights.map((insight, index) => (
                              <div key={index} className="p-3 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                  {insight.type === 'strength' && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                                  {insight.type === 'weakness' && <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />}
                                  {insight.type === 'recommendation' && <LightBulbIcon className="h-4 w-4 text-yellow-500" />}
                                  <span className="font-medium text-sm">{insight.title}</span>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {insight.relevance}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700">{insight.description}</p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Document Purpose */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Document Purpose</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">{analysis.documentPurpose}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-gray-500">Confidence Level:</span>
                      <Badge 
                        variant={analysis.confidenceLevel === 'high' ? 'default' : analysis.confidenceLevel === 'medium' ? 'secondary' : 'outline'}
                        className="capitalize"
                      >
                        {analysis.confidenceLevel}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Placeholder when no results */}
            {!analysis && !isLoading && (
              <Card>
                <CardContent className="text-center py-12">
                  <DocumentMagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ready to Summarize
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Upload a PDF/text document or paste your content to get actionable insights quickly.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="h-4 w-4" />
                      <span>Key Points</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>Action Items</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <LightBulbIcon className="h-4 w-4" />
                      <span>Quick Insights</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChartBarIcon className="h-4 w-4" />
                      <span>Content Analysis</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <DocumentArrowUpIcon className="h-3 w-3" />
                      <span>PDF up to 10MB</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DocumentTextIcon className="h-3 w-3" />
                      <span>Text up to 25K chars</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
