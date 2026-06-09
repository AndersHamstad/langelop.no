import React, { useMemo, useState, useEffect, useRef } from "react";

export function CalendarToggle({
  races,
  defaultMonth = new Date(),
  children,
  open,
  onOpenChange,
  hideHeader = false,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = typeof open === "boolean" ? open : uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  return (
    <div className="w-full">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4 gap-2">
          <h2 className="text-xl font-semibold">Ultraløp i kalender</h2>
          <button
            type="button"
            onClick={() => setOpen(!isOpen)}
            className="inline-flex items-center rounded-2xl px-4 py-2 text-sm font-medium shadow-sm border bg-white hover:bg-gray-50"
            aria-pressed={isOpen}
          >
            {isOpen ? "Skjul kalender" : "Vis kalender"}
          </button>
        </div>
      )}

      {isOpen ? (
        <>
          <div className="block md:hidden">
            <MobileCalendarList races={races} />
          </div>
          <div className="hidden md:block">
            <MonthCalendar races={races} defaultMonth={defaultMonth} />
          </div>
        </>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}

/* ─── Mobile list ─────────────────────────────────────────────────────────── */

function MobileCalendarList({ races }) {
  const groupedByMonth = useMemo(() => {
    const dayMap = new Map();
    for (const race of races || []) {
      const iso = normalizeISO(race.date);
      if (!dayMap.has(iso)) dayMap.set(iso, []);
      dayMap.get(iso).push(race);
    }

    const days = [...dayMap.entries()]
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([iso, list]) => ({
        iso,
        monthKey: iso.slice(0, 7),
        monthLabel: formatMonthLabel(iso),
        races: list.sort((a, b) => a.name.localeCompare(b.name)),
      }));

    const monthMap = new Map();
    for (const day of days) {
      if (!monthMap.has(day.monthKey))
        monthMap.set(day.monthKey, { monthKey: day.monthKey, monthLabel: day.monthLabel, days: [] });
      monthMap.get(day.monthKey).days.push(day);
    }

    return [...monthMap.values()];
  }, [races]);

  if (groupedByMonth.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-sm text-gray-500 text-center">
        Ingen løp funnet i kalenderen.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedByMonth.map((month) => (
        <section key={month.monthKey} className="space-y-3">
          <div className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-gray-100/95 backdrop-blur">
            <h2 className="text-lg font-extrabold text-gray-900">{month.monthLabel}</h2>
          </div>

          {month.days.map(({ iso, races }) => (
            <div key={iso} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-gradient-to-r from-[#0f1c2e] to-[#1b3a5c] border-b border-white/10">
                <p className="text-sm font-semibold text-white">
                  {isoToReadable(iso)}
                  {races.length > 1 && (
                    <span className="ml-2 text-xs font-normal text-white/50">{races.length} løp</span>
                  )}
                </p>
              </div>

              <div className="divide-y divide-gray-100">
                {races.map((race) => (
                  <a
                    key={race.id || race.slug}
                    href={race.slug ? `/${race.slug}` : "#"}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-gray-50 transition"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{race.name}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {[race.location, race.region].filter(Boolean).join(" · ")}
                      </p>
                      {race.distance && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {(Array.isArray(race.distance) ? race.distance : race.distance.split(","))
                            .filter(Boolean)
                            .map((d, i) => (
                              <span
                                key={i}
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                  race.type === "Backyard"
                                    ? "bg-orange-50 text-orange-700"
                                    : "bg-blue-50 text-blue-700"
                                }`}
                              >
                                {String(d).trim().replace(/[\[\]{}"']/g, "")}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-gray-300 text-base">→</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

/* ─── Desktop calendar ────────────────────────────────────────────────────── */

function MonthCalendar({ races, defaultMonth }) {
  const [cursor, setCursor] = useState(startOfMonth(defaultMonth));
  const month = useMemo(() => buildMonth(cursor), [cursor]);
  const racesByDay = useMemo(() => indexRacesByDay(races), [races]);
  const [activeDay, setActiveDay] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!activeDay) return;
    const onOutside = (e) => {
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setActiveDay(null);
    };
    document.addEventListener("mousedown", onOutside, true);
    document.addEventListener("touchstart", onOutside, true);
    return () => {
      document.removeEventListener("mousedown", onOutside, true);
      document.removeEventListener("touchstart", onOutside, true);
    };
  }, [activeDay]);

  const totalRacesThisMonth = useMemo(() => {
    return month.weeks
      .flatMap((w) => w.days)
      .filter((d) => d.inMonth)
      .reduce((sum, d) => sum + (racesByDay.get(d.iso)?.length || 0), 0);
  }, [month, racesByDay]);

  return (
    <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-[#0f1c2e] to-[#1b3a5c]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCursor(addMonths(cursor, -1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition text-base"
          >
            ←
          </button>
          <button
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="px-3 py-1.5 rounded-lg border border-white/20 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            I dag
          </button>
          <button
            onClick={() => setCursor(addMonths(cursor, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition text-base"
          >
            →
          </button>
        </div>

        <div className="text-base font-bold text-white">{formatMonthHeader(cursor)}</div>

        <div className="text-xs text-white/50">
          {totalRacesThisMonth > 0 ? `${totalRacesThisMonth} løp denne måneden` : "Ingen løp"}
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100">
        {["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"].map((d, i) => (
          <div
            key={d}
            className={`py-2 text-center text-[11px] font-semibold tracking-wide uppercase ${
              i >= 5 ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {month.weeks.map((week, wi) => (
          <React.Fragment key={wi}>
            {week.days.map((day, di) => {
              const iso = day.iso;
              const list = racesByDay.get(iso) || [];
              const isToday = iso === toISODate(new Date());
              const isWeekend = di >= 5;
              const isBottomRow = wi >= month.weeks.length - 2;
              const isRightCol = di >= 5;

              return (
                <div
                  key={iso}
                  onClick={() => list.length > 0 && setActiveDay(activeDay === iso ? null : iso)}
                  className={[
                    "min-h-[100px] p-2 border-b border-r border-gray-100 text-left relative transition-colors",
                    day.inMonth ? (isWeekend ? "bg-gray-50/60" : "bg-white") : "bg-gray-50/40",
                    list.length > 0 && day.inMonth ? "cursor-pointer hover:bg-blue-50/40" : "",
                  ].join(" ")}
                >
                  {/* Date number */}
                  <div
                    className={[
                      "inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-semibold mb-1.5",
                      isToday
                        ? "bg-gray-900 text-white"
                        : day.inMonth
                        ? "text-gray-800"
                        : "text-gray-300",
                    ].join(" ")}
                  >
                    {day.date}
                  </div>

                  {/* Race pills */}
                  <div className="flex flex-col gap-0.5">
                    {list.slice(0, 3).map((r) => (
                      <a
                        key={r.id || r.slug}
                        href={r.slug ? `/${r.slug}` : "#"}
                        onClick={(e) => e.stopPropagation()}
                        title={r.name}
                        className={[
                          "truncate block text-[10px] font-medium px-1.5 py-0.5 rounded transition",
                          r.type === "Backyard"
                            ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100",
                        ].join(" ")}
                      >
                        {r.name}
                      </a>
                    ))}

                    {list.length > 3 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveDay(activeDay === iso ? null : iso); }}
                        className="text-[10px] text-gray-400 hover:text-gray-600 text-left font-medium pl-0.5 transition"
                      >
                        +{list.length - 3} flere
                      </button>
                    )}
                  </div>

                  {/* Day detail popup */}
                  {activeDay === iso && (
                    <div
                      className={[
                        "absolute z-30",
                        isRightCol ? "right-0" : "left-0",
                        isBottomRow ? "bottom-full mb-1" : "top-full mt-1",
                      ].join(" ")}
                    >
                      <div
                        ref={panelRef}
                        className="w-72 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                          <span className="text-xs font-semibold text-gray-700">{isoToReadable(iso)}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveDay(null); }}
                            className="text-gray-400 hover:text-gray-600 transition text-base leading-none"
                          >
                            ×
                          </button>
                        </div>

                        <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                          {list.map((r) => (
                            <li key={r.id || r.slug}>
                              <a
                                href={r.slug ? `/${r.slug}` : "#"}
                                className="flex items-start gap-3 px-3 py-3 hover:bg-gray-50 transition"
                              >
                                <span
                                  className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                    r.type === "Backyard" ? "bg-orange-400" : "bg-blue-400"
                                  }`}
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 leading-snug">{r.name}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {[r.location, r.region].filter(Boolean).join(" · ")}
                                  </p>
                                  {r.distance && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {(Array.isArray(r.distance) ? r.distance : r.distance.split(","))
                                        .filter(Boolean)
                                        .map((d, i) => (
                                          <span
                                            key={i}
                                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                              r.type === "Backyard"
                                                ? "bg-orange-50 text-orange-700"
                                                : "bg-blue-50 text-blue-700"
                                            }`}
                                          >
                                            {String(d).trim().replace(/[\[\]{}"']/g, "")}
                                          </span>
                                        ))}
                                    </div>
                                  )}
                                </div>
                                <span className="ml-auto text-gray-300 text-sm flex-shrink-0">→</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ─── Utils ───────────────────────────────────────────────────────────────── */

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addMonths(d, delta) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + delta);
  return startOfMonth(x);
}

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

function getMondayIndexOfFirstDay(y, m) {
  const w = new Date(y, m, 1).getDay();
  return (w + 6) % 7;
}

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoToReadable(iso) {
  const [y, m, d] = iso.split("-").map((v) => parseInt(v, 10));
  const date = new Date(y, m - 1, d);
  const s = date.toLocaleDateString("no-NO", { weekday: "short", day: "2-digit", month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatMonthLabel(iso) {
  const [y, m] = iso.split("-").map((v) => parseInt(v, 10));
  const s = new Date(y, m - 1, 1).toLocaleDateString("no-NO", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatMonthHeader(d) {
  const s = d.toLocaleDateString("no-NO", { month: "long", year: "numeric" }).trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildMonth(cursor) {
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const total = daysInMonth(y, m);
  const leading = getMondayIndexOfFirstDay(y, m);
  const cells = [];

  for (let i = 0; i < leading; i++) {
    const date = new Date(y, m, -i);
    cells.unshift({ iso: toISODate(date), date: date.getDate(), inMonth: false });
  }
  for (let d = 1; d <= total; d++) {
    const date = new Date(y, m, d);
    cells.push({ iso: toISODate(date), date: d, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    const [yy, mm, dd] = last.iso.split("-").map((v) => parseInt(v, 10));
    const nxt = new Date(yy, mm - 1, dd + 1);
    cells.push({ iso: toISODate(nxt), date: nxt.getDate(), inMonth: false });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1];
    const [yy, mm, dd] = last.iso.split("-").map((v) => parseInt(v, 10));
    const nxt = new Date(yy, mm - 1, dd + 1);
    cells.push({ iso: toISODate(nxt), date: nxt.getDate(), inMonth: false });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push({ days: cells.slice(i, i + 7) });
  return { year: y, month: m + 1, weeks };
}

function indexRacesByDay(races) {
  const map = new Map();
  for (const r of races || []) {
    const iso = normalizeISO(r.date);
    if (!map.has(iso)) map.set(iso, []);
    map.get(iso).push(r);
  }
  for (const [k, list] of map.entries()) {
    list.sort((a, b) => a.name.localeCompare(b.name));
    map.set(k, list);
  }
  return map;
}

function normalizeISO(value) {
  return toISODate(new Date(value));
}
