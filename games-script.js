(() => {
  // =========================
  //  Input (Keyboard + Touch UI)
  // =========================
  const Input = {
    down: new Set(),
    pressed: new Set(),
    isTouch: (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window),
    map: new Map([
      ['ArrowLeft', 'left'], ['KeyA', 'left'],
      ['ArrowRight', 'right'], ['KeyD', 'right'],
      ['ArrowUp', 'up'], ['KeyW', 'up'],
      ['ArrowDown', 'down'], ['KeyS', 'down'],
      ['Space', 'jump'],
      ['KeyE', 'action'],
      ['Escape', 'pause'], ['KeyP', 'pause'],
    ]),
    keyDown(e) {
      const act = this.map.get(e.code);
      if (!act) return;
      if (!this.down.has(act)) this.pressed.add(act);
      this.down.add(act);
    },
    keyUp(e) {
      const act = this.map.get(e.code);
      if (!act) return;
      this.down.delete(act);
    },
    isDown(act) { return this.down.has(act); },
    wasPressed(act) { return this.pressed.has(act); },
    endFrame() { this.pressed.clear(); },
    axisX() { return (this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0); },
    axisY() { return (this.isDown('down') ? 1 : 0) - (this.isDown('up') ? 1 : 0); },
  };

  // =========================
  //  Canvas helper (fit to CSS size, DPR-safe)
  // =========================
  function makeCanvasAdapter(canvas) {
    const ctx = canvas.getContext('2d', { alpha: false });
    const state = { w: canvas.clientWidth || canvas.width, h: canvas.clientHeight || canvas.height, dpr: 1 };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      state.w = rect.width;
      state.h = rect.height;
      state.dpr = dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize);

    // важно: чтобы палец по canvas не скроллил страницу
    canvas.style.touchAction = 'none';
    canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    // фокус активной игры по тапу
    canvas.addEventListener('pointerdown', () => setActiveGame(canvas.id), { passive: true });
    canvas.addEventListener('touchstart', () => setActiveGame(canvas.id), { passive: true });

    return { canvas, ctx, state, resize };
  }

  // =========================
  //  Active game focus (controls apply to one game)
  // =========================
  let activeGameId = null;
  function setActiveGame(id) {
    activeGameId = id;
  }

  function isActive(id) {
    // если активная не выбрана — разрешим управление всем запущенным (обычно одна игра)
    return !activeGameId || activeGameId === id;
  }

  // =========================
  //  Touch UI (mobile buttons)
  // =========================
  function initTouchUI() {
    if (!Input.isTouch) return;
    if (document.getElementById('touchUI')) return;

    const style = document.createElement('style');
    style.id = 'touch-ui-style';
    style.textContent = `
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
        background: rgba(20,30,60,.55);
        color: #e8e8e8;
        font-weight: 800;
        pointer-events: auto;
        touch-action: none;
      }
      .tbtn.big { width: 92px; }
      @media (max-width: 420px) {
        .touch-pad { grid-template-columns: repeat(2, 56px); }
        .tbtn { width: 56px; height: 56px; }
        .tbtn.big { width: 86px; height: 56px; }
      }
    `;
    document.head.appendChild(style);

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

    const downAct = (act) => {
      if (!Input.down.has(act)) Input.pressed.add(act);
      Input.down.add(act);
    };
    const upAct = (act) => Input.down.delete(act);

    ui.querySelectorAll('[data-act]').forEach(btn => {
      const act = btn.dataset.act;

      const onDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.setPointerCapture?.(e.pointerId);
        downAct(act);
      };
      const onUp = (e) => {
        e.preventDefault();
        e.stopPropagation();
        upAct(act);
      };

      btn.addEventListener('pointerdown', onDown);
      btn.addEventListener('pointerup', onUp);
      btn.addEventListener('pointercancel', () => upAct(act));
      btn.addEventListener('lostpointercapture', () => upAct(act));

      // fallback for older touch
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); downAct(act); }, { passive: false });
      btn.addEventListener('touchend', (e) => { e.preventDefault(); upAct(act); }, { passive: false });
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) return;
      Input.down.clear();
      Input.pressed.clear();
    });
  }

  // =========================
  //  Utils
  // =========================
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);

  // =========================
  //  Games registry + global loop
  // =========================
  const games = [];
  let rafId = 0;
  let lastT = 0;

  function loop(t) {
    const now = t / 1000;
    const dt = Math.min(0.033, now - (lastT || now));
    lastT = now;

    for (const g of games) {
      if (!g.running) continue;
      if (!isActive(g.id)) continue;
      g.update(dt);
    }
    for (const g of games) {
      if (!g.running) continue;
      g.render();
    }

    Input.endFrame();
    rafId = requestAnimationFrame(loop);
  }

  function startMainLoopOnce() {
    if (!rafId) rafId = requestAnimationFrame(loop);
  }

  // =========================
  //  Snake
  // =========================
  function createSnake() {
    const adapter = makeCanvasAdapter(document.getElementById('snakeCanvas'));
    const scoreEl = document.getElementById('snakeScore');

    const s = {
      id: 'snakeCanvas',
      running: false,
      acc: 0,
      step: 0.11,
      grid: 20,
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      body: [],
      food: { x: 10, y: 10 },
      score: 0,

      reset() {
        this.acc = 0;
        this.dir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        this.body = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
        this.spawnFood();
        this.score = 0;
        scoreEl.textContent = '0';
      },

      spawnFood() {
        let ok = false;
        while (!ok) {
          const fx = Math.floor(Math.random() * this.grid);
          const fy = Math.floor(Math.random() * this.grid);
          ok = !this.body.some(p => p.x === fx && p.y === fy);
          if (ok) this.food = { x: fx, y: fy };
        }
      },

      update(dt) {
        // управление
        const left = Input.isDown('left');
        const right = Input.isDown('right');
        const up = Input.isDown('up');
        const down = Input.isDown('down');

        const d = this.dir;
        if (left && d.x !== 1) this.nextDir = { x: -1, y: 0 };
        else if (right && d.x !== -1) this.nextDir = { x: 1, y: 0 };
        else if (up && d.y !== 1) this.nextDir = { x: 0, y: -1 };
        else if (down && d.y !== -1) this.nextDir = { x: 0, y: 1 };

        this.acc += dt;
        while (this.acc >= this.step) {
          this.acc -= this.step;

          this.dir = this.nextDir;
          const head = this.body[0];
          const nx = (head.x + this.dir.x + this.grid) % this.grid;
          const ny = (head.y + this.dir.y + this.grid) % this.grid;

          // self-collision
          if (this.body.some((p, i) => i !== 0 && p.x === nx && p.y === ny)) {
            this.running = false;
            return;
          }

          this.body.unshift({ x: nx, y: ny });

          if (nx === this.food.x && ny === this.food.y) {
            this.score += 10;
            scoreEl.textContent = String(this.score);
            this.spawnFood();
          } else {
            this.body.pop();
          }
        }
      },

      render() {
        const { ctx, state } = adapter;
        const w = state.w, h = state.h;
        const cell = Math.floor(Math.min(w, h) / this.grid);

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#061226';
        ctx.fillRect(0, 0, w, h);

        // food
        ctx.fillStyle = '#ff4d4d';
        ctx.fillRect(this.food.x * cell, this.food.y * cell, cell, cell);

        // snake
        ctx.fillStyle = '#00d4ff';
        for (let i = 0; i < this.body.length; i++) {
          const p = this.body[i];
          ctx.globalAlpha = i === 0 ? 1 : 0.85;
          ctx.fillRect(p.x * cell, p.y * cell, cell, cell);
        }
        ctx.globalAlpha = 1;
      }
    };

    s.reset();
    return s;
  }

  // =========================
  //  Pong
  // =========================
  function createPong() {
    const adapter = makeCanvasAdapter(document.getElementById('pongCanvas'));
    const pScoreEl = document.getElementById('pongPlayerScore');
    const aScoreEl = document.getElementById('pongAIScore');

    const g = {
      id: 'pongCanvas',
      running: false,
      playerY: 120,
      aiY: 120,
      paddleH: 70,
      paddleW: 10,
      ballX: 250,
      ballY: 150,
      ballVX: 220,
      ballVY: 140,
      pScore: 0,
      aScore: 0,

      reset() {
        this.pScore = 0; this.aScore = 0;
        pScoreEl.textContent = '0';
        aScoreEl.textContent = '0';
        this.resetRound();
      },

      resetRound() {
        const { state } = adapter;
        this.playerY = state.h / 2 - this.paddleH / 2;
        this.aiY = state.h / 2 - this.paddleH / 2;
        this.ballX = state.w / 2;
        this.ballY = state.h / 2;
        this.ballVX = (Math.random() < 0.5 ? -1 : 1) * 240;
        this.ballVY = rnd(-160, 160);
      },

      update(dt) {
        const { state } = adapter;

        // player
        const ay = Input.axisY();
        this.playerY += ay * 280 * dt;
        this.playerY = clamp(this.playerY, 0, state.h - this.paddleH);

        // AI
        const target = this.ballY - this.paddleH / 2;
        const aiSpeed = 220;
        this.aiY += clamp(target - this.aiY, -aiSpeed * dt, aiSpeed * dt);
        this.aiY = clamp(this.aiY, 0, state.h - this.paddleH);

        // ball
        this.ballX += this.ballVX * dt;
        this.ballY += this.ballVY * dt;

        // walls
        if (this.ballY < 0) { this.ballY = 0; this.ballVY *= -1; }
        if (this.ballY > state.h) { this.ballY = state.h; this.ballVY *= -1; }

        // paddles collision
        const r = 6;
        // left paddle x=20
        if (this.ballX - r < 20 + this.paddleW &&
            this.ballY > this.playerY &&
            this.ballY < this.playerY + this.paddleH &&
            this.ballVX < 0) {
          this.ballX = 20 + this.paddleW + r;
          this.ballVX *= -1.05;
          this.ballVY += (this.ballY - (this.playerY + this.paddleH / 2)) * 3.5;
        }

        // right paddle x=state.w-30
        const rx = state.w - 30;
        if (this.ballX + r > rx &&
            this.ballY > this.aiY &&
            this.ballY < this.aiY + this.paddleH &&
            this.ballVX > 0) {
          this.ballX = rx - r;
          this.ballVX *= -1.05;
          this.ballVY += (this.ballY - (this.aiY + this.paddleH / 2)) * 3.5;
        }

        // score
        if (this.ballX < -40) {
          this.aScore++;
          aScoreEl.textContent = String(this.aScore);
          this.resetRound();
        }
        if (this.ballX > state.w + 40) {
          this.pScore++;
          pScoreEl.textContent = String(this.pScore);
          this.resetRound();
        }
      },

      render() {
        const { ctx, state } = adapter;
        const w = state.w, h = state.h;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#061226';
        ctx.fillRect(0, 0, w, h);

        // middle line
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // paddles
        ctx.fillStyle = '#00d4ff';
        ctx.fillRect(20, this.playerY, this.paddleW, this.paddleH);
        ctx.fillRect(w - 30, this.aiY, this.paddleW, this.paddleH);

        // ball
        ctx.fillStyle = '#e8e8e8';
        ctx.beginPath();
        ctx.arc(this.ballX, this.ballY, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    g.reset();
    return g;
  }

  // =========================
  //  Shooter
  // =========================
  function createShooter() {
    const adapter = makeCanvasAdapter(document.getElementById('shooterCanvas'));
    const scoreEl = document.getElementById('shooterScore');
    const livesEl = document.getElementById('shooterLives');

    const g = {
      id: 'shooterCanvas',
      running: false,
      x: 240, y: 340,
      vx: 0,
      bullets: [],
      enemies: [],
      spawnT: 0,
      score: 0,
      lives: 3,
      fireCd: 0,

      reset() {
        const { state } = adapter;
        this.x = state.w / 2;
        this.y = state.h - 40;
        this.bullets = [];
        this.enemies = [];
        this.spawnT = 0;
        this.score = 0;
        this.lives = 3;
        this.fireCd = 0;
        scoreEl.textContent = '0';
        livesEl.textContent = '3';
      },

      update(dt) {
        const { state } = adapter;

        this.vx = Input.axisX() * 320;
        this.x += this.vx * dt;
        this.x = clamp(this.x, 20, state.w - 20);

        // fire (Space = jump)
        this.fireCd -= dt;
        if (Input.isDown('jump') && this.fireCd <= 0) {
          this.fireCd = 0.18;
          this.bullets.push({ x: this.x, y: this.y - 18, vy: -520 });
        }

        // spawn enemies
        this.spawnT += dt;
        if (this.spawnT > 0.7) {
          this.spawnT = 0;
          this.enemies.push({ x: rnd(20, state.w - 20), y: -20, vy: rnd(40, 95), r: rnd(10, 16) });
        }

        // bullets
        for (const b of this.bullets) b.y += b.vy * dt;
        this.bullets = this.bullets.filter(b => b.y > -50);

        // enemies
        for (const e of this.enemies) e.y += e.vy * dt;

        // collisions bullet-enemy
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const e = this.enemies[i];
          let hit = false;
          for (let j = this.bullets.length - 1; j >= 0; j--) {
            const b = this.bullets[j];
            const d = Math.hypot(b.x - e.x, b.y - e.y);
            if (d < e.r + 4) {
              hit = true;
              this.bullets.splice(j, 1);
              break;
            }
          }
          if (hit) {
            this.enemies.splice(i, 1);
            this.score += 10;
            scoreEl.textContent = String(this.score);
          }
        }

        // collision enemy-player / enemy-pass
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const e = this.enemies[i];
          if (e.y > state.h + 30) {
            this.enemies.splice(i, 1);
            continue;
          }
          const d = Math.hypot(this.x - e.x, this.y - e.y);
          if (d < e.r + 14) {
            this.enemies.splice(i, 1);
            this.lives--;
            livesEl.textContent = String(this.lives);
            if (this.lives <= 0) this.running = false;
          }
        }
      },

      render() {
        const { ctx, state } = adapter;
        const w = state.w, h = state.h;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#061226';
        ctx.fillRect(0, 0, w, h);

        // player
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 16);
        ctx.lineTo(this.x - 14, this.y + 14);
        ctx.lineTo(this.x + 14, this.y + 14);
        ctx.closePath();
        ctx.fill();

        // bullets
        ctx.fillStyle = '#e8e8e8';
        for (const b of this.bullets) ctx.fillRect(b.x - 2, b.y - 8, 4, 12);

        // enemies
        ctx.fillStyle = '#ff4d4d';
        for (const e of this.enemies) {
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    g.reset();
    return g;
  }

  // =========================
  //  Dodge
  // =========================
  function createDodge() {
    const adapter = makeCanvasAdapter(document.getElementById('dodgeCanvas'));
    const scoreEl = document.getElementById('dodgeScore');
    const timeEl = document.getElementById('dodgeTime');

    const g = {
      id: 'dodgeCanvas',
      running: false,
      x: 200, y: 430,
      score: 0,
      t: 0,
      hazards: [],
      spawn: 0,

      reset() {
        const { state } = adapter;
        this.x = state.w / 2;
        this.y = state.h - 30;
        this.score = 0;
        this.t = 0;
        this.hazards = [];
        this.spawn = 0;
        scoreEl.textContent = '0';
        timeEl.textContent = '0';
      },

      update(dt) {
        const { state } = adapter;

        this.t += dt;
        timeEl.textContent = String(Math.floor(this.t));
        this.score += dt * 10;
        scoreEl.textContent = String(Math.floor(this.score));

        const ax = Input.axisX();
        const ay = Input.axisY();
        this.x += ax * 320 * dt;
        this.y += ay * 320 * dt;
        this.x = clamp(this.x, 14, state.w - 14);
        this.y = clamp(this.y, 14, state.h - 14);

        this.spawn += dt;
        if (this.spawn > 0.55) {
          this.spawn = 0;
          this.hazards.push({ x: rnd(10, state.w - 10), y: -20, vy: rnd(180, 340), r: rnd(10, 18) });
        }

        for (const h of this.hazards) h.y += h.vy * dt;
        this.hazards = this.hazards.filter(h => h.y < state.h + 60);

        // collision
        for (const h of this.hazards) {
          const d = Math.hypot(this.x - h.x, this.y - h.y);
          if (d < h.r + 12) {
            this.running = false;
            break;
          }
        }
      },

      render() {
        const { ctx, state } = adapter;
        const w = state.w, h = state.h;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#061226';
        ctx.fillRect(0, 0, w, h);

        // player
        ctx.fillStyle = '#00d4ff';
        ctx.fillRect(this.x - 12, this.y - 12, 24, 24);

        // hazards
        ctx.fillStyle = '#ff4d4d';
        for (const hz of this.hazards) {
          ctx.beginPath();
          ctx.arc(hz.x, hz.y, hz.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    g.reset();
    return g;
  }

  // =========================
//  Breakout
// =========================
function createBreakout() {
  const adapter = makeCanvasAdapter(document.getElementById('breakoutCanvas'));
  const scoreEl = document.getElementById('breakoutScore');
  const blocksEl = document.getElementById('breakoutBlocks');

  const g = {
    id: 'breakoutCanvas',
    running: false,
    score: 0,
    paddleX: 200,
    paddleW: 90,
    ballX: 250,
    ballY: 260,
    ballVX: 170,
    ballVY: -220,
    bricks: [],
    cols: 10,
    rows: 3,

    reset() {
      const { state } = adapter;
      this.score = 0;
      scoreEl.textContent = '0';

      this.paddleW = 100;
      this.paddleX = state.w / 2;
      this.ballX = state.w / 2;
      this.ballY = state.h * 0.65;
      this.ballVX = 170 * (Math.random() < 0.5 ? -1 : 1);
      this.ballVY = -220;

      this.bricks = [];
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          this.bricks.push({ r, c, alive: true });
        }
      }
      blocksEl.textContent = String(this.bricks.filter(b => b.alive).length);
    },

    update(dt) {
      const { state } = adapter;

      const ax = Input.axisX();
      this.paddleX += ax * 420 * dt;
      this.paddleX = clamp(this.paddleX, this.paddleW / 2 + 10, state.w - this.paddleW / 2 - 10);

      this.ballX += this.ballVX * dt;
      this.ballY += this.ballVY * dt;

      // walls
      if (this.ballX < 8) { this.ballX = 8; this.ballVX *= -1; }
      if (this.ballX > state.w - 8) { this.ballX = state.w - 8; this.ballVX *= -1; }
      if (this.ballY < 8) { this.ballY = 8; this.ballVY *= -1; }

      // paddle
      const py = state.h - 24;
      if (this.ballY + 8 > py &&
          this.ballX > this.paddleX - this.paddleW / 2 &&
          this.ballX < this.paddleX + this.paddleW / 2 &&
          this.ballVY > 0) {
        this.ballY = py - 8;
        this.ballVY *= -1;
        const hit = (this.ballX - this.paddleX) / (this.paddleW / 2);
        this.ballVX += hit * 60;
      }

      // bricks
      const top = 40;
      const pad = 8;
      const bw = (state.w - pad * 2) / this.cols;
      const bh = 18;

      for (const b of this.bricks) {
        if (!b.alive) continue;
        const x0 = pad + b.c * bw;
        const y0 = top + b.r * (bh + 8);

        if (this.ballX > x0 && this.ballX < x0 + bw &&
            this.ballY > y0 && this.ballY < y0 + bh) {
          b.alive = false;
          this.ballVY *= -1;
          this.score += 5;
          scoreEl.textContent = String(this.score);
          blocksEl.textContent = String(this.bricks.filter(x => x.alive).length);
          break;
        }
      }

      // lose
      if (this.ballY > state.h + 30) {
        this.running = false;
      }

      // win
      if (this.bricks.every(b => !b.alive)) {
        this.running = false;
      }
    },

    render() {
      const { ctx, state } = adapter;
      const w = state.w, h = state.h;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#061226';
      ctx.fillRect(0, 0, w, h);

      // bricks
      const top = 40;
      const pad = 8;
      const bw = (w - pad * 2) / this.cols;
      const bh = 18;
      for (const b of this.bricks) {
        if (!b.alive) continue;
        const x0 = pad + b.c * bw;
        const y0 = top + b.r * (bh + 8);
        ctx.fillStyle = 'rgba(0,212,255,0.55)';
        ctx.fillRect(x0 + 1, y0 + 1, bw - 2, bh - 2);
      }

      // paddle
      ctx.fillStyle = '#e8e8e8';
      const py = h - 24;
      ctx.fillRect(this.paddleX - this.paddleW / 2, py, this.paddleW, 10);

      // ball
      ctx.beginPath();
      ctx.arc(this.ballX, this.ballY, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  g.reset();
  return g;
}

// =========================
//  Platformer (simple)
// =========================
function createPlatformer() {
  const adapter = makeCanvasAdapter(document.getElementById('platformerCanvas'));
  const scoreEl = document.getElementById('platformerScore');
  const coinsEl = document.getElementById('platformerCoins');

  const g = {
    id: 'platformerCanvas',
    running: false,
    score: 0,
    coins: 0,

    x: 80, y: 200,
    vx: 0, vy: 0,
    onGround: false,

    platforms: [],
    coinList: [],

    reset() {
      const { state } = adapter;
      this.score = 0;
      this.coins = 0;
      scoreEl.textContent = '0';
      coinsEl.textContent = '0';

      this.x = 60;
      this.y = state.h - 80;
      this.vx = 0;
      this.vy = 0;
      this.onGround = false;

      // simple level
      this.platforms = [
        { x: 0, y: state.h - 30, w: state.w, h: 30 },
        { x: 80, y: state.h - 120, w: 120, h: 14 },
        { x: 250, y: state.h - 190, w: 140, h: 14 },
        { x: 120, y: state.h - 260, w: 120, h: 14 },
      ];

      this.coinList = [
        { x: 120, y: state.h - 140, taken: false },
        { x: 290, y: state.h - 210, taken: false },
        { x: 150, y: state.h - 280, taken: false },
      ];
    },

    update(dt) {
      const { state } = adapter;

      const ax = Input.axisX();
      this.vx = ax * 220;

      // jump (Space)
      if (Input.wasPressed('jump') && this.onGround) {
        this.vy = -420;
        this.onGround = false;
      }

      // gravity
      this.vy += 900 * dt;

      // integrate
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // bounds
      this.x = clamp(this.x, 10, state.w - 30);

      // collision with platforms (AABB)
      this.onGround = false;
      for (const p of this.platforms) {
        if (this.x + 24 > p.x && this.x < p.x + p.w &&
            this.y + 24 > p.y && this.y < p.y + p.h) {
          // landing from above
          if (this.vy > 0 && (this.y + 24 - this.vy * dt) <= p.y) {
            this.y = p.y - 24;
            this.vy = 0;
            this.onGround = true;
          }
        }
      }

      // coins
      for (const c of this.coinList) {
        if (c.taken) continue;
        const dx = (this.x + 12) - c.x;
        const dy = (this.y + 12) - c.y;
        if (Math.hypot(dx, dy) < 18) {
          c.taken = true;
          this.coins++;
          this.score += 50;
          coinsEl.textContent = String(this.coins);
          scoreEl.textContent = String(this.score);
        }
      }

      // fall off
      if (this.y > state.h + 60) {
        this.running = false;
      }
    },

    render() {
      const { ctx, state } = adapter;
      const w = state.w, h = state.h;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#061226';
      ctx.fillRect(0, 0, w, h);

      // platforms
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (const p of this.platforms) ctx.fillRect(p.x, p.y, p.w, p.h);

      // coins
      for (const c of this.coinList) {
        if (c.taken) continue;
        ctx.fillStyle = '#ffd54d';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // player
      ctx.fillStyle = '#00d4ff';
      ctx.fillRect(this.x, this.y, 24, 24);
    }
  };

  g.reset();
  return g;
}

// =========================
//  Public start/reset functions (called from HTML onclick)
// =========================
function bindPublicAPI(snake, pong, shooter, dodge, breakout, platformer) {
  window.startSnake = () => { setActiveGame('snakeCanvas'); snake.running = true; startMainLoopOnce(); };
  window.resetSnake = () => { snake.reset(); snake.running = false; };

  window.startPong = () => { setActiveGame('pongCanvas'); pong.running = true; startMainLoopOnce(); };
  window.resetPong = () => { pong.reset(); pong.running = false; };

  window.startShooter = () => { setActiveGame('shooterCanvas'); shooter.running = true; startMainLoopOnce(); };
  window.resetShooter = () => { shooter.reset(); shooter.running = false; };

  window.startDodge = () => { setActiveGame('dodgeCanvas'); dodge.running = true; startMainLoopOnce(); };
  window.resetDodge = () => { dodge.reset(); dodge.running = false; };

  window.startBreakout = () => { setActiveGame('breakoutCanvas'); breakout.running = true; startMainLoopOnce(); };
  window.resetBreakout = () => { breakout.reset(); breakout.running = false; };

  window.startPlatformer = () => { setActiveGame('platformerCanvas'); platformer.running = true; startMainLoopOnce(); };
  window.resetPlatformer = () => { platformer.reset(); platformer.running = false; };
}

// =========================
//  Boot
// =========================
document.addEventListener('DOMContentLoaded', () => {
  // Keyboard listeners
  window.addEventListener('keydown', (e) => Input.keyDown(e));
  window.addEventListener('keyup', (e) => Input.keyUp(e));

  initTouchUI();

  // Create games
  const snake = createSnake();
  const pong = createPong();
  const shooter = createShooter();
  const dodge = createDodge();
  const breakout = createBreakout();
  const platformer = createPlatformer();

  games.push(snake, pong, shooter, dodge, breakout, platformer);

  bindPublicAPI(snake, pong, shooter, dodge, breakout, platformer);

  // ничего не запускаем, пока не нажали "Начать"
});
