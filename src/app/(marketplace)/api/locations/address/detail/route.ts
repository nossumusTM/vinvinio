import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const AUTOCOMPLETE_ENDPOINT =
  'https://maps.googleapis.com/maps/api/place/autocomplete/json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const country = searchParams.get('country') ?? undefined;

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Missing Google Maps API key for address autocomplete');
    return NextResponse.json(
      { predictions: [] },
      { status: 500, statusText: 'Missing Google Maps API key' },
    );
  }

  // niente query → niente suggerimenti
  if (!query || !query.trim()) {
    return NextResponse.json({ predictions: [] }, { status: 200 });
  }

  try {
    const params = new URLSearchParams({
      input: query.trim(),
      key: apiKey,
      language: 'it',
      // 👇 importantissimo per "Via Nazionale" senza numero:
      // prende qualsiasi risultato geocodabile (vie, strade, civici)
      types: 'geocode',
    });

    if (country) {
      // il client ti passa il codice paese (IT, FR, ecc.)
      params.set('components', `country:${country}`);
    }

    const response = await fetch(
      `${AUTOCOMPLETE_ENDPOINT}?${params.toString()}`,
      {
        // opzionale, ma utile se vuoi evitare cache strane
        cache: 'no-store',
      } as RequestInit,
    );

    if (!response.ok) {
      console.error(
        'Failed to call Google Places Autocomplete',
        response.status,
        response.statusText,
      );
      return NextResponse.json({ predictions: [] }, { status: 200 });
    }

    const payload = await response.json();

    const okStatuses = ['OK', 'ZERO_RESULTS'];

    if (!okStatuses.includes(payload?.status)) {
      console.error(
        'Places Autocomplete error',
        payload?.status,
        payload?.error_message,
      );
      // restituisco comunque un array vuoto per non rompere il client
      return NextResponse.json({ predictions: [] }, { status: 200 });
    }

    const predictions = Array.isArray(payload?.predictions)
      ? payload.predictions
      : [];

    return NextResponse.json({ predictions }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch address suggestions', error);
    return NextResponse.json({ predictions: [] }, { status: 500 });
  }
}
