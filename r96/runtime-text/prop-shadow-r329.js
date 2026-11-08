// R329 — 사용자 2026-11-05 "화면 밖 유저를 광원으로 한 그림자 효과, 조형물에 확실히 적용".
//  빛은 화면 앞(보는 사람)에서 조금 아래·왼쪽으로 비켜 들어온다 → 조형물마다 자기 실루엣 그대로의 그림자가 물체 뒤(화면 위쪽)·오른쪽으로 눕는다.
//  R115 의 발밑 접지 타원은 그대로 두고, 그 위에 그 조형물 그림 모양의 투영 그림자를 더한다(모양 없는 타원만으로는 잘 안 보였다).
//  · 그 조형물을 그리는 바로 그 함수(sprite / drawAssetFrame3 / R102 frameBase)로 같은 그림을 brightness(0) 으로 한 번 더 그린다.
//    발 기준점을 축으로 눕히고(LEN) 오른쪽 위로 민다(SHIFT·RISE). 좌우로 1.5px 벌린 두 장을 겹쳐 가장자리를 부드럽게 한다.
//    Three 기록기는 기울이기(shear) transform 을 그리지 않아(헤드리스 실측) translate·scale 만 쓴다.
//    게임 ctx filter 는 brightness 만 쓴다(Three 기록기에서 되는 것만, drop-shadow·blur 금지).
//  · 벽에 붙는 것(문·창·액자·횃불·현판 등)·벽 덩어리는 빼고, 영웅이 뒤에 서서 반투명해진 조형물은 그림자도 옅게.
//  · storyworld.r329.propShadow = '0' 이면 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_PROP_SHADOW_R329__)return;
const REV='R329-prop-shadow-8',KEY='storyworld.r329.propShadow';
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={props:0,cast:0,skipped:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
// 그림자: 키의 LEN 배로 눕히고, 키의 SHIFT 만큼 오른쪽·RISE 만큼 위(물체 뒤)로. 진하기 ALPHA(두 장 겹침 기준).
const LEN=.9,SHIFT=.3,RISE=.12,ALPHA=.42,SOFT=2;
// 낱말 경계로만 맞춘다('outdoor' 안의 door 처럼 경로 일부에 걸려 R99 나무가 모두 빠지던 것 — Codex 리뷰).
const WALLISH=/(?:^|[^a-z])(?:walls?|doors?|gates?|banners?|torch(?:es)?|reliefs?|frames?|windows?|paintings?|portals?|signs?|sconces?|curtains?|posters?|clocks?|mirrors?|vents?|rugs?|carpets?|decals?|stains?|puddles?|blood(?=-)|cracks?)(?=[^a-z]|$)/i;
const recent=[];let cur=null,depth=0;
// fn 으로 그 그림을 그대로 다시 그리되 발(x,footY)을 축으로 눕힌 검은 실루엣으로.
// 근처(LIGHT_R 칸 안)에 빛나는 것(R300 lightsOf: 화로·횃불·촛대·등불·벽 촛대, R330 불길)이 있으면 그 빛 반대쪽으로 그림자를 민다.
//  가까울수록 길고 진하다. 없으면 화면 밖 보는 사람 쪽 빛(오른쪽 위로 눕힘).
const LIGHT_R=4.5;
function lightDir(c){try{const W=window.__STORYWORLD_LIGHT_ATMOS_R300__,list=(W?.lightsOf?.(room)||[]).concat(window.__STORYWORLD_DISASTER_R330__?.lights?.()||[]);let best=null,bd=LIGHT_R;
  for(const l of list){if(c.self&&l.x===c.self.x&&l.y===c.self.y)continue;const d=Math.hypot(l.x-c.wx,l.y-c.wy);if(d<bd&&d>.15){bd=d;best=l;}}
  if(!best)return null;const a=project(best.x,best.y),b=project(c.wx,c.wy),dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1;stats.lit=(stats.lit||0)+1;return{x:dx/L,y:dy/L,k:1-bd/LIGHT_R};}catch(e){fail(e);return null;}}
function castVia(fn,self,args,xi,yi,hi,oi,footY,c){const x=+args[xi],h=+args[hi];if(!Number.isFinite(x+footY)||!(h>6))return;
 /* 손전등 시야(R24)에서 안 보이는 조형물은 그림자도 그리지 않는다(벽 뒤 조형물의 검은 그림자만 남던 것 — Codex 리뷰) */try{const SG=window.__STORYWORLD_SIGHT24__;if(c&&SG?.enabled&&typeof SG.pointVisible==='function'&&Number.isFinite(c.wx)&&!SG.pointVisible(c.wx,c.wy)){stats.hidden=(stats.hidden||0)+1;return;}}catch(e){fail(e);}const L0=c&&Number.isFinite(c.wx)?lightDir(c):null,L=L0&&L0.y<=0?L0:null;/* R412(사용자 2026-11-08 "그림자는 조형물 앞이 아닌 뒤쪽에"): 빛이 조형물보다 화면 위(뒤)에 있으면 그림자가 앞(아래)으로 눕던 것을 막는다 → 그때는 보는 사람 쪽 빛(뒤·오른쪽 위)으로 */
 const opt=args[oi]&&typeof args[oi]==='object'?args[oi]:{},a=ALPHA*(L?1+.4*L.k:1)*Math.max(.25,Math.min(1,Number(opt.alpha??1)));
 const fx=c&&c.flip?-1:1;/* R303 이 서쪽 벽 조형물을 ctx.scale(-1,1) 로 뒤집어 그리므로 그 안에서는 가로 밀기를 뒤집어야 화면 기준 방향이 맞다(Codex 리뷰) */
 const paint=()=>{ for(const dx of[-SOFT,SOFT]){ctx.save();try{if(L){const len=h*(.25+.3*L.k),sy=LEN*(.85+.3*L.k);/* R412: 앞으로 뒤집어 눕히던 갈래는 뺐다 — 여기 오는 빛은 늘 조형물 앞(화면 아래)에 있어 그림자는 뒤(위)로만 눕는다 */ctx.translate(x+dx+fx*L.x*len,footY+L.y*len*.6);ctx.scale(1,sy);ctx.translate(-x,-footY);}else{ctx.translate(x+dx+fx*h*SHIFT,footY-h*RISE);ctx.scale(1,LEN);ctx.translate(-x,-footY);}
   const b=args.slice();b[oi]={...opt,alpha:a,filter:'brightness(0)',blend:undefined};fn.apply(self,b);}finally{ctx.restore();}}
};
 /* 3D 기록기: 그림자 복사본은 조형물 몸(bodyPath)으로 잡히지 않도록 바닥에 눕힌 별도 범위로 기록한다(서서 떠 보이지 않게 — Codex 리뷰) */
 if(typeof ctx.scope==='function')ctx.scope({id:'r329:shadow:'+(c?.self?.id??(Number.isFinite(c?.wx)?Math.round(c.wx*8)+','+Math.round(c.wy*8):'x')),/* 화면 좌표가 아니라 조형물 id·월드 좌표로(카메라가 움직여도 같은 명령 열쇠 — Codex 리뷰) */kind:'effect',x:c?.wx??0,y:c?.wy??0,groundAligned:true,r329Shadow:true},paint);else paint();
 stats.cast++;const k=String(args[0]?.path||args[0]).slice(-48);if(recent.length<30&&!recent.includes(k))recent.push(k);}
function take(x){if(!cur||cur.done)return null;if(Math.abs(x-cur.x)>2)return null;cur.done=true;return cur;}
function install(){
 if(typeof drawProp!=='function'||typeof project!=='function')return false;
 const baseProp=drawProp;drawProp=function(p,...a){const ok=on&&p&&!p.terrainWall&&!p.wallMounted&&!p.r115Clue&&!WALLISH.test(String(p.id||'')+' '+String(p.path||'')+' '+String(p.r80Art||''));
  if(!ok){if(p)stats.skipped++;return baseProp.apply(this,[p,...a]);}
  /* R412: R111(벽 간격)·R412 가 옮긴 조형물은 x·y 가 아니라 숨은 r111To 자리에 그려진다 → 그 자리(거울 전, 그리기 함수가 받는 자리)로 맞춰야
     그림자가 붙는다(x·y 로 맞추면 2px 넘게 어긋나 그림자가 빠졌다). 빛 방향·시야는 보이는 발 자리(거울 반영)로, 가로 밀기 뒤집기는 R303·R140 거울을 합친 것으로. */
  const prev=cur;let q=null,s=p,f=p,mir=!!p.r303Flip;try{const T=window.__STORYWORLD_PROPS_TIDY_R412__;if(T&&typeof T.spotOf==='function'){s=T.spotOf(p)||p;f=T.footOf(p)||p;mir=!!T.mirrored(p);}}catch(_){s=p;f=p;}
  try{q=project(s.x,s.y);}catch(_){}cur=q?{x:q.x,y:q.y,wx:f.x,wy:f.y,self:p,flip:mir,done:false}:null;depth++;stats.props++;
  try{return baseProp.apply(this,[p,...a]);}finally{depth--;cur=prev;}};
 if(typeof sprite==='function'){const baseSprite=sprite;sprite=function(path,x,y,height,opt){const c=depth>0&&typeof path==='string'?take(x):null;if(c&&y<=c.y+2&&y>=c.y-height*.75){try{castVia(baseSprite,this,[path,x,y,height,opt||{}],1,2,3,4,c.y,c);}catch(e){fail(e);}}return baseSprite.apply(this,arguments);};}
 if(typeof drawAssetFrame3==='function'){const baseF=drawAssetFrame3;drawAssetFrame3=function(path,frame,x,y,height,opt){const c=depth>0?take(x):null;if(c){try{castVia(baseF,this,[path,frame,x,y,height,opt||{}],2,3,4,5,c.y,c);}catch(e){fail(e);}}return baseF.apply(this,arguments);};}
 return true;}
const installed=(()=>{try{return install();}catch(e){fail(e);return false;}})();
// R102 움직이는 조형물은 처음 실린 drawAssetFrame3 를 직접 잡아 쓰므로 그쪽 paint 가 이 함수를 먼저 부른다.
function before(fn,args,footY){if(!on||depth<1)return;const c=take(+args[2]);if(!c)return;try{castVia(fn,null,args,2,3,4,5,Number.isFinite(footY)?footY:c.y,c);}catch(e){fail(e);}}
window.__STORYWORLD_PROP_SHADOW_R329__=Object.freeze({revision:REV,installed,before,
 inspect:()=>({revision:REV,on,installed,stats:{...stats},recent:recent.slice(),lastError}),
 set:v=>{on=!!v;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}return on;}});
})();
