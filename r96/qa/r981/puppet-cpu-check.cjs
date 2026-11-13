'use strict';
// R981 — 불면귀 중간보스(last302 mb-last302-v31231)가 본체 '불면귀'(last303)와 같은 보스로 보이지 않게 이름·연출을 가른다.
//  사용자 2026-11-13 "갈리지 않게 중간보스 이름이나 연출을 손봐". vm 으로 엔진 흉내(그리기 명령·토스트) → 정상·경계·회귀.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const src=rd(path.join(R,'client-source/midboss-puppet-r981.js'));
ok(src.length>0,'midboss-puppet-r981.js 존재');
ok(rd(path.join(R,'runtime-text/midboss-puppet-r981.js'))===src&&src.length>0,'runtime-text 사본 = client-source');
const html=rd(path.join(R,'runtime-text/index.html')),at=s=>html.indexOf(s);
ok(at('midboss-puppet-r981.js')>at('bulmyeongwi-r760.js')&&at('midboss-puppet-r981.js')>at('combat-sfx-r954.js')&&at('bulmyeongwi-r760.js')>0,'태그는 R760·R954 뒤');
ok(/midboss-puppet-r981/.test(rd(path.join(ROOT,'scripts/verify-r96-public.py'))),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r981/puppet-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(/midboss-puppet-r981\.js/.test(rd(path.join(R,'runtime-inputs.json')))&&/midboss-puppet-r981\.js/.test(rd(path.join(R,'runtime-manifest.json'))),'runtime-inputs·manifest 에 등록');
// 정본 불변: story-canon 데이터에 새 이름을 넣지 않음, 옛 정본 문장 그대로
const canon=rd(path.join(R,'client-source/story-canon-r106-data.js'));
ok(canon.length>0&&!canon.includes('꼭두각시 실안개')&&canon.includes('보이지 않는 실에 끌리는 것처럼'),'정본 데이터 불변(34장 실 문장 그대로, 새 이름 없음)');
// ── vm 엔진 흉내 ──
const OLD='검은 안개 심장 · 불면의 기억',NEW='꼭두각시 실안개';
function world(o={}){const toasts=[],timers=[],intervals=[],strokes=[],draws=[];
 const c2={filter:'none',globalAlpha:1,commands:o.recorder?[]:undefined,save(){},restore(){},beginPath(){this._p=[];},moveTo(x,y){this._p=[[x,y]];},quadraticCurveTo(a,b,x,y){this._p.push([a,b],[x,y]);},
  stroke(){strokes.push({pts:this._p,alpha:this.globalAlpha,width:this.lineWidth});},drawImage(im){draws.push({src:im&&im.tag,filter:this.filter});if(this.commands)this.commands.push({kind:'image',src:im,filter:this.filter});}};
 const ctx={window:{},localStorage:{getItem:k=>k==='storyworld.r981.puppet'?(o.pref??null):null,setItem(){}},performance:{now:()=>1000},console,Math,Object,Array,String,Number,JSON,RegExp,WeakMap,
  setTimeout:f=>{timers.push(f);return 1;},setInterval:f=>{intervals.push(f);return 1;},time:12.5,modal:null,storyScene:null,ctx:c2,effects:[],
  toast:(t,s)=>toasts.push([t,s]),project:o.project||((x,y)=>({x:(x-y)*16+320,y:(x+y)*8+40})),
  room:{id:o.zone||'last302',enemies:[]},
  makeRoom:(id)=>({id,enemies:(o.rows||defaultRows)(id)}),
  drawEnemy:function(e){c2.drawImage({width:256,height:256,tag:'outline'});c2.drawImage({src:e.path||('x/'+e.id+'.webp'),tag:'body:'+e.id});if(c2.commands&&e.__ghost)c2.commands.push({kind:'image',src:'ghost:'+e.id,r760Ghost:true});},
  drawBurnDeath3:function(fx){c2.drawImage({src:fx.r764?.who==='mid'?'assets/r760/mid/sheet-death.webp':'assets/r760/boss/sheet-death.webp',tag:'death:'+fx.sourceId});}};
 ctx.window=ctx;ctx.window.__STORYWORLD_MOB_ART_VARIANTS_R306_DATA__={actors:{['STORY|mb-last302-v31231|'+OLD]:'actor-a',['DREAM|mb-last302-v31231|'+OLD]:'actor-b','STORY|l302-e1|잠식된 약방 아낙':'actor-c'},rows:{}};
 vm.createContext(ctx);vm.runInContext(src,ctx);return {ctx,c2,toasts,timers,intervals,strokes,draws,api:ctx.__STORYWORLD_PUPPET_R981__,tick:()=>intervals.forEach(f=>f())};}
const defaultRows=id=>id==='last302'?[{id:'last302:mb-last302-v31231',nativeId:'mb-last302-v31231',name:OLD,midboss:true,hp:27665,maxHp:27665,path:'assets/episode1b/generated-v394/bulmyeongwi_b.webp',spawnState:'hidden',x:16,y:12},
 {id:'v1',nativeId:'l302-e1',name:'잠식된 약방 아낙',hp:100,x:17,y:12,spawnState:'active'}]:id==='last303'?[{id:'b',nativeId:'l303-boss',name:'불면귀',boss:true,hp:9,x:1,y:1}]:[{id:'z',nativeId:'mb-last302-v31231',name:OLD,midboss:true,hp:1,x:0,y:0}];
let w=world();
ok(!!w.api&&w.api.NAME===NEW,'API·새 이름 '+NEW);
ok(!/불면|심장|기억/.test(NEW),'새 이름에 본체를 떠올리는 낱말(불면·심장·기억) 없음');
// 이름: 지역 만들 때
let r=w.ctx.makeRoom('last302');let m=r.enemies[0];
ok(m.name===NEW&&m.r981From===OLD&&m.r248Key===OLD,'last302 중간보스 이름 → 새 이름(옛 이름은 r981From·효과 키 r248Key)');
ok(m.id==='last302:mb-last302-v31231'&&m.nativeId==='mb-last302-v31231'&&m.hp===27665&&m.maxHp===27665&&/bulmyeongwi_b\.webp$/.test(m.path)&&m.spawnState==='hidden','id·nativeId·체력·그림 경로·생성 상태 그대로');
ok(r.enemies[1].name==='잠식된 약방 아낙','주민 이름 그대로');
ok(w.ctx.makeRoom('last303').enemies[0].name==='불면귀','본체 불면귀(last303) 이름 그대로');
ok(w.ctx.makeRoom('ep1a01').enemies[0].name===OLD,'다른 지역은 건드리지 않음(경계)');
const pre={nativeId:'mb-last302-v31231',name:'중간보스 · '+OLD,midboss:true,r248Key:'기존키'};w.api.rename(pre);
ok(pre.name==='중간보스 · '+NEW&&pre.r248Key==='기존키','\'중간보스 · \' 머리말 유지, 이미 있던 효과 키는 덮지 않음');
const twice={nativeId:'mb-last302-v31231',name:OLD};w.api.rename(twice);w.api.rename(twice);ok(twice.name===NEW&&twice.r981From===OLD,'두 번 바꿔도 같은 결과(멱등)');
ok(w.ctx.__STORYWORLD_MOB_ART_VARIANTS_R306_DATA__.actors['STORY|mb-last302-v31231|'+NEW]==='actor-a'&&w.ctx.__STORYWORLD_MOB_ART_VARIANTS_R306_DATA__.actors['DREAM|mb-last302-v31231|'+NEW]==='actor-b','R306 픽셀 그림 열쇠도 새 이름으로 이어짐');
// 그리기: 회백 필터·실
w=world({recorder:true});r=w.ctx.makeRoom('last302');w.ctx.room=r;m=r.enemies[0];m.spawnState='active';m.__ghost=true;
const vs=[];for(let i=0;i<8;i++)vs.push({id:'v'+i,nativeId:i%2?'l302-e3':'l302-e1',name:'주민',hp:5,x:16+i*.8,y:13,spawnState:'active',__ghost:true});
r.enemies.push(...vs,{id:'far',nativeId:'l302-e1',hp:5,x:60,y:60,spawnState:'active'},{id:'dead',nativeId:'l302-e1',hp:0,x:16.5,y:12,spawnState:'active'},{id:'hid',nativeId:'l302-e1',hp:5,x:16.2,y:12,spawnState:'hidden'});
w.tick();w.ctx.drawEnemy(m);
const body=w.draws.find(d=>d.src==='body:'+m.id);ok(!!body&&/grayscale\(1\)/.test(body.filter),'중간보스 몸은 회백 필터로 그림('+(body&&body.filter)+')');
ok(w.c2.filter==='none','그린 뒤 ctx 필터 되돌림');
ok(w.draws.find(d=>d.src==='outline').filter==='none','붉은 적 테두리·바닥 고리(캔버스)는 필터 없이 그대로(적 읽기 유지)');
ok(w.strokes.length===6,'실은 둘레 주민 가장 가까운 여섯에게만(멀리·죽은·숨은 주민 제외)('+w.strokes.length+')');
ok(w.strokes.every(s=>s.pts.flat().every(Number.isFinite)&&s.alpha>0&&s.alpha<=.5),'실 좌표 유한·알파 0~.5');
ok(!w.c2.commands.some(c=>c.r760Ghost),'본체 표식 겹 잔상(r760Ghost) 뗌');
const before=w.draws.length,s0=w.strokes.length;w.ctx.drawEnemy(vs[0]);
ok(w.draws.slice(before).every(d=>d.filter==='none')&&w.strokes.length===s0&&w.c2.commands.some(c=>c.r760Ghost),'주민 그림은 필터·실·잔상 그대로(회귀)');
// 경계: 숨은 중간보스·죽은 중간보스·주민 없음·투영 NaN
const s1=w.strokes.length;m.spawnState='hidden';w.ctx.drawEnemy(m);ok(w.strokes.length===s1,'숨은 중간보스는 실 없음');m.spawnState='active';
w=world({project:()=>({x:NaN,y:Infinity})});r=w.ctx.makeRoom('last302');w.ctx.room=r;m=r.enemies[0];m.spawnState='active';w.tick();w.ctx.drawEnemy(m);ok(w.strokes.length===0&&w.api.inspect().stats.errors===0,'투영 값이 NaN·Infinity 면 실을 그리지 않음(멈춤 방지)');
w=world({rows:()=>[{id:'m',nativeId:'mb-last302-v31231',name:OLD,midboss:true,hp:5,x:1,y:1,spawnState:'active'}]});r=w.ctx.makeRoom('last302');w.ctx.room=r;w.tick();w.ctx.drawEnemy(r.enemies[0]);ok(w.strokes.length===0,'주민이 없으면 실 없음');
// 다른 지역: 아무것도 안 함
w=world({zone:'ep1a01'});r=w.ctx.makeRoom('ep1a01');w.ctx.room=r;w.tick();w.ctx.drawEnemy(r.enemies[0]);ok(w.draws.every(d=>d.filter==='none')&&w.strokes.length===0,'다른 지역 같은 id 는 필터·실 없음');
// 죽음 그림도 회백
w=world();r=w.ctx.makeRoom('last302');w.ctx.room=r;w.tick();w.ctx.drawBurnDeath3({sourceId:'x',r764:{who:'mid'}});w.ctx.drawBurnDeath3({sourceId:'y',r764:{who:'boss'}});w.draws=w.draws.filter(d=>/^death/.test(d.src));
ok(/grayscale/.test(w.draws[0].filter)&&w.draws[1].filter==='none','중간보스 죽음 시트만 회백(본체 죽음은 그대로)');
// 자막
w=world();r=w.ctx.makeRoom('last302');w.ctx.room=r;m=r.enemies[0];w.tick();ok(w.toasts.length===0,'숨어 있을 때는 자막 없음');
m.spawnState='active';w.ctx.modal={};w.tick();ok(w.toasts.length===0,'창이 떠 있으면 기다림');w.ctx.modal=null;w.tick();w.tick();
ok(w.toasts.length===1&&w.toasts[0][0].startsWith(NEW)&&!/불면귀/.test(w.toasts[0][0]),'처음 드러날 때 자막 한 번('+(w.toasts[0]&&w.toasts[0][0])+')');
m.hp=0;w.ctx.effects.push({type:'enemyBurnDeath',sourceId:m.id});w.tick();w.tick();ok(w.toasts.length===2&&/흩어져/.test(w.toasts[1][0])&&w.ctx.effects[0].r981===true,'쓰러지면 흩어지는 자막 한 번 + 죽음 효과 표시');
// 경계(브라우저에서 찾음): 쓰러진 중간보스가 room.enemies 에서 빠져도 처치 자막
w=world();r=w.ctx.makeRoom('last302');w.ctx.room=r;m=r.enemies[0];m.spawnState='active';w.tick();m.hp=0;r.enemies.splice(0,1);w.tick();
ok(w.toasts.length===2&&/흩어져/.test(w.toasts[1][0]),'쓰러져 목록에서 빠져도 처치 자막');
w.ctx.room={id:'last302',enemies:[]};w.tick();ok(w.toasts.length===2,'다른 방(새로 만든 last302)에선 옛 중간보스로 자막을 다시 내지 않음');
// 끄기
w=world({pref:'{"on":false}'});r=w.ctx.makeRoom('last302');ok(r.enemies[0].name===OLD,'끄면 옛 이름 그대로');w.ctx.room=r;r.enemies[0].spawnState='active';w.tick();w.ctx.drawEnemy(r.enemies[0]);ok(w.draws.every(d=>d.filter==='none')&&w.toasts.length===0,'끄면 필터·자막 없음');
// 효과음: R954 가 새 이름도 중간보스 소리로 알아봄
{const s954=rd(path.join(R,'client-source/combat-sfx-r954.js'));const c={window:{},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},console,Math,setInterval:()=>1,setTimeout:()=>1};c.window=c;vm.createContext(c);
 try{vm.runInContext(s954,c);}catch(e){}const A=c.__STORYWORLD_SFX_R954__;
 ok(!!A&&A.slugOf(NEW)==='mistheart'&&A.slugOf('중간보스 · '+NEW)==='mistheart','R954: 새 이름 → mistheart 소리');
 ok(!!A&&A.slugOf(OLD)==='mistheart'&&A.slugOf('불면귀')==='bulmyeongwi'&&A.slugOf('잠식된 어부 3')==='fisherman','R954: 옛 이름·본체·주민 소리 그대로(회귀)');}
// R760 은 이름이 아니라 id 로 중간보스를 알아본다(이름을 바꿔도 시트가 그대로 붙음)
ok(/r==='last302'&&\/\^mb-last302\/\.test\(id\)/.test(rd(path.join(R,'client-source/bulmyeongwi-r760.js'))),'R760 중간보스 판별은 id 기준');
console.log('\nR981 puppet: '+(n-bad)+'/'+n);process.exit(bad?1:0);
