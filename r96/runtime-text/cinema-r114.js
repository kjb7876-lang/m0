/* R114 영화적 호러 연출·빛 방향 그림자·설정 화면 정리 (사용자 요청 2026-10-28 05:25~05:29)
 * ① 빛 방향 그림자: 둥근 얼룩을 발밑에 깔던 그림자를, 빛의 반대쪽으로 길게 눕는 그림자 + 발밑 접지 그림자로 바꾼다.
 *    빛은 화면 왼쪽 위의 달빛(기본)이고, 영웅이 든 불빛 안(6칸)에 있는 물체·몹은 영웅에게서 멀어지는 쪽으로 그림자가 눕는다.
 *    영웅 자신의 그림자는 달빛 반대쪽으로 눕는다. 그림자는 그림 수가 늘지 않게 3개(접지 1 + 긴 그림자 2)로 그린다.
 * ② 괴수 호러 영화 색보정: 화면을 조금 어둡고 탁하게(대비↑·채도↓), 가장자리 비네트, 필름 그레인,
 *    영웅 주변만 밝은 불빛 원, 체력이 낮을 때 붉은 맥박, 보스와 맞붙는 순간 2.5초 시네마 레터박스.
 *    세기: 끔 / 약 / 보통(기본) / 강. 그래픽 품질 프리셋(낮음·보통·높음)과 함께 간이설정에서 고른다.
 * ③ 설정 화면: 설정 → 간이설정(품질 프리셋, 호러 세기, 음량, 주요 켜고 끄기) → 세부설정(기존 항목 전부를 갈래별로 접어 둠).
 *    기존 설정 항목의 동작·저장 방식은 그대로 두고, 위치만 옮긴다. 설정 키 r114.cinema. */
(()=>{'use strict';
if(window.__STORYWORLD_CINEMA_R114__||typeof shadow!=='function')return;
const REV='R114-cinema-1';
const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r114.cinema';
const LEVELS=['off','low','mid','high'],LEVEL_KO={off:'끔',low:'약',mid:'보통',high:'강'};
const prefs={shadows:true,horror:'mid',grain:true,letterbox:true,lightPool:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(prefs))if(typeof s?.[k]===typeof prefs[k]&&(k!=='horror'||LEVELS.includes(s[k])))prefs[k]=s[k];}catch(_){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
function set(patch={}){for(const k of Object.keys(prefs))if(typeof patch[k]===typeof prefs[k]&&(k!=='horror'||LEVELS.includes(patch[k])))prefs[k]=patch[k];save();applyGrade(true);return{...prefs};}
const stats={shadows:0,lightShadows:0,frames:0,letterboxes:0,settingsBuilt:0,moved:0};
let lastError=null,failures=0;const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,300);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),finite=(v,d=0)=>Number.isFinite(+v)?+v:d,TAU=Math.PI*2;
const live=()=>typeof started!=='undefined'&&started&&typeof player!=='undefined'&&!!player&&typeof room!=='undefined'&&!!room;
const lowFx=()=>!!(typeof settings!=='undefined'&&settings.lowFx);
const reduced=()=>!!(typeof settings!=='undefined'&&settings.reducedMotion);

// ---- ① 빛 방향 그림자 ------------------------------------------------------------------------------
// R119(사용자 2026-10-29 "게임 안에 별도의 태양 — 시간대에 따라 그림자 위치가 조금씩"): 해가 게임 시간 10분에 한 바퀴(하루) 돈다.
// 빛은 화면 앞쪽(카메라 쪽)에서 비춘다. 아침에는 그림자가 왼쪽 뒤로 길게(1.5배), 한낮엔 바로 뒤로 짧게(0.75배), 저녁엔 오른쪽 뒤로 길게 눕는다. 밤은 달빛(오른쪽 뒤).
// 프레임마다 한 번만 계산한다(그림 수·명령 수는 그대로).
const DAY=600,MOON0=(()=>{const x=1,y=-.42,l=Math.hypot(x,y);return{x:x/l,y:y/l};})();// 그림자는 물체 뒤(화면 위쪽)로 눕는다: 앞으로 눕으면 나무 밑동이 떠 보였다
const MOON={x:MOON0.x,y:MOON0.y,len:1,at:-1,phase:0};
function sunTick(){const t=typeof time==='number'?time:0;if(MOON.at===t)return MOON;MOON.at=t;const u=((t/DAY)%1+1)%1;MOON.phase=u;
 if(u>.75){MOON.x=MOON0.x;MOON.y=MOON0.y;MOON.len=1;return MOON;}// 밤: 달빛
 const s=u/.75,ang=(-.18+1.36*s)*Math.PI*.5+Math.PI*.12,x=Math.cos(Math.PI-ang*1.2),y=-.42;const l=Math.hypot(x,y)||1;
 MOON.x=x/l;MOON.y=y/l;MOON.len=.75+.75*Math.abs(Math.cos(Math.PI*s));return MOON;}
let heroScreen=null,heroScreenAt=-1;
function heroPoint(){const t=typeof time==='number'?time:0;if(heroScreenAt===t&&heroScreen)return heroScreen;heroScreenAt=t;heroScreen=null;
 if(live()&&prefs.lightPool&&prefs.horror!=='off'&&typeof project==='function')try{const q=project(player.x,player.y);heroScreen={x:q.x,y:q.y};}catch(_){}return heroScreen;}
function castDir(x,y){sunTick();const h=heroPoint(),z=typeof zoom==='number'?zoom:1,T=typeof TILE==='number'?TILE:34,R=6*T*z;
 if(!h)return{x:MOON.x,y:MOON.y,k:0};const dx=x-h.x,dy=(y-h.y)*1.6,d=Math.hypot(dx,dy);if(d<T*z*.35||d>R)return{x:MOON.x,y:MOON.y,k:0};
 const w=Math.sqrt(clamp(1.25*(1-d/R),0,1))*.95,ux=dx/d,uy=dy/d,vx=MOON.x*(1-w)+ux*w,vy=MOON.y*(1-w)+uy*w,l=Math.hypot(vx,vy)||1;return{x:vx/l,y:vy/l,k:w};}
function tag(anchorX,anchorY){if(typeof ctx==='undefined'||!Array.isArray(ctx.commands)||typeof ctx.point!=='function')return;const c=ctx.commands[ctx.commands.length-1];if(c&&c.kind==='fill'&&!c.r114Anchor)c.r114Anchor=ctx.point(anchorX,anchorY);}
const baseShadow=shadow;
shadow=function(x,y,radius=18,opt={}){
 if(!prefs.shadows||typeof ctx==='undefined'||!Number.isFinite(x+y))return baseShadow.apply(this,arguments);
 try{const o=opt||{},alpha=clamp(finite(o.alpha,1),0,1),lift=clamp(finite(o.lift),0,1),compact=lowFx()||!!(typeof coarsePointerQueryR63R2!=='undefined'&&coarsePointerQueryR63R2?.matches),
  rx=Math.max(compact?5:6,finite(radius,18)*.78*clamp(finite(o.scale,1),.45,2.4)*(1+lift*.08)),ry=Math.max(2,rx*(compact?.2:.3)*(1-lift*.25)),op=alpha*(compact?.8:1)*(1-lift*.55);
  if(op<=.01)return;const d=castDir(x,y),ang=Math.atan2(d.y,d.x),len=rx*(1.55+.5*d.k)*(1-lift*.5)*(d.k>0?1:MOON.len),dark=prefs.horror==='off'?1:prefs.horror==='low'?1.1:prefs.horror==='mid'?1.2:1.3;
  ctx.save();try{ctx.globalAlpha*=op;
   // 긴 그림자: 발밑에서 빛 반대쪽으로 눕는다(가까울수록 진하게).
   ctx.fillStyle='rgba(4,4,8,'+(.16*dark).toFixed(3)+')';ctx.beginPath();ctx.ellipse(x+d.x*len*.62,y+d.y*len*.62*.55,len*.78,ry*1.05,ang*.55,0,TAU);ctx.fill();tag(x,y);
   ctx.fillStyle='rgba(2,2,6,'+(.2*dark).toFixed(3)+')';ctx.beginPath();ctx.ellipse(x+d.x*len*.3,y+d.y*len*.3*.55,len*.46,ry*.82,ang*.55,0,TAU);ctx.fill();tag(x,y);
   // 접지: 발이 닿는 작은 진한 그림자
   ctx.fillStyle='rgba(0,0,0,'+(.38*dark).toFixed(3)+')';ctx.beginPath();ctx.ellipse(x,y,rx*.55,ry*.62,0,0,TAU);ctx.fill();tag(x,y);
  }finally{ctx.restore();}
  stats.shadows++;if(d.k>0)stats.lightShadows++;
 }catch(e){fail(e);return baseShadow.apply(this,arguments);}};

// ---- ② 호러 색보정 -------------------------------------------------------------------------------------
const GRADE={off:null,
 low:{filter:'contrast(1.06) saturate(.88) brightness(.95)',vig:.38,pool:.18,grain:.035},
 mid:{filter:'contrast(1.1) saturate(.8) brightness(.95)',vig:.46,pool:.24,grain:.05},
 high:{filter:'contrast(1.18) saturate(.68) brightness(.88) sepia(.08)',vig:.6,pool:.4,grain:.07}};
let layer=null,grainCanvas=null,lastGradeKey='',bossSeen=new WeakSet(),letterUntil=0,pulse=0;
function stageEl(){return document.getElementById('stage');}
function worldCanvases(){return['game','phase1-webgl'].map(id=>document.getElementById(id)).filter(Boolean);}
function makeLayer(){const s=stageEl();if(!s)return null;let el=document.getElementById('cinemaR114');if(el)return el;
 el=document.createElement('div');el.id='cinemaR114';el.setAttribute('aria-hidden','true');
 el.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:4;overflow:hidden';
 el.innerHTML='<div data-c="pool" style="position:absolute;inset:0"></div><div data-c="vig" style="position:absolute;inset:0"></div><div data-c="grain" style="position:absolute;inset:-50%;opacity:0;mix-blend-mode:overlay"></div><div data-c="pulse" style="position:absolute;inset:0;opacity:0"></div><div data-c="top" style="position:absolute;left:0;right:0;top:0;height:0;background:#000;transition:height .45s ease"></div><div data-c="bot" style="position:absolute;left:0;right:0;bottom:0;height:0;background:#000;transition:height .45s ease"></div>';
 if(getComputedStyle(s).position==='static')s.style.position='relative';s.appendChild(el);return el;}
function grainURL(){if(grainCanvas)return grainCanvas;const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');if(!g)return null;const im=g.createImageData(128,128);
 for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255|0;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}g.putImageData(im,0,0);grainCanvas=c.toDataURL('image/png');return grainCanvas;}
const part=n=>layer?.querySelector('[data-c="'+n+'"]');
function applyGrade(force=false){const G=GRADE[prefs.horror];const key=prefs.horror+'|'+prefs.grain+'|'+prefs.lightPool+'|'+lowFx();if(!force&&key===lastGradeKey)return;lastGradeKey=key;
 // R123: 다크 판타지 톤(dark-r123.js)이 있으면 녹·피 쪽 색을 필터 끝에 덧붙인다(호러 끔이어도 그 톤만은 따로 끌 수 있다).
 let dk='';try{dk=window.__STORYWORLD_DARK_R123__?.filter?.()||'';}catch(_){}
 for(const c of worldCanvases())c.style.filter=G?G.filter+dk:dk.trim();
 if(!layer)layer=makeLayer();if(!layer)return;layer.style.display=G?'block':'none';if(!G)return;
 part('vig').style.background='radial-gradient(ellipse 75% 70% at 50% 48%,rgba(0,0,0,0) 46%,rgba(4,2,8,'+G.vig+') 100%)';
 const gr=part('grain');if(prefs.grain&&!lowFx()){const u=grainURL();if(u){gr.style.backgroundImage='url('+u+')';gr.style.opacity=String(G.grain*(reduced()?.5:1));}}else gr.style.opacity='0';}
function frame(){try{stats.frames++;const G=GRADE[prefs.horror];if(!G||!layer||!live()){if(layer&&!live())part('pulse').style.opacity='0';return;}
 if(lastGradeKey.split('|')[3]!==String(lowFx())||stats.frames%90===0)applyGrade(true);
 // 영웅 불빛 원: 영웅 주변은 밝게, 바깥은 어둡게
 const pool=part('pool'),s=stageEl();if(prefs.lightPool&&typeof project==='function'&&s){const q=project(player.x,player.y),r=s.getBoundingClientRect(),c=document.getElementById('game'),cr=c?.getBoundingClientRect?.()||r,
  sx=(cr.width/(c?.width||cr.width))*(typeof dpr==='number'?dpr:1)||1,px=cr.left-r.left+q.x*(sx||1),py=cr.top-r.top+(q.y-40)*(sx||1),rad=Math.max(160,Math.min(r.width,r.height)*.42);
  pool.style.background='radial-gradient(circle '+Math.round(rad*1.6)+'px at '+Math.round(px)+'px '+Math.round(py)+'px,rgba(0,0,0,0) 0,rgba(0,0,0,0) '+Math.round(rad*.55)+'px,rgba(3,2,8,'+G.pool+') 100%)';}else pool.style.background='none';
 // 필름 그레인: 매 프레임 위치만 흔든다
 const gr=part('grain');if(gr.style.opacity!=='0'&&!reduced()){gr.style.transform='translate('+((Math.random()*20-10)|0)+'%,'+((Math.random()*20-10)|0)+'%)';}
 // 체력이 낮으면 붉은 맥박
 const hpK=player.maxHp>0?player.hp/player.maxHp:(typeof maxHP==='function'?player.hp/Math.max(1,maxHP()):1),low=hpK<.3&&player.hp>0;pulse=low?(pulse+.06)%TAU:0;
 const pl=part('pulse');if(low){const a=(.18+.14*Math.sin(pulse*2))*(reduced()?.5:1);pl.style.background='radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 40%,rgba(120,0,10,'+a.toFixed(3)+') 100%)';pl.style.opacity='1';}else pl.style.opacity='0';
 // 보스와 맞붙는 순간 레터박스
 const t=performance.now();if(prefs.letterbox&&room.engaged){const boss=(room.enemies||[]).find(e=>e&&(e.boss||e.midboss)&&e.hp>0&&e.spawnState==='active');if(boss&&!bossSeen.has(boss)){bossSeen.add(boss);letterUntil=t+2500;stats.letterboxes++;}}
 const bar=t<letterUntil?Math.round((s?.clientHeight||600)*.09)+'px':'0';part('top').style.height=bar;part('bot').style.height=bar;
}catch(e){fail(e);}}
function loop(){frame();requestAnimationFrame(loop);}

// ---- ③ 설정 → 간이설정 → 세부설정 ------------------------------------------------------------------------
const PRESETS={low:{lowFx:true,horror:'low',grain:false},mid:{lowFx:false,horror:'mid',grain:true},high:{lowFx:false,horror:'high',grain:true}};
const GROUPS=[['화면·그래픽',/카메라|화면|그래픽|밝기|품질|타일|바닥|조형물|나무|야외|세계|월드|world|retro|R89|R90|R91|R92|R93|R99/i],
 ['전투·이펙트',/전투|이펙트|타격|스킬|몹|보스|영웅|공명|VFX|R98|R100|R101|R102|R111|R113|R114/i],
 ['조작·모바일',/모바일|조작|터치|버튼|키/i],['협동·테스트',/협동|coop|테스트|진단|병원|test/i]];
function headingOf(el){const h=el.querySelector('h2,h3,h4,b,strong,legend,summary,.eyebrow');return(h?.textContent||el.id||'').trim().slice(0,40);}
const ID_GROUP=[[/R92Boss|R92Mobs|R98Combat|R98Vfx|R100|R101|R102$|R102Tier|R111|R113|R114/,'전투·이펙트'],[/mobile/i,'조작·모바일'],[/coop|hospitalTest|statusDiagnostics|Diagnostics/i,'협동·테스트'],[/retro|camera|visual|R89|R90|R91|R92|R93|R98World|R99|Props/i,'화면·그래픽']];
function groupOf(el){const id=el.id||'';for(const[re,name]of ID_GROUP)if(id&&re.test(id))return name;const txt=(el.id||'')+' '+headingOf(el)+' '+(el.textContent||'').slice(0,160);for(const[name,re]of GROUPS)if(re.test(txt))return name;return'기타';}
function chk(id,label,on){return'<label><input type="checkbox" id="'+id+'" '+(on?'checked':'')+'> '+label+'</label>';}
function quickHTML(){const cur=settings.lowFx?'low':prefs.horror==='high'?'high':'mid';
 return'<section id="quickSettingsR114" class="settings-r114"><h3 style="margin:.4em 0">간이설정</h3>'
 +'<div class="r114-row" role="radiogroup" aria-label="그래픽 품질">그래픽 품질 '+['low','mid','high'].map(k=>'<button type="button" data-r114-preset="'+k+'" aria-pressed="'+(cur===k)+'" class="'+(cur===k?'active':'')+'">'+({low:'낮음(가볍게)',mid:'보통',high:'높음'})[k]+'</button>').join(' ')+'</div>'
 +'<div class="r114-row" role="radiogroup" aria-label="호러 분위기">호러 분위기 '+LEVELS.map(k=>'<button type="button" data-r114-horror="'+k+'" aria-pressed="'+(prefs.horror===k)+'" class="'+(prefs.horror===k?'active':'')+'">'+LEVEL_KO[k]+'</button>').join(' ')+'</div>'
 +'<div class="r114-volumes"></div><div class="r114-toggles"></div>'
 +chk('r114Shadows','빛 방향 그림자',prefs.shadows)+chk('r114Grain','필름 그레인',prefs.grain)+chk('r114Pool','영웅 불빛(주변만 밝게)',prefs.lightPool)+chk('r114Letter','보스전 시네마 레터박스',prefs.letterbox)
 +'</section>';}
function detailHTML(){const C=window.__STORYWORLD_COMBAT_R114__,P113=window.__STORYWORLD_PLAY_R113__,P111=window.__STORYWORLD_PLAY_R111__;
 const rows=[];const add=(api,k,label)=>{if(api?.prefs){const p=api.prefs();if(typeof p[k]==='boolean')rows.push('<label><input type="checkbox" data-r114-api="'+(api===C?'c114':api===P113?'p113':'p111')+'" data-r114-key="'+k+'" '+(p[k]?'checked':'')+'> '+label+'</label>');}};
 add(C,'palette','몹·보스 스킬 고유색/보조색');add(C,'echo','환영 공격 기 모으기·대시');
 add(P113,'ranged','원거리 영웅 순간이동 금지');add(P113,'facing','전투 중 서로 바라보기');add(P113,'ground','조형물 접지·벽 간격');add(P113,'thrown','던진 물체 폭발');add(P113,'physics','기본 물리(밀림)');add(P113,'dust','발밑 먼지');
 if(P111?.prefs){const p=P111.prefs();for(const[k,v]of Object.entries(p))if(typeof v==='boolean')rows.push('<label><input type="checkbox" data-r114-api="p111" data-r114-key="'+k+'" '+(v?'checked':'')+'> R111 '+k+'</label>');}
 return rows.length?'<details class="r114-group"><summary>전투·연출(R111~R114)</summary><div class="settings">'+rows.join('')+'</div></details>':'';}
function restructure(){const panel=document.getElementById('panel');if(!panel||panel.querySelector('#quickSettingsR114'))return;const base=panel.querySelector('.settings');if(!base)return;
 const h2=panel.querySelector('h2');if(h2)h2.textContent='설정';
 const quick=document.createElement('div');quick.innerHTML=quickHTML();const q=quick.firstElementChild;base.parentNode.insertBefore(q,base);
 // 기본 음량 슬라이더와 주요 켜고 끄기(효과음·배경 음악·서사 음성·흔들림 줄이기)를 간이설정으로 옮긴다.
 const vol=q.querySelector('.r114-volumes'),tog=q.querySelector('.r114-toggles');
 for(const el of [...base.querySelectorAll('[data-volume]')])vol.appendChild(el.closest('label')||el);
 for(const k of ['sound','music','narration','reducedMotion']){const el=base.querySelector('[data-setting="'+k+'"]');if(el)tog.appendChild(el.closest('label')||el);}
 // 나머지 전부 → 세부설정
 const det=document.createElement('details');det.id='detailSettingsR114';det.innerHTML='<summary style="cursor:pointer;font-weight:bold;margin:.6em 0">세부설정</summary>';
 const sections=[...panel.children].filter(el=>el!==q&&el!==det&&el.id!=='settingsClose'&&!el.matches('h2,.eyebrow,.close'));
 const groups=new Map();const groupEl=name=>{if(!groups.has(name)){const g=document.createElement('details');g.className='r114-group';g.innerHTML='<summary>'+name+'</summary>';groups.set(name,g);}return groups.get(name);};
 for(const el of sections){const name=el===base?'기본 화면·소리':el.tagName==='P'?'안내':groupOf(el);groupEl(name).appendChild(el);stats.moved++;}
 const order=['기본 화면·소리','화면·그래픽','전투·이펙트','조작·모바일','협동·테스트','기타','안내'];
 for(const n of order)if(groups.has(n))det.appendChild(groups.get(n));for(const[n,g]of groups)if(!order.includes(n))det.appendChild(g);
 det.insertAdjacentHTML('beforeend',detailHTML());panel.appendChild(det);
 if(!document.getElementById('cinemaR114Style')){const st=document.createElement('style');st.id='cinemaR114Style';st.textContent='#quickSettingsR114 .r114-row{margin:.35em 0;display:flex;flex-wrap:wrap;gap:.35em;align-items:center}#quickSettingsR114 button{min-height:34px;padding:.25em .7em;border:1px solid #8a6b3c;background:#1b1612;color:#e8dcc4;border-radius:8px}#quickSettingsR114 button.active{background:#6a3a20;border-color:#d8a050;color:#fff}#quickSettingsR114 label{display:flex;gap:.4em;align-items:center;margin:.2em 0}.r114-group{margin:.3em 0;border:1px solid #3b3128;border-radius:8px;padding:.25em .5em}.r114-group>summary{cursor:pointer;padding:.2em 0}';document.head.appendChild(st);}
 // 동작
 q.querySelectorAll('[data-r114-preset]').forEach(b=>b.onclick=()=>{const P=PRESETS[b.dataset.r114Preset];settings.lowFx=P.lowFx;set({horror:P.horror,grain:P.grain});try{resize?.();saveGame?.(false);}catch(_){}reopen();});
 q.querySelectorAll('[data-r114-horror]').forEach(b=>b.onclick=()=>{set({horror:b.dataset.r114Horror});reopen();});
 const bind=(id,k)=>{const el=q.querySelector('#'+id);if(el)el.onchange=()=>set({[k]:el.checked});};bind('r114Shadows','shadows');bind('r114Grain','grain');bind('r114Pool','lightPool');bind('r114Letter','letterbox');
 det.querySelectorAll('[data-r114-api]').forEach(el=>el.onchange=()=>{const api={c114:window.__STORYWORLD_COMBAT_R114__,p113:window.__STORYWORLD_PLAY_R113__,p111:window.__STORYWORLD_PLAY_R111__}[el.dataset.r114Api];try{api?.set?.({[el.dataset.r114Key]:el.checked});}catch(e){fail(e);}});
 stats.settingsBuilt++;}
function reopen(){try{showSettings();}catch(e){fail(e);}}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{restructure();}catch(e){fail(e);}return r;};}

try{applyGrade(true);requestAnimationFrame(loop);}catch(e){fail(e);}
window.__STORYWORLD_CINEMA_R114__=Object.freeze({revision:REV,set,prefs:()=>({...prefs}),castDir,stats:()=>({...stats,failures,lastError}),applyGrade});
})();
