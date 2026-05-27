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

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Server misconfigured: missing Supabase environment variables' },
        { status: 500 }
      );
    }

    const { token, reason, actor = 'ATTENDEE' } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token requis' },
        { status: 400 }
      );
    }

    // 1. Find and verify the booking via secure token
    const { data: booking, error: bookingError } = await supabase
      .from('Booking')
      .select('*')
      .eq('cancelToken', token)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Rendez-vous introuvable' },
        { status: 404 }
      );
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Rendez-vous déjà annulé' },
        { status: 400 }
      );
    }

    // 2. Update booking status
    const { error: updateError } = await supabase
      .from('Booking')
      .update({
        status: 'CANCELLED',
        updatedAt: new Date().toISOString()
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'annulation' },
        { status: 500 }
      );
    }

    // 3. Create audit log for Law 25 compliance
    const { error: auditError } = await supabase
      .from('AuditLog')
      .insert({
        bookingId: booking.id,
        action: 'BOOKING_CANCELLED',
        actor: actor,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        metadata: { reason: reason || null }
      });

    if (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the request, just log the error
    }

    // 4. Cancel any pending voice workflow executions
    const { error: workflowError } = await supabase
      .from('voice_workflow_executions')
      .update({
        status: 'cancelled',
        error_message: 'Booking cancelled by attendee'
      })
      .eq('booking_id', String(booking.id))
      .eq('status', 'pending');

    if (workflowError) {
      console.error('Error cancelling workflow executions:', workflowError);
    }

    // 5. Send cancellation confirmation email
    await sendCancellationEmail(supabase, booking);

    // Determine locale for response message
    const locale = booking.responses?.language || 'fr';
    const message = locale === 'fr'
      ? 'Rendez-vous annulé avec succès'
      : 'Appointment cancelled successfully';

    return NextResponse.json({
      success: true,
      message,
      bookingId: booking.id
    });

  } catch (error) {
    console.error('Cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function sendCancellationEmail(supabase: any, booking: any) {
  try {
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
    if (!attendeeEmail) return;

    // Send email via your email service (Resend, SendGrid, etc.)
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
      },
      body: JSON.stringify({
        to: attendeeEmail,
        template: 'booking-cancelled',
        data: {
          attendeeName: booking.responses?.name || 'there',
          eventTypeName: eventType?.title || 'appointment',
          eventDate: formatDate(booking.startTime),
          eventTime: formatTime(booking.startTime),
          professionalName: user?.name || 'Planxo',
          professionalEmail: user?.email
        }
      })
    });
  } catch (err) {
    console.error('Error sending cancellation email:', err);
  }
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
