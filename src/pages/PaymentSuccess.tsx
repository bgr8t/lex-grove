import React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setUserAsPremium } from '@/lib/services/stripeService';
import { useToast } from '@/components/ui/use-toast';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handlePaymentSuccess = () => {
      try {
        // Get the user ID from localStorage
        const userId = localStorage.getItem('pending_payment_user');
        if (!userId) {
          throw new Error('User ID not found');
        }

        // Update user status
        setUserAsPremium(userId);

        // Show success message
        toast({
          title: 'Payment Successful',
          description: 'Thank you for your subscription! You now have full access.',
          duration: 5000,
        });

        // Redirect to library
        navigate('/library');
      } catch (error) {
        console.error('Error handling payment success:', error);
        toast({
          title: 'Error',
          description: 'There was an error processing your payment success. Please contact support.',
          variant: 'destructive',
        });
        navigate('/contribute');
      }
    };

    handlePaymentSuccess();
  }, [navigate, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Processing Your Payment</h1>
        <p className="text-muted-foreground">Please wait while we update your account...</p>
      </div>
    </div>
  );
} 