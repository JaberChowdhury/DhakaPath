import { NextResponse } from 'next/server';
import { getActiveAlerts } from '@/lib/db/repository';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const voteType = body.voteType; // 'confirm' | 'dispute' | 'resolved'

    const alerts = getActiveAlerts();
    const alert = alerts.find((a) => a.id === id);

    if (!alert) {
      return NextResponse.json({ success: false, error: 'Alert not found' }, { status: 404 });
    }

    if (voteType === 'confirm') {
      alert.upvotes = (alert.upvotes || 0) + 1;
    } else if (voteType === 'dispute') {
      alert.downvotes = (alert.downvotes || 0) + 1;
    } else if (voteType === 'resolved') {
      alert.lifecycle_stage = 'resolved';
    }

    return NextResponse.json({
      success: true,
      message: `Vote recorded for alert ${id}`,
      alert,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
