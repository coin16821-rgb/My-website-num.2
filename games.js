(() => {
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

  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

  // ---------------- DOM ----------------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });

  const menu = document.getElementById('menu');
  const hud = document.getElementById('hud');
  const hudLeft = document.getElementById('hudLeft');
  const pausePanel = document.getElementById('pause');
  const settingsModal = document.getElementById('settings');
  const touchUI = document.getElementById('touchUI');
  const fpsEl = document.getElementById('fps');

  const btnSettings = document.getElementById('btnSettings');
  const btnPause = document.getElementById('btnPause');
  const btnResume = document.getElementById('btnResume');
  const btnRestart = document.getElementById('btnRestart');
  const btnToMenu = document.getElementById('btnToMenu');
  const btnCloseSettings = document.getElementById('btnCloseSettings');

  const difficultySel = document.getElementById('difficulty');
  const showTouchChk = document.getElementById('showTouch');
  const showFpsChk = document.getElementById('showFps');
  const vibrateChk = document.getElementById('vibrate');

  // ---------------- Canvas resize ----------------
  let W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(canvas.clientWidth));
    H = Math.max(1, Math.floor(canvas.clientHeight));
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);

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
      ['KeyE','b'], // запасной B на E
      ['Escape','pause'], ['KeyP','pause'],
    ]),
    axisX() { return (this.down.has('right')?1:0) - (this.down.has('left')?1:0); },
    axisY() { return (this.down.has('down')?1:0) - (this.down.has('up')?1:0); },
    was(act){ return this.pressed.has(act); },
    is(act){ return this.down.has(act); },
    endFrame(){ this.pressed.clear(); }
  };

  addEventListener('keydown', (e) => {
    const act = Input.keyMap.get(e.code);
    if (!act) return;
    if (!Input.down.has(act)) Input.pressed.add(act);
    Input.down.add(act);
  });

  addEventListener('keyup', (e) => {
    const act = Input.keyMap.get(e.code);
    if (!act) return;
    Input.down.delete(act);
  });

  // Touch buttons
  function initTouchButtons() {
    if (!isTouch) return;
    touchUI.hidden = !Settings.showTouch;

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

      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('lostpointercapture', up);
    });
  }

  // ---------------- Helpers ----------------
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const rnd = (a,b)=>a+Math.random()*(b-a);
  const len = (x,y)=>Math.hypot(x,y);
  const norm = (x,y)=>{const d=Math.hypot(x,y)||1; return {x:x/d,y:y/d};};
  const vibrate = (ms)=>{ if (Settings.vibrate && navigator.vibrate) navigator.vibrate(ms); };

  function rectHit(ax,ay,aw,ah,bx,by,bw,bh){
    return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
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
      this.vy = 0;
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
      this.y = clamp(this.y, 70, H-16);

      // fuel drains with time
      this.fuel -= dt * 0.035 * Settings.difficulty;
      this.fuel = clamp(this.fuel, 0, 1);
      if (this.fuel <= 0) { this.over = true; vibrate(80); }

      if (this.spawn > 0.55) {
        this.spawn = 0;
        const laneY = rnd(80, H-40);
        const s = rnd(24, 46);
        this.ob.push({ x: W + 60, y: laneY, w: s, h: s, vx: -this.speed });
        if (Math.random() < 0.45) this.pick.push({ x: W + 60, y: rnd(90, H-50), r: 9, vx: -this.speed });
      }

      for (const o of this.ob) o.x += o.vx * dt;
      for (const p of this.pick) p.x += p.vx * dt;
      this.ob = this.ob.filter(o => o.x > -100);
      this.pick = this.pick.filter(p => p.x > -100);

      // collision
      for (const o of this.ob) {
        if (rectHit(this.x-12,this.y-12,24,24, o.x-o.w/2,o.y-o.h/2,o.w,o.h)) {
          this.over = true; vibrate(120);
        }
      }
      for (const p of this.pick) {
        if (!p.dead && len(this.x-p.x, this.y-p.y) < 18) {
          p.dead = true;
          this.fuel = clamp(this.fuel + 0.22, 0, 1);
          this.collected++;
          vibrate(20);
        }
      }

      // win condition
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
      // stars simple
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      for (let i=0;i<70;i++) ctx.fillRect((i*97)%W, (i*53)%H, 1, 1);

      // obstacles
      ctx.fillStyle = '#ff4d4d';
      for (const o of this.ob) ctx.fillRect(o.x-o.w/2, o.y-o.h/2, o.w, o.h);

      // pickups
      ctx.fillStyle = '#ffd54d';
      for (const p of this.pick) if(!p.dead){
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      }

      // player
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
      this.player = { x: W/2, y: H-60, vx:0, fire:0, hp: 3 };
      this.bullets = [];
      this.enemies = [];
      this.wave = 1;
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
      p.y = clamp(p.y, 80, H-20);

      p.fire -= dt;
      if (Input.is('a') && p.fire <= 0) {
        p.fire = 0.18;
        this.bullets.push({ x:p.x, y:p.y-18, vy:-520 });
      }

      // spawn
      this.spawn += dt;
      const rate = 0.65 / Settings.difficulty;
      if (this.spawn > rate) {
        this.spawn = 0;
        const sp = (70 + this.level*25) * Settings.difficulty;
        this.enemies.push({ x:rnd(20,W-20), y:-20, vy:sp, r:rnd(10,16), hp: (this.level>=3?2:1) });
      }

      for (const b of this.bullets) b.y += b.vy*dt;
      this.bullets = this.bullets.filter(b => b.y > -40);

      for (const e of this.enemies) e.y += e.vy*dt;

      // bullet vs enemy
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
              vibrate(12);
            }
            break;
          }
        }
      }

      // enemy vs player / out
      for (let i=this.enemies.length-1;i>=0;i--){
        const e = this.enemies[i];
        if (e.y > H+40){ this.enemies.splice(i,1); continue; }
        if (len(p.x-e.x,p.y-e.y) < e.r+14){
          this.enemies.splice(i,1);
          p.hp--;
          vibrate(80);
          if (p.hp<=0) this.over = true;
        }
      }

      if (this.kills >= this.needKills) {
        if (this.level < 3) this.nextLevel();
        else this.done = true;
      }
    }
    hud(){
      return `${super.hud()} | HP ${this.player.hp} | Kills ${this.kills}/${this.needKills}`;
    }
    draw(ctx){
      ctx.fillStyle='#061226';ctx.fillRect(0,0,W,H);
      // enemies
      ctx.fillStyle='#ff4d4d';
      for (const e of this.enemies){ ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill(); }
      // bullets
      ctx.fillStyle='#e8e8e8';
      for (const b of this.bullets) ctx.fillRect(b.x-2,b.y-8,4,12);
      // player
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
      this.p = { x: W/2, y: H/2, vx:0, vy:0, hp: 3, dash: 0 };
      this.en = [];
      this.wave = 1;
      this.toKill = [6, 8, 10][this.level-1] ?? 10;
      this.killed = 0;
      this.spawnWave();
    }
    spawnWave(){
      this.en = [];
      for (let i=0;i<this.toKill;i++){
        this.en.push({ x:rnd(30,W-30), y:rnd(80,H-30), hp:1, r:10, sp: (70+this.level*18)*Settings.difficulty });
      }
    }
    nextLevel(){ this.level = Math.min(3, this.level+1); this.reset(); }
    update(dt){
      const p=this.p;
      const ax=Input.axisX(), ay=Input.axisY();
      p.vx = ax * 220;
      p.vy = ay * 220;

      p.dash -= dt;

      // dash attack on B (Shift / E)
      if (Input.was('b') && p.dash <= 0){
        p.dash = 0.9;
        // dash burst direction
        const d = norm(ax || (Math.random()<0.5?-1:1), ay || 0);
        p.x += d.x * 70;
        p.y += d.y * 70;
        vibrate(20);

        // damage enemies near
        for (const e of this.en){
          if (e.hp<=0) continue;
          if (len(p.x-e.x,p.y-e.y) < 38) e.hp = 0;
        }
      }

      p.x += p.vx*dt;
      p.y += p.vy*dt;
      p.x = clamp(p.x, 16, W-16);
      p.y = clamp(p.y, 76, H-16);

      // enemies chase
      for (const e of this.en){
        if (e.hp<=0) continue;
        const d = norm(p.x-e.x, p.y-e.y);
        e.x += d.x * e.sp * dt;
        e.y += d.y * e.sp * dt;

        if (len(p.x-e.x,p.y-e.y) < e.r+12){
          e.hp = 0;
          p.hp--;
          vibrate(90);
          if (p.hp<=0) this.over = true;
        }
      }

      // count killed
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

      // arena ring
      ctx.strokeStyle='rgba(255,255,255,0.10)';
      ctx.beginPath(); ctx.arc(W/2,H/2,Math.min(W,H)*0.35,0,Math.PI*2); ctx.stroke();

      // enemies
      ctx.fillStyle='#ff4d4d';
      for (const e of this.en){
        if (e.hp<=0) continue;
        ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill();
      }

      // player
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
      const layouts = [0,1,2];
      const L = layouts[this.level-1] ?? 2;

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
      const ax = Input.axisX();
      this.paddleX += ax*520*dt;
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

      // bricks
      const top=72, pad=10;
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
          vibrate(10);
          break;
        }
      }

      if (this.ball.y > H+30){
        this.over = true;
        vibrate(90);
      }

      if (this.bricksLeft<=0){
        if (this.level<3) this.nextLevel();
        else this.done=true;
      }
    }
    hud(){ return `${super.hud()} | Score ${this.score} | Bricks ${this.bricksLeft}`; }
    draw(ctx){
      ctx.fillStyle='#061226';ctx.fillRect(0,0,W,H);

      // bricks
      const top=72, pad=10;
      const bw = (W - pad*2)/this.cols;
      const bh = 18;
      for (const b of this.bricks){
        if (!b.alive) continue;
        const x0 = pad + b.c*bw;
        const y0 = top + b.r*(bh+8);
        ctx.fillStyle='rgba(0,212,255,0.55)';
        ctx.fillRect(x0+1,y0+1,bw-2,bh-2);
      }

      // paddle + ball
      ctx.fillStyle='#e8e8e8';
      ctx.fillRect(this.paddleX-this.paddleW/2, H-26, this.paddleW, 10);

      ctx.beginPath();
      ctx.arc(this.ball.x,this.ball.y,8,0,Math.PI*2);
      ctx.fill();

      if (this.over) drawCenterText('Поражение. Нажми Рестарт', '#ff4d4d');
      if (this.done) drawCenterText('Победа! Блоки разбиты', '#00ffb3');
    }
  }

  // 5) Escort Protocol
  class EscortProtocol extends BaseGame {
    constructor(){ super('Escort Protocol'); this.reset(); }
    reset(){
      super.reset();
      this.stageLen = [18, 22, 26][this.level-1] ?? 26;
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

      // cargo moves to the right
      const sp = (60 + this.level*20) * Settings.difficulty;
      this.cargo.x += sp * dt;
      this.cargo.y += Math.sin(this.t*0.7)*18*dt;

      // player follows around cargo
      this.p.x += Input.axisX()*300*dt;
      this.p.y += Input.axisY()*300*dt;
      this.p.x = clamp(this.p.x, 20, W-20);
      this.p.y = clamp(this.p.y, 80, H-20);

      // shoot A
      this.p.fire -= dt;
      if (Input.is('a') && this.p.fire<=0){
        this.p.fire = 0.20;
        this.bullets.push({ x:this.p.x, y:this.p.y, vx: 520, vy: rnd(-40,40) });
      }

      // spawn enemies from right
      this.spawn += dt;
      if (this.spawn > 0.70/Settings.difficulty){
        this.spawn = 0;
        this.en.push({ x: W+30, y: rnd(90,H-30), vx: -rnd(90,170)*Settings.difficulty, r: rnd(10,16), hp: (this.level>=3?2:1) });
      }

      for (const b of this.bullets){ b.x += b.vx*dt; b.y += b.vy*dt; }
      this.bullets = this.bullets.filter(b => b.x < W+60);

      for (const e of this.en){ e.x += e.vx*dt; }

      // bullets hit enemies
      for (let i=this.en.length-1;i>=0;i--){
        const e=this.en[i];
        for (let j=this.bullets.length-1;j>=0;j--){
          const b=this.bullets[j];
          if (len(b.x-e.x,b.y-e.y) < e.r+5){
            this.bullets.splice(j,1);
            e.hp--;
            if (e.hp<=0){ this.en.splice(i,1); vibrate(10); }
            break;
          }
        }
      }

      // enemies hit cargo
      for (let i=this.en.length-1;i>=0;i--){
        const e=this.en[i];
        if (e.x < -60){ this.en.splice(i,1); continue; }
        if (len(e.x-this.cargo.x, e.y-this.cargo.y) < e.r+18){
          this.en.splice(i,1);
          this.cargo.hp--;
          vibrate(90);
          if (this.cargo.hp<=0) this.over = true;
        }
      }

      // win condition: reach end
      if (this.cargo.x >= W - 40){
        if (this.level<3) this.nextLevel();
        else this.done = true;
      }
    }
    hud(){ return `${super.hud()} | Cargo HP ${this.cargo.hp} | Dist ${(this.cargo.x|0)}/${W-40}`; }
    draw(ctx){
      ctx.fillStyle='#061226';ctx.fillRect(0,0,W,H);

      // finish zone
      ctx.fillStyle='rgba(0,212,255,0.08)';
      ctx.fillRect(W-60, 60, 50, H-120);

      // cargo
      ctx.fillStyle='#ffd54d';
      ctx.fillRect(this.cargo.x-14,this.cargo.y-10,28,20);

      // player
      ctx.fillStyle='#00d4ff';
      ctx.fillRect(this.p.x-12,this.p.y-12,24,24);

      // bullets
      ctx.fillStyle='#e8e8e8';
      for (const b of this.bullets) ctx.fillRect(b.x-2,b.y-2,4,4);

      // enemies
      ctx.fillStyle='#ff4d4d';
      for (const e of this.en){ ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill(); }

      if (this.over) drawCenterText('Поражение. Груз уничтожен', '#ff4d4d');
      if (this.done) drawCenterText('Победа! Сопровождение завершено', '#00ffb3');
    }
  }

  // 6) Hack & Hide (stealth)
  class HackHide extends BaseGame {
    constructor(){ super('Hack & Hide'); this.reset(); }
    reset(){
      super.reset();
      this.p = { x: 60, y: H-80, vx:0, vy:0 };
      this.terminals = [];
      this.guards = [];
      this.hack = { active:false, t:0, need: 2.6 / Settings.difficulty };
      const layouts = [
        { t:[{x:W-80,y:90},{x:W-80,y:H-90},{x:W/2,y:H/2}], g:[{x:W/2,y:140,r:120,sp:0.7}] },
        { t:[{x:W-80,y:H-90},{x:W/2,y:90},{x:W/2,y:H-90}], g:[{x:W/2,y:H/2,r:160,sp:0.9},{x:W/2,y:120,r:100,sp:1.1}] },
        { t:[{x:W-80,y:90},{x:W-80,y:H-90},{x:W/2,y:H/2}], g:[{x:W/2,y:H/2,r:220,sp:1.1}] },
      ][this.level-1] ?? null;

      this.terminals = layouts.t.map(p => ({...p, done:false}));
      this.guards = layouts.g.map((g,i)=>({ x:g.x, y:g.y, r:g.r, a: i*1.7, sp:g.sp, fov: 0.55 }));

      this.left = this.terminals.length;
    }
    nextLevel(){ this.level=Math.min(3,this.level+1); this.reset(); }
    update(dt){
      const p=this.p;
      p.x += Input.axisX()*220*dt;
      p.y += Input.axisY()*220*dt;
      p.x = clamp(p.x, 14, W-14);
      p.y = clamp(p.y, 70, H-14);

      // guards rotate spotlight
      for (const g of this.guards) g.a += g.sp*dt;

      // detection
      for (const g of this.guards){
        const dx=p.x-g.x, dy=p.y-g.y;
        const d=len(dx,dy);
        if (d < g.r){
          const ang = Math.atan2(dy,dx);
          const da = Math.atan2(Math.sin(ang-g.a), Math.cos(ang-g.a));
          if (Math.abs(da) < g.fov){
            this.over = true; vibrate(90);
          }
        }
      }
      if (this.over) return;

      // hacking (hold A near terminal)
      let near = null;
      for (const t0 of this.terminals){
        if (t0.done) continue;
        if (len(p.x-t0.x,p.y-t0.y) < 26) { near = t0; break; }
      }

      if (near && Input.is('a')) {
        this.hack.active = true;
        this.hack.t += dt;
        if (this.hack.t >= this.hack.need){
          near.done = true;
          this.left--;
          this.hack.t = 0;
          vibrate(20);
          if (this.left<=0){
            if (this.level<3) this.nextLevel();
            else this.done = true;
          }
        }
      } else {
        this.hack.active = false;
        this.hack.t = Math.max(0, this.hack.t - dt*0.8);
      }
    }
    hud(){
      const pct = this.hack.need ? Math.min(1, this.hack.t/this.hack.need) : 0;
      return `${super.hud()} | Terminals ${this.left} | Hack ${(pct*100|0)}%`;
    }
    draw(ctx){
      ctx.fillStyle='#061226';ctx.fillRect(0,0,W,H);

      // terminals
      for (const t0 of this.terminals){
        ctx.fillStyle = t0.done ? 'rgba(0,212,255,0.25)' : '#00d4ff';
        ctx.fillRect(t0.x-10,t0.y-10,20,20);
      }

      // guards cones
      for (const g of this.guards){
        ctx.fillStyle='rgba(255,77,77,0.12)';
        ctx.beginPath();
        ctx.moveTo(g.x,g.y);
        ctx.arc(g.x,g.y,g.r, g.a-g.fov, g.a+g.fov);
        ctx.closePath();
        ctx.fill();
      }

      // player
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

  // ---------------- UI helpers ----------------
  function drawCenterText(text, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, H/2 - 36, W, 72);
    ctx.fillStyle = color;
    ctx.font = '800 18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(text, W/2, H/2);
    ctx.textAlign = 'left';
  }

  function showMenu() {
    paused = false;
    current = null;
    menu.hidden = false;
    hud.hidden = true;
    pausePanel.hidden = true;
  }

  function startGame(key) {
    resize();
    current = games[key];
    current.level = 1;
    current.reset();
    paused = false;

    menu.hidden = true;
    hud.hidden = false;
    pausePanel.hidden = true;

    if (isTouch) touchUI.hidden = !Settings.showTouch;

    // auto focus: prevent page scroll when playing
    document.body.style.overflow = 'hidden';
  }

  function restartGame() {
    if (!current) return;
    current.reset();
    paused = false;
    pausePanel.hidden = true;
  }

  function setPaused(p) {
    paused = p;
    pausePanel.hidden = !p;
  }

  // menu clicks
  menu.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-game]');
    if (!btn) return;
    startGame(btn.dataset.game);
  });

  btnPause.addEventListener('click', () => setPaused(true));
  btnResume.addEventListener('click', () => setPaused(false));
  btnRestart.addEventListener('click', () => restartGame());
  btnToMenu.addEventListener('click', () => {
    document.body.style.overflow = ''; // return scroll
    showMenu();
  });

  btnSettings.addEventListener('click', () => settingsModal.hidden = false);
  btnCloseSettings.addEventListener('click', () => {
    Settings.difficulty = Number(difficultySel.value);
    Settings.showTouch = !!showTouchChk.checked;
    Settings.showFps = !!showFpsChk.checked;
    Settings.vibrate = !!vibrateChk.checked;
    Settings.save();

    touchUI.hidden = !(isTouch && Settings.showTouch && current);
    fpsEl.hidden = !Settings.showFps;
    settingsModal.hidden = true;
  });

  // pause hotkeys
  function handlePauseHotkeys() {
    if (Input.was('pause')) {
      if (!current) return;
      setPaused(!paused);
    }
  }

  // ---------------- Main loop ----------------
  let last = performance.now();
  let fpsAcc = 0, fpsCnt = 0;

  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;

    resize();

    handlePauseHotkeys();

    if (!current) {
      // background in menu
      ctx.fillStyle = '#050812';
      ctx.fillRect(0,0,W,H);
      drawMenuBackdrop();
      Input.endFrame();
      requestAnimationFrame(frame);
      return;
    }

    if (!paused && !current.over && !current.done) {
      current.update(dt);
    }

    current.draw(ctx);

    hudLeft.textContent = current.hud();

    // FPS
    if (Settings.showFps) {
      fpsAcc += dt; fpsCnt++;
      if (fpsAcc > 0.35) {
        const fps = Math.round(fpsCnt / fpsAcc);
        fpsEl.textContent = `${fps} fps`;
        fpsAcc = 0; fpsCnt = 0;
      }
      fpsEl.hidden = false;
    } else {
      fpsEl.hidden = true;
    }

    Input.endFrame();
    requestAnimationFrame(frame);
  }

  function drawMenuBackdrop() {
    // простая “неоновая” сетка
    ctx.strokeStyle = 'rgba(0,212,255,0.08)';
    for (let x=0;x<W;x+=40){
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
    }
    for (let y=0;y<H;y+=40){
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    }
  }

  // ---------------- Boot ----------------
  function boot() {
    Settings.load();

    difficultySel.value = String(Settings.difficulty);
    showTouchChk.checked = Settings.showTouch;
    showFpsChk.checked = Settings.showFps;
    vibrateChk.checked = Settings.vibrate;

    resize();
    initTouchButtons();

    touchUI.hidden = !(isTouch && Settings.showTouch && current);
    fpsEl.hidden = !Settings.showFps;

    showMenu();
    requestAnimationFrame(frame);
  }

  boot();
})();
