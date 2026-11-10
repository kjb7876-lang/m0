'use strict';
// R537(사용자 2026-11-10 "진흙등거미 거미동굴나오게 늪나오는 뿌리추적자늪뿌리추적자로명명", "기억운반거미도 거미동굴나오게")
//  A. 늪(dist02) R74 순찰 뿌리 추적자 → '늪 뿌리 추적자'(우두머리 꼬리 유지), 첫 뿌리 맵(dist00)·DREAM 은 그대로, 그림·공격 효과 키 그대로.
//  B. 거미동굴(dist01)의 옛 망각의 거미 자리(R380 개명분) 일부를 진흙등 거미(dist02-sp1 그림)·기억 운반거미(dist03-sp1 그림)로. 수·id·수치 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}};
const RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8'),CS=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
for(const f of ['approved-mobs-r380.js','mob-moves-r385.js'])ok(RT(f)===CS(f),f+' runtime-text 사본 = client-source');
ok(/r537\/r537-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'Pages CPU 검사 줄');
const idx=JSON.parse(RT('assets/r380/mobs/index.json'));
// ── A. R380 ──
{const r61=[];const ctx={window:{__STORYWORLD_STORY_COMBAT_R54__:{frameFor:()=>({path:'base'})},__STORYWORLD_SCALE_MELEE_R61__:{normalize:(e,r,o)=>r61.push(e.id)}},
  localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},time:1,layer:'STORY',room:{id:'dist02'},player:{x:0,y:0},readyImage:()=>({image:{naturalWidth:10}}),setTimeout:()=>0};ctx.window.window=ctx.window;
 const mk=(id,name,nid,o={})=>({id:id+':'+name,name,nativeId:nid,spawnState:'active',x:1,y:1,homeX:1,homeY:1,hp:10,maxHp:10,damage:5,...o});
 const pat=(z,i,mon,name,nid,o={})=>mk(z,name,nid,{id:z+':r74-patrol:'+i,r74Monster:mon,...o});
 ctx.makeRoom=function(id){
  if(id==='dist02')return{enemies:[mk(id,'수렁 주문사 1','dist02-m1'),mk(id,'진흙등 거미 1','dist02-sp1'),pat(id,0,'root','뿌리 추적자 우두머리','dist02-h1',{squadLeaderR373:true,r373Name:'뿌리 추적자'}),pat(id,1,'root','뿌리 추적자','dist02-g1',{r373Name:'뿌리 추적자'}),pat(id,2,'root','뿌리 추적자 3','dist02-sp1')]};
  if(id==='dist00')return{exploration:{entry:{x:1.5,y:1.5},floorCells:Array.from({length:400},(_,k)=>[k%20,Math.floor(k/20)])},enemies:[mk(id,'뿌리의 문지기','dist00-boss',{boss:true,x:3,y:3})]};
  if(id==='dist03')return{enemies:[mk(id,'쓰러진 수호병 3','dist03-s1'),pat(id,0,'root','뿌리 추적자','dist03-s1')]};return{enemies:[]};};
 vm.createContext(ctx);vm.runInContext('var window=this.window;'+CS('approved-mobs-r380.js').replace("if(typeof fetch==='function')","window.__idx=(j)=>{idx=j};if(false)"),ctx);ctx.window.__idx(idx);
 const S=ctx.window.__STORYWORLD_STORY_COMBAT_R54__;
 const d2=ctx.makeRoom('dist02','STORY'),pt=d2.enemies.filter(e=>/:r74-patrol:/.test(e.id));
 ok(pt.map(e=>e.name).join('|')==='늪 뿌리 추적자 우두머리|늪 뿌리 추적자|늪 뿌리 추적자 3','늪 순찰 뿌리 추적자 → 늪 뿌리 추적자(우두머리·번호 꼬리 유지)');
 ok(!d2.enemies.some(e=>/^뿌리 추적자/.test(e.name)),'늪에 이름이 그냥 뿌리 추적자인 몹이 없음');
 ok(pt.every(e=>e.r248Key==='뿌리 추적자'),'공격 효과·그림 조회 키(r248Key)는 옛 이름 그대로');
 ok(pt[0].r373Name==='늪 뿌리 추적자'&&pt[1].r373Name==='늪 뿌리 추적자','R373 분대 그릴 때 이름도 늪 뿌리 추적자');
 ok(pt.every(e=>e.maxHp===10&&e.damage===5&&e.r74Monster===undefined)&&d2.enemies.length===5,'수·수치 그대로, 다크그린 시트 사슬(r74Monster 지움) 유지');
 ok(d2.enemies[0].name==='수렁 주문사 1'&&d2.enemies[1].name==='진흙등 거미 1','늪의 다른 몹 이름 그대로');
 ok(JSON.stringify(ctx.makeRoom('dist02','STORY').enemies.map(e=>e.name))===JSON.stringify(d2.enemies.map(e=>e.name)),'다시 만들어도 같은 이름(늪 늪 겹침 없음)');
 ctx.room={id:'dist02'};ok(S.frameFor({id:'q1',name:'늪 뿌리 추적자',hp:10,x:3,y:0},null)?.r380Mob==='swamp-root-stalker-darkgreen-v2','늪 뿌리 추적자 → 다크그린 시트');
 ok(S.frameFor({id:'q2',name:'늪 뿌리 추적자 우두머리',hp:10,x:3,y:0},null)?.r380Mob==='swamp-root-stalker-darkgreen-v2','늪 뿌리 추적자 우두머리 → 다크그린 시트');
 const d0=ctx.makeRoom('dist00','STORY').enemies.filter(e=>e.r383Added);ok(d0.length===6&&d0.every(e=>e.name==='뿌리 추적자'),'첫 뿌리 맵(dist00)은 그냥 뿌리 추적자 6마리');
 ctx.room={id:'dist00'};ok(S.frameFor({id:'q3',name:'뿌리 추적자',hp:10,x:3,y:0},null)?.r380Mob==='root-stalker-r74-plain','dist00 뿌리 추적자 그림 그대로');
 ok(S.frameFor({id:'q4',name:'늪 뿌리 추적자',hp:10,x:3,y:0},null)?.r380Mob!=='swamp-root-stalker-darkgreen-v2','dist00 에서는 다크그린 시트 안 씀');
 ok(ctx.makeRoom('dist03','STORY').enemies[1].name==='쓰러진 수호병','다른 맵 뿌리 추적자 순찰 되돌리기 그대로');
 ok(ctx.makeRoom('dist02','DREAM').enemies.filter(e=>e.name.startsWith('뿌리 추적자')).length===3,'DREAM 층은 그대로');}
// ── B. R385 ──
{const mk=(z,name,nid,o={})=>({id:z+':'+name,name,nativeId:nid,path:'p/'+nid,profile:{frames:{move:{path:'f/'+nid}}},hp:10,maxHp:10,damage:3,...o});
 const SUB=['재 나방','보랏빛 알집지기','거미줄에 묶인 수호병'];
 const sp1=(k,suf='')=>mk('dist01','x'+k,'dist01-sp1',{name:SUB[k%3]+(suf||' '+(k+1)),r380Renamed:true,r380From:'망각의 거미 '+(k+1),r248Key:'망각의 거미'});
 let cnt=10;const DATA={
  dist01:()=>[mk('dist01','보랏빛 알집지기 1','dist01-sp2'),...Array.from({length:cnt},(_,k)=>sp1(k)),mk('dist01','중간보스 · 재 나방','dist01-sp1',{midboss:true,wardChampionR81:true,r380Renamed:true,r248Key:'망각의 거미'}),
   mk('dist01','재 나방','dist01-sp1',{id:'dist01:r74-patrol:0',r74Monster:'ash'}),mk('dist01','거미줄에 묶인 수호병 1','dist01-s1'),mk('dist01','보라검천사','mb-dist01',{midboss:true})],
  dist02:()=>[mk('dist02','진흙등 거미 1','dist02-sp1'),mk('dist02','수렁 주문사 1','dist02-m1'),mk('dist02','늪에서 되살아난 혼령체 1','dist02-g1',{r381From:'늪에서 되살아난 전우 1',r248Key:'늪에서 되살아난 전우'}),
   mk('dist02','진흙등 거미 추격대','dist02-sp1-w2-4'),mk('dist02','중간보스 · 진흙등 거미','dist02-sp1',{midboss:true}),mk('dist02','진흙등 거미 우두머리','dist02-sp1'),
   mk('dist02','늪 뿌리 추적자','dist02-sp1',{id:'dist02:r74-patrol:3',r248Key:'뿌리 추적자'}),mk('dist02','늪의 뿔악마','dist02-boss',{boss:true})],
  dist03:()=>[mk('dist03','기억 운반거미 1','dist03-sp1'),mk('dist03','피냄새 추적자 1','dist03-g1'),mk('dist03','기억 운반거미 추격대','dist03-sp1-w2-9'),mk('dist03','중간보스 · 기억 운반거미','dist03-sp1',{midboss:true}),mk('dist03','보라검 추격천사 1','dist03-c1'),mk('dist03','기억 운반거미','dist03-sp1',{id:'dist03:r74-patrol:2',r383RootFrom:'root',r248Key:'뿌리 추적자'})]};
 const drawn=[];const ctx={spawnBurnDeath3(){},window:{},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,regionById:{},register(){},
  makeRoom:(id)=>({id,enemies:(DATA[id]||(()=>[]))()}),drawEnemy:e=>drawn.push({nativeId:e.nativeId,path:e.path})};
 for(const z of Object.keys(DATA))ctx.regionById[z]={paths:[]};ctx.window.window=ctx.window;vm.createContext(ctx);vm.runInContext('var window=this.window;'+CS('mob-moves-r385.js'),ctx);
 const d1=ctx.makeRoom('dist01','STORY').enemies,sp=d1.filter(e=>e.nativeId==='dist01-sp1'&&!e.midboss&&!/:r74-patrol:/.test(e.id));
 const mud=sp.filter(e=>/^진흙등 거미/.test(e.name)),mem=sp.filter(e=>/^기억 운반거미/.test(e.name));
 ok(mud.length===2&&mem.length===2,'거미동굴 옛 망각의 거미 자리 10 중 진흙등 거미 2·기억 운반거미 2 (실제 '+mud.length+'·'+mem.length+')');
 ok(sp.filter(e=>/^(재 나방|보랏빛 알집지기|거미줄에 묶인 수호병)/.test(e.name)).length===6,'승인 3종(재 나방·알집지기·수호병)은 남김');
 ok(mud.every(e=>/^진흙등 거미 \d+$/.test(e.name)&&e.r248Key==='진흙등 거미'&&e.r385Look.join()==='dist02,dist02-sp1')&&mem.every(e=>/^기억 운반거미 \d+$/.test(e.name)&&e.r248Key==='기억 운반거미'&&e.r385Look.join()==='dist03,dist03-sp1'),'번호 꼬리 유지, 그림·효과 키는 옮겨 온 몹 것');
 ok(sp.every(e=>e.nativeId==='dist01-sp1'&&e.maxHp===10&&e.damage===3)&&d1.length===cnt+5,'id·nativeId·수치·몹 수 그대로');
 drawn.length=0;if(mud[0]&&mem[0]){ctx.drawEnemy(mud[0]);ctx.drawEnemy(mem[0]);}ok(drawn[0]?.nativeId==='dist02-sp1'&&drawn[0].path==='p/dist02-sp1'&&drawn[1]?.nativeId==='dist03-sp1'&&mud[0].nativeId==='dist01-sp1','그릴 때만 진흙등 거미·기억 운반거미 그림을 빌리고 되돌림');
 ok(d1.find(e=>e.wardChampionR81).name==='중간보스 · 재 나방'&&d1.find(e=>/:r74-patrol:/.test(e.id)).name==='재 나방'&&d1[0].name==='보랏빛 알집지기 1'&&d1.at(-1).name==='보라검천사','지역 수호자·순찰·다른 종·중간보스 그대로');
 // 사용자 2026-11-10 02:30Z 결정 카드 "원래 맵에서 빼기(완전 이동)": 늪 진흙등 거미 → 늪에서 되살아난 혼령체(같은 구울형), 무너진 성 기억 운반거미 → 피냄새 추적자(카드 문구).
 {const d2=ctx.makeRoom('dist02','STORY').enemies,d3=ctx.makeRoom('dist03','STORY').enemies;
  ok(!d2.some(e=>/진흙등 거미/.test(e.name))&&!d3.some(e=>/기억 운반거미/.test(e.name)),'늪에 진흙등 거미, 무너진 성에 기억 운반거미가 없음');
  ok(d2.map(e=>e.name).join('|')==='늪에서 되살아난 혼령체 1|수렁 주문사 1|늪에서 되살아난 혼령체 1|늪에서 되살아난 혼령체 추격대|중간보스 · 늪에서 되살아난 혼령체|늪에서 되살아난 혼령체 우두머리|늪 뿌리 추적자|늪의 뿔악마','늪: 번호·추격대·우두머리·중간보스 꼬리 유지, 순찰 늪 뿌리 추적자·보스 그대로 ('+d2.map(e=>e.name).join('|')+')');
  ok(d2[0].r385Look?.join()==='dist02,dist02-g1'&&d2[0].r248Key==='늪에서 되살아난 전우'&&d2[0].nativeId==='dist02-sp1'&&d2[0].maxHp===10,'늪: 그림·효과 키는 혼령체, id·수치 그대로');
  ok(d3.map(e=>e.name).join('|')==='피냄새 추적자 1|피냄새 추적자 1|피냄새 추적자 추격대|중간보스 · 피냄새 추적자|보라검 추격천사 1|피냄새 추적자'&&d3[0].r385Look?.join()==='dist03,dist03-g1','무너진 성: 기억 운반거미 → 피냄새 추적자(R383 이 되돌린 순찰 포함, 실측에서 1마리 남았던 회귀)');
  drawn.length=0;ctx.drawEnemy(d2[0]);ok(drawn[0]?.nativeId==='dist02-g1','늪 옛 거미 자리는 혼령체 그림으로 그림');}
 {const d1b=ctx.makeRoom('dist01','STORY').enemies;ok(d1b.filter(e=>/^진흙등 거미/.test(e.name)).every(e=>e.r385Look.join()==='dist02,dist02-sp1'),'거미동굴 진흙등 거미는 여전히 진흙등 거미 그림(빌려 올 원본이 늪에서 개명돼도)');
  drawn.length=0;ctx.drawEnemy(d1b.find(e=>/^진흙등 거미/.test(e.name)));ok(drawn[0]?.nativeId==='dist02-sp1','거미동굴 진흙등 거미 그림 = dist02-sp1');}
 ok(JSON.stringify(ctx.makeRoom('dist01','STORY').enemies.map(e=>e.name))===JSON.stringify(d1.map(e=>e.name)),'다시 만들어도 같은 결과');
 ok(!ctx.makeRoom('dist01','DREAM').enemies.some(e=>/진흙등|기억 운반/.test(e.name)),'DREAM 층은 그대로');
 cnt=3;{const s=ctx.makeRoom('dist01','STORY').enemies;ok(!s.some(e=>/진흙등|기억 운반/.test(e.name))&&s.length===8,'경계: 옛 자리 3마리면 바꾸지 않음(승인 3종 하나씩 유지)');}
 cnt=4;{const s=ctx.makeRoom('dist01','STORY').enemies;ok(s.filter(e=>/^진흙등 거미/.test(e.name)).length===1&&!s.some(e=>/기억 운반/.test(e.name)),'경계: 4마리면 진흙등 거미 1');}
 cnt=17;{const s=ctx.makeRoom('dist01','STORY').enemies;ok(s.filter(e=>/^진흙등 거미/.test(e.name)).length===3&&s.filter(e=>/^기억 운반거미/.test(e.name)).length===3,'실제 수(17)면 진흙등 3·기억 운반 3');}
 cnt=10;ctx.window.__STORYWORLD_MOB_MOVES_R385__.set({on:false});ok(!ctx.makeRoom('dist01','STORY').enemies.some(e=>/진흙등|기억 운반/.test(e.name)),'끄기');}
console.log(`R537 CPU ${n-bad}/${n}`);if(bad)process.exit(1);
