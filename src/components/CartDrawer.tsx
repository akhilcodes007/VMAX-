import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, RotateCcw, Trash2 } from "lucide-react";
import { useStore } from "../store/useStore";
import { i18n } from "../lib/i18n";
import { futureValueLump, futureValueRecurring } from "../lib/math";
import { formatINR, formatCompact, formatHours, humanScale } from "../lib/format";

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍔",
  shopping: "🛍️",
  travel: "✈️",
  entertainment: "🎬",
  bills: "📄",
  other: "📦",
};

export function CartDrawer() {
  const {
    cartOpen,
    setCartOpen,
    cart,
    removeFromCart,
    undoLastRemoved,
    lastRemoved,
    clearCart,
    sliderYears,
    sliderRate,
    income,
    lang,
  } = useStore();
  const t = i18n[lang];

  const totalAmount = cart.reduce((s, i) => s + i.amount, 0);
  const totalHours = cart.reduce((s, i) => s + i.lifeHours, 0);

  // Calculate combined future value for cart
  const totalFV = cart.reduce((s, item) => {
    if (item.frequency === "once") {
      return (
        s + futureValueLump(item.amount, sliderRate, sliderYears)
      );
    } else {
      return (
        s +
        futureValueRecurring(
          item.amount,
          item.frequency,
          item.timesPerPeriod,
          sliderRate,
          sliderYears
        )
      );
    }
  }, 0);

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setCartOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col"
            style={{
              background: "var(--color-bg)",
              borderLeft: "1px solid var(--color-border)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-6 py-5"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <ShoppingBag size={20} className="gradient-text" />
              <h2 className="text-lg font-bold flex-1">{t.cart.title}</h2>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="p-2 rounded-xl cursor-pointer"
                  style={{
                    color: "var(--color-text-muted)",
                    background: "var(--color-surface-hover)",
                  }}
                  title="Clear all"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-xl cursor-pointer"
                style={{
                  color: "var(--color-text-muted)",
                  background: "var(--color-surface-hover)",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {cart.length === 0 ? (
                <div
                  className="text-center py-16"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <p className="text-4xl mb-3">🛒</p>
                  <p className="text-sm">{t.cart.empty}</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30, height: 0 }}
                      layout
                      className="glass rounded-2xl p-4 flex items-start gap-3"
                    >
                      <span className="text-2xl pt-0.5">
                        {CATEGORY_EMOJI[item.category]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {item.name}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {formatINR(item.amount)}
                          {item.frequency !== "once" &&
                            ` × ${item.timesPerPeriod}/${item.frequency}`}
                        </p>
                        <p
                          className="text-xs mt-1 font-medium"
                          style={{ color: "var(--color-amber)" }}
                        >
                          ⏱ {item.lifeHours.toFixed(1)} hrs
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 rounded-lg cursor-pointer shrink-0"
                        style={{
                          color: "var(--color-text-muted)",
                          background: "var(--color-surface-hover)",
                        }}
                        aria-label={`Remove ${item.name}`}
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {/* Undo toast */}
              <AnimatePresence>
                {lastRemoved && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{
                      background: "rgba(124,58,237,0.1)",
                      border: "1px solid rgba(124,58,237,0.2)",
                    }}
                  >
                    <span className="text-sm">Removed "{lastRemoved.name}"</span>
                    <button
                      onClick={undoLastRemoved}
                      className="flex items-center gap-1 text-xs font-semibold cursor-pointer"
                      style={{ color: "#A78BFA" }}
                    >
                      <RotateCcw size={12} />
                      {t.cart.removeUndo}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer totals */}
            {cart.length > 0 && (
              <div
                className="px-6 py-5 space-y-3"
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text-muted)" }}>
                    {t.cart.totalAmount}
                  </span>
                  <span className="font-semibold">{formatINR(totalAmount)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text-muted)" }}>
                    Life cost
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: "var(--color-amber)" }}
                  >
                    {formatHours(totalHours)}
                  </span>
                </div>

                <div
                  className="px-4 py-3 rounded-xl text-center"
                  style={{
                    background: "rgba(245,158,11,0.06)",
                    border: "1px solid rgba(245,158,11,0.1)",
                  }}
                >
                  <p className="text-sm font-medium" style={{ color: "var(--color-amber)" }}>
                    {t.cart.totalHours(humanScale(totalHours, income.hoursPerDay))}
                  </p>
                </div>

                <div
                  className="px-4 py-3 rounded-xl text-center"
                  style={{
                    background: "rgba(124,58,237,0.06)",
                    border: "1px solid rgba(124,58,237,0.1)",
                  }}
                >
                  <p
                    className="text-xs mb-1"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {t.cart.invested(sliderYears)}
                  </p>
                  <p className="font-bold gradient-text">{formatCompact(totalFV)}</p>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
