/* R664 지역 환경음 루프 (사용자 2026-11-11 "지역 배경음·환경음: 지역마다 바람·물·웅성임 같은 환경음 루프를 ElevenLabs 로 만들면 몰입감이 크게 올라요").
 * ElevenLabs(text-to-sound v2, 20초 loop)로 만든 환경음 6종(hall 실내 공기·wind 바람·water 물·crowd 먼 웅성임·stone 돌 공간·night 밤공기)을
 * scripts/build-ambience-r664.py 로 다듬어(150Hz 아래 쿵·웅웅 제거, 순간 소리 눌러주기, 평균 -32dBFS, 끝을 처음에 겹쳐 이음매 제거) 에피소드(지역 묶음)마다 한 겹 깐다.
 *  · 같은 소리를 쓰는 다음 지역으로 가면 끊지 않고 이어 가고, 다른 소리로 가면 이전 것을 서서히 줄이면서(약 3초) 새 것을 올린다.
 *  · 효과음·음성·BGM 보다 작은 바닥소리(버스 배율 최대 .5, 창이 열리면 더 줄임)라서 설정 음량·효과음 스위치를 그대로 따른다.
 *  · 게임이 이미 연 audioContext 를 빌려 쓰고(새로 열지 않음), 사몽 구역은 R125(합성 분위기 소리)가 맡으므로 건너뛴다.
 *  · 받기에 실패하면 그 소리는 건너뛴다(같은 파일을 계속 다시 받지 않음). 끄기: localStorage storyworld.r664.ambience = '0'.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_AMBIENCE_R664__)return;
 const REV='R664-ambience-1',DIR='assets/r664/ambience/',BEDS=['hall','wind','water','crowd','stone','night'];
 let on=true;try{on=localStorage.getItem('storyworld.r664.ambience')!=='0';}catch(_){}
 // 지역 id → 소리. 에피소드(assets/r308/bgm/index.json)와 같은 묶음. 사몽(sz…)은 R125 가 맡는다. 낱말 경계 정규식(예: 'ep1a080' 에는 안 걸림).
 const RULES=[[/^(?:hub|village|last30[23])$/,'crowd'],[/^dist\d+$/,'wind'],[/^last301$/,'wind'],[/^ep1a\d+b?$/,'hall'],[/^(?:dreamRest|ep1b01)$/,'stone'],[/^ep1b0[2-9]b?$/,'stone'],
  [/^(?:hando\d+|restHando)$/,'stone'],[/^(?:restEp1b|u20\d)$/,'hall'],[/^(?:kair\d+|restKairo|restLast3)$/,'hall'],[/^(?:restU2|last30[45])$/,'night'],[/^murder\d+$/,'water'],[/^cult\d+$/,'night']];
 function bedFor(z,env){z=String(z==null?'':z);if(!z||/^sz/.test(z)||env&&env.samong)return null;for(const[re,b]of RULES)if(re.test(z))return b;return null;}
 const stats={ticks:0,switches:0,loads:0,errors:0};let lastError=null;const failed=new Set(),bufs=new Map();
 const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
 const ctxA=()=>typeof audioContext!=='undefined'&&audioContext&&audioContext.state!=='closed'?audioContext:null;
 const V={zone:()=>typeof zone!=='undefined'?String(zone||''):'',started:()=>typeof started!=='undefined'&&!!started,modal:()=>typeof modal!=='undefined'&&!!modal,
  samong:()=>{try{return typeof room!=='undefined'&&!!room?.samongR103;}catch(_){return false;}},voice:()=>{try{return typeof voiceElement!=='undefined'&&voiceElement&&!voiceElement.paused;}catch(_){return false;}}};
 const G=(k,d)=>{try{return V[k]();}catch(_){return d;}};
 function allowed(){if(!on)return false;if(!G('started',false))return false;if(typeof settings!=='undefined'&&(settings.sound===false||!(+settings.volume>0)))return false;if(typeof document!=='undefined'&&document.hidden)return false;return true;}
 const BASE=.5; // 버스 최대 배율 — 음원이 이미 평균 -32dBFS 라 효과음(피크 -9~-14dB)·BGM 보다 훨씬 낮다
 function level(){const v=Math.max(0,Math.min(1,typeof settings!=='undefined'?+settings.volume||0:1)),duck=G('modal',false)?.6:G('voice',false)?.5:1;return BASE*v*duck;}
 let bus=null,busCtx=null,cur=null/* {name,src,g} */,want=null,token=0;
 function busFor(A){if(bus&&busCtx===A)return bus;bus=A.createGain();bus.gain.value=0;bus.connect(A.destination);busCtx=A;return bus;}
 function load(A,name){if(bufs.has(name))return bufs.get(name);stats.loads++;
  const p=Promise.resolve().then(()=>fetch(DIR+name+'.ogg')).then(r=>{if(!r||!r.ok)throw new Error('http '+(r&&r.status));return r.arrayBuffer();}).then(ab=>A.decodeAudioData(ab)).catch(e=>{failed.add(name);fail(e);return null;});
  bufs.set(name,p);return p;}
 function stopCur(A){if(!cur)return;const c=cur;cur=null;try{const t=A.currentTime;c.g.gain.setTargetAtTime(0,t,.8);c.src.stop(t+3.5);}catch(e){fail(e);}}
 function startBed(A,name){const my=++token;stopCur(A);want=name;if(!name)return;stats.switches++;
  load(A,name).then(buf=>{if(!buf||my!==token||!allowedBed(name))return;const t=A.currentTime,s=A.createBufferSource(),g=A.createGain();s.buffer=buf;s.loop=true;g.gain.value=0;s.connect(g);g.connect(busFor(A));
   try{g.gain.setTargetAtTime(1,t,.9);s.start(t,Math.random()*Math.max(0,buf.duration-.5));cur={name,src:s,g};}catch(e){fail(e);}});}
 const allowedBed=name=>want===name;
 function tick(){stats.ticks++;const A=ctxA();if(!A)return;const b=busFor(A),ok=allowed(),z=G('zone',''),name=ok?bedFor(z,{samong:G('samong',false)}):null;
  try{b.gain.setTargetAtTime(ok?level():0,A.currentTime,.5);}catch(_){}
  if(name&&failed.has(name))return;
  if(name!==want)startBed(A,name);}
 let timer=null;function start(){if(timer||typeof setInterval!=='function')return;timer=setInterval(()=>{try{tick();}catch(e){fail(e);}},250);}
 try{start();}catch(e){fail(e);}
 window.__STORYWORLD_AMBIENCE_R664__=Object.freeze({revision:REV,beds:BEDS.slice(),bedFor,tick,allowed,
  inspect:()=>({revision:REV,on,want,bed:cur?.name||null,loaded:[...bufs.keys()],failed:[...failed],stats:{...stats},lastError,generated:'ElevenLabs text-to-sound v2',directListeningVerified:false})});
})();
