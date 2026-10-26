import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2 } from "lucide-react";
import { toPng } from "html-to-image";
import { useStore } from "../store/useStore";
import { lifeHours, futureValueLump } from "../lib/math";
import { formatINR, formatCompact } from "../lib/format";

interface Props {
  open: boolean;
  onClose: () => void;
}

function ShareCardContent({
  item,
  amount,
  hours,
  fvAmount,
  fvHours,
}: {
  item: string;
  amount: number;
  hours: number;
  fvAmount: number;
  fvHours: number;
}) {
  return (
    <div
      id="share-card-inner"
      className="share-card-inner"
      style={{
        width: 540,
        height: 540,
        background: "linear-gradient(135deg, #0B0F1A 0%, #1a0b3e 50%, #0b1a2e 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 48,
        position: "relative",
        overflow: "hidden",
        borderRadius: 32,
      }}
    >
      {/* Background orbs */}
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)",
          top: -60,
          right: -60,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)",
          bottom: -40,
          left: -40,
        }}
      />

      {/* Brand */}
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 32,
          fontFamily: "Space Grotesk, system-ui",
          fontSize: 18,
          fontWeight: 700,
          background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        ⏱ TimeWorth
      </div>

      {/* Item name */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: "rgba(240,244,255,0.6)",
          marginBottom: 8,
          textAlign: "center",
          fontFamily: "Space Grotesk, system-ui",
        }}
      >
        {item || "My purchase"}
      </div>

      {/* Price */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#F0F4FF",
          marginBottom: 24,
          fontFamily: "Space Grotesk, system-ui",
        }}
      >
        {formatINR(amount)}
      </div>

      {/* Equals */}
      <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>

      {/* Big hours number */}
      <div
        style={{
          fontFamily: "Space Grotesk, system-ui",
          fontVariantNumeric: "tabular-nums",
          fontSize: 80,
          fontWeight: 700,
          lineHeight: 1,
          background: "linear-gradient(135deg, #F59E0B, #FBBF24)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: 4,
        }}
      >
        {hours.toFixed(1)}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#F59E0B",
          marginBottom: 32,
          fontFamily: "Space Grotesk, system-ui",
        }}
      >
        hours of my life
      </div>

      {/* Future value */}
      <div
        style={{
          padding: "12px 24px",
          borderRadius: 16,
          background: "rgba(124,58,237,0.15)",
          border: "1px solid rgba(124,58,237,0.3)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "rgba(240,244,255,0.5)",
            marginBottom: 4,
            fontFamily: "Space Grotesk, system-ui",
          }}
        >
          Invested instead →
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "Space Grotesk, system-ui",
          }}
        >
          {formatCompact(fvAmount)} = {fvHours.toFixed(0)} hrs of freedom
        </div>
      </div>

      {/* Disclaimer */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          fontSize: 10,
          color: "rgba(240,244,255,0.25)",
          textAlign: "center",
          fontFamily: "Space Grotesk, system-ui",
          padding: "0 32px",
        }}
      >
        Educational tool, not financial advice. Returns not guaranteed.
      </div>
    </div>
  );
}

export function ShareCard({ open, onClose }: Props) {
  const { income, currentPrice, currentItem, sliderYears, sliderRate } = useStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const price = currentPrice || 4999;
  const item = currentItem || "My purchase";
  const hours = lifeHours(price, income);
  const fvAmount = futureValueLump(price, sliderRate, sliderYears);
  const fvHours = fvAmount / (income.monthlyTakeHome / (income.workDaysPerMonth * income.hoursPerDay));

  async function generate() {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `timeworth-${item.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Share card generation failed:", e);
    } finally {
      setGenerating(false);
    }
  }

  async function shareNative() {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });
      // Convert data URL to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "timeworth.png", { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "TimeWorth",
          text: `${item} = ${hours.toFixed(1)} hours of my life`,
          files: [file],
        });
      } else {
        // Fallback to download
        generate();
      }
    } catch (e) {
      console.error("Share failed:", e);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
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
            <div className="w-full max-w-sm">
              {/* Close button */}
              <div className="flex justify-end mb-3">
                <button
                  onClick={onClose}
                  className="p-2 rounded-full cursor-pointer"
                  style={{
                    background: "var(--color-surface)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Card preview */}
              <div
                ref={cardRef}
                style={{ borderRadius: 32, overflow: "hidden" }}
              >
                <ShareCardContent
                  item={item}
                  amount={price}
                  hours={hours}
                  fvAmount={fvAmount}
                  fvHours={fvHours}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-4">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={shareNative}
                  disabled={generating}
                  className="flex-1 py-3 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                  }}
                >
                  <Share2 size={16} />
                  {generating ? "Generating..." : "Share"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={generate}
                  disabled={generating}
                  className="py-3 px-5 rounded-2xl font-semibold text-sm flex items-center gap-2 cursor-pointer"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                  }}
                >
                  <Download size={16} />
                  PNG
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
