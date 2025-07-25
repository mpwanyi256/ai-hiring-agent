import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // TODO: Replace with real DB logic
  return NextResponse.json({ members: [], invites: [] });
}
