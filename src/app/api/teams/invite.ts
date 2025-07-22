import { NextRequest, NextResponse } from 'next/server';
import { TeamInvite, InvitationStatus } from '../../../types/teams';

export async function POST(req: NextRequest) {
  const body = await req.json();
  // TODO: Replace with real DB/email logic
  const invite: TeamInvite = {
    id: 'mock-id',
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    companyId: body.companyId || 'mock-company',
    role: body.role,
    status: InvitationStatus.Pending,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  return NextResponse.json(invite);
}
