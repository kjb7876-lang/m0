// R1270 평타 자동 실검무 표시 제거 · 환도 발도 시트 오용 · 투사체 적중점 CPU 검사
//  (사용자 2026-11-20 05:46Z: 서하가 실검무를 배우면 평타 적중마다 환도 발도 그림이 몹 옆에 붙고, 미카엘라 하트가 탄 이동 끝점에 찍힘 → "이거 토대로 개선해줘")
//  ① R174 은색실 자동 표시: 원거리 영웅 평타 적중 때 threadSlashR63 를 만들지 않는다(피해·반환값 그대로, T 실검무·황금실 돌기는 그대로).
//  ② R1041: R106 'iai-cut' → 환도 발도 시트(H6) 교체는 환도 기술 그림에만. 실검무 베기(r111:thread-slash:*)는 원래 은빛 그림.
//  ③ R912: 아군·적 탄 적중 그림 자리 = 엔진이 계산한 충돌점(impactPoint152). 없으면 예전처럼 탄 자리.
//  ④ R111 실검무 베기 중심 = 맞은 몹의 몸통(움직이면 따라감).
//  node r96/qa/r1270/r1270-cpu-check.cjs   — 실제 화면 측정은 r1270-browser.mjs(헤드리스)
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));if(!process.env.SOFT)assert(c,m);else if(!c)process.exitCode=1;n++;if(c)console.log('PASS',m);};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
for(const f of ['hero-threads-r174.js','hero-dots-fx-r1041.js','projectile-sheets-r912.js','play-r111.js'])ok(rd('client-source/'+f)===rd('runtime-text/'+f),'runtime-text 사본과 같음: '+f);
ok(/node r96\/qa\/r1270\/r1270-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');

// ---- ① R174 ----
function loadR174({hero='seoha',rank=1,pref=null}={}){const win={};const fxs=[];
 const sb={window:win,localStorage:{getItem:k=>k==='storyworld.r174.threads'&&pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,console,
  player:{hero,x:0,y:0,hp:100},time:1,effects:[],actorHeight:()=>60};
 win.__STORYWORLD_PROGRESSION_R62__={ranks:(id)=>id==='threadDanceR63'?rank:0};
 win.__STORYWORLD_DANCES_R74__={cast:(k)=>'base-'+k,state:()=>({learned:rank>0})};
 sb.fx=function(type,x,y,o){fxs.push({type,x,y,o});return{type};};
 sb.hitEnemy=function(e,v){e.hp-=v;return true;};
 vm.createContext(sb);vm.runInContext(rd('client-source/hero-threads-r174.js'),sb);return{A:win.__STORYWORLD_THREADS_R174__,sb,fxs,win};}
const basic=(o={})=>({friendly:true,r160Basic:true,attackKind9:'basic',...o});
for(const hero of ['seoha','michaela','hunter','gunner'])for(const rank of [0,1,7]){const {sb,fxs}=loadR174({hero,rank});const e={x:2,y:1,hp:1000};const out=sb.hitEnemy(e,470.94,basic());
 ok(out===true&&Math.abs(e.hp-(1000-470.94))<1e-9,`${hero} 실검무 ${rank}단계 평타: 피해 470.94 그대로`,e.hp);
 ok(!fxs.some(f=>f.type==='threadSlashR63'),`${hero} 실검무 ${rank}단계 평타: 자동 은색실(threadSlashR63) 안 만듦`,fxs.map(f=>f.type));}
{const {sb,fxs}=loadR174({hero:'seoha',rank:3,pref:{silverMark:true}});sb.hitEnemy({x:0,y:0,hp:9},1,basic());ok(!fxs.length,'예전에 켜 둔 설정(silverMark:true)이 저장돼 있어도 자동 표시 없음',fxs.map(f=>f.type));}
{const {sb,fxs}=loadR174({hero:'seoha',rank:3});for(let i=0;i<10;i++){sb.time=1+i*.5;sb.hitEnemy({x:0,y:0,hp:1e9},1,basic());}ok(!fxs.length,'연속 10발에도 0',fxs.length);}
{const {A,win}=loadR174({hero:'seoha',rank:1});ok(typeof A.orbitCast==='function'&&typeof win.__STORYWORLD_DANCES_R74__.cast==='function'&&win.__STORYWORLD_DANCES_R74__.r174===true,'황금실 원거리 돌기(R174 cast 감싸기)는 그대로');
 ok(win.__STORYWORLD_DANCES_R74__.cast('silver')==='base-silver','T 실검무(silver) 직접 사용은 원래 길 그대로');}

// ---- ② R1041 ----
function loadR1041(hero){const win={};const img={width:4096,height:128};
 const sb={window:win,localStorage:{getItem:()=>null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,console,Date,Promise,
  player:{hero},time:2,readyImage:()=>({image:img}),addImage(){}};
 vm.createContext(sb);vm.runInContext(rd('client-source/hero-dots-fx-r1041.js'),sb);return win.__STORYWORLD_HERO_DOTS_FX_R1041__;}
const pts=[[100,100],[300,100],[300,120],[100,120]];
const iai=(F='silver')=>({sourcePath:`r106fx:iai-cut:${F}:`,points:pts});
for(const hero of ['seoha','michaela','hunter','gunner','hwando','neon']){const A=loadR1041(hero);
 const r=A.rule('image',{id:'r111:thread-slash:1.23:0'},iai(),[]);
 ok(!(r&&r.S===A.sheet.H6),`${hero}: 실검무 베기(r111:thread-slash)의 iai-cut 은 환도 발도 시트로 안 바꿈`,r&&r.S&&r.S.path);
 const sl=A.rule('image',{id:'r111:thread-slash:1.23:0'},{sourcePath:'r106fx:slashline:x:',points:pts},[]);ok(sl!=='drop','실검무 덧줄(slashline)도 그대로 남김',sl);}
{const A=loadR1041('hwando');for(const id of ['r106:fx:12','r590:chain:3','r975:ilseom','r348:w-cross','d2s:iai:7']){const cmds=[];const r=A.rule('image',{id},iai(),cmds);ok(r&&r.S===A.sheet.H6,'환도 기술('+id+')은 여전히 발도 시트',r&&r.S&&r.S.path);
  ok(A.rule('image',{id},{sourcePath:'r106fx:slashline:x:',points:pts},cmds)==='drop','환도 기술의 같은 범위 덧줄은 예전처럼 뺌');}}

// ---- ③ R912 ----
function loadR912(){const win={};const fxs=[];
 const sb={window:win,localStorage:{getItem:()=>null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,console,Date,Proxy,Symbol,setInterval(){},
  time:3,zone:'dist02',effects:[],project:(x,y)=>({x:x*64,y:y*32}),actorHeight:()=>66,readyImage:()=>({image:{}}),addImage(){},hitEnemy:(e,v)=>{e.hp-=v;return true;},hurt:()=>'hit'};
 sb.fx=function(type,x,y,o){const e={type,x,y,...(o||{})};fxs.push(e);sb.effects.push(e);return e;};
 vm.createContext(sb);vm.runInContext(rd('client-source/projectile-sheets-r912.js'),sb);return{A:win.__STORYWORLD_PROJ_SHEETS_R912__,sb,fxs};}
const heart=(o={})=>({friendly:true,r160Basic:true,asset:'assets/vfx/heroes/michaela-a.webp',vx:9,vy:0,x:5.55,y:3,px:5.0,py:3,...o});
// 같은 적·같은 피해, 프레임 16.7ms·50ms: 엔진 충돌점은 같고 탄 끝점만 다르다
for(const [dt,endX] of [[1/60,5.15],[.05,5.55],[.1,6.0]]){const {sb,fxs}=loadR912();const e={x:5.4,y:3,hp:100};const b=heart({x:endX,px:endX-9*dt,impactPoint152:{x:5.0,y:3}});
 const out=sb.hitEnemy(e,10,b);const h=fxs.find(f=>f.type==='r912hit');
 ok(out===true&&e.hp===90,`dt ${dt}: 피해 그대로`);
 ok(h&&Math.abs(h.x-5.0)<1e-9&&Math.abs(h.y-3)<1e-9,`dt ${dt}: 하트 적중 그림 = 엔진 충돌점(5.0,3), 탄 끝점 ${endX} 아님`,h&&{x:h.x,y:h.y});}
{const {sb,fxs}=loadR912();sb.hitEnemy({x:0,y:0,hp:9},1,heart({x:2,y:1,impactPoint152:null}));const h=fxs.find(f=>f.type==='r912hit');ok(h&&h.x===2&&h.y===1,'충돌점이 없으면(다른 적중 길) 예전처럼 탄 자리',h);}
{const {sb,fxs}=loadR912();sb.hitEnemy({x:0,y:0,hp:9},1,heart({x:2,y:1,impactPoint152:{x:NaN,y:1}}));const h=fxs.find(f=>f.type==='r912hit');ok(h&&h.x===2,'충돌점이 숫자가 아니면 탄 자리(NaN 그림 없음)',h);}
{const {sb,fxs}=loadR912();sb.hitEnemy({x:0,y:0,hp:9},1,heart({asset:'assets/vfx/heroes/seoha-a.webp',impactPoint152:{x:4.8,y:3}}));const h=fxs.find(f=>f.type==='r912hit');ok(h&&h.x===4.8&&h.r912==='pj01','서하 기본탄도 같은 충돌점 규칙',h);}

// ---- ④ R111 실검무 베기 중심(정적 + 함수) ----
const p111=rd('client-source/play-r111.js');
ok(/function threadBody\(/.test(p111)&&/threadBody\(m,/.test(p111),'play-r111 threadSlash 가 맞은 몹 몸통(threadBody)을 쓴다');
{const src=/\/\*R1270-body\{\*\/([\s\S]*?)\/\*\}R1270-body\*\//.exec(p111);ok(!!src,'threadBody 묶음 표시');
 const sb={Math,Number,room:{enemies:[{id:7,x:3,y:2,hp:10},{id:8,x:3.4,y:2,hp:10}]},project:(x,y)=>({x:x*64,y:y*32}),window:{__STORYWORLD_PLAY_R115__:{centreOf:e=>e.id===7?{cx:e.x*64+3,cy:e.y*32-40,h:70}:null}}};
 vm.createContext(sb);vm.runInContext(src[1]+';this.threadBody=threadBody;',sb);const tb=sb.threadBody;
 const m={from:{x:0,y:0},to:{x:3,y:2}};let c=tb(m,27);ok(c&&c.x===3*64+3&&c.y===2*32-40,'처음: 그 몹 그림 몸통 중심',c);
 sb.room.enemies[0].x=4;c=tb(m,27);ok(c&&c.x===4*64+3,'몹이 움직이면 따라감(처음 끝점 고정 아님)',c);
 sb.room.enemies[0].hp=0;sb.room.enemies.splice(0,1);c=tb(m,27);ok(c&&c.x===4*64+3,'몹이 사라져도 마지막 몸통 자리 유지(옆 몹으로 튀지 않음)',c);
 const m2={from:{x:0,y:0},to:{x:3.4,y:2}};c=tb(m2,27);ok(c&&c.x===3.4*64&&c.y===2*32-27,'그림 크기를 아직 모르면 발 위 lift',c);
 const m3={from:{x:0,y:0},to:{x:9,y:9}};ok(tb(m3,27)===null,'근처에 몹이 없으면 null(예전 그리기)');}
console.log(JSON.stringify({passed:n}));
