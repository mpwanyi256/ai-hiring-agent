import { ai } from '@/lib/constants';
import { streamHandler } from '@/lib/utils/streamHandler';
import { placeholderService } from '@/lib/services/placeholderService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, additionalInstructions } = body;

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Content is required and must be a string' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if OpenAI API key is available
    if (!ai.openaiApiKey) {
      let mockEnhancedContent = content;

      // Apply basic enhancements based on additional instructions
      if (additionalInstructions) {
        if (additionalInstructions.toLowerCase().includes('formal')) {
          mockEnhancedContent = content.replace(/\b(you|your)\b/gi, 'the Service Provider');
        }
        if (additionalInstructions.toLowerCase().includes('simple')) {
          mockEnhancedContent = content.replace(/\b(hereinafter|aforementioned|whereas)\b/gi, '');
        }
      }

      const mockResponse = {
        enhancedContent: mockEnhancedContent,
        improvements: ['Grammar checked', 'Formatting improved'],
        placeholdersAdded: ['{{ candidate_name }}', '{{ job_title }}'],
        originalLength: content.length,
        enhancedLength: mockEnhancedContent.length,
      };

      return streamHandler.createMockStreamResponse(JSON.stringify(mockResponse));
    }

    // Get available placeholders from the database
    const placeholders = await placeholderService.getPlaceholders();
    const availablePlaceholders = placeholders.map((p) =>
      placeholderService.formatPlaceholder(p.key),
    );

    // Build prompt for contract enhancement
    const prompt = `Please analyze and enhance the following contract template. Focus on:

1. Grammar and spelling corrections
2. Better formatting and structure
3. Adding appropriate placeholders for dynamic content
4. Improving clarity and professionalism
5. Ensuring consistency in terminology

${additionalInstructions ? `Additional User Instructions: ${additionalInstructions}\n\n` : ''}

AVAILABLE PLACEHOLDERS TO USE:
${availablePlaceholders.join(', ')}

IMPORTANT PLACEHOLDER RULES:
- Use ONLY the placeholders listed above
- Replace specific names, dates, amounts, and details with appropriate placeholders
- Ensure placeholders are contextually appropriate
- Do not create new placeholder names

Contract content:
${content}

IMPORTANT: You MUST complete the entire contract. Do not cut off mid-sentence or mid-section. Ensure all sections are properly closed and the contract ends naturally.

Please return ONLY the enhanced contract content. Do not include any JSON formatting, explanations, or metadata. Just return the improved contract text with proper formatting and the appropriate placeholders from the list above.

Make the content more professional and clear while maintaining the original structure. Complete ALL sections fully.`;

    // Use OpenAI with streaming
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ai.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: ai.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert contract lawyer and HR professional. Analyze and enhance contract templates to make them more professional, clear, and suitable for use with dynamic placeholders.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 8000,
        temperature: 0.3,
        stream: true,
      }),
    });

    if (!openaiRes.ok) {
      throw new Error(`OpenAI API error: ${openaiRes.status}`);
    }

    return streamHandler.createStreamResponse(openaiRes);
  } catch (error) {
    console.error('Contract enhancement error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enhance contract',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
