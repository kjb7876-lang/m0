// R794 CPU 검사: 서사 핵심 NPC 다섯째 — 한이경(murder04 고서진과 청록빌라). 정본 54장 "나는 민재의 수첩에서 한이경의 주소를 찾아 청록빌라로 향했다 … 나는 이제라도 사실을 밝혀야 한다는 뜻을 전했다."
//  ① 정상: 들판을 정리하면(R78 'door') 보스 구역 문 옆에 한이경이 서고, '사실을 밝히자고 전한다' 를 골라야 보스 문의 기억이 시작된다. 처치 막기 없음.
//  ② 경계: 단계, '아직', 길잡이, 옛 세이브. ③ 회귀: 다른 지역 기록·관문과 섞이지 않음.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const J=v=>v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v,ok=(c,m)=>{assert.ok(c,m);n++;},eq=(a,b,m)=>{assert.deepStrictEqual(J(a),J(b),m);n++;};
const src=fs.readFileSync(path.join(R,'client-source','npc-r790.js'),'utf8');
{const y=fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').split('\n'),i=y.findIndex(l=>l.includes('node r96/qa/r794/r794-cpu-check.cjs'));ok(i>0,'pages.yml CPU 검사 줄');ok(/^\s+- name: /.test(y[i-1])&&!y[i-1].replace(/^\s+- name: /,'').includes(': '),'pages.yml 단계 이름에 콜론+빈칸 없음');}
ok(fs.readFileSync(path.join(R,'runtime-text','npc-r790.js'),'utf8')===src,'runtime-text 사본이 같다');
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');for(const f of ['yigyeong-idle6','yigyeong-bust']){ok(fs.existsSync(path.join(R,'runtime-text','assets','r790','npc',f+'.webp')),f+' 파일');ok(man.includes('assets/r790/npc/'+f+'.webp'),f+' 목록');}
const h791=fs.readFileSync(path.join(__dirname,'../r791/r791-cpu-check.cjs'),'utf8'),a=h791.indexOf('function world('),b=h791.indexOf("\n{const w=world();ok(w.api.zones()");ok(a>0&&b>a,'R791 검사 틀을 찾음');
const world=new Function('vm','src','J','return '+h791.slice(a,b).trim())(vm,src,J);
const P='assets/r790/npc/',Z='murder04',W=o=>world({zoneId:Z,phase:'door',...o}),nearDoor='player.x=20;player.y=22;';
ok(W().api.zones().includes(Z),'등록');
for(const ph of ['route','rally']){const w=W({phase:ph});w.run('tick(.1)');ok(!w.run('room.props.some(p=>p.r790NPC)'),ph+': 아직 없음');w.run(nearDoor+'interact()');eq(w.log().base,1,ph+': 원래 처리');}
{const w=W();w.run('tick(.1)');const p=w.run('room.props.find(p=>p.r790NPC)');ok(p,'door 단계: 한이경이 선다');eq(p.id,'r790:npc:murder04:yigyeong','id');eq(p.solid,false,'길 안 막음');ok(Math.hypot(p.x-20,p.y-20)<3.2,'보스 문 곁 '+[p.x,p.y]);
 // 헤드리스 장면으로 더한 요구: 서윤 때와 같이 문 오른쪽은 앞 건물 벽에 가려 이름표만 보였다 → 왼쪽부터 고른다.
 ok(p.x<20,'문 왼쪽에 선다 '+p.x);
 w.run('tick(3);drawProp(room.props.find(p=>p.r790NPC))');const d=w.log().drawn.at(-1);eq(d.path,P+'yigyeong-idle6.webp','시트');eq(d.frame.assetFrame.sourceRect.slice(1),[0,384,384],'칸');
 w.run(nearDoor+'interact()');eq(w.log().base,0,'문: 기억 전에 창');const h=w.log().panel[0];ok(h.includes('한이경')&&h.includes('사실을 밝히자고 전한다'),'창 글');ok(h.includes('./'+P+'yigyeong-bust.webp'),'창 그림');ok(!/귀비탕|장미|의료진|서윤/.test(h),'다른 서사 글 없음');
 w.run('__btn.npcWaitR790()');ok(!w.api.taken(),"'아직'");w.run('interact()');eq(w.log().panel.length,2,'다시 누르면 다시 창');w.run('__btn.npcTakeR790()');ok(w.api.taken(),'전함');eq(w.log().base,1,'문 앞이면 바로 보스 문의 기억으로');
 eq(w.run('serializeSave().npcR790'),{version:1,rooms:{'STORY:murder04':{toldTruth:true}}},'세이브');w.run('updateHUD()');}
{const w=W();w.run('tick(.1);updateHUD()');ok(/한이경/.test(w.run('__el.questText.textContent')),'목표 글');}
{const w=W({guideOn:true});w.run('tick(.1);'+nearDoor+'interact()');eq(w.log().panel.length,0,'길잡이: 창 없음');ok(w.api.taken(),'바로 받음');eq(w.log().base,1,'기억으로');}
{const w=W({phase:'boss'});w.run('tick(.1);killEnemy(room.enemies[0])');eq(w.log().killBase.length,1,'처치 막기 없음(허락 없이 boss 단계인 옛 세이브도 그대로)');ok(w.api.taken(),'boss 단계는 받은 것으로');}
for(const ph of ['doorStory','boss','exit','exitStory','done']){const w=W({phase:ph});w.run('tick(.1)');ok(w.api.taken(),ph+': 받은 것으로');w.run(nearDoor+'interact()');eq(w.log().panel.length,0,ph+': 창 없음');}
for(const [name,o] of [['무한 생존',{survival:true}],['EGO 재방문',{ego:true}],['끄기',{store:{'storyworld.r790.npc':'{"on":false}'}}],['제어 아님',{controlled:false}]]){const w=W(o);w.run('tick(.1)');ok(!w.run('room.props.some(p=>p.r790NPC)'),name+': 없음');w.run(nearDoor+'interact()');eq(w.log().base,1,name+': 원래 처리');}
(async()=>{
 {const w=W();await w.run(`restoreSave({npcR790:{version:1,rooms:{'STORY:last303':{gwibitang:true},'STORY:murder04':{gwibitang:true}}}})`);ok(!w.api.taken(),'다른 낱말로 켜지지 않는다');}
 {const w=world({zoneId:'last303',phase:'door'});w.run('tick(.1);player.x=20;player.y=22;interact()');ok(w.log().panel[0].includes('귀비탕')&&!w.log().panel[0].includes('한이경'),'회귀: last303 은 귀비탕');w.run('killEnemy(room.enemies[0])');eq(w.log().killBase.length,0,'회귀: 불면귀 핵 봉인 유지');}
 console.log('R794 CPU 검사 통과: '+n+'개');
})().catch(e=>{console.error(e);process.exit(1);});
