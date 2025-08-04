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

    // Fetch traits (global + company-specific)
    let query = supabase
      .from('traits_view')
      .select('*')
      .or(`company_id.is.null,company_id.eq.${profile.company_id}`)
      .order('name');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: traits, error } = await query;

    if (error) {
      console.error('Error fetching traits:', error);
      return NextResponse.json({ error: 'Failed to fetch traits' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      traits: traits || [],
    });
  } catch (error) {
    console.error('Error in traits API:', error);
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
    const { name, description, categoryId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Trait name is required' }, { status: 400 });
    }

    // Check if trait already exists for this company
    const { data: existingTrait, error: checkError } = await supabase
      .from('traits')
      .select('id')
      .eq('name', name.trim())
      .eq('company_id', profile.company_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing trait:', checkError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingTrait) {
      return NextResponse.json({ error: 'Trait already exists for your company' }, { status: 409 });
    }

    // Create new trait
    const { data: newTrait, error: createError } = await supabase
      .from('traits')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        category_id: categoryId || null,
        company_id: profile.company_id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating trait:', createError);
      return NextResponse.json({ error: 'Failed to create trait' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      trait: newTrait,
    });
  } catch (error) {
    console.error('Error in create trait API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
