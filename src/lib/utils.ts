import { type ClassValue, clsx } from 'clsx';
import { CandidateStatus, CandidateStatusOptions, Job } from '@/types';
import { JobStatus } from '@/types/jobs';
import { apiError, apiSuccess } from './notification';
import { twMerge } from 'tailwind-merge';
import { app } from './constants';
import { Notification } from '@/types/notifications';
import { CheckCircle, Info, User, FileText, Calendar, Settings } from 'lucide-react';

// Utility function to merge classes with Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

// Generate random tokens for interview links
export function generateInterviewToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Format score as percentage
export function formatScore(score: number): string {
  return `${Math.round(score)}%`;
}

// Sleep utility for delays
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generate initials from name
export function getInitials(firstName: string, lastName?: string): string {
  if (lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  return firstName.substring(0, 2).toUpperCase();
}

export const parseJobFields = (jobFields: Job['fields']): Job['fields'] => {
  return {
    skills: jobFields.skills,
    experienceLevel: jobFields.experienceLevel,
    traits: jobFields.traits,
    jobDescription: jobFields.jobDescription,
    customFields: jobFields.customFields
      ? Object.fromEntries(
          Object.entries(jobFields.customFields).map(([key, value]) => [
            key,
            typeof value === 'string' ? { value, inputType: 'text' } : value,
          ]),
        )
      : undefined,
  };
};

export const parseJobDetails = (jobData: Job): Job => {
  return {
    id: jobData.id,
    profileId: jobData.profileId,
    title: jobData.title,
    fields: parseJobFields(jobData.fields),
    interviewFormat: jobData.interviewFormat,
    interviewToken: jobData.interviewToken,
    isActive: jobData.isActive,
    status: jobData.status,
    createdAt: jobData.createdAt,
    updatedAt: jobData.updatedAt,
    candidateCount: jobData.candidateCount,
    interviewLink: jobData.interviewLink,
    shortlistedCount: jobData.shortlistedCount,
  };
};

export const copyInterviewLink = async (interviewLink: string) => {
  try {
    await navigator.clipboard.writeText(interviewLink);
    apiSuccess('Interview link copied to clipboard');
    return true;
  } catch (error) {
    console.error('Failed to copy link:', error);
    return false;
  }
};

export const getJobStatusLabel = (status: JobStatus) => {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'interviewing':
      return 'Interviewing';
    case 'closed':
      return 'Closed';
    default:
      return 'Unknown';
  }
};

export const getCandidateStatusLabelStyle = (status: CandidateStatus) => {
  switch (status) {
    case 'under_review':
      return 'bg-gray-100 text-gray-700';
    case 'interview_scheduled':
      return 'bg-blue-100 text-blue-700';
    case 'shortlisted':
      return 'bg-green-100 text-green-700';
    case 'reference_check':
      return 'bg-yellow-100 text-yellow-700';
    case 'offer_extended':
      return 'bg-purple-100 text-purple-700';
    case 'offer_accepted':
      return 'bg-green-100 text-green-700';
    case 'hired':
      return 'bg-green-100 text-green-700';
    case 'rejected':
      return 'bg-red-100 text-red-700';
    case 'withdrawn':
      return 'bg-gray-100 text-gray-700';
    case 'all':
      return 'bg-gray-100 text-gray-700';
  }
};

export const getJobStatusColor = (status: JobStatus) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'interviewing':
      return 'bg-blue-100 text-blue-600 border-blue-200';
    case 'closed':
      return 'bg-green-100 text-green-600 border-green-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const getQuestionTypeColor = (type: string) => {
  switch (type) {
    case 'technical':
      return 'bg-blue-100 text-blue-700';
    case 'behavioral':
      return 'bg-green-100 text-green-700';
    case 'experience':
      return 'bg-purple-100 text-purple-700';
    case 'general':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-orange-100 text-orange-700';
  }
};

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB limit
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ];

  const allowedExtensions = ['pdf', 'docx', 'doc', 'txt'];
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size exceeds 10MB limit. Please upload a smaller file.',
    };
  }

  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension || '')) {
    return {
      isValid: false,
      error: 'Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files only.',
    };
  }

  if (file.size < 100) {
    return {
      isValid: false,
      error: 'File appears to be empty. Please upload a valid resume file.',
    };
  }

  return { isValid: true };
};

export const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'txt':
      return '📋';
    default:
      return '📎';
  }
};

export const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 bg-green-50';
  if (score >= 60) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
};

export const shareJob = async (job: Job, companySlug: string) => {
  try {
    if (!job) return;
    const link = job.interviewLink || `${app.baseUrl}/jobs/${companySlug}/${job.interviewToken}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `AI Interview: ${job.title}`,
          text: `Take an AI-powered interview for the ${job.title} position`,
          url: link,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        copyInterviewLink(link);
      }
    } else {
      copyInterviewLink(link);
    }
  } catch (error) {
    apiError(error instanceof Error ? error.message : 'Failed to share job');
  }
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getInterviewScoreColor = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  if (score >= 20) return 'bg-red-500';
  return 'bg-red-500';
};

export const getResumeScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
};

export const getCandidateStatusOptions = (): CandidateStatusOptions[] => {
  return [
    { value: 'all', label: 'All', color: 'bg-gray-100 text-gray-800' },
    { value: 'under_review', label: 'Under Review', color: 'bg-gray-100 text-gray-800' },
    { value: 'shortlisted', label: 'Shortlisted', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  ];
};

export const getAllCandidateStatusOptions = (): CandidateStatusOptions[] => {
  return [
    { value: 'all', label: 'All', color: 'bg-gray-100 text-gray-800' },
    {
      value: 'interview_scheduled',
      label: 'Interview Scheduled',
      color: 'bg-blue-100 text-blue-800',
    },
    { value: 'reference_check', label: 'Reference Check', color: 'bg-purple-100 text-purple-800' },
    { value: 'offer_extended', label: 'Offer Extended', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'offer_accepted', label: 'Offer Accepted', color: 'bg-green-100 text-green-800' },
    { value: 'hired', label: 'Hired', color: 'bg-green-100 text-green-800' },
    { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' },
  ];
};

// Contract-related utility functions
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function getContractStatusBadge(status: string) {
  switch (status) {
    case 'sent':
      return {
        label: 'Pending',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: 'Clock',
      };
    case 'signed':
      return {
        label: 'Signed',
        className: 'bg-green-50 text-green-700 border-green-200',
        icon: 'CheckCircle',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        className: 'bg-red-50 text-red-700 border-red-200',
        icon: 'XCircle',
      };
    default:
      return {
        label: status,
        className: 'bg-gray-50 text-gray-700 border-gray-200',
        icon: 'FileText',
      };
  }
}

export function isContractExpired(offer: { status: string; expiresAt: string }): boolean {
  return offer.status === 'sent' && new Date(offer.expiresAt) < new Date();
}

export function calculateContractStats(offers: Array<{ status: string }>) {
  const totalSent = offers.length;
  const totalSigned = offers.filter((o) => o.status === 'signed').length;
  const totalRejected = offers.filter((o) => o.status === 'rejected').length;
  const totalPending = offers.filter((o) => o.status === 'sent').length;

  const signedRate = totalSent > 0 ? (totalSigned / totalSent) * 100 : 0;
  const rejectedRate = totalSent > 0 ? (totalRejected / totalSent) * 100 : 0;
  const pendingRate = totalSent > 0 ? (totalPending / totalSent) * 100 : 0;

  return {
    totalSent,
    totalSigned,
    totalRejected,
    totalPending,
    signedRate,
    rejectedRate,
    pendingRate,
  };
}

export function getContractCategoryBadge(category: string) {
  const badges = {
    full_time: { label: 'Full-time', className: 'bg-blue-100 text-blue-800' },
    part_time: { label: 'Part-time', className: 'bg-green-100 text-green-800' },
    contract: { label: 'Contract', className: 'bg-yellow-100 text-yellow-800' },
    freelance: { label: 'Freelance', className: 'bg-purple-100 text-purple-800' },
    internship: { label: 'Internship', className: 'bg-orange-100 text-orange-800' },
    temporary: { label: 'Temporary', className: 'bg-red-100 text-red-800' },
  };

  const badge = badges[category as keyof typeof badges] || {
    label: category,
    className: 'bg-gray-100 text-gray-800',
  };

  return badge;
}

// Notification utility functions
export function getNotificationIcon(type: string) {
  switch (type) {
    case 'contract_offer':
      return FileText;
    case 'interview':
      return Calendar;
    case 'application':
      return User;
    case 'evaluation':
      return CheckCircle;
    case 'system':
      return Settings;
    default:
      return Info;
  }
}

export function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    contract_offer: 'Contract Offer',
    interview: 'Interview',
    application: 'Application',
    evaluation: 'Evaluation',
    system: 'System',
  };

  return labels[type] || type;
}

export function getNotificationPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-50';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50';
    case 'low':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}
