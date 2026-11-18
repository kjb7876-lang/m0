// R1175 페르소나 라우렌 흔적 전수 제거 — 실패 먼저(사용자 2026-11-18 14:40Z "페르소나 쪽에 간간이 라우렌 이미지및 이펙트가 관련된거 나오는문제 이거 다 전수조사해서 확실히개선").
// 헤드리스 전수 조사(qa/r1175/audit.mjs, 환도 기준선과 비교)에서 페르소나에만 남던 라우렌 흔적:
//  A. R102 영웅 적중 그림(owner fx:N, 경로 'r102:lauren|…|lauren-stigma-puncture.webp'·'burst-impact.webp') — 색 그대로
//  B. 장면 소유(owner.kind 'scene') 라우렌 보라 r106fx(164.98.255…)·R302 라우렌 바이올렛 칠 캔버스 — 'effect' 만 보던 판정이 놓침
//  C. R409 테두리 복제가 영웅 소유로 다시 그린 픽셀 이펙트(pxf 아틀라스, 보라) — 영웅 소유는 막기 방벽만 보던 판정이 놓침
//  D. 안전망: 앞으로 새 라우렌 그림이 생겨도(경로에 lauren) 적·바닥이 아닌 명령이면 형상일 때 반드시 언주로
// 회귀: 적 이펙트·적 팔레트 상태 이펙트(R114)·환도에서도 보이는 장면 고리·형상 끔·몸 바꾸기는 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..'),FILE=path.join(ROOT,'client-source/persona-hero-r1113.js');
let fails=0;const TOASTS=[];const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const SRC=fs.readFileSync(FILE,'utf8');
const hooks=fs.readFileSync(path.join(ROOT,'client-source/ego-sovereign-r1046.js'),'utf8');
function el(id,attrs={},text=''){const a={...attrs};return {id,dataset:{},textContent:text,style:{_p:{},setProperty(k,v){this._p[k]=v;},getPropertyValue(k){return this._p[k]||'';}},
 getAttribute:k=>a[k]??null,setAttribute:(k,v)=>{a[k]=String(v);},get src(){return a.src;},set src(v){a.src=String(v);},get title(){return a.title;},set title(v){a.title=String(v);},_a:a};}
function world({pixels=true}={}){
 const images=[];let seen=null;const proto={render(frame){seen=frame.commands.map(c=>({...c,points:c.points&&c.points.map(p=>[...p]),style:c.style&&{...c.style}}));}};
 const E={attackIcon:el('attackIcon',{src:'a'}),blinkIcon:el('blinkIcon',{src:'b'}),guardIcon:el('guardIcon',{src:'g'}),specialIcon:el('specialIcon',{src:'s'}),egoIcon:el('egoIcon',{src:'e'}),specialLabel:el('specialLabel',{},'잔향 결계'),r376Pf:el('r376Pf'),
  'story-wer-w':el('story-wer-w',{title:'거짓 분리','aria-label':'거짓 분리 · W'}),'story-wer-e':el('story-wer-e',{title:'심문자의 전이','aria-label':'심문자의 전이 · E'}),'story-wer-r':el('story-wer-r',{title:'진명 심판','aria-label':'진명 심판 · R'}),heroName:el('heroName',{},'라우렌 · Lv.9'),portrait:el('portrait',{src:'x'})};
 const L={w:'./assets/vfx/heroes/lauren-w.webp',e:'./assets/vfx/heroes/lauren-e.webp',r:'./assets/r911/clean/assets/vfx/heroes/lauren-r.webp'},T={w:'거짓 분리',e:'심문자의 전이',r:'진명 심판'};
 const im={w:el('wimg',{src:L.w}),e:el('eimg',{src:L.e}),r:el('rimg',{src:L.r})};
 const sel={'#story-wer-w img':im.w,'#story-wer-e img':im.e,'#story-wer-r img':im.r};
 const stat={get:0};
 const mkCanvas=()=>({tagName:'canvas',width:0,height:0,getContext(){const cv=this;return {drawImage(img){cv._from=img;},fillRect(){},clearRect(){},createRadialGradient:()=>({addColorStop(){}}),
   getImageData(){stat.get++;if(!pixels)throw new Error('no pixels');const s=cv._from;if(!s||s._taint)throw new Error('tainted');return {data:new Uint8ClampedArray(s._pixels),width:cv.width,height:cv.height};},putImageData(d){cv._pixels=d.data;}};},
   toDataURL(){return 'data:image/png;base64,'+(this.__id||'ICON');}});
 const document={createElement:t=>t==='canvas'?mkCanvas():{tagName:t},baseURI:'http://x/m0/',getElementById:id=>E[id]||null,querySelector:s=>sel[s]||null,querySelectorAll:()=>[],addEventListener(){},head:{appendChild(){}}};
 class Img{constructor(){images.push(this);}set src(v){this._src=v;}get src(){return this._src;}}
 const player={hero:'lauren',x:10,y:10,hp:100,direction:'front',attackAnim:0,skillAnim:0,ultimateAnim:0};
 const C={Math,Number,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Error,URL,console,Date,Uint8ClampedArray,time:0,player,room:{id:'cult04'},loading:false,storyScene:null,modal:false,started:true,
  zoom:1,actorHeight:()=>66,project:(x,y)=>({x:500+(x-y)*16,y:300+(x+y)*8}),toast:t=>{TOASTS.push(t);},HEROES:{lauren:{name:'라우렌'}},
  setInterval:()=>0,setTimeout:()=>0,StoryPhase1:{ThreeRenderer:{prototype:proto}},document,Image:Img,localStorage:{getItem:()=>null,setItem(){}}};
 // 엔진 updateHUD(index.html 6024줄과 같은 일): 매번 라우렌 아이콘·제목을 다시 쓴다
 C.updateHUD=function(){for(const s of ['w','e','r']){const b=E['story-wer-'+s];if(im[s].getAttribute('src')!==L[s])im[s].src=L[s];b.title=T[s];b.setAttribute('aria-label',T[s]+' · '+s.toUpperCase());}return 'hud';};
 C.hudW={};C.setHudTextR63R2=(id,v)=>{C.hudW[id]=String(v);};C.tick=function(){};C.serializeSave=()=>({player:{}});C.restoreSave=async()=>{};C.__STORYWORLD_CHEAT777__={active:()=>true};
 C.window=C;vm.createContext(C);vm.runInContext(hooks,C);vm.runInContext(SRC,C);
 const load=()=>{for(const i of images)if(i._src&&!i._done&&i.onload){i._done=true;const s=i._src;i.naturalWidth=/walk/.test(s)?4096:/persona-idle/.test(s)?1152:/lance-flight/.test(s)?3072:/lance-contact/.test(s)?2304:/flight/.test(s)?2048:/contact/.test(s)?1536:344;i.naturalHeight=/walk/.test(s)?512:/lance/.test(s)?384:/r1119|persona-idle/.test(s)?256:400;i._pixels=new Uint8ClampedArray(4);i.onload();}};
 const frame=cmds=>{C.time+=.016;proto.render.call({}, {commands:cmds});return seen;};
 return {C,E,im,L,T,player,frame,load,stat,api:()=>C.__STORYWORLD_PERSONA_HERO_R1113__};}
const Q=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const body=()=>({kind:'image',key:'hero:2:0',order:5,owner:{id:'hero:2',kind:'hero'},sourcePath:'http://x/m0/assets/r130/lauren/idle-s.webp',sourceRect:[0,0,192,463],style:{filter:'none'},points:Q(480,240,26,61)});
const px=(w,h,rgba)=>{const d=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++)d.set(rgba,i*4);return d;};
const img=(w,h,rgba,extra={})=>({width:w,height:h,naturalWidth:w,naturalHeight:h,_pixels:px(w,h,rgba),...extra});
const fx=(id,sp,image,extra={})=>({kind:'image',key:id+':0',order:9,owner:{id,kind:'effect',...(extra.owner||{})},sourcePath:sp,image,sourceRect:[0,0,image?.width||8,image?.height||8],imageSize:[image?.width||8,image?.height||8],style:{filter:'none',globalAlpha:.8,globalCompositeOperation:'lighter',...(extra.style||{})},points:Q(400,200,40,40),...(extra.cmd||{})});
const hue=c=>/hue-rotate/.test(c?.style?.filter||'');
const A=w=>w.api();
const on=w=>{A(w).unlock('silent');A(w).setForm(true);w.frame([body()]);w.load();};


const done=c=>!!(c&&(c.r1113tint||c.r1113));
const colored=c=>done(c)&&(/^r1140:|^r1113:/.test(String(c.sourcePath||''))||/hue-rotate|grayscale/.test(String(c.style?.filter||'')));
const VI=[164,98,255,255];
function run(cmds,{form=true}={}){const w=world();if(form)on(w);else{A(w).unlock('silent');A(w).setForm(false);}
 let out=w.frame([body(),...cmds()]);w.load();out=w.frame([body(),...cmds()]);for(let i=0;i<4;i++)out=w.frame([body(),...cmds()]);return out.slice(1);}
// A
{const o=run(()=>[fx('fx:25','r102:lauren|0|assets/vfx/generated/v31307/hero-impacts/lauren-stigma-puncture.webp',img(8,8,VI)),fx('fx:36','r102:lauren|0|assets/vfx/generated/v300/burst-impact.webp',img(8,8,VI),{style:{globalCompositeOperation:'screen'}})]);
 ok(colored(o[0]),'A R102 라우렌 적중 그림(stigma-puncture) → 언주 ('+o[0].sourcePath+' / '+o[0].style?.filter+')');
 ok(colored(o[1]),'A R102 라우렌 터짐 그림(burst-impact) → 언주 ('+o[1].sourcePath+')');
 ok(o[1].style.globalCompositeOperation==='screen'&&o[1].style.globalAlpha===.8,'A 섞기·투명도 그대로');}
// B
{const sc=(sp,image)=>({...fx('scene',sp,image),owner:{id:'scene',kind:'scene',groundAligned:false}});
 const r302=img(8,8,VI,{__r302Path:'r302-tint'});
 const o=run(()=>[sc('r106fx:cross:164.98.255:226.232.242',img(8,8,VI)),sc('',r302),sc('r106fx:ring:51.70.84:80.166.230',img(8,8,[80,166,230,255]))]);
 ok(colored(o[0]),'B 장면 소유 라우렌 보라 r106fx → 언주 ('+o[0].sourcePath+')');
 ok(colored(o[1]),'B 장면 소유 R302 라우렌 바이올렛 칠 캔버스 → 언주');
 ok(!done(o[2])&&o[2].sourcePath==='r106fx:ring:51.70.84:80.166.230'&&o[2].style.filter==='none','B 회귀: 환도에서도 보이는 장면 고리(51.70.84)는 그대로');}
// C
{const oc=(sp)=>({...fx('r61:hero:player',sp,img(8,8,VI)),owner:{id:'r61:hero:player',kind:'hero',alive:true}});
 const o=run(()=>[oc('r409:outline:hero:u:http://x/m0/assets/pxf-additional-baked-20261010/extra-08-atlas.png:78,10,48,48:6:hero:lauren'),oc('r409:outline:hero:u:http://x/m0/assets/ailments-r1/fire.webp:0,0,8,8:6:hero:lauren')]);
 ok(colored(o[0]),'C R409 테두리 복제의 영웅 픽셀 이펙트(pxf 아틀라스) → 언주 ('+o[0].sourcePath+')');
 ok(!done(o[1])||true,'C 상태이상 테두리(불)는 판정 대상 아님(바뀌어도 무방)');}
// D 안전망
{const o=run(()=>[fx('r999:new','http://x/m0/assets/r999/fx-lauren-orb.webp',img(8,8,VI)),{...fx('p:1','assets/vfx/heroes/lauren-w.webp',img(8,8,VI)),owner:{id:'p:1',kind:'projectile'}},
  {...fx('e:1','http://x/m0/assets/r999/lauren/new-orb.webp',img(8,8,VI)),owner:{id:'e:1',kind:'effect',side:'enemy'}},{...fx('mob','http://x/m0/assets/r999/lauren/mob.webp',img(8,8,VI)),owner:{id:'mob',kind:'enemy'}}]);
 ok(colored(o[0]),'D 안전망: 새 라우렌 경로 이펙트 → 언주 ('+o[0].sourcePath+')');
 ok(colored(o[1]),'D 안전망: 라우렌 경로 탄(projectile) → 언주 ('+o[1].sourcePath+')');
 ok(!done(o[2])&&!done(o[3]),'D 회귀: 적 쪽(side enemy·kind enemy)은 그대로');}
// 회귀: R114 적 팔레트 상태 이펙트, 형상 끔
{const st={...fx('final42-r88:native-status:247:F247','http://x/m0/assets/final42-r88/effects/247/atlas.png#r114-tint-0-96-255-230-118-97',img(8,8,[0,96,255,255])),owner:{id:'final42-r88:native-status:247:F247',kind:'effect',r88Final42:true}};
 const o=run(()=>[{...st,owner:{...st.owner}}]);ok(!done(o[0])&&o[0].style.filter==='none','회귀: 적 팔레트(R114) 상태 이펙트는 그대로');}
{const o=run(()=>[fx('fx:25','r102:lauren|0|assets/vfx/generated/v31307/hero-impacts/lauren-stigma-puncture.webp',img(8,8,VI)),{...fx('scene','r106fx:cross:164.98.255:226.232.242',img(8,8,VI)),owner:{id:'scene',kind:'scene'}},fx('r999:new','http://x/m0/assets/r999/lauren/new-orb.webp',img(8,8,VI))],{form:false});
 ok(o.every(c=>!done(c)&&c.style.filter==='none'),'회귀: 형상 끄면(라우렌 본인) 모두 그대로');}
{const w=world();on(w);w.frame([body()]);w.load();const o=w.frame([body()]);ok(o[0].r1113===true&&/^r1113:/.test(o[0].sourcePath),'회귀: 몸은 페르소나 그림 ('+o[0].sourcePath+')');}
// E 무한생존 배치 페르소나(조종 영웅은 환도): 배치 몸이 남긴 라우렌 탄·적중·스킬 그림도 언주, 환도 것은 그대로
{const w=world();A(w).unlock('silent');w.player.hero='hwando';w.C.__STORYWORLD_HERO_DEFENSE_R720__={has:id=>id==='persona'};
 const mk=()=>[fx('fx:25','r102:lauren|0|assets/vfx/generated/v31307/hero-impacts/lauren-stigma-puncture.webp',img(8,8,VI)),fx('r561:well:3.2:front','http://x/m0/assets/r561/lauren/lauren-gravity-well-front.webp',img(8,8,VI)),
  fx('r106d2s:4','r106fx:cross:164.98.255:226.232.242',img(8,8,VI)),fx('fx:7','http://x/m0/assets/r130/hwando/slash.webp',img(8,8,[230,230,240,255])),fx('fx:8','',img(8,8,[230,230,240,255],{__r302Path:'r302-tint'})),
  {...fx('e:1','r102:lauren|0|assets/x/lauren-stigma-puncture.webp',img(8,8,VI)),owner:{id:'e:1',kind:'effect',side:'enemy'}}];
 let o;for(let i=0;i<6;i++){o=w.frame(mk());w.load();}
 ok(colored(o[0])&&colored(o[1])&&colored(o[2]),'E 배치 페르소나: 라우렌 적중·중력 우물·라우렌 보라 조각 → 언주 ('+[o[0],o[1],o[2]].map(c=>String(c.sourcePath).slice(0,40)).join(' | ')+')');
 ok(!done(o[3])&&!done(o[4])&&o[3].style.filter==='none'&&o[4].style.filter==='none','E 회귀: 조종 영웅(환도) 이펙트·R302 칠은 그대로');
 ok(!done(o[5]),'E 회귀: 적 쪽은 그대로');
 w.C.__STORYWORLD_HERO_DEFENSE_R720__={has:()=>false};const o2=w.frame(mk());ok(o2.every(c=>!done(c)),'E 회귀: 배치 페르소나가 없으면 아무것도 안 바꿈');}
{const w=world();A(w).unlock('silent');A(w).setForm(false);w.player.hero='lauren';w.C.__STORYWORLD_HERO_DEFENSE_R720__={has:id=>id==='persona'||id==='lauren'};
 const o=w.frame([fx('fx:25','r102:lauren|0|assets/vfx/generated/v31307/hero-impacts/lauren-stigma-puncture.webp',img(8,8,VI))]);ok(!done(o[0]),'E 회귀: 조종 영웅이 라우렌 본인이면 라우렌 그림은 그대로');}
// F 화면 알림: 스킬 습득 알림(R663 'R 스킬 습득 · 진명 심판 …')에 라우렌 기술 이름이 그대로 → 형상일 때 페르소나 이름
{TOASTS.length=0;const w=world();on(w);for(let i=0;i<3;i++)w.frame([body()]);
 const run=w.C.__ui||null;try{vm.runInContext('void 0',w.C);}catch(_){}
 const wr=()=>{try{const f=vm.runInContext('typeof toast==="function"?toast:null',w.C);return f;}catch(_){return null;}};
 A(w).refresh();for(let i=0;i<3;i++)w.frame([body()]);const T=wr();
 if(T){T('R 스킬 습득 · 진명 심판 (피해 ×1.5 · 범위 ×1.3 · 재사용 ×1.5)',3);T('Q 스킬 습득 · 잔향 결계',3);T('W 스킬 습득 · 거짓 분리',3);T('일반 알림 · 환도',3);}
 const got=TOASTS;ok(got[0]==='R 스킬 습득 · 악의의 관통 (피해 ×1.5 · 범위 ×1.3 · 재사용 ×1.5)','F R 습득 알림 → 악의의 관통 ('+got[0]+')');
 ok(got[1]==='Q 스킬 습득 · 내면의 소용돌이'&&got[2]==='W 스킬 습득 · 순수악의의 분기','F Q·W 습득 알림 ('+got[1]+' / '+got[2]+')');
 ok(got[3]==='일반 알림 · 환도','F 회귀: 상관없는 알림 그대로');
 A(w).setForm(false);if(T)T('R 스킬 습득 · 진명 심판',3);ok(got[4]==='R 스킬 습득 · 진명 심판','F 회귀: 형상 끄면(라우렌 본인) 그대로 ('+got[4]+')');}
// CI 연결
{const yml=fs.readFileSync(path.join(ROOT,'../.github/workflows/pages.yml'),'utf8');ok(yml.includes('node r96/qa/r1175/r1175-cpu-check.cjs'),'CI: pages.yml 검사 줄');
 const rt=fs.readFileSync(path.join(ROOT,'runtime-text/persona-hero-r1113.js'),'utf8');ok(rt===SRC,'runtime-text 사본 = client-source');}
console.log(fails?('FAILED '+fails):'ALL PASS');process.exit(fails?1:0);
