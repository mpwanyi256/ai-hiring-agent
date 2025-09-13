import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the current user to verify admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Fetch all companies with related data
    const { data: companies, error } = await supabase
      .from('companies')
      .select(
        `
        id,
        name,
        description,
        website,
        logo_url,
        industry,
        size_range,
        slug,
        bio,
        created_at,
        updated_at,
        created_by,
        timezones(
          name
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching companies:', error);
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }

    // Get user counts for each company
    const companyIds = companies?.map((c) => c.id) || [];
    const { data: userCounts, error: userCountError } = await supabase
      .from('profiles')
      .select('company_id')
      .in('company_id', companyIds);

    if (userCountError) {
      console.error('Error fetching user counts:', userCountError);
    }

    // Get job counts for each company
    const { data: jobCounts, error: jobCountError } = await supabase
      .from('jobs')
      .select('profile_id, status, profiles!inner(company_id)')
      .in('profiles.company_id', companyIds);

    if (jobCountError) {
      console.error('Error fetching job counts:', jobCountError);
    }

    // Get creator information from profiles table (since created_by references auth.users,
    // we need to find the profile with the same id)
    const createdByIds = companies?.map((c) => c.created_by).filter(Boolean) || [];
    const { data: creators, error: creatorsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', createdByIds);

    if (creatorsError) {
      console.error('Error fetching creators:', creatorsError);
    }

    // Calculate counts for each company
    const companiesWithCounts =
      companies?.map((company) => {
        // Count users in this company
        const userCount = userCounts?.filter((u) => u.company_id === company.id).length || 0;

        // Count jobs for this company
        const companyJobs =
          jobCounts?.filter(
            (j) => j.profiles && 'company_id' in j.profiles && j.profiles.company_id === company.id,
          ) || [];
        const jobCount = companyJobs.length;
        const activeJobsCount = companyJobs.filter(
          (j) => j.status === 'active' || j.status === 'published',
        ).length;

        // Find creator name
        const creator = creators?.find((c) => c.id === company.created_by);
        const creatorName =
          creator?.first_name && creator?.last_name
            ? `${creator.first_name} ${creator.last_name}`
            : null;

        return {
          id: company.id,
          name: company.name,
          description: company.description,
          website: company.website,
          logo_url: company.logo_url,
          industry: company.industry,
          size_range: company.size_range,
          slug: company.slug,
          bio: company.bio,
          created_at: company.created_at,
          updated_at: company.updated_at,
          created_by: company.created_by,
          timezone_name:
            company.timezones && 'name' in company.timezones ? company.timezones.name : null,
          creator_name: creatorName,
          user_count: userCount,
          job_count: jobCount,
          active_jobs_count: activeJobsCount,
        };
      }) || [];

    return NextResponse.json({
      companies: companiesWithCounts,
      total: companiesWithCounts.length,
    });
  } catch (error) {
    console.error('Error in admin companies API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
