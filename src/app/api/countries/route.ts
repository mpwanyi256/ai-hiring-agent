import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const continent = searchParams.get('continent');
    const search = searchParams.get('search');

    // Build query
    let query = supabase.from('countries').select('*').order('name', { ascending: true });

    // Apply filters
    if (continent) {
      query = query.eq('continent', continent);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }

    const { data: countries, error } = await query;

    if (error) {
      console.error('Error fetching countries:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch countries' },
        { status: 500 },
      );
    }

    // Transform data to match expected format
    const transformedCountries =
      countries?.map((country) => ({
        id: country.id,
        name: country.name,
        code: country.code,
        continent: country.continent,
        createdAt: country.created_at,
      })) || [];

    return NextResponse.json({
      success: true,
      countries: transformedCountries,
    });
  } catch (error) {
    console.error('Error in countries GET:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
