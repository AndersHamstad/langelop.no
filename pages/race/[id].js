import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import Footer from '../../components/Footer';

export async function getServerSideProps({ params }) {
  const { data: race } = await supabase
    .from('races')
    .select('*')
    .eq('id', params.id)
    .single();

  return { props: { race } };
}

export default function RacePage({ race }) {
  const formatDate = (date) => {
    try {
      return format(new Date(date), "d. MMMM yyyy", { locale: nb });
    } catch {
      return date;
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow">
  <div className="max-w-7xl mx-auto px-3 py-4 flex justify-between items-center">
    <a href="/" className="flex items-center space-x-2">
      <img src="/logo.png" alt="langeløp.no logo" className="h-10 w-15" />
      <h2 className="text-xl font-bold text-black mb-1">langelop.no</h2>
    </a>
  </div>
</header>

      {/* Innhold */}
      <main className="bg-gray-50 py-10 px-4 min-h-screen">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">{race.name}</h1>
          <p className="text-gray-600">{formatDate(race.date)}</p>

          {race.image_url && (
            <img
              src={race.image_url}
              alt={race.name}
              className="w-full h-60 object-cover rounded-lg shadow"
            />
          )}

          <div className="space-y-2 text-sm text-gray-800">
            <p><strong>📍 Sted:</strong> {race.location}</p>
            <p><strong>📌 Fylke:</strong> {race.region}</p>

            <p className="flex flex-wrap gap-2">
              <strong>🏃 Distanser:</strong>{" "}
              {(Array.isArray(race.distance) ? race.distance : race.distance?.split(",") || []).map((d, i) => (
                <span
                  key={i}
                  className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded"
                >
                  {d.trim().replace(/[\[\]"']/g, '')}
                </span>
              ))}
            </p>

            <p><strong>⛰️ Høydemeter:</strong> {race.elevation_m || 'Ukjent'}</p>

            {race.url && (
              <p>
                <strong>🌐 Nettside:</strong>{" "}
                <a href={race.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  {race.url}
                </a>
              </p>
            )}
          </div>

          <div className="pt-6 border-t">
            <h2 className="text-lg font-semibold mb-1">Del din erfaring (kommer snart)</h2>
            <p className="text-gray-500 text-sm">
              Her kommer kommentarfelt, vurderinger og tips om utstyr og løpserfaringer.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}