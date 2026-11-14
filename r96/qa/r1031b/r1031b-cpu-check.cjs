// R1031 후속 CPU 검사: 불면귀(last303) 자세가 바뀌는 순간 R620 교차 보간 잔상(r620Ghost)이 옛 회백 그림(bulmyeongwi_idle/attack/transition)으로 남지 않는가.
//  공개본 헤드리스(추격자 지역 → 불면귀, 25초)에서 공격 전환마다 약 0.09초(2프레임) 옛 그림이 몸보다 크게, 절반은 반대 방향으로 위에 겹쳐 그려졌다(그리기 사슬 맨 바깥에서도 확인).
//  원인: R620 이 R760 보다 안쪽에서 돌면(감싼 순서는 불러오기·지역 순서에 따라 바뀜) 엔진 원래 그림 사이를 교차 보간한 잔상을 만들고, R760 은 몸(bodyCmd)만 바꾸고 r620Ghost 는 건너뛴다.
//  기대: 어느 순서든 불면귀 그리기 명령에 옛 그림이 하나도 남지 않는다. R760 시트 사이 교차 보간(R620 이 바깥일 때)은 그대로 둔다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'../..');let n=0,bad=0;const ok=(c,m)=>{n++;if(c)console.log('ok  ',m);else{bad++;console.log('FAIL',m);}};
const src=fs.readFileSync(path.join(R,'client-source','bulmyeongwi-r760.js'),'utf8'),src620=fs.readFileSync(path.join(R,'client-source','boss-motion-r620.js'),'utf8');
ok(fs.readFileSync(path.join(R,'runtime-text','bulmyeongwi-r760.js'),'utf8')===src,'R760 runtime copy matches client source');
ok(/r96\/qa\/r1031b\/r1031b-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')),'pages.yml runs this check');
// R760 검사의 가짜 엔진(world)을 그대로 빌려 쓰고, R620·R760 을 불러오는 순서만 고른다
const h=fs.readFileSync(path.join(R,'qa','r760','r760-cpu-check.cjs'),'utf8');const a=h.indexOf('const IDLE='),b=h.indexOf('const run=');
let W=h.slice(a,b).replace('if(with620)vm.runInContext(src620,ctx);vm.runInContext(src,ctx);','if(with620==="after"){vm.runInContext(src,ctx);vm.runInContext(src620,ctx);}else if(with620==="inner"){vm.runInContext(src620,ctx);while(timers.length)timers.shift()();vm.runInContext(src,ctx);}else{if(with620)vm.runInContext(src620,ctx);vm.runInContext(src,ctx);}');
ok(W.includes('with620==="after"'),'harness order switch applied');
const world=new Function('vm','src','src620',W+';return world;')(vm,src,src620);
const run=(c,s)=>vm.runInContext(s,c);const OLD=/bulmyeongwi_(idle|attack|rain|transition)\.webp/i;
const boss=o=>({id:'B',nativeId:'l303-boss',name:'불면귀',boss:true,midboss:false,x:3,y:3,hp:1000,maxHp:1000,hitTimer:0,...o});
function scenario(order,sheets){const c=world({sheets,with620:order}),e=boss();const draw=()=>{run(c,'time+=1/30;ctx.commands.length=0');c.drawEnemy(e);return run(c,'ctx.commands').filter(k=>k.kind==='image');};
 for(let i=0;i<20;i++)draw();let oldCmds=0,oldGhosts=0,ghosts=0,frames=0,flipOld=0;
 const look=cm=>{frames++;for(const k of cm){if(k.r620Ghost)ghosts++;if(OLD.test(String(k.sourcePath||k.image?.src||''))){oldCmds++;if(k.r620Ghost)oldGhosts++;}}};
 // 대기 → 공격(엔진 그림 idle → attack) → 거둠 → 대기, 피격(hitTimer) 한 번, 세 번 되풀이
 for(let r=0;r<3;r++){e.attack={elapsed:0,angle:Math.PI,shape154:{windup:.35}};for(let i=0;i<24;i++){e.attack.elapsed+=1/30;look(draw());}e.attack=null;for(let i=0;i<12;i++)look(draw());e.hitTimer=.2;for(let i=0;i<6;i++){e.hitTimer=Math.max(0,e.hitTimer-1/30);look(draw());}for(let i=0;i<12;i++)look(draw());}
 return {oldCmds,oldGhosts,ghosts,frames,err:run(c,'__STORYWORLD_BULMYEONGWI_R760__.inspect().stats.errors')};}
for(const [order,label] of [[true,'R620 loaded before R760 (usual)'],['after','R620 loaded after R760'],['inner','R620 already wrapped when R760 loads (R620 inside R760 — slow/late script load)']])for(const sheets of [true,false]){
 const s=scenario(order,sheets);ok(s.oldCmds===0,`${label}, sheets ${sheets?'ready':'not ready (toned p1~p4)'}: no old grey art in any draw command over ${s.frames} frames (old ${s.oldCmds}, of which R620 ghosts ${s.oldGhosts}; ghosts total ${s.ghosts})`);ok(s.err===0,`${label}, sheets ${sheets}: R760 errors 0`);}
// 회귀: R620 교차 보간 자체는 남는다(R620 이 바깥이고 시트끼리 바뀔 때)
{const s=scenario('after',true);ok(s.ghosts>0,`regression: R620 cross-fade ghosts between R760 sheets still drawn (${s.ghosts})`);}
console.log(`\nR1031b CPU check: ${n-bad}/${n} passed`);process.exit(bad?1:0);
