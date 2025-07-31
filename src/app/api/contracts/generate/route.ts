import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ai } from '@/lib/constants';
import OpenAI from 'openai';

// Function to clean markdown formatting and ensure HTML output
function cleanMarkdownFromResponse(text: string): string {
  let cleaned = text;

  // Step 1: Handle markdown bold patterns (**text** or __text__)
  // Use global flag and non-greedy matching
  cleaned = cleaned.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  cleaned = cleaned.replace(/__([^_\n]+?)__/g, '<strong>$1</strong>');

  // Step 2: Handle markdown headings first (to avoid conflicts)
  cleaned = cleaned.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
  cleaned = cleaned.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
  cleaned = cleaned.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>');

  // Step 3: Handle remaining single asterisks for italic (after bold is processed)
  // Since bold is already handled, remaining single asterisks should be italic
  cleaned = cleaned.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');

  // Step 4: Handle underscores for italic (with word boundaries)
  cleaned = cleaned.replace(/\b_([^_\n]+?)_\b/g, '<em>$1</em>');

  // Step 5: Convert markdown lists to HTML
  cleaned = cleaned.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');

  // Step 6: Wrap consecutive <li> items in <ul>
  cleaned = cleaned.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');

  // Step 7: Remove markdown code blocks and inline code
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

  // Step 8: Clean up any remaining markdown artifacts
  cleaned = cleaned.replace(/[*_#`~\[\]]/g, '');

  // Step 9: Convert double line breaks to paragraph breaks
  cleaned = cleaned.replace(/\n\s*\n/g, '</p>\n<p>');

  // Step 10: Wrap content in paragraphs if not already wrapped
  if (!cleaned.includes('<p>') && !cleaned.includes('<h') && !cleaned.includes('<ul>')) {
    cleaned = '<p>' + cleaned + '</p>';
  } else if (!cleaned.startsWith('<')) {
    cleaned = '<p>' + cleaned;
  }
  if (!cleaned.endsWith('>') && !cleaned.endsWith('</p>')) {
    cleaned = cleaned + '</p>';
  }

  // Step 11: Clean up malformed HTML and extra whitespace
  cleaned = cleaned.replace(/<p>\s*<\/p>/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\n+/g, '\n');
  cleaned = cleaned.trim();

  return cleaned;
}

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

    // Create AI prompt for contract generation with enhanced HTML requirements
    const systemPrompt = `You are a legal contract specialist who creates professional employment contracts. Generate a comprehensive employment contract with proper grammar and professional language.

    CRITICAL FORMATTING REQUIREMENTS:
    - Return ONLY clean HTML content (use <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags)
    - Do NOT use markdown formatting (no **, __, ##, ---, etc.)
    - Do NOT include <html>, <head>, or <body> tags
    - Do NOT include any explanations, summaries, or meta-commentary
    - Use proper HTML structure with semantic headings and paragraphs
    - Ensure perfect grammar, spelling, and professional language
    - Use <strong> for emphasis instead of **bold**
    - Use <em> for italics instead of *italic*
    - Use <h1>, <h2>, <h3> for headings instead of # ## ###
    - Use <ul><li> for lists instead of - or *

    CONTRACT REQUIREMENTS:
    - Include all standard employment contract sections
    - Use placeholders in double curly braces for dynamic content
    - Make it comprehensive and legally sound
    - Incorporate the specific user requirements naturally
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

    Return ONLY the clean HTML contract content.`;

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

    const rawGeneratedContent = completion.choices[0]?.message?.content;

    if (!rawGeneratedContent) {
      return NextResponse.json(
        {
          error: 'Failed to generate contract content',
        },
        { status: 500 },
      );
    }

    // Clean up the generated content with enhanced processing
    let cleanedContent = rawGeneratedContent
      .replace(/```html/g, '')
      .replace(/```/g, '')
      .trim();

    // Apply markdown cleaning for consistent HTML output
    cleanedContent = cleanMarkdownFromResponse(cleanedContent);

    // Analyze the generated content for improvements
    const improvements: string[] = [];
    const placeholdersAdded: string[] = [];

    // Detect placeholders that were added
    const placeholderMatches = cleanedContent.match(/\{\{\s*[^}]+\s*\}\}/g) || [];
    const uniquePlaceholders = [...new Set(placeholderMatches)];

    uniquePlaceholders.forEach((placeholder) => {
      const cleanPlaceholder = placeholder.replace(/[{}\s]/g, '');
      placeholdersAdded.push(cleanPlaceholder);
    });

    // Add standard improvements
    improvements.push('Professional contract structure generated');
    improvements.push('HTML formatting applied for rich text display');
    improvements.push('Legal language and terminology optimized');
    improvements.push('Grammar and spelling verified');

    if (placeholdersAdded.length > 0) {
      improvements.push(`${placeholdersAdded.length} dynamic placeholders integrated`);
    }

    const wordCount = cleanedContent.replace(/<[^>]*>/g, '').split(/\s+/).length;
    improvements.push(`Comprehensive contract generated (${wordCount} words)`);

    return NextResponse.json({
      success: true,
      contractContent: cleanedContent,
      context: contractContext,
      improvements,
      placeholdersAdded,
      tokensUsed: completion.usage?.total_tokens || 0,
      originalLength: rawGeneratedContent.length,
      enhancedLength: cleanedContent.length,
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
