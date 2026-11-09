// R182 — 시야 세 모드(사용자 2026-11-01 "손전등 시야, 원형(횃불) 시야 두 가지 모드로 나눠줘" + "횃불도 켤 때만이고 보통은 환한, 모두 보이는 시야 상태가 기본").
//  · 전체(기본): 시야 제한 없음(R24 둘레 시야 끔). 사몽 미로·어두운 구역도 손전등을 억지로 켜지 않는다.
//  · 횃불: 영웅 둘레 원형 빛 — 본편은 R24 둘레 시야(벽이 가림), 사몽 미로·어두운 구역은 samong-r103 빛을 원형으로.
//  · 손전등: 움직이는 쪽 부채꼴 빛 — 사몽 미로·어두운 구역은 기존 부채꼴, 본편은 둘레 시야 위에 부채꼴 밖을 어둡게.
//  환경 설정 창의 '시야' 고르기, L 키(전체 → 횃불 → 손전등 → 전체)로 바꾼다. 저장된 R58 시야 값(flashlight58)은 이 모드에 맞춰 둔다.
(()=>{'use strict';
if(window.__STORYWORLD_LIGHT_R182__)return;
const REV='R335-light-7',KEY='storyworld.r182.light',MODES=['glow','auto','full','torch','flashlight'],NAME={glow:'은은한 원형(주변 밝고 멀수록 어둡게)',auto:'자동(미로만 횃불·손전등)',full:'전체(환하게)',torch:'횃불(원형)',flashlight:'손전등(부채꼴)'};
/* R254(사용자 2026-11-03 "미로맵만 횃불or손전등시야(시대상에맞게)이고 나머지상황은 모두전체보이는시야"): 기본은 '자동' — 미로 구역에서만 시대에 맞춰
   (현대·기계 = 손전등, 그 밖 = 횃불) 빛을 쓰고, 나머지는 모두 전체 시야. 예전에 저장된 값은 한 번 '자동'으로 옮긴다(v:254). 직접 고르면 그대로 따른다. */
/* R335(사용자 2026-11-05 "플레이어 주변 밝고 멀수록 어두운 거 좋은 것 같아 이걸 기본으로"): 기본을 새 '은은한 원형(glow)'으로.
   횃불은 반경 5칸 밖이 86% 어둠이라 화면 밖 적이 안 보여 전투에 불리했다 → glow 는 시야 제한(R24)을 끄고(모두 보임) 영웅 둘레만 밝게, 멀수록 부드럽게 어둡게(가장자리 약 60%).
   예전 기본값 '자동'으로 저장돼 있던 것은 한 번 glow 로 옮기고(v:335), 사용자가 직접 고른 전체·횃불·손전등은 그대로 둔다. */
let prefs={mode:'glow',v:335};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(s.v===335&&MODES.includes(s.mode))prefs.mode=s.mode;else if(s.v===254&&MODES.includes(s.mode)&&s.mode!=='auto')prefs.mode=s.mode;}catch(_){}
const stats={toggles:0,coneFrames:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
function inMaze(){try{if(typeof room==='undefined'||!room)return false;const x=room.samongR103;if(x){if(x.stage==='maze')return true;const z=window.__STORYWORLD_SAMONG_ZONES_R115__?.zone?.(x.zone);return z?.kind==='maze';}
  return !!(room.exploration?.mazeR72||room.exploration?.maze||/미로/.test(String(room.exploration?.name||'')));}catch(_){return false;}}
const MODERN_STYLE=/clinical|domestic|urban|school|hospital|hotel|office|modern|city|subway|station/i;
function mazeLight(){try{const era=window.__STORYWORLD_ERA_R191__?.eraOf?.(room);if(era==='tech'||era==='modern')return 'flashlight';const x=room?.samongR103,z=x&&window.__STORYWORLD_SAMONG_ZONES_R115__?.zone?.(x.zone);
  if(MODERN_STYLE.test(String(z?.style||''))||MODERN_STYLE.test(String(room?.exploration?.worldR74?.style||room?.exploration?.backgroundTheme||'')))return 'flashlight';}catch(_){}return 'torch';}
const mode=()=>prefs.mode==='auto'?(inMaze()?mazeLight():'full'):prefs.mode;
function apply(){try{if(typeof settings==='undefined'||!settings)return;const want=mode()!=='full'&&mode()!=='glow';/* R185: 사몽 안에서 '전체'→횃불/손전등으로 바꿔도 바로 R24 시야를 켠다(예전에는 다음 구역까지 기다림 — Codex 리뷰) */
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
function want(){try{if(mode()==='full'||typeof started==='undefined'||!started||typeof player==='undefined'||!player||typeof room==='undefined'||!room)return false;if(typeof modal!=='undefined'&&modal)return false;if(mode()==='glow')return !(room.samongR103&&document.getElementById('r103Flashlight')?.style.display==='block');/* R335 은은한 원형은 시야 제한과 상관없이 그린다 */if(room.samongR103&&document.getElementById('r103Flashlight')?.style.display==='block')return false;/* 사몽 미로·어두운 구역은 samong-r103 이 그린다 — R187: 그 밖의 사몽 구역(전투·생존)은 여기서 부채꼴을 그린다(예전엔 손전등이 횃불과 똑같이 보임) */return settings?.flashlight58!==false&&window.__STORYWORLD_SIGHT24__?.enabled===true;}catch(_){return false;}}
const blockedAt=(x,y)=>{try{return typeof blocked==='function'?blocked(x,y,.02,room):false;}catch(_){return false;}};
function ray(ox,oy,a,max){const dx=Math.cos(a),dy=Math.sin(a);for(let t=.2;t<max;t+=.2)if(blockedAt(ox+dx*t,oy+dy*t))return t;return max;}
function frame(){try{if(!want()){hide();return;}const c=canvas();if(!c)return;c.style.display='block';const b=c.parentElement.getBoundingClientRect(),dp=Math.min(2,devicePixelRatio||1);
  if(c.width!==Math.round(b.width*dp)||c.height!==Math.round(b.height*dp)){c.width=Math.round(b.width*dp);c.height=Math.round(b.height*dp);}
  const g=c.getContext('2d');g.setTransform(dp,0,0,dp,0,0);g.clearRect(0,0,b.width,b.height);
  if(mode()==='torch'){torch(g,b);return;}
  if(mode()==='glow'){glow(g,b);return;}
  const mv={x:player.moveVX150||0,y:player.moveVY150||0};if(Math.hypot(mv.x,mv.y)>.05){const l=Math.hypot(mv.x,mv.y);dir={x:mv.x/l,y:mv.y/l};}
  else if(player.direction){const w={front:[1,1],back:[-1,-1],left:[-1,1],right:[1,-1]}[player.direction];if(w)dir={x:w[0]/Math.SQRT2,y:w[1]/Math.SQRT2};}
  /* R187: 멈춰 선 채 부채꼴이 벽에 막히면(samong-r103 와 같이) 가장 멀리 트인 쪽으로 돌린다 */
  if(Math.hypot(mv.x,mv.y)<=.05&&ray(player.x,player.y,Math.atan2(dir.y,dir.x),3)<2.2){let best=0,ba=0;for(let k=0;k<16;k++){const a=k*Math.PI/8,t=ray(player.x,player.y,a,9);if(t>best){best=t;ba=a;}}dir={x:Math.cos(ba),y:Math.sin(ba)};}
  const a0=Math.atan2(dir.y,dir.x),half=1.0,reach=Math.max(7,window.__STORYWORLD_SIGHT24__?.geometry?.()?.radius||10),o=project(player.x,player.y),U=(typeof TILE==='number'?TILE:34)*(typeof zoom==='number'?zoom:1),pts=[];
  for(let k=0;k<=24;k++){const a=a0-half+2*half*k/24,t=ray(player.x,player.y,a,reach);pts.push(project(player.x+Math.cos(a)*t,player.y+Math.sin(a)*t));}
  g.fillStyle='rgba(3,3,7,.62)';g.fillRect(0,0,b.width,b.height);g.globalCompositeOperation='destination-out';
  const gr=g.createRadialGradient(o.x,o.y,4,o.x,o.y,reach*U);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.8,'rgba(0,0,0,.95)');gr.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=gr;g.beginPath();g.moveTo(o.x,o.y);for(const p of pts)g.lineTo(p.x,p.y);g.closePath();g.fill();
  const near=2.2*U,n=g.createRadialGradient(o.x,o.y-14*(zoom||1),2,o.x,o.y-14*(zoom||1),near);n.addColorStop(0,'rgba(0,0,0,.95)');n.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=n;g.beginPath();g.arc(o.x,o.y-14*(zoom||1),near,0,Math.PI*2);g.fill();
  g.globalCompositeOperation='source-over';g.fillStyle='rgba(255,226,170,.05)';g.beginPath();g.moveTo(o.x,o.y);for(const p of pts)g.lineTo(p.x,p.y);g.closePath();g.fill();stats.coneFrames++;}catch(e){fail(e);}}
// R335 은은한 원형: 시야 제한 없이 영웅 둘레만 밝고 멀수록 어둡게(벽에 막히지 않는 부드러운 비네트). 가장자리 어둠 GLOW_EDGE, 완전히 밝은 반경 GLOW_IN 칸, 다 어두워지는 반경 GLOW_OUT 칸.
const GLOW_IN=4.5,GLOW_OUT=13,GLOW_EDGE=.6;
function glow(g,b){const o=project(player.x,player.y),U=(typeof TILE==='number'?TILE:34)*(typeof zoom==='number'?zoom:1),rx=GLOW_OUT*U*Math.SQRT2,cy=o.y-12*(typeof zoom==='number'?zoom:1);
 let edge=GLOW_EDGE;try{edge=window.__STORYWORLD_LOCAL_LIGHT_R451__?.glowEdge?.(GLOW_EDGE)??GLOW_EDGE;}catch(e){fail(e);}/* R451: 국지 조명이 빛을 맡으면 가장자리 어둠을 가볍게(모양은 그대로) */
 g.fillStyle='rgba(2,2,7,'+edge+')';g.fillRect(0,0,b.width,b.height);g.globalCompositeOperation='destination-out';
 const gr=g.createRadialGradient(o.x,cy,0,o.x,cy,rx),k=GLOW_IN/GLOW_OUT;gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(k,'rgba(0,0,0,1)');gr.addColorStop(k+(1-k)*.45,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');
 g.fillStyle=gr;g.save();g.translate(o.x,cy);g.scale(1,.62);g.translate(-o.x,-cy);/* 눌린 좌표계에서 화면 전체(0~H)를 덮도록 역변환한 사각형 — 위쪽 띠가 비지 않게(Codex 리뷰) */g.fillRect(0,cy-cy/.62,b.width,b.height/.62+2);g.restore();
 try{window.__STORYWORLD_LOCAL_LIGHT_R451__?.glowHoles?.(g);}catch(e){fail(e);}/* R451: 먼 등불은 원형 어둠 속에서도 보이게 */
 g.globalCompositeOperation='source-over';const w=g.createRadialGradient(o.x,cy,0,o.x,cy,GLOW_IN*U*1.3);w.addColorStop(0,'rgba(255,222,170,.06)');w.addColorStop(1,'rgba(255,222,170,0)');g.fillStyle=w;g.fillRect(0,0,b.width,b.height);stats.glowFrames=(stats.glowFrames||0)+1;}
/* R208 횃불: 사용자 2026-11-01 "횃불시야(스포트라이트)모드하면 플레이어 주변부만 원형으로 확실하게 잘보이게".
   R24 둘레 시야는 반지름이 화면만 해서(8~18칸) 원이 안 보였고, R100 이 시야 밖을 32~58% 밝기로만 낮춰 흐릿했다.
   → 화면 위에 어둠(86%)을 깔고 영웅 둘레 TORCH_R 칸 원(벽에 막히면 그 자리까지)만 뚫는다. 가장자리는 바깥 25%만 부드럽게. 따뜻한 불빛을 살짝. */
const TORCH_R=5.2,TORCH_N=56;let tk='',tr=[];
function torchRays(){const k=Math.round(player.x*8)+','+Math.round(player.y*8)+','+(room.id||'');if(k===tk)return tr;tk=k;tr=[];for(let i=0;i<TORCH_N;i++){const a=i*Math.PI*2/TORCH_N;const t=ray(player.x,player.y,a,TORCH_R);tr.push([a,t<TORCH_R?Math.min(TORCH_R,t+.75):t]);/* 막힌 곳은 벽면이 보이도록 .75칸 더 */}return tr;}
function torch(g,b){const o=project(player.x,player.y),U=(typeof TILE==='number'?TILE:34)*(typeof zoom==='number'?zoom:1),flick=1+.025*Math.sin((typeof time==='number'?time:0)*7.3)+.015*Math.sin((typeof time==='number'?time:0)*13.1),R=TORCH_R*flick;
 const pts=torchRays().map(([a,t])=>project(player.x+Math.cos(a)*t*flick,player.y+Math.sin(a)*t*flick));
 g.fillStyle='rgba(2,2,6,.86)';g.fillRect(0,0,b.width,b.height);g.globalCompositeOperation='destination-out';
 // 바닥 원은 2:1 마름모 투영이라 화면에서 타원 — 반지름은 화면 가로 기준(R·U·√2)
 const rx=R*U*Math.SQRT2,gr=g.createRadialGradient(o.x,o.y,0,o.x,o.y,rx);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.72,'rgba(0,0,0,1)');gr.addColorStop(.9,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');
 g.save();g.translate(o.x,o.y);g.scale(1,.5);g.translate(-o.x,-o.y);g.fillStyle=gr;g.restore();
 g.save();g.beginPath();g.moveTo(o.x,o.y);for(const p of pts)g.lineTo(p.x,p.y);g.closePath();g.clip();g.translate(o.x,o.y);g.scale(1,.5);g.translate(-o.x,-o.y);g.fillStyle=gr;g.fillRect(o.x-rx,o.y-rx,2*rx,2*rx);g.restore();
 // 영웅 몸(위로 솟은 부분)도 밝게
 const hy=o.y-22*(typeof zoom==='number'?zoom:1),hn=g.createRadialGradient(o.x,hy,2,o.x,hy,1.6*U);hn.addColorStop(0,'rgba(0,0,0,1)');hn.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=hn;g.beginPath();g.arc(o.x,hy,1.6*U,0,Math.PI*2);g.fill();
 g.globalCompositeOperation='source-over';const w=g.createRadialGradient(o.x,o.y,0,o.x,o.y,rx);w.addColorStop(0,'rgba(255,190,110,.10)');w.addColorStop(1,'rgba(255,150,70,0)');
 g.save();g.translate(o.x,o.y);g.scale(1,.5);g.translate(-o.x,-o.y);g.fillStyle=w;g.beginPath();g.arc(o.x,o.y,rx,0,Math.PI*2);g.fill();g.restore();stats.torchFrames=(stats.torchFrames||0)+1;}
let applyAt=0;(function loop(t){try{if(!(t-applyAt<500)){applyAt=t||0;const m=mode(),w=m!=='full'&&m!=='glow';/* R335: glow 도 full 처럼 R24 시야를 끈다(모바일 기본 flashlight58=true 포함 — Codex 리뷰) */if(typeof settings!=='undefined'&&settings&&(settings.flashlight58!==false)!==w)apply();}frame();}catch(e){fail(e);}requestAnimationFrame(loop);})(0);
window.__STORYWORLD_LIGHT_R182__=Object.freeze({revision:REV,MODES,mode,choice:()=>prefs.mode,inMaze,mazeLight,set,toggle,apply,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
