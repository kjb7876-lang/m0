'use strict';
// R1212 CPU 검사 — 코드로 합성하던 효과음(WebAudio 오실레이터·잡음)을 ElevenLabs 로 만든 소리 파일로 바꾼다
// (사용자 2026-11-19 "단순코드로만든 모든효과음 조사해서 일레븐랩스로 각각상황에 맞는 고품질 효과음으로 바꿔").
//  대상(전수 조사 결과): R125 사몽 분위기 소리(깔리는 소리 5·가끔 소리 17), R356 카이로 시계(초침·종·쇠종),
//  R568 보스 등장 울림, R123 층·연도 표시 숫자 딸깍. 파일이 아직 안 받아졌거나 끄면 예전 합성 소리 그대로(되돌림 안전).
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,400):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const N='synth-sfx-r1212.js',API='__STORYWORLD_SYNTH_SFX_R1212__',SRC=rd(path.join(R,'client-source',N));
// ── 연결 ──
ok(SRC.length>0,N+' 있음');
ok(SRC.length>0&&rd(path.join(R,'runtime-text',N))===SRC,'runtime-text 사본 = client-source');
{const html=rd(path.join(R,'runtime-text','index.html')),t=x=>html.indexOf('<script src="./'+x+'"></script>');
 ok(t(N)>0&&t(N)<t('combat-r118.js'),'태그: combat-r118 앞',t(N));}
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1212/r1212-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+N+"'"),'공개 확인 목록');
{const inp=JSON.parse(rd(path.join(R,'runtime-inputs.json'))||'{}');ok((inp.textPaths||[]).includes(N),'runtime-inputs 에 새 파일');}
ok(!/creative_generate|api\.elevenlabs|xi-api-key/i.test(SRC),'코드에 유료 생성 호출 없음');
ok(!/createOscillator/.test(SRC),'새 오버레이는 합성하지 않음(파일만 재생)');
// ── 표: 전수 조사한 합성 소리가 모두 파일에 이어짐 ──
const R125=rd(path.join(R,'client-source','ambience-r125.js'));
const evNames=[...R125.matchAll(/^\s{2}([a-z]+)\(A,d,t\)\{/gm)].map(m=>m[1]);
const beds=['wind','leaves','hum','drone','room'];
const NEED=[...evNames.map(e=>'amb_'+e),...beds.map(b=>'bed_'+b),'kairo_tick','kairo_chime','kairo_toll','boss_reveal','banner_tick'];
ok(evNames.length===17,'R125 가끔 소리 17종 읽음',evNames);
let H=null,sb=null;const fetched=[];
function boot(store={}){sb={console,Math,JSON,Object,Array,Number,String,Boolean,Error,Set,Map,WeakMap,Promise,ArrayBuffer,Float32Array,setTimeout,clearTimeout,setInterval:()=>1,clearInterval(){},
 localStorage:{getItem:k=>k in store?store[k]:null,setItem(k,v){store[k]=String(v);}},document:{hidden:false},settings:{sound:true,volume:1},
 fetch:u=>{fetched.push(String(u));return Promise.resolve({ok:true,arrayBuffer:()=>Promise.resolve(new ArrayBuffer(16))});}};
 sb.window=sb;vm.createContext(sb);if(SRC)vm.runInContext(SRC,sb,{filename:N});return sb[API]||null;}
H=boot();
ok(!!H,'API '+API);
const T=H?.table||{};
const missing=NEED.filter(k=>!(T[k]&&Array.isArray(T[k].files)&&T[k].files.length));
ok(missing.length===0,'합성 소리 '+NEED.length+'종 모두 표에 있음',missing);
const files=[...new Set(Object.values(T).flatMap(v=>v.files||[]))];
const lost=files.filter(f=>!fs.existsSync(path.join(R,'runtime-text',f)));
ok(files.length>0&&lost.length===0,'모든 소리 파일 있음('+files.length+')',lost);
const big=files.filter(f=>{const p=path.join(R,'runtime-text',f);return fs.existsSync(p)&&fs.statSync(p).size>(/\/bed-|r664/.test(f)?260000:70000);});
ok(big.length===0,'파일 크기 상한(한 번 소리 70KB·깔리는 소리 260KB)',big);
const own=files.filter(f=>/^assets\/r1212\/sfx\//.test(f)),sz=own.reduce((a,f)=>a+(fs.existsSync(path.join(R,'runtime-text',f))?fs.statSync(path.join(R,'runtime-text',f)).size:0),0);
ok(own.length>=20&&sz<1600000,'새 파일 20개 이상·합 1.6MB 미만(Pages 예산)',{n:own.length,sz});
{const idx=JSON.parse(rd(path.join(R,'runtime-text','assets/r1212/sfx/index.json'))||'{}');
 ok(own.every(f=>idx.files&&idx.files[f]&&/ElevenLabs/.test(idx.files[f].origin||'')&&idx.files[f].prompt&&idx.files[f].sha256),'index.json: 파일마다 출처(ElevenLabs)·프롬프트·해시',own.filter(f=>!(idx.files&&idx.files[f])));
 ok(!JSON.stringify(idx).match(/maple|warcraft|starcraft|blizzard|nexon|diablo/i),'프롬프트에 외부 게임 이름 없음');}
ok(Object.values(T).every(v=>v.gain>0&&v.gain<=2.5),'게인 범위 0~2.5');
// 사용자 2026-11-19 07:52Z "소리가 너무 높고 깨지는소리는 개선해줘": 파일마다 5kHz 위 비중·2~5kHz 거슬림·피크·잘린 파형·저음 몰림을 index.json 수치로 본다.
{const idx=JSON.parse(rd(path.join(R,'runtime-text','assets/r1212/sfx/index.json'))||'{}'),F=idx.files||{};
 const hi=Object.entries(F).filter(([f,m])=>!(m.hfShare5k<=.12)),harsh=Object.entries(F).filter(([f,m])=>!(m.harshShare2to5k<=.35)),pk=Object.entries(F).filter(([f,m])=>!(m.peakDb<=-6)),
  clip=Object.entries(F).filter(([f,m])=>!(m.flatRuns===0)),boom=Object.entries(F).filter(([f,m])=>!(m.lowShare150<=.85));
 ok(!hi.length,'고음 줄임: 5kHz 위 비중 12% 이하',hi.map(([f,m])=>f.split('/').pop()+' '+m.hfShare5k));
 ok(!harsh.length,'거슬림 줄임: 2~5kHz 35% 이하',harsh.map(([f,m])=>f.split('/').pop()+' '+m.harshShare2to5k));
 ok(!pk.length,'피크 -6dBFS 이하',pk.map(([f,m])=>f.split('/').pop()+' '+m.peakDb));
 ok(!clip.length,'잘린(평평한) 파형 0 — 원본이 0dBFS 를 넘은 것은 걸러 냄',clip.map(([f,m])=>f.split('/').pop()+' '+m.flatRuns));
 ok(!boom.length,'스피커가 떨리는 초저음 몰림 85% 이하',boom.map(([f,m])=>f.split('/').pop()+' '+m.lowShare150));
 const lowG=['amb_heart','amb_boom','boss_reveal'].filter(k=>!(T[k]&&T[k].gain<=1.2));ok(!lowG.length,'저음 소리 게인 1.2 이하(작은 스피커 찌그러짐)',lowG.map(k=>k+' '+(T[k]&&T[k].gain)));
 ok(!(T.amb_glass&&T.amb_glass.rate>1.2),'유리음 재생 속도 1.2 이하(다시 높아지지 않게)',T.amb_glass&&T.amb_glass.rate);}
// ── 재생 동작(가짜 Web Audio) ──
const live=[];let oscs=0;
const param=v=>({value:v,setValueAtTime(x){this.value=x;},exponentialRampToValueAtTime(x){this.value=x;},setTargetAtTime(x){this.value=x;},cancelScheduledValues(){},linearRampToValueAtTime(x){this.value=x;}});
const node=k=>({kind:k,to:[],connect(t){this.to.push(t);return t;},disconnect(){}});
function AC(){const A={state:'running',currentTime:5,sampleRate:8000,destination:node('dest'),decoded:0,
 createGain(){const g=node('gain');g.gain=param(1);return g;},createOscillator(){oscs++;const o=node('osc');o.frequency=param(440);o.start=()=>{};o.stop=()=>{};return o;},
 createBufferSource(){const s=node('buf');s.loop=false;s.playbackRate=param(1);s.start=(t,off)=>{s.at=t;live.push(s);};s.stop=()=>{s.stopped=true;};return s;},
 createBiquadFilter(){const f=node('filter');f.frequency=param(350);f.Q=param(1);return f;},createBuffer(c,len,sr){return{sampleRate:sr,length:len,getChannelData:()=>new Float32Array(len)};},
 decodeAudioData(ab){A.decoded++;return Promise.resolve({duration:1,length:8000,sampleRate:8000,numberOfChannels:1});}};return A;}
(async()=>{
 const A=AC(),dest=node('bus');
 ok(H&&H.play('amb_drip',A,dest,A.currentTime,{})===null,'받기 전에는 null(호출한 쪽이 합성으로 대신)');
 await H?.preload(A);
 ok(H&&H.ready('amb_drip',A)&&H.ready('bed_drone',A)&&H.ready('boss_reveal',A),'preload 뒤 준비됨');
 const s=H&&H.play('amb_drip',A,dest,6,{gain:.5});
 ok(s&&s.kind==='buf'&&s.at===6&&s.buffer,'파일 재생: 버퍼 소스를 정한 시각에 시작');
 const g=s&&s.to[0];ok(g&&g.kind==='gain'&&g.to.includes(dest)&&Math.abs(g.gain.value-.5*T.amb_drip.gain)<1e-9,'게인 = 표 게인 × 호출 게인, 받은 목적지로 연결',g&&g.gain.value);
 const s2=H&&H.play('banner_tick',A,dest,6,{rate:1.3});ok(s2&&Math.abs(s2.playbackRate.value-1.3*(T.banner_tick.rate||1))<1e-9,'재생 속도 옵션');
 const b=H&&H.bed('bed_drone',A,dest);ok(b&&b.loop===true&&b.kind==='buf','깔리는 소리는 반복 재생');
 ok(H&&H.files&&!H.files().some(f=>/^https?:/.test(f)),'같은 사이트 상대 경로만 받음');
 // 끄기
 const H2=boot({'storyworld.r1212.sfx':'0'});const A2=AC();await H2.preload(A2);ok(H2.play('amb_drip',A2,dest,6,{})===null&&H2.bed('bed_drone',A2,dest)===null,'끄기(storyworld.r1212.sfx=0) → 예전 합성 그대로');
 // ── R125 훅: 파일이 준비되면 오실레이터를 만들지 않음, 없으면 합성 그대로 ──
 function runR125(withH){const box={console,Math,JSON,Object,Array,Number,String,Boolean,Error,Set,Map,Float32Array,setInterval:()=>1,clearInterval(){},
  localStorage:{getItem:()=>null,setItem(){}},document:{hidden:false,getElementById:()=>null},settings:{sound:true,volume:1},audioContext:null};box.window=box;
  let m={theme:'ink'};box.__STORYWORLD_MOOD_R123__={inspect:()=>m};if(withH)box[API]=withH;vm.createContext(box);vm.runInContext(R125,box);const S=box.__STORYWORLD_AMBIENCE_R125__;
  const C=AC();box.audioContext=C;return{S,C,set:x=>{m=x;}};}
 const H3=boot();const C0=AC();await H3.preload(C0);
 const pre=live.length;oscs=0;const r1=runR125(H3);await H3.preload(r1.C);r1.S.tick();for(let i=0;i<6;i++){r1.C.currentTime+=15;r1.S.tick();}
 r1.set({theme:'root'});for(let i=0;i<4;i++){r1.C.currentTime+=1.4;r1.S.tick();}
 r1.set({theme:'machine'});for(let i=0;i<4;i++){r1.C.currentTime+=15;r1.S.tick();}
 ok(oscs===0&&live.length-pre>=8,'R125: 파일 준비 → 깔리는 소리·가끔 소리·심장 박동 모두 파일, 오실레이터 0',{oscs,played:live.length-pre});
 oscs=0;const r2=runR125(null);r2.S.tick();r2.set({theme:'machine'});r2.C.currentTime+=1;r2.S.tick();ok(oscs>0,'R125: 오버레이 없으면 예전 합성 그대로',oscs);
 // R125 가 파일 없이 합성으로 깔았다가 파일이 오면 바꿔 끼움
 const H4=boot();const r3=runR125(H4);r3.set({theme:'machine'});r3.S.tick();const firstBed=r3.S.inspect().bed;await H4.preload(r3.C);oscs=0;r3.C.currentTime+=1;r3.S.tick();r3.C.currentTime+=1;r3.S.tick();
 ok(firstBed==='hum'&&r3.S.inspect().bed==='hum'&&r3.S.inspect().stats.stops>=1,'R125: 합성으로 먼저 깔린 소리를 파일이 오면 바꿔 낌',r3.S.inspect());
 // ── 나머지 훅(문자열) ──
 const K=rd(path.join(R,'client-source','kairo-homage-r356.js')),B=rd(path.join(R,'client-source','boss-cinematic-r568.js')),M=rd(path.join(R,'client-source','samong-mood-r123.js'));
 ok(/__STORYWORLD_SYNTH_SFX_R1212__/.test(K)&&/'kairo_'\+kind/.test(K),'R356 카이로 play() 가 파일 먼저');
 ok(/__STORYWORLD_SYNTH_SFX_R1212__/.test(B)&&/'boss_reveal'/.test(B),'R568 보스 등장 울림이 파일 먼저');
 ok(/__STORYWORLD_SYNTH_SFX_R1212__/.test(M)&&/'banner_tick'/.test(M),'R123 숫자 딸깍이 파일 먼저');
 for(const f of ['kairo-homage-r356.js','boss-cinematic-r568.js','samong-mood-r123.js','ambience-r125.js'])ok(rd(path.join(R,'client-source',f))===rd(path.join(R,'runtime-text',f)),f+' runtime 사본 같음');
 console.log(`\n${n-bad}/${n} ${bad?'FAIL':'ok'}`);process.exit(bad?1:0);
})().catch(e=>{console.log('FAIL 예외',e&&e.stack);process.exit(1);});
