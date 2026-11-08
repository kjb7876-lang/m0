// R430 테마 맵 생동감 — 사용자 2026-11-08
//  "분노귀맵처럼 방화같이 테마가 확실한-불이나고 있는 이펙트 확실하게 어떤일이 일어나곳에는 맵곳곳에 프레임애니메이션효과 조형물등에 넣어서
//   생동감있게 해줘 각테마상황에 맞게 적절하게(최상그래픽에서만 작동하게)" + "구글드라이브 이펙트자산 어제오늘생성한거 확인후 개선후 적절하게 배치"
//  · 그림: 드라이브 core24 이펙트 시트(2026-11-08, Dots 협업 프레임 시트, QA_HOLD)를 scripts/r430-theme-fx.py 로 손질한 assets/r430/*.webp.
//    화염벽·독안개는 타오르는/고인 구간만 골라 이음새 없는 루프로 다시 묶었다(맵에 오래 있어도 '켜졌다 꺼졌다'가 반복되지 않게).
//    코드로 그린 선·원은 쓰지 않는다. 십자가 모양 그림은 없다(사용자 규칙: 십자가는 늘 위가 짧고 아래가 긴 바른 모양 — 이 묶음에는 해당 없음).
//  · 어디에: 지역 이름·서사를 새로 짓지 않고, 정본 제목이 그 사건을 말하는 지역만 고른다(아래 ZONES). 맘몬의 금고(ep1b06)는 다른 작업 몫이라 뺀다.
//      불을 지른 남자(ep1b07) = 곳곳의 불길 · 환자와 중독의 도시(ep1a10)·늪(dist02·last301·last303) = 독안개(늪은 물가 촉수가 드물게)
//      무너진 성(dist03)·추락(dist06) = 바닥이 갈라짐 · 눈보라 속의 소년(ep1b06b) = 냉기 돌풍 · 피로 물든 병원(ep1a08)·주사실(ep1a09) = 감염 번짐
//      생체 부트로더(ep1b09)·통제자 단계(u201~u206) = 기계 전기 방전 · 카이로노미콘(kair01~10) = 시간 균열 · 사이비 성당(cult01·03·04) = 저주 낙인
//  · 최상 그래픽에서만: 간이설정 그래픽 품질 '높음'(lowFx 끔 + 호러 '강')이고 '렉 줄이기'(R150 가벼운 화면)가 꺼져 있을 때만 그린다.
//    휴대폰은 같은 조건에서 자리 수를 절반으로. 그 밖 품질에서는 자리 계산도 그리기도 하지 않는다.
//  · 그리기 전용: 피해·충돌·길찾기·조준·저장에 관여하지 않는다(엔진 effects 에 표지 하나만 넣어 drawEffect 안에서 그린다 — R411 과 같은 길).
//    문·입구·관문·목표·제단·이동 지점·상호작용 소품 둘레는 비우고, 시야(SIGHT24) 밖·화면 밖은 그리지 않는다.
//    가끔 터지는 것(균열·방전·촉수 등)은 영웅 3.5칸 안에서는 시작하지 않아 적 공격으로 오인되지 않게 한다.
//  · 끄기: localStorage['storyworld.r430.themefx']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_THEME_FX_R430__)return;
const REV='R430-theme-fx-1',KEY='storyworld.r430.themefx',D='assets/r430/',CELL=192;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={rooms:0,spots:0,draws:0,bursts:0,skippedQuality:0,errors:0};let lastError=null,last=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const fin=v=>Number.isFinite(v),T=()=>typeof time==='number'?time:0;
// 시트: [프레임 수, 열, 피벗(px, 192칸), fps, 루프]
const SHEET={
 'fire-loop':[10,6,[96,131],10,true],'mist-loop':[20,6,[96,120],9,true],
 fissure:[24,6,[96,120],12.5,false],arc:[24,6,[96,156],12.5,false],rift:[24,6,[96,112],11,false],blight:[24,6,[96,96],10,false],
 tendril:[24,6,[96,156],11,false],frost:[24,6,[96,131],12.5,false],brand:[24,6,[96,96],10,false]};
// 효과 종류: 시트 · 크기(칸) · 불투명도 · 쉬는 시간(초, 터지는 것만) · 자리(wall=뒷벽 앞, open=트인 바닥, any) · 밝기 필터
const KIND={
 fire:{sheet:'fire-loop',tiles:[2.2,3.2],alpha:.92,spot:'wall',glow:'255,112,40',filter:'brightness(1.05) saturate(1.05)'},
 fireOpen:{sheet:'fire-loop',tiles:[1.5,2.2],alpha:.85,spot:'open',glow:'255,112,40',filter:'brightness(.98)'},
 mist:{sheet:'mist-loop',tiles:[2.6,3.6],alpha:.75,spot:'open',filter:'brightness(1.05) saturate(.9)'},
 swampMist:{sheet:'mist-loop',tiles:[2.8,3.8],alpha:.75,spot:'open',filter:'brightness(1.1) saturate(.8)'},
 tendril:{sheet:'tendril',tiles:[1.6,2],alpha:.9,idle:[11,22],spot:'open',farHero:3.5,filter:'brightness(.85)'},
 fissure:{sheet:'fissure',tiles:[2.6,3.2],alpha:.95,idle:[6,13],spot:'open',farHero:3.5,glow:'255,110,45',filter:'brightness(1.35) contrast(1.1)'},
 frost:{sheet:'frost',tiles:[2,2.8],alpha:.72,idle:[4,9],spot:'any',farHero:2.5,filter:'brightness(.95)'},
 blight:{sheet:'blight',tiles:[1.8,2.4],alpha:.82,idle:[6,12],spot:'open',farHero:3,filter:'brightness(1) saturate(.9)'},
 arc:{sheet:'arc',tiles:[1.7,2.2],alpha:.85,idle:[5,11],spot:'wall',glow:'150,140,255',farHero:3.5,filter:'brightness(1)'},
 rift:{sheet:'rift',tiles:[1.8,2.4],alpha:.7,idle:[6,12],spot:'open',farHero:3.5,filter:'brightness(.9) saturate(.85)'},
 brand:{sheet:'brand',tiles:[1.8,2.3],alpha:.8,idle:[7,13],spot:'open',farHero:3,filter:'brightness(.85)'}};
// 지역 → [종류, 자리 수]. 정본 제목이 그 사건을 말하는 곳만(위 머리말).
const Z={
 ep1b07:[['fire',10],['fireOpen',5]],
 ep1a10:[['mist',6]],
 dist02:[['swampMist',5],['tendril',2]],last301:[['swampMist',4],['tendril',1]],last303:[['swampMist',4],['tendril',1]],
 dist03:[['fissure',3]],dist06:[['fissure',4]],
 ep1b06b:[['frost',5]],
 ep1a08:[['blight',4]],ep1a09:[['blight',3]],
 ep1b09:[['arc',5]],u201:[['arc',4]],u202:[['arc',4]],u203:[['arc',4]],u204:[['arc',4]],u205:[['arc',4]],u206:[['arc',5]],
 cult01:[['brand',3]],cult03:[['brand',3]],cult04:[['brand',4]]};
for(const k of['kair01','kair02','kair03','kair04','kair05','kair06','kair07','kair08','kair09','kair10'])Z[k]=[['rift',3]];
const ZONES=Object.freeze(Z);
// 최상 그래픽 판정
const mobile=()=>{try{return !!window.__STORYWORLD_MOBILE_R63__?.isMobile?.();}catch(_){return false;}};
function topQuality(){try{if(typeof settings!=='undefined'&&settings.lowFx)return false;if(document.documentElement.classList.contains('swLiteR150'))return false;
 const c=window.__STORYWORLD_CINEMA_R114__;return !!c&&c.prefs().horror==='high';}catch(_){return false;}}
// 결정적 난수(지역 id 시드)
function rng(seed){let h=2166136261>>>0;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return()=>{h=Math.imul(h^h>>>15,2246822507)>>>0;h=Math.imul(h^h>>>13,3266489909)>>>0;h^=h>>>16;return(h>>>0)/4294967296;};}
function avoidPoints(r){const L=r.exploration,out=[];for(const d of L.worldR74?.doors||[])if(fin(d.x+d.y))out.push([d.x,d.y,(+d.width||0)/2+2.5]);
 for(const q of[L.entry,L.gate,r.objective,r.altar,L.altar])if(q&&fin(q.x+q.y))out.push([q.x,q.y,3]);
 try{const P=window.__STORYWORLD_ROUTES_R72__?.points?.(r);for(const k of['next','previous'])if(P?.[k]&&fin(P[k].x+P[k].y))out.push([P[k].x,P[k].y,3]);}catch(_){}
 for(const p of r.props||[])if(p&&fin(p.x+p.y))out.push([p.x,p.y,p.interactive||p.r75NPC||p.r75NarrativeNPC||p.r74Door||p.r81WardDoor?2.5:1.1]);
 return out;}
// 순수(QA): 레이아웃 → 트인 바닥 칸·뒷벽 앞 칸
function candidates(L,avoid){const F=new Set(L.floorCells.map(c=>c[0]+','+c[1])),has=(x,y)=>F.has(x+','+y),open=[],wall=[];
 for(const[x,y]of L.floorCells){let n=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if(has(x+i,y+j))n++;
  const cx=x+.5,cy=y+.5,ok=(px,py)=>!avoid.some(([ax,ay,rr])=>Math.hypot(ax-px,ay-py)<rr);
  if(n===9){if(ok(cx,cy))open.push({x:cx,y:cy});}
  // 뒷벽(-x 또는 -y 가 바닥 밖, 앞은 바닥): 화면 뒤쪽 벽 앞이라 불길·방전이 벽을 타고 오르는 것처럼 보이고 영웅을 가리지 않는다.
  if(n>=6)for(const[dx,dy]of[[-1,0],[0,-1]])if(!has(x+dx,y+dy)&&has(x-dx,y-dy)&&has(x-dx*2,y-dy*2)){const px=cx-dx*.05,py=cy-dy*.05;if(ok(px,py))wall.push({x:px,y:py});}}
 return{open,wall};}
function pick(list,used,gap,rand){const order=list.map((p,i)=>[rand(),i]).sort((a,b)=>a[0]-b[0]);for(const[,i]of order){const p=list[i];if(used.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>=gap))return p;}return null;}
// 순수(QA): 방 → 자리 목록(결정적). room 은 바꾸지 않는다.
function plan(r,half=false){const id=String(r?.id||''),spec=ZONES[id];const L=r?.exploration;if(!spec||!L||!Array.isArray(L.floorCells)||!L.floorCells.length)return[];
 const rand=rng('r430:'+id),{open,wall}=candidates(L,avoidPoints(r)),used=[],out=[];
 for(const[kind,n0]of spec){const K=KIND[kind],n=half?Math.ceil(n0/2):n0;
  const pool=K.spot==='wall'?(wall.length?wall:open):K.spot==='open'?open:open.concat(wall);
  for(let i=0;i<n;i++){const p=pick(pool,used,kind==='fire'?3.2:4.2,rand);if(!p)break;used.push(p);
   const s=K.tiles[0]+(K.tiles[1]-K.tiles[0])*rand();
   out.push({kind,x:+p.x.toFixed(2),y:+p.y.toFixed(2),size:+s.toFixed(2),flip:rand()<.5,phase:+(rand()*7).toFixed(2),next:K.idle?+(1+rand()*K.idle[1]).toFixed(2):0});}}
 return out;}
// 방마다 한 번 계획(레이아웃 객체가 바뀌면 다시)
const planned=new WeakMap();let spots=[],spotsRoom=null,spotsLayout=null,spotsHalf=null;
function ensure(){if(typeof room==='undefined'||!room||typeof layer!=='undefined'&&layer!=='STORY'){spots=[];spotsRoom=null;return spots;}
 const half=mobile();if(spotsRoom===room&&spotsLayout===room.exploration&&spotsHalf===half)return spots;
 spotsRoom=room;spotsLayout=room.exploration;spotsHalf=half;const t0=T();
 try{spots=plan(room,half).map(s=>({...s,start:s.next?t0+s.next:-1,born:t0}));}catch(e){fail(e);spots=[];}
 if(spots.length){stats.rooms++;stats.spots+=spots.length;last={zone:room.id,spots:spots.map(s=>s.kind+'@'+s.x+','+s.y)};for(const n of new Set(spots.map(s=>KIND[s.kind].sheet)))image(n);}
 return spots;}
const asked=new Map();
function image(name){const p=D+name+'.webp';try{const got=typeof readyImage==='function'?readyImage(p):null;if(got?.image)return got.image;
 const t=Date.now();if(t-(asked.get(p)||0)>1500){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});else if(typeof addImage==='function')addImage(p,'R430 theme fx');}}catch(e){fail(e);}return null;}
function frameOf(s,t){const K=KIND[s.kind],S=SHEET[K.sheet],[N,,,fps,loop]=S;
 if(loop)return{fr:Math.floor((t+s.phase)*fps)%N,fade:Math.min(1,(t-s.born)/1.2)};
 if(s.start<0||t<s.start)return null;const f=Math.floor((t-s.start)*fps);
 if(f>=N){const r=rng(s.x+':'+s.y+':'+Math.floor(t));s.start=t+K.idle[0]+(K.idle[1]-K.idle[0])*r();s.live=false;return null;}
 return{fr:f,fade:1};}
function heroFar(s,d){try{return Math.hypot(player.x-s.x,player.y-s.y)>=d;}catch(_){return true;}}
function drawSpot(s,t,unit,vw,vh,sight){const K=KIND[s.kind],S=SHEET[K.sheet];
 // 터지는 것: 시작 순간 영웅이 가까우면 다음으로 미룬다
 if(!S[4]&&s.start>=0&&t>=s.start&&!s.live){if(K.farHero&&!heroFar(s,K.farHero)){s.start=t+2+((s.x*7+s.y*3)%3);return;}s.live=true;s.start=t;stats.bursts++;}
 const f=frameOf(s,t);if(!f)return;if(sight?.enabled&&!sight.pointVisible(s.x,s.y))return;
 const q=project(s.x,s.y);if(!fin(q.x+q.y)||q.x<-260||q.y<-260||q.x>vw+260||q.y>vh+320)return;
 const im=image(K.sheet);if(!im)return;
 const sc=s.size*2*unit/CELL,cx=(f.fr%S[1])*CELL,cy=Math.floor(f.fr/S[1])*CELL;
 const run=()=>{ctx.globalCompositeOperation='source-over';if(K.glow){const gw=s.size*unit*.9;for(let i=0;i<3;i++){ctx.fillStyle='rgba('+K.glow+','+(.05*f.fade).toFixed(3)+')';ctx.beginPath();ctx.ellipse(q.x,q.y-2,gw*(1-i*.28),gw*.42*(1-i*.28),0,0,Math.PI*2);ctx.fill();}}ctx.globalAlpha*=K.alpha*f.fade;try{ctx.filter=K.filter;}catch(_){}ctx.translate(q.x,q.y);ctx.scale(s.flip?-sc:sc,sc);
  ctx.drawImage(im,cx,cy,CELL,CELL,-S[2][0],-S[2][1],CELL,CELL);};
 ctx.save();try{if(typeof ctx.scope==='function')ctx.scope({id:'r430:'+s.kind+':'+s.x+':'+s.y,kind:'effect',x:s.x,y:s.y,presentationOnly:true,r430:true},run);else run();stats.draws++;}finally{ctx.restore();}}
function drawAll(){if(!on||typeof ctx==='undefined'||!ctx||typeof project!=='function')return;if(!topQuality()){stats.skippedQuality++;return;}
 const list=ensure();if(!list.length)return;const t=T(),unit=(typeof TILE==='number'?TILE:34)*(typeof zoom==='number'?zoom:1),vw=typeof W==='number'?W:innerWidth,vh=typeof H==='number'?H:innerHeight,sight=window.__STORYWORLD_SIGHT24__;
 for(const s of list)try{drawSpot(s,t,unit,vw,vh,sight);}catch(e){fail(e);}}
// 엔진 effects 에 표지 하나(R411 과 같은 방식): 지역을 옮기면 effects 가 비워지므로 tick 마다 다시 건다.
const SENT={type:'r430-theme-fx',x:0,y:0,age:0,life:Infinity,r430Sentinel:true};
function arm(want){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const i=effects.indexOf(SENT);if(want&&i<0){SENT.age=0;effects.push(SENT);}else if(!want&&i>=0)effects.splice(i,1);}catch(_){}}
try{
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r430-theme-fx'){try{drawAll();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{const want=on&&topQuality()&&typeof room!=='undefined'&&!!room&&!!ZONES[room.id]&&(typeof layer==='undefined'||layer==='STORY');arm(want);}catch(e){fail(e);}return r;};}
}catch(e){fail(e);}
function set(o){if(o&&typeof o.on==='boolean'){on=o.on;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}if(!on)arm(false);}return{on};}
// QA: 가끔 터지는 자리를 지금 바로 시작(헤드리스 화면 확인용)
function preview(){const t=T();for(const s of spots)if(s.start>=0){s.start=t;s.live=false;}return spots.length;}
window.__STORYWORLD_THEME_FX_R430__=Object.freeze({revision:REV,ZONES,KIND,SHEET,candidates,plan,topQuality,set,preview,
 inspect:()=>({revision:REV,on,top:topQuality(),stats:{...stats},spots:spots.map(s=>({kind:s.kind,x:s.x,y:s.y,size:s.size})),last,lastError,browserVerified:false,GPUVerified:false})});
})();
