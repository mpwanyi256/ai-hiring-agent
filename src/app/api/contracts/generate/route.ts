import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ai } from '@/lib/constants';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: ai.openaiApiKey,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user for authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      contractDuration,
      userPrompt,
      companyId,
      companyName,
      companyIndustry,
      selectedJobTitle,
      selectedEmploymentType,
    } = body;

    // Validate required fields
    if (!userPrompt || !userPrompt.trim()) {
      return NextResponse.json(
        {
          error: 'User prompt is required for AI generation',
        },
        { status: 400 },
      );
    }

    if (!companyId || !companyName) {
      return NextResponse.json(
        {
          error: 'Company information is required',
        },
        { status: 400 },
      );
    }

    // Prepare context for AI generation
    const contractContext = {
      companyName: companyName || 'Company',
      companyIndustry: companyIndustry || 'Various',
      contractTitle: title || 'Employment Contract',
      jobTitle: selectedJobTitle || 'Position',
      employmentType: selectedEmploymentType || 'Full-time',
      contractDuration: contractDuration || 'Permanent',
      userRequirements: userPrompt.trim(),
    };

    // Create AI prompt for contract generation
    const systemPrompt = `You are a legal contract specialist who creates professional employment contracts. Generate a comprehensive employment contract in HTML format based on the provided information.

    Requirements:
    - Use proper HTML structure with headings (h1, h2, h3), paragraphs (p), lists (ul, ol, li), and strong/em tags
    - Include all standard employment contract sections
    - Use placeholders in double curly braces for dynamic content like {{ candidate_name }}, {{ start_date }}, {{ salary_amount }}, etc.
    - Make it professional and legally sound
    - Incorporate the specific user requirements naturally into the contract
    - Include proper signature sections
    - Use modern, clear language that's easy to understand

    Standard placeholders to include:
    - {{ candidate_name }} - Full name of the candidate
    - {{ candidate_email }} - Email address
    - {{ company_name }} - Company name
    - {{ job_title }} - Position title
    - {{ employment_type }} - Type of employment
    - {{ start_date }} - Employment start date
    - {{ end_date }} - Contract end date (if applicable)
    - {{ salary_amount }} - Salary amount
    - {{ salary_currency }} - Currency
    - {{ contract_duration }} - Duration of contract
    - {{ signing_date }} - Date of signing

    Generate only the HTML content for the contract body, without <html>, <head>, or <body> tags.`;

    const userPromptText = `Generate an employment contract for:

    Company: ${contractContext.companyName}
    Industry: ${contractContext.companyIndustry}
    Contract Title: ${contractContext.contractTitle}
    Job Title: ${contractContext.jobTitle}
    Employment Type: ${contractContext.employmentType}
    Contract Duration: ${contractContext.contractDuration}

    Additional Requirements: ${contractContext.userRequirements}

    Please create a comprehensive contract that includes all necessary sections while incorporating these specific requirements.`;

    // Generate contract using OpenAI
    const completion = await openai.chat.completions.create({
      model: ai.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPromptText,
        },
      ],
      max_tokens: ai.maxTokens,
      temperature: ai.temperature,
    });

    const generatedContent = completion.choices[0]?.message?.content;

    if (!generatedContent) {
      return NextResponse.json(
        {
          error: 'Failed to generate contract content',
        },
        { status: 500 },
      );
    }

    // Clean up the generated content
    const cleanedContent = generatedContent
      .replace(/```html/g, '')
      .replace(/```/g, '')
      .trim();

    return NextResponse.json({
      success: true,
      contractContent: cleanedContent,
      context: contractContext,
      tokensUsed: completion.usage?.total_tokens || 0,
    });
  } catch (error) {
    console.error('Error generating contract with AI:', error);

    // Handle specific OpenAI errors
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        {
          error: 'Service configuration error',
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate contract with AI',
      },
      { status: 500 },
    );
  }
}
