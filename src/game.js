const MAX_DPR = 2;
const STAR_FIELD_COUNT = 110;
const RACE_PLAYER_Y = 0.84;
const RACE_BASE_SPEED = 360;
const RACE_BASE_SPAWN = 0.85;
const LOCO_PROP_COUNT = 84;

export const CAR_PRESETS = [
  {
    id: "cometa-roja",
    body: "#f44336",
    accent: "#ffd166",
    stripe: "#fff3a0",
    glow: "rgba(255,99,71,0.55)"
  },
  {
    id: "pulso-azul",
    body: "#2f80ff",
    accent: "#8fe7ff",
    stripe: "#d7f7ff",
    glow: "rgba(91,180,255,0.55)"
  },
  {
    id: "volt-verde",
    body: "#30c86f",
    accent: "#d1ff6f",
    stripe: "#f0ffd4",
    glow: "rgba(94,255,157,0.5)"
  },
  {
    id: "nova-drift",
    body: "#a35cff",
    accent: "#ffd7ff",
    stripe: "#f6e4ff",
    glow: "rgba(184,118,255,0.55)"
  },
  {
    id: "turbo-sol",
    body: "#ffb938",
    accent: "#fff5a8",
    stripe: "#ffe3b0",
    glow: "rgba(255,210,120,0.55)"
  }
];

const FLEET_PRESETS = [
  { body: "#222933", accent: "#ff4d4d", stripe: "#5d0b16", glow: "rgba(255,77,77,0.45)" },
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
    this.selectedCarId = "cometa-roja";

    this.mode = "race";
    this.runState = "menu";
    this.resultTitleKey = "resultCrashTitle";
    this.resultMessageKey = "resultCrashMessage";

    this.score = 0;
    this.stars = 0;
    this.timeElapsed = 0;
    this.maxFuel = 100;
    this.fuel = this.maxFuel;
    this.damage = 0;
    this.combo = 1;
    this.crashes = 0;

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
    this.musicTimer = null;
    this.musicStep = 0;

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
    return CAR_BY_ID[this.selectedCarId] || CAR_BY_ID["cometa-roja"];
  }

  setMuted(value) {
    this.muted = Boolean(value);
    if (this.muted) {
      this.stopMusic();
    } else if (this.runState === "playing") {
      this.startMusic();
    }
  }

  toggleMuted() {
    this.setMuted(!this.muted);
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

  tone(freq, duration, type = "triangle", volume = 0.08) {
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

  startMusic() {
    if (this.muted || !this.audioCtx || this.musicTimer || this.runState !== "playing") {
      return;
    }
    this.musicStep = 0;
    this.musicTimer = setInterval(() => this.playMusicStep(), 220);
    this.playMusicStep();
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  playMusicStep() {
    if (this.muted || !this.audioCtx || this.runState !== "playing") {
      return;
    }
    if (this.mode === "race") {
      const lead = [392, 440, 494, 523, 587, 523, 494, 440];
      const bass = [110, 123, 147, 98];
      const note = lead[this.musicStep % lead.length];
      const bassNote = bass[Math.floor(this.musicStep / 2) % bass.length];
      this.tone(note, 0.18, "triangle", 0.055);
      if (this.musicStep % 2 === 0) {
        this.tone(note * 2, 0.08, "square", 0.03);
      }
      if (this.musicStep % 4 === 0) {
        this.tone(bassNote, 0.24, "sine", 0.07);
      }
    } else {
      const lead = [330, 349, 392, 415, 440, 415, 392, 349];
      const perc = [220, 233, 196, 233];
      const note = lead[this.musicStep % lead.length];
      this.tone(note, 0.16, "sawtooth", 0.048);
      if (this.musicStep % 2 === 0) {
        this.tone(note * 1.5, 0.07, "square", 0.028);
      }
      if (this.musicStep % 3 === 0) {
        this.tone(perc[this.musicStep % perc.length], 0.09, "triangle", 0.035);
      }
    }
    this.musicStep += 1;
  }

  start(mode) {
    this.mode = mode === "loco" ? "loco" : "race";
    this.runState = "playing";
    this.score = 0;
    this.stars = 0;
    this.timeElapsed = 0;
    this.fuel = this.maxFuel;
    this.damage = 0;
    this.combo = 1;
    this.crashes = 0;
    this.effects = [];
    this.sceneTime = 0;
    this.scorePulse = 0;
    this.srsPulse = 0;
    this.flashEventTimer = 0;
    this.flashEventKey = "";
    this.lastFrame = performance.now();
    this.resetControls();
    this.clearTiltInput();
    if (this.mode === "race") {
      this.resetRace();
    } else {
      this.resetLoco();
    }
    this.startMusic();
  }

  restart() {
    this.start(this.mode);
  }

  stopToMenu() {
    this.runState = "menu";
    this.resetControls();
    this.clearTiltInput();
    this.stopMusic();
  }

  togglePause() {
    if (this.runState === "playing") {
      this.runState = "paused";
      this.stopMusic();
      return this.runState;
    }
    if (this.runState === "paused") {
      this.runState = "playing";
      this.lastFrame = performance.now();
      this.startMusic();
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

  getSteerInput() {
    const fromButtons = (this.control.right ? 1 : 0) - (this.control.left ? 1 : 0);
    const fromTilt = this.tiltInput.enabled ? this.tiltInput.x : 0;
    return clamp(fromButtons + fromTilt, -1, 1);
  }

  getThrottleInput() {
    const fromButtons = (this.control.up ? 1 : 0) - (this.control.down ? 1 : 0);
    const fromTilt = this.tiltInput.enabled ? this.tiltInput.y : 0;
    return clamp(fromButtons + fromTilt, -1, 1);
  }

  moveLane(direction) {
    if (this.mode !== "race" || this.runState !== "playing") {
      return;
    }
    this.race.playerX = clamp(this.race.playerX + direction * 0.45, -1, 1);
    this.tone(460, 0.05, "triangle", 0.08);
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

  setFlashEvent(eventKey, duration = 0.75) {
    this.flashEventKey = eventKey;
    this.flashEventTimer = duration;
  }

  consumeFuel(amount) {
    this.fuel = clamp(this.fuel - amount, 0, this.maxFuel);
    if (this.fuel <= 18) {
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

  applyDamage(amount) {
    this.damage = clamp(this.damage + amount, 0, 100);
    if (this.damage >= 70) {
      this.setFlashEvent("eventHighDamage", 0.7);
    }
    if (this.damage >= 100) {
      this.carTotaled();
    }
  }

  resetRace() {
    this.race = {
      playerX: 0,
      speed: RACE_BASE_SPEED,
      targetSpeed: RACE_BASE_SPEED,
      distance: 0,
      spawnTimer: 0,
      entities: [],
      comboTimer: 0,
      fleetSerial: 0
    };
  }

  spawnRaceEntity() {
    const lane = choose([-1, 0, 1]);
    const roll = Math.random();
    if (roll < 0.34) {
      this.race.entities.push({
        type: "star",
        lane,
        y: -100,
        wobble: rand(0, Math.PI * 2),
        speedMul: rand(0.9, 1.06)
      });
      return;
    }
    if (roll < 0.5) {
      this.race.entities.push({
        type: "fuel",
        lane,
        y: -110,
        wobble: rand(0, Math.PI * 2),
        speedMul: rand(0.92, 1.08)
      });
      return;
    }
    this.race.fleetSerial += 1;
    this.race.entities.push({
      type: "fleet",
      lane,
      y: -140,
      wobble: rand(0, Math.PI * 2),
      speedMul: rand(0.82, 1.18),
      nearMissed: false,
      fleet: choose(FLEET_PRESETS),
      tag: `VX-${String((this.race.fleetSerial % 97) + 3).padStart(2, "0")}`
    });
  }

  roadSample(t) {
    const curve =
      Math.sin((this.race.distance + (1 - t) * 1300) * 0.0014) * 0.85 +
      Math.sin((this.race.distance + (1 - t) * 540) * 0.0032) * 0.35;
    const width = this.width * (0.14 + t * t * 0.76);
    const center = this.width * 0.5 + curve * t * 140 - this.race.playerX * t * 118;
    return { center, width };
  }

  raceEntityPosition(entity) {
    const horizon = this.height * 0.24;
    const maxY = this.height * 0.92;
    const t = clamp((entity.y - horizon) / (maxY - horizon), 0, 1);
    const road = this.roadSample(t);
    return {
      x: road.center + entity.lane * road.width * 0.28 + Math.sin(this.sceneTime * 3 + entity.wobble) * 8,
      t
    };
  }

  updateRace(dt) {
    this.timeElapsed += dt;
    const steerInput = this.getSteerInput();
    const throttleInput = this.getThrottleInput();

    this.race.playerX = clamp(this.race.playerX + steerInput * dt * 2.45, -1, 1);
    this.race.targetSpeed = clamp(380 + throttleInput * 220 + Math.min(this.stars * 1.5, 90), 250, 730);
    this.race.speed += (this.race.targetSpeed - this.race.speed) * dt * 2.25;
    this.race.distance += this.race.speed * dt * 1.9;

    const fuelDrain = 2.7 + (this.race.speed - 250) / 190 + Math.abs(steerInput) * 0.9 + Math.max(0, throttleInput) * 1.35;
    this.consumeFuel(fuelDrain * dt);
    if (this.fuel <= 0) {
      this.outOfFuel();
      return;
    }

    const spawnInterval = Math.max(0.35, RACE_BASE_SPAWN - (this.race.speed - RACE_BASE_SPEED) / 1650);
    this.race.spawnTimer -= dt;
    if (this.race.spawnTimer <= 0) {
      this.race.spawnTimer = spawnInterval;
      this.spawnRaceEntity();
    }

    this.race.comboTimer = Math.max(0, this.race.comboTimer - dt);
    if (this.race.comboTimer <= 0 && this.combo > 1) {
      this.combo = Math.max(1, this.combo - dt * 1.55);
    }

    const playerRoad = this.roadSample(1);
    const playerX = playerRoad.center + this.race.playerX * playerRoad.width * 0.33;
    const playerY = this.height * RACE_PLAYER_Y;
    const playerW = 76 * this.carScale();
    const playerH = 118 * this.carScale();

    for (let index = this.race.entities.length - 1; index >= 0; index -= 1) {
      const entity = this.race.entities[index];
      entity.y += this.race.speed * entity.speedMul * dt;
      const projected = this.raceEntityPosition(entity);
      const entityX = projected.x;

      if (entity.type === "star") {
        const dx = playerX - entityX;
        const dy = playerY - entity.y;
        if (dx * dx + dy * dy < 45 * 45 * this.carScale()) {
          this.stars += 1;
          this.combo = clamp(this.combo + 1, 1, 18);
          this.race.comboTimer = 2.5;
          this.refillFuel(4);
          this.boostScore(Math.round(56 * this.combo), "eventStarChain");
          this.spawnBurst(entityX, entity.y, "#ffd166", 12, false);
          this.tone(910, 0.08, "sine", 0.11);
          this.race.entities.splice(index, 1);
          continue;
        }
      } else if (entity.type === "fuel") {
        const dx = playerX - entityX;
        const dy = playerY - entity.y;
        if (dx * dx + dy * dy < 52 * 52 * this.carScale()) {
          this.refillFuel(24);
          this.boostScore(Math.round(36 * Math.max(1, this.combo * 0.7)), "eventFuelPickup");
          this.spawnBurst(entityX, entity.y, "#63f1ff", 14, false);
          this.tone(620, 0.1, "square", 0.1);
          this.race.entities.splice(index, 1);
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
        if (!entity.nearMissed && entity.y > playerY - 26 && entity.y < playerY + 20) {
          const lateral = Math.abs(playerX - entityX);
          if (lateral > playerW * 0.45 && lateral < playerW * 0.95) {
            entity.nearMissed = true;
            this.combo = clamp(this.combo + 0.75, 1, 20);
            this.race.comboTimer = 2.1;
            this.boostScore(Math.round(44 * this.combo), "eventNearMiss");
            this.tone(530, 0.06, "triangle", 0.08);
          }
        }
      }

      if (entity.y > this.height + 160) {
        if (entity.type === "fleet") {
          this.boostScore(Math.round(14 * this.combo));
        }
        this.race.entities.splice(index, 1);
      }
    }
  }

  crashRace(playerX, playerY) {
    this.runState = "gameover";
    this.crashes += 1;
    this.combo = 1;
    this.resultTitleKey = "resultCrashTitle";
    this.resultMessageKey = "resultCrashMessage";
    this.spawnBurst(playerX, playerY, "#ff5f57", 26, false);
    this.tone(160, 0.24, "sawtooth", 0.2);
    this.tone(90, 0.36, "triangle", 0.14);
    this.resetControls();
    this.clearTiltInput();
    this.stopMusic();
  }

  outOfFuel() {
    this.runState = "gameover";
    this.combo = 1;
    this.resultTitleKey = "resultFuelTitle";
    this.resultMessageKey = "resultFuelMessage";
    this.spawnBurst(this.width * 0.5, this.height * RACE_PLAYER_Y, "#8ae7ff", 20, false);
    this.tone(120, 0.35, "sawtooth", 0.15);
    this.resetControls();
    this.clearTiltInput();
    this.stopMusic();
  }

  resetLoco() {
    this.loco = {
      arenaSize: 220,
      player: {
        x: 0,
        z: 0,
        yaw: 0,
        speed: 0,
        radius: 3.1
      },
      props: [],
      comboTimer: 0
    };
    this.loco.props = Array.from({ length: LOCO_PROP_COUNT }, () => this.createLocoProp());
  }

  createLocoProp() {
    const type = choose(["crate", "cone", "starSign", "drone"]);
    const size = type === "cone" ? 2.2 : type === "drone" ? 3.3 : 2.9;
    const height = type === "cone" ? 4.1 : type === "drone" ? 2.2 : 4.9;
    return {
      type,
      x: rand(-190, 190),
      z: rand(-190, 190),
      radius: size * 0.9,
      size,
      height,
      health: type === "drone" ? 14 : 20,
      alive: true
    };
  }

  refillLocoProps() {
    const aliveCount = this.loco.props.filter((prop) => prop.alive).length;
    if (aliveCount > LOCO_PROP_COUNT * 0.54) {
      return;
    }
    for (let i = 0; i < 16; i += 1) {
      this.loco.props.push(this.createLocoProp());
    }
  }

  updateLoco(dt) {
    this.timeElapsed += dt;

    const player = this.loco.player;
    const steerInput = this.getSteerInput();
    const throttleInput = this.getThrottleInput();

    const maxForwardSpeed = clamp(52 - this.damage * 0.34, 18, 52);
    const maxReverseSpeed = -16;
    const accel = throttleInput * (34 - this.damage * 0.13);
    player.speed += accel * dt;
    player.speed *= Math.pow(0.987, dt * 60);
    player.speed = clamp(player.speed, maxReverseSpeed, maxForwardSpeed);

    const yawRate = steerInput * (1.05 + Math.abs(player.speed) * 0.038);
    player.yaw += yawRate * dt;

    const nextX = player.x + Math.sin(player.yaw) * player.speed * dt * 4.1;
    const nextZ = player.z + Math.cos(player.yaw) * player.speed * dt * 4.1;
    const boundary = this.loco.arenaSize - 4;

    if (Math.abs(nextX) > boundary || Math.abs(nextZ) > boundary) {
      player.x = clamp(nextX, -boundary, boundary);
      player.z = clamp(nextZ, -boundary, boundary);
      const impact = Math.max(8, Math.abs(player.speed) * 0.9);
      player.speed *= -0.28;
      this.applyDamage(impact * 0.5);
      this.crashes += 1;
      this.spawnBurst(this.width * 0.5, this.height * 0.8, "#ff8d8d", 8, false);
    } else {
      player.x = nextX;
      player.z = nextZ;
    }

    const fuelDrain = 1.4 + Math.abs(player.speed) * 0.075 + Math.max(0, throttleInput) * 0.95;
    this.consumeFuel(fuelDrain * dt);
    if (this.fuel <= 0) {
      this.outOfFuel();
      return;
    }
    if (this.runState !== "playing") {
      return;
    }

    this.loco.comboTimer = Math.max(0, this.loco.comboTimer - dt);
    if (this.loco.comboTimer <= 0 && this.combo > 1) {
      this.combo = Math.max(1, this.combo - dt * 2.35);
    }

    for (const prop of this.loco.props) {
      if (!prop.alive) {
        continue;
      }
      const dx = prop.x - player.x;
      const dz = prop.z - player.z;
      const collisionDistance = prop.radius + player.radius;
      if (dx * dx + dz * dz <= collisionDistance * collisionDistance) {
        const impact = Math.max(8, Math.abs(player.speed) * 1.7);
        player.speed *= -0.24;
        this.applyDamage(impact * 0.54);
        if (this.runState !== "playing") {
          return;
        }
        prop.health -= impact * 1.1;
        this.crashes += 1;
        this.combo = clamp(this.combo + 1, 1, 22);
        this.loco.comboTimer = 2.2;
        const isStar = prop.type === "starSign";
        const isDrone = prop.type === "drone";
        this.stars += isStar ? 2 : 1;
        this.refillFuel(isStar ? 7 : 4);
        this.boostScore(Math.round((isStar ? 58 : isDrone ? 50 : 36) * this.combo), "eventLocoSmash");
        this.spawnBurst(prop.x, prop.z, isStar ? "#ffd166" : isDrone ? "#ff77f4" : "#8ad6ff", 16, true);
        this.tone(isStar ? 760 : 320, 0.11, "square", 0.09);
        if (prop.health <= 0) {
          prop.alive = false;
        }
      }
    }
    this.refillLocoProps();
  }

  carTotaled() {
    this.runState = "gameover";
    this.resultTitleKey = "resultDamageTitle";
    this.resultMessageKey = "resultDamageMessage";
    this.resetControls();
    this.clearTiltInput();
    this.stopMusic();
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
    ctx.fillRect(0, 0, this.width, this.height * 0.42);

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

  drawRaceScenery(ctx, horizonY) {
    const drift = (this.sceneTime * this.race.speed * 0.03) % (this.width * 0.22);
    for (let layer = 0; layer < 2; layer += 1) {
      const opacity = layer === 0 ? 0.25 : 0.35;
      const step = layer === 0 ? 72 : 56;
      const heightBase = layer === 0 ? 36 : 52;
      ctx.fillStyle = layer === 0 ? `rgba(49,73,134,${opacity})` : `rgba(24,40,94,${opacity})`;
      for (let x = -step; x < this.width + step; x += step) {
        const ix = x - drift * (layer === 0 ? 0.3 : 0.55);
        const h = heightBase + (((x / step) % 4) + 1) * 10 + layer * 10;
        ctx.fillRect(ix, horizonY - h, step - 8, h);
      }
    }

    ctx.fillStyle = "rgba(255,108,70,0.85)";
    drawRoundedRect(ctx, 12, horizonY + 20, 92, 26, 8);
    ctx.fill();
    ctx.fillStyle = "#1b0927";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("FLEET", 58, horizonY + 37);

    ctx.fillStyle = "rgba(120,255,190,0.85)";
    drawRoundedRect(ctx, this.width - 104, horizonY + 20, 92, 26, 8);
    ctx.fill();
    ctx.fillStyle = "#0d2525";
    ctx.fillText("STAR", this.width - 58, horizonY + 37);
  }

  drawRace(ctx, previewOnly) {
    const horizonY = this.height * 0.24;
    const maxRoadY = this.height * 0.96;
    this.drawRaceScenery(ctx, horizonY);

    const segments = 60;
    for (let s = 0; s < segments; s += 1) {
      const t0 = s / segments;
      const t1 = (s + 1) / segments;
      const y0 = horizonY + t0 * t0 * (maxRoadY - horizonY);
      const y1 = horizonY + t1 * t1 * (maxRoadY - horizonY);
      const road0 = this.roadSample(t0);
      const road1 = this.roadSample(t1);
      const shoulderScale0 = road0.width * 0.12;
      const shoulderScale1 = road1.width * 0.12;

      const shoulderColor = s % 2 === 0 ? "rgba(255,82,82,0.82)" : "rgba(255,225,132,0.82)";
      ctx.fillStyle = shoulderColor;
      ctx.beginPath();
      ctx.moveTo(road0.center - road0.width * 0.5 - shoulderScale0, y0);
      ctx.lineTo(road0.center - road0.width * 0.5, y0);
      ctx.lineTo(road1.center - road1.width * 0.5, y1);
      ctx.lineTo(road1.center - road1.width * 0.5 - shoulderScale1, y1);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(road0.center + road0.width * 0.5 + shoulderScale0, y0);
      ctx.lineTo(road0.center + road0.width * 0.5, y0);
      ctx.lineTo(road1.center + road1.width * 0.5, y1);
      ctx.lineTo(road1.center + road1.width * 0.5 + shoulderScale1, y1);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = s % 2 === 0 ? "#2b324f" : "#1f2740";
      ctx.beginPath();
      ctx.moveTo(road0.center - road0.width * 0.5, y0);
      ctx.lineTo(road0.center + road0.width * 0.5, y0);
      ctx.lineTo(road1.center + road1.width * 0.5, y1);
      ctx.lineTo(road1.center - road1.width * 0.5, y1);
      ctx.closePath();
      ctx.fill();

      if (s % 2 === 0) {
        ctx.strokeStyle = "rgba(255,255,255,0.24)";
        ctx.lineWidth = 2;
        for (let lane = 1; lane <= 2; lane += 1) {
          const x0 = road0.center - road0.width * 0.5 + (road0.width * lane) / 3;
          const x1 = road1.center - road1.width * 0.5 + (road1.width * lane) / 3;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
      }
    }

    this.drawEffects(ctx, false, null);
    for (const entity of this.race.entities) {
      const projected = this.raceEntityPosition(entity);
      const x = projected.x;
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

    const playerRoad = this.roadSample(1);
    const playerX = playerRoad.center + this.race.playerX * playerRoad.width * 0.33;
    const playerY = this.height * RACE_PLAYER_Y;
    this.drawCar(ctx, playerX, playerY, this.carScale(), this.getSelectedCar(), this.getDriverName(), this.getSteerInput() * 0.06, {
      damage: this.damage
    });

    if (previewOnly) {
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.textAlign = "center";
      ctx.font = "bold 18px Arial";
      ctx.fillText("⭐ SHADOW FLEET SHOWDOWN ⭐", this.width * 0.5, this.height * 0.17);
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
    drawRoundedRect(ctx, -size * 0.27, -size * 0.33, size * 0.54, size * 0.66, size * 0.1);
    ctx.fill();
    ctx.fillStyle = "#aef6ff";
    ctx.font = `bold ${Math.max(8, size * 0.5)}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("F", 0, size * 0.18);
    ctx.restore();
  }

  getLocoCamera() {
    const player = this.loco.player;
    const forwardX = Math.sin(player.yaw);
    const forwardZ = Math.cos(player.yaw);
    const rightX = Math.cos(player.yaw);
    const rightZ = -Math.sin(player.yaw);
    const camDist = 12;
    return {
      x: player.x - forwardX * camDist,
      y: 4.8,
      z: player.z - forwardZ * camDist,
      forwardX,
      forwardZ,
      rightX,
      rightZ,
      fov: this.width * 0.92,
      groundY: this.height * 0.84,
      renderDist: 170
    };
  }

  projectWorld(wx, wy, wz, cam) {
    const dx = wx - cam.x;
    const dz = wz - cam.z;
    const lx = dx * cam.rightX + dz * cam.rightZ;
    const lz = dx * cam.forwardX + dz * cam.forwardZ;
    const ly = wy - cam.y;
    if (lz <= 1 || lz > cam.renderDist + 10) {
      return null;
    }
    return {
      sx: this.width * 0.5 + (lx / lz) * cam.fov,
      sy: cam.groundY - (ly / lz) * cam.fov,
      lz,
      scale: cam.fov / lz
    };
  }

  projectLocal(lx, ly, lz, cam) {
    if (lz <= 1 || lz > cam.renderDist + 10) {
      return null;
    }
    return {
      sx: this.width * 0.5 + (lx / lz) * cam.fov,
      sy: cam.groundY - (ly / lz) * cam.fov,
      lz,
      scale: cam.fov / lz
    };
  }

  drawLocoGround(ctx, cam) {
    const sky = ctx.createLinearGradient(0, this.height * 0.18, 0, this.height * 0.95);
    sky.addColorStop(0, "rgba(30,42,95,0.7)");
    sky.addColorStop(1, "rgba(12,18,44,0.85)");
    ctx.fillStyle = sky;
    ctx.fillRect(0, this.height * 0.18, this.width, this.height * 0.82);

    for (let z = 6; z < cam.renderDist; z += 8) {
      const p1 = this.projectLocal(-70, 0, z, cam);
      const p2 = this.projectLocal(70, 0, z, cam);
      if (!p1 || !p2) {
        continue;
      }
      const alpha = clamp(0.35 - z / 260, 0.04, 0.35);
      ctx.strokeStyle = `rgba(116,178,255,${alpha})`;
      ctx.lineWidth = z % 16 === 0 ? 1.8 : 1;
      ctx.beginPath();
      ctx.moveTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.stroke();
    }

    for (let x = -64; x <= 64; x += 8) {
      const p1 = this.projectLocal(x, 0, 6, cam);
      const p2 = this.projectLocal(x, 0, cam.renderDist, cam);
      if (!p1 || !p2) {
        continue;
      }
      ctx.strokeStyle = "rgba(86,140,214,0.16)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.stroke();
    }
  }

  drawArenaWalls(ctx, cam) {
    const a = this.loco.arenaSize;
    const walls = [
      [-a, -a, a, -a],
      [a, -a, a, a],
      [a, a, -a, a],
      [-a, a, -a, -a]
    ];
    for (const wall of walls) {
      const [x1, z1, x2, z2] = wall;
      const p1 = this.projectWorld(x1, 0, z1, cam);
      const p2 = this.projectWorld(x2, 0, z2, cam);
      const t1 = this.projectWorld(x1, 9, z1, cam);
      const t2 = this.projectWorld(x2, 9, z2, cam);
      if (!p1 || !p2 || !t1 || !t2) {
        continue;
      }
      ctx.fillStyle = "rgba(255,79,137,0.2)";
      ctx.beginPath();
      ctx.moveTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.lineTo(t2.sx, t2.sy);
      ctx.lineTo(t1.sx, t1.sy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,135,190,0.4)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  drawLocoProps(ctx, cam) {
    const visibles = [];
    for (const prop of this.loco.props) {
      if (!prop.alive) {
        continue;
      }
      const base = this.projectWorld(prop.x, 0, prop.z, cam);
      const top = this.projectWorld(prop.x, prop.height, prop.z, cam);
      if (!base || !top) {
        continue;
      }
      visibles.push({ prop, base, top });
    }
    visibles.sort((a, b) => b.base.lz - a.base.lz);

    for (const item of visibles) {
      const { prop, base, top } = item;
      const width = Math.max(6, prop.size * base.scale * 0.36);
      const topWidth = width * 0.72;

      let front = "#8ba2d9";
      let topColor = "#c8dbff";
      if (prop.type === "crate") {
        front = "#9a6d3b";
        topColor = "#c7904f";
      } else if (prop.type === "cone") {
        front = "#ff8c3a";
        topColor = "#ffb067";
      } else if (prop.type === "drone") {
        front = "#ff77f4";
        topColor = "#ffc1fb";
      } else if (prop.type === "starSign") {
        front = "#ffd166";
        topColor = "#ffe6a8";
      }

      ctx.fillStyle = front;
      drawRoundedRect(ctx, base.sx - width * 0.5, top.sy, width, base.sy - top.sy, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = topColor;
      ctx.beginPath();
      ctx.moveTo(base.sx - topWidth * 0.5, top.sy);
      ctx.lineTo(base.sx + topWidth * 0.5, top.sy);
      ctx.lineTo(base.sx + topWidth * 0.33, top.sy - topWidth * 0.33);
      ctx.lineTo(base.sx - topWidth * 0.33, top.sy - topWidth * 0.33);
      ctx.closePath();
      ctx.fill();

      if (prop.type === "starSign") {
        ctx.fillStyle = "#9c6b0c";
        ctx.font = `bold ${Math.max(8, topWidth * 0.38)}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText("★", base.sx, top.sy - topWidth * 0.06);
      }
    }
  }

  drawLoco(ctx) {
    const cam = this.getLocoCamera();
    this.drawLocoGround(ctx, cam);
    this.drawArenaWalls(ctx, cam);
    this.drawLocoProps(ctx, cam);
    this.drawEffects(ctx, true, cam);

    const lean = this.getSteerInput() * 0.22;
    const bob = Math.sin(this.sceneTime * 9) * 2;
    this.drawCar(
      ctx,
      this.width * 0.5 + lean * 20,
      this.height * 0.79 + bob,
      this.carScale() * 1.06,
      this.getSelectedCar(),
      this.getDriverName(),
      lean * 0.45,
      { damage: this.damage }
    );
  }

  drawEffects(ctx, worldSpace, camera) {
    for (const particle of this.effects) {
      if (particle.world !== worldSpace) {
        continue;
      }
      let x;
      let y;
      if (worldSpace) {
        const point = this.projectWorld(particle.x, 0.6, particle.y, camera);
        if (!point) {
          continue;
        }
        x = point.sx;
        y = point.sy;
      } else {
        x = particle.x;
        y = particle.y;
      }
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

  drawDamageSmoke(ctx, x, y, scale, damageLevel) {
    if (damageLevel < 20) {
      return;
    }
    const density = Math.floor(damageLevel / 20);
    for (let i = 0; i < density; i += 1) {
      const phase = this.sceneTime * 2.4 + i * 1.1;
      const sx = x + Math.sin(phase) * 6 * scale;
      const sy = y - 56 * scale - i * 8 - Math.cos(phase) * 4;
      const size = (5 + i * 1.2) * scale;
      ctx.fillStyle = `rgba(30,30,38,${0.18 + damageLevel / 320})`;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawCar(ctx, x, y, scale, car, plateText, heading = 0, options = {}) {
    const width = 78 * scale;
    const height = 118 * scale;
    const enemy = options.enemy === true;
    const damageLevel = options.damage || 0;

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
      ctx.fillText(String(plateText || "DRIVER"), 0, height * 0.33);

      ctx.fillStyle = "#fff5b8";
      ctx.beginPath();
      ctx.arc(-width * 0.2, -height * 0.08, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width * 0.2, -height * 0.08, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!enemy && damageLevel > 0) {
      const shade = clamp(damageLevel / 125, 0, 0.75);
      ctx.fillStyle = `rgba(20,20,26,${shade})`;
      drawRoundedRect(ctx, -width * 0.5, -height * 0.5, width, height, 16 * scale);
      ctx.fill();
      ctx.strokeStyle = `rgba(255,220,220,${0.2 + damageLevel / 180})`;
      ctx.lineWidth = Math.max(1, 1.3 * scale);
      for (let i = 0; i < Math.floor(damageLevel / 18); i += 1) {
        const sx = -width * 0.3 + i * width * 0.08;
        const ex = sx + width * 0.22;
        const sy = -height * 0.18 + Math.sin(i + this.sceneTime * 2) * 6;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, sy + 8);
        ctx.stroke();
      }
    }
    ctx.restore();

    if (!enemy) {
      this.drawDamageSmoke(ctx, x, y, scale, damageLevel);
    }
  }

  computeSrs() {
    const pace = this.mode === "race" ? this.race.speed : Math.abs(this.loco.player.speed) * 8.5;
    const srs = this.score / 52 + this.combo * 11 + this.stars * 4 + pace * 0.06 - this.damage * 0.9;
    return Math.max(0, Math.floor(srs));
  }

  getSnapshot() {
    return {
      mode: this.mode,
      runState: this.runState,
      score: Math.floor(this.score),
      timer: this.timeElapsed,
      fuel: Math.round(this.fuel),
      damage: Math.round(this.damage),
      srs: this.computeSrs(),
      flashEventKey: this.flashEventKey,
      scorePulse: this.scorePulse > 0,
      srsPulse: this.srsPulse > 0
    };
  }
}
