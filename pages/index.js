// pages/index.js

import { supabase } from '../lib/supabaseClient';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Range } from 'react-range';
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { nb } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TopNavPill from '../components/TopNavPill';
import { CalendarToggle } from '../components/CalendarToggle';
import dynamic from 'next/dynamic';

const RaceMap = dynamic(() => import('../components/RaceMap'), {
  ssr: false,
});

const RIBBON_MAP = {
  'få plasser igjen': 'Få plasser',
  utsolgt: 'Utsolgt',
  snart: 'Snart',
};

const ribbonText = (note) => RIBBON_MAP[note?.toLowerCase()] ?? note ?? '';

const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), 'd. MMMM yyyy', { locale: nb });
  } catch {
    return dateString;
  }
};

export async function getStaticProps() {
  const { data: races, error } = await supabase.from('races').select('*');

  if (error) {
    console.error('Supabase fetch error:', error);
  }

  return {
    props: { races: races || [], fetchError: error ? true : false },
    revalidate: 60,
  };
}

export default function Home({ races, fetchError }) {
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
  const [viewMode, setViewMode] = useState('cards');

  const dropdownRef = useRef(null);
  const racesPerPage = 12;
  const maxSliderValue = 200;

  const uniqueRegions = useMemo(
    () => [...new Set(races.map((r) => r.region).filter(Boolean))].sort(),
    [races]
  );

  const nullstillFilter = () => {
    setSearchQuery('');
    setDistanceRange([0, maxSliderValue]);
    setStartDate(null);
    setEndDate(null);
    setRegionFilter([]);
    setCurrentPage(1);
  };

  const handleRegionChange = (region) => {
    setRegionFilter((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
    setCurrentPage(1);
  };

  // Kortvisning: respekterer "Vis kun kommende løp"
  const filteredRaces = useMemo(() => {
    const today = startOfDay(new Date());
    const isSearching = searchQuery.trim().length > 0;
    const effectiveOnlyUpcoming = onlyUpcoming && !isSearching;

    return races
      .filter((race) => {
        const matchesSearch = race.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

        const matchesDistance = (() => {
          const nums = [].concat(race.distance_numeric || []);
          if (nums.length === 0) return false;

          return nums.some((num) =>
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

        const matchesUpcoming = (() => {
          if (!effectiveOnlyUpcoming) return true;
          if (!race.date) return false;

          try {
            return !isBefore(parseISO(race.date), today);
          } catch {
            return false;
          }
        })();

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
  }, [
    races,
    searchQuery,
    distanceRange,
    startDate,
    endDate,
    regionFilter,
    onlyUpcoming,
    sortMethod,
  ]);

  // Kalender og kart: viser alle løp, men respekterer søk/filter/dato/region/distanse
  const filteredRaces2026 = useMemo(() => {
  const cutoffDate = new Date('2026-01-01');

  return races
    .filter((race) => {
      const matchesSearch = race.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesDistance = (() => {
        const nums = [].concat(race.distance_numeric || []);
        if (!nums.length) return false;

        return nums.some((num) =>
          distanceRange[1] === maxSliderValue
            ? num >= distanceRange[0]
            : num >= distanceRange[0] && num <= distanceRange[1]
        );
      })();

      const matchesDateFilter = (() => {
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
        regionFilter.length === 0 ||
        regionFilter.includes(race.region);

      // Viktig:
      const is2026OrLater = (() => {
        try {
          return new Date(race.date) >= cutoffDate;
        } catch {
          return false;
        }
      })();

      return (
        matchesSearch &&
        matchesDistance &&
        matchesDateFilter &&
        matchesRegion &&
        is2026OrLater
      );
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

}, [
  races,
  searchQuery,
  distanceRange,
  startDate,
  endDate,
  regionFilter,
  sortMethod
]);

  const activeCount =
 viewMode === 'cards'
   ? filteredRaces.length
   : filteredRaces2026.length;

  const totalPages = Math.ceil(filteredRaces.length / racesPerPage);
  const currentRaces = filteredRaces.slice(
    (currentPage - 1) * racesPerPage,
    currentPage * racesPerPage
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setRegionDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <section className="relative bg-[url('/hero-2.jpg')] bg-cover bg-[position:center_60%] h-[40vh] md:h-[55vh] flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-black/40" />

        <div className="absolute top-2 right-2 md:top-6 md:right-8 z-20">
          <TopNavPill />
        </div>

        <div className="relative z-10 text-center px-4 w-full">
          <h1 className="mt-12 md:mt-0 text-4xl md:text-5xl font-extrabold mb-4">
            Ultraløp i Norge
          </h1>

          <p className="text-lg md:text-l text-gray-200 max-w-2xl mx-auto">
            🏃 Finn din neste utfordring
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

      <div className="bg-gray-100 pt-5 px-4 pb-12 min-h-screen">
        <div className="max-w-7xl mx-auto md:flex gap-8">
          <div className={`md:w-1/5 mb-8 md:mb-0 ${showMobileFilter ? 'block' : 'hidden'} md:block`}>
            <div className="bg-white p-6 rounded-xl shadow space-y-6 sticky top-[15px]">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={onlyUpcoming}
                  onChange={() => {
                    setOnlyUpcoming((prev) => !prev);
                    setCurrentPage(1);
                  }}
                  className="rounded text-blue-600"
                />
                <label className="text-sm text-gray-700">Vis kun kommende løp</label>
              </div>

              <div>
                <select
                  value={sortMethod}
                  onChange={(e) => {
                    setSortMethod(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full max-w-[188px] px-3 py-2 rounded border border-gray-300 text-sm text-gray-700"
                >
                  <option value="date">Sorter etter dato</option>
                  <option value="distanceAsc">Distanse (lav–høy)</option>
                  <option value="distanceDesc">Distanse (høy–lav)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Distanse:{' '}
                  <span className="font-medium">
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
                    <div
                      {...props}
                      className="w-5 h-5 bg-blue-500 rounded-full shadow border border-white"
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Tidsperiode:</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    setCurrentPage(1);
                  }}
                  dateFormat="dd.MM.yyyy"
                  placeholderText="Velg startdato"
                  className="w-full px-3 py-2 mb-2 rounded border border-gray-300 text-sm text-gray-700"
                />

                <DatePicker
                  selected={endDate}
                  onChange={(date) => {
                    setEndDate(date);
                    setCurrentPage(1);
                  }}
                  dateFormat="dd.MM.yyyy"
                  placeholderText="Velg sluttdato"
                  className="w-full px-3 py-2 rounded border border-gray-300 text-sm text-gray-700"
                />
              </div>

              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm text-gray-600 mb-1">Område</label>
                <div
                  onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                  className="w-full max-w-[188px] h-[38px] px-3 py-2 border rounded border-gray-300 text-sm text-gray-700 bg-white flex items-center cursor-pointer"
                >
                  {regionFilter.length === 0 ? 'Velg fylke' : regionFilter.join(', ')}
                </div>

                {regionDropdownOpen && (
                  <div className="absolute z-10 mt-2 w-full max-h-48 overflow-y-auto bg-white border border-gray-300 rounded shadow-md p-2 space-y-1">
                    {uniqueRegions.map((region) => (
                      <label
                        key={region}
                        className="flex items-center space-x-2 text-sm text-gray-700"
                      >
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

              <button
                onClick={nullstillFilter}
                className="text-sm text-blue-600 underline hover:text-blue-800"
              >
                Nullstill filter
              </button>
            </div>
          </div>

          <div className="md:w-3/4">
            {fetchError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                ⚠️ Kunne ikke hente løpsdata. Prøv å laste siden på nytt.
              </div>
            )}

           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

  {/* Teller */}
  <p className="text-gray-600 text-sm">
    Viser <span className="font-medium">{activeCount}</span> av{" "}
    <span className="font-medium">{races.length}</span> løp basert på dine kriterier.
  </p>

  {/* Filter + View Toggle */}
<div className="flex items-center justify-between w-full mt-4 md:mt-0">

  {/* Mobil filterknapp */}
  <button
    onClick={() => setShowMobileFilter(!showMobileFilter)}
    className="md:hidden inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-700"
  >
    {showMobileFilter ? "✕ Skjul filter" : "⚙️ Filter"}
  </button>

  {/* Visnings-toggle */}
  <div className="inline-flex rounded-full bg-white p-1 border border-gray-200 shadow-sm ml-auto">
    <button
      type="button"
      onClick={() => setViewMode('cards')}
      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
        viewMode === 'cards'
          ? 'bg-blue-600 text-white shadow'
          : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      Kort
    </button>

    <button
      type="button"
      onClick={() => setViewMode('calendar')}
      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
        viewMode === 'calendar'
          ? 'bg-blue-600 text-white shadow'
          : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      Kalender
    </button>

    <button
      type="button"
      onClick={() => setViewMode('map')}
      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
        viewMode === 'map'
          ? 'bg-blue-600 text-white shadow'
          : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      Kart
    </button>
  </div>
</div>
</div>

            {viewMode === 'cards' && (
              <>
                {currentRaces.length === 0 ? (
                  <p className="text-gray-600">Ingen løp funnet.</p>
                ) : (
                  <>
                    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                      {currentRaces.map((race) => (
                        <div
                          key={race.slug}
                          className="relative group flex flex-col bg-white rounded-2xl shadow-md hover:shadow-lg transition border border-gray-200 hover:border-gray-300 overflow-hidden"
                        >
                          {race.status_note && (
                            <div className="absolute top-0 right-0 z-30 overflow-hidden w-20 h-20 pointer-events-none">
                              <div
                                className={`absolute top-2 right-[-32px] rotate-45 text-[10px] font-semibold py-0.5 w-28 text-center shadow
                                  ${race.status_note.toLowerCase() === 'utsolgt' ? 'bg-rose-200 text-rose-800' : ''}
                                  ${race.status_note.toLowerCase() === 'få plasser igjen' ? 'bg-amber-200 text-amber-800' : ''}
                                  ${race.status_note.toLowerCase() === 'snart' ? 'bg-sky-200 text-sky-800' : ''}
                                  ${!['utsolgt', 'få plasser igjen', 'snart'].includes(race.status_note.toLowerCase()) ? 'bg-gray-200 text-gray-700' : ''}
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
                                {[].concat(race.distance || [])
                                  .flatMap((d) => (typeof d === 'string' ? d.split(',') : [d]))
                                  .map((d, i) => (
                                    <span
                                      key={i}
                                      className="bg-blue-50 text-blue-800 text-[11px] font-medium px-2 py-0.5 rounded-full"
                                    >
                                      {String(d).trim().replace(/[\[\]{}"']/g, '')}
                                    </span>
                                  ))}
                              </div>

                              <p className="text-xs text-gray-500">{formatDate(race.date)}</p>
                            </div>

                            <p className="text-xs text-gray-500 mt-auto">📍{race.location}</p>
                          </div>

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
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="w-4 h-4"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7m0 0v7m0-7L10 14" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10v6a3 3 0 003 3h6" />
                              </svg>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>

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
              </>
            )}

            {viewMode === 'calendar' && (
              <CalendarToggle races={filteredRaces2026}
                open={true}
                onOpenChange={() => {}}
                hideHeader
              />
            )}

            {viewMode === 'map' && <RaceMap races={filteredRaces2026} />}
          </div>
        </div>
      </div>

      <div id="newsletter-anchor"></div>
    </>
  );
}