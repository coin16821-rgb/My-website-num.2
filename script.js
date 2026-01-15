document.addEventListener('DOMContentLoaded', () => {
  const skillsButton = document.getElementById('skillsButton');
  if (skillsButton) {
    skillsButton.addEventListener('click', () => {
      alert(
        'Навыки:\n\n' +
        '• HTML/CSS/JavaScript\n' +
        '• Основы программирования\n' +
        '• Работа с Git\n' +
        '• Изучение AI и машинного обучения\n' +
        '• Веб-разработка\n\n' +
        'Постоянно изучаю новые технологии!'
      );
    });
  }

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', () => console.log('Форма отправлена'));
  }

  initSpaceBackground();
});

function initSpaceBackground() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  // ====== настройки ======
  const IMG_DIR = './';
  const EXT = '.png';

  // Nebula twinkle
  const NEBULA_MIN_OPACITY = 0.15;
  const NEBULA_MAX_OPACITY = 0.35;
  const NEBULA_TWINKLE_SPEED = 0.22;

  // FPS cap
  const FPS = 24;
  const FRAME_INTERVAL = 1000 / FPS;

  // Planet effects (per-object independent cycle)
  const PLANET_EFFECT_ORDER = ['spiral', 'explore', 'shrinkExit'];

  // remove old scene
  const oldScene = hero.querySelector('#spaceScene');
  if (oldScene) oldScene.remove();

  // scene
  const scene = document.createElement('div');
  scene.id = 'spaceScene';
  hero.appendChild(scene);

  const bgLayer = document.createElement('div');
  bgLayer.id = 'spaceBgLayer';
  Object.assign(bgLayer.style, {
    position: 'absolute',
    inset: '0',
    zIndex: '0',
    pointerEvents: 'none',
    willChange: 'transform',
    transform: 'translate3d(0,0,0) scale(1.08)'
  });
  scene.appendChild(bgLayer);

  // stars layer (CSS twinkle)
  const starLayer = document.createElement('div');
  Object.assign(starLayer.style, {
    position: 'absolute',
    inset: '0',
    zIndex: '1',
    pointerEvents: 'none',
    overflow: 'hidden'
  });
  scene.appendChild(starLayer);

  // objects layer
  const objLayer = document.createElement('div');
  objLayer.id = 'spaceObjLayer';
  Object.assign(objLayer.style, {
    position: 'absolute',
    inset: '0',
    zIndex: '2',
    pointerEvents: 'none'
  });
  scene.appendChild(objLayer);

  // sizes
  let W = 1, H = 1;
  function resize() {
    const rect = hero.getBoundingClientRect();
    W = Math.max(1, Math.floor(rect.width));
    H = Math.max(1, Math.floor(rect.height));
  }
  resize();
  window.addEventListener('resize', resize);

  // pointer
  let mouseX = W / 2, mouseY = H / 2;

  function setPointer(e) {
    const rect = hero.getBoundingClientRect();
    const p = e.touches?.[0] ?? e;
    mouseX = (p.clientX ?? rect.left) - rect.left;
    mouseY = (p.clientY ?? rect.top) - rect.top;
  }

  hero.addEventListener('pointermove', setPointer, { passive: true });
  hero.addEventListener('touchmove', setPointer, { passive: true });

  // utils
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const easeInOutSine = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

  // stars: CSS-only twinkle
  (function initStars() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes starTwinkle {
        0% { opacity: var(--o1); }
        100% { opacity: var(--o2); }
      }
    `;
    document.head.appendChild(style);

    const STAR_COUNT = 70;
    for (let i = 0; i < STAR_COUNT; i++) {
      const el = document.createElement('div');
      const size = rand(1, 2);
      const dur = rand(1.8, 5.2);
      const delay = rand(0, 2.5);
      const o1 = rand(0.10, 0.45);
      const o2 = rand(0.35, 0.85);

      Object.assign(el.style, {
        position: 'absolute',
        left: (Math.random() * 100) + '%',
        top: (Math.random() * 100) + '%',
        width: size + 'px',
        height: size + 'px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.95)',
        opacity: o1,
        animation: `starTwinkle ${dur}s ease-in-out ${delay}s infinite alternate`,
        pointerEvents: 'none'
      });

      el.style.setProperty('--o1', o1.toFixed(2));
      el.style.setProperty('--o2', o2.toFixed(2));
      starLayer.appendChild(el);
    }
  })();

  // ASSETS:
  // idleSpinMs — время полного оборота в спокойном состоянии (чем больше — тем медленнее)
  // сделано специально медленно
  const ASSETS = [
    // nebula
    { name: 'nebula1', type: 'nebula', size: 980, opacity: 0.28, x: 0.50, y: 0.45 },
    { name: 'nebula2', type: 'nebula', size: 900, opacity: 0.30, x: 0.22, y: 0.70 },
    { name: 'nebula3', type: 'nebula', size: 860, opacity: 0.32, x: 0.80, y: 0.25 },

    // galaxies
    { name: 'galaxy1', type: 'galaxy', size: 120, opacity: 0.85, x: 0.12, y: 0.55, idleSpinMs: 160000 },
    { name: 'galaxy2', type: 'galaxy', size: 70,  opacity: 0.52, x: 0.88, y: 0.65, idleSpinMs: 150000 },
    { name: 'galaxy3', type: 'galaxy', size: 160, opacity: 0.48, x: 0.62, y: 0.16, idleSpinMs: 180000 },
    { name: 'galaxy4', type: 'galaxy', size: 200, opacity: 0.45, x: 0.40, y: 0.78, idleSpinMs: 200000 },

    // planets
    { name: 'sun',     type: 'planet', size: 70,  opacity: 0.85, x: 0.82, y: 0.28, idleSpinMs: 120000 },
    { name: 'saturn',  type: 'planet', size: 330, opacity: 0.94, x: 0.18, y: 0.40, idleSpinMs: 200000 },
    { name: 'jupiter', type: 'planet', size: 280, opacity: 0.94, x: 0.74, y: 0.78, idleSpinMs: 180000 },
    { name: 'earth',   type: 'planet', size: 240, opacity: 0.95, x: 0.30, y: 0.20, idleSpinMs: 160000 },
    { name: 'venera',  type: 'planet', size: 210, opacity: 0.93, x: 0.88, y: 0.52, idleSpinMs: 170000 },
    { name: 'mars',    type: 'planet', size: 40,  opacity: 0.63, x: 0.24, y: 0.78, idleSpinMs: 100000 },
    { name: 'neptun',  type: 'planet', size: 230, opacity: 0.93, x: 0.08, y: 0.18, idleSpinMs: 190000 },
    { name: 'moon',    type: 'planet', size: 50,  opacity: 0.92, x: 0.65, y: 0.88, idleSpinMs: 140000 },
    { name: 'pluton',  type: 'planet', size: 160, opacity: 0.90, x: 0.92, y: 0.14, idleSpinMs: 210000 }
  ];

  function createSprite(asset) {
    const layer = asset.type === 'nebula' ? bgLayer : objLayer;

    const wrap = document.createElement('div');
    wrap.className = `space-sprite space-sprite--${asset.type}`;
    wrap.style.setProperty('--size', `${asset.size}px`);
    wrap.style.opacity = String(asset.opacity);

    const img = document.createElement('img');
    img.className = 'space-sprite__img';
    img.id = asset.name;
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'eager';
    img.draggable = false;
    img.src = `${IMG_DIR}${asset.name}${EXT}`;

    wrap.appendChild(img);
    layer.appendChild(wrap);

    const bx = clamp01(asset.x + rand(-0.02, 0.02));
    const by = clamp01(asset.y + rand(-0.02, 0.02));

    const idleSpinMs = Math.max(90000, asset.idleSpinMs ?? 160000);
    const dir = Math.random() < 0.5 ? 1 : -1;
    const spinBase = (2 * Math.PI) / (idleSpinMs / 1000) * dir;

    const sprite = {
      ...asset,
      wrap,
      img,
      bx,
      by,
      baseOpacity: asset.opacity,
      ready: false,

      // slow drifting
      floatAx: rand(3, 9),
      floatAy: rand(3, 9),
      floatFx: rand(0.04, 0.10),
      floatFy: rand(0.04, 0.10),
      phx: rand(0, Math.PI * 2),
      phy: rand(0, Math.PI * 2),

      currX: null,
      currY: null,

      angle: 0,
      spinBase,

      effect: null,
      explore: null,

      // per-object sequence index (planets)
      effectIndex: 0,

      // nebula twinkle
      twPhase: asset.type === 'nebula' ? rand(0, Math.PI * 2) : 0
    };

    img.addEventListener('load', () => {
      sprite.ready = true;
      hero.classList.add('space-ready');
      // initial place
      sprite.currX = sprite.bx * W;
      sprite.currY = sprite.by * H;
    });

    img.addEventListener('error', () => {
      sprite.ready = false;
      wrap.style.display = 'none';
    });

    return sprite;
  }

  const sprites = ASSETS.map(createSprite);

  function startGalaxySpin(sprite, t) {
    sprite.effect = {
      type: 'galaxySpin',
      start: t,
      duration: 5,
      boost: -12.0 // CCW
    };
  }

  function startPlanetNext(sprite, t) {
    const type = PLANET_EFFECT_ORDER[sprite.effectIndex % PLANET_EFFECT_ORDER.length];
    sprite.effectIndex++;

    if (type === 'spiral') {
      sprite.effect = {
        type: 'spiral',
        start: t,
        duration: 12,
        originX: sprite.currX ?? (sprite.bx * W),
        originY: sprite.currY ?? (sprite.by * H),
        baseAngle: Math.random() * Math.PI * 2,
        dir: Math.random() < 0.5 ? 1 : -1,
        turns: 4,
        radius: 75 // ~4см диаметр ≈ 150px
      };
      return;
    }

    if (type === 'explore') {
      sprite.explore = {
        x: sprite.currX ?? (sprite.bx * W),
        y: sprite.currY ?? (sprite.by * H),
        tx: rand(60, W - 60),
        ty: rand(60, H - 60),
        nextSwitch: t + rand(0.7, 1.6)
      };
      sprite.effect = { type: 'explore', start: t, duration: 30 };
      return;
    }

    if (type === 'shrinkExit') {
      const startX = sprite.currX ?? (sprite.bx * W);
      const startY = sprite.currY ?? (sprite.by * H);

      const ang = Math.random() * Math.PI * 2;
      const dirX = Math.cos(ang);
      const dirY = Math.sin(ang);

      const sides = ['top', 'right', 'bottom', 'left'];
      const exitSide = sides[Math.floor(Math.random() * sides.length)];
      const enterSide = sides[Math.floor(Math.random() * sides.length)];

      function offscreen(side) {
        if (side === 'top') return { x: rand(60, W - 60), y: -sprite.size * 2 };
        if (side === 'bottom') return { x: rand(60, W - 60), y: H + sprite.size * 2 };
        if (side === 'left') return { x: -sprite.size * 2, y: rand(60, H - 60) };
        return { x: W + sprite.size * 2, y: rand(60, H - 60) };
      }

      const exitP = offscreen(exitSide);
      const enterP = offscreen(enterSide);

      sprite.effect = {
        type: 'shrinkExit',
        start: t,
        duration: 15,
        startX,
        startY,
        dirX,
        dirY,
        midDist: Math.min(W, H) * 0.35,
        exitX: exitP.x,
        exitY: exitP.y,
        enterX: enterP.x,
        enterY: enterP.y
      };
    }
  }

  // stable click: choose nearest sprite
  hero.addEventListener(
    'pointerdown',
    (e) => {
      // don't break UI elements
      if (e.target.closest('button, a, input, textarea, form, label')) return;

      setPointer(e);

      let best = null;
      let bestD = Infinity;

      for (const s of sprites) {
        if (!s.ready) continue;
        if (s.type === 'nebula') continue;

        const cx = s.currX ?? (s.bx * W);
        const cy = s.currY ?? (s.by * H);
        const d = Math.hypot(mouseX - cx, mouseY - cy);

        // big hit radius for reliable clicks
        const hitR = Math.max(70, s.size * 0.9);
        if (d <= hitR && d < bestD) {
          best = s;
          bestD = d;
        }
      }

      if (!best) return;

      const t = performance.now() / 1000;

      // independent effects per object
      if (best.type === 'galaxy') startGalaxySpin(best, t);
      if (best.type === 'planet') startPlanetNext(best, t);
    },
    { capture: true }
  );

  // background parallax (light)
  let bgTx = 0, bgTy = 0;
  function updateBgParallax(t) {
    const nx = (mouseX / Math.max(1, W)) - 0.5;
    const ny = (mouseY / Math.max(1, H)) - 0.5;

    const targetX = -nx * 14 + Math.sin(t * 0.05) * 2.5;
    const targetY = -ny * 9 + Math.cos(t * 0.05) * 2.0;

    const smooth = 0.06;
    bgTx += (targetX - bgTx) * smooth;
    bgTy += (targetY - bgTy) * smooth;

    bgLayer.style.transform = `translate3d(${bgTx}px, ${bgTy}px, 0) scale(1.08)`;
  }

  // main loop
  let lastFrame = 0;

  function tick(now) {
    if (document.hidden) {
      requestAnimationFrame(tick);
      return;
    }

    if (now - lastFrame < FRAME_INTERVAL) {
      requestAnimationFrame(tick);
      return;
    }

    const dt = lastFrame === 0 ? 1 / FPS : Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    const t = now / 1000;

    updateBgParallax(t);

    // nebula twinkle
    for (const s of sprites) {
      if (!s.ready || s.type !== 'nebula') continue;
      const osc = (Math.sin(t * NEBULA_TWINKLE_SPEED + s.twPhase) + 1) * 0.5;
      const op = NEBULA_MIN_OPACITY + (NEBULA_MAX_OPACITY - NEBULA_MIN_OPACITY) * osc;
      s.wrap.style.opacity = op.toFixed(3);

      // keep position stable (optional)
      const x = s.bx * W;
      const y = s.by * H;
      const tx = x - s.size / 2;
      const ty = y - s.size / 2;
      s.wrap.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    }

    for (const s of sprites) {
      if (!s.ready) continue;
      if (s.type === 'nebula') continue;

      // idle drift
      let x = s.bx * W + Math.sin(t * s.floatFx + s.phx) * s.floatAx;
      let y = s.by * H + Math.cos(t * s.floatFy + s.phy) * s.floatAy;

      let scale = 1;
      let spinSpeed = s.spinBase;

      if (s.effect) {
        const eff = s.effect;
        const et = (t - eff.start) / eff.duration;

        if (et >= 1 || et < 0) {
          s.effect = null;
          s.explore = null;
        } else if (eff.type === 'galaxySpin') {
          spinSpeed = s.spinBase + eff.boost * Math.sin(et * Math.PI);
        } else if (eff.type === 'spiral') {
          const k = easeInOutSine(et);
          const angle = eff.baseAngle + eff.dir * (eff.turns * 2 * Math.PI * et);
          const radius = eff.radius * k;
          x = eff.originX + Math.cos(angle) * radius;
          y = eff.originY + Math.sin(angle) * radius;
        } else if (eff.type === 'explore') {
          if (!s.explore) {
            s.explore = {
              x: s.currX ?? x,
              y: s.currY ?? y,
              tx: rand(60, W - 60),
              ty: rand(60, H - 60),
              nextSwitch: t + rand(0.7, 1.6)
            };
          }

          if (t > s.explore.nextSwitch) {
            s.explore.tx = rand(60, W - 60);
            s.explore.ty = rand(60, H - 60);
            s.explore.nextSwitch = t + rand(0.7, 1.6);
          }

          const follow = 0.05;
          s.explore.x += (s.explore.tx - s.explore.x) * follow;
          s.explore.y += (s.explore.ty - s.explore.y) * follow;

          x = s.explore.x;
          y = s.explore.y;

          const tt = t - eff.start;
          scale = 0.85 + 0.35 * (0.5 + 0.5 * Math.sin(tt * 0.9));
          spinSpeed = Math.abs((2 * Math.PI) / 1.1); // fast CW
        } else if (eff.type === 'shrinkExit') {
          if (et < 0.45) {
            const p = et / 0.45;
            x = eff.startX + eff.dirX * eff.midDist * p;
            y = eff.startY + eff.dirY * eff.midDist * p;
            scale = 1 - p;
          } else if (et < 0.55) {
            const p = (et - 0.45) / 0.10;
            const midX = eff.startX + eff.dirX * eff.midDist;
            const midY = eff.startY + eff.dirY * eff.midDist;
            x = midX + (eff.exitX - midX) * p;
            y = midY + (eff.exitY - midY) * p;
            scale = 0;
          } else {
            const p = (et - 0.55) / 0.45;
            x = eff.enterX + (eff.startX - eff.enterX) * p;
            y = eff.enterY + (eff.startY - eff.enterY) * p;
            scale = p;
          }
        }
      }

      // smooth position
      const smoothPos = 0.10;
      if (s.currX == null) {
        s.currX = x;
        s.currY = y;
      } else {
        s.currX += (x - s.currX) * smoothPos;
        s.currY += (y - s.currY) * smoothPos;
      }

      // slow spin always, fast only in effect
      s.angle += spinSpeed * dt;

      const tx = s.currX - s.size / 2;
      const ty = s.currY - s.size / 2;

      // wrapper only translate
      s.wrap.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      // img rotate+scale
      s.img.style.transform = `rotate(${s.angle}rad) scale(${scale})`;

      // keep base opacity (effects could change it in future)
      s.wrap.style.opacity = String(s.baseOpacity);
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
