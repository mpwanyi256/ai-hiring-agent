export interface Skill {
    id: string;
    name: string;
    category: string;
    description?: string;
  }
  
  export interface Trait {
    id: string;
    name: string;
    category: string;
    description?: string;
  }
  
  export interface JobTemplate {
    id: string;
    name: string;
    title: string;
    fields: {
      skills?: string[];
      experienceLevel?: string;
      traits?: string[];
      jobDescription?: string;
      customFields?: Record<string, { value: string; inputType: string }>;
    };
    interview_format: string;
    created_at: string;
    updated_at: string;
  }