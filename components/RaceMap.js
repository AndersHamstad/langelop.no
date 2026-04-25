import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "@changey/react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import Link from "next/link";
import L from "leaflet";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const formatDistance = (distance) => {
  return []
    .concat(distance || [])
    .flatMap((d) => (typeof d === "string" ? d.split(",") : [d]))
    .map((d) => String(d).trim().replace(/[\[\]{}"']/g, ""))
    .filter(Boolean);
};

export default function RaceMap({ races = [] }) {
  const racesWithCoordinates = races.filter((race) => {
    const lat = Number(race.latitude);
    const lng = Number(race.longitude);

    return !Number.isNaN(lat) && !Number.isNaN(lng);
  });

  return (
    <div className="relative z-0 w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      <MapContainer
        center={[64.5, 11]}
        zoom={5}
        scrollWheelZoom={false}
        style={{
          height: "650px",
          width: "100%",
          zIndex: 0,
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
iconSize: L.point(44, 56, true),
iconAnchor: [22, 56],
    });
  }}
>
          {racesWithCoordinates.map((race) => {
            const distances = formatDistance(race.distance);

            return (
              <Marker
                key={race.id || race.slug}
                position={[Number(race.latitude), Number(race.longitude)]}
              >
                <Popup>
  <div className="w-60">
    <h3 className="text-base font-semibold text-gray-900 leading-snug mb-3">
      {race.name}
    </h3>

    <div className="space-y-2 text-sm text-gray-600 mb-4">
      {race.date && (
        <p>
          📅{" "}
          {new Date(race.date).toLocaleDateString("nb-NO", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}

      {race.location && <p>📍 {race.location}</p>}
    </div>

    {distances.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mb-4">
        {distances.map((distance, index) => (
          <span
            key={index}
            className="bg-blue-50 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full"
          >
            {distance}
          </span>
        ))}
      </div>
    )}

    {race.slug && (
      <Link
        href={`/${race.slug}`}
        className="block w-full text-center bg-blue-600 !text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition no-underline"
      >
        Se løp
      </Link>
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