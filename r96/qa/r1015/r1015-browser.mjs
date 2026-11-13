// R1015 브라우저 검사(헤드리스): UI 깔끔 정리 — 첫 화면·머리띠·아래 HUD·메뉴·설정·모바일 쪽지.
//  실행: 빌드한 site 를 정적 서버로 올린 뒤 SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1015/r1015-browser.mjs
//  PC 1280×720 과 폰 가로 844×390(아이폰 13 미니급) 두 화면에서 잰다. 헤드리스라 실기기·GPU 확인은 아니다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const OFF=process.argv.includes('--off');
const res=[];const check=(n,ok,d='')=>{res.push({n,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+n+(d!==''?' :: '+d:''));};
const b=await chromium.launch();const errors=[];
async function open(vp,touch){const ctx=await b.newContext({viewport:vp,deviceScaleFactor:1,hasTouch:!!touch,isMobile:!!touch});
 await ctx.addInitScript(([off])=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));if(off)localStorage.setItem('storyworld.r1015.ui','0');},[OFF]);
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e).slice(0,200)));await p.goto(URL);await p.locator('#campaignNew54').waitFor({timeout:180000});await p.waitForTimeout(1200);return {ctx,p};}
const inView=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return 'missing';const r=e.getBoundingClientRect(),cs=getComputedStyle(e);if(!e.offsetParent||cs.visibility==='hidden')return 'hidden';return r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1?'ok':`out ${r.top|0}..${r.bottom|0}/${innerHeight}`;},sel);
// 접힌 details 안은 offsetParent 가 남으므로 checkVisibility(content-visibility 반영)로 잰다
const VIS=`e=>{if(e.checkVisibility&&!e.checkVisibility({contentVisibilityAuto:true,visibilityProperty:true,opacityProperty:true}))return false;if(!e.offsetParent)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0;}`;
const visibleButtons=p=>p.evaluate(()=>[...document.querySelectorAll('#panel button,#panel summary')].filter(e=>{if(e.checkVisibility&&!e.checkVisibility({contentVisibilityAuto:true,visibilityProperty:true,opacityProperty:true}))return false;if(!e.offsetParent)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0;}).map(e=>e.textContent.trim().slice(0,16)));
async function play(p){await p.locator('#campaignNew54').click();await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
 await p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await p.waitForTimeout(1500);}
for(const [tag,vp,touch] of [['PC',{width:1280,height:720},false],['폰',{width:844,height:390},true]]){
 const {ctx,p}=await open(vp,touch);
 // 첫 화면
 for(const id of['#campaignNew54','#campaignContinue54','#survivalStartR600','#cinemaStartR461'])check(`${tag} 첫 화면: ${id} 가 스크롤 없이 보임`,(await inView(p,id))==='ok',await inView(p,id));
 const tv=await visibleButtons(p);check(`${tag} 첫 화면: 보이는 단추 9개 이하(한눈에)`,tv.length<=9,tv.length+' '+JSON.stringify(tv));
 check(`${tag} 첫 화면: 온라인 방 만들기는 접힌 세부 항목 안(DOM 에는 있음)`,await p.evaluate(()=>{const e=document.getElementById('coopCreate62');return !!e&&!e.checkVisibility({contentVisibilityAuto:true})&&!!e.closest('details')&&!e.closest('details').open;}));
 check(`${tag} 첫 화면: 저장 슬롯 단추도 남아 있음`,await p.evaluate(()=>!!document.getElementById('slotsOpenTitleR73')));
 check(`${tag} 첫 화면: 창 안에서 스크롤할 필요 없음`,await p.evaluate(()=>{const e=document.getElementById('panel');return e.scrollHeight<=e.clientHeight+2;}),await p.evaluate(()=>{const e=document.getElementById('panel');return e.scrollHeight+'/'+e.clientHeight;}));
 await play(p);
 if(tag==='PC'){
  // 머리띠 곡 이름: 금색 막대 대신 옅은 글
  const bg=await p.evaluate(()=>{const e=document.getElementById('r313Bgm');if(!e)return null;const cs=getComputedStyle(e);const m=/rgba?\(([^)]+)\)/.exec(cs.backgroundColor);const a=m?(m[1].split(',')[3]??1):0;return {img:cs.backgroundImage,a:+a};});
  check('PC 머리띠: 곡 이름 막대 배경이 밝은 금색 막대가 아님',bg&&bg.img==='none'&&bg.a<=0.4,JSON.stringify(bg));
  // 아래 오른쪽 세부 수치는 평소 숨기고 마우스를 올리면
  const op=()=>p.evaluate(()=>{const e=document.getElementById('buildText');return e?+getComputedStyle(e).opacity:-1;});
  await p.mouse.move(640,300);await p.waitForTimeout(500);const o0=await op();
  const fr=await p.evaluate(()=>{const r=document.querySelector('footer .footRight').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];});await p.mouse.move(fr[0],fr[1]);await p.waitForTimeout(500);const o1=await op();
  check('PC 아래 HUD: 공격 간격·재사용 세부 수치는 평소 숨김, 마우스 올리면 보임',o0<0.1&&o1>0.9,o0+' → '+o1);
  await p.mouse.move(640,300);
  // 메뉴
  await p.evaluate(()=>document.getElementById('menuBtn').click());await p.waitForTimeout(700);
  const mv=await visibleButtons(p);check('PC 메뉴: 보이는 단추 14개 이하(28개 → 빠른 줄 + 접은 묶음)',mv.length<=14,mv.length+' '+JSON.stringify(mv));
  const q=await p.evaluate(()=>[...document.querySelectorAll('#panel .r1015Quick button')].map(e=>e.textContent.trim()));
  check('PC 메뉴: 빠른 줄 = 영웅·기억·지도·진행 저장·설정(+길잡이), 계속 단추는 그대로 보임',['영웅','기억','지도','진행 저장','설정'].every(t=>q.includes(t))&&mv.includes('계속'),JSON.stringify(q));
  check('PC 메뉴: 원래 단추는 모두 DOM 에 남음(28개 이상)',await p.evaluate(()=>document.querySelectorAll('#panel button').length>=28));
  check('PC 메뉴: 접은 묶음은 details 로 열 수 있음',await p.evaluate(()=>document.querySelectorAll('#panel details.r1015Fold').length>=4));
  await p.evaluate(()=>{const d=document.querySelector('#panel details.r1015Fold');if(d)d.open=true;});await p.waitForTimeout(200);
  check('PC 메뉴: 묶음을 열면 안의 단추가 보임',await p.evaluate(()=>{const d=document.querySelector('#panel details.r1015Fold');return !!d&&[...d.querySelectorAll('button')].some(e=>e.offsetParent);}));
  await p.evaluate(()=>[...document.querySelectorAll('#panel .r1015Quick button')].find(e=>e.textContent.trim()==='지도')?.click());await p.waitForTimeout(700);
  check('PC 메뉴: 빠른 줄 지도 단추가 지도를 엶',await p.evaluate(()=>modal&&!document.querySelector('#panel .r1015Quick')&&/지도|지역/.test(document.getElementById('panel').textContent)));
  await p.evaluate(()=>closePanel(true));
  // 설정
  await p.evaluate(()=>showSettings());await p.waitForTimeout(600);
  const sv=await p.evaluate(()=>[...document.querySelectorAll('#panel input,#panel select,#panel button,#panel summary')].filter(e=>e.offsetParent&&e.checkVisibility({contentVisibilityAuto:true,visibilityProperty:true})).length);
  check('PC 설정: 처음 보이는 조작 60개 이하(나머지는 더 보기)',sv<=60,sv);
  check('PC 설정: 더 보기 접힘',await p.evaluate(()=>{const d=document.getElementById('moreSettingsR142');return !!d&&!d.open;}));
  check('PC 설정: 밝기·음량은 바로 보임',await p.evaluate(()=>!!document.getElementById('r420Bright')?.offsetParent&&!!document.querySelector('#panel .r114-volumes input')?.offsetParent));
  await p.evaluate(()=>closePanel(true));
 }else{
  check('폰: 모바일 +77% 표시는 세부(숨김)',await p.evaluate(()=>{const e=document.getElementById('mobileBonusR286');return !e||!e.offsetParent||getComputedStyle(e).display==='none'||+getComputedStyle(e).opacity<0.05;}));
  await p.waitForFunction(()=>document.getElementById('r331BgmNote'),null,{timeout:30000}).catch(()=>{});
  const nh=await p.evaluate(()=>{const e=document.getElementById('r331BgmNote');return e?e.getBoundingClientRect().height:-1;});
  check('폰: 곡 소개 쪽지는 한 줄(높이 30px 이하)',nh>0&&nh<=30,nh);
 }
 const api=await p.evaluate(()=>window.__STORYWORLD_UI_CLEAN_R1015__?.inspect?.());check(`${tag} R1015 오류 0`,api&&api.stats.errors===0,JSON.stringify(api));
 await ctx.close();}
check('페이지 오류 0',errors.length===0,JSON.stringify(errors.slice(0,3)));
await b.close();
const failed=res.filter(r=>!r.ok).length;console.log(JSON.stringify({total:res.length,failed,headless:true,browserGPU:false,realDevice:false}));process.exit(failed?1:0);
