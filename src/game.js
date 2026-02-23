const MAX_DPR = 2;
const STAR_COUNT = 90;
const RACE_PLAYER_Y = 0.82;
const BASE_SPEED = 340;
const COURSE_BASE = 6000;

const CAR_PRESETS = [
  { id:'cometa-roja', body:'#e53935', accent:'#ffd54f', stripe:'#fff176', glow:'rgba(255,80,60,0.5)' },
  { id:'pulso-azul',  body:'#2979ff', accent:'#80d8ff', stripe:'#b3e5fc', glow:'rgba(60,140,255,0.5)' },
  { id:'volt-verde',  body:'#00c853', accent:'#b2ff59', stripe:'#f1f8e9', glow:'rgba(50,220,120,0.5)' },
  { id:'nova-drift',  body:'#aa00ff', accent:'#ea80fc', stripe:'#f3e5f5', glow:'rgba(170,0,255,0.5)' },
  { id:'turbo-sol',   body:'#ffab00', accent:'#fff9c4', stripe:'#fff8e1', glow:'rgba(255,170,0,0.5)' }
];
const FLEET_PRESETS = [
  { body:'#1a1a2e', accent:'#ff1744', stripe:'#4a0010', glow:'rgba(255,23,68,0.4)' },
  { body:'#0d1b2a', accent:'#ff6d00', stripe:'#3e1500', glow:'rgba(255,109,0,0.4)' },
  { body:'#1b0a2e', accent:'#d500f9', stripe:'#38006b', glow:'rgba(213,0,249,0.4)' },
  { body:'#0a1929', accent:'#00e5ff', stripe:'#004d5a', glow:'rgba(0,229,255,0.4)' }
];

const DIFF = {
  easy:   { speedMul:0.7, spawnMul:0.5, lanes:3, courseMul:0.6, lives:5 },
  medium: { speedMul:1.0, spawnMul:1.0, lanes:3, courseMul:1.0, lives:3 },
  hard:   { speedMul:1.4, spawnMul:1.6, lanes:4, courseMul:1.5, lives:2 }
};

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rand(a, b) { return a + Math.random() * (b - a); }
function choose(arr) { return arr[(Math.random() * arr.length) | 0]; }
function lerp(a, b, t) { return a + (b - a) * t; }

function drawRoundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export function drawAvatar(ctx, cx, cy, sz, isAxel) {
  const s = sz * 0.42;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.1, s, 0, Math.PI * 2);
  ctx.fillStyle = isAxel ? '#e53935' : '#7c4dff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.05, s * 0.7, s * 0.4, 0, 0, Math.PI);
  ctx.fillStyle = 'rgba(100,200,255,0.35)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,230,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.05, s * 0.65, s * 0.36, 0, 0, Math.PI);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(cx, cy + s * 0.12, s * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = '#d4a574';
  ctx.fill();
  const eyeY = cy + s * 0.02;
  const eyeSpread = s * 0.18;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(cx - eyeSpread, eyeY, s * 0.1, s * 0.07, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + eyeSpread, eyeY, s * 0.1, s * 0.07, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath(); ctx.arc(cx - eyeSpread, eyeY, s * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + eyeSpread, eyeY, s * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8b5e3c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy + s * 0.08, s * 0.14, 0.15, Math.PI - 0.15);
  ctx.stroke();
  if (isAxel) {
    ctx.fillStyle = '#2a1506';
    for (let i = -2; i <= 2; i++) {
      const a = -Math.PI / 2 + i * 0.22;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a - 0.1) * s * 0.42, cy - s * 0.2 + Math.sin(a - 0.1) * s * 0.35);
      ctx.lineTo(cx + Math.cos(a) * s * 0.62, cy - s * 0.2 + Math.sin(a) * s * 0.55);
      ctx.lineTo(cx + Math.cos(a + 0.1) * s * 0.42, cy - s * 0.2 + Math.sin(a + 0.1) * s * 0.35);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = '#1a0800';
    ctx.beginPath();
    ctx.ellipse(cx, cy - s * 0.18, s * 0.52, s * 0.28, 0, Math.PI + 0.3, -0.3);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = isAxel ? '#ffd54f' : '#ea80fc';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.1, s * 0.92, -Math.PI * 0.75, -Math.PI * 0.25);
  ctx.stroke();
  const starX = cx, starY = cy - s * 0.75;
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  let sa = -Math.PI / 2;
  const step = Math.PI / 5;
  for (let i = 0; i < 10; i++) {
    const r2 = i % 2 === 0 ? s * 0.16 : s * 0.07;
    const px = starX + Math.cos(sa) * r2;
    const py = starY + Math.sin(sa) * r2;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    sa += step;
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}


function drawDriverSilhouette(ctx, w, horizonY, isAxel) {
  const sz = Math.min(w * 0.08, 40);
  const cx = w * 0.85;
  const cy = horizonY * 0.35;
  ctx.globalAlpha = 0.12;
  drawAvatar(ctx, cx, cy, sz * 2.5, isAxel);
  ctx.globalAlpha = 1;
}

function drawChicagoSkyline(ctx, w, horizonY) {
  const bldgs = [
    { x:0.03, w:0.02, h:0.18 },{ x:0.06, w:0.025, h:0.24 },
    { x:0.10, w:0.018, h:0.30 },{ x:0.13, w:0.028, h:0.20 },
    { x:0.17, w:0.022, h:0.38 },{ x:0.21, w:0.025, h:0.26 },
    { x:0.25, w:0.03, h:0.44 },{ x:0.30, w:0.02, h:0.32 },
    { x:0.34, w:0.042, h:0.58, willis:true },
    { x:0.39, w:0.025, h:0.30 },{ x:0.43, w:0.03, h:0.40 },
    { x:0.47, w:0.022, h:0.34 },{ x:0.50, w:0.035, h:0.46 },
    { x:0.55, w:0.02, h:0.28 },{ x:0.58, w:0.03, h:0.36 },
    { x:0.62, w:0.025, h:0.22 },{ x:0.66, w:0.032, h:0.48 },
    { x:0.70, w:0.02, h:0.30 },{ x:0.74, w:0.028, h:0.24 },
    { x:0.78, w:0.022, h:0.34 },{ x:0.82, w:0.02, h:0.20 },
    { x:0.86, w:0.025, h:0.26 },{ x:0.90, w:0.028, h:0.18 },
    { x:0.94, w:0.022, h:0.22 }
  ];
  for (const b of bldgs) {
    const bx = b.x * w, bw = b.w * w, bh = b.h * horizonY, by = horizonY - bh;
    ctx.fillStyle = 'rgba(8,12,30,0.88)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = 'rgba(255,220,100,0.2)';
    const winGap = Math.max(bw * 0.22, 4);
    for (let wy = by + 5; wy < horizonY - 3; wy += 7) {
      for (let wx = bx + winGap; wx < bx + bw - winGap; wx += winGap) {
        if (Math.random() > 0.35) ctx.fillRect(wx, wy, bw * 0.12, 2.5);
      }
    }
    if (b.willis) {
      ctx.fillStyle = 'rgba(8,12,30,0.88)';
      ctx.fillRect(bx + bw * 0.3, by - horizonY * 0.08, 2, horizonY * 0.08);
      ctx.fillRect(bx + bw * 0.65, by - horizonY * 0.06, 2, horizonY * 0.06);
      ctx.fillStyle = '#ff3333';
      ctx.beginPath(); ctx.arc(bx + bw * 0.3 + 1, by - horizonY * 0.08, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(bx + bw * 0.65 + 1, by - horizonY * 0.06, 2, 0, Math.PI * 2); ctx.fill();
    }
  }
}

export class EstrellaGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.w = 0; this.h = 0; this.dpr = 1;
    this.resize(window.innerWidth, window.innerHeight);
    this.stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      this.stars.push({ x: Math.random(), y: Math.random(), s: rand(0.5, 2.2), b: rand(0.3, 1) });
    }
    this.language = 'en';
    this.profile = { primaryName: 'Axel', secondaryName: 'Jade' };
    this.driverKey = 'primary';
    this.difficulty = 'medium';
    this.muted = false;
    this.mode = 'race';
    this.runState = 'idle';
    this.distance = 0; this.speed = 0; this.playerLane = 1; this.playerX = 0.5;
    this.score = 0; this.fuel = 100; this.lives = 3; this.maxLives = 3;
    this.courseLength = COURSE_BASE;
    this.invincible = false; this.invTimer = 0;
    this.boosting = false; this.boostTimer = 0;
    this.obstacles = []; this.collectibles = []; this.ramps = [];
    this.particles = [];
    this.flashKey = null; this.flashTimer = 0;
    this.timer = 0; this.combo = 0; this.comboTimer = 0;
    this.locoX = 0; this.locoZ = 0; this.locoAngle = 0;
    this.locoSpeed = 0; this.locoProps = []; this.locoDamage = 0;
    this.controls = { left: false, right: false, up: false, down: false };
    this.tiltSide = 0; this.tiltThrottle = 0;
    this.audioCtx = null; this.musicInterval = null; this.noteIndex = 0;
    this.lastTs = 0; this.skylineCache = null; this.skylineCacheW = 0;
  }

  resize(vw, vh) {
    this.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    this.w = vw; this.h = vh;
    this.canvas.width = vw * this.dpr;
    this.canvas.height = vh * this.dpr;
    this.canvas.style.width = vw + 'px';
    this.canvas.style.height = vh + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.skylineCache = null;
  }

  setLanguage(l) { this.language = l; }
  setProfile(p) { this.profile = p; }
  setDriverKey(k) { this.driverKey = k; }
  setDifficulty(d) { this.difficulty = d; }
  setMuted(m) { this.muted = m; if (m) this.stopMusic(); }
  getRunState() { return this.runState; }
  getMode() { return this.mode; }
  get isAxel() { return this.driverKey === 'primary'; }
  get driverName() { return this.isAxel ? this.profile.primaryName : this.profile.secondaryName; }
  get diff() { return DIFF[this.difficulty] || DIFF.medium; }

  start(mode) {
    this.mode = mode; this.runState = 'playing'; this.lastTs = 0;
    this.score = 0; this.timer = 0; this.flashKey = null; this.flashTimer = 0;
    this.combo = 0; this.comboTimer = 0; this.particles = [];
    if (mode === 'race') {
      this.distance = 0; this.speed = BASE_SPEED * this.diff.speedMul;
      this.playerLane = 1; this.playerX = 0.5;
      this.fuel = 100; this.lives = this.diff.lives; this.maxLives = this.diff.lives;
      this.courseLength = COURSE_BASE * this.diff.courseMul;
      this.invincible = false; this.invTimer = 0;
      this.boosting = false; this.boostTimer = 0;
      this.obstacles = []; this.collectibles = []; this.ramps = [];
      this._spawnInitial();
    } else {
      this.locoX = 0; this.locoZ = 0; this.locoAngle = 0;
      this.locoSpeed = 0; this.locoDamage = 0;
      this.lives = this.diff.lives; this.maxLives = this.diff.lives;
      this.locoProps = [];
      for (let i = 0; i < 60; i++) {
        this.locoProps.push({
          x: rand(-400, 400), z: rand(-400, 400),
          type: choose(['cone', 'barrel', 'crate']), alive: true, scale: rand(0.8, 1.3)
        });
      }
    }
    if (!this.muted) this.startMusic();
  }

  _spawnInitial() {
    for (let i = 0; i < 4; i++) this._spawnObstacle(rand(300, 800 + i * 400));
    this._spawnCollectible(rand(200, 500));
    this._spawnRamp(rand(600, 1200));
  }
  _spawnObstacle(dist) {
    this.obstacles.push({
      lane: (Math.random() * this.diff.lanes) | 0,
      dist: this.distance + (dist || rand(250, 600)),
      preset: choose(FLEET_PRESETS), hit: false
    });
  }
  _spawnCollectible(dist) {
    const type = Math.random() < 0.3 ? 'fuel' : 'star';
    this.collectibles.push({
      lane: (Math.random() * this.diff.lanes) | 0,
      dist: this.distance + (dist || rand(200, 500)),
      type, collected: false
    });
  }
  _spawnRamp(dist) {
    this.ramps.push({
      lane: (Math.random() * this.diff.lanes) | 0,
      dist: this.distance + (dist || rand(500, 1000)), hit: false
    });
  }

  stopToMenu() { this.runState = 'idle'; this.stopMusic(); }
  togglePause() {
    if (this.runState === 'playing') { this.runState = 'paused'; this.stopMusic(); }
    else if (this.runState === 'paused') { this.runState = 'playing'; if (!this.muted) this.startMusic(); }
  }
  setControl(k, v) { this.controls[k] = v; }
  setTiltInput(s, t) { this.tiltSide = s; this.tiltThrottle = t; }
  clearTiltInput() { this.tiltSide = 0; this.tiltThrottle = 0; }
  moveLane(dir) {
    if (this.mode !== 'race') return;
    this.playerLane = clamp(this.playerLane + dir, 0, this.diff.lanes - 1);
  }
  tapAt(clientX) {
    if (this.mode !== 'race') return;
    this.moveLane(clientX < this.w / 2 ? -1 : 1);
  }

  getSnapshot() {
    return {
      mode: this.mode, score: this.score, fuel: Math.round(this.fuel),
      lives: this.lives, maxLives: this.maxLives,
      progress: this.mode === 'race' ? clamp(this.distance / this.courseLength, 0, 1) : 0,
      flashKey: this.flashKey, boosting: this.boosting,
      timer: this.timer, damage: Math.round(this.locoDamage),
      paused: this.runState === 'paused'
    };
  }
  getResult() {
    if (this.mode === 'loco') return { titleKey:'resultLoco', msgKey:'resultMsgLoco', score:this.score };
    if (this.distance >= this.courseLength) return { titleKey:'resultWin', msgKey:'resultMsgWin', score:this.score };
    if (this.fuel <= 0) return { titleKey:'resultFuel', msgKey:'resultMsgFuel', score:this.score };
    return { titleKey:'resultCrash', msgKey:'resultMsgCrash', score:this.score };
  }

  _flash(key) { this.flashKey = key; this.flashTimer = 1.2; }
  _addParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y, vx: rand(-120, 120), vy: rand(-180, -40),
        life: rand(0.3, 0.8), maxLife: 0.8, color, size: rand(2, 5)
      });
    }
  }
  _handleCrash() {
    this.lives--;
    this._flash('flashDamage');
    this._addParticles(this.w * this.playerX, this.h * RACE_PLAYER_Y, 20, '#ff4444');
    if (this.lives <= 0) { this.runState = 'gameover'; this.stopMusic(); }
    else { this.invincible = true; this.invTimer = 3.0; this.playerLane = 1; this.speed *= 0.6; }
  }

  roadSample(t) {
    const curve = Math.sin((this.distance * 0.004) + t * 3.5) * 0.22 * t;
    const hill = Math.sin((this.distance * 0.002) + t * 2.2) * 0.06 * (1 - t * 0.5);
    const width = 0.06 + t * 0.55;
    const center = 0.5 + curve;
    return { center, width, hill };
  }

  frame(ts) {
    if (this.runState === 'idle') { this._drawIdle(); return; }
    if (!this.lastTs) { this.lastTs = ts; this._draw(); return; }
    const dt = Math.min((ts - this.lastTs) / 1000, 0.05);
    this.lastTs = ts;
    if (this.runState === 'playing') {
      this.timer += dt; this.flashTimer -= dt;
      if (this.flashTimer <= 0) this.flashKey = null;
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.life -= dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
      if (this.mode === 'race') this._updateRace(dt);
      else this._updateLoco(dt);
    }
    this._draw();
  }

  _updateRace(dt) {
    if (this.invincible) { this.invTimer -= dt; if (this.invTimer <= 0) this.invincible = false; }
    if (this.boosting) { this.boostTimer -= dt; if (this.boostTimer <= 0) { this.boosting = false; this.speed = BASE_SPEED * this.diff.speedMul; } }
    let targetSpeed = BASE_SPEED * this.diff.speedMul;
    if (this.boosting) targetSpeed *= 1.8;
    if (this.controls.up || this.tiltThrottle > 0.2) targetSpeed *= 1.35;
    if (this.controls.down || this.tiltThrottle < -0.2) targetSpeed *= 0.55;
    this.speed = lerp(this.speed, targetSpeed, dt * 3);
    if (Math.abs(this.tiltSide) > 0.15) {
      this.playerX += this.tiltSide * dt * 1.8;
      this.playerLane = clamp(Math.round(this.playerX * (this.diff.lanes - 1)), 0, this.diff.lanes - 1);
    }
    const lanes = this.diff.lanes;
    const laneW = 1 / (lanes + 1);
    const targetX = (this.playerLane + 1) * laneW;
    this.playerX = lerp(this.playerX, targetX, dt * 10);
    this.distance += this.speed * dt;
    this.fuel -= dt * 2.5 * (this.boosting ? 2 : 1);
    if (this.fuel <= 15 && Math.random() < 0.01) this._flash('flashLowFuel');
    if (this.fuel <= 0) { this.fuel = 0; this.runState = 'gameover'; this.stopMusic(); return; }
    if (this.distance >= this.courseLength) { this.runState = 'gameover'; this.stopMusic(); return; }
    const playerW = 0.08;
    for (const ob of this.obstacles) {
      if (ob.hit) continue;
      const relD = ob.dist - this.distance;
      if (relD < 0 || relD > 60) continue;
      if (relD < 40) {
        const obX = (ob.lane + 1) * laneW;
        if (Math.abs(this.playerX - obX) < playerW) {
          ob.hit = true;
          if (!this.invincible) this._handleCrash();
        }
        if (!ob.hit && !ob._nm && Math.abs(this.playerX - obX) < playerW * 2.2) {
          ob._nm = true; this.score += 50; this.combo++; this.comboTimer = 2;
          if (this.combo >= 3) this._flash('flashNearMiss');
        }
      }
    }
    for (const c of this.collectibles) {
      if (c.collected) continue;
      const relD = c.dist - this.distance;
      if (relD < 0 || relD > 40) continue;
      const cX = (c.lane + 1) * laneW;
      if (Math.abs(this.playerX - cX) < playerW * 1.5 && relD < 30) {
        c.collected = true;
        if (c.type === 'fuel') { this.fuel = Math.min(100, this.fuel + 25); this._flash('flashFuel'); this.score += 30; }
        else { this.score += 100; this.combo++; this.comboTimer = 2; this._addParticles(this.w * this.playerX, this.h * RACE_PLAYER_Y, 8, '#ffd700'); if (this.combo >= 3) this._flash('flashStarChain'); }
      }
    }
    for (const r of this.ramps) {
      if (r.hit) continue;
      const relD = r.dist - this.distance;
      if (relD < 30 && relD > 0) {
        const rX = (r.lane + 1) * laneW;
        if (Math.abs(this.playerX - rX) < playerW * 1.5) {
          r.hit = true; this.boosting = true; this.boostTimer = 3;
          this.speed = BASE_SPEED * this.diff.speedMul * 1.8;
          this._flash('flashRamp'); this._addParticles(this.w * this.playerX, this.h * RACE_PLAYER_Y, 15, '#ff9500');
          this.score += 200;
        }
      }
    }
    this.obstacles = this.obstacles.filter(o => o.dist > this.distance - 200);
    this.collectibles = this.collectibles.filter(c => c.dist > this.distance - 200);
    this.ramps = this.ramps.filter(r => r.dist > this.distance - 200);
    const maxD = Math.max(...this.obstacles.map(o => o.dist), this.distance);
    if (maxD - this.distance < 600) { const n = Math.random() < this.diff.spawnMul * 0.5 ? 2 : 1; for (let i = 0; i < n; i++) this._spawnObstacle(); }
    if (this.collectibles.filter(c => !c.collected && c.dist > this.distance).length < 2) this._spawnCollectible();
    if (this.ramps.filter(r => !r.hit && r.dist > this.distance).length < 1 && Math.random() < 0.02) this._spawnRamp();
  }

  _updateLoco(dt) {
    const accel = 600 * this.diff.speedMul;
    if (this.controls.up || this.tiltThrottle > 0.2) this.locoSpeed += accel * dt;
    if (this.controls.down || this.tiltThrottle < -0.2) this.locoSpeed -= accel * 0.6 * dt;
    this.locoSpeed *= 0.97;
    this.locoSpeed = clamp(this.locoSpeed, -200, 500 * this.diff.speedMul);
    let turn = 0;
    if (this.controls.left || this.tiltSide < -0.15) turn = -2.5;
    if (this.controls.right || this.tiltSide > 0.15) turn = 2.5;
    this.locoAngle += turn * dt * (0.5 + Math.abs(this.locoSpeed) / 400);
    this.locoX += Math.sin(this.locoAngle) * this.locoSpeed * dt;
    this.locoZ += Math.cos(this.locoAngle) * this.locoSpeed * dt;
    for (const p of this.locoProps) {
      if (!p.alive) continue;
      const dx = this.locoX - p.x, dz = this.locoZ - p.z;
      if (dx * dx + dz * dz < 400) {
        p.alive = false; this.score += 50;
        this.locoDamage = Math.min(100, this.locoDamage + 5);
        this._flash('flashSmash');
        this._addParticles(this.w / 2, this.h * 0.65, 10, '#ffaa00');
        if (this.locoDamage >= 100) {
          this.lives--;
          if (this.lives <= 0) { this.runState = 'gameover'; this.stopMusic(); return; }
          this.locoDamage = 0; this._flash('flashDamage');
        }
      }
    }
    if (this.locoProps.filter(p => p.alive).length < 30) {
      for (let i = 0; i < 10; i++) {
        this.locoProps.push({ x: this.locoX + rand(-400, 400), z: this.locoZ + rand(-400, 400), type: choose(['cone','barrel','crate']), alive: true, scale: rand(0.8, 1.3) });
      }
    }
  }

  _draw() { if (this.mode === 'race') this._drawRace(); else this._drawLoco(); }

  _drawIdle() {
    const { ctx, w, h } = this;
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#0a0e2a'); sky.addColorStop(0.4, '#131a40'); sky.addColorStop(1, '#1a1040');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    for (const s of this.stars) {
      ctx.globalAlpha = s.b * (0.5 + 0.5 * Math.sin(Date.now() * 0.002 + s.x * 10));
      ctx.fillStyle = '#fff'; ctx.fillRect(s.x * w, s.y * h * 0.6, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }

  _drawRace() {
    const { ctx, w, h } = this;
    const horizonY = h * 0.35;
    const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
    sky.addColorStop(0, '#05081a'); sky.addColorStop(0.5, '#0d1530'); sky.addColorStop(1, '#1a2255');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, horizonY);
    for (const s of this.stars) {
      ctx.globalAlpha = s.b * (0.4 + 0.6 * Math.sin(Date.now() * 0.003 + s.x * 20));
      ctx.fillStyle = '#fff'; ctx.fillRect(s.x * w, s.y * horizonY, s.s, s.s);
    }
    ctx.globalAlpha = 1;
    if (!this.skylineCache || this.skylineCacheW !== w) {
      this.skylineCache = document.createElement('canvas');
      this.skylineCache.width = w * this.dpr; this.skylineCache.height = h * this.dpr;
      const sCtx = this.skylineCache.getContext('2d');
      sCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      drawChicagoSkyline(sCtx, w, horizonY);
      this.skylineCacheW = w;
    }
    ctx.drawImage(this.skylineCache, 0, 0, w * this.dpr, h * this.dpr, 0, 0, w, h);
    drawDriverSilhouette(ctx, w, horizonY, this.isAxel);
    ctx.fillStyle = '#0a1a0a'; ctx.fillRect(0, horizonY, w, h - horizonY);
    const segments = 60;
    const lanes = this.diff.lanes;
    for (let i = segments; i >= 1; i--) {
      const t1 = i / segments, t0 = (i - 1) / segments;
      const s1 = this.roadSample(t1), s0 = this.roadSample(t0);
      const y1 = horizonY + (h - horizonY) * t1 + s1.hill * h;
      const y0 = horizonY + (h - horizonY) * t0 + s0.hill * h;
      const stripe = ((Math.floor(this.distance * 0.04) + i) % 2 === 0);
      ctx.fillStyle = stripe ? '#2a2a38' : '#222230';
      ctx.beginPath();
      ctx.moveTo((s0.center - s0.width / 2) * w, y0);
      ctx.lineTo((s0.center + s0.width / 2) * w, y0);
      ctx.lineTo((s1.center + s1.width / 2) * w, y1);
      ctx.lineTo((s1.center - s1.width / 2) * w, y1);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,50,0.5)';
      ctx.lineWidth = clamp(t1 * 3, 0.5, 3);
      ctx.beginPath(); ctx.moveTo((s0.center - s0.width / 2) * w, y0); ctx.lineTo((s1.center - s1.width / 2) * w, y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo((s0.center + s0.width / 2) * w, y0); ctx.lineTo((s1.center + s1.width / 2) * w, y1); ctx.stroke();
      if (stripe) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = clamp(t1 * 2, 0.3, 2);
        for (let ln = 1; ln < lanes; ln++) {
          const frac = ln / lanes;
          const lx0 = (s0.center - s0.width / 2 + s0.width * frac) * w;
          const lx1 = (s1.center - s1.width / 2 + s1.width * frac) * w;
          ctx.beginPath(); ctx.moveTo(lx0, y0); ctx.lineTo(lx1, y1); ctx.stroke();
        }
      }
    }
    if (this.boosting) {
      ctx.strokeStyle = 'rgba(255,180,0,0.4)'; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const sx = rand(0, w), sy = horizonY + rand(0, (h - horizonY) * 0.5);
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + rand(-30, 30), sy + rand(40, 100)); ctx.stroke();
      }
    }
    for (const r of this.ramps) {
      if (r.hit) continue;
      const relD = r.dist - this.distance;
      if (relD < 0 || relD > 1200) continue;
      const t = 1 - relD / 1200; if (t < 0.01) continue;
      const rs = this.roadSample(t);
      const ry = horizonY + (h - horizonY) * t + rs.hill * h;
      const rLW = rs.width / lanes;
      const rx = (rs.center - rs.width / 2 + (r.lane + 0.5) * rLW) * w;
      const rSize = t * 40;
      ctx.fillStyle = 'rgba(255,180,0,0.7)';
      ctx.beginPath();
      ctx.moveTo(rx - rSize, ry); ctx.lineTo(rx, ry - rSize * 0.6);
      ctx.lineTo(rx + rSize, ry); ctx.lineTo(rx, ry + rSize * 0.3);
      ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = Math.max(8, t * 14) + 'px Arial'; ctx.textAlign = 'center';
      ctx.fillText('\u{1f680}', rx, ry + 4);
    }
    for (const c of this.collectibles) {
      if (c.collected) continue;
      const relD = c.dist - this.distance;
      if (relD < 0 || relD > 1200) continue;
      const t = 1 - relD / 1200; if (t < 0.02) continue;
      const cs = this.roadSample(t);
      const cy2 = horizonY + (h - horizonY) * t + cs.hill * h;
      const cLW = cs.width / lanes;
      const cx2 = (cs.center - cs.width / 2 + (c.lane + 0.5) * cLW) * w;
      const sz = t * 20;
      ctx.font = Math.max(8, sz) + 'px Arial'; ctx.textAlign = 'center';
      ctx.fillText(c.type === 'fuel' ? '\u26FD' : '\u2B50', cx2, cy2 + sz * 0.3);
    }
    for (const ob of this.obstacles) {
      if (ob.hit) continue;
      const relD = ob.dist - this.distance;
      if (relD < 0 || relD > 1200) continue;
      const t = 1 - relD / 1200; if (t < 0.02) continue;
      const os = this.roadSample(t);
      const oy = horizonY + (h - horizonY) * t + os.hill * h;
      const oLW = os.width / lanes;
      const ox = (os.center - os.width / 2 + (ob.lane + 0.5) * oLW) * w;
      this._drawCar(ctx, ox, oy, t * 50, t * 28, ob.preset, false);
    }
    const ps = this.roadSample(1);
    const py = horizonY + (h - horizonY) + ps.hill * h;
    const px = this.playerX * w;
    const playerPreset = this.isAxel ? CAR_PRESETS[0] : CAR_PRESETS[3];
    if (this.invincible && Math.sin(Date.now() * 0.02) > 0) ctx.globalAlpha = 0.5;
    this._drawCar(ctx, px, py - 30, 52, 30, playerPreset, true);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Arial'; ctx.textAlign = 'center';
    ctx.fillText(this.driverName, px, py - 4);
    for (const p of this.particles) {
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  _drawCar(ctx, x, y, carH, carW, preset, isPlayer) {
    const hw = carW / 2, hh = carH / 2;
    ctx.shadowColor = preset.glow; ctx.shadowBlur = isPlayer ? 18 : 10;
    drawRoundRect(ctx, x - hw, y - hh, carW, carH, 6);
    ctx.fillStyle = preset.body; ctx.fill();
    ctx.fillStyle = preset.stripe; ctx.fillRect(x - 2, y - hh, 4, carH);
    ctx.fillStyle = preset.accent; ctx.fillRect(x - hw + 2, y - hh + 2, carW - 4, 5);
    if (isPlayer) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x - hw + 5, y - hh + 3, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + hw - 5, y - hh + 3, 3, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#ff2222';
      ctx.fillRect(x - hw + 2, y + hh - 5, 5, 3);
      ctx.fillRect(x + hw - 7, y + hh - 5, 5, 3);
    }
    ctx.shadowBlur = 0;
  }

  _drawLoco() {
    const { ctx, w, h } = this;
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.4);
    sky.addColorStop(0, '#0a0520'); sky.addColorStop(1, '#1a0e40');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1a2010'; ctx.fillRect(0, h * 0.4, w, h * 0.6);
    ctx.strokeStyle = 'rgba(100,255,100,0.08)'; ctx.lineWidth = 1;
    for (let i = -10; i <= 10; i++) {
      const screenY = h * 0.4 + (h * 0.6) * (0.5 + i * 0.04);
      if (screenY > h * 0.4 && screenY < h) { ctx.beginPath(); ctx.moveTo(0, screenY); ctx.lineTo(w, screenY); ctx.stroke(); }
    }
    const props = this.locoProps.filter(p => p.alive).map(p => {
      const dx = p.x - this.locoX, dz = p.z - this.locoZ;
      const cos = Math.cos(-this.locoAngle), sin = Math.sin(-this.locoAngle);
      return { ...p, rx: dx * cos - dz * sin, rz: dx * sin + dz * cos };
    }).filter(p => p.rz > 5 && p.rz < 300).sort((a, b) => b.rz - a.rz);
    for (const p of props) {
      const perspective = 200 / p.rz;
      const sx = w / 2 + p.rx * perspective, sy = h * 0.45 + perspective * 20;
      const sz = perspective * 15 * p.scale;
      if (sx < -50 || sx > w + 50) continue;
      if (p.type === 'cone') {
        ctx.fillStyle = '#ff6600'; ctx.beginPath();
        ctx.moveTo(sx, sy - sz); ctx.lineTo(sx - sz * 0.4, sy); ctx.lineTo(sx + sz * 0.4, sy); ctx.fill();
      } else if (p.type === 'barrel') {
        ctx.fillStyle = '#884400'; drawRoundRect(ctx, sx - sz * 0.3, sy - sz * 0.8, sz * 0.6, sz * 0.8, 3); ctx.fill();
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(sx - sz * 0.25, sy - sz * 0.5, sz * 0.5, 4);
      } else {
        ctx.fillStyle = '#665533'; ctx.fillRect(sx - sz * 0.4, sy - sz * 0.6, sz * 0.8, sz * 0.6);
      }
    }
    const preset = this.isAxel ? CAR_PRESETS[0] : CAR_PRESETS[3];
    if (this.invincible && Math.sin(Date.now() * 0.02) > 0) ctx.globalAlpha = 0.5;
    this._drawCar(ctx, w / 2, h * 0.65, 60, 34, preset, true);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
    ctx.fillText(this.driverName, w / 2, h * 0.65 + 38);
    if (this.locoDamage > 0) {
      const barW = 80, barX = w / 2 - 40, barY = h * 0.65 + 44;
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(barX, barY, barW, 6);
      ctx.fillStyle = this.locoDamage > 70 ? '#ff3333' : '#ffaa00';
      ctx.fillRect(barX, barY, barW * this.locoDamage / 100, 6);
    }
    for (const p of this.particles) {
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  unlockAudio() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
  }
  toggleMuted() {
    this.muted = !this.muted;
    if (this.muted) this.stopMusic(); else if (this.runState === 'playing') this.startMusic();
    return this.muted;
  }
  startMusic() {
    if (this.musicInterval || !this.audioCtx || this.muted) return;
    const notes = this.mode === 'race'
      ? [262,330,392,523,392,330,349,440,523,440,349,294]
      : [196,247,330,392,330,294,262,330,392,523,440,330];
    this.noteIndex = 0;
    this.musicInterval = setInterval(() => {
      if (!this.audioCtx) return;
      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = this.mode === 'race' ? 'triangle' : 'sawtooth';
        osc.frequency.value = notes[this.noteIndex % notes.length];
        gain.gain.value = 0.06;
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.2);
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        osc.start(); osc.stop(this.audioCtx.currentTime + 0.2);
        this.noteIndex++;
      } catch(e) {}
    }, 220);
  }
  stopMusic() { if (this.musicInterval) { clearInterval(this.musicInterval); this.musicInterval = null; } }
}
