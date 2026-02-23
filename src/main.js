import { EstrellaGame, drawAvatar } from "./game.js";
import { STORAGE_LANGUAGE_KEY, t, getLanguageButtonText } from "./i18n.js";
import { loadProfile } from "./personalization.js";
import { byId, setVisible, setText, setupHoldButton } from "./ui.js";

const STORAGE_DRIVER_KEY = "estrella-racer-driver";
const STORAGE_MUTE_KEY = "estrella-racer-muted";
const STORAGE_TILT_KEY = "estrella-racer-tilt";
const TILT_SUPPORTED = typeof window.DeviceOrientationEvent !== "undefined";
const TILT_NEEDS_PERM = TILT_SUPPORTED && typeof window.DeviceOrientationEvent.requestPermission === "function";

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

const el = {
  canvas: byId("gameCanvas"),
  languageBtn: byId("languageBtn"),
  tiltBtn: byId("tiltBtn"),
  audioBtn: byId("audioBtn"),
  menuPanel: byId("menuPanel"),
  gameTitle: byId("gameTitle"),
  playBtn: byId("playBtn"),
  driverPanel: byId("driverPanel"),
  driverTitle: byId("driverTitle"),
  driverAxelBtn: byId("driverAxelBtn"),
  driverJadeBtn: byId("driverJadeBtn"),
  labelAxel: byId("labelAxel"),
  labelJade: byId("labelJade"),
  avatarAxel: byId("avatarAxel"),
  avatarJade: byId("avatarJade"),
  nextDiffBtn: byId("nextDiffBtn"),
  backMenuBtn2: byId("backMenuBtn2"),
  diffPanel: byId("diffPanel"),
  diffTitle: byId("diffTitle"),
  diffEasyBtn: byId("diffEasyBtn"),
  diffMedBtn: byId("diffMedBtn"),
  diffHardBtn: byId("diffHardBtn"),
  diffEasyLabel: byId("diffEasyLabel"),
  diffMedLabel: byId("diffMedLabel"),
  diffHardLabel: byId("diffHardLabel"),
  nextModeBtn: byId("nextModeBtn"),
  backDriverBtn: byId("backDriverBtn"),
  modePanel: byId("modePanel"),
  modeSelectTitle: byId("modeSelectTitle"),
  modeRaceBtn: byId("modeRaceBtn"),
  modeLocoBtn: byId("modeLocoBtn"),
  modeRaceLabel: byId("modeRaceLabel"),
  modeLocoLabel: byId("modeLocoLabel"),
  backDiffBtn: byId("backDiffBtn"),
  hud: byId("hud"),
  hudLives: byId("hudLives"),
  hudScore: byId("hudScore"),
  hudFuel: byId("hudFuel"),
  progressBar: byId("progressBar"),
  progressLabel: byId("progressLabel"),
  hudFlash: byId("hudFlash"),
  pauseBtn: byId("pauseBtn"),
  exitBtn: byId("exitBtn"),
  controls: byId("controls"),
  ctrlLeft: byId("ctrlLeft"),
  ctrlUp: byId("ctrlUp"),
  ctrlDown: byId("ctrlDown"),
  ctrlRight: byId("ctrlRight"),
  resultPanel: byId("resultPanel"),
  resultTitle: byId("resultTitle"),
  resultMsg: byId("resultMsg"),
  resultScore: byId("resultScore"),
  retryBtn: byId("retryBtn"),
  backMenuBtn: byId("backMenuBtn")
};

const game = new EstrellaGame(el.canvas);
let lang = localStorage.getItem(STORAGE_LANGUAGE_KEY) === "es" ? "es" : "en";
const profile = loadProfile();
let driverKey = localStorage.getItem(STORAGE_DRIVER_KEY) === "secondary" ? "secondary" : "primary";
let difficulty = "medium";
let resultShown = false;
let lastMode = "race";

const tilt = {
  supported: TILT_SUPPORTED,
  needsPerm: TILT_NEEDS_PERM,
  wanted: localStorage.getItem(STORAGE_TILT_KEY) !== "0",
  enabled: false,
  granted: !TILT_NEEDS_PERM
};
if (tilt.supported && !tilt.needsPerm && tilt.wanted) tilt.enabled = true;

game.setLanguage(lang);
game.setProfile(profile);
game.setDriverKey(driverKey);
game.setMuted(localStorage.getItem(STORAGE_MUTE_KEY) === "1");

function drawAvatarCanvases() {
  for (const [canvasEl, isAxel] of [[el.avatarAxel, true], [el.avatarJade, false]]) {
    const ctx = canvasEl.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasEl.width = 140 * dpr;
    canvasEl.height = 140 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 140, 140);
    drawAvatar(ctx, 70, 70, 130, isAxel);
  }
}

function hideAllPanels() {
  for (const p of [el.menuPanel, el.driverPanel, el.diffPanel, el.modePanel, el.resultPanel, el.hud, el.controls]) {
    setVisible(p, false);
  }
}

function showMenu() {
  game.stopToMenu();
  resultShown = false;
  hideAllPanels();
  setVisible(el.menuPanel, true);
}

function showDriverSelect() {
  hideAllPanels();
  setVisible(el.driverPanel, true);
  drawAvatarCanvases();
  refreshDriverCards();
}

function showDiffSelect() {
  hideAllPanels();
  setVisible(el.diffPanel, true);
  refreshDiffCards();
}

function showModeSelect() {
  hideAllPanels();
  setVisible(el.modePanel, true);
}

function refreshDriverCards() {
  el.driverAxelBtn.classList.toggle("active", driverKey === "primary");
  el.driverJadeBtn.classList.toggle("active", driverKey === "secondary");
}

function refreshDiffCards() {
  el.diffEasyBtn.classList.toggle("active", difficulty === "easy");
  el.diffMedBtn.classList.toggle("active", difficulty === "medium");
  el.diffHardBtn.classList.toggle("active", difficulty === "hard");
}

function refreshHud() {
  const snap = game.getSnapshot();
  let hearts = "";
  for (let i = 0; i < snap.maxLives; i++) hearts += i < snap.lives ? "\u2764\uFE0F" : "\u{1F5A4}";
  setText(el.hudLives, hearts);
  setText(el.hudScore, t(lang, "score") + " " + snap.score);
  setText(el.hudFuel, "\u26FD " + snap.fuel + "%");
  el.hudFuel.style.color = snap.fuel <= 20 ? "#ff4444" : "#7df";
  el.progressBar.style.width = Math.round(snap.progress * 100) + "%";
  setText(el.progressLabel, t(lang, "progress", { pct: Math.round(snap.progress * 100) }));
  if (snap.flashKey) {
    setText(el.hudFlash, t(lang, snap.flashKey));
    setVisible(el.hudFlash, true);
  } else {
    setVisible(el.hudFlash, false);
  }
  setText(el.pauseBtn, snap.paused ? t(lang, "resume") : t(lang, "pause"));
}

function refreshTexts() {
  setText(el.gameTitle, t(lang, "title"));
  setText(el.playBtn, t(lang, "play"));
  setText(el.languageBtn, getLanguageButtonText(lang));
  setText(el.tiltBtn, tilt.supported ? (tilt.enabled ? t(lang, "tiltOn") : t(lang, "tiltOff")) : "\u274C");
  setText(el.audioBtn, game.muted ? t(lang, "musicOff") : t(lang, "musicOn"));
  setText(el.driverTitle, t(lang, "chooseDriver"));
  setText(el.labelAxel, profile.primaryName);
  setText(el.labelJade, profile.secondaryName);
  setText(el.nextDiffBtn, t(lang, "next"));
  setText(el.backMenuBtn2, t(lang, "back"));
  setText(el.diffTitle, t(lang, "chooseDiff"));
  setText(el.diffEasyLabel, t(lang, "easy"));
  setText(el.diffMedLabel, t(lang, "medium"));
  setText(el.diffHardLabel, t(lang, "hard"));
  setText(el.nextModeBtn, t(lang, "next"));
  setText(el.backDriverBtn, t(lang, "back"));
  setText(el.modeSelectTitle, t(lang, "chooseMode"));
  setText(el.modeRaceLabel, t(lang, "race"));
  setText(el.modeLocoLabel, t(lang, "loco"));
  setText(el.backDiffBtn, t(lang, "back"));
  setText(el.retryBtn, t(lang, "retry"));
  setText(el.backMenuBtn, t(lang, "menu"));
}

async function ensureTilt() {
  if (!tilt.supported || !tilt.wanted) { tilt.enabled = false; game.clearTiltInput(); return false; }
  if (!tilt.needsPerm) { tilt.enabled = true; return true; }
  if (tilt.granted) { tilt.enabled = true; return true; }
  try {
    const res = await window.DeviceOrientationEvent.requestPermission();
    tilt.granted = res === "granted"; tilt.enabled = tilt.granted;
    if (!tilt.enabled) { tilt.wanted = false; localStorage.setItem(STORAGE_TILT_KEY, "0"); game.clearTiltInput(); }
  } catch { tilt.enabled = false; tilt.wanted = false; localStorage.setItem(STORAGE_TILT_KEY, "0"); game.clearTiltInput(); }
  return tilt.enabled;
}

async function startGame(mode) {
  game.unlockAudio();
  if (tilt.wanted) await ensureTilt();
  game.setDriverKey(driverKey);
  game.setDifficulty(difficulty);
  game.start(mode);
  lastMode = mode;
  resultShown = false;
  hideAllPanels();
  setVisible(el.hud, true);
  setVisible(el.controls, true);
  refreshHud();
}

function showResult() {
  const res = game.getResult();
  setText(el.resultTitle, t(lang, res.titleKey));
  setText(el.resultMsg, t(lang, res.msgKey));
  setText(el.resultScore, t(lang, "finalScore", { score: res.score }));
  hideAllPanels();
  setVisible(el.resultPanel, true);
}

// Event listeners
el.playBtn.addEventListener("click", () => { game.unlockAudio(); showDriverSelect(); });
el.driverAxelBtn.addEventListener("click", () => { driverKey = "primary"; localStorage.setItem(STORAGE_DRIVER_KEY, "primary"); refreshDriverCards(); });
el.driverJadeBtn.addEventListener("click", () => { driverKey = "secondary"; localStorage.setItem(STORAGE_DRIVER_KEY, "secondary"); refreshDriverCards(); });
el.nextDiffBtn.addEventListener("click", showDiffSelect);
el.backMenuBtn2.addEventListener("click", showMenu);
el.diffEasyBtn.addEventListener("click", () => { difficulty = "easy"; refreshDiffCards(); });
el.diffMedBtn.addEventListener("click", () => { difficulty = "medium"; refreshDiffCards(); });
el.diffHardBtn.addEventListener("click", () => { difficulty = "hard"; refreshDiffCards(); });
el.nextModeBtn.addEventListener("click", showModeSelect);
el.backDriverBtn.addEventListener("click", showDriverSelect);
el.modeRaceBtn.addEventListener("click", () => startGame("race"));
el.modeLocoBtn.addEventListener("click", () => startGame("loco"));
el.backDiffBtn.addEventListener("click", showDiffSelect);
el.pauseBtn.addEventListener("click", () => { game.togglePause(); refreshHud(); });
el.exitBtn.addEventListener("click", showMenu);
el.retryBtn.addEventListener("click", () => startGame(lastMode));
el.backMenuBtn.addEventListener("click", showMenu);
el.languageBtn.addEventListener("click", () => {
  lang = lang === "en" ? "es" : "en";
  localStorage.setItem(STORAGE_LANGUAGE_KEY, lang);
  game.setLanguage(lang);
  refreshTexts();
});
el.audioBtn.addEventListener("click", () => {
  game.unlockAudio();
  const m = game.toggleMuted();
  localStorage.setItem(STORAGE_MUTE_KEY, m ? "1" : "0");
  refreshTexts();
});
el.tiltBtn.addEventListener("click", async () => {
  game.unlockAudio();
  if (!tilt.supported) return;
  if (tilt.enabled || tilt.wanted) {
    tilt.wanted = false; tilt.enabled = false;
    localStorage.setItem(STORAGE_TILT_KEY, "0"); game.clearTiltInput();
  } else {
    tilt.wanted = true; localStorage.setItem(STORAGE_TILT_KEY, "1"); await ensureTilt();
  }
  refreshTexts();
});

// Controls
for (const [btn, ctrl] of [[el.ctrlLeft,"left"],[el.ctrlRight,"right"],[el.ctrlUp,"up"],[el.ctrlDown,"down"]]) {
  setupHoldButton(btn, () => {
    game.unlockAudio();
    if (game.getRunState() !== "playing") return;
    if (game.getMode() === "race" && (ctrl === "left" || ctrl === "right")) game.moveLane(ctrl === "left" ? -1 : 1);
    game.setControl(ctrl, true);
  }, () => { game.setControl(ctrl, false); });
}

el.canvas.addEventListener("pointerdown", (e) => {
  if (game.getRunState() !== "playing") return;
  game.unlockAudio();
  if (game.getMode() === "race") game.tapAt(e.clientX);
}, { passive: false });

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyP" && (game.getRunState() === "playing" || game.getRunState() === "paused")) {
    game.togglePause(); refreshHud(); e.preventDefault(); return;
  }
  if (e.code === "Escape") { showMenu(); return; }
  if (game.getRunState() !== "playing") return;
  if (e.code === "ArrowLeft") { game.moveLane(-1); game.setControl("left", true); e.preventDefault(); }
  if (e.code === "ArrowRight") { game.moveLane(1); game.setControl("right", true); e.preventDefault(); }
  if (e.code === "ArrowUp") { game.setControl("up", true); e.preventDefault(); }
  if (e.code === "ArrowDown") { game.setControl("down", true); e.preventDefault(); }
});
document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft") game.setControl("left", false);
  if (e.code === "ArrowRight") game.setControl("right", false);
  if (e.code === "ArrowUp") game.setControl("up", false);
  if (e.code === "ArrowDown") game.setControl("down", false);
});

if (tilt.supported) {
  window.addEventListener("deviceorientation", (e) => {
    if (!tilt.enabled || game.getRunState() !== "playing") { game.clearTiltInput(); return; }
    game.setTiltInput(clamp((e.gamma ?? 0) / 28, -1, 1), clamp((15 - (e.beta ?? 15)) / 30, -1, 1));
  });
}

window.addEventListener("resize", () => game.resize(window.innerWidth, window.innerHeight));
document.body.addEventListener("touchmove", (e) => {
  if (game.getRunState() === "playing" || game.getRunState() === "paused") e.preventDefault();
}, { passive: false });

function loop(ts) {
  game.frame(ts);
  const state = game.getRunState();
  if (state === "playing" || state === "paused") {
    setVisible(el.hud, true);
    setVisible(el.controls, state === "playing");
    refreshHud();
  }
  if (state === "gameover" && !resultShown) { resultShown = true; showResult(); }
  requestAnimationFrame(loop);
}

refreshTexts();
showMenu();
requestAnimationFrame(loop);
