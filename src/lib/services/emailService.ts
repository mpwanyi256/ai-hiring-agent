import { Resend } from 'resend';
import { integrations } from '../constants';
import { InterviewEmailData, CalendarEvent } from '@/types/integrations';
import { DateTime } from 'luxon';

const resend = integrations.resend.apiKey ? new Resend(integrations.resend.apiKey) : null;

export function generateICSContent(event: CalendarEvent): string {
  const escapeText = (text: string) => {
    return text.replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
  };

  // Use luxon to handle timezone and formatting
  const start = DateTime.fromISO(event.startTime, { zone: event.timezone });
  const end = DateTime.fromISO(event.endTime, { zone: event.timezone });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Intavia//Interview Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@intavia.app`,
    `DTSTAMP:${DateTime.utc().toFormat("yyyyLLdd'T'HHmmss'Z'")}`,
    `DTSTART;TZID=${event.timezone}:${start.toFormat("yyyyLLdd'T'HHmmss")}`,
    `DTEND;TZID=${event.timezone}:${end.toFormat("yyyyLLdd'T'HHmmss")}`,
    `SUMMARY:${escapeText(event.summary)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `ORGANIZER;CN=Intavia:mailto:no-reply@intavia.app`,
    ...event.attendees.map(
      (email) =>
        `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${email}:mailto:${email}`,
    ),
    ...(event.meetLink ? [`LOCATION:${event.meetLink}`, `URL:${event.meetLink}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export async function sendInterviewNotification(data: InterviewEmailData): Promise<boolean> {
  try {
    if (!data.interviewDate || !data.interviewTime) {
      console.error('Missing interviewDate or interviewTime in email data:', data);
      return false;
    }
    const startDateTime = new Date(`${data.interviewDate}T${data.interviewTime}`);
    if (isNaN(startDateTime.getTime())) {
      console.error('Invalid startDateTime in email data:', data);
      return false;
    }
    const endDateTime = new Date(startDateTime.getTime() + data.duration * 60 * 1000);
    if (isNaN(endDateTime.getTime())) {
      console.error('Invalid endDateTime in email data:', data);
      return false;
    }

    const event: CalendarEvent = {
      summary: data.eventSummary,
      description: `Interview for ${data.jobTitle} position at ${data.companyName}${data.notes ? `\n\nNotes: ${data.notes}` : ''}`,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      timezone: data.timezone,
      attendees: [data.candidateEmail],
      meetLink: data.meetLink || undefined,
    };

    const icsContent = generateICSContent(event);

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #386B43;">Event Invitation</h2>
        
        <p>Hi ${data.candidateName},</p>
        
        <p>You've been invited to an event for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #386B43;">Event Details</h3>
          <p><strong>Date:</strong> ${new Date(data.interviewDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Time:</strong> ${data.interviewTime} (${data.timezone})</p>
          <p><strong>Duration:</strong> ${data.duration} minutes</p>
          ${data.meetLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetLink}" style="color: #386B43;">Join Meeting</a></p>` : ''}
          ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
        </div>
        
        <p>A calendar invite has been attached to this email. Please add it to your calendar.</p>
        
        <p>Best regards,<br>The ${data.companyName} Hiring Team</p>
      </div>
    `;

    if (!resend) {
      console.error('Resend client not initialized. Cannot send interview email.');
      return false;
    }

    const { data: emailResult, error } = await resend.emails.send({
      from: 'Intavia <no-reply@intavia.app>',
      to: [data.candidateEmail],
      cc: [data.organizerEmail],
      replyTo: data.organizerEmail,
      subject: data.eventSummary,
      html: emailContent,
      attachments: [
        {
          filename: 'interview-invite.ics',
          content: Buffer.from(icsContent).toString('base64'),
        },
      ],
    });

    if (error) {
      console.error('Failed to send interview email:', error);
      return false;
    }

    console.log('Interview email sent successfully:', emailResult);
    return true;
  } catch (error) {
    console.error('Error sending interview email:', error);
    return false;
  }
}

export async function sendInterviewUpdateNotification(data: InterviewEmailData): Promise<boolean> {
  try {
    console.log('Sending interview update email:', data);
    if (!data.interviewDate || !data.interviewTime) {
      console.error('Missing interviewDate or interviewTime in email data:', data);
      return false;
    }
    const startDateTime = new Date(`${data.interviewDate}T${data.interviewTime}`);
    if (isNaN(startDateTime.getTime())) {
      console.error('Invalid startDateTime in email data:', data);
      return false;
    }
    const endDateTime = new Date(startDateTime.getTime() + data.duration * 60 * 1000);
    if (isNaN(endDateTime.getTime())) {
      console.error('Invalid endDateTime in email data:', data);
      return false;
    }

    const event: CalendarEvent = {
      summary: data.eventSummary,
      description: `Interview for ${data.jobTitle} position at ${data.companyName}${data.notes ? `\n\nNotes: ${data.notes}` : ''}`,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      timezone: data.timezone,
      attendees: [data.candidateEmail],
      meetLink: data.meetLink || undefined,
    };

    const icsContent = generateICSContent(event);

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #386B43;">Interview Updated</h2>
        
        <p>Hi ${data.candidateName},</p>
        
        <p>Your interview for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong> has been updated.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #386B43;">Updated Interview Details</h3>
          <p><strong>Date:</strong> ${new Date(data.interviewDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Time:</strong> ${data.interviewTime} (${data.timezone})</p>
          <p><strong>Duration:</strong> ${data.duration} minutes</p>
          ${data.meetLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetLink}" style="color: #386B43;">Join Meeting</a></p>` : ''}
          ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
        </div>
        
        <p>An updated calendar invite has been attached to this email. Please update your calendar accordingly.</p>
        
        <p>If you have any questions, please contact us.</p>
        
        <p>Best regards,<br>The ${data.companyName} Hiring Team</p>
      </div>
    `;

    if (!resend) {
      console.error('Resend client not initialized. Cannot send interview update email.');
      return false;
    }

    const { data: emailResult, error } = await resend.emails.send({
      from: 'Intavia <no-reply@intavia.app>',
      to: [data.candidateEmail],
      subject: `Interview Updated - ${data.jobTitle} at ${data.companyName}`,
      html: emailContent,
      attachments: [
        {
          filename: 'interview-update.ics',
          content: Buffer.from(icsContent).toString('base64'),
        },
      ],
    });

    if (error) {
      console.error('Failed to send interview update email:', error);
      return false;
    }

    console.log('Interview update email sent successfully:', emailResult);
    return true;
  } catch (error) {
    console.error('Error sending interview update email:', error);
    return false;
  }
}

export async function sendInterviewCancellationNotification(
  data: InterviewEmailData,
): Promise<boolean> {
  try {
    if (!data.interviewDate || !data.interviewTime) {
      console.error('Missing interviewDate or interviewTime in email data:', data);
      return false;
    }
    const startDateTime = new Date(`${data.interviewDate}T${data.interviewTime}`);
    if (isNaN(startDateTime.getTime())) {
      console.error('Invalid startDateTime in email data:', data);
      return false;
    }
    const endDateTime = new Date(startDateTime.getTime() + data.duration * 60 * 1000);
    if (isNaN(endDateTime.getTime())) {
      console.error('Invalid endDateTime in email data:', data);
      return false;
    }

    // ICS with METHOD:CANCEL
    const event: CalendarEvent = {
      summary: `Interview with ${data.candidateName} for ${data.jobTitle}`,
      description: `Interview for ${data.jobTitle} position at ${data.companyName}${data.notes ? `\n\nNotes: ${data.notes}` : ''}`,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      timezone: data.timezone,
      attendees: [data.candidateEmail],
      meetLink: data.meetLink || undefined,
    };
    let icsContent = generateICSContent(event);
    // Replace METHOD:REQUEST with METHOD:CANCEL for cancellation
    icsContent = icsContent.replace('METHOD:REQUEST', 'METHOD:CANCEL');

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #BD6762;">Interview Cancelled</h2>
        <p>Hi ${data.candidateName},</p>
        <p>Your interview for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong> has been <strong>cancelled</strong>.</p>
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #BD6762;">Cancelled Interview Details</h3>
          <p><strong>Date:</strong> ${new Date(data.interviewDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Time:</strong> ${data.interviewTime} (${data.timezone})</p>
          <p><strong>Duration:</strong> ${data.duration} minutes</p>
          ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
        </div>
        <p>A calendar cancellation has been attached to this email. Please remove the event from your calendar.</p>
        <p>If you have any questions, please contact us.</p>
        <p>Best regards,<br>The ${data.companyName} Hiring Team</p>
      </div>
    `;

    if (!resend) {
      console.error('Resend client not initialized. Cannot send interview cancellation email.');
      return false;
    }

    const { data: emailResult, error } = await resend.emails.send({
      from: 'Intavia <no-reply@intavia.app>',
      to: [data.candidateEmail],
      subject: `Interview Cancelled - ${data.jobTitle} at ${data.companyName}`,
      html: emailContent,
      attachments: [
        {
          filename: 'interview-cancellation.ics',
          content: Buffer.from(icsContent).toString('base64'),
        },
      ],
    });

    if (error) {
      console.error('Failed to send interview cancellation email:', error);
      return false;
    }

    console.log('Interview cancellation email sent successfully:', emailResult);
    return true;
  } catch (error) {
    console.error('Error sending interview cancellation email:', error);
    return false;
  }
}

export async function sendInterviewReminderNotification(
  data: InterviewEmailData,
): Promise<boolean> {
  try {
    if (!data.interviewDate || !data.interviewTime) {
      console.error('Missing interviewDate or interviewTime in reminder email data:', data);
      return false;
    }
    const startDateTime = new Date(`${data.interviewDate}T${data.interviewTime}`);
    if (isNaN(startDateTime.getTime())) {
      console.error('Invalid startDateTime in reminder email data:', data);
      return false;
    }
    const endDateTime = new Date(startDateTime.getTime() + data.duration * 60 * 1000);
    if (isNaN(endDateTime.getTime())) {
      console.error('Invalid endDateTime in reminder email data:', data);
      return false;
    }

    const event: CalendarEvent = {
      summary: `Interview with ${data.candidateName} for ${data.jobTitle}`,
      description: `Interview for ${data.jobTitle} position at ${data.companyName}${data.notes ? `\n\nNotes: ${data.notes}` : ''}`,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      timezone: data.timezone,
      attendees: [data.candidateEmail],
      meetLink: data.meetLink || undefined,
    };

    const icsContent = generateICSContent(event);

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #386B43;">Interview Reminder</h2>
        
        <p>Hi ${data.candidateName},</p>
        
        <p>This is a reminder for your upcoming interview for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #386B43;">Interview Details</h3>
          <p><strong>Date:</strong> ${new Date(data.interviewDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Time:</strong> ${data.interviewTime} (${data.timezone})</p>
          <p><strong>Duration:</strong> ${data.duration} minutes</p>
          ${data.meetLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetLink}" style="color: #386B43;">Join Meeting</a></p>` : ''}
          ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
        </div>
        
        <p>Please ensure you're available at the scheduled time. If you need to reschedule, please contact us immediately.</p>
        
        <p>Best regards,<br>The ${data.companyName} Hiring Team</p>
      </div>
    `;

    if (!resend) {
      console.error('Resend client not initialized. Cannot send interview reminder email.');
      return false;
    }

    const { data: emailResult, error } = await resend.emails.send({
      from: 'Intavia <no-reply@intavia.app>',
      to: [data.candidateEmail],
      subject: `Interview Reminder - ${data.jobTitle} at ${data.companyName}`,
      html: emailContent,
      attachments: [
        {
          filename: 'interview-reminder.ics',
          content: Buffer.from(icsContent).toString('base64'),
        },
      ],
    });

    if (error) {
      console.error('Failed to send interview reminder email:', error);
      return false;
    }

    console.log('Interview reminder email sent successfully:', emailResult);
    return true;
  } catch (error) {
    console.error('Error sending interview reminder email:', error);
    return false;
  }
}

export async function sendInterviewRescheduledEmail(data: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  interviewDate: string;
  interviewTime: string;
  timezone: string;
  meetLink?: string;
  notes?: string;
}): Promise<boolean> {
  try {
    if (!data.interviewDate || !data.interviewTime) {
      console.error('Missing interviewDate or interviewTime in reschedule email data:', data);
      return false;
    }
    const startDateTime = new Date(`${data.interviewDate}T${data.interviewTime}`);
    if (isNaN(startDateTime.getTime())) {
      console.error('Invalid startDateTime in reschedule email data:', data);
      return false;
    }
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30 minutes duration
    if (isNaN(endDateTime.getTime())) {
      console.error('Invalid endDateTime in reschedule email data:', data);
      return false;
    }

    const event: CalendarEvent = {
      summary: `Interview with ${data.candidateName} for ${data.jobTitle}`,
      description: `Interview for ${data.jobTitle} position at ${data.companyName}${data.notes ? `\n\nNotes: ${data.notes}` : ''}`,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      timezone: data.timezone,
      attendees: [data.candidateEmail],
      meetLink: data.meetLink || undefined,
    };

    const icsContent = generateICSContent(event);

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #386B43;">Interview Rescheduled</h2>
        
        <p>Hi ${data.candidateName},</p>
        
        <p>Your interview for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong> has been rescheduled.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #386B43;">New Interview Details</h3>
          <p><strong>Date:</strong> ${new Date(data.interviewDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Time:</strong> ${data.interviewTime} (${data.timezone})</p>
          <p><strong>Duration:</strong> 30 minutes</p>
          ${data.meetLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetLink}" style="color: #386B43;">Join Meeting</a></p>` : ''}
          ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
        </div>
        
        <p>An updated calendar invite has been attached to this email. Please update your calendar accordingly.</p>
        
        <p>If you have any questions or need to reschedule, please contact us as soon as possible.</p>
        
        <p>Best regards,<br>The ${data.companyName} Hiring Team</p>
      </div>
    `;

    if (!resend) {
      console.error('Resend client not initialized. Cannot send interview reschedule email.');
      return false;
    }

    const { data: emailResult, error } = await resend.emails.send({
      from: 'Intavia <no-reply@intavia.app>',
      to: [data.candidateEmail],
      subject: `Interview Rescheduled - ${data.jobTitle} at ${data.companyName}`,
      html: emailContent,
      attachments: [
        {
          filename: 'interview-rescheduled.ics',
          content: Buffer.from(icsContent).toString('base64'),
        },
      ],
    });

    if (error) {
      console.error('Failed to send interview reschedule email:', error);
      return false;
    }

    console.log('Interview reschedule email sent successfully:', emailResult);
    return true;
  } catch (error) {
    console.error('Error sending interview reschedule email:', error);
    return false;
  }
}
