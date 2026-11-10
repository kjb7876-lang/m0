// R620 CPU 검사: 보스·중간보스 몸 움직임 보간(boss-motion-r620.js).
//  대기 숨쉬기 · 걷기 출렁임/기울기 · 걷는 중 공격 자세 끼어듦 막기 · 공격 준비→내딛기 · 피격 밀림 · 열쇠 자세 교차 보간 · 체력바/일반 몹/마몬/끄기 제외 · 경계값.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const F=path.join(R,'client-source','boss-motion-r620.js');ok(fs.existsSync(F),'boss-motion-r620.js exists');const src=fs.readFileSync(F,'utf8');
const IMG=k=>({src:'http://x/m0/assets/r104/bosses/mb-dist01-p'+k+'.webp',k});
function world({store={},roomId='dist01'}={}){const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,Symbol,isFinite,performance:{now:()=>0},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);
 ctx.__IMG=IMG;
 vm.runInContext(`var time=0,room={id:${JSON.stringify(roomId)},enemies:[]},player={x:0,y:0},ctx={commands:[]};
  const __cache={};function readyImage(p){const m=/-p([1-4])\\./.exec(p);return m?{ready:true,image:__IMG(+m[1])}:null;}
  // 엔진 몸: 발밑(100,200), 키 100. 공격이면 경과 시간으로 열쇠 자세, 걷기 중 p1 이 끼어드는 상황은 e.__pose 로 강제.
  function drawEnemy(e){const k=e.__pose?e.__pose(time):(e.attack?(e.attack.elapsed<.35?1:e.attack.elapsed<.5?2:3):4);const im=__IMG(k);
   ctx.commands.push({kind:'image',owner:{kind:'enemy'},image:im,sourcePath:'assets/r104/bosses/mb-dist01-p'+k+'.webp',sourceRect:[0,0,477,447],style:{globalAlpha:1},points:[[50,100],[150,100],[150,200],[50,200]]});
   ctx.commands.push({kind:'fill',owner:{kind:'enemy'},style:{fillStyle:'#f00'},paths:[{points:[[80,205],[120,205],[120,208],[80,208]]}]});}`,ctx);
 vm.runInContext(src,ctx);return ctx;}
const run=(c,s)=>vm.runInContext(s,c);
const API=c=>c.__STORYWORLD_BOSS_MOTION_R620__;
// dt 마다 그리고, 마지막 몸 명령(유령 제외)·전체 명령을 돌려준다
function frames(c,e,secs,{dt=1/30,step=null}={}){const out=[];for(let t=0;t<secs-1e-9;t+=dt){run(c,`time+=${dt}`);if(step)step(e,t);run(c,'ctx.commands.length=0');c.drawEnemy(e);const cm=run(c,'ctx.commands');const body=cm.find(k=>k.kind==='image'&&!k.r620Ghost);out.push({body:JSON.parse(JSON.stringify(body.points)),src:body.sourcePath,ghost:cm.filter(k=>k.r620Ghost).map(k=>({src:k.sourcePath,a:k.style.globalAlpha})),bar:JSON.parse(JSON.stringify(cm.find(k=>k.kind==='fill').paths[0].points))});}return out;}
const H=f=>f.body[3][1]-f.body[0][1],TOPX=f=>(f.body[0][0]+f.body[1][0])/2,FOOT=f=>[(f.body[2][0]+f.body[3][0])/2,(f.body[2][1]+f.body[3][1])/2];
const range=a=>Math.max(...a)-Math.min(...a);
const boss=o=>({id:'b',nativeId:'mb-dist01',name:'보라검천사',boss:false,midboss:true,x:3,y:3,hp:100,hitTimer:0,...o});
ok(typeof API(world())?.inspect==='function','API inspect');
{// 대기: 발은 그대로, 키가 숨쉬듯 오르내림(±1~3%), 튀지 않음
 const c=world(),e=boss();const L=frames(c,e,4);const hs=L.slice(10).map(H);
 ok(range(hs)>=1.5&&range(hs)<=6,'idle breathing height range 1.5..6px ('+range(hs).toFixed(2)+')');
 ok(L.slice(10).every(f=>Math.abs(FOOT(f)[0]-100)<.6&&Math.abs(FOOT(f)[1]-200)<.6),'idle: foot stays planted');
 let jump=0;for(let i=11;i<L.length;i++)jump=Math.max(jump,Math.abs(H(L[i])-H(L[i-1])));ok(jump<.6,'idle: no frame-to-frame jump ('+jump.toFixed(3)+')');}
{// 걷기: 위로 출렁임 + 가는 쪽 기울기, 오른쪽/왼쪽 반대
 const c=world(),e=boss();const R1=frames(c,e,2,{step:(e)=>{e.x+=.05;}});
 const lifts=R1.slice(15).map(f=>FOOT(f)[1]);ok(range(lifts)>=1.5,'walk: body bobs ('+range(lifts).toFixed(2)+'px)');
 const leanR=R1.slice(15).map(f=>TOPX(f)-FOOT(f)[0]);ok(leanR.reduce((a,b)=>a+b,0)/leanR.length>1,'walk right (screen): leans right');
 const c2=world(),e2=boss();const L2=frames(c2,e2,2,{step:(e)=>{e.x-=.05;}});const leanL=L2.slice(15).map(f=>TOPX(f)-FOOT(f)[0]);ok(leanL.reduce((a,b)=>a+b,0)/leanL.length<-1,'walk left: leans left');
 // 멈추면 기울기가 부드럽게 0 쪽으로
 const S=frames(c,e,1);ok(Math.abs(TOPX(S[S.length-1])-FOOT(S[S.length-1])[0])<1.5,'stopped: lean fades out');}
{// 걷는 중 공격 자세(p1~p3)가 끼어들면 p4 로 둔다. 공격 중에는 그대로.
 const c=world(),e=boss({__pose:t=>Math.floor(t*10)%2?1:4});const L=frames(c,e,1.5,{step:(e)=>{e.x+=.05;}});
 ok(L.slice(15).every(f=>/-p4\./.test(f.src)),'walking: stray attack key poses held to p4');
 const c2=world(),e2=boss({__pose:t=>Math.floor(t*10)%2?1:4});const S=frames(c2,e2,1);ok(S.some(f=>/-p1\./.test(f.src)),'standing (not walking): native pose choice untouched');}
{// 공격: 준비 동안 웅크림(키 줄어듦), 타격 직후 영웅 쪽으로 내딛기, 교차 보간 유령 0.09초
 const c=world(),e=boss({x:3,y:3});run(c,'player.x=6;player.y=3');frames(c,e,.5);
 e.attack={elapsed:0,angle:0,shape154:{windup:.35}};const L=frames(c,e,.9,{step:(e)=>{e.attack.elapsed+=1/30;}});
 const h0=H(frames(world(),boss(),.05)[0]);const pre=L.filter((f,i)=>i>=6&&i<=9);ok(pre.every(f=>H(f)<h0-1),'anticipation: crouch (height '+H(pre[0]).toFixed(1)+' < '+h0+')');
 const strike=L.slice(12,16);ok(strike.some(f=>FOOT(f)[0]>100+3),'strike: steps toward hero (+x)');
 ok(L.some(f=>f.ghost.length===1),'pose change: ghost of previous pose drawn');
 const gi=L.findIndex(f=>f.ghost.length);let ge=gi;while(ge<L.length&&L[ge].ghost.length)ge++;const g=L.slice(gi,ge);ok(L.filter(f=>f.ghost.length).length<=12,'ghosts only around the 3 pose changes');ok(g.length>=2&&g.length<=4,'ghost lasts ~0.09s ('+g.length+' frames)');ok(g[0].ghost[0].a>g[g.length-1].ghost[0].a,'ghost fades out');ok(g[0].ghost[0].src!==g[0].src,'ghost is the previous pose');
 const c2=world(),e2=boss({x:3,y:3});run(c2,'player.x=0;player.y=3');frames(c2,e2,.5);e2.attack={elapsed:0,angle:Math.PI,shape154:{windup:.35}};const L2=frames(c2,e2,.9,{step:(e)=>{e.attack.elapsed+=1/30;}});ok(L2.slice(12,16).some(f=>FOOT(f)[0]<100-3),'strike toward hero on the left: steps -x');}
{// 피격: 영웅 반대쪽으로 밀렸다 돌아옴
 const c=world(),e=boss({x:3,y:3});run(c,'player.x=6;player.y=3');frames(c,e,.5);e.hitTimer=.14;const L=frames(c,e,.6,{step:(e)=>{e.hitTimer=Math.max(0,e.hitTimer-1/30);}});
 ok(Math.min(...L.slice(0,6).map(f=>FOOT(f)[0]))<100-2,'hit: knocked away from hero (-x)');ok(Math.abs(FOOT(L[L.length-1])[0]-100)<.8,'hit: returns to place');ok(API(c).inspect().stats.hits===1,'one hit counted');}
{// 제외: 체력바 그대로, 일반 몹·마몬·체력 0·끄기
 const c=world(),e=boss();const L=frames(c,e,1);ok(L.every(f=>JSON.stringify(f.bar)===JSON.stringify([[80,205],[120,205],[120,208],[80,208]])),'health bar untouched');
 const m=boss({midboss:false});const Lm=frames(world(),m,1);ok(Lm.every(f=>H(f)===100&&TOPX(f)===100),'normal mob untouched');
 const cm=world({roomId:'mammon-room'}),em=boss();const Lmm=frames(cm,em,1);ok(Lmm.every(f=>H(f)===100),'mammon room untouched');
 const d=boss({hp:0});const Ld=frames(world(),d,.5);ok(Ld.every(f=>H(f)===100),'dead boss untouched');
 const co=world({store:{'storyworld.r620.bossmotion':'{"on":false}'}}),eo=boss();const Lo=frames(co,eo,1);ok(Lo.every(f=>H(f)===100),'off switch: untouched');
 const cb=world(),eb=boss({boss:true,midboss:false,persona:false});const Lb=frames(cb,eb,2);ok(range(Lb.slice(10).map(H))>=1.5,'main boss also breathes');}
{// 경계값: dt 0(같은 시간 두 번 그리기)·큰 dt 에서도 값이 유한하고 몸이 뒤집히지 않음
 const c=world(),e=boss();frames(c,e,.3);run(c,'ctx.commands.length=0');c.drawEnemy(e);c.drawEnemy(e);run(c,'time+=5');run(c,'ctx.commands.length=0');c.drawEnemy(e);const b=run(c,'ctx.commands').find(k=>k.kind==='image'&&!k.r620Ghost);
 ok(b.points.flat().every(Number.isFinite),'finite points after dt=0 and dt=5');ok(b.points[3][1]-b.points[0][1]>80,'not flipped/collapsed');ok(API(c).inspect().stats.errors===0,'no errors');}
{// 연결: 스크립트 태그 한 번(R613 뒤, combat-r118 앞), runtime-inputs·공개 검증 목록·Pages CPU 검사
 const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');ok(html.split('"./boss-motion-r620.js"').length===2,'script tag once');ok(html.indexOf('mob-gait-r613.js')<html.indexOf('boss-motion-r620.js')&&html.indexOf('boss-motion-r620.js')<html.indexOf('combat-r118.js'),'after mob-gait-r613, before combat-r118');
 ok(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes('boss-motion-r620.js'),'runtime-inputs lists it');
 ok(fs.readFileSync(path.join(R,'../scripts/verify-r96-public.py'),'utf8').includes('boss-motion-r620.js'),'public verify list');
 ok(fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8').includes('qa/r620/r620-cpu-check.cjs'),'pages.yml runs this check');
 // 늦게 감싸기: setTimeout 이 있으면 스크립트가 다 실린 뒤 맨 바깥에서 한 번만
 const q=[];const c2={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,Symbol,isFinite,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}},setTimeout:f=>q.push(f)};c2.window=c2;vm.createContext(c2);vm.runInContext('var time=0,room={id:"x"},player={x:0,y:0},ctx={commands:[]};function drawEnemy(){}',c2);vm.runInContext(src,c2);
 ok(c2.__STORYWORLD_BOSS_MOTION_R620__.inspect().installed===false&&q.length===1,'deferred install queued');vm.runInContext('var __late=drawEnemy;drawEnemy=function(e){return __late(e);}',c2);const late=c2.drawEnemy;q[0]();ok(c2.__STORYWORLD_BOSS_MOTION_R620__.inspect().installed&&c2.drawEnemy!==late,'wraps outside a later wrapper');q.length=0;}
console.log('R620 boss-motion CPU check: '+n+' ok');
