// R373 CPU check — 같은 종류 몹 분대(최대 7) + 분대장(우두머리, 체력·최대체력·공격력 ×1.6, 그림 1.15배). 정적 + 가짜 엔진.
//  node r96/qa/r373/r373-cpu-check.cjs
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..','..','..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,name,info)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+name+(info===undefined?'':' '+JSON.stringify(info).slice(0,240)));};
const RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const src=fs.readFileSync(path.join(R,'client-source','mob-squads-r373.js'),'utf8');
ok(RT('mob-squads-r373.js')===src,'runtime-text 사본 = client-source(sync)');
ok(/<script src="\.\/root-gate-video-r372\.js"><\/script><script src="\.\/mob-squads-r373\.js"><\/script>/.test(RT('index.html'))&&RT('index.html').split('mob-squads-r373.js').length===2,'스크립트 태그 한 번, R372 뒤');
ok(/node r96\/qa\/r373\/r373-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
const vp=fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8');ok(vp.includes("'mob-squads-r373.js',")&&!/\.js''/.test(vp),'공개 확인 목록(쉼표)');
ok(JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8')).textPaths.includes('mob-squads-r373.js'),'런타임 입력 목록');
function fake(rows,opt={}){const ctx={console,Math,JSON,Number,String,Map,Set,Array,Object,window:{},localStorage:{getItem:()=>opt.prefs||null,setItem(){}},
 blocked:(x,y)=>opt.wall?x>opt.wall:false,makeRoom:()=>({id:'z',enemies:rows.map(r=>({...r}))}),drawEnemy(e){ctx.drawn.push({name:e.name,ds:e.defScale});},drawn:[],tick(){},room:null,loading:false};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx);return ctx;}
const mob=(i,name,x,y,extra={})=>({id:'m'+String(i).padStart(2,'0'),name,x,y,hp:100,maxHp:100,damage:10,spawnState:'active',defScale:1,explorationGroup:'z:g',radius:.3,nativeId:'n:'+name.replace(/ \d+$/,''),...extra});
const rows=[];for(let i=0;i<9;i++)rows.push(mob(i,'뿌리 추적자 '+(i%3+1),5+i*4,5+(i%2)*20));for(let i=0;i<4;i++)rows.push(mob(20+i,'잿빛 사도',40+i*3,40));
rows.push(mob(30,'외톨이 몹',10,40),mob(31,'외톨이 몹',12,40));rows.push(mob(40,'뿌리 추적자 1',60,60,{boss:true}),mob(41,'뿌리 추적자 2',61,61,{spawnState:'hidden'}),mob(42,'뿌리 추적자 3',62,62,{wardChampionR81:true}));
{const c=fake(rows),r=c.makeRoom('z'),A=c.__STORYWORLD_MOB_SQUADS_R373__;const before=JSON.stringify(r.enemies.map(e=>[e.x,e.y]));c.room=r;c.tick();ok(JSON.stringify(r.enemies.map(e=>[e.x,e.y]))!==before&&!r.r373MovePending,'지금 방이 된 첫 틱에 한 번 모음(만들 때는 자리 그대로 — 미리 만드는 지역은 싸게)');const sq=new Map();for(const e of r.enemies)if(e.squadR373){if(!sq.has(e.squadR373))sq.set(e.squadR373,[]);sq.get(e.squadR373).push(e);}
 const sizes=[...sq.values()].map(v=>v.length);ok(sq.size===4&&sizes.every(x=>x===6),'분대는 모두 6마리(추적자 9→12=2분대, 사도 4→6, 외톨이 2→6 — 모자란 만큼 같은 종류 복제)',sizes);
 ok(r.enemies.filter(e=>e.r373Clone).length===3+2+4&&r.enemies.filter(e=>e.r373Clone).every(e=>/:r373c\d+$/.test(e.id)&&e.hp===e.maxHp),'복제는 결정적 id·가득 찬 체력');
 ok([...sq.values()].every(v=>v.filter(e=>e.squadLeaderR373).length===1),'분대마다 분대장 한 마리');
 const L=r.enemies.filter(e=>e.squadLeaderR373);ok(L.every(e=>e.hp===160&&e.maxHp===160&&e.damage===16),'분대장 체력·최대체력·공격력 ×1.6',L.map(e=>[e.hp,e.damage]));
 ok(L.map(e=>e.name).sort().join()==='뿌리 추적자 우두머리,뿌리 추적자 우두머리,외톨이 몹 우두머리,잿빛 사도 우두머리','이름 = 종류 이름 + 우두머리(끝 번호 뗌)',L.map(e=>e.name));
 ok([...sq.values()].every(v=>{const c0=v.find(e=>e.squadLeaderR373);return v.every(e=>Math.hypot(e.x-c0.x,e.y-c0.y)<=4.2&&e.homeX===e.x&&e.homeY===e.y);}),'분대원은 분대장 둘레(4.2칸 안)에 모이고 집 자리도 그곳');
 ok([...sq.values()].every(v=>new Set(v.map(e=>e.explorationGroup)).size===1),'분대마다 무리 이름 하나');
 const untouched=r.enemies.filter(e=>['m40','m41','m42'].includes(e.id));ok(untouched.every(e=>!e.squadR373&&!e.squadLeaderR373&&e.hp===100),'보스·숨은 몹·챔피언은 그대로');
 {const orig=r.enemies.filter(e=>!e.r373Clone).map(e=>e.id),first=new Map();for(const e of r.enemies)if(!e.boss&&!e.wardChampionR81&&e.nativeId&&!first.has(e.nativeId))first.set(e.nativeId,e);
  ok(JSON.stringify(orig)===JSON.stringify(rows.map(e=>e.id))&&r.enemies.slice(orig.length).every(e=>e.r373Clone),'원래 몹 순서 그대로, 복제는 맨 끝');
  ok(r.enemies.filter(e=>e.squadLeaderR373).every(l=>first.get(l.nativeId)!==l)&&first.size>0,'우두머리는 nativeId 첫 몹(챔피언 기준)이 아님');}
 const nonLead=r.enemies.filter(e=>e.squadR373&&!e.squadLeaderR373);ok(nonLead.every(e=>e.hp===100&&e.damage===10),'분대원 수치는 그대로');
 ok(r.enemies.filter(e=>e.squadLeaderR373&&e.r248Key===undefined).length===4,'(R248 표 없음) 열쇠는 표에 있을 때만 고정');
 const l0=L[0];c.drawEnemy(l0);const d=c.drawn.at(-1);ok(/^뿌리 추적자 \d$|^잿빛 사도$/.test(d.name)&&Math.abs(d.ds-1.15)<1e-9&&l0.name.endsWith('우두머리')&&l0.defScale===1,'그릴 때만 원래 이름·1.15배, 그린 뒤 되돌림',d);
 const again=c.makeRoom('z');c.room=again;c.tick();ok(JSON.stringify(again.enemies.map(e=>[e.id,e.x,e.y,e.name]))===JSON.stringify(r.enemies.map(e=>[e.id,e.x,e.y,e.name])),'같은 입력이면 같은 분대·자리(불러오기 일관)');
 const third=c.makeRoom('z');const m=third.enemies.find(e=>e.squadR373&&!e.squadLeaderR373);m.x+=3;const mx=m.x;c.room=third;c.tick();ok(m.x===mx,'저장에서 다른 자리로 불러온 몹은 옮기지 않음');}
{const c=fake(rows,{wall:30}),r=c.makeRoom('z');ok(r.enemies.filter(e=>e.squadR373&&e.x<=30).every(e=>e.x<=30),'막힌 칸으로는 옮기지 않음');}
{const c=fake(rows,{prefs:'{"on":false}'}),r=c.makeRoom('z');ok(!r.enemies.some(e=>e.squadR373),'끄기 설정');}
{const c=fake(rows);c.__STORYWORLD_R81_EGO_BUILD__=true;const r=c.makeRoom('z');ok(!r.enemies.some(e=>e.squadR373||e.r373Clone),'EGO 재방문 빌드는 V4 배치 그대로(legacy-scope)');}
{const c=fake(rows),r=c.makeRoom('z');const L=r.enemies.filter(e=>e.squadLeaderR373);ok(L.every(e=>e.r373Base&&Math.abs(e.maxHp-e.r373Base.maxHp*1.6)<1e-9&&Math.abs(e.damage-e.r373Base.damage*1.6)<1e-9),'우두머리 원래 수치(r373Base) 기록 — 고정 계약 검사가 ×1.6 을 정확히 확인');}
console.log(JSON.stringify({ok:!bad,checks:n,method:'static+fake-engine'}));process.exit(bad?1:0);
