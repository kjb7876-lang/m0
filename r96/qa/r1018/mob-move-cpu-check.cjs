// R1018 CPU 검사: 일반몹 위·아래 이동 추가1(표 move-dir-r1018-data.js 를 R974 엔진 표에 더함) — 사용자 2026-11-12 "모든보스몹과 일반몹 위아래 이동모션은 최소4프레임… 좌우는 서로 반전", "일단 이동만".
//  ① 표가 R974 표에 더해지고 기존 항목은 덮지 않는다. ② 화면 위·아래로 걸을 때만 Dots 시트(384칸 4프레임), 옆으로는 지금 옆 걷기 그대로.
//  ③ 걷기 칸이 바뀌어도 크기가 흔들리지 않는다. ④ 이름별 다른 그림(유리 망령 등)·공격 그림은 그대로. ⑤ 연결(태그·검증 목록·CI 줄·자산).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');const src=rd('client-source/move-dir-r974.js'),d974=rd('client-source/move-dir-r974-data.js'),d1001=rd('client-source/move-dir-r1001-data.js'),d1018=rd('client-source/move-dir-r1018-data.js');
ok(rd('runtime-text/move-dir-r1018-data.js')===d1018,'runtime-text copy identical');
function world({noBase=false,order='data-first'}={}){const timers=[];const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,WeakSet,Set,isFinite,RegExp,performance:{now:()=>0},setTimeout:f=>{timers.push(f);return timers.length;},localStorage:{getItem:()=>null,setItem(){}}};ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(`var time=0,room={id:'ep1a10',enemies:[]},player={x:9,y:9},ctx={commands:[]};
  function addImage(){}function readyImage(p){return {ready:true,image:{src:'http://x/m0/'+p,naturalWidth:/assets\\/r(974|1001|1018)\\//.test(p)?1536:10,naturalHeight:/assets\\/r(974|1001|1018)\\//.test(p)?384:10}};}
  function project(x,y){return {x:100+(x-3)*10,y:200+(y-3)*5};}
  function drawEnemy(e){const P=project(e.x,e.y),A=e.__art,h=e.__h||100,w=h*A.rect[2]/A.rect[3],top=P.y-h*.95,L=P.x-w/2;
   ctx.commands.push({kind:'image',key:'enemy:'+e.nativeId,owner:{kind:'enemy'},image:{src:'http://x/m0/'+A.path},imageSize:A.size,sourcePath:A.path,sourceRect:A.rect.slice(),style:{},points:[[L,top],[L+w,top],[L+w,top+h],[L,top+h]]});}`,ctx);
 if(!noBase)vm.runInContext(d974,ctx);if(order==='data-first'){vm.runInContext(d1001,ctx);vm.runInContext(d1018,ctx);vm.runInContext(src,ctx);}else{vm.runInContext(src,ctx);vm.runInContext(d1001,ctx);vm.runInContext(d1018,ctx);}while(timers.length)timers.shift()();return ctx;}
const run=(c,s)=>vm.runInContext(s,c);
const w0=world({order:'module-first'}),A=w0.__STORYWORLD_MOVE_DIR_R1018__,A1=w0.__STORYWORLD_MOVE_DIR_R1001__,DATA=w0.__STORYWORLD_MOVE_DIR_R974_DATA__.enemies;
ok(A&&A.rev==='R1018-mob-move-1'&&A.joined===true&&A.ids.length>=15,'R1018 table joined the R974 table');
ok(Object.keys(DATA).length===26+A1.ids.length+A.ids.length&&!A.ids.some(k=>A1.ids.includes(k)),'26 bosses + R1001 '+A1.ids.length+' + R1018 '+A.ids.length+' mob ids, no overlap');
ok(w0.__STORYWORLD_MOVE_DIR_R974__.inspect().enemies===26+A1.ids.length+A.ids.length,'the R974 module sees the added ids even when its tag loads first');
{const c=world({noBase:true});ok(c.__STORYWORLD_MOVE_DIR_R1018__.joined===false&&!c.__STORYWORLD_MOVE_DIR_R974_DATA__,'without the R974 table: no-op, no throw');}
{const before=JSON.parse(/DATA__=(\{.*\});/s.exec(d974)[1]).enemies;for(const k of Object.keys(before))ok(JSON.stringify(DATA[k])===JSON.stringify(before[k]),'boss entry untouched '+k);}
{const c=world();vm.runInContext(d1001,c);const b1=JSON.stringify(A1.ids.map(k=>DATA[k]));ok(b1===JSON.stringify(A1.ids.map(k=>c.__STORYWORLD_MOVE_DIR_R974_DATA__.enemies[k])),'R1001 entries untouched');}
ok(!A.ids.some(k=>/boss|^mb-|ep1b06|mammon/i.test(k)),'only regular-mob ids, Mammon zone untouched');
const H=k=>Math.abs(k.points[3][1]-k.points[0][1]);
const mk=(id,I,o)=>({id:id+'#1',nativeId:id,name:id,x:3,y:3,hp:100,maxHp:100,hitTimer:0,state:'chase',__art:{path:I.path,rect:I.rect,size:I.size},...o});
function frames(c,e,secs,step){const out=[];for(let t=0;t<secs-1e-9;t+=1/30){run(c,'time+=1/30');if(step)step(e,t,out.length);run(c,'ctx.commands.length=0');c.drawEnemy(e);out.push(run(c,'ctx.commands').find(k=>/enemy:/.test(k.key||'')));}return out;}
const DIR=k=>(/-(side|down|up)\.webp$/.exec(k.sourcePath)||[])[1]||null;
for(const id of A.ids){const D=DATA[id];ok(D.cell===384&&D.n===4&&D.fps===8&&D.dirs.down&&D.dirs.up&&!D.dirs.side,id+': down+up sheets only (own side walk kept)');
 for(const [d,S] of Object.entries(D.dirs)){ok(/^assets\/r1018\/move\/[a-z0-9-]+-(down|up)\.webp$/.test(S.path)&&fs.existsSync(path.join(R,'runtime-text',S.path)),'asset exists '+S.path);ok(S.vis>120&&S.vis<=384&&S.py>250&&S.py<=384&&S.px>100&&S.px<284,'sheet metrics sane '+id+' '+d);}
 ok(D.idle.length>=4,id+': every walk cell recognised ('+D.idle.length+')');
 for(const p of new Set(D.idle.map(i=>i.path))){const g=D.idle.filter(i=>i.path===p);ok(new Set(g.map(i=>i.body)).size===1&&new Set(g.map(i=>i.bbox.join())).size===1,id+': one body/bbox measure per strip '+p);}
 const c=world(),I0=D.idle[0],e=mk(id,I0);
 const st=frames(c,e,.5);ok(DIR(st[st.length-1])===null,id+' standing → engine art');
 // 걷는 동안 엔진은 걷기 칸을 돌려 그린다 → 어느 칸이어도 시트로, 크기는 한결같이
 const cyc=(e,t,i)=>{const I=D.idle.filter(x=>x.path===I0.path);const J=I[Math.floor(i/4)%I.length];e.__art={path:J.path,rect:J.rect,size:J.size};};
 const dn=frames(c,e,1.2,(e,t,i)=>{e.y+=.06;cyc(e,t,i);}).slice(14);ok(dn.every(k=>DIR(k)==='down'),id+' moving down → down sheet on every walk cell');
 ok(new Set(dn.map(k=>Math.round(k.sourceRect[0]/384))).size===4&&dn.every(k=>k.sourceRect[2]===384&&k.imageSize[0]===1536),id+' 4 frames of 384');
 const hs=dn.map(H);ok(Math.max(...hs)-Math.min(...hs)<.5,id+' size steady while the engine cycles cells ('+Math.min(...hs).toFixed(1)+'~'+Math.max(...hs).toFixed(1)+')');
 const vis=hs[0]*D.dirs.down.vis/384,eng=100*I0.body/I0.rect[3];ok(Math.abs(vis-eng)<1,id+' body height equals the engine walk art ('+vis.toFixed(1)+' vs '+eng.toFixed(1)+')');
 ok(dn.every(k=>k.points[1][0]>k.points[0][0]),id+' front view not mirrored');
 const up=frames(c,e,1.2,(e,t,i)=>{e.y-=.06;cyc(e,t,i);}).slice(14);ok(up.every(k=>DIR(k)==='up'&&k.points[1][0]>k.points[0][0]),id+' moving up → up sheet, not mirrored');
 const sd=frames(c,e,1.2,(e,t,i)=>{e.x+=.06;e.y-=.06;cyc(e,t,i);}).slice(14);ok(sd.every(k=>DIR(k)===null&&k.sourcePath===I0.path),id+' moving sideways → own side walk untouched');
 const at=frames(c,e,1,(e)=>{e.y+=.06;e.attack={t:1};}).slice(10);ok(at.every(k=>DIR(k)===null),id+' attacking → untouched');e.attack=null;
 const ot=frames(c,e,1,(e)=>{e.y+=.06;e.__art={path:'assets/r410/mobs/m018.webp',rect:[0,0,256,320],size:[1024,960]};}).slice(10);ok(ot.every(k=>DIR(k)===null),id+' name-variant art (e.g. glass wraith) → untouched');
 const dead=mk(id,I0,{hp:0});ok(frames(c,dead,1,e=>{e.y+=.06;}).every(k=>DIR(k)===null),id+' dead → untouched');}
{// 연결
 const html=rd('runtime-text/index.html');ok(html.includes('<script src="./move-dir-r1001-data.js"></script>\n<script src="./move-dir-r1018-data.js"></script>\n'),'tag right after move-dir-r1001-data.js');
 ok(fs.readFileSync(path.join(R,'../scripts/verify-r96-public.py'),'utf8').includes("'move-dir-r1018-data.js'"),'public verify list');
 ok(fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1018/mob-move-cpu-check.cjs'),'CI step');
 const man=rd('runtime-manifest.json');for(const id of A.ids)for(const S of Object.values(DATA[id].dirs))ok(man.includes(S.path.replace(/^assets\//,'assets/')),'manifest has '+S.path);ok(man.includes('move-dir-r1018-data.js'),'manifest has the data script');
 const rec=JSON.parse(rd('r1018-mob-move.json'));ok(rec.files.filter(f=>f.applied).every(f=>f.sha256&&f.sourceSha256&&f.source&&f.bytes>0)&&rec.files.some(f=>f.applied===false&&f.why),'asset record: source/hash/size + held items with reasons');}
console.log('R1018 mob-move CPU check OK ('+n+' assertions)');
