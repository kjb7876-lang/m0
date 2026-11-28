// R1393 몹 둘레 빨간 선 → 자연스러운 먹빛 테(사용자 2026-11-28 "몹들에게 빨간선같은거 둘러있어서 특히 초반몹 뭔가 잘안보임 자연스럽게 해줘").
//  원인(공개판 헤드리스 실측, 악마화 나무의 정원 dist00 — R409 테 켬/끔 같은 장면 비교):
//   ① 2D 몹: R409 적 테두리 = 바깥 핏빛 테 rgba(170,22,26,.62) + 안쪽 검은 선 .92. 어두운 몸(침식 근위·근위의 기억)이 붉은 띠에 먹혀
//      실루엣 안쪽이 오히려 안 읽혔다(붉은 테가 몸보다 눈에 띔).
//   ② 3D 몹(R1312~R1382 공통): 먹 껍질 두 겹 중 바깥 핏빛 껍질(0x7c1a1a·0x6a1616, 두께 .024~.034) — 뿌리 추적자 등 붉은 몸 둘레가 한 번 더 붉게 번졌다.
//  고침(그림만, 판정·AI·저장 그대로):
//   ① R409 가 적 테를 구울 때 이 파일의 look() 을 묻는다 → 붉은 기 없는 옅은 먹빛 그늘(바깥 알파 .3)·가는 먹선(.66), 두께 .72배.
//      회색 바닥에서도 몸이 묻히지 않을 만큼만 남긴다(수묵화풍 먹선 — R1055 와 같은 결). 영웅 테(R434·R821)는 그대로.
//   ② 3D 몹 이름 '-ink-shell' 껍질 가운데 붉은 기 큰 바깥 껍질만 재질 visible=false(안쪽 가는 먹 껍질은 그대로). 영웅 껍질(r1305·r1302)은 안 건드림.
//      엔진이 메시 visible 을 다시 켜므로 메시가 아닌 재질을 끈다. 새 껍질은 Object3D.add 훅 + 1.5초 훑기로 잡는다.
//  이펙트 투명도 규칙(R1369)과의 관계: 테두리는 이펙트가 아니라 몸 읽기 표지 — 몸 위 겹침 ≤.3 보다 옅은 바깥 그늘 .3 로 맞춤.
//  끄기: localStorage storyworld.r1393.enemyRim='off' / 주소 ?rim93=0(켜기 1). 끄면 예전 핏빛 테·껍질 그대로.
//  미검증: GPU 실기기·모바일·실제 플레이 손맛(헤드리스 소프트웨어 렌더만 확인).
(()=>{'use strict';
if(window.__STORYWORLD_ENEMY_RIM_R1393__)return;
const REV='R1393-enemy-rim-1',KEY='storyworld.r1393.enemyRim';
let on=true;try{if(localStorage.getItem(KEY)==='off')on=false;}catch(_){}
try{const q=new URLSearchParams(location.search||'').get('rim93');if(q==='0')on=false;else if(q==='1')on=true;}catch(_){}
// 먹빛(붉은 기 없음): 바깥 = 옅은 그늘(바닥과 몸을 가르는 정도), 안쪽 = 가는 먹선.
const LOOK=Object.freeze({key:'r1393a',outer:'rgba(22,16,18,0.3)',inner:'rgba(12,9,10,0.66)',k:.72});
const stats={scans:0,hidden:0,restored:0,hooked:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const SHELL=/^r13\d\d[a-z]?-ink-shell$/,HERO_SHELL=/^r130[0-9]/;
const mats=new Set();const seen=new WeakSet();
function redShell(o){if(!o||typeof o.name!=='string'||!SHELL.test(o.name)||HERO_SHELL.test(o.name))return null;const m=o.material;if(!m||Array.isArray(m)||!m.color)return null;
 const {r,g,b}=m.color;return r>.1&&r>g*2.2&&r>b*2.2?m:null;}
function handle(o){const m=redShell(o);if(!m)return 0;if(seen.has(m)){if(on&&m.visible!==false)m.visible=false;return 0;}seen.add(m);mats.add(m);if(on){m.visible=false;stats.hidden++;return 1;}return 0;}
function apply(root){let n=0;if(!root||typeof root.traverse!=='function')return 0;stats.scans++;try{root.traverse(o=>{n+=handle(o);});}catch(e){fail(e);}return n;}
let hookedProto=null;
function three(){try{return window.__STORYWORLD_PHASE1__?.controller?.state?.three||null;}catch(_){return null;}}
function hook(){const r=three(),P=r?.T?.Object3D?.prototype;if(!P||P===hookedProto||typeof P.add!=='function')return;
 const base=P.add;if(base.__r1393){hookedProto=P;return;}
 const w=function(...objs){const out=base.apply(this,objs);try{for(const o of objs)handle(o);}catch(e){fail(e);}return out;};w.__r1393=true;for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}
 P.add=w;hookedProto=P;stats.hooked++;}
function poll(){try{hook();const r=three();if(r?.scene)apply(r.scene);}catch(e){fail(e);}}
function set(v){const want=v==='on'||v===true;if(want===on)return on;on=want;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}
 for(const m of mats){if(on)m.visible=false;else{m.visible=true;stats.restored++;}}return on;}
function look(){return on?LOOK:null;}
setInterval(poll,1500);poll();
window.__STORYWORLD_ENEMY_RIM_R1393__=Object.freeze({revision:REV,look,apply,set,on:()=>on,
 inspect:()=>({revision:REV,on,look:look(),hidden:[...mats].filter(m=>m.visible===false).length,tracked:mats.size,stats:{...stats},lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false})});
})();
