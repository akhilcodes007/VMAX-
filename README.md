# ⏳ TimeWorth — Price → Life-Hours → Future Freedom

> **"Money feels abstract, but time doesn't."**

TimeWorth converts any price into the real hours of your life it costs to earn, then shows what that same money could become if invested instead — converted back into hours and days of potential future freedom.

It reframes spending without lecturing.

**Hackathon Theme:** MoneyMatters — Make Money Make Sense

## 👥 Team Members

- **Akhil**
- **Gokul**

---

## 📌 Project Description

Money is easy to spend when we see only its price. But every purchase also represents time spent working to earn that money.

TimeWorth is an AI-powered financial awareness platform that helps users understand the true cost of purchases by translating money into working hours and visualizing potential future financial outcomes.

Instead of simply asking, "Can I afford this?", TimeWorth encourages users to ask:

- How many hours of my life does this purchase cost?
- What could this money become if I invested it instead?
- How do my everyday spending habits affect my long-term financial goals?

By combining deterministic financial calculations, interactive charts, natural-language expense input, and AI-powered guidance, TimeWorth makes money management more visual, personal, and accessible.

## ✨ Features

### 1. ⏱️ Price → Life-Hours Conversion

- **Zero-Abstraction Time Math:** Enter any price, such as ₹4,999 sneakers or a ₹1,20,000 phone, and instantly see the estimated working hours required.
- **Human-Scale Breakdown:** Converts raw hours into work shifts, working days, weeks, and months.
- **Animated Count-Up:** Uses smooth number transitions to make changes feel intuitive.
- **Contextual Presets:** Quick-select common purchases such as sneakers, phones, and food delivery.

### 2. 📈 Freedom Growth Slider & Opportunity Cost

- **Future Freedom Projection:** Explore how money could grow under configurable investment-return assumptions.
- **Interactive Sliders:** Adjust the investment horizon from 1 to 30 years and the assumed annual return rate.
- **Freedom Hours:** Understand projected future value in rupees as well as equivalent working hours.
- **Interactive Area Chart:** Visualize the difference between spending money today and its hypothetical compounded future value.

**Important:** Investment projections are illustrations, not guarantees of future returns.

### 3. 🤖 Gemini AI Verdict & Alternatives

- **Personalized Verdicts:** Get friendly, witty, and non-judgmental perspectives on purchase decisions.
- **Cheaper Alternatives:** Receive suggestions for practical lower-cost alternatives when appropriate.
- **Interactive Follow-Up Chat:** Ask additional questions about the trade-offs of a purchase.
- **Streaming Responses:** The application can display AI-generated responses progressively when streaming is supported by the configured endpoint.
- **Offline Fallback:** Basic financial guidance remains available through heuristic logic when AI is unavailable.

### 4. 🧠 Natural-Language Smart Input

Describe recurring expenses in everyday language, for example:

- `Swiggy 400 twice a week`
- `Gym 2000 per month`
- `Netflix 649 monthly`
- `Coffee 180 every day`

The smart input feature helps interpret expense amounts and frequencies, allowing recurring costs and potential long-term opportunity costs to be explored.

Editable values allow users to correct parsed details before relying on the results.

### 5. 🛒 Cart & Multi-Item Freedom Drawer

- Add multiple purchases to a combined cart.
- See the total monetary cost and estimated working hours for all items.
- Compare combined spending with hypothetical future investment value.
- Remove items and restore accidental removals where undo functionality is implemented.

### 6. 📱 Share Card Generator

- Generate visual summaries of purchase costs for social sharing.
- Support image downloads and mobile sharing where supported.
- Keep salary and hourly-rate information out of share cards to protect user privacy.

### 7. 🇮🇳 Tailored for India & Bilingual

- **Indian Currency Formatting:** Uses the Indian rupee symbol and Indian number grouping.
- **Tamil Localization:** Supports switching between English and Tamil.
- **Income Setup:** Lets users configure income and working-hour assumptions for personalized calculations.

### 8. 🎨 Premium Responsive UI

- Dark, modern fintech-inspired interface.
- Deep navy surfaces with restrained violet accents.
- Responsive layouts for desktop and mobile.
- Interactive inputs and visualizations.
- Refined controls designed to make financial exploration intuitive.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | User interface |
| Vite | Development server and frontend build |
| TypeScript | Typed application logic |
| CSS / Tailwind CSS, where configured | Styling and responsive design |
| Framer Motion, where configured | Animations and transitions |
| Recharts | Financial projection charts |
| Lucide React | Interface icons |
| html-to-image | Share-card image generation |
| Zustand, where configured | State management and persistence |
| Vitest | Automated testing |
| Google Gemini API | AI-generated financial guidance |
| Git and GitHub | Version control and collaboration |

---

## 🤖 AI Tools Used

### Antigravity
Used as the AI-powered development environment to assist with application implementation, component development, debugging, and UI improvements.

### ChatGPT
Used for project ideation, feature planning, prompt engineering, implementation guidance, documentation, and troubleshooting.

### Google Gemini
Integrated as the AI provider for purchase verdicts and personalized financial insights.

AI assistance was used throughout development, while financial calculations are handled by application logic rather than relying on the language model to perform arithmetic.

---

## 🧠 Important Prompts Used

### Prompt 1 — Master Project Build

> Build a production-quality, mobile-first financial awareness application called TimeWorth. Convert purchase prices into working hours and visualize the potential future value of money. Include a responsive interface, financial calculations, interactive growth charts, natural-language expense input, an AI verdict, a multi-item cart, shareable cards, and English/Tamil localization. Prioritize a functional, testable implementation and document the architecture, formulas, environment configuration, and limitations.

### Prompt 2 — Gemini Financial Verdict

> Act as a friendly, non-judgmental financial decision coach. Use the financial information and calculated results provided by the application to explain a purchase's impact. Offer a practical alternative and one actionable suggestion. Keep responses concise, empathetic, and realistic. Never invent missing information or guarantee investment returns. Respond in the user's selected language.

### Prompt 3 — Premium UI/UX

> Improve the existing TimeWorth interface using a premium dark fintech aesthetic with a deep navy background, subtle violet accents, modern typography, responsive layouts, interactive financial visualizations, accessible controls, and smooth micro-interactions. Preserve existing functionality and avoid unnecessary dependencies.

### Prompt 4 — Secure Gemini API Integration

> Integrate the Google Gemini API into the existing application using the official SDK and a secure server-side implementation. Store credentials in environment variables, prevent secrets from appearing in client-side code or GitHub, preserve existing response formats and offline fallback behavior, handle API errors gracefully, and verify the integration with tests and a production build.

### Prompt 5 — Debugging and Verification

> Inspect the existing codebase before making changes. Identify the root cause of the issue, implement the smallest appropriate fix, preserve working features, add or update tests where appropriate, and run the test suite and production build. Do not remove tests or replace real functionality with hardcoded mock responses to make verification appear successful.

---

## 💻 AI-Generated Code That Was Modified

AI-assisted development contributed to the implementation and refinement of the existing application.

The following modifications were made during development:

1. **API Integration:** Added Gemini API configuration using environment variables and integrated the credentials with the application's AI implementation.
2. **Environment Configuration:** Added a local `.env` file for API credentials and maintained an `.env.example` template for documenting required variables.
3. **Git Security:** Updated `.gitignore` to exclude environment files containing secrets and reduce the risk of accidentally exposing credentials in the public repository.
4. **UI Refinements:** Modified interface components and styling to improve consistency with TimeWorth's dark fintech design.
5. **Code Adaptation:** Reviewed and adapted AI-generated suggestions to fit the existing project structure and application behavior.

The team is responsible for reviewing, understanding, and validating the final code.

**Security note:** Never place the actual Gemini API key in this README, source code, screenshots, or public commits.

---

## 🐛 Bug Solved: Price Input UI Improvement

### Problem

The purchase price field displayed the browser's default up/down number-spinner arrows. These controls looked inconsistent with the application's premium dark theme and made the input feel less polished.

### Solution

The price input was identified for UI improvement so it could use a more consistent custom control design aligned with TimeWorth's existing styling.

The intended improvement replaces the default spinner appearance with compact increment and decrement controls, while preserving manual numeric entry and integration with financial calculations.

### Verification Checklist

- [ ] Increment and decrement controls work correctly.
- [ ] Manual price entry works.
- [ ] The minimum value is enforced.
- [ ] Preset chips update the price correctly.
- [ ] Financial calculations update after changes.
- [ ] The control works on desktop and mobile.

*Mark these items as completed only after testing the final implementation.*

---

## 🧮 Financial Math Specification

TimeWorth uses deterministic calculations to convert money into working time and estimate hypothetical future value.

### 1. Hourly Rate

\[
R = \frac{M}{D \times H}
\]

Where:

- \(R\) = hourly earning rate
- \(M\) = monthly take-home income
- \(D\) = working days per month
- \(H\) = working hours per day

### 2. Life-Hours

\[
T = \frac{P}{R}
\]

Where:

- \(T\) = estimated working hours
- \(P\) = purchase price
- \(R\) = hourly earning rate

### 3. Lump-Sum Future Value

\[
FV = P(1+r)^t
\]

Where:

- \(P\) = initial amount
- \(r\) = assumed annual return as a decimal
- \(t\) = investment horizon in years

### 4. Recurring Investment Future Value

For regular contributions made at the end of each period:

\[
FV = C\frac{(1+i)^N-1}{i}
\]

Where:

- \(C\) = contribution per period
- \(i\) = assumed return per period
- \(N\) = total number of contributions

The zero-interest case must be handled separately:

\[
FV = C \times N
\]

All displayed results should be calculated by application code. Values should be validated and rounded for presentation rather than prematurely during calculations.

### Financial Disclaimer

TimeWorth is an educational awareness tool, not professional financial advice. Investment returns are uncertain, and hypothetical projections do not guarantee actual outcomes.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or a compatible version required by the installed dependencies
- npm
- A Gemini API key for live AI functionality

### 1. Clone the Repository

```bash
git clone https://github.com/akhilcodes007/VMAX-.git
cd "VMAX-"
npm install
```

### 2. Configure Environment Variables

Copy the example environment file if it exists:

```bash
cp .env.example .env
```

Configure the variables supported by the application's backend:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Replace the placeholder with your own key in the local `.env` file.

Obtain an API key from [Google AI Studio](https://aistudio.google.com/apikey).

**Never commit `.env` to GitHub.** Only commit `.env.example` with placeholder values.

If the AI service is unavailable, manual entry and local financial calculations should remain usable.

### 3. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

If the backend requires a separate development process, start it using the appropriate script configured in `package.json`.

### 4. Run Tests

```bash
npm test
```

### 5. Build for Production

```bash
npm run build
```

The production build is normally generated in the `dist` directory.

---

## 📁 Project Structure

The following is a representative structure of the TimeWorth project. Individual files may differ depending on the final implementation.

```text
VMAX-/
├── api/
│   └── ai.ts
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── CartDrawer.tsx
│   │   ├── FreedomSlider.tsx
│   │   ├── Hero.tsx
│   │   ├── IncomeSetup.tsx
│   │   ├── LangToggle.tsx
│   │   ├── ShareCard.tsx
│   │   ├── SmartInput.tsx
│   │   └── VerdictCard.tsx
│   ├── lib/
│   │   ├── format.ts
│   │   ├── i18n.ts
│   │   └── math.ts
│   ├── prompts/
│   ├── store/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── tests/
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🔒 Privacy & Security

- **API Key Protection:** Gemini credentials must remain server-side and must never be embedded in frontend bundles.
- **Environment File Exclusion:** `.gitignore` should exclude `.env` and other files containing secrets.
- **Private Financial Inputs:** Avoid sending unnecessary personal financial information to external AI services.
- **Share Card Privacy:** Do not include salary or hourly earning rate in generated share cards.
- **Graceful Degradation:** The core calculator should remain useful if the AI service is unavailable.

---

## 📜 License

MIT License, if the project is released under the MIT license. Add a corresponding `LICENSE` file before claiming the repository is officially licensed under MIT.

---

## 🌟 Our Vision

We believe financial awareness begins when people understand not only how much something costs, but also what that money represents in their lives.

**TimeWorth — Your Money. Your Time. Your Future.**
