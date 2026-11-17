// R1119 — 페르소나 '순수악의' 보스 탄 그림: 구글 드라이브 11-16·11-17 Dots 검토본(사용자 2026-11-17 04:38Z·04:48Z "스킬 이펙트 5종 … 확인 개선적용").
//  엔진은 탄을 정지 그림 assets/rc134/persona-skills/<key>.png 한 장으로 그린다(ranged3 → enemyShot). 렌더러가 받는 그 탄 명령의 그림만 Dots 시트 칸으로 바꾼다.
//  · 끝없는 갈망 clock · 감춘 충동 diamond · 순수악의의 분기 star(공식 5번째 중심광 + 비대칭 분기) · 악의의 관통 lance · 되비친 집착 shield · 내면의 소용돌이 vortex:
//    날아가는 동안 비행·루프 8칸, 탄이 사라지면(적중·수명 끝) 마지막 자리에 접촉·소멸 6칸(마지막 칸 완전 투명) 한 번.
//  · 욕망의 씨앗 small-orb · 악의 시선 eye · 욕망의 일식 eclipse 는 드라이브에 쓸 수 있는 시트가 없어 그대로(작은 구체·시선·일식은 원본 미확보로 보류 — 드라이브 메모).
//  · 칸 크기·회전은 원래 탄 사각형의 축을 따른다(256 칸 = 원래 그림 256, lance 는 384 칸이라 1.5배, 피벗은 시트 spec 값).
//  판정·피해·속도·수명·탄 수는 바꾸지 않는다(그림만). R1104 렌더 감싸기가 매 render 에 process 를 부른다. 끄기: localStorage['storyworld.r1119.personaSkillFx']='0'.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_PERSONA_SKILL_FX_R1119__)return;
const REV='R1119-persona-skill-fx-1',KEY='storyworld.r1119.personaSkillFx';
const FX={
 clock:{flight:'assets/r1119/fx-clock-flight.webp',contact:'assets/r1119/fx-clock-contact.webp',cw:256,ch:256,piv:[128,128],ms:80,cms:80},
 diamond:{flight:'assets/r1119/fx-diamond-flight.webp',contact:'assets/r1119/fx-diamond-contact.webp',cw:256,ch:256,piv:[128,128],ms:80,cms:80},
 star:{flight:'assets/r1119/fx-star-flight.webp',contact:'assets/r1119/fx-star-contact.webp',cw:256,ch:256,piv:[146,128],ms:90,cms:90},
 lance:{flight:'assets/r1119/fx-lance-flight.webp',contact:'assets/r1119/fx-lance-contact.webp',cw:384,ch:384,piv:[192,192],ms:80,cms:80,pingpong:[3,7]},
 shield:{flight:'assets/r1119/fx-shield-flight.webp',contact:'assets/r1119/fx-shield-contact.webp',cw:256,ch:256,piv:[128,130],ms:90,cms:90},
 vortex:{flight:'assets/r1119/fx-vortex-flight.webp',contact:'assets/r1119/fx-vortex-contact.webp',cw:256,ch:256,piv:[128,128],ms:100,cms:100}};
const FLIGHT_N=8,CONTACT_N=6,MAX_TRACK=64,MAX_CONTACT=24;
const RX=/assets\/rc134\/persona-skills\/(clock|diamond|star|lance|shield|vortex)\.png/;
const stats={frames:0,swaps:0,contacts:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
function set(v){on=v!==false;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}if(!on){track.clear();contacts.length=0;}return on;}
const T=()=>{try{return typeof time==='number'&&Number.isFinite(time)?time:null;}catch(_){return null;}};
const hasDom=()=>{try{return typeof Image==='function'&&typeof document!=='undefined';}catch(_){return false;}};
const IM={};function img(src){let r=IM[src];if(r)return r.state==='ready'?r.im:null;r=IM[src]={state:'wait',im:null};if(!hasDom()){r.state='failed';return null;}
 try{const im=new Image();im.crossOrigin='anonymous';im.decoding='async';im.onload=()=>{im.__storyworldStaticSource={path:'r1119:fx-src:'+src};r.im=im;r.state='ready';};im.onerror=()=>{r.state='failed';};
  im.src=(()=>{try{return new URL(src,document.baseURI||window.location?.href).href;}catch(_){return src;}})();}catch(e){r.state='failed';fail(e);}return null;}
function prewarm(){for(const k in FX){img(FX[k].flight);img(FX[k].contact);}}
// 페르소나가 방에 있을 때만 미리 읽는다(다른 곳에선 안 받음)
function want(){try{const rm=typeof room!=='undefined'?room:null;if(rm&&Array.isArray(rm.enemies)&&rm.enemies.some(e=>e&&e.persona))prewarm();}catch(_){}}
const okPt=p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1]);
// 원래 탄 사각형(점 P, 원본 칸 sr)의 축으로 시트 칸(cw×ch, 피벗)을 놓는다: 원래 그림 가운데 = 피벗
function quad(P,sr,D){const U=[(P[1][0]-P[0][0])/sr[2],(P[1][1]-P[0][1])/sr[2]],V=[(P[3][0]-P[0][0])/sr[3],(P[3][1]-P[0][1])/sr[3]],
 C=[(P[0][0]+P[1][0]+P[2][0]+P[3][0])/4,(P[0][1]+P[1][1]+P[2][1]+P[3][1])/4],at=(u,v)=>[C[0]+U[0]*(u-D.piv[0])+V[0]*(v-D.piv[1]),C[1]+U[1]*(u-D.piv[0])+V[1]*(v-D.piv[1])];
 return [at(0,0),at(D.cw,0),at(D.cw,D.ch),at(0,D.ch)];}
function put(c,im,D,name,f,pts){c.image=im;c.mutable=false;c.sourcePath='r1119:fx:'+name+':'+f;c.immutableTint=im.__storyworldStaticSource;c.sourceRect=[f*D.cw,0,D.cw,D.ch];
 c.imageSize=[im.naturalWidth||im.width||D.cw*(name.endsWith('contact')?CONTACT_N:FLIGHT_N),im.naturalHeight||im.height||D.ch];c.points=pts;c.r1119=true;}
function flightFrame(D,t){const n=Math.floor(t*1000/D.ms);if(D.pingpong){const [a,b]=D.pingpong,L=b-a,k=n%(2*L);return a+(k<=L?k:2*L-k);}return ((n%FLIGHT_N)+FLIGHT_N)%FLIGHT_N;}
const track=new Map(),contacts=[];let tick=0;
function process(cmds){if(!on||!Array.isArray(cmds))return 0;const t=T();if(t==null)return 0;want();tick++;stats.frames++;let n=0;
 for(const c of cmds){if(!c||c.kind!=='image'||c.r1119)continue;const m=RX.exec(String(c.sourcePath||''));if(!m)continue;const P=c.points,sr=c.sourceRect;
  if(!Array.isArray(P)||P.length!==4||!P.every(okPt)||!Array.isArray(sr)||sr.length<4||!(sr[2]>0)||!(sr[3]>0))continue;prewarm();
  const k=m[1],D=FX[k],im=img(D.flight);if(!im)continue;const pts=quad(P,sr,D);if(!pts.every(okPt))continue;
  const snap={...c};put(c,im,D,k+'-flight',flightFrame(D,t),pts);n++;stats.swaps++;
  const id=c.key!=null?String(c.key):null;if(id){track.set(id,{k,snap,P:P.map(p=>[...p]),sr:[...sr],seen:tick});if(track.size>MAX_TRACK){const first=track.keys().next().value;track.delete(first);}}}
 // 이번 render 에 안 보인 탄 → 접촉·소멸
 for(const [id,v] of track){if(v.seen===tick)continue;track.delete(id);if(contacts.length<MAX_CONTACT){contacts.push({...v,t0:t});stats.contacts++;}}
 for(let i=contacts.length-1;i>=0;i--){const x=contacts[i],D=FX[x.k],f=Math.floor((t-x.t0)*1000/D.cms);if(f<0||f>=CONTACT_N||t<x.t0){contacts.splice(i,1);continue;}
  const im=img(D.contact);if(!im)continue;const c={...x.snap,key:String(x.snap.key)+':r1119c'};const pts=quad(x.P,x.sr,D);if(!pts.every(okPt))continue;put(c,im,D,x.k+'-contact',f,pts);cmds.push(c);n++;}
 return n;}
want();
window.__STORYWORLD_PERSONA_SKILL_FX_R1119__=Object.freeze({revision:REV,storageKey:KEY,set,enabled:()=>on,process,sheets:FX,
 inspect:()=>({revision:REV,on,tracked:track.size,contacts:contacts.length,images:Object.fromEntries(Object.entries(IM).map(([k,v])=>[k,v.state])),stats:{...stats},lastError})});
})();
