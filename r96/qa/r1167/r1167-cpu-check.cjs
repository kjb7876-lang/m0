// R1167 CPU 검사: Dots CX-0082MV v6 B1 m040 이동문 청람잔영 위·아래 떠다님 4칸(r1 ROUGH, 사용자 11-18 밤샘 "좀 별로라도 일단 업로드 → 코드로 개선 적용") — 표 move-dir-r1167-data.js 를 R974 엔진 표에 더한다(R1125 와 같은 방식).
//  ① 새 번호는 통째로, 이미 다른 그림으로 표에 있는 번호(c103-e1·u203-e1 등)는 기존 항목을 그대로 두고 alt 로 붙는다.
//  ② 엔진이 지금 그린 그림이 m040 일 때만 그 시트로 바꾼다. ③ 화면 위·아래로 움직일 때만, 옆은 그대로. 몸통 키가 엔진 그림과 같다. ④ 공격·죽음·다른 그림은 그대로. ⑤ 연결.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');const ex=f=>fs.existsSync(path.join(R,f));
const src=rd('client-source/move-dir-r974.js');const OLD=['r974','r1001','r1018','r1019','r1024','r1125'].map(k=>rd('client-source/move-dir-'+k+'-data.js'));
ok(ex('client-source/move-dir-r1167-data.js'),'R1167 table exists');const d1125=rd('client-source/move-dir-r1167-data.js');
ok(rd('runtime-text/move-dir-r1167-data.js')===d1125,'runtime-text copy identical');
const NEWP=/assets\/r1167\//;
function world({noBase=false,order='data-first',withNew=true}={}){const timers=[];const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,WeakSet,Set,isFinite,RegExp,performance:{now:()=>0},setTimeout:f=>{timers.push(f);return timers.length;},localStorage:{getItem:()=>null,setItem(){}}};ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(`var time=0,room={id:'u201',enemies:[]},player={x:9,y:9},ctx={commands:[]};
  function addImage(){}function readyImage(p){const m=/assets\\/r(974|1001|1018|1019|1024)\\//.test(p),q=/assets\\/r(1125|1167)\\//.test(p);return {ready:true,image:{src:'http://x/m0/'+p,naturalWidth:m?1536:q?(globalThis.__CW[p]||0)*4:10,naturalHeight:m?384:q?(globalThis.__CW[p]||0):10}};}
  function project(x,y){return {x:100+(x-3)*10,y:200+(y-3)*5};}
  function drawEnemy(e){const P=project(e.x,e.y),A=e.__art,h=e.__h||100,w=h*A.rect[2]/A.rect[3],top=P.y-h*.95,L=P.x-w/2;
   ctx.commands.push({kind:'image',key:'enemy:'+e.nativeId,owner:{kind:'enemy'},image:{src:'http://x/m0/'+A.path},imageSize:A.size,sourcePath:A.path,sourceRect:A.rect.slice(),style:{},points:[[L,top],[L+w,top],[L+w,top+h],[L,top+h]]});}`,ctx);
 ctx.globalThis=ctx;ctx.__CW={};
 const data=()=>{if(!noBase)vm.runInContext(OLD[0],ctx);for(const s of OLD.slice(1))vm.runInContext(s,ctx);if(withNew)vm.runInContext(d1125,ctx);};
 if(order==='data-first'){data();vm.runInContext(src,ctx);}else{vm.runInContext(src,ctx);data();}while(timers.length)timers.shift()();
 const E=ctx.__STORYWORLD_MOVE_DIR_R974_DATA__?.enemies||{};for(const k of Object.keys(E))for(const V of [E[k],...(E[k].alt||[])])for(const S of Object.values(V.dirs||{}))if(NEWP.test(S.path))ctx.__CW[S.path]=V.cell;return ctx;}
const run=(c,s)=>vm.runInContext(s,c);
const w0=world({order:'module-first'}),M=w0.__STORYWORLD_MOVE_DIR_R1167__,DATA=w0.__STORYWORLD_MOVE_DIR_R974_DATA__.enemies;
ok(M&&M.rev==='R1167-m040-move-1'&&M.joined===true,'R1167 table joined the R974 table');
const M040=['c103-e1','h101-s1','h101-s2','h101-t1','u203-e1'];
// 기존 표(R1167 없이)
const wB=world({withNew:false}),BEF=wB.__STORYWORLD_MOVE_DIR_R974_DATA__.enemies;
const variants=id=>{const E=DATA[id];return E?[E,...(E.alt||[])]:[];};
const has=(id,re)=>variants(id).some(V=>V.idle.some(I=>re.test(I.path)));
for(const id of M040)ok(has(id,/r410\/mobs\/m040\.webp$/),id+': m040 float art registered');
// ① 기존 항목은 그대로(alt 만 붙음), 다른 번호는 손대지 않음
for(const k of Object.keys(BEF)){const a=JSON.parse(JSON.stringify(DATA[k]));delete a.alt;const b=JSON.parse(JSON.stringify(BEF[k]));delete b.alt;ok(JSON.stringify(a)===JSON.stringify(b),'earlier entry untouched '+k);}
const COLL=[...new Set(M040)].filter(k=>BEF[k]);ok(COLL.length>=2&&COLL.includes('u203-e1')&&COLL.includes('c103-e1'),'collisions present ('+COLL.join(',')+')');
for(const k of COLL)ok(Array.isArray(DATA[k].alt)&&DATA[k].alt.length>=1,k+': new art attached as alt');
ok(variants('u203-e1').length>=2&&variants('u203-e1').some(V=>V.idle.some(I=>/m033/.test(I.path))),'u203-e1: earlier m033 variant + m040');
ok(!Object.keys(DATA).some(k=>!BEF[k]&&/boss|^mb-|ep1b06|mammon|persona/i.test(k)),'only regular-mob ids added, Mammon/persona untouched');
{const c=world({noBase:true});ok(c.__STORYWORLD_MOVE_DIR_R1167__.joined===false,'without the R974 table: no-op, no throw');}
// 새 변종 하나씩(시트 성질)
const NV=[];for(const id of Object.keys(DATA))for(const V of variants(id))if(Object.values(V.dirs).some(S=>NEWP.test(S.path)))NV.push([id,V]);
ok(NV.length===M040.length,'one new variant per id ('+NV.length+')');
for(const [id,V] of NV){ok(V.n===4&&V.fps===8&&V.cell>=256&&V.cell<=320&&!V.dirs.side&&V.dirs.down,id+': square cell, 4 frames, down (+up), no side sheet');
 for(const [d,S] of Object.entries(V.dirs)){ok(/^assets\/r1167\/move\/m040-(down|up)\.webp$/.test(S.path)&&ex('runtime-text/'+S.path),'asset exists '+S.path);ok(S.vis>100&&S.vis<=V.cell&&S.py>V.cell*.7&&S.py<=V.cell&&S.px>V.cell*.3&&S.px<V.cell*.7,'sheet metrics sane '+id+' '+d);}}
const H=k=>Math.abs(k.points[3][1]-k.points[0][1]);
const mk=(id,I,o)=>({id:id+'#1',nativeId:id,name:id,x:3,y:3,hp:100,maxHp:100,hitTimer:0,state:'chase',__art:{path:I.path,rect:I.rect,size:I.size},...o});
function frames(c,e,secs,step){const out=[];for(let t=0;t<secs-1e-9;t+=1/30){run(c,'time+=1/30');if(step)step(e,t,out.length);run(c,'ctx.commands.length=0');c.drawEnemy(e);out.push(run(c,'ctx.commands').find(k=>/enemy:/.test(k.key||'')));}return out;}
const DIR=k=>(/-(side|down|up)\.webp$/.exec(k.sourcePath)||[])[1]||null;
function exercise(id,V,label){const c=world(),I0=V.idle[0],e=mk(id,I0);const hasUp=!!V.dirs.up;
 const cyc=(e,t,i)=>{const I=V.idle.filter(x=>x.path===I0.path);const J=I[Math.floor(i/4)%I.length];e.__art={path:J.path,rect:J.rect,size:J.size};};
 const st=frames(c,e,.5);ok(DIR(st[st.length-1])===null,label+' standing → engine art');
 const dn=frames(c,e,1.2,(e,t,i)=>{e.y+=.06;cyc(e,t,i);}).slice(14);ok(dn.every(k=>k.sourcePath===V.dirs.down.path),label+' moving down → its own down sheet');
 ok(new Set(dn.map(k=>Math.round(k.sourceRect[0]/V.cell))).size===4&&dn.every(k=>k.sourceRect[2]===V.cell&&k.sourceRect[3]===V.cell&&k.imageSize[0]===V.cell*4),label+' 4 square frames of '+V.cell);
 const hs=dn.map(H);ok(Math.max(...hs)-Math.min(...hs)<.5,label+' size steady while the engine cycles cells');
 const vis=hs[0]*V.dirs.down.vis/V.cell,eng=100*I0.body/I0.rect[3];ok(Math.abs(vis-eng)<1,label+' body height equals the engine walk art ('+vis.toFixed(1)+' vs '+eng.toFixed(1)+')');
 ok(dn.every(k=>k.points[1][0]>k.points[0][0]),label+' front view not mirrored');
 const up=frames(c,e,1.2,(e,t,i)=>{e.y-=.06;cyc(e,t,i);}).slice(14);ok(hasUp?up.every(k=>k.sourcePath===V.dirs.up.path&&k.points[1][0]>k.points[0][0]):up.every(k=>DIR(k)===null),label+(hasUp?' moving up → up sheet, not mirrored':' moving up → no up sheet, engine art kept'));
 const sd=frames(c,e,1.2,(e,t,i)=>{e.x+=.06;e.y-=.06;cyc(e,t,i);}).slice(14);ok(sd.every(k=>!NEWP.test(k.sourcePath)),label+' moving sideways → no R1167 sheet');
 const at=frames(c,e,1,(e)=>{e.y+=.06;e.attack={t:1};}).slice(10);ok(at.every(k=>DIR(k)===null),label+' attacking → untouched');e.attack=null;
 const ot=frames(c,e,1,(e)=>{e.y+=.06;e.__art={path:'assets/r410/mobs/m018.webp',rect:[0,0,256,320],size:[1024,960]};}).slice(10);ok(ot.every(k=>DIR(k)===null),label+' other art → untouched');
 const dead=mk(id,I0,{hp:0});ok(frames(c,dead,1,e=>{e.y+=.06;}).every(k=>DIR(k)===null),label+' dead → untouched');}
const pick=(id,re)=>variants(id).find(V=>V.idle.some(I=>re.test(I.path)));
for(const id of M040)exercise(id,pick(id,/m040/),'m040 '+id);
{const V=pick('h101-s1',/m040/);ok(V.idle.length===8&&V.idle.every(i=>i.rect[1]<640&&i.rect[2]===256&&i.rect[3]===320),'m040: 8 float cells (rows 0–1), attack row excluded');ok(V.dirs.up&&V.dirs.down,'m040: both up and down');}
// R1125 m033 는 그대로(같은 번호 u203-e1 에서 m033 그림이면 R1125 시트)
{const V=pick('u203-e1',/m033/);const c=world(),e=mk('u203-e1',V.idle[0]);const dn=frames(c,e,1.2,e=>{e.y+=.06;}).slice(14);ok(dn.every(k=>k.sourcePath===V.dirs.down.path&&/r1125/.test(k.sourcePath)),'u203-e1 m033 art still gets the R1125 down sheet');}
// ② 기존 항목 그림이면 기존 시트(회귀)
for(const id of COLL){const B=BEF[id];if(!B.dirs.down)continue;const c=world(),e=mk(id,B.idle[0]);const dn=frames(c,e,1.2,e=>{e.y+=.06;}).slice(14);ok(dn.every(k=>k.sourcePath===B.dirs.down.path),id+': earlier art still gets the earlier down sheet');}
// 연결
{const html=rd('runtime-text/index.html');ok(html.includes('<script src="./coop-relay-r1109.js"></script>\n<script src="./move-dir-r1167-data.js"></script>\n')&&html.indexOf('move-dir-r1167-data.js')>html.indexOf('move-dir-r974-data.js'),'tag after coop-relay-r1109.js (R974 data loaded first; the module joins late tables like R1125)');
 ok(fs.readFileSync(path.join(R,'../scripts/verify-r96-public.py'),'utf8').includes("'move-dir-r1167-data.js'"),'public verify list');
 ok(fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1167/r1167-cpu-check.cjs'),'CI step');
 const man=rd('runtime-manifest.json');for(const [,V] of NV)for(const S of Object.values(V.dirs))ok(man.includes(S.path),'manifest has '+S.path);ok(man.includes('move-dir-r1167-data.js'),'manifest has the data script');
 const rec=JSON.parse(rd('r1167-m040-move.json'));ok(rec.files.filter(f=>f.applied).length===2&&rec.files.filter(f=>f.applied).every(f=>f.sha256&&f.sourceSha256&&f.source&&f.bytes>0),'asset record: 2 sheets with source/hash/size');}
console.log('R1167 m040 move CPU check OK ('+n+' assertions)');
