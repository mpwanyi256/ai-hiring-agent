import { createAsyncThunk } from '@reduxjs/toolkit';
import { ResumeEvaluation, InterviewEvaluation } from '@/types/interview';
import { setInterviewStep } from '../interview/interviewSlice';

// Resume evaluation thunks
export const evaluateResume = createAsyncThunk(
  'evaluation/evaluateResume',
  async (
    data: {
      resumeFile: File;
      jobToken: string;
      candidateInfo: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
      };
    },
    { rejectWithValue },
  ) => {
    const formData = new FormData();
    formData.append('resume', data.resumeFile);
    formData.append('jobToken', data.jobToken);
    formData.append('email', data.candidateInfo.email);
    formData.append('firstName', data.candidateInfo.firstName);
    formData.append('lastName', data.candidateInfo.lastName);
    formData.append('candidateId', data.candidateInfo.id);

    const response = await fetch('/api/interview/resume/evaluate', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      // If there's an evaluation even with an error (e.g., database error), return it with error info
      if (result.evaluation && result.errorType) {
        return rejectWithValue({
          error: result.error,
          errorType: result.errorType,
          evaluation: result.evaluation,
          hasEvaluation: true,
        });
      }

      // Normal error case
      return rejectWithValue({
        error: result.error || 'Failed to evaluate resume',
        errorType: 'general_error',
        hasEvaluation: false,
      });
    }

    return result.evaluation as ResumeEvaluation;
  },
);

export const saveResumeEvaluation = createAsyncThunk(
  'evaluation/saveResumeEvaluation',
  async (data: {
    candidateId: string;
    jobId: string;
    resumeContent: string;
    resumeFilename: string;
    evaluation: ResumeEvaluation;
  }) => {
    const response = await fetch('/api/evaluation/resume/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save resume evaluation');
    }

    const result = await response.json();
    return result.evaluation as InterviewEvaluation;
  },
);

export const getResumeEvaluation = createAsyncThunk(
  'evaluation/getResumeEvaluation',
  async (data: { candidateId: string; jobId: string }, { dispatch }) => {
    const response = await fetch(
      `/api/evaluation/resume?candidateId=${data.candidateId}&jobId=${data.jobId}`,
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No evaluation found
      }
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get resume evaluation');
    }

    const result = await response.json();

    if (result.evaluation.resumeScore && result.evaluation.resumeScore < 50) {
      dispatch(setInterviewStep(5));
    } else {
      dispatch(setInterviewStep(3));
    }

    return result.evaluation as InterviewEvaluation | null;
  },
);

// Interview evaluation thunks
export const evaluateInterview = createAsyncThunk(
  'evaluation/evaluateInterview',
  async (data: {
    candidateId: string;
    jobId: string;
    responses: Array<{
      questionId: string;
      questionText: string;
      response: string;
      responseTime: number;
    }>;
  }) => {
    const response = await fetch('/api/evaluation/interview/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to evaluate interview');
    }

    const result = await response.json();
    return result.evaluation as InterviewEvaluation;
  },
);

export const saveInterviewEvaluation = createAsyncThunk(
  'evaluation/saveInterviewEvaluation',
  async (data: {
    candidateId: string;
    evaluation: Omit<InterviewEvaluation, 'id' | 'createdAt' | 'updatedAt'>;
  }) => {
    const response = await fetch('/api/evaluation/interview/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save interview evaluation');
    }

    const result = await response.json();
    return result.evaluation as InterviewEvaluation;
  },
);

export const getInterviewEvaluation = createAsyncThunk(
  'evaluation/getInterviewEvaluation',
  async (data: { candidateId: string }) => {
    const response = await fetch(`/api/evaluation/interview?candidateId=${data.candidateId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No evaluation found
      }
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get interview evaluation');
    }

    const result = await response.json();
    return result.evaluation as InterviewEvaluation | null;
  },
);

// Evaluation history and management
export const getEvaluationHistory = createAsyncThunk(
  'evaluation/getEvaluationHistory',
  async (data: {
    jobId?: string;
    candidateId?: string;
    limit?: number;
    offset?: number;
    evaluationType?: 'resume' | 'interview' | 'combined';
  }) => {
    const params = new URLSearchParams();
    if (data.jobId) params.append('jobId', data.jobId);
    if (data.candidateId) params.append('candidateId', data.candidateId);
    if (data.limit) params.append('limit', data.limit.toString());
    if (data.offset) params.append('offset', data.offset.toString());
    if (data.evaluationType) params.append('evaluationType', data.evaluationType);

    const response = await fetch(`/api/evaluation/history?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get evaluation history');
    }

    const result = await response.json();
    return result.evaluations as InterviewEvaluation[];
  },
);

export const deleteEvaluation = createAsyncThunk(
  'evaluation/deleteEvaluation',
  async (evaluationId: string) => {
    const response = await fetch(`/api/evaluation/${evaluationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete evaluation');
    }

    return evaluationId;
  },
);

// Advanced evaluation analytics
export const getEvaluationAnalytics = createAsyncThunk(
  'evaluation/getEvaluationAnalytics',
  async (data: { jobId?: string; dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (data.jobId) params.append('jobId', data.jobId);
    if (data.dateFrom) params.append('dateFrom', data.dateFrom);
    if (data.dateTo) params.append('dateTo', data.dateTo);

    const response = await fetch(`/api/evaluation/analytics?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get evaluation analytics');
    }

    const result = await response.json();
    return result.analytics;
  },
);

// Bulk evaluation operations
export const bulkEvaluateResumes = createAsyncThunk(
  'evaluation/bulkEvaluateResumes',
  async (data: {
    resumeFiles: File[];
    jobToken: string;
    candidateInfos: Array<{
      email: string;
      firstName: string;
      lastName: string;
    }>;
  }) => {
    const evaluations: ResumeEvaluation[] = [];

    // Process resumes one by one to avoid overwhelming the API
    for (let i = 0; i < data.resumeFiles.length; i++) {
      const formData = new FormData();
      formData.append('resume', data.resumeFiles[i]);
      formData.append('jobToken', data.jobToken);
      formData.append('email', data.candidateInfos[i].email);
      formData.append('firstName', data.candidateInfos[i].firstName);
      formData.append('lastName', data.candidateInfos[i].lastName);

      const response = await fetch('/api/interview/resume/evaluate', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        evaluations.push(result.evaluation);
      } else {
        console.error(`Failed to evaluate resume ${i + 1}`);
      }
    }

    return evaluations;
  },
);
