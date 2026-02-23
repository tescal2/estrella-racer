/* Estrella Racer - Main Controller v5 */
import { EstrellaGame, drawAvatar, sfx } from "./game.js";

const $ = id => document.getElementById(id);
const show = (el, v) => { el.classList.toggle("hidden", !v); };

const game = new EstrellaGame($("gameCanvas"));
let currentDriver = "axel";
let currentDiff = "medium";
let animFrame = null;

/* Draw avatars on canvas */
drawAvatar($("avatarAxel"), "axel");
drawAvatar($("avatarJade"), "jade");

/* Menu -> Intro -> Select flow */
$("playBtn").addEventListener("click", () => {
  sfx.init();
  show($("menuPanel"), false);
  show($("selectPanel"), false);
  game.startIntro();
  // After intro, show select panel
  setTimeout(() => {
    show($("selectPanel"), true);
    game.state = "idle";
  }, 4500);
});

/* Driver selection */
$("pickAxel").addEventListener("click", () => {
  currentDriver = "axel";
  $("pickAxel").classList.add("active");
  $("pickJade").classList.remove("active");
});
$("pickJade").addEventListener("click", () => {
  currentDriver = "jade";
  $("pickJade").classList.add("active");
  $("pickAxel").classList.remove("active");
});

/* Difficulty */
document.querySelectorAll(".diffPill").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".diffPill").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentDiff = btn.dataset.d;
  });
});

/* Start game */
function launchGame(mode){
  show($("selectPanel"), false);
  show($("hud"), true);
  show($("resultPanel"), false);
  game.startGame(mode, currentDiff, currentDriver);
  updateHUD();
  if(!animFrame) loop();
}

$("goRace").addEventListener("click", () => launchGame("race"));
$("goLoco").addEventListener("click", () => launchGame("loco"));

/* HUD update */
function updateHUD(){
  const hearts = [];
  for(let i=0;i<game.maxLives;i++) hearts.push(i<game.lives?"\u2764\uFE0F":"\u{1F5A4}");
  $("hudLives").textContent = hearts.join(" ");
  $("hudScore").textContent = "\u2B50 " + Math.floor(game.score);
  $("hudFuel").textContent = "\u26FD " + Math.floor(game.fuel) + "%";
  const pct = Math.min(100, (game.dist / game.goalDist) * 100);
  $("progressBar").style.width = pct + "%";
}

/* Crash callback */
game.onCrash = (livesLeft) => {
  show($("hudFlash"), true);
  $("hudFlash").textContent = "\uD83D\uDCA5 CRASH! Lives: " + livesLeft;
  setTimeout(() => show($("hudFlash"), false), 1500);
};

/* End callback */
game.onEnd = (win, msg, score) => {
  show($("hud"), false);
  show($("resultPanel"), true);
  $("resultTitle").textContent = win ? "\uD83C\uDFC6 Victory!" : "\uD83D\uDCA5 Game Over";
  $("resultMsg").textContent = msg;
  $("resultScore").textContent = "\u2B50 Score: " + score;
};

$("retryBtn").addEventListener("click", () => launchGame(game.mode));
$("backMenuBtn").addEventListener("click", () => backToMenu());
$("backMenu").addEventListener("click", () => backToMenu());
$("exitBtn").addEventListener("click", () => {
  game.state = "idle";
  sfx.stopEngine();
  sfx.stopMusic();
  backToMenu();
});

function backToMenu(){
  show($("menuPanel"), true);
  show($("selectPanel"), false);
  show($("hud"), false);
  show($("resultPanel"), false);
  game.state = "idle";
}

/* Pause */
$("pauseBtn").addEventListener("click", () => {
  const paused = game.togglePause();
  $("pauseBtn").textContent = paused ? "\u25B6\uFE0F" : "\u23F8";
});

/* Mute */
let muted = false;
$("muteBtn").addEventListener("click", () => {
  muted = !muted;
  sfx.muted = muted;
  $("muteBtn").textContent = muted ? "\uD83D\uDD07" : "\uD83D\uDD0A";
  if(muted){ sfx.stopEngine(); sfx.stopMusic(); }
  else if(game.state==="playing"){ sfx.music(); sfx.engine(game.speed); }
});

/* Device tilt - corrected direction */
function handleTilt(e){
  const gamma = e.gamma ?? 0;
  const beta = e.beta ?? 0;
  game.tiltSide = -(gamma) / 25;
  game.tiltFwd = Math.max(-1, Math.min(1, (beta - 40) / 30));
}

// iOS requires permission
if(typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function"){
  document.addEventListener("click", function reqPerm(){
    DeviceOrientationEvent.requestPermission().then(r=>{
      if(r==="granted") window.addEventListener("deviceorientation", handleTilt);
    }).catch(()=>{});
    document.removeEventListener("click", reqPerm);
  }, {once:true});
} else {
  window.addEventListener("deviceorientation", handleTilt);
}

/* Game loop */
let lastTime = 0;
function loop(ts=0){
  animFrame = requestAnimationFrame(loop);
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  if(game.state === "playing"){
    game.update(dt);
    updateHUD();
  } else if(game.state === "intro"){
    game.update(dt);
  } else {
    game.renderIdle();
  }
}
loop();