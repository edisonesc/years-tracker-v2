import React from "react";
import { GridProgress } from "@/components/GridProgress";

interface ExportCardProps {
  birthdate: string;
  target: string;
  targetAge: number;
  birthdateDisplay: string;
  age: { years: number; months: number; days: number };
  remaining: { years: number; months: number; days: number };
  pctLived: number;
}

export const ExportCard = React.forwardRef<HTMLDivElement, ExportCardProps>(
  function ExportCard(
    { birthdate, target, targetAge, birthdateDisplay, age, remaining, pctLived },
    ref,
  ) {
    return (
      <div
        ref={ref}
        style={{ width: 600, backgroundColor: "#0f0f0f", fontFamily: "system-ui, sans-serif" }}
        className="p-10 rounded-3xl"
      >
        {/* Progress accent bar */}
        <div className="relative h-1.5 w-full rounded-full bg-white/8 mb-8">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-500 to-primary-400"
            style={{ width: `${pctLived}%` }}
          />
        </div>

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary-400/60 mb-1">
            Life Tracker
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-5">
            Your Life in Numbers
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/4 border border-white/8">
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">
                Born
              </span>
              <span className="text-xs text-white/60 font-mono">{birthdateDisplay}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/4 border border-white/8">
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">
                Target
              </span>
              <span className="text-xs text-white/60 font-mono">{targetAge} yrs</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="border-t border-white/8 pt-6 mb-6">
          <GridProgress unit="years" date={birthdate} target={target} />
        </div>

        {/* Stats */}
        <div className="border-t border-white/8 pt-6">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-medium mb-1.5">
                Age now
              </p>
              <p className="text-sm font-semibold text-white/80 font-mono">
                {age.years}y {age.months}m {age.days}d
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-medium mb-1.5">
                Remaining
              </p>
              <p className="text-sm font-semibold text-white/80 font-mono">
                {remaining.years}y {remaining.months}m {remaining.days}d
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary-400/60 font-medium mb-1.5">
                Lived
              </p>
              <p className="text-2xl font-bold text-primary-300 font-mono">
                {pctLived.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
