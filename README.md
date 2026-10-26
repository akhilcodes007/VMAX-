# ⏳ TimeWorth — Price → Life-Hours → Future Freedom

> **"Money feels abstract, but time doesn't."**
> TimeWorth converts any price into the real hours of your life it cost to earn, then shows what that same money could become if invested instead — converted back into hours and days of future freedom. It reframes spending without lecturing.

---

## ✨ Features

### 1. ⏱️ Price → Life-Hours Conversion
- **Zero-Abstraction Time Math:** Enter any price (e.g. ₹4,999 sneakers, ₹1,20,000 phone) and instantly see the hours and minutes of labor required.
- **Human-Scale Breakdown:** Translates raw hours into tangible units — work shifts, full work days, work weeks, and months.
- **Animated Count-Up:** Smooth ease-out cubic animation as numbers update.
- **Contextual Presets:** Quick-tap chips for common Indian spends (₹450 Zomato, ₹4,999 sneakers, ₹1,20,000 iPhone).

### 2. 📈 Freedom Growth Slider & Opportunity Cost
- **Future Freedom Projection:** Compares spending now vs. investing in Indian equity mutual funds (defaulting to 12% historical annualized returns).
- **Interactive Dual Sliders:**
  - Time horizon: 1 to 30 years (default: 10 years).
  - Annual return rate: 5% to 20% (default: 12%).
- **Freedom Hours:** Shows future value not just in ₹ Lakhs, but in **hours and days of retirement / financial freedom**.
- **Interactive AreaChart (Recharts):** Beautiful gradient chart comparing flat spent money vs. exponential compounding curve with custom tooltips.

### 3. 🤖 Gemini AI Verdict & Alternatives
- **Honest & Witty Verdicts:** Streaming SSE response via `/api/ai` powered by Google Gemini (`gemini-2.5-flash`).
- **Constructive, Not Preachy:** Witty, empathetic perspective on whether a purchase is worth your life-hours.
- **Cheaper Alternative Recommendation:** Suggests smart, practical alternatives that save 50–80% of your life-hours.
- **Interactive Follow-Up Chat:** Ask questions directly to the AI about the tradeoff.
- **Resilient Fallback:** Works gracefully with smart heuristic verdicts if no API key is provided or if network fails.

### 4. 🧠 Natural Language Smart Input
- **Colloquial Parser:** Understands inputs like:
  - *"swiggy 400 twice a week"*
  - *"gym 2000 per month"*
  - *"netflix 649 monthly"*
  - *"coffee 180 everyday"*
- **Recurring Opportunity Cost:** Automatically computes annualized spend and 5/10/20-year compounded wealth foregone.
- **Inline Editable Chips:** Tweak amount, frequency, or period multiplier with live recalculation.

### 5. 🛒 Cart & Multi-Item Freedom Drawer
- **Combined Life-Hours:** Add multiple items (or recurring subscriptions) to your cart.
- **Total Sacrifice vs. Freedom:** Shows the cumulative hours of your life required for the entire basket.
- **Undo Support:** Accidental removals can be restored with a single tap.

### 6. 📱 1:1 Share Card Generator
- **Social Media Ready:** Generates high-resolution 1:1 aspect ratio PNG cards via `html-to-image` for Instagram Stories, WhatsApp, or Twitter/X.
- **Privacy-First Design:** **Never** displays your actual income, salary, or hourly rate on the card. Only shows item, price, life-hours, and future freedom.
- **Web Share API with Fallback:** Native mobile share sheet with automatic download fallback for desktop.

### 7. 🇮🇳 Tailored for India & Bilingual (English / தமிழ்)
- **Indian Numbering System:** Formats large numbers using standard Indian notation (₹ Thousand, ₹ Lakh, ₹ Crore).
- **Tamil Localization (தமிழ்):** Seamless instant language toggle between English and Tamil with culturally natural translations.
- **Sensible Defaults:** Baseline income configured to ₹50,000/month (22 work days, 8 hrs/day = ₹284/hr) with easy one-tap income setup.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS v4, Vanilla CSS Design System, Glassmorphism
- **Animations:** Framer Motion (page transitions, count-ups, drawer slides)
- **Charts:** Recharts (responsive gradient AreaChart)
- **Icons:** Lucide React
- **Image Generation:** `html-to-image`
- **State Management:** Zustand with `localStorage` persistence
- **Serverless / AI API:** Vite dev server middleware & serverless handler calling `@google/genai` with streaming SSE
- **Testing:** Vitest (31 unit tests covering all financial math, boundary conditions, and edge cases)

---

## 🧮 Financial Math Specification

$$\text{Hourly Rate } (R) = \frac{\text{Monthly Take-Home}}{\text{Work Days/Month} \times \text{Hours/Day}}$$

$$\text{Life-Hours } (H) = \frac{\text{Price}}{R}$$

$$\text{Lump-Sum Future Value } (FV) = P \times (1 + r)^t$$

$$\text{Recurring Annuity Future Value } (FV) = C \times \frac{(1 + r/n)^{nt} - 1}{r/n}$$

- $P$: Lump-sum price (₹)
- $C$: Recurring periodic payment (₹)
- $r$: Annual nominal interest rate (e.g., 0.12 for 12%)
- $n$: Compounding compounding intervals per year (daily, weekly, monthly, yearly)
- $t$: Horizon in years

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### 1. Clone & Install
```bash
git clone <repo-url>
cd timeworth
npm install
```

### 2. Configure Environment (Optional for AI)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Gemini API key from [Google AI Studio](https://aistudio.google.com/):
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```
*(Note: If no API key is provided, TimeWorth operates in offline heuristic mode so you can test all features immediately.)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Run Test Suite
```bash
npm test
```
All 61 unit tests will run and validate hourly rate, lump-sum compound interest, recurring annuities, year-by-year chart series, custom price stepper controls, boundary cases, and the Gemini AI / offline heuristic endpoint contracts.

### 5. Build for Production
```bash
npm run build
```
Creates an optimized, production bundle in `/dist`.

---

## 📁 Project Structure

```
├── api/
│   └── ai.ts               # Gemini AI streaming endpoint & Vite server middleware
├── public/
│   └── favicon.svg         # App favicon
├── src/
│   ├── components/
│   │   ├── CartDrawer.tsx   # Multi-item cart drawer with undo & totals
│   │   ├── FreedomSlider.tsx# Year/rate sliders & Recharts compounding chart
│   │   ├── Hero.tsx         # Main price input, life-hours display & presets
│   │   ├── IncomeSetup.tsx  # Income profile modal & take-home calculations
│   │   ├── LangToggle.tsx   # English / Tamil language toggle switch
│   │   ├── ShareCard.tsx    # 1:1 image generator with Web Share API
│   │   ├── SmartInput.tsx   # Natural language recurring expense parser
│   │   └── VerdictCard.tsx  # Gemini AI verdict, alternatives & chat
│   ├── lib/
│   │   ├── format.ts        # Currency (₹ Lakhs/Crores), time, and human-scale formatters
│   │   ├── i18n.ts          # English & Tamil translations dictionary
│   │   ├── math.ts          # Pure financial formulas & breakdown helpers
│   │   └── parse-schema.ts  # Zod schema for structured AI parsing
│   ├── prompts/
│   │   └── prompts.ts       # Structured system prompts for Gemini
│   ├── store/
│   │   └── useStore.ts      # Zustand persistent state (income, cart, theme, language)
│   ├── App.tsx              # Root application layout & orchestration
│   ├── index.css            # Tailwind v4 theme & modern typography
│   └── main.tsx             # React DOM entry point
├── tests/
│   └── math.test.ts         # Vitest test suite (31 tests)
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔒 Privacy & Security

- **Client-Side Profile Storage:** All income numbers, hourly rates, and cart contents remain strictly in your browser's `localStorage`.
- **Zero Salary Leakage in Shares:** Shareable PNG cards only state the item name and life-hours required; your monthly salary or hourly wage is never embedded.
- **Secure Serverless AI Proxy:** Gemini API keys are only evaluated server-side and never exposed to the client bundle.

---

## 📜 License
MIT License. Built for life-first financial awareness.
