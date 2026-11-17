/* R125 사몽 구역 분위기 소리 — R123 분위기(samong-mood-r123.js)에 맞춘 배경 소리를 소리 파일 없이 Web Audio 로 합성한다.
 * 구역 분위기마다 깔리는 소리(바람·기계 웅웅·낮은 울림·방 공기)와 가끔 들리는 소리(발소리·종·쇳소리·데이터 짹짹·전차 종·
 * 심장 박동·붓 스치는 소리·물방울)를 고른다. 감정의 탑은 높을수록 바람이 세진다.
 * 게임이 이미 연 audioContext 를 빌려 쓰고(새로 열지 않음), 효과음 끔·음량 0·탭 숨김·사몽 밖에서는 소리를 내지 않는다.
 * 설정 키 r125.ambience. Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_AMBIENCE_R125__)return;
 const REV='R125-ambience-1';
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r125.ambience';
 const prefs={on:true,level:.6};
 try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;if(Number.isFinite(+s?.level))prefs.level=Math.max(0,Math.min(1,+s.level));}catch(_){}
 function set(p={}){if(typeof p.on==='boolean')prefs.on=p.on;if(Number.isFinite(+p.level))prefs.level=Math.max(0,Math.min(1,+p.level));try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 const stats={beds:0,events:0,stops:0,ticks:0};let failures=0,lastError=null;const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,300);};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 // 분위기 → 깔리는 소리(bed)와 가끔 소리(events)
 const PLAN={tower:{bed:'wind',ev:['gust','ding']},machine:{bed:'hum',ev:['clank','boom']},data:{bed:'room',ev:['chirp','chirp','glitch']},forest:{bed:'leaves',ev:['chime']},
  rose:{bed:'drone',ev:['music','tick']},school:{bed:'room',ev:['steps','bell','steps']},manga:{bed:'drone',ev:['steps','drip']},ink:{bed:'drone',ev:['drip','brush']},
  gyeong:{bed:'wind',ev:['tram','steps']},root:{bed:'drone',ev:['heart']},persona:{bed:'drone',ev:['tick','whisper']},
  gallery:{bed:'room',ev:['brush','drip']},lesson:{bed:'room',ev:['brush','tick']},gogh:{bed:'leaves',ev:['brush']},dali:{bed:'wind',ev:['tick','tick']},manet:{bed:'room',ev:['glass']},
  picasso:{bed:'room',ev:['brush','glass']},klimt:{bed:'room',ev:['chime']},monet:{bed:'leaves',ev:['drip','chime']},surreal:{bed:'drone',ev:['tick','brush']},blank:{bed:'room',ev:['brush']},garden:{bed:'leaves',ev:['chime']}};
 const ctxA=()=>typeof audioContext!=='undefined'&&audioContext&&audioContext.state!=='closed'?audioContext:null;
 const mood=()=>{try{return window.__STORYWORLD_MOOD_R123__?.inspect?.()||null;}catch(_){return null;}};
 function allowed(){if(!prefs.on||prefs.level<=0)return false;if(typeof settings!=='undefined'&&(settings.sound===false||!(+settings.volume>0)))return false;if(typeof document!=='undefined'&&document.hidden)return false;return true;}
 function vol(){return .14*prefs.level*clamp(typeof settings!=='undefined'?+settings.volume||0:1,0,1);}
 let out=null,noise=null,bed=null,theme=null,nextEv=0,heartAt=0;
 function bus(A){if(out&&out.context===A)return out;out=A.createGain();out.gain.value=0;out.connect(A.destination);return out;}
 function noiseBuf(A){if(noise&&noise.sampleRate===A.sampleRate)return noise;const n=A.sampleRate*2,b=A.createBuffer(1,n,A.sampleRate),d=b.getChannelData(0);let last=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;last=last*.97+w*.03;d[i]=w*.6+last*2.5;}noise=b;return b;}
 function src(A){const s=A.createBufferSource();s.buffer=noiseBuf(A);s.loop=true;return s;}
 // 깔리는 소리: 몇 개의 노드를 만들고 stop() 하나로 거둔다
 function makeBed(A,kind,dest){const nodes=[],g=A.createGain();g.gain.value=0;g.connect(dest);const add=n=>{nodes.push(n);return n;};
  if(kind==='wind'||kind==='leaves'){const s=add(src(A)),f=A.createBiquadFilter();f.type=kind==='wind'?'bandpass':'highpass';f.frequency.value=kind==='wind'?520:2600;f.Q.value=kind==='wind'?.9:.4;
   const l=add(A.createOscillator()),lg=A.createGain();l.frequency.value=kind==='wind'?.13:.31;lg.gain.value=kind==='wind'?260:700;l.connect(lg);lg.connect(f.frequency);s.connect(f);f.connect(g);s.start();l.start();}
  else if(kind==='hum'){for(const[fq,a]of[[55,.5],[110,.25],[165,.1]]){const o=add(A.createOscillator()),og=A.createGain();o.type='sawtooth';o.frequency.value=fq;og.gain.value=a;const f=A.createBiquadFilter();f.type='lowpass';f.frequency.value=320;o.connect(f);f.connect(og);og.connect(g);o.start();}}
  else if(kind==='drone'){for(const fq of[61.7,62.3,92.5]){const o=add(A.createOscillator()),og=A.createGain();o.type='sine';o.frequency.value=fq;og.gain.value=fq>90?.18:.4;o.connect(og);og.connect(g);o.start();}}
  else{const s=add(src(A)),f=A.createBiquadFilter();f.type='lowpass';f.frequency.value=380;s.connect(f);f.connect(g);s.start();}
  stats.beds++;return{kind,g,nodes,stop(t){try{g.gain.cancelScheduledValues(t);g.gain.setTargetAtTime(0,t,.4);}catch(_){}for(const n of nodes)try{n.stop(t+2);}catch(_){}stats.stops++;}};}
 const BED_LEVEL={wind:.9,leaves:.35,hum:.22,drone:.5,room:.45};
 // 가끔 소리
 function env(A,dest,t,a,d,peak){const g=A.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);g.connect(dest);return g;}
 function tone(A,dest,t,fq,d,peak,type='sine',to=null){const o=A.createOscillator();o.type=type;o.frequency.setValueAtTime(fq,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+d);o.connect(env(A,dest,t,.005,d,peak));o.start(t);o.stop(t+d+.05);}
 function burst(A,dest,t,fq,q,d,peak,type='bandpass'){const s=src(A),f=A.createBiquadFilter();f.type=type;f.frequency.value=fq;f.Q.value=q;s.connect(f);f.connect(env(A,dest,t,.004,d,peak));s.start(t,Math.random()*1.5);s.stop(t+d+.05);}
 const EV={
  steps(A,d,t){const n=2+(Math.random()*3|0),gap=.45+Math.random()*.15;for(let i=0;i<n;i++)burst(A,d,t+i*gap,160,1.2,.12,.5,'lowpass');},
  bell(A,d,t){tone(A,d,t,659,2.4,.18);tone(A,d,t,988,1.8,.08);},
  ding(A,d,t){tone(A,d,t,1318,.9,.12);tone(A,d,t+.25,1046,1.2,.12);},
  gust(A,d,t){burst(A,d,t,700,.7,2.2,.35);},
  clank(A,d,t){burst(A,d,t,2200,8,.35,.35);tone(A,d,t,420,.5,.08,'triangle');},
  boom(A,d,t){tone(A,d,t,70,1.6,.5,'sine',38);},
  chirp(A,d,t){const n=1+(Math.random()*3|0);for(let i=0;i<n;i++)tone(A,d,t+i*.09,1200+Math.random()*800,.06,.05,'square',2600);},
  glitch(A,d,t){for(let i=0;i<5;i++)burst(A,d,t+i*.04,3000+i*500,6,.03,.15);},
  chime(A,d,t){const f=[1568,1760,2093][Math.random()*3|0];tone(A,d,t,f,2.2,.06);},
  music(A,d,t){const s=[784,659,587,523];s.forEach((f,i)=>tone(A,d,t+i*.38,f*(1+(Math.random()-.5)*.02),.5,.04,'triangle'));},// 낡은 오르골
  tick(A,d,t){for(let i=0;i<4;i++)burst(A,d,t+i*.5,3500,10,.02,.18);},
  drip(A,d,t){tone(A,d,t,1400,.12,.1,'sine',600);},
  brush(A,d,t){burst(A,d,t,4200,.6,.5,.12,'highpass');},
  glass(A,d,t){tone(A,d,t,2637,.8,.05);},
  tram(A,d,t){tone(A,d,t,1046,.6,.1);tone(A,d,t+.18,1318,.8,.1);},
  whisper(A,d,t){burst(A,d,t,3200,2,1.1,.12);},
  heart(A,d,t){tone(A,d,t,58,.18,.7,'sine',40);tone(A,d,t+.26,52,.22,.55,'sine',36);}};
 function tick(){stats.ticks++;const A=ctxA();if(!A)return;const m=mood(),key=allowed()&&m?.theme&&PLAN[m.theme]?m.theme:null;const now=A.currentTime,o=bus(A);
  o.gain.setTargetAtTime(key?vol():0,now,.5);
  if(key!==theme){if(bed){bed.stop(now);bed=null;}theme=key;nextEv=now+3+Math.random()*4;heartAt=now+1;if(key){bed=makeBed(A,PLAN[key].bed,o);}}
  if(!key||!bed)return;
  let lvl=BED_LEVEL[bed.kind]||.4;if(key==='tower'){const f=m.floor,h=f==='G'?0:clamp((+f||1)/16,0,1);lvl*=.25+.9*h;}// 높을수록 바람이 세다
  bed.g.gain.setTargetAtTime(lvl,now,.8);
  if(key==='root'){if(now>=heartAt){EV.heart(A,o,now+.02);heartAt=now+1.3;stats.events++;}}
  else if(now>=nextEv){const list=PLAN[key].ev;EV[list[Math.random()*list.length|0]](A,o,now+.05);stats.events++;nextEv=now+5+Math.random()*9;}}
 let timer=null;function start(){if(timer||typeof setInterval!=='function')return;timer=setInterval(()=>{try{tick();}catch(e){fail(e);}},250);}
 function settingsSection(){if(typeof document==='undefined'||document.getElementById('r125Ambience'))return;const host=document.getElementById('moodSettingsR123')?.querySelector('.settings');if(!host)return;const d=document.createElement('div');d.id='r125Ambience';
  d.innerHTML='<label><input type="checkbox" data-r125="on" '+(prefs.on?'checked':'')+'> 구역 분위기 소리(바람·발소리·종·기계음·심장 박동)</label><label>분위기 소리 크기 <input type="range" min="0" max="1" step=".05" value="'+prefs.level+'" data-r125="level"></label>';
  host.appendChild(d);d.querySelector('[data-r125="on"]').onchange=e=>set({on:e.target.checked});d.querySelector('[data-r125="level"]').oninput=e=>set({level:+e.target.value});}
 try{if(typeof showSettings==='function'){const b=showSettings;showSettings=function(...a){const r=b.apply(this,a);try{settingsSection();}catch(e){fail(e);}return r;};}start();}catch(e){fail(e);}
 window.__STORYWORLD_AMBIENCE_R125__=Object.freeze({revision:REV,plan:PLAN,events:Object.keys(EV),prefs:()=>({...prefs}),set,tick,allowed,
  inspect:()=>({revision:REV,prefs:{...prefs},theme,bed:bed?.kind||null,stats:{...stats},failures,lastError})});
})();
