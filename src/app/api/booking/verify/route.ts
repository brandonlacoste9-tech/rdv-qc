import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

let supabaseClient: any = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  supabaseClient = createClient<any>(supabaseUrl, supabaseServiceRoleKey);
  return supabaseClient;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Server misconfigured: missing Supabase environment variables' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token requis' },
        { status: 400 }
      );
    }

    // Find booking by cancel token
    const { data: booking, error } = await supabase
      .from('Booking')
      .select('*')
      .eq('cancelToken', token)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Rendez-vous introuvable ou lien expiré' },
        { status: 404 }
      );
    }

    // Check if booking is in the past
    const bookingEnd = new Date(booking.endTime);
    if (bookingEnd < new Date() && booking.status !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Ce rendez-vous est déjà passé' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        title: booking.title,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        responses: booking.responses,
        cancelToken: booking.cancelToken
      }
    });

  } catch (error) {
    console.error('Verify booking error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
