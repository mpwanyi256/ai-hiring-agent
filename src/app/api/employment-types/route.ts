import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get search query from URL params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Fetch employment types (global + company-specific)
    let query = supabase
      .from('employment_types')
      .select('*')
      .or(`company_id.is.null,company_id.eq.${profile.company_id}`)
      .order('name');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: employmentTypes, error } = await query;

    if (error) {
      console.error('Error fetching employment types:', error);
      return NextResponse.json({ error: 'Failed to fetch employment types' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      employmentTypes: employmentTypes || [],
    });
  } catch (error) {
    console.error('Error in employment types API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Employment type name is required' }, { status: 400 });
    }

    // Check if employment type already exists for this company
    const { data: existingType, error: checkError } = await supabase
      .from('employment_types')
      .select('id')
      .eq('name', name.trim())
      .eq('company_id', profile.company_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing employment type:', checkError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingType) {
      return NextResponse.json(
        { error: 'Employment type already exists for your company' },
        { status: 409 },
      );
    }

    // Create new employment type
    const { data: newEmploymentType, error: createError } = await supabase
      .from('employment_types')
      .insert({
        name: name.trim(),
        company_id: profile.company_id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating employment type:', createError);
      return NextResponse.json({ error: 'Failed to create employment type' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      employmentType: newEmploymentType,
    });
  } catch (error) {
    console.error('Error in create employment type API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
