import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Cache simple endpoint working',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
} 