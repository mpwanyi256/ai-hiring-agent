import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ContractStatus, ContractCategory } from '@/types/contracts';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as ContractStatus) || undefined;
    const category = (searchParams.get('category') as ContractCategory) || undefined;
    const jobTitleId = searchParams.get('jobTitleId') || undefined;
    const employmentTypeId = searchParams.get('employmentTypeId') || undefined;
    const createdBy = searchParams.get('createdBy') || undefined;
    const isFavorite =
      searchParams.get('isFavorite') === 'true'
        ? true
        : searchParams.get('isFavorite') === 'false'
          ? false
          : undefined;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const offset = (page - 1) * limit;

    // Use the enhanced paginated function with all new filters
    const { data: contracts, error: contractsError } = await supabase.rpc(
      'get_contracts_paginated',
      {
        p_company_id: profile.company_id,
        p_limit: limit,
        p_offset: offset,
        p_search: search,
        p_job_title_id: jobTitleId,
        p_employment_type_id: employmentTypeId,
        p_created_by: createdBy,
        p_status: status,
        p_category: category,
        p_is_favorite: isFavorite,
        p_tags: tags,
        p_date_from: dateFrom ? new Date(dateFrom).toISOString() : null,
        p_date_to: dateTo ? new Date(dateTo).toISOString() : null,
        p_sort_by: sortBy,
        p_sort_order: sortOrder,
      },
    );

    if (contractsError) {
      console.error('Database error:', contractsError);
      return NextResponse.json(
        { error: 'Failed to fetch contracts', details: contractsError.message },
        { status: 500 },
      );
    }

    // Transform the data to match our TypeScript interfaces
    const transformedContracts =
      contracts?.map((contract: any) => ({
        id: contract.id,
        companyId: contract.company_id,
        jobTitleId: contract.job_title_id,
        title: contract.title,
        body: contract.body,
        employmentTypeId: contract.employment_type_id,
        contractDuration: contract.contract_duration,
        status: contract.status,
        category: contract.category,
        isFavorite: contract.is_favorite,
        tags: contract.tags || [],
        usageCount: contract.usage_count || 0,
        lastUsedAt: contract.last_used_at,
        createdBy: contract.created_by,
        createdAt: contract.created_at,
        updatedAt: contract.updated_at,
        jobTitle: contract.job_title_name
          ? {
              id: contract.job_title_id,
              name: contract.job_title_name,
            }
          : undefined,
        employmentType: contract.employment_type_name
          ? {
              id: contract.employment_type_id,
              name: contract.employment_type_name,
            }
          : undefined,
        createdByProfile: contract.created_by_first_name
          ? {
              id: contract.created_by,
              firstName: contract.created_by_first_name,
              lastName: contract.created_by_last_name,
              email: contract.created_by_email,
            }
          : undefined,
      })) || [];

    // Calculate pagination info
    const total = contracts?.[0]?.total_count || 0;
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    const pagination = {
      page,
      limit,
      total: Number(total),
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
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
    const { title, body: contractBody, content, jobTitleId, status = 'draft' } = body;

    // Validate required fields
    const rawBody = contractBody ?? content;
    if (!title || !rawBody || typeof rawBody !== 'string' || rawBody.trim().length === 0) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }
    const bodyText = rawBody.trim();

    // Create the contract
    const { data: contract, error: createError } = await supabase
      .from('contracts')
      .insert({
        title: title.trim(),
        content: bodyText,
        company_id: profile.company_id,
        created_by: user.id,
        job_title_id: jobTitleId || null,
        status,
      })
      .select(
        `
        *,
        job_title:job_titles(id, name),
        created_by_profile:profiles!contracts_created_by_fkey(
          id, first_name, last_name, email
        )
      `,
      )
      .single();

    if (createError) {
      console.error('Database error:', createError);
      return NextResponse.json(
        { error: 'Failed to create contract', details: createError.message },
        { status: 500 },
      );
    }

    // Transform the response
    const transformedContract = {
      id: contract.id,
      companyId: contract.company_id,
      jobTitleId: contract.job_title_id,
      title: contract.title,
      body: contract.body,
      isFavorite: contract.is_favorite,
      createdBy: contract.created_by,
      createdAt: contract.created_at,
      updatedAt: contract.updated_at,
      jobTitle: contract.job_title,
      createdByProfile: contract.created_by_profile,
    };

    return NextResponse.json({
      success: true,
      contract: transformedContract,
    });
  } catch (error) {
    console.error('Error in create contract API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
