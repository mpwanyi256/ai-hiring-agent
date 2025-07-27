import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { TablesInsert } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = await createClient();

    // RLS policies will handle admin access verification
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: subscriptions || [],
    });
  } catch (error) {
    console.error('Subscriptions GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const subscriptionData: TablesInsert<'subscriptions'> = await request.json();

    // Validate required fields
    if (!subscriptionData.name) {
      return NextResponse.json({ error: 'Subscription name is required' }, { status: 400 });
    }

    // RLS policies will handle admin access verification
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('Subscriptions POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
