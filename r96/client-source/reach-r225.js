// R225 못 닿는 적 → 닿는 자리로(진행 막힘 방지). 사용자 2026-11-02 "무한디버깅", "실플레이해서 총개선".
// 실플레이(길잡이·미카엘라)에서 dist02 늪의 정원이 1시간 넘게 끝나지 않았다: 살아 있는 적 1(늪의 염소머리 악마, dist02-h1)이
//  입구에서 이어지지 않는 바닥 조각(52.6, 48.9)에 서 있어 아무도 잡을 수 없었다(같은 지역을 다시 열어도 같은 자리 — 재현됨).
// 고친 것: 지역(레이아웃)마다 입구에서 걸어서 닿는 칸을 한 번 계산하고(문은 진행하며 열리므로 열린 것으로 본다),
//  살아 있는 활성 적이 3 이하로 줄면 3초마다 그 계산을 새로 하고, 그 밖에 선 적을 가장 가까운 닿는 칸으로 옮긴다. 보스도 같다(잡을 수 없으면 진행이 막힘).
//  판정·체력·공격은 그대로, 자리만. 옮긴 수는 inspect().stats.moved.
// 끄기: localStorage['storyworld.r225.reach']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_REACH_R225__)return;
const REV='R225-reach-1+R231+R234+R1047',KEY='storyworld.r225.reach',RAD=.27;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={layouts:0,moved:0,checks:0,errors:0,last:null};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const key=(x,y)=>x+','+y;const regroup={zone:null,sum:-1,at:0};const cache=new WeakMap();
const doorMemo=new WeakMap();/* R1043: 칸마다 문 목록을 새로 펼치던 것 → 레이아웃·문 배열이 같으면 다시 쓴다 */
function doorsOf(L){if(!L||typeof L!=='object')return [];const a=L.worldR74?.doors,b=L.hospitalDoorsB3;let m=doorMemo.get(L);if(!m||m.a!==a||m.b!==b||m.na!==(a?.length|0)||m.nb!==(b?.length|0)){m={a,b,na:a?.length|0,nb:b?.length|0,list:[...(a||[]),...(b||[])]};doorMemo.set(L,m);}return m.list;}
function nearDoor(L,x,y){return doorsOf(L).some(d=>Math.abs(d.x-x)<(Number(d.width)||1)/2+.7&&Math.abs(d.y-y)<(Number(d.depth)||1)/2+.7);}
// R1043 렉: 3초마다 지역 전체를 두 번 훑으며 칸마다 blocked() 를 불러 한 번에 수십 ms 걸렸다(헤드리스 무한 생존: 6초에 74ms, 3초마다 끊김).
//  벽·바닥은 지역 안에서 거의 그대로이므로 같은 레이아웃·같은 지역이면 15초 동안 칸별 blocked() 결과를 다시 쓴다(15초가 지나거나 지역이 바뀌면 새로 잰다).
const bm={L:null,id:null,at:0,m:new Map(),R:null,RS:null};
// 같은 15초 창 안에서는 BFS 결과 자체도 다시 쓴다: 입구 기준 도달(문은 열린 것으로)은 벽이 같으면 같고, 영웅 기준 도달은 영웅이 지난번 도달 칸 안에 있으면 같은 연결 덩어리라 같다.
function fresh_(L){try{B(-1e6,-1e6);}catch(_){}return bm.L===L&&L===(room&&room.exploration);}
function B(x,y){const L=room&&room.exploration,id=room&&room.id,now=Date.now();if(bm.L!==L||bm.id!==id||now-bm.at>15000||bm.m.size>200000){bm.L=L;bm.id=id;bm.at=now;bm.m.clear();bm.R=null;bm.RS=null;}
 const k=x+','+y;let v=bm.m.get(k);if(v===undefined){v=!!blocked(x,y,RAD,room);bm.m.set(k,v);}return v;}
function open(L,cx,cy){const x=cx+.5,y=cy+.5;try{return nearDoor(L,x,y)||!B(x,y);}catch(_){return false;}}
// R231: 칸 중심만 보면 칸 경계에 놓인 얇은 벽(두께 .24)을 건너뛰어 벽 너머 주머니를 '닿는다'고 셌다 → 두 칸 사이 경계 중간점도 본다(문 둘레는 열린 것으로).
function edge(L,x,y,dx,dy){const mx=x+.5+dx*.5,my=y+.5+dy*.5;try{return nearDoor(L,mx,my)||!B(mx,my);}catch(_){return false;}}
// R1047: 레이아웃 bounds 는 엔진·다른 오버레이 모두 [minX,minY,maxX,maxY] 다(엔진 몹 자리 맞춤 clamp(bounds[0]..bounds[2])).
//  예전에는 [x,y,너비,높이]로 읽어 min 이 0 인 지역만 맞았고, min 이 음수인 사몽 층 cult04([-28,-28,81,81])에서는 x·y 53 너머를 끊어
//  입구 쪽 66칸만 '닿는다'고 봤다 → 영웅 곁 히든 페르소나를 못 가는 주머니(48.5,46.5)로 3초마다 옮겨 결투가 시작되지 않았다(헤드리스 재현, qa/r1047).
function boundsOf(L){const b=Array.isArray(L?.bounds)?L.bounds.map(Number):null;if(!b||b.length<4||!b.every(Number.isFinite)||b[2]<=b[0]||b[3]<=b[1])return [0,0,200,200];return b;}
function reachOf(L,fresh){let R=fresh?(fresh_(L)?bm.R:null):cache.get(L);if(R)return R;const e=L.entry||L.entrance||(typeof player==='object'?player:null);if(!e)return null;
 let s=[Math.floor(e.x),Math.floor(e.y)];if(!open(L,...s)){const p=typeof player==='object'&&player?[Math.floor(player.x),Math.floor(player.y)]:null;if(p&&open(L,...p))s=p;else return null;}
 const seen=new Set([key(...s)]),q=[s];const [bx,by,ex,ey]=boundsOf(L);
 for(let h=0;h<q.length&&h<60000;h++){const [x,y]=q[h];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(nx<bx||ny<by||nx>=ex||ny>=ey||seen.has(k))continue;if(open(L,nx,ny)&&edge(L,x,y,dx,dy)){seen.add(k);q.push([nx,ny]);}}}
 R={seen,size:seen.size};cache.set(L,R);if(fresh_(L))bm.R=R;stats.layouts++;return R;}
// R234: 남은 적이 2 이하일 때는 '지금 영웅 자리에서 닫힌 문을 그대로 두고' 걸어서 닿는지도 본다. kair06 지역별 길잡이 검사에서
//  중간보스(시간수문장 13, 체력 504/7839)가 닫힌 문 너머 (39,58)에 남아, 문을 열린 것으로 보는 위 계산으로는 '닿음'이라 옮겨지지 않았고
//  길잡이는 중앙 근처만 맴돌며 끝나지 않았다(37분). 10초 넘게 계속 못 닿으면 영웅이 닿는 가장 가까운 칸으로 옮긴다.
function reachStrict(L){if(typeof player!=='object'||!player)return null;const s=[Math.floor(player.x),Math.floor(player.y)];if(fresh_(L)&&bm.RS&&bm.RS.seen.has(key(...s)))return bm.RS;const ok=(cx,cy)=>{try{return !B(cx+.5,cy+.5);}catch(_){return false;}};
 const okE=(x,y,dx,dy)=>{try{return !B(x+.5+dx*.5,y+.5+dy*.5);}catch(_){return false;}};const seen=new Set([key(...s)]),q=[s];const [bx,by,ex,ey]=boundsOf(L);
 for(let h=0;h<q.length&&h<60000;h++){const [x,y]=q[h];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(nx<bx||ny<by||nx>=ex||ny>=ey||seen.has(k))continue;if(ok(nx,ny)&&okE(x,y,dx,dy)){seen.add(k);q.push([nx,ny]);}}}
 const RS={seen,size:seen.size};if(fresh_(L))bm.RS=RS;return RS;}
function nearest(R,x,y){const cx=Math.floor(x),cy=Math.floor(y);for(let r=1;r<40;r++){let best=null,bd=1e9;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const k=key(cx+dx,cy+dy);if(!R.seen.has(k))continue;const d=dx*dx+dy*dy;if(d<bd){bd=d;best=[cx+dx,cy+dy];}}if(best)return best;}return null;}
function check(){if(!on||typeof room!=='object'||!room||typeof player!=='object'||!player||loading||!started)return;const L=room.exploration;if(!L?.floorCells?.length)return;
 if(L.worldR74==null&&!L.entry)return;
 // 적이 거의 다 잡혔을 때(살아 있는 활성 적 3 이하)만 본다 — 막힘은 그때 드러나고, 매번 새로 계산해도 비용이 작다(전투 중 렉 없음).
 const act=(room.enemies||[]).filter(e=>e&&e.hp>0&&e.spawnState!=='hidden');if(!act.length||act.length>3)return;
 const R=reachOf(L,true);if(!R||R.size<40)return;stats.checks++;
 for(const e of room.enemies||[]){if(!e||!(e.hp>0)||e.spawnState==='hidden')continue;if(R.seen.has(key(Math.floor(e.x),Math.floor(e.y))))continue;
  const to=nearest(R,e.x,e.y);if(!to)continue;const from=[+e.x.toFixed(1),+e.y.toFixed(1)];e.x=to[0]+.5;e.y=to[1]+.5;if(Number.isFinite(e.homeX)){e.homeX=e.x;e.homeY=e.y;}e.nav=[];e.r225Moved=(e.r225Moved||0)+1;stats.moved++;stats.last={zone:room.id,id:e.nativeId||e.id,name:e.name,from,to:[e.x,e.y]};}
 if(act.length<=2){const RS=reachStrict(L);if(!RS||RS.size<40)return;const now=typeof time==='number'?time:0;
  // R234b: 남은 적이 멀리(12칸 넘게) 있고 20초 동안 남은 적 체력이 전혀 줄지 않았으면(길잡이가 그쪽으로 가지 않음) 그 적을 영웅 쪽 4칸 앞 닿는 칸으로 불러온다.
  //  kair06: 중간보스는 집결 때 숨겨졌다가(R78) 나중에 제자리 (39,58)에 나타났고, 길잡이는 집결 단계라 중앙 전투실 근처만 지켜 37분 끝나지 않았다(길은 있음).
  const sum=act.reduce((a,e)=>a+Math.max(0,e.hp),0),zk=room.id;if(regroup.zone!==zk||Math.abs(sum-regroup.sum)>.5){regroup.zone=zk;regroup.sum=sum;regroup.at=now;}
  else if(now-regroup.at>20){const far=act.filter(e=>Math.hypot(e.x-player.x,e.y-player.y)>12).sort((a,b)=>Math.hypot(b.x-player.x,b.y-player.y)-Math.hypot(a.x-player.x,a.y-player.y))[0];
   if(far){const d=Math.hypot(far.x-player.x,far.y-player.y),tx=player.x+(far.x-player.x)/d*4,ty=player.y+(far.y-player.y)/d*4,to=nearest(RS,tx,ty)||nearest(RS,player.x,player.y);
    if(to){const from=[+far.x.toFixed(1),+far.y.toFixed(1)];far.x=to[0]+.5;far.y=to[1]+.5;if(Number.isFinite(far.homeX)){far.homeX=far.x;far.homeY=far.y;}far.nav=[];far.r234Regroup=(far.r234Regroup||0)+1;stats.regrouped=(stats.regrouped||0)+1;stats.last={zone:room.id,id:far.nativeId||far.id,name:far.name,from,to:[far.x,far.y],regroup:true};regroup.at=now;}}}
  for(const e of act){if(RS.seen.has(key(Math.floor(e.x),Math.floor(e.y)))){e.r234Since=null;continue;}if(e.r234Since==null){e.r234Since=now;continue;}if(now-e.r234Since<10)continue;
   const to=nearest(RS,e.x,e.y);if(!to)continue;const from=[+e.x.toFixed(1),+e.y.toFixed(1)];e.x=to[0]+.5;e.y=to[1]+.5;if(Number.isFinite(e.homeX)){e.homeX=e.x;e.homeY=e.y;}e.nav=[];e.r234Since=null;e.r234Moved=(e.r234Moved||0)+1;stats.strictMoved=(stats.strictMoved||0)+1;stats.last={zone:room.id,id:e.nativeId||e.id,name:e.name,from,to:[e.x,e.y],strict:true};}}}
if(typeof setInterval==='function')setInterval(()=>{try{check();}catch(e){fail(e);}},3000);
window.__STORYWORLD_REACH_R225__=Object.freeze({revision:REV,inspect:()=>({revision:REV,on,stats:{...stats},lastError}),check,reachOf,set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
