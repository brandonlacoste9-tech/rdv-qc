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

    const { token, newStartTime, newEndTime, reason } = await request.json();

    if (!token || !newStartTime || !newEndTime) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    const nextStart = new Date(newStartTime);
    const nextEnd = new Date(newEndTime);
    if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime()) || nextEnd <= nextStart) {
      return NextResponse.json({ error: 'Plage horaire invalide' }, { status: 400 });
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

    if (nextStart.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Impossible de reprogrammer dans le passé' }, { status: 400 });
    }

    const { data: eventType } = await supabase
      .from('EventType')
      .select('id,minNotice,beforeEventBuffer,afterEventBuffer,bufferBefore,bufferAfter')
      .eq('id', booking.eventTypeId)
      .single();

    const minNoticeMinutes = Number(eventType?.minNotice || 0);
    if (nextStart.getTime() < Date.now() + minNoticeMinutes * 60000) {
      return NextResponse.json({ error: 'Ce créneau est trop proche selon le délai minimum' }, { status: 409 });
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
      const dayOfWeek = nextStart.getDay();
      const matchingAvailability = schedule.availability.find((a: any) => {
        if (Array.isArray(a.days)) return a.days.includes(dayOfWeek);
        return a.dayOfWeek === dayOfWeek;
      });
      if (!matchingAvailability) {
        return NextResponse.json({ error: 'Ce créneau n\'est pas disponible' }, { status: 400 });
      }
      // Basic time overlap check (start/end within availability window)
      const availStart = new Date(`1970-01-01T${matchingAvailability.startTime}`);
      const availEnd = new Date(`1970-01-01T${matchingAvailability.endTime}`);
      const slotStart = new Date(`1970-01-01T${nextStart.toTimeString().slice(0,5)}`);
      const slotEnd = new Date(`1970-01-01T${nextEnd.toTimeString().slice(0,5)}`);
      if (slotStart < availStart || slotEnd > availEnd) {
        return NextResponse.json({ error: 'Créneau hors disponibilité' }, { status: 400 });
      }
    }

    const bufferBeforeMinutes = Number(eventType?.bufferBefore ?? eventType?.beforeEventBuffer ?? 0);
    const bufferAfterMinutes = Number(eventType?.bufferAfter ?? eventType?.afterEventBuffer ?? 0);
    const checkStart = new Date(nextStart.getTime() - bufferBeforeMinutes * 60000);
    const checkEnd = new Date(nextEnd.getTime() + bufferAfterMinutes * 60000);

    const { data: conflicts } = await supabase
      .from('Booking')
      .select('id')
      .eq('userId', booking.userId)
      .neq('id', booking.id)
      .neq('status', 'cancelled')
      .neq('status', 'CANCELLED')
      .lt('startTime', checkEnd.toISOString())
      .gt('endTime', checkStart.toISOString())
      .limit(1);

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ error: 'Ce créneau n\'est plus disponible (conflit)' }, { status: 409 });
    }

    const oldStartTime = booking.startTime;
    const oldEndTime = booking.endTime;

    // 2. Update booking with new times
    const { error: updateError } = await supabase
      .from('Booking')
      .update({
        startTime: nextStart.toISOString(),
        endTime: nextEnd.toISOString(),
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
    await updateWorkflowExecutions(supabase, booking.id, newStartTime);

    // 5. Send reschedule confirmation email
    await sendRescheduleEmail(supabase, booking, oldStartTime, newStartTime);

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

async function updateWorkflowExecutions(supabase: any, bookingId: number, newStartTime: string) {
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

async function sendRescheduleEmail(supabase: any, booking: any, oldStartTime: string, newStartTime: string) {
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
