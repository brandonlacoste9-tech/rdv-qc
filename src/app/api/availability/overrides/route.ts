import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isIsoDate(value: string | null | undefined) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function listDates(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const out: string[] = [];

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return out;
  }

  const cursor = new Date(start);
  while (cursor <= end) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

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
  const { date, startDate, endDate, reason } = await req.json();

  let dates: string[] = [];
  if (isIsoDate(date)) {
    dates = [date];
  } else if (isIsoDate(startDate) && isIsoDate(endDate)) {
    dates = listDates(startDate, endDate);
  }

  if (!dates.length) {
    return NextResponse.json({ error: 'Provide date or startDate/endDate in YYYY-MM-DD format' }, { status: 400 });
  }

  const payload = dates.map((d) => ({ user_id: user.id, date: d, reason: reason || null }));
  const { data, error } = await supabase
    .from('availability_overrides')
    .upsert(payload, { onConflict: 'user_id,date' })
    .select('*')
    .order('date');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data || [] });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (isIsoDate(date)) {
    await supabase
      .from('availability_overrides')
      .delete()
      .eq('user_id', user.id)
      .eq('date', date);
    return NextResponse.json({ success: true });
  }

  if (isIsoDate(startDate) && isIsoDate(endDate)) {
    await supabase
      .from('availability_overrides')
      .delete()
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Provide date or startDate/endDate in YYYY-MM-DD format' }, { status: 400 });
}
