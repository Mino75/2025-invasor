// styles.js — responsive scale + touch UI + correction mobile

(function injectStyles() {
  const css = `
    :root {
      --base-stage-width: 720;
      --base-stage-height: 700;
      --base-hud-height: 56;
      --scale: 1;

      --stage-width: calc(var(--base-stage-width) * 1px);
      --stage-height: calc(var(--base-stage-height) * 1px);
      --hud-height: calc(var(--base-hud-height) * 1px);

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
      height: 100vh; 
      margin: 0; 
      padding: 0;
      background: #050a16; 
      color: var(--ui-text);
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji";
      touch-action: manipulation;
      
      /* CORRECTION: Retirer position fixed qui cause des problèmes */
      overflow: hidden;
      
      /* Force le navigateur à respecter notre mise à l'échelle */
      -webkit-text-size-adjust: none;
      -moz-text-size-adjust: none;
      -ms-text-size-adjust: none;
      text-size-adjust: none;
    }
    
    body {
      /* CORRECTION: Utiliser flex au lieu de position fixed */
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      min-height: 100dvh; /* Dynamic viewport height pour mobile */
    }
    
    #frame {
      /* CORRECTION: Simplifier le positionnement */
      position: relative;
      
      /* Dimensions calculées par le JavaScript */
      width: calc(var(--base-stage-width) * var(--scale) * 1px);
      height: calc((var(--base-hud-height) + var(--base-stage-height)) * var(--scale) * 1px);
      
      display: grid; 
      grid-template-rows: var(--hud-height) var(--stage-height); 
      place-items: start center;
      
      /* CORRECTION: Ajout de marges pour éviter le débordement */
      margin: 10px;
    }

    /* CORRECTION: Supprimer les transforms scale sur hud et stage */
    #hud {
      width: var(--stage-width); 
      height: var(--hud-height);
      display: flex; 
      align-items: center; 
      justify-content: space-between;
      padding: 8px 12px; 
      font-size: var(--hud-font-size);
      background: rgba(10,15,30,0.6);
      border: 1px solid rgba(255,255,255,0.08); 
      border-radius: 12px 12px 0 0;
      backdrop-filter: blur(4px); 
      z-index: var(--z-hud);
    }
    
    #hud .dot { margin: 0 8px; color: var(--ui-dim); }
    #hud #score-label, #hud #lives-label, #high-label { color: var(--ui-dim); margin-right: 6px; }
    #score-value, #lives-value, #high-value { min-width: 48px; display: inline-block; text-align: right; letter-spacing: 1px; }
    #bonus-indicator { color: var(--bonus); font-weight: 700; }

    #game-stage {
      width: var(--stage-width); 
      height: var(--stage-height); 
      position: relative; 
      overflow: hidden;
      background: var(--stage-bg); 
      border: 1px solid rgba(255,255,255,0.08);
      border-top: none; 
      border-radius: 0 0 12px 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6), inset 0 0 120px rgba(90,130,255,0.08);
      font-size: 0;
    }

    /* Overlay (intro fades quickly; endgame shows replay button) */
    #overlay {
      position: absolute; inset: 0; display: grid; place-items: center;
      background: rgba(2,6,14,0.72); z-index: var(--z-overlay);
    }
    #overlay[data-state="intro"] { animation: fadeOut 800ms ease 900ms forwards; }
    @keyframes fadeOut { to { opacity: 0; visibility: hidden; } }

    #overlay-content { text-align: center; max-width: 680px; padding: 24px; }
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

    /* Touch controls: CORRECTION - meilleur positionnement */
    #touch-controls {
      position: fixed; 
      left: 0; 
      right: 0; 
      bottom: env(safe-area-inset-bottom, 0);
      display: none; /* Caché par défaut */
      gap: 12px; 
      justify-content: space-between;
      padding: 10px 14px;
      background: linear-gradient(180deg, rgba(3,6,16,0) 0%, rgba(3,6,16,0.7) 40%, rgba(3,6,16,0.85) 100%);
      z-index: 9999; 
      backdrop-filter: blur(6px);
    }
    
    #touch-controls button {
      flex: 1; 
      padding: 14px 10px; 
      font-size: clamp(16px, 4.5vw, 22px);
      color: white; 
      background: rgba(120,150,255,0.25);
      border: 1px solid rgba(180,200,255,0.25); 
      border-radius: 14px;
      touch-action: manipulation; 
      -webkit-tap-highlight-color: transparent;
    }
    
    /* CORRECTION: Media query plus précise */
    @media (max-width: 860px) { 
      #touch-controls { 
        display: flex; 
      }
      
      /* CORRECTION: Ajuster body pour les contrôles tactiles */
      body {
        padding-bottom: 80px; /* Espace pour les contrôles */
      }
    }
    
    /* CORRECTION: Gestion spéciale pour très petits écrans */
    @media (max-width: 480px) {
      #frame {
        margin: 5px;
      }
    }
  `;
  const style = document.createElement('style');
  style.setAttribute('data-origin', 'emoji-invader-styles');
  style.textContent = css;
  document.head.appendChild(style);
})();
