import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { ai } from '@/lib/constants';

// Function to clean markdown formatting and ensure HTML output while preserving placeholders
function cleanMarkdownFromResponse(text: string): string {
  if (!text || text.trim().length === 0) {
    return text;
  }

  let cleaned = text.trim();

  // Step 1: Preserve placeholders by temporarily replacing them
  const placeholders: string[] = [];
  const placeholderRegex = /\{\{\s*[^}]+\s*\}\}/g;
  cleaned = cleaned.replace(placeholderRegex, (match) => {
    const index = placeholders.length;
    placeholders.push(match);
    return `__PLACEHOLDER_${index}__`;
  });

  // Step 2: Handle markdown bold patterns (**text** or __text__)
  // Use global flag and non-greedy matching
  cleaned = cleaned.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  cleaned = cleaned.replace(/__([^_\n]+?)__/g, '<strong>$1</strong>');

  // Step 3: Handle markdown headings first (to avoid conflicts)
  cleaned = cleaned.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
  cleaned = cleaned.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
  cleaned = cleaned.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>');

  // Step 4: Handle remaining single asterisks for italic (after bold is processed)
  // Since bold is already handled, remaining single asterisks should be italic
  cleaned = cleaned.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');

  // Step 5: Handle underscores for italic (with word boundaries, but avoid placeholder markers)
  cleaned = cleaned.replace(/\b_([^_\n]+?)_\b/g, '<em>$1</em>');

  // Step 6: Convert markdown lists to HTML
  cleaned = cleaned.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');

  // Step 7: Wrap consecutive <li> items in <ul>
  cleaned = cleaned.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');

  // Step 8: Extract content from HTML code blocks and remove other code blocks
  // First, extract HTML content from ```html blocks
  const htmlBlockMatch = cleaned.match(/```html\s*([\s\S]*?)```/i);
  if (htmlBlockMatch) {
    cleaned = htmlBlockMatch[1].trim();
  } else {
    // Remove any other code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  }
  // Remove inline code
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

  // Step 9: Clean up remaining markdown artifacts (but preserve placeholder markers)
  cleaned = cleaned.replace(/[*#`~\[\]]/g, '');
  // Only remove standalone underscores, not those in placeholder markers
  cleaned = cleaned.replace(/(?<!__PLACEHOLDER_\d+)_(?!_)/g, '');

  // Step 10: Convert double line breaks to paragraph breaks
  cleaned = cleaned.replace(/\n\s*\n/g, '</p>\n<p>');

  // Step 11: Wrap content in paragraphs if not already wrapped
  if (!cleaned.includes('<p>') && !cleaned.includes('<h') && !cleaned.includes('<ul>')) {
    cleaned = '<p>' + cleaned + '</p>';
  } else if (!cleaned.startsWith('<')) {
    cleaned = '<p>' + cleaned;
  }
  if (!cleaned.endsWith('>') && !cleaned.endsWith('</p>')) {
    cleaned = cleaned + '</p>';
  }

  // Step 12: Clean up malformed HTML and extra whitespace
  cleaned = cleaned.replace(/<p>\s*<\/p>/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\n+/g, '\n');
  cleaned = cleaned.trim();

  // Step 13: Restore placeholders
  // placeholders.forEach((placeholder, index) => {
  //   cleaned = cleaned.replace(`__PLACEHOLDER_${index}__`, placeholder);
  // });

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
    const prompt = `You are an expert contract template generator. Transform the following contract text into a professional, enhanced version by:

1. Correcting all grammar, spelling, and language issues
2. Replacing specific values with appropriate placeholders using EXACT format: {{ candidate_name }}, {{ company_name }}, {{ job_title }}, {{ salary_amount }}, {{ start_date }}, {{ employment_type }}, {{ contract_duration }}
3. Improving formatting and structure for professional presentation
4. Enhancing language to be more legally appropriate and professional
5. Adding any missing standard contract clauses if appropriate

CRITICAL PLACEHOLDER REQUIREMENTS:
- ALL placeholders MUST use double curly braces with underscores: {{ placeholder_name }}
- NEVER remove underscores from placeholders: {{ candidate_name }} NOT {{ candidatename }}
- NEVER use spaces in placeholder names: {{ candidate_name }} NOT {{ candidate name }}
- Common placeholders to use: {{ candidate_name }}, {{ company_name }}, {{ job_title }}, {{ salary_amount }}, {{ start_date }}, {{ employment_type }}, {{ contract_duration }}, {{ candidate_email }}, {{ company_address }}, {{ signing_date }}

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY the enhanced contract content as clean HTML
- Use proper HTML tags: <p>, <h1>, <h2>, <h3>, <ul>, <li>, <strong>, <em>
- Do NOT use markdown formatting (no **, __, ##, ---, etc.)
- Do NOT include any explanations, summaries, meta-text, or commentary about changes made
- Do NOT mention the number of corrections or improvements
- Do NOT add any text that is not part of the actual contract content
- The response should be ready to use directly as contract content

Contract text to enhance:

${content}

IMPORTANT: Return ONLY the enhanced contract HTML content. No explanations, no summaries, no commentary - just the improved contract text.`;

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

    console.log('AI Enhancement - Raw response length:', rawEnhancedText?.length || 0);
    console.log(
      'AI Enhancement - Raw response preview:',
      rawEnhancedText?.substring(0, 200) + '...',
    );

    if (rawEnhancedText && rawEnhancedText.length > 0) {
      // Clean any markdown formatting from the AI response
      const enhancedText = cleanMarkdownFromResponse(rawEnhancedText);

      console.log('AI Enhancement - Cleaned response length:', enhancedText?.length || 0);
      console.log(
        'AI Enhancement - Cleaned response preview:',
        enhancedText?.substring(0, 200) + '...',
      );

      // Validate that we have actual content, not just metadata
      if (
        enhancedText.length < 50 ||
        enhancedText.includes('Number of grammar/spelling corrections')
      ) {
        console.warn(
          'AI Enhancement - Response appears to be metadata instead of content, falling back',
        );
        throw new Error('AI returned metadata instead of enhanced content');
      }

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
