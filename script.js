document.addEventListener('DOMContentLoaded', () => {
  const b = document.getElementById('skillsButton');
  if (b) b.addEventListener('click', () => alert(
    'Навыки:\n\n• HTML/CSS/JavaScript\n• Основы программирования\n• Работа с Git\n• Изучение AI и машинного обучения\n• Веб-разработка\n\nПостоянно изучаю новые технологии!'
  ));
  const f = document.getElementById('contactForm');
  if (f) f.addEventListener('submit', () => console.log('Форма отправлена'));
  initSpaceBackground();
});

function initSpaceBackground() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const IMG_DIR = './', EXT = '.png';
  const FPS = 24, FRAME = 1000 / FPS;

  const NEB_MIN = 0.15, NEB_MAX = 0.35, NEB_SPEED = 0.22;
  const ORDER = ['spiral', 'explore', 'shrinkExit'];

  const rand = (a,b)=>a+Math.random()*(b-a);
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = t => 0.5 - 0.5 * Math.cos(Math.PI * t);
  const norm = (dx,dy)=>{const d=Math.hypot(dx,dy)||1; return {x:dx/d,y:dy/d};};

  hero.querySelector('#spaceScene')?.remove();

  const scene = document.createElement('div'); scene.id='spaceScene'; hero.appendChild(scene);

  const bgLayer = document.createElement('div'); bgLayer.id='spaceBgLayer';
  Object.assign(bgLayer.style,{position:'absolute',inset:'0',zIndex:'0',pointerEvents:'none',willChange:'transform',transform:'translate3d(0,0,0) scale(1.08)'});
  scene.appendChild(bgLayer);

  const starLayer = document.createElement('div');
  Object.assign(starLayer.style,{position:'absolute',inset:'0',zIndex:'1',pointerEvents:'none',overflow:'hidden'});
  scene.appendChild(starLayer);

  const objLayer = document.createElement('div'); objLayer.id='spaceObjLayer';
  Object.assign(objLayer.style,{position:'absolute',inset:'0',zIndex:'2',pointerEvents:'none'});
  scene.appendChild(objLayer);

  hero.classList.add('space-ready');

  let W=1,H=1;
  const resize=()=>{const r=hero.getBoundingClientRect(); W=Math.max(1,r.width|0); H=Math.max(1,r.height|0);};
  resize(); addEventListener('resize', resize);

  let mouseX=W/2, mouseY=H/2;
  const setPointer = (e)=>{
    const r=hero.getBoundingClientRect(); const p=e.touches?.[0]??e;
    mouseX=(p.clientX-r.left); mouseY=(p.clientY-r.top);
  };
  hero.addEventListener('pointermove', setPointer, {passive:true});
  hero.addEventListener('touchmove', setPointer, {passive:true});

  // stars (CSS twinkle)
  (() => {
    const st = document.createElement('style');
    st.textContent = `@keyframes starTwinkle{0%{opacity:var(--o1)}100%{opacity:var(--o2)}}`;
    document.head.appendChild(st);
    for (let i=0;i<70;i++){
      const el=document.createElement('div');
      const o1=rand(0.10,0.45), o2=rand(0.35,0.85);
      Object.assign(el.style,{
        position:'absolute',left:(Math.random()*100)+'%',top:(Math.random()*100)+'%',
        width:rand(1,2)+'px',height:rand(1,2)+'px',borderRadius:'50%',
        background:'rgba(255,255,255,0.95)',opacity:o1,
        animation:`starTwinkle ${rand(1.8,5.2)}s ease-in-out ${rand(0,2.5)}s infinite alternate`,
        pointerEvents:'none'
      });
      el.style.setProperty('--o1', o1.toFixed(2)); el.style.setProperty('--o2', o2.toFixed(2));
      starLayer.appendChild(el);
    }
  })();

  // assets
  const neb = [
    ['nebula1',980,0.28,0.50,0.45],
    ['nebula2',900,0.30,0.22,0.70],
    ['nebula3',860,0.32,0.80,0.25],
  ];
  const gal = [
    ['galaxy1',120,0.85,0.12,0.55,160000],
    ['galaxy2', 70,0.52,0.88,0.65,150000],
    ['galaxy3',160,0.48,0.62,0.16,180000],
    ['galaxy4',200,0.45,0.40,0.78,200000],
  ];
  const pla = [
    ['sun',70,0.85,0.82,0.28,120000],
    ['saturn',330,0.94,0.18,0.40,200000],
    ['jupiter',280,0.94,0.74,0.78,180000],
    ['earth',240,0.95,0.30,0.20,160000],
    ['venera',210,0.93,0.88,0.52,170000],
    ['mars',40,0.63,0.24,0.78,100000],
    ['neptun',230,0.93,0.08,0.18,190000],
    ['moon',50,0.92,0.65,0.88,140000],
    ['pluton',160,0.90,0.92,0.14,210000],
  ];

  const sprites = [];
  function makeSprite(type, name, size, opacity, x, y, idleSpinMs) {
    const layer = (type === 'nebula') ? bgLayer : objLayer;

    const wrap = document.createElement('div');
    wrap.className = `space-sprite space-sprite--${type}`;
    wrap.style.setProperty('--size', size+'px');
    wrap.style.opacity = String(opacity);

    const img = document.createElement('img');
    img.className = 'space-sprite__img';
    img.id = name;
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'eager';
    img.draggable = false;
    img.style.animation = 'none';
    img.style.filter = 'none';

    const bx = clamp01(x + rand(-0.02,0.02));
    const by = clamp01(y + rand(-0.02,0.02));

    const ms = Math.max(90000, idleSpinMs || 160000);
    const dir = Math.random()<0.5 ? 1 : -1;
    const spinBase = (2*Math.PI) / (ms/1000) * dir;

    const s = {
      type, name, size, baseOpacity: opacity,
      wrap, img, bx, by,
      ready:false,
      currX:null, currY:null,
      angle:0, spinBase,
      floatAx: rand(3,9), floatAy: rand(3,9),
      floatFx: rand(0.04,0.10), floatFy: rand(0.04,0.10),
      phx: rand(0,Math.PI*2), phy: rand(0,Math.PI*2),
      twPhase: type==='nebula' ? rand(0,Math.PI*2) : 0,
      effect:null, explore:null, spit:null,
      effectIndex:0
    };

    const onLoad = () => {
      s.ready = true;
      s.currX = s.bx * W;
      s.currY = s.by * H;
      hero.classList.add('space-ready');
    };
    const onError = () => { wrap.style.display='none'; console.warn('Image load error:', img.src); };

    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);

    img.src = `${IMG_DIR}${name}${EXT}`;
    if (img.complete) (img.naturalWidth > 0 ? onLoad() : onError());

    wrap.appendChild(img);
    layer.appendChild(wrap);
    sprites.push(s);
  }

  neb.forEach(a => makeSprite('nebula', ...a));
  gal.forEach(a => makeSprite('galaxy', ...a));
  pla.forEach(a => makeSprite('planet', ...a));

  const galaxyNames = ['galaxy1','galaxy2','galaxy3','galaxy4'];
  const getGalaxy = (n)=>sprites.find(s=>s.type==='galaxy' && s.name===n && s.ready);
  const pickPortal = ()=>{
    const ready = galaxyNames.filter(n=>!!getGalaxy(n));
    return ready.length ? ready[(Math.random()*ready.length)|0] : null;
  };
  const portalCenter = (n)=>{
    const g=getGalaxy(n);
    return g ? {x:(g.currX ?? g.bx*W), y:(g.currY ?? g.by*H)} : {x:W/2,y:H/2};
  };

  // galaxy spit overlay (compress+shake+recoil)
  function galaxySpit(portalName, t, dx, dy) {
    const g = getGalaxy(portalName);
    if (!g) return;
    const d = norm(dx, dy);
    g.spit = { start:t, dur:0.65, compress:0.25, shake:3, recoil:5, dx:d.x, dy:d.y };
  }

  function startGalaxySpin(g, t) {
    g.effect = { type:'galaxySpin', start:t, dur:5, boost:-12, shake:2.5, pulse:0.25 };
  }

  function startPlanetNext(p, t) {
    const type = ORDER[p.effectIndex % ORDER.length];
    p.effectIndex++;

    if (type === 'spiral') {
      p.effect = { type:'spiral', start:t, dur:12, ox:(p.currX ?? p.bx*W), oy:(p.currY ?? p.by*H), a:Math.random()*Math.PI*2, dir:Math.random()<0.5?1:-1, turns:4, r:75 };
      return;
    }

    if (type === 'explore') {
      p.explore = { x:(p.currX ?? p.bx*W), y:(p.currY ?? p.by*H), tx:rand(60,W-60), ty:rand(60,H-60), next:t+rand(0.7,1.6), jump:null, nextJump:t+rand(2.0,5.0) };
      p.effect = { type:'explore', start:t, dur:30 };
      return;
    }

    if (type === 'shrinkExit') {
      const sx = (p.currX ?? p.bx*W), sy = (p.currY ?? p.by*H);
      const portal = pickPortal();

      // параметры "всасывания по спирали"
      const swDir = Math.random() < 0.5 ? 1 : -1;
      const swTurns = rand(2.0, 3.5);               // сколько оборотов на пути к порталу
      const swR = Math.min(55, p.size * 0.35 + 12); // максимальный радиус спирали (px)
      const swA0 = Math.random() * Math.PI * 2;

      p.effect = {
        type:'shrinkExit', start:t, dur:15,
        sx, sy, portal, phase:-1,
        swDir, swTurns, swR, swA0
      };
    }
  }

  hero.addEventListener('pointerdown', (e)=>{
    if (e.target.closest('button, a, input, textarea, form, label')) return;
    setPointer(e);

    let best=null, bestD=1e9;
    for (const s of sprites) {
      if (!s.ready || s.type==='nebula') continue;
      const cx = s.currX ?? s.bx*W, cy = s.currY ?? s.by*H;
      const d = Math.hypot(mouseX-cx, mouseY-cy);
      const hit = Math.max(70, s.size*0.9);
      if (d <= hit && d < bestD) { best = s; bestD = d; }
    }
    if (!best) return;

    const t = performance.now()/1000;
    best.type==='galaxy' ? startGalaxySpin(best,t) : startPlanetNext(best,t);
  }, {capture:true});

  // bg parallax
  let bgTx=0,bgTy=0;
  const bgParallax=(t)=>{
    const nx = mouseX/Math.max(1,W)-0.5, ny = mouseY/Math.max(1,H)-0.5;
    const tx = -nx*14 + Math.sin(t*0.05)*2.5;
    const ty = -ny*9  + Math.cos(t*0.05)*2.0;
    bgTx += (tx-bgTx)*0.06; bgTy += (ty-bgTy)*0.06;
    bgLayer.style.transform = `translate3d(${bgTx}px,${bgTy}px,0) scale(1.08)`;
  };

  let last=0;
  (function tick(now){
    if (document.hidden) return requestAnimationFrame(tick);
    if (now-last < FRAME) return requestAnimationFrame(tick);

    const dt = last ? Math.min(0.05,(now-last)/1000) : 1/FPS;
    last = now;
    const t = now/1000;

    bgParallax(t);

    // nebula twinkle + place
    for (const s of sprites) if (s.ready && s.type==='nebula') {
      const osc = (Math.sin(t*NEB_SPEED + s.twPhase)+1)*0.5;
      s.wrap.style.opacity = (NEB_MIN + (NEB_MAX-NEB_MIN)*osc).toFixed(3);
      const x=s.bx*W, y=s.by*H;
      s.wrap.style.transform = `translate3d(${x-s.size/2}px,${y-s.size/2}px,0)`;
    }

    for (const s of sprites) {
      if (!s.ready || s.type==='nebula') continue;

      let x = s.bx*W + Math.sin(t*s.floatFx + s.phx)*s.floatAx;
      let y = s.by*H + Math.cos(t*s.floatFy + s.phy)*s.floatAy;

      let scale = 1, spin = s.spinBase, shx=0, shy=0;

      // galaxy spit overlay
      if (s.type==='galaxy' && s.spit) {
        const sp=s.spit, u=(t-sp.start)/sp.dur;
        if (u>=1||u<0) s.spit=null;
        else {
          const env = Math.sin(u*Math.PI);
          scale *= (1 - sp.compress*env);
          const a = sp.shake*env;
          shx += Math.sin(t*70 + s.bx*999)*a + (-sp.dx)*sp.recoil*env;
          shy += Math.cos(t*78 + s.by*999)*a + (-sp.dy)*sp.recoil*env;
        }
      }

      if (s.effect) {
        const ef=s.effect, u=(t-ef.start)/ef.dur;

        if (u>=1||u<0) {
          if (ef.type === 'shrinkExit') {
            s.bx = clamp01(ef.sx / W);
            s.by = clamp01(ef.sy / H);
            s.phx = -t * s.floatFx;
            s.phy = Math.PI/2 - t * s.floatFy;
          }
          s.effect=null; s.explore=null;
        }
        else if (ef.type==='galaxySpin') {
          const env = Math.sin(u*Math.PI);
          spin = s.spinBase + ef.boost*env;
          scale *= (1 + ef.pulse*Math.sin(u*Math.PI*6)*env);
          const a = ef.shake*env;
          shx += Math.sin(t*55 + s.bx*999)*a;
          shy += Math.cos(t*63 + s.by*999)*a;
        }
        else if (ef.type==='spiral') {
          const k=ease(u), ang=ef.a + ef.dir*(ef.turns*2*Math.PI*u), r=ef.r*k;
          x = ef.ox + Math.cos(ang)*r; y = ef.oy + Math.sin(ang)*r;
        }
        else if (ef.type==='explore') {
          if (!s.explore) s.explore={x:s.currX??x,y:s.currY??y,tx:rand(60,W-60),ty:rand(60,H-60),next:t+1,jump:null,nextJump:t+3};

          const ex=s.explore;
          if (t>ex.next){ ex.tx=rand(60,W-60); ex.ty=rand(60,H-60); ex.next=t+rand(0.7,1.6); }
          if (!ex.jump && t>ex.nextJump) ex.jump={start:t,dur:1.2,portal:pickPortal(),phase:-1};

          ex.x += (ex.tx-ex.x)*0.05; ex.y += (ex.ty-ex.y)*0.05;
          x=ex.x; y=ex.y;

          const baseScale = 0.85 + 0.35*(0.5+0.5*Math.sin((t-ef.start)*0.9));
          spin = Math.abs((2*Math.PI)/1.1);

          if (ex.jump) {
            const j=ex.jump, ju=(t-j.start)/j.dur;
            if (ju>=1||ju<0){ ex.jump=null; ex.nextJump=t+rand(2.5,6.5); scale*=baseScale; }
            else {
              const phase = ju<0.45?0:ju<0.55?1:2;
              if (phase!==j.phase){
                j.phase=phase;
                if (phase===2){
                  const p0=portalCenter(j.portal);
                  s.currX=p0.x; s.currY=p0.y;
                  ex.x=p0.x; ex.y=p0.y; ex.tx=rand(60,W-60); ex.ty=rand(60,H-60); ex.next=t+rand(0.7,1.6);
                  galaxySpit(j.portal, t, ex.tx-p0.x, ex.ty-p0.y);
                }
              }
              if (phase===0){ scale = baseScale*(1 - ju/0.45); }
              else if (phase===1){ scale = 0; }
              else {
                const p=(ju-0.55)/0.45, p0=portalCenter(j.portal);
                x = p0.x + (ex.x-p0.x)*p; y = p0.y + (ex.y-p0.y)*p;
                scale = baseScale*p;
              }
            }
          } else scale *= baseScale;
        }
        else if (ef.type==='shrinkExit') {
          // ВОСАСЫВАНИЕ ПО СПИРАЛИ -> ПАУЗА -> ВЫЛЕТ И ВОЗВРАТ В sx/sy
          const portal = portalCenter(ef.portal);
          const phase = u < 0.55 ? 0 : (u < 0.65 ? 1 : 2);

          if (phase !== ef.phase) {
            ef.phase = phase;
            if (phase === 2) {
              s.currX = portal.x; s.currY = portal.y;
              galaxySpit(ef.portal, t, ef.sx - portal.x, ef.sy - portal.y);
            }
          }

          if (phase === 0) {
            const p = ease(u / 0.55); // 0..1
            // базовая линейная интерполяция к порталу
            let lx = ef.sx + (portal.x - ef.sx) * p;
            let ly = ef.sy + (portal.y - ef.sy) * p;

            // добавка спирального "вихря" вокруг направления движения:
            const dx = portal.x - ef.sx, dy = portal.y - ef.sy;
            const udir = norm(dx, dy);              // вдоль пути
            const perp = { x: -udir.y, y: udir.x }; // перпендикуляр

            const ang = ef.swA0 + ef.swDir * (ef.swTurns * 2 * Math.PI * p);
            const rad = ef.swR * (1 - p); // радиус затухает к 0 в конце

            // спираль вокруг траектории: смесь вдоль+поперёк
            const ox = (Math.cos(ang) * perp.x + Math.sin(ang) * udir.x) * rad;
            const oy = (Math.cos(ang) * perp.y + Math.sin(ang) * udir.y) * rad;

            x = lx + ox;
            y = ly + oy;

            scale = 1 - p;
          } else if (phase === 1) {
            x = portal.x; y = portal.y; scale = 0;
          } else {
            const p = ease((u - 0.65) / 0.35);
            x = portal.x + (ef.sx - portal.x) * p;
            y = portal.y + (ef.sy - portal.y) * p;
            scale = p;
          }
        }
      }

      // smooth pos:
      const inShrink = s.effect && s.effect.type === 'shrinkExit';
      if (s.currX==null){ s.currX=x; s.currY=y; }
      else if (inShrink) { s.currX = x; s.currY = y; }          // точная траектория (без рывков)
      else { s.currX += (x-s.currX)*0.10; s.currY += (y-s.currY)*0.10; }

      s.angle += spin*dt;

      s.wrap.style.transform = `translate3d(${(s.currX+shx)-s.size/2}px,${(s.currY+shy)-s.size/2}px,0)`;
      s.img.style.transform = `rotate(${s.angle}rad) scale(${scale})`;
      s.wrap.style.opacity = String(s.baseOpacity);
    }

    requestAnimationFrame(tick);
  })(performance.now());
    }
