/* R1109 동행(온라인 협동) 중계 서버 판 맞춤 — 사용자 2026-11-16 "저거 동행은 옛날 버전인데?"
 *  · 원인: 실제 Render 중계 서버(storyworld-r62-relay)는 옛 R62 코드로 떠 있어 /health 가 build R62 를 돌려준다.
 *    최신 게임의 동행 클라이언트(coop-client-r62)는 build R63R1 로 들어가므로 VERSION_MISMATCH 로 막혔다.
 *  · 고침(게임 쪽만, 원본 coop-client 는 그대로):
 *    1) 중계 주소 칸이 비어 있으면 실제 서버 주소를 미리 채운다(사용자가 넣은 주소는 덮어쓰지 않음).
 *    2) 중계 소켓(경로 /ws)이 입장(create·join·reconnect)에서 VERSION_MISMATCH 를 받으면 오류를 숨기고
 *       새 소켓으로 다른 판(R63R1↔R62)을 한 번만 다시 보낸다. 성공한 판은 주소별로 기억한다(이 탭 안에서만).
 *       (polish-r101 이 입장 판만은 이미 R62 로 다시 보내 주고 있었다 — 그래서 방은 열렸지만 아래 3) 이 없어
 *        옛 서버가 친구 입력을 모두 INPUT_INVALID 로 버려 친구가 움직이지 못했다. 서버 판은 welcome.build 로 읽는다.)
 *    3) 옛 R62 서버에서는 R62 가 모르는 입력 칸(autoBasic·autoSkill·threadDance)을 빼고, 자동 기본공격은 attack 으로 이어 준다.
 *       (옛 서버에선 게스트의 검무 단축 발동·자동 스킬은 빠진다. 서버를 다시 배포하면 이 맞춤은 저절로 꺼진다.)
 *    4) 안내 문구의 'R63R1 빌드'를 '최신 공개판'으로 바꾼다.
 * 끄기: localStorage storyworld.r1109.coopRelay = {"off":true} */
(()=>{'use strict';
 if(window.__STORYWORLD_COOP_RELAY_R1109__)return;
 const DEFAULT_RELAY='wss://storyworld-r62-relay.onrender.com/ws',KEY='storyworld.coop.r62.relay',OFF_KEY='storyworld.r1109.coopRelay';
 const CURRENT='R63R1',LEGACY='R62',ENTRY=new Set(['create','join','reconnect']),LEGACY_DROP=['autoBasic','autoSkill','threadDance'];
 const known=new Map(),stats={sockets:0,retries:0,legacyEntries:0,inputsAdjusted:0};
 const store=()=>{try{return window.__STORYWORLD_TEST_STORAGE_B1__?.store||window.localStorage||null;}catch(_){return null;}};
 const read=k=>{try{return store()?.getItem(k)??null;}catch(_){return null;}};
 let off=false;try{let raw=null;try{raw=window.localStorage?.getItem(OFF_KEY);}catch(_){}off=JSON.parse(raw||read(OFF_KEY)||'{}')?.off===true;}catch(_){}
 function seed(){try{const s=store();if(s&&!String(s.getItem(KEY)||'').trim())s.setItem(KEY,DEFAULT_RELAY);}catch(_){}}
 const api={DEFAULT_RELAY,revision:'R1109-coop-relay',inspect:()=>({off,...stats,legacy:[...known].filter(([,b])=>b===LEGACY).map(([u])=>u),known:Object.fromEntries(known)}),remember:(url,build)=>{if(build===CURRENT||build===LEGACY)known.set(String(url),build);}};
 window.__STORYWORLD_COOP_RELAY_R1109__=Object.freeze(api);
 if(off)return;
 seed();
 const Native=window.WebSocket;
 const isRelay=url=>{try{const u=new URL(String(url));return(u.protocol==='wss:'||u.protocol==='ws:')&&/\/ws\/?$/.test(u.pathname);}catch(_){return false;}};
 const parse=t=>{if(typeof t!=='string'||t.length>600000)return null;try{const m=JSON.parse(t);return m&&typeof m==='object'&&!Array.isArray(m)?m:null;}catch(_){return null;}};
 function legacyInput(m){const input=m.input;if(!input||typeof input!=='object')return m;const next={...input};let changed=false;if(next.autoBasic===true&&next.attack!==true){next.attack=true;changed=true;}for(const k of LEGACY_DROP)if(k in next){delete next[k];changed=true;}if(changed)stats.inputsAdjusted++;return{...m,input:next};}
 const Base=typeof EventTarget==='function'?EventTarget:class{};
 class RelaySocket extends Base{
  constructor(url,protocols){super();this.url=String(url);this._protocols=protocols;this._build=known.get(this.url)||null;this._entry=null;this._retried=false;this._welcomed=false;this._closing=false;this._swapping=false;this._queue=[];this._opened=false;this.readyState=0;this.binaryType='blob';this.onopen=null;this.onmessage=null;this.onclose=null;this.onerror=null;this._connect();}
  get bufferedAmount(){return this._inner?.bufferedAmount||0;}
  get protocol(){return this._inner?.protocol||'';}
  get extensions(){return this._inner?.extensions||'';}
  _fire(type,init){let ev;try{ev=type==='message'&&typeof MessageEvent==='function'?new MessageEvent('message',init):type==='close'&&typeof CloseEvent==='function'?new CloseEvent('close',init):typeof Event==='function'?new Event(type):{type,...init};}catch(_){ev={type,...init};}if(!('data' in ev)&&init&&'data' in init)try{Object.defineProperty(ev,'data',{value:init.data});}catch(_){}if(type==='close'&&!('code' in ev))try{Object.assign(ev,init);}catch(_){}
   try{this.dispatchEvent?.(ev);}catch(_){}const h=this['on'+type];if(typeof h==='function')h.call(this,ev);}
  _connect(){stats.sockets++;const ws=new Native(this.url,this._protocols);this._inner=ws;try{ws.binaryType=this.binaryType;}catch(_){}
   ws.onopen=()=>{if(ws!==this._inner)return;if(this._swapping){this._swapping=false;const entry=this._withBuild(this._entry);ws.send(JSON.stringify(entry));const q=this._queue.splice(0);for(const t of q)this._sendNow(t);return;}this._opened=true;this.readyState=1;this._fire('open',{});};
   ws.onmessage=e=>{if(ws!==this._inner)return;if(!this._welcomed){const m=parse(e.data);if(m?.type==='welcome'){this._welcomed=true;const b=m.build===LEGACY||m.build===CURRENT?m.build:this._sentBuild;this._serverBuild=b;if(b)known.set(this.url,b);}
     else if(m?.type==='error'&&m.code==='VERSION_MISMATCH'&&this._entry&&!this._retried&&!this._closing){this._retried=true;stats.retries++;this._build=this._sentBuild===LEGACY?CURRENT:LEGACY;this._swapping=true;this._old=ws;try{ws.onclose=null;ws.onerror=null;ws.close(1000,'r1109-retry');}catch(_){}this._connect();return;}}
    this._fire('message',{data:e.data});};
   ws.onerror=()=>{if(ws!==this._inner)return;this._fire('error',{});};
   ws.onclose=e=>{if(ws!==this._inner)return;this.readyState=3;this._fire('close',{code:e?.code??1006,reason:e?.reason??'',wasClean:!!e?.wasClean});};}
  _withBuild(m){if(!m)return m;const build=this._build||m.build;this._sentBuild=build;if(build===LEGACY)stats.legacyEntries++;return build===m.build?m:{...m,build};}
  _sendNow(text){const m=parse(text);if(m&&ENTRY.has(m.type)&&m.gameId==='storyworld'&&!this._welcomed){this._entry=m;const out=this._withBuild(m);this._inner.send(out===m?text:JSON.stringify(out));return;}
   if((this._serverBuild||this._sentBuild)===LEGACY&&m?.type==='input'){this._inner.send(JSON.stringify(legacyInput(m)));return;}
   this._inner.send(text);}
  send(text){if(this.readyState!==1)throw new Error('WebSocket is not open');if(this._swapping){this._queue.push(text);return;}this._sendNow(text);}
  close(code,reason){if(this.readyState>=2)return;this._closing=true;this.readyState=2;const ws=this._inner;if(this._swapping){this._swapping=false;this.readyState=3;try{ws.onclose=null;ws.close();}catch(_){}this._fire('close',{code:code??1000,reason:reason??'',wasClean:true});return;}try{code===undefined?ws.close():ws.close(code,reason);}catch(_){try{ws.close();}catch(__){}}}
 }
 for(const [k,v] of [['CONNECTING',0],['OPEN',1],['CLOSING',2],['CLOSED',3]]){Object.defineProperty(RelaySocket,k,{value:v});Object.defineProperty(RelaySocket.prototype,k,{value:v});}
 if(typeof Native==='function'){
  const Wrapped=function WebSocket(url,protocols){if(!new.target)throw new TypeError("Failed to construct 'WebSocket': Please use the 'new' operator");return isRelay(url)?new RelaySocket(url,protocols):(protocols===undefined?new Native(url):new Native(url,protocols));};
  Wrapped.prototype=Native.prototype;for(const k of ['CONNECTING','OPEN','CLOSING','CLOSED'])Object.defineProperty(Wrapped,k,{value:Native[k]??RelaySocket[k]});
  window.WebSocket=Wrapped;}
 // 안내 문구: 'R63R1 빌드' → 최신 공개판
 const HINT='친구와 같은 게임 주소(최신 공개판)와 같은 중계 서버 주소를 쓰세요. 기본 주소가 채워져 있습니다. 무료 Render 서버는 오래 쉬면 깨는 데 약 1분 걸립니다.';
 const MISMATCH='중계 서버와 게임 판이 맞지 않습니다. 친구와 같은 게임 주소(최신 공개판)에서 열어 주세요. 계속되면 중계 서버를 다시 배포해야 합니다.';
 function retext(root){try{if(!root?.querySelectorAll)return;for(const n of root.querySelectorAll('p')){const t=n.textContent||'';if(!t.includes('R63R1'))continue;if(t.includes('R63R1 빌드·중계 서버'))n.textContent=HINT;else if(t.includes('R63R1 빌드가 다릅니다'))n.textContent=MISMATCH;}const r=root.querySelector?.('#coopRelay62');if(r&&!String(r.value||'').trim()){r.value=read(KEY)||DEFAULT_RELAY;}}catch(_){}}
 function watch(){const panel=document.getElementById?.('panel');if(!panel||typeof MutationObserver!=='function')return false;let busy=false;new MutationObserver(()=>{if(busy)return;busy=true;try{retext(panel);}finally{busy=false;}}).observe(panel,{childList:true,subtree:true,characterData:true});retext(panel);return true;}
 if(!watch()&&document.addEventListener)document.addEventListener('DOMContentLoaded',watch,{once:true});
})();
