// lib/structuredData.js
// Genererer schema.org Event-markup for løpssider.
// Gir rike søkeresultater i Google med dato, sted og arrangør.

export function buildRaceJsonLd(race) {
  const distances = Array.isArray(race.distance)
    ? race.distance
    : race.distance?.split(',') || [];

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: race.name,
    description: race.description || undefined,
    startDate: race.date,
    location: {
      '@type': 'Place',
      name: race.location,
      address: {
        '@type': 'PostalAddress',
        addressRegion: race.region,
        addressCountry: 'NO',
      },
    },
    url: race.url || undefined,
    image: race.image_url || undefined,
    sport: 'Running',
    offers: distances.map((d) => ({
      '@type': 'Offer',
      name: String(d).trim().replace(/[[\]"']/g, ''),
      url: race.url || undefined,
    })),
    organizer: {
      '@type': 'Organization',
      name: race.name,
      url: race.url || undefined,
    },
  };
}