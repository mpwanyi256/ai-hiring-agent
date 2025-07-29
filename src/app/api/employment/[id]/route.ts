import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: employmentId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the employment record with relations
    const { data: employment, error } = await supabase
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
      .eq('id', employmentId)
      .single();

    if (error) {
      console.error('Error fetching employment record:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!employment) {
      return NextResponse.json(
        { success: false, error: 'Employment record not found' },
        { status: 404 },
      );
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
    console.error('Error in employment GET API:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: employmentId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateData = await request.json();

    // Build update object (only allow certain fields to be updated)
    const updateObj: any = {};
    if (updateData.employeeId !== undefined) updateObj.employee_id = updateData.employeeId;
    if (updateData.endDate !== undefined) updateObj.end_date = updateData.endDate;
    if (updateData.isActive !== undefined) updateObj.is_active = updateData.isActive;
    if (updateData.departmentId !== undefined) updateObj.department_id = updateData.departmentId;
    if (updateData.employmentTypeId !== undefined)
      updateObj.employment_type_id = updateData.employmentTypeId;
    if (updateData.workplaceType !== undefined) updateObj.workplace_type = updateData.workplaceType;
    if (updateData.jobType !== undefined) updateObj.job_type = updateData.jobType;

    // Update the employment record
    const { data: employment, error } = await supabase
      .from('employment')
      .update(updateObj)
      .eq('id', employmentId)
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
      console.error('Error updating employment record:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!employment) {
      return NextResponse.json(
        { success: false, error: 'Employment record not found' },
        { status: 404 },
      );
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
    console.error('Error updating employment record:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
