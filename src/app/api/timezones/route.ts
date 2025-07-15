import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const search = searchParams.get('search');

    // Build query with countries join
    let query = supabase
      .from('timezones')
      .select(
        `
        *,
        countries(
          id,
          name,
          code,
          continent,
          created_at
        )
      `,
      )
      .order('region', { ascending: true })
      .order('display_name', { ascending: true });

    // Apply filters
    if (region) {
      query = query.eq('region', region);
    }

    if (search) {
      query = query.or(
        `display_name.ilike.%${search}%,name.ilike.%${search}%,countries.name.ilike.%${search}%,city.ilike.%${search}%`,
      );
    }

    const { data: timezones, error } = await query;

    if (error) {
      console.error('Error fetching timezones:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch timezones' },
        { status: 500 },
      );
    }

    // Transform data to match expected format
    const transformedTimezones =
      timezones?.map((timezone) => ({
        id: timezone.id,
        name: timezone.name,
        displayName: timezone.display_name,
        offsetHours: timezone.offset_hours,
        offsetMinutes: timezone.offset_minutes,
        isDst: timezone.is_dst,
        region: timezone.region,
        countryId: timezone.country_id,
        country: timezone.countries
          ? {
              id: timezone.countries.id,
              name: timezone.countries.name,
              code: timezone.countries.code,
              continent: timezone.countries.continent,
              createdAt: timezone.countries.created_at,
            }
          : null,
        city: timezone.city,
        createdAt: timezone.created_at,
      })) || [];

    return NextResponse.json({
      success: true,
      timezones: transformedTimezones,
    });
  } catch (error) {
    console.error('Error in timezones GET:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
