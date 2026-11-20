// R1248 브라우저 검사(헤드리스 Chromium, 소프트웨어 렌더링 — GPU·실기기·자연 플레이 아님).
//  실제 빌드에서 ① 슬롯 불러오기 복원이 실패(명시적 false·예외, 같은 지역·다른 지역)해도 HP·위치·EGO 형상·활성 슬롯·저장이
//  그대로인지, 새로고침(앱 다시 열기) 뒤 마지막 정상 진행이 이어지는지, 정상 불러오기는 되는지 ② 같은 창 묶음(같은 저장소)의
//  두 탭이 같은 슬롯을 저장할 때 오래된 탭이 최신 진행을 덮어쓰지 않는지 잰다.
//  실패 주입: save-guard-r1248.js 응답 앞에 restoreSave 를 한 번 false/예외로 돌려주는 덮개를 붙인다(가드 바로 안쪽).
//  R1248_OFF=1 이면 가드 없이 같은 주입만 넣어 고치기 전 동작을 잰다.
import {createRequire} from 'node:module';import fs from 'node:fs';
const {chromium}=createRequire(import.meta.url)('playwright');
const SITE=process.env.SW_URL||'http://127.0.0.1:4410/m0/',OFF=process.env.R1248_OFF==='1';
const INJECT=`{const b=restoreSave;restoreSave=async function(...a){const m=window.__R1248_FAIL__;if(m){window.__R1248_FAIL__=null;if(m==='throw')throw Error('R1248 주입 예외');return false;}return b.apply(this,a);};}\n`;
const guard=fs.readFileSync(new URL('../../client-source/save-guard-r1248.js',import.meta.url),'utf8');
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{if(!sessionStorage.getItem('r1248-init')){sessionStorage.setItem('r1248-init','1');localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r1046.ego',JSON.stringify({on:true}));}});
await ctx.route('**/save-guard-r1248.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:INJECT+(OFF?'':guard)}));
const errors=[];const res={off:OFF};
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
async function settle(p){await p.waitForFunction(()=>started&&!loading&&!window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().busy,null,{timeout:240000});await skip(p);}
const page=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e).slice(0,200)));return p;};
const A=await page();await A.goto(SITE);await A.locator('#campaignNew54').click({timeout:180000});await A.locator('#slotConfirmR73').click();await settle(A);
res.setup=await A.evaluate(async()=>{const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__,S=window.__STORYWORLD_SAVE_SLOTS_R73__,st=window.__STORYWORLD_TEST_STORAGE_B1__.store;
 if(player.hero!=='hwando'&&typeof switchHero==='function')try{switchHero('hwando');}catch(_){}
 player.hp=99;E.setForm(true);const saved=saveGame(false);const key=S.key(),raw=JSON.parse(st.getItem(key));
 const mk=(n,patch)=>{const r=JSON.parse(JSON.stringify(raw));r.player.hp=patch.hp;r.player.x=patch.x??r.player.x;r.player.y=patch.y??r.player.y;r.player[E.field]=false;r.zone=patch.zone||r.zone;r.saveSlotR73={...r.saveSlotR73,slot:n,savedAt:new Date(Date.now()+n*1000).toISOString()};if(r.healthR71)r.healthR71.hp=patch.hp;st.setItem(key.replace(/\d$/,String(n)),JSON.stringify(r));};
 const other=Object.keys(regionById).find(z=>z!==zone&&!regionById[z].safe&&/^dist0/.test(z))||Object.keys(regionById).find(z=>z!==zone);
 mk(2,{hp:20});mk(3,{hp:30,zone:other});
 return {saved,hero:player.hero,form:E.formActive(),zone,other,hp:player.hp,x:player.x,y:player.y,active:S.inspect().active};});
console.log('setup',JSON.stringify(res.setup));
const snap=p=>p.evaluate(()=>{const S=window.__STORYWORLD_SAVE_SLOTS_R73__,st=window.__STORYWORLD_TEST_STORAGE_B1__.store,k=n=>S.key().replace(/\d$/,String(n));
 return {active:S.inspect().active,pointer:st.getItem(S.key().replace(/\d$/,'active')),hp:Math.round(player.hp),x:+player.x.toFixed(2),y:+player.y.toFixed(2),zone,form:window.__STORYWORLD_EGO_SOVEREIGN_R1046__.formActive(),
  msg:S.inspect().message,slots:[1,2,3].map(n=>{const t=st.getItem(k(n));return t?t.length+':'+t.slice(-40):null;})};});
const checks=[];const ok=(n,p,d)=>{checks.push([n,!!p,d]);console.log((p?'PASS ':'FAIL ')+n+' '+(typeof d==='string'?d:JSON.stringify(d)));};
res.base=await snap(A);
for(const [label,mode,slot] of [['같은 지역 false','false',2],['같은 지역 예외','throw',2],['다른 지역 false','false',3],['다른 지역 예외','throw',3]]){
 const r=await A.evaluate(async([mode,slot])=>{window.__R1248_FAIL__=mode;return await window.__STORYWORLD_SAVE_SLOTS_R73__.confirm('load',slot);},[mode,slot]);
 await settle(A);const s=await snap(A);res[label]={r,...s};
 ok(label+': 불러오기 실패로 보고',r===false,String(r));
 ok(label+': 활성 슬롯·포인터 1 유지',s.active===1&&s.pointer==='1',{active:s.active,pointer:s.pointer});
 ok(label+': HP(99 이상, 거점 자연 회복 허용)·위치·지역 유지 — 슬롯 2·3 의 HP 20·30 으로 떨어지지 않음',s.hp>=99&&s.x===res.base.x&&s.y===res.base.y&&s.zone===res.base.zone,{hp:s.hp,x:s.x,y:s.y,zone:s.zone});
 ok(label+': EGO 형상 유지',s.form===res.base.form,String(s.form));
 ok(label+': 슬롯 저장 3개 그대로',JSON.stringify(s.slots)===JSON.stringify(res.base.slots),'');
 ok(label+': 완료 메시지 아님',!/불러오기 완료/.test(s.msg),s.msg);
}
// 앱을 다시 연 것처럼 새로고침 → 이어하기
await A.reload();await A.locator('#campaignContinue54').click({timeout:180000});await settle(A);res.reopen=await snap(A);
ok('다시 열기: 마지막 정상 진행(슬롯 1, HP 99) 복구',res.reopen.active===1&&res.reopen.hp>=99&&res.reopen.zone===res.base.zone,res.reopen);
// 두 탭
const B=await page();await B.goto(SITE);await B.locator('#campaignContinue54').click({timeout:180000});await settle(B);
const save=(p,hp)=>p.evaluate(hp=>{player.hp=hp;return saveGame(false);},hp);
const slot1=()=>A.evaluate(()=>{const S=window.__STORYWORLD_SAVE_SLOTS_R73__,st=window.__STORYWORLD_TEST_STORAGE_B1__.store,k=S.key().replace(/\d$/,'1');const t=st.getItem(k),c=st.getItem(k+'.conflict-r1248');return {hp:Math.round(JSON.parse(t).player.hp),conflict:c?Math.round(JSON.parse(c).player.hp):null};});
res.tabs={a88:await save(A,88),after88:await slot1(),b11:await save(B,11),after11:await slot1(),toastsB:await B.evaluate(()=>[...document.querySelectorAll('#toast,.toast')].map(e=>e.textContent).join(' | ').slice(0,200))};
console.log('tabs',JSON.stringify(res.tabs));
ok('두 탭: 최신 탭 A 저장(HP 88)',res.tabs.a88===true&&res.tabs.after88.hp===88,res.tabs.after88);
ok('두 탭: 오래된 탭 B(HP 11)가 슬롯을 덮지 않음',res.tabs.after11.hp===88,res.tabs.after11);
ok('두 탭: B 진행은 충돌 사본으로 보존',res.tabs.after11.conflict===11,res.tabs.after11);
// 정상 불러오기(가드 켜짐/꺼짐 공통)
const r2=await A.evaluate(async()=>await window.__STORYWORLD_SAVE_SLOTS_R73__.confirm('load',2));await settle(A);res.success={r:r2,...await snap(A)};
ok('정상 불러오기: 슬롯 2 로 바뀌고 HP 가 슬롯 2 값(20, R71 체력 환산 허용 ≤30)',r2===true&&res.success.active===2&&res.success.hp<=30,res.success);
ok('페이지 오류 없음',errors.length===0,errors.slice(0,3).join(' | '));
fs.writeFileSync(new URL(`./save-guard-browser-result${OFF?'-off':''}.json`,import.meta.url),JSON.stringify({method:'headless Chromium software rendering, injected restore failure; not GPU/real device/natural play',res,checks,errors},null,1));
await b.close();process.exit(checks.every(c=>c[1])?0:1);
