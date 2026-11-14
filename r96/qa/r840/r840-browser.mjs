// R840 브라우저(헤드리스 소프트웨어 렌더링 — 그래픽 검증 아님): 서사별 NPC 퀘스트. 사용: node r96/qa/r840/r840-browser.mjs <outdir> [manual|guide|kill|gates|cinema …]
//  manual: last302 손으로 — NPC 그려짐·창·받기·조형물·세 대·단서·쪽지 모음·장면 사진      guide: last302·last305 길잡이가 창 없이 마치고 R78 진행이 이어짐
//  kill: last304 길잡이 처치 퀘스트      gates: last303 길잡이 — 퀘스트를 마친 뒤 R790 귀비탕 관문까지 그대로      cinema: 영화 기록에서 last302 — 모달 없이 마침
import {chromium,boot,go,skip,URL} from '../r444/lib.mjs';import fs from 'node:fs';import assert from 'node:assert';
const OUT=process.argv[2]||'.',WHICH=process.argv.slice(3);fs.mkdirSync(OUT,{recursive:true});let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log('  ok '+m);};const want=k=>!WHICH.length||WHICH.includes(k);
const b=await chromium.launch();const errs=[];const Q=p=>p.evaluate(()=>window.__STORYWORLD_QUEST_R840__.inspect());const ph=p=>p.evaluate(()=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase);
/* 게임 시간으로 기다린다. 지역 서사 읽기 창(storyScene)은 게임 시간을 멈추므로, 기다리는 동안 뜨면 넘긴다(2026-11 main: 불면귀 마을은 들어선 뒤 1초쯤 34장 창이 뜬다). 퀘스트 창(modal)은 건드리지 않는다. */
const waitT=async(p,dt)=>{const t0=await p.evaluate(()=>time);for(let i=0;i<1500;i++){if(await p.evaluate(([t,d])=>{if(typeof storyScene!=='undefined'&&storyScene)for(let k=0;k<160&&storyScene;k++)advanceScene();return time>t+d;},[t0,dt]))return;await p.waitForTimeout(200);}throw new Error('waitT timeout');};
const hook=p=>p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const strong=p=>p.evaluate(()=>{player.hp=player.maxHp=1e9;});
// 길잡이로 퀘스트가 끝날 때까지. 모달·서사 창이 뜨면 기록한다(길잡이 중 퀘스트 창은 0 이어야 한다).
async function runGuide(p,label,{maxMs=900000}={}){await p.evaluate(()=>{window.__r840Panels=0;const o=openPanel;openPanel=function(h){if(/questR840|questTakeR840/.test(String(h)))window.__r840Panels++;return o.apply(this,arguments);};guide=true;});
 const t0=Date.now();let last='';while(Date.now()-t0<maxMs){const q=await Q(p);const s=q.state+'/'+q.kills+'/'+q.hits;if(s!==last){last=s;console.log('   ['+label+'] '+((Date.now()-t0)/1000|0)+'s '+s+' phase='+q.phase+' fb='+q.stats.fallback);}
  if(q.state==='done')break;await p.evaluate(()=>{player.hp=player.maxHp=1e9;if(!guide)guide=true;for(let i=0;i<40&&storyScene;i++)advanceScene();});await p.waitForTimeout(1500);}
 const q=await Q(p);return {q,secs:(Date.now()-t0)/1000|0,panels:await p.evaluate(()=>window.__r840Panels)};}
if(want('manual')){console.log('manual last302');const {ctx,p}=await boot(b);hook(p);await go(p,'last302');await strong(p);await waitT(p,.4);
 const i0=await Q(p);ok(i0.visible&&i0.state==='new'&&i0.npc&&/fisher/.test(i0.npc.id),'들머리에 어부 '+JSON.stringify(i0.npc));ok(i0.pathed===true,'자리는 들머리→집결실 실제 길에서 계산');
 const geo=await p.evaluate(()=>{const q=room.props.find(q=>q.r840NPC),e=room.exploration.entry;return {de:Math.hypot(q.x-e.x,q.y-e.y),bl:blocked(q.x,q.y,.3,room),path:findPath(player,q,room,.31).length};});
 ok(geo.de>=3&&geo.de<=8&&!geo.bl&&geo.path>0,'들머리 곁 빈 자리·걸어갈 수 있음 '+JSON.stringify(geo));
 await p.evaluate(()=>{const q=room.props.find(q=>q.r840NPC);player.x=q.x+1.6;player.y=q.y+1.2;});await waitT(p,2.5);ok((await Q(p)).stats.draws>0,'어부가 실제로 그려진다');await p.screenshot({path:`${OUT}/npc-wide.png`});
 await p.evaluate(()=>interact());ok(await p.evaluate(()=>modal===true),'E: 창');const txt=await p.locator('#panel').innerText();ok(txt.includes('잠들지 못한 어부')&&txt.includes('말뚝을 찾아 부순다')&&txt.includes('나중에'),'창 글');await p.waitForTimeout(800);await p.screenshot({path:`${OUT}/panel.png`});
 await p.locator('#questWaitR840').click();ok((await Q(p)).state==='new',"'나중에'");await p.evaluate(()=>interact());await p.locator('#questTakeR840').click();const i1=await Q(p);ok(i1.state==='on'&&i1.prop,'받음 → 조형물 '+JSON.stringify(i1.prop));
 const g2=await p.evaluate(()=>{const q=room.props.find(q=>q.r840Prop),n=room.props.find(q=>q.r840NPC);return {dn:Math.hypot(q.x-n.x,q.y-n.y),bl:blocked(q.x,q.y,.3,room),path:findPath(n,q,room,.31).length,doors:Math.min(...room.exploration.worldR74.doors.map(d=>Math.hypot(d.x-q.x,d.y-q.y)))};});
 ok(g2.dn>=8&&g2.dn<=45&&!g2.bl&&g2.path>0&&g2.doors>3,'조형물: 길 곁 빈 자리·걸어갈 수 있음 '+JSON.stringify(g2));ok(/말뚝/.test(await p.locator('#questText').textContent()),'목표 글');
 await p.evaluate(()=>{const q=room.props.find(q=>q.r840Prop);for(const e of room.enemies)if(Math.hypot(e.x-q.x,e.y-q.y)<9){e.x=-900;e.y=-900;}player.x=q.x+1.3;player.y=q.y+.9;});await waitT(p,2.5);await p.screenshot({path:`${OUT}/prop-wide.png`});
 const cmds=await p.evaluate(()=>{const q=room.props.find(q=>q.r840Prop);return {img:!!readyImage(q.r840Art)?.image,noPath:q.path===undefined,lit:!!window.__STORYWORLD_DARK_R123__?.isLight?.(q)};});ok(cmds.noPath&&!cmds.lit,"조형물은 등불로 잡히지 않는다");ok(cmds.img,'조형물 그림이 읽혔다');
 for(let i=0;i<3;i++){await p.evaluate(()=>interact());await waitT(p,.3);}const i2=await Q(p);ok(i2.state==='drop'&&i2.orb&&!i2.prop,'세 대 → 부서지고 단서 '+JSON.stringify(i2.orb));await waitT(p,.3);await p.screenshot({path:`${OUT}/clue-wide.png`});
 await p.evaluate(()=>{const o=room.props.find(q=>q.r840Clue);player.x=o.x;player.y=o.y;});await waitT(p,1);const i3=await Q(p);ok(i3.state==='done','단서 주움');
 const book=await p.evaluate(()=>window.__STORYWORLD_PLAY_R169__.book().find(n=>n.key==='quest:r840:last302'));ok(book&&/실 끊긴 붉은 부적/.test(book.title),'쪽지 모음에 단서 '+JSON.stringify(book));
 ok((await p.evaluate(()=>serializeSave().questR840))?.rooms?.['STORY:last302']?.s==='done','세이브 기록');ok(await ph(p)==='route','R78 단계는 그대로 route(진행을 건드리지 않음)');ok(!i3.lastError,'모듈 오류 없음 '+i3.lastError);await ctx.close();}
for(const [key,z] of [['guide','last302'],['guide','last305'],['kill','last304'],['gates','last303'],['ep1a','ep1a08'],['ep1a','ep1a09'],['ep1a','ep1a10']]){if(!want(key))continue;console.log(key+' '+z);const {ctx,p}=await boot(b,{vp:{width:640,height:360}});hook(p);await go(p,z);await strong(p);await waitT(p,.3);
 if(key==='ep1a'){const am=await p.evaluate(()=>room.props.filter(q=>q.r840Amb||q.r840NPC).map(q=>({id:q.id,bl:blocked(q.x,q.y,.3,room)})));ok(am.length>=(z==='ep1a10'?1:2)&&am.every(a=>!a.bl),z+' 인물 자리 '+JSON.stringify(am));await p.evaluate(()=>{const n=room.props.find(q=>q.r840NPC),e=room.exploration.entry,pp=findPath(e,n,room,.31)||[];const at=pp.length>1?pp[pp.length-2]:e;/* 벽 속에 세우지 않게 길 위의 점에 */player.x=at.x;player.y=at.y;});await waitT(p,1.2);await p.screenshot({path:`${OUT}/${z}-npc.png`});}
 const r=await runGuide(p,z);ok(r.q.state==='done','길잡이가 퀘스트를 마친다 '+z+' '+r.secs+'s '+JSON.stringify(r.q.stats));ok(r.panels===0,'길잡이 중 퀘스트 창 0');ok((r.q.stats.fallback||0)===0,'대신 처리 없이 걸어서 마침');ok(!r.q.lastError,'모듈 오류 없음 '+r.q.lastError);
 if(key==='kill')ok(r.q.kills>=r.q.need&&r.q.need>=1,'처치 수 '+r.q.kills+'/'+r.q.need);
 if(z==='ep1a08'){/* 새빛병원 지하는 R78 단계가 없는 맵 — 곁일만 확인한다 */ok(r.q.kills>=r.q.need,'처치 수 '+r.q.kills+'/'+r.q.need);await ctx.close();continue;}
 // 그 뒤에도 원래 길잡이가 이어진다: 집결(rally) 이후 단계로 넘어가는지. gates 는 R790 관문(door)을 지나 보스 단계까지.
 const goal=key==='gates'?['boss','exit','exitStory','done']:['rally','door','doorStory','boss','exit','exitStory','done'];const t0=Date.now();let cur=await ph(p);
 while(Date.now()-t0<900000&&!goal.includes(cur)){await p.evaluate(()=>{player.hp=player.maxHp=1e9;if(!guide)guide=true;for(let i=0;i<40&&storyScene;i++)advanceScene();});await p.waitForTimeout(2000);const c=await ph(p);if(c!==cur){cur=c;console.log('   ['+z+'] phase '+c+' '+((Date.now()-t0)/1000|0)+'s');}}
 ok(goal.includes(cur),'퀘스트 뒤 서사 진행이 이어진다 '+z+' → '+cur);if(key==='gates')ok(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.taken()),'R790 귀비탕 관문도 그대로 지나감');await ctx.close();}
// samong: 사몽 S-05 경성의 밤 — 길잡이가 S05-1(지현의 잔영)·S05-3(상관의 잔영) 곁일을 창 없이 마치고 사몽 구역 진행이 이어진다. 장면 사진도 남긴다.
if(want('samong')){console.log('samong S-05');const {ctx,p}=await boot(b,{vp:{width:1280,height:720}});hook(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
 ok(await p.evaluate(()=>window.__STORYWORLD_CHEAT777__.goSamong(5,'survival',{force:true}))!==false,'사몽 S-05 로 들어감');await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000});await skip(p);await strong(p);await waitT(p,.5);
 const zoneNow=()=>p.evaluate(()=>room.samongR103?.zone);ok(await zoneNow()==='sz115-S05-1','S05-1 '+await zoneNow());
 const i0=await Q(p);ok(i0.visible&&i0.npc,'지현의 잔영이 선다 '+JSON.stringify(i0.npc));
 const near=await p.evaluate(()=>{const n=room.props.find(q=>q.r840NPC);return {blocked:blocked(n.x,n.y,.3,room),clue:Math.min(...room.props.filter(q=>q.r115Clue).map(q=>Math.hypot(q.x-n.x,q.y-n.y))),entry:Math.hypot(n.x-room.exploration.entry.x,n.y-room.exploration.entry.y)};});
 ok(!near.blocked&&near.clue>=1.3,'NPC 자리: 빈 칸, 원문 단서와 겹치지 않음 '+JSON.stringify(near));
 await p.evaluate(()=>{const n=room.props.find(q=>q.r840NPC);player.x=n.x+1.6;player.y=n.y+1.8;});await waitT(p,1.5);await p.screenshot({path:`${OUT}/samong-S05-1-npc.png`});
 let r=await runGuide(p,'S05-1');ok(r.q.state==='done','길잡이가 S05-1 곁일을 마친다 '+r.secs+'s '+JSON.stringify(r.q.stats));ok(r.panels===0,'퀘스트 창 0');ok((r.q.stats.fallback||0)===0,'대신 마침 없이');
 ok((await p.evaluate(()=>serializeSave().questR840))?.rooms?.['DREAM:sz115-S05-1']?.s==='done','세이브 DREAM:sz115-S05-1');
 const book=await p.evaluate(()=>window.__STORYWORLD_PLAY_R169__.book().find(n=>n.key==='quest:r840:sz115-S05-1'));ok(book&&/멎은 손길/.test(book.title),'쪽지 모음에 단서');
 // 사몽 진행이 이어진다: 다음 구역(S05-2, 45 처치 전투)으로 넘어가는지. 전투 구역을 다 치르는 것은 헤드리스에서 25분을 넘겨(소프트웨어 렌더링) S05-3 은 구역 이동으로 바로 들어간다.
 const t0=Date.now();let cur=await zoneNow();while(Date.now()-t0<600000&&cur==='sz115-S05-1'){await p.evaluate(()=>{player.hp=player.maxHp=1e9;if(!guide)guide=true;for(let i=0;i<40&&storyScene;i++)advanceScene();});await p.waitForTimeout(3000);cur=await zoneNow();}
 ok(cur==='sz115-S05-2','곁일 뒤 사몽 진행이 이어져 다음 구역으로 → '+cur+' '+((Date.now()-t0)/1000|0)+'s');ok(!(await Q(p)).visible,'정의 없는 구역(S05-2)에는 세우지 않는다');
 await p.evaluate(()=>{guide=false;});ok(await p.evaluate(()=>window.__STORYWORLD_SAMONG_R103__.go(5,'explore',{zone:'sz115-S05-3'}))!==false,'S05-3 으로 이동');await p.waitForFunction(()=>!loading&&room.samongR103?.zone==='sz115-S05-3',null,{timeout:150000});await skip(p);await strong(p);await waitT(p,.5);
 const i3=await Q(p);ok(i3.visible&&i3.npc&&/superior/.test(i3.npc.id),'상관의 잔영이 선다 '+JSON.stringify(i3.npc));await p.evaluate(()=>{const n=room.props.find(q=>q.r840NPC);player.x=n.x+1.6;player.y=n.y+1.8;});await waitT(p,1.5);await p.screenshot({path:`${OUT}/samong-S05-3-npc.png`});
 r=await runGuide(p,'S05-3');ok(r.q.state==='done','길잡이가 S05-3 곁일을 마친다 '+r.secs+'s');ok((r.q.stats.fallback||0)===0&&r.q.stats.broken>=2,'S05-3 도 대신 마침 없이 조형물을 부숴서 '+JSON.stringify(r.q.stats));ok(r.panels===0,'퀘스트 창 0');ok(!r.q.lastError,'모듈 오류 없음 '+r.q.lastError);await ctx.close();}
// dys(R842): 사몽 S-06 디스토피아 다섯 구역 — 길잡이가 이야기 듣기·처치·조형물 곁일을 창 없이 마친다. 구역은 이동으로 바로 들어간다. R840_DYS_ZONES=2,3 처럼 고를 수 있다.
if(want('dys')){console.log('dys S-06');const {ctx,p}=await boot(b,{vp:{width:640,height:360}});hook(p);
 ok(await p.evaluate(()=>window.__STORYWORLD_CHEAT777__.goSamong(6,'survival',{force:true}))!==false,'사몽 S-06 으로 들어감');await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000});await skip(p);await strong(p);
 for(const k of (process.env.R840_DYS_ZONES||'2,3,15,18,22').split(',')){const z='sz115-S06-'+k;await p.evaluate(()=>{guide=false;});
  await p.evaluate(z=>window.__STORYWORLD_SAMONG_R103__.go(6,'explore',{zone:z}),z);await p.waitForFunction(z=>!loading&&room.samongR103?.zone===z,z,{timeout:150000});await skip(p);await strong(p);await waitT(p,.5);
  const i=await Q(p);ok(i.visible&&i.npc,z+' 인물이 선다 '+JSON.stringify(i.npc));const am=await p.evaluate(()=>room.props.filter(q=>q.r840Amb||q.r840NPC).map(q=>({id:q.id,bl:blocked(q.x,q.y,.3,room)})));ok(am.every(a=>!a.bl),z+' 인물 자리가 빈 칸 '+JSON.stringify(am));
  await p.screenshot({path:`${OUT}/dys-${k}-npc.png`});
  const r=await runGuide(p,'S06-'+k);ok(r.q.state==='done','길잡이가 '+z+' 곁일을 마친다 '+r.secs+'s '+JSON.stringify(r.q.stats));ok(r.panels===0,z+' 퀘스트 창 0');console.log('   fallback(누적) '+(r.q.stats.fallback||0));
  ok((await p.evaluate(()=>serializeSave().questR840))?.rooms?.['DREAM:'+z]?.s==='done','세이브 DREAM:'+z);}
 ok(((await Q(p)).stats.fallback||0)===0,'대신 마침 0(다섯 구역 누적)');ok(!(await Q(p)).lastError,'모듈 오류 없음');await ctx.close();}
const CZ=process.env.R840_CINEMA_ZONE||'last302';/* 영화 모드로 확인할 지역(기본 last302, R841: ep1a09 등) */
if(want('cinema')){console.log('cinema '+CZ);const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();hook(p);await p.goto(URL);await p.locator('#cinemaStartR461').click({timeout:180000});const slot=p.locator('#slotConfirmR73');if(await slot.count())await slot.click().catch(()=>{});
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});const mode=await p.evaluate(()=>({rec:serializeSave().playModeR461,on:window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.().on,guide}));ok(mode.rec==='cinema','영화 기록 '+JSON.stringify(mode));
 await skip(p);await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);/* 새 여정은 dist00 만 열려 있다 → 777 로 연다 */
 for(let i=0;i<60&&await p.evaluate(CZ=>room?.id!==CZ,CZ);i++){await p.evaluate(CZ=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(!loading&&room?.id!==CZ)enterRegion(CZ,null,{layer:'STORY',restore:true});},CZ);await p.waitForTimeout(5000);}
 await p.waitForFunction(CZ=>!loading&&room?.id===CZ,CZ,{timeout:120000});await strong(p);console.log('   [cinema] in '+CZ+' '+JSON.stringify(await p.evaluate(()=>({guide,cin:window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.().on,rec:serializeSave().playModeR461}))));
 await p.evaluate(()=>{window.__r840Panels=0;window.__r840Modal=0;const o=openPanel;openPanel=function(h){if(/questTakeR840/.test(String(h)))window.__r840Panels++;return o.apply(this,arguments);};});
 const t0=Date.now();let last='';while(Date.now()-t0<900000){const q=await Q(p);const s=q.state+'/'+q.hits;if(s!==last){last=s;console.log('   [cinema] '+((Date.now()-t0)/1000|0)+'s '+s+' phase='+q.phase+' guide='+await p.evaluate(()=>guide));}if(q.state==='done')break;await strong(p);await p.waitForTimeout(1500);}
 const q=await Q(p);ok(q.state==='done','영화 모드: 퀘스트를 스스로 마친다 '+JSON.stringify(q.stats));ok(await p.evaluate(()=>window.__r840Panels)===0,'영화 모드: 퀘스트 창 0');ok(await p.evaluate(()=>guide===true),'영화 모드 길잡이는 그대로 켜져 있다');ok(!q.lastError,'모듈 오류 없음 '+q.lastError);
 const t1=Date.now();let cur=await ph(p);while(Date.now()-t1<600000&&cur==='route'){await strong(p);await p.waitForTimeout(2000);cur=await ph(p);}ok(cur!=='route','영화 모드: 퀘스트 뒤 진행이 이어진다 → '+cur);await p.screenshot({path:`${OUT}/cinema-after.png`});await ctx.close();}
ok(errs.length===0,'페이지 오류 없음 '+errs.join(' | '));console.log('R840 브라우저(헤드리스) 검사 통과: '+n+'개 ['+(WHICH.join(',')||'전체')+']');await b.close();
