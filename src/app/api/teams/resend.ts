import { NextRequest, NextResponse } from 'next/server';
import { TeamInvite, InvitationStatus } from '../../../types/teams';

export async function POST(req: NextRequest) {
  const { inviteId } = await req.json();
  // TODO: Replace with real DB/email logic
  const invite: TeamInvite = {
    id: inviteId,
    email: 'mock@email.com',
    firstName: 'Mock',
    lastName: 'User',
    companyId: 'mock-company',
    role: 'member',
    status: InvitationStatus.Pending,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  return NextResponse.json(invite);
}
