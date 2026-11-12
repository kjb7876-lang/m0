// R792 CPU 검사: 서사 핵심 NPC 셋째 묶음 — Dots 정식 시트로 바꾸기 + 병원 1막 두 사람.
//  ① 앳된 남자(last303): ElevenLabs 한 장 → Dots idle6(숨쉬기 6칸) · 영웅이 다가오면 offer6(사발을 내미는 6칸, 끝 칸에서 멈춤) · 창 그림도 Dots 흉상.
//  ② ep1a10 의료진(정본 10장 "그래도 나는 의료진에게 도움을 청했다") — 보스를 쓰러뜨린 뒤 제단 곁, '도움을 청한다' 를 골라야 뒷이야기.
//  ③ ep1a11 의목사(정본 11장 "침대 옆에는 검은 성직복 위에 흰 가운을 걸친 남자가 앉아 있었다 … 그에게서 현세와 몽세, 내세에 관해 배웠다") — '이야기를 듣는다'.
//  정상·경계(칸 순환, 내밀기 끝 칸 고정, 멀어지면 되돌아감, 단계)·회귀(두목 한 장 그림·숨쉬기 그대로, 기록 안 섞임, 처치 막기는 불면귀만).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const J=v=>v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v,ok=(c,m)=>{assert.ok(c,m);n++;},eq=(a,b,m)=>{assert.deepStrictEqual(J(a),J(b),m);n++;};
const src=fs.readFileSync(path.join(R,'client-source','npc-r790.js'),'utf8');
{const y=fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').split('\n'),i=y.findIndex(l=>l.includes('node r96/qa/r792/r792-cpu-check.cjs'));ok(i>0,'pages.yml CPU 검사 줄');ok(/^\s+- name: /.test(y[i-1])&&!y[i-1].replace(/^\s+- name: /,'').includes(': '),'pages.yml 단계 이름에 콜론+빈칸 없음');}
ok(fs.readFileSync(path.join(R,'runtime-text','npc-r790.js'),'utf8')===src,'runtime-text 사본이 같다');
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');
for(const f of ['youth-idle6','youth-offer6','youth-bust-d','medic-idle6','medic-bust','physician-idle6','physician-bust']){ok(fs.existsSync(path.join(R,'runtime-text','assets','r790','npc',f+'.webp')),f+' 파일');ok(man.includes('assets/r790/npc/'+f+'.webp'),f+' 목록');}
// 검사 틀은 R791 것을 그대로 쓴다(같은 엔진 흉내).
const h791=fs.readFileSync(path.join(__dirname,'../r791/r791-cpu-check.cjs'),'utf8'),a=h791.indexOf('function world('),b=h791.indexOf("\n{const w=world();ok(w.api.zones()");ok(a>0&&b>a,'R791 검사 틀을 찾음');
const world=new Function('vm','src','J','return '+h791.slice(a,b).trim())(vm,src,J);
const P='assets/r790/npc/',draws=(w,k)=>{w.run('drawProp(room.props.find(p=>p.r790NPC))');return w.log().drawn.at(-1);};
// ── ① 앳된 남자: idle6 ──
{const w=world({zoneId:'last303',phase:'door'});w.run('tick(.1);player.x=30;player.y=40;tick(3)');const seen=new Set(),hs=new Set();let d;
 for(let i=0;i<24;i++){w.run('tick(.1)');d=draws(w);eq(d.path,P+'youth-idle6.webp','멀리 있으면 숨쉬기 시트');const r=d.frame.assetFrame.sourceRect;ok(r[0]%384===0&&r[0]>=0&&r[0]<2304&&r[1]===0&&r[2]===384&&r[3]===384,'칸 경계 '+r);seen.add(r[0]);hs.add(d.h);}
 ok(seen.size>=5,'숨쉬기 칸이 돈다: '+[...seen]);eq(hs.size,1,'시트가 있으면 코드 숨쉬기(키 늘이기)는 안 얹는다');eq(d.frame.assetFrame.pivot,[192,352],'발 기준점');
 // ── 내밀기: 다가오면 0칸부터 끝 칸까지 가서 멈춘다 ──
 const p=w.run('room.props.find(p=>p.r790NPC)');w.run(`player.x=${p.x-1.5};player.y=${p.y};tick(.02)`);const first=draws(w);eq(first.path,P+'youth-offer6.webp','다가오면 내미는 시트');eq(first.frame.assetFrame.sourceRect[0],0,'첫 칸부터');
 const xs=[];for(let i=0;i<30;i++){w.run('tick(.1)');xs.push(draws(w).frame.assetFrame.sourceRect[0]);}ok(xs.every((x,i)=>i===0||x>=xs[i-1]),'되감기지 않는다 '+xs);eq(xs.at(-1),5*384,'끝 칸에서 멈춤(내민 채)');ok(new Set(xs).size>=4,'중간 칸을 거친다');
 w.run('player.x=30;player.y=40;tick(.1)');eq(draws(w).path,P+'youth-idle6.webp','멀어지면 다시 숨쉬기');
 w.run(`player.x=${p.x-1.5};player.y=${p.y};tick(.02)`);eq(draws(w).frame.assetFrame.sourceRect[0],0,'다시 오면 처음부터 내민다');
 // 경계: 3.4칸 안쪽만
 w.run(`player.x=${p.x-3.6};player.y=${p.y};tick(.1)`);eq(draws(w).path,P+'youth-idle6.webp','3.6칸: 아직 숨쉬기');w.run(`player.x=${p.x-3.3};player.y=${p.y};tick(.1)`);eq(draws(w).path,P+'youth-offer6.webp','3.3칸: 내민다');
 // 창 그림
 w.run(`player.x=${p.x-1};player.y=${p.y};interact()`);const h=w.log().panel[0];ok(h.includes('./'+P+'youth-bust-d.webp'),'창에 Dots 흉상');ok(!h.includes('youth-bust.webp'),'옛 대체 그림 아님');
 w.log();w.run('__btn.npcTakeR790()');ok(w.api.taken(),'받음');w.run('tick(.5)');eq(draws(w).path,P+'youth-idle6.webp','받은 뒤에는 내밀지 않는다');}
// 헤드리스 실측으로 더한 요구: 내미는 시트는 인물이 설 때 미리 청해 둔다(다가간 뒤에야 읽으면 첫 내밀기가 숨쉬기 그림으로 지나간다).
{const w=world({zoneId:'last303',phase:'door',ready:false});w.run('__log.added.length=0;tick(.1)');ok(w.log().added.includes(P+'youth-offer6.webp')&&w.log().added.includes(P+'youth-idle6.webp'),'설 때 두 시트를 청한다 '+w.log().added);}
ok(!src.includes("'assets/r790/npc/youth.webp'"),'ElevenLabs 대체 한 장은 더 쓰지 않는다');
// ── ②③ 병원 1막 두 사람 ──
for(const z of [{id:'ep1a10',kind:'medic',flag:'askedHelp',name:'의료진',take:'도움을 청한다',art:'medic',first:/의료진/},{id:'ep1a11',kind:'physician',flag:'heardWorlds',name:'의목사',take:'이야기를 듣는다',art:'physician',first:/의목사/}]){
 ok(world({zoneId:z.id}).api.zones().includes(z.id),z.id+' 등록');
 for(const ph of ['route','rally','door','doorStory','boss']){const w=world({zoneId:z.id,phase:ph});w.run('tick(.1)');ok(!w.run('room.props.some(p=>p.r790NPC)'),z.id+' '+ph+': 없음');w.run('interact()');eq(w.log().base,1,z.id+' '+ph+': 원래 처리');}
 {const w=world({zoneId:z.id});w.run('tick(.1)');const p=w.run('room.props.find(p=>p.r790NPC)');ok(p,z.id+': 보스 뒤 제단 곁에 선다');eq(p.id,'r790:npc:'+z.id+':'+z.kind,'id');eq(p.solid,false,'길 안 막음');ok(Math.hypot(p.x-15,p.y-13)<=2.4,'제단 곁');
  w.run('tick(3)');const d=draws(w);eq(d.path,P+z.art+'-idle6.webp',z.id+' 시트');eq(d.frame.assetFrame.sourceRect.slice(1),[0,384,384],'칸');eq(w.log().propBase.length,0,'엔진 길 안 탐');
  w.run('interact()');eq(w.log().base,0,'제단: 뒷이야기 전에 창');const h=w.log().panel[0];ok(h.includes(z.name)&&h.includes(z.take),'창 글');ok(h.includes('./'+P+z.art+'-bust.webp'),'창 그림');ok(!/귀비탕|장미/.test(h),'다른 서사 글이 섞이지 않는다');ok(!/<script|onerror=/i.test(h),'스크립트 없음');
  w.run('__btn.npcWaitR790()');ok(!w.api.taken(),"'아직': 그대로");eq(w.log().base,0,'뒷이야기 안 시작');
  w.run('interact();__btn.npcTakeR790()');ok(w.api.taken(),'받음');eq(w.log().base,1,'제단 곁이면 바로 뒷이야기로');ok(w.log().save>=1,'저장');eq(w.run('serializeSave().npcR790'),{version:1,rooms:{['STORY:'+z.id]:{[z.flag]:true}}},'세이브 기록');
  w.run('interact()');eq(w.log().base,2,'받은 뒤엔 원래 처리');}
 {const w=world({zoneId:z.id});w.run('tick(.1);player.x=5.5;player.y=8;interact()');eq(w.log().base,0,'출구 문: 먼저 받으라고 알림');ok(z.first.test(w.log().toast.at(-1)||''),'알림 글 '+w.log().toast.at(-1));}
 {const w=world({zoneId:z.id,guideOn:true});w.run('tick(.1);interact()');eq(w.log().panel.length,0,'길잡이: 창 없음');ok(w.api.taken(),'바로 받음');eq(w.log().base,1,'뒷이야기로');}
 {const w=world({zoneId:z.id,phase:'boss'});w.run('tick(.1);killEnemy(room.enemies[0])');eq(w.log().killBase.length,1,z.id+': 처치 막기 없음(불면귀만)');}
 for(const ph of ['exitStory','done']){const w=world({zoneId:z.id,phase:ph});w.run('tick(.1)');ok(w.api.taken(),z.id+' '+ph+': 옛 세이브는 받은 것으로');}
 {const w=world({zoneId:z.id});w.run('tick(.1);updateHUD()');ok(new RegExp(z.name).test(w.run('__el.questText.textContent')),'목표 글');}
}
(async()=>{
 {const w=world({zoneId:'ep1a10'});await w.run(`restoreSave({npcR790:{version:1,rooms:{'STORY:last303':{gwibitang:true},'STORY:ep1a11':{heardWorlds:true},'STORY:ep1a10':{heardWorlds:true}}}})`);ok(!w.api.taken(),'다른 지역·다른 낱말 기록으로 켜지지 않는다');
  eq(w.run('serializeSave().npcR790.rooms'),{'STORY:last303':{gwibitang:true},'STORY:ep1a11':{heardWorlds:true}},'맞는 기록만 남는다');}
 // 회귀: 한 장 그림(두목)은 그대로 한 칸 + 숨쉬기
 {const w=world();w.run('tick(.1);tick(3)');const d1=draws(w);w.run('tick(.9)');const d2=draws(w);eq(d1.frame.assetFrame.sourceRect,[0,0,672,384],'두목 한 칸');ok(d1.h!==d2.h,'한 장 그림은 코드 숨쉬기 유지');}
 console.log('R792 CPU 검사 통과: '+n+'개');
})().catch(e=>{console.error(e);process.exit(1);});
