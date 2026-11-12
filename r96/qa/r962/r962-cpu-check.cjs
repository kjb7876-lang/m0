// R962 무한 생존 특수 패시브 귀속 — CPU 검사(정적 + 가짜 엔진).  node r96/qa/r962/r962-cpu-check.cjs
//  사용자 2026-11-12 14:35Z "생존모드도 특수패시브스킬 적용해야해".
//  ① 코어 빛줄기 타격은 영웅 타격이 아니다(출처 friendly:false·sourceHero) → 조종 영웅의 타격 확률 패시브가 코어로 굴러가지 않는다.
//  ② 배치·소환 영웅(r720Ally 몸)이 쏜 투사체가 나중 틱에 맞을 때 그 hitEnemy 한 번 동안 쏜 몸을 player 로 끼운다(몸이 판에 있을 때만).
//  ③ 최종보스 연출 R950 은 생존 cult04 무대(room.survivalR600)에서 꺼진다.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,300));assert(c,m);n++;console.log('PASS',m);};
const rd=(d,f)=>{try{return fs.readFileSync(path.join(R,d,f),'utf8');}catch(_){return '';}};
const F='survival-passives-r962.js',src=rd('client-source',F);
// ---- 정적 ----
ok(src.length>0&&src===rd('runtime-text',F),'R962 모듈이 있고 runtime-text 사본과 같음');
const html=rd('runtime-text','index.html');
ok(html.split('"./'+F+'"').length===2,'index.html 스크립트 태그 한 번');
{const order=['hero-defense-r720.js','hwando-ink-r945.js','lauren-celestial-r946.js','slayer-blood-passive-r947.js','michaela-heart-r948.js','neon-storm-r951.js','hunter-squad-r952.js','gunner-veil-r953.js'].filter(f=>html.includes('"./'+f+'"'));
 const at=f=>html.indexOf('"./'+f+'"');ok(order.every(f=>at(f)<at(F)),'R720·패시브 파일들 뒤에 올라 hitEnemy·makeShot 바깥에 선다',order.map(f=>[f,at(f)]));}
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(/node r96\/qa\/r962\/r962-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'))).includes(F),'runtime-manifest 에 들어 있음');
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
ok(!/ctx\.|drawImage|filter\s*=|addEventListener\(\s*['"]key/.test(strip(src)),'그림·필터·새 키 없음(시각 변화 없음, 스킬 키 그대로)');
// ① 코어 빛줄기 출처
const sv=rd('client-source','survival-r600.js');ok(sv===rd('runtime-text','survival-r600.js'),'survival-r600 runtime-text 사본 일치');
ok(/hitEnemy\(e,baseAtk\(\)\*1\.1\*st\.dmg,coreSrc\(\)\)/.test(sv),'코어 빛줄기 hitEnemy 에 출처를 넘긴다');
{const m=/const coreSrc=\(\)=>\((\{[^}]*\})\)/.exec(sv);ok(!!m,'coreSrc 정의(타격마다 새 객체 — 얼린 객체면 다른 덧씌우기가 표식을 적다 오류)');const s=m&&vm.runInNewContext('('+m[1]+')');
 ok(s&&s.friendly===false&&s.sourceHero&&s.sourceHero!=='lauren'&&s.owner!=='hero'&&!s.attackKind9,'코어 출처: friendly:false·영웅 아닌 sourceHero·영웅 기술 표식 없음',s);
 // 패시브 mine() 그대로 돌려 본다(라우렌·미카엘라·네온 같은 꼴)
 for(const [f,H] of [['lauren-celestial-r946.js','lauren'],['michaela-heart-r948.js','michaela'],['neon-storm-r951.js','neon']]){const t=rd('client-source',f);if(!t)continue;
  const mm=/function mine\(src\)\{[^\n]*?return true;\}/.exec(t);ok(!!mm,f+' mine() 찾음');
  const mine=vm.runInNewContext(`(()=>{const P=()=>player,HERO=${JSON.stringify(H)};${mm[0]};return mine;})()`,{player:{hero:H}});
  ok(mine(s)===false&&mine({kind:'basic'})===true&&mine(undefined)===true,f+': 코어 타격은 조종 '+H+' 패시브를 굴리지 않음(자기 타격은 그대로)');}}
// ③ R950
{const t=rd('client-source','finale-r950.js');if(t){ok(t===rd('runtime-text','finale-r950.js'),'finale-r950 runtime-text 사본 일치');
 const m=/const storyRoom=\(\)=>\{try\{return ([^;]*?);\}catch/.exec(t);ok(!!m,'storyRoom 찾음');
 const fn=(room,layer)=>vm.runInNewContext('(()=>{try{return '+m[1]+';}catch(_){return false;}})()',{room,layer,ZONE:'cult04'});
 ok(fn({id:'cult04',layer:'STORY'},'STORY')===true,'스토리 cult04 에서는 그대로 켜짐');
 ok(fn({id:'cult04',layer:'STORY',survivalR600:{}},'STORY')===false,'생존 cult04 무대에서는 꺼짐');}}
// ② 가짜 엔진: 투사체 명중 귀속
{const log=[];const ctx={window:{},localStorage:{getItem:()=>null,setItem(){}},console};ctx.window=ctx;
 vm.createContext(ctx);
 vm.runInContext(`var player={hero:'seoha',hp:10},target='T0',command=null,route=null;
  var bodyA={hero:'michaela',hp:10,r720Ally:true},bodyB={hero:'gunner',hp:10,r720Ally:true},gone={hero:'neon',hp:10,r720Ally:true};
  var live=[bodyA,bodyB];window.__STORYWORLD_HERO_DEFENSE_R720__={bodies:()=>live.slice()};
  var seen=[];function makeShot(x,y,a,s,d,opt={}){return {x,y,damage:d,...opt};}
  function hitEnemy(e,v,src){seen.push({who:player.hero,ally:player.r720Ally===true,src:src&&src.sourceHero});target='MOVED';return true;}`,ctx);
 vm.runInContext(src,ctx);
 const r=vm.runInContext(`(()=>{const out={};
  player=bodyA;const s1=makeShot(0,0,0,1,5);player=gone;const s3=makeShot(0,0,0,1,5);player=window.mainP||{hero:'seoha',hp:10};window.mainP=player;
  const s2=makeShot(0,0,0,1,5);const sx=makeShot(0,0,0,1,5,{sourceHero:'hunter'});
  hitEnemy({},5,s1);out.a=seen.pop();out.after=player.hero;out.target=target;
  hitEnemy({},5,s2);out.main=seen.pop();
  hitEnemy({},5,s3);out.gone=seen.pop();
  hitEnemy({},5);out.none=seen.pop();
  out.s1src=s1.sourceHero;out.s2src=s2.sourceHero||null;out.st=window.__STORYWORLD_SURVIVAL_PASSIVES_R962__.inspect().stats;return out;})()`,ctx);
 ok(r.a.who==='michaela'&&r.a.ally===true,'배치 미카엘라가 쏜 탄이 맞는 순간 player 는 그 몸(그 몸 패시브로 굴러감)',r);
 ok(r.after==='seoha','명중 뒤 조종 영웅으로 되돌림',r);
 ok(r.target==='T0','명중 동안 바뀐 엔진 겨눔 명령(target)을 되돌림',r);
 ok(r.main.who==='seoha'&&r.main.ally===false&&r.s2src===null,'조종 영웅 탄은 그대로(표식·끼우기 없음)',r);
 ok(r.gone.who==='seoha'&&r.gone.src==='neon','판에서 빠진 몸의 탄은 끼우지 않고 sourceHero 표식만(조종 영웅 패시브가 남의 탄으로 안 굴러감)',r);
 ok(r.none.who==='seoha','출처 없는 타격은 그대로',r);
 ok(r.s1src==='michaela','몸 탄에 sourceHero 를 적음',r);
 // 패시브가 자기 틱에서 몸 대신 낸 타격(sourceHero 가 판에 있는 다른 영웅) → 그 몸 차례, 그 타격이 부른 바깥 광역도 그 몸 차례
 const q=vm.runInContext(`(()=>{const out={};const inner=hitEnemy;
  hitEnemy({},5,{kind:'story-x',sourceHero:'gunner'});out.tick=seen.pop();
  hitEnemy({},5,{kind:'story-x',sourceHero:'seoha'});out.own=seen.pop();
  hitEnemy({},5,{kind:'story-x',sourceHero:'neon'});out.absent=seen.pop();
  hitEnemy({},5,{kind:'r600-core-beam',sourceHero:'r600-core',friendly:false});out.core=seen.pop();
  return out;})()`,ctx);
 ok(q.tick.who==='gunner'&&q.tick.ally===true,'출처 sourceHero 가 배치된 기억사수 → 그 몸 차례',q);
 ok(q.own.who==='seoha'&&q.absent.who==='seoha'&&q.core.who==='seoha','조종 영웅 자신·판에 없는 영웅·코어 출처는 끼우지 않음',q);
 ok(r.st.routed===1&&r.st.stale===1&&r.st.errors===0,'통계',r.st);
 // 끄기
 const c2={window:{},localStorage:{getItem:k=>k==='storyworld.r962.survivalPassives'?'{"on":false}':null,setItem(){}}};c2.window=c2;vm.createContext(c2);
 vm.runInContext(`var player={hero:'seoha',hp:10},bodyA={hero:'michaela',hp:10,r720Ally:true};window.__STORYWORLD_HERO_DEFENSE_R720__={bodies:()=>[bodyA]};var seen=[];
  function makeShot(x,y,a,s,d,opt={}){return {damage:d,...opt};}function hitEnemy(e,v,src){seen.push(player.hero);return true;}`,c2);vm.runInContext(src,c2);
 ok(vm.runInContext(`(()=>{const m=player;player=bodyA;const s=makeShot(0,0,0,1,1);player=m;hitEnemy({},1,s);return seen[0]==='seoha'&&!s.sourceHero;})()`,c2),'끄면 아무것도 바꾸지 않음');}
console.log(`R962 CPU check: ${n} passed`);
