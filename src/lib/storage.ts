/**
 * storage.ts — LocalStorage persistence helpers.
 */
import type { IncomeProfile } from "./math";
import type { CartItem } from "../store/useStore";
import type { Lang } from "./i18n";

const KEYS = {
  income: "tw_income",
  cart: "tw_cart",
  lang: "tw_lang",
  theme: "tw_theme",
  onboarded: "tw_onboarded",
} as const;

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveIncome(profile: IncomeProfile): void {
  localStorage.setItem(KEYS.income, JSON.stringify(profile));
  localStorage.setItem(KEYS.onboarded, "true");
}

export function loadIncome(): IncomeProfile | null {
  return safeParse<IncomeProfile | null>(KEYS.income, null);
}

export function isOnboarded(): boolean {
  return localStorage.getItem(KEYS.onboarded) === "true";
}

export function saveCart(items: CartItem[]): void {
  localStorage.setItem(KEYS.cart, JSON.stringify(items));
}

export function loadCart(): CartItem[] {
  return safeParse<CartItem[]>(KEYS.cart, []);
}

export function saveLang(lang: Lang): void {
  localStorage.setItem(KEYS.lang, lang);
}

export function loadLang(): Lang {
  const v = localStorage.getItem(KEYS.lang);
  return v === "ta" ? "ta" : "en";
}

export function saveTheme(theme: "dark" | "light"): void {
  localStorage.setItem(KEYS.theme, theme);
}

export function loadTheme(): "dark" | "light" {
  const v = localStorage.getItem(KEYS.theme);
  return v === "light" ? "light" : "dark";
}
