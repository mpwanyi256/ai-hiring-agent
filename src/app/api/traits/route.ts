import { NextResponse } from 'next/server';

// Mock traits data for development - matching the existing Trait interface
const mockTraits = [
  {
    id: '1',
    name: 'Leadership',
    description: 'Ability to guide and motivate teams',
    category: 'Management',
  },
  {
    id: '2',
    name: 'Problem Solving',
    description: 'Analytical thinking and solution-oriented approach',
    category: 'Cognitive',
  },
  {
    id: '3',
    name: 'Communication',
    description: 'Clear and effective verbal and written communication',
    category: 'Interpersonal',
  },
  {
    id: '4',
    name: 'Adaptability',
    description: 'Flexibility and openness to change',
    category: 'Personal',
  },
  {
    id: '5',
    name: 'Teamwork',
    description: 'Collaborative working style',
    category: 'Interpersonal',
  },
  {
    id: '6',
    name: 'Initiative',
    description: 'Proactive and self-motivated approach',
    category: 'Personal',
  },
  {
    id: '7',
    name: 'Time Management',
    description: 'Efficient prioritization and organization',
    category: 'Professional',
  },
  {
    id: '8',
    name: 'Creativity',
    description: 'Innovative thinking and original ideas',
    category: 'Cognitive',
  },
  {
    id: '9',
    name: 'Decision Making',
    description: 'Ability to make sound decisions under pressure',
    category: 'Cognitive',
  },
  {
    id: '10',
    name: 'Emotional Intelligence',
    description: 'Understanding and managing emotions effectively',
    category: 'Interpersonal',
  },
];

export async function GET() {
  try {
    // In a real application, you would fetch from a database
    // For now, return mock data
    return NextResponse.json({
      success: true,
      traits: mockTraits,
    });
  } catch (error) {
    console.error('Error fetching traits:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch traits',
      },
      { status: 500 }
    );
  }
} 