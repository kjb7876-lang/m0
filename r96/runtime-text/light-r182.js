// R182 — 시야 세 모드(사용자 2026-11-01 "손전등 시야, 원형(횃불) 시야 두 가지 모드로 나눠줘" + "횃불도 켤 때만이고 보통은 환한, 모두 보이는 시야 상태가 기본").
//  · 전체(기본): 시야 제한 없음(R24 둘레 시야 끔). 사몽 미로·어두운 구역도 손전등을 억지로 켜지 않는다.
//  · 횃불: 영웅 둘레 원형 빛 — 본편은 R24 둘레 시야(벽이 가림), 사몽 미로·어두운 구역은 samong-r103 빛을 원형으로.
//  · 손전등: 움직이는 쪽 부채꼴 빛 — 사몽 미로·어두운 구역은 기존 부채꼴, 본편은 둘레 시야 위에 부채꼴 밖을 어둡게.
//  환경 설정 창의 '시야' 고르기, L 키(전체 → 횃불 → 손전등 → 전체)로 바꾼다. 저장된 R58 시야 값(flashlight58)은 이 모드에 맞춰 둔다.
(()=>{'use strict';
if(window.__STORYWORLD_LIGHT_R182__)return;
const REV='R182-light-1',KEY='storyworld.r182.light',MODES=['full','torch','flashlight'],NAME={full:'전체(환하게)',torch:'횃불(원형)',flashlight:'손전등(부채꼴)'};
let prefs={mode:'full'};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(MODES.includes(s.mode))prefs.mode=s.mode;}catch(_){}
const stats={toggles:0,coneFrames:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const mode=()=>prefs.mode;
function apply(){try{if(typeof settings==='undefined'||!settings)return;const want=prefs.mode!=='full';/* R185: 사몽 안에서 '전체'→횃불/손전등으로 바꿔도 바로 R24 시야를 켠다(예전에는 다음 구역까지 기다림 — Codex 리뷰) */
  if((settings.flashlight58!==false)!==want){settings.flashlight58=want;window.__STORYWORLD_SIGHT24__?.refresh?.();}document.getElementById('stage')?.classList.toggle('flashlight-black-r58',want);}catch(e){fail(e);}}
function set(p){if(MODES.includes(p?.mode))prefs.mode=p.mode;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}apply();return{...prefs};}
function toggle(){set({mode:MODES[(MODES.indexOf(prefs.mode)+1)%MODES.length]});stats.toggles++;try{if(typeof toast==='function')toast('시야: '+NAME[prefs.mode],1.6);}catch(_){}}
// ---- 설정 창 ----
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{const grid=document.querySelector('#panel .settings')||document.querySelector('.settings');if(grid&&!document.getElementById('lightModeR182')){const label=document.createElement('label');label.textContent='시야 ';const sel=document.createElement('select');sel.id='lightModeR182';
   for(const m of MODES){const o=document.createElement('option');o.value=m;o.textContent=NAME[m];if(m===prefs.mode)o.selected=true;sel.appendChild(o);}sel.onchange=()=>{set({mode:sel.value});stats.toggles++;};label.appendChild(sel);
   const hint=document.createElement('span');hint.className='small muted';hint.textContent=' (L 키로 바꿈)';label.appendChild(hint);grid.appendChild(label);}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
addEventListener('keydown',e=>{try{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;if((e.key==='l'||e.key==='L'||e.code==='KeyL')&&!(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))&&typeof started!=='undefined'&&started&&!(typeof modal!=='undefined'&&modal))toggle();}catch(err){fail(err);}});
// ---- 본편 손전등: 둘레 시야 위에 부채꼴 밖을 어둡게 ----
let cv=null,dir={x:1,y:1};
function canvas(){if(cv?.isConnected)return cv;const st=document.getElementById('stage');if(!st)return null;cv=document.createElement('canvas');cv.id='r182Cone';cv.setAttribute('aria-hidden','true');cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3';st.appendChild(cv);return cv;}
function hide(){if(cv&&cv.style.display!=='none'){cv.style.display='none';cv.width=0;cv.height=0;}}
function want(){try{if(prefs.mode!=='flashlight'||typeof started==='undefined'||!started||typeof player==='undefined'||!player||typeof room==='undefined'||!room)return false;if(typeof modal!=='undefined'&&modal)return false;if(room.samongR103)return false;/* 사몽은 samong-r103 이 그린다 */return settings?.flashlight58!==false&&window.__STORYWORLD_SIGHT24__?.enabled===true;}catch(_){return false;}}
const blockedAt=(x,y)=>{try{return typeof blocked==='function'?blocked(x,y,.02,room):false;}catch(_){return false;}};
function ray(ox,oy,a,max){const dx=Math.cos(a),dy=Math.sin(a);for(let t=.2;t<max;t+=.2)if(blockedAt(ox+dx*t,oy+dy*t))return t;return max;}
function frame(){try{if(!want()){hide();return;}const c=canvas();if(!c)return;c.style.display='block';const b=c.parentElement.getBoundingClientRect(),dp=Math.min(2,devicePixelRatio||1);
  if(c.width!==Math.round(b.width*dp)||c.height!==Math.round(b.height*dp)){c.width=Math.round(b.width*dp);c.height=Math.round(b.height*dp);}
  const g=c.getContext('2d');g.setTransform(dp,0,0,dp,0,0);g.clearRect(0,0,b.width,b.height);
  const mv={x:player.moveVX150||0,y:player.moveVY150||0};if(Math.hypot(mv.x,mv.y)>.05){const l=Math.hypot(mv.x,mv.y);dir={x:mv.x/l,y:mv.y/l};}
  else if(player.direction){const w={front:[1,1],back:[-1,-1],left:[-1,1],right:[1,-1]}[player.direction];if(w)dir={x:w[0]/Math.SQRT2,y:w[1]/Math.SQRT2};}
  const a0=Math.atan2(dir.y,dir.x),half=1.0,reach=Math.max(7,window.__STORYWORLD_SIGHT24__?.geometry?.()?.radius||10),o=project(player.x,player.y),U=(typeof TILE==='number'?TILE:34)*(typeof zoom==='number'?zoom:1),pts=[];
  for(let k=0;k<=24;k++){const a=a0-half+2*half*k/24,t=ray(player.x,player.y,a,reach);pts.push(project(player.x+Math.cos(a)*t,player.y+Math.sin(a)*t));}
  g.fillStyle='rgba(3,3,7,.62)';g.fillRect(0,0,b.width,b.height);g.globalCompositeOperation='destination-out';
  const gr=g.createRadialGradient(o.x,o.y,4,o.x,o.y,reach*U);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.8,'rgba(0,0,0,.95)');gr.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=gr;g.beginPath();g.moveTo(o.x,o.y);for(const p of pts)g.lineTo(p.x,p.y);g.closePath();g.fill();
  const near=2.2*U,n=g.createRadialGradient(o.x,o.y-14*(zoom||1),2,o.x,o.y-14*(zoom||1),near);n.addColorStop(0,'rgba(0,0,0,.95)');n.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=n;g.beginPath();g.arc(o.x,o.y-14*(zoom||1),near,0,Math.PI*2);g.fill();
  g.globalCompositeOperation='source-over';g.fillStyle='rgba(255,226,170,.05)';g.beginPath();g.moveTo(o.x,o.y);for(const p of pts)g.lineTo(p.x,p.y);g.closePath();g.fill();stats.coneFrames++;}catch(e){fail(e);}}
let applyAt=0;(function loop(t){try{if(!(t-applyAt<500)){applyAt=t||0;if(prefs.mode==='full'&&typeof settings!=='undefined'&&settings?.flashlight58!==false&&!(typeof room!=='undefined'&&room?.samongR103))apply();else if(prefs.mode!=='full'&&typeof settings!=='undefined'&&settings?.flashlight58===false)apply();}frame();}catch(e){fail(e);}requestAnimationFrame(loop);})(0);
window.__STORYWORLD_LIGHT_R182__=Object.freeze({revision:REV,MODES,mode,set,toggle,apply,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
