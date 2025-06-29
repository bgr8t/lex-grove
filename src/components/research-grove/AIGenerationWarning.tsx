import React from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AIGenerationWarningProps {
  sourceCount: number;
  questionCount: number;
  onOptionsChange?: (options: any) => void;
}

// Separate component for the guidelines popover content
export const AIGenerationGuidelines: React.FC = () => (
  <div className="space-y-3 p-2">
    <div className="font-semibold text-amber-800 flex items-center gap-2">
      <ExclamationTriangleIcon className="h-4 w-4" />
      AI Document Generation Guidelines
    </div>
    <ul className="space-y-2 text-sm text-amber-700">
      <li className="flex items-start gap-2">
        <span className="text-amber-600 mt-0.5">•</span>
        <span>Only information from your provided sources will be used</span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-amber-600 mt-0.5">•</span>
        <span>All statements will be properly cited using [Source X] format</span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-amber-600 mt-0.5">•</span>
        <span>The AI will not fabricate legal precedents or statutes</span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-amber-600 mt-0.5">•</span>
        <span>Review the generated document carefully before use</span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-amber-600 mt-0.5">•</span>
        <span>This is a research synthesis tool, not legal advice</span>
      </li>
    </ul>
  </div>
);

export const AIGenerationWarning: React.FC<AIGenerationWarningProps> = ({
  sourceCount,
  questionCount,
  onOptionsChange
}) => {
  const hasMinimumSources = sourceCount >= 2;
  const hasQuestions = questionCount > 0;
  const isReady = hasMinimumSources;
  
  return (
    <div className="space-y-4">
      
      {/* Readiness Check */}
      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <InformationCircleIcon className="h-4 w-4 text-blue-600" />
          Generation Readiness Check
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className={`h-4 w-4 ${hasMinimumSources ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="text-sm">Research Sources</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={hasMinimumSources ? "default" : "secondary"}>
                {sourceCount} sources
              </Badge>
              {hasMinimumSources ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Ready
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  Need {2 - sourceCount} more
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className={`h-4 w-4 ${hasQuestions ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="text-sm">Legal Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={questionCount > 0 ? "default" : "secondary"}>
                {questionCount} questions
              </Badge>
              {hasQuestions ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Good
                </Badge>
              ) : (
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  Optional
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {!isReady && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Action needed:</strong> Add at least {2 - sourceCount} more research source{2 - sourceCount !== 1 ? 's' : ''} to enable document generation.
            </p>
          </div>
        )}
        
        {isReady && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Ready to generate:</strong> You have sufficient sources for AI document generation.
              {!hasQuestions && ' Consider adding legal questions for better document structure.'}
            </p>
          </div>
        )}
      </div>

      {/* Document Quality Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium mb-2 text-blue-800">Tips for Better Results</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Include diverse sources (cases, statutes, articles)</li>
          <li>• Add specific legal questions to guide the analysis</li>
          <li>• Provide detailed notes in your sources for context</li>
          <li>• Use complete citations for accurate referencing</li>
          <li>• Review and fact-check the generated content</li>
        </ul>
      </div>
    </div>
  );
}; 