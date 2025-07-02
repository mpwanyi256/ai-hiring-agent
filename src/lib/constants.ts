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
}

export const ai = {
    openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
    model: 'gpt-4o-mini', // Cost-effective model for question generation
    maxTokens: 2000,
    temperature: 0.7, // Balanced creativity for question generation
}
