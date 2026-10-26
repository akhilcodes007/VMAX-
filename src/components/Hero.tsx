import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useStore } from "../store/useStore";
import { i18n } from "../lib/i18n";
import { lifeHours, lifeHoursBreakdown, hourlyRate } from "../lib/math";
import { formatINR, humanScale } from "../lib/format";

const PRICE_STEP = 100;

// Animated count-up hook
function useCountUp(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const raf = useRef<number>(0);
  const startVal = useRef(display);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    startVal.current = display;
    startTime.current = null;
    cancelAnimationFrame(raf.current);

    function step(now: number) {
      if (!startTime.current) startTime.current = now;
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(startVal.current + (target - startVal.current) * eased);
      if (progress < 1) {
        raf.current = requestAnimationFrame(step);
      }
    }

    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

const EXAMPLES = ["₹4,999 sneakers", "₹1,20,000 phone", "₹450 Zomato"];
const EXAMPLES_TA = ["₹4,999 ஷூ", "₹1,20,000 போன்", "₹450 ஜோமாட்டோ"];

export function Hero() {
  const { income, setCurrentPrice, setCurrentItem, currentPrice, currentItem, lang } =
    useStore();
  const t = i18n[lang];

  const [rawPrice, setRawPrice] = useState(
    currentPrice > 0 ? String(currentPrice) : ""
  );
  const [itemName, setItemName] = useState(currentItem);

  const [isPriceFocused, setIsPriceFocused] = useState(false);
  const priceInputRef = useRef<HTMLInputElement | null>(null);

  const price = parseFloat(rawPrice.replace(/,/g, "")) || 0;
  const rate = hourlyRate(income);
  const hours = price > 0 ? lifeHours(price, income) : 0;
  const breakdown = lifeHoursBreakdown(hours, income);

  const animatedHours = useCountUp(hours);

  useEffect(() => {
    setCurrentPrice(price);
  }, [price, setCurrentPrice]);

  useEffect(() => {
    setCurrentItem(itemName);
  }, [itemName, setCurrentItem]);

  const examples = lang === "ta" ? EXAMPLES_TA : EXAMPLES;

  function fillExample(ex: string) {
    // Extract the amount from the example chip
    const match = ex.match(/₹([\d,]+)/);
    if (match) {
      setRawPrice(match[1].replace(/,/g, ""));
    }
    const name = ex.replace(/₹[\d,]+\s*/, "").trim();
    setItemName(name);
  }

  function handleDecrement() {
    const current = parseFloat(rawPrice.replace(/,/g, "")) || 0;
    const next = Math.max(0, current - PRICE_STEP);
    setRawPrice(next === 0 ? "" : String(next));
    priceInputRef.current?.focus();
  }

  function handleIncrement() {
    const current = parseFloat(rawPrice.replace(/,/g, "")) || 0;
    const next = current + PRICE_STEP;
    setRawPrice(String(next));
    priceInputRef.current?.focus();
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val === "") {
      setRawPrice("");
      return;
    }
    const num = parseFloat(val.replace(/,/g, ""));
    if (!isNaN(num) && num >= 0 && num <= 100_000_000) {
      setRawPrice(val);
    }
  }

  function handlePriceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleDecrement();
    }
  }

  return (
    <section className="relative overflow-hidden py-16 px-4">
      {/* Animated gradient orb */}
      <div
        className="glow-orb"
        style={{
          width: 400,
          height: 400,
          top: -100,
          left: "50%",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(circle, rgba(124,58,237,0.4) 0%, rgba(6,182,212,0.2) 60%, transparent 100%)",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Income chip */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-8 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.2)",
            }}
          >
            ⚡ {formatINR(rate)}/hr
          </span>
          <span>= your time</span>
        </motion.div>

        {/* Main input */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold mb-6"
        >
          {t.hero.title}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3 mb-4"
        >
          {/* Item name */}
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder={t.hero.itemPlaceholder}
            className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none transition-all"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(124,58,237,0.4)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "var(--color-border)")
            }
          />

          {/* Custom Price Control with Stepper */}
          <div
            className="relative flex items-center justify-between w-full sm:w-56 px-2 py-1.5 rounded-2xl transition-all"
            style={{
              background: "var(--color-surface)",
              border: `1px solid ${
                isPriceFocused ? "rgba(124,58,237,0.45)" : "var(--color-border)"
              }`,
              boxShadow: isPriceFocused
                ? "0 0 16px rgba(124,58,237,0.12)"
                : "none",
            }}
          >
            {/* Decrement Button (−) */}
            <button
              type="button"
              onClick={handleDecrement}
              disabled={price <= 0}
              aria-label={`Decrease price by ₹${PRICE_STEP}`}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-400 active:scale-95 shrink-0"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
              onMouseEnter={(e) => {
                if (price > 0) {
                  e.currentTarget.style.background = "rgba(124, 58, 237, 0.15)";
                  e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.35)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              }}
            >
              <Minus size={13} strokeWidth={2.5} />
            </button>

            {/* Price Input & ₹ Symbol */}
            <div className="flex items-center flex-1 min-w-0 mx-2 justify-center">
              <span
                className="text-xs font-semibold mr-1 select-none shrink-0"
                style={{ color: "var(--color-text-muted)" }}
              >
                ₹
              </span>
              <input
                ref={priceInputRef}
                type="number"
                inputMode="decimal"
                min={0}
                step={PRICE_STEP}
                value={rawPrice}
                onChange={handlePriceChange}
                onKeyDown={handlePriceKeyDown}
                placeholder="0"
                aria-label="Price in rupees"
                className="w-full bg-transparent text-sm font-semibold outline-none text-center font-display tracking-tight"
                style={{
                  color: "var(--color-text)",
                }}
                onFocus={() => setIsPriceFocused(true)}
                onBlur={() => setIsPriceFocused(false)}
              />
            </div>

            {/* Increment Button (+) */}
            <button
              type="button"
              onClick={handleIncrement}
              aria-label={`Increase price by ₹${PRICE_STEP}`}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-400 active:scale-95 shrink-0"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(124, 58, 237, 0.15)";
                e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              }}
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>

        {/* Example chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => fillExample(ex)}
              className="px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(124,58,237,0.5)";
                (e.currentTarget as HTMLElement).style.color =
                  "var(--color-text)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--color-border)";
                (e.currentTarget as HTMLElement).style.color =
                  "var(--color-text-muted)";
              }}
            >
              {ex}
            </button>
          ))}
        </motion.div>

        {/* Hero result */}
        <AnimatePresence>
          {price > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="glass rounded-3xl p-8 text-center mb-4"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.05))",
                border: "1px solid rgba(124,58,237,0.2)",
              }}
            >
              <p
                className="text-xs font-medium uppercase tracking-widest mb-3"
                style={{ color: "var(--color-text-muted)" }}
              >
                {itemName || "this purchase"} costs you
              </p>

              {/* GIANT hero number */}
              <div
                className="hero-number font-bold mb-2"
                style={{
                  fontSize: "clamp(72px, 15vw, 120px)",
                  background: "linear-gradient(135deg, #F59E0B, #FBBF24)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
                aria-live="polite"
                aria-label={`${animatedHours.toFixed(1)} hours of your life`}
              >
                {animatedHours.toFixed(1)}
              </div>

              <p className="text-lg font-semibold mb-4" style={{ color: "var(--color-amber)" }}>
                {t.hero.lifeHoursLabel}
              </p>

              <p
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                {t.hero.equivalentLabel(humanScale(hours, income.hoursPerDay))}
              </p>

              {/* Breakdown pills */}
              {breakdown.days >= 1 && (
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {breakdown.days >= 1 && (
                    <span
                      className="px-3 py-1 rounded-full text-xs"
                      style={{
                        background: "rgba(245,158,11,0.1)",
                        border: "1px solid rgba(245,158,11,0.2)",
                        color: "var(--color-amber)",
                      }}
                    >
                      {breakdown.days.toFixed(1)} working days
                    </span>
                  )}
                  {breakdown.weeks >= 1 && (
                    <span
                      className="px-3 py-1 rounded-full text-xs"
                      style={{
                        background: "rgba(245,158,11,0.1)",
                        border: "1px solid rgba(245,158,11,0.2)",
                        color: "var(--color-amber)",
                      }}
                    >
                      {breakdown.weeks.toFixed(1)} work weeks
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
