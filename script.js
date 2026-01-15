// ====== Основная логика страницы + космический фон (исправлено) ======
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

  // ==== ПУТЬ К ИЗОБРАЖЕНИЯМ (все .png) ====
  const IMG_DIR = './';
  const EXT = '.png';

  // ==== НЕБУЛЫ: мерцание ====
  const NEBULA_MIN_OPACITY = 0.15;
  const NEBULA_MAX_OPACITY = 0.35;
  const NEBULA_TWINKLE_SPEED = 0.22;

  // ==== Планеты: последовательность действий ====
  const PLANET_EFFECT_ORDER = ['spiral', 'explore', 'shrinkExit'];
  let planetNextEffectIndex = 0;

  // ==== Ограничение FPS (чтобы не грузить ноутбук) ====
  const FPS = 30;
  const FRAME_INTERVAL = 1000 / FPS;

  // Если уже была сцена — удалить
  const oldScene = hero.querySelector('#spaceScene');
  if (oldScene) oldScene.remove();

  // ---------- Сцена ----------
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

  // Слой звёзд (DOM, но с CSS-анимацией — минимальная нагрузка)
  const starLayer = document.createElement('div');
  Object.assign(starLayer.style, {
    position: 'absolute',
    inset: '0',
    zIndex: '1',
    pointerEvents: 'none',
    overflow: 'hidden'
  });
  scene.appendChild(starLayer);

  const objLayer = document.createElement('div');
  objLayer.id = 'spaceObjLayer';
  Object.assign(objLayer.style, {
    position: 'absolute',
    inset: '0',
    zIndex: '2',
    pointerEvents: 'none'
  });
  scene.appendChild(objLayer);

  // ---------- Размеры hero ----------
  let W = 1, H = 1;
  function resize() {
    const rect = hero.getBoundingClientRect();
    W = Math.max(1, Math.floor(rect.width));
    H = Math.max(1, Math.floor(rect.height));
  }
  resize();
  window.addEventListener('resize', resize);

  // ---------- Pointer ----------
  let mouseX = W / 2, mouseY = H / 2;

  function setPointerFromEvent(e) {
    const rect = hero.getBoundingClientRect();
    const p = e.touches?.[0] ?? e;
    mouseX = (p.clientX ?? rect.left) - rect.left;
    mouseY = (p.clientY ?? rect.top) - rect.top;
  }

  document.addEventListener('mousemove', setPointerFromEvent, { passive: true });
  document.addEventListener('touchmove', setPointerFromEvent, { passive: true });

  // ---------- Utils ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const easeInOutSine = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

  // ---------- Звёзды: CSS-анимация twinkle ----------
  (function initStarsTwinkle() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes starTwinkle {
        0% { opacity: var(--o1); }
        100% { opacity: var(--o2); }
      }
    `;
    document.head.appendChild(style);

    const STAR_COUNT = 70; // немного, чтобы не грузить
    for (let i = 0; i < STAR_COUNT; i++) {
      const s = document.createElement('div');
      const size = rand(1, 2);
      const dur = rand(1.6, 4.8);
      const delay = rand(0, 2.5);
      const o1 = rand(0.10, 0.45);
      const o2 = rand(0.35, 0.85);

      Object.assign(s.style, {
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
      s.style.setProperty('--o1', o1.toFixed(2));
      s.style.setProperty('--o2', o2.toFixed(2));

      starLayer.appendChild(s);
    }
  })();

  // ---------- Assets ----------
  // spinMs — период полного оборота в спокойном состоянии (мс)
  const ASSETS = [
    // Nebula (фон)
    { name: 'nebula1', type: 'nebula', size: 980, opacity: 0.28, x: 0.50, y: 0.45 },
    { name: 'nebula2', type: 'nebula', size: 900, opacity: 0.30, x: 0.22, y: 0.70 },
    { name: 'nebula3', type: 'nebula', size: 860, opacity: 0.32, x: 0.80, y: 0.25 },

    // Galaxies
    { name: 'galaxy1', type: 'galaxy', size: 120, opacity: 0.85, x: 0.12, y: 0.55, spinMs: 2600 },
    { name: 'galaxy2', type: 'galaxy', size: 70,  opacity: 0.52, x: 0.88, y: 0.65, spinMs: 2400 },
    { name: 'galaxy3', type: 'galaxy', size: 160, opacity: 0.48, x: 0.62, y: 0.16, spinMs: 2800 },
    { name: 'galaxy4', type: 'galaxy', size: 200, opacity: 0.45, x: 0.40, y: 0.78, spinMs: 3000 },

    // Planets
    { name: 'sun',     type: 'planet', size: 70,  opacity: 0.85, x: 0.82, y: 0.28, spinMs: 1800 },
    { name: 'saturn',  type: 'planet', size: 330, opacity: 0.94, x: 0.18, y: 0.40, spinMs: 2200 },
    { name: 'jupiter', type: 'planet', size: 280, opacity: 0.94, x: 0.74, y: 0.78, spinMs: 2000 },
    { name: 'earth',   type: 'planet', size: 240, opacity: 0.95, x: 0.30, y: 0.20, spinMs: 1900 },
    { name: 'venera',  type: 'planet', size: 210, opacity: 0.93, x: 0.88, y: 0.52, spinMs: 2100 },
    { name: 'mars',    type: 'planet', size: 40,  opacity: 0.63, x: 0.24, y: 0.78, spinMs: 1700 },
    { name: 'neptun',  type: 'planet', size: 230, opacity: 0.93, x: 0.08, y: 0.18, spinMs: 2300 },
    { name: 'moon',    type: 'planet', size: 50,  opacity: 0.92, x: 0.65, y: 0.88, spinMs: 1900 },
    { name: 'pluton',  type: 'planet', size: 160, opacity: 0.90, x: 0.92, y: 0.14, spinMs: 2400 }
  ];

  // ---------- Создание спрайта (wrapper двигаем, img вращаем/масштабируем) ----------
  function createSprite(asset) {
    const layer = asset.type === 'nebula' ? bgLayer : objLayer;

    const wrap = document.createElement('div');
    wrap.className = `space-sprite space-sprite--${asset.type}`;
    wrap.style.setProperty('--size', `${asset.size}px`);
    wrap.style.setProperty('--opacity', `${asset.opacity}`);
    wrap.style.opacity = String(asset.opacity);

    const img = document.createElement('img');
    img.className = 'space-sprite__img';
    img.id = asset.name;
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'eager';
    img.draggable = false;
    img.src = `${IMG_DIR}${asset.name}${EXT}`;

    // ВАЖНО: отключаем CSS-вращение (если в CSS были spin-cw/spin-ccw)
    img.style.animation = 'none';
    // Убираем тяжелые фильтры, если где-то остались в CSS
    img.style.filter = 'none';

    wrap.appendChild(img);
    layer.appendChild(wrap);

    const bx = clamp01(asset.x + rand(-0.02, 0.02));
    const by = clamp01(asset.y + rand(-0.02, 0.02));

    const spinMs = Math.max(1300, asset.spinMs ?? 2000); // "минимальная скорость начинается от 1300"
    const baseSpinSpeed = (2 * Math.PI) / (spinMs / 1000) * (Math.random() < 0.5 ? 1 : -1);

    const sprite = {
      ...asset,
      wrap,
      img,
      bx,
      by,
      baseOpacity: asset.opacity,

      // базовая плавучесть/хаос
      floatAx: rand(3, 8),
      floatAy: rand(3, 8),
      floatFx: rand(0.06, 0.16),
      floatFy: rand(0.06, 0.16),
      phx: rand(0, Math.PI * 2),
      phy: rand(0, Math.PI * 2),

      // состояние
      ready: false,
      currX: null,
      currY: null,
      angle: 0,
      spinBase: baseSpinSpeed,

      // эффекты
      effect: null,
      // для explore
      explore: null,
      // для nebula мерцания
      twPhase: asset.type === 'nebula' ? rand(0, Math.PI * 2) : 0
    };

    img.addEventListener('load', () => {
      sprite.ready = true;
      hero.classList.add('space-ready');
    });
    img.addEventListener('error', () => {
      sprite.ready = false;
      wrap.style.display = 'none';
    });

    return sprite;
  }

  const sprites = ASSETS.map(createSprite);

  // ---------- Помощники эффектов ----------
  function startGalaxySpin(sprite, t) {
    // 5 секунд быстро против часовой: boost CCW + easing
    sprite.effect = {
      type: 'galaxySpin',
      start: t,
      duration: 5,
      boost: -10.0 // рад/сек (минус = против часовой)
    };
  }

  function startNextPlanetEffect(sprite, t) {
    const type = PLANET_EFFECT_ORDER[planetNextEffectIndex];
    planetNextEffectIndex = (planetNextEffectIndex + 1) % PLANET_EFFECT_ORDER.length;

    if (type === 'spiral') {
      // диаметр ~4см => радиус ~75px
      sprite.effect = {
        type: 'spiral',
        start: t,
        duration: 12,
        originX: sprite.currX ?? (sprite.bx * W),
        originY: sprite.currY ?? (sprite.by * H),
        baseAngle: Math.random() * Math.PI * 2,
        dir: Math.random() < 0.5 ? 1 : -1,
        turns: 4,
        radius: 75
      };
    }

    if (type === 'explore') {
      // 30 секунд: блуждание по "точкам" + масштаб + быстрое CW вращение
      const startX = sprite.currX ?? (sprite.bx * W);
      const startY = sprite.currY ?? (sprite.by * H);
      sprite.explore = {
        x: startX,
        y: startY,
        tx: rand(60, W - 60),
        ty: rand(60, H - 60),
        nextSwitch: t + rand(0.7, 1.6)
      };
      sprite.effect = {
        type: 'explore',
        start: t,
        duration: 30
      };
    }

    if (type === 'shrinkExit') {
      const startX = sprite.currX ?? (sprite.bx * W);
      const startY = sprite.currY ?? (sprite.by * H);

      // случайное направление "ухода"
      const ang = Math.random() * Math.PI * 2;
      const dirX = Math.cos(ang);
      const dirY = Math.sin(ang);

      // точка "за экраном" для ухода
      const sides = ['top', 'right', 'bottom', 'left'];
      const exitSide = sides[Math.floor(Math.random() * sides.length)];
      const enterSide = sides[Math.floor(Math.random() * sides.length)];

      function offscreenPoint(side) {
        if (side === 'top') return { x: rand(60, W - 60), y: -sprite.size * 2 };
        if (side === 'bottom') return { x: rand(60, W - 60), y: H + sprite.size * 2 };
        if (side === 'left') return { x: -sprite.size * 2, y: rand(60, H - 60) };
        return { x: W + sprite.size * 2, y: rand(60, H - 60) };
      }

      const exitP = offscreenPoint(exitSide);
      const enterP = offscreenPoint(enterSide);

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

  // ---------- Клик: выбираем ближайший объект (исправляет "иногда не срабатывает") ----------
  hero.addEventListener('pointerdown', (e) => {
    // если клик по контенту (кнопка/текст) — не трогаем космос
    if (e.target.closest('.hero-container')) return;

    setPointerFromEvent(e);

    // искать ближайший кликабельный объект (планета/галактика)
    let best = null;
    let bestD = Infinity;

    for (const s of sprites) {
      if (!s.ready) continue;
      if (s.type === 'nebula') continue;

      const cx = s.currX ?? (s.bx * W);
      const cy = s.currY ?? (s.by * H);
      const d = Math.hypot(mouseX - cx, mouseY - cy);

      const hit = Math.max(40, s.size * 0.55); // увеличенный радиус клика
      if (d <= hit && d < bestD) {
        best = s;
        bestD = d;
      }
    }

    if (!best) return;

    const t = performance.now() / 1000;

    if (best.type === 'galaxy') {
      startGalaxySpin(best, t);
    } else if (best.type === 'planet') {
      startNextPlanetEffect(best, t);
    }
  });

  // ---------- Параллакс фона ----------
  let bgTx = 0, bgTy = 0;
  function updateBgParallax(t) {
    const nx = (mouseX / Math.max(1, W)) - 0.5;
    const ny = (mouseY / Math.max(1, H)) - 0.5;

    const targetX = -nx * 18 + Math.sin(t * 0.06) * 3;
    const targetY = -ny * 12 + Math.cos(t * 0.05) * 2;

    const smooth = 0.06;
    bgTx += (targetX - bgTx) * smooth;
    bgTy += (targetY - bgTy) * smooth;

    bgLayer.style.transform = `translate3d(${bgTx}px, ${bgTy}px, 0) scale(1.08)`;
  }

  // ---------- Главный цикл ----------
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

    const dt = lastFrame === 0 ? 0 : (now - lastFrame) / 1000;
    lastFrame = now;

    const t = now / 1000;

    updateBgParallax(t);

    // Nebula twinkle (3 элемента — почти бесплатно)
    for (const s of sprites) {
      if (!s.ready) continue;
      if (s.type !== 'nebula') continue;

      const osc = (Math.sin(t * NEBULA_TWINKLE_SPEED + s.twPhase) + 1) * 0.5; // 0..1
      const op = NEBULA_MIN_OPACITY + (NEBULA_MAX_OPACITY - NEBULA_MIN_OPACITY) * osc;
      s.wrap.style.opacity = op.toFixed(3);
    }

    // Движение объектов
    for (const s of sprites) {
      if (!s.ready) continue;
      if (s.type === 'nebula') continue;

      // базовая позиция
      let x = s.bx * W + Math.sin(t * s.floatFx + s.phx) * s.floatAx;
      let y = s.by * H + Math.cos(t * s.floatFy + s.phy) * s.floatAy;

      let scale = 1;
      let spinSpeed = s.spinBase;

      // эффекты
      if (s.effect) {
        const eff = s.effect;
        const et = (t - eff.start) / eff.duration;

        if (et >= 1 || et < 0) {
          s.effect = null;
          s.explore = null;
        } else if (eff.type === 'galaxySpin') {
          // разгон/торможение
          const k = easeInOutSine(et); // 0..1..0 (через sin/pi)
          spinSpeed = s.spinBase + eff.boost * Math.sin(et * Math.PI);
        } else if (eff.type === 'spiral') {
          const k = easeInOutSine(et);
          const angle = eff.baseAngle + eff.dir * (eff.turns * 2 * Math.PI * et);
          const radius = eff.radius * k;
          x = eff.originX + Math.cos(angle) * radius;
          y = eff.originY + Math.sin(angle) * radius;
        } else if (eff.type === 'explore') {
          // смена целевых точек
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

          // плавное движение к цели
          const follow = 0.06;
          s.explore.x += (s.explore.tx - s.explore.x) * follow;
          s.explore.y += (s.explore.ty - s.explore.y) * follow;

          x = s.explore.x;
          y = s.explore.y;

          // лёгкое приближение/удаление
          const tt = t - eff.start;
          scale = 0.85 + 0.35 * (0.5 + 0.5 * Math.sin(tt * 0.8));

          // быстрое вращение по часовой
          spinSpeed = Math.abs((2 * Math.PI) / 1.2); // CW
        } else if (eff.type === 'shrinkExit') {
          // 15 сек: уменьшение -> уход за край -> возврат
          // 0..0.45: движемся по направлению, уменьшаемся до 0
          // 0.45..0.55: уходим в exit (scale ~0)
          // 0.55..1: появляемся с enter и возвращаемся, растём до 1
          if (et < 0.45) {
            const p = et / 0.45;
            x = eff.startX + eff.dirX * eff.midDist * p;
            y = eff.startY + eff.dirY * eff.midDist * p;
            scale = 1 - p; // 1 -> 0
          } else if (et < 0.55) {
            const p = (et - 0.45) / 0.10;
            // идём к точке выхода за экраном
            const midX = eff.startX + eff.dirX * eff.midDist;
            const midY = eff.startY + eff.dirY * eff.midDist;
            x = midX + (eff.exitX - midX) * p;
            y = midY + (eff.exitY - midY) * p;
            scale = 0; // полностью 0
          } else {
            const p = (et - 0.55) / 0.45;
            x = eff.enterX + (eff.startX - eff.enterX) * p;
            y = eff.enterY + (eff.startY - eff.enterY) * p;
            scale = p; // 0 -> 1
          }
        }
      }

      // сглаживание позиции (исправляет "дергания")
      const smoothPos = 0.10;
      if (s.currX == null) {
        s.currX = x;
        s.currY = y;
      } else {
        s.currX += (x - s.currX) * smoothPos;
        s.currY += (y - s.currY) * smoothPos;
      }

      // обновляем угол
      s.angle += spinSpeed * dt;

      // применяем transform:
      // - wrapper: только translate (самое лёгкое)
      // - img: rotate + scale
      const tx = s.currX - s.size / 2;
      const ty = s.currY - s.size / 2;

      s.wrap.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      s.img.style.transform = `rotate(${s.angle}rad) scale(${scale})`;

      // возвращаем базовую opacity для не-небул (чтобы не "прилипало")
      s.wrap.style.opacity = String(s.baseOpacity);
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
    }
