/* R1286 EGO 진입 이펙트 손질 (사용자 2026-11-21 01:36Z, 캡처 사진에 동그라미: "미카엘라 양옆에 … 뭐 올라오는 거 모든 영웅에게서 없애줘,
 *  미카엘라만 주변에 구름 오라 같은 게 감싸잖아 그걸 플레이어 고유색에 맞춰서 ego 상태 돌입 시 나오게, 저 올라오는 효과는 반투명 검게 해서
 *  적 공격에 맞았을 때 영웅 쪽에 올라오게 암흑 그림자 공격 느낌으로, 거미 등 일반몹 돌진 공격하고 3개 봉우리 같은 거 올라오는 회색 그거
 *  크기 조금 작게 하고 플레이어에게 적중 시만 플레이어 쪽에 나타나게 반투명하게").
 *  정체(헤드리스 측정, 공개판 murder01, 그리기 명령 숨겨 가르기):
 *   · 올라오는 것 = R163 pixelfx 'pvfx-earth-rupture'(땅에서 세 봉우리가 솟는 시트). F(EGO 진입) 때 R225 fFx 가 영웅 둘레 세 곳에 영웅색으로 띄운다.
 *   · 구름 오라 = R1041 Dots M3 시트(fx-m3-michaela-ego-on 6칸 → loop 10칸). R1039 의 r111:ego-back sig-aura-magenta 만 바꾸므로 미카엘라에게만 나온다.
 *   · 몹 돌진 봉우리 = 같은 'pvfx-earth-rupture', R286 돌진·블링크 착지 때 crack()(k .45, BLOOD 물들임 a[70,6,10]).
 *  바꾼 것(그리기만 — 판정·피해·쿨다운·세이브는 그대로):
 *   ① EGO 진입(ego() 호출 안)에서 나오는 땅 균열은 띄우지 않는다(모든 영웅). 어둠 폭발·공명 깨짐 등 다른 진입 연출은 그대로.
 *   ② r111:ego-back 의 sig-aura·sig-gather(미카엘라 외 영웅) → 구름 시트(assets/r1286, 하트 장식 지운 회색본 — tools/r1286/bake_ego_cloud.py)를
 *      영웅 고유색(R102 PALETTE, EGO 형상 = 언주+흰, 페르소나 = 언주)으로 한 번 물들여 R1041 M3 와 같은 자리·크기로. 앞 겹·소용돌이는 뺀다(한 겹 구름).
 *      시트가 아직 안 읽혔으면 원래 오라 그대로(효과가 통째로 비지 않게). 미카엘라는 R1041 원본 그대로.
 *   ③ 적 공격에 실제로 맞아(체력이 줄어) 들면 영웅 자리에 같은 균열을 반투명 검정으로(0.5초에 한 번).
 *   ④ R286 착지 균열은 착지 자리에 띄우지 않고 기억만 해 둔다. 그 몹이 돌진 중이거나 착지 1.5초 안에 플레이어를 맞히면
 *      ③ 대신 플레이어 자리에 작게(k .45 → .4) 반투명 회색으로.
 *  감싸기: ego·hurt·pixelfx play·DrawCommands push 를 늦게 실리는 오버레이(R225·R163·R1041 등)보다 바깥에 두려고 1초마다 다시 바깥에 선다(깊이 세어 한 번만 동작).
 *  끄기: localStorage 'storyworld.r1286.egoFx' = 'off'. */
(()=>{'use strict';
if(window.__STORYWORLD_EGO_CLOUD_R1286__)return;
const REV='R1286-ego-cloud-1',KEY='storyworld.r1286.egoFx',RUP='pvfx-earth-rupture';
const fin=Number.isFinite;
let on=true;try{const v=localStorage.getItem(KEY);if(v==='off'||v==='0'||v==='false')on=false;}catch(_){}
const stats={egoRupturesCut:0,dashCracksHeld:0,hitShadows:0,dashHits:0,clouds:0,cloudFallback:0,layersCut:0,tints:0,wraps:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>{try{return fin(time)?time:0;}catch(_){return 0;}};
const P=()=>{try{return typeof player==='object'&&player?player:null;}catch(_){return null;}};
// ---- 색 ----
const UNJU=[204,52,40],WHITE=[243,238,226];
function formOf(){const p=P();if(!p)return 'hwando';
 try{const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;if(E&&typeof E.formActive==='function'?E.formActive():(p.egoSovereignR1046===true&&p.hero==='hwando'))return 'ego';}catch(_){}
 try{const Q=window.__STORYWORLD_PERSONA_HERO_R1113__;if(Q&&typeof Q.formActive==='function'?Q.formActive():(p.personaHeroR1113===true&&p.hero==='lauren'))return 'persona';}catch(_){}
 return String(p.hero||'hwando');}
function tintFor(form=formOf()){if(form==='ego')return {a:UNJU.slice(),b:WHITE.slice()};if(form==='persona')return {a:UNJU.slice(),b:[255,168,150]};
 try{const c=window.__STORYWORLD_HERO_FX_R102__?.PALETTE?.[form];if(c&&Array.isArray(c.a)&&Array.isArray(c.b))return {a:c.a.slice(0,3),b:c.b.slice(0,3)};}catch(_){}
 return {a:[214,222,234],b:[255,198,72]};}
// ---- ① ③ ④ 균열 ----
const SIDE=1,BLACK={k:.8,alpha:.72,tint:{a:[14,10,18],b:[72,60,88]}},GRAY={k:.4,alpha:.65,tint:{a:[176,176,184],b:[228,228,236]}};
const isDashCrack=o=>!!(o&&o.k===.45&&o.tint&&Array.isArray(o.tint.a)&&o.tint.a[0]===70&&o.tint.a[1]===6&&o.tint.a[2]===10);
let egoDepth=0,self=false,hurtDepth=0,lastShadow=-9;const cracks=[];
function wrapPixelfx(){const X=window.__STORYWORLD_PIXELFX_R163__;if(!X||typeof X.play!=='function'||X.__r1286)return;const base=X.play;
 const play=function(name,x,y,o){if(on&&!self&&name===RUP){try{
   if(egoDepth>0){stats.egoRupturesCut++;return null;}
   if(isDashCrack(o)){cracks.push({x,y,t:T()});if(cracks.length>24)cracks.shift();stats.dashCracksHeld++;return null;}}catch(e){fail(e);}}
  return base.apply(this,arguments);};
 window.__STORYWORLD_PIXELFX_R163__=Object.freeze({...X,play,__r1286:true});stats.wraps++;}
function foeOf(src){try{if(src&&typeof src==='object'){if(fin(src.hp)&&fin(src.x)&&fin(src.y))return src;const id=src.owner??src.ownerId??src.source;
  if(id!=null)for(const e of (typeof room==='object'&&room?.enemies)||[])if(e&&(e.id===id||e.nativeId===id))return e;}}catch(_){}return null;}
function dashing(e,t){if(!e)return false;if(e.r286&&e.r286.mode==='dash')return true;for(const c of cracks)if(t-c.t>=0&&t-c.t<=1.5&&Math.hypot(c.x-e.x,c.y-e.y)<.8)return true;return false;}
function shadow(src){const p=P(),X=window.__STORYWORLD_PIXELFX_R163__;if(!p||!X||typeof X.play!=='function')return;const t=T();if(t-lastShadow<.5&&t>=lastShadow)return;lastShadow=t;
 const foe=foeOf(src),d=dashing(foe,t),S=d?GRAY:BLACK,o=()=>({k:S.k,alpha:S.alpha,tint:{a:S.tint.a.slice(),b:S.tint.b.slice()},z:0});
 // 영웅 몸을 덮는 이펙트는 R350 이 85%까지 옅게 하므로(몸 가림 방지, 헤드리스 실측: 몸 위 .15 · 옆 반 칸 .15 · 옆 한 칸 .84)
 //  몸 바로 위가 아니라 발치 옆 한 칸에 솟게 한다(아이소: 화면 x ∝ x−y). 보통 적중 = 화면 왼쪽·오른쪽 두 곳, 돌진 적중 = 그 몹이 있는 쪽 한 곳.
 self=true;try{if(d){const side=foe&&((foe.x-foe.y)<(p.x-p.y))?-1:1;X.play(RUP,p.x+side*SIDE,p.y-side*SIDE,{...o(),flip:side<0});}
  else{X.play(RUP,p.x-SIDE,p.y+SIDE,{...o(),flip:true});X.play(RUP,p.x+SIDE,p.y-SIDE,o());}}finally{self=false;}
 if(d)stats.dashHits++;else stats.hitShadows++;}
function wrapEgo(){if(typeof ego!=='function'||ego.__r1286)return;const base=ego;
 const w=function(){const p=P(),e0=p?(p.ego||0):0;egoDepth++;try{return base.apply(this,arguments);}finally{egoDepth--;try{if(p&&(p.ego||0)>e0&&egoDepth===0)egoAt=T();}catch(_){}}};w.__r1286=true;ego=w;stats.wraps++;}
function wrapHurt(){if(typeof hurt!=='function'||hurt.__r1286)return;const base=hurt;
 const w=function(d,src){const p=P(),before=p?p.hp:NaN;hurtDepth++;let r;try{r=base.apply(this,arguments);}finally{hurtDepth--;}
  try{if(on&&hurtDepth===0&&p&&fin(before)&&fin(p.hp)&&p.hp<before)shadow(src);}catch(e){fail(e);}return r;};w.__r1286=true;hurt=w;stats.wraps++;}
// ---- ② 구름 오라 ----
const SHEET={on:{path:'assets/r1286/ego-cloud-on.webp',n:6,cw:384,ch:384},loop:{path:'assets/r1286/ego-cloud-loop.webp',n:10,cw:384,ch:384}};
const asked=new Map();
function image(path){try{const r=typeof readyImage==='function'?readyImage(path):null;if(r?.image)return r.image;const t=Date.now();if(t-(asked.get(path)||0)>1500){asked.set(path,t);if(typeof addImage==='function')addImage(path,'R1286 EGO cloud');}}catch(e){fail(e);}return null;}
const baked=new Map();
function tinted(phase,form){const key=phase+':'+form;let c=baked.get(key);if(c)return c;const S=SHEET[phase],im=image(S.path);if(!im)return null;
 try{const w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);
  const d=g.getImageData(0,0,w,h),px=d.data,{a:A,b:B}=tintFor(form),D=A.map(v=>v*.3),M=A.map((v,i)=>v+(B[i]-v)*.55);
  for(let i=0;i<px.length;i+=4){if(!px[i+3])continue;const l=px[i]/255;let r,gg,b;
   if(l<.45){const k=l/.45;r=D[0]+(A[0]-D[0])*k;gg=D[1]+(A[1]-D[1])*k;b=D[2]+(A[2]-D[2])*k;}
   else if(l<.85){const k=(l-.45)/.4;r=A[0]+(M[0]-A[0])*k;gg=A[1]+(M[1]-A[1])*k;b=A[2]+(M[2]-A[2])*k;}
   else{const k=(l-.85)/.15;r=M[0]+(B[0]-M[0])*k;gg=M[1]+(B[1]-M[1])*k;b=M[2]+(B[2]-M[2])*k;}
   px[i]=r;px[i+1]=gg;px[i+2]=b;}
  g.putImageData(d,0,0);c.__storyworldStaticTint=true;stats.tints++;}catch(e){fail(e);return null;}
 // 지금 형상 것만 남긴다(형상당 시트 두 장).
 for(const k of [...baked.keys()])if(!k.endsWith(':'+form))baked.delete(k);baked.set(key,c);return c;}
let born=null,egoAt=null;
function ageOf(t){const p=P();if(egoAt!=null&&p&&p.ego>0&&t>=egoAt)return t-egoAt;if(!born||t-born.last>.25||t<born.last-.01)born={at:t,last:t};born.last=t;return t-born.at;}
function remap(Q,u0,v0,u1,v1){const [a,b,,d]=Q,ex=[b[0]-a[0],b[1]-a[1]],ey=[d[0]-a[0],d[1]-a[1]],at=(u,v)=>[a[0]+ex[0]*u+ey[0]*v,a[1]+ex[1]*u+ey[1]*v];return [at(u0,v0),at(u1,v0),at(u1,v1),at(u0,v1)];}
function cloudRule(kind,owner,data){if(kind!=='image')return null;const id=String(owner?.id||'');if(id!=='r111:ego-back'&&id!=='r111:ego-front')return null;
 const path=String(data?.sourcePath||''),m=/sig-(aura|gather)-([a-z]+)\./.exec(path);if(!m)return null;
 const form=formOf();if(m[2]==='magenta'&&form==='michaela')return null;// 미카엘라 = R1041 원본
 const Q=data?.points;if(!Array.isArray(Q)||Q.length!==4)return null;
 const t=T(),a=ageOf(t),phase=a<.5?'on':'loop',S=SHEET[phase],cv=tinted(phase,form),other=tinted(phase==='on'?'loop':'on',form);
 if(!cv||!other){stats.cloudFallback++;return null;}
 if(id.endsWith('front')||m[1]==='gather')return 'drop';
 const fr=phase==='on'?Math.min(5,Math.floor(a*12)):((Math.floor((a-.5)*12)%10)+10)%10;
 // R1041 M3 와 같은 자리: R1039 오라 사각 가운데 = 발 위 키 .36, 한 변 = 키 2.6배 → 발 = v .63. 칸(피벗 .5,.9) 한 변 .96배.
 const np=remap(Q,.5-.48,.63-.9*.96,.5+.48,.63+.1*.96);if(!np.flat().every(fin))return null;
 return {...data,image:cv,mutable:false,sourcePath:'r1286:cloud:'+phase+':'+form+':'+fr,immutableTint:true,sourceRect:[fr*S.cw,0,S.cw,S.ch],imageSize:[S.cw*S.n,S.ch],points:np};}
function wrapPush(){const DC=window.StoryPhase1?.DrawCommands,PR=DC?.prototype;if(!PR||typeof PR.push!=='function'||PR.push.__r1286)return;const base=PR.push;
 const w=function(kind,data){if(!on)return base.call(this,kind,data);let r=null;try{r=cloudRule(kind,this.owner||{},data);}catch(e){fail(e);r=null;}
  if(!r)return base.call(this,kind,data);if(r==='drop'){stats.layersCut++;return;}stats.clouds++;return base.call(this,kind,r);};
 w.__r1286=true;PR.push=w;stats.wraps++;}
function arm(){try{wrapPixelfx();}catch(e){fail(e);}try{wrapEgo();}catch(e){fail(e);}try{wrapHurt();}catch(e){fail(e);}try{wrapPush();}catch(e){fail(e);}}
arm();try{setInterval(arm,1000);}catch(_){}
function set(v){on=v!==false&&v!=='off';try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}return on;}
window.__STORYWORLD_EGO_CLOUD_R1286__=Object.freeze({revision:REV,arm,set,formOf,tintFor,isDashCrack,BLACK,GRAY,SHEET,
 inspect:()=>({revision:REV,on,stats:{...stats},cracks:cracks.length,baked:[...baked.keys()],lastError})});
})();
