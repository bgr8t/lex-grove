import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface UseEmailVerificationReturn {
  isResending: boolean;
  canResend: boolean;
  timeUntilCanResend: number;
  resendVerificationEmail: () => Promise<void>;
  checkVerificationStatus: () => Promise<void>;
  isCheckingVerification: boolean;
}

const RESEND_COOLDOWN = 60000; // 1 minute
const MAX_RESEND_ATTEMPTS = 3; // Max attempts per session

export function useEmailVerification(): UseEmailVerificationReturn {
  const { sendVerificationEmail, reloadUser } = useAuth();
  const { toast } = useToast();
  
  const [isResending, setIsResending] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [lastResendTime, setLastResendTime] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [timeUntilCanResend, setTimeUntilCanResend] = useState(0);

  // Update countdown timer
  const updateCountdown = useCallback(() => {
    const now = Date.now();
    const timePassed = now - lastResendTime;
    const remaining = Math.max(0, RESEND_COOLDOWN - timePassed);
    setTimeUntilCanResend(remaining);
    
    if (remaining > 0) {
      setTimeout(updateCountdown, 1000);
    }
  }, [lastResendTime]);

  const canResend = timeUntilCanResend === 0 && resendAttempts < MAX_RESEND_ATTEMPTS;

  const resendVerificationEmail = useCallback(async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    try {
      await sendVerificationEmail();
      
      const now = Date.now();
      setLastResendTime(now);
      setResendAttempts(prev => prev + 1);
      setTimeUntilCanResend(RESEND_COOLDOWN);
      
      toast({
        title: 'Verification Email Sent',
        description: `A new verification link has been sent to your email address. You can request another in ${RESEND_COOLDOWN / 1000} seconds.`,
      });
      
      // Start countdown
      setTimeout(updateCountdown, 1000);
      
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      
      let errorMessage = 'Failed to resend verification email. Please try again later.';
      
      // Handle specific Firebase errors
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait before trying again.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found. Please try logging in again.';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  }, [canResend, isResending, sendVerificationEmail, toast, updateCountdown]);

  const checkVerificationStatus = useCallback(async () => {
    setIsCheckingVerification(true);
    try {
      await reloadUser();
      toast({
        title: 'Status Updated',
        description: 'Your verification status has been refreshed.',
      });
    } catch (error) {
      console.error('Error checking verification status:', error);
      toast({
        title: 'Error',
        description: 'Failed to check verification status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingVerification(false);
    }
  }, [reloadUser, toast]);

  return {
    isResending,
    canResend,
    timeUntilCanResend,
    resendVerificationEmail,
    checkVerificationStatus,
    isCheckingVerification,
  };
} 