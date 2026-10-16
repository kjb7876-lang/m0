/* R62: private-room transport and Korean lobby. Tokens live only in this closure. */
(function(){
 'use strict';
 const revision='R62',gameId='storyworld',protocol=1,configKey='storyworld.coop.r62.relay',nicknameKey='storyworld.coop.r62.nickname';
 const reconnectWindow=45000,connectTimeout=70000,maxMessageBytes=524288;
 const listeners=new Map(),metrics={sent:0,received:0,stale:0,reconnects:0,invalid:0};
 const state={status:'solo',role:null,selfId:null,hostId:null,code:null,players:[],epoch:0,phase:'lobby',regionId:null,paused:false,simReady:false,message:'혼자 플레이 중',error:null};
 let socket=null,sessionToken=null,endpoint='',nickname='',character='hwando',intent=null,generation=0,closing=false,reconnectDeadline=0,reconnectTimer=null,connectTimer=null,attempt=0,simStarted=false,receiveChain=Promise.resolve(),uiView=null,lastLobbyFocus=null,hostMenuPaused=false,lastStoryKey='';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const byId=id=>document.getElementById(id),sim=()=>window.__STORYWORLD_COOP_SIM_R62__,active=()=>state.status!=='solo'&&state.status!=='closed';
 const heroes=()=>typeof HEROES==='object'?HEROES:{hwando:{name:'환도'}};
 const stored=k=>{try{return localStorage.getItem(k)||'';}catch(_){return'';}};
 const store=(k,v)=>{try{localStorage.setItem(k,v);}catch(_){}};
 function emit(type,payload){for(const fn of [...(listeners.get(type)||[])]){try{fn(payload);}catch(_){metrics.invalid++;}}}
 function on(type,fn){if(typeof fn!=='function')return()=>{};if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);return()=>listeners.get(type)?.delete(fn);}
 function inspect(){return{revision,gameId,protocol,...state,players:state.players.map(p=>({...p})),endpoint,connected:socket?.readyState===1,metrics:{...metrics},reconnectRemaining:Math.max(0,reconnectDeadline-Date.now()),tokenStored:false};}
 function notice(message,error=false){state.message=message;state.error=error?message:null;updateBadge();const n=byId('coopNotice62');if(n){n.textContent=message;n.classList.toggle('error',!!error);}emit('status',inspect());}
 function validateEndpoint(value){
  const raw=String(value||'').trim();if(!raw)throw Error('중계 서버 주소가 필요합니다. 배포한 Render 서버의 wss:// 주소를 입력하세요.');
  let url;try{url=new URL(raw);}catch(_){throw Error('올바른 중계 서버 주소를 입력하세요.');}
  const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if(url.protocol!=='wss:'&&!(url.protocol==='ws:'&&local))throw Error('공개 연결은 wss:// 주소만 사용할 수 있습니다.');
  if(url.username||url.password||url.search||url.hash)throw Error('중계 주소에 로그인 정보, 쿼리 또는 토큰을 넣을 수 없습니다.');
  if(location.protocol==='https:'&&url.protocol==='ws:')throw Error('HTTPS 게임에서는 WSS 중계 주소를 사용하세요.');
  if(url.pathname==='/'||!url.pathname)url.pathname='/ws';
  if(url.pathname.length>180||url.href.length>300)throw Error('중계 서버 주소가 너무 깁니다.');
  return url.href;
 }
 function send(type,payload={}){
  if(!socket||socket.readyState!==1||!active())return false;
  if(typeof type!=='string'||!payload||typeof payload!=='object'||Array.isArray(payload))return false;
  const message={...payload,type};
  try{const text=JSON.stringify(message);if(new TextEncoder().encode(text).length>maxMessageBytes)return false;if(socket.bufferedAmount>524288&&['snapshot','input'].includes(type)){emit('backpressure',{type});return false;}socket.send(text);metrics.sent++;return true;}catch(_){return false;}
 }
 function setRoster(players){
  if(!Array.isArray(players)||players.length>4)return;
  state.players=players.filter(p=>p&&typeof p.id==='string').map(p=>({id:p.id,nick:String(p.nick||'동행자').slice(0,24),character:Object.hasOwn(heroes(),p.character)?p.character:'hwando',ready:p.ready===true,connected:p.connected!==false,loaded:p.loaded===true}));
  updateBadge();emit('roster',state.players.map(p=>({...p})));
 }
 async function forward(message){if(simStarted&&typeof sim()?.receive==='function')await sim().receive(message);emit(message.type,message);}
 async function acceptWelcome(m){
  if(typeof m.selfId!=='string'||typeof m.hostId!=='string'||typeof m.code!=='string'||!Array.isArray(m.players))throw Error('중계 서버의 입장 응답이 올바르지 않습니다.');
  state.selfId=m.selfId;state.hostId=m.hostId;state.role=m.selfId===m.hostId?'host':'guest';state.code=m.code;state.epoch=Number.isSafeInteger(m.epoch)?m.epoch:0;state.phase=m.phase||'lobby';state.regionId=m.regionId||null;state.status='connected';state.error=null;setRoster(m.players);
  if(state.role==='guest'){if(typeof m.resumeToken!=='string'||m.resumeToken.length<24)throw Error('재접속 토큰을 받지 못했습니다.');sessionToken=m.resumeToken;}
  clearTimeout(connectTimer);clearTimeout(reconnectTimer);reconnectDeadline=0;attempt=0;
  if(!simStarted){if(!sim()?.start)throw Error('협동 시뮬레이션을 불러오지 못했습니다. 새로고침 후 다시 시도하세요.');simStarted=true;await sim().start({role:state.role,selfId:state.selfId,hostId:state.hostId,room:state.code,members:state.players,hero:character});}
  else await sim()?.receive?.(m);
  state.simReady=true;notice(state.role==='host'?'방을 만들었습니다. 친구에게 방 코드와 같은 게임 주소를 알려주세요.':'입장했습니다. 준비를 누르면 방장이 함께 시작할 수 있습니다.');
  showLobby();emit('welcome',inspect());
 }
 function roomClosedMessage(reason){return({host_left:'방장이 나가거나 연결을 잃어 방이 종료되었습니다.',host_disconnected:'방장의 연결이 끊어져 방이 종료되었습니다.',host_timeout:'방장의 응답이 없어 방이 종료되었습니다.',shutdown:'중계 서버가 재시작되어 방이 종료되었습니다.',server_shutdown:'중계 서버가 재시작되어 방이 종료되었습니다.',timeout:'재접속 가능 시간이 지나 방에서 나왔습니다.'})[reason]||'협동 방이 종료되었습니다. 혼자 하기 저장은 보존됩니다.';}
 async function handle(m){
  if(!m||typeof m.type!=='string'||m.type.length>40){metrics.invalid++;return;}
  metrics.received++;
  if(m.type==='welcome'){await acceptWelcome(m);return;}
  if(m.type==='error'){
   const translated={ROOM_FULL:'이 방은 이미 4명입니다. 빈자리가 생기면 다시 참가해 주세요.',ROOM_NOT_FOUND:'존재하지 않거나 종료된 방 코드입니다.',VERSION_MISMATCH:'게임 또는 R62 빌드가 다릅니다. 친구와 같은 주소에서 게임을 열어 주세요.',PROFILE_INVALID:'닉네임과 영웅 선택을 확인해 주세요.',BAD_TOKEN:'재접속 시간이 지나거나 세션이 바뀌었습니다. 방 코드로 다시 참가해 주세요.',NOT_READY:'모든 동행자가 준비를 마쳐야 시작할 수 있습니다.',JOIN_RATE:'입장 시도가 많습니다. 잠시 후 다시 시도해 주세요.',HOST_ONLY:'방장만 진행할 수 있습니다.',SESSION_PAUSED:'로딩 또는 방장 일시 정지가 끝날 때까지 기다려 주세요.'};const message=translated[m.code]||String(m.message||'요청을 처리할 수 없습니다.').slice(0,300);notice(message,true);
   if(!state.selfId||['ROOM_NOT_FOUND','ROOM_CLOSED','BAD_TOKEN','RECONNECT_EXPIRED','VERSION_MISMATCH','BUILD_MISMATCH','GAME_MISMATCH','ROOM_FULL'].includes(m.code)){await shutdown(message,true);}
   emit('error',{code:m.code,message});return;
  }
  if(m.type==='room_closed'){await shutdown(roomClosedMessage(m.reason),true);return;}
  if(m.type==='pong'||m.type==='hello')return;
  if(m.type==='lobby'){setRoster(m.players);if(m.phase)state.phase=m.phase;if(Number.isSafeInteger(m.epoch))state.epoch=m.epoch;if(m.regionId)state.regionId=m.regionId;await forward(m);if(uiView==='lobby')refreshLobby();return;}
  if(m.type==='transition'){
   if(!Number.isSafeInteger(m.epoch)||m.epoch<state.epoch||typeof m.regionId!=='string'){metrics.stale++;return;}
   state.epoch=m.epoch;state.regionId=m.regionId;state.phase='loading';state.paused=true;notice('모든 동행자의 지역 로딩을 기다리고 있습니다.');
   if(uiView==='lobby')refreshLobby();await forward(m);return;
  }
  if(m.type==='all_loaded'){
   if(m.epoch!==state.epoch){metrics.stale++;return;}state.phase=m.phase==='paused'?'paused':'playing';state.paused=m.phase==='paused';notice(state.paused?'방장 화면이 비활성화되어 전투가 잠시 멈췄습니다.':'함께 탐험 중 · 맵과 서사는 방장이 진행합니다.');await forward(m);
   if(uiView==='lobby'||uiView==='loading'){uiView=null;resumePresentation();}return;
  }
  if(m.type==='paused'){state.paused=m.paused===true;if(m.phase)state.phase=m.phase;notice(state.paused?(m.reason==='manual'?'방장이 메뉴를 확인하는 동안 전투가 잠시 멈췄습니다.':'방장 화면이 비활성화되어 전투가 잠시 멈췄습니다.'):'전투를 재개했습니다.');await forward(m);return;}
  if(['snapshot','event','input'].includes(m.type)&&m.epoch!==state.epoch){metrics.stale++;return;}
  await forward(m);if(m.type==='snapshot'&&state.role==='guest')presentSharedStory(m.state?.story);
 }
 function presentSharedStory(story){if(state.role!=='guest')return;if(!story){lastStoryKey='';if(uiView==='story'){uiView=null;closePanel(true);}return;}if(uiView&&uiView!=='story')return;const title=String(story.title||'기억의 이야기').slice(0,200),body=String(story.text||'').slice(0,20000),key=title+'\n'+body;if(!body||key===lastStoryKey)return;lastStoryKey=key;uiView='story';openPanel('<div class="eyebrow">CO-OP / 방장이 이야기를 진행합니다</div><h2>'+esc(title)+'</h2><div class="storyText">'+esc(body)+'</div><p class="small muted">방장이 계속을 누르면 함께 다음 장면으로 이동합니다.</p>');}
 function queueMessage(data){
  if(typeof data!=='string'||data.length>maxMessageBytes||new TextEncoder().encode(data).length>maxMessageBytes){metrics.invalid++;return;}
  let m;try{m=JSON.parse(data);}catch(_){metrics.invalid++;return;}
  receiveChain=receiveChain.then(()=>handle(m)).catch(async()=>{await shutdown('협동 상태를 적용하지 못했습니다. 방을 나와 다시 접속해 주세요.',true);});
 }
 function retry(){
  if(closing||state.role!=='guest'||!sessionToken)return;
  if(Date.now()>=reconnectDeadline){void shutdown('45초 안에 재접속하지 못했습니다. 방 코드로 다시 참가해 주세요.',true);return;}
  attempt++;metrics.reconnects++;notice('연결이 끊겼습니다. 재접속 중… ('+Math.max(1,Math.ceil((reconnectDeadline-Date.now())/1000))+'초 남음)');
  connectSocket(true);
 }
 function connectSocket(reconnecting=false){
  const token=++generation;clearTimeout(connectTimer);let ws;
  try{ws=new WebSocket(endpoint);}catch(_){void shutdown('중계 서버에 연결할 수 없습니다. WSS 주소를 확인하세요.',true);return;}
  socket=ws;
  connectTimer=setTimeout(()=>{if(token===generation&&ws.readyState!==1){try{ws.close();}catch(_){}if(!reconnecting)void shutdown('중계 서버가 응답하지 않습니다. Render 무료 서버가 깨는 데 약 1분이 걸릴 수 있습니다. 잠시 후 다시 연결하세요.',true);}},reconnecting?12000:connectTimeout);
  ws.onopen=()=>{if(token!==generation)return;clearTimeout(connectTimer);connectTimer=setTimeout(()=>{if(token===generation&&state.status!=='connected')void shutdown('중계 서버가 입장을 확인하지 않았습니다. 올바른 스토리월드 중계 주소인지 확인하세요.',true);},12000);const base={gameId,build:revision,protocol};if(reconnecting)send('reconnect',{...base,code:state.code,playerId:state.selfId,token:sessionToken});else send(intent.type,{...base,nick:nickname,character,...(intent.type==='join'?{code:intent.code}:{})});};
  ws.onmessage=e=>{if(token===generation)queueMessage(e.data);};
  ws.onerror=()=>{if(token===generation)notice('중계 연결을 확인하고 있습니다. 무료 서버가 깨어나는 동안 잠시 기다려 주세요.');};
  ws.onclose=()=>{
   clearTimeout(connectTimer);if(token!==generation||closing)return;socket=null;
   if(state.role==='guest'&&sessionToken){state.status='reconnecting';state.paused=true;Promise.resolve(sim()?.receive?.({type:'disconnected',reason:'network'})).catch(()=>{});if(!reconnectDeadline)reconnectDeadline=Date.now()+reconnectWindow;clearTimeout(reconnectTimer);reconnectTimer=setTimeout(retry,Math.min(6000,700*Math.pow(1.5,attempt)));notice('연결이 잠시 끊겼습니다. 최대 45초 동안 재접속합니다.');updateBadge();}
   else void shutdown(state.role==='host'?'방장 연결이 끊어져 방이 종료되었습니다. 협동 저장으로 새 방을 만들 수 있습니다.':'중계 서버에 접속하지 못했습니다. 서버 주소와 무료 서비스 상태를 확인하세요.',true);
  };
 }
 async function connect(kind,options={}){
  if(active())throw Error('현재 방을 나간 뒤 새 방에 접속하세요.');
  endpoint=validateEndpoint(options.endpoint||window.STORYWORLD_RELAY_URL||stored(configKey));nickname=String(options.nick||'동행자').normalize('NFKC').replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0,24)||'동행자';character=Object.hasOwn(heroes(),options.character)?options.character:'hwando';
  const code=String(options.code||'').trim().toUpperCase().replace(/[\s-]/g,'');if(kind!=='create'&&kind!=='join')throw Error('지원하지 않는 입장 방식입니다.');if(kind==='join'&&!/^[A-Z0-9]{4,10}$/.test(code))throw Error('친구가 알려준 방 코드를 입력하세요.');
  if(!sim()?.start)throw Error('협동 기능을 불러오지 못했습니다.');
  store(configKey,endpoint);store(nicknameKey,nickname);intent={type:kind,code};closing=false;sessionToken=null;simStarted=false;hostMenuPaused=false;lastStoryKey='';receiveChain=Promise.resolve();
  Object.assign(state,{status:'connecting',role:null,selfId:null,hostId:null,code:null,players:[],epoch:0,phase:'lobby',regionId:null,paused:true,simReady:false,error:null});
  notice('무료 중계 서버에 연결 중입니다. 첫 접속은 약 1분 걸릴 수 있습니다.');showConnecting();connectSocket(false);return true;
 }
 async function shutdown(message='방에서 나왔습니다. 혼자 하기 저장은 보존됩니다.',show=true){
  if(closing)return;closing=true;generation++;clearTimeout(reconnectTimer);clearTimeout(connectTimer);reconnectDeadline=0;
  const ws=socket;socket=null;sessionToken=null;intent=null;hostMenuPaused=false;lastStoryKey='';try{if(ws?.readyState===1)ws.send(JSON.stringify({type:'leave'}));ws?.close(1000,'leave');}catch(_){}
  if(simStarted){try{await sim()?.stop?.();}catch(_){message+=' 혼자 하기 복원에 실패했습니다. 기존 저장 파일에서 이어하기를 사용하세요.';}}simStarted=false;
  Object.assign(state,{status:'closed',role:null,selfId:null,hostId:null,code:null,players:[],epoch:0,phase:'lobby',paused:false,simReady:false});closing=false;uiView=null;notice(message);emit('closed',{message});
  if(show){openPanel('<div class="eyebrow">CO-OP / 연결 종료</div><h2>협동 방에서 나왔습니다</h2><p>'+esc(message)+'</p><div class="actions"><button id="coopClosedSolo62" class="primary">혼자 하기로 돌아가기</button><button id="coopClosedRetry62">다시 연결</button></div>');bind('coopClosedSolo62',solo);bind('coopClosedRetry62',()=>showConnect('join'));}
 }
 async function solo(){if(active())await shutdown('혼자 하기로 돌아왔습니다.',false);state.status='solo';uiView=null;notice('혼자 플레이 중');if(typeof started!=='undefined'&&started&&player&&player.hp>0&&!storyScene)closePanel(true);else showTitle();}
 function bind(id,fn){const n=byId(id);if(!n)return;n.onclick=()=>{try{if(typeof unlockAudio==='function')unlockAudio();Promise.resolve(fn()).catch(e=>notice(e?.message||'요청을 처리하지 못했습니다.',true));}catch(e){notice(e?.message||'요청을 처리하지 못했습니다.',true);}};}
 function protectForm(){for(const n of document.querySelectorAll('#panel input,#panel select'))for(const type of ['keydown','keyup'])n.addEventListener(type,e=>e.stopPropagation());}
 function fieldLabel(){return'<p class="small muted">최대 4명 · 맵·서사는 방장 기준 · 보상과 패시브는 이 협동 저장에만 기록됩니다.<br>게스트의 혼자 하기 저장은 바뀌지 않습니다. 방장 탭이 멈추거나 서버가 재시작되면 일시 정지 또는 방 종료가 발생할 수 있습니다.</p>';}
 function showConnect(kind='create'){
  if(active()){showLobby();return;}uiView='connect';
  const saved=window.STORYWORLD_RELAY_URL||stored(configKey),nick=stored(nicknameKey)||'동행자';
  openPanel('<button id="coopBack62" class="close">돌아가기</button><div class="eyebrow">STORYWORLD / ONLINE CO-OP</div><h2>'+(kind==='create'?'방 만들기':'방 코드로 참가')+'</h2><div class="coopForm62"><label>닉네임<input id="coopNick62" maxlength="24" value="'+esc(nick)+'" autocomplete="nickname"></label><label>영웅<select id="coopHero62">'+Object.entries(heroes()).map(([id,h])=>'<option value="'+esc(id)+'">'+esc(h.name)+'</option>').join('')+'</select></label>'+(kind==='join'?'<label>방 코드<input id="coopCode62" maxlength="10" autocomplete="off" autocapitalize="characters" placeholder="친구가 알려준 코드"></label>':'')+'<label>중계 서버 WSS 주소<input id="coopRelay62" type="url" value="'+esc(saved)+'" placeholder="wss://서버이름.onrender.com/ws" spellcheck="false" autocomplete="off"></label></div><p class="small">친구와 같은 게임 주소·R62 빌드·중계 서버를 사용하세요. 무료 Render 서버는 첫 접속에 약 1분 걸릴 수 있습니다.</p><p id="coopNotice62" class="coopNotice62" role="status" aria-live="polite"></p><div class="actions"><button id="coopConnect62" class="primary">'+(kind==='create'?'방 만들기':'참가')+'</button><button id="coopOther62">'+(kind==='create'?'방 코드로 참가':'방 만들기')+'</button></div>'+fieldLabel());
  bind('coopBack62',solo);bind('coopOther62',()=>showConnect(kind==='create'?'join':'create'));bind('coopConnect62',()=>connect(kind,{endpoint:byId('coopRelay62').value,nick:byId('coopNick62').value,character:byId('coopHero62').value,code:byId('coopCode62')?.value}));protectForm();
 }
 function showConnecting(){uiView='connecting';openPanel('<div class="eyebrow">CO-OP / 연결 중</div><h2>동행할 세계를 연결합니다</h2><p id="coopNotice62" class="coopNotice62" role="status" aria-live="polite">'+esc(state.message)+'</p><div class="actions"><button id="coopCancel62">취소</button></div>'+fieldLabel());bind('coopCancel62',()=>shutdown('연결을 취소했습니다.',true));}
 function lobbyBody(){
  const host=state.role==='host',self=state.players.find(p=>p.id===state.selfId),allReady=state.players.filter(p=>p.connected).every(p=>p.id===state.hostId||p.ready),playing=['playing','paused'].includes(state.phase);
  return'<button id="coopLobbyClose62" class="close">'+(playing?'게임으로':'메뉴')+'</button><div class="eyebrow">STORYWORLD / 최대 4인</div><h2>함께 걷는 기억</h2><div class="coopRoom62"><span>방 코드</span><strong>'+esc(state.code||'연결 중')+'</strong><button id="coopCopy62">코드 복사</button></div><ul class="coopRoster62">'+state.players.map(p=>'<li><span class="coopDot62 '+(!p.connected?'lost':p.ready?'ready':'')+'"></span><strong>'+esc(p.nick)+(p.id===state.selfId?' (나)':'')+'</strong><span>'+esc(heroes()[p.character]?.name||p.character)+'</span><small>'+(p.id===state.hostId?'방장':!p.connected?'재접속 대기':state.phase==='loading'?p.loaded?'로딩 완료':'로딩 중':p.ready?'준비 완료':'준비 중')+'</small></li>').join('')+'</ul><p id="coopNotice62" class="coopNotice62" role="status" aria-live="polite">'+esc(state.message)+'</p><div class="actions">'+(!host&&state.phase==='lobby'?'<button id="coopReady62" class="primary" '+(!state.simReady?'disabled':'')+'>'+(self?.ready?'준비 취소':'준비 완료')+'</button>':'')+(host&&state.phase==='lobby'?'<button id="coopStart62" class="primary" '+(!state.simReady||!allReady?'disabled':'')+'>함께 시작</button>':'')+(playing?'<button id="coopContinue62" class="primary">게임으로 돌아가기</button>':'')+(host?'<button id="coopSave62">협동 저장</button><button id="coopExport62">협동 저장 내보내기</button>'+(state.phase==='lobby'?'<button id="coopImport62">협동 저장 불러오기</button><input id="coopFile62" class="hidden" type="file" accept="application/json,.json">':''):'')+'<button id="coopLeave62">'+(host?'방 종료':'방 나가기')+'</button></div>'+fieldLabel();
 }
 function resumePresentation(){if(state.role==='host'&&typeof storyScene!=='undefined'&&storyScene&&typeof playScenes==='function'){const first=storyScene,rest=[...storyQueue],done=storyDone;if(hostMenuPaused){hostMenuPaused=false;send('pause',{paused:document.hidden,reason:document.hidden?'background':'manual'});}playScenes([first,...rest],done);}else closePanel(true);}
 function lobbyEvents(){
  const self=state.players.find(p=>p.id===state.selfId);bind('coopReady62',()=>send('profile',{ready:!self?.ready}));
  bind('coopStart62',()=>{if(!state.simReady)return;const regionId=sim()?.inspect?.().zone||((typeof zone!=='undefined')?zone:'hub');send('start',{regionId,layer:sim()?.inspect?.().layer||((typeof layer!=='undefined')?layer:'STORY')});notice('동행자들의 지역 로딩을 준비합니다.');});
  bind('coopCopy62',async()=>{if(!navigator.clipboard?.writeText){notice('방 코드: '+state.code);return;}await navigator.clipboard.writeText(state.code);notice('방 코드를 복사했습니다. 친구에게 게임 주소도 함께 알려주세요.');});
  bind('coopLeave62',()=>shutdown());bind('coopSave62',saveSession);bind('coopExport62',exportSession);bind('coopImport62',()=>byId('coopFile62').click());
  if(byId('coopFile62'))byId('coopFile62').onchange=async e=>{try{const f=e.target.files?.[0];if(!f)return;if(f.size>5242880)throw Error('협동 저장 파일은 5MB 이하여야 합니다.');const raw=JSON.parse(await f.text());await sim()?.importSave?.(raw);notice('협동 저장을 불러왔습니다. 준비가 끝나면 함께 시작하세요.');}catch(err){notice(err?.message||'협동 저장을 읽지 못했습니다.',true);}finally{e.target.value='';}};
  const resume=()=>{uiView=null;resumePresentation();};bind('coopContinue62',resume);bind('coopLobbyClose62',()=>['playing','paused'].includes(state.phase)?resume():showCoopMenu());
 }
 function pauseForMenu(){if(state.role==='host'&&['playing','paused'].includes(state.phase)){hostMenuPaused=true;send('pause',{paused:true,reason:'manual'});}}
 function showLobby(){if(!active()){showConnect('create');return;}pauseForMenu();uiView='lobby';openPanel(lobbyBody());lobbyEvents();}
 function refreshLobby(){if(uiView!=='lobby')return;lastLobbyFocus=document.activeElement?.id;byId('panel').innerHTML=lobbyBody();lobbyEvents();if(lastLobbyFocus)byId(lastLobbyFocus)?.focus?.();}
 async function saveSession(){if(state.role!=='host')throw Error('협동 진행은 방장이 저장합니다.');const result=sim()?.save?.()??(typeof saveGame==='function'?saveGame(false):false);if(result===false)throw Error('장면 전환이 끝난 뒤 저장해 주세요.');notice('협동 진행을 저장했습니다. 혼자 하기 저장은 보존됩니다.');}
 async function exportSession(){if(state.role!=='host')throw Error('협동 진행은 방장이 내보낼 수 있습니다.');if(sim()?.downloadSave){sim().downloadSave();notice('협동 저장 파일을 내보냈습니다.');return;}const raw=sim()?.exportSave?.();if(!raw)throw Error('협동 진행을 내보내지 못했습니다.');download(JSON.stringify(raw,null,2),'StoryWorld_R62_Coop_Save.json','application/json');notice('협동 저장 파일을 내보냈습니다.');}
 function showCoopMenu(){
  if(!active()){originalMenu();return;}pauseForMenu();uiView='menu';openPanel('<button id="coopMenuResume62" class="close">계속</button><div class="eyebrow">CO-OP / '+esc(state.code||'연결 중')+'</div><h2>함께 걷는 기억</h2><p id="coopNotice62" role="status" aria-live="polite">'+esc(state.message)+'</p><div class="actions"><button id="coopRoomMenu62" class="primary">참가자 / 연결</button>'+(state.role==='host'?'<button id="coopSave62">협동 진행 저장</button><button id="coopExport62">협동 저장 내보내기</button>':'')+'<button id="coopUpgrade62">패시브 강화</button><button id="coopSettings62">환경 설정</button><button id="coopHelp62">조작 안내</button><button id="coopLeave62">'+(state.role==='host'?'방 종료':'방 나가기')+'</button></div>'+fieldLabel());
  bind('coopMenuResume62',()=>{if(state.phase==='lobby'){showLobby();return;}uiView=null;resumePresentation();});bind('coopRoomMenu62',showLobby);bind('coopSave62',saveSession);bind('coopExport62',exportSession);bind('coopLeave62',()=>shutdown());bind('coopSettings62',()=>{uiView='settings';showSettings();});bind('coopHelp62',()=>{uiView='help';showHelp();});bind('coopUpgrade62',()=>{uiView='upgrades';if(sim()?.showUpgrades)return sim().showUpgrades();if(state.role==='host'&&typeof showUpgrades==='function')return showUpgrades();notice('게스트 강화는 방장에게 요청해 적용합니다. 현재 연결 상태에서는 강화 창을 열 수 없습니다.',true);});
 }
 function updateBadge(){const n=byId('coopBadge62');if(!n)return;n.hidden=!active();if(!active())return;n.textContent=(state.status==='reconnecting'?'재접속 중':state.status==='connecting'?'연결 중':state.paused?'협동 · 대기':'협동 '+state.players.filter(p=>p.connected).length+'/4')+(state.code?' · '+state.code:'');n.setAttribute('aria-label','협동 연결 상태와 참가자 보기');}
 function appendTitleActions(){
  const p=byId('panel');if(!p||byId('coopTitleActions62'))return;const n=document.createElement('div');n.id='coopTitleActions62';n.className='actions coopTitleActions62';n.innerHTML='<button id="coopSolo62">혼자 하기</button><button id="coopCreate62" class="primary">온라인 방 만들기</button><button id="coopJoin62">방 코드로 참가</button>';p.appendChild(n);bind('coopSolo62',solo);bind('coopCreate62',()=>showConnect('create'));bind('coopJoin62',()=>showConnect('join'));
 }
 const nativeClose=typeof closePanel==='function'?closePanel:null;
 if(nativeClose)closePanel=function(...args){const result=nativeClose.apply(this,args);if(hostMenuPaused&&active()&&state.role==='host'&&(typeof modal==='undefined'||!modal)){hostMenuPaused=false;send('pause',{paused:document.hidden,reason:document.hidden?'background':'manual'});}return result;};
 const originalTitle=typeof showTitle==='function'?showTitle:()=>{},originalMenu=typeof showMenu==='function'?showMenu:()=>{};
 if(typeof showTitle==='function')showTitle=function(...args){if(active()){showLobby();return;}uiView=null;const result=originalTitle.apply(this,args);appendTitleActions();return result;};
 if(typeof showMenu==='function')showMenu=function(...args){return active()?showCoopMenu():originalMenu.apply(this,args);};
 function mount(){
  if(!document.body)return;const style=document.createElement('style');style.id='coopStyle62';style.textContent='.coopForm62{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:18px 0}.coopForm62 label{display:flex;flex-direction:column;gap:7px;color:#d9ddd9;font-size:14px}.coopForm62 label:last-child{grid-column:1/-1}.coopForm62 input,.coopForm62 select{width:100%;box-sizing:border-box;padding:11px 12px;background:#11191c;border:1px solid #536365;border-radius:8px;color:#f0eee8;font:inherit}.coopForm62 input:focus,.coopForm62 select:focus{outline:2px solid #d8b67b;outline-offset:2px}.coopNotice62{min-height:1.5em;color:#c7d9d1}.coopNotice62.error{color:#ffb3a4}.coopRoom62{display:flex;align-items:center;gap:15px;flex-wrap:wrap;padding:14px;background:#1d2729;border:1px solid #536365;border-radius:9px}.coopRoom62 strong{font:700 25px monospace;letter-spacing:.2em;color:#e6cf9f}.coopRoster62{list-style:none;padding:0;margin:16px 0}.coopRoster62 li{display:grid;grid-template-columns:9px 1fr auto;gap:10px;padding:13px 3px;border-bottom:1px solid #445053;align-items:center}.coopRoster62 li small{grid-column:2/-1;color:#c6c6b6}.coopDot62{width:7px;height:7px;border-radius:50%;background:#b5ac8c}.coopDot62.ready{background:#a4cdb4}.coopDot62.lost{background:#a27468}.coopTitleActions62{border-top:1px solid #445053;margin-top:20px;padding-top:15px}#coopBadge62{position:fixed;top:102px;right:16px;z-index:500;background:#111b20e8;border:1px solid #9c977f;border-radius:7px;color:#e4ddc5;padding:8px 11px;font:12px system-ui;max-width:230px;cursor:pointer}#coopBadge62[hidden]{display:none}@media(max-width:600px){.coopForm62{grid-template-columns:1fr}#coopBadge62{top:86px;right:8px;font-size:11px;max-width:180px}.coopRoom62{gap:9px}.coopRoom62 strong{font-size:22px}}';document.head.appendChild(style);
  const badge=document.createElement('button');badge.id='coopBadge62';badge.hidden=true;badge.onclick=showLobby;document.body.appendChild(badge);updateBadge();
  if(typeof started==='undefined'||!started)appendTitleActions();
 }
 document.addEventListener('visibilitychange',()=>{if(!active()||state.role!=='host')return;send('pause',{paused:document.hidden,reason:'background'});if(document.hidden)notice('방장 화면이 백그라운드에 있어 전투가 일시 정지됩니다.');});
 window.addEventListener('pagehide',()=>{if(active()&&state.role==='host'){send('leave');try{socket?.close(1000,'host_left');}catch(_){}}});
 window.__STORYWORLD_COOP_CLIENT_R62__=Object.freeze({revision,gameId,protocol,on,send,inspect,connect,disconnect:shutdown,showLobby,showConnect,showMenu:showCoopMenu,solo,validateEndpoint,save:saveSession,exportSave:exportSession,active,isHost:()=>active()&&state.role==='host'});
 mount();
})();
