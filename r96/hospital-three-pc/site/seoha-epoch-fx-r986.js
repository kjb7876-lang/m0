// R986: 한서하 확률 패시브 '겹친 시간'(R949)의 임시 코드 그림 세 가지를 Dots 시트로 바꾼다(CX-0091SE).
//  · 소집 문(SE-07): 평행세계 영웅·수문장 아르벨리아가 나타나고 돌아갈 때. 24장(6×4), 문이 열렸다 닫히는 한 번.
//  · 열린 시간방 물결(SE-06): 아르벨리아 마지막 박자의 퍼지는 고리. 원본 시트 7~20장이 칸에서 잘려 있어
//    온전한 6번째 장 한 장만 떼어 코드가 넓힌다(Dots 에 다시 요청함).
//  · 초침 일격(SE-04): 아르벨리아 첫째 박자. 23장 시트.
//  되감긴 시간로(SE-05)는 게임 화면 심사에서 떨어져 넣지 않았다(크게 늘리면 흐리고 탁함, 구멍 비율이 판정과 다름).
// 판정·피해·시간은 R949 그대로다. 시트가 덜 읽혔거나 꺼져 있거나 좌표가 깨졌으면 false 를 돌려 R949 가 원래 그림을 그린다.
(()=>{
'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SEOHA_FX_R986__)return;
const REV='R986-seoha-dots-fx-1',KEY='storyworld.r986.seohaFx',DIR='assets/r986/';
const GATE={path:DIR+'seoha-summon-gate.webp',cw:128,ch:256,px:64,py:235,n:24,hero:179,life:.8};
const DIAL={path:DIR+'seoha-room-dial.webp',w:384,h:320,rx:335/2,ry:199/2};
const HAND={path:DIR+'seoha-hand-strike.webp',cw:384,ch:96,px:44,py:59,len:306.5,n:23,wind:6,fps:25};
const stats={gateDraws:0,roomDraws:0,handDraws:0,fallbacks:0,errors:0,lastError:null};
const asked={};let prefAt=-1e9,prefOn=true;
const num=v=>typeof v==='number'&&Number.isFinite(v);
const c01=v=>num(v)?Math.max(0,Math.min(1,v)):0;
function fail(err){stats.errors++;stats.lastError=String(err&&err.message||err);}
function readOn(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return !(v&&v.on===false);}catch(_){return true;}}
function on(){const n=Date.now();if(n-prefAt>=1000||n<prefAt){prefAt=n;prefOn=readOn();}return prefOn;}
function set(v){try{localStorage.setItem(KEY,JSON.stringify({on:!!v}));}catch(_){}prefAt=-1e9;return on();}
function img(p){try{const g=typeof readyImage==='function'?readyImage(p):null;if(g&&g.image)return g.image;const n=Date.now();if(n-(asked[p]||-1e9)>=1500){asked[p]=n;if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(err){fail(err);}return null;}
function scope(sc,o,f){if(typeof sc==='function')sc(o,f);else f();}

// 소집 문: R949 의 깜빡임 하나(b={x,y,t0,k})를 0.8초 동안 24장으로 그린다. 끝 0.2초는 남는 바닥 문자판을 옅게 지운다.
function gate(b,t,q,AH,sc){
  if(!b||!q||!on())return false;
  if(!num(b.x)||!num(b.y)||!num(b.t0)||!num(t)||!num(q.x)||!num(q.y)||!num(AH)||!(AH>0)){stats.fallbacks++;return false;}
  const im=img(GATE.path);if(!im){stats.fallbacks++;return false;}
  const k=num(b.k)&&b.k>0?b.k:1,u=c01((t-b.t0)/GATE.life),fr=Math.min(GATE.n-1,Math.floor(u*GATE.n)),S=AH/GATE.hero*k,a=u>.75?c01(1-(u-.75)/.25):1;
  try{scope(sc,{id:'r986:gate:'+b.t0.toFixed(2)+':'+b.x.toFixed(1)+':'+b.y.toFixed(1),kind:'effect',pxfSide:'hero',x:b.x,y:b.y+.02},()=>{
    ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=a;
      ctx.drawImage(im,(fr%6)*GATE.cw,Math.floor(fr/6)*GATE.ch,GATE.cw,GATE.ch,q.x-GATE.px*S,q.y-GATE.py*S,GATE.cw*S,GATE.ch*S);}finally{ctx.restore();}});
    stats.gateDraws++;return true;}catch(err){fail(err);return false;}
}

// 열린 시간방 물결: 화면 반지름 R(가로)·R/2(세로)의 금빛 문자판 고리 한 장을 f(1→0)로 옅어지게 그린다.
function room(p,R,f,cid,c,sc){
  if(!p||!on())return false;
  if(!num(p.x)||!num(p.y)||!num(R)||!(R>0)||!num(f)){stats.fallbacks++;return false;}
  const im=img(DIAL.path);if(!im){stats.fallbacks++;return false;}
  const a=c01(f);if(!(a>0))return true;
  const W=R*DIAL.w/DIAL.rx,H=R*.5*DIAL.h/DIAL.ry;
  try{scope(sc,{id:'r986:room:'+String(cid||''),kind:'effect',pxfSide:'hero',x:c&&num(c.x)?c.x:0,y:c&&num(c.y)?c.y:0,groundAligned:true},()=>{
    ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=a;ctx.drawImage(im,p.x-W/2,p.y-H/2,W,H);}finally{ctx.restore();}});
    stats.roomDraws++;return true;}catch(err){fail(err);return false;}
}

// 초침 일격(SE-04): a(뿌리)→b(끝) 화면 두 점 사이에 바늘 시트를 돌려 그린다. 예고(w 0→1)는 1~6장, 적중 뒤(since 초)는 7~23장.
// 다 끝났으면(true, 아무것도 안 그림) R949 도 그리지 않는다. 왼쪽을 향하면 위아래를 뒤집어 빛 방향을 지킨다.
function hand(a,b,lift,w,since,cid,c,sc){
  if(!a||!b||!on())return false;
  if(!num(a.x)||!num(a.y)||!num(b.x)||!num(b.y)||!num(lift)){stats.fallbacks++;return false;}
  const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy);if(!(L>1)){stats.fallbacks++;return false;}
  const im=img(HAND.path);if(!im){stats.fallbacks++;return false;}
  let fr;if(since==null||!num(since))fr=Math.min(HAND.wind-1,Math.floor(c01(w)*HAND.wind));else{fr=HAND.wind+Math.floor(Math.max(0,since)*HAND.fps);if(fr>=HAND.n)return true;}
  const S=L/HAND.len,ang=Math.atan2(dy,dx);
  try{scope(sc,{id:'r986:hand:'+String(cid||''),kind:'effect',pxfSide:'hero',x:c&&num(c.x)?c.x:0,y:c&&num(c.y)?c.y+.01:0},()=>{
    ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.translate(a.x,a.y-lift);ctx.rotate(ang);if(dx<0)ctx.scale(1,-1);
      ctx.drawImage(im,(fr%6)*HAND.cw,Math.floor(fr/6)*HAND.ch,HAND.cw,HAND.ch,-HAND.px*S,-HAND.py*S,HAND.cw*S,HAND.ch*S);}finally{ctx.restore();}});
    stats.handDraws++;return true;}catch(err){fail(err);return false;}
}

window.__STORYWORLD_SEOHA_FX_R986__=Object.freeze({revision:REV,on:()=>on(),set,gate,room,hand,paths:[GATE.path,DIAL.path,HAND.path],inspect:()=>({revision:REV,on:prefOn,...stats})});
try{img(GATE.path);img(DIAL.path);img(HAND.path);}catch(_){}
})();
