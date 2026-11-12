// R839 브라우저 검사 — 야외맵에 바위턱을 넣은 뒤에도 길목·문·입구·조형물·몹이 끈 지도와 같고 길이 이어지는지.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ [Z=dist00,…] node r96/qa/r839-outcrops/outcrops-browser.mjs      헤드리스 소프트웨어 렌더 — GPU·실기기 아님.
//  끈 지도 = qa({})(모든 지역 원래 지도), 켠 지도 = 덮어쓰기 없음(실제 기본 경로 = 굽기 표).
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const errs=[];const {p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const TABLE=await p.evaluate(()=>window.__STORYWORLD_OUTCROPS_R839__.TABLE),STYLE=await p.evaluate(()=>window.__STORYWORLD_OUTCROPS_R839__.STYLE);
const ZONES=(process.env.Z||Object.keys(STYLE).join(',')).split(',');let bad=0,n=0;const ok=(m,c,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x!==undefined?JSON.stringify(x).slice(0,600):'');}else console.log('ok  ',m);};
const measure=()=>{const L=room.exploration,fl=new Set(L.floorCells.map(c=>c[0]+':'+c[1])),cover=new Map();let thin=0,buried=0;
 for(const w of L.walls||[]){if(w.decorative||w.presentationOnly||w.angle)continue;const hz=w.width>=w.depth,len=Math.max(w.width,w.depth);if(Math.min(w.width,w.depth)>.7)continue;
  for(let s=.5;s<len;s+=1){const a=hz?[Math.floor(w.x-len/2+s),Math.round(w.y)-1]:[Math.round(w.x)-1,Math.floor(w.y-len/2+s)],bq=hz?[a[0],Math.round(w.y)]:[Math.round(w.x),a[1]],fa=fl.has(a[0]+':'+a[1]),fb=fl.has(bq[0]+':'+bq[1]);if(fa&&fb)thin++;if(!fa&&!fb)buried++;const k=(hz?'h:':'v:')+bq[0]+':'+bq[1];cover.set(k,(cover.get(k)||0)+1);}}
 let missing=0,dup=0;for(const k of fl){const[x,y]=k.split(':').map(Number);for(const[e,o]of[['h:'+x+':'+y,[x,y-1]],['h:'+x+':'+(y+1),[x,y+1]],['v:'+x+':'+y,[x-1,y]],['v:'+(x+1)+':'+y,[x+1,y]]]){if(fl.has(o[0]+':'+o[1]))continue;const c=cover.get(e)||0;if(!c)missing++;if(c>1)dup++;}}
 const first=L.floorCells[0],seen=new Set([first[0]+':'+first[1]]),q=[first];for(let h=0;h<q.length;h++){const[x,y]=q[h];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+':'+(y+dy);if(fl.has(k)&&!seen.has(k)){seen.add(k);q.push([x+dx,y+dy]);}}}
 const rc=new Set();for(const r of L.floorRects)for(let y=r.y;y<r.y+r.depth;y++)for(let x=r.x;x<r.x+r.width;x++)rc.add(x+':'+y);
 const pts=[L.entry,...(L.nodes||[])].filter(q=>q&&Number.isFinite(q.x+q.y)&&!blocked(q.x,q.y,.29,room));const paths=[],wide=[];for(let i=1;i<pts.length;i++){for(const from of[pts[0],pts[i-1]]){let r=null;try{r=findPath(from,pts[i],room,.29);}catch(e){}paths.push(r&&r.length?r.length:(Math.hypot(from.x-pts[i].x,from.y-pts[i].y)<.1?0:-1));}}
 // 넓은 길: 둘레 8칸까지 모두 바닥인 칸(폭 3칸 몸이 설 수 있는 칸)만으로 길목→다음 길목이 이어지는지. 길목은 3칸 안의 가장 가까운 그런 칸으로 잡는다.
 {const fat=new Set();for(const k of fl){const[x,y]=k.split(':').map(Number);let all=true;for(let dy=-1;dy<=1&&all;dy++)for(let dx=-1;dx<=1;dx++)if(!fl.has((x+dx)+':'+(y+dy))){all=false;break;}if(all)fat.add(k);}
  const comp=new Map();let cid=0;for(const k of fat){if(comp.has(k))continue;cid++;const q=[k];comp.set(k,cid);for(let h=0;h<q.length;h++){const[x,y]=q[h].split(':').map(Number);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=(x+dx)+':'+(y+dy);if(fat.has(n)&&!comp.has(n)){comp.set(n,cid);q.push(n);}}}}
  const snap=q=>{let best=null;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const k=(Math.floor(q.x)+dx)+':'+(Math.floor(q.y)+dy);if(fat.has(k)){const d=Math.hypot(dx,dy);if(!best||d<best[0])best=[d,comp.get(k)];}}return best?best[1]:0;};
  for(let i=1;i<pts.length;i++){const a=snap(pts[i-1]),c=snap(pts[i]);wide.push(a&&c&&a===c?1:-1);}}
 const O=L.outcropsR839||null,inRock=(x,y,m)=>!!O&&O.blocks.some(bl=>bl.rects.some(([bx,by,w,d])=>x>bx-m&&x<bx+w+m&&y>by-m&&y<by+d+m));
 const props=(room.props||[]).filter(a=>!a.terrainWall&&Number.isFinite(a.x+a.y)).map(a=>[a.id||a.type||a.name||a.path||'?',+a.x.toFixed(2),+a.y.toFixed(2)].join('@')).sort();
 const mobs=(room.enemies||[]).map(e=>[e.nativeId||e.id,+(e.homeX??e.x).toFixed(1),+(e.homeY??e.y).toFixed(1)].join('@')).sort();
 // 턱의 열린 변에서 곧게 잰 바닥 폭 가운데 가장 좁은 것
 let open=99;if(O)for(const bl of O.blocks)for(const[x,y,w,d]of bl.rects){const has=(a,c)=>fl.has(a+':'+c);
  for(let i=0;i<w;i++)for(const[sy,dy]of[[y-1,-1],[y+d,1]]){if(!has(x+i,sy))continue;let r=0;while(has(x+i,sy+dy*r))r++;open=Math.min(open,r);}
  for(let j=0;j<d;j++)for(const[sx,dx]of[[x-1,-1],[x+w,1]]){if(!has(sx,y+j))continue;let r=0;while(has(sx+dx*r,y+j))r++;open=Math.min(open,r);}}
 return{zone:room.id,cells:fl.size,thin,buried,missing,dup,connected:seen.size===fl.size,rects:rc.size===fl.size&&[...fl].every(k=>rc.has(k)),paths,wide,props,mobs,open,
  inRockProps:(room.props||[]).filter(a=>!a.terrainWall&&Number.isFinite(a.x+a.y)&&inRock(a.x,a.y,0)).map(a=>[a.id||a.path,+a.x.toFixed(1),+a.y.toFixed(1)]),
  mobsIn:(room.enemies||[]).filter(e=>blocked(e.x,e.y,.2,room)||inRock(e.x,e.y,0)).map(e=>e.id),
  heroBlocked:blocked(player.x,player.y,.27,room),
  doors:JSON.stringify((L.worldR74?.doors||[]).map(d=>[d.id,d.x,d.y,d.width,d.depth])),nodes:JSON.stringify((L.nodes||[]).map(q=>[q.id,q.x,q.y,q.width,q.depth])),entry:JSON.stringify(L.entry||null),bounds:JSON.stringify(L.bounds),altar:JSON.stringify(room.altar?[room.altar.x,room.altar.y]:null),
  entryBlocked:L.entry?blocked(L.entry.x,L.entry.y,.29,room):null,O:O&&{style:O.style,blocks:O.blocks.map(q=>q.rects),skipped:O.skipped,cells:O.cells,before:O.before,after:O.after}};};
const enter=async(z,mode)=>{await go(p,'hub');await p.evaluate(([z,mode])=>{window.__STORYWORLD_OUTCROPS_R839__.qa(mode==='off'?{}:null);delete world[layerKey(z,'STORY')];let s=12345;Math.random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};},[z,mode]);await go(p,z);
 let last=-1,since=await p.evaluate(()=>time);for(let i=0;i<400;i++){await p.waitForTimeout(250);const[c,t]=await p.evaluate(()=>[(room.props||[]).length,time]);if(c!==last){last=c;since=t;}else if(t-since>2.5)break;}return p.evaluate(measure);};
// 야외 흩뿌림 장식(바닥 칸 목록으로 뽑아 바닥이 달라지면 지도 전체에서 다시 뽑힘 — outcrops-bake.mjs 머리말)은 자리 비교에서 빼고 '바위턱 안 0' 항목으로만 본다.
const REROLL=/^(r81:scene:|r299:|r74:[^@]*:scenery|r99:tree:|r103chest[:@])/;
const strip=l=>l.filter(k=>!REROLL.test(k)),diff=(A,B)=>{const a=new Set(strip(A)),bb=new Set(strip(B));return{lost:[...bb].filter(k=>!a.has(k)),added:[...a].filter(k=>!bb.has(k))};};
const off={},on={},off2={},on2={};for(const z of ZONES){off[z]=await enter(z,'off');on[z]=await enter(z,'on');
 const d0=diff(on[z].props,off[z].props),d1=diff(on[z].mobs,off[z].mobs);if(d0.lost.length+d0.added.length+d1.lost.length+d1.added.length){off2[z]=await enter(z,'off');on2[z]=await enter(z,'on');}}
// 들어갈 때마다 자리가 달라지는 가구가 있다(끈 지도끼리도) → 차이가 보이면 한 번씩 더 재서 두 번 다 같은 자리에 있던 것만 견준다(R838 검사와 같은 방식).
const stable=(z,kind)=>{const A=strip(on[z][kind]),B=strip(off[z][kind]);if(!off2[z])return{...diff(A,B),remeasured:false};
 const A2=new Set(strip(on2[z][kind])),B2=new Set(strip(off2[z][kind])),As=A.filter(k=>A2.has(k)),Bs=B.filter(k=>B2.has(k)),Aany=new Set([...A,...A2]),Bany=new Set([...B,...B2]);
 return{lost:Bs.filter(k=>!Aany.has(k)),added:As.filter(k=>!Bany.has(k)),remeasured:true};};
const api=await p.evaluate(()=>[window.__STORYWORLD_OUTCROPS_R839__.inspect(),window.__STORYWORLD_PASSAGES_R838__.inspect()]);
// 예전 저장: 바위턱이 된 칸에 서 있던 저장 → 곁 바닥. 손대지 않은 자리의 저장은 그대로.
const saves={};const {p:p2}=await boot(b,{vp:{width:640,height:360}});p2.on('pageerror',e=>errs.push(String(e).slice(0,160)));/* 새 쪽(검사용 끔/켬을 오간 적 없는 실제 경로)에서 */for(const z of ZONES.filter(z=>TABLE[z]).slice(0,Number(process.env.SAVES||4))){await go(p2,z);saves[z]=await p2.evaluate(async()=>{const L=room.exploration,O=L.outcropsR839;if(!O)return null;const[x,y,w,d]=O.blocks[0].rects[0],c=[x+w/2,y+d/2];
  player.x=c[0];player.y=c[1];const raw=JSON.parse(JSON.stringify(serializeSave())),to=window.__STORYWORLD_OUTCROPS_R839__.nudge(raw),L2=window.__STORYWORLD_EXPLORATION__.layout(room.id,'STORY');await restoreSave(raw);return{to,c,L2:!!L2?.outcropsR839,src:!!window.__STORYWORLD_OUTCROPS_R839__.source(room.id,L2),at:[player.x,player.y],d:Math.hypot(player.x-c[0],player.y-c[1]),blocked:blocked(player.x,player.y,.27,room),shaped:!!room.exploration.outcropsR839};});await skip(p2);}
ok('오버레이 로드·오류 0',api[0].stats.errors===0&&api[1].stats.errors===0&&api[0].linked,api);
let shaped=0;const styles=new Set(),rerolled={};
for(const z of ZONES){const a=on[z],o=off[z],O=a.O;ok(z+': 끄면 원래 지도',!o.O);
 if(!TABLE[z]){ok(z+': 표가 없는 지역(가구·몹 자리를 지키려고 턱을 두지 않음) → 지도가 끈 지도와 같다',!O&&a.cells===o.cells);continue;}
 shaped++;styles.add(O?.style);
 ok(z+': 바위턱 '+(O?O.blocks.length:0)+'곳('+O?.style+', '+O?.cells+'칸)이 표대로 모두 들어갔다',!!O&&O.blocks.length===TABLE[z].length&&O.skipped===0&&a.cells===o.cells-O.cells,O);
 ok(z+': 길목·문·입구·경계·제단 자료는 끈 지도와 글자 하나 다르지 않다',a.nodes===o.nodes&&a.doors===o.doors&&a.entry===o.entry&&a.bounds===o.bounds&&a.altar===o.altar);
 ok(z+': 얇은 벽판·파묻힌 벽판·빠진 변·겹친 변이 끈 지도보다 늘지 않았다',a.thin<=o.thin&&a.buried<=o.buried&&a.missing<=o.missing&&a.dup<=o.dup,[a.thin,o.thin,a.buried,o.buried,a.missing,o.missing,a.dup,o.dup]);
 ok(z+': 바닥 한 덩어리·그림 사각형 = 판정 바닥·입구 안 막힘·영웅 안 끼임',a.connected&&a.rects&&a.entryBlocked===false&&!a.heroBlocked);
 ok(z+': 입구→길목, 길목→다음 길목 길이 끈 지도에서 이어지던 곳은 모두 이어진다(길 '+a.paths.length+'개)',a.paths.length===o.paths.length&&a.paths.every((v,i)=>o.paths[i]<0||v>=0),a.paths.map((v,i)=>[i,o.paths[i],v]).filter(q=>q[1]>=0&&q[2]<0));
 ok(z+': 폭 3칸 몸으로 길목→다음 길목을 지나던 곳은 턱을 넣은 뒤에도 모두 지나간다('+o.wide.filter(v=>v>=0).length+'/'+o.wide.length+'구간)',a.wide.length===o.wide.length&&a.wide.every((v,i)=>o.wide[i]<0||v>=0),a.wide.map((v,i)=>[i,o.wide[i],v]).filter(q=>q[1]>=0&&q[2]<0));
 const dp=stable(z,'props'),dm=stable(z,'mobs');
 const rr=l=>l.filter(k=>REROLL.test(k)&&!/^r103chest/.test(k)),rrMoved=rr(a.props).filter(k=>!o.props.includes(k)).length;rerolled[z]=rrMoved;
 ok(z+': 흩뿌림 장식 수가 끈 지도와 3점 안쪽으로 같다(켠 지도 '+rr(a.props).length+'점, 끈 지도 '+rr(o.props).length+'점, 다시 뽑힌 것 '+rrMoved+'점)',Math.abs(rr(a.props).length-rr(o.props).length)<=3,[rr(a.props).length,rr(o.props).length]);
 ok(z+': 고정 조형물 '+strip(o.props).length+'점이 끈 지도와 같은 자리'+(dp.remeasured?'(흔들리는 것은 두 번 재서 가림)':''),!dp.lost.length&&!dp.added.length,dp);
 ok(z+': 몹 '+o.mobs.length+'마리 배치 자리가 끈 지도와 같다',!dm.lost.length&&!dm.added.length,dm);
 ok(z+': 바위턱 안에 놓인 조형물 0·바위에 낀 몹 0',!a.inRockProps.length&&!a.mobsIn.length,[a.inRockProps,a.mobsIn]);}
ok('바위턱이 들어간 지역 '+shaped+'곳, 모양 '+styles.size+'가지',process.env.Z?shaped>=1:(shaped>=8&&styles.size>=4),[shaped,[...styles]]);
for(const[z,s]of Object.entries(saves))ok(z+': 바위턱 자리에 서 있던 예전 저장 → 곁 바닥으로('+(s?s.d.toFixed(1):'?')+'칸)',!!s&&s.shaped&&!s.blocked&&s.d>0&&s.d<6,s);
ok('쪽 오류 0',!errs.length,errs);console.log('rerolled',JSON.stringify(rerolled));
console.log(`\nR839 browser: ${n-bad}/${n} passed`);await b.close();process.exit(bad?1:0);
