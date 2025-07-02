import { createClient } from '@/lib/supabase/server';
import { JobData } from './jobsService';
import {
  Candidate,
  InterviewQuestion,
  CandidateResponse,
  InterviewEvaluation,
  InterviewSession,
  InterviewStats
} from '@/types/interview';

class InterviewService {
  // Generate interview questions based on job requirements
  async generateQuestions(job: JobData): Promise<InterviewQuestion[]> {
    const questions: InterviewQuestion[] = [];
    
    // Base questions for all interviews
    const baseQuestions = [
      {
        id: 'intro-1',
        question: 'Tell me about yourself and what interests you about this position.',
        type: 'general' as const,
        category: 'Introduction',
        expectedDuration: 120,
        order: 1
      }
    ];

    // Experience level specific questions
    if (job.fields?.experienceLevel) {
      const experienceQuestions = this.getExperienceQuestions(job.fields.experienceLevel);
      questions.push(...experienceQuestions);
    }

    // Skills-based questions
    if (job.fields?.skills && job.fields.skills.length > 0) {
      const skillQuestions = this.getSkillQuestions(job.fields.skills);
      questions.push(...skillQuestions);
    }

    // Traits-based questions
    if (job.fields?.traits && job.fields.traits.length > 0) {
      const traitQuestions = this.getTraitQuestions(job.fields.traits);
      questions.push(...traitQuestions);
    }

    // Job-specific questions from description
    if (job.fields?.jobDescription) {
      const jobSpecificQuestions = this.getJobSpecificQuestions(job.fields.jobDescription);
      questions.push(...jobSpecificQuestions);
    }

    // Custom field questions
    if (job.fields?.customFields) {
      const customQuestions = this.getCustomFieldQuestions(job.fields.customFields);
      questions.push(...customQuestions);
    }

    // Closing questions
    const closingQuestions = [
      {
        id: 'closing-1',
        question: 'Do you have any questions about the role or the company?',
        type: 'general' as const,
        category: 'Closing',
        expectedDuration: 90,
        order: 999
      }
    ];

    return [...baseQuestions, ...questions, ...closingQuestions]
      .sort((a, b) => a.order - b.order)
      .map((q, index) => ({ ...q, order: index + 1 }));
  }

  private getExperienceQuestions(experienceLevel: string): InterviewQuestion[] {
    const questionMap: Record<string, InterviewQuestion[]> = {
      'entry': [
        {
          id: 'exp-entry-1',
          question: 'What projects or coursework have you worked on that relate to this position?',
          type: 'experience',
          category: 'Experience',
          expectedDuration: 120,
          order: 10
        },
        {
          id: 'exp-entry-2',
          question: 'How do you approach learning new technologies or skills?',
          type: 'behavioral',
          category: 'Learning',
          expectedDuration: 90,
          order: 11
        }
      ],
      'mid': [
        {
          id: 'exp-mid-1',
          question: 'Describe a challenging project you\'ve worked on and how you overcame the obstacles.',
          type: 'experience',
          category: 'Problem Solving',
          expectedDuration: 150,
          order: 10
        },
        {
          id: 'exp-mid-2',
          question: 'How do you handle competing priorities and tight deadlines?',
          type: 'behavioral',
          category: 'Time Management',
          expectedDuration: 120,
          order: 11
        }
      ],
      'senior': [
        {
          id: 'exp-senior-1',
          question: 'Tell me about a time when you led a team or mentored junior colleagues.',
          type: 'behavioral',
          category: 'Leadership',
          expectedDuration: 150,
          order: 10
        },
        {
          id: 'exp-senior-2',
          question: 'How do you approach system design and architecture decisions?',
          type: 'technical',
          category: 'Architecture',
          expectedDuration: 180,
          order: 11
        }
      ]
    };

    return questionMap[experienceLevel] || questionMap['mid'];
  }

  private getSkillQuestions(skills: string[]): InterviewQuestion[] {
    const questions: InterviewQuestion[] = [];
    const selectedSkills = skills.slice(0, 3); // Focus on top 3 skills

    selectedSkills.forEach((skill, index) => {
      questions.push({
        id: `skill-${index + 1}`,
        question: `How would you rate your experience with ${skill}? Can you provide a specific example of how you've used it?`,
        type: 'technical',
        category: 'Skills',
        expectedDuration: 120,
        order: 20 + index
      });
    });

    return questions;
  }

  private getTraitQuestions(traits: string[]): InterviewQuestion[] {
    const traitQuestionMap: Record<string, string> = {
      'communication': 'Describe a situation where you had to explain a complex concept to someone. How did you ensure they understood?',
      'teamwork': 'Tell me about a time when you had to work with a difficult team member. How did you handle it?',
      'leadership': 'Give me an example of when you took initiative to solve a problem or improve a process.',
      'problem-solving': 'Walk me through your approach to solving a complex problem you encountered recently.',
      'creativity': 'Tell me about a time when you came up with an innovative solution to a challenge.',
      'adaptability': 'Describe a situation where you had to quickly adapt to significant changes. How did you manage?',
      'attention-to-detail': 'Give me an example of when your attention to detail prevented a potential issue.',
      'time-management': 'How do you prioritize tasks when everything seems urgent?'
    };

    const questions: InterviewQuestion[] = [];
    const selectedTraits = traits.slice(0, 2); // Focus on top 2 traits

    selectedTraits.forEach((trait, index) => {
      const question = traitQuestionMap[trait.toLowerCase()] || 
        `Can you give me an example of how you demonstrate ${trait} in your work?`;
      
      questions.push({
        id: `trait-${index + 1}`,
        question,
        type: 'behavioral',
        category: 'Traits',
        expectedDuration: 150,
        order: 30 + index
      });
    });

    return questions;
  }

  private getJobSpecificQuestions(jobDescription: string): InterviewQuestion[] {
    // In a real implementation, this would use AI to analyze the job description
    // For now, we'll return some generic but relevant questions
    return [
      {
        id: 'job-specific-1',
        question: 'Based on the job description, what aspects of this role excite you the most?',
        type: 'general',
        category: 'Role Interest',
        expectedDuration: 120,
        order: 40
      },
      {
        id: 'job-specific-2',
        question: 'What do you think would be the biggest challenges in this position, and how would you approach them?',
        type: 'behavioral',
        category: 'Role Understanding',
        expectedDuration: 150,
        order: 41
      }
    ];
  }

  private getCustomFieldQuestions(customFields: Record<string, { value: string; inputType: string }>): InterviewQuestion[] {
    const questions: InterviewQuestion[] = [];
    let order = 50;

    Object.entries(customFields).forEach(([key, field]) => {
      if (field.inputType !== 'file') { // Skip file fields
        questions.push({
          id: `custom-${order}`,
          question: `Regarding ${key}: ${field.value}`,
          type: 'general',
          category: 'Custom Requirements',
          expectedDuration: 90,
          order: order++
        });
      }
    });

    return questions;
  }

  // Create a new candidate session
  async createCandidate(jobId: string, interviewToken: string, candidateData?: {
    email?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<Candidate> {
    try {
      const supabase = await createClient();
      
      const candidateInsert = {
        job_id: jobId,
        interview_token: interviewToken,
        email: candidateData?.email,
        first_name: candidateData?.firstName,
        last_name: candidateData?.lastName,
        current_step: 1,
        total_steps: 0, // Will be updated when questions are generated
        is_completed: false,
      };

      const { data: candidate, error } = await supabase
        .from('candidates')
        .insert(candidateInsert)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        id: candidate.id,
        jobId: candidate.job_id,
        interviewToken: candidate.interview_token,
        email: candidate.email,
        firstName: candidate.first_name,
        lastName: candidate.last_name,
        submittedAt: candidate.submitted_at,
        createdAt: candidate.created_at,
        currentStep: candidate.current_step,
        totalSteps: candidate.total_steps,
        isCompleted: candidate.is_completed,
      };
    } catch (error) {
      console.error('Error creating candidate:', error);
      throw error;
    }
  }

  // Start interview session
  async startInterview(candidateId: string, job: JobData): Promise<InterviewSession> {
    try {
      const supabase = await createClient();
      
      // Get candidate
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

      if (candidateError || !candidateData) {
        throw new Error('Candidate not found');
      }

      // Generate questions
      const questions = await this.generateQuestions(job);

      // Update candidate with total steps
      await supabase
        .from('candidates')
        .update({ total_steps: questions.length })
        .eq('id', candidateId);

      const candidate: Candidate = {
        id: candidateData.id,
        jobId: candidateData.job_id,
        interviewToken: candidateData.interview_token,
        email: candidateData.email,
        firstName: candidateData.first_name,
        lastName: candidateData.last_name,
        submittedAt: candidateData.submitted_at,
        createdAt: candidateData.created_at,
        currentStep: candidateData.current_step,
        totalSteps: questions.length,
        isCompleted: candidateData.is_completed,
      };

      return {
        candidate,
        questions,
        responses: [],
        currentQuestionIndex: 0,
        startedAt: new Date().toISOString(),
        timeElapsed: 0,
      };
    } catch (error) {
      console.error('Error starting interview:', error);
      throw error;
    }
  }

  // Submit a response
  async submitResponse(candidateId: string, questionId: string, question: string, answer: string, responseTime: number): Promise<CandidateResponse> {
    try {
      const supabase = await createClient();
      
      const responseInsert = {
        candidate_id: candidateId,
        question_id: questionId,
        question: question,
        answer: answer,
        response_time: responseTime,
      };

      const { data: response, error } = await supabase
        .from('responses')
        .insert(responseInsert)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update candidate's current step
      const { data: currentCandidate } = await supabase
        .from('candidates')
        .select('current_step')
        .eq('id', candidateId)
        .single();

      if (currentCandidate) {
        await supabase
          .from('candidates')
          .update({ current_step: currentCandidate.current_step + 1 })
          .eq('id', candidateId);
      }

      return {
        id: response.id,
        candidateId: response.candidate_id,
        questionId: response.question_id,
        question: response.question,
        answer: response.answer,
        responseTime: response.response_time,
        createdAt: response.created_at,
      };
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  }

  // Complete interview
  async completeInterview(candidateId: string): Promise<void> {
    try {
      const supabase = await createClient();
      
      await supabase
        .from('candidates')
        .update({ 
          is_completed: true,
          submitted_at: new Date().toISOString()
        })
        .eq('id', candidateId);

      // Trigger AI evaluation (in background)
      // In a real implementation, this would be a background job
      this.evaluateCandidate(candidateId).catch(error => {
        console.error('Error evaluating candidate:', error);
      });
    } catch (error) {
      console.error('Error completing interview:', error);
      throw error;
    }
  }

  // AI Evaluation (simplified version)
  private async evaluateCandidate(candidateId: string): Promise<InterviewEvaluation> {
    try {
      const supabase = await createClient();
      
      // Get candidate responses
      const { data: responses, error } = await supabase
        .from('responses')
        .select('*')
        .eq('candidate_id', candidateId);

      if (error) {
        throw new Error(error.message);
      }

      // Simple scoring algorithm (in real implementation, would use AI)
      const score = this.calculateScore(responses);
      const evaluation = this.generateEvaluation(responses, score);

      const evaluationInsert = {
        candidate_id: candidateId,
        summary: evaluation.summary,
        score: evaluation.score,
        strengths: evaluation.strengths,
        red_flags: evaluation.redFlags,
        skills_assessment: evaluation.skillsAssessment,
        traits_assessment: evaluation.traitsAssessment,
        recommendation: evaluation.recommendation,
        feedback: evaluation.feedback,
      };

      const { data: evalData, error: evalError } = await supabase
        .from('evaluations')
        .insert(evaluationInsert)
        .select()
        .single();

      if (evalError) {
        throw new Error(evalError.message);
      }

      return {
        id: evalData.id,
        candidateId: evalData.candidate_id,
        summary: evalData.summary,
        score: evalData.score,
        strengths: evalData.strengths,
        redFlags: evalData.red_flags,
        skillsAssessment: evalData.skills_assessment,
        traitsAssessment: evalData.traits_assessment,
        recommendation: evalData.recommendation,
        feedback: evalData.feedback,
        createdAt: evalData.created_at,
        updatedAt: evalData.updated_at,
      };
    } catch (error) {
      console.error('Error evaluating candidate:', error);
      throw error;
    }
  }

  private calculateScore(responses: any[]): number {
    // Simple scoring based on response length and completeness
    if (responses.length === 0) return 0;
    
    const avgResponseLength = responses.reduce((acc, r) => acc + r.answer.length, 0) / responses.length;
    const completionRate = responses.length / 10; // Assuming 10 questions on average
    
    // Basic scoring algorithm
    let score = Math.min(100, (avgResponseLength / 100) * 30 + completionRate * 70);
    return Math.round(score);
  }

  private generateEvaluation(responses: any[], score: number): Omit<InterviewEvaluation, 'id' | 'candidateId' | 'createdAt' | 'updatedAt'> {
    const strengths = [];
    const redFlags = [];
    
    // Analyze responses (simplified)
    const avgResponseTime = responses.reduce((acc, r) => acc + r.response_time, 0) / responses.length;
    
    if (avgResponseTime < 30) {
      redFlags.push('Very quick responses - may lack depth');
    } else if (avgResponseTime > 300) {
      redFlags.push('Long response times - may indicate uncertainty');
    } else {
      strengths.push('Thoughtful response timing');
    }

    if (responses.every(r => r.answer.length > 50)) {
      strengths.push('Detailed and comprehensive responses');
    }

    if (responses.some(r => r.answer.length < 20)) {
      redFlags.push('Some responses lack detail');
    }

    // Recommendation based on score
    let recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
    if (score >= 85) recommendation = 'strong_yes';
    else if (score >= 70) recommendation = 'yes';
    else if (score >= 50) recommendation = 'maybe';
    else if (score >= 30) recommendation = 'no';
    else recommendation = 'strong_no';

    return {
      summary: `Candidate completed interview with ${responses.length} responses. Average response time: ${Math.round(avgResponseTime)}s.`,
      score,
      strengths,
      redFlags,
      skillsAssessment: {}, // Would be populated by AI analysis
      traitsAssessment: {}, // Would be populated by AI analysis
      recommendation,
      feedback: `Overall score: ${score}/100. ${strengths.length > 0 ? 'Strengths: ' + strengths.join(', ') + '. ' : ''}${redFlags.length > 0 ? 'Areas for consideration: ' + redFlags.join(', ') + '.' : ''}`,
    };
  }

  // Get interview stats
  getInterviewStats(session: InterviewSession): InterviewStats {
    const totalQuestions = session.questions.length;
    const answeredQuestions = session.responses.length;
    const timeSpent = session.timeElapsed;
    
    const avgTimePerQuestion = session.questions.reduce((acc, q) => acc + q.expectedDuration, 0) / totalQuestions;
    const estimatedTimeRemaining = (totalQuestions - answeredQuestions) * avgTimePerQuestion;
    const completionPercentage = (answeredQuestions / totalQuestions) * 100;

    return {
      totalQuestions,
      answeredQuestions,
      timeSpent,
      estimatedTimeRemaining,
      completionPercentage,
    };
  }
}

export const interviewService = new InterviewService(); 