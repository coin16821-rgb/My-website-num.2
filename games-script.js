document.addEventListener('DOMContentLoaded', () => {
  initMobileTouchControls();
});

function initMobileTouchControls() {
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!isTouch) return;

  // Показываем на странице games (и на любых страницах игр, если путь содержит "games")
  if (!location.pathname.toLowerCase().includes('games')) return;

  // Запрещаем скролл/подтягивание
  document.documentElement.style.overscrollBehavior = 'none';
  document.documentElement.style.touchAction = 'none';
  document.body.style.touchAction = 'none';

  // CSS инжектим 1 раз
  if (!document.getElementById('touch-controls-style')) {
    const st = document.createElement('style');
    st.id = 'touch-controls-style';
    st.textContent = `
      .touch-ui{position:fixed;inset:0;z-index:9999;pointer-events:none;user-select:none;-webkit-user-select:none}
      .touch-pad,.touch-actions{position:absolute;bottom:14px;display:grid;gap:10px;pointer-events:none}
      .touch-pad{left:14px;grid-template-columns:repeat(2,64px)}
      .touch-actions{right:14px;grid-template-columns:repeat(2,92px);justify-items:end}
      .tbtn{width:64px;height:64px;border-radius:14px;border:1px solid rgba(255,255,255,.18);
        background:rgba(20,30,60,.55);color:#e8e8e8;font-weight:700;pointer-events:auto;touch-action:none}
      .tbtn.big{width:92px}
      @media (max-width:420px){
        .touch-pad{grid-template-columns:repeat(2,56px)}
        .tbtn{width:56px;height:56px}
        .tbtn.big{width:86px}
      }
    `;
    document.head.appendChild(st);
  }

  // UI создаём 1 раз
  if (!document.getElementById('touchUI')) {
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
      const ev = new KeyboardEvent(type, { bubbles:true, cancelable:true, code:k.code, key:k.key });
      try {
        Object.defineProperty(ev, 'keyCode', { get: () => k.keyCode });
        Object.defineProperty(ev, 'which', { get: () => k.keyCode });
      } catch {}
      window.dispatchEvent(ev);
      document.dispatchEvent(ev);
    }

    const press = (act) => (map[act] || []).forEach(k => dispatchKey('keydown', k));
    const rel   = (act) => (map[act] || []).forEach(k => dispatchKey('keyup', k));

    ui.querySelectorAll('[data-act]').forEach(btn => {
      const act = btn.dataset.act;

      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        btn.setPointerCapture(e.pointerId);
        press(act);
      });
      btn.addEventListener('pointerup', (e) => {
        e.preventDefault(); e.stopPropagation();
        rel(act);
      });
      btn.addEventListener('pointercancel', () => rel(act));
      btn.addEventListener('lostpointercapture', () => rel(act));
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) return;
      Object.keys(map).forEach(rel);
    });
  }

  // Если игра создаёт canvas позже — просто ждём (не обязательно, но полезно)
  const obs = new MutationObserver(() => {
    // если хочешь, можно тут включать/выключать UI по наличию canvas
    // сейчас UI всегда показывается на странице games.
  });
  obs.observe(document.body, { childList: true, subtree: true });
}
