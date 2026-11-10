// R150 — 렉 줄이기: 실제 기기에서 장면이 느리면 무거운 꾸밈 층을 자동으로 끄는 '가벼운 화면' + 성능 표시(사용자 2026-10-30 "렉너무심한데 최적화",
//  "8시간 동안 플레이하며 렉 개선"). 측정(헤드리스 dist00): 게임 화면 위에 화면 크기 층이 14개 겹치고, 그중 5개가 섞어 칠하기
//  (soft-light 녹·횃불, multiply 어둠, overlay 노이즈, screen 주변 환경빛)라 휴대폰 그래픽에서는 층마다 화면 전체를 한 번 더 칠한다.
//  헤드리스는 그래픽 카드가 없어 이 비용을 잴 수 없다(화면 합치기마다 WebGL 그림을 다시 읽어 와 시간이 대부분 그쪽으로 감) — 그래서 기기에서 직접 잰다:
//  · 플레이 중(서사·창·로딩·숨김 아님) 장면 간격을 모아 4초 넘게 중앙값이 28ms(약 36장/초)보다 느리면 '가벼운 화면'을 켠다(자동, 한 번 켜면 그 판에서는 유지).
//  · 가벼운 화면: 녹 얼룩·바닥 안개·불티(R123), 필름 노이즈(R114), 떠다니는 먼지(R100), 주변 환경빛(R62), 게임 화면 색 보정 필터를 끈다.
//    어둠(비네트)·횃불 빛·빛 웅덩이는 길과 적이 보이게 하는 것이라 남긴다. 판정·피해·저장·그림 자산은 건드리지 않는다.
//  · 자동 켜기는 사람이 쓰는 브라우저에서만 한다(navigator.webdriver 인 자동 시험 브라우저는 그래픽 카드 없이 소프트웨어로 그려 장면 간격이 실제와 무관하다).
//  · R153: 성능 표시는 왼쪽 위 목표 안내와 겹치지 않게 길잡이 나침반 아래(위에서 150px)에 둔다.
//  · 설정 간이설정에 '렉 줄이기 자동/켜기/끄기'와 '초당 장면 수 표시'(왼쪽 위 작은 글씨: 장면/초 · 한 장면에 걸린 시간 ms). storyworld.r150.perf 에 저장.
(()=>{'use strict';
if(window.__STORYWORLD_PERF_R150__)return;
const KEY='storyworld.r150.perf',SLOW_MS=28,NEED_MS=4000;
let prefs={lite:'auto',meter:false};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
if(!['auto','on','off'].includes(prefs.lite))prefs.lite='auto';
const automated=!!(typeof navigator!=='undefined'&&navigator.webdriver);
const stats={frames:0,playFrames:0,slowChecks:0,autoOn:0,checks:0,median:null,p90:null,work:null,lite:false,reason:''};let lastError=null;
const fail=e=>{lastError=String(e?.message||e).slice(0,160);};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}};
const say=(t,s=3.2)=>{try{if(typeof toast==='function')toast(t,s);}catch(_){}};
const playing=()=>{try{return typeof started!=='undefined'&&started&&!modal&&!loading&&!storyScene&&!document.hidden;}catch(_){return false;}};
function css(){if(document.getElementById('perfR150Css'))return;const s=document.createElement('style');s.id='perfR150Css';
 s.textContent='html.swLiteR150 #darkR123 [data-d="rust"],html.swLiteR150 #darkR123 [data-d="fog"],html.swLiteR150 #darkR123 [data-d="cv"],'
 +'html.swLiteR150 #cinemaR114 [data-c="grain"],html.swLiteR150 #ambienceR100,html.swLiteR150 #passiveEnvironmentR62{display:none!important}'
 +'html.swLiteR150 #phase1-webgl{filter:none!important}'
 +'#perfMeterR150{position:fixed;left:8px;top:150px;z-index:99999;pointer-events:none;font:12px/1.3 monospace;color:#d8f0d0;background:rgba(0,0,0,.55);padding:2px 6px;border-radius:4px}'
 +'#perfMeterR150[hidden]{display:none}';document.head.appendChild(s);}
function setLite(on,why){stats.lite=!!on;stats.reason=why||'';document.documentElement.classList.toggle('swLiteR150',!!on);meterText();}
function apply(){setLite(prefs.lite==='on'||(prefs.lite==='auto'&&stats.autoOn>0),prefs.lite==='on'?'setting':stats.autoOn?'auto':'');}
// 장면 간격·한 장면 일 시간: 이 스크립트의 장면 콜백이 게임 그리기보다 먼저 불리므로(먼저 등록), 콜백 시작부터 그 장면의 그리기가 끝난 뒤 메시지까지를 잰다.
const gaps=[],works=[];let last=0,since=0,slowSince=0,t0=0;const ch=typeof MessageChannel==='function'?new MessageChannel():null;
if(ch)ch.port1.onmessage=()=>{if(t0){works.push(performance.now()-t0);if(works.length>120)works.shift();t0=0;}};
function loop(t){try{stats.frames++;const play=playing();if(play&&last&&t-last<1000){gaps.push(t-last);if(gaps.length>120)gaps.shift();stats.playFrames++;since+=t-last;}else if(!play){since=0;slowSince=0;gaps.length=0;}/* R159: 서사·창·로딩 동안 끊긴 시간을 '연속 느림'으로 세지 않는다 */
  last=t;if(play&&ch&&!t0&&prefs.meter){t0=performance.now();ch.port2.postMessage(0);}/* R157: 한 장면 시간은 성능 표시를 켰을 때만 잰다(자동 전환은 장면 간격만 쓴다) */
  if(since>=2000){since=0;check(t);}}catch(e){fail(e);}requestAnimationFrame(loop);}
function q(a,p){if(!a.length)return null;const s=a.slice().sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor((s.length-1)*p))];}
function check(t){stats.checks++;stats.median=Math.round(q(gaps,.5)*10)/10;stats.p90=Math.round(q(gaps,.9)*10)/10;stats.work=works.length?Math.round(q(works,.5)*10)/10:null;
 if(stats.median>SLOW_MS){stats.slowChecks++;if(!slowSince)slowSince=t;}else slowSince=0;
 if(prefs.lite==='auto'&&!stats.autoOn&&!automated&&slowSince&&t-slowSince>=NEED_MS-2000){stats.autoOn++;apply();say('화면이 느려서 꾸밈 효과 일부(안개·불티·노이즈·먼지)를 껐습니다. 설정 › 렉 줄이기에서 바꿀 수 있어요.');}
 meterText();}
let meter=null;function meterText(){try{if(!prefs.meter){if(meter)meter.hidden=true;return;}if(!meter){css();meter=document.createElement('div');meter.id='perfMeterR150';meter.setAttribute('aria-hidden','true');document.body.appendChild(meter);}
 meter.hidden=false;const fps=stats.median?Math.round(1000/stats.median):'-';meter.textContent='장면/초 '+fps+' · 한 장면 '+(stats.work??'-')+'ms'+(stats.lite?' · 가벼운 화면':'');}catch(e){fail(e);}}
function settingsSection(){const host=document.getElementById('quickSettingsR114');if(!host||document.getElementById('perfRowR150'))return;
 const row=document.createElement('div');row.id='perfRowR150';row.className='r114-row';row.setAttribute('role','radiogroup');row.setAttribute('aria-label','렉 줄이기');
 const L={auto:'자동',on:'켜기',off:'끄기'};
 row.innerHTML='렉 줄이기(안개·불티·노이즈 끄기) '+Object.keys(L).map(k=>'<button type="button" data-r150-lite="'+k+'" aria-pressed="'+(prefs.lite===k)+'" class="'+(prefs.lite===k?'active':'')+'">'+L[k]+'</button>').join(' ')
  +' <label><input type="checkbox" data-r150-meter '+(prefs.meter?'checked':'')+'> 초당 장면 수 표시</label>';
 const g=host.querySelector(':scope>.r114-row');if(g)g.after(row);else host.appendChild(row);// R153: 그래픽 품질 바로 아래(휴대폰 간이설정에서도 접히지 않음)
 row.querySelectorAll('[data-r150-lite]').forEach(b=>b.onclick=()=>{prefs.lite=b.dataset.r150Lite;save();apply();row.querySelectorAll('[data-r150-lite]').forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});});
 const m=row.querySelector('[data-r150-meter]');m.onchange=()=>{prefs.meter=m.checked;if(m.checked)works.length=0;save();meterText();};/* R159: 다시 켜면 옛 측정값을 버린다 */}
try{css();apply();requestAnimationFrame(loop);
 if(typeof showSettings==='function'){const b=showSettings;showSettings=function(...a){const r=b.apply(this,a);try{settingsSection();}catch(e){fail(e);}return r;};}
}catch(e){fail(e);}
window.__STORYWORLD_PERF_R150__=Object.freeze({inspect:()=>({...stats,automated,prefs:{...prefs},lastError}),set(p){if(p&&p.meter&&!prefs.meter)works.length=0;prefs={...prefs,...p};save();apply();meterText();},
 _check:check,_gaps:gaps,SLOW_MS,NEED_MS});
})();
