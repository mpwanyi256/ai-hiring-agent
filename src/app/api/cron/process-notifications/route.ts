import { NextRequest, NextResponse } from 'next/server';
import { processEmailNotifications } from '@/lib/email/notificationProcessor';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a cron job or authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting email notification processing...');

    // Process all pending notifications
    await processEmailNotifications();

    return NextResponse.json({
      success: true,
      message: 'Email notifications processed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in notification processing cron job:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// Allow GET for health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'email-notification-processor',
    timestamp: new Date().toISOString(),
  });
}
