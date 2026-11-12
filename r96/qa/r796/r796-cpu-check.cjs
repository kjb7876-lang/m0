// R796 CPU 검사: 서사 NPC 와 주고받는 한두 마디 — 사용자 2026-11-12 "서사대화할때 한두마디정도 주고받을 수 있는 2-3개 선택지도 만들어줘
//  답변 잘못고르면 npc가 질책하면서 몹이 몇마리소환되고 다시 대화를 해야하는 이런식으로 서사를 바꾸지는 말고".
//  ① 정상: 창에 인물의 한마디와 답 셋(맞는 답 1 + 틀린 답 2) + '아직'. 맞는 답 = 지금까지의 받기. 틀린 답 = 꾸짖음 + 일반 몹 셋 + 관문 유지.
//  ② 경계: 몹이 남아 있으면 다시 말 못 검, 다 잡으면 다시 창, 45초 뒤 물러남, 본뜰 몹이 없으면 꾸짖음만, 길잡이는 창 없이 맞는 답.
//  ③ 회귀: 서사·단계·세이브 낱말은 그대로(갈래 없음), 불면귀 핵 봉인 유지, 보스·중간보스는 본뜨지 않음.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const J=v=>v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v,ok=(c,m)=>{assert.ok(c,m);n++;},eq=(a,b,m)=>{assert.deepStrictEqual(J(a),J(b),m);n++;};
const src=fs.readFileSync(path.join(R,'client-source','npc-r790.js'),'utf8');
{const y=fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').split('\n'),i=y.findIndex(l=>l.includes('node r96/qa/r796/r796-cpu-check.cjs'));ok(i>0,'pages.yml CPU 검사 줄');ok(/^\s+- name: /.test(y[i-1])&&!y[i-1].replace(/^\s+- name: /,'').includes(': '),'pages.yml 단계 이름에 콜론+빈칸 없음');}
ok(fs.readFileSync(path.join(R,'runtime-text','npc-r790.js'),'utf8')===src,'runtime-text 사본이 같다');
const h791=fs.readFileSync(path.join(__dirname,'../r791/r791-cpu-check.cjs'),'utf8'),a=h791.indexOf('function world('),b=h791.indexOf("\n{const w=world();ok(w.api.zones()");ok(a>0&&b>a,'R791 검사 틀을 찾음');
const world=new Function('vm','src','J','return '+h791.slice(a,b).trim())(vm,src,J);
const ZONES={last303:['door','gwibitang'],last305:['exit','roseSeal'],ep1a10:['exit','askedHelp'],ep1a11:['exit','heardWorlds'],ep1b05:['door','permission'],murder04:['door','toldTruth']};
const MOBS="room.enemies.push({id:'m1',name:'주민',profile:{k:1},combatProfile:{aggro:6,rows:[1]},hp:0,maxHp:200,deadRecorded:true,spawnState:'dead',x:9,y:9,rc144x:1,nav:[1]},{id:'m2',name:'분대장',profile:{k:2},squadLeaderR373:true,hp:0,maxHp:320,deadRecorded:true,x:9,y:9},{id:'mb',name:'중간보스',midboss:true,profile:{k:3},hp:0,maxHp:900,x:9,y:9});";
const at=ph=>ph==='door'?'player.x=20;player.y=22;':'player.x=15;player.y=14.5;';
const W=(z,o)=>{const w=world({zoneId:z,phase:ZONES[z][0],...o});w.run(MOBS+'tick(.1);'+at(ZONES[z][0]));return w;};
const live=w=>w.run("room.enemies.filter(e=>e.r796Summon&&e.hp>0).map(e=>({id:e.id,hp:e.hp,maxHp:e.maxHp,x:e.x,y:e.y,name:e.name,dead:e.deadRecorded,st:e.spawnState,ag:e.combatProfile&&e.combatProfile.aggro,nav:e.nav,rc:e.rc144x,lead:e.squadLeaderR373}))");
// ── ① 모든 인물: 한마디 + 답 셋 ──
const seenOk=new Set();
for(const z of Object.keys(ZONES)){const w=W(z),t=w.api.talk(z);ok(t&&typeof t.ask==='string'&&t.ask.length>=6&&t.ask.length<=40,z+': 인물의 한마디(짧게) '+(t&&t.ask));
 eq(t.choices.length,3,z+': 답 셋');eq(t.choices.filter(c=>c.ok).length,1,z+': 맞는 답 하나');const oki=t.choices.findIndex(c=>c.ok);seenOk.add(oki);eq(t.choices[oki].id,'npcTakeR790',z+': 맞는 답 단추는 그대로');
 for(const c of t.choices.filter(c=>!c.ok)){ok(/^npcWrongR796[ab]$/.test(c.id),z+': 틀린 답 id');ok(c.t.length>=4&&c.t.length<=30,z+': 틀린 답 글 길이 '+c.t);ok(c.scold&&c.scold.length>=8&&c.scold.length<=40,z+': 꾸짖는 말 '+c.scold);ok(c.t!==t.choices[oki].t,z+': 맞는 답과 다른 글');}
 eq(new Set(t.choices.map(c=>c.t)).size,3,z+': 답 글이 서로 다름');
 w.run('interact()');const h=w.log().panel[0];ok(h.includes('npcAskR796')&&h.includes(t.ask),z+': 창에 한마디');for(const c of t.choices)ok(h.includes('id="'+c.id+'"')&&h.includes(c.t),z+': 창에 답 '+c.id);ok(h.includes('id="npcWaitR790"'),z+": '아직'");ok(!/<script|onerror=|javascript:/i.test(h),z+': 스크립트 없음');
 // 창 단추 순서 = choices 순서
 const pos=t.choices.map(c=>h.indexOf('id="'+c.id+'"'));ok(pos.every((v,i)=>i===0||v>pos[i-1])&&h.indexOf('id="npcWaitR790"')>pos[2],z+': 단추 순서');
 // 틀린 답
 w.run('__btn.npcWrongR796a()');ok(!w.api.taken(),z+': 틀린 답 → 받지 않음');ok(w.api.inspect().gate,z+': 관문 유지');eq(w.run('modal'),false,z+': 창 닫힘');eq(w.log().base,0,z+': 서사로 안 넘어감');
 const L=live(w);eq(L.length,3,z+': 몹 셋');ok(w.log().toast.some(x=>x.includes(t.choices.find(c=>c.id==='npcWrongR796a').scold)&&x.includes('다시 말')),z+': 꾸짖음 알림');
 for(const e of L){eq(e.name,'주민',z+': 일반 몹만 본뜸(분대장·중간보스 아님)');eq(e.hp,120,z+': 체력 60%');eq([e.dead,e.st,e.ag,e.nav,e.rc===undefined,e.lead],[false,'active',80,[],true,false],z+': 새 몹 상태');
  const d=Math.hypot(e.x-w.run('player.x'),e.y-w.run('player.y'));ok(d>=2.9&&d<=5.3,z+': 영웅 둘레 '+d.toFixed(2));ok(!w.run(`blocked(${e.x},${e.y},.42)`),z+': 빈 자리');
  for(let s=1;s<10;s++)ok(!w.run(`blocked(player.x+(${e.x}-player.x)*${s}/10,player.y+(${e.y}-player.y)*${s}/10,.3)`),z+': 영웅까지 곧게 걸어올 수 있음');}
 eq(new Set(L.map(e=>e.id)).size,3,z+': id 겹치지 않음');eq(w.api.summoned(),3,z+': summoned()');
 // 몹이 남아 있으면 다시 말 못 검
 w.run('interact()');eq(w.log().panel.length,1,z+': 몹이 남으면 창 없음');eq(w.log().base,0,z+': 서사로도 안 넘어감');ok(w.log().toast.some(x=>/먼저 물리치/.test(x)),z+': 알림');w.run('updateHUD()');ok(/물리치고 다시 말/.test(w.run('__el.questText.textContent')),z+': 목표 글');
 // 다 잡으면 다시 창, 이번엔 다른 틀린 답 → 또 셋, 그 뒤 맞는 답
 w.run("room.enemies.filter(e=>e.r796Summon).forEach(e=>{e.hp=0;e.deadRecorded=true;})");w.run('updateHUD()');ok(!/물리치고/.test(w.run('__el.questText.textContent')),z+': 목표 글 복귀');
 w.run('interact()');eq(w.log().panel.length,2,z+': 다 잡으면 다시 창');w.run('__btn.npcWrongR796b()');eq(live(w).length,3,z+': 다시 틀리면 다시 셋');ok(live(w).every(e=>e.name==='주민'),z+': 불러낸 몹을 다시 본뜨지 않음');
 w.run("room.enemies.filter(e=>e.r796Summon).forEach(e=>{e.hp=0;e.deadRecorded=true;})");w.run('interact();__btn.npcTakeR790()');ok(w.api.taken(),z+': 맞는 답 → 받음');eq(w.log().base,1,z+': 원래 서사로 이어짐');
 eq(w.run('serializeSave().npcR790'),{version:1,rooms:{['STORY:'+z]:{[ZONES[z][1]]:true}}},z+': 세이브는 그대로(틀린 기록 없음)');eq(w.api.inspect().stats.wrong,2,z+': 통계');}
ok(seenOk.size>=3,'맞는 답 자리가 인물마다 다르다: '+[...seenOk]);
// ── ② 경계 ──
{const w=W('ep1b05');w.run('interact();__btn.npcWrongR796a();tick(44)');eq(w.api.summoned(),3,'44초: 아직 있음');w.run('interact()');eq(w.log().panel.length,1,'아직 창 없음');w.run('tick(2);interact()');eq(w.api.summoned(),0,'45초 뒤 물러남');eq(w.log().panel.length,2,'다시 창');ok(!w.run('room.enemies.some(e=>e.r796Summon)'),'목록에서 뺌');eq(w.run('room.enemies.length'),4,'원래 몹은 그대로');}
{const w=world({zoneId:'ep1b05',phase:'door'});w.run('tick(.1);player.x=20;player.y=22;interact();__btn.npcWrongR796a()');eq(w.api.summoned(),0,'본뜰 일반 몹이 없으면 소환 없음');ok(w.log().toast.some(x=>/다시 말을 거세요/.test(x)),'꾸짖음만');w.run('interact()');eq(w.log().panel.length,2,'바로 다시 창');}
{const w=W('murder04',{guideOn:true});w.run('interact()');eq(w.log().panel.length,0,'길잡이: 창 없음');ok(w.api.taken(),'길잡이: 맞는 답으로');eq(w.api.summoned(),0,'길잡이: 소환 없음');}
{const w=W('murder04');w.run('interact();__btn.npcWrongR796a();guide=true;interact()');ok(!w.api.taken(),'길잡이라도 불러낸 몹이 남으면 받지 않음');eq(w.log().panel.length,1,'창 없음');}
{const w=W('murder04');w.run('interact();__btn.npcWrongR796a();player.x=10;player.y=10;interact()');eq(w.log().base,1,'인물·문에서 멀면 원래 처리(몹이 남아도)');}
{const w=W('murder04');w.run("interact();__st.phase='boss';__btn.npcWrongR796a()");eq(w.api.summoned(),0,'창이 뜬 사이 단계가 바뀌면 아무 일 없음');}
{const w=W('murder04');w.run('interact();__btn.npcWaitR790()');eq(w.api.summoned(),0,"'아직'은 소환 없음");ok(!w.api.taken(),"'아직'");}
// 사방이 막혀 설 자리가 없으면 소환 없이 꾸짖음만
{const w=W('ep1b05');w.run('var __b0=blocked;blocked=function(x,y,r){return Math.hypot(x-player.x,y-player.y)>2.6?true:__b0(x,y,r);};interact();__btn.npcWrongR796a()');eq(w.api.summoned(),0,'설 자리 없음 → 소환 없음');eq(w.api.inspect().lastError,null,'오류 없음');}
// 헤드리스 실측으로 더한 요구: 쓰러진 일반 몹은 방 목록에서 빠진다 → 살아 있을 때 떠 둔 본으로 불러낸다.
{const w=world({zoneId:'last303',phase:'route'});w.run("room.enemies.push({id:'a1',name:'잠 못 드는 주민 3',profile:{k:1},combatProfile:{aggro:6},hp:200,maxHp:200,spawnState:'active',x:9,y:9},{id:'a2',name:'숨은 몹',profile:{k:1},hp:200,maxHp:200,spawnState:'hidden',x:9,y:9});tick(.1)");
 w.run("room.enemies=room.enemies.filter(e=>e.boss);__st.phase='door';tick(.1);player.x=20;player.y=22;interact();__btn.npcWrongR796a()");const L=live(w);eq(L.length,3,'떠 둔 본으로 셋');ok(L.every(e=>e.name==='잠 못 드는 주민'&&e.hp===120),'살아 있던 일반 몹의 본');}
{const w=world({zoneId:'last303',phase:'boss'});w.run("room.enemies.push({id:'a1',name:'주민',profile:{k:1},hp:200,maxHp:200,spawnState:'active',x:9,y:9});tick(.1);room.enemies=room.enemies.filter(e=>e.boss);__st.phase='door';__st.doorStoryDone=false;");ok(true,'받은 뒤(boss)에는 본을 뜨지 않아도 됨');}
// 순수 ring
{const r=world({zoneId:'ep1b05',phase:'door'}).api.pure.ring;eq(r(null,0,3,()=>false),null,'ring: 중심 없음');eq(r({x:5,y:5},0,3,()=>true),null,'ring: 다 막힘');const q=r({x:5,y:5},1,3,()=>false);ok(q&&Math.abs(Math.hypot(q.x-5,q.y-5)-3.6)<1e-6,'ring: 첫 반지름');}
// 헤드리스 장면으로 더한 요구: 아래 알림은 싸우는 중에 흐려 놓치기 쉽다 → 꾸짖는 말을 인물 머리 위에도 5초.
for(const z of ['murder04','ep1a10']){const w=W(z);w.run('var __txt=[];ctx.fillText=(t,x,y)=>__txt.push({t,x,y});tick(3);interact();__btn.npcWrongR796a();tick(.5);drawProp(room.props.find(p=>p.r790NPC))');
 const sc=w.api.talk(z).choices.find(c=>c.id==='npcWrongR796a').scold,rows=w.run('__txt'),p=w.run('room.props.find(p=>p.r790NPC)'),say=rows.find(r=>r.t.includes(sc)),name=rows.find(r=>!r.t.includes(sc));
 ok(say,z+': 머리 위 꾸짖는 말');ok(say.y<p.y*10-60,z+': 머리 위 '+say.y);ok(name&&Math.abs(name.y-say.y)>=14,z+': 이름표와 겹치지 않음');
 w.run('__txt.length=0;tick(5);drawProp(room.props.find(p=>p.r790NPC))');ok(!w.run('__txt').some(r=>r.t.includes(sc)),z+': 5초 뒤 사라짐');}
// 헤드리스 실측으로 더한 요구: 엔진 blocked 가 반지름에 단조롭지 않다(.42 빈 자리·.3 막힘) → 작은 반지름으로도 빈 자리만.
{const r=world({zoneId:'ep1b05',phase:'door'}).api.pure.ring;const q=r({x:5,y:5},0,3,(x,y,rad)=>rad<.4&&Math.hypot(x-5,y-5)>3.5&&Math.hypot(x-5,y-5)<3.7);ok(q&&Math.abs(Math.hypot(q.x-5,q.y-5)-3.6)>.1,'ring: 작은 반지름에서만 막힌 자리는 건너뜀 '+JSON.stringify(q));}
// ── ③ 회귀 ──
{const w=W('last303');w.run('interact();__btn.npcWrongR796a();killEnemy(room.enemies[0])');eq(w.log().killBase.length,0,'불면귀 핵 봉인 유지');w.run("killEnemy(room.enemies.find(e=>e.r796Summon))");eq(w.log().killBase.length,1,'불러낸 몹은 잡을 수 있다');}
ok(!/exitStoryDone\s*=|doorStoryDone\s*=|\.phase\s*=[^=]/.test(src),'R78 단계·서사를 직접 바꾸지 않는다');
console.log('R796 CPU 검사 통과: '+n+'개');
