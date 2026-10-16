import { NextResponse } from 'next/server';
import { getApprovedHubs, getApprovedStops } from '@/lib/db/repository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').toLowerCase().trim();
    const mode = searchParams.get('mode');

    const hubs = getApprovedHubs();
    const stops = getApprovedStops();

    let filtered = stops;
    if (mode) {
      filtered = filtered.filter((s) => s.mode === mode);
    }

    if (q) {
      filtered = filtered.filter((s) => {
        const matchesName = s.name_en.toLowerCase().includes(q) || s.name_bn.includes(q);
        const matchesAlias = s.aliases.some((a) => a.toLowerCase().includes(q));
        const hub = hubs.find((h) => h.id === s.hub_id);
        const matchesHub = hub ? (
          hub.name_en.toLowerCase().includes(q) ||
          hub.name_bn.includes(q) ||
          hub.aliases.some((a) => a.toLowerCase().includes(q))
        ) : false;

        return matchesName || matchesAlias || matchesHub;
      });
    }

    return NextResponse.json({
      success: true,
      hubs,
      stops: filtered,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
