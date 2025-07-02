import { NextResponse } from 'next/server';

// Mock skills data for development - matching the existing Skill interface
const mockSkills = [
  {
    id: '1',
    name: 'JavaScript',
    description: 'Programming language for web development',
    category: 'Programming Languages',
  },
  {
    id: '2',
    name: 'React',
    description: 'Frontend JavaScript library',
    category: 'Frontend Frameworks',
  },
  {
    id: '3',
    name: 'Node.js',
    description: 'Backend JavaScript runtime',
    category: 'Backend Technologies',
  },
  {
    id: '4',
    name: 'TypeScript',
    description: 'Typed superset of JavaScript',
    category: 'Programming Languages',
  },
  {
    id: '5',
    name: 'Python',
    description: 'General-purpose programming language',
    category: 'Programming Languages',
  },
  {
    id: '6',
    name: 'Next.js',
    description: 'React framework for production',
    category: 'Frontend Frameworks',
  },
  {
    id: '7',
    name: 'SQL',
    description: 'Database query language',
    category: 'Databases',
  },
  {
    id: '8',
    name: 'Git',
    description: 'Version control system',
    category: 'Tools',
  },
  {
    id: '9',
    name: 'AWS',
    description: 'Amazon Web Services cloud platform',
    category: 'Cloud Platforms',
  },
  {
    id: '10',
    name: 'Docker',
    description: 'Containerization platform',
    category: 'DevOps',
  },
];

export async function GET() {
  try {
    // In a real application, you would fetch from a database
    // For now, return mock data
    return NextResponse.json({
      success: true,
      skills: mockSkills,
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch skills',
      },
      { status: 500 }
    );
  }
} 