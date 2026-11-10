// R596 — 사용자 2026-11-10 "아직 원같은게 남아있는 문제, 분수대 아래 단순한 원형 그림자(사실적이지 않음)" + "이런 예고선이 아직도 나오는 문제".
//  ① 피의 육망성 조형물(R170 탑) 소환 균열 문(반복 시트 pvfx-rift-portal)이 끝 시간(until)·옅어짐(fade)과 함께 불리고, 모든 반복 시트 호출에 until 이 있다.
//  ② 탑(분수대처럼 보이는 corrupted_shrine 등)은 엔진 둥근 그림자 shadow() 대신 자기 실루엣 그림자(왼쪽 위 광원 → 오른쪽 바닥으로 눕힘)를 그린다.
//  ③ 적 공격 바닥 예고(warning·flight)·R52 돌진 길은 예고 꺼짐(기본)에서 그리지 않는다. ④ 일반 몹 발밑 체력 줄(짧은 검붉은 가로 선)은 머리 위로 올린다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
for(const f of ['pixelfx-r163.js','combat-r170.js','combat-flow-r425.js']){ok(f+' runtime copy matches client source',RT(f)===C(f));try{new vm.Script(C(f));ok(f+' syntax',true);}catch(e){ok(f+' syntax '+e.message,false);}}
const r170=C('combat-r170.js');
// ① 균열 문
ok('R170 rift portal call has until + fade',/X\.play\('pvfx-rift-portal',m\.x,m\.y,\{[^}]*until:T\(\)\+[\d.]+,fade:[\d.]+/.test(r170));
const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text','assets','r163','pixelfx','index.json'),'utf8')).effects;
ok('rift portal sheet is a loop sheet (why until is needed)',idx['pvfx-rift-portal']?.loop===true);
const loops=Object.keys(idx).filter(k=>idx[k].loop);const files=fs.readdirSync(path.join(R,'client-source')).filter(f=>f.endsWith('.js'));const missing=[];
for(const f of files){const s=C(f);for(const k of loops){const re=new RegExp("play\\('"+k.replace(/[-]/g,'\\-')+"',[^;]*?\\{([^}]*)\\}","g");let m;while((m=re.exec(s))){if(!/until:/.test(m[1])&&!/loop:false/.test(m[1]))missing.push(f+':'+k);}}}
ok('every loop-sheet play() passes until (or loop:false): '+(missing.join(',')||'none missing'),missing.length===0);
{const g={console,localStorage:{getItem:()=>null,setItem:()=>{}},fetch:()=>({then:f=>({then:h=>{h({effects:idx});return{catch:()=>{}};},catch:()=>{}})}),time:0,effects:[],Promise,Date,Math,JSON,Number,Map,document:{createElement:()=>({getContext:()=>null})}};
 g.window=g;g.actorHeight=()=>60;g.project=(x,y)=>({x:x*10,y:y*10});g.readyImage=()=>({image:{width:960,height:768,naturalWidth:960,naturalHeight:768}});
 const alphas=[];g.ctx={save(){},restore(){},translate(){},scale(){},drawImage(){alphas.push(this.globalAlpha);},globalAlpha:1};
 g.drawEffect=function(){};g.tick=function(){};g.enterRegion=async function(){};vm.createContext(g);vm.runInContext(C('pixelfx-r163.js'),g);
 const X=g.__STORYWORLD_PIXELFX_R163__;g.time=10;X.play('pvfx-rift-portal',1,1,{k:.75,until:g.time+1.6,fade:.5});
 const drawAt=t=>{g.time=t;g.ctx.globalAlpha=1;alphas.length=0;g.drawEffect({type:'r163-pixelfx'});return alphas[0];};
 ok('rift drawn at full alpha before fade',Math.abs(drawAt(10.5)-1)<1e-9);const a=drawAt(11.35);ok('rift fading in last .5 s (alpha '+(a?.toFixed?.(2))+')',a>0.4&&a<0.6);
 ok('boundary: alpha 0 exactly at until',drawAt(11.6)===0||drawAt(11.6)===undefined);
 g.time=11.7;g.tick(1/60);ok('rift removed after until',X.inspect().active.length===0);
 g.time=20;X.play('pvfx-rift-portal',1,1,{k:.75});g.time=60;g.tick(1/60);ok('control: loop sheet without until stays (old bug mechanism)',X.inspect().active.length===1);}
// ② 탑 그림자
/* 탑 그리기와 그 바로 위 보조 함수(있으면)까지 떼어 가짜 전역에서 돌린다 */const m=r170.match(/(?:const TS_LEN[\s\S]*?)?function drawTower\(e\)\{[\s\S]*?stats\.towerDraws\+\+;\}/);ok('drawTower found',!!m);
function runTower(o={}){const log=[];let tf={a:1,d:1,e:0,f:0};const stack=[];/* 회전 없는 아핀: 화면 = (a·x+e, d·y+f) */
 const ctx={globalAlpha:1,save(){stack.push({a:this.globalAlpha,tf:{...tf}});},restore(){const s=stack.pop();if(s){this.globalAlpha=s.a;tf=s.tf;}},translate(x,y){tf.e+=tf.a*x;tf.f+=tf.d*y;},scale(x,y){tf.a*=x;tf.d*=y;},fillRect(){},set fillStyle(v){},scope(meta,f){log.push({k:'scope',meta});f();}};
 const g={Math,JSON,Number,String,console,ctx,zoom:1,time:o.time??5,stats:{towerDraws:0},
  T:()=>g.time,SPR:()=>({draw:(kind,pal,x,y,w,h,opt)=>log.push({k:'spr:'+kind,y,w,h,opt})}),palOf:()=>({main:{a:[1,1,1],b:[2,2,2]}}),project:(x,y)=>({x:x*10,y:y*10}),readyImage:o.noImage?()=>null:()=>({image:{naturalWidth:512,naturalHeight:512}}),
  shadow:(...a)=>log.push({k:'shadow',a}),sprite:(p,x,y,h,opt)=>log.push({k:'sprite',p,x,y,h,opt:{...opt},alpha:ctx.globalAlpha,foot:[tf.a*x+tf.e,tf.d*y+tf.f],sy:tf.d}),window:{}};
 g.window=g;vm.createContext(g);vm.runInContext(m[0]+';this.drawTower=drawTower;',g);
 const e={x:10,y:10,hp:o.hp??50,maxHp:100,flash:0,deadAt:o.deadAt,r170Tower:{art:'assets/props/v290/corrupted_shrine.webp',h:200,next:o.next??99}};g.drawTower(e);return log;}
if(m){const L=runTower();const sh=L.filter(c=>c.k==='shadow'),sp=L.filter(c=>c.k==='sprite'),dark=sp.filter(c=>/brightness\(0\)/.test(c.opt.filter||'')),body=sp.filter(c=>!/brightness\(0\)/.test(c.opt.filter||''));
 ok('no engine round shadow() under tower (was '+sh.length+')',sh.length===0);
 ok('silhouette shadow: >=2 dark copies of the same art ('+dark.length+')',dark.length>=2&&dark.every(c=>c.p===body[0]?.p));
 ok('tower body drawn exactly once, after its shadow',body.length===1&&sp.indexOf(body[0])>sp.indexOf(dark.at(-1)));
 ok('shadow lies flat (y squashed <=.6) and leans right (light top-left)',dark.length&&dark.every(c=>c.sy<=.6&&c.foot[0]>100+1));
 ok('shadow foot stays on/just behind the tower foot, never forward',dark.length&&dark.every(c=>c.foot[1]<=100+1e-6&&c.foot[1]>=100-200*.1));
 ok('shadow is soft (each copy alpha < .35)',dark.length&&dark.every(c=>(c.opt.alpha??1)*c.alpha<.35));
 const D=runTower({hp:0,deadAt:4.5,time:5});const dd=D.filter(c=>c.k==='sprite'&&/brightness\(0\)/.test(c.opt.filter||''));
 ok('dying tower: shadow fades with it',dd.length>0&&dd.every(c=>c.alpha<=.5+1e-9));
 ok('dead >1 s: nothing drawn',runTower({hp:0,deadAt:3,time:5}).filter(c=>c.k==='sprite'||c.k==='shadow').length===0);
 const flat=c=>c.k==='spr:glow'&&c.h<c.w*.6&&c.y>=100-200*.2;/* 발밑에 납작하게 깐 타원 빛무리 = 화면에서 둥근 그림자 얼룩으로 읽힘 */
 ok('idle tower: no flat round blob under the base ('+L.filter(flat).length+')',L.filter(flat).length===0);
 const Ch=runTower({next:5.65,time:5});ok('charging tower: base glow comes back as the cast cue',Ch.filter(flat).length===1&&Ch.find(flat).opt.alpha>0);
 ok('image not ready: no shadow, no body',runTower({noImage:true}).filter(c=>c.k==='sprite'||c.k==='shadow').length===0);}
// ③ 바닥 예고
{const src=C('combat-flow-r425.js');ok('R52 lane stroke colour in TELE_WORLD',/'rgba\(211,193,151,\.72\)'/.test(src));
 const mm=src.match(/if\(typeof drawNativeGroundArt154==='function'\)\{[\s\S]*?\};\}/);ok('ground-art wrapper present',!!mm);
 if(mm){const calls=[];const g={stats:{},prefs:{tele:false},solo:()=>true,drawNativeGroundArt154:(p,r,gg,a,stage)=>{calls.push(stage);return true;}};vm.createContext(g);vm.runInContext(mm[0],g);
  const res=['warning','flight','active','recovery','confirmed-contact'].map(s=>g.drawNativeGroundArt154('x',null,{},.2,s));
  ok('tele off: warning/flight not drawn, active/recovery/contact drawn',JSON.stringify(calls)==='["active","recovery","confirmed-contact"]'&&res[0]===false&&res[1]===false);
  calls.length=0;g.prefs.tele=true;g.drawNativeGroundArt154('x',null,{},.2,'warning');ok('tele on: warning drawn (setting restores)',calls.length===1);}}
// ④ 일반 몹 체력 줄: R90 '절제된 체력 표시'가 발밑(q.y 근처)에 2px 검붉은 가로 선으로 그려 바닥 예고선처럼 읽혔다 → R425 머리 위 체력 줄을 일반 몹에도.
{const src=C('combat-flow-r425.js');const mm=src.match(/function wantHeadBar\(e,ex\)\{[\s\S]*?\n/);ok('wantHeadBar() present',!!mm);
 if(mm){const g={prefs:{bossBar:true,mobBar:true},enr:e=>!!e.enr};vm.createContext(g);vm.runInContext(mm[0]+';this.f=wantHeadBar;',g);const f=g.f;
  ok('damaged normal mob: bar goes over head',f({hp:3,maxHp:10},false)===true);
  ok('midboss (not boss) also over head',f({hp:3,maxHp:10,midboss:true},false)===true);
  ok('enraged boss still over head (regression)',f({hp:3,maxHp:10,boss:true,enr:1},false)===true);
  ok('calm boss: unchanged (big boss bar stays native)',f({hp:3,maxHp:10,boss:true},false)===false);
  ok('excluded (tower/doll/mammon): never moved',f({hp:3,maxHp:10},true)===false);
  ok('dead mob: not moved',f({hp:0,maxHp:10},false)===false);
  g.prefs.mobBar=false;ok('setting off restores feet bar',f({hp:3,maxHp:10},false)===false);g.prefs.mobBar=true;g.prefs.bossBar=false;ok('bossBar off still lets enraged boss stay native',f({hp:3,maxHp:10,boss:true,enr:1},false)===false);}
 ok('drawEnemy wrapper uses wantHeadBar',/headBar=wantHeadBar\(e,ex\)/.test(src));}
console.log(JSON.stringify({ok:bad===0,checks:n,failed:bad}));process.exit(bad?1:0);
