// R981 브라우저 확인(헤드리스 — 실제 GPU·자연 플레이·귀로 듣기는 아님): 실제 엔진 last302 에서 중간보스 이름·회백 몸·실·자막·효과음·처치, last303 본체 이름 그대로.
//  SHOT=1 이면 전후 장면을 qa/r981/shots/ 에 찍는다. SCENE3D=0 이면 2D 그리기로.
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=new URL('./shots/',import.meta.url).pathname;fs.mkdirSync(OUT,{recursive:true});
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};const errs=[];
const s3d=process.env.SCENE3D!=='0';
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const {p}=await boot(b,{vp:{width:960,height:540},init:s3d?{'storyworld.r183.scene3d':JSON.stringify({on:true})}:null});p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await go(p,'last303');
const boss=await p.evaluate(()=>room.enemies.filter(e=>e.boss).map(e=>e.name));
if(process.env.SHOT==='1'){await p.evaluate(async()=>{const W=ms=>new Promise(r=>setTimeout(r,ms));modal=null;const e=room.enemies.find(x=>x.boss);e.spawnState='active';e.visible=true;e.x=player.x+3.2;e.y=player.y-1.4;e.speed=0;e.moveSpeed=0;
 room.enemies.filter(v=>v!==e).forEach(v=>{v.x=player.x+40;v.y=player.y+40;});for(let k=0;k<3;k++){for(let j=0;j<160&&storyScene;j++)advanceScene();if(modal)closePanel(true);await W(800);}});
 await p.screenshot({path:OUT+`boss-last303-${s3d?'3d':'2d'}.png`});}ok(boss.includes('불면귀'),'last303 본체 이름 그대로('+boss+')');
await go(p,'last302');
const OLD='검은 안개 심장';
const setup=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));modal=null;player.hp=99999;
 const e=room.enemies.find(x=>x.nativeId==='mb-last302-v31231');if(!e)return {missing:true};
 const out={name:e.name,from:e.r981From,key:e.r248Key,id:e.id,hp:e.hp,maxHp:e.maxHp,path:e.path};
 // 장면: 중간보스를 영웅 앞에, 주민 다섯을 둘레에. AI 걸음은 멈춤.
 e.spawnState='active';e.visible=true;e.x=player.x+3.2;e.y=player.y-1.4;e.speed=0;e.moveSpeed=0;e.hp=Math.max(e.hp,5000);
 const vs=room.enemies.filter(v=>/^l302-e[13]$/.test(v.nativeId)&&v.hp>0&&!v.midboss&&v.spawnState==='active').slice(0,5);
 const ring=[[1.6,2.4],[4.6,1.2],[5.2,-2.4],[1.2,-3.6],[-0.6,0.2]];vs.forEach((v,i)=>{v.x=player.x+ring[i][0];v.y=player.y+ring[i][1];v.speed=0;v.moveSpeed=0;v.hp=Math.max(v.hp,5000);});
 room.enemies.filter(v=>!vs.includes(v)&&v!==e&&v.hp>0).forEach(v=>{v.x=player.x+40;v.y=player.y+40;});
 room.engaged=true;await wait(2500);
 return {...out,toast:document.getElementById('toast')?.textContent||'',stats:window.__STORYWORLD_PUPPET_R981__.inspect()};});
console.log(JSON.stringify(setup));
ok(!setup.missing&&setup.name==='꼭두각시 실안개'&&setup.from==='검은 안개 심장 · 불면의 기억','중간보스 이름 = 꼭두각시 실안개');
ok(setup.id==='last302:mb-last302-v31231'&&/bulmyeongwi_b\.webp$/.test(setup.path),'id·그림 경로 그대로');
ok(setup.stats.stats.filtered>0,'몸을 회백 필터로 그림('+setup.stats.stats.filtered+')');
ok(setup.stats.stats.threads>0,'주민에게 실('+setup.stats.stats.threads+')');
ok(/^꼭두각시 실안개 —/.test(setup.toast)||setup.stats.stats.captions>=1,'등장 자막('+setup.toast+')');
ok(!s3d||setup.stats.stats.ghostsDropped>0,'본체 표식 겹 잔상 뗌('+setup.stats.stats.ghostsDropped+')');
const scan=await p.evaluate((OLD)=>{const txt=document.body.innerText;const cmds=Array.isArray(ctx?.commands)?ctx.commands.filter(c=>c?.kind==='text').map(c=>String(c.text||'')):[];
 return {dom:txt.includes(OLD),cmds:cmds.filter(t=>t.includes(OLD)),cmdNew:cmds.filter(t=>t.includes('꼭두각시')).length,r760:window.__STORYWORLD_BULMYEONGWI_R760__.inspect().stats};},OLD);
ok(!scan.dom&&scan.cmds.length===0,'화면 글(DOM·그리기 글)에 옛 이름 없음');console.log(JSON.stringify(scan));
if(process.env.SHOT==='1'){
 const cam=async name=>{await p.evaluate(async()=>{const W=ms=>new Promise(r=>setTimeout(r,ms));for(let k=0;k<3;k++){for(let j=0;j<160&&storyScene;j++)advanceScene();if(modal)closePanel(true);await W(700);}});for(let k=0;k<4;k++){const sk=p.getByText('건너뛰기',{exact:true});if(await sk.count()&&await sk.first().isVisible())await sk.first().click().catch(()=>{});await p.waitForTimeout(600);}await p.screenshot({path:OUT+name});};
 await cam(`after-${s3d?'3d':'2d'}.png`);
 await p.evaluate(()=>{const e=room.enemies.find(x=>x.nativeId==='mb-last302-v31231');window.__STORYWORLD_PUPPET_R981__.set({on:false});e.name=e.r981From;});
 await cam(`before-${s3d?'3d':'2d'}.png`);
 await p.evaluate(()=>{window.__STORYWORLD_PUPPET_R981__.set({on:true});});
}
// 효과음·처치
const k=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));try{await unlockAudio();}catch(_){}settings.sound=true;settings.volume=1;await wait(1500);
 const C=window.__STORYWORLD_SFX_COMFORT__,plays=()=>C?C.inspect().audit.filter(x=>x.kind==='play'):[],mark=()=>new Set(plays().map(x=>x.id)),since=s=>plays().filter(x=>!s.has(x.id)).map(x=>x.path.split('/').pop());
 const e=room.enemies.find(x=>x.nativeId==='mb-last302-v31231');const out={};const h0=window.__STORYWORLD_SFX_R954__.inspect().stats.hit;let m0=mark();hitEnemy(e,3);await wait(2000);out.hit=since(m0);out.hitN=window.__STORYWORLD_SFX_R954__.inspect().stats.hit-h0;
 m0=mark();e.hp=1;hitEnemy(e,99);await wait(1200);out.die=since(m0);out.dead=!(e.hp>0);
 out.blocked=!!(modal||storyScene);
 // 처치 순간 서사 창(문 이야기)이 뜨면 자막은 창을 닫은 뒤에 나온다 → 창을 넘기고 본다.
 for(let i=0;i<40&&!/흩어져/.test(document.getElementById('toast')?.textContent||'');i++){if(storyScene){for(let j=0;j<160&&storyScene;j++)advanceScene();}if(modal)closePanel(true);await wait(250);}
 out.toast=document.getElementById('toast')?.textContent||'';out.stats=window.__STORYWORLD_PUPPET_R981__.inspect();out.r954=window.__STORYWORLD_SFX_R954__.inspect().stats;return out;});
console.log(JSON.stringify(k));
ok(k.hit.some(f=>/^hit-mistheart-[1-3]\.ogg$/.test(f))||k.hitN===1,'피격음 = 중간보스 소리 그대로('+k.hit+', R954 피격 '+k.hitN+')');
ok(k.dead&&k.die.some(f=>/^die-mistheart-[1-3]\.ogg$/.test(f)),'처치·사망음 그대로('+k.die+')');
ok(/흩어져/.test(k.toast),'처치 자막('+k.toast+')');
if(process.env.SHOT==='1'){await p.evaluate(async()=>{const e=room.enemies.find(x=>x.nativeId==='mb-last302-v31231');});await p.screenshot({path:OUT+`death-${s3d?'3d':'2d'}.png`});}
ok(k.stats.stats.errors===0&&k.r954.errors===0,'오버레이 오류 0('+k.stats.lastError+')');
ok(errs.length===0,'페이지 오류 0 '+errs.slice(0,2).join(' | '));
console.log('\nR981 browser ('+(s3d?'3D':'2D')+'): '+(n-bad)+'/'+n);await b.close();process.exit(bad?1:0);
