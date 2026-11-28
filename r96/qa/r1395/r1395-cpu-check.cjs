// R1395 CPU 검사: 2D 전면 재설계 몹(표 full=1)은 새 시트에 대기·피격이 없어도 옛 엔진 그림을 보이지 않는다.
//  사용자 2026-11-28 "영웅제외하고 모든몹 2d로 … 원점부터 재설계해서 2d일관성 높게", "상하옆 … 공격과이동모션은 필수이고 일관성이 중요해 피격및사망대기등도 있으면좋고".
//  Dots QA(SW-2D-R1395): 필수 6장(walk·atk × side·up·down)만 오면 R1377 선택기가 대기·첫 피격에 옛 원화를 고른다 → 같은 배우 새 시트의 중립 칸을 같은 크기·발 줄로.
//  ① full 몹이 서 있으면 walk_side 0칸(중립)을 엔진 대기 그림과 같은 몸 키·발 줄로, 좌우는 R444 얼굴 방향.
//  ② full 몹이 맞으면(hit 시트 없음) 같은 중립 칸 — 엔진 피격 그림 아님.
//  ③ idle_side·hit_side 시트가 있으면 그 시트가 먼저.
//  ④ full 이 아닌 R1377 몹은 지금 그대로(서 있을 때 엔진 그림).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};const rd=p=>fs.readFileSync(path.join(R,p),'utf8');
const src=rd('client-source/mob-dir-art-r1377.js'),r974=rd('client-source/move-dir-r974.js'),r974d=rd('client-source/move-dir-r974-data.js');
const SH=(k,nn)=>({path:'assets/r1395/test/'+k+nn+'.webp',n:nn,feet:Array(nn).fill(488)});
function entry(full,extra={}){const sheets={walk_side:SH('walk_side',6),walk_up:SH('walk_up',4),walk_down:SH('walk_down',4),atk_side:SH('atk_side',6),atk_up:SH('atk_up',6),atk_down:SH('atk_down',6),...extra};
 return {cell:512,foot:488,cx:256,vis:340,idle:[{path:'assets/test/donor-NID.webp',rect:[0,0,200,400],body:300,bbox:[0,0,200,350]}],sheets,...(full?{full:1}:{})};}
function world({face=null,table}={}){const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,WeakSet,Set,isFinite,RegExp,performance:{now:()=>0},setTimeout:f=>{f();return 1;},localStorage:{getItem:()=>null,setItem:()=>{}}};
 ctx.window=ctx;vm.createContext(ctx);if(face)ctx.__STORYWORLD_ENEMY_FACE_R444__={left:face};
 vm.runInContext(`var time=0,room={id:'tz00',enemies:[]},player={x:3,y:3},ctx={commands:[]};
  function addImage(p){}function readyImage(p){const n=+(/(\\d+)\\.webp$/.exec(p)||[0,1])[1];return {ready:true,image:{src:'http://x/m0/'+p,naturalWidth:/r1395/.test(p)?512*n:200,naturalHeight:/r1395/.test(p)?512:400}};}
  function project(x,y){return {x:100+(x-3)*10,y:200+(y-3)*5};}
  function drawEnemy(e){const P=project(e.x,e.y),h=100,w=50,top=P.y-h*.95,L=P.x-w/2,hit=e.hitTimer>0;
   ctx.commands.push({kind:'image',key:'enemy:'+e.nativeId,owner:{kind:'enemy'},image:{src:'http://x/m0/assets/test/x.webp'},imageSize:[200,400],sourcePath:'assets/test/'+(hit?'hurt-':'donor-')+e.nativeId+'.webp',sourceRect:[0,0,200,400],style:{globalAlpha:1},points:[[L,top],[L+w,top],[L+w,top+h],[L,top+h]]});}`,ctx);
 vm.runInContext(r974d,ctx);vm.runInContext(r974,ctx);ctx.__STORYWORLD_MOB_DIR_ART_R1377_DATA__={enemies:table};vm.runInContext(src,ctx);return ctx;}
const run=(c,s)=>vm.runInContext(s,c);
function draw(c,e,dt=1/30){run(c,'time+='+dt);run(c,'ctx.commands.length=0');c.drawEnemy(e);return run(c,'ctx.commands').find(k=>/enemy:/.test(k.key||''));}
const H=k=>Math.abs(k.points[3][1]-k.points[0][1]),lr=k=>k.points[1][0]-k.points[0][0];
const mob=id=>({id:id+'#1',nativeId:id,name:'시험 몹',x:3,y:3,hp:100,maxHp:100,hitTimer:0,state:'chase'});
const fix=(D,id)=>{D.idle[0].path=D.idle[0].path.replace('NID',id);return D;};
// 엔진 대기 그림: 몸 키 100*300/400, 발 줄 = top + 100*350/400
const ENG={vis:100*300/400,foot:200-95+100*350/400};
function sameBody(k,D,f,m){const vis=H(k)*D.vis/D.cell,foot=Math.min(...k.points.map(q=>q[1]))+H(k)*488/D.cell;
 ok(Math.abs(vis/ENG.vis-1)<.02,m+' body height '+vis.toFixed(1)+' vs '+ENG.vis);ok(Math.abs(foot-ENG.foot)<1.5,m+' foot '+foot.toFixed(1)+' vs '+ENG.foot);}
for(const left of [false,true]){// ①②
 const D=fix(entry(true),'tz-full'),c=world({face:()=>left,table:{'tz-full':D}}),e=mob('tz-full');
 let k;for(let i=0;i<20;i++)k=draw(c,e);
 ok(k&&k.sourcePath==='assets/r1395/test/walk_side6.webp'&&k.sourceRect[0]===0,'① standing full mob → walk_side cell 0, got '+(k&&k.sourcePath)+' '+(k&&k.sourceRect));
 sameBody(k,D,0,'①');ok((lr(k)<0)===left,'① facing follows R444 ('+(left?'left':'right')+')');
 e.hitTimer=.1;k=draw(c,e);
 ok(k&&k.sourcePath==='assets/r1395/test/walk_side6.webp'&&k.sourceRect[0]===0,'② hurt full mob → neutral cell, got '+(k&&k.sourcePath));
 /* ② 몸 키는 회전에 안 변하는 변 길이로(⑦ 피격 젖힘 — 발 자리는 ⑦ 에서) */const side=Math.hypot(k.points[3][0]-k.points[0][0],k.points[3][1]-k.points[0][1]);
 ok(Math.abs(side*D.vis/D.cell/ENG.vis-1)<.02,'② hurt body height');ok((lr(k)<0)===left,'② hurt facing');}
{// ③ idle/hit 시트가 있으면 그게 먼저
 const D=fix(entry(true,{idle_side:SH('idle_side',4),hit_side:SH('hit_side',3)}),'tz-full2'),c=world({face:()=>false,table:{'tz-full2':D}}),e=mob('tz-full2');
 let k;for(let i=0;i<20;i++)k=draw(c,e);ok(/idle_side4/.test(k.sourcePath),'③ idle sheet first');
 e.hitTimer=.1;k=draw(c,e);ok(/hit_side3/.test(k.sourcePath),'③ hit sheet first');}
{// ④ full 아닌 몹은 그대로
 const D=fix(entry(false),'tz-old'),c=world({face:()=>false,table:{'tz-old':D}}),e=mob('tz-old');
 let k;for(let i=0;i<20;i++)k=draw(c,e);ok(k.sourcePath==='assets/test/donor-tz-old.webp','④ non-full standing keeps engine art');}
{// ⑥⑦⑧ 7분야 QA(#1145): 대기 숨쉬기 없음·맞아도 몸 반응 없음·공격 0.3/0.7 이 비슷 → full 몹만 칸 위에 몸짓(발 줄 고정)
 const cx=k=>(k.points[0][0]+k.points[1][0]+k.points[2][0]+k.points[3][0])/4,bot=k=>(k.points[2][1]+k.points[3][1])/2,botX=k=>(k.points[2][0]+k.points[3][0])/2,topX=k=>(k.points[0][0]+k.points[1][0])/2;
 for(const left of [false,true]){const D=fix(entry(true),'tz-j'),c=world({face:()=>left,table:{'tz-j':D}}),e=mob('tz-j');
  let k,hs=[],bs=[];for(let i=0;i<90;i++){k=draw(c,e);hs.push(H(k));bs.push(bot(k));}
  const hr=Math.max(...hs)/Math.min(...hs)-1;ok(hr>.006&&hr<.04,'⑥ idle breathing body height range '+(hr*100).toFixed(2)+'%');
  ok(Math.max(...bs)-Math.min(...bs)<1.5,'⑥ breathing keeps foot line');
  const k0=draw(c,e),f0=bot(k0);e.hitTimer=.15;k=draw(c,e,0);
  const lean=topX(k)-botX(k),sg=left?-1:1;ok(lean*sg< -2,'⑦ hit leans back away from facing ('+lean.toFixed(1)+')');
  ok(Math.abs(Math.max(k.points[2][1],k.points[3][1])-f0)<12,'⑦ hit keeps feet near ground');
  e.hitTimer=0;for(let i=0;i<5;i++)k=draw(c,e);ok(Math.abs(topX(k)-botX(k))<1,'⑦ lean recovers');}
 for(const full of [true,false]){const id=full?'tz-a':'tz-a0',D=fix(entry(full),id),c=world({face:()=>false,table:{[id]:D}}),e=mob(id);run(c,'player.x=6;player.y=3');
  for(let i=0;i<20;i++)draw(c,e);const sh={windup:.3,active:.1,recovery:.3};
  e.attack={elapsed:0,shape154:sh};const kw=draw(c,e,0),xw=cx(kw);e.attack={elapsed:.35,shape154:sh};const ka=draw(c,e,0),xa=cx(ka);
  ok(/atk_side/.test(ka.sourcePath),'⑧ attack uses atk_side '+ka.sourcePath);
  if(full)ok(xa-xw>H(ka)*D.vis/D.cell*.04,'⑧ full mob lunges toward hero at hit moment '+(xa-xw).toFixed(1));
  else ok(Math.abs(xa-xw)<.5,'⑧ non-full mob unchanged '+(xa-xw).toFixed(2));}}
{// ⑤ 표(mob-2d-r1395-data.js): 지역 키·full·anyRef·필수 6장·자산·발 줄, 다른 지역의 같은 id 에는 안 번짐, 연결
 const t={};const c=world({table:t});vm.runInContext(rd('client-source/mob-2d-r1395-data.js'),c);
 const A=c.__STORYWORLD_MOB_2D_R1395__;ok(A&&A.keys.length>=4,'R1395 table installed '+(A&&A.keys));
 const need={walk_side:6,atk_side:6,walk_up:4,atk_up:6,walk_down:4,atk_down:6};
 for(const k of A.keys){const D=t[k];ok(/^[\w-]+@[\w-]+$/.test(k),'zone key '+k);ok(D.full===1&&D.anyRef===1&&D.cell===512&&D.foot===488&&D.cx===256&&D.vis>250&&D.vis<470,'metrics '+k);
  for(const [s,n] of Object.entries(need)){const S=D.sheets[s];ok(S&&S.n===n&&S.path.startsWith('assets/r1395/'),'sheet '+k+' '+s);ok(fs.existsSync(path.join(R,'runtime-text',S.path)),'asset '+S.path);
   ok(Array.isArray(S.feet)&&S.feet.length===n&&S.feet.every(v=>v>468&&v<=512),'feet '+k+' '+s);}}
 const W=c.__STORYWORLD_MOB_DIR_ART_R1377__.wants;const [k0]=A.keys,[nid,zone]=k0.split('@');
 run(c,`room.id=${JSON.stringify(zone)}`);ok(W({id:nid+'#1',nativeId:nid,x:3,y:3,hp:9}),'applies in its zone');
 run(c,"room.id='zz-other'");ok(!W({id:nid+'#1',nativeId:nid,x:3,y:3,hp:9}),'not in another zone');
 const html=rd('runtime-text/index.html'),a=html.indexOf('<script src="./samong-art-r1394-data.js">'),b=html.indexOf('<script src="./mob-2d-r1395-data.js">'),m=html.indexOf('<script src="./murder-boss-walk-r1367.js">');
 ok(a>0&&b>a&&m>b,'tag: R1394 data → R1395 data → R1367');
 ok(rd('../scripts/verify-r96-public.py').includes("'mob-2d-r1395-data.js'"),'public verify list');
 for(const f of ['mob-2d-r1395-data.js','mob-dir-art-r1377.js'])ok(rd('runtime-text/'+f)===rd('client-source/'+f),'runtime-text copy '+f);
 ok(rd('runtime-inputs.json').includes('mob-2d-r1395-data.js'),'runtime inputs');}
console.log('R1395 full-redesign fallback CPU check OK —',n,'checks');
