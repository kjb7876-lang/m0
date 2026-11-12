// R830 브라우저 검사 — 얇은 칸막이벽(양쪽이 다 바닥인 두께 0.24 벽판)이 메인벽 덩어리로 바뀌었는지, 그 뒤에도 길·문·조형물·NPC 가 온전한지.
//  실행: 정적 서버에 빌드 결과를 올리고  SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r830-walls/walls-browser.mjs  (헤드리스 소프트웨어 렌더 — GPU·실기기 아님)
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const ZONES=(process.env.Z||'hub,hando01,hando02,hando03,kair02,kair03,last301,cult04').split(',');let bad=0,n=0;const ok=(m,c,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x!==undefined?JSON.stringify(x):'');}else console.log('ok  ',m);};
const measure=()=>{const L=room.exploration,fl=new Set(L.floorCells.map(c=>c[0]+':'+c[1])),f=(x,y)=>fl.has(Math.floor(x)+':'+Math.floor(y));
 const thin=[],voidBoth=[];const cover=new Map();
 for(const w of L.walls||[]){if(w.decorative||w.presentationOnly||w.angle)continue;const hz=w.width>=w.depth,len=Math.max(w.width,w.depth),t=Math.min(w.width,w.depth);if(t>.7)continue;let both=0,none=0,m=0;
  for(let s=.5;s<len;s+=1){const a=hz?[w.x-len/2+s,w.y-.5]:[w.x-.5,w.y-len/2+s],b=hz?[w.x-len/2+s,w.y+.5]:[w.x+.5,w.y-len/2+s];m++;const fa=f(...a),fb=f(...b);if(fa&&fb)both++;if(!fa&&!fb)none++;const k=(hz?'h:':'v:')+Math.floor(hz?a[0]:w.x+.01)+':'+Math.floor(hz?w.y+.01:a[1]);cover.set(k,(cover.get(k)||0)+1);}
  if(both)thin.push([w.id,both,m]);if(none)voidBoth.push([w.id,none,m]);}
 // 바닥|비바닥 단위 변마다 벽판이 꼭 하나
 let missing=0,dup=0;for(const k of fl){const[x,y]=k.split(':').map(Number);for(const[e,o]of[['h:'+x+':'+y,[x,y-1]],['h:'+x+':'+(y+1),[x,y+1]],['v:'+x+':'+y,[x-1,y]],['v:'+(x+1)+':'+y,[x+1,y]]]){if(fl.has(o[0]+':'+o[1]))continue;const c=cover.get(e)||0;if(!c)missing++;if(c>1)dup++;}}
 // 바닥이 한 덩어리인가
 const first=L.floorCells[0],seen=new Set([first[0]+':'+first[1]]),q=[first];for(let h=0;h<q.length;h++){const[x,y]=q[h];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+':'+(y+dy);if(fl.has(k)&&!seen.has(k)){seen.add(k);q.push([x+dx,y+dy]);}}}
 // 길목(nodes)·입구에서 서로 길이 나는가(엔진 길찾기)
 const pts=[...(L.nodes||[]).map(p=>({x:p.x,y:p.y})),L.entry].filter(p=>p&&Number.isFinite(p.x+p.y)&&!blocked(p.x,p.y,.29,room));let noPath=0;const from=pts[0];for(const p of pts.slice(1)){let r=null;try{r=findPath(from,p,room,.29);}catch(e){}if(!r||!r.length)noPath++;}
 const stuck=[];for(const a of room.props||[]){if(a.terrainWall||!Number.isFinite(a.x+a.y))continue;if(!f(a.x,a.y)&&a.x>L.bounds[0]&&a.y>L.bounds[1]&&a.x<L.bounds[2]&&a.y<L.bounds[3]&&(a.solid||a.npc||a.interact||a.pickup))stuck.push([a.id||a.type||a.name,+a.x.toFixed(1),+a.y.toFixed(1)]);}
 const mobs=(room.enemies||[]).filter(e=>blocked(e.x,e.y,.2,room)).map(e=>e.id);
 const npc=(()=>{try{const A=window.__STORYWORLD_NPC_R790__;const list=A?.inspect?.()?.npcs||A?.list?.()||[];return list.filter(q=>q&&q.zone===room.id&&Number.isFinite(q.x+q.y)&&blocked(q.x,q.y,.2,room)).map(q=>q.id);}catch(e){return['ERR '+e];}})();
 const propList=(room.props||[]).filter(a=>!a.terrainWall&&Number.isFinite(a.x+a.y)).map(a=>[a.id||a.type||a.name||a.path||'?',+a.x.toFixed(2),+a.y.toFixed(2)].join('@')).sort();
 const doors=(L.worldR74?.doors||[]).map(d=>[d.id,d.x,d.y,d.width,d.depth]);
 let roofMiss=-1;try{const m=window.__R?.hospitalRoofMeshR2;if(m){roofMiss=0;}}catch(e){}
 return{zone:room.id,cells:fl.size,walls:(L.walls||[]).length,thin,voidBoth,missing,dup,connected:seen.size===fl.size,nodes:pts.length,noPath,stuck,mobs,npc,doors,solid:L.wallsSolidR830||null,propList,enemies:(room.enemies||[]).length,playerBlocked:blocked(player.x,player.y,.27,room),entryBlocked:L.entry?blocked(L.entry.x,L.entry.y,.29,room):null,meshes:(()=>{try{return 0;}catch(e){return -1;}})()};};
const b=await chromium.launch();const errs=[];
const {p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const on={};for(const z of ZONES){await go(p,z);on[z]=await p.evaluate(measure);const r=on[z];
 ok(z+': 양쪽이 다 바닥인 얇은 벽판 0개',r.thin.length===0,r.thin);
 ok(z+': 고친 지도가 붙었다(칸막이 '+(r.solid?.partitions?.length||0)+'개 → 덩어리, 바닥 '+r.solid?.before+' → '+r.solid?.after+')',!!r.solid&&r.solid.partitions.length>0&&r.solid.after<r.solid.before);
 ok(z+': 양쪽이 다 벽 덩어리인(파묻힌) 벽판 0개',r.voidBoth.length===0,r.voidBoth);
 ok(z+': 바닥|벽 경계 변마다 벽판이 꼭 하나(빠짐 0·겹침 0)',r.missing===0&&r.dup===0,[r.missing,r.dup]);
 ok(z+': 바닥이 한 덩어리',r.connected);
 ok(z+': 벽 속에 든 조형물·NPC·몹 0, 영웅·입구 안 막힘',r.stuck.length===0&&r.mobs.length===0&&r.npc.length===0&&!r.entryBlocked,[r.stuck,r.mobs,r.npc,r.entryBlocked]);}
// 예전 저장 복원: 메워진 칸에 서 있던 저장을 불러오면 그 곁 바닥으로(보스 전투실로 튀지 않음), 멀쩡한 자리의 저장은 그대로
for(const z of ZONES){await go(p,z);const r=await p.evaluate(async()=>{const L=room.exploration,now=new Set(L.floorCells.map(c=>c[0]+':'+c[1]));const A=window.__STORYWORLD_WALLS_SOLID_R830__;
  const L0=window.__STORYWORLD_EXPLORATION__.layout(room.id,'STORY');/* 엔진 원래 지도 */void A;const gone=L0.floorCells.filter(c=>!now.has(c[0]+':'+c[1]));const c=gone[Math.floor(gone.length/2)];
  player.x=c[0]+.5;player.y=c[1]+.5;const raw=JSON.parse(JSON.stringify(serializeSave()));await restoreSave(raw);const a={gone:gone.length,d:Math.hypot(player.x-c[0]-.5,player.y-c[1]-.5),blocked:blocked(player.x,player.y,.27,room),solid:!!room.exploration.wallsSolidR830};
  const n=room.exploration.nodes.find(q=>!blocked(q.x,q.y,.4,room));player.x=n.x;player.y=n.y;const raw2=JSON.parse(JSON.stringify(serializeSave()));await restoreSave(raw2);a.keep=Math.hypot(player.x-n.x,player.y-n.y);return a;});
 ok(z+': 메워진 칸('+r.gone+'칸 가운데 하나)에 서 있던 저장 → 3칸 안 바닥에서 깨어난다(벽 속·보스 전투실 아님)',r.gone>0&&r.solid&&!r.blocked&&r.d<3.2,r);
 ok(z+': 멀쩡한 자리의 저장은 그 자리 그대로',r.keep<.01,r.keep);await skip(p);}
const api=await p.evaluate(()=>window.__STORYWORLD_WALLS_SOLID_R830__?.inspect?.()||null);
ok('오버레이 로드·오류 0',!!api&&api.stats.errors===0,api);
// 끄기 스위치: 새 맥락에서 끄고 들어가면 원래 지도(칸막이 그대로)
const {p:q}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r830.walls':'{"on":false}'}});q.on('pageerror',e=>errs.push(String(e).slice(0,160)));
for(const z of ZONES){await go(q,z);const r=await q.evaluate(measure);
 ok(z+': 끄면 원래 지도(칸막이 벽판 있음, 고친 표시 없음)',r.thin.length>0&&!r.solid,[r.thin.length,r.solid]);
 ok(z+': 켠 지도의 문 자리·폭은 끈 지도와 같다',JSON.stringify(r.doors)===JSON.stringify(on[z].doors));
 ok(z+': 켠 지도는 끈 지도보다 바닥이 줄기만 했다(새 바닥 0)',on[z].cells<r.cells);
 ok(z+': 길목 '+r.nodes+'곳·입구 사이 엔진 길찾기 — 끈 지도에서 되는 길은 켠 지도에서도 모두 된다(안 되는 길 켬 '+on[z].noPath+' ≤ 끔 '+r.noPath+')',on[z].nodes===r.nodes&&on[z].noPath<=r.noPath,[on[z].nodes,r.nodes,on[z].noPath,r.noPath]);
 // 조형물 비교: 보물상자(r103chest)는 들어갈 때마다 자리를 무작위로 고르므로 뺀다(벽 속 여부는 위 '벽 속에 든' 항목이 본다).
 const strip=l=>l.filter(k=>!/^r103chest:/.test(k)),A=new Set(strip(on[z].propList)),B=new Set(strip(r.propList)),lost=[...B].filter(k=>!A.has(k)),added=[...A].filter(k=>!B.has(k));
 const xy=k=>k.split('@').slice(1).map(Number),spots=l=>l.map(k=>xy(k).join(',')).sort().join(' ');
 ok(z+': 조형물 수·이름은 끈 지도와 같다(조형물 '+B.size+'개, 몹 '+r.enemies+'마리)',A.size===B.size&&[...A].map(k=>k.split('@')[0]).sort().join('|')===[...B].map(k=>k.split('@')[0]).sort().join('|')&&on[z].enemies===r.enemies,{lost,added});
 // 병동 틀 지역: 진료실 C 북쪽 가림벽([57,57]~[68,57])은 어느 쪽을 메워도 그 방 조형물 1점이 벽 붙이기 규칙으로 자리를 옮긴다(가림벽을 하나씩 메워 본 실측).
 //  → 허용하는 변화는 그것뿐: 진료실 C(x50~68·y52~68) 안에서 1점이 (59,54.1) → (59,65.9). 그 밖의 조형물 자리는 모두 같아야 한다.
 /* #442(조형물 서사 맞춤) 뒤 hando02·kair02·last301 에서는 같은 1점이 (52.1,65.9) 에서 온다 — 도착 자리 (59,65.9) 는 같다 */const moved=z==='hub'?'':['59,54.1','52.1,65.9'];
 ok(z+': 조형물 자리는 끈 지도와 같다'+(moved?' — 진료실 C 의 1점((59,54.1) 또는 (52.1,65.9) → (59,65.9))만 예외':''),moved?(spots((m=>lost.filter(k=>xy(k).join(',')!==m))(moved.find(m=>lost.some(k=>xy(k).join(',')===m))))===spots(added.filter(k=>xy(k).join(',')!=='59,65.9'))&&lost.length<=2&&added.length<=2):(lost.length===0&&added.length===0),{lost,added});}
ok('페이지 오류 0',errs.length===0,errs);
await b.close();console.log(`\nR830 browser: ${n-bad}/${n} passed`);process.exit(bad?1:0);
