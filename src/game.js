const MAX_DPR = 2;
const STAR_COUNT = 80;
const PLAYER_Y = 0.68;
const BASE_SPEED = 320;
const COURSE_BASE = 6000;

const CAR_PRESETS = [
  { id:'cometa-roja', body:'#e53935', accent:'#ffd54f', stripe:'#fff176', glow:'rgba(255,80,60,0.5)' },
  { id:'pulso-azul',  body:'#2979ff', accent:'#80d8ff', stripe:'#b3e5fc', glow:'rgba(60,140,255,0.5)' },
  { id:'volt-verde',  body:'#00c853', accent:'#b2ff59', stripe:'#f1f8e9', glow:'rgba(50,220,120,0.5)' },
  { id:'nova-drift',  body:'#aa00ff', accent:'#ea80fc', stripe:'#f3e5f5', glow:'rgba(170,0,255,0.5)' },
  { id:'turbo-sol',   body:'#ffab00', accent:'#fff9c4', stripe:'#fff8e1', glow:'rgba(255,170,0,0.5)' }
];
const FLEET = [
  { body:'#1a1a2e', accent:'#ff1744', stripe:'#4a0010', glow:'rgba(255,23,68,0.35)' },
  { body:'#0d1b2a', accent:'#ff6d00', stripe:'#3e1500', glow:'rgba(255,109,0,0.35)' },
  { body:'#1b0a2e', accent:'#d500f9', stripe:'#38006b', glow:'rgba(213,0,249,0.35)' },
  { body:'#0a1929', accent:'#00e5ff', stripe:'#004d5a', glow:'rgba(0,229,255,0.35)' }
];
const DIFF = {
  easy:   { speedMul:0.65, spawnMul:0.35, lanes:3, courseMul:0.5, lives:5 },
  medium: { speedMul:1.0,  spawnMul:0.7,  lanes:3, courseMul:1.0, lives:3 },
  hard:   { speedMul:1.35, spawnMul:1.2,  lanes:4, courseMul:1.5, lives:2 }
};

function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}
function rand(a,b){return a+Math.random()*(b-a)}
function choose(a){return a[(Math.random()*a.length)|0]}
function lerp(a,b,t){return a+(b-a)*t}

function drawRR(c,x,y,w,h,r){
  r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);
  c.arcTo(x+w,y,x+w,y+r,r);c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);
  c.lineTo(x+r,y+h);c.arcTo(x,y+h,x,y+h-r,r);c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);c.closePath();
}

export function drawAvatar(ctx,cx,cy,sz,isAxel){
  const r=sz*0.38;
  ctx.save();
  ctx.fillStyle='#c8956c';
  ctx.fillRect(cx-r*0.22,cy+r*0.85,r*0.44,r*0.45);
  ctx.fillStyle=isAxel?'#d32f2f':'#6a1b9a';
  ctx.beginPath();ctx.moveTo(cx-r*0.5,cy+r*1.15);
  ctx.quadraticCurveTo(cx,cy+r*0.95,cx+r*0.5,cy+r*1.15);
  ctx.lineTo(cx+r*0.6,cy+r*1.55);ctx.lineTo(cx-r*0.6,cy+r*1.55);ctx.fill();
  ctx.strokeStyle=isAxel?'#ffd54f':'#ce93d8';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(cx-r*0.18,cy+r*1.05);ctx.lineTo(cx,cy+r*1.25);ctx.lineTo(cx+r*0.18,cy+r*1.05);ctx.stroke();
  ctx.beginPath();ctx.ellipse(cx,cy,r*0.92,r*1.05,0,0,Math.PI*2);ctx.fillStyle='#d4a574';ctx.fill();
  ctx.fillStyle='#c8956c';
  ctx.beginPath();ctx.ellipse(cx-r*0.88,cy+r*0.05,r*0.1,r*0.15,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+r*0.88,cy+r*0.05,r*0.1,r*0.15,0,0,Math.PI*2);ctx.fill();
  if(isAxel){
    ctx.fillStyle='#2a1506';
    ctx.beginPath();ctx.ellipse(cx,cy-r*0.55,r*0.95,r*0.55,0,Math.PI,0,true);ctx.fill();
    for(let i=-4;i<=4;i++){
      const a=-Math.PI/2+i*0.16;const tip=r*(1.05+Math.abs(i)*0.03);
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a-0.09)*r*0.82,cy-r*0.25+Math.sin(a-0.09)*r*0.65);
      ctx.lineTo(cx+Math.cos(a)*tip,cy-r*0.25+Math.sin(a)*tip*0.82);
      ctx.lineTo(cx+Math.cos(a+0.09)*r*0.82,cy-r*0.25+Math.sin(a+0.09)*r*0.65);
      ctx.fill();
    }
    ctx.fillRect(cx-r*0.92,cy-r*0.4,r*0.12,r*0.55);
    ctx.fillRect(cx+r*0.8,cy-r*0.4,r*0.12,r*0.55);
  }else{
    ctx.fillStyle='#1a0800';
    ctx.beginPath();ctx.ellipse(cx,cy-r*0.35,r*1.05,r*0.72,0,Math.PI,0,true);ctx.fill();
    ctx.beginPath();ctx.moveTo(cx-r*0.98,cy-r*0.25);
    ctx.quadraticCurveTo(cx-r*1.12,cy+r*0.6,cx-r*0.65,cy+r*1.4);
    ctx.lineTo(cx-r*0.45,cy+r*0.85);ctx.fill();
    ctx.beginPath();ctx.moveTo(cx+r*0.98,cy-r*0.25);
    ctx.quadraticCurveTo(cx+r*1.12,cy+r*0.6,cx+r*0.65,cy+r*1.4);
    ctx.lineTo(cx+r*0.45,cy+r*0.85);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx-r*0.15,cy-r*0.6,r*0.55,r*0.3,0.1,0,Math.PI);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx+r*0.2,cy-r*0.62,r*0.45,r*0.28,-0.1,0,Math.PI);ctx.fill();
  }
  ctx.strokeStyle=isAxel?'#2a1506':'#1a0800';ctx.lineWidth=sz*0.022;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(cx-r*0.38,cy-r*0.28);ctx.quadraticCurveTo(cx-r*0.22,cy-r*0.38,cx-r*0.06,cy-r*0.3);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+r*0.06,cy-r*0.3);ctx.quadraticCurveTo(cx+r*0.22,cy-r*0.38,cx+r*0.38,cy-r*0.28);ctx.stroke();
  const ey=cy-r*0.1,ex=r*0.24;
  ctx.fillStyle='#fff';
  ctx.beginPath();ctx.ellipse(cx-ex,ey,r*0.14,r*0.1,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+ex,ey,r*0.14,r*0.1,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=isAxel?'#5c3a1e':'#2e7d32';
  ctx.beginPath();ctx.arc(cx-ex,ey,r*0.075,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(cx+ex,ey,r*0.075,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111';
  ctx.beginPath();ctx.arc(cx-ex,ey,r*0.038,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(cx+ex,ey,r*0.038,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';
  ctx.beginPath();ctx.arc(cx-ex+r*0.04,ey-r*0.03,r*0.022,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(cx+ex+r*0.04,ey-r*0.03,r*0.022,0,Math.PI*2);ctx.fill();
  if(!isAxel){ctx.strokeStyle='#1a0800';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(cx-ex-r*0.12,ey-r*0.06);ctx.lineTo(cx-ex-r*0.16,ey-r*0.12);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx+ex+r*0.12,ey-r*0.06);ctx.lineTo(cx+ex+r*0.16,ey-r*0.12);ctx.stroke();
  }
  ctx.strokeStyle='#b8896a';ctx.lineWidth=1.5;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(cx,cy+r*0.02);ctx.quadraticCurveTo(cx+r*0.08,cy+r*0.15,cx,cy+r*0.2);ctx.stroke();
  ctx.fillStyle=isAxel?'#c2836a':'#d4727a';
  ctx.beginPath();ctx.ellipse(cx,cy+r*0.35,r*0.16,r*0.055,0,0,Math.PI);ctx.fill();
  ctx.strokeStyle='#9e6b4a';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(cx,cy+r*0.28,r*0.16,0.15,Math.PI-0.15);ctx.stroke();
  ctx.fillStyle='rgba(220,120,100,0.18)';
  ctx.beginPath();ctx.ellipse(cx-r*0.4,cy+r*0.18,r*0.12,r*0.08,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+r*0.4,cy+r*0.18,r*0.12,r*0.08,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawSkyline(ctx,w,hy){
  const B=[[.03,.02,.18],[.07,.025,.26],[.11,.018,.32],[.15,.028,.22],[.19,.024,.40],[.24,.03,.28],
    [.29,.022,.46],[.34,.044,.60,1],[.40,.025,.32],[.44,.03,.42],[.49,.022,.36],[.53,.036,.50],
    [.58,.02,.28],[.62,.03,.38],[.67,.025,.24],[.71,.034,.52],[.76,.02,.30],[.80,.028,.26],
    [.84,.022,.36],[.89,.025,.20],[.93,.028,.24]];
  for(const b of B){
    const bx=b[0]*w,bw=b[1]*w,bh=b[2]*hy,by=hy-bh;
    ctx.fillStyle='rgba(6,10,28,0.9)';ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle='rgba(255,220,80,0.18)';
    const g=Math.max(bw*0.22,4);
    for(let y=by+5;y<hy-3;y+=7)for(let x=bx+g;x<bx+bw-g;x+=g)if(Math.random()>.35)ctx.fillRect(x,y,bw*0.12,2.5);
    if(b[3]){ctx.fillStyle='rgba(6,10,28,0.9)';
      ctx.fillRect(bx+bw*.3,by-hy*.08,2,hy*.08);ctx.fillRect(bx+bw*.65,by-hy*.06,2,hy*.06);
      ctx.fillStyle='#ff3333';ctx.beginPath();ctx.arc(bx+bw*.3+1,by-hy*.08,2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(bx+bw*.65+1,by-hy*.06,2,0,Math.PI*2);ctx.fill();}
  }
}

function drawGhost(ctx,w,hy,isA){
  const sz=Math.min(w*0.07,36),cx=w*0.85,cy=hy*0.3;
  ctx.globalAlpha=0.1;drawAvatar(ctx,cx,cy,sz*2.5,isA);ctx.globalAlpha=1;
}

function drawCar3D(ctx,x,y,ch,cw,preset,player){
  const hw=cw/2,hh=ch/2;
  ctx.fillStyle='rgba(0,0,0,0.3)';ctx.beginPath();ctx.ellipse(x,y+hh+4,hw*1.1,6,0,0,Math.PI*2);ctx.fill();
  ctx.save();
  drawRR(ctx,x-hw,y-hh,cw,ch,player?8:5);ctx.clip();
  const bg=ctx.createLinearGradient(x-hw,y-hh,x+hw,y+hh);
  bg.addColorStop(0,preset.accent);bg.addColorStop(0.3,preset.body);bg.addColorStop(1,preset.stripe);
  ctx.fillStyle=bg;ctx.fillRect(x-hw,y-hh,cw,ch);
  if(player){
    ctx.fillStyle='rgba(80,180,255,0.25)';
    drawRR(ctx,x-hw*0.6,y-hh+ch*0.2,cw*0.6,ch*0.22,4);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(x-hw*0.4,y-hh+ch*0.22,cw*0.25,ch*0.16);
  }
  ctx.restore();
  ctx.shadowColor=preset.glow;ctx.shadowBlur=player?20:8;
  drawRR(ctx,x-hw,y-hh,cw,ch,player?8:5);ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1;ctx.stroke();
  ctx.shadowBlur=0;
  ctx.fillStyle=preset.stripe;ctx.globalAlpha=0.4;ctx.fillRect(x-1.5,y-hh,3,ch);ctx.globalAlpha=1;
  if(player){ctx.fillStyle='#ffe';
    ctx.beginPath();ctx.arc(x-hw+6,y-hh+5,3.5,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x+hw-6,y-hh+5,3.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,200,0.06)';ctx.beginPath();
    ctx.moveTo(x-hw+3,y-hh);ctx.lineTo(x-hw-8,y-hh-40);ctx.lineTo(x-hw+14,y-hh-40);ctx.fill();
    ctx.beginPath();ctx.moveTo(x+hw-3,y-hh);ctx.lineTo(x+hw+8,y-hh-40);ctx.lineTo(x+hw-14,y-hh-40);ctx.fill();
  }else{ctx.fillStyle='#f22';
    ctx.fillRect(x-hw+2,y+hh-6,6,4);ctx.fillRect(x+hw-8,y+hh-6,6,4);}
  if(player){ctx.fillStyle='rgba(200,200,200,0.15)';
    for(let i=0;i<3;i++){const px=x+rand(-5,5),py=y+hh+rand(6,18),ps=rand(2,5);
    ctx.beginPath();ctx.arc(px,py,ps,0,Math.PI*2);ctx.fill();}}
}

function drawLocoObj(ctx,type,sx,sy,sz){
  if(type==='tree'){
    ctx.fillStyle='#5d3a1a';ctx.fillRect(sx-sz*0.08,sy-sz*0.4,sz*0.16,sz*0.4);
    ctx.fillStyle='#2e7d32';
    ctx.beginPath();ctx.arc(sx,sy-sz*0.55,sz*0.3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(sx-sz*0.15,sy-sz*0.4,sz*0.22,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(sx+sz*0.15,sy-sz*0.4,sz*0.22,0,Math.PI*2);ctx.fill();
  }else if(type==='hydrant'){
    ctx.fillStyle='#c62828';drawRR(ctx,sx-sz*0.12,sy-sz*0.45,sz*0.24,sz*0.45,3);ctx.fill();
    ctx.fillStyle='#e53935';ctx.beginPath();ctx.arc(sx,sy-sz*0.45,sz*0.14,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#b71c1c';ctx.fillRect(sx-sz*0.22,sy-sz*0.28,sz*0.44,sz*0.06);
  }else if(type==='trashcan'){
    ctx.fillStyle='#546e7a';drawRR(ctx,sx-sz*0.18,sy-sz*0.55,sz*0.36,sz*0.55,2);ctx.fill();
    ctx.fillStyle='#607d8b';ctx.fillRect(sx-sz*0.2,sy-sz*0.58,sz*0.4,sz*0.06);
    ctx.fillStyle='#455a64';ctx.fillRect(sx-sz*0.12,sy-sz*0.38,sz*0.24,sz*0.04);
  }else if(type==='cone'){
    ctx.fillStyle='#ff6d00';ctx.beginPath();
    ctx.moveTo(sx,sy-sz*0.5);ctx.lineTo(sx-sz*0.2,sy);ctx.lineTo(sx+sz*0.2,sy);ctx.fill();
    ctx.fillStyle='#fff';ctx.fillRect(sx-sz*0.12,sy-sz*0.2,sz*0.24,sz*0.06);
  }else{
    ctx.fillStyle='#5d4037';drawRR(ctx,sx-sz*0.16,sy-sz*0.5,sz*0.32,sz*0.5,4);ctx.fill();
    ctx.fillStyle='#ffb300';ctx.fillRect(sx-sz*0.14,sy-sz*0.32,sz*0.28,sz*0.05);
    ctx.fillRect(sx-sz*0.14,sy-sz*0.15,sz*0.28,sz*0.05);
  }
}

export class EstrellaGame{
  constructor(canvas){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});
    this.w=0;this.h=0;this.dpr=1;this.resize(window.innerWidth,window.innerHeight);
    this.stars=[];for(let i=0;i<STAR_COUNT;i++)this.stars.push({x:Math.random(),y:Math.random(),s:rand(.5,2),b:rand(.3,1)});
    this.profile={primaryName:'Axel',secondaryName:'Jade'};this.driverKey='primary';this.difficulty='medium';
    this.muted=false;this.mode='race';this.runState='idle';
    this.distance=0;this.speed=0;this.playerLane=1;this.playerX=.5;
    this.score=0;this.fuel=100;this.lives=3;this.maxLives=3;this.courseLength=COURSE_BASE;
    this.invincible=false;this.invTimer=0;this.boosting=false;this.boostTimer=0;
    this.obstacles=[];this.collectibles=[];this.ramps=[];this.particles=[];
    this.flashKey=null;this.flashTimer=0;this.timer=0;this.combo=0;this.comboTimer=0;
    this.locoX=0;this.locoZ=0;this.locoAngle=0;this.locoSpeed=0;this.locoProps=[];this.locoDamage=0;
    this.controls={left:false,right:false,up:false,down:false};
    this.tiltSide=0;this.tiltThrottle=0;
    this.audioCtx=null;this.musicInterval=null;this.noteIndex=0;
    this.lastTs=0;this.skyCache=null;this.skyCacheW=0;
  }

  resize(vw,vh){
    this.dpr=Math.min(window.devicePixelRatio||1,MAX_DPR);this.w=vw;this.h=vh;
    this.canvas.width=vw*this.dpr;this.canvas.height=vh*this.dpr;
    this.canvas.style.width=vw+'px';this.canvas.style.height=vh+'px';
    this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);this.skyCache=null;
  }
  setProfile(p){this.profile=p}
  setDriverKey(k){this.driverKey=k}
  setDifficulty(d){this.difficulty=d}
  setMuted(m){this.muted=m;if(m)this.stopMusic()}
  getRunState(){return this.runState}
  getMode(){return this.mode}
  get isAxel(){return this.driverKey==='primary'}
  get driverName(){return this.isAxel?this.profile.primaryName:this.profile.secondaryName}
  get diff(){return DIFF[this.difficulty]||DIFF.medium}

  start(mode){
    this.mode=mode;this.runState='playing';this.lastTs=0;
    this.score=0;this.timer=0;this.flashKey=null;this.flashTimer=0;this.combo=0;this.comboTimer=0;this.particles=[];
    if(mode==='race'){
      this.distance=0;this.speed=BASE_SPEED*this.diff.speedMul;
      this.playerLane=1;this.playerX=.5;this.fuel=100;
      this.lives=this.diff.lives;this.maxLives=this.diff.lives;
      this.courseLength=COURSE_BASE*this.diff.courseMul;
      this.invincible=false;this.invTimer=0;this.boosting=false;this.boostTimer=0;
      this.obstacles=[];this.collectibles=[];this.ramps=[];
      for(let i=0;i<3;i++)this._spawnOb(rand(350,900+i*500));
      this._spawnCol(rand(250,550));this._spawnRamp(rand(700,1400));
    }else{
      this.locoX=0;this.locoZ=0;this.locoAngle=0;this.locoSpeed=0;this.locoDamage=0;
      this.lives=this.diff.lives;this.maxLives=this.diff.lives;this.locoProps=[];
      const types=['tree','hydrant','trashcan','cone','barrel'];
      for(let i=0;i<45;i++)this.locoProps.push({x:rand(-500,500),z:rand(-500,500),type:choose(types),alive:true,scale:rand(.8,1.4)});
    }
    if(!this.muted)this.startMusic();
  }

  _spawnOb(d){this.obstacles.push({lane:(Math.random()*this.diff.lanes)|0,dist:this.distance+(d||rand(300,700)),preset:choose(FLEET),hit:false})}
  _spawnCol(d){this.collectibles.push({lane:(Math.random()*this.diff.lanes)|0,dist:this.distance+(d||rand(250,600)),type:Math.random()<.3?'fuel':'star',collected:false})}
  _spawnRamp(d){this.ramps.push({lane:(Math.random()*this.diff.lanes)|0,dist:this.distance+(d||rand(600,1200)),hit:false})}

  stopToMenu(){this.runState='idle';this.stopMusic()}
  togglePause(){if(this.runState==='playing'){this.runState='paused';this.stopMusic()}else if(this.runState==='paused'){this.runState='playing';if(!this.muted)this.startMusic()}}
  setControl(k,v){this.controls[k]=v}
  setTiltInput(s,t){this.tiltSide=s;this.tiltThrottle=t}
  clearTiltInput(){this.tiltSide=0;this.tiltThrottle=0}
  moveLane(d){if(this.mode==='race')this.playerLane=clamp(this.playerLane+d,0,this.diff.lanes-1)}
  tapAt(x){if(this.mode==='race')this.moveLane(x<this.w/2?-1:1)}

  getSnapshot(){return{mode:this.mode,score:this.score,fuel:Math.round(this.fuel),lives:this.lives,maxLives:this.maxLives,progress:this.mode==='race'?clamp(this.distance/this.courseLength,0,1):0,flashKey:this.flashKey,boosting:this.boosting,timer:this.timer,damage:Math.round(this.locoDamage),paused:this.runState==='paused'}}
  getResult(){if(this.mode==='loco')return{titleKey:'LOCO OVER!',msgKey:'Total chaos!',score:this.score};if(this.distance>=this.courseLength)return{titleKey:'FINISH!',msgKey:'Amazing run!',score:this.score};if(this.fuel<=0)return{titleKey:'OUT OF GAS!',msgKey:'Find more fuel!',score:this.score};return{titleKey:'WRECKED!',msgKey:'Try again!',score:this.score}}

  _flash(k){this.flashKey=k;this.flashTimer=1.2}
  _particles(x,y,n,c){for(let i=0;i<n;i++)this.particles.push({x,y,vx:rand(-120,120),vy:rand(-180,-40),life:rand(.3,.8),ml:.8,color:c,size:rand(2,5)})}
  _crash(){this.lives--;this._flash('💔 OUCH!');this._particles(this.w*this.playerX,this.h*PLAYER_Y,18,'#ff4444');if(this.lives<=0){this.runState='gameover';this.stopMusic()}else{this.invincible=true;this.invTimer=3;this.playerLane=1;this.speed*=.6}}
  roadSample(t){const curve=Math.sin(this.distance*.004+t*3.5)*.2*t;const hill=Math.sin(this.distance*.002+t*2.2)*.055*(1-t*.5);return{center:.5+curve,width:.06+t*.55,hill}}

  frame(ts){
    if(this.runState==='idle'){this._drawIdle();return}
    if(!this.lastTs){this.lastTs=ts;this._draw();return}
    const dt=Math.min((ts-this.lastTs)/1000,.05);this.lastTs=ts;
    if(this.runState==='playing'){
      this.timer+=dt;this.flashTimer-=dt;if(this.flashTimer<=0)this.flashKey=null;
      this.comboTimer-=dt;if(this.comboTimer<=0)this.combo=0;
      for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt;p.life-=dt;if(p.life<=0)this.particles.splice(i,1)}
      if(this.mode==='race')this._updateRace(dt);else this._updateLoco(dt);
    }
    this._draw();
  }

  _updateRace(dt){
    if(this.invincible){this.invTimer-=dt;if(this.invTimer<=0)this.invincible=false}
    if(this.boosting){this.boostTimer-=dt;if(this.boostTimer<=0){this.boosting=false;this.speed=BASE_SPEED*this.diff.speedMul}}
    let ts=BASE_SPEED*this.diff.speedMul;
    if(this.boosting)ts*=1.8;
    if(this.controls.up||this.tiltThrottle>.2)ts*=1.35;
    if(this.controls.down||this.tiltThrottle<-.2)ts*=.55;
    this.speed=lerp(this.speed,ts,dt*3);
    if(Math.abs(this.tiltSide)>.15){this.playerX+=this.tiltSide*dt*1.8;this.playerLane=clamp(Math.round(this.playerX*(this.diff.lanes-1)),0,this.diff.lanes-1)}
    const lanes=this.diff.lanes,lw=1/(lanes+1),tx=(this.playerLane+1)*lw;
    this.playerX=lerp(this.playerX,tx,dt*10);
    this.distance+=this.speed*dt;
    this.fuel-=dt*2.2*(this.boosting?2:1);
    if(this.fuel<=15&&Math.random()<.008)this._flash('⛽ LOW FUEL!');
    if(this.fuel<=0){this.fuel=0;this.runState='gameover';this.stopMusic();return}
    if(this.distance>=this.courseLength){this.runState='gameover';this.stopMusic();return}
    const pw=.08;
    for(const o of this.obstacles){if(o.hit)continue;const rd=o.dist-this.distance;if(rd<0||rd>60)continue;if(rd<40){const ox=(o.lane+1)*lw;if(Math.abs(this.playerX-ox)<pw){o.hit=true;if(!this.invincible)this._crash()}if(!o.hit&&!o._nm&&Math.abs(this.playerX-ox)<pw*2.2){o._nm=true;this.score+=50;this.combo++;this.comboTimer=2;if(this.combo>=3)this._flash('😎 NEAR MISS!')}}}
    for(const c of this.collectibles){if(c.collected)continue;const rd=c.dist-this.distance;if(rd<0||rd>40)continue;const cx2=(c.lane+1)*lw;if(Math.abs(this.playerX-cx2)<pw*1.5&&rd<30){c.collected=true;if(c.type==='fuel'){this.fuel=Math.min(100,this.fuel+25);this._flash('⛽ FUEL UP!');this.score+=30}else{this.score+=100;this.combo++;this.comboTimer=2;this._particles(this.w*this.playerX,this.h*PLAYER_Y,8,'#ffd700');if(this.combo>=3)this._flash('⭐ STAR CHAIN!')}}}
    for(const r of this.ramps){if(r.hit)continue;const rd=r.dist-this.distance;if(rd<30&&rd>0){const rx=(r.lane+1)*lw;if(Math.abs(this.playerX-rx)<pw*1.5){r.hit=true;this.boosting=true;this.boostTimer=3;this.speed=BASE_SPEED*this.diff.speedMul*1.8;this._flash('🚀 BOOST!');this._particles(this.w*this.playerX,this.h*PLAYER_Y,12,'#ff9500');this.score+=200}}}
    this.obstacles=this.obstacles.filter(o=>o.dist>this.distance-200);
    this.collectibles=this.collectibles.filter(c=>c.dist>this.distance-200);
    this.ramps=this.ramps.filter(r=>r.dist>this.distance-200);
    const md=Math.max(...this.obstacles.map(o=>o.dist),this.distance);
    if(md-this.distance<700){const n=Math.random()<this.diff.spawnMul*.4?2:1;for(let i=0;i<n;i++)this._spawnOb()}
    if(this.collectibles.filter(c=>!c.collected&&c.dist>this.distance).length<2)this._spawnCol();
    if(this.ramps.filter(r=>!r.hit&&r.dist>this.distance).length<1&&Math.random()<.015)this._spawnRamp();
  }

  _updateLoco(dt){
    const ac=600*this.diff.speedMul;
    if(this.controls.up||this.tiltThrottle>.2)this.locoSpeed+=ac*dt;
    if(this.controls.down||this.tiltThrottle<-.2)this.locoSpeed-=ac*.6*dt;
    this.locoSpeed*=.97;this.locoSpeed=clamp(this.locoSpeed,-200,500*this.diff.speedMul);
    let turn=0;if(this.controls.left||this.tiltSide<-.15)turn=-2.5;if(this.controls.right||this.tiltSide>.15)turn=2.5;
    this.locoAngle+=turn*dt*(.5+Math.abs(this.locoSpeed)/400);
    this.locoX+=Math.sin(this.locoAngle)*this.locoSpeed*dt;
    this.locoZ+=Math.cos(this.locoAngle)*this.locoSpeed*dt;
    this.score+=Math.abs(this.locoSpeed)*dt*.1|0;
    for(const p of this.locoProps){if(!p.alive)continue;const dx=this.locoX-p.x,dz=this.locoZ-p.z;if(dx*dx+dz*dz<500){p.alive=false;this.score+=50;this.locoDamage=Math.min(100,this.locoDamage+6);this._flash('💥 SMASH!');this._particles(this.w/2,this.h*.6,10,'#ffaa00');if(this.locoDamage>=100){this.lives--;if(this.lives<=0){this.runState='gameover';this.stopMusic();return}this.locoDamage=0;this._flash('💔 OUCH!')}}}
    const types=['tree','hydrant','trashcan','cone','barrel'];
    if(this.locoProps.filter(p=>p.alive).length<25){for(let i=0;i<10;i++)this.locoProps.push({x:this.locoX+rand(-500,500),z:this.locoZ+rand(-500,500),type:choose(types),alive:true,scale:rand(.8,1.4)})}
  }

  _draw(){if(this.mode==='race')this._drawRace();else this._drawLoco()}

  _drawIdle(){const{ctx,w,h}=this;const s=ctx.createLinearGradient(0,0,0,h);s.addColorStop(0,'#0a0e2a');s.addColorStop(.4,'#131a40');s.addColorStop(1,'#1a1040');ctx.fillStyle=s;ctx.fillRect(0,0,w,h);for(const st of this.stars){ctx.globalAlpha=st.b*(.5+.5*Math.sin(Date.now()*.002+st.x*10));ctx.fillStyle='#fff';ctx.fillRect(st.x*w,st.y*h*.6,st.s,st.s)}ctx.globalAlpha=1}

  _drawRace(){
    const{ctx,w,h}=this,hy=h*.32;
    const sky=ctx.createLinearGradient(0,0,0,hy);sky.addColorStop(0,'#040818');sky.addColorStop(.5,'#0d1530');sky.addColorStop(1,'#1a2255');ctx.fillStyle=sky;ctx.fillRect(0,0,w,hy);
    for(const s of this.stars){ctx.globalAlpha=s.b*(.4+.6*Math.sin(Date.now()*.003+s.x*20));ctx.fillStyle='#fff';ctx.fillRect(s.x*w,s.y*hy,s.s,s.s)}ctx.globalAlpha=1;
    if(!this.skyCache||this.skyCacheW!==w){this.skyCache=document.createElement('canvas');this.skyCache.width=w*this.dpr;this.skyCache.height=h*this.dpr;const sc=this.skyCache.getContext('2d');sc.setTransform(this.dpr,0,0,this.dpr,0,0);drawSkyline(sc,w,hy);this.skyCacheW=w}
    ctx.drawImage(this.skyCache,0,0,w*this.dpr,h*this.dpr,0,0,w,h);
    drawGhost(ctx,w,hy,this.isAxel);
    ctx.fillStyle='#080e08';ctx.fillRect(0,hy,w,h-hy);
    const segs=55,lanes=this.diff.lanes;
    for(let i=segs;i>=1;i--){
      const t1=i/segs,t0=(i-1)/segs,s1=this.roadSample(t1),s0=this.roadSample(t0);
      const y1=hy+(h-hy)*t1+s1.hill*h,y0=hy+(h-hy)*t0+s0.hill*h;
      const stripe=((Math.floor(this.distance*.04)+i)%2===0);
      ctx.fillStyle=stripe?'#282838':'#202030';ctx.beginPath();
      ctx.moveTo((s0.center-s0.width/2)*w,y0);ctx.lineTo((s0.center+s0.width/2)*w,y0);
      ctx.lineTo((s1.center+s1.width/2)*w,y1);ctx.lineTo((s1.center-s1.width/2)*w,y1);ctx.fill();
      ctx.strokeStyle='rgba(255,200,50,.45)';ctx.lineWidth=clamp(t1*3,.5,3);
      ctx.beginPath();ctx.moveTo((s0.center-s0.width/2)*w,y0);ctx.lineTo((s1.center-s1.width/2)*w,y1);ctx.stroke();
      ctx.beginPath();ctx.moveTo((s0.center+s0.width/2)*w,y0);ctx.lineTo((s1.center+s1.width/2)*w,y1);ctx.stroke();
      if(stripe){ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=clamp(t1*2,.3,2);
        for(let ln=1;ln<lanes;ln++){const f=ln/lanes;const lx0=(s0.center-s0.width/2+s0.width*f)*w;const lx1=(s1.center-s1.width/2+s1.width*f)*w;ctx.beginPath();ctx.moveTo(lx0,y0);ctx.lineTo(lx1,y1);ctx.stroke()}}
    }
    if(this.boosting){ctx.strokeStyle='rgba(255,180,0,.35)';ctx.lineWidth=2;for(let i=0;i<6;i++){const sx=rand(0,w),sy=hy+rand(0,(h-hy)*.4);ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+rand(-20,20),sy+rand(30,80));ctx.stroke()}}
    for(const r of this.ramps){if(r.hit)continue;const rd=r.dist-this.distance;if(rd<0||rd>1200)continue;const t=1-rd/1200;if(t<.01)continue;const rs=this.roadSample(t);const ry=hy+(h-hy)*t+rs.hill*h;const rlw=rs.width/lanes;const rx=(rs.center-rs.width/2+(r.lane+.5)*rlw)*w;const sz=t*38;ctx.fillStyle='rgba(255,180,0,.65)';ctx.beginPath();ctx.moveTo(rx-sz,ry);ctx.lineTo(rx,ry-sz*.6);ctx.lineTo(rx+sz,ry);ctx.lineTo(rx,ry+sz*.3);ctx.fill();ctx.fillStyle='#fff';ctx.font=Math.max(8,t*13)+'px Arial';ctx.textAlign='center';ctx.fillText('\u{1f680}',rx,ry+3)}
    for(const c of this.collectibles){if(c.collected)continue;const rd=c.dist-this.distance;if(rd<0||rd>1200)continue;const t=1-rd/1200;if(t<.02)continue;const cs=this.roadSample(t);const cy2=hy+(h-hy)*t+cs.hill*h;const clw=cs.width/lanes;const cx2=(cs.center-cs.width/2+(c.lane+.5)*clw)*w;const sz=t*18;ctx.font=Math.max(8,sz)+'px Arial';ctx.textAlign='center';ctx.fillText(c.type==='fuel'?'\u26FD':'\u2B50',cx2,cy2+sz*.3)}
    for(const o of this.obstacles){if(o.hit)continue;const rd=o.dist-this.distance;if(rd<0||rd>1200)continue;const t=1-rd/1200;if(t<.02)continue;const os=this.roadSample(t);const oy=hy+(h-hy)*t+os.hill*h;const olw=os.width/lanes;const ox=(os.center-os.width/2+(o.lane+.5)*olw)*w;drawCar3D(ctx,ox,oy,t*55,t*32,o.preset,false)}
    const ps=this.roadSample(.88);const py=hy+(h-hy)*.88+ps.hill*h;const px=this.playerX*w;
    const pp=this.isAxel?CAR_PRESETS[0]:CAR_PRESETS[3];
    if(this.invincible&&Math.sin(Date.now()*.02)>0)ctx.globalAlpha=.45;
    drawCar3D(ctx,px,py,65,38,pp,true);ctx.globalAlpha=1;
    ctx.fillStyle='#fff';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText(this.driverName,px,py+40);
    for(const p of this.particles){ctx.globalAlpha=clamp(p.life/p.ml,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size)}ctx.globalAlpha=1;
  }

  _drawLoco(){
    const{ctx,w,h}=this;
    const sky=ctx.createLinearGradient(0,0,0,h*.4);sky.addColorStop(0,'#08041a');sky.addColorStop(1,'#180e38');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    const grd=ctx.createLinearGradient(0,h*.35,0,h);grd.addColorStop(0,'#1a2a10');grd.addColorStop(1,'#0d1a08');ctx.fillStyle=grd;ctx.fillRect(0,h*.35,w,h*.65);
    ctx.strokeStyle='rgba(80,200,80,.06)';ctx.lineWidth=1;for(let i=-12;i<=12;i++){const sy=h*.35+(h*.65)*(.5+i*.035);if(sy>h*.35&&sy<h){ctx.beginPath();ctx.moveTo(0,sy);ctx.lineTo(w,sy);ctx.stroke()}}
    const props=this.locoProps.filter(p=>p.alive).map(p=>{const dx=p.x-this.locoX,dz=p.z-this.locoZ;const co=Math.cos(-this.locoAngle),si=Math.sin(-this.locoAngle);return{...p,rx:dx*co-dz*si,rz:dx*si+dz*co}}).filter(p=>p.rz>8&&p.rz<350).sort((a,b)=>b.rz-a.rz);
    for(const p of props){const per=220/p.rz;const sx=w/2+p.rx*per,sy=h*.4+per*22;const sz=per*18*p.scale;if(sx<-60||sx>w+60)continue;
    drawLocoObj(ctx,p.type,sx,sy,sz)}
    const pp=this.isAxel?CAR_PRESETS[0]:CAR_PRESETS[3];
    if(this.invincible&&Math.sin(Date.now()*.02)>0)ctx.globalAlpha=.45;
    drawCar3D(ctx,w/2,h*.6,65,38,pp,true);ctx.globalAlpha=1;
    ctx.fillStyle='#fff';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText(this.driverName,w/2,h*.6+40);
    if(this.locoDamage>0){const bw=80,bx=w/2-40,by=h*.6+48;ctx.fillStyle='rgba(255,255,255,.15)';ctx.fillRect(bx,by,bw,5);ctx.fillStyle=this.locoDamage>70?'#f33':'#fa0';ctx.fillRect(bx,by,bw*this.locoDamage/100,5)}
    for(const p of this.particles){ctx.globalAlpha=clamp(p.life/p.ml,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size)}ctx.globalAlpha=1;
  }

  unlockAudio(){if(this.audioCtx)return;this.audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(this.audioCtx.state==='suspended')this.audioCtx.resume()}
  toggleMuted(){this.muted=!this.muted;if(this.muted)this.stopMusic();else if(this.runState==='playing')this.startMusic();return this.muted}
  startMusic(){if(this.musicInterval||!this.audioCtx||this.muted)return;const notes=this.mode==='race'?[262,330,392,523,392,330,349,440,523,440,349,294]:[196,247,330,392,330,294,262,330,392,523,440,330];this.noteIndex=0;this.musicInterval=setInterval(()=>{if(!this.audioCtx)return;try{const o=this.audioCtx.createOscillator();const g=this.audioCtx.createGain();o.type=this.mode==='race'?'triangle':'sawtooth';o.frequency.value=notes[this.noteIndex%notes.length];g.gain.value=.06;g.gain.exponentialRampToValueAtTime(.001,this.audioCtx.currentTime+.2);o.connect(g);g.connect(this.audioCtx.destination);o.start();o.stop(this.audioCtx.currentTime+.2);this.noteIndex++}catch(e){}},220)}
  stopMusic(){if(this.musicInterval){clearInterval(this.musicInterval);this.musicInterval=null}}
}