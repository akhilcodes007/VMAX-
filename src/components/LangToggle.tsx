import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { useStore } from "../store/useStore";
import { i18n } from "../lib/i18n";

export function LangToggle() {
  const { lang, setLang } = useStore();
  const t = i18n[lang];

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => setLang(lang === "en" ? "ta" : "en")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-sm font-medium cursor-pointer"
      style={{
        color: "var(--color-text-muted)",
        border: "1px solid var(--color-border)",
      }}
      aria-label={`Switch to ${lang === "en" ? "Tamil" : "English"}`}
    >
      <Globe size={14} />
      <span className={lang === "ta" ? "lang-ta" : ""}>{t.langToggle}</span>
    </motion.button>
  );
}
