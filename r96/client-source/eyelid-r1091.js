// R1091 — 게임에 들어갈 때 눈을 뜨고, 쓰러질 때 눈을 감는 화면 연출.
// 사용자 2026-11-15 23:03Z: "게임진입시 눈을뜨는연출 / 사망시 눈을감는연출 가로합일참고".
//  · '가로 합일': 위·아래 눈꺼풀이 화면 가운데에서 가로 한 줄(一)로 합쳐진다. 감길 때는 그 줄이 마지막 빛으로 남았다가 가운데로 줄어 사라지고,
//    뜰 때는 어둠 속에 한지빛 가는 줄이 먼저 가로로 번진 뒤 눈꺼풀이 갈라진다(한 번 깜빡인 뒤 활짝).
//  · 눈꺼풀 모양은 아몬드형(가운데가 가장 넓게 열림), 가장자리는 먹 붓 자국처럼 거칠게 번진다. 수묵화풍(R1055)이 켜져 있으면 따뜻한 먹색, 꺼져 있으면 푸른 밤빛 검정.
//  · 참고(사용자 2026-11-16 00:10Z 확인): 가로판 합일(hapil1 RC181 시작·RC182 엔딩의 위아래 눈꺼풀)과 세로 리부트의 먹 눈꺼풀 — 박자(약 1.25초)·먹 농담·속눈썹 먹선·남색만 맞추고 코드·자산은 베끼지 않음.
//  · 언제: 새 게임·불러오기를 누르면 감은 채로 로딩 → 로딩·서사창이 닫혀 세계가 보이는 첫 순간 눈을 뜬다.
//          영웅 체력이 0 이 되면 눈을 감고(R151 쓰러짐 1.5초와 같이), 감은 채 '기억은 남아 있습니다' 창 아래에 머문다 → 다시 살아나 세계가 보이면 눈을 뜬다.
//          지역 이동·제목 화면에서는 하지 않는다.
//  · 하지 않는 때: 설정 끔(storyworld.r1091.eyelid {on:false})·협동·자동 검사(webdriver, ?eye1091=1 은 허용). '움직임 줄이기'면 깜빡임 없이 0.5초 안팎으로 짧게.
//  · 그리기: 게임 캔버스·렌더러와 따로인 화면 위 캔버스 하나(창 #modal 아래 z-index 29, 누르기 통과). 움직이는 동안에만 그리고, 다 뜨면 숨겨 그리기 0.
//    해상도는 화면의 0.75배(효과 줄이기·성능 1·2단계는 0.5배), 기기 배율은 쓰지 않는다. 흐림 필터 없음. 숫자는 모두 clamp(NaN·Infinity 가 그리기로 가지 않게).
//  판정·피해·부활·저장·서사·그림 원본은 바꾸지 않는다. 점검: window.__STORYWORLD_EYELID_R1091__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_EYELID_R1091__)return;
const REV='R1091-eyelid-1',KEY='storyworld.r1091.eyelid',N=33;
const unit=(t,d)=>t===Infinity?1:clamp((Number.isNaN(t)?0:t)/d,0,1),fin=(v,d)=>Number.isFinite(v)?v:d,clamp=(v,a,b)=>Math.min(b,Math.max(a,fin(v,a)));
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={opens:0,closes:0,arms:0,frames:0,skipped:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const V={started:()=>typeof started!=='undefined'?started:undefined,player:()=>typeof player!=='undefined'?player:undefined,loading:()=>typeof loading!=='undefined'?loading:undefined,
 modal:()=>typeof modal!=='undefined'?modal:undefined,storyScene:()=>typeof storyScene!=='undefined'?storyScene:undefined,settings:()=>typeof settings!=='undefined'?settings:undefined,
 newGame:()=>typeof newGame!=='undefined'?newGame:undefined,hurt:()=>typeof hurt!=='undefined'?hurt:undefined,restoreSave:()=>typeof restoreSave!=='undefined'?restoreSave:undefined};
const g=name=>{try{return V[name]();}catch(_){return undefined;}};
const reduced=()=>{try{return !!g('settings')?.reducedMotion;}catch(_){return false;}};
function durations(){return reduced()?{open:.5,close:.45}:{open:1.25,close:1.25};}
const ease={out:u=>1-(1-u)*(1-u),outC:u=>1-Math.pow(1-u,3),io:u=>u*u*(3-2*u)};
// 눈 뜨기: 0~16% 빛 줄만(0) → 42% 까지 0.32 → 55% 에 0.12 로 깜빡 → 끝까지 활짝(1). 눈 감기: 35% 까지 무겁게 0.45 → 50% 에 0.55 로 한 번 버팀 → 0.
function openness(kind,t){const D=durations();
 if(kind!=='open'&&kind!=='close')return 1;
 const u=unit(t,D[kind]);
 if(kind==='open'){if(u>=1)return 1;if(u<=0)return 0;
  if(reduced())return ease.io(u);
  if(u<.16)return 0;if(u<.42)return .32*ease.out((u-.16)/.26);if(u<.55)return .32-.2*ease.io((u-.42)/.13);return clamp(.12+.88*ease.outC((u-.55)/.45),0,1);}
 if(u>=1)return 0;if(u<=0)return 1;
 if(reduced())return 1-ease.io(u);
 if(u<.35)return 1-.55*ease.out(u/.35);if(u<.5)return .45+.1*ease.io((u-.35)/.15);return clamp(.55*(1-ease.out((u-.5)/.5)),0,1);}
// 가는 빛 줄(一)의 너비 비율: 뜰 때 0~16% 에 가운데서 양옆으로 번지고 눈꺼풀이 갈라지며 옅어짐. 감길 때 마지막 18% 에 가운데로 줄어 사라짐.
function lineAmount(kind,t){const D=durations(),u=unit(t,D[kind]||1);
 if(kind==='open'){if(u<.16)return {w:ease.out(u/.16),a:1};if(u<.42)return {w:1,a:1-(u-.16)/.26};return {w:0,a:0};}
 if(kind==='close'){if(u<.7)return {w:0,a:0};if(u<.82)return {w:1,a:(u-.7)/.12};return {w:1-(u-.82)/.18,a:1};}
 if(kind==='shut')return {w:0,a:0};return {w:0,a:0};}
const rough=Array.from({length:N},(_,i)=>{const s=Math.sin(i*12.9898+4.1)*43758.5453;return (s-Math.floor(s))*2-1;});
function geometry(W,H,o){W=clamp(W,1,1e5);H=clamp(H,1,1e5);o=clamp(o,0,1);
 const cy=H/2,k=.6,F=H*.08,Hmax=(cy+F)/((1-k)*.85),a=H*.012*Math.min(1,o*8),top=[],bottom=[];
 for(let i=0;i<N;i++){const x=W*i/(N-1),s=1-k*Math.pow(2*i/(N-1)-1,2),h=Math.pow(o,1.8)*Hmax*s;
  top.push([x,cy-h+rough[i]*a]);bottom.push([x,cy+h*.85-rough[(i+7)%N]*a*.8]);}
 return {top,bottom,cy};}
let phase='idle',kind=null,t0=0,cur=1,canvas=null,cx=null,raf=0;
const now=()=>fin(performance.now(),0)/1000;
function enabled(count){if(!prefs.on)return false;
 try{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();if(m&&m!=='off'){if(count)stats.skipped++;return false;}}catch(_){}
 try{if(navigator.webdriver&&!/[?&]eye1091=1\b/.test(location.search||'')){if(count)stats.skipped++;return false;}}catch(_){}
 return true;}
function ensureCanvas(){if(canvas)return canvas;try{if(!document.body)return null;canvas=document.createElement('canvas');canvas.id='eyelidR1091';
 Object.assign(canvas.style,{position:'fixed',left:'0',top:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'29',display:'none'});
 canvas.setAttribute('aria-hidden','true');document.body.appendChild(canvas);}catch(e){fail(e);}return canvas;}
function scale(){let s=.75;try{if(g('settings')?.lowFx)s=.5;const st=window.__STORYWORLD_PERF7_R1043__?.step?.();if(Number.isFinite(st)&&st<=2)s=.5;}catch(_){}return s;}
function show(on){const c=ensureCanvas();if(c)c.style.display=on?'block':'none';}
function inkOn(){try{const p=window.__STORYWORLD_INK_WASH_R1055__?.prefs?.();return !!p&&p.mode!=='off';}catch(_){return false;}}
function lid(c,pts,top,W,H,off,alpha){c.globalAlpha=alpha;c.beginPath();const edgeY=top?0:H;c.moveTo(0,edgeY);
 for(const p of pts)c.lineTo(clamp(p[0],-10,W+10),clamp(p[1]+(top?off:-off),-H,2*H));c.lineTo(W,edgeY);c.closePath();c.fill();}
function drawNow(){const c=ensureCanvas();if(!c)return;try{
 const s=scale(),W=Math.max(64,Math.round(clamp(window.innerWidth,64,8192)*s)),H=Math.max(36,Math.round(clamp(window.innerHeight,36,8192)*s));
 if(c.width!==W)c.width=W;if(c.height!==H)c.height=H;cx=c.getContext('2d');const x=cx;if(!x)return;
 const o=clamp(cur,0,1),G=geometry(W,H,o),ink=inkOn(),body=ink?'#0d0b09':'#03060d';
 x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.clearRect(0,0,W,H);
 // 눈 안쪽 어둠(감길수록 가장자리부터 어두워짐)
 const v=clamp((1-o)*.6,0,.6);if(v>.01){const r=x.createRadialGradient(W/2,H/2,clamp(H*.15,1,1e5),W/2,H/2,clamp(Math.hypot(W,H)*.6,2,1e5));
  r.addColorStop(0,'rgba(0,0,0,0)');r.addColorStop(1,ink?'rgba(13,11,9,'+v.toFixed(3)+')':'rgba(3,5,9,'+v.toFixed(3)+')');x.fillStyle=r;x.globalAlpha=1;x.fillRect(0,0,W,H);}
 // 눈꺼풀: 번지는 먹 세 겹 + 속
 const fe=H*.018;x.fillStyle=ink?'rgba(38,28,20,1)':'rgba(10,14,22,1)';
 for(let i=3;i>=1;i--){lid(x,G.top,true,W,H,i*fe,.2);lid(x,G.bottom,false,W,H,i*fe,.2);}
 // 몸: 바깥은 옅은 먹 → 가장자리로 갈수록 짙게(가로판 합일 눈꺼풀처럼 수묵 끔이면 짙은 남색 한 빛)
 for(const up of [true,false]){const pts=up?G.top:G.bottom,m=pts[pts.length>>1][1],gy=clamp(m,-H,2*H),gr=x.createLinearGradient(0,up?0:H,0,gy===(up?0:H)?gy+(up?1:-1):gy);
  if(ink){gr.addColorStop(0,'#3b352d');gr.addColorStop(.6,'#1d1915');gr.addColorStop(1,body);}else{gr.addColorStop(0,body);gr.addColorStop(1,body);}
  x.fillStyle=gr;lid(x,pts,up,W,H,0,1);
  // 속눈썹 먹선: 가장자리를 따라 진한 한 획, 가운데는 한 번 더 굵게
  x.strokeStyle='#050403';x.lineJoin='round';x.lineCap='round';x.globalAlpha=.9;x.lineWidth=Math.max(1,H*.004);x.beginPath();
  pts.forEach((p,i)=>{const X=clamp(p[0],-10,W+10),Y=clamp(p[1],-H,2*H);if(i)x.lineTo(X,Y);else x.moveTo(X,Y);});x.stroke();
  const a=pts.length>>2,b=pts.length-a;x.globalAlpha=.75;x.lineWidth=Math.max(1.5,H*.008);x.beginPath();
  for(let i=a;i<b;i++){const X=clamp(pts[i][0],-10,W+10),Y=clamp(pts[i][1],-H,2*H);if(i>a)x.lineTo(X,Y);else x.moveTo(X,Y);}x.stroke();x.globalAlpha=1;}
 // 가로 한 줄(一) 빛
 const L=lineAmount(phase==='opening'?'open':phase==='closing'?'close':'shut',now()-t0);
 if(L.a>.01&&L.w>.005){const w=W*clamp(L.w,0,1),lg=x.createLinearGradient(W/2-w/2,0,W/2+w/2,0),col=ink?'236,222,190':'206,220,236';
  lg.addColorStop(0,'rgba('+col+',0)');lg.addColorStop(.5,'rgba('+col+',1)');lg.addColorStop(1,'rgba('+col+',0)');
  x.fillStyle=lg;x.globalAlpha=clamp(L.a*.85,0,1);const th=Math.max(1,H*.004);x.fillRect(W/2-w/2,G.cy-th/2,w,th);x.globalAlpha=clamp(L.a*.25,0,1);x.fillRect(W/2-w/2,G.cy-th*2.5,w,th*5);}
 x.globalAlpha=1;stats.frames++;}catch(e){fail(e);}}
function start(k){kind=k;phase=k==='open'?'opening':'closing';t0=now();cur=k==='open'?0:1;show(true);loop();}
function toIdle(){phase='idle';kind=null;cur=1;show(false);}
function step(){try{
 if(!enabled(false)){if(phase!=='idle')toIdle();return;}
 const started=!!g('started'),p=g('player');
 if(!started||!p){if(phase!=='idle')toIdle();return;}
 const hp=fin(p.hp,1),dead=hp<=0,visible=!dead&&!g('loading')&&!g('modal')&&!g('storyScene');
 if(phase==='idle'){if(dead){if(enabled(true))start('close');}return;}
 if(phase==='shut'){cur=0;if(visible)start('open');return;}
 const u=now()-t0,D=durations();
 if(phase==='opening'){if(dead){start('close');return;}cur=openness('open',u);if(u>=D.open){stats.opens++;toIdle();}return;}
 if(phase==='closing'){cur=openness('close',u);if(u>=D.close){stats.closes++;phase='shut';cur=0;return;}if(visible&&u>.15)start('open');}
}catch(e){fail(e);}}
function loop(){if(raf)return;const f=()=>{raf=0;step();if(phase!=='idle'){drawNow();if(phase==='opening'||phase==='closing')raf=requestAnimationFrame(f)||0;}};raf=requestAnimationFrame(f)||0;}
function arm(){if(!enabled(true))return;stats.arms++;phase='shut';kind=null;cur=0;show(true);drawNow();}
for(const name of ['newGame','restoreSave']){const base=g(name);if(typeof base!=='function')continue;
 const wrap=function(...a){try{arm();}catch(e){fail(e);}return base.apply(this,a);};
 try{if(name==='newGame')newGame=wrap;else restoreSave=wrap;}catch(_){window[name]=wrap;}}
// 쓰러지는 그 순간 바로 감기 시작(감시 타이머는 무거운 화면에서 늦을 수 있어 피격 뒤에도 한 번 본다). 결과·판정은 그대로 돌려준다.
{const base=g('hurt');if(typeof base==='function'){const wrap=function(...a){const r=base.apply(this,a);try{const p=g('player');if(p&&!(fin(p.hp,1)>0)&&phase!=='closing'&&phase!=='shut')step();}catch(e){fail(e);}return r;};try{hurt=wrap;}catch(_){window.hurt=wrap;}}}
ensureCanvas();if(!canvas&&typeof document.addEventListener==='function')document.addEventListener('DOMContentLoaded',ensureCanvas);
setInterval(()=>{step();if(phase==='opening'||phase==='closing')loop();},100);
function set(v){if(v&&typeof v==='object'&&'on' in v)prefs.on=!!v.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on)toIdle();}
window.__STORYWORLD_EYELID_R1091__=Object.freeze({revision:REV,durations,openness,lineAmount,geometry,step,drawNow,arm,set,
 prefs:()=>({...prefs}),state:()=>({phase,kind,openness:cur}),inspect:()=>({revision:REV,prefs:{...prefs},phase,openness:cur,scale:scale(),stats:{...stats},lastError})});
})();
