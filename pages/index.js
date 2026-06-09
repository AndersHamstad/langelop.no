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
import Link from 'next/link';
import { articles } from '../data/articles';
import { SlidersHorizontal, X, Flame, Clock } from 'lucide-react';

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

const formatShortDate = (dateString) => {
  try {
    return format(new Date(dateString), 'd. MMM', { locale: nb });
  } catch {
    return dateString;
  }
};

// Distance quick-filter presets
const DISTANCE_PRESETS = [
  { label: 'Alle', min: 0, max: 200 },
  { label: '50 km', min: 40, max: 65 },
  { label: '100 km', min: 85, max: 115 },
  { label: '100+ km', min: 100, max: 200 },
];

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
  const [visibleCount, setVisibleCount] = useState(12);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [regionFilter, setRegionFilter] = useState([]);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [sortMethod, setSortMethod] = useState('date');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [onlyUpcoming, setOnlyUpcoming] = useState(true);
  const [viewMode, setViewMode] = useState('cards');
  const [stickyVisible, setStickyVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const dropdownRef = useRef(null);
  const heroRef = useRef(null);
  const maxSliderValue = 200;

  // Sticky search
  useEffect(() => {
    const onScroll = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect().bottom ?? 0;
      setStickyVisible(heroBottom < 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [searchQuery, distanceRange, startDate, endDate, regionFilter, onlyUpcoming, sortMethod]);

  const uniqueRegions = useMemo(
    () => [...new Set(races.map((r) => r.region).filter(Boolean))].sort(),
    [races]
  );

  // Races in the next 14 days
  const comingUp = useMemo(() => {
    const today = startOfDay(new Date());
    const in14 = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    return races
      .filter((r) => r.date && new Date(r.date) >= today && new Date(r.date) <= in14)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      ;
  }, [races]);

  // Days until a race
  const daysUntil = (dateStr) => {
    try {
      const today = startOfDay(new Date());
      const raceDay = startOfDay(new Date(dateStr));
      return Math.ceil((raceDay - today) / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  // Featured race: paid featured first, fallback to next upcoming
  const { featuredRace, featuredIsPaid } = useMemo(() => {
    const today = startOfDay(new Date());
    const upcoming = races.filter((r) => r.date && new Date(r.date) >= today && r.image_url);
    const paid = upcoming.find((r) => r.featured);
    if (paid) return { featuredRace: paid, featuredIsPaid: true };
    const next = upcoming.sort((a, b) => new Date(a.date) - new Date(b.date))[0] ?? null;
    return { featuredRace: next, featuredIsPaid: false };
  }, [races]);

  const nullstillFilter = () => {
    setSearchQuery('');
    setDistanceRange([0, maxSliderValue]);
    setStartDate(null);
    setEndDate(null);
    setRegionFilter([]);
    setVisibleCount(12);
  };

  const handleRegionChange = (region) => {
    setRegionFilter((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const activePreset = DISTANCE_PRESETS.find(
    (p) => p.min === distanceRange[0] && p.max === distanceRange[1]
  );

  // Kortvisning
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

        return matchesSearch && matchesDistance && matchesDate && matchesRegion && matchesUpcoming;
      })
      .sort((a, b) => {
        try {
          if (sortMethod === 'distanceAsc')
            return (a.distance_numeric?.[0] || 0) - (b.distance_numeric?.[0] || 0);
          if (sortMethod === 'distanceDesc')
            return (b.distance_numeric?.[0] || 0) - (a.distance_numeric?.[0] || 0);
          return new Date(a.date) - new Date(b.date);
        } catch {
          return 0;
        }
      });
  }, [races, searchQuery, distanceRange, startDate, endDate, regionFilter, onlyUpcoming, sortMethod]);

  // Kalender / kart
  const filteredRaces2026 = useMemo(() => {
    const cutoffDate = new Date('2026-01-01');
    return races
      .filter((race) => {
        const matchesSearch = race.name?.toLowerCase().includes(searchQuery.toLowerCase());
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
        const matchesRegion = regionFilter.length === 0 || regionFilter.includes(race.region);
        const is2026OrLater = (() => {
          try { return new Date(race.date) >= cutoffDate; } catch { return false; }
        })();
        return matchesSearch && matchesDistance && matchesDateFilter && matchesRegion && is2026OrLater;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [races, searchQuery, distanceRange, startDate, endDate, regionFilter, sortMethod]);

  const activeCount = viewMode === 'cards' ? filteredRaces.length : filteredRaces2026.length;

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    distanceRange[0] !== 0 ||
    distanceRange[1] !== maxSliderValue ||
    startDate !== null ||
    endDate !== null ||
    regionFilter.length > 0;

  const racesPerPage = 12;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, distanceRange, startDate, endDate, regionFilter, onlyUpcoming, sortMethod]);

  const showFeatured = featuredRace && !hasActiveFilters && viewMode === 'cards';
  const racesWithoutFeatured = showFeatured
    ? filteredRaces.filter((r) => r.slug !== featuredRace.slug)
    : filteredRaces;

  // Mobile: load more
  const currentRacesMobile = racesWithoutFeatured.slice(0, visibleCount);
  const hasMore = visibleCount < racesWithoutFeatured.length;

  // Desktop: pagination
  const totalPages = Math.ceil(racesWithoutFeatured.length / racesPerPage);
  const currentRacesDesktop = racesWithoutFeatured.slice(
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

  // ─── Article teaser (top 3) ────────────────────────────────────────────────
  const featuredArticles = articles.slice(0, 3);

  return (
    <>
      {/* ── Sticky search bar ───────────────────────────────────────────────── */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-200 ${
          stickyVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm px-4 py-2">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Søk etter løp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Quick distance chips in sticky bar */}
            <div className="hidden sm:flex gap-1">
              {DISTANCE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setDistanceRange([p.min, p.max])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
                    activePreset?.label === p.label
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative bg-[url('/hero-2.jpg')] bg-cover bg-[position:center_60%] h-[45vh] md:h-[58vh] flex items-center justify-center text-white"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/20" />

        <div className="absolute top-2 right-2 md:top-6 md:right-8 z-20">
          <TopNavPill />
        </div>

        <div className="relative z-10 text-center px-4 w-full">
          <h1 className="mt-10 md:mt-0 text-4xl md:text-5xl font-extrabold mb-2 drop-shadow">
            Ultraløp i Norge
          </h1>

          <p className="text-gray-200 text-base md:text-lg max-w-xl mx-auto mb-1">
            Finn din neste utfordring
          </p>

          {/* Search */}
          <div className="relative mt-5 w-full max-w-md mx-auto px-4 md:px-0">
            <span className="absolute left-8 md:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Søk etter løp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-white text-gray-900 text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick distance chips */}
          <div className="flex justify-center gap-2 mt-3 flex-wrap">
            {DISTANCE_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setDistanceRange([p.min, p.max])}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  activePreset?.label === p.label
                    ? 'bg-white text-blue-700 shadow'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── "Løp de neste to ukene" ─────────────────────────────────────────── */}
      {comingUp.length > 0 && (
        <div className="bg-white border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Neste to uker
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {comingUp.map((race) => (
                <a
                  key={race.slug}
                  href={`/${race.slug}`}
                  className="flex-shrink-0 flex items-center gap-2.5 bg-gray-50 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-100 transition min-w-[190px]"
                >
                  <div className="text-center min-w-[36px]">
                    <div className="text-base font-bold text-gray-800 leading-none">
                      {format(new Date(race.date), 'd', { locale: nb })}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase font-medium">
                      {format(new Date(race.date), 'MMM', { locale: nb })}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{race.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {[].concat(race.distance || [])
                        .flatMap((d) => (typeof d === 'string' ? d.split(',') : [d]))
                        .map((d) => String(d).trim().replace(/[\[\]{}"']/g, ''))
                        .join(' · ')}{' '}
                      · {race.location}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="bg-gray-100 pt-6 px-4 pb-12 min-h-screen">
        <div className="max-w-7xl mx-auto md:flex gap-8">

          {/* ── Sidebar filter ──────────────────────────────────────────────── */}
          <div className={`md:w-1/5 mb-6 md:mb-0 ${showMobileFilter ? 'block' : 'hidden'} md:block`}>
            <div className="bg-white p-6 rounded-xl shadow space-y-6 sticky top-[15px]">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={onlyUpcoming}
                  onChange={() => setOnlyUpcoming((prev) => !prev)}
                  className="rounded text-blue-600"
                />
                <label className="text-sm text-gray-700">Vis kun kommende løp</label>
              </div>

              <div>
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
                  onChange={(range) => setDistanceRange(range)}
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
                  onChange={(date) => setStartDate(date)}
                  dateFormat="dd.MM.yyyy"
                  placeholderText="Velg startdato"
                  className="w-full px-3 py-2 mb-2 rounded border border-gray-300 text-sm text-gray-700"
                />
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
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

          {/* ── Right column ────────────────────────────────────────────────── */}
          <div className="md:w-3/4">
            {fetchError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                ⚠️ Kunne ikke hente løpsdata. Prøv å laste siden på nytt.
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 mb-2">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowMobileFilter(!showMobileFilter)}
                className={`md:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-full border shadow-sm text-sm font-medium transition ${
                  showMobileFilter || hasActiveFilters
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                {showMobileFilter
                  ? <><X size={14} /> Skjul</>
                  : <><SlidersHorizontal size={14} /> Filter{hasActiveFilters ? ' ●' : ''}</>
                }
              </button>

              {/* View mode toggle */}
              <div className="inline-flex rounded-full bg-white p-1 border border-gray-200 shadow-sm ml-auto">
                {[
                  { id: 'cards', label: 'Kort' },
                  { id: 'calendar', label: 'Kalender' },
                  { id: 'map', label: 'Kart' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setViewMode(id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      viewMode === id
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter result count — only shown when filters are active */}
            {hasActiveFilters && (
              <p className="text-sm text-gray-500 mb-3">
                Viser <span className="font-semibold text-gray-900">{activeCount}</span> av {races.length} løp
              </p>
            )}


            {/* ── Featured race ─────────────────────────────────────────────── */}
            {showFeatured && (
              <a
                href={`/${featuredRace.slug}`}
                className={`group relative block rounded-2xl overflow-hidden mb-6 transition shadow-md hover:shadow-xl ${
                  featuredIsPaid ? 'ring-2 ring-amber-400/60' : ''
                }`}
              >
                <img
                  src={featuredRace.image_url}
                  alt={featuredRace.name}
                  className="w-full h-52 md:h-72 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Top left: label */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  {featuredIsPaid ? (
                    <span className="flex items-center gap-1 bg-amber-400 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                      ★ Fremhevet løp
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/20">
                      <Clock size={11} />
                      {(() => {
                        const d = daysUntil(featuredRace.date);
                        if (d === 0) return 'I dag!';
                        if (d === 1) return 'I morgen';
                        return `Om ${d} dager`;
                      })()}
                    </span>
                  )}
                </div>

                {/* Top right: "Annonsert" for paid */}
                {featuredIsPaid && (
                  <div className="absolute top-3 right-3">
                    <span className="text-white/50 text-[10px] font-medium">Annonsert</span>
                  </div>
                )}

                {/* Bottom content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {!featuredIsPaid && (
                    <p className="text-white/60 text-xs uppercase tracking-widest mb-1 font-medium">
                      Neste løp
                    </p>
                  )}
                  <h3 className="text-white text-xl font-bold leading-tight mb-1">
                    {featuredRace.name}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {formatDate(featuredRace.date)} · {featuredRace.location}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5 items-center">
                    {[].concat(featuredRace.distance || [])
                      .flatMap((d) => (typeof d === 'string' ? d.split(',') : [d]))
                      .map((d, i) => (
                        <span key={i} className="bg-white/20 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded-full border border-white/20">
                          {String(d).trim().replace(/[\[\]{}"']/g, '')}
                        </span>
                      ))}
                    {featuredIsPaid && (
                      <span className="ml-auto bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                        Meld deg på →
                      </span>
                    )}
                  </div>
                </div>
              </a>
            )}

            {/* ── Cards view ────────────────────────────────────────────────── */}
            {viewMode === 'cards' && (
              <>
                {racesWithoutFeatured.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <p className="text-3xl mb-3">🔍</p>
                    <p className="font-medium">Ingen løp funnet</p>
                    <button
                      onClick={nullstillFilter}
                      className="mt-4 text-sm text-blue-600 underline"
                    >
                      Nullstill filter
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
                      {(isDesktop ? currentRacesDesktop : currentRacesMobile).map((race) => {
                        const isSoldOut = race.status_note?.toLowerCase() === 'utsolgt';
                        const isFewLeft = race.status_note?.toLowerCase() === 'få plasser igjen';
                        const isSoon = race.status_note?.toLowerCase() === 'snart';

                        return (
                          <a
                            key={race.slug}
                            href={`/${race.slug}`}
                            className={`relative group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-md transition border overflow-hidden ${
                              isSoldOut
                                ? 'border-rose-200 opacity-70'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {/* Status ribbon */}
                            {race.status_note && (
                              <div className="absolute top-0 right-0 z-30 overflow-hidden w-20 h-20 pointer-events-none">
                                <div
                                  className={`absolute top-2 right-[-32px] rotate-45 text-[10px] font-semibold py-0.5 w-28 text-center shadow
                                    ${isSoldOut ? 'bg-rose-200 text-rose-800' : ''}
                                    ${isFewLeft ? 'bg-amber-200 text-amber-800' : ''}
                                    ${isSoon ? 'bg-sky-200 text-sky-800' : ''}
                                    ${!isSoldOut && !isFewLeft && !isSoon ? 'bg-gray-200 text-gray-700' : ''}
                                  `}
                                >
                                  {ribbonText(race.status_note)}
                                </div>
                              </div>
                            )}

                            {/* Image */}
                            <div className="relative overflow-hidden">
                              <img
                                src={race.image_url || '/fallback.jpg'}
                                alt={`${race.name}`}
                                className={`w-full h-28 object-cover transition-all duration-300 ${
                                  isSoldOut
                                    ? 'grayscale opacity-60'
                                    : 'opacity-75 group-hover:opacity-100 group-hover:scale-105'
                                }`}
                              />
                              {/* Date overlay */}
                              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                                {formatShortDate(race.date)}
                              </div>
                              {/* Popular badge */}
                              {race.popular && !isSoldOut && (
                                <div className="absolute top-2 left-2 flex items-center gap-1 bg-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                                  <Flame size={9} />
                                  Populært
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="p-4 flex flex-col flex-1">
                              <h2 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 leading-snug">
                                {race.name}
                              </h2>

                              {/* Distance tags */}
                              <div className="flex flex-wrap gap-1.5 mb-3">
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

                              {/* Location */}
                              <p className="text-xs text-gray-500 mt-auto flex items-center gap-1">
                                <span>📍</span>
                                <span className="truncate">{race.location}</span>
                              </p>
                            </div>

                            {/* External link button — must be a button, not <a>, since card itself is <a> */}
                            {race.url && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(
                                    race.url.startsWith('http') ? race.url : `https://${race.url}`,
                                    '_blank',
                                    'noopener,noreferrer'
                                  );
                                }}
                                className="absolute bottom-3 right-3 bg-white/90 rounded-full p-1.5 shadow hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition z-30"
                                title="Åpne offisiell nettside"
                                aria-label="Åpne offisiell nettside"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="w-3.5 h-3.5"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7m0 0v7m0-7L10 14" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10v6a3 3 0 003 3h6" />
                                </svg>
                              </button>
                            )}
                          </a>
                        );
                      })}
                    </div>

                    {/* Mobile: load more */}
                    {!isDesktop && hasMore && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={() => setVisibleCount((c) => c + 12)}
                          className="px-8 py-3 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition"
                        >
                          Last inn flere ({racesWithoutFeatured.length - visibleCount} gjenstår)
                        </button>
                      </div>
                    )}

                    {/* Desktop: pagination */}
                    {isDesktop && totalPages > 1 && (
                      <div className="flex justify-center items-center gap-1 mt-10">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-white hover:text-gray-900 disabled:opacity-30 transition"
                        >
                          ←
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                          .reduce((acc, p, idx, arr) => {
                            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                            acc.push(p);
                            return acc;
                          }, [])
                          .map((p, i) =>
                            p === '…' ? (
                              <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                            ) : (
                              <button
                                key={p}
                                onClick={() => setCurrentPage(p)}
                                className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                                  currentPage === p
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {p}
                              </button>
                            )
                          )}
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-white hover:text-gray-900 disabled:opacity-30 transition"
                        >
                          →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {viewMode === 'calendar' && (
              <CalendarToggle races={filteredRaces2026} open={true} onOpenChange={() => {}} hideHeader />
            )}

            {viewMode === 'map' && <RaceMap races={filteredRaces2026} />}
          </div>
        </div>

        {/* ── Arrangør-stripe ─────────────────────────────────────────────────── */}
        <div className="md:hidden max-w-7xl mx-auto px-4 mt-8 text-center">
          <p className="text-sm text-gray-500">
            Savner du et løp på listen?{' '}
            <Link href="/for-arrangorer" className="font-semibold text-gray-800 hover:underline">
              Meld inn gratis →
            </Link>
          </p>
        </div>

        {/* ── Article teaser ──────────────────────────────────────────────────── */}
        {viewMode === 'cards' && (
          <div className="max-w-7xl mx-auto mt-16 px-0">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Fra bloggen</h2>
              <Link
                href="/artikler/liste"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Se alle artikler →
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/artikler/${article.slug}`}
                  className="group flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 overflow-hidden transition"
                >
                  {article.image && (
                    <div className="overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                        style={{ objectPosition: article.focusList || 'center 50%' }}
                      />
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-[11px] text-gray-400 mb-1 uppercase tracking-wide">
                      {format(new Date(article.date), 'd. MMM yyyy', { locale: nb })}
                    </p>
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-3 mt-auto leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div id="newsletter-anchor"></div>
    </>
  );
}
