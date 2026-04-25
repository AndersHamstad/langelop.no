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
      if (!monthMap.has(day.monthKey)) {
        monthMap.set(day.monthKey, {
          monthKey: day.monthKey,
          monthLabel: day.monthLabel,
          days: [],
        });
      }

      monthMap.get(day.monthKey).days.push(day);
    }

    return [...monthMap.values()];
  }, [races]);

  if (groupedByMonth.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-sm text-gray-600">
        Ingen løp funnet i kalenderen.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedByMonth.map((month) => (
        <section key={month.monthKey} className="space-y-4">
          <div className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-gray-100/95 backdrop-blur">
            <h2 className="text-lg font-extrabold text-gray-900">
              {month.monthLabel}
            </h2>
          </div>

          {month.days.map(({ iso, races }) => (
            <div
              key={iso}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
  <p className="text-sm font-semibold text-gray-900">
  {isoToReadable(iso)}
  {races.length > 1 && (
    <span className="text-gray-500 font-medium">
      {" "}· {races.length} løp
    </span>
  )}
</p>
</div>

              <div className="divide-y divide-gray-100">
                {races.map((race) => (
                  <a
                    key={race.id || race.slug}
                    href={race.slug ? `/${race.slug}` : "#"}
                    className="block px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 leading-snug">
                          {race.name}
                        </p>

                        <div className="mt-1 text-xs text-gray-500">
                          {race.location && <span>📍 {race.location}</span>}
                          {race.region && <span> · {race.region}</span>}
                        </div>

                        {race.distance && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(Array.isArray(race.distance)
                              ? race.distance
                              : race.distance.split(",")
                            )
                              .filter(Boolean)
                              .map((d, i) => (
                                <span
                                  key={i}
                                  className="bg-blue-50 text-blue-800 text-[11px] font-medium px-2 py-0.5 rounded-full"
                                >
                                  {String(d).trim().replace(/[\[\]{}"']/g, "")}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>

                      <span className="shrink-0 text-gray-300 text-lg leading-none">
                        →
                      </span>
                    </div>
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

  return (
    <div className="rounded-2xl border shadow-sm overflow-hidden bg-white">
      <div className="flex items-center justify-between px-4 py-3 bg-sky-50 border-b border-sky-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(addMonths(cursor, -1))}
            className="rounded-xl border px-3 py-1 text-sm hover:bg-white"
          >
            ←
          </button>
          <button
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="rounded-xl border px-3 py-1 text-sm hover:bg-white"
          >
            I dag
          </button>
          <button
            onClick={() => setCursor(addMonths(cursor, 1))}
            className="rounded-xl border px-3 py-1 text-sm hover:bg-white"
          >
            →
          </button>
        </div>

        <div className="text-base font-semibold">
          {formatMonthHeader(cursor)}
        </div>

        <div className="text-xs text-gray-500 pr-2">
          Klikk dato for detaljer
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-xs uppercase tracking-wide bg-white">
        {"man tir ons tor fre lør søn".split(" ").map((d) => (
          <div key={d} className="py-2 font-medium text-gray-600 border-b">
            {d}
          </div>
        ))}

        {month.weeks.map((week, wi) => (
          <React.Fragment key={wi}>
            {week.days.map((day, di) => {
              const iso = day.iso;
              const list = racesByDay.get(iso) || [];
              const isToday = iso === toISODate(new Date());

              const isBottomRow = wi >= month.weeks.length - 2;
              const isRightCol = di >= 5;
              const horizontalPosClass = isRightCol ? "right-0" : "left-0";
              const verticalPosPanel = isBottomRow
                ? "bottom-10 mb-2"
                : "top-10 mt-2";

              return (
                <div
                  key={iso}
                  className={
                    "min-h-[96px] p-2 border -mt-[1px] -ml-[1px] text-left relative " +
                    (day.inMonth ? "bg-white" : "bg-gray-50")
                  }
                >
                  <button
                    className={
                      "text-xs font-medium rounded-full px-2 py-1 " +
                      (isToday
                        ? "bg-black text-white"
                        : "hover:bg-gray-100 text-gray-800")
                    }
                    onClick={() => setActiveDay(activeDay === iso ? null : iso)}
                  >
                    {day.date}
                  </button>

                  <div className="mt-2 flex flex-col gap-1 pr-2">
                    {list.slice(0, 3).map((r) => (
                      <a
                        key={r.id}
                        href={r.slug ? `/${r.slug}` : "#"}
                        className="truncate text-[11px] underline decoration-dotted hover:decoration-solid"
                        title={r.name}
                      >
                        • {r.name}
                      </a>
                    ))}

                    {list.length > 3 && (
                      <button
                        onClick={() => setActiveDay(activeDay === iso ? null : iso)}
                        className="text-[11px] text-gray-600 text-left underline"
                      >
                        +{list.length - 3} flere
                      </button>
                    )}
                  </div>

                  {activeDay === iso && (
                    <div
                      className={
                        "absolute z-30 " +
                        horizontalPosClass +
                        " " +
                        verticalPosPanel
                      }
                    >
                      <div
                        ref={panelRef}
                        className="w-80 max-h-64 overflow-y-auto rounded-xl border bg-white shadow-xl p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-semibold">
                            {isoToReadable(iso)}
                          </div>
                          <button
                            onClick={() => setActiveDay(null)}
                            className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
                          >
                            Lukk
                          </button>
                        </div>

                        {list.length === 0 ? (
                          <div className="text-xs text-gray-500">
                            Ingen løp denne dagen
                          </div>
                        ) : (
                          <ul className="space-y-2 pr-1">
                            {list.map((r) => (
                              <li key={r.id} className="text-sm">
                                <a
                                  href={r.slug ? `/${r.slug}` : "#"}
                                  className="font-medium underline decoration-dotted hover:decoration-solid"
                                >
                                  {r.name}
                                </a>
                                <div className="text-xs text-gray-600">
                                  {r.location || r.region || ""}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
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

/* -------- Utils -------- */

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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoToReadable(iso) {
  const [y, m, d] = iso.split("-").map((v) => parseInt(v, 10));
  const date = new Date(y, m - 1, d);

  return date.toLocaleDateString("no-NO", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatMonthLabel(iso) {
  const [y, m] = iso.split("-").map((v) => parseInt(v, 10));
  const date = new Date(y, m - 1, 1);

  const s = date.toLocaleDateString("no-NO", {
    month: "long",
    year: "numeric",
  });

  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatMonthHeader(d) {
  const s = d
    .toLocaleDateString("no-NO", { month: "long", year: "numeric" })
    .trim();

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
    cells.unshift({
      iso: toISODate(date),
      date: date.getDate(),
      inMonth: false,
    });
  }

  for (let d = 1; d <= total; d++) {
    const date = new Date(y, m, d);
    cells.push({
      iso: toISODate(date),
      date: d,
      inMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    const [yy, mm, dd] = last.iso.split("-").map((v) => parseInt(v, 10));
    const nxt = new Date(yy, mm - 1, dd + 1);

    cells.push({
      iso: toISODate(nxt),
      date: nxt.getDate(),
      inMonth: false,
    });
  }

  while (cells.length < 42) {
    const last = cells[cells.length - 1];
    const [yy, mm, dd] = last.iso.split("-").map((v) => parseInt(v, 10));
    const nxt = new Date(yy, mm - 1, dd + 1);

    cells.push({
      iso: toISODate(nxt),
      date: nxt.getDate(),
      inMonth: false,
    });
  }

  const weeks = [];

  for (let i = 0; i < cells.length; i += 7) {
    weeks.push({ days: cells.slice(i, i + 7) });
  }

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
  const d = new Date(value);
  return toISODate(d);
}