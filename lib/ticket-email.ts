import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

// Create transporter with Brevo configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false,
    },
  });
};

interface TicketEmailData {
  recipientName: string;
  recipientEmail: string;
  eventDetails: {
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
  };
  emailSubject: string;
  emailMessage: string;
  includeQR: boolean;
  participantId: string;
  formId?: string;
  eventId: string;
}

export async function sendTicketEmail(data: TicketEmailData) {
  try {
    const transporter = createTransporter();

    // Verify connection first
    await transporter.verify();

    let qrCodeAttachment = null;

    if (data.includeQR) {
      // Generate QR code data
      const qrData = JSON.stringify({
        participantId: data.participantId,
        name: data.recipientName,
        email: data.recipientEmail,
        event: data.eventDetails.title,
        date: data.eventDetails.date,
        time: data.eventDetails.time,
        checkInCode: `${data.participantId}-${Date.now()}`,
        formId: data.formId, // Include formId for form-specific QR codes
        eventId: data.eventId,
      });

      // Generate QR code as base64
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Convert data URL to buffer for attachment
      const qrCodeBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');

      qrCodeAttachment = {
        filename: 'event-ticket-qr.png',
        content: qrCodeBuffer,
        contentType: 'image/png',
        cid: 'qrcode',
      };
    }

    const mailOptions = {
      from: `"Gravitas" <${process.env.SENDER_EMAIL}>`,
      to: data.recipientEmail,
      subject: data.emailSubject || `Your Ticket for ${data.eventDetails.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a1a1a; padding: 20px; text-align: center; border-radius: 5px;">
            <h1 style="color: white; margin: 0;">Gravitas</h1>
            <p style="color: white; margin: 5px 0; opacity: 0.9;">Your Event Ticket</p>
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #333;">Your Event Ticket</h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 10px 0;">${data.eventDetails.title}</h3>
              <p style="color: #666; margin: 5px 0;">
                <strong>Date:</strong> ${data.eventDetails.date}
              </p>
              <p style="color: #666; margin: 5px 0;">
                <strong>Time:</strong> ${data.eventDetails.time}
              </p>
              <p style="color: #666; margin: 5px 0;">
                <strong>Location:</strong> ${data.eventDetails.location}
              </p>
              <p style="color: #666; margin: 5px 0;">
                <strong>Participant:</strong> ${data.recipientName}
              </p>
              <p style="color: #666; margin: 5px 0;">
                <strong>Ticket ID:</strong> ${data.participantId}
              </p>
            </div>
            <div style="margin: 20px 0;">
              ${data.emailMessage.replace(/\n/g, '<br>')}
            </div>
            ${data.includeQR ? `
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #333; font-weight: bold; margin-bottom: 10px;">Your Check-in QR Code</p>
                <img src="cid:qrcode" alt="QR Code" style="max-width: 250px; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
                <p style="color: #666; font-size: 12px; margin-top: 10px;">Present this QR code at the event entrance for check-in</p>
              </div>
            ` : ''}
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">
              The Gravitas Team
            </p>
          </div>
        </div>
      `,
      text: `
        Hi ${data.recipientName},
        
        ${data.emailMessage}
        
        Event Details:
        Event: ${data.eventDetails.title}
        Date: ${data.eventDetails.date}
        Time: ${data.eventDetails.time}
        Location: ${data.eventDetails.location}
        
        ${data.includeQR ? 'Your QR code is attached for check-in at the venue.' : ''}
        
        Please keep this email as your confirmation.
        
        Best regards,
        The Gravitas Team
      `,
      attachments: data.includeQR && qrCodeAttachment ? [qrCodeAttachment] : [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Ticket email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send ticket email:', error);
    throw new Error(`Failed to send ticket email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}