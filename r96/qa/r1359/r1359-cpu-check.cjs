// R1359 CPU 검사: Dots SW-R1352-D08 몹 사망 연기·재(3크기 16칸) → R462 15세 '재로 소멸' 연기 시트 대체,
//  D09 영웅 피격 8칸 → 근접 아닌 적중(투사체·스킬)에서 영웅 가슴에. 시트 규격·연결·고르기·재생 조건·끄기.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL '+m+(d!==undefined?' '+JSON.stringify(d):''));}else console.log('ok   '+m);};
const rd=p=>fs.readFileSync(p,'utf8');
const N='dots-fx-r1359.js',ASH=['small','medium','boss'].map(v=>'assets/r1359/death-ash-'+v+'-16.webp'),HIT='assets/r163/pixelfx/r1359/hero-hit-8f.webp';
const S=rd(path.join(R,'client-source',N));ok(S===rd(path.join(R,'runtime-text',N)),'runtime-text 사본 같음');
function webp(p){const buf=fs.readFileSync(path.join(R,'runtime-text',p));const t=buf.toString('ascii',12,16);let sz;
 if(t==='VP8X')sz=[1+buf.readUIntLE(24,3),1+buf.readUIntLE(27,3)];else if(t==='VP8L'){const b=buf.readUInt32LE(21);sz=[(b&0x3fff)+1,((b>>14)&0x3fff)+1];}else sz=[buf.readUInt16LE(26)&0x3fff,buf.readUInt16LE(28)&0x3fff];
 return{ok:buf.toString('ascii',0,4)==='RIFF'&&buf.toString('ascii',8,12)==='WEBP',sz,len:buf.length};}
for(const p of ASH){const w=webp(p);ok(w.ok&&w.sz[0]===4096&&w.sz[1]===256&&w.len<300000,'D08 시트 '+p+' 4096×256(16칸) 300KB 미만',w);}
{const w=webp(HIT);ok(w.ok&&w.sz[0]===2048&&w.sz[1]===256&&w.len<100000,'D09 시트 2048×256(8칸)',w);}
// 연결
const html=rd(path.join(R,'runtime-text','index.html'));const iN=html.indexOf('src="./'+N+'"'),i118=html.indexOf('src="./combat-r118.js"'),i462=html.indexOf('src="./mob-death-r462.js"');
ok(iN>0&&iN<i118&&/<script src="\.\/envy-glass-r1343\.js"><\/script>\n<script src="\.\/dots-fx-r1359\.js"><\/script>\n/.test(html),'index.html: 자기 줄(envy-glass-r1343 다음), combat-r118 앞',{iN,i118,i462});
ok(rd(path.join(ROOT,'scripts','verify-r96-public.py')).includes(N),'공개 확인 기대 목록에 있음');
ok(rd(path.join(ROOT,'.github','workflows','pages.yml')).includes('r1359-cpu-check.cjs'),'pages.yml CPU 줄');
const man=rd(path.join(R,'runtime-manifest.json'));ok(man.includes(N)&&ASH.every(p=>man.includes(p))&&man.includes(HIT),'runtime-manifest 에 js·시트 4장');
const D462=rd(path.join(R,'client-source','mob-death-r462.js'));
ok(/__STORYWORLD_DOTS_FX_R1359__/.test(D462)&&/typeof name==='string'\?SHEETS\[name\]:name/.test(D462),'R462 재 소멸: R1359 연기 시트를 먼저 묻고(없으면 예전 R108 연기), sheet() 가 시트 객체를 받음');
ok(rd(path.join(R,'runtime-text','mob-death-r462.js'))===D462,'R462 runtime-text 사본 같음');
// 동작
function world(store,have){const plays=[];const meta={};const sb={console,Date,Math,JSON,localStorage:{getItem:()=>store||null,setItem(){}},time:5,
  actorHeight:()=>60,player:{x:4,y:6,hp:50},readyImage:p=>(have===false?null:{image:{src:p}}),ensureImages:()=>Promise.resolve(),
  __STORYWORLD_PIXELFX_R163__:{meta:()=>meta,play:(name,x,y,o)=>{plays.push({name,x,y,o});return{};},warm(){},has:k=>!!meta[k]},
  hurt:function(d,src){return sb.__r||'hit';},tick:function(){}};sb.window=sb;vm.createContext(sb);vm.runInContext(S,sb);return{sb,plays,meta};}
{const {sb,plays,meta}=world(),A=sb.__STORYWORLD_DOTS_FX_R1359__;ok(!!A&&typeof A.ash==='function','API');
 const a=A.ash(40),b=A.ash(90),c=A.ash(170);
 ok(a&&/small/.test(a.p)&&b&&/medium/.test(b.p)&&c&&/boss/.test(c.p),'몸 키로 크기 고름: 작은(40)·중간(90)·큰(170)',[a&&a.p,b&&b.p,c&&c.p]);
 ok(a.cell===256&&a.cols===16&&a.frames===16&&a.pivot[0]===128&&a.pivot[1]===128&&a.vis>0&&a.lift>0&&a.lift<.6,'시트 규격: 256 칸 16장 1회, 기준 (128,128), 몸 가운데 아래로 띄움',a);
 ok(c.vis>b.vis&&b.vis>a.vis,'구름 크기 기준: 보스판 > 중간 > 작은(그린 크기 ≈ 몸 키)',[a.vis,b.vis,c.vis]);
 ok(!/drop-shadow|blur/.test(a.filter||''),'필터는 기록기 허용 것만');
 // D09
 const shot={x:7,y:6,owner:'e1',kind:'projectile'};sb.hurt(5,shot);
 ok(plays.length===1&&/mob/.test(plays[0].name)&&plays[0].x===4&&plays[0].y===6,'투사체 적중: 영웅 자리에 D09 한 번(이름에 mob — R350 몸 위 옅게 하기 제외)',plays);
 const m=meta[plays[0]&&plays[0].name];ok(m&&m.file==='r1359/hero-hit-8f.webp'&&m.frames===8&&m.columns===8&&m.pivot[0]===128&&m.loop===false,'R163 표 줄: 8칸 1회, 기준 가운데',m);
 const o=plays[0].o;ok(Math.abs(o.z-30)<1e-9&&o.alpha>=.6&&o.alpha<=.85&&o.enemy===true,'가슴 높이(키 .5), 반투명(alpha .6~.85)',o);
 ok(o.flip===false,'출처가 오른쪽이면 그림 방향 그대로');
 sb.hurt(5,shot);ok(plays.length===1,'.3초 안 다시 맞음은 한 번만');
 sb.time=6;sb.hurt(5,{x:1,y:6});ok(plays.length===2&&plays[1].o.flip===true,'왼쪽 출처 → 좌우 반전');
 sb.time=7;sb.hurt(5,{x:5,y:6,attack:{committed:true},lastAttackKind:'melee'});ok(plays.length===2,'근접 기본 공격은 안 그림(R169 돌·R1340 할퀴기·작은 타격이 맡음)');
 sb.time=8;sb.hurt(5,null);sb.hurt(5,undefined);ok(plays.length===2,'출처 없는 피해(도트·환경)는 안 그림');
 sb.time=9;sb.__r='invulnerable';sb.hurt(5,shot);sb.__r='parried';sb.hurt(5,shot);ok(plays.length===2,'안 맞음(무적·막음)은 안 그림');sb.__r='hit';
 sb.time=10;sb.player.hp=0;sb.hurt(5,shot);ok(plays.length===3,'쓰러지는 한 방도 그림');
 ok(A.inspect().errors===0,'오류 0',A.inspect().lastError);}
{const {sb,plays}=world('{"on":false}'),A=sb.__STORYWORLD_DOTS_FX_R1359__;sb.hurt(5,{x:7,y:6});ok(plays.length===0&&A.ash(90)===null,'끄기 {on:false}: D09 안 그리고 D08 대신 예전 R108 연기');}
console.log(bad?`R1359 CPU FAIL ${bad}/${n}`:`R1359 CPU ${n}/${n}`);process.exit(bad?1:0);
