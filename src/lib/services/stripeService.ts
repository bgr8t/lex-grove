import { loadStripe, Stripe } from '@stripe/stripe-js';

// Use environment variables for keys
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51R4EaX09YXo38jybTrN4BFhE6ZwyO8lBftNGZnfM5zf3dkDmQFJbFyzEKpzrsmU6w4rFnP0DJ3U71jQGGEJn7z9M00bvWqF9h4';
// Secret key should only be used on the server side

// TODO: Replace with your actual Price ID from your Stripe Dashboard
// Go to https://dashboard.stripe.com/products to find your product price ID
const MONTHLY_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID || 'price_placeholder';

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
 * Redirect to Stripe checkout page using client-only implementation
 * This is compatible with Firebase hosting
 */
export const redirectToCheckout = async (userId: string): Promise<void> => {
  try {
    console.log('Starting checkout process with price ID:', MONTHLY_PRICE_ID);
    
    try {
      // First try client-only checkout
      const stripe = await getStripe();
      if (!stripe) throw new Error('Stripe failed to initialize');
      
      // Use client-only checkout - this requires enabling client-only in Stripe dashboard
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: MONTHLY_PRICE_ID, quantity: 1 }],
        mode: 'subscription',
        successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/`,
        clientReferenceId: userId,
      });
      
      if (error) {
        throw error;
      }
    } catch (stripeError) {
      console.error('Stripe redirect error, trying payment link fallback:', stripeError);
      
      // Fallback to direct payment link
      // Create checkout URL using Stripe's hosted checkout
      const productId = MONTHLY_PRICE_ID; // Your price ID
      const successUrl = encodeURIComponent(`${window.location.origin}/payment-success`);
      const cancelUrl = encodeURIComponent(`${window.location.origin}/`);
      
      // Redirect to Stripe's hosted checkout page
      window.location.href = `https://buy.stripe.com/test_8wM3e0aE3c4mbE4bII`;
    }
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
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
}; 