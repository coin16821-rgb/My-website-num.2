document.addEventListener('DOMContentLoaded', () => {
  initMobileTouchControlsSmart();

  // Тут может быть твоя логика games.html (список игр, запуск игр и т.п.)
  // Ничего не ломаем: этот файл просто добавляет touch-управление при необходимости.
});

function initMobileTouchControlsSmart() {
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!isTouch) return;

  // CSS (1 раз)
  if (!document.getElementById('touch-controls-style')) {
    const st = document.createElement('style');
    st.id = 'touch-controls-style';
    st.textContent = `
      .touch-ui{
        position:fixed; inset:0; z-index:9999;
        pointer-events:none; user-select:none; -webkit-user-select:none;
      }
      .touch-pad,.touch-actions{
        position:absolute; bottom:14px;
        display:grid; gap:10px; pointer-events:none;
      }
      .touch-pad{left:14px;grid-template-columns:repeat(2,64px)}
      .touch-actions{right:14px;grid-template-columns:repeat(2,92px);justify-items:end}
      .tbtn{
        width:64px;height:64px;border-radius:14px;
        border:1px solid rgba(255,255,255,.18);
        background:rgba(20,30,60,.55);
        color:#e8e8e8;font-weight:700;
        pointer-events:auto; touch-action:none;
      }
      .tbtn.big{width:92px}
      .tbtn:active{transform:scale(0.98)}
      @media (max-width:420px){
        .touch-pad{grid-template-columns:repeat(2,56px)}
        .tbtn{width:56px;height:56px}
        .tbtn.big{width:86px}
      }
      html,body{overscroll-behavior:auto;}
    `;
    document.head.appendChild(st);
  }

  // UI (1 раз)
  let ui = document.getElementById('touchUI');
  if (!ui) {
    ui = document.createElement('div');
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
  }
  ui.style.display = 'none';

  // Маппинг клавиш (чтобы подошло к любым играм на keydown/keyup)
  const map = {
    left:  [{ code:'ArrowLeft', key:'ArrowLeft', keyCode:37 }, { code:'KeyA', key:'a', keyCode:65 }],
    right: [{ code:'ArrowRight', key:'ArrowRight', keyCode:39 }, { code:'KeyD', key:'d', keyCode:68 }],
    up:    [{ code:'ArrowUp', key:'ArrowUp', keyCode:38 }, { code:'KeyW', key:'w', keyCode:87 }],
    down:  [{ code:'ArrowDown', key:'ArrowDown', keyCode:40 }, { code:'KeyS', key:'s', keyCode:83 }],
    jump:  [{ code:'Space', key:' ', keyCode:32 }],
    action:[{ code:'KeyE', key:'e', keyCode:69 }],
    pause: [{ code:'Escape', key:'Escape', keyCode:27 }, { code:'KeyP', key:'p', keyCode:80 }],
  };

  // Куда отправлять клавиши: в window + во все доступные same-origin iframe
  function getDispatchTargets() {
    const targets = [window];

    document.querySelectorAll('iframe').forEach(fr => {
      try {
        // сработает только если iframe same-origin
        if (fr.contentWindow) targets.push(fr.contentWindow);
      } catch {
        // cross-origin iframe — не трогаем
      }
    });

    return targets;
  }

  function dispatchKey(targetWin, type, k) {
    const ev = new targetWin.KeyboardEvent(type, {
      bubbles: true,
      cancelable: true,
      code: k.code,
      key: k.key
    });

    // некоторые игры читают keyCode/which
    try {
      Object.defineProperty(ev, 'keyCode', { get: () => k.keyCode });
      Object.defineProperty(ev, 'which', { get: () => k.keyCode });
    } catch {}

    targetWin.dispatchEvent(ev);
    // на всякий случай ещё в document родителя
    if (targetWin === window) document.dispatchEvent(ev);
  }

  function press(act) {
    const list = map[act] || [];
    const targets = getDispatchTargets();
    targets.forEach(w => list.forEach(k => dispatchKey(w, 'keydown', k)));
  }

  function release(act) {
    const list = map[act] || [];
    const targets = getDispatchTargets();
    targets.forEach(w => list.forEach(k => dispatchKey(w, 'keyup', k)));
  }

  // Вешаем обработчики кнопок один раз
  if (!ui.dataset.bound) {
    ui.dataset.bound = '1';

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

    // если вкладка скрылась — отпустить
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) return;
      Object.keys(map).forEach(release);
    });
  }

  // --- режимы: список игр / игра ---
  let locked = false;

  function lockScrollForGame(on) {
    if (on && !locked) {
      locked = true;
      document.body.dataset.prevOverflow = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
    }
    if (!on && locked) {
      locked = false;
      document.body.style.overflow = document.body.dataset.prevOverflow || '';
    }
  }

  function findLargeCanvasInDoc() {
    const canvases = [...document.querySelectorAll('canvas')].filter(c => c.id !== 'spaceCanvas');
    if (!canvases.length) return null;

    const best = canvases
      .map(c => ({ c, r: c.getBoundingClientRect() }))
      .filter(o => o.r.width > 0 && o.r.height > 0)
      .sort((a,b) => (b.r.width*b.r.height)-(a.r.width*a.r.height))[0];

    if (!best) return null;

    const screen = innerWidth * innerHeight;
    const area = best.r.width * best.r.height;
    if (area < screen * 0.20) return null; // слишком маленький — не считаем игрой

    return best.c;
  }

  function findLargeIframeInDoc() {
    const frames = [...document.querySelectorAll('iframe')];
    if (!frames.length) return null;

    const best = frames
      .map(fr => ({ fr, r: fr.getBoundingClientRect() }))
      .filter(o => o.r.width > 0 && o.r.height > 0)
      .sort((a,b) => (b.r.width*b.r.height)-(a.r.width*a.r.height))[0];

    if (!best) return null;

    const screen = innerWidth * innerHeight;
    const area = best.r.width * best.r.height;
    if (area < screen * 0.25) return null;

    return best.fr;
  }

  function applyMode() {
    const gameCanvas = findLargeCanvasInDoc();
    const gameIframe = !gameCanvas ? findLargeIframeInDoc() : null;

    const inGame = !!gameCanvas || !!gameIframe;

    if (inGame) {
      ui.style.display = 'block';
      lockScrollForGame(true);

      // блокируем жесты только у игрового контейнера
      if (gameCanvas) gameCanvas.style.touchAction = 'none';
      if (gameIframe) gameIframe.style.touchAction = 'none';

      document.documentElement.style.overscrollBehavior = 'none';
    } else {
      ui.style.display = 'none';
      lockScrollForGame(false);

      // на странице списка игр скролл должен быть
      document.documentElement.style.overscrollBehavior = 'auto';
      document.documentElement.style.touchAction = '';
      document.body.style.touchAction = '';
    }
  }

  applyMode();

  // если игра создаётся после клика (canvas появляется позже) — отследим
  const obs = new MutationObserver(() => applyMode());
  obs.observe(document.body, { childList: true, subtree: true });

  addEventListener('resize', applyMode);
      }
