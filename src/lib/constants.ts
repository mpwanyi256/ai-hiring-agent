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
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://intavia.app',
  productionUrl: 'https://intavia.app',
  name: 'Intavia',
  domain: 'intavia.app',
  description: 'AI Hiring Platform',
  projectRef: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  email: 'connect@intavia.app',
  address: {
    street: 'Innovations Village',
    city: 'Kampala, Uganda',
    phone: '+256 (780) 101-601',
    block: 'Block B',
  },
};

export const ai = {
  openaiApiKey: process.env.OPENAI_KEY,
  model: 'gpt-4o-mini', // TODO: Make this dynamic based on the user's plan
  maxTokens: 2000,
  temperature: 0.7, // Balanced creativity for question generation
};

export const isDev = process.env.NEXT_PUBLIC_CLIENT_ENV === 'development';

export const integrations = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_SECRET_ID,
    redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
    analyticsId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    audienceId: process.env.RESEND_AUDIENCE_ID,
  },
  stripe: {
    secretKey: isDev ? process.env.STRIPE_SECRET_TEST : process.env.STRIPE_SECRET,
    publishableKey: isDev
      ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_TEST
      : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE,
    webhookSecret: isDev
      ? process.env.STRIPE_WEBHOOK_SECRET_TEST
      : process.env.STRIPE_WEBHOOK_SECRET,
  },
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
};

export const monitoring = {
  apiKey: process.env.NEXT_PUBLIC_MONITORING_API_KEY,
};

export const mail = {
  host: process.env.NEXT_PUBLIC_EMAIL_HOST,
  port: process.env.NEXT_PUBLIC_EMAIL_PORT,
  secure: true,
  auth: {
    username: process.env.NEXT_PUBLIC_USERNAME,
    password: process.env.NEXT_PUBLIC_PASSWORD,
  },
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
