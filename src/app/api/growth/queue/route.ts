import { NextRequest, NextResponse } from 'next/server';
import { ResilientQueueEngine } from '@/lib/queue/resilient-queue';

// Singleton instance for the process
const globalQueue = new ResilientQueueEngine();

export async function GET() {
  const status = globalQueue.getQueueStatus();
  return NextResponse.json({
    success: true,
    data: status,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, job } = body;

    if (action === 'enqueue') {
      const enqueued = globalQueue.enqueueJob({
        type: job.type,
        payload: job.payload,
        chatId: job.chatId,
        maxAttempts: job.maxAttempts,
      });
      return NextResponse.json({ success: true, job: enqueued });
    }

    if (action === 'check_idempotency') {
      const res = globalQueue.checkAndClaimIdempotency(body.key);
      return NextResponse.json({ success: true, ...res });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
