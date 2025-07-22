import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { UpdateCompanyData } from '@/types/company';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID is required' },
        { status: 404 },
      );
    }

    // Get company data with timezone and country information
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select(
        `
        *,
        timezones(
          id,
          name,
          display_name,
          offset_hours,
          offset_minutes,
          region,
          country_id,
          city,
          countries(
            id,
            name,
            code,
            continent,
            created_at
          )
        )
      `,
      )
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    // Transform the response
    const transformedCompany = {
      id: company.id,
      name: company.name,
      slug: company.slug,
      bio: company.bio,
      logo_url: company.logo_url,
      logo_path: company.logo_path,
      timezoneId: company.timezone_id,
      createdBy: company.created_by,
      timezone: company.timezones
        ? {
            id: company.timezones.id,
            name: company.timezones.name,
            displayName: company.timezones.display_name,
            offsetHours: company.timezones.offset_hours,
            offsetMinutes: company.timezones.offset_minutes,
            isDst: company.timezones.is_dst,
            region: company.timezones.region,
            countryId: company.timezones.country_id,
            country: company.timezones.countries
              ? {
                  id: company.timezones.countries.id,
                  name: company.timezones.countries.name,
                  code: company.timezones.countries.code,
                  continent: company.timezones.countries.continent,
                  createdAt: company.timezones.countries.created_at,
                }
              : null,
            city: company.timezones.city,
            createdAt: company.timezones.created_at,
          }
        : null,
      created_at: company.created_at,
      updated_at: company.updated_at,
    };

    return NextResponse.json({
      success: true,
      company: transformedCompany,
    });
  } catch (error) {
    console.error('Error in company GET:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateCompanyData = await request.json();

    // Get user profile to find company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('companyId')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.companyId) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    // Validate timezone if provided
    if (body.timezoneId) {
      const { data: timezone, error: timezoneError } = await supabase
        .from('timezones')
        .select('id')
        .eq('id', body.timezoneId)
        .single();

      if (timezoneError || !timezone) {
        return NextResponse.json({ success: false, error: 'Invalid timezone' }, { status: 400 });
      }
    }

    // Update company
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.timezoneId !== undefined) updateData.timezone_id = body.timezoneId;

    const { data: company, error: updateError } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', profile.companyId)
      .select(
        `
        *,
        timezones(
          id,
          name,
          display_name,
          offset_hours,
          offset_minutes,
          region,
          country_id,
          city,
          countries(
            id,
            name,
            code,
            continent,
            created_at
          )
        )
      `,
      )
      .single();

    if (updateError || !company) {
      console.error('Error updating company:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update company' },
        { status: 500 },
      );
    }

    // Transform the response
    const transformedCompany = {
      id: company.id,
      name: company.name,
      slug: company.slug,
      bio: company.bio,
      logo_url: company.logo_url,
      website: company.website,
      timezoneId: company.timezone_id,
      timezone: company.timezones
        ? {
            id: company.timezones.id,
            name: company.timezones.name,
            displayName: company.timezones.display_name,
            offsetHours: company.timezones.offset_hours,
            offsetMinutes: company.timezones.offset_minutes,
            isDst: company.timezones.is_dst,
            region: company.timezones.region,
            countryId: company.timezones.country_id,
            country: company.timezones.countries
              ? {
                  id: company.timezones.countries.id,
                  name: company.timezones.countries.name,
                  code: company.timezones.countries.code,
                  continent: company.timezones.countries.continent,
                  createdAt: company.timezones.countries.created_at,
                }
              : null,
            city: company.timezones.city,
            createdAt: company.timezones.created_at,
          }
        : null,
      created_at: company.created_at,
      updated_at: company.updated_at,
    };

    return NextResponse.json({
      success: true,
      company: transformedCompany,
    });
  } catch (error) {
    console.error('Error in company PUT:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
