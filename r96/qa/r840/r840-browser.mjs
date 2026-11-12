// R840 브라우저(헤드리스 소프트웨어 렌더링 — 그래픽 검증 아님): 서사별 NPC 퀘스트. 사용: node r96/qa/r840/r840-browser.mjs <outdir> [manual|guide|kill|gates|cinema …]
//  manual: last302 손으로 — NPC 그려짐·창·받기·조형물·세 대·단서·쪽지 모음·장면 사진      guide: last302·last305 길잡이가 창 없이 마치고 R78 진행이 이어짐
//  kill: last304 길잡이 처치 퀘스트      gates: last303 길잡이 — 퀘스트를 마친 뒤 R790 귀비탕 관문까지 그대로      cinema: 영화 기록에서 last302 — 모달 없이 마침
import {chromium,boot,go,skip,URL} from '../r444/lib.mjs';import fs from 'node:fs';import assert from 'node:assert';
const OUT=process.argv[2]||'.',WHICH=process.argv.slice(3);fs.mkdirSync(OUT,{recursive:true});let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log('  ok '+m);};const want=k=>!WHICH.length||WHICH.includes(k);
const b=await chromium.launch();const errs=[];const Q=p=>p.evaluate(()=>window.__STORYWORLD_QUEST_R840__.inspect());const ph=p=>p.evaluate(()=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase);
const waitT=(p,dt)=>p.evaluate(()=>time).then(t0=>p.waitForFunction(([t,d])=>time>t+d,[t0,dt],{timeout:300000}));
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
 const cmds=await p.evaluate(()=>{const q=room.props.find(q=>q.r840Prop);return {img:!!readyImage(q.path)?.image};});ok(cmds.img,'조형물 그림이 읽혔다');
 for(let i=0;i<3;i++){await p.evaluate(()=>interact());await waitT(p,.3);}const i2=await Q(p);ok(i2.state==='drop'&&i2.orb&&!i2.prop,'세 대 → 부서지고 단서 '+JSON.stringify(i2.orb));await waitT(p,.3);await p.screenshot({path:`${OUT}/clue-wide.png`});
 await p.evaluate(()=>{const o=room.props.find(q=>q.r840Clue);player.x=o.x;player.y=o.y;});await waitT(p,1);const i3=await Q(p);ok(i3.state==='done','단서 주움');
 const book=await p.evaluate(()=>window.__STORYWORLD_PLAY_R169__.book().find(n=>n.key==='quest:r840:last302'));ok(book&&/실 끊긴 붉은 부적/.test(book.title),'쪽지 모음에 단서 '+JSON.stringify(book));
 ok((await p.evaluate(()=>serializeSave().questR840))?.rooms?.['STORY:last302']?.s==='done','세이브 기록');ok(await ph(p)==='route','R78 단계는 그대로 route(진행을 건드리지 않음)');ok(!i3.lastError,'모듈 오류 없음 '+i3.lastError);await ctx.close();}
for(const [key,z] of [['guide','last302'],['guide','last305'],['kill','last304'],['gates','last303']]){if(!want(key))continue;console.log(key+' '+z);const {ctx,p}=await boot(b,{vp:{width:640,height:360}});hook(p);await go(p,z);await strong(p);await waitT(p,.3);
 const r=await runGuide(p,z);ok(r.q.state==='done','길잡이가 퀘스트를 마친다 '+z+' '+r.secs+'s '+JSON.stringify(r.q.stats));ok(r.panels===0,'길잡이 중 퀘스트 창 0');ok((r.q.stats.fallback||0)===0,'대신 처리 없이 걸어서 마침');ok(!r.q.lastError,'모듈 오류 없음 '+r.q.lastError);
 if(key==='kill')ok(r.q.kills>=r.q.need&&r.q.need>=1,'처치 수 '+r.q.kills+'/'+r.q.need);
 // 그 뒤에도 원래 길잡이가 이어진다: 집결(rally) 이후 단계로 넘어가는지. gates 는 R790 관문(door)을 지나 보스 단계까지.
 const goal=key==='gates'?['boss','exit','exitStory','done']:['rally','door','doorStory','boss','exit','exitStory','done'];const t0=Date.now();let cur=await ph(p);
 while(Date.now()-t0<900000&&!goal.includes(cur)){await p.evaluate(()=>{player.hp=player.maxHp=1e9;if(!guide)guide=true;for(let i=0;i<40&&storyScene;i++)advanceScene();});await p.waitForTimeout(2000);const c=await ph(p);if(c!==cur){cur=c;console.log('   ['+z+'] phase '+c+' '+((Date.now()-t0)/1000|0)+'s');}}
 ok(goal.includes(cur),'퀘스트 뒤 서사 진행이 이어진다 '+z+' → '+cur);if(key==='gates')ok(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.taken()),'R790 귀비탕 관문도 그대로 지나감');await ctx.close();}
if(want('cinema')){console.log('cinema last302');const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();hook(p);await p.goto(URL);await p.locator('#cinemaStartR461').click({timeout:180000});const slot=p.locator('#slotConfirmR73');if(await slot.count())await slot.click().catch(()=>{});
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});const mode=await p.evaluate(()=>({rec:serializeSave().playModeR461,on:window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.().on,guide}));ok(mode.rec==='cinema','영화 기록 '+JSON.stringify(mode));
 await skip(p);await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);/* 새 여정은 dist00 만 열려 있다 → 777 로 연다 */
 for(let i=0;i<60&&await p.evaluate(()=>room?.id!=='last302');i++){await p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(!loading&&room?.id!=='last302')enterRegion('last302',null,{layer:'STORY',restore:true});});await p.waitForTimeout(5000);}
 await p.waitForFunction(()=>!loading&&room?.id==='last302',null,{timeout:120000});await strong(p);console.log('   [cinema] in last302 '+JSON.stringify(await p.evaluate(()=>({guide,cin:window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.().on,rec:serializeSave().playModeR461}))));
 await p.evaluate(()=>{window.__r840Panels=0;window.__r840Modal=0;const o=openPanel;openPanel=function(h){if(/questTakeR840/.test(String(h)))window.__r840Panels++;return o.apply(this,arguments);};});
 const t0=Date.now();let last='';while(Date.now()-t0<900000){const q=await Q(p);const s=q.state+'/'+q.hits;if(s!==last){last=s;console.log('   [cinema] '+((Date.now()-t0)/1000|0)+'s '+s+' phase='+q.phase+' guide='+await p.evaluate(()=>guide));}if(q.state==='done')break;await strong(p);await p.waitForTimeout(1500);}
 const q=await Q(p);ok(q.state==='done','영화 모드: 퀘스트를 스스로 마친다 '+JSON.stringify(q.stats));ok(await p.evaluate(()=>window.__r840Panels)===0,'영화 모드: 퀘스트 창 0');ok(await p.evaluate(()=>guide===true),'영화 모드 길잡이는 그대로 켜져 있다');ok(!q.lastError,'모듈 오류 없음 '+q.lastError);
 const t1=Date.now();let cur=await ph(p);while(Date.now()-t1<600000&&cur==='route'){await strong(p);await p.waitForTimeout(2000);cur=await ph(p);}ok(cur!=='route','영화 모드: 퀘스트 뒤 진행이 이어진다 → '+cur);await p.screenshot({path:`${OUT}/cinema-after.png`});await ctx.close();}
ok(errs.length===0,'페이지 오류 없음 '+errs.join(' | '));console.log('R840 브라우저(헤드리스) 검사 통과: '+n+'개 ['+(WHICH.join(',')||'전체')+']');await b.close();
