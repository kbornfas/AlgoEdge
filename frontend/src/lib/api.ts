/**
 * Centralized API Fetch Utility
 * 
 * Handles subscription-related errors and redirects to pricing page
 */

type FetchOptions = RequestInit & {
  skipSubscriptionCheck?: boolean;
};

/**
 * Check if response has subscription error and redirect to pricing
 */
export async function handleSubscriptionError(response: Response): Promise<boolean> {
  if (response.status === 403) {
    try {
      const data = await response.clone().json();
      if (data.code === 'SUBSCRIPTION_EXPIRED' || data.code === 'SUBSCRIPTION_REQUIRED') {
        // Redirect to pricing page
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/pricing';
        }
        return true;
      }
    } catch {
      // Not JSON response, ignore
    }
  }
  return false;
}

/**
 * Fetch wrapper that automatically handles subscription errors
 * and redirects to pricing page when subscription is expired/required
 */
export async function apiFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipSubscriptionCheck, ...fetchOptions } = options;
  
  const response = await fetch(url, fetchOptions);
  
  // Check for subscription errors unless explicitly skipped
  if (!skipSubscriptionCheck) {
    const isSubscriptionError = await handleSubscriptionError(response);
    if (isSubscriptionError) {
      // Return a mock response to prevent further processing
      throw new SubscriptionRequiredError();
    }
  }
  
  return response;
}

/**
 * Custom error for subscription required scenarios
 */
export class SubscriptionRequiredError extends Error {
  constructor() {
    super('Subscription required');
    this.name = 'SubscriptionRequiredError';
  }
}

/**
 * Check if error is a subscription required error
 */
export function isSubscriptionError(error: unknown): error is SubscriptionRequiredError {
  return error instanceof SubscriptionRequiredError;
}
