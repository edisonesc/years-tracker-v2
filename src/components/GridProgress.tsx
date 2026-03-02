import React, { useEffect, useRef, useState } from "react";
import { animate, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Unit = "days" | "weeks" | "months" | "years";

interface GridProgressProps {
  unit: Unit;
  date: string;   // "YYYY-MM-DD" — start
  target: string; // "YYYY-MM-DD" — end (exclusive)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a label for a cell given its index start date */
function cellLabel(unit: Unit, start: Date): string {
  switch (unit) {
    case "years":
      return String(start.getFullYear());
    case "months":
      return start.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    case "weeks":
      return `W${Math.ceil(start.getDate() / 7)} ${start.toLocaleDateString("en-US", { month: "short" })} '${String(start.getFullYear()).slice(2)}`;
    case "days":
      return start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

/** Advance a date by one unit */
function addUnit(d: Date, unit: Unit): Date {
  const next = new Date(d);
  switch (unit) {
    case "years":  next.setFullYear(next.getFullYear() + 1); break;
    case "months": next.setMonth(next.getMonth() + 1);       break;
    case "weeks":  next.setDate(next.getDate() + 7);         break;
    case "days":   next.setDate(next.getDate() + 1);         break;
  }
  return next;
}

/** Build the list of cell start-dates from date (inclusive) → target (exclusive) */
function buildCells(date: string, target: string, unit: Unit): Date[] {
  const start = new Date(date + "T00:00:00");
  const end   = new Date(target + "T00:00:00");
  const cells: Date[] = [];
  let cursor = new Date(start);
  while (cursor < end) {
    cells.push(new Date(cursor));
    cursor = addUnit(cursor, unit);
  }
  return cells;
}

// ─── Primary color RGB channels (must match --color-primary-400 in index.css) ─
const P400_R = 251, P400_G = 113, P400_B = 133;

// ─── Config ───────────────────────────────────────────────────────────────────

const CELL_CONFIG: Record<Unit, { base: string; showTooltip: boolean }> = {
  years:  { base: "w-7 h-7 sm:w-10 sm:h-10", showTooltip: true  },
  months: { base: "w-5 h-5 sm:w-7 sm:h-7",  showTooltip: true  },
  weeks:  { base: "w-3 h-3 sm:w-4 sm:h-4",  showTooltip: true  },
  days:   { base: "w-2 h-2 sm:w-3 sm:h-3",  showTooltip: false },
};

const UNIT_LABEL: Record<Unit, string> = {
  years: "Years", months: "Months", weeks: "Weeks", days: "Days",
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Tracks which unit keys have already played their intro animation.
 * Module-level so it survives component remounts (e.g. carousel tab switches)
 * but resets naturally on page refresh.
 */
const playedUnits = new Set<string>();

/**
 * Animates a counter from 0 → target on first mount for a given key.
 * Subsequent mounts (same key) skip straight to target.
 * Only runs when `enabled` is true; otherwise returns `target` immediately.
 * Duration scales with cell count: min 2 s, max 5 s.
 */
function useRevealAnimation(target: number, enabled: boolean, key: string): number {
  const alreadyPlayed = playedUnits.has(key);
  const [revealed, setRevealed] = useState(enabled && !alreadyPlayed ? 0 : target);

  useEffect(() => {
    if (!enabled || target === 0 || alreadyPlayed) {
      const id = setTimeout(() => setRevealed(target), 0);
      return () => clearTimeout(id);
    }
    // 20 ms per cell, min 2 s, max 5 s
    const duration = Math.min(5, Math.max(2, target * 0.02));
    const controls = animate(0, target, {
      duration,
      ease: "easeInOut",
      onUpdate(v) {
        setRevealed(Math.floor(v));
      },
      onComplete() {
        setRevealed(target);
        playedUnits.add(key);
      },
    });
    return () => controls.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return revealed;
}

// ─── Virtualized Days Grid ─────────────────────────────────────────────────────

interface VirtualDaysGridProps {
  cells: Date[];
  filled: number;
  today: Date;
}

/**
 * Renders only the rows visible in the scroll viewport + overscan.
 * Uses ResizeObserver for dimensions and absolute positioning for cells.
 * No extra dependencies required.
 */
function VirtualDaysGrid({ cells, filled, today }: VirtualDaysGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setContainerWidth(r.width);
      setContainerHeight(r.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Mirror CELL_CONFIG for days: w-2/h-2 (8px) + gap-0.5 (2px) on mobile,
  // w-3/h-3 (12px) + gap-1 (4px) at sm+ (≥500px container used as proxy).
  const cellSize = containerWidth >= 500 ? 12 : 8;
  const gap      = containerWidth >= 500 ? 4  : 2;

  const cellsPerRow = containerWidth > 0
    ? Math.max(1, Math.floor((containerWidth + gap) / (cellSize + gap)))
    : 1;
  const totalRows   = Math.ceil(cells.length / cellsPerRow);
  const rowHeight   = cellSize + gap;
  const totalHeight = totalRows * rowHeight;

  const OVERSCAN = 15;
  const firstRow = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
  const lastRow  = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + Math.max(containerHeight, 1)) / rowHeight) + OVERSCAN,
  );

  const visibleCells: React.ReactNode[] = [];
  for (let row = firstRow; row <= lastRow; row++) {
    for (let col = 0; col < cellsPerRow; col++) {
      const i = row * cellsPerRow + col;
      if (i >= cells.length) break;

      const cellDate   = cells[i];
      const isNow      = cellDate.toDateString() === today.toDateString();
      const isRevealed = i < filled;

      const elapsedT = isRevealed && !isNow ? i / Math.max(filled - 1, 1) : undefined;
      const elapsedColor = elapsedT !== undefined
        ? `rgb(${Math.round(P400_R + (255 - P400_R) * elapsedT)},${Math.round(P400_G + (255 - P400_G) * elapsedT)},${Math.round(P400_B + (255 - P400_B) * elapsedT)})`
        : undefined;
      const elapsedGlow = elapsedT !== undefined
        ? `0 0 ${5 + elapsedT * 8.8}px ${elapsedT * 3.8}px rgba(255,255,255,${(0.1 + elapsedT * 0.35).toFixed(2)})`
        : undefined;

      visibleCells.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: col * (cellSize + gap),
            top: row * rowHeight,
            width: cellSize,
            height: cellSize,
            ...(isNow
              ? { boxShadow: "0 0 24px 6px rgba(255,255,255,0.9), 0 0 10px 2px rgba(255,255,255,0.7), 0 0 40px 8px rgba(255,255,255,0.3)" }
              : elapsedColor !== undefined
              ? { backgroundColor: elapsedColor, boxShadow: elapsedGlow }
              : undefined),
          }}
          className={cn(
            "rounded-sm",
            isNow
              ? "bg-white ring-2 ring-white/80 ring-offset-1 ring-offset-transparent"
              : !isRevealed
              ? "bg-white/6 border border-white/10"
              : undefined,
          )}
        />,
      );
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-y-auto"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      {/* Phantom spacer — gives the scrollbar the correct full height */}
      <div style={{ height: totalHeight }} aria-hidden="true" />
      {/* Visible cells rendered absolutely in the container's scroll coordinate space */}
      {containerWidth > 0 && visibleCells}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GridProgress({ unit, date, target }: GridProgressProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells  = buildCells(date, target, unit);
  const filled = cells.filter(c => c <= today).length;
  const total  = cells.length;

  const animated    = unit === "years" || unit === "months";
  const revealed    = useRevealAnimation(filled, animated, unit);
  const isDone      = revealed >= filled;
  const displayPct  = total > 0 ? Math.round((revealed / total) * 100) : 0;

  const { base, showTooltip } = CELL_CONFIG[unit];

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col flex-1 min-h-0 gap-3">
        {/* Header row */}
        <div className="flex items-center justify-between shrink-0">
          <span className="text-xs font-medium uppercase tracking-widest text-white/40">
            {UNIT_LABEL[unit]}
          </span>
          <span className="text-xs text-white/40">
            <span className="text-white/80 font-medium">{revealed}</span>
            <span className="mx-1 text-white/25">/</span>
            {total}
            <span className="ml-2 text-primary-300 font-medium">{displayPct}%</span>
          </span>
        </div>

        {/* Grid — days uses virtual rendering; others scroll naturally */}
        <div className={cn("flex-1 min-h-0", unit === "days" ? "overflow-hidden" : "overflow-y-auto")}>
          {unit === "days" ? (
            <VirtualDaysGrid cells={cells} filled={filled} today={today} />
          ) : (
            <div className="flex flex-wrap gap-0.5 sm:gap-1">
              {cells.map((cellDate, i) => {
                const isNow =
                  unit === "years"
                    ? cellDate.getFullYear() === today.getFullYear()
                    : unit === "months"
                    ? cellDate.getFullYear() === today.getFullYear() &&
                      cellDate.getMonth() === today.getMonth()
                    : (() => {
                        const next = addUnit(cellDate, "weeks");
                        return cellDate <= today && today < next;
                      })();

                // During animation: cell lights up when the reveal counter reaches it
                const isRevealed = i < revealed;
                const label = cellLabel(unit, cellDate);

                // Color transition: indigo (old) → white (recent), t goes 0 → 1
                const elapsedT = isRevealed && !isNow
                  ? i / Math.max(filled - 1, 1)
                  : undefined;

                // Interpolate indigo-400 (129,140,248) → white (255,255,255)
                const elapsedColor = elapsedT !== undefined
                  ? `rgb(${Math.round(P400_R + (255 - P400_R) * elapsedT)},${Math.round(P400_G + (255 - P400_G) * elapsedT)},${Math.round(P400_B + (255 - P400_B) * elapsedT)})`
                  : undefined;

                // Glow is white, scaling with position
                const elapsedGlow = elapsedT !== undefined
                  ? `0 0 ${5 + elapsedT * 8.8}px ${elapsedT * 3.8}px rgba(255,255,255,${(0.1 + elapsedT * 0.35).toFixed(2)})`
                  : undefined;

                const cell = (
                  <div className={isNow && isDone ? "relative" : undefined}>
                    <div
                      style={
                        isNow && isDone
                          ? { boxShadow: "0 0 24px 6px rgba(255,255,255,0.9), 0 0 10px 2px rgba(255,255,255,0.7), 0 0 40px 8px rgba(255,255,255,0.3)" }
                          : elapsedColor !== undefined
                          ? { backgroundColor: elapsedColor, boxShadow: elapsedGlow }
                          : undefined
                      }
                      className={cn(
                        base,
                        "rounded-sm transition-colors duration-100",
                        isNow && isDone
                          ? "bg-white ring-2 ring-white/80 ring-offset-1 ring-offset-transparent"
                          : isRevealed
                          ? undefined
                          : "bg-white/6 border border-white/10"
                      )}
                    />
                    {isNow && isDone && (
                      <motion.div
                        className={cn(base, "absolute inset-0 rounded-sm bg-white/60 pointer-events-none")}
                        animate={{ opacity: [0, 0.9, 0], scale: [0.9, 1.3, 1.7] }}
                        transition={{ duration: 2, repeat: 2, ease: "easeInOut", repeatDelay: 0.2 }}
                      />
                    )}
                  </div>
                );

                return showTooltip ? (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>{cell}</TooltipTrigger>
                    <TooltipContent className="bg-[#1a1a1a] border-white/10 text-white/80 text-[11px]">
                      {label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <React.Fragment key={i}>{cell}</React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-primary-400/40" />
            <span className="text-[11px] text-white/30">Elapsed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="relative w-2.5 h-2.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-white" />
              <motion.div
                className="absolute inset-0 rounded-sm bg-white pointer-events-none"
                animate={{ opacity: [0, 0.6, 0], scale: [0.9, 1.5, 2] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.3 }}
              />
            </div>
            <span className="text-[11px] text-white/25">Now</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-white/6 border border-white/10" />
            <span className="text-[11px] text-white/30">Remaining</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
