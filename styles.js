// styles.js — responsive layout + visual styles
(function injectStyles() {
  const css = `
    :root {
      --base-stage-width: 720;
      --base-stage-height: 700;
      --base-hud-height: 56;
      --scale: 1;

      --stage-bg: radial-gradient(ellipse at 50% 20%, #0b1324 0%, #060a15 60%, #03060d 100%);
      --z-stage: 1; --z-hud: 2; --z-overlay: 3;
      --ui-text: #dbe6ff; --ui-dim: #9db0d8; --accent: #6ee7ff; --bonus: #a7ff6e;

      --sprite-font-size: calc(28px * var(--scale));
      --projectile-font-size: calc(24px * var(--scale));
      --hud-font-size: calc(14px * var(--scale));
      --overlay-title-size: calc(22px * var(--scale));
      --overlay-subtitle-size: calc(16px * var(--scale));
    }

    * { box-sizing: border-box; }

    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
      background: #050a16;
      color: var(--ui-text);
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji";
      touch-action: manipulation;
      overflow: hidden;

      -webkit-text-size-adjust: none;
      -moz-text-size-adjust: none;
      -ms-text-size-adjust: none;
      text-size-adjust: none;
    }

    /* Frame gets the final scaled width/height; content inside is scaled by #scaler */
    #frame {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);

      width: calc(var(--base-stage-width) * var(--scale) * 1px);
      height: calc((var(--base-hud-height) + var(--base-stage-height)) * var(--scale) * 1px);

      /* No padding here—padding would cause visible offset on mobile */
      display: block;
    }

    @media (max-width: 860px) {
      #frame {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        transform: none;

        width: 100vw;
        height: 100vh;
        max-width: 100vw;
        max-height: 100vh;
      }
    }

    /* Single scale application (fixes the offset): scale both HUD and Stage together */
    #scaler {
      position: relative;
      width: calc(var(--base-stage-width) * 1px);
      height: calc((var(--base-hud-height) + var(--base-stage-height)) * 1px);
      transform-origin: top left;
      transform: scale(var(--scale));
    }

    /* No transforms on #hud / #game-stage individually anymore */
    #hud {
      position: relative;
      width: 100%;
      height: calc(var(--base-hud-height) * 1px);

      display: flex;
      align-items: center;
      justify-content: space-between;

      /* Labels readable: never too small */
      font-size: clamp(14px, calc(16px / var(--scale)), 22px);

      padding: 8px 12px;
      background: rgba(10,15,30,0.6);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px 12px 0 0;
      backdrop-filter: blur(4px);
      z-index: var(--z-hud);
    }

    #hud .dot {
      margin: 0 8px;
      color: var(--ui-dim);
    }

    /* Labels slightly smaller than numbers */
    #score-label, #lives-label, #high-label {
      color: var(--ui-dim);
      margin-right: 6px;
      font-weight: 500;
    }

    /* Score/Lives/High values — scale but keep a readable minimum */
    /* Numeric HUD values — include Time & Time Bonus too */
    #score-value, #lives-value, #high-value, #time-value, #timebonus-value {
      min-width: 56px;
      display: inline-block;
      text-align: right;
      letter-spacing: 1px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;

      /* readable minimum even when the whole game is scaled down */
      font-size: clamp(16px, calc(20px / var(--scale)), 28px);
      text-shadow: 0 1px 0 rgba(0,0,0,0.7);
    }

    #bonus-indicator {
      color: var(--bonus);
      font-weight: 700;
    }

    #game-stage {
      position: relative;
      width: calc(var(--base-stage-width) * 1px);
      height: calc(var(--base-stage-height) * 1px);
      overflow: hidden;
      background: var(--stage-bg);
      border: 1px solid rgba(255,255,255,0.08);
      border-top: none;
      border-radius: 0 0 12px 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6), inset 0 0 120px rgba(90,130,255,0.08);
      font-size: 0;
      z-index: var(--z-stage);
    }

    /* Overlay spans the scaled content area */
    #overlay {
      position: absolute;
      top: 0; left: 0;
      width: calc(var(--base-stage-width) * 1px);
      height: calc((var(--base-hud-height) + var(--base-stage-height)) * 1px);
      display: grid; place-items: center;
      background: rgba(2,6,14,0.72);
      z-index: var(--z-overlay);
      pointer-events: none;
    }
    #overlay[data-state="intro"] { animation: fadeOut 800ms ease 900ms forwards; }
    @keyframes fadeOut { to { opacity: 0; visibility: hidden; } }

    #overlay-content { text-align: center; max-width: 90%; padding: 24px; pointer-events: auto; }
    #overlay-title { margin: 0 0 8px; font-size: var(--overlay-title-size); letter-spacing: 1px; }
    #overlay-subtitle { margin: 0 10px 16px; color: var(--accent); font-size: var(--overlay-subtitle-size); }
    #overlay .help { margin: 6px 0; color: var(--ui-dim); font-size: calc(13px * var(--scale)); }

    #btn-replay {
      margin-top: 10px; padding: 10px 16px;
      font-size: calc(16px * var(--scale));
      color: #0b1222; background: #a7ff6e; border: none; border-radius: 12px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.35);
    }

    .sprite {
      position: absolute; transform-origin: center; user-select: none; pointer-events: none;
      font-size: var(--sprite-font-size); line-height: 1;
      filter: drop-shadow(0 2px 0 rgba(0,0,0,0.3)) drop-shadow(0 6px 10px rgba(0,0,0,0.5));
    }
    .projectile { font-size: var(--projectile-font-size); }
    .facing-right { transform: rotateY(0deg); }
    .facing-left { transform: rotateY(180deg); }
    .player-bullet { transform: rotate(90deg); }

    .fx-float {
      position: absolute; color: #bfe3ff; font-size: calc(12px * var(--scale)); opacity: 0.9;
      animation: rise 700ms ease-out forwards; pointer-events: none; text-shadow: 0 1px 0 rgba(0,0,0,0.5);
    }
    @keyframes rise { from { transform: translateY(0); opacity: 0.9; } to { transform: translateY(-24px); opacity: 0; } }

    #game-stage::after {
      content: ""; position: absolute; inset: 0;
      background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 100% 3px; mix-blend-mode: soft-light; pointer-events: none;
    }

/* Joystick canvas (centered bottom on mobile) */
@media (max-width: 860px) {
  #joystick-canvas{
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    right: auto;
    bottom: 12px;
    width: clamp(140px, 35vw, 220px);
    height: clamp(140px, 35vw, 220px);
    z-index: var(--z-hud);
    pointer-events: auto;
    background: transparent;
    touch-action: none;
    opacity: 0.95;
  }
}

/* Keep bottom-right on desktop (optional) */
@media (min-width: 861px) {
  #joystick-canvas{
    position: absolute;
    right: 12px;
    bottom: 12px;
    width: clamp(120px, 22vw, 180px);
    height: clamp(120px, 22vw, 180px);
    z-index: var(--z-hud);
    pointer-events: auto;
    background: transparent;
    touch-action: none;
    opacity: 0.9;
  }
}


  `;
  const style = document.createElement('style');
  style.setAttribute('data-origin', 'emoji-invader-styles');
  style.textContent = css;
  document.head.appendChild(style);
})();

