// R1095 CPU 검사: 이펙트 수묵 색(fx-ink-r1095.js) — 브라우저 없이 실제 모듈을 가짜 DOM 에서 돌린다.
//  ① 연결(태그·sync·공개 확인 목록·CI 줄) ② 팔레트: 연지·주홍·먹·백 ③ 공통 색 함수 tone(): 금·파랑·보라 → 붉은 주홍 계열, 밝은 색 → 백, 어두운 색 → 먹,
//     알파 유지, 모르는 값·NaN 은 그대로 ④ 그림용 필터 filterFor(): Three 기록기가 아는 조각만, 어떤 색상에서 출발해도 주홍 근처로, 값은 유한
//  ⑤ 고르기: 이펙트만. 예고 표시(hazard)·탄·글자·그림자·적 표식·영웅/몹 몸·잔상·EGO 는 그대로. 기존 필터 뒤에 덧붙임, 두 번 붙이지 않음, 원래 style 객체는 안 바꿈
//  ⑥ 켜고 끄기: 기본 켜짐, '0' 끔, 맵 수묵화풍(R1055)이 꺼졌거나 쉬는 단계면 원래 색 ⑦ 새 스킬은 자동으로 같은 팔레트, register 로 예외 등록
//  ⑧ 렌더러 감싸기 ⑨ 설정 창 줄 ⑩ 새 키 입력·ctx.filter·판정 변경 없음.  실제 화면은 r1095-browser.mjs(헤드리스)가 잰다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..'),ROOT=path.resolve(R,'..');
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return '';}};
const res=[];const ok=(n,c,d='')=>{res.push(!!c);console.log((c?'PASS ':'FAIL ')+n+(c||d===''?'':' :: '+(typeof d==='string'?d:JSON.stringify(d))));};
const done=()=>{const failed=res.filter(x=>!x).length;console.log(JSON.stringify({total:res.length,failed,method:'node vm + tiny fake DOM'}));process.exit(failed?1:0);};
const NAME='fx-ink-r1095.js',F=path.join(R,'client-source',NAME);const src=rd(F);
ok('client-source/'+NAME+' exists',src.length>0);
// ---- ① 연결 ----
const html=rd(path.join(R,'runtime-text','index.html'));
ok('runtime copy identical to client-source',src.length>0&&rd(path.join(R,'runtime-text',NAME))===src);
ok('index.html loads it exactly once',(html.match(/<script src="\.\/fx-ink-r1095\.js"><\/script>/g)||[]).length===1);
{const a=html.indexOf(NAME),b=html.indexOf('<script src="./combat-r118.js">'),c=html.indexOf('ink-wash-r1055.js'),d=html.indexOf('ink-chars-r1090.js');
 ok('before combat-r118·world-tiles-r118 (끝 두 태그 규칙)',a>0&&b>a);
 ok('after ink-wash-r1055 and ink-chars-r1090 (맵 수묵 상태를 읽음)',a>c&&c>0&&a>d&&d>0);}
ok('verify-r96-public.py expects it',/'fx-ink-r1095\.js'/.test(rd(path.join(ROOT,'scripts','verify-r96-public.py'))));
ok('runtime-inputs/manifest list it',/fx-ink-r1095\.js/.test(rd(path.join(R,'runtime-inputs.json'))+rd(path.join(R,'runtime-text','runtime-inputs.json')))&&/fx-ink-r1095\.js/.test(rd(path.join(R,'runtime-manifest.json'))+rd(path.join(R,'runtime-text','runtime-manifest.json'))));
ok('pages.yml runs this check',/node r96\/qa\/r1095\/r1095-cpu-check\.cjs/.test(rd(path.join(ROOT,'.github','workflows','pages.yml'))));
if(!src)done();
// ---- 가짜 세계 ----
const KEY='storyworld.r1095.inkFx';
function world(stored,opt={}){
 const store=new Map(stored===undefined?[]:[[KEY,stored]]);
 const mk=tag=>{const e={tagName:tag.toUpperCase(),children:[],parentNode:null,id:'',textContent:'',checked:false,type:'',className:'',style:{},
  appendChild(c){if(c.parentNode)c.parentNode.children=c.parentNode.children.filter(x=>x!==c);c.parentNode=this;this.children.push(c);return c;},
  _all(){const o=[];const w=x=>x.children.forEach(c=>{o.push(c);w(c);});w(this);return o;}};return e;};
 const docEl=mk('html'),body=mk('body'),panel=mk('section');panel.id='panel';docEl.appendChild(body);body.appendChild(panel);
 const document={documentElement:docEl,body,readyState:'complete',createElement:mk,getElementById:id=>docEl._all().find(e=>e.id===id)||null,addEventListener(){}};
 const localStorage={getItem:k=>{if(opt.throws)throw Error('denied');return store.has(k)?store.get(k):null;},setItem:(k,v)=>{if(opt.throws)throw Error('denied');store.set(k,String(v));},removeItem:k=>{if(opt.throws)throw Error('denied');store.delete(k);}};
 const ink={mode:opt.inkMode??'all',k:opt.inkK??1},ego={on:opt.ego??true},roomObj={id:'cult04',enemies:opt.persona?[{id:'inner-evil-rc133',persona:true,hp:100}]:[{id:'mob',hp:10}]};
 const calls={base:0};function Renderer(){}Renderer.prototype.render=function(frame){calls.base++;calls.last=frame;if(opt.baseThrows)throw Error('base boom');return 'drawn';};
 const inst=new Renderer();if(opt.instOwn!==false)inst.render=Renderer.prototype.render;
 const timers=[],ivals=[];
 const w={document,localStorage,console,setTimeout:f=>{timers.push(f);return timers.length;},clearTimeout(){},setInterval:f=>{ivals.push(f);return ivals.length;},clearInterval(){},
  queueMicrotask:f=>timers.push(f),requestAnimationFrame:f=>timers.push(f),addEventListener(){},
  StoryPhase1:{ThreeRenderer:Renderer},__STORYWORLD_PHASE1__:{controller:{state:{three:opt.lateInst?null:inst}}},
  showSettings(){panel.children=[];const s=mk('section');s.id='combatScreenR1021';panel.appendChild(s);const r=mk('div');r.id='inkRowR1055';s.appendChild(r);if(opt.charsRow!==false){const r2=mk('div');r2.id='inkCharsRowR1090';s.appendChild(r2);}return 'base';}};
 if(opt.noInk!==true)w.__STORYWORLD_INK_WASH_R1055__={prefs:()=>({mode:ink.mode,style:'jg'}),inspect:()=>({k:ink.k,prefs:{mode:ink.mode}})};
 if(opt.noPlayer!==true)w.player={hero:opt.hero??'neon'};
 if(opt.noEgo!==true)w.__STORYWORLD_EGO_SOVEREIGN_R1046__={active:()=>{if(opt.egoThrows)throw Error('ego boom');return ego.on;}};if(opt.noRoom!==true)w.room=roomObj;
 w.window=w;w.globalThis=w;const ctx=vm.createContext(w);let err=null;try{vm.runInContext(src,ctx,{filename:NAME});}catch(e){err=e;}
 return {w,ctx,docEl,panel,store,err,ink,ego,roomObj,calls,inst,Renderer,api:w.__STORYWORLD_INK_FX_R1095__,flush(){for(let i=0;i<50&&timers.length;i++)timers.shift()();},tick(){ivals.forEach(f=>f());}};}
const STYLE=o=>({globalAlpha:1,globalCompositeOperation:'lighter',fillStyle:'#080e16',strokeStyle:'#080e16',filter:'none',lineWidth:1,...o});
let seq=0;
const cmd=(kind,ownerKind,o={})=>({kind,key:o.key??'k'+(++seq),owner:{id:o.id??ownerKind+':1',kind:ownerKind,groundAligned:false,...(o.owner||{})},order:1,sourcePath:o.path===undefined?'r106fx:glow:255.198.72:214.222.234':o.path,spatialRole:null,style:STYLE(o.style)});
// ---- 색 도구(검사 쪽 독립 구현) ----
const hsv=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d>1e-9){if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360;}return {h,c:mx>0?d/mx:0,v:mx/255};};
const lum=(r,g,b)=>(.213*r+.715*g+.072*b)/255;
const hueDist=(a,b)=>{const d=Math.abs(a-b)%360;return d>180?360-d:d;};
const parse=s=>{let m=/^#([0-9a-f]{6})$/i.exec(s);if(m){const n=parseInt(m[1],16);return [n>>16,(n>>8)&255,n&255,1];}
 m=/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(s);return m?[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]]:null;};
// phase1.js filterMatrix 와 같은 식
function applyFilter(filter,rgb){let v=rgb.map(x=>x/255);const pieces=[...String(filter).matchAll(/([a-z-]+)\(([^)]+)\)/gi)];
 for(const [,kind,arg] of pieces){let n=parseFloat(arg);if(arg.trim().endsWith('%'))n/=100;let a,o=0;
  if(kind==='brightness')a=[n,0,0,0,n,0,0,0,n];
  else if(kind==='contrast'){a=[n,0,0,0,n,0,0,0,n];o=.5*(1-n);}
  else if(kind==='saturate'||kind==='grayscale'){const s=kind==='grayscale'?1-n:n,l=[.213,.715,.072];a=[l[0]+(1-l[0])*s,l[1]*(1-s),l[2]*(1-s),l[0]*(1-s),l[1]+(1-l[1])*s,l[2]*(1-s),l[0]*(1-s),l[1]*(1-s),l[2]+(1-l[2])*s];}
  else if(kind==='hue-rotate'){const t=n*Math.PI/180,c=Math.cos(t),s=Math.sin(t);a=[.213+.787*c-.213*s,.715-.715*c-.715*s,.072-.072*c+.928*s,.213-.213*c+.143*s,.715+.285*c+.140*s,.072-.072*c-.283*s,.213-.213*c-.787*s,.715-.715*c+.715*s,.072+.928*c+.072*s];}
  else throw Error('unsupported '+kind);
  v=[a[0]*v[0]+a[1]*v[1]+a[2]*v[2]+o,a[3]*v[0]+a[4]*v[1]+a[5]*v[2]+o,a[6]*v[0]+a[7]*v[1]+a[8]*v[2]+o];}
 return v.map(x=>Math.max(0,Math.min(1,x))*255);}
const KNOWN=['brightness','contrast','saturate','grayscale','hue-rotate'];
const filterOk=f=>{const pieces=[...String(f).matchAll(/([a-z-]+)\(([^)]+)\)/gi)];return pieces.length>=1&&pieces.every(p=>KNOWN.includes(p[1])&&Number.isFinite(parseFloat(p[2])))&&pieces.map(p=>p[0]).join('')===String(f).replace(/\s/g,'');};
const RED=h=>hueDist(h,8)<=24; // 연지(약 357도)~주홍(약 12도)
// ---- 기본 세계 ----
const A=world();ok('module loads without throwing',!A.err,String(A.err&&A.err.stack));const api=A.api;
ok('api present (revision·palette·tone·filterFor·process·register·active·enabled·set·inspect)',!!api&&/^R1095/.test(api.revision||'')&&!!api.palette&&['tone','filterFor','process','register','active','enabled','set','inspect'].every(k=>typeof api[k]==='function'));if(!api)done();
A.tick();
// ---- ② 팔레트 ----
{const P=api.palette,need=['yeonji','juhong','ink','white'];
 ok('palette has 연지·주홍·먹·백 as #rrggbb',need.every(k=>/^#[0-9a-f]{6}$/i.test(P[k]||'')),P);
 const q=k=>{const [r,g,b]=parse(P[k]);return {...hsv(r,g,b),l:lum(r,g,b)};};
 if(need.every(k=>parse(P[k]||''))){
  ok('연지·주홍 are red-vermilion hues with real chroma',RED(q('yeonji').h)&&RED(q('juhong').h)&&q('yeonji').c>.55&&q('juhong').c>.6,[q('yeonji'),q('juhong')]);
  ok('주홍 is brighter than 연지',q('juhong').l>q('yeonji').l);
  ok('먹 is dark and nearly neutral, 백 is bright paper white',q('ink').l<.12&&q('ink').c<.45&&q('white').l>.85&&q('white').c<.12,[q('ink'),q('white')]);}}
ok('reds match the persona thread constants (R1096): 70,14,10 · 132,30,22 · 204,52,40 · 255,176,140',['deep','yeonji','juhong','pale'].map(k=>(parse(api.palette[k]||'')||[]).slice(0,3).join()).join(' ')==='70,14,10 132,30,22 204,52,40 255,176,140',api.palette);
// ---- ③ tone() ----
{const T=s=>api.tone(s),Q=s=>{const p=parse(T(s));return p?{...hsv(p[0],p[1],p[2]),l:lum(p[0],p[1],p[2]),a:p[3]}:null;};
 for(const [name,css] of [['gold','rgba(255,198,72,1)'],['blue','#3aa0ff'],['purple','#9a4dff'],['green','rgb(60,220,120)'],['cyan','rgba(80,230,255,0.5)'],['pink','#ff6fae']]){
  const q=Q(css);ok('tone('+name+') lands on the vermilion family',!!q&&RED(q.h)&&q.c>.35,[T(css),q]);}
 ok('alpha is kept (0.5 → 0.5, 0 → 0, missing → opaque)',Q('rgba(80,230,255,0.5)')?.a===.5&&Q('rgba(255,198,72,0)')?.a===0&&Q('#3aa0ff')?.a===1,[T('rgba(80,230,255,0.5)'),T('rgba(255,198,72,0)'),T('#3aa0ff')]);
 {const q=Q('#f4f1e6');ok('near-white stays white (bright, low chroma)',!!q&&q.l>.82&&q.c<.14,q);}
 {const q=Q('#ffffff'),q3=Q('#fff');ok('pure white and 3-digit hex both map to paper white',!!q&&q.l>.85&&!!q3&&q3.l>.85,[T('#ffffff'),T('#fff')]);}
 {const q=Q('rgba(60,2,10,.62)');ok('dark colour becomes ink (dark), alpha kept',!!q&&q.l<.22&&Math.abs(q.a-.62)<1e-9,[T('rgba(60,2,10,.62)'),q]);}
 {const q=Q('#000000');ok('black stays dark',!!q&&q.l<.12,q);}
 {const a=Q('rgb(120,60,20)'),b=Q('rgb(255,170,60)');ok('darker source → darker result (밝기 순서 유지)',!!a&&!!b&&a.l<b.l,[a,b]);}
 ok('same input twice gives the same string (캐시)',T('#3aa0ff')===T('#3aa0ff'));
 const odd=['transparent','hsl(20,50%,50%)','','rgba(NaN,0,0,1)','rgb(1,2)','#12','url(#x)'];
 ok('unknown or broken colour strings come back unchanged',odd.every(s=>T(s)===s),odd.map(T));
 ok('non-strings come back unchanged (null·number·object·NaN)',T(null)===null&&T(7)===7&&Number.isNaN(T(NaN))&&(o=>T(o)===o)({}));
 const out=T('rgba(300,-20,1e9,2)');ok('out-of-range numbers are clamped, never NaN/Infinity',typeof out==='string'&&!/NaN|Infinity/.test(out)&&(()=>{const p=parse(out);return !!p&&p.every(Number.isFinite)&&p.slice(0,3).every(x=>x>=0&&x<=255)&&p[3]>=0&&p[3]<=1;})(),out);}
// ---- ④ filterFor() ----
{const rep=h=>{const c=.8,x=1-Math.abs((h/60)%2-1),t=[[1,x,0],[x,1,0],[0,1,x],[0,x,1],[x,0,1],[1,0,x]][Math.floor(h/60)%6];return t.map(v=>255*(1-c+c*v));};
 const bad=[];let strings=true;
 for(let h=0;h<360;h+=15){const f=api.filterFor({hue:h,chroma:.8,lum:.6,blend:'lighter'});if(!filterOk(f)){strings=false;bad.push([h,f]);continue;}
  const o=applyFilter(f,rep(h)),q=hsv(o[0],o[1],o[2]);if(!(RED(q.h)&&q.c>.3&&o.every(Number.isFinite)))bad.push([h,f,Math.round(q.h),+q.c.toFixed(2)]);}
 ok('filterFor: 24 source hues → only filter kinds the Three recorder knows',strings,bad);
 ok('filterFor: every source hue ends in the vermilion family (hue ±24°, chroma kept)',bad.length===0,bad);
 // 회귀(1차 시안): 금빛을 색상만 돌리면 분홍으로 옅어졌다 → 색은 진한 주홍, 빛의 세기(가장 밝은 채널)는 원래만큼
 {const weak=[];for(const [name,r,g,b] of [['gold',255,198,72],['pale gold',255,214,120],['cyan',80,230,255],['blue',60,140,255],['green',60,220,120],['pink',255,111,174],['purple',154,77,255]]){
   const q0=hsv(r,g,b),f=api.filterFor({hue:q0.h,chroma:q0.c,lum:lum(r,g,b),blend:'lighter'}),o=applyFilter(f,[r,g,b]),q=hsv(...o);
   if(!(RED(q.h)&&q.c>=.55&&Math.max(...o)>=.88*Math.max(r,g,b)))weak.push([name,f,o.map(Math.round)]);}
  ok('bright sources become deep vermilion, not pink (chroma ≥ .55) and keep their peak brightness (≥ 88%)',weak.length===0,weak);}
 // 적·영웅 색 구별(art-style 10절): 맑고 밝은 색(영웅의 빛) → 따뜻한 주홍, 어두운 핏빛(적의 위협) → 차갑고 어두운 연지, 탁한 색(적의 부패·병색) → 먹빛
 {const F=(r,g,b,blend='lighter')=>{const q=hsv(r,g,b),f=api.filterFor({hue:q.h,chroma:q.c,lum:lum(r,g,b),blend}),o=applyFilter(f,[r,g,b]);return {f,o:o.map(Math.round),...hsv(...o),l:lum(...o)};};
  const heroGold=F(255,198,72),heroBlue=F(120,206,255),heroTeal=F(62,230,193),blood=F(100,27,37),blood2=F(120,8,16);
  const warm=q=>hueDist(q.h,14)<=12,cool=q=>hueDist(q.h,354)<=12;
  ok('hero light (gold·ice blue·teal) → warm 주홍 (hue 2°~26°)',warm(heroGold)&&warm(heroBlue)&&warm(heroTeal),[heroGold,heroBlue,heroTeal].map(q=>[q.f,Math.round(q.h)]));
  ok('enemy blood red (#641B25 등) stays a dark, cooler 연지 (hue 342°~6°, lum < .3)',cool(blood)&&cool(blood2)&&blood.l<.3&&blood2.l<.3,[blood,blood2].map(q=>[q.f,Math.round(q.h),+q.l.toFixed(2)]));
  ok('hero vs enemy differ in both brightness (≥ .15) and colour temperature (hue ≥ 8°)',heroGold.l-blood.l>=.15&&hueDist(heroGold.h,blood.h)>=8,[heroGold.l,blood.l,heroGold.h,blood.h]);
  const muddy=[[86,139,132],[129,144,131],[146,155,48].map((v,i)=>i===2?110:v),[82,64,45]].map(c=>F(...c));
  ok('muddy colours (병적 청록·시체 회녹·탁한 황록·오물 갈색) go to ink grey, never vermilion',muddy.every(q=>q.c<.2&&!/hue-rotate/.test(q.f)),muddy.map(q=>[q.f,q.o]));
  const T=s=>{const p=parse(api.tone(s));return {...hsv(p[0],p[1],p[2]),l:lum(p[0],p[1],p[2])};};
  ok('tone(): the same three roles for lines and fills (gold → warm 주홍, #641B25 → dark 연지, #568B84 → grey)',warm(T('#ffc648'))&&T('#641b25').l<.3&&hueDist(T('#641b25').h,356)<=14&&T('#568b84').c<.2,[api.tone('#ffc648'),api.tone('#641b25'),api.tone('#568b84')]);}
 const lo=api.filterFor({hue:200,chroma:.05,lum:.9,blend:'lighter'});
 ok('low-chroma (white) sheet: no hue-rotate, stays white',filterOk(lo)&&!/hue-rotate/.test(lo)&&(()=>{const o=applyFilter(lo,[240,244,250]);return lum(...o)>.85;})(),lo);
 const un=api.filterFor({hue:null,chroma:null,lum:null,blend:'lighter'});
 ok('unknown sheet colour: mild desaturation only (no hue-rotate, no blow-up)',filterOk(un)&&!/hue-rotate/.test(un)&&(()=>{const o=applyFilter(un,[80,160,255]);return hsv(...o).c<hsv(80,160,255).c;})(),un);
 const dk=api.filterFor({hue:30,chroma:.3,lum:.38,blend:'source-over'});
 ok('dark source-over sheet (연기·먼지) turns to ink grey',filterOk(dk)&&(()=>{const o=applyFilter(dk,[118,100,82]);return hsv(...o).c<.08&&lum(...o)<.45;})(),dk);
 const junk=[{hue:NaN,chroma:NaN,lum:NaN},{hue:Infinity,chroma:9,lum:-3},{},null,undefined].map(x=>api.filterFor(x));
 ok('NaN·Infinity·missing input never throws and still gives a valid filter',junk.every(filterOk),junk);
 ok('no drop-shadow·blur·url·sepia·invert (Legacy 로 떨어지는 종류)',[api.filterFor({hue:210,chroma:.8,lum:.5,blend:'screen'}),lo,un,dk].every(f=>!/drop-shadow|blur|url|sepia|invert|opacity/.test(f)));}
// ---- ⑤ 고르기 ----
const tinted=c=>c.r1095===true;
{const W=world();W.tick();const P=W.api;
 const fx=cmd('image','effect'),fxStyle=fx.style;
 const pre=cmd('image','effect',{style:{filter:'saturate(.65) brightness(.93)'},path:'r106fx:orb:60.140.255:200.230.255'});
 const sheet=cmd('image','effect',{path:'assets/r1041/fx-h6-hwando-iai.webp',owner:{id:'r111:thread-slash:1:0'}});
 const haz=cmd('image','hazard',{path:'assets/r62/field.webp'}),hazFill=cmd('fill','hazard',{style:{fillStyle:'rgba(255,214,140,0.344)'}}),hazStroke=cmd('stroke','hazard',{style:{strokeStyle:'#ff3030'}});
 const proj=cmd('stroke','projectile',{style:{strokeStyle:'#ff5a5a'}}),projImg=cmd('image','projectile');
 const text=cmd('text','effect',{style:{fillStyle:'#f1a1a9'}});
 const shadow=cmd('image','effect',{path:'assets/props/v290/bone_heap.webp',owner:{r329Shadow:true,groundAligned:true},style:{globalCompositeOperation:'source-over'}});
 const rank=cmd('image','effect',{path:'r106fx:ring:100.27.37:160.40.52',owner:{r434:true,enemy:true,groundAligned:true},style:{globalCompositeOperation:'source-over'}});
 const hex=cmd('stroke','effect',{id:'r170:hex:16',owner:{id:'r170:hex:16'},style:{strokeStyle:'rgba(200,16,30,1)'}});
 const enemySide=cmd('image','effect',{owner:{pxf:true,pxfSide:'enemy'}}),enemyType=cmd('image','effect',{owner:{ownerType:'enemy',storyVfx:true}});
 const hero=cmd('image','hero',{path:'assets/hero-authored-v314rc5/hwando-action-atlas.png',style:{globalCompositeOperation:'source-over'}}),mob=cmd('image','enemy',{path:'assets/r763/villagers/fisher-walk.webp',style:{globalCompositeOperation:'source-over'}});
 const after=cmd('image','effect',{path:'http://x/m0/assets/hero-authored-v314rc5/hwando-walk-atlas.png',style:{filter:'saturate(.4) brightness(1.4)',globalCompositeOperation:'source-over'}});
 const ghost=cmd('image','effect',{key:'r350:ghost:hero',owner:{r350:true}});
 const ego1=cmd('image','effect',{path:'http://x/m0/assets/auras-r62/ego-halo.webp',owner:{id:'r62:passive-aura:hero:ego'}}),ego2=cmd('image','effect',{path:'http://x/m0/assets/r100/sig-aura-pale.webp',owner:{id:'r111:ego-back'}}),ego3=cmd('image','effect',{path:'assets/r1048/ego-slash.webp',owner:{id:'r1048:trail'}});
 const prop=cmd('image','prop',{path:'assets/props/v290/corrupted_shrine.webp'}),contact=cmd('image','contact',{path:''});
 const fill=cmd('fill','effect',{style:{fillStyle:'rgba(80,230,255,0.5)'}}),stroke=cmd('stroke','effect',{style:{strokeStyle:'#3aa0ff'}});
 const grad={kind:'radial',args:[0,0,0,0,0,10],matrix:[1,0,0,1,0,0],stops:[{offset:0,color:'rgba(255,255,255,1)'},{offset:.5,color:'rgba(80,160,255,.6)'},{offset:1,color:'rgba(20,40,90,0)'}]};
 const gfill=cmd('fill','effect',{style:{fillStyle:grad}});
 const list=[fx,pre,sheet,haz,hazFill,hazStroke,proj,projImg,text,shadow,rank,hex,enemySide,enemyType,hero,mob,after,ghost,ego1,ego2,ego3,prop,contact,fill,stroke,gfill,null,{kind:'image'},{kind:'image',owner:{kind:'effect'}}];
 const snap=list.map(c=>c&&c.style?JSON.stringify(c.style):null);
 let n=-1,threw=null;try{n=P.process(list);}catch(e){threw=e;}
 ok('process() survives null and half-built commands',!threw,String(threw));
 ok('effect image is tinted with a valid filter',tinted(fx)&&filterOk(fx.style.filter),fx.style&&fx.style.filter);
 ok('original style object is not mutated (새 객체)',fx.style!==fxStyle&&fxStyle.filter==='none');
 {const o=applyFilter(fx.style.filter,[255,198,72]),q=hsv(...o);ok('gold slash glow (255,198,72) is drawn in vermilion',RED(q.h)&&q.c>.35,[fx.style.filter,Math.round(q.h),+q.c.toFixed(2)]);}
 ok('existing filter stays in front, ours is appended',pre.style.filter.startsWith('saturate(.65) brightness(.93) ')&&pre.style.filter.length>'saturate(.65) brightness(.93) '.length&&filterOk(pre.style.filter),pre.style.filter);
 {const o=applyFilter(pre.style.filter,[60,140,255]),q=hsv(...o);ok('blue orb with an existing filter still lands on vermilion',RED(q.h),[pre.style.filter,Math.round(q.h)]);}
 ok('sheet with unknown colour (no canvas here) still gets a valid mild filter',tinted(sheet)&&filterOk(sheet.style.filter)&&!/hue-rotate/.test(sheet.style.filter),sheet.style.filter);
 const same=(c,i)=>!tinted(c)&&JSON.stringify(c.style)===snap[i];
 const keep=[['hazard image(예고 표시)',haz],['hazard fill(예고 표시)',hazFill],['hazard stroke(예고 표시)',hazStroke],['projectile stroke(탄 궤적)',proj],['projectile image',projImg],['damage text',text],['prop shadow',shadow],['enemy rank ring',rank],['enemy hex mark',hex],['enemy-side pxf',enemySide],['enemy story vfx',enemyType],['hero body',hero],['mob body',mob],['hero after-image',after],['R350 ghost',ghost],['prop',prop],['contact shadow',contact]];
 for(const [name,c] of keep)ok('untouched: '+name,same(c,list.indexOf(c)),c.style);
 {const p=parse(fill.style.fillStyle),q=p&&hsv(p[0],p[1],p[2]);ok('effect fill colour is remapped to vermilion, alpha kept',tinted(fill)&&!!p&&RED(q.h)&&p[3]===.5,fill.style.fillStyle);}
 {const p=parse(stroke.style.strokeStyle),q=p&&hsv(p[0],p[1],p[2]);ok('effect stroke colour is remapped to vermilion',tinted(stroke)&&!!p&&RED(q.h),stroke.style.strokeStyle);}
 {const g=gfill.style.fillStyle,st=g&&g.stops;const qs=(st||[]).map(s=>{const p=parse(s.color);return p?{...hsv(p[0],p[1],p[2]),l:lum(p[0],p[1],p[2]),a:p[3]}:null;});
  ok('gradient: new object, original stops untouched, same offsets',g!==grad&&grad.stops[1].color==='rgba(80,160,255,.6)'&&!!st&&st.length===3&&st.every((s,i)=>s.offset===grad.stops[i].offset)&&g.kind==='radial'&&g.args===grad.args||JSON.stringify(g.args)===JSON.stringify(grad.args),g);
  ok('gradient stops: white core stays white, blue → vermilion, dark tail → ink, alphas kept',qs.every(Boolean)&&qs[0].l>.85&&RED(qs[1].h)&&qs[1].a===.6&&qs[2].l<.3&&qs[2].a===0,qs);}
 ok('EGO 형상: EGO 전용 이펙트(후광·등 뒤 기운·검 궤적 시트)도 같은 팔레트',tinted(ego1)&&tinted(ego2)&&tinted(ego3)&&[ego1,ego2,ego3].every(c=>filterOk(c.style.filter)),[ego1,ego2,ego3].map(c=>c.style.filter));
 ok('process() returns how many it changed',n===9,n);
 const f1=fx.style.filter,s1=fill.style.fillStyle;const n2=P.process(list);
 ok('second pass over the same commands changes nothing (두 번 붙이지 않음)',n2===0&&fx.style.filter===f1&&fill.style.fillStyle===s1,n2);
 ok('not an array → 0, no throw',P.process(null)===0&&P.process({})===0&&P.process(undefined)===0);}
// 회귀(헤드리스에서 발견): 다른 영웅의 이동 잔상(이펙트 owner 로 그리는 몸 시트)이 먹빛·백으로 물들었다 → 몸 시트는 경로 모양과 '앞서 몸으로 그려진 적 있는 경로'로 가려낸다
{const W=world();W.tick();const P=W.api;
 const a1=cmd('image','effect',{id:'fx:13',path:'http://x/m0/assets/hero-actions-v3126/actions-v3126-seoha-move-left.webp',style:{filter:'saturate(.4) brightness(1.4)',globalCompositeOperation:'source-over'}});
 const a2=cmd('image','effect',{id:'fx:14',path:'http://x/m0/assets/hero-actions-v3126/actions-v3126-michaela-move-right.webp',style:{filter:'saturate(.4) brightness(1.4)',globalCompositeOperation:'source-over'}});
 const vfx=cmd('image','effect',{id:'hando-native-r49:0.5',path:'assets/vfx/heroes/hwando-a.webp'}),fx2=cmd('image','effect',{path:'assets/r302/fx/hwando/basic.webp',style:{globalCompositeOperation:'screen'}});
 P.process([a1,a2,vfx,fx2]);
 ok('untouched: other heroes\' move after-images (actions-v… sheets)',!tinted(a1)&&!tinted(a2)&&a1.style.filter==='saturate(.4) brightness(1.4)',[a1.style.filter,a2.style.filter]);
 ok('still tinted: effect sheets that live under vfx/ or fx/ folders (heroes 낱말이 있어도)',tinted(vfx)&&tinted(fx2));
 const body='assets/r9999/some-new-mob-sheet.webp',f1=[cmd('image','enemy',{path:body,style:{globalCompositeOperation:'source-over'}})];P.process(f1);
 const later=cmd('image','effect',{id:'fx:99',path:'http://x/m0/'+body,style:{globalCompositeOperation:'source-over'}});P.process([later]);
 ok('untouched: a sheet that was drawn as a body in an earlier frame (나중 프레임의 잔상)',!tinted(later)&&later.style.filter==='none');}
// ---- ⑤-2 적용 대상(사용자 2026-11-16 정정: 기존 영웅은 바꾸지 않는다. 히든 영웅 EGO 와 페르소나 보스만) ----
{const H=world(undefined,{ego:false});H.tick();const P=H.api;
 const gold=cmd('image','effect'),blue=cmd('image','effect',{path:'r106fx:orb:120.206.255:226.232.242'}),sheet=cmd('image','effect',{path:'assets/r302/fx/hwando/basic.webp',style:{globalCompositeOperation:'screen'}}),line=cmd('stroke','effect',{style:{strokeStyle:'#3aa0ff'}}),fillc=cmd('fill','effect',{style:{fillStyle:'rgba(80,230,255,0.5)'}});
 // 보통 영웅에게도 'EGO 진입' 스킬·패시브 후광이 있다 → 이름에 ego 가 있어도 히든 영웅 형상이 아니면 그대로
 const egoSkill=cmd('image','effect',{path:'http://x/m0/assets/auras-r62/ego-halo.webp',owner:{id:'r62:passive-aura:hero:ego'}}),egoBack=cmd('image','effect',{owner:{id:'r111:ego-back'}});
 const list=[gold,blue,sheet,line,fillc,egoSkill,egoBack],snap=list.map(c=>JSON.stringify(c.style));const n=P.process(list);
 ok('ordinary hero (EGO 형상 아님): no effect is recoloured (기존 영웅은 원래 색)',n===0&&list.every((c,i)=>!tinted(c)&&JSON.stringify(c.style)===snap[i]),[n,list.filter(tinted).map(c=>c.sourcePath||c.owner.id)]);
 ok('inspect() reports the scope (ego false, persona false)',P.inspect().ego===false&&P.inspect().persona===false,P.inspect());
 H.ego.on=true;H.tick();const g2=cmd('image','effect');ok('entering the EGO form mid-game switches it on without reload',P.process([g2])===1&&tinted(g2)&&P.inspect().ego===true);
 H.ego.on=false;H.tick();const g3=cmd('image','effect');ok('leaving the EGO form switches it off again',P.process([g3])===0&&!tinted(g3));
 const N=world(undefined,{noEgo:true});N.tick();const g4=cmd('image','effect');ok('no EGO module at all → ordinary heroes untouched, no throw',!N.err&&N.api.process([g4])===0&&!tinted(g4));
 const T=world(undefined,{egoThrows:true});T.tick();const g5=cmd('image','effect');ok('EGO module that throws → treated as not EGO, no throw',!T.err&&T.api.process([g5])===0&&!tinted(g5));
 const NR=world(undefined,{ego:false,noRoom:true});NR.tick();ok('no room yet (첫 화면) → no throw, persona false',!NR.err&&NR.api.inspect().persona===false&&NR.api.inspect().errors===0,NR.api.inspect());}
// 페르소나 보스: 그 보스의 기술 그림(assets/rc134/persona-skills, rc133)만, 영웅이 누구든
{const W=world(undefined,{ego:false,persona:true});W.tick();const P=W.api;
 const orb=cmd('image','effect',{path:'http://x/m0/assets/rc134/persona-skills/small-orb.png',owner:{id:'fx:31'},style:{globalCompositeOperation:'source-over'}});
 const eye=cmd('image','projectile',{path:'assets/rc134/persona-skills/eye.png',owner:{id:'shot:7'},style:{globalCompositeOperation:'source-over'}});
 const src=cmd('image','effect',{path:'assets/persona-skills-source/persona-skills-atlas-1.png',owner:{id:'fx:32'}});
 const body=cmd('image','enemy',{path:'assets/rc133/art/base-s.png',owner:{id:'cult04:inner-evil-rc133',persona:true},style:{globalCompositeOperation:'source-over'}});
 const haz=cmd('image','hazard',{path:'assets/rc134/persona-skills/clock.png',owner:{id:'r62:field:9'}}),hazFill=cmd('fill','hazard',{style:{fillStyle:'rgba(209,40,53,.4)'}});
 const heroFx=cmd('image','effect'),heroLine=cmd('stroke','effect',{style:{strokeStyle:'#3aa0ff'}});
 const list=[orb,eye,src,body,haz,hazFill,heroFx,heroLine],snap=list.map(c=>JSON.stringify(c.style));const n=P.process(list);
 ok('persona boss skill sheets are recoloured (effect and projectile images under rc134/persona-skills)',tinted(orb)&&tinted(eye)&&tinted(src)&&[orb,eye,src].every(c=>filterOk(c.style.filter)),[orb,eye,src].map(c=>c.style.filter));
 ok('persona: body·예고 표시(hazard)·영웅 이펙트 stay as they are',[body,haz,hazFill,heroFx,heroLine].every(c=>!tinted(c)&&JSON.stringify(c.style)===snap[list.indexOf(c)])&&n===3,n);
 ok('inspect() reports persona true while the boss is alive',P.inspect().persona===true);
 P.register(/small-orb/,'red',{hue:270,chroma:.8,lum:.4});const o2=cmd('image','effect',{path:'assets/rc134/persona-skills/small-orb.png',style:{globalCompositeOperation:'source-over'}});P.process([o2]);
 ok('register() tells the palette a persona sheet\'s hue → vermilion family',tinted(o2)&&RED(hsv(...applyFilter(o2.style.filter,[140,60,230])).h),o2.style.filter);
 // 보스가 없는 방에서도 그 그림이 쓰이면(히든 영웅이 페르소나 기술을 빌려 쓸 때) 같은 팔레트
 const E=world(undefined,{ego:true});E.tick();const o3=cmd('image','effect',{path:'assets/rc134/persona-skills/diamond.png',style:{globalCompositeOperation:'source-over'}});E.api.process([o3]);ok('EGO 형상이 빌려 쓰는 페르소나 기술 그림도 같은 팔레트',tinted(o3));
 const D=world(undefined,{ego:false});D.tick();const o4=cmd('image','effect',{path:'assets/rc134/persona-skills/diamond.png',style:{globalCompositeOperation:'source-over'}});D.api.process([o4]);ok('persona sheet path is enough on its own (보스 판정이 늦어도 색이 튀지 않게)',tinted(o4));}
// 두 고유색(사용자 2026-11-16 02:36Z): 페르소나 보스·영웅 = 연지·주홍 단독, 히든 영웅 EGO = 연지·주홍 + 먹 + 백
{const F=(r,g,b,mode,blend='source-over')=>{const q=hsv(r,g,b),f=api.filterFor({hue:q.h,chroma:q.c,lum:lum(r,g,b),blend,mode}),o=applyFilter(f,[r,g,b]);return {f,o:o.map(Math.round),...hsv(...o),l:lum(...o)};};
 const cols=[[86,139,132],[129,144,131],[118,100,82],[150,90,220],[60,140,255],[255,198,72],[214,222,234],[100,27,37]];
 const mono=cols.map(c=>F(...c,'mono')),mix3=cols.map(c=>F(...c,undefined));
 ok("persona palette ('mono'): every coloured source, muddy or clean, lands on 연지·주홍 with real chroma (≥ .3)",mono.every(q=>filterOk(q.f)&&RED(q.h)&&q.c>=.3),mono.map(q=>[q.f,q.o]));
 ok('persona palette never uses the ink-grey or white branches for coloured sources',mono.every(q=>!/grayscale/.test(q.f)&&q.f!=='saturate(.3)'));
 ok('EGO palette (default) still mixes three: muddy → grey, dark smoke → ink, silver → white, gold → 주홍',mix3[0].c<.2&&mix3[2].c<.08&&mix3[6].c<.12&&RED(mix3[5].h)&&mix3[5].c>.5,mix3.map(q=>[q.f,q.o]));
 const TM=s=>{const p=parse(api.tone(s,'mono'));return p?{...hsv(p[0],p[1],p[2]),l:lum(p[0],p[1],p[2]),a:p[3]}:null;};
 const tm=['#568b84','#ffffff','#101010','#686c6c','rgba(214,222,234,.5)','#3aa0ff'].map(TM);
 ok("tone(css,'mono'): grey·white·black·muddy all become 연지·주홍 shades (hue red, chroma ≥ .25), alpha kept",tm.every(q=>!!q&&RED(q.h)&&q.c>=.25)&&tm[4].a===.5,tm);
 ok("tone(css,'mono') keeps the brightness order (black < grey < white)",tm[2].l<tm[3].l&&tm[3].l<tm[1].l,[tm[2].l,tm[3].l,tm[1].l]);
 ok("tone(css) without a mode is unchanged by the mono cache (white stays white)",(()=>{const p=parse(api.tone('#ffffff'));return hsv(p[0],p[1],p[2]).c<.12;})());
 ok("tone('transparent','mono') and junk come back unchanged",api.tone('transparent','mono')==='transparent'&&api.tone(null,'mono')===null);
 // 실제 명령: 페르소나 그림은 mono, 같은 색의 EGO 형상 이펙트는 세 가지 색
 const W=world(undefined,{ego:true,persona:true});W.tick();const P=W.api;P.register(/persona-skills\/teal/,'red',{hue:172,chroma:.38,lum:.5});
 const pe=cmd('image','effect',{path:'assets/rc134/persona-skills/teal.png',style:{globalCompositeOperation:'source-over'}}),eg=cmd('image','effect',{path:'r106fx:orb:86.139.132:226.232.242'});
 const pl=cmd('stroke','effect',{owner:{id:'rc134:persona:ring'},style:{strokeStyle:'#d6deea'}}),el=cmd('stroke','effect',{style:{strokeStyle:'#d6deea'}});P.process([pe,eg,pl,el]);
 const qp=hsv(...applyFilter(pe.style.filter,[86,139,132])),qe=hsv(...applyFilter(eg.style.filter,[86,139,132]));
 ok('same muddy teal: persona sheet → 연지·주홍, EGO effect → grey',RED(qp.h)&&qp.c>=.3&&qe.c<.2,[pe.style.filter,eg.style.filter]);
 const lp=hsv(...parse(pl.style.strokeStyle)),le=hsv(...parse(el.style.strokeStyle));
 ok('same silver line: persona-owned (id 에 persona) → 연지빛, EGO → 백',tinted(pl)&&RED(lp.h)&&lp.c>=.25&&le.c<.12,[pl.style.strokeStyle,el.style.strokeStyle]);}
// 환도 영웅(사용자 2026-11-16 02:55Z "수묵이펙트 환도영웅은 적용해"): 환도의 이펙트는 먹 + 백('sumi'). 붉은색은 EGO·페르소나의 고유색이라 쓰지 않는다.
{const F=(r,g,b,blend)=>{const q=hsv(r,g,b),f=api.filterFor({hue:q.h,chroma:q.c,lum:lum(r,g,b),blend,mode:'sumi'}),o=applyFilter(f,[r,g,b]);return {f,o:o.map(Math.round),...hsv(...o),l:lum(...o)};};
 const gold=F(255,198,72,'lighter'),silver=F(214,222,234,'lighter'),dust=F(118,100,82,'source-over'),blue=F(60,140,255,'screen');
 ok("sumi filter: gold·silver·blue light → 백 (chroma < .12, no hue-rotate), brightness kept (≥ 90%)",[gold,silver,blue].every(q=>filterOk(q.f)&&q.c<.12&&!/hue-rotate/.test(q.f))&&gold.l>=.9*lum(255,198,72)&&silver.l>=.9*lum(214,222,234),[gold,silver,blue].map(q=>[q.f,q.o]));
 ok('sumi filter: dark source-over smoke·dust → 먹',dust.c<.08&&dust.l<.45,[dust.f,dust.o]);
 const TS=s=>{const p=parse(api.tone(s,'sumi'));return p?{...hsv(p[0],p[1],p[2]),l:lum(p[0],p[1],p[2]),a:p[3]}:null;};
 const ts=['#ffc648','#3aa0ff','#d12835','#101010','rgba(255,255,255,.4)'].map(TS);
 ok("tone(css,'sumi'): every colour becomes an ink-to-white grey (chroma < .12, 가장 어두운 쪽은 먹색 그대로), order kept, alpha kept",ts.every(q=>!!q&&(q.c<.12||q.l<.2))&&ts[3].l<ts[1].l&&ts[1].l<ts[4].l&&ts[4].a===.4,ts);
 const W=world(undefined,{ego:false,hero:'hwando'});W.tick();const P=W.api;
 const g=cmd('image','effect'),sl=cmd('image','effect',{path:'assets/r302/fx/hwando/basic.webp',style:{globalCompositeOperation:'screen'}}),ln=cmd('stroke','effect',{style:{strokeStyle:'#ffc648'}}),hz=cmd('fill','hazard',{style:{fillStyle:'rgba(255,214,140,0.3)'}}),en=cmd('image','effect',{owner:{enemy:true}}),af=cmd('image','effect',{path:'http://x/m0/assets/hero-authored-v314rc5/hwando-walk-atlas.png',style:{globalCompositeOperation:'source-over'}});
 const n=P.process([g,sl,ln,hz,en,af]);
 const qg=hsv(...applyFilter(g.style.filter,[255,198,72])),ql=hsv(...parse(ln.style.strokeStyle));
 ok('환도: effect images and lines are recoloured to 먹·백 (no red)',n===3&&tinted(g)&&tinted(sl)&&tinted(ln)&&qg.c<.12&&ql.c<.12&&!/hue-rotate/.test(g.style.filter+sl.style.filter),[n,g.style.filter,sl.style.filter,ln.style.strokeStyle]);
 ok('환도: 예고 표시·적 표식·잔상 stay as they are',!tinted(hz)&&!tinted(en)&&!tinted(af));
 ok('inspect() reports scope hwando',P.inspect().hwando===true&&P.inspect().ego===false,P.inspect());
 for(const h of ['neon','seoha','michaela','slayer','gunner','lauren']){const o=world(undefined,{ego:false,hero:h});o.tick();const c=cmd('image','effect');ok('other hero '+h+': still untouched',o.api.process([c])===0&&!tinted(c)&&o.api.inspect().hwando===false);}
 const E=world(undefined,{ego:true,hero:'hwando'});E.tick();const ge=cmd('image','effect');E.api.process([ge]);
 ok('환도 base + EGO 형상 → EGO palette wins (언주색, not sumi)',tinted(ge)&&RED(hsv(...applyFilter(ge.style.filter,[255,198,72])).h)&&E.api.inspect().hwando===false,ge.style.filter);
 const PR=world(undefined,{ego:false,hero:'hwando',persona:true});PR.tick();const po=cmd('image','effect',{path:'assets/rc134/persona-skills/small-orb.png',style:{globalCompositeOperation:'source-over'}});PR.api.register(/small-orb/,'red',{hue:270,chroma:.8,lum:.4});PR.api.process([po]);
 ok('환도 fighting the persona: persona sheets stay 언주색 단독',tinted(po)&&RED(hsv(...applyFilter(po.style.filter,[140,60,230])).h),po.style.filter);
 const NP=world(undefined,{ego:false,noPlayer:true});NP.tick();ok('no player yet → no throw, hwando false',!NP.err&&NP.api.inspect().hwando===false&&NP.api.inspect().errors===0);
 W.w.player.hero='seoha';W.tick();const c2=cmd('image','effect');ok('switching 환도 → 서하 mid-game switches it off',P.process([c2])===0&&!tinted(c2));}
// ---- ⑥ 켜고 끄기 ----
{const D=world();D.tick();ok('default: on and active when the map ink wash is live',D.api.enabled()===true&&D.api.active()===true,D.api.inspect());
 const off=world('0');off.tick();const c=cmd('image','effect');ok("stored '0': off, effect keeps its original colour",off.api.enabled()===false&&off.api.active()===false&&off.api.process([c])===0&&c.style.filter==='none'&&!tinted(c));
 for(const v of ['1','true','','junk','null']){const w=world(v);w.tick();ok('stored '+JSON.stringify(v)+' → still on (only "0" turns it off)',w.api.enabled()===true);}
 const th=world(undefined,{throws:true});th.tick();ok('storage that throws: loads, stays on, set() does not throw',!th.err&&th.api.enabled()===true&&(()=>{try{th.api.set(false);th.api.set(true);return true;}catch(_){return false;}})());
 const inkOff=world(undefined,{inkMode:'off'});inkOff.tick();const c2=cmd('image','effect'),c3=cmd('fill','effect',{style:{fillStyle:'#3aa0ff'}});
 ok('map ink wash off → original colours (끄면 원래 색)',inkOff.api.active()===false&&inkOff.api.process([c2,c3])===0&&c2.style.filter==='none'&&c3.style.fillStyle==='#3aa0ff');
 const rest=world(undefined,{inkK:0});rest.tick();ok('map ink wash resting (성능 1·2단계, k=0) → rests too',rest.api.active()===false);
 const none=world(undefined,{noInk:true});none.tick();ok('no R1055 module at all → inactive, no throw',!none.err&&none.api.active()===false);
 const nan=world(undefined,{inkK:NaN});nan.tick();ok('R1055 k = NaN → inactive',nan.api.active()===false);
 const live=world();live.tick();const c4=cmd('image','effect');live.ink.mode='off';live.tick();const a0=live.api.process([c4]);live.ink.mode='all';live.tick();const c5=cmd('image','effect');const a1=live.api.process([c5]);
 ok('follows the map ink wash live (끔 → 켬) without reload',a0===0&&a1===1&&!tinted(c4)&&tinted(c5));
 const S=world();S.tick();S.api.set(false);ok('set(false) stores "0" and stops',S.store.get(KEY)==='0'&&S.api.active()===false);S.api.set(true);ok('set(true) clears the key and resumes',!S.store.has(KEY)&&S.api.active()===true);
 ok('set() ignores non-booleans',S.api.set('no')===true&&S.api.set(0)===true&&S.api.set(null)===true&&S.api.enabled()===true);}
// ---- ⑦ 새 스킬·예외 등록 ----
{const N=world();N.tick();const P=N.api;
 const a=cmd('image','effect',{path:'r106fx:brandnew-shape:40.200.255:255.255.255',owner:{id:'r2000:new-skill:1'}}),b=cmd('image','effect',{path:'r108eden:smoke#120,90,255|255,198,72',owner:{id:'r2001:x'}}),c=cmd('stroke','effect',{owner:{id:'r2002:line'},style:{strokeStyle:'rgba(120,255,160,.8)'}});
 P.process([a,b,c]);
 const qa=hsv(...applyFilter(a.style.filter,[40,200,255])),qb=hsv(...applyFilter(b.style.filter,[120,90,255]));
 ok('a skill that did not exist before follows the palette automatically (image, colour read from the sprite key)',tinted(a)&&RED(qa.h),[a.style.filter,Math.round(qa.h)]);
 ok('other sprite-key spelling (r108eden … #r,g,b|r,g,b) is read too',tinted(b)&&RED(qb.h),[b.style.filter,Math.round(qb.h)]);
 ok('new skill stroke follows the palette',tinted(c)&&RED(hsv(...parse(c.style.strokeStyle)).h));
 const r1=P.register(/keepme/,'keep'),k=cmd('image','effect',{path:'assets/r2003/keepme-sheet.webp'}),k2=cmd('image','effect',{owner:{id:'r2003:keepme:1'}});P.process([k,k2]);
 ok("register(/…/,'keep') leaves that skill's own colours (경로·id 둘 다)",r1>=1&&!tinted(k)&&k.style.filter==='none'&&!tinted(k2));
 P.register(/whitecore/,'white');const w=cmd('image','effect',{path:'r106fx:whitecore:40.200.255:255.255.255'});P.process([w]);
 ok("register(/…/,'white') forces 백 (no hue-rotate, desaturated)",tinted(w)&&!/hue-rotate/.test(w.style.filter)&&hsv(...applyFilter(w.style.filter,[40,200,255])).c<.2,w.style.filter);
 P.register(/inkonly/,'ink');const i=cmd('image','effect',{path:'assets/r2004/inkonly.webp',style:{globalCompositeOperation:'source-over'}});P.process([i]);
 ok("register(/…/,'ink') forces 먹",tinted(i)&&(()=>{const o=applyFilter(i.style.filter,[200,160,90]);return hsv(...o).c<.08&&lum(...o)<.5;})(),i.style.filter);
 P.register(/redsheet/,'red',{hue:210,chroma:.8,lum:.6});const r=cmd('image','effect',{path:'assets/r2005/redsheet.webp'});P.process([r]);
 ok("register(/…/,'red',{hue}) tells the palette a sheet's source hue",tinted(r)&&RED(hsv(...applyFilter(r.style.filter,[0,128,255])).h),r.style.filter);
 let bad=0;for(const x of [[null,'keep'],[/a/,'nope'],['str','keep'],[/a/]]){try{const before=P.inspect().rules;P.register(...x);if(P.inspect().rules!==before)bad++;}catch(_){bad++;}}
 ok('register() ignores bad arguments without throwing',bad===0);}
// ---- ⑧ 렌더러 감싸기 ----
{const W=world();W.tick();const c=cmd('image','effect'),frame={commands:[c]};const r=W.inst.render(frame);
 ok('instance render: tinted before the base render, return value kept',r==='drawn'&&W.calls.base===1&&tinted(c)&&W.calls.last===frame);
 const before=W.api.inspect().frames;W.inst.render({commands:[cmd('image','effect')]});ok('one frame counted per render',W.api.inspect().frames===before+1);
 W.tick();W.tick();const c2=cmd('image','effect');W.inst.render({commands:[c2]});ok('re-ticking does not wrap twice',W.calls.base===3&&tinted(c2));
 const Pn=world(undefined,{instOwn:false});Pn.tick();const c3=cmd('image','effect');Pn.inst.render({commands:[c3]});ok('prototype render is wrapped too',tinted(c3)&&Pn.calls.base===1);
 const L=world(undefined,{lateInst:true});L.tick();L.w.__STORYWORLD_PHASE1__.controller.state.three=L.inst;L.tick();const c4=cmd('image','effect');L.inst.render({commands:[c4]});ok('renderer that appears later is picked up',tinted(c4)&&L.calls.base===1);
 const B=world(undefined,{baseThrows:true});B.tick();let msg='';try{B.inst.render({commands:[cmd('image','effect')]});}catch(e){msg=e.message;}ok('base render error passes through unchanged',msg==='base boom');
 const E=world();E.tick();const evil={get commands(){throw Error('evil frame');}};let r2=null,t=null;try{r2=E.inst.render(evil);}catch(e){t=e;}ok('our error never blocks the base render',!t&&r2==='drawn'&&E.api.inspect().errors>=1);
 ok('render(undefined) is fine',(()=>{try{return E.inst.render()==='drawn';}catch(_){return false;}})());}
// ---- ⑨ 설정 창 줄 ----
{const W=world();W.tick();const r=W.w.showSettings();W.flush();const row=W.w.document.getElementById('inkFxRowR1095'),box=W.w.document.getElementById('inkFxOnR1095'),host=W.w.document.getElementById('combatScreenR1021');
 ok('showSettings still returns the base value and adds one row',r==='base'&&!!row&&!!box&&row.parentNode===host);
 ok('row sits right after the 캐릭터 담묵 row',!!row&&host.children.indexOf(row)===host.children.indexOf(W.w.document.getElementById('inkCharsRowR1090'))+1,host.children.map(c=>c.id));
 ok('checkbox shows the state and toggles it',!!box&&box.checked===true&&(()=>{box.checked=false;box.onchange();const a=W.api.enabled()===false&&W.store.get(KEY)==='0';box.checked=true;box.onchange();return a&&W.api.enabled()===true;})());
 W.w.showSettings();W.flush();W.w.showSettings();W.flush();ok('opening settings again keeps exactly one row',W.docEl._all().filter(e=>e.id==='inkFxRowR1095').length===1);
 const text=row?row._all().map(e=>e.textContent).join(' '):'';ok('row text is Korean and mentions 이펙트',/이펙트/.test(text)&&/[가-힣]/.test(text),text);
 const N=world(undefined,{charsRow:false});N.tick();N.w.showSettings();N.flush();const host2=N.w.document.getElementById('combatScreenR1021');ok('no 캐릭터 담묵 row → placed after the 맵 수묵화풍 row',host2.children.map(c=>c.id).join()==='inkRowR1055,inkFxRowR1095',host2.children.map(c=>c.id));}
// ---- ⑩ 금지 사항 ----
ok('no new key input, no ctx.filter, no canvas blur/drop-shadow',!/addEventListener\(\s*['"]key/.test(src)&&!/ctx\.filter\s*=/.test(src)&&!/drop-shadow|blur\(/.test(src));
ok('does not touch combat state (hp·damage·cooldown·enemies·hazards)',!/\b(?:hp|damage|cooldown)\s*[-+*]?=[^=]/.test(src)&&!/room\.enemies|hazards\s*=/.test(src));
ok('no model identifier in the source',!/claude|opus|sonnet|fable|gpt|gemini/i.test(src));
done();
