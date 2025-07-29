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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const jobTitleId = searchParams.get('jobTitleId');
    const employmentTypeId = searchParams.get('employmentTypeId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Cap at 50

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query using the comprehensive view - RLS will handle company filtering
    let query = supabase
      .from('contracts_comprehensive')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    if (jobTitleId) {
      query = query.eq('job_title_id', jobTitleId);
    }
    if (employmentTypeId) {
      query = query.eq('employment_type_id', employmentTypeId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: contracts, error, count } = await query;

    if (error) {
      console.error('Error fetching contracts:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch contracts',
          details: error.message,
        },
        { status: 500 },
      );
    }

    // Transform the results to match our TypeScript interfaces
    const transformedContracts =
      contracts?.map((contract: any) => ({
        id: contract.id,
        companyId: contract.company_id,
        jobTitleId: contract.job_title_id,
        title: contract.title,
        body: contract.body,
        employmentTypeId: contract.employment_type_id,
        contractDuration: contract.contract_duration,
        createdBy: contract.created_by,
        createdAt: contract.created_at,
        updatedAt: contract.updated_at,
        jobTitle: contract.job_title_name
          ? {
              id: contract.job_title_id,
              name: contract.job_title_name,
            }
          : null,
        employmentType: contract.employment_type_name
          ? {
              id: contract.employment_type_id,
              name: contract.employment_type_name,
            }
          : null,
        createdByProfile: {
          id: contract.created_by_profile_id,
          firstName: contract.created_by_first_name,
          lastName: contract.created_by_last_name,
          email: contract.created_by_email,
        },
      })) || [];

    // Calculate pagination info
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasMore,
    };

    return NextResponse.json({
      success: true,
      contracts: transformedContracts,
      pagination,
    });
  } catch (error) {
    console.error('Error in contracts API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 },
    );
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company from auth context (could be passed in headers)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { success: false, error: 'User profile or company not found' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { title, body: contractBody, jobTitleId, employmentTypeId, contractDuration } = body;

    // Validate required fields
    if (!title || !contractBody) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title and body are required',
        },
        { status: 400 },
      );
    }

    // Create the contract - RLS will handle company filtering
    const { data: contract, error } = await supabase
      .from('contracts')
      .insert({
        company_id: profile.company_id,
        title,
        body: contractBody,
        job_title_id: jobTitleId || null,
        employment_type_id: employmentTypeId || null,
        contract_duration: contractDuration || null,
        created_by: user.id,
      })
      .select(
        `
        *,
        job_title:job_titles(id, name),
        employment_type:employment_types(id, name),
        created_by_profile:profiles!contracts_created_by_fkey(
          id, first_name, last_name, email
        )
      `,
      )
      .single();

    if (error) {
      console.error('Error creating contract:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create contract',
          details: error.message,
        },
        { status: 500 },
      );
    }

    // Transform to match our TypeScript interface
    const transformedContract = {
      id: contract.id,
      companyId: contract.company_id,
      jobTitleId: contract.job_title_id,
      title: contract.title,
      body: contract.body,
      employmentTypeId: contract.employment_type_id,
      contractDuration: contract.contract_duration,
      createdBy: contract.created_by,
      createdAt: contract.created_at,
      updatedAt: contract.updated_at,
      jobTitle: contract.job_title,
      employmentType: contract.employment_type,
      createdByProfile: contract.created_by_profile,
    };

    return NextResponse.json({
      success: true,
      contract: transformedContract,
    });
  } catch (error) {
    console.error('Error in contracts POST API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
