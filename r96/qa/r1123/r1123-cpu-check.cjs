// R1123 환도 기본 공격 적중 그림 자리 — CPU 검사. node r96/qa/r1123/r1123-cpu-check.cjs
//  사용자 2026-11-17 09:51Z "환도영웅 이펙트 적중 이상한곳에서 나오는 버그 특히 기본공격".
//  원인: R1034 먹 검흔·R945 묵월·R590 발도 베기가 엔진이 실제로 벤 적(조준 대상 target=적 id 먼저, 벽 너머 제외) 대신 '가까운 적'을 골랐다.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m);};
const read=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
for(const f of ['hwando-ink-trace-r1034.js','hwando-ink-r945.js','hwando-chain-r590.js']){const s=read(f);
 ok(s===fs.readFileSync(path.join(R,'runtime-text',f),'utf8'),f+' runtime-text 사본 일치');
 ok(/const engineFoe=p=>/.test(s)&&/clearLine\(p,v\)/.test(s)&&/v\.id===tid/.test(s),f+' 엔진과 같은 고르기(engineFoe: 사거리·벽·target id)');}
ok(/pre=engineFoe\(p\),r=base\.apply/.test(read('hwando-ink-trace-r1034.js')),'R1034: 휘두르기 전에 벨 적을 고름');
ok(/pre=engineFoe\(p\),r=base\.apply/.test(read('hwando-ink-r945.js'))&&/castMoon\(s,p,pre\)/.test(read('hwando-ink-r945.js')),'R945: 묵월이 벤 적 쪽으로');
ok(/pre=can\?engineFoe\(player\):null/.test(read('hwando-chain-r590.js'))&&/const e=pre\|\|nearest\(4\)/.test(read('hwando-chain-r590.js')),'R590: 발도 베기 각이 벤 적 쪽');
ok(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8').includes('node r96/qa/r1123/r1123-cpu-check.cjs'),'pages.yml 검사 단계');
// ---- 가짜 엔진(R1034) : 엔진 blade basicAttack 규칙 그대로 ----
const src=process.env.R1123_SRC?fs.readFileSync(process.env.R1123_SRC,'utf8'):read('hwando-ink-trace-r1034.js');
function engine(enemies,{walls=()=>true}={}){let clock=10;const room={id:'r',enemies};const W={};
 const g={window:W,localStorage:{getItem:()=>null,setItem:()=>{}},console,Math,JSON,Set,Map,WeakMap,Array,Object,String,Number,Error,Promise,get time(){return clock;},TILE:32,zoom:1,room,settings:{},effects:[],target:null,
  HEROES:{hwando:{range:3.15}},player:{x:20,y:20,hp:100,hero:'hwando',attackCD:0},project:(x,y)=>({x:(x-y)*32,y:(x+y)*16}),actorHeight:()=>60,
  liveEnemies:()=>room.enemies.filter(e=>e.hp>0),clearLine:(a,b)=>walls(b),readyImage:()=>null,ensureImages:()=>Promise.resolve(),
  basicAttack(){const p=g.player;if(p.attackCD>0)return;const c=g.liveEnemies().filter(v=>Math.hypot(v.x-p.x,v.y-p.y)<=3.15&&g.clearLine(p,v));const e=c.find(v=>v.id===g.target)||c.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(!e)return;p.attackCD=.5;e.hp-=10;},
  fx:()=>{},drawEffect:()=>{},tick:()=>{},enterRegion:async()=>true,ctx:{commands:[],save(){},restore(){},translate(){},scale(){},rotate(){},drawImage(){}}};
 const ctx=vm.createContext(g);vm.runInContext(src,ctx);return {g,ctx,api:W.__STORYWORLD_HWANDO_INK_TRACE_R1034__};}
const atk=E=>{E.ctx.basicAttack();const m=E.api.inspect().marks.filter(m=>m.k==='atk');return m[m.length-1]||null;};
{const N={id:1,x:18.6,y:20,hp:50},T={id:2,x:22.6,y:20,hp:50},E=engine([N,T]);E.g.target=2;const m=atk(E);ok(m&&m.x===T.x&&T.hp<50&&N.hp===50,'조준 대상 T(앞 2.6칸)를 베면 검흔도 T — 뒤의 가까운 N 아님');}
{const N={id:1,x:18.6,y:20,hp:50},T={id:2,x:22.6,y:20,hp:50},E=engine([N,T]);const m=atk(E);ok(m&&m.x===N.x,'조준 대상 없으면 가장 가까운 적 N');}
{const W={id:1,x:21,y:20,hp:50},F={id:2,x:20,y:22.5,hp:50},E=engine([W,F],{walls:b=>b.id!==1});const m=atk(E);ok(m&&m.x===F.x&&m.y===F.y,'벽 너머 가까운 적 W 위가 아니라 실제로 벤 F 위');}
{const A={id:1,x:23.3,y:20,hp:50},E=engine([A]);const m=atk(E);ok(!m,'사거리 3.15 밖(3.3칸) 적: 엔진도 안 베고 검흔도 없음(예전엔 3.4칸까지 그렸음)');}
{const A={id:1,x:23.15,y:20,hp:50},E=engine([A]);const m=atk(E);ok(m&&m.x===A.x,'경계값 3.15칸 정확히: 베고 검흔');}
{const A={id:1,x:21,y:20,hp:10},E=engine([A]);const m=atk(E);ok(m&&m.x===A.x&&A.hp<=0,'한 방에 죽은 적에도 검흔(휘두르기 전에 골라 둠)');}
{const A={id:1,x:NaN,y:20,hp:50},B={id:2,x:21,y:20,hp:50},E=engine([A,B]);const m=atk(E);ok(m&&m.x===B.x&&E.api.inspect().errors===0,'NaN 좌표 적은 건너뜀, 오류 0');}
{const A={id:1,x:21,y:20,hp:50},E=engine([A]);E.g.player.hero='seoha';const m=atk(E);ok(!m,'다른 영웅은 그대로');}
console.log(`R1123 CPU ${n}/${n} 통과`);
