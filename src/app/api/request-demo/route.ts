import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { integrations } from '@/lib/constants';

const resend = integrations.resend.apiKey ? new Resend(integrations.resend.apiKey) : null;

const demoRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().min(2),
  message: z.string().min(10),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = demoRequestSchema.parse(body);

    if (!resend) {
      console.error('Resend client not initialized. Cannot send demo request email.');
      return NextResponse.json({ error: 'Email service not available' }, { status: 500 });
    }

    // Prepare email content
    const emailContent = `
New Demo Request from Intavia

Name: ${validatedData.name}
Email: ${validatedData.email}
Company: ${validatedData.company}

Message:
${validatedData.message}

---
This request was submitted from the Intavia landing page.
    `.trim();

    // Send email using Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Intavia <no-reply@intavia.app>',
      to: ['connect@intavia.app'],
      cc: ['samuel@prodevkampala.com', 'samuelmpwanyi@gmail.com', 'gtwesigomwe1@gmail.com'],
      subject: `New Demo Request - ${validatedData.company}`,
      text: emailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #386B43;">New Demo Request from Intavia</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${validatedData.name}</p>
            <p><strong>Email:</strong> ${validatedData.email}</p>
            <p><strong>Company:</strong> ${validatedData.company}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #386B43;">Message:</h3>
            <p style="line-height: 1.6;">${validatedData.message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          <p style="color: #6c757d; font-size: 14px;">
            This request was submitted from the Intavia landing page.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Resend API error:', emailError);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    console.log('Demo request email sent successfully:', emailData);
    return NextResponse.json({ message: 'Demo request sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Demo request error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
