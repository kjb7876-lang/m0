// R1033 CPU 검사: 세 번째 특수 패시브 컷인(passive-cutin-r1033.js) — 브라우저 없이 실제 모듈을 아주 작은 가짜 DOM 에서 돌린다.
//  사용자 2026-11-14 12:06Z "삼협묵희 환도 확률발동패시브하면 3명컷씬나오잖아 … 나머지영웅들도 확률발동패시브 3번째스킬 발동되면 그런컷씬나오게".
//  ① 7영웅 세 번째 패시브(R1025 해금 3단과 같은 종류)에서만 컷인, 1·2단은 안 띄움 ② 영웅마다 그 패시브에 실제로 나오는 인물·그림(헌터=슬레이어+헌터 분신,
//  기억사수=불려 온 기계 보스, 서하=아르벨리아) ③ 배치·소환 몸·대화창·서사 장면·끔에서는 안 띄움 ④ 빈도 제한(스토리 8초, 무한생존 20초) ⑤ 이상한 값(NaN 시각·
//  쓰레기 경로)에도 멈추지 않음 ⑥ 각 패시브 모듈의 발동 자리에 한 줄 연결, 환도 컷인도 같은 끄기를 따름 ⑦ 그림 파일·태그·sync·공개 확인·CI 연결.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..','..'),CS=path.join(root,'client-source'),FILE=path.join(CS,'passive-cutin-r1033.js');
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name+(ok||detail===''?'':' :: '+String(detail).slice(0,300)));};
const done=()=>{const failed=results.filter(r=>!r.ok).length;console.log(JSON.stringify({total:results.length,failed,method:'node vm + tiny fake DOM; real game run by r1033-browser.mjs (headless)'}));process.exit(failed?1:0);};
check('passive-cutin-r1033.js 있음',fs.existsSync(FILE));if(!fs.existsSync(FILE))done();
const src=fs.readFileSync(FILE,'utf8');
// ---- 아주 작은 가짜 DOM ----
class El{constructor(tag,doc){this.tagName=String(tag).toUpperCase();this.doc=doc;this.children=[];this.parentNode=null;this.attrs={};this.style={setProperty:(k,v)=>{this.style[k]=v;}};this.textContent='';this.offsetWidth=10;
 const c=new Set();this.cls=c;this.classList={add:(...a)=>a.forEach(x=>c.add(x)),remove:(...a)=>a.forEach(x=>c.delete(x)),contains:x=>c.has(x),toggle:(x,v)=>{const w=v===undefined?!c.has(x):!!v;w?c.add(x):c.delete(x);return w;}};}
 get id(){return this.attrs.id||'';}set id(v){this.attrs.id=String(v);}
 get className(){return [...this.cls].join(' ');}set className(v){this.cls.clear();String(v).split(/\s+/).filter(Boolean).forEach(x=>this.cls.add(x));}
 get firstChild(){return this.children[0]||null;}
 setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return k in this.attrs?this.attrs[k]:null;}removeAttribute(k){delete this.attrs[k];}
 appendChild(x){if(x.parentNode)x.parentNode.removeChild(x);x.parentNode=this;this.children.push(x);return x;}
 removeChild(x){this.children=this.children.filter(y=>y!==x);x.parentNode=null;return x;}
 all(){const o=[];const w=e=>{for(const c of e.children){o.push(c);w(c);}};w(this);return o;}
 addEventListener(){}}
function makeDoc(){const d={readyState:'complete',hidden:false};d.head=new El('head',d);d.body=new El('body',d);d.createElement=t=>new El(t,d);
 d.getElementById=id=>[...d.head.all(),...d.body.all()].find(e=>e.id===id)||null;return d;}
// ---- 가짜 게임 ----
function make({ls={},survival=false,noDoc=false}={}){const store={...ls},doc=noDoc?undefined:makeDoc();const timers=[];let now=1000;
 const sb={console,Math,JSON,Number,Array,Object,String,Set,Map,WeakMap,Boolean,Date,Promise,Error,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}},
  setTimeout:(f,ms)=>{timers.push({f,at:now+ms/1000});return timers.length;},clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},
  performance:{now:()=>now*1000},modal:null,storyScene:null,player:{hero:'slayer',x:5,y:5,hp:100},showSettings:function(){sb.__settings=(sb.__settings||0)+1;}};
 if(doc)sb.document=doc;sb.window=sb;sb.addEventListener=(n,f)=>{if(n==='load')sb.__load=f;};
 sb.__STORYWORLD_SURVIVAL_R600__={here:()=>survival};
 vm.createContext(sb);vm.runInContext(src,sb,{filename:'passive-cutin-r1033.js'});if(sb.__load)sb.__load();
 const api=sb.__STORYWORLD_PASSIVE_CUTIN_R1033__;
 const adv=s=>{now+=s;for(const t of timers.splice(0))if(t.at<=now)t.f();else timers.push(t);};
 const el=()=>doc&&doc.getElementById('r1033Cutin');
 const figs=()=>{const e=el();if(!e)return [];return e.all().filter(x=>x.getAttribute('data-fig')).map(x=>({fig:x.getAttribute('data-fig'),src:x.getAttribute('src')||x.getAttribute('data-src')||''}));};
 return {sb,api,doc,store,adv,el,figs,setNow:v=>{now=v;}};}
let E=make();const A=E.api;
check('공개 객체 __STORYWORLD_PASSIVE_CUTIN_R1033__',A&&typeof A.fire==='function'&&typeof A.inspect==='function'&&typeof A.allow==='function'&&typeof A.set==='function');
if(!A)done();
// ① 세 번째 패시브 표 = R1025 해금 3단
{const u=fs.readFileSync(path.join(CS,'passive-unlock-r1025.js'),'utf8'),m=/const TIERS=Object\.freeze\(\{([^]*?)\}\);/.exec(u);const want={};
 for(const x of m[1].matchAll(/(\w+):T\(\[([^\]]*)\],\[([^\]]*)\],\[([^\]]*)\]\)/g))want[x[1]]=x[4].split(',').map(s=>s.trim().replace(/'/g,''));
 const got=A.table();let same=true;for(const h of ['seoha','hunter','slayer','michaela','gunner','lauren','neon'])if(JSON.stringify(got[h])!==JSON.stringify(want[h]))same=false;
 check('① 영웅별 세 번째 패시브 = R1025 해금 3단(7영웅, 환도는 자기 컷인)',same&&!got.hwando,JSON.stringify({got,want}));}
const FIRE=[['slayer','lattice'],['michaela','bloom'],['lauren','meteor'],['lauren','violet'],['neon','storm'],['seoha','arbelia',{art:['assets/generated-v31224/actors-normalized/b9b65cd61430_arvelia_delay_archon.webp']}],
 ['hunter','squad',{heroes:['slayer','hunter','hunter','hunter','hunter']}],['gunner','summon',{art:['assets/a/u1.webp','assets/a/u2.webp','assets/a/u3.webp']}]];
for(const [h,k,x] of FIRE){const e=make();e.sb.player.hero=h;const ok=e.api.fire(h,k,e.sb.player,x);const el=e.el(),f=e.figs();
 check(`① ${h} ${k}: 컷인 뜸(on, data-hero=${h}, 영웅 상반신)`,ok===true&&el&&el.cls.has('on')&&el.getAttribute('data-hero')===h&&f.some(v=>v.fig==='main'&&v.src==='assets/r108/heroes/'+h+'.webp'),JSON.stringify({ok,f,cls:el&&[...el.cls]}));
 e.adv(1.3);check(`① ${h} ${k}: 1.25초 뒤 내려감(전투 흐름 오래 안 끊음)`,!e.el().cls.has('on'));}
{const e=make();for(const [h,k] of [['slayer','needle'],['slayer','swords'],['michaela','volley'],['michaela','tower'],['lauren','repulse'],['lauren','red'],['lauren','blue'],['neon','lance'],['neon','fog'],['seoha','collapse'],['seoha','heroes'],['hunter','call'],['hunter','shade'],['gunner','cloak'],['gunner','barrage']]){e.sb.player.hero=h;e.api.fire(h,k,e.sb.player);}
 check('① 1·2단 패시브(15가지)는 컷인 없음',e.api.inspect().shown===0&&!(e.el()&&e.el().cls.has('on')),JSON.stringify(e.api.inspect()));
 e.api.fire('hwando','trio',e.sb.player);e.api.fire('nobody','x',e.sb.player);check('① 환도·모르는 영웅은 이 모듈이 안 띄움',e.api.inspect().shown===0);}
// ② 인물 구성
{const e=make();e.api.fire('hunter','squad',e.sb.player,{heroes:['slayer','hunter','hunter','hunter','hunter']});const f=e.figs();
 check('② 헌터 기러기진: 헌터 + 슬레이어 + 헌터 분신 둘(기러기 대형)',f.filter(v=>v.fig==='main').length===1&&f.some(v=>v.fig==='ally'&&v.src==='assets/r108/heroes/slayer.webp')&&f.filter(v=>v.fig==='shade'&&v.src==='assets/r108/heroes/hunter.webp').length===2,JSON.stringify(f));}
{const e=make();e.api.fire('hunter','squad',e.sb.player,{heroes:['hunter','hunter','hunter','hunter']});const f=e.figs();
 check('② 헌터: 슬레이어 서사 전(분대에 슬레이어 없음)이면 슬레이어 그림 없음',!f.some(v=>v.src.includes('slayer'))&&f.filter(v=>v.fig==='shade').length===2,JSON.stringify(f));}
{const e=make();e.api.fire('gunner','summon',e.sb.player,{art:['assets/a/u1.webp','assets/a/u2.webp','assets/a/u3.webp','assets/a/u4.webp']});const f=e.figs();
 check('② 기억사수 귀환 전우: 실제로 불려 온 기계 보스 그림(최대 3)',f.filter(v=>v.fig==='boss').map(v=>v.src).join()==='assets/a/u1.webp,assets/a/u2.webp,assets/a/u3.webp'&&f.some(v=>v.fig==='main'),JSON.stringify(f));}
{const e=make();e.api.fire('gunner','summon',e.sb.player,{art:['javascript:alert(1)','../x.webp',null,42,'assets/ok/b.webp"onerror=x','assets/a/u1.webp']});const f=e.figs();
 check('⑤ 쓰레기·위험한 경로는 버림(assets/ 아래 그림 경로만)',f.filter(v=>v.fig==='boss').map(v=>v.src).join()==='assets/a/u1.webp',JSON.stringify(f));}
{const e=make();e.api.fire('seoha','arbelia',e.sb.player,{art:['assets/generated-v31224/actors-normalized/b9b65cd61430_arvelia_delay_archon.webp']});const f=e.figs();
 check('② 서하 수문장 아르벨리아: 서하 + 아르벨리아 보스 그림',f.some(v=>v.fig==='main')&&f.some(v=>v.fig==='boss'&&v.src.includes('arvelia_delay_archon')),JSON.stringify(f));}
{const e=make();e.api.fire('slayer','lattice',e.sb.player);const f=e.figs();
 check('② 슬레이어 혈격자: 슬레이어 + 적혈 정십자 둘(Dots R585 시트)',f.filter(v=>v.fig==='deco'&&v.src==='assets/r585/slayer-r-cross.webp').length===2,JSON.stringify(f));}
{const e=make();e.api.fire('michaela','bloom',e.sb.player);const f=e.figs();
 check('② 미카엘라 연심 대개화: 하트(Dots MH-03 시트), 십자 없음',f.some(v=>v.fig==='deco'&&v.src==='assets/r948/mh03-heart24.webp')&&!f.some(v=>/cross/.test(v.src)),JSON.stringify(f));}
{const e=make();e.api.fire('lauren','violet',e.sb.player);const f=e.figs();
 check('② 라우렌: 은빛 거성 + 심연 구(쌍성, R946 시트)',f.some(v=>v.src==='assets/r946/lauren-red.webp')&&f.some(v=>v.src==='assets/r946/lauren-blue.webp'),JSON.stringify(f));}
{const e=make();e.api.fire('neon','storm',e.sb.player);const f=e.figs();
 check('② 네온 천공 낙뢰: 민트 낙뢰 둘(R951 시트)',f.filter(v=>v.fig==='deco'&&v.src==='assets/r951/neon-skybeam.webp').length===2,JSON.stringify(f));}
// ③ 안 띄우는 경우
for(const flag of ['r720Ally','r949Summon','r952Body','r952Unit']){const e=make();const body={hero:'slayer',x:1,y:1,[flag]:true};e.api.fire('slayer','lattice',body);
 check(`③ ${flag} 몸이 쓰면 컷인 없음`,e.api.inspect().shown===0&&e.api.inspect().skipped.body===1);}
{const e=make();e.sb.modal={};e.api.fire('slayer','lattice',e.sb.player);e.sb.modal=null;e.sb.storyScene={};e.api.fire('slayer','lattice',e.sb.player);
 check('③ 대화창·서사 장면 중엔 컷인 없음',e.api.inspect().shown===0&&e.api.inspect().skipped.scene===2);}
{const e=make({ls:{'storyworld.r1033.cutin':'0'}});e.api.fire('slayer','lattice',e.sb.player);
 check('③ 끔(storyworld.r1033.cutin=0): 컷인 없음, 환도 allow 도 false',e.api.inspect().shown===0&&e.api.allow('hwando')===false&&e.api.on()===false);
 e.api.set(true);check('③ 다시 켜면 저장값 1, allow true',e.store['storyworld.r1033.cutin']==='1'&&e.api.allow('hwando')===true);}
{const e=make({noDoc:true});let threw=false;let r;try{r=e.api.fire('slayer','lattice',e.sb.player);}catch(_){threw=true;}
 check('③ document 없음: 멈추지 않고 건너뜀',!threw&&r===false&&e.api.inspect().skipped.dom===1);}
{const e=make();let threw=false;try{e.api.fire('slayer','lattice',null);e.api.fire('slayer','lattice',undefined);e.api.fire(undefined,undefined,undefined,undefined);}catch(_){threw=true;}
 check('⑤ 빈 인자에도 오류 없음',!threw&&e.api.inspect().errors===0);}
// ④ 빈도 제한
{const e=make();e.api.fire('slayer','lattice',e.sb.player);e.adv(7.9);e.api.fire('slayer','lattice',e.sb.player);const a=e.api.inspect();e.adv(.2);e.api.fire('slayer','lattice',e.sb.player);const b=e.api.inspect();
 check('④ 스토리: 8초 안 두 번째는 건너뜀, 8초 뒤엔 뜸',a.shown===1&&a.skipped.gap===1&&b.shown===2,JSON.stringify({a,b}));}
{const e=make({survival:true});e.api.fire('neon','storm',e.sb.player);e.adv(19.5);e.api.fire('michaela','bloom',e.sb.player);const a=e.api.inspect();e.adv(.6);e.api.fire('michaela','bloom',e.sb.player);const b=e.api.inspect();
 check('④ 무한생존: 영웅이 달라도 20초에 한 번(19.5초 건너뜀, 20.1초 뜸)',a.shown===1&&a.skipped.gap===1&&b.shown===2&&b.gap===20,JSON.stringify({a,b}));}
{const e=make();e.setNow(NaN);let threw=false;try{e.api.fire('slayer','lattice',e.sb.player);e.api.fire('slayer','lattice',e.sb.player);}catch(_){threw=true;}e.setNow(5000);e.api.fire('slayer','lattice',e.sb.player);
 check('⑤ NaN 시각: 멈추지 않고, 마지막 시각을 NaN 으로 덮지 않음(다음 정상 시각에 뜸)',!threw&&e.api.inspect().shown>=1&&Number.isFinite(e.api.inspect().lastAt),JSON.stringify(e.api.inspect()));}
// ⑧ 사몽 각성 컷인(#cutin 작은 그림 + 가운데 sw8 큰 그림)도 영웅 선택 창 초상화로(사용자 13:53Z "특히 기억사수 사몽")
{const e=make();const seen=[];e.sb.heroArt={gunner:{awakening:'assets/rc91/awakening/gunner.png',idle:{front:'f.webp'}}};e.sb.player.hero='gunner';
 e.sb.showAwakening=function(r){seen.push(e.sb.heroArt[e.sb.player.hero].awakening);return 'ok:'+r;};e.api.install();const r=e.sb.showAwakening('seven');
 check('⑧ 사몽 각성 중엔 각성 그림 자리에 초상화(r108)를 넘기고, 끝나면 원래 경로로 되돌림(제목·엔딩·궁극기 자세는 그대로)',seen[0]==='assets/r108/heroes/gunner.webp'&&r==='ok:seven'&&e.sb.heroArt.gunner.awakening==='assets/rc91/awakening/gunner.png',JSON.stringify({seen,after:e.sb.heroArt.gunner.awakening}));
 e.sb.showAwakening=function(){throw new Error('x');};e.api.install();let threw=false;try{e.sb.showAwakening('seven');}catch(_){threw=true;}
 check('⑧ 원래 함수가 오류를 내도 경로는 되돌림',threw&&e.sb.heroArt.gunner.awakening==='assets/rc91/awakening/gunner.png');}
{const e=make({ls:{'storyworld.r1033.portrait':'0'}});const seen=[];e.sb.heroArt={gunner:{awakening:'A.png'}};e.sb.player.hero='gunner';e.sb.showAwakening=()=>seen.push(e.sb.heroArt.gunner.awakening);e.api.install();e.sb.showAwakening('x');
 check('⑧ storyworld.r1033.portrait=0 이면 예전 각성 그림 그대로',seen[0]==='A.png');}
{const e=make();const seen=[];e.sb.heroArt={};e.sb.player.hero='nobody';e.sb.showAwakening=()=>{seen.push(1);};e.api.install();let threw=false;try{e.sb.showAwakening('x');}catch(_){threw=true;}
 check('⑧ 모르는 영웅·heroArt 없음: 원래대로 부르고 오류 없음',!threw&&seen.length===1);}
{const e=make();const d=e.doc;const a=d.createElement('img');a.id='awakeImage';d.body.appendChild(a);const sw=d.createElement('div');sw.id='sw8Awakening';const b=d.createElement('img');sw.appendChild(b);d.body.appendChild(sw);
 d.querySelector=sel=>sel==='#sw8Awakening img'?b:null;e.sb.urlFor=p=>'blob:'+p;e.sb.heroArt={gunner:{awakening:'A.png'}};e.sb.player.hero='gunner';
 e.sb.showAwakening=()=>{a.setAttribute('src',e.sb.urlFor(e.sb.heroArt.gunner.awakening));b.setAttribute('src',e.sb.urlFor(e.sb.heroArt.gunner.awakening));};e.api.install();e.sb.showAwakening('x');
 check('⑧ 초상화가 걸린 #awakeImage·sw8 그림에 마스크 표식(data-r1033)',a.getAttribute('data-r1033')==='1'&&b.getAttribute('data-r1033')==='1');
 e.sb.showAwakening=()=>{a.setAttribute('src','blob:ego.png');};e.api.install();e.sb.showAwakening('x');check('⑧ EGO 컷인처럼 다른 그림이면 #awakeImage 표식 뗌',a.getAttribute('data-r1033')===null);}
{check('⑧ 초상화 테두리를 부드럽게 지우는 마스크(#awakeImage·sw8 영웅 쪽)',/#awakeImage\[data-r1033\][^}]*mask-image/.test(src)&&/#sw8Awakening\[data-side="hero"\] img\[data-r1033\][^}]*mask-image/.test(src));}
// 설정 줄
{const e=make();const host=e.doc.createElement('section');host.id='combatScreenR1021';e.doc.body.appendChild(host);e.sb.showSettings();
 const row=e.doc.getElementById('passiveCutinR1033');check('설정 창 \'전투 화면\' 묶음에 컷인 켜고 끄기 한 줄',row&&row.parentNode===host,row&&row.parentNode&&row.parentNode.id);}
// ⑥ 패시브 모듈 연결
const HOOK={'lauren-celestial-r946.js':/stats\.procTotal\+\+;stats\.procs\[kind\]\+\+;C1033\(HERO,kind,o\);/,'michaela-heart-r948.js':/stats\.procTotal\+\+;stats\.procs\[kind\]\+\+;C1033\(HERO,kind,o\);/,
 'neon-storm-r951.js':/stats\.procTotal\+\+;stats\.procs\[kind\]\+\+;C1033\(HERO,kind,o\);/,'seoha-epoch-r949.js':/stats\.procTotal\+\+;stats\.procs\[kind\]\+\+;C1033\(HERO,kind,o,kind==='arbelia'\?\{art:\[ARB_ART\.idle\]\}:null\);/,
 'slayer-blood-passive-r947.js':/function castLattice\(s,p\)\{const t=T\(\);s\.stats\.lattices\+\+;C1033\(HERO,'lattice',p\);/,
 'hunter-squad-r952.js':/s\.stats\.procs\[tier\]\+\+;C1033\(HERO,tier,p,{heroes:sq\.units\.map\(u=>u\.kind\)\}\);/,
 'gunner-veil-r953.js':/if\(made\)C1033\(HERO,'summon',p,\{art:allies\.slice\(-made\)\.map\(v=>v\.a\.path\)\}\);/};
for(const [f,re] of Object.entries(HOOK)){const s=fs.readFileSync(path.join(CS,f),'utf8');let parsed=true;try{new Function(s);}catch(_){parsed=false;}
 check(`⑥ ${f}: 발동 자리에 R1033 한 줄 + 도우미(오류는 삼킴)`,re.test(s)&&/const C1033=\(h,k,o,x\)=>\{try\{window\.__STORYWORLD_PASSIVE_CUTIN_R1033__\?\.fire\(h,k,o,x\);\}catch\(_\)\{\}\};/.test(s)&&parsed);}
{const s=fs.readFileSync(path.join(CS,'hwando-ink-r945.js'),'utf8');check('⑥ 환도 삼협묵희 컷인도 같은 끄기를 따름(모듈 없으면 그대로)',/function cutin\(\)\{try\{if\(window\.__STORYWORLD_PASSIVE_CUTIN_R1033__\?\.allow\?\.\('hwando'\)===false\)\{cutStats\.skipped\+\+;return false;\}/.test(s));}
// ⑦ 그림·연결
{const man=fs.readFileSync(path.join(root,'runtime-manifest.json'),'utf8');const A7=['seoha','hunter','slayer','michaela','gunner','lauren','neon','hwando'];
 check('⑦ 영웅 선택 창 초상화(assets/r108/heroes) 8장이 배포 목록에 있음 — 컷인은 이 그림을 씀(사용자 13:53Z)',A7.every(h=>man.includes('"assets/r108/heroes/'+h+'.webp"')));
 check('⑦ 예전 각성 일러스트 잘라 낸 상반신(assets/r1033/*-bust)은 더 쓰지 않음',!/r1033\/[a-z]+-bust/.test(src)&&!fs.existsSync(path.join(root,'runtime-text','assets','r1033')));
for(const sh of ['r585/slayer-r-cross.webp','r948/mh03-heart24.webp','r946/lauren-red.webp','r946/lauren-blue.webp','r951/neon-skybeam.webp'])check('⑦ 재사용 시트가 src 에 적힘: '+sh,src.includes("'assets/"+sh+"'"));}
{const idx=fs.readFileSync(path.join(root,'runtime-text','index.html'),'utf8');
 check('⑦ 태그 한 번, passive-unlock-r1025 바로 뒤',idx.split('"./passive-cutin-r1033.js"').length===2&&/<script src="\.\/passive-unlock-r1025\.js"><\/script>\n<script src="\.\/passive-cutin-r1033\.js"><\/script>/.test(idx));
 const rt=path.join(root,'runtime-text','passive-cutin-r1033.js');check('⑦ runtime-text 사본이 같음(sync)',fs.existsSync(rt)&&fs.readFileSync(rt,'utf8')===src);
 const inp=fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8'),man=fs.readFileSync(path.join(root,'runtime-manifest.json'),'utf8');
 check('⑦ runtime-inputs·manifest 에 모듈과 상반신 7장',inp.includes('"passive-cutin-r1033.js"')&&man.includes('"passive-cutin-r1033.js"')&&['seoha','neon'].every(h=>man.includes('assets/r108/heroes/'+h+'.webp')&&inp.includes('assets/r108/heroes/'+h+'.webp')));
 for(const f of Object.keys(HOOK).concat('hwando-ink-r945.js')){const a=path.join(root,'runtime-text',f);check('⑦ 고친 모듈 runtime-text 사본 같음: '+f,fs.existsSync(a)&&fs.readFileSync(a,'utf8')===fs.readFileSync(path.join(CS,f),'utf8'));}
 check('⑦ 공개 확인 목록',fs.readFileSync(path.join(root,'..','scripts','verify-r96-public.py'),'utf8').includes("'passive-cutin-r1033.js'"));
 check('⑦ CI 줄',fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8').includes('node r96/qa/r1033/r1033-cpu-check.cjs'));}
done();
