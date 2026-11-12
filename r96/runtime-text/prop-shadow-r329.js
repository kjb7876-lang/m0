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
const REV='R329-prop-shadow-10-r448',KEY='storyworld.r329.propShadow',UKEY='storyworld.r448.shadowOneLight';
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
// R448(사용자 2026-11-09 "234번 우선적용", 레퍼런스 등각 맵의 규칙: 모든 물체가 같은 방향(왼쪽 위 광원)으로 부드러운 바닥 그림자를 떨어뜨린다):
//  근처 불빛마다 그림자 방향이 제각각이던 것(R300 lightsOf·R330 불길 갈래)을 끄고, 모든 조형물이 한 방향 — 화면 오른쪽으로 바닥에 눕고 아주 조금만 뒤(위)로 — 떨어뜨린다.
//  기울이기(shear)를 못 쓰므로(Three 기록기) 짧게 눌린 실루엣 세 장을 계단처럼 겹친다: t=⅓·⅔·1 에서 높이 U_LEN·t, 옆 U_LEAN·U_LEN·t.
//  밑동 쪽은 세 장이 겹쳐 진하고(접지), 끝으로 갈수록 한 장만 남아 옅다(반그림자). 앞(화면 아래)으로는 절대 눕지 않는다(R412 사용자 규칙).
//  몹·보스·영웅 그림자는 건드리지 않는다(몹 그림자는 R444 가 뺐다). storyworld.r448.shadowOneLight='0' 이면 R412 방식(근처 불빛 따라)으로 돌아간다.
let oneLight=true;try{oneLight=localStorage.getItem(UKEY)!=='0';}catch(_){}
const U_LEN=.5,U_LEAN=.8,U_RISE=.03,U_ALPHA=.21,U_STEPS=[1/3,2/3,1],U_MAXPX=150;
const stats={props:0,cast:0,skipped:0,footed:0,errors:0};let lastError=null,baseShadow=()=>{};const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
// 그림자: 키의 LEN 배로 눕히고, 키의 SHIFT 만큼 오른쪽·RISE 만큼 위(물체 뒤)로. 진하기 ALPHA(두 장 겹침 기준).
const LEN=.9,SHIFT=.12,RISE=.1,ALPHA=.25,SOFT=2,MAX_SIDE=.3;
// R412 심사(7분야, 2026-11-08): 두 장 겹친 검정(.42 → 합 .66, 빛 곁 .83)이 바닥(L*31) 위에서 L*9~13 구멍처럼 읽혔다 → 한 장 .25(합 ≈.44, 바닥보다 L* 10~14 낮게),
//  빛 곁에서 더 진하게 하던 것(1+.4k)은 뺐다. 발밑에서 통째로 .3h 옆으로 밀어 조형물과 그림자 사이에 밝은 틈이 보이던 것 → .12h.
// 낱말 경계로만 맞춘다('outdoor' 안의 door 처럼 경로 일부에 걸려 R99 나무가 모두 빠지던 것 — Codex 리뷰).
const WALLISH=/(?:^|[^a-z])(?:walls?|doors?|gates?|banners?|torch(?:es)?|reliefs?|frames?|windows?|paintings?|portals?|signs?|sconces?|curtains?|posters?|clocks?|mirrors?|vents?|rugs?|carpets?|decals?|stains?|puddles?|blood(?=-)|cracks?)(?=[^a-z]|$)/i;
// R831(사용자 2026-11-12 "그림자가 이런식이면 상자가 공중에 떠있는거 같잖아"): 엔진 발밑 타원은 그림 맨 아래 점 가운데에 놓인다.
//  밑면이 마름모로 그려진 조형물(제단 등불·보물상자·피의 제단처럼 앞 모서리가 맨 아래 한 점인 그림)은 그 점이 밑면의 앞 꼭짓점이라
//  타원 절반이 물체 앞 바닥으로 빠져나와 물체가 떠 보였다 → 그런 그림만 타원을 밑면 가운데(양옆 모서리 높이)로 올리고 밑면 폭에 맞춰 넓힌다.
//  밑이 평평한 그림(나무·기둥·가로등·화로)은 그대로. 그림 알파를 한 번만 읽어 경로별로 기억한다. 끄기: storyworld.r831.footShadow='0'
let footOn=true;try{footOn=localStorage.getItem('storyworld.r831.footShadow')!=='0';}catch(_){}
const FOOT_BAND=.4,FOOT_MAX=.3,FOOT_SCALE=1.45,footMemo=new Map();
// 순수(QA): 아래에서 위로 잰 줄별 폭(그림 폭 대비 0~1) + 그림 가로/세로 비 → 타원을 올릴 높이(그림 키 대비 0~.3)
function footShift(widths,aspect){const n=widths?.length|0;if(n<8||!(aspect>=.85))return 0;const band=Math.max(4,Math.round(n*FOOT_BAND));let wmax=0;for(let i=0;i<band;i++)if(widths[i]>wmax)wmax=widths[i];
 if(wmax<.5)return 0;const low=Math.max(1,Math.round(n*.04));let w0=0;for(let i=0;i<low;i++)w0=Math.max(w0,widths[i]);if(w0>wmax*.35)return 0;/* 밑이 넓으면 평평한 밑면 */
 for(let i=0;i<band;i++){if(widths[i]>=wmax*.9)return Math.min(FOOT_MAX,i/n);if(i&&widths[i]<widths[i-1]*.8)return 0;/* 중간에 잘록해지면(다리·줄기) 마름모 밑면이 아니다 */}return 0;}
function footMeasure(image,b){const H=64,Wd=Math.max(8,Math.min(160,Math.round(H*b.w/b.h)));
 const cv=typeof OffscreenCanvas==='function'?new OffscreenCanvas(Wd,H):Object.assign(document.createElement('canvas'),{width:Wd,height:H}),g=cv.getContext('2d',{willReadFrequently:true});
 g.drawImage(image,b.x||0,b.y||0,b.w,b.h,0,0,Wd,H);const d=g.getImageData(0,0,Wd,H).data,rows=[];
 for(let y=H-1;y>=0;y--){let l=-1,r=-1;for(let x=0;x<Wd;x++)if(d[(y*Wd+x)*4+3]>40){if(l<0)l=x;r=x;}rows.push(l<0?0:(r-l+1)/Wd);}
 while(rows.length&&rows[0]===0)rows.shift();return footShift(rows,b.w/b.h);}
const footKeep=(k,v)=>{if(footMemo.size>600)footMemo.clear();footMemo.set(k,v);return v;};
function footOfPath(path){if(footMemo.has(path))return footMemo.get(path);let v=0;try{const row=typeof readyImage==='function'?readyImage(path):null;if(!row||!row.image)return 0;
  v=footMeasure(row.image,row.crop||{x:0,y:0,w:row.image.naturalWidth||row.image.width,h:row.image.naturalHeight||row.image.height});}catch(e){fail(e);v=0;}return footKeep(path,v);}
// 자기 그림을 직접 그리는 모듈(R92 바닥 등불)이 묻는다: 이미 불러온 그림 + 기억할 이름 → 올릴 높이(그림 키 대비)
function footOfImage(key,img){const k='img:'+key;if(footMemo.has(k))return footMemo.get(k);if(!footOn||!img)return 0;let v=0;try{const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;if(!(w>0&&h>0))return 0;v=footMeasure(img,{x:0,y:0,w,h});}catch(e){fail(e);v=0;}return footKeep(k,v);}
const footPlain=p=>!!p&&typeof p.path==='string'&&!p.r80Dressing&&!p.r74Prop&&!p.r81NativeSkin&&!p.r99Tree&&!p.visualHospitalFrame&&!(p.visualLiftPx>0);
let pend=null;
const recent=[];let cur=null,depth=0;
// fn 으로 그 그림을 그대로 다시 그리되 발(x,footY)을 축으로 눕힌 검은 실루엣으로.
// 근처(LIGHT_R 칸 안)에 빛나는 것(R300 lightsOf: 화로·횃불·촛대·등불·벽 촛대, R330 불길)이 있으면 그 빛 반대쪽으로 그림자를 민다.
//  가까울수록 길고 진하다. 없으면 화면 밖 보는 사람 쪽 빛(오른쪽 위로 눕힘).
const LIGHT_R=4.5;
function lightDir(c){try{const W=window.__STORYWORLD_LIGHT_ATMOS_R300__,list=(W?.lightsOf?.(room)||[]).concat(window.__STORYWORLD_DISASTER_R330__?.lights?.()||[]);let best=null,bd=LIGHT_R;
  for(const l of list){if(c.self&&l.x===c.self.x&&l.y===c.self.y)continue;const d=Math.hypot(l.x-c.wx,l.y-c.wy);if(d<bd&&d>.15){bd=d;best=l;}}
  if(!best)return null;const a=project(best.x,best.y),b=project(c.wx,c.wy),dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1;stats.lit=(stats.lit||0)+1;return{x:dx/L,y:dy/L,k:1-bd/LIGHT_R};}catch(e){fail(e);return null;}}
// 뒷벽(-x·-y) 1.2칸 안에 등을 댄 조형물인가 — R406 walls(네 방향 벽까지 거리)로 방·발 자리마다 한 번만 잰다
const backMemo=new WeakMap();
function wallBacked(p,x,y){try{const L=typeof room!=='undefined'&&room?room.exploration:null,W=window.__STORYWORLD_PROPS_PLACE_R406__?.walls;if(!L||typeof W!=='function'||!Number.isFinite(x+y))return false;
 const m=backMemo.get(p);if(m&&m.L===L&&Math.abs(m.x-x)<.05&&Math.abs(m.y-y)<.05)return m.v;const v=W(L,x,y).some(q=>(q.dx<0||q.dy<0)&&q.d<=1.2);backMemo.set(p,{L,x,y,v});return v;}catch(e){fail(e);return false;}}
function castVia(fn,self,args,xi,yi,hi,oi,footY,c){const x=+args[xi],h=+args[hi];if(!Number.isFinite(x+footY)||!(h>6))return;
 /* 손전등 시야(R24)에서 안 보이는 조형물은 그림자도 그리지 않는다(벽 뒤 조형물의 검은 그림자만 남던 것 — Codex 리뷰) */try{const SG=window.__STORYWORLD_SIGHT24__;if(c&&SG?.enabled&&typeof SG.pointVisible==='function'&&Number.isFinite(c.wx)&&!SG.pointVisible(c.wx,c.wy)){stats.hidden=(stats.hidden||0)+1;return;}}catch(e){fail(e);}const L0=c&&Number.isFinite(c.wx)&&!oneLight?lightDir(c):null,back=!!(c&&c.self&&wallBacked(c.self,c.wx,c.wy));/* R412(사용자 2026-11-08 "그림자는 조형물 앞이 아닌 뒤쪽에"): 빛이 조형물보다 화면 위(뒤)에 있으면 그림자가 앞(아래)으로 눕던 것을 막는다 → 그때는 보는 사람 쪽 빛(뒤·오른쪽 위)으로 */
 const opt=args[oi]&&typeof args[oi]==='object'?args[oi]:{},a=ALPHA*Math.max(.25,Math.min(1,Number(opt.alpha??1)));
 const fx=c&&c.flip?-1:1;/* R303 이 서쪽 벽 조형물을 ctx.scale(-1,1) 로 뒤집어 그리므로 그 안에서는 가로 밀기를 뒤집어야 화면 기준 방향이 맞다(Codex 리뷰) */
 /* R412 심사: 빛이 조형물 옆(같은 화면 줄)에 있으면 그림자가 옆으로 서서 검은 쌍둥이처럼 보였고(L0.y≤0 이면 다 받던 것), 움직이는 R330 불빛이 그 줄을 지나면 툭 바뀌었다.
    → 빛 갈래는 빛이 뚜렷이 앞(화면 아래)에 있을 때만 서서히 섞고(L0.y −.15 → −.5), 옆 밀기는 키의 .3 까지, 늘 조금은 위(뒤)로. 뒷벽 1.2칸 안 조형물은 기본 그림자(벽 밑으로 숨음). */
 const w=L0&&!back?Math.max(0,Math.min(1,(-L0.y-.15)/.35)):0;let ox=fx*h*SHIFT,oy=-h*RISE,sy=LEN;
 if(w>0){const len=h*(.25+.3*L0.k);ox=ox*(1-w)+fx*L0.x*len*w;oy=oy*(1-w)+L0.y*len*.6*w;sy=LEN*(1-w)+LEN*(.85+.3*L0.k)*w;}
 ox=Math.max(-h*MAX_SIDE,Math.min(h*MAX_SIDE,ox));oy=Math.min(oy,-h*.05);
 const paint=oneLight?()=>{/* R448 한 방향 바닥 그림자: 계단 세 장(밑동 진하게·끝 옅게) */const ua=U_ALPHA*Math.max(.25,Math.min(1,Number(opt.alpha??1))),z=typeof zoom==='number'&&zoom>0?zoom:1,lean=Math.min(h*U_LEAN*U_LEN,U_MAXPX*z);
  for(const t of U_STEPS){ctx.save();try{ctx.translate(x+fx*lean*t,footY-h*U_RISE*t);ctx.scale(1,U_LEN*t);ctx.translate(-x,-footY);
   const b=args.slice();b[oi]={...opt,alpha:ua,filter:'brightness(0)',blend:undefined};fn.apply(self,b);}finally{ctx.restore();}}
}:()=>{ for(const dx of[-SOFT,SOFT]){ctx.save();try{ctx.translate(x+dx+ox,footY+oy);ctx.scale(1,sy);ctx.translate(-x,-footY);
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
  try{q=project(s.x,s.y);}catch(_){}cur=q?{x:q.x,y:q.y,wx:f.x,wy:f.y,self:p,flip:mir,done:false,foot:footOn&&footPlain(p)?footOfPath(p.path):0}:null;depth++;stats.props++;const keep=pend;pend=null;
  try{return baseProp.apply(this,[p,...a]);}finally{if(pend){const d=pend;pend=null;try{baseShadow.call(this,d.x,d.y,d.radius,d.opt);}catch(e){fail(e);}}pend=keep;depth--;cur=prev;}};
 if(typeof shadow==='function'){baseShadow=shadow;shadow=function(x,y,radius,opt){if(depth>0&&cur&&cur.foot>0&&!pend){pend={x,y,radius,opt};return;}return baseShadow.apply(this,arguments);};}
 if(typeof sprite==='function'){const baseSprite=sprite;sprite=function(path,x,y,height,opt){if(pend&&cur&&typeof path==='string'){const d=pend;pend=null;try{const up=path===cur.self?.path?cur.foot*height:0;baseShadow.call(this,d.x,d.y-up,d.radius,up?{...(d.opt||{}),scale:FOOT_SCALE}:d.opt);if(up)stats.footed++;}catch(e){fail(e);}}const c=depth>0&&typeof path==='string'?take(x):null;if(c&&y<=c.y+2&&y>=c.y-height*.75){try{castVia(baseSprite,this,[path,x,y,height,opt||{}],1,2,3,4,c.y,c);}catch(e){fail(e);}}return baseSprite.apply(this,arguments);};}
 if(typeof drawAssetFrame3==='function'){const baseF=drawAssetFrame3;drawAssetFrame3=function(path,frame,x,y,height,opt){const c=depth>0?take(x):null;if(c){try{castVia(baseF,this,[path,frame,x,y,height,opt||{}],2,3,4,5,c.y,c);}catch(e){fail(e);}}return baseF.apply(this,arguments);};}
 return true;}
const installed=(()=>{try{return install();}catch(e){fail(e);return false;}})();
// R102 움직이는 조형물은 처음 실린 drawAssetFrame3 를 직접 잡아 쓰므로 그쪽 paint 가 이 함수를 먼저 부른다.
function before(fn,args,footY){if(!on||depth<1)return;const c=take(+args[2]);if(!c)return;try{castVia(fn,null,args,2,3,4,5,Number.isFinite(footY)?footY:c.y,c);}catch(e){fail(e);}}
window.__STORYWORLD_PROP_SHADOW_R329__=Object.freeze({revision:REV,installed,before,footShift,footOfPath,footOfImage:(k,i)=>footOn?footOfImage(k,i):0,FOOT_SCALE,
 setFoot:v=>{footOn=!!v;try{localStorage.setItem('storyworld.r831.footShadow',footOn?'1':'0');}catch(_){}return footOn;},
 oneLight:()=>oneLight,setOneLight:v=>{oneLight=!!v;try{localStorage.setItem(UKEY,oneLight?'1':'0');}catch(_){}return oneLight;},
 inspect:()=>({revision:REV,on,oneLight,installed,stats:{...stats},recent:recent.slice(),lastError}),
 set:v=>{on=!!v;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}return on;}});
})();
