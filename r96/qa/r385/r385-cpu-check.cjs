'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}};
const RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8'),CS=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');const src=CS('mob-moves-r385.js');
ok(RT('mob-moves-r385.js')===src,'runtime-text 사본 = client-source');
const html=RT('index.html');ok(/<script src="\.\/voice-r381\.js"><\/script><script src="\.\/cinema-sync-r384\.js"><\/script><script src="\.\/mob-moves-r385\.js"><\/script>/.test(html)&&html.split('mob-moves-r385.js').length===2,'스크립트 태그 한 번, R381 음성·R384 영화 동기 뒤(R380 makeRoom 감싸기 바깥)');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'mob-moves-r385.js',"),'공개 확인 목록');
ok(JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8')).textPaths.includes('mob-moves-r385.js'),'런타임 입력 목록');
ok(/r385\/r385-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'Pages CPU 검사 줄');
const mk=(z,name,nid,o={})=>({id:z+':'+name,name,nativeId:nid,path:'p/'+nid,profile:{frames:{move:{path:'f/'+nid}}},hp:10,maxHp:10,damage:3,...o});
const pat=(z,i,name,nid,mon='clock')=>mk(z,'x',nid,{id:z+':r74-patrol:'+i,name,r74Monster:mon});
const DATA={
 dist04:()=>[mk('dist04','보라검 부활자 1','dist04-c2'),mk('dist04','중간보스 · 보라검 부활자','dist04-c2',{midboss:true}),mk('dist04','이름 잃은 전우 1','dist04-s1'),mk('dist04','보스','b',{boss:true})],
 ep1b08:()=>[mk('ep1b08','전극을 두른 좀비 수호기사 1','b08-c1'),mk('ep1b08','창처럼 날아오는 역십자가 증원 2','b08-h1'),mk('ep1b08','역십자가 시체경호체','mb-ep1b08',{midboss:true})],
 dist03:()=>[mk('dist03','쓰러진 수호병 1','dist03-s1'),mk('dist03','피냄새 추적자 1','dist03-g1'),pat('dist03',0,'쓰러진 수호병','dist03-s1','root')],
 u202:()=>[mk('u202','복종 봉인구 1','u202-e2'),mk('u202','감옥 공명기사 1','u202-e3'),mk('u202','제8단계 자비 교정관','u202-mid',{midboss:true})],
 u203:()=>[mk('u203','이동문 청람잔영 1','u203-e1'),mk('u203','이동문 공허잔영 1','u203-e2'),mk('u203','최종문 공명기사 1','u203-e3')],
 ep1b09:()=>[mk('ep1b09','설원 아래의 기계 다리 1','b09-c1')],ep1a10:()=>[mk('ep1a10','오만의 흰 가면 1','a10-o1')],
 cult01:()=>[mk('cult01','흑장미 눈가린 신도 1','c101-e1'),...[0,1,2].map(i=>pat('cult01',i,'태엽 수집자','c101-e1'))],
 cult03:()=>[0,1,2,3,4,5].map(i=>pat('cult03',i,'태엽 수집자','c103-e1')),hando02:()=>[pat('hando02',0,'뿌리 추적자','h102-s1','root')],
 ep1a09:()=>[0,1,2,3].map(i=>pat('ep1a09',i,'유리 망령','a09-o1','glass')),kair07:()=>[pat('kair07',0,'태엽 수집자 우두머리','kair-guardian-19')]};
const drawn=[],burned=[];const fakeAssign=e=>{if(e.r374Mob)return e.r374Mob;if(e.r374Checked==='STORY')return null;e.r374Checked='STORY';if(e.nativeId==='b08-c1')e.r374Mob='sheet-b08';return e.r374Mob||null;};const ctx={spawnBurnDeath3:e=>burned.push({nativeId:e.nativeId,path:e.path}),window:{},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,regionById:{},register(){},
 makeRoom:(id,l)=>({id,enemies:(DATA[id]||(()=>[]))()}),drawEnemy:e=>drawn.push({sheet:fakeAssign(e),name:e.name,nativeId:e.nativeId,path:e.path,frame:e.profile?.frames?.move?.path})};
for(const z of Object.keys(DATA))ctx.regionById[z]={paths:[]};ctx.window.window=ctx.window;vm.createContext(ctx);vm.runInContext('var window=this.window;'+src,ctx);
const A=ctx.window.__STORYWORLD_MOB_MOVES_R385__;ok(!!A&&A.revision==='R385-moves-4','설치');
const room=id=>ctx.makeRoom(id,'STORY');
const d4=room('dist04');ok(d4.enemies[0].name==='되살아난 수호기사 1'&&d4.enemies[1].name==='중간보스 · 되살아난 수호기사'&&d4.enemies[2].name==='이름 잃은 전우 1'&&d4.enemies[3].name==='보스','dist04 보라검 부활자 → 되살아난 수호기사(이름 잃은 전우·보스 그대로)');
ok(d4.enemies[0].nativeId==='dist04-c2'&&d4.enemies[0].path==='p/dist04-c2'&&d4.enemies[0].r248Key==='전극을 두른 좀비 수호기사'&&d4.enemies[0].r385Key0===undefined,'방 자료 nativeId·그림 경로 그대로, R248 그림·효과 키는 옮겨 온 몹 것');
drawn.length=0;ctx.drawEnemy(d4.enemies[0]);ok(drawn[0].nativeId==='b08-c1'&&drawn[0].path==='p/b08-c1'&&drawn[0].frame==='f/b08-c1'&&d4.enemies[0].nativeId==='dist04-c2','그릴 때만 ep1b08 좀비 수호기사 그림을 빌리고 되돌림');
drawn.length=0;ctx.drawEnemy(d4.enemies[2]);ok(drawn[0].nativeId==='dist04-s1','다른 몹은 그대로 그림');
const b8=room('ep1b08');ok(b8.enemies[1].name==='흑마법사의 저주창 증원 2'&&b8.enemies[2].name==='흑마법사의 시체경호체'&&b8.enemies[0].name==='전극을 두른 좀비 수호기사 1','ep1b08 역십자가 이름 → 흑마법사 계열');
const d3=room('dist03');ok(d3.enemies.every(e=>!/쓰러진 수호병/.test(e.name))&&d3.enemies[0].name==='피냄새 추적자 1'&&d3.enemies[2].name==='피냄새 추적자'&&d3.enemies[2].r74Monster===undefined,'무너진 성에 쓰러진 수호병 안 나옴(같은 지역 피냄새 추적자 그림)');
drawn.length=0;ctx.drawEnemy(d3.enemies[0]);ok(drawn[0].nativeId==='dist03-g1','dist03 그림 빌림');
const c1=room('cult01');ok(c1.enemies[0].name==='흑장미 눈가린 신도 1'&&c1.enemies.slice(1).every(e=>e.name==='기계화 복종 봉인구'&&e.r74Monster===undefined),'cult01 순찰 → 기계화 복종 봉인구, 원래 신도 그대로');
drawn.length=0;ctx.drawEnemy(c1.enemies[1]);ok(drawn[0].nativeId==='u202-e2','u202 복종 봉인구 그림');
const c3=room('cult03');ok(JSON.stringify(c3.enemies.map(e=>e.r385Look[1]))==='["u203-e1","u203-e2","u203-e3","u203-e1","u203-e2","u203-e3"]','cult03 순찰 → u203 기존 01~03 차례로');
const h2=room('hando02');ok(h2.enemies[0].name==='이동문 공허잔영'&&h2.enemies[0].r385Look[1]==='u203-e2'&&h2.enemies[0].r248Key==='이동문 공허잔영','두 사람의 성(hando02) 순찰 → u203 02');
const a9=room('ep1a09');ok(a9.enemies.filter(e=>e.name==='오만의 흰 가면').length===2&&a9.enemies.filter(e=>e.name==='유리 망령'&&e.r74Monster==='glass').length===2,'주사실 순찰 절반 → 오만의 흰 가면, 나머지 유리 망령 그대로');
const k7=room('kair07');ok(k7.enemies[0].name==='기계화 감옥 공명기사 우두머리','kair07 순찰 → 기계화 감옥 공명기사(우두머리 표기 유지)');
ok(room('dist04').enemies[0].name==='되살아난 수호기사 1','다시 만들어도 같은 결과');
ok(ctx.makeRoom('dist04','DREAM').enemies[0].name==='보라검 부활자 1','DREAM 층은 그대로');
ok(room('u202').enemies.map(e=>e.name).join()==='복종 봉인구 1,감옥 공명기사 1,제8단계 자비 교정관','원본 u202 는 그대로(빈 자리 새 몹은 별도 제작 대상)');
{const e=room('dist04').enemies[0];fakeAssign(e);ok(e.r374Checked==='STORY'&&!e.r374Mob,'원래 정체로 캐시된 R374 실패(프리로드 검사 흉내)');
 drawn.length=0;ctx.drawEnemy(e);ok(drawn[0].sheet==='sheet-b08'&&e.r374Mob==='sheet-b08','빌린 정체로 그릴 때 옛 캐시를 지우고 옮겨 온 몹 승인 시트를 다시 찾음');
 drawn.length=0;ctx.drawEnemy(e);ok(drawn[0].sheet==='sheet-b08','두 번째 그리기도 같은 시트(캐시 유지)');
 burned.length=0;ctx.spawnBurnDeath3(e);ok(burned[0].nativeId==='b08-c1'&&burned[0].path==='p/b08-c1'&&e.nativeId==='dist04-c2','죽음 불꽃도 옮겨 온 몹 그림, 끝나면 되돌림');
 burned.length=0;ctx.spawnBurnDeath3(room('dist04').enemies[2]);ok(burned[0].nativeId==='dist04-s1','다른 몹 죽음 불꽃은 그대로');}
A.set({on:false});ok(room('dist04').enemies[0].name==='보라검 부활자 1','끄기');
console.log(`R385 CPU ${n-bad}/${n}`);if(bad)process.exit(1);
