// R1037 CPU 검사: 서사 텍스트 항상 끄기(narration-r1037.js) — 브라우저 없이 실제 모듈을 가짜 DOM·가짜 엔진에서 돌린다.
//  사용자 2026-11-14 "보스입장할때 나오는 서사텍스트+기억조각에 나오는 서사텍스트 거기에 지금안쓰는 ui들 없애고 거기에 텍스트항상끄기 만들어서
//  항상끄기 누르면 보스방 입장시 바로입장및 앞으로 서사텍스트 안뜨도록 설정가서 키면 다시뜨고 기억조각도 마찬가지, 영화서사텍스트도 키고끄는거 잘되도록".
//  ① 서사 창(보스 입장 '전투 전'·진행 서사)에 '텍스트 항상 끄기' — 누르면 남은 장면을 엔진 그대로 넘기고(진행 done 1번), 다음 서사 창부터 안 뜸, 보스 이름 카드도 안 뜸.
//  ② 연결된 녹음이 없는 장면의 음성 단추(음성 재생·정지·상태 글·선택 음성 합성)는 숨김(안 쓰는 UI). 기억 책(journal:)에는 단추 없음.
//  ③ 기억 조각·쪽지 창(R177)에 '항상 끄기' — 누르면 창이 닫히고 다음부터 쪽지 모음에만. 1쪽짜리 창의 쓸모없는 ◀·쪽수·중복 ✕ 는 뺌.
//  ④ 설정 '전투 화면' 묶음에 서사 창·기억 조각 창 켜고 끄기 줄 — 켜면 다시 뜸. 옛 줄(R365·R182)과 서로 맞춰짐.
//  ⑤ 서사 자막 끄기(R1021)가 영화·컷신 글(R880 .cap·R568 자막)까지 숨김.
//  ⑥ 연결(태그·sync·공개 확인 목록·CI 줄).
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..','..');const CS=path.join(root,'client-source');const FILE=path.join(CS,'narration-r1037.js');
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name+(ok||detail===''?'':' :: '+detail));};
const done=()=>{const failed=results.filter(r=>!r.ok).length;console.log(JSON.stringify({total:results.length,failed,method:'node vm + tiny fake DOM; layout measured by r1037-browser.mjs (headless)'}));process.exit(failed?1:0);};
check('narration-r1037.js 가 있음',fs.existsSync(FILE));if(!fs.existsSync(FILE))done();
const src=fs.readFileSync(FILE,'utf8');
// ---- 아주 작은 가짜 DOM ----
class El{constructor(tag,doc){this.tagName=String(tag).toUpperCase();this.ownerDocument=doc;this.children=[];this.parentNode=null;this.attrs={};this.dataset={};this.style={};this._text='';this.disabled=false;this.hidden=false;this.checked=false;this.onclick=null;this.onchange=null;this.listeners={};
 const cls=new Set();this._cls=cls;this.classList={add:(...c)=>c.forEach(x=>cls.add(x)),remove:(...c)=>c.forEach(x=>cls.delete(x)),contains:c=>cls.has(c),toggle:(c,v)=>{const w=v===undefined?!cls.has(c):!!v;if(w)cls.add(c);else cls.delete(c);return w;}};}
 get className(){return [...this._cls].join(' ');}set className(v){this._cls.clear();String(v).split(/\s+/).filter(Boolean).forEach(c=>this._cls.add(c));}
 get id(){return this.attrs.id||'';}set id(v){this.attrs.id=String(v);}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}set textContent(v){this.children.forEach(c=>c.parentNode=null);this.children=[];this._text=String(v);}
 get firstChild(){return this.children[0]||null;}get firstElementChild(){return this.children[0]||null;}get lastElementChild(){return this.children[this.children.length-1]||null;}
 get nextElementSibling(){const p=this.parentNode;if(!p)return null;const i=p.children.indexOf(this);return p.children[i+1]||null;}get nextSibling(){return this.nextElementSibling;}
 setAttribute(k,v){if(k==='id')this.id=v;else if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-(\w)/g,(_,c)=>c.toUpperCase())]=String(v);else this.attrs[k]=String(v);}
 getAttribute(k){if(k==='id')return this.id||null;if(k.startsWith('data-')){const d=this.dataset[k.slice(5).replace(/-(\w)/g,(_,c)=>c.toUpperCase())];return d===undefined?null:d;}return this.attrs[k]??null;}
 _detach(){if(this.parentNode){const p=this.parentNode;p.children=p.children.filter(c=>c!==this);this.parentNode=null;}}
 appendChild(c){c._detach();c.parentNode=this;this.children.push(c);return c;}append(...cs){cs.forEach(c=>this.appendChild(c));}
 insertBefore(c,ref){if(!ref)return this.appendChild(c);c._detach();c.parentNode=this;const i=this.children.indexOf(ref);this.children.splice(i<0?this.children.length:i,0,c);return c;}
 removeChild(c){c._detach();return c;}remove(){this._detach();}
 _all(){const out=[];for(const c of this.children){out.push(c,...c._all());}return out;}
 _match(sel){sel=sel.trim();const m=sel.match(/^(\w+)?(#[\w-]+)?((?:\.[\w-]+)*)(\[data-([\w-]+)(?:="([^"]*)")?\])?$/);if(!m)throw Error('fake DOM: selector '+sel);
  if(m[1]&&this.tagName!==m[1].toUpperCase())return false;if(m[2]&&this.id!==m[2].slice(1))return false;for(const c of (m[3]||'').split('.').filter(Boolean))if(!this._cls.has(c))return false;
  if(m[4]){const v=this.getAttribute('data-'+m[5]);if(v===null)return false;if(m[6]!==undefined&&v!==m[6])return false;}return true;}
 querySelectorAll(sel){const parts=sel.split(',');return this._all().filter(e=>parts.some(p=>{const chain=p.trim().split(/\s+/);if(!e._match(chain[chain.length-1]))return false;let a=e.parentNode;for(let i=chain.length-2;i>=0;i--){while(a&&a._match&&!a._match(chain[i]))a=a.parentNode;if(!a||!a._match)return false;a=a.parentNode;}return true;}));}
 querySelector(sel){return this.querySelectorAll(sel)[0]||null;}
 closest(sel){let a=this;while(a&&a._match){if(a._match(sel))return a;a=a.parentNode;}return null;}
 addEventListener(t,f){(this.listeners[t]=this.listeners[t]||[]).push(f);}
 click(){const ev={target:this,stopPropagation(){this.stopped=true;},preventDefault(){},stopImmediatePropagation(){this.stopped=true;}};if(this.onclick)this.onclick(ev);for(const f of this.listeners.click||[])f(ev);let a=this.parentNode;while(a&&!ev.stopped){if(a.onclick)a.onclick(ev);a=a.parentNode;}}
 dispatchChange(){if(this.onchange)this.onchange({target:this});for(const f of this.listeners.change||[])f({target:this});let a=this.parentNode;while(a){for(const f of a.listeners.change||[])f({target:this});a=a.parentNode;}}}
function makeDoc(){const doc={};doc.documentElement=new El('html',doc);doc.head=new El('head',doc);doc.body=new El('body',doc);doc.documentElement.appendChild(doc.head);doc.documentElement.appendChild(doc.body);
 doc.createElement=t=>new El(t,doc);doc.createTextNode=t=>{const e=new El('#text',doc);e._text=String(t);return e;};
 doc.getElementById=id=>doc.documentElement._all().find(e=>e.id===id)||null;doc.querySelector=s=>doc.documentElement.querySelector(s);doc.querySelectorAll=s=>doc.documentElement.querySelectorAll(s);doc.addEventListener=()=>{};return doc;}
// ---- 가짜 엔진 + 둘레 모듈(R365·R177·R1021·R255) ----
function boot(opt={}){const doc=makeDoc();const store=new Map(Object.entries(opt.store||{}));const toasts=[];const timers=[];
 const ctx={document:doc,console,Math,JSON,Date,Promise,Set,Map,WeakMap,Array,Object,String,Number,Boolean,RegExp,Error,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
  setTimeout:(f)=>{timers.push(f);return timers.length;},clearTimeout(){},setInterval:()=>0,clearInterval(){},performance:{now:()=>Date.now()},
  toast:(m)=>toasts.push(String(m)),innerWidth:1280,innerHeight:720};
 ctx.window=ctx;ctx.globalThis=ctx;
 // 엔진: playScenes·advanceScene·openPanel·closePanel·showSettings(최상위 function 처럼 전역에서 다시 묶임)
 const eng={readScenes:new Set(),doneCalls:0,opened:0};ctx.__eng=eng;ctx.storyScene=null;ctx.storyQueue=[];ctx.storyDone=null;
 ctx.voiceManifest={scenes:opt.voiceRows||{},originals:{}};
 const panel=new El('section',doc);panel.id='panel';const modal=new El('div',doc);modal.id='modal';modal.appendChild(panel);doc.body.appendChild(modal);
 ctx.openPanel=html=>{panel.children=[];panel._text='';eng.opened++;ctx.modal=true;return html;};ctx.closePanel=()=>{panel.children=[];ctx.modal=false;};
 ctx.advanceScene=function(){if(ctx.storyScene)eng.readScenes.add(ctx.storyScene.key);ctx.storyScene=ctx.storyQueue.shift()||null;if(!ctx.storyScene){const d=ctx.storyDone;ctx.storyDone=null;ctx.closePanel(true);if(d){eng.doneCalls++;d();}return;}
  ctx.openPanel('story');const h=new El('h2',doc);h.textContent=ctx.storyScene.title;panel.appendChild(h);const tx=new El('div',doc);tx.className='storyText';tx.textContent=ctx.storyScene.text;panel.appendChild(tx);
  const foot=new El('div',doc);foot.className='storyFoot';for(const [id,t] of [['storyNext','계속 · Enter'],['storyAudio','음성 재생'],['storyAudioStop','음성 정지']]){const b=new El('button',doc);b.id=id;b.textContent=t;foot.appendChild(b);}
  const st=new El('small',doc);st.id='voiceStatus';foot.appendChild(st);const tts=new El('button',doc);tts.id='storyTTS';foot.appendChild(tts);panel.appendChild(foot);foot.querySelector('#storyNext').onclick=()=>ctx.advanceScene();};
 ctx.playScenes=function(scenes,done){ctx.storyQueue=scenes.slice();ctx.storyDone=done||null;ctx.storyScene=null;ctx.advanceScene();};
 ctx.showSettings=function(){ctx.openPanel('settings');const h=new El('h2',doc);h.textContent='환경 설정';panel.appendChild(h);
  // R1021 '전투 화면' 묶음 + 옛 줄(R365·R182)
  const sec=new El('section',doc);sec.id='combatScreenR1021';panel.appendChild(sec);const grid=new El('div',doc);grid.className='settings';panel.appendChild(grid);
  for(const id of ['r182Auto','r365GuideFrag','r365ManualFrag','r365SkipStory']){const l=new El('label',doc),c=new El('input',doc);c.type='checkbox';c.id=id;l.appendChild(c);grid.appendChild(l);
   c.checked=id==='r182Auto'?R177.prefs().autoShow!==false:id==='r365SkipStory'?!!R365.prefs().skipStory:R365.prefs()[id==='r365GuideFrag'?'show':'manual']!==false;
   c.onchange=()=>{if(id==='r182Auto')R177.set({autoShow:c.checked});else if(id==='r365SkipStory')R365.set({skipStory:c.checked});else R365.set({[id==='r365GuideFrag'?'show':'manual']:c.checked});};}};
 // R365(서사 창 넘기기): 실제 R365 처럼 advanceScene 을 감싸 skipStory 면 끝까지 넘긴다
 let p365={show:true,manual:true,skipStory:false,...(opt.p365||{})};const R365={set:p=>{p365={...p365,...p};return {...p365};},prefs:()=>({...p365})};
 if(!opt.no365){const base=ctx.advanceScene;ctx.advanceScene=function(...a){let r=base.apply(this,a);if(p365.skipStory&&ctx.storyScene&&!/^journal:/.test(ctx.storyScene.key)){let n=0;while(ctx.storyScene&&n++<200)r=base.apply(this,a);}return r;};ctx.__STORYWORLD_GUIDE_FRAGMENT_R365__=R365;}
 let p177={on:true,autoShow:true,pages:true,...(opt.p177||{})};const R177={set:p=>{p177={...p177,...p};return {...p177};},prefs:()=>({...p177})};if(!opt.no177)ctx.__STORYWORLD_STORY_COLLECT_R177__=R177;
 let p1021={subs:true};const R1021={on:()=>true,prefs:()=>({...p1021}),set:(k,v)=>{p1021[k]=!!v;doc.body.classList.toggle('r1021SubsOff',!v);return p1021[k];}};if(!opt.no1021)ctx.__STORYWORLD_UI_COMBAT_R1021__=R1021;
 vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'narration-r1037.js'});
 const flush=()=>{let n=0;while(timers.length&&n++<50)timers.shift()();};
 return {ctx,doc,panel,eng,R365,R177,R1021,toasts,flush,api:ctx.__STORYWORLD_NARRATION_R1037__,store,get p365(){return p365;},get p177(){return p177;}};}
const scenes=(n,id='dist00',part='pre')=>Array.from({length:n},(_,i)=>({id,part,key:'STORY:'+id+':'+part+':'+i,title:'장면 '+i,text:'원문 '+i}));
// ---------- ① 서사 창 '텍스트 항상 끄기' ----------
{const t=boot();const A=t.api;
 check('API 가 있음(revision·story·fragment·subs·set·storyOff)',A&&/^R1037/.test(A.revision)&&['story','fragment','subs','set','storyOff','inspect'].every(k=>typeof A[k]==='function'));
 check('기본: 서사 창·기억 조각 창·자막 모두 켜짐',A.story()===true&&A.fragment()===true&&A.subs()===true&&A.storyOff()===false);
 let doneN=0;t.ctx.playScenes(scenes(3),()=>doneN++);
 const btn=t.doc.getElementById('r1037Off');
 check('보스 입장 서사 창에 "텍스트 항상 끄기" 단추가 붙음',!!btn&&/텍스트 항상 끄기/.test(btn.textContent),btn&&btn.textContent);
 check('단추는 서사 창 아래 단추 줄(.storyFoot) 안',btn&&btn.parentNode&&btn.parentNode.classList.contains('storyFoot'));
 // ② 안 쓰는 UI: 녹음이 없는 장면은 음성 단추를 숨긴다(패널에 r1037NoVoice)
 check('녹음 없는 장면: 패널에 음성 단추 숨김 표시(r1037NoVoice)',t.panel.classList.contains('r1037NoVoice'));
 const css=t.doc.getElementById('r1037Css');
 check('CSS: r1037NoVoice 면 음성 재생·정지·상태·선택 음성 합성 숨김',css&&['#storyAudio','#storyAudioStop','#voiceStatus','#storyTTS'].every(s=>css.textContent.includes('#panel.r1037NoVoice '+s)),css&&css.textContent.slice(0,300));
 btn.click();t.flush();
 check('누르면 남은 장면을 엔진 그대로 넘김(storyScene 없음·읽음 3장)',t.ctx.storyScene===null&&t.eng.readScenes.size===3,JSON.stringify([t.ctx.storyScene&&t.ctx.storyScene.key,t.eng.readScenes.size]));
 check('누르면 진행(done)이 정확히 1번',doneN===1,doneN);
 check('누르면 설정이 꺼짐(R365 skipStory=true)·story()=false·storyOff()=true',t.p365.skipStory===true&&A.story()===false&&A.storyOff()===true);
 check('누르면 다시 켜는 길 알림(설정)',t.toasts.some(m=>/설정/.test(m)&&/다시/.test(m)),JSON.stringify(t.toasts));
 // 다음 보스 입장: 창이 안 뜨고 바로 진행
 const opened0=t.eng.opened;let done2=0;t.ctx.playScenes(scenes(2,'ep1a11'),()=>done2++);
 check('끈 뒤 다음 보스 입장: 서사 창이 남지 않고 바로 진행(done 1번)',t.ctx.storyScene===null&&done2===1&&t.ctx.modal===false,JSON.stringify({scene:!!t.ctx.storyScene,done2,modal:t.ctx.modal}));
 check('끈 뒤에도 읽음 기록은 남음(넘긴 장면 2장 추가)',t.eng.readScenes.size===5,t.eng.readScenes.size);
 // 다시 켜기(설정)
 A.set('story',true);let done3=0;t.ctx.playScenes(scenes(1,'ep1b02'),()=>done3++);
 check('설정에서 다시 켜면 서사 창이 다시 뜸',!!t.ctx.storyScene&&done3===0&&t.ctx.modal===true);
 check('다시 켠 창에도 단추가 다시 붙음',!!t.doc.getElementById('r1037Off'));
 t.ctx.advanceScene();check('다시 켠 창은 계속을 누르면 진행(done 1번)',done3===1);
}
// 경계: 기억 책(journal:)은 단추를 달지 않고, 끈 상태에서도 직접 읽기는 그대로 뜬다
{const t=boot({p365:{skipStory:true}});const j=[{id:'dist00',part:'body',key:'journal:dist00:0',title:'책',text:'원문'}];t.ctx.playScenes(j,()=>{});
 check('경계: 기억 책 직접 읽기(journal:)에는 항상 끄기 단추 없음',!t.doc.getElementById('r1037Off'));
 check('경계: 서사를 꺼도 기억 책 직접 읽기는 그대로 뜸',!!t.ctx.storyScene&&t.ctx.storyScene.key==='journal:dist00:0');}
// 경계: 녹음이 연결된 장면은 음성 단추를 남긴다
{const t=boot({voiceRows:{'dist00:pre':{audio:'a.mp3'}}});t.ctx.playScenes(scenes(1),()=>{});
 check('경계: 녹음이 연결된 장면은 음성 단추를 숨기지 않음',!t.panel.classList.contains('r1037NoVoice'));}
// ---------- ③ 기억 조각·쪽지 창 ----------
{const t=boot();const A=t.api;const doc=t.doc;
 const mk=(pages)=>{let el=doc.getElementById('r177Doc');if(!el){el=new El('div',doc);el.id='r177Doc';doc.body.appendChild(el);el.onclick=ev=>{const b=ev.target.closest&&ev.target.closest('[data-r182]');if(b){ev.stopPropagation();if(b.dataset.r182==='close'){el.hidden=true;t.closed=(t.closed||0)+1;}return;}};}
  el.children=[];const h=new El('span',doc);h.className='h';el.appendChild(h);const pg=new El('div',doc);pg.className='pg';el.appendChild(pg);const foot=new El('span',doc);foot.className='foot';
  const prev=new El('button',doc);prev.dataset.r182='prev';prev.disabled=true;prev.textContent='◀';const cnt=new El('span',doc);cnt.className='r1037Count';cnt.textContent=' 1 / '+pages+' ';
  const nx=new El('button',doc);nx.dataset.r182='next';nx.textContent=pages===1?'닫기':'▶';const x=new El('button',doc);x.dataset.r182='close';x.textContent='✕';foot.append(prev,cnt,nx,x);el.appendChild(foot);el.hidden=false;return el;};
 const el=mk(1);A.decorateFragment();
 const fb=doc.getElementById('r1037FragOff');
 check('기억 조각 창에 "항상 끄기" 단추가 붙음',!!fb&&/항상 끄기/.test(fb.textContent),fb&&fb.textContent);
 check('1쪽짜리 창: 쓸모없는 ◀ 단추를 숨김',el.querySelector('[data-r182="prev"]').hidden===true);
 check('1쪽짜리 창: 닫기와 겹치는 ✕ 를 숨김',el.querySelector('[data-r182="close"]').hidden===true);
 A.decorateFragment();check('여러 번 불러도 단추는 하나',el.querySelectorAll('[data-r1037="off"]').length===1);
 fb.click();
 check('누르면 창이 닫힘',el.hidden===true&&t.closed===1,JSON.stringify({hidden:el.hidden,closed:t.closed}));
 check('누르면 다음부터 안 펼침(R177 autoShow=false)·fragment()=false',t.p177.autoShow===false&&A.fragment()===false);
 check('누르면 다시 켜는 길 알림',t.toasts.some(m=>/설정/.test(m)),JSON.stringify(t.toasts));
 const el2=mk(3);A.decorateFragment();
 check('여러 쪽 창: ◀·✕ 는 그대로(넘기기에 씀)',el2.querySelector('[data-r182="prev"]').hidden!==true&&el2.querySelector('[data-r182="close"]').hidden!==true);
 A.set('fragment',true);
 check('설정에서 다시 켜면 R177 autoShow·R365 길잡이/직접 조작 창 표시 모두 켜짐',t.p177.autoShow===true&&t.p365.show===true&&t.p365.manual===true&&A.fragment()===true);
 t.R365.set({manual:false});check('경계: 옛 줄(직접 조작 중 창)을 끄면 fragment()=false 로 읽힘',A.fragment()===false);}
// ---------- ④ 설정 줄 ----------
{const t=boot();const A=t.api;t.ctx.showSettings();t.flush();
 const sec=t.doc.getElementById('combatScreenR1021');const rows=sec?sec.querySelectorAll('input[data-r1037]').map(i=>i.dataset.r1037):[];
 check("설정 '전투 화면' 묶음에 서사 창·기억 조각 창 줄",rows.includes('story')&&rows.includes('fragment'),JSON.stringify(rows));
 const st=sec.querySelector('input[data-r1037="story"]');st.checked=false;st.dispatchChange();
 check('설정 줄로 서사 창 끄기 → R365 skipStory=true',t.p365.skipStory===true);
 check('옛 줄(#r365SkipStory)도 같이 맞춰짐',t.doc.getElementById('r365SkipStory').checked===true);
 const fr=sec.querySelector('input[data-r1037="fragment"]');fr.checked=false;fr.dispatchChange();
 check('설정 줄로 기억 조각 창 끄기 → R177 autoShow=false, 옛 줄(#r182Auto)도 꺼짐',t.p177.autoShow===false&&t.doc.getElementById('r182Auto').checked===false);
 const old=t.doc.getElementById('r365SkipStory');old.checked=false;t.R365.set({skipStory:false});old.dispatchChange();
 check('반대로 옛 줄을 바꾸면 새 줄이 맞춰짐',sec.querySelector('input[data-r1037="story"]').checked===true);
 t.ctx.showSettings();t.flush();t.ctx.showSettings();t.flush();
 check('설정을 여러 번 열어도 줄은 하나씩',t.doc.getElementById('combatScreenR1021').querySelectorAll('input[data-r1037="story"]').length===1);}
// ---------- ⑤ 자막 ----------
{const t=boot();const A=t.api;A.set('subs',false);
 check("set('subs',false) → R1021 서사 자막 끔(body.r1021SubsOff)",t.doc.body.classList.contains('r1021SubsOff')&&A.subs()===false);
 const css=t.doc.getElementById('r1037Css');check('CSS: 자막 끄면 영화 선화 컷신 글(#r880 .cap)도 숨김',css&&/body\.r1021On\.r1021SubsOff #r880 \.cap\{display:none!important\}/.test(css.textContent));
 A.set('subs',true);check("set('subs',true) → 다시 켜짐",!t.doc.body.classList.contains('r1021SubsOff')&&A.subs()===true);}
// 경계·회귀: 둘레 모듈이 없어도 안 깨진다 / 모르는 열쇠
{let ok=true,t;try{t=boot({no365:true,no177:true,no1021:true});t.ctx.playScenes(scenes(1),()=>{});t.api.set('story',false);t.api.set('fragment',false);t.api.set('subs',false);}catch(e){ok=false;}
 check('회귀: R365·R177·R1021 이 없어도 오류 없음',ok&&t.api.inspect().stats.errors===0,t&&JSON.stringify(t.api.inspect()));
 check('경계: 모르는 열쇠는 null',t.api.set('nope',true)===null);}
// ---------- R255·R568 연결 ----------
{const r255=fs.readFileSync(path.join(CS,'story-fragments-r255.js'),'utf8');
 check('R255 보스 이름 카드: 서사를 끄면 안 띄움(바로 입장)',/function cinema\(info\)\{if\(!prefs\.cinema\|\|!info\|\|window\.__STORYWORLD_NARRATION_R1037__\?\.storyOff\?\.\(\)/.test(r255));
 const r568=fs.readFileSync(path.join(CS,'boss-cinematic-r568.js'),'utf8');
 check('R568 컷신 자막: 서사 자막을 끄면 안 그림',/function subtitle\(o,text,a\)\{if\(!text\|\|a<=0\|\|window\.__STORYWORLD_NARRATION_R1037__\?\.subs\?\.\(\)===false\)return;/.test(r568));}
// ---------- 소리 끄기 점검: 오프닝 영상(R309)도 효과음·배경음·서사 음성 설정을 따른다(R368·R372 등 다른 영상과 같게) ----------
{const r309=fs.readFileSync(path.join(CS,'intro-video-r309.js'),'utf8');
 const m=r309.match(/const audioLevel=\(\)=>\{[\s\S]*?\};/);
 check('R309 오프닝 영상: 소리 크기 함수(audioLevel)가 있음',!!m);
 if(m){const lv=vm.runInNewContext('('+m[0].replace(/^const audioLevel=/,'').replace(/;$/,'')+')',{});const S=o=>vm.runInNewContext('settings='+JSON.stringify(o)+';f()',{f:()=>0}),run=o=>{const c={settings:o,Math,Number};return vm.runInNewContext('('+m[0].replace(/^const audioLevel=/,'').replace(/;$/,'')+')()',c);};
  check('R309: 효과음·배경음·서사 음성 모두 끄면 소리 0',run({sound:false,music:false,narration:false,volume:1,bgm:1,voice:1})===0);
  check('R309: 배경음만 켜면 배경음 음량',run({sound:false,music:true,narration:false,volume:1,bgm:.4,voice:1})===.4);
  check('경계: 음량 0 이면 소리 0',run({sound:true,music:true,narration:true,volume:0,bgm:0,voice:0})===0);}
 check('R309: 소리 0 이면 영상 음소거, 아니면 음량을 맞춤',/const lv=audioLevel\(\);if\(opt\.muted\|\|lv<=0\)video\.muted=true;else video\.volume=lv;/.test(r309));}
// ---------- ⑥ 연결 ----------
{const html=fs.readFileSync(path.join(root,'runtime-text','index.html'),'utf8');const tag='<script src="./narration-r1037.js"></script>';
 check('index.html 태그 한 번',html.split(tag).length===2);
 check('태그는 gear-r1032 뒤',html.indexOf(tag)>html.indexOf('<script src="./gear-r1032.js"></script>'));
 const man=fs.readFileSync(path.join(root,'runtime-manifest.json'),'utf8'),inp=fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8');
 check('runtime-manifest·runtime-inputs 에 들어감(sync)',man.includes('narration-r1037.js')&&inp.includes('narration-r1037.js'));
 const ver=fs.readFileSync(path.join(root,'..','scripts','verify-r96-public.py'),'utf8');check('공개 확인 목록에 들어감',ver.includes("'narration-r1037.js'"));
 const yml=fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8');check('CI 줄',yml.includes('node r96/qa/r1037/r1037-cpu-check.cjs'));}
done();
