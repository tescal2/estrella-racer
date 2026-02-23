export const STORAGE_LANGUAGE_KEY = "estrella-racer-language";

const S = {
  en: {
    title: "ESTRELLA RACER",
    play: "▶  PLAY",
    chooseDriver: "Choose Your Racer",
    chooseDiff: "Choose Difficulty",
    chooseMode: "Choose Mode",
    next: "NEXT ➤",
    back: "← Back",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    race: "🏁 Race",
    loco: "💥 Loco",
    pause: "⏸",
    resume: "▶",
    score: "⭐",
    retry: "🔄 RETRY",
    menu: "🏠 Menu",
    resultWin: "FINISH!",
    resultCrash: "WRECKED!",
    resultFuel: "OUT OF GAS!",
    resultLoco: "LOCO OVER!",
    resultMsgWin: "Amazing run!",
    resultMsgCrash: "Better luck next time!",
    resultMsgFuel: "Find more fuel next time!",
    resultMsgLoco: "Total chaos!",
    finalScore: "Score: {score}",
    flashStarChain: "⭐ STAR CHAIN!",
    flashFuel: "⛽ FUEL UP!",
    flashNearMiss: "😎 NEAR MISS!",
    flashSmash: "💥 SMASH!",
    flashRamp: "🚀 BOOST!",
    flashLowFuel: "⛽ LOW FUEL!",
    flashDamage: "💔 OUCH!",
    langBtn: "ES",
    tiltOn: "📱",
    tiltOff: "📱",
    musicOn: "🎵",
    musicOff: "🔇",
    progress: "{pct}%"
  },
  es: {
    title: "ESTRELLA RACER",
    play: "▶  JUGAR",
    chooseDriver: "Elige Tu Piloto",
    chooseDiff: "Elige Dificultad",
    chooseMode: "Elige Modo",
    next: "SIGUIENTE ➤",
    back: "← Atrás",
    easy: "Fácil",
    medium: "Medio",
    hard: "Difícil",
    race: "🏁 Carrera",
    loco: "💥 Loco",
    pause: "⏸",
    resume: "▶",
    score: "⭐",
    retry: "🔄 REINTENTAR",
    menu: "🏠 Menú",
    resultWin: "¡META!",
    resultCrash: "¡CHOQUE!",
    resultFuel: "¡SIN GASOLINA!",
    resultLoco: "¡LOCO TERMINÓ!",
    resultMsgWin: "¡Increíble carrera!",
    resultMsgCrash: "¡Suerte la próxima!",
    resultMsgFuel: "¡Busca más combustible!",
    resultMsgLoco: "¡Caos total!",
    finalScore: "Puntos: {score}",
    flashStarChain: "⭐ ¡CADENA!",
    flashFuel: "⛽ ¡COMBUSTIBLE!",
    flashNearMiss: "😎 ¡CASI!",
    flashSmash: "💥 ¡GOLPE!",
    flashRamp: "🚀 ¡TURBO!",
    flashLowFuel: "⛽ ¡POCO FUEL!",
    flashDamage: "💔 ¡AY!",
    langBtn: "EN",
    tiltOn: "📱",
    tiltOff: "📱",
    musicOn: "🎵",
    musicOff: "🔇",
    progress: "{pct}%"
  }
};

export function t(lang, key, vars = {}) {
  const table = S[lang] || S.en;
  const raw = table[key] || S.en[key] || key;
  return raw.replace(/\{(\w+)\}/g, (_, v) => String(vars[v] ?? ""));
}

export function getLanguageButtonText(lang) {
  return t(lang, "langBtn");
}
