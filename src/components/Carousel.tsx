import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselContextValue {
  active: number;
  count: number;
  direction: number;
  setActive: (i: number) => void;
  prev: () => void;
  next: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const ctx = React.useContext(CarouselContext);
  if (!ctx) throw new Error("Carousel sub-components must be used inside <Carousel>");
  return ctx;
}

// ─── Root ────────────────────────────────────────────────────────────────────

interface CarouselProps {
  className?: string;
  children: React.ReactNode;
}

function Carousel({ className, children }: CarouselProps) {
  const [active, setActiveRaw] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const [count, setCount] = React.useState(0);
  const touchStartX = React.useRef<number | null>(null);

  const setActive = (i: number) => {
    setDirection(i > active ? 1 : -1);
    setActiveRaw(i);
  };

  const prev = () => {
    setDirection(-1);
    setActiveRaw((i) => (count === 0 ? 0 : i === 0 ? count - 1 : i - 1));
  };

  const next = () => {
    setDirection(1);
    setActiveRaw((i) => (count === 0 ? 0 : i === count - 1 ? 0 : i + 1));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) { if (delta < 0) next(); else prev(); }
    touchStartX.current = null;
  };

  return (
    <CarouselContext.Provider value={{ active, count, direction, setActive, prev, next, onTouchStart, onTouchEnd }}>
      <CountReporter setCount={setCount} children={children} />
      <div className={cn("flex flex-col gap-4", className)}>
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

// Counts CarouselItem children inside CarouselContent to set `count`
function CountReporter({
  children,
  setCount,
}: {
  children: React.ReactNode;
  setCount: (n: number) => void;
}) {
  React.useEffect(() => {
    let n = 0;
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      if ((child.type as { displayName?: string }).displayName === "CarouselContent") {
        React.Children.forEach(
          (child.props as { children?: React.ReactNode }).children,
          (item) => {
            if (React.isValidElement(item) &&
                (item.type as { displayName?: string }).displayName === "CarouselItem") {
              n++;
            }
          }
        );
      }
    });
    setCount(n);
  });
  return null;
}

// ─── Tabs nav bar ─────────────────────────────────────────────────────────────

interface CarouselTabsProps {
  labels: string[];
  className?: string;
}

function CarouselTabs({ labels, className }: CarouselTabsProps) {
  const { active, setActive, prev, next } = useCarousel();
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <button
        type="button"
        onClick={prev}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border-transparent text-white/40 hover:text-white hover:bg-white/8 transition-colors cursor-pointer outline-none"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
        {labels.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "relative px-2 sm:px-3 py-1 rounded-lg text-xs font-medium cursor-pointer outline-none border-transparent bg-transparent transition-colors",
              active === i ? "text-white" : "text-white/40 hover:text-white/70",
            )}
          >
            {active === i && (
              <motion.div
                layoutId="carousel-tab-indicator"
                className="absolute inset-0 rounded-lg bg-primary-500"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={next}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border-transparent text-white/40 hover:text-white hover:bg-white/8 transition-colors cursor-pointer outline-none"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
CarouselTabs.displayName = "CarouselTabs";

// ─── Content (swipeable panel wrapper) ───────────────────────────────────────

interface CarouselContentProps {
  className?: string;
  children: React.ReactNode;
}

const CarouselContent = React.forwardRef<HTMLDivElement, CarouselContentProps>(
  function CarouselContent({ className, children }, ref) {
    const { onTouchStart, onTouchEnd, active, direction } = useCarousel();
    const items = React.Children.toArray(children);

    return (
      <div
        ref={ref}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={cn("bg-white/3 border border-white/8 rounded-2xl p-4 sm:p-6 overflow-hidden flex-1 min-h-0 flex flex-col", className)}
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={active}
            custom={direction}
            initial={{ x: direction * 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -24, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex-1 min-h-0 flex flex-col"
          >
            {items[active]}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }
);
CarouselContent.displayName = "CarouselContent";

// ─── Item ─────────────────────────────────────────────────────────────────────

interface CarouselItemProps {
  className?: string;
  children: React.ReactNode;
}

function CarouselItem({ className, children }: CarouselItemProps) {
  return <div className={cn("flex-1 min-h-0 flex flex-col", className)}>{children}</div>;
}
CarouselItem.displayName = "CarouselItem";

// ─── Dot indicators ───────────────────────────────────────────────────────────

function CarouselDots({ className }: { className?: string }) {
  const { active, count, setActive } = useCarousel();
  return (
    <div className={cn("flex items-center justify-center gap-1.5 pt-1", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setActive(i)}
          className="rounded-full cursor-pointer outline-none border-transparent bg-transparent"
        >
          <motion.div
            animate={{
              width: active === i ? 16 : 6,
              backgroundColor: active === i ? "var(--color-primary-400)" : "rgba(255,255,255,0.2)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="h-1.5 rounded-full"
          />
        </button>
      ))}
    </div>
  );
}
CarouselDots.displayName = "CarouselDots";

export { Carousel, CarouselTabs, CarouselContent, CarouselItem, CarouselDots };
