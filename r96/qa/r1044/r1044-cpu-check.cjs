// R1044 CPU 검사: 서사 창 녹음 음성·안 쓰는 단추 정리(narration-voice-r1044.js) — 가짜 엔진·가짜 녹음(R381)에서 실제 모듈을 돌린다.
//  사용자 2026-11-15 "서사텍스트에 지금안쓰는기능들삭제 음성나오는것도테스트".
//  점검에서 찾은 문제: 스토리 모드 보스 입장·진행 서사 창은 문장 녹음(R381)이 있는데도 소리가 나지 않았다(엔진 playVoice 는 빈 voiceManifest 만 봄).
//  ① 서사 창이 뜨면 설정 '서사 음성 자동 재생'(settings.narration)이 켜져 있고 '음성 음량'(settings.voice)>0 일 때 문장 녹음을 차례로 튼다.
//  ② 녹음 없는 문장은 건너뛴다(브라우저 음성으로 대신하지 않음 — 녹음 보류 결정). 다 없으면 아무것도 안 튼다.
//  ③ 다음 장면·창 닫기·텍스트 항상 끄기(바로 넘김) 때 멈춘다. 늦게 온 끝 알림이 옛 장면을 이어 틀지 않는다.
//  ④ 영화 모드·무한생존 중에는 그쪽이 음성을 맡으므로 손대지 않는다.
//  ⑤ 안 쓰는 UI: 서사 창의 '음성 재생'·'음성 정지'·상태 글·'선택 음성 합성' 단추를 DOM 에서 지운다.
//  ⑥ 연결(태그·sync·공개 확인 목록·CI 줄).
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..','..');const FILE=path.join(root,'client-source','narration-voice-r1044.js');
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name+(ok||detail===''?'':' :: '+detail));};
const done=()=>{const failed=results.filter(r=>!r.ok).length;console.log(JSON.stringify({total:results.length,failed,method:'node vm + fake engine/R381; real audio checked by r1044-browser.mjs (headless)'}));process.exit(failed?1:0);};
check('narration-voice-r1044.js 가 있음',fs.existsSync(FILE));if(!fs.existsSync(FILE))done();
const src=fs.readFileSync(FILE,'utf8');
const sentences=t=>String(t||'').split(/\n\s*\n/).flatMap(p=>p.replace(/\s+/g,' ').trim().split(/(?<=[.!?…])\s+/)).map(x=>x.trim()).filter(Boolean).map(text=>({text}));
function make(o={}){
 const els=new Map();const doc={getElementById:id=>els.get(id)||null,createElement:t=>({tagName:t,remove(){}}),head:{appendChild(){}},querySelector:()=>null};
 const mk=id=>{const e={id,remove(){els.delete(id);}};els.set(id,e);return e;};
 const plays=[],stops={n:0};
 const R381={has:t=>!/없음/.test(t),play(t,opt){const h={text:t,opt,stopped:false,stop(){h.stopped=true;}};plays.push(h);return h;},stop(){stops.n++;}};
 const ctx={console,setTimeout:(f)=>{ctx.__t.push(f);return ctx.__t.length;},clearTimeout(){},setInterval(){},__t:[],Math,Number,String,Array,Object,JSON,
  document:doc,settings:{narration:true,voice:.8,...(o.settings||{})},storyScene:null,storyQueue:[],closed:0,
  window:null};
 ctx.window=ctx;ctx.__STORYWORLD_VOICE_R381__=R381;
 ctx.__STORYWORLD_CINEMA_MODE_R370__={prefs:()=>({on:!!o.cinema}),pure:{sentences}};
 ctx.__STORYWORLD_SURVIVAL_R600__={active:()=>!!o.survival};
 ctx.stopVoice=function(){};
 ctx.closePanel=function(){ctx.closed++;ctx.storyScene=null;};
 // 엔진 advanceScene 과 같은 꼴: stopVoice → 다음 장면 → 창 그리기(옛 음성 단추 포함)
 ctx.advanceScene=function(){ctx.stopVoice();ctx.storyScene=ctx.storyQueue.shift()||null;if(!ctx.storyScene){ctx.closePanel(true);return;}
  for(const id of ['storyNext','storyAudio','storyAudioStop','voiceStatus','storyTTS','panel'])mk(id);};
 ctx.playScenes=function(sc){ctx.storyQueue=sc.slice();ctx.storyScene=null;ctx.advanceScene();};
 vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'narration-voice-r1044.js'});
 return {ctx,plays,stops,els,api:ctx.__STORYWORLD_NARRATION_VOICE_R1044__};}
const S=(text,key='STORY:a.pre')=>({key,id:'a',part:'pre',text});
const T3='첫 문장이다. 둘째 문장이다.\n\n셋째 문장이다.';
// ① 정상: 차례로 틀기
{const {ctx,plays,api}=make();check('API 가 있음',!!api&&typeof api.inspect==='function');
 ctx.playScenes([S(T3)]);
 check('① 서사 창이 뜨면 첫 문장 녹음을 튼다',plays.length===1&&plays[0].text==='첫 문장이다.',JSON.stringify(plays.map(p=>p.text)));
 check('① 음량 = 설정 음성 음량(0.8)',plays[0]?.opt?.volume===.8,String(plays[0]?.opt?.volume));
 plays[0]?.opt?.onend?.();check('① 끝나면 다음 문장',plays.length===2&&plays[1].text==='둘째 문장이다.');
 ctx.settings.voice=.3;plays[1]?.opt?.onend?.();check('① 음량을 바꾸면 다음 문장부터 반영',plays.length===3&&plays[2].opt.volume===.3,String(plays[2]?.opt?.volume));
 plays[2]?.opt?.onend?.();check('① 마지막 문장 뒤에는 더 안 튼다',plays.length===3);
 check('① 기록(played 3)',api.inspect().stats.played===3,JSON.stringify(api.inspect().stats));}
// ② 녹음 없는 문장
{const {ctx,plays}=make();ctx.playScenes([S('녹음 없음 하나. 있는 문장. 녹음 없음 둘.')]);
 check('② 녹음 없는 첫 문장은 건너뛰고 있는 문장부터',plays.length===1&&plays[0].text==='있는 문장.',JSON.stringify(plays.map(p=>p.text)));
 plays[0]?.opt?.onend?.();check('② 뒤의 녹음 없는 문장도 건너뜀(브라우저 음성 없음)',plays.length===1);}
{const {ctx,plays}=make();ctx.playScenes([S('녹음 없음. 녹음 없음 또.')]);check('② 경계: 녹음이 하나도 없으면 아무것도 안 틀음',plays.length===0);}
{const {ctx,plays}=make();ctx.playScenes([S('   ')]);check('② 경계: 빈 글은 안 틀음·오류 없음',plays.length===0);}
// 오류 → 다음 문장
{const {ctx,plays}=make();ctx.playScenes([S(T3)]);plays[0]?.opt?.onerror?.();check('② 녹음 오류면 다음 문장으로',plays.length===2&&plays[1].text==='둘째 문장이다.');}
// ③ 설정
{const {ctx,plays}=make({settings:{narration:false}});ctx.playScenes([S(T3)]);check('③ 서사 음성 자동 재생 끔 → 안 틀음',plays.length===0);}
{const {ctx,plays}=make({settings:{voice:0}});ctx.playScenes([S(T3)]);check('③ 경계: 음성 음량 0 → 안 틀음',plays.length===0);}
{const {ctx,plays}=make({settings:{voice:1.7}});ctx.playScenes([S(T3)]);check('③ 경계: 음량 1 넘는 값은 1로',plays[0]?.opt?.volume===1,String(plays[0]?.opt?.volume));}
{const {ctx,plays}=make({settings:{voice:'x'}});ctx.playScenes([S(T3)]);check('③ 경계: 음량이 숫자가 아니면 기본 0.8',plays[0]?.opt?.volume===.8,String(plays[0]?.opt?.volume));}
{const {ctx,plays}=make();ctx.playScenes([S(T3)]);ctx.settings.narration=false;plays[0]?.opt?.onend?.();check('③ 도중에 자동 재생을 끄면 다음 문장 안 틀음',plays.length===1);}
// ④ 다음 장면·닫기·늦은 끝 알림
{const {ctx,plays,stops}=make();ctx.playScenes([S(T3),S('다른 장면 문장.','STORY:a.post')]);const first=plays[0];const n0=stops.n;
 ctx.advanceScene();check('④ 다음 장면으로 넘기면 앞 녹음을 멈춤',stops.n>n0||first.stopped);
 check('④ 다음 장면 첫 문장을 틈',plays[plays.length-1].text==='다른 장면 문장.',JSON.stringify(plays.map(p=>p.text)));
 const len=plays.length;first.opt.onend();check('④ 회귀: 옛 장면 늦은 끝 알림은 옛 다음 문장을 틀지 않음',plays.length===len,JSON.stringify(plays.map(p=>p.text)));
 const n1=stops.n;ctx.advanceScene();check('④ 마지막 장면 뒤 창이 닫히면 멈춤',ctx.storyScene===null&&stops.n>n1);
 const len2=plays.length;plays[plays.length-1].opt.onend();check('④ 닫힌 뒤 끝 알림은 아무것도 안 틀음',plays.length===len2);}
{const {ctx,plays,stops}=make();ctx.playScenes([S(T3)]);const n0=stops.n;ctx.closePanel(true);check('④ 창을 직접 닫아도 멈춤',stops.n>n0);}
// ⑤ 다른 모드
{const {ctx,plays}=make({cinema:true});ctx.playScenes([S(T3)]);check('⑤ 영화 모드 중에는 손대지 않음(영화 모드가 틀음)',plays.length===0);}
{const {ctx,plays}=make({survival:true});ctx.playScenes([S(T3)]);check('⑤ 무한생존 중에는 손대지 않음',plays.length===0);}
{const {ctx,plays}=make();ctx.playScenes([S('기억 책 문장.','journal:a:body')]);check('⑤ 기억 책에서 직접 연 글(journal)도 틀음',plays.length===1);}
// ⑥ 안 쓰는 UI
{const {ctx,els}=make();ctx.playScenes([S(T3)]);
 const gone=['storyAudio','storyAudioStop','voiceStatus','storyTTS'].filter(id=>els.has(id));
 check('⑥ 서사 창의 음성 재생·정지·상태 글·선택 음성 합성이 DOM 에서 지워짐',gone.length===0,JSON.stringify(gone));
 check('⑥ 계속 단추는 그대로',els.has('storyNext'));}
// 연결
{const html=fs.readFileSync(path.join(root,'runtime-text','index.html'),'utf8');const tag='<script src="./narration-voice-r1044.js"></script>';
 check('index.html 태그 한 번',html.split(tag).length===2);
 check('태그는 narration-r1037 바로 뒤',html.includes('<script src="./narration-r1037.js"></script>\n'+tag));
 const man=fs.readFileSync(path.join(root,'runtime-manifest.json'),'utf8'),inp=fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8');
 check('runtime-manifest·runtime-inputs 에 들어감(sync)',man.includes('narration-voice-r1044.js')&&inp.includes('narration-voice-r1044.js'));
 const ver=fs.readFileSync(path.join(root,'..','scripts','verify-r96-public.py'),'utf8');check('공개 확인 목록에 들어감',ver.includes("'narration-voice-r1044.js'"));
 const yml=fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8');check('CI 줄',yml.includes('node r96/qa/r1044/r1044-cpu-check.cjs'));}
done();
