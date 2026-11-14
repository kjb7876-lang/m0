// R1021 CPU 검사: 전투 화면 집중(ui-combat-r1021.js) — 브라우저 없이 실제 모듈을 가짜 DOM 에서 돌린다.
//  ① 위쪽 황금실 줄 숨김(메뉴 묶음엔 남음) ② 정화 구슬 막대 이름표(survival-r600)·위쪽 중복 막대 숨김 ③ 폰 아래 단추 = 회피 + 영웅, 기술·EGO 는 자동
//  ④ 생존·영화에서 오른쪽 아래 상호작용 단추 숨김(이야기 모드는 남김) ⑤ 설정 맨 위 스킬창 + '전투 화면' 묶음(서사 자막·화면 단추·자동 발동)
//  ⑥ 끄면(storyworld.r1021.combat {"on":false}) 아무것도 안 함, 연결(태그·sync·공개 확인 목록·CI 줄).
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..','..');const FILE=path.join(root,'client-source','ui-combat-r1021.js');
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name+(ok||detail===''?'':' :: '+detail));};
const done=()=>{const failed=results.filter(r=>!r.ok).length;console.log(JSON.stringify({total:results.length,failed,method:'node vm + tiny fake DOM; layout/CSS measured separately by r1021-browser.mjs (headless)'}));process.exit(failed?1:0);};
check('ui-combat-r1021.js exists',fs.existsSync(FILE));if(!fs.existsSync(FILE))done();
const src=fs.readFileSync(FILE,'utf8');
// ---- 아주 작은 가짜 DOM ----
class El{constructor(tag,doc){this.tagName=tag.toUpperCase();this.ownerDocument=doc;this.children=[];this.parentNode=null;this.attrs={};this.dataset={};this.style={};this._text='';this.disabled=false;this.hidden=false;this.open=false;this.onclick=null;
 const cls=new Set();this.classList={add:(...c)=>c.forEach(x=>cls.add(x)),remove:(...c)=>c.forEach(x=>cls.delete(x)),contains:c=>cls.has(c),toggle:(c,v)=>{const want=v===undefined?!cls.has(c):!!v;if(want)cls.add(c);else cls.delete(c);return want;}};this._cls=cls;}
 get className(){return [...this._cls].join(' ');}set className(v){this._cls.clear();String(v).split(/\s+/).filter(Boolean).forEach(c=>this._cls.add(c));}
 get id(){return this.attrs.id||'';}set id(v){this.attrs.id=v;}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}set textContent(v){this.children.forEach(c=>c.parentNode=null);this.children=[];this._text=String(v);}
 set innerHTML(v){this.children=[];this._text='';const re=/<(\w+)[^>]*><\/\1>/g;let m;while((m=re.exec(v)))this.appendChild(new El(m[1],this.ownerDocument));}
 get firstChild(){return this.children[0]||null;}get lastChild(){return this.children[this.children.length-1]||null;}
 get firstElementChild(){return this.firstChild;}get lastElementChild(){return this.lastChild;}
 setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}
 _detach(){if(this.parentNode){const p=this.parentNode;p.children=p.children.filter(c=>c!==this);this.parentNode=null;}}
 appendChild(c){c._detach();c.parentNode=this;this.children.push(c);return c;}append(...cs){cs.forEach(c=>this.appendChild(c));}
 prepend(c){c._detach();c.parentNode=this;this.children.unshift(c);return c;}
 insertBefore(c,ref){c._detach();c.parentNode=this;const i=this.children.indexOf(ref);if(i<0)this.children.push(c);else this.children.splice(i,0,c);return c;}
 contains(o){for(let x=o;x;x=x.parentNode)if(x===this)return true;return false;}
 click(){this.ownerDocument.clicks.push(this.id||this.textContent);if(this.onclick)this.onclick();}
 _all(){const out=[];const w=e=>{for(const c of e.children){out.push(c);w(c);}};w(this);return out;}
 matches(sel){return sel.split(',').some(s=>match1(this,s.trim()));}
 querySelectorAll(sel){let scope=false;if(sel.startsWith(':scope>')){scope=true;sel=sel.slice(7);}const pool=scope?this.children:this._all();return pool.filter(e=>e.matches(sel));}
 querySelector(sel){return this.querySelectorAll(sel)[0]||null;}
 compareDocumentPosition(o){const all=this.ownerDocument.body._all();return all.indexOf(o)<all.indexOf(this)?2:4;}}
function match1(e,s){// 지원: tag, #id, .cls, tag.cls, [data-x="y"], 'a>b' 는 마지막만, '.r339Grid>button'
 const parts=s.split('>');const last=parts.pop().trim();if(!simple(e,last))return false;if(parts.length){return !!e.parentNode&&e.parentNode.tagName&&simple(e.parentNode,parts.pop().trim());}return true;}
function simple(e,s){const m=/^([a-z0-9]+)?(#[\w-]+)?((?:\.[\w-]+)*)(\[[^\]]+\])?$/i.exec(s);if(!m)throw Error('selector '+s);
 if(m[1]&&e.tagName!==m[1].toUpperCase())return false;if(m[2]&&e.id!==m[2].slice(1))return false;for(const c of (m[3]||'').split('.').filter(Boolean))if(!e.classList.contains(c))return false;
 if(m[4]){const a=/\[([\w-]+)(?:="([^"]*)")?\]/.exec(m[4]);const key=a[1].startsWith('data-')?a[1].slice(5).replace(/-(\w)/g,(_,x)=>x.toUpperCase()):a[1];const v=a[1].startsWith('data-')?e.dataset[key]:e.attrs[a[1]];if(a[2]===undefined?v===undefined:v!==a[2])return false;}return true;}
// 가짜 DOM 보탬(이 검사에 필요한 것만)
Object.defineProperty(El.prototype,'nextElementSibling',{get(){const p=this.parentNode;if(!p)return null;const i=p.children.indexOf(this);return p.children[i+1]||null;}});
El.prototype.removeChild=function(c){c._detach();return c;};
Object.defineProperty(El.prototype,'isConnected',{get(){for(let x=this;x;x=x.parentNode)if(x===this.ownerDocument.body||x===this.ownerDocument.head)return true;return false;}});
function make({ls={},mobile=false,game={}}={}){const doc={clicks:[]};doc.createElement=t=>new El(t,doc);doc.body=new El('body',doc);doc.head=new El('head',doc);doc.documentElement=doc.body;
 doc.getElementById=id=>[...doc.head._all(),...doc.body._all()].find(e=>e.id===id)||null;doc.querySelector=s=>doc.body.querySelector(s);
 const timers=[],intervals=[];const calls={special:0,ego:0,heroes:0,toast:[]};
 const sb={console,Math,JSON,Object,Array,Set,Map,String,Number,Boolean,Error,document:doc,
  localStorage:{getItem:k=>k in ls?ls[k]:null,setItem:(k,v)=>{ls[k]=String(v);}},setTimeout:(f)=>{timers.push(f);return timers.length;},setInterval:(f)=>{intervals.push(f);return intervals.length;},
  __STORYWORLD_MOBILE_R63__:{isMobile:()=>mobile},urlFor:p=>'./'+p,toast:(t)=>calls.toast.push(t)};sb.window=sb;
 sb.started=true;sb.loading=false;sb.modal=false;sb.storyScene=null;
 sb.player={hero:'hwando',hp:100,specialCD:3,egoCD:2,ego:0,samong:0,resonance:10,blinkCD:0,upgrades:{power:2}};
 sb.HEROES={hwando:{name:'환도',type:'blade',range:3.15,resource:'검의 기세',passive:'세 번째 베기에 정화 검파가 일어난다.',special:'정화 연참'}};
 sb.UPGRADES=[{id:'vital',name:'단단한 자아',max:6},{id:'power',name:'선명한 의지',max:8}];
 sb.enemies=[{x:3,y:0}];sb.nearestEnemy=r=>sb.enemies.find(e=>Math.hypot(e.x,e.y)<=r)||null;
 sb.special=function(){if(!sb.started||sb.modal||sb.player.specialCD>0)return;sb.player.specialCD=10;calls.special++;};
 sb.ego=function(){if(sb.player.egoCD>0||sb.player.ego>0)return;if(sb.player.resonance<30){sb.toast('EGO 각성에는 공명 30이 필요합니다.');return;}sb.player.resonance-=30;sb.player.ego=3;sb.player.egoCD=6;calls.ego++;};
 sb.__STORYWORLD_HERO_SELECT_R263__={canOpen:()=>!sb.modal,open:()=>{calls.heroes++;}};
 sb.__STORYWORLD_SEMI_AUTO_R705__={enabled:()=>true};
 sb.showSettings=function(){const panel=doc.getElementById('panel')||doc.body.appendChild(Object.assign(doc.createElement('section'),{id:'panel'}));panel.children.forEach(c=>c.parentNode=null);panel.children=[];
  panel.append(mk(doc,'button','settingsClose','close','닫기'),mk(doc,'div','','eyebrow','PRESENTATION / AUDIO'),mk(doc,'h2','','','환경 설정'),mk(doc,'div','','settings',''),mk(doc,'section','quickSettingsR114','',''));};
 Object.assign(sb,game);
 vm.createContext(sb);vm.runInContext(src,sb,{filename:'ui-combat-r1021.js'});
 const flush=()=>{while(timers.length)timers.shift()();};return {sb,doc,flush,calls,ls,intervals,api:sb.__STORYWORLD_UI_COMBAT_R1021__};}
const mk=(doc,tag,id,cls,text)=>{const e=doc.createElement(tag);if(id)e.id=id;if(cls)e.className=cls;if(text)e.textContent=text;return e;};
function touchDom(doc){const box=mk(doc,'div','touchActionsR100','on');doc.body.appendChild(box);for(const l of['회피','기술','EGO']){const b=mk(doc,'button','','',l);b.setAttribute('aria-label',l);box.appendChild(b);}return box;}
const api0=make().api;
// ① ② ④ CSS
{const C=api0.CSS;
 check('① 위쪽 황금실 제작·연속 줄 숨김',/body\.r1021On #goldHudR72\{display:none!important\}/.test(C));
 check('② 생존 위쪽 HUD 의 구슬 막대(중복) 숨김, 글줄(.s)은 남김',/body\.r1021On\.r600On #r600Hud \.c\{display:none!important\}/.test(C)&&!/#r600Hud \.s\{display:none/.test(C));
 check('④ 오른쪽 아래 상호작용 단추: 생존·영화에서만 숨김(이야기 모드 규칙 없음)',/body\.r1021On\.r600On #touchUse/.test(C)&&/body\.r1021On\.r370Cinema #touchUse/.test(C)&&!/(^|[,}\n])body\.r1021On #touchUse/.test(C));
 check('서사 자막 끄면 생존·영화 자막 숨김',/body\.r1021On\.r1021SubsOff #r600Subs/.test(C)&&/body\.r1021On\.r1021SubsOff #r370Subs/.test(C));
 check('③ 화면 단추 끄면 아래 동그라미 모두 숨김, 자동이면 기술·EGO 단추 숨김',/body\.r1021On\.r1021BtnOff #touchActionsR100\{display:none!important\}/.test(C)&&/r1021Auto #touchActionsR100 button\[data-r1021="special"\]/.test(C)&&/r1021Auto #touchActionsR100 button\[data-r1021="ego"\]/.test(C));
 check('폰: 자막 상자를 동그라미 왼쪽으로 좁힘(화면 단추 끄면 원래대로)',/body\.r1021On\.mobile-live-r63:not\(\.r1021BtnOff\) #r600Subs/.test(C)&&/width:calc\(100vw - 108px\)/.test(C));
 check('설정 창이 열린 동안 생존 위쪽 글줄 숨김(창 제목을 덮지 않음)',/body\.r1021On\.r600Modal:has\(#r1021Skills\) #r600Hud\{display:none!important\}/.test(C));
 check('회피(blink) 단추는 어떤 규칙으로도 숨기지 않음(화면 단추 끄기 빼고)',!/data-r1021="blink"\]\{display:none/.test(C)&&!/data-r1021="blink"\][^{]*\{display:none/.test(C));}
// ③ 폰 단추
{const {doc,api,flush}=make({mobile:true});const box=touchDom(doc);api.apply();flush();api.apply();
 const bs=box.children;check('③ 기존 단추에 이름표(회피=blink·기술=special·EGO=ego)',bs[0].dataset.r1021==='blink'&&bs[1].dataset.r1021==='special'&&bs[2].dataset.r1021==='ego');
 const heroes=box.querySelectorAll('#r1021Hero');check('③ 영웅 단추 하나(두 번 돌려도 하나)',heroes.length===1&&box.lastElementChild===heroes[0]&&heroes[0].getAttribute('aria-label')==='영웅',String(heroes.length));
 check('③ 영웅 단추 그림 = 지금 영웅 초상화',heroes[0].querySelector('img').src==='./assets/r108/heroes/hwando.webp',heroes[0].querySelector('img').src);
 check('자동 켜짐 + 폰이면 body.r1021Auto',doc.body.classList.contains('r1021Auto')&&doc.body.classList.contains('r1021On'));}
{const {doc,api,calls,sb}=make({mobile:true});touchDom(doc);api.apply();doc.getElementById('r1021Hero').click();
 check('③ 영웅 단추 누르면 영웅 선택창(R263) 열기',calls.heroes===1);
 sb.modal=true;doc.getElementById('r1021Hero').click();check('③ 열 수 없을 때는 쪽지만(창 안 염)',calls.heroes===1&&calls.toast.length===1);}
{const {doc,api,calls,sb}=make({mobile:true});let opens=0;sb.__STORYWORLD_HERO_DEFENSE_R720__={enabled:()=>true,open:()=>{opens++;return true;}};doc.body.classList.add('r600On');touchDom(doc);api.apply();
 const h=doc.getElementById('r1021Hero');check('③ 무한 생존: 단추 이름 "배치"(aria 영웅 배치)',h.querySelector('span').textContent==='배치'&&h.getAttribute('aria-label')==='영웅 배치');
 h.click();check('③ 무한 생존: 누르면 영웅 배치 창(R720, PC 의 I 키와 같음)',opens===1&&calls.heroes===0&&api.inspect().stats.placeOpen===1);
 doc.body.classList.remove('r600On');api.apply();check('③ 생존이 아니면 다시 "영웅"(선택창)',h.querySelector('span').textContent==='영웅');}
// 자동 발동
{const {api,calls,sb}=make({mobile:true});
 check('자동: 재사용 중이면 안 부름',api.autoTick()===0&&calls.special===0);
 sb.player.specialCD=0;check('자동: 기술(Q) 재사용 끝 + 적 8칸 안 → 저절로',api.autoTick()===1&&calls.special===1&&api.inspect().stats.autoSpecial===1);
 sb.player.egoCD=0;check('자동: 공명 30 미만이면 EGO 를 부르지 않음(쪽지 없음)',api.autoTick()===0&&calls.ego===0&&calls.toast.length===0);
 sb.player.resonance=45;check('자동: 공명 30 이상이면 EGO(F) 저절로',api.autoTick()===1&&calls.ego===1&&api.inspect().stats.autoEgo===1);
 sb.player.specialCD=0;sb.enemies=[{x:20,y:0}];check('자동: 가까운 적 없으면 안 씀',api.autoTick()===0&&calls.special===1);
 sb.enemies=[{x:2,y:1}];sb.modal=true;check('자동: 창이 열려 있으면 안 씀',api.autoTick()===0);sb.modal=false;
 sb.storyScene={};check('자동: 서사 장면 중이면 안 씀',api.autoTick()===0);sb.storyScene=null;
 sb.document.body.classList.add('r370Cinema');check('자동: 영화 모드는 영화 쪽 자동에 맡김',api.autoTick()===0);sb.document.body.classList.remove('r370Cinema');
 api.set('autoSkills',false);check('자동 발동 끄면 안 씀 + body.r1021Auto 꺼짐',api.autoTick()===0&&!sb.document.body.classList.contains('r1021Auto'));
 api.set('autoSkills',true);check('다시 켜면 씀',api.autoTick()===1);}
{const {api,calls,sb}=make({mobile:false});sb.player.specialCD=0;sb.player.egoCD=0;sb.player.resonance=60;
 check('자동: PC 는 쓰지 않음(Q·F 직접)',api.autoTick()===0&&calls.special===0&&calls.ego===0);
 check('PC 는 body.r1021Auto 없음',!sb.document.body.classList.contains('r1021Auto'));}
check('자동 발동은 200ms 마다 도는 interval 로 걸림',make({mobile:true}).intervals.length>=2);
// ⑤ 설정
for(const mob of[false,true]){const T=mob?'폰':'PC';const {doc,sb,flush,ls}=make({mobile:mob});sb.showSettings();flush();
 const panel=doc.getElementById('panel'),h2=panel.querySelector('h2'),sk=doc.getElementById('r1021Skills'),sec=doc.getElementById('combatScreenR1021');
 check(`⑤ ${T} 설정: 제목 바로 아래 스킬창, 그 아래 '전투 화면'`,sk&&h2.nextElementSibling===sk&&sk.nextElementSibling===sec);
 const tx=sk?sk.textContent:'';check(`⑤ ${T} 스킬창: 영웅·Q 기술·패시브·EGO·회피·강화`,['환도','정화 연참','세 번째 베기','EGO','회피','선명한 의지 2/8'].every(w=>tx.includes(w)),tx.slice(0,200));
 check(`⑤ ${T} 스킬창: 기본 공격은 근거리·사거리로(엔진 내부 이름 blade 를 그대로 쓰지 않음)`,/근거리 · 사거리 3\.[12]칸/.test(tx)&&!/blade/.test(tx),tx.slice(0,120));
 check(`⑤ ${T} 스킬창: 무엇이 자동인지(반자동 켜짐 → 기본 공격 자동)`,/기본 공격[^]*자동/.test(tx));
 if(mob)check('⑤ 폰 스킬창: Q·F 는 자동이라 적힘',/정화 연참[^]*자동/.test(tx)&&/EGO 각성[^]*자동/.test(tx));
 else check('⑤ PC 스킬창: Q·F 는 키로 직접',/Q 키/.test(tx)&&/F 키/.test(tx));
 const keys=sec?sec.querySelectorAll('input').map(i=>i.dataset.r1021):[];
 check(`⑤ ${T} '전투 화면' 묶음 = ${mob?'서사 자막·화면 단추·자동 발동':'서사 자막'}`,sec&&sec.querySelector('h3').textContent==='전투 화면'&&JSON.stringify(keys)===JSON.stringify(mob?['subs','buttons','autoSkills']:['subs']),JSON.stringify(keys));
 const subs=sec.querySelector('input');subs.checked=false;subs.onchange();
 check(`④ ${T} 서사 자막 끄기 → body.r1021SubsOff + 저장`,doc.body.classList.contains('r1021SubsOff')&&JSON.parse(ls['storyworld.r1021.combat']).subs===false);
 subs.checked=true;subs.onchange();check(`④ ${T} 서사 자막 다시 켜기`,!doc.body.classList.contains('r1021SubsOff'));
 {const other=mk(doc,'div','autoMoveR1022','r1021-row','자동 순간이동');sec.appendChild(other);sb.__STORYWORLD_UI_COMBAT_R1021__.settings();check(`⑤ ${T} 다른 덧씌움이 묶음에 붙인 줄(R1022)은 다시 그려도 남음`,doc.getElementById('autoMoveR1022')&&doc.getElementById('autoMoveR1022').parentNode===sec&&sec.querySelectorAll('h3').length===1);}
 sb.showSettings();flush();check(`⑤ ${T} 설정을 다시 열어도 스킬창·묶음 하나씩`,panel.querySelectorAll('#r1021Skills').length===1&&panel.querySelectorAll('#combatScreenR1021').length===1);}
{const {doc,api,flush}=make({mobile:true});doc.body.appendChild(mk(doc,'section','panel'));doc.getElementById('panel').append(mk(doc,'h2','','','메뉴'));api.settings();flush();
 check('⑤ 설정 창이 아니면 스킬창을 넣지 않음',!doc.getElementById('r1021Skills'));}
{const {doc,api}=make({mobile:true});api.set('buttons',false);check('③ 화면 단추 끄기 → body.r1021BtnOff',doc.body.classList.contains('r1021BtnOff'));}
// 저장된 설정 읽기·끄기
{const {api,doc}=make({mobile:true,ls:{'storyworld.r1021.combat':JSON.stringify({subs:false,buttons:true,autoSkills:false})}});
 check('저장된 설정을 읽음',api.prefs().subs===false&&api.prefs().autoSkills===false&&doc.body.classList.contains('r1021SubsOff'));}
{const {api,doc,sb,flush,calls}=make({mobile:true,ls:{'storyworld.r1021.combat':JSON.stringify({on:false})}});const box=touchDom(doc);api.apply();sb.player.specialCD=0;sb.showSettings();flush();
 check('끄면({"on":false}) 아무것도 안 바꿈',!doc.body.classList.contains('r1021On')&&!doc.getElementById('r1021Hero')&&!doc.getElementById('r1021Skills')&&api.autoTick()===0&&calls.special===0&&!box.children[0].dataset.r1021);}
// ② survival-r600 이름표
{const sv=fs.readFileSync(path.join(root,'client-source','survival-r600.js'),'utf8');
 check('② 생존 구슬 막대: R1021 이 켜지면 더 크게 + "정화 구슬 n/m" 글',/__STORYWORLD_UI_COMBAT_R1021__\?\.on\?\.\(\)/.test(sv)&&/coreLabelText='정화 구슬 '\+cur\+'\/'\+mx/.test(sv)&&/ctx\.fillText\(coreLabelText/.test(sv));
 check('② 이름표 숫자는 유한값으로 거름(NaN 이 그리기에 안 들어감)',/Number\.isFinite\(\+S\.core\.hp\)/.test(sv)&&/Number\.isFinite\(\+st\.max\)/.test(sv));
 let parsed=true,perr='';try{new Function(sv);}catch(e){parsed=false;perr=String(e.message);}check('② survival-r600.js 가 문법 오류 없이 읽힘(이름 겹침 없음)',parsed,perr);
 check('② inspect 에 coreLabel 수·글',/coreLabel:0/.test(sv)&&/lastError,coreLabelText,/.test(sv));}
// 간이 체력바는 모두 발밑(사용자 2026-11-14 "체력바 다 아래에")
{const v=fs.readFileSync(path.join(root,'client-source','visual-r90.js'),'utf8'),idx=fs.readFileSync(path.join(root,'runtime-text','index.html'),'utf8'),sv=fs.readFileSync(path.join(root,'client-source','survival-r600.js'),'utf8');
 check('간이 체력바: R1021 이 켜지면 고른 적의 머리 위 막대(R90)를 그리지 않음',/__STORYWORLD_UI_COMBAT_R1021__\?\.on\?\.\(\)[^]{0,80}if\(under\)\{stats\.targetBarUnder/.test(v));
 check('간이 체력바: 엔진 몹·보스 막대는 발밑(q.y+8), 고른 적도 포함',/if\(e\.boss\|\|e\.hp<e\.maxHp\|\|e\.id===target\)\{const width=\(e\.boss\?82:44\)\*zoom,barY=q\.y\+8\*zoom/.test(idx));
 check('간이 체력바: 정화 구슬 막대는 바닥점 아래(top=q.y+ah*.3)',/const top=q\.y\+ah\*\.3;/.test(sv));}
// 연결
{const idx=fs.readFileSync(path.join(root,'runtime-text','index.html'),'utf8');
 check('태그 한 번, UI 정리 R1015 바로 뒤',idx.split('"./ui-combat-r1021.js"').length===2&&/<script src="\.\/ui-clean-r1015\.js"><\/script>\n<script src="\.\/ui-combat-r1021\.js"><\/script>/.test(idx));
 const rt=path.join(root,'runtime-text','ui-combat-r1021.js');check('runtime-text 사본이 같음(sync)',fs.existsSync(rt)&&fs.readFileSync(rt,'utf8')===src);
 check('runtime-inputs·manifest 에 들어감',fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8').includes('"ui-combat-r1021.js"')&&fs.readFileSync(path.join(root,'runtime-manifest.json'),'utf8').includes('"ui-combat-r1021.js"'));
 check('공개 확인 목록에 들어감',fs.readFileSync(path.join(root,'..','scripts','verify-r96-public.py'),'utf8').includes("'ui-combat-r1021.js'"));
 check('CI 줄',fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8').includes('node r96/qa/r1021/r1021-cpu-check.cjs'));}
done();
