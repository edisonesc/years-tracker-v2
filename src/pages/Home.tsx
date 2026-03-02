import {
  BIRTH_DATE_KEY,
  DEFAULT_TARGET_YEAR,
  TARGET_DATE_KEY,
} from "@/constants";
import { useState, useEffect, useRef } from "react";
import NumberFlow from "@number-flow/react";
import { Navigate, useNavigate } from "react-router-dom";
import { Download, Settings2 } from "lucide-react";
import { toPng } from "html-to-image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Carousel,
  CarouselTabs,
  CarouselContent,
  CarouselItem,
  CarouselDots,
} from "@/components/Carousel";
import { GridProgress } from "@/components/GridProgress";
import { ExportCard } from "@/components/ExportCard";

/** Break a date difference into { years, months, days } components */
function getDateDiff(from: Date, to: Date) {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();

  if (days < 0) {
    months--;
    const daysInPrevMonth = new Date(
      to.getFullYear(),
      to.getMonth(),
      0,
    ).getDate();
    days += daysInPrevMonth;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
}

/** Percentage of lifespan elapsed, 0–100 */
function getPercentLived(birth: Date, target: Date, now: Date): number {
  const total = target.getTime() - birth.getTime();
  const elapsed = now.getTime() - birth.getTime();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

const UNITS = ["years", "months", "weeks", "days"] as const;
type Unit = (typeof UNITS)[number];

const UNIT_LABELS: Record<Unit, string> = {
  years: "Years",
  months: "Months",
  weeks: "Weeks",
  days: "Days",
};

export default function Home() {
  const navigate = useNavigate();
  const [birthdate] = useState<string | null>(
    localStorage.getItem(BIRTH_DATE_KEY),
  );
  const [targetAge, setTargetAge] = useState<number>(() => {
    const stored = localStorage.getItem(TARGET_DATE_KEY);
    return stored !== null ? Number(stored) : DEFAULT_TARGET_YEAR;
  });
  const [targetAgeInput, setTargetAgeInput] = useState<string>(() => {
    const stored = localStorage.getItem(TARGET_DATE_KEY);
    return stored !== null ? stored : String(DEFAULT_TARGET_YEAR);
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [displayAge, setDisplayAge] = useState(0);
  const [showExportCard, setShowExportCard] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  async function exportImage() {
    setShowExportCard(true);
    // Wait one frame for React to mount the card before capturing
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
    const el = captureRef.current;
    if (el) {
      const dataUrl = await toPng(el, {
        backgroundColor: "#0f0f0f",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = "my-life-progress.png";
      link.href = dataUrl;
      link.click();
    }
    setShowExportCard(false);
  }

  useEffect(() => {
    const id = setTimeout(() => setDisplayAge(targetAge), 0);
    return () => clearTimeout(id);
  }, [targetAge]);

  if (!birthdate) return <Navigate to="/setup" replace />;

  const targetYear =
    new Date(birthdate + "T00:00:00").getFullYear() + targetAge + 1;
  const target = `${targetYear}${birthdate.slice(4)}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const birthDate = new Date(birthdate + "T00:00:00");
  const targetDate = new Date(target + "T00:00:00");
  const age = getDateDiff(birthDate, today);
  const remaining = getDateDiff(today, targetDate);
  const pctLived = getPercentLived(birthDate, targetDate, today);

  const handleTargetAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTargetAgeInput(raw);
    const val = Number(raw);
    if (!Number.isNaN(val) && val > 0) {
      setTargetAge(val);
      localStorage.setItem(TARGET_DATE_KEY, String(val));
    }
  };

  const birthdateDisplay = new Date(birthdate + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );

  return (
    <>
      {/* Off-screen export card — mounted only during export */}
      {showExportCard && (
        <div
          style={{ position: "fixed", left: "-9999px", top: 0, pointerEvents: "none" }}
          aria-hidden="true"
        >
          <ExportCard
            ref={captureRef}
            birthdate={birthdate}
            target={target}
            targetAge={targetAge}
            birthdateDisplay={birthdateDisplay}
            age={age}
            remaining={remaining}
            pctLived={pctLived}
          />
        </div>
      )}

    <div className="w-screen h-screen bg-[#0f0f0f] p-4 sm:p-8 lg:p-16 flex flex-col">
      <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 flex-1 min-h-0">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 sm:space-y-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary-400/60 mb-1">
                Life Tracker
              </p>
              <h1 className="text-2xl font-semibold tracking-tight bg-linear-to-r from-white to-white/50 bg-clip-text text-transparent">
                Your Life in Numbers
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Born chip */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/4 border border-white/8">
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">
                  Born
                </span>
                <span className="text-xs text-white/60 font-mono">
                  {new Date(birthdate + "T00:00:00").toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </span>
              </div>

              {/* Target age chip */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/4 border border-white/8">
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium leading-none">
                  Target
                </span>
                <NumberFlow
                  value={displayAge}
                  className="text-xs text-white/60 font-mono [font-variant-numeric:tabular-nums] leading-none"
                />
                <span className="text-[10px] text-white/30 font-medium leading-none">
                  yrs
                </span>
              </div>

              {/* Age now chip */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/4 border border-white/8">
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Age now</span>
                <span className="text-xs text-white/60 font-mono">{age.years}y {age.months}m {age.days}d</span>
              </div>

              {/* Remaining chip */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/4 border border-white/8">
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Remaining</span>
                <span className="text-xs text-white/60 font-mono">{remaining.years}y {remaining.months}m {remaining.days}d</span>
              </div>

              {/* Lived chip */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500/10 border border-primary-500/20">
                <span className="text-[10px] uppercase tracking-widest text-primary-400/60 font-medium">Lived</span>
                <span className="text-sm font-semibold text-primary-300 font-mono">{pctLived.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={exportImage}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors cursor-pointer outline-none border-transparent bg-transparent"
          >
            <Download className="w-4 h-4" />
          </button>

          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors cursor-pointer outline-none border-transparent bg-transparent"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-56 bg-[#111111] border-white/8 text-white p-0 overflow-hidden shadow-2xl shadow-black/50"
            >
              {/* Popover header */}
              <div className="px-4 py-3 border-b border-white/6">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary-400/60">
                  Settings
                </p>
              </div>

              {/* Fields */}
              <div className="px-4 py-3 space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-white/30 font-medium">
                  Target age
                </Label>
                <Input
                  type="number"
                  value={targetAgeInput}
                  onChange={handleTargetAgeChange}
                  className="h-8 bg-white/4 border-white/8 text-white text-sm font-mono focus-visible:ring-1 focus-visible:ring-primary-500/50 focus-visible:border-primary-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-white/6">
                <button
                  type="button"
                  onClick={() => navigate("/setup")}
                  className="w-full h-8 flex items-center justify-center gap-2 rounded-lg bg-white/4 border border-white/8 text-[10px] uppercase tracking-widest text-white/40 font-medium hover:text-white/70 hover:bg-white/8 transition-colors cursor-pointer outline-none"
                >
                  Setup
                </button>
              </div>
            </PopoverContent>
          </Popover>
          </div>
        </div>

        <Carousel className="flex-1 min-h-0">
          <CarouselTabs labels={Object.values(UNIT_LABELS)} />
          <CarouselContent>
            {UNITS.map((unit) => (
              <CarouselItem key={unit}>
                <GridProgress unit={unit} date={birthdate} target={target} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselDots />
        </Carousel>
      </div>
    </div>
    </>
  );
}
