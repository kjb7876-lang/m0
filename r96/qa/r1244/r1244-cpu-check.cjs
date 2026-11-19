// R1244 CPU 검사: 사몽 각성·특수 확률 패시브 발동 연출을 극장판 애니처럼 (사용자 2026-11-19 14:37Z
//  "사몽각성스킬및특수확률패시브 연출씬강화해줘 보다 간지나게 영화극장판애니 같은 역동적인연출과 영웅특성살아나게 필요한자산은 닷츠랑협업").
//  참고 영상(Threads @rlaope, 14.7초) 분석: ① 무기·이름판 → ② 사선 베기 한 줄로 화면을 가름(스매시 컷) → ③ 베인 틈(사선 슬릿) 속 눈 클로즈업, 천천히 밀고 들어감
//  → ④ 눈동자가 문양으로 매치 컷 → ⑤ 반전 임팩트 프레임 → ⑥ 정적인 마무리. 두 색 제한 팔레트.
//  완료 조건:
//  ① 8영웅 세 번째 패시브(R1033 fire 통과) → #r1244Cine 이 data-mode=passive·data-form=영웅으로 뜸, 눈 그림 = 영웅 초상, 시그니처 시트 = 영웅 표, 이름판에 패시브 이름
//  ② 페르소나 형상 → form persona, 라우렌 그림 0 ③ 환도 삼협묵희(allow('hwando')) → form hwando, EGO 형상 → form ego(R1033 allow 반환값은 그대로)
//  ④ 사몽 각성 → data-mode=awake, '사몽 각성'·영웅 이름, 엔진 showAwakening 1번만, heroArt 되돌림(감싸기 순서 달라도)
//  ⑤ 거름: 끔·대화창·몸(R720)·빈도(R1033 이 거른 것은 안 띄움)·문서 없음
//  ⑥ 프레임 애니메이션: 시트 칸이 차례로 6칸 이상 넘어가고, 끝나면 꺼지고 시계도 멈춤(패시브 ≤1.15초, 각성 ≤1.7초)
//  ⑦ 가벼움: 성능 7단계 1~2 또는 모션 줄이기 → lite(칸 넘기기·임팩트 없음), DOM 노드 ≤10, 캔버스·fx·getContext 0, blur·drop-shadow 0
//  ⑧ 고유색: 환도 = 먹+흰(채도 있는 색 0), 페르소나 = 언주·흑·검빨(보라 0), EGO = 언주+먹+흰
//  ⑨ 미리 읽기: 지금 형상 그림만(≤4장), 형상이 바뀔 때만 ⑩ 태그·sync·공개 확인·CI 연결
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..','..'),CS=path.join(root,'client-source'),FILE=path.join(CS,'cinema-cutin-r1244.js'),F1033=path.join(CS,'passive-cutin-r1033.js'),F1174=path.join(CS,'persona-cutin-r1174.js');
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name+(ok||detail===''?'':' :: '+String(detail).slice(0,400)));};
const done=()=>{const failed=results.filter(r=>!r.ok).length;console.log(JSON.stringify({total:results.length,failed,method:'node vm + tiny fake DOM; real game run by r1244-browser.mjs (headless)'}));process.exit(failed?1:0);};
check('cinema-cutin-r1244.js 있음',fs.existsSync(FILE));if(!fs.existsSync(FILE))done();
const src=fs.readFileSync(FILE,'utf8'),src1033=fs.readFileSync(F1033,'utf8'),src1174=fs.readFileSync(F1174,'utf8');
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
 querySelector(s){const m=/^#(\w+) img$/.exec(s);if(m){const e=this.doc.getElementById(m[1]);return e?e.all().find(x=>x.tagName==='IMG')||null:null;}const c=/^\.([\w-]+)$/.exec(s);if(c)return this.all().find(x=>x.cls.has(c[1]))||null;return null;}
 all(){const o=[];const w=e=>{for(const c of e.children){o.push(c);w(c);}};w(this);return o;}
 addEventListener(){}}
function makeDoc(){const d={readyState:'complete',hidden:false};d.head=new El('head',d);d.body=new El('body',d);d.createElement=t=>new El(t,d);d.createTextNode=t=>{const n=new El('#text',d);n._t=String(t);return n;};
 d.getElementById=id=>[...d.head.all(),...d.body.all()].find(e=>e.id===id)||null;d.querySelector=s=>d.body.querySelector(s);return d;}
const HEROS=['seoha','hunter','slayer','michaela','gunner','lauren','neon','hwando'];
const NAME={seoha:'윤서하',hunter:'헌터',slayer:'슬레이어',michaela:'미카엘라',gunner:'기억사수',lauren:'라우렌',neon:'네온',hwando:'환도'};
const KIND={slayer:'lattice',michaela:'bloom',lauren:'meteor',neon:'storm',seoha:'arbelia',hunter:'squad',gunner:'summon'};
function make({ls={},survival=false,noDoc=false,persona=false,ego=false,hero='slayer',order='normal',motionReduce=false}={}){const store={...ls},doc=noDoc?undefined:makeDoc();const timers=[];let now=1000,tid=0;const images=[];
 const heroArt={};for(const h of HEROS)heroArt[h]={awakening:'assets/rc91/'+h+'-awake.webp'};const HEROES={};for(const h of HEROS)HEROES[h]={name:NAME[h]};
 const sb={console,Math,JSON,Number,Array,Object,String,Set,Map,WeakMap,Boolean,Date,Promise,Error,RegExp,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}},
  setTimeout:(f,ms)=>{const id=++tid;timers.push({id,f,at:now+(+ms||0)/1000});return id;},clearTimeout:id=>{const i=timers.findIndex(t=>t.id===id);if(i>=0)timers.splice(i,1);},setInterval:()=>0,clearInterval:()=>{},
  performance:{now:()=>now*1000},modal:null,storyScene:null,time:50,player:{hero,x:5,y:5,hp:100,personaHeroR1113:persona},showSettings:function(){},
  matchMedia:q=>({matches:/reduce/.test(q)?motionReduce:false}),
  Image:function(){const o={src:''};images.push(o);return o;},
  urlFor:p=>p,heroArt,HEROES,sw8:[],awakeCalls:0};
 if(ego)sb.__STORYWORLD_EGO_SOVEREIGN_R1046__={formActive:()=>true};
 if(doc){sb.document=doc;const stage=doc.createElement('div');stage.id='stage';doc.body.appendChild(stage);const ci=doc.createElement('div');ci.id='cutin';const im=doc.createElement('img');im.id='awakeImage';const nm=doc.createElement('div');nm.id='awakeHero';ci.appendChild(im);ci.appendChild(nm);doc.body.appendChild(ci);}
 sb.showAwakening=function(reason){sb.awakeCalls++;const p=sb.heroArt[sb.player.hero].awakening;if(doc){doc.getElementById('awakeImage').src=sb.urlFor(p);doc.getElementById('awakeHero').textContent=sb.HEROES[sb.player.hero].name+' · 11초';}sb.sw8.push(p);};
 sb.window=sb;const loads=[];sb.addEventListener=(n,f)=>{if(n==='load')loads.push(f);};
 sb.__STORYWORLD_SURVIVAL_R600__={here:()=>survival};
 vm.createContext(sb);
 const run=(s,f)=>vm.runInContext(s,sb,{filename:f});
 if(order==='reverse'){run(src,'cinema-cutin-r1244.js');run(src1033,'passive-cutin-r1033.js');run(src1174,'persona-cutin-r1174.js');}
 else{run(src1033,'passive-cutin-r1033.js');run(src1174,'persona-cutin-r1174.js');run(src,'cinema-cutin-r1244.js');}
 for(const f of loads)f();
 const C=()=>sb.__STORYWORLD_CINEMA_CUTIN_R1244__;
 if(C()&&typeof C().install==='function')C().install();
 const adv=s=>{const end=now+s;for(;;){timers.sort((a,b)=>a.at-b.at);const t=timers[0];if(!t||t.at>end)break;timers.shift();now=t.at;t.f();}now=end;};
 const el=id=>doc&&doc.getElementById(id);
 return {sb,C,doc,store,adv,el,images,timers,A:()=>sb.__STORYWORLD_PASSIVE_CUTIN_R1033__,setNow:v=>{now=v;}};}
let E=make();
const API=E.C();
check('공개 객체 __STORYWORLD_CINEMA_CUTIN_R1244__',API&&['play','formOf','profile','inspect','on','set','install'].every(k=>typeof API[k]==='function'),API&&Object.keys(API).join(','));
if(!API)done();
check('형상 10개(8영웅 + EGO + 페르소나)',Array.isArray(API.forms)&&API.forms.length===10&&[...HEROS,'ego','persona'].every(f=>API.forms.includes(f)),API.forms);
// ① 8영웅 패시브
for(const h of HEROS){if(h==='hwando')continue;const e=make({hero:h});const ok=e.A().fire(h,KIND[h],e.sb.player,h==='hunter'?{heroes:['hunter']}:h==='gunner'?{art:[]}:h==='seoha'?{art:[]}:null);
 const c=e.el('r1244Cine');const prof=e.C().profile(h);
 const eye=c&&c.querySelector('.r1244eye'),sig=c&&c.querySelector('.r1244sig'),plate=c&&c.querySelector('.r1244plate');
 check(`① ${h}: R1033 통과 → #r1244Cine on(passive, form=${h})`,ok===true&&c&&c.cls.has('on')&&c.getAttribute('data-form')===h&&c.getAttribute('data-mode')==='passive',JSON.stringify({ok,cls:c&&[...c.cls],f:c&&c.getAttribute('data-form')}));
 /* R1244b(사용자 '자산은 닷츠랑 협업' → Dots 눈 시트 도착): 눈 그림 = Dots 시트가 있으면 시트, 없으면 영웅 초상 */
 check(`① ${h}: 눈 클로즈업 = Dots 눈 시트 또는 영웅 초상(assets/r108/heroes/${h}.webp), 시그니처 시트 = 표`,eye&&eye.getAttribute('data-src')===(prof.eye.sheet?prof.eye.sheet.path:`assets/r108/heroes/${h}.webp`)&&sig&&prof&&prof.sig&&sig.getAttribute('data-src')===prof.sig.path&&/^assets\/r\d+\//.test(prof.sig.path),JSON.stringify({eye:eye&&eye.attrs,sig:sig&&sig.attrs,prof}));
 check(`① ${h}: 이름판에 영웅 이름·패시브 이름`,plate&&plate.textContent.includes(NAME[h])&&prof&&typeof prof.passive==='string'&&prof.passive.length>1&&plate.textContent.includes(prof.passive),plate&&plate.textContent);
}
// R1033 이 거른 경우(1단 kind)는 안 뜸
{const e=make({hero:'slayer'});e.A().fire('slayer','sting',e.sb.player);const c=e.el('r1244Cine');check('⑤ R1033 이 거른 1·2단은 안 뜸',!(c&&c.cls.has('on')));}
// ② 페르소나
{const e=make({hero:'lauren',persona:true});e.A().fire('lauren','violet',e.sb.player);const c=e.el('r1244Cine');const eye=c&&c.querySelector('.r1244eye');
 check('② 페르소나: form persona',c&&c.cls.has('on')&&c.getAttribute('data-form')==='persona',c&&c.getAttribute('data-form'));
 const all=c?c.all().map(x=>(x.getAttribute('data-src')||'')+(x.style.backgroundImage||'')).join(' '):'';
 check('② 페르소나: 라우렌 그림 0, 페르소나 그림(r1174 또는 Dots 페르소나 눈 시트)',eye&&/r1174\/|r1244\/eye-persona/.test(eye.getAttribute('data-src'))&&!/lauren/.test(all),all);}
// ③ 환도·EGO
{const e=make({hero:'hwando'});const r=e.A().allow('hwando');const c=e.el('r1244Cine');
 check('③ 환도 삼협묵희(allow) → form hwando, allow 반환 그대로',r===true&&c&&c.cls.has('on')&&c.getAttribute('data-form')==='hwando',JSON.stringify({r,f:c&&c.getAttribute('data-form')}));
 const e2=make({hero:'hwando',ls:{'storyworld.r1033.cutin':'0'}});const r2=e2.A().allow('hwando');const c2=e2.el('r1244Cine');check('③ 컷인 끔이면 환도도 안 뜸(allow false 그대로)',r2===false&&!(c2&&c2.cls.has('on')));
 const e3=make({hero:'hwando',ego:true});const r3=e3.A().allow('hwando');const c3=e3.el('r1244Cine');
 check('③ EGO 형상 삼협묵희 → form ego',c3&&c3.cls.has('on')&&c3.getAttribute('data-form')==='ego',c3&&c3.getAttribute('data-form'));
 // 빈도: 같은 시계 안에서 두 번째는 안 뜸
 e.adv(2);const c0=e.el('r1244Cine');c0.classList.remove('on');e.A().allow('hwando');check('③ 환도 빈도(8초 안 두 번째 안 뜸)',!c0.cls.has('on'));
 e.adv(9);e.A().allow('hwando');check('③ 환도 8초 뒤 다시 뜸',c0.cls.has('on'));}
// ④ 사몽 각성
for(const order of ['normal','reverse']){const e=make({hero:'neon',order});e.sb.showAwakening('play');const c=e.el('r1244Cine');const plate=c&&c.querySelector('.r1244plate');
 check(`④ (${order}) 사몽 각성 → awake 모드, 이름판 '사몽 각성'·네온`,c&&c.cls.has('on')&&c.getAttribute('data-mode')==='awake'&&plate&&/사몽 각성/.test(plate.textContent)&&plate.textContent.includes('네온'),JSON.stringify({m:c&&c.getAttribute('data-mode'),t:plate&&plate.textContent}));
 check(`④ (${order}) 엔진 showAwakening 1번, heroArt 되돌림`,e.sb.awakeCalls===1&&e.sb.heroArt.neon.awakening==='assets/rc91/neon-awake.webp',JSON.stringify({n:e.sb.awakeCalls,a:e.sb.heroArt.neon.awakening}));}
{const e=make({hero:'lauren',persona:true});e.sb.showAwakening('play');const c=e.el('r1244Cine');check('④ 페르소나 각성 → form persona',c&&c.getAttribute('data-form')==='persona'&&c.getAttribute('data-mode')==='awake');}
{const e=make({hero:'hwando',ego:true});e.sb.showAwakening('play');const c=e.el('r1244Cine');check('④ EGO 각성 → form ego',c&&c.getAttribute('data-form')==='ego');}
// ④ 회귀(헤드리스에서 찾음): R1046 처럼 자기 표식(__r1112)이 없으면 0.5초마다 다시 감싸는 모듈과 번갈아 돌아도 겹침이 늘지 않음
{const e=make({hero:'neon'});const sb=e.sb;let rewraps=0;const r1046=()=>{if(sb.showAwakening.__r1112)return;const base=sb.showAwakening;const w=function(...a){return base.apply(this,a);};w.__r1112=true;sb.showAwakening=w;rewraps++;};
 for(let i=0;i<20;i++){r1046();e.C().install();}const ins0=e.C().inspect();sb.showAwakening('play');const c=e.el('r1244Cine');
 check('④ 표식 확인형 감싸기(R1046)와 20번 번갈아도 겹침 고정(다시 감싸기 ≤1, 내 감싸기 ≤2)',rewraps<=1&&ins0.wraps<=2&&sb.awakeCalls===1&&e.C().inspect().awake===1&&c&&c.cls.has('on'),JSON.stringify({rewraps,wraps:ins0.wraps,calls:sb.awakeCalls,awake:e.C().inspect().awake}));}
// ⑤ 거름
{const e=make({hero:'neon',ls:{'storyworld.r1244.cine':'0'}});e.sb.showAwakening('play');const c=e.el('r1244Cine');check('⑤ 끔(storyworld.r1244.cine=0)이면 안 뜸, 엔진은 그대로',!(c&&c.cls.has('on'))&&e.sb.awakeCalls===1);}
{const e=make({hero:'neon'});e.sb.modal={};e.sb.showAwakening('play');const c=e.el('r1244Cine');check('⑤ 대화창 중엔 안 뜸',!(c&&c.cls.has('on')));}
{const e=make({hero:'neon'});const ok=e.C().play('neon','passive','storm',{r720Ally:true});check('⑤ 배치 몸(r720Ally)이면 안 뜸',ok===false);}
{let threw=null;try{const e=make({hero:'neon',noDoc:true});e.sb.showAwakening('play');e.C().play('neon','awake');e.C().play('zzz','passive');}catch(x){threw=x;}check('⑤ 문서 없음·이상한 형상에도 안 멈춤',!threw,threw&&threw.stack);}
{const e=make();check('⑤ 모르는 형상은 false',e.C().play('nobody','passive')===false&&e.C().formOf({hero:'zzz'})===null);}
// ⑥ 프레임 애니메이션
for(const [mode,limit] of [['passive',1.15],['awake',1.7]]){const e=make({hero:'slayer'});const ok=e.C().play('slayer',mode,'lattice');const c=e.el('r1244Cine');const sig=c.querySelector('.r1244sig');
 const seen=new Set();let t=0,offAt=null;while(t<2.4){e.adv(1/60);t+=1/60;seen.add(sig.style.backgroundPosition);if(offAt===null&&!c.cls.has('on'))offAt=t;}
 check(`⑥ ${mode}: 시그니처 시트 칸이 6칸 이상 차례로 넘어감`,ok&&seen.size>=6,[...seen].join(' | '));
 check(`⑥ ${mode}: ${limit}초 안에 꺼짐`,offAt!==null&&offAt<=limit+1e-6,offAt);
 check(`⑥ ${mode}: 끝나면 칸 넘기기 시계 멈춤(남은 타이머 0)`,e.timers.length===0,e.timers.length);
 const ins=e.C().inspect();check(`⑥ ${mode}: inspect 칸 수 기록`,ins&&ins.frames>=6&&ins.shown===1,JSON.stringify(ins));}
// ⑦ 가벼움
{const e=make({hero:'neon',ls:{'storyworld.r1043.perf7':JSON.stringify({step:1})}});e.C().play('neon','awake');const c=e.el('r1244Cine');const sig=c.querySelector('.r1244sig');const p0=sig.style.backgroundPosition;e.adv(.5);
 check('⑦ 성능 1단계 → lite(칸 넘기기 없음)',c.getAttribute('data-lite')==='1'&&sig.style.backgroundPosition===p0,JSON.stringify({lite:c.getAttribute('data-lite'),p0,p1:sig.style.backgroundPosition}));}
{const e=make({hero:'neon',motionReduce:true});e.C().play('neon','awake');const c=e.el('r1244Cine');check('⑦ 모션 줄이기 → lite',c.getAttribute('data-lite')==='1');}
{const e=make({hero:'neon',ls:{'storyworld.r1043.perf7':JSON.stringify({step:5})}});e.C().play('neon','awake');const c=e.el('r1244Cine');check('⑦ 성능 5단계 → 전체 연출',c.getAttribute('data-lite')!=='1');
 check('⑦ DOM 노드 10개 이하',c.all().length<=10,c.all().length);}
const code=src.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g,'');
check('⑦ 캔버스 그리기·fx·getContext 없음(게임 렌더 부담 0, 도형 이펙트 0)',!/getContext|\bctx\.|\bfx\(|arc\(|fillRect|strokeRect/.test(code));
check('⑦ blur·drop-shadow 필터 없음',!/blur\(|drop-shadow/.test(code));
check('⑦ 사몽 렉 규칙: 각성 때 새 그림을 읽지 않음(미리 읽기만), setInterval 칸 넘기기 없음',!/setInterval\([^)]*tick/.test(code));
// ⑧ 고유색
const sat=hex=>{const m=/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);if(!m)return 0;const [r,g,b]=[1,2,3].map(i=>parseInt(m[i],16));return Math.max(r,g,b)-Math.min(r,g,b);};
const blockOf=f=>{const p=API.profile(f);return p?JSON.stringify(p.colors||{}):'';};
const cols=f=>(blockOf(f).match(/#[0-9a-fA-F]{6}/g)||[]);
check('⑧ 환도 = 먹+흰(채도 24 이하만)',cols('hwando').length>=2&&cols('hwando').every(c=>sat(c)<=24),cols('hwando'));
const purple=c=>{const m=/^#(..)(..)(..)$/.exec(c);const [r,g,b]=[1,2,3].map(i=>parseInt(m[i],16));return b>g+30&&r>g+20&&b>=r*.6;};
check('⑧ 페르소나 = 언주(#cc3428) 포함·보라 없음',cols('persona').map(s=>s.toLowerCase()).includes('#cc3428')&&!cols('persona').some(purple),cols('persona'));
check('⑧ EGO = 언주+먹+흰',(()=>{const c=cols('ego').map(s=>s.toLowerCase());return c.includes('#cc3428')&&c.some(x=>sat(x)<=24&&parseInt(x.slice(1,3),16)<40)&&c.some(x=>sat(x)<=24&&parseInt(x.slice(1,3),16)>220);})(),cols('ego'));
check('⑧ 시그니처 시트는 모두 프레임 시트(cols×rows ≥ 8칸)',API.forms.every(f=>{const s=API.profile(f).sig;return s&&s.cols*s.rows>=8&&s.frames>=8;}),API.forms.map(f=>JSON.stringify(API.profile(f).sig)).join(' '));
check('⑧ 시트 파일이 실제로 있음',API.forms.every(f=>{const p=API.profile(f);return [p.sig.path,p.slash&&p.slash.path,p.eye.path].filter(Boolean).every(x=>fs.existsSync(path.join(root,'runtime-text',x)));}));
// ⑨ 미리 읽기
{const e=make({hero:'neon'});const n0=e.images.length;e.sb.player.hero='slayer';e.C().warm();const n1=e.images.length-n0;e.C().warm();const n2=e.images.length-n0;e.sb.player.hero='michaela';e.C().warm();const n3=e.images.length-n0;
 const mine=e.images.slice(n0).map(i=>i.src);
 check('⑨ 미리 읽기: 지금 형상만 ≤4장, 같은 형상 두 번째는 0장, 바뀌면 다시',n1>=2&&n1<=4&&n2===n1&&n3>n2&&n3-n2<=4&&mine.slice(0,n1).every(s=>!/michaela|neon/.test(s)),JSON.stringify({n0,n1,n2,n3,mine}));}
// ⑪ R1244b Dots CX-0178CN 눈 클로즈업 4칸(2×2) 적용
const DOTS=['hwando','ego','persona','slayer','michaela','lauren','neon','seoha'];
check('⑪ Dots 눈 시트 8형상: eye.sheet = assets/r1244/eye-<형상>.webp(2×2) 파일 있음',DOTS.every(f=>{const e=API.profile(f).eye;return e.sheet&&e.sheet.path===`assets/r1244/eye-${f}.webp`&&e.sheet.cols===2&&e.sheet.rows===2&&fs.existsSync(path.join(root,'runtime-text',e.sheet.path));}),DOTS.map(f=>JSON.stringify(API.profile(f).eye.sheet)).join(' '));
/* R1244c: Dots 2차분으로 헌터·기억사수 눈 시트도 도착 → 10형상 모두 시트(예전 '헌터·기억사수는 초상화 그대로' 기대를 바꿈) */
check('⑪ R1244c 헌터·기억사수도 Dots 눈 시트(2×2) 파일 있음',['hunter','gunner'].every(f=>{const e=API.profile(f).eye;return e.sheet&&e.sheet.path===`assets/r1244/eye-${f}.webp`&&fs.existsSync(path.join(root,'runtime-text',e.sheet.path));}));
{const e=make({hero:'slayer'});e.C().play('slayer','awake');const c=e.el('r1244Cine');const eye=c.querySelector('.r1244eye');const seq=[];let t=0;
 while(t<1.7){seq.push(eye.getAttribute('data-frame'));e.adv(1/48);t+=1/48;}
 const uniq=seq.filter((v,i)=>v!==null&&v!==seq[i-1]);
 check('⑪ 각성: 눈 그림 = Dots 시트, 칸이 0→1→2→3 차례로',eye.getAttribute('data-src')==='assets/r1244/eye-slayer.webp'&&uniq.join('')==='0123',JSON.stringify({src:eye.getAttribute('data-src'),uniq}));
 check('⑪ 시트 칸은 px 로 덮기(cover) — backgroundSize 가 px 두 값',/^\d+(\.\d+)?px \d+(\.\d+)?px$/.test(eye.style.backgroundSize),eye.style.backgroundSize);}
{const e=make({hero:'neon'});e.C().play('neon','passive','storm');const eye=e.el('r1244Cine').querySelector('.r1244eye');const seq=[];let t=0;while(t<1.2){seq.push(eye.getAttribute('data-frame'));e.adv(1/48);t+=1/48;}
 const uniq=seq.filter((v,i)=>v!==null&&v!==seq[i-1]);check('⑪ 패시브도 0→1→2→3',uniq.join('')==='0123',JSON.stringify(uniq));}
{const e=make({hero:'neon',ls:{'storyworld.r1043.perf7':JSON.stringify({step:1})}});e.C().play('neon','awake');const eye=e.el('r1244Cine').querySelector('.r1244eye');const f0=eye.getAttribute('data-frame');e.adv(1);
 check('⑪ lite 는 칸 넘기기 없이 한 칸(발동 문양 2)',f0==='2'&&eye.getAttribute('data-frame')==='2',JSON.stringify({f0,f1:eye.getAttribute('data-frame')}));}
{const e=make({hero:'hunter'});e.C().play('hunter','passive','squad');const eye=e.el('r1244Cine').querySelector('.r1244eye');check('⑪ R1244c 헌터 패시브도 Dots 눈 시트(예전: 초상화 그대로)',eye.getAttribute('data-src')==='assets/r1244/eye-hunter.webp',eye.getAttribute('data-src'));}
{const e=make({hero:'neon'});const n0=e.images.length;e.sb.player.hero='hwando';e.C().warm();const got=e.images.slice(n0).map(i=>i.src);
 check('⑪ 미리 읽기: 시트가 있으면 시트(초상화 대신), 4장 이하',got.includes('assets/r1244/eye-hwando.webp')&&got.length<=4,JSON.stringify(got));}
{const r=require('child_process').spawnSync('python3',['-c',"import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert('RGB').resize((256,64))\nprint(max(max(p)-min(p) for p in im.getdata()))",path.join(root,'runtime-text','assets','r1244','eye-hwando.webp')],{encoding:'utf8'});
 check('⑪ 환도 눈 시트 = 먹+흰(채도 최대 12 이하)',r.status===0&&+r.stdout.trim()<=12,r.stdout+r.stderr);}
const man2=fs.readFileSync(path.join(root,'runtime-manifest.json'),'utf8');check('⑪ 눈 시트 8장 manifest 에 실림',DOTS.every(f=>man2.includes(`assets/r1244/eye-${f}.webp`)));
// ⑫ R1244c Dots CX-0178CN 2차분: 베기 시트 7종(4×3, 12칸) · 임팩트 정지 그림 10종(반전 흑백)
const SL=['gunner','hunter','lauren','michaela','neon','persona','slayer'];
check('⑫ 베기 7종: slash = assets/r1244/slash-<형상>.webp(4×3·12칸·4:1) 파일 있음',SL.every(f=>{const s=API.profile(f).slash;return s&&s.path===`assets/r1244/slash-${f}.webp`&&s.cols===4&&s.rows===3&&s.frames===12&&s.ar===4&&fs.existsSync(path.join(root,'runtime-text',s.path));}),SL.map(f=>JSON.stringify(API.profile(f).slash)).join(' '));
check('⑫ 환도·EGO 는 기존 먹 붓(r945)',['hwando','ego'].every(f=>/r945\/hwando-ink-sweep/.test(API.profile(f).slash.path)));
/* R1244c-2: Dots r2 — 서하 베기 도착(예전 기대 'HOLD 라 없음'을 바꿈), 베기 칸 비율 4:1 유지, 임팩트는 위 정렬(넓은 화면에서 머리 안 잘림) */
check('⑫ 서하 베기 = assets/r1244/slash-seoha.webp(4×3·12칸) 파일 있음',(()=>{const s=API.profile('seoha').slash;return s&&s.path==='assets/r1244/slash-seoha.webp'&&s.frames===12&&fs.existsSync(path.join(root,'runtime-text',s.path));})());
check('⑫ 베기 요소 = 가로 120vw·세로 30vw(칸 4:1 그대로, 찌그러짐 없음)',/\.r1244slash\{[^}]*width:120vw;height:30vw/.test(src),(src.match(/\.r1244slash\{[^}]*\}/)||[''])[0]);
{const e=make({hero:'seoha'});e.C().play('seoha','awake');const im=e.el('r1244Cine').querySelector('.r1244impact');
 check('⑫ 임팩트 위 정렬(background-position 50% 0%) — 1366×640 같은 넓은 화면에서 머리 위가 잘리지 않음',im.style.backgroundPosition==='50% 0%',im.style.backgroundPosition);}
check('⑫ 임팩트 10형상: impact = assets/r1244/impact-<형상>.webp 파일 있음',API.forms.every(f=>{const i=API.profile(f).impact;return i===`assets/r1244/impact-${f}.webp`&&fs.existsSync(path.join(root,'runtime-text',i));}),API.forms.map(f=>API.profile(f).impact).join(' '));
{const e=make({hero:'hunter'});e.C().play('hunter','awake');const im=e.el('r1244Cine').querySelector('.r1244impact');
 check('⑫ 각성 임팩트 = Dots 임팩트 그림(이미 반전해 구움 → 필터 없음)',im.getAttribute('data-src')==='assets/r1244/impact-hunter.webp'&&im.getAttribute('data-baked')==='1',JSON.stringify({src:im.getAttribute('data-src'),b:im.getAttribute('data-baked')}));
 const sl=e.el('r1244Cine').querySelector('.r1244slash');check('⑫ 헌터 각성: 베기 = Dots 헌터 베기 시트',sl.getAttribute('data-src')==='assets/r1244/slash-hunter.webp',sl.getAttribute('data-src'));}
{const e=make({hero:'neon',ls:{'storyworld.r1043.perf7':JSON.stringify({step:1})}});e.C().play('neon','awake');const im=e.el('r1244Cine').querySelector('.r1244impact');
 check('⑫ lite 는 임팩트 그림 안 받음',im.style.backgroundImage==='none',im.style.backgroundImage);}

// R1244d: 헌터 임팩트 r3(노출 없음, 15세 기준) — 입력표가 r3 를 고름
{const py=fs.readFileSync(path.join(root,'..','scripts','r1244-dots-r2.py'),'utf8');check("⑫ 입력표: 헌터 임팩트 = cx0178cn-r4 r3",/IMPACT_IN\[?['"]?hunter['"]?\]?\s*=\s*\(\s*'cx0178cn-r4'\s*,\s*'r3'\s*\)|'hunter'\s*:\s*\(\s*'cx0178cn-r4'\s*,\s*'r3'\s*\)/.test(py));}

// ⑩ 연결
const RT=path.join(root,'runtime-text'),html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
check('⑩ index.html 태그(samong-stagger-r1217 바로 뒤)',html.includes('<script src="./samong-stagger-r1217.js"></script>\n<script src="./cinema-cutin-r1244.js"></script>'));
check('⑩ runtime-text 사본 = client-source',fs.existsSync(path.join(RT,'cinema-cutin-r1244.js'))&&fs.readFileSync(path.join(RT,'cinema-cutin-r1244.js'),'utf8')===src);
const man=fs.readFileSync(path.join(root,'runtime-manifest.json'),'utf8');check('⑩ runtime-manifest 에 실림',man.includes('cinema-cutin-r1244.js'));
const vp=fs.readFileSync(path.join(root,'..','scripts','verify-r96-public.py'),'utf8');check('⑩ 공개 확인 목록',vp.includes("'cinema-cutin-r1244.js'"));
const yml=fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8');check('⑩ CI 검사 줄',yml.includes('node r96/qa/r1244/r1244-cpu-check.cjs'));
done();
