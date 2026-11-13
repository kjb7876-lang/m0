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
//     판정은 팔레트 값 + 영웅 + 호출자 분류로 기억한다. R111은 은색실 threadSlash 경로만 실 규칙을 적용한다.
//  ③ R163 pixelfx play·frameAt: 영웅 이펙트 파일에서 부르면 tint {a:고유색, b:보조색} 을 넣는다(R175 물들이기 그대로 씀).
//  ④ 엔진 효과(slash·sigil·burst·link·storySourceSkill·pxfSprite·e568HeroImpact): 영웅 fx 호출, 영웅 그림 경로(assets/vfx/heroes·-player-atlas),
//     명시된 영웅 소유 정보가 있는 것은 그릴 때 그림을 영웅 2색 기울기로 칠한 정적 사본으로 바꿔 그린다(ctx.filter 안 씀). 문자열 색(e.color)도 2색.
//     영웅 띠가 도는 동안 그 영웅의 burst·pxfSprite 섬광은 알파 .45, 0.4초에 2개까지.
//  ⑤ 영웅 전용 그림 경로(HERO_ASSET: R108 eden·R106 fx·v31307 hero-impacts·r130 영웅 EGO·r225)를 그릴 때도 같은 사본.
//  미카엘라: 그림만 재채색(스킬 구조는 그대로).
//  끄기: localStorage['storyworld.r302.palette']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_HERO_PALETTE_R302__)return;
const REV='R302-hero-palette-2',KEY='storyworld.r302.palette';
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
const decided=new Map(),SHORT=4,T111=/at threadSlash \(.*\/play-r111\.js:/,needFull=new Set();
// R441 렉: play-r111 은 4칸 스택이면 판정이 끝난다 — 은색실 threadSlash 는 스프라이트를 직접(3칸째) 또는 안쪽 cut 화살표로(4칸째) 부르고,
//  같은 파일의 보스·자아 그림은 threadSlash 밖이다. 예전엔 threadSlash 가 4칸 안에 없으면 '더 깊을 수도' 하고 전체 스택을 늘 다시 잡아
//  보스 그림 호출(헤드리스 dist00 12초 1,900번)마다 스택을 두 번 잡았다. 판정 결과는 같다(r441 검사가 threadSlash 구조를 확인).
const shortOk=(file,stack)=>!!file;
function mapPal(F,h,file){const S0=SP0;let P;try{P=S0.pal(F);}catch(_){return F;}if(!P||!P.a)return F;const C=PALETTE[h];
 let A,B;if(THREAD_FILES.has(file)){const second=isGold(P.a)||isGold(P.b)?THREAD.gold:THREAD.silver;A=C.main;B=second;}else{A=C.main;B=C.sub;}
 // 원래 어두운 쪽 → 두 색 중 어두운 쪽
 const dark=lum(A)<=lum(B)?A:B,light=dark===A?B:A;return lum(P.a)<=lum(P.b)?S0.pal(dark,light):S0.pal(light,dark);}
function remapF(F,name){const h=hero();if(!on||!h||!F)return F;stats.sp++;
 {const q=memoHit(F,h,name);if(q!==MISS){if(!shadow)return q;shadowQ=q;}}
 // R361 렉: 호출 파일은 거의 늘 스택 위 4칸 안에 있다 → 먼저 4칸만 잡는다(스택 잡기·글자 만들기 비용 절반 이하).
 //  4칸 스택은 전체 스택의 앞부분이라 거기서 찾은 파일·threadSlash 줄은 전체에서 찾은 것과 같다.
 //  못 찾았거나, R111 인데 4칸 안에 threadSlash 가 없으면(더 깊이 있을 수 있음) 예전처럼 전체를 다시 잡는다.
 //  그런 팔레트는 기억해 두고 다음엔 처음부터 전체를 잡는다(두 번 잡기 방지). 어느 쪽을 잡아도 판정은 예전과 같다(비용만 다름).
 let k0;try{const P=SP0.pal(F);k0=P.a.join()+'|'+P.b.join();}catch(_){return F;}
 let stack,file=null;const L=Error.stackTraceLimit;
 if(L>SHORT&&!needFull.has(k0)){Error.stackTraceLimit=SHORT;try{stack=new Error().stack;}finally{Error.stackTraceLimit=L;}file=callerFile(stack);}
 if(!shortOk(file,stack)){const tried=stack!==undefined;stack=new Error().stack;file=callerFile(stack);stats.spFull=(stats.spFull||0)+1;
  if(tried){needFull.add(k0);if(needFull.size>400)needFull.delete(needFull.values().next().value);}
  else if(L>SHORT){const head=String(stack).split('\n').slice(0,SHORT+1).join('\n');if(shortOk(callerFile(head),head))needFull.delete(k0);}}
 // R111 also renders bosses: only its silver-thread slash is a thread caller.
 const thread=THREAD_FILES.has(file)||(file==='play-r111'&&T111.test(String(stack)));
 const kind=thread?'thread':HERO_FILES.has(file)?'hero':'other';seenFile=file;seenKind=kind;
 const k=k0+'|'+h+'|'+kind;
 let d=decided.get(k);if(d===undefined){d=kind==='other'?null:mapPal(F,h,thread?'hero-threads-r174':file);decided.set(k,d);stats.files[file||'?']=(stats.files[file||'?']||0)+1;if(decided.size>400)decided.delete(decided.keys().next().value);}
 if(d){stats.spMapped++;return memoNote(F,d);}return memoNote(F,F);}
// R1012 렉(사용자 2026-11-13 "사몽모드에서 환도로 광장처치666 에서 777코드로 플레이 하는데 렉이 심함"):
//  광장에서 환도 777 은 한 장면에 remapF 를 300~650번 부르고 그때마다 호출 파일을 찾으려 스택을 잡는다. 이 게임은 그리기가 감싸기 수백 겹 안에서
//  돌아 Error 하나 만드는 데 약 50마이크로초(스택 깊이에 비례, 칸 수 한도와 무관)라 장면당 19~51ms(그리기의 18~36%, 헤드리스)를 썼다.
//  → '그리는 자리' 열쇠(지금 그리는 엔진 효과 종류 | 그림 이름 | 팔레트 값 | 영웅)가 같은 파일에서 MEMO_OK 번 잇달아 같은 판정을 받으면
//  그 뒤로는 스택 없이 그 결과를 돌려주고(memoHit), 무작위로 골라(처음 256번은 4번에 1번, 그 뒤 16번에 1번) 예전 길(스택)로 다시 확인한다(memoNote).
//  정해진 간격이 아니라 무작위인 까닭: 한 장면에 같은 열쇠를 8·16번씩 같은 순서로 그리면 간격 확인이 늘 같은 자리만 봐서 가끔 끼는 다른 파일을 영영 못 본다(실측).
//  한 번이라도 파일·판정이 어긋난 열쇠는 영영 예전 길이다. 파일을 못 찾은 호출도 영영 예전 길.
//  play-r111 은 같은 파일 안에서 threadSlash 만 실 규칙인데, threadSlash 는 엔진 효과 threadSlashR63 을 그릴 때만 불려 열쇠(효과 종류)가 갈린다.
//  (광장 환도 777 은 호출의 58%가 play-r111 이라 이 파일을 빼면 효과가 1/3 로 준다.) 같은 열쇠에 두 판정이 섞이면 위 규칙대로 예전 길.
//  판정 표(decided)·통계(sp·spMapped)·색 규칙은 그대로.
//  끄기(예전 길로): localStorage['storyworld.r302.memo']='0' 뒤 새로 고침, 또는 __STORYWORLD_HERO_PALETTE_R302__.memo(false) (끄면 그 값을 저장, 켜면 지움)
let memoOn=true;try{if(localStorage.getItem('storyworld.r302.memo')==='0')memoOn=false;}catch(_){}
const MISS={},memo=new Map(),MEMO_OK=32,MEMO_EARLY=256,MEMO_MAX=3000;let memoRnd=0x9e3779b9;
const memoCheck=m=>{memoRnd=(Math.imul(memoRnd,1103515245)+12345)>>>0;return (memoRnd>>>16)%(++m.n<=MEMO_EARLY?4:16)===0;};let seenFile=null,seenKind=null,shadow=false,shadowQ=MISS,memoKey=null,fxType='';
const samePal=(x,y)=>x===y||(!!x&&!!y&&!!x.a&&!!y.a&&!!x.b&&!!y.b&&x.a.join()===y.a.join()&&x.b.join()===y.b.join());
function memoHit(F,h,name){memoKey=null;seenFile=null;seenKind=null;shadowQ=MISS;if(!memoOn)return MISS;
 try{const P=SP0.pal(F);memoKey=fxType+'|'+(name||'')+'|'+P.a.join()+'|'+P.b.join()+'|'+h;}catch(_){return MISS;}
 const m=memo.get(memoKey);if(!m||m.slow||m.ok<MEMO_OK||memoCheck(m))return MISS;
 stats.spFast=(stats.spFast||0)+1;if(m.same)return F;if(!shadow)stats.spMapped++;return m.res;}
function memoNote(F,res){const key=memoKey,file=seenFile,kind=seenKind;if(!memoOn||key===null)return res;
 // 그림자 검사(shadow, 실플레이 검증용): 빠른 길이 내놓은 팔레트를 쓰지 않고 예전 길 결과와 값으로 대조해 어긋난 수를 센다(게임은 예전 길 결과로 그림)
 if(shadowQ!==MISS){const q=shadowQ;shadowQ=MISS;let bad=false;try{bad=!samePal(SP0.pal(q),SP0.pal(res));}catch(_){bad=true;}
  if(bad){stats.fastWrong=(stats.fastWrong||0)+1;const W=stats.wrong||(stats.wrong={}),k=key+' memo='+memo.get(key)?.file+' now='+file;if(W[k]||Object.keys(W).length<40)W[k]=(W[k]||0)+1;}
  else if(memo.get(key)?.file!==file)stats.fastOtherFile=(stats.fastOtherFile||0)+1;return res;}
 const same=res===F;let m=memo.get(key);if(!m){if(memo.size>=MEMO_MAX)memo.clear();m={file,kind,res,same,ok:0,n:0,slow:false};memo.set(key,m);}
 if(!file)m.slow=true;
 else if(m.file!==file||m.kind!==kind||m.same!==same||(!same&&!samePal(m.res,res))){if(!m.slow)stats.memoMixed=(stats.memoMixed||0)+1;m.slow=true;}
 else{m.ok++;m.res=res;}
 return res;}
let SP0=null;
function wrapSP(){const S=window.__STORYWORLD_FX_SPRITES_R106__;if(!S||S.r302||S===SP0)return;SP0=S;
 const W={...S,r302:true,
  draw:(name,F,...a)=>S.draw(name,remapF(F,name),...a),along:(name,F,...a)=>S.along(name,remapF(F,name),...a),poly:(F,...a)=>S.poly(remapF(F,'~poly'),...a),
  warm:(F,...a)=>S.warm(remapF(F,'~warm'),...a),ready:(n,F)=>S.ready(n,remapF(F,n))};
 window.__STORYWORLD_FX_SPRITES_R106__=Object.freeze(W);}
// ---- ③ pixelfx tint ---------------------------------------------------------------------
let PX0=null;
function heroCall(stack){const f=callerFile(stack);
 // R178 also draws enemy tower destruction; only its hero action paths qualify.
 if(f==='effects-r178'){const frame=String(stack).split('\n').find(l=>/\/effects-r178\.js:/.test(l));return /at (?:Object\.)?(?:go|play|specialFx|special|ego)\b/.test(frame||'');}
 return f?HERO_FILES.has(f)||THREAD_FILES.has(f):HERO_FN.test(String(stack));}
// Explicit non-hero ownership wins over caller/asset heuristics.
function ownership(o,h){if(o?.enemy)return false;
 const values=[o?.sourceHero,o?.owner,o?.source,o?.hero].filter(v=>v!=null);
 if(!values.length)return null;
 return values.every(v=>v===h||v==='hero'||v==='player'||v===player);}
// R441 렉: 소유 정보가 있으면 스택을 잡지 않는다(예전엔 인자로 늘 먼저 잡았다). 잡을 땐 이 두 칸(lazyStack·isHero)만큼 한도를 늘려 같은 호출자 범위를 본다.
function lazyStack(){const L=Error.stackTraceLimit;if(Number.isFinite(L))Error.stackTraceLimit=L+2;try{return new Error().stack;}finally{Error.stackTraceLimit=L;}}
function isHero(o,h,stack){const own=ownership(o,h);return own===null?heroCall(typeof stack==='function'?stack():stack):own;}
function wrapPX(){const X=window.__STORYWORLD_PIXELFX_R163__;if(!X||X.r302||X===PX0)return;PX0=X;
 const tint=(o,n)=>{const h=hero();if(!on||!h||!isHero(o,h,lazyStack))return o;stats.pixelfx++;const C=PALETTE[h],r={...(o||{}),tint:{a:C.main,b:C.sub}};
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
// Only explicit ownership or hero-only assets/types identify queued effects; no action time window.
const MARK_TYPES=new Set(['slash','sigil','burst','link','storySourceSkill','pxfSprite','e568HeroImpact']);
const HERO_EFFECT_ASSET=/assets\/vfx\/heroes\/|-player-atlas/;
const seenFx=new WeakSet();
function markNew(){const h=on?hero():null;if(typeof effects==='undefined'||!Array.isArray(effects))return;for(const e of effects){if(!e||typeof e!=='object'||seenFx.has(e))continue;seenFx.add(e);if(!h||e.r302||!MARK_TYPES.has(e.type))continue;
  const own=ownership(e,h),asset=typeof e.asset==='string'?e.asset:(e.asset?.src||e.path||'');
  if(own===true||(own===null&&(e.type==='e568HeroImpact'||HERO_EFFECT_ASSET.test(asset))))markHero(e,h);}}
function markHero(e,h){e.r302=h;stats.fxMarked++;if(typeof e.color==='string')e.color=mapColor(e.color,h);
 if((e.type==='burst'||e.type==='pxfSprite')&&stripOn(h)){if(flashOk())e.alpha=(e.alpha??1)*.45;else{e.alpha=0;e.life=Math.min(e.life||0,.01);}stats.flashDim=(stats.flashDim||0)+1;}}
function mapColor(s,h){try{const S=SP0||window.__STORYWORLD_FX_SPRITES_R106__,c=S?.parseColour?.(s);if(!c)return s;const C=PALETTE[h],t=lum(c)>170?(lum(C.main)>lum(C.sub)?C.main:C.sub):(lum(C.main)>lum(C.sub)?C.sub:C.main);return'rgb('+t.join(',')+')';}catch(_){return s;}}
try{
 if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt){const n0=typeof effects!=='undefined'&&Array.isArray(effects)?effects.length:0,res=base.apply(this,arguments);
  try{const h=hero();if(on&&h&&FX_TYPES.has(type)){const mine=isHero(opt||{},h,lazyStack);
    if(mine)for(let i=effects.length-1;i>=n0;i--){const e=effects[i];if(e&&e.type===type&&!e.r302&&ownership(e,h)!==false){seenFx.add(e);markHero(e,h);break;}}}}catch(err){fail(err);}return res;};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){try{patchCtx(ctx);wrapSP();wrapPX();}catch(_){}const t0=fxType;fxType=e&&typeof e.type==='string'?e.type:'?';try{if(e&&e.r302&&on){heroDraw++;try{return base.apply(this,[e,...a]);}finally{heroDraw--;}}return base.apply(this,[e,...a]);}finally{fxType=t0;}};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){try{wrapSP();wrapPX();if(typeof ctx!=='undefined')patchCtx(ctx);}catch(e){fail(e);}const r=base.apply(this,a);try{markNew();}catch(e){fail(e);}return r;};}
}catch(e){fail(e);}
try{wrapSP();wrapPX();}catch(e){fail(e);}
function set(v){on=v!==false;decided.clear();memo.clear();try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_HERO_PALETTE_R302__=Object.freeze({revision:REV,palette:PALETTE,thread:THREAD,strips:STRIPS,heroFiles:[...HERO_FILES],threadFiles:[...THREAD_FILES],swapPath,on:()=>on,set,memo:v=>{if(v!==undefined){memoOn=v!==false;memo.clear();try{if(memoOn)localStorage.removeItem('storyworld.r302.memo');else localStorage.setItem('storyworld.r302.memo','0');}catch(_){}}return memoOn;},shadow:v=>{if(v!==undefined)shadow=!!v;return shadow;},
 mapPal:(F,h,file)=>SP0?mapPal(F,h,file):null,targetHue,rampOf,
 inspect:()=>({revision:REV,on,hero:hero(),stats:JSON.parse(JSON.stringify(stats)),decided:[...decided].map(([k,v])=>[k,v?v.a.join()+'|'+v.b.join():null]),lastError})});
})();
