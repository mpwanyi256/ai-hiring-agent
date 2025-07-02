import { NextRequest, NextResponse } from 'next/server';

// Mock job templates data for development - matching the existing JobTemplate interface
const mockJobTemplates = [
  {
    id: '1',
    name: 'Frontend Developer Template',
    title: 'Senior Frontend Developer',
    fields: {
      skills: ['JavaScript', 'React', 'TypeScript', 'CSS'],
      experienceLevel: 'senior',
      traits: ['Problem Solving', 'Communication', 'Teamwork'],
      jobDescription: 'We are looking for an experienced Frontend Developer to join our team and build amazing user interfaces...',
      customFields: {
        'Expected Salary': {
          value: 'Competitive salary based on experience',
          inputType: 'text'
        }
      }
    },
    interview_format: 'text',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Backend Developer Template',
    title: 'Backend Engineer',
    fields: {
      skills: ['Node.js', 'Python', 'SQL', 'Docker'],
      experienceLevel: 'mid',
      traits: ['Problem Solving', 'Initiative', 'Time Management'],
      jobDescription: 'Join our backend team to build scalable server-side applications and APIs...',
      customFields: {
        'Remote Work': {
          value: 'Hybrid or fully remote options available',
          inputType: 'text'
        }
      }
    },
    interview_format: 'text',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Full Stack Developer Template',
    title: 'Full Stack Developer',
    fields: {
      skills: ['JavaScript', 'React', 'Node.js', 'SQL'],
      experienceLevel: 'mid',
      traits: ['Adaptability', 'Communication', 'Problem Solving'],
      jobDescription: 'We need a versatile full stack developer who can work on both frontend and backend technologies...',
      customFields: {}
    },
    interview_format: 'video',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function GET() {
  try {
    // In a real application, you would fetch from a database
    // and filter by user profile
    return NextResponse.json({
      success: true,
      templates: mockJobTemplates,
    });
  } catch (error) {
    console.error('Error fetching job templates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch job templates',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, title, fields, interviewFormat } = body;

    // Validate required fields
    if (!name || !title || !fields || !interviewFormat) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // In a real application, you would save to database
    const newTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      title,
      fields,
      interview_format: interviewFormat,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // For now, just return the created template
    return NextResponse.json({
      success: true,
      template: newTemplate,
    });
  } catch (error) {
    console.error('Error creating job template:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create job template',
      },
      { status: 500 }
    );
  }
} 