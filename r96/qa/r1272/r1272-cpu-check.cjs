// R1272 CPU 검사: 입장(맵) 영상에서 서사 음성이 들리게 — 사용자 2026-11-20 "맵씬영상에서 오디오 서사음성 안들리는문제개선"
//  + "기본적으로 서사창 키고 오디오도 처음에는 들리게해 끄기 전까지".
//  원인(실측): 영상 자체 소리(평균 -17.5dB)가 낭독 녹음(-24.3dB)보다 약 7dB 커서 말을 덮음. 말줄임(…) 자막 2줄은 녹음 매칭이 안 돼 무음.
//  실행: node r96/qa/r1272/r1272-cpu-check.cjs
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const SRC=fs.readFileSync(path.join(__dirname,'../../client-source/memory-voice-r1223.js'),'utf8');
const res=[];const check=(n,ok,d='')=>{res.push({n,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+n+(d!==''?' :: '+d:''));};
const FULL='바닥에 흩어진 주사기들이 달빛을 반사했고, 벽에는 내가 약을 끊지 못하면서 되풀이하던 말들이 적혀 있었다.';
const CANON='그의 목소리가 들릴 때마다 나는 항상 약을 갈망했다. '+FULL+' 나는 다른 사람과 다르며 마음만 먹으면 끊을 수 있다는 문장이었다.';
function make(store={},opt={}){
 const LS={...store};const plays=[];let cur=null;
 const R381={has:t=>opt.recs.includes(String(t).trim()),play:(t,o)=>{const h={id:'v'+plays.length,t,o,stop(){}};plays.push(h);cur=h;return h;},stop(){},preload(){},inspect:()=>({playing:cur?.id||null})};
 const video={volume:opt.base??.8,playbackRate:1,duration:10,currentTime:1,paused:false,muted:false,pause(){this.paused=true;},play(){this.paused=false;return {catch(){}};}};
 const cap={className:'cap on',textContent:opt.cap||''};
 const root={querySelector:s=>s==='.cap'?cap:s==='video'?video:null,insertBefore(){}};
 let rootOn=true;
 const document={getElementById:id=>id===(opt.rootId||'r369v')&&rootOn?root:null,querySelectorAll:()=>[],head:null,createElement:()=>({setAttribute(){},appendChild(){}})};
 const r365=opt.r365?{p:{show:true,manual:true,skipStory:!!opt.r365.skipStory},set(p){Object.assign(this.p,p);this.sets=(this.sets||0)+1;},prefs(){return {...this.p};}}:null;
 const r177=opt.r177?{p:{autoShow:opt.r177.autoShow},set(p){Object.assign(this.p,p);this.sets=(this.sets||0)+1;},prefs(){return {...this.p};}}:null;
 const ctx={console,Math,JSON,Object,Array,String,Number,Error,Set,Map,RegExp,Event:function(t){this.type=t;},performance:{now:()=>0},
  localStorage:{getItem:k=>k in LS?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v);}},setInterval(){},document,settings:{narration:true,voice:.8},
  __STORYWORLD_VOICE_R381__:R381,__STORYWORLD_STORY_CANON_R106__:{zones:{ep1a10:{pre:CANON}}},__STORYWORLD_GUIDE_FRAGMENT_R365__:r365,__STORYWORLD_STORY_COLLECT_R177__:r177};
 ctx.window=ctx;vm.createContext(ctx);
 try{vm.runInContext(SRC,ctx,{filename:'memory-voice-r1223.js'});}catch(e){check('모듈 실림',false,String(e));}
 const M=ctx.__STORYWORLD_MEMORY_VOICE_R1223__;
 return {M,ctx,LS,plays,video,cap,end:()=>{const h=plays[plays.length-1];cur=null;h?.o?.onend?.();},close:()=>{rootOn=false;},r365,r177,R381};}
// ① 낭독 중 영상 소리를 낮춘다(정상)
{const T=make({},{recs:['그의 목소리가 들릴 때마다 나는 항상 약을 갈망했다.'],cap:'그의 목소리가 들릴 때마다 나는 항상 약을 갈망했다.'});T.M.step();
 check('① 자막이 뜨면 녹음 재생',T.plays.length===1);
 check('① 낭독 중 영상 소리를 0.3배 이하로 낮춤(낭독이 위로 들리게)',T.video.volume<=.8*.3+1e-9&&T.video.volume>0,String(T.video.volume));
 T.end();T.cap.className='cap';T.cap.textContent='';T.M.step();
 check('① 낭독이 끝나면 영상 소리를 원래(0.8)로 되돌림',Math.abs(T.video.volume-.8)<1e-9,String(T.video.volume));
 check('① 영상 음소거로 바꾸지 않음(muted 그대로)',T.video.muted===false);}
// ② 경계: 영상 기본 음량이 0.5 → 낮췄다 0.5 로 복원 / 0 이면 0 유지
{const T=make({},{recs:['A 문장이다.'],cap:'A 문장이다.',base:.5});T.M.step();
 check('② 기본 0.5 → 낮춤도 비례(0.15 이하)',T.video.volume<=.15+1e-9&&T.video.volume>0,String(T.video.volume));
 T.end();T.cap.className='cap';T.M.step();check('② 기본 0.5 로 복원',Math.abs(T.video.volume-.5)<1e-9,String(T.video.volume));}
{const T=make({},{recs:['A 문장이다.'],cap:'A 문장이다.',base:0});T.M.step();check('② 기본 0 이면 0 유지(NaN 없음)',T.video.volume===0,String(T.video.volume));}
// ③ 회귀: '음성 앞으로 끄기'를 누르면 영상 소리를 원래대로
{const T=make({},{recs:['A 문장이다.'],cap:'A 문장이다.'});T.M.step();T.M.set(false);
 check('③ 끄기 누르면 영상 소리 원래(0.8)',Math.abs(T.video.volume-.8)<1e-9,String(T.video.volume));T.M.set(true);}
// ③ 회귀: 녹음 없는 자막이면 영상 소리를 낮추지 않음
{const T=make({},{recs:[],cap:'녹음 없는 문장이다.'});T.M.step();check('③ 녹음 없는 자막은 영상 소리 그대로',T.video.volume===.8&&T.plays.length===0,String(T.video.volume));}
// ④ 말줄임(…) 자막 → 정본 원문 문장 녹음으로
{const T=make({},{recs:[FULL],cap:'바닥에 흩어진 주사기들이 달빛을 반사했고…'});T.M.step();
 check('④ 말줄임 자막은 정본에서 이어지는 원문 문장 녹음을 틂',T.plays.length===1&&T.plays[0].t===FULL,JSON.stringify(T.plays.map(p=>p.t)));}
{const T=make({},{recs:[FULL],cap:'정본에 없는 말줄임 자막…'});T.M.step();
 check('④ 정본에 없는 말줄임 자막은 조용히 넘어감(오류 없음)',T.plays.length===0&&T.M.inspect().stats.moduleErrors===0);}
{const T=make({},{recs:[FULL],cap:'바닥에…'});T.M.step();check('④ 너무 짧은 말줄임(6자 미만)은 추측하지 않음',T.plays.length===0);}
// ⑤ 기본값(사용자 "기본적으로 서사창 키고 오디오도 처음에는 들리게해 끄기 전까지"): 처음 하는 사람은 음성 켜짐, 끈 사람은 계속 꺼짐
{const T=make({},{recs:['A 문장이다.'],cap:'A 문장이다.'});check('⑤ 처음 하는 사람은 서사 음성 기본 켜짐',T.M.prefs().on===true&&T.M.inspect().allowed===true);T.M.step();check('⑤ 처음부터 영상 자막 음성이 나옴',T.plays.length===1);}
{const T=make({'storyworld.r1223.memvoice':JSON.stringify({on:false})},{recs:['A 문장이다.'],cap:'A 문장이다.'});T.M.step();check('⑤ 사용자가 끈 뒤에는 계속 꺼짐(영상 소리도 그대로)',T.M.prefs().on===false&&T.plays.length===0&&T.video.volume===.8);}
// ⑥ 엔진·창 모듈 기본값: 서사 창(R365 skipStory=false)·기억 조각 창(R177 autoShow=true)·설정 narration=true·voice>0
{const rd=f=>fs.readFileSync(path.join(__dirname,'../../client-source/'+f),'utf8');
 check('⑥ 서사 창 기본 켜짐(R365 skipStory:false)',/let prefs=\{show:true,manual:true,skipStory:false\}/.test(rd('guide-fragment-r365.js')));
 check('⑥ 기억 조각 창 기본 켜짐(R177 autoShow:true)',/let prefs=\{on:true,pages:true,autoShow:true/.test(rd('story-collect-r177.js')));
 const html=fs.readFileSync(path.join(__dirname,'../../runtime-text/index.html'),'utf8');
 check('⑥ 설정 기본: 서사 음성 자동 재생 켜짐·음성 음량 0.8',/let settings=\{[^}]*narration:true[^}]*voice:\.8/.test(html));}
const failed=res.filter(r=>!r.ok).length;console.log(JSON.stringify({total:res.length,failed}));process.exit(failed?1:0);
