require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocode(place) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    place
  )}&format=json&limit=1`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "langelop.no",
    },
  });

  const data = await res.json();

  if (!data.length) return null;

  return {
    latitude: Number(data[0].lat),
    longitude: Number(data[0].lon),
  };
}

async function run() {
  const { data: races, error } = await supabase
    .from("races")
    .select("id, name, location_query, latitude, longitude")
    .is("latitude", null)
    .not("location_query", "is", null);

  if (error) {
    console.error(error);
    return;
  }

  for (const race of races) {
    console.log("Henter koordinater for:", race.name, race.location_query);

    const coords = await geocode(race.location_query);

    if (!coords) {
      console.log("Fant ikke:", race.location_query);
      continue;
    }

    const { error: updateError } = await supabase
      .from("races")
      .update({
        latitude: coords.latitude,
        longitude: coords.longitude,
      })
      .eq("id", race.id);

    if (updateError) {
      console.error("Feil ved oppdatering:", race.name, updateError);
    } else {
      console.log("Oppdatert:", race.name, coords);
    }

    await sleep(1200);
  }
}

run();