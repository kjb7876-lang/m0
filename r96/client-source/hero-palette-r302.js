// R302 영웅 2색 팔레트 — 사용자 2026-11-04:
//  "네온 창끝끼리 나오는 이펙트 별론데, 그리고 스킬 이펙트 민트색으로 통일해줘"
//  "모든 플레이어 스킬 및 공격은 플레이어 고유색 + 보조색으로만 이펙트가 이루어져야 함"
//  "황금실은 황금 + 영웅 고유색, 은색실은 은색 + 영웅 고유색"(사용자 커스터마이징 저장값이 있어도 이 2색 안에서만)
// 표(PALETTE): 영웅마다 고유색(main)·보조색(sub). 근거 = R102 hero-fx 의 영웅 결 색(a·b, 이름 붙은 표: 실버/골드·아이스 블루·민트·핏빛 장미(R188 사용자)·
//  바이올렛·주홍·크림슨·코발트, 보조는 실버, 환도만 골드). 네온 고유색은 사용자 예시 민트 #3EE6C1.
// 적용(그림만 — 판정·피해·쿨다운·범위·타이밍은 그대로, 적·몹·보스 이펙트는 건드리지 않는다):
//  ① R292 영웅 띠: assets/r292/fx/<영웅>/<동작>.webp 를 읽을 때 assets/r302/fx/ 재채색 파생본으로 바꿔 준다(readyImage·ensureImages 경로 바꿈).
//     네온 basic 은 창끝 둘이 모이는 화살촉 그림(R292 neon/basic 2~5칸) 대신 외줄 번개(neon/special 1~2칸 재구성)로.
//     파생본은 scripts/r302-hero-palette-strips.py 가 만든다(원본 보존, assets/r302/fx/index.json 에 출처·sha256).
//  ② R106 칠한 스프라이트(draw·along·poly·warm): 부른 파일이 영웅 이펙트 파일(HERO_FILES)이면 팔레트 {a,b} 를 영웅 2색으로 바꾼다
//     (원래 a·b 중 어두운 쪽 → 어두운 쪽 색). 실 파일(THREAD_FILES)은 금빛 팔레트 → {고유색, 골드}, 그 밖 → {고유색, 실버}.
//     판정은 팔레트 값 + 부른 파일로 한 번 하고 기억한다(스택은 처음 한 번만 읽음).
//  ③ R163 pixelfx play·frameAt: 영웅 이펙트 파일에서 부르면 tint {a:고유색, b:보조색} 을 넣는다(R175 물들이기 그대로 씀).
//  ④ 엔진 효과(slash·sigil·burst·link·storySourceSkill·pxfSprite·e568HeroImpact): 영웅 fx 호출, 영웅 그림 경로(assets/vfx/heroes·-player-atlas),
//     영웅 동작(basicAttack·blink·special·ego) 뒤 .6초 안에 생긴 것은 그릴 때 그림을 영웅 2색 기울기로 칠한 정적 사본으로 바꿔 그린다(ctx.filter 안 씀). 문자열 색(e.color)도 2색.
//     영웅 띠가 도는 동안 그 영웅의 burst·pxfSprite 섬광은 알파 .45, 0.4초에 2개까지.
//  ⑤ 영웅 전용 그림 경로(HERO_ASSET: R108 eden·R106 fx·v31307 hero-impacts·r130 영웅 EGO·r225)를 그릴 때도 같은 사본.
//  미카엘라: 그림만 재채색(스킬 구조는 그대로).
//  끄기: localStorage['storyworld.r302.palette']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_HERO_PALETTE_R302__)return;
const REV='R302-hero-palette-1',KEY='storyworld.r302.palette';
const SILVER=[226,232,242],GOLD=[255,198,72];
const PALETTE=Object.freeze({
 hwando:{main:[214,222,234],sub:GOLD,name:'실버',name2:'골드'},
 seoha:{main:[120,206,255],sub:SILVER,name:'아이스 블루',name2:'실버'},
 neon:{main:[62,230,193],sub:SILVER,name:'민트',name2:'실버'},
 michaela:{main:[178,26,62],sub:SILVER,name:'핏빛 장미',name2:'실버'},
 lauren:{main:[164,98,255],sub:SILVER,name:'바이올렛',name2:'실버'},
 hunter:{main:[255,96,40],sub:SILVER,name:'주홍',name2:'실버'},
 slayer:{main:[222,22,52],sub:SILVER,name:'크림슨',name2:'실버'},
 gunner:{main:[70,124,255],sub:SILVER,name:'코발트',name2:'실버'}});
const THREAD={gold:GOLD,silver:SILVER};
const STRIPS={gunner:['w','e','blink','r'],hwando:['basic','blink','special','w','e','r'],seoha:['basic','w','e'],neon:['basic','special','blink','w'],lauren:['basic','blink']};
const HERO_FILES=new Set(['hero-fx-r102','combat-r160','polish-r101','skills-r209','skills-r181','hero-skills-r269','fx-boost-r225','fx-d2s-r106','fx-eden-r108','effects-r178','michaela-r247','attack-anim-r143','hero-presentation-r83']);
const THREAD_FILES=new Set(['hero-threads-r174','threads-r243']);
const HERO_FN=/at (?:Object\.)?(?:basicAttack|blink|special|ego|cast|castSlot|useSkill|autoCast)\b/;
const HERO_ASSET=/assets\/(?:r108\/eden\/|r106\/fx\/|vfx\/generated\/v31307\/hero-impacts\/|r130\/[a-z]+\/ultimate-|r225\/)/;
const FX_TYPES=new Set(['slash','sigil','burst','link','storySourceSkill']);
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={sp:0,spMapped:0,pixelfx:0,fxMarked:0,filtered:0,paths:0,errors:0,files:{}};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const hero=()=>typeof player==='object'&&player&&PALETTE[player.hero]?player.hero:null;
const lum=c=>c[0]*.299+c[1]*.587+c[2]*.114;
function hsv(c){const r=c[0]/255,g=c[1]/255,b=c[2]/255,M=Math.max(r,g,b),m=Math.min(r,g,b),d=M-m;let h=0;if(d){h=M===r?((g-b)/d)%6:M===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360;}return{h,s:M?d/M:0,v:M};}
// 고유색·보조색 중 채도 높은 쪽의 색상(hue) — 그림을 돌릴 목표
function targetHue(h){const P=PALETTE[h],a=hsv(P.main),b=hsv(P.sub);return a.s>=b.s?a:b;}
function callerFile(stack){const lines=String(stack||'').split('\n');for(const l of lines){const m=l.match(/\/([a-z0-9-]+-r\d+)\.js/);if(m&&m[1]!=='hero-palette-r302'&&m[1]!=='fx-sprites-r106'&&m[1]!=='pixelfx-r163')return m[1];}return null;}
const isGold=c=>{const v=hsv(c);return v.s>.35&&v.h>25&&v.h<62;};
// ---- ① R292 띠 → R302 파생본 ----------------------------------------------------------------
const STRIP_RE=/^(.*)assets\/r292\/fx\/([a-z]+)\/([a-z]+)\.webp$/;
function swapPath(p){if(!on||typeof p!=='string')return p;const m=p.match(STRIP_RE);if(!m||!STRIPS[m[2]]?.includes(m[3]))return p;stats.paths++;return m[1]+'assets/r302/fx/'+m[2]+'/'+m[3]+'.webp';}
try{
 if(typeof readyImage==='function'){const base=readyImage;readyImage=function(p,...a){return base.call(this,swapPath(p),...a);};}
 if(typeof ensureImages==='function'){const base=ensureImages;ensureImages=function(list,...a){return base.call(this,Array.isArray(list)?list.map(swapPath):list,...a);};}
}catch(e){fail(e);}
// ---- ② R106 칠한 스프라이트 팔레트 ---------------------------------------------------------
const decided=new Map();
function mapPal(F,h,file){const S0=SP0;let P;try{P=S0.pal(F);}catch(_){return F;}if(!P||!P.a)return F;const C=PALETTE[h];
 let A,B;if(THREAD_FILES.has(file)){const second=isGold(P.a)||isGold(P.b)?THREAD.gold:THREAD.silver;A=C.main;B=second;}else{A=C.main;B=C.sub;}
 // 원래 어두운 쪽 → 두 색 중 어두운 쪽
 const dark=lum(A)<=lum(B)?A:B,light=dark===A?B:A;return lum(P.a)<=lum(P.b)?S0.pal(dark,light):S0.pal(light,dark);}
function remapF(F){const h=hero();if(!on||!h||!F)return F;stats.sp++;let k;try{const P=SP0.pal(F);k=P.a.join()+'|'+P.b.join()+'|'+h;}catch(_){return F;}
 let d=decided.get(k);if(d===undefined){const file=callerFile(new Error().stack);d=file&&(HERO_FILES.has(file)||THREAD_FILES.has(file))?mapPal(F,h,file):null;decided.set(k,d);stats.files[file||'?']=(stats.files[file||'?']||0)+1;if(decided.size>400)decided.delete(decided.keys().next().value);}
 if(d){stats.spMapped++;return d;}return F;}
let SP0=null;
function wrapSP(){const S=window.__STORYWORLD_FX_SPRITES_R106__;if(!S||S.r302||S===SP0)return;SP0=S;
 const W={...S,r302:true,
  draw:(name,F,...a)=>S.draw(name,remapF(F),...a),along:(name,F,...a)=>S.along(name,remapF(F),...a),poly:(F,...a)=>S.poly(remapF(F),...a),
  warm:(F,...a)=>S.warm(remapF(F),...a),ready:(n,F)=>S.ready(n,remapF(F))};
 window.__STORYWORLD_FX_SPRITES_R106__=Object.freeze(W);}
// ---- ③ pixelfx tint ---------------------------------------------------------------------
let PX0=null;
function heroCall(stack){const f=callerFile(stack);return !!f&&(HERO_FILES.has(f)||THREAD_FILES.has(f))||HERO_FN.test(String(stack));}
function wrapPX(){const X=window.__STORYWORLD_PIXELFX_R163__;if(!X||X.r302||X===PX0)return;PX0=X;
 const tint=(o,n)=>{const h=hero();if(!on||!h||o?.tint)return o;if(!heroCall(new Error().stack))return o;stats.pixelfx++;const C=PALETTE[h],r={...(o||{}),tint:{a:C.main,b:C.sub}};
  if(FLASH.test(n)&&stripOn(h)){r.alpha=(r.alpha??1)*.45;r.k=(r.k||1)*.7;r.r302Flash=true;}return r;};
 window.__STORYWORLD_PIXELFX_R163__=Object.freeze({...X,r302:true,play:(n,x,y,o)=>{const t=tint(o||{},n);if(t?.r302Flash&&!flashOk())return null;return X.play(n,x,y,t);},frameAt:(n,u,x,y,o)=>X.frameAt(n,u,x,y,tint(o||{},n))});}
// 영웅 띠(R292→R302)가 도는 동안: 그 영웅의 범용 적중 섬광(흰 burst·pixelfx hit/crit/flash)은 알파 .45·크기 .7, 0.4초에 2개까지(사용자 2026-11-04 환도 Q 흰 섬광이 띠를 덮음)
const FLASH=/hit|crit|flash|spark|impact/;let flashes=[];
let stripMemo={t:-1,h:null,v:false};
function stripOn(h){const now=performance.now();if(stripMemo.h===h&&now-stripMemo.t<30)return stripMemo.v;stripMemo={t:now,h,v:stripOn0(h)};return stripMemo.v;}
function stripOn0(h){try{return (window.__STORYWORLD_SKILL_FX_R292__?.inspect?.().active||[]).some(a=>a.key.startsWith(h+':'));}catch(_){return false;}}
function flashOk(){const t=performance.now();flashes=flashes.filter(x=>t-x<400);if(flashes.length>=2){stats.flashCut=(stats.flashCut||0)+1;return false;}flashes.push(t);return true;}
// ---- ④⑤ 영웅 그림 물들이기: 원래 그림의 명암만 남기고 영웅 2색 기울기로 칠한 정적 사본(오프스크린, 필터 안 씀) -------------
//  기울기 = scripts/r302-hero-palette-strips.py ramp 와 같음(그림자 고유색×.28 → 고유색 → 보조색 → 보조색 밝게; 고유색이 더 밝으면 순서 바꿈).
const tintCache=new WeakMap();let tintCount=0;
function rampOf(h){const P=PALETTE[h];let st;if(lum(P.main)>lum(P.sub)){const b=P.sub,a=P.main;st=[[0,b.map(v=>v*.28)],[.55,b],[.88,a],[1,a.map(v=>v+(255-v)*.5)]];}
 else{const a=P.main,b=P.sub;st=[[0,a.map(v=>v*.28)],[.6,a],[.9,b],[1,b.map(v=>v+(255-v)*.5)]];}
 const lut=new Uint8ClampedArray(256*3);for(let x=0;x<256;x++){const u=x/255;let k=0;while(k<st.length-2&&u>st[k+1][0])k++;const[u0,c0]=st[k],[u1,c1]=st[k+1],f=Math.max(0,Math.min(1,(u-u0)/(u1-u0)));for(let c=0;c<3;c++)lut[x*3+c]=Math.round(c0[c]+(c1[c]-c0[c])*f);}return lut;}
const luts={};
function tintedImage(im,h){let m=tintCache.get(im);if(!m){m={};tintCache.set(im,m);}if(m[h]!==undefined)return m[h];m[h]=null;
 try{const w=im.naturalWidth||im.width,hh=im.naturalHeight||im.height;if(!w||!hh||w*hh>4200000)return null;const c=document.createElement('canvas');c.width=w;c.height=hh;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);
  const d=g.getImageData(0,0,w,hh),px=d.data,L=luts[h]||(luts[h]=rampOf(h));for(let i=0;i<px.length;i+=4){if(!px[i+3])continue;const r=px[i],gg=px[i+1],b=px[i+2],l=Math.min(255,Math.round(Math.max(r,gg,b)*.6+(r*.299+gg*.587+b*.114)*.4));px[i]=L[l*3];px[i+1]=L[l*3+1];px[i+2]=L[l*3+2];}
  g.putImageData(d,0,0);c.__storyworldStaticTint=true;c.__r302Path='r302-tint';m[h]=c;tintCount++;stats.tinted=tintCount;}catch(_){m[h]=null;}return m[h];}
let heroDraw=0;
function imgPath(im){return im&&(im.__r302Path||(typeof im.src==='string'?im.src:''))||'';}
const patched=new WeakSet();
function patchCtx(c){if(!c||patched.has(c)||typeof c.drawImage!=='function')return;patched.add(c);const base=c.drawImage;
 c.drawImage=function(im,...a){const h=on?hero():null;if(h&&im&&(heroDraw>0||HERO_ASSET.test(imgPath(im)))&&!/assets\/r30[2-9]\/|r302-tint/.test(imgPath(im))){const t=tintedImage(im,h)||im;if(t!==im)stats.filtered++;
   // 영웅 띠가 도는 동안 영웅 전용 그림(R106 d2s·R108 eden 'lighter' 겹침 등)은 알파 .35 — 환도 Q 에서 eden slash 6장이 더하기 합성으로 하얗게 날아가 띠를 덮던 것
   if(HERO_ASSET.test(imgPath(im))&&stripOn(h)){const ga=this.globalAlpha;this.globalAlpha=ga*.35;stats.stripDim=(stats.stripDim||0)+1;try{return base.call(this,t,...a);}finally{this.globalAlpha=ga;}}
   return base.call(this,t,...a);}return base.call(this,im,...a);};}
// 영웅 동작(기본공격·블링크·고유기술·EGO) 뒤 .6초 안에 새로 생긴 적중·불꽃 효과는 영웅 것으로 본다(엔진이 effects 에 바로 넣는 burst·pxfSprite·e568HeroImpact 포함)
const MARK_TYPES=new Set(['slash','sigil','burst','link','storySourceSkill','pxfSprite','e568HeroImpact']);
const HERO_EFFECT_ASSET=/assets\/vfx\/heroes\/|-player-atlas/;
let actionUntil=-1;const seenFx=new WeakSet();const Tm=()=>typeof time==='number'?time:0;
function markNew(){const h=on?hero():null;if(typeof effects==='undefined'||!Array.isArray(effects))return;for(const e of effects){if(!e||typeof e!=='object'||seenFx.has(e))continue;seenFx.add(e);if(!h||e.r302||!MARK_TYPES.has(e.type))continue;
  const asset=typeof e.asset==='string'?e.asset:(e.asset?.src||e.path||'');if(e.type==='e568HeroImpact'||HERO_EFFECT_ASSET.test(asset)||Tm()<actionUntil)markHero(e,h);}}
function markHero(e,h){e.r302=h;stats.fxMarked++;if(typeof e.color==='string')e.color=mapColor(e.color,h);
 if((e.type==='burst'||e.type==='pxfSprite')&&stripOn(h)){if(flashOk())e.alpha=(e.alpha??1)*.45;else{e.alpha=0;e.life=Math.min(e.life||0,.01);}stats.flashDim=(stats.flashDim||0)+1;}}
function mapColor(s,h){try{const S=SP0||window.__STORYWORLD_FX_SPRITES_R106__,c=S?.parseColour?.(s);if(!c)return s;const C=PALETTE[h],t=lum(c)>170?(lum(C.main)>lum(C.sub)?C.main:C.sub):(lum(C.main)>lum(C.sub)?C.sub:C.main);return'rgb('+t.join(',')+')';}catch(_){return s;}}
try{
 for(const fn of ['basicAttack','special','blink','ego']){try{const base=globalThis[fn]??(typeof eval(fn)==='function'?eval(fn):null);if(typeof base!=='function')continue;
   const w=function(...args){try{markNew();}catch(_){}actionUntil=Tm()+.6;return base.apply(this,args);};
   if(fn==='basicAttack')basicAttack=w;else if(fn==='special')special=w;else if(fn==='blink')blink=w;else if(fn==='ego')ego=w;}catch(_){}}
 if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt){const n0=typeof effects!=='undefined'&&Array.isArray(effects)?effects.length:0,res=base.apply(this,arguments);
  try{const h=hero();if(on&&h&&FX_TYPES.has(type)){const o=opt||{};let mine=o.sourceHero?o.sourceHero===h:false;if(!mine&&!o.sourceHero&&!o.enemy)mine=heroCall(new Error().stack);
    if(mine)for(let i=effects.length-1;i>=Math.max(0,n0-1);i--){const e=effects[i];if(e&&e.type===type&&!e.r302){seenFx.add(e);markHero(e,h);break;}}}}catch(err){fail(err);}return res;};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){try{patchCtx(ctx);wrapSP();wrapPX();}catch(_){}if(e&&e.r302&&on){heroDraw++;try{return base.apply(this,[e,...a]);}finally{heroDraw--;}}return base.apply(this,[e,...a]);};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){try{wrapSP();wrapPX();if(typeof ctx!=='undefined')patchCtx(ctx);}catch(e){fail(e);}const r=base.apply(this,a);try{markNew();}catch(e){fail(e);}return r;};}
}catch(e){fail(e);}
try{wrapSP();wrapPX();}catch(e){fail(e);}
function set(v){on=v!==false;decided.clear();try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_HERO_PALETTE_R302__=Object.freeze({revision:REV,palette:PALETTE,thread:THREAD,strips:STRIPS,heroFiles:[...HERO_FILES],threadFiles:[...THREAD_FILES],swapPath,on:()=>on,set,
 mapPal:(F,h,file)=>SP0?mapPal(F,h,file):null,targetHue,rampOf,
 inspect:()=>({revision:REV,on,hero:hero(),stats:JSON.parse(JSON.stringify(stats)),decided:[...decided].map(([k,v])=>[k,v?v.a.join()+'|'+v.b.join():null]),lastError})});
})();
