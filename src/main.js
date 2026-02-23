import { EstrellaGame, CAR_PRESETS } from "./game.js";
import { STORAGE_LANGUAGE_KEY, getLanguageButtonText, t } from "./i18n.js";
import { loadProfile, saveProfile } from "./personalization.js";
import { byId, renderCarGrid, setText, setVisible, setupHoldButton } from "./ui.js";

const STORAGE_CAR_KEY = "estrella-racer-selected-car";
const STORAGE_MUTE_KEY = "estrella-racer-muted";
const AVATAR_CANDIDATES = [
  "assets/reference/axel-jade/Axel-Jade.heic",
  "assets/reference/axel-jade/axel-jade.heic",
  "assets/reference/axel-jade/side-by-side.jpg",
  "assets/reference/axel-jade/side-by-side.png",
  "assets/reference/axel-jade/photo.jpg",
  "assets/reference/axel-jade/photo.png"
];

const elements = {
  canvas: byId("gameCanvas"),
  languageBtn: byId("languageBtn"),
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
  hudStars: byId("hudStars"),
  hudScore: byId("hudScore"),
  hudCombo: byId("hudCombo"),
  hudPlates: byId("hudPlates"),
  pauseBtn: byId("pauseBtn"),
  exitBtn: byId("exitBtn"),
  controlLeft: byId("controlLeft"),
  controlUp: byId("controlUp"),
  controlDown: byId("controlDown"),
  controlRight: byId("controlRight")
};

const game = new EstrellaGame(elements.canvas);
let language = localStorage.getItem(STORAGE_LANGUAGE_KEY) === "es" ? "es" : "en";
let profile = loadProfile();
let selectedCarId = localStorage.getItem(STORAGE_CAR_KEY) || CAR_PRESETS[0].id;
let resultShown = false;

game.setLanguage(language);
game.setProfile(profile);
game.setSelectedCar(selectedCarId);
game.setMuted(localStorage.getItem(STORAGE_MUTE_KEY) === "1");

elements.primaryNameInput.value = profile.primaryName;
elements.secondaryNameInput.value = profile.secondaryName;

function isInPlayState() {
  const state = game.getRunState();
  return state === "playing" || state === "paused";
}

function syncControlsVisibility() {
  const state = game.getRunState();
  const mode = game.getMode();
  const showControls = state === "playing" || state === "paused";
  setVisible(elements.controls, showControls);

  const showUpDown = mode === "loco";
  setVisible(elements.controlUp, showUpDown);
  setVisible(elements.controlDown, showUpDown);
  setVisible(elements.controlLeft, true);
  setVisible(elements.controlRight, true);
}

function refreshHud() {
  const snapshot = game.getSnapshot();
  setText(elements.hudMode, snapshot.mode === "race" ? t(language, "modeRace") : t(language, "modeLoco"));
  setText(elements.hudStars, `⭐ ${t(language, "stars")}: ${snapshot.stars}`);
  setText(elements.hudScore, `${t(language, "score")}: ${snapshot.score}`);
  setText(elements.hudCombo, `${t(language, "combo")}: x${snapshot.combo}`);
  setText(elements.hudPlates, `${t(language, "plate")}: ${snapshot.plate}`);

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
  setText(elements.audioBtn, game.muted ? t(language, "audioOff") : t(language, "audioOn"));
  setText(elements.garageBtn, t(language, "openGarage"));
  setText(elements.carPanelTitle, t(language, "garageTitle"));
  setText(elements.carPanelHint, t(language, "garageHint"));
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
  refreshHud();
}

function loadAvatarPreview() {
  const cacheBuster = `?v=${Date.now()}`;
  let index = 0;
  const preview = elements.avatarPreview;
  const hint = elements.avatarHint;

  const tryNext = () => {
    if (index >= AVATAR_CANDIDATES.length) {
      preview.classList.add("hidden");
      preview.removeAttribute("src");
      setText(hint, t(language, "photoHintMissing"));
      return;
    }
    const candidate = `${AVATAR_CANDIDATES[index]}${cacheBuster}`;
    index += 1;
    const probe = new Image();
    probe.onload = () => {
      preview.src = candidate;
      preview.classList.remove("hidden");
      setText(hint, t(language, "photoHintLoaded"));
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

function openGarage() {
  if (isInPlayState()) {
    return;
  }
  setVisible(elements.menuPanel, false);
  setVisible(elements.resultPanel, false);
  setVisible(elements.carPanel, true);
  loadAvatarPreview();
}

function startMode(mode) {
  game.unlockAudio();
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
  refreshTexts();
  const originalLabel = t(language, "saveNames");
  setText(elements.saveNamesBtn, t(language, "namesSaved"));
  setTimeout(() => setText(elements.saveNamesBtn, originalLabel), 900);
}

elements.languageBtn.addEventListener("click", toggleLanguage);
elements.audioBtn.addEventListener("click", () => {
  game.unlockAudio();
  const muted = game.toggleMuted();
  localStorage.setItem(STORAGE_MUTE_KEY, muted ? "1" : "0");
  refreshTexts();
});
elements.garageBtn.addEventListener("click", openGarage);
elements.startRaceBtn.addEventListener("click", () => startMode("race"));
elements.startLocoBtn.addEventListener("click", () => startMode("loco"));
elements.closeGarageBtn.addEventListener("click", () => {
  setVisible(elements.carPanel, false);
  setVisible(elements.menuPanel, true);
});
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
      if (game.getMode() === "race") {
        if (control === "left") game.moveLane(-1);
        if (control === "right") game.moveLane(1);
        return;
      }
      game.setControl(control, true);
    },
    () => {
      if (game.getMode() === "loco") {
        game.setControl(control, false);
      }
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
  if (game.getMode() === "race") {
    if (event.code === "ArrowLeft") {
      game.moveLane(-1);
      event.preventDefault();
    }
    if (event.code === "ArrowRight") {
      game.moveLane(1);
      event.preventDefault();
    }
    return;
  }
  if (event.code === "ArrowLeft") game.setControl("left", true);
  if (event.code === "ArrowRight") game.setControl("right", true);
  if (event.code === "ArrowUp") game.setControl("up", true);
  if (event.code === "ArrowDown") game.setControl("down", true);
});

document.addEventListener("keyup", (event) => {
  if (game.getMode() !== "loco") {
    return;
  }
  if (event.code === "ArrowLeft") game.setControl("left", false);
  if (event.code === "ArrowRight") game.setControl("right", false);
  if (event.code === "ArrowUp") game.setControl("up", false);
  if (event.code === "ArrowDown") game.setControl("down", false);
});

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
