/* global THREE */
const LANE_W=3,ROAD_W=11,ROAD_LEN=300,CAM_H=8,CAM_BACK=13;
const BASE_SPEED=50,COURSE_BASE=3000;
const DIFF={easy:{sm:.6,sp:2.8,lanes:3,cl:.5,lives:5},medium:{sm:1,sp:1.6,lanes:3,cl:1,lives:3},hard:{sm:1.4,sp:.9,lanes:4,cl:1.5,lives:2}};
const PCOL=[{b:0xe53935,a:0xffd54f},{b:0x2979ff,a:0x80d8ff},{b:0x00c853,a:0xb2ff59},{b:0xaa00ff,a:0xea80fc},{b:0xffab00,a:0xfff9c4}];
const FCOL=[{b:0x111122,a:0xff1744},{b:0x0a1520,a:0xff6d00},{b:0x120820,a:0xd500f9},{b:0x081520,a:0x00e5ff}];
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function rand(a,b){return a+Math.random()*(b-a)}
function choose(a){return a[(Math.random()*a.length)|0]}
function lerp(a,b,t){return a+(b-a)*t}

function buildCar(bc,ac,player){
  const g=new THREE.Group();
  const lb=new THREE.Mesh(new THREE.BoxGeometry(2.2,.55,4.2),new THREE.MeshPhongMaterial({color:bc,shininess:90}));
  lb.position.y=.42;lb.castShadow=true;g.add(lb);
  const ub=new THREE.Mesh(new THREE.BoxGeometry(1.8,.45,2),new THREE.MeshPhongMaterial({color:bc,shininess:80}));
  ub.position.set(0,.87,-.2);ub.castShadow=true;g.add(ub);
  const ws=new THREE.Mesh(new THREE.BoxGeometry(1.6,.42,.08),new THREE.MeshPhongMaterial({color:0x88ccff,transparent:true,opacity:.45,shininess:100}));
  ws.position.set(0,.87,.82);ws.rotation.x=-.18;g.add(ws);
  const rw=new THREE.Mesh(new THREE.BoxGeometry(1.5,.38,.08),new THREE.MeshPhongMaterial({color:0x88ccff,transparent:true,opacity:.35}));
  rw.position.set(0,.87,-1.18);rw.rotation.x=.15;g.add(rw);
  const wm=new THREE.MeshPhongMaterial({color:0x1a1a1a});
  const wg=new THREE.CylinderGeometry(.3,.3,.22,10);
  const wp=[[-1.05,.3,1.4],[1.05,.3,1.4],[-1.05,.3,-1.4],[1.05,.3,-1.4]];
  for(const[x,y,z] of wp){const w=new THREE.Mesh(wg,wm);w.rotation.z=Math.PI/2;w.position.set(x,y,z);g.add(w);
    const hc=new THREE.Mesh(new THREE.CircleGeometry(.18,8),new THREE.MeshPhongMaterial({color:0xbbbbbb,shininess:100}));
    hc.position.set(x>0?x+.12:x-.12,y,z);hc.rotation.y=x>0?Math.PI/2:-Math.PI/2;g.add(hc)}
  const st=new THREE.Mesh(new THREE.BoxGeometry(.08,.04,4.2),new THREE.MeshPhongMaterial({color:ac,emissive:ac,emissiveIntensity:.25}));
  st.position.y=.71;g.add(st);
  if(player){const hm=new THREE.MeshPhongMaterial({color:0xffffaa,emissive:0xffff44,emissiveIntensity:.8});
    for(const x of [-.7,.7]){const h=new THREE.Mesh(new THREE.SphereGeometry(.13,6,6),hm);h.position.set(x,.48,2.1);g.add(h)}
  }else{const tm=new THREE.MeshPhongMaterial({color:0xff0000,emissive:0xff2222,emissiveIntensity:.5});
    for(const x of [-.7,.7]){const t=new THREE.Mesh(new THREE.BoxGeometry(.22,.1,.05),tm);t.position.set(x,.48,-2.1);g.add(t)}}
  if(player){const sp=new THREE.Mesh(new THREE.BoxGeometry(1.8,.06,.35),new THREE.MeshPhongMaterial({color:bc,shininess:60}));
    sp.position.set(0,1.15,-1.9);g.add(sp);
    const spl=new THREE.Mesh(new THREE.BoxGeometry(.08,.25,.06),new THREE.MeshPhongMaterial({color:0x333333}));
    spl.position.set(-.7,1.0,-1.9);g.add(spl);const spr=spl.clone();spr.position.x=.7;g.add(spr)}
  return g;
}

function buildWillis(){
  const g=new THREE.Group();
  const m=new THREE.MeshPhongMaterial({color:0x0e0e1e,shininess:30});
  const b1=new THREE.Mesh(new THREE.BoxGeometry(8,35,8),m);b1.position.y=17.5;g.add(b1);
  const b2=new THREE.Mesh(new THREE.BoxGeometry(6,10,6),m);b2.position.y=40;g.add(b2);
  const b3=new THREE.Mesh(new THREE.BoxGeometry(4,8,4),m);b3.position.y=49;g.add(b3);
  const wm=new THREE.MeshPhongMaterial({color:0,emissive:0xffdd55,emissiveIntensity:.08,transparent:true,opacity:.4});
  const wo=new THREE.Mesh(new THREE.BoxGeometry(8.05,35,8.05),wm);wo.position.y=17.5;g.add(wo);
  const am=new THREE.MeshPhongMaterial({color:0x888899,shininess:80});
  const a1=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,20,6),am);a1.position.set(1.5,63,1.5);g.add(a1);
  const a2=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,16,6),am);a2.position.set(-1.5,61,-1.5);g.add(a2);
  const rm=new THREE.MeshPhongMaterial({color:0xff0000,emissive:0xff0000,emissiveIntensity:1});
  const r1=new THREE.Mesh(new THREE.SphereGeometry(.35,6,6),rm);r1.position.set(1.5,73,1.5);g.add(r1);
  const r2=new THREE.Mesh(new THREE.SphereGeometry(.3,6,6),rm);r2.position.set(-1.5,69,-1.5);g.add(r2);
  g._lights=[r1,r2];
  return g;
}

function buildBldg(bw,bh,bd,col){
  const g=new THREE.Group();
  const b=new THREE.Mesh(new THREE.BoxGeometry(bw,bh,bd),new THREE.MeshPhongMaterial({color:col,shininess:20}));
  b.position.y=bh/2;g.add(b);
  const wm=new THREE.MeshPhongMaterial({color:0,emissive:0xffdd55,emissiveIntensity:.05,transparent:true,opacity:.3});
  const wo=new THREE.Mesh(new THREE.BoxGeometry(bw+.05,bh,bd+.05),wm);wo.position.y=bh/2;g.add(wo);
  return g;
}

function buildTree(){const g=new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(.2,.3,2,6),new THREE.MeshPhongMaterial({color:0x5d3a1a})));
  g.children[0].position.y=1;
  const lf=new THREE.Mesh(new THREE.SphereGeometry(1.2,8,6),new THREE.MeshPhongMaterial({color:0x2e7d32}));
  lf.position.y=2.8;g.add(lf);return g}
function buildHydrant(){const g=new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(.25,.3,.9,8),new THREE.MeshPhongMaterial({color:0xc62828})));
  g.children[0].position.y=.45;
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.28,6,4),new THREE.MeshPhongMaterial({color:0xe53935}));
  cap.position.y=.95;g.add(cap);return g}
function buildTrashcan(){const g=new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(.35,.3,1,8),new THREE.MeshPhongMaterial({color:0x546e7a})));
  g.children[0].position.y=.5;
  const lid=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.08,8),new THREE.MeshPhongMaterial({color:0x607d8b}));
  lid.position.y=1.04;g.add(lid);return g}
function buildCone(){const g=new THREE.Group();
  g.add(new THREE.Mesh(new THREE.ConeGeometry(.25,.8,8),new THREE.MeshPhongMaterial({color:0xff6d00})));
  g.children[0].position.y=.4;
  const band=new THREE.Mesh(new THREE.CylinderGeometry(.2,.22,.1,8),new THREE.MeshPhongMaterial({color:0xffffff}));
  band.position.y=.35;g.add(band);return g}
function buildBarrel(){const g=new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.9,8),new THREE.MeshPhongMaterial({color:0x5d4037})));
  g.children[0].position.y=.45;
  const band=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.06,8),new THREE.MeshPhongMaterial({color:0xffb300}));
  band.position.y=.5;g.add(band);return g}
const LOCO_BUILDERS=[buildTree,buildHydrant,buildTrashcan,buildCone,buildBarrel];

function createRoadTex(lanes){
  const c=document.createElement('canvas');c.width=512;c.height=512;const x=c.getContext('2d');
  x.fillStyle='#22222e';x.fillRect(0,0,512,512);
  x.fillStyle='#ddaa22';x.fillRect(0,0,8,512);x.fillRect(504,0,8,512);
  x.fillStyle='rgba(255,255,255,0.6)';
  for(let l=1;l<lanes;l++){const lx=Math.round(l/lanes*512);for(let y=0;y<512;y+=48){x.fillRect(lx-1,y,3,24)}}
  x.fillStyle='rgba(255,255,255,0.03)';x.fillRect(240,0,32,512);
  const t=new THREE.CanvasTexture(c);t.wrapS=THREE.RepeatWrapping;t.wrapT=THREE.RepeatWrapping;t.repeat.set(1,25);return t;
}

export class EstrellaGame{
  constructor(canvas){
    this.canvas=canvas;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x040810);
    this.scene=new THREE.Scene();
    this.scene.fog=new THREE.FogExp2(0x060a1a,.006);
    this.camera=new THREE.PerspectiveCamera(62,1,.1,500);
    this.w=0;this.h=0;this.resize(window.innerWidth,window.innerHeight);
    const amb=new THREE.AmbientLight(0x223355,.45);this.scene.add(amb);
    this.dirLight=new THREE.DirectionalLight(0xffffff,.65);
    this.dirLight.position.set(8,25,15);this.dirLight.castShadow=true;
    this.dirLight.shadow.mapSize.set(1024,1024);this.dirLight.shadow.camera.far=120;
    this.scene.add(this.dirLight);
    const moon=new THREE.PointLight(0x4466aa,.2,200);moon.position.set(-30,60,80);this.scene.add(moon);
    const sg=new THREE.BufferGeometry();const sp=[];for(let i=0;i<300;i++){sp.push(rand(-150,150),rand(30,100),rand(50,250))}
    sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
    this.stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:.4,sizeAttenuation:true}));this.scene.add(this.stars);
    const gnd=new THREE.Mesh(new THREE.PlaneGeometry(400,ROAD_LEN+100),new THREE.MeshPhongMaterial({color:0x0a1a0a}));
    gnd.rotation.x=-Math.PI/2;gnd.position.set(0,-.02,ROAD_LEN/2);gnd.receiveShadow=true;this.scene.add(gnd);
    this.roadTex=createRoadTex(3);
    this.road=new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W,ROAD_LEN),new THREE.MeshPhongMaterial({map:this.roadTex}));
    this.road.rotation.x=-Math.PI/2;this.road.position.set(0,0,ROAD_LEN/2);this.road.receiveShadow=true;this.scene.add(this.road);
    this._buildSkyline();
    this.playerCar=null;this.obMeshes=[];this.colMeshes=[];this.rampMeshes=[];this.locoGroup=null;
    this.profile={primaryName:'Axel',secondaryName:'Jade'};this.driverKey='primary';this.difficulty='medium';
    this.muted=false;this.mode='race';this.runState='idle';
    this.distance=0;this.speed=0;this.playerLane=1;this.playerX=0;
    this.score=0;this.fuel=100;this.lives=3;this.maxLives=3;this.courseLength=COURSE_BASE;
    this.invincible=false;this.invTimer=0;this.boosting=false;this.boostTimer=0;
    this.obstacles=[];this.collectibles=[];this.ramps=[];
    this.flashKey=null;this.flashTimer=0;this.timer=0;this.combo=0;this.comboTimer=0;
    this.locoX=0;this.locoZ=0;this.locoAngle=0;this.locoSpeed=0;this.locoProps=[];this.locoDamage=0;
    this.controls={left:false,right:false,up:false,down:false};
    this.tiltSide=0;this.tiltThrottle=0;
    this.audioCtx=null;this.musicInterval=null;this.noteIndex=0;this.lastTs=0;
  }

  _buildSkyline(){
    this.willis=buildWillis();this.willis.position.set(0,0,250);this.scene.add(this.willis);
    const specs=[[5,25,5,-20,230],[4,18,4,-30,220],[6,30,5,20,240],[3,15,3,30,210],
      [5,35,4,-40,245],[4,20,4,40,235],[7,22,6,-55,225],[3,28,3,55,215],
      [5,16,5,-70,240],[4,24,4,65,230],[6,20,5,-85,220],[3,32,3,80,250],
      [4,14,4,-95,215],[5,26,5,90,245],[3,18,3,-110,235],[4,22,4,100,225]];
    for(const[bw,bh,bd,bx,bz] of specs){const b=buildBldg(bw,bh,bd,0x0c0c1a);b.position.set(bx,0,bz);this.scene.add(b)}
  }

  resize(vw,vh){this.w=vw;this.h=vh;this.renderer.setSize(vw,vh);this.camera.aspect=vw/vh;this.camera.updateProjectionMatrix()}
  setProfile(p){this.profile=p}
  setDriverKey(k){this.driverKey=k}
  setDifficulty(d){this.difficulty=d}
  setMuted(m){this.muted=m;if(m)this.stopMusic()}
  getRunState(){return this.runState}
  getMode(){return this.mode}
  get isAxel(){return this.driverKey==='primary'}
  get driverName(){return this.isAxel?this.profile.primaryName:this.profile.secondaryName}
  get df(){return DIFF[this.difficulty]||DIFF.medium}

  start(mode){
    this.mode=mode;this.runState='playing';this.lastTs=0;
    this.score=0;this.timer=0;this.flashKey=null;this.flashTimer=0;this.combo=0;this.comboTimer=0;
    for(const m of this.obMeshes)this.scene.remove(m);this.obMeshes=[];
    for(const m of this.colMeshes)this.scene.remove(m);this.colMeshes=[];
    for(const m of this.rampMeshes)this.scene.remove(m);this.rampMeshes=[];
    if(this.locoGroup){this.scene.remove(this.locoGroup);this.locoGroup=null}
    if(this.playerCar)this.scene.remove(this.playerCar);
    const pc=this.isAxel?PCOL[0]:PCOL[3];
    this.playerCar=buildCar(pc.b,pc.a,true);
    this.scene.add(this.playerCar);
    if(mode==='race'){
      this.roadTex=createRoadTex(this.df.lanes);this.road.material.map=this.roadTex;this.road.material.needsUpdate=true;
      this.road.visible=true;
      this.distance=0;this.speed=BASE_SPEED*this.df.sm;this.playerLane=1;this.playerX=0;
      this.fuel=100;this.lives=this.df.lives;this.maxLives=this.df.lives;
      this.courseLength=COURSE_BASE*this.df.cl;
      this.invincible=false;this.invTimer=0;this.boosting=false;this.boostTimer=0;
      this.obstacles=[];this.collectibles=[];this.ramps=[];
      for(let i=0;i<3;i++)this._spawnOb(rand(40,100+i*60));
      this._spawnCol(rand(30,60));this._spawnRamp(rand(80,150));
    }else{
      this.road.visible=false;
      this.locoX=0;this.locoZ=0;this.locoAngle=0;this.locoSpeed=0;this.locoDamage=0;
      this.lives=this.df.lives;this.maxLives=this.df.lives;
      this.locoGroup=new THREE.Group();this.scene.add(this.locoGroup);
      const ag=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshPhongMaterial({color:0x1a2a10}));
      ag.rotation.x=-Math.PI/2;ag.receiveShadow=true;this.locoGroup.add(ag);
      this.locoProps=[];
      for(let i=0;i<40;i++){const b=choose(LOCO_BUILDERS);const m=b();
        m.position.set(rand(-80,80),0,rand(-80,80));m.scale.setScalar(rand(.8,1.5));
        this.locoGroup.add(m);this.locoProps.push({mesh:m,alive:true})}
    }
    if(!this.muted)this.startMusic();
  }

  _laneX(lane){const lanes=this.df.lanes;return(lane-(lanes-1)/2)*LANE_W}
  _spawnOb(d){
    const lane=(Math.random()*this.df.lanes)|0;const dist=this.distance+(d||rand(40,90));
    const fc=choose(FCOL);const mesh=buildCar(fc.b,fc.a,false);
    mesh.position.set(this._laneX(lane),0,dist);this.scene.add(mesh);this.obMeshes.push(mesh);
    this.obstacles.push({lane,dist,mesh,hit:false});
  }
  _spawnCol(d){
    const lane=(Math.random()*this.df.lanes)|0;const dist=this.distance+(d||rand(30,70));
    const isFuel=Math.random()<.3;
    const mat=new THREE.MeshPhongMaterial({color:isFuel?0x00bcd4:0xffd700,emissive:isFuel?0x006064:0xff8f00,emissiveIntensity:.4});
    const mesh=new THREE.Mesh(isFuel?new THREE.CylinderGeometry(.3,.35,.6,8):new THREE.OctahedronGeometry(.4),mat);
    mesh.position.set(this._laneX(lane),.6,dist);mesh.castShadow=true;this.scene.add(mesh);this.colMeshes.push(mesh);
    this.collectibles.push({lane,dist,type:isFuel?'fuel':'star',mesh,collected:false});
  }
  _spawnRamp(d){
    const lane=(Math.random()*this.df.lanes)|0;const dist=this.distance+(d||rand(70,140));
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(2.5,.15,1.5),new THREE.MeshPhongMaterial({color:0xff9800,emissive:0xff6d00,emissiveIntensity:.3}));
    mesh.position.set(this._laneX(lane),.08,dist);mesh.rotation.x=-.12;this.scene.add(mesh);this.rampMeshes.push(mesh);
    this.ramps.push({lane,dist,mesh,hit:false});
  }

  stopToMenu(){this.runState='idle';this.stopMusic()}
  togglePause(){if(this.runState==='playing'){this.runState='paused';this.stopMusic()}else if(this.runState==='paused'){this.runState='playing';if(!this.muted)this.startMusic()}}
  setControl(k,v){this.controls[k]=v}
  setTiltInput(s,t){this.tiltSide=s;this.tiltThrottle=t}
  clearTiltInput(){this.tiltSide=0;this.tiltThrottle=0}
  moveLane(d){if(this.mode==='race')this.playerLane=clamp(this.playerLane+d,0,this.df.lanes-1)}
  tapAt(x){if(this.mode==='race')this.moveLane(x<this.w/2?-1:1)}

  getSnapshot(){return{mode:this.mode,score:this.score,fuel:Math.round(this.fuel),lives:this.lives,maxLives:this.maxLives,progress:this.mode==='race'?clamp(this.distance/this.courseLength,0,1):0,flashKey:this.flashKey,boosting:this.boosting,timer:this.timer,damage:Math.round(this.locoDamage),paused:this.runState==='paused'}}
  getResult(){if(this.mode==='loco')return{t:'LOCO OVER!',m:'Total chaos!',s:this.score};if(this.distance>=this.courseLength)return{t:'FINISH!',m:'Amazing run!',s:this.score};if(this.fuel<=0)return{t:'OUT OF GAS!',m:'Find more fuel!',s:this.score};return{t:'WRECKED!',m:'Try again!',s:this.score}}
  _flash(k){this.flashKey=k;this.flashTimer=1.2}

  _crash(){
    this.lives--;this._flash('\u{1F494} OUCH!');
    if(this.lives<=0){this.runState='gameover';this.stopMusic();return}
    this.invincible=true;this.invTimer=3;this.playerLane=1;this.speed*=.5;
    const clearDist=120;
    this.obstacles=this.obstacles.filter(o=>{
      const d=o.dist-this.distance;if(d>0&&d<clearDist){this.scene.remove(o.mesh);return false}return true});
  }

  frame(ts){
    if(this.runState==='idle'){this._renderIdle();return}
    if(!this.lastTs){this.lastTs=ts;this._render();return}
    const dt=Math.min((ts-this.lastTs)/1000,.05);this.lastTs=ts;
    if(this.runState==='playing'){
      this.timer+=dt;this.flashTimer-=dt;if(this.flashTimer<=0)this.flashKey=null;
      this.comboTimer-=dt;if(this.comboTimer<=0)this.combo=0;
      if(this.mode==='race')this._updateRace(dt);else this._updateLoco(dt);
    }
    this._render();
  }

  _updateRace(dt){
    if(this.invincible){this.invTimer-=dt;if(this.invTimer<=0)this.invincible=false}
    if(this.boosting){this.boostTimer-=dt;if(this.boostTimer<=0){this.boosting=false;this.speed=BASE_SPEED*this.df.sm}}
    let ts=BASE_SPEED*this.df.sm;if(this.boosting)ts*=1.8;
    if(this.controls.up||this.tiltThrottle>.2)ts*=1.35;
    if(this.controls.down||this.tiltThrottle<-.2)ts*=.55;
    this.speed=lerp(this.speed,ts,dt*3);
    if(Math.abs(this.tiltSide)>.15){this.playerX+=this.tiltSide*dt*LANE_W*2;this.playerLane=clamp(Math.round((this.playerX/LANE_W)+(this.df.lanes-1)/2),0,this.df.lanes-1)}
    const targetX=this._laneX(this.playerLane);
    this.playerX=lerp(this.playerX,targetX,dt*10);
    this.distance+=this.speed*dt;
    this.fuel-=dt*2.2*(this.boosting?2:1);
    if(this.fuel<=15&&Math.random()<.008)this._flash('\u26FD LOW FUEL!');
    if(this.fuel<=0){this.fuel=0;this.runState='gameover';this.stopMusic();return}
    if(this.distance>=this.courseLength){this.runState='gameover';this.stopMusic();return}
    this.roadTex.offset.y-=this.speed*dt*.018;
    const pw=1.2;
    for(const o of this.obstacles){if(o.hit)continue;const rd=o.dist-this.distance;
      if(rd<2&&rd>-2){const ox=this._laneX(o.lane);if(Math.abs(this.playerX-ox)<pw){o.hit=true;if(!this.invincible)this._crash()}
        if(!o.hit&&!o._nm&&Math.abs(this.playerX-ox)<pw*2){o._nm=true;this.score+=50;this.combo++;this.comboTimer=2;if(this.combo>=3)this._flash('\u{1F60E} NEAR MISS!')}}}
    for(const c of this.collectibles){if(c.collected)continue;const rd=c.dist-this.distance;
      if(rd<2&&rd>-1){const cx2=this._laneX(c.lane);if(Math.abs(this.playerX-cx2)<pw*1.3){c.collected=true;this.scene.remove(c.mesh);
        if(c.type==='fuel'){this.fuel=Math.min(100,this.fuel+25);this._flash('\u26FD FUEL UP!');this.score+=30}
        else{this.score+=100;this.combo++;this.comboTimer=2;if(this.combo>=3)this._flash('\u2B50 STAR CHAIN!')}}}}
    for(const r of this.ramps){if(r.hit)continue;const rd=r.dist-this.distance;
      if(rd<2&&rd>-1){const rx=this._laneX(r.lane);if(Math.abs(this.playerX-rx)<pw*1.3){
        r.hit=true;this.boosting=true;this.boostTimer=3;this.speed=BASE_SPEED*this.df.sm*1.8;
        this._flash('\u{1F680} BOOST!');this.score+=200}}}
    this.obstacles=this.obstacles.filter(o=>{if(o.dist<this.distance-20){this.scene.remove(o.mesh);return false}return true});
    this.collectibles=this.collectibles.filter(c=>{if(c.dist<this.distance-20){if(!c.collected)this.scene.remove(c.mesh);return false}return true});
    this.ramps=this.ramps.filter(r=>{if(r.dist<this.distance-20){this.scene.remove(r.mesh);return false}return true});
    const md=this.obstacles.length?Math.max(...this.obstacles.map(o=>o.dist)):this.distance;
    if(md-this.distance<80){const n=Math.random()<this.df.sp*.3?2:1;for(let i=0;i<n;i++)this._spawnOb()}
    if(this.collectibles.filter(c=>!c.collected&&c.dist>this.distance).length<2)this._spawnCol();
    if(this.ramps.filter(r=>!r.hit&&r.dist>this.distance).length<1&&Math.random()<.01)this._spawnRamp();
  }

  _updateLoco(dt){
    const ac=80*this.df.sm;
    if(this.controls.up||this.tiltThrottle>.2)this.locoSpeed+=ac*dt;
    if(this.controls.down||this.tiltThrottle<-.2)this.locoSpeed-=ac*.6*dt;
    this.locoSpeed*=.97;this.locoSpeed=clamp(this.locoSpeed,-30,70*this.df.sm);
    let turn=0;if(this.controls.left||this.tiltSide<-.15)turn=-2.5;if(this.controls.right||this.tiltSide>.15)turn=2.5;
    this.locoAngle+=turn*dt*(.5+Math.abs(this.locoSpeed)/50);
    this.locoX+=Math.sin(this.locoAngle)*this.locoSpeed*dt;
    this.locoZ+=Math.cos(this.locoAngle)*this.locoSpeed*dt;
    this.score+=Math.abs(this.locoSpeed)*dt*.5|0;
    for(const p of this.locoProps){if(!p.alive)continue;
      const dx=this.locoX-p.mesh.position.x,dz=this.locoZ-p.mesh.position.z;
      if(dx*dx+dz*dz<4){p.alive=false;this.locoGroup.remove(p.mesh);this.score+=50;
        this.locoDamage=Math.min(100,this.locoDamage+6);this._flash('\u{1F4A5} SMASH!');
        if(this.locoDamage>=100){this.lives--;if(this.lives<=0){this.runState='gameover';this.stopMusic();return}this.locoDamage=0;this._flash('\u{1F494} OUCH!')}}}
    if(this.locoProps.filter(p=>p.alive).length<20){
      for(let i=0;i<8;i++){const b=choose(LOCO_BUILDERS);const m=b();
        m.position.set(this.locoX+rand(-80,80),0,this.locoZ+rand(-80,80));m.scale.setScalar(rand(.8,1.5));
        this.locoGroup.add(m);this.locoProps.push({mesh:m,alive:true})}}
  }

  _render(){
    if(this.mode==='race')this._renderRace();else this._renderLoco();
  }

  _renderIdle(){
    this.camera.position.set(0,CAM_H,-CAM_BACK);this.camera.lookAt(0,2,30);
    if(this.willis&&this.willis._lights){const blink=Math.sin(Date.now()*.003)>.3?1:.1;
    this.willis._lights.forEach(l=>{l.material.emissiveIntensity=blink})}
    this.renderer.render(this.scene,this.camera);
  }

  _renderRace(){
    this.camera.position.set(this.playerX*0.5,CAM_H,this.distance-CAM_BACK);
    this.camera.lookAt(this.playerX*0.3,1.5,this.distance+30);
    this.playerCar.position.set(this.playerX,.0,this.distance);
    if(this.invincible){this.playerCar.visible=Math.sin(Date.now()*.015)>0}else{this.playerCar.visible=true}
    for(const o of this.obstacles){if(!o.hit)o.mesh.position.z=o.dist}
    for(const c of this.collectibles){if(!c.collected){c.mesh.position.z=c.dist;c.mesh.rotation.y+=.03}}
    for(const r of this.ramps){r.mesh.position.z=r.dist}
    if(this.willis&&this.willis._lights){const blink=Math.sin(Date.now()*.003)>.3?1:.1;
    this.willis._lights.forEach(l=>{l.material.emissiveIntensity=blink})}
    this.dirLight.position.set(this.playerX+8,25,this.distance+15);
    this.dirLight.target.position.set(this.playerX,0,this.distance+10);
    this.dirLight.target.updateMatrixWorld();
    this.renderer.render(this.scene,this.camera);
  }

  _renderLoco(){
    this.playerCar.position.set(this.locoX,0,this.locoZ);
    this.playerCar.rotation.y=this.locoAngle;
    if(this.invincible){this.playerCar.visible=Math.sin(Date.now()*.015)>0}else{this.playerCar.visible=true}
    const camDist=12;
    this.camera.position.set(this.locoX-Math.sin(this.locoAngle)*camDist,8,this.locoZ-Math.cos(this.locoAngle)*camDist);
    this.camera.lookAt(this.locoX,1,this.locoZ);
    this.dirLight.position.set(this.locoX+8,25,this.locoZ+15);
    this.renderer.render(this.scene,this.camera);
  }

  unlockAudio(){if(this.audioCtx)return;this.audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(this.audioCtx.state==='suspended')this.audioCtx.resume()}
  toggleMuted(){this.muted=!this.muted;if(this.muted)this.stopMusic();else if(this.runState==='playing')this.startMusic();return this.muted}
  startMusic(){if(this.musicInterval||!this.audioCtx||this.muted)return;const notes=this.mode==='race'?[262,330,392,523,392,330,349,440,523,440,349,294]:[196,247,330,392,330,294,262,330,392,523,440,330];this.noteIndex=0;this.musicInterval=setInterval(()=>{if(!this.audioCtx)return;try{const o=this.audioCtx.createOscillator();const g=this.audioCtx.createGain();o.type=this.mode==='race'?'triangle':'sawtooth';o.frequency.value=notes[this.noteIndex%notes.length];g.gain.value=.06;g.gain.exponentialRampToValueAtTime(.001,this.audioCtx.currentTime+.2);o.connect(g);g.connect(this.audioCtx.destination);o.start();o.stop(this.audioCtx.currentTime+.2);this.noteIndex++}catch(e){}},220)}
  stopMusic(){if(this.musicInterval){clearInterval(this.musicInterval);this.musicInterval=null}}
}

export function drawAvatar(ctx,cx,cy,sz,isAxel){
  const r=sz*.38;ctx.save();
  ctx.fillStyle='#c8956c';ctx.fillRect(cx-r*.22,cy+r*.85,r*.44,r*.45);
  ctx.fillStyle=isAxel?'#d32f2f':'#6a1b9a';ctx.beginPath();ctx.moveTo(cx-r*.5,cy+r*1.15);
  ctx.quadraticCurveTo(cx,cy+r*.95,cx+r*.5,cy+r*1.15);ctx.lineTo(cx+r*.6,cy+r*1.55);ctx.lineTo(cx-r*.6,cy+r*1.55);ctx.fill();
  ctx.strokeStyle=isAxel?'#ffd54f':'#ce93d8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-r*.18,cy+r*1.05);ctx.lineTo(cx,cy+r*1.25);ctx.lineTo(cx+r*.18,cy+r*1.05);ctx.stroke();
  ctx.beginPath();ctx.ellipse(cx,cy,r*.92,r*1.05,0,0,Math.PI*2);ctx.fillStyle='#d4a574';ctx.fill();
  ctx.fillStyle='#c8956c';ctx.beginPath();ctx.ellipse(cx-r*.88,cy+r*.05,r*.1,r*.15,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+r*.88,cy+r*.05,r*.1,r*.15,0,0,Math.PI*2);ctx.fill();
  if(isAxel){ctx.fillStyle='#2a1506';ctx.beginPath();ctx.ellipse(cx,cy-r*.55,r*.95,r*.55,0,Math.PI,0,true);ctx.fill();
    for(let i=-4;i<=4;i++){const a=-Math.PI/2+i*.16,tip=r*(1.05+Math.abs(i)*.03);ctx.beginPath();
    ctx.moveTo(cx+Math.cos(a-.09)*r*.82,cy-r*.25+Math.sin(a-.09)*r*.65);
    ctx.lineTo(cx+Math.cos(a)*tip,cy-r*.25+Math.sin(a)*tip*.82);
    ctx.lineTo(cx+Math.cos(a+.09)*r*.82,cy-r*.25+Math.sin(a+.09)*r*.65);ctx.fill()}
    ctx.fillRect(cx-r*.92,cy-r*.4,r*.12,r*.55);ctx.fillRect(cx+r*.8,cy-r*.4,r*.12,r*.55);
  }else{ctx.fillStyle='#1a0800';ctx.beginPath();ctx.ellipse(cx,cy-r*.35,r*1.05,r*.72,0,Math.PI,0,true);ctx.fill();
    ctx.beginPath();ctx.moveTo(cx-r*.98,cy-r*.25);ctx.quadraticCurveTo(cx-r*1.12,cy+r*.6,cx-r*.65,cy+r*1.4);ctx.lineTo(cx-r*.45,cy+r*.85);ctx.fill();
    ctx.beginPath();ctx.moveTo(cx+r*.98,cy-r*.25);ctx.quadraticCurveTo(cx+r*1.12,cy+r*.6,cx+r*.65,cy+r*1.4);ctx.lineTo(cx+r*.45,cy+r*.85);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx-r*.15,cy-r*.6,r*.55,r*.3,.1,0,Math.PI);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx+r*.2,cy-r*.62,r*.45,r*.28,-.1,0,Math.PI);ctx.fill();}
  ctx.strokeStyle=isAxel?'#2a1506':'#1a0800';ctx.lineWidth=sz*.022;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(cx-r*.38,cy-r*.28);ctx.quadraticCurveTo(cx-r*.22,cy-r*.38,cx-r*.06,cy-r*.3);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+r*.06,cy-r*.3);ctx.quadraticCurveTo(cx+r*.22,cy-r*.38,cx+r*.38,cy-r*.28);ctx.stroke();
  const ey=cy-r*.1,ex=r*.24;ctx.fillStyle='#fff';
  ctx.beginPath();ctx.ellipse(cx-ex,ey,r*.14,r*.1,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+ex,ey,r*.14,r*.1,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=isAxel?'#5c3a1e':'#2e7d32';ctx.beginPath();ctx.arc(cx-ex,ey,r*.075,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(cx+ex,ey,r*.075,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(cx-ex,ey,r*.038,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(cx+ex,ey,r*.038,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx-ex+r*.04,ey-r*.03,r*.022,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(cx+ex+r*.04,ey-r*.03,r*.022,0,Math.PI*2);ctx.fill();
  if(!isAxel){ctx.strokeStyle='#1a0800';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx-ex-r*.12,ey-r*.06);ctx.lineTo(cx-ex-r*.16,ey-r*.12);ctx.stroke();ctx.beginPath();ctx.moveTo(cx+ex+r*.12,ey-r*.06);ctx.lineTo(cx+ex+r*.16,ey-r*.12);ctx.stroke()}
  ctx.strokeStyle='#b8896a';ctx.lineWidth=1.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx,cy+r*.02);ctx.quadraticCurveTo(cx+r*.08,cy+r*.15,cx,cy+r*.2);ctx.stroke();
  ctx.fillStyle=isAxel?'#c2836a':'#d4727a';ctx.beginPath();ctx.ellipse(cx,cy+r*.35,r*.16,r*.055,0,0,Math.PI);ctx.fill();
  ctx.strokeStyle='#9e6b4a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy+r*.28,r*.16,.15,Math.PI-.15);ctx.stroke();
  ctx.fillStyle='rgba(220,120,100,.18)';ctx.beginPath();ctx.ellipse(cx-r*.4,cy+r*.18,r*.12,r*.08,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+r*.4,cy+r*.18,r*.12,r*.08,0,0,Math.PI*2);ctx.fill();
  ctx.restore();}