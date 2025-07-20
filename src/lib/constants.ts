import { SubscriptionPlans } from '@/types/billing';

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
  name: 'Intavia',
  domain: 'intavia.app',
  description: 'AI Hiring Platform',
  projectRef: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  email: 'connect@intavia.app',
  address: {
    street: 'Innovations Village',
    city: 'Kampala, Uganda',
    phone: '+256 (780) 101-601',
    block: 'Block B',
  },
};

export const ai = {
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
  model: 'gpt-4o-mini', // Cost-effective model for question generation
  maxTokens: 2000,
  temperature: 0.7, // Balanced creativity for question generation
};

export const isDev = process.env.NEXT_PUBLIC_CLIENT_ENV === 'development';

export const integrations = {
  google: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    clientSecret: process.env.NEXT_PUBLIC_GOOGLE_SECRET_ID,
    redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
  },
  resend: {
    apiKey: process.env.NEXT_PUBLIC_RESEND_API_KEY,
    audienceId: process.env.NEXT_PUBLIC_RESEND_AUDIENCE_ID,
  },
  stripe: {
    secretKey: isDev
      ? process.env.NEXT_PUBLIC_STRIPE_SECRET_TEST
      : process.env.NEXT_PUBLIC_STRIPE_SECRET,
    publishableKey: isDev
      ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_TEST
      : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE,
    webhookSecret: isDev
      ? process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET_TEST
      : process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET,
  },
};

// Stripe pricing
export const stripePlans = {
  business: {
    monthly: {
      link: isDev
        ? 'https://buy.stripe.com/test_6oU3cv2qE9uyflOc0O3gk00'
        : 'https://buy.stripe.com/8x200j1bD6J17cj81Wgw004',
      priceId: isDev ? 'price_1RmaFjED2h3xLkqtlPetXvuJ' : 'price_1Rmw5YDKhmgOjeOskzoCSbBt',
      price: 499,
      interval: 'month',
    },
    yearly: {
      link: isDev
        ? 'https://buy.stripe.com/test_9B68wPfdq7mqa1u8OC3gk03'
        : 'https://buy.stripe.com/bJedR92fH7N59kr0zugw005',
      priceId: isDev ? 'price_1RmuxMED2h3xLkqtyEUS0a6M' : 'price_1Rmw5YDKhmgOjeOskzoCSbBt',
      price: 4790.4,
      interval: 'year',
    },
    features: ['Adds ATS integration', 'Contracts', 'Custom branding', 'Dedicated account manager'],
  },
  pro: {
    monthly: {
      link: isDev
        ? 'https://buy.stripe.com/test_9B6bJ1e9m0Y2a1u2qe3gk04'
        : 'https://buy.stripe.com/dRmfZh9I95EX9kr1Dygw002',
      priceId: isDev ? 'price_1RmaF2ED2h3xLkqtIVi6vwBQ' : 'price_1RmvuuDKhmgOjeOsENQLZkW4',
      price: 129,
      interval: 'month',
    },
    yearly: {
      link: isDev
        ? 'https://buy.stripe.com/test_cNiaEX8P2ayCa1u4ym3gk01'
        : 'https://buy.stripe.com/9B68wP5rTaZh0NVcicgw003',
      priceId: isDev ? 'price_1RmuyhED2h3xLkqt7DTYeSqV' : 'price_1Rmw0ODKhmgOjeOsM8jcRZOM',
      price: 1284,
      interval: 'year',
    },
    features: [
      'Includes starter',
      'Priority email & chat support',
      'Team collaboration tools',
      'Custom branding options',
      '24-hour response time',
    ],
  },
  starter: {
    monthly: {
      link: isDev
        ? 'https://buy.stripe.com/test_14A8wP1mA226b5y3ui3gk05'
        : 'https://buy.stripe.com/cNi7sLcUl6J19krcicgw000',
      priceId: isDev ? 'price_1RmaEEED2h3xLkqttvf6IBZB' : 'price_1RmviTDKhmgOjeOsXkdKWlO6',
      price: 99,
      interval: 'month',
    },
    yearly: {
      link: isDev
        ? 'https://buy.stripe.com/test_9B6aEX9T6bCG1uY4ym3gk06'
        : 'https://buy.stripe.com/aFa7sL2fHc3lfIPcicgw001',
      priceId: isDev ? 'price_1Rmv6mED2h3xLkqto3zsBg1o' : 'price_1RmvoADKhmgOjeOsP9VQPBuT',
      price: 480,
      interval: 'year',
    },
    features: [
      'AI scoring',
      'Interview scheduling',
      'Email notifications',
      'Email support',
      '48-hour response time',
    ],
  },
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
