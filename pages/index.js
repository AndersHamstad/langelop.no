// pages/index.js

// === Import dependencies ===
import { supabase } from '../lib/supabaseClient';
import { useState, useEffect, useRef } from 'react';
import { Range } from 'react-range';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { nb } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Footer from '../components/Footer';
import { useRouter } from 'next/router';
import { CalendarToggle } from '../components/CalendarToggle'; // ⬅️ kalenderkomponenten

// === Data fetching on server ===
export async function getServerSideProps() {
  const { data: races, error } = await supabase.from('races').select('*');
  return { props: { races: races || [] } };
}

// === Main component ===
export default function Home({ races }) {
  const router = useRouter();

  // -- State declarations ------------------------------------------
  const [distanceRange, setDistanceRange] = useState([0, 200]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [regionFilter, setRegionFilter] = useState([]);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [sortMethod, setSortMethod] = useState('date');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [onlyUpcoming, setOnlyUpcoming] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const dropdownRef = useRef(null);
  const racesPerPage = 12;
  const maxSliderValue = 200;

  // Hjelpefunksjon for å forkorte lange status-tekster i ribbons
  const ribbonText = (note) => {
    if (!note) return '';
    const value = note.toLowerCase();

    if (value === 'få plasser igjen') return 'Få plasser';
    if (value === 'utsolgt') return 'Utsolgt';
    if (value === 'snart') return 'Snart';

    // fallback: vis original tekst
    return note;
  };

  // -- Derive unique regions for filter ---------------------------
  const uniqueRegions = [...new Set(races.map(r => r.region).filter(Boolean))].sort();

  // -- Handlers ----------------------------------------------------

  // Reset all filters to defaults
  const nullstillFilter = () => {
    setSearchQuery('');
    setDistanceRange([0, maxSliderValue]);
    setStartDate(null);
    setEndDate(null);
    setRegionFilter([]);
    setCurrentPage(1);
  };

  // Toggle region selection
  const handleRegionChange = (region) => {
    if (regionFilter.includes(region)) {
      setRegionFilter(regionFilter.filter(r => r !== region));
    } else {
      setRegionFilter([...regionFilter, region]);
    }
    setCurrentPage(1);
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "d. MMMM yyyy", { locale: nb });
    } catch {
      return dateString;
    }
  };

  // -- Filtering and sorting logic ---------------------------------
  const today = new Date();
  today.setHours(0, 0, 0, 0); // normaliser til midnatt

  const isSearching = searchQuery.trim().length > 0;
  // Når det SØKES, skal "onlyUpcoming" ignoreres:
  const effectiveOnlyUpcoming = onlyUpcoming && !isSearching;

  const filteredRaces = races
    .filter((race) => {
      // BEHOLD navnesøk som før
      const matchesSearch =
        race.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDistance = (() => {
        if (!Array.isArray(race.distance_numeric)) return false;
        return race.distance_numeric.some(num =>
          distanceRange[1] === maxSliderValue
            ? num >= distanceRange[0]
            : num >= distanceRange[0] && num <= distanceRange[1]
        );
      })();

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

      const matchesRegion =
        regionFilter.length === 0 || regionFilter.includes(race.region);

      // ✅ Viktig endring: bruk effectiveOnlyUpcoming
      const matchesUpcoming =
        !effectiveOnlyUpcoming || (race.date && new Date(race.date) >= today);

      return (
        matchesSearch &&
        matchesDistance &&
        matchesDate &&
        matchesRegion &&
        matchesUpcoming
      );
    })
    .sort((a, b) => {
      try {
        if (sortMethod === 'distanceAsc') {
          return (a.distance_numeric?.[0] || 0) - (b.distance_numeric?.[0] || 0);
        }
        if (sortMethod === 'distanceDesc') {
          return (b.distance_numeric?.[0] || 0) - (a.distance_numeric?.[0] || 0);
        }
        return new Date(a.date) - new Date(b.date);
      } catch {
        return 0;
      }
    });

  const totalPages = Math.ceil(filteredRaces.length / racesPerPage);
  const currentRaces = filteredRaces.slice((currentPage - 1) * racesPerPage, currentPage * racesPerPage);

  // Close region dropdown on outside click
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
      {/* === Hero section with search === */}
      <section className="relative bg-[url('/hero-2.jpg')] bg-cover bg-[position:center_60%] h-[40vh] md:h-[55vh] flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center px-4 w-full">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Ultraløp i Norge</h1>
          <p className="text-lg md:text-l text-gray-200 max-w-2xl mx-auto">🏃 Finn din neste utfordring</p>

          <input
            type="text"
            placeholder="Søk etter løp..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="mt-6 w-full max-w-md mx-auto px-4 py-2 rounded-lg text-black text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Infotekst: 2026 + nyhetsbrev (uten bakgrunn) */}
          <div className="mt-10 max-w-md mx-auto">
            <p className="text-xs md:text-sm text-white/90 leading-snug">
              <span
                aria-hidden
                className="inline-block align-middle h-1.5 w-1.5 rounded-full bg-blue-400 mr-2"
              />
              Løp for <span className="font-semibold">2026</span> publiseres fortløpende.{` `}
              <button
                onClick={() => {
                  document.getElementById('newsletter-anchor')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="underline underline-offset-2 decoration-white/60 hover:decoration-white font-medium"
              >
                Meld deg på nyhetsbrevet
              </button>
            </p>
          </div>

          <button
            className="block md:hidden mt-4 text-sm text-blue-200 underline"
            onClick={() => setShowMobileFilter(!showMobileFilter)}
          >
            {showMobileFilter ? 'Skjul filter' : 'Vis filter'}
          </button>
        </div>
      </section>

      {/* === Main content: filters + list === */}
      <div className="bg-gray-100 pt-5 px-4 pb-12 min-h-screen">
        <div className="max-w-7xl mx-auto md:flex gap-8">

          {/* -- Filter column (mobile toggles, desktop always visible) -- */}
          <div className={`md:w-1/5 mb-8 md:mb-0 ${showMobileFilter ? 'block' : 'hidden'} md:block`}>
            <div className="bg-white p-6 rounded-xl shadow space-y-6 sticky top-[15px]">

              {/* Only upcoming toggle */}
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked={onlyUpcoming} onChange={() => { setOnlyUpcoming(!onlyUpcoming); setCurrentPage(1); }} className="rounded text-blue-600" />
                <label className="text-sm text-gray-700">Vis kun kommende løp</label>
              </div>

              {/* Sorting */}
              <div>
                <select
                  value={sortMethod}
                  onChange={(e) => { setSortMethod(e.target.value); setCurrentPage(1); }}
                  className="w-full max-w-[188px] px-3 py-2 rounded border border-gray-300 text-sm text-gray-700"
                >
                  <option value="date">Sorter etter dato</option>
                  <option value="distanceAsc">Distanse (lav–høy)</option>
                  <option value="distanceDesc">Distanse (høy–lav)</option>
                </select>
              </div>

              {/* Distance filter */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Distanse: <span className="font-medium">{distanceRange[0]}–{distanceRange[1] === maxSliderValue ? '200+' : distanceRange[1]} km</span>
                </label>
                <Range
                  step={1} min={0} max={maxSliderValue} values={distanceRange}
                  onChange={(range) => { setDistanceRange(range); setCurrentPage(1); }}
                  renderTrack={({ props, children }) => (
                    <div {...props} className="h-2 bg-gray-200 rounded-full">{children}</div>
                  )}
                  renderThumb={({ props }) => (
                    <div {...props} className="w-5 h-5 bg-blue-500 rounded-full shadow border border-white" />
                  )}
                />
              </div>

              {/* Date range filter */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tidsperiode:</label>
                <DatePicker selected={startDate} onChange={(date) => { setStartDate(date); setCurrentPage(1); }} dateFormat="dd.MM.yyyy" placeholderText="Velg startdato" className="w-full px-3 py-2 mb-2 rounded border border-gray-300 text-sm text-gray-700" />
                <DatePicker selected={endDate} onChange={(date) => { setEndDate(date); setCurrentPage(1); }} dateFormat="dd.MM.yyyy" placeholderText="Velg sluttdato" className="w-full px-3 py-2 rounded border border-gray-300 text-sm text-gray-700" />
              </div>

              {/* Region filter */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm text-gray-600 mb-1">Område</label>
                <div onClick={() => setRegionDropdownOpen(!regionDropdownOpen)} className="w-full max-w-[188px] h-[38px] px-3 py-2 border rounded border-gray-300 text-sm text-gray-700 bg-white flex items-center cursor-pointer">
                  {regionFilter.length === 0 ? 'Velg fylke' : regionFilter.join(', ')}
                </div>
                {regionDropdownOpen && (
                  <div className="absolute z-10 mt-2 w-full max-h-48 overflow-y-auto bg-white border border-gray-300 rounded shadow-md p-2 space-y-1">
                    {uniqueRegions.map(region => (
                      <label key={region} className="flex items-center space-x-2 text-sm text-gray-700">
                        <input type="checkbox" checked={regionFilter.includes(region)} onChange={() => handleRegionChange(region)} className="rounded text-blue-600" />
                        <span>{region}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Reset filters */}
              <button onClick={nullstillFilter} className="text-sm text-blue-600 underline hover:text-blue-800">Nullstill filter</button>
            </div>
          </div>

          {/* -- Races list and pagination ----------------------------- */}
          <div className="md:w-3/4">
            {/* Topplinje: telletekst + kalender-knapp */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 text-sm">
                Viser <span className="font-medium">{filteredRaces.length}</span> av{" "}
                <span className="font-medium">{races.length}</span> løp basert på dine kriterier.
              </p>

              <button
                type="button"
                onClick={() => setCalendarOpen(!calendarOpen)}
                className="inline-flex items-center rounded-2xl px-4 py-2 text-sm font-medium shadow-sm border bg-white hover:bg-gray-50"
                aria-pressed={calendarOpen}
              >
                {calendarOpen ? "🗓️ Skjul kalender" : "🗓️ Vis kalender"}
              </button>
            </div>

            {/* Kalender / Kortvisning */}
            <CalendarToggle
              races={filteredRaces}
              open={calendarOpen}
              onOpenChange={setCalendarOpen}
              hideHeader
            >
              {/* === Din eksisterende kort/grid-visning + paginering === */}
              {currentRaces.length === 0 ? (
                <p className="text-gray-600">Ingen løp funnet.</p>
              ) : (
                <>
                  {/* Grid of race cards */}
                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                    {currentRaces.map((race) => (
                      <div
                        key={race.slug}
                        className="relative group flex flex-col bg-white rounded-2xl shadow-md hover:shadow-lg transition border border-gray-200 hover:border-gray-300 overflow-hidden"
                      >
                        {/* Ribbon status note */}
                        {race.status_note && (
                          <div className="absolute top-0 right-0 z-30 overflow-hidden w-20 h-20 pointer-events-none">
                            <div
                              className={`absolute top-2 right-[-32px] rotate-45 text-[10px] font-semibold py-0.5 w-28 text-center shadow
                                ${race.status_note.toLowerCase() === 'utsolgt' ? 'bg-rose-200 text-rose-800' : ''}
                                ${race.status_note.toLowerCase() === 'få plasser igjen' ? 'bg-amber-200 text-amber-800' : ''}
                                ${race.status_note.toLowerCase() === 'snart' ? 'bg-sky-200 text-sky-800' : ''}
                                ${!['utsolgt','få plasser igjen','snart'].includes(race.status_note.toLowerCase()) ? 'bg-gray-200 text-gray-700' : ''}
                              `}
                            >
                              {ribbonText(race.status_note)}
                            </div>
                          </div>
                        )}

                        <a href={`/${race.slug}`} className="absolute inset-0 z-10 pointer-events-auto">
                          <span className="sr-only">Gå til løpsside</span>
                        </a>

                        <img
                          src={race.image_url || '/fallback.jpg'}
                          alt={`${race.name} – ${formatDate(race.date)}`}
                          className="w-full h-24 object-cover opacity-40 group-hover:opacity-100 transition-opacity duration-300"
                        />

                        <div className="p-4 flex flex-col justify-between h-full relative z-20 pointer-events-none">
                          <div className="mb-2">
                            <h2 className="text-base font-semibold text-gray-900 line-clamp-1 mb-1">
                              {race.name}
                            </h2>
                            <div className="flex flex-wrap gap-2 mb-1">
                              {(Array.isArray(race.distance)
                                ? race.distance
                                : race.distance?.split(',') || []
                              ).map((d, i) => (
                                <span
                                  key={i}
                                  className="bg-blue-50 text-blue-800 text-[11px] font-medium px-2 py-0.5 rounded-full"
                                >
                                  {String(d).trim().replace(/[\[\]"']/g, '')}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500">{formatDate(race.date)}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-auto">📍{race.location}</p>
                        </div>

                        {/* External site icon if present */}
                        {race.url && (
                          <a
                            href={race.url.startsWith('http') ? race.url : `https://${race.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-2 right-2 bg-white/80 rounded-full p-1.5 shadow hover:bg-blue-50 text-gray-500 hover:text-blue-600 z-30 pointer-events-auto"
                            title="Åpne offisiell nettside"
                            aria-label="Åpne offisiell nettside"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7m0 0v7m0-7L10 14" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10v6a3 3 0 003 3h6" />
                            </svg>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination controls */}
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
            </CalendarToggle>
            {/* ⬆️ Kalender-toggle slutt */}
          </div>

        </div>
      </div>

      {/* === Footer === */}
      <div id="newsletter-anchor"></div>
      <Footer />
    </>
  );
}
