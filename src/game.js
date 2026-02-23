const MAX_DPR = 2;
const STAR_FIELD_COUNT = 95;
const RACE_LANES = [-1, 0, 1];
const RACE_PLAYER_Y = 0.82;
const RACE_BASE_SPEED = 355;
const RACE_BASE_SPAWN = 0.9;
const LOCO_WORLD_W = 2800;
const LOCO_WORLD_H = 1900;
const LOCO_PROP_COUNT = 86;

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

const FLEET_PRESETS = [
  { body: "#212633", accent: "#ff4d4d", stripe: "#5d0b16", glow: "rgba(255,77,77,0.45)" },
  { body: "#1a2438", accent: "#ff7a00", stripe: "#4c1f00", glow: "rgba(255,122,0,0.42)" },
  { body: "#1b1f2e", accent: "#ff2fd0", stripe: "#4c0052", glow: "rgba(255,47,208,0.45)" },
  { body: "#1b2836", accent: "#4de3ff", stripe: "#00364a", glow: "rgba(77,227,255,0.45)" }
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
  for (let i = 0; i < points * 2; i += 1) {
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

function drawHex(ctx, x, y, radius) {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = Math.PI / 3 * i + Math.PI / 6;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
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
    this.driverKey = "primary";
    this.selectedCarId = CAR_PRESETS[0].id;

    this.mode = "race";
    this.runState = "menu";
    this.resultTitleKey = "resultCrashTitle";
    this.resultMessageKey = "resultCrashMessage";

    this.score = 0;
    this.stars = 0;
    this.combo = 1;
    this.crashes = 0;
    this.timeElapsed = 0;
    this.maxFuel = 100;
    this.fuel = this.maxFuel;

    this.scorePulse = 0;
    this.srsPulse = 0;
    this.flashEventKey = "";
    this.flashEventTimer = 0;

    this.control = { left: false, right: false, up: false, down: false };
    this.tiltInput = { enabled: false, x: 0, y: 0 };

    this.starfield = Array.from({ length: STAR_FIELD_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: rand(0.8, 2.8),
      speed: rand(0.01, 0.085)
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

  setDriverKey(driverKey) {
    this.driverKey = driverKey === "secondary" ? "secondary" : "primary";
  }

  getDriverKey() {
    return this.driverKey;
  }

  getDriverName() {
    return this.driverKey === "secondary" ? this.profile.secondaryName : this.profile.primaryName;
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
    this.timeElapsed = 0;
    this.fuel = this.maxFuel;
    this.effects = [];
    this.sceneTime = 0;
    this.scorePulse = 0;
    this.srsPulse = 0;
    this.flashEventTimer = 0;
    this.flashEventKey = "";
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
    this.clearTiltInput();
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

  setControl(controlName, active) {
    if (!(controlName in this.control)) {
      return;
    }
    this.control[controlName] = Boolean(active);
  }

  resetControls() {
    this.control.left = false;
    this.control.right = false;
    this.control.up = false;
    this.control.down = false;
  }

  setTiltInput(x, y) {
    this.tiltInput.enabled = true;
    this.tiltInput.x = clamp(x, -1, 1);
    this.tiltInput.y = clamp(y, -1, 1);
  }

  clearTiltInput() {
    this.tiltInput.enabled = false;
    this.tiltInput.x = 0;
    this.tiltInput.y = 0;
  }

  moveLane(direction) {
    if (this.mode !== "race" || this.runState !== "playing") {
      return;
    }
    this.race.playerX = clamp(this.race.playerX + direction * 0.55, -1, 1);
    this.tone(450, 0.05, "triangle", 0.08);
  }

  tapAt(x) {
    if (this.mode !== "race" || this.runState !== "playing") {
      return;
    }
    this.moveLane(x < this.width * 0.5 ? -1 : 1);
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
      this.updateFeedback(dt);
    }

    this.updateEffects(dt);
    this.draw();
  }

  updateFeedback(dt) {
    this.scorePulse = Math.max(0, this.scorePulse - dt);
    this.srsPulse = Math.max(0, this.srsPulse - dt);
    this.flashEventTimer = Math.max(0, this.flashEventTimer - dt);
    if (this.flashEventTimer <= 0) {
      this.flashEventKey = "";
    }
  }

  setFlashEvent(eventKey, duration = 0.8) {
    this.flashEventKey = eventKey;
    this.flashEventTimer = duration;
  }

  consumeFuel(amount) {
    this.fuel = clamp(this.fuel - amount, 0, this.maxFuel);
    if (this.fuel <= 18 && this.flashEventKey !== "eventLowFuel") {
      this.setFlashEvent("eventLowFuel", 0.6);
    }
  }

  refillFuel(amount) {
    this.fuel = clamp(this.fuel + amount, 0, this.maxFuel);
  }

  boostScore(value, eventKey = "") {
    this.score += value;
    this.scorePulse = 0.35;
    this.srsPulse = 0.35;
    if (eventKey) {
      this.setFlashEvent(eventKey);
    }
  }

  getSteerInput() {
    const button = (this.control.right ? 1 : 0) - (this.control.left ? 1 : 0);
    const tilt = this.tiltInput.enabled ? this.tiltInput.x : 0;
    return clamp(button + tilt, -1, 1);
  }

  getThrottleInput() {
    const buttons = (this.control.up ? 1 : 0) - (this.control.down ? 1 : 0);
    const tilt = this.tiltInput.enabled ? this.tiltInput.y : 0;
    return clamp(buttons + tilt, -1, 1);
  }

  resetRace() {
    this.race = {
      playerX: 0,
      speed: RACE_BASE_SPEED,
      speedTarget: RACE_BASE_SPEED,
      spawnTimer: 0,
      roadOffset: 0,
      traffic: [],
      fleetSerial: 0,
      comboTimer: 0
    };
  }

  spawnRaceEntity() {
    const lane = choose(RACE_LANES);
    const roll = Math.random();
    if (roll < 0.32) {
      this.race.traffic.push({
        type: "star",
        lane,
        y: -90,
        wobble: rand(0, Math.PI * 2),
        speedMul: rand(0.92, 1.06)
      });
      return;
    }
    if (roll < 0.48) {
      this.race.traffic.push({
        type: "fuel",
        lane,
        y: -110,
        wobble: rand(0, Math.PI * 2),
        speedMul: rand(0.9, 1.08)
      });
      return;
    }
    const fleet = choose(FLEET_PRESETS);
    this.race.fleetSerial += 1;
    this.race.traffic.push({
      type: "car",
      lane,
      y: -140,
      wobble: rand(0, Math.PI * 2),
      speedMul: rand(0.82, 1.18),
      fleet,
      tag: `VX-${String((this.race.fleetSerial % 97) + 3).padStart(2, "0")}`,
      nearMissed: false
    });
  }

  updateRace(dt) {
    this.timeElapsed += dt;

    const steerInput = this.getSteerInput();
    const throttleInput = this.getThrottleInput();
    this.race.playerX = clamp(this.race.playerX + steerInput * dt * 2.6, -1, 1);

    this.race.speedTarget = clamp(360 + throttleInput * 180 + Math.min(this.stars * 2, 120), 260, 730);
    this.race.speed += (this.race.speedTarget - this.race.speed) * dt * 2.4;
    this.race.roadOffset = (this.race.roadOffset + dt * this.race.speed * 0.009) % 1;

    const fuelDrain = 2.8 + (this.race.speed - 260) / 180 + Math.abs(steerInput) * 0.95 + Math.max(0, throttleInput) * 1.35;
    this.consumeFuel(fuelDrain * dt);
    if (this.fuel <= 0) {
      this.outOfFuel();
      return;
    }

    const spawnInterval = Math.max(0.34, RACE_BASE_SPAWN - (this.race.speed - RACE_BASE_SPEED) / 1700);
    this.race.spawnTimer -= dt;
    if (this.race.spawnTimer <= 0) {
      this.race.spawnTimer = spawnInterval;
      this.spawnRaceEntity();
    }

    this.race.comboTimer = Math.max(0, this.race.comboTimer - dt);
    if (this.race.comboTimer <= 0 && this.combo > 1) {
      this.combo = Math.max(1, this.combo - dt * 1.5);
    }

    const playerX = this.raceXToCanvas(this.race.playerX);
    const playerY = this.height * RACE_PLAYER_Y;
    const playerW = 76 * this.carScale();
    const playerH = 118 * this.carScale();

    for (let index = this.race.traffic.length - 1; index >= 0; index -= 1) {
      const entity = this.race.traffic[index];
      entity.y += this.race.speed * entity.speedMul * dt;
      const entityX = this.laneToX(entity.lane) + Math.sin(this.sceneTime * 3 + entity.wobble) * 9;

      if (entity.type === "star") {
        const dx = playerX - entityX;
        const dy = playerY - entity.y;
        if (dx * dx + dy * dy < 44 * 44 * this.carScale()) {
          this.stars += 1;
          this.combo = clamp(this.combo + 1, 1, 18);
          this.race.comboTimer = 2.4;
          this.refillFuel(3.5);
          this.boostScore(Math.round(52 * this.combo), "eventStarChain");
          this.spawnBurst(entityX, entity.y, "#ffd166", 12, false);
          this.tone(910, 0.08, "sine", 0.12);
          this.race.traffic.splice(index, 1);
          continue;
        }
      } else if (entity.type === "fuel") {
        const dx = playerX - entityX;
        const dy = playerY - entity.y;
        if (dx * dx + dy * dy < 50 * 50 * this.carScale()) {
          this.refillFuel(22);
          this.boostScore(Math.round(35 * Math.max(1, this.combo * 0.6)), "eventFuelPickup");
          this.spawnBurst(entityX, entity.y, "#63f1ff", 14, false);
          this.tone(620, 0.1, "square", 0.1);
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

        if (!entity.nearMissed && entity.y > playerY - 30 && entity.y < playerY + 16) {
          if (Math.abs(playerX - entityX) < playerW * 0.9 && Math.abs(playerX - entityX) > playerW * 0.45) {
            entity.nearMissed = true;
            this.combo = clamp(this.combo + 0.7, 1, 20);
            this.race.comboTimer = 2;
            this.boostScore(Math.round(40 * this.combo), "eventNearMiss");
            this.tone(530, 0.06, "triangle", 0.08);
          }
        }
      }

      if (entity.y > this.height + 150) {
        if (entity.type === "car") {
          this.boostScore(Math.round(14 * this.combo));
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
    this.clearTiltInput();
  }

  outOfFuel() {
    this.runState = "gameover";
    this.combo = 1;
    this.resultTitleKey = "resultFuelTitle";
    this.resultMessageKey = "resultFuelMessage";
    this.spawnBurst(this.raceXToCanvas(this.race.playerX), this.height * RACE_PLAYER_Y, "#8ae7ff", 18, false);
    this.tone(120, 0.35, "sawtooth", 0.16);
    this.resetControls();
    this.clearTiltInput();
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
    const type = choose(["crate", "cone", "starSign", "drone"]);
    let radius = 24;
    if (type === "cone") radius = 20;
    if (type === "starSign") radius = 26;
    if (type === "drone") radius = 28;
    return {
      type,
      x: rand(120, this.loco.worldW - 120),
      y: rand(120, this.loco.worldH - 120),
      radius,
      alive: true
    };
  }

  refillLocoProps() {
    const aliveCount = this.loco.props.filter((prop) => prop.alive).length;
    if (aliveCount > LOCO_PROP_COUNT * 0.5) {
      return;
    }
    for (let i = 0; i < 18; i += 1) {
      this.loco.props.push(this.createLocoProp());
    }
  }

  updateLoco(dt) {
    this.timeElapsed += dt;
    const axisX = clamp(this.getSteerInput(), -1, 1);
    const axisY = clamp((this.control.down ? 1 : 0) - (this.control.up ? 1 : 0) - (this.tiltInput.enabled ? this.tiltInput.y : 0), -1, 1);
    const player = this.loco.player;

    if (axisX !== 0 || axisY !== 0) {
      player.vx += axisX * 1040 * dt;
      player.vy += axisY * 1040 * dt;
    }

    const drag = Math.pow(0.84, dt * 60);
    player.vx *= drag;
    player.vy *= drag;

    const speed = Math.hypot(player.vx, player.vy);
    if (speed > 470) {
      const scale = 470 / speed;
      player.vx *= scale;
      player.vy *= scale;
    }

    const fuelDrain = 1.9 + speed / 220 + (Math.abs(axisX) + Math.abs(axisY)) * 0.28;
    this.consumeFuel(fuelDrain * dt);
    if (this.fuel <= 0) {
      this.outOfFuel();
      return;
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
        this.combo = clamp(this.combo + 1, 1, 22);
        this.loco.comboTimer = 2.2;
        const isStarProp = prop.type === "starSign";
        const isDroneProp = prop.type === "drone";
        this.stars += isStarProp ? 2 : 1;
        this.refillFuel(isStarProp ? 7 : 4);
        this.boostScore(Math.round((isStarProp ? 55 : isDroneProp ? 48 : 33) * this.combo), "eventLocoSmash");
        this.spawnBurst(prop.x, prop.y, isStarProp ? "#ffd166" : isDroneProp ? "#ff77f4" : "#8ad6ff", 16, true);
        this.tone(isStarProp ? 760 : 320, 0.11, "square", 0.09);
      }
    }
    this.refillLocoProps();
  }

  raceXToCanvas(xNorm) {
    const laneSpan = Math.min(this.width * 0.25, 148);
    return this.width * 0.5 + laneSpan * xNorm;
  }

  laneToX(laneIndex) {
    return this.raceXToCanvas(laneIndex);
  }

  carScale() {
    return clamp(this.width / 430, 0.75, 1.2);
  }

  spawnBurst(x, y, color, count, world) {
    for (let i = 0; i < count; i += 1) {
      this.effects.push({
        x,
        y,
        vx: rand(-130, 130),
        vy: rand(-150, 90),
        size: rand(2, 5),
        color,
        life: rand(0.35, 0.78),
        world: Boolean(world)
      });
    }
  }

  updateEffects(dt) {
    for (let i = this.effects.length - 1; i >= 0; i -= 1) {
      const particle = this.effects[i];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 190 * dt;
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
    gradient.addColorStop(0.5, "#11183f");
    gradient.addColorStop(1, "#080a1d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    const glow = ctx.createRadialGradient(this.width * 0.78, this.height * 0.08, 20, this.width * 0.78, this.height * 0.08, this.width * 0.35);
    glow.addColorStop(0, "rgba(255,205,140,0.3)");
    glow.addColorStop(1, "rgba(255,205,140,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, this.width, this.height * 0.4);

    for (const star of this.starfield) {
      const y = ((star.y + this.sceneTime * star.speed) % 1) * this.height;
      const x = star.x * this.width;
      ctx.globalAlpha = 0.2 + star.size * 0.16;
      ctx.fillStyle = "#fff4bb";
      ctx.beginPath();
      ctx.arc(x, y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawRaceScenery(ctx, topY, bottomY, cx, topW, bottomW) {
    const horizon = topY - this.height * 0.08;

    const skylineY = horizon;
    const drift = (this.sceneTime * this.race.speed * 0.03) % (this.width * 0.22);
    for (let layer = 0; layer < 2; layer += 1) {
      const opacity = layer === 0 ? 0.26 : 0.36;
      const step = layer === 0 ? 72 : 58;
      const heightBase = layer === 0 ? 36 : 52;
      ctx.fillStyle = layer === 0 ? `rgba(49,73,134,${opacity})` : `rgba(24,40,94,${opacity})`;
      for (let x = -step; x < this.width + step; x += step) {
        const ix = x - (drift * (layer === 0 ? 0.3 : 0.55));
        const h = heightBase + ((x / step) % 4) * 10 + (layer * 12);
        ctx.fillRect(ix, skylineY - h, step - 8, h);
      }
    }

    ctx.strokeStyle = "rgba(120,210,255,0.45)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - topW - 16, topY + 6);
    ctx.lineTo(cx - bottomW * 0.5 - 24, bottomY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + topW + 16, topY + 6);
    ctx.lineTo(cx + bottomW * 0.5 + 24, bottomY);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,108,70,0.85)";
    drawRoundedRect(ctx, 12, topY + 18, 84, 24, 8);
    ctx.fill();
    ctx.fillStyle = "#1b0927";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("FLEET ZONE", 54, topY + 34);

    ctx.fillStyle = "rgba(120,255,190,0.85)";
    drawRoundedRect(ctx, this.width - 96, topY + 18, 84, 24, 8);
    ctx.fill();
    ctx.fillStyle = "#0d2525";
    ctx.fillText("STAR RUN", this.width - 54, topY + 34);
  }

  drawRace(ctx, previewOnly) {
    const topY = this.height * 0.18;
    const bottomY = this.height + 24;
    const topW = this.width * 0.16;
    const bottomW = this.width * 0.9;
    const cx = this.width * 0.5;

    this.drawRaceScenery(ctx, topY, bottomY, cx, topW, bottomW);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - topW, topY);
    ctx.lineTo(cx + topW, topY);
    ctx.lineTo(cx + bottomW * 0.5, bottomY);
    ctx.lineTo(cx - bottomW * 0.5, bottomY);
    ctx.closePath();
    const roadGradient = ctx.createLinearGradient(0, topY, 0, bottomY);
    roadGradient.addColorStop(0, "#1a203f");
    roadGradient.addColorStop(0.5, "#121930");
    roadGradient.addColorStop(1, "#090f1e");
    ctx.fillStyle = roadGradient;
    ctx.fill();
    ctx.restore();

    const stripOffset = (this.race.roadOffset + this.sceneTime * 0.12) % 1;
    for (let i = 0; i < 18; i += 1) {
      const t = (i / 18 + stripOffset) % 1;
      const y = topY + t * (bottomY - topY);
      const widthAtY = topW + (bottomW * 0.5 - topW) * t;
      const laneDashLength = 12 + t * 19;
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
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
      const x = this.laneToX(entity.lane) + Math.sin(this.sceneTime * 3 + entity.wobble) * 9;
      if (entity.type === "star") {
        ctx.fillStyle = "#ffd166";
        ctx.strokeStyle = "rgba(255,255,255,0.65)";
        drawStar(ctx, x, entity.y, 16 * this.carScale(), 8 * this.carScale(), 5);
        ctx.fill();
        ctx.stroke();
      } else if (entity.type === "fuel") {
        this.drawFuelCell(ctx, x, entity.y, this.carScale());
      } else {
        this.drawCar(ctx, x, entity.y, 0.78 * this.carScale(), entity.fleet, "", 0, {
          enemy: true,
          badge: entity.tag
        });
      }
    }

    const playerX = this.raceXToCanvas(this.race.playerX);
    const playerY = this.height * RACE_PLAYER_Y;
    this.drawCar(ctx, playerX, playerY, this.carScale(), this.getSelectedCar(), this.getDriverName());

    if (previewOnly) {
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.textAlign = "center";
      ctx.font = "bold 18px Arial";
      ctx.fillText("⭐ ESTRELLA RUSH VS SHADOW FLEET ⭐", this.width * 0.5, this.height * 0.16);
    }
  }

  drawFuelCell(ctx, x, y, scale) {
    const size = 22 * scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#54e0ff";
    drawRoundedRect(ctx, -size * 0.65, -size * 0.75, size * 1.3, size * 1.5, size * 0.18);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#10233f";
    drawHex(ctx, 0, 0, size * 0.42);
    ctx.fill();
    ctx.fillStyle = "#aef6ff";
    ctx.font = `bold ${Math.max(8, size * 0.5)}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("F", 0, size * 0.18);
    ctx.restore();
  }

  drawLoco(ctx) {
    const player = this.loco.player;
    const camX = clamp(player.x - this.width * 0.5, 0, this.loco.worldW - this.width);
    const camY = clamp(player.y - this.height * 0.5, 0, this.loco.worldH - this.height);

    ctx.save();
    ctx.fillStyle = "#111a33";
    ctx.fillRect(0, 0, this.width, this.height);

    const grid = 170;
    const startX = -((camX % grid));
    const startY = -((camY % grid));
    ctx.strokeStyle = "rgba(130,180,255,0.09)";
    ctx.lineWidth = 1;
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

    const roadColor = "rgba(50,76,139,0.72)";
    ctx.fillStyle = roadColor;
    for (let i = 0; i < 7; i += 1) {
      const x = 120 + i * 390 - camX;
      ctx.fillRect(x, -camY, 86, this.loco.worldH);
      const y = 110 + i * 230 - camY;
      ctx.fillRect(-camX, y, this.loco.worldW, 70);
    }

    for (let i = 0; i < 22; i += 1) {
      const bx = ((i * 123) % this.loco.worldW) - camX;
      const by = ((i * 187) % this.loco.worldH) - camY;
      if (bx < -40 || bx > this.width + 40 || by < -40 || by > this.height + 40) {
        continue;
      }
      ctx.fillStyle = "rgba(29,51,95,0.85)";
      drawRoundedRect(ctx, bx - 26, by - 22, 52, 44, 8);
      ctx.fill();
      ctx.fillStyle = "rgba(113,214,255,0.35)";
      ctx.fillRect(bx - 18, by - 12, 36, 6);
      ctx.fillRect(bx - 18, by + 1, 24, 6);
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
      } else if (prop.type === "drone") {
        ctx.fillStyle = "#ff77f4";
        drawRoundedRect(ctx, x - 16, y - 8, 32, 16, 8);
        ctx.fill();
        ctx.fillStyle = "rgba(255,190,250,0.8)";
        ctx.beginPath();
        ctx.arc(x - 16, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 16, y, 6, 0, Math.PI * 2);
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
      this.getDriverName(),
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

  drawCar(ctx, x, y, scale, car, plateText, heading = 0, options = {}) {
    const width = 78 * scale;
    const height = 118 * scale;
    const enemy = options.enemy === true;

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

    ctx.fillStyle = enemy ? "#2c0f15" : "#171d35";
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

    if (enemy) {
      ctx.fillStyle = "rgba(255,92,92,0.85)";
      drawRoundedRect(ctx, -width * 0.28, height * 0.22, width * 0.56, height * 0.16, 6 * scale);
      ctx.fill();
      ctx.fillStyle = "#18070d";
      ctx.font = `bold ${Math.max(8, 10 * scale)}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(options.badge || "VX", 0, height * 0.33);

      ctx.fillStyle = "#ff8a8a";
      ctx.beginPath();
      ctx.arc(-width * 0.2, -height * 0.08, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width * 0.2, -height * 0.08, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
    } else {
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
    }
    ctx.restore();
  }

  computeSrs() {
    const speedScore = this.mode === "race" ? this.race.speed : Math.hypot(this.loco.player.vx, this.loco.player.vy) * 0.7;
    const srs = this.score / 55 + this.combo * 11 + this.stars * 3 + speedScore * 0.05;
    return Math.max(0, Math.floor(srs));
  }

  getSnapshot() {
    return {
      mode: this.mode,
      runState: this.runState,
      score: Math.floor(this.score),
      stars: this.stars,
      combo: Math.max(1, Math.floor(this.combo)),
      plate: this.getDriverName(),
      missionKey: this.mode === "race" ? "raceMission" : "locoMission",
      timer: this.timeElapsed,
      fuel: Math.round(this.fuel),
      srs: this.computeSrs(),
      flashEventKey: this.flashEventKey,
      scorePulse: this.scorePulse > 0,
      srsPulse: this.srsPulse > 0
    };
  }
}
