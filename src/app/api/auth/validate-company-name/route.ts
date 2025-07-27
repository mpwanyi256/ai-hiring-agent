import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { companyName } = await request.json();

    if (!companyName || typeof companyName !== 'string') {
      return NextResponse.json(
        { isAvailable: false, message: 'Company name is required' },
        { status: 400 },
      );
    }

    // Trim and validate company name
    const trimmedCompanyName = companyName.trim();

    if (trimmedCompanyName.length < 2) {
      return NextResponse.json(
        { isAvailable: false, message: 'Company name must be at least 2 characters long' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Check if company name already exists (case-insensitive)
    const { data: existingCompany, error } = await supabase
      .from('companies')
      .select('name')
      .ilike('name', trimmedCompanyName)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is the "not found" error code, which is what we want
      console.error('Error checking company name:', error);
      return NextResponse.json(
        { isAvailable: false, message: 'Error validating company name' },
        { status: 500 },
      );
    }

    const isAvailable = !existingCompany;

    if (!isAvailable) {
      // Generate suggestions by appending numbers or variations
      const suggestions = [
        `${trimmedCompanyName} Inc`,
        `${trimmedCompanyName} LLC`,
        `${trimmedCompanyName} Ltd`,
        `${trimmedCompanyName} Technologies`,
        `${trimmedCompanyName} Solutions`,
      ];

      return NextResponse.json({
        isAvailable: false,
        message: 'This company name is already taken. Please choose a different name.',
        suggestions,
      });
    }

    return NextResponse.json({
      isAvailable: true,
      message: 'Company name is available!',
    });
  } catch (error) {
    console.error('Company name validation error:', error);
    return NextResponse.json(
      { isAvailable: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
