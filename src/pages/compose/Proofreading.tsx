import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeftIcon, DocumentCheckIcon, SparklesIcon, ClipboardDocumentIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/contexts/AuthContext';
import { proofreadingService } from '@/lib/services/proofreadingService';
import { ProofreadingDraft, ProofreadingCorrection } from '@/lib/models/proofreadingDraft';
import { cn } from '@/lib/utils';

type DocumentType = 'course-notes' | 'case-brief' | 'legal-memo' | 'statute-analysis' | 'other';

export default function Proofreading() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Form state
  const [originalText, setOriginalText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [corrections, setCorrections] = useState<ProofreadingCorrection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('course-notes');

  // Input validation and sanitization
  const validateAndSanitizeInput = (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    return input.slice(0, 15000); // 15KB limit for legal documents
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = validateAndSanitizeInput(e.target.value);
    setOriginalText(value);
    setError(null);
  };

  const handleProofread = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use the proofreading tool.",
        variant: "destructive"
      });
      return;
    }

    const sanitizedText = originalText.trim();
    
    if (!sanitizedText) {
      setError('Please enter some text to proofread.');
      return;
    }

    if (sanitizedText.length < 20) {
      setError('Please enter at least 20 characters for meaningful proofreading.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await proofreadingService.generateProofreadingCorrections(
        sanitizedText,
        documentType
      );

      setCorrectedText(result.correctedText);
      setCorrections(result.corrections);

      // Save to history
      if (currentUser) {
        await proofreadingService.createDraft({
          userId: currentUser.uid,
          originalText: sanitizedText,
          correctedText: result.correctedText,
          corrections: result.corrections,
          documentType
        });
      }

      const correctionCount = result.corrections.length;
      toast({
        title: "Proofreading Complete!",
        description: correctionCount > 0 
          ? `Found ${correctionCount} conservative correction${correctionCount === 1 ? '' : 's'} that preserve legal meaning.`
          : "No corrections needed - your text is grammatically sound!"
      });

    } catch (error: any) {
      console.error('Error during proofreading:', error);
      setError(error.message || 'Failed to proofread your legal document. Please try again.');
      toast({
        title: "Error",
        description: error.message || "Failed to proofread your legal document.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy text to clipboard.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setOriginalText('');
    setCorrectedText('');
    setCorrections([]);
    setError(null);
  };

  const documentTypeLabels: Record<DocumentType, string> = {
    'course-notes': 'Course Notes',
    'case-brief': 'Case Brief',
    'legal-memo': 'Legal Memo',
    'statute-analysis': 'Statute Analysis',
    'other': 'Other Legal Document'
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 mt-16 md:mt-32">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/compose')}
            className="gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Compose Tools
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <DocumentCheckIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Course Notes Proofreader</h1>
              <p className="text-sm text-muted-foreground">Conservative AI proofreading that preserves legal meaning</p>
            </div>
          </div>
        </div>

        {/* Conservative Warning */}
        <div className="mb-6">
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-amber-800">Hyper-Conservative Legal Proofreading</p>
                  <p className="text-amber-700">
                    This tool prioritizes <strong>100% preservation of legal meaning</strong>. It will only correct 
                    clear grammatical, spelling, and punctuation errors. Legal terms of art, statutory language, 
                    and complex legal phrasing are preserved exactly as written.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Input & Settings */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Your Course Notes</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Paste your course notes below. The AI will conservatively correct only clear errors while 
                    preserving all legal meaning and terminology.
                  </p>
                  
                  <Textarea
                    placeholder="Paste your course notes, case brief, or other legal document here..."
                    className="min-h-[300px] resize-none"
                    value={originalText}
                    onChange={handleTextChange}
                    maxLength={15000}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-muted-foreground">
                      {originalText.length}/15,000 characters
                    </p>
                    {originalText && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetForm}
                        className="text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Document Type Selection */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Document Type</h3>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Document Type</label>
                  <Select 
                    value={documentType}
                    onValueChange={(value: DocumentType) => setDocumentType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(documentTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    This helps the AI understand the context while maintaining conservative corrections.
                  </p>
                </div>

                <Button
                  onClick={handleProofread}
                  disabled={isLoading || !originalText.trim()}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Proofreading...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      Proofread My Notes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Results */}
          <div className="space-y-6">
            <Card className="min-h-[600px]">
              <CardContent className="p-6 h-full">
                {correctedText ? (
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Corrected Text</h3>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircleIcon className="h-3 w-3" />
                            {corrections.length} correction{corrections.length === 1 ? '' : 's'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(correctedText)}
                            className="gap-2"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                            Copy
                          </Button>
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {correctedText}
                        </div>
                      </div>

                      {corrections.length > 0 && (
                        <div>
                          <h4 className="text-md font-medium mb-3">Conservative Corrections Made</h4>
                          <div className="space-y-3">
                            {corrections.map((correction, index) => (
                              <div key={index} className="bg-background border rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs",
                                      correction.type === 'spelling' && "border-red-200 text-red-700",
                                      correction.type === 'grammar' && "border-blue-200 text-blue-700", 
                                      correction.type === 'punctuation' && "border-green-200 text-green-700",
                                      correction.type === 'consistency' && "border-purple-200 text-purple-700"
                                    )}
                                  >
                                    {correction.type}
                                  </Badge>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs",
                                      correction.confidence === 'high' && "border-green-200 text-green-700",
                                      correction.confidence === 'medium' && "border-yellow-200 text-yellow-700",
                                      correction.confidence === 'low' && "border-red-200 text-red-700"
                                    )}
                                  >
                                    {correction.confidence} confidence
                                  </Badge>
                                </div>
                                <div className="text-sm space-y-1">
                                  <div>
                                    <span className="text-muted-foreground">Original: </span>
                                    <span className="line-through text-red-600">{correction.original}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Corrected: </span>
                                    <span className="text-green-600 font-medium">{correction.corrected}</span>
                                  </div>
                                  {correction.explanation && (
                                    <div className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                                      <strong>Conservative Rationale:</strong> {correction.explanation}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {corrections.length === 0 && correctedText && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-800">No Corrections Needed</p>
                              <p className="text-xs text-green-700">Your legal document is grammatically sound and preserves all legal meaning.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <DocumentCheckIcon className="h-16 w-16 mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">Your corrected notes will appear here</h3>
                    <p className="text-sm mb-4 max-w-sm">
                      Paste your course notes in the left panel and click "Proofread My Notes" to get 
                      conservative corrections that preserve legal meaning.
                    </p>
                    <div className="bg-muted/30 p-4 rounded-lg text-xs space-y-2 max-w-sm">
                      <div className="font-medium">Current Settings:</div>
                      <div className="space-y-1">
                        <div>Document: <Badge variant="outline" className="text-xs">{documentTypeLabels[documentType]}</Badge></div>
                        <div className="flex items-center gap-1 text-amber-700">
                          <ShieldCheckIcon className="h-3 w-3" />
                          Conservative Mode Active
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
