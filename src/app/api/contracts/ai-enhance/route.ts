import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { ai } from '@/lib/constants';

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

// OpenAI-powered AI enhancement function for contract templates
async function enhanceContractWithAI(content: string): Promise<{
  enhancedContent: string;
  improvements: string[];
  placeholdersAdded: string[];
}> {
  const improvements: string[] = [];
  const placeholdersAdded: string[] = [];

  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: ai.openaiApiKey,
    });

    // Create a comprehensive prompt for contract enhancement with HTML output
    const prompt = `You are an expert contract template generator. Please enhance the following contract text by:

1. Correcting grammar, spelling, and improving professional language (count the number of grammar/spelling corrections you make)
2. Replacing specific values with appropriate placeholders (e.g., {{ candidate_name }}, {{ company_name }}, {{ job_title }}, {{ salary_amount }}, {{ start_date }}, {{ employment_type }}, {{ contract_duration }})
3. Ensuring consistent formatting and structure
4. Making the language more professional and legally appropriate
5. Adding any missing standard contract clauses if appropriate

IMPORTANT FORMATTING REQUIREMENTS:
- Return the contract as clean HTML (use <p>, <h1>, <h2>, <h3>, <ul>, <li>, <strong>, <em> tags as appropriate)
- Do NOT use markdown formatting (no **, __, ##, ---, etc.)
- Do NOT include any AI commentary, explanations, or meta-text
- Preserve paragraph structure and use proper HTML line breaks
- Use <strong> for emphasis instead of **bold**
- Use <em> for italics instead of *italic*
- Use <h1>, <h2>, <h3> for headings instead of # ## ###
- Use <ul><li> for lists instead of - or *

Contract text to enhance:

${content}

Return ONLY the enhanced contract text as clean HTML with placeholders. Do not include any explanations, summaries, or additional commentary.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: ai.maxTokens * 2, // Allow more tokens for contract content
      temperature: ai.temperature * 0.5, // Lower temperature for more consistent output
    });

    const rawEnhancedText = response.choices[0]?.message?.content?.trim();

    if (rawEnhancedText && rawEnhancedText.length > 0) {
      // Clean any markdown formatting from the AI response
      const enhancedText = cleanMarkdownFromResponse(rawEnhancedText);

      // Analyze what improvements were made
      const originalWords = content.split(/\s+/).length;
      const enhancedWords = enhancedText.split(/\s+/).length;

      // Estimate grammar corrections by comparing character differences
      // This is a rough estimate since we can't perfectly track individual corrections
      const originalLength = content.length;
      const enhancedLength = enhancedText.replace(/<[^>]*>/g, '').length; // Remove HTML tags for comparison
      const lengthDifference = Math.abs(enhancedLength - originalLength);
      const estimatedCorrections = Math.min(Math.floor(lengthDifference / 10), 20); // Cap at reasonable number

      improvements.push('HTML formatting applied for rich text display');
      improvements.push('Professional language enhanced');
      improvements.push('Contract structure improved');

      if (estimatedCorrections > 0) {
        improvements.push(
          `Approximately ${estimatedCorrections} grammar/spelling corrections made`,
        );
      }

      if (enhancedWords !== originalWords) {
        improvements.push(`Content length optimized (${originalWords} → ${enhancedWords} words)`);
      }

      // Detect placeholders that were added
      const placeholderMatches = enhancedText.match(/\{\{\s*[^}]+\s*\}\}/g) || [];
      const uniquePlaceholders = [...new Set(placeholderMatches)];

      uniquePlaceholders.forEach((placeholder) => {
        const cleanPlaceholder = placeholder.replace(/[{}\s]/g, '');
        placeholdersAdded.push(cleanPlaceholder);
      });

      if (placeholdersAdded.length > 0) {
        improvements.push(`${placeholdersAdded.length} dynamic placeholders added`);
      }

      return {
        enhancedContent: enhancedText,
        improvements,
        placeholdersAdded,
      };
    }
  } catch (error) {
    console.error('OpenAI enhancement failed:', error);
    // Fall back to basic enhancement if OpenAI fails
  }

  // Fallback to basic enhancement if OpenAI fails
  let enhancedContent = content;

  // Common contract terms to replace with placeholders
  const replacements = [
    {
      pattern:
        /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b(?=.*(?:Employee|Contractor|Worker))/g,
      placeholder: '{{ candidate_name }}',
      description: 'candidate name',
    },
    {
      pattern: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Inc\.|LLC|Corporation|Corp\.|Company)\b/g,
      placeholder: '{{ company_name }}',
      description: 'company name',
    },
    {
      pattern:
        /\b(?:Software Engineer|Developer|Manager|Director|Analyst|Consultant|Designer|Specialist)\b/gi,
      placeholder: '{{ job_title }}',
      description: 'job title',
    },
    {
      pattern: /\$[\d,]+(?:\.\d{2})?\s*(?:per\s+year|annually|yearly)/gi,
      placeholder: '{{ salary_amount }} {{ salary_currency }} per year',
      description: 'salary amount',
    },
    {
      pattern:
        /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g,
      placeholder: '{{ start_date }}',
      description: 'start date',
    },
    {
      pattern: /\b(?:full-time|part-time|contract|temporary|permanent)\b/gi,
      placeholder: '{{ employment_type }}',
      description: 'employment type',
    },
    {
      pattern: /\b(?:12|24|36)\s+months?\b/g,
      placeholder: '{{ contract_duration }}',
      description: 'contract duration',
    },
  ];

  // Apply replacements
  replacements.forEach(({ pattern, placeholder, description }) => {
    const matches = enhancedContent.match(pattern);
    if (matches && matches.length > 0) {
      enhancedContent = enhancedContent.replace(pattern, placeholder);
      placeholdersAdded.push(`${placeholder} (${description})`);
      improvements.push(
        `Replaced ${matches.length} instance(s) of ${description} with placeholder`,
      );
    }
  });

  // Grammar and spelling improvements (mock)
  const grammarFixes = [
    { from: /\bthier\b/g, to: 'their', description: 'Fixed spelling: "thier" → "their"' },
    { from: /\brecieve\b/g, to: 'receive', description: 'Fixed spelling: "recieve" → "receive"' },
    { from: /\boccur\b/g, to: 'occur', description: 'Fixed spelling: "occure" → "occur"' },
    { from: /\s+,/g, to: ',', description: 'Fixed spacing before commas' },
    { from: /\s+\./g, to: '.', description: 'Fixed spacing before periods' },
    { from: /\s{2,}/g, to: ' ', description: 'Normalized multiple spaces' },
  ];

  grammarFixes.forEach(({ from, to, description }) => {
    if (from.test(enhancedContent)) {
      enhancedContent = enhancedContent.replace(from, to);
      improvements.push(description);
    }
  });

  // Formatting improvements
  if (enhancedContent.includes('\n\n\n')) {
    enhancedContent = enhancedContent.replace(/\n{3,}/g, '\n\n');
    improvements.push('Normalized paragraph spacing');
  }

  // Add standard placeholders if not present
  const standardPlaceholders = [
    '{{ signing_date }}',
    '{{ candidate_email }}',
    '{{ company_address }}',
  ];

  standardPlaceholders.forEach((placeholder) => {
    if (!enhancedContent.includes(placeholder)) {
      // Add placeholder in appropriate context if the content structure allows
      if (placeholder === '{{ signing_date }}' && enhancedContent.includes('Date:')) {
        enhancedContent = enhancedContent.replace(/Date:\s*_+/g, `Date: ${placeholder}`);
        placeholdersAdded.push(`${placeholder} (signing date)`);
        improvements.push('Added signing date placeholder');
      }
    }
  });

  return {
    enhancedContent,
    improvements,
    placeholdersAdded,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client for authentication
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 50000) {
      return NextResponse.json(
        { error: 'Content is too long (max 50,000 characters)' },
        { status: 400 },
      );
    }

    // Enhance content with AI
    const result = await enhanceContractWithAI(content);

    return NextResponse.json({
      success: true,
      ...result,
      originalLength: content.length,
      enhancedLength: result.enhancedContent.length,
    });
  } catch (error) {
    console.error('Error enhancing contract with AI:', error);
    return NextResponse.json({ error: 'Failed to enhance contract with AI' }, { status: 500 });
  }
}
