// R1064 CPU 검사: 공격 그림이 없는 몹(공격하는 동안에도 걷기·대기 그림만 그려지는 몹)에 임시 '젖힘→옆걸음→내딛기' 자리 옮김을 준다.
//  밤샘 실측(2026-11-15, 25구역 몹을 불사로 묶고 실제 공격시킴): 273종 중 11종이 공격 중에도 걷기 그림만 썼다(붉은 하이힐 칼날·립스틱 탄환·불길 속의 용 …).
//  이 몹들은 R286 분류표에선 '공격 칸 있음'으로 잡혀(뒤에 붙은 R380 등 그림 공급자가 바꿈) R286 내딛기를 못 받았다 → 그린 그림으로 판정한다.
//  정식본은 Dots CX-0112MA 공격 시트. 시트가 붙으면 공격 중 새 그림이 나오므로 저절로 'art' 가 되어 꺼진다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const F=path.join(R,'client-source','mob-lunge-r1064.js');ok(fs.existsSync(F),'mob-lunge-r1064.js exists');const src=fs.readFileSync(F,'utf8');
// 가짜 엔진: drawEnemy 는 기록기 명령(원본 경로·칸·네 점)을 남긴다. 공격 중 그림은 e.__atkArt 가 있으면 공격 칸, 없으면 걷기 칸.
function world({zone='ep1b05',r286=null}={}){const store={};const C={commands:[],drawImage(){}};
 const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,Symbol,isFinite,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);ctx.ctx=C;
 vm.runInContext(`var time=0,room={id:${JSON.stringify(zone)},enemies:[]},player={x:0,y:0};
  function drawEnemy(e){const atk=!!(e.attack&&!e.attack.r286Fake);const f=Math.floor(time*8)%4;
   const path=atk&&e.__atkArt?'assets/r92/mobs/M999-attack.png':e.__atlas?'assets/r410/mobs/m999.webp':'assets/r380/mobs/walk.webp';const sx=(e.__wide&&atk?f+4:f)*64;const sy=atk&&e.__atlas?320:0;
   const X=e.x*64,Y=e.y*32;ctx.commands.push({kind:'image',sourcePath:path,sourceRect:[sx,sy,64,64],points:[[X-32,Y-64],[X+32,Y-64],[X+32,Y],[X-32,Y]]});
   ctx.commands.push({kind:'image',sourcePath:'assets/pixelfx/ring.png',sourceRect:[0,0,8,8],points:[[X-80,Y-80],[X+80,Y-80],[X+80,Y],[X-80,Y]]});}`,ctx);
 if(r286)vm.runInContext(r286,ctx);
 vm.runInContext(src,ctx);return ctx;}
const run=(c,s)=>vm.runInContext(s,c);const L=c=>c.__STORYWORLD_MOB_LUNGE_R1064__;
const mob=o=>({id:'m'+Math.random(),name:'붉은 하이힐 칼날',x:0,y:0,hp:10,maxHp:10,spawnState:'active',combatProfile:{attackShape:{windup:.3,active:.15,recovery:.35,range:1}},...o});
const body=c=>{const B=c.ctx.commands.filter(k=>!/pixelfx/.test(k.sourcePath));return B[B.length-1];};
const cx=k=>(k.points[0][0]+k.points[1][0])/2,cy=k=>k.points[3][1];
// dt 마다 그린다. 공격 하나 = 0.8초(엔진 공격 시간), 그 사이 0.6초 걷기
let uid=1;
function fight(c,e,attacks,{dt=1/30}={}){const shifts=[];for(let a=0;a<attacks;a++){
  for(let t=0;t<.6;t+=dt){run(c,`time+=${dt}`);e.attack=null;e.moving=true;e.x+=.02;c.ctx.commands.length=0;c.drawEnemy(e);}
  e.attack={elapsed:0,angle:0,committed:false,id:uid++};e.moving=false;
  for(let t=0;t<.8;t+=dt){run(c,`time+=${dt}`);e.attack.elapsed=t;const x0=e.x,y0=e.y;c.ctx.commands.length=0;c.drawEnemy(e);ok(e.x===x0&&e.y===y0,'enemy position restored after draw');const k=body(c);shifts.push(Math.hypot(cx(k)/64-x0,cy(k)/32-y0));}
  e.attack=null;run(c,`time+=${dt}`);e.moving=true;c.ctx.commands.length=0;c.drawEnemy(e);}return shifts;}
{// ① 공격 그림 없는 몹 → 두 번 공격을 보고 'lunge', 그 뒤 공격 동안 몸 그림이 자리를 옮긴다
 const c=world(),e=mob();ok(typeof L(c)?.verdict==='function'&&typeof L(c)?.inspect==='function','API verdict/inspect');
 const s1=fight(c,e,1);ok(L(c).verdict(e)===null,'one attack seen: undecided');ok(Math.max(...s1)<1e-9,'undecided: no shift');
 fight(c,e,1);ok(L(c).verdict(e)==='lunge','attack drew only walk frames twice -> lunge');
 const s3=fight(c,e,1);const mx=Math.max(...s3);ok(mx>.15&&mx<=.6,'lunge shifts body during attack (max '+mx.toFixed(3)+' tiles, <= .6)');
 ok(s3[0]<.02&&s3[s3.length-1]<.06,'lunge starts and ends near home (no pop)');ok(L(c).inspect().stats.lunges>=1,'stats.lunges counted');
 // 공격 아닐 때는 그대로
 run(c,'time+=.1');e.attack=null;c.ctx.commands.length=0;c.drawEnemy(e);const k=body(c);ok(Math.abs(cx(k)/64-e.x)<1e-9,'no shift when not attacking');}
{// ② 공격 그림이 따로 있는 몹 → 'art', 손대지 않음
 const c=world(),e=mob({name:'시간수문장 07',__atkArt:true});const s=fight(c,e,3);ok(L(c).verdict(e)==='art','distinct attack frame -> art');ok(Math.max(...s)<1e-9,'art mob never shifted');}
{// ②b 아틀라스(한 장에 걷기 줄·공격 줄): 공격 줄은 다른 그림 → art / 가로 걷기 시트에서 평소에 못 본 칸이 공격 때 나와도 같은 시트 → lunge
 const c=world(),e=mob({name:'개와 늑대의 시간',__atlas:true});const s=fight(c,e,3);ok(L(c).verdict(e)==='art'&&Math.max(...s)<1e-9,'atlas attack row -> art');
 const c2=world(),e2=mob({__wide:true});fight(c2,e2,2);ok(L(c2).verdict(e2)==='lunge','walk-strip frames unseen while calm still count as walk art -> lunge');}
{// ③ 보스·중간보스·페르소나·병원·고정형은 손대지 않음(R620·R51~R53 몫)
 for(const [z,o,m] of [['ep1b05',{boss:true},'boss'],['ep1b05',{midboss:true},'midboss'],['ep1b05',{persona:true},'persona'],['ep1a08',{},'hospital ep1a08'],['ep1b05',{stationary:true},'stationary']]){
  const c=world({zone:z}),e=mob(o);const s=fight(c,e,3);ok(L(c).verdict(e)===null&&Math.max(...s)<1e-9,m+': not judged, not shifted');}}
{// ④ R286 이 이미 내딛기를 주는 몹(move-only·static·idle-only)은 겹쳐 하지 않음
 const r286=`window.__STORYWORLD_MOB_MOTION_R286__={kindOf:e=>e.__k||'full',lungeOffset:(t,sh,a,side)=>[0,0]};`;
 for(const k of ['move-only','static','idle-only']){const c=world({r286}),e=mob({__k:k});const s=fight(c,e,3);ok(Math.max(...s)<1e-9,'R286 '+k+': left to R286');}
 // R286 의 lungeOffset 이 있으면 그 모양을 그대로 쓴다(같은 몸짓)
 const r286b=`window.__STORYWORLD_MOB_MOTION_R286__={kindOf:e=>'full',lungeOffset:(t,sh,a,side)=>[.2,.1]};`;
 const c=world({r286:r286b}),e=mob();fight(c,e,2);const s=fight(c,e,1);ok(Math.abs(Math.max(...s)-Math.hypot(.2,.1))<.01,'uses R286 lungeOffset shape when present');
 // 이상한 값(NaN·너무 큼)은 버린다
 const r286c=`window.__STORYWORLD_MOB_MOTION_R286__={kindOf:e=>'full',lungeOffset:(t,sh,a,side)=>[NaN,5]};`;
 const c2=world({r286:r286c}),e2=mob();fight(c2,e2,2);const s2=fight(c2,e2,1);ok(s2.every(Number.isFinite)&&Math.max(...s2)<=.6+1e-9,'NaN/huge offsets rejected or clamped');}
{// ④b R1064b: R380 시트에 공격 칸이 여럿이면(같은 줄 시트라도) 진짜 공격 그림 → 손대지 않음
 const r380=`window.__STORYWORLD_APPROVED_MOBS_R380__={assign:e=>e.__r380||null};`;
 const c=world({r286:r380}),e=mob({__r380:{id:'purple-eggkeeper-v1',move:[0,1,2,3],attack:[4,5,6,7]}});const s=fight(c,e,3);ok(Math.max(...s)<1e-9&&L(c).verdict(e)===null,'R380 sheet with attack cells: not judged, not shifted');
 const c2=world({r286:r380}),e2=mob({__r380:{id:'red-heel',move:[0,1,2],attack:[0]}});fight(c2,e2,2);ok(L(c2).verdict(e2)==='lunge','R380 sheet with 1 attack cell: still eligible');}
{// ⑤ 끄기
 const c=world(),e=mob();fight(c,e,2);L(c).set(false);const s=fight(c,e,1);ok(Math.max(...s)<1e-9,'set(false): off');ok(c.localStorage.getItem('storyworld.r1064.moblunge')!==null,'pref saved');}
{// ⑤b R286 분류가 R380 승인 시트 칸 수를 먼저 본다(알집지기 공격 4칸이 가려지던 것)
 const r286=fs.readFileSync(path.join(R,'client-source','mob-motion-r286.js'),'utf8');const i=r286.indexOf('function kindNow');const j=r286.indexOf('const kinds=new WeakMap');
 const body=r286.slice(i,j);ok(/__STORYWORLD_APPROVED_MOBS_R380__/.test(body)&&body.indexOf('APPROVED_MOBS_R380')<body.indexOf('DRIVE_ART_R105'),'R286 kindNow checks R380 sheet before R105/R109 tables');
 ok(/new Set\(m\.attack\)\.size>1/.test(body),'single attack cell sheet counts as no attack art');}
{// ⑥ 빌드 연결
 const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');ok(html.split('"./mob-lunge-r1064.js"').length===2,'script tag once');
 ok(html.indexOf('boss-motion-r620.js')<html.indexOf('mob-lunge-r1064.js')&&html.indexOf('mob-lunge-r1064.js')<html.indexOf('combat-r118.js'),'after boss-motion-r620, before combat-r118');
 ok(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes('mob-lunge-r1064.js'),'runtime-inputs lists it');
 ok(fs.readFileSync(path.join(R,'../scripts/verify-r96-public.py'),'utf8').includes('mob-lunge-r1064.js'),'public verify list');
 ok(fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8').includes('r96/qa/r1064/r1064-cpu-check.cjs'),'pages.yml runs this check');}
console.log('R1064 CPU check passed:',n);
