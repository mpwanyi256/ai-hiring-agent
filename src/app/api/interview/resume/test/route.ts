import { NextResponse } from 'next/server';
import { resumeService } from '@/lib/services/resumeService';
import { JobData } from '@/lib/services/jobsService';

export async function GET() {
  try {
    console.log('Testing resume evaluation system...');

    // Mock job data for testing
    const mockJob = {
      id: 'test-job-id',
      title: 'Frontend Developer',
      fields: {
        skills: ['React', 'TypeScript', 'JavaScript', 'CSS'],
        experienceLevel: 'mid',
        traits: ['teamwork', 'problem-solving'],
        jobDescription: 'We are looking for a skilled Frontend Developer with experience in React and TypeScript to join our team.'
      }
    };

    // Mock resume content for testing
    const mockResumeContent = `
John Doe
Frontend Developer
Email: john.doe@example.com

EXPERIENCE:
- 3 years of experience in web development
- Built multiple React applications using TypeScript
- Worked in collaborative team environments
- Solved complex UI/UX problems
- Proficient in JavaScript, CSS, and modern frontend frameworks

SKILLS:
- React.js
- TypeScript
- JavaScript
- CSS3
- HTML5
- Problem-solving
- Team collaboration

EDUCATION:
- Bachelor's in Computer Science
- Completed various frontend development courses
`;

    // Test the evaluation system
    const evaluation = await resumeService.evaluateResume(
      mockResumeContent,
      'test-resume.txt',
      mockJob as JobData
    );

    console.log('Resume evaluation test completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Resume evaluation system is working correctly',
      testResults: {
        evaluation,
        mockJob: {
          title: mockJob.title,
          skills: mockJob.fields.skills,
          experienceLevel: mockJob.fields.experienceLevel
        },
        resumeLength: mockResumeContent.length
      }
    });
  } catch (error) {
    console.error('Resume evaluation test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Resume evaluation test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 