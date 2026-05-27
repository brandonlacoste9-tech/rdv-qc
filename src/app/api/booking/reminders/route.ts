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

// Email reminder cron job - runs every hour
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Server misconfigured: missing Supabase environment variables' },
        { status: 500 }
      );
    }

    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      emailsSent: 0,
      errors: 0,
      details: [] as any[]
    };

    const now = new Date();
    
    // Find bookings that need 24h reminder emails
    // Window: 23-25 hours from now (to catch any that might have been missed)
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: bookings, error } = await supabase
      .from('Booking')
      .select('*')
      .gte('startTime', windowStart.toISOString())
      .lte('startTime', windowEnd.toISOString())
      .eq('status', 'accepted')
      .not('responses->>email', 'is', null);

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    for (const booking of bookings || []) {
      try {
        // Check if we already sent a reminder for this booking
        const { data: existingReminder } = await supabase
          .from('email_reminders')
          .select('id')
          .eq('booking_id', String(booking.id))
          .eq('reminder_type', '24h')
          .single();

        if (existingReminder) {
          continue; // Already sent
        }

        // Get event type info
        const { data: eventType } = await supabase
          .from('EventType')
          .select('title, userId')
          .eq('id', booking.eventTypeId)
          .single();

        // Get user info
        const { data: user } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', eventType?.userId)
          .single();

        const attendeeEmail = booking.responses?.email;
        const attendeeName = booking.responses?.name || 'there';

        if (!attendeeEmail) continue;

        // Send reminder email
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
          },
          body: JSON.stringify({
            to: attendeeEmail,
            template: 'booking-reminder',
            data: {
              attendeeName,
              eventTypeName: eventType?.title || 'rendez-vous',
              eventDate: formatDate(booking.startTime),
              eventTime: formatTime(booking.startTime),
              professionalName: user?.name || 'Planxo',
              cancelToken: booking.cancelToken
            }
          })
        });

        if (emailResponse.ok) {
          // Log that we sent the reminder
          await supabase
            .from('email_reminders')
            .insert({
              booking_id: String(booking.id),
              reminder_type: '24h',
              sent_at: new Date().toISOString(),
              recipient_email: attendeeEmail
            });

          results.emailsSent++;
          results.details.push({
            bookingId: booking.id,
            email: attendeeEmail,
            status: 'sent'
          });
        } else {
          throw new Error('Email API failed');
        }

      } catch (err) {
        console.error(`Error sending reminder for booking ${booking.id}:`, err);
        results.errors++;
        results.details.push({
          bookingId: booking.id,
          status: 'error',
          error: String(err)
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    console.error('Reminder cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint for manual triggering
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');
  
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return POST(request);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('fr-CA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}
