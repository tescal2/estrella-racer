/* Estrella Racer - Three.js 3D engine v5 */

const LANE_W = 3.2;
const CAR_LEN = 3.5;
const SPAWN_GAP = 28;
const ROAD_W = 22;
const ROAD_LEN = 600;

/* Sound FX via Web Audio API */
class SoundFX {
  constructor(){ this.ctx=null; this.muted=false; }
  init(){ if(!this.ctx) this.ctx=new (window.AudioContext||window.webkitAudioContext)(); }
  _play(fn){ if(this.muted||!this.ctx) return; try{ fn(this.ctx); }catch(e){} }
  crash(){
    this._play(c=>{
      const o=c.createOscillator(),g=c.createGain();
      o.type="sine";o.frequency.value=80;
      g.gain.setValueAtTime(.4,c.currentTime);
      g.gain.exponentialRampToValueAtTime(.01,c.currentTime+.3);
      o.connect(g);g.connect(c.destination);
      o.start();o.stop(c.currentTime+.3);
      const buf=c.createBuffer(1,c.sampleRate*.15,c.sampleRate);
      const d=buf.getChannelData(0);
      for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*.5;
      const n=c.createBufferSource(),ng=c.createGain();
      n.buffer=buf;ng.gain.setValueAtTime(.35,c.currentTime);
      ng.gain.exponentialRampToValueAtTime(.01,c.currentTime+.15);
      n.connect(ng);ng.connect(c.destination);n.start();
    });
  }
  clang(){
    this._play(c=>{
      const o=c.createOscillator(),g=c.createGain();
      o.type="square";o.frequency.value=800;
      o.frequency.exponentialRampToValueAtTime(200,c.currentTime+.2);
      g.gain.setValueAtTime(.2,c.currentTime);
      g.gain.exponentialRampToValueAtTime(.01,c.currentTime+.2);
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.2);
    });
  }
  squawk(){
    this._play(c=>{
      const o=c.createOscillator(),g=c.createGain();
      o.type="sawtooth";o.frequency.setValueAtTime(400,c.currentTime);
      o.frequency.linearRampToValueAtTime(1200,c.currentTime+.08);
      o.frequency.linearRampToValueAtTime(500,c.currentTime+.15);
      g.gain.setValueAtTime(.15,c.currentTime);
      g.gain.exponentialRampToValueAtTime(.01,c.currentTime+.2);
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.2);
    });
  }
  boost(){
    this._play(c=>{
      const o=c.createOscillator(),g=c.createGain();
      o.type="sine";o.frequency.setValueAtTime(300,c.currentTime);
      o.frequency.exponentialRampToValueAtTime(900,c.currentTime+.3);
      g.gain.setValueAtTime(.15,c.currentTime);
      g.gain.exponentialRampToValueAtTime(.01,c.currentTime+.4);
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.4);
    });
  }
  engine(speed){
    if(this.muted||!this.ctx) return;
    if(!this._engOsc){
      this._engOsc=this.ctx.createOscillator();
      this._engGain=this.ctx.createGain();
      this._engOsc.type="sawtooth";
      this._engGain.gain.value=.04;
      this._engOsc.connect(this._engGain);
      this._engGain.connect(this.ctx.destination);
      this._engOsc.start();
    }
    this._engOsc.frequency.value=60+speed*2;
  }
  stopEngine(){
    if(this._engOsc){try{this._engOsc.stop();}catch(e){} this._engOsc=null;this._engGain=null;}
  }
  music(){
    if(this.muted||!this.ctx||this._musicPlaying) return;
    this._musicPlaying=true;
    const play=()=>{
      if(!this._musicPlaying||this.muted) return;
      const notes=[262,294,330,349,392,440,392,349];
      const t=this.ctx.currentTime;
      notes.forEach((f,i)=>{
        const o=this.ctx.createOscillator(),g=this.ctx.createGain();
        o.type="triangle";o.frequency.value=f;
        g.gain.setValueAtTime(.03,t+i*.25);
        g.gain.exponentialRampToValueAtTime(.005,t+i*.25+.2);
        o.connect(g);g.connect(this.ctx.destination);
        o.start(t+i*.25);o.stop(t+i*.25+.25);
      });
      this._musicTimer=setTimeout(play,notes.length*250);
    };
    play();
  }
  stopMusic(){this._musicPlaying=false;clearTimeout(this._musicTimer);}
}

export const sfx = new SoundFX();
/* Avatar drawing */
export function drawAvatar(canvas, who){
  const ctx=canvas.getContext("2d");
  const w=canvas.width, h=canvas.height;
  ctx.clearRect(0,0,w,h);
  // Background gradient
  const bg=ctx.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,"#1a237e"); bg.addColorStop(1,"#0d47a1");
  ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
  const cx=w/2, cy=h*.38;
  // Warm skin tone from photo analysis
  const skin = who==="jade" ? "#c8956e" : "#b5845e";
  const hair = who==="jade" ? "#1a1008" : "#0f0a05";
  const hairLen = who==="jade" ? 52 : 18;
  // Head
  ctx.fillStyle=skin;
  ctx.beginPath(); ctx.ellipse(cx,cy,32,38,0,0,Math.PI*2); ctx.fill();
  // Hair
  ctx.fillStyle=hair;
  if(who==="jade"){
    ctx.beginPath(); ctx.ellipse(cx,cy-12,35,30,0,Math.PI,0); ctx.fill();
    ctx.fillRect(cx-35,cy-12,14,hairLen);
    ctx.fillRect(cx+21,cy-12,14,hairLen);
  } else {
    ctx.beginPath(); ctx.ellipse(cx,cy-16,34,22,0,Math.PI,0); ctx.fill();
    ctx.fillRect(cx-32,cy-16,8,hairLen);
    ctx.fillRect(cx+24,cy-16,8,hairLen);
  }
  // Eyes
  ctx.fillStyle="#fff";
  ctx.beginPath(); ctx.ellipse(cx-11,cy,7,6,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx+11,cy,7,6,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#2c1810";
  ctx.beginPath(); ctx.arc(cx-10,cy+1,3.5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+12,cy+1,3.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#000";
  ctx.beginPath(); ctx.arc(cx-10,cy+1,1.8,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+12,cy+1,1.8,0,Math.PI*2); ctx.fill();
  // Eyebrows
  ctx.strokeStyle=hair; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.moveTo(cx-18,cy-10); ctx.quadraticCurveTo(cx-11,cy-14,cx-4,cy-10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+4,cy-10); ctx.quadraticCurveTo(cx+11,cy-14,cx+18,cy-10); ctx.stroke();
  // Nose
  ctx.strokeStyle=skin; ctx.lineWidth=1.5; ctx.globalAlpha=.6;
  ctx.beginPath(); ctx.moveTo(cx,cy+4); ctx.quadraticCurveTo(cx+4,cy+12,cx,cy+14); ctx.stroke();
  ctx.globalAlpha=1;
  // Smile
  ctx.strokeStyle="#c0604a"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(cx,cy+14,10,0.1*Math.PI,0.9*Math.PI); ctx.stroke();
  // Neck
  ctx.fillStyle=skin;
  ctx.fillRect(cx-8,cy+34,16,14);
  // Body / shirt
  const shirtColor = who==="jade" ? "#e91e63" : "#1565c0";
  ctx.fillStyle=shirtColor;
  ctx.beginPath();
  ctx.moveTo(cx-36,h); ctx.quadraticCurveTo(cx-36,cy+48,cx-8,cy+48);
  ctx.lineTo(cx+8,cy+48);
  ctx.quadraticCurveTo(cx+36,cy+48,cx+36,h);
  ctx.closePath(); ctx.fill();
  // Stars on shirt
  ctx.fillStyle="#ffe14d"; ctx.font="14px sans-serif";
  ctx.fillText("\u2B50",cx-8,cy+68);
}

/* 3D Car builder */
function buildCar(color, isPlayer){
  const g = new THREE.Group();
  // Body
  const bodyGeo = new THREE.BoxGeometry(2.2, 0.8, CAR_LEN);
  const bodyMat = new THREE.MeshPhongMaterial({color:new THREE.Color(color)});
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.6;
  body.castShadow = true;
  body.name = "body";
  g.add(body);
  // Cabin
  const cabGeo = new THREE.BoxGeometry(1.8, 0.7, 1.8);
  const cabMat = new THREE.MeshPhongMaterial({color:0x88ccff, transparent:true, opacity:0.6});
  const cab = new THREE.Mesh(cabGeo, cabMat);
  cab.position.set(0, 1.15, -0.2);
  cab.name = "cabin";
  g.add(cab);
  // Wheels
  const wGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
  const wMat = new THREE.MeshPhongMaterial({color:0x222222});
  const positions = [[-1.15,0.35,1],[-1.15,0.35,-1],[1.15,0.35,1],[1.15,0.35,-1]];
  positions.forEach(p=>{
    const w = new THREE.Mesh(wGeo, wMat);
    w.rotation.z = Math.PI/2;
    w.position.set(p[0],p[1],p[2]);
    w.name = "wheel";
    g.add(w);
    // Hubcap
    const hGeo = new THREE.CircleGeometry(0.2, 8);
    const hMat = new THREE.MeshPhongMaterial({color:0xcccccc});
    const hub = new THREE.Mesh(hGeo, hMat);
    hub.position.set(p[0]+(p[0]>0?0.13:-0.13),p[1],p[2]);
    hub.rotation.y = p[0]>0 ? Math.PI/2 : -Math.PI/2;
    g.add(hub);
  });
  if(isPlayer){
    // Spoiler
    const spGeo = new THREE.BoxGeometry(2.4, 0.08, 0.4);
    const spMat = new THREE.MeshPhongMaterial({color:new THREE.Color(color).multiplyScalar(0.7)});
    const sp = new THREE.Mesh(spGeo, spMat);
    sp.position.set(0, 1.3, -1.5);
    sp.name = "spoiler";
    g.add(sp);
    // Headlights
    const hlGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const hlMat = new THREE.MeshPhongMaterial({color:0xffffaa, emissive:0xffff88, emissiveIntensity:0.8});
    [-0.7,0.7].forEach(x=>{
      const hl = new THREE.Mesh(hlGeo, hlMat);
      hl.position.set(x, 0.65, CAR_LEN/2);
      hl.name = "headlight";
      g.add(hl);
    });
  }
  return g;
}

/* Enemy car - dark fleet style */
function buildEnemyCar(){
  const colors = [0x1a1a2e, 0x16213e, 0x0f3460, 0x2d132c, 0x1b1b2f];
  const c = colors[Math.floor(Math.random()*colors.length)];
  const g = buildCar(c, false);
  // Menacing front bumper
  const bGeo = new THREE.BoxGeometry(2.4, 0.3, 0.2);
  const bMat = new THREE.MeshPhongMaterial({color:0x333333});
  const bumper = new THREE.Mesh(bGeo, bMat);
  bumper.position.set(0, 0.45, CAR_LEN/2+0.1);
  g.add(bumper);
  // Red glow eyes
  const eGeo = new THREE.SphereGeometry(0.1, 6, 6);
  const eMat = new THREE.MeshPhongMaterial({color:0xff0000, emissive:0xff0000, emissiveIntensity:1});
  [-0.5,0.5].forEach(x=>{
    const e = new THREE.Mesh(eGeo, eMat);
    e.position.set(x, 0.75, CAR_LEN/2+0.05);
    g.add(e);
  });
  return g;
}
/* Loco mode objects */
function buildTree(){
  const g=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.2,.3,2,8),new THREE.MeshPhongMaterial({color:0x5d4037}));
  trunk.position.y=1;g.add(trunk);
  const foliage=new THREE.Mesh(new THREE.SphereGeometry(1.2,8,8),new THREE.MeshPhongMaterial({color:0x2e7d32}));
  foliage.position.y=2.5;g.add(foliage);
  g.userData.type="tree"; return g;
}
function buildHydrant(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.25,.3,.8,8),new THREE.MeshPhongMaterial({color:0xd32f2f}));
  body.position.y=.4;g.add(body);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.28,8,8),new THREE.MeshPhongMaterial({color:0xb71c1c}));
  cap.position.y=.85;g.add(cap);
  g.userData.type="hydrant"; return g;
}
function buildTrashcan(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.35,.3,.9,8),new THREE.MeshPhongMaterial({color:0x616161}));
  body.position.y=.45;g.add(body);
  const lid=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.06,8),new THREE.MeshPhongMaterial({color:0x757575}));
  lid.position.y=.93;g.add(lid);
  g.userData.type="trashcan"; return g;
}
function buildCone(){
  const g=new THREE.Group();
  const cone=new THREE.Mesh(new THREE.ConeGeometry(.25,.7,8),new THREE.MeshPhongMaterial({color:0xff6f00}));
  cone.position.y=.35;g.add(cone);
  g.userData.type="cone"; return g;
}
function buildBarrel(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,.8,10),new THREE.MeshPhongMaterial({color:0x4e342e}));
  body.position.y=.4;g.add(body);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.05,10),new THREE.MeshPhongMaterial({color:0x795548}));
  band.position.y=.4;g.add(band);
  g.userData.type="barrel"; return g;
}
function buildChicken(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.SphereGeometry(.35,8,8),new THREE.MeshPhongMaterial({color:0xfff9c4}));
  body.position.y=.5;body.scale.set(1,.9,1.2);g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.18,8,8),new THREE.MeshPhongMaterial({color:0xfff9c4}));
  head.position.set(0,.9,.25);g.add(head);
  const beak=new THREE.Mesh(new THREE.ConeGeometry(.06,.15,6),new THREE.MeshPhongMaterial({color:0xff8f00}));
  beak.position.set(0,.88,.45);beak.rotation.x=-Math.PI/2;g.add(beak);
  const comb=new THREE.Mesh(new THREE.SphereGeometry(.08,6,6),new THREE.MeshPhongMaterial({color:0xd32f2f}));
  comb.position.set(0,1.08,.2);g.add(comb);
  // Eyes
  const eGeo=new THREE.SphereGeometry(.04,6,6);
  const eMat=new THREE.MeshPhongMaterial({color:0x000000});
  [-.08,.08].forEach(x=>{const e=new THREE.Mesh(eGeo,eMat);e.position.set(x,.92,.38);g.add(e);});
  g.userData.type="chicken"; return g;
}

function buildRamp(){
  const geo=new THREE.BoxGeometry(3,.4,2);
  const mat=new THREE.MeshPhongMaterial({color:0xffd600,emissive:0xffa000,emissiveIntensity:.3});
  const m=new THREE.Mesh(geo,mat);
  m.rotation.x=.15;
  m.position.y=.2;
  return m;
}

/* Willis Tower */
function buildWillisTower(){
  const g=new THREE.Group();
  const mat=new THREE.MeshPhongMaterial({color:0x1a1a2e});
  // Main tower - stepped setbacks
  const base=new THREE.Mesh(new THREE.BoxGeometry(8,35,6),mat);
  base.position.y=17.5;g.add(base);
  const mid=new THREE.Mesh(new THREE.BoxGeometry(6,10,5),mat);
  mid.position.y=40;g.add(mid);
  const top=new THREE.Mesh(new THREE.BoxGeometry(4,8,4),mat);
  top.position.y=49;g.add(top);
  // Antennas
  const antMat=new THREE.MeshPhongMaterial({color:0x666666});
  const a1=new THREE.Mesh(new THREE.CylinderGeometry(.12,.1,20,6),antMat);
  a1.position.set(-1,63,0);g.add(a1);
  const a2=new THREE.Mesh(new THREE.CylinderGeometry(.1,.08,16,6),antMat);
  a2.position.set(1,61,0);g.add(a2);
  // Red blinking lights at tips
  const blinkMat=new THREE.MeshPhongMaterial({color:0xff0000,emissive:0xff0000,emissiveIntensity:1});
  const b1=new THREE.Mesh(new THREE.SphereGeometry(.2,6,6),blinkMat);
  b1.position.set(-1,73,0);b1.name="blink";g.add(b1);
  const b2=new THREE.Mesh(new THREE.SphereGeometry(.18,6,6),blinkMat);
  b2.position.set(1,69,0);b2.name="blink";g.add(b2);
  // Window glow strips
  const winMat=new THREE.MeshPhongMaterial({color:0xffecb3,emissive:0xffe082,emissiveIntensity:.5,transparent:true,opacity:.6});
  for(let y=3;y<48;y+=3){
    const win=new THREE.Mesh(new THREE.PlaneGeometry(7,.3),winMat);
    win.position.set(0,y,3.01);g.add(win);
  }
  return g;
}

/* Chicago skyline buildings */
function buildSkyline(scene){
  const buildings=[];
  const configs=[
    {x:-60,w:6,h:25,d:5},{x:-50,w:5,h:18,d:4},{x:-40,w:7,h:30,d:5},
    {x:-30,w:4,h:15,d:4},{x:-20,w:8,h:22,d:6},{x:-12,w:5,h:28,d:5},
    {x:12,w:5,h:20,d:5},{x:20,w:7,h:35,d:6},{x:30,w:4,h:16,d:4},
    {x:40,w:6,h:24,d:5},{x:50,w:5,h:19,d:4},{x:60,w:8,h:27,d:6},
    {x:-55,w:4,h:12,d:3},{x:25,w:3,h:14,d:3},{x:45,w:5,h:21,d:4},{x:-45,w:6,h:17,d:4}
  ];
  const mat=new THREE.MeshPhongMaterial({color:0x0d1b2a});
  const winMat=new THREE.MeshPhongMaterial({color:0xfff8e1,emissive:0xffe082,emissiveIntensity:.3,transparent:true,opacity:.4});
  configs.forEach(c=>{
    const b=new THREE.Mesh(new THREE.BoxGeometry(c.w,c.h,c.d),mat);
    b.position.set(c.x,c.h/2,-250);
    b.castShadow=true;
    scene.add(b);
    buildings.push(b);
    // windows
    for(let y=2;y<c.h-1;y+=2.5){
      const win=new THREE.Mesh(new THREE.PlaneGeometry(c.w-.5,.25),winMat);
      win.position.set(c.x,y,-250+c.d/2+.01);
      scene.add(win);
    }
  });
  // Willis Tower center
  const willis=buildWillisTower();
  willis.position.set(0,0,-260);
  scene.add(willis);
  return {buildings,willis};
}
/* Road texture */
function makeRoadTexture(){
  const c=document.createElement("canvas");
  c.width=512;c.height=1024;
  const ctx=c.getContext("2d");
  // Asphalt
  ctx.fillStyle="#2a2a2a";ctx.fillRect(0,0,512,1024);
  // Add noise for realism
  for(let i=0;i<3000;i++){
    const v=Math.random()*30+30;
    ctx.fillStyle=`rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random()*512,Math.random()*1024,2,2);
  }
  // Lane markings
  ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.setLineDash([40,30]);
  [170,340].forEach(x=>{ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1024);ctx.stroke();});
  // Edge lines
  ctx.strokeStyle="#ff0";ctx.lineWidth=4;ctx.setLineDash([]);
  [30,482].forEach(x=>{ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1024);ctx.stroke();});
  const tex=new THREE.CanvasTexture(c);
  tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(1,12);
  return tex;
}

/* Difficulty configs */
const DIFF = {
  easy:   {speed:0.6, maxSpeed:55, spawnRate:0.015, fuelDrain:0.008, lives:4, lanes:3},
  medium: {speed:0.8, maxSpeed:75, spawnRate:0.025, fuelDrain:0.012, lives:3, lanes:4},
  hard:   {speed:1.0, maxSpeed:100, spawnRate:0.04, fuelDrain:0.018, lives:3, lanes:5}
};

/* ================== MAIN GAME CLASS ================== */
export class EstrellaGame {
  constructor(canvas){
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this._resize();
    window.addEventListener("resize", ()=>this._resize());
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e2a);
    this.scene.fog = new THREE.FogExp2(0x0a0e2a, 0.006);
    // Camera
    this.camera = new THREE.PerspectiveCamera(65, canvas.width/canvas.height, 0.1, 500);
    this.camera.position.set(0, 6, 12);
    this.camera.lookAt(0, 1, -20);
    // Lights
    const amb = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffeedd, 1.2);
    dir.position.set(10, 30, 20);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.near = 1; dir.shadow.camera.far = 100;
    dir.shadow.camera.left = -20; dir.shadow.camera.right = 20;
    dir.shadow.camera.top = 20; dir.shadow.camera.bottom = -20;
    this.scene.add(dir);
    this.dirLight = dir;
    // Stars in sky
    const starGeo = new THREE.BufferGeometry();
    const starVerts = [];
    for(let i=0;i<500;i++){
      starVerts.push((Math.random()-.5)*400, Math.random()*100+20, -200-Math.random()*200);
    }
    starGeo.setAttribute("position",new THREE.Float32BufferAttribute(starVerts,3));
    const starMat = new THREE.PointsMaterial({color:0xffffff,size:.5});
    this.stars = new THREE.Points(starGeo, starMat);
    this.scene.add(this.stars);
    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(200, ROAD_LEN);
    const groundMat = new THREE.MeshPhongMaterial({color:0x1a3a1a});
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI/2;
    this.ground.position.set(0, -0.01, -ROAD_LEN/2);
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    // Road
    this.roadTex = makeRoadTexture();
    const roadGeo = new THREE.PlaneGeometry(ROAD_W, ROAD_LEN);
    const roadMat = new THREE.MeshPhongMaterial({map:this.roadTex});
    this.road = new THREE.Mesh(roadGeo, roadMat);
    this.road.rotation.x = -Math.PI/2;
    this.road.position.set(0, 0, -ROAD_LEN/2);
    this.road.receiveShadow = true;
    this.scene.add(this.road);
    // Skyline
    this.skyline = buildSkyline(this.scene);
    // State
    this.state = "idle";
    this.mode = "race";
    this.diff = "medium";
    this.driver = "axel";
    this.playerCar = null;
    this.obstacles = [];
    this.ramps = [];
    this.locoObjs = [];
    this.tiltSide = 0;
    this.tiltFwd = 0;
    this.score = 0;
    this.fuel = 100;
    this.lives = 3;
    this.maxLives = 3;
    this.speed = 0;
    this.dist = 0;
    this.goalDist = 2000;
    this.invincible = 0;
    this.spawnCooldown = 0;
    this.damage = 0;
    this.paused = false;
    this.introPhase = 0;
    this.introTimer = 0;
    // Intro elements
    this._introCars = [];
    this._introLabels = [];
  }

  _resize(){
    const w=window.innerWidth, h=window.innerHeight;
    this.renderer.setSize(w, h);
    if(this.camera){this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  }

  _laneX(lane){
    const cfg=DIFF[this.diff];
    return (lane - (cfg.lanes-1)/2) * LANE_W;
  }
  /* ── Intro animation ── */
  startIntro(){
    this.state = "intro";
    this.introPhase = 0;
    this.introTimer = 0;
    // Clear any previous intro elements
    this._introCars.forEach(c=>this.scene.remove(c));
    this._introLabels.forEach(c=>this.scene.remove(c));
    this._introCars = [];
    this._introLabels = [];
    // Position camera for cinematic view
    this.camera.position.set(0, 15, 25);
    this.camera.lookAt(0, 10, -100);
    // Set skyline buildings below ground initially
    this.skyline.buildings.forEach(b=>{
      b.userData.targetY = b.position.y;
      b.position.y = -50;
    });
    this.skyline.willis.userData.targetY = 0;
    this.skyline.willis.position.y = -80;
    // Build intro cars that will pull up
    const carA = buildCar(0xcc0000, true);
    carA.position.set(-8, 0, -30);
    this.scene.add(carA);
    this._introCars.push(carA);
    const carJ = buildCar(0x6a1b9a, true);
    carJ.position.set(8, 0, -30);
    this.scene.add(carJ);
    this._introCars.push(carJ);
    // Name labels as sprites
    ["AXEL","JADE"].forEach((name,i)=>{
      const cnv=document.createElement("canvas");
      cnv.width=256;cnv.height=64;
      const ctx=cnv.getContext("2d");
      ctx.fillStyle=i===0?"#ff5252":"#ce93d8";
      ctx.font="bold 40px sans-serif";
      ctx.textAlign="center";
      ctx.fillText(name,128,45);
      const tex=new THREE.CanvasTexture(cnv);
      const mat=new THREE.SpriteMaterial({map:tex,transparent:true});
      const spr=new THREE.Sprite(mat);
      spr.scale.set(4,1,1);
      spr.position.set(i===0?-8:8, 4, -30);
      this.scene.add(spr);
      this._introLabels.push(spr);
    });
  }

  _updateIntro(dt){
    this.introTimer += dt;
    const t = this.introTimer;
    // Phase 0: Buildings rise (0-2s)
    if(t < 3){
      const progress = Math.min(t/2.5, 1);
      const ease = 1 - Math.pow(1-progress, 3);
      this.skyline.buildings.forEach((b,i)=>{
        const delay = i * 0.08;
        const p = Math.max(0, Math.min((t-delay)/2, 1));
        const e = 1 - Math.pow(1-p, 3);
        b.position.y = -50 + (b.userData.targetY+50) * e;
      });
      this.skyline.willis.position.y = -80 + 80 * ease;
    }
    // Phase 1: Cars pull up (2-4s)
    if(t > 1.5 && t < 4){
      const cp = Math.min((t-1.5)/2, 1);
      const ce = 1 - Math.pow(1-cp, 2);
      if(this._introCars[0]) this._introCars[0].position.z = -30 + 25*ce;
      if(this._introCars[1]) this._introCars[1].position.z = -30 + 25*ce;
      if(this._introLabels[0]) this._introLabels[0].position.z = -30 + 25*ce;
      if(this._introLabels[1]) this._introLabels[1].position.z = -30 + 25*ce;
      // Bounce labels
      const bounce = Math.sin(t*6)*0.3;
      if(this._introLabels[0]) this._introLabels[0].position.y = 4 + bounce;
      if(this._introLabels[1]) this._introLabels[1].position.y = 4 + bounce;
    }
    // Camera slowly orbits
    const angle = t * 0.15;
    this.camera.position.x = Math.sin(angle) * 18;
    this.camera.position.z = 20 + Math.cos(angle) * 10;
    this.camera.position.y = 12 + Math.sin(t*0.5)*2;
    this.camera.lookAt(0, 8, -100);
    // Blink Willis lights
    this.skyline.willis.traverse(c=>{
      if(c.name==="blink") c.material.emissiveIntensity = .5+.5*Math.sin(t*4);
    });
    this.renderer.render(this.scene, this.camera);
  }

  /* Start a game */
  startGame(mode, diff, driver){
    this.mode = mode;
    this.diff = diff;
    this.driver = driver;
    const cfg = DIFF[diff];
    this.lives = cfg.lives;
    this.maxLives = cfg.lives;
    this.fuel = 100;
    this.score = 0;
    this.dist = 0;
    this.speed = 30 * cfg.speed;
    this.damage = 0;
    this.invincible = 0;
    this.spawnCooldown = 0;
    this.paused = false;
    this.state = "playing";
    // Clear intro elements
    this._introCars.forEach(c=>this.scene.remove(c));
    this._introLabels.forEach(c=>this.scene.remove(c));
    this._introCars = [];
    this._introLabels = [];
    // Restore skyline positions
    this.skyline.buildings.forEach(b=>{
      if(b.userData.targetY!==undefined) b.position.y = b.userData.targetY;
    });
    this.skyline.willis.position.y = 0;
    // Clear obstacles
    this.obstacles.forEach(o=>this.scene.remove(o));
    this.obstacles = [];
    this.ramps.forEach(r=>this.scene.remove(r));
    this.ramps = [];
    this.locoObjs.forEach(o=>this.scene.remove(o));
    this.locoObjs = [];
    // Player car
    if(this.playerCar) this.scene.remove(this.playerCar);
    const pColor = driver==="axel" ? 0xcc0000 : 0x6a1b9a;
    this.playerCar = buildCar(pColor, true);
    this.playerCar.position.set(0, 0, 0);
    this.scene.add(this.playerCar);
    // Camera for gameplay
    this.camera.position.set(0, 6, 12);
    this.camera.lookAt(0, 1, -20);
    // Start music + engine
    sfx.init();
    sfx.music();
    sfx.engine(this.speed);
  }
  /* Update loop */
  update(dt){
    if(this.state==="intro"){this._updateIntro(dt);return;}
    if(this.state!=="playing"||this.paused) return;
    if(this.mode==="race") this._updateRace(dt);
    else this._updateLoco(dt);
  }

  _updateRace(dt){
    const cfg = DIFF[this.diff];
    if(this.speed < cfg.maxSpeed) this.speed += dt * 2 * cfg.speed;
    const px = this.playerCar.position.x;
    const halfRoad = (cfg.lanes * LANE_W) / 2;
    this.playerCar.position.x = Math.max(-halfRoad, Math.min(halfRoad, px + this.tiltSide * dt * 15));
    const speedMod = 1 + this.tiltFwd * 0.3;
    const effectiveSpeed = this.speed * Math.max(0.3, speedMod);
    this.dist += effectiveSpeed * dt;
    this.fuel -= cfg.fuelDrain * dt * effectiveSpeed;
    if(this.fuel <= 0){ this.fuel=0; this._endGame(false,"Out of fuel!"); return; }
    this.roadTex.offset.y -= effectiveSpeed * dt * 0.08;
    if(this.spawnCooldown > 0) this.spawnCooldown -= dt;
    if(this.spawnCooldown <= 0 && Math.random() < cfg.spawnRate){
      const lane = Math.floor(Math.random() * cfg.lanes);
      const enemy = buildEnemyCar();
      enemy.position.set(this._laneX(lane), 0, -ROAD_LEN/2 + Math.random()*50);
      enemy.userData.speed = effectiveSpeed * (0.5 + Math.random()*0.3);
      this.scene.add(enemy);
      this.obstacles.push(enemy);
    }
    if(Math.random() < 0.003){
      const ramp = buildRamp();
      const lane = Math.floor(Math.random() * cfg.lanes);
      ramp.position.set(this._laneX(lane), 0, -ROAD_LEN/2);
      this.scene.add(ramp);
      this.ramps.push(ramp);
    }
    if(Math.random() < 0.005){
      const fuelGeo = new THREE.SphereGeometry(0.4, 8, 8);
      const fuelMat = new THREE.MeshPhongMaterial({color:0x00e676, emissive:0x00c853, emissiveIntensity:0.5});
      const fuelOrb = new THREE.Mesh(fuelGeo, fuelMat);
      const lane = Math.floor(Math.random() * cfg.lanes);
      fuelOrb.position.set(this._laneX(lane), 1, -ROAD_LEN/2);
      fuelOrb.userData.type = "fuel";
      this.scene.add(fuelOrb);
      this.ramps.push(fuelOrb);
    }
    if(Math.random() < 0.008){
      const starGeo = new THREE.OctahedronGeometry(0.4, 0);
      const starMat = new THREE.MeshPhongMaterial({color:0xffd600, emissive:0xffab00, emissiveIntensity:0.6});
      const star = new THREE.Mesh(starGeo, starMat);
      const lane = Math.floor(Math.random() * cfg.lanes);
      star.position.set(this._laneX(lane), 1.2, -ROAD_LEN/2);
      star.userData.type = "star";
      this.scene.add(star);
      this.ramps.push(star);
    }
    for(let i=this.obstacles.length-1;i>=0;i--){
      const o=this.obstacles[i];
      o.position.z += (effectiveSpeed - (o.userData.speed||0)) * dt;
      if(o.position.z > 20){this.scene.remove(o);this.obstacles.splice(i,1);continue;}
      if(this.invincible<=0){
        const dx=Math.abs(o.position.x-this.playerCar.position.x);
        const dz=Math.abs(o.position.z-this.playerCar.position.z);
        if(dx<1.8 && dz<CAR_LEN){this._crash();break;}
      }
    }
    for(let i=this.ramps.length-1;i>=0;i--){
      const r=this.ramps[i];
      r.position.z += effectiveSpeed * dt;
      if(r.userData.type==="star") r.rotation.y += dt*3;
      if(r.userData.type==="fuel") r.rotation.y += dt*2;
      if(r.position.z > 15){this.scene.remove(r);this.ramps.splice(i,1);continue;}
      const dx=Math.abs(r.position.x-this.playerCar.position.x);
      const dz=Math.abs(r.position.z-this.playerCar.position.z);
      if(dx<1.5 && dz<2){
        if(r.userData.type==="fuel"){ this.fuel=Math.min(100,this.fuel+25); sfx.boost(); }
        else if(r.userData.type==="star"){ this.score+=100; sfx.boost(); }
        else { this.speed+=15; sfx.boost(); setTimeout(()=>{ if(this.state==="playing") this.speed=Math.max(30,this.speed-15); },2000); }
        this.scene.remove(r);this.ramps.splice(i,1);
      }
    }
    if(this.invincible > 0){
      this.invincible -= dt;
      if(this.playerCar) this.playerCar.visible = Math.sin(Date.now()*0.02) > 0;
    } else if(this.playerCar) this.playerCar.visible = true;
    this.score += effectiveSpeed * dt * 0.5;
    sfx.engine(effectiveSpeed);
    this.camera.position.x += (this.playerCar.position.x*0.3 - this.camera.position.x)*0.05;
    if(this.dist >= this.goalDist){this._endGame(true,"Race Complete!");}
    const now = Date.now();
    this.skyline.willis.traverse(c=>{if(c.name==="blink") c.material.emissiveIntensity=.5+.5*Math.sin(now*.003);});
    this.renderer.render(this.scene, this.camera);
  }

  _updateLoco(dt){
    const cfg = DIFF[this.diff];
    this.speed = 40 * cfg.speed;
    const px = this.playerCar.position.x;
    this.playerCar.position.x = Math.max(-15, Math.min(15, px + this.tiltSide * dt * 18));
    const speedMod = 1 + this.tiltFwd * 0.3;
    const effectiveSpeed = this.speed * Math.max(0.3, speedMod);
    this.roadTex.offset.y -= effectiveSpeed * dt * 0.08;
    this.dist += effectiveSpeed * dt;
    this.score += effectiveSpeed * dt * 0.3;
    if(this.spawnCooldown > 0) this.spawnCooldown -= dt;
    if(this.spawnCooldown <= 0 && Math.random() < cfg.spawnRate * 0.6){
      const builders = [buildTree, buildHydrant, buildTrashcan, buildCone, buildBarrel, buildChicken];
      const obj = builders[Math.floor(Math.random()*builders.length)]();
      obj.position.set((Math.random()-.5)*ROAD_W, 0, -ROAD_LEN/2+Math.random()*30);
      this.scene.add(obj);
      this.locoObjs.push(obj);
    }
    for(let i=this.locoObjs.length-1;i>=0;i--){
      const o=this.locoObjs[i];
      o.position.z += effectiveSpeed * dt;
      if(o.position.z > 20){this.scene.remove(o);this.locoObjs.splice(i,1);continue;}
      if(this.invincible<=0){
        const dx=Math.abs(o.position.x-this.playerCar.position.x);
        const dz=Math.abs(o.position.z-this.playerCar.position.z);
        if(dx<1.5 && dz<2){
          const type = o.userData.type||"cone";
          if(type==="chicken") sfx.squawk();
          else if(type==="hydrant"||type==="barrel") sfx.clang();
          else sfx.crash();
          this.score += 200;
          this.damage++;
          this._removePart();
          this.scene.remove(o);this.locoObjs.splice(i,1);
          this.invincible = 0.5;
          if(this.damage >= 10){ this._endGame(false,"Car destroyed!"); return; }
        }
      }
    }
    if(this.invincible>0){
      this.invincible-=dt;
      if(this.playerCar) this.playerCar.visible=Math.sin(Date.now()*.02)>0;
    } else if(this.playerCar) this.playerCar.visible=true;
    sfx.engine(effectiveSpeed);
    this.camera.position.x += (this.playerCar.position.x*0.3 - this.camera.position.x)*0.05;
    this.skyline.willis.traverse(c=>{if(c.name==="blink") c.material.emissiveIntensity=.5+.5*Math.sin(Date.now()*.003);});
    this.renderer.render(this.scene, this.camera);
  }
  /* Crash handler */
  _crash(){
    sfx.crash();
    this.lives--;
    if(this.lives <= 0){ this._endGame(false,"No lives left!"); return; }
    this.invincible = 3;
    this.spawnCooldown = 3;
    // Clear obstacles ahead (300 units)
    for(let i=this.obstacles.length-1;i>=0;i--){
      const o=this.obstacles[i];
      if(o.position.z < this.playerCar.position.z + 5){
        this.scene.remove(o);
        this.obstacles.splice(i,1);
      }
    }
    // Flash HUD
    if(this.onCrash) this.onCrash(this.lives);
  }

  /* Remove car part for Loco damage */
  _removePart(){
    if(!this.playerCar) return;
    const removable = [];
    this.playerCar.traverse(c=>{
      if(c.name==="spoiler"||c.name==="headlight"||c.name==="cabin"||c.name==="wheel"||c.name==="hubcap"){
        if(c.visible) removable.push(c);
      }
    });
    if(removable.length > 0){
      const part = removable[Math.floor(Math.random()*removable.length)];
      // Animate part flying off
      const flyPart = part.clone();
      flyPart.position.copy(this.playerCar.position);
      flyPart.position.y += 1;
      this.scene.add(flyPart);
      part.visible = false;
      let t = 0;
      const anim = ()=>{
        t += 0.016;
        flyPart.position.y += 3 * 0.016;
        flyPart.position.x += (Math.random()-.5)*0.3;
        flyPart.rotation.x += 0.2;
        flyPart.rotation.z += 0.15;
        if(t < 1) requestAnimationFrame(anim);
        else this.scene.remove(flyPart);
      };
      anim();
    }
  }

  /* End game */
  _endGame(win, msg){
    this.state = "ended";
    sfx.stopEngine();
    sfx.stopMusic();
    if(this.onEnd) this.onEnd(win, msg, Math.floor(this.score));
  }

  /* Idle render for menus */
  renderIdle(){
    this.camera.position.set(0, 15, 25);
    this.camera.lookAt(0, 10, -100);
    const t = Date.now() * 0.001;
    this.camera.position.x = Math.sin(t*0.1)*5;
    this.skyline.willis.traverse(c=>{
      if(c.name==="blink") c.material.emissiveIntensity=.5+.5*Math.sin(t*4);
    });
    this.renderer.render(this.scene, this.camera);
  }

  togglePause(){ this.paused = !this.paused; return this.paused; }
}