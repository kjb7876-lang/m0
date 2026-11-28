// R1365·R1366 — 맵 조형물 정리 · 밑동 접촉 그림자 · 윤하람/옥상 도로 바닥 표시 (사용자 2026-11-27).
//  ① "장민재와 새빛호텔 안에 판잣집 같은 조형물이 왜 있나": 원인은 R81(world-environment-r81) 이 R74 자리채움 장식(r74Prop)에
//     그 지역 원본 소품 목록(regionObjects6)의 그림을 돌려 입히는데(r81NativeSkin, R303 은 r303Skin), 그 목록에 바깥용
//     '폐허 시장 좌판'·'부서진 가로등'·'빈 비석'이 들어 있었다. R220·R1062 거르기는 소품 path 만 보고 빌려 입은 그림은 보지 않았다
//     → 주사실(ep1a09)에도 호텔 짐수레·가로등이 같은 길로 들어가 있었다.
//  ② "꼭 필요한 소품만, 계단은 맵 전환하는 곳에만, 남발되는 조형물 삭제":
//     · R74 자리채움 장식(다른 소품 그림을 빌려 입는 것)은 모두 쉰다 — 같은 지역의 원본 소품과 그림이 겹치는 복제였다.
//     · 실내 지역(병원·집·호텔·기계)에서 바깥 전용 그림을 쓰는 이름 없는 장식은 쉰다.
//     · 계단 그림은 문·입구·제단(맵 전환 자리) 3.5칸 안에만 남긴다.
//     · 같은 그림은 한 지역에 장면 장식 2점·가구 3점까지(서로 가장 떨어진 것을 남김).
//     · 지역별 표(ZONE): 제목·서사에 안 맞는 그림을 뺀다(윤하람=도로, 새빛호텔=불탄 호텔, 옥상의 순환=옥상).
//     지키는 것: 판정 있는 것(solid)·이름 붙은 서사 소품·상호작용·상자·문·제단·NPC·단서·보스방(r406Boss)·나무·건물.
//     지역 통째로 안 건드림: 맘몬(ep1b06, Codex 작업)·꿈 층·사몽 구역. 기준으로 삼는 맵(7대죄 ep1b*·에피소드1 dist/ep1a·불면귀 last30*)은
//     ①(바깥 그림 새는 버그)만 고치고 개수 정리는 하지 않는다(사용자 "그쪽이 잘 되어 있으니 참고").
//     숨김은 다른 모듈이 이미 쓰는 r303Hide 표시('r1366-…')로 한다 — 객체·id·자리·판정은 그대로(충돌·길찾기·저장 불변), 그림·그림자·빛만 쉰다.
//  ③ "조형물 아래 원 그림자 때문에 떠다니는 것 같다": 조형물을 그릴 때 엔진 발밑 타원(+R115 빛 타원)을 그 그림 밑면 폭에 붙는
//     납작한 접촉 그림자로 바꾼다(마름모 밑면은 양옆 모서리 높이로 올림). R204 의 바닥 둥근 그늘 판도 끈다. 몹·영웅 그림자는 그대로.
//     R329 의 실루엣 투영 그림자(그림 모양 그대로)는 그대로 둔다.
//  ④ 윤하람(murder01): 바닥을 젖은 아스팔트(R118 asphalt)로 하고(world-tiles-r118 표), 길목마다 횡단보도 줄무늬·가운데 점선 차선을 바닥에 얹는다.
//     옥상의 순환(murder03): 옥상 방수 바닥 위에 같은 횡단보도가 겹쳐 보이게(정본 55절 "청록빌라 옥상과 횡단보도가 같은 저녁으로 겹쳐졌다")
//     가운데 방 둘레에 둥근 점선 고리(순환)를 얹는다. 바닥 표시는 그림만(Three 평면, 판정 없음).
//  끄기: localStorage['storyworld.r1366.props']='{"on":false}' (부분: {"declutter":false}·{"ground":false}·{"marks":false})
(()=>{'use strict';
if(window.__STORYWORLD_PROPS_DECLUTTER_R1366__)return;
const REV='R1366-props-declutter-1',KEY='storyworld.r1366.props';
let lastError=null;const stats={plans:0,hidden:0,contact:0,marks:0,errors:0};const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const prefs=(()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'{}')||{};return{on:v.on!==false,declutter:v.declutter!==false,ground:v.ground!==false,marks:v.marks!==false};}catch(_){return{on:true,declutter:true,ground:true,marks:true};}})();
const fin=v=>Number.isFinite(v);
// 실내 지역(qa/r1062/theme-pools.json 의 clinic·home·machine)
const INDOOR=new Set(['ep1a08','ep1a09','ep1a11','ep1b02','ep1b03','ep1b04','murder02','murder04','cult01','cult02','cult03','cult04','cult06','ep1b09','hando03','u201','u202','u203','u204','u205','u206']);
const OUTDOOR_ONLY=/(?:^|\/)(?:ruined_market|broken_street_lamp|moss_boulders|dead_tree|broken_gate|village_well|collapsed_pillar|blank_memorial)\.(?:webp|png)$/;
const CART_DENY=new Set(['ep1a08','ep1a09','ep1a11','ep1b02','ep1b04','ep1a10']);// R1062·R1237 표와 같음(호텔 짐수레는 병원·집·거리에 안 어울림) — R204 가 없을 때 대비
const STAIR=/stair|r80-032\.|r80-055\./i;
const SKIP_ZONE=new Set(['ep1b06']);// 맘몬: Codex 작업, 손대지 않음
// 기준 맵(개수 정리 안 함): 에피소드1·7대죄·불면귀
const REFERENCE=z=>/^(dist0\d|ep1a\d|ep1b\d)/.test(z)&&z!=='ep1a09b'||/^last30[23]$/.test(z);
// 지역별 제목·서사 표: 안 맞는 그림(정본 r106 개선본 52·53·55절)
const ZONE={
 murder01:{deny:/r80-024\.|r80-054\.|hotel_luggage_cart|ruined_market|blank_memorial|r80-026\.|r80-027\.|r80-025\./,marks:'road'},// 윤하람: 젖은 도로·횡단보도 — 소파·호텔 단말·짐수레·좌판·비석·거울·난로 빼고 신호등·연석·가로등·교정 장부·비상벨 남김
 murder02:{deny:/ruined_market|broken_street_lamp|blank_memorial|r80-052\.|r80-053\./},// 새빛호텔: 불탄 폐호텔 — 보안 단말·비상벨·로비 소파·거울·잔해·짐수레 남김, 바깥 좌판·가로등·비석·신호등 뺌
 murder03:{deny:/r80-024\.|r80-051\.|r80-054\.|r80-056\.|r80-025\.|r80-026\.|r80-027\.|hotel_luggage_cart|ruined_market|blank_memorial|broken_street_lamp/,marks:'loop'},// 옥상의 순환: 옥상 — 실내 가구·호텔 물건 빼고 신호등·연석(겹쳐진 횡단보도)만
 murder04:{deny:/r80-054\.|hotel_luggage_cart|ruined_market|blank_memorial|broken_street_lamp/},// 고서진과 청록빌라: 빌라 계단·집 안(정본 54절) — 소파·거울·난로·잔해·화재경보함(고서진이 미룬 경보 회로) 남기고 호텔 출입 단말·바깥 좌판·가로등·비석 뺌
};
// 장 고유 조형물(R80 part08 교단 장별 묶음·관리자 이주 받침): 그림 이름 → 그 그림을 만든 장
const OWN=Object.freeze({'r80-061':'cult01','r80-062':'cult01','r80-063':'cult02','r80-064':'cult02','r80-065':'cult03','r80-066':'cult04','r80-067':'cult04','r80-069':'cult05','r80-070':'cult06','r80-071':'cult06','r80-002':'u206'});
const artKey=p=>{const m=/(r80-\d{3})\./.exec(artOf(p));return m?m[1]:'';};
const artOf=p=>String(p?.r303Skin?.path||p?.r81NativeSkin?.path||p?.path||'');
const tag=p=>String(p?.id||'')+' '+String(p?.kind||'');
function guarded(p){return !p||p.solid===true||!!p.name||!!p.label||!!p.interactive||!!p.r74Door||!!p.chestR103||!!p.cornerChestR1282||!!p.chest||!!p.altar||!!p.samongR103||!!p.r115Clue||!!p.r115Book||p.r115Stmt!=null||!!p.r75NPC||!!p.r75NarrativeNPC||!!p.r75FortPerson||!!p.terrainWall||!!p.r406Boss||!!p.r414Building||!!p.r99Tree||!!p.wallMounted
 ||/door|portal|altar|chest|note|memory|record|clue|npc|statement|book|exit/i.test(tag(p))&&!p.r80Dressing&&!p.r74Prop;}
const isDecor=p=>!guarded(p)&&!!(p.r74Prop||p.r80Dressing||p.r224Furniture||p.r449Furniture||p.kind==='regional-scene-prop'||p.sourceZoneProp);
const isFurniture=p=>!!(p.r224Furniture||p.r449Furniture);
const skipRoom=r=>!r||!Array.isArray(r.props)||SKIP_ZONE.has(r.id)||r.layer==='DREAM'||!!r.samongR115||!!r.samongR103||!!r.exploration?.samongR103||r.exploration?.type==='r103-samong'||!!r.egoVisitId151;
function transitions(r){const L=r.exploration||{},out=[];for(const d of L.worldR74?.doors||[])if(fin(d.x+d.y))out.push(d);for(const k of ['entry','entrance'])if(L[k]&&fin(L[k].x+L[k].y))out.push(L[k]);
 if(r.altar&&fin(r.altar.x+r.altar.y))out.push(r.altar);for(const e of r.exits||[])if(e&&fin(e.x+e.y))out.push(e);for(const p of r.props)if(p&&p.r74Door&&fin(p.x+p.y))out.push(p);return out;}
const STAIR_R=3.5,CAP_SCENE=2,CAP_FURN=3;
// 같은 그림 무리에서 남길 것: id 가 가장 작은 것부터, 그다음은 남긴 것들에서 가장 먼 것(결정적)
function spread(list,k){const s=[...list].sort((a,b)=>String(a.id).localeCompare(String(b.id)));if(s.length<=k)return new Set(s);const keep=[s[0]];
 while(keep.length<k){let best=null,bd=-1;for(const p of s){if(keep.includes(p))continue;let d=1e9;for(const q of keep)d=Math.min(d,Math.hypot(p.x-q.x,p.y-q.y));if(d>bd+1e-9){bd=d;best=p;}}if(!best)break;keep.push(best);}return new Set(keep);}
function plan(r){if(skipRoom(r))return{skipped:true,hidden:[]};const z=String(r.id||''),hidden=[],mark=(p,why)=>{p.r303Hide='r1366-'+why;hidden.push([p.id,why]);};
 const decor=r.props.filter(p=>isDecor(p)&&(!p.r303Hide||String(p.r303Hide).startsWith('r1366')));
 for(const p of decor)if(String(p.r303Hide||'').startsWith('r1366'))delete p.r303Hide;// 다시 계산(멱등)
 const live=()=>decor.filter(p=>!p.r303Hide);
 // ① 실내에 바깥 전용 그림(빌려 입은 것 포함)
 let deny1062=CART_DENY.has(z)?/hotel_luggage_cart/:null;try{const d=window.__STORYWORLD_CAVE_R204__?.themeDeny?.()?.[z];if(d)deny1062=new RegExp(d);}catch(_){}
 if(INDOOR.has(z)||deny1062)for(const p of live()){const a=artOf(p);if(INDOOR.has(z)&&OUTDOOR_ONLY.test(a)||deny1062&&/assets\/props\//.test(a)&&deny1062.test(a))mark(p,'outdoor');}// R1062 지역 표도 빌려 입은 그림까지
 if(!REFERENCE(z)){
  // ② R74 자리채움 장식
  for(const p of live())if(p.r74Prop)mark(p,'filler');
  // ③ 지역 표
  const spec=ZONE[z];if(spec?.deny)for(const p of live())if(spec.deny.test(artOf(p)))mark(p,'theme');
  // ③-2 장 고유 그림: 교단(cult01~06)·관리자(u201~206) 장마다 만든 조형물은 제 장에서만 여러 점, 다른 장에서는 한 점만(제목과 맞게)
  const fam=z.replace(/\d+$/,'');const foreign=new Map();for(const p of live()){const o=OWN[artKey(p)];if(o&&o!==z&&o.replace(/\d+$/,'')===fam){const k=artKey(p);if(!foreign.has(k))foreign.set(k,[]);foreign.get(k).push(p);}}
  for(const [,list] of foreign){const keep=spread(list,1);for(const p of list)if(!keep.has(p))mark(p,'foreign');}
  // ④ 계단은 전환 자리 곁에만
  const T=transitions(r);for(const p of live())if(STAIR.test(artOf(p))&&fin(p.x+p.y)&&!T.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<=STAIR_R))mark(p,'stair');
  // ⑤ 같은 그림 남발
  const groups=new Map();for(const p of live()){if(!fin(p.x+p.y))continue;const k=artOf(p).split('/').pop()+(isFurniture(p)?'|f':'|s');if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p);}
  const byArt=new Map();for(const [k,list] of groups){const a=k.split('|')[0];byArt.set(a,(byArt.get(a)||[]).concat(list));}
  for(const [a,list] of byArt){const cap=list.some(isFurniture)?CAP_FURN:CAP_SCENE;const keep=spread(list,cap);for(const p of list)if(!keep.has(p))mark(p,'repeat');}}
 stats.plans++;stats.hidden=hidden.length;return{skipped:false,zone:z,hidden};}

// ---- 밑동 접촉 그림자 -------------------------------------------------------------------------------
// 순수: rows = 그림 아래에서 위로 잰 줄별 불투명 폭(그림 폭 대비 0~1, 빈 줄 뺌), hPx·wPx = 화면에 그려질 키·폭
//  → {rx,ry,lift,alpha} (lift = 발 기준점에서 위로 올릴 화면 px). 밑이 평평하면 바닥 줄 폭, 마름모 밑면이면 가장 넓은 줄 높이·폭.
function contact(rows,aspect,hPx,wPx){const n=rows?.length|0;if(n<4||!(hPx>0)||!(wPx>0))return null;const band=Math.max(3,Math.round(n*.3));let wmax=0;for(let i=0;i<band&&i<n;i++)wmax=Math.max(wmax,rows[i]);if(!(wmax>0))return null;
 const low=Math.max(1,Math.round(n*.05));let w0=0;for(let i=0;i<low;i++)w0=Math.max(w0,rows[i]);let base=w0,lift=0;
 if(w0<wmax*.6){let i=0;while(i<band&&rows[i]<wmax*.92)i++;base=rows[Math.min(i,n-1)];lift=Math.min(.3,i/n)*hPx;}
 const rx=Math.max(3,base*wPx/2),ry=Math.max(1.6,rx*.14);return{rx,ry,lift,alpha:.42};}
const rowMemo=new Map();
function rowsOf(image,b){const H=64,Wd=Math.max(8,Math.min(160,Math.round(H*b.w/b.h)));const cv=typeof OffscreenCanvas==='function'?new OffscreenCanvas(Wd,H):Object.assign(document.createElement('canvas'),{width:Wd,height:H}),g=cv.getContext('2d',{willReadFrequently:true});
 g.drawImage(image,b.x||0,b.y||0,b.w,b.h,0,0,Wd,H);const d=g.getImageData(0,0,Wd,H).data,rows=[];for(let y=H-1;y>=0;y--){let l=-1,rr=-1;for(let x=0;x<Wd;x++)if(d[(y*Wd+x)*4+3]>60){if(l<0)l=x;rr=x;}rows.push(l<0?0:(rr-l+1)/Wd);}
 while(rows.length&&rows[0]===0)rows.shift();return rows;}
function rowsFor(path,b,image){const k=path+'|'+[b.x|0,b.y|0,b.w|0,b.h|0].join(',');if(rowMemo.has(k))return rowMemo.get(k);let v=null;try{v=rowsOf(image,b);}catch(e){fail(e);v=null;}if(rowMemo.size>800)rowMemo.clear();rowMemo.set(k,v);return v;}
// 겹친 납작 타원 셋(바깥 옅게 → 밑동 가운데 짙게): 가장자리 선이 없어 '떠 있는 원판'으로 읽히지 않는다(R1366 심사 보완)
function paintContact(c,x,y,alpha){if(!c||typeof ctx==='undefined')return;ctx.save();try{ctx.globalAlpha*=clampA(alpha);const cy=y-c.lift-c.ry*.2;
 for(const [k,f] of [[.9,.3],[.68,.38],[.42,.5]]){ctx.fillStyle='rgba(0,0,0,'+(c.alpha*f).toFixed(3)+')';ctx.beginPath();ctx.ellipse(x,cy,c.rx*k,c.ry*(.55+.45*k),0,0,Math.PI*2);ctx.fill();}}finally{ctx.restore();}stats.contact++;}
const clampA=a=>fin(a)?Math.max(0,Math.min(1,a)):1;
let depth=0,pend=null;
function install(){
 if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(!prefs.on)return base.call(this,p,...a);
   if(p&&String(p.r303Hide||'').startsWith('r1366'))return;depth++;const keep=pend;pend=null;try{return base.call(this,p,...a);}finally{pend=keep;depth--;}};}
 if(typeof shadow==='function'){const base=shadow;shadow=function(x,y,radius,opt){if(prefs.on&&prefs.ground&&depth>0&&fin(x+y)){pend={x,y,alpha:clampA(opt?.alpha??1)*(1-clampA(opt?.lift||0)*.6)};return;}return base.apply(this,arguments);};}
 const take=(path,x,y,h,b,image)=>{const d=pend;pend=null;if(!d||!image||!(h>0)||!b)return;const rows=rowsFor(path,b,image);const c=contact(rows,b.w/b.h,h,h*b.w/b.h);if(c)paintContact(c,x,y,d.alpha);};
 if(typeof sprite==='function'){const base=sprite;sprite=function(path,x,y,height,opt){if(pend&&depth>0&&typeof path==='string'){try{const row=typeof readyImage==='function'?readyImage(path):null;if(row?.image){const b=row.crop||{x:0,y:0,w:row.image.naturalWidth||row.image.width,h:row.image.naturalHeight||row.image.height};take(path,x,y,height,b,row.image);}else pend=null;}catch(e){fail(e);pend=null;}}return base.apply(this,arguments);};}
 if(typeof drawAssetFrame3==='function'){const base=drawAssetFrame3;drawAssetFrame3=function(path,frame,x,y,height,opt){if(pend&&depth>0&&typeof path==='string'){try{const row=typeof readyImage==='function'?readyImage(path):null,sr=frame?.sourceRect||frame?.frame?.sourceRect;
   if(row?.image&&sr){take(path+'#'+sr.join(','),x,y,height,{x:sr[0],y:sr[1],w:sr[2],h:sr[3]},row.image);}else pend=null;}catch(e){fail(e);pend=null;}}return base.apply(this,arguments);};}
}
let lastRoom=null,lastSig='',lastAt=0;
// 다른 모듈(R449 늦은 숨김 풀기 등)이 숨김 표시를 바꿀 수 있어 소품 수가 같아도 1초마다 다시 센다(소품 100여 점, 가볍다).
function ensure(r){const now=typeof performance!=='undefined'?performance.now():0;const sig=r.id+':'+r.props.length;if(r===lastRoom&&sig===lastSig&&now-lastAt<750)return;lastRoom=r;lastSig=sig;lastAt=now;plan(r);}

// ---- 바닥 표시(윤하람 도로·옥상 고리) ---------------------------------------------------------------
// 순수: 바닥 칸 목록 → 곧은 길(폭 2~6칸, 길이 8칸 이상)마다 가운데 횡단보도 줄무늬 + 나머지 길이에 점선 차선. 칸 좌표 [x,y] 는 칸 [x,x+1]×[y,y+1].
function crossings(cells){const key=new Set((cells||[]).map(([x,y])=>x+':'+y)),has=(x,y)=>key.has(x+':'+y),out=[];if(!key.size)return out;
 const runs=(horiz)=>{const seen=new Set(),res=[];for(const [x,y] of cells){const k=x+':'+y;if(seen.has(k))continue;
   // 이 칸의 가로(세로) 길이와 세로(가로) 폭
   const along=(a,b)=>horiz?has(a,b):has(b,a);const u=horiz?x:y,v=horiz?y:x;if(!along(u,v))continue;
   let v0=v,v1=v;while(along(u,v0-1))v0--;while(along(u,v1+1))v1++;const w=v1-v0+1;if(w<2||w>6){continue;}
   // 같은 폭 단면이 이어지는 구간
   const same=(uu)=>{if(!along(uu,v0)||!along(uu,v1))return false;if(along(uu,v0-1)||along(uu,v1+1))return false;for(let t=v0;t<=v1;t++)if(!along(uu,t))return false;return true;};
   if(!same(u))continue;let u0=u,u1=u;while(same(u0-1))u0--;while(same(u1+1))u1++;for(let uu=u0;uu<=u1;uu++)for(let t=v0;t<=v1;t++)seen.add(horiz?uu+':'+t:t+':'+uu);
   if(u1-u0+1>=8)res.push({u0,u1:u1+1,v0,v1:v1+1});}return res;};
 for(const horiz of [true,false])for(const g of runs(horiz)){const L=g.u1-g.u0,mid=g.u0+Math.floor(L/2),half=1.1,inset=.25,step=.55,bar=.3;
  const rect=(a0,a1,b0,b1,kind)=>out.push(horiz?{kind,x0:a0,x1:a1,y0:b0,y1:b1}:{kind,x0:b0,x1:b1,y0:a0,y1:a1});
  // 횡단보도: 가운데 하나 + 길이 20칸 넘는 길은 양쪽 4분점에도 하나씩(한 덩어리로만 보이지 않게)
  const mids=[mid];if(L>=20){mids.push(g.u0+Math.floor(L/4),g.u0+Math.floor(3*L/4));}
  const nearZ=(a0,a1,pad)=>mids.some(m=>a1>m-half-pad&&a0<m+half+pad);
  for(const m of mids)for(let b=g.v0+inset;b+bar<=g.v1-inset+1e-9;b+=step)rect(m-half,m+half,b,b+bar,'zebra');
  const c=(g.v0+g.v1)/2;for(let a=g.u0+.6;a+1<=g.u1-.6;a+=2.2){if(nearZ(a,a+1,.6))continue;rect(a,a+1,c-.08,c+.08,'lane');}
  // 길 가장자리 실선(연석 선): 횡단보도 자리는 끊는다
  const ends=[g.u0+.3,...mids.flatMap(m=>[m-half-.3,m+half+.3]),g.u1-.3].sort((p,q)=>p-q);
  for(let i=0;i+1<ends.length;i+=2){const a0=ends[i],a1=ends[i+1];if(a1-a0<.8)continue;rect(a0,a1,g.v0+.1,g.v0+.18,'edge');rect(a0,a1,g.v1-.18,g.v1-.1,'edge');}
  // 젖은 물웅덩이 반사: 횡단보도 옆 두 곳(가장자리 쪽, 소품 아님·바닥 무늬)
  const pw=Math.min(2,(g.v1-g.v0)*.5),ph=Math.min(1.1,(g.v1-g.v0)*.34);
  const pa=mid+half+1.2,pb=mid-half-1.2-pw;
  if(pa+pw<=g.u1-.2)rect(pa,pa+pw,g.v0+.25,g.v0+.25+ph,'puddle');
  if(pb>=g.u0+.2)rect(pb,pb+pw,g.v1-.25-ph,g.v1-.25,'puddle');}
 return out;}
// 순수: 가운데 방(가장 큰 사각 방 상자) 둘레의 둥근 점선 고리 — {kind:'ring',cx,cy,len,wid,ang} (바닥 칸 위 조각만)
function ring(cells,box){const key=new Set((cells||[]).map(([x,y])=>x+':'+y)),out=[];if(!box||!key.size)return out;const cx=(box[0]+box[2])/2,cy=(box[1]+box[3])/2,R=Math.max(2,Math.min(box[2]-box[0],box[3]-box[1])/2-1.2);
 const n=Math.max(12,Math.round(2*Math.PI*R/1.1));for(let i=0;i<n;i++){if(i%2)continue;const a=i/n*2*Math.PI,x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R;if(!key.has(Math.floor(x)+':'+Math.floor(y)))continue;out.push({kind:'ring',cx:x,cy:y,len:2*Math.PI*R/n*.95,wid:.5,ang:a+Math.PI/2});}
 // 고리 안쪽에 진행 방향을 알리는 짧은 화살 줄(순환): 네 곳
 for(let k=0;k<4;k++){const a=k*Math.PI/2+.4,x=cx+Math.cos(a)*(R-.7),y=cy+Math.sin(a)*(R-.7);if(key.has(Math.floor(x)+':'+Math.floor(y)))out.push({kind:'ring',cx:x,cy:y,len:1.1,wid:.2,ang:a+Math.PI/2+.5});}
 return out;}
function marksMesh(r,rm){const T=r.T,spec=ZONE[rm.id];if(!T||!spec?.marks)return null;const L=rm.exploration,cells=L?.floorCells;if(!Array.isArray(cells)||!cells.length)return null;
 let list=crossings(cells);const loop=spec.marks==='loop';if(loop){const nodes=(L.nodes||[]).filter(n=>Array.isArray(n.box));let big=null,ba=0;for(const n of nodes){const b=n.box,a=(b[2]-b[0])*(b[3]-b[1]);if(a>ba){ba=a;big=b;}}list=list.filter(s=>s.kind==='zebra').concat(ring(cells,big));}
 if(!loop&&spec.marks==='road'){// 큰 방(교차로 광장) 바닥에도 젖은 물웅덩이 반사 두 곳 — 네 귀가 모두 바닥 칸일 때만
  const key=new Set(cells.map(([x,y])=>x+':'+y)),inF=(x,y)=>key.has(Math.floor(x)+':'+Math.floor(y));
  const boxes=(L.nodes||[]).map(n=>n.box).filter(b=>Array.isArray(b)&&b[2]-b[0]>=6&&b[3]-b[1]>=6).sort((a,b)=>(b[2]-b[0])*(b[3]-b[1])-(a[2]-a[0])*(a[3]-a[1])).slice(0,3);
  for(const b of boxes)for(const [fx,fy] of [[.22,.7],[.68,.28]]){const x0=b[0]+(b[2]-b[0])*fx,y0=b[1]+(b[3]-b[1])*fy,x1=x0+2.1,y1=y0+1.15;if(inF(x0,y0)&&inF(x1,y0)&&inF(x0,y1)&&inF(x1,y1))list.push({kind:'puddle',x0,y0,x1,y1});}
  // 웅덩이마다 가는 하늘빛 반사 줄(가로등 반사) 하나
  for(const s of list.filter(q=>q.kind==='puddle')){const cx=(s.x0+s.x1)/2,cy=(s.y0+s.y1)/2,w=(s.x1-s.x0)*.32;list.push({kind:'glint',x0:cx-w,x1:cx+w,y0:cy-.04,y1:cy+.04});}}
 if(!list.length)return null;const Y=.03;
 // 칠(횡단보도·차선·연석선·고리) 한 묶음, 물웅덩이(타원) 한 묶음 — 단색 재질(캔버스 결 텍스처는 헤드리스·실기 모두 안 보였음)
 const build=(items,tint,opacity,order,name)=>{if(!items.length)return null;const pos=[],idx=[];let n=0;
  for(const s of items){if(s.kind==='puddle'){const cx=(s.x0+s.x1)/2,cy=(s.y0+s.y1)/2,rx=(s.x1-s.x0)/2,ry=(s.y1-s.y0)/2,K=14;pos.push(cx,Y,cy);const c0=n++;
    for(let k=0;k<K;k++){const t=k/K*2*Math.PI,w=1+.12*Math.sin(3*t+cx);pos.push(cx+Math.cos(t)*rx*w,Y,cy+Math.sin(t)*ry*w);}for(let k=0;k<K;k++)idx.push(c0,c0+1+((k+1)%K),c0+1+k);n+=K;continue;}
   let q;if(s.kind==='ring'){const ca=Math.cos(s.ang),sa=Math.sin(s.ang),hl=s.len/2,hw=s.wid/2;q=[[-hl,-hw],[hl,-hw],[hl,hw],[-hl,hw]].map(([u,v])=>[s.cx+u*ca-v*sa,s.cy+u*sa+v*ca]);}else q=[[s.x0,s.y0],[s.x1,s.y0],[s.x1,s.y1],[s.x0,s.y1]];
   for(const [x,y] of q)pos.push(x,Y,y);idx.push(n,n+2,n+1,n,n+3,n+2);n+=4;}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeBoundingSphere();r.spatialResources?.add(g);
  const m=new T.MeshBasicMaterial({transparent:true,opacity,depthWrite:false,toneMapped:false,color:tint,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3});r.spatialResources?.add(m);
  try{if(r.sightState24)window.StoryPhase1?.attachSight24?.(m,r.sightState24);}catch(_){}
  const mesh=new T.Mesh(g,m);mesh.name=name;mesh.layers.set(2);mesh.renderOrder=order;mesh.userData.presentationOnly=true;mesh.userData.r1366=true;return mesh;};
 // 옥상: 밝은 방수 바닥 위 청록 야광 도료(정본 '파란불'·청록빌라), 0.78 로 또렷하게. 도로: 흰 도료 0.62, 물웅덩이: 차가운 하늘빛 반사 0.52(+가는 반사 줄 0.8)
 const paint=build(list.filter(s=>s.kind!=='puddle'&&s.kind!=='glint'),loop?new T.Color(.16,.6,.7):new T.Color(.86,.88,.88),loop?.78:.62,-18,'r1366-road-marks');
 const wet=build(list.filter(s=>s.kind==='puddle'),new T.Color(.6,.72,.9),.52,-19,'r1366-wet-puddles'),glint=build(list.filter(s=>s.kind==='glint'),new T.Color(.88,.95,1),.8,-17,'r1366-wet-glints');
 stats.marks=list.length;if(!wet)return paint;const grp=new T.Group();grp.name='r1366-road-marks-group';grp.userData.r1366=true;if(paint)grp.add(paint);grp.add(wet);if(glint)grp.add(glint);return grp;}
function installMarks(){const C=window.StoryPhase1?.ThreeRenderer?.prototype,base=C?.createSpatial;if(!base)return;
 C.createSpatial=function(asset,art,...a){const out=base.call(this,asset,art,...a);try{if(prefs.on&&prefs.marks&&typeof room!=='undefined'&&room&&room.layer==='STORY'&&ZONE[room.id]?.marks&&!skipRoom(room)&&this.spatialRoot){const m=marksMesh(this,room);if(m)this.spatialRoot.add(m);}}catch(e){fail(e);}return out;};}

// 그리기 감싸기는 모든 오버레이가 실린 뒤(DOMContentLoaded) 맨 바깥에 건다 — 태그 순서 검사(r176)가 끝 줄을 고정하므로 태그는 중간에 둔다.
// 계획은 그리기 밖에서 센다: rooms-r523 등이 그리는 동안 room.props 를 잠시 다른 배열로 바꿔 끼워, 그 안에서 세면 숨김이 프레임마다 뒤집혔다(헤드리스 실측).
const tickPlan=()=>{try{if(prefs.on&&prefs.declutter&&typeof room!=='undefined'&&room&&Array.isArray(room.props))ensure(room);}catch(e){fail(e);}};
function installPlan(){if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){const out=await base.apply(this,a);lastRoom=null;tickPlan();return out;};}setInterval(tickPlan,250);}
const go=()=>{try{install();installMarks();installPlan();}catch(e){fail(e);}};
if(typeof document!=='undefined'&&document.readyState==='loading')document.addEventListener('DOMContentLoaded',go,{once:true});else go();
window.__STORYWORLD_PROPS_DECLUTTER_R1366__=Object.freeze({revision:REV,plan,contact,crossings,ring,noBlob:()=>prefs.on&&prefs.ground,zones:ZONE,reference:REFERENCE,indoor:[...INDOOR],
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,room:typeof room!=='undefined'&&room&&Array.isArray(room.props)?{id:room.id,hidden:room.props.filter(p=>String(p?.r303Hide||'').startsWith('r1366')).map(p=>[p.id,p.r303Hide,artOf(p).split('/').pop()])}:null,collisionChanged:false,GPU:false})});
})();
