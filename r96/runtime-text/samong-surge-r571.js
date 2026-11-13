// R571 — 사몽(死夢覺醒) 발현 중 강화와 영웅 주색 불꽃 오라(사용자 2026-11-10 "사몽스킬 발현시 플레이어 모든스킬쿨다운77프로감소
//  (사몽시간동안만)+발동확률77프로 증가한다음 스킬 사거리 및 범위 77프로 증가(사몽시간동안만)+플레이어색에 맞는 고유 … 불꽃오라가 감싸도록").
//
//  모든 영웅 공통, player.samong > 0 인 동안만:
//   ① 재사용 대기 −77%: 사몽 중에 새로 걸린 스킬 대기(Q specialCD·S blinkCD·F egoCD·guardCD, W/E/R storyWER.ready 마감)를 ×0.23.
//      영웅 스킬 파일을 고치지 않고, 매 tick 앞뒤와 special/blink/ego 뒤에 "새로 늘어난 몫"만 줄인다(늘어난 몫 = 지금 값 − 지난번 값에서 흐른 시간만큼 뺀 값).
//      기본 공격 간격(attackCD)·사몽 자체 대기(samongCD)·skills-r209 의 '막힘'(아주 먼 마감, 600초 넘음)은 건드리지 않는다.
//      사몽 중에 건 대기는 사몽이 끝나도 줄어든 채 남고, 사몽이 끝난 뒤 새로 거는 대기는 원래 값 그대로다.
//   ② 확률 발동 ×1.77(곱, 상한 100%): growth-r103 procChance 가 이 모듈의 chance() 를 부른다(사몽 밖에서는 원래 값 그대로).
//   ③ 사거리·범위 +77%: 스킬 코드가 도는 동안(special 안, W/E/R 지연 효과 'story-wer:*', 스킬 맥락 e568 'skill' 지연)만
//      Math.hypot 거리를 1/1.77 로 읽게 한다 → 반경·사거리 비교가 모두 1.77배. hitEnemy·moveActor·clearLine·blocked·findPath·killEnemy
//      안에서는 멈춘다(피해·이동 걸음·벽 판정은 실제 거리). 같은 맥락의 아군 투사체는 수명(=사거리)·판정 반지름 ×1.77, 이펙트 크기도 ×1.77.
//      3인수 Math.hypot·맥락 밖 호출은 원래 함수 결과를 그대로 돌려준다.
//   ④ 오라: 영웅 몸을 주색(바깥)·보조색(안쪽) 불꽃이 감싼다(R302 팔레트, 환도 = 실버 바깥 + 골드 안쪽). 코드로만 그림(새 자산 없음),
//      ctx.filter 안 씀(Three.js 기록기 안전), lowFx 면 혀·불티 수를 줄인다. 시작 .4초 서서히, 끝나기 .6초 전부터 서서히 사라진다.
//  다른 스레드(영웅별 스킬 개편)가 쓰는 공용 API: __STORYWORLD_SAMONG_SURGE_R571__.active() · cd(s) · range(r) · chance(p) · scope(fn).
//  R969(사용자 2026-11-13 "ego 각성는 모든 스킬쿨타임 줄여주고 사몽각성은 그거보다 더줄여주게") — 같은 ① 장치에 EGO 를 더한다:
//   · EGO(player.ego > 0, 사몽 아님) 중 새로 거는 스킬 대기 ×0.77(−23%). EGO 자기 대기(egoCD)는 줄이지 않는다(사몽의 samongCD 처럼).
//   · 각성에 들어가는 순간 이미 돌고 있던 대기도 줄인다: EGO 진입 ×0.77, 사몽 진입 ×0.60. EGO 중에 사몽으로 올라가면 나머지만 더 줄여
//     합계가 ×0.60 이 되게 한다(겹곱 없음). EGO 중첩(R169)처럼 이미 켜진 각성을 다시 채우는 것은 진입이 아니다.
//   · 사몽 중 새로 거는 대기 ×0.23 은 R571 그대로 → 사몽이 EGO 보다 항상 더 줄인다. cd() API 는 예전처럼 사몽 전용(다른 모듈이 마감을 직접 넣음).
//   · {ego:false} 로 EGO 몫만 끈다.
//  저장 파일에는 아무것도 쓰지 않는다. localStorage 'storyworld.r571.surge' {on:false} 로 전부, {aura:false} 로 오라만 끈다.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SAMONG_SURGE_R571__)return;
const REV='R571-samong-surge-2+R969',KEY='storyworld.r571.surge';
const RULES=Object.freeze({cooldown:.23,chance:1.77,range:1.77,egoCooldown:.77,egoEntry:.77,samongEntry:.6});
const K=RULES.cooldown,R=RULES.range,INV=1/RULES.range,FAR=600;
let prefs={on:true,aura:true,ego:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={entryCut:0,scaledCD:0,scaledDeadline:0,shots:0,fx:0,auraDraws:0,scopes:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const P=()=>typeof player==='object'&&player?player:null;
const now=()=>typeof time==='number'&&Number.isFinite(time)?time:0;
function active(p=P()){return !!(prefs.on&&p&&Number(p.samong)>0&&!(Number(p.hp)<=0));}
function egoActive(p=P()){return !!(prefs.on&&prefs.ego!==false&&p&&Number(p.ego)>0&&!(Number(p.samong)>0)&&!(Number(p.hp)<=0));}
// 각성 단계: 0 없음 · 1 EGO · 2 사몽. 단계마다 새 대기 배율과 진입 배율(누적값).
function mode(p=P()){return active(p)?2:egoActive(p)?1:0;}
const NEW_K=[1,RULES.egoCooldown,RULES.cooldown],ENTRY_K=[1,RULES.egoEntry,RULES.samongEntry];
const OWN={1:'egoCD'};// EGO 는 자기 대기를 줄이지 않는다(사몽 자기 대기 samongCD 는 처음부터 표에 없음).

// ---- ① 재사용 대기 ----------------------------------------------------------------------------------
const CD_FIELDS=['specialCD','blinkCD','egoCD','guardCD'];
const snaps=new WeakMap();
function sync(){const p=P();if(!p)return;const t=now();let s=snaps.get(p);const m=mode(p);
 if(!s){s={t,m,rem:Object.create(null),dl:Object.create(null)};snaps.set(p,s);}
 const el=Math.max(0,t-s.t),k=NEW_K[m],up=m>s.m?ENTRY_K[m]/ENTRY_K[s.m]:1;
 for(const f of CD_FIELDS){let v=Number(p[f]);if(!Number.isFinite(v))continue;const own=OWN[m]===f;let exp=Math.max(0,(s.rem[f]??v)-el);
  // 진입: 돌던 몫(exp)만 줄이고, 같은 순간 새로 걸린 몫은 아래 새 대기 배율로.
  if(up<1&&!own&&exp>1e-6&&exp<FAR&&v>=exp-1e-6){const cut=exp*(1-up);exp-=cut;v-=cut;stats.entryCut++;}
  if(k<1&&!own&&v>exp+1e-6&&v-exp<FAR){v=exp+(v-exp)*k;stats.scaledCD++;}
  if(v!==Number(p[f]))p[f]=v;s.rem[f]=v;}
 const ready=p.storyWER?.ready;
 // 표에서 사라진 칸(대기 표를 비움·새 표로 바꿈)은 지난 마감도 잊는다 — 다시 걸 때 옛 마감을 기준으로 삼지 않게.
 for(const key of Object.keys(s.dl))if(!ready||typeof ready!=='object'||!(key in ready))delete s.dl[key];
 if(ready&&typeof ready==='object')for(const key of Object.keys(ready)){let v=Number(ready[key]);if(!Number.isFinite(v))continue;let prev=s.dl[key];
  if(up<1&&Number.isFinite(prev)&&prev>t+1e-6&&prev-t<FAR&&v>=prev-1e-6){const cut=(prev-t)*(1-up);prev-=cut;v-=cut;ready[key]=v;stats.entryCut++;}
  if(k<1&&v!==prev&&v>t&&v-t<FAR){const base=Math.max(t,Number.isFinite(prev)?prev:t);if(v>base+1e-6){v=base+(v-base)*k;ready[key]=v;stats.scaledDeadline++;}}
  s.dl[key]=v;}
 s.t=t;s.m=m;}

// ---- ③ 사거리·범위 맥락 ------------------------------------------------------------------------------
let depth=0,susp=0,scaleOn=false;
const ctxSkill=()=>{try{return typeof e568HeroActionContext!=='undefined'&&e568HeroActionContext?.kind==='skill';}catch(_){return false;}};
const inScope=()=>depth>0&&susp===0&&scaleOn;
function scope(fn,self,args){if(depth===0)scaleOn=active();depth++;stats.scopes++;try{return fn.apply(self,args||[]);}finally{depth--;if(depth===0)scaleOn=false;}}
const H=Math.hypot;
try{Object.defineProperty(Math,'hypot',{configurable:true,writable:true,enumerable:false,value:function hypot(a,b){const v=arguments.length===2?H(a,b):H.apply(Math,arguments);return depth>0&&susp===0&&scaleOn?v*INV:v;}});}catch(e){fail(e);}
function wrapGlobal(name,make){try{const b=globalThis[name];if(typeof b!=='function')return false;globalThis[name]=make(b);return true;}catch(e){fail(e);return false;}}
for(const name of ['hitEnemy','moveActor','clearLine','blocked','findPath','killEnemy'])
 wrapGlobal(name,b=>function(...a){susp++;try{return b.apply(this,a);}finally{susp--;}});
// 시전 앞에서도 한 번 맞춰 둔다(다른 효과가 대기를 0 으로 되돌린 직후 시전해도 새로 건 몫만 줄도록).
wrapGlobal('special',b=>function(...a){try{sync();}catch(e){fail(e);}try{return scope(b,this,a);}finally{try{sync();}catch(e){fail(e);}}});
for(const name of ['blink','ego'])wrapGlobal(name,b=>function(...a){try{sync();}catch(e){fail(e);}try{return b.apply(this,a);}finally{try{sync();}catch(e){fail(e);}}});
wrapGlobal('delay',b=>function(seconds,fn,owner=null,...rest){
 const skill=typeof fn==='function'&&(depth>0||ctxSkill()||String(owner??'').startsWith('story-wer:'));
 if(!skill)return b.call(this,seconds,fn,owner,...rest);
 return b.call(this,seconds,function(...x){return scope(fn,this,x);},owner,...rest);});
wrapGlobal('makeShot',b=>function(x,y,angle,speed,damage,opt={},...rest){
 if(inScope()&&opt&&opt.friendly){const o={...opt};if(Number.isFinite(o.life))o.life*=R;o.radius=(Number.isFinite(o.radius)?o.radius:.14)*R;opt=o;stats.shots++;}
 return b.call(this,x,y,angle,speed,damage,opt,...rest);});
wrapGlobal('fx',b=>function(type,x,y,opt,...rest){
 if(inScope()&&opt&&typeof opt==='object'&&Number.isFinite(opt.size)){opt={...opt,size:opt.size*R};stats.fx++;}
 return b.call(this,type,x,y,opt,...rest);});
wrapGlobal('tick',b=>function(...a){try{sync();}catch(e){fail(e);}const r=b.apply(this,a);try{sync();}catch(e){fail(e);}return r;});

// ---- ④ 불꽃 오라 --------------------------------------------------------------------------------------
const GOLD=[255,198,72],SILVER=[226,232,242];
const FALLBACK={hwando:{main:[214,222,234],sub:GOLD},seoha:{main:[120,206,255],sub:SILVER},neon:{main:[62,230,193],sub:SILVER},michaela:{main:[178,26,62],sub:SILVER},
 lauren:{main:[164,98,255],sub:SILVER},hunter:{main:[255,96,40],sub:SILVER},slayer:{main:[222,22,52],sub:SILVER},gunner:{main:[70,124,255],sub:SILVER}};
function palette(hero){const P302=window.__STORYWORLD_HERO_PALETTE_R302__?.palette,c=P302?.[hero]||FALLBACK[hero]||FALLBACK.hwando;return{main:c.main,sub:c.sub};}
const rgba=(c,a)=>'rgba('+c[0]+','+c[1]+','+c[2]+','+Math.max(0,Math.min(1,a)).toFixed(3)+')';
const rnd=(s,i)=>{const v=Math.sin(s*127.1+i*311.7)*43758.5453;return v-Math.floor(v);};
const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
const starts=new WeakMap();
function fade(p){const t=now();let s=starts.get(p);if(!s||t<s.t-1e-6||s.off){s={t,off:false};starts.set(p,s);}return Math.min(1,(t-s.t)/.4+.15)*Math.min(1,Number(p.samong)/.6);}
// 불꽃 혀 하나: 발밑 타원 둘레의 한 점에서 솟는 물방울꼴(옆선은 곡선, 끝은 뾰족, 위로 흐르며 흔들림).
//  광원 왼쪽 위 → 혀의 왼쪽 옆선에 보조색 밝은 선을 얹는다.
function tongue(bx,by,bw,th,sway,col,alpha,edge){ctx.fillStyle=rgba(col,alpha);ctx.beginPath();ctx.moveTo(bx-bw,by);
 ctx.bezierCurveTo(bx-bw*1.05,by-th*.42,bx+sway*.4-bw*.55,by-th*.7,bx+sway,by-th);
 ctx.bezierCurveTo(bx+sway*.4+bw*.5,by-th*.66,bx+bw*1.05,by-th*.38,bx+bw,by);
 ctx.quadraticCurveTo(bx,by+bw*.45,bx-bw,by);ctx.closePath();ctx.fill();
 if(edge){ctx.strokeStyle=rgba(edge,Math.min(1,alpha*1.25));ctx.lineWidth=Math.max(1,1.2*(typeof zoom==='number'?zoom:1));ctx.beginPath();ctx.moveTo(bx-bw*.9,by-th*.12);ctx.bezierCurveTo(bx-bw*.98,by-th*.45,bx+sway*.4-bw*.5,by-th*.7,bx+sway,by-th);ctx.stroke();}}
// 고리 둘레 혀 n개. part='back' 은 뒤쪽 반(키 큼), 'front' 는 앞쪽 반(키 낮고 옅음). 혀마다 박자가 다르다.
function crown(x,fy,h,F,a,n,part,seed){const t=now(),rx=h*.36,ry=rx*.38;
 const rows=[];for(let i=0;i<n;i++){const ang=Math.PI*2*(i+.5)/n+seed,s=Math.sin(ang);if((part==='back')!==(s<=0.05))continue;rows.push({i,ang,s});}
 rows.sort((u,v)=>u.s-v.s);
 for(const {i,ang,s} of rows){const bx=x+Math.cos(ang)*rx,by=fy+s*ry,ph=t*(6.5+2.5*rnd(seed,i))+i*1.9,
  fl=.72+.28*Math.sin(ph)*Math.sin(ph*.57+1.3),side=1-.35*Math.abs(Math.cos(ang)),
  th=h*(part==='back'?1.85:.8)*side*fl*(.85+.3*rnd(seed,i+9)),bw=h*(.15+.04*rnd(seed,i+17)),sway=Math.sin(t*3.1+i*1.7)*h*.08-Math.cos(ang)*h*.06,
  al=(part==='back'?1:.36)*a;
  // 겉불(주색)은 덮어 칠해 하얗게 타 버리지 않게, 속불(보조색)만 더해 빛나게.
  ctx.globalCompositeOperation='lighter';if(part==='back')tongue(bx,by,bw*1.5,th*1.12,sway*1.2,F.main,.12*al,null);
  ctx.globalCompositeOperation='source-over';tongue(bx,by,bw,th,sway,F.main,.46*al,F.sub);
  ctx.globalCompositeOperation='lighter';tongue(bx,by,bw*.5,th*.66,sway*.8,F.sub,.32*al,null);}}
function aura(p,layer){const q=project(p.x,p.y),Z=typeof zoom==='number'?zoom:1,h=typeof actorHeight==='function'?actorHeight():66*Z,
 lift=Math.max(0,Math.min(h*.65,Number(p.visualLiftPx)||0)),fy=q.y-lift,F=palette(String(p.hero||'hwando')),seed=rnd(String(p.hero).length,3)*6,
 a=fade(p),low=lowFx(),t=now(),n=low?8:14;
 const draw=()=>{ctx.save();try{ctx.globalCompositeOperation='lighter';
  if(layer==='back'){
   // 몸 둘레 은은한 빛(타원 두 겹)
   ctx.save();ctx.translate(q.x,fy-h*.5);ctx.scale(1,1.45);ctx.fillStyle=rgba(F.main,.09*a);ctx.beginPath();ctx.arc(0,0,h*.6,0,Math.PI*2);ctx.fill();
   ctx.fillStyle=rgba(F.main,.11*a);ctx.beginPath();ctx.arc(0,0,h*.4,0,Math.PI*2);ctx.fill();ctx.restore();
   // 발밑 열기 고리
   ctx.save();ctx.translate(q.x,q.y);ctx.scale(1,.36);const pr=1+.06*Math.sin(t*7);
   ctx.fillStyle=rgba(F.main,.18*a);ctx.beginPath();ctx.arc(0,0,h*.6*pr,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle=rgba(F.sub,.6*a);ctx.lineWidth=Math.max(1,2.2*Z);ctx.beginPath();ctx.arc(0,0,h*.46*pr,0,Math.PI*2);ctx.stroke();ctx.restore();
   // 뒤쪽 불꽃 혀(키 큼)
   crown(q.x,fy,h,F,a,n,'back',seed);
  }else{
   // 앞쪽 불꽃 혀(낮고 옅게, 몸이 보이게)
   crown(q.x,fy,h,F,a,n,'front',seed);
   // 위로 솟는 불티
   const m=low?5:12;for(let i=0;i<m;i++){const ph=(t*(.55+.35*rnd(seed,i))+rnd(seed,i+40))%1,
    ex=q.x+(rnd(seed,i+80)-.5)*h*.9+Math.sin(t*4+i)*h*.06,ey=fy-h*(.1+1.45*ph),sz=(1.6+2.4*rnd(seed,i+120))*Z*(1-ph*.5);
    ctx.fillStyle=rgba(i%2?F.main:F.sub,.85*(1-ph)*a);ctx.beginPath();ctx.moveTo(ex,ey-sz*1.8);ctx.lineTo(ex+sz*.7,ey);ctx.lineTo(ex,ey+sz*.9);ctx.lineTo(ex-sz*.7,ey);ctx.closePath();ctx.fill();}
  }
 }finally{ctx.restore();}};
 if(typeof ctx.scope==='function')ctx.scope({id:'r571:aura-'+layer+':'+String(p.coopIdR62||'hero'),kind:'effect',x:p.x,y:p.y,groundAligned:false,r571:true},draw);else draw();
 stats.auraDraws++;}
wrapGlobal('drawHero',b=>function(...a){const p=P(),on=!!(prefs.aura&&active(p)&&typeof ctx!=='undefined'&&ctx&&typeof project==='function');
 if(!on&&p)starts.delete(p);
 if(on)try{aura(p,'back');}catch(e){fail(e);}const r=b.apply(this,a);if(on)try{aura(p,'front');}catch(e){fail(e);}return r;});

// ---- 공용 API -----------------------------------------------------------------------------------------
window.__STORYWORLD_SAMONG_SURGE_R571__=Object.freeze({revision:REV,rules:RULES,
 active:()=>active(),
 egoActive:()=>egoActive(),
 cdFactor:()=>NEW_K[mode()],
 cd:s=>active()?Number(s)*K:Number(s),
 range:r=>active()?Number(r)*R:Number(r),
 chance:c=>{const v=Number(c);if(!(v>0))return v>0?v:0;return active()?Math.min(1,v*RULES.chance):v;},
 scope:(fn,...a)=>scope(fn,null,a),
 palette,sync,drawAura:layer=>{const p=P();if(p&&active(p))aura(p,layer==='front'?'front':'back');},
 set(next){prefs={...prefs,...next};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};},
 inspect:()=>({revision:REV,prefs:{...prefs},active:active(),egoActive:egoActive(),stats:{...stats},lastError,depth,susp})});
})();
