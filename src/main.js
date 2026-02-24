/* Estrella Racer - Main Controller v8 */
import { EstrellaGame, drawAvatar, sfx, getSave, buyCar, GOLDEN_PRICE, LEVELS } from "./game.js";

const $ = id => document.getElementById(id);
const show = (el, v) => { el.classList.toggle("hidden", !v); };

const game = new EstrellaGame($("gameCanvas"));
let currentDriver = "axel";
let currentDiff = "medium";
let currentLevel = 1;
let useGolden = false;
let animFrame = null;

/* Draw canvas avatars as fallback */
drawAvatar($("avatarAxel"), "axel");
drawAvatar($("avatarJade"), "jade");

/* Try loading actual photo */
(function tryLoadPhoto(){
  const candidates = [
    "./assets/reference/axel-jade/photo.jpg",
    "./assets/reference/axel-jade/IMG_6923.jpg"
  ];
  let loaded = false;
  candidates.forEach(src => {
    if(loaded) return;
    const img = new Image();
    img.onload = () => {
      if(loaded) return;
      loaded = true;
      const half = img.width / 2;
      [["avatarJade", 0], ["avatarAxel", half]].forEach(([id, sx]) => {
        const cnv = $(id);
        const ctx = cnv.getContext("2d");
        const aspect = cnv.height / cnv.width;
        const sw = half;
        const sh = sw * aspect;
        const sy = Math.max(0, (img.height - sh) / 3);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cnv.width, cnv.height);
      });
    };
    img.onerror = () => {};
    img.src = src + "?t=" + Date.now();
  });
})();

/* Update coin display and level/golden car state */
function updateShopUI(){
  const save = getSave();
  $("coinDisplay").textContent = "\uD83E\uDE99 " + save.coins;
  // Golden car buttons
  ["axel","jade"].forEach(who=>{
    const btn=$("golden"+who.charAt(0).toUpperCase()+who.slice(1));
    if(!btn) return;
    if(save.golden[who]){
      btn.textContent="\uD83C\uDFC6 Gold "+who.charAt(0).toUpperCase()+who.slice(1);
      btn.classList.add("unlocked");
      btn.disabled=false;
    } else {
      btn.textContent="\uD83D\uDD12 "+GOLDEN_PRICE+" \uD83E\uDE99";
      btn.classList.remove("unlocked");
      btn.disabled=save.coins<GOLDEN_PRICE;
    }
  });
  // Level buttons
  for(let i=1;i<=LEVELS.length;i++){
    const btn=$("level"+i);
    if(!btn) continue;
    if(i<=save.levelsUnlocked){
      btn.disabled=false;
      btn.classList.toggle("active",i===currentLevel);
    } else {
      btn.disabled=true;
      btn.classList.remove("active");
    }
  }
}

/* Menu -> Intro -> Select flow */
$("playBtn").addEventListener("click", () => {
  sfx.init();
  show($("menuPanel"), false);
  show($("selectPanel"), false);
  game.startIntro();
  setTimeout(() => {
    show($("selectPanel"), true);
    game.state = "idle";
    updateShopUI();
  }, 4500);
});

/* Driver selection */
$("pickAxel").addEventListener("click", () => {
  currentDriver = "axel";
  useGolden = false;
  $("pickAxel").classList.add("active");
  $("pickJade").classList.remove("active");
  updateShopUI();
});
$("pickJade").addEventListener("click", () => {
  currentDriver = "jade";
  useGolden = false;
  $("pickJade").classList.add("active");
  $("pickAxel").classList.remove("active");
  updateShopUI();
});

/* Golden car buy/select */
$("goldenAxel").addEventListener("click",()=>{
  const save=getSave();
  if(save.golden.axel){useGolden=true;currentDriver="axel";$("pickAxel").classList.add("active");$("pickJade").classList.remove("active");}
  else if(buyCar("axel")){useGolden=true;currentDriver="axel";$("pickAxel").classList.add("active");$("pickJade").classList.remove("active");}
  updateShopUI();
});
$("goldenJade").addEventListener("click",()=>{
  const save=getSave();
  if(save.golden.jade){useGolden=true;currentDriver="jade";$("pickJade").classList.add("active");$("pickAxel").classList.remove("active");}
  else if(buyCar("jade")){useGolden=true;currentDriver="jade";$("pickJade").classList.add("active");$("pickAxel").classList.remove("active");}
  updateShopUI();
});

/* Level selection */
for(let i=1;i<=3;i++){
  $("level"+i).addEventListener("click",()=>{
    const save=getSave();
    if(i<=save.levelsUnlocked){currentLevel=i;updateShopUI();}
  });
}

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
  game.startGame(mode, currentDiff, currentDriver, {golden:useGolden, level:currentLevel});
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
  const pct = Math.min(100, (game.dist / game.goalDist) * 100);
  const path = $("progressPath");
  if(path){
    const len = path.getTotalLength ? path.getTotalLength() : 400;
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len * (1 - pct/100);
    const dot = $("progressDot");
    if(dot && path.getPointAtLength){
      const pt = path.getPointAtLength(len * pct/100);
      dot.setAttribute("cx", pt.x);
      dot.setAttribute("cy", pt.y);
    }
  }
  const label = $("progressLabel");
  if(label) label.textContent = Math.floor(pct) + "%";
}

/* Crash callback */
game.onCrash = (livesLeft) => {
  show($("hudFlash"), true);
  $("hudFlash").textContent = "\uD83D\uDCA5 CRASH! Lives: " + livesLeft;
  setTimeout(() => show($("hudFlash"), false), 1500);
};

/* End callback */
game.onEnd = (win, msg, score, coins, save) => {
  show($("hud"), false);
  show($("resultPanel"), true);
  $("resultTitle").textContent = win ? "\uD83C\uDFC6 Victory!" : "\uD83D\uDCA5 Game Over";
  let resultMsg = msg;
  if(coins) resultMsg += "\n\uD83E\uDE99 +" + coins + " coins earned!";
  if(win && save){
    const coinsToGold = GOLDEN_PRICE - save.coins;
    if(coinsToGold>0 && (!save.golden.axel||!save.golden.jade)){
      resultMsg += "\n\uD83D\uDD12 " + coinsToGold + " more coins for Golden Car!";
    }
    if(save.levelsUnlocked>currentLevel){
      resultMsg += "\n\u2728 Level " + (currentLevel+1) + " Unlocked!";
    }
  }
  $("resultMsg").textContent = resultMsg;
  $("resultScore").textContent = "\u2B50 Score: " + score + "  \uD83E\uDE99 Bank: " + (save?save.coins:0);
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

/* Device tilt */
function handleTilt(e){
  const gamma = e.gamma ?? 0;
  const beta = e.beta ?? 0;
  game.tiltSide = (gamma) / 25;
  game.tiltFwd = Math.max(-1, Math.min(1, (beta - 40) / 30));
}
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
  } else if(game.state === "intro" || game.state === "victory" || game.state === "crashing"){
    game.update(dt);
  } else {
    game.renderIdle();
  }
}
loop();