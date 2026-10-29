// R125 CPU check: 사몽 구역 분위기 소리(ambience-r125.js). 가짜 Web Audio 로 돌려, 분위기마다 깔리는 소리를 고르는지,
// 감정의 탑은 높을수록 바람이 세지는지, 효과음 끔·음량 0·탭 숨김·사몽 밖에서는 조용한지, 구역을 바꾸면 이전 소리를 거두는지,
// 게임의 audioContext 를 빌려 쓰고 새로 열지 않는지, 소리 크기 상한, 새 파일 등록을 본다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text'),REPO=path.join(ROOT,'..');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,300)));};
const live=new Set();let started=0,stopped=0,created=0;
const param=v=>({value:v,targets:[],setValueAtTime(x){this.value=x;},exponentialRampToValueAtTime(x){this.value=x;},setTargetAtTime(x){this.value=x;this.targets.push(x);},cancelScheduledValues(){},connect(){}});
function node(kind){const o={kind,connect(t){return t;},disconnect(){}};return o;}
function srcNode(kind,A){const o=node(kind);o.start=()=>{started++;live.add(o);};o.stop=()=>{stopped++;live.delete(o);};return o;}
let made=0;
function AC(){made++;const A={state:'running',currentTime:0,sampleRate:8000,destination:node('dest'),
 createGain(){const g=node('gain');g.gain=param(1);return g;},createOscillator(){const o=srcNode('osc');o.frequency=param(440);o.type='sine';return o;},
 createBufferSource(){const s=srcNode('buf');s.loop=false;return s;},createBiquadFilter(){const f=node('filter');f.frequency=param(350);f.Q=param(1);f.type='lowpass';return f;},
 createBuffer(c,len,sr){return{sampleRate:sr,getChannelData:()=>new Float32Array(len)};}};
 for(const k of ['createGain','createOscillator','createBufferSource','createBiquadFilter']){const f=A[k];A[k]=function(){const o=f.call(this);o.context=A;return o;};}// 실제 노드처럼 context 를 단다
 return A;}
const store=new Map();
const sb={console,Math,JSON,Object,Array,Number,String,Boolean,Error,Set,Map,Float32Array,setInterval:()=>1,clearInterval(){},
 localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},document:{hidden:false,getElementById:()=>null},
 settings:{sound:true,volume:1},audioContext:null};
sb.window=sb;let moodState=null;sb.__STORYWORLD_MOOD_R123__={inspect:()=>moodState};
vm.createContext(sb);vm.runInContext(fs.readFileSync(path.join(SRC,'ambience-r125.js'),'utf8'),sb,{filename:'ambience-r125.js'});
const S=sb.__STORYWORLD_AMBIENCE_R125__;
check('module loads',S&&S.revision==='R125-ambience-1');
const mood=fs.readFileSync(path.join(SRC,'samong-mood-r123.js'),'utf8');const themes=[...mood.matchAll(/^\s{2}([a-z]+):\{tint:/gm)].map(m=>m[1]);
check('every R123/R124 mood theme has a sound plan with known events',themes.length>=18&&themes.every(t=>S.plan[t])&&Object.values(S.plan).every(p=>p.ev.every(e=>S.events.includes(e))),themes.filter(t=>!S.plan[t]).join(','));
moodState={theme:'school'};S.tick();check('no game audio context yet → silent and never opens its own',made===0&&S.inspect().bed===null);
sb.audioContext=AC();const A=sb.audioContext;S.tick();
check('borrows the game audio context and lays a bed for the zone (school → room tone)',made===1&&S.inspect().bed==='room'&&live.size>0);
const before=live.size;A.currentTime=20;for(let i=0;i<4;i++){A.currentTime+=15;S.tick();}
check('occasional sounds fire (발소리·종) and finish',S.inspect().stats.events>=2);
moodState={theme:'tower',floor:2};A.currentTime+=1;S.tick();const bedLow=S.inspect().bed;
check('changing zone retires the previous bed (stop called) and lays wind for the tower',bedLow==='wind'&&S.inspect().stats.stops>=1);
const gainsMade=[];const cg=A.createGain;A.createGain=function(){const g=cg.call(this);gainsMade.push(g);return g;};
moodState={theme:null};A.currentTime+=1;S.tick();const at=gainsMade.length;const level=f=>{moodState={theme:'tower',floor:f};A.currentTime+=1;S.tick();const bedG=gainsMade[at];return bedG?.gain.targets.slice(-1)[0];};// 탑에 들어설 때 처음 만든 gain 이 바람 bed
const g1=level(1),g8=level(8),g16=level(16);
check('tower wind grows with the floor (1F < 8F < 16F)',g1<g8&&g8<g16,[g1,g8,g16].join(' '));
moodState={theme:'root'};A.currentTime+=1;S.tick();const e0=S.inspect().stats.events;A.currentTime+=1.4;S.tick();A.currentTime+=1.4;S.tick();
check('threshold root zone: heartbeat every ~1.3 s',S.inspect().stats.events-e0>=2&&S.inspect().bed==='drone');
sb.settings.sound=false;A.currentTime+=1;S.tick();check('효과음 끔 → bed retired, silent',S.inspect().bed===null);sb.settings.sound=true;
sb.settings.volume=0;A.currentTime+=1;S.tick();check('음량 0 → silent',S.inspect().bed===null);sb.settings.volume=1;
sb.document.hidden=true;A.currentTime+=1;S.tick();check('tab hidden → silent',S.inspect().bed===null);sb.document.hidden=false;
moodState={theme:null};A.currentTime+=1;S.tick();check('outside 사몽 zones → silent',S.inspect().bed===null);
S.set({on:false});moodState={theme:'machine'};A.currentTime+=1;S.tick();check('설정: 분위기 소리 끄기',S.inspect().bed===null);S.set({on:true,level:.6});
check('설정 저장(r125.ambience)',JSON.parse([...store.entries()].find(([k])=>k.endsWith('r125.ambience'))[1]).on===true);
const src=fs.readFileSync(path.join(SRC,'ambience-r125.js'),'utf8');
check('quiet by design: master ≤ 0.14 × level × 효과음 음량, no AudioContext constructed',/return \.14\*prefs\.level/.test(src)&&!/new (window\.)?(webkit)?AudioContext|new A\(\)/.test(src));
check('code-only: no audio files referenced',!/\.(mp3|ogg|wav|m4a)['"]/.test(src)&&!/assets\//.test(src));
check('no failures recorded',S.inspect().failures===0,S.inspect().lastError);
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
check('runtime copy matches source; loads after the R123 mood and before audio-r98',fs.readFileSync(path.join(RT,'ambience-r125.js'),'utf8')===src&&html.indexOf('ambience-r125.js')>html.indexOf('samong-mood-r123.js')&&html.indexOf('ambience-r125.js')<html.indexOf('src="./audio-r98.js"'));
const pub=fs.readFileSync(path.join(REPO,'scripts','verify-r96-public.py'),'utf8'),ci=fs.readFileSync(path.join(REPO,'.github','workflows','pages.yml'),'utf8'),inputs=JSON.parse(fs.readFileSync(path.join(ROOT,'runtime-inputs.json'),'utf8'));
check('registered in runtime inputs, public verify list and CI',inputs.textPaths.includes('ambience-r125.js')&&pub.includes("'ambience-r125.js'")&&ci.includes('r96/qa/r125/ambience-cpu-check.cjs'));
console.log(`\n${n-failed}/${n} passed`);process.exit(failed?1:0);
