import { JobData } from '@/lib/services/jobsService';

export interface Country {
  id: string;
  name: string;
  code: string;
  continent: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  logo_url: string | null;
  logo_path: string | null;
  timezoneId: string | null; // Reference to timezones.id
  timezone: Timezone | null; // Populated when joining with timezones table
  created_at: string;
  updated_at: string;
}

export interface Timezone {
  id: string;
  name: string;
  displayName: string;
  offsetHours: number;
  offsetMinutes: number;
  isDst: boolean;
  region: string;
  countryId?: string; // Reference to countries.id
  country?: Country; // Populated when joining with countries table
  city?: string;
  createdAt: string;
}

export interface UpdateCompanyData {
  name?: string;
  bio?: string;
  website?: string;
  timezoneId?: string;
}

export interface CompanyState {
  company: Company | null;
  loading: boolean;
  error: string | null;
  isUpdating: boolean;
  isUploadingLogo: boolean;
  jobs: JobData[];
}
