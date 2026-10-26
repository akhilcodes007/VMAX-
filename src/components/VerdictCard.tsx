import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, AlertTriangle, RotateCcw, Sparkles, Cpu } from "lucide-react";
import { useStore } from "../store/useStore";
import { i18n } from "../lib/i18n";
import { lifeHours, hourlyRate, futureValueLump, futureHours } from "../lib/math";
import { formatINR } from "../lib/format";

interface Props {
  item: string;
  amount: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  alternative?: { name: string; price: number } | null;
  isFallback?: boolean;
  fallbackReason?: string;
}

export function VerdictCard({ item, amount }: Props) {
  const { income, lang, sliderYears, sliderRate, cart } = useStore();
  const t = i18n[lang];

  const [context, setContext] = useState("");
  const [followUpText, setFollowUpText] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "streaming" | "done" | "error"
  >("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [streamingIsFallback, setStreamingIsFallback] = useState(false);
  const [streamingFallbackReason, setStreamingFallbackReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      readerRef.current?.cancel().catch(() => {});
    };
  }, []);

  const rate = hourlyRate(income);
  const hours = amount > 0 ? lifeHours(amount, income) : 0;
  const fv = futureValueLump(amount, sliderRate, sliderYears);
  const fvHours = futureHours(amount, sliderRate, sliderYears, income);

  const cartSummary =
    cart.length > 0
      ? `${cart.length} items (Total ₹${cart.reduce((s, i) => s + i.amount, 0)})`
      : undefined;

  async function executeVerdictQuery(queryText: string, isFollowUp = false) {
    if (amount <= 0 || status === "loading" || status === "streaming") return;

    setStatus("loading");
    setStreamingText("");
    setStreamingIsFallback(false);
    setStreamingFallbackReason("");
    setErrorMsg("");

    const newQueryId = crypto.randomUUID();
    if (isFollowUp) {
      setMessages((prev) => [
        ...prev,
        { id: newQueryId, role: "user", text: queryText },
      ]);
      setFollowUpText("");
    }

    try {
      // Build conversation history to send
      const historyToSend = messages.map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "verdict",
          text: item || "purchase",
          amount,
          lifeHours: hours,
          monthlyIncome: income.monthlyTakeHome,
          hourlyRate: rate,
          workDays: income.workDaysPerMonth,
          hoursPerDay: income.hoursPerDay,
          sliderYears,
          sliderRate,
          futureValue: fv,
          futureFreedomHours: fvHours,
          cartSummary,
          context: queryText,
          lang,
          history: historyToSend,
        }),
        signal: AbortSignal.timeout(18_000),
      });

      if (!res.ok) {
        throw new Error(t.smartInput.aiResting);
      }

      setStatus("streaming");

      const reader = res.body!.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      let isFallbackResult = false;
      let fallbackReasonResult = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              // Extract alternative JSON if present
              let altData: { name: string; price: number } | null = null;
              let displayText = fullText;

              const altMatch = fullText.match(
                /\{"alternative":\s*\{[^}]+\}\s*\}/
              );
              if (altMatch) {
                try {
                  const altParsed = JSON.parse(altMatch[0]);
                  altData = altParsed.alternative;
                  displayText = fullText.replace(altMatch[0], "").trim();
                } catch {
                  displayText = fullText.trim();
                }
              }

              // Save assistant message to thread
              const assistantMessageId = crypto.randomUUID();
              setMessages((prev) => [
                ...prev,
                {
                  id: assistantMessageId,
                  role: "assistant",
                  text: displayText,
                  alternative: altData,
                  isFallback: isFallbackResult,
                  fallbackReason: fallbackReasonResult,
                },
              ]);

              setStreamingText("");
              setStatus("done");
              return;
            }

            try {
              const chunk = JSON.parse(data) as {
                text?: string;
                isFallback?: boolean;
                fallbackReason?: string;
              };

              if (typeof chunk.isFallback === "boolean") {
                isFallbackResult = chunk.isFallback;
                setStreamingIsFallback(chunk.isFallback);
                if (chunk.fallbackReason) {
                  fallbackReasonResult = chunk.fallbackReason;
                  setStreamingFallbackReason(chunk.fallbackReason);
                }
              }

              if (chunk.text) {
                fullText += chunk.text;
                // Don't show raw trailing alternative JSON in the streaming preview
                const cleanPreview = fullText
                  .replace(/\{"alternative":\s*\{[^}]*$/, "")
                  .trim();
                setStreamingText(cleanPreview);
              }
            } catch {
              // Ignore unparseable SSE line
            }
          }
        }
      }

      setStatus("done");
    } catch (e) {
      setStatus("error");
      setErrorMsg(
        (e as Error).message.includes("timeout")
          ? "Request timed out. Please try again."
          : (e as Error).message ?? t.smartInput.aiResting
      );
    }
  }

  function handleInitialAsk() {
    executeVerdictQuery(context, false);
  }

  function handleFollowUp() {
    if (!followUpText.trim()) return;
    executeVerdictQuery(followUpText.trim(), true);
  }

  function handleReset() {
    setMessages([]);
    setContext("");
    setFollowUpText("");
    setStreamingText("");
    setStatus("idle");
    setErrorMsg("");
  }

  return (
    <div className="glass rounded-3xl p-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Bot size={20} className="text-violet-400" />
        <h3 className="text-lg font-bold">{t.verdict.title}</h3>

        {/* Live Badge */}
        <span
          className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
          style={{
            background:
              streamingIsFallback || messages.some((m) => m.isFallback)
                ? "rgba(245,158,11,0.12)"
                : "rgba(16,185,129,0.12)",
            color:
              streamingIsFallback || messages.some((m) => m.isFallback)
                ? "#F59E0B"
                : "#10B981",
            border: `1px solid ${
              streamingIsFallback || messages.some((m) => m.isFallback)
                ? "rgba(245,158,11,0.25)"
                : "rgba(16,185,129,0.25)"
            }`,
          }}
        >
          {streamingIsFallback || messages.some((m) => m.isFallback) ? (
            <>
              <Cpu size={12} />
              Offline Heuristic
            </>
          ) : (
            <>
              <Sparkles size={12} />
              Gemini AI
            </>
          )}
        </span>

        {messages.length > 0 && status !== "streaming" && (
          <button
            onClick={handleReset}
            title="Reset conversation"
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw size={15} />
          </button>
        )}
      </div>

      {/* Item summary banner */}
      {amount > 0 && (
        <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
          {item || "Item"} · {formatINR(amount)} · {hours.toFixed(1)} hrs of your life
        </p>
      )}

      {/* Initial Query Input (shown when no messages yet) */}
      {messages.length === 0 && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && status === "idle" && handleInitialAsk()
            }
            placeholder={t.verdict.contextPlaceholder}
            maxLength={200}
            disabled={status === "loading" || status === "streaming"}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all disabled:opacity-50"
            style={{
              background: "var(--color-surface-hover)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleInitialAsk}
            disabled={
              status === "loading" || status === "streaming" || amount <= 0
            }
            className="px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
            }}
          >
            {status === "loading" ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <Send size={14} />
            )}
            {status === "loading"
              ? t.verdict.asking
              : status === "streaming"
              ? "..."
              : t.verdict.askBtn}
          </motion.button>
        </div>
      )}

      {/* Conversation Thread */}
      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <div
                    className="max-w-[85%] px-3.5 py-2 rounded-2xl rounded-tr-sm text-xs md:text-sm text-white"
                    style={{
                      background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div
                    className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
                    style={{
                      background: "rgba(124,58,237,0.06)",
                      border: "1px solid rgba(124,58,237,0.15)",
                    }}
                  >
                    {msg.isFallback && (
                      <div className="text-[11px] font-semibold text-amber-400 mb-1.5 flex items-center gap-1">
                        <Cpu size={12} />
                        Rule-Based Heuristic Analysis (Offline Mode)
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {/* Cheaper alternative if attached */}
                  {msg.alternative && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                      style={{
                        background: "rgba(16,185,129,0.06)",
                        border: "1px solid rgba(16,185,129,0.18)",
                      }}
                    >
                      <span className="text-xl">💡</span>
                      <div className="flex-1">
                        <p
                          className="text-xs font-semibold"
                          style={{ color: "#10B981" }}
                        >
                          {t.verdict.cheaper}
                        </p>
                        <p className="text-sm font-semibold">
                          {msg.alternative.name}{" "}
                          <span
                            className="font-normal text-xs"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            ≈ {formatINR(msg.alternative.price)}
                          </span>
                        </p>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">
                        Saves ~
                        {formatINR(Math.max(amount - msg.alternative.price, 0))}
                      </span>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Loading Skeleton */}
      <AnimatePresence>
        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2 mb-3"
          >
            {[90, 75, 55].map((w, i) => (
              <div
                key={i}
                className="h-3 rounded-full animate-pulse"
                style={{
                  width: `${w}%`,
                  background: "var(--color-surface-hover)",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Streaming Message */}
      {status === "streaming" && streamingText && (
        <div
          className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed mb-4"
          style={{
            background: "rgba(124,58,237,0.06)",
            border: "1px solid rgba(124,58,237,0.15)",
          }}
        >
          {streamingIsFallback && (
            <div className="text-[11px] font-semibold text-amber-400 mb-1.5 flex items-center gap-1">
              <Cpu size={12} />
              {streamingFallbackReason || "Offline Heuristic Mode"}
            </div>
          )}
          <span>{streamingText}</span>
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block ml-1 w-0.5 h-4 bg-violet-400 align-middle"
          />
        </div>
      )}

      {/* Follow-up Question Input (after first verdict) */}
      {messages.length > 0 && status !== "streaming" && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
          <input
            type="text"
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && status !== "loading" && handleFollowUp()
            }
            placeholder={
              lang === "ta"
                ? "தொடர் கேள்வி கேட்கவும் (எ.கா. 'வேலைக்கு தேவையா?')..."
                : "Ask a follow-up (e.g. 'Can I justify this for work?')..."
            }
            maxLength={200}
            disabled={status === "loading"}
            className="flex-1 px-4 py-2 rounded-xl text-xs md:text-sm outline-none transition-all disabled:opacity-50"
            style={{
              background: "var(--color-surface-hover)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleFollowUp}
            disabled={status === "loading" || !followUpText.trim()}
            className="px-3.5 py-2 rounded-xl font-semibold text-xs md:text-sm text-white flex items-center gap-1 cursor-pointer disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
            }}
          >
            {status === "loading" ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <Send size={13} />
            )}
            <span>{lang === "ta" ? "அனுப்பு" : "Send"}</span>
          </motion.button>
        </div>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm mt-3 p-3 rounded-xl"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#F87171",
            }}
          >
            <AlertTriangle size={15} />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
