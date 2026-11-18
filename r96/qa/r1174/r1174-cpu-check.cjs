// R1174 CPU 검사: 페르소나 영웅 전용 확률 패시브 발동 컷인 + 사몽 각성 컷신 (사용자 2026-11-18 14:33Z
//  "페르소나 전용 확률전용패시브 발동컷신과 사몽발동 컷신도 생성적용 닷츠와협업", 14:34Z "페르소나 전용 확률발동패시브 잘작동되는지도 검토개선적용").
//  고치기 전: 페르소나 형상(라우렌 몸 + personaHeroR1113)에서 (진) 천체 공명 3단((진) 유성 궤도·(진) 쌍성 소멸)이 터지면 R1033 이 라우렌 초상·보라 띠 컷인을 띄웠고,
//  사몽 각성에서도 왼쪽 위·가운데 컷인에 라우렌 초상과 '라우렌 · N초' 가 나왔다(라우렌 흔적).
//  ① 페르소나 3단 발동 → 페르소나 전용 컷인(#r1174Cutin): 페르소나 그림, 언주·흑·검빨 띠, (진) 이름, 라우렌 그림 0
//  ② 1·2단·몸·끔·대화창은 안 띄움, 빈도는 R1033 과 같은 시계(스토리 8초·무한생존 20초) ③ 라우렌 본인은 원래 R1033 컷인 그대로(회귀)
//  ④ 사몽 각성: 페르소나 그림·'페르소나' 이름·가운데(sw8) 경로·전용 각성 막(#r1174Awake), 끝나면 heroArt 되돌림, 감싸기 순서가 달라도 같음
//  ⑤ 라우렌 본인 사몽은 R1033 초상 그대로 ⑥ 이상한 값·문서 없음에도 안 멈춤 ⑦ 색 규칙(보라 없음) ⑧ 태그·sync·공개 확인·CI 연결
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..','..'),CS=path.join(root,'client-source'),FILE=path.join(CS,'persona-cutin-r1174.js'),F1033=path.join(CS,'passive-cutin-r1033.js');
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name+(ok||detail===''?'':' :: '+String(detail).slice(0,400)));};
const done=()=>{const failed=results.filter(r=>!r.ok).length;console.log(JSON.stringify({total:results.length,failed,method:'node vm + tiny fake DOM; real game run by r1174-browser.mjs (headless)'}));process.exit(failed?1:0);};
check('persona-cutin-r1174.js 있음',fs.existsSync(FILE));if(!fs.existsSync(FILE))done();
const src=fs.readFileSync(FILE,'utf8'),src1033=fs.readFileSync(F1033,'utf8');
class El{constructor(tag,doc){this.tagName=String(tag).toUpperCase();this.doc=doc;this.children=[];this.parentNode=null;this.attrs={};this.style={setProperty:(k,v)=>{this.style[k]=v;}};this._t='';this.offsetWidth=10;
 const c=new Set();this.cls=c;this.classList={add:(...a)=>a.forEach(x=>c.add(x)),remove:(...a)=>a.forEach(x=>c.delete(x)),contains:x=>c.has(x),toggle:(x,v)=>{const w=v===undefined?!c.has(x):!!v;w?c.add(x):c.delete(x);return w;}};this.dataset={};}
 get textContent(){return this._t+this.children.map(c=>c.textContent).join('');}set textContent(v){this._t=String(v);this.children=[];}
 get id(){return this.attrs.id||'';}set id(v){this.attrs.id=String(v);}
 get src(){return this.attrs.src||'';}set src(v){this.attrs.src=String(v);}
 get className(){return [...this.cls].join(' ');}set className(v){this.cls.clear();String(v).split(/\s+/).filter(Boolean).forEach(x=>this.cls.add(x));}
 get firstChild(){return this.children[0]||null;}
 setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return k in this.attrs?this.attrs[k]:null;}removeAttribute(k){delete this.attrs[k];}
 appendChild(x){if(x.parentNode)x.parentNode.removeChild(x);x.parentNode=this;this.children.push(x);return x;}
 removeChild(x){this.children=this.children.filter(y=>y!==x);x.parentNode=null;return x;}
 querySelector(s){const m=/^#(\w+) img$/.exec(s);if(m){const e=this.doc.getElementById(m[1]);return e?e.all().find(x=>x.tagName==='IMG')||null:null;}return null;}
 all(){const o=[];const w=e=>{for(const c of e.children){o.push(c);w(c);}};w(this);return o;}
 addEventListener(){}}
function makeDoc(){const d={readyState:'complete',hidden:false};d.head=new El('head',d);d.body=new El('body',d);d.createElement=t=>new El(t,d);d.createTextNode=t=>{const n=new El('#text',d);n._t=String(t);return n;};
 d.getElementById=id=>[...d.head.all(),...d.body.all()].find(e=>e.id===id)||null;d.querySelector=s=>d.body.querySelector(s);return d;}
const LAUREN_ART='assets/rc91/lauren-awake.webp';
function make({ls={},survival=false,noDoc=false,persona=true,hero='lauren',order='normal'}={}){const store={...ls},doc=noDoc?undefined:makeDoc();const timers=[];let now=1000;
 const sb={console,Math,JSON,Number,Array,Object,String,Set,Map,WeakMap,Boolean,Date,Promise,Error,RegExp,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}},
  setTimeout:(f,ms)=>{timers.push({f,at:now+ms/1000});return timers.length;},clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},
  performance:{now:()=>now*1000},modal:null,storyScene:null,time:50,player:{hero,x:5,y:5,hp:100,personaHeroR1113:persona},showSettings:function(){},
  urlFor:p=>p,heroArt:{lauren:{awakening:LAUREN_ART},slayer:{awakening:'assets/rc91/slayer-awake.webp'}},HEROES:{lauren:{name:'라우렌'},slayer:{name:'슬레이어'}},sw8:[]};
 if(doc){sb.document=doc;const stage=doc.createElement('div');stage.id='stage';doc.body.appendChild(stage);const ci=doc.createElement('div');ci.id='cutin';const im=doc.createElement('img');im.id='awakeImage';const nm=doc.createElement('div');nm.id='awakeHero';ci.appendChild(im);ci.appendChild(nm);doc.body.appendChild(ci);}
 // 엔진 showAwakening + RC149 가운데 컷인(heroArt[player.hero].awakening 을 읽음)을 흉내
 sb.showAwakening=function(reason){const p=sb.heroArt[sb.player.hero].awakening;if(doc){doc.getElementById('awakeImage').src=sb.urlFor(p);doc.getElementById('awakeHero').textContent=sb.HEROES[sb.player.hero].name+' · 11초';}sb.sw8.push(sb.heroArt[sb.player.hero]?.awakening);};
 if(doc)sb.document=doc;sb.window=sb;const loads=[];sb.addEventListener=(n,f)=>{if(n==='load')loads.push(f);};
 sb.__STORYWORLD_SURVIVAL_R600__={here:()=>survival};
 vm.createContext(sb);
 const run=(s,f)=>vm.runInContext(s,sb,{filename:f});
 if(order==='reverse'){run(src,'persona-cutin-r1174.js');run(src1033,'passive-cutin-r1033.js');}else{run(src1033,'passive-cutin-r1033.js');run(src,'persona-cutin-r1174.js');}
 for(const f of loads)f();
 const A=sb.__STORYWORLD_PASSIVE_CUTIN_R1033__,P=sb.__STORYWORLD_PERSONA_CUTIN_R1174__;
 const adv=s=>{now+=s;for(const t of timers.splice(0))if(t.at<=now)t.f();else timers.push(t);};
 const el=id=>doc&&doc.getElementById(id);
 const srcs=()=>doc?[...doc.head.all(),...doc.body.all()].map(x=>(x.getAttribute('src')||'')+' '+(x.getAttribute('data-src')||'')+' '+(x.style.backgroundImage||'')).join('\n'):'';
 return {sb,A,P,doc,store,adv,el,srcs,setNow:v=>{now=v;}};}
let E=make();
check('공개 객체 __STORYWORLD_PERSONA_CUTIN_R1174__',E.P&&typeof E.P.show==='function'&&typeof E.P.persona==='function'&&typeof E.P.inspect==='function');
if(!E.P)done();
// ① 페르소나 3단
for(const [k,name] of [['violet','(진) 쌍성 소멸'],['meteor','(진) 유성 궤도']]){const e=make();const ok=e.A.fire('lauren',k,e.sb.player);const c=e.el('r1174Cutin'),o=e.el('r1033Cutin');
 const imgs=c?c.all().filter(x=>x.tagName==='IMG').map(x=>x.getAttribute('src')):[];
 check(`① ${k}: 페르소나 전용 컷인 뜸(#r1174Cutin on, data-kind=${k})`,ok===true&&c&&c.cls.has('on')&&c.getAttribute('data-kind')===k,JSON.stringify({ok,cls:c&&[...c.cls]}));
 check(`① ${k}: 라우렌 컷인(#r1033Cutin)은 안 뜸`,!(o&&o.cls.has('on')));
 check(`① ${k}: 주인공 그림 = 페르소나(rc133/Dots CX-0153PC), 라우렌 그림·시트 0`,imgs.some(s=>/rc133\/art\/|r1174\//.test(s))&&!/lauren/.test(e.srcs()),JSON.stringify({imgs,all:e.srcs().slice(0,300)}));
 check(`① ${k}: 이름 줄 '${name}'`,c&&c.textContent.includes(name),c&&c.textContent);
 check(`① ${k}: R1033 기록 last.hero=persona`,e.A.inspect().last?.hero==='persona'&&e.P.inspect().shown===1,JSON.stringify(e.A.inspect().last));
 e.adv(1.4);check(`① ${k}: 1.3초 안에 내려감`,!e.el('r1174Cutin').cls.has('on'));}
// ② 거름
{const e=make();for(const k of ['repulse','red','blue'])e.A.fire('lauren',k,e.sb.player);check('② 1·2단(항성 반발·은빛 거성·심연 왜성)은 컷인 없음',e.P.inspect().shown===0&&e.A.inspect().shown===0);}
{const e=make();const body={hero:'lauren',personaHeroR1113:true,r720Ally:true,x:1,y:1,hp:9};check('② 배치 몸(R720)은 안 띄움',e.A.fire('lauren','violet',body)===false&&e.P.inspect().shown===0);}
{const e=make({ls:{'storyworld.r1033.cutin':'0'}});check('② 컷인 끔(R1033 설정)을 따름',e.A.fire('lauren','violet',e.sb.player)===false&&e.P.inspect().shown===0);}
{const e=make();e.sb.modal={};check('② 대화창 중엔 안 띄움',e.A.fire('lauren','meteor',e.sb.player)===false);}
{const e=make();e.A.fire('lauren','violet',e.sb.player);e.adv(3);const b=e.A.fire('lauren','meteor',e.sb.player);e.adv(5.2);const c=e.A.fire('lauren','meteor',e.sb.player);
 check('② 빈도 = R1033 한 시계(스토리 8초): 3초 뒤 거름, 8초 넘으면 다시',b===false&&c===true&&e.P.inspect().shown===2,JSON.stringify({b,c,s:e.P.inspect().shown}));}
{const e=make({survival:true});e.A.fire('lauren','violet',e.sb.player);e.adv(12);const b=e.A.fire('lauren','violet',e.sb.player);e.adv(8.5);const c=e.A.fire('lauren','violet',e.sb.player);check('② 무한생존 20초 한 번',b===false&&c===true);}
// ③ 라우렌 본인 회귀
{const e=make({persona:false});e.A.fire('lauren','violet',e.sb.player);const o=e.el('r1033Cutin'),c=e.el('r1174Cutin');
 check('③ 라우렌 본인: 원래 R1033 컷인(라우렌 초상) 그대로, 페르소나 컷인 없음',o&&o.cls.has('on')&&/r108\/heroes\/lauren\.webp/.test(e.srcs())&&!(c&&c.cls.has('on'))&&e.P.inspect().shown===0);}
{const e=make({persona:true,hero:'slayer'});e.A.fire('slayer','lattice',e.sb.player);check('③ 형상 표식이 남아도 다른 영웅이면 그 영웅 컷인',e.A.inspect().last?.hero==='slayer'&&e.P.inspect().shown===0);}
// ④ 사몽 각성
for(const order of ['normal','reverse']){const e=make({order});e.sb.showAwakening('samong');const im=e.el('awakeImage'),nm=e.el('awakeHero'),ov=e.el('r1174Awake');
 check(`④ [${order}] 왼쪽 위 각성 그림 = 페르소나`,/rc133\/art\/|r1174\//.test(im.getAttribute('src'))&&!/lauren/.test(im.getAttribute('src')),im.getAttribute('src'));
 check(`④ [${order}] 이름 줄 '페르소나 · 11초'`,/^페르소나/.test(nm.textContent)&&!/라우렌/.test(nm.textContent),nm.textContent);
 check(`④ [${order}] 가운데 큰 컷인(sw8) 경로도 페르소나`,e.sb.sw8.length===1&&/rc133\/art\/|r1174\//.test(e.sb.sw8[0]),JSON.stringify(e.sb.sw8));
 check(`④ [${order}] 전용 각성 막(#r1174Awake) on, 언주 고리`,ov&&ov.cls.has('on'),ov&&[...ov.cls]);
 check(`④ [${order}] 끝나면 heroArt.lauren.awakening 되돌림`,e.sb.heroArt.lauren.awakening===LAUREN_ART);
 e.adv(2.2);check(`④ [${order}] 각성 막 2초 안에 내려감`,!e.el('r1174Awake').cls.has('on'));}
// ⑤ 라우렌 본인 사몽
{const e=make({persona:false});e.sb.showAwakening('samong');const im=e.el('awakeImage'),ov=e.el('r1174Awake');
 check('⑤ 라우렌 본인 사몽: R1033 초상(라우렌) 그대로, 페르소나 막 없음',/r108\/heroes\/lauren\.webp/.test(im.getAttribute('src'))&&/^라우렌/.test(e.el('awakeHero').textContent)&&!(ov&&ov.cls.has('on')),im.getAttribute('src'));}
// ⑥ 이상한 값
{let threw=null;try{const e=make({noDoc:true});e.A.fire('lauren','violet',e.sb.player);e.sb.showAwakening('samong');e.P.show('violet');e.P.show('nope');}catch(err){threw=err;}check('⑥ 문서 없음·모르는 갈래에도 안 멈춤',!threw,threw&&threw.stack);}
{const e=make();e.P.qaNow?.(()=>NaN);let threw=null;try{e.A.fire('lauren','violet',e.sb.player);e.sb.player=null;e.sb.showAwakening&&0;}catch(err){threw=err;}check('⑥ NaN 시각에도 안 멈춤',!threw);}
// ⑦ 색 규칙
{const css=(src.match(/const CSS=\[[^]*?\]\.join/)||[''])[0];
 check('⑦ 띠·고리 = 언주(#cc3428 계열)·흑·검빨, 보라·은빛 없음',/cc3428|204,52,40/i.test(css)&&!/violet|purple|150,90,210|164,98,255|lauren/i.test(css),css.slice(0,200));}
{check('⑦ 십자 그림 없음(정십자 규칙 — 이 컷인은 십자를 쓰지 않음)',!/cross/i.test(src.replace(/\/\/.*$/mg,'')));}
// ⑧ 연결
{const html=fs.readFileSync(path.join(root,'runtime-text','index.html'),'utf8');const a=html.indexOf('./passive-cutin-r1033.js'),b=html.indexOf('<script src="./persona-cutin-r1174.js"></script>'),c=html.indexOf('./persona-hero-r1113.js');
 check('⑧ index.html 태그(R1033·페르소나 영웅 뒤)',b>0&&b>a&&b>c);
 check('⑧ runtime-text 사본 = client-source',fs.existsSync(path.join(root,'runtime-text','persona-cutin-r1174.js'))&&fs.readFileSync(path.join(root,'runtime-text','persona-cutin-r1174.js'),'utf8')===src);
 check('⑧ runtime-text R1033 사본 = client-source',fs.readFileSync(path.join(root,'runtime-text','passive-cutin-r1033.js'),'utf8')===src1033);
 check('⑧ runtime-inputs·manifest',/persona-cutin-r1174\.js/.test(fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8'))&&/persona-cutin-r1174\.js/.test(fs.readFileSync(path.join(root,'runtime-manifest.json'),'utf8')));
 check('⑧ 공개 확인 목록',/'persona-cutin-r1174\.js'/.test(fs.readFileSync(path.join(root,'..','scripts','verify-r96-public.py'),'utf8')));
 check('⑧ CI 줄',/r96\/qa\/r1174\/r1174-cpu-check\.cjs/.test(fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8')));}
done();
