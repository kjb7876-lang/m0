// R217 — 시야 범위를 0.7배까지 좁혀 영웅을 크게(사용자 2026-11-02 "시야 0.7배까지 영웅잘보이게설정추가").
//  원래 카메라 설정(R63 '가로·세로 표시 범위')은 1~2배만 된다. 그 위에 '시야 배율'(0.7~1, 기본 1)을 곱한다:
//  카메라가 정한 확대값(zoom)을 매 장면 원래 값으로 되돌린 뒤 카메라를 돌리고, 끝나면 zoom ÷ 배율 로 바꾼다(값이 쌓이지 않게).
//  0.7배면 보이는 범위가 가로·세로 70%로 줄고 영웅·몹·지형이 약 1.43배 크게 보인다. 판정·이동은 그대로.
//  환경 설정 창에 '시야 배율' 밀대를 둔다. storyworld.r217.view {f:0.7~1} 에 저장.
(()=>{'use strict';
if(window.__STORYWORLD_VIEW_R217__)return;
const REV='R217-view-1',KEY='storyworld.r217.view',MIN=.7,MAX=1;
let f=1;try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(Number.isFinite(s.f))f=Math.min(MAX,Math.max(MIN,s.f));}catch(_){}
const stats={ticks:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
let raw=null;
if(typeof cameraTick==='function'){const base=cameraTick;cameraTick=function(...a){
 if(!(f<.999)||typeof zoom!=='number'){if(raw!==null&&typeof zoom==='number'){zoom=raw;raw=null;}return base.apply(this,a);}
 try{if(raw!==null)zoom=raw;}catch(e){fail(e);}
 const r=base.apply(this,a);
 try{raw=zoom;zoom=raw/f;stats.ticks++;}catch(e){fail(e);}return r;};}
function set(v){const n=Number(v);if(Number.isFinite(n))f=Math.min(MAX,Math.max(MIN,n));try{localStorage.setItem(KEY,JSON.stringify({f}));}catch(_){}return f;}
// ---- 설정 창 ----
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{const grid=document.querySelector('#panel .settings')||document.querySelector('.settings');
 if(grid&&!document.getElementById('viewFactorR217')){const label=document.createElement('label');label.textContent='시야 배율 ';const inp=document.createElement('input');inp.type='range';inp.id='viewFactorR217';inp.min=String(MIN);inp.max=String(MAX);inp.step='0.05';inp.value=String(f);
  const out=document.createElement('output');out.textContent=f.toFixed(2)+'배';inp.oninput=()=>{set(inp.value);out.textContent=f.toFixed(2)+'배';};inp.onchange=inp.oninput;
  const hint=document.createElement('span');hint.className='small muted';hint.textContent=' (0.7배 = 영웅이 크게 보임)';label.append(inp,out,hint);grid.appendChild(label);}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
window.__STORYWORLD_VIEW_R217__=Object.freeze({revision:REV,set,factor:()=>f,MIN,MAX,inspect:()=>({revision:REV,f,raw,stats:{...stats},lastError})});
})();
