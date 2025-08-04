import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TimelineEventsResponse } from '@/types/notifications';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: candidateId } = await params;
    const supabase = await createClient();

    // Use the candidate_timeline_events view for simplified querying
    const { data: timelineEvents, error } = await supabase
      .from('candidate_timeline_events')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching candidate timeline:', error);
      return NextResponse.json({ error: 'Failed to fetch candidate timeline' }, { status: 500 });
    }

    const response: TimelineEventsResponse = {
      success: true,
      error: null,
      events: timelineEvents || [],
      total: timelineEvents?.length || 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching candidate timeline:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch candidate timeline',
        events: [],
        total: 0,
      } as TimelineEventsResponse,
      { status: 500 },
    );
  }
}
