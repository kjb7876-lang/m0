// R1223 CPU 검사: 기억 조각(쪽지·기억 조각 종이 #r177Doc, 서사 창) 음성 기본 재생 + 바로 보이는 '음성 앞으로 끄기' 단추(memory-voice-r1223.js).
//  사용자 2026-11-19 "스토리모드에서 기억조각 뜨면 음성도 기본적으로 나오게 다만 음성앞으로 끄기 기능도같이 바로보이게" + "사몽쪽도 같이 사몽에피소드랑".
//  ① 종이가 펼쳐지면 그 쪽 글을 문장으로 나눠 녹음(R381)이 있는 문장을 차례로 튼다(기본 켜짐). 녹음 없는 문장·조각은 조용히 넘어간다.
//  ② 음성이 나오는 동안은 종이가 저절로 넘어가지 않게 붙잡고, 끝나면 놓는다. 쪽을 넘기거나 닫으면 멈춘다. 늦게 온 끝 알림은 버린다.
//  ③ 종이와 서사 창에 '음성 앞으로 끄기' 단추가 바로 보이고, 누르면 그 자리에서 멈추고 이후 계속 꺼진 채 저장된다(설정에도 같은 칸). 다시 누르면 켜진다.
//  ④ 서사 음성 끔·음량 0·영화 모드·무한생존이면 틀지 않는다. 다른 음성이 끼어들면 붙잡기를 놓는다.
//  ⑤ 연결(태그·sync·공개 확인 목록·CI 줄). 서사 글은 바꾸지 않는다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..','..'),repo=path.resolve(root,'..');const FILE=path.join(root,'client-source','memory-voice-r1223.js');
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name+(ok||detail===''?'':' :: '+detail));};
const done=()=>{const failed=results.filter(r=>!r.ok).length;console.log(JSON.stringify({total:results.length,failed,method:'node vm + fake DOM/R177/R381/R1044; real audio checked by r1223-browser.mjs (headless)'}));process.exit(failed?1:0);};
check('memory-voice-r1223.js 가 있음',fs.existsSync(FILE));if(!fs.existsSync(FILE))done();
const src=fs.readFileSync(FILE,'utf8');
const sentences=t=>String(t||'').split(/\n\s*\n/).flatMap(p=>p.replace(/\s+/g,' ').trim().split(/(?<=[.!?…])\s+/)).map(x=>x.trim()).filter(Boolean).map(text=>({text}));
// ---- 작은 가짜 DOM ----
function El(tag,o={}){const e={tagName:String(tag).toUpperCase(),id:o.id||'',className:o.className||'',textContent:o.text||'',hidden:!!o.hidden,children:[],parentNode:null,events:[],style:{},dataset:{},attrs:{},
 appendChild(c){c.parentNode=e;e.children.push(c);return c;},insertBefore(c,ref){c.parentNode=e;const i=ref?e.children.indexOf(ref):-1;if(i<0)e.children.push(c);else e.children.splice(i,0,c);return c;},
 remove(){if(e.parentNode){const p=e.parentNode;p.children.splice(p.children.indexOf(e),1);e.parentNode=null;}},
 setAttribute(k,v){e.attrs[k]=String(v);},getAttribute(k){return e.attrs[k]??null;},
 matches(){return false;},
 dispatchEvent(ev){e.events.push(ev.type);const h=e['on'+ev.type];if(typeof h==='function')h.call(e,ev);return true;},
 addEventListener(t,f){(e['__l_'+t]=e['__l_'+t]||[]).push(f);},
 querySelectorAll(sel){const out=[];const m=c=>sel.startsWith('#')?c.id===sel.slice(1):sel.startsWith('.')?String(c.className).split(/\s+/).includes(sel.slice(1)):c.tagName===sel.toUpperCase();
  const walk=n=>{for(const c of n.children){if(m(c))out.push(c);walk(c);}};walk(e);return out;},
 querySelector(sel){const parts=sel.trim().split(/\s+/);let pool=[e];for(const p of parts){const nx=[];for(const n of pool)nx.push(...n.querySelectorAll(p));pool=nx;}return pool[0]||null;}};
 return e;}
const clock={t:1000};
function make(o={}){
 const body=El('body'),head=El('head');const store=new Map(Object.entries(o.store||{}));
 const document={body,head,createElement:t=>El(t),getElementById:id=>body.querySelector('#'+id)||head.querySelector('#'+id),querySelector:s=>body.querySelector(s),querySelectorAll:s=>body.querySelectorAll(s)};
 const plays=[],stops={n:0};let playing=null;
 const R381={has:t=>!/없음/.test(t),play(t,opt){const h={id:'id:'+t,text:t,opt,stopped:false,stop(){h.stopped=true;if(playing===h)playing=null;}};plays.push(h);playing=h;return h;},stop(){stops.n++;playing=null;},inspect:()=>({playing:playing?playing.id:null})};
 const r1044={halts:0};
 const ctx={console,setTimeout:f=>0,clearTimeout(){},setInterval:()=>0,Math,Number,String,Array,Object,JSON,Set,Map,
  Event:function(t){this.type=t;},performance:{now:()=>clock.t},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  document,settings:{narration:true,voice:.8,...(o.settings||{})},storyScene:null,window:null};
 ctx.window=ctx;ctx.__STORYWORLD_VOICE_R381__=R381;
 ctx.__STORYWORLD_CINEMA_MODE_R370__={prefs:()=>({on:!!o.cinema}),pure:{sentences}};
 ctx.__STORYWORLD_SURVIVAL_R600__={active:()=>!!o.survival};
 ctx.__STORYWORLD_NARRATION_VOICE_R1044__={halt(){r1044.halts++;}};
 const r880={active:false};ctx.__STORYWORLD_LINEART_R880__={inspect:()=>({active:r880.active})};
 // 엔진 서사 창(R255 종이 모양): #panel 안에 .storyText 와 '계속'(#storyNext)
 ctx.advanceScene=function(){ctx.storyScene=ctx.queue?.shift()||null;let pn=document.getElementById('panel');if(pn)pn.remove();if(!ctx.storyScene)return;
  pn=El('div',{id:'panel'});const row=El('div',{className:'row'});pn.appendChild(El('div',{className:'storyText',text:ctx.storyScene.text}));row.appendChild(El('button',{id:'storyNext',text:'계속'}));pn.appendChild(row);body.appendChild(pn);};
 ctx.showSettings=function(){let pn=document.getElementById('panel');if(pn)pn.remove();pn=El('div',{id:'panel'});pn.appendChild(El('div',{className:'settings'}));body.appendChild(pn);};
 vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'memory-voice-r1223.js'});
 // R177 종이: 헤드·쪽 글·아래 단추. paint 처럼 innerHTML 을 새로 쓰는 것과 같게 자식을 다 갈아 끼운다.
 let doc=null;const hover={v:false};
 function show(title,paras,o2={}){if(!doc){doc=El('div',{id:'r177Doc'});doc.onmouseenter=()=>hover.v=true;doc.onmouseleave=()=>hover.v=false;body.appendChild(doc);}
  doc.children.length=0;doc.hidden=false;doc.appendChild(El('span',{className:'h',text:title}));const pg=El('div',{className:'pg'});for(const p of paras)pg.appendChild(El('p',{text:p}));doc.appendChild(pg);
  const foot=El('span',{className:'foot'});foot.appendChild(El('button',{text:'▶'}));doc.appendChild(foot);return doc;}
 function hide(){if(doc)doc.hidden=true;}
 // 입장 영상 루트(R369·R617 꼴): video + .cap(.on) + 건너뛰기
 function video(id='r369v'){const root=El('div',{id});const v=El('video');Object.assign(v,{playbackRate:1,currentTime:0,duration:10,paused:false,pauses:0,plays:0,pause(){v.paused=true;v.pauses++;},play(){v.paused=false;v.plays++;return {catch(){}};}});
  root.appendChild(v);const cap=El('div',{className:'cap'});root.appendChild(cap);root.appendChild(El('button',{className:'skip',text:'건너뛰기 ▸'}));body.appendChild(root);
  return {root,v,cap,say(t){cap.textContent=t||cap.textContent;cap.className=t?'cap on':'cap';},close(){root.remove();}};}
 return {ctx,plays,stops,r1044,r880,video,store,hover,show,hide,doc:()=>doc,document,api:ctx.__STORYWORLD_MEMORY_VOICE_R1223__,setPlaying:v=>{playing=v;}};}
const P1=['첫 문장이다. 둘째 문장이다.','셋째 문장이다.'];
// ① 기본 재생
{const t=make();const {api,plays}=t;check('API 가 있음',!!api&&typeof api.step==='function'&&typeof api.inspect==='function');
 check('① 기본값: 켜짐',api?.inspect?.().on===true);
 t.show('기억 조각 · 첫 기억',P1);api.step();
 check('① 종이가 펼쳐지면 첫 문장 녹음을 튼다',plays.length===1&&plays[0].text==='첫 문장이다.',JSON.stringify(plays.map(p=>p.text)));
 check('① 음량 = 설정 음성 음량(0.8)',plays[0]?.opt?.volume===.8,String(plays[0]?.opt?.volume));
 check('② 음성 동안 종이를 붙잡음(저절로 넘김 멈춤)',t.hover.v===true);
 api.step();check('① 같은 쪽을 다시 봐도 처음부터 다시 틀지 않음',plays.length===1);
 plays[0]?.opt?.onend?.();check('① 끝나면 다음 문장',plays.length===2&&plays[1].text==='둘째 문장이다.');
 t.ctx.settings.voice=.3;plays[1]?.opt?.onend?.();check('① 음량을 바꾸면 다음 문장부터 반영(쪽 안 문단을 넘어감)',plays.length===3&&plays[2].text==='셋째 문장이다.'&&plays[2].opt.volume===.3,JSON.stringify(plays.map(p=>[p.text,p.opt.volume])));
 plays[2]?.opt?.onend?.();check('① 마지막 문장 뒤에는 더 안 튼다',plays.length===3);
 check('② 다 읽으면 붙잡기를 놓음(종이가 다시 저절로 넘어감)',t.hover.v===false);
 check('① 기록(played 3)',api.inspect().stats.played===3,JSON.stringify(api.inspect().stats));}
// ② 쪽 넘기기·닫기·늦은 알림
{const t=make();const {api,plays}=t;t.show('쪽지 · 병실',P1);api.step();
 t.show('쪽지 · 병실',['다음 쪽 문장이다.']);api.step();
 check('② 쪽을 넘기면 앞 쪽 음성을 멈춤',plays[0]?.stopped===true);
 check('② 넘긴 쪽의 문장을 튼다',plays.length===2&&plays[1].text==='다음 쪽 문장이다.',JSON.stringify(plays.map(p=>p.text)));
 plays[0]?.opt?.onend?.();check('② 늦게 온 앞 쪽 끝 알림은 버림',plays.length===2);
 t.hide();api.step();check('② 종이를 닫으면 멈춤',plays[1]?.stopped===true);
 check('② 닫으면 붙잡기도 놓음',t.hover.v===false);
 api.step();check('② 닫힌 뒤에는 더 안 튼다',plays.length===2);
 t.show('쪽지 · 병실',['다음 쪽 문장이다.']);api.step();check('② 경계: 닫았다 같은 글이 다시 펼쳐지면 다시 튼다',plays.length===3);}
// ② 녹음 없음
{const t=make();const {api,plays}=t;t.show('기억 조각 · 없음',['녹음 없음 하나. 있는 문장. 녹음 없음 둘.']);api.step();
 check('② 녹음 없는 문장은 건너뛰고 있는 문장부터',plays.length===1&&plays[0].text==='있는 문장.');
 plays[0]?.opt?.onend?.();check('② 뒤의 녹음 없는 문장도 건너뜀',plays.length===1);}
{const t=make();const {api,plays}=t;t.show('기억 조각 · 없음',['녹음 없음. 녹음 없음 또.']);api.step();
 check('② 경계: 녹음이 하나도 없으면 조용히(아무것도 안 틀고 종이도 안 붙잡음)',plays.length===0&&t.hover.v===false);
 check('③ 녹음이 없는 조각에도 끄기 단추는 보임',!!t.doc().querySelector('.r1223btn'));}
{const t=make();const {api,plays}=t;t.show('쪽지',[]);api.step();check('② 경계: 빈 쪽은 안 틀음·오류 없음',plays.length===0&&api.inspect().stats.moduleErrors===0);}
{const t=make();const {api,plays}=t;t.show('기억 조각',P1);api.step();plays[0]?.opt?.onerror?.();check('② 녹음 오류면 다음 문장으로',plays.length===2&&plays[1].text==='둘째 문장이다.');}
// ③ 단추
{const t=make();const {api,plays,store}=t;t.show('기억 조각 · 첫 기억',P1);api.step();
 const b=t.doc().querySelector('.r1223btn');check('③ 종이에 단추가 바로 보임',!!b&&!b.hidden,String(b&&b.textContent));
 check('③ 단추 글: 음성 앞으로 끄기',/앞으로 끄기/.test(b?.textContent||''),b?.textContent);
 let stopped=0;const ev={type:'click',stopPropagation(){stopped++;},preventDefault(){}};b.onclick(ev);
 check('③ 누르면 종이 넘김으로 번지지 않음(stopPropagation)',stopped>=1);
 check('③ 누르면 지금 음성을 바로 멈춤',plays[0]?.stopped===true);
 check('③ 꺼짐이 저장됨',JSON.parse(store.get('storyworld.r1223.memvoice')||'{}').on===false,store.get('storyworld.r1223.memvoice'));
 check('③ 눌러 끄면 붙잡기를 놓음',t.hover.v===false);
 check('③ 단추 글이 음성 켜기로 바뀜',/켜기/.test(t.doc().querySelector('.r1223btn')?.textContent||''));
 t.show('기억 조각 · 둘째 기억',['새 조각이다.']);api.step();check('③ 끈 뒤 새 조각은 안 틀음',plays.length===1);
 check('③ 끈 뒤에도 켜기 단추가 다시 그려진 종이에 보임',/켜기/.test(t.doc().querySelector('.r1223btn')?.textContent||''));
 t.doc().querySelector('.r1223btn').onclick(ev);api.step();
 check('③ 다시 켜면 지금 쪽부터 튼다',plays.length===2&&plays[1].text==='새 조각이다.',JSON.stringify(plays.map(p=>p.text)));
 check('③ 켜짐이 저장됨',JSON.parse(store.get('storyworld.r1223.memvoice')||'{}').on===true);}
{const t=make({store:{'storyworld.r1223.memvoice':'{"on":false}'}});t.show('기억 조각',P1);t.api.step();
 check('③ 저장된 꺼짐은 새로 켜도(새 판) 유지',t.plays.length===0&&t.api.inspect().on===false);}
{const t=make({store:{'storyworld.r1223.memvoice':'망가진 값'}});check('③ 경계: 저장값이 망가져도 기본 켜짐',t.api.inspect().on===true);}
// ③ 서사 창(진행이 걸린 서사·사몽 기록) — R1044 가 트는 음성도 같은 단추로
{const t=make();t.ctx.queue=[{key:'DREAM:sm103:x:s:1',text:'사몽 문장이다.'}];t.ctx.advanceScene();
 const b=t.document.getElementById('panel')?.querySelector('.r1223btn');check('③ 서사 창에도 단추가 바로 보임(계속 옆)',!!b&&b.parentNode===t.document.getElementById('storyNext')?.parentNode);
 check('③ 켜져 있으면 서사 창 음성을 막지 않음',t.r1044.halts===0);
 b.onclick({stopPropagation(){},preventDefault(){}});check('③ 서사 창에서 끄면 R1044 음성도 멈춤',t.r1044.halts>=1);
 const before=t.r1044.halts;t.ctx.queue=[{key:'STORY:a.pre',text:'다음 장면이다.'}];t.ctx.advanceScene();
 check('③ 끈 뒤 다음 서사 창 음성은 바로 멈춤',t.r1044.halts>before);
 t.ctx.queue=[];t.ctx.advanceScene();check('③ 경계: 창이 닫힐 때 오류 없음',t.api.inspect().stats.moduleErrors===0,String(t.api.inspect().lastError));}
// ③ 설정 칸
{const t=make();t.ctx.showSettings();const c=t.document.getElementById('r1223Chk');
 check('③ 설정에 같은 칸이 있음',!!c&&c.checked===true);
 c.checked=false;c.onchange?.();check('③ 설정 칸으로 끄면 저장',JSON.parse(t.store.get('storyworld.r1223.memvoice')||'{}').on===false);
 t.show('기억 조각',P1);t.api.step();check('③ 설정 칸으로 끈 뒤 안 틀음',t.plays.length===0);
 t.ctx.showSettings();check('③ 설정을 다시 열면 꺼짐으로 보임',t.document.getElementById('r1223Chk')?.checked===false);}
// ④ 막는 조건
for(const [label,o] of [['서사 음성 자동 재생 끔',{settings:{narration:false}}],['경계: 음성 음량 0',{settings:{voice:0}}],['영화 모드',{cinema:true}],['무한생존',{survival:true}]]){
 const t=make(o);t.show('기억 조각',P1);t.api.step();check('④ '+label+' → 안 틀음',t.plays.length===0);}
{const t=make({settings:{voice:1.7}});t.show('기억 조각',P1);t.api.step();check('④ 경계: 음량 1 넘는 값은 1로',t.plays[0]?.opt?.volume===1);}
{const t=make();t.show('기억 조각',P1);t.api.step();t.setPlaying({id:'다른 음성'});t.api.step();
 check('④ 다른 음성이 끼어들면 붙잡기를 놓음',t.hover.v===false);
 t.plays[0]?.opt?.onend?.();check('④ 끼어든 뒤 옛 알림으로 다시 틀지 않음',t.plays.length===1);}
// ⑥ 입장 영상(R617 해안·R369 중독의 도시 등) 자막 음성
{const t=make();const V=t.video('r369v');t.api.step();
 const b=V.root.querySelector('.r1223btn');check('⑥ 영상에도 끄기 단추가 바로 보임(건너뛰기 옆)',!!b&&b.parentNode===V.root&&V.root.children.indexOf(b)===V.root.children.indexOf(V.root.querySelector('.skip'))-1);
 check('⑥ 자막이 없으면 아무것도 안 틀음',t.plays.length===0&&V.v.playbackRate===1);
 V.say('그의 목소리가 들릴 때마다 나는 항상 약을 갈망했다.');t.api.step();
 check('⑥ 자막이 뜨면 그 문장 녹음을 튼다',t.plays.length===1&&t.plays[0].text==='그의 목소리가 들릴 때마다 나는 항상 약을 갈망했다.',JSON.stringify(t.plays.map(p=>p.text)));
 check('⑥ 말하는 동안 영상을 조금 늦춤(0.8)',V.v.playbackRate===.8,String(V.v.playbackRate));
 t.api.step();check('⑥ 같은 자막이면 다시 틀지 않음',t.plays.length===1);
 V.say('바닥에 흩어진 주사기들이 달빛을 반사했고…');t.api.step();
 check('⑥ 말이 안 끝났는데 다음 자막이 뜨면 끊지 않고 기다림',t.plays.length===1&&t.plays[0]?.stopped===false);
 check('⑥ 밀린 말이 있으면 영상을 더 늦춤(0.5)',V.v.playbackRate===.5,String(V.v.playbackRate));
 t.plays[0]?.opt?.onend?.();t.api.step();check('⑥ 앞 말이 끝나면 밀린 자막 문장을 이어 틈',t.plays.length===2&&t.plays[1].text==='바닥에 흩어진 주사기들이 달빛을 반사했고…');
 check('⑥ 밀린 것이 없으면 다시 0.8',V.v.playbackRate===.8);
 t.plays[1]?.opt?.onend?.();t.api.step();check('⑥ 다 말하면 원래 속도(1)',V.v.playbackRate===1);
 V.say('');t.api.step();V.say('녹음 없음 자막.');t.api.step();check('⑥ 녹음 없는 자막은 조용히 넘어감(속도 그대로)',t.plays.length===2&&V.v.playbackRate===1);
 V.close();t.api.step();check('⑥ 경계: 영상이 닫혀도 오류 없음',t.api.inspect().stats.moduleErrors===0,String(t.api.inspect().lastError));}
{const t=make();const V=t.video('r617v');V.say('첫 줄이다.');t.api.step();V.v.currentTime=9.3;t.api.step();
 check('⑥ 영상 끝 1초 안인데 말이 남았으면 영상을 잠깐 멈춰 끝까지 들려줌',V.v.paused===true&&V.v.pauses===1);
 t.plays[0]?.opt?.onend?.();t.api.step();check('⑥ 말이 끝나면 영상을 다시 재생',V.v.paused===false&&V.v.plays>=1);
 const W=t.video('r368v');W.say('둘째 줄이다.');W.v.currentTime=9.5;t.api.step();clock.t+=5600;t.api.step();
 check('⑥ 경계: 끝에서 기다림은 5초까지(영상 멈춤 감시 6초보다 짧게)',W.v.paused===false,String(W.v.paused));}
{const t=make();const V=t.video('r369v');V.say('첫 줄이다. 둘째 줄이다.');t.api.step();
 check('⑥ 여러 문장 자막은 문장마다 차례로',t.plays.length===1&&t.plays[0].text==='첫 줄이다.');t.plays[0]?.opt?.onend?.();t.api.step();check('⑥ 둘째 문장',t.plays[1]?.text==='둘째 줄이다.');
 V.close();t.api.step();check('⑥ 영상이 닫히면 말도 멈춤',t.plays[1]?.stopped===true);}
{const t=make();const V=t.video('r369v');V.say('첫 줄이다.');t.api.step();V.v.currentTime=9.5;t.api.step();
 V.root.querySelector(".r1223btn")?.onclick?.({stopPropagation(){},preventDefault(){}});
 check('⑥ 영상에서 끄기 → 말 멈춤·속도 1·멈춘 영상 다시 재생',t.plays[0]?.stopped&&V.v.playbackRate===1&&V.v.paused===false);
 V.say('둘째 줄이다.');t.api.step();check('⑥ 끈 뒤 다음 자막은 안 틀음',t.plays.length===1);}
for(const [label,o] of [['서사 음성 자동 재생 끔',{settings:{narration:false}}],['영화 모드',{cinema:true}]]){const t=make(o);const V=t.video();V.say('첫 줄이다.');t.api.step();check('⑥ '+label+' → 영상 음성 안 틀음·속도 그대로',t.plays.length===0&&V.v.playbackRate===1);}
// ⑦ 선화 컷신(R880, 자체 음성)·서사 창(R1044) 음성도 같은 단추로: 녹음 재생 길(R381)을 그 장면 동안만 막는다
{const t=make();const R=t.ctx.__STORYWORLD_VOICE_R381__;check('⑦ 녹음 길은 같은 기능을 그대로 냄',typeof R.play==='function'&&typeof R.has==='function'&&typeof R.stop==='function'&&typeof R.inspect==='function');
 t.r880.active=true;const r880=El('div',{id:'r880'});r880.appendChild(El('div',{className:'cap'}));r880.appendChild(El('button',{className:'skip'}));t.document.body.appendChild(r880);t.api.step();
 check('⑦ 선화 컷신에도 끄기 단추가 바로 보임',!!r880.querySelector('.r1223btn'));
 check('⑦ 켜져 있으면 컷신 음성을 그대로 통과',!!R.play('컷신 문장이다.',{}));
 r880.querySelector(".r1223btn")?.onclick?.({stopPropagation(){},preventDefault(){}});
 check('⑦ 끄면 컷신 동안 녹음 재생을 막음(null → 컷신은 제 속도로)',R.play('컷신 문장이다.',{})===null);
 t.r880.active=false;r880.remove();t.api.step();check('⑦ 컷신·종이·서사 창·영상이 없을 때(무한생존 자막 등)는 막지 않음',!!R.play('다른 문장이다.',{}));
 t.ctx.storyScene={key:'STORY:a.pre'};check('⑦ 끈 동안 서사 창이 떠 있으면 막음',R.play('서사 문장이다.',{})===null);}
// 서사 불변·연결
{check('⑤ 서사 글을 바꾸지 않음(종이 글을 쓰지 않음)',!/\.textContent\s*=\s*[^;]*\b(text|pg)\b|innerHTML\s*=/.test(src.replace(/b\.textContent\s*=\s*label\(\)/g,'')));
 const idx=fs.readFileSync(path.join(root,'runtime-text','index.html'),'utf8');const a=idx.indexOf('<script src="./narration-voice-r1044.js"></script>'),b=idx.indexOf('<script src="./memory-voice-r1223.js"></script>');
 check('⑤ index.html 태그가 R1044 바로 다음',a>0&&b>a&&idx.slice(a,b).split('\n').length===2);
 check('⑤ runtime-text 사본이 있음',fs.existsSync(path.join(root,'runtime-text','memory-voice-r1223.js'))&&fs.readFileSync(path.join(root,'runtime-text','memory-voice-r1223.js'),'utf8')===src);
 check('⑤ runtime-manifest 에 있음',/memory-voice-r1223\.js/.test(fs.readFileSync(path.join(root,'runtime-manifest.json'),'utf8')));
 check('⑤ 공개 확인 목록에 있음',/memory-voice-r1223\.js/.test(fs.readFileSync(path.join(repo,'scripts','verify-r96-public.py'),'utf8')));
 check('⑤ CI 줄이 있음',/r96\/qa\/r1223\/r1223-cpu-check\.cjs/.test(fs.readFileSync(path.join(repo,'.github','workflows','pages.yml'),'utf8')));}
done();
