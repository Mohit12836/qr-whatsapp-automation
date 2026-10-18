import { NextRequest, NextResponse } from 'next/server';
import { OpportunityScorer } from '@/lib/opportunities/opportunity-scorer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerPhone, customerName, messages, hasOptedIn } = body;

    if (!customerPhone || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'customerPhone and messages array required' }, { status: 400 });
    }

    const cards = OpportunityScorer.evaluateConversation(
      customerPhone,
      customerName || 'Customer',
      messages,
      hasOptedIn !== undefined ? Boolean(hasOptedIn) : true
    );

    return NextResponse.json({
      success: true,
      count: cards.length,
      opportunities: cards,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Opportunity evaluation failed' },
      { status: 500 }
    );
  }
}
