function initMobileTouchControlsForGames() {
  // показываем только на touch-устройствах
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!isTouch) return;

  // определяем, что мы на странице игры:
  // ищем canvas, который занимает значимую часть экрана (и НЕ является spaceCanvas фона)
  const canvases = [...document.querySelectorAll('canvas')].filter(c => c.id !== 'spaceCanvas');
  const target = canvases
    .map(c => ({ c, r: c.getBoundingClientRect() }))
    .filter(o => o.r.width > 0 && o.r.height > 0)
    .sort((a, b) => (b.r.width * b.r.height) - (a.r.width * a.r.height))[0];

  if (!target) return;

  const screenArea = innerWidth * innerHeight;
  const canvasArea = target.r.width * target.r.height;

  // если canvas маленький — вероятно не игра
  if (canvasArea < screenArea * 0.20) return;

  // чтобы не скроллилось/не “подтягивалось” во время игры
  document.documentElement.style.overscrollBehavior = 'none';
  document.documentElement.style.touchAction = 'none';

  // Inject CSS (не надо править styles.css)
  if (!document.getElementById('touch-controls-style')) {
    const st = document.createElement('style');
    st.id = 'touch-controls-style';
    st.textContent = `
      .touch-ui {
        position: fixed;
        inset: 0;
        z-index: 9999;
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
      }
      .touch-pad, .touch-actions {
        position: absolute;
        bottom: 14px;
        display: grid;
        gap: 10px;
        pointer-events: none;
      }
      .touch-pad { left: 14px; grid-template-columns: repeat(2, 64px); }
      .touch-actions { right: 14px; grid-template-columns: repeat(2, 92px); justify-items: end; }
      .tbtn {
        width: 64px;
        height: 64px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,.18);
        background: rgba(20, 30, 60, .55);
        color: #e8e8e8;
        font-weight: 700;
        pointer-events: auto;
        touch-action: none;
      }
      .tbtn.big { width: 92px; }
      .tbtn:active { transform: scale(0.98); }
      @media (max-width: 420px) {
        .touch-pad { grid-template-columns: repeat(2, 56px); }
        .tbtn { width: 56px; height: 56px; }
        .tbtn.big { width: 86px; }
      }
    `;
    document.head.appendChild(st);
  }

  // UI
  const ui = document.createElement('div');
  ui.className = 'touch-ui';
  ui.innerHTML = `
    <div class="touch-pad">
      <button class="tbtn" data-act="left">◀</button>
      <button class="tbtn" data-act="right">▶</button>
      <button class="tbtn" data-act="up">▲</button>
      <button class="tbtn" data-act="down">▼</button>
    </div>

    <div class="touch-actions">
      <button class="tbtn big" data-act="jump">Jump</button>
      <button class="tbtn big" data-act="action">Action</button>
      <button class="tbtn" data-act="pause">⏸</button>
    </div>
  `;
  document.body.appendChild(ui);

  // mapping: шлём и стрелки, и WASD, чтобы совпало с любыми твоими играми
  const map = {
    left:  [
      { code: 'ArrowLeft', key: 'ArrowLeft', keyCode: 37 },
      { code: 'KeyA', key: 'a', keyCode: 65 },
    ],
    right: [
      { code: 'ArrowRight', key: 'ArrowRight', keyCode: 39 },
      { code: 'KeyD', key: 'd', keyCode: 68 },
    ],
    up:    [
      { code: 'ArrowUp', key: 'ArrowUp', keyCode: 38 },
      { code: 'KeyW', key: 'w', keyCode: 87 },
    ],
    down:  [
      { code: 'ArrowDown', key: 'ArrowDown', keyCode: 40 },
      { code: 'KeyS', key: 's', keyCode: 83 },
    ],
    jump:  [
      { code: 'Space', key: ' ', keyCode: 32 },
    ],
    action: [
      { code: 'KeyE', key: 'e', keyCode: 69 },
    ],
    pause: [
      { code: 'Escape', key: 'Escape', keyCode: 27 },
      { code: 'KeyP', key: 'p', keyCode: 80 },
    ]
  };

  function dispatchKey(type, { code, key, keyCode }) {
    const ev = new KeyboardEvent(type, { bubbles: true, cancelable: true, code, key });
    // некоторые игры читают keyCode/which — пробуем подложить
    try {
      Object.defineProperty(ev, 'keyCode', { get: () => keyCode });
      Object.defineProperty(ev, 'which', { get: () => keyCode });
    } catch {}
    window.dispatchEvent(ev);
    document.dispatchEvent(ev);
  }

  function pressAct(act) {
    const list = map[act] || [];
    list.forEach(k => dispatchKey('keydown', k));
  }
  function releaseAct(act) {
    const list = map[act] || [];
    list.forEach(k => dispatchKey('keyup', k));
  }

  // обработчики кнопок
  ui.querySelectorAll('[data-act]').forEach(btn => {
    const act = btn.dataset.act;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.setPointerCapture(e.pointerId);
      pressAct(act);
    });
    btn.addEventListener('pointerup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      releaseAct(act);
    });
    btn.addEventListener('pointercancel', () => releaseAct(act));
    btn.addEventListener('lostpointercapture', () => releaseAct(act));
  });

  // если пользователь свернул/переключился — отпускаем всё
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    Object.keys(map).forEach(releaseAct);
  });
       }
document.addEventListener('DOMContentLoaded', () => {
  initMobileTouchControls();
});

function initMobileTouchControls() {
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!isTouch) return;

  // чтобы iOS/Android не скроллили страницу во время игры
  document.documentElement.style.touchAction = 'none';
  document.body.style.touchAction = 'none';

  // не создавать повторно
  if (document.getElementById('touchUI')) return;

  const ui = document.createElement('div');
  ui.id = 'touchUI';
  ui.className = 'touch-ui';
  ui.innerHTML = `
    <div class="touch-pad">
      <button class="tbtn" data-act="left">◀</button>
      <button class="tbtn" data-act="right">▶</button>
      <button class="tbtn" data-act="up">▲</button>
      <button class="tbtn" data-act="down">▼</button>
    </div>

    <div class="touch-actions">
      <button class="tbtn big" data-act="jump">Jump</button>
      <button class="tbtn big" data-act="action">Action</button>
      <button class="tbtn" data-act="pause">⏸</button>
    </div>
  `;
  document.body.appendChild(ui);

  // Эмуляция и стрелок, и WASD — чтобы подошло к любым твоим играм
  const map = {
    left:  [{ code:'ArrowLeft', key:'ArrowLeft', keyCode:37 }, { code:'KeyA', key:'a', keyCode:65 }],
    right: [{ code:'ArrowRight', key:'ArrowRight', keyCode:39 }, { code:'KeyD', key:'d', keyCode:68 }],
    up:    [{ code:'ArrowUp', key:'ArrowUp', keyCode:38 }, { code:'KeyW', key:'w', keyCode:87 }],
    down:  [{ code:'ArrowDown', key:'ArrowDown', keyCode:40 }, { code:'KeyS', key:'s', keyCode:83 }],
    jump:  [{ code:'Space', key:' ', keyCode:32 }],
    action:[{ code:'KeyE', key:'e', keyCode:69 }],
    pause: [{ code:'Escape', key:'Escape', keyCode:27 }, { code:'KeyP', key:'p', keyCode:80 }],
  };

  function dispatchKey(type, k) {
    const ev = new KeyboardEvent(type, { bubbles: true, cancelable: true, code: k.code, key: k.key });
    // некоторые игры читают keyCode/which
    try {
      Object.defineProperty(ev, 'keyCode', { get: () => k.keyCode });
      Object.defineProperty(ev, 'which', { get: () => k.keyCode });
    } catch {}
    window.dispatchEvent(ev);
    document.dispatchEvent(ev);
  }

  const press = (act) => (map[act] || []).forEach(k => dispatchKey('keydown', k));
  const release = (act) => (map[act] || []).forEach(k => dispatchKey('keyup', k));

  ui.querySelectorAll('[data-act]').forEach(btn => {
    const act = btn.dataset.act;

    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.setPointerCapture(e.pointerId);
      press(act);
    });

    btn.addEventListener('pointerup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      release(act);
    });

    btn.addEventListener('pointercancel', () => release(act));
    btn.addEventListener('lostpointercapture', () => release(act));
  });

  // если вкладка скрылась — отпустить все кнопки
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    Object.keys(map).forEach(release);
  });
  }

