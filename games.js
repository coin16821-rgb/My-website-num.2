(() => {
  'use strict';

  // ---------------- Settings ----------------
  const Settings = {
    difficulty: 1,
    showTouch: true,
    showFps: false,
    vibrate: false,
    load() {
      try {
        const s = JSON.parse(localStorage.getItem('gamesSettings') || '{}');
        Object.assign(this, s);
      } catch {}
    },
    save() {
      localStorage.setItem('gamesSettings', JSON.stringify({
        difficulty: this.difficulty,
        showTouch: this.showTouch,
        showFps: this.showFps,
        vibrate: this.vibrate,
      }));
    }
  };

  const isTouch =
    (window.matchMedia && matchMedia('(pointer: coarse)').matches) ||
    ('ontouchstart' in window);

  const $ = (id) => document.getElementById(id);
  const setHidden = (el, v) => { if (el) el.hidden = !!v; };

  // ---------------- DOM ----------------
  const canvas = $('game');
  if (!canvas) return console.error('Canvas #game не найден');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return console.error('Не удалось получить 2D context');

  const menu = $('menu');
  const hud = $('hud');
  const hudLeft = $('hudLeft');
  const pausePanel = $('pause');
  const settingsModal = $('settings');
  const touchUI = $('touchUI');
  const fpsEl = $('fps');

  const btnSettings = $('btnSettings');
  const btnPause = $('btnPause');
  const btnResume = $('btnResume');
  const btnRestart = $('btnRestart');
  const btnToMenu = $('btnToMenu');
  const btnCloseSettings = $('btnCloseSettings');

  const difficultySel = $('difficulty');
  const showTouchChk = $('showTouch');
  const showFpsChk = $('showFps');
  const vibrateChk = $('vibrate');

  // ---------------- Canvas resize ----------------
  let W = 1, H = 1, DPR = 1;
  let resizeTimeout = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, Math.round(rect.width));
    const cssH = Math.max(1, Math.round(rect.height));

    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = cssW;
    H = cssH;

    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function resizeHandler() {
    window.clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(resize, 16);
  }
  window.addEventListener('resize', resizeHandler, { passive: true });

  // ---------------- Input ----------------
  const Input = {
    down: new Set(),
    pressed: new Set(),
    keyMap: new Map([
      ['ArrowLeft','left'], ['KeyA','left'],
      ['ArrowRight','right'], ['KeyD','right'],
      ['ArrowUp','up'], ['KeyW','up'],
      ['ArrowDown','down'], ['KeyS','down'],
      ['Space','a'],
      ['ShiftLeft','b'], ['ShiftRight','b'],
      ['KeyE','b'],
      ['Escape','pause'], ['KeyP','pause'],
    ]),
    axisX() { return (this.down.has('right') ? 1 : 0) - (this.down.has('left') ? 1 : 0); },
    axisY() { return (this.down.has('down') ? 1 : 0) - (this.down.has('up') ? 1 : 0); },
    was(act) { return this.pressed.has(act); },
    is(act) { return this.down.has(act); },
    endFrame(){ this.pressed.clear(); }
  };

  window.addEventListener('keydown', (e) => {
    if (settingsModal && !settingsModal.hidden) {
      if (e.key === 'Escape') closeSettings();
      return;
    }
    const act = Input.keyMap.get(e.code);
    if (!act) return;
    if (!Input.down.has(act)) Input.pressed.add(act);
    Input.down.add(act);
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) e.preventDefault();
  }, { passive: false });

  window.addEventListener('keyup', (e) => {
    const act = Input.keyMap.get(e.code);
    if (!act) return;
    Input.down.delete(act);
  });

  function initTouchButtons() {
    if (!isTouch || !touchUI) return;
    touchUI.querySelectorAll('[data-act]').forEach(btn => {
      const act = btn.dataset.act;

      const down = (e) => {
        e.preventDefault();
        btn.setPointerCapture?.(e.pointerId);
        if (!Input.down.has(act)) Input.pressed.add(act);
        Input.down.add(act);
      };
      const up = (e) => {
        e.preventDefault();
        Input.down.delete(act);
      };

      btn.addEventListener('pointerdown', down, { passive:false });
      btn.addEventListener('pointerup', up, { passive:false });
      btn.addEventListener('pointercancel', up, { passive:false });
      btn.addEventListener('lostpointercapture', up, { passive:false });
    });
  }

  // ---------------- Helpers ----------------
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const rnd = (a,b)=>a+Math.random()*(b-a);
  const len = (x,y)=>Math.hypot(x,y);
  const norm = (x,y)=>{ const d=Math.hypot(x,y)||1; return {x:x/d,y:y/d}; };
  const vib = (ms)=>{ if (Settings.vibrate && navigator.vibrate) navigator.vibrate(ms); };

  function rectHit(ax,ay,aw,ah,bx,by,bw,bh){
    return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
  }

  function drawCenterText(text, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, H/2 - 36, W, 72);
    ctx.fillStyle = color;
    ctx.font = '800 18px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W/2, H/2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // ---------------- Game framework ----------------
  class BaseGame {
    constructor(name){ this.name=name; this.level=1; this.done=false; this.over=false; }
    reset(){ this.done=false; this.over=false; }
    update(dt){}
    draw(ctx){}
    hud(){ return `${this.name} | Level ${this.level}`; }
  }

  // 1) Astro Runner
  class AstroRunner extends BaseGame {
    constructor(){ super('Astro Runner'); this.reset(); }
    reset(){
      super.reset();
      this.t = 0;
      this.fuel = 1;
      this.x = W*0.25; this.y = H*0.6;
      this.goalTime = [18, 22, 26][this.level-1] ?? 26;
      this.speed = (170 + this.level*30) * Settings.difficulty;
      this.ob = [];
      this.pick = [];
      this.spawn = 0;
      this.collected = 0;
      this.need = [4,5,6][this.level-1] ?? 6;
    }
    nextLevel(){ this.level = Math.min(3, this.level+1); this.reset(); }
    update(dt){
      this.t += dt;
      this.spawn += dt;

      const ax = Input.axisX();
      const ay = Input.axisY();
      this.x += ax * 260 * dt;
      this.y += ay * 260 * dt;
      this.x = clamp(this.x, 16, W-16);
      this.y = clamp(this.y, 16, H-16);

      this.fuel -= dt * 0.035 * Settings.difficulty;
      this.fuel = clamp(this.fuel, 0, 1);
      if (this.fuel <= 0) { this.over = true; vib(80); }

      if (this.spawn > 0.55) {
        this.spawn = 0;
        const laneY = rnd(30, H-30);
        const s = rnd(24, 46);
        this.ob.push({ x: W + 60, y: laneY, w: s, h: s, vx: -this.speed });
        if (Math.random() < 0.45) this.pick.push({ x: W + 60, y: rnd(30, H-30), r: 9, vx: -this.speed });
      }

      for (const o of this.ob) o.x += o.vx * dt;
      for (const p of this.pick) p.x += p.vx * dt;
      this.ob = this.ob.filter(o => o.x > -100);
      this.pick = this.pick.filter(p => p.x > -100);

      for (const o of this.ob) {
        if (rectHit(this.x-12,this.y-12,24,24, o.x-o.w/2,o.y-o.h/2,o.w,o.h)) {
          this.over = true; vib(120);
        }
      }
      for (const p of this.pick) {
        if (!p.dead && len(this.x-p.x, this.y-p.y) < 18) {
          p.dead = true;
          this.fuel = clamp(this.fuel + 0.22, 0, 1);
          this.collected++;
          vib(20);
        }
      }

      if (this.t >= this.goalTime && this.collected >= this.need) {
        if (this.level < 3) this.nextLevel();
        else this.done = true;
      }
    }
    hud(){
      return `${super.hud()} | Fuel ${(this.fuel*100|0)}% | Cells ${this.collected}/${this.need} | Time ${(this.t|0)}/${this.goalTime}`;
    }
    draw(ctx){
      ctx.fillStyle = '#061226'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      for (let i=0;i<70;i++) ctx.fillRect((i*97)%W, (i*53)%H, 1, 1);

      ctx.fillStyle = '#ff4d4d';
      for (const o of this.ob) ctx.fillRect(o.x-o.w/2, o.y-o.h/2, o.w, o.h);

      ctx.fillStyle = '#ffd54d';
      for (const p of this.pick) if(!p.dead){
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      }

      ctx.fillStyle = '#00d4ff';
      ctx.fillRect(this.x-12,this.y-12,24,24);

      if (this.over) drawCenterText('Поражение. Нажми Рестарт', '#ff4d4d');
      if (this.done) drawCenterText('Победа! Все сектора пройдены', '#00ffb3');
    }
  }

  // 2) Neon Shooter
  class NeonShooter extends BaseGame {
    constructor(){ super('Neon Shooter'); this.reset(); }
    reset(){
      super.reset();
      this.player = { x: W/2, y: H-60, fire:0, hp: 3 };
      this.bullets = [];
      this.enemies = [];
      this.kills = 0;
      this.needKills = [10, 14, 18][this.level-1] ?? 18;
      this.spawn = 0;
    }
    nextLevel(){ this.level = Math.min(3, this.level+1); this.reset(); }
    update(dt){
      const p = this.player;
      p.x += Input.axisX()*320*dt;
      p.y += Input.axisY()*320*dt;
      p.x = clamp(p.x, 20, W-20);
      p.y = clamp(p.y, 20, H-20);

      p.fire -= dt;
      if (Input.is('a') && p.fire <= 0) {
        p.fire = 0.18;
        this.bullets.push({ x:p.x, y:p.y-18, vy:-520 });
      }

      this.spawn += dt;
      const rate = 0.65 / Settings.difficulty;
      if (this.spawn > rate) {
        this.spawn = 0;
        const sp = (70 + this.level*25) * Settings.difficulty;
        this.enemies.push({ x:rnd(20,W-20), y:-20, vy:sp, r:rnd(10,16), hp:(this.level>=3?2:1) });
      }

      for (const b of this.bullets) b.y += b.vy*dt;
      this.bullets = this.bullets.filter(b => b.y > -40);

      for (const e of this.enemies) e.y += e.vy*dt;

      for (let i=this.enemies.length-1;i>=0;i--){
        const e = this.enemies[i];
        for (let j=this.bullets.length-1;j>=0;j--){
          const b = this.bullets[j];
          if (len(b.x-e.x,b.y-e.y) < e.r+5){
            this.bullets.splice(j,1);
            e.hp--;
            if (e.hp<=0){
              this.enemies.splice(i,1);
              this.kills++;
              vib(12);
            }
            break;
          }
        }
      }

      for (let i=this.enemies.length-1;i>=0;i--){
        const e = this.enemies[i];
        if (e.y > H+40){ this.enemies.splice(i,1); continue; }
        if (len(p.x-e.x,p.y-e.y) < e.r+14){
          this.enemies.splice(i,1);
          p.hp--;
          vib(80);
          if (p.hp<=0) this.over = true;
        }
      }

      if (this.kills >= this.needKills) {
        if (this.level < 3) this.nextLevel();
        else this.done = true;
      }
    }
    hud(){ return `${super.hud()} | HP ${this.player.hp} | Kills ${this.kills}/${this.needKills}`; }
    draw(ctx){
      ctx.fillStyle='#061226';ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#ff4d4d';
      for (const e of this.enemies){ ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill(); }
      ctx.fillStyle='#e8e8e8';
      for (const b of this.bullets) ctx.fillRect(b.x-2,b.y-8,4,12);
      ctx.fillStyle='#00d4ff';
      ctx.beginPath();
      ctx.moveTo(this.player.x, this.player.y-16);
      ctx.lineTo(this.player.x-14, this.player.y+14);
      ctx.lineTo(this.player.x+14, this.player.y+14);
      ctx.closePath();
      ctx.fill();

      if (this.over) drawCenterText('Поражение. Нажми Рестарт', '#ff4d4d');
      if (this.done) drawCenterText('Победа! Волны очищены', '#00ffb3');
    }
  }

  // 3) Blade Arena
  class BladeArena extends BaseGame {
    constructor(){ super('Blade Arena'); this.reset(); }
    reset(){
      super.reset();
      this.p = { x: W/2, y: H/2, hp: 3, dash: 0 };
      this.en = [];
      this.toKill = [6, 8, 10][this.level-1] ?? 10;
      this.killed = 0;
      for (let i=0;i<this.toKill;i++){
        this.en.push({ x:rnd(30,W-30), y:rnd(30,H-30), hp:1, r:10, sp:(70+this.level*18)*Settings.difficulty });
      }
    }
    nextLevel(){ this.level = Math.min(3, this.level+1); this.reset(); }
    update(dt){
      const p=this.p;
      const ax=Input.axisX(), ay=Input.axisY();
      const vx = ax * 220, vy = ay * 220;

      p.dash -= dt;

      if (Input.was('b') && p.dash <= 0){
        p.dash = 0.9;
        const d = norm(ax || (Math.random()<0.5?-1:1), ay || 0);
        p.x += d.x * 70;
        p.y += d.y * 70;
        vib(20);
        for (const e of this.en){
          if (e.hp>0 && len(p.x-e.x,p.y-e.y) < 38) e.hp = 0;
        }
      }

      p.x += vx*dt; p.y += vy*dt;
      p.x = clamp(p.x, 16, W-16);
      p.y = clamp(p.y, 16, H-16);

      for (const e of this.en){
        if (e.hp<=0) continue;
        const d = norm(p.x-e.x, p.y-e.y);
        e.x += d.x * e.sp * dt;
        e.y += d.y * e.sp * dt;

        if (len(p.x-e.x,p.y-e.y) < e.r+12){
          e.hp = 0;
          p.hp--;
          vib(90);
          if (p.hp<=0) this.over = true;
        }
      }

      const alive = this.en.filter(e => e.hp>0).length;
      this.killed = this.toKill - alive;

      if (this.killed >= this.toKill) {
        if (this.level < 3) this.nextLevel();
        else this.done = true;
      }
    }
    hud(){
      return `${super.hud()} | HP ${this.p.hp} | Dash ${(this.p.dash>0?this.p.dash.toFixed(1):'ready')} | Kills ${this.killed}/${this.toKill}`;
    }
    draw(ctx){
      ctx.fillStyle='#061226';ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='rgba(255,255,255,0.10)';
      ctx.beginPath(); ctx.arc(W/2,H/2,Math.min(W,H)*0.35,0,Math.PI*2); ctx.stroke();

      ctx.fillStyle='#ff4d4d';
      for (const e of this.en){
        if (e.hp<=0) continue;
        ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill();
      }

      ctx.fillStyle='#00d4ff';
      ctx.fillRect(this.p.x-12,this.p.y-12,24,24);

      if (this.over) drawCenterText('Поражение. Нажми Рестарт', '#ff4d4d');
      if (this.done) drawCenterText('Победа! Арена очищена', '#00ffb3');
    }
  }

  // 4) Breakout X
  class BreakoutX extends BaseGame {
    constructor(){ super('Breakout X'); this.reset(); }
    reset(){
      super.reset();
      this.score = 0;
      this.cols = 10;
      this.rows = 4;
      this.paddleW = 110;
      this.paddleX = W/2;
      this.ball = { x: W/2, y: H*0.65, vx: 170*(Math.random()<0.5?-1:1), vy: -220 };
      this.bricks = [];
      const L = ([0,1,2][this.level-1] ?? 2);
      for (let r=0;r<this.rows;r++){
        for (let c=0;c<this.cols;c++){
          let alive = true;
          if (L===1) alive = (r+c)%2===0;
          if (L===2) alive = (r===0 || r===3 || c===0 || c===9);
          this.bricks.push({ r,c, alive });
        }
      }
      this.bricksLeft = this.bricks.filter(b=>b.alive).length;
    }
    nextLevel(){ this.level=Math.min(3,this.level+1); this.reset(); }
    update(dt){
      this.paddleX += Input.axisX()*520*dt;
      this.paddleX = clamp(this.paddleX, this.paddleW/2+10, W - this.paddleW/2-10);

      this.ball.x += this.ball.vx * dt;
      this.ball.y += this.ball.vy * dt;

      if (this.ball.x < 8){ this.ball.x=8; this.ball.vx*=-1; }
      if (this.ball.x > W-8){ this.ball.x=W-8; this.ball.vx*=-1; }
      if (this.ball.y < 8){ this.ball.y=8; this.ball.vy*=-1; }

      const py = H-26;
      if (this.ball.y+8 > py &&
          this.ball.x > this.paddleX-this.paddleW/2 &&
          this.ball.x < this.paddleX+this.paddleW/2 &&
          this.ball.vy>0){
        this.ball.y = py-8;
        this.ball.vy *= -1;
        const hit = (this.ball.x - this.paddleX)/(this.paddleW/2);
        this.ball.vx += hit*80;
      }

      const top=20, pad=10;
      const bw = (W - pad*2)/this.cols;
      const bh = 18;
      for (const b of this.bricks){
        if (!b.alive) continue;
        const x0 = pad + b.c*bw;
        const y0 = top + b.r*(bh+8);
        if (this.ball.x > x0 && this.ball.x < x0+bw &&
            this.ball.y > y0 && this.ball.y < y0+bh){
          b.alive=false;
          this.ball.vy*=-1;
          this.score += 5;
          this.bricksLeft--;
          vib(10);
          break;
        }
      }

      if (this.ball.y > H+30){ this.over = true; vib(90); }
      if (this.bricksLeft<=0){
        if (this.level<3) this.nextLevel();
        else this.done=true;
      }
    }
    hud(){ return `${super.hud()} | Score ${this.score} | Bricks ${this.bricksLeft}`; }
    draw(ctx){
      ctx.fillStyle='#061226';ctx.fillRect(0,0,W,H);

      const top=20, pad=10;
      const bw = (W - pad*2)/this.cols;
      const bh = 18;
      for (const b of this.bricks){
        if (!b.alive) continue;
        const x0 = pad + b.c*bw;
        const y0 = top + b.r*(bh+8);
        ctx.fillStyle='rgba(0,212,255,0.55)';
        ctx.fillRect(x0+1,y0+1,bw-2,bh-2);
      }

      ctx.fillStyle='#e8e8e8';
      ctx.fillRect(this.paddleX-this.paddleW/2, H-26, this.paddleW, 10);
      ctx.beginPath(); ctx.arc(this.ball.x,this.ball.y,8,0,Math.PI*2); ctx.fill();

      if (this.over) drawCenterText('Поражение. Нажми Рестарт', '#ff4d4d');
      if (this.done) drawCenterText('Победа! Блоки разбиты', '#00ffb3');
    }
  }

  // 5) Escort Protocol
  class EscortProtocol extends BaseGame {
    constructor(){ super('Escort Protocol'); this.reset(); }
    reset(){
      super.reset();
      this.t = 0;
      this.cargo = { x: 60, y: H/2, hp: 5 };
      this.p = { x: 60, y: H/2+80, fire:0 };
      this.bullets = [];
      this.en = [];
      this.spawn = 0;
    }
    nextLevel(){ this.level=Math.min(3,this.level+1); this.reset(); }
    update(dt){
      this.t += dt;
      const sp = (60 + this.level*20) * Settings.difficulty;
      this.cargo.x += sp * dt;
      this.cargo.y += Math.sin(this.t*0.7) * 18 * dt;

      this.p.x += Input.axisX()*300*dt;
      this.p.y += Input.axisY()*300*dt;
      this.p.x = clamp(this.p.x, 20, W-20);
      this.p.y = clamp(this.p.y, 20, H-20);

      this.p.fire -= dt;
      if (Input.is('a') && this.p.fire<=0){
        this.p.fire = 0.20;
        this.bullets.push({ x:this.p.x, y:this.p.y, vx: 520, vy: rnd(-40,40) });
      }

      this.spawn += dt;
      if (this.spawn > 0.70/Settings.difficulty){
        this.spawn = 0;
        this.en.push({ x: W+30, y: rnd(30,H-30), vx: -rnd(90,170)*Settings.difficulty, r: rnd(10,16), hp: (this.level>=3?2:1) });
      }

      for (const b of this.bullets){ b.x += b.vx*dt; b.y += b.vy*dt; }
      this.bullets = this.bullets.filter(b => b.x < W+60);
      for (const e of this.en){ e.x += e.vx*dt; }

      for (let i=this.en.length-1;i>=0;i--){
        const e=this.en[i];
        for (let j=this.bullets.length-1;j>=0;j--){
          const b=this.bullets[j];
          if (len(b.x-e.x,b.y-e.y) < e.r+5){
            this.bullets.splice(j,1);
            e.hp--;
            if (e.hp<=0){ this.en.splice(i,1); vib(10); }
            break;
          }
        }
      }

      for (let i=this.en.length-1;i>=0;i--){
        const e=this.en[i];
        if (e.x < -60){ this.en.splice(i,1); continue; }
        if (len(e.x-this.cargo.x, e.y-this.cargo.y) < e.r+18){
          this.en.splice(i,1);
          this.cargo.hp--;
          vib(90);
          if (this.cargo.hp<=0) this.over = true;
        }
      }

      if (this.cargo.x >= W - 40){
        if (this.level<3) this.nextLevel();
        else this.done = true;
      }
    }
    hud(){ return `${super.hud()} | Cargo HP ${this.cargo.hp} | Dist ${(this.cargo.x|0)}/${W-40}`; }
    draw(ctx){
      ctx.fillStyle='#061226';ctx.fillRect(0,0,W,H);
      ctx.fillStyle='rgba(0,212,255,0.08)';
      ctx.fillRect(W-60, 10, 50, H-20);

      ctx.fillStyle='#ffd54d';
      ctx.fillRect(this.cargo.x-14,this.cargo.y-10,28,20);

      ctx.fillStyle='#00d4ff';
      ctx.fillRect(this.p.x-12,this.p.y-12,24,24);

      ctx.fillStyle='#e8e8e8';
      for (const b of this.bullets) ctx.fillRect(b.x-2,b.y-2,4,4);

      ctx.fillStyle='#ff4d4d';
      for (const e of this.en){ ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill(); }

      if (this.over) drawCenterText('Поражение. Груз уничтожен', '#ff4d4d');
      if (this.done) drawCenterText('Победа! Сопровождение завершено', '#00ffb3');
    }
  }

  // 6) Hack & Hide
  class HackHide extends BaseGame {
    constructor(){ super('Hack & Hide'); this.reset(); }
    reset(){
      super.reset();
      this.p = { x: 60, y: H-80 };
      this.hack = { t:0, need: 2.6 / Settings.difficulty };

      const layouts = [
        { t:[{x:W-80,y:60},{x:W-80,y:H-60},{x:W/2,y:H/2}], g:[{x:W/2,y:100,r:120,sp:0.7}] },
        { t:[{x:W-80,y:H-60},{x:W/2,y:60},{x:W/2,y:H-60}], g:[{x:W/2,y:H/2,r:160,sp:0.9},{x:W/2,y:90,r:100,sp:1.1}] },
        { t:[{x:W-80,y:60},{x:W-80,y:H-60},{x:W/2,y:H/2}], g:[{x:W/2,y:H/2,r:220,sp:1.1}] },
      ][this.level-1];

      this.terminals = layouts.t.map(p => ({...p, done:false}));
      this.guards = layouts.g.map((g,i)=>({ x:g.x, y:g.y, r:g.r, a:i*1.7, sp:g.sp, fov:0.55 }));
      this.left = this.terminals.length;
    }
    nextLevel(){ this.level=Math.min(3,this.level+1); this.reset(); }
    update(dt){
      const p=this.p;
      p.x += Input.axisX()*220*dt;
      p.y += Input.axisY()*220*dt;
      p.x = clamp(p.x, 14, W-14);
      p.y = clamp(p.y, 14, H-14);

      for (const g of this.guards) g.a += g.sp*dt;

      for (const g of this.guards){
        const dx=p.x-g.x, dy=p.y-g.y;
        const d=len(dx,dy);
        if (d < g.r){
          const ang = Math.atan2(dy,dx);
          const da = Math.atan2(Math.sin(ang-g.a), Math.cos(ang-g.a));
          if (Math.abs(da) < g.fov){
            this.over = true; vib(90);
          }
        }
      }
      if (this.over) return;

      let near = null;
      for (const t0 of this.terminals){
        if (t0.done) continue;
        if (len(p.x-t0.x,p.y-t0.y) < 26) { near = t0; break; }
      }

      if (near && Input.is('a')) {
        this.hack.t += dt;
        if (this.hack.t >= this.hack.need){
          near.done = true;
          this.left--;
          this.hack.t = 0;
          vib(20);
          if (this.left<=0){
            if (this.level<3) this.nextLevel();
            else this.done = true;
          }
        }
      } else {
        this.hack.t = Math.max(0, this.hack.t - dt*0.8);
      }
    }
    hud(){
      const pct = this.hack.need ? Math.min(1, this.hack.t/this.hack.need) : 0;
      return `${super.hud()} | Terminals ${this.left} | Hack ${(pct*100|0)}%`;
    }
    draw(ctx){
      ctx.fillStyle='#061226';ctx.fillRect(0,0,W,H);

      for (const t0 of this.terminals){
        ctx.fillStyle = t0.done ? 'rgba(0,212,255,0.25)' : '#00d4ff';
        ctx.fillRect(t0.x-10,t0.y-10,20,20);
      }

      for (const g of this.guards){
        ctx.fillStyle='rgba(255,77,77,0.12)';
        ctx.beginPath();
        ctx.moveTo(g.x,g.y);
        ctx.arc(g.x,g.y,g.r, g.a-g.fov, g.a+g.fov);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle='#e8e8e8';
      ctx.fillRect(this.p.x-10,this.p.y-10,20,20);

      if (this.over) drawCenterText('Обнаружен! Нажми Рестарт', '#ff4d4d');
      if (this.done) drawCenterText('Победа! Протокол взломан', '#00ffb3');
    }
  }

  // ---------------- Game manager ----------------
  const games = {
    runner: new AstroRunner(),
    shooter: new NeonShooter(),
    arena: new BladeArena(),
    breakout: new BreakoutX(),
    escort: new EscortProtocol(),
    stealth: new HackHide(),
  };

  let current = null;
  let paused = false;

  function showMenu() {
    paused = false;
    current = null;
    setHidden(menu, false);
    setHidden(hud, true);
    setHidden(pausePanel, true);
    setHidden(touchUI, true);
  }

  function startGame(key) {
    resize();
    current = games[key];
    if (!current) return;
    current.level = 1;
    current.reset();
    paused = false;

    setHidden(menu, true);
    setHidden(hud, false);
    setHidden(pausePanel, true);
    setHidden(touchUI, !(isTouch && Settings.showTouch));
  }

  function restartGame() {
    if (!current) return;
    current.reset();
    paused = false;
    setHidden(pausePanel, true);
  }

  function setPaused(p) {
    if (!current) return;
    paused = !!p;
    setHidden(pausePanel, !paused);
  }

  // ---------------- Settings modal ----------------
  function openSettings() {
    setHidden(settingsModal, false);
  }

  function closeSettings() {
    if (difficultySel) Settings.difficulty = Number(difficultySel.value);
    if (showTouchChk) Settings.showTouch = !!showTouchChk.checked;
    if (showFpsChk) Settings.showFps = !!showFpsChk.checked;
    if (vibrateChk) Settings.vibrate = !!vibrateChk.checked;
    Settings.save();

    setHidden(fpsEl, !Settings.showFps);
    if (current) setHidden(touchUI, !(isTouch && Settings.showTouch));
    else setHidden(touchUI, true);

    setHidden(settingsModal, true);
  }

  // ---------------- Events ----------------
  menu?.addEventListener('click', (e) => {
    if (settingsModal && !settingsModal.hidden) return;
    const btn = e.target.closest('[data-game]');
    if (!btn) return;
    e.preventDefault();
    startGame(btn.dataset.game);
  });

  btnPause?.addEventListener('click', () => setPaused(true));
  btnResume?.addEventListener('click', () => setPaused(false));
  btnRestart?.addEventListener('click', () => restartGame());
  btnToMenu?.addEventListener('click', () => showMenu());

  btnSettings?.addEventListener('click', (e) => { e.preventDefault(); openSettings(); });
  btnCloseSettings?.addEventListener('click', (e) => { e.preventDefault(); closeSettings(); });

  settingsModal?.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettings();
  });

  function handlePauseHotkeys() {
    if (!current) return;
    if (Input.was('pause')) setPaused(!paused);
  }

  // ---------------- Menu backdrop cache ----------------
  let backdropCache = null;
  let cacheW = 0, cacheH = 0, cacheDPR = 0;

  function drawMenuBackdrop() {
    if (!backdropCache || cacheW !== W || cacheH !== H || cacheDPR !== DPR) {
      cacheW = W; cacheH = H; cacheDPR = DPR;
      backdropCache = document.createElement('canvas');
      backdropCache.width = Math.round(W * DPR);
      backdropCache.height = Math.round(H * DPR);
      const bctx = backdropCache.getContext('2d');
      bctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      bctx.strokeStyle = 'rgba(0,212,255,0.08)';
      for (let x=0;x<W;x+=40){ bctx.beginPath(); bctx.moveTo(x,0); bctx.lineTo(x,H); bctx.stroke(); }
      for (let y=0;y<H;y+=40){ bctx.beginPath(); bctx.moveTo(0,y); bctx.lineTo(W,y); bctx.stroke(); }
    }
    ctx.drawImage(backdropCache, 0, 0, W, H);
  }

  // ---------------- Main loop ----------------
  let last = performance.now();
  let fpsAcc = 0, fpsCnt = 0;
  let rafId = 0;
  let running = true;

  function frame(now) {
    if (!running) return;

    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;

    const rect = canvas.getBoundingClientRect();
    if ((rect.width|0) !== W || (rect.height|0) !== H) resize();

    if (!(settingsModal && !settingsModal.hidden)) handlePauseHotkeys();

    if (!current) {
      ctx.fillStyle = '#050812';
      ctx.fillRect(0,0,W,H);
      drawMenuBackdrop();
      Input.endFrame();
      rafId = requestAnimationFrame(frame);
      return;
    }

    if (!paused && !current.over && !current.done) current.update(dt);
    current.draw(ctx);

    if (hudLeft) hudLeft.textContent = current.hud();

    if (fpsEl) {
      if (Settings.showFps) {
        fpsAcc += dt; fpsCnt++;
        if (fpsAcc > 0.35) {
          fpsEl.textContent = `${Math.round(fpsCnt / fpsAcc)} fps`;
          fpsAcc = 0; fpsCnt = 0;
        }
        fpsEl.hidden = false;
      } else {
        fpsEl.hidden = true;
      }
    }

    Input.endFrame();
    rafId = requestAnimationFrame(frame);
  }

  // ---------------- Boot ----------------
  function boot() {
    Settings.load();
    if (difficultySel) difficultySel.value = String(Settings.difficulty);
    if (showTouchChk) showTouchChk.checked = Settings.showTouch;
    if (showFpsChk) showFpsChk.checked = Settings.showFps;
    if (vibrateChk) vibrateChk.checked = Settings.vibrate;

    setHidden(settingsModal, true);

    resize();
    requestAnimationFrame(() => resize()); // добить после раскладки
    initTouchButtons();

    setHidden(fpsEl, !Settings.showFps);

    // ВАЖНО: стартуем именно меню, а не паузу
    showMenu();

    last = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.addEventListener('beforeunload', () => {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resizeHandler);
  });
})();
