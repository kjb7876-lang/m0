// R1237 환자와 중독의 도시(ep1a10) 낙서 건물 — CPU/정적 검사(실제 런타임 하네스, 그래픽·실기기는 미검증).
//  사용자 2026-11-19 11:44Z: 건물 조형물을 건물 크기로 키워 벽에 각도 맞춰 붙이고, 늘 보이던 '나는 다른 사람과…' 글자를 없애고,
//  가서 C(상호작용)를 누르면 '누군가의 낙서' 제목과 함께 그 글이 나오게. 11:48Z: 미카엘라 옆 빨간 짐수레(hotel_luggage_cart)를 이 맵에서 빼기.
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../../..'),R=path.join(root,'r96');
let n=0,failed=0;const check=(name,f)=>{try{f();n++;console.log('PASS '+name);}catch(e){failed++;console.log('FAIL '+name+' :: '+String(e.message||e).slice(0,400));}};
(async()=>{
const canon=fs.readFileSync(path.join(root,'story-source/hapil-canon-r106-improved.txt'),'utf8');
const SENT='나는 다른 사람과 다르며, 마음만 먹으면 끊을 수 있고, 이번이 마지막이라는 믿음이었다.';
const {createHarness}=require(path.join(R,'qa/harness.cjs')),h=createHarness({timeoutMs:120000});const b=await h.boot();assert.ok(b.booted&&!b.errors.length,JSON.stringify(b.errors));
const run=s=>h.run(s);
const A=run('window.__STORYWORLD_MAPS_PALACE_SLUM_R317__');
check('graffiti API exists with exact title and canonical sentence',()=>{assert.ok(A?.GRAFFITI,'R317 GRAFFITI missing');assert.equal(A.GRAFFITI.title,'누군가의 낙서');assert.equal(A.GRAFFITI.text,SENT);assert.ok(canon.includes(A.GRAFFITI.text),'not literal canon');});
check('canonical wall lines unchanged (story text not edited)',()=>{assert.deepEqual(Array.from(A.WALL_TEXT),['나는 다른 사람과 다르며','마음만 먹으면 끊을 수 있고','이번이 마지막이라는 믿음이었다.']);});
// 실제 지역 방 + R317 apply
const rows=JSON.parse(run(`(()=>{const out={};for(const id of ['ep1a10','ep1a09b']){const r=makeRoom(id,'STORY');__STORYWORLD_MAPS_PALACE_SLUM_R317__.apply(r);/* 실제 게임: 지형 만들 때 R204 가 주제 거르기(R1062) */__STORYWORLD_CAVE_R204__.themeProps(r,id);const L=r.exploration,F=new Set(L.floorCells.map(c=>c.join(',')));
 const fl=(x,y)=>F.has(x+','+y);
 out[id]={stores:r.props.filter(p=>p.r317&&p.name==='storefront').map(p=>{const cx=Math.floor(p.x),cy=Math.floor(p.y),w=p.r1237Wall;let back=null,span=0;
   if(w){const dx=w.side==='-x'?-1:0,dy=w.side==='-y'?-1:0;for(let i=-4;i<=0;i++){const ax=w.side==='-y'?w.cx+i:w.cx,ay=w.side==='-x'?w.cy+i:w.cy;if(fl(ax,ay)&&!fl(ax+dx,ay+dy))span++;}let open=0;for(let i=1;i<=2;i++){const ax=w.side==='-y'?w.cx+i:w.cx,ay=w.side==='-x'?w.cy+i:w.cy;if(fl(ax+dx,ay+dy))open++;}w.open=open;back=Math.hypot(p.x-(w.cx+.5),p.y-(w.cy+.5));}
   return {x:p.x,y:p.y,h:p.height,solid:p.solid,inter:!!p.interactive,wall:w||null,span,back,floor:fl(cx,cy),blocked:StoryPhase1.explorationBlocked(L,p.x,p.y,.29),flip:!!p.r1237Flip};}),
 carts:r.props.filter(p=>/hotel_luggage_cart/.test(String(p.path||''))).length,path:findPath(L.entry,L.worldWardR81.gatherAnchor,r).length};}return JSON.stringify(out);})()`));
const st=rows.ep1a10.stores;
check('ep1a10 keeps exactly two storefront buildings',()=>assert.equal(st.length,2,JSON.stringify(st)));
check('storefronts scaled to building size (>=190px, was 100/90)',()=>{for(const s of st)assert.ok(s.h>=190&&s.h<=280,JSON.stringify(s));});
check('each storefront stands on floor against a 5-cell wall run that ends on the camera side',()=>{for(const s of st){assert.ok(s.wall&&['-x','-y'].includes(s.wall.side),JSON.stringify(s));assert.equal(s.span,5,JSON.stringify(s));assert.equal(s.wall.open,2,'wall must end on the camera side (3D wall blocks would cover the art) '+JSON.stringify(s));assert.ok(s.floor&&!s.blocked,JSON.stringify(s));assert.ok(s.back<=2.6,'too far from wall '+JSON.stringify(s));assert.equal(s.flip,s.wall.side==='-x');}});
check('storefronts are distinct places, non-solid, not engine-interactive (R81 contract)',()=>{assert.ok(Math.hypot(st[0].x-st[1].x,st[0].y-st[1].y)>=8);for(const s of st){assert.equal(s.solid,false);assert.equal(s.inter,false);}});
check('ep1a10 entry → gather path still exists',()=>assert.ok(rows.ep1a10.path>0));
check('ep1a10 luggage carts removed (user 11:48Z)',()=>assert.equal(rows.ep1a10.carts,0));
check('ep1a09b has no storefront (regression)',()=>assert.equal(rows.ep1a09b.stores.length,0));
// 그리기: 상시 글자 없음
const draw=JSON.parse(run(`(()=>{const A=__STORYWORLD_MAPS_PALACE_SLUM_R317__;const r=makeRoom('ep1a10','STORY');A.apply(r);const s=r.props.find(p=>p.r317&&p.name==='storefront');
 const texts=[],calls=[];const ft=ctx.fillText;ctx.fillText=function(t,...a){texts.push(String(t));return ft?.apply?.(this,[t,...a]);};
 const rd=readyImage;readyImage=p=>({image:{naturalWidth:512,naturalHeight:434},crop:null});const sp=sprite;sprite=function(p,x,y,hh,o){calls.push({p,hh,flip:!!o?.flip});return true;};
 const oldRoom=room;room=r;const px=player.x,py=player.y;
 const cx=cam.x,cy=cam.y,sc=ctx.scope;/* 하네스 ctx 는 scope 를 안 부르는 빈 함수 — 실제 기록기처럼 fn 을 부른다 */ctx.scope=(o,fn)=>fn();try{for(const far of [true,false]){player.x=s.x+(far?20:1.2);player.y=s.y+(far?20:1.2);cam.x=player.x;cam.y=player.y;drawProp(s);}}finally{ctx.fillText=ft;readyImage=rd;sprite=sp;room=oldRoom;player.x=px;player.y=py;cam.x=cx;cam.y=cy;ctx.scope=sc;}
 return JSON.stringify({texts,calls,flip:!!s.r1237Flip});})()`));
check('no always-visible wall text drawn (far or near)',()=>{for(const t of draw.texts)for(const w of A.WALL_TEXT)assert.ok(!t.includes(w)&&!t.includes('나는 다른'),t);});
check('storefront sprite drawn at building height with wall-side flip',()=>{const c=draw.calls.filter(c=>/r80-073/.test(c.p));assert.ok(c.length>=2,JSON.stringify(draw.calls));for(const x of c){assert.ok(x.hh>=190*.5,JSON.stringify(x));assert.equal(x.flip,draw.flip);}});
// C(상호작용)
const it=JSON.parse(run(`(()=>{const A=__STORYWORLD_MAPS_PALACE_SLUM_R317__;const out={};const r=makeRoom('ep1a10','STORY');A.apply(r);const s=r.props.filter(p=>p.r317&&p.name==='storefront');
 A.install();const save={room,zone,started,modal,loading,px:player.x,py:player.y,hp:player.hp};const panels=[];const op=openPanel;openPanel=function(html,...a){panels.push(String(html));modal=true;};
 const toasts=[];const tt=toast;toast=(m)=>{toasts.push(String(m));};
 const tryAt=(dx,dy,target=s[0],pre)=>{panels.length=0;toasts.length=0;modal=false;room=r;zone='ep1a10';started=true;loading=false;player.hp=777;const sp=A.graffitiSpot(target);player.x=sp.x+dx;player.y=sp.y+dy;if(pre)pre();let ret;try{ret=interact();}catch(e){return {err:String(e)};}return {ret,panels:panels.slice(),toasts:toasts.slice()};};
 try{out.reach=A.GRAFFITI.reach;out.near=tryAt(.4,.4);out.second=tryAt(0,0,s[1]);out.edge=tryAt(A.GRAFFITI.reach-.05,0);out.far=tryAt(A.GRAFFITI.reach+.6,0);
  out.modal=tryAt(0,0,s[0],()=>{modal=true;});out.dead=tryAt(0,0,s[0],()=>{player.hp=0;});
  const r9=makeRoom('ep1a09b','STORY');A.apply(r9);panels.length=0;room=r9;zone='ep1a09b';modal=false;player.x=s[0].x;player.y=s[0].y;try{interact();}catch(_){}out.other=panels.slice();
  out.inspect=A.inspect();}
 finally{openPanel=op;toast=tt;room=save.room;zone=save.zone;started=save.started;modal=save.modal;loading=save.loading;player.x=save.px;player.y=save.py;player.hp=save.hp;}
 return JSON.stringify(out);})()`));
const has=(arr)=>arr.some(p=>p.includes('누군가의 낙서')&&p.includes(SENT));
check('C near building opens "누군가의 낙서" with the canonical sentence',()=>{assert.ok(!it.near.err,it.near.err);assert.ok(has(it.near.panels),JSON.stringify(it.near));});
check('title shown as heading before the text',()=>{const p=it.near.panels.find(x=>x.includes('누군가의 낙서'));assert.ok(/<h2>누군가의 낙서<\/h2>/.test(p)&&p.indexOf('누군가의 낙서')<p.indexOf('나는 다른'),p);});
check('second building also readable',()=>assert.ok(has(it.second.panels),JSON.stringify(it.second)));
check('boundary: just inside reach opens',()=>assert.ok(has(it.edge.panels),JSON.stringify(it.edge)));
check('boundary: outside reach falls through to normal interact (no graffiti panel)',()=>assert.ok(!has(it.far.panels),JSON.stringify(it.far)));
check('no graffiti while a modal is open or hero is dead',()=>{assert.ok(!has(it.modal.panels));assert.ok(!has(it.dead.panels));});
check('other region (ep1a09b) unaffected',()=>assert.ok(!has(it.other),JSON.stringify(it.other)));
check('no R317 errors',()=>assert.equal(it.inspect.stats.errors,0,it.inspect.lastError));
// 표: 다른 지역 THEME_DENY 그대로
check('R1062 deny table keeps previous zones and adds ep1a10 cart only',()=>{const s=fs.readFileSync(path.join(R,'client-source/cave-r204.js'),'utf8');assert.ok(/ep1a10:\/hotel_luggage_cart\//.test(s));for(const z of ['ep1a08','ep1a09','ep1a11','ep1b02','ep1b04'])assert.ok(new RegExp(z+':/[^/]*hotel_luggage_cart').test(s),z);});

// 봉인 성물함(11:51Z): 중독의 도시 0개, 결전의 날 큰 것 1개(보스방), 그 1개는 장식, 다른 성물함은 포인트 상자
const seals=JSON.parse(run(`(()=>{const out={};for(const id of ['ep1a10','ep1a09b']){const r=makeRoom(id,'STORY');__STORYWORLD_MAPS_PALACE_SLUM_R317__.apply(r);const L=r.exploration,b=L.worldWardR81?.bossAnchor,door=L.worldR74.doors.find(d=>d.id===L.bossDoorId);
 const s=r.props.filter(p=>/r80-072/.test(String(p.path||'')));out[id]={scene:r.props.filter(p=>p.r80Dressing&&!p.r224Furniture&&!p.r449Furniture).length,n:s.length,rows:s.map(p=>({x:p.x,y:p.y,h:p.height,keep:!!p.r1237Seal,crate:__STORYWORLD_CRATES_R108__.eligible(p),dBoss:b?Math.hypot(p.x-b.x,p.y-b.y):null,
   sameSideAsBoss:door&&b?Math.sign((p.x+p.y)-(door.x+door.y))===Math.sign((b.x+b.y)-(door.x+door.y)):null}))};}
 out.other=__STORYWORLD_CRATES_R108__.eligible({id:'x',x:1,y:1,path:'assets/world-r80/r80-072.webp',r80Dressing:true});return JSON.stringify(out);})()`));
check('scene-prop count kept at 8+ in both zones (R81 environment / R86 usage gates) — reliquaries reskinned, not dropped',()=>{for(const z of ['ep1a10','ep1a09b'])assert.ok(seals[z].scene>=8,z+' '+seals[z].scene);});
check('ep1a10 has no seal reliquary (8 removed)',()=>assert.equal(seals.ep1a10.n,0,JSON.stringify(seals.ep1a10)));
check('ep1a09b has exactly one reliquary, enlarged (>=120px), in the boss room near the boss anchor',()=>{assert.equal(seals.ep1a09b.n,1,JSON.stringify(seals.ep1a09b));const s=seals.ep1a09b.rows[0];assert.ok(s.keep&&s.h>=120&&s.dBoss<=9&&s.sameSideAsBoss,JSON.stringify(s));});
check('boss-room reliquary is decoration, not a point box',()=>assert.equal(seals.ep1a09b.rows[0].crate,false));
check('reliquary elsewhere is a point box (interact gives points)',()=>assert.equal(seals.other,true));
// 포인트 상자: +1 구슬 N(1~7)개 흩뿌림, 한 번만
const sc=JSON.parse(run(`(()=>{const X=__STORYWORLD_CRATES_R108__,P=__STORYWORLD_PROGRESSION_R62__;const r=makeRoom('ep1a10','STORY');const save={room,time,px:player.x,py:player.y,started,modal,loading};const out={};
 try{room=r;started=true;modal=false;loading=false;const L=r.exploration;const c=L.floorCells.find(([x,y])=>!StoryPhase1.explorationBlocked(L,x+.5,y+.5,.6));
  const boxes=[];for(let i=0;i<40;i++)boxes.push({id:'qa-crate-'+i,x:c[0]+.5,y:c[1]+.5,path:'assets/props/crate.webp',r74Prop:'crate',height:40,solid:false,visible:true});
  out.amounts=boxes.map(b=>X.amountOf(b));const b=boxes.find(b=>X.amountOf(b)>=5)||boxes[0];r.props.push(b);time=100;const before=(P.state(player)?.points??player.points??0);X.breakBox(b,'interact');
  let orbs=r.props.filter(o=>o.r108Orb&&o.r108Orb.box===X.idOf(b));out.n=X.amountOf(b);out.orbs=orbs.length;out.amount1=orbs.every(o=>o.r108Orb.amount===1);out.ids=new Set(orbs.map(o=>o.r108Orb.id)).size;
  time=100.2;X.fly();out.mid=orbs.map(o=>({lift:o.visualLiftPx||0}));time=101.5;X.fly();out.land=orbs.map(o=>({x:o.x,y:o.y,d:Math.hypot(o.x-b.x,o.y-b.y),walk:!StoryPhase1.explorationBlocked(L,o.x,o.y,.3),landed:!!o.r108Orb.landed}));
  out.spread=Math.max(...orbs.map(o=>Math.atan2(o.y-b.y,o.x-b.x)))-Math.min(...orbs.map(o=>Math.atan2(o.y-b.y,o.x-b.x)));
  // 주워 먹기: 하나씩
  player.points=0;const pts=()=>Number(player.points||0);const p0=pts();let got=0;for(const o of orbs.slice()){player.x=o.x;player.y=o.y;time+=1;X.collect();}
  out.gain=pts()-p0;out.left=r.props.filter(o=>o.r108Orb&&o.r108Orb.box===X.idOf(b)).length;out.stats=X.inspect().stats;
  // 다시 생긴 같은 상자: 다 받았으면 안 나옴
  r.props.push({...b});X.breakBox(r.props[r.props.length-1],'interact');out.again=r.props.filter(o=>o.r108Orb&&o.r108Orb.box===X.idOf(b)).length;
  // 벽 둘레 상자: 구슬은 걸을 수 있는 자리에만
  const F=new Set(L.floorCells.map(c=>c.join(',')));const edge=L.floorCells.find(([x,y])=>!F.has((x-1)+','+y)&&!F.has(x+','+(y-1)));const eb={id:'qa-edge',x:edge[0]+.5,y:edge[1]+.5,r74Prop:'crate',height:40,visible:true};r.props.push(eb);time=200;X.breakBox(eb,'interact');time=202;X.fly();
  out.edge=r.props.filter(o=>o.r108Orb&&o.r108Orb.box===X.idOf(eb)).map(o=>!StoryPhase1.explorationBlocked(L,o.x,o.y,.3)||(o.x===eb.x&&o.y===eb.y));
 }finally{room=save.room;time=save.time;player.x=save.px;player.y=save.py;started=save.started;modal=save.modal;loading=save.loading;}return JSON.stringify(out);})()`));
check('point box amounts stay within 1..7 and use the full range',()=>{assert.ok(sc.amounts.every(a=>a>=1&&a<=7));assert.ok(new Set(sc.amounts).size>=5,JSON.stringify(sc.amounts));});
check('breaking drops N separate +1 orbs (N = box amount) with distinct claim ids',()=>{assert.equal(sc.orbs,sc.n);assert.ok(sc.amount1);assert.equal(sc.ids,sc.n);});
check('orbs bounce (lift mid-flight) and land scattered 0.45..2.6 cells on walkable floor',()=>{assert.ok(sc.mid.some(m=>m.lift>5),JSON.stringify(sc.mid));for(const o of sc.land){assert.ok(o.landed&&o.walk&&o.d>=.4&&o.d<=2.6,JSON.stringify(o));}assert.ok(sc.n<2||sc.spread>1,'not scattered '+sc.spread);});
check('walking over each orb collects +1 each; total = N',()=>{assert.equal(sc.gain,sc.n,JSON.stringify(sc));assert.equal(sc.left,0);});
check('same box never pays twice (rebuilt box drops nothing)',()=>assert.equal(sc.again,0));
check('box next to walls: orbs never land inside a wall',()=>assert.ok(sc.edge.length>0&&sc.edge.every(Boolean),JSON.stringify(sc.edge)));
console.log(failed?`R1237 cpu: ${failed} failed, ${n} passed`:`R1237 cpu: all ${n} passed`);process.exit(failed?1:0);
})().catch(e=>{console.error('FATAL',e);process.exit(1);});
