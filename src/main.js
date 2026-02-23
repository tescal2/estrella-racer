import { EstrellaGame, drawAvatar } from './game.js';
import { loadProfile } from './personalization.js';
import { byId, setVisible, setText, setupHoldButton } from './ui.js';

const MUTE_KEY='estrella-racer-muted',DRIVER_KEY='estrella-racer-driver';
const TILT_OK=typeof window.DeviceOrientationEvent!=='undefined';
const TILT_PERM=TILT_OK&&typeof window.DeviceOrientationEvent.requestPermission==='function';
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

const el={
  canvas:byId('gameCanvas'),muteBtn:byId('muteBtn'),
  menuPanel:byId('menuPanel'),playBtn:byId('playBtn'),
  selectPanel:byId('selectPanel'),
  pickAxel:byId('pickAxel'),pickJade:byId('pickJade'),
  labelAxel:byId('labelAxel'),labelJade:byId('labelJade'),
  avatarAxel:byId('avatarAxel'),avatarJade:byId('avatarJade'),
  avatarAxelImg:byId('avatarAxelImg'),avatarJadeImg:byId('avatarJadeImg'),
  diffEasy:byId('diffEasy'),diffMed:byId('diffMed'),diffHard:byId('diffHard'),
  goRace:byId('goRace'),goLoco:byId('goLoco'),backMenu:byId('backMenu'),
  hud:byId('hud'),hudLives:byId('hudLives'),hudScore:byId('hudScore'),hudFuel:byId('hudFuel'),
  progressBar:byId('progressBar'),hudFlash:byId('hudFlash'),
  pauseBtn:byId('pauseBtn'),exitBtn:byId('exitBtn'),
  controls:byId('controls'),
  ctrlLeft:byId('ctrlLeft'),ctrlUp:byId('ctrlUp'),ctrlDown:byId('ctrlDown'),ctrlRight:byId('ctrlRight'),
  resultPanel:byId('resultPanel'),resultTitle:byId('resultTitle'),resultMsg:byId('resultMsg'),
  resultScore:byId('resultScore'),retryBtn:byId('retryBtn'),backMenuBtn:byId('backMenuBtn')
};

const game=new EstrellaGame(el.canvas);
const profile=loadProfile();
let driverKey=localStorage.getItem(DRIVER_KEY)==='secondary'?'secondary':'primary';
let difficulty='medium',lastMode='race',resultShown=false,tiltEnabled=false,tiltGranted=!TILT_PERM;
game.setProfile(profile);game.setDriverKey(driverKey);game.setMuted(localStorage.getItem(MUTE_KEY)==='1');

const PHOTO_CANDIDATES=[
  'assets/reference/axel-jade/photo.jpg','assets/reference/axel-jade/photo.jpeg','assets/reference/axel-jade/photo.png',
  'assets/reference/axel-jade/IMG_6923.jpg','assets/reference/axel-jade/IMG_6923.jpeg','assets/reference/axel-jade/IMG_6923.png',
  'assets/reference/axel-jade/avatar.jpg','assets/reference/axel-jade/avatar.png'
];
let photoLoaded=false;
function tryLoadPhoto(){
  let idx=0;
  function tryNext(){
    if(idx>=PHOTO_CANDIDATES.length)return;
    const src=PHOTO_CANDIDATES[idx]+'?v='+Date.now();idx++;
    const img=new Image();
    img.onload=function(){
      photoLoaded=true;
      const aw=img.naturalWidth,ah=img.naturalHeight;
      const half=aw/2;
      const jCtx=el.avatarJade.getContext('2d');const dpr=Math.min(window.devicePixelRatio||1,2);
      el.avatarJade.width=160*dpr;el.avatarJade.height=200*dpr;jCtx.setTransform(dpr,0,0,dpr,0,0);
      jCtx.drawImage(img,0,0,half,ah,0,0,160,200);
      const aCtx=el.avatarAxel.getContext('2d');
      el.avatarAxel.width=160*dpr;el.avatarAxel.height=200*dpr;aCtx.setTransform(dpr,0,0,dpr,0,0);
      aCtx.drawImage(img,half,0,half,ah,0,0,160,200);
    };
    img.onerror=tryNext;
    img.src=src;
  }
  tryNext();
}

function drawAvatars(){
  if(photoLoaded)return;
  for(const[cv,isA] of [[el.avatarAxel,true],[el.avatarJade,false]]){
    const ctx=cv.getContext('2d');const dpr=Math.min(window.devicePixelRatio||1,2);
    cv.width=160*dpr;cv.height=200*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,160,200);drawAvatar(ctx,80,85,160,isA);
  }
}

function hideAll(){for(const p of [el.menuPanel,el.selectPanel,el.resultPanel,el.hud,el.controls])setVisible(p,false)}
function showMenu(){game.stopToMenu();resultShown=false;hideAll();setVisible(el.menuPanel,true)}
function showSelect(){hideAll();setVisible(el.selectPanel,true);tryLoadPhoto();drawAvatars();refreshSelect()}
function refreshSelect(){
  el.pickAxel.classList.toggle('active',driverKey==='primary');
  el.pickJade.classList.toggle('active',driverKey==='secondary');
  el.diffEasy.classList.toggle('active',difficulty==='easy');
  el.diffMed.classList.toggle('active',difficulty==='medium');
  el.diffHard.classList.toggle('active',difficulty==='hard');
}
function refreshHud(){
  const s=game.getSnapshot();let h='';for(let i=0;i<s.maxLives;i++)h+=i<s.lives?'\u2764\uFE0F':'\u{1F5A4}';
  setText(el.hudLives,h);setText(el.hudScore,'\u2B50 '+s.score);
  setText(el.hudFuel,'\u26FD '+s.fuel+'%');el.hudFuel.style.color=s.fuel<=20?'#f44':'#7df';
  el.progressBar.style.width=Math.round(s.progress*100)+'%';
  if(s.flashKey){setText(el.hudFlash,s.flashKey);setVisible(el.hudFlash,true)}else setVisible(el.hudFlash,false);
  setText(el.pauseBtn,s.paused?'\u25B6':'\u23F8');
}
function refreshMute(){setText(el.muteBtn,game.muted?'\u{1F507}':'\u{1F50A}')}

async function ensureTilt(){if(!TILT_OK)return;if(!TILT_PERM){tiltEnabled=true;return}if(tiltGranted){tiltEnabled=true;return}try{const r=await window.DeviceOrientationEvent.requestPermission();tiltGranted=r==='granted';tiltEnabled=tiltGranted}catch{tiltEnabled=false}}

async function startGame(mode){game.unlockAudio();await ensureTilt();game.setDriverKey(driverKey);game.setDifficulty(difficulty);game.start(mode);lastMode=mode;resultShown=false;hideAll();setVisible(el.hud,true);setVisible(el.controls,true);refreshHud()}
function showResult(){const r=game.getResult();setText(el.resultTitle,r.t);setText(el.resultMsg,r.m);setText(el.resultScore,'Score: '+r.s);hideAll();setVisible(el.resultPanel,true)}

el.playBtn.addEventListener('click',()=>{game.unlockAudio();showSelect()});
el.pickAxel.addEventListener('click',()=>{driverKey='primary';localStorage.setItem(DRIVER_KEY,'primary');refreshSelect()});
el.pickJade.addEventListener('click',()=>{driverKey='secondary';localStorage.setItem(DRIVER_KEY,'secondary');refreshSelect()});
el.diffEasy.addEventListener('click',()=>{difficulty='easy';refreshSelect()});
el.diffMed.addEventListener('click',()=>{difficulty='medium';refreshSelect()});
el.diffHard.addEventListener('click',()=>{difficulty='hard';refreshSelect()});
el.goRace.addEventListener('click',()=>startGame('race'));
el.goLoco.addEventListener('click',()=>startGame('loco'));
el.backMenu.addEventListener('click',showMenu);
el.pauseBtn.addEventListener('click',()=>{game.togglePause();refreshHud()});
el.exitBtn.addEventListener('click',showMenu);
el.retryBtn.addEventListener('click',()=>startGame(lastMode));
el.backMenuBtn.addEventListener('click',showMenu);
el.muteBtn.addEventListener('click',()=>{game.unlockAudio();const m=game.toggleMuted();localStorage.setItem(MUTE_KEY,m?'1':'0');refreshMute()});

for(const[btn,ctrl] of [[el.ctrlLeft,'left'],[el.ctrlRight,'right'],[el.ctrlUp,'up'],[el.ctrlDown,'down']]){
  setupHoldButton(btn,()=>{game.unlockAudio();if(game.getRunState()!=='playing')return;if(game.getMode()==='race'&&(ctrl==='left'||ctrl==='right'))game.moveLane(ctrl==='left'?-1:1);game.setControl(ctrl,true)},()=>{game.setControl(ctrl,false)})}

el.canvas.addEventListener('pointerdown',(e)=>{if(game.getRunState()!=='playing')return;game.unlockAudio();if(game.getMode()==='race')game.tapAt(e.clientX)},{passive:false});

document.addEventListener('keydown',(e)=>{
  if(e.code==='KeyP'&&(game.getRunState()==='playing'||game.getRunState()==='paused')){game.togglePause();refreshHud();e.preventDefault();return}
  if(e.code==='Escape'){showMenu();return}if(game.getRunState()!=='playing')return;
  if(e.code==='ArrowLeft'){game.moveLane(-1);game.setControl('left',true);e.preventDefault()}
  if(e.code==='ArrowRight'){game.moveLane(1);game.setControl('right',true);e.preventDefault()}
  if(e.code==='ArrowUp'){game.setControl('up',true);e.preventDefault()}
  if(e.code==='ArrowDown'){game.setControl('down',true);e.preventDefault()}});
document.addEventListener('keyup',(e)=>{if(e.code==='ArrowLeft')game.setControl('left',false);if(e.code==='ArrowRight')game.setControl('right',false);if(e.code==='ArrowUp')game.setControl('up',false);if(e.code==='ArrowDown')game.setControl('down',false)});

if(TILT_OK)window.addEventListener('deviceorientation',(e)=>{if(!tiltEnabled||game.getRunState()!=='playing'){game.clearTiltInput();return}game.setTiltInput(clamp((e.gamma??0)/28,-1,1),clamp((15-(e.beta??15))/30,-1,1))});
window.addEventListener('resize',()=>game.resize(window.innerWidth,window.innerHeight));
document.body.addEventListener('touchmove',(e)=>{if(game.getRunState()==='playing'||game.getRunState()==='paused')e.preventDefault()},{passive:false});

function loop(ts){game.frame(ts);const st=game.getRunState();if(st==='playing'||st==='paused'){setVisible(el.hud,true);setVisible(el.controls,st==='playing');refreshHud()}if(st==='gameover'&&!resultShown){resultShown=true;showResult()}requestAnimationFrame(loop)}

refreshMute();setText(el.labelAxel,profile.primaryName);setText(el.labelJade,profile.secondaryName);
showMenu();requestAnimationFrame(loop);