// R105 — 보스 스킬 이펙트.
//  · 도형 느낌의 바닥 장판(납작한 타원 + 시계 고리)을 색·단계가 있는 그림 이펙트로 바꾼다:
//    준비·예고(바닥 빛·돌아가는 점선 고리·차오르는 안쪽·눈금 + R74 effects 아틀라스 warning 그림)
//    → 명중(섬광·확장 고리·불꽃 파편 + impact 그림) → 잔류·상태이상(맥동하는 residue) → 소멸(fade).
//  · 보스가 광역 패턴(하늘 6장판·비 16장판·땅울림 10장판 등 한 번에 5개 이상)을 쓰면 보스 색의 운석·불덩이·혜성이
//    먼저 날아와 떨어지고, 떨어진 자리에서 넓게 충격파·파편이 퍼진다. 땅울림은 보스 자리에서 굴러간다.
//  · 보스 고유색: 봉합부인 장미빛, 순찰자 푸른 서리, 스토리텔러 붉은 실·검은 잉크(드라이브 고딕 7종의 붉은 6갈래 실과
//    잉크 갈고리 원화), 총지배인은 달리 '시간의 틈' 3키, 첫 번째 나팔은 모네 '수련 턱' 3키, RA 순찰자의 사방 탄막은 열쇠.
//  판정·피해·시간·개수는 바꾸지 않는다(그리기만). 저사양(lowFx)에서는 그림 층과 파편을 줄인다.
(()=>{'use strict';
if(window.__STORYWORLD_BOSS_FX_R105__)return;
const REV='R105-boss-fx-1',DIR='assets/r105/drive/';
const stats={fields:0,meteors:0,bursts:0,keys:0,patterns:0,failures:0};let lastError=null;
const fail=e=>{stats.failures++;lastError=String(e?.message||e).slice(0,160);};
const low=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
const FAMILY={fire:16,frost:216,corruption:290,shock:34};// R74 effects 아틀라스 계열의 평균 색상(도)
// 보스 색: a 주색, b 보조(밝은)색, elem 그림 계열, style 광역기 비행체(fireball|meteor|comet|thread), sheet 화가 3키.
const PAL={
 'dist00-boss':{a:[72,132,76],b:[186,255,196],elem:'corruption',style:'meteor'},
 'mb-ep1a11':{a:[214,62,98],b:[255,206,222],elem:'fire',style:'fireball'},
 'mb-ep1a08':{a:[78,116,196],b:[222,236,255],elem:'frost',style:'comet'},
 'c106-mid':{a:[86,46,124],b:[206,176,255],elem:'corruption',style:'meteor'},
 'b08-boss':{a:[228,122,42],b:[255,232,176],elem:'fire',style:'fireball'},
 'mb-ep1b01':{a:[206,154,44],b:[255,242,196],elem:'fire',style:'fireball'},
 'a11-boss':{a:[126,204,234],b:[242,252,255],elem:'frost',style:'comet'},
 'h103-boss':{a:[156,64,186],b:[242,206,255],elem:'corruption',style:'meteor'},
 'mb-murder02':{a:[64,94,176],b:[214,228,255],elem:'frost',style:'comet',keys:true},
 'b06-boss':{a:[196,126,62],b:[255,224,176],elem:'shock',style:'fireball',sheet:'dali'},
 'mb-ep1b03':{a:[204,172,92],b:[255,250,222],elem:'shock',style:'fireball'},
 'c102-boss':{a:[196,34,54],b:[255,176,176],elem:'fire',style:'meteor',sheet:'monet'},
 'u203-mid':{a:[170,44,40],b:[255,196,176],elem:'shock',style:'comet'},/* R180: S-06 디스토피아 상대 초인(붉은 코어) */
 'u201-mid':{a:[196,218,240],b:[255,255,255],elem:'frost',style:'comet'},
 'c103-boss':{a:[176,30,52],b:[255,128,146],elem:'fire',style:'thread'},
 'c104-mid':{a:[126,64,204],b:[250,222,126],elem:'corruption',style:'meteor'},
 'kair-great-03':{a:[232,202,122],b:[255,255,242],elem:'shock',style:'fireball'}};
const FALLBACK=[{a:[204,72,52],b:[255,206,170],elem:'fire',style:'fireball'},{a:[72,124,210],b:[214,236,255],elem:'frost',style:'comet'},{a:[136,64,186],b:[232,206,255],elem:'corruption',style:'meteor'},{a:[204,172,84],b:[255,246,214],elem:'shock',style:'fireball'},{a:[64,160,120],b:[196,255,226],elem:'corruption',style:'meteor'},{a:[214,94,140],b:[255,214,236],elem:'fire',style:'fireball'}];
const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;};
const hue=([r,g,b])=>{r/=255;g/=255;b/=255;const M=Math.max(r,g,b),m=Math.min(r,g,b),d=M-m;if(!d)return 0;const h=M===r?((g-b)/d)%6:M===g?(b-r)/d+2:(r-g)/d+4;return(h*60+360)%360;};
// three 렌더 기록기는 그라디언트 fillStyle을 기본색으로 바꿔 그리므로, 단색 타원을 겹쳐 부드러운 빛을 만든다.
function glow(x,y,rx,ry,stops,steps=4){const A=f=>{let prev=stops[0];for(const st of stops){if(f<=st[0]){const [t0,c0,a0]=prev,[t1,c1,a1]=st,k=t1===t0?0:(f-t0)/(t1-t0);return[c0,a0+(a1-a0)*k];}prev=st;}const l=stops[stops.length-1];return[l[1],l[2]];};
 for(let k=steps;k>=1;k--){const f=k/steps,[c,a]=A(f),[,a2]=A(Math.min(1,(k+1)/steps));const al=k===steps?a:Math.max(0,a-a2);if(al<=0.004)continue;ctx.fillStyle=rgba(c,al);ellipse(x,y,rx*f,ry*f);ctx.fill();}}
const rgba=(c,a)=>'rgba('+c[0]+','+c[1]+','+c[2]+','+Math.max(0,Math.min(1,a)).toFixed(3)+')';
const owners=new Map();
function enemyOf(id){if(!id||typeof room==='undefined'||!room?.enemies)return null;let e=owners.get(id);if(e&&room.enemies.includes(e))return e;e=room.enemies.find(v=>v.id===id)||null;if(e)owners.set(id,e);return e;}
function palOf(e){if(!e)return null;return PAL[e.nativeId]||PAL[e.id]||FALLBACK[hash(e.nativeId||e.name||e.id)%FALLBACK.length];}
// ---- 그림 층: R74 effects 아틀라스 셀과 드라이브 원화 ----
let atlasReq=false;
function cellOf(fam,phase){const a=window.StoryArtR74?.atlases?.effects;if(!a?.cells)return null;const c=a.cells.find(v=>v.key===fam+':'+phase);if(!c)return null;const row=readyImage(a.path);if(!row){if(!(typeof imageCache!=='undefined'&&imageCache.has(a.path))){atlasReq=true;try{addImage(a.path);}catch(e){fail(e);}}return null;}return{im:row.image,c};}
function drawCell(fam,phase,x,y,h,{alpha=1,delta=0,blend='screen'}={}){const r=cellOf(fam,phase);if(!r)return false;const[sx,sy,sw,sh]=r.c.sourceRect,w=h*sw/sh;ctx.save();ctx.globalAlpha*=Math.max(0,Math.min(1,alpha));ctx.globalCompositeOperation=blend;/* 그리기 기록기(three 렌더)는 filter가 걸린 이미지를 그리지 않으므로 색상 회전 대신 보스 속성(elem)에 맞는 아틀라스 계열을 그대로 쓴다 */ctx.drawImage(r.im,sx,sy,sw,sh,x-w/2,y-h*(r.c.pivot[1]/sh),w,h);ctx.restore();return true;}
function img(path){const row=readyImage(path);if(row)return row.image;if(!(typeof imageCache!=='undefined'&&imageCache.has(path))){try{addImage(path);}catch(e){fail(e);}}return null;}// 메모리 정리 뒤에도 다시 요청
function drawImg(path,x,y,h,{alpha=1,angle=0,blend='source-over',flat=false}={}){const im=img(path);if(!im)return false;const w=h*im.naturalWidth/im.naturalHeight;ctx.save();ctx.globalAlpha*=Math.max(0,Math.min(1,alpha));ctx.globalCompositeOperation=blend;ctx.translate(x,y);if(angle)ctx.rotate(angle);if(flat)ctx.scale(1,.58);ctx.drawImage(im,-w/2,-h/2,w,h);ctx.restore();return true;}
const ellipse=(x,y,rx,ry)=>{ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);};
// ---- 장판: 준비·예고 → 명중 → 잔류 → 소멸 ----
// three 렌더는 'hazard' 소유 도형을 바닥면(groundAligned)으로 옮겨 그려 보이지 않는다. R102 영웅 이펙트처럼
// 'effect' 소유로 기록하면 도형·이미지가 모두 제 색으로 보인다(기록기가 없는 Legacy 캔버스에서는 그대로 그린다).
const scope=(o,fn)=>{if(typeof ctx!=='undefined'&&typeof ctx?.scope==='function')return ctx.scope(o,fn);return fn();};
const clamp01=v=>Math.max(0,Math.min(1,v));
function drawField(h,P){scope({id:'r105:field:'+h.id,kind:'effect',x:h.x,y:h.y,r105Field:true},()=>fieldBody(h,P));}
function fieldBody(h,P){const q=project(h.x,h.y),R=Math.max(4,h.radius*TILE*zoom),w=R*2,warn=h.age<h.warning,rem=h.life-h.age,lo=low(),sid=Number.isFinite(h.id)?h.id:hash(h.id)%977,pulse=.5+.5*Math.sin(time*9+sid),sheet=P.sheet||null;// 문자열 id(검사 하네스)도 숫자 씨앗으로
 ctx.save();ctx.translate(q.x,q.y-4*zoom);ctx.lineCap='round';
 if(warn){const u=clamp01(h.age/h.warning);
  glow(0,0,R*1.1,R*1.1*.58,[[0,P.a,.26+.2*u],[.6,P.a,.12+.12*u],[1,P.a,0]]);// 바닥 빛
  ctx.lineWidth=Math.max(1,2.2*zoom);ctx.strokeStyle=rgba(P.b,.5+.4*pulse);ellipse(0,0,R,R*.58);ctx.stroke();// 테두리 고리
  if(!lo){ctx.lineWidth=Math.max(1,1.4*zoom);ctx.strokeStyle=rgba(P.b,.6);const seg=14,rot=time*1.6;for(let k=0;k<seg;k++){const a0=rot+k*Math.PI*2/seg,a1=a0+Math.PI*2/seg*.55;ctx.beginPath();ctx.ellipse(0,0,R*.78,R*.78*.58,0,a0,a1);ctx.stroke();}}// 회전 점선
  ctx.globalCompositeOperation='lighter';ctx.fillStyle=rgba(P.a,.18+.28*u);ellipse(0,0,R*.9*u,R*.9*u*.58);ctx.fill();// 차오르는 중심
  if(!lo){ctx.strokeStyle=rgba(P.b,.35+.45*pulse);ctx.lineWidth=Math.max(1,1.6*zoom);for(let k=0;k<8;k++){const a=k*Math.PI/4+time*.9;ctx.beginPath();ctx.moveTo(Math.cos(a)*R*.56,Math.sin(a)*R*.56*.58);ctx.lineTo(Math.cos(a)*R*.74,Math.sin(a)*R*.74*.58);ctx.stroke();}}// 눈금
  ctx.globalCompositeOperation='source-over';
  if(!lo)drawCell(P.elem,'warning',0,R*.2,w*.95,{alpha:.34+.46*u});// 속성 예고 질감
  if(sheet)drawImg(DIR+'fx-'+sheet+'-1.webp',0,0,w*1.05,{alpha:.3+.35*u,flat:sheet==='dali',blend:'screen'});
 }else{const t=h.age-h.warning;
  if(t<.34){const k=t/.34;
   ctx.globalCompositeOperation='lighter';glow(0,0,R*(1+1.3*k),R*(1+1.3*k)*.58,[[0,P.b,.9*(1-k)],[.45,P.a,.55*(1-k)],[1,P.a,0]]);// 터지는 빛
   ctx.lineWidth=Math.max(1,3.2*zoom*(1-k));ctx.strokeStyle=rgba(P.b,.9*(1-k));ellipse(0,0,R*(1+1.9*k),R*(1+1.9*k)*.58);ctx.stroke();// 충격 고리
   if(!lo){ctx.strokeStyle=rgba(P.b,.85*(1-k));ctx.lineWidth=Math.max(1,1.8*zoom);for(let s=0;s<10;s++){const a=s*Math.PI/5+sid*.7,l=R*(.35+.9*k);ctx.beginPath();ctx.moveTo(Math.cos(a)*R*.2,Math.sin(a)*R*.2*.58);ctx.lineTo(Math.cos(a)*l,Math.sin(a)*l*.58-l*.25);ctx.stroke();}}// 불꽃 조각
   ctx.globalCompositeOperation='source-over';
   if(P.style==='thread')drawImg(DIR+'fx-ink-hook.webp',0,-R*.25,w*(1.1+.8*k),{alpha:1-k*.7,angle:sid%2?.6:-.6});
   else{drawCell(P.elem,'impact',0,R*.25,w*(1.1+1.1*k),{alpha:1-k});if(sheet)drawImg(DIR+'fx-'+sheet+'-2.webp',0,0,w*1.1*(1+.3*k),{alpha:.7*(1-k*.5),flat:sheet==='dali',blend:'screen'});}
  }else{const f=clamp01(rem*3),pl=.6+.4*Math.sin(time*5+sid);
   glow(0,0,R,R*.58,[[0,P.a,.3*f*pl],[1,P.a,0]],3);ctx.lineWidth=Math.max(1,1.4*zoom);ctx.strokeStyle=rgba(P.b,.35*f);ellipse(0,0,R*.92,R*.92*.58);ctx.stroke();// 잔류
   if(P.style==='thread')drawImg(DIR+'fx-ink-hook.webp',0,-R*.25,w*1.6,{alpha:.55*f,angle:sid%2?.6:-.6});
   else if(sheet)drawImg(DIR+'fx-'+sheet+'-3.webp',0,0,w*1.3,{alpha:.75*f,flat:sheet==='dali',blend:'screen'});
   else if(!lo){drawCell(P.elem,'residue',0,R*.2,w*.9,{alpha:.55*f*pl});if(f<1)drawCell(P.elem,'fade',0,R*.2,w*.9,{alpha:.5*(1-f)});}// 소멸
  }}
 ctx.restore();stats.fields++;}
// ---- 광역기: 운석·불덩이가 날아온 뒤 넓게 터진다 ----
const seen=new Set(),pending=new Map(),meteors=[];const R162_OWN=new Set(['clones','meteor','tentacles']);// R163: R162 분신·운석·촉수는 자기 그림(pixelfx)이 있어 이 금빛 낙하 연출을 덧그리지 않는다
let lastRoom=null,mid=0;
function scan(){if(typeof hazards==='undefined'||!Array.isArray(hazards))return;if(room!==lastRoom){lastRoom=room;seen.clear();meteors.length=0;owners.clear();}
 pending.clear();const live=new Set();
 for(const h of hazards){live.add(h.id);if(h.type!=='field'||!h.owner||seen.has(h.id)||R162_OWN.has(h.samongPattern))continue;seen.add(h.id);const e=enemyOf(h.owner);if(!e||!e.boss)continue;let g=pending.get(h.owner);if(!g){g={e,list:[]};pending.set(h.owner,g);}g.list.push(h);}
 if(seen.size>400)for(const id of seen)if(!live.has(id))seen.delete(id);
 for(const g of pending.values()){if(g.list.length<5&&!g.list.some(h=>h.radius>=3.2))continue;launch(g.e,g.list);}}
function launch(e,list){const P=palOf(e);let cx=0,cy=0;for(const h of list){cx+=h.x;cy+=h.y;}cx/=list.length;cy/=list.length;let ext=0,warn=9;for(const h of list){ext=Math.max(ext,Math.hypot(h.x-cx,h.y-cy)+h.radius);warn=Math.min(warn,h.warning);}
 const line=list[0].samongPattern==='ground',m={e,P,cx,cy,ext:Math.max(2.5,ext),t0:time,dur:Math.max(.55,Math.min(1.6,warn)),mode:line?'roll':'drop',from:{x:e.x,y:e.y},dir:hash(e.id+':'+list[0].id)%2?1:-1,seed:list[0].id,landed:false,tl:0};
 if(line){let far=list[0];for(const h of list)if(Math.hypot(h.x-e.x,h.y-e.y)>Math.hypot(far.x-e.x,far.y-e.y))far=h;m.cx=(e.x+far.x)/2;m.cy=(e.y+far.y)/2;m.ext=Math.hypot(far.x-e.x,far.y-e.y)/2+1.5;}
 m.id=++mid;while(meteors.length>=4)meteors.shift();meteors.push(m);stats.meteors++;}
function flight(m,k,lo){const P=m.P,to=project(m.cx,m.cy),base=Math.max(26,Math.min(90,m.ext*TILE*zoom*.42));let x,y,sz;
 if(m.mode==='roll'){const fr=project(m.from.x,m.from.y),u=k*k*(3-2*k),hop=Math.sin(k*Math.PI)*22*zoom;x=fr.x+(to.x-fr.x)*u;y=fr.y+(to.y-fr.y)*u-18*zoom-hop;sz=base*(.7+.3*k);ctx.fillStyle='rgba(0,0,0,.28)';ellipse(x,y+18*zoom+hop,sz*.6,sz*.24);ctx.fill();}
 else{const u=k*k,sx=to.x+m.dir*(W*.28+m.ext*TILE*zoom),sy=to.y-H*.62;x=sx+(to.x-sx)*u;y=sy+(to.y-sy)*u;sz=base*(.35+.65*u);ctx.fillStyle='rgba(0,0,0,'+(.12+.2*u).toFixed(2)+')';ellipse(to.x,to.y,sz*(.4+.6*u),sz*(.4+.6*u)*.4);ctx.fill();}
 const ang=Math.atan2(to.y-y,to.x-x);
 if(P.style==='thread'){drawImg(DIR+'fx-thread.webp',x,y,sz*2.6,{alpha:.55+.45*k,angle:time*2.2+m.seed});ctx.globalCompositeOperation='lighter';ctx.strokeStyle=rgba(P.b,.5);ctx.lineWidth=Math.max(1,1.2*zoom);for(let s=0;s<6;s++){const a=s*Math.PI/3+time*2.2+m.seed;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*sz*2.4,y+Math.sin(a)*sz*2.4);ctx.stroke();}ctx.globalCompositeOperation='source-over';return;}
 ctx.globalCompositeOperation='lighter';
 const n=lo?3:7;for(let s=1;s<=n;s++){const f=s/n,tx=x-Math.cos(ang)*sz*1.4*f*(1+s*.25),ty=y-Math.sin(ang)*sz*1.4*f*(1+s*.25),r=Math.max(2,sz*(.9-.7*f));glow(tx,ty,r,r,[[0,P.b,.5*(1-f)],[.5,P.a,.35*(1-f)],[1,P.a,0]],3);}
 glow(x,y,sz,sz,[[0,[255,255,255],.95],[.3,P.b,.95],[.7,P.a,.75],[1,P.a,0]],5);
 if(P.style==='meteor'){ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba(28,18,24,.92)';ctx.beginPath();ctx.arc(x,y,sz*.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle=rgba(P.b,.8);ctx.lineWidth=Math.max(1,2*zoom);ctx.beginPath();ctx.arc(x,y,sz*.5,ang+2.2,ang+4.2);ctx.stroke();ctx.globalCompositeOperation='lighter';}
 else if(P.style==='comet'){ctx.strokeStyle=rgba(P.b,.8);ctx.lineWidth=Math.max(1,1.5*zoom);for(let s=0;s<5;s++){const a=ang+Math.PI+(s-2)*.22;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*sz*(2.2+s*.3),y+Math.sin(a)*sz*(2.2+s*.3));ctx.stroke();}}
 try{texture(VFX.bolt,x,y,sz*2.2,sz*1.9,{alpha:.8,angle:ang});}catch(e){}
 if(!lo)for(let s=0;s<6;s++){const a=(hash(m.seed+':'+s)%628)/100+time*3,d=sz*(1.2+((hash(s+':'+m.seed)%50)/100));ctx.fillStyle=rgba(P.b,.6);ctx.beginPath();ctx.arc(x+Math.cos(a)*d-Math.cos(ang)*sz*s*.3,y+Math.sin(a)*d*.6-Math.sin(ang)*sz*s*.3,Math.max(1,sz*.08),0,Math.PI*2);ctx.fill();}
 ctx.globalCompositeOperation='source-over';}
function burst(m,kb,lo){const P=m.P,q=project(m.cx,m.cy),Rx=m.ext*TILE*zoom*1.15,Ry=Rx*.58,e=1-Math.pow(1-kb,3);
 ctx.save();ctx.translate(q.x,q.y);ctx.globalCompositeOperation='lighter';
 glow(0,0,Math.max(2,Rx*e),Math.max(1,Ry*e),[[0,P.b,.55*(1-kb)],[.5,P.a,.35*(1-kb)],[1,P.a,0]]);
 for(const[d,wd]of[[0,9],[.18,5]]){const kk=Math.max(0,Math.min(1,(kb-d)/(1-d)));if(kk<=0)continue;const ee=1-Math.pow(1-kk,3);ctx.lineWidth=Math.max(1,wd*zoom*(1-kk));ctx.strokeStyle=rgba(P.b,.9*(1-kk));ellipse(0,0,Rx*ee,Ry*ee);ctx.stroke();}
 if(P.style==='thread'){ctx.strokeStyle=rgba(P.a,.9*(1-kb));ctx.lineWidth=Math.max(1,1.6*zoom);for(let s=0;s<12;s++){const a=s*Math.PI/6+m.seed*.3,l=Rx*e*(.6+(hash(s+':'+m.seed)%40)/100);ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(Math.cos(a+.4)*l*.5,Math.sin(a+.4)*l*.5*.58,Math.cos(a)*l,Math.sin(a)*l*.58);ctx.stroke();}
  ctx.globalCompositeOperation='source-over';for(let s=0;s<3;s++){const a=s*2.1+m.seed;drawImg(DIR+'fx-ink-hook.webp',Math.cos(a)*Rx*.45*e,Math.sin(a)*Ry*.45*e,Rx*.9*(.6+.4*e),{alpha:.85*(1-kb),angle:a});}ctx.restore();return;}
 if(!lo){const n=22;for(let s=0;s<n;s++){const a=s*Math.PI*2/n+(hash(s+':'+m.seed)%30)/100,sp=.6+(hash(m.seed+':'+s)%60)/100,d=Rx*e*sp,yy=Math.sin(a)*d*.58-Math.sin(kb*Math.PI)*Rx*.35*sp;ctx.fillStyle=rgba(s%3?P.b:P.a,.9*(1-kb));ctx.beginPath();ctx.arc(Math.cos(a)*d,yy,Math.max(1,(3.5-2.5*kb)*zoom),0,Math.PI*2);ctx.fill();}}
 ctx.globalCompositeOperation='source-over';
 if(P.style==='meteor'){ctx.strokeStyle='rgba(30,22,28,'+(.5*(1-kb)).toFixed(2)+')';ctx.lineWidth=Math.max(1,12*zoom*(1-kb));ellipse(0,0,Rx*e*.85,Ry*e*.85);ctx.stroke();}
 if(!lo&&kb<.6)drawCell(P.elem,'impact',0,Ry*.3,Rx*(1.2+.8*e),{alpha:(1-kb/.6)*.9,delta:hue(P.a)-FAMILY[P.elem]});
 ctx.restore();}
function drawMeteors(){if(!meteors.length)return;const lo=low();
 for(let i=meteors.length-1;i>=0;i--){const m=meteors[i],k=(time-m.t0)/m.dur;
  if(k<1){scope({id:'r105:meteor:'+m.id,kind:'effect',x:m.cx,y:m.cy,r105Meteor:true},()=>{ctx.save();flight(m,k,lo);ctx.restore();});continue;}
  if(!m.landed){m.landed=true;m.tl=time;stats.bursts++;try{if(typeof shake!=='undefined')shake=Math.max(shake,lo?.45:1.1);if(typeof flash!=='undefined')flash=Math.max(flash,.18);}catch(e){}}
  const kb=(time-m.tl)/.95;if(kb>=1){meteors.splice(i,1);continue;}scope({id:'r105:burst:'+m.id,kind:'effect',x:m.cx,y:m.cy,r105Meteor:true},()=>{ctx.save();burst(m,kb,lo);ctx.restore();});}}
// ---- 보스 패턴 예고 연출(사방·땅·하늘·비): R103이 부르던 영웅 이펙트의 붉은 고정색 대신 보스 색으로 그린다 ----
const pats=[];
function bossPattern(kind,x,y,P){if(!Number.isFinite(x+y))return false;pats.push({id:++mid,kind,x,y,P,t0:time,life:kind==='rain'?1.6:1.3,seed:Math.random()*6.28,n:{sides:14,ground:12,sky:9,rain:30}[kind]||12});stats.patterns++;return true;}
function patBody(p,u){const q=project(p.x,p.y),h=actorHeight(),R=h*2.6,P=p.P,lo=low(),n=lo?Math.ceil(p.n/2):p.n,fade=u<.75?1:1-(u-.75)/.25,rnd=(i,k)=>(hash(p.seed.toFixed(3)+':'+i+':'+k)%1000)/1000;
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
 if(p.kind==='rain'){for(let i=0;i<n;i++){const ph=(u*1.7+rnd(i,1))%1,x=q.x+(rnd(i,2)-.5)*R*2.6,top=q.y-h*2.4-rnd(i,3)*h,y=top+(q.y+(rnd(i,4)-.5)*R*1.3-top)*ph,len=h*.4;ctx.strokeStyle=rgba(ph<.85?P.b:P.a,.75*fade*(ph<.85?1:1-(ph-.85)/.15));ctx.lineWidth=Math.max(1,1.6*zoom);ctx.beginPath();ctx.moveTo(x+len*.12,y-len);ctx.lineTo(x,y);ctx.stroke();if(ph>.85){ctx.strokeStyle=rgba(P.b,.5*fade);ctx.beginPath();ctx.ellipse(x,y,h*.12*(ph-.85)/.15*3,h*.05*(ph-.85)/.15*3,0,0,Math.PI*2);ctx.stroke();}}}
 else if(p.kind==='sky'){for(let i=0;i<n;i++){const a=i*Math.PI*2/n+p.seed+u*2.4,r=R*(1.15-.55*u),x=q.x+Math.cos(a)*r,y=q.y+Math.sin(a)*r*.58-h*1.6*(1-u);ctx.strokeStyle=rgba(P.b,.8*fade);ctx.lineWidth=Math.max(1,2*zoom);ctx.beginPath();ctx.moveTo(x,y-h*.3);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle=rgba(P.a,.55*fade);ctx.beginPath();ctx.arc(x,y,Math.max(1,3*zoom),0,Math.PI*2);ctx.fill();}}
 else if(p.kind==='ground'){for(let i=0;i<n;i++){const a=i*Math.PI*2/n+p.seed,l=R*(.3+.9*u)*(.7+rnd(i,1)*.5);ctx.strokeStyle=rgba(i%2?P.a:P.b,.75*fade);ctx.lineWidth=Math.max(1,(2.2-1.2*u)*zoom);ctx.beginPath();ctx.moveTo(q.x+Math.cos(a)*R*.15,q.y+Math.sin(a)*R*.15*.58);ctx.lineTo(q.x+Math.cos(a)*l,q.y+Math.sin(a)*l*.58);ctx.stroke();}
  ctx.strokeStyle=rgba(P.b,.6*fade);ctx.lineWidth=Math.max(1,1.5*zoom);ctx.beginPath();ctx.ellipse(q.x,q.y,R*(.2+.8*u),R*(.2+.8*u)*.58,0,0,Math.PI*2);ctx.stroke();}
 else{for(let i=0;i<n;i++){const a=i*Math.PI*2/n+p.seed,r0=R*(1.7-1.3*u),r1=r0-R*.3;ctx.strokeStyle=rgba(P.b,.8*fade);ctx.lineWidth=Math.max(1,1.8*zoom);ctx.beginPath();ctx.moveTo(q.x+Math.cos(a)*r0,q.y+Math.sin(a)*r0*.58);ctx.lineTo(q.x+Math.cos(a)*Math.max(R*.25,r1),q.y+Math.sin(a)*Math.max(R*.25,r1)*.58);ctx.stroke();}}
 ctx.restore();}
function drawPats(){for(let i=pats.length-1;i>=0;i--){const p=pats[i],u=(time-p.t0)/p.life;if(u>1||u<-1){pats.splice(i,1);continue;}if(u<0)continue;scope({id:'r105:pat:'+p.id,kind:'effect',x:p.x,y:p.y,r105Pattern:true},()=>{try{patBody(p,u);}catch(e){fail(e);}});}}
// 원래 draw() 밖에서 그리면 three 기록기에 잡히지 않으므로, R102처럼 effects 목록의 표지 항목을 통해 draw 안에서 그린다.
const SENTINEL={type:'r105-meteor',x:0,y:0,age:0,life:Infinity,r105Sentinel:true};
function install(){
 if(typeof drawHazard==='function'){const base=drawHazard;drawHazard=function(h,...a){if(h&&h.type==='field'&&h.owner&&Number.isFinite(h.radius)){const e=enemyOf(h.owner);if(e){try{drawField(h,palOf(e));return;}catch(err){fail(err);}}}return base.apply(this,[h,...a]);};}
 if(typeof tick==='function'){const base=tick;tick=function(dt,...a){const r=base.apply(this,[dt,...a]);try{if(typeof loading!=='undefined'&&!loading&&room&&player){scan();if((meteors.length||pats.length)&&Array.isArray(effects)&&!effects.includes(SENTINEL)){SENTINEL.age=0;effects.push(SENTINEL);}SENTINEL.age=0;}}catch(err){fail(err);}return r;};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r105-meteor'){try{drawPats();drawMeteors();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 // R103 보스 패턴 예고(fxPattern)는 window.__STORYWORLD_HERO_FX_R103__.pattern을 매번 읽어 부르므로, 보스전 중 적대 패턴만 보스 색으로 돌린다.
 try{const H=window.__STORYWORLD_HERO_FX_R103__;if(H&&typeof H.pattern==='function'&&!H.r105Boss){const basePat=H.pattern;window.__STORYWORLD_HERO_FX_R103__=Object.freeze({...H,r105Boss:true,pattern:(kind,x,y,opt={})=>{try{const x3=room?.samongR103;if(opt?.hostile!==false&&x3?.bossUp){const b=(room.enemies||[]).find(e=>e.id===x3.boss);if(b&&b.hp>0)return bossPattern(kind,x,y,palOf(b));}}catch(err){fail(err);}return basePat(kind,x,y,opt);}});}}catch(err){fail(err);}
 if(typeof makeShot==='function'){const base=makeShot;makeShot=function(x,y,angle,speed,damage,opt={}){try{if(opt&&opt.samongPattern==='sides'&&room?.samongR103?.ep===8){opt={...opt,asset:DIR+'fx-keys-flight.webp',scale:(opt.scale||1)*2.1,r105Key:true};img(DIR+'fx-keys-flight.webp');stats.keys++;}}catch(err){fail(err);}return base.call(this,x,y,angle,speed,damage,opt);};}
}
try{install();}catch(e){fail(e);}
window.__STORYWORLD_BOSS_FX_R105__=Object.freeze({revision:REV,palette:PAL,fallback:FALLBACK,family:FAMILY,palOf,meteors:()=>meteors.map(m=>({cx:m.cx,cy:m.cy,ext:m.ext,mode:m.mode,style:m.P.style,landed:m.landed,age:time-m.t0})),inspect:()=>({revision:REV,stats:{...stats},lastError,meteors:meteors.length})});
})();
