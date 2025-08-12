import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { documentParsingService } from '@/lib/services/documentParsingService';
import { ai } from '@/lib/constants';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: ai.openaiApiKey,
});

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

// AI enhancement function using OpenAI
async function enhanceWithAI(content: string): Promise<string> {
  if (!ai.openaiApiKey) {
    console.warn('OpenAI API key not configured, skipping AI enhancement');
    return content;
  }

  try {
    const prompt = `You are an expert contract template creator. Your task is to analyze the following contract text, correct grammar/spelling, and replace specific values with appropriate placeholders that can be dynamically filled later.

Replace the following types of content with these exact placeholders:
- Names of people (employees, candidates) → {{ candidate_name }}
- Company names → {{ company_name }}
- Job titles/positions → {{ job_title }}
- Salary amounts → {{ salary_amount }}
- Currency → {{ salary_currency }}
- Start dates → {{ start_date }}
- End dates → {{ end_date }}
- Contract duration → {{ contract_duration }}
- Employment type → {{ employment_type }}
- Signing dates → {{ signing_date }}
- Email addresses → {{ candidate_email }}

IMPORTANT: Only replace actual values, not the descriptive text. For example, replace "John Smith" with "{{ candidate_name }}" but keep "Employee Name:" as is.

IMPORTANT FORMATTING REQUIREMENTS:
- Return the contract as clean HTML (use <p>, <h1>, <h2>, <ul>, <li>, <strong>, <em> tags as appropriate)
- Do NOT use markdown formatting (no **, __, ##, etc.)
- Do NOT include any AI commentary or explanations
- Preserve paragraph structure and use proper HTML line breaks
- Use <strong> for emphasis instead of **bold**
- Use <em> for italics instead of *italic*
- Correct any grammar and spelling errors you find

Contract text to enhance:

${content}

Return only the enhanced contract text as clean HTML with placeholders:`;

    const response = await openai.chat.completions.create({
      model: ai.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: ai.maxTokens * 2, // Allow more tokens for contract content
      temperature: ai.temperature * 0.5, // Lower temperature for more consistent placeholder replacement
    });

    const rawResponse = response.choices[0]?.message?.content?.trim();
    if (rawResponse) {
      // Clean any markdown formatting from the AI response
      return cleanMarkdownFromResponse(rawResponse);
    }
    return content;
  } catch (error) {
    console.error('Error enhancing content with AI:', error);
    // Fallback to basic placeholder replacement
    return basicPlaceholderReplacement(content);
  }
}

// Content validation function
function validateAndCleanContent(content: string): {
  isValid: boolean;
  cleanedContent: string;
  error?: string;
} {
  if (!content || typeof content !== 'string') {
    return { isValid: false, cleanedContent: '', error: 'No content extracted' };
  }

  // Check for garbled/malformed content (too many special characters)
  const specialCharRatio =
    (content.match(/[^a-zA-Z0-9\s\.,;:!?\-()\[\]{}"']/g) || []).length / content.length;
  if (specialCharRatio > 0.3) {
    return {
      isValid: false,
      cleanedContent: '',
      error: 'Content appears to be malformed or corrupted',
    };
  }

  // Check if content is too short to be meaningful
  const meaningfulWords = content.match(/\b[a-zA-Z]{3,}\b/g) || [];
  if (meaningfulWords.length < 10) {
    return {
      isValid: false,
      cleanedContent: '',
      error: 'Extracted content is too short or contains insufficient text',
    };
  }

  // Clean up the content
  const cleanedContent = content
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .trim();

  return { isValid: true, cleanedContent };
}

// Fallback function for basic placeholder replacement
function basicPlaceholderReplacement(content: string): string {
  let enhancedContent = content;

  // Basic regex patterns for common contract elements
  const replacements = [
    {
      pattern:
        /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b(?=.*(?:Employee|Contractor|Worker))/g,
      placeholder: '{{ candidate_name }}',
    },
    {
      pattern: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Inc\.|LLC|Corporation|Corp\.|Company)\b/g,
      placeholder: '{{ company_name }}',
    },
    { pattern: /\$[\d,]+(?:\.\d{2})?/g, placeholder: '{{ salary_amount }}' },
    {
      pattern:
        /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g,
      placeholder: '{{ start_date }}',
    },
    {
      pattern: /\b(?:full-time|part-time|contract|temporary|permanent)\b/gi,
      placeholder: '{{ employment_type }}',
    },
  ];

  replacements.forEach(({ pattern, placeholder }) => {
    enhancedContent = enhancedContent.replace(pattern, placeholder);
  });

  return enhancedContent;
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const useAiEnhancement = formData.get('useAiEnhancement') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Extract text from PDF
    let extractedContent = '';
    try {
      const parsedDocument = await documentParsingService.parseDocument(file);
      extractedContent = parsedDocument.text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      return NextResponse.json(
        { error: 'Failed to parse PDF file. Please ensure the file is a valid PDF document.' },
        { status: 400 },
      );
    }

    // Validate and clean the extracted content
    const validation = validateAndCleanContent(extractedContent);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid content extracted from PDF' },
        { status: 400 },
      );
    }

    let finalContent = validation.cleanedContent;
    let enhanced = false;

    // Only enhance with AI if explicitly requested by user
    if (useAiEnhancement && useAiEnhancement === true) {
      try {
        const aiEnhancedContent = await enhanceWithAI(finalContent);
        // Validate AI-enhanced content as well
        const aiValidation = validateAndCleanContent(aiEnhancedContent);
        if (aiValidation.isValid) {
          finalContent = aiValidation.cleanedContent;
          enhanced = true;
        } else {
          console.warn('AI enhancement produced invalid content, using original');
          // Keep original content if AI enhancement fails validation
        }
      } catch (error) {
        console.error('AI enhancement failed, using original content:', error);
        // Continue with original content if AI fails
      }
    }

    return NextResponse.json({
      content: finalContent,
      enhanced,
      filename: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    return NextResponse.json(
      {
        error:
          'Failed to extract content from PDF. Please make sure the file is a valid PDF document.',
      },
      { status: 500 },
    );
  }
}
