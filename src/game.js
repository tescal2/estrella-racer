import { getPlateName } from "./personalization.js";

const MAX_DPR = 2;
const STAR_FIELD_COUNT = 80;
const RACE_LANES = [-1, 0, 1];
const RACE_PLAYER_Y = 0.82;
const RACE_BASE_SPEED = 340;
const RACE_BASE_SPAWN = 0.9;
const LOCO_WORLD_W = 2600;
const LOCO_WORLD_H = 1800;
const LOCO_PROP_COUNT = 72;

export const CAR_PRESETS = [
  {
    id: "cometa-roja",
    nameKey: "carRed",
    description: {
      en: "Default red speedster with bright star decals.",
      es: "Auto rojo principal con calcas de estrella."
    },
    body: "#f44336",
    accent: "#ffd166",
    stripe: "#fff3a0",
    glow: "rgba(255,99,71,0.55)"
  },
  {
    id: "pulso-azul",
    nameKey: "carBlue",
    description: {
      en: "Cool ocean racer with turbo pulse fins.",
      es: "Corredor azul con aletas de turbo."
    },
    body: "#2f80ff",
    accent: "#8fe7ff",
    stripe: "#d7f7ff",
    glow: "rgba(91,180,255,0.55)"
  },
  {
    id: "volt-verde",
    nameKey: "carGreen",
    description: {
      en: "Electric green drifter with lightning trims.",
      es: "Drifter verde electrico con detalles rapidos."
    },
    body: "#30c86f",
    accent: "#d1ff6f",
    stripe: "#f0ffd4",
    glow: "rgba(94,255,157,0.5)"
  },
  {
    id: "nova-drift",
    nameKey: "carPurple",
    description: {
      en: "Purple comet with smooth drift control.",
      es: "Cometa morada con gran control de drift."
    },
    body: "#a35cff",
    accent: "#ffd7ff",
    stripe: "#f6e4ff",
    glow: "rgba(184,118,255,0.55)"
  },
  {
    id: "turbo-sol",
    nameKey: "carGold",
    description: {
      en: "Golden rocket tuned for star streaks.",
      es: "Cohete dorado para rachas de estrellas."
    },
    body: "#ffb938",
    accent: "#fff5a8",
    stripe: "#ffe3b0",
    glow: "rgba(255,210,120,0.55)"
  }
];

const CAR_BY_ID = Object.fromEntries(CAR_PRESETS.map((car) => [car.id, car]));

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function choose(items) {
  return items[(Math.random() * items.length) | 0];
}

function drawRoundedRect(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawStar(ctx, x, y, outer, inner, points = 5) {
  let angle = -Math.PI * 0.5;
  const step = Math.PI / points;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
    angle += step;
  }
  ctx.closePath();
}

export class EstrellaGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });

    this.width = 1;
    this.height = 1;
    this.dpr = 1;

    this.language = "en";
    this.profile = { primaryName: "Axel", secondaryName: "Jade" };
    this.selectedCarId = CAR_PRESETS[0].id;

    this.mode = "race";
    this.runState = "menu";
    this.resultTitleKey = "resultCrashTitle";
    this.resultMessageKey = "resultCrashMessage";

    this.score = 0;
    this.stars = 0;
    this.combo = 1;
    this.crashes = 0;

    this.control = { left: false, right: false, up: false, down: false };
    this.starfield = Array.from({ length: STAR_FIELD_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: rand(0.8, 2.4),
      speed: rand(0.01, 0.07)
    }));
    this.effects = [];
    this.sceneTime = 0;

    this.audioCtx = null;
    this.muted = false;

    this.lastFrame = performance.now();
    this.resetRace();
    this.resetLoco();
    this.resize(window.innerWidth, window.innerHeight);
  }

  resize(width, height) {
    this.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    this.width = width;
    this.height = height;
    this.canvas.width = Math.max(1, Math.floor(width * this.dpr));
    this.canvas.height = Math.max(1, Math.floor(height * this.dpr));
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  setLanguage(language) {
    this.language = language === "es" ? "es" : "en";
  }

  setProfile(profile) {
    this.profile = {
      primaryName: profile.primaryName || "Axel",
      secondaryName: profile.secondaryName || "Jade"
    };
  }

  setSelectedCar(id) {
    if (CAR_BY_ID[id]) {
      this.selectedCarId = id;
    }
  }

  getSelectedCar() {
    return CAR_BY_ID[this.selectedCarId] || CAR_PRESETS[0];
  }

  setMuted(value) {
    this.muted = Boolean(value);
  }

  toggleMuted() {
    this.muted = !this.muted;
    return this.muted;
  }

  unlockAudio() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        return;
      }
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  tone(freq, duration, type = "triangle", volume = 0.1) {
    if (this.muted || !this.audioCtx) {
      return;
    }
    const now = this.audioCtx.currentTime;
    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, now);
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  start(mode) {
    this.mode = mode === "loco" ? "loco" : "race";
    this.runState = "playing";
    this.score = 0;
    this.stars = 0;
    this.combo = 1;
    this.crashes = 0;
    this.effects = [];
    this.sceneTime = 0;
    this.lastFrame = performance.now();
    this.resetControls();
    if (this.mode === "race") {
      this.resetRace();
    } else {
      this.resetLoco();
    }
  }

  restart() {
    this.start(this.mode);
  }

  stopToMenu() {
    this.runState = "menu";
    this.resetControls();
  }

  togglePause() {
    if (this.runState === "playing") {
      this.runState = "paused";
      return this.runState;
    }
    if (this.runState === "paused") {
      this.runState = "playing";
      this.lastFrame = performance.now();
      return this.runState;
    }
    return this.runState;
  }

  getMode() {
    return this.mode;
  }

  getRunState() {
    return this.runState;
  }

  getResult() {
    return {
      titleKey: this.resultTitleKey,
      messageKey: this.resultMessageKey
    };
  }

  resetControls() {
    this.control.left = false;
    this.control.right = false;
    this.control.up = false;
    this.control.down = false;
  }

  moveLane(direction) {
    if (this.mode !== "race" || this.runState !== "playing") {
      return;
    }
    const nextLane = clamp(this.race.playerLane + direction, -1, 1);
    if (nextLane !== this.race.playerLane) {
      this.race.playerLane = nextLane;
      this.tone(440, 0.06, "triangle", 0.07);
    }
  }

  tapAt(x) {
    if (this.mode !== "race" || this.runState !== "playing") {
      return;
    }
    this.moveLane(x < this.width * 0.5 ? -1 : 1);
  }

  setControl(controlName, active) {
    if (!(controlName in this.control)) {
      return;
    }
    this.control[controlName] = Boolean(active);
  }

  frame(timestamp) {
    const dt = Math.min(0.05, Math.max(0, (timestamp - this.lastFrame) / 1000));
    this.lastFrame = timestamp;
    this.sceneTime += dt;

    if (this.runState === "playing") {
      if (this.mode === "race") {
        this.updateRace(dt);
      } else {
        this.updateLoco(dt);
      }
    }

    this.updateEffects(dt);
    this.draw();
  }

  resetRace() {
    this.race = {
      playerLane: 0,
      speed: RACE_BASE_SPEED,
      spawnTimer: 0,
      roadOffset: 0,
      traffic: [],
      plateCursor: 0,
      comboTimer: 0
    };
  }

  spawnRaceEntity() {
    const lane = choose(RACE_LANES);
    if (Math.random() < 0.34) {
      this.race.traffic.push({
        type: "star",
        lane,
        y: -90,
        wobble: rand(0, Math.PI * 2),
        speedMul: 1
      });
      return;
    }
    const aiCars = CAR_PRESETS.filter((car) => car.id !== this.selectedCarId);
    const aiCar = choose(aiCars.length > 0 ? aiCars : CAR_PRESETS);
    this.race.traffic.push({
      type: "car",
      lane,
      y: -140,
      wobble: rand(0, Math.PI * 2),
      speedMul: rand(0.8, 1.15),
      carId: aiCar.id,
      plate: getPlateName(this.profile, this.race.plateCursor++)
    });
  }

  updateRace(dt) {
    this.race.speed = clamp(this.race.speed + dt * 14, RACE_BASE_SPEED, 640);
    this.race.roadOffset = (this.race.roadOffset + dt * this.race.speed * 0.008) % 1;

    const spawnInterval = Math.max(0.44, RACE_BASE_SPAWN - (this.race.speed - RACE_BASE_SPEED) / 1800);
    this.race.spawnTimer -= dt;
    if (this.race.spawnTimer <= 0) {
      this.race.spawnTimer = spawnInterval;
      this.spawnRaceEntity();
    }

    this.race.comboTimer = Math.max(0, this.race.comboTimer - dt);
    if (this.race.comboTimer <= 0 && this.combo > 1) {
      this.combo = Math.max(1, this.combo - dt * 1.5);
    }

    const playerX = this.laneToX(this.race.playerLane);
    const playerY = this.height * RACE_PLAYER_Y;
    const playerW = 76 * this.carScale();
    const playerH = 118 * this.carScale();

    for (let index = this.race.traffic.length - 1; index >= 0; index -= 1) {
      const entity = this.race.traffic[index];
      entity.y += this.race.speed * entity.speedMul * dt;
      const entityX = this.laneToX(entity.lane) + Math.sin(this.sceneTime * 3 + entity.wobble) * 7;

      if (entity.type === "star") {
        const dx = playerX - entityX;
        const dy = playerY - entity.y;
        if (dx * dx + dy * dy < 42 * 42 * this.carScale()) {
          this.stars += 1;
          this.score += Math.round(45 * this.combo);
          this.combo = clamp(this.combo + 1, 1, 15);
          this.race.comboTimer = 2.2;
          this.spawnBurst(entityX, entity.y, "#ffd166", 11, false);
          this.tone(880, 0.09, "sine", 0.12);
          this.race.traffic.splice(index, 1);
          continue;
        }
      } else {
        const enemyW = 74 * this.carScale();
        const enemyH = 112 * this.carScale();
        if (
          Math.abs(playerX - entityX) < (playerW + enemyW) * 0.34 &&
          Math.abs(playerY - entity.y) < (playerH + enemyH) * 0.34
        ) {
          this.crashRace(playerX, playerY);
          return;
        }
      }

      if (entity.y > this.height + 130) {
        if (entity.type === "car") {
          this.score += Math.round(12 * this.combo);
        }
        this.race.traffic.splice(index, 1);
      }
    }
  }

  crashRace(playerX, playerY) {
    this.runState = "gameover";
    this.crashes += 1;
    this.combo = 1;
    this.resultTitleKey = "resultCrashTitle";
    this.resultMessageKey = "resultCrashMessage";
    this.spawnBurst(playerX, playerY, "#ff5f57", 24, false);
    this.tone(160, 0.24, "sawtooth", 0.2);
    this.tone(90, 0.36, "triangle", 0.14);
    this.resetControls();
  }

  resetLoco() {
    this.loco = {
      worldW: LOCO_WORLD_W,
      worldH: LOCO_WORLD_H,
      player: {
        x: LOCO_WORLD_W * 0.5,
        y: LOCO_WORLD_H * 0.5,
        vx: 0,
        vy: 0,
        radius: 32,
        heading: 0
      },
      props: [],
      comboTimer: 0
    };
    this.loco.props = Array.from({ length: LOCO_PROP_COUNT }, () => this.createLocoProp());
  }

  createLocoProp() {
    const type = choose(["crate", "cone", "starSign"]);
    let radius = 24;
    if (type === "cone") radius = 20;
    if (type === "starSign") radius = 26;
    return {
      type,
      x: rand(110, this.loco.worldW - 110),
      y: rand(110, this.loco.worldH - 110),
      radius,
      alive: true
    };
  }

  refillLocoProps() {
    const aliveCount = this.loco.props.filter((prop) => prop.alive).length;
    if (aliveCount > LOCO_PROP_COUNT * 0.48) {
      return;
    }
    for (let i = 0; i < 16; i += 1) {
      this.loco.props.push(this.createLocoProp());
    }
  }

  updateLoco(dt) {
    const axisX = (this.control.right ? 1 : 0) - (this.control.left ? 1 : 0);
    const axisY = (this.control.down ? 1 : 0) - (this.control.up ? 1 : 0);
    const player = this.loco.player;

    if (axisX !== 0 || axisY !== 0) {
      player.vx += axisX * 980 * dt;
      player.vy += axisY * 980 * dt;
    }

    const drag = Math.pow(0.86, dt * 60);
    player.vx *= drag;
    player.vy *= drag;

    const speed = Math.hypot(player.vx, player.vy);
    if (speed > 430) {
      const scale = 430 / speed;
      player.vx *= scale;
      player.vy *= scale;
    }

    player.x = clamp(player.x + player.vx * dt, player.radius, this.loco.worldW - player.radius);
    player.y = clamp(player.y + player.vy * dt, player.radius, this.loco.worldH - player.radius);
    if (Math.abs(player.vx) + Math.abs(player.vy) > 12) {
      player.heading = Math.atan2(player.vy, player.vx);
    }

    this.loco.comboTimer = Math.max(0, this.loco.comboTimer - dt);
    if (this.loco.comboTimer <= 0 && this.combo > 1) {
      this.combo = Math.max(1, this.combo - dt * 2.4);
    }

    for (const prop of this.loco.props) {
      if (!prop.alive) {
        continue;
      }
      const dx = prop.x - player.x;
      const dy = prop.y - player.y;
      const impactDistance = prop.radius + player.radius;
      if (dx * dx + dy * dy <= impactDistance * impactDistance) {
        prop.alive = false;
        this.crashes += 1;
        this.combo = clamp(this.combo + 1, 1, 20);
        this.loco.comboTimer = 2.1;
        const isStarProp = prop.type === "starSign";
        this.stars += isStarProp ? 2 : 1;
        this.score += Math.round((isStarProp ? 46 : 28) * this.combo);
        this.spawnBurst(prop.x, prop.y, isStarProp ? "#ffd166" : "#8ad6ff", 16, true);
        this.tone(isStarProp ? 760 : 280, 0.11, "square", 0.09);
      }
    }
    this.refillLocoProps();
  }

  laneToX(laneIndex) {
    const laneSpan = Math.min(this.width * 0.24, 130);
    return this.width * 0.5 + laneIndex * laneSpan;
  }

  carScale() {
    return clamp(this.width / 430, 0.75, 1.18);
  }

  spawnBurst(x, y, color, count, world) {
    for (let i = 0; i < count; i += 1) {
      this.effects.push({
        x,
        y,
        vx: rand(-130, 130),
        vy: rand(-140, 90),
        size: rand(2, 5),
        color,
        life: rand(0.35, 0.75),
        maxLife: 1,
        world: Boolean(world)
      });
    }
  }

  updateEffects(dt) {
    for (let i = this.effects.length - 1; i >= 0; i -= 1) {
      const particle = this.effects[i];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 180 * dt;
      particle.life -= dt;
      if (particle.life <= 0) {
        this.effects.splice(i, 1);
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    this.drawBackground(ctx);

    if (this.mode === "loco" && this.runState !== "menu") {
      this.drawLoco(ctx);
    } else {
      this.drawRace(ctx, this.runState === "menu");
    }

    if (this.runState === "paused") {
      ctx.fillStyle = "rgba(5,8,20,0.52)";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = "#d7e8ff";
      ctx.textAlign = "center";
      ctx.font = "bold 28px Arial";
      ctx.fillText("PAUSED", this.width * 0.5, this.height * 0.5);
    }
  }

  drawBackground(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, "#2f3270");
    gradient.addColorStop(0.5, "#10153c");
    gradient.addColorStop(1, "#090b1d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    for (const star of this.starfield) {
      const y = ((star.y + this.sceneTime * star.speed) % 1) * this.height;
      const x = star.x * this.width;
      ctx.globalAlpha = 0.28 + (star.size * 0.14);
      ctx.fillStyle = "#fff6b7";
      ctx.beginPath();
      ctx.arc(x, y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawRace(ctx, previewOnly) {
    const topY = this.height * 0.18;
    const bottomY = this.height + 24;
    const topW = this.width * 0.16;
    const bottomW = this.width * 0.88;
    const cx = this.width * 0.5;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - topW, topY);
    ctx.lineTo(cx + topW, topY);
    ctx.lineTo(cx + bottomW * 0.5, bottomY);
    ctx.lineTo(cx - bottomW * 0.5, bottomY);
    ctx.closePath();
    const roadGradient = ctx.createLinearGradient(0, topY, 0, bottomY);
    roadGradient.addColorStop(0, "#1e2448");
    roadGradient.addColorStop(1, "#0f1328");
    ctx.fillStyle = roadGradient;
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    const roadOffset = (this.race.roadOffset + this.sceneTime * 0.08) % 1;
    for (let i = 0; i < 18; i += 1) {
      const t = ((i / 18 + roadOffset) % 1);
      const y = topY + t * (bottomY - topY);
      const widthAtY = topW + (bottomW * 0.5 - topW) * t;
      const laneDashLength = 12 + t * 18;
      for (let lane = 1; lane <= 2; lane += 1) {
        const laneX = cx - widthAtY + (widthAtY * 2 * lane) / 3;
        ctx.beginPath();
        ctx.moveTo(laneX, y);
        ctx.lineTo(laneX, y + laneDashLength);
        ctx.stroke();
      }
    }

    this.drawEffects(ctx, false, 0, 0);

    const traffic = this.race.traffic;
    for (const entity of traffic) {
      const x = this.laneToX(entity.lane) + Math.sin(this.sceneTime * 3 + entity.wobble) * 7;
      if (entity.type === "star") {
        ctx.fillStyle = "#ffd166";
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        drawStar(ctx, x, entity.y, 16 * this.carScale(), 8 * this.carScale(), 5);
        ctx.fill();
        ctx.stroke();
      } else {
        const car = CAR_BY_ID[entity.carId] || CAR_PRESETS[1];
        this.drawCar(ctx, x, entity.y, 0.78 * this.carScale(), car, entity.plate);
      }
    }

    const playerX = this.laneToX(this.race.playerLane);
    const playerY = this.height * RACE_PLAYER_Y;
    this.drawCar(ctx, playerX, playerY, this.carScale(), this.getSelectedCar(), getPlateName(this.profile, this.stars + this.crashes));

    if (previewOnly) {
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.textAlign = "center";
      ctx.font = "bold 18px Arial";
      ctx.fillText("⭐ Estrella Rush ⭐", this.width * 0.5, this.height * 0.16);
    }
  }

  drawLoco(ctx) {
    const player = this.loco.player;
    const camX = clamp(player.x - this.width * 0.5, 0, this.loco.worldW - this.width);
    const camY = clamp(player.y - this.height * 0.5, 0, this.loco.worldH - this.height);

    ctx.save();
    ctx.fillStyle = "#152243";
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    const grid = 160;
    const startX = -((camX % grid));
    const startY = -((camY % grid));
    for (let x = startX; x < this.width; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = startY; y < this.height; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    const roadColor = "rgba(50,76,139,0.62)";
    ctx.fillStyle = roadColor;
    for (let i = 0; i < 6; i += 1) {
      const x = 120 + i * 420 - camX;
      ctx.fillRect(x, -camY, 80, this.loco.worldH);
      const y = 120 + i * 250 - camY;
      ctx.fillRect(-camX, y, this.loco.worldW, 64);
    }

    for (const prop of this.loco.props) {
      if (!prop.alive) {
        continue;
      }
      const x = prop.x - camX;
      const y = prop.y - camY;
      if (x < -80 || x > this.width + 80 || y < -80 || y > this.height + 80) {
        continue;
      }
      if (prop.type === "crate") {
        ctx.fillStyle = "#9a6d3b";
        drawRoundedRect(ctx, x - 16, y - 16, 32, 32, 6);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.stroke();
      } else if (prop.type === "cone") {
        ctx.fillStyle = "#ff8c3a";
        ctx.beginPath();
        ctx.moveTo(x, y - 18);
        ctx.lineTo(x - 16, y + 16);
        ctx.lineTo(x + 16, y + 16);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = "#ffd166";
        drawStar(ctx, x, y - 8, 14, 7, 5);
        ctx.fill();
        ctx.fillStyle = "#5f6da3";
        ctx.fillRect(x - 2, y - 2, 4, 24);
      }
    }

    this.drawEffects(ctx, true, camX, camY);
    this.drawCar(
      ctx,
      player.x - camX,
      player.y - camY,
      this.carScale() * 0.95,
      this.getSelectedCar(),
      getPlateName(this.profile, this.stars + this.crashes),
      player.heading
    );

    ctx.restore();
  }

  drawEffects(ctx, worldSpace, camX, camY) {
    for (const particle of this.effects) {
      if (particle.world !== worldSpace) {
        continue;
      }
      const x = worldSpace ? particle.x - camX : particle.x;
      const y = worldSpace ? particle.y - camY : particle.y;
      if (x < -30 || x > this.width + 30 || y < -30 || y > this.height + 30) {
        continue;
      }
      ctx.globalAlpha = clamp(particle.life * 1.4, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(x, y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawCar(ctx, x, y, scale, car, plateText, heading = 0) {
    const width = 78 * scale;
    const height = 118 * scale;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading || 0);

    ctx.shadowColor = car.glow;
    ctx.shadowBlur = 14 * scale;
    ctx.fillStyle = car.body;
    drawRoundedRect(ctx, -width * 0.5, -height * 0.5, width, height, 16 * scale);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = car.stripe;
    drawRoundedRect(ctx, -width * 0.22, -height * 0.44, width * 0.44, height * 0.84, 12 * scale);
    ctx.fill();

    ctx.fillStyle = "#171d35";
    drawRoundedRect(ctx, -width * 0.27, -height * 0.24, width * 0.54, height * 0.24, 10 * scale);
    ctx.fill();

    ctx.fillStyle = car.accent;
    drawRoundedRect(ctx, -width * 0.45, height * 0.12, width * 0.9, height * 0.14, 8 * scale);
    ctx.fill();

    ctx.fillStyle = "#10131f";
    drawRoundedRect(ctx, -width * 0.6, -height * 0.34, width * 0.18, height * 0.24, 6 * scale);
    ctx.fill();
    drawRoundedRect(ctx, width * 0.42, -height * 0.34, width * 0.18, height * 0.24, 6 * scale);
    ctx.fill();
    drawRoundedRect(ctx, -width * 0.6, height * 0.1, width * 0.18, height * 0.24, 6 * scale);
    ctx.fill();
    drawRoundedRect(ctx, width * 0.42, height * 0.1, width * 0.18, height * 0.24, 6 * scale);
    ctx.fill();

    ctx.fillStyle = "#f4f8ff";
    drawRoundedRect(ctx, -width * 0.3, height * 0.22, width * 0.6, height * 0.16, 6 * scale);
    ctx.fill();
    ctx.fillStyle = "#1d2d4a";
    ctx.font = `bold ${Math.max(8, 11 * scale)}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(String(plateText || "STAR"), 0, height * 0.33);

    ctx.fillStyle = "#fff5b8";
    ctx.beginPath();
    ctx.arc(-width * 0.2, -height * 0.08, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width * 0.2, -height * 0.08, 4 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  getSnapshot() {
    return {
      mode: this.mode,
      runState: this.runState,
      score: Math.floor(this.score),
      stars: this.stars,
      combo: Math.max(1, Math.floor(this.combo)),
      plate: getPlateName(this.profile, this.stars + this.crashes),
      missionKey: this.mode === "race" ? "raceMission" : "locoMission"
    };
  }
}
