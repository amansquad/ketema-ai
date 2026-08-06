export type Locale = "en" | "am";

export const LOCALES: { code: Locale; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "EN" },
  { code: "am", label: "Amharic", nativeLabel: "አማ" },
];

interface Dictionary {
  landing: {
    tagline: string;
    headline: string;
    subtitle: string;
    tryLocally: string;
    signInAndSave: string;
  };
  auth: {
    signIn: string;
    signUp: string;
    createAccount: string;
    email: string;
    password: string;
    noAccount: string;
    haveAccount: string;
    pleaseWait: string;
  };
  dashboard: {
    yourCities: string;
    newCityName: string;
    newCity: string;
    signOut: string;
    noCities: string;
    updated: string;
  };
  toolbar: {
    move: string;
    rotate: string;
    scale: string;
    undo: string;
    redo: string;
    duplicate: string;
    delete: string;
    analytics: string;
  };
  assetPalette: {
    title: string;
    categories: {
      buildings: string;
      infrastructure: string;
      nature: string;
      energy: string;
      civic: string;
      utilities: string;
      ethiopia: string;
    };
  };
  properties: {
    object: string;
    transform: string;
    material: string;
    tags: string;
    metadata: string;
    name: string;
    position: string;
    rotation: string;
    scale: string;
    color: string;
    roughness: string;
    metalness: string;
    selectPrompt: string;
  };
  simulation: {
    title: string;
    clear: string;
    cloudy: string;
    rain: string;
    showHeatmap: string;
    population: string;
    jobs: string;
    energyNet: string;
    waterPerDay: string;
  };
  assistant: {
    title: string;
    askAi: string;
    placeholder: string;
  };
}

// Covers the primary chrome (landing, auth, dashboard, editor toolbar/panels).
// Deep long-tail copy (error strings, tooltips on rarely-seen states) stays
// English-only for now — extend the Dictionary interface and both locale
// entries below to add more coverage.
export const dictionary: Record<Locale, Dictionary> = {
  en: {
    landing: {
      tagline: "ከተማ · Ketema AI",
      headline: "Build a smart city, right in your browser.",
      subtitle:
        "A 3D digital twin editor for urban planning — place buildings, roads, and infrastructure, then simulate traffic, energy, and weather.",
      tryLocally: "Try it locally",
      signInAndSave: "Sign in & save cities",
    },
    auth: {
      signIn: "Sign in",
      signUp: "Sign up",
      createAccount: "Create an account",
      email: "Email",
      password: "Password",
      noAccount: "No account?",
      haveAccount: "Already have an account?",
      pleaseWait: "Please wait…",
    },
    dashboard: {
      yourCities: "Your cities",
      newCityName: "New city name",
      newCity: "New city",
      signOut: "Sign out",
      noCities: "No cities yet — create your first one above.",
      updated: "Updated",
    },
    toolbar: {
      move: "Move (1)",
      rotate: "Rotate (2)",
      scale: "Scale (3)",
      undo: "Undo (Ctrl+Z)",
      redo: "Redo (Ctrl+Shift+Z)",
      duplicate: "Duplicate (Ctrl+D)",
      delete: "Delete (Del)",
      analytics: "City analytics",
    },
    assetPalette: {
      title: "Asset library",
      categories: {
        buildings: "Buildings",
        infrastructure: "Roads & Infrastructure",
        nature: "Nature & Parks",
        energy: "Energy",
        civic: "Civic & Public Services",
        utilities: "Utilities",
        ethiopia: "Ethiopian Heritage",
      },
    },
    properties: {
      object: "Object",
      transform: "Transform",
      material: "Material",
      tags: "Tags",
      metadata: "Metadata",
      name: "Name",
      position: "Position",
      rotation: "Rotation °",
      scale: "Scale",
      color: "Color",
      roughness: "Roughness",
      metalness: "Metalness",
      selectPrompt: "Select an object to edit its properties.",
    },
    simulation: {
      title: "Simulation",
      clear: "Clear",
      cloudy: "Cloudy",
      rain: "Rain",
      showHeatmap: "Show pollution heatmap",
      population: "Population",
      jobs: "Jobs",
      energyNet: "Energy net",
      waterPerDay: "Water/day",
    },
    assistant: {
      title: "AI assistant",
      askAi: "Ask AI",
      placeholder: "Build a solar farm...",
    },
  },
  am: {
    landing: {
      tagline: "ከተማ · Ketema AI",
      headline: "ብልህ ከተማን በቀጥታ በአሳሽዎ ይገንቡ።",
      subtitle: "ለከተማ ፕላን ዝግጅት የ3ዲ ዲጂታል መንትያ አርታኢ — ሕንጻዎችን፣ መንገዶችን እና መሠረተ ልማቶችን ያስቀምጡ፣ ከዚያም ትራፊክን፣ ኃይልን እና የአየር ሁኔታን ያስመስሉ።",
      tryLocally: "በአካባቢው ይሞክሩ",
      signInAndSave: "ይግቡና ከተሞችን ያስቀምጡ",
    },
    auth: {
      signIn: "ግባ",
      signUp: "ተመዝገብ",
      createAccount: "መለያ ፍጠር",
      email: "ኢሜይል",
      password: "የይለፍ ቃል",
      noAccount: "መለያ የለዎትም?",
      haveAccount: "መለያ አለዎት?",
      pleaseWait: "እባክዎ ይጠብቁ…",
    },
    dashboard: {
      yourCities: "የእርስዎ ከተሞች",
      newCityName: "አዲስ የከተማ ስም",
      newCity: "አዲስ ከተማ",
      signOut: "ውጣ",
      noCities: "እስካሁን ምንም ከተማ የለም — የመጀመሪያዎን ከላይ ይፍጠሩ።",
      updated: "የተዘመነ",
    },
    toolbar: {
      move: "አንቀሳቅስ (1)",
      rotate: "አሽከርክር (2)",
      scale: "መጠን ቀይር (3)",
      undo: "መልስ (Ctrl+Z)",
      redo: "ድገም (Ctrl+Shift+Z)",
      duplicate: "አባዛ (Ctrl+D)",
      delete: "ሰርዝ (Del)",
      analytics: "የከተማ ትንተና",
    },
    assetPalette: {
      title: "የንብረት ቤተ-መጻሕፍት",
      categories: {
        buildings: "ሕንጻዎች",
        infrastructure: "መንገዶች እና መሠረተ ልማት",
        nature: "ተፈጥሮ እና መናፈሻዎች",
        energy: "ኃይል",
        civic: "የሕዝብ አገልግሎቶች",
        utilities: "መገልገያዎች",
        ethiopia: "የኢትዮጵያ ቅርስ",
      },
    },
    properties: {
      object: "ንብረት",
      transform: "አቀማመጥ",
      material: "ቁሳቁስ",
      tags: "መለያዎች",
      metadata: "ተጨማሪ መረጃ",
      name: "ስም",
      position: "አቀማመጥ",
      rotation: "ማሽከርከሪያ °",
      scale: "መጠን",
      color: "ቀለም",
      roughness: "ሻካራነት",
      metalness: "ብረታዊነት",
      selectPrompt: "ንብረቶቹን ለማርትዕ አንድ ነገር ይምረጡ።",
    },
    simulation: {
      title: "ማስመሰያ",
      clear: "ግልጽ",
      cloudy: "ደመናማ",
      rain: "ዝናብ",
      showHeatmap: "የብክለት ካርታ አሳይ",
      population: "ሕዝብ ብዛት",
      jobs: "የስራ ቦታዎች",
      energyNet: "ተጣራ ኃይል",
      waterPerDay: "ውሃ/ቀን",
    },
    assistant: {
      title: "የAI ረዳት",
      askAi: "AI ጠይቅ",
      placeholder: "የፀሐይ ኃይል ማመንጫ ገንባ...",
    },
  },
};
