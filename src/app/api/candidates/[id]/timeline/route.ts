import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  status?: string;
  metadata?: Record<string, any>;
  performer?: {
    name: string;
    role?: string;
  };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const candidateId = params.id;
    const supabase = await createClient();

    // Fetch timeline events from multiple sources
    const timelineEvents: TimelineEvent[] = [];

    // 1. Application events (interviews, evaluations)
    const { data: interviews } = await supabase
      .from('interviews')
      .select(
        `
        id,
        date,
        time,
        status,
        type,
        notes,
        created_at,
        updated_at,
        profiles:interviewer_id (
          first_name,
          last_name
        )
      `,
      )
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (interviews) {
      interviews.forEach((interview) => {
        timelineEvents.push({
          id: `interview-${interview.id}`,
          type: 'interview',
          title: `Interview ${interview.status}`,
          description: `${interview.type || 'Interview'} scheduled for ${interview.date} at ${interview.time}`,
          timestamp: interview.created_at,
          status:
            interview.status === 'completed'
              ? 'success'
              : interview.status === 'cancelled'
                ? 'error'
                : 'info',
          metadata: {
            interview_id: interview.id,
            date: interview.date,
            time: interview.time,
            type: interview.type,
            notes: interview.notes,
          },
          performer: interview.profiles
            ? {
                name: `${interview.profiles.first_name} ${interview.profiles.last_name}`,
                role: 'Interviewer',
              }
            : undefined,
        });
      });
    }

    // 2. Contract offers
    const { data: contracts } = await supabase
      .from('contract_offers')
      .select(
        `
        id,
        status,
        salary_amount,
        salary_currency,
        start_date,
        created_at,
        updated_at,
        rejection_reason,
        contracts (
          title,
          category
        ),
        profiles:sent_by (
          first_name,
          last_name
        )
      `,
      )
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (contracts) {
      contracts.forEach((contract) => {
        timelineEvents.push({
          id: `contract-${contract.id}`,
          type: 'contract',
          title: `Contract ${contract.status}`,
          description:
            contract.status === 'rejected' && contract.rejection_reason
              ? `Contract rejected: ${contract.rejection_reason}`
              : `Contract offer for ${contract.contracts?.title || 'position'} - ${contract.salary_amount} ${contract.salary_currency}`,
          timestamp: contract.created_at,
          status:
            contract.status === 'signed'
              ? 'success'
              : contract.status === 'rejected'
                ? 'error'
                : contract.status === 'sent'
                  ? 'pending'
                  : 'info',
          metadata: {
            contract_id: contract.id,
            salary_amount: contract.salary_amount,
            salary_currency: contract.salary_currency,
            start_date: contract.start_date,
            contract_title: contract.contracts?.title,
            contract_category: contract.contracts?.category,
            rejection_reason: contract.rejection_reason,
          },
          performer: contract.profiles
            ? {
                name: `${contract.profiles.first_name} ${contract.profiles.last_name}`,
                role: 'HR Manager',
              }
            : undefined,
        });
      });
    }

    // 3. Candidate evaluations
    const { data: evaluations } = await supabase
      .from('candidate_evaluations')
      .select(
        `
        id,
        overall_score,
        recommendation,
        created_at,
        profiles:evaluator_id (
          first_name,
          last_name
        )
      `,
      )
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (evaluations) {
      evaluations.forEach((evaluation) => {
        timelineEvents.push({
          id: `evaluation-${evaluation.id}`,
          type: 'evaluation',
          title: 'Candidate Evaluated',
          description: `Overall score: ${evaluation.overall_score}/10 - ${evaluation.recommendation}`,
          timestamp: evaluation.created_at,
          status:
            evaluation.overall_score >= 7
              ? 'success'
              : evaluation.overall_score >= 5
                ? 'warning'
                : 'error',
          metadata: {
            evaluation_id: evaluation.id,
            overall_score: evaluation.overall_score,
            recommendation: evaluation.recommendation,
          },
          performer: evaluation.profiles
            ? {
                name: `${evaluation.profiles.first_name} ${evaluation.profiles.last_name}`,
                role: 'Evaluator',
              }
            : undefined,
        });
      });
    }

    // 4. Status changes from user_activities
    const { data: activities } = await supabase
      .from('user_activities')
      .select(
        `
        id,
        activity_type,
        entity_type,
        description,
        created_at,
        profiles:user_id (
          first_name,
          last_name
        )
      `,
      )
      .eq('entity_id', candidateId)
      .eq('entity_type', 'candidate')
      .in('activity_type', ['status_change', 'note_added', 'application_submitted'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (activities) {
      activities.forEach((activity) => {
        timelineEvents.push({
          id: `activity-${activity.id}`,
          type: activity.activity_type === 'note_added' ? 'note' : 'status_change',
          title:
            activity.activity_type === 'note_added'
              ? 'Note Added'
              : activity.activity_type === 'application_submitted'
                ? 'Application Submitted'
                : 'Status Changed',
          description: activity.description,
          timestamp: activity.created_at,
          status: 'info',
          metadata: {
            activity_id: activity.id,
            activity_type: activity.activity_type,
            entity_type: activity.entity_type,
          },
          performer: activity.profiles
            ? {
                name: `${activity.profiles.first_name} ${activity.profiles.last_name}`,
                role: 'Team Member',
              }
            : undefined,
        });
      });
    }

    // Sort all events by timestamp (most recent first)
    timelineEvents.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return NextResponse.json({
      success: true,
      events: timelineEvents,
      total: timelineEvents.length,
    });
  } catch (error) {
    console.error('Error fetching candidate timeline:', error);
    return NextResponse.json({ error: 'Failed to fetch candidate timeline' }, { status: 500 });
  }
}
