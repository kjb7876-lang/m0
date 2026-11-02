// R225 못 닿는 적 → 닿는 자리로(진행 막힘 방지). 사용자 2026-11-02 "무한디버깅", "실플레이해서 총개선".
// 실플레이(길잡이·미카엘라)에서 dist02 늪의 정원이 1시간 넘게 끝나지 않았다: 살아 있는 적 1(늪의 염소머리 악마, dist02-h1)이
//  입구에서 이어지지 않는 바닥 조각(52.6, 48.9)에 서 있어 아무도 잡을 수 없었다(같은 지역을 다시 열어도 같은 자리 — 재현됨).
// 고친 것: 지역(레이아웃)마다 입구에서 걸어서 닿는 칸을 한 번 계산하고(문은 진행하며 열리므로 열린 것으로 본다),
//  살아 있는 활성 적이 3 이하로 줄면 3초마다 그 계산을 새로 하고, 그 밖에 선 적을 가장 가까운 닿는 칸으로 옮긴다. 보스도 같다(잡을 수 없으면 진행이 막힘).
//  판정·체력·공격은 그대로, 자리만. 옮긴 수는 inspect().stats.moved.
// 끄기: localStorage['storyworld.r225.reach']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_REACH_R225__)return;
const REV='R225-reach-1+R231+R234',KEY='storyworld.r225.reach',RAD=.27;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={layouts:0,moved:0,checks:0,errors:0,last:null};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const key=(x,y)=>x+','+y;const cache=new WeakMap();
function doorsOf(L){return [...(L?.worldR74?.doors||[]),...(L?.hospitalDoorsB3||[])];}
function nearDoor(L,x,y){return doorsOf(L).some(d=>Math.abs(d.x-x)<(Number(d.width)||1)/2+.7&&Math.abs(d.y-y)<(Number(d.depth)||1)/2+.7);}
function open(L,cx,cy){const x=cx+.5,y=cy+.5;try{return nearDoor(L,x,y)||!blocked(x,y,RAD,room);}catch(_){return false;}}
// R231: 칸 중심만 보면 칸 경계에 놓인 얇은 벽(두께 .24)을 건너뛰어 벽 너머 주머니를 '닿는다'고 셌다 → 두 칸 사이 경계 중간점도 본다(문 둘레는 열린 것으로).
function edge(L,x,y,dx,dy){const mx=x+.5+dx*.5,my=y+.5+dy*.5;try{return nearDoor(L,mx,my)||!blocked(mx,my,RAD,room);}catch(_){return false;}}
function reachOf(L,fresh){let R=fresh?null:cache.get(L);if(R)return R;const e=L.entry||L.entrance||(typeof player==='object'?player:null);if(!e)return null;
 let s=[Math.floor(e.x),Math.floor(e.y)];if(!open(L,...s)){const p=typeof player==='object'&&player?[Math.floor(player.x),Math.floor(player.y)]:null;if(p&&open(L,...p))s=p;else return null;}
 const seen=new Set([key(...s)]),q=[s];const [bx,by,W,H]=L.bounds||[0,0,200,200];
 for(let h=0;h<q.length&&h<60000;h++){const [x,y]=q[h];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(nx<bx||ny<by||nx>=bx+W||ny>=by+H||seen.has(k))continue;if(open(L,nx,ny)&&edge(L,x,y,dx,dy)){seen.add(k);q.push([nx,ny]);}}}
 R={seen,size:seen.size};cache.set(L,R);stats.layouts++;return R;}
// R234: 남은 적이 2 이하일 때는 '지금 영웅 자리에서 닫힌 문을 그대로 두고' 걸어서 닿는지도 본다. kair06 지역별 길잡이 검사에서
//  중간보스(시간수문장 13, 체력 504/7839)가 닫힌 문 너머 (39,58)에 남아, 문을 열린 것으로 보는 위 계산으로는 '닿음'이라 옮겨지지 않았고
//  길잡이는 중앙 근처만 맴돌며 끝나지 않았다(37분). 10초 넘게 계속 못 닿으면 영웅이 닿는 가장 가까운 칸으로 옮긴다.
function reachStrict(L){if(typeof player!=='object'||!player)return null;const s=[Math.floor(player.x),Math.floor(player.y)];const ok=(cx,cy)=>{try{return !blocked(cx+.5,cy+.5,RAD,room);}catch(_){return false;}};
 const okE=(x,y,dx,dy)=>{try{return !blocked(x+.5+dx*.5,y+.5+dy*.5,RAD,room);}catch(_){return false;}};const seen=new Set([key(...s)]),q=[s];const [bx,by,W,H]=L.bounds||[0,0,200,200];
 for(let h=0;h<q.length&&h<60000;h++){const [x,y]=q[h];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(nx<bx||ny<by||nx>=bx+W||ny>=by+H||seen.has(k))continue;if(ok(nx,ny)&&okE(x,y,dx,dy)){seen.add(k);q.push([nx,ny]);}}}
 return {seen,size:seen.size};}
function nearest(R,x,y){const cx=Math.floor(x),cy=Math.floor(y);for(let r=1;r<40;r++){let best=null,bd=1e9;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const k=key(cx+dx,cy+dy);if(!R.seen.has(k))continue;const d=dx*dx+dy*dy;if(d<bd){bd=d;best=[cx+dx,cy+dy];}}if(best)return best;}return null;}
function check(){if(!on||typeof room!=='object'||!room||typeof player!=='object'||!player||loading||!started)return;const L=room.exploration;if(!L?.floorCells?.length)return;
 if(L.worldR74==null&&!L.entry)return;
 // 적이 거의 다 잡혔을 때(살아 있는 활성 적 3 이하)만 본다 — 막힘은 그때 드러나고, 매번 새로 계산해도 비용이 작다(전투 중 렉 없음).
 const act=(room.enemies||[]).filter(e=>e&&e.hp>0&&e.spawnState!=='hidden');if(!act.length||act.length>3)return;
 const R=reachOf(L,true);if(!R||R.size<40)return;stats.checks++;
 for(const e of room.enemies||[]){if(!e||!(e.hp>0)||e.spawnState==='hidden')continue;if(R.seen.has(key(Math.floor(e.x),Math.floor(e.y))))continue;
  const to=nearest(R,e.x,e.y);if(!to)continue;const from=[+e.x.toFixed(1),+e.y.toFixed(1)];e.x=to[0]+.5;e.y=to[1]+.5;if(Number.isFinite(e.homeX)){e.homeX=e.x;e.homeY=e.y;}e.nav=[];e.r225Moved=(e.r225Moved||0)+1;stats.moved++;stats.last={zone:room.id,id:e.nativeId||e.id,name:e.name,from,to:[e.x,e.y]};}
 if(act.length<=2){const RS=reachStrict(L);if(!RS||RS.size<40)return;const now=typeof time==='number'?time:0;
  for(const e of act){if(RS.seen.has(key(Math.floor(e.x),Math.floor(e.y)))){e.r234Since=null;continue;}if(e.r234Since==null){e.r234Since=now;continue;}if(now-e.r234Since<10)continue;
   const to=nearest(RS,e.x,e.y);if(!to)continue;const from=[+e.x.toFixed(1),+e.y.toFixed(1)];e.x=to[0]+.5;e.y=to[1]+.5;if(Number.isFinite(e.homeX)){e.homeX=e.x;e.homeY=e.y;}e.nav=[];e.r234Since=null;e.r234Moved=(e.r234Moved||0)+1;stats.strictMoved=(stats.strictMoved||0)+1;stats.last={zone:room.id,id:e.nativeId||e.id,name:e.name,from,to:[e.x,e.y],strict:true};}}}
if(typeof setInterval==='function')setInterval(()=>{try{check();}catch(e){fail(e);}},3000);
window.__STORYWORLD_REACH_R225__=Object.freeze({revision:REV,inspect:()=>({revision:REV,on,stats:{...stats},lastError}),check,reachOf,set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
