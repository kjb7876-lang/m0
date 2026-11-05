// R209 — 영웅 스킬 중복 정리 + 남은 스킬 이펙트를 영웅 결에 맞게(사용자 2026-11-01 "영웅들 스킬들도 중복되는건 하나의스킬로남기고
//  나머지 스킬들 이펙트개선해줘 영웅들 특성에 맞게").
//  ① 중복 정리(판정이 같은 두 스킬 중 하나만 남김):
//     · 모든 영웅의 본편 E(X 키: 돌진·응급 위상전이) = 블링크(S)와 같은 순간 이동 → 블링크만 남긴다.
//     · 미카엘라 본편 W '천상 방패'(보호막 45) = 공명방어(D, 보호막·상태이상 해제) → 공명방어만.
//     · 기억사수 본편 W '상태 정화'(상태이상 해제) = 공명방어(D, R136 부터 상태이상 모두 해제) → 공명방어만.
//     지운 칸은 단추를 숨기고 X 키를 풀며, 반자동·길잡이 자동 시전도 막는다(재사용 대기를 멀리 둠). 피해·판정·저장은 그대로.
//  ② 남은 본편 W·R 이펙트: 원래 그림(영웅 행동 그림) 아래에 영웅 결의 칠한 스프라이트(R106 fx-sprites)를 깐다 —
//     바닥 원(스킬 반지름 그대로)·결 문양·불꽃 몇 개. 환도 은빛 달 베기 / 서하 창백한 시계 / 네온 청록 회로 / 미카엘라 핏빛 성흔 십자 /
//     라우렌 보랏빛 룬·십자 / 헌터 진홍 꽃잎 / 슬레이어 검붉은 갈라짐 / 기억사수 호박빛 조각. 피격점에도 같은 결의 작은 불꽃.
//  storyworld.r209.skills {dedupe:false|fx:false} 로 끈다.
//  R291(사용자 2026-11-04 결정 "E·W 둘 다 되살리기"): 키를 QWER+ASDF 로 바꾸면서 여덟 키가 모두 기술을 쓰도록 ① 중복 정리를 기본으로 끈다
//   (dedupe 기본 false — 모든 영웅 본편 E, 기억사수 W 가 다시 켜지고 단추·E/W 키·반자동·길잡이 자동 시전도 돌아온다).
//   storyworld.r209.skills {dedupe:true} 로 예전처럼 다시 지울 수 있다(R291 이후 저장한 값만 따른다 — 그 전 저장값의 dedupe 는 옛 기본값이라 무시).
//   미카엘라 W·E 는 R247 새 스킬(비숍 결)이 맡으므로, R247 이 켜져 있으면 원래 칸(천상 방패·응급 위상전이)은 dedupe 와 상관없이 계속 막는다
//   (같은 키에 두 기술이 함께 나가지 않게). ② 이펙트(fx)는 그대로 켜 둔다.
(()=>{'use strict';
if(window.__STORYWORLD_SKILLS_R209__)return;
const REV='R209-skills-1',KEY='storyworld.r209.skills';
let prefs={dedupe:false,fx:true};try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{};if(!saved.r291)delete saved.dedupe;prefs={...prefs,...saved};}catch(_){}
const stats={blocked:0,layers:0,hits:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const HEROES8=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'];
const REMOVED=Object.freeze(Object.fromEntries(HEROES8.map(h=>[h,h==='michaela'||h==='gunner'?['e','w']:['e']])));
const WHY={e:'블링크(S)와 같은 순간 이동',w:'공명방어(D)와 같은 보호막·상태이상 해제'};
const removed=(hero,slot)=>!!(prefs.dedupe&&REMOVED[hero]?.includes(slot));
const FAR=1e6;
/* R247: 미카엘라 Z·X 는 새 스킬(비숍 결)이 맡는다 — 원래 칸(방패·위상전이)은 계속 막고(재사용 대기), 단추·창구 입구만 R247 에 넘긴다 */
const owned=(hero,slot)=>hero==='michaela'&&(slot==='w'||slot==='e')&&!!window.__STORYWORLD_MICHAELA_R247__?.on?.();
function gate(){try{if(typeof player!=='object'||!player||typeof time!=='number')return;const s=player.storyWER||(player.storyWER={ready:{},buffs:{}});if(!s.ready)s.ready={};
  for(const slot of REMOVED[player.hero]||[]){const k=player.hero+':'+slot;if(removed(player.hero,slot)||owned(player.hero,slot)){if(!(s.ready[k]>time+FAR/2)){s.ready[k]=time+FAR;stats.blocked++;}}else if(s.ready[k]>time+FAR/2)s.ready[k]=0;}}catch(e){fail(e);}}
function hideButtons(){try{const hero=typeof player==='object'&&player?player.hero:null;for(const slot of ['w','e','r']){const b=document.getElementById('story-wer-'+slot);if(!b)continue;const off=!!hero&&removed(hero,slot)&&!owned(hero,slot);if(b.hidden!==off)b.hidden=off;if(off)b.style.display='none';else if(b.style.display==='none')b.style.display='';}}catch(e){fail(e);}}
// X 키(E 칸)는 모든 영웅에서 지웠으니 묶음에서 뺀다. Z 는 남은 영웅이 있어 그대로 두고 재사용 대기로 막는다.
// R211(Codex #132): 협동 시뮬레이션의 다른 영웅은 자기 차례에 player 를 바꿔 window.__STORYWORLD_WER__.cast 를 바로 부른다 → 시전 입구에서도 막는다.
let werWrapped=false;function wrapCast(){const W=window.__STORYWORLD_WER__;if(!W||werWrapped||W.__r209)return !!W;const base=W.cast;
 window.__STORYWORLD_WER__=Object.freeze({...W,__r209:true,cast(slot,...a){try{const h=typeof player==='object'&&player?player.hero:null;if(h&&removed(h,String(slot).toLowerCase())&&!owned(h,String(slot).toLowerCase())){stats.blocked++;return false;}}catch(e){fail(e);}return base.call(this,slot,...a);}});werWrapped=true;return true;}
function rebind(){try{wrapCast();const b=window.__STORYWORLD_WER__?.bindings;if(!b)return false;if(prefs.dedupe){if(b.x==='e')delete b.x;}else if(!b.x)b.x='e';return true;}catch(e){fail(e);return false;}}
// 저장: 지운 칸의 먼 재사용 대기는 저장 파일에 남기지 않는다(원래 코드가 15배 박자로 자르지만, 끄면 바로 돌아오도록).
if(typeof serializeSave==='function'){const base=serializeSave;serializeSave=function(...a){const d=base.apply(this,a);try{const r=d?.storyWER?.remaining;if(r&&typeof player==='object'&&player)for(const slot of REMOVED[player.hero]||[])if(removed(player.hero,slot)||owned(player.hero,slot))delete r[player.hero+':'+slot];}catch(e){fail(e);}return d;};}
if(typeof tick==='function'){const base=tick;tick=function(...a){gate();return base.apply(this,a);};}
if(typeof updateHUD==='function'){const base=updateHUD;updateHUD=function(...a){const r=base.apply(this,a);hideButtons();return r;};}
let tries=0;(function arm(){if(!rebind()&&++tries<60&&typeof setTimeout==='function')setTimeout(arm,250);})();

// ---- ② 영웅 결 이펙트 -------------------------------------------------------------------------
const THEME={
 hwando:{a:[176,198,224],b:[236,242,255],mark:'slashwide',bits:'slashline',spin:1},
 seoha:{a:[150,184,214],b:[226,238,250],mark:'clock',bits:'shard',spin:-.5},
 neon:{a:[40,170,176],b:[170,250,240],mark:'circuit',bits:'bolt',spin:.8},
 michaela:{a:[150,22,34],b:[236,190,120],mark:'cross'/* R337 */,bits:'cross',spin:.3},
 lauren:{a:[92,40,150],b:[210,170,250],mark:'cross'/* R337: 마법진 금지, 십자가만 */,bits:'cross',spin:-.7},
 hunter:{a:[160,20,40],b:[250,150,150],mark:'ring',bits:'petal',spin:1.4},
 slayer:{a:[110,10,14],b:[210,80,60],mark:'crack',bits:'slash',spin:0},
 gunner:{a:[170,110,40],b:[250,214,150],mark:'ring',bits:'shard',spin:.6}};
const SP=()=>window.__STORYWORLD_FX_SPRITES_R106__;
const pals=new Map();const palOf=h=>{let p=pals.get(h);if(!p){const t=THEME[h],S=SP();if(!t||!S?.pal)return null;p=S.pal(t.a,t.b);pals.set(h,p);}return p;};
const hashN=s=>{let h=7;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h;};
function layer(e){const S=SP(),t=THEME[e.sourceHero],P=palOf(e.sourceHero);if(!S?.draw||!t||!P||typeof project!=='function')return;
 const q=project(e.x,e.y),u=Math.min(1,Math.max(0,e.age/(e.life||.4))),z=typeof zoom==='number'?zoom:1,T=(typeof TILE==='number'?TILE:34)*z;
 if(e.stage==='hit'){const k=1-u,s=T*(.9+.5*u);S.draw('glow',P,q.x,q.y-T*.6,s*1.3,s,{alpha:.35*k});S.draw(t.bits,P,q.x,q.y-T*.6,s,s,{alpha:.7*k,angle:hashN(e.castId)%628/100});stats.hits++;return;}
 if(e.stage!=='release')return;
 const R=Math.min(8,Math.max(1.2,Number(e.size)||2.5)),rx=R*T*Math.SQRT2,k=Math.sin(Math.PI*Math.min(.999,u)),ang=(typeof time==='number'?time:0)*t.spin+(hashN(e.castId)%628)/100;
 S.draw('glow',P,q.x,q.y,rx*2.1,rx*1.05,{alpha:.22*k});// 바닥 번짐
 S.draw('ring',P,q.x,q.y,rx*2*(.7+.3*u),rx*(.7+.3*u),{alpha:.55*k,angle:ang});// 스킬 반지름 바닥 원(2:1)
 S.draw(t.mark,P,q.x,q.y,rx*1.1,rx*.55,{alpha:.5*k,angle:ang*.5});// 결 문양(바닥에 눕힘)
 const n=R>4?7:5;for(let i=0;i<n;i++){const a=ang+i*Math.PI*2/n,r=rx*(.35+.55*u);S.draw(t.bits,P,q.x+Math.cos(a)*r,q.y+Math.sin(a)*r*.5-T*.3*k,T*.9,T*.9,{alpha:.75*k,angle:a});}
 stats.layers++;}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){try{if(prefs.fx&&e&&e.type==='storySourceSkill'&&e.storyWER&&THEME[e.sourceHero])layer(e);}catch(err){fail(err);}return base.call(this,e,...a);};}
function set(p){prefs={...prefs,...p,r291:true};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}rebind();return{...prefs};}
window.__STORYWORLD_SKILLS_R209__=Object.freeze({revision:REV,set,removed,REMOVED,WHY,THEME,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
