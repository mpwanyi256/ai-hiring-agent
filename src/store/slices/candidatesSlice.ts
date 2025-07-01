import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';

export interface Candidate {
  id: string;
  jobId: string;
  interviewToken: string;
  email?: string;
  submittedAt?: string;
  evaluation?: Evaluation;
  responses?: Response[];
}

export interface Response {
  id: string;
  candidateId: string;
  question: string;
  answer: string;
}

export interface Evaluation {
  id: string;
  candidateId: string;
  summary: string;
  score: number;
  strengths: string[];
  redFlags: string[];
}

interface CandidatesState {
  candidates: Candidate[];
  currentCandidate: Candidate | null;
  isLoading: boolean;
  error: string | null;
  totalCandidates: number;
}

const initialState: CandidatesState = {
  candidates: [],
  currentCandidate: null,
  isLoading: false,
  error: null,
  totalCandidates: 0,
};

// Async thunks for candidates
export const fetchCandidatesByJob = createAsyncThunk(
  'candidates/fetchCandidatesByJob',
  async (jobId: string) => {
    const { data, error } = await supabase
      .from('candidates')
      .select(`
        *,
        evaluations(*),
        responses(*)
      `)
      .eq('job_id', jobId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return data.map(candidate => ({
      id: candidate.id,
      jobId: candidate.job_id,
      interviewToken: candidate.interview_token,
      email: candidate.email,
      submittedAt: candidate.submitted_at,
      evaluation: candidate.evaluations?.[0] ? {
        id: candidate.evaluations[0].id,
        candidateId: candidate.evaluations[0].candidate_id,
        summary: candidate.evaluations[0].summary,
        score: candidate.evaluations[0].score,
        strengths: candidate.evaluations[0].strengths,
        redFlags: candidate.evaluations[0].red_flags,
      } : undefined,
      responses: candidate.responses?.map((response: any) => ({
        id: response.id,
        candidateId: response.candidate_id,
        question: response.question,
        answer: response.answer,
      })) || [],
    }));
  }
);

export const fetchCandidateById = createAsyncThunk(
  'candidates/fetchCandidateById',
  async (candidateId: string) => {
    const { data, error } = await supabase
      .from('candidates')
      .select(`
        *,
        evaluations(*),
        responses(*)
      `)
      .eq('id', candidateId)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      jobId: data.job_id,
      interviewToken: data.interview_token,
      email: data.email,
      submittedAt: data.submitted_at,
      evaluation: data.evaluations?.[0] ? {
        id: data.evaluations[0].id,
        candidateId: data.evaluations[0].candidate_id,
        summary: data.evaluations[0].summary,
        score: data.evaluations[0].score,
        strengths: data.evaluations[0].strengths,
        redFlags: data.evaluations[0].red_flags,
      } : undefined,
      responses: data.responses?.map((response: any) => ({
        id: response.id,
        candidateId: response.candidate_id,
        question: response.question,
        answer: response.answer,
      })) || [],
    };
  }
);

export const createCandidate = createAsyncThunk(
  'candidates/createCandidate',
  async (candidateData: {
    jobId: string;
    interviewToken: string;
    email?: string;
  }) => {
    const { data, error } = await supabase
      .from('candidates')
      .insert({
        job_id: candidateData.jobId,
        interview_token: candidateData.interviewToken,
        email: candidateData.email,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      jobId: data.job_id,
      interviewToken: data.interview_token,
      email: data.email,
      submittedAt: data.submitted_at,
    };
  }
);

export const submitInterview = createAsyncThunk(
  'candidates/submitInterview',
  async (submissionData: {
    candidateId: string;
    responses: { question: string; answer: string }[];
  }) => {
    // First, submit the responses
    const { error: responsesError } = await supabase
      .from('responses')
      .insert(
        submissionData.responses.map(response => ({
          candidate_id: submissionData.candidateId,
          question: response.question,
          answer: response.answer,
        }))
      );

    if (responsesError) throw responsesError;

    // Then update the candidate as submitted
    const { data, error } = await supabase
      .from('candidates')
      .update({ submitted_at: new Date().toISOString() })
      .eq('id', submissionData.candidateId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      jobId: data.job_id,
      interviewToken: data.interview_token,
      email: data.email,
      submittedAt: data.submitted_at,
    };
  }
);

export const saveEvaluation = createAsyncThunk(
  'candidates/saveEvaluation',
  async (evaluationData: {
    candidateId: string;
    summary: string;
    score: number;
    strengths: string[];
    redFlags: string[];
  }) => {
    const { data, error } = await supabase
      .from('evaluations')
      .upsert({
        candidate_id: evaluationData.candidateId,
        summary: evaluationData.summary,
        score: evaluationData.score,
        strengths: evaluationData.strengths,
        red_flags: evaluationData.redFlags,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      candidateId: data.candidate_id,
      summary: data.summary,
      score: data.score,
      strengths: data.strengths,
      redFlags: data.red_flags,
    };
  }
);

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentCandidate: (state, action: PayloadAction<Candidate | null>) => {
      state.currentCandidate = action.payload;
    },
    clearCurrentCandidate: (state) => {
      state.currentCandidate = null;
    },
    addResponse: (state, action: PayloadAction<Response>) => {
      if (state.currentCandidate) {
        if (!state.currentCandidate.responses) {
          state.currentCandidate.responses = [];
        }
        state.currentCandidate.responses.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Candidates by Job
      .addCase(fetchCandidatesByJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCandidatesByJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.candidates = action.payload;
        state.totalCandidates = action.payload.length;
      })
      .addCase(fetchCandidatesByJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch candidates';
      })
      // Fetch Candidate by Id
      .addCase(fetchCandidateById.fulfilled, (state, action) => {
        state.currentCandidate = action.payload;
      })
      // Create Candidate
      .addCase(createCandidate.fulfilled, (state, action) => {
        state.currentCandidate = action.payload;
      })
      // Submit Interview
      .addCase(submitInterview.fulfilled, (state, action) => {
        if (state.currentCandidate) {
          state.currentCandidate.submittedAt = action.payload.submittedAt;
        }
      })
      // Save Evaluation
      .addCase(saveEvaluation.fulfilled, (state, action) => {
        const candidateIndex = state.candidates.findIndex(
          candidate => candidate.id === action.payload.candidateId
        );
        if (candidateIndex !== -1) {
          state.candidates[candidateIndex].evaluation = action.payload;
        }
        if (state.currentCandidate && state.currentCandidate.id === action.payload.candidateId) {
          state.currentCandidate.evaluation = action.payload;
        }
      });
  },
});

export const { 
  clearError, 
  setCurrentCandidate, 
  clearCurrentCandidate, 
  addResponse 
} = candidatesSlice.actions;
export default candidatesSlice.reducer; 