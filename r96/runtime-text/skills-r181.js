// R181 — 스킬 이펙트 정리(사용자 2026-11-01 "확실하게 개선 및 디버깅, 모든 스킬 이펙트 개선, 렉 개선").
//  영웅 8명 × 기본공격·고유기술·블링크·공명방어·EGO 를 화면으로 찍어 본 결과(헤드리스, dist02):
//  ① 상태이상 칩(출혈·중독·쇠약·공격↓·오염·중독·허약·공격 저하…)이 영웅 체력 막대 아래 두 줄까지 쌓여 영웅과 스킬을 가림
//     → 같은 상태는 한 칩으로 합치고 이름은 앞말만(쇠약·공격↓ → 쇠약, 오염·중독 → 오염), 남은 시간이 가장 긴 것을 남긴다(판정은 그대로).
//  ② 고유기술 그림이 흰색으로 타 버림: 환도 고유기술 큰 베기(hero-q, 4.2칸)·서하 '시간 균열' 얼음 결정(표적 위로 영웅 키의 2배 넘게)
//     → 고유기술 큰 그림은 투명도를 낮추고(×.72) 너무 큰 것은 줄이며, 영웅 피격점 그림은 영웅 키 0.95배를 넘지 않게 한다.
//  ③ 한 번 맞을 때마다 같은 표적에 네모난 '충돌 섬광(burst-impact)'과 영웅 고유 피격점 그림이 겹쳐 그려짐(그리기 횟수도 두 배)
//     → 같은 표적·같은 순간에 영웅 피격점 그림이 있으면 네모 섬광은 그리지 않는다(환도는 R35 에서 이미 이렇게 함).
//  ④ 미카엘라·서하·기억사수·헌터 기본공격이 맞는 자리에 보이는 것이 거의 없음 → 맞는 자리에 영웅 색 섬광 프레임(R163 hit-flash) 하나.
//  판정·피해·쿨다운은 건드리지 않는다. storyworld.r181.skills {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_SKILLS_R181__)return;
const REV='R181-skills-1',KEY='storyworld.r181.skills';
let prefs={on:true,chips:true,tame:true,dedupe:true,flash:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={chipRowsIn:0,chipRowsOut:0,tamed:0,shrunk:0,dedupedBursts:0,flashes:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const fin=Number.isFinite;
// ---- ① 상태 칩 합치기 ----
function shortLabel(l){const s=String(l||'').replace(/[↓↑]/g,'').trim();const head=s.split(/\s*·\s*/)[0].trim();return head||s;}
function compact(rows){if(!Array.isArray(rows)||!prefs.on||!prefs.chips)return rows;stats.chipRowsIn+=rows.length;const by=new Map(),out=[];
 for(const r of rows){if(!r||typeof r!=='object'){out.push(r);continue;}const label=shortLabel(r.label),k=(r.kind==='buff'?'b':'d')+'|'+label;/* 같은 이름 해로운 효과는 출처(R53·R58·R61)가 달라도 한 칩 */const old=by.get(k);
  if(old){if(fin(r.remaining)&&(!fin(old.remaining)||r.remaining>old.remaining))old.remaining=r.remaining;continue;}
  const row={...r,label};by.set(k,row);out.push(row);}
 stats.chipRowsOut+=out.length;return out;}
function wrapWounds(){const W=window.__STORYWORLD_HOSPITAL_WOUNDS_R53__;if(!W||W.__r181||typeof W.statusRows!=='function')return false;
 const base=W.statusRows;const next=Object.freeze({...W,statusRows(...a){const r=base.apply(W,a);try{return compact(r);}catch(e){fail(e);return r;}},__r181:true});
 try{window.__STORYWORLD_HOSPITAL_WOUNDS_R53__=next;return true;}catch(e){fail(e);return false;}}
// ---- ②·③ 그리기 때 손질 ----
const HERO_Q=/assets\/vfx\/heroes\/[a-z]+-q\.webp$/;
const heroOf=e=>e?.heroIdE568||e?.sourceHero||e?.nativeVfxHeroOct11||e?.ownerHero||null;
function withTemp(e,patch,run){const keys=Object.keys(patch),old=keys.map(k=>[k,Object.prototype.hasOwnProperty.call(e,k),e[k]]);for(const k of keys)e[k]=patch[k];try{return run();}finally{for(const [k,had,v] of old){if(had)e[k]=v;else delete e[k];}}}
function alphaScope(k,run){if(typeof ctx==='undefined'||!ctx)return run();ctx.save();try{ctx.globalAlpha*=k;return run();}finally{ctx.restore();}}
try{
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){
   if(!prefs.on||!e||typeof e!=='object')return base.apply(this,[e,...a]);
   try{
    // ③ 네모 충돌 섬광: 같은 표적에 영웅 피격점 그림이 같은 순간(0.12초 안) 있으면 건너뛴다
    if(prefs.dedupe&&e.type==='burst'&&e.r7DamageTarget!=null&&Array.isArray(effects)&&effects.some(f=>f!==e&&f.type==='e568HeroImpact'&&f.r7DamageTarget===e.r7DamageTarget&&Math.abs((f.age||0)-(e.age||0))<.12)){stats.dedupedBursts++;return;}
    if(prefs.tame){
     // ② 고유기술 큰 그림(영웅 -q)
     if((e.type==='slash'||e.type==='sigil'||e.type==='storySourceSkill')&&HERO_Q.test(String(e.asset||''))&&fin(e.size)&&e.size>=3){stats.tamed++;
      const size=e.size>4?4+(e.size-4)*.25:e.size;if(size!==e.size)stats.shrunk++;return withTemp(e,{size},()=>alphaScope(e.size>=5?.6:.72,()=>base.apply(this,[e,...a])));}
     // ② 영웅 피격점 그림: 영웅 키 0.95배 상한(환도는 R44/R49 가 따로 그린다)
     if(e.type==='e568HeroImpact'&&heroOf(e)!=='hwando'&&typeof actorHeight==='function'&&typeof zoom!=='undefined'){const cap=actorHeight()*.95/Math.max(.01,zoom);
      if(fin(e.sizePxE568)&&e.sizePxE568>cap){stats.shrunk++;return withTemp(e,{sizePxE568:cap},()=>alphaScope(.86,()=>base.apply(this,[e,...a])));}
      if(!fin(e.sizePxE568)&&112>cap){stats.shrunk++;return withTemp(e,{sizePxE568:cap},()=>alphaScope(.86,()=>base.apply(this,[e,...a])));}}
    }
   }catch(err){fail(err);}
   return base.apply(this,[e,...a]);};}
 // ④ 기본공격이 약하게 보이는 영웅: 맞는 자리에 영웅 색 섬광 한 장
 const FAINT=new Set(['michaela','seoha','gunner','hunter']);
 if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt={}){const r=base.apply(this,arguments);
   try{if(prefs.on&&prefs.flash&&type==='e568HeroImpact'&&FAINT.has(opt?.heroIdE568)&&!/skill|ultimate/.test(String(opt?.sourceActionE568||''))){
     const P=window.__STORYWORLD_PIXELFX_R163__,C=window.__STORYWORLD_HERO_FX_R102__?.PALETTE?.[opt.heroIdE568];
     if(P?.has?.('hit-flash')&&fin(x)&&fin(y)){P.play('hit-flash',x,y,{k:.62,z:(typeof actorHeight==='function'?actorHeight():60)*.42,tint:C?{a:C.a,b:C.b}:undefined});stats.flashes++;}}}catch(err){fail(err);}
   return r;};}
}catch(e){fail(e);}
let tries=0;(function arm(){if(wrapWounds()||++tries>40)return;setTimeout(arm,250);})();
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_SKILLS_R181__=Object.freeze({revision:REV,compact,shortLabel,set,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},woundsWrapped:!!window.__STORYWORLD_HOSPITAL_WOUNDS_R53__?.__r181,lastError})});
})();
