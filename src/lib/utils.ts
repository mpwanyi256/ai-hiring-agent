import { type ClassValue, clsx } from 'clsx';
import { JobData } from './services/jobsService';
import { Job } from '@/types';
import { JobQuestion } from '@/types/interview';
import { JobStatus } from './supabase';

// Utility function to merge classes with Tailwind
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Date formatting utilities
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
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
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate initials from name
export function getInitials(firstName: string, lastName?: string): string {
  if (lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  return firstName.substring(0, 2).toUpperCase();
} 

export const parseJobFields = (jobFields: JobData['fields']): Job['fields'] => {
  return {
    skills: jobFields.skills,
    experienceLevel: jobFields.experienceLevel,
    traits: jobFields.traits,
    jobDescription: jobFields.jobDescription,
    customFields: jobFields.customFields ? Object.fromEntries(Object.entries(jobFields.customFields).map(([key, value]) => [key, typeof value === 'string' ? { value, inputType: 'text' } : value])) : undefined
  };
}

export const parseJobDetails = (jobData: JobData): Job => {
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
    interviewLink: jobData.interviewLink
  };
}

export const copyInterviewLink = async (interviewLink: string) => {
  try {
    await navigator.clipboard.writeText(interviewLink);
    return true;
  } catch (error) {
    console.error('Failed to copy link:', error);
    return false;
  }
}

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
