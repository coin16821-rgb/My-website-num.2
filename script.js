// ====== Основная логика страницы + космический фон ======
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
  
    // Космический фон
    initSpaceBackground();
  });
  
  function initSpaceBackground() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
  
    // === ВСЕ КАРТИНКИ .png, ПАПКА РЯДОМ С index.html ===
    // если лежат в ./img, поменяй на './img/'
    const IMG_DIR = './';
    const EXT = '.png';
  
    // Параметры мерцания туманностей
    const NEBULA_MIN_OPACITY = 0.15;
    const NEBULA_MAX_OPACITY = 0.35;
    const NEBULA_TWINKLE_SPEED = 0.22; // 0.1 – медленно, 0.4 – быстро
  
    // Последовательность эффектов по клику
    const EFFECT_ORDER = ['pushPull', 'spiral', 'zoomReturn'];
    let nextEffectIndex = 0;
  
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
  
    // ---------- Описание объектов ----------
    // spin — длительность полного оборота (сек) для CSS-анимации вращения
    const ASSETS = [
      // Туманности (фон, не кликаются)
      { name: 'nebula1', type: 'nebula', size: 980, opacity: 0.28, depth: 0.06, x: 0.50, y: 0.45 },
      { name: 'nebula2', type: 'nebula', size: 900, opacity: 0.30, depth: 0.08, x: 0.22, y: 0.70 },
      { name: 'nebula3', type: 'nebula', size: 860, opacity: 0.32, depth: 0.10, x: 0.80, y: 0.25 },
  
      // Галактики (кликабельны)
      { name: 'galaxy1', type: 'galaxy', size: 120, opacity: 0.85, depth: 0.20, x: 0.12, y: 0.55, spin: 1420 },
      { name: 'galaxy2', type: 'galaxy', size: 70,  opacity: 0.52, depth: 0.22, x: 0.88, y: 0.65, spin: 1380 },
      { name: 'galaxy3', type: 'galaxy', size: 160, opacity: 0.48, depth: 0.18, x: 0.62, y: 0.16, spin: 1460 },
      { name: 'galaxy4', type: 'galaxy', size: 200, opacity: 0.45, depth: 0.21, x: 0.40, y: 0.78, spin: 1400 },
  
      // Планеты (кликабельны)
      { name: 'sun',     type: 'planet', size: 70,  opacity: 0.85, depth: 0.40, x: 0.82, y: 0.28, spin: 1320 },
      { name: 'saturn',  type: 'planet', size: 330, opacity: 0.94, depth: 0.44, x: 0.18, y: 0.40, spin: 1280 },
      { name: 'jupiter', type: 'planet', size: 280, opacity: 0.94, depth: 0.46, x: 0.74, y: 0.78, spin: 1260 },
      { name: 'earth',   type: 'planet', size: 240, opacity: 0.95, depth: 0.52, x: 0.30, y: 0.20, spin: 1210 },
      { name: 'venera',  type: 'planet', size: 210, opacity: 0.93, depth: 0.54, x: 0.88, y: 0.52, spin: 1250 },
      { name: 'mars',    type: 'planet', size: 40,  opacity: 0.63, depth: 0.96, x: 0.24, y: 0.78, spin: 1230 },
      { name: 'neptun',  type: 'planet', size: 230, opacity: 0.93, depth: 0.50, x: 0.08, y: 0.18, spin: 1300 },
      { name: 'moon',    type: 'planet', size: 50,  opacity: 0.92, depth: 0.60, x: 0.65, y: 0.88, spin: 1340 }
    ];
  
    function spinClassFor(idx, type) {
      if (type === 'nebula') return '';
      return idx % 2 === 0 ? 'spin-cw' : 'spin-ccw';
    }
  
    // Выбор эффекта по очереди (1→2→3→1...)
    function startSequentialEffect(sprite, t) {
      const type = EFFECT_ORDER[nextEffectIndex];
      nextEffectIndex = (nextEffectIndex + 1) % EFFECT_ORDER.length;
      const duration = 30; // секунд
  
      const eff = { type, start: t, duration };
  
      if (type === 'pushPull') {
        const angle = Math.random() * Math.PI * 2;
        eff.dirX = Math.cos(angle);
        eff.dirY = Math.sin(angle);
        eff.amp = sprite.size * 0.5;
      } else if (type === 'spiral') {
        eff.revDir = Math.random() < 0.5 ? 1 : -1;
        eff.turns = 4;
        eff.radius = 60;
        eff.baseAngle = Math.random() * Math.PI * 2;
      } else if (type === 'zoomReturn') {
        const sides = ['top', 'right', 'bottom', 'left'];
        const side = sides[Math.floor(Math.random() * sides.length)];
        eff.side = side;
  
        if (side === 'top') {
          eff.offX = W * rand(0.1, 0.9);
          eff.offY = -sprite.size * 1.5;
        } else if (side === 'bottom') {
          eff.offX = W * rand(0.1, 0.9);
          eff.offY = H + sprite.size * 1.5;
        } else if (side === 'left') {
          eff.offX = -sprite.size * 1.5;
          eff.offY = H * rand(0.1, 0.9);
        } else {
          eff.offX = W + sprite.size * 1.5;
          eff.offY = H * rand(0.1, 0.9);
        }
      }
  
      sprite.effect = eff;
    }
  
    function createSprite(asset, idx) {
      const layer = asset.type === 'nebula' ? bgLayer : objLayer;
      const isNebula = asset.type === 'nebula';
  
      const wrap = document.createElement('div');
      wrap.className = `space-sprite space-sprite--${asset.type} ${spinClassFor(idx, asset.type)}`.trim();
      wrap.style.setProperty('--size', `${asset.size}px`);
      wrap.style.setProperty('--opacity', `${asset.opacity}`);
  
      // Кликаем только по не-небулам
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
      if (asset.spin) {
        img.style.setProperty('--spin', asset.spin + 's');
      }
  
      wrap.appendChild(img);
      layer.appendChild(wrap);
  
      const bx = clamp01(asset.x + rand(-0.02, 0.02));
      const by = clamp01(asset.y + rand(-0.02, 0.02));
  
      const sprite = {
        ...asset,
        wrap,
        img,
        bx,
        by,
        hover: 0,
        hoverR: asset.type === 'planet' ? asset.size * 0.95 : asset.size * 0.70,
  
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
  
        currX: null,
        currY: null,
        twPhase: isNebula ? rand(0, Math.PI * 2) : 0,
        effect: null,
        ready: false
      };
  
      if (!isNebula) {
        wrap.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const now = performance.now() / 1000;
          startSequentialEffect(sprite, now);
        });
      }
  
      return sprite;
    }
  
    const sprites = ASSETS.map(createSprite);
  
    // ---------- Появление после загрузки ----------
    let loaded = 0;
    const needToShow = 4;
  
    sprites.forEach(s => {
      s.img.addEventListener('load', () => {
        s.ready = true;
        loaded++;
        if (loaded >= needToShow) hero.classList.add('space-ready');
      });
  
      s.img.addEventListener('error', () => {
        s.wrap.style.display = 'none';
      });
    });
  
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
      lastFrame = now;
      const t = now / 1000;
  
      updateBgParallax(t);
  
      const mx = mouseX, my = mouseY;
      const nx = (mx / Math.max(1, W)) - 0.5;
      const ny = (my / Math.max(1, H)) - 0.5;
  
      for (const s of sprites) {
        if (!s.ready) continue;
  
        const baseX = s.bx * W;
        const baseY = s.by * H;
  
        const fx = Math.sin(t * s.floatFx + s.phx) * s.floatAx;
        const fy = Math.cos(t * s.floatFy + s.phy) * s.floatAy;
  
        const objParallax = s.type === 'nebula' ? 0 : 45;
        const px = nx * objParallax * s.depth;
        const py = ny * objParallax * s.depth;
  
        const cx = Math.sin(t * s.chaosFx + s.chaosPhx) * s.chaosAx;
        const cy = Math.cos(t * s.chaosFy + s.chaosPhy) * s.chaosAy;
  
        let x = baseX + fx + px + cx;
        let y = baseY + fy + py + cy;
  
        let extraScale = 1;
        let overrideOpacity = null;
  
        // Эффект по клику (последовательно 1→2→3)
        if (s.effect) {
          const eff = s.effect;
          const et = (t - eff.start) / eff.duration;
  
          if (et >= 1 || et < 0) {
            s.effect = null;
          } else if (eff.type === 'pushPull') {
            const f = Math.sin(Math.PI * et);
            const dist = eff.amp * f;
            x += eff.dirX * dist;
            y += eff.dirY * dist;
          } else if (eff.type === 'spiral') {
            const angle = eff.baseAngle + eff.revDir * (eff.turns * 2 * Math.PI * et);
            const radius = eff.radius * (0.2 + 0.8 * et);
            x += Math.cos(angle) * radius;
            y += Math.sin(angle) * radius;
          } else if (eff.type === 'zoomReturn') {
            const half = 0.5;
            if (et < half) {
              const p = et / half;
              const cxScr = W / 2;
              const cyScr = H / 2;
  
              x = baseX + (cxScr - baseX) * p;
              y = baseY + (cyScr - baseY) * p;
  
              // делаем ~5x, а не 10x, чтобы не убивать FPS
              extraScale = 1 + p * 4;   // 1 -> 5
              overrideOpacity = 1 - p;  // 1 -> 0
            } else {
              const p = (et - half) / (1 - half);
              const startX = eff.offX;
              const startY = eff.offY;
  
              x = startX + (baseX - startX) * p;
              y = startY + (baseY - startY) * p;
  
              extraScale = 0.5 + 0.5 * p; // 0.5 -> 1
              overrideOpacity = p;        // 0 -> 1
            }
          }
        }
  
        // Hover / лёгкое отталкивание (очень мягкое)
        const dx = mx - x;
        const dy = my - y;
        const dist = Math.hypot(dx, dy);
        const h = clamp01(1 - dist / s.hoverR);
        s.hover = s.hover * 0.9 + h * 0.1;
  
        if (s.type !== 'nebula' && dist > 0.001) {
          const repelBase = s.type === 'planet' ? 8 : 6;
          const repel = s.hover * repelBase;
          x -= (dx / dist) * repel;
          y -= (dy / dist) * repel;
        }
  
        // Плавное движение
        const smoothPos = s.type === 'nebula' ? 0.05 : 0.08;
        if (s.currX == null) {
          s.currX = x;
          s.currY = y;
        } else {
          s.currX = s.currX + (x - s.currX) * smoothPos;
          s.currY = s.currY + (y - s.currY) * smoothPos;
        }
  
        const scale =
          extraScale *
          (1 + s.hover * (s.type === 'planet' ? 0.06 : s.type === 'galaxy' ? 0.05 : 0.02));
  
        s.wrap.style.transform =
          `translate3d(${(s.currX - s.size / 2).toFixed(2)}px, ${(s.currY - s.size / 2).toFixed(2)}px, 0)` +
          ` scale(${scale.toFixed(4)})`;
  
        // Мерцание туманностей
        if (s.type === 'nebula') {
          const osc = (Math.sin(t * NEBULA_TWINKLE_SPEED + s.twPhase) + 1) * 0.5;
          const baseOp = NEBULA_MIN_OPACITY +
            (NEBULA_MAX_OPACITY - NEBULA_MIN_OPACITY) * osc;
          s.wrap.style.opacity = baseOp.toFixed(3);
        }
  
        if (overrideOpacity != null && s.type !== 'nebula') {
          s.wrap.style.opacity = overrideOpacity.toFixed(3);
        }
      }
  
      requestAnimationFrame(tick);
    }
  
    requestAnimationFrame(tick);
  }