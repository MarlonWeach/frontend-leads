import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Cache test endpoint working from dashboard folder',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
} 