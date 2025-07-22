import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  // TODO: Replace with real DB logic
  return NextResponse.json({ success: true, userId });
}
