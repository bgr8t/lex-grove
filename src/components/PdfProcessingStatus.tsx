import React from 'react';
import { AlertTriangle, CheckCircle, Loader2, Clock, FileText, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PdfProcessingStatusProps {
  isProcessing?: boolean;
  error?: string | null;
  success?: boolean;
  fileName?: string;
  processingStage?: 'uploading' | 'validating' | 'processing' | 'extracting' | 'completed';
  className?: string;
}

/**
 * PDF Processing Status Component
 * Provides comprehensive feedback during PDF processing
 * Follows Cursor design rules: neumorphic, clean, mobile-first
 */
export function PdfProcessingStatus({ 
  isProcessing = false, 
  error, 
  success = false, 
  fileName,
  processingStage = 'processing',
  className 
}: PdfProcessingStatusProps) {
  
  // Don't render if no status to show
  if (!isProcessing && !error && !success) {
    return null;
  }

  // Processing stage information for better UX
  const stageInfo = {
    uploading: { text: 'Uploading file...', progress: 20 },
    validating: { text: 'Validating PDF...', progress: 40 },
    processing: { text: 'Analyzing with AI...', progress: 60 },
    extracting: { text: 'Extracting case information...', progress: 80 },
    completed: { text: 'Processing complete!', progress: 100 }
  };

  const currentStage = stageInfo[processingStage] || stageInfo.processing;

  // Processing state
  if (isProcessing) {
    return (
      <div className={cn(
        "space-y-4 p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white shadow-sm",
        "dark:from-gray-900 dark:to-gray-800 dark:border-gray-700",
        className
      )}>
        {/* Header with file info */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="absolute -top-1 -right-1">
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Processing PDF
            </p>
            {fileName && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {fileName}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              {currentStage.text}
            </span>
            <span className="text-gray-500 dark:text-gray-500">
              {currentStage.progress}%
            </span>
          </div>
          <Progress 
            value={currentStage.progress} 
            className="h-2 bg-gray-200 dark:bg-gray-700"
          />
        </div>

        {/* Time estimate */}
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="h-3 w-3" />
          <span>This may take up to 90 seconds for complex documents</span>
        </div>

        {/* Processing tips */}
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Tip:</strong> Review and edit the extracted information to ensure accuracy before saving.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Error state
  if (error) {
    const isRateLimit = error.includes('rate limit') || error.includes('Try again in');
    const isFileError = error.includes('file') || error.includes('PDF');
    const isAuthError = error.includes('Authentication') || error.includes('sign in');

    return (
      <Alert 
        variant="destructive" 
        className={cn(
          "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
          className
        )}
      >
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <div className="font-medium">Processing Failed</div>
          <div className="text-sm">{error}</div>
          
          {/* Helpful suggestions based on error type */}
          <div className="text-xs space-y-1 mt-2 pt-2 border-t border-red-200 dark:border-red-800">
            {isRateLimit && (
              <p>• Wait a moment before trying again</p>
            )}
            {isFileError && (
              <>
                <p>• Ensure the file is a valid PDF under 10MB</p>
                <p>• Try a different PDF or reduce file size</p>
              </>
            )}
            {isAuthError && (
              <p>• Sign in to your account and try again</p>
            )}
            {!isRateLimit && !isFileError && !isAuthError && (
              <>
                <p>• Check your internet connection</p>
                <p>• Try again in a few moments</p>
                <p>• Contact support if the issue persists</p>
              </>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Success state
  if (success) {
    return (
      <Alert 
        className={cn(
          "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
          className
        )}
      >
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="space-y-2">
          <div className="font-medium text-green-800 dark:text-green-200">
            PDF Processed Successfully!
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">
            Case brief fields have been populated with extracted information.
          </div>
          
          {/* Success tips */}
          <div className="text-xs text-green-600 dark:text-green-400 space-y-1 mt-2 pt-2 border-t border-green-200 dark:border-green-800">
            <p>• Review all sections for accuracy</p>
            <p>• Edit any information as needed</p>
            <p>• Add additional tags if relevant</p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

/**
 * Compact version for mobile or space-constrained layouts
 */
export function PdfProcessingStatusCompact({ 
  isProcessing, 
  error, 
  success, 
  className 
}: Omit<PdfProcessingStatusProps, 'fileName' | 'processingStage'>) {
  
  if (!isProcessing && !error && !success) {
    return null;
  }

  return (
    <div className={cn("flex items-center space-x-2 text-sm", className)}>
      {isProcessing && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Processing...</span>
        </>
      )}
      
      {error && (
        <>
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-red-600 dark:text-red-400 truncate">
            {error.length > 50 ? `${error.substring(0, 50)}...` : error}
          </span>
        </>
      )}
      
      {success && (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-green-600 dark:text-green-400">Success!</span>
        </>
      )}
    </div>
  );
}

/**
 * Hook for managing processing status state
 * Provides convenient state management for PDF processing workflows
 */
export function usePdfProcessingStatus() {
  const [status, setStatus] = React.useState<{
    isProcessing: boolean;
    error: string | null;
    success: boolean;
    stage: PdfProcessingStatusProps['processingStage'];
    fileName?: string;
  }>({
    isProcessing: false,
    error: null,
    success: false,
    stage: 'processing'
  });

  const startProcessing = (fileName?: string) => {
    setStatus({
      isProcessing: true,
      error: null,
      success: false,
      stage: 'uploading',
      fileName
    });
  };

  const updateStage = (stage: PdfProcessingStatusProps['processingStage']) => {
    setStatus(prev => ({ ...prev, stage }));
  };

  const setError = (error: string) => {
    setStatus(prev => ({
      ...prev,
      isProcessing: false,
      error,
      success: false
    }));
  };

  const setSuccess = () => {
    setStatus(prev => ({
      ...prev,
      isProcessing: false,
      error: null,
      success: true,
      stage: 'completed'
    }));
  };

  const reset = () => {
    setStatus({
      isProcessing: false,
      error: null,
      success: false,
      stage: 'processing'
    });
  };

  return {
    status,
    startProcessing,
    updateStage,
    setError,
    setSuccess,
    reset
  };
}


