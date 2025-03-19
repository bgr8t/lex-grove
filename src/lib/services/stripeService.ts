import { loadStripe, Stripe } from '@stripe/stripe-js';

// Use test mode keys for development
const STRIPE_PUBLISHABLE_KEY = '***REDACTED_STRIPE_TEST_PUB_KEY***';
// Secret key - only used on the server side, never expose in client code
const STRIPE_SECRET_KEY = '***REDACTED_STRIPE_TEST_KEY***';

// Test mode price ID for subscription
const MONTHLY_PRICE_ID = 'price_1R4EAL1J0NBSOemfbq93H9ee';

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
 * Redirect to Stripe checkout page (client-side implementation)
 * This doesn't rely on API routes and directly redirects to Stripe's hosted checkout
 */
export const redirectToCheckout = async (userId: string): Promise<void> => {
  try {
    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe failed to initialize');
    
    // Redirect to the hosted Stripe Checkout page
    const { error } = await stripe.redirectToCheckout({
      lineItems: [{ price: MONTHLY_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      successUrl: window.location.origin + '/payment-success',
      cancelUrl: window.location.origin + '/',
      customerEmail: undefined, // Will use the email entered during checkout
      clientReferenceId: userId, // Pass the user ID as client reference
    });

    if (error) {
      throw new Error(error.message);
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