// R1292 CPU 검사: 수동 조작에서도 EGO(F) 자동 발동 켜고 끄기(ego-auto-r1292.js) — 사용자 2026-11-21 "수동조작에서도 에고(f)자동발동 설정에서 키고끌수 있게 해주고 기본적으로 자동발동되게".
//  ① 연결 5곳 ② 기본 켜짐·저장값(0/1/이상값) ③ PC·수동(엔진 auto=false)에서 공명 30 이상 + 8칸 안 적이면 F 저절로
//  ④ 경계·회귀: 공명 29/30, 적 8칸 경계, 재사용·EGO 중·사몽 각성·장면·창·영화·사망이면 안 씀(쪽지도 없음)
//  ⑤ 끄면 안 씀 + 저장 '0' + body.r1292EgoOff, 폰 F 단추 다시 보임 ⑥ 폰 R1021 '기술·EGO 자동'과 겹치지 않음·끄면 R1021 의 F 도 멈춤
//  ⑦ 설정 '전투 화면' 묶음에 한 줄(PC·폰), 두 번 열어도 한 줄 ⑧ 엔진 함수(ego·tick·auto)를 덮어쓰지 않음.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..','..'),ROOT=path.resolve(root,'..');const F='ego-auto-r1292.js',FILE=path.join(root,'client-source',F);
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name+(ok||detail===''?'':' :: '+detail));};
const done=()=>{const failed=results.filter(r=>!r.ok).length;console.log(JSON.stringify({total:results.length,failed,method:'node vm + tiny fake DOM (headless browser check separate)'}));process.exit(failed?1:0);};
check(F+' exists',fs.existsSync(FILE));if(!fs.existsSync(FILE))done();
const src=fs.readFileSync(FILE,'utf8'),src1021=fs.readFileSync(path.join(root,'client-source','ui-combat-r1021.js'),'utf8');
// ① 연결 5곳
check('① runtime-text 사본 같음',fs.existsSync(path.join(root,'runtime-text',F))&&fs.readFileSync(path.join(root,'runtime-text',F),'utf8')===src);
check('① runtime-text ui-combat-r1021.js 사본 같음',fs.readFileSync(path.join(root,'runtime-text','ui-combat-r1021.js'),'utf8')===src1021);
const html=fs.readFileSync(path.join(root,'runtime-text/index.html'),'utf8');
check('① index.html 한 번, ui-tap-r1291 바로 뒤',html.split('"./'+F+'"').length===2&&/<script src="\.\/ui-tap-r1291\.js"><\/script>\n<script src="\.\/ego-auto-r1292\.js"><\/script>\n/.test(html));
check('① verify-r96-public 기대 목록',fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"));
check('① pages.yml 이 이 검사를 돌림',fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('r96/qa/r1292/r1292-cpu-check.cjs'));
check('① runtime-inputs 목록',fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8').includes(F));
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
const mk=(doc,tag,id,cls,text)=>{const e=doc.createElement(tag);if(id)e.id=id;if(cls)e.className=cls;if(text)e.textContent=text;return e;};
function make({ls={},mobile=false,game={},with1021=false}={}){const doc={clicks:[]};doc.createElement=t=>new El(t,doc);doc.body=new El('body',doc);doc.head=new El('head',doc);doc.documentElement=doc.body;
 doc.createTextNode=t=>{const e=new El('#text',doc);e._text=String(t);return e;};
 doc.getElementById=id=>[...doc.head._all(),...doc.body._all()].find(e=>e.id===id)||null;doc.querySelector=s=>doc.body.querySelector(s);
 const timers=[],intervals=[];const calls={special:0,ego:0,toast:[]};
 const sb={console,Math,JSON,Object,Array,Set,Map,String,Number,Boolean,Error,document:doc,
  localStorage:{getItem:k=>k in ls?ls[k]:null,setItem:(k,v)=>{ls[k]=String(v);}},setTimeout:(f)=>{timers.push(f);return timers.length;},setInterval:(f)=>{intervals.push(f);return intervals.length;},
  __STORYWORLD_MOBILE_R63__:{isMobile:()=>mobile},urlFor:p=>'./'+p,toast:(t)=>calls.toast.push(t)};sb.window=sb;
 sb.started=true;sb.loading=false;sb.modal=false;sb.storyScene=null;sb.auto=false;sb.guide=false;
 sb.player={hero:'hwando',hp:100,specialCD:3,egoCD:0,ego:0,samong:0,resonance:45,blinkCD:0,upgrades:{}};
 sb.HEROES={hwando:{name:'환도',range:3.15,special:'정화 연참'}};sb.UPGRADES=[];
 sb.enemies=[{x:3,y:0}];sb.nearestEnemy=r=>sb.enemies.find(e=>Math.hypot(e.x,e.y)<=r)||null;
 sb.special=function(){if(sb.player.specialCD>0)return;sb.player.specialCD=10;calls.special++;};
 sb.ego=function(){if(sb.player.egoCD>0||sb.player.ego>0)return;if(sb.player.resonance<30){sb.toast('EGO 각성에는 공명 30이 필요합니다.');return;}sb.player.resonance-=30;sb.player.ego=3;sb.player.egoCD=6;calls.ego++;};
 // 엔진 안 자동 스킬(R63 settings.autoSkill·폰, 반자동 공명 60)은 tick 안에서 ego() 를 부른다 — 흉내
 sb.engineAutoEgo=false;sb.tick=function(dt){if(sb.tickThrow)throw Error('boom');if(sb.engineAutoEgo)sb.ego();return 'tick:'+dt;};
 sb.showSettings=function(){const panel=doc.getElementById('panel')||doc.body.appendChild(Object.assign(doc.createElement('section'),{id:'panel'}));panel.children.forEach(c=>c.parentNode=null);panel.children=[];
  panel.append(mk(doc,'h2','','','환경 설정'),mk(doc,'section','quickSettingsR114','',''));};
 Object.assign(sb,game);
 vm.createContext(sb);
 if(with1021)vm.runInContext(src1021,sb,{filename:'ui-combat-r1021.js'});
 vm.runInContext(src,sb,{filename:F});
 const flush=()=>{while(timers.length)timers.shift()();};return {sb,doc,flush,calls,ls,intervals,api:sb.__STORYWORLD_EGO_AUTO_R1292__,a1021:sb.__STORYWORLD_UI_COMBAT_R1021__};}
// ② 기본값·저장값
{const {api,intervals}=make();check('② API 있음',!!api&&typeof api.autoTick==='function'&&typeof api.enabled==='function'&&typeof api.set==='function');if(!api)done();
 check('② 저장값 없으면 기본 켜짐',api.enabled()===true);check('② 주기 검사 등록(200ms 박자)',intervals.length>=1);}
check("② 저장 '0' → 꺼짐",make({ls:{'storyworld.r1292.egoAuto':'0'}}).api.enabled()===false);
check("② 저장 '1' → 켜짐",make({ls:{'storyworld.r1292.egoAuto':'1'}}).api.enabled()===true);
check('② 이상한 저장값 → 기본 켜짐',make({ls:{'storyworld.r1292.egoAuto':'garbage'}}).api.enabled()===true);
// ③ PC·수동 조작에서 F 저절로
{const {api,calls,sb}=make();check('③ PC·수동(auto=false·guide=false) + 공명 45 + 적 3칸 → EGO 1번',api.autoTick()===1&&calls.ego===1&&sb.player.ego>0&&api.inspect().stats.fired===1);
 check('③ 이미 EGO 중이면 다시 안 부름',api.autoTick()===0&&calls.ego===1);}
{const {api,calls}=make({game:{auto:true}});check('③ 반자동(auto=true)에서도 켜져 있으면 씀',api.autoTick()===1&&calls.ego===1);}
// ④ 경계·회귀
const no=(name,game,pl,extra)=>{const m=make({game});Object.assign(m.sb.player,pl||{});if(extra)extra(m);const n=m.api.autoTick();check('④ '+name,n===0&&m.calls.ego===0&&m.calls.toast.length===0,JSON.stringify({n,ego:m.calls.ego,toast:m.calls.toast}));};
no('공명 29 → 안 부름(쪽지 없음)',{},{resonance:29});
{const m=make();m.sb.player.resonance=30;check('④ 공명 정확히 30 → 씀',m.api.autoTick()===1&&m.calls.ego===1);}
{const m=make({game:{enemies:[{x:8,y:0}]}});check('④ 적이 정확히 8칸 → 씀',m.api.autoTick()===1);}
no('적이 8.01칸 → 안 씀',{enemies:[{x:8.01,y:0}]});
no('적 없음 → 안 씀',{enemies:[]});
no('EGO 재사용 남음 → 안 씀',{},{egoCD:.1});
no('사몽 각성 중 → 안 씀',{},{samong:2});
no('창 열림(modal) → 안 씀',{modal:true});
no('이야기 장면 → 안 씀',{storyScene:{}});
no('불러오는 중 → 안 씀',{loading:true});
no('시작 전 → 안 씀',{started:false});
no('영웅 쓰러짐 → 안 씀',{},{hp:0});
no('영화 모드 → 안 씀',{},null,m=>m.doc.body.classList.add('r370Cinema'));
// ⑤ 끄기
{const m=make();m.api.set(false);check("⑤ set(false) → 저장 '0'·enabled false",m.ls['storyworld.r1292.egoAuto']==='0'&&m.api.enabled()===false);
 check('⑤ 꺼지면 공명·적이 있어도 안 씀',m.api.autoTick()===0&&m.calls.ego===0);
 check('⑤ 꺼지면 body.r1292EgoOff',m.doc.body.classList.contains('r1292EgoOff'));
 m.api.set(true);check("⑤ 다시 켜면 저장 '1'·씀·클래스 빠짐",m.ls['storyworld.r1292.egoAuto']==='1'&&m.api.autoTick()===1&&!m.doc.body.classList.contains('r1292EgoOff'));}
{const C=make().api.CSS;check('⑤ 꺼지면 폰 F 단추가 R1021 자동 숨김보다 우선해 다시 보임',/body\.r1021On\.r1021Auto\.r1292EgoOff #touchActionsR100 button\[data-r1021="ego"\]\{display:[a-z-]+!important\}/.test(C));}
// ⑥ R1021(폰 '기술·EGO 자동')과 함께
{const m=make({mobile:true,with1021:true});check('⑥ 폰 + R1021 자동 켜짐: F 는 R1021 이 쏘고 이쪽은 쉼(중복 없음)',m.api.autoTick()===0&&m.a1021.autoTick()>=1&&m.calls.ego===1&&m.a1021.inspect().stats.autoEgo===1);}
{const m=make({mobile:true,with1021:true,ls:{'storyworld.r1021.combat':JSON.stringify({subs:true,buttons:true,autoSkills:false})}});
 check('⑥ 폰 + R1021 자동 끔: 이쪽이 F 를 씀(기본 켜짐)',m.api.autoTick()===1&&m.calls.ego===1);}
{const m=make({mobile:true,with1021:true});m.api.set(false);m.sb.player.specialCD=0;const n=m.a1021.autoTick();
 check('⑥ 폰 + 이 설정 끔: R1021 은 Q 만 쓰고 F 는 안 씀',n===1&&m.calls.special===1&&m.calls.ego===0&&m.a1021.inspect().stats.autoEgo===0,JSON.stringify({n,c:m.calls}));}
{const m=make({mobile:false,with1021:true});check('⑥ PC + R1021: R1021 은 F 안 씀(폰 전용 그대로), 이쪽이 씀',m.a1021.autoTick()===0&&m.api.autoTick()===1&&m.calls.ego===1);}
// ⑦ 설정 줄
for(const mob of [false,true]){const T=mob?'폰':'PC';const m=make({mobile:mob,with1021:true});m.sb.showSettings();m.flush();
 const sec=m.doc.getElementById('combatScreenR1021'),row=m.doc.getElementById('egoAutoR1292'),box=m.doc.getElementById('egoAutoR1292Toggle');
 check(`⑦ ${T}: '전투 화면' 묶음 안에 EGO 자동 줄(r1021-row)`,!!sec&&!!row&&sec.contains(row)&&row.classList.contains('r1021-row'));
 check(`⑦ ${T}: 체크칸 기본 체크·글 'EGO(F) 자동 발동'`,!!box&&box.checked===true&&/EGO\(F\) 자동 발동/.test(row?row.textContent:''));
 if(box){box.checked=false;box.onchange&&box.onchange();}check(`⑦ ${T}: 체크 풀면 꺼지고 저장`,m.api.enabled()===false&&m.ls['storyworld.r1292.egoAuto']==='0');
 m.sb.showSettings();m.flush();check(`⑦ ${T}: 다시 열어도 줄 하나·저장값(꺼짐) 반영`,m.doc.body._all().filter(e=>e.id==='egoAutoR1292').length===1&&m.doc.getElementById('egoAutoR1292Toggle')?.checked===false);}
{const m=make();m.sb.showSettings();m.flush();const q=m.doc.getElementById('quickSettingsR114'),row=m.doc.getElementById('egoAutoR1292');check('⑦ R1021 없으면 간이설정(quickSettingsR114)에 붙음',!!row&&q.contains(row));}
// ⑧ 엔진 안 자동(폰 자동 스킬·반자동)의 F 도 이 설정을 따름 — tick 안에서 부른 ego() 만 막고, F 키·단추(tick 밖)는 그대로
{const m=make();m.sb.engineAutoEgo=true;check('⑧ 켜짐: tick 안 엔진 자동 F 그대로',m.sb.tick(.1)==='tick:0.1'&&m.calls.ego===1);}
{const m=make();m.api.set(false);m.sb.engineAutoEgo=true;const r=m.sb.tick(.1);
 check('⑧ 꺼짐: tick 안 엔진 자동 F 막음(반환값 그대로)',r==='tick:0.1'&&m.calls.ego===0&&m.sb.player.ego===0&&m.api.inspect().stats.blocked===1,JSON.stringify({r,c:m.calls,st:m.api.inspect().stats}));
 m.sb.ego();check('⑧ 꺼짐: tick 밖(F 키·EGO 단추) 직접 부름은 됨',m.calls.ego===1&&m.sb.player.ego>0);}
{const m=make();m.api.set(false);m.sb.tickThrow=true;let threw=false;try{m.sb.tick(.1);}catch(_){threw=true;}m.sb.tickThrow=false;m.sb.ego();
 check('⑧ tick 이 오류를 던져도 그대로 던지고, 그 뒤 직접 F 는 됨(깊이 되돌림)',threw&&m.calls.ego===1);}
{const m=make({mobile:true,with1021:true});m.api.set(false);m.sb.engineAutoEgo=true;m.sb.tick(.1);check('⑧ 폰 + 꺼짐: 엔진 자동 스킬 F 도 안 나감',m.calls.ego===0);}
// ⑨ 엔진 auto·special 은 덮어쓰지 않음
check('⑨ auto·special 재할당 없음',!/(^|[^.\w])(auto|special)\s*=[^=]/.test(src));
check('⑧ 엔진 반자동의 EGO(공명 60) 줄은 건드리지 않음(R1021 F 줄에만 R1292 확인 추가)',/__STORYWORLD_EGO_AUTO_R1292__/.test(src1021));
done();
