import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const eventTypes = searchParams.get('eventTypes')?.split(',') || [];

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user and verify access
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user belongs to the company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.company_id !== companyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build query
    let query = supabase.from('team_activities').select('*').eq('company_id', companyId);

    // Filter by event types if provided
    if (eventTypes.length > 0) {
      query = query.in('event_type', eventTypes);
    }

    // Add pagination
    const offset = (page - 1) * limit;
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: activities, error: activitiesError } = await query;

    if (activitiesError) {
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('team_activities')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    if (eventTypes.length > 0) {
      countQuery = countQuery.in('event_type', eventTypes);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      return NextResponse.json({ error: 'Failed to get activities count' }, { status: 500 });
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Error fetching team activities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
