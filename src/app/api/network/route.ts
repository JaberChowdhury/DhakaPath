import { NextResponse } from 'next/server';
import { getNetworkSnapshot } from '@/lib/db/repository';

export async function GET() {
  try {
    const snapshot = getNetworkSnapshot();
    return NextResponse.json({
      success: true,
      ...snapshot,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
