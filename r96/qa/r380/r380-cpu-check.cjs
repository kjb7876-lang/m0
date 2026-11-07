'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}};
const RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const CS=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');const src=CS('approved-mobs-r380.js');
for(const f of ['approved-mobs-r380.js','mob-unique-r248.js','mob-preload-r260.js'])ok(RT(f)===CS(f),f+' runtime-text 사본 = client-source');
const html=RT('index.html');ok(/<script src="\.\/music-box-r378\.js"><\/script><script src="\.\/approved-mobs-r380\.js"><\/script>/.test(html)&&html.split('approved-mobs-r380.js').length===2,'스크립트 태그 한 번, R378 뒤');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'approved-mobs-r380.js',"),'공개 확인 목록');
const inputs=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'));ok(inputs.textPaths.includes('approved-mobs-r380.js'),'런타임 입력 목록');
const idx=JSON.parse(RT('assets/r380/mobs/index.json'));ok(idx.mobs.length===106,'106장(R404 레거시 6종 7장 + R403 디스토피아 특수3·레이저3 + R402 학생·스토리텔러 2 + R401 역행 신규 5종 8장 + R400 문턱 2 + R398 태양 순찰·골렘 v2·도장체 좌우 + R397 R200 S-04 복원 3 + R396 정원사·망령2 + R395 역행 신규 2 + R394 RE-3 백색 사수 좌우 2 + R393 역행 보스 2종 좌우 4 + R392 S-06 보스 2·순찰자 1 + R391 사몽 5 + R380 5 + R381 7 + R382 16 + R383 2 + R386 3 + R387 1 + R389 페르소나 보스 8 + 분신 8 + R390 디스토피아 5)');
for(const m of idx.mobs){const p=path.join(R,'runtime-text',m.path);ok(fs.existsSync(p),m.id+' 파일');if(!fs.existsSync(p))continue;const b=fs.readFileSync(p);
 ok(crypto.createHash('sha256').update(b).digest('hex')===m.sha256&&b.length===m.bytes,m.id+' 해시·크기');ok(JSON.stringify(inputs).includes(m.path),m.id+' 런타임 입력');ok(m.finalArt===false,m.id+' 임시 표기');}
ok(CS('mob-unique-r248.js').includes('s=sheetOf(e);if(s&&(')&&CS('mob-unique-r248.js').includes('__STORYWORLD_APPROVED_MOBS_R380__?.assign?.(e)))s=null;'),'R248 이 R380 몹을 덮어 그리지 않음');
ok(CS('mob-preload-r260.js').includes('__STORYWORLD_APPROVED_MOBS_R380__?.assign?.(e);if(d?.path)'),'R260 미리 읽기가 R380 시트를 기다림');
const S0={frameFor:(e,f)=>({path:'base'})};
const ctx={window:{__STORYWORLD_STORY_COMBAT_R54__:S0},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},time:1,layer:'STORY',room:{id:'dist01'},player:{x:0,y:0},
 readyImage:()=>({image:{naturalWidth:10}}),setTimeout:()=>0};ctx.window.window=ctx.window;
const r61=[];ctx.window.__STORYWORLD_SCALE_MELEE_R61__={normalize:(e,r,o)=>r61.push([e.id,o])};
ctx.makeRoom=function(id,l){const mk=(name,nid,o={})=>({id:id+':'+name,name,nativeId:nid,spawnState:'active',x:1,y:1,homeX:1,homeY:1,hp:10,...o});
 if(id==='dist01')return{enemies:[mk('망각의 거미 1','dist01-sp1'),mk('망각의 거미 증원 2','dist01-sp1'),mk('중간보스 · 망각의 거미','dist01-sp1',{midboss:true}),mk('재 나방 1','dist01-sp1'),mk('보랏빛 알집지기 1','dist01-sp2'),mk('망각의 거미 수호자','dist01-sp1',{wardChampionR81:true}),mk('보스','dist01-boss',{boss:true})]};
 const pat=(i,mon,name,nid,o={})=>mk('p'+i,nid,{id:id+':r74-patrol:'+i,name,r74Monster:mon,maxHp:50,r75Pack:0,combatProfile:{bodyBlock:{r:.4}},...o});
 if(id==='dist02')return{enemies:[mk('수렁 주문사 1','dist02-h1',{r75Pack:0}),pat(0,'root','뿌리 추적자 우두머리','dist02-h1',{maxHp:80,hp:80,damage:16,squadLeaderR373:true,r373Name:'뿌리 추적자',r373Base:{hp:50,maxHp:50,damage:10},squadR373:'dist02:s0',r373Slot:0,r373Anchor:{x:1,y:1}}),pat(1,'root','뿌리 추적자','dist02-h1',{damage:10,squadR373:'dist02:s0',r373Slot:1})]};
 if(id==='dist03')return{enemies:[mk('쓰러진 수호병 3','dist03-s1',{r75Pack:0}),pat(0,'root','뿌리 추적자','dist03-s1'),pat(1,'root','뿌리 추적자 우두머리','dist03-s1',{squadLeaderR373:true,r373Name:'뿌리 추적자'})]};
 if(id==='ep1b07')return{enemies:[mk('불 속의 그림자 1','b07-f1'),pat(0,'glass','유리 망령','b07-f1'),pat(1,'glass','유리 망령 우두머리','b07-f1',{squadLeaderR373:true,r373Name:'유리 망령'})]};
 if(id==='dist00')return{exploration:{entry:{x:1.5,y:1.5},floorCells:Array.from({length:400},(_,k)=>[k%20,Math.floor(k/20)])},enemies:[mk('뿌리의 문지기','dist00-boss',{boss:true,x:3,y:3})]};
 if(id==='ep1a10')return{enemies:[mk('오만의 폐허핵','mb-ep1a10',{midboss:true,spawnState:'hidden',maxHp:36355,hp:36355,damage:40,r248Key:'오만의 폐허핵',combatProfile:{bodyBlock:{r:.6}}}),mk('약 1','a10-h1')]};
 if(id==='ep1a09')return{objective:{x:15,y:13},exploration:{entry:{x:1.5,y:1.5},floorCells:Array.from({length:400},(_,k)=>[k%20,Math.floor(k/20)])},enemies:[mk('주사실 감시환각 1','a09-o1',{x:19.5,y:19.5})]};
 if(id==='u202')return{enemies:[1,2,3,4,5].map(i=>mk('가짜 자비 수집가 '+i,'u202-e1',{combatProfile:{attackShape:{r:1}}})).concat([mk('가짜 자비 수집가 우두머리','u202-e1'),mk('복종 봉인구 1','u202-e2')])};return{enemies:[]};};
vm.createContext(ctx);vm.runInContext('var window=this.window;'+src.replace("if(typeof fetch==='function')","window.__idx=(j)=>{idx=j};if(false)"),ctx);ctx.window.__idx(idx);
const A=ctx.window.__STORYWORLD_APPROVED_MOBS_R380__,S=ctx.window.__STORYWORLD_STORY_COMBAT_R54__;
const d1=ctx.makeRoom('dist01','STORY');const names=d1.enemies.map(e=>e.name);
ok(!names.includes('망각의 거미 1')&&!names.includes('망각의 거미 증원 2')&&names.includes('재 나방 1')&&names.includes('보랏빛 알집지기 1'),'dist01 일반 망각의 거미를 승인 종으로 개명');ok(d1.enemies.length===7,'dist01 몹 수 그대로(R81 3×10 계약)');ok(names.includes('중간보스 · 망각의 거미')&&names.includes('망각의 거미 수호자'),'중간보스·R81 수호자는 남김(세이브 복원 보호, Codex P1)');
ok(ctx.makeRoom('dist01','DREAM').enemies.length===7,'DREAM 층은 그대로');
const u=ctx.makeRoom('u202','STORY');const mech=u.enemies.filter(e=>e.r380Mech);ok(mech.length===4&&mech.every((e,i)=>e.name==='기계화 망각거미 '+(i+1)),'u202 에 기계화 망각거미 4마리');
ok(mech[0].r248Key==='가짜 자비 수집가','개명해도 R248 조회 키 유지(Codex P1)');ok(u.enemies.length===7&&mech.every(e=>!/r380/.test(e.id))&&mech[0].r380From==='가짜 자비 수집가 1','u202 몹 수·id 그대로, 이름만 바꿈(R81 계약)');
ok(new Set(u.enemies.map(e=>e.id)).size===u.enemies.length,'고유 id');
const u2=ctx.makeRoom('u202','STORY');ok(JSON.stringify(u2.enemies.filter(e=>e.r380Mech).map(e=>e.id))===JSON.stringify(mech.map(e=>e.id)),'다시 만들어도 같은 결과');
// R383 밸런스
const d02=ctx.makeRoom('dist02','STORY'),d03=ctx.makeRoom('dist03','STORY'),b07=ctx.makeRoom('ep1b07','STORY'),d00=ctx.makeRoom('dist00','STORY');
ok(d02.enemies.filter(e=>/^뿌리 추적자/.test(e.name)).length===2&&d02.enemies.every(e=>e.r74Monster===undefined),'늪: 뿌리 추적자 그대로, R74 그림 대신 다크그린 시트(r74Monster 지움)');
ok(d03.enemies.length===3&&!d03.enemies.some(e=>/뿌리 추적자/.test(e.name))&&d03.enemies[1].name==='쓰러진 수호병'&&d03.enemies[2].name==='쓰러진 수호병 우두머리'&&d03.enemies[1].maxHp===50&&d03.enemies[1].id==='dist03:r74-patrol:0'&&d03.enemies[1].r248Key==='쓰러진 수호병','다른 맵: 뿌리 추적자 순찰 → 그 지역 몹 이름(수·id·수치 그대로)');
ok(b07.enemies[1].name==='분노의 사냥개'&&b07.enemies[2].name==='분노의 사냥개 우두머리'&&b07.enemies[0].name==='불 속의 그림자 1'&&b07.enemies[1].r248Key==='유리 망령'&&b07.enemies[1].r74Monster===undefined,'ep1b07: 순찰 → 분노의 사냥개(공격 효과 키 보존)');
const roots=d00.enemies.filter(e=>e.r383Added);ok(roots.length===6&&roots.every((e,i)=>e.id==='dist00:r383-root:'+i&&e.name==='뿌리 추적자'&&e.maxHp===50&&e.r75Pack===undefined&&e.r74Monster===undefined)&&d00.enemies[0].boss,'dist00: 늪 순찰 수치로 뿌리 추적자 6마리 추가, 정규 무리 밖');
ok(roots.every(e=>!e.squadLeaderR373&&!e.squadR373&&e.r373Slot===undefined&&e.damage===10&&e.maxHp===50),'분대 우두머리·분대 자리를 물려받지 않음(Codex P2)');
ok(b07.enemies[2].r373Name==='분노의 사냥개'&&d03.enemies[2].r373Name==='쓰러진 수호병','R373 그릴 때 이름(r373Name)도 같이 바꿈(Codex P2)');
ok(roots.every(e=>r61.some(([id,o])=>id===e.id&&o.preserveHealth&&o.preserveDamage)),'추가한 뿌리 추적자를 R61 정규화에 수치 보존으로 등록(Codex P2)');
ok(roots.every(e=>Math.hypot(e.x-1.5,e.y-1.5)>9&&Math.hypot(e.x-3,e.y-3)>7),'입구·보스와 떨어진 자리');
ok(JSON.stringify(ctx.makeRoom('dist00','STORY').enemies.map(e=>[e.x,e.y]))===JSON.stringify(d00.enemies.map(e=>[e.x,e.y])),'dist00 다시 만들어도 같은 자리');
ok(ctx.makeRoom('dist03','DREAM').enemies.some(e=>e.name==='뿌리 추적자'),'DREAM 층은 그대로');
ctx.room={id:'dist00'};ok(S.frameFor({id:'r0',name:'뿌리 추적자',hp:10,x:3,y:0},null)?.r380Mob==='root-stalker-r74-plain','dist00 뿌리 추적자 → R74 그림 재묶음 시트');
ctx.room={id:'ep1b07'};ok(S.frameFor({id:'w0',name:'분노의 사냥개 우두머리',hp:10,x:3,y:0},null)?.r380Mob==='wrath-hound-v1','ep1b07 분노의 사냥개 시트');ctx.room={id:'dist01'};
const f=(o)=>S.frameFor({id:Math.random()+'',hp:10,x:3,y:0,...o},null);
{const a9=ctx.makeRoom('ep1a09','STORY'),sy=a9.enemies.filter(e=>e.r387Syringe);ok(sy.length===1&&sy[0].id==='ep1a09:r387-syringe-boss'&&sy[0].name==='중독을 부르는 주사기 환영체'&&sy[0].midboss===true&&!sy[0].boss&&sy[0].maxHp===36355&&sy[0].hp===36355&&sy[0].r383Added===true&&sy[0].r248Key===undefined,'R387 주사실에 주사기 환영체 중간보스 1(ep1a10 우두머리 수치, 계약 제외 표시)');
 ok(Math.abs(Math.hypot(sy[0].x-15,sy[0].y-13)-4)<.8&&Math.hypot(sy[0].x-19.5,sy[0].y-19.5)>1.5&&sy[0].spawnState==='active','제단 4칸 둘레의 빈 칸, 처음부터 보임(다른 몹과 겹치지 않음)');
 ok(r61.some(([id,o])=>id==='ep1a09:r387-syringe-boss'&&o.preserveHealth),'R61 등록');
 ok(ctx.makeRoom('ep1a09','STORY').enemies.filter(e=>e.r387Syringe).length===1&&ctx.makeRoom('ep1a09','DREAM').enemies.every(e=>!e.r387Syringe)&&ctx.makeRoom('ep1a10','STORY').enemies.filter(e=>e.midboss).length===1,'다시 만들어도 1마리, DREAM·다른 지역 그대로');}
ctx.room={id:'ep1a09'};ok(f({name:'중독을 부르는 주사기 환영체',midboss:true})?.r380Mob==='syringe-phantom-boss-v1','R387 주사기 환영체 시트');ctx.room={id:'dist01'};
{ctx.layer='DREAM';ctx.room={id:'cult03'};const H=['hwando','michaela','seoha','lauren','neon','hunter','gunner','slayer'];
 ok(H.every(h=>{ctx.player={x:0,y:0,hero:h};return f({name:'페르소나',boss:true})?.r380Mob==='persona-'+h+'-w';}),'R389 사몽 페르소나 보스 = 지금 영웅의 페르소나 W 시트(8영웅)');
 ctx.player={x:0,y:0,hero:'hwando'};const e={id:'pz',name:'페르소나',boss:true,hp:10,x:3,y:0};ok(S.frameFor(e,null)?.r380Mob==='persona-hwando-w','R389 같은 몹 환도');ctx.player.hero='neon';ok(S.frameFor(e,null)?.r380Mob==='persona-neon-w','R389 영웅이 바뀌면 다시 고름');
 {ctx.player.hero='hwando';const seen=new Set();let other=0;for(let i=0;i<16;i++){const c={id:'sm103:S-07:a:'+i,name:'여섯 물건의 그림자',samongR103:'sz115-S07-'+(i%3+1),hp:5,x:2,y:1};const m=S.frameFor(c,null)?.r380Mob;if(m)seen.add(m);if(c.name!=='페르소나 분신'||c.r248Key!=='여섯 물건의 그림자')other++;}
  ok(seen.size===8&&[...seen].every(m=>m.startsWith('persona-clone-')),'R389 S-07 그림자 16마리 → 분신 8종 고르게('+seen.size+')');ok(other===0,'R389 분신 이름 바뀌고 R248 열쇠는 원래 이름');
  const w={id:'sm103:S-05:a:3',name:'여섯 물건의 그림자',samongR103:'sz115-S05-2',hp:5,x:2,y:1};ok(!S.frameFor(w,null)?.r380Mob&&w.name==='여섯 물건의 그림자','R389 다른 장 같은 이름은 그대로');
  for(const z of ['sz162-S-07-B','sz162-S-07-D','sz173-S-07-G']){const g={id:'sm103:k:t:5',name:'여섯 물건의 그림자',samongR103:z,hp:5,x:2,y:1};ok(S.frameFor(g,null)?.r380Mob==='persona-clone-'+['hwando','michaela','seoha','lauren','neon','hunter','gunner','slayer'][5],'R389 '+z+' 도 분신');}
  {const seen=new Set(),nm=new Set();for(const i of [0,1,2,9,10,11,18,19,20]){const c={id:'sm103:S-06:a:'+i,name:'외계 침공군',samongR103:'sz115-S06-'+(i%4+1),hp:5,x:2,y:1};seen.add(S.frameFor(c,null)?.r380Mob);nm.add(c.name);}
   ok(seen.size===3&&[...seen].every(m=>/^dys-(scythe|sacshell|membrane)-v1$/.test(m))&&nm.has('낫팔 잠복체')&&nm.has('막익 급습체'),'R390 S-06 외계 침공군 → 일반몹 3종');
   const el=[0,1].map(i=>{const c={id:'sm103:S-06:e:'+i,name:'외계 침공군 · 짙은 형상',samongR103:'sz115-S06-1',hp:5,x:2,y:1};return [S.frameFor(c,null)?.r380Mob,c.name];});
   ok(el[0][0]==='dys-cleaver-v4'&&el[1][0]==='dys-behemoth-v1'&&el[0][1]==='전선 절단자 · 짙은 형상','R390 짙은 형상 정예 → 절단자·연산거수 번갈아');
   {let loaded=false;ctx.window.__STORYWORLD_SAMONG_SHADES_R200__={inspect:()=>({prefs:{on:true},loaded}),assign:e=>{e.r200Checked=true;if(/:7$/.test(e.id)){e.r200Shade='hound';e.name='변이된 사냥개 괴수';}}};
    const h={id:'sm103:S-06:a:7',name:'외계 침공군',samongR103:'sz115-S06-1',hp:5,x:2,y:1},k={id:'sm103:S-06:a:11',name:'외계 침공군',samongR103:'sz115-S06-1',hp:5,x:2,y:1};
    ok(!S.frameFor(h,null)?.r380Mob&&h.name==='외계 침공군'&&!h.r380Checked,'R390 R200 목록을 아직 못 읽었으면 기다림(이름 안 바꿈)');loaded=true;
    ok(!S.frameFor(h,null)?.r380Mob&&h.name==='변이된 사냥개 괴수','R390 R200 이 그림자로 바꾼 몹은 건드리지 않음(경합 없음)');ok(S.frameFor(k,null)?.r380Mob==='dys-membrane-v1'&&k.name==='막익 급습체','R390 R200 이 남긴 외계 침공군만 새 3종');delete ctx.window.__STORYWORLD_SAMONG_SHADES_R200__;}
   {const t=(n,z,b)=>{const c={id:'sm103:x:a:1',name:n,samongR103:z,hp:5,x:2,y:1,boss:!!b};return S.frameFor(c,null)?.r380Mob||null;};
    ok(t('포구 검은 안개','sz115-S01-4')==='samong-m065-v3'&&t('사몽:부정의 잔영','sz115-S01-4')==='samong-m066-v3'&&t('66 수문장','sz115-RG-7')==='samong-m097-v3','R391 m065·m066·m097 사몽 몹');
    ok(t('봉합부인','sz115-S01-5',true)==='samong-hostess-boss-v1'&&S.frameFor({id:'sm103:x:a:2',name:'종이 형상 3',samongR103:'sz115-RF-2',hp:5,x:2,y:1},null)?.r380Mob==='samong-paper-figure-v1','R391 봉합부인 보스·종이 형상');
    ok(t('상대 초인','sz115-S06-5',true)==='s06-rival-v1'&&t('적 지휘 개체','sz115-S06-3',true)==='s06-commander-v1'&&t('순찰자','sz115-S02-8',true)==='samong-patroller-boss-v1'&&t('순찰자','sz115-RA-4',true)==='samong-patroller-boss-v1','R392 S-06 두 우두머리·열쇠 순찰자 보스');
    {const g=(n,z,x)=>{const c={id:'sm103:x:b:1',name:n,samongR103:z,hp:5,x,y:0,boss:true};return S.frameFor(c,null)||{};};
     const l=g('백색 손님','sz115-RB-6',2),r=g('백색 손님','sz115-RB-6',-2),j=g('재판관','sz115-RC-3',2),j2=g('재판관','sz115-RC-3',-2);
     ok(l.r380Mob==='reverse-m086-v4-right'&&l.r380Sheet==='reverse-m086-v4-left'&&l.flip===false&&r.r380Sheet==='reverse-m086-v4-right'&&r.flip===false,'R393 RB-6 백색 손님 v4 좌우 따로 그린 시트(뒤집지 않음)');
     ok(j.r380Mob==='reverse-m089-v4-right'&&j.r380Sheet==='reverse-m089-v4-left'&&j.flip===false&&j2.r380Sheet==='reverse-m089-v4-right','R393 RC-3 재판관 v4 좌우 시트');
     {const w=g('백색 사수','sz115-RE-3',2),w2=g('백색 사수','sz115-RE-3',-2);ok(w.r380Mob==='reverse-m093-v1-right'&&w.r380Sheet==='reverse-m093-v1-left'&&w.flip===false&&w2.r380Sheet==='reverse-m093-v1-right'&&!g('백색 사수','sz115-RE-4',2).r380Mob,'R394 RE-3 백색 사수 좌우 시트, 다른 구역 그대로');}
     ok(!g('백색 손님','sz115-RB-5',2).r380Mob&&!g('재판관','',2).r380Mob&&idx.mobs.filter(m=>/-left$/.test(m.id)).every(m=>m.actor.layer==='NONE'),'R393 다른 구역·본편 그대로, 왼쪽 시트는 직접 배정 안 됨');}
    {const u=(n,z,i)=>{const c={id:'sm103:R:a:'+i,name:n,samongR103:z,hp:5,x:2,y:1};const m=S.frameFor(c,null)?.r380Mob||null;return [m,c.name,c.r248Key];};
     const a=u('종이 형상 2','sz115-RF-1',3),b=u('종이 형상','sz115-RF-3',4),c=u('막힌 이름들','sz115-RG-3',4),d=u('막힌 이름들','sz115-RG-3',5),e=u('종이 형상','sz162-RF-B',7),f=u('막힌 이름들','sz115-RA-2',4);
     ok(a[0]==='reverse-rf-merit-scale-v1'&&a[1]==='비극 계량체'&&a[2]==='종이 형상'&&b[0]==='samong-paper-figure-v1'&&b[1]==='종이 형상','R395 RF 종이 형상 절반 → 비극 계량체(R248 열쇠는 원래 이름), 나머지는 종이 형상');
     ok(c[0]==='reverse-rg-gear-mite-v1'&&c[1]==='인과 고리충'&&d[0]===null&&d[1]==='막힌 이름들'&&e[0]==='reverse-rf-merit-scale-v1'&&f[0]===null,'R395 RG 막힌 이름들 절반 → 인과 고리충, 광장(sz162) 포함, 다른 장 그대로');}
    {const u=(n,z,i)=>{const c={id:'sm103:Q:a:'+i,name:n,samongR103:z,hp:5,x:2,y:1};return [S.frameFor(c,null)?.r380Mob||null,c.name];};
     const g1=u('뿌리에서 쏟아진 잔영','sz115-S01-2',3),g0=u('뿌리에서 쏟아진 잔영','sz115-S01-2',4),gp=u('뿌리에서 쏟아진 잔영','sz115-P-1',5);
     ok(g1[0]==='samong-s01-gardener-v1'&&g1[1]==='봉합 정원사 인형'&&g0[0]===null&&g0[1]==='뿌리에서 쏟아진 잔영'&&gp[0]===null,'R396 S-01 뿌리 잔영 절반 → 봉합 정원사 인형, 다른 장 그대로');
     const w=[0,1,2].map(i=>u('찢긴 호외의 잔향','sz115-S05-2',i)),we=u('찢긴 호외의 잔향 · 짙은 형상','sz162-S-05-B',0);
     ok(w[0][0]==='samong-s05-wraith-jihyeon-v2'&&w[1][0]==='samong-s05-wraith-officer-v2'&&w[2][0]===null&&w.every(x=>x[1]==='찢긴 호외의 잔향')&&we[0]===null,'R396 S-05 호외 잔향 셋 중 둘 → 경성의 밤 망령 2종(이름 그대로), 짙은 형상 그대로');}
    {const v=(sh,nm,z)=>{const c={id:'sm103:V:a:1',name:nm,samongR103:z,hp:5,x:2,y:1,r200Checked:true};if(sh)c.r200Shade=sh;return [S.frameFor(c,null)?.r380Mob||null,c.name];};
     const a=v('insomnia-patient','불면병동 무안 환자','sz115-S04-3'),b=v('gilded-hollow','금박 박제 망자','sz115-S04-6'),c=v('diner-ghoul','화형식당 앞치마 식객','sz162-S-04-B'),d=v('applause-shade','박수치는 객석의 잔영','sz115-S04-3'),f=v(null,'불면병동 무안 환자','sz115-S04-3');
     ok(a[0]==='r200-insomnia-patient-v2'&&b[0]==='r200-gilded-hollow-v2'&&c[0]==='r200-diner-ghoul-v2'&&a[1]==='불면병동 무안 환자','R397 R200 S-04 그림자 3종 → 복원 시트(이름 그대로)');
     ok(d[0]===null&&f[0]===null,'R397 다른 그림자·그림자 아닌 몹은 그대로');}
    {const v=(sh,nm,z,i,x)=>{const c={id:'sm103:W:a:'+(i||1),name:nm,samongR103:z,hp:5,x:x||2,y:1,r200Checked:true};if(sh)c.r200Shade=sh;const f=S.frameFor(c,null)||{};return [f.r380Mob||null,c.name,f.r380Sheet,f.flip];};
     ok(v('sun-patrol','검은 태양의 학교 순찰자','sz115-S02-3')[0]==='r200-sun-patrol-v2'&&v('stitched-golem','기운 누더기 골렘','sz115-S01-2')[0]==='r200-stitched-golem-v2'&&v('mannequin','식탁의 마네킹 잔영','sz115-S01-2')[0]===null,'R398 R200 태양 순찰자·누더기 골렘 → 새 시트, 마네킹 그대로');
     const a=v(null,'관람석의 시선','sz115-RC-2',5,2),b=v(null,'관람석의 시선','sz115-RC-2',4),c=v(null,'관람석의 시선','sz115-RD-2',3);
     ok(a[0]==='reverse-rc-stamp-v1-right'&&a[1]==='재주문 도장체'&&a[2]==='reverse-rc-stamp-v1-left'&&a[3]===false&&b[0]===null&&c[0]===null,'R398 RC 관람석의 시선 절반 → 재주문 도장체(좌우 시트), 다른 장 그대로');}
    {const st=idx.mobs.filter(m=>/^reverse-rc-stamp-v1-/.test(m.id));ok(st.length===2&&st.every(m=>m.cols===4&&JSON.stringify(m.move)===JSON.stringify(m.attack)),'R399 도장 v4: 이동에도 같은 방향 공격 4장(그림만, 공격 판정은 엔진 그대로)');}
    {const u=(z,i)=>{const c={id:'sm103:P:a:'+i,name:'뿌리에서 쏟아진 잔영',samongR103:z,hp:5,x:2,y:1};return [S.frameFor(c,null)?.r380Mob||null,c.name];};
     const a=u('sz115-P-1',0),b=u('sz115-P-2',1),c=u('sz162-P-D',2),d=u('sz115-S01-2',0);
     ok(a[0]==='samong-p-root-grasper-v1'&&a[1]==='검은 뿌리 포획체'&&b[0]==='samong-p-footstep-remnant-v1'&&b[1]==='발소리 추적 잔영'&&c[0]===null&&c[1]==='뿌리에서 쏟아진 잔영'&&d[0]===null,'R400 문턱 뿌리 잔영 셋 중 둘 → 검은 뿌리 포획체·발소리 추적 잔영, S-01 은 그대로(정원사 몫)');}
    {const v=(nm,z,i,x)=>{const c={id:'sm103:X:a:'+i,name:nm,samongR103:z,hp:5,x:x||2,y:1,r200Checked:true};const f=S.frameFor(c,null)||{};return [f.r380Mob||null,c.name,f.r380Sheet,f.flip];};
     const ra=v('붉은 교정 표시','sz115-RA-2',0),ra1=v('붉은 교정 표시','sz115-RA-2',1),rb=v('정해진 시각에 도착하지 못한 발자국','sz162-RB-B',2),rc=v('관람석의 시선','sz115-RC-2',0,2),rc1=v('관람석의 시선','sz115-RC-2',1),rd=v('서로의 결말을 먹는 도시','sz115-RD-1',4,2),re=v('다음 자리를 노리는 사격','sz115-RE-2',0,2),rx=v('붉은 교정 표시','sz115-RB-2',0);
     ok(ra[0]==='reverse-ra-new-v1'&&ra[1]==='녹슨 개찰구 수집체'&&ra1[0]===null&&rb[0]==='reverse-rb-new-v1'&&rb[1]==='세 번째 잔의 강요체'&&rc[0]==='reverse-rc-new-v1-right'&&rc[1]==='금박 유리관 수확기'&&rc[2]==='reverse-rc-new-v1-left'&&rc1[0]==='reverse-rc-stamp-v1-right'&&rd[0]==='reverse-rd-new-v1-right'&&rd[1]==='결말 접합체'&&rd[2]==='reverse-rd-new-v1-left'&&re[0]==='reverse-re-new-v1-right'&&re[1]==='허위 승전 훈장막'&&re[2]==='reverse-re-new-v1-left'&&rx[0]===null,'R401 역행 RA~RE 신규 5종: 장 기본몹 절반(RC 는 셋 중 하나, 도장체 몫 유지), RC·RD·RE 왼쪽 시트, 다른 장 이름은 그대로');}
    {const v=(nm,z,b)=>{const c={id:'sm103:Y:a:3',name:nm,samongR103:z,hp:5,x:2,y:1,r200Checked:true};if(b)c.boss=true;return (S.frameFor(c,null)||{}).r380Mob||null;};
     const pt=idx.mobs.find(m=>m.id==='samong-patroller-boss-v1'),rv=idx.mobs.find(m=>m.id==='s06-rival-v1');
     ok(v('얼굴 없는 학생','sz115-S02-2')==='samong-s02-student-v1'&&v('얼굴 없는 학생 2','sz162-S-02-B')==='samong-s02-student-v1'&&v('얼굴 없는 학생 · 짙은 형상','sz162-S-02-B')==='samong-s02-student-v1'&&v('얼굴 없는 학생','sz115-S03-2')===null&&v('스토리텔러','sz115-RF-5',true)==='samong-rf-storyteller-v1'&&v('스토리텔러','sz115-RG-5',true)===null&&pt.cols===8&&pt.move.join()==='0,1,2,3'&&pt.attack.join()==='4,5,6,7'&&rv.move.join()==='0,1,2,3','R402 S-02 학생 이동4+공격4, RF 스토리텔러, 순찰자 v4 걷기 4칸(정적 1칸 대신)');}
    {const v=(i)=>{const c={id:'sm103:Z:a:'+i,name:'외계 침공군',samongR103:'sz115-S06-2',hp:5,x:2,y:1,r200Checked:true};const f=S.frameFor(c,null)||{};return [f.r380Mob||null,c.name];};
     const r=[0,1,2,3,4,5,6,7,8].map(v),o=v(9);
     ok(r[0][1]==='낫팔 잠복체'&&r[1][1]==='포낭 곡사체'&&r[2][1]==='막익 급습체'&&r[3][0]==='dys-bulwark-v2'&&r[3][1]==='방벽 돌진체'&&r[4][0]==='dys-disc-v2'&&r[5][0]==='dys-engineer-v2'&&r[6][0]==='dys-pulse-raider-v2'&&r[6][1]==='펄스 척후병'&&r[7][0]==='dys-prism-stalker-v2'&&r[8][0]==='dys-siege-gunner-v2'&&o[1]==='낫팔 잠복체','R403 S-06 외계 침공군 9칸: R390 3종 각 1/9 + 특수3·레이저3 각 1/9');
     const lz=idx.mobs.find(m=>m.id==='dys-pulse-raider-v2');ok(lz.move.join()==='0'&&lz.attack.join()==='0,1,2,3','R403 레이저총: 보행 HOLD → 조준 자세 1칸 이동, 사격 4칸');}
{const sv={layer:ctx.layer,room:ctx.room};ctx.layer='STORY';const g=(room,name)=>{ctx.room={id:room};return f({name})?.r380Mob||'base';};
 ok(g('kair10','상위수문장 58')==='legacy-m106-elite-guardian-v2'&&g('kair02','시간수문장 46')==='legacy-m110-time-guardian-v3'&&g('hando02','무명 검흔 추격대')==='legacy-m119-nameless-scar-v4'&&g('hando03','백은 없는 그림자')==='legacy-m124-silverless-shadow-v4'&&g('cult01','세뇌 신호 점액체 추격대')==='legacy-m130-slime-cult01-v2'&&g('cult05','ID 배양 점액체 증원')==='legacy-m130-slime-cult05-v2'&&g('cult05','생체기계 악몽')==='legacy-m134-nightmare-v4','R404 레거시 6종: 현 게임 group 표기 방·이름에 연결');
 ok(g('kair02','상위수문장 58')==='base'&&g('cult01','생체기계 악몽')==='base'&&g('hando02','백은 없는 그림자')==='base','R404 다른 방 같은 이름은 그대로');
 ctx.layer=sv.layer;ctx.room=sv.room;}
    ok(t('상대 초인','sz115-S07-1',true)===null&&t('순찰자','',true)===null,'R392 다른 장·본편은 그대로');
    ok(t('포구 검은 안개','')===null&&t('봉합부인','',true)===null,'R391 사몽 밖(본편) 같은 이름은 그대로');}
   ok(fs.readFileSync(path.join(R,'client-source','art-drive-r105.js'),'utf8').includes('__STORYWORLD_APPROVED_MOBS_R380__?.assign?.(e)?null:artFor(e)'),'R391 R105 정적 그림이 승인 시트 위에 겹치지 않음');
   const o={id:'u204:7',name:'외계 침공군',hp:5,x:2,y:1};ok(!S.frameFor(o,null)?.r380Mob&&o.name==='외계 침공군','R390 사몽 밖 외계 침공군은 그대로');}
  const st={id:'x1',name:'여섯 물건의 그림자',hp:5,x:2,y:1};ok(!S.frameFor(st,null)?.r380Mob,'R389 사몽 표식 없는 몹은 그대로');}
 ok(f({name:'페르소나의 그림자',boss:true})?.path==='base'&&f({name:'백은 없는 그림자'})?.path==='base','R389 다른 이름·졸개는 그대로');
 ok(idx.mobs.filter(m=>/-w$/.test(m.id)&&m.id.startsWith('persona-')).length===8&&idx.mobs.filter(m=>m.id.startsWith('persona-')&&!m.id.startsWith('persona-clone-')).every(m=>m.facing==='left'&&m.actor.layer==='DREAM'&&m.actor.boss===true&&m.move.join()==='0,1,2,3'&&m.attack.join()==='4,5,6,7'),'R389 페르소나 시트: 왼쪽 보기, 보행4·공격4');
 ctx.layer='STORY';ctx.room={id:'cult03'};ok(f({name:'페르소나',boss:true})?.path==='base','R389 STORY 층은 그대로');ctx.room={id:'dist01'};ctx.player={x:0,y:0};}
ctx.room={id:'ep1b08'};ok(f({name:'중간보스 · 육망성의 흑마술 실험체'})?.r380Mob==='hexagram-experiment-m031-v1'&&f({name:'흑마법사의 저주창 1'})?.path==='base','R386 ep1b08 흑마술 실험체 m031 v1(다른 몹 그대로)');
ctx.room={id:'ep1a09'};ok(f({name:'유리 망령'})?.r380Mob==='glass-wraith-v1'&&f({name:'유리 망령 우두머리'})?.r380Mob==='glass-wraith-v1','R386 ep1a09 유리 망령 v1');
ctx.room={id:'ep1b02'};ok(f({name:'유리 망령'})?.path==='base','R386 다른 맵 유리 망령은 그대로');
ok(f({name:'나태에 잠식된 남자',boss:true})?.r380Mob==='sloth-burden-man-v1'&&f({name:'나태의 껍데기 파수',midboss:true})?.path==='base','R386 ep1b02 보스 나태 통합 남자 v1(중간보스 그대로)');ctx.room={id:'dist01'};
ok(f({name:'재 나방 2'})?.r380Mob==='ash-moth-v2','재 나방 v2');ok(f({name:'보랏빛 알집지기 증원 1'})?.r380Mob==='purple-eggkeeper-v1','알집지기');
ok(f({name:'거미줄에 묶인 수호병 우두머리'})?.r380Mob==='web-bound-guardian-v4','수호병 일반판');
ctx.window.__STORYWORLD_MOB_ART_VARIANTS_R306__={inspect:()=>({mode:'pixel'})};ok(f({name:'거미줄에 묶인 수호병'})?.r380Mob==='web-bound-guardian-v4-pixel','픽셀 모드 → 수호병 픽셀판');delete ctx.window.__STORYWORLD_MOB_ART_VARIANTS_R306__;
ctx.room={id:'u202'};ok(f({name:'기계화 망각거미 2'})?.r380Mob==='mech-oblivion-spider','u202 기계화 망각거미');ok(f({name:'가짜 자비 수집가 1'})?.path==='base','u202 다른 몹 그대로');
ctx.room={id:'dist02'};ok(f({name:'재 나방'})?.path==='base','dist01 밖 같은 이름은 그대로');ctx.room={id:'dist01'};
ok(f({name:'재 나방',boss:true})?.path==='base','보스 제외');
const m=idx.mobs.find(x=>x.id==='mech-oblivion-spider');const fr=A.frameOf({id:'a',hp:10,x:0,y:0,attack:{elapsed:.3,angle:0}},m);ok(m.attack.includes(Math.round(fr.assetFrame.sourceRect[0]/m.cell[0]+Math.round(fr.assetFrame.sourceRect[1]/m.cell[1])*m.cols)),'공격 칸(2줄 시트 좌표)');
ctx.player={x:-3,y:0};ok(A.frameOf({id:'b',hp:10,x:3,y:0},m).flip===true,'영웅 왼쪽 → 왼쪽 보기');
let got=null;ctx.spawnBurnDeath3=function(e){got=e.profile?.frames?.death;};A.installDeath();const prof={frames:{death:{path:'old'}}};const dz={id:'d',name:'재 나방',profile:prof,hp:0,x:1,y:1};ctx.spawnBurnDeath3(dz);
ok(got?.r380Mob==='ash-moth-v2'&&dz.profile===prof,'죽음 불꽃에 새 그림, profile 복원');
ok(idx.mobs.every(m=>Array.from({length:40},(_,i)=>A.cellFor({id:'probe'+i,hp:1,moving:i%2===1},m)).every(k=>Number.isInteger(k)&&k>=0)),'모든 시트 대기·이동 칸이 정수(한 장 이동 시트 포함, Codex P2)');
A.set({on:false});ok(f({name:'재 나방'})?.path==='base','끄기');
console.log(`R380 CPU ${n-bad}/${n}`);if(bad)process.exit(1);
