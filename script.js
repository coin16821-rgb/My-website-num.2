// ====== Основная логика страницы + космический фон (облегчённая версия) ======
document.addEventListener('DOMContentLoaded', () => {
  // Кнопка "Мои навыки"
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

  // Форма
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', () => {
      console.log('Форма отправлена');
    });
  }

  // Космос
  initSpaceBackground();
});

function initSpaceBackground() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  // ==== ПУТЬ К ИЗОБРАЖЕНИЯМ (все .png) ====
  // Если картинки в той же папке, что index.html:
  //   const IMG_DIR = './';
  // Если в ./img/:
  //   const IMG_DIR = './img/';
  const IMG_DIR = './';
  const EXT = '.png';

  // ==== ПАРАМЕТРЫ МЕРЦАНИЯ НЕБУЛ ====
  const NEBULA_MIN_OPACITY = 0.15;
  const NEBULA_MAX_OPACITY = 0.35;
  const NEBULA_TWINKLE_SPEED = 0.22; // 0.1 – медленнее, 0.4 – быстрее

  // ==== ПОСЛЕДОВАТЕЛЬНОСТЬ ДЕЙСТВИЙ ДЛЯ ПЛАНЕТ ====
  // 1 -> 2 -> 3 -> 1 -> ...
  const PLANET_EFFECT_ORDER = ['spiral', 'explore', 'shrinkExit'];
  let planetNextEffectIndex = 0;

  // Если скрипт вызовут повторно — убираем старую сцену
  const oldScene = hero.querySelector('#spaceScene');
  if (oldScene) oldScene.remove();

  // ---------- DOM: сцена и слои ----------
  const scene = document.createElement('div');
  scene.id = 'spaceScene';
  hero.appendChild(scene);

  const bgLayer = document.createElement('div');
  bgLayer.id = 'spaceBgLayer';
  Object.assign(bgLayer.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '0',
    willChange: 'transform',
    transform: 'translate3d(0,0,0) scale(1.08)'
  });
  scene.appendChild(bgLayer);

  // Слой звёзд (маленькие div'ы)
  const starLayer = document.createElement('div');
  Object.assign(starLayer.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '1',
    overflow: 'hidden'
  });
  scene.appendChild(starLayer);

  const objLayer = document.createElement('div');
  objLayer.id = 'spaceObjLayer';
  Object.assign(objLayer.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '2'
  });
  scene.appendChild(objLayer);

  // ---------- Размеры hero ----------
  let W = 0, H = 0;
  function resize() {
    const rect = hero.getBoundingClientRect();
    W = Math.max(1, Math.floor(rect.width));
    H = Math.max(1, Math.floor(rect.height));
  }
  resize();
  window.addEventListener('resize', resize);

  // ---------- Позиция указателя ----------
  let mouseX = W / 2, mouseY = H / 2;

  function setPointer(clientX, clientY) {
    const rect = hero.getBoundingClientRect();
    mouseX = clientX - rect.left;
    mouseY = clientY - rect.top;
  }

  document.addEventListener('mousemove', (e) => setPointer(e.clientX, e.clientY), { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!e.touches || !e.touches[0]) return;
    setPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  // ---------- Утилиты ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  // ---------- Фоновые звёзды (мерцание) ----------
  const bgStars = [];

  function initStars() {
    const STAR_COUNT = 60; // немного звёзд, чтобы не грузить
    for (let i = 0; i < STAR_COUNT; i++) {
      const s = document.createElement('div');
      const size = rand(1, 2); // px
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const baseOpacity = rand(0.25, 0.7);
      Object.assign(s.style, {
        position: 'absolute',
        left: x + '%',
        top: y + '%',
        width: size + 'px',
        height: size + 'px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        opacity: baseOpacity.toFixed(2),
        pointerEvents: 'none',
        transition: 'opacity 0.6s ease-out'
      });
      starLayer.appendChild(s);
      bgStars.push({
        el: s,
        baseOpacity,
        tw: rand(0.3, 0.9),
        ph: Math.random() * Math.PI * 2
      });
    }
  }
  initStars();

  function updateStars(t) {
    for (const s of bgStars) {
      const v = 0.6 + 0.4 * Math.sin(t * s.tw + s.ph); // 0.2..1.0
      const op = s.baseOpacity * v;
      s.el.style.opacity = op.toFixed(2);
    }
  }

  // ---------- Описание объектов ----------
  // spinPeriod — период полного оборота (сек) в спокойном состоянии
  const ASSETS = [
    // Туманности (фон, не кликаются)
    { name: 'nebula1', type: 'nebula', size: 980, opacity: 0.28, depth: 0.06, x: 0.50, y: 0.45 },
    { name: 'nebula2', type: 'nebula', size: 900, opacity: 0.30, depth: 0.08, x: 0.22, y: 0.70 },
    { name: 'nebula3', type: 'nebula', size: 860, opacity: 0.32, depth: 0.10, x: 0.80, y: 0.25 },

    // Галактики (кликабельны) — крутятся против часовой
    { name: 'galaxy1', type: 'galaxy', size: 120, opacity: 0.85, depth: 0.20, x: 0.12, y: 0.55, spinPeriod: 260, spinDir: 'ccw' },
    { name: 'galaxy2', type: 'galaxy', size: 70,  opacity: 0.52, depth: 0.22, x: 0.88, y: 0.65, spinPeriod: 240, spinDir: 'ccw' },
    { name: 'galaxy3', type: 'galaxy', size: 160, opacity: 0.48, depth: 0.18, x: 0.62, y: 0.16, spinPeriod: 280, spinDir: 'ccw' },
    { name: 'galaxy4', type: 'galaxy', size: 200, opacity: 0.45, depth: 0.21, x: 0.40, y: 0.78, spinPeriod: 300, spinDir: 'ccw' },

    // Планеты (кликабельны) — направление вращения рандом
    { name: 'sun',     type: 'planet', size: 70,  opacity: 0.85, depth: 0.40, x: 0.82, y: 0.28, spinPeriod: 220 },
    { name: 'saturn',  type: 'planet', size: 330, opacity: 0.94, depth: 0.44, x: 0.18, y: 0.40, spinPeriod: 260 },
    { name: 'jupiter', type: 'planet', size: 280, opacity: 0.94, depth: 0.46, x: 0.74, y: 0.78, spinPeriod: 240 },
    { name: 'earth',   type: 'planet', size: 240, opacity: 0.95, depth: 0.52, x: 0.30, y: 0.20, spinPeriod: 200 },
    { name: 'venera',  type: 'planet', size: 210, opacity: 0.93, depth: 0.54, x: 0.88, y: 0.52, spinPeriod: 210 },
    { name: 'mars',    type: 'planet', size: 40,  opacity: 0.63, depth: 0.96, x: 0.24, y: 0.78, spinPeriod: 190 },
    { name: 'neptun',  type: 'planet', size: 230, opacity: 0.93, depth: 0.50, x: 0.08, y: 0.18, spinPeriod: 230 },
    { name: 'moon',    type: 'planet', size: 50,  opacity: 0.92, depth: 0.60, x: 0.65, y: 0.88, spinPeriod: 210 },
    { name: 'pluton',  type: 'planet', size: 160, opacity: 0.90, depth: 0.62, x: 0.92, y: 0.14, spinPeriod: 260 }
  ];

  // ---------- Создание спрайтов ----------
  function createSprite(asset) {
    const layer = asset.type === 'nebula' ? bgLayer : objLayer;
    const isNebula = asset.type === 'nebula';
    const isGalaxy = asset.type === 'galaxy';
    const isPlanet = asset.type === 'planet';

    const wrap = document.createElement('div');
    wrap.className = `space-sprite space-sprite--${asset.type}`;
    wrap.style.setProperty('--size', `${asset.size}px`);
    wrap.style.setProperty('--opacity', `${asset.opacity}`);

    // Кликаем только по галактикам и планетам
    if (!isNebula) {
      wrap.style.pointerEvents = 'auto';
      wrap.style.cursor = 'pointer';
    } else {
      wrap.style.pointerEvents = 'none';
    }

    const img = document.createElement('img');
    img.className = 'space-sprite__img';
    img.id = asset.name;
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'eager';
    img.draggable = false;
    img.src = `${IMG_DIR}${asset.name}${EXT}`;
    // CSS-анимацию вращения мы больше не используем, всё — через JS

    wrap.appendChild(img);
    layer.appendChild(wrap);

    const bx = clamp01(asset.x + rand(-0.02, 0.02));
    const by = clamp01(asset.y + rand(-0.02, 0.02));

    // скорость вращения в рад/сек (по умолчанию рандомное направление)
    const period = asset.spinPeriod || (isGalaxy ? 260 : 220);
    let dir = asset.spinDir;
    if (!dir) dir = Math.random() < 0.5 ? 'cw' : 'ccw';
    const baseSpinSpeed = (2 * Math.PI) / period * (dir === 'cw' ? 1 : -1);

    const sprite = {
      ...asset,
      wrap,
      img,
      bx,
      by,
      hover: 0,
      hoverR: isPlanet ? asset.size * 0.95 : isGalaxy ? asset.size * 0.75 : asset.size * 0.5,

      floatAx: rand(6, 14) * (isNebula ? 1.2 : 1.0),
      floatAy: rand(6, 14) * (isNebula ? 1.2 : 1.0),
      floatFx: rand(0.08, 0.20),
      floatFy: rand(0.08, 0.18),
      phx: rand(0, Math.PI * 2),
      phy: rand(0, Math.PI * 2),

      chaosAx: rand(2, 5),
      chaosAy: rand(2, 5),
      chaosFx: rand(0.4, 0.9),
      chaosFy: rand(0.4, 0.9),
      chaosPhx: rand(0, Math.PI * 2),
      chaosPhy: rand(0, Math.PI * 2),

      angle: 0,
      spinBase: baseSpinSpeed,
      spinExtra: 0,

      currX: null,
      currY: null,
      twPhase: isNebula ? rand(0, Math.PI * 2) : 0,
      effect: null,
      ready: false
    };

    if (isGalaxy || isPlanet) {
      wrap.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const now = performance.now() / 1000;
        if (isGalaxy) {
          startGalaxySpinEffect(sprite, now);
        } else if (isPlanet) {
          startNextPlanetEffect(sprite, now);
        }
      });
    }

    img.addEventListener('load', () => {
      sprite.ready = true;
      // как только хотя бы что-то загрузилось — показываем сцену
      hero.classList.add('space-ready');
    });
    img.addEventListener('error', () => {
      sprite.ready = false;
      wrap.style.display = 'none';
    });

    return sprite;
  }

  function startGalaxySpinEffect(sprite, t) {
    // Только один тип: быстрый разворот 5с против часовой с разгоном/торможением
    sprite.effect = {
      type: 'galaxySpin',
      start: t,
      duration: 5,
      maxBoost: -4.5 // рад/сек дополнительного спина (отрицательное = против часовой)
    };
  }

  function startNextPlanetEffect(sprite, t) {
    const type = PLANET_EFFECT_ORDER[planetNextEffectIndex];
    planetNextEffectIndex = (planetNextEffectIndex + 1) % PLANET_EFFECT_ORDER.length;

    if (type === 'spiral') {
      const radiusPx = 75; // ~4 см диаметром ≈ 150px
      sprite.effect = {
        type: 'spiral',
        start: t,
        duration: 15,    // 15 секунд
        baseAngle: Math.random() * Math.PI * 2,
        revDir: Math.random() < 0.5 ? 1 : -1,
        radius: radiusPx,
        turns: 4
      };
    } else if (type === 'explore') {
      const ampX = W * 0.35;
      const ampY = H * 0.35;
      sprite.effect = {
        type: 'explore',
        start: t,
        duration: 30,    // 30 секунд
        centerX: sprite.bx * W,
        centerY: sprite.by * H,
        ampX,
        ampY,
        freqX: rand(0.12, 0.25),
        freqY: rand(0.10, 0.22),
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2
      };
    } else if (type === 'shrinkExit') {
      // Уменьшение и уход за край + возвращение, 15 сек
      const angle = Math.random() * Math.PI * 2;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const distOut = Math.min(W, H) * 0.4;

      const sides = ['top', 'right', 'bottom', 'left'];
      const side = sides[Math.floor(Math.random() * sides.length)];
      let exitX, exitY;
      if (side === 'top') {
        exitX = W * rand(0.1, 0.9);
        exitY = -sprite.size * 1.5;
      } else if (side === 'bottom') {
        exitX = W * rand(0.1, 0.9);
        exitY = H + sprite.size * 1.5;
      } else if (side === 'left') {
        exitX = -sprite.size * 1.5;
        exitY = H * rand(0.1, 0.9);
      } else {
        exitX = W + sprite.size * 1.5;
        exitY = H * rand(0.1, 0.9);
      }

      sprite.effect = {
        type: 'shrinkExit',
        start: t,
        duration: 15,
        dirX,
        dirY,
        distOut,
        exitX,
        exitY
      };
    }
  }

  const sprites = ASSETS.map(createSprite);

  // ---------- Движение фона (туманности слоем) ----------
  let bgTx = 0, bgTy = 0;

  function updateBgParallax(t) {
    const nx = (mouseX / Math.max(1, W)) - 0.5;
    const ny = (mouseY / Math.max(1, H)) - 0.5;

    const targetX = -nx * 24 + Math.sin(t * 0.08) * 5;
    const targetY = -ny * 16 + Math.cos(t * 0.07) * 4;

    const smooth = 0.06;
    bgTx = bgTx + (targetX - bgTx) * smooth;
    bgTy = bgTy + (targetY - bgTy) * smooth;

    bgLayer.style.transform =
      `translate3d(${bgTx.toFixed(2)}px, ${bgTy.toFixed(2)}px, 0) scale(1.08)`;
  }

  // ---------- Основной цикл анимации (30 FPS) ----------
  let lastFrame = 0;
  const FRAME_INTERVAL = 1000 / 30; // ~30 FPS

  function tick(now) {
    if (now - lastFrame < FRAME_INTERVAL) {
      requestAnimationFrame(tick);
      return;
    }
    const dt = (now - lastFrame) / 1000;
    lastFrame = now;
    const t = now / 1000;

    updateBgParallax(t);
    updateStars(t);

    const mx = mouseX, my = mouseY;
    const nx = (mx / Math.max(1, W)) - 0.5;
    const ny = (my / Math.max(1, H)) - 0.5;

    for (const s of sprites) {
      if (!s.ready) continue;

      const isNebula = s.type === 'nebula';
      const isGalaxy = s.type === 'galaxy';
      const isPlanet = s.type === 'planet';

      const baseX = s.bx * W;
      const baseY = s.by * H;

      // Базовый дрейф + лёгкий хаос
      let x = baseX +
        Math.sin(t * s.floatFx + s.phx) * s.floatAx +
        Math.sin(t * s.chaosFx + s.chaosPhx) * s.chaosAx;
      let y = baseY +
        Math.cos(t * s.floatFy + s.phy) * s.floatAy +
        Math.cos(t * s.chaosFy + s.chaosPhy) * s.chaosAy;

      // Параллакс (для планет/галактик)
      if (!isNebula) {
        const objParallax = 45;
        x += nx * objParallax * s.depth;
        y += ny * objParallax * s.depth;
      }

      let extraScale = 1;
      let overrideOpacity = null;
      let spinSpeed = s.spinBase; // рад/сек

      // --- Эффекты по клику ---
      if (s.effect) {
        const eff = s.effect;
        const et = (t - eff.start) / eff.duration;

        if (et >= 1 || et < 0) {
          s.effect = null;
        } else if (eff.type === 'galaxySpin' && isGalaxy) {
          // быстрый разворот против часовой с разгоном/торможением 5с
          const ease = Math.sin(et * Math.PI); // 0->1->0
          spinSpeed = s.spinBase + eff.maxBoost * ease;
        } else if (eff.type === 'spiral' && isPlanet) {
          const angle = eff.baseAngle + eff.revDir * (eff.turns * 2 * Math.PI * et);
          const radius = eff.radius * (0.2 + 0.8 * et);
          x = baseX + Math.cos(angle) * radius;
          y = baseY + Math.sin(angle) * radius;
        } else if (eff.type === 'explore' && isPlanet) {
          const tt = t - eff.start;
          x = eff.centerX + Math.sin(tt * eff.freqX + eff.phaseX) * eff.ampX;
          y = eff.centerY + Math.cos(tt * eff.freqY + eff.phaseY) * eff.ampY;
          extraScale = 1 + 0.3 * Math.sin(tt * 0.7); // приближение/удаление
          spinSpeed = (2 * Math.PI) / 1.5;          // довольно быстро по часовой
        } else if (eff.type === 'shrinkExit' && isPlanet) {
          const half = 0.5;
          if (et < half) {
            const p = et / half;
            const dist = eff.distOut * p;
            x = baseX + eff.dirX * dist;
            y = baseY + eff.dirY * dist;
            extraScale = 1 - 0.95 * p;  // 1 -> 0.05
          } else {
            const p = (et - half) / (1 - half);
            const startX = eff.exitX;
            const startY = eff.exitY;
            x = startX + (baseX - startX) * p;
            y = startY + (baseY - startY) * p;
            extraScale = 0.05 + 0.95 * p; // 0.05 -> 1
          }
        }
      }

      // Hover / лёгкое отталкивание
      const dx = mx - x;
      const dy = my - y;
      const dist = Math.hypot(dx, dy);
      const h = clamp01(1 - dist / s.hoverR);
      s.hover = s.hover * 0.9 + h * 0.1;

      if (!isNebula && dist > 0.001) {
        const repelBase = isPlanet ? 8 : 6;
        const repel = s.hover * repelBase;
        x -= (dx / dist) * repel;
        y -= (dy / dist) * repel;
      }

      // Плавное движение
      const smoothPos = isNebula ? 0.05 : 0.08;
      if (s.currX == null) {
        s.currX = x;
        s.currY = y;
      } else {
        s.currX = s.currX + (x - s.currX) * smoothPos;
        s.currY = s.currY + (y - s.currY) * smoothPos;
      }

      // Вращение
      s.angle += spinSpeed * dt;

      const scale =
        extraScale *
        (1 + s.hover * (isPlanet ? 0.06 : isGalaxy ? 0.05 : 0.02));

      s.wrap.style.transform =
        `translate3d(${(s.currX - s.size / 2).toFixed(2)}px, ${(s.currY - s.size / 2).toFixed(2)}px, 0)` +
        ` rotate(${s.angle.toFixed(4)}rad) scale(${scale.toFixed(4)})`;

      // Мерцание туманностей
      if (isNebula) {
        const osc = (Math.sin(t * NEBULA_TWINKLE_SPEED + s.twPhase) + 1) * 0.5;
        const baseOp = NEBULA_MIN_OPACITY +
          (NEBULA_MAX_OPACITY - NEBULA_MIN_OPACITY) * osc;
        s.wrap.style.opacity = baseOp.toFixed(3);
      }

      // Для zoom/shrink эффектов можно управлять прозрачностью (сейчас не нужно, но оставим)
      if (overrideOpacity != null && !isNebula) {
        s.wrap.style.opacity = overrideOpacity.toFixed(3);
      }
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
    }
