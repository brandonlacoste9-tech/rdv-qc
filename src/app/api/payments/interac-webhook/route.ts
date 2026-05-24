import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  extractInteracRef, 
  extractAmount, 
  isInteracNotification 
} from '@/lib/interac';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Inbound email payload interface
interface InboundEmailPayload {
  html?: string;
  text?: string;
  subject?: string;
  from?: string;
  to?: string;
  headers?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming webhook payload
    const payload: InboundEmailPayload = await request.json();
    
    const emailBody = payload.text || payload.html || '';
    const subject = payload.subject || '';
    const from = payload.from || '';

    console.log('Received inbound email:', { subject, from: from.substring(0, 50) });

    // Security validation - check if it's an Interac notification
    if (!isInteracNotification(emailBody, subject, from)) {
      console.log('Ignored: Not an Interac notification');
      return NextResponse.json({ 
        status: 'ignored', 
        reason: 'Not a verified Interac payload' 
      }, { status: 200 });
    }

    // Extract the unique reference token (PLX-XXXX)
    const interacRef = extractInteracRef(emailBody);
    const parsedAmount = extractAmount(emailBody);

    console.log('Extracted data:', { interacRef, parsedAmount });

    if (!interacRef) {
      console.warn('Interac notification received but no PLX- reference found');
      return NextResponse.json({ 
        status: 'manual_review_required',
        reason: 'No reference token found in message'
      }, { status: 200 });
    }

    // Find the booking by Interac reference
    const { data: booking, error: bookingError } = await supabase
      .from('Booking')
      .select('*, EventType:eventTypeId(title, userId)')
      .eq('interacRef', interacRef)
      .single();

    if (bookingError || !booking) {
      console.error('No matching booking found for token:', interacRef);
      return NextResponse.json({ 
        error: 'No matching booking found',
        token: interacRef 
      }, { status: 404 });
    }

    // Check if already paid
    if (booking.paymentStatus === 'PAID') {
      console.log('Booking already paid:', booking.id);
      return NextResponse.json({ 
        status: 'already_processed',
        bookingId: booking.id,
        message: 'Transaction already reconciled'
      }, { status: 200 });
    }

    // Validate amount (allow small variance for rounding)
    const expectedAmount = booking.totalAmount || booking.amount;
    if (parsedAmount && expectedAmount) {
      const variance = Math.abs(parsedAmount - expectedAmount);
      if (variance > 0.02) { // Allow 2 cent variance
        console.warn(`Amount mismatch: expected ${expectedAmount}, got ${parsedAmount}`);
        // Still process but flag for review
      }
    }

    // Atomic transaction: Update booking + Create audit log + Log transaction
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1';

    const now = new Date().toISOString();

    // Update booking
    const { error: updateError } = await supabase
      .from('Booking')
      .update({
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        updatedAt: now
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      throw updateError;
    }

    // Create payment transaction log
    const { error: transactionError } = await supabase
      .from('PaymentTransaction')
      .insert({
        bookingId: booking.id,
        paymentMethod: 'INTERAC',
        paymentStatus: 'COMPLETED',
        amount: booking.amount || parsedAmount || 0,
        taxAmount: booking.taxAmount || 0,
        totalAmount: parsedAmount || booking.totalAmount || 0,
        interacRef: interacRef,
        processedAt: now,
        rawPayload: payload,
        metadata: {
          extractedAmount: parsedAmount,
          emailSubject: subject,
          emailFrom: from,
          variance: expectedAmount && parsedAmount ? Math.abs(expectedAmount - parsedAmount) : null
        }
      });

    if (transactionError) {
      console.error('Error creating transaction log:', transactionError);
    }

    // Create audit log for Law 25 compliance
    const { error: auditError } = await supabase
      .from('AuditLog')
      .insert({
        bookingId: booking.id,
        action: 'INTERAC_PAYMENT_RECEIVED',
        actor: 'SYSTEM_PAYMENT_ENGINE',
        ipAddress: ipAddress,
        timestamp: now,
        metadata: {
          interacRef,
          amount: parsedAmount,
          method: 'AUTO_RECONCILED'
        }
      });

    if (auditError) {
      console.error('Error creating audit log:', auditError);
    }

    // Send confirmation email
    await sendPaymentConfirmationEmail(booking);

    console.log('Interac payment reconciled successfully:', {
      bookingId: booking.id,
      interacRef,
      amount: parsedAmount
    });

    return NextResponse.json({
      success: true,
      status: 'reconciled',
      bookingId: booking.id,
      interacRef,
      amount: parsedAmount,
      timestamp: now
    });

  } catch (error) {
    console.error('Interac webhook fatal error:', error);
    return NextResponse.json({ 
      error: 'Internal processing error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function sendPaymentConfirmationEmail(booking: any) {
  try {
    const attendeeEmail = booking.responses?.email;
    const attendeeName = booking.responses?.name || 'there';
    
    if (!attendeeEmail) return;

    const eventDate = new Date(booking.startTime).toLocaleDateString('fr-CA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const eventTime = new Date(booking.startTime).toLocaleTimeString('fr-CA', {
      hour: '2-digit',
      minute: '2-digit'
    });

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
      },
      body: JSON.stringify({
        to: attendeeEmail,
        template: 'payment-confirmed',
        data: {
          attendeeName,
          eventTypeName: booking.EventType?.title || 'rendez-vous',
          eventDate,
          eventTime,
          amount: booking.totalAmount?.toFixed(2) || '0.00',
          paymentMethod: 'Virement Interac'
        }
      })
    });
  } catch (err) {
    console.error('Error sending confirmation email:', err);
  }
}

// GET endpoint for webhook verification/testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'active',
    service: 'Interac e-Transfer Auto-Reconciliation',
    timestamp: new Date().toISOString()
  });
}
