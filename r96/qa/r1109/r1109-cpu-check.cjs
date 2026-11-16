// R1109 동행(온라인 협동) 중계 서버 호환 CPU 검사
// 사용자 2026-11-16 "저거 동행은 옛날 버전인데?" — 실제 Render 중계 서버는 옛 R62 코드(build R62)로 떠 있고
// 최신 게임은 R63R1 로 들어가서 VERSION_MISMATCH 로 막혔다. 이 검사는 ① 빌드 연결 ② 기본 중계 주소 ③ 옛 서버 자동 맞춤
// ④ 새 서버는 그대로 ⑤ 둘 다 안 맞으면 한 번만 다시 시도하고 오류를 그대로 보임 ⑥ 중계 주소가 아닌 소켓은 손대지 않음을 본다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..'),N='coop-relay-r1109.js',rd=f=>fs.readFileSync(f,'utf8');
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(c)console.log('ok  ',m);else{bad++;console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,400));}};
const file=path.join(R,'client-source',N);
if(!fs.existsSync(file)){ok(false,'오버레이 파일 '+N+' 있음');console.log(`\n${n-bad}/${n} 통과`);process.exit(1);}
const SRC=rd(file);
// ① 빌드 연결
{const html=rd(path.join(R,'runtime-text','index.html'));ok(html.includes('<script src="./'+N+'"></script>'),'runtime-text/index.html 스크립트 태그');
 ok(fs.existsSync(path.join(R,'runtime-text',N))&&rd(path.join(R,'runtime-text',N))===SRC,'runtime-text 사본 = client-source');
 ok(rd(path.join(ROOT,'scripts','verify-r96-public.py')).includes("'"+N+"'"),'공개 확인 목록');
 ok(/node r96\/qa\/r1109\/r1109-cpu-check\.cjs/.test(rd(path.join(ROOT,'.github','workflows','pages.yml'))),'CI 검사 줄');
 const inp=rd(path.join(R,'runtime-inputs.json')),man=rd(path.join(R,'runtime-manifest.json'));ok(inp.includes(N)&&man.includes(N),'runtime-inputs·manifest 에 들어감');
 ok(!/drop-shadow|blur\(/.test(SRC),'필터 금지어 없음');}
// 가짜 중계 서버가 붙은 WebSocket
const LIVE='wss://storyworld-r62-relay.onrender.com/ws';
function sand(opt={}){
 const store=Object.assign({},opt.store||{}),sockets=[],timers=[];
 class FakeWS{constructor(url,protocols){this.url=String(url);this.protocols=protocols;this.readyState=0;this.sent=[];this.bufferedAmount=0;this.closed=null;sockets.push(this);timers.push(()=>{if(this.readyState!==0)return;this.readyState=1;this.onopen?.({type:'open'});});}
  send(t){if(this.readyState!==1)throw Error('INVALID_STATE');this.sent.push(t);const m=JSON.parse(t);const srv=opt.server||'R62';
   if(['create','join','reconnect'].includes(m.type)){if(m.build!==srv||m.gameId!=='storyworld'||m.protocol!==1){this._reply({type:'error',code:'VERSION_MISMATCH',message:'Game, build, or protocol does not match.'});this._drop(1008,'VERSION_MISMATCH');}else this._reply({type:'welcome',code:'ABC234',selfId:'p1',hostId:'p1',resumeToken:null,epoch:0,phase:'lobby',players:[]});}
   else if(m.type==='input'&&srv==='R62'){const flags=['attack','guard','blink','special','ego','interact'];if(!Object.keys(m.input||{}).every(k=>['moveX','moveY','target','route','skillSlot',...flags].includes(k)))this._reply({type:'error',code:'INPUT_INVALID',message:'Invalid player input.'});}}
  _reply(m){timers.push(()=>{if(this.readyState===1)this.onmessage?.({type:'message',data:JSON.stringify(m)});});}
  _drop(code,reason){timers.push(()=>{if(this.readyState>=2)return;this.readyState=3;this.closed={code,reason};this.onclose?.({type:'close',code,reason,wasClean:true});});}
  close(code=1000,reason=''){if(this.readyState>=2)return;this.readyState=2;timers.push(()=>{this.readyState=3;this.closed={code,reason};this.onclose?.({type:'close',code,reason,wasClean:true});});}}
 FakeWS.CONNECTING=0;FakeWS.OPEN=1;FakeWS.CLOSING=2;FakeWS.CLOSED=3;
 const sb={console,JSON,Object,Array,Number,String,Math,Set,Map,WeakMap,Date,Error,TypeError,Promise,Symbol,URL,Reflect,isFinite,
  EventTarget:class{constructor(){this._l={};}addEventListener(t,f){(this._l[t]=this._l[t]||[]).push(f);}removeEventListener(t,f){this._l[t]=(this._l[t]||[]).filter(x=>x!==f);}dispatchEvent(e){for(const f of (this._l[e.type]||[]).slice())f.call(this,e);return true;}},
  setTimeout:(f)=>{timers.push(f);return timers.length;},clearTimeout(){},queueMicrotask:f=>timers.push(f),
  document:{readyState:'complete',getElementById:()=>null,addEventListener(){},body:null},addEventListener(){},
  __STORYWORLD_TEST_STORAGE_B1__:{store:{getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}}},
  WebSocket:FakeWS};
 sb.window=sb;vm.createContext(sb);vm.runInContext(SRC,sb,{filename:N});
 const flush=()=>{for(let i=0;i<500&&timers.length;i++)timers.shift()();};
 // 최신 게임 쪽 동행 클라이언트처럼 쓰기
 function client(url=LIVE,entry={type:'create',gameId:'storyworld',build:'R63R1',protocol:1,nick:'방장',character:'hwando'}){
  const log=[];const ws=new sb.WebSocket(url);ws.onopen=()=>{log.push('open');ws.send(JSON.stringify(entry));};ws.onmessage=e=>{const m=JSON.parse(e.data);log.push('msg:'+m.type+(m.type==='error'?':'+m.code:''));};ws.onclose=e=>log.push('close:'+e.code);ws.onerror=()=>log.push('error');return{ws,log};}
 return{sb,store,sockets,flush,client,api:sb.__STORYWORLD_COOP_RELAY_R1109__,Native:FakeWS};}
// ② 기본 중계 주소
{const S=sand();ok(!!S.api,'모듈 __STORYWORLD_COOP_RELAY_R1109__');ok(S.api?.DEFAULT_RELAY===LIVE,'기본 주소 = 실제 Render 중계 주소',S.api?.DEFAULT_RELAY);
 ok(S.store['storyworld.coop.r62.relay']===LIVE,'빈 저장소면 기본 주소를 채움',S.store);}
{const S=sand({store:{'storyworld.coop.r62.relay':'wss://my-relay.example.com/ws'}});ok(S.store['storyworld.coop.r62.relay']==='wss://my-relay.example.com/ws','사용자가 넣은 주소는 덮어쓰지 않음');}
{const S=sand({store:{'storyworld.coop.r62.relay':'   '}});ok(S.store['storyworld.coop.r62.relay']===LIVE,'공백뿐인 주소는 빈 것으로 보고 채움(경계값)');}
// ③ 옛 서버(R62): 자동으로 R62 로 다시 접속
{const S=sand({server:'R62'});const c=S.client();S.flush();
 ok(c.log.join(',')==='open,msg:welcome','옛 서버: 게임은 열림 1번·welcome 만 봄(오류·닫힘 숨김)',c.log);
 ok(S.sockets.length===2,'옛 서버: 실제 소켓 2개(한 번만 다시 시도)',S.sockets.length);
 ok(JSON.parse(S.sockets[1]?.sent[0]||'{}').build==='R62','두 번째 입장 메시지는 build R62',S.sockets[1]?.sent);
 ok(c.ws.readyState===1,'겉 소켓은 열린 상태 유지',c.ws.readyState);
 // 입력: 옛 서버가 모르는 칸 정리
 c.ws.send(JSON.stringify({type:'input',epoch:1,seq:1,input:{moveX:.5,moveY:0,attack:false,autoBasic:true,autoSkill:false,threadDance:true,guard:false,blink:false,special:false}}));S.flush();
 const sentIn=JSON.parse(S.sockets[1].sent.at(-1));ok(!('autoBasic' in sentIn.input)&&!('autoSkill' in sentIn.input)&&!('threadDance' in sentIn.input),'옛 서버: autoBasic·autoSkill·threadDance 칸 뺌',sentIn);
 ok(sentIn.input.attack===true,'옛 서버: 자동 기본공격(autoBasic) 은 attack 으로 이어 줌',sentIn.input);
 ok(sentIn.input.moveX===.5&&sentIn.seq===1&&sentIn.epoch===1,'옛 서버: 이동·seq·epoch 그대로',sentIn);
 ok(!c.log.some(x=>/INPUT_INVALID/.test(x)),'옛 서버: INPUT_INVALID 없음',c.log);
 c.ws.send(JSON.stringify({type:'input',epoch:1,seq:2,input:{moveX:0,moveY:0,attack:false,autoBasic:false}}));S.flush();ok(JSON.parse(S.sockets[1].sent.at(-1)).input.attack===false,'autoBasic false 면 attack 그대로 false(경계값)');
 const snap=JSON.stringify({type:'snapshot',epoch:1,seq:3,state:{version:1,autoBasic:true}});c.ws.send(snap);ok(S.sockets[1].sent.at(-1)===snap,'입력이 아닌 메시지는 글자 그대로');
 // 같은 주소 두 번째 접속은 처음부터 R62
 const c2=S.client();S.flush();ok(S.sockets.length===3&&JSON.parse(S.sockets[2].sent[0]).build==='R62'&&c2.log.join(',')==='open,msg:welcome','옛 서버 기억: 두 번째 방은 소켓 1개로 바로 R62',{n:S.sockets.length,log:c2.log});
 // 재접속 메시지도 같은 규칙
 const c3=S.client(LIVE,{type:'reconnect',gameId:'storyworld',build:'R63R1',protocol:1,code:'ABC234',playerId:'p2',token:'x'.repeat(30)});S.flush();ok(JSON.parse(S.sockets.at(-1).sent[0]).build==='R62','재접속도 R62',S.sockets.at(-1).sent);
 ok(S.api.inspect().legacy.includes(LIVE),'inspect: 옛 서버 목록',S.api.inspect());}
// ④ 새 서버(R63R1, 재배포 뒤): 손대지 않음
{const S=sand({server:'R63R1'});const c=S.client();S.flush();ok(c.log.join(',')==='open,msg:welcome'&&S.sockets.length===1,'새 서버: 소켓 1개·welcome',{log:c.log,n:S.sockets.length});
 const raw=JSON.stringify({type:'input',epoch:1,seq:1,input:{moveX:0,moveY:0,autoBasic:true,autoSkill:true}});c.ws.send(raw);ok(S.sockets[0].sent.at(-1)===raw,'새 서버: 입력 글자 그대로(autoBasic 유지)');
 ok(JSON.parse(S.sockets[0].sent[0]).build==='R63R1','새 서버: build R63R1 그대로');}
// ⑤ 둘 다 안 맞음: 한 번만 다시 시도, 오류·닫힘을 게임에 그대로 보임(무한 반복 없음)
{const S=sand({server:'R99'});const c=S.client();S.flush();ok(S.sockets.length===2,'둘 다 불일치: 소켓 2개에서 멈춤',S.sockets.length);
 ok(c.log.includes('msg:error:VERSION_MISMATCH')&&c.log.includes('close:1008'),'둘 다 불일치: 오류와 닫힘이 게임에 보임',c.log);ok(c.ws.readyState===3,'겉 소켓 닫힘');}
// 서버를 재배포해 옛 서버로 기억한 주소가 새 판이 된 경우: R62 로 갔다가 거꾸로 R63R1 로 한 번 다시
{const S=sand({server:'R63R1'});S.api.remember?.(LIVE,'R62');const c=S.client();S.flush();
 ok(c.log.join(',')==='open,msg:welcome','기억이 낡았으면(서버 재배포) 거꾸로 R63R1 로 한 번 다시',{log:c.log,sent:S.sockets.map(s=>s.sent[0])});}
// 게임이 welcome 전에 스스로 닫으면 다시 시도하지 않음
{const S=sand({server:'R62'});const c=S.client();c.ws.close(1000,'cancel');S.flush();ok(S.sockets.length===1&&c.log.at(-1)==='close:1000','취소하면 다시 시도 안 함',{n:S.sockets.length,log:c.log});}
// ⑥ 중계 주소가 아닌 소켓은 원래 WebSocket
{const S=sand();const w=new S.sb.WebSocket('wss://example.com/live');ok(w instanceof S.Native,'경로가 /ws 가 아닌 소켓은 원래 객체');
 ok(S.sb.WebSocket.OPEN===1&&S.sb.WebSocket.CLOSED===3,'WebSocket 상수 유지');}
// 끄기 스위치
{const S=sand({store:{'storyworld.r1109.coopRelay':'{"off":true}'}});ok(S.sb.WebSocket===S.Native,'끄기(storyworld.r1109.coopRelay off)면 WebSocket 그대로');}
console.log(`\n${n-bad}/${n} 통과`);process.exit(bad?1:0);
