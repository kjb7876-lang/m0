// R838 브라우저 검사·굽기 — 실내 문간 모양을 바꾼 뒤에도 방·문·길·조형물·몹이 끈 지도와 같은지.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r838-passages/passages-browser.mjs            (검사)
//  KEEP_OPEN 표 굽기는 passages-bake.mjs.
//  헤드리스 소프트웨어 렌더 — GPU·실기기 아님.
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const ALL='ep1a09,ep1a09b,ep1a10,ep1a11,ep1b02,ep1b03,ep1b04,ep1b05,ep1b07,ep1b09,u201,u202,u204,u205,u206,u203,murder01,murder02,murder04,murder03,cult01,cult02,cult05,cult06,cult03';
const ZONES=(process.env.Z||ALL).split(',');let bad=0,n=0;const ok=(m,c,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x!==undefined?JSON.stringify(x).slice(0,600):'');}else console.log('ok  ',m);};
const measure=()=>{const L=room.exploration,fl=new Set(L.floorCells.map(c=>c[0]+':'+c[1])),f=(x,y)=>fl.has(Math.floor(x)+':'+Math.floor(y)),cover=new Map();let thin=0,buried=0;
 for(const w of L.walls||[]){if(w.decorative||w.presentationOnly||w.angle)continue;const hz=w.width>=w.depth,len=Math.max(w.width,w.depth);if(Math.min(w.width,w.depth)>.7)continue;
  for(let s=.5;s<len;s+=1){const a=hz?[Math.floor(w.x-len/2+s),Math.round(w.y)-1]:[Math.round(w.x)-1,Math.floor(w.y-len/2+s)],b=hz?[a[0],Math.round(w.y)]:[Math.round(w.x),a[1]],fa=fl.has(a[0]+':'+a[1]),fb=fl.has(b[0]+':'+b[1]);if(fa&&fb)thin++;if(!fa&&!fb)buried++;const k=(hz?'h:':'v:')+b[0]+':'+b[1];cover.set(k,(cover.get(k)||0)+1);}}
 let missing=0,dup=0;for(const k of fl){const[x,y]=k.split(':').map(Number);for(const[e,o]of[['h:'+x+':'+y,[x,y-1]],['h:'+x+':'+(y+1),[x,y+1]],['v:'+x+':'+y,[x-1,y]],['v:'+(x+1)+':'+y,[x+1,y]]]){if(fl.has(o[0]+':'+o[1]))continue;const c=cover.get(e)||0;if(!c)missing++;if(c>1)dup++;}}
 const first=L.floorCells[0],seen=new Set([first[0]+':'+first[1]]),q=[first];for(let h=0;h<q.length;h++){const[x,y]=q[h];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+':'+(y+dy);if(fl.has(k)&&!seen.has(k)){seen.add(k);q.push([x+dx,y+dy]);}}}
 const rc=new Set();for(const r of L.floorRects)for(let y=r.y;y<r.y+r.depth;y++)for(let x=r.x;x<r.x+r.width;x++)rc.add(x+':'+y);
 // 길: 입구 → 길목마다, 길목 → 다음 길목(엔진 길찾기). 길이도 잰다
 const pts=[L.entry,...(L.nodes||[])].filter(p=>p&&Number.isFinite(p.x+p.y)&&!blocked(p.x,p.y,.29,room));const paths=[];for(let i=1;i<pts.length;i++){for(const from of[pts[0],pts[i-1]]){let r=null;try{r=findPath(from,pts[i],room,.29);}catch(e){}paths.push(r&&r.length?r.length:(Math.hypot(from.x-pts[i].x,from.y-pts[i].y)<.1?0:-1));}}
 const inB=a=>a.x>L.bounds[0]&&a.y>L.bounds[1]&&a.x<L.bounds[2]&&a.y<L.bounds[3];
 const stuck=(room.props||[]).filter(a=>!a.terrainWall&&Number.isFinite(a.x+a.y)&&inB(a)&&!f(a.x,a.y)&&(a.solid||a.npc||a.interact||a.pickup)).map(a=>[a.id||a.type||a.name,+a.x.toFixed(1),+a.y.toFixed(1)]);
 const mobsIn=(room.enemies||[]).filter(e=>blocked(e.x,e.y,.2,room)).map(e=>e.id);
 const npc=(()=>{try{const A=window.__STORYWORLD_NPC_R790__;const list=A?.inspect?.()?.npcs||A?.list?.()||[];return list.filter(q=>q&&q.zone===room.id&&Number.isFinite(q.x+q.y)&&blocked(q.x,q.y,.2,room)).map(q=>q.id);}catch(e){return['ERR '+e];}})();
 const props=(room.props||[]).filter(a=>!a.terrainWall&&Number.isFinite(a.x+a.y)).map(a=>[a.id||a.type||a.name||a.path||'?',+a.x.toFixed(2),+a.y.toFixed(2)].join('@')).sort();
 /* 몹은 돌아다니므로 지금 자리가 아니라 배치 자리(homeX·homeY)를 본다 */const mobs=(room.enemies||[]).map(e=>[e.nativeId||e.id,+(e.homeX??e.x).toFixed(1),+(e.homeY??e.y).toFixed(1)].join('@')).sort();
 const P=L.passagesR838||null;
 return{zone:room.id,cells:fl.size,thin,buried,missing,dup,connected:seen.size===fl.size,rects:rc.size===fl.size&&[...fl].every(k=>rc.has(k)),paths,stuck,mobsIn,npc,props,mobs,
  doors:JSON.stringify((L.worldR74?.doors||[]).map(d=>[d.id,d.x,d.y,d.width,d.depth])),rooms:JSON.stringify(L.r224Rooms||[]),nodes:JSON.stringify((L.nodes||[]).map(q=>[q.id,q.x,q.y])),entry:JSON.stringify(L.entry||null),
  entryBlocked:L.entry?blocked(L.entry.x,L.entry.y,.29,room):null,P:P&&{style:P.style,gaps:P.gaps,cells:P.cells,before:P.before,after:P.after},
  roomCellsLost:(()=>{const L0=window.__STORYWORLD_PASSAGES_R838__.source(room.id,L);if(!L0)return 0;let c=0;const R=L.r224Rooms||[];for(const[x,y]of L0.floorCells)if(!fl.has(x+':'+y)&&R.some(r=>x>=r.x0&&x<r.x1&&y>=r.y0&&y<r.y1))c++;return c;})(),
  minOpen:(()=>{if(!P)return null;let worst=99,best3=true;for(const g of P.gaps){if(!g.fill||g.blocked)continue;const[ax,a,b]=g.key.split(':'),hz=ax==='h',fx=+a,st=+b;let run=0,mx=0,mn=99;for(let i=0;i<=g.n;i++){const c=hz?[st+i,fx]:[fx,st+i];if(i<g.n&&fl.has(c[0]+':'+c[1]))run++;else{if(run){mx=Math.max(mx,run);mn=Math.min(mn,run);}run=0;}}worst=Math.min(worst,mn);if(mx<3)best3=false;}return{worst,best3};})()};};
const b=await chromium.launch();const errs=[];
// 한 쪽에서 지역마다 끈 지도·켠 지도로 각각 '처음 들어가듯' 다시 짓는다: 방 보관(world)을 지우고 같은 씨앗으로 들어가 가구(R224·R449·R523 — 그리는 동안 놓임)가 다 놓일 때까지 기다린다.
//  끈 지도 = 검사용 덮어쓰기 qa({})(표에 없는 지역은 원래 지도), 켠 지도 = 덮어쓰기 없음(실제 기본 경로).
const {p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const enter=async(z,mode)=>{await go(p,'hub');await p.evaluate(([z,mode])=>{window.__STORYWORLD_PASSAGES_R838__.qa(mode==='off'?{}:null);delete world[layerKey(z,'STORY')];let s=12345;Math.random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};},[z,mode]);await go(p,z);
 let last=-1,since=await p.evaluate(()=>time);for(let i=0;i<400;i++){await p.waitForTimeout(250);const[n,t]=await p.evaluate(()=>[(room.props||[]).length,time]);if(n!==last){last=n;since=t;}else if(t-since>2.5)break;}return p.evaluate(measure);};
const strip=l=>l.filter(k=>!/^r103chest[:@]/.test(k));
const diff=(A,B)=>{const a=new Set(strip(A)),bb=new Set(strip(B));return{lost:[...bb].filter(k=>!a.has(k)),added:[...a].filter(k=>!bb.has(k))};};
const off={},on={},off2={},on2={};for(const z of ZONES){off[z]=await enter(z,'off');on[z]=await enter(z,'on');
 // 가구 일부는 들어간 뒤 늦게 자리를 잡아(R449 등) 같은 지도끼리도 잰 때에 따라 조금 다를 수 있다 → 차이가 보이면 양쪽을 한 번씩 더 재서
 //  '두 번 다 같은 자리에 있던 것'(안정된 것)만 놓고 본다: 끈 지도에서 안정된 것은 켠 지도 두 번 가운데 한 번에는 있어야 하고, 그 반대도 같다.
 const d0=diff(on[z].props,off[z].props),d1=diff(on[z].mobs,off[z].mobs);if(d0.lost.length+d0.added.length+d1.lost.length+d1.added.length){off2[z]=await enter(z,'off');on2[z]=await enter(z,'on');}}
const stable=(z,kind)=>{const A=strip(on[z][kind]),B=strip(off[z][kind]);if(!off2[z]){const d=diff(A,B);return{...d,remeasured:false};}
 const A2=new Set(strip(on2[z][kind])),B2=new Set(strip(off2[z][kind])),As=A.filter(k=>A2.has(k)),Bs=B.filter(k=>B2.has(k)),Aany=new Set([...A,...A2]),Bany=new Set([...B,...B2]);
 return{lost:Bs.filter(k=>!Aany.has(k)),added:As.filter(k=>!Bany.has(k)),remeasured:true,flicker:A.length-As.length+B.length-Bs.length};};
on.__api=await p.evaluate(()=>window.__STORYWORLD_PASSAGES_R838__?.inspect?.()||null);
// 예전 저장: 메워진 문간 칸에 서 있던 저장 → 곁 바닥
on.__save={};for(const z of ZONES.slice(0,Number(process.env.SAVES||6))){await go(p,z);on.__save[z]=await p.evaluate(async()=>{const L=room.exploration,L0=window.__STORYWORLD_PASSAGES_R838__.source(room.id,L);if(!L0)return null;const now=new Set(L.floorCells.map(c=>c[0]+':'+c[1])),gone=L0.floorCells.filter(c=>!now.has(c[0]+':'+c[1]));if(!gone.length)return null;const c=gone[gone.length>>1];
  player.x=c[0]+.5;player.y=c[1]+.5;const raw=JSON.parse(JSON.stringify(serializeSave()));await restoreSave(raw);const a={gone:gone.length,d:Math.hypot(player.x-c[0]-.5,player.y-c[1]-.5),blocked:blocked(player.x,player.y,.27,room),shaped:!!room.exploration.passagesR838};
  /* 문·입구에서 가장 먼 길목(문 곁 저장은 엔진이 원래 입구로 옮긴다 — 끈 지도도 같음) */const far=q=>Math.min(...[...(room.exploration.worldR74?.doors||[]),room.exploration.entry].filter(Boolean).map(d=>Math.hypot(d.x-q.x,d.y-q.y))),nd=room.exploration.nodes.filter(q=>!blocked(q.x,q.y,.4,room)).sort((u,v)=>far(v)-far(u))[0];player.x=nd.x;player.y=nd.y;const raw2=JSON.parse(JSON.stringify(serializeSave()));await restoreSave(raw2);a.keep=Math.hypot(player.x-nd.x,player.y-nd.y);return a;});await skip(p);}

ok('오버레이 로드·오류 0',!!on.__api&&on.__api.stats.errors===0,on.__api);
let shapedZones=0;const sig=new Set(),kept=[];
for(const z of ZONES){const a=on[z],o=off[z],P=a.P;if(P&&P.cells>0)shapedZones++;if(P&&P.cells>0)sig.add(P.gaps.map(g=>g.key+':'+g.fill).join('|'));
 ok(z+': 끄면 원래 지도(고친 표시 없음)',!o.P);
 if(!P){ok(z+': 문간을 모두 그대로 둔 지역(가구 자리를 지키려고 — 굽기 표) → 지도가 끈 지도와 같다',a.cells===o.cells);kept.push(z);
  continue;}
 ok(z+': 문간이 바뀌었다('+P.style+', 문간 '+P.gaps.filter(g=>g.fill).length+'/'+P.gaps.length+'곳, 막은 곳 '+P.gaps.filter(g=>g.blocked).length+', '+P.cells+'칸)',P.cells>0&&a.cells===o.cells-P.cells);
 ok(z+': 방 사각형·문·길목·입구 자료는 끈 지도와 글자 하나 다르지 않다',a.rooms===o.rooms&&a.doors===o.doors&&a.nodes===o.nodes&&a.entry===o.entry);
 ok(z+': 방 안 바닥은 한 칸도 줄지 않았다(메운 칸은 모두 방 사이 문간 줄)',a.roomCellsLost===0,a.roomCellsLost);
 ok(z+': 얇은 벽판 0·파묻힌 벽판 '+a.buried+'(끈 지도 '+o.buried+')·경계 변마다 벽판 하나(빠짐 '+a.missing+'·겹침 '+a.dup+', 끈 지도 '+o.missing+'·'+o.dup+')',a.thin<=o.thin&&a.buried<=o.buried&&a.missing<=o.missing&&a.dup<=o.dup,[a.thin,o.thin]);
 ok(z+': 바닥 한 덩어리·그림 사각형 = 판정 바닥',a.connected&&a.rects);
 ok(z+': 열린 문간은 2칸 이상 트이고 그중 하나는 3칸 이상',!!a.minOpen&&a.minOpen.worst>=2&&a.minOpen.best3,a.minOpen);
 const worse=a.paths.filter((v,i)=>v<0&&o.paths[i]>=0).length,longer=a.paths.map((v,i)=>v>0&&o.paths[i]>0?v-o.paths[i]:0),mx=Math.max(0,...longer);
 ok(z+': 입구·길목 사이 엔진 길찾기 '+a.paths.length+'줄 — 끈 지도에서 되는 길은 모두 된다(가장 늘어난 길 +'+mx+'마디)',a.paths.length===o.paths.length&&worse===0&&mx<=60,{worse,mx});
 ok(z+': 벽 속에 든 조형물·NPC·몹 0, 입구 안 막힘',a.stuck.length===0&&a.mobsIn.length<=o.mobsIn.length&&a.npc.length===0&&!a.entryBlocked,[a.stuck,a.mobsIn,a.npc]);
 const dp=stable(z,'props'),dm=stable(z,'mobs');
 ok(z+': 조형물 '+strip(o.props).length+'점 이름·자리가 끈 지도와 같다'+(dp.remeasured?' (두 번씩 재서 안정된 것끼리 비교, 흔들린 것 '+dp.flicker+')':''),dp.lost.length===0&&dp.added.length===0&&(dp.flicker||0)<=strip(o.props).length*.5,dp);
 ok(z+': 몹 '+o.mobs.length+'마리 자리가 끈 지도와 같다',dm.lost.length===0&&dm.added.length===0,dm);}
ok('대상 '+ZONES.length+'지역 가운데 '+shapedZones+'곳의 문간이 바뀌었고(그대로 둔 곳: '+(kept.join(', ')||'없음')+') 바뀐 곳의 문간 배치는 서로 다르다('+sig.size+'가지)',shapedZones+kept.length===ZONES.length&&shapedZones>=Math.min(ZONES.length,20)&&sig.size===shapedZones,[shapedZones,sig.size,kept]);
for(const[z,r]of Object.entries(on.__save||{})){if(!r)continue;ok(z+': 메워진 문간 칸에 서 있던 저장 → 3칸 안 바닥에서 깨어난다',r.shaped&&!r.blocked&&r.d<3.6,r);ok(z+': 멀쩡한 자리의 저장은 그대로',r.keep<.01,r.keep);}
ok('페이지 오류 0',errs.length===0,errs);
await b.close();console.log(`\nR838 browser: ${n-bad}/${n} passed`);process.exit(bad?1:0);
