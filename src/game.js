/* Estrella Racer - Three.js 3D engine v7 */

const LANE_W = 3.2;
const CAR_LEN = 3.8;
const ROAD_W = 22;
const ROAD_LEN = 700;
const ROAD_BEHIND = 120;

/* Sound FX */
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
      g.gain.setValueAtTime(.2,c.currentTime);g.gain.exponentialRampToValueAtTime(.01,c.currentTime+.2);
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.2);
    });
  }
  squawk(){
    this._play(c=>{
      const o=c.createOscillator(),g=c.createGain();
      o.type="sawtooth";o.frequency.setValueAtTime(400,c.currentTime);
      o.frequency.linearRampToValueAtTime(1200,c.currentTime+.08);
      o.frequency.linearRampToValueAtTime(500,c.currentTime+.15);
      g.gain.setValueAtTime(.15,c.currentTime);g.gain.exponentialRampToValueAtTime(.01,c.currentTime+.2);
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.2);
    });
  }
  boost(){
    this._play(c=>{
      const o=c.createOscillator(),g=c.createGain();
      o.type="sine";o.frequency.setValueAtTime(300,c.currentTime);
      o.frequency.exponentialRampToValueAtTime(900,c.currentTime+.3);
      g.gain.setValueAtTime(.15,c.currentTime);g.gain.exponentialRampToValueAtTime(.01,c.currentTime+.4);
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.4);
    });
  }
  jump(){
    this._play(c=>{
      const o=c.createOscillator(),g=c.createGain();
      o.type="sine";o.frequency.setValueAtTime(200,c.currentTime);
      o.frequency.exponentialRampToValueAtTime(600,c.currentTime+.15);
      g.gain.setValueAtTime(.2,c.currentTime);g.gain.exponentialRampToValueAtTime(.01,c.currentTime+.2);
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.2);
    });
  }
  thud(){
    this._play(c=>{
      const o=c.createOscillator(),g=c.createGain();
      o.type="sine";o.frequency.value=50;
      g.gain.setValueAtTime(.5,c.currentTime);g.gain.exponentialRampToValueAtTime(.01,c.currentTime+.15);
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.15);
      const buf=c.createBuffer(1,c.sampleRate*.08,c.sampleRate);
      const d=buf.getChannelData(0);for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*.3;
      const n=c.createBufferSource(),ng=c.createGain();
      n.buffer=buf;ng.gain.setValueAtTime(.25,c.currentTime);ng.gain.exponentialRampToValueAtTime(.01,c.currentTime+.08);
      n.connect(ng);ng.connect(c.destination);n.start();
    });
  }
  engine(speed){
    if(this.muted||!this.ctx) return;
    if(!this._engOsc){
      this._engOsc=this.ctx.createOscillator();this._engGain=this.ctx.createGain();
      this._engOsc.type="sawtooth";this._engGain.gain.value=.04;
      this._engOsc.connect(this._engGain);this._engGain.connect(this.ctx.destination);this._engOsc.start();
    }
    this._engOsc.frequency.value=60+speed*2;
  }
  stopEngine(){ if(this._engOsc){try{this._engOsc.stop();}catch(e){} this._engOsc=null;this._engGain=null;} }
  music(){
    if(this.muted||!this.ctx||this._musicPlaying) return;
    this._musicPlaying=true;
    const play=()=>{
      if(!this._musicPlaying||this.muted) return;
      const notes=[262,294,330,349,392,440,392,349];const t=this.ctx.currentTime;
      notes.forEach((f,i)=>{
        const o=this.ctx.createOscillator(),g=this.ctx.createGain();
        o.type="triangle";o.frequency.value=f;
        g.gain.setValueAtTime(.03,t+i*.25);g.gain.exponentialRampToValueAtTime(.005,t+i*.25+.2);
        o.connect(g);g.connect(this.ctx.destination);o.start(t+i*.25);o.stop(t+i*.25+.25);
      });
      this._musicTimer=setTimeout(play,notes.length*250);
    };play();
  }
  stopMusic(){this._musicPlaying=false;clearTimeout(this._musicTimer);}
}
export const sfx = new SoundFX();
/* Avatar drawing - detailed */
export function drawAvatar(canvas, who){
  const ctx=canvas.getContext("2d");
  const w=canvas.width, h=canvas.height;
  ctx.clearRect(0,0,w,h);
  const bg=ctx.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,"#1a237e");bg.addColorStop(1,"#0d47a1");
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  const cx=w/2, cy=h*.35;
  const skin = who==="jade" ? "#c8956e" : "#b5845e";
  const skinShadow = who==="jade" ? "#a87850" : "#96704a";
  const hair = who==="jade" ? "#1a1008" : "#0f0a05";
  const hairHi = who==="jade" ? "#3a2818" : "#2a1a0a";
  // Face shape with jaw
  ctx.fillStyle=skin;
  ctx.beginPath();ctx.ellipse(cx,cy-2,30,36,0,0,Math.PI*2);ctx.fill();
  // Jaw/chin
  ctx.beginPath();ctx.moveTo(cx-22,cy+10);ctx.quadraticCurveTo(cx,cy+42,cx+22,cy+10);ctx.fill();
  // Face shading
  const faceShade=ctx.createRadialGradient(cx-5,cy-8,5,cx,cy,35);
  faceShade.addColorStop(0,"rgba(255,255,255,0.08)");faceShade.addColorStop(1,"rgba(0,0,0,0.12)");
  ctx.fillStyle=faceShade;ctx.beginPath();ctx.ellipse(cx,cy-2,30,36,0,0,Math.PI*2);ctx.fill();
  // Ears
  ctx.fillStyle=skinShadow;
  ctx.beginPath();ctx.ellipse(cx-30,cy+2,6,9,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+30,cy+2,6,9,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=skin;
  ctx.beginPath();ctx.ellipse(cx-29,cy+2,4,7,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+29,cy+2,4,7,0,0,Math.PI*2);ctx.fill();
  // Hair
  const hairGrad=ctx.createLinearGradient(cx-35,cy-40,cx+35,cy);
  hairGrad.addColorStop(0,hairHi);hairGrad.addColorStop(1,hair);
  ctx.fillStyle=hairGrad;
  if(who==="jade"){
    ctx.beginPath();ctx.ellipse(cx,cy-14,34,28,0,Math.PI,0);ctx.fill();
    // Long flowing hair
    ctx.fillRect(cx-34,cy-14,13,55);
    ctx.fillRect(cx+21,cy-14,13,55);
    // Hair shine
    ctx.fillStyle="rgba(255,255,255,0.06)";
    ctx.fillRect(cx-10,cy-38,8,20);
  } else {
    ctx.beginPath();ctx.ellipse(cx,cy-18,33,22,0,Math.PI,0);ctx.fill();
    ctx.fillRect(cx-31,cy-18,7,16);ctx.fillRect(cx+24,cy-18,7,16);
    ctx.fillStyle="rgba(255,255,255,0.06)";
    ctx.fillRect(cx-8,cy-36,6,14);
  }
  // Eyebrows
  ctx.strokeStyle=hair;ctx.lineWidth=2.8;
  ctx.beginPath();ctx.moveTo(cx-20,cy-12);ctx.quadraticCurveTo(cx-12,cy-17,cx-4,cy-12);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+4,cy-12);ctx.quadraticCurveTo(cx+12,cy-17,cx+20,cy-12);ctx.stroke();
  // Eyes with detail
  ctx.fillStyle="#fff";
  ctx.beginPath();ctx.ellipse(cx-12,cy,8,6.5,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+12,cy,8,6.5,0,0,Math.PI*2);ctx.fill();
  // Iris
  ctx.fillStyle="#3e2723";
  ctx.beginPath();ctx.arc(cx-11,cy+0.5,4,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(cx+13,cy+0.5,4,0,Math.PI*2);ctx.fill();
  // Pupil
  ctx.fillStyle="#000";
  ctx.beginPath();ctx.arc(cx-11,cy+0.5,2,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(cx+13,cy+0.5,2,0,Math.PI*2);ctx.fill();
  // Eye highlight
  ctx.fillStyle="rgba(255,255,255,0.7)";
  ctx.beginPath();ctx.arc(cx-12.5,cy-1,1.2,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(cx+11.5,cy-1,1.2,0,Math.PI*2);ctx.fill();
  // Eyelashes (Jade)
  if(who==="jade"){
    ctx.strokeStyle="#000";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(cx-19,cy-3);ctx.lineTo(cx-21,cy-6);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx+19,cy-3);ctx.lineTo(cx+21,cy-6);ctx.stroke();
  }
  // Nose
  ctx.strokeStyle=skinShadow;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(cx-1,cy+5);ctx.quadraticCurveTo(cx+4,cy+14,cx,cy+16);ctx.stroke();
  // Nostrils
  ctx.fillStyle=skinShadow;
  ctx.beginPath();ctx.ellipse(cx-3,cy+16,2,1.5,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+3,cy+16,2,1.5,0,0,Math.PI*2);ctx.fill();
  // Mouth/smile
  ctx.fillStyle="#c0604a";
  ctx.beginPath();ctx.ellipse(cx,cy+24,9,4,0,0,Math.PI);ctx.fill();
  // Teeth hint
  ctx.fillStyle="rgba(255,255,255,0.6)";
  ctx.fillRect(cx-5,cy+24,10,2);
  // Neck
  ctx.fillStyle=skin;ctx.fillRect(cx-9,cy+35,18,16);
  ctx.fillStyle=skinShadow;ctx.fillRect(cx-9,cy+35,18,3);
  // Body/shirt
  const shirtColor = who==="jade" ? "#e91e63" : "#1565c0";
  const shirtGrad=ctx.createLinearGradient(cx-40,cy+50,cx+40,h);
  shirtGrad.addColorStop(0,shirtColor);shirtGrad.addColorStop(1,who==="jade"?"#ad1457":"#0d47a1");
  ctx.fillStyle=shirtGrad;
  ctx.beginPath();
  ctx.moveTo(cx-40,h);ctx.quadraticCurveTo(cx-38,cy+50,cx-9,cy+50);
  ctx.lineTo(cx+9,cy+50);ctx.quadraticCurveTo(cx+38,cy+50,cx+40,h);
  ctx.closePath();ctx.fill();
  // Collar
  ctx.strokeStyle=who==="jade"?"#880e4f":"#0d47a1";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(cx-12,cy+50);ctx.quadraticCurveTo(cx,cy+56,cx+12,cy+50);ctx.stroke();
  // Star on shirt
  ctx.fillStyle="#ffe14d";ctx.font="bold 16px sans-serif";ctx.textAlign="center";
  ctx.fillText("\u2B50",cx,cy+72);
}
/* 3D Car builder with license plate */
function buildCar(color, isPlayer, driverName){
  const g = new THREE.Group();
  const col = new THREE.Color(color);
  const mat = new THREE.MeshPhongMaterial({color:col, shininess:80});
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.25, CAR_LEN), new THREE.MeshPhongMaterial({color:0x111111}));
  chassis.position.y = 0.25; g.add(chassis);
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, CAR_LEN*0.9), mat);
  body.position.y = 0.65; body.castShadow=true; body.name="body"; g.add(body);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 1.2), mat);
  hood.position.set(0, 0.98, 1.1); hood.rotation.x=-0.1; g.add(hood);
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.15, 0.9), mat);
  trunk.position.set(0, 0.92, -1.3); g.add(trunk);
  const cabGeo = new THREE.BoxGeometry(1.8, 0.65, 1.6);
  const cabMat = new THREE.MeshPhongMaterial({color:0x88ccff, transparent:true, opacity:0.5, shininess:100});
  const cab = new THREE.Mesh(cabGeo, cabMat);
  cab.position.set(0, 1.25, -0.1); cab.name="cabin"; g.add(cab);
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.7),
    new THREE.MeshPhongMaterial({color:0xaaddff, transparent:true, opacity:0.4, side:THREE.DoubleSide}));
  ws.position.set(0, 1.25, 0.75); ws.rotation.x=0.3; g.add(ws);
  const fMat = new THREE.MeshPhongMaterial({color:col.clone().multiplyScalar(0.85)});
  [[-1.15,1],[-1.15,-1],[1.15,1],[1.15,-1]].forEach(p=>{
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.9), fMat);
    f.position.set(p[0], 0.5, p[1]); g.add(f);
  });
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
    const spPost = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.4,0.08), fMat);
    [-.8,.8].forEach(x=>{ const s=spPost.clone(); s.position.set(x,1.15,-1.6); g.add(s); });
    const spWing = new THREE.Mesh(new THREE.BoxGeometry(2.4,0.06,0.35), fMat);
    spWing.position.set(0,1.38,-1.6); spWing.name="spoiler"; g.add(spWing);
    const hlGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const hlMat = new THREE.MeshPhongMaterial({color:0xffffcc, emissive:0xffff88, emissiveIntensity:0.9});
    [-0.8,0.8].forEach(x=>{
      const hl = new THREE.Mesh(hlGeo, hlMat);
      hl.position.set(x, 0.65, CAR_LEN/2); hl.name="headlight"; g.add(hl);
    });
    const tlGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const tlMat = new THREE.MeshPhongMaterial({color:0xff0000, emissive:0xff0000, emissiveIntensity:0.6});
    [-0.8,0.8].forEach(x=>{
      const tl = new THREE.Mesh(tlGeo, tlMat);
      tl.position.set(x, 0.65, -CAR_LEN/2); tl.name="taillight"; g.add(tl);
    });
    const exGeo = new THREE.CylinderGeometry(0.06,0.08,0.3,8);
    const exMat = new THREE.MeshPhongMaterial({color:0x666666});
    [-.5,.5].forEach(x=>{
      const ex = new THREE.Mesh(exGeo, exMat);
      ex.rotation.x=Math.PI/2; ex.position.set(x,0.3,-CAR_LEN/2-0.1); g.add(ex);
    });
    // License plate with driver name
    if(driverName){
      const plateCanvas = document.createElement("canvas");
      plateCanvas.width = 128; plateCanvas.height = 40;
      const pctx = plateCanvas.getContext("2d");
      pctx.fillStyle = "#fff";
      pctx.fillRect(0,0,128,40);
      pctx.strokeStyle = "#333";
      pctx.lineWidth = 3;
      pctx.strokeRect(2,2,124,36);
      pctx.fillStyle = "#1a237e";
      pctx.font = "bold 24px sans-serif";
      pctx.textAlign = "center";
      pctx.textBaseline = "middle";
      pctx.fillText(driverName.toUpperCase(), 64, 22);
      const plateTex = new THREE.CanvasTexture(plateCanvas);
      const plateMat = new THREE.MeshBasicMaterial({map:plateTex});
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.3), plateMat);
      plate.position.set(0, 0.45, -CAR_LEN/2-0.01);
      g.add(plate);
      // Front plate too
      const fp = plate.clone();
      fp.position.set(0, 0.45, CAR_LEN/2+0.01);
      g.add(fp);
    }
  }
  return g;
}

function buildEnemyCar(){
  const colors = [0x1a1a2e, 0x16213e, 0x0f3460, 0x2d132c, 0x1b1b2f];
  const c = colors[Math.floor(Math.random()*colors.length)];
  const g = buildCar(c, false, null);
  const bGeo = new THREE.BoxGeometry(2.4, 0.35, 0.25);
  const bumper = new THREE.Mesh(bGeo, new THREE.MeshPhongMaterial({color:0x444444}));
  bumper.position.set(0, 0.45, CAR_LEN/2+0.12); g.add(bumper);
  const eGeo = new THREE.SphereGeometry(0.12, 6, 6);
  const eMat = new THREE.MeshPhongMaterial({color:0xff0000, emissive:0xff0000, emissiveIntensity:1});
  [-0.5,0.5].forEach(x=>{
    const e = new THREE.Mesh(eGeo, eMat); e.position.set(x, 0.75, CAR_LEN/2+0.05); g.add(e);
  });
  return g;
}
/* 3D Pickups */
function buildGasCan(){
  const g = new THREE.Group();
  const bm = new THREE.MeshPhongMaterial({color:0xd32f2f});
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.35), bm);
  body.position.y=0.5; g.add(body);
  const hm = new THREE.MeshPhongMaterial({color:0x333333});
  g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.4,0.08,0.08),hm),{position:new THREE.Vector3(0,0.95,0)}));
  g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.08,0.2,0.08),hm),{position:new THREE.Vector3(-0.16,0.85,0)}));
  g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.08,0.2,0.08),hm),{position:new THREE.Vector3(0.16,0.85,0)}));
  const nz = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.06,0.25,6),hm);
  nz.position.set(0.25,0.95,0);nz.rotation.z=-0.5;g.add(nz);
  const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.35,0.25),new THREE.MeshPhongMaterial({color:0xffeb3b}));
  lb.position.set(0,0.5,0.18);g.add(lb);
  g.userData.type="fuel"; return g;
}
function buildStarPickup(){
  const g = new THREE.Group();
  const mat = new THREE.MeshPhongMaterial({color:0xffd600,emissive:0xffab00,emissiveIntensity:0.7,shininess:100});
  for(let i=0;i<5;i++){
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.18,0.6,4),mat);
    const a = (i/5)*Math.PI*2 - Math.PI/2;
    spike.position.set(Math.cos(a)*0.25,Math.sin(a)*0.25+0.8,0);
    spike.rotation.z = a+Math.PI/2; g.add(spike);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.22,8,8),mat);
  center.position.y=0.8;g.add(center);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.5,0.6,16),
    new THREE.MeshPhongMaterial({color:0xffe082,emissive:0xffcc02,emissiveIntensity:0.4,transparent:true,opacity:0.5,side:THREE.DoubleSide}));
  ring.position.y=0.8;ring.rotation.x=Math.PI/2;g.add(ring);
  g.userData.type="star"; return g;
}

/* Loco objects */
function buildTree(){const g=new THREE.Group();g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(.2,.3,2,8),new THREE.MeshPhongMaterial({color:0x5d4037})),{position:new THREE.Vector3(0,1,0)}));g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(1.2,8,8),new THREE.MeshPhongMaterial({color:0x2e7d32})),{position:new THREE.Vector3(0,2.5,0)}));g.userData.type="tree";return g;}
function buildHydrant(){const g=new THREE.Group();g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(.25,.3,.8,8),new THREE.MeshPhongMaterial({color:0xd32f2f})),{position:new THREE.Vector3(0,.4,0)}));g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(.28,8,8),new THREE.MeshPhongMaterial({color:0xb71c1c})),{position:new THREE.Vector3(0,.85,0)}));g.userData.type="hydrant";return g;}
function buildTrashcan(){const g=new THREE.Group();g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(.35,.3,.9,8),new THREE.MeshPhongMaterial({color:0x616161})),{position:new THREE.Vector3(0,.45,0)}));g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.06,8),new THREE.MeshPhongMaterial({color:0x757575})),{position:new THREE.Vector3(0,.93,0)}));g.userData.type="trashcan";return g;}
function buildCone(){const g=new THREE.Group();g.add(Object.assign(new THREE.Mesh(new THREE.ConeGeometry(.25,.7,8),new THREE.MeshPhongMaterial({color:0xff6f00})),{position:new THREE.Vector3(0,.35,0)}));g.userData.type="cone";return g;}
function buildBarrel(){const g=new THREE.Group();g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,.8,10),new THREE.MeshPhongMaterial({color:0x4e342e})),{position:new THREE.Vector3(0,.4,0)}));g.userData.type="barrel";return g;}
function buildChicken(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.SphereGeometry(.35,8,8),new THREE.MeshPhongMaterial({color:0xfff9c4}));b.position.y=.5;b.scale.set(1,.9,1.2);g.add(b);g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(.18,8,8),new THREE.MeshPhongMaterial({color:0xfff9c4})),{position:new THREE.Vector3(0,.9,.25)}));const bk=new THREE.Mesh(new THREE.ConeGeometry(.06,.15,6),new THREE.MeshPhongMaterial({color:0xff8f00}));bk.position.set(0,.88,.45);bk.rotation.x=-Math.PI/2;g.add(bk);g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(.08,6,6),new THREE.MeshPhongMaterial({color:0xd32f2f})),{position:new THREE.Vector3(0,1.08,.2)}));g.userData.type="chicken";return g;}

function buildRamp(){
  const g = new THREE.Group();
  const m=new THREE.Mesh(new THREE.BoxGeometry(3,.5,2.5),new THREE.MeshPhongMaterial({color:0xffd600,emissive:0xffa000,emissiveIntensity:.3}));
  m.rotation.x=.2;m.position.y=.3;g.add(m);
  const ar=new THREE.Mesh(new THREE.ConeGeometry(0.3,0.5,3),new THREE.MeshPhongMaterial({color:0xff6f00,emissive:0xff6f00,emissiveIntensity:.5}));
  ar.position.set(0,0.7,0);ar.rotation.x=-Math.PI/2;g.add(ar);
  g.userData.type="ramp"; return g;
}

/* Finish line flag */
function buildFinishFlag(){
  const g = new THREE.Group();
  // Pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,6,8),new THREE.MeshPhongMaterial({color:0x888888}));
  pole.position.y=3; g.add(pole);
  // Checkered flag - canvas texture
  const cnv = document.createElement("canvas"); cnv.width=64;cnv.height=40;
  const ctx = cnv.getContext("2d");
  const sq=8;
  for(let r=0;r<5;r++) for(let c=0;c<8;c++){
    ctx.fillStyle=(r+c)%2===0?"#000":"#fff";
    ctx.fillRect(c*sq,r*sq,sq,sq);
  }
  const flagTex = new THREE.CanvasTexture(cnv);
  const flagMat = new THREE.MeshPhongMaterial({map:flagTex,side:THREE.DoubleSide});
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(2,1.2),flagMat);
  flag.position.set(1,5.2,0); flag.name="flag"; g.add(flag);
  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.4,0.3,8),new THREE.MeshPhongMaterial({color:0x333333}));
  base.position.y=0.15; g.add(base);
  return g;
}
/* Roadside scenery builders */
function buildRestaurant(){
  const g = new THREE.Group();
  // Building
  const bm = new THREE.MeshPhongMaterial({color:0xffcc80});
  const bldg = new THREE.Mesh(new THREE.BoxGeometry(6,4,4),bm);
  bldg.position.y=2; g.add(bldg);
  // Awning
  const aw = new THREE.Mesh(new THREE.BoxGeometry(6.5,0.15,1.5),
    new THREE.MeshPhongMaterial({color:0xd32f2f}));
  aw.position.set(0,3.2,2.5); aw.rotation.x=0.15; g.add(aw);
  // Sign "TACOS"
  const sc=document.createElement("canvas");sc.width=128;sc.height=32;
  const sx=sc.getContext("2d");
  sx.fillStyle="#ffeb3b";sx.fillRect(0,0,128,32);
  sx.fillStyle="#d32f2f";sx.font="bold 22px sans-serif";sx.textAlign="center";
  sx.fillText("TACOS",64,24);
  const signTex=new THREE.CanvasTexture(sc);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.5,0.6),new THREE.MeshBasicMaterial({map:signTex}));
  sign.position.set(0,4.3,2.01); g.add(sign);
  // Door
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1,2),new THREE.MeshPhongMaterial({color:0x5d4037}));
  door.position.set(0,1,2.01); g.add(door);
  // Windows
  const wm = new THREE.MeshPhongMaterial({color:0xbbdefb,emissive:0x90caf9,emissiveIntensity:0.3});
  [-1.8,1.8].forEach(x=>{
    const win=new THREE.Mesh(new THREE.PlaneGeometry(0.8,0.8),wm);
    win.position.set(x,2.5,2.01); g.add(win);
  });
  g.userData.type="restaurant"; return g;
}

function buildFleaMarket(){
  const g = new THREE.Group();
  // Stall frame
  const pm = new THREE.MeshPhongMaterial({color:0x795548});
  [[-2,0],[2,0],[-2,0],[2,0]].forEach((p,i)=>{
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,2.5,6),pm);
    pole.position.set(p[0]+((i>1)?0:0),1.25,(i>1)?-1.5:1.5); g.add(pole);
  });
  // Canopy - colorful
  const colors=[0xff5722,0x4caf50,0x2196f3,0xffeb3b];
  const cm=new THREE.MeshPhongMaterial({color:colors[Math.floor(Math.random()*4)]});
  const canopy=new THREE.Mesh(new THREE.BoxGeometry(4.5,0.1,3.5),cm);
  canopy.position.y=2.5; g.add(canopy);
  // Table
  const table=new THREE.Mesh(new THREE.BoxGeometry(3.5,0.1,2),new THREE.MeshPhongMaterial({color:0x8d6e63}));
  table.position.set(0,0.8,0); g.add(table);
  // Items on table (small colored boxes)
  for(let i=0;i<6;i++){
    const item=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.3,0.3),
      new THREE.MeshPhongMaterial({color:Math.random()*0xffffff}));
    item.position.set(-1+i*0.5,1,Math.random()*0.5-0.25); g.add(item);
  }
  g.userData.type="market"; return g;
}

function buildPark(){
  const g = new THREE.Group();
  // Trees
  for(let i=0;i<3;i++){
    const tree = buildTree();
    tree.position.set(-3+i*3, 0, Math.random()*2-1);
    g.add(tree);
  }
  // Swing set
  const swm = new THREE.MeshPhongMaterial({color:0x666666});
  const frame1=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,3,6),swm);
  frame1.position.set(-1,1.5,0); frame1.rotation.z=0.15; g.add(frame1);
  const frame2=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,3,6),swm);
  frame2.position.set(1,1.5,0); frame2.rotation.z=-0.15; g.add(frame2);
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,2.5,6),swm);
  bar.rotation.z=Math.PI/2; bar.position.set(0,2.8,0); g.add(bar);
  // Swing seat
  const seat=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.05,0.3),new THREE.MeshPhongMaterial({color:0x1565c0}));
  seat.position.set(0,0.8,0); g.add(seat);
  // Kid figure (simple)
  const kidm = new THREE.MeshPhongMaterial({color:0xc8956e});
  const kidBody=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.15,0.5,6),new THREE.MeshPhongMaterial({color:0xe91e63}));
  kidBody.position.set(0,1.1,0); g.add(kidBody);
  const kidHead=new THREE.Mesh(new THREE.SphereGeometry(0.15,6,6),kidm);
  kidHead.position.set(0,1.5,0); g.add(kidHead);
  // Bench
  const bench=new THREE.Mesh(new THREE.BoxGeometry(2,0.1,0.5),new THREE.MeshPhongMaterial({color:0x5d4037}));
  bench.position.set(3.5,0.4,0); g.add(bench);
  const benchLegs=new THREE.MeshPhongMaterial({color:0x333333});
  [-0.8,0.8].forEach(x=>{
    const leg=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.4,0.08),benchLegs);
    leg.position.set(3.5+x,0.2,0); g.add(leg);
  });
  g.userData.type="park"; return g;
}

/* Sidewalk strip */
function buildSidewalk(){
  const geo = new THREE.PlaneGeometry(3, ROAD_LEN + ROAD_BEHIND);
  const mat = new THREE.MeshPhongMaterial({color:0x9e9e9e});
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI/2;
  return m;
}
/* Willis Tower + Skyline */
function buildWillisTower(){
  const g=new THREE.Group();
  const mat=new THREE.MeshPhongMaterial({color:0x1a1a2e});
  g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(8,35,6),mat),{position:new THREE.Vector3(0,17.5,0)}));
  g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(6,10,5),mat),{position:new THREE.Vector3(0,40,0)}));
  g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(4,8,4),mat),{position:new THREE.Vector3(0,49,0)}));
  const am=new THREE.MeshPhongMaterial({color:0x666666});
  g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(.12,.1,20,6),am),{position:new THREE.Vector3(-1,63,0)}));
  g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(.1,.08,16,6),am),{position:new THREE.Vector3(1,61,0)}));
  const bm=new THREE.MeshPhongMaterial({color:0xff0000,emissive:0xff0000,emissiveIntensity:1});
  const b1=new THREE.Mesh(new THREE.SphereGeometry(.2,6,6),bm);b1.position.set(-1,73,0);b1.name="blink";g.add(b1);
  const b2=new THREE.Mesh(new THREE.SphereGeometry(.18,6,6),bm);b2.position.set(1,69,0);b2.name="blink";g.add(b2);
  const wm=new THREE.MeshPhongMaterial({color:0xffecb3,emissive:0xffe082,emissiveIntensity:.5,transparent:true,opacity:.6});
  for(let y=3;y<48;y+=3){const w=new THREE.Mesh(new THREE.PlaneGeometry(7,.3),wm);w.position.set(0,y,3.01);g.add(w);}
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
  const wm=new THREE.MeshPhongMaterial({color:0xfff8e1,emissive:0xffe082,emissiveIntensity:.3,transparent:true,opacity:.4});
  configs.forEach(c=>{
    const b=new THREE.Mesh(new THREE.BoxGeometry(c.w,c.h,c.d),mat);
    b.position.set(c.x,c.h/2,-250);b.castShadow=true;scene.add(b);buildings.push(b);
    for(let y=2;y<c.h-1;y+=2.5){const w=new THREE.Mesh(new THREE.PlaneGeometry(c.w-.5,.25),wm);w.position.set(c.x,y,-250+c.d/2+.01);scene.add(w);}
  });
  const willis=buildWillisTower();willis.position.set(0,0,-260);scene.add(willis);
  return {buildings,willis};
}

/* Road texture */
function makeRoadTexture(){
  const c=document.createElement("canvas");c.width=512;c.height=1024;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#2a2a2a";ctx.fillRect(0,0,512,1024);
  for(let i=0;i<3000;i++){const v=Math.random()*30+30;ctx.fillStyle=`rgb(${v},${v},${v})`;ctx.fillRect(Math.random()*512,Math.random()*1024,2,2);}
  ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.setLineDash([40,30]);
  [170,340].forEach(x=>{ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1024);ctx.stroke();});
  ctx.strokeStyle="#ff0";ctx.lineWidth=4;ctx.setLineDash([]);
  [30,482].forEach(x=>{ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1024);ctx.stroke();});
  const tex=new THREE.CanvasTexture(c);
  tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(1,12);
  return tex;
}

/* Silhouette sprite - large and glowing */
function buildSilhouetteSprite(who){
  const cnv=document.createElement("canvas");cnv.width=256;cnv.height=384;
  const ctx=cnv.getContext("2d");
  // Glowing aura
  const glow=ctx.createRadialGradient(128,140,30,128,140,150);
  glow.addColorStop(0,who==="jade"?"rgba(233,30,99,0.25)":"rgba(21,101,192,0.25)");
  glow.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=glow;ctx.fillRect(0,0,256,384);
  // Silhouette figure
  ctx.fillStyle=who==="jade"?"rgba(233,30,99,0.18)":"rgba(21,101,192,0.18)";
  const cx=128, cy=100;
  ctx.beginPath();ctx.ellipse(cx,cy,42,52,0,0,Math.PI*2);ctx.fill();
  if(who==="jade"){
    ctx.beginPath();ctx.ellipse(cx,cy-16,46,38,0,Math.PI,0);ctx.fill();
    ctx.fillRect(cx-46,cy-16,16,70);ctx.fillRect(cx+30,cy-16,16,70);
  } else {
    ctx.beginPath();ctx.ellipse(cx,cy-22,44,28,0,Math.PI,0);ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(cx-50,384);ctx.quadraticCurveTo(cx-50,cy+52,cx-12,cy+52);
  ctx.lineTo(cx+12,cy+52);ctx.quadraticCurveTo(cx+50,cy+52,cx+50,384);
  ctx.closePath();ctx.fill();
  const tex=new THREE.CanvasTexture(cnv);
  const mat=new THREE.SpriteMaterial({map:tex,transparent:true});
  const spr=new THREE.Sprite(mat);
  spr.scale.set(20,30,1);
  return spr;
}

/* Happy victory music */
function playVictoryMusic(ctx){
  if(!ctx) return;
  const notes=[523,659,784,1047,784,659,523,659,784,1047];
  const t=ctx.currentTime;
  notes.forEach((f,i)=>{
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type="sine";o.frequency.value=f;
    g.gain.setValueAtTime(.08,t+i*.2);g.gain.exponentialRampToValueAtTime(.01,t+i*.2+.18);
    o.connect(g);g.connect(ctx.destination);o.start(t+i*.2);o.stop(t+i*.2+.2);
  });
  // Triumphant chord
  [523,659,784].forEach(f=>{
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type="triangle";o.frequency.value=f;
    g.gain.setValueAtTime(.06,t+2.2);g.gain.exponentialRampToValueAtTime(.005,t+3.5);
    o.connect(g);g.connect(ctx.destination);o.start(t+2.2);o.stop(t+3.5);
  });
}

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
    // Lights
    this.ambLight = new THREE.AmbientLight(0x8899aa, 0.8);
    this.scene.add(this.ambLight);
    this.dirLight = new THREE.DirectionalLight(0xffeedd, 1.4);
    this.dirLight.position.set(10, 30, 20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.set(1024, 1024);
    this.dirLight.shadow.camera.near=1;this.dirLight.shadow.camera.far=100;
    this.dirLight.shadow.camera.left=-20;this.dirLight.shadow.camera.right=20;
    this.dirLight.shadow.camera.top=20;this.dirLight.shadow.camera.bottom=-20;
    this.scene.add(this.dirLight);
    this.hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x1a3a1a, 0.5);
    this.scene.add(this.hemiLight);
    // Stars
    const starGeo = new THREE.BufferGeometry();
    const sv = [];
    for(let i=0;i<500;i++) sv.push((Math.random()-.5)*400,Math.random()*100+20,-200-Math.random()*200);
    starGeo.setAttribute("position",new THREE.Float32BufferAttribute(sv,3));
    this.starMat = new THREE.PointsMaterial({color:0xffffff,size:.5,transparent:true,opacity:0});
    this.stars = new THREE.Points(starGeo, this.starMat);
    this.scene.add(this.stars);
    // Ground
    const gndGeo = new THREE.PlaneGeometry(200, ROAD_LEN+ROAD_BEHIND);
    const gndMat = new THREE.MeshPhongMaterial({color:0x2d5a27});
    this.ground = new THREE.Mesh(gndGeo, gndMat);
    this.ground.rotation.x=-Math.PI/2;
    this.ground.position.set(0,-0.01, -(ROAD_LEN-ROAD_BEHIND)/2);
    this.ground.receiveShadow=true;
    this.scene.add(this.ground);
    // Road - extends ROAD_BEHIND units behind the car
    this.roadTex = makeRoadTexture();
    const roadGeo = new THREE.PlaneGeometry(ROAD_W, ROAD_LEN+ROAD_BEHIND);
    const roadMat = new THREE.MeshPhongMaterial({map:this.roadTex});
    this.road = new THREE.Mesh(roadGeo, roadMat);
    this.road.rotation.x=-Math.PI/2;
    this.road.position.set(0, 0, -(ROAD_LEN-ROAD_BEHIND)/2);
    this.road.receiveShadow=true;
    this.scene.add(this.road);
    // Sidewalks
    [-ROAD_W/2-1.5, ROAD_W/2+1.5].forEach(x=>{
      const sw = buildSidewalk();
      sw.position.set(x, 0.01, -(ROAD_LEN-ROAD_BEHIND)/2);
      this.scene.add(sw);
    });
    // Skyline
    this.skyline = buildSkyline(this.scene);
    // Roadside scenery pool
    this.sceneryLeft = [];
    this.sceneryRight = [];
    this._nextSceneryZ = -50;
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
    this.introTimer = 0;
    this._introCars = [];
    this._introLabels = [];
    this.silhouette = null;
    this.finishFlag = null;
    this.airborne = false;
    this.jumpVelocity = 0;
    this.jumpY = 0;
    this._dayBg = new THREE.Color(0x87CEEB);
    this._sunsetBg = new THREE.Color(0xff7043);
    this._nightBg = new THREE.Color(0x0a0e2a);
    // Victory state
    this.victoryPhase = 0;
    this.victoryTimer = 0;
  }

  _resize(){
    const w=window.innerWidth,h=window.innerHeight;
    this.renderer.setSize(w,h);
    if(this.camera){this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  }
  _laneX(lane){const cfg=DIFF[this.diff];return (lane-(cfg.lanes-1)/2)*LANE_W;}
  _updateLighting(progress){
    const p=Math.min(1,progress);
    let bgColor,ambInt,dirInt,starOp;
    if(p<0.4){const t=p/0.4;bgColor=this._dayBg.clone().lerp(this._sunsetBg,t*0.3);ambInt=0.8-t*0.15;dirInt=1.4-t*0.3;starOp=0;}
    else if(p<0.7){const t=(p-0.4)/0.3;bgColor=this._sunsetBg.clone().lerp(this._nightBg,t);ambInt=0.65-t*0.35;dirInt=1.1-t*0.7;starOp=t*0.5;}
    else{bgColor=this._nightBg.clone();ambInt=0.3;dirInt=0.4;starOp=0.5+((p-0.7)/0.3)*0.5;}
    this.scene.background.copy(bgColor);this.scene.fog.color.copy(bgColor);
    this.ambLight.intensity=ambInt;this.dirLight.intensity=dirInt;
    this.hemiLight.color.copy(bgColor);this.starMat.opacity=starOp;
  }

  _spawnScenery(z){
    const builders=[buildRestaurant, buildFleaMarket, buildPark];
    const makeOne=(side)=>{
      const b=builders[Math.floor(Math.random()*builders.length)]();
      const x=side*(ROAD_W/2+6+Math.random()*3);
      b.position.set(x, 0, z);
      if(side>0) b.rotation.y=Math.PI;
      this.scene.add(b);
      return b;
    };
    this.sceneryLeft.push(makeOne(-1));
    this.sceneryRight.push(makeOne(1));
  }

  _updateScenery(effectiveSpeed, dt){
    // Move scenery toward player
    const allScenery=[...this.sceneryLeft,...this.sceneryRight];
    for(let i=allScenery.length-1;i>=0;i--){
      allScenery[i].position.z += effectiveSpeed * dt;
    }
    // Remove passed scenery
    for(let i=this.sceneryLeft.length-1;i>=0;i--){
      if(this.sceneryLeft[i].position.z > 30){
        this.scene.remove(this.sceneryLeft[i]);this.sceneryLeft.splice(i,1);
        this.scene.remove(this.sceneryRight[i]);this.sceneryRight.splice(i,1);
      }
    }
    // Spawn new scenery ahead
    if(this.sceneryLeft.length<8){
      const farthest=this.sceneryLeft.length>0?Math.min(...this.sceneryLeft.map(s=>s.position.z)):-50;
      this._spawnScenery(farthest - 25 - Math.random()*15);
    }
  }

  /* Intro */
  startIntro(){
    this.state="intro";this.introTimer=0;
    this._introCars.forEach(c=>this.scene.remove(c));
    this._introLabels.forEach(c=>this.scene.remove(c));
    this._introCars=[];this._introLabels=[];
    this.scene.background.copy(this._dayBg);this.scene.fog.color.copy(this._dayBg);
    this.ambLight.intensity=0.8;this.dirLight.intensity=1.4;this.starMat.opacity=0;
    this.camera.position.set(0,15,25);this.camera.lookAt(0,10,-100);
    this.skyline.buildings.forEach(b=>{b.userData.targetY=b.position.y;b.position.y=-50;});
    this.skyline.willis.userData.targetY=0;this.skyline.willis.position.y=-80;
    const carA=buildCar(0xcc0000,true,"Axel");carA.position.set(-8,0,-30);this.scene.add(carA);this._introCars.push(carA);
    const carJ=buildCar(0x6a1b9a,true,"Jade");carJ.position.set(8,0,-30);this.scene.add(carJ);this._introCars.push(carJ);
    ["AXEL","JADE"].forEach((name,i)=>{
      const cnv=document.createElement("canvas");cnv.width=256;cnv.height=64;
      const ctx=cnv.getContext("2d");
      ctx.fillStyle=i===0?"#ff5252":"#ce93d8";ctx.font="bold 40px sans-serif";ctx.textAlign="center";
      ctx.fillText(name,128,45);
      const tex=new THREE.CanvasTexture(cnv);
      const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true}));
      spr.scale.set(4,1,1);spr.position.set(i===0?-8:8,4,-30);
      this.scene.add(spr);this._introLabels.push(spr);
    });
  }

  _updateIntro(dt){
    this.introTimer+=dt;const t=this.introTimer;
    if(t<3){
      this.skyline.buildings.forEach((b,i)=>{const p=Math.max(0,Math.min((t-i*0.08)/2,1));const e=1-Math.pow(1-p,3);b.position.y=-50+(b.userData.targetY+50)*e;});
      const ease=1-Math.pow(1-Math.min(t/2.5,1),3);this.skyline.willis.position.y=-80+80*ease;
    }
    if(t>1.5&&t<4){
      const ce=1-Math.pow(1-Math.min((t-1.5)/2,1),2);
      this._introCars.forEach(c=>{c.position.z=-30+25*ce;});
      this._introLabels.forEach((l,i)=>{l.position.z=-30+25*ce;l.position.y=4+Math.sin(t*6)*0.3;});
    }
    const angle=t*0.15;
    this.camera.position.set(Math.sin(angle)*18, 12+Math.sin(t*0.5)*2, 20+Math.cos(angle)*10);
    this.camera.lookAt(0,8,-100);
    this.skyline.willis.traverse(c=>{if(c.name==="blink")c.material.emissiveIntensity=.5+.5*Math.sin(t*4);});
    this.renderer.render(this.scene,this.camera);
  }
  startGame(mode, diff, driver){
    this.mode=mode;this.diff=diff;this.driver=driver;
    const cfg=DIFF[diff];
    this.lives=cfg.lives;this.maxLives=cfg.lives;
    this.fuel=100;this.score=0;this.dist=0;this.goalDist=cfg.goalDist;
    this.speed=30*cfg.speed;this.damage=0;this.invincible=0;this.spawnCooldown=0;
    this.paused=false;this.airborne=false;this.jumpVelocity=0;this.jumpY=0;
    this.state="playing";this.victoryPhase=0;this.victoryTimer=0;
    this._updateLighting(0);
    this._introCars.forEach(c=>this.scene.remove(c));this._introCars=[];
    this._introLabels.forEach(c=>this.scene.remove(c));this._introLabels=[];
    this.skyline.buildings.forEach(b=>{if(b.userData.targetY!==undefined)b.position.y=b.userData.targetY;});
    this.skyline.willis.position.y=0;
    this.obstacles.forEach(o=>this.scene.remove(o));this.obstacles=[];
    this.pickups.forEach(r=>this.scene.remove(r));this.pickups=[];
    this.locoObjs.forEach(o=>this.scene.remove(o));this.locoObjs=[];
    // Clear scenery
    this.sceneryLeft.forEach(s=>this.scene.remove(s));this.sceneryLeft=[];
    this.sceneryRight.forEach(s=>this.scene.remove(s));this.sceneryRight=[];
    // Pre-spawn scenery
    for(let z=-20;z>-200;z-=30) this._spawnScenery(z);
    // Silhouette
    if(this.silhouette)this.scene.remove(this.silhouette);
    this.silhouette=buildSilhouetteSprite(driver);
    this.silhouette.position.set(18,55,-180);
    this.scene.add(this.silhouette);
    // Finish flag (hidden, placed at end)
    if(this.finishFlag)this.scene.remove(this.finishFlag);
    this.finishFlag=null;
    // Player car
    if(this.playerCar)this.scene.remove(this.playerCar);
    const pColor=driver==="axel"?0xcc0000:0x6a1b9a;
    this.playerCar=buildCar(pColor,true,driver);
    this.playerCar.position.set(0,0,0);
    this.scene.add(this.playerCar);
    this.camera.position.set(0,6,12);this.camera.lookAt(0,1,-20);
    sfx.init();sfx.music();sfx.engine(this.speed);
  }

  update(dt){
    if(this.state==="intro"){this._updateIntro(dt);return;}
    if(this.state==="victory"){this._updateVictory(dt);return;}
    if(this.state!=="playing"||this.paused)return;
    if(this.mode==="race")this._updateRace(dt);
    else this._updateLoco(dt);
  }

  _updateRace(dt){
    const cfg=DIFF[this.diff];
    if(this.speed<cfg.maxSpeed)this.speed+=dt*2*cfg.speed;
    const px=this.playerCar.position.x;
    const halfRoad=(cfg.lanes*LANE_W)/2;
    if(!this.airborne) this.playerCar.position.x=Math.max(-halfRoad,Math.min(halfRoad,px+this.tiltSide*dt*15));
    const speedMod=1+this.tiltFwd*0.3;
    const effectiveSpeed=this.speed*Math.max(0.3,speedMod);
    this.dist+=effectiveSpeed*dt;
    this.fuel-=cfg.fuelDrain*dt*effectiveSpeed;
    if(this.fuel<=0){this.fuel=0;this._endGame(false,"Out of fuel!");return;}
    this.roadTex.offset.y-=effectiveSpeed*dt*0.08;
    this._updateLighting(this.dist/this.goalDist);
    this._updateScenery(effectiveSpeed, dt);
    // Jump physics
    if(this.airborne){
      this.jumpVelocity-=25*dt;
      this.jumpY+=this.jumpVelocity*dt;
      if(this.jumpY<=0){this.jumpY=0;this.airborne=false;this.playerCar.position.y=0;this.playerCar.rotation.x=0;sfx.thud();}
      else{this.playerCar.position.y=this.jumpY;this.playerCar.rotation.x=-this.jumpVelocity*0.01;}
    }
    if(this.spawnCooldown>0)this.spawnCooldown-=dt;
    // Spawn enemies
    if(this.spawnCooldown<=0&&Math.random()<cfg.spawnRate){
      const lane=Math.floor(Math.random()*cfg.lanes);
      const enemy=buildEnemyCar();
      enemy.position.set(this._laneX(lane),0,-ROAD_LEN/2+Math.random()*50);
      enemy.userData.speed=effectiveSpeed*(0.5+Math.random()*0.3);
      this.scene.add(enemy);this.obstacles.push(enemy);
    }
    // Spawn ramps
    if(Math.random()<0.003){const r=buildRamp();const lane=Math.floor(Math.random()*cfg.lanes);r.position.set(this._laneX(lane),0,-ROAD_LEN/2);this.scene.add(r);this.pickups.push(r);}
    // Spawn fuel
    if(Math.random()<0.004){const f=buildGasCan();const lane=Math.floor(Math.random()*cfg.lanes);f.position.set(this._laneX(lane),0,-ROAD_LEN/2);this.scene.add(f);this.pickups.push(f);}
    // Spawn stars
    if(Math.random()<0.006){const s=buildStarPickup();const lane=Math.floor(Math.random()*cfg.lanes);s.position.set(this._laneX(lane),0,-ROAD_LEN/2);this.scene.add(s);this.pickups.push(s);}
    // Update enemies
    for(let i=this.obstacles.length-1;i>=0;i--){
      const o=this.obstacles[i];
      o.position.z+=(effectiveSpeed-(o.userData.speed||0))*dt;
      if(o.position.z>20){this.scene.remove(o);this.obstacles.splice(i,1);continue;}
      if(this.invincible<=0&&!this.airborne){
        const dx=Math.abs(o.position.x-this.playerCar.position.x);
        const dz=Math.abs(o.position.z-this.playerCar.position.z);
        if(dx<1.8&&dz<CAR_LEN){this._crash();break;}
      }
    }
    // Update pickups
    for(let i=this.pickups.length-1;i>=0;i--){
      const r=this.pickups[i];
      r.position.z+=effectiveSpeed*dt;
      if(r.userData.type==="star")r.rotation.y+=dt*3;
      if(r.userData.type==="fuel")r.rotation.y+=dt*1.5;
      if(r.position.z>15){this.scene.remove(r);this.pickups.splice(i,1);continue;}
      const dx=Math.abs(r.position.x-this.playerCar.position.x);
      const dz=Math.abs(r.position.z-this.playerCar.position.z);
      if(dx<1.8&&dz<2.5){
        const type=r.userData.type;
        if(type==="fuel"){this.fuel=Math.min(100,this.fuel+25);sfx.boost();}
        else if(type==="star"){this.score+=150;sfx.boost();}
        else if(type==="ramp"&&!this.airborne){this.airborne=true;this.jumpVelocity=12;this.jumpY=0.1;sfx.jump();this.speed+=10;}
        if(type!=="ramp"){this.scene.remove(r);this.pickups.splice(i,1);}
      }
    }
    if(this.invincible>0){this.invincible-=dt;if(this.playerCar)this.playerCar.visible=Math.sin(Date.now()*0.02)>0;}
    else if(this.playerCar)this.playerCar.visible=true;
    this.score+=effectiveSpeed*dt*0.5;
    sfx.engine(effectiveSpeed);
    this.camera.position.x+=(this.playerCar.position.x*0.3-this.camera.position.x)*0.05;
    this.camera.position.y=6+this.jumpY*0.4;
    if(this.silhouette)this.silhouette.position.y=55+Math.sin(Date.now()*0.001)*3;
    // Approaching finish?
    if(this.dist>=this.goalDist*0.9&&!this.finishFlag){
      this.finishFlag=buildFinishFlag();
      this.finishFlag.position.set(0,0,-80);
      this.scene.add(this.finishFlag);
    }
    if(this.finishFlag)this.finishFlag.position.z+=effectiveSpeed*dt;
    if(this.dist>=this.goalDist){this._startVictory();return;}
    this.skyline.willis.traverse(c=>{if(c.name==="blink")c.material.emissiveIntensity=.5+.5*Math.sin(Date.now()*.003);});
    this.renderer.render(this.scene,this.camera);
  }
  _updateLoco(dt){
    const cfg=DIFF[this.diff];
    this.speed=40*cfg.speed;
    const px=this.playerCar.position.x;
    this.playerCar.position.x=Math.max(-15,Math.min(15,px+this.tiltSide*dt*18));
    const speedMod=1+this.tiltFwd*0.3;
    const effectiveSpeed=this.speed*Math.max(0.3,speedMod);
    this.roadTex.offset.y-=effectiveSpeed*dt*0.08;
    this.dist+=effectiveSpeed*dt;
    this.score+=effectiveSpeed*dt*0.3;
    this._updateLighting(this.dist/5000);
    this._updateScenery(effectiveSpeed,dt);
    if(this.spawnCooldown>0)this.spawnCooldown-=dt;
    if(this.spawnCooldown<=0&&Math.random()<cfg.spawnRate*0.6){
      const builders=[buildTree,buildHydrant,buildTrashcan,buildCone,buildBarrel,buildChicken];
      const obj=builders[Math.floor(Math.random()*builders.length)]();
      obj.position.set((Math.random()-.5)*ROAD_W,0,-ROAD_LEN/2+Math.random()*30);
      this.scene.add(obj);this.locoObjs.push(obj);
    }
    for(let i=this.locoObjs.length-1;i>=0;i--){
      const o=this.locoObjs[i];
      o.position.z+=effectiveSpeed*dt;
      if(o.position.z>20){this.scene.remove(o);this.locoObjs.splice(i,1);continue;}
      if(this.invincible<=0){
        const dx=Math.abs(o.position.x-this.playerCar.position.x);
        const dz=Math.abs(o.position.z-this.playerCar.position.z);
        if(dx<1.5&&dz<2){
          const type=o.userData.type||"cone";
          if(type==="chicken")sfx.squawk();else if(type==="hydrant"||type==="barrel")sfx.clang();else sfx.crash();
          this.score+=200;this.damage++;this._removePart();
          this.scene.remove(o);this.locoObjs.splice(i,1);
          this.invincible=0.5;
          if(this.damage>=10){this._endGame(false,"Car destroyed!");return;}
        }
      }
    }
    if(this.invincible>0){this.invincible-=dt;if(this.playerCar)this.playerCar.visible=Math.sin(Date.now()*.02)>0;}
    else if(this.playerCar)this.playerCar.visible=true;
    sfx.engine(effectiveSpeed);
    this.camera.position.x+=(this.playerCar.position.x*0.3-this.camera.position.x)*0.05;
    if(this.silhouette)this.silhouette.position.y=55+Math.sin(Date.now()*0.001)*3;
    this.skyline.willis.traverse(c=>{if(c.name==="blink")c.material.emissiveIntensity=.5+.5*Math.sin(Date.now()*.003);});
    this.renderer.render(this.scene,this.camera);
  }

  /* Victory sequence - car drives to waving flag */
  _startVictory(){
    this.state="victory";
    this.victoryTimer=0;
    sfx.stopEngine();sfx.stopMusic();
    // Play victory music
    sfx.init();
    if(!sfx.muted&&sfx.ctx) playVictoryMusic(sfx.ctx);
    // Place finish flag ahead if not already
    if(!this.finishFlag){
      this.finishFlag=buildFinishFlag();
      this.finishFlag.position.set(0,0,-15);
      this.scene.add(this.finishFlag);
    }
    // Clear obstacles
    this.obstacles.forEach(o=>this.scene.remove(o));this.obstacles=[];
    this.pickups.forEach(r=>this.scene.remove(r));this.pickups=[];
  }

  _updateVictory(dt){
    this.victoryTimer+=dt;
    const t=this.victoryTimer;
    // Car decelerates and pulls up to flag
    if(this.playerCar){
      const targetX=0;
      this.playerCar.position.x+=(targetX-this.playerCar.position.x)*0.03;
      if(t<3){
        // Car still rolling forward slowly
        this.roadTex.offset.y-=20*dt*0.08*(1-t/3);
      }
    }
    // Flag waving animation
    if(this.finishFlag){
      this.finishFlag.traverse(c=>{
        if(c.name==="flag"){
          c.rotation.y=Math.sin(t*5)*0.15;
          c.position.x=1+Math.sin(t*4)*0.1;
        }
      });
      // Move flag toward player
      if(t<2){
        this.finishFlag.position.z+=(3-this.finishFlag.position.z)*0.04;
      }
    }
    // Camera slowly orbits to show the scene
    const camAngle=t*0.3;
    this.camera.position.x=Math.sin(camAngle)*8;
    this.camera.position.y=5+Math.sin(t*0.5)*1;
    this.camera.position.z=10+Math.cos(camAngle)*4;
    this.camera.lookAt(0,2,0);
    // Silhouette celebration glow
    if(this.silhouette){
      this.silhouette.position.y=55+Math.sin(t*2)*5;
      this.silhouette.material.opacity=0.5+Math.sin(t*3)*0.3;
    }
    this.skyline.willis.traverse(c=>{if(c.name==="blink")c.material.emissiveIntensity=.5+.5*Math.sin(t*4);});
    this.renderer.render(this.scene,this.camera);
    // After 5 seconds, show result
    if(t>5){
      this._endGame(true,"Race Complete!");
    }
  }

  _crash(){
    sfx.crash();this.lives--;
    if(this.lives<=0){this._endGame(false,"No lives left!");return;}
    this.invincible=3;this.spawnCooldown=3;
    for(let i=this.obstacles.length-1;i>=0;i--){
      const o=this.obstacles[i];
      if(o.position.z<this.playerCar.position.z+5){this.scene.remove(o);this.obstacles.splice(i,1);}
    }
    if(this.onCrash)this.onCrash(this.lives);
  }

  _removePart(){
    if(!this.playerCar)return;
    const removable=[];
    this.playerCar.traverse(c=>{
      if((c.name==="spoiler"||c.name==="headlight"||c.name==="cabin"||c.name==="wheel"||c.name==="taillight")&&c.visible)removable.push(c);
    });
    if(removable.length>0){
      const part=removable[Math.floor(Math.random()*removable.length)];
      const fly=part.clone();fly.position.copy(this.playerCar.position);fly.position.y+=1;
      this.scene.add(fly);part.visible=false;
      let tt=0;const anim=()=>{tt+=0.016;fly.position.y+=3*0.016;fly.position.x+=(Math.random()-.5)*.3;fly.rotation.x+=.2;fly.rotation.z+=.15;if(tt<1)requestAnimationFrame(anim);else this.scene.remove(fly);};anim();
    }
  }

  _endGame(win,msg){
    this.state="ended";
    sfx.stopEngine();sfx.stopMusic();
    if(this.silhouette){this.scene.remove(this.silhouette);this.silhouette=null;}
    if(this.finishFlag){this.scene.remove(this.finishFlag);this.finishFlag=null;}
    // Clear scenery
    this.sceneryLeft.forEach(s=>this.scene.remove(s));this.sceneryLeft=[];
    this.sceneryRight.forEach(s=>this.scene.remove(s));this.sceneryRight=[];
    if(this.onEnd)this.onEnd(win,msg,Math.floor(this.score));
  }

  renderIdle(){
    this.scene.background.copy(this._dayBg);this.scene.fog.color.copy(this._dayBg);
    this.ambLight.intensity=0.8;this.dirLight.intensity=1.4;this.starMat.opacity=0;
    this.camera.position.set(0,15,25);this.camera.lookAt(0,10,-100);
    const t=Date.now()*0.001;
    this.camera.position.x=Math.sin(t*0.1)*5;
    this.skyline.willis.traverse(c=>{if(c.name==="blink")c.material.emissiveIntensity=.5+.5*Math.sin(t*4);});
    this.renderer.render(this.scene,this.camera);
  }

  togglePause(){this.paused=!this.paused;return this.paused;}
}