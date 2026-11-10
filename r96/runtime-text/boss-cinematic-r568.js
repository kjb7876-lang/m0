// R568 — 주요 서사 보스 마주침 컷신(사용자 2026-11-10 "코드로 주요서사구간에 몹과캐릭과배경에맞는 시네마틱영상 생성해서 넣어줘").
//  · 영상 파일을 새로 넣지 않는다(사이트 용량이 1GB 권장 한도 근처라). 게임이 이미 가진 그림만 코드로 합성해 실시간으로 그린다:
//    배경 = 그 순간의 실제 게임 화면(그 지역 맵) 정지 화면, 영웅 = 고른 영웅의 각성 그림(rc91), 보스 = 그 보스의 게임 그림(e.path).
//  · 흐름(10초): 열기(위아래 검은 띠·화면 색이 가라앉음) → 공간(지역 화면으로 천천히 다가감·안개·잿불·장 제목) →
//    영웅(각성 그림, 보스 쪽에서 오는 테두리 빛, 정본 독백 한 줄) → 보스(실루엣 → 번쩍 → 드러남, 영웅 어깨 너머 구도, 이름 카드) → 닫기.
//  · 글은 새로 쓰지 않는다: 자막은 정본(story-canon-r106-data) 그 지역 문단에서 낱말 조각으로 찾은 문장 그대로, 이름은 데이터의 보스 이름 그대로.
//    R450 박자 줄(마주침 문장)과 다른 문장을 골라, 컷신 뒤 같은 줄이 두 번 나오지 않게 한다.
//  · 언제: STORY 층에서 표에 있는 보스와 보스전이 열리고(room.engaged) 보스가 깨어 있을 때, 서사 장면·창이 닫힌 뒤 한 번(저장에 기억).
//    영화 모드(R370 음성 낭독)·협동·자동 검사(webdriver)에서는 틀지 않는다(?cine568=1 또는 play({force:true}) 로 강제).
//  · 재생 중 게임 시간은 멈춘다(엔진 tick 건너뜀). 판정·체력·AI·세이브 진행은 바꾸지 않는다. BGM 은 그대로 둔다.
//  · 건너뛰기: 단추 · 화면 누르기 · Esc/Enter/Space. 다른 지역으로 가면 닫힌다.
//  · 시험본은 루시퍼(ep1a11) 한 곳. 맘몬(ep1b06·ep1b06b)은 다른 작업 몫이라 넣지 않는다. 이미 영상이 있는 곳(R372 뿌리 문지기·R368 배신·R369 중독 도시)도 넣지 않는다.
//  · 끄기: localStorage['storyworld.r568.cine']='{"on":false}'. 다시 보기: __STORYWORLD_BOSS_CINEMATIC_R568__.play({force:true}).
(()=>{'use strict';
if(window.__STORYWORLD_BOSS_CINEMATIC_R568__)return;
const REV='R568-boss-cinematic-1',KEY='storyworld.r568.cine';
// [지역, 보스 nativeId, 정본 낱말 조각(자막), 분위기 색(어둠 쪽), 빛 색(테두리·번쩍)]
const TABLE=Object.freeze([
 {zone:'ep1a11',enemy:'a11-boss',needle:'교만의 악마 루시퍼라는 직감이',shade:'#3a0d22',light:'#e9c27a'}]);
const CUTS=Object.freeze([0,.8,3.4,6.2,9.3,10]),SHOTS=['open','place','hero','boss','close'],DUR=CUTS[CUTS.length-1];
function shotAt(t){if(!(t>=0))return'open';for(let i=1;i<CUTS.length;i++)if(t<CUTS[i])return SHOTS[i-1];return'done';}
let prefs={on:true,seen:[]};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'){if(s.on===false)prefs.on=false;if(Array.isArray(s.seen))prefs.seen=s.seen.filter(x=>typeof x==='string').slice(0,64);}}catch(_){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}};
const stats={plays:0,ended:0,skips:0,closedByRoom:0,errors:0,frames:0,snapshot:0,missingArt:0};let lastError=null,active=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const clamp=(x,a=0,b=1)=>x<a?a:x>b?b:x,lerp=(a,b,t)=>a+(b-a)*t,sm=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
// ---- 정본 문장 ----
const capCache=new Map();
function caption(zone,enemy){const k=zone+'|'+enemy;if(capCache.has(k))return capCache.get(k);const row=TABLE.find(r=>r.zone===zone&&r.enemy===enemy);let out=null;
 try{const z=window.__STORYWORLD_STORY_CANON_R106__?.zones?.[zone];if(row&&z)for(const b of z.blocks||[]){for(const p of b.paras||[]){const flat=String(p).replace(/\s*\n\s*/g,' ');if(!flat.includes(row.needle))continue;
  for(const s of flat.split(/(?<=[.?!…])\s+/))if(s.includes(row.needle)){out=s.trim();break;}if(out)break;}if(out)break;}}catch(e){fail(e);}
 capCache.set(k,out);return out;}
// ---- 상태 읽기 ----
const here=()=>typeof room!=='undefined'?room:null;
const solo=()=>{try{const s=window.__STORYWORLD_COOP_SIM_R62__;return !s?.mode||s.mode()==='off';}catch(_){return true;}};
const cinemaVoice=()=>{try{return !!window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.()?.on;}catch(_){return false;}};
const forced=()=>{try{return /[?&]cine568=1\b/.test(location.search);}catch(_){return false;}};
const automated=()=>{try{return !!navigator.webdriver&&!forced();}catch(_){return false;}};
const calm=()=>{try{return typeof started!=='undefined'&&started&&!(typeof loading!=='undefined'&&loading)&&!(typeof modal!=='undefined'&&modal)&&!(typeof storyScene!=='undefined'&&storyScene)
 &&typeof player!=='undefined'&&player&&player.hp>0&&!(typeof document!=='undefined'&&document.hidden);}catch(_){return false;}};
const storyLayer=r=>{try{return r&&r.layer==='STORY'&&(typeof layer==='undefined'||layer==='STORY');}catch(_){return false;}};
const awake=e=>e&&!e.r61Clone&&!e.r61Summoned&&e.hp>0&&!e.deadRecorded&&e.spawnState==='active';
function candidate(r=here()){if(!r||!storyLayer(r)||!r.engaged)return null;for(const e of r.enemies||[]){if(!awake(e)||!(e.boss||e.midboss))continue;
 const row=TABLE.find(t=>t.zone===r.id&&t.enemy===e.nativeId);if(row&&!prefs.seen.includes(row.zone+'|'+row.enemy))return{row,e};}return null;}
// ---- 그림 ----
function art(path){try{const r=typeof readyImage==='function'?readyImage(path):null;if(!r?.image)return null;const iw=r.image.naturalWidth||r.image.width||1,ih=r.image.naturalHeight||r.image.height||1;
 const c=r.crop||{x:0,y:0,w:iw,h:ih};return{img:r.image,x:+c.x||0,y:+c.y||0,w:Math.max(1,+c.w||iw),h:Math.max(1,+c.h||ih)};}catch(_){return null;}}
const backPath=()=>{try{return heroArt[player.hero]?.idle?.back||null;}catch(_){return null;}};
const heroPath=()=>{try{const a=heroArt[player.hero];return a?.awakening||a?.idle?.right||null;}catch(_){return null;}};
function want(paths){try{if(typeof ensureImages==='function'){const p=ensureImages(paths.filter(Boolean));if(p&&typeof p.catch==='function')p.catch(()=>{});}}catch(_){}}
function canvas(w,h){const c=document.createElement('canvas');c.width=Math.max(1,w|0);c.height=Math.max(1,h|0);return c;}
// 원본 그림이 칼로 자른 듯 끝나는지: 끝 열의 불투명 픽셀이 높이의 12%를 넘으면 그쪽이 잘린 것(부드러운 가장자리는 몇 픽셀뿐)
function edgeCut(left,right,h){const out=[];if(!(h>0))return out;if(left>h*.12)out.push('left');if(right>h*.12)out.push('right');return out;}
// 잘린 그림은 잘린 쪽 끝 14% 를 투명하게 서서히 지워 칼로 자른 선이 보이지 않게 한다(거울 채우기는 이음매가 더 어색해 쓰지 않음). 온전한 그림은 Dots 요청.
function complete(a){if(!a)return a;try{const c=canvas(a.w,a.h),g=c.getContext('2d');g.drawImage(a.img,a.x,a.y,a.w,a.h,0,0,a.w,a.h);const d=g.getImageData?.(0,0,c.width,c.height)?.data;if(!d)return a;
 const W=c.width,H=c.height,col=new Array(W).fill(0);for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>40)col[x]++;
 const end=k=>Math.max(col[k]||0,col[k+(k?-1:1)]||0),sides=edgeCut(end(0),end(W-1),H);if(!sides.length)return a;
 const q=g;q.save();q.globalCompositeOperation='destination-out';const F=Math.max(8,W*.14);
 for(const side of sides){const gr=side==='right'?q.createLinearGradient(W-F,0,W,0):q.createLinearGradient(F,0,0,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');q.fillStyle=gr;
  if(side==='right')q.fillRect(W-F,0,F,H);else q.fillRect(0,0,F,H);}q.restore();const out=c,NW=W;
 stats.completed=(stats.completed||0)+1;return{img:out,x:0,y:0,w:NW,h:H};}catch(e){fail(e);return a;}}
// 그림 한 장의 실루엣(검게)·빛 테두리용(빛 색) 사본
function tinted(a,color){if(!a)return null;try{const c=canvas(a.w,a.h),g=c.getContext('2d');g.drawImage(a.img,a.x,a.y,a.w,a.h,0,0,a.w,a.h);g.globalCompositeOperation='source-atop';g.fillStyle=color;g.fillRect(0,0,a.w,a.h);
 return{img:c,x:0,y:0,w:a.w,h:a.h};}catch(e){fail(e);return null;}}
// 지금 게임 화면(맵) 정지 화면: 보이는 게임 캔버스들을 순서대로 겹친다(HUD·미니맵은 뺌). WebGL 은 렌더 직후에 읽어야 해서 렌더러 감싸기에서 잡는다.
const SKIP_CANVAS=/^(mini|combat-hud|r568)/i;
function grabScreen(){try{const list=[...document.querySelectorAll('canvas')].filter(c=>!SKIP_CANVAS.test(c.id||'')&&c.width>8&&c.height>8&&!c.closest?.('#r568'));if(!list.length)return null;
 const W0=Math.max(...list.map(c=>c.width)),H0=Math.max(...list.map(c=>c.height));const out=canvas(Math.min(W0,1600),Math.min(H0,1000)),g=out.getContext('2d');g.fillStyle='#050305';g.fillRect(0,0,out.width,out.height);
 let n=0;for(const c of list){let st=null;try{st=getComputedStyle(c);}catch(_){}if(st&&(st.display==='none'||st.visibility==='hidden'||+st.opacity===0))continue;g.globalAlpha=st?clamp(+st.opacity||1):1;try{g.drawImage(c,0,0,out.width,out.height);n++;}catch(_){}}
 g.globalAlpha=1;stats.snapshot=n;return n?out:null;}catch(e){fail(e);return null;}}
let snapWanted=null;
function wrapRender(fn){if(fn.__r568)return fn;const w=function(...a){const r=fn.apply(this,a);if(snapWanted){const k=snapWanted;snapWanted=null;try{k(grabScreen());}catch(e){fail(e);}}return r;};w.__r568=true;return w;}
const wrappedR=new WeakSet();
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&typeof r.render==='function'&&!wrappedR.has(r)){wrappedR.add(r);r.render=wrapRender(r.render);}}catch(e){fail(e);}}
if(typeof setInterval==='function'){setInterval(wrapInst,700);}
function snapshot(cb){wrapInst();let done=false;const k=s=>{if(done)return;done=true;cb(s);};snapWanted=k;setTimeout(()=>{if(!done){snapWanted=null;k(grabScreen());}},120);}
// ---- 소리: 보스가 드러나는 순간 낮은 울림 한 번(설정 효과음·음량을 따름) ----
function boom(){try{const s=typeof settings!=='undefined'?settings:null;if(s&&(!s.sound||!(+s.volume>0)))return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
 const ac=boom.ac||(boom.ac=new AC()),t=ac.currentTime,v=clamp((s?+s.volume:1)*.55);const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(74,t);o.frequency.exponentialRampToValueAtTime(31,t+1.6);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+1.9);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+2);
 const n=ac.createBufferSource(),b=ac.createBuffer(1,ac.sampleRate*.5|0,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
 const f=ac.createBiquadFilter(),ng=ac.createGain();f.type='lowpass';f.frequency.value=420;ng.gain.value=v*.5;n.buffer=b;n.connect(f).connect(ng).connect(ac.destination);n.start(t);}catch(_){}}
// ---- 화면 ----
function css(){if(document.getElementById('r568Css'))return;const s=document.createElement('style');s.id='r568Css';
 s.textContent='#r568{position:fixed;inset:0;z-index:2147482500;background:#000;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;opacity:1;transition:opacity .45s}#r568.out{opacity:0}'
 +'#r568 canvas{position:absolute;inset:0;width:100%;height:100%;display:block}'
 +'#r568 .skip{position:absolute;right:max(16px,3vw);bottom:max(14px,2.6vh);z-index:2;padding:7px 15px;font:13px "Malgun Gothic",sans-serif;color:#efe6da;background:rgba(20,12,12,.6);border:1px solid #6b4f4a;border-radius:6px;cursor:pointer}';
 document.head.appendChild(s);}
const SERIF='"Gowun Batang","Noto Serif KR","Nanum Myeongjo",serif';
function cover(g,img,W,H,zoom,fx,fy){const iw=img.width,ih=img.height,s=Math.max(W/iw,H/ih)*zoom,w=iw*s,h=ih*s;
 // 초점(fx,fy: 0~1 그림 안 자리)이 화면 가운데 쪽으로 오게 하되 가장자리가 비지 않게
 let x=W/2-fx*w,y=H/2-fy*h;x=clamp(x,W-w,0);y=clamp(y,H-h,0);g.drawImage(img,x,y,w,h);}
function fitH(a,maxW,maxH){return Math.max(1,Math.min(maxH,maxW*a.h/a.w));}
function drawArt(g,a,cx,footY,h,o={}){if(!a)return null;const w=h*a.w/a.h;g.save();g.globalAlpha=o.alpha??1;if(o.comp)g.globalCompositeOperation=o.comp;
 if(o.flip){g.translate(cx,0);g.scale(-1,1);g.translate(-cx,0);}g.drawImage(a.img,a.x,a.y,a.w,a.h,cx-w/2,footY-h,w,h);g.restore();return{x:cx-w/2,y:footY-h,w,h};}
function wrapText(g,text,maxW){const out=[];let line='';for(const word of String(text).split(' ')){const t=line?line+' '+word:word;if(line&&g.measureText(t).width>maxW){out.push(line);line=word;}else line=t;}if(line)out.push(line);return out;}
function build(o){const W=o.cv.width,H=o.cv.height,R=rng(561),motes=[];for(let i=0;i<70;i++)motes.push({x:R(),y:R(),v:.04+R()*.1,s:.6+R()*1.8,p:R()*6.28});
 const fogs=[0,1,2].map(i=>({y:.45+i*.17,r:.55+i*.12,v:(i%2?-1:1)*(.012+i*.006),x:R()}));
 // 흐린 배경(영웅·보스 컷 뒤): 정지 화면을 흐리고 어둡게 한 번만 만든다(우리 캔버스에서만 filter 사용)
 let blurred=null;if(o.snap){try{blurred=canvas(Math.max(1,W/3),Math.max(1,H/3));const b=blurred.getContext('2d');b.filter='blur(4px) brightness(.6) saturate(.6)';cover(b,o.snap,blurred.width,blurred.height,1.15,o.fx,o.fy);b.filter='none';}catch(e){blurred=null;}}
 return{W,H,motes,fogs,blurred};}
function frame(o,t){const g=o.g,{W,H}=o.scene,U=Math.min(W,H),row=o.row,sh=shotAt(t);stats.frames++;
 g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.fillStyle='#000';g.fillRect(0,0,W,H);
 const bar=H*.115*sm(0,.7,t)*(1-sm(DUR-.35,DUR,t)),top=bar,bot=H-bar,ih=bot-top;
 let shake=0;if(!o.calm&&t>6.7&&t<7.15){shake=(1-(t-6.7)/.45)*U*.012;}const sx=Math.sin(t*61)*shake,sy=Math.cos(t*53)*shake;
 g.save();g.beginPath();g.rect(0,top,W,ih);g.clip();if(sx||sy)g.translate(sx,sy);
 if(sh==='open'||sh==='place'){// 공간: 지역 화면으로 천천히 다가간다
  const k=sm(0,3.4,t);if(o.snap){g.filter=`saturate(${lerp(1,.55,sm(0,.8,t))}) brightness(${lerp(1,.72,sm(0,.8,t))}) contrast(1.08)`;cover(g,o.snap,W,H,lerp(1.02,1.16,k),lerp(.5,o.fx,k),lerp(.5,o.fy,k));g.filter='none';}
  else{const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#09060a');gr.addColorStop(1,row.shade);g.fillStyle=gr;g.fillRect(0,0,W,H);}
  g.globalCompositeOperation='multiply';g.globalAlpha=.55*sm(0,.9,t);g.fillStyle=row.shade;g.fillRect(0,0,W,H);g.globalCompositeOperation='source-over';g.globalAlpha=1;
  fog(o,t,.16);motesDraw(o,t,1);
  // 장 제목(데이터 그대로)
  const a=sm(1,1.6,t)*(1-sm(3.0,3.4,t));if(a>0){g.globalAlpha=a;g.textAlign='left';g.textBaseline='top';g.shadowColor='#000';g.shadowBlur=8;
   g.fillStyle='#c9a46a';g.font=`600 ${Math.round(U*.022)}px ${SERIF}`;g.fillText(o.chapter||'',W*.06,top+ih*.08);
   g.fillStyle='#efe2cf';g.font=`700 ${Math.round(U*.05)}px ${SERIF}`;g.fillText(o.title||'',W*.06,top+ih*.08+U*.036);g.shadowBlur=0;g.globalAlpha=1;}}
 else if(sh==='hero'){const k=(t-3.4)/2.8;bg(o,t,.9);
  // 보스 쪽(오른쪽)에서 오는 빛
  const lg=g.createRadialGradient(W*.92,top+ih*.35,0,W*.92,top+ih*.35,W*.7);lg.addColorStop(0,hexA(row.light,.32));lg.addColorStop(1,hexA(row.light,0));g.fillStyle=lg;g.fillRect(0,0,W,H);
  // 멀리 보스 실루엣(오른쪽 끝, 흐릿하게)
  // 그림은 자르지 않는다(사용자 2026-11-10 03:40Z "이미지 안잘리게"): 모든 그림을 위아래 띠 안쪽·화면 좌우 안에 통째로 맞춘다
  const port=W<H,pad=W*.03,foot=bot-ih*.03;
  if(o.bossDark){const bh0=fitH(o.bossDark,port?W*.5:W*.3,ih*.6),bw0=bh0*o.bossDark.w/o.bossDark.h;drawArt(g,o.bossDark,W-pad-bw0/2,foot,bh0,{alpha:.55*sm(3.6,4.6,t)});}
  const push=lerp(1,1.03,k),hh=o.hero?fitH(o.hero,(port?W*.9:W*.5)/1.035,ih*.9/1.04)*push:ih*.8,hw=o.hero?hh*o.hero.w/o.hero.h:0,
   cx=clamp(port?W*.5:W*lerp(.3,.33,sm(0,1,k)),pad+hw/2,W-pad-hw/2),br=1+Math.sin(t*2.1)*.006;
  // 테두리 빛은 그림 뒤에서 보스 쪽으로 살짝 비켜 그리고(가장자리만 보이게), 영웅 몸은 빛 반대쪽이 가라앉게 그늘을 얹는다
  if(o.hero){const ha=sm(3.4,3.75,t);g.save();g.translate(cx,foot);g.scale(1,br);g.translate(-cx,-foot);
   if(o.heroRim)drawArt(g,o.heroRim,cx+U*.007,foot-U*.002,hh,{alpha:.85*ha*sm(3.5,4.3,t)});
   drawArt(g,o.hero,cx,foot,hh,{alpha:ha});if(o.heroDark)drawArt(g,o.heroDark,cx,foot,hh,{alpha:.38*ha});g.restore();}
  fog(o,t,.1);motesDraw(o,t,.7);vign(o,.75);}
 else if(sh==='boss'||sh==='close'){const k=sm(6.2,9.3,t);bg(o,t,1);
  const lit=sm(6.7,7.3,t);const gl=g.createRadialGradient(W*.6,top+ih*.45,0,W*.6,top+ih*.45,U*.75);gl.addColorStop(0,hexA(row.shade,.0+.85*lit));gl.addColorStop(.35,hexA(row.light,.12*lit));gl.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gl;g.fillRect(0,0,W,H);
  const port=W<H,pad=W*.03,bf=bot-ih*.03,bh=o.boss?fitH(o.boss,(port?W*.9:W*.58)/1.045,ih*.9/1.045)*lerp(1,1.04,k):ih*.8,bw=o.boss?bh*o.boss.w/o.boss.h:0,
   bx=clamp(W*(port?.5:.6),pad+bw/2,W-pad-bw/2);
  if(o.boss){drawArt(g,o.bossDark||o.boss,bx,bf,bh,{alpha:sm(6.2,6.45,t)});drawArt(g,o.boss,bx,bf,bh,{alpha:lit});if(o.bossRim)drawArt(g,o.bossRim,bx-U*.005,bf,bh,{alpha:.35*lit*(.75+.25*Math.sin(t*3)),comp:'lighter'});}
  motesDraw(o,t,1.2);
  // 앞쪽 영웅 어깨 너머(검은 실루엣, 왼쪽 아래)
  // 어깨 너머: 게임의 실제 뒷모습 그림(idle.back)을 어둡게, 보스 쪽 가장자리만 빛. 없으면 각성 그림 실루엣
  {const B=o.back?{a:o.back,d:o.backDark,r:o.backRim}:o.heroDark?{a:null,d:o.heroDark,r:o.heroRim}:null;
   if(B){const ref=B.a||B.d,hh2=fitH(ref,port?W*.36:W*.26,port?ih*.42:ih*.66),hw2=hh2*ref.w/ref.h,hx=pad+hw2/2,hf=bot-ih*.02,a2=sm(6.2,6.5,t);
    if(B.r)drawArt(g,B.r,hx+U*.005,hf-U*.002,hh2,{alpha:.4*a2*lit});if(B.a){drawArt(g,B.a,hx,hf,hh2,{alpha:a2});drawArt(g,B.d,hx,hf,hh2,{alpha:.78*a2});}else drawArt(g,B.d,hx,hf,hh2,{alpha:.97*a2});}}
  vign(o,.85);
  // 번쩍
  // 번쩍: 화면 전체가 아니라 보스 뒤에서 퍼지는 빛(가장자리 어둠은 남긴다)
  const fl=(t>6.7?Math.max(0,1-(t-6.7)/.32):0)*(o.calm?.35:1);if(fl>0){const cyB=bf-bh*.55,rB=U*(.35+.7*(1-fl));const bu=g.createRadialGradient(bx,cyB,0,bx,cyB,rB);
   bu.addColorStop(0,hexA(row.light,.85*fl));bu.addColorStop(.45,hexA(row.light,.35*fl));bu.addColorStop(1,hexA(row.shade,0));g.globalCompositeOperation='screen';g.fillStyle=bu;g.fillRect(bx-rB,cyB-rB,rB*2,rB*2);g.globalCompositeOperation='source-over';}
}
 g.restore();
 // 닫기: 검게
 const out=sm(9.3,9.75,t);if(out>0){g.globalAlpha=out;g.fillStyle='#000';g.fillRect(0,0,W,H);g.globalAlpha=1;}
 // 컷 바뀔 때 짧은 검은 숨(0.12초)
 for(const c of [3.4,6.2]){const d=Math.abs(t-c);if(d<.12){g.globalAlpha=1-d/.12;g.fillStyle='#000';g.fillRect(0,0,W,H);g.globalAlpha=1;}}
 g.fillStyle='#000';g.fillRect(0,0,W,bar);g.fillRect(0,H-bar,W,bar);
 // 자막(정본 독백)은 아래 검은 띠 안에 — 영화 자막 자리라 그림을 가리지 않는다
 if(sh==='hero')subtitle(o,o.caption,sm(3.75,4.2,t)*(1-sm(5.8,6.2,t)));
 if(sh==='boss'||sh==='close')nameCard(o,sm(7.1,7.6,t)*(1-sm(9.0,9.3,t)));}
function hexA(h,a){const m=/^#?([0-9a-f]{6})$/i.exec(h||'');const n=m?parseInt(m[1],16):0;return`rgba(${n>>16&255},${n>>8&255},${n&255},${clamp(a)})`;}
function bg(o,t,dark){const g=o.g,{W,H}=o.scene;if(o.scene.blurred){g.globalAlpha=dark;cover(g,o.scene.blurred,W,H,1.04+Math.sin(t*.3)*.01,o.fx,o.fy);g.globalAlpha=1;}
 g.globalCompositeOperation='multiply';g.globalAlpha=.5;g.fillStyle=o.row.shade;g.fillRect(0,0,W,H);g.globalCompositeOperation='source-over';g.globalAlpha=1;}
function vign(o,a){const g=o.g,{W,H}=o.scene;const v=g.createRadialGradient(W/2,H*.52,Math.min(W,H)*.3,W/2,H*.52,Math.max(W,H)*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,`rgba(0,0,0,${a})`);g.fillStyle=v;g.fillRect(0,0,W,H);}
function fog(o,t,a){const g=o.g,{W,H}=o.scene;for(const f of o.scene.fogs){const x=((f.x+t*f.v)%1+1)%1*W*1.4-W*.2,y=H*f.y,r=W*f.r;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(150,140,150,${a})`);gr.addColorStop(1,'rgba(150,140,150,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);}}
function motesDraw(o,t,a){const g=o.g,{W,H}=o.scene,U=Math.min(W,H);g.fillStyle=o.row.light;for(const m of o.scene.motes){const y=((m.y-t*m.v)%1+1)%1,x=m.x+Math.sin(t*.7+m.p)*.01;g.globalAlpha=clamp(a*(.25+.5*Math.sin(t*2+m.p)**2)*Math.min(1,y*4));const r=m.s*U/520,px=x*W,py=y*H,an=t*1.3+m.p;
 g.beginPath();for(let k=0;k<4;k++){const aa=an+k*1.5708,rr=r*(k%2?.45:1)*(1+.25*Math.sin(m.p*7+k));const X=px+Math.cos(aa)*rr,Y=py+Math.sin(aa)*rr;if(k)g.lineTo(X,Y);else g.moveTo(X,Y);}g.closePath();g.fill();}g.globalAlpha=1;}
function subtitle(o,text,a){if(!text||a<=0)return;const g=o.g,{W,H}=o.scene,U=Math.min(W,H),size=Math.round(clamp(U*.03,13,26));g.save();g.globalAlpha=a;g.font=`500 ${size}px ${SERIF}`;g.textAlign='center';g.textBaseline='alphabetic';
 const lines=wrapText(g,text,Math.min(W*.86,size*34)),lh=size*1.5,bar=H*.115,y0=H-bar/2+size*.35-(lines.length-1)*lh/2;g.shadowColor='#000';g.shadowBlur=10;g.fillStyle='rgba(236,228,214,.95)';lines.forEach((l,i)=>g.fillText(l,W/2,y0+i*lh));g.restore();}
function nameCard(o,a){if(a<=0)return;const g=o.g,{W,H}=o.scene,U=Math.min(W,H);g.save();g.globalAlpha=a;const bar=H*.115,big=Math.round(clamp(bar*.46,14,46)),cy=H-bar/2+big*.36,sm2=Math.round(clamp(big*.36,9,15));
 g.font=`700 ${big}px ${SERIF}`;const w=Math.min(W*.94,g.measureText(o.name).width+big*3.2);const x0=W/2-w/2;
 const gr=g.createLinearGradient(x0,0,x0+w,0);gr.addColorStop(0,'rgba(14,4,6,0)');gr.addColorStop(.15,'rgba(14,4,6,.66)');gr.addColorStop(.85,'rgba(14,4,6,.66)');gr.addColorStop(1,'rgba(14,4,6,0)');g.fillStyle=gr;g.fillRect(x0,H-bar,w,bar);
 g.fillStyle=hexA(o.row.light,.8);g.fillRect(x0+w*.1,H-bar+bar*.14,w*.8,1);g.fillRect(x0+w*.1,H-bar*.14,w*.8,1);
 g.textAlign='center';g.shadowColor='#000';g.shadowBlur=12;g.fillStyle='#f3e7da';const maxN=W*.86,nw=Math.min(maxN,g.measureText(o.name).width);g.fillText(o.name,W/2,cy,maxN);g.font=`600 ${sm2}px ${SERIF}`;g.fillStyle=o.row.light;g.shadowBlur=6;
 g.textAlign='right';const lx=W/2-nw/2-big*.45;if(lx-g.measureText('B O S S').width>=4)g.fillText('B O S S',lx,cy-big*.08);g.restore();}
// ---- 재생 ----
function finish(o,reason){if(!o||o.done)return;o.done=true;if(active===o)active=null;try{cancelAnimationFrame(o.raf);}catch(_){}
 if(reason==='ended')stats.ended++;else if(reason==='skip')stats.skips++;else if(reason==='room')stats.closedByRoom++;
 try{o.root.classList.add('out');}catch(_){}setTimeout(()=>{try{o.root.remove();}catch(_){}try{if(typeof keys!=='undefined'&&keys?.clear)keys.clear();}catch(_){}},480);}
function play(opt={}){if(active||typeof document==='undefined')return false;const r=here();let pick=opt.force?(candidate(r)||forcePick(r,opt)):candidate(r);if(!pick)return false;
 if(!opt.force&&(!prefs.on||automated()||cinemaVoice()||!solo()||!calm()))return false;
 const {row,e}=pick,key=row.zone+'|'+row.enemy;if(!prefs.seen.includes(key)){prefs.seen.push(key);save();}
 css();const root=document.createElement('div');root.id='r568';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','보스 등장 컷신');
 const cv=canvas(1,1);cv.id='r568c';root.appendChild(cv);const skipBtn=document.createElement('button');skipBtn.type='button';skipBtn.className='skip';skipBtn.textContent='건너뛰기 ▸';root.appendChild(skipBtn);document.body.appendChild(root);
 const dpr=Math.min(1.5,(typeof devicePixelRatio==='number'?devicePixelRatio:1)||1),W=Math.max(320,(innerWidth||1280)*dpr|0),H=Math.max(240,(innerHeight||720)*dpr|0);cv.width=W;cv.height=H;
 const reg=(typeof regionById!=='undefined'&&regionById?.[row.zone])||{};
 const o={calm:reducedMotion(),row,e,key,root,cv,g:cv.getContext('2d'),room:r,t0:0,raf:0,done:false,at:Number.isFinite(opt.at)?opt.at:null,snap:null,fx:.5,fy:.5,
  title:reg.title||'',chapter:reg.chapter||'',name:String(e.name||'').replace(/\s*\(.*\)\s*$/,''),caption:caption(row.zone,row.enemy),hero:null,boss:null,boomed:false};
 // 보스 화면 자리(배경 다가가기 초점)
 try{if(typeof project==='function'){const q=project(e.x,e.y),gw=(innerWidth||1280),gh=(innerHeight||720);o.fx=clamp(q.x/gw,.15,.85);o.fy=clamp(q.y/gh,.2,.8);}}catch(_){}
 const hp=heroPath(),bp=backPath();want([hp,bp,e.path]);
 const arts=()=>{if(!o.hero){o.hero=complete(art(hp));if(o.hero){o.heroDark=tinted(o.hero,'#050304');o.heroRim=tinted(o.hero,row.light);}}if(!o.back&&bp){o.back=art(bp);if(o.back){o.backDark=tinted(o.back,'#050304');o.backRim=tinted(o.back,row.light);}}if(!o.boss){o.boss=complete(art(e.path));if(o.boss){o.bossDark=tinted(o.boss,'#070305');o.bossRim=tinted(o.boss,row.light);}}};
 arts();if(!o.hero||!o.boss)stats.missingArt++;
 o.scene=build(o);
 snapshot(s=>{if(o.done)return;o.snap=s;try{o.scene=build(o);}catch(err){fail(err);}});
 const end=reason=>finish(o,reason);root.addEventListener('pointerdown',ev=>{ev.preventDefault?.();end('skip');});skipBtn.addEventListener('click',ev=>{ev.stopPropagation?.();end('skip');});
 try{if(typeof keys!=='undefined'&&keys?.clear)keys.clear();}catch(_){}
 active=o;stats.plays++;gateOuter();
 const loop=now=>{if(o.done)return;if(!o.t0)o.t0=now;const t=o.at!=null?o.at:(now-o.t0)/1000;o.t=t;
  try{if(!o.hero||!o.boss||(!o.back&&bp))arts();if(!o.boomed&&t>=6.7&&o.at==null){o.boomed=true;boom();}frame(o,Math.min(t,DUR));}catch(err){fail(err);}
  if(o.at==null&&t>=DUR)return end('ended');o.raf=requestAnimationFrame(loop);};
 o.raf=requestAnimationFrame(loop);return true;}
// '흔들림·강한 점멸 줄이기' 설정(엔진 settings.reducedMotion, 없으면 브라우저 선호)을 따른다
function reducedMotion(){try{if(typeof settings!=='undefined'&&settings&&'reducedMotion' in settings)return !!settings.reducedMotion;}catch(_){}try{return !!matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(_){return false;}}
// 이 파일보다 뒤에 실린 tick 감싸개(mobile-bonus-r286 의 재사용 대기 회복 등)도 컷신 동안 멈추게, 재생할 때 가장 바깥 tick 에 문을 단다
let gateFn=null;
function gateOuter(){try{if(typeof tick!=='function'||tick===gateFn)return;const outer=tick;const gf=function(...a){if(active){if(here()!==active.room)finish(active,'room');else return;}return outer.apply(this,a);};gateFn=gf;tick=gf;}catch(e){fail(e);}}
// 강제 재생(검사·다시 보기): 지금 지역의 표 보스를 쓰고, 없으면 표 첫 줄을 흉내 낸다
function forcePick(r,opt){const z=opt.zone||r?.id;const row=TABLE.find(t=>t.zone===z)||TABLE[0];const e=(r?.enemies||[]).find(x=>x&&x.nativeId===row.enemy)||{nativeId:row.enemy,name:'',path:null,x:0,y:0};return{row,e};}
// 키: 재생 중 게임 키를 막고 Esc/Enter/Space 로 건너뛴다(R309 가드 목록에도 올림)
function key(ev){if(!active)return false;ev.preventDefault?.();ev.stopImmediatePropagation?.();if(ev.type==='keydown'&&!ev.repeat&&(ev.key==='Escape'||ev.key==='Enter'||ev.key===' '||ev.code==='Space'))finish(active,'skip');return true;}
try{(window.__STORYWORLD_CINEMA_GUARDS__=window.__STORYWORLD_CINEMA_GUARDS__||[]).push(key);}catch(_){}
if(typeof addEventListener==='function'){addEventListener('keydown',key,true);addEventListener('keyup',key,true);}
// 틱: 재생 중엔 게임 시간을 멈추고, 아니면 시작 조건을 본다. 표 보스 지역에 들어오면 그림을 미리 받아 둔다.
let lastRoom=null;
if(typeof tick==='function'){const base=tick;tick=function(...a){if(active){if(here()!==active.room)finish(active,'room');else return;}
 const out=base.apply(this,a);
 try{const r=here();if(r!==lastRoom){lastRoom=r;if(prefs.on&&r&&TABLE.some(t=>t.zone===r.id)){const e=(r.enemies||[]).find(x=>TABLE.some(t=>t.zone===r.id&&t.enemy===x?.nativeId));want([heroPath(),e?.path]);}}
  if(prefs.on&&!active&&candidate(r))play();}catch(e){fail(e);}return out;};}
function set(p){if(p&&typeof p.on==='boolean')prefs.on=p.on;if(p?.resetSeen)prefs.seen=[];save();return{on:prefs.on,seen:[...prefs.seen]};}
window.__STORYWORLD_BOSS_CINEMATIC_R568__=Object.freeze({revision:REV,KEY,TABLE,cuts:CUTS,duration:DUR,shotAt,caption,
 bgmGain:()=>1,edgeCut,play:(o={})=>play({force:true,...o}),skip:()=>{if(!active)return false;finish(active,'skip');return true;},
 seek:t=>{if(!active||!Number.isFinite(t))return false;active.at=clamp(t,0,DUR);return true;},set,candidate:()=>{const c=candidate();return c?c.row.zone+'|'+c.row.enemy:null;},
 inspect:()=>({revision:REV,prefs:{on:prefs.on,seen:[...prefs.seen]},active:!!active,key:active?.key||null,t:active?.t??null,shot:active&&active.t!=null?shotAt(active.t):null,snapshot:!!active?.snap,backView:active?!!active.back:null,stats:{...stats},lastError})});
})();
