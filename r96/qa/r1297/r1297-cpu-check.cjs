// R1297 CPU 검사 (사용자 2026-11-21 12:35Z "에고오라이펙트 너무 밝게나옴 반투명하게 그리고 스킬적중이펙트 더 투명하게").
//  A. EGO 오라(R1039 r111:ego-back 뒤 3겹 → R1286 영웅색 구름 / 미카엘라 R1041 M3): 같은 그림을 불투명 2겹 + 'lighter' 1겹으로 겹쳐 그려 하얗게 떴다.
//     → 한 겹만, 보통 합성(source-over)으로, 알파 .45배. 다른 주인·다른 그림은 그대로. 끄기 storyworld.r1286.egoFx=off 면 예전 그대로.
//  B. 적중·시전 이펙트(R1271) 기본 불투명도 .6 → .4, 이미 저장된 슬라이더 값은 한 번만 2/3배(하한 .2).
//  그리기 알파만 바꾼다 — 판정·피해·쿨다운은 그대로. 실제 화면은 qa/r1297/r1297-browser.mjs(헤드리스, GPU 미검증).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let pass=0,fail=0;const ok=(n,c,info)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,info===undefined?'':JSON.stringify(info).slice(0,400));}};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
ok('CI runs this check',/node r96\/qa\/r1297\/r1297-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
for(const f of ['ego-cloud-r1286.js','hit-translucent-r1271.js'])ok(f+' runtime copy matches source',rd('client-source/'+f)===rd('runtime-text/'+f));

// ---------- A. EGO 오라 ----------
const SRC=rd('client-source/ego-cloud-r1286.js');
function env(o={}){
 const store={...(o.store||{})};const pushed=[];let T=10;
 const img=(w,h)=>({width:w,height:h,naturalWidth:w,naturalHeight:h,complete:true});
 const ready={'assets/r1286/ego-cloud-on.webp':img(2304,384),'assets/r1286/ego-cloud-loop.webp':img(3840,384)};
 const g={console,Math,Date,Number,String,Object,Array,JSON,Map,WeakMap,Set,WeakSet,Error,isFinite,parseFloat,Uint8ClampedArray,Promise,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},setTimeout:()=>0,setInterval:()=>0,clearInterval:()=>{},
  document:{createElement:()=>({width:0,height:0,getContext:()=>({drawImage(){},getImageData:(x,y,w,h)=>{const d=new Uint8ClampedArray(w*h*4).fill(200);return {data:d};},putImageData(){}})})},
  readyImage:p=>ready[p]?{image:ready[p]}:null,addImage:()=>{},
  player:{x:5,y:6,hero:o.hero||'slayer',hp:500,ego:3,egoCD:6,...(o.player||{})},room:{enemies:[]}};
 Object.defineProperty(g,'time',{get:()=>T,set:v=>{T=v;}});g.window=g;g.globalThis=g;
 g.__STORYWORLD_HERO_FX_R102__={PALETTE:{slayer:{a:[222,22,52],b:[220,226,236]},michaela:{a:[178,26,62],b:[220,226,236]}}};
 g.__STORYWORLD_PIXELFX_R163__=Object.freeze({play:()=>({})});g.ego=function(){};g.hurt=function(){};
 // 엔진 DrawCommands 흉내: push 순간의 globalAlpha·합성을 style 로 남긴다(엔진과 같음)
 class DC{constructor(){this.commands=[];this.owner={};this.globalAlpha=1;this.globalCompositeOperation='source-over';}
  push(kind,data){if(this.globalAlpha<=0)return;const c={kind,owner:{...this.owner},...data,style:{globalAlpha:this.globalAlpha,globalCompositeOperation:this.globalCompositeOperation}};pushed.push(c);this.commands.push(c);}}
 g.StoryPhase1={DrawCommands:DC};
 vm.createContext(g);vm.runInContext(SRC,g);try{g.__STORYWORLD_EGO_CLOUD_R1286__.arm();}catch(e){console.log('arm',e.message);}
 return {g,pushed,DC,step:dt=>{T+=dt;}};
}
const quad=[[0,0],[100,0],[100,100],[0,100]];
// R1039 paintEgo 뒤 층 그대로: 같은 오라 칸을 (1, source-over) (.8, source-over) (.75, lighter) 세 번
function backLayers(E,d,pathName,o={}){const base=o.alpha??1;d.owner={id:o.id||'r111:ego-back',kind:'effect',x:o.x??5,y:o.y??6};const n0=E.pushed.length;
 for(const [a,blend] of [[1,'source-over'],[.8,'source-over'],[.75,'lighter']]){d.globalAlpha=base*a;d.globalCompositeOperation=blend;d.push('image',{image:{},sourcePath:pathName,points:quad.map(p=>p.slice())});}
 return {out:E.pushed.slice(n0),after:{a:d.globalAlpha,b:d.globalCompositeOperation}};}
const auraOK=c=>c&&c.style.globalAlpha>=.3&&c.style.globalAlpha<=.5&&c.style.globalCompositeOperation==='source-over';
for(const hero of ['slayer','hwando','gunner']){const E=env({hero});const d=new E.DC();const {out,after}=backLayers(E,d,'assets/r100/sig-aura-red.webp');
 ok('A '+hero+' EGO aura: one layer only (was 3 stacked)',out.length===1,out.map(c=>c.style));
 ok('A '+hero+' EGO aura: translucent (.3~.5) and normal blend (no lighter glare)',auraOK(out[0]),out[0]&&out[0].style);
 ok('A '+hero+' still the R1286 hero-colour cloud',out[0]&&/^r1286:cloud:/.test(out[0].sourcePath),out[0]&&out[0].sourcePath);
 ok('A '+hero+' recorder alpha/blend restored after push',after.a===.75&&after.b==='lighter',after);}
{const E=env();const d1=new E.DC();backLayers(E,d1,'assets/r100/sig-aura-red.webp');E.step(1/60);const d2=new E.DC();const {out}=backLayers(E,d2,'assets/r100/sig-aura-red.webp');
 ok('A next frame (new command list) draws the aura again (never vanishes)',out.length===1&&auraOK(out[0]));}
{const E=env();const d=new E.DC();backLayers(E,d,'assets/r100/sig-aura-red.webp');const {out}=backLayers(E,d,'assets/r100/sig-aura-red.webp',{x:9,y:2});
 ok('A boundary: second hero (other spot) in same frame keeps its own one layer',out.length===1,out.length);}
{const E=env();const d=new E.DC();const {out}=backLayers(E,d,'assets/r100/sig-aura-red.webp',{alpha:.5});
 ok('A boundary: already-faded aura gets fainter, never brighter',out.length===1&&out[0].style.globalAlpha<=.25+1e-9&&out[0].style.globalAlpha>0,out[0]&&out[0].style);}
// 미카엘라: R1286 은 원본을 넘기고 R1041 이 M3 로 바꾼다(감싸기 순서는 어느 쪽이든) → 두 경로 모두 한 겹·반투명
{const E=env({hero:'michaela'});const d=new E.DC();const {out}=backLayers(E,d,'assets/r100/sig-aura-magenta.webp');
 ok('A michaela (R1286 outer) aura: one translucent layer, own sheet path kept',out.length===1&&auraOK(out[0])&&out[0].sourcePath==='assets/r100/sig-aura-magenta.webp',out.map(c=>[c.sourcePath,c.style]));}
{const E=env({hero:'michaela'});const d=new E.DC();const {out}=backLayers(E,d,'assets/r1041/fx-m3-michaela-ego-loop.webp');
 ok('A michaela (R1041 outer, M3 sheet) aura: one translucent layer',out.length===1&&auraOK(out[0]),out.map(c=>c.style));}
// 회귀: 다른 주인·다른 그림은 그대로
{const E=env({hero:'hwando'});const d=new E.DC();d.owner={id:'r101:aura-back:hero',kind:'effect'};d.globalAlpha=1;d.globalCompositeOperation='lighter';d.push('image',{image:{},sourcePath:'assets/r100/sig-aura-pale.webp',points:quad.map(p=>p.slice())});d.push('image',{image:{},sourcePath:'assets/r100/sig-aura-pale.webp',points:quad.map(p=>p.slice())});
 ok('A regression: other owners untouched (alpha/blend/count)',E.pushed.length===2&&E.pushed.every(c=>c.style.globalAlpha===1&&c.style.globalCompositeOperation==='lighter'));}
{const E=env();const d=new E.DC();d.owner={id:'r111:ego-back',kind:'effect',x:5,y:6};d.push('fill',{paths:[]});d.push('image',{image:{},sourcePath:'assets/pixelfx/dark-explosion.webp',points:quad});
 ok('A regression: non-aura draws in ego-back untouched',E.pushed.length===2&&E.pushed.every(c=>c.style.globalAlpha===1));}
{const E=env({store:{'storyworld.r1286.egoFx':'off'}});const d=new E.DC();const {out}=backLayers(E,d,'assets/r100/sig-aura-red.webp');
 ok('A off switch → original 3 layers as before',out.length===3&&out[0].style.globalAlpha===1&&out[2].style.globalCompositeOperation==='lighter');}
{const E=env();const s=E.g.__STORYWORLD_EGO_CLOUD_R1286__.inspect();ok('A inspect reports aura alpha + layers cut',typeof s.auraAlpha==='number'&&'auraLayersCut' in s.stats,s);}
ok('A no damage/cooldown/hp writes',!/\.(egoCD|resonance|damage)\s*[-+*]?=[^=]/.test(SRC)&&!/player\.hp\s*=[^=]/.test(SRC));

// ---------- B. 적중 이펙트 ----------
const HSRC=rd('client-source/hit-translucent-r1271.js');
function hload(saved){const win={},ctx={globalAlpha:1},seen=[],store={};if(saved!==undefined)store['storyworld.r1271.hitAlpha']=JSON.stringify(saved);
 const sb={window:win,store,localStorage:{getItem:k=>store[k]??null,setItem(k,v){store[k]=v;}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,WeakSet,String,isFinite,console,
  document:{readyState:'complete',querySelector:()=>null,getElementById:()=>null},showSettings:undefined,addEventListener(){},setInterval(){},ctx};
 sb.StoryPhase1={ThreeRenderer:function(){}};sb.StoryPhase1.ThreeRenderer.prototype.render=function(){};
 sb.drawEffect=function(e){seen.push({type:e.type,a:ctx.globalAlpha});};vm.createContext(sb);vm.runInContext(HSRC,sb);return {A:win.__STORYWORLD_HIT_TRANSLUCENT_R1271__,sb,ctx,seen,store};}
{const {A,sb,ctx,seen}=hload();ok('B default hit opacity .4 (was .6)',Math.abs(A.level()-.4)<1e-9,A.level());
 for(const t of ['burst','slash','e568HeroImpact','r912hit','heroHit','playerHitR43']){ctx.globalAlpha=1;sb.drawEffect({type:t,size:1});ok('B '+t+' drawn at ≤ .4',seen.at(-1).a<=.4+1e-9&&seen.at(-1).a>=.2,seen.at(-1).a);}
 ctx.globalAlpha=1;sb.drawEffect({type:'burst',size:2.4});ok('B big covering hit fx ≤ .3 but visible (≥ .2)',seen.at(-1).a<=.3+1e-9&&seen.at(-1).a>=.2,seen.at(-1).a);
 ctx.globalAlpha=1;sb.drawEffect({type:'damageText',size:1});ok('B regression: damage text untouched',seen.at(-1).a===1);}
{const {A,store}=hload({level:.6});ok('B saved slider .6 (old default) → .4 once',Math.abs(A.level()-.4)<1e-9,A.level());ok('B migration remembered in storage',/1297/.test(store['storyworld.r1271.hitAlpha']||''),store);}
{const s=JSON.stringify({level:.4,cut1297:true});const {A}=hload(JSON.parse(s));ok('B boundary: already-migrated value not cut again',Math.abs(A.level()-.4)<1e-9,A.level());}
{const {A}=hload({level:.25});ok('B boundary: low saved value floors at .2 (never vanishes)',A.level()>=.2-1e-9&&A.level()<=.25,A.level());}
{const {A}=hload({on:false});const {sb,ctx,seen}=hload({on:false});ctx.globalAlpha=1;sb.drawEffect({type:'burst',size:1});ok('B off switch still restores old look',seen[0].a===1);}
{const {A}=hload();A.set({level:.9});ok('B user can still raise it with the slider (.9 kept)',Math.abs(A.level()-.9)<1e-9,A.level());}
console.log(JSON.stringify({pass,fail}));process.exit(fail?1:0);
