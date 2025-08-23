import { ai } from '@/lib/constants';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      department,
      employmentType,
      workplaceType,
      jobType,
      experienceLevel,
      skills,
      traits,
    } = body;

    // Check if OpenAI API key is available
    if (!ai.openaiApiKey) {
      // Return a mock response when OpenAI is not configured
      const mockHtml = `
        <h2>About the Role</h2>
        <p>We are seeking a talented ${title} to join our ${department} team. This is a ${employmentType} position with ${workplaceType} work arrangement.</p>
        
        <h2>Key Responsibilities</h2>
        <ul>
          <li>Collaborate with cross-functional teams to deliver high-quality solutions</li>
          <li>Contribute to the development and implementation of best practices</li>
          <li>Participate in team meetings and provide valuable insights</li>
          <li>Maintain documentation and ensure code quality standards</li>
        </ul>
        
        <h2>Qualifications</h2>
        <ul>
          <li>Relevant experience in the field</li>
          <li>Strong problem-solving and analytical skills</li>
          <li>Excellent communication and teamwork abilities</li>
          <li>Ability to work in a fast-paced environment</li>
        </ul>
        
        <p><em>This is a placeholder job description. Please configure your OpenAI API key for AI-generated descriptions.</em></p>
      `;

      // Create a streaming response that sends the mock data
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: mockHtml, done: true })}\n\n`),
          );
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    }

    // Build a comprehensive prompt for OpenAI
    let prompt = `Write a professional, inclusive, and engaging job description for the following role. Include a summary, responsibilities, and qualifications. Use clear HTML formatting (with <p>, <ul>, <li>, <strong> tags, etc). Focus on the content without unnecessary HTML wrappers.

Job Details:
- Title: ${title}
- Department: ${department}
- Employment Type: ${employmentType}
- Workplace Type: ${workplaceType}
- Job Type: ${jobType}`;

    // Add optional fields if provided
    if (experienceLevel) {
      prompt += `\n- Experience Level: ${experienceLevel}`;
    }
    if (skills && skills.length > 0) {
      prompt += `\n- Required Skills: ${skills.join(', ')}`;
    }
    if (traits && traits.length > 0) {
      prompt += `\n- Desired Traits: ${traits.join(', ')}`;
    }

    prompt += `\n\nPlease create a comprehensive job description that includes:
1. An engaging overview of the role and its impact
2. Key responsibilities and duties
3. Required qualifications and experience
4. Preferred skills and traits
5. Information about the work environment and culture

Write in a professional yet approachable tone that would attract qualified candidates.`;

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
              'You are an expert HR professional who writes compelling job descriptions. Focus on creating engaging, inclusive content that attracts qualified candidates. Use clear HTML formatting but avoid unnecessary wrapper elements.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!openaiRes.ok) {
      throw new Error(`OpenAI API error: ${openaiRes.status}`);
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = openaiRes.body?.getReader();
          if (!reader) {
            throw new Error('No response body reader');
          }

          let buffer = '';
          let accumulatedContent = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine === '' || trimmedLine === 'data: [DONE]') continue;

              if (trimmedLine.startsWith('data: ')) {
                try {
                  const jsonStr = trimmedLine.slice(6);
                  const data = JSON.parse(jsonStr);
                  const content = data.choices?.[0]?.delta?.content || '';

                  if (content) {
                    accumulatedContent += content;
                    // Send incremental update
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ content: accumulatedContent, done: false })}\n\n`,
                      ),
                    );
                  }
                } catch (e) {
                  console.error('Error parsing OpenAI response:', e);
                }
              }
            }
          }

          // Send final message
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ content: accumulatedContent, done: true })}\n\n`,
            ),
          );
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Job description generation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate job description',
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
