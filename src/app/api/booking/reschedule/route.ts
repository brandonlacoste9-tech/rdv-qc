import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { token, newStartTime, newEndTime, reason } = await request.json();

    if (!token || !newStartTime || !newEndTime) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
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
        { error: 'Ce rendez-vous a été annulé' },
        { status: 400 }
      );
    }

    // ENHANCEMENT: Availability validation per calcom-booking-engine skill
    // Fetch user's Schedule and check dayOfWeek + time overlap before allowing reschedule
    const { data: schedule } = await supabase
      .from('Schedule')
      .select('*, availability:Availability(*)')
      .eq('userId', booking.userId)
      .eq('isDefault', true)
      .single();

    if (schedule && schedule.availability) {
      const newStart = new Date(newStartTime);
      const dayOfWeek = newStart.getDay();
      const matchingAvailability = schedule.availability.find((a: any) => a.dayOfWeek === dayOfWeek);
      if (!matchingAvailability) {
        return NextResponse.json({ error: 'Ce créneau n\'est pas disponible' }, { status: 400 });
      }
      // Basic time overlap check (start/end within availability window)
      const availStart = new Date(`1970-01-01T${matchingAvailability.startTime}`);
      const availEnd = new Date(`1970-01-01T${matchingAvailability.endTime}`);
      const slotStart = new Date(`1970-01-01T${newStart.toTimeString().slice(0,5)}`);
      if (slotStart < availStart || slotStart >= availEnd) {
        return NextResponse.json({ error: 'Créneau hors disponibilité' }, { status: 400 });
      }
    }

    const oldStartTime = booking.startTime;
    const oldEndTime = booking.endTime;

    // 2. Update booking with new times
    const { error: updateError } = await supabase
      .from('Booking')
      .update({
        startTime: new Date(newStartTime).toISOString(),
        endTime: new Date(newEndTime).toISOString(),
        status: 'RESCHEDULED',
        updatedAt: new Date().toISOString()
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la reprogrammation' },
        { status: 500 }
      );
    }

    // 3. Create audit log for Law 25 compliance
    const { error: auditError } = await supabase
      .from('AuditLog')
      .insert({
        bookingId: booking.id,
        action: 'BOOKING_RESCHEDULED',
        actor: 'ATTENDEE',
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        metadata: {
          oldStartTime,
          oldEndTime,
          newStartTime,
          newEndTime,
          reason: reason || null
        }
      });

    if (auditError) {
      console.error('Error creating audit log:', auditError);
    }

    // 4. Update any pending voice workflow executions with new timing
    await updateWorkflowExecutions(booking.id, newStartTime);

    // 5. Send reschedule confirmation email
    await sendRescheduleEmail(booking, oldStartTime, newStartTime);

    // Determine locale for response message
    const locale = booking.responses?.language || 'fr';
    const message = locale === 'fr'
      ? 'Rendez-vous reprogrammé avec succès'
      : 'Appointment rescheduled successfully';

    return NextResponse.json({
      success: true,
      message,
      bookingId: booking.id,
      newStartTime,
      newEndTime
    });

  } catch (error) {
    console.error('Reschedule error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function updateWorkflowExecutions(bookingId: number, newStartTime: string) {
  try {
    // Get the workflow execution for this booking
    const { data: executions } = await supabase
      .from('voice_workflow_executions')
      .select('*, workflow:workflow_id(*)')
      .eq('booking_id', String(bookingId))
      .eq('status', 'pending');

    if (!executions || executions.length === 0) return;

    for (const execution of executions) {
      const workflow = execution.workflow;
      if (!workflow) continue;

      // Calculate new scheduled time based on workflow trigger timing
      const triggerMinutes = workflow.trigger_timing;
      const newScheduledFor = new Date(newStartTime);
      newScheduledFor.setMinutes(newScheduledFor.getMinutes() - triggerMinutes);

      // Update the execution
      await supabase
        .from('voice_workflow_executions')
        .update({
          scheduled_for: newScheduledFor.toISOString()
        })
        .eq('id', execution.id);
    }
  } catch (err) {
    console.error('Error updating workflow executions:', err);
  }
}

async function sendRescheduleEmail(booking: any, oldStartTime: string, newStartTime: string) {
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

    // Send email via your email service
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
      },
      body: JSON.stringify({
        to: attendeeEmail,
        template: 'booking-rescheduled',
        data: {
          attendeeName: booking.responses?.name || 'there',
          eventTypeName: eventType?.title || 'appointment',
          oldDate: formatDate(oldStartTime),
          oldTime: formatTime(oldStartTime),
          newDate: formatDate(newStartTime),
          newTime: formatTime(newStartTime),
          professionalName: user?.name || 'Planxo',
          professionalEmail: user?.email
        }
      })
    });
  } catch (err) {
    console.error('Error sending reschedule email:', err);
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
