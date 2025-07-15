import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { InterviewStatus } from '@/types/interviews';

// Base selectors
export const selectInterviewsState = (state: RootState) => state.interviews;

export const selectInterviews = (state: RootState) => state.interviews.interviews;
export const selectCurrentInterview = (state: RootState) => state.interviews.currentInterview;
export const selectInterviewsLoading = (state: RootState) => state.interviews.isLoading;
export const selectInterviewsError = (state: RootState) => state.interviews.error;
export const selectInterviewsPagination = (state: RootState) => state.interviews.pagination;

// Scheduling state selectors
export const selectSchedulingState = (state: RootState) => state.interviews.scheduling;
export const selectIsScheduling = (state: RootState) => state.interviews.scheduling.isScheduling;
export const selectSchedulingApplicationId = (state: RootState) =>
  state.interviews.scheduling.schedulingApplicationId;
export const selectIsUpdating = (state: RootState) => state.interviews.scheduling.isUpdating;
export const selectUpdatingInterviewId = (state: RootState) =>
  state.interviews.scheduling.updatingInterviewId;

// Computed selectors
export const selectInterviewsByJob = createSelector(
  [selectInterviews, (state: RootState, jobId: string) => jobId],
  (interviews, jobId) => interviews.filter((interview) => interview.jobId === jobId),
);

export const selectInterviewsByApplication = createSelector(
  [selectInterviews, (state: RootState, applicationId: string) => applicationId],
  (interviews, applicationId) =>
    interviews.filter((interview) => interview.applicationId === applicationId),
);

export const selectInterviewsByStatus = createSelector(
  [selectInterviews, (state: RootState, status: InterviewStatus) => status],
  (interviews, status) => interviews.filter((interview) => interview.status === status),
);

export const selectUpcomingInterviews = createSelector([selectInterviews], (interviews) => {
  const now = new Date();
  return interviews
    .filter((interview) => {
      const interviewDate = new Date(`${interview.date}T${interview.time}`);
      return interviewDate > now && interview.status === 'scheduled';
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
});

export const selectPastInterviews = createSelector([selectInterviews], (interviews) => {
  const now = new Date();
  return interviews
    .filter((interview) => {
      const interviewDate = new Date(`${interview.date}T${interview.time}`);
      return (
        interviewDate < now || ['completed', 'cancelled', 'no_show'].includes(interview.status)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });
});

export const selectInterviewsByDateRange = createSelector(
  [
    selectInterviews,
    (state: RootState, startDate: string, endDate: string) => ({ startDate, endDate }),
  ],
  (interviews, { startDate, endDate }) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return interviews.filter((interview) => {
      const interviewDate = new Date(interview.date);
      return interviewDate >= start && interviewDate <= end;
    });
  },
);

export const selectInterviewStats = createSelector([selectInterviews], (interviews) => {
  const stats = {
    total: interviews.length,
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    rescheduled: 0,
  };

  interviews.forEach((interview) => {
    switch (interview.status) {
      case 'scheduled':
        stats.scheduled++;
        break;
      case 'confirmed':
        stats.confirmed++;
        break;
      case 'completed':
        stats.completed++;
        break;
      case 'cancelled':
        stats.cancelled++;
        break;
      case 'no_show':
        stats.noShow++;
        break;
      case 'rescheduled':
        stats.rescheduled++;
        break;
    }
  });

  return stats;
});

export const selectInterviewsForApplication = createSelector(
  [selectInterviews, (state: RootState, applicationId: string) => applicationId],
  (interviews, applicationId) => {
    const applicationInterviews = interviews.filter(
      (interview) => interview.applicationId === applicationId,
    );

    return {
      interviews: applicationInterviews,
      hasScheduled: applicationInterviews.some((i) => i.status === 'scheduled'),
      hasCompleted: applicationInterviews.some((i) => i.status === 'completed'),
      nextInterview:
        applicationInterviews
          .filter((i) => i.status === 'scheduled')
          .sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA.getTime() - dateB.getTime();
          })[0] || null,
    };
  },
);

export const selectIsInterviewScheduling = createSelector(
  [
    selectIsScheduling,
    selectSchedulingApplicationId,
    (state: RootState, applicationId: string) => applicationId,
  ],
  (isScheduling, schedulingApplicationId, applicationId) =>
    isScheduling && schedulingApplicationId === applicationId,
);

export const selectIsInterviewUpdating = createSelector(
  [
    selectIsUpdating,
    selectUpdatingInterviewId,
    (state: RootState, interviewId: string) => interviewId,
  ],
  (isUpdating, updatingInterviewId, interviewId) =>
    isUpdating && updatingInterviewId === interviewId,
);

// Search and filter selectors
export const selectFilteredInterviews = createSelector(
  [
    selectInterviews,
    (state: RootState, filters: { jobId?: string; status?: InterviewStatus; search?: string }) =>
      filters,
  ],
  (interviews, filters) => {
    let filtered = interviews;

    if (filters.jobId) {
      filtered = filtered.filter((interview) => interview.jobId === filters.jobId);
    }

    if (filters.status) {
      filtered = filtered.filter((interview) => interview.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (interview) =>
          interview.candidateName.toLowerCase().includes(searchLower) ||
          interview.jobTitle.toLowerCase().includes(searchLower) ||
          interview.candidateEmail.toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  },
);

// Calendar view selectors
export const selectInterviewsForCalendar = createSelector(
  [selectInterviews, (state: RootState, month: number, year: number) => ({ month, year })],
  (interviews, { month, year }) => {
    return interviews
      .filter((interview) => {
        const interviewDate = new Date(interview.date);
        return interviewDate.getMonth() === month && interviewDate.getFullYear() === year;
      })
      .map((interview) => ({
        id: interview.id,
        title: `${interview.candidateName} - ${interview.jobTitle}`,
        date: interview.date,
        time: interview.time,
        status: interview.status,
        applicationId: interview.applicationId,
        jobId: interview.jobId,
      }));
  },
);
