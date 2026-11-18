// R1171 브라우저 검사(헤드리스·소프트웨어 렌더링·모바일 에뮬레이션(Pixel 7 가로, 터치) — 그래픽/실기기/자연 플레이 검증 아님).
//  사용자 2026-11-18 12:20Z "모바일에서 생존모드로 페르소나및 히든에고영웅 플래이가안됨"
//  ① 빈 저장: 무한 생존 영웅 고르기 = 8명 ② 제목 6연타 후 멈춤 → 그대로 ③ 제목 7연타 → EGO·페르소나 칸(10명)·해금 저장
//  ④ EGO 골라 시작 → 조종 = 환도 + EGO 표식, HUD EGO, 배치 창 주인 'ego' ⑤ 해금된 저장으로 페르소나 시작 → 라우렌 + 페르소나 표식
//  ⑥ 해금돼도 환도를 고르면 표식 없음(회귀) ⑦ PC 키보드 7·7·7 도 같은 창에서 해금 ⑧ 페이지 오류 없음
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium,devices}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4396/m0/',SHOTS=process.env.SHOTS||'';let fail=0;
const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)fail++;};
const b=await chromium.launch();const errs=[];
async function page(mobile,unlocked){const ctx=await b.newContext(mobile?{...devices['Pixel 7 landscape']}:{viewport:{width:960,height:540}});
 await ctx.addInitScript(u=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));if(u){localStorage.setItem('storyworld.r1046.ego',JSON.stringify({on:true}));localStorage.setItem('storyworld.r1113.personaHero',JSON.stringify({on:true}));}},!!unlocked);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,200)));await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});return {p,ctx};}
const cards=p=>p.evaluate(()=>[...document.querySelectorAll('[data-r600hero]')].map(x=>x.getAttribute('data-r600hero')));
const toPicker=async(p,mobile)=>{const t=mobile?'tap':'click';await p.locator('#survivalStartR600')[t]();await p.locator('[data-r600diff="normal"]')[t]();await p.locator('[data-r600hero]').first().waitFor({timeout:20000});};
const startWith=async(p,id,mobile)=>{const t=mobile?'tap':'click';await p.locator('[data-r600hero="'+id+'"]').scrollIntoViewIfNeeded();await p.locator('[data-r600hero="'+id+'"]')[t]();await p.locator('#r600Go')[t]();
 await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
 await p.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());const t0=await p.evaluate(()=>time);await p.waitForFunction(a=>time>=a,t0+1,{timeout:240000});};
const who=p=>p.evaluate(()=>({hero:player.hero,ego:player.egoSovereignR1046===true,persona:player.personaHeroR1113===true,hud:document.getElementById('heroName')?.textContent||'',main:window.__STORYWORLD_HERO_DEFENSE_R720__?.state?.()?.main,sv:window.__STORYWORLD_SURVIVAL_R600__.state()?.hero}));
const shot=async(p,n)=>{if(SHOTS)await p.screenshot({path:SHOTS+'/'+n+'.png'});};

// 모바일 · 빈 저장 → 제목 연타로 해금 → EGO
{const {p,ctx}=await page(true,false);await toPicker(p,true);
 let c=await cards(p);ok('① 빈 저장: 고르기 8명, EGO·페르소나 없음',c.length===8&&!c.includes('ego')&&!c.includes('persona'),c);
 const h2=p.locator('#panel h2').first();
 for(let i=0;i<6;i++){await h2.tap();await p.waitForTimeout(120);}await p.waitForTimeout(1700);await h2.tap();await p.waitForTimeout(300);
 c=await cards(p);ok('② 제목 6연타 뒤 멈추고 1번 → 해금 안 됨',c.length===8&&!(await p.evaluate(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__.unlocked())),c);
 await p.waitForTimeout(1700);for(let i=0;i<7;i++){await h2.tap();await p.waitForTimeout(120);}
 await p.waitForFunction(()=>!!document.querySelector('[data-r600hero="ego"]'),null,{timeout:5000}).catch(()=>{});
 c=await cards(p);ok('③ 제목 7연타 → EGO·페르소나 칸(10명, 맨 뒤)',c.length===10&&c[8]==='ego'&&c[9]==='persona',c);
 ok('③ 해금 저장(R1046·R1113 같은 저장)',await p.evaluate(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__.unlocked()&&window.__STORYWORLD_PERSONA_HERO_R1113__.unlocked()));
 ok('③ 난이도는 그대로(보통)',await p.evaluate(()=>/보통/.test(document.querySelector('#panel .eyebrow')?.textContent||'')),await p.evaluate(()=>document.querySelector('#panel .eyebrow')?.textContent));
 await p.locator('[data-r600hero="ego"]').scrollIntoViewIfNeeded();await p.locator('[data-r600hero="ego"]').tap();
 ok('③ EGO 칸을 누르면 설명에 EGO 이름',await p.evaluate(()=>/EGO/.test(document.getElementById('r600Stage')?.textContent||'')),await p.evaluate(()=>document.getElementById('r600Stage')?.textContent.slice(0,80)));
 const box=await p.locator('[data-r600hero="ego"]').boundingBox();const vp=p.viewportSize();
 ok('③ EGO 칸이 화면 안에서 누를 수 있는 크기(≥40px)',box&&box.width>=40&&box.height>=40&&box.x>=0&&box.x+box.width<=vp.width+1,box);
 await shot(p,'r1171-1-picker-mobile');
 await p.locator('#r600Go').tap();
 await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
 await p.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());{const t0=await p.evaluate(()=>time);await p.waitForFunction(a=>time>=a,t0+1,{timeout:240000});}
 let w=await who(p);ok('④ EGO 시작 → 조종 = 환도 + EGO 표식, 페르소나 표식 없음',w.hero==='hwando'&&w.ego&&!w.persona,w);
 ok('④ HUD 이름 EGO',/EGO/.test(w.hud),w.hud);
 ok('④ 배치 창 주인 = ego(환도와 따로)',w.main==='ego',w);
 ok('④ 생존 상태 영웅 = ego(다시 도전도 EGO)',w.sv==='ego',w);
 ok('④ 생존 판 진행 중',await p.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&player.hp>0));
 await shot(p,'r1171-2-ego-play');await ctx.close();}
// 모바일 · 해금된 저장 → 페르소나
{const {p,ctx}=await page(true,true);await toPicker(p,true);
 const c=await cards(p);ok('⑤ 해금된 저장: 처음부터 10명',c.length===10,c);
 await startWith(p,'persona',true);const w=await who(p);
 ok('⑤ 페르소나 시작 → 조종 = 라우렌 + 페르소나 표식, EGO 표식 없음',w.hero==='lauren'&&w.persona&&!w.ego,w);
 ok('⑤ HUD 이름 페르소나',/페르소나/.test(w.hud),w.hud);ok('⑤ 배치 창 주인 = persona',w.main==='persona',w);
 await shot(p,'r1171-3-persona-play');await ctx.close();}
// PC · 빈 저장 → 7키 3번 → 환도(회귀: 표식 없음)
{const {p,ctx}=await page(false,false);await toPicker(p,false);
 for(let i=0;i<3;i++){await p.keyboard.press('7');await p.waitForTimeout(150);}
 await p.waitForFunction(()=>!!document.querySelector('[data-r600hero="persona"]'),null,{timeout:5000}).catch(()=>{});
 const c=await cards(p);ok('⑦ PC 고르기 창 7·7·7 → 10명',c.length===10,c);
 await startWith(p,'hwando',false);const w=await who(p);
 ok('⑥ 해금돼도 환도를 고르면 EGO 표식 없음(회귀)',w.hero==='hwando'&&!w.ego&&!w.persona&&w.main==='hwando',w);
 await ctx.close();}
ok('⑧ 페이지 오류 없음',errs.length===0,errs);
await b.close();console.log((fail?'FAIL':'PASS')+' r1171 mobile browser, fail='+fail);process.exit(fail?1:0);
