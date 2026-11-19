// R1214 CPU 검사 — 귀신 계열 몹 원거리(공포·암흑·그림자·촉수), dys-ranged-r1210.js 확장
//  사용자 2026-11-19 07:31Z "기계는 방사능 폭탄 레이져 음파", 07:41Z "일반몹은 하나의 원거리 공격만해 / 각몹에맞게", 07:56Z "최대한 다채롭게 + 그맵의 보스는 그맵 몹들의 원거리공격 동시에 66프로"
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='dys-ranged-r1210.js';let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL '+m,d===undefined?'':JSON.stringify(d).slice(0,400));assert(c,m);n++;console.log('PASS '+m);};
const src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 같음');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1214/r1214-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');ok(man.includes('r1214/shadow-rise12.webp'),'runtime-manifest 에 귀신 시트');
{const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r1214/index.json'),'utf8'));
 for(const [k,nf] of [['fear-gaze12',12],['fear-status8',8],['dark-orb-flight8',8],['dark-impact8',8],['shadow-hand-warning8',8],['shadow-rise12',12],['fissure-warning8',8],['ink-rise10',10]])
  ok(idx[k]?.frames===nf&&idx[k].final===false&&/^CX-0167RA_ghost-/.test(idx[k].source)&&src.includes('assets/r1214/'+k+'.webp')&&fs.existsSync(path.join(R,'runtime-text/assets/r1214',k+'.webp')),'Dots 귀신 시트: '+k);}
// ---- 샌드박스(R1210 검사와 같은 모양 + filter 기록) ----
function sandbox(){
 const calls={hurt:[],base:0,draw:[],imgs:[],filters:[]};
 const ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:(typeof k==='string'&&!['globalAlpha','lineWidth','strokeStyle','fillStyle','globalCompositeOperation','filter'].includes(k)?((...a)=>{calls.draw.push(k);if(k==='drawImage')calls.imgs.push(a[0]&&a[0].src);}):undefined),set:(o,k,v)=>{if(k==='filter')calls.filters.push(v);o[k]=v;return true;}});
 const player={x:10,y:10,hp:100,invincible:0};
 const sb={window:{},localStorage:{store:{},getItem(k){return this.store[k]??null;},setItem(k,v){this.store[k]=v;}},time:0,started:true,loading:false,modal:false,storyScene:null,player,ctx,room:{enemies:[]},effects:[],W:960,H:540,
  project:(x,y)=>({x:(x-y)*32+480,y:(x+y)*16}),actorHeight:()=>60,readyImage:p=>({image:{src:p,width:1536,height:1024,naturalWidth:1536}}),
  clearLine:()=>true,blocked:()=>false,facing:()=>'right',hurt:(d,s)=>{calls.hurt.push([d,s&&s.r1210]);return 'hit';},
  enemyShot:()=>({}),drawEffect(){},tick(dt){},Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,Promise,console};
 sb.ranged3=function(e){calls.base++;};sb.window.window=sb.window;
 vm.createContext(sb);vm.runInContext(src,sb);return {sb,calls,player,A:sb.window.__STORYWORLD_DYS_RANGED_R1210__};
}
const mob=(name,o={})=>({id:'e'+Math.random(),name,hp:100,maxHp:100,damage:10,ai:'melee',weapon:'ranged',spawnState:'active',x:14,y:10,radius:.3,cd:0,...o});
const step=(S,secs,dt=1/30,draw=false)=>{for(let i=0;i<secs/dt;i++){S.sb.time+=dt;S.sb.tick(dt);if(draw){const m=S.sb.effects.find(x=>x&&x.type==='r1210-fx');if(m)S.sb.drawEffect(m);}}};
const {A}=sandbox();const GK=['fear','dark','shadow','tentacle'],MK=['laser','radiation','sonic','bomb'];
// ---- 지역별 몹(헤드리스 makeRoom 전수 11-19, 꼬리 뗀 이름) ----
const REG={ep1a08:['격리실 감염 의료인','백의 구속자','복도 비명잔영','안정화 집행체'],ep1a09:['갈망의 약병핵','오만의 흰 가면','유리 망령','주사실 감시환각'],
 ep1a10:['부정의 잔영','암시장의 수상한 자','약을 갈망하는 자','유리 망령','중독의 폐허핵'],ep1a11:['거짓천국 근위천사','유리 망령','초자아 잠식체','치료거부의 가면'],
 ep1b01:['검은 실의 외부 신호','유리 망령','이름 없던 공포','일흔두 번째 인장 잔류체'],ep1b02:['곰팡이와 오물 봉투','살아 움직이는 쓰레기들','유리 망령'],
 ep1b03:['긴 뱀의 그림자','유리 망령','질투로 얼룩진 망령','추녀의 한탄'],ep1b04:['끓어오르는 검은 소화액','버려진 최고급 식재료','살아 있는 거대한 위장','유리 망령'],
 ep1b05:['공중을 가르는 립스틱 탄환','붉은 하이힐 칼날','얼굴 없는 남자의 박수','유리 망령'],ep1b07:['개와 늑대의 시간','분노의 사냥개','불길 속의 늑대','불길 속의 용'],
 ep1b08:['유리 망령','육망성의 흑마술 실험체','전극기계수호기사','흑마법사의 저주창'],murder01:['끊어진 통화의 인과 잔향','빗속 횡단보도의 기억 잔향','유리 망령'],
 murder02:['새빛호텔 화재 기록의 잔향','유리 망령','지워진 CCTV 기록의 잔향'],murder03:['반복된 추락의 인과 잔향','옥상으로 돌아온 기억 잔향','유리 망령'],
 murder04:['공실 표기 잔재','유리 망령','은폐기록 연결체','제출되지 못한 문장'],last302:['유리 망령','잠식된 소복 처녀','잠식된 약방 아낙','잠식된 어부'],
 last303:['불면귀의 안개 잔영','잠식된 소복 처녀','잠식된 약방 아낙','잠식된 어부'],cult01:['기계화 복종 봉인구','세뇌 신호 점액체','흑장미 귀막은 신도','흑장미 눈가린 신도'],
 cult03:['EGO 구속 연결자','ID 잔류 점액체','SUPER EGO 절개결정','이동문 공허잔영','이동문 청람잔영','최종문 공명기사'],cult04:['소환좌 칩 수호체','아마겟돈 계산결정','태엽 수집자'],
 hando01:['성벽 침식 봉인병','악몽 정찰체','의존 신호 포식자','이동문 청람잔영'],hando02:['기억절제 연결자','무명 검흔','붕괴선 파수병','이동문 공허잔영','코어 운반 집행자'],
 hando03:['EGO 탈취 연결자','백은 없는 그림자','최종문 공명기사','환수검 모조체'],
 samong:['뿌리에서 쏟아진 잔영','얼굴 없는 학생','규칙을 어기지 않는 마네킹','찢긴 호외의 잔향','여섯 물건의 그림자','붉은 교정 표시','정해진 시각에 도착하지 못한 발자국','관람석의 시선','종이 형상','막힌 이름들']};
const used=new Set();
for(const [r,L] of Object.entries(REG)){const ks=L.map(x=>A.kindFor(x));ok(ks.every(k=>GK.includes(k)||MK.includes(k)),r+': 모든 일반 몹이 한 종류',Object.fromEntries(L.map((x,i)=>[x,ks[i]])));
 ok(new Set(ks).size>=2,r+': 지역 안 2종류 이상(다채롭게)',ks);ok(ks.some(k=>GK.includes(k)),r+': 귀신 종류가 들어감');ks.forEach(k=>used.add(k));}
ok(GK.every(k=>used.has(k)),'귀신 네 종류 모두 쓰임',[...used]);
for(const [nm,k] of [['복도 비명잔영 추격대','fear'],['유리 망령 우두머리','shadow'],['긴 뱀의 그림자 후속 증원','tentacle'],['잠식된 어부 3','tentacle'],['서로의 결말을 먹는 도시','radiation'],['다음 자리를 노리는 사격','laser']])ok(A.kindFor(nm)===k,'이름: '+nm+' → '+k,A.kindFor(nm));
for(const nm of ['칼날이 된 지폐','박제된 여우의 악마','모든 면이 뒷면인 동전','숲 고블린','시간수문장 03'])ok(A.kindFor(nm)===null,'귀신·기계 몹 아님(맘몬·마법 쪽): '+nm);
// 맘몬 지역은 '유리 망령'이라도 손대지 않음
{const S=sandbox();S.sb.room.id='ep1b06';const e=mob('유리 망령');S.sb.room.enemies.push(e);step(S,4);ok(!S.A.eligible(e)&&!e.r1210?.mode&&S.calls.hurt.length===0,'맘몬 지역 ep1b06 은 그대로');}
// ---- 수치 ----
for(const k of GK){const u=A.tune[k];ok(u&&u.min>=2.4&&u.max<=7.5&&u.max>u.min&&u.dmg>0&&u.dmg<=.9&&u.windup>=.5&&u.windup<=1,k+': 사거리·한 번 피해·예고 띠',u);
 const dps=u.dmg/(u.cd+u.windup),engine=1/(2.1+.55);ok(dps<=engine*.5,k+': 원거리 압박 ≤ 엔진 원거리 몹의 절반',{dps,engine});}
ok(Math.abs(A.scaled('dark').hitR-A.tune.dark.hitR*1.66)<1e-9&&Math.abs(A.scaled('shadow').radius-A.tune.shadow.radius*1.66)<1e-9&&Math.abs(A.scaled('tentacle').len-A.tune.tentacle.len*1.66)<1e-9&&Math.abs(A.scaled('fear').reach-A.tune.fear.reach*1.66)<1e-9,'보스판 귀신 범위 1.66배');
// ---- 동작: 겨누기 → 맞음, 비키면 안 맞음, 시트로 그림 ----
const SHEET={fear:/r1214\/fear-gaze12/,dark:/r1214\/dark-(orb-flight8|impact8)/,shadow:/r1214\/shadow-(hand-warning8|rise12)/,tentacle:/r1214\/(fissure-warning8|ink-rise10)/};
/* 사용자 지시 동작 변경(11-19 09:47Z 근접·원거리 몹 확실히 나누기, R1214b) — 격리실 감염 의료인·백의 구속자는 근접 몹 → 원거리 몹 유리 망령·긴 뱀의 그림자로 */
for(const [name,kind] of [['복도 비명잔영','fear'],['안정화 집행체','dark'],['유리 망령','shadow'],['긴 뱀의 그림자','tentacle']]){
 const S=sandbox();const e=mob(name);S.sb.room.enemies.push(e);for(let i=0;i<120&&e.r1210?.mode!=='windup';i++)step(S,1/30);
 ok(e.r1210?.mode==='windup'&&e.r1210.kind===kind,name+': 겨누기 시작('+kind+')',e.r1210);S.calls.imgs.length=0;S.sb.drawEffect(S.sb.effects.find(x=>x.type==='r1210-fx'));
 ok(S.calls.imgs.some(p=>SHEET[kind].test(p||'')),name+': 예고를 Dots 시트로',[...new Set(S.calls.imgs)]);
 step(S,2.4,1/30,true);ok(S.calls.hurt.length===1&&S.calls.hurt[0][1]===kind&&S.calls.hurt[0][0]<=e.damage*.9+1e-9,name+': 가만히 선 영웅이 한 번 맞음',S.calls.hurt);
 ok(S.calls.imgs.some(p=>SHEET[kind].test(p||'')),name+': 발사도 Dots 시트로');
 const S2=sandbox();const f=mob(name);S2.sb.room.enemies.push(f);for(let i=0;i<120&&f.r1210?.mode!=='windup';i++)step(S2,1/30);step(S2,.3);S2.player.y=13.2;step(S2,2.4);
 ok(f.r1210.count>=1&&S2.calls.hurt.length===0,name+': 예고 보고 옆으로 비키면 안 맞음',S2.calls.hurt);}
{const S=sandbox();const e=mob('복도 비명잔영');S.sb.room.enemies.push(e);for(let i=0;i<200&&!(e.r1210?.count>=1);i++)step(S,1/30);S.calls.imgs.length=0;S.sb.drawEffect(S.sb.effects.find(x=>x.type==='r1210-fx'));ok(S.calls.imgs.some(p=>/r1214\/fear-status8/.test(p||'')),'공포에 맞으면 머리 위 공포 표시');}
// ---- 보스: 귀신 맵 몹 종류 동시 ----
{const S=sandbox();const boss=mob('백의 안정화 감독',{boss:true,damage:15,x:15});S.sb.room.enemies.push(boss,...['격리실 감염 의료인','백의 구속자','복도 비명잔영 증원','안정화 집행체'].map(x=>mob(x,{x:30})));
 ok(JSON.stringify(S.A.mapKinds(S.sb.room).sort())===JSON.stringify(['dark','fear','shadow','tentacle']),'ep1a08 맵 종류 넷',S.A.mapKinds(S.sb.room));
 let fired=false;for(let i=0;i<400&&!fired;i++){step(S,1/30);fired=boss.r1210?.count>=1;}const lv=S.A.inspect().liveDetail.filter(x=>x.owner===boss.id);ok(fired&&lv.length===4&&lv.every(x=>x.scale===1.66),'보스가 네 종류를 동시에 1.66배',lv);
 step(S,3);const bd=S.calls.hurt.reduce((a,b)=>a+b[0],0);ok(bd>0&&bd<=boss.damage*1.5+1e-9,'보스 동시 사격 피해 합 ≤ 보스 근접 1.5대('+bd.toFixed(1)+')');}
// ---- R1214b 근접·원거리 몹 나누기(사용자 11-19 09:47Z "근접몹 원거리몹 확실히 나눠줘 이미지와 공격방식토대로") ----
{const all=Object.keys(A.names);ok(all.every(x=>['melee','ranged'].includes(A.roleFor(x))),'이름 표의 모든 몹에 역할',all.filter(x=>!A.roleFor(x)));
 ok([...A.melee].every(x=>A.names[x]),'근접 표 이름은 모두 이름 표에 있음',[...A.melee].filter(x=>!A.names[x]));
 // S-06 디스토피아(그림 기준): 총·포·캐니스터를 든 몹 = 원거리, 칼·몸통 박치기·이빨·발톱 = 근접
 for(const x of ['중장 광선포병','프리즘 저격병 2','펄스 척후병','배양 공병','원반 포획체','포낭 곡사체','두족류 생체기계 침공병'])ok(A.roleFor(x)==='ranged','S-06 원거리: '+x);
 for(const x of ['외계 침공군','방벽 돌진체 4','낫팔 잠복체','막익 급습체','전선 절단자 · 짙은 형상','심해 연산거수 · 짙은 형상','변이된 사냥개 괴수','폐선로 태엽 군단병'])ok(A.roleFor(x)==='melee','S-06 근접: '+x);
 ok(A.roleFor('숲 고블린')===null,'표에 없는 몹은 손대지 않음');
 // 원거리 몹은 근접을 안 하는 대신 자주 쏘지만, 압박은 엔진 원거리 몹(2.65초마다 한 대) 이하
 for(const k of Object.keys(A.tune)){const u=A.tune[k],dps=u.dmg*(u.ticks||1)/(u.cd*A.rangedCd+u.windup);ok(dps<=1/(2.1+.55)+1e-9,k+': 원거리 몹 압박 ≤ 엔진 원거리 몹',dps);}}
{// 근접 몹: hybrid 였어도 ai 'melee', 20초 동안 원거리 0
 const S=sandbox();const e=mob('외계 침공군',{ai:'hybrid',x:15});S.sb.room.enemies.push(e);step(S,20);/* 사용자 11-19 11:22Z R1231 동작 변경: 근거리 몹도 근접 3번(못 하면 10초) 뒤 원거리 1번 → '원거리 0' 에서 '20초에 1번 이하, 다시 근접 단계' 로 바꿈 */ok(e.ai==='melee'&&(e.r1210?.count||0)<=1&&S.calls.hurt.length<=1&&S.A.effRole(e)==='melee','근접 몹(외계 침공군): ai melee·20초 원거리 1번 이하',{ai:e.ai,s:e.r1210,L:e.r1231});
 S.sb.ranged3(e);ok(S.calls.base===1&&S.A.inspect().stats.engine===0,'근접 몹은 엔진 탄 바꾸기에서도 빠짐');}
{// 원거리 몹: 다가오려 해도 거리를 지키며 계속 쏘고, 근접 공격은 취소
 const S=sandbox();const e=mob('프리즘 저격병',{ai:'melee',x:15,speed:1.5});S.sb.room.enemies.push(e);let minD=9,atk=0;
 for(let i=0;i<20*30;i++){/* 엔진 걸음 흉내: 영웅 쪽으로 다가감 */if(e.r1210?.mode!=='windup'){const d=Math.hypot(e.x-10,e.y-10);e.x-=(e.x-10)/d*1.5/30;e.y-=(e.y-10)/d*1.5/30;}
  if(i%90===45){e.attack={t:0};atk++;}step(S,1/30);/* R1231: 거리 유지는 첫 쏘기 단계에서만 잼(근접 단계는 일부러 다가감) */if(!S.A.inspect().roleStats.toClose)minD=Math.min(minD,Math.hypot(e.x-10,e.y-10));}
 /* 사용자 11-19 11:22Z R1231 동작 변경: 원거리 몹은 쏘기 3번 뒤 근접 1번 순환 → 20초 4번 이상에서 3번 이상 + 근접 단계 넘어감으로 바꿈 */ok(e.r1210.count>=3&&S.A.inspect().roleStats.toClose>=1,'원거리 몹 20초에 3번 이상 쏘고 근접 단계로('+e.r1210.count+')',[e.r1210,S.A.inspect().roleStats]);ok(minD>=A.keep.min-.1,'원거리 몹이 3.2칸 안으로 안 들어옴(최소 '+minD.toFixed(2)+')');
 /* R1231: 근접 단계에서 휘두른 것(swings)은 취소하지 않음 */const rs=S.A.inspect().roleStats;ok((!e.attack||S.A.effRole(e)==='melee')&&rs.meleeCancels>=atk-1-rs.swings-1,'원거리 몹 쏘기 단계 근접 공격 취소',rs);}
{// 원거리 몹: 영웅이 다가오면 물러남
 const S=sandbox();const e=mob('포낭 곡사체',{x:11.5,speed:1.5});S.sb.room.enemies.push(e);step(S,3);ok(Math.hypot(e.x-10,e.y-10)>=A.keep.min-.05&&S.A.inspect().roleStats.backs>0,'원거리 몹이 붙으면 물러남',{x:e.x,st:S.A.inspect().roleStats});}
{// 벽에 몰려 못 물러나면 가까이서도 쏨(근접은 여전히 안 함)
 const S=sandbox();S.sb.blocked=()=>true;const e=mob('펄스 척후병',{x:11.6});S.sb.room.enemies.push(e);let fired=false;for(let i=0;i<120&&!fired;i++){step(S,1/30);fired=e.r1210?.mode==='windup';}
 ok(fired&&e.r1214Stuck===true&&e.ai==='melee'&&e.cd>0,'몰린 원거리 몹: 1.6칸에서 쏨, 엔진 근접은 쿨다운으로 막음',{s:e.r1210,stuck:e.r1214Stuck,cd:e.cd});}
{// Codex 리뷰(PR 841) 반영: 협동에선 엔진 탄·ai 그대로, 쏜 몹이 죽으면 남은 공격 사라짐, 이름 바뀌면 보스 종류 다시 셈
 const S=sandbox();S.sb.window.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host'};const e=mob('배양 공병',{ai:'hybrid',rangedAim:0});S.sb.room.enemies.push(e);step(S,1);S.sb.ranged3(e);
 ok(S.calls.base===1&&e.ai==='hybrid','협동 모드: 엔진 기본 탄·ai 그대로',{base:S.calls.base,ai:e.ai});
 const T=sandbox();const f=mob('포낭 곡사체');T.sb.room.enemies.push(f);for(let i=0;i<200&&!(f.r1210?.count>=1);i++)step(T,1/30);ok(T.A.inspect().live>=1,'방사능 발사됨');f.hp=0;step(T,1/30);ok(T.A.inspect().live===0,'쏜 몹이 죽으면 남은 공격 사라짐',T.A.inspect().liveDetail);
 const U=sandbox();const b=mob('보스',{boss:true}),m=mob('프리즘 저격병',{x:30});U.sb.room.enemies.push(b,m);ok(U.A.mapKinds(U.sb.room).join()==='laser','맵 종류 laser');m.name='펄스 척후병';ok(U.A.mapKinds(U.sb.room).join()==='sonic','이름 바뀌면 맵 종류 다시 셈',U.A.mapKinds(U.sb.room));}
{// 사몽 각성 감속(R75) 시계 훅: 겨누기 시작·쿨다운·날아가는 공격이 같이 밀림
 const S=sandbox();const hooks=S.sb.window.__STORYWORLD_ENEMY_CLOCKS_R75__;ok(Array.isArray(hooks)&&hooks.length===1,'R75 시계 훅 등록');const e=mob('프리즘 저격병');S.sb.room.enemies.push(e);for(let i=0;i<200&&e.r1210?.mode!=='windup';i++)step(S,1/30);
 const t0=e.r1210.t0,nx=e.r1210.next;hooks[0](e,(o,ks)=>{for(const k of ks)if(o&&typeof o[k]==='number')o[k]+=.5;});ok(Math.abs(e.r1210.t0-t0-.5)<1e-9&&Math.abs(e.r1210.next-nx-.5)<1e-9,'감속 시 겨누기·쿨다운 밀림');}
// ---- R1227 추락(dist06) 불 계열(사용자 11-19 10:51Z "추락일반몹 원거리공격및 스킬 도형으로나오는문제 개선") ----
{for(const [n,k,r] of [['검은기둥 주문사 증원','fire','ranged'],['검은기둥 화염술사','fire','ranged'],['지옥문 파수악마 우두머리','fire','melee'],['소환진 타락천사 추격대','fire','melee']])ok(A.kindFor(n)===k&&A.roleFor(n)===r,'추락 몹: '+n+' → '+k+'·'+r,[A.kindFor(n),A.roleFor(n)]);
 const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r1227/index.json'),'utf8'));
 for(const [k,n] of [['fireball-flight8',8],['crimson-impact12',12],['cast-tell8',8]])ok(idx[k]?.frames===n&&/CX-0167RA_magic-/.test(idx[k].source)&&fs.existsSync(path.join(R,'runtime-text/assets/r1227',k+'.webp'))&&src.includes('assets/r1227/'+k+'.webp'),'Dots 불 시트: '+k);
 const u=A.tune.fire;ok(u&&u.min>=2.4&&u.max<=7.5&&u.dmg<=.9&&u.windup>=.5&&u.windup<=1&&u.dmg/(u.cd*A.rangedCd+u.windup)<=1/(2.1+.55),'불: 사거리·피해·압박 띠',u);
 const S=sandbox();const e=mob('검은기둥 주문사');S.sb.room.enemies.push(e);for(let i=0;i<120&&e.r1210?.mode!=='windup';i++)step(S,1/30);ok(e.r1210?.mode==='windup'&&e.r1210.kind==='fire','주문사: 불 겨누기');
 S.calls.imgs.length=0;S.sb.drawEffect(S.sb.effects.find(x=>x.type==='r1210-fx'));ok(S.calls.imgs.some(q=>/r1227\/cast-tell8/.test(q||''))&&S.calls.imgs.some(q=>/r1227\/fireball-flight8/.test(q||'')),'주문사 예고: 시전 고리·불덩이 시트',[...new Set(S.calls.imgs)]);
 const lines=S.calls.draw.filter(k=>k==='stroke').length;
 S.calls.imgs.length=0;step(S,2.4,1/30,true);ok(S.calls.hurt.length===1&&S.calls.hurt[0][1]==='fire','가만히 선 영웅이 불덩이에 한 번 맞음',S.calls.hurt);ok(S.calls.imgs.some(q=>/r1227\/fireball-flight8/.test(q||''))&&S.calls.imgs.some(q=>/r1227\/crimson-impact12/.test(q||'')),'날아가는 불덩이·진홍 폭발 시트',[...new Set(S.calls.imgs)]);
 const T2=sandbox();const m=mob('지옥문 파수악마'),c=mob('검은기둥 주문사');T2.sb.room.enemies.push(m,c);ok(T2.A.contactFx(m,10,10)===true&&T2.A.contactFx(c,10,10)===false&&T2.A.contactFx(mob('숲 고블린'),10,10)===false,'근접 불 몹만 타격 자국을 넘겨받음');
 T2.calls.imgs.length=0;T2.sb.drawEffect(T2.sb.effects.find(x=>x.type==='r1210-fx'));ok(T2.calls.imgs.some(q=>/r1227\/crimson-impact12/.test(q||'')),'파수악마 타격 자국 = 진홍 폭발 시트(도형 아님)',[...new Set(T2.calls.imgs)]);
 const r248=fs.readFileSync(path.join(R,'client-source/mob-unique-r248.js'),'utf8');ok(/__STORYWORLD_DYS_RANGED_R1210__\?\.contactFx\?\.\(e,hx,hy\)/.test(r248)&&r248===fs.readFileSync(path.join(R,'runtime-text/mob-unique-r248.js'),'utf8'),'R248 접촉 도형 앞에서 R1227 에 먼저 물음(사본 같음)');}
{// R1230 연동: 제자리 고정 적(탑·소환진)은 이 오버레이가 쏘거나 움직이지 않음
 const S=sandbox();const t=mob('검은기둥 주문사',{r75Tower:true,speed:0,x:12}),x0=t.x,y0=t.y;S.sb.room.enemies.push(t);step(S,4,1/30);ok(!t.r1210||t.r1210.mode==null,'고정형: 겨누기 없음',t.r1210);ok(t.x===x0&&t.y===y0,'고정형: 거리 유지 이동 없음');ok(S.A.contactFx(mob('지옥문 파수악마',{r251Circle:true}),10,10)===false,'고정형: 접촉 시트 없음');}
{// R1231 원거리 경향: 쏘기 3 → 근접 1 → 다시 쏘기(엔진 걸음·근접 흉내). 60초 동안 쏘기:근접 ≈ 3:1
 const S=sandbox();const e=mob('프리즘 저격병',{x:16,speed:1.5});S.sb.room.enemies.push(e);let sw=0,cancelInMelee=0;
 for(let i=0;i<60*30;i++){const ph=S.A.effRole(e),d=Math.hypot(e.x-10,e.y-10);
  if(e.r1210?.mode!=='windup'&&d>1.2){e.x-=(e.x-10)/d*1.5/30;e.y-=(e.y-10)/d*1.5/30;}
  if(ph==='melee'&&d<=1.3&&!e.attack){e.attack={t:0};e.atkLeft=.5;sw++;}
  if(e.attack&&e.atkLeft!=null){e.atkLeft-=1/30;if(e.atkLeft<=0){e.attack=null;e.atkLeft=null;}}
  const had=!!e.attack;step(S,1/30);if(had&&ph==='melee'&&S.A.effRole(e)==='melee'&&!e.attack&&e.atkLeft>0)cancelInMelee++;}
 const st=S.A.inspect().roleStats,f=e.r1210.count;ok(sw>=2&&f>=3*sw-2&&f<=3*sw+3,'원거리 경향: 쏘기 '+f+' : 근접 '+sw+' ≈ 3:1',st);ok(cancelInMelee===0,'근접 단계에선 근접 공격을 취소하지 않음');ok(st.toClose>=2&&st.toRange>=2,'근접·원거리 단계를 오감',st);}
{// R1231 근거리 경향: 근접 3 → 물러나 쏘기 1 → 다시 근접
 const S=sandbox();const e=mob('지옥문 파수악마',{x:11,speed:1.5});S.sb.room.enemies.push(e);let sw=0;
 for(let i=0;i<60*30;i++){const ph=S.A.effRole(e),d=Math.hypot(e.x-10,e.y-10);
  if(ph==='melee'){if(d>1.2){e.x-=(e.x-10)/d*1.5/30;e.y-=(e.y-10)/d*1.5/30;}else if(!e.attack&&!(e.cd>0)){e.attack={t:0};e.atkLeft=.5;e.cd=1.2;sw++;}}
  if(e.attack&&e.atkLeft!=null){e.atkLeft-=1/30;if(e.atkLeft<=0){e.attack=null;e.atkLeft=null;}}e.cd=Math.max(0,(e.cd||0)-1/30);
  step(S,1/30);}
 const f=e.r1210?.count||0;ok(f>=2&&sw>=3*f-1&&sw<=3*f+3,'근거리 경향: 근접 '+sw+' : 쏘기 '+f+' ≈ 3:1',[S.A.inspect().roleStats,e.r1210]);
 ok(S.A.inspect().stats.hits.fire+S.A.inspect().stats.fires.fire>=f,'근거리 몹 원거리는 자기 종류(불)로');}
{// R1231: 원거리 불 몹이 근접 단계에서 휘두르면 도형 대신 진홍 시트(contactFx)
 const S=sandbox();const e=mob('검은기둥 주문사');S.sb.room.enemies.push(e);ok(S.A.contactFx(e,10,10)===false,'쏘기 단계 주문사: 접촉 시트 없음');
 step(S,.1);const st=e.r1210;st.count+=3;st.mode=null;st.next=99;step(S,.2);ok(S.A.effRole(e)==='melee'&&S.A.contactFx(e,10,10)===true,'근접 단계 주문사: 진홍 시트로',e.r1231);}
{// Dots 협동 검수(11-19): 솔로→협동 전환 때 겨누기·남은 공격 정리, 원래 ai 복귀, 엔진 겨누기에 새 예고 시트 안 그림
 const S=sandbox();let mode='off';S.sb.window.__STORYWORLD_COOP_SIM_R62__={mode:()=>mode};const e=mob('포낭 곡사체',{ai:'hybrid',x:15});S.sb.room.enemies.push(e);
 for(let i=0;i<300&&!(e.r1210?.count>=1);i++)step(S,1/30);ok(e.ai==='melee'&&S.A.inspect().live>=1,'솔로: 오버레이 발사',S.A.inspect().live);
 mode='host';step(S,1/30);ok(S.A.inspect().live===0&&!e.r1210.mode&&e.ai==='hybrid','협동 전환: 남은 공격 지움·ai 복귀',{live:S.A.inspect().live,ai:e.ai});
 e.rangedWindup=.3;e.rangedAim=0;S.calls.imgs.length=0;S.sb.drawEffect(S.sb.effects.find(x=>x.type==='r1210-fx')||{type:'r1210-fx'});ok(!S.calls.imgs.some(q=>/r121[034]\//.test(q||'')),'협동: 엔진 겨누기에 새 예고 시트 없음',[...new Set(S.calls.imgs)]);}
{// 사용자 11-19 11:42Z: 암시장의 수상한 자 = 근거리 경향(근접 3 : 원거리 1)
 ok(A.roleFor('암시장의 수상한 자')==='melee'&&A.roleFor('암시장의 수상한 자 증원')==='melee'&&A.kindFor('암시장의 수상한 자')==='dark','암시장의 수상한 자: 근거리 경향·원거리는 암흑 1번');}
{// 보스는 역할 손대지 않음(맵 몹 공격 동시 그대로)
 const S=sandbox();const b=mob('백의 안정화 감독',{boss:true,ai:'hybrid',x:15});S.sb.room.enemies.push(b);step(S,1);ok(b.ai==='hybrid','보스 ai 그대로');}
ok(sandbox().A.inspect().stats.errors===0,'오류 0');
console.log('R1214 CPU check '+n+' PASS');
