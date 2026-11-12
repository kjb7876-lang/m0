'use strict';
// R965 — 중간보스 공격음(R789)이 '서사 패턴 공격'에서는 나지 않던 것(R964 가 보스에서 고친 것과 같은 원인).
//  11-12 실전투 점검(헤드리스, 새 main f777c9d): 늪의 뿔악마 군주·첫 동료의 악마잔영은 패턴 공격(storyAttackState5 'attackB') 5번에 공격음 0번,
//  핏빛 수호로 추격자·호텔 화염기사는 3번에 0번. 피격음·사망음은 났다. 엔진 패턴 공격은 setAttackPose5 로 시작해 enemy.attack 에 id 가 없고 bossVolley 도 부르지 않는다.
//  고침: R789 tick 도 중간보스의 enemy.storyAttackStart5 가 바뀐 순간을 공격 시작으로 본다. 간격 제한(1.2초)·전투 중·창 없음 조건은 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('PASS',m);};
const src=fs.readFileSync(path.join(R,'client-source/combat-sfx-r789.js'),'utf8');
ok(fs.readFileSync(path.join(R,'runtime-text/combat-sfx-r789.js'),'utf8')===src,'runtime-text 사본 = client-source');
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');
ok(/enemy\.storyAttackStart5 = time \+ Math\.max\(0, windup\)/.test(html)&&/storyWorldPose5:true/.test(html),'엔진 패턴 공격은 여전히 storyAttackStart5 로 시작하고 attack 에 id 가 없다(이 고침의 전제)');
function mk(){const played=[],timers=[];let clock=1000;
 const ctx={window:{__STORYWORLD_SFX_COMFORT__:{aliases:{},roles:{}}},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>clock},console,Math,Promise,
  setInterval:f=>{timers.push(f);return 1;},setTimeout:()=>1,soundProfiles:{enemyHit:[{path:'h.ogg'}],clear:[{path:'c.ogg'}]},setupAudio:()=>'base',audioUnlocked:true,audioBuffer:()=>Promise.resolve({}),
  started:true,modal:null,loading:false,player:{x:0,y:0,hp:10,hero:'hwando'},room:{engaged:true,enemies:[]}};
 ctx.sound=function(kind,allow){played.push({kind,allow});return Promise.resolve();};
 ctx.hitEnemy=function(e,v){if(!e||e.hp<=0||!(v>0))return false;e.hp-=v;return true;};ctx.killEnemy=function(e){e.hp=0;e.deadRecorded=true;};ctx.bossVolley=function(){return 'volley';};
 ctx.window.window=ctx.window;vm.createContext(ctx);vm.runInContext('var window=this.window;'+src,ctx);
 return{ctx,tick:()=>timers.forEach(f=>f()),adv:ms=>{clock+=ms;},atk:s=>played.filter(p=>p.kind==='r789MAtk_'+s).length,kinds:()=>played.map(p=>p.kind)};}
const boss=(name,o={})=>({name,midboss:true,hp:100,x:1,y:0,id:1,...o});
// 패턴 공격: setAttackPose5 가 하는 것과 같은 값 변화
let m=mk(),e=boss('늪의 뿔악마 군주',{storyAttackState5:null,storyAttackStart5:0,storyAttackUntil5:0});m.ctx.room.enemies=[e];m.tick();
ok(m.atk('swamphorn')===0,'가만히 있는 보스는 공격음 없음');
e.attack={elapsed:0,angle:0,committed:true,storyWorldPose5:true};e.storyAttackState5='attackA';e.storyAttackStart5=12.32;e.storyAttackUntil5=12.88;m.tick();
ok(m.atk('swamphorn')===1,'패턴 공격 시작(storyAttackStart5 바뀜)에서 중간보스 공격음: '+m.atk('swamphorn'));
m.tick();m.adv(2000);m.tick();ok(m.atk('swamphorn')===1,'같은 패턴 공격은 다시 내지 않음');
e.storyAttackStart5=15.1;e.storyAttackUntil5=15.7;m.tick();ok(m.atk('swamphorn')===2,'다음 패턴 공격(1.2초 지난 뒤)에서 다시 한 번: '+m.atk('swamphorn'));
e.storyAttackStart5=15.4;m.adv(300);m.tick();ok(m.atk('swamphorn')===2,'1.2초 안의 연속 패턴은 간격 제한에 걸림');
e.storyAttackState5=null;e.storyAttackStart5=0;e.storyAttackUntil5=0;m.adv(3000);m.tick();ok(m.atk('swamphorn')===2,'공격 상태가 지워질 때(0 으로 돌아감)는 소리 없음');
// 방에 들어온 순간 이미 진행 중이던 패턴은 본 것으로만 기억
m=mk();e=boss('호텔 화염기사',{storyAttackStart5:7.5});m.ctx.room.enemies=[e];m.tick();ok(m.atk('flameknight')===0,'처음 본 순간 이미 있던 패턴 공격은 기억만');
// 조건: 전투 전·창·죽은 보스·일반 몹
m=mk();e=boss('보라검천사',{storyAttackStart5:0});m.ctx.room.enemies=[e];m.ctx.room.engaged=false;m.tick();e.storyAttackStart5=3;m.tick();ok(m.atk('spiderangel')===0,'전투 시작 전(engaged=false)엔 없음');
m=mk();e=boss('보라검천사',{storyAttackStart5:0});m.ctx.room.enemies=[e];m.tick();m.ctx.modal={};e.storyAttackStart5=3;m.tick();ok(m.atk('spiderangel')===0,'창이 떠 있으면 없음');
m=mk();e={name:'해골 병사',hp:5,storyAttackStart5:0};m.ctx.room.enemies=[e];m.tick();e.storyAttackStart5=3;m.tick();ok(!m.kinds().some(k=>/^r789/.test(k)),'일반 몹 패턴 공격은 그대로(중간보스 소리 없음)');
// 원래 길(근접 attack.id)은 그대로
m=mk();e=boss('보라검천사');m.ctx.room.enemies=[e];m.tick();e.attack={id:7};m.tick();ok(m.atk('spiderangel')===1,'근접 공격 시작(attack.id 바뀜)은 그대로 공격음');
m.adv(2000);m.tick();ok(m.atk('spiderangel')===1,'같은 attack.id 는 다시 내지 않음');
// 근접 id 와 패턴이 같은 순간에 함께 바뀌어도 한 번
m=mk();e=boss('핏빛 수호로 추격자',{storyAttackStart5:0});m.ctx.room.enemies=[e];m.tick();e.attack={id:9};e.storyAttackStart5=4;m.tick();ok(m.atk('bloodpursuer')===1,'근접 id 와 패턴이 함께 바뀌어도 한 번');
// NaN·문자열 같은 이상값은 무시
m=mk();e=boss('첫 동료의 악마잔영',{storyAttackStart5:0});m.ctx.room.enemies=[e];m.tick();e.storyAttackStart5=NaN;m.tick();e.storyAttackStart5='x';m.adv(2000);m.tick();ok(m.atk('comradeecho')===0,'숫자가 아닌 값은 공격 시작으로 보지 않음');
// 보스(e.boss)는 R788 몫 — R789 는 내지 않는다
m=mk();e={name:'늪의 뿔악마 군주',boss:true,midboss:true,hp:100,storyAttackStart5:0};m.ctx.room.enemies=[e];m.tick();e.storyAttackStart5=3;m.tick();ok(!m.kinds().some(k=>/^r789/.test(k)),'보스 표시가 있으면 R789 는 내지 않음(R788 몫)');
console.log(`\nR965 CPU: ${n-bad}/${n}`);process.exit(bad?1:0);
