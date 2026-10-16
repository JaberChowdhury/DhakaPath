import { NextResponse } from 'next/server';
import { planTrip } from '@/lib/routing/planner';
import { PlanRequest } from '@/types/api';

export async function POST(request: Request) {
  try {
    const body: PlanRequest = await request.json();

    if (!body.originHubId || !body.destinationHubId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: originHubId and destinationHubId are mandatory.',
        },
        { status: 400 }
      );
    }

    const result = planTrip(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
