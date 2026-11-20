// R1264 영웅 몸 그림 기억 붙잡기 (사용자 2026-11-20 "기억사수 공격시 예전 이미지 나오는문제", "공격모션전수검토", 낮은 성능·777 영웅 전환 뒤 더 그렇다)
//  원인(헤드리스 전수, qa/r1264/census.mjs): 엔진은 지역에 들어갈 때 releaseImageMemory 로 그림 기억을 비우고 heroPaths(영웅) 만 남긴다.
//   heroPaths 는 엔진의 옛 영웅 그림(hero_direction·R128 g-*·R130 g-* 등)뿐이라, 덧그림들이 바꿔 그리는 지금 그림(R143·R1045·R1101·R1219 시트 등)은
//   비워지고 첫 공격·첫 스킬 때 다시 받는 동안 덧그림이 물러나 옛 그림이 그대로 보였다. 영웅 변경(777 포함)도 heroPaths 만 기다려 같은 일이 났다.
//   받는 시간이 긴 낮은 성능 기기일수록 오래 보인다.
//  고침: heroPaths(영웅) 에 그 영웅이 실제로 그리는 지금 몸 그림(아래 SEED: 전수에서 잰 경로 + 이 판에서 그려진 몸 그림)을 더한다.
//   → 지역 진입·영웅 변경 때 엔진이 함께 기다려 받고, 그림 기억 비우기에서도 남는다.
//   더한 그림은 받지 못해도 지역 진입을 막지 않는다(ensureImages 를 감싸 더한 몫만 실패를 삼킴 — 원래 필수 그림의 실패는 그대로 알림).
//  판정·피해·세이브·그림 파일은 바꾸지 않는다. 끄기: localStorage storyworld.r1264.heroArt = {"on":false}
(()=>{'use strict';
if(window.__STORYWORLD_HERO_ART_HOLD_R1264__)return;
const REV='R1264-hero-art-hold-1',KEY='storyworld.r1264.heroArt',SEEN_KEY='storyworld.r1264.heroArtSeen',CAP=48;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={heroPaths:0,added:0,soft:0,softFail:0,learned:0,held:0,missHold:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
// 전수(qa/r1264/census.mjs, 따뜻한 상태)에서 공격·스킬·서 있기 때 실제로 그려진 몸 그림. 키 = 영웅[:형상]
const SEED=Object.freeze({"lauren":["assets/r130/lauren/actions-v3126-lauren-move-left.webp","assets/r130/lauren/idle-e.webp","assets/r130/lauren/idle-n.webp","assets/r130/lauren/idle-w.webp","assets/r143/attack/lauren/attack-n.webp","assets/r143/attack/lauren/attack-s.webp","assets/r143/skill/lauren/skill-e.webp","assets/r437/attack/lauren/attack-e.webp","assets/r710/lauren/idle-s.webp"],"hwando":["assets/r1063/r283/hwando/r271/walk-e.webp","assets/r1063/r283/hwando/r271/walk-n.webp","assets/r1063/r283/hwando/r271/walk-w.webp","assets/r1063/r439/hwando/attack-e.webp"],"neon":["assets/r1238/neon/attack-e.webp","assets/r130/neon/actions-v3126-neon-move-right.webp","assets/r130/neon/idle-e.webp","assets/r130/neon/idle-n.webp","assets/r130/neon/idle-w.webp","assets/r143/attack/neon/attack-n.webp","assets/r143/attack/neon/attack-s.webp","assets/r710/neon/idle-s.webp"],"slayer":["assets/r389/slayer/attack-e.webp","assets/r389/slayer/attack-s.webp","assets/r389/slayer/walk-e.webp"],"hunter":["assets/r130/hunter/actions-v3126-hunter-move-back.webp","assets/r130/hunter/actions-v3126-hunter-move-left.webp","assets/r130/hunter/actions-v3126-hunter-move-right.webp","assets/r130/hunter/idle-e.webp","assets/r130/hunter/idle-n.webp","assets/r130/hunter/idle-w.webp","assets/r130/hunter/walk1229-e.webp","assets/r130/hunter/walk1229-n.webp","assets/r130/hunter/walk1229-s.webp","assets/r130/hunter/walk1229-se.webp","assets/r425/hunter/attack-l.webp","assets/r425/hunter/attack-r.webp","assets/r710/hunter/idle-s.webp"],"seoha":["assets/r130/seoha/idle-e.webp","assets/r130/seoha/idle-n.webp","assets/r130/seoha/idle-w.webp","assets/r143/attack/seoha/attack-e.webp","assets/r143/attack/seoha/attack-n.webp","assets/r143/attack/seoha/attack-ne.webp","assets/r143/attack/seoha/attack-s.webp","assets/r143/attack/seoha/attack-se.webp","assets/r710/seoha/idle-s.webp"],"gunner":["assets/r1003/gunner/attack-s2.webp","assets/r1003/gunner/idle-s2.webp","assets/r1045/gunner/attack-n3.webp","assets/r1045/gunner/walk-s2.webp","assets/r1045c/gunner/attack-e4.webp","assets/r1045d/gunner/walk-e3.webp","assets/r1101b/gunner/attack-ne8.webp","assets/r1101b/gunner/attack-se8.webp","assets/r1101b/gunner/idle-e6.webp","assets/r1101b/gunner/idle-ne6.webp","assets/r1101b/gunner/idle-se6.webp","assets/r1101c/gunner/attack-ne9.webp","assets/r1101c/gunner/attack-se9.webp","assets/r1111/gunner/idle-n6.webp"],"michaela":["assets/r130/michaela/idle-e.webp","assets/r130/michaela/idle-n.webp","assets/r130/michaela/idle-w.webp","assets/r143/attack/michaela/attack-e.webp","assets/r143/attack/michaela/attack-n.webp","assets/r143/attack/michaela/attack-ne.webp","assets/r143/attack/michaela/attack-s.webp","assets/r143/attack/michaela/attack-se.webp","assets/r143/skill/michaela/skill-e.webp","assets/r710/michaela/idle-s.webp"]});
const OK=/^assets\/[A-Za-z0-9_\/.\-]+\.(?:webp|png)$/;
const seen={};try{const s=JSON.parse(localStorage.getItem(SEEN_KEY)||'{}');for(const [k,v] of Object.entries(s||{}))if(Array.isArray(v))seen[k]=new Set(v.filter(p=>OK.test(p)).slice(0,CAP));}catch(_){}
let dirty=0,saveAt=0;function save(){const t=Date.now();if(!dirty||t-saveAt<5000)return;saveAt=t;dirty=0;try{localStorage.setItem(SEEN_KEY,JSON.stringify(Object.fromEntries(Object.entries(seen).map(([k,v])=>[k,[...v]]))));}catch(_){}}
const keyOf=p=>{try{return p.hero+(p.egoSovereignR1046?':ego':'')+(p.personaHeroR1113?':persona':'');}catch(_){return null;}};
function pathsFor(id){const out=new Set();for(const [k,v] of Object.entries(SEED))if(k===id||k.startsWith(id+':'))for(const p of v)out.add(p);
 for(const [k,v] of Object.entries(seen))if(k===id||k.startsWith(id+':'))for(const p of v)out.add(p);return [...out];}
const EXTRA=new Set();
const cp=p=>{try{return typeof cleanPath==='function'?cleanPath(p):p;}catch(_){return p;}};
function wrapPaths(){if(typeof heroPaths!=='function'||heroPaths.r1264)return false;const base=heroPaths;
 const w=function(id,...a){const r=base.call(this,id,...a);if(!prefs.on||!Array.isArray(r))return r;try{const have=new Set(r.map(cp)),add=[];for(const p of pathsFor(id)){const k=cp(p);if(have.has(k))continue;have.add(k);add.push(p);EXTRA.add(k);}stats.heroPaths++;stats.added=add.length;return add.length?r.concat(add):r;}catch(e){fail(e);return r;}};
 w.r1264=true;heroPaths=w;return heroPaths===w;}
// 더한 그림만 '있으면 좋은 그림': 원래 목록은 엔진 그대로 기다리고(실패도 그대로), 더한 몫은 함께 기다리되 실패해도 넘어간다.
function wrapEnsure(){if(typeof ensureImages!=='function'||ensureImages.r1264)return false;const base=ensureImages;
 const w=function(list,...a){try{if(prefs.on&&Array.isArray(list)&&EXTRA.size){const hard=[],soft=[];for(const p of list)(EXTRA.has(cp(p))?soft:hard).push(p);
   if(soft.length){stats.soft+=soft.length;const s=Promise.resolve().then(()=>base.call(this,soft)).catch(()=>{stats.softFail++;});const h=base.call(this,hard,...a);return Promise.all([h,s]).then(([v])=>v);}}}catch(e){fail(e);}
  return base.call(this,list,...a);};
 w.r1264=true;ensureImages=w;return ensureImages===w;}
// 이 판에서 그려진 몸 그림(영웅 몫 이미지 중 가장 큰 것)을 배워 다음 지역·다음 영웅 변경 때도 붙잡는다.
// 마지막 안전장치: 공격·스킬·궁극기 중 몸 그림이 옛 그림(지금 그림을 아직 못 받아 덧그림이 물러났을 때 엔진이 그리는 것)이면
//  (EGO 형상은 소환 영웅·오라가 가장 큰 그림이라 빼고) 1.5초 안에 그린 같은 영웅의 지금 그림 칸으로 바꿔 그린다(자리는 지금 발 위치로 옮김). 지금 그림을 한 번도 못 그렸으면 그대로.
//  옛 그림 = 엔진 첫 영웅 그림(hero_direction·hero-authored·assets/heroes), R128·R130 정지 자세 g-*(대시 g-dash 제외),
//   새 시트로 바뀐 옛 공격 시트(기억사수·헌터 R143 attack, 슬레이어 R351 attack) — 전수에서 따뜻한 상태엔 한 번도 안 나오고 비운 직후에만 나옴.
const OLD=/hero_direction|hero-authored|^assets\/heroes\/|^assets\/r143\/attack\/(?:gunner|hunter)\/|^assets\/r128\/gunner\/g-(?!dash)|^assets\/r130\/[a-z]+\/g-(?!dash)|^assets\/r351\/slayer\/attack-/;
const good={};const HOLD_S=1.5;const T=()=>typeof time==='number'?time:0;
const srcOf=c=>String(c?.sourcePath||c?.image?.src||'').replace(/^.*?(assets\/)/,'$1').split('?')[0];
function busyAct(p){return p.ultimateAnim>0||p.skillAnim>0||p.attackAnim>0;}
function wrapDraw(){if(typeof drawHero!=='function'||drawHero.r1264)return false;const base=drawHero;
 const w=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
  try{if(prefs.on&&st>=0&&player&&player.r720Ally!==true){let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c?.kind!=='image'||!c.points||(c.owner&&c.owner.kind!=='hero'))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}
   const k=keyOf(player);if(best&&k){const p=srcOf(best),q=typeof project==='function'?project(player.x,player.y):null;
    if(OLD.test(p)){if(prefs.guard!==false&&busyAct(player)&&!player.egoSovereignR1046&&q){const g=good[k];if(g&&T()-g.t<=HOLD_S&&g.t<=T()){const dx=q.x-g.qx,dy=q.y-g.qy,pts=g.points.map(([x,y])=>[x+dx,y+dy]);
       if(pts.flat().every(Number.isFinite)){Object.assign(best,{image:g.image,sourcePath:g.sourcePath,sourceRect:g.sourceRect.slice(),imageSize:g.imageSize?.slice?.()||best.imageSize,points:pts,immutableTint:null,r1264Hold:p});stats.held=(stats.held||0)+1;stats.lastHeld=p;}}else stats.missHold=(stats.missHold||0)+1;}}
    else if(OK.test(p)&&best.image&&best.sourceRect&&q){good[k]={t:T(),image:best.image,sourcePath:best.sourcePath,sourceRect:best.sourceRect.slice(),imageSize:best.imageSize?.slice?.(),points:best.points.map(v=>v.slice()),qx:q.x,qy:q.y};
     if(!(SEED[k]||[]).includes(p)){const s=seen[k]||(seen[k]=new Set());if(!s.has(p)&&s.size<CAP){s.add(p);dirty++;stats.learned++;}}}}save();}}catch(e){fail(e);}return r;};
 w.r1264=true;drawHero=w;return drawHero===w;}
// 몸 그림 배우기는 다른 덧그림(R991 등, 페이지가 다 올라온 뒤 감쌈)보다 바깥에서 — 바꿔 놓은 최종 그림을 배운다.
function install(){try{wrapPaths();wrapEnsure();}catch(e){fail(e);}}
function installLate(){install();try{wrapDraw();}catch(e){fail(e);}}
install();try{if(document.readyState==='complete')installLate();else window.addEventListener('load',installLate);}catch(_){}
function set(k,v){prefs[k]=v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_HERO_ART_HOLD_R1264__=Object.freeze({revision:REV,pathsFor,set,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},seed:Object.keys(SEED).length,seen:Object.fromEntries(Object.entries(seen).map(([k,v])=>[k,v.size])),lastError,browser:false,GPU:false})});
})();
