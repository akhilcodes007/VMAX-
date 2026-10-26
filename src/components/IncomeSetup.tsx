import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useStore } from "../store/useStore";
import { i18n } from "../lib/i18n";
import { hourlyRate, validateIncome, type IncomeProfile } from "../lib/math";
import { formatINR } from "../lib/format";

interface Props {
  onComplete?: () => void;
  embedded?: boolean;
}

export function IncomeSetup({ onComplete, embedded = false }: Props) {
  const { income, setIncome, lang } = useStore();
  const t = i18n[lang];

  const [monthly, setMonthly] = useState(
    income.monthlyTakeHome > 0 ? String(income.monthlyTakeHome) : ""
  );
  const [workDays, setWorkDays] = useState(String(income.workDaysPerMonth));
  const [hoursDay, setHoursDay] = useState(String(income.hoursPerDay));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState("");

  const numMonthly = parseFloat(monthly.replace(/,/g, "")) || 0;
  const numDays = parseFloat(workDays) || 26;
  const numHours = parseFloat(hoursDay) || 8;

  const previewProfile: IncomeProfile = {
    monthlyTakeHome: numMonthly,
    workDaysPerMonth: numDays,
    hoursPerDay: numHours,
  };

  let previewRate = 0;
  try {
    if (numMonthly > 0) previewRate = hourlyRate(previewProfile);
  } catch {}

  function handleSave() {
    try {
      validateIncome(previewProfile);
      setError("");
      setIncome(previewProfile);
      onComplete?.();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const isValid = numMonthly > 0 && !isNaN(numMonthly);

  return (
    <motion.div
      initial={embedded ? false : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5 }}
      className={embedded ? "" : "min-h-dvh flex items-center justify-center p-4"}
    >
      <div
        className={`glass rounded-3xl p-8 w-full ${embedded ? "" : "max-w-md"}`}
        style={{ border: "1px solid var(--color-border)" }}
      >
        {!embedded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 text-center"
          >
            <h1
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ⏱ TimeWorth
            </h1>
            <p style={{ color: "var(--color-text-muted)" }} className="text-sm">
              {t.tagline}
            </p>
          </motion.div>
        )}

        <h2 className="text-xl font-semibold mb-2">
          {t.incomeSetup.title}
        </h2>
        <p
          className="text-sm mb-6"
          style={{ color: "var(--color-text-muted)" }}
        >
          {t.incomeSetup.subtitle}
        </p>

        {/* Monthly income input */}
        <div className="relative mb-4">
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-lg"
            style={{ color: "var(--color-text-muted)" }}
          >
            ₹
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            placeholder={t.incomeSetup.placeholder}
            aria-label="Monthly take-home pay in rupees"
            className="w-full pl-10 pr-4 py-4 rounded-2xl text-xl font-semibold outline-none transition-all"
            style={{
              background: "var(--color-surface-hover)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(124,58,237,0.5)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "var(--color-border)")
            }
          />
        </div>

        {/* Live preview */}
        <AnimatePresence>
          {previewRate > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.2)",
              }}
            >
              <span className="gradient-text">
                {t.incomeSetup.preview(formatINR(previewRate))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1 text-sm mb-4 cursor-pointer"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ChevronDown
            size={14}
            className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          />
          {t.incomeSetup.advancedToggle}
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-3 mb-4 overflow-hidden"
            >
              <div>
                <label
                  className="text-xs mb-1 block"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {t.incomeSetup.workDays}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={workDays}
                  onChange={(e) => setWorkDays(e.target.value)}
                  min={1}
                  max={31}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{
                    background: "var(--color-surface-hover)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                  }}
                />
              </div>
              <div>
                <label
                  className="text-xs mb-1 block"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {t.incomeSetup.hoursPerDay}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={hoursDay}
                  onChange={(e) => setHoursDay(e.target.value)}
                  min={1}
                  max={24}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{
                    background: "var(--color-surface-hover)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          disabled={!isValid}
          onClick={handleSave}
          className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          style={{
            background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
          }}
        >
          {embedded ? <Check size={18} /> : null}
          {t.incomeSetup.saveBtn}
        </motion.button>
      </div>
    </motion.div>
  );
}
