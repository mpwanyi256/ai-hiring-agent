import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionMonitor } from '@/lib/billing/subscriptionMonitor';
import { monitoring } from '@/lib/constants';

// Auth middleware function
function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const providedKey = authHeader.slice(7);
  return providedKey === monitoring.apiKey;
}

export async function POST(request: NextRequest) {
  // Check authentication
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const monitor = new SubscriptionMonitor();
    const results = await monitor.runAllChecks();

    const totalNotifications = Object.values(results).reduce(
      (sum, result) => sum + result.notifications,
      0,
    );

    const totalErrors = Object.values(results)
      .map((result) => result.errors)
      .flat();

    return NextResponse.json({
      success: true,
      summary: {
        totalNotifications,
        errors: totalErrors.length,
      },
      details: results,
    });
  } catch (error: unknown) {
    console.error('Monitor endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'Subscription monitoring endpoint',
    description: 'Use POST with Authorization header to run monitoring checks',
    requiredHeader: 'Authorization: Bearer YOUR_MONITORING_API_KEY',
  });
}
