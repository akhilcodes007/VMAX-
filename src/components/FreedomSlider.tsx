import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useStore } from "../store/useStore";
import { i18n } from "../lib/i18n";
import {
  futureValueLump,
  futureHours,
  growthChartData,
  lifeHours,
} from "../lib/math";
import { formatCompact, formatHours } from "../lib/format";

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="px-3 py-2 rounded-xl text-xs"
      style={{
        background: "rgba(11,15,26,0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(8px)",
      }}
    >
      <p className="font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>
        Year {label}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: i === 0 ? "#F59E0B" : "#7C3AED" }}>
          {i === 0 ? "Spent: " : "Invested: "}
          {formatCompact(p.value)}
        </p>
      ))}
    </div>
  );
}

export function FreedomSlider() {
  const {
    income,
    sliderYears,
    sliderRate,
    setSliderYears,
    setSliderRate,
    currentPrice,
    lang,
  } = useStore();
  const t = i18n[lang];

  const price = currentPrice || 4999;
  const fv = futureValueLump(price > 0 ? price : 4999, sliderRate, sliderYears);
  const todayHours = lifeHours(price > 0 ? price : 4999, income);
  const futureH = futureHours(price > 0 ? price : 4999, sliderRate, sliderYears, income);

  const chartData = growthChartData(price > 0 ? price : 4999, sliderRate, 30);

  return (
    <section className="py-10 px-4 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-2">{t.slider.title}</h2>
        <p
          className="text-sm mb-6"
          style={{ color: "var(--color-text-muted)" }}
        >
          {t.slider.invested(formatCompact(fv), sliderYears)}
        </p>

        {/* Two comparison cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Today cost */}
          <motion.div
            className="glass rounded-2xl p-5 text-center"
            style={{
              border: "1px solid rgba(245,158,11,0.2)",
              background: "rgba(245,158,11,0.05)",
            }}
          >
            <p
              className="text-xs font-medium uppercase tracking-wider mb-2"
              style={{ color: "var(--color-amber)" }}
            >
              {t.slider.costsToday}
            </p>
            <p
              className="hero-number text-4xl font-bold mb-1"
              style={{ color: "var(--color-amber)" }}
            >
              {todayHours.toFixed(1)}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              hrs of your life
            </p>
          </motion.div>

          {/* Future cost */}
          <motion.div
            className="glass rounded-2xl p-5 text-center"
            style={{
              border: "1px solid rgba(124,58,237,0.2)",
              background: "rgba(124,58,237,0.05)",
            }}
          >
            <p
              className="text-xs font-medium uppercase tracking-wider mb-2 gradient-text"
            >
              {t.slider.costsFuture}
            </p>
            <p
              className="hero-number text-4xl font-bold mb-1 gradient-text"
            >
              {futureH.toFixed(1)}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              hrs of freedom
            </p>
          </motion.div>
        </div>

        {/* Freedom line */}
        <div
          className="mb-6 px-4 py-3 rounded-xl text-sm text-center font-medium"
          style={{
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.15)",
          }}
        >
          {t.slider.freedomHours(formatHours(futureH))}
        </div>

        {/* Sliders */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Years slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium">{t.slider.yearsLabel}</label>
                <span className="gradient-text font-bold text-lg">
                  {sliderYears} yr
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={sliderYears}
                onChange={(e) => setSliderYears(Number(e.target.value))}
                aria-label={`Investment horizon: ${sliderYears} years`}
                aria-valuetext={`${sliderYears} years`}
                aria-valuemin={1}
                aria-valuemax={30}
                className="w-full"
              />
              <div
                className="flex justify-between text-xs mt-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                <span>1yr</span>
                <span>30yr</span>
              </div>
            </div>

            {/* Rate slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium">{t.slider.returnLabel}</label>
                <span className="gradient-text font-bold text-lg">
                  {sliderRate}%
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={0.5}
                value={sliderRate}
                onChange={(e) => setSliderRate(Number(e.target.value))}
                aria-label={`Expected return rate: ${sliderRate}%`}
                aria-valuetext={`${sliderRate} percent`}
                aria-valuemin={1}
                aria-valuemax={20}
                className="w-full"
              />
              <div
                className="flex justify-between text-xs mt-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                <span>1%</span>
                <span>20%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Chart */}
        <div
          className="glass rounded-2xl p-4 mb-4"
          style={{ height: 240 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: "rgba(240,244,255,0.4)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatCompact(v)}
                tick={{ fontSize: 10, fill: "rgba(240,244,255,0.4)" }}
                tickLine={false}
                axisLine={false}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                x={sliderYears}
                stroke="rgba(255,255,255,0.3)"
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="#F59E0B"
                strokeWidth={2}
                fill="url(#gradSpent)"
                name="Spent"
              />
              <Area
                type="monotone"
                dataKey="invested"
                stroke="#7C3AED"
                strokeWidth={2}
                fill="url(#gradInvested)"
                name="Invested"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Disclaimer */}
        <p
          className="text-xs text-center"
          style={{ color: "var(--color-text-muted)" }}
        >
          ⚠️ {t.slider.disclaimer}
        </p>
      </motion.div>
    </section>
  );
}
