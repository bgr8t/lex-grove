import React, { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { AlertCircle, Mail, Clock, CheckCircle } from 'lucide-react';

interface EmailVerificationGuardProps {
  children: ReactNode;
  allowLimitedAccess?: boolean;
}

export function EmailVerificationGuard({ 
  children, 
  allowLimitedAccess = false 
}: EmailVerificationGuardProps) {
  const { currentUser } = useAuth();
  const {
    isResending,
    canResend,
    timeUntilCanResend,
    resendVerificationEmail,
    checkVerificationStatus,
    isCheckingVerification,
  } = useEmailVerification();

  // Auto-check verification status when component mounts
  useEffect(() => {
    if (currentUser && !currentUser.emailVerified) {
      // Auto-check after a short delay to give time for verification
      const timer = setTimeout(() => {
        checkVerificationStatus();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [currentUser, checkVerificationStatus]);

  const formatTimeRemaining = (milliseconds: number): string => {
    const seconds = Math.ceil(milliseconds / 1000);
    return `${seconds}s`;
  };

  if (currentUser && !currentUser.emailVerified) {
    // For limited access mode, show a banner instead of blocking
    if (allowLimitedAccess) {
      return (
        <>
          <div 
            className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-4"
            role="banner"
            aria-live="polite"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Please verify your email address
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Some features are limited until you verify your email: {currentUser.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resendVerificationEmail}
                  disabled={!canResend || isResending}
                  className="border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-200 dark:hover:bg-yellow-900/40"
                >
                  {isResending ? (
                    <>
                      <Clock className="h-4 w-4 mr-1 animate-spin" />
                      Sending...
                    </>
                  ) : !canResend && timeUntilCanResend > 0 ? (
                    `Resend in ${formatTimeRemaining(timeUntilCanResend)}`
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-1" />
                      Resend Email
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkVerificationStatus}
                  disabled={isCheckingVerification}
                  className="border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-200 dark:hover:bg-yellow-900/40"
                >
                  {isCheckingVerification ? (
                    <>
                      <Clock className="h-4 w-4 mr-1 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      I've Verified
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          {children}
        </>
      );
    }

    // Full blocking mode
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4"
        role="main"
        aria-labelledby="verification-title"
      >
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 
              id="verification-title"
              className="text-3xl font-bold text-gray-900 dark:text-white"
            >
              Verify Your Email
            </h1>
            <p className="mt-3 text-gray-600 dark:text-gray-300 leading-relaxed">
              We've sent a verification link to{' '}
              <strong className="text-gray-900 dark:text-white break-all">
                {currentUser.email}
              </strong>
              . Please check your inbox and click the link to activate your account.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Didn't receive the email?</strong>
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Make sure {currentUser.email} is correct</li>
                <li>• Wait a few minutes for delivery</li>
              </ul>
            </div>

            <Button
              onClick={resendVerificationEmail}
              disabled={!canResend || isResending}
              className="w-full"
              aria-describedby={!canResend ? "resend-cooldown" : undefined}
            >
              {isResending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Sending Email...
                </>
              ) : !canResend && timeUntilCanResend > 0 ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Resend in {formatTimeRemaining(timeUntilCanResend)}
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>

            {!canResend && timeUntilCanResend > 0 && (
              <p 
                id="resend-cooldown"
                className="text-xs text-gray-500 dark:text-gray-400 text-center"
              >
                You can request another email in {formatTimeRemaining(timeUntilCanResend)}
              </p>
            )}

            <Button
              variant="outline"
              onClick={checkVerificationStatus}
              disabled={isCheckingVerification}
              className="w-full"
            >
              {isCheckingVerification ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Checking Status...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  I've Verified My Email
                </>
              )}
            </Button>
          </div>

          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Having trouble? Contact support for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 