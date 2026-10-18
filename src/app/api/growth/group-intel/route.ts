import { NextRequest, NextResponse } from 'next/server';
import { GroupIntelEngine } from '@/lib/group-intel/group-intel-engine';

const groupRadar = new GroupIntelEngine([
  { groupId: 'grp_textile_1', groupName: 'Textile Wholesale Hub', memberCount: 1250 },
  { groupId: 'grp_solar_1', groupName: 'Solar Installers Network', memberCount: 940 },
  { groupId: 'grp_fmcg_1', groupName: 'FMCG Distributors Club', memberCount: 1500 },
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'metrics';

  if (type === 'metrics') {
    return NextResponse.json({
      success: true,
      data: groupRadar.getRadarMetrics(),
    });
  }

  if (type === 'signals') {
    const signals = groupRadar.getDemandSignals();
    return NextResponse.json({
      success: true,
      data: signals,
    });
  }

  if (type === 'topics') {
    const topics = groupRadar.clusterFaqTopics();
    return NextResponse.json({
      success: true,
      data: topics,
    });
  }

  return NextResponse.json({ success: false, error: 'Invalid type parameter' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const signal = groupRadar.ingestGroupMessage(body);
    return NextResponse.json({
      success: true,
      signalDetected: !!signal,
      data: signal,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
