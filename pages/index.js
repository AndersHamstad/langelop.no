import { supabase } from '../lib/supabaseClient';
import { useState, useEffect, useRef } from 'react';
import { Range } from 'react-range';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { nb } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Footer from '../components/Footer';

export async function getServerSideProps() {
  const { data: races, error } = await supabase.from('races').select('*');
  return { props: { races: races || [] } };
}

export default function Home({ races }) {
  const [distanceRange, setDistanceRange] = useState([0, 200]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [regionFilter, setRegionFilter] = useState([]);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [sortMethod, setSortMethod] = useState('date');
  const dropdownRef = useRef(null);
  const racesPerPage = 12;
  const maxSliderValue = 200;
  const [onlyUpcoming, setOnlyUpcoming] = useState(true);

  const uniqueRegions = [...new Set(races.map(r => r.region).filter(Boolean))].sort();

  const nullstillFilter = () => {
    setSearchQuery('');
    setDistanceRange([0, 300]);
    setStartDate(null);
    setEndDate(null);
    setRegionFilter([]);
    setCurrentPage(1);
  };

  const handleRegionChange = (region) => {
    if (regionFilter.includes(region)) {
      setRegionFilter(regionFilter.filter(r => r !== region));
    } else {
      setRegionFilter([...regionFilter, region]);
    }
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "d. MMMM yyyy", { locale: nb });
    } catch {
      return dateString;
    }
  };

  const filteredRaces = races
  .filter((race) => {
    const matchesSearch = race.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDistance = Array.isArray(race.distance_numeric) &&
      race.distance_numeric.some(num =>
        distanceRange[1] === maxSliderValue
          ? num >= distanceRange[0]
          : num >= distanceRange[0] && num <= distanceRange[1]
      );

    const matchesDate = (() => {
      if (!startDate && !endDate) return true;
      try {
        const date = parseISO(race.date);
        if (startDate && isBefore(date, startDate)) return false;
        if (endDate && isAfter(date, endDate)) return false;
        return true;
      } catch {
        return false;
      }
    })();

    const matchesRegion = regionFilter.length === 0 || regionFilter.includes(race.region);

    const matchesUpcoming = !onlyUpcoming || (race.date && new Date(race.date) >= new Date());

    return matchesSearch && matchesDistance && matchesDate && matchesRegion && matchesUpcoming;
  })
  .sort((a, b) => {
    try {
      if (sortMethod === "distanceAsc") {
        return (a.distance_numeric?.[0] || 0) - (b.distance_numeric?.[0] || 0);
      }
      if (sortMethod === "distanceDesc") {
        return (b.distance_numeric?.[0] || 0) - (a.distance_numeric?.[0] || 0);
      }
      return new Date(a.date) - new Date(b.date);
    } catch {
      return 0;
    }
  });

  const totalPages = Math.ceil(filteredRaces.length / racesPerPage);
  const currentRaces = filteredRaces.slice((currentPage - 1) * racesPerPage, currentPage * racesPerPage);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setRegionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative bg-[url('/hero-2.jpg')] bg-cover bg-[position:center_60%] h-[55vh] flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center px-4 w-full">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Ultraløp i Norge</h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
          🏃Finn ditt neste eventyr
          </p>
          <input
            type="text"
            placeholder="Søk etter løp..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="mt-6 w-full max-w-md mx-auto px-4 py-2 rounded-lg text-black text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </section>

      {/* Innhold */}
      <div className="bg-gray-100 pt-5 px-4 pb-12 min-h-screen">
        <div className="max-w-7xl mx-auto md:flex gap-8">

          {/* Filterkolonne */}
          <div className="md:w-1/5 mb-8 md:mb-0">
            <div className="bg-white p-6 rounded-xl shadow space-y-6 sticky top-[15px]">
              {/* Sortering */}
              <div>
                <label className="block text-sm text-gray-600 mb-2"></label>
                <select
  value={sortMethod}
  onChange={(e) => setSortMethod(e.target.value)}
  className="w-full max-w-[188px] px-3 py-2 rounded border border-gray-300 text-sm text-gray-700"
>
                  <option value="date">Sorter etter dato</option>
                  <option value="distanceAsc">Distanse (lav–høy)</option>
                  <option value="distanceDesc">Distanse (høy–lav)</option>
                </select>
              </div>

              {/* Distanse-filter */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                Distanse: <span className="font-medium">
                {distanceRange[0]}–{distanceRange[1] === maxSliderValue ? '200+' : distanceRange[1]} km
                </span>
                </label>
                <Range
                  step={1}
                  min={0}
                  max={maxSliderValue}
                  values={distanceRange}
                  onChange={(range) => {
                    setDistanceRange(range);
                    setCurrentPage(1);
                  }}
                  renderTrack={({ props, children }) => (
                    <div {...props} className="h-2 bg-gray-200 rounded-full">
                      {children}
                    </div>
                  )}
                  renderThumb={({ props }) => (
                    <div {...props} className="w-5 h-5 bg-blue-500 rounded-full shadow border border-white" />
                  )}
                />
              </div>

              {/* Dato-filter */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tidsperiode:</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => { setStartDate(date); setCurrentPage(1); }}
                  dateFormat="dd.MM.yyyy"
                  placeholderText="Velg startdato"
                  className="w-full px-3 py-2 mb-2 rounded border border-gray-300 text-sm text-gray-700"
                />
                <label className="block text-sm text-gray-600 mb-1"></label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => { setEndDate(date); setCurrentPage(1); }}
                  dateFormat="dd.MM.yyyy"
                  placeholderText="Velg sluttdato"
                  className="w-full px-3 py-2 rounded border border-gray-300 text-sm text-gray-700"
                />
              </div>

              {/* Region-filter */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm text-gray-600 mb-1">Område</label>
                <div
                  onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                  className="w-full max-w-[188px] h-[38px] px-3 py-2 border rounded border-gray-300 text-sm text-gray-700 bg-white flex items-center cursor-pointer"
                >
                  {regionFilter.length === 0 ? "Velg fylke" : regionFilter.join(", ")}
                </div>
                {regionDropdownOpen && (
                  <div className="absolute z-10 mt-2 w-full max-h-48 overflow-y-auto bg-white border border-gray-300 rounded shadow-md p-2 space-y-1">
                    {uniqueRegions.map((region) => (
                      <label key={region} className="flex items-center space-x-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={regionFilter.includes(region)}
                          onChange={() => handleRegionChange(region)}
                          className="rounded text-blue-600"
                        />
                        <span>{region}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
  <input
    type="checkbox"
    checked={onlyUpcoming}
    onChange={() => { setOnlyUpcoming(!onlyUpcoming); setCurrentPage(1); }}
    className="rounded text-blue-600"
  />
  <label className="text-sm text-gray-700">Vis kun kommende løp</label>
</div>

              {/* Nullstill-filter */}
              <div>
                <button
                  onClick={nullstillFilter}
                  className="text-sm text-blue-600 underline hover:text-blue-800"
                >
                  Nullstill filter
                </button>
              </div>
            </div>
          </div>

          {/* Høyrekolonne – Kortvisning */}
          <div className="md:w-3/4">
            <p className="text-gray-600 mb-4 text-sm">
              Viser <span className="font-medium">{filteredRaces.length}</span> løp basert på dine kriterier.
            </p>

            {currentRaces.length === 0 ? (
              <p className="text-gray-600">Ingen løp funnet.</p>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 items-stretch">
  {currentRaces.map((race) => (
    <a
      key={race.id}
      href={race.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col justify-between h-full bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6 border border-gray-200 hover:border-gray-300"
    >
      <div>
      <h2 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">{race.name}</h2>
        <p className="text-sm text-gray-600 mb-1">{formatDate(race.date)}</p>

        <div className="flex flex-wrap gap-2 mb-2">
          {(Array.isArray(race.distance) ? race.distance : race.distance?.split(",") || []).map((d, i) => (
            <span
              key={i}
              className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded"
            >
              {d.trim().replace(/[\[\]"']/g, '')}
            </span>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-auto">📍 {race.location}</p>
    </a>
  ))}
</div>

                {/* Paginering */}
                <div className="flex justify-center mt-10 space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer /> {/* 👈 legger footeren helt nederst på siden */}
    </>
  );
}