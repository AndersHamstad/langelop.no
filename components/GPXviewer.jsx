// components/GPXViewer.jsx
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-gpx';
import { useEffect } from 'react';

const GPXTrack = ({ gpxUrl }) => {
  const map = useMap();

  useEffect(() => {
    const gpx = new L.GPX(gpxUrl, {
      async: true,
      marker_options: {
        startIconUrl: null,
        endIconUrl: null,
        shadowUrl: null,
        endIconUrl: null,
      }
    });

    gpx.on('loaded', (e) => {
      map.fitBounds(e.target.getBounds());
    });

    gpx.addTo(map);
  }, [gpxUrl, map]);

  return null;
};

export default function GPXViewer({ gpxUrl }) {
  return (
    <div style={{ height: '400px', margin: '1rem 0' }}>
      <MapContainer style={{ height: '100%', width: '100%' }} center={[60, 10]} zoom={13}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <GPXTrack gpxUrl={gpxUrl} />
      </MapContainer>
    </div>
  );
}
