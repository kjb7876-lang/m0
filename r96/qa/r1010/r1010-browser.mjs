// R1010 무한생존 미카엘라 결전·엔딩 — 브라우저 검사(헤드리스 소프트웨어 렌더링. 그래픽·실기기·자연 플레이 검증 아님).
//  실제 입력(C 키·터치 상호작용 단추·계속 단추·Esc)으로 M 단계 대면 → 매듭 4개 → 엔딩 서사 → 진료기록 → 에필로그 → 결과 창.
//  skip 갈래: 서사 창마다 Esc(서사 창은 안 닫힘) 뒤 Enter 로 빠르게 넘기고, 진료기록·결과 창은 Esc 로 닫아도 다시 뜨는지 본다.
//  SW_URL(기본 http://127.0.0.1:4410/m0/), SHOTS=폴더(스크린샷), ONLY=pc|skip|death|mobile|real 로 한 갈래만.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SHOTS=process.env.SHOTS||'',ONLY=process.env.ONLY||'';
let fail=0,n=0;const ok=(m,c,x)=>{n++;console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)fail++;};
const b=await chromium.launch();
async function boot(opt={}){const ctx=await b.newContext({viewport:opt.vp||{width:960,height:540},deviceScaleFactor:opt.dsf||1,hasTouch:!!opt.touch,isMobile:!!opt.touch});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));window.__r1010Speak=0;try{const sp=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{window.__r1010Speak++;return sp(u);};}catch(_){}});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').waitFor({timeout:240000});return {ctx,p,errs};}
const A=(p,f,a)=>p.evaluate(f,a);
// 레벨업 강화 창이 끼면 첫 카드를 눌러 넘긴다(생존 규칙 그대로).
const pick=p=>A(p,()=>{const b=document.getElementById('r600Pick0');if(b&&modal){b.click();return 1;}return 0;});
const until=async(p,fn,arg,limit=180000)=>{const end=Date.now()+limit;for(;;){await pick(p).catch(()=>0);const v=await p.evaluate(fn,arg).catch(()=>false);if(v)return v;if(Date.now()>end){const why=await p.evaluate(()=>{const s=window.__STORYWORLD_SURVIVAL_R600__?.state?.()||{};return{i:s.i,id:s.id,phase:s.phase,narr:s.narrating,over:s.over,t:time,alive:room.enemies.filter(e=>e.hp>0&&!e.deadRecorded).length,modal,loading,story:!!storyScene,panel:(document.getElementById('panel')?.textContent||'').slice(0,80),f:window.__STORYWORLD_SURVIVAL_FINALE_R1010__?.state?.(),room:room.id};}).catch(e=>String(e));throw new Error('timeout '+String(fn).slice(0,120)+' '+JSON.stringify(why));}await p.waitForTimeout(200);}};
async function toKair05(p){await A(p,async()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;await Z.start('hwando','normal');await Z.qaGo(Z.stageIds().indexOf('kair05'));});
 await until(p,()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&room.id==='kair05'&&!loading);}
const F=p=>A(p,()=>window.__STORYWORLD_SURVIVAL_FINALE_R1010__?.state?.()||null);
const storyText=p=>A(p,()=>modal&&document.querySelector('#panel .storyText')?.textContent||null);
// 서사 창을 계속 단추(또는 Esc)로 넘기며 글을 모은다 — stop(p) 가 참이 될 때까지.
async function drain(p,stop,how='click',limit=600){const got=[];for(let k=0;k<limit;k++){await pick(p);if(await A(p,stop))return got;const t=await storyText(p);
  if(t&&await A(p,()=>!!storyScene)){got.push(t);if(how==='esc'){await p.keyboard.press('Escape');await p.keyboard.press('Enter');}else if(how==='tap')await p.locator('#storyNext').tap();else await p.locator('#storyNext').click();await p.waitForTimeout(60);}else await p.waitForTimeout(150);}
 throw new Error('drain limit');}
const keepAlive=p=>A(p,()=>{player.hp=maxHP();player.invincible=Math.max(player.invincible||0,1);});
async function cutKnot(p,i,how='key'){await until(p,()=>!modal);await keepAlive(p);const pin=i=>{/* 반자동·자동 스킬이 미카엘라로 순간이동했다 돌아오는 동작(환도 일섬·R706)이 순간이동한 자리를 되돌리므로, 매듭으로 걸어간 상황처럼 잠시 끈다 */try{auto=false;settings.autoSkill=false;}catch(_){}const k=room.props.find(q=>q.r1010Knot===i);player.x=k.x+.4;player.y=k.y+.3;player.hp=maxHP();};await A(p,pin,i);await p.waitForTimeout(80);
 if(how==='tap'){let vis=false;for(let w=0;w<60&&!vis;w++){await pick(p);await A(p,pin,i);await p.waitForTimeout(150);vis=await p.locator('#touchUse').isVisible();}
  ok('mobile: 매듭 '+(i+1)+' 곁에 서면 상호작용 단추가 보임',vis,await A(p,()=>({use:document.body.classList.contains('mobile-use-r63'),modal,f:window.__STORYWORLD_SURVIVAL_FINALE_R1010__.state()})));}
 if(how==='tap')await p.locator('#touchUse').tap();else await p.keyboard.press('c');await p.waitForTimeout(250);}

async function full(label,opt){const {ctx,p,errs}=await boot(opt);const how=opt.touch?'tap':opt.esc?'esc':'click';
 ok(label+': R1010 이 실려 있음',await A(p,()=>!!window.__STORYWORLD_SURVIVAL_FINALE_R1010__));
 ok(label+': 스토리(생존 밖)에서는 begin 거절',await A(p,()=>window.__STORYWORLD_SURVIVAL_FINALE_R1010__.begin({key:'M'})===false));
 const want=await A(p,()=>{const P=window.__STORYWORLD_SURVIVAL_FINALE_R1010__.pure;return{cf:P.confrontScenes().map(s=>s.text),en:P.endingScenes().map(s=>s.text),ks:P.knotRecords().length};});
 if(opt.real){/* 실제 연결: R1006 사몽 M 단계(sm1006:M)로 가서 서사·몹 물결을 넘기면 R1006 이 스스로 begin 을 부른다 */
  await A(p,async()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;await Z.start('hwando','normal');await Z.qaGo(Z.stageIds().indexOf('sm1006:M'));});
  await until(p,()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&window.__STORYWORLD_SURVIVAL_R600__.state().id==='sm1006:M'&&room.id==='kair05'&&!loading);
  await until(p,()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;player.hp=maxHP();if(window.__STORYWORLD_SURVIVAL_FINALE_R1010__.state().active)return true;/* 대면 자막이 시작된 뒤에는 건너뛰지 않는다(앞 단계 서사만 넘김) */{const c=Z.state().core;if(c&&c.stats&&c.hp<c.stats.max*.9)Z.qaCoreHp(c.stats.max);}/* 1단계 영웅을 72단계로 바로 보내므로 코어를 지킨다(안 지키면 코어 파괴 = 정상 게임 오버) */Z.skipNarration();for(const e of room.enemies)if(e.hp>0&&!e.deadRecorded&&time>(e.graceUntil||0))try{hitEnemy(e,1e7);}catch(_){}/* 실제 피해 길(killEnemy 직접 호출은 일부 적에게 무시됨) */return false;},null,600000);
  const h=await A(p,()=>({st:window.__STORYWORLD_SURVIVAL_R600__.state(),f:window.__STORYWORLD_SURVIVAL_FINALE_R1010__.state()}));
  ok(label+': R1006 M 단계 물결 뒤 R1006 이 begin 을 부름(R600 handoff, 다음 지역으로 안 넘어감)',h.f.active&&h.f.stageId==='sm1006:M'&&h.st.phase==='handoff'&&h.st.id==='sm1006:M'&&!h.st.over,h);
  ok(label+': M 단계 끝 begin → 대면 시작',true);}
 else{await toKair05(p);/* R1006 처럼 M 단계 서사·물결이 끝난 뒤 부르는 상황: 생존 서사를 넘기고 꼬리(6.5초)가 지나 생성이 멈출 때까지 */
 await A(p,()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());{const t=await A(p,()=>time);await until(p,t=>{player.hp=maxHP();return time>=t+7.5;},t,300000);}
 const began=await A(p,()=>window.__STORYWORLD_SURVIVAL_FINALE_R1010__.begin({stageId:'sm1006:M',key:'M'}));ok(label+': M 단계 끝 begin → 대면 시작',began===true);}
 const m0=await A(p,()=>{const m=room.enemies.find(e=>e.r1010Michaela);return m&&{name:m.name,hp:m.hp,max:m.maxHp,living:m.hp>0&&!m.deadRecorded}});ok(label+': 미카엘라가 무대에 나옴',m0&&m0.name==='미카엘라'&&m0.living,m0);
 ok(label+': 대면 직후 R600 은 다음 지역으로 넘어가지 않음',await A(p,r=>{const s=window.__STORYWORLD_SURVIVAL_R600__.state();return s.id===(r?'sm1006:M':'kair05')&&room.id==='kair05'&&!s.over;},!!opt.real));
 const sub=await A(p,()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return{list:Z.narr().list,want:window.__STORYWORLD_SURVIVAL_FINALE_R1010__.pure.confrontScenes().flatMap(s=>Z.pure.sentences(s.text))};});
 ok(label+': 대면 서사 = 원문(M1 0~3) 문장 그대로 생존 자막으로',sub.list.length>0&&sub.list.join(' ')===sub.want.join(' ')&&sub.want.join(' ').replace(/\s+/g,'')===want.cf.join('').replace(/\s+/g,''),{n:sub.list.length,w:sub.want.length});
 ok(label+': 대면과 함께 바로 결전(서사 동안 전투 계속)',(await F(p)).phase==='fight'&&!(await A(p,()=>modal)));
 if(opt.esc){await A(p,()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());ok(label+': 자막 건너뛰기(생존 서사 건너뛰기)해도 결전 그대로',(await F(p)).phase==='fight'&&(await A(p,()=>!window.__STORYWORLD_SURVIVAL_R600__.narr().playing)));}
 // 몹 물결
 const k0=await A(p,()=>window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.spawned||0);
 await keepAlive(p);const t0=await A(p,()=>time);await until(p,t=>{player.hp=maxHP();return time>=t+4;},t0,240000);
 ok(label+': 결전 중 몹 물결이 계속 나옴(생존 생성 규칙 그대로)',await A(p,k=>(window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.spawned||0)>k&&room.enemies.some(e=>e.survivalR600&&!e.r1010Michaela&&e.hp>0),k0));
 if(SHOTS){await A(p,()=>{try{auto=false;settings.autoSkill=false;}catch(_){}const k=room.props.find(q=>q.r1010Knot===0);player.x=k.x+.6;player.y=k.y+.8;});await p.waitForTimeout(600);await p.screenshot({path:SHOTS+'/r1010-fight-'+label+'.jpg',quality:85});}
 if(!opt.touch&&!opt.esc){// 미카엘라는 피해로 쓰러지지 않는다
  const r=await A(p,()=>{const m=room.enemies.find(e=>e.r1010Michaela);for(let i=0;i<6;i++)hitEnemy(m,1e9);m.hp=0;m.hp=-5;killEnemy(m);return{hp:m.hp,max:m.maxHp,dead:!!m.deadRecorded,st:m.spawnState,in:room.enemies.includes(m)};});
  ok(label+': 큰 피해·hp=0·killEnemy 에도 미카엘라 생존(하한 70%)',r.hp>=r.max*.7-1e-6&&r.hp>0&&!r.dead&&r.in,r);
  await cutKnot(p,2);ok(label+': 차례가 아닌 매듭(3번)은 안 끊김',(await F(p)).cut===0&&!(await A(p,()=>modal)));}
 const kt=[];for(let i=0;i<want.ks;i++){await cutKnot(p,i,opt.touch?'tap':'key');const t=await storyText(p);kt.push(t);
  ok(label+': 매듭 '+(i+1)+' 원문 창이 열림',!!t,t?(await F(p)):await A(p,i=>{const k=room.props.find(q=>q.r1010Knot===i);return{f:window.__STORYWORLD_SURVIVAL_FINALE_R1010__.state(),modal,loading,story:!!storyScene,panel:(document.getElementById('panel')?.textContent||'').slice(0,60),p:[player.x,player.y,player.hp],k:k&&[k.x,k.y],room:room.id,log:window.__STORYWORLD_SURVIVAL_FINALE_R1010__.inspect().log.slice(-4)};},i));
  if(i<want.ks-1){await drain(p,()=>window.__STORYWORLD_SURVIVAL_FINALE_R1010__.state().phase!=='cutting'&&!modal,how);const s=await F(p);ok(label+': 매듭 '+(i+1)+'/'+want.ks+' 끊음, 아직 결전 중',s.cut===i+1&&s.phase==='fight'&&s.active,s);
   if(i===2)ok(label+': 3개로는 안 끝남(미카엘라 그대로·엔딩 없음)',await A(p,()=>{const m=room.enemies.find(e=>e.r1010Michaela);return !!m&&!m.r1010Released&&!window.__STORYWORLD_SURVIVAL_FINALE_R1010__.inspect().log.includes('ending');}));}}
 // 4번째 진술 창 → 엔딩 서사 → 진료기록
 const en=await drain(p,()=>!!document.getElementById('r103End'),how);
 const s4=await F(p);ok(label+': 매듭 4개를 다 끊어야 풀림(처치 아님)',s4.cut===want.ks&&s4.released===true,s4);
 ok(label+': 미카엘라는 처치되지 않음(처치 수·죽음 기록 없음)',await A(p,()=>{const m=room.enemies.find(e=>e.r1010Michaela);return !!m&&!m.deadRecorded&&m.hp>0&&m.r1010Released;}));
 if(!opt.esc)ok(label+': 엔딩 서사 = M2+M3+종장 원문 전부(첫 장면은 4번째 매듭)',en.join('').replace(/\s+/g,'').endsWith(want.en.join('').replace(/\s+/g,'')),{got:en.length,want:want.en.length});
 ok(label+': 진료기록 창',await A(p,()=>/윤서하의 진료기록/.test(document.getElementById('panel')?.textContent||'')));
 if(SHOTS&&!opt.touch&&!opt.esc)await p.screenshot({path:SHOTS+'/r1010-record.jpg',quality:85});
 if(opt.esc){await p.keyboard.press('Escape');await p.waitForTimeout(900);ok(label+': 진료기록을 Esc 로 닫아도 다시 뜸',await A(p,()=>!!document.getElementById('r103End')));}
 if(opt.touch)await p.locator('#r103End').tap();else await p.locator('#r103End').click();
 const ep=await drain(p,()=>!!document.getElementById('r1010Again'),how);
 ok(label+': 에필로그 장면 뒤 결과 창',ep.length>=1&&await A(p,()=>!!document.getElementById('r1010Again')&&!!document.getElementById('r1010Title')),{ep:ep.length});
 const log=await A(p,()=>window.__STORYWORLD_SURVIVAL_FINALE_R1010__.inspect().log);
 ok(label+': 순서 대면 → 결전 → 풀림 → 엔딩 → 진료기록 → 결과',/confront.*fight.*released.*ending.*record.*result/.test(log.join(' ')),log);
 if(SHOTS)await p.screenshot({path:SHOTS+'/r1010-result-'+label+'.jpg',quality:88});
 const st=await A(p,()=>({speak:window.__r1010Speak,nan:window.__STORYWORLD_SURVIVAL_FINALE_R1010__.inspect().stats.nanDraw,err:window.__STORYWORLD_SURVIVAL_FINALE_R1010__.inspect().stats.errors,last:window.__STORYWORLD_SURVIVAL_FINALE_R1010__.inspect().lastError,r600err:window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.errors}));
 ok(label+': 녹음 없어도 진행, 브라우저 음성 합성 0회',st.speak===0,st);ok(label+': NaN 그리기 0 · R1010 오류 0 · R600 오류 0',st.nan===0&&st.err===0&&st.r600err===0,st);
 if(opt.esc){await p.keyboard.press('Escape');await p.waitForTimeout(1200);ok(label+': 결과 창을 Esc 로 닫아도 다시 뜸(다시 도전·처음 화면 전까지)',await A(p,()=>!!document.getElementById('r1010Again')));}
 if(opt.again){if(opt.touch)await p.locator('#r1010Again').tap();else await p.locator('#r1010Again').click();
  await until(p,()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading);const s=await A(p,()=>({st:window.__STORYWORLD_SURVIVAL_R600__.state(),f:window.__STORYWORLD_SURVIVAL_FINALE_R1010__.state(),m:room.enemies.some(e=>e.r1010Michaela)}));
  ok(label+': 다시 도전 → 첫 지역부터 새 판, 결전 꺼짐',s.st.i===0&&s.st.loop===0&&!s.f.active&&!s.m,s);}
 else{if(opt.touch)await p.locator('#r1010Title').tap();else await p.locator('#r1010Title').click();await p.waitForTimeout(1500);
  ok(label+': 나가기 → 처음 화면, 생존·결전 꺼짐',await A(p,()=>!!document.getElementById('survivalStartR600')&&!window.__STORYWORLD_SURVIVAL_R600__.active()&&!window.__STORYWORLD_SURVIVAL_FINALE_R1010__.state().active));}
 ok(label+': 페이지 오류 0',errs.length===0,errs);await ctx.close();}

async function death(){const {ctx,p,errs}=await boot();await toKair05(p);{const t=await A(p,()=>time);await until(p,t=>{player.hp=maxHP();return time>=t+3;},t,300000);}await A(p,()=>window.__STORYWORLD_SURVIVAL_FINALE_R1010__.begin({key:'M'}));
 await drain(p,()=>window.__STORYWORLD_SURVIVAL_FINALE_R1010__.state().phase==='fight');await cutKnot(p,0);await drain(p,()=>window.__STORYWORLD_SURVIVAL_FINALE_R1010__.state().phase==='fight'&&!modal);ok('death: 매듭 1 끊은 뒤 결전 중',(await F(p)).cut===1&&(await F(p)).phase==='fight',await F(p));
 await A(p,()=>{player.invincible=0;player.hp=1;hurt(maxHP()*50,null);});await until(p,()=>!!document.getElementById('r600Again'),null,120000);
 const s=await A(p,()=>({f:window.__STORYWORLD_SURVIVAL_FINALE_R1010__.state(),r:window.__STORYWORLD_SURVIVAL_R600__.state(),h:document.getElementById('panel')?.textContent||'',again:!!document.getElementById('r1010Again')}));
 ok('death: 매듭 도중 영웅이 쓰러지면 생존 기존 패배 결과 창',s.r.over&&/정화가 끊겼습니다/.test(s.h)&&!s.f.active&&!s.again,{over:s.r.over,f:s.f});
 ok('death: 페이지 오류 0',errs.length===0,errs);await ctx.close();}

if(!ONLY||ONLY==='real')await full('real',{real:true});
if(!ONLY||ONLY==='pc')await full('pc',{});
if(!ONLY||ONLY==='skip')await full('skip',{esc:true,again:true});
if(!ONLY||ONLY==='death')await death();
if(!ONLY||ONLY==='mobile')await full('mobile',{vp:{width:844,height:390},touch:true,again:true});
await b.close();console.log(fail?'FAILED '+fail+'/'+n:'ALL PASS '+n);process.exit(fail?1:0);
