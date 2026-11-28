// R1377 CPU 검사: 2D 몹·보스 상·하·옆 공격·이동 그림(mob-dir-art-r1377.js + 표 mob-dir-art-r1377-data.js)
//  사용자 2026-11-27 "2d몹들 상하옆(좌우반전) 공격이동모션 크기및 동작일관성있게 어색함없게 … 특히 일관성".
//  ① 영웅이 위·아래에 있을 때(세로가 가로의 1.25배 넘음) 공격하면 표의 atk_up/atk_down 시트로, 칸은 공격 진행도(준비→치기→회수)로 고른다.
//  ② 몸통 키·발 줄·가운데는 그 몹이 마지막으로 서 있던 대기 그림과 같다(±1%) — 화면 배율이 바뀌어도 따라간다.
//  ③ 한 번 휘두르는 동안 방향이 바뀌지 않는다. 옆 공격은 영웅 쪽을 본다. 위·아래는 뒤집지 않는다.
//  ④ 걷기 위·아래·옆 시트는 걸은 거리로 칸이 넘어간다(미끄러짐 없음), 옆은 가는 쪽으로 뒤집는다.
//  ⑤ 표에 없는 몹·시트 없는 방향·대기 기준 없음·끄기·시트 안 실림·죽음은 엔진(과 R974) 그림 그대로.
//  ⑥ 연결(태그 순서·검증 목록·CI 줄·자산·표 규격).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const F=path.join(R,'client-source','mob-dir-art-r1377.js'),FD=path.join(R,'client-source','mob-dir-art-r1377-data.js');
ok(fs.existsSync(F)&&fs.existsSync(FD),'module + data exist');
const src=fs.readFileSync(F,'utf8'),dsrc=fs.readFileSync(FD,'utf8');
const r974=fs.readFileSync(path.join(R,'client-source','move-dir-r974.js'),'utf8'),r974d=fs.readFileSync(path.join(R,'client-source','move-dir-r974-data.js'),'utf8');
// 가짜 몹 tmob: 엔진 대기 그림 200×400 칸, 몸통 300px, 발 줄 380. 시트 512칸, 발 488, 몸통 340.
const TEST={enemies:{tmob:{idle:[{path:'assets/test/tmob-idle.webp',rect:[0,0,200,400],body:300,bbox:[50,40,150,380]}],cell:512,foot:488,cx:256,vis:340,
 sheets:{atk_up:{path:'assets/r1377/tmob/atk_up6.webp',n:6},atk_down:{path:'assets/r1377/tmob/atk_down6.webp',n:6},walk_up:{path:'assets/r1377/tmob/walk_up4.webp',n:4},walk_down:{path:'assets/r1377/tmob/walk_down4.webp',n:4}}},
 smob:{idle:[{path:'assets/test/smob-idle.webp',rect:[0,0,200,400],body:300,bbox:[50,40,150,380]}],cell:512,foot:488,cx:256,vis:340,
 sheets:{atk_side:{path:'assets/r1377/smob/atk_side4.webp',n:4},walk_side:{path:'assets/r1377/smob/walk_side6.webp',n:6}}},
 bmob:{idle:[{path:'assets/test/bmob-idle.webp',rect:[0,0,200,400],body:300,bbox:[50,40,150,380]}],cell:512,foot:488,cx:256,vis:340,sheets:{},block:['assets/test/other-guy']}}};
function world({store={},ready=true,data=TEST,scale=1}={}){const timers=[];const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,WeakSet,Set,isFinite,RegExp,performance:{now:()=>0},setTimeout:f=>{timers.push(f);return timers.length;},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(`var time=0,room={id:'dist01',layer:'STORY',enemies:[]},player={x:3,y:3},ctx={commands:[]},__ready=${ready},__scale=${scale};
  var __added=[];function addImage(p){__added.push(p);}function readyImage(p){if(/assets\\/r1377\\//.test(p)){if(!__ready)return null;const n=+(/(\\d+)\\.webp$/.exec(p)||[0,1])[1];return {ready:true,image:{src:'http://x/m0/'+p,naturalWidth:512*n,naturalHeight:512}};}return {ready:true,image:{src:'http://x/m0/'+p,naturalWidth:10,naturalHeight:10}};}
  function project(x,y){return {x:100+(x-3)*10*__scale,y:200+(y-3)*5*__scale};}
  function drawEnemy(e){const P=project(e.x,e.y),A=e.__art,h=(e.__h||100)*__scale,w=h*A.rect[2]/A.rect[3],top=P.y-h*.95,L=P.x-w/2,x0=e.__flip?L+w:L,x1=e.__flip?L:L+w;
   ctx.commands.push({kind:'image',key:'enemy:'+e.nativeId,owner:{kind:'enemy'},image:{src:'http://x/m0/'+A.path},imageSize:A.size||[A.rect[2],A.rect[3]],sourcePath:A.path,sourceRect:A.rect.slice(),style:{globalAlpha:1},points:[[x0,top],[x1,top],[x1,top+h],[x0,top+h]]});
   ctx.commands.push({kind:'image',owner:{kind:'enemy'},image:{src:'http://x/m0/assets/fx/shadow.png'},sourcePath:'assets/fx/shadow.png',sourceRect:[0,0,10,10],imageSize:[10,10],style:{},points:[[P.x-200,P.y-150],[P.x+200,P.y-150],[P.x+200,P.y+150],[P.x-200,P.y+150]]});}`,ctx);
 vm.runInContext(r974d,ctx);vm.runInContext(r974,ctx);vm.runInContext(dsrc,ctx);if(data)ctx.__STORYWORLD_MOB_DIR_ART_R1377_DATA__=data;vm.runInContext(src,ctx);while(timers.length)timers.shift()();return ctx;}
const run=(c,s)=>vm.runInContext(s,c),API=c=>c.__STORYWORLD_MOB_DIR_ART_R1377__;
const H=k=>Math.abs(k.points[3][1]-k.points[0][1]),lr=k=>k.points[1][0]-k.points[0][0];
const I0=TEST.enemies.tmob.idle[0];
const mk=(id,o)=>({id:id+'#1',nativeId:id,name:id,x:3,y:3,hp:100,maxHp:100,hitTimer:0,state:'chase',__art:{path:I0.path.replace('tmob',id),rect:I0.rect},...o});
function draw(c,e,dt=1/30,step){run(c,'time+='+dt);if(step)step(e);run(c,'ctx.commands.length=0');c.drawEnemy(e);return run(c,'ctx.commands').find(k=>/enemy:/.test(k.key||''));}
function idle(c,e,secs=.5){let b;for(let t=0;t<secs;t+=1/30)b=draw(c,e);return b;}
const SH=k=>(/r1377\/\w+\/(\w+?)\d+\.webp$/.exec(k.sourcePath)||[])[1]||null,FR=k=>Math.round(k.sourceRect[0]/512);
// 엔진 대기 그림의 화면 몸통 키·발 줄·가운데(가짜 엔진 공식 그대로)
function eng(c,e,scale=1){const P=c.project(e.x,e.y),h=(e.__h||100)*scale,w=h*.5,top=P.y-h*.95;return {vis:h*I0.body/I0.rect[3],foot:top+h*I0.bbox[3]/I0.rect[3],cx:P.x-w/2+w*((I0.bbox[0]+I0.bbox[2])/2/I0.rect[2])};}
const placed=(k,D)=>({vis:H(k)*D.vis/D.cell,foot:Math.min(...k.points.map(q=>q[1]))+H(k)*D.foot/D.cell,cx:Math.min(k.points[0][0],k.points[1][0])+Math.abs(lr(k))*D.cx/D.cell});
const SH0={windup:.4,active:.1,recovery:.3},SH1={windup:.3,active:.1,recovery:.2};
const atk=(e,el,sh=SH0)=>{e.attack=e.attack&&e.attack.__k===sh?e.attack:{__k:sh,elapsed:0,shape154:sh,angle:0};e.attack.elapsed=el;e.state=el<sh.windup?'windup':'attack';};

ok(typeof API(world())?.inspect==='function'&&API(world()).inspect().installed===true,'API + hooked into the R974 outer draw');
{// ① 위 공격: 시트·진행도 칸
 const c=world(),e=mk('tmob');const b0=idle(c,e);ok(SH(b0)===null&&b0.sourcePath.endsWith('tmob-idle.webp'),'standing → engine idle art');
 run(c,'player.x=3;player.y=-20');const D=TEST.enemies.tmob,E=eng(c,e);
 const want=[[0,0],[.2,1],[.39,2],[.45,3],[.55,4],[.79,5]];
 for(const [el,f] of want){const b=draw(c,e,1/30,e=>atk(e,el));ok(SH(b)==='atk_up','hero above → atk_up ('+b.sourcePath+')');ok(FR(b)===f,'progress '+el+' → cell '+f+' (got '+FR(b)+')');
  ok(JSON.stringify(b.sourceRect.slice(1))==='[0,512,512]'&&JSON.stringify(b.imageSize)==='[3072,512]','one 512 cell of a 6-cell strip');
  const p=placed(b,D);ok(Math.abs(p.vis/E.vis-1)<.01,'atk_up body height = idle body ('+p.vis.toFixed(1)+' vs '+E.vis.toFixed(1)+')');ok(Math.abs(p.foot-E.foot)<.5,'atk_up foot on the idle foot row ('+p.foot.toFixed(1)+' vs '+E.foot.toFixed(1)+')');
  ok(Math.abs(p.cx-E.cx)<.5&&lr(b)>0,'atk_up centred on the idle body, not mirrored');}
 e.attack=null;e.state='chase';ok(SH(idle(c,e,.2))===null,'attack over → engine art');}
{// ① 아래 공격 + storyAttack 경로 + 원거리 준비
 const c=world(),e=mk('tmob');idle(c,e);run(c,'player.x=3.4;player.y=30');
 const b=draw(c,e,1/30,e=>atk(e,.1));ok(SH(b)==='atk_down'&&FR(b)===0,'hero below → atk_down windup cell');e.attack=null;
 run(c,'time+=.1');const t=run(c,'time');e.storyAttackState5='melee';e.storyAttackStart5=t+.3;e.storyAttackUntil5=t+.6;
 const s0=draw(c,e,.01);ok(SH(s0)==='atk_down'&&FR(s0)<3,'story attack before strike → prep cell ('+FR(s0)+')');
 const s1=draw(c,e,.31);ok(FR(s1)===3,'story attack strike → cell 3 ('+FR(s1)+')');
 const s2=draw(c,e,.25);ok(FR(s2)>=4,'story attack tail → recovery cell ('+FR(s2)+')');
 e.storyAttackState5=null;e.storyAttackUntil5=0;idle(c,e,.2);
 e.rangedWindup=.5;const r=draw(c,e);ok(SH(r)==='atk_down'&&FR(r)<3,'ranged windup → prep cells');e.rangedWindup=0;}
{// ② 화면 배율이 바뀌어도 대기 기준을 따른다
 const c=world({scale:1}),e=mk('tmob');idle(c,e);run(c,'__scale=1.6;player.y=-20');const E=eng(c,e,1.6);
 const b=draw(c,e,1/30,e=>atk(e,.45));const p=placed(b,TEST.enemies.tmob);ok(Math.abs(p.vis/E.vis-1)<.01&&Math.abs(p.foot-E.foot)<.8,'zoomed 1.6× → still idle-sized and on the foot row ('+p.vis.toFixed(1)+'/'+E.vis.toFixed(1)+')');}
{// ② 큰 몸(다른 덧씌우기가 키움)·뒤집힌 대기
 const c=world(),e=mk('tmob',{__h:240,__flip:true});idle(c,e);run(c,'player.y=-20');const E=eng(c,e);E.vis=240*I0.body/I0.rect[3];
 const b=draw(c,e,1/30,e=>atk(e,.45));const p=placed(b,TEST.enemies.tmob);ok(Math.abs(p.vis/E.vis-1)<.01,'scaled-up body keeps its size');
 const P=c.project(e.x,e.y),w=120,cxE=P.x+w/2-w*((I0.bbox[0]+I0.bbox[2])/2/I0.rect[2]);ok(Math.abs(p.cx-cxE)<.5,'mirrored idle → centre follows the mirrored body');}
{// ③ 한 번 휘두르는 동안 방향 고정, 옆은 그대로(시트 없음)
 const c=world(),e=mk('tmob');idle(c,e);run(c,'player.y=-20');draw(c,e,1/30,e=>atk(e,.05));run(c,'player.x=60;player.y=3');
 ok(SH(draw(c,e,1/30,e=>atk(e,.3)))==='atk_up','direction locked for the whole swing');e.attack=null;idle(c,e,.2);
 ok(SH(draw(c,e,1/30,e=>atk(e,.1)))===null,'hero to the side, no atk_side sheet → engine side art');
 e.attack=null;idle(c,e,.2);run(c,'player.x=4;player.y=-20');ok(SH(draw(c,e,1/30,e=>atk(e,.1)))==='atk_up','slight x offset, mostly above → up');
 e.attack=null;idle(c,e,.2);run(c,'player.x=13;player.y=-3');ok(SH(draw(c,e,1/30,e=>atk(e,.1)))===null,'diagonal (dy < 1.25 dx on screen) → side');}
{// ③ 옆 공격 시트: 영웅 쪽을 본다
 const c=world(),e=mk('smob');idle(c,e);run(c,'player.x=-10;player.y=3');const b=draw(c,e,1/30,e=>atk(e,.35,SH1));
 ok(SH(b)==='atk_side'&&lr(b)<0,'hero on the left → side attack mirrored');ok(FR(b)===2,'4-cell strike = cell 2 ('+FR(b)+')');e.attack=null;idle(c,e,.2);
 run(c,'player.x=20');const r=draw(c,e,1/30,e=>atk(e,.1,SH1));ok(SH(r)==='atk_side'&&lr(r)>0,'hero on the right → side attack facing right');
 ok(SH(draw(c,e,1/30,e=>{e.attack=null;e.state='chase';e.y-=.06;}))===null,'smob has no walk_up → engine/R974 art');}
{// ④ 걷기: 위·아래·옆, 걸은 거리로 칸
 const c=world(),e=mk('tmob');idle(c,e);let L=[];for(let i=0;i<30;i++)L.push(draw(c,e,1/30,e=>{e.y-=.06;}));
 const b=L[L.length-1];ok(SH(b)==='walk_up','walking up the screen → walk_up ('+b.sourcePath+')');const p=placed(b,TEST.enemies.tmob),E=eng(c,e);ok(Math.abs(p.vis/E.vis-1)<.01&&Math.abs(p.foot-E.foot)<.5,'walk_up idle-sized on the foot row');
 ok(new Set(L.slice(10).map(FR)).size===4,'4 walk cells cycle');
 const still=[];for(let i=0;i<4;i++)still.push(draw(c,e,1/30,e=>{e.y-=.0001;}));ok(new Set(still.map(k=>SH(k)==='walk_up'?FR(k):-1)).size<=2,'cells do not run while barely moving');
 L=[];for(let i=0;i<30;i++)L.push(draw(c,e,1/30,e=>{e.y+=.06;}));ok(SH(L[L.length-1])==='walk_down','walking down → walk_down');
 ok(SH(idle(c,e,1.2))===null,'stops → engine art');
 const s=world(),m=mk('smob');idle(s,m);L=[];for(let i=0;i<30;i++)L.push(draw(s,m,1/30,e=>{e.x-=.06;}));ok(SH(L[L.length-1])==='walk_side'&&lr(L[L.length-1])<0,'walking left → walk_side mirrored');
 L=[];for(let i=0;i<30;i++)L.push(draw(s,m,1/30,e=>{e.x+=.06;}));ok(SH(L[L.length-1])==='walk_side'&&lr(L[L.length-1])>0,'walking right → walk_side facing right');}
{// ⑤ 그대로 두는 경우
 const c=world(),e=mk('tmob');run(c,'player.y=-20');ok(SH(draw(c,e,1/30,e=>atk(e,.45)))===null,'no idle seen yet → engine art (no guessed size)');
 const o=mk('omob');idle(c,o);ok(SH(draw(c,o,1/30,e=>atk(e,.45)))===null,'not in the table → engine art');
 const z=world({ready:false}),ez=mk('tmob');idle(z,ez);run(z,'player.y=-20');ok(SH(draw(z,ez,1/30,e=>atk(e,.45)))===null,'sheet not loaded → engine art');
 const off=world({store:{'storyworld.r1377.dirArt':'{"on":false}'}}),eo=mk('tmob');idle(off,eo);run(off,'player.y=-20');ok(SH(draw(off,eo,1/30,e=>atk(e,.45)))===null,'switched off → engine art');
 const d=world(),ed=mk('tmob');idle(d,ed);run(d,'player.y=-20');ed.hp=0;ok(SH(draw(d,ed,1/30,e=>atk(e,.45)))===null,'dead → engine art');
 const p=world(),ep=mk('tmob',{persona:true});idle(p,ep);run(p,'player.y=-20');ok(SH(draw(p,ep,1/30,e=>atk(e,.45)))===null,'persona → engine art');}
{// ⑦ 다른 인물 그림(block) → 마지막 대기 그림을 같은 자리·크기로, 칠 때 영웅 쪽으로 숙이고 걸을 때 출렁임
 const c=world(),e=mk('bmob');const i0=idle(c,e);const ip=i0.points.map(q=>q.slice());const other={path:'assets/test/other-guy-attack.png',rect:[0,0,300,300]};
 run(c,'player.x=20;player.y=3');e.__art=other;e.__h=130;
 const w=draw(c,e,1/30,e=>atk(e,.1));ok(w.sourcePath.endsWith('bmob-idle.webp')&&JSON.stringify(w.sourceRect)==='[0,0,200,400]','blocked attack art → idle art held ('+w.sourcePath+')');
 ok(Math.abs(H(w)-100)<4&&Math.abs(Math.max(...w.points.map(q=>q[1]))-Math.max(...ip.map(q=>q[1])))<.5,'held art keeps idle size and foot');
 const st=draw(c,e,1/30,e=>atk(e,.45));const mx=k=>(k.points[0][0]+k.points[1][0])/2;ok(mx(st)-mx(i0)>2,'strike leans toward the hero on the right ('+(mx(st)-mx(i0)).toFixed(1)+')');
 run(c,'player.x=-20');e.attack=null;e.state='chase';e.__art={path:'assets/test/bmob-idle.webp',rect:[0,0,200,400]};e.__h=100;idle(c,e,.3);e.__art=other;
 const L=draw(c,e,1/30,e=>atk(e,.45));ok(mx(L)-mx(i0)<-2&&lr(L)<0,'hero on the left → mirrored and leans left');
 e.attack=null;e.state='chase';e.__art={path:'assets/test/other-guy-move.png',rect:[0,0,300,300]};const ys=[];for(let i=0;i<30;i++){const k=draw(c,e,1/30,e=>{e.x+=.06;});ok(k.sourcePath.endsWith('bmob-idle.webp'),'blocked walk art → idle art');ys.push(Math.min(...k.points.map(q=>q[1]))-c.project(e.x,e.y).y);}
 ok(Math.max(...ys)-Math.min(...ys)>.8,'held walk bobs ('+(Math.max(...ys)-Math.min(...ys)).toFixed(2)+'px)');
 const o=world(),eo=mk('bmob');run(o,'player.y=-20');eo.__art={path:'assets/test/other-guy-attack.png',rect:[0,0,300,300]};ok(draw(o,eo,1/30,e=>atk(e,.45)).sourcePath.includes('other-guy'),'no idle seen yet → engine art');}
{// ⑦ 같은 nativeId 가 지역마다 다른 인물일 때(h103-boss: hando03 악몽왕 ≠ 사몽 S07 페르소나) — '<id>@<지역>' 칸이 먼저, 다른 지역엔 안 붙는다
 const Z={enemies:{'zmob@dist02':{...TEST.enemies.tmob}}};const c=world({data:Z}),e=mk('zmob');
 ok(!API(c).wants(e),'zone-keyed entry ignored in another zone (dist01)');run(c,"room.id='dist02'");ok(API(c).wants(e),'zone-keyed entry used in its zone (dist02)');
 const Y={enemies:{'ymob@dist01':{...TEST.enemies.tmob},ymob:{...TEST.enemies.smob}}};const d=world({data:Y});ok(API(d).wants(mk('ymob')),'plain id still works');
 const T=world({data:null}).__STORYWORLD_MOB_DIR_ART_R1377_DATA__;for(const [id,D] of Object.entries(T.enemies))if(Object.keys(D.sheets).length)ok(/^[^@]+@[\w-]+$/.test(id),'Dots sheets are zone-keyed: '+id);}
{// ⑧ 엔진이 e.attack 없이 공격 그림만 바꾸는 보스(세이렌 모르: 특수 보스 패턴이 siren_attack 을 그림) — 표 atkArt 그림이 보이면 공격으로 읽어 상·하·옆 시트로,
 //    대기 시트가 있으면 엔진의 여러 대기 변형(페이즈 그림·R620 대기 애니)도 한 모습으로 맞춘다
 const A={enemies:{amob:{...TEST.enemies.tmob,idle:[{...I0,path:'assets/test/amob-idle.webp'}],sheets:{idle_side:{path:'assets/r1377/amob/idle_side6.webp',n:6},atk_up:{path:'assets/r1377/amob/atk_up6.webp',n:6},atk_side:{path:'assets/r1377/amob/atk_side6.webp',n:6}},atkArt:['assets/test/amob-cast']}}};
 const c=world({data:A}),e=mk('amob');const b0=idle(c,e);ok(SH(b0)==='idle_side','standing on idle art → idle_side sheet');
 e.__art={path:'assets/test/amob-skill.webp',rect:[0,0,200,400]};const k1=draw(c,e);ok(SH(k1)==='idle_side','other engine pose (phase/idle variants) → the same idle_side sheet (one look)');
 e.__art=I0&&{path:'assets/test/amob-idle.webp',rect:I0.rect};idle(c,e,.3);run(c,'player.x=3;player.y=-20');e.__art={path:'assets/test/amob-cast.webp',rect:[0,0,200,400]};
 const f=[];for(let i=0;i<24;i++){const k=draw(c,e);ok(SH(k)==='atk_up','atkArt with hero above → atk_up ('+SH(k)+')');f.push(FR(k));}
 ok(f[0]===0&&Math.max(...f)>=3&&f.every((v,i)=>!i||v>=f[i-1]),'atkArt cells advance with time '+f.join(''));
 e.__art={path:'assets/test/amob-idle.webp',rect:I0.rect};const k2=draw(c,e);ok(SH(k2)==='idle_side','back to idle art → idle_side');
 e.__art={path:'assets/test/amob-cast.webp',rect:[0,0,200,400]};ok(FR(draw(c,e))===0,'a new cast starts from cell 0');}
{// ⑧b 피격 시트가 없는 몹: 엔진 피격 그림(다른 크기·다른 발 자리) 대신 같은 idle_side 시트 — 발록 피격만 286px·발 +15px 로 튀던 것
 const A={enemies:{amob:{...TEST.enemies.tmob,idle:[{...I0,path:'assets/test/amob-idle.webp'}],sheets:{idle_side:{path:'assets/r1377/amob/idle_side6.webp',n:6}}}}};
 const c=world({data:A}),e=mk('amob');idle(c,e);e.hitTimer=.12;e.__art={path:'assets/test/amob-hit.webp',rect:[0,0,300,300]};const h=draw(c,e);
 ok(SH(h)==='idle_side','hurt without hit_side sheet → idle_side sheet, not engine hit art ('+h.sourcePath+')');e.hitTimer=0;}
{// ⑨ 처음 본 몹은 표의 시트를 모두 미리 부른다(첫 위·아래 공격이 엔진 그림으로 새지 않게)
 const c=world({ready:false}),e=mk('tmob');draw(c,e);const A=run(c,'__added');for(const S of Object.values(TEST.enemies.tmob.sheets))ok(A.includes(S.path),'preloaded '+S.path);}
{// ⑥ 실제 표 규격·자산
 const c=world({data:null}),T=c.__STORYWORLD_MOB_DIR_ART_R1377_DATA__;ok(T&&typeof T.enemies==='object','real table loads');
 for(const [id,D] of Object.entries(T.enemies)){ok(D.cell===512&&D.foot===488&&D.cx===256&&D.vis>200&&D.vis<=470&&D.idle.length>=1,'table '+id+' cell/foot/vis');
  ok(!/ep1b06|mammon|c104-boss/i.test(id),'excluded: '+id);
  for(const I of D.idle)ok(I.rect.length===4&&I.bbox.length===4&&I.body>20&&I.body<=I.rect[3]+.5,'idle metrics '+id);
  ok(!D.block||Array.isArray(D.block)&&D.block.every(b=>typeof b==='string'&&b.length>8&&!D.idle.some(I=>I.path.includes(b))),'block list sane '+id);
  for(const [k,S] of Object.entries(D.sheets)){ok(/^(atk|walk|idle|hit)_(up|down|side)$/.test(k)&&S.n>=4&&S.n<=12,'sheet key '+id+' '+k);ok(fs.existsSync(path.join(R,'runtime-text',S.path)),'asset exists '+S.path);}}}
{// ⑥ 연결
 const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8'),a=html.indexOf('<script src="./move-dir-r974.js">'),bd=html.indexOf('<script src="./mob-dir-art-r1377-data.js">'),bm=html.indexOf('<script src="./mob-dir-art-r1377.js">');
 ok(a>0&&bd>a&&bm>bd,'tags: R974 → R1377 data → R1377 module');
 ok(/mob-dir-art-r1377\.js/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')),'public verify list');
 ok(/r96\/qa\/r1377\/dir-art-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')),'CI line');
 ok(/__STORYWORLD_MOB_DIR_ART_R1377__/.test(r974),'R974 outer draw calls the R1377 hook');}
{// ⑩ 발록(R1229 렌더 단계 크기 고정): R1377 시트 칸을 '몸 빠진 장면'으로 보고 옛 발록 그림을 한 장 더 메우면 몸이 둘 — 시트 칸을 몸으로 받아 발 기준 한 배율로
 const c=world(),e=mk('tmob');idle(c,e);run(c,'player.x=3;player.y=-20');const b=draw(c,e,1/30,e=>atk(e,.2));
 ok(SH(b)==='atk_up'&&Number.isFinite(b.r1377Vis)&&b.r1377Vis>0&&Array.isArray(b.r1377Foot)&&b.r1377Foot.every(Number.isFinite),'swapped cell carries its body height and foot for later passes');
 const P=placed(b,TEST.enemies.tmob);ok(Math.abs(P.vis/b.r1377Vis-1)<.01&&Math.abs(P.foot-b.r1377Foot[1])<.5,'carried height/foot = placed body');
 const FX=fs.readFileSync(path.join(R,'client-source','motion-fx-r1229.js'),'utf8'),q=[];
 const three={render(f){this.last=f;}},sb={console,Math,JSON,Object,Array,Number,String,Boolean,Error,Set,Map,WeakMap,Promise,RegExp,localStorage:{getItem:()=>null,setItem(){}},setTimeout:f=>{q.push(f);return 1;},time:0,
  room:{enemies:[]},hazards:[],projectiles:[],actorHeight:()=>60,project:(x,y)=>({x:x*30,y:y*30}),ensureImages(){},__STORYWORLD_PHASE1__:{controller:{state:{three}}}};
 sb.window=sb;sb.tick=function(){};sb.releaseImageMemory=function(){};vm.createContext(sb);vm.runInContext(FX,sb);while(q.length)q.shift()();
 const bal={id:'b1',name:'발록 · 지옥의 문지기',nativeId:'dist06-boss',hp:100,x:5,y:5};sb.room.enemies.push(bal);
 const own={kind:'enemy',id:'enemy:b1'},vis=100,foot=[300,400],pts=[[250,280],[350,280],[350,380],[250,380]];
 const s77={kind:'image',owner:own,key:'enemy:b1',r1377:true,r1377Vis:vis,r1377Foot:foot,points:pts.map(p=>p.slice()),sourcePath:'assets/r1377/dist06-boss-dist06/atk_up6.webp',sourceRect:[512,0,512,512],image:{}};
 const old={kind:'image',owner:own,key:'enemy:b1:old',points:pts.map(p=>p.slice()),sourcePath:'assets/r1337/bosses/dist06-idle6.webp',sourceRect:[0,0,732,601],image:{}};
 const cmds=[old,s77];three.render({commands:cmds});const want=2.04*60*1.66,k=want/vis;
 ok(cmds.length===1&&cmds[0]===s77,'no second Balrog body: old art dropped, nothing filled in ('+cmds.map(x=>x.sourcePath).join(',')+')');
 ok(s77.points.every((p,i)=>Math.abs(p[0]-(foot[0]+(pts[i][0]-foot[0])*k))<.01&&Math.abs(p[1]-(foot[1]+(pts[i][1]-foot[1])*k))<.01),'sheet cell scaled about its foot to the Balrog height ('+k.toFixed(3)+')');
 const again=[s77];three.render({commands:again});ok(again.length===1&&Math.abs(s77.points[0][1]-(foot[1]+(pts[0][1]-foot[1])*k))<.01,'fitted once per command');}
console.log('R1377 dir-art CPU check: '+n+' assertions passed');
