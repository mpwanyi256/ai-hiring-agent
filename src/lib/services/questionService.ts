import { createClient } from '@/lib/supabase/server';
import { JobData } from './jobsService';
import {
  JobQuestion,
  JobQuestionDetailed,
  QuestionGenerationRequest,
  QuestionGenerationResponse
} from '@/types/interview';

class QuestionService {
  // Generate AI questions based on job requirements
  async generateQuestionsForJob(params: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
    const {
      jobTitle,
      jobDescription,
      skills = [],
      experienceLevel,
      traits = [],
      customFields = {},
      questionCount = 8,
      includeCustom = true
    } = params;

    const questions: Omit<JobQuestion, 'id' | 'jobId' | 'createdAt' | 'updatedAt'>[] = [];
    let orderIndex = 1;

    // 1. Introduction question (always included)
    questions.push({
      questionText: `Tell me about yourself and what interests you about this ${jobTitle} position.`,
      questionType: 'general',
      category: 'Introduction',
      expectedDuration: 120,
      isRequired: true,
      orderIndex: orderIndex++,
      isAiGenerated: true,
      metadata: { generationType: 'introduction' }
    });

    // 2. Experience level specific questions
    if (experienceLevel) {
      const experienceQuestions = this.getExperienceBasedQuestions(experienceLevel, jobTitle);
      experienceQuestions.forEach(q => {
        questions.push({
          ...q,
          orderIndex: orderIndex++,
          isAiGenerated: true
        });
      });
    }

    // 3. Skills-based questions (top 3 skills)
    if (skills.length > 0) {
      const selectedSkills = skills.slice(0, 3);
      selectedSkills.forEach((skill, index) => {
        questions.push({
          questionText: `How would you rate your experience with ${skill}? Can you provide a specific example of how you've used it in a professional context?`,
          questionType: 'technical',
          category: 'Skills Assessment',
          expectedDuration: 150,
          isRequired: true,
          orderIndex: orderIndex++,
          isAiGenerated: true,
          metadata: { skill, skillIndex: index }
        });
      });
    }

    // 4. Traits-based behavioral questions (top 2 traits)
    if (traits.length > 0) {
      const selectedTraits = traits.slice(0, 2);
      selectedTraits.forEach((trait, index) => {
        const traitQuestion = this.getTraitQuestion(trait);
        questions.push({
          questionText: traitQuestion,
          questionType: 'behavioral',
          category: 'Behavioral Assessment',
          expectedDuration: 180,
          isRequired: true,
          orderIndex: orderIndex++,
          isAiGenerated: true,
          metadata: { trait, traitIndex: index }
        });
      });
    }

    // 5. Job-specific questions based on description
    if (jobDescription) {
      const jobSpecificQuestions = this.getJobSpecificQuestions(jobDescription, jobTitle);
      jobSpecificQuestions.forEach(q => {
        questions.push({
          ...q,
          orderIndex: orderIndex++,
          isAiGenerated: true
        });
      });
    }

    // 6. Custom field questions
    if (includeCustom && Object.keys(customFields).length > 0) {
      const customQuestions = this.getCustomFieldQuestions(customFields);
      customQuestions.forEach(q => {
        questions.push({
          ...q,
          orderIndex: orderIndex++,
          isAiGenerated: true
        });
      });
    }

    // 7. Closing question
    questions.push({
      questionText: 'Do you have any questions about the role, the team, or the company?',
      questionType: 'general',
      category: 'Closing',
      expectedDuration: 90,
      isRequired: false,
      orderIndex: orderIndex++,
      isAiGenerated: true,
      metadata: { generationType: 'closing' }
    });

    // Limit to requested count
    const finalQuestions = questions.slice(0, questionCount);
    
    // Calculate total estimated duration
    const estimatedDuration = finalQuestions.reduce((total, q) => total + q.expectedDuration, 0);

    return {
      questions: finalQuestions,
      totalGenerated: finalQuestions.length,
      estimatedDuration
    };
  }

  private getExperienceBasedQuestions(experienceLevel: string, jobTitle: string): Array<Omit<JobQuestion, 'id' | 'jobId' | 'createdAt' | 'updatedAt' | 'orderIndex' | 'isAiGenerated'>> {
    const questionMap: Record<string, Array<Omit<JobQuestion, 'id' | 'jobId' | 'createdAt' | 'updatedAt' | 'orderIndex' | 'isAiGenerated'>>> = {
      'entry': [
        {
          questionText: `As someone new to the field, what projects or coursework have you completed that relate to this ${jobTitle} position?`,
          questionType: 'experience',
          category: 'Experience Assessment',
          expectedDuration: 120,
          isRequired: true,
          metadata: { experienceLevel: 'entry', type: 'projects' }
        },
        {
          questionText: 'How do you approach learning new technologies or skills when you encounter them in your work?',
          questionType: 'behavioral',
          category: 'Learning Approach',
          expectedDuration: 90,
          isRequired: true,
          metadata: { experienceLevel: 'entry', type: 'learning' }
        }
      ],
      'mid': [
        {
          questionText: 'Describe a challenging project you\'ve worked on recently and how you overcame the obstacles you encountered.',
          questionType: 'experience',
          category: 'Problem Solving',
          expectedDuration: 180,
          isRequired: true,
          metadata: { experienceLevel: 'mid', type: 'challenges' }
        },
        {
          questionText: 'How do you handle competing priorities and tight deadlines in your current role?',
          questionType: 'behavioral',
          category: 'Time Management',
          expectedDuration: 120,
          isRequired: true,
          metadata: { experienceLevel: 'mid', type: 'priorities' }
        }
      ],
      'senior': [
        {
          questionText: 'Tell me about a time when you led a team or mentored junior colleagues. What was your approach?',
          questionType: 'behavioral',
          category: 'Leadership',
          expectedDuration: 180,
          isRequired: true,
          metadata: { experienceLevel: 'senior', type: 'leadership' }
        },
        {
          questionText: 'How do you approach system design and architecture decisions? Walk me through your thought process.',
          questionType: 'technical',
          category: 'Architecture',
          expectedDuration: 240,
          isRequired: true,
          metadata: { experienceLevel: 'senior', type: 'architecture' }
        }
      ]
    };

    return questionMap[experienceLevel] || questionMap['mid'];
  }

  private getTraitQuestion(trait: string): string {
    const traitQuestionMap: Record<string, string> = {
      'communication': 'Describe a situation where you had to explain a complex concept to someone who wasn\'t familiar with the topic. How did you ensure they understood?',
      'teamwork': 'Tell me about a time when you had to work with a difficult team member or in a challenging team dynamic. How did you handle it?',
      'leadership': 'Give me an example of when you took initiative to solve a problem or improve a process without being asked.',
      'problem-solving': 'Walk me through your approach to solving a complex problem you encountered recently. What was your methodology?',
      'creativity': 'Tell me about a time when you came up with an innovative solution to a challenge. What inspired your approach?',
      'adaptability': 'Describe a situation where you had to quickly adapt to significant changes in your work environment or project requirements.',
      'attention-to-detail': 'Give me an example of when your attention to detail prevented a potential issue or improved an outcome.',
      'time-management': 'How do you prioritize tasks when everything seems urgent? Can you give me a specific example?'
    };

    return traitQuestionMap[trait.toLowerCase()] || 
      `Can you give me a specific example of how you demonstrate ${trait} in your professional work?`;
  }

  private getJobSpecificQuestions(jobDescription: string, jobTitle: string): Array<Omit<JobQuestion, 'id' | 'jobId' | 'createdAt' | 'updatedAt' | 'orderIndex' | 'isAiGenerated'>> {
    // In a real implementation, this would use AI to analyze the job description
    // For now, we'll return thoughtful generic questions
    return [
      {
        questionText: `Based on the ${jobTitle} job description, what aspects of this role excite you the most, and why?`,
        questionType: 'general',
        category: 'Role Interest',
        expectedDuration: 120,
        isRequired: true,
        metadata: { type: 'role-interest', source: 'job-description' }
      },
      {
        questionText: `What do you think would be the biggest challenges in this ${jobTitle} position, and how would you approach them?`,
        questionType: 'behavioral',
        category: 'Role Understanding',
        expectedDuration: 150,
        isRequired: true,
        metadata: { type: 'challenges', source: 'job-description' }
      }
    ];
  }

  private getCustomFieldQuestions(customFields: Record<string, any>): Array<Omit<JobQuestion, 'id' | 'jobId' | 'createdAt' | 'updatedAt' | 'orderIndex' | 'isAiGenerated'>> {
    const questions: Array<Omit<JobQuestion, 'id' | 'jobId' | 'createdAt' | 'updatedAt' | 'orderIndex' | 'isAiGenerated'>> = [];

    Object.entries(customFields).forEach(([key, field]) => {
      if (field.inputType !== 'file') { // Skip file fields
        questions.push({
          questionText: `Regarding ${key}: ${field.value}`,
          questionType: 'custom',
          category: 'Custom Requirements',
          expectedDuration: 90,
          isRequired: false,
          metadata: { customField: key, customValue: field.value, inputType: field.inputType }
        });
      }
    });

    return questions;
  }

  // Save generated questions to database
  async saveQuestionsForJob(jobId: string, questions: Omit<JobQuestion, 'id' | 'jobId' | 'createdAt' | 'updatedAt'>[]): Promise<JobQuestion[]> {
    try {
      const supabase = await createClient();
      
      const questionsToInsert = questions.map(q => ({
        job_id: jobId,
        question_text: q.questionText,
        question_type: q.questionType,
        category: q.category,
        expected_duration: q.expectedDuration,
        is_required: q.isRequired,
        order_index: q.orderIndex,
        is_ai_generated: q.isAiGenerated,
        metadata: q.metadata
      }));

      const { data: savedQuestions, error } = await supabase
        .from('job_questions')
        .insert(questionsToInsert)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return savedQuestions.map(q => ({
        id: q.id,
        jobId: q.job_id,
        questionText: q.question_text,
        questionType: q.question_type,
        category: q.category,
        expectedDuration: q.expected_duration,
        isRequired: q.is_required,
        orderIndex: q.order_index,
        isAiGenerated: q.is_ai_generated,
        metadata: q.metadata,
        createdAt: q.created_at,
        updatedAt: q.updated_at
      }));
    } catch (error) {
      console.error('Error saving questions:', error);
      throw error;
    }
  }

  // Get questions for a job
  async getQuestionsForJob(jobId: string): Promise<JobQuestion[]> {
    try {
      const supabase = await createClient();
      
      const { data: questions, error } = await supabase
        .from('job_questions')
        .select('*')
        .eq('job_id', jobId)
        .order('order_index');

      if (error) {
        throw new Error(error.message);
      }

      return questions.map(q => ({
        id: q.id,
        jobId: q.job_id,
        questionText: q.question_text,
        questionType: q.question_type,
        category: q.category,
        expectedDuration: q.expected_duration,
        isRequired: q.is_required,
        orderIndex: q.order_index,
        isAiGenerated: q.is_ai_generated,
        metadata: q.metadata,
        createdAt: q.created_at,
        updatedAt: q.updated_at
      }));
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }

  // Update a question
  async updateQuestion(questionId: string, updates: Partial<Omit<JobQuestion, 'id' | 'jobId' | 'createdAt' | 'updatedAt'>>): Promise<JobQuestion | null> {
    try {
      const supabase = await createClient();
      
      const updateData: any = {};
      if (updates.questionText) updateData.question_text = updates.questionText;
      if (updates.questionType) updateData.question_type = updates.questionType;
      if (updates.category) updateData.category = updates.category;
      if (updates.expectedDuration) updateData.expected_duration = updates.expectedDuration;
      if (updates.isRequired !== undefined) updateData.is_required = updates.isRequired;
      if (updates.orderIndex) updateData.order_index = updates.orderIndex;
      if (updates.metadata) updateData.metadata = updates.metadata;

      const { data: question, error } = await supabase
        .from('job_questions')
        .update(updateData)
        .eq('id', questionId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!question) {
        return null;
      }

      return {
        id: question.id,
        jobId: question.job_id,
        questionText: question.question_text,
        questionType: question.question_type,
        category: question.category,
        expectedDuration: question.expected_duration,
        isRequired: question.is_required,
        orderIndex: question.order_index,
        isAiGenerated: question.is_ai_generated,
        metadata: question.metadata,
        createdAt: question.created_at,
        updatedAt: question.updated_at
      };
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  }

  // Delete a question
  async deleteQuestion(questionId: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('job_questions')
        .delete()
        .eq('id', questionId);

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  }

  // Reorder questions
  async reorderQuestions(jobId: string, questionIds: string[]): Promise<boolean> {
    try {
      const supabase = await createClient();
      
      // Update each question with its new order
      const updatePromises = questionIds.map((questionId, index) => 
        supabase
          .from('job_questions')
          .update({ order_index: index + 1 })
          .eq('id', questionId)
          .eq('job_id', jobId)
      );

      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      console.error('Error reordering questions:', error);
      throw error;
    }
  }

  // Delete all questions for a job
  async deleteAllQuestionsForJob(jobId: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('job_questions')
        .delete()
        .eq('job_id', jobId);

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (error) {
      console.error('Error deleting all questions:', error);
      throw error;
    }
  }

  // Get question statistics for a job
  async getQuestionStats(jobId: string): Promise<{
    total: number;
    required: number;
    optional: number;
    aiGenerated: number;
    custom: number;
    estimatedDuration: number;
  }> {
    try {
      const questions = await this.getQuestionsForJob(jobId);
      
      return {
        total: questions.length,
        required: questions.filter(q => q.isRequired).length,
        optional: questions.filter(q => !q.isRequired).length,
        aiGenerated: questions.filter(q => q.isAiGenerated).length,
        custom: questions.filter(q => !q.isAiGenerated).length,
        estimatedDuration: questions.reduce((total, q) => total + q.expectedDuration, 0)
      };
    } catch (error) {
      console.error('Error getting question stats:', error);
      throw error;
    }
  }
}

export const questionService = new QuestionService(); 