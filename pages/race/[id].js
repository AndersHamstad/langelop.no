
import { supabase } from '../../lib/supabaseClient'

export async function getServerSideProps({ params }) {
  const { data: race } = await supabase
    .from('races')
    .select('*')
    .eq('id', params.id)
    .single()

  return { props: { race } }
}

export default function RacePage({ race }) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{race.name}</h1>
      <p><strong>Dato:</strong> {race.date}</p>
      <p><strong>Distanse:</strong> {race.distance_km} km</p>
      <p><strong>Høydemeter:</strong> {race.elevation_m} m</p>
      <p><strong>Sted:</strong> {race.location}</p>
      <a className="text-blue-600 underline" href={race.url} target="_blank" rel="noopener noreferrer">Nettside</a>
    </div>
  )
}
