import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const url = `${NOMINATIM_ENDPOINT}?format=json&addressdetails=1&limit=7&dedupe=1&q=${encodeURIComponent(
    query.trim(),
  )}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'vuola-app/1.0 (https://vuola.app)',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ suggestions: [] }, { status: response.status });
    }

    const payload = await response.json();

    const suggestions = Array.isArray(payload)
      ? payload.slice(0, 7).map((item: any) => ({
          id: item.place_id,
          label: item.display_name,
          description: [item.address?.road, item.address?.city || item.address?.town, item.address?.country]
            .filter(Boolean)
            .join(', '),
        }))
      : [];

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Failed to fetch meeting point suggestions', error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
