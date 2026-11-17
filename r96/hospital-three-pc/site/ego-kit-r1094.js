// R1094 EGO 협주 기술(사용자 2026-11-16 01:52Z "히든영웅은 기본적으로 페르소나보스 공격과스킬 환도영웅공격과스킬 콜라보해서 너가 적절히 배분해서 사용하도록해").
//  EGO(R1046 히든 영웅 형상, 몸은 환도의 계보)가 쓰는 기술은 환도의 기술을 그대로 두고, 그 뒤에 페르소나 보스의 9가지 공격(원본 rc134 persona-skills 그림)을
//  아군 탄으로 이어 붙인다. 키는 늘리지 않는다 — A·Q·W·E·R·F 의 기존 기술마다 페르소나 기술 하나가 따라 나간다(배분표 DECK).
//   A 기본 공격: 환도 베기 + 3타마다 '악의의 관통'(창 3), 5타마다 '욕망의 씨앗'(구슬 3)
//   Q 특수: 환도 정화 연참 + 페르소나 기술 순환(순수악의의 분기 → 내면의 소용돌이 → 악의 시선 → 욕망의 일식)
//   W 월섬 회천 + '감춘 충동'(마름모 3, 시차) · E 백은 유영보 + '악의 시선'(눈 3, 도착 지점에서) · R EGO 환수검 + '끝없는 갈망'(시계 6, 사방) + '되비친 집착' 보호막
//   F EGO 각성 + '욕망의 일식'(일식 구 2, 느리고 큼)
//  판정은 엔진 makeShot(friendly)·delay 를 그대로 쓴다. 피해는 지금 공격력(attackPower) 비율로 보수적으로(기존 환도 기술 피해는 바꾸지 않음).
//  RC151 변신(엔진 '마지막 수호자 EGO')이 켜진 동안은 그쪽 기술표를 따르므로 이 파일은 아무것도 하지 않는다.
//  끄기: localStorage storyworld.r1094.egoKit = {"on":false}. 새 저장 필드·키 없음.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_EGO_KIT_R1094__)return;
const REV='R1094-ego-kit-4-R1121',KEY='storyworld.r1094.egoKit',ART='assets/rc134/persona-skills/';
const fin=Number.isFinite,clamp=(v,a,b)=>fin(v)?Math.min(b,Math.max(a,v)):a;
const F=Object.freeze;
// 페르소나 보스 원본 기술(index.html personaSkills3 와 같은 이름·모양). factor = 공격력 대비 탄 하나의 피해.
const SKILL=F({
 lance:F({key:'lance',name:'악의의 관통',count:3,spread:.38,speed:15,factor:.22,pierce:2,life:.7,scale:.7}),
 orb:F({key:'small-orb',name:'욕망의 씨앗',count:3,spread:1,speed:12,factor:.18,pierce:0,life:.75,scale:.6}),
 star:F({key:'star',name:'순수악의의 분기',count:6,spread:1.2,speed:14,factor:.3,pierce:1,life:.8,scale:.7}),
 vortex:F({key:'vortex',name:'내면의 소용돌이',count:5,spread:.95,speed:13,factor:.3,pierce:1,life:.85,scale:.7,stagger:.1}),
 eye:F({key:'eye',name:'악의 시선',count:3,spread:.55,speed:15,factor:.42,pierce:2,life:.8,scale:.7}),
 eclipse:F({key:'eclipse',name:'욕망의 일식',count:2,spread:.5,speed:8,factor:.7,pierce:6,life:1.4,scale:1.2}),
 diamond:F({key:'diamond',name:'감춘 충동',count:3,spread:.8,speed:13,factor:.25,pierce:1,life:.8,scale:.65,stagger:.14}),
 clock:F({key:'clock',name:'끝없는 갈망',count:6,ring:true,speed:11,factor:.3,pierce:2,life:.9,scale:.7,stagger:.05}),
 shield:F({key:'shield',name:'되비친 집착',count:4,spread:1.15,speed:10,factor:.2,pierce:1,life:.7,scale:.7,shield:15})});
// 배분표: 환도 기술(키) → 따라 나가는 페르소나 기술. 순환은 쓸 때마다 다음 칸.
const DECK=F({
 basic:F({every:F([F({n:3,skill:'lance'}),F({n:5,skill:'orb'})]),delay:.08}),
 special:F({cycle:F(['star','vortex','eye','eclipse']),delay:.45,power:'special'}),
 w:F({cycle:F(['diamond']),delay:.3}),
 e:F({cycle:F(['eye']),delay:.35}),
 r:F({cycle:F(['clock','shield']),delay:.5,together:true}),
 ego:F({cycle:F(['eclipse']),delay:.2})});
let on=true;try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.on===false)on=false;}catch(_){}
const stats={basic:0,special:0,w:0,e:0,r:0,ego:0,shots:0,blocked:0,errors:0,hitTint:0,sigTint:0,softTint:0,orchidSoft:0};let lastError=null,lastSkill=null;const turn={special:0,w:0,e:0,r:0,ego:0};
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const G=(f,d)=>{try{return f();}catch(_){return d;}};
const pl=()=>G(()=>typeof player==='object'&&player?player:null,null);
const now=()=>G(()=>typeof time==='number'&&fin(time)?time:null,null);
const E=()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__;
// EGO 히든 형상(R1046)일 때만. RC151 변신 중이면 그쪽 기술표.
function active(){if(!on)return false;const p=pl();if(!p||!(p.hp>0))return false;const S=E();return !!(S?.formActive?.()&&!S?.inspect?.().rc151);}
// 순수 계산: n번째 콤보에 따라 나갈 기본 공격 기술들
function basicPlan(combo){combo=Math.floor(+combo);if(!(combo>0))return[];return DECK.basic.every.filter(r=>combo%r.n===0).map(r=>r.skill);}
// 순수 계산: k번째 사용 때 고를 기술(순환)
function cyclePick(kind,k){const c=DECK[kind]?.cycle;if(!c||!c.length)return[];k=Math.max(0,Math.floor(+k)||0);return DECK[kind].together?c.slice():[c[k%c.length]];}
// 순수 계산: 탄 각도들(가운데 정렬 부채꼴 또는 사방 고리)
function angles(spec,a){const n=Math.max(1,spec.count|0),out=[];if(!fin(a))a=0;
 if(spec.ring){for(let i=0;i<n;i++)out.push(a+i*2*Math.PI/n);return out;}
 for(let i=0;i<n;i++)out.push(a+(i-(n-1)/2)*.21*(+spec.spread||1));return out;}
function aim(){const p=pl();let e=null;try{e=typeof nearestEnemy==='function'?nearestEnemy(12):null;}catch(_){}
 if(e&&p)return Math.atan2(e.y-p.y,e.x-p.x);try{if(typeof storyAim22==='function')return storyAim22();}catch(_){}return 0;}
function power(kind){const base=G(()=>attackPower(),0);if(kind==='special')return base*(2.4+.36*G(()=>rank('special'),0))/2.4;return base;}
// R1121(사용자 11-17 "에고각성 … 스킬이펙트랑 아직 이미지 짤리는버그"·"그냥 상태에서도"): ① 엔진 makeShot 감싸기가 sourceProjectile5 없는 아군 탄을 영웅 'A' 그림(hwando-a 은빛 초승달)으로 덮어써
//  페르소나 탄 9종이 모두 환도 칼바람 조각으로 보였다 → 만든 뒤 원본 그림·출처를 다시 박는다. ② 거점(safeRegion)에선 엔진이 탄을 움직이지 않아 영웅 발밑에 멈춘 채 몸을 덮었다 → 거점에선 쏘지 않는다.
const safe=()=>G(()=>typeof safeRegion==='function'&&!!safeRegion(),false);
function ownArt(s,spec,path){if(!s||typeof s!=='object')return s;s.asset=path;s.sourceProjectile5={path,sourceRect:null,owner:'ego-kit-r1094',name:spec.key};s.storyWorldKey5='ego-kit-r1094:'+spec.key;return s;}
function fire(id,kind){const spec=SKILL[id];const p=pl();if(!spec||!p||typeof makeShot!=='function')return 0;if(safe()){stats.safe=(stats.safe||0)+1;return 0;}const a=aim(),pw=power(kind)*spec.factor;if(!fin(pw)||pw<=0)return 0;
 const path=ART+spec.key+'.png';try{if(typeof readyImage==='function'&&!readyImage(path)&&typeof addImage==='function')addImage(path,'R1094 EGO');}catch(_){}
 const list=angles(spec,a);let n=0;lastSkill=spec.name;
 list.forEach((ang,i)=>{const go=()=>{const q=pl();if(!q||!(q.hp>0)||!active()||safe())return;const s=makeShot(q.x,q.y,ang,spec.speed,pw,{friendly:true,owner:'hero',asset:path,scale:spec.scale,pierce:spec.pierce,life:spec.life,radius:spec.key==='eclipse'?.3:.2,egoKitR1094:spec.key});if(s){ownArt(s,spec,path);stats.shots++;}else stats.blocked++;};
  if(spec.stagger&&i&&typeof delay==='function')delay(i*spec.stagger,go,'hero');else go();n++;});
 if(spec.shield)p.shield=Math.min(50,(+p.shield||0)+spec.shield);
 try{if(typeof floatText==='function')floatText(spec.name,p.x,p.y-.2,'#e8b7c0');}catch(_){}
 return n;}
function follow(kind,ids,after){if(!ids.length)return;const run=()=>{try{if(!active())return;for(const id of ids)fire(id,kind);}catch(e){fail(e);}};if(after>0&&typeof delay==='function')delay(after,run,'hero');else run();}
// ---- 환도 기술에 이어 붙이기 ----
// 한 번만 감싼다(다른 오버레이가 나중에 바깥을 다시 감싸도 표시가 안쪽에 묻혀 보이지 않으므로 표시 대신 이 파일의 기록으로 — 겹쳐 감싸면 기술이 여러 번 나감)
const done={};
function wrapAll(){
 if(typeof basicAttack==='function'&&!done.basic){done.basic=true;const base=basicAttack;basicAttack=function(...a){const c0=pl()?.combo;const r=base.apply(this,a);
  try{const q=pl();if(active()&&q&&q.combo>c0){const ids=basicPlan(q.combo);if(ids.length){stats.basic++;follow('basic',ids,DECK.basic.delay);}}}catch(e){fail(e);}return r;};}
 if(typeof special==='function'&&!done.special){done.special=true;const base=special;special=function(...a){const cd0=+pl()?.specialCD||0;const r=base.apply(this,a);
  try{const q=pl();if(active()&&q&&+q.specialCD>cd0+.01){stats.special++;follow('special',cyclePick('special',turn.special++),DECK.special.delay);}}catch(e){fail(e);}return r;};}
 if(typeof ego==='function'&&!done.ego){done.ego=true;const base=ego;ego=function(...a){const e0=+pl()?.ego||0;const r=base.apply(this,a);
  try{const q=pl();if(active()&&q&&+q.ego>e0){stats.ego++;follow('ego',cyclePick('ego',turn.ego++),DECK.ego.delay);}}catch(e){fail(e);}return r;};}}
// ---- R1094b 타격 섬광(7분야 심사 7.56 지적 '흰 별 터짐이 납작한 흰 덩어리') ----
// EGO 몸은 환도 계보라 엔진(index.html R13 무채색 규칙)이 타격 섬광(burst-impact)을 grayscale(1)+screen 으로 그려 흰 덩어리가 된다.
// EGO 형상일 때만 그 섬광을 주홍·먹빛으로: 무채색을 빼고(그 한 번만 sourceHero 를 EGO 로), 보통 합성 + 채도·명도 조정 + 알파 .65.
const HIT_TYPES=F(['burst']),HIT_FILTER='hue-rotate(-12deg) saturate(1.2) brightness(.8) contrast(1.2)',HIT_ALPHA=.65,HIT_HERO='ego-r1094';
// R101 영웅 타격 시트(sig-hit-pale, 3D 화면의 큰 흰 별)는 R101 이 'pale' 이면 grayscale 로 그린다 → EGO 형상일 때 그 그림만 붉은 시트(sig-hit-red)로 바꾸고
//  언주색(살짝 주황 쪽)·먹(명도·대비)·흰 속(시트 중심)으로, 알파 .65. R101 그리기(r101-air) 한 번 동안만 ctx.drawImage 를 감쌌다가 되돌린다.
const SIG_PALE=/sig-hit-pale\.webp(?:$|[?#])/,SIG_EGO='assets/r100/sig-hit-red.webp',SIG_FILTER='hue-rotate(8deg) saturate(.9) brightness(.82) contrast(1.2)';
function sigImage(){try{const r=typeof readyImage==='function'?readyImage(SIG_EGO):null,im=r?.image;if(im&&(im.naturalWidth||im.width)>0)return im;if(typeof addImage==='function')addImage(SIG_EGO,'R1094 EGO');}catch(_){}return null;}
function srcOf(im){try{return String(im?.currentSrc||im?.src||'');}catch(_){return'';}}
// 환도 계보 수묵·베기 이펙트(더하기·스크린 합성)는 EGO 형상에서 흰 덩어리로 날린다 → 그 그림들만 알파 .7·명도 .88·대비 1.12(흰 속은 남기고 날림만 누름).
const SOFT_TYPES=F(['r101-air','r102-air','r106-d2s','r945-hwando-ink','r590-hwando-chain','r1034-hwando-ink-trace']),HW_PATH=/hwando|\/r100\/sig-|\/r1041\//,SOFT_ALPHA=.7,SOFT_FILTER='brightness(.88) contrast(1.12)';
// R1094c(QA GVL478 11-16 03:17Z): 환도 난초 베기(r945, 보통 합성 흰 꽃잎)는 몹이 붙으면 영웅 둘레를 하얗게 덮는다(위치 버그 아님) →
//  EGO 형상일 때 영웅에서 1.2칸 안의 난초만 옅게(영웅 위 .45배 → 1.2칸에서 1배). 난초 자리 = 그리기 직전 translate(몹 화면 좌표).
const ORCHID_PATH=/hwando-orchid-slash\.webp(?:$|[?#])/,ORCHID_NEAR=1.2,ORCHID_MIN=.45;
// 순수 계산: 영웅과 떨어진 칸 거리 d → 난초 알파 배율
function orchidAlpha(d){d=fin(d)?Math.max(0,d):ORCHID_NEAR;return d>=ORCHID_NEAR?1:ORCHID_MIN+(1-ORCHID_MIN)*d/ORCHID_NEAR;}
function orchidTiles(x,y){try{const p=pl();if(!p||typeof project!=='function'||!fin(x)||!fin(y))return NaN;const q=project(p.x,p.y),u=(typeof TILE==='number'?TILE:34)*(typeof zoom==='number'&&zoom>0?zoom:1);return fin(q?.x)&&fin(q?.y)&&u>0?Math.hypot(x-q.x,y-q.y)/u:NaN;}catch(_){return NaN;}}
function paintSig(e,base,self,args){let C=null;try{C=typeof ctx!=='undefined'?ctx:null;}catch(_){}if(!C||typeof C.drawImage!=='function')return base.apply(self,args);
 const own=Object.prototype.hasOwnProperty.call(C,'drawImage'),d0=C.drawImage,red=sigImage(),ink=e.type==='r945-hwando-ink'&&typeof C.translate==='function';
 const ownT=ink&&Object.prototype.hasOwnProperty.call(C,'translate'),t0=ink?C.translate:null;let at=null;
 if(ink)C.translate=function(x,y){at={x:+x,y:+y};return t0.apply(this,arguments);};
 C.drawImage=function(im,...a){const src=srcOf(im),f0=C.filter,a0=C.globalAlpha;
  if(SIG_PALE.test(src)){stats.sigTint++;try{C.filter=SIG_FILTER;C.globalAlpha=clamp(a0*HIT_ALPHA,0,1);return d0.call(this,red||im,...a);}finally{C.filter=f0;C.globalAlpha=a0;}}
  if(ink&&ORCHID_PATH.test(src)){const k=orchidAlpha(at?orchidTiles(at.x,at.y):NaN);if(k<1){stats.orchidSoft++;try{C.globalAlpha=clamp(a0*k,0,1);return d0.call(this,im,...a);}finally{C.globalAlpha=a0;}}return d0.call(this,im,...a);}
  const op=C.globalCompositeOperation;if(!HW_PATH.test(src)||(op!=='lighter'&&op!=='screen'))return d0.call(this,im,...a);
  stats.softTint++;try{C.filter=(f0&&f0!=='none'?f0+' ':'')+SOFT_FILTER;C.globalAlpha=clamp(a0*SOFT_ALPHA,0,1);return d0.call(this,im,...a);}finally{C.filter=f0;C.globalAlpha=a0;}};
 try{return base.apply(self,args);}finally{if(own)C.drawImage=d0;else delete C.drawImage;if(ink){if(ownT)C.translate=t0;else delete C.translate;}}}
let inHit=false;
// 순수 계산: EGO 섬광 그리기 옵션
function hitOpt(opt){const o={...(opt&&typeof opt==='object'?opt:{})},a=+o.alpha;o.alpha=clamp((fin(a)?a:1)*HIT_ALPHA,0,1);o.filter=HIT_FILTER;o.blend='source-over';return o;}
function wrapHit(){
 if(typeof drawEffect==='function'&&!done.fx){done.fx=true;const base=drawEffect;drawEffect=function(e){if(e&&SOFT_TYPES.includes(e.type)&&!inHit&&G(active,false))return paintSig(e,base,this,arguments);if(!e||!HIT_TYPES.includes(e.type)||inHit||!G(active,false))return base.apply(this,arguments);
  const own=Object.prototype.hasOwnProperty.call(e,'sourceHero'),prev=e.sourceHero;inHit=true;stats.hitTint++;try{e.sourceHero=HIT_HERO;return base.apply(this,arguments);}finally{inHit=false;if(own)e.sourceHero=prev;else delete e.sourceHero;}};}
 if(typeof drawImage==='function'&&!done.img){done.img=true;const base=drawImage;drawImage=function(path,x,y,w,h,opt){if(!inHit)return base.apply(this,arguments);return base.call(this,path,x,y,w,h,hitOpt(opt));};}}
// W·E·R 은 엔진 안쪽(cast)이라 감쌀 수 없다 → 재사용 시각(player.storyWER.ready['hwando:w'])이 앞으로 뛰면 방금 쓴 것으로 본다.
const seen={};
// 막힌 칸(배우기 전·거점)은 ready = time+1e6 처럼 먼 값을 매 프레임 밀어 올린다 → '남은 대기'가 0.5초 넘게 갑자기 늘고, 그 값이 실제 대기(60초 미만)일 때만 쓴 것으로 본다.
function castJump(prevRem,rem){return fin(rem)&&rem>.5&&rem<60&&(!fin(prevRem)||rem>prevRem+.5);}
function watchWER(){const p=pl(),t=now();if(!p||t==null)return;const R=p.storyWER?.ready||{};
 for(const k of ['w','e','r']){const v=+R[p.hero+':'+k],rem=fin(v)?v-t:NaN,had=k in seen,prev=seen[k];seen[k]=rem;
  if(had&&castJump(prev,rem)&&active()){stats[k]++;follow(k,cyclePick(k,turn[k]++),DECK[k].delay);}}}
function wrapTick(){if(typeof tick!=='function'||done.tick)return;done.tick=true;const base=tick;const w=function(...a){const r=base.apply(this,a);try{watchWER();}catch(e){fail(e);}return r;};w.__r1094=true;tick=w;}
function install(){wrapAll();wrapTick();wrapHit();}
install();try{setInterval(()=>{try{install();}catch(e){fail(e);}},1000);}catch(_){}
window.__STORYWORLD_EGO_KIT_R1094__=Object.freeze({revision:REV,SKILL,DECK,basicPlan,cyclePick,angles,castJump,active,hitOpt,HIT_FILTER,SIG_FILTER,SOFT_FILTER,orchidAlpha,
 set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},
 inspect:()=>({revision:REV,on,active:active(),stats:{...stats},turn:{...turn},lastSkill,lastError})});
})();
