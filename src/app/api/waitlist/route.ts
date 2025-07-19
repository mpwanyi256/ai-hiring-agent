import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { app, integrations } from '@/lib/constants';

const resend = integrations.resend.apiKey ? new Resend(integrations.resend.apiKey) : null;

const waitlistSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  company: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = waitlistSchema.parse(body);

    if (!resend) {
      console.error('Resend client not initialized. Cannot process waitlist request.');
      return NextResponse.json({ error: 'Email service not available' }, { status: 500 });
    }

    // Create contact in Resend (only if we have a valid audienceId)
    if (integrations.resend.audienceId) {
      try {
        const { data: contactData, error: contactError } = await resend.contacts.create({
          email: validatedData.email,
          firstName: validatedData.name || '',
          lastName: '',
          unsubscribed: false,
          audienceId: integrations.resend.audienceId,
        });

        if (contactError) {
          console.error('Resend contact creation error:', contactError);
          // Don't fail the request if contact creation fails, just log it
        } else {
          console.log('Contact created successfully:', contactData);
        }
      } catch (contactError) {
        console.error('Error creating contact:', contactError);
        // Don't fail the request if contact creation fails, just log it
      }
    } else {
      console.log('No audienceId configured, skipping contact creation');
    }

    // Send welcome marketing email
    const marketingEmailContent = `
Welcome to ${app.name}! 🎉

Hi ${validatedData.name || 'there'},

Thank you for joining our waitlist! We're excited to have you on board as we revolutionize the hiring process with AI.

To help us understand your needs better and provide you with the most relevant updates, we'd love to learn a bit more about you:

🤔 Quick Questions:
• What's your biggest hiring challenge right now?
• How many candidates do you typically screen per role?
• What industry are you hiring for?
• Are you currently using any ATS or hiring tools?

💡 What to expect:
• Early access to our beta when it launches
• Exclusive insights on AI-powered hiring
• Tips and best practices for modern recruitment
• Special pricing for early adopters

We'll be in touch soon with more details about our launch timeline and how ${app.name} can transform your recruitment process.

Best regards,
The ${app.name} Team

---
You're receiving this because you joined our waitlist. Reply to this email to update your preferences.
    `.trim();

    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: `${app.name} <${app.email}>`,
        to: [validatedData.email],
        subject: `Welcome to ${app.name}! 🚀`,
        text: marketingEmailContent,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #386B43; margin-bottom: 10px;">Welcome to ${app.name}! 🎉</h1>
              <p style="color: #666; font-size: 18px;">We're excited to have you on board!</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
              <p style="margin: 0 0 15px 0; font-size: 16px;">
                Hi <strong>${validatedData.name || 'there'}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; line-height: 1.6;">
                Thank you for joining our waitlist! We're excited to have you on board as we revolutionize the hiring process with AI.
              </p>
            </div>
            
            <div style="margin: 30px 0;">
              <h2 style="color: #386B43; margin-bottom: 15px;">🤔 Quick Questions</h2>
              <p style="margin-bottom: 15px; line-height: 1.6;">
                To help us understand your needs better and provide you with the most relevant updates, we'd love to learn a bit more about you:
              </p>
              <ul style="line-height: 1.8; color: #555;">
                <li>What's your biggest hiring challenge right now?</li>
                <li>How many candidates do you typically screen per role?</li>
                <li>What industry are you hiring for?</li>
                <li>Are you currently using any ATS or hiring tools?</li>
              </ul>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #386B43; margin-bottom: 15px;">💡 What to expect:</h3>
              <ul style="line-height: 1.8; color: #555; margin: 0;">
                <li>Early access to our beta when it launches</li>
                <li>Exclusive insights on AI-powered hiring</li>
                <li>Tips and best practices for modern recruitment</li>
                <li>Special pricing for early adopters</li>
              </ul>
            </div>
            
            <p style="line-height: 1.6; color: #666;">
              We'll be in touch soon with more details about our launch timeline and how ${app.name} can transform your recruitment process.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999; font-size: 14px;">
                Best regards,<br>
                <strong>The ${app.name} Team</strong>
              </p>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                You're receiving this because you joined our waitlist. Reply to this email to update your preferences.
              </p>
            </div>
          </div>
        `,
      });

      if (emailError) {
        console.error('Resend email error:', emailError);
        // Don't fail the request if email fails, just log it
      } else {
        console.log('Welcome email sent successfully:', emailData);
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the request if email fails, just log it
    }

    return NextResponse.json({ message: 'Successfully joined waitlist' }, { status: 200 });
  } catch (error) {
    console.error('Waitlist error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
