import { EstrellaGame } from "./game.js";
import { STORAGE_LANGUAGE_KEY, getLanguageButtonText, t } from "./i18n.js";
import { loadProfile } from "./personalization.js";
import { byId, setText, setVisible, setupHoldButton } from "./ui.js";

const STORAGE_DRIVER_KEY = "estrella-racer-driver";
const STORAGE_MUTE_KEY = "estrella-racer-muted";
const STORAGE_TILT_KEY = "estrella-racer-tilt";
const AVATAR_CANDIDATES = [
  "assets/reference/axel-jade/IMG_6923.heic",
  "assets/reference/axel-jade/IMG_6923.jpg",
  "assets/reference/axel-jade/IMG_6923.jpeg",
  "assets/reference/axel-jade/IMG_6923.png",
  "assets/reference/axel-jade/Axel-Jade.heic",
  "assets/reference/axel-jade/axel-jade.heic",
  "assets/reference/axel-jade/side-by-side.jpg",
  "assets/reference/axel-jade/side-by-side.jpeg",
  "assets/reference/axel-jade/side-by-side.png",
  "assets/reference/axel-jade/photo.jpg",
  "assets/reference/axel-jade/photo.jpeg",
  "assets/reference/axel-jade/photo.png"
];

const DEVICE_ORIENTATION_SUPPORTED = typeof window.DeviceOrientationEvent !== "undefined";
const DEVICE_ORIENTATION_NEEDS_PERMISSION = DEVICE_ORIENTATION_SUPPORTED && typeof window.DeviceOrientationEvent.requestPermission === "function";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatTimer(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60).toString().padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

const elements = {
  canvas: byId("gameCanvas"),
  languageBtn: byId("languageBtn"),
  tiltBtn: byId("tiltBtn"),
  audioBtn: byId("audioBtn"),
  garageBtn: byId("garageBtn"),
  menuPanel: byId("menuPanel"),
  carPanel: byId("carPanel"),
  resultPanel: byId("resultPanel"),
  hud: byId("hud"),
  controls: byId("controls"),
  gameTitle: byId("gameTitle"),
  gameSubtitle: byId("gameSubtitle"),
  quickHint: byId("quickHint"),
  startRaceBtn: byId("startRaceBtn"),
  startLocoBtn: byId("startLocoBtn"),
  driverSelectTitle: byId("driverSelectTitle"),
  avatarPreview: byId("avatarPreview"),
  avatarHint: byId("avatarHint"),
  driverCards: byId("driverCards"),
  driverPrimaryBtn: byId("driverPrimaryBtn"),
  driverSecondaryBtn: byId("driverSecondaryBtn"),
  launchSelectedBtn: byId("launchSelectedBtn"),
  closeGarageBtn: byId("closeGarageBtn"),
  resultTitle: byId("resultTitle"),
  resultMessage: byId("resultMessage"),
  restartBtn: byId("restartBtn"),
  backMenuBtn: byId("backMenuBtn"),
  hudMode: byId("hudMode"),
  hudTimer: byId("hudTimer"),
  hudFuel: byId("hudFuel"),
  hudDamage: byId("hudDamage"),
  hudScore: byId("hudScore"),
  hudSrs: byId("hudSrs"),
  hudFlash: byId("hudFlash"),
  pauseBtn: byId("pauseBtn"),
  exitBtn: byId("exitBtn"),
  controlLeft: byId("controlLeft"),
  controlUp: byId("controlUp"),
  controlDown: byId("controlDown"),
  controlRight: byId("controlRight")
};

const game = new EstrellaGame(elements.canvas);
let language = localStorage.getItem(STORAGE_LANGUAGE_KEY) === "es" ? "es" : "en";
const profile = loadProfile();
let selectedDriverKey = localStorage.getItem(STORAGE_DRIVER_KEY) === "secondary" ? "secondary" : "primary";
let resultShown = false;
let pendingMode = "race";

const tiltState = {
  supported: DEVICE_ORIENTATION_SUPPORTED,
  needsPermission: DEVICE_ORIENTATION_NEEDS_PERMISSION,
  wanted: localStorage.getItem(STORAGE_TILT_KEY) !== "0",
  enabled: false,
  permissionGranted: !DEVICE_ORIENTATION_NEEDS_PERMISSION
};
if (tiltState.supported && !tiltState.needsPermission && tiltState.wanted) {
  tiltState.enabled = true;
}

game.setLanguage(language);
game.setProfile(profile);
game.setDriverKey(selectedDriverKey);
game.setMuted(localStorage.getItem(STORAGE_MUTE_KEY) === "1");

function isInPlayState() {
  const state = game.getRunState();
  return state === "playing" || state === "paused";
}

function getSelectedDriverName() {
  return selectedDriverKey === "secondary" ? profile.secondaryName : profile.primaryName;
}

function syncControlsVisibility() {
  const active = game.getRunState() === "playing" || game.getRunState() === "paused";
  setVisible(elements.controls, active);
}

function refreshDriverButtons() {
  setText(elements.driverPrimaryBtn, t(language, "driverPrimary", { name: profile.primaryName }));
  setText(elements.driverSecondaryBtn, t(language, "driverSecondary", { name: profile.secondaryName }));
  elements.driverPrimaryBtn.classList.toggle("active", selectedDriverKey === "primary");
  elements.driverSecondaryBtn.classList.toggle("active", selectedDriverKey === "secondary");
}

function refreshLaunchButton() {
  const name = getSelectedDriverName();
  setText(elements.launchSelectedBtn, pendingMode === "loco" ? t(language, "launchLocoAs", { name }) : t(language, "launchRaceAs", { name }));
}

function refreshTiltButtonText() {
  if (!tiltState.supported) {
    setText(elements.tiltBtn, t(language, "tiltUnavailable"));
    return;
  }
  setText(elements.tiltBtn, tiltState.enabled ? t(language, "tiltOn") : t(language, "tiltOff"));
}

function refreshHud() {
  const snapshot = game.getSnapshot();
  setText(elements.hudMode, snapshot.mode === "race" ? t(language, "modeRace") : t(language, "modeLoco"));
  setText(elements.hudTimer, `⏱ ${formatTimer(snapshot.timer)}`);
  setText(elements.hudFuel, `⛽ ${snapshot.fuel}%`);
  setText(elements.hudDamage, `🛠 ${snapshot.damage}%`);
  setText(elements.hudScore, `${t(language, "score")} ${snapshot.score}`);
  setText(elements.hudSrs, `${t(language, "srs")} ${snapshot.srs}`);

  elements.hudScore.classList.toggle("flash", snapshot.scorePulse);
  elements.hudSrs.classList.toggle("flash", snapshot.srsPulse);
  elements.hudFuel.classList.toggle("critical", snapshot.fuel <= 20);
  elements.hudDamage.classList.toggle("critical", snapshot.damage >= 70);

  if (snapshot.flashEventKey) {
    setText(elements.hudFlash, t(language, snapshot.flashEventKey));
    setVisible(elements.hudFlash, true);
  } else {
    setVisible(elements.hudFlash, false);
  }
  setText(elements.pauseBtn, game.getRunState() === "paused" ? t(language, "resume") : t(language, "pause"));
}

function refreshTexts() {
  setText(elements.gameTitle, t(language, "title"));
  setText(elements.gameSubtitle, t(language, "subtitle"));
  setText(elements.quickHint, t(language, "quickHint"));
  setText(elements.startRaceBtn, t(language, "startRace"));
  setText(elements.startLocoBtn, t(language, "startLoco"));
  setText(elements.languageBtn, getLanguageButtonText(language));
  refreshTiltButtonText();
  setText(elements.audioBtn, game.muted ? t(language, "musicOff") : t(language, "musicOn"));
  setText(elements.garageBtn, t(language, "openSelect"));
  setText(elements.driverSelectTitle, t(language, "selectDriver"));
  setText(elements.closeGarageBtn, t(language, "closeSelect"));
  setText(elements.restartBtn, t(language, "restart"));
  setText(elements.backMenuBtn, t(language, "menu"));
  setText(elements.exitBtn, t(language, "menu"));
  setText(elements.controlLeft, t(language, "controlLeft"));
  setText(elements.controlUp, t(language, "controlUp"));
  setText(elements.controlDown, t(language, "controlDown"));
  setText(elements.controlRight, t(language, "controlRight"));
  refreshDriverButtons();
  refreshLaunchButton();
  refreshHud();
}

function applyDriver(driverKey) {
  selectedDriverKey = driverKey === "secondary" ? "secondary" : "primary";
  localStorage.setItem(STORAGE_DRIVER_KEY, selectedDriverKey);
  game.setDriverKey(selectedDriverKey);
  refreshDriverButtons();
  refreshLaunchButton();
  refreshHud();
}

function loadAvatarPreview() {
  const cacheBuster = `?v=${Date.now()}`;
  let index = 0;

  const clearPhotoState = () => {
    elements.driverCards.classList.remove("photoLoaded");
    elements.driverCards.style.removeProperty("--driver-photo");
    elements.avatarPreview.classList.add("hidden");
    elements.avatarPreview.removeAttribute("src");
  };

  const tryNext = () => {
    if (index >= AVATAR_CANDIDATES.length) {
      clearPhotoState();
      setText(elements.avatarHint, t(language, "photoHintMissing"));
      return;
    }
    const candidate = `${AVATAR_CANDIDATES[index]}${cacheBuster}`;
    index += 1;
    const probe = new Image();
    probe.onload = () => {
      elements.avatarPreview.src = candidate;
      elements.avatarPreview.classList.remove("hidden");
      elements.driverCards.classList.add("photoLoaded");
      elements.driverCards.style.setProperty("--driver-photo", `url("${candidate}")`);
      setText(elements.avatarHint, t(language, "photoHintLoaded"));
    };
    probe.onerror = tryNext;
    probe.src = candidate;
  };

  tryNext();
}

function showMenu() {
  game.stopToMenu();
  resultShown = false;
  setVisible(elements.menuPanel, true);
  setVisible(elements.carPanel, false);
  setVisible(elements.resultPanel, false);
  setVisible(elements.hud, false);
  setVisible(elements.controls, false);
}

function openDriverSelect(mode) {
  if (isInPlayState()) {
    return;
  }
  pendingMode = mode || "race";
  setVisible(elements.menuPanel, false);
  setVisible(elements.resultPanel, false);
  setVisible(elements.carPanel, true);
  refreshLaunchButton();
  loadAvatarPreview();
}

async function ensureTiltPermission() {
  if (!tiltState.supported || !tiltState.wanted) {
    tiltState.enabled = false;
    game.clearTiltInput();
    return false;
  }
  if (!tiltState.needsPermission) {
    tiltState.enabled = true;
    return true;
  }
  if (tiltState.permissionGranted) {
    tiltState.enabled = true;
    return true;
  }
  try {
    const result = await window.DeviceOrientationEvent.requestPermission();
    tiltState.permissionGranted = result === "granted";
    tiltState.enabled = tiltState.permissionGranted;
    if (!tiltState.enabled) {
      tiltState.wanted = false;
      localStorage.setItem(STORAGE_TILT_KEY, "0");
      game.clearTiltInput();
    }
  } catch {
    tiltState.enabled = false;
    tiltState.wanted = false;
    localStorage.setItem(STORAGE_TILT_KEY, "0");
    game.clearTiltInput();
  }
  return tiltState.enabled;
}

async function startMode(mode) {
  game.unlockAudio();
  if (tiltState.wanted) {
    await ensureTiltPermission();
  }
  game.setDriverKey(selectedDriverKey);
  game.start(mode);
  resultShown = false;
  setVisible(elements.menuPanel, false);
  setVisible(elements.carPanel, false);
  setVisible(elements.resultPanel, false);
  setVisible(elements.hud, true);
  syncControlsVisibility();
  refreshHud();
}

function showResult() {
  const result = game.getResult();
  setText(elements.resultTitle, t(language, result.titleKey));
  setText(elements.resultMessage, t(language, result.messageKey));
  setVisible(elements.resultPanel, true);
  setVisible(elements.hud, false);
  setVisible(elements.controls, false);
}

function toggleLanguage() {
  language = language === "en" ? "es" : "en";
  localStorage.setItem(STORAGE_LANGUAGE_KEY, language);
  game.setLanguage(language);
  refreshTexts();
  if (!elements.carPanel.classList.contains("hidden")) {
    loadAvatarPreview();
  }
}

async function toggleTilt() {
  game.unlockAudio();
  if (!tiltState.supported) {
    refreshTexts();
    return;
  }
  if (tiltState.enabled || tiltState.wanted) {
    tiltState.wanted = false;
    tiltState.enabled = false;
    localStorage.setItem(STORAGE_TILT_KEY, "0");
    game.clearTiltInput();
    refreshTexts();
    return;
  }

  tiltState.wanted = true;
  localStorage.setItem(STORAGE_TILT_KEY, "1");
  await ensureTiltPermission();
  refreshTexts();
}

elements.languageBtn.addEventListener("click", toggleLanguage);
elements.tiltBtn.addEventListener("click", () => {
  toggleTilt();
});
elements.audioBtn.addEventListener("click", () => {
  game.unlockAudio();
  const muted = game.toggleMuted();
  localStorage.setItem(STORAGE_MUTE_KEY, muted ? "1" : "0");
  refreshTexts();
});
elements.garageBtn.addEventListener("click", () => openDriverSelect("race"));
elements.startRaceBtn.addEventListener("click", () => openDriverSelect("race"));
elements.startLocoBtn.addEventListener("click", () => openDriverSelect("loco"));
elements.driverPrimaryBtn.addEventListener("click", () => applyDriver("primary"));
elements.driverSecondaryBtn.addEventListener("click", () => applyDriver("secondary"));
elements.launchSelectedBtn.addEventListener("click", () => startMode(pendingMode));
elements.closeGarageBtn.addEventListener("click", showMenu);
elements.pauseBtn.addEventListener("click", () => {
  game.togglePause();
  syncControlsVisibility();
  refreshHud();
});
elements.exitBtn.addEventListener("click", showMenu);
elements.restartBtn.addEventListener("click", () => startMode(game.getMode()));
elements.backMenuBtn.addEventListener("click", showMenu);

const controlMap = {
  left: "left",
  right: "right",
  up: "up",
  down: "down"
};

for (const button of [elements.controlLeft, elements.controlUp, elements.controlDown, elements.controlRight]) {
  const control = controlMap[button.dataset.control];
  setupHoldButton(
    button,
    () => {
      game.unlockAudio();
      if (game.getRunState() !== "playing") {
        return;
      }
      if (game.getMode() === "race") {
        if (control === "left") game.moveLane(-1);
        if (control === "right") game.moveLane(1);
      }
      game.setControl(control, true);
    },
    () => {
      game.setControl(control, false);
    }
  );
}

elements.canvas.addEventListener(
  "pointerdown",
  (event) => {
    if (game.getRunState() !== "playing") {
      return;
    }
    game.unlockAudio();
    if (game.getMode() === "race") {
      game.tapAt(event.clientX);
    }
  },
  { passive: false }
);

document.addEventListener("keydown", (event) => {
  if (event.code === "KeyP") {
    if (isInPlayState()) {
      game.togglePause();
      syncControlsVisibility();
      refreshHud();
      event.preventDefault();
    }
    return;
  }
  if (event.code === "Escape") {
    showMenu();
    return;
  }
  if (game.getRunState() !== "playing") {
    return;
  }

  if (event.code === "ArrowLeft") {
    game.moveLane(-1);
    game.setControl("left", true);
    event.preventDefault();
  }
  if (event.code === "ArrowRight") {
    game.moveLane(1);
    game.setControl("right", true);
    event.preventDefault();
  }
  if (event.code === "ArrowUp") {
    game.setControl("up", true);
    event.preventDefault();
  }
  if (event.code === "ArrowDown") {
    game.setControl("down", true);
    event.preventDefault();
  }
});

document.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft") game.setControl("left", false);
  if (event.code === "ArrowRight") game.setControl("right", false);
  if (event.code === "ArrowUp") game.setControl("up", false);
  if (event.code === "ArrowDown") game.setControl("down", false);
});

if (tiltState.supported) {
  window.addEventListener("deviceorientation", (event) => {
    if (!tiltState.enabled || game.getRunState() !== "playing") {
      game.clearTiltInput();
      return;
    }
    const side = clamp((event.gamma ?? 0) / 28, -1, 1);
    const throttle = clamp((15 - (event.beta ?? 15)) / 30, -1, 1);
    game.setTiltInput(side, throttle);
  });
}

window.addEventListener("resize", () => {
  game.resize(window.innerWidth, window.innerHeight);
});

document.body.addEventListener(
  "touchmove",
  (event) => {
    if (isInPlayState()) {
      event.preventDefault();
    }
  },
  { passive: false }
);

function loop(timestamp) {
  game.frame(timestamp);
  const state = game.getRunState();
  if (state === "playing" || state === "paused") {
    setVisible(elements.hud, true);
    syncControlsVisibility();
    refreshHud();
  }
  if (state === "gameover" && !resultShown) {
    resultShown = true;
    showResult();
  }
  requestAnimationFrame(loop);
}

refreshTexts();
showMenu();
requestAnimationFrame(loop);
