// R370 — 영화 모드: 길잡이 자동 플레이 + 서사 창 대신 원문 발췌(요약본) 자막·음성 + 지역 시간에 맞춘 속도·쉼·머물기.
// CPU 에서 순수 함수(문장 나누기·고르기·속도·쉼·자막 조각)와, 가짜 엔진에 붙여 서사 넘기기·기록·진행 콜백·음성 대기열·
// stopVoice 가 우리 음성을 끊지 않음·출구 머물기·끄기를 본다. 실제 음성 품질·브라우저·모바일은 여기서 보지 않는다(미검증).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const F='cinema-mode-r370.js',SRC=fs.readFileSync(path.join(R,'client-source',F),'utf8'),html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
ok('index.html loads cinema-mode-r370 once, after the last overlay (poison-city-video-r369) and before combat-r118',
 html.split('"./cinema-mode-r370.js"').length===2&&/poison-city-video-r369\.js"><\/script><script src="\.\/cinema-mode-r370\.js"><\/script>/.test(html)&&html.indexOf('cinema-mode-r370.js')<html.indexOf('"./combat-r118.js"'));
ok('no eval / no new Function in the overlay',!/\beval\s*\(|new Function/.test(SRC));
ok('no ctx.filter drop-shadow/blur (Three.js legacy trap)',!/filter\s*=\s*['"][^'"]*(drop-shadow|blur)/.test(SRC));
function el(tag){return {tag,id:'',style:{},children:[],attrs:{},checked:false,parentNode:null,textContent:'',innerHTML:'',isConnected:true,
 setAttribute(k,v){this.attrs[k]=v;},appendChild(c){c.parentNode=this;this.children.push(c);return c;},append(...cs){for(const c of cs)this.appendChild(c);},
 get nextSibling(){const p=this.parentNode;if(!p)return null;return p.children[p.children.indexOf(this)+1]||null;},
 insertBefore(c,ref){c.parentNode=this;const i=this.children.indexOf(ref);this.children.splice(i<0?this.children.length:i,0,c);return c;},
 querySelector(q){if(!this._q)this._q={'.n':el('span'),'.t':el('span')};return this._q[q]||null;},addEventListener(){},classList:{_s:new Set(),add(k){this._s.add(k);},remove(k){this._s.delete(k);},contains(k){return this._s.has(k);},toggle(k,v){if(v)this._s.add(k);else this._s.delete(k);}}};}
function mk({voices=[{name:'Microsoft SunHi Online (Natural) - Korean',lang:'ko-KR'}],store={}}={}){
 let clock=0;const timers=[];const setT=(f,ms)=>{const t={at:clock+Math.max(0,ms||0)/1000,f,dead:false};timers.push(t);return t;};const clr=t=>{if(t)t.dead=true;};
 const spoken=[],cancels=[],kept=[],toasts=[],done=[];let speakingU=null;
 const ss={getVoices:()=>voices,speak(u){spoken.push(u);speakingU=u;const d=u.text.length/(7*u.rate);setT(()=>{if(speakingU===u){speakingU=null;u.onend&&u.onend();}},d*1000);},
  pause(){},resume(){},addEventListener(){}};
 Object.defineProperty(ss,'cancel',{configurable:true,writable:true,value:function(){cancels.push(clock);speakingU=null;}});
 const grid=el('div');const body=el('body');
 const sb={localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},speechSynthesis:ss,SpeechSynthesisUtterance:function(t){this.text=t;this.rate=1;},
  document:{hidden:false,getElementById:id=>{const walk=n=>{if(n.id===id)return n;for(const c of n.children||[]){const r=walk(c);if(r)return r;}return null;};return walk(grid)||walk(body);},createElement:t=>el(t),createTextNode:t=>({text:t}),querySelector:q=>q==='#panel .settings'?grid:null,head:el('head'),body},
  performance:{now:()=>clock*1000},setTimeout:setT,clearTimeout:clr,setInterval(f){sb.__iv=f;},addEventListener(){},toast:m=>toasts.push(m),Promise,Math,JSON,String,Array,Set,Map,Object,Number,RegExp,
  window:null};
 sb.window=sb;sb.window.__STORYWORLD_PLAY_R169__={collect:n=>{kept.push(n);return true;}};
 sb.window.__STORYWORLD_GUIDE_FRAGMENT_R365__=Object.freeze({hold:()=>false,set(){},prefs:()=>({})});
 vm.createContext(sb);
 vm.runInContext(`var started=true,loading=false,modal=false,guide=false,auto=false,guideTimer=0,storyScene=null,storyQueue=[],storyDone=null,settings={voice:.8},
  room={id:'dist01'},regionById={dist01:{title:'거미동굴'},dist02:{title:'늪'},hub:{title:'거점',safe:true}},entered=[];
  function stopVoice(){speechSynthesis.cancel();}
  function closePanel(){modal=false;}function openPanel(){modal=true;stopVoice();}
  function advanceScene(){stopVoice();storyScene=storyQueue.shift()||null;if(!storyScene){const d=storyDone;storyDone=null;closePanel(true);if(d)d();return;}openPanel();}
  function playScenes(sc,done){stopVoice();storyQueue=sc.filter(s=>s&&typeof s.text==='string'&&s.text.trim()).slice();storyDone=done||null;storyScene=null;advanceScene();}
  async function enterRegion(id,from,opt){entered.push(id);room={id};return true;}
  function showSettings(){}`,sb);
 vm.runInContext(SRC,sb);
 const run=s=>{const end=clock+s;for(;;){timers.sort((a,b)=>a.at-b.at);const t=timers.find(t=>!t.dead&&t.at<=end);if(!t)break;clock=Math.max(clock,t.at);t.dead=true;t.f();}clock=end;};
 const tickIv=s=>{for(let i=0;i<s;i++){run(1);sb.__iv&&sb.__iv();}};
 return {sb,api:sb.window.__STORYWORLD_CINEMA_MODE_R370__,spoken,cancels,kept,toasts,run,tickIv,store,get clock(){return clock;},ev:c=>vm.runInContext(c,sb)};}
// ── 순수 ──
const P=mk().api.pure;
const ss=P.sentences('첫 문장이다. 둘째 문장이다! "대사였다?" 넷째\n\n새 문단의 첫 문장이었다… 끝');
ok('sentences: splits on . ! ? … and paragraphs, marks paragraph-first',ss.length===6&&ss[0].first&&!ss[1].first&&ss[4].first&&ss[4].para===1&&ss[2].text==='"대사였다?"',ss.map(s=>s.text));
const items=Array.from({length:10},(_,i)=>({len:100,score:i%3,must:i===0,order:i}));
const sel=P.select(items,450);
ok('select: keeps must, fills by score up to cap, keeps original order',sel.kept[0].order===0&&sel.used<=450&&sel.kept.length===4&&sel.kept.every((k,i,a)=>!i||a[i-1].order<k.order),sel.kept.map(k=>k.order));
ok('select: musts kept even over cap',P.select([{len:500,must:true,score:0,order:0},{len:10,must:false,score:9,order:1}],100).kept.length===1);
ok('R384 steadyRate: one speed for every sentence (user×0.95, clamped .8–1.2), no deadline speed-up',P.STEADY===.95&&Math.abs(P.steadyRate(1)-.95)<1e-9&&Math.abs(P.steadyRate(1.1)-1.045)<1e-9&&P.steadyRate(9)<=1.2&&P.steadyRate(.1)>=.8&&P.rateFor===undefined&&P.RATE_MIN===undefined);
ok('tone (R384): no per-sentence rate; dialogue higher pitch, ellipsis and scene end pause longer',(()=>{const d=P.tone('"가자."',false),n=P.tone('나는 걸었다.',false),e=P.tone('그날의 기억이…',false),z=P.tone('끝이었다.',true);return d.rate===undefined&&d.pitch>n.pitch&&e.pause>n.pause&&z.pause>n.pause&&n.pause===P.GAP;})());
ok('R384: gapFor removed (pause no longer depends on the deadline)',P.gapFor===undefined);
const ch=P.chunks('가'.repeat(60)+', '+'나'.repeat(60));
ok('chunks: long sentence splits into ≤84-char parts at a comma',ch.length===2&&ch.every(c=>c.length<=84),ch.map(c=>c.length));
ok('isFinal: finale/ending scenes recognised',P.isFinal([{key:'finale.core-preserved'}])&&!P.isFinal([{key:'dist01:pre'}]));
// ── 엔진에 붙여 ──
{const T=mk();T.api.set({on:true});
 ok('turning on enables the guide',T.ev('guide===true&&auto===true'));
 let fin=0;T.sb.__fin=()=>fin++;
 const text=Array.from({length:160},(_,i)=>'문장 '+i+'번째는 원문 그대로 길게 이어지는 서술이었다.').join(' ');
 T.ev(`playScenes([{key:'dist01:pre',id:'dist01',title:'거미동굴',narrator:'〈EGO의 기억〉',text:${JSON.stringify(text)}},{key:'journal:x',id:'dist01',text:'x'}].slice(0,1),()=>__fin())`);
 ok('scene window skipped: storyScene cleared, modal closed, done() called once',T.ev('storyScene===null&&modal===false')&&fin===1);
 ok('full scene text recorded in the note book (R169)',T.kept.length===1&&T.kept[0].key==='story:dist01:pre'&&T.kept[0].text===text);
 const i0=T.api.inspect();
 ok('abridged: fewer sentences queued than in the source when the zone budget is short',i0.stats.sentences===160&&i0.stats.kept<160&&i0.stats.kept>0,i0.stats);
 ok('speech started with a Korean voice at the steady rate (R384)',T.spoken.length===1&&T.spoken[0].voice?.lang==='ko-KR'&&Math.abs(T.spoken[0].rate-P.steadyRate(1))<.06,T.spoken[0]?.rate);
 const c0=T.cancels.length;T.ev('stopVoice()');
 ok('engine stopVoice() does not cancel cinema speech',T.cancels.length===c0);
 T.run(900);
 ok('queue drains over time and subtitles end',T.api.inspect().queue===0&&T.spoken.length===i0.stats.kept,{spoken:T.spoken.length,kept:i0.stats.kept});
 // 저널(기억 책) 읽기는 그대로 창으로
 T.ev(`playScenes([{key:'journal:dist01',id:'dist01',text:'책에서 다시 읽는 글.'}],null)`);
 ok('journal reading still opens the normal story window',T.ev('storyScene&&storyScene.key')==='journal:dist01');
 T.ev('storyScene=null;storyQueue=[];modal=false;');
 // 출구 머물기
 T.ev(`playScenes([{key:'dist01:post',id:'dist01',title:'끝',text:${JSON.stringify(Array.from({length:30},(_,i)=>'남은 장면 '+i+'의 문장이 이어졌다.').join(' '))}}],null)`);
 const mustBefore=T.api.inspect().backlogSecs;T.ev('guide=true;');let entered=false;T.ev('enterRegion("dist02",null,{}).then(()=>{})');
 ok('guide travel waits at the exit while must-read lines remain (<=40 s)',mustBefore>25&&T.ev('entered.length')===0&&T.api.inspect().stats.lingers===1,{mustBefore});
 T.run(45);ok('…and then travels',T.ev('entered.includes("dist02")'));
 T.ev('enterRegion("hub",null,{restore:true})');ok('restore/return travel is never delayed',T.ev('entered.includes("hub")'));
 // R882: 사용자가 직접 고른 777 이동은 머물기를 건너뛰고, 이미 걸려 있던 길잡이 이동은 취소한다(옛 목적지로 뒤늦게 가지 않음).
 T.ev(`playScenes([{key:'dist01:post2',id:'dist01',title:'끝',text:${JSON.stringify(Array.from({length:30},(_,i)=>'다시 남은 장면 '+i+'의 문장이 이어졌다.').join(' '))}}],null)`);
 const n0=T.ev('entered.length');T.ev('guide=true;enterRegion("u201",null,{}).then(()=>{})');
 ok('guide travel waits again (777 test setup)',T.ev('entered.length')===n0);
 T.ev('enterRegion("hub",null,{travel777R72:true})');
 ok('777 travel is never delayed by the exit linger',T.ev('entered.length')===n0+1&&T.ev('entered[entered.length-1]')==='hub');
 T.run(45);
 ok('777 travel cancels the guide travel queued before it (no late jump to the old destination)',T.ev('entered.slice('+n0+').join()')==='hub');
 // 길잡이 이어 켜기
 T.ev('guide=false;');T.tickIv(8);ok('guide is switched back on after 6 s without input',T.ev('guide')===true&&T.api.inspect().stats.guideResumed>=1);
 // 끄기
 T.api.set({on:false});ok('turning off stops speech and empties the queue',T.api.inspect().queue===0&&T.api.inspect().current===null);
 T.ev(`playScenes([{key:'dist02:pre',id:'dist02',text:'다시 창으로 보는 글.'}],null)`);ok('when off, story windows behave as before',T.ev('storyScene&&storyScene.key')==='dist02:pre');
 ok('prefs persisted under storyworld.r370.cinema',JSON.parse(T.store['storyworld.r370.cinema']).on===false);}
{const T=mk();T.ev('showSettings()');const c=T.sb.document.getElementById('r370Cinema'),v=T.sb.document.getElementById('r370Voice');
 ok('settings: cinema checkbox + voice picker added once',!!c&&!!v&&c.checked===false);c.checked=true;c.onchange();ok('settings checkbox turns cinema on',T.api.prefs().on===true);}
// 최종장: 줄이지 않고 끝까지
{const T=mk();T.api.set({on:true});const text=Array.from({length:60},(_,i)=>'마지막 장의 문장 '+i+'이었다.').join(' ');
 T.ev(`playScenes([{key:'finale.core-preserved',id:'dist01',title:'최종장',text:${JSON.stringify(text)}}],null)`);
 const s=T.api.inspect().stats;ok('finale is read in full (no abridging, no deadline)',s.kept===60&&s.dropped===0&&T.api.inspect().deadlineIn===null,s);}
// 목소리가 없으면 자막만
{const T=mk({voices:[]});T.api.set({on:true});T.ev(`playScenes([{key:'dist01:pre',id:'dist01',text:'첫째였다. 둘째였다.'}],null)`);T.run(30);
 ok('no Korean voice → subtitles only, still drains',T.spoken.length===0&&T.api.inspect().stats.silent===2&&T.api.inspect().queue===0);}
// 지역 시간 배우기
{const T=mk();T.api.set({on:true});T.tickIv(2);T.ev('room={id:"dist02"}');T.tickIv(1);T.tickIv(30);T.ev('room={id:"dist01"}');T.tickIv(1);
 const L=T.api.inspect().learned;ok('learns time spent per zone (EMA) and stores it',L.dist02>25&&L.dist02<40&&JSON.parse(T.store['storyworld.r370.zoneTimes']).dist02>0,L);}
// 쪽지
{const T=mk();T.api.set({on:true});const held=T.sb.window.__STORYWORLD_GUIDE_FRAGMENT_R365__.hold({title:'진료기록',text:'환자는 잠들지 못했다. 둘째 줄이었다.'});
 ok('fragments: window held and up to 3 lines queued as low-priority',held===true&&T.api.inspect().stats.fragments===1&&T.spoken.length===1);}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' :: '+JSON.stringify(c.detail)));
console.log(`R370 cinema mode: ${pass}/${checks.length}`);process.exit(pass===checks.length?0:1);
