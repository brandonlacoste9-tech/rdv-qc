import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data } = await supabase
    .from('availability_overrides')
    .select('*')
    .eq('user_id', user.id)
    .order('date');
  return NextResponse.json({ data: data || [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { date, reason } = await req.json();
  const { data, error } = await supabase
    .from('availability_overrides')
    .upsert({ user_id: user.id, date, reason }, { onConflict: 'user_id,date' })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  await supabase
    .from('availability_overrides')
    .delete()
    .eq('user_id', user.id)
    .eq('date', date);
  return NextResponse.json({ success: true });
}
