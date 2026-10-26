/**
 * i18n.ts — Internationalization dictionary for EN and Tamil.
 */

export type Lang = "en" | "ta";

export const i18n = {
  en: {
    appName: "TimeWorth",
    tagline: "Every price tag has a life cost.",
    incomeSetup: {
      title: "What's your monthly take-home pay?",
      subtitle: "We use this to calculate how many hours of your life each purchase costs. Saved only on your device.",
      placeholder: "e.g. 50,000",
      prefix: "₹",
      advancedToggle: "Advanced",
      workDays: "Work days / month",
      hoursPerDay: "Hours / day",
      saveBtn: "Let's Go →",
      preview: (rate: string) => `Your time is worth ${rate}/hour`,
    },
    hero: {
      title: "What are you about to buy?",
      itemPlaceholder: "e.g. sneakers, phone, Zomato...",
      amountPlaceholder: "₹ Amount",
      lifeHoursLabel: "hours of your life",
      equivalentLabel: (desc: string) => `≈ ${desc}`,
      examples: ["₹4,999 sneakers", "Zomato ₹450 × 4/week", "₹1,20,000 phone"],
    },
    slider: {
      title: "What if you invested it instead?",
      yearsLabel: "Years",
      returnLabel: "Expected return",
      costsToday: "Costs you today",
      costsFuture: "Opportunity cost",
      invested: (amt: string, years: number) =>
        `Invested, this becomes ${amt} in ${years} year${years !== 1 ? "s" : ""}`,
      freedomHours: (h: string) => `= ${h} of future freedom`,
      disclaimer:
        "12% is an assumption, not a guarantee. Past returns don't predict the future. Change the rate to see other scenarios. Educational tool, not financial advice.",
    },
    smartInput: {
      title: "Describe it naturally",
      placeholder: "e.g. 'Zomato ₹450 four times a week' or 'daily chai 20 rupees'",
      parseBtn: "Parse",
      parsing: "Parsing...",
      aiResting: "AI is resting — enter details manually.",
      confirm: "Looks right?",
      addBtn: "Add to List",
      editBtn: "Edit",
    },
    verdict: {
      title: "Is it worth it?",
      contextPlaceholder: "Any context? e.g. 'for work', 'impulse buy'",
      askBtn: "Ask AI",
      asking: "Thinking...",
      badge: "AI take",
      cheaper: "Budget alternative",
    },
    cart: {
      title: "My List",
      empty: "Nothing here yet. Add something!",
      totalHours: (h: string) => `Total: ${h} of your life`,
      totalAmount: "Total spend",
      invested: (y: number) => `Invested over ${y} years becomes`,
      removeUndo: "Undo",
    },
    share: {
      title: "Share",
      downloading: "Generating...",
      shareBtn: "Share",
      downloadBtn: "Download",
    },
    editIncome: "Edit income",
    langToggle: "தமிழ்",
    addToCart: "Add to List",
    shareCard: "Share",
  },
  ta: {
    appName: "TimeWorth",
    tagline: "ஒவ்வொரு விலைப் பட்டியலுக்கும் ஒரு வாழ்க்கை செலவு உள்ளது.",
    incomeSetup: {
      title: "உங்கள் மாதாந்திர வருமானம் என்ன?",
      subtitle: "ஒவ்வொரு கொள்முதலும் உங்கள் எத்தனை மணி நேரம் செலவாகிறது என்பதை கணக்கிட இதைப் பயன்படுத்துகிறோம். உங்கள் சாதனத்தில் மட்டுமே சேமிக்கப்படுகிறது.",
      placeholder: "எ.கா. 50,000",
      prefix: "₹",
      advancedToggle: "மேம்பட்ட",
      workDays: "மாதத்திற்கு வேலை நாட்கள்",
      hoursPerDay: "நாளுக்கு மணி நேரங்கள்",
      saveBtn: "தொடர்வோம் →",
      preview: (rate: string) => `உங்கள் நேரம் ${rate}/மணி நேரம் மதிப்புடையது`,
    },
    hero: {
      title: "நீங்கள் என்ன வாங்க உள்ளீர்கள்?",
      itemPlaceholder: "எ.கா. ஷூ, போன், ஜோமாட்டோ...",
      amountPlaceholder: "₹ தொகை",
      lifeHoursLabel: "உங்கள் வாழ்க்கையின் மணி நேரங்கள்",
      equivalentLabel: (desc: string) => `≈ ${desc}`,
      examples: ["₹4,999 ஷூ", "ஜோமாட்டோ ₹450 × 4/வாரம்", "₹1,20,000 போன்"],
    },
    slider: {
      title: "அதற்கு பதில் முதலீடு செய்தால்?",
      yearsLabel: "ஆண்டுகள்",
      returnLabel: "எதிர்பார்க்கப்படும் வருவாய்",
      costsToday: "இன்று செலவு",
      costsFuture: "வாய்ப்பு செலவு",
      invested: (amt: string, years: number) =>
        `முதலீடு செய்தால், இது ${years} ஆண்டுகளில் ${amt} ஆகும்`,
      freedomHours: (h: string) => `= ${h} எதிர்கால சுதந்திரம்`,
      disclaimer:
        "12% ஒரு அனுமானம், உத்தரவாதம் அல்ல. கடந்தகால வருவாய்கள் எதிர்காலத்தை கணிக்காது. இது கல்வி கருவி, நிதி ஆலோசனை அல்ல.",
    },
    smartInput: {
      title: "இயல்பாக விவரிக்கவும்",
      placeholder: "எ.கா. 'ஜோமாட்டோ ₹450 வாரத்தில் நான்கு முறை'",
      parseBtn: "பகுப்பாய்வு",
      parsing: "பகுப்பாய்வு செய்கிறது...",
      aiResting: "AI இயங்கவில்லை — கைமுறையாக உள்ளிடவும்.",
      confirm: "சரியாக உள்ளதா?",
      addBtn: "பட்டியலில் சேர்",
      editBtn: "திருத்து",
    },
    verdict: {
      title: "மதிப்புள்ளதா?",
      contextPlaceholder: "சூழல் ஏதாவது? எ.கா. 'வேலைக்காக', 'உடனடி கொள்முதல்'",
      askBtn: "AI ஐ கேளு",
      asking: "யோசிக்கிறது...",
      badge: "AI கருத்து",
      cheaper: "மலிவான மாற்று",
    },
    cart: {
      title: "என் பட்டியல்",
      empty: "இன்னும் எதுவும் இல்லை. ஏதாவது சேர்க்கவும்!",
      totalHours: (h: string) => `மொத்தம்: உங்கள் வாழ்க்கையின் ${h}`,
      totalAmount: "மொத்த செலவு",
      invested: (y: number) => `${y} ஆண்டுகளில் முதலீடு செய்தால்`,
      removeUndo: "மீட்டமை",
    },
    share: {
      title: "பகிர்",
      downloading: "உருவாக்குகிறது...",
      shareBtn: "பகிர்",
      downloadBtn: "பதிவிறக்கு",
    },
    editIncome: "வருமானம் திருத்து",
    langToggle: "EN",
    addToCart: "பட்டியலில் சேர்",
    shareCard: "பகிர்",
  },
} as const;

export type I18nDict = (typeof i18n)["en"];
