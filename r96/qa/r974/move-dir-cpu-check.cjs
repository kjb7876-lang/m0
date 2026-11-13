// R974 CPU 검사: 보스·중간보스 방향 이동(move-dir-r974.js + 표 move-dir-r974-data.js) — 사용자 2026-11-12 "위아래 이동모션은 최소4프레임… 위아래옆3가지 방향만… 좌우는 서로 반전", "일단 이동만".
//  ① 걷는 동안만, 엔진이 그린 몸이 표의 대기 그림일 때만 방향 시트(384칸 4프레임 8fps)로 바꾼다. ② 몸통 키·발 자리는 엔진 대기 그림과 같게.
//  ③ 옆 시트는 가는 쪽으로 뒤집고 앞·뒤는 안 뒤집는다. ④ 공격·피격·정지·다른 그림·표에 없는 몹·페르소나·죽음·끄기·시트 안 실림은 엔진 그대로. ⑤ 연결(태그·검증 목록·CI 줄·자산).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const F=path.join(R,'client-source','move-dir-r974.js'),FD=path.join(R,'client-source','move-dir-r974-data.js');ok(fs.existsSync(F)&&fs.existsSync(FD),'module + data exist');
const src=fs.readFileSync(F,'utf8'),dsrc=fs.readFileSync(FD,'utf8');
function world({store={},ready=true,noData=false}={}){const timers=[];const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,WeakSet,Set,isFinite,RegExp,performance:{now:()=>0},setTimeout:f=>{timers.push(f);return timers.length;},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(`var time=0,room={id:'dist01',enemies:[]},player={x:9,y:9},ctx={commands:[]},__ready=${ready},__added=[];
  function addImage(p){__added.push(p);}function readyImage(p){if(/assets\\/r974\\//.test(p)){if(!__ready)return null;return {ready:true,image:{src:'http://x/m0/'+p,naturalWidth:1536,naturalHeight:384}};}return {ready:true,image:{src:'http://x/m0/'+p,naturalWidth:10,naturalHeight:10}};}
  function project(x,y){return {x:100+(x-3)*10,y:200+(y-3)*5};}
  // 엔진 몸: e.__art = {path,rect,size} 를 키 e.__h(기본 100px) 사각형으로, 발 = 사각형 바닥에서 e.__lift 만큼 위. e.__flip 이면 좌우 뒤집어 그림.
  function drawEnemy(e){const P=project(e.x,e.y),A=e.__art,h=e.__h||100,w=h*A.rect[2]/A.rect[3],top=P.y-h*.95,L=P.x-w/2,x0=e.__flip?L+w:L,x1=e.__flip?L:L+w;
   if(e.__ghost)ctx.commands.push({kind:'image',owner:{kind:'enemy'},r620Ghost:true,image:{src:'http://x/m0/'+A.path},sourcePath:A.path,sourceRect:A.rect.slice(),imageSize:A.size,style:{globalAlpha:.4},points:[[x0+3,top],[x1+3,top],[x1+3,top+h],[x0+3,top+h]]});
   ctx.commands.push({kind:'image',key:'enemy:'+e.nativeId,owner:{kind:'enemy'},image:{src:'http://x/m0/'+A.path},imageSize:A.size,sourcePath:A.path,sourceRect:A.rect.slice(),style:{globalAlpha:1},points:[[x0,top],[x1,top],[x1,top+h],[x0,top+h]]});
   ctx.commands.push({kind:'image',owner:{kind:'enemy'},image:{src:'http://x/m0/assets/fx/shadow.png'},sourcePath:'assets/fx/shadow.png',sourceRect:[0,0,10,10],imageSize:[10,10],style:{},points:[[P.x-200,P.y-150],[P.x+200,P.y-150],[P.x+200,P.y+150],[P.x-200,P.y+150]]});
   ctx.commands.push({kind:'text',owner:{kind:'enemy'},text:e.name,point:[P.x,P.y-h],style:{}});}`,ctx);
 if(!noData)vm.runInContext(dsrc,ctx);vm.runInContext(src,ctx);while(timers.length)timers.shift()();return ctx;}
const run=(c,s)=>vm.runInContext(s,c),API=c=>c.__STORYWORLD_MOVE_DIR_R974__;
const DATA=world().__STORYWORLD_MOVE_DIR_R974_DATA__.enemies;
const H=k=>Math.abs(k.points[3][1]-k.points[0][1]),lr=k=>k.points[1][0]-k.points[0][0];
const mk=(id,o)=>{const I=DATA[id].idle[0];return {id:id+'#1',nativeId:id,name:id,x:3,y:3,hp:100,maxHp:100,hitTimer:0,state:'chase',midboss:true,__art:{path:I.path,rect:I.rect,size:I.size},...o};};
function frames(c,e,secs,step){const out=[];for(let t=0;t<secs-1e-9;t+=1/30){run(c,'time+=1/30');if(step)step(e,t);run(c,'ctx.commands.length=0');c.drawEnemy(e);const cm=run(c,'ctx.commands').filter(k=>k.kind==='image');out.push({cm,b:cm.find(k=>/enemy:/.test(k.key||'')),all:run(c,'ctx.commands').slice()});}return out;}
const DIR=k=>(/-(side|down|up)\.webp$/.exec(k.sourcePath)||[])[1]||null,F4=k=>Math.round(k.sourceRect[0]/384);
ok(typeof API(world())?.inspect==='function'&&API(world()).inspect().installed===true,'API + installed outside (deferred wrap)');
ok(Object.keys(DATA).length===26,'26 enemies in the table ('+Object.keys(DATA).length+')');
{// 표: 대기 그림·방향 시트 규격, 자산 파일 존재
 for(const [id,D] of Object.entries(DATA)){ok(D.cell===384&&D.n===4&&D.fps===8&&D.idle.length>=1,'table '+id+' cell/n/fps');
  for(const I of D.idle){ok(I.rect.length===4&&I.bbox.length===4&&I.body>50&&I.body<=I.rect[3]&&I.bbox[3]<=I.rect[3]+.5,'idle metrics sane '+id);}
  ok(D.dirs.down&&D.dirs.up,'down+up sheets '+id);
  for(const [d,S] of Object.entries(D.dirs)){ok(fs.existsSync(path.join(R,'runtime-text',S.path)),'asset exists '+S.path);ok(S.vis>120&&S.vis<=384&&S.py>250&&S.py<=384&&S.px>100&&S.px<284,'sheet metrics sane '+id+' '+d+' '+JSON.stringify(S));}}
 ok(!DATA['l301-boss'].dirs.side,'Fallen Angel Knight keeps its own side walk (down/up only)');ok(!DATA['kair-great-03'].dirs.side&&DATA['kair-great-03'].idle.length===8,'kair-great-03 (own 8-cell side walk): down/up only, every walk cell recognised');
 for(const no of ['l303-boss','mb-last302-v31231','b03-boss','b04-boss','b07-boss','b09-boss','mb-ep1a11','k103-boss'])ok(!DATA[no],'not in table: '+no);
 ok(!Object.keys(DATA).some(k=>/ep1b06|mammon/i.test(k)),'Mammon zone untouched');}
for(const id of ['mb-dist01','kair-great-01','u206-mid']){// 걷기 방향 → 시트, 크기·발
 const c=world(),e=mk(id),D=DATA[id],I=D.idle[0];const base=frames(c,e,.5),b0=base[base.length-1].b;ok(DIR(b0)===null&&b0.sourcePath===I.path,id+' standing → engine art');
 const bodyPx=H(b0)*I.body/I.rect[3];
 const Dn=frames(c,e,1,e=>{e.y+=.06;}),d=Dn[Dn.length-1].b;ok(DIR(d)==='down','moving down the screen → down sheet ('+d.sourcePath+')');
 ok(JSON.stringify(d.sourceRect.slice(1))==='[0,384,384]'&&JSON.stringify(d.imageSize)==='[1536,384]'&&d.sourcePath===D.dirs.down.path,id+' one 384 cell of 1536x384');
 ok(new Set(Dn.slice(12).map(x=>F4(x.b))).size===4,id+' 4 frames cycle');const ch=Dn.slice(12).filter((x,i,a)=>i&&F4(x.b)!==F4(a[i-1].b)).length;ok(ch>=3&&ch<=6,id+' about 8fps ('+ch+')');
 ok(Math.abs(H(d)*D.dirs.down.vis/384/bodyPx-1)<.01,id+' same body height as the engine idle ('+(H(d)*D.dirs.down.vis/384).toFixed(1)+' vs '+bodyPx.toFixed(1)+')');
 {const P=c.project(e.x,e.y),h=100,top=P.y-h*.95,footEngine=top+h*I.bbox[3]/I.rect[3],foot=Math.min(...d.points.map(q=>q[1]))+H(d)*D.dirs.down.py/384;ok(Math.abs(foot-footEngine)<1e-6,id+' foot row on the engine foot row');
  const w=h*I.rect[2]/I.rect[3],cxE=P.x-w/2+w*((I.bbox[0]+I.bbox[2])/2/I.rect[2]),cx=d.points[0][0]+lr(d)*D.dirs.down.px/384;ok(Math.abs(cx-cxE)<1e-6&&lr(d)>0,id+' centred on the engine body, not mirrored');}
 const U=frames(c,e,1,e=>{e.y-=.06;});ok(DIR(U[U.length-1].b)==='up',id+' moving up → up sheet');
 const Rt=frames(c,e,1,e=>{e.x+=.06;}),r=Rt[Rt.length-1].b;ok(DIR(r)==='side'&&lr(r)>0,id+' moving right → side sheet facing right');
 const Lf=frames(c,e,1,e=>{e.x-=.06;}),l=Lf[Lf.length-1].b;ok(DIR(l)==='side'&&lr(l)<0,id+' moving left → side sheet mirrored');
 {const P=c.project(e.x,e.y),h=100,w=h*I.rect[2]/I.rect[3],cxE=P.x-w/2+w*((I.bbox[0]+I.bbox[2])/2/I.rect[2]),cx=l.points[0][0]+lr(l)*D.dirs.side.px/384;ok(Math.abs(cx-cxE)<1e-6,id+' mirrored side still centred');}
 ok(DIR(frames(c,e,1.2).pop().b)===null,id+' stops → engine art again');}
{// 엔진이 뒤집어 그린 대기 그림(왼쪽 보기)에서도 가운데가 맞는다
 const c=world(),e=mk('mb-dist04',{__flip:true}),D=DATA['mb-dist04'],I=D.idle[0];const d=frames(c,e,1,e=>{e.y+=.06;}).pop().b;const P=c.project(e.x,e.y),w=100*I.rect[2]/I.rect[3],cxE=P.x+w/2-w*((I.bbox[0]+I.bbox[2])/2/I.rect[2]),cx=d.points[0][0]+lr(d)*D.dirs.down.px/384;
 ok(DIR(d)==='down'&&Math.abs(cx-cxE)<1e-6,'flipped engine idle → centre follows the mirrored body ('+cx.toFixed(2)+' vs '+cxE.toFixed(2)+')');}
{// 큰 몸(다른 덧씌우기가 키움)도 그대로 따른다
 const c=world(),e=mk('mb-ep1b02',{__h:240}),D=DATA['mb-ep1b02'],I=D.idle[0];const d=frames(c,e,1,e=>{e.y+=.06;}).pop().b;ok(Math.abs(H(d)*D.dirs.down.vis/384-240*I.body/I.rect[3])<.5,'scaled-up body keeps its size');}
{// 대각선·흔들림
 const c=world(),e=mk('mb-dist01');ok(DIR(frames(c,e,1,e=>{e.x+=.06;e.y+=.03;}).pop().b)==='side','side-heavy diagonal → side');
 const J=frames(c,e,1.2,(e,t)=>{e.y+=.06;e.x+=(Math.floor(t*30)%2?.07:-.07);});const sw=J.slice(12).filter((x,i,a)=>i&&DIR(x.b)!==DIR(a[i-1].b)).length;ok(sw<=1,'jittery heading does not flicker ('+sw+')');}
{// 그대로 두는 경우
 const c=world(),e=mk('mb-dist01');frames(c,e,.8,e=>{e.y+=.06;});
 e.attack={elapsed:.1};ok(DIR(frames(c,e,.1,e=>{e.y+=.06;}).pop().b)===null,'attacking → engine art');e.attack=null;
 e.state='attack';ok(DIR(frames(c,e,.1,e=>{e.y+=.06;}).pop().b)===null,'attack state without e.attack → engine art');e.state='chase';
 e.hitTimer=.2;ok(DIR(frames(c,e,.1,e=>{e.y+=.06;}).pop().b)===null,'being hit → engine art');e.hitTimer=0;
 ok(DIR(frames(c,e,.3,e=>{e.y+=.06;}).pop().b)==='down','back to walking → down sheet');
 const I=DATA['mb-dist01'].idle[0];e.__art={path:I.path.replace('-p4','-p1'),rect:I.rect,size:I.size};ok(DIR(frames(c,e,.3,e=>{e.y+=.06;}).pop().b)===null,'engine drew another pose (p1) → untouched');
 e.__art={path:'assets/r380/mobs/hospital-surgeon-v1.webp',rect:[0,0,256,256],size:[2048,256]};ok(DIR(frames(c,e,.3,e=>{e.y+=.06;}).pop().b)===null,'another overlay art → untouched');
 e.__art={path:I.path,rect:[5,0,I.rect[2],I.rect[3]],size:I.size};ok(DIR(frames(c,e,.3,e=>{e.y+=.06;}).pop().b)===null,'different source cell → untouched');
 e.__art={path:I.path,rect:I.rect,size:I.size};e.hp=0;ok(DIR(frames(c,e,.3,e=>{e.y+=.06;}).pop().b)===null,'dead → untouched');e.hp=100;
 const p=mk('mb-dist01',{persona:true});ok(DIR(frames(c,p,.8,e=>{e.y+=.06;}).pop().b)===null,'persona → untouched');
 const m=mk('mb-dist01',{nativeId:'d01-e1'});ok(DIR(frames(c,m,.8,e=>{e.y+=.06;}).pop().b)===null,'mob not in the table → untouched');
 const t=mk('mb-dist01');frames(c,t,.8,e=>{e.y+=.06;});t.x+=8;ok(DIR(frames(c,t,.05)[0].b)==='down','sideways teleport while walking down does not turn the body');
 const st=mk('mb-dist01');frames(c,st,.3);st.y+=8;const j=frames(c,st,.1);ok(j.every(x=>DIR(x.b)===null),'standing mob that gets teleported does not start walking');}
{// 다른 명령은 그대로, R620 옛 자세 잔상만 뺀다
 const c=world(),e=mk('mb-dist01',{__ghost:true});const L=frames(c,e,1,e=>{e.y+=.06;}).pop();ok(DIR(L.b)==='down'&&!L.cm.some(k=>k.r620Ghost),'old-pose crossfade ghost dropped while the walk sheet shows');
 ok(L.cm.some(k=>/shadow/.test(k.sourcePath))&&L.all.some(k=>k.kind==='text'),'shadow fx + name label kept');const s=L.cm.find(k=>/shadow/.test(k.sourcePath));ok(H(s)===300,'bigger fx image is not mistaken for the body');
 const S=frames(c,e,1.2).pop();ok(S.cm.some(k=>k.r620Ghost),'standing → ghost kept');}
{// 시트 안 실림·끄기·표 없음
 const c=world({ready:false}),e=mk('mb-dist01');ok(DIR(frames(c,e,.8,e=>{e.y+=.06;}).pop().b)===null,'sheet not loaded → engine art');ok(['side','down','up'].every(d=>run(c,'__added').includes(DATA['mb-dist01'].dirs[d].path)),'sheets requested on first draw');
 const o=world({store:{'storyworld.r974.moveDir':'{"on":false}'}}),eo=mk('mb-dist01');ok(DIR(frames(o,eo,.8,e=>{e.y+=.06;}).pop().b)===null,'on:false → engine art');
 const nd=world({noData:true}),en=mk('mb-dist01');ok(DIR(frames(nd,en,.8,e=>{e.y+=.06;}).pop().b)===null&&API(nd).inspect().enemies===0,'no data file → nothing happens');
 const c2=world(),e2=mk('l301-boss');ok(DIR(frames(c2,e2,.8,e=>{e.x+=.06;}).pop().b)===null,'no side sheet (Fallen Angel Knight) → its own side walk kept');ok(DIR(frames(c2,e2,.8,e=>{e.y+=.06;}).pop().b)==='down','… but down sheet is used');
 ok(API(c2).inspect().stats.errors===0,'no errors');
 // 자기 걷기 칸을 돌려 그리는 몹(kair-great-03, 8칸): 어느 칸이 그려져도 아래·위 시트로 — 칸마다 깜박이지 않는다
 const c3=world(),e3=mk('kair-great-03'),D3=DATA['kair-great-03'];let i3=0;const L3=frames(c3,e3,1,e=>{e.y+=.06;const I=D3.idle[(i3++>>2)%8];e.__art={path:I.path,rect:I.rect,size:I.size};});ok(L3.slice(12).every(x=>DIR(x.b)==='down'),'engine cycling its 8 walk cells while moving down → always the down sheet');}
{// 맨 바깥 유지: 나중에 실린 덧씌우기가 drawEnemy 를 감싸 몸 크기를 바꿔도(R205 최소 크기 맞춤 꼴) 그 뒤에서 읽고 바꾼다 — 한 번만 바꾸고, 다시 감싸기는 6번까지
 const c=world(),e=mk('mb-dist01'),D=DATA['mb-dist01'],I=D.idle[0];
 run(c,`{const b=drawEnemy;drawEnemy=function(e){const st=ctx.commands.length;const r=b.apply(this,arguments);for(let i=st;i<ctx.commands.length;i++){const k=ctx.commands[i];if(k.kind==='image'&&/enemy:/.test(k.key||'')){const P=k.points,fx=(P[2][0]+P[3][0])/2,fy=(P[2][1]+P[3][1])/2;k.points=P.map(([x,y])=>[fx+(x-fx)*2,fy+(y-fy)*2]);}}return r;};}`);
 const L=frames(c,e,1,e=>{e.y+=.06;}),d=L[L.length-1].b;ok(API(c).inspect().outermost&&API(c).inspect().wraps===2,'re-wrapped outside the later overlay ('+API(c).inspect().wraps+')');
 ok(DIR(d)==='down'&&Math.abs(H(d)*D.dirs.down.vis/384-200*I.body/I.rect[3])<.5,'reads the body after the later overlay doubled it ('+(H(d)*D.dirs.down.vis/384).toFixed(1)+' vs '+(200*I.body/I.rect[3]).toFixed(1)+')');
 const s0=API(c).inspect().stats.swapped;frames(c,e,.1,e=>{e.y+=.06;});ok(API(c).inspect().stats.swapped-s0===3,'swapped once per draw (inner wrapper passes through)');
 for(let i=0;i<9;i++){run(c,'{const b=drawEnemy;drawEnemy=function(){return b.apply(this,arguments);};}');frames(c,e,.05,e=>{e.y+=.06;});}ok(API(c).inspect().wraps===6,'re-wrap capped at 6');ok(API(c).inspect().stats.errors===0,'no errors');}
{// 연결: 태그 순서·검증 목록·CI 줄·자산 표
 const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8'),a=html.indexOf('move-dir-r974-data.js'),b=html.indexOf('move-dir-r974.js'),cmb=html.indexOf('combat-r118.js'),bm=html.indexOf('boss-r205.js'),r6=html.indexOf('combat-flow-r425.js');
 ok(a>0&&b>a,'index.html: data tag before module tag');ok(html.includes('<script src="./survival-passives-r962.js"></script>\n<script src="./move-dir-r974-data.js"></script>\n<script src="./move-dir-r974.js"></script>\n'),'tags right after survival-passives-r962 (before the story-reader line that r176 pins)');ok(bm>0&&r6>0&&cmb>b,'R205/R425 load later → the module re-wraps itself outermost at run time');
 const ver=fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8');ok(ver.includes('move-dir-r974.js')&&ver.includes('move-dir-r974-data.js'),'verify-r96-public expects both scripts');
 const yml=fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8');ok(yml.includes('node r96/qa/r974/move-dir-cpu-check.cjs'),'pages.yml runs this check');
 const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');ok(man.includes('move-dir-r974.js')&&man.includes('assets/r974/move/mb-dist01-down.webp'),'runtime manifest lists script + sheets');
 const rec=JSON.parse(fs.readFileSync(path.join(R,'r974-move-dir.json'),'utf8'));ok(rec.files.filter(f=>f.applied).length===76&&rec.files.filter(f=>f.applied===false).length>=6&&rec.files.every(f=>!f.applied||(f.sourceSha256&&f.sha256&&f.bytes>0)),'asset record: 77 applied sheets with hashes, held ones listed with reasons');
 ok(fs.readFileSync(path.join(R,'runtime-text','move-dir-r974.js'),'utf8')===src,'runtime-text copy in sync');}
console.log('R974 move-dir CPU check OK ('+n+' assertions)');
