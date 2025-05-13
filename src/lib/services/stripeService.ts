import { loadStripe, Stripe } from '@stripe/stripe-js';
import { requireEnvVar, secureLog } from '../../utils/security';

// Use environment variables for keys with development defaults
const STRIPE_PUBLISHABLE_KEY = requireEnvVar(
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'pk_test_development_key' // Development default
);

const STRIPE_PAYMENT_LINK = requireEnvVar(
  'VITE_STRIPE_PAYMENT_LINK',
  'https://buy.stripe.com/test_link' // Development default
);

const MONTHLY_PRICE_ID = requireEnvVar(
  'VITE_STRIPE_PRICE_ID',
  'price_test_id' // Development default
);

// Initialize Stripe with publishable key
let stripePromise: Promise<Stripe | null>;

/**
 * Get the Stripe instance
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

/**
 * Redirect to Stripe payment link
 */
export const redirectToPayment = (userId: string): void => {
  try {
    if (!STRIPE_PAYMENT_LINK) {
      throw new Error('Payment link not configured');
    }
    
    // Store the user ID for verification after payment success
    localStorage.setItem('pending_payment_user', userId);
    
    // Redirect to the payment link
    window.location.href = STRIPE_PAYMENT_LINK;
  } catch (error) {
    console.error('Error redirecting to payment:', error);
    throw error;
  }
};

/**
 * Check subscription status
 * This would typically check with your backend, but for now we'll return a simulated result
 */
export const checkSubscriptionStatus = async (userId: string): Promise<boolean> => {
  try {
    // In a production app, you would call your backend here
    // For now, we'll just check localStorage for a simple client-side solution
    const isPremium = localStorage.getItem(`premium_${userId}`);
    return isPremium === 'true';
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};

/**
 * Set user as premium (used after successful payment)
 */
export const setUserAsPremium = (userId: string): void => {
  localStorage.setItem(`premium_${userId}`, 'true');
  // Clear the pending payment user
  localStorage.removeItem('pending_payment_user');
}; 