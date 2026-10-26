import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  ShoppingBag,
  Share2,
  Plus,
  Pencil,
} from "lucide-react";
import { useStore } from "./store/useStore";
import { i18n } from "./lib/i18n";
import { lifeHours, hourlyRate } from "./lib/math";
import { formatINR } from "./lib/format";
import { IncomeSetup } from "./components/IncomeSetup";
import { Hero } from "./components/Hero";
import { FreedomSlider } from "./components/FreedomSlider";
import { SmartInput } from "./components/SmartInput";
import { VerdictCard } from "./components/VerdictCard";
import { CartDrawer } from "./components/CartDrawer";
import { ShareCard } from "./components/ShareCard";
import { LangToggle } from "./components/LangToggle";

// Edit income modal
function EditIncomeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md">
              <IncomeSetup
                embedded
                onComplete={onClose}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const {
    onboarded,
    income,
    lang,
    theme,
    toggleTheme,
    cart,
    setCartOpen,
    currentPrice,
    currentItem,
    shareOpen,
    setShareOpen,
    addToCart,
  } = useStore();
  const t = i18n[lang];

  const [editIncomeOpen, setEditIncomeOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Apply theme class to body
  document.body.className = theme === "light" ? "light" : "";
  // Apply lang class
  if (lang === "ta") document.body.classList.add("lang-ta");

  const rate = hourlyRate(income);
  const hours = currentPrice > 0 ? lifeHours(currentPrice, income) : 0;

  function handleAddToCart() {
    if (currentPrice <= 0) return;
    addToCart({
      name: currentItem || "Item",
      amount: currentPrice,
      lifeHours: hours,
      frequency: "once",
      timesPerPeriod: 1,
      category: "other",
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  // Show onboarding if not yet set up
  if (!onboarded) {
    return (
      <div
        className="min-h-dvh"
        style={{ background: "var(--color-bg)" }}
      >
        <IncomeSetup />
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh pb-24"
      style={{ background: "var(--color-bg)", color: "var(--color-text)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{
          background: "rgba(11,15,26,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <span
          className="text-xl font-bold flex-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          ⏱ {t.appName}
        </span>

        {/* Edit income chip */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setEditIncomeOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <Pencil size={11} />
          <span>{formatINR(rate)}/hr</span>
        </motion.button>

        <LangToggle />

        {/* Theme toggle */}
        <motion.button
          whileTap={{ scale: 0.9, rotate: 15 }}
          onClick={toggleTheme}
          className="p-2 rounded-full cursor-pointer"
          style={{
            background: "var(--color-surface)",
            color: "var(--color-text-muted)",
          }}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </motion.button>

        {/* Cart icon */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setCartOpen(true)}
          className="relative p-2 rounded-full cursor-pointer"
          style={{
            background: "var(--color-surface)",
            color: "var(--color-text-muted)",
          }}
          aria-label="Open cart"
        >
          <ShoppingBag size={16} />
          {cart.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center text-[10px] font-bold"
              style={{ background: "#7C3AED" }}
            >
              {cart.length}
            </motion.span>
          )}
        </motion.button>
      </header>

      {/* Main content */}
      <main>
        {/* Hero section */}
        <Hero />

        {/* Freedom Slider + Chart */}
        <FreedomSlider />

        {/* AI Verdict (shown when a price is entered) */}
        <AnimatePresence>
          {currentPrice > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-4 max-w-2xl mx-auto mb-10"
            >
              <VerdictCard item={currentItem} amount={currentPrice} />
            </motion.section>
          )}
        </AnimatePresence>

        {/* Smart AI input */}
        <SmartInput />
      </main>

      {/* Sticky bottom action bar */}
      <AnimatePresence>
        {currentPrice > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 flex gap-3"
            style={{
              background: "rgba(11,15,26,0.9)",
              backdropFilter: "blur(16px)",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: justAdded
                  ? "#10B981"
                  : "linear-gradient(135deg, #7C3AED, #06B6D4)",
                transition: "background 0.3s ease",
              }}
            >
              {justAdded ? (
                "✓ Added!"
              ) : (
                <>
                  <Plus size={16} />
                  {t.addToCart}
                </>
              )}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShareOpen(true)}
              className="py-3.5 px-5 rounded-2xl font-semibold text-sm flex items-center gap-2 cursor-pointer"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            >
              <Share2 size={16} />
              {t.shareCard}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <CartDrawer />
      <ShareCard open={shareOpen} onClose={() => setShareOpen(false)} />
      <EditIncomeModal
        open={editIncomeOpen}
        onClose={() => setEditIncomeOpen(false)}
      />
    </div>
  );
}
