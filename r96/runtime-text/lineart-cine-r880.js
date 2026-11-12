// R880 — 선화 컷씬: 시네마틱이 없던 지역에 들어설 때, 그 지역 서사를 SVG 선 그림으로 한 번 보여 준다.
// 사용자 2026-11-12 "좋네 퀄리티업해서 시네마틱 없는구간에 저런거 서사에맞게 생성해서 넣어서 개선적용해줘 맵당하나씩은 있으면 좋을듯" · "퀄리티업하고 몇초정도 더길게".
//  · 그림 파일·영상 파일을 쓰지 않는다. 모든 그림은 이 파일과 장면 파일(lineart-scenes-r88N.js)의 코드가 SVG 선으로 그린다(사이트 용량 수십 KB).
//    펜·종이·걸음 계산은 공개 라이브러리 line-art-animation(MIT, JDhruv14)의 ink/motion/gait 를 그대로 쓴다(아래 블록, 허가 전문 docs/third-party).
//  · 글은 새로 쓰지 않는다. 자막은 정본(story-canon-r106-data) 그 지역 '보스 앞 서사' 문장 그대로(검사 r880 이 대조), 제목은 지역 데이터 제목.
//  · 언제: STORY 층에서 장면이 등록된 지역에 처음 들어와, 로딩·서사창·다른 시네마틱이 닫힌 뒤 0.7초. 지역마다 한 번(이 기기 localStorage).
//    그 지역 서사를 이미 마친 기록(옛 세이브)·협동·자동 검사(webdriver, ?cine880=1 이면 재생)에서는 틀지 않는다.
//    이미 영상·컷신이 있는 곳(dist00·ep1a09b·ep1a10·ep1a11·last301·last302)과 맘몬(ep1b06·ep1b06b, 다른 작업 몫)은 장면을 등록하지 않는다.
//  · 재생 중 게임 시간은 멈춘다(엔진 tick 을 건너뜀 → 길잡이·자동 전투도 멈춤). 판정·체력·AI·세이브 진행·서사 순서는 바꾸지 않는다. BGM 은 그대로.
//  · 영화 모드(R370): 그림만 깔고(자기 자막 숨김, z 8995) 영화 모드 자막(z 9000)·음성이 그 위에 그대로 흐른다.
//  · 건너뛰기: 단추 · 화면 누르기 · Esc/Enter/Space. 다른 지역으로 가면 닫힌다. '흔들림 줄이기' 설정이면 가벼운 방식(선 떨림·카메라 흔들림 없음).
//    프레임이 느리면(처음 12프레임 평균 50ms 초과, 또는 45프레임 평균 30ms 초과) 선 떨림 필터를 스스로 끈다.
//  · 끄기: localStorage['storyworld.r880.lineart']='{"on":false}'. 다시 보기: __STORYWORLD_LINEART_R880__.play({zone:'dist01'}).
(()=>{'use strict';
if(window.__STORYWORLD_LINEART_R880__)return;
// ── line-art-animation lib (MIT License, Copyright (c) 2026 JDhruv14, https://github.com/JDhruv14/line-art-animation @c43d698) ──
// ink.ts · motion.ts · gait.ts 에서 타입 표기만 지운 것(run·pointerWind 는 뺌). 허가 전문: docs/third-party/line-art-animation-LICENSE.txt
const __ink=(()=>{
// ink.ts — pen, paper and the drawing primitives every line-art figure shares.
//
// Conventions
//  - Draw each figure in its own space: ~95 units tall, feet on y = 120, facing +x,
//    standing on x = 40. Place it in a scene with `place()`.
//  - Ink is `currentColor`; paper fills get class "pp". Set `color` and `--paper`
//    on the <svg> (with `.pp { fill: var(--paper) }` in CSS) to retint everything,
//    e.g. pale ink on indigo paper at night.
//  - Create nodes once, then update `d`/attributes each frame. Nothing here allocates DOM per frame.
/** A point produced by the library. */
/** Any point you pass in: a tuple or a plain [x, y] array. */
const NS = 'http://www.w3.org/2000/svg';
const INK = 'currentColor';
const PAPER = '#fdfdfc';
const INK_DAY = '#1c1c1c';
/** Pen width in figure units: ≈1.4 % of a 95-unit figure. */
const PEN = 1.35;
function el                                      (tag   , attrs        = {}, parent                 )                          {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  if (attrs.fill === PAPER) n.classList.add('pp');
  if (parent) parent.appendChild(n);
  return n;
}
const f = (n        )         => n.toFixed(2);
const pt = (p                   )         => `${f(p[0])} ${f(p[1])}`;
/** Open pen stroke. */
const pen = (parent         , w = PEN)                 =>
  el('path', { fill: 'none', stroke: INK, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
/** Closed outline filled with paper — hides what is behind it (coats, heads, walls, roofs). */
const shape = (parent         , w = PEN)                 =>
  el('path', { fill: PAPER, stroke: INK, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, parent);
/** Solid ink: shoes, hair, feet, small dark details. */
const blot = (parent         )                 => el('path', { fill: INK }, parent);
/** Closed outline with a flat colour fill (clothes, props). Re-set `fill` per frame if it should darken at night. */
const paint = (parent         , colour        , w = PEN)                 =>
  el('path', { fill: colour, stroke: INK, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, parent);
/**
 * A limb drawn as two separate pen lines either side of a soft curve through the
 * joints, open at the ends, paper between them. This open double stroke is the
 * single most recognisable trait of the style — never draw limbs as closed tubes.
 */
function limb(parent         , width        , w = PEN)       {
  const g = el('g', {}, parent);
  const fill = el('path', { fill: PAPER }, g);
  const a = pen(g, w), b = pen(g, w);
  const half = (width - w) / 2;
  return {
    g,
    draw(joints, endGap = [0.4, 0.9]) {
      const s = joints[0], e = joints[joints.length - 1];
      let c      = [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2];
      if (joints.length === 3) { const m = joints[1]; c = [m[0] + 0.55 * (m[0] - c[0]), m[1] + 0.55 * (m[1] - c[1])]; }
      const P        = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16, u = 1 - t;
        P.push([u * u * s[0] + 2 * u * t * c[0] + t * t * e[0], u * u * s[1] + 2 * u * t * c[1] + t * t * e[1]]);
      }
      const side = (sgn        )        => P.map((p, i) => {
        const q = P[Math.min(P.length - 1, i + 1)], o = P[Math.max(0, i - 1)];
        const dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1;
        return [p[0] - (dy / l) * half * sgn, p[1] + (dx / l) * half * sgn];
      });
      const L = side(1), R = side(-1);
      fill.setAttribute('d', 'M' + L.map(pt).join('L') + 'L' + R.slice().reverse().map(pt).join('L') + 'Z');
      const cut = (arr       , gap        ) => arr.slice(0, arr.length - Math.round(gap * 2));
      a.setAttribute('d', 'M' + cut(L, endGap[0]).map(pt).join('L'));
      b.setAttribute('d', 'M' + cut(R, endGap[1]).map(pt).join('L'));
    },
  };
}
/** Give a limb a solid fill (black trousers, sleeves). Drops the paper class so CSS can't override it. */
function solid(l      , colour = INK)       {
  const n = l.g.querySelector('path');
  if (n) { n.classList.remove('pp'); n.setAttribute('fill', colour); }
  return l;
}
/** Two-bone IK. bend = +1 puts the middle joint toward +x (knees), -1 toward -x. */
function joint(a    , b    , l1        , l2        , bend         = 1)      {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01);
  const th = Math.atan2(dy, dx);
  const al = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const c1      = [a[0] + l1 * Math.cos(th - al), a[1] + l1 * Math.sin(th - al)];
  const c2      = [a[0] + l1 * Math.cos(th + al), a[1] + l1 * Math.sin(th + al)];
  return (c1[0] - c2[0]) * bend > 0 ? c1 : c2;
}
/** Point `len` away at `deg` from straight down (forward = positive). */
const hang = (from    , len        , deg        )      => {
  const r = (deg * Math.PI) / 180;
  return [from[0] + len * Math.sin(r), from[1] + len * Math.cos(r)];
};
/** Periodic Catmull-Rom through [time, value] keys — the place for keyed or measured poses. */
function curve(keys               , period        )                        {
  return (x) => {
    x = ((x % period) + period) % period;
    const n = keys.length;
    let i = n - 1;
    for (let j = 0; j < n; j++) if (keys[j][0] <= x) i = j;
    const k = (j        )      => { const w = Math.floor(j / n); const e = keys[((j % n) + n) % n]; return [e[0] + w * period, e[1]]; };
    const p0 = k(i - 1), p1 = k(i), p2 = k(i + 1), p3 = k(i + 2);
    const span = p2[0] - p1[0];
    const u = (x - p1[0]) / span;
    const m1 = ((p2[1] - p0[1]) / (p2[0] - p0[0])) * span;
    const m2 = ((p3[1] - p1[1]) / (p3[0] - p1[0])) * span;
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * p1[1] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2[1] + (u3 - u2) * m2;
  };
}
/** Shoe: a fat ink wedge at the ankle, pitched by `toe` degrees (toe down positive). */
function shoe(node                , ankle    , toe = 0)       {
  const r = (toe * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  const S = (x        , y        )      => [ankle[0] + x * c - y * s, ankle[1] + x * s + y * c];
  node.setAttribute('d', `M${pt(S(-1.6, -0.6))} L${pt(S(4.6, -0.2))} Q${pt(S(6.6, 0.4))} ${pt(S(5.6, 1.6))} L${pt(S(-1.4, 1.5))} Q${pt(S(-2.2, 0.5))} ${pt(S(-1.6, -0.6))}Z`);
}
/** Place a figure group: its local (40, 120) lands on scene (x, y); dir ±1 mirrors it; s scales it. */
const place = (g             , x        , y        , dir         = 1, s = 0.5)       =>
  g.setAttribute('transform', `translate(${f(x)} ${f(y)}) scale(${f(dir * s)} ${f(s)}) translate(-40 -120)`);
/** Scene coordinates of a figure-local point (for glows or effects drawn outside the figure). */
const toScene = (x        , y        , dir        , lx        , ly        , s = 0.5)      => [x + dir * s * (lx - 40), y + s * (ly - 120)];
/** Wobble filter (so lines read as ink, not vector) and a stripe hatch for striped clothes. */
function inkDefs(svg               , id = 'ink')          {
  if (!svg.style.color) svg.style.color = INK_DAY;
  const defs = el('defs', {}, svg);
  const flt = el('filter', { id: `${id}-edge`, x: '-2%', y: '-2%', width: '104%', height: '104%' }, defs);
  el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.6', numOctaves: 1, seed: 7, result: 'n' }, flt);
  el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 0.45, xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }, flt);
  el('feGaussianBlur', { in: 'd', stdDeviation: 0.12 }, flt);
  const stripes = el('pattern', { id: `${id}-stripes`, width: 4, height: 2.2, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(-12)' }, defs);
  el('rect', { width: 4, height: 2.2, fill: PAPER }, stripes);
  el('rect', { width: 4, height: 1.0, fill: INK }, stripes);
  return { defs, filter: `url(#${id}-edge)`, stripes: `url(#${id}-stripes)` };
}

return {NS,INK,PAPER,PEN,el,f,pt,pen,shape,blot,paint,limb,solid,joint,hang,curve,shoe,place,toScene,inkDefs};
})();
const __motion=(()=>{
// motion.ts — the small physics that make things feel alive without looking procedural.
const clamp = (x        , a        , b        )         => Math.max(a, Math.min(b, x));
const lerp = (a        , b        , t        )         => a + (b - a) * t;
const smooth = (e0        , e1        , x        )         => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const ease = (t        )         => smooth(0, 1, t);
const minJerk = (s        )         => s * s * s * (10 - 15 * s + 6 * s * s);
const rnd = (a        , b        )         => a + Math.random() * (b - a);
/** Seeded random for static drawing, so a scene looks the same on every load. */
function seeded(seed = 11)                                     {
  let s = seed;
  return (a = 0, b = 1) => { s = (s * 16807) % 2147483647; return a + ((s - 1) / 2147483646) * (b - a); };
}
/** Layered sines: organic drift for idle motion that doesn't read as a loop. */
const wobble = (t        , k = 1)         => Math.sin(t * 1.3 * k) * 0.6 + Math.sin(t * 2.7 * k + 1.7) * 0.3 + Math.sin(t * 5.1 * k + 4.1) * 0.1;
/**
 * Damped spring toward a moving target. Use for anything attached to a moving body:
 * sleeves, bags, ears, a parasol's tilt, arms swinging opposite the legs.
 */
function spring(stiffness = 40, damping = 6, x = 0)         {
  return {
    x, v: 0,
    step(target, dt) { this.v += (stiffness * (target - this.x) - damping * this.v) * dt; this.x += this.v * dt; return this.x; },
    kick(v) { this.v += v; },
  };
}
/**
 * Pendulum (angle in radians) for hanging things: lanterns, curtains, chimes, signs, a briefcase.
 * `force` is this frame's push — wind, the carrier's acceleration, a click.
 */
function pendulum(stiffness = 10, damping = 1.1, a = 0)           {
  return {
    a, v: 0,
    step(force, dt) { this.v += (-this.a * stiffness + force - this.v * damping) * dt; this.a += this.v * dt; return this.a; },
    kick(v) { this.v += v; },
  };
}
/** A timed sequence of named poses for an interaction (sleep → sit → stretch …). Returns null when finished. */
function sequence(steps                                        )                                     {
  const total = steps.reduce((a, s) => a + s[1], 0);
  return (t) => {
    if (t < 0 || t >= total) return null;
    let acc = 0, prev = steps[0][0];
    for (const [name, d] of steps) { if (t < acc + d) return { from: prev, to: name, u: (t - acc) / d }; acc += d; prev = name; }
    return null;
  };
}

return {clamp,lerp,smooth,ease,minJerk,seeded,wobble,spring,pendulum,sequence};
})();
const __gait=(()=>{
// gait.ts — walk and run solvers for a figure drawn in ink.ts figure space
// (feet on y = 120, facing +x, hip above x = 40).
//
// A believable gait comes from four rules, all built in here:
//  1. The planted foot slides back at exactly the travel speed (`speed`), so it
//     stays still on the ground while the figure moves by `speed`.
//  2. The swinging foot follows a minimum-jerk path: low for walking, with a heel
//     kick for running.
//  3. The heel peels off before the swing: the foot pivots on its toe.
//  4. Hip height comes from what the planted legs can reach, so a walker rises over
//     each step and dips when both feet are down. A runner compresses over the
//     planted foot and is highest in flight. No sine bobbing.
//
//   const walk = gait({ kind: 'walk' });
//   phase += dt / walk.period;  x += dir * walk.speed * scale * dt;
//   const p = walk.pose(phase);  // hip, feet[0..1] { ankle, knee, pitch, stance }, front, bob
const clamp = (x        , a        , b        ) => Math.max(a, Math.min(b, x));
const smooth = (e0        , e1        , x        ) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const minJerk = (s        ) => s * s * s * (10 - 15 * s + 6 * s * s);
function knee(hip     , ankle     , l1        , l2        )      {
  const dx = ankle[0] - hip[0], dy = ankle[1] - hip[1];
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01);
  const th = Math.atan2(dy, dx);
  const al = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const c1      = [hip[0] + l1 * Math.cos(th - al), hip[1] + l1 * Math.sin(th - al)];
  const c2      = [hip[0] + l1 * Math.cos(th + al), hip[1] + l1 * Math.sin(th + al)];
  return c1[0] > c2[0] ? c1 : c2; // knees bend forward
}
const GAIT_PRESETS                                                        = {
  // natural adult walk, ~2 steps/s
  walk: { period: 1.0, duty: 0.62, stride: 24, lift: 3.4, heelOff: 15, heelKick: 0, thigh: 23, shin: 23, ankleY: 118.4, ground: 120, toe: 4.2 },
  // kimono, tight skirt, geta: shorter stride, very low lift
  shuffle: { period: 0.9, duty: 0.64, stride: 18, lift: 2.4, heelOff: 12, heelKick: 0, thigh: 23, shin: 23, ankleY: 116, ground: 120, toe: 4.2 },
  // child's or adult's run: short ground contact, flight phase, heel kick
  run: { period: 0.5, duty: 0.36, stride: 16, lift: 12, heelOff: 10, heelKick: 3.5, thigh: 13, shin: 13, ankleY: 118, ground: 120, toe: 3 },
};
function gait(opts              = {})       {
  const kind = opts.kind ?? 'walk';
  const o = { ...GAIT_PRESETS[kind], ...opts, kind };
  const { period, duty, stride: S, lift, heelOff, heelKick, thigh, shin, ankleY, ground, toe } = o;
  const reach = (thigh + shin) * 0.983; // a planted leg is nearly, not perfectly, straight
  const restHip = ankleY - reach;
  const speed = S / (duty * period);
  const foot = (u        )                     => {
    u = ((u % 1) + 1) % 1;
    if (u < duty) {
      const x = 40 + S / 2 - (S * u) / duty;
      const peel = smooth(duty - 0.14, duty, u);
      const th = (heelOff * peel * Math.PI) / 180;
      const px = x + toe, py = ground, ox = -toe, oy = ankleY - ground; // pivot on the toe, on the ground
      return { ankle: [px + ox * Math.cos(th) - oy * Math.sin(th), py + ox * Math.sin(th) + oy * Math.cos(th)], pitch: heelOff * peel, stance: true };
    }
    const s = (u - duty) / (1 - duty);
    const x = 40 - S / 2 + S * minJerk(s) - heelKick * Math.sin(Math.PI * Math.min(1, s * 1.6));
    const y = ankleY - lift * Math.pow(Math.sin(Math.PI * Math.pow(s, heelKick ? 0.7 : 1)), 1.2);
    return { ankle: [x, y], pitch: heelOff * Math.pow(1 - smooth(0, 0.55, s), 1.4), stance: false };
  };
  return {
    ...o,
    speed,
    pose(phase, go = 1) {
      const raw = [foot(phase), foot(phase + 0.5)];
      if (go < 1) raw.forEach((fo, i) => {
        const rest = 40 + (i ? -2 : 2);
        fo.ankle = [rest + (fo.ankle[0] - rest) * go, ankleY + (fo.ankle[1] - ankleY) * go];
        fo.pitch *= go; fo.stance = true;
      });
      let hipY = restHip;
      const half = (((phase % 0.5) + 0.5) % 0.5);
      if (heelKick && go >= 1) {
        // run: compress over the planted foot, highest mid-flight
        hipY = half < duty ? restHip + 1.4 * Math.sin((Math.PI * half) / duty) : restHip - 2.6 * Math.sin((Math.PI * (half - duty)) / (0.5 - duty));
      } else {
        // walk: lowest at double support, highest as the legs pass
        for (const fo of raw) if (fo.stance) {
          const dx = fo.ankle[0] - 40;
          hipY = Math.max(hipY, fo.ankle[1] - Math.sqrt(Math.max(1, reach * reach - dx * dx)));
        }
      }
      const hip      = [40, hipY];
      const feet = raw.map((fo) => ({ ...fo, knee: knee(hip, fo.ankle, thigh, shin) }))                ;
      const front        = feet[0].ankle[0] >= feet[1].ankle[0] ? 0 : 1;
      return { hip, feet, front, bob: hipY - restHip };
    },
  };
}

return {gait};
})();
const {NS,INK,PAPER,PEN,el,f,pt,pen,shape,blot,paint,limb,solid,joint,hang,curve,shoe,place,toScene,inkDefs}=__ink;
const {clamp,lerp,smooth,ease,minJerk,seeded,wobble,spring,pendulum,sequence}=__motion;
const {gait}=__gait;
// ───────────── 그리기 도구(장면 파일이 kit 으로 받아 쓴다) ─────────────
const W=640,H=360;
const seg=(t,a,b)=>clamp((t-a)/(b-a),0,1),es=(t,a,b)=>ease(seg(t,a,b));
const setA=(n,o)=>{for(const k in o)n.setAttribute(k,typeof o[k]==='number'?f(o[k]):o[k]);return n;};
const grp=(p,a={})=>el('g',a,p);
const Lp=(pts,close)=>'M'+pts.map(pt).join('L')+(close?'Z':'');
function smoothD(pts,closed=false){const n=pts.length;if(n<2)return'';const get=i=>closed?pts[((i%n)+n)%n]:pts[Math.max(0,Math.min(n-1,i))];let d='M'+pt(pts[0]);const last=closed?n:n-1;
 for(let i=0;i<last;i++){const p0=get(i-1),p1=get(i),p2=get(i+1),p3=get(i+2);d+=`C${pt([p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6])} ${pt([p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6])} ${pt(p2)}`;}
 return d+(closed?'Z':'');}
// 굵기가 있는 띠(뿌리·가지·촉수): 가운데 선 P 를 따라 폭 w0→w1
function band(P,w0,w1){const n=P.length,A=[],B=[];for(let i=0;i<n;i++){const q=P[Math.min(n-1,i+1)],o=P[Math.max(0,i-1)],dx=q[0]-o[0],dy=q[1]-o[1],l=Math.hypot(dx,dy)||1,w=lerp(w0,w1,i/(n-1))/2;A.push([P[i][0]-dy/l*w,P[i][1]+dx/l*w]);B.push([P[i][0]+dy/l*w,P[i][1]-dx/l*w]);}
 return smoothD(A)+smoothD(B.reverse()).replace('M','L')+'Z';}
const ink=(p,d,w=1.2,extra)=>{const n=pen(p,w);n.setAttribute('d',d);if(extra)setA(n,extra);return n;};
const sh=(p,d,w=1.2)=>{const n=shape(p,w);n.setAttribute('d',d);return n;};
const bl=(p,d)=>{const n=blot(p);n.setAttribute('d',d);return n;};
const pa=(p,c,d,w=1.2)=>{const n=paint(p,c,w);n.setAttribute('d',d);return n;};
const ell=(cx,cy,rx,ry)=>`M${f(cx-rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx+rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx-rx)} ${f(cy)}Z`;
const wavy=(x0,y0,x1,y1,amp,n,R)=>{const P=[];for(let i=0;i<=n;i++){const u=i/n;P.push([lerp(x0,x1,u)+R(-amp,amp),lerp(y0,y1,u)+R(-amp,amp)]);}return P;};
// 빗금 음영(면을 칠하지 않고 선으로 어둡게)
function hatch(p,x0,y0,x1,y1,gap,slant,w,R,extra){const g=grp(p,extra||{});for(let x=x0-Math.abs(slant);x<x1+Math.abs(slant);x+=gap*(R?R(.7,1.3):1)){const a=[x,y0],b=[x+slant,y1];if(Math.max(a[0],b[0])<x0||Math.min(a[0],b[0])>x1)continue;ink(g,`M${f(clamp(a[0],x0,x1))} ${f(a[1])}L${f(clamp(b[0],x0,x1))} ${f(b[1])}`,w);}return g;}

// 스테이지: 종이·잉크·빛, 깊이별 층(카메라 시차), 가벼운 방식(lite)
function stageKit(svg,scene,lite){
 while(svg.firstChild)svg.removeChild(svg.firstChild);
 svg.style.color=scene.ink;svg.style.setProperty('--paper',scene.paper);
 const ink0=inkDefs(svg,'r880ink'),defs=ink0.defs;
 const soft=el('filter',{id:'r880soft',x:'-50%',y:'-50%',width:'200%',height:'200%'},defs);el('feGaussianBlur',{stdDeviation:lite?3:5},soft);
 const soft2=el('filter',{id:'r880soft2',x:'-50%',y:'-50%',width:'200%',height:'200%'},defs);el('feGaussianBlur',{stdDeviation:lite?1.2:2},soft2);
 const grads={};
 const glowGrad=c=>{if(grads[c])return grads[c];const id='r880g'+Object.keys(grads).length,rg=el('radialGradient',{id},defs);
  el('stop',{offset:'0','stop-color':c,'stop-opacity':'0.85'},rg);el('stop',{offset:'0.35','stop-color':c,'stop-opacity':'0.28'},rg);el('stop',{offset:'1','stop-color':c,'stop-opacity':'0'},rg);return(grads[c]=`url(#${id})`);};
 const sky=el('linearGradient',{id:'r880sky',x1:0,y1:0,x2:0,y2:1},defs);scene.sky.forEach(([o,c])=>el('stop',{offset:o,'stop-color':c},sky));
 const vg=el('radialGradient',{id:'r880vig',cx:'50%',cy:'46%',r:'72%'},defs);el('stop',{offset:'0.55','stop-color':'#000','stop-opacity':'0'},vg);el('stop',{offset:'1','stop-color':'#000','stop-opacity':'0.62'},vg);
 el('rect',{x:-40,y:-40,width:W+80,height:H+80,fill:'url(#r880sky)'},svg);
 const layers=[];
 const layer=(depth,attrs)=>{const g=grp(svg,attrs||{});layers.push({g,depth});return g;};
 const far=layer(0.35),back=layer(0.7,lite?{}:{filter:ink0.filter}),root=layer(1,lite?{}:{filter:ink0.filter});
 const glowWrap=grp(svg,{style:'mix-blend-mode:screen;pointer-events:none'}),glow=grp(glowWrap);layers.push({g:glow,depth:1});
 const front=layer(1),near=layer(1.4);
 const hud=grp(svg,{style:'pointer-events:none'});
 el('rect',{x:-40,y:-30,width:W+80,height:H+70,fill:'url(#r880vig)'},hud);
 const fade=el('rect',{x:-40,y:-40,width:W+80,height:H+90,fill:'#000',opacity:1},hud);
 const glowAt=(cx,cy,r,c,parent)=>el('circle',{cx,cy,r,fill:glowGrad(c)},parent||glow);
 const cam={x:320,y:180,z:1};
 // 카메라 길: [초, x, y, 배율, 'cut'?] — 사이를 부드럽게 잇고 'cut' 은 그 순간 건너뜀
 const track=keys=>t=>{let i=0;while(i<keys.length-1&&t>=keys[i+1][0])i++;const a=keys[i],b=keys[Math.min(keys.length-1,i+1)];
  let u=b===a||b[4]==='cut'?0:ease(seg(t,a[0],b[0]));cam.x=lerp(a[1],b[1],u);cam.y=lerp(a[2],b[2],u);cam.z=lerp(a[3],b[3],u);};
 const applyCam=t=>{const jx=lite?0:wobble(t*0.9,1)*0.7,jy=lite?0:wobble(t*0.9+7,1)*0.5;
  for(const {g,depth:d} of layers){const z=1+(cam.z-1)*d;g.setAttribute('transform',`translate(320 180) scale(${f(z)}) translate(${f(-320-(cam.x-320+jx)*d)} ${f(-180-(cam.y-180+jy)*d)})`);}};
 // 바람: 느린 산들바람(포인터 없이)
 const wind={value:.3,step(t){wind.value=.3+.5*Math.sin(t*.21)+.3*Math.sin(t*.67+1)+.12*Math.sin(t*1.9);return wind.value;}};
 const dropFilter=()=>{root.removeAttribute('filter');back.removeAttribute('filter');};
 return{svg,defs,far,back,root,glow,front,near,hud,fade,glowAt,cam,track,applyCam,wind,lite,layer,dropFilter,stripes:ink0.stripes};
}

// ── 인물: 열린 두 줄 팔다리, 얼굴 없음, 옷은 다리 둘레로 ──
function figure(parent,o={}){
 const R=grp(parent),capeG=grp(R),cape=o.cape?paint(capeG,o.cape):null,capeTrim=o.cape?pen(capeG,PEN*0.5):null;
 const farArm=limb(R,3.6);if(o.sleeve)solid(farArm,o.sleeve);
 const legs=[limb(R,4.2),limb(R,4.2)];if(o.legs)legs.forEach(l=>solid(l,o.legs));
 const shoes=[blot(R),blot(R)],upper=grp(R),body=o.robeFill?paint(upper,o.robeFill):shape(upper);
 const seam=pen(upper,PEN*0.55),seam2=pen(upper,PEN*0.55),nearArm=limb(upper,3.6);if(o.sleeve)solid(nearArm,o.sleeve);
 const handF=el('circle',{r:1.9,fill:PAPER,stroke:INK,'stroke-width':PEN*0.7},R),handN=el('circle',{r:1.9,fill:PAPER,stroke:INK,'stroke-width':PEN*0.7},upper);
 const neck=pen(upper),head=el('ellipse',{rx:4.1,ry:5.0,fill:PAPER,stroke:INK,'stroke-width':PEN},upper),hair=blot(upper),hat=o.hatFill?paint(upper,o.hatFill):shape(upper),hatLine=pen(upper,PEN*0.6),nearProp=grp(upper);
 let sword=null;if(o.sword)sword={blade:shape(nearProp,PEN*0.8),edge:pen(nearProp,PEN*0.4),guard:paint(nearProp,o.sword,PEN*0.7),grip:blot(nearProp)};
 const armS=[spring(30,6),spring(30,6)],capeS=spring(18,4),st={handN:[60,80],handF:[30,80],head:[42.6,31.6],b:0,tip:null};
 function update(s){const dt=s.dt??1/60,go=s.go??0,p=s.pose,b=(p?p.bob:0)+(s.drop||0),breath=Math.sin((s.t||0)*2.1+(o.seed||0))*0.35*(1-go);
  const LG=s.legPts||(p?p.feet.map(fo=>[p.hip,fo.knee,fo.ankle]):null);
  if(LG){LG.forEach((j,i)=>{legs[i].draw(j,[0.3,0.8]);shoe(shoes[i],j[2],s.legPts?(s.footPitch||0):p.feet[i].pitch);});const front=s.legPts?1:p.front;R.insertBefore(legs[front].g,upper);R.insertBefore(shoes[front],upper);}
  const kF=s.legPts?s.legPts[1][1]:p.feet[p.front].knee,aF=s.legPts?s.legPts[1][2]:p.feet[p.front].ankle,aR=s.legPts?s.legPts[0][2]:p.feet[1-p.front].ankle;
  const lean=s.lean||0;upper.setAttribute('transform',`rotate(${f(lean)} 40 ${f(74+b)})`);
  const S0=[41,41+b+breath],robe=o.robe||'coat';
  if(robe==='coat'||robe==='uniform'){const fx=Math.max(kF[0]+2.4,46.4),hem=robe==='uniform'?80+b:92,hemY=s.legPts?Math.min(hem,s.legPts[0][0][1]+4):hem;
   body.setAttribute('d',`M${f(S0[0]-6)} ${f(S0[1]+1)}Q${f(S0[0]-1)} ${f(S0[1]-2.4)} ${f(S0[0]+5)} ${f(S0[1]+1)}L${f(Math.min(fx-0.6,48))} ${f(66+b)}Q${f(Math.min(fx,49))} ${f(76+b*0.5)} ${f(Math.min(Math.max(fx,aF[0]-4),50))} ${f(hemY)}L${f(30.6)} ${f(hemY+1)}L${f(33.2)} ${f(66+b)}Z`);
   seam.setAttribute('d',`M${f(S0[0]+2.6)} ${f(S0[1]+4)}L${f(S0[0]+3.8)} ${f(Math.min(66+b,hemY-2))}`);seam2.setAttribute('d',robe==='uniform'||o.belt?`M${f(32.6)} ${f(64+b)}L${f(48.4)} ${f(64+b)}`:'');}
  else{const hemY=robe==='long'?116:100,fxK=Math.max(kF[0]+3,47),fxA=robe==='long'?Math.max(aF[0]+3,47.5):Math.max(kF[0]+4,48.5),bx=Math.min((robe==='long'?aR[0]:40-(40-aR[0])*0.5)-3,33);
   body.setAttribute('d',`M${f(S0[0]-6.4)} ${f(S0[1]+1)}Q${f(S0[0]-1)} ${f(S0[1]-2.4)} ${f(S0[0]+5.6)} ${f(S0[1]+1)}L${f(46.8)} ${f(64+b)}Q${f(fxK)} ${f(86+b*0.5)} ${f(fxA)} ${hemY}L${f(bx)} ${hemY+0.6}Q${f(31.4)} ${f(86+b*0.5)} ${f(33.4)} ${f(64+b)}Z`);
   seam.setAttribute('d',robe==='long'?`M${f(S0[0]+4)} ${f(S0[1]+2)}Q${f(44)} ${f(60+b)} ${f(Math.max(kF[0],44)-1)} ${f(hemY-2)}`:`M${f(33.6)} ${f(63+b)}L${f(47)} ${f(63+b)}`);
   seam2.setAttribute('d',robe==='long'?`M${f(S0[0]-3)} ${f(S0[1]+3)}L${f(S0[0]+4)} ${f(S0[1]+9)}`:'');}
  if(cape){const flow=capeS.step(-3-go*6-(s.wind||0)*4+(s.capeKick||0),dt),tipY=96+b;
   cape.setAttribute('d',`M${f(S0[0]-5)} ${f(S0[1]+1)}Q${f(S0[0]-9+flow*0.5)} ${f(60+b)} ${f(28+flow*1.4)} ${f(tipY)}Q${f(33+flow)} ${f(tipY+3)} ${f(37+flow*0.4)} ${f(tipY-1)}L${f(S0[0]+1)} ${f(S0[1]+3)}Z`);
   capeTrim.setAttribute('d',`M${f(29.5+flow*1.4)} ${f(tipY-2)}Q${f(33+flow)} ${f(tipY+1)} ${f(36.4+flow*0.4)} ${f(tipY-2.6)}`);}
  const legSwing=p&&!s.legPts?(p.feet[0].ankle[0]-40)/12:0,shF=[S0[0]-1,S0[1]+2],shN=[S0[0]+1.6,S0[1]+2.4];
  const armTo=(shp,tgt,i,sw,rest)=>{if(tgt){const e=joint(shp,tgt,17,16,-1);return[e,[tgt[0],tgt[1]]];}const a=armS[i].step(sw*go+rest,dt)*Math.PI/180,e=[shp[0]+17*Math.sin(a),shp[1]+17*Math.cos(a)];return[e,[e[0]+16*Math.sin(a+0.15),e[1]+16*Math.cos(a+0.15)]];};
  const [eF,hF]=armTo(shF,s.farHand,0,-legSwing*16,o.restF??-4),[eN,hN]=armTo(shN,s.nearHand,1,legSwing*14,o.restN??6);
  farArm.draw([shF,eF,hF],[0.2,0.5]);nearArm.draw([shN,eN,hN],[0.2,0.4]);farArm.g.setAttribute('transform',`rotate(${f(lean)} 40 ${f(74+b)})`);
  setA(handN,{cx:hN[0],cy:hN[1]});setA(handF,{cx:hF[0],cy:hF[1],transform:`rotate(${f(lean)} 40 ${f(74+b)})`});
  const hd=s.headDrop||0,ht=s.headTurn||0,hc=[42.6+hd*0.5+ht,31.6+b+breath+hd];setA(head,{cx:hc[0],cy:hc[1]});
  neck.setAttribute('d',`M${f(hc[0]-2)} ${f(hc[1]+4.2)}L${f(S0[0]-1.6)} ${f(S0[1]+0.6)}M${f(hc[0]+1.4)} ${f(hc[1]+4.4)}L${f(S0[0]+1.6)} ${f(S0[1]+0.8)}`);
  if(o.hat)o.hat(hc,hair,hat,hatLine,s);else{hair.setAttribute('d','');hat.setAttribute('d','');}
  if(sword){const ang=((s.swordAng??20)*Math.PI)/180,dx=Math.sin(ang),dy=Math.cos(ang),nx=-dy,ny=dx,h0=hN,len=o.swordLen||44,tip=[h0[0]+dx*len,h0[1]+dy*len],g0=[h0[0]+dx*3,h0[1]+dy*3];
   sword.blade.setAttribute('d',`M${f(g0[0]+nx*1.3)} ${f(g0[1]+ny*1.3)}L${f(tip[0]-nx*0.2)} ${f(tip[1]-ny*0.2)}L${f(g0[0]-nx*1.3)} ${f(g0[1]-ny*1.3)}Z`);
   sword.edge.setAttribute('d',`M${f(g0[0]+dx*3)} ${f(g0[1]+dy*3)}L${f(tip[0]-dx*6)} ${f(tip[1]-dy*6)}`);
   sword.guard.setAttribute('d',`M${f(g0[0]+nx*4.2)} ${f(g0[1]+ny*4.2)}L${f(g0[0]-nx*4.2)} ${f(g0[1]-ny*4.2)}L${f(g0[0]-nx*4.2+dx*1.6)} ${f(g0[1]-ny*4.2+dy*1.6)}L${f(g0[0]+nx*4.2+dx*1.6)} ${f(g0[1]+ny*4.2+dy*1.6)}Z`);
   sword.grip.setAttribute('d',`M${f(h0[0]-dx*5+nx)} ${f(h0[1]-dy*5+ny)}L${f(g0[0]+nx)} ${f(g0[1]+ny)}L${f(g0[0]-nx)} ${f(g0[1]-ny)}L${f(h0[0]-dx*5-nx)} ${f(h0[1]-dy*5-ny)}Z`);st.tip=tip;}
  st.handN=hN;st.handF=hF;st.head=hc;st.b=b;}
 return{g:R,update,st,nearProp};
}
// 걷는 사람: 걸음 속도 그대로 움직여 발이 미끄러지지 않는다
function walker(fig,o){let ph=o.phase||0;const w={x:o.x,y:o.y,dir:o.dir||1,s:o.s||1.15,gait:o.gait||gait({kind:'walk'}),
 step(dt,go){ph+=(dt/w.gait.period)*go;w.x+=w.dir*w.gait.speed*w.s*dt*go;place(fig.g,w.x,w.y,w.dir,w.s);return w.gait.pose(ph,go);},
 at(lx,ly){return toScene(w.x,w.y,w.dir,lx,ly,w.s);}};return w;}
const P=(c,x,y)=>`${f(c[0]+x)} ${f(c[1]+y)}`;
const HATS={
 hero:(c,hair,hat)=>{hair.setAttribute('d',`M${P(c,-4.6,1)}Q${P(c,-6,-6)} ${P(c,-.5,-6.2)}Q${P(c,4.6,-6)} ${P(c,4.4,-1.6)}L${P(c,1.5,-3)}L${P(c,-1,-1.4)}L${P(c,-2.4,2.6)}Z`);hat.setAttribute('d','');},
 topknot:(c,hair,hat,line)=>{hair.setAttribute('d',`M${P(c,-4.3,-.6)}Q${P(c,-4,-5.6)} ${P(c,.2,-5.4)}Q${P(c,4.2,-5.2)} ${P(c,4.2,-1.4)}Q${P(c,0,-3)} ${P(c,-4.3,-.6)}Z${ell(c[0]-.6,c[1]-7.2,1.7,1.9)}`);hat.setAttribute('d','');line.setAttribute('d',`M${P(c,-4.3,-1.2)}Q${P(c,0,-2.8)} ${P(c,4.3,-1.4)}`);},
 villager:(c,hair,hat,line)=>{hair.setAttribute('d',`M${P(c,-4.4,2)}Q${P(c,-5,-5.6)} ${P(c,0,-5.4)}Q${P(c,4.4,-5)} ${P(c,3.6,-1)}Q${P(c,0,-3)} ${P(c,-2,4)}Z`);hat.setAttribute('d',`M${P(c,-5,-2.6)}Q${P(c,0,-4.4)} ${P(c,5,-2.6)}L${P(c,4.6,-1)}Q${P(c,0,-2.6)} ${P(c,-4.6,-1)}Z`);line.setAttribute('d','');},
 nurse:(c,hair,hat,line)=>{hair.setAttribute('d',`M${P(c,-4.4,2.4)}Q${P(c,-5,-5.4)} ${P(c,0,-5.4)}Q${P(c,4.4,-5)} ${P(c,3.8,-1.4)}Q${P(c,0,-3)} ${P(c,-1.6,1)}Z${ell(c[0]-4.6,c[1]+1.4,2,2.2)}`);hat.setAttribute('d',`M${P(c,-3.6,-5.2)}L${P(c,-4.4,-8.6)}L${P(c,3.4,-8.6)}L${P(c,3,-5.2)}Z`);line.setAttribute('d','');},
 doctor:(c,hair,hat,line)=>{hair.setAttribute('d',`M${P(c,-4.4,.6)}Q${P(c,-5,-5.6)} ${P(c,0,-5.6)}Q${P(c,4.6,-5.2)} ${P(c,4.2,-2)}Q${P(c,0,-3.4)} ${P(c,-4.4,.6)}Z`);hat.setAttribute('d','');line.setAttribute('d',`M${P(c,1,-.6)}L${P(c,4.4,-.6)}`);},
 patient:(c,hair,hat)=>{hair.setAttribute('d',`M${P(c,-4.6,1.6)}Q${P(c,-5.6,-5.8)} ${P(c,-.4,-6)}Q${P(c,4.8,-5.6)} ${P(c,4.2,-1)}L${P(c,2,-2.6)}L${P(c,0,-1)}L${P(c,-2.2,-2.4)}L${P(c,-2.6,2.4)}Z`);hat.setAttribute('d','');},
 helm:(c,hair,hat,line)=>{hair.setAttribute('d','');hat.setAttribute('d',`M${P(c,-5,3.4)}L${P(c,-5.2,-3)}Q${P(c,0,-8.6)} ${P(c,5.4,-3)}L${P(c,5.2,1)}L${P(c,1.6,1.4)}L${P(c,1,4.6)}Z`);line.setAttribute('d',`M${P(c,1.6,-1.2)}L${P(c,5.2,-1.2)}M${P(c,0,-7.4)}L${P(c,-1,-11)}`);},
 goblin:(c,hair,hat,line)=>{hair.setAttribute('d','');hat.setAttribute('d',`M${P(c,-3.6,-2)}L${P(c,-11,-6)}L${P(c,-4.2,1.4)}ZM${P(c,3.4,-2.6)}L${P(c,9.6,-7.4)}L${P(c,4.2,.8)}Z`);line.setAttribute('d',`M${P(c,3.6,1)}L${P(c,6.4,2.2)}L${P(c,3.4,2.8)}`);},
 angel:(c,hair,hat,line)=>{hair.setAttribute('d','');hat.setAttribute('d','');line.setAttribute('d',`M${P(c,-4.4,1)}Q${P(c,-5.4,-5)} ${P(c,0,-5.6)}Q${P(c,5,-5)} ${P(c,4.4,2)}M${P(c,-4.4,1)}Q${P(c,-6,8)} ${P(c,-5,14)}`);},
};
// ── 소품·배경 ──
function hanok(p,x0,x1,base,wallH,roofH,R){const G=grp(p),ye=base-wallH;
 sh(G,Lp([[x0+6,base],[x1-6,base],[x1-4,base+9],[x0+4,base+9]],true),1.1);
 for(let x=x0+12;x<x1-8;x+=R(14,22))ink(G,`M${f(x)} ${f(base+1)}L${f(x+R(-1,1))} ${f(base+8)}`,0.5);ink(G,`M${f(x0+6)} ${f(base+4.5)}L${f(x1-6)} ${f(base+4.6)}`,0.5);
 sh(G,Lp([[x0+10,base],[x1-10,base],[x1-10,ye],[x0+10,ye]],true),1.1);
 const posts=[],n=Math.max(2,Math.round((x1-x0)/46));for(let i=0;i<=n;i++)posts.push(lerp(x0+12,x1-12,i/n));
 posts.forEach(x=>sh(G,Lp([[x-2.6,base],[x+2.6,base],[x+2.4,ye],[x-2.4,ye]],true),1));ink(G,`M${f(x0+10)} ${f(ye+7)}L${f(x1-10)} ${f(ye+7)}`,0.7);
 const wins=[];for(let i=0;i<n;i++){const a=posts[i]+5,bb=posts[i+1]-5,top=ye+12,bot=base-(i%2?22:10);sh(G,Lp([[a,top],[bb,top],[bb,bot],[a,bot]],true),0.9);
  for(let x=a+5.5;x<bb-1;x+=5.5)ink(G,`M${f(x)} ${f(top)}L${f(x)} ${f(bot)}`,0.38);for(let y=top+7;y<bot-1;y+=7)ink(G,`M${f(a)} ${f(y)}L${f(bb)} ${f(y)}`,0.38);wins.push({a,b:bb,top,bot});}
 const tipL=[x0-22,ye-9],tipR=[x1+22,ye-9],eave=smoothD([tipL,[x0+8,ye+1],[(x0+x1)/2,ye+3],[x1-8,ye+1],tipR]),ridgeY=ye-roofH,roof=shape(G,1.2);
 roof.setAttribute('d',eave+`L${f(x1-18)} ${f(ridgeY+2)}Q${f((x0+x1)/2)} ${f(ridgeY+5)} ${f(x0+18)} ${f(ridgeY+2)}Z`);
 for(let x=x0-12;x<=x1+12;x+=6.5){const u=(x-x0)/(x1-x0),eY=ye+2.5-Math.pow(Math.abs(u-0.5)*2,3)*9,rX=lerp(x0+20,x1-20,clamp(u,0,1));
  ink(G,`M${f(rX)} ${f(ridgeY+4)}Q${f((rX+x)/2)} ${f((ridgeY+eY)/2+2)} ${f(x)} ${f(eY)}`,0.42);el('circle',{cx:f(x),cy:f(eY+1.2),r:1.3,fill:PAPER,stroke:INK,'stroke-width':0.5},G);}
 sh(G,smoothD([[x0+10,ridgeY+2.5],[(x0+x1)/2,ridgeY+4.6],[x1-10,ridgeY+2.5]])+`L${f(x1-6)} ${f(ridgeY-4)}Q${f((x0+x1)/2)} ${f(ridgeY-1)} ${f(x0+6)} ${f(ridgeY-4)}Z`,1.1);
 ink(G,`M${f(x0+12)} ${f(ridgeY-0.6)}Q${f((x0+x1)/2)} ${f(ridgeY+2)} ${f(x1-12)} ${f(ridgeY-0.6)}`,0.45);for(let x=x0+14;x<x1-10;x+=9)ink(G,`M${f(x)} ${f(ye+3)}L${f(x)} ${f(ye+6)}`,0.6);
 return{G,wins,ye,ridgeY};}
function lantern(k,p,x,y,len,col){const G=grp(p),cord=ink(p,'',0.6),body=paint(G,col,0.9),ribs=pen(G,0.4),cap=blot(G),pend=pendulum(9,0.9),gl=k.glowAt(x,y+len,40,col);
 return{kick:v=>pend.kick(v),step(t,dt,force){const a=pend.step(force,dt),c=[x+Math.sin(a)*len,y+Math.cos(a)*len];cord.setAttribute('d',`M${f(x)} ${f(y)}L${f(c[0])} ${f(c[1]-6)}`);
  G.setAttribute('transform',`rotate(${f(-a*57.3)} ${f(c[0])} ${f(c[1])})`);body.setAttribute('d',ell(c[0],c[1]+1,6,8));
  ribs.setAttribute('d',`M${f(c[0]-6)} ${f(c[1]+1)}Q${f(c[0])} ${f(c[1]+3)} ${f(c[0]+6)} ${f(c[1]+1)}M${f(c[0])} ${f(c[1]-7)}L${f(c[0])} ${f(c[1]+9)}`);
  cap.setAttribute('d',`M${f(c[0]-3)} ${f(c[1]-6.4)}L${f(c[0]+3)} ${f(c[1]-6.4)}L${f(c[0]+2)} ${f(c[1]-8.6)}L${f(c[0]-2)} ${f(c[1]-8.6)}Z`);setA(gl,{cx:c[0],cy:c[1],r:38+Math.sin(t*7.3)*1.5});return c;}};}
// 깃털 날개(끝이 둥근 깃 — 박쥐 날개로 보이지 않게). base 에서 side(±1) 쪽으로, ang 도 만큼 들림
function featherWing(parent,w=0.9){const g=grp(parent),outline=shape(g,w),feathers=[0,1,2,3,4,5].map(()=>pen(g,w*0.6));
 return{g,draw(base,side,ang,len=44){const r=ang*Math.PI/180,s=side,tip=[base[0]+s*Math.cos(r)*len,base[1]-Math.sin(r)*len*0.9-len*0.14];
  const lead=[base,[lerp(base[0],tip[0],0.45),lerp(base[1],tip[1],0.7)-len*0.11],tip];
  const tips=[0,1,2,3,4,5].map(j=>{const u=(j+1)/7;return[lerp(tip[0],base[0]+s*len*0.14,u)+s*2,lerp(tip[1]+len*0.22,base[1]+len*0.7,u)+Math.sin(j*1.7)*2];});
  let d=smoothD(lead),prev=tip;tips.forEach(q=>{d+=`Q${f((prev[0]+q[0])/2+s*1.5)} ${f((prev[1]+q[1])/2+len*0.13)} ${f(q[0])} ${f(q[1])}`;prev=q;});
  d+=`Q${f(base[0]+s*3)} ${f(base[1]+len*0.4)} ${f(base[0])} ${f(base[1])}Z`;outline.setAttribute('d',d);
  feathers.forEach((n,j)=>{const q=tips[j],a0=[lerp(base[0],tip[0],0.14+j*0.11),lerp(base[1],tip[1],0.14+j*0.11)+3];n.setAttribute('d',`M${f(a0[0])} ${f(a0[1])}Q${f((a0[0]+q[0])/2+s*2)} ${f((a0[1]+q[1])/2)} ${f(q[0])} ${f(q[1]-2)}`);});return tip;}};}
// 불꽃 혀(선으로): 밑점에서 위로 흔들리는 닫힌 선
function flame(parent,col,w=0.9){const n=col?paint(parent,col,w):shape(parent,w),core=pen(parent,w*0.6);
 return{n,draw(x,y,wd,h,t,ph=0){const sw=wobble(t*2.2+ph,1.4)*wd*0.35,sw2=wobble(t*3.1+ph+2,1.2)*wd*0.2;
  n.setAttribute('d',`M${f(x-wd/2)} ${f(y)}Q${f(x-wd*0.62+sw2)} ${f(y-h*0.45)} ${f(x+sw)} ${f(y-h)}Q${f(x+wd*0.62+sw2)} ${f(y-h*0.4)} ${f(x+wd/2)} ${f(y)}Z`);
  core.setAttribute('d',`M${f(x-wd*0.12)} ${f(y-2)}Q${f(x-wd*0.2+sw2)} ${f(y-h*0.3)} ${f(x+sw*0.6)} ${f(y-h*0.62)}`);}};}
// 떠다니는 알갱이(재·눈·불티·먼지): [node,x,y,vx,vy,phase]
function motes(parent,n,R,box,o={}){const arr=[];for(let i=0;i<n;i++)arr.push({n:el('circle',{r:f(R(o.r0||0.5,o.r1||1.3)),fill:o.fill||INK},parent),x:R(box[0],box[2]),y:R(box[1],box[3]),vx:R(o.vx0??-4,o.vx1??4),vy:R(o.vy0??6,o.vy1??16),ph:R(0,6.28)});
 const w=box[2]-box[0],h=box[3]-box[1];return(t,wind=0,alpha=1)=>{for(const m of arr){const x=(((m.x-box[0]+t*m.vx+wind*t*3)%w)+w)%w+box[0],y=(((m.y-box[1]+t*m.vy)%h)+h)%h+box[1];setA(m.n,{cx:x+Math.sin(t*1.1+m.ph)*3,cy:y});m.n.setAttribute('opacity',f(alpha*(0.45+0.55*Math.sin(t*1.7+m.ph)**2)));}};}
// 네발짐승(늑대): 등줄·배줄 따로, 다리는 한 줄, 딛는 발은 땅에 붙는다
function wolf(parent,o={}){const G=grp(parent),s=o.s||1,bodyF=shape(G,PEN*0.01),legs=[0,1,2,3].map(()=>pen(G,PEN)),feet=[0,1,2,3].map(()=>blot(G)),back=pen(G,PEN),belly=pen(G,PEN),headN=shape(G,PEN),ear=blot(G),tail=pen(G,PEN),ruff=pen(G,PEN*0.5);
 const period=o.period||0.62,duty=0.56,stride=22,speed=stride/(duty*period),tailS=spring(20,3);let ph=o.phase||0;
 const foot=(u,hx)=>{u=((u%1)+1)%1;if(u<duty)return[hx+stride/2-stride*u/duty,0];const q=(u-duty)/(1-duty);return[hx-stride/2+stride*minJerk(q),-6*Math.sin(Math.PI*q)];};
 const w={x:o.x||0,y:o.y||0,dir:o.dir||1,speed,
  step(dt,go,t,headLift=0){ph+=dt/period*go;w.x+=w.dir*speed*s*dt*go;G.setAttribute('transform',`translate(${f(w.x)} ${f(w.y)}) scale(${f(w.dir*s)} ${f(s)})`);
   const bob=Math.sin(ph*4*Math.PI)*0.8*go,hipF=[16,-24+bob],hipB=[-16,-23-bob];
   [[hipF,0],[hipF,0.5],[hipB,0.25],[hipB,0.75]].forEach(([hip,off],i)=>{const ft=foot(ph+off,hip[0]),fx=lerp(hip[0]+(i%2?-2:2),ft[0],go),fy=ft[1]*go,kn=joint(hip,[fx,fy-1.2],13,13,i<2?-1:1);
    legs[i].setAttribute('d',`M${pt(hip)}Q${pt(kn)} ${f(fx)} ${f(fy-1.2)}`);feet[i].setAttribute('d',ell(fx+1,fy-1,2.2,1.3));});
   back.setAttribute('d',smoothD([[-20,-25-bob],[-8,-28],[8,-28+bob*0.5],[20,-27+bob],[27,-31-headLift*0.6]]));bodyF.setAttribute('d',smoothD([[-20,-25-bob],[-8,-28],[8,-28+bob*0.5],[20,-27+bob],[27,-31-headLift*0.6]])+`L${f(22)} ${f(-22+bob)}L${f(14)} ${f(-17+bob)}L0 -15L${f(-14)} ${f(-17-bob)}Z`);belly.setAttribute('d',smoothD([[-14,-17-bob],[0,-15],[14,-17+bob]]));
   const hc=[31,-33-headLift+bob];headN.setAttribute('d',`M${P(hc,-6,2)}Q${P(hc,-5,-5)} ${P(hc,1,-4)}L${P(hc,11,1)}L${P(hc,10,3.4)}L${P(hc,0,5)}Z`);ear.setAttribute('d',`M${P(hc,-4,-3.6)}L${P(hc,-2.6,-9)}L${P(hc,0,-4)}Z`);
   ruff.setAttribute('d',`M${P(hc,-6,3)}l-3 3M${P(hc,-4,5)}l-2 4M${P(hc,-8,0)}l-4 2`);
   const ta=tailS.step(-18*go+Math.sin(t*2+ph)*8,dt)*Math.PI/180;tail.setAttribute('d',`M-20 -25Q${f(-27-Math.cos(ta)*4)} ${f(-24+Math.sin(ta)*4)} ${f(-20-Math.cos(ta)*14)} ${f(-25+10+Math.sin(ta)*14)}`);
   return hc;}};return w;}
const kit={W,H,NS,INK,PAPER,PEN,el,f,pt,pen,shape,blot,paint,limb,solid,joint,hang,curve,shoe,place,toScene,clamp,lerp,smooth,ease,minJerk,seeded,wobble,spring,pendulum,sequence,gait,
 seg,es,setA,grp,Lp,smoothD,band,ink,sh,bl,pa,ell,wavy,hatch,figure,walker,HATS,hanok,lantern,featherWing,flame,motes,wolf};
// ───────────── 재생기 ─────────────
const REV='R880-lineart-1',KEY='storyworld.r880.lineart',WAIT=0.7,FADE_MS=480;
const SCENES=new Map();
let prefs={on:true,seen:[]};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'){if(s.on===false)prefs.on=false;if(Array.isArray(s.seen))prefs.seen=s.seen.filter(x=>typeof x==='string').slice(0,200);}}catch(_){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}};
const stats={plays:0,ended:0,skips:0,closedByRoom:0,errors:0,frames:0,filterDropped:0};let lastError=null,active=null,closing=null,pending=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e?.message||e).slice(0,300);};
const here=()=>typeof room!=='undefined'?room:null;
const nowMs=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
const solo=()=>{try{const s=window.__STORYWORLD_COOP_SIM_R62__;return !s?.mode||s.mode()==='off';}catch(_){return true;}};
const cinemaMode=()=>{try{return !!window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.()?.on;}catch(_){return false;}};
const forced=()=>{try{return /[?&]cine880=1\b/.test(location.search);}catch(_){return false;}};
const automated=()=>{try{return !!navigator.webdriver&&!forced();}catch(_){return false;}};
const finished=id=>{try{return typeof completed==='function'&&completed(id,'STORY')===true;}catch(_){return false;}};
const reducedMotion=()=>{try{if(typeof settings!=='undefined'&&settings&&'reducedMotion' in settings)return !!settings.reducedMotion;}catch(_){}try{return !!matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(_){return false;}};
const OTHER=['r317Cinema','r368v','r369v','r372v','r617v','r568','r309','r309v'];
const busy=()=>{try{if((typeof storyScene!=='undefined'&&!!storyScene)||(typeof loading!=='undefined'&&!!loading)||(typeof started!=='undefined'&&!started)||(typeof modal!=='undefined'&&!!modal))return true;
 if(typeof player!=='undefined'&&player&&!(player.hp>0))return true;if(typeof document!=='undefined'){if(document.hidden)return true;for(const id of OTHER)if(document.getElementById(id))return true;}return false;}catch(_){return false;}};
function eligible(r){return !!(r&&SCENES.has(r.id)&&r.layer==='STORY'&&(typeof layer==='undefined'||layer==='STORY')&&!r.samongR103&&!r.samongR115&&!r.exploration?.samongR103&&solo()&&!prefs.seen.includes(r.id)&&!finished(r.id));}
const titleFor=z=>{let t='';try{t=(typeof regionById!=='undefined'&&regionById?.[z]?.title)||'';}catch(_){}return t?t+' · 기억':'기억';};
function css(){if(document.getElementById('r880Css'))return;const s=document.createElement('style');s.id='r880Css';
 s.textContent='#r880{position:fixed;inset:0;z-index:2147482000;background:#030304;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .45s;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none}'
 +'#r880.on{opacity:1}#r880.out{opacity:0}'
 +'#r880.cinema{z-index:8995}'
 +'#r880.cinema .cap{display:none}'
 +'#r880 svg{width:100%;height:100%;max-height:100%;display:block}#r880 svg .pp{fill:var(--paper)}'
 +'#r880 .chap{position:absolute;left:max(16px,3vw);top:max(14px,3vh);color:#d9d2c6;font:600 13px/1.4 "Gowun Batang","Noto Serif KR",serif;letter-spacing:.18em;opacity:.85;text-shadow:0 1px 4px #000;pointer-events:none}'
 +'#r880 .cap{position:absolute;left:0;right:0;margin:0 auto;width:fit-content;box-sizing:border-box;bottom:max(4vh,26px);max-width:min(88vw,820px);padding:8px 20px;text-align:center;color:#f1ebe0;'
 +'font:500 clamp(15px,2.2vw,23px)/1.55 "Gowun Batang","Noto Serif KR",serif;letter-spacing:.03em;text-shadow:0 0 10px #000,0 2px 6px #000;background:linear-gradient(90deg,transparent,rgba(6,6,8,.7) 16%,rgba(6,6,8,.7) 84%,transparent);'
 +'border-top:1px solid var(--r880line,rgba(200,190,170,.4));border-bottom:1px solid var(--r880line,rgba(200,190,170,.4));opacity:0;transition:opacity .4s;pointer-events:none;word-break:keep-all}#r880 .cap.on{opacity:1}'
 +'#r880 .skip{position:absolute;right:max(16px,3vw);top:max(12px,2.4vh);padding:8px 16px;font:14px "Malgun Gothic",sans-serif;color:#efe9df;background:rgba(14,13,16,.66);border:1px solid #6a655c;border-radius:6px;cursor:pointer}'
 +'@media (prefers-reduced-motion: reduce){#r880,#r880 .cap{transition:none}}';document.head.appendChild(s);}
function buildScene(o){o.k=stageKit(o.svg,o.def,o.lite);o.draw=o.def.build(o.k,kit);o.simT=0;o.draw(0,1/60);o.k.applyCam(0);o.k.fade.setAttribute('opacity','1');}
// t 초까지 장면을 진행한다(1/30초 걸음으로 적분 — 걷기·용수철이 프레임 속도와 무관하게 같게). 되감기는 처음부터 다시 그린다.
function advance(o,t){t=Math.max(0,Math.min(t,o.def.D));if(t<o.simT-1e-6)buildScene(o);let guard=0;
 while(o.simT<t-1e-6&&guard++<2000){const dt=Math.min(1/30,t-o.simT);o.simT+=dt;o.draw(o.simT,dt);}
 o.k.applyCam(o.simT);o.k.fade.setAttribute('opacity',f(clamp(1-es(o.simT,0.05,0.9)+es(o.simT,o.def.D-0.9,o.def.D-0.05),0,1)));
 const line=o.def.subs.find(([a,b])=>o.simT>=a&&o.simT<b),text=line?line[2]:'';if(text!==o.text){o.text=text;if(text)o.cap.textContent=text;o.cap.classList.toggle('on',!!text);}}
function finish(o,reason){if(!o||o.done)return;o.done=true;if(active===o)active=null;closing=o;try{cancelAnimationFrame(o.raf);}catch(_){}
 if(reason==='ended')stats.ended++;else if(reason==='skip')stats.skips++;else if(reason==='room')stats.closedByRoom++;
 try{o.root.classList.remove('on');o.root.classList.add('out');}catch(_){}
 setTimeout(()=>{try{o.root.remove();}catch(_){}if(closing===o)closing=null;try{if(typeof keys!=='undefined'&&keys?.clear)keys.clear();}catch(_){}},reason==='room'?0:FADE_MS);}
function play(opt={}){if(active||typeof document==='undefined')return false;const r=here(),zone=opt.zone||r?.id,def=SCENES.get(zone);if(!def)return false;
 if(!opt.force&&(!prefs.on||automated()||!eligible(r)||busy()))return false;pending=null;
 if(!prefs.seen.includes(zone)){prefs.seen.push(zone);save();}
 try{css();const root=document.createElement('div');root.id='r880';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',titleFor(zone)+' 컷씬');
  if(cinemaMode())root.classList.add('cinema');root.style.setProperty('--r880line',def.line||'rgba(200,190,170,.4)');
  const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 14 640 360');svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.setAttribute('role','img');svg.setAttribute('aria-hidden','true');root.appendChild(svg);
  const chap=document.createElement('div');chap.className='chap';chap.textContent=titleFor(zone);root.appendChild(chap);
  const cap=document.createElement('div');cap.className='cap';cap.setAttribute('aria-live','polite');root.appendChild(cap);
  const skipBtn=document.createElement('button');skipBtn.type='button';skipBtn.className='skip';skipBtn.textContent='건너뛰기 ▸';root.appendChild(skipBtn);document.body.appendChild(root);
  const o={def,zone,root,svg,cap,room:opt.force?here():r,t0:0,raf:0,done:false,at:Number.isFinite(opt.at)?opt.at:null,text:'',lite:reducedMotion()||!!opt.lite,simT:0,slow:0,n:0,last:0};
  buildScene(o);
  root.addEventListener('pointerdown',ev=>{ev.preventDefault?.();finish(o,'skip');});skipBtn.addEventListener('click',ev=>{ev.stopPropagation?.();finish(o,'skip');});
  try{if(typeof keys!=='undefined'&&keys?.clear)keys.clear();}catch(_){}
  active=o;stats.plays++;gateOuter();requestAnimationFrame(()=>{try{root.classList.add('on');}catch(_){}});
  const loop=now=>{if(o.done)return;if(!o.t0)o.t0=now;const t=o.at!=null?o.at:(now-o.t0)/1000;o.t=t;stats.frames++;
   try{advance(o,t);
    if(o.at==null&&!o.lite&&o.n<45){if(o.last)o.slow+=now-o.last;o.last=now;++o.n;if(!o.dropped&&((o.n===12&&o.slow/11>50)||(o.n===45&&o.slow/44>30))){o.dropped=true;o.k.dropFilter();stats.filterDropped++;}}
   }catch(err){fail(err);return finish(o,'error');}
   if(o.at==null&&t>=def.D)return finish(o,'ended');o.raf=requestAnimationFrame(loop);};
  o.raf=requestAnimationFrame(loop);return true;}catch(err){fail(err);try{document.getElementById('r880')?.remove();}catch(_){}active=null;return false;}}
// 뒤에 실린 tick 감싸개도 멈추게, 재생할 때 가장 바깥 tick 에 문을 단다(R568 과 같은 방식)
let gateFn=null;
function gate(base){return function(...a){if(active){if(active.at==null&&here()!==active.room)finish(active,'room');else return;}if(closing)return;return base.apply(this,a);};}
function gateOuter(){try{if(typeof tick!=='function'||tick===gateFn)return;gateFn=gate(tick);tick=gateFn;}catch(e){fail(e);}}
function key(ev){if(!active)return false;ev.preventDefault?.();ev.stopImmediatePropagation?.();if(ev.type==='keydown'&&!ev.repeat&&(ev.key==='Escape'||ev.key==='Enter'||ev.key===' '||ev.code==='Space'))finish(active,'skip');return true;}
try{(window.__STORYWORLD_CINEMA_GUARDS__=window.__STORYWORLD_CINEMA_GUARDS__||[]).push(key);}catch(_){}
if(typeof addEventListener==='function'){addEventListener('keydown',key,true);addEventListener('keyup',key,true);}
// 도착을 기억했다가, 조용해진 뒤 0.7초에 튼다
if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(id,...a){const out=await base.call(this,id,...a);
 try{const r=here();pending=prefs.on&&!automated()&&eligible(r)?{room:r,quietSince:nowMs()}:null;}catch(e){fail(e);}return out;};}
function poll(){if(!pending||active||closing)return;const r=here();if(r!==pending.room||!prefs.on||!eligible(r)){pending=null;return;}
 if(busy()){pending.quietSince=null;return;}const n=nowMs();if(pending.quietSince==null){pending.quietSince=n;return;}
 if(n-pending.quietSince>=WAIT*1000)play();}
if(typeof tick==='function'){const base=tick;tick=function(...a){if(active){if(active.at==null&&here()!==active.room)finish(active,'room');else return;}if(closing)return;
 const out=base.apply(this,a);try{poll();}catch(e){fail(e);}return out;};}
function add(def){try{if(!def||typeof def.zone!=='string'||typeof def.build!=='function'||!Array.isArray(def.subs)||!(def.D>0))throw Error('bad scene '+def?.zone);SCENES.set(def.zone,Object.freeze({...def,subs:Object.freeze(def.subs.map(s=>Object.freeze([...s])))}));return true;}catch(e){fail(e);return false;}}
function setPrefs(p){if(p&&typeof p.on==='boolean')prefs.on=p.on;if(p?.resetSeen)prefs.seen=[];save();return{on:prefs.on,seen:[...prefs.seen]};}
window.__STORYWORLD_LINEART_R880__=Object.freeze({revision:REV,KEY,kit,add,zones:()=>[...SCENES.keys()],scene:z=>{const d=SCENES.get(z);return d?{zone:d.zone,D:d.D,subs:d.subs.map(s=>[...s])}:null;},
 titleFor,eligible,play:(o={})=>play({force:true,...o}),skip:()=>{if(!active)return false;finish(active,'skip');return true;},
 seek:t=>{if(!active||!Number.isFinite(t))return false;active.at=clamp(t,0,active.def.D);return true;},set:setPrefs,
 inspect:()=>({revision:REV,prefs:{on:prefs.on,seen:[...prefs.seen]},active:!!active,zone:active?.zone||null,t:active?active.simT:null,lite:active?active.lite:null,cinema:active?active.root.classList.contains('cinema'):null,pending:!!pending,stats:{...stats},lastError})});
})();
