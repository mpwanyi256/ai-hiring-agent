import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { candidateIds, action, profileId } = await request.json();

    if (!profileId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Profile ID is required' 
      }, { status: 400 });
    }

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Candidate IDs are required' 
      }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Action is required' 
      }, { status: 400 });
    }

    // Verify that all candidates belong to the user's jobs
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select(`
        id,
        jobs!inner(
          profile_id
        )
      `)
      .in('id', candidateIds)
      .eq('jobs.profile_id', profileId);

    if (candidatesError) {
      throw new Error(candidatesError.message);
    }

    if (!candidates || candidates.length !== candidateIds.length) {
      return NextResponse.json({ 
        success: false, 
        error: 'Some candidates not found or access denied' 
      }, { status: 403 });
    }

    let updateData: any = {};
    let successMessage = '';

    // Define the action and corresponding data update
    switch (action) {
      case 'shortlist':
        updateData = { status: 'shortlisted' };
        successMessage = 'shortlisted';
        break;
      case 'reject':
        updateData = { status: 'rejected' };
        successMessage = 'rejected';
        break;
      case 'archive':
        updateData = { status: 'archived' };
        successMessage = 'archived';
        break;
      case 'unarchive':
        updateData = { status: 'active' };
        successMessage = 'unarchived';
        break;
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 });
    }

    // Update candidates with the new status
    const { error: updateError } = await supabase
      .from('candidates')
      .update(updateData)
      .in('id', candidateIds);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${successMessage} ${candidateIds.length} candidate(s)`,
      updatedCount: candidateIds.length,
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to perform bulk action' 
    }, { status: 500 });
  }
} 