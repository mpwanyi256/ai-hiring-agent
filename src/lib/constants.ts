export const experienceLevels = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (2-5 years)' },
  { value: 'senior', label: 'Senior Level (5+ years)' },
  { value: 'lead', label: 'Lead/Principal (8+ years)' },
  { value: 'executive', label: 'Executive/Director' },
];

export const inputTypes = [
  { value: 'text', label: 'Text Input', icon: '📝' },
  { value: 'textarea', label: 'Long Text', icon: '📄' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'file', label: 'File Upload', icon: '📎' },
  { value: 'url', label: 'Website URL', icon: '🔗' },
  { value: 'email', label: 'Email Address', icon: '📧' },
];

export const app = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  name: 'Intervio',
  domain: 'intervio.com',
  description: 'AI Hiring Platform',
  projectRef: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export const ai = {
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
  model: 'gpt-4o-mini', // Cost-effective model for question generation
  maxTokens: 2000,
  temperature: 0.7, // Balanced creativity for question generation
};

export const domainEmails = {
  support: `support@${app.domain}`,
  noReply: `no-reply@${app.domain}`,
  developer: `developer@${app.domain}`,
};

export const defaultJobDescriptionMarkdown = `Tips: Provide a summary of the role, what success in the position looks like, and how this role fits into the organization overall.

<br />

**Responsibilities**
[Be specific when describing each of the responsibilities. Use gender-neutral, inclusive language.]
Example: Determine and develop user requirements for systems in production, to ensure maximum usability

<br />

**Qualifications**
[Some qualifications you may want to include are Skills, Education, Experience, or Certifications.]
Example: Excellent verbal and written communication skills
`;
