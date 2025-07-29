import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateEmploymentData } from '@/types/contracts';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query with filters
    let query = supabase
      .from('employment')
      .select(
        `
        *,
        profile:profiles(
          id, first_name, last_name, email, role,
          company:companies(id, name, slug)
        ),
        candidate:candidates(
          id,
          candidate_info:candidates_info(
            id, first_name, last_name, email
          ),
          job:jobs(
            id, title
          )
        ),
        contract_offer:contract_offers(
          id, status, salary_amount, salary_currency, start_date, end_date
        ),
        department:departments(id, name),
        employment_type:employment_types(id, name)
      `,
      )
      .order('created_at', { ascending: false });

    // Apply filters
    const search = searchParams.get('search');
    if (search) {
      // Search in profile names or employee ID
      query = query.or(`employee_id.ilike.%${search}%`);
    }

    const isActive = searchParams.get('isActive');
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const departmentId = searchParams.get('departmentId');
    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    const employmentTypeId = searchParams.get('employmentTypeId');
    if (employmentTypeId) {
      query = query.eq('employment_type_id', employmentTypeId);
    }

    const jobType = searchParams.get('jobType');
    if (jobType) {
      query = query.eq('job_type', jobType);
    }

    const workplaceType = searchParams.get('workplaceType');
    if (workplaceType) {
      query = query.eq('workplace_type', workplaceType);
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const {
      data: employment,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).limit(limit);

    if (error) {
      console.error('Error fetching employment records:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Transform the data to match our TypeScript interfaces
    const transformedEmployment =
      employment?.map((emp) => ({
        id: emp.id,
        profileId: emp.profile_id,
        candidateId: emp.candidate_id,
        contractOfferId: emp.contract_offer_id,
        employeeId: emp.employee_id,
        startDate: emp.start_date,
        endDate: emp.end_date,
        isActive: emp.is_active,
        departmentId: emp.department_id,
        employmentTypeId: emp.employment_type_id,
        workplaceType: emp.workplace_type,
        jobType: emp.job_type,
        createdAt: emp.created_at,
        updatedAt: emp.updated_at,
        profile: emp.profile
          ? {
              id: emp.profile.id,
              email: emp.profile.email,
              firstName: emp.profile.first_name,
              lastName: emp.profile.last_name,
              role: emp.profile.role,
              company: emp.profile.company
                ? {
                    id: emp.profile.company.id,
                    name: emp.profile.company.name,
                    slug: emp.profile.company.slug,
                  }
                : undefined,
            }
          : undefined,
        candidate: emp.candidate
          ? {
              id: emp.candidate.id,
              firstName: emp.candidate.candidate_info?.first_name,
              lastName: emp.candidate.candidate_info?.last_name,
              email: emp.candidate.candidate_info?.email,
              job: emp.candidate.job
                ? {
                    id: emp.candidate.job.id,
                    title: emp.candidate.job.title,
                  }
                : undefined,
            }
          : undefined,
        contractOffer: emp.contract_offer
          ? {
              id: emp.contract_offer.id,
              status: emp.contract_offer.status,
              salaryAmount: emp.contract_offer.salary_amount,
              salaryCurrency: emp.contract_offer.salary_currency,
              startDate: emp.contract_offer.start_date,
              endDate: emp.contract_offer.end_date,
            }
          : undefined,
        department: emp.department
          ? {
              id: emp.department.id,
              name: emp.department.name,
            }
          : undefined,
        employmentType: emp.employment_type
          ? {
              id: emp.employment_type.id,
              name: emp.employment_type.name,
            }
          : undefined,
      })) || [];

    // Calculate pagination
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      employment: transformedEmployment,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Error in employment API:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user - this could be service role for automated employment creation
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employmentData: CreateEmploymentData = await request.json();

    // Validate required fields
    if (
      !employmentData.contractOfferId ||
      !employmentData.profileId ||
      !employmentData.candidateId
    ) {
      return NextResponse.json(
        { success: false, error: 'Contract offer ID, profile ID, and candidate ID are required' },
        { status: 400 },
      );
    }

    // Verify contract offer exists and is signed
    const { data: contractOffer, error: contractError } = await supabase
      .from('contract_offers')
      .select('id, status, start_date, end_date')
      .eq('id', employmentData.contractOfferId)
      .eq('status', 'signed')
      .single();

    if (contractError || !contractOffer) {
      return NextResponse.json(
        { success: false, error: 'Contract offer not found or not signed' },
        { status: 400 },
      );
    }

    // Check if employment record already exists for this candidate
    const { data: existingEmployment, error: existingError } = await supabase
      .from('employment')
      .select('id')
      .eq('candidate_id', employmentData.candidateId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      // Error other than "no rows returned"
      console.error('Error checking existing employment:', existingError);
      return NextResponse.json({ success: false, error: existingError.message }, { status: 500 });
    }

    if (existingEmployment) {
      return NextResponse.json(
        { success: false, error: 'Employment record already exists for this candidate' },
        { status: 409 },
      );
    }

    // Create the employment record
    const { data: employment, error } = await supabase
      .from('employment')
      .insert({
        profile_id: employmentData.profileId,
        candidate_id: employmentData.candidateId,
        contract_offer_id: employmentData.contractOfferId,
        employee_id: employmentData.employeeId,
        start_date: contractOffer.start_date,
        end_date: contractOffer.end_date,
        is_active: true,
        department_id: employmentData.departmentId,
        employment_type_id: employmentData.employmentTypeId,
        workplace_type: employmentData.workplaceType,
        job_type: employmentData.jobType,
      })
      .select(
        `
        *,
        profile:profiles(
          id, first_name, last_name, email, role,
          company:companies(id, name, slug)
        ),
        candidate:candidates(
          id,
          candidate_info:candidates_info(
            id, first_name, last_name, email
          ),
          job:jobs(
            id, title
          )
        ),
        contract_offer:contract_offers(
          id, status, salary_amount, salary_currency, start_date, end_date
        ),
        department:departments(id, name),
        employment_type:employment_types(id, name)
      `,
      )
      .single();

    if (error) {
      console.error('Error creating employment record:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Transform the response
    const transformedEmployment = {
      id: employment.id,
      profileId: employment.profile_id,
      candidateId: employment.candidate_id,
      contractOfferId: employment.contract_offer_id,
      employeeId: employment.employee_id,
      startDate: employment.start_date,
      endDate: employment.end_date,
      isActive: employment.is_active,
      departmentId: employment.department_id,
      employmentTypeId: employment.employment_type_id,
      workplaceType: employment.workplace_type,
      jobType: employment.job_type,
      createdAt: employment.created_at,
      updatedAt: employment.updated_at,
      profile: employment.profile
        ? {
            id: employment.profile.id,
            email: employment.profile.email,
            firstName: employment.profile.first_name,
            lastName: employment.profile.last_name,
            role: employment.profile.role,
            company: employment.profile.company
              ? {
                  id: employment.profile.company.id,
                  name: employment.profile.company.name,
                  slug: employment.profile.company.slug,
                }
              : undefined,
          }
        : undefined,
      candidate: employment.candidate
        ? {
            id: employment.candidate.id,
            firstName: employment.candidate.candidate_info?.first_name,
            lastName: employment.candidate.candidate_info?.last_name,
            email: employment.candidate.candidate_info?.email,
            job: employment.candidate.job
              ? {
                  id: employment.candidate.job.id,
                  title: employment.candidate.job.title,
                }
              : undefined,
          }
        : undefined,
      contractOffer: employment.contract_offer
        ? {
            id: employment.contract_offer.id,
            status: employment.contract_offer.status,
            salaryAmount: employment.contract_offer.salary_amount,
            salaryCurrency: employment.contract_offer.salary_currency,
            startDate: employment.contract_offer.start_date,
            endDate: employment.contract_offer.end_date,
          }
        : undefined,
      department: employment.department
        ? {
            id: employment.department.id,
            name: employment.department.name,
          }
        : undefined,
      employmentType: employment.employment_type
        ? {
            id: employment.employment_type.id,
            name: employment.employment_type.name,
          }
        : undefined,
    };

    return NextResponse.json({
      success: true,
      employment: transformedEmployment,
    });
  } catch (error) {
    console.error('Error creating employment record:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
