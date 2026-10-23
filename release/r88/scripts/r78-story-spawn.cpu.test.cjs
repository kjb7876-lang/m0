'use strict';
const fs=require('node:fs'),path=require('node:path');
const {createHarness}=require('./r78-harness.cjs');
(async()=>{
 const h=createHarness(),checks=[],report={schema:'world-r78-story-spawn-cpu/v1',method:'Native region definitions and makeRoom/R75 spawn hooks in Node VM. Not browser, GPU or natural play.',maps:[],browser:false,GPU:false,naturalPlay:false};
 const check=(name,passed,detail)=>checks.push({name,passed:!!passed,...(detail===undefined?{}:{detail})});
 const boot=await h.boot();
 check('Native story data boots without VM errors',boot.booted&&!boot.errors.length,{booted:boot.booted,errors:boot.errors,warnings:boot.warnings});
 const ids=h.run(`(()=>{const safe=new Set(['dreamRest','restEp1b','restU2','restLast3','restKairo','restHando']);return Object.keys(StoryWorldProfilesR74.profiles).filter(id=>id!=='ep1a08'&&!safe.has(id)&&regionById[id]&&!regionById[id].safe);})()`);
 const rows=[];
 for(let i=0;i<ids.length;i+=5){const part=ids.slice(i,i+5);rows.push(...h.run(`(()=>{const ids=${JSON.stringify(part)},out=[];for(const id of ids){const r=getRoom(id,'STORY'),L=r.exploration||{},E=r.enemies||[],alive=E.filter(e=>e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead'),ordinary=alive.filter(e=>Number.isInteger(e.r75Pack)&&!e.boss&&!e.midboss),boss=alive.filter(e=>e.boss),mid=alive.filter(e=>e.midboss&&!e.boss),key=(x,y)=>x+':'+y,floor=new Set((L.floorCells||[]).map(([x,y])=>key(x,y))),allSafe=alive.every(e=>!StoryPhase1.explorationBlocked(L,e.x,e.y,e.combatProfile?.bodyBlock?.r||e.radius||.3)&&floor.has(key(Math.floor(e.x),Math.floor(e.y))));out.push({id,layout:L.type,r78:!!L.r78StoryMaze,enemyCount:alive.length,ordinary:ordinary.length,ordinaryPacks:[...new Set(ordinary.map(e=>e.r75Pack))],bosses:boss.map(e=>({id:e.id,nativeId:e.nativeId,x:e.x,y:e.y,hp:e.hp,maxHp:e.maxHp})),midbosses:mid.map(e=>({id:e.id,nativeId:e.nativeId,x:e.x,y:e.y,hp:e.hp,maxHp:e.maxHp})),allSafe,placement:r.worldCombatR78||null,profile:{style:StoryWorldProfilesR74.profiles[id].style,sourceEnvironment:StoryWorldProfilesR74.profiles[id].sourceEnvironment}});}return out;})()`));}
 report.maps=rows;const metrics=h.run(`__STORYWORLD_WORLD_COMBAT_R78__.inspect().metrics`);
 check('All 55 native combat maps receive R78; 54 keep all three R75 packs and the canonical last301 duel stays boss-only',ids.length===55&&rows.length===55&&rows.every(x=>x.r78)&&rows.filter(x=>x.id!=='last301').every(x=>x.ordinary===30)&&rows.find(x=>x.id==='last301')?.ordinary===0&&rows.find(x=>x.id==='last301')?.bosses.length===1,{maps:ids.length,generated:rows.filter(x=>x.r78).length,ordinary:rows.reduce((n,x)=>n+x.ordinary,0),last301:rows.find(x=>x.id==='last301'),ids});
 check('All story-spawned enemies, midbosses and bosses land on walkable floor',rows.every(x=>x.allSafe),rows.filter(x=>!x.allSafe).map(x=>({id:x.id,bosses:x.bosses,midbosses:x.midbosses})));
 check('Canonical boss and midboss identities remain in their assigned combat rooms',rows.every(x=>x.bosses.every(e=>e.x>=10&&e.x<=25&&e.y>=8&&e.y<=22)&&x.midbosses.every(e=>Math.hypot(e.x-35,e.y-35)<5)),rows.filter(x=>x.bosses.some(e=>e.x<10||e.x>25||e.y<8||e.y>22)||x.midbosses.some(e=>Math.hypot(e.x-35,e.y-35)>=5)));
 check('R78 processed at least all 55 regions without placement failures',metrics.rooms>=55&&metrics.unplaced===0&&metrics.ordinaryMoved>=1620,metrics);
 report.checks=checks;report.metrics=metrics;report.passed=checks.filter(x=>x.passed).length;report.failed=checks.filter(x=>!x.passed).length;
 fs.writeFileSync(path.join(__dirname,'world-r78-story-spawn-results.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({passed:report.passed,failed:report.failed,checks:checks.map(x=>({name:x.name,passed:x.passed})),metrics,maps:rows.map(x=>({id:x.id,enemies:x.enemyCount,ordinary:x.ordinary,bosses:x.bosses.length,midbosses:x.midbosses.length,style:x.profile.style}))},null,2));
 if(report.failed)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
