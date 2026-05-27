import { NextRequest, NextResponse } from 'next/server';
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

// Get user's credit balance
export async function GET(req: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get credit balance
    const { data, error } = await supabase
      .from('voice_credits')
      .select('balance, lifetime_credits')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Return 0 if no record exists
      return NextResponse.json({
        balance: 0,
        lifetimeCredits: 0,
        formatted: '$0.00'
      });
    }

    const balance = data?.balance || 0;
    const dollars = balance / 100;

    return NextResponse.json({
      balance,
      lifetimeCredits: data?.lifetime_credits || 0,
      formatted: `$${dollars.toFixed(2)}`
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
