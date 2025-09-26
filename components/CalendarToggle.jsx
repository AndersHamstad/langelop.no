import React, { useMemo, useState, useEffect, useRef } from "react";

/**
 * CalendarToggle.jsx
 * ------------------
 * Viser enten barna (kort/grid) eller månedskalender med løp.
 *
 * Nytt:
 * - Kontrollert modus: send inn `open` og `onOpenChange` fra forelderen for å styre knappen selv.
 * - `hideHeader` lar deg skjule intern overskrift/knapp helt (vi skal bruke dette).
 */

export function CalendarToggle({
  races,
  defaultMonth = new Date(),
  children,
  open,                 // kontrollert (optional)
  onOpenChange,         // kontrollert (optional)
  hideHeader = false,   // skjul intern header/knapp
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
        <MonthCalendar races={races} defaultMonth={defaultMonth} onClose={() => setOpen(false)} />
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}

function MonthCalendar({ races, defaultMonth, onClose }) {
  const [cursor, setCursor] = useState(startOfMonth(defaultMonth));
  const month = useMemo(() => buildMonth(cursor), [cursor]);
  const racesByDay = useMemo(() => indexRacesByDay(races), [races]);
  const [activeDay, setActiveDay] = useState(null);

  // Lukking ved klikk utenfor panelet
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
    <div className="rounded-2xl border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-sky-50 border-b border-sky-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(addMonths(cursor, -1))}
            className="rounded-xl border px-3 py-1 text-sm hover:bg-white"
            aria-label="Forrige måned"
          >
            ←
          </button>
          <button
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="rounded-xl border px-3 py-1 text-sm hover:bg-white"
            aria-label="Gå til denne måneden"
          >
            I dag
          </button>
          <button
            onClick={() => setCursor(addMonths(cursor, 1))}
            className="rounded-xl border px-3 py-1 text-sm hover:bg-white"
            aria-label="Neste måned"
          >
            →
          </button>
        </div>
        <div className="text-base font-semibold">
          {formatMonthHeader(cursor)}
        </div>
        <div className="text-xs text-gray-500 pr-2">Klikk dato for detaljer</div>
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

              // Plassering for tooltip/panel
              const isBottomRow = wi >= month.weeks.length - 2;
              const isRightCol = di >= 5;
              const horizontalPosClass = isRightCol ? "right-0" : "left-0";
              const verticalPosTip = isBottomRow
                ? "bottom-full mb-1 -translate-y-1"
                : "top-full mt-1 translate-y-1";
              const verticalPosPanel = isBottomRow ? "bottom-10 mb-2" : "top-10 mt-2";

              return (
                <div
                  key={iso}
                  className={
                    "min-h-[84px] p-2 border -mt-[1px] -ml-[1px] text-left align-top relative " +
                    (day.inMonth ? "bg-white" : "bg-gray-50")
                  }
                >
                  <button
                    className={
                      "text-xs font-medium rounded-full px-2 py-1 " +
                      (isToday ? "bg-black text-white" : "hover:bg-gray-100 text-gray-800")
                    }
                    onClick={() => setActiveDay(activeDay === iso ? null : iso)}
                    aria-expanded={activeDay === iso}
                  >
                    {day.date}
                  </button>

                  {/* Markører for løp */}
                  <div className="mt-2 flex flex-col gap-1 pr-2">
                    {list.slice(0, 3).map((r) => (
                      <div key={r.id} className="relative group">
                        <a
                          href={r.url || `#/race/${r.id}`}
                          className="truncate text-[11px] underline decoration-dotted hover:decoration-solid focus:outline-none"
                          title={r.name}
                          tabIndex={0}
                        >
                          • {r.name}
                        </a>

                        {/* Tooltip i cellen */}
                        <div
                          className={
                            "pointer-events-none absolute z-30 " +
                            horizontalPosClass +
                            " w-56 opacity-0 " +
                            verticalPosTip +
                            " group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition bg-white border rounded-lg shadow-xl p-2"
                          }
                          role="dialog"
                          aria-label={`Info om ${r.name}`}
                        >
                          <TooltipContent r={r} />
                        </div>
                      </div>
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

                  {/* Klikk-panel (snur, lukker ved outside-click) */}
                  {activeDay === iso && (
                    <div className={"absolute z-30 " + horizontalPosClass + " " + verticalPosPanel}>
                      <div ref={panelRef} className="w-80 max-h-64 overflow-y-auto overflow-x-visible rounded-xl border bg-white shadow-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-semibold">{isoToReadable(iso)}</div>
                          <button
                            onClick={() => setActiveDay(null)}
                            className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
                            aria-label="Lukk"
                          >
                            Lukk
                          </button>
                        </div>

                        {list.length === 0 ? (
                          <div className="text-xs text-gray-500">Ingen løp denne dagen</div>
                        ) : (
                          <ul className="space-y-2 pr-1">
                            {list.map((r) => (
                              <li key={r.id} className="text-sm relative group overflow-visible">
                                <a
                                  href={r.url || `#/race/${r.id}`}
                                  className="font-medium underline decoration-dotted hover:decoration-solid pointer-events-auto"
                                >
                                  {r.name}
                                </a>
                                <div className="text-xs text-gray-600">
                                  {r.region ? r.region + " • " : ""}
                                  {typeof r.distance_km === "number" ? `${r.distance_km} km` : null}
                                </div>

                                {/* Tooltip inni panelet – alltid nedover */}
                                <div
                                  className={
                                    "pointer-events-none absolute z-40 " +
                                    (isRightCol ? "right-0" : "left-0") +
                                    " w-56 opacity-0 top-full mt-1 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition bg-white border rounded-lg shadow-xl p-2"
                                  }
                                  role="dialog"
                                  aria-label={`Info om ${r.name}`}
                                >
                                  <TooltipContent r={r} />
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

/* --- Gjenbrukt innhold for tooltips --- */
function TooltipContent({ r }) {
  return (
    <>
      <div className="text-[11px] font-semibold text-gray-900 mb-1 line-clamp-2">{r.name}</div>
      <div className="text-[11px] text-gray-600 space-y-1">
        <div>📅 {isoToReadable(normalizeISO(r.date))}</div>
        {r.region && <div>📍 {r.region}</div>}
        {(r.distance || typeof r.distance_km === "number") && (
          <div className="flex flex-wrap gap-1 items-center">
            {typeof r.distance_km === "number" && (
              <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                {r.distance_km} km
              </span>
            )}
            {(Array.isArray(r.distance) ? r.distance : (r.distance || "").split(","))
              .filter(Boolean)
              .map((d, i) => (
                <span key={i} className="inline-block bg-blue-50 text-blue-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                  {String(d).trim().replace(/[\[\]\"']/g, "")}
                </span>
              ))}
          </div>
        )}
        {r.status_note && <div>ℹ️ {r.status_note}</div>}
      </div>
    </>
  );
}

/* -------- Utils (JS) -------- */
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
  const w = new Date(y, m, 1).getDay(); // 0=Sun
  return (w + 6) % 7; // Monday=0
}
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate(), 2).padStart(2, "0");
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
    list.sort((a, b) => (a.name > b.name ? 1 : -1));
    map.set(k, list);
  }
  return map;
}
function normalizeISO(value) {
  const d = new Date(value);
  return toISODate(d);
}
