import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get analytics using the database function
    const { data: analyticsData, error: analyticsError } = await supabase.rpc(
      'get_contract_analytics',
      {
        p_company_id: profile.company_id,
      },
    );

    if (analyticsError) {
      console.error('Analytics error:', analyticsError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics', details: analyticsError.message },
        { status: 500 },
      );
    }

    const data = analyticsData?.[0];

    if (!data) {
      return NextResponse.json({
        success: true,
        analytics: {
          totalContracts: 0,
          contractsByStatus: {
            draft: 0,
            active: 0,
            archived: 0,
            deprecated: 0,
          },
          contractsByCategory: {
            general: 0,
            technical: 0,
            executive: 0,
            intern: 0,
            freelance: 0,
            custom: 0,
          },
          mostUsedContracts: [],
          recentActivity: {
            contractsCreated: 0,
            contractsSent: 0,
            contractsSigned: 0,
            contractsRejected: 0,
          },
          conversionRate: 0,
          averageSigningTime: 0,
          popularJobTitles: [],
          popularEmploymentTypes: [],
        },
      });
    }

    // Get most used contracts
    const { data: mostUsedContracts, error: mostUsedError } = await supabase
      .from('contracts')
      .select('id, title, usage_count')
      .eq('company_id', profile.company_id)
      .gt('usage_count', 0)
      .order('usage_count', { ascending: false })
      .limit(5);

    if (mostUsedError) {
      console.error('Most used contracts error:', mostUsedError);
    }

    // Get popular job titles using security definer function
    const { data: popularJobTitles, error: jobTitlesError } = await supabase.rpc(
      'get_popular_contract_job_titles',
      {
        p_company_id: profile.company_id,
        p_limit: 5,
      },
    );

    if (jobTitlesError) {
      console.error('Popular job titles error:', jobTitlesError);
    }

    // Get popular employment types using security definer function
    const { data: popularEmploymentTypes, error: employmentTypesError } = await supabase.rpc(
      'get_popular_contract_employment_types',
      {
        p_company_id: profile.company_id,
        p_limit: 5,
      },
    );

    if (employmentTypesError) {
      console.error('Popular employment types error:', employmentTypesError);
    }

    // Transform analytics data
    const analytics = {
      totalContracts: Number(data.total_contracts),
      contractsByStatus: {
        draft: Number(data.status_draft),
        active: Number(data.status_active),
        archived: Number(data.status_archived),
        deprecated: Number(data.status_deprecated),
      },
      contractsByCategory: {
        general: Number(data.category_general),
        technical: Number(data.category_technical),
        executive: Number(data.category_executive),
        intern: Number(data.category_intern),
        freelance: Number(data.category_freelance),
        custom: Number(data.category_custom),
      },
      mostUsedContracts:
        mostUsedContracts?.map((contract: any) => ({
          id: contract.id,
          title: contract.title,
          usageCount: contract.usage_count,
        })) || [],
      recentActivity: {
        contractsCreated: Number(data.contracts_created_last_30_days),
        contractsSent: Number(data.contracts_sent_last_30_days),
        contractsSigned: Number(data.contracts_signed_last_30_days),
        contractsRejected: Number(data.contracts_rejected_last_30_days),
      },
      conversionRate: Number(data.conversion_rate) || 0,
      averageSigningTime: Number(data.avg_signing_time_hours) || 0,
      popularJobTitles:
        popularJobTitles?.map((item: any) => ({
          id: item.job_title_id,
          name: item.job_title_name,
          count: item.usage_count,
        })) || [],
      popularEmploymentTypes:
        popularEmploymentTypes?.map((item: any) => ({
          id: item.employment_type_id,
          name: item.employment_type_name,
          count: item.usage_count,
        })) || [],
    };

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
