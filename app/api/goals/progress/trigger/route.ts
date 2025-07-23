// API Route: /api/goals/progress/trigger
// PBI 25 - Task 25-3: Forçar execução do tracking diário (admin/cron)

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';

// POST /api/goals/progress/trigger - Executa o script de tracking diário
export async function POST(request: NextRequest): Promise<NextResponse> {
  return new Promise<NextResponse>((resolve) => {
    exec('node scripts/adset-progress-tracking.js', (error, stdout, stderr) => {
      if (error) {
        resolve(NextResponse.json({ success: false, error: error.message, stderr }, { status: 500 }));
      } else {
        resolve(NextResponse.json({ success: true, output: stdout }));
      }
    });
  });
} 