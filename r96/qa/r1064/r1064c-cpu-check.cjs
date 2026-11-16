// R1064c CPU 검사: 걷기 8칸+공격 4칸이 한 줄에 있는 시트(r374 관리자 추적견·이동문 공허잔영, r275 향로 사제 등)는 공격 그림이 있는 몹이다 → R1064 내딛기를 겹치지 않는다.
//  밤샘 실측(11-15 23:3xZ, u203·cult01): R1064 가 '줄' 열쇠로만 보아 이동문 공허잔영·최종문 공명기사에 lunge 판정(공격 칸 1024~1792 를 그리는데도). 관리자 추적견도 공격 칸 2048~2816 이 따로 있다.
//  이름이 walk·move 인 걷기 시트는 지금처럼 줄로 묶는다(붉은 하이힐 칼날·립스틱 탄환은 여전히 lunge).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const src=fs.readFileSync(path.join(R,'client-source','mob-lunge-r1064.js'),'utf8');
function world(sheet,{calmCols=[0,1,2,3,4,5,6,7],atkCols=[8,9,10,11]}={}){const C={commands:[]};
 const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,Symbol,isFinite,localStorage:{getItem:()=>null,setItem(){}}};ctx.window=ctx;vm.createContext(ctx);ctx.ctx=C;ctx.__S={sheet,calmCols,atkCols};
 vm.runInContext(`var time=0,room={id:'u205',enemies:[]},player={x:0,y:0};
  function drawEnemy(e){const atk=!!(e.attack&&!e.attack.r286Fake);const L=atk?__S.atkCols:__S.calmCols;const col=L[Math.floor(time*8)%L.length];
   const X=e.x*64,Y=e.y*32;ctx.commands.push({kind:'image',sourcePath:__S.sheet,sourceRect:[col*256,0,256,320],points:[[X-32,Y-64],[X+32,Y-64],[X+32,Y],[X-32,Y]]});}`,ctx);
 vm.runInContext(src,ctx);return ctx;}
const run=(c,s)=>vm.runInContext(s,c);const L=c=>c.__STORYWORLD_MOB_LUNGE_R1064__;
const mob=o=>({id:'m'+Math.random(),name:'관리자 추적견',x:0,y:0,hp:10,maxHp:10,spawnState:'active',combatProfile:{attackShape:{windup:.3,active:.15,recovery:.35,range:1}},...o});
let uid=1;function fight(c,e,attacks,calmT=.6){const sh=[];const dt=1/30;for(let a=0;a<attacks;a++){
 for(let t=0;t<calmT;t+=dt){run(c,`time+=${dt}`);e.attack=null;e.moving=true;c.ctx.commands.length=0;c.drawEnemy(e);}
 e.attack={elapsed:0,angle:0,id:uid++};e.moving=false;for(let t=0;t<.8;t+=dt){run(c,`time+=${dt}`);e.attack.elapsed=t;c.ctx.commands.length=0;c.drawEnemy(e);const k=c.ctx.commands[c.ctx.commands.length-1];sh.push(Math.abs((k.points[0][0]+k.points[1][0])/2/64-e.x));}
 e.attack=null;run(c,`time+=${dt}`);e.moving=true;c.ctx.commands.length=0;c.drawEnemy(e);}return sh;}
ok(L(world('x')).inspect().revision==='R1064-mob-lunge-2','revision bumped');
{// ① 한 줄 시트, 공격 칸이 따로 → art, 내딛기 없음
 for(const p of ['assets/r374/mobs/u205-e2-new.webp','assets/r374/mobs/u203-e2-mech.webp','assets/r275/mobs/censer-priest.webp']){const c=world(p),e=mob();const s=fight(c,e,4);
  ok(L(c).verdict(e)==='art','one-row sheet with own attack columns -> art: '+p);ok(Math.max(...s)<1e-9,'never shifted: '+p);}}
{// ② 이름이 walk·move 인 걷기 시트: 평소에 못 본 칸이 공격 때 나와도 걷기 그림 → lunge(지금 그대로)
 for(const p of ['assets/r380/mobs/ep1b-red-heel-blade-walk-d1.webp','assets/r92/mobs/M027-move.png']){const c=world(p),e=mob({name:'붉은 하이힐 칼날'});fight(c,e,3);ok(L(c).verdict(e)==='lunge','walk/move-named strip -> lunge: '+p);}}
{// ③ 걷기 칸만 쓰는 공격(이름 없는 시트, 유리 망령 m018) → lunge
 const c=world('assets/r410/mobs/m018.webp',{calmCols:[0,1,2,3],atkCols:[0,1,2,3]}),e=mob({name:'유리 망령'});fight(c,e,2);ok(L(c).verdict(e)==='lunge','attack reusing calm columns -> lunge');}
{// ④ 평소 그림을 덜 본 채(걷기 칸 일부만) 공격이 오면 섣불리 art 로 굳지 않는다
 const c=world('assets/r410/mobs/m018.webp',{calmCols:[0,1,2,3,4,5,6,7],atkCols:[5,6,7]}),e=mob({name:'유리 망령'});fight(c,e,1,.2);ok(L(c).verdict(e)===null,'too little calm seen: undecided');
 fight(c,e,3,.6);ok(L(c).verdict(e)==='lunge','after full walk cycle seen: lunge');}
{const w=fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8');ok(w.includes('r96/qa/r1064/r1064c-cpu-check.cjs'),'pages.yml runs this check');}
console.log('R1064c CPU check passed:',n);
