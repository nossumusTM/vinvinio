import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const country = searchParams.get('country') ?? undefined;

  if (!query || query.trim().length < 3) {
    return NextResponse.json({ predictions: [] }, { status: 200 });
  }

  const params = new URLSearchParams({
    format: 'json',
    q: query.trim(),
    addressdetails: '1',
    limit: '7',
    dedupe: '1',
  });

  // se hai il country code (IT, FR, ecc.), limitalo
  if (country) {
    params.set('countrycodes', country.toLowerCase());
  }

  const url = `${NOMINATIM_ENDPOINT}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'vinvin-app/1.0 (https://vinvin.app)',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(
        'Nominatim address search failed',
        response.status,
        response.statusText,
      );
      return NextResponse.json({ predictions: [] }, { status: 200 });
    }

    const payload = await response.json();

    // const predictions = Array.isArray(payload)
    //   ? payload.slice(0, 7).map((item: any) => {
    //       const address = item.address ?? {};
    //       const mainText =
    //         address.road ||
    //         address.pedestrian ||
    //         address.footway ||
    //         item.display_name;

    //       const city =
    //         address.city ||
    //         address.town ||
    //         address.village ||
    //         address.suburb;

    //       const secondaryParts = [
    //         city,
    //         address.state,
    //         address.postcode,
    //         address.country,
    //       ].filter(Boolean);

    //       return {
    //         // campo usato come key nel dropdown
    //         place_id: item.place_id,
    //         description: item.display_name,
    //         structured_formatting: {
    //           main_text: mainText,
    //           secondary_text: secondaryParts.join(', '),
    //         },
    //         // ci teniamo i dati “grezzi” per riempire i campi dopo il click
    //         _nominatim: {
    //           address,
    //           lat: item.lat,
    //           lon: item.lon,
    //         },
    //       };
    //     })
    //   : [];

    const list = Array.isArray(payload) ? [...payload] : [];

    // ordina per "importance" (campo di Nominatim) dal più alto al più basso
    list.sort((a: any, b: any) => (b.importance ?? 0) - (a.importance ?? 0));

    const predictions = list.slice(0, 7).map((item: any) => {
    const address = item.address ?? {};
    const mainText =
        address.road ||
        address.pedestrian ||
        address.footway ||
        item.display_name;

    const city =
        address.city ||
        address.town ||
        address.village ||
        address.suburb;

    const secondaryParts = [
        city,
        address.state,
        address.postcode,
        address.country,
    ].filter(Boolean);

    return {
        place_id: item.place_id,
        description: item.display_name,
        structured_formatting: {
        main_text: mainText,
        secondary_text: secondaryParts.join(', '),
        },
        _nominatim: {
        address,
        lat: item.lat,
        lon: item.lon,
        },
    };
    });

    return NextResponse.json({ predictions }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch address suggestions from Nominatim', error);
    return NextResponse.json({ predictions: [] }, { status: 500 });
  }
}
