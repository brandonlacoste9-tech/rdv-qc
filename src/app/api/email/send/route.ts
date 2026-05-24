import { NextRequest, NextResponse } from 'next/server';

// Simple email sending endpoint using Resend
export async function POST(request: NextRequest) {
  try {
    const { to, template, data } = await request.json();

    if (!to || !template) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get email content based on template
    const emailContent = getEmailTemplate(template, data);

    // Send via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Planxo <notifications@rdv-qc.vercel.app>',
        to: [to],
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json({ success: true, id: result.id });

  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getEmailTemplate(template: string, data: any) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rdv-qc.vercel.app';

  switch (template) {
    case 'booking-confirmation':
      return getBookingConfirmationEmail(data, appUrl);
    case 'booking-cancelled':
      return getBookingCancelledEmail(data, appUrl);
    case 'booking-rescheduled':
      return getBookingRescheduledEmail(data, appUrl);
    case 'booking-reminder':
      return getBookingReminderEmail(data, appUrl);
    default:
      return getGenericEmail(data);
  }
}

function getBookingConfirmationEmail(data: any, appUrl: string) {
  const { attendeeName, eventTypeName, eventDate, eventTime, professionalName, cancelToken } = data;
  
  const manageUrl = `${appUrl}/booking/manage?token=${cancelToken}`;

  return {
    subject: `Votre rendez-vous est confirmé - ${eventTypeName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #D4AF37; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; margin: 10px 5px; text-decoration: none; border-radius: 4px; font-weight: bold; }
    .reschedule { background: #D4AF37; color: white; }
    .cancel { background: #A62B2B; color: white; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Planxo</h1>
    </div>
    
    <div dir="ltr" lang="fr">
      <p>Bonjour <strong>${attendeeName}</strong>,</p>
      <p>Votre rendez-vous pour <strong>${eventTypeName}</strong> est confirmé.</p>
      
      <div class="content">
        <p>✅ <strong>Date :</strong> ${eventDate}<br/>
        ⏰ <strong>Heure :</strong> ${eventTime}<br/>
        👤 <strong>Avec :</strong> ${professionalName}</p>
      </div>

      <p>Pour modifier ou annuler votre réservation :</p>
      <p>
        <a href="${manageUrl}&action=reschedule" class="button reschedule">🗓️ Modifier</a>
        <a href="${manageUrl}&action=cancel" class="button cancel">❌ Annuler</a>
      </p>
    </div>

    <hr style="border: 0; border-top: 1px solid #EAEAEA; margin: 30px 0;" />

    <div dir="ltr" lang="en" style="color: #666; font-size: 0.95em;">
      <p>Hello <strong>${attendeeName}</strong>,</p>
      <p>Your appointment for <strong>${eventTypeName}</strong> is confirmed.</p>
      <p>
        <a href="${manageUrl}&action=reschedule">Reschedule</a> | 
        <a href="${manageUrl}&action=cancel">Cancel</a>
      </p>
    </div>

    <div class="footer">
      <p>Planxo - Gestion de rendez-vous simplifiée</p>
    </div>
  </div>
</body>
</html>`,
    text: `Bonjour ${attendeeName},\n\nVotre rendez-vous pour ${eventTypeName} est confirmé.\n\nDate: ${eventDate}\nHeure: ${eventTime}\nAvec: ${professionalName}\n\nPour modifier ou annuler: ${manageUrl}`
  };
}

function getBookingCancelledEmail(data: any, appUrl: string) {
  const { attendeeName, eventTypeName, eventDate, eventTime, professionalName } = data;

  return {
    subject: `Rendez-vous annulé - ${eventTypeName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #A62B2B; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Rendez-vous annulé</h1>
    </div>
    
    <div dir="ltr" lang="fr">
      <p>Bonjour <strong>${attendeeName}</strong>,</p>
      <p>Votre rendez-vous pour <strong>${eventTypeName}</strong> a été annulé.</p>
      
      <div class="content">
        <p>❌ <strong>Date :</strong> ${eventDate}<br/>
        ⏰ <strong>Heure :</strong> ${eventTime}</p>
      </div>

      <p>Pour réserver un nouveau rendez-vous, visitez :<br/>
      <a href="${appUrl}">${appUrl}</a></p>
    </div>

    <hr style="border: 0; border-top: 1px solid #EAEAEA; margin: 30px 0;" />

    <div dir="ltr" lang="en" style="color: #666; font-size: 0.95em;">
      <p>Hello <strong>${attendeeName}</strong>,</p>
      <p>Your appointment for <strong>${eventTypeName}</strong> has been cancelled.</p>
    </div>

    <div class="footer">
      <p>Planxo - Gestion de rendez-vous simplifiée</p>
    </div>
  </div>
</body>
</html>`,
    text: `Bonjour ${attendeeName},\n\nVotre rendez-vous pour ${eventTypeName} a été annulé.\n\nDate: ${eventDate}\nHeure: ${eventTime}\n\nPour réserver un nouveau rendez-vous: ${appUrl}`
  };
}

function getBookingRescheduledEmail(data: any, appUrl: string) {
  const { attendeeName, eventTypeName, oldDate, oldTime, newDate, newTime, professionalName } = data;

  return {
    subject: `Rendez-vous modifié - ${eventTypeName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #D4AF37; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .old { text-decoration: line-through; color: #999; }
    .new { color: #2d8f47; font-weight: bold; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Rendez-vous modifié</h1>
    </div>
    
    <div dir="ltr" lang="fr">
      <p>Bonjour <strong>${attendeeName}</strong>,</p>
      <p>Votre rendez-vous pour <strong>${eventTypeName}</strong> a été modifié.</p>
      
      <div class="content">
        <p class="old">Ancienne date : ${oldDate} à ${oldTime}</p>
        <p class="new">Nouvelle date : ${newDate} à ${newTime}</p>
        <p>👤 <strong>Avec :</strong> ${professionalName}</p>
      </div>
    </div>

    <hr style="border: 0; border-top: 1px solid #EAEAEA; margin: 30px 0;" />

    <div dir="ltr" lang="en" style="color: #666; font-size: 0.95em;">
      <p>Hello <strong>${attendeeName}</strong>,</p>
      <p>Your appointment for <strong>${eventTypeName}</strong> has been rescheduled.</p>
      <p>New date: ${newDate} at ${newTime}</p>
    </div>

    <div class="footer">
      <p>Planxo - Gestion de rendez-vous simplifiée</p>
    </div>
  </div>
</body>
</html>`,
    text: `Bonjour ${attendeeName},\n\nVotre rendez-vous pour ${eventTypeName} a été modifié.\n\nAncienne date: ${oldDate} à ${oldTime}\nNouvelle date: ${newDate} à ${newTime}\n\nAvec: ${professionalName}`
  };
}

function getBookingReminderEmail(data: any, appUrl: string) {
  const { attendeeName, eventTypeName, eventDate, eventTime, professionalName, cancelToken } = data;
  
  const manageUrl = `${appUrl}/booking/manage?token=${cancelToken}`;

  return {
    subject: `Rappel : Votre rendez-vous demain - ${eventTypeName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: #D4AF37; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; border-left: 4px solid #D4AF37; }
    .button { display: inline-block; padding: 12px 24px; margin: 10px 5px; text-decoration: none; border-radius: 4px; font-weight: bold; }
    .reschedule { background: #D4AF37; color: white; }
    .cancel { background: #A62B2B; color: white; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Rappel de rendez-vous</h1>
    </div>
    
    <div dir="ltr" lang="fr">
      <p>Bonjour <strong>${attendeeName}</strong>,</p>
      <p>Ceci est un rappel pour votre rendez-vous <strong>demain</strong>.</p>
      
      <div class="content">
        <p>📅 <strong>${eventTypeName}</strong><br/>
        ⏰ <strong>${eventDate} à ${eventTime}</strong><br/>
        👤 <strong>Avec :</strong> ${professionalName}</p>
      </div>

      <p>Besoin de modifier votre rendez-vous ?</p>
      <p>
        <a href="${manageUrl}&action=reschedule" class="button reschedule">🗓️ Reporter</a>
        <a href="${manageUrl}&action=cancel" class="button cancel">❌ Annuler</a>
      </p>
    </div>

    <div class="footer">
      <p>Planxo - Gestion de rendez-vous simplifiée</p>
    </div>
  </div>
</body>
</html>`,
    text: `Rappel de rendez-vous\n\nBonjour ${attendeeName},\n\nVotre rendez-vous ${eventTypeName} est demain :\n${eventDate} à ${eventTime}\nAvec: ${professionalName}\n\nPour modifier: ${manageUrl}`
  };
}

function getGenericEmail(data: any) {
  return {
    subject: data.subject || 'Notification Planxo',
    html: `<p>${data.message || ''}</p>`,
    text: data.message || ''
  };
}
