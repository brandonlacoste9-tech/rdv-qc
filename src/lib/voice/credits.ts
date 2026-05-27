import { createClient } from '@supabase/supabase-js';

let supabaseClient: any = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  supabaseClient = createClient<any>(supabaseUrl, supabaseServiceRoleKey);
  return supabaseClient;
}

const supabase: any = new Proxy({}, {
  get(_target, prop) {
    return getSupabaseClient()[prop as string];
  },
});

export interface CreditBalance {
  balance: number;
  lifetimeCredits: number;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'adjustment';
  description?: string;
  callSid?: string;
  stripePaymentIntentId?: string;
  createdAt: string;
}

// Get user's current credit balance
export async function getCreditBalance(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('voice_credits')
    .select('balance')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) return 0;
  return data.balance;
}

// Get full credit info including lifetime
export async function getCreditInfo(userId: string): Promise<CreditBalance | null> {
  const { data, error } = await supabase
    .from('voice_credits')
    .select('balance, lifetime_credits')
    .eq('user_id', userId)
    .single();
  
  if (error) return null;
  return {
    balance: data.balance || 0,
    lifetimeCredits: data.lifetime_credits || 0
  };
}

// Add credits (used after Stripe payment)
export async function addCredits(
  userId: string,
  amount: number,
  type: 'purchase' | 'refund' | 'bonus',
  description?: string,
  stripePaymentIntentId?: string,
  stripeCheckoutSessionId?: string
): Promise<boolean> {
  try {
    // Use RPC function for atomic operation
    const { error } = await supabase.rpc('add_voice_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_type: type,
      p_description: description,
      p_stripe_payment_intent_id: stripePaymentIntentId,
      p_stripe_checkout_session_id: stripeCheckoutSessionId
    });
    
    if (error) {
      console.error('Error adding credits:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error in addCredits:', err);
    return false;
  }
}

// Deduct credits for call usage
export async function deductCredits(
  userId: string,
  amount: number,
  callSid: string,
  description?: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('deduct_voice_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description || 'Voice call usage',
      p_call_sid: callSid
    });
    
    if (error) {
      console.error('Error deducting credits:', error);
      return false;
    }
    
    return data === true;
  } catch (err) {
    console.error('Error in deductCredits:', err);
    return false;
  }
}

// Calculate cost for a call
export function calculateCallCost(durationSeconds: number, costPerMinute: number = 0.15): number {
  // Round up to nearest minute
  const minutes = Math.ceil(durationSeconds / 60);
  // Convert to cents
  return Math.ceil(minutes * costPerMinute * 100);
}

// Format credits for display ($1.00 = 100 credits)
export function formatCredits(credits: number): string {
  const dollars = credits / 100;
  return `$${dollars.toFixed(2)}`;
}

// Check if user has enough credits for a call
export async function hasEnoughCredits(
  userId: string,
  estimatedMinutes: number = 5,
  costPerMinute: number = 0.15
): Promise<boolean> {
  const balance = await getCreditBalance(userId);
  const estimatedCost = Math.ceil(estimatedMinutes * costPerMinute * 100);
  return balance >= estimatedCost;
}

// Get credit transaction history
export async function getTransactionHistory(
  userId: string,
  limit: number = 50
): Promise<CreditTransaction[]> {
  const { data, error } = await supabase
    .from('voice_credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error || !data) return [];
  
  return data.map((t: any) => ({
    id: t.id,
    userId: t.user_id,
    amount: t.amount,
    type: t.type,
    description: t.description,
    callSid: t.call_sid,
    stripePaymentIntentId: t.stripe_payment_intent_id,
    createdAt: t.created_at
  }));
}

// Initialize free credits for new users
export async function initializeFreeCredits(userId: string): Promise<boolean> {
  try {
    const existingBalance = await getCreditBalance(userId);
    if (existingBalance > 0) return true; // Already has credits
    
    // Give $5 free (500 credits)
    return await addCredits(
      userId,
      500,
      'bonus',
      'Welcome bonus - $5 free credits'
    );
  } catch (err) {
    console.error('Error initializing free credits:', err);
    return false;
  }
}

// Credit packages for purchase
export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 1000, // $10
    price: 1000, // $10.00 in cents
    description: '~66 minutes of calls',
    popular: false
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 2750, // $25 + 10% bonus
    price: 2500,
    description: '~183 minutes of calls',
    popular: true
  },
  {
    id: 'business',
    name: 'Business',
    credits: 6000, // $50 + 20% bonus
    price: 5000,
    description: '~400 minutes of calls',
    popular: false
  }
];
