'use strict';
// R664 — 사용자 2026-11-11 "지역 배경음·환경음: 지역마다 바람·물·웅성임 환경음 루프(ElevenLabs), 이음매 없이 반복, 효과음·음성보다 작게, 듣기 편하게".
//  ElevenLabs 로 만든 20초 환경음 6종(hall·wind·water·crowd·stone·night)을 지역(에피소드)마다 한 겹 깔아 둔다.
//  게임이 이미 연 audioContext 를 빌려 쓰고(새로 열지 않음), 사몽 구역은 R125 가 맡으므로 건너뛴다. 끄기: storyworld.r664.ambience = '0'.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const src=rd(path.join(R,'client-source/ambience-r664.js'));
ok(src.length>0,'client-source/ambience-r664.js 있음');
ok(rd(path.join(R,'runtime-text/ambience-r664.js'))===src&&src.length>0,'runtime-text 사본 = client-source');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r664/r664-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const html=rd(path.join(R,'runtime-text/index.html')),verify=rd(path.join(ROOT,'scripts/verify-r96-public.py')),man=rd(path.join(R,'runtime-manifest.json'));
ok(html.includes('<script src="./ambience-r664.js"></script>'),'index.html 스크립트 태그');
ok(verify.includes("'ambience-r664.js'")&&/assets\/r664\//.test(verify),'verify-r96-public 기대 목록(js·assets/r664/)');
ok(man.includes('ambience-r664.js'),'runtime-manifest 에 js 등록');
// ── 음원
const D='assets/r664/ambience/',BEDS=['hall','wind','water','crowd','stone','night'];let idx={files:{}};try{idx=JSON.parse(rd(path.join(R,'runtime-text',D,'index.json')));}catch(_){}
const F=idx.files||{};ok(BEDS.every(k=>F[k])&&Object.keys(F).length===BEDS.length&&/ElevenLabs/.test(idx.origin||''),'index.json 6종·출처 기록('+Object.keys(F).join(',')+')');
let total=0;
for(const k of BEDS){const f=F[k]||{};let b=null;try{b=fs.readFileSync(path.join(R,'runtime-text',f.path));}catch(_){}
 ok(!!b&&b.length===f.bytes&&crypto.createHash('sha256').update(b).digest('hex')===f.sha256&&man.includes(f.path),k+': 파일 = index.json 해시·크기, manifest 등록');total+=f.bytes||0;
 ok(/^[0-9a-f]{64}$/.test(f.sourceSha256||'')&&!!f.prompt&&!!f.use,k+': 원본 해시·생성 문구·쓰임');
 ok(f.duration>=15&&f.duration<=22,k+': 길이 15~22초('+f.duration+')');
 ok(f.lowShare150<=.08,k+': 150Hz 아래 8% 이하 — 쿵·웅웅 없음('+f.lowShare150+')');
 ok(f.harshShare2to5k<=.35&&f.hfShare6k<=.12,k+': 2~5kHz 35%·6kHz 위 12% 이하 — 쉿쉿·쨍한 소리 없음('+f.harshShare2to5k+', '+f.hfShare6k+')');
 ok(f.peakDb<=-14&&f.rmsDb>=-36&&f.rmsDb<=-30,k+': 피크 -14dB 이하·평균 -36~-30dB — 효과음(피크 -9~-14dB)보다 작은 바닥('+f.peakDb+', '+f.rmsDb+')');
 ok(f.seamJump<=.02,k+': 처음·끝 표본 차이 작음 — 반복 이음매 틱 없음('+f.seamJump+')');}
ok(total>0&&total<=700000,'음원 합계 700KB 이하('+total+')');
// ── 동작(vm)
function mk(opt={}){const created=[],stops=[],gains=[];let t=10,ctxCount=0;
 let gc=0;const param=(v=0,bus=false)=>({value:v,setTargetAtTime(x,at,tc){this.value=x;if(bus)gains.push(x);},cancelScheduledValues(){}});
 const A={state:'running',get currentTime(){return t;},destination:{},sampleRate:44100,createGain(){return{gain:param(0,gc++===0),connect(){}};},
  createBufferSource(){const s={buffer:null,loop:false,connect(){},start(at,off){s.startedAt=at;s.offset=off;},stop(at){stops.push({s,at});}};created.push(s);return s;},decodeAudioData(ab){return Promise.resolve({duration:18.4,bytes:ab.byteLength});}};
 const fetched=[];const ctx={window:{},audioContext:opt.noAudio?null:A,localStorage:{getItem:k=>k==='storyworld.r664.ambience'?(opt.pref??null):null,setItem(){}},
  document:{hidden:!!opt.hidden,getElementById:()=>null},settings:{sound:opt.sound!==false,volume:opt.volume??.8},started:opt.started!==false,zone:opt.zone??'ep1a08',modal:null,room:{samongR103:!!opt.samong},
  fetch:p=>{fetched.push(p);return Promise.resolve({ok:opt.fail?false:true,arrayBuffer:()=>Promise.resolve(new ArrayBuffer(1000))});},
  setInterval:()=>0,console,Math,Promise,Array,Object,Map,Set,Number,String,JSON,performance:{now:()=>t*1000}};
 ctx.window.window=ctx.window;vm.createContext(ctx);let err=null;try{vm.runInContext('var window=this.window;'+src,ctx);}catch(e){err=e;}
 return{ctx,created,stops,gains,fetched,err,api:ctx.window.__STORYWORLD_AMBIENCE_R664__,adv:s=>{t+=s;},run:c=>vm.runInContext(c,ctx),flush:()=>new Promise(r=>setTimeout(r,5))};}
(async()=>{
 const M=mk(),api=M.api;ok(!M.err&&!!api,'오버레이가 오류 없이 올라옴'+(M.err?' ('+M.err.message+')':''));
 if(!api){console.log(n+' checks, '+bad+' failed');process.exit(1);}
 const TABLE=[['hub','crowd'],['village','crowd'],['last302','crowd'],['last303','crowd'],['dist00','wind'],['dist06','wind'],['last301','wind'],['ep1a08','hall'],['ep1a09b','hall'],['ep1a11','hall'],
  ['dreamRest','stone'],['ep1b01','stone'],['ep1b02','stone'],['ep1b09','stone'],['hando01','stone'],['restHando','stone'],['restEp1b','hall'],['u201','hall'],['u206','hall'],['kair01','hall'],['kair10','hall'],['restKairo','hall'],['restLast3','hall'],
  ['restU2','night'],['last304','night'],['last305','night'],['murder01','water'],['murder04','water'],['cult01','night'],['cult06','night']];
 for(const[z,b]of TABLE)ok(api.bedFor(z)===b,'지역 '+z+' → '+b+' (실제 '+api.bedFor(z)+')');
 ok(api.bedFor('')===null&&api.bedFor(undefined)===null&&api.bedFor('zzz')===null,'빈 값·모르는 지역은 소리 없음');
 ok(api.bedFor('sz-s01-a')===null&&api.bedFor('ep1a08',{samong:true})===null,'사몽 구역은 건너뜀(R125 가 맡음)');
 ok(api.bedFor('outdoor')===null&&api.bedFor('ep1a08x')===null&&api.bedFor('xhub')===null,'낱말 경계: 비슷한 글자가 든 다른 이름에 안 걸림');
 // 기본 흐름
 api.tick();await M.flush();
 ok(M.fetched.length===1&&M.fetched[0]===D+'hall.ogg','병원 구역 → hall.ogg 한 번 받음('+M.fetched.join(',')+')');
 ok(M.created.length===1&&M.created[0].loop===true&&M.created[0].buffer&&M.created[0].buffer.duration===18.4,'소스 하나, loop=true');
 ok(M.created[0].offset>=0&&M.created[0].offset<18.4,'시작 위치는 길이 안(다시 들어와도 늘 같은 자리가 아님)');
 api.tick();await M.flush();ok(M.created.length===1&&M.fetched.length===1,'같은 구역에서 다시 tick 해도 새 소스·받기 없음');
 M.ctx.zone='ep1a09';api.tick();await M.flush();ok(M.created.length===1,'같은 소리(hall)를 쓰는 다음 구역으로 가도 끊지 않고 이어감');
 M.ctx.zone='dist01';M.adv(1);api.tick();await M.flush();
 ok(M.created.length===2&&M.fetched[1]===D+'wind.ogg','다른 소리(wind) 구역으로 가면 새 소스');
 ok(M.stops.length===1&&M.stops[0].s===M.created[0]&&M.stops[0].at>M.ctx.audioContext.currentTime+2,'이전 소스는 2초 넘게 서서히 줄인 뒤 멈춤(교차 페이드)');
 M.ctx.zone='ep1a08';api.tick();await M.flush();ok(M.fetched.length===2&&M.created.length===3,'한 번 받은 음원은 다시 받지 않음(캐시)');
 const g0=M.gains.length;M.ctx.zone='sz-s01-a';M.ctx.room.samongR103=true;api.tick();await M.flush();
 ok(M.stops.length===3&&M.created.length===3,'사몽 구역으로 가면 환경음을 줄여 멈춤(R125 와 겹치지 않음)');
 // 끄기·음량
 const O=mk({pref:'0'});O.api.tick();await O.flush();ok(O.created.length===0&&O.fetched.length===0&&O.api.inspect().on===false,"storyworld.r664.ambience='0' 이면 받지도 틀지도 않음");
 const Q=mk({sound:false});Q.api.tick();await Q.flush();ok(Q.created.length===0,'효과음 끔(settings.sound=false)이면 소리 없음');
 const V=mk({volume:0});V.api.tick();await V.flush();ok(V.created.length===0,'음량 0 이면 소리 없음');
 const H=mk({hidden:true});H.api.tick();await H.flush();ok(H.created.length===0,'탭이 숨겨지면 소리 없음');
 const S=mk({started:false});S.api.tick();await S.flush();ok(S.created.length===0,'게임 시작 전(타이틀)에는 소리 없음');
 const N=mk({noAudio:true});let thrown=false;try{N.api.tick();await N.flush();}catch(_){thrown=true;}ok(!thrown&&N.created.length===0,'audioContext 가 없으면 조용히 건너뜀(새로 열지 않음)');
 const X=mk({fail:true});X.api.tick();await X.flush();X.api.tick();await X.flush();ok(X.created.length===0&&X.api.inspect().failed.includes('hall')&&X.fetched.length===1,'받기 실패 → 오류 없이 소리 없음, 같은 파일을 계속 다시 받지 않음');
 // 음량 기준: 효과음보다 작게
 const L=mk({volume:1});L.api.tick();await L.flush();const peakGain=Math.max(...L.gains);ok(peakGain>0&&peakGain<=.6,'음량 1.0 에서도 버스 배율 .6 이하('+peakGain+')');
 const L2=mk({volume:.5});L2.api.tick();await L2.flush();ok(Math.max(...L2.gains)<Math.max(...L.gains)+1e-9&&Math.max(...L2.gains)>0,'설정 음량에 비례');
 const Dk=mk();Dk.ctx.modal=true;Dk.api.tick();await Dk.flush();const dm=Math.max(...Dk.gains);ok(dm<peakGain,'창이 열리면 더 줄임(대화·메뉴)');
 const st=api.inspect();ok(st.revision&&st.directListeningVerified===false&&st.generated==='ElevenLabs text-to-sound v2','inspect(출처·직접 청취 미검증)');
 console.log(n+' checks, '+bad+' failed');process.exit(bad?1:0);})();
