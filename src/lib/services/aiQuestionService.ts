import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ai } from '@/lib/constants';
import { JobQuestion } from '@/types/interview';

interface AIQuestionParams {
  jobTitle: string;
  jobDescription?: string;
  skills?: string[];
  experienceLevel?: string;
  traits?: string[];
  customFields?: Record<string, any>;
  questionCount?: number;
  interviewFormat?: 'text' | 'video';
}

interface AIGeneratedQuestion {
  questionText: string;
  questionType: 'general' | 'technical' | 'behavioral' | 'experience' | 'custom';
  category: string;
  expectedDuration: number;
  reasoning: string;
}

class AIQuestionService {
  private llm: ChatOpenAI;
  private outputParser: StringOutputParser;

  constructor() {
    if (!ai.openaiApiKey) {
      throw new Error('OpenAI API key is required. Please set OPENAI_API_KEY in your environment variables.');
    }

    this.llm = new ChatOpenAI({
      openAIApiKey: ai.openaiApiKey,
      modelName: ai.model,
      temperature: ai.temperature,
      maxTokens: ai.maxTokens,
    });

    this.outputParser = new StringOutputParser();
  }

  async generateQuestions(params: AIQuestionParams): Promise<Omit<JobQuestion, 'id' | 'jobId' | 'createdAt' | 'updatedAt'>[]> {
    try {
      const systemPrompt = this.createSystemPrompt();
      const humanPrompt = this.createHumanPrompt(params);

      const prompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(systemPrompt),
        HumanMessagePromptTemplate.fromTemplate(humanPrompt),
      ]);

      const chain = prompt.pipe(this.llm).pipe(this.outputParser);
      
      const response = await chain.invoke({
        jobTitle: params.jobTitle,
        jobDescription: params.jobDescription || 'No specific job description provided.',
        skills: params.skills?.join(', ') || 'No specific skills listed',
        experienceLevel: params.experienceLevel || 'Not specified',
        traits: params.traits?.join(', ') || 'No specific traits listed',
        customRequirements: this.formatCustomFields(params.customFields),
        questionCount: params.questionCount || 8,
        interviewFormat: params.interviewFormat || 'text'
      });

      return this.parseAIResponse(response);
    } catch (error) {
      console.error('Error generating AI questions:', error);
      // Fallback to basic questions if AI fails
      return this.getFallbackQuestions(params);
    }
  }

  private createSystemPrompt(): string {
    return `You are an expert HR interviewer and question designer. Your task is to generate high-quality, relevant interview questions for job positions.

GUIDELINES:
1. Create questions that are specific to the role and requirements
2. Mix different question types: technical, behavioral, experience-based, and general
3. Ensure questions are inclusive and free from bias
4. Make questions conversational and engaging
5. Consider the experience level when crafting difficulty
6. For behavioral questions, use the STAR method framework
7. Include estimated duration in seconds (60-240 range)

QUESTION TYPES:
- general: Role understanding, motivation, culture fit
- technical: Skills, tools, problem-solving in the domain
- behavioral: Past experiences, soft skills, scenarios
- experience: Career progression, specific achievements
- custom: Based on unique job requirements

OUTPUT FORMAT:
Return ONLY a valid JSON array with this exact structure:
[
  {
    "questionText": "Your question here?",
    "questionType": "behavioral",
    "category": "Problem Solving",
    "expectedDuration": 150,
    "reasoning": "Why this question is important for this role"
  }
]

IMPORTANT: 
- Return ONLY the JSON array, no additional text
- Each question must be unique and relevant
- Expected duration should be realistic (60-240 seconds)
- Categories should be descriptive and relevant
- Always include 1 opening question and 1 closing question`;
  }

  private createHumanPrompt(params: AIQuestionParams): string {
    return `Generate {questionCount} interview questions for the following position:

JOB TITLE: {jobTitle}

JOB DESCRIPTION: {jobDescription}

REQUIRED SKILLS: {skills}

EXPERIENCE LEVEL: {experienceLevel}

DESIRED TRAITS: {traits}

CUSTOM REQUIREMENTS: {customRequirements}

INTERVIEW FORMAT: {interviewFormat}

Please generate exactly {questionCount} questions that are:
1. Relevant to this specific role and requirements
2. Appropriate for the {experienceLevel} experience level
3. Designed for {interviewFormat} interview format
4. Include a mix of question types
5. Progressive in difficulty
6. Designed to assess both technical competence and cultural fit

Return the questions as a JSON array following the specified format.`;
  }

  private formatCustomFields(customFields?: Record<string, any>): string {
    if (!customFields || Object.keys(customFields).length === 0) {
      return 'No custom requirements specified.';
    }

    return Object.entries(customFields)
      .map(([key, value]) => `${key}: ${typeof value === 'object' ? value.value || JSON.stringify(value) : value}`)
      .join(', ');
  }

  private parseAIResponse(response: string): Omit<JobQuestion, 'id' | 'jobId' | 'createdAt' | 'updatedAt'>[] {
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const parsedQuestions: AIGeneratedQuestion[] = JSON.parse(jsonMatch[0]);
      
      return parsedQuestions.map((q, index) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        category: q.category,
        expectedDuration: Math.max(60, Math.min(240, q.expectedDuration)), // Clamp duration
        isRequired: index < 5, // First 5 questions are required
        orderIndex: index + 1,
        isAiGenerated: true,
        metadata: {
          reasoning: q.reasoning,
          aiGenerated: true,
          generatedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI-generated questions');
    }
  }

  private getFallbackQuestions(params: AIQuestionParams): Omit<JobQuestion, 'id' | 'jobId' | 'createdAt' | 'updatedAt'>[] {
    // Fallback questions if AI fails
    const fallbackQuestions: Omit<JobQuestion, 'id' | 'jobId' | 'createdAt' | 'updatedAt'>[] = [
      {
        questionText: `Tell me about yourself and what interests you about this ${params.jobTitle} position.`,
        questionType: 'general',
        category: 'Introduction',
        expectedDuration: 120,
        isRequired: true,
        orderIndex: 1,
        isAiGenerated: false,
        metadata: { fallback: true, reason: 'AI generation failed' } as Record<string, any>
      },
      {
        questionText: 'What motivated you to apply for this role?',
        questionType: 'general',
        category: 'Motivation',
        expectedDuration: 90,
        isRequired: true,
        orderIndex: 2,
        isAiGenerated: false,
        metadata: { fallback: true, reason: 'AI generation failed' } as Record<string, any>
      },
      {
        questionText: 'Describe a challenging project you\'ve worked on and how you handled it.',
        questionType: 'behavioral',
        category: 'Problem Solving',
        expectedDuration: 180,
        isRequired: true,
        orderIndex: 3,
        isAiGenerated: false,
        metadata: { fallback: true, reason: 'AI generation failed' } as Record<string, any>
      }
    ];

    // Add skill-specific questions if available
    if (params.skills && params.skills.length > 0) {
      params.skills.slice(0, 2).forEach((skill, index) => {
        fallbackQuestions.push({
          questionText: `How would you rate your experience with ${skill}? Can you provide an example?`,
          questionType: 'general',
          category: 'Skills Assessment',
          expectedDuration: 150,
          isRequired: true,
          orderIndex: fallbackQuestions.length + 1,
          isAiGenerated: false,
          metadata: { fallback: true, reason: 'AI generation failed', skillFocus: skill } as Record<string, any>
        });
      });
    }

    // Add closing question
    fallbackQuestions.push({
      questionText: 'Do you have any questions about the role or the company?',
      questionType: 'general',
      category: 'Closing',
      expectedDuration: 90,
      isRequired: false,
      orderIndex: fallbackQuestions.length + 1,
      isAiGenerated: false,
      metadata: { fallback: true, reason: 'AI generation failed' } as Record<string, any>
    });

    return fallbackQuestions.slice(0, params.questionCount || 8);
  }

  // Enhanced question generation with context awareness
  async generateContextualQuestions(params: AIQuestionParams & {
    companyInfo?: string;
    teamSize?: number;
    remote?: boolean;
    industry?: string;
  }): Promise<Omit<JobQuestion, 'id' | 'jobId' | 'createdAt' | 'updatedAt'>[]> {
    const enhancedParams = {
      ...params,
      customFields: {
        ...params.customFields,
        companyContext: params.companyInfo,
        teamSize: params.teamSize,
        workArrangement: params.remote ? 'Remote' : 'On-site',
        industry: params.industry
      }
    };

    return this.generateQuestions(enhancedParams);
  }

  // Validate API key and connection
  async validateConnection(): Promise<boolean> {
    try {
      const testPrompt = ChatPromptTemplate.fromTemplate('Respond with "OK" if you can see this message.');
      const chain = testPrompt.pipe(this.llm).pipe(this.outputParser);
      const response = await chain.invoke({});
      return response.toLowerCase().includes('ok');
    } catch (error) {
      console.error('OpenAI connection validation failed:', error);
      return false;
    }
  }
}

export const aiQuestionService = new AIQuestionService(); 