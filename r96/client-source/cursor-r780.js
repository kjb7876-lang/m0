// R780 스토리월드풍 마우스 포인터 — 사용자 2026-11-11 "마우스 포인터 롤처럼 느낌있게 참조해서 스토리월드풍으로 녹여내셈 지정상호작용도".
//  전: 게임 화면(#game) 위 커서는 언제나 브라우저 십자선(crosshair) 하나 — 적·사람·상자·바닥 어디에 대도 같은 모양이라 클릭하면 무슨 일이 날지 읽히지 않았다.
//  후: 다른 게임(AOS)처럼 '가리키는 대상에 따라 커서가 바뀌고, 클릭하면 바닥에 짧은 표시가 남는' 방식만 빌리고, 그림은 이 게임 것 — 실과 바늘(황금실·실 검무)·먹색 테두리·놋쇠 금빛.
//   · 바닥(이동) = 금실을 꿴 놋쇠 바늘 · 적(공격) = 붉은 실을 감은 가시 바늘 · 사람(대화) = 쪽지 · 문·상자·제단·출구(사용) = 호박색 등불
//     · 구슬·바닥 쪽지(줍기) = 기억 구슬 · 오른쪽 단추 누름(조준) = 세 갈래 바늘 고리 · 막힌 벽 속(이동 불가) = 빛바랜 바늘 + 끊긴 고리 · 창·로딩·단추 = 맨 바늘.
//   · 적 판정은 엔진 클릭(index.html canvas pointerdown)과 같은 식 — 커서가 '공격'이면 그 자리 클릭도 그 적을 친다(교전 전 보스·죽은 적은 아님).
//   · 클릭 뒤 엔진이 낸 결과(route·command)를 읽어 표시: 이동 = 금실 고리가 조여듦, 공격 = 붉은 고리가 적 발밑을 따라감, 막힘 = 붉은 끊긴 고리, 조준 = 청록 고리.
//   · 가리키는 적 발밑에 붉은 실 고리, 사람·사물 발밑엔 금실 고리(롤의 대상 윤곽 대신 이 게임 바닥 표식처럼).
//  렉: 커서 그림은 처음 한 번만 그려 data URL 로(브라우저 하드웨어 커서라 지연 없음), style 은 상태가 바뀔 때만 쓴다.
//      대상 판정은 마우스가 움직였을 때 50ms 간격, 가만히 있으면 150ms 간격(몹이 커서 밑으로 걸어 들어오는 것). 표시가 없으면 겹 캔버스는 한 번 지우고 쉰다.
//  끄기: localStorage 'storyworld.r780.cursor' = 'off' 이면 엔진 십자선 그대로.
(function(){'use strict';
const W0=window;if(W0.__STORYWORLD_CURSOR_R780__)return;
let off=false;try{off=W0.localStorage?.getItem('storyworld.r780.cursor')==='off';}catch(_){}
const KINDS=['move','attack','talk','use','pickup','aim','blocked','ui'];
const HOT={aim:[16,16]};const FALLBACK={move:'default',attack:'pointer',talk:'pointer',use:'pointer',pickup:'pointer',aim:'crosshair',blocked:'not-allowed',ui:'default'};
const stats={lastClick:null,styleWrites:0,classifies:0,frames:0,draws:0,clicks:0,errors:0,lastError:null};
const fail=e=>{stats.errors++;stats.lastError=String(e&&e.message||e).slice(0,160);};
// ── 커서 그림(32×32) ─────────────────────────────────────────────
const INK='#120c0a',BRASS0='#f4e2b4',BRASS1='#c9a560',BRASS2='#7d5b2c';
function brass(c,x0,y0,x1,y1){const g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,BRASS0);g.addColorStop(.45,BRASS1);g.addColorStop(1,BRASS2);return g;}
function needle(c,s=1,tone='brass'){// 바늘 화살: 끝(2,2) — 가늘고 긴 몸 + 꼬리 쪽 바늘귀
 c.save();c.translate(2,2);c.scale(s,s);c.translate(-2,-2);
 const path=()=>{c.beginPath();c.moveTo(2,2);c.lineTo(2.6,21);c.lineTo(7.2,16.6);c.lineTo(11.2,25.4);c.lineTo(14.6,23.9);c.lineTo(10.7,15.2);c.lineTo(17,14.6);c.closePath();};
 path();c.lineJoin='round';c.lineWidth=3.2;c.strokeStyle=INK;c.stroke();
 path();c.fillStyle=tone==='dull'?(()=>{const g=c.createLinearGradient(2,2,14,24);g.addColorStop(0,'#bdb6aa');g.addColorStop(1,'#5d5850');return g;})():brass(c,2,2,14,24);c.fill();
 c.beginPath();c.moveTo(3.4,4.6);c.lineTo(3.8,17.4);c.lineWidth=1;c.strokeStyle=tone==='dull'?'#e6e0d4aa':'#fff6dccc';c.stroke();// 날 빛
 c.beginPath();c.ellipse(11.4,21.6,1.05,1.7,-.42,0,Math.PI*2);c.fillStyle=INK;c.fill();// 바늘귀
 c.restore();}
function thread(c,color,pts,w=1.6){c.beginPath();c.moveTo(pts[0],pts[1]);for(let i=2;i+3<pts.length;i+=4)c.quadraticCurveTo(pts[i],pts[i+1],pts[i+2],pts[i+3]);c.lineCap='round';c.lineWidth=w+1.6;c.strokeStyle=INK;c.stroke();c.lineWidth=w;c.strokeStyle=color;c.stroke();}
const DRAW={
 ui:c=>{needle(c);},
 move:c=>{needle(c);thread(c,'#f0c45a',[11.6,22.4,15,30,21,27.5,27,25,29,29.5]);c.beginPath();c.arc(29,29.5,1.2,0,Math.PI*2);c.fillStyle='#ffe7a0';c.fill();},
 attack:c=>{// 가시 바늘 단검: 붉게 달군 넓은 바늘날 + 한쪽 미늘 둘(뒤로 젖힘) + 붉은 실 감은 자루 + 바늘귀 고리 끝(가로대 없음 — 십자 모양을 만들지 않는다)
  c.lineCap='round';c.lineJoin='round';
  const blade=()=>{c.beginPath();c.moveTo(2,2);c.lineTo(19.6,13.2);c.lineTo(20.8,17.6);c.lineTo(17.6,20.8);c.lineTo(13.2,19.6);c.closePath();};
  blade();c.lineWidth=3.2;c.strokeStyle=INK;c.stroke();const g=c.createLinearGradient(2,2,20,20);g.addColorStop(0,'#ffe2d4');g.addColorStop(.3,'#ff7a5e');g.addColorStop(.75,'#c22a36');g.addColorStop(1,'#6e101c');blade();c.fillStyle=g;c.fill();
  c.beginPath();c.moveTo(3.6,3.4);c.lineTo(18.4,15.6);c.lineWidth=1;c.strokeStyle='#fff3ea';c.stroke();// 날 빛
  for(const [x,y] of [[9.6,8.6],[14.2,12.4]]){c.beginPath();c.moveTo(x,y);c.lineTo(x+1.2,y-3.4);c.lineTo(x+2.6,y+.9);c.closePath();c.lineWidth=2;c.strokeStyle=INK;c.stroke();c.fillStyle='#ff9a80';c.fill();}// 미늘(위쪽 한쪽만, 뒤로)
  c.beginPath();c.moveTo(19.4,19.4);c.lineTo(26.4,26.4);c.lineWidth=6;c.strokeStyle=INK;c.stroke();c.lineWidth=3.6;c.strokeStyle='#4a1418';c.stroke();
  for(let i=0;i<4;i++){const t=20.4+i*1.6;c.beginPath();c.moveTo(t-1.9,t+1.5);c.lineTo(t+1.5,t-1.9);c.lineWidth=1.2;c.strokeStyle='#ff4652';c.stroke();}
  c.beginPath();c.arc(28.2,28.2,2.6,0,Math.PI*2);c.lineWidth=3.2;c.strokeStyle=INK;c.stroke();c.lineWidth=1.5;c.strokeStyle=BRASS1;c.stroke();// 바늘귀 고리
  thread(c,'#e0303c',[25,27.4,22.4,31,18,30.4],1.1);},
 talk:c=>{needle(c,.72);// 쪽지: 양피지 한 장 + 접힌 귀 + 먹 글줄 + 붉은 봉인 실
  c.save();c.translate(17.5,19);c.rotate(.12);c.beginPath();c.moveTo(-8.5,-8);c.lineTo(5.5,-8);c.lineTo(8.5,-5);c.lineTo(8.5,7.5);c.lineTo(-8.5,7.5);c.closePath();
  c.lineWidth=2.6;c.strokeStyle=INK;c.stroke();const g=c.createLinearGradient(0,-8,0,8);g.addColorStop(0,'#f4ead6');g.addColorStop(1,'#cdb895');c.fillStyle=g;c.fill();
  c.beginPath();c.moveTo(5.5,-8);c.lineTo(5.5,-5);c.lineTo(8.5,-5);c.lineWidth=1;c.strokeStyle='#8a6a4a';c.stroke();
  for(const [y,w] of [[-4,9],[-.6,12],[2.8,8]]){c.beginPath();c.moveTo(-6,y);c.lineTo(-6+w,y);c.lineWidth=1.1;c.strokeStyle='#3a2a20';c.stroke();}
  c.beginPath();c.arc(5,5,1.8,0,Math.PI*2);c.fillStyle='#a3222e';c.fill();c.restore();},
 use:c=>{needle(c,.72);// 호박색 등불: 고리·뚜껑·불빛 유리
  c.save();c.translate(20,19);const glow=c.createRadialGradient(0,2,1,0,2,11);glow.addColorStop(0,'#ffcf6acc');glow.addColorStop(1,'#ff9a2a00');c.fillStyle=glow;c.beginPath();c.arc(0,2,11,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(0,-8.6,2.2,0,Math.PI*2);c.lineWidth=2.6;c.strokeStyle=INK;c.stroke();c.lineWidth=1.2;c.strokeStyle=BRASS1;c.stroke();
  c.beginPath();c.moveTo(-5.2,-4.6);c.lineTo(5.2,-4.6);c.lineTo(3.4,-6.8);c.lineTo(-3.4,-6.8);c.closePath();c.lineWidth=2.4;c.strokeStyle=INK;c.stroke();c.fillStyle=brass(c,0,-7,0,-4);c.fill();
  c.beginPath();c.moveTo(-4.6,-4.4);c.lineTo(4.6,-4.4);c.lineTo(4,7);c.lineTo(-4,7);c.closePath();c.lineWidth=2.6;c.strokeStyle=INK;c.stroke();
  const gl=c.createLinearGradient(0,-4,0,7);gl.addColorStop(0,'#ffe9a8');gl.addColorStop(.5,'#ffb54a');gl.addColorStop(1,'#c4601e');c.fillStyle=gl;c.fill();
  c.beginPath();c.moveTo(0,-1.8);c.quadraticCurveTo(2.4,1.6,0,4.4);c.quadraticCurveTo(-2.4,1.6,0,-1.8);c.fillStyle='#fffbe8';c.fill();
  c.beginPath();c.moveTo(-5.4,7.2);c.lineTo(5.4,7.2);c.lineWidth=3;c.strokeStyle=INK;c.stroke();c.lineWidth=1.6;c.strokeStyle=BRASS2;c.stroke();c.restore();},
 pickup:c=>{needle(c,.72);// 기억 구슬: 청록·금빛 구슬 + 반짝임, 바늘이 실로 걸어 올림
  thread(c,'#f0c45a',[9,17,13,13,18.5,14.5],1.1);
  c.save();c.translate(21,21);const g=c.createRadialGradient(-2,-2.4,.6,0,0,7.4);g.addColorStop(0,'#f4fff8');g.addColorStop(.35,'#9fe3d6');g.addColorStop(.8,'#2f8a8e');g.addColorStop(1,'#163c48');
  c.beginPath();c.arc(0,0,7,0,Math.PI*2);c.lineWidth=2.6;c.strokeStyle=INK;c.stroke();c.fillStyle=g;c.fill();c.lineWidth=1;c.strokeStyle=BRASS1;c.stroke();
  for(const [x,y,r] of [[7.6,-7,1.5],[-8,6,1]]){c.beginPath();c.moveTo(x-r*2,y);c.lineTo(x+r*2,y);c.moveTo(x,y-r*2);c.lineTo(x,y+r*2);c.lineWidth=1;c.strokeStyle='#fff3c4';c.stroke();}
  c.restore();},
 aim:c=>{// 실패 고리(십자·평화 표식 모양을 피함): 바깥 고리 + 둘레 여섯 바늘땀(육망성 자리) + 안쪽 가는 고리 + 가운데 붉은 점
  c.save();c.translate(16,16);c.lineCap='round';
  c.beginPath();c.arc(0,0,9.6,0,Math.PI*2);c.lineWidth=3.6;c.strokeStyle=INK;c.stroke();c.lineWidth=1.7;c.strokeStyle='#8fd8d4';c.stroke();
  c.beginPath();c.arc(0,0,9.6,-2.2,-1.2);c.lineWidth=1.6;c.strokeStyle='#e9fffb';c.stroke();
  for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6,ca=Math.cos(a),sa=Math.sin(a);c.beginPath();c.moveTo(ca*12,sa*12);c.lineTo(ca*14.6,sa*14.6);c.lineWidth=3.2;c.strokeStyle=INK;c.stroke();c.lineWidth=1.5;c.strokeStyle=BRASS0;c.stroke();}
  c.beginPath();c.arc(0,0,4.6,0,Math.PI*2);c.lineWidth=2.4;c.strokeStyle=INK;c.stroke();c.lineWidth=.9;c.strokeStyle='#cdeee9';c.stroke();
  c.beginPath();c.arc(0,0,1.8,0,Math.PI*2);c.fillStyle=INK;c.fill();c.beginPath();c.arc(0,0,1.1,0,Math.PI*2);c.fillStyle='#ff6a52';c.fill();c.restore();},
 blocked:c=>{needle(c,1,'dull');// 끊긴 고리
  c.save();c.translate(22.5,22.5);c.beginPath();c.arc(0,0,6.6,0,Math.PI*2);c.lineWidth=3.8;c.strokeStyle=INK;c.stroke();c.lineWidth=2;c.strokeStyle='#d8434b';c.stroke();
  c.beginPath();c.moveTo(-4.6,4.6);c.lineTo(4.6,-4.6);c.lineWidth=3.8;c.strokeStyle=INK;c.stroke();c.lineWidth=2;c.strokeStyle='#d8434b';c.stroke();c.restore();}};
const urls={};
function icon(kind){if(urls[kind])return urls[kind];try{const cv=document.createElement('canvas');cv.width=32;cv.height=32;const c=cv.getContext('2d');(DRAW[kind]||DRAW.ui)(c);urls[kind]=cv.toDataURL('image/png');}catch(e){fail(e);urls[kind]='';}return urls[kind];}
function css(kind){const u=icon(kind),h=HOT[kind]||[2,2];return u?'url("'+u+'") '+h[0]+' '+h[1]+', '+(FALLBACK[kind]||'default'):(FALLBACK[kind]||'default');}
// ── 대상 판정 ─────────────────────────────────────────────────
function live(){try{return !!(typeof started!=='undefined'?started:undefined)&&!(typeof modal!=='undefined'?modal:undefined)&&!(typeof loading!=='undefined'?loading:undefined)&&!(typeof storyScene!=='undefined'?storyScene:undefined)&&typeof (typeof project!=='undefined'?project:undefined)==='function';}catch(_){return false;}}
function enemyAt(x,y){// index.html canvas pointerdown 과 같은 식
 const LE=(typeof liveEnemies!=='undefined'?liveEnemies:undefined),P=(typeof project!=='undefined'?project:undefined),AH=(typeof actorHeight!=='undefined'?actorHeight:undefined);if(typeof LE!=='function')return null;let chosen=null,best=Infinity;
 for(const e of LE()){const q=P(e.x,e.y),h=AH()*(e.boss?2.05:1);if(Math.abs(x-q.x)<h*.48&&y>q.y-h&&y<q.y+9){const d=Math.hypot(x-q.x,y-(q.y-h*.5));if(d<best){chosen=e;best=d;}}}return chosen;}
const inBox=(x,y,q,w,h)=>Math.abs(x-q.x)<w/2&&y>q.y-h&&y<q.y+8;
function opened(p){try{return (W0.__STORYWORLD_GROWTH_R103__?.state?.()?.opened||[]).includes(p.chestR103);}catch(_){return false;}}
function propAt(x,y){const rm=(typeof room!=='undefined'?room:undefined),P=(typeof project!=='undefined'?project:undefined),ah=((typeof actorHeight!=='undefined'?actorHeight:undefined)||(()=>66))();if(!rm)return null;let best=null,bd=Infinity;
 const take=(kind,o,q,hit)=>{if(!hit)return;const d=Math.hypot(x-q.x,y-q.y);const rank={talk:0,pickup:1,use:2}[kind];const score=rank*1e4+d;if(score<bd){bd=score;best={kind,target:o};}};
 for(const p of rm.props||[]){if(!p||p.visible===false||p.destroyed||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;const q=P(p.x,p.y);
  if(p.r75NPC||p.r75NarrativeNPC||p.r75FortPerson)take('talk',p,q,inBox(x,y,q,ah*.62,ah*1.12));
  else if(p.r108Orb)take('pickup',p,q,Math.hypot(x-q.x,y-(q.y-6))<16);
  else if(p.r74Door)take('use',p,q,inBox(x,y,q,ah*.9,ah*1.5));
  else if(p.chestR103){if(!opened(p))take('use',p,q,inBox(x,y,q,ah*.7,ah*.7));}}
 try{const D=W0.__STORYWORLD_STORY_COLLECT_R177__?.inspect?.()?.docs?.();if(Array.isArray(D))for(const d of D){if(!Number.isFinite(d.x)||!Number.isFinite(d.y))continue;const q=P(d.x,d.y);take('pickup',{id:'doc:'+d.key,x:d.x,y:d.y},q,Math.hypot(x-q.x,y-(q.y-6))<16);}}catch(e){fail(e);}
 const obj=rm.objective;if(obj&&Number.isFinite(obj.x)){const q=P(obj.x,obj.y);take('use',obj,q,inBox(x,y,q,ah*.8,ah*1.2));}
 try{const def=(typeof regionById!=='undefined'?regionById:undefined)?.[(typeof zone!=='undefined'?zone:undefined)],EP=(typeof exitPoint!=='undefined'?exitPoint:undefined);if(def&&typeof EP==='function')for(const d of Object.keys(def.exits||{})){const e=EP(d);if(!e)continue;const q=P(e.x,e.y);take('use',{id:'exit:'+d,x:e.x,y:e.y},q,Math.hypot(x-q.x,y-(q.y-6))<28);}}catch(e){fail(e);}
 return best;}
function wallAt(x,y){// 벽·허공 속 깊숙이(그 점과 둘레 0.7칸이 모두 막힘)일 때만 — 벽 가장자리는 엔진 길찾기가 가까운 바닥으로 데려가므로 '이동'
 const B=(typeof blocked!=='undefined'?blocked:undefined),U=(typeof unproject!=='undefined'?unproject:undefined);if(typeof B!=='function'||typeof U!=='function')return false;const p=U(x,y);
 try{if(!B(p.x,p.y,.27))return false;for(let i=0;i<8;i++){const a=i*Math.PI/4;if(!B(p.x+Math.cos(a)*.7,p.y+Math.sin(a)*.7,.27))return false;}return true;}catch(e){fail(e);return false;}}
function classify(x,y,buttons=0){stats.classifies++;if(!live())return {kind:'ui',targetId:null,target:null};
 if(buttons&2)return {kind:'aim',targetId:null,target:null};
 const e=enemyAt(x,y);if(e)return {kind:'attack',targetId:e.id,target:e};
 const p=propAt(x,y);if(p)return {kind:p.kind,targetId:p.target.id??null,target:p.target};
 if(wallAt(x,y))return {kind:'blocked',targetId:null,target:null};
 return {kind:'move',targetId:null,target:null};}
// ── 상태·이벤트 ───────────────────────────────────────────────
const GC=document.getElementById?.('game')||null;
let hover=null,ptr=null,dirty=false,lastClassify=-1e9,lastNow=null,applied=null,overlay=null,octx=null,drewLast=false,rect=null,rectAt=-1e9;const markers=[];const MAX=6;let frozen=false;
const now=()=>{try{return W0.performance.now();}catch(_){return Date.now();}};
function canvasRect(){const t=now();if(!rect||t-rectAt>500){try{rect=GC.getBoundingClientRect();rectAt=t;}catch(_){rect={left:0,top:0};}}return rect;}
function applyCursor(kind){if(off||!GC)return;const v=css(kind);if(applied===v)return;applied=v;try{GC.style.cursor=v;stats.styleWrites++;}catch(e){fail(e);}}
function setupStyle(){if(off||!document.head||document.getElementById?.('r780Cursor'))return;try{const s=document.createElement('style');s.id='r780Cursor';
 s.textContent='html,body{cursor:'+css('ui')+'}button:not(:disabled),summary,a[href],label,select,[role=button],.card,.worldnode,#portrait,#navCompassR100,#r169Note,.skill{cursor:'+css('move')+'!important}button:disabled{cursor:'+css('blocked')+'!important}input[type=text],input:not([type]),textarea,[contenteditable=true]{cursor:text!important}';
 document.head.appendChild(s);}catch(e){fail(e);}}
function setupOverlay(){if(off||overlay)return;const stage=document.getElementById?.('stage');if(!stage)return;try{overlay=document.createElement('canvas');overlay.id='r780Marks';
 Object.assign(overlay.style,{position:'absolute',left:'0',top:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'3'});stage.appendChild(overlay);octx=overlay.getContext('2d');}catch(e){fail(e);overlay=null;}}
function local(ev){const r=canvasRect();return {x:ev.clientX-(r.left||0),y:ev.clientY-(r.top||0)};}
if(GC&&!off){
 GC.addEventListener('pointermove',ev=>{if(ev.pointerType&&ev.pointerType!=='mouse')return;const p=local(ev);ptr={x:p.x,y:p.y,buttons:ev.buttons|0};dirty=true;});
 GC.addEventListener('pointerleave',()=>{ptr=null;dirty=true;});
 // 엔진 클릭 판정이 끝난 뒤 결과를 읽는다 — window 거품 단계는 캔버스에 붙은 모든 리스너(엔진이 언제 붙였든) 다음에 온다
 W0.addEventListener('pointerdown',ev=>{try{if(ev.target!==GC||!live())return;const p=local(ev),U=(typeof unproject!=='undefined'?unproject:undefined),R=(typeof route!=='undefined'?route:undefined),C=(typeof command!=='undefined'?command:undefined);stats.clicks++;let m;
  if(ev.button===2){const w=U(p.x,p.y);m={kind:'aim',x:w.x,y:w.y,life:.6};}
  else if(C!=null&&C!==''){const e=((typeof room!=='undefined'?room:undefined)?.enemies||[]).find(e=>e.id===C);m={kind:'attack',targetId:C,x:e?.x??U(p.x,p.y).x,y:e?.y??U(p.x,p.y).y,big:!!e?.boss,life:.7};}
  else if(Array.isArray(R)&&R.length){const w=U(p.x,p.y);m={kind:'move',x:w.x,y:w.y,life:.55};}
  else{const w=U(p.x,p.y);m={kind:'blocked',x:w.x,y:w.y,life:.6};}
  m.age=0;markers.push(m);stats.lastClick={kind:m.kind,targetId:m.targetId??null};while(markers.length>MAX)markers.shift();
  if(ev.pointerType==='mouse'||!ev.pointerType){ptr={...local(ev),buttons:ev.button===2?2:1};dirty=true;}}catch(e){fail(e);}});
 GC.addEventListener('pointerup',ev=>{if(ptr&&(!ev.pointerType||ev.pointerType==='mouse')){ptr.buttons=ev.buttons|0;dirty=true;}});}
// ── 그리기 ────────────────────────────────────────────────────
function iso(c,q,rx,ry,a0=0,a1=Math.PI*2){c.beginPath();c.ellipse(q.x,q.y,rx,ry,0,a0,a1);}
function strokeTwice(c,color,w,alpha){c.globalAlpha=alpha;c.lineWidth=w+2.4;c.strokeStyle='#0c0807';c.stroke();c.lineWidth=w;c.strokeStyle=color;c.stroke();}
function drawMarker(c,m,P,tile){const k=m.age/m.life,a=Math.max(0,1-k),T=(typeof time!=='undefined'?time:undefined)||0;
 if(m.kind==='attack'){const e=m.targetId!=null?((typeof room!=='undefined'?room:undefined)?.enemies||[]).find(x=>x.id===m.targetId):null;if(e&&e.hp>0){m.x=e.x;m.y=e.y;}const q=P(m.x,m.y),r=tile*(m.big?1.1:.62)*(1.25-.35*Math.min(1,k*2));
  iso(c,q,r,r*.5);strokeTwice(c,'#ff5a4a',2,a);for(let i=0;i<3;i++){const ang=T*2.4+i*Math.PI*2/3,cx=Math.cos(ang),sy=Math.sin(ang);c.beginPath();c.moveTo(q.x+cx*r*1.25,q.y+sy*r*.62);c.lineTo(q.x+cx*r*.8,q.y+sy*r*.4);strokeTwice(c,'#ffb09a',1.4,a);}return;}
 const q=P(m.x,m.y);
 if(m.kind==='move'){const r=tile*(.62-.4*k);iso(c,q,r,r*.5);strokeTwice(c,'#f0c45a',1.8,a);for(let i=0;i<3;i++){const ang=-Math.PI/2+i*Math.PI*2/3,cx=Math.cos(ang),sy=Math.sin(ang);c.beginPath();c.moveTo(q.x+cx*(r+7),q.y+sy*(r+7)*.5);c.lineTo(q.x+cx*(r+1),q.y+sy*(r+1)*.5);strokeTwice(c,'#fff0c0',1.3,a);}
  iso(c,q,2.2,1.3);c.globalAlpha=a;c.fillStyle='#fff3c4';c.fill();return;}
 if(m.kind==='blocked'){const r=tile*.42,j=Math.sin(m.age*60)*2*(1-k);c.save();c.translate(j,0);for(let i=0;i<4;i++){iso(c,q,r,r*.5,i*Math.PI/2+.25,i*Math.PI/2+1.25);strokeTwice(c,'#d8434b',1.8,a);}c.restore();return;}
 if(m.kind==='aim'){const r=tile*(.3+.5*k);iso(c,q,r,r*.5);strokeTwice(c,'#8fd8d4',1.6,a);}}
function drawHover(c,h,P,tile){const t=h.target;if(!t||!Number.isFinite(t.x))return;const T=(typeof time!=='undefined'?time:undefined)||0,q=P(t.x,t.y),pulse=.75+.25*Math.sin(T*6);
 if(h.kind==='attack'){const ah=(typeof actorHeight==='function'?actorHeight():66),r=ah*(t.boss?.62:.36);iso(c,q,r,r*.5);strokeTwice(c,'#e0303c',1.8,.85*pulse);iso(c,q,r*.8,r*.4,Math.PI*.1,Math.PI*.9);strokeTwice(c,'#ff8a70',1,.6*pulse);return;}
 const ah=(typeof actorHeight==='function'?actorHeight():66),r=ah*(h.kind==='pickup'?.2:.34);iso(c,q,r,r*.5);strokeTwice(c,h.kind==='pickup'?'#9fe3d6':'#f0c45a',1.5,.8*pulse);}
function draw(dt){if(!overlay||!octx)return;const want=markers.length>0||(hover&&hover.target&&hover.kind!=='move'&&hover.kind!=='blocked'&&hover.kind!=='ui'&&hover.kind!=='aim');
 if(!want){if(drewLast){try{octx.setTransform(1,0,0,1,0,0);octx.clearRect(0,0,overlay.width,overlay.height);}catch(_){}drewLast=false;}return;}
 const dpr=Math.min(2,W0.devicePixelRatio||1),cw=GC.clientWidth||(typeof W!=='undefined'?W:undefined)||0,ch=GC.clientHeight||(typeof H!=='undefined'?H:undefined)||0,pw=Math.round(cw*dpr),ph=Math.round(ch*dpr);
 if(overlay.width!==pw||overlay.height!==ph){overlay.width=pw;overlay.height=ph;}
 const c=octx,P=(typeof project!=='undefined'?project:undefined);c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,overlay.width,overlay.height);c.setTransform(dpr,0,0,dpr,0,0);
 const a=P(0,0),b=P(1,1),tile=Math.max(8,Math.hypot(b.x-a.x,b.y-a.y)*.75);c.save();c.lineCap='round';
 try{if(hover&&live())drawHover(c,hover,P,tile);for(const m of markers)drawMarker(c,m,P,tile);}catch(e){fail(e);}c.restore();c.globalAlpha=1;drewLast=true;stats.draws++;}
function frame(t){try{const n=Number.isFinite(t)?t:now();const dt=lastNow==null?0:Math.min(.1,Math.max(0,(n-lastNow)/1000));lastNow=n;stats.frames++;
 if(!frozen)for(const m of markers)m.age+=dt;for(let i=markers.length-1;i>=0;i--)if(markers[i].age>=markers[i].life)markers.splice(i,1);
 const gap=dirty?50:150;if(n-lastClassify>=gap){if(ptr){if(dirty||hover){hover=classify(ptr.x,ptr.y,ptr.buttons);lastClassify=n;applyCursor(hover.kind);}}else if(hover||dirty){hover=null;lastClassify=n;applyCursor(live()?'move':'ui');}dirty=false;}
 if(!live()&&hover&&hover.kind!=='ui'){hover={kind:'ui',targetId:null,target:null};applyCursor('ui');}
 draw(dt);}catch(e){fail(e);}
 try{W0.requestAnimationFrame(frame);}catch(_){}}
if(!off){setupStyle();setupOverlay();try{W0.requestAnimationFrame(frame);}catch(_){}}
W0.__STORYWORLD_CURSOR_R780__=Object.freeze({revision:'R780-CURSOR',kinds:KINDS.slice(),css,classify:(x,y,b)=>classify(x,y,b),markers:()=>markers.map(m=>({...m})),icon,freeze:v=>{frozen=!!v;},
 inspect:()=>({off,hover:hover?{kind:hover.kind,targetId:hover.targetId}:null,markers:markers.length,applied:applied?applied.slice(-24):null,...stats})});
})();
