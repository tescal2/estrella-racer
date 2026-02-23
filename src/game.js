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
  towHorn(){
    this._play(c=>{
      const t=c.currentTime;
      [150,120].forEach((f,i)=>{
        const o=c.createOscillator(),g=c.createGain();
        o.type="sawtooth";o.frequency.value=f;
        g.gain.setValueAtTime(.15,t+i*.35);g.gain.exponentialRampToValueAtTime(.01,t+i*.35+.3);
        o.connect(g);g.connect(c.destination);o.start(t+i*.35);o.stop(t+i*.35+.35);
      });
    });
  }
  towLaugh(){
    this._play(c=>{
      const t=c.currentTime;
      const pitches=[300,380,300,420,300,380,340];
      pitches.forEach((f,i)=>{
        const o=c.createOscillator(),g=c.createGain();
        o.type="triangle";o.frequency.value=f;
        g.gain.setValueAtTime(.12,t+i*.12);g.gain.exponentialRampToValueAtTime(.01,t+i*.12+.1);
        o.connect(g);g.connect(c.destination);o.start(t+i*.12);o.stop(t+i*.12+.12);
      });
    });
  }
  rustyWheels(){
    this._play(c=>{
      const t=c.currentTime;
      // Squeaky rusty wheel sound - oscillating high-pitched squeak
      for(let i=0;i<6;i++){
        const o=c.createOscillator(),g=c.createGain();
        o.type="sawtooth";
        o.frequency.setValueAtTime(800+i*50,t+i*0.4);
        o.frequency.linearRampToValueAtTime(400+i*30,t+i*0.4+0.2);
        g.gain.setValueAtTime(.06,t+i*0.4);
        g.gain.exponentialRampToValueAtTime(.005,t+i*0.4+0.35);
        o.connect(g);g.connect(c.destination);
        o.start(t+i*0.4);o.stop(t+i*0.4+0.4);
      }
    });
  }
  starChime(){
    this._play(c=>{
      const t=c.currentTime;
      const notes=[523,659,784,1047,1319];
      notes.forEach((f,i)=>{
        const o=c.createOscillator(),g=c.createGain();
        o.type="sine";o.frequency.value=f;
        g.gain.setValueAtTime(.12,t+i*.08);g.gain.exponentialRampToValueAtTime(.01,t+i*.08+.25);
        o.connect(g);g.connect(c.destination);o.start(t+i*.08);o.stop(t+i*.08+.3);
      });
    });
  }
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
    // Voluminous hair with body
    ctx.beginPath();ctx.ellipse(cx,cy-14,38,32,0,Math.PI,0);ctx.fill();
    // Side volume - thick flowing hair down past shoulders
    ctx.beginPath();ctx.ellipse(cx-32,cy+10,16,45,0.1,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx+32,cy+10,16,45,-0.1,0,Math.PI*2);ctx.fill();
    // Hair draping over shoulders
    ctx.fillRect(cx-38,cy-14,14,70);
    ctx.fillRect(cx+24,cy-14,14,70);
    // Inner wave texture
    ctx.fillStyle=hairHi;
    ctx.beginPath();ctx.ellipse(cx-30,cy+25,8,20,0.15,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx+30,cy+25,8,20,-0.15,0,Math.PI*2);ctx.fill();
    // Hair shine
    ctx.fillStyle="rgba(255,255,255,0.08)";
    ctx.fillRect(cx-10,cy-38,8,20);
    ctx.beginPath();ctx.ellipse(cx+18,cy-20,4,12,0,0,Math.PI*2);ctx.fill();
  } else {
    // Axel - poofy full hair on top
    ctx.beginPath();ctx.ellipse(cx,cy-20,35,28,0,Math.PI,0);ctx.fill();
    // Poofy volume on top - rounded, thick
    ctx.beginPath();ctx.ellipse(cx,cy-32,30,18,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx-8,cy-36,18,12,0.2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx+8,cy-36,18,12,-0.2,0,Math.PI*2);ctx.fill();
    // Sides
    ctx.fillRect(cx-33,cy-20,7,18);ctx.fillRect(cx+26,cy-20,7,18);
    // Shine highlight
    ctx.fillStyle="rgba(255,255,255,0.07)";
    ctx.beginPath();ctx.ellipse(cx-6,cy-38,8,10,0,0,Math.PI*2);ctx.fill();
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
  // Mouth/smile - big happy smile
  ctx.fillStyle="#c0604a";
  ctx.beginPath();ctx.ellipse(cx,cy+24,12,6,0,0,Math.PI);ctx.fill();
  // Teeth showing in smile
  ctx.fillStyle="rgba(255,255,255,0.8)";
  ctx.fillRect(cx-7,cy+24,14,3);
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
  // Name on shirt
  ctx.fillStyle="#fff";ctx.font="bold 14px sans-serif";ctx.textAlign="center";
  ctx.fillText(who==="jade"?"JADE":"AXEL",cx,cy+72);
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
    const hlGeo = new THREE.SphereGeometry(0.22, 10, 10);
    // Eyes (headlights) - Cars movie style
    const eyeWhiteMat = new THREE.MeshPhongMaterial({color:0xffffff, shininess:100});
    const pupilMat = new THREE.MeshPhongMaterial({color:0x2196f3, emissive:0x1565c0, emissiveIntensity:0.3});
    const pupilBlack = new THREE.MeshPhongMaterial({color:0x000000});
    [-0.8,0.8].forEach(x=>{
      // Eye white
      const eyeW = new THREE.Mesh(hlGeo, eyeWhiteMat);
      eyeW.position.set(x, 0.75, CAR_LEN/2); eyeW.name="headlight"; g.add(eyeW);
      // Iris
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.12,8,8), pupilMat);
      iris.position.set(x, 0.75, CAR_LEN/2+0.15); g.add(iris);
      // Pupil
      const pup = new THREE.Mesh(new THREE.SphereGeometry(0.06,6,6), pupilBlack);
      pup.position.set(x, 0.75, CAR_LEN/2+0.18); g.add(pup);
      // Eye highlight
      const hi = new THREE.Mesh(new THREE.SphereGeometry(0.03,4,4),
        new THREE.MeshPhongMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:1}));
      hi.position.set(x-0.05, 0.8, CAR_LEN/2+0.2); g.add(hi);
    });
    // Teeth / smile on front bumper
    const teethMat = new THREE.MeshPhongMaterial({color:0xffffff});
    const mouthMat = new THREE.MeshPhongMaterial({color:0x333333});
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(1.4,0.18,0.08), mouthMat);
    mouth.position.set(0, 0.42, CAR_LEN/2+0.02); g.add(mouth);
    for(let i=-3;i<=3;i++){
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.14,0.12,0.06), teethMat);
      tooth.position.set(i*0.18, 0.42, CAR_LEN/2+0.05); g.add(tooth);
    }
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
    // Driver visible in the car
    if(driverName){
      const isJade = driverName.toLowerCase()==="jade";
      const skinCol = isJade ? 0xc8956e : 0xb5845e;
      const hairCol = isJade ? 0x1a1a1a : 0x2d1b0e;
      const driverSkin = new THREE.MeshPhongMaterial({color:skinCol});
      // Head
      const dHead = new THREE.Mesh(new THREE.SphereGeometry(0.22,10,10), driverSkin);
      dHead.position.set(0, 1.65, -0.1); dHead.name="driverHead"; g.add(dHead);
      // Hair
      const dHairMat = new THREE.MeshPhongMaterial({color:hairCol});
      if(isJade){
        // Voluminous long hair
        const dHairTop = new THREE.Mesh(new THREE.SphereGeometry(0.28,8,8), dHairMat);
        dHairTop.position.set(0, 1.72, -0.18); g.add(dHairTop);
        // Side volume - hair flowing down past shoulders
        [-0.22, 0.22].forEach(x=>{
          const side = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.08,0.6,6), dHairMat);
          side.position.set(x, 1.35, -0.2); g.add(side);
        });
        // Hair draping behind
        const dHairBack = new THREE.Mesh(new THREE.BoxGeometry(0.45,0.5,0.14), dHairMat);
        dHairBack.position.set(0, 1.4, -0.28); g.add(dHairBack);
      } else {
        // Poofy full hair on top
        const dHairBase = new THREE.Mesh(new THREE.SphereGeometry(0.26,8,8), dHairMat);
        dHairBase.position.set(0, 1.75, -0.13); g.add(dHairBase);
        // Extra poof volume
        const dHairPoof = new THREE.Mesh(new THREE.SphereGeometry(0.2,8,8), dHairMat);
        dHairPoof.position.set(0, 1.88, -0.1); g.add(dHairPoof);
      }
      // Eyes
      const eyeW = new THREE.MeshPhongMaterial({color:0xffffff});
      const eyeP = new THREE.MeshPhongMaterial({color:0x3e2723});
      [-0.08, 0.08].forEach(x=>{
        const ew = new THREE.Mesh(new THREE.SphereGeometry(0.05,6,6), eyeW);
        ew.position.set(x, 1.68, 0.12); g.add(ew);
        const ep = new THREE.Mesh(new THREE.SphereGeometry(0.025,4,4), eyeP);
        ep.position.set(x, 1.68, 0.15); g.add(ep);
      });
      // Shoulders/torso (just visible above car body)
      const shirtCol = isJade ? 0xe91e63 : 0x1565c0;
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.22,0.35,6),
        new THREE.MeshPhongMaterial({color:shirtCol}));
      torso.position.set(0, 1.25, -0.1); g.add(torso);
    }
  }
  return g;
}

function buildEnemyCar(){
  const colors = [0x1a1a2e, 0x16213e, 0x0f3460, 0x2d132c, 0x1b1b2f,
    0x4a148c, 0x880e4f, 0x1a237e, 0x006064, 0x3e2723, 0x263238];
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

function buildPoliceCar(){
  const g = buildCar(0x1565c0, false, null);
  // White doors
  const doorMat = new THREE.MeshPhongMaterial({color:0xffffff});
  [-1.12,1.12].forEach(x=>{
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.15,0.5),doorMat);
    door.position.set(x,0.7,0); door.rotation.y=x>0?Math.PI/2:-Math.PI/2; g.add(door);
  });
  // Light bar on roof
  const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.4,0.12,0.5),new THREE.MeshPhongMaterial({color:0x333333}));
  barBase.position.set(0,1.62,-0.1); g.add(barBase);
  const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.12,6,6),
    new THREE.MeshPhongMaterial({color:0xff0000,emissive:0xff0000,emissiveIntensity:1}));
  redLight.position.set(-0.35,1.75,-0.1); redLight.name="policeRed"; g.add(redLight);
  const blueLight = new THREE.Mesh(new THREE.SphereGeometry(0.12,6,6),
    new THREE.MeshPhongMaterial({color:0x2196f3,emissive:0x2196f3,emissiveIntensity:1}));
  blueLight.position.set(0.35,1.75,-0.1); blueLight.name="policeBlue"; g.add(blueLight);
  // CPD text
  const sc=document.createElement("canvas");sc.width=64;sc.height=20;
  const sx=sc.getContext("2d");
  sx.fillStyle="#1565c0";sx.fillRect(0,0,64,20);
  sx.fillStyle="#fff";sx.font="bold 14px sans-serif";sx.textAlign="center";
  sx.fillText("CPD",32,16);
  const tex=new THREE.CanvasTexture(sc);
  const decal=new THREE.Mesh(new THREE.PlaneGeometry(0.8,0.25),new THREE.MeshBasicMaterial({map:tex}));
  decal.position.set(0,0.75,CAR_LEN/2+0.02); g.add(decal);
  g.userData.isPolice=true;
  return g;
}
/* 3D Pickups */
function buildGasCan(){
  const g = new THREE.Group();
  const bm = new THREE.MeshPhongMaterial({color:0xd32f2f});
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.35), bm);
  body.position.y=0.5; g.add(body);
  const hm = new THREE.MeshPhongMaterial({color:0x333333});
  const h1=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.08,0.08),hm);h1.position.set(0,0.95,0);g.add(h1);
  const h2=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.2,0.08),hm);h2.position.set(-0.16,0.85,0);g.add(h2);
  const h3=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.2,0.08),hm);h3.position.set(0.16,0.85,0);g.add(h3);
  const nz = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.06,0.25,6),hm);
  nz.position.set(0.25,0.95,0);nz.rotation.z=-0.5;g.add(nz);
  const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.35,0.25),new THREE.MeshPhongMaterial({color:0xffeb3b}));
  lb.position.set(0,0.5,0.18);g.add(lb);
  g.userData.type="fuel"; return g;
}
function buildStarPickup(){
  const g = new THREE.Group();
  // Star emoji sprite
  const cnv=document.createElement("canvas");cnv.width=64;cnv.height=64;
  const ctx=cnv.getContext("2d");
  ctx.font="48px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillText("\u2B50",32,32);
  const tex=new THREE.CanvasTexture(cnv);
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true}));
  spr.scale.set(1.5,1.5,1);spr.position.y=1;
  g.add(spr);
  // Glow ring
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.5,0.6,16),
    new THREE.MeshPhongMaterial({color:0xffe082,emissive:0xffcc02,emissiveIntensity:0.4,transparent:true,opacity:0.5,side:THREE.DoubleSide}));
  ring.position.y=1;ring.rotation.x=Math.PI/2;g.add(ring);
  g.userData.type="star"; return g;
}

/* Loco objects */
function buildTree(){
  const g=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.2,.3,2,8),new THREE.MeshPhongMaterial({color:0x5d4037}));
  trunk.position.set(0,1,0);g.add(trunk);
  const foliage=new THREE.Mesh(new THREE.SphereGeometry(1.2,8,8),new THREE.MeshPhongMaterial({color:0x2e7d32}));
  foliage.position.set(0,2.5,0);g.add(foliage);
  g.userData.type="tree";return g;
}
function buildHydrant(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.25,.3,.8,8),new THREE.MeshPhongMaterial({color:0xd32f2f}));
  body.position.set(0,.4,0);g.add(body);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.28,8,8),new THREE.MeshPhongMaterial({color:0xb71c1c}));
  cap.position.set(0,.85,0);g.add(cap);
  g.userData.type="hydrant";return g;
}
function buildTrashcan(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.35,.3,.9,8),new THREE.MeshPhongMaterial({color:0x616161}));
  body.position.set(0,.45,0);g.add(body);
  const lid=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.06,8),new THREE.MeshPhongMaterial({color:0x757575}));
  lid.position.set(0,.93,0);g.add(lid);
  g.userData.type="trashcan";return g;
}
function buildCone(){
  const g=new THREE.Group();
  const cone=new THREE.Mesh(new THREE.ConeGeometry(.25,.7,8),new THREE.MeshPhongMaterial({color:0xff6f00}));
  cone.position.set(0,.35,0);g.add(cone);
  g.userData.type="cone";return g;
}
function buildBarrel(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,.8,10),new THREE.MeshPhongMaterial({color:0x4e342e}));
  body.position.set(0,.4,0);g.add(body);
  g.userData.type="barrel";return g;
}
function buildChicken(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.SphereGeometry(.35,8,8),new THREE.MeshPhongMaterial({color:0xfff9c4}));b.position.y=.5;b.scale.set(1,.9,1.2);g.add(b);const hd=new THREE.Mesh(new THREE.SphereGeometry(.18,8,8),new THREE.MeshPhongMaterial({color:0xfff9c4}));hd.position.set(0,.9,.25);g.add(hd);const bk=new THREE.Mesh(new THREE.ConeGeometry(.06,.15,6),new THREE.MeshPhongMaterial({color:0xff8f00}));bk.position.set(0,.88,.45);bk.rotation.x=-Math.PI/2;g.add(bk);const cmb=new THREE.Mesh(new THREE.SphereGeometry(.08,6,6),new THREE.MeshPhongMaterial({color:0xd32f2f}));cmb.position.set(0,1.08,.2);g.add(cmb);g.userData.type="chicken";return g;}

function buildRamp(){
  const g = new THREE.Group();
  const m=new THREE.Mesh(new THREE.BoxGeometry(3,.5,2.5),new THREE.MeshPhongMaterial({color:0xffd600,emissive:0xffa000,emissiveIntensity:.3}));
  m.rotation.x=.2;m.position.y=.3;g.add(m);
  const ar=new THREE.Mesh(new THREE.ConeGeometry(0.3,0.5,3),new THREE.MeshPhongMaterial({color:0xff6f00,emissive:0xff6f00,emissiveIntensity:.5}));
  ar.position.set(0,0.7,0);ar.rotation.x=-Math.PI/2;g.add(ar);
  g.userData.type="ramp"; return g;
}

/* Tow truck - rusty brown, Mater-inspired */
function buildTowTruck(){
  const g = new THREE.Group();
  const rustMat = new THREE.MeshPhongMaterial({color:0x8B5E3C, shininess:20});
  const rustDark = new THREE.MeshPhongMaterial({color:0x6B3F1F, shininess:10});
  // Truck bed (flat back)
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 3.5), rustMat);
  bed.position.set(0, 0.55, -1); g.add(bed);
  // Cab
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 2), rustMat);
  cab.position.set(0, 1.15, 1.2); g.add(cab);
  // Cab roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 2.1), rustDark);
  roof.position.set(0, 1.8, 1.2); g.add(roof);
  // Windshield
  const wsMat = new THREE.MeshPhongMaterial({color:0x90caf9, transparent:true, opacity:0.4});
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.8), wsMat);
  ws.position.set(0, 1.4, 2.21); g.add(ws);
  // Rusty patches (darker spots)
  const patch1 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), rustDark);
  patch1.position.set(-0.6, 0.6, -2.76); g.add(patch1);
  const patch2 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), rustDark);
  patch2.position.set(0.8, 1.0, 2.21); g.add(patch2);
  // Headlights (slightly crooked for character)
  const hlMat = new THREE.MeshPhongMaterial({color:0xffffaa, emissive:0xffff44, emissiveIntensity:0.8});
  const hl1 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), hlMat);
  hl1.position.set(-0.8, 0.9, 2.22); g.add(hl1);
  const hl2 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), hlMat);
  hl2.position.set(0.8, 0.95, 2.22); g.add(hl2);
  // Tow hook/crane arm
  const armMat = new THREE.MeshPhongMaterial({color:0x555555});
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 2.5), armMat);
  arm.position.set(0, 1.0, -2.0); arm.rotation.x = -0.2; g.add(arm);
  // Vertical crane post
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.5, 0.15), armMat);
  post.position.set(0, 1.2, -0.5); g.add(post);
  // Hook
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 6, 8, Math.PI), armMat);
  hook.position.set(0, 0.5, -3.1); hook.rotation.x = Math.PI; g.add(hook);
  // Chain (small cylinders)
  for(let i = 0; i < 4; i++){
    const link = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 6), armMat);
    link.position.set(0, 0.6 + i*0.15, -3.1);
    link.rotation.x = i % 2 === 0 ? 0.3 : -0.3;
    g.add(link);
  }
  // Wheels (bigger truck wheels)
  const tireMat = new THREE.MeshPhongMaterial({color:0x1a1a1a});
  const rimMat2 = new THREE.MeshPhongMaterial({color:0x999999});
  [[-1.2,0.4,1.5],[-1.2,0.4,-1.5],[1.2,0.4,1.5],[1.2,0.4,-1.5]].forEach(p=>{
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,0.35,12), tireMat);
    tire.rotation.z = Math.PI/2; tire.position.set(p[0],p[1],p[2]); g.add(tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.25,0.36,8), rimMat2);
    rim.rotation.z = Math.PI/2; rim.position.set(p[0],p[1],p[2]); g.add(rim);
  });
  // Buck teeth / smile on front (character touch)
  const toothMat = new THREE.MeshPhongMaterial({color:0xffffff});
  const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.05), toothMat);
  t1.position.set(-0.08, 0.55, 2.23); g.add(t1);
  const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.05), toothMat);
  t2.position.set(0.08, 0.55, 2.23); g.add(t2);
  // Eyes above windshield (on the roof like Mater)
  const eyeWhite = new THREE.MeshPhongMaterial({color:0xffffff});
  const eyePupil = new THREE.MeshPhongMaterial({color:0x3e2723});
  [-0.35, 0.35].forEach(x => {
    const ew = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), eyeWhite);
    ew.position.set(x, 1.95, 1.8); g.add(ew);
    const ep = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), eyePupil);
    ep.position.set(x, 1.95, 1.95); g.add(ep);
  });
  return g;
}

/* Finish line flag */
function buildFinishFlag(){
  const g = new THREE.Group();
  // Pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,6,8),new THREE.MeshPhongMaterial({color:0x888888}));
  pole.position.y=3; g.add(pole);
  // Checkered flag attached to pole
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
  flag.position.set(1,5.4,0); flag.name="flag"; g.add(flag);
  // City of Chicago flag - second pole
  const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,5.5,8),new THREE.MeshPhongMaterial({color:0x888888}));
  pole2.position.set(4,2.75,0); g.add(pole2);
  // Chicago flag: white with two blue stripes and four red stars
  const cc=document.createElement("canvas");cc.width=96;cc.height=60;
  const cx2=cc.getContext("2d");
  cx2.fillStyle="#fff";cx2.fillRect(0,0,96,60);
  cx2.fillStyle="#4fc3f7";cx2.fillRect(0,12,96,8);cx2.fillRect(0,40,96,8);
  cx2.fillStyle="#ef5350";cx2.font="14px sans-serif";
  const starX=[18,36,54,72];
  starX.forEach(sx=>{cx2.fillText("\u2736",sx-5,34);});
  const chiTex=new THREE.CanvasTexture(cc);
  const chiMat=new THREE.MeshPhongMaterial({map:chiTex,side:THREE.DoubleSide});
  const chiFlag=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.1),chiMat);
  chiFlag.position.set(5,4.8,0); chiFlag.name="chiFlag"; g.add(chiFlag);
  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.4,0.3,8),new THREE.MeshPhongMaterial({color:0x333333}));
  base.position.y=0.15; g.add(base);
  const base2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.35,0.3,8),new THREE.MeshPhongMaterial({color:0x333333}));
  base2.position.set(4,0.15,0); g.add(base2);
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
  sx.fillStyle="#d32f2f";sx.font="bold 18px sans-serif";sx.textAlign="center";
  sx.fillText("ZACATACOS",64,24);
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

function buildBirrieria(){
  const g = new THREE.Group();
  const bm = new THREE.MeshPhongMaterial({color:0x4e342e});
  const bldg = new THREE.Mesh(new THREE.BoxGeometry(6,4,4),bm);
  bldg.position.y=2; g.add(bldg);
  // Awning - green
  const aw = new THREE.Mesh(new THREE.BoxGeometry(6.5,0.15,1.5),
    new THREE.MeshPhongMaterial({color:0x2e7d32}));
  aw.position.set(0,3.2,2.5); aw.rotation.x=0.15; g.add(aw);
  // Sign
  const sc=document.createElement("canvas");sc.width=200;sc.height=32;
  const sx=sc.getContext("2d");
  sx.fillStyle="#fff3e0";sx.fillRect(0,0,200,32);
  sx.fillStyle="#1b5e20";sx.font="bold 14px sans-serif";sx.textAlign="center";
  sx.fillText("Birrieria Zaragoza",100,24);
  const signTex=new THREE.CanvasTexture(sc);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(3.2,0.6),new THREE.MeshBasicMaterial({map:signTex}));
  sign.position.set(0,4.3,2.01); g.add(sign);
  // Door
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1,2),new THREE.MeshPhongMaterial({color:0x3e2723}));
  door.position.set(0,1,2.01); g.add(door);
  // Windows
  const wm = new THREE.MeshPhongMaterial({color:0xbbdefb,emissive:0x90caf9,emissiveIntensity:0.3});
  [-1.8,1.8].forEach(x=>{
    const win=new THREE.Mesh(new THREE.PlaneGeometry(0.8,0.8),wm);
    win.position.set(x,2.5,2.01); g.add(win);
  });
  // Steam puff on roof
  const steam=new THREE.Mesh(new THREE.SphereGeometry(0.5,6,6),
    new THREE.MeshPhongMaterial({color:0xffffff,transparent:true,opacity:0.4}));
  steam.position.set(1,4.6,0); g.add(steam);
  g.userData.type="birrieria"; return g;
}

function buildPaletero(){
  const g = new THREE.Group();
  const skinMat = new THREE.MeshPhongMaterial({color:0xc8956e});
  // Cart
  const cart = new THREE.Mesh(new THREE.BoxGeometry(1.2,1,1.5),
    new THREE.MeshPhongMaterial({color:0x1565c0}));
  cart.position.set(0,0.6,0); g.add(cart);
  // Umbrella
  const umb = new THREE.Mesh(new THREE.ConeGeometry(1.2,0.4,8),
    new THREE.MeshPhongMaterial({color:0xffeb3b}));
  umb.position.set(0,2.5,0); g.add(umb);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,1.8,6),
    new THREE.MeshPhongMaterial({color:0x666666}));
  pole.position.set(0,1.5,0); g.add(pole);
  // Ice cream sign
  const isc=document.createElement("canvas");isc.width=64;isc.height=24;
  const ix=isc.getContext("2d");
  ix.fillStyle="#e3f2fd";ix.fillRect(0,0,64,24);
  ix.fillStyle="#1565c0";ix.font="bold 12px sans-serif";ix.textAlign="center";
  ix.fillText("PALETAS",32,18);
  const isTex=new THREE.CanvasTexture(isc);
  const isSign=new THREE.Mesh(new THREE.PlaneGeometry(1,0.35),new THREE.MeshBasicMaterial({map:isTex}));
  isSign.position.set(0,1.2,0.76); g.add(isSign);
  // Cart wheels
  const wMat = new THREE.MeshPhongMaterial({color:0x333333});
  [-0.55,0.55].forEach(x=>{
    const wh=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.1,8),wMat);
    wh.rotation.z=Math.PI/2; wh.position.set(x,0.2,0); g.add(wh);
  });
  // Person
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.22,0.8,6),
    new THREE.MeshPhongMaterial({color:0xffffff}));
  body.position.set(-1,0.7,0); g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.18,8,8),skinMat);
  head.position.set(-1,1.3,0); g.add(head);
  // Straw hat
  const hat=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.35,0.1,8),
    new THREE.MeshPhongMaterial({color:0xf5deb3}));
  hat.position.set(-1,1.5,0); g.add(hat);
  g.userData.type="paletero"; return g;
}

function buildFishSeller(){
  const g = new THREE.Group();
  const skinMat = new THREE.MeshPhongMaterial({color:0xb5845e});
  // Table
  const table=new THREE.Mesh(new THREE.BoxGeometry(2.5,0.1,1.5),new THREE.MeshPhongMaterial({color:0x795548}));
  table.position.set(0,0.8,0); g.add(table);
  // Table legs
  [[-1,0.4,-0.5],[-1,0.4,0.5],[1,0.4,-0.5],[1,0.4,0.5]].forEach(p=>{
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.8,6),new THREE.MeshPhongMaterial({color:0x5d4037}));
    leg.position.set(p[0],p[1],p[2]); g.add(leg);
  });
  // Fish on table (silver elongated shapes)
  const fishMat=new THREE.MeshPhongMaterial({color:0xb0bec5,shininess:60});
  for(let i=0;i<4;i++){
    const fish=new THREE.Mesh(new THREE.SphereGeometry(0.15,6,4),fishMat);
    fish.scale.set(1,0.5,2);
    fish.position.set(-0.6+i*0.45,0.95,0); g.add(fish);
  }
  // Man with mustache
  const mBody=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.25,0.9,6),
    new THREE.MeshPhongMaterial({color:0x37474f}));
  mBody.position.set(0,0.45,-1); g.add(mBody);
  const mHead=new THREE.Mesh(new THREE.SphereGeometry(0.2,8,8),skinMat);
  mHead.position.set(0,1.15,-1); g.add(mHead);
  // Long brown mustache
  const musMat=new THREE.MeshPhongMaterial({color:0x4e342e});
  [-0.1,0.1].forEach(x=>{
    const mus=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.04,0.06),musMat);
    mus.position.set(x,1.08,-0.82); g.add(mus);
  });
  // Hat
  const hat=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.18,0.15,8),
    new THREE.MeshPhongMaterial({color:0xffffff}));
  hat.position.set(0,1.35,-1); g.add(hat);
  // Woman with long hair
  const wBody=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.22,0.8,6),
    new THREE.MeshPhongMaterial({color:0xab47bc}));
  wBody.position.set(1.5,0.4,-1); g.add(wBody);
  const wHead=new THREE.Mesh(new THREE.SphereGeometry(0.18,8,8),
    new THREE.MeshPhongMaterial({color:0xc8956e}));
  wHead.position.set(1.5,1.05,-1); g.add(wHead);
  // Long flowing hair
  const hairMat=new THREE.MeshPhongMaterial({color:0x1a1a1a});
  const hair=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.7,0.15),hairMat);
  hair.position.set(1.5,0.85,-1.1); g.add(hair);
  const hairTip=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.3,0.1),hairMat);
  hairTip.position.set(1.5,0.4,-1.1); g.add(hairTip);
  g.userData.type="fish"; return g;
}

function buildTamaleStand(){
  const g = new THREE.Group();
  // Small cart/stand
  const cart=new THREE.Mesh(new THREE.BoxGeometry(1.5,1,1),new THREE.MeshPhongMaterial({color:0x8d6e63}));
  cart.position.set(0,0.5,0); g.add(cart);
  // Steam pot on top
  const pot=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.4,0.5,8),
    new THREE.MeshPhongMaterial({color:0x757575}));
  pot.position.set(0,1.3,0); g.add(pot);
  // Steam puffs
  for(let i=0;i<3;i++){
    const s=new THREE.Mesh(new THREE.SphereGeometry(0.15+i*0.05,6,6),
      new THREE.MeshPhongMaterial({color:0xfafafa,transparent:true,opacity:0.35-i*0.08}));
    s.position.set(Math.sin(i)*0.15, 1.7+i*0.3, Math.cos(i)*0.15); g.add(s);
  }
  // Sign
  const sc=document.createElement("canvas");sc.width=96;sc.height=28;
  const sx=sc.getContext("2d");
  sx.fillStyle="#fff8e1";sx.fillRect(0,0,96,28);
  sx.fillStyle="#e65100";sx.font="bold 14px sans-serif";sx.textAlign="center";
  sx.fillText("TAMALES",48,20);
  const sTex=new THREE.CanvasTexture(sc);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.2,0.35),new THREE.MeshBasicMaterial({map:sTex}));
  sign.position.set(0,1.1,0.51); g.add(sign);
  // Vendor woman
  const skinMat=new THREE.MeshPhongMaterial({color:0xc8956e});
  const vBody=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.25,0.8,6),
    new THREE.MeshPhongMaterial({color:0xef5350}));
  vBody.position.set(-1,0.4,0); g.add(vBody);
  const vHead=new THREE.Mesh(new THREE.SphereGeometry(0.18,8,8),skinMat);
  vHead.position.set(-1,1.05,0); g.add(vHead);
  // Apron
  const apron=new THREE.Mesh(new THREE.PlaneGeometry(0.4,0.5),
    new THREE.MeshPhongMaterial({color:0xffffff,side:THREE.DoubleSide}));
  apron.position.set(-1,0.35,0.13); g.add(apron);
  g.userData.type="tamale"; return g;
}

function buildDancers(){
  const g = new THREE.Group();
  const dressColors=[0xe91e63,0xffeb3b,0x4caf50,0xff9800,0x9c27b0];
  const skinMat=new THREE.MeshPhongMaterial({color:0xc8956e});
  for(let i=0;i<4;i++){
    const dx=-2+i*1.5, dz=Math.sin(i)*0.5;
    // Body (dress)
    const dress=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.4,0.9,8),
      new THREE.MeshPhongMaterial({color:dressColors[i%5]}));
    dress.position.set(dx,0.45,dz); g.add(dress);
    // Head
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.16,8,8),skinMat);
    head.position.set(dx,1.1,dz); g.add(head);
    // Arms out (dancing)
    const armMat=new THREE.MeshPhongMaterial({color:dressColors[i%5]});
    const ang=i*0.5;
    [-0.3,0.3].forEach(side=>{
      const arm=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.5,4),armMat);
      arm.position.set(dx+side*1.2,0.9,dz);
      arm.rotation.z=side>0?-0.8:0.8;
      g.add(arm);
    });
  }
  // Music notes (floating)
  const noteMat=new THREE.MeshPhongMaterial({color:0xffeb3b,emissive:0xffeb3b,emissiveIntensity:0.3});
  for(let i=0;i<3;i++){
    const note=new THREE.Mesh(new THREE.SphereGeometry(0.08,4,4),noteMat);
    note.position.set(-1+i*1.5, 1.8+i*0.2, Math.sin(i)*0.3);
    g.add(note);
  }
  g.userData.type="dancers"; return g;
}

const STREET_NAMES=["Pulaski","Cicero","Ashland","Belmont","Division"];
let _streetIdx=0;
function buildStreetSign(){
  const g = new THREE.Group();
  // Pole
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,3.5,6),
    new THREE.MeshPhongMaterial({color:0x616161}));
  pole.position.set(0,1.75,0); g.add(pole);
  // Sign plate
  const name=STREET_NAMES[_streetIdx%STREET_NAMES.length];
  _streetIdx++;
  const sc=document.createElement("canvas");sc.width=128;sc.height=32;
  const sx=sc.getContext("2d");
  sx.fillStyle="#1b5e20";sx.fillRect(0,0,128,32);
  sx.fillStyle="#ffffff";sx.font="bold 14px sans-serif";sx.textAlign="center";
  sx.fillText(name+" St",64,22);
  const sTex=new THREE.CanvasTexture(sc);
  const sign=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.4,0.06),new THREE.MeshBasicMaterial({map:sTex}));
  sign.position.set(0,3.4,0); g.add(sign);
  // Back side
  const back=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.4,0.06),
    new THREE.MeshPhongMaterial({color:0x1b5e20}));
  back.position.set(0,3.4,-0.04); g.add(back);
  g.userData.type="sign"; return g;
}

function buildChicagoRiver(){
  const g = new THREE.Group();
  // River water - runs perpendicular to road, visible on the sides
  const waterMat = new THREE.MeshPhongMaterial({color:0x1b8a6b, transparent:true, opacity:0.85, shininess:120});
  const water = new THREE.Mesh(new THREE.PlaneGeometry(18, 6), waterMat);
  water.rotation.x = -Math.PI/2; water.position.set(0, -0.15, 0); g.add(water);
  // Bridge railings at road edges only (low, no obstruction)
  const railMat = new THREE.MeshPhongMaterial({color:0x616161});
  [-ROAD_W/2-0.5, ROAD_W/2+0.5].forEach(x => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 6), railMat);
    rail.position.set(x, 0.25, 0); g.add(rail);
    for(let z=-2.5; z<=2.5; z+=1.25){
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.6,6), railMat);
      post.position.set(x, 0.3, z); g.add(post);
    }
  });
  // Water shimmer
  for(let i=0;i<8;i++){
    const shimmer = new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.2),
      new THREE.MeshPhongMaterial({color:0x80cbc4,emissive:0x4db6ac,emissiveIntensity:0.3,transparent:true,opacity:0.5}));
    shimmer.rotation.x=-Math.PI/2;
    shimmer.position.set((Math.random()-0.5)*16, -0.12, (Math.random()-0.5)*5);
    g.add(shimmer);
  }
  g.userData.type="river"; return g;
}

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
  const wb=new THREE.Mesh(new THREE.BoxGeometry(8,35,6),mat);wb.position.set(0,17.5,0);g.add(wb);
  const wm2=new THREE.Mesh(new THREE.BoxGeometry(6,10,5),mat);wm2.position.set(0,40,0);g.add(wm2);
  const wt=new THREE.Mesh(new THREE.BoxGeometry(4,8,4),mat);wt.position.set(0,49,0);g.add(wt);
  const am=new THREE.MeshPhongMaterial({color:0x666666});
  const wa1=new THREE.Mesh(new THREE.CylinderGeometry(.12,.1,20,6),am);wa1.position.set(-1,63,0);g.add(wa1);
  const wa2=new THREE.Mesh(new THREE.CylinderGeometry(.1,.08,16,6),am);wa2.position.set(1,61,0);g.add(wa2);
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
    {x:-55,w:4,h:12,d:3},{x:25,w:3,h:14,d:3},{x:45,w:5,h:21,d:4},{x:-45,w:6,h:17,d:4},
    {x:-70,w:5,h:20,d:4},{x:-65,w:4,h:14,d:3},{x:65,w:6,h:23,d:5},{x:70,w:4,h:16,d:3},
    {x:-35,w:3,h:11,d:3},{x:35,w:4,h:13,d:3},{x:55,w:3,h:10,d:3},{x:-25,w:5,h:18,d:4},
    {x:-75,w:7,h:22,d:5},{x:75,w:5,h:19,d:4},{x:-80,w:4,h:15,d:3},{x:80,w:6,h:17,d:4}
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
    // Voluminous hair
    ctx.beginPath();ctx.ellipse(cx,cy-16,50,40,0,Math.PI,0);ctx.fill();
    // Flowing hair down past shoulders
    ctx.beginPath();ctx.ellipse(cx-44,cy+10,18,50,0.1,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx+44,cy+10,18,50,-0.1,0,Math.PI*2);ctx.fill();
    ctx.fillRect(cx-48,cy-16,16,75);ctx.fillRect(cx+32,cy-16,16,75);
  } else {
    // Poofy rounded hair
    ctx.beginPath();ctx.ellipse(cx,cy-22,44,28,0,Math.PI,0);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx,cy-34,36,20,0,0,Math.PI*2);ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(cx-50,384);ctx.quadraticCurveTo(cx-50,cy+52,cx-12,cy+52);
  ctx.lineTo(cx+12,cy+52);ctx.quadraticCurveTo(cx+50,cy+52,cx+50,384);
  ctx.closePath();ctx.fill();
  // Driver name glowing below silhouette
  const name=who==="jade"?"JADE":"AXEL";
  ctx.font="bold 36px sans-serif";ctx.textAlign="center";
  ctx.fillStyle=who==="jade"?"rgba(233,30,99,0.5)":"rgba(21,101,192,0.5)";
  ctx.shadowColor=who==="jade"?"#e91e63":"#1565c0";
  ctx.shadowBlur=15;
  ctx.fillText(name,128,280);
  ctx.shadowBlur=0;
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
    const gndMat = new THREE.MeshPhongMaterial({color:0x3a3a3a});
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
    // Crash/tow animation state
    this.crashAnim = false;
    this.crashTimer = 0;
    this.towTruck = null;
    this._crashSavedX = 0;
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
    const builders=[buildRestaurant, buildBirrieria, buildFleaMarket, buildPark,
      buildPaletero, buildFishSeller, buildTamaleStand, buildDancers];
    this._sceneryCount = (this._sceneryCount||0)+1;
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
    // Every 3rd spawn, add a street sign on one side
    if(this._sceneryCount%3===0){
      const sign=buildStreetSign();
      const side=Math.random()>0.5?1:-1;
      sign.position.set(side*(ROAD_W/2+2), 0, z+5);
      this.scene.add(sign);
      if(side<0) this.sceneryLeft.push(sign);
      else this.sceneryRight.push(sign);
    }
    // Every 7th spawn, add a Chicago River crossing
    if(this._sceneryCount%7===0){
      const river=buildChicagoRiver();
      river.position.set(0, -0.02, z-8);
      this.scene.add(river);
      this.sceneryLeft.push(river);
    }
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
    const carA=buildCar(0xcc0000,true,"Axel");carA.rotation.y=Math.PI;carA.position.set(-8,0,-30);this.scene.add(carA);this._introCars.push(carA);
    const carJ=buildCar(0x6a1b9a,true,"Jade");carJ.rotation.y=Math.PI;carJ.position.set(8,0,-30);this.scene.add(carJ);this._introCars.push(carJ);
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
    this._missingWheelSide=0;
    if(this._sparks){this.scene.remove(this._sparks);this._sparks=null;}
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
    this.playerCar.rotation.y=Math.PI; // face forward (toward -z)
    this.playerCar.position.set(0,0,0);
    this.scene.add(this.playerCar);
    this.camera.position.set(0,6,12);this.camera.lookAt(0,1,-20);
    sfx.init();sfx.music();sfx.engine(this.speed);
  }

  update(dt){
    if(this.state==="intro"){this._updateIntro(dt);return;}
    if(this.state==="victory"){this._updateVictory(dt);return;}
    if(this.state==="crashing"){this._updateCrashAnim(dt);return;}
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
      const enemy=Math.random()<0.15?buildPoliceCar():buildEnemyCar();
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
      // Police lights blink
      if(o.userData.isPolice){
        o.traverse(c=>{
          if(c.name==="policeRed")c.material.emissiveIntensity=Math.sin(Date.now()*0.01)>0?1:0.1;
          if(c.name==="policeBlue")c.material.emissiveIntensity=Math.sin(Date.now()*0.01)>0?0.1:1;
        });
      }
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
        else if(type==="star"){this.score+=150;sfx.starChime();this.invincible=Math.max(this.invincible,4);}
        else if(type==="ramp"&&!this.airborne){this.airborne=true;this.jumpVelocity=12;this.jumpY=0.1;sfx.jump();this.speed+=10;}
        if(type!=="ramp"){this.scene.remove(r);this.pickups.splice(i,1);}
      }
    }
    if(this.invincible>0){this.invincible-=dt;if(this.playerCar)this.playerCar.visible=Math.sin(Date.now()*0.02)>0;}
    else if(this.playerCar)this.playerCar.visible=true;
    this.score+=effectiveSpeed*dt*0.5;
    sfx.engine(effectiveSpeed);
    // Update sparks from missing wheel
    if(this._sparks&&this._missingWheelSide){
      const pos=this._sparks.geometry.attributes.position;
      const cx=this.playerCar.position.x+this._missingWheelSide*1.15;
      const cz=this.playerCar.position.z+1;
      for(let i=0;i<20;i++){
        pos.array[i*3]=cx+(Math.random()-.5)*.4;
        pos.array[i*3+1]=0.1+Math.random()*0.3;
        pos.array[i*3+2]=cz+Math.random()*0.8;
      }
      pos.needsUpdate=true;
      this._sparks.material.opacity=0.5+Math.sin(Date.now()*0.03)*0.4;
    }
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
    // Spawn confetti
    this._confetti=[];
    const confettiColors=[0xff0000,0xffeb3b,0x4caf50,0x2196f3,0xff9800,0xe91e63,0x9c27b0];
    for(let i=0;i<80;i++){
      const cm=new THREE.Mesh(new THREE.PlaneGeometry(0.3,0.15),
        new THREE.MeshPhongMaterial({color:confettiColors[i%confettiColors.length],side:THREE.DoubleSide}));
      cm.position.set((Math.random()-0.5)*20, 15+Math.random()*10, (Math.random()-0.5)*15);
      cm.userData.vx=(Math.random()-0.5)*2;
      cm.userData.vy=-(1+Math.random()*2);
      cm.userData.vr=Math.random()*5;
      this.scene.add(cm);
      this._confetti.push(cm);
    }
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
        if(c.name==="chiFlag"){
          c.rotation.y=Math.sin(t*4+1)*0.12;
          c.position.x=5+Math.sin(t*3.5)*0.08;
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
    // Animate confetti falling
    if(this._confetti){
      this._confetti.forEach(c=>{
        c.position.x+=c.userData.vx*dt;
        c.position.y+=c.userData.vy*dt;
        c.rotation.x+=c.userData.vr*dt;
        c.rotation.z+=c.userData.vr*0.7*dt;
        if(c.position.y<-1){c.position.y=12+Math.random()*5;c.position.x=(Math.random()-0.5)*20;}
      });
    }
    this.renderer.render(this.scene,this.camera);
    // After 5 seconds, show result
    if(t>5){
      this._endGame(true,"Race Complete!");
    }
  }

  _crash(){
    sfx.crash();this.lives--;
    if(this.lives<=0){this._endGame(false,"No lives left!");return;}
    this._removePart();
    // Clear nearby obstacles
    for(let i=this.obstacles.length-1;i>=0;i--){
      const o=this.obstacles[i];
      if(o.position.z<this.playerCar.position.z+8){this.scene.remove(o);this.obstacles.splice(i,1);}
    }
    // Begin tow truck crash animation
    this.state="crashing";
    this.crashTimer=0;
    sfx.stopEngine(); // No driving sound during tow
    this._crashSavedX=this.playerCar.position.x;
    const slideDir=this._crashSavedX>=0?1:-1;
    this._crashSlideDir=slideDir;
    // Spawn tow truck behind the player car
    this.towTruck=buildTowTruck();
    this.towTruck.position.set(this._crashSavedX, 0, this.playerCar.position.z+35);
    this.scene.add(this.towTruck);
    sfx.towHorn();sfx.towLaugh();sfx.rustyWheels();
    if(this.onCrash)this.onCrash(this.lives);
  }

  _updateCrashAnim(dt){
    this.crashTimer+=dt;
    const car=this.playerCar;
    const truck=this.towTruck;
    if(!car||!truck)return;
    const t=this.crashTimer;
    const slideDir=this._crashSlideDir;
    const roadEdge=(ROAD_W/2-2)*slideDir;

    if(t<0.5){
      // Phase 1: Car tilts and slides to side of road
      const p=t/0.5;
      car.rotation.z=slideDir*(-0.35)*p;
      car.position.x=this._crashSavedX+(roadEdge-this._crashSavedX)*p;
    } else if(t<2.0){
      // Phase 2: Tow truck drives in from behind to car position
      const p=(t-0.5)/1.5;
      const targetZ=car.position.z+5;
      truck.position.z=car.position.z+35-(35-5)*p;
      truck.position.x=car.position.x;
      // Truck wheels bounce a little
      truck.position.y=Math.abs(Math.sin(t*8))*0.05;
    } else if(t<3.5){
      // Phase 3: Tow truck pulls car back to center of road
      const p=(t-2.0)/1.5;
      const centerX=0;
      car.position.x=roadEdge+(centerX-roadEdge)*p;
      car.rotation.z=slideDir*(-0.35)*(1-p);
      truck.position.x=car.position.x;
      truck.position.z=car.position.z+5;
    } else if(t<4.2){
      // Phase 4: Tow truck drives away ahead
      const p=(t-3.5)/0.7;
      car.rotation.z=0;
      car.position.x=0;
      truck.position.z=car.position.z+5-40*p;
      truck.position.x=0;
    } else {
      // Done: remove tow truck, resume playing
      this.scene.remove(truck);
      this.towTruck=null;
      car.rotation.z=0;
      car.position.x=0;
      this.invincible=3;
      this.spawnCooldown=3;
      this.state="playing";
      sfx.engine(this.speed); // Resume engine sound
    }
    // Keep rendering during animation
    this.renderer.render(this.scene,this.camera);
  }

  _removePart(){
    if(!this.playerCar)return;
    this.damage=(this.damage||0)+1;
    const car=this.playerCar;
    if(this.damage===1){
      // First crash: headlight falls off
      let hl=null;
      car.traverse(c=>{ if(c.name==="headlight"&&c.visible&&!hl) hl=c; });
      if(hl){
        const fly=hl.clone();
        const wp=new THREE.Vector3();hl.getWorldPosition(wp);
        fly.position.copy(wp);
        this.scene.add(fly);hl.visible=false;
        let tt=0;const anim=()=>{tt+=0.016;fly.position.y+=4*0.016;fly.position.x+=(Math.random()-.5)*.4;fly.position.z+=2*0.016;fly.rotation.x+=.3;fly.rotation.z+=.2;if(tt<1.2)requestAnimationFrame(anim);else this.scene.remove(fly);};anim();
      }
    } else if(this.damage===2){
      // Second crash: wheel falls off, car tilts, sparks
      let wh=null;
      const side=Math.random()>0.5?1:-1;
      car.traverse(c=>{ if(c.name==="wheel"&&c.visible&&!wh){
        const wp=new THREE.Vector3();c.getWorldPosition(wp);
        if((side>0&&wp.x>0)||(side<0&&wp.x<0)) wh=c;
      }});
      if(!wh) car.traverse(c=>{ if(c.name==="wheel"&&c.visible&&!wh) wh=c; });
      if(wh){
        const fly=wh.clone();
        const wp=new THREE.Vector3();wh.getWorldPosition(wp);
        fly.position.copy(wp);
        this.scene.add(fly);wh.visible=false;
        let tt=0;const anim=()=>{tt+=0.016;fly.position.y+=2*0.016;fly.position.x+=side*5*0.016;fly.position.z+=3*0.016;fly.rotation.x+=.4;if(tt<1.5)requestAnimationFrame(anim);else this.scene.remove(fly);};anim();
        // Tilt car toward missing wheel side
        this._missingWheelSide=side;
        car.rotation.z=side*0.08;
        // Sparks particle
        this._sparkTimer=0;
        if(!this._sparks){
          const sparkGeo=new THREE.BufferGeometry();
          const pts=[];for(let i=0;i<20;i++) pts.push(0,0,0);
          sparkGeo.setAttribute("position",new THREE.Float32BufferAttribute(pts,3));
          this._sparks=new THREE.Points(sparkGeo,new THREE.PointsMaterial({color:0xffab00,size:0.15,transparent:true,opacity:0.9}));
          this.scene.add(this._sparks);
        }
      }
    } else {
      // Subsequent: random parts
      const removable=[];
      car.traverse(c=>{
        if((c.name==="spoiler"||c.name==="headlight"||c.name==="cabin"||c.name==="taillight")&&c.visible)removable.push(c);
      });
      if(removable.length>0){
        const part=removable[Math.floor(Math.random()*removable.length)];
        const fly=part.clone();const wp=new THREE.Vector3();part.getWorldPosition(wp);
        fly.position.copy(wp);
        this.scene.add(fly);part.visible=false;
        let tt=0;const anim=()=>{tt+=0.016;fly.position.y+=3*0.016;fly.position.x+=(Math.random()-.5)*.3;fly.rotation.x+=.2;fly.rotation.z+=.15;if(tt<1)requestAnimationFrame(anim);else this.scene.remove(fly);};anim();
      }
    }
  }

  _endGame(win,msg){
    this.state="ended";
    sfx.stopEngine();sfx.stopMusic();
    if(this.silhouette){this.scene.remove(this.silhouette);this.silhouette=null;}
    if(this.finishFlag){this.scene.remove(this.finishFlag);this.finishFlag=null;}
    // Clear confetti
    if(this._confetti){this._confetti.forEach(c=>this.scene.remove(c));this._confetti=null;}
    if(this._sparks){this.scene.remove(this._sparks);this._sparks=null;}
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

  togglePause(){
    this.paused=!this.paused;
    if(this.paused){sfx.stopEngine();sfx.stopMusic();}
    else{sfx.music();sfx.engine(this.speed);}
    return this.paused;
  }
}