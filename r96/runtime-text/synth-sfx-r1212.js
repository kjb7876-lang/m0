/* R1212 코드 합성 효과음 → ElevenLabs 효과음 (사용자 2026-11-19 "단순코드로만든 모든효과음 조사해서 일레븐랩스로 각각상황에 맞는 고품질 효과음으로 바꿔").
 * 전수 조사에서 소리 파일 없이 오실레이터·잡음으로 합성하던 곳은 넷이다: R125 사몽 분위기(깔리는 소리 5·가끔 소리 17), R356 카이로 시계(초침·종·쇠종),
 * R568 보스 등장 울림, R123 층·연도 숫자 딸깍. 그 파일들은 소리를 내기 직전에 이 오버레이에 먼저 묻고, 파일이 준비돼 있으면 파일을, 아니면 예전 합성을 낸다.
 *  · 파일: assets/r1212/sfx(scripts/build-sfx-r1212.py 가 ElevenLabs text-to-sound v3 변주 중 골라 다듬음) + 바람·방 공기는 R664 환경음 재사용.
 *  · 음량: 표 게인 = 예전 합성 소리의 가장 큰 구간 RMS / 파일 RMS(거의 안 들리던 합성은 바닥값까지 올림). 호출한 쪽의 버스·게인을 그대로 탄다.
 *  · 컨텍스트마다 한 번 받아 해독(받은 바이트는 공유), 실패한 파일은 다시 받지 않음. 새 AudioContext 를 열지 않는다(받는 쪽이 넘긴 것만 씀).
 *  · 끄기: localStorage storyworld.r1212.sfx = '0' → 모두 예전 합성.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_SYNTH_SFX_R1212__)return;
 const REV='R1212-synth-sfx-1';
 const TABLE=/*TABLE*/{"amb_bell":{"files":["assets/r1212/sfx/amb-bell-1.ogg"],"gain":1.064},"amb_boom":{"files":["assets/r1212/sfx/amb-boom-1.ogg"],"gain":1.799},"amb_brush":{"files":["assets/r1212/sfx/amb-brush-1.ogg","assets/r1212/sfx/amb-brush-2.ogg"],"gain":0.423},"amb_chime":{"files":["assets/r1212/sfx/amb-chime-1.ogg"],"gain":0.909},"amb_chirp":{"files":["assets/r1212/sfx/amb-chirp-1.ogg","assets/r1212/sfx/amb-chirp-2.ogg"],"gain":0.46},"amb_clank":{"files":["assets/r1212/sfx/amb-clank-1.ogg"],"gain":0.362},"amb_ding":{"files":["assets/r1212/sfx/amb-ding-1.ogg"],"gain":1.052},"amb_drip":{"files":["assets/r1212/sfx/amb-drip-1.ogg","assets/r1212/sfx/amb-drip-2.ogg"],"gain":0.548},"amb_glass":{"files":["assets/r1212/sfx/amb-chime-1.ogg"],"gain":0.909,"rate":1.5},"amb_glitch":{"files":["assets/r1212/sfx/amb-glitch-1.ogg","assets/r1212/sfx/amb-glitch-2.ogg"],"gain":0.223},"amb_gust":{"files":["assets/r1212/sfx/amb-gust-1.ogg"],"gain":0.246},"amb_heart":{"files":["assets/r1212/sfx/amb-heart-1.ogg","assets/r1212/sfx/amb-heart-2.ogg"],"gain":1.864},"amb_music":{"files":["assets/r1212/sfx/amb-music-1.ogg"],"gain":0.309},"amb_steps":{"files":["assets/r1212/sfx/amb-steps-1.ogg","assets/r1212/sfx/amb-steps-2.ogg"],"gain":0.494},"amb_tick":{"files":["assets/r1212/sfx/amb-tick-1.ogg","assets/r1212/sfx/amb-tick-2.ogg"],"gain":0.539},"amb_tram":{"files":["assets/r1212/sfx/amb-tram-1.ogg"],"gain":0.462},"amb_whisper":{"files":["assets/r1212/sfx/amb-whisper-1.ogg"],"gain":0.234},"banner_tick":{"files":["assets/r1212/sfx/banner-tick-1.ogg","assets/r1212/sfx/banner-tick-2.ogg"],"gain":0.342},"bed_drone":{"files":["assets/r1212/sfx/bed-drone.ogg"],"gain":2.5,"loop":true},"bed_hum":{"files":["assets/r1212/sfx/bed-hum.ogg"],"gain":0.999,"loop":true},"bed_leaves":{"files":["assets/r1212/sfx/bed-leaves.ogg"],"gain":1.357,"loop":true},"bed_room":{"files":["assets/r664/ambience/hall.ogg"],"gain":2.5,"loop":true},"bed_wind":{"files":["assets/r664/ambience/wind.ogg"],"gain":2.5,"loop":true},"boss_reveal":{"files":["assets/r1212/sfx/boss-reveal-1.ogg"],"gain":1.431},"kairo_chime":{"files":["assets/r1212/sfx/kairo-chime-1.ogg"],"gain":0.184},"kairo_tick":{"files":["assets/r1212/sfx/amb-tick-1.ogg","assets/r1212/sfx/amb-tick-2.ogg"],"gain":0.266},"kairo_toll":{"files":["assets/r1212/sfx/kairo-toll-1.ogg"],"gain":0.343}}/*END*/;
 let on=true;try{on=localStorage.getItem('storyworld.r1212.sfx')!=='0';}catch(_){}
 const raw=new Map(),failed=new Set(),decoded=new WeakMap(),stats={plays:0,beds:0,misses:0,loads:0,errors:0};let lastError=null;
 const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,200);};
 function bytes(f){if(raw.has(f))return raw.get(f);stats.loads++;
  const p=Promise.resolve().then(()=>fetch(f)).then(r=>{if(!r||!r.ok)throw new Error('http '+(r&&r.status));return r.arrayBuffer();}).catch(e=>{failed.add(f);fail(e);return null;});raw.set(f,p);return p;}
 function slot(ctx){let m=decoded.get(ctx);if(!m){m=new Map();decoded.set(ctx,m);}return m;}
 function load(ctx,f){const m=slot(ctx);if(m.has(f))return m.get(f).p;const e={buf:null,p:null};m.set(f,e);
  e.p=bytes(f).then(ab=>{if(!ab)return null;return Promise.resolve(ctx.decodeAudioData(ab.slice(0))).then(b=>{e.buf=b||null;return e.buf;});}).catch(err=>{failed.add(f);fail(err);return null;});return e.p;}
 function files(){return [...new Set(Object.values(TABLE).flatMap(v=>v.files||[]))];}
 function okCtx(ctx){return !!(ctx&&typeof ctx.createBufferSource==='function'&&typeof ctx.decodeAudioData==='function'&&ctx.state!=='closed');}
 function preload(ctx){if(!on||!okCtx(ctx))return Promise.resolve(false);return Promise.all(files().map(f=>load(ctx,f))).then(()=>true);}
 function pick(name,ctx){const t=TABLE[name];if(!t||!t.files||!t.files.length)return null;const m=slot(ctx),ready=t.files.map(f=>m.get(f)&&m.get(f).buf).filter(Boolean);
  if(ready.length<t.files.length)t.files.forEach(f=>{if(!failed.has(f))load(ctx,f);});return ready.length?ready[Math.random()*ready.length|0]:null;}
 function ready(name,ctx){if(!on||!okCtx(ctx))return false;const t=TABLE[name];return !!(t&&t.files.some(f=>slot(ctx).get(f)&&slot(ctx).get(f).buf));}
 const fin=v=>typeof v==='number'&&isFinite(v);
 // 한 번 소리: 준비된 파일이 있으면 그 시각에 재생하고 소스를 돌려준다(없으면 null → 호출한 쪽이 합성).
 function play(name,ctx,dest,t,opt){try{if(!on||!okCtx(ctx)||!dest)return null;const buf=pick(name,ctx);if(!buf){stats.misses++;return null;}const T=TABLE[name],o=opt||{};
   const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=buf;const r=(T.rate||1)*(fin(o.rate)&&o.rate>0?o.rate:1);if(s.playbackRate)s.playbackRate.value=Math.max(.25,Math.min(4,r));
   g.gain.value=Math.max(0,Math.min(4,(T.gain||1)*(fin(o.gain)?o.gain:1)));s.connect(g);g.connect(dest);const at=fin(t)?Math.max(t,0):ctx.currentTime;s.start(at);
   if(typeof s.addEventListener==='function')s.addEventListener('ended',()=>{try{g.disconnect();}catch(_){}});stats.plays++;return s;}catch(e){fail(e);return null;}}
 // 깔리는 소리: 반복 재생 소스(이미 시작됨, 멈춤은 받는 쪽이 stop()).
 function bed(name,ctx,dest){try{if(!on||!okCtx(ctx)||!dest)return null;const buf=pick(name,ctx);if(!buf){stats.misses++;return null;}const T=TABLE[name];
   const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=buf;s.loop=true;g.gain.value=Math.max(0,Math.min(4,T.gain||1));s.connect(g);g.connect(dest);s.start(ctx.currentTime,Math.random()*Math.max(0,(buf.duration||1)-1));stats.beds++;return s;}catch(e){fail(e);return null;}}
 // 게임이 연 audioContext 가 생기면 미리 받아 둔다(첫 소리부터 파일이 나도록). 새 컨텍스트는 만들지 않는다.
 let warmed=null;function warm(){try{const A=typeof audioContext!=='undefined'?audioContext:null;if(A&&A!==warmed&&okCtx(A)){warmed=A;preload(A);}}catch(e){fail(e);}}
 if(typeof setInterval==='function'){const tm=setInterval(()=>{warm();if(warmed)clearInterval(tm);},1500);}
 window.__STORYWORLD_SYNTH_SFX_R1212__=Object.freeze({revision:REV,table:TABLE,files,preload,ready,play,bed,enabled:()=>on,
  inspect:()=>({revision:REV,on,stats:{...stats},failed:[...failed],lastError})});
})();
