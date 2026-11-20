// R1274 — 붉은 하이힐의 서윤(b05-boss) '붉은 조명' 스포트라이트 스킬.
//  사용자 2026-11-20 08:08Z "서윤 스킬 스포트라이트 쓰도록 자신에게 기본적으로 비추고 자신에게 비출때는 이로운버프 영웅에게 비출때는 디버프 밸런스맞게"
//  정본 r448 [17 · ep1b05] "붉은 조명이 켜지며 끝없는 무대가 드러났다" — 무대 조명이 주연(서윤)을 비추거나, 무대에 끌려 나온 영웅을 비춘다.
//  · 순서: 자신 → 자신 → 영웅 (기본은 자신, 셋에 하나만 영웅). 교전(13칸) 뒤 7초에 첫 시전, 그 뒤 끝난 때부터 16초마다.
//  · 자신에게(주연의 조명): 조명이 다 내려오면 5초 동안 받는 피해 ×0.75(모든 피해 경로 — 줄어든 체력의 25%를 그 틱에 되돌림, 치명타는 안 되돌림),
//     서윤이 주는 피해 ×1.15(근접·투사체·R1263 매혹의 빛 등 서윤 몫 피해 전부).
//  · 영웅에게(무대 위의 노출): 조명이 0.3초 동안 영웅을 따라오다 멈추고 0.75초에 다 내려온다(멈춘 뒤 0.45초 피할 틈, 바닥 예고 장판 없음 — 내려오는 빛 자체가 신호).
//     그때 1.1칸 안이면 4초 동안 받는 피해 ×1.2, 처음 1.2초는 엔진 둔화(heroSlowUntil150, 이동 ×0.62). 무적(회피·피격 보호) 중이면 안 걸림.
//  · 그림: 프레임 시트만(코드 도형 없음). assets/r1274/spot-self24·spot-hero24 = Dots 빛기둥(r563 michaela-grand-pillar) 재채색 임시본(final:false),
//     버프 기운 r100 sig-aura-red, 디버프 기운 r843 aura-loop8 그대로 재사용.
//  · 같은 라운드: 서윤 공격(꽃잎 뿌리기) 그림 좌우반전 — 사용자 08:14Z "서윤공격시 뿌리는 모션 지금과 반대로 나와야해 뿌리는쪽에 영웅이 있어야지" / "좌우반전하면됨".
//     0단계 공격 그림(lust-human-attack)은 꽃잎을 몸 왼쪽으로 뿌리는데 대기 그림(정면·오른쪽)과 같은 좌우 규칙으로 뒤집혀 영웅 반대쪽으로 뿌렸다.
//     → 이미지 주소만 좌우반전 사본(assets/r1274/lust-human-attack-mirror.webp, R700 정리본을 뒤집은 것)으로 돌린다. 경로 키·크기 잠금·방향 판정은 그대로.
//  끄기: localStorage['storyworld.r1274.spotlight']='{"on":false}'(스킬) / '{"mirror":false}'(공격 그림). 점검: window.__STORYWORLD_SEOYUN_SPOTLIGHT_R1274__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_SEOYUN_SPOTLIGHT_R1274__)return;
const REV='R1274-seoyun-spotlight-1',KEY='storyworld.r1274.spotlight';
let prefs={on:true,mirror:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={casts:0,self:0,hero:0,dodged:0,refunded:0,amplified:0,errors:0,drawn:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const G=n=>{try{return Function('return typeof '+n+"!=='undefined'?"+n+':undefined')();}catch(_){return undefined;}};
const T=()=>{const t=G('time');return typeof t==='number'?t:0;};
const TUNE=Object.freeze({first:7,cd:16,engage:13,pattern:Object.freeze(['self','self','hero']),lock:.3,land:.75,r:1.1,
 buff:Object.freeze({dur:5,taken:.75,dealt:1.15}),debuff:Object.freeze({dur:4,taken:1.2,slow:1.2})});
const SH=Object.freeze({self:'assets/r1274/spot-self24.webp',hero:'assets/r1274/spot-hero24.webp',auraSelf:'assets/r100/sig-aura-red.webp',auraHero:'assets/r843/aura-loop8.webp'});
const N={self:24,hero:24,auraSelf:12,auraHero:8},COLS={self:6,hero:6,auraSelf:12,auraHero:8};
function which(e){if(!e||e.r61Clone)return null;return String(e.nativeId||'')==='b05-boss'?'seoyun':null;}
const P=()=>G('player');
function paused(){return !G('started')||G('loading')||G('modal')||G('storyScene')||!P()||!(P().hp>0)||!G('room');}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
let cast=null,buff=null,debuff=null,seenAt=null,next=0,lastT=-1,turn=0,lastTarget=null,warmed=-9;
function boss(){for(const e of G('room')?.enemies||[]){if(which(e)&&e.hp>0&&e.spawnState==='active'&&!e.disabled)return e;}return null;}
function float(t,x,y,c){try{const f=G('floatText');if(typeof f==='function')f(t,x,y,c);}catch(_){}}
function clearAll(){cast=null;buff=null;debuff=null;}
function hold(e,now){e.moving=false;e.nav=[];e.r230At=now;if(cast){e.x=cast.bx;e.y=cast.by;}}
function start(e,target,now){const p=P();stats.casts++;stats[target]++;lastTarget=target;
 cast={target,t0:now,room:G('room'),boss:e,bx:e.x,by:e.y,sx:target==='hero'?p.x:e.x,sy:target==='hero'?p.y:e.y,landed:false,hit:false,end:null};}
function r1263Busy(){try{return !!window.__STORYWORLD_SIN_SKILLS_R1263__?.inspect?.().casting;}catch(_){return false;}}
function step(){if(!prefs.on){if(cast||buff||debuff)clearAll();return;}if(paused())return;const now=T();
 if(now<lastT){/* 시간 되감기: 옛 시전·버프·예약을 버린다 */const left=Math.max(0,next-lastT);clearAll();next=now+Math.min(TUNE.cd,left);seenAt=null;lastT=now;return;}
 if(!(now>lastT)){lastT=now;return;}lastT=now;
 const room=G('room'),p=P();
 if(buff&&(buff.room!==room||!(buff.boss.hp>0)||now>=buff.until))buff=null;
 if(debuff&&(debuff.room!==room||now>=debuff.until))debuff=null;
 if(cast&&(cast.room!==room||!(cast.boss.hp>0)||cast.boss.spawnState!=='active')){cast=null;next=now+TUNE.cd;}
 const e=cast?cast.boss:boss();
 /* 주연의 조명: 이 틱 사이 줄어든 체력의 (1-taken) 몫을 되돌린다(모든 피해 경로). 죽었으면 되돌리지 않는다. */
 if(e){if(buff&&buff.boss===e&&Number.isFinite(e._r1274hp)&&e.hp<e._r1274hp&&e.hp>0){const back=(e._r1274hp-e.hp)*(1-TUNE.buff.taken);e.hp+=back;stats.refunded+=back;}e._r1274hp=e.hp;}
 if(!e){seenAt=null;return;}
 if(!cast){if(dist(p,e)>TUNE.engage)return;if(seenAt===null||seenAt>now){seenAt=now;next=Math.max(next,now+TUNE.first);}
  if(now>=next&&!e.attack&&!r1263Busy()){start(e,TUNE.pattern[turn%TUNE.pattern.length],now);turn++;}else return;}
 const c=cast,age=now-c.t0;
 if(!c.landed){hold(e,now);
  if(c.target==='hero'&&age<TUNE.lock){c.sx=p.x;c.sy=p.y;}
  if(c.target==='self'){c.sx=e.x;c.sy=e.y;}
  if(age>=TUNE.land){c.landed=true;c.landAt=now;
   if(c.target==='self'){buff={boss:e,room,t0:now,until:now+TUNE.buff.dur};float('주연의 조명',e.x,e.y,'#ff9aa8');c.end=now+.3;}
   else{const inLight=dist(p,{x:c.sx,y:c.sy})<=TUNE.r&&!(P().invincible>0);
    if(inLight){c.hit=true;debuff={room,t0:now,until:now+TUNE.debuff.dur};p.heroSlowUntil150=Math.max(Number(p.heroSlowUntil150)||0,now+TUNE.debuff.slow);float('무대 위의 노출',p.x,p.y,'#d8b8ff');c.end=now+1.8;}
    else{stats.dodged++;c.end=now+.8;}}}}
 if(c.landed&&now>=c.end){cast=null;next=now+TUNE.cd;}}
// ---- 피해 배수(hurt 감싸기) ----
function fromBoss(src,e){if(!src||!e)return false;return src===e||src.owner===e.id||src.ownerId===e.id||src.owner===e||src.boss===e;}
function mult(src){if(!prefs.on)return 1;let m=1;const now=T();if(debuff&&now<debuff.until&&debuff.room===G('room'))m*=TUNE.debuff.taken;if(buff&&now<buff.until&&buff.boss.hp>0&&fromBoss(src,buff.boss))m*=TUNE.buff.dealt;return m;}
const HU=G('hurt');if(typeof HU==='function'){const base=HU;try{Function('f','hurt=f')(function(damage,source,...a){let d=damage;try{const m=mult(source);if(m!==1&&Number.isFinite(d)&&d>0){d=d*m;stats.amplified++;}}catch(err){fail(err);}return base.call(this,d,source,...a);});}catch(err){fail(err);}}
// ---- 서윤 공격 그림 좌우반전(이미지 주소만) ----
const ATK='assets/generated-v31224/actors-normalized/53c9ce212489_lust-human-attack.webp',MIR='assets/r1274/lust-human-attack-mirror.webp';
const PRE=/^(?:\.\/)?(?:assets\/r425\/clean\/|assets\/r99\/clean\/|assets\/r700\/clean\/)*/;
const UF=G('urlFor');if(typeof UF==='function'){const base=UF;try{Function('f','urlFor=f')(function(p,...a){try{if(prefs.mirror&&typeof p==='string'&&String(p).split('#')[0].replace(PRE,'')===ATK){stats.mirrored=(stats.mirrored||0)+1;return base.call(this,MIR,...a);}}catch(err){fail(err);}return base.call(this,p,...a);});}catch(err){fail(err);}}
// ---- 그리기(시트만) ----
function want(path){try{if(G('loading')||!G('started'))return;const ad=G('addImage');if(typeof ad==='function')ad(path);}catch(_){}}
function img(path){try{const r=G('readyImage')?.(path),im=r?.image;if(!r)want(path);return im&&(im.naturalWidth||im.width)>0?im:null;}catch(_){return null;}}
function strip(key,f,x,y,w,h,alpha){const im=img(SH[key]);if(!im||!(alpha>0))return;const c=G('ctx'),n=N[key],cols=COLS[key],rows=Math.ceil(n/cols),cw=(im.naturalWidth||im.width)/cols,ch=(im.naturalHeight||im.height)/rows,i=Math.max(0,Math.min(n-1,f|0));
 c.save();c.globalAlpha=Math.min(1,alpha);c.drawImage(im,(i%cols)*cw,Math.floor(i/cols)*ch,cw,ch,x,y,w,h);c.restore();stats.drawn++;}
const AH=()=>{try{return G('actorHeight')?.()||60;}catch(_){return 60;}};
const unit=()=>(Number(G('TILE'))||32)*(Number(G('zoom'))||1);
function sc(c,id,x,y,fn){if(typeof c.scope==='function')c.scope({id:'r1274:'+id,kind:'effect',enemy:true,ownerType:'enemy',x,y,groundAligned:false,lightShadowApproved:true},fn);else fn();}
/* 바닥 피벗(빛 고리 중심)으로 세워 그린다 */
function at(key,f,x,y,w,h,piv,alpha){const c=G('ctx'),pr=G('project');if(!Number.isFinite(x)||!Number.isFinite(y))return;sc(c,key,x,y,()=>{const q=pr(x,y);if(!Number.isFinite(q?.x)||!Number.isFinite(q?.y))return;strip(key,f,q.x-w/2,q.y-h*piv,w,h,alpha);});}
const PIV=226/256;
/* 조명 한 줄기: 0~5 내려옴, 6~11 머묾(반복), 12~23 사라짐 */
function cone(key,x,y,phase,u,U,alpha){const ah=AH(),w=Math.max(U*2.8,ah*(key==='self'?2.4:1.5));const f=phase==='down'?u*5.99:phase==='hold'?6+Math.floor(u*10)%6:12+u*11.99;at(key,f,x,y,w,w,PIV,alpha);}
function draw(){const c=G('ctx'),pr=G('project');if(!c||typeof pr!=='function')return;const now=T(),U=unit(),p=P();
 if(buff&&now<buff.until){const e=buff.boss,left=buff.until-now,a=now-buff.t0;
  at('auraSelf',Math.floor(a*12)%12,e.x,e.y,Math.max(U*1.9,AH()*1.3),Math.max(U*1.9,AH()*1.3),.72,.85);
  if(!(cast&&cast.target==='self'&&!cast.landed)){if(left>.9)cone('self',e.x,e.y,'hold',a,U,.55);else cone('self',e.x,e.y,'fade',1-left/.9,U,.55);}}
 if(debuff&&now<debuff.until&&p){const a=now-debuff.t0,left=debuff.until-now;at('auraHero',Math.floor(a*10)%8,p.x,p.y,Math.max(U*1.7,AH()*.95),Math.max(U*1.7,AH()*.95),.8,Math.min(.85,left*2));}
 if(cast){const k=cast.target,age=now-cast.t0;
  if(!cast.landed)cone(k,cast.sx,cast.sy,'down',Math.min(1,age/TUNE.land),U,k==='self'?.75:.85);
  else if(k==='hero'){const la=now-cast.landAt;if(cast.hit){if(la<1)cone('hero',p.x,p.y,'hold',la,U,.7);else cone('hero',p.x,p.y,'fade',Math.min(1,(la-1)/.8),U,.7);}else cone('hero',cast.sx,cast.sy,'fade',Math.min(1,la/.8),U,.7);}}}
const SENT={type:'r1274-fx',x:0,y:0,age:0,life:Infinity};
function arm(){try{const fx=G('effects');if(Array.isArray(fx)&&!fx.includes(SENT)){SENT.age=0;fx.push(SENT);}}catch(_){}}
function warm(){const now=T();if(now-warmed<3&&now>=warmed)return;warmed=now;for(const q of Object.values(SH))if(!G('readyImage')?.(q))want(q);}
const DE=G('drawEffect');if(typeof DE==='function'){const base=DE;try{Function('f','drawEffect=f')(function(fx,...a){if(fx&&fx.type==='r1274-fx'){try{if(prefs.on)draw();}catch(err){fail(err);}return;}return base.apply(this,[fx,...a]);});}catch(err){fail(err);}}
const TK=G('tick');if(typeof TK==='function'){const base=TK;try{Function('f','tick=f')(function(...a){const r=base.apply(this,a);try{step();if(prefs.on&&boss())warm();if(cast||buff||debuff)arm();}catch(err){fail(err);}return r;});}catch(err){fail(err);}}
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on)clearAll();return {...prefs};}
window.__STORYWORLD_SEOYUN_SPOTLIGHT_R1274__=Object.freeze({revision:REV,set,which,tune:TUNE,sheets:SH,
 cast:(target)=>{const e=boss();if(!e||!P())return false;cast=null;start(e,target==='hero'?'hero':'self',T());return true;},
 inspect:()=>{const now=T();return {revision:REV,prefs:{...prefs},...stats,casting:!!cast,target:lastTarget,
  buff:buff&&now<buff.until?+(buff.until-now).toFixed(3):0,debuff:debuff&&now<debuff.until?+(debuff.until-now).toFixed(3):0,next,lastError};}});
})();
