// R1264 영웅 공격 모션 전수(헤드리스, 소프트웨어 렌더): 777 로 연 영웅 전원을 실제 영웅 변경과 같은 길(ensureImages(heroPaths) → player.hero)로 바꾸고
//  지역 진입 때 엔진이 하는 그림 기억 비우기(releaseImageMemory)를 그대로 부른 '차가운' 상태와, 같은 동작을 한 번 더 한 '따뜻한' 상태에서
//  기본 공격(4방향 연사)·Q·W·E·R 을 실제 키로 눌러, 매 프레임 drawHero 가 남긴 몸 그림(영웅 몫 이미지 중 가장 큰 것)의 경로·크기를 적는다.
//  판정: 차가운 상태에서 공격·스킬 중 그려진 몸 그림이 같은 영웅·같은 동작의 따뜻한 상태 그림 묶음에 없으면 '옛 그림 끼어듦'.
//  STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r1264 [HEROES=gunner,lauren] [LOWQ=1] node r96/qa/r1264/census.mjs   (GPU·실기기·자연 플레이 미검증)
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r1264';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
const LOWQ=process.env.LOWQ==='1';
// 옛 몸 그림(1차 전수에서 따뜻한 상태엔 안 나오고 비운 직후·스킬 때만 나온 것): 엔진 첫 영웅 그림, R128·R130 정지 자세 g-*(대시 제외), 기억사수·헌터 R143 공격, 슬레이어 R351 공격
const OLD=/hero_direction|hero-authored|^assets\/heroes\/|^assets\/r143\/attack\/(?:gunner|hunter)\/|^assets\/r128\/gunner\/g-(?!dash)|^assets\/r130\/[a-z]+\/g-(?!dash)|^assets\/r351\/slayer\/attack-/;
await ctx.addInitScript((lowq)=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r663.skillgrowth','{"on":false}');if(lowq)localStorage.setItem('storyworld.r1023.tier',JSON.stringify({pref:0}));}catch(_){}},LOWQ);
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
if(LOWQ)await p.evaluate(()=>{try{settings.lowFx=true;}catch(_){}});
const heroes=await p.evaluate(()=>Object.keys(HEROES));console.log('heroes',heroes.join(','));
const want=(process.env.HEROES||'').split(',').filter(Boolean);const ALLH=[...heroes,'ego','persona'];const LIST=want.length?ALLH.filter(h=>want.includes(h)):ALLH;
await p.evaluate(()=>{guide=false;auto=false;try{settings.autoSkill=false;}catch(_){}
 const W=window.__r1264={rows:[],on:false,tag:null,pin:null};
 const dh=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=dh.apply(this,a);
  try{if(st>=0&&W.on){let best=null,bh=0,n=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||!c.points)continue;if(c.owner&&c.owner.kind!=='hero')continue;n++;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}
   const P=player,act=P.ultimateAnim>0?'ult':P.skillAnim>0?'skill':P.dashAnim>0?'dash':P.hurtAnim>0?'hurt':P.attackAnim>0?'attack':'idle';
   const src=best?String(best.sourcePath||best.image?.src||'').replace(/^.*?(assets\/)/,'$1').split('?')[0]:null;
   W.rows.push({tag:W.tag,hero:P.hero,act,t:+time.toFixed(3),src,sr:best?.sourceRect?best.sourceRect.map(v=>Math.round(v)):null,h:+bh.toFixed(1),mir:best?best.points[1][0]<best.points[0][0]:null,n});}}catch(e){W.err=String(e);}return r;};
 {const ok=(x,y)=>{if(typeof blocked==='function'&&blocked(x,y,.5))return false;for(let s=0;s<8;s++){const S=s*Math.PI/4;for(const r of [1.6,3.4])if(blocked(x+Math.cos(S)*r,y+Math.sin(S)*r,.6))return false;}return true;};
  let best=null;for(let r=0;r<30&&!best;r+=.5)for(let a=0;a<6.283&&!best;a+=.3){const x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;if(ok(x,y))best={x,y};}if(best){player.x=best.x;player.y=best.y;}W.spot=best;}
 (function pin(){const P=W.pin;if(P){const e=P.e;e.x=player.x+P.dx;e.y=player.y+P.dy;e.spawnState='active';e.visible=true;e.hp=1e7;e.speed=0;e.attack=null;for(const v of room.enemies)if(v!==e&&v.hp>0){v.x=player.x-60;v.y=player.y-60;v.speed=0;}}requestAnimationFrame(pin);})();
});
// 한 단계: 표적을 deg 쪽(화면 각도)에 고정하고 sec 게임초 동안 기본 공격 또는 키 하나
async function step(tag,deg,mode,sec){
 const t0=await p.evaluate(async([tag,deg,mode])=>{const W=window.__r1264,S=deg*Math.PI/180,dx=(Math.cos(S)+2*Math.sin(S))/2,dy=(2*Math.sin(S)-Math.cos(S))/2,L=Math.hypot(dx,dy),P=player;room.engaged=true;
  const e=room.enemies.find(v=>v.hp>0&&!v.boss)||room.enemies[0];const H0=HEROES[P.hero]||{},mel=H0.melee||H0.type==='blade'||H0.type==='heavy',R0=mel?1.0:3.2;W.pin={e,dx:dx/L*R0,dy:dy/L*R0};P.hp=maxHP();P.invincible=999;P.specialCD=0;P.attackCD=0;P.ultimateCD=0;
  for(let i=0;i<60&&storyScene;i++)advanceScene();if(modal)closePanel(true);
  W.tag=tag;W.on=true;if(mode==='A'){W.iv=setInterval(()=>{try{basicAttack(false);}catch(_){}},50);}
  return time;},[tag,deg,mode]);
 if(mode!=='A'){await p.keyboard.press(mode);}
 await p.waitForFunction((t)=>time>=t,t0+sec,{timeout:240000});
 await p.evaluate(()=>{const W=window.__r1264;clearInterval(W.iv);W.on=false;W.tag=null;});
}
async function run(hero,phase){
 for(const [deg,lab] of [[0,'e'],[90,'s'],[180,'w'],[-90,'n'],[45,'se'],[-135,'nw']])await step(`${hero}|${phase}|A:${lab}`,deg,'A',1.0);
 for(const k of ['q','w','e','r']){await p.evaluate(()=>{try{for(const k of ['w','e','r'])window.__STORYWORLD_GUNNER_ARMS_R561__?.scaleRemain?.(k,1e-6);}catch(_){}try{const S=window.__STORYWORLD_SKILLS_R181__;S?.resetCooldowns?.();}catch(_){}});for(const [deg,lab] of [[0,'e'],[-90,'n'],[135,'sw']])await step(`${hero}|${phase}|${k}:${lab}`,deg,k,1.1);}
}
const SUM=[];
for(const hero of LIST){
 const sw=await p.evaluate(async(id0)=>{const form={ego:['hwando','egoSovereignR1046'],persona:['lauren','personaHeroR1113']}[id0],id=form?form[0]:id0;const t=Date.now();loading=true;try{await ensureImages(heroPaths(id));player.hero=id;player.egoSovereignR1046=id0==='ego';player.personaHeroR1113=id0==='persona';player.combo=0;player.ego=0;player.samong=0;player.shield=0;player.direction='front';}finally{loading=false;}try{closePanel(true);refreshIcons();}catch(_){}
  /* 지역 진입과 같은 그림 기억 비우기 */const before=imageCache.size;releaseImageMemory();return{ms:Date.now()-t,before,after:imageCache.size};},hero);
 console.log('switch',hero,JSON.stringify(sw));
 await run(hero,'cold');
 await run(hero,'warm');
 const rows=await p.evaluate(()=>{const W=window.__r1264,r=W.rows;W.rows=[];return r;});
 fs.writeFileSync(`${OUT}/rows-${hero}.json`,JSON.stringify(rows));
 // 요약
 const warm=new Map(),cold=[];for(const r of rows){const [h,ph,step]=r.tag.split('|');const key=step+'|'+r.act;if(ph==='warm'){if(!warm.has(key))warm.set(key,new Set());warm.get(key).add(r.src);}else cold.push({...r,key,step});}
 const warmAll=new Set(rows.filter(r=>r.tag.includes('|warm|')).map(r=>r.src));
 const leak=cold.filter(r=>r.act!=='idle'&&r.src&&!warmAll.has(r.src));
 const by={};for(const r of leak){const k=r.step+'|'+r.act+'|'+r.src;by[k]=(by[k]||0)+1;}
 console.log('HERO',hero,'frames',rows.length,'coldLeak',leak.length,JSON.stringify(by).slice(0,1500));
 const acts={};for(const r of rows.filter(r=>r.tag.includes('|warm|'))){const k=r.tag.split('|')[2]+'|'+r.act;(acts[k]=acts[k]||{})[r.src]=(acts[k][r.src]||0)+1;}
 fs.writeFileSync(`${OUT}/warm-${hero}.json`,JSON.stringify(acts,null,1));
 const old=rows.filter(r=>r.act!=='idle'&&r.src&&OLD.test(r.src)),oby={};for(const r of old){const k=r.tag.split('|').slice(1).join('|')+'|'+r.act+'|'+r.src;oby[k]=(oby[k]||0)+1;}
 SUM.push({hero,frames:rows.length,act:rows.filter(r=>r.act!=='idle').length,leak:leak.length,leakBy:by,old:old.length,oldBy:oby});
}
fs.writeFileSync(`${OUT}/summary.json`,JSON.stringify(SUM,null,1));
let fails=0;const check=(n,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+n+(info===undefined?'':' '+JSON.stringify(info).slice(0,1500)));};
check('(1) 공격·스킬·궁극기 프레임이 모두 그려짐(영웅마다 40프레임 이상)',SUM.every(s=>s.act>=40),SUM.map(s=>[s.hero,s.act]));
check('(2) 공격·스킬 중 옛 몸 그림(엔진 옛 그림·기억사수 R143/R128 옛 공격) 0프레임 — 차가운·따뜻한 상태 모두',SUM.every(s=>s.old===0),SUM.filter(s=>s.old).map(s=>({hero:s.hero,old:s.old,by:s.oldBy})));
check('(3) 그림 기억 비운 직후(지역 진입·영웅 변경) 공격·스킬 첫 프레임부터 지금 그림 — 따뜻한 상태에 없는 그림 0프레임',SUM.every(s=>s.leak===0),SUM.filter(s=>s.leak).map(s=>({hero:s.hero,leak:s.leak,by:s.leakBy})));
check('페이지 오류 없음',errors.length===0,errors.slice(0,5));
console.log(JSON.stringify({fails}));
await b.close();process.exit(fails?1:0);
