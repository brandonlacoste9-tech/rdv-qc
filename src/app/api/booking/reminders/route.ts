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

type ReminderPreferences = {
  email24h?: {
    enabled: boolean;
    subject?: string;
    body?: string;
  };
  sms2h?: {
    enabled: boolean;
    message?: string;
  };
};

const DEFAULT_TEMPLATES = {
  email24h: {
    subject: 'Rappel : Votre rendez-vous de demain',
    body: 'Bonjour {{name}},\n\nCeci est un rappel pour votre rendez-vous avec {{professional}} le {{date}} à {{time}}.\n\nCordialement,\n{{professional}}',
  },
  sms2h: {
    message: 'Rappel : RDV avec {{professional}} dans 2h à {{time}}. {{date}}',
  },
};

function hasTwilioSmsConfig() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );
}

function formatDateTimeInZone(date: Date, timeZone: string) {
  return {
    date: date.toLocaleDateString('fr-CA', {
      timeZone,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('fr-CA', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };
}

function renderTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] || '');
}

async function sendSmsReminder(to: string, message: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_PHONE_NUMBER!;
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

  const body = new URLSearchParams({ To: to, From: from, Body: message });
  const response = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Twilio SMS error: ${err}`);
  }
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
      smsSent: 0,
      errors: 0,
      details: [] as any[]
    };

    const now = new Date();
    
    // Gather bookings between now+1h and now+25h to evaluate both 24h email and 2h SMS channels.
    const windowStart = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: bookings, error } = await supabase
      .from('Booking')
      .select('*')
      .gte('startTime', windowStart.toISOString())
      .lte('startTime', windowEnd.toISOString())
      .in('status', ['accepted', 'confirmed', 'ACCEPTED', 'CONFIRMED', 'RESCHEDULED', 'rescheduled']);

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    const eventTypeCache = new Map<string, any>();
    const userCache = new Map<string, any>();

    for (const booking of bookings || []) {
      try {
        const bookingStart = new Date(booking.startTime);
        const msUntilBooking = bookingStart.getTime() - now.getTime();
        const emailWindow = msUntilBooking >= 23 * 3600000 && msUntilBooking <= 25 * 3600000;
        const smsWindow = msUntilBooking >= 1 * 3600000 && msUntilBooking <= 3 * 3600000;

        let eventType = eventTypeCache.get(String(booking.eventTypeId));
        if (!eventType) {
          const { data } = await supabase
            .from('EventType')
            .select('id,title,userId')
            .eq('id', booking.eventTypeId)
            .single();
          eventType = data;
          if (eventType) eventTypeCache.set(String(booking.eventTypeId), eventType);
        }
        if (!eventType?.userId) continue;

        let user = userCache.get(String(eventType.userId));
        if (!user) {
          const { data } = await supabase
            .from('users')
            .select('id,name,email,timeZone,reminderPreferences')
            .eq('id', eventType.userId)
            .single();
          user = data;
          if (user) userCache.set(String(eventType.userId), user);
        }
        if (!user) continue;

        const prefs = (user.reminderPreferences || {}) as ReminderPreferences;
        const emailPrefs = {
          enabled: prefs.email24h?.enabled ?? true,
          subject: prefs.email24h?.subject || DEFAULT_TEMPLATES.email24h.subject,
          body: prefs.email24h?.body || DEFAULT_TEMPLATES.email24h.body,
        };
        const smsPrefs = {
          enabled: prefs.sms2h?.enabled ?? false,
          message: prefs.sms2h?.message || DEFAULT_TEMPLATES.sms2h.message,
        };

        const attendeeEmail = booking.responses?.email || booking.guestEmail;
        const attendeePhone = booking.smsReminderNumber || booking.responses?.phone || booking.responses?.phoneNumber;
        const attendeeName = booking.responses?.name || booking.guestName || 'there';
        const attendeeTz = booking.responses?.timeZone || user.timeZone || 'America/Toronto';
        const { date, time } = formatDateTimeInZone(bookingStart, attendeeTz);

        const templateVars = {
          name: attendeeName,
          professional: user.name || 'Planxo',
          date,
          time,
        };

        if (emailWindow && emailPrefs.enabled && attendeeEmail) {
          const { data: existingEmailReminder } = await supabase
            .from('email_reminders')
            .select('id')
            .eq('booking_id', String(booking.id))
            .eq('reminder_type', '24h')
            .single();

          if (!existingEmailReminder) {
            const renderedSubject = renderTemplate(emailPrefs.subject, templateVars);
            const renderedBody = renderTemplate(emailPrefs.body, templateVars);
            const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
              },
              body: JSON.stringify({
                to: attendeeEmail,
                template: 'generic',
                data: {
                  subject: renderedSubject,
                  message: renderedBody,
                },
              }),
            });

            if (!emailResponse.ok) {
              throw new Error('Email API failed');
            }

            await supabase.from('email_reminders').insert({
              booking_id: String(booking.id),
              reminder_type: '24h',
              sent_at: new Date().toISOString(),
              recipient_email: attendeeEmail,
            });

            results.emailsSent++;
            results.details.push({ bookingId: booking.id, channel: 'email24h', recipient: attendeeEmail, status: 'sent' });
          }
        }

        if (smsWindow && smsPrefs.enabled) {
          if (!hasTwilioSmsConfig()) {
            results.details.push({ bookingId: booking.id, channel: 'sms2h', status: 'skipped', reason: 'twilio_not_configured' });
          } else if (!attendeePhone) {
            results.details.push({ bookingId: booking.id, channel: 'sms2h', status: 'skipped', reason: 'missing_phone' });
          } else {
            const { data: existingSmsReminder } = await supabase
              .from('email_reminders')
              .select('id')
              .eq('booking_id', String(booking.id))
              .eq('reminder_type', 'sms2h')
              .single();

            if (!existingSmsReminder) {
              const smsMessage = renderTemplate(smsPrefs.message, templateVars);
              await sendSmsReminder(attendeePhone, smsMessage);

              await supabase.from('email_reminders').insert({
                booking_id: String(booking.id),
                reminder_type: 'sms2h',
                sent_at: new Date().toISOString(),
                recipient_email: attendeePhone,
              });

              results.smsSent++;
              results.details.push({ bookingId: booking.id, channel: 'sms2h', recipient: attendeePhone, status: 'sent' });
            }
          }
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
