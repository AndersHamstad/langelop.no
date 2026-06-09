import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "@changey/react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import Link from "next/link";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;

const makePin = (color) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 40" width="28" height="40">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26S28 24.5 28 14C28 6.27 21.73 0 14 0z"
      fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="14" cy="14" r="5.5" fill="white"/>
  </svg>`;

const ultraIcon = L.divIcon({
  html: makePin("#2563eb"),
  className: "race-marker-wrapper",
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -42],
});

const backyardIcon = L.divIcon({
  html: makePin("#ea580c"),
  className: "race-marker-wrapper",
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -42],
});

const formatDistance = (distance) =>
  []
    .concat(distance || [])
    .flatMap((d) => (typeof d === "string" ? d.split(",") : [d]))
    .map((d) => String(d).trim().replace(/[\[\]{}"']/g, ""))
    .filter(Boolean);

const formatDate = (dateStr) => {
  try {
    return new Date(dateStr).toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export default function RaceMap({ races = [] }) {
  const racesWithCoords = races.filter((r) => {
    const lat = Number(r.latitude);
    const lng = Number(r.longitude);
    return !Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0;
  });

  const missing = races.length - racesWithCoords.length;

  return (
    <div className="relative z-0 w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      {/* Info bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            Ultra
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
            Backyard
          </span>
        </div>
        <span className="text-xs text-gray-400 text-right">
          {racesWithCoords.length} løp på kartet
          {missing > 0 && <span className="hidden sm:inline"> · {missing} mangler koordinater</span>}
        </span>
      </div>

      <MapContainer
        center={[64.5, 14]}
        zoom={5}
        scrollWheelZoom={false}
        style={{ height: "620px", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MarkerClusterGroup
          chunkedLoading
          disableClusteringAtZoom={7}
          maxClusterRadius={35}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount();
            return L.divIcon({
              html: `<div class="langelop-cluster-pin"><span>${count}</span></div>`,
              className: "langelop-cluster-wrapper",
              iconSize: L.point(36, 36, true),
              iconAnchor: [18, 18],
            });
          }}
        >
          {racesWithCoords.map((race) => {
            const distances = formatDistance(race.distance);
            const isBackyard = race.type === "Backyard";
            const accentClass = isBackyard
              ? "bg-orange-50 text-orange-700"
              : "bg-blue-50 text-blue-700";

            return (
              <Marker
                key={race.id || race.slug}
                position={[Number(race.latitude), Number(race.longitude)]}
                icon={isBackyard ? backyardIcon : ultraIcon}
              >
                <Popup minWidth={220} maxWidth={260}>
                  <div className="w-56 font-sans">
                    {/* Type badge */}
                    <div className={`px-3 pt-3 pb-1`}>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${accentClass}`}>
                        {race.type || "Ultra"}
                      </span>
                    </div>

                    {/* Name */}
                    <div className="px-3 pt-1 pb-2">
                      <h3 className="text-sm font-bold text-gray-900 leading-snug">
                        {race.name}
                      </h3>
                    </div>

                    {/* Meta */}
                    <div className="px-3 pb-3 space-y-1.5 text-xs text-gray-500">
                      {race.date && (
                        <p className="flex items-center gap-1.5">
                          <span>📅</span> {formatDate(race.date)}
                        </p>
                      )}
                      {race.location && (
                        <p className="flex items-center gap-1.5">
                          <span>📍</span> {race.location}{race.region ? ` · ${race.region}` : ""}
                        </p>
                      )}
                    </div>

                    {/* Distance badges */}
                    {distances.length > 0 && (
                      <div className="px-3 pb-3 flex flex-wrap gap-1">
                        {distances.map((d, i) => (
                          <span
                            key={i}
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${accentClass}`}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    {race.slug && (
                      <div className="px-3 pb-3">
                        <Link
                          href={`/${race.slug}`}
                          className={`block w-full text-center text-white text-xs font-semibold px-4 py-2 rounded-lg no-underline transition ${
                            isBackyard
                              ? "bg-orange-500 hover:bg-orange-600"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          Se løp →
                        </Link>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
