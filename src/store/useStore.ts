/**
 * useStore.ts — Zustand global state store with localStorage persistence.
 */
import { create } from "zustand";
import { DEFAULT_PROFILE, type IncomeProfile } from "../lib/math";
import type { ParsedItem } from "../lib/parse-schema";
import type { Lang } from "../lib/i18n";
import {
  saveIncome,
  loadIncome,
  saveCart,
  loadCart,
  saveLang,
  loadLang,
  saveTheme,
  loadTheme,
  isOnboarded,
} from "../lib/storage";

export interface CartItem {
  id: string;
  name: string;
  amount: number;
  lifeHours: number;
  frequency: ParsedItem["frequency"];
  timesPerPeriod: number;
  category: ParsedItem["category"];
  timestamp: number;
}

interface AppState {
  // Onboarding
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;

  // Income profile
  income: IncomeProfile;
  setIncome: (profile: IncomeProfile) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "id" | "timestamp">) => void;
  removeFromCart: (id: string) => void;
  undoLastRemoved: () => void;
  clearCart: () => void;
  lastRemoved: CartItem | null;

  // Slider state
  sliderYears: number;
  sliderRate: number;
  setSliderYears: (y: number) => void;
  setSliderRate: (r: number) => void;

  // Current item being converted
  currentPrice: number;
  currentItem: string;
  setCurrentPrice: (p: number) => void;
  setCurrentItem: (name: string) => void;

  // Lang & Theme
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;

  // Cart drawer open
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;

  // Share modal
  shareOpen: boolean;
  setShareOpen: (v: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  onboarded: isOnboarded(),
  setOnboarded: (v) => set({ onboarded: v }),

  income: loadIncome() ?? DEFAULT_PROFILE,
  setIncome: (profile) => {
    saveIncome(profile);
    set({ income: profile, onboarded: true });
  },

  cart: loadCart(),
  lastRemoved: null,
  addToCart: (item) => {
    const newItem: CartItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    const cart = [...get().cart, newItem];
    saveCart(cart);
    set({ cart });
  },
  removeFromCart: (id) => {
    const existing = get().cart.find((c) => c.id === id) ?? null;
    const cart = get().cart.filter((c) => c.id !== id);
    saveCart(cart);
    set({ cart, lastRemoved: existing });
  },
  undoLastRemoved: () => {
    const { lastRemoved, cart } = get();
    if (!lastRemoved) return;
    const newCart = [...cart, lastRemoved].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    saveCart(newCart);
    set({ cart: newCart, lastRemoved: null });
  },
  clearCart: () => {
    saveCart([]);
    set({ cart: [] });
  },

  sliderYears: 10,
  sliderRate: 12,
  setSliderYears: (y) => set({ sliderYears: y }),
  setSliderRate: (r) => set({ sliderRate: r }),

  currentPrice: 0,
  currentItem: "",
  setCurrentPrice: (p) => set({ currentPrice: p }),
  setCurrentItem: (name) => set({ currentItem: name }),

  lang: loadLang(),
  setLang: (l) => {
    saveLang(l);
    set({ lang: l });
  },

  theme: loadTheme(),
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    saveTheme(next);
    set({ theme: next });
  },

  cartOpen: false,
  setCartOpen: (v) => set({ cartOpen: v }),

  shareOpen: false,
  setShareOpen: (v) => set({ shareOpen: v }),
}));
