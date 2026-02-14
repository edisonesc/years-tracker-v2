import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type Panel = "calendar" | "month" | "year";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  max?: string;
}

export function DatePicker({ value, onChange, max }: DatePickerProps) {
  const today = new Date();
  const maxDate = max ? new Date(max) : today;

  const parsed = value ? new Date(value + "T00:00:00") : null;

  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("calendar");
  const [viewYear, setViewYear] = useState(
    parsed?.getFullYear() ?? today.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    parsed?.getMonth() ?? today.getMonth(),
  );
  // Year grid: show a decade window
  const [yearBase, setYearBase] = useState(
    Math.floor((parsed?.getFullYear() ?? today.getFullYear()) / 12) * 12,
  );

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const selectDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    if (d > maxDate) return;
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(iso);
    setOpen(false);
  };

  const selectMonth = (m: number) => {
    setViewMonth(m);
    setPanel("calendar");
  };

  const selectYear = (y: number) => {
    setViewYear(y);
    setPanel("month");
  };

  const isSelected = (day: number) =>
    parsed?.getFullYear() === viewYear &&
    parsed?.getMonth() === viewMonth &&
    parsed?.getDate() === day;

  const isDisabled = (day: number) =>
    new Date(viewYear, viewMonth, day) > maxDate;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const displayLabel = parsed
    ? parsed.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Pick a date";

  const blanks = Array.from({ length: firstDay });
  const dayNums = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const yearNums = Array.from({ length: 12 }, (_, i) => yearBase + i);

  // Shared nav button style — !bg-transparent and !border-transparent override index.css global button rules
  const navBtn =
    "w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border-transparent outline-none text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer";

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setPanel("calendar");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full h-11 flex items-center gap-3 px-3 rounded-xl border text-sm transition-colors bg-transparent outline-none",
            "bg-white/4 border-white/8 hover:border-white/20",
            "focus:ring-1 focus:ring-indigo-400/40 focus:border-indigo-400/30",
            parsed ? "text-white" : "text-white/30",
          )}
        >
          <CalendarDays className="w-4 h-4 text-white/30 shrink-0" />
          <span className="flex-1 text-left">{displayLabel}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-72 p-0 border border-white/10 bg-[#161616] shadow-2xl shadow-black/60 rounded-2xl overflow-hidden"
      >
        {/* ── CALENDAR PANEL ── */}
        {panel === "calendar" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.07]">
              <button type="button" onClick={prevMonth} className={navBtn}>
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setPanel("month")}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-transparent border-transparent outline-none text-sm font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                {MONTHS[viewMonth]} {viewYear}
                <ChevronDown className="w-3 h-3 text-white/40" />
              </button>

              <button type="button" onClick={nextMonth} className={navBtn}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day-of-week row */}
            <div className="grid grid-cols-7 px-3 pt-3 pb-1">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="flex items-center justify-center text-[11px] font-medium text-white/25 h-7"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
              {blanks.map((_, i) => (
                <div key={`b${i}`} />
              ))}
              {dayNums.map((day) => (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled(day)}
                  onClick={() => selectDay(day)}
                  className={cn(
                    "h-8 w-full flex items-center justify-center rounded-lg text-sm transition-colors border-0 outline-none cursor-pointer",
                    isSelected(day)
                      ? "bg-indigo-500 text-white font-medium"
                      : isToday(day)
                        ? "border border-white/20 bg-transparent text-white hover:bg-white/10"
                        : "bg-transparent text-white/65 hover:bg-white/8 hover:text-white",
                    isDisabled(day) &&
                      "opacity-20 cursor-not-allowed pointer-events-none",
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── MONTH PANEL ── */}
        {panel === "month" && (
          <>
            <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.07]">
              <button
                type="button"
                onClick={() => setPanel("year")}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-transparent border-transparent outline-none text-sm font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                {viewYear}
                <ChevronDown className="w-3 h-3 text-white/40" />
              </button>
              <button
                type="button"
                onClick={() => setPanel("calendar")}
                className={navBtn}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-4">
              {MONTHS_SHORT.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => selectMonth(i)}
                  className={cn(
                    "h-9 rounded-lg text-sm transition-colors border-0 outline-none cursor-pointer",
                    viewMonth === i
                      ? "bg-indigo-500 text-white font-medium"
                      : "bg-transparent text-white/65 hover:bg-white/8 hover:text-white",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── YEAR PANEL ── */}
        {panel === "year" && (
          <>
            <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.07]">
              <button
                type="button"
                onClick={() => setYearBase((y) => y - 12)}
                className={navBtn}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-white/60">
                {yearBase} – {yearBase + 11}
              </span>
              <button
                type="button"
                onClick={() => setYearBase((y) => y + 12)}
                className={navBtn}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-4">
              {yearNums.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => selectYear(y)}
                  className={cn(
                    "h-9 rounded-lg text-sm transition-colors border-0 outline-none cursor-pointer",
                    viewYear === y
                      ? "bg-indigo-500 text-white font-medium"
                      : "bg-transparent text-white/65 hover:bg-white/8 hover:text-white",
                    y > maxDate.getFullYear() &&
                      "opacity-20 cursor-not-allowed pointer-events-none",
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
