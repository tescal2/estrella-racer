import { EstrellaGame, CAR_PRESETS } from "./game.js";
import { STORAGE_LANGUAGE_KEY, getLanguageButtonText, t } from "./i18n.js";
import { loadProfile, saveProfile } from "./personalization.js";
import { byId, renderCarGrid, setText, setVisible, setupHoldButton } from "./ui.js";

const STORAGE_CAR_KEY = "estrella-racer-selected-car";
const STORAGE_MUTE_KEY = "estrella-racer-muted";
const STORAGE_DRIVER_KEY = "estrella-racer-driver";
const STORAGE_TILT_KEY = "estrella-racer-tilt";
const AVATAR_CANDIDATES = [
  "assets/reference/axel-jade/Axel-Jade.heic",
  "assets/reference/axel-jade/axel-jade.heic",
  "assets/reference/axel-jade/side-by-side.jpg",
  "assets/reference/axel-jade/side-by-side.png",
  "assets/reference/axel-jade/side-by-side.jpeg",
  "assets/reference/axel-jade/photo.jpg",
  "assets/reference/axel-jade/photo.png",
  "assets/reference/axel-jade/photo.jpeg"
];

const DEVICE_ORIENTATION_SUPPORTED = typeof window.DeviceOrientationEvent !== "undefined";
const DEVICE_ORIENTATION_NEEDS_PERMISSION = DEVICE_ORIENTATION_SUPPORTED && typeof window.DeviceOrientationEvent.requestPermission === "function";

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
  missionHint: byId("missionHint"),
  startRaceBtn: byId("startRaceBtn"),
  startLocoBtn: byId("startLocoBtn"),
  carPanelTitle: byId("carPanelTitle"),
  carPanelHint: byId("carPanelHint"),
  avatarPreview: byId("avatarPreview"),
  avatarHint: byId("avatarHint"),
  driverSelectTitle: byId("driverSelectTitle"),
  driverCards: byId("driverCards"),
  driverPrimaryBtn: byId("driverPrimaryBtn"),
  driverSecondaryBtn: byId("driverSecondaryBtn"),
  launchSelectedBtn: byId("launchSelectedBtn"),
  primaryNameLabel: byId("primaryNameLabel"),
  secondaryNameLabel: byId("secondaryNameLabel"),
  primaryNameInput: byId("primaryNameInput"),
  secondaryNameInput: byId("secondaryNameInput"),
  saveNamesBtn: byId("saveNamesBtn"),
  carGrid: byId("carGrid"),
  closeGarageBtn: byId("closeGarageBtn"),
  resultTitle: byId("resultTitle"),
  resultMessage: byId("resultMessage"),
  restartBtn: byId("restartBtn"),
  backMenuBtn: byId("backMenuBtn"),
  hudMode: byId("hudMode"),
  hudTimer: byId("hudTimer"),
  hudFuel: byId("hudFuel"),
  hudStars: byId("hudStars"),
  hudScore: byId("hudScore"),
  hudSrs: byId("hudSrs"),
  hudCombo: byId("hudCombo"),
  hudPlates: byId("hudPlates"),
  hudFlash: byId("hudFlash"),
  pauseBtn: byId("pauseBtn"),
  exitBtn: byId("exitBtn"),
  controlLeft: byId("controlLeft"),
  controlUp: byId("controlUp"),
  controlDown: byId("controlDown"),
  controlRight: byId("controlRight")
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatTimer(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60).toString().padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

const game = new EstrellaGame(elements.canvas);
let language = localStorage.getItem(STORAGE_LANGUAGE_KEY) === "es" ? "es" : "en";
let profile = loadProfile();
let selectedCarId = localStorage.getItem(STORAGE_CAR_KEY) || CAR_PRESETS[0].id;
let selectedDriverKey = localStorage.getItem(STORAGE_DRIVER_KEY) === "secondary" ? "secondary" : "primary";
let resultShown = false;
let pendingMode = null;

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
game.setSelectedCar(selectedCarId);
game.setDriverKey(selectedDriverKey);
game.setMuted(localStorage.getItem(STORAGE_MUTE_KEY) === "1");

elements.primaryNameInput.value = profile.primaryName;
elements.secondaryNameInput.value = profile.secondaryName;

function isInPlayState() {
  const state = game.getRunState();
  return state === "playing" || state === "paused";
}

function getSelectedDriverName() {
  return selectedDriverKey === "secondary" ? profile.secondaryName : profile.primaryName;
}

function syncControlsVisibility() {
  const state = game.getRunState();
  const showControls = state === "playing" || state === "paused";
  setVisible(elements.controls, showControls);
  setVisible(elements.controlUp, true);
  setVisible(elements.controlDown, true);
  setVisible(elements.controlLeft, true);
  setVisible(elements.controlRight, true);
}

function setHudFlashClass(element, className, enabled) {
  element.classList.toggle(className, Boolean(enabled));
}

function refreshHud() {
  const snapshot = game.getSnapshot();
  setText(elements.hudMode, snapshot.mode === "race" ? t(language, "modeRace") : t(language, "modeLoco"));
  setText(elements.hudTimer, `⏱ ${t(language, "timer")}: ${formatTimer(snapshot.timer)}`);
  setText(elements.hudFuel, `⛽ ${t(language, "fuel")}: ${snapshot.fuel}%`);
  setText(elements.hudStars, `⭐ ${t(language, "stars")}: ${snapshot.stars}`);
  setText(elements.hudScore, `${t(language, "score")}: ${snapshot.score}`);
  setText(elements.hudSrs, `${t(language, "srs")}: ${snapshot.srs}`);
  setText(elements.hudCombo, `${t(language, "combo")}: x${snapshot.combo}`);
  setText(elements.hudPlates, `${t(language, "plate")}: ${snapshot.plate}`);

  setHudFlashClass(elements.hudScore, "flash", snapshot.scorePulse);
  setHudFlashClass(elements.hudSrs, "flash", snapshot.srsPulse);
  setHudFlashClass(elements.hudFuel, "critical", snapshot.fuel <= 20);

  if (snapshot.flashEventKey) {
    setText(elements.hudFlash, t(language, snapshot.flashEventKey));
    setVisible(elements.hudFlash, true);
  } else {
    setVisible(elements.hudFlash, false);
  }

  const pauseText = game.getRunState() === "paused" ? t(language, "resume") : t(language, "pause");
  setText(elements.pauseBtn, pauseText);
}

function refreshCarGrid() {
  renderCarGrid(elements.carGrid, CAR_PRESETS, selectedCarId, language, t, (nextId) => {
    selectedCarId = nextId;
    localStorage.setItem(STORAGE_CAR_KEY, selectedCarId);
    game.setSelectedCar(selectedCarId);
    refreshCarGrid();
  });
}

function refreshDriverButtons() {
  setText(elements.driverPrimaryBtn, t(language, "driverPrimary", { name: profile.primaryName }));
  setText(elements.driverSecondaryBtn, t(language, "driverSecondary", { name: profile.secondaryName }));
  elements.driverPrimaryBtn.classList.toggle("active", selectedDriverKey === "primary");
  elements.driverSecondaryBtn.classList.toggle("active", selectedDriverKey === "secondary");
}

function refreshLaunchButton() {
  const driverName = getSelectedDriverName();
  if (pendingMode === "race") {
    setText(elements.launchSelectedBtn, t(language, "launchRaceAs", { name: driverName }));
  } else if (pendingMode === "loco") {
    setText(elements.launchSelectedBtn, t(language, "launchLocoAs", { name: driverName }));
  } else {
    setText(elements.launchSelectedBtn, t(language, "quickLaunch"));
  }
}

function refreshTiltButtonText() {
  if (!tiltState.supported) {
    setText(elements.tiltBtn, t(language, "tiltUnavailable"));
    return;
  }
  setText(elements.tiltBtn, tiltState.enabled ? t(language, "tiltOn") : t(language, "tiltOff"));
}

function refreshTexts() {
  setText(elements.gameTitle, t(language, "title"));
  setText(
    elements.gameSubtitle,
    t(language, "subtitle", {
      primary: profile.primaryName,
      secondary: profile.secondaryName
    })
  );
  setText(elements.missionHint, t(language, "missionHint"));
  setText(elements.startRaceBtn, t(language, "startRace"));
  setText(elements.startLocoBtn, t(language, "startLoco"));
  setText(elements.languageBtn, getLanguageButtonText(language));
  refreshTiltButtonText();
  setText(elements.audioBtn, game.muted ? t(language, "audioOff") : t(language, "audioOn"));
  setText(elements.garageBtn, t(language, "openGarage"));
  setText(elements.carPanelTitle, t(language, "garageTitle"));
  setText(elements.carPanelHint, t(language, "garageHint"));
  setText(elements.driverSelectTitle, t(language, "driverSelectTitle"));
  setText(elements.primaryNameLabel, t(language, "primaryName"));
  setText(elements.secondaryNameLabel, t(language, "secondaryName"));
  setText(elements.saveNamesBtn, t(language, "saveNames"));
  setText(elements.closeGarageBtn, t(language, "closeGarage"));
  setText(elements.restartBtn, t(language, "restart"));
  setText(elements.backMenuBtn, t(language, "backMenu"));
  setText(elements.exitBtn, t(language, "exit"));
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
  const preview = elements.avatarPreview;
  const hint = elements.avatarHint;

  const clearPhotoState = () => {
    elements.driverCards.classList.remove("photoLoaded");
    elements.driverCards.style.removeProperty("--driver-photo");
  };

  const tryNext = () => {
    if (index >= AVATAR_CANDIDATES.length) {
      preview.classList.add("hidden");
      preview.removeAttribute("src");
      clearPhotoState();
      setText(hint, t(language, "photoHintMissing"));
      return;
    }
    const candidate = `${AVATAR_CANDIDATES[index]}${cacheBuster}`;
    index += 1;
    const probe = new Image();
    probe.onload = () => {
      preview.src = candidate;
      preview.classList.remove("hidden");
      elements.driverCards.classList.add("photoLoaded");
      elements.driverCards.style.setProperty("--driver-photo", `url("${candidate}")`);
      setText(hint, t(language, "photoHintLoaded"));
    };
    probe.onerror = tryNext;
    probe.src = candidate;
  };

  tryNext();
}

function showMenu() {
  pendingMode = null;
  game.stopToMenu();
  resultShown = false;
  setVisible(elements.menuPanel, true);
  setVisible(elements.carPanel, false);
  setVisible(elements.resultPanel, false);
  setVisible(elements.hud, false);
  setVisible(elements.controls, false);
  refreshLaunchButton();
}

function openSelection(mode) {
  if (isInPlayState()) {
    return;
  }
  pendingMode = mode;
  setVisible(elements.menuPanel, false);
  setVisible(elements.resultPanel, false);
  setVisible(elements.carPanel, true);
  refreshLaunchButton();
  loadAvatarPreview();
}

function openGarage() {
  if (isInPlayState()) {
    return;
  }
  pendingMode = null;
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
  game.start(mode);
  game.setDriverKey(selectedDriverKey);
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
  refreshCarGrid();
  if (!elements.carPanel.classList.contains("hidden")) {
    loadAvatarPreview();
  }
}

function saveNameChanges() {
  profile = saveProfile({
    primaryName: elements.primaryNameInput.value,
    secondaryName: elements.secondaryNameInput.value
  });
  elements.primaryNameInput.value = profile.primaryName;
  elements.secondaryNameInput.value = profile.secondaryName;
  game.setProfile(profile);
  game.setDriverKey(selectedDriverKey);
  refreshTexts();
  const originalLabel = t(language, "saveNames");
  setText(elements.saveNamesBtn, t(language, "namesSaved"));
  setTimeout(() => setText(elements.saveNamesBtn, originalLabel), 900);
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
elements.garageBtn.addEventListener("click", openGarage);
elements.startRaceBtn.addEventListener("click", () => openSelection("race"));
elements.startLocoBtn.addEventListener("click", () => openSelection("loco"));
elements.driverPrimaryBtn.addEventListener("click", () => applyDriver("primary"));
elements.driverSecondaryBtn.addEventListener("click", () => applyDriver("secondary"));
elements.launchSelectedBtn.addEventListener("click", () => {
  startMode(pendingMode || "race");
});
elements.closeGarageBtn.addEventListener("click", showMenu);
elements.saveNamesBtn.addEventListener("click", saveNameChanges);
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
      if (game.getMode() === "race" && control === "left") {
        game.moveLane(-1);
      }
      if (game.getMode() === "race" && control === "right") {
        game.moveLane(1);
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
    const throttle = clamp((15 - (event.beta ?? 15)) / 32, -1, 1);
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

refreshCarGrid();
refreshTexts();
showMenu();
requestAnimationFrame(loop);
