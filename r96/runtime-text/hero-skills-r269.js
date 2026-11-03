// R269 영웅 스킬 이펙트 전수조사 후 손질 — 사용자 2026-11-03 "미카엘라도 스킬사용할떄 날개각도라던가 스킬이펙트 조금더 정교화해주고
//  다른영웅들스킬도 전수조사해서 스킬이펙트 각버튼스킬마다 영웅참조에따라서 특색있도록".
//  조사(8영웅 × A·S·D·Q·F·Z·X·C, scratchpad r269-audit.md)에서 찾은 것과 고친 것:
//  ① 미카엘라 스킬 날개: Q·Z·C·성장 4단계 섬광이 모두 R106 회색 빗살 'wing' 한 쌍을 화면에 고정 각도 0 으로 영웅 몸 위에 덧그렸다.
//     C 세라핌은 펼친 날개와 접힌 날개(wingback·wingback-f)를 한 자리에 겹쳐 그려 윤곽이 두 겹이었다.
//     → 이 조잡한 날개 그리기를 빼고(fx-sprites-r106 addFilter), R101 오라의 칠한 날개(영웅 방향을 따라 앞·옆·뒤, 어깨에 붙음, 펄럭임)를
//       스킬마다 다른 자세로 펼친다: Q 정화 = 활짝 한 번 크게 퍼덕, Z 광시 = 겨눈 쪽으로 기울여 반쯤 펼쳐 빠르게 한 번, X 성광주 = 접고 후광만,
//       C 세라핌 = 뒤로 크게(1→2.2배) 펼쳐 천천히. 색은 R102 미카엘라 팔레트 하나로.
//  ② Q·Z·C 가 같은 연출: fx-d2s-r106 은 미카엘라 말고는 슬롯을 보지 않아 한 영웅의 Q·Z·C 가 같은 원형(환도 발도·라우렌 메테오 등)이었다.
//     → 이미 있는 원형 중 스킬 성격에 맞는 것으로 슬롯별로 나눈다(SLOT): 환도 Z 월섬 회천=소용돌이 칼날, C 환수검=노바, 윤서하 Z 죽은 시간=성역 고리,
//       네온 Z 성역 수복=성역 방벽, 라우렌 Z 거짓 분리=사슬(적마다 이어짐), 헌터 Z 바운스=사슬, C 꽃잎 폭풍=노바(사방), 슬레이어 Z 피의 희생=노바,
//       C 난도질=소용돌이 칼날, 기억사수 Q 기억 재현=멀티샷(겨눈 쪽, 자기 둘레 노바가 아님) 등. Q 는 사용자가 정한 것(라우렌 보라 화염 등)을 그대로 둔다.
//  ③ 공명방어(D) 막이 모든 영웅 같은 무색 → 영웅색으로 물들이고, 영웅마다 둘레를 도는 문양을 하나씩(환도 칼날·서하 시계·네온 회로·미카엘라 십자·
//     라우렌 룬·헌터 꽃잎·슬레이어 균열·기억사수 픽셀). EGO(F) 의 무색 성광 폭발은 미카엘라만(성직자) — fx-eden-r108 에서.
//  판정·피해·쿨다운은 그대로(그림만). 끄기: localStorage['storyworld.r269.skills']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_HERO_SKILLS_R269__)return;
const REV='R269-skills-1',KEY='storyworld.r269.skills';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={poses:{},filtered:0,guardDraws:0,slots:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:performance.now()/1000;
const SP=()=>window.__STORYWORLD_FX_SPRITES_R106__,R102=()=>window.__STORYWORLD_HERO_FX_R102__;
const hero=()=>typeof player==='object'&&player?player.hero:null;
// ---- ① 미카엘라 스킬 날개 자세 -------------------------------------------------------------------
const POSE={q:{life:.7,scale:1.18,beat:.3,tilt:0,open:true},z:{life:.6,scale:1.25,beat:.22,tilt:.16,open:true},x:{life:1,scale:1,beat:0,tilt:0,open:false},
 r:{life:1.15,scale:2.2,beat:.12,tilt:0,open:true,grow:.35},any:{life:.5,scale:1.1,beat:.15,tilt:0,open:true}};
let cur=null;
function start(kind){if(!on||hero()!=='michaela')return;cur={kind,t0:T(),aim:aimSide()};stats.poses[kind]=(stats.poses[kind]||0)+1;}
function aimSide(){try{const a=typeof storyAim22==='function'?storyAim22():0;return Math.cos(a)-Math.sin(a)>=0?1:-1;}catch(_){return 1;}}
function wingPose(p){if(!on||!p||p.hero!=='michaela')return null;const now=T();
 if(cur&&(now-cur.t0>POSE[cur.kind].life||now<cur.t0))cur=null;
 if(!cur&&p.skillAnim>0)return {open:true,scale:1.1,flap:Math.sin(now*9)*.06,tilt:0,alpha:1,kind:'any'};if(!cur)return null;
 const P=POSE[cur.kind],u=(now-cur.t0)/P.life,env=Math.sin(Math.PI*Math.min(1,u*1.15)),g=P.grow?Math.min(1,(now-cur.t0)/P.grow):1;
 const scale=1+(P.scale-1)*(P.grow?g*(1-Math.max(0,u-.75)/.25*.5):env),flap=-P.beat*Math.sin(Math.PI*Math.min(1,u*2))+Math.sin(now*3)*.03;
 return {open:P.open,scale,flap,tilt:P.tilt*cur.aim*env,alpha:1,kind:cur.kind};}
// 조잡한 R106 'wing'(덧셈) 과 세라핌의 뒤날개 겹침은 미카엘라일 때 그리지 않는다(R101 오라 날개 = source-over 는 남김)
function filter(name,o){if(!on||hero()!=='michaela')return true;const add=!o||!o.blend||o.blend==='lighter';
 if(add&&(name==='wing'||name==='wingback'||name==='wingback-f')){stats.filtered++;return false;}return true;}
(function hookFilter(n=0){try{const S=SP();if(S?.addFilter){S.addFilter(filter);return;}}catch(e){fail(e);}if(n<40&&typeof setTimeout==='function')setTimeout(()=>hookFilter(n+1),250);})();
// 시전 감지: Q(special) · Z/X(R247 통계) · C(원천 스킬 r 단계 경고)
if(typeof special==='function'){const base=special;special=function(...a){const before=typeof player==='object'&&player?player.specialCD:0;const r=base.apply(this,a);
 try{if(hero()==='michaela'&&player.specialCD>0&&!(before>0))start('q');}catch(err){fail(err);}return r;};}
if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt){const r=base.apply(this,arguments);
 try{const o=opt||{};if(type==='storySourceSkill'&&o.storyWER&&o.stage==='warning'&&o.sourceHero===hero()){if(hero()==='michaela'&&o.sourceSlot==='r')start('r');stats.slots++;}}catch(err){fail(err);}return r;};}
let seenZ=null,seenX=null;
function poll(){try{const M=window.__STORYWORLD_MICHAELA_R247__?.inspect?.()?.stats;if(M){if(seenZ!=null&&M.z>seenZ)start('z');if(seenX!=null&&M.x>seenX)start('x');seenZ=M.z;seenX=M.x;}}catch(err){fail(err);}}
// ---- ② 슬롯별 원형(fx-d2s-r106 의 SLOT_KIND 를 넓힘) ------------------------------------------------
const SLOT=Object.freeze({hwando:{w:'hammer',r:'nova'},seoha:{w:'aegis',r:'nova'},neon:{w:'aegis',r:'nova'},lauren:{w:'chain',r:'nova'},
 hunter:{w:'chain',r:'nova'},slayer:{w:'nova',r:'hammer'},gunner:{q:'multishot',r:'nova'}});
const slotKind=(h,slot)=>on?SLOT[h]?.[slot]||null:null,slotsFor=h=>on?SLOT[h]||null:null;
// ---- ③ 공명방어 둘레 문양(영웅마다) -----------------------------------------------------------------
const RIM={hwando:['blade',4,.46],seoha:['clock',1,0],neon:['circuit',1,0],michaela:['cross',4,.3],lauren:['rune',3,.22],hunter:['petal',6,.12],slayer:['crack',1,0],gunner:['pixel',6,.12]};
const SENT={type:'r269-guard',x:0,y:0,age:0,life:Infinity};
function drawGuard(){const p=player,S=SP(),F=R102()?.PALETTE?.[p.hero],R=RIM[p.hero];if(!S||!F||!R||typeof project!=='function')return;
 const q=project(p.x,p.y),h=typeof actorHeight==='function'?actorHeight():60,t=T(),[name,n,sz]=R,pb=S.pal?S.pal(F.b):F;stats.guardDraws++;
 if(n===1){S.draw(name,F,q.x,q.y,h*2.2,h*2.2,{squash:.5,angle:name==='clock'?-t*.8:t*.5,alpha:.55});return;}
 for(let i=0;i<n;i++){const a=t*1.6+i*Math.PI*2/n,x=q.x+Math.cos(a)*h*.95,y=q.y-h*.45+Math.sin(a)*h*.32,front=Math.sin(a)>0;
  S.draw(name,i%2?pb:F,x,y,h*sz*2,h*sz*2*(name==='blade'?.3:1),{angle:name==='blade'?a+Math.PI/2:t*2+i,alpha:front?.95:.55});}}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e===SENT){try{if(on&&player?.guard)drawGuard();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
function tick(){try{poll();if(on&&typeof player==='object'&&player?.guard&&typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}
 else if((!on||!player?.guard)&&typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(err){fail(err);}
 typeof requestAnimationFrame==='function'?requestAnimationFrame(tick):setTimeout(tick,33);}tick();
function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_HERO_SKILLS_R269__=Object.freeze({revision:REV,set,on:()=>on,wingPose,slotKind,slotsFor,filter,start,slots:SLOT,inspect:()=>({revision:REV,on,cur:cur&&{...cur},stats:JSON.parse(JSON.stringify(stats)),lastError})});
})();
