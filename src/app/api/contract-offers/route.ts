import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile to find company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch all contract offers for the user's company using comprehensive view
    const { data: contractOffers, error } = await supabase
      .from('contract_offers_comprehensive')
      .select('*')
      .eq('contract_company_id', profile.company_id)
      .order('sent_at', { ascending: false });

    // Temporary fix: Fetch rejection reasons separately since the view doesn't include them
    const { data: rejectionReasons, error: rejectionError } = await supabase
      .from('contract_offers')
      .select('id, rejection_reason')
      .in('id', contractOffers?.map((offer) => offer.id) || []);

    if (error) {
      console.error('Error fetching contract offers:', error);
      return NextResponse.json({ error: 'Failed to fetch contract offers' }, { status: 500 });
    }

    if (rejectionError) {
      console.error('Error fetching rejection reasons:', rejectionError);
    }

    // Create a map of rejection reasons for quick lookup
    const rejectionReasonMap = new Map(
      rejectionReasons?.map((r) => [r.id, r.rejection_reason]) || [],
    );

    // Transform the data to match the frontend interface
    const transformedOffers =
      contractOffers?.map((offer) => ({
        id: offer.id,
        candidateId: offer.candidate_id,
        contractId: offer.contract_id,
        status: offer.status,
        salaryAmount: offer.salary_amount,
        salaryCurrency: offer.salary_currency,
        startDate: offer.start_date,
        endDate: offer.end_date,
        expiresAt: offer.expires_at,
        sentAt: offer.sent_at,
        signedAt: offer.signed_at,
        rejectedAt: offer.rejected_at,
        rejectionReason: rejectionReasonMap.get(offer.id) || null,
        signingToken: offer.signing_token,
        additionalTerms: offer.additional_terms,
        contract: {
          id: offer.contract_id,
          title: offer.contract_title,
        },
        candidate: {
          id: offer.candidate_id,
          firstName: offer.candidate_first_name,
          lastName: offer.candidate_last_name,
          email: offer.candidate_email,
          phone: offer.candidate_phone,
          linkedinUrl: offer.candidate_linkedin_url,
          portfolioUrl: offer.candidate_portfolio_url,
          status: offer.candidate_status,
          jobId: offer.candidate_job_id,
        },
        sentByProfile: {
          firstName: offer.sent_by_first_name,
          lastName: offer.sent_by_last_name,
          email: offer.sent_by_email,
        },
        company: {
          name: offer.company_name,
          slug: offer.company_slug,
          logoUrl: offer.company_logo_url,
        },
        job: {
          title: offer.job_title,
          workplaceType: offer.job_workplace_type,
          jobType: offer.job_job_type,
          departmentName: offer.job_department_name,
          jobTitleName: offer.job_title_name,
          employmentTypeName: offer.employment_type_name,
        },
        currency: {
          code: offer.currency_code,
          symbol: offer.currency_symbol,
          name: offer.currency_name,
        },
      })) || [];

    return NextResponse.json({
      contractOffers: transformedOffers,
    });
  } catch (error) {
    console.error('Error in contract offers GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
