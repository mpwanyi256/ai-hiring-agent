import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { integrations } from '@/lib/constants';

const resend = integrations.resend.apiKey ? new Resend(integrations.resend.apiKey) : null;

const contactFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().min(2),
  phone: z.string().optional(),
  subject: z.string().min(2),
  message: z.string().min(10),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = contactFormSchema.parse(body);

    if (!resend) {
      console.error('Resend client not initialized. Cannot send contact form email.');
      return NextResponse.json({ error: 'Email service not available' }, { status: 500 });
    }

    // Prepare email content
    const emailContent = `
New Contact Form Submission from Intavia

Name: ${validatedData.name}
Email: ${validatedData.email}
Company: ${validatedData.company}
${validatedData.phone ? `Phone: ${validatedData.phone}` : ''}
Subject: ${validatedData.subject}

Message:
${validatedData.message}

---
This submission was sent from the Intavia contact page.
    `.trim();

    // Send email using Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Intavia <no-reply@intavia.app>',
      to: ['connect@intavia.app'],
      cc: ['samuel@prodevkampala.com', 'samuelmpwanyi@gmail.com', 'gtwesigomwe1@gmail.com'],
      subject: `New Contact Form - ${validatedData.subject}`,
      text: emailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #386B43;">New Contact Form Submission from Intavia</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${validatedData.name}</p>
            <p><strong>Email:</strong> ${validatedData.email}</p>
            <p><strong>Company:</strong> ${validatedData.company}</p>
            ${validatedData.phone ? `<p><strong>Phone:</strong> ${validatedData.phone}</p>` : ''}
            <p><strong>Subject:</strong> ${validatedData.subject}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #386B43;">Message:</h3>
            <p style="line-height: 1.6;">${validatedData.message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          <p style="color: #6c757d; font-size: 14px;">
            This submission was sent from the Intavia contact page.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Resend API error:', emailError);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    console.log('Contact form email sent successfully:', emailData);
    return NextResponse.json({ message: 'Contact form submitted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Contact form error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
