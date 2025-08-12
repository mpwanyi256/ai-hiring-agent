import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { ai } from '@/lib/constants';

// Function to get dynamic placeholders from database
async function getDynamicPlaceholders(): Promise<
  Array<{ key: string; label: string; example: string }>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_contract_placeholders_by_category');

    if (error) {
      console.error('Error fetching placeholders:', error);
      return getFallbackPlaceholders();
    }

    return data || getFallbackPlaceholders();
  } catch (error) {
    console.error('Error getting dynamic placeholders:', error);
    return getFallbackPlaceholders();
  }
}

// Fallback placeholders if database is unavailable
function getFallbackPlaceholders() {
  return [
    { key: 'candidate_name', label: 'Candidate Name', example: 'John Smith' },
    { key: 'candidate_email', label: 'Candidate Email', example: 'john.smith@email.com' },
    { key: 'company_name', label: 'Company Name', example: 'Acme Corporation' },
    {
      key: 'company_address',
      label: 'Company Address',
      example: '123 Business St, City, State 12345',
    },
    { key: 'job_title', label: 'Job Title', example: 'Software Engineer' },
    { key: 'salary_amount', label: 'Salary Amount', example: '75000' },
    { key: 'salary_currency', label: 'Salary Currency', example: 'USD' },
    { key: 'start_date', label: 'Start Date', example: 'January 15, 2024' },
    { key: 'end_date', label: 'End Date', example: 'January 15, 2025' },
    { key: 'signing_date', label: 'Signing Date', example: 'December 1, 2023' },
    { key: 'employment_type', label: 'Employment Type', example: 'Full-time' },
    { key: 'contract_duration', label: 'Contract Duration', example: '12 months' },
  ];
}

// Function to clean markdown formatting and ensure HTML output while preserving placeholders
function cleanMarkdownFromResponse(text: string): string {
  if (!text || text.trim().length === 0) {
    return text;
  }

  const placeholderRegex = /\{\{\s*[^}]+\s*\}\}/g;

  // Helper to process markdown → HTML for non-placeholder segments only
  const processSegment = (input: string): string => {
    if (!input) return '';
    let cleaned = input;

    // Handle markdown bold patterns (**text** or __text__)
    cleaned = cleaned.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
    cleaned = cleaned.replace(/__([^_\n]+?)__/g, '<strong>$1</strong>');

    // Headings
    cleaned = cleaned.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
    cleaned = cleaned.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
    cleaned = cleaned.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>');

    // Italic after bold
    cleaned = cleaned.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');

    // Underscore italic (avoid greedy matching)
    cleaned = cleaned.replace(/\b_([^_\n]+?)_\b/g, '<em>$1</em>');

    // Lists
    cleaned = cleaned.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');
    cleaned = cleaned.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');

    // Remove code blocks and inline code
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

    // Clean remaining markdown artifacts
    cleaned = cleaned.replace(/[*#`~\[\]]/g, '');

    // Paragraph handling
    cleaned = cleaned.replace(/\n\s*\n/g, '</p>\n<p>');
    if (!cleaned.includes('<p>') && !cleaned.includes('<h') && !cleaned.includes('<ul>')) {
      cleaned = '<p>' + cleaned + '</p>';
    } else if (!cleaned.startsWith('<')) {
      cleaned = '<p>' + cleaned;
    }
    if (!cleaned.endsWith('>') && !cleaned.endsWith('</p>')) {
      cleaned = cleaned + '</p>';
    }

    // Cleanup
    cleaned = cleaned.replace(/<p>\s*<\/p>/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/\n+/g, '\n');

    return cleaned.trim();
  };

  // Split the text into segments, process non-placeholder parts, and rejoin
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = placeholderRegex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before) result += processSegment(before);
    result += match[0]; // keep placeholder intact
    lastIndex = match.index + match[0].length;
  }

  const tail = text.slice(lastIndex);
  if (tail) result += processSegment(tail);

  return result;
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
    // Get dynamic placeholders from database
    const availablePlaceholders = await getDynamicPlaceholders();

    // Build placeholder instructions dynamically
    const placeholderInstructions = availablePlaceholders
      .map((p) => `- ${p.label} → {{ ${p.key} }}`)
      .join('\n');

    const commonPlaceholders = availablePlaceholders.map((p) => `{{ ${p.key} }}`).join(', ');

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: ai.openaiApiKey,
    });

    // Create a comprehensive prompt for contract enhancement with HTML output
    const prompt = `You are an expert contract template generator. Transform the following contract text into a professional, enhanced version by:

1. Correcting all grammar, spelling, and language issues
2. Replacing specific values with appropriate placeholders using EXACT format from the list below:

${placeholderInstructions}

3. Improving formatting and structure for professional presentation
4. Enhancing language to be more legally appropriate and professional
5. Adding any missing standard contract clauses if appropriate

CRITICAL PLACEHOLDER REQUIREMENTS:
- ALL placeholders MUST use double curly braces with underscores: {{ placeholder_name }}
- NEVER remove underscores from placeholders: {{ candidate_name }} NOT {{ candidatename }}
- NEVER use spaces in placeholder names: {{ candidate_name }} NOT {{ candidate name }}
- Use ONLY these placeholders: ${commonPlaceholders}

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
      rawEnhancedText?.substring(0, 1000) + '...',
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
  return await basicEnhancementWithDynamicPlaceholders(content);
}

// Fallback function for basic enhancement using dynamic placeholders
async function basicEnhancementWithDynamicPlaceholders(content: string): Promise<{
  enhancedContent: string;
  improvements: string[];
  placeholdersAdded: string[];
}> {
  const improvements: string[] = [];
  const placeholdersAdded: string[] = [];
  let enhancedContent = content;

  try {
    // Get dynamic placeholders for fallback enhancement
    const availablePlaceholders = await getDynamicPlaceholders();

    // Create dynamic replacements based on available placeholders
    const replacements = availablePlaceholders
      .map((placeholder) => {
        switch (placeholder.key) {
          case 'candidate_name':
            return {
              pattern:
                /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b(?=.*(?:Employee|Contractor|Worker))/g,
              placeholder: `{{ ${placeholder.key} }}`,
              description: placeholder.label,
            };
          case 'company_name':
            return {
              pattern:
                /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Inc\.|LLC|Corporation|Corp\.|Company)\b/g,
              placeholder: `{{ ${placeholder.key} }}`,
              description: placeholder.label,
            };
          case 'job_title':
            return {
              pattern:
                /\b(?:Software Engineer|Developer|Manager|Director|Analyst|Consultant|Designer|Specialist)\b/gi,
              placeholder: `{{ ${placeholder.key} }}`,
              description: placeholder.label,
            };
          case 'salary_amount':
            return {
              pattern: /\$[\d,]+(?:\.\d{2})?\s*(?:per\s+year|annually|yearly)/gi,
              placeholder: `{{ ${placeholder.key} }}`,
              description: placeholder.label,
            };
          case 'start_date':
            return {
              pattern:
                /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g,
              placeholder: `{{ ${placeholder.key} }}`,
              description: placeholder.label,
            };
          case 'employment_type':
            return {
              pattern: /\b(?:full-time|part-time|contract|temporary|permanent)\b/gi,
              placeholder: `{{ ${placeholder.key} }}`,
              description: placeholder.label,
            };
          case 'contract_duration':
            return {
              pattern: /\b(?:12|24|36)\s+months?\b/g,
              placeholder: `{{ ${placeholder.key} }}`,
              description: placeholder.label,
            };
          default:
            return null;
        }
      })
      .filter(
        (item): item is { pattern: RegExp; placeholder: string; description: string } =>
          item !== null,
      );

    // Apply dynamic replacements
    replacements.forEach(({ pattern, placeholder, description }) => {
      const matches = enhancedContent.match(pattern);
      if (matches && matches.length > 0) {
        enhancedContent = enhancedContent.replace(pattern, placeholder);
        placeholdersAdded.push(placeholder.replace(/[{}]/g, '').trim());
        improvements.push(
          `Replaced ${matches.length} instance(s) of ${description} with placeholder`,
        );
      }
    });
  } catch (error) {
    console.error('Error in basic enhancement with dynamic placeholders:', error);
  }

  // Basic grammar and spelling improvements
  const grammarFixes = [
    { from: /\bthier\b/g, to: 'their', description: 'Fixed spelling: "thier" → "their"' },
    { from: /\brecieve\b/g, to: 'receive', description: 'Fixed spelling: "recieve" → "receive"' },
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
