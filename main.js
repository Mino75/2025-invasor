// main.js — game logic with Time & Time-Bonus integrated (safe if HUD fields missing)

// -------------------------------
// Constants
// -------------------------------
const GAME_CONSTANTS = Object.freeze({
  STAGE_WIDTH: 720,
  STAGE_HEIGHT: 700,

  PLAYER_EMOJI: "🛌",
  PLAYER_MOVE_SPEED_PX_PER_SEC: 360,
  PLAYER_INITIAL_LIVES: 3,
  PLAYER_SHOT_COOLDOWN_MS: 180,            // baseline auto-fire
  PLAYER_BONUS_FIRE_COOLDOWN_MS: 70,
  BONUS_DURATION_MS: 4000,

  ENEMY_GRID_COLUMNS: 11,
  ENEMY_GRID_ROWS: 6,
  ENEMY_X_SPACING: 56,
  ENEMY_Y_SPACING: 52,
  ENEMY_TOP_OFFSET: 20,
  ENEMY_SIDE_PADDING: 32,
  ENEMY_STEP_PX: 16,
  ENEMY_DESCENT_PX: 22,
  ENEMY_MOVE_INTERVAL_MS: 420,
  ENEMY_SHOT_CHANCE_PER_STEP: 0.24,

  ENEMY_BASIC_EMOJI: "👾",
  ENEMY_SPECIAL_EMOJIS: ["👻", "🐙"],
  ENEMY_PROJECTILE_EMOJI: "🔶",
  ENEMY_EXPLOSION_BY_TYPE: { basic: "💥", ghost: "🔥", squid: "⚡" },

  PRJ_SPEED_PLAYER: 560,
  PRJ_SPEED_BASIC: 320,
  PRJ_SPEED_GHOST: 250,
  PRJ_SPEED_SQUID: 420,

  SPECIAL_BURST_COUNT: 3,
  SPECIAL_SHOT_GAP_MS: 160,
  SPECIAL_RELOAD_MS: 2200,

  PLAYER_PROJECTILE_EMOJI: "🐝",

  BARRIERS_COUNT: 6,
  BARRIER_ROWS: 4,
  BARRIER_HP: 6,
  BARRIER_EMOJIS: ["🏢","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","💒","🗼"],

  SCORE_BASIC: 15,
  SCORE_SPECIAL: 60,
});

// Time & Time-Bonus settings
const TIME_BONUS_MAX = 1000;          // starting bonus
const TIME_BONUS_GRACE_MS = 20_000;   // first 10s stay full
const TIME_BONUS_DECAY_PER_SEC = 50;  // then -50 / second

// -------------------------------
// DOM refs
// -------------------------------
const stage = document.getElementById("game-stage");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlaySubtitle = document.getElementById("overlay-subtitle");
const btnReplay = document.getElementById("btn-replay");

const bonusIndicator = document.getElementById("bonus-indicator");
const scoreValueEl = document.getElementById("score-value");
const livesValueEl = document.getElementById("lives-value");
const highValueEl = document.getElementById("high-value");

// New (optional) HUD fields — safe if not present
const timeValueEl = document.getElementById("time-value");
const timeBonusValueEl = document.getElementById("timebonus-value");

const frame = document.getElementById("frame");
const touchControls = document.getElementById("touch-controls");
const btnLeft = document.getElementById("btn-left");
const btnRight = document.getElementById("btn-right");

// -------------------------------
// High Score
// -------------------------------
const HS_KEY = "emojiInvaderHighScore";
let highScore = Number.parseInt(localStorage.getItem(HS_KEY) || "0", 10) || 0;
updateHighScoreHUD();

function saveHighScoreIfNeeded() {
  if (state.score > highScore) {
    highScore = state.score;
    localStorage.setItem(HS_KEY, String(highScore));
    updateHighScoreHUD();
  }
}
function updateHighScoreHUD() {
  if (highValueEl) highValueEl.textContent = String(highScore).padStart(4, "0");
}

// -------------------------------
// Scaling (kept compatible with your current CSS)
// -------------------------------
function applyScale() {
  const padding = 12;
  const baseW = GAME_CONSTANTS.STAGE_WIDTH;
  const baseH = GAME_CONSTANTS.STAGE_HEIGHT + 56; // + HUD

  const vw = Math.max(320, window.innerWidth);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const touchControlsHeight = isMobile ? 80 : 0;

  const availableHeight = window.innerHeight - touchControlsHeight;
  const vh = Math.max(480, availableHeight);

  const scaleX = (vw - padding * 2) / baseW;
  const scaleY = (vh - padding * 2) / baseH;

  let scale;
  if (isMobile) {
    scale = Math.min(scaleX, scaleY, 0.9);
  } else {
    scale = Math.min(scaleX, scaleY);
  }

  scale = Math.max(scale, isMobile ? 0.4 : 0.3);

  document.documentElement.style.setProperty("--scale", String(scale));

  const finalW = baseW * scale;
  const finalH = baseH * scale;

  frame.style.width = `${finalW}px`;
  frame.style.height = `${finalH}px`;

  frame.style.margin = (vw < 480) ? '5px' : '10px';
}
window.addEventListener("resize", applyScale, { passive: true });

// -------------------------------
// Utilities
// -------------------------------
let uidCounter = 0;
function uid(prefix){ uidCounter += 1; return `${prefix}-${uidCounter}`; }
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
function now(){ return performance.now(); }

function createSprite(emoji, classNames = []) {
  const el = document.createElement("div");
  el.classList.add("sprite", ...classNames);
  el.textContent = emoji;
  stage.appendChild(el);
  return el;
}
function removeSprite(el){ if(el && el.parentNode) el.parentNode.removeChild(el); }
function createFloatText(text,x,y){
  const el = document.createElement("div");
  el.className="fx-float"; el.textContent=text;
  el.style.left=`${x}px`; el.style.top=`${y}px`;
  stage.appendChild(el); setTimeout(()=>el.remove(), 650);
}
function rectsOverlap(a,b){
  return !(a.right<b.left || a.left>b.right || a.bottom<b.top || a.top>b.bottom);
}

// Time helpers
function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function computeTimeBonus(msElapsed) {
  if (msElapsed <= TIME_BONUS_GRACE_MS) return TIME_BONUS_MAX;
  const over = (msElapsed - TIME_BONUS_GRACE_MS) / 1000; // seconds beyond grace
  const decayed = TIME_BONUS_MAX - Math.floor(over * TIME_BONUS_DECAY_PER_SEC);
  return Math.max(0, decayed);
}

// -------------------------------
// State
// -------------------------------
const state = {
  running: false,
  gameOver: false,
  score: 0,
  lives: GAME_CONSTANTS.PLAYER_INITIAL_LIVES,

  player: {
    id: uid("player"), x: GAME_CONSTANTS.STAGE_WIDTH/2, y: GAME_CONSTANTS.STAGE_HEIGHT-80,
    width: 32, height: 32, facing: "right",
    canShootAfter: 0, hasBonus: false, bonusEndsAt: 0, el: null,
  },

  projectiles: [], // {id,x,y,w,h,vx,vy,source,el}
  enemies: [],     // {id,x,y,w,h,type,el, nextBurstAt?, burstLeft?, nextShotAt?}
  barriers: [],    // {id,x,y,w,h,hp,emojiIndex,el}

  enemyMarchDirection: 1,
  enemyNextMoveAt: 0,
  lastFrameTime: 0,

  // Time tracking
  startTimeMs: 0,
};

// -------------------------------
// Input: Keyboard + Touch (auto-fire always on)
// -------------------------------
const input = { left:false, right:false };

window.addEventListener("keydown",(e)=>{
  if (e.key==="ArrowLeft" || e.key.toLowerCase()==="a") input.left=true;
  if (e.key==="ArrowRight"|| e.key.toLowerCase()==="d") input.right=true;
});
window.addEventListener("keyup",(e)=>{
  if (e.key==="ArrowLeft" || e.key.toLowerCase()==="a") input.left=false;
  if (e.key==="ArrowRight"|| e.key.toLowerCase()==="d") input.right=false;
});

// Touch buttons (if present)
function bindHold(button, onDown, onUp){
  const down = (ev)=>{ ev.preventDefault(); onDown(); };
  const up = (ev)=>{ ev.preventDefault(); onUp(); };
  ["pointerdown","touchstart","mousedown"].forEach(evt => button?.addEventListener(evt, down));
  ["pointerup","pointercancel","touchend","touchcancel","mouseup","mouseleave"].forEach(evt => button?.addEventListener(evt, up));
}
if (btnLeft && btnRight) {
  touchControls && (touchControls.hidden = false);
  bindHold(btnLeft, ()=>input.left=true, ()=>input.left=false);
  bindHold(btnRight, ()=>input.right=true, ()=>input.right=false);
}

// Replay
btnReplay?.addEventListener("click", () => {
  overlay.hidden = true;
  resetGame();
});

// -------------------------------
// Init / Reset
// -------------------------------
function positionSprite(el,x,y){ el.style.left=`${Math.round(x)}px`; el.style.top=`${Math.round(y)}px`; }

function resetGame(){
  stage.innerHTML="";

  state.running = true; state.gameOver = false; state.score = 0;
  state.lives = GAME_CONSTANTS.PLAYER_INITIAL_LIVES;
  state.projectiles = []; state.enemies = []; state.barriers = [];
  state.enemyMarchDirection = 1;
  state.enemyNextMoveAt = now() + GAME_CONSTANTS.ENEMY_MOVE_INTERVAL_MS;
  state.player.x = GAME_CONSTANTS.STAGE_WIDTH/2;
  state.player.y = GAME_CONSTANTS.STAGE_HEIGHT-80;
  state.player.facing="right"; state.player.canShootAfter=0;
  state.player.hasBonus=false; state.player.bonusEndsAt=0;

  // Time start
  state.startTimeMs = now();
  if (timeValueEl) timeValueEl.textContent = "00:00";
  if (timeBonusValueEl) timeBonusValueEl.textContent = String(TIME_BONUS_MAX);

  updateScore(0);
  if (livesValueEl) livesValueEl.textContent = String(state.lives);
  if (bonusIndicator) bonusIndicator.hidden = true;

  state.player.el = createSprite(GAME_CONSTANTS.PLAYER_EMOJI, ["facing-right"]);
  positionSprite(state.player.el, state.player.x, state.player.y);

  spawnEnemyGrid();
  spawnBarriers();

  overlay.setAttribute("data-state", "intro"); // fades quickly by CSS
  if (overlaySubtitle) overlaySubtitle.textContent = "Loading…";
  if (btnReplay) btnReplay.hidden = true;
  overlay.hidden = false;

  state.lastFrameTime = now();
  requestAnimationFrame(gameLoop);
}

// -------------------------------
// Enemies & Barriers
// -------------------------------
function spawnEnemyGrid(){
  const C = GAME_CONSTANTS;
  const cols=C.ENEMY_GRID_COLUMNS, rows=C.ENEMY_GRID_ROWS, dx=C.ENEMY_X_SPACING, dy=C.ENEMY_Y_SPACING;
  const gridWidth = (cols - 1) * dx;
  const startX = (C.STAGE_WIDTH - gridWidth) / 2;

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const specialRow = r <= 1;
      const isSpecial = specialRow && Math.random() < 0.55;
      const type = isSpecial ? (Math.random()<0.5 ? "ghost" : "squid") : "basic";
      const emoji = (type==="basic") ? C.ENEMY_BASIC_EMOJI : (type==="ghost" ? "👻" : "🐙");
      const enemy = {
        id: uid("enemy"),
        x: startX + c*dx,
        y: C.ENEMY_TOP_OFFSET + r*dy,
        w: 32, h: 32,
        type,
        el: createSprite(emoji),
      };
      if (type !== "basic") { // special burst timers
        enemy.nextBurstAt = now() + 1200 + Math.random()*800;
        enemy.burstLeft = 0;
        enemy.nextShotAt = 0;
      }
      positionSprite(enemy.el, enemy.x, enemy.y);
      state.enemies.push(enemy);
    }
  }
}

function spawnBarriers(){
  const C = GAME_CONSTANTS;
  const marginX = 60;
  const usable = C.STAGE_WIDTH - marginX*2;
  const spacing = usable / (C.BARRIERS_COUNT - 1);

  for(let i=0;i<C.BARRIERS_COUNT;i++){
    const baseX = marginX + i*spacing - 16;
    for(let r=0;r<C.BARRIER_ROWS;r++){
      const x = baseX;
      const y = C.STAGE_HEIGHT - 240 - r*34;
      const emojiIndex = Math.floor(Math.random()*C.BARRIER_EMOJIS.length);
      const barrier = {
        id: uid("barrier"), x, y, w: 32, h: 32,
        hp: C.BARRIER_HP, emojiIndex,
        el: createSprite(C.BARRIER_EMOJIS[emojiIndex]),
      };
      applyBarrierHighlight(barrier);
      positionSprite(barrier.el, barrier.x, barrier.y);
      state.barriers.push(barrier);
    }
  }
}
function applyBarrierHighlight(barrier){
  const ratio = barrier.hp / GAME_CONSTANTS.BARRIER_HP;
  let glow = "0 0 0 rgba(0,0,0,0)";
  if (ratio > 0.66) glow = "0 0 10px rgba(50, 255, 120, 0.65)";
  else if (ratio > 0.33) glow = "0 0 10px rgba(255, 235, 80, 0.8)";
  else glow = "0 0 10px rgba(255, 80, 80, 0.9)";
  barrier.el.style.filter =
    "drop-shadow(0 2px 0 rgba(0,0,0,0.3)) drop-shadow(0 6px 10px rgba(0,0,0,0.5))";
  barrier.el.style.textShadow = glow;
}

// -------------------------------
// Game Loop
// -------------------------------
function gameLoop(t){
  if (!state.running) return;
  const dtMs = t - state.lastFrameTime; state.lastFrameTime = t;

  // Live time & time-bonus HUD
  const elapsed = now() - state.startTimeMs;
  if (timeValueEl) timeValueEl.textContent = formatTime(elapsed);
  if (timeBonusValueEl) timeBonusValueEl.textContent = String(computeTimeBonus(elapsed));

  updateBonusStatus();
  updatePlayer(dtMs);
  tryShootPlayer();
  updateEnemies();
  updateProjectiles(dtMs);
  detectCollisions();
  checkWinLose();

  if (state.running) requestAnimationFrame(gameLoop);
}

// -------------------------------
// Player
// -------------------------------
function updatePlayer(dtMs){
  const speed = GAME_CONSTANTS.PLAYER_MOVE_SPEED_PX_PER_SEC * (dtMs/1000);
  let dx = 0; if (input.left) dx -= speed; if (input.right) dx += speed;
  const minX=8, maxX=GAME_CONSTANTS.STAGE_WIDTH - 40;
  state.player.x = clamp(state.player.x + dx, minX, maxX);
  const newFacing = dx < 0 ? "left" : dx > 0 ? "right" : state.player.facing;
  if (newFacing !== state.player.facing){
    state.player.facing = newFacing;
    state.player.el.classList.remove("facing-left","facing-right");
    state.player.el.classList.add(newFacing==="left"?"facing-left":"facing-right");
  }
  positionSprite(state.player.el, state.player.x, state.player.y);
}

function tryShootPlayer(){
  const t = now();
  const cooldown = state.player.hasBonus ? GAME_CONSTANTS.PLAYER_BONUS_FIRE_COOLDOWN_MS
                                         : GAME_CONSTANTS.PLAYER_SHOT_COOLDOWN_MS;
  if (t >= state.player.canShootAfter){
    spawnProjectile("player", state.player.x + 8, state.player.y - 10, 0, -GAME_CONSTANTS.PRJ_SPEED_PLAYER,
      GAME_CONSTANTS.PLAYER_PROJECTILE_EMOJI, ["player-bullet","projectile"]);
    state.player.canShootAfter = t + cooldown;
  }
}

// -------------------------------
// Enemies
// -------------------------------
function updateEnemies(){
  const C = GAME_CONSTANTS;
  const time = now();
  if (time < state.enemyNextMoveAt) { updateSpecialBursts(time); return; }

  let willHitEdge = false;
  for (const e of state.enemies) {
    const nextX = e.x + C.ENEMY_STEP_PX * state.enemyMarchDirection;
    if (nextX < C.ENEMY_SIDE_PADDING || nextX > C.STAGE_WIDTH - C.ENEMY_SIDE_PADDING){ willHitEdge = true; break; }
  }

  if (willHitEdge) {
    for (const e of state.enemies) { e.y += C.ENEMY_DESCENT_PX; positionSprite(e.el, e.x, e.y); }
    state.enemyMarchDirection *= -1;
  } else {
    for (const e of state.enemies) { e.x += C.ENEMY_STEP_PX * state.enemyMarchDirection; positionSprite(e.el, e.x, e.y); }

    if (Math.random() < C.ENEMY_SHOT_CHANCE_PER_STEP) {
      const basics = state.enemies.filter(e => e.type === "basic");
      if (basics.length) {
        const shooter = basics[Math.floor(Math.random()*basics.length)];
        fireAimed(shooter, state.player.x + 12, state.player.y, C.PRJ_SPEED_BASIC);
      }
    }
  }

  updateSpecialBursts(time);

  const remaining = state.enemies.length;
  const total = C.ENEMY_GRID_COLUMNS * C.ENEMY_GRID_ROWS;
  const speedup = clamp((1 - remaining/total) * 240, 0, 240);
  state.enemyNextMoveAt = time + Math.max(130, C.ENEMY_MOVE_INTERVAL_MS - speedup);
}

function updateSpecialBursts(time){
  const C = GAME_CONSTANTS;
  for (const e of state.enemies) {
    if (e.type === "basic") continue;
    if (e.burstLeft > 0) {
      if (time >= e.nextShotAt) {
        const speed = (e.type === "ghost") ? C.PRJ_SPEED_GHOST : C.PRJ_SPEED_SQUID;
        spawnProjectile("enemy", e.x + 8, e.y + 18, 0, speed, C.ENEMY_PROJECTILE_EMOJI, ["projectile"]);
        e.burstLeft -= 1;
        e.nextShotAt = time + C.SPECIAL_SHOT_GAP_MS;
        if (e.burstLeft === 0) e.nextBurstAt = time + C.SPECIAL_RELOAD_MS + Math.random()*500;
      }
    } else if (time >= e.nextBurstAt) {
      e.burstLeft = C.SPECIAL_BURST_COUNT;
      e.nextShotAt = time;
    }
  }
}

function fireAimed(enemy, tx, ty, speed){
  const sx = enemy.x + 8, sy = enemy.y + 18;
  const vx = tx - sx, vy = ty - sy;
  const mag = Math.max(1, Math.hypot(vx, vy));
  const ux = (vx / mag) * speed;
  const uy = (vy / mag) * speed;
  spawnProjectile("enemy", sx, sy, ux, uy, GAME_CONSTANTS.ENEMY_PROJECTILE_EMOJI, ["projectile"]);
}

// -------------------------------
// Projectiles
// -------------------------------
function spawnProjectile(source, x, y, vx, vy, emoji, classNames){
  const el = createSprite(emoji, classNames);
  const p = { id: uid("prj"), x, y, w: 24, h: 24, vx, vy, source, el };
  positionSprite(el, x, y);
  state.projectiles.push(p);
}
function updateProjectiles(dtMs){
  const dt = dtMs / 1000;
  for (const p of state.projectiles) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    positionSprite(p.el, p.x, p.y);
  }
  state.projectiles = state.projectiles.filter((p)=>{
    const keep = p.x > -40 && p.x < GAME_CONSTANTS.STAGE_WIDTH + 40 &&
                 p.y > -60 && p.y < GAME_CONSTANTS.STAGE_HEIGHT + 60;
    if (!keep) removeSprite(p.el);
    return keep;
  });
}

// -------------------------------
// Collisions
// -------------------------------
function detectCollisions(){
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    const pRect = { left: p.x, right: p.x + p.w, top: p.y, bottom: p.y + p.h };

    if (p.source === "player") {
      for (let j = state.enemies.length - 1; j >= 0; j--) {
        const e = state.enemies[j];
        const eRect = { left: e.x, right: e.x + e.w, top: e.y, bottom: e.y + e.h };
        if (rectsOverlap(pRect, eRect)) {
          const special = e.type !== "basic";
          addScore(special ? GAME_CONSTANTS.SCORE_SPECIAL : GAME_CONSTANTS.SCORE_BASIC);
          spawnExplosionAtEnemy(e);
          createFloatText(special ? "+50" : "+10", e.x, e.y - 8);
          if (special) activateBonus();
          removeSprite(e.el); state.enemies.splice(j,1);
          removeSprite(p.el); state.projectiles.splice(i,1);
          break;
        }
      }
      if (state.projectiles[i]) {
        for (let b = state.barriers.length - 1; b >= 0; b--) {
          const barrier = state.barriers[b];
          const bRect = { left: barrier.x, right: barrier.x + barrier.w, top: barrier.y, bottom: barrier.y + barrier.h };
          if (rectsOverlap(pRect, bRect)) { damageBarrier(barrier, p); break; }
        }
      }
    } else {
      const pr = { left: state.player.x, right: state.player.x + state.player.width,
                   top: state.player.y, bottom: state.player.y + state.player.height };
      if (rectsOverlap(pRect, pr)) {
        removeSprite(p.el); state.projectiles.splice(i,1); harmPlayer(); continue;
      }
      for (let b = state.barriers.length - 1; b >= 0; b--) {
        const barrier = state.barriers[b];
        const bRect = { left: barrier.x, right: barrier.x + barrier.w, top: barrier.y, bottom: barrier.y + barrier.h };
        if (rectsOverlap(pRect, bRect)) { damageBarrier(barrier, p); break; }
      }
    }
  }
}

function spawnExplosionAtEnemy(enemy){
  const map = GAME_CONSTANTS.ENEMY_EXPLOSION_BY_TYPE;
  const em = enemy.type==="basic" ? map.basic : (enemy.type==="ghost" ? map.ghost : map.squid);
  const ex = createSprite(em); positionSprite(ex, enemy.x, enemy.y); setTimeout(()=>removeSprite(ex), 240);
}

function damageBarrier(barrier, projectile){
  barrier.hp -= 1;
  if (barrier.hp <= 0) {
    removeSprite(barrier.el);
    state.barriers = state.barriers.filter(b => b.id !== barrier.id);
  } else {
    applyBarrierHighlight(barrier);
  }
  removeSprite(projectile.el);
  state.projectiles = state.projectiles.filter(p => p.id !== projectile.id);
}

function harmPlayer(){
  state.lives -= 1; if (livesValueEl) livesValueEl.textContent = String(state.lives);
  state.player.el.style.filter = "hue-rotate(60deg) drop-shadow(0 0 8px rgba(255,0,0,0.6))";
  setTimeout(()=> state.player.el.style.filter = "", 120);
}

// -------------------------------
// Score / Bonus / Endgame
// -------------------------------
function updateScore(delta){ 
  state.score += delta; 
  if (scoreValueEl) scoreValueEl.textContent = state.score.toString().padStart(4,"0"); 
}
function addScore(points){ updateScore(points); }

function activateBonus(){
  state.player.hasBonus = true;
  state.player.bonusEndsAt = now() + GAME_CONSTANTS.BONUS_DURATION_MS;
  if (bonusIndicator) bonusIndicator.hidden = false;
}
function updateBonusStatus(){
  if (!state.player.hasBonus) return;
  if (now() >= state.player.bonusEndsAt){ 
    state.player.hasBonus=false; 
    if (bonusIndicator) bonusIndicator.hidden=true; 
  }
}

function checkWinLose(){
  for (const e of state.enemies) if (e.y >= state.player.y - 40) return endGame(false);
  if (state.lives <= 0) return endGame(false);
  if (state.enemies.length === 0) return endGame(true);
}

function endGame(victory){
  state.running=false; state.gameOver=true;

  // Award remaining time bonus on end
  const totalElapsed = now() - state.startTimeMs;
  const timeBonusAward = computeTimeBonus(totalElapsed);
  if (timeBonusAward > 0) {
    updateScore(timeBonusAward);
  }

  saveHighScoreIfNeeded();

  overlay.setAttribute("data-state", "end");
  overlay.hidden = false;

  const timeStr = formatTime(totalElapsed);
  const subtitleHTML = `
    Time: <strong>${timeStr}</strong>
    — Time Bonus: <strong>+${timeBonusAward}</strong><br>
    Final Score: <strong>${state.score}</strong>
    — High: <strong>${highScore}</strong>
  `;
  overlayTitle.textContent = victory ? "You Win! 🎉" : "Game Over 💀";
  if (overlaySubtitle) overlaySubtitle.innerHTML = subtitleHTML;
  if (btnReplay) btnReplay.hidden = false;
}

// -------------------------------
// Boot
// -------------------------------
(function boot(){
  stage.style.width = `${GAME_CONSTANTS.STAGE_WIDTH}px`;
  stage.style.height = `${GAME_CONSTANTS.STAGE_HEIGHT}px`;
  applyScale();

  overlay.hidden = false;
  overlay.setAttribute("data-state", "intro");
  if (overlayTitle) overlayTitle.textContent = "Emoji Space Invader";
  if (overlaySubtitle) overlaySubtitle.textContent = "Loading…";
  if (btnReplay) btnReplay.hidden = true;

  setTimeout(()=>{ resetGame(); }, 900);
})();
