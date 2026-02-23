/* Estrella Racer - Three.js 3D engine v6 */

const LANE_W = 3.2;
const CAR_LEN = 3.8;
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
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.3);
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
  jump(){
    this._play(c=>{
      const o=c.createOscillator(),g=c.createGain();
      o.type="sine";o.frequency.setValueAtTime(200,c.currentTime);
      o.frequency.exponentialRampToValueAtTime(600,c.currentTime+.15);
      g.gain.setValueAtTime(.2,c.currentTime);
      g.gain.exponentialRampToValueAtTime(.01,c.currentTime+.2);
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.2);
    });
  }
  thud(){
    this._play(c=>{
      const o=c.createOscillator(),g=c.createGain();
      o.type="sine";o.frequency.value=50;
      g.gain.setValueAtTime(.5,c.currentTime);
      g.gain.exponentialRampToValueAtTime(.01,c.currentTime+.15);
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.15);
      const buf=c.createBuffer(1,c.sampleRate*.08,c.sampleRate);
      const d=buf.getChannelData(0);
      for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*.3;
      const n=c.createBufferSource(),ng=c.createGain();
      n.buffer=buf;ng.gain.setValueAtTime(.25,c.currentTime);
      ng.gain.exponentialRampToValueAtTime(.01,c.currentTime+.08);
      n.connect(ng);ng.connect(c.destination);n.start();
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
  const bg=ctx.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,"#1a237e"); bg.addColorStop(1,"#0d47a1");
  ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
  const cx=w/2, cy=h*.38;
  const skin = who==="jade" ? "#c8956e" : "#b5845e";
  const hair = who==="jade" ? "#1a1008" : "#0f0a05";
  const hairLen = who==="jade" ? 52 : 18;
  ctx.fillStyle=skin;
  ctx.beginPath(); ctx.ellipse(cx,cy,32,38,0,0,Math.PI*2); ctx.fill();
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
  ctx.fillStyle="#fff";
  ctx.beginPath(); ctx.ellipse(cx-11,cy,7,6,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx+11,cy,7,6,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#2c1810";
  ctx.beginPath(); ctx.arc(cx-10,cy+1,3.5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+12,cy+1,3.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#000";
  ctx.beginPath(); ctx.arc(cx-10,cy+1,1.8,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+12,cy+1,1.8,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=hair; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.moveTo(cx-18,cy-10); ctx.quadraticCurveTo(cx-11,cy-14,cx-4,cy-10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+4,cy-10); ctx.quadraticCurveTo(cx+11,cy-14,cx+18,cy-10); ctx.stroke();
  ctx.strokeStyle=skin; ctx.lineWidth=1.5; ctx.globalAlpha=.6;
  ctx.beginPath(); ctx.moveTo(cx,cy+4); ctx.quadraticCurveTo(cx+4,cy+12,cx,cy+14); ctx.stroke();
  ctx.globalAlpha=1;
  ctx.strokeStyle="#c0604a"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(cx,cy+14,10,0.1*Math.PI,0.9*Math.PI); ctx.stroke();
  ctx.fillStyle=skin; ctx.fillRect(cx-8,cy+34,16,14);
  const shirtColor = who==="jade" ? "#e91e63" : "#1565c0";
  ctx.fillStyle=shirtColor;
  ctx.beginPath();
  ctx.moveTo(cx-36,h); ctx.quadraticCurveTo(cx-36,cy+48,cx-8,cy+48);
  ctx.lineTo(cx+8,cy+48);
  ctx.quadraticCurveTo(cx+36,cy+48,cx+36,h);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle="#ffe14d"; ctx.font="14px sans-serif";
  ctx.fillText("\u2B50",cx-8,cy+68);
}

/* 3D Car builder - more realistic */
function buildCar(color, isPlayer){
  const g = new THREE.Group();
  const col = new THREE.Color(color);
  const mat = new THREE.MeshPhongMaterial({color:col, shininess:80});
  // Lower chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.25, CAR_LEN), new THREE.MeshPhongMaterial({color:0x111111}));
  chassis.position.y = 0.25; g.add(chassis);
  // Main body - tapered with hood and trunk
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, CAR_LEN*0.9), mat);
  body.position.y = 0.65; body.castShadow=true; body.name="body"; g.add(body);
  // Hood (front) - angled
  const hood = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 1.2), mat);
  hood.position.set(0, 0.98, 1.1); hood.rotation.x=-0.1; g.add(hood);
  // Trunk (rear)
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.15, 0.9), mat);
  trunk.position.set(0, 0.92, -1.3); g.add(trunk);
  // Cabin - windshield style
  const cabGeo = new THREE.BoxGeometry(1.8, 0.65, 1.6);
  const cabMat = new THREE.MeshPhongMaterial({color:0x88ccff, transparent:true, opacity:0.5, shininess:100});
  const cab = new THREE.Mesh(cabGeo, cabMat);
  cab.position.set(0, 1.25, -0.1); cab.name="cabin"; g.add(cab);
  // Windshield front (angled)
  const wsGeo = new THREE.PlaneGeometry(1.7, 0.7);
  const wsMat = new THREE.MeshPhongMaterial({color:0xaaddff, transparent:true, opacity:0.4, side:THREE.DoubleSide});
  const ws = new THREE.Mesh(wsGeo, wsMat);
  ws.position.set(0, 1.25, 0.75); ws.rotation.x=0.3; g.add(ws);
  // Fenders over wheels
  const fMat = new THREE.MeshPhongMaterial({color:col.clone().multiplyScalar(0.85)});
  [[-1.15,1],[-1.15,-1],[1.15,1],[1.15,-1]].forEach(p=>{
    const fender = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.9), fMat);
    fender.position.set(p[0], 0.5, p[1]); g.add(fender);
  });
  // Wheels with tires and rims
  const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 16);
  const tireMat = new THREE.MeshPhongMaterial({color:0x1a1a1a});
  const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.30, 12);
  const rimMat = new THREE.MeshPhongMaterial({color:0xcccccc, shininess:100});
  [[-1.15,0.38,1.2],[-1.15,0.38,-1.2],[1.15,0.38,1.2],[1.15,0.38,-1.2]].forEach(p=>{
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.z=Math.PI/2; tire.position.set(p[0],p[1],p[2]); tire.name="wheel"; g.add(tire);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z=Math.PI/2; rim.position.set(p[0],p[1],p[2]); g.add(rim);
  });
  if(isPlayer){
    // Spoiler
    const spPost = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.4,0.08), fMat);
    [-.8,.8].forEach(x=>{ const s=spPost.clone(); s.position.set(x,1.15,-1.6); g.add(s); });
    const spWing = new THREE.Mesh(new THREE.BoxGeometry(2.4,0.06,0.35), fMat);
    spWing.position.set(0,1.38,-1.6); spWing.name="spoiler"; g.add(spWing);
    // Headlights
    const hlGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const hlMat = new THREE.MeshPhongMaterial({color:0xffffcc, emissive:0xffff88, emissiveIntensity:0.9});
    [-0.8,0.8].forEach(x=>{
      const hl = new THREE.Mesh(hlGeo, hlMat);
      hl.position.set(x, 0.65, CAR_LEN/2); hl.name="headlight"; g.add(hl);
    });
    // Taillights
    const tlGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const tlMat = new THREE.MeshPhongMaterial({color:0xff0000, emissive:0xff0000, emissiveIntensity:0.6});
    [-0.8,0.8].forEach(x=>{
      const tl = new THREE.Mesh(tlGeo, tlMat);
      tl.position.set(x, 0.65, -CAR_LEN/2); tl.name="taillight"; g.add(tl);
    });
    // Exhaust pipes
    const exGeo = new THREE.CylinderGeometry(0.06,0.08,0.3,8);
    const exMat = new THREE.MeshPhongMaterial({color:0x666666});
    [-.5,.5].forEach(x=>{
      const ex = new THREE.Mesh(exGeo, exMat);
      ex.rotation.x=Math.PI/2; ex.position.set(x,0.3,-CAR_LEN/2-0.1); g.add(ex);
    });
  }
  return g;
}

/* Enemy car - dark menacing fleet */
function buildEnemyCar(){
  const colors = [0x1a1a2e, 0x16213e, 0x0f3460, 0x2d132c, 0x1b1b2f];
  const c = colors[Math.floor(Math.random()*colors.length)];
  const g = buildCar(c, false);
  const bGeo = new THREE.BoxGeometry(2.4, 0.35, 0.25);
  const bMat = new THREE.MeshPhongMaterial({color:0x444444});
  const bumper = new THREE.Mesh(bGeo, bMat);
  bumper.position.set(0, 0.45, CAR_LEN/2+0.12); g.add(bumper);
  const eGeo = new THREE.SphereGeometry(0.12, 6, 6);
  const eMat = new THREE.MeshPhongMaterial({color:0xff0000, emissive:0xff0000, emissiveIntensity:1});
  [-0.5,0.5].forEach(x=>{
    const e = new THREE.Mesh(eGeo, eMat);
    e.position.set(x, 0.75, CAR_LEN/2+0.05); g.add(e);
  });
  return g;
}
/* 3D Pickups */
function buildGasCan(){
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshPhongMaterial({color:0xd32f2f});
  // Can body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.35), bodyMat);
  body.position.y=0.5; g.add(body);
  // Handle
  const hMat = new THREE.MeshPhongMaterial({color:0x333333});
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.08), hMat);
  handle.position.set(0, 0.95, 0); g.add(handle);
  const hL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.08), hMat);
  hL.position.set(-0.16, 0.85, 0); g.add(hL);
  const hR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.08), hMat);
  hR.position.set(0.16, 0.85, 0); g.add(hR);
  // Nozzle
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.25, 6), hMat);
  nozzle.position.set(0.25, 0.95, 0); nozzle.rotation.z=-0.5; g.add(nozzle);
  // Label
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.25), new THREE.MeshPhongMaterial({color:0xffeb3b}));
  label.position.set(0, 0.5, 0.18); g.add(label);
  g.userData.type = "fuel";
  return g;
}

function buildStarPickup(){
  const g = new THREE.Group();
  const mat = new THREE.MeshPhongMaterial({color:0xffd600, emissive:0xffab00, emissiveIntensity:0.7, shininess:100});
  // 5-point star from merged cones
  for(let i=0;i<5;i++){
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 4), mat);
    const angle = (i/5)*Math.PI*2 - Math.PI/2;
    spike.position.set(Math.cos(angle)*0.25, Math.sin(angle)*0.25 + 0.8, 0);
    spike.rotation.z = angle + Math.PI/2;
    g.add(spike);
  }
  // Center
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), mat);
  center.position.y = 0.8; g.add(center);
  // Glow ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.6, 16),
    new THREE.MeshPhongMaterial({color:0xffe082, emissive:0xffcc02, emissiveIntensity:0.4, transparent:true, opacity:0.5, side:THREE.DoubleSide})
  );
  ring.position.y = 0.8; ring.rotation.x = Math.PI/2; g.add(ring);
  g.userData.type = "star";
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
  const eGeo=new THREE.SphereGeometry(.04,6,6);
  const eMat=new THREE.MeshPhongMaterial({color:0x000000});
  [-.08,.08].forEach(x=>{const e=new THREE.Mesh(eGeo,eMat);e.position.set(x,.92,.38);g.add(e);});
  g.userData.type="chicken"; return g;
}

function buildRamp(){
  const g = new THREE.Group();
  // Ramp body - angled wedge
  const geo=new THREE.BoxGeometry(3,.5,2.5);
  const mat=new THREE.MeshPhongMaterial({color:0xffd600, emissive:0xffa000, emissiveIntensity:.3});
  const m=new THREE.Mesh(geo,mat);
  m.rotation.x=.2; m.position.y=.3; g.add(m);
  // Arrow markings
  const arrowMat = new THREE.MeshPhongMaterial({color:0xff6f00, emissive:0xff6f00, emissiveIntensity:.5});
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 3), arrowMat);
  arrow.position.set(0, 0.7, 0); arrow.rotation.x = -Math.PI/2; g.add(arrow);
  g.userData.type = "ramp";
  return g;
}
/* Willis Tower */
function buildWillisTower(){
  const g=new THREE.Group();
  const mat=new THREE.MeshPhongMaterial({color:0x1a1a2e});
  const base=new THREE.Mesh(new THREE.BoxGeometry(8,35,6),mat);
  base.position.y=17.5;g.add(base);
  const mid=new THREE.Mesh(new THREE.BoxGeometry(6,10,5),mat);
  mid.position.y=40;g.add(mid);
  const top=new THREE.Mesh(new THREE.BoxGeometry(4,8,4),mat);
  top.position.y=49;g.add(top);
  const antMat=new THREE.MeshPhongMaterial({color:0x666666});
  const a1=new THREE.Mesh(new THREE.CylinderGeometry(.12,.1,20,6),antMat);
  a1.position.set(-1,63,0);g.add(a1);
  const a2=new THREE.Mesh(new THREE.CylinderGeometry(.1,.08,16,6),antMat);
  a2.position.set(1,61,0);g.add(a2);
  const blinkMat=new THREE.MeshPhongMaterial({color:0xff0000,emissive:0xff0000,emissiveIntensity:1});
  const b1=new THREE.Mesh(new THREE.SphereGeometry(.2,6,6),blinkMat);
  b1.position.set(-1,73,0);b1.name="blink";g.add(b1);
  const b2=new THREE.Mesh(new THREE.SphereGeometry(.18,6,6),blinkMat);
  b2.position.set(1,69,0);b2.name="blink";g.add(b2);
  const winMat=new THREE.MeshPhongMaterial({color:0xffecb3,emissive:0xffe082,emissiveIntensity:.5,transparent:true,opacity:.6});
  for(let y=3;y<48;y+=3){
    const win=new THREE.Mesh(new THREE.PlaneGeometry(7,.3),winMat);
    win.position.set(0,y,3.01);g.add(win);
  }
  return g;
}

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
    b.position.set(c.x,c.h/2,-250);b.castShadow=true;
    scene.add(b);buildings.push(b);
    for(let y=2;y<c.h-1;y+=2.5){
      const win=new THREE.Mesh(new THREE.PlaneGeometry(c.w-.5,.25),winMat);
      win.position.set(c.x,y,-250+c.d/2+.01);scene.add(win);
    }
  });
  const willis=buildWillisTower();
  willis.position.set(0,0,-260);scene.add(willis);
  return {buildings,willis};
}

/* Road texture */
function makeRoadTexture(){
  const c=document.createElement("canvas");
  c.width=512;c.height=1024;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#2a2a2a";ctx.fillRect(0,0,512,1024);
  for(let i=0;i<3000;i++){
    const v=Math.random()*30+30;
    ctx.fillStyle=`rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random()*512,Math.random()*1024,2,2);
  }
  ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.setLineDash([40,30]);
  [170,340].forEach(x=>{ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1024);ctx.stroke();});
  ctx.strokeStyle="#ff0";ctx.lineWidth=4;ctx.setLineDash([]);
  [30,482].forEach(x=>{ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1024);ctx.stroke();});
  const tex=new THREE.CanvasTexture(c);
  tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(1,12);
  return tex;
}

/* Character silhouette sprite for sky */
function buildSilhouetteSprite(who){
  const cnv = document.createElement("canvas");
  cnv.width = 128; cnv.height = 192;
  const ctx = cnv.getContext("2d");
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  const cx=64, cy=60;
  // Head
  ctx.beginPath(); ctx.ellipse(cx,cy,28,34,0,0,Math.PI*2); ctx.fill();
  // Hair
  if(who==="jade"){
    ctx.beginPath(); ctx.ellipse(cx,cy-10,32,26,0,Math.PI,0); ctx.fill();
    ctx.fillRect(cx-32,cy-10,12,45);
    ctx.fillRect(cx+20,cy-10,12,45);
  } else {
    ctx.beginPath(); ctx.ellipse(cx,cy-14,30,20,0,Math.PI,0); ctx.fill();
  }
  // Body
  ctx.beginPath();
  ctx.moveTo(cx-30,192); ctx.quadraticCurveTo(cx-30,cy+38,cx-8,cy+38);
  ctx.lineTo(cx+8,cy+38);
  ctx.quadraticCurveTo(cx+30,cy+38,cx+30,192);
  ctx.closePath(); ctx.fill();
  const tex = new THREE.CanvasTexture(cnv);
  const mat = new THREE.SpriteMaterial({map:tex, transparent:true});
  const spr = new THREE.Sprite(mat);
  spr.scale.set(12, 18, 1);
  return spr;
}

/* Difficulty configs */
const DIFF = {
  easy:   {speed:0.6, maxSpeed:55, spawnRate:0.015, fuelDrain:0.008, lives:4, lanes:3, goalDist:1500},
  medium: {speed:0.8, maxSpeed:75, spawnRate:0.025, fuelDrain:0.012, lives:3, lanes:4, goalDist:2500},
  hard:   {speed:1.0, maxSpeed:100, spawnRate:0.04, fuelDrain:0.018, lives:3, lanes:5, goalDist:4000}
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
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.004);
    this.camera = new THREE.PerspectiveCamera(65, canvas.width/canvas.height, 0.1, 500);
    this.camera.position.set(0, 6, 12);
    this.camera.lookAt(0, 1, -20);
    // Lights - daylight start
    this.ambLight = new THREE.AmbientLight(0x8899aa, 0.8);
    this.scene.add(this.ambLight);
    this.dirLight = new THREE.DirectionalLight(0xffeedd, 1.4);
    this.dirLight.position.set(10, 30, 20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.set(1024, 1024);
    this.dirLight.shadow.camera.near = 1; this.dirLight.shadow.camera.far = 100;
    this.dirLight.shadow.camera.left = -20; this.dirLight.shadow.camera.right = 20;
    this.dirLight.shadow.camera.top = 20; this.dirLight.shadow.camera.bottom = -20;
    this.scene.add(this.dirLight);
    // Hemisphere light for sky color
    this.hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x1a3a1a, 0.5);
    this.scene.add(this.hemiLight);
    // Stars in sky (hidden at day)
    const starGeo = new THREE.BufferGeometry();
    const starVerts = [];
    for(let i=0;i<500;i++) starVerts.push((Math.random()-.5)*400, Math.random()*100+20, -200-Math.random()*200);
    starGeo.setAttribute("position",new THREE.Float32BufferAttribute(starVerts,3));
    this.starMat = new THREE.PointsMaterial({color:0xffffff,size:.5,transparent:true,opacity:0});
    this.stars = new THREE.Points(starGeo, this.starMat);
    this.scene.add(this.stars);
    // Ground
    const groundGeo = new THREE.PlaneGeometry(200, ROAD_LEN);
    const groundMat = new THREE.MeshPhongMaterial({color:0x2d5a27});
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
    this.pickups = [];
    this.locoObjs = [];
    this.tiltSide = 0;
    this.tiltFwd = 0;
    this.score = 0;
    this.fuel = 100;
    this.lives = 3;
    this.maxLives = 3;
    this.speed = 0;
    this.dist = 0;
    this.goalDist = 2500;
    this.invincible = 0;
    this.spawnCooldown = 0;
    this.damage = 0;
    this.paused = false;
    this.introPhase = 0;
    this.introTimer = 0;
    this._introCars = [];
    this._introLabels = [];
    this.silhouette = null;
    // Jump state
    this.airborne = false;
    this.jumpVelocity = 0;
    this.jumpY = 0;
    // Day/night colors
    this._dayBg = new THREE.Color(0x87CEEB);
    this._sunsetBg = new THREE.Color(0xff7043);
    this._nightBg = new THREE.Color(0x0a0e2a);
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

  /* Day -> sunset -> night transition */
  _updateLighting(progress){
    const p = Math.min(1, progress);
    let bgColor, ambInt, dirInt, fogColor, starOp;
    if(p < 0.4){
      // Day
      const t = p / 0.4;
      bgColor = this._dayBg.clone().lerp(this._sunsetBg, t*0.3);
      ambInt = 0.8 - t*0.15;
      dirInt = 1.4 - t*0.3;
      fogColor = bgColor.clone();
      starOp = 0;
    } else if(p < 0.7){
      // Sunset
      const t = (p-0.4)/0.3;
      bgColor = this._sunsetBg.clone().lerp(this._nightBg, t);
      ambInt = 0.65 - t*0.35;
      dirInt = 1.1 - t*0.7;
      fogColor = bgColor.clone();
      starOp = t*0.5;
    } else {
      // Night
      const t = (p-0.7)/0.3;
      bgColor = this._nightBg.clone();
      ambInt = 0.3;
      dirInt = 0.4;
      fogColor = this._nightBg.clone();
      starOp = 0.5 + t*0.5;
    }
    this.scene.background.copy(bgColor);
    this.scene.fog.color.copy(fogColor);
    this.ambLight.intensity = ambInt;
    this.dirLight.intensity = dirInt;
    this.hemiLight.color.copy(bgColor);
    this.starMat.opacity = starOp;
  }
  /* Intro animation */
  startIntro(){
    this.state = "intro";
    this.introTimer = 0;
    this._introCars.forEach(c=>this.scene.remove(c));
    this._introLabels.forEach(c=>this.scene.remove(c));
    this._introCars = [];
    this._introLabels = [];
    // Reset to day
    this.scene.background.copy(this._dayBg);
    this.scene.fog.color.copy(this._dayBg);
    this.ambLight.intensity = 0.8;
    this.dirLight.intensity = 1.4;
    this.starMat.opacity = 0;
    this.camera.position.set(0, 15, 25);
    this.camera.lookAt(0, 10, -100);
    this.skyline.buildings.forEach(b=>{
      b.userData.targetY = b.position.y;
      b.position.y = -50;
    });
    this.skyline.willis.userData.targetY = 0;
    this.skyline.willis.position.y = -80;
    const carA = buildCar(0xcc0000, true);
    carA.position.set(-8, 0, -30);
    this.scene.add(carA); this._introCars.push(carA);
    const carJ = buildCar(0x6a1b9a, true);
    carJ.position.set(8, 0, -30);
    this.scene.add(carJ); this._introCars.push(carJ);
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
      this.scene.add(spr); this._introLabels.push(spr);
    });
  }

  _updateIntro(dt){
    this.introTimer += dt;
    const t = this.introTimer;
    if(t < 3){
      this.skyline.buildings.forEach((b,i)=>{
        const delay = i * 0.08;
        const p = Math.max(0, Math.min((t-delay)/2, 1));
        const e = 1 - Math.pow(1-p, 3);
        b.position.y = -50 + (b.userData.targetY+50) * e;
      });
      const ease = 1 - Math.pow(1-Math.min(t/2.5,1), 3);
      this.skyline.willis.position.y = -80 + 80 * ease;
    }
    if(t > 1.5 && t < 4){
      const cp = Math.min((t-1.5)/2, 1);
      const ce = 1 - Math.pow(1-cp, 2);
      if(this._introCars[0]) this._introCars[0].position.z = -30 + 25*ce;
      if(this._introCars[1]) this._introCars[1].position.z = -30 + 25*ce;
      if(this._introLabels[0]) this._introLabels[0].position.z = -30 + 25*ce;
      if(this._introLabels[1]) this._introLabels[1].position.z = -30 + 25*ce;
      const bounce = Math.sin(t*6)*0.3;
      if(this._introLabels[0]) this._introLabels[0].position.y = 4 + bounce;
      if(this._introLabels[1]) this._introLabels[1].position.y = 4 + bounce;
    }
    const angle = t * 0.15;
    this.camera.position.x = Math.sin(angle) * 18;
    this.camera.position.z = 20 + Math.cos(angle) * 10;
    this.camera.position.y = 12 + Math.sin(t*0.5)*2;
    this.camera.lookAt(0, 8, -100);
    this.skyline.willis.traverse(c=>{
      if(c.name==="blink") c.material.emissiveIntensity = .5+.5*Math.sin(t*4);
    });
    this.renderer.render(this.scene, this.camera);
  }

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
    this.goalDist = cfg.goalDist;
    this.speed = 30 * cfg.speed;
    this.damage = 0;
    this.invincible = 0;
    this.spawnCooldown = 0;
    this.paused = false;
    this.airborne = false;
    this.jumpVelocity = 0;
    this.jumpY = 0;
    this.state = "playing";
    // Reset lighting to day
    this._updateLighting(0);
    // Clear intro
    this._introCars.forEach(c=>this.scene.remove(c));
    this._introLabels.forEach(c=>this.scene.remove(c));
    this._introCars = []; this._introLabels = [];
    this.skyline.buildings.forEach(b=>{
      if(b.userData.targetY!==undefined) b.position.y = b.userData.targetY;
    });
    this.skyline.willis.position.y = 0;
    // Clear objects
    this.obstacles.forEach(o=>this.scene.remove(o)); this.obstacles = [];
    this.pickups.forEach(r=>this.scene.remove(r)); this.pickups = [];
    this.locoObjs.forEach(o=>this.scene.remove(o)); this.locoObjs = [];
    // Silhouette
    if(this.silhouette) this.scene.remove(this.silhouette);
    this.silhouette = buildSilhouetteSprite(driver);
    this.silhouette.position.set(15, 45, -200);
    this.scene.add(this.silhouette);
    // Player car
    if(this.playerCar) this.scene.remove(this.playerCar);
    const pColor = driver==="axel" ? 0xcc0000 : 0x6a1b9a;
    this.playerCar = buildCar(pColor, true);
    this.playerCar.position.set(0, 0, 0);
    this.scene.add(this.playerCar);
    this.camera.position.set(0, 6, 12);
    this.camera.lookAt(0, 1, -20);
    sfx.init(); sfx.music(); sfx.engine(this.speed);
  }
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
    if(!this.airborne){
      this.playerCar.position.x = Math.max(-halfRoad, Math.min(halfRoad, px + this.tiltSide * dt * 15));
    }
    const speedMod = 1 + this.tiltFwd * 0.3;
    const effectiveSpeed = this.speed * Math.max(0.3, speedMod);
    this.dist += effectiveSpeed * dt;
    this.fuel -= cfg.fuelDrain * dt * effectiveSpeed;
    if(this.fuel <= 0){ this.fuel=0; this._endGame(false,"Out of fuel!"); return; }
    this.roadTex.offset.y -= effectiveSpeed * dt * 0.08;
    // Day/night transition
    this._updateLighting(this.dist / this.goalDist);
    // Jump physics
    if(this.airborne){
      this.jumpVelocity -= 25 * dt;
      this.jumpY += this.jumpVelocity * dt;
      if(this.jumpY <= 0){
        this.jumpY = 0; this.airborne = false;
        this.playerCar.position.y = 0;
        this.playerCar.rotation.x = 0;
        sfx.thud();
      } else {
        this.playerCar.position.y = this.jumpY;
        this.playerCar.rotation.x = -this.jumpVelocity * 0.01;
      }
    }
    // Spawn cooldown
    if(this.spawnCooldown > 0) this.spawnCooldown -= dt;
    // Spawn enemies
    if(this.spawnCooldown <= 0 && Math.random() < cfg.spawnRate){
      const lane = Math.floor(Math.random() * cfg.lanes);
      const enemy = buildEnemyCar();
      enemy.position.set(this._laneX(lane), 0, -ROAD_LEN/2 + Math.random()*50);
      enemy.userData.speed = effectiveSpeed * (0.5 + Math.random()*0.3);
      this.scene.add(enemy); this.obstacles.push(enemy);
    }
    // Spawn ramps
    if(Math.random() < 0.003){
      const ramp = buildRamp();
      const lane = Math.floor(Math.random() * cfg.lanes);
      ramp.position.set(this._laneX(lane), 0, -ROAD_LEN/2);
      this.scene.add(ramp); this.pickups.push(ramp);
    }
    // Spawn fuel cans
    if(Math.random() < 0.004){
      const fuel = buildGasCan();
      const lane = Math.floor(Math.random() * cfg.lanes);
      fuel.position.set(this._laneX(lane), 0, -ROAD_LEN/2);
      this.scene.add(fuel); this.pickups.push(fuel);
    }
    // Spawn stars
    if(Math.random() < 0.006){
      const star = buildStarPickup();
      const lane = Math.floor(Math.random() * cfg.lanes);
      star.position.set(this._laneX(lane), 0, -ROAD_LEN/2);
      this.scene.add(star); this.pickups.push(star);
    }
    // Update enemies
    for(let i=this.obstacles.length-1;i>=0;i--){
      const o=this.obstacles[i];
      o.position.z += (effectiveSpeed - (o.userData.speed||0)) * dt;
      if(o.position.z > 20){this.scene.remove(o);this.obstacles.splice(i,1);continue;}
      if(this.invincible<=0 && !this.airborne){
        const dx=Math.abs(o.position.x-this.playerCar.position.x);
        const dz=Math.abs(o.position.z-this.playerCar.position.z);
        if(dx<1.8 && dz<CAR_LEN){this._crash();break;}
      }
    }
    // Update pickups
    for(let i=this.pickups.length-1;i>=0;i--){
      const r=this.pickups[i];
      r.position.z += effectiveSpeed * dt;
      if(r.userData.type==="star") r.rotation.y += dt*3;
      if(r.userData.type==="fuel") r.rotation.y += dt*1.5;
      if(r.position.z > 15){this.scene.remove(r);this.pickups.splice(i,1);continue;}
      const dx=Math.abs(r.position.x-this.playerCar.position.x);
      const dz=Math.abs(r.position.z-this.playerCar.position.z);
      if(dx<1.8 && dz<2.5){
        const type = r.userData.type;
        if(type==="fuel"){ this.fuel=Math.min(100,this.fuel+25); sfx.boost(); }
        else if(type==="star"){ this.score+=150; sfx.boost(); }
        else if(type==="ramp" && !this.airborne){
          this.airborne = true;
          this.jumpVelocity = 12;
          this.jumpY = 0.1;
          sfx.jump();
          this.speed += 10;
        }
        if(type!=="ramp"){ this.scene.remove(r); this.pickups.splice(i,1); }
      }
    }
    // Invincibility
    if(this.invincible > 0){
      this.invincible -= dt;
      if(this.playerCar) this.playerCar.visible = Math.sin(Date.now()*0.02) > 0;
    } else if(this.playerCar) this.playerCar.visible = true;
    this.score += effectiveSpeed * dt * 0.5;
    sfx.engine(effectiveSpeed);
    // Camera follow
    this.camera.position.x += (this.playerCar.position.x*0.3 - this.camera.position.x)*0.05;
    this.camera.position.y = 6 + this.jumpY * 0.4;
    // Silhouette float
    if(this.silhouette){
      this.silhouette.position.y = 45 + Math.sin(Date.now()*0.001)*3;
    }
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
    this._updateLighting(this.dist / 5000);
    if(this.spawnCooldown > 0) this.spawnCooldown -= dt;
    if(this.spawnCooldown <= 0 && Math.random() < cfg.spawnRate * 0.6){
      const builders = [buildTree, buildHydrant, buildTrashcan, buildCone, buildBarrel, buildChicken];
      const obj = builders[Math.floor(Math.random()*builders.length)]();
      obj.position.set((Math.random()-.5)*ROAD_W, 0, -ROAD_LEN/2+Math.random()*30);
      this.scene.add(obj); this.locoObjs.push(obj);
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
    if(this.silhouette) this.silhouette.position.y = 45 + Math.sin(Date.now()*0.001)*3;
    this.skyline.willis.traverse(c=>{if(c.name==="blink") c.material.emissiveIntensity=.5+.5*Math.sin(Date.now()*.003);});
    this.renderer.render(this.scene, this.camera);
  }

  _crash(){
    sfx.crash();
    this.lives--;
    if(this.lives <= 0){ this._endGame(false,"No lives left!"); return; }
    this.invincible = 3;
    this.spawnCooldown = 3;
    for(let i=this.obstacles.length-1;i>=0;i--){
      const o=this.obstacles[i];
      if(o.position.z < this.playerCar.position.z + 5){
        this.scene.remove(o); this.obstacles.splice(i,1);
      }
    }
    if(this.onCrash) this.onCrash(this.lives);
  }

  _removePart(){
    if(!this.playerCar) return;
    const removable = [];
    this.playerCar.traverse(c=>{
      if(c.name==="spoiler"||c.name==="headlight"||c.name==="cabin"||c.name==="wheel"||c.name==="taillight"){
        if(c.visible) removable.push(c);
      }
    });
    if(removable.length > 0){
      const part = removable[Math.floor(Math.random()*removable.length)];
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

  _endGame(win, msg){
    this.state = "ended";
    sfx.stopEngine(); sfx.stopMusic();
    if(this.silhouette){ this.scene.remove(this.silhouette); this.silhouette = null; }
    if(this.onEnd) this.onEnd(win, msg, Math.floor(this.score));
  }

  renderIdle(){
    // Gentle day scene for menu
    this.scene.background.copy(this._dayBg);
    this.scene.fog.color.copy(this._dayBg);
    this.ambLight.intensity = 0.8;
    this.dirLight.intensity = 1.4;
    this.starMat.opacity = 0;
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