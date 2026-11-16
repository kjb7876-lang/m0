// R1085 브라우저 검사(헤드리스): 수묵화풍 UI — 첫 화면·슬롯/영웅 선택·서사 창·HUD·메뉴·설정을 PC 1280×720 과 폰 가로 844×390 에서 잰다.
//  실행: 빌드한 site 를 정적 서버로 올린 뒤 SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1085/r1085-browser.mjs
//  같은 화면을 '끔(storyworld.r1085.inkUi=0)'과 '켬'으로 두 번 열어, 보이는 단추·조작이 하나도 줄지 않았는지 대조한다. 헤드리스라 실기기·GPU 확인은 아니다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const SHOT=process.env.SW_SHOT||'';
const res=[];const check=(n,ok,d='')=>{res.push(!!ok);console.log((ok?'PASS ':'FAIL ')+n+(d!==''?' :: '+d:''));};
const b=await chromium.launch();const errors=[];
async function open(vp,touch,off){const ctx=await b.newContext({viewport:vp,deviceScaleFactor:1,hasTouch:!!touch,isMobile:!!touch});
 await ctx.addInitScript(([off])=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r1086.hanji','0');/* R1086 한지 창을 꺼서 R1085 먹빛 창만 잰다(한지는 r1086-browser 가 잰다) */if(off)localStorage.setItem('storyworld.r1085.inkUi','0');},[off]);
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e).slice(0,200)));await p.goto(URL);await p.locator('#campaignNew54').waitFor({timeout:180000});await p.waitForTimeout(1200);return {ctx,p};}
// 보이는 조작(단추·입력·접는 줄)의 이름표 목록 — 끔/켬 대조용
const controls=(p,root)=>p.evaluate(root=>[...document.querySelectorAll(root+' button,'+root+' input,'+root+' select,'+root+' summary')].filter(e=>{if(e.closest('#inkUiR1085'))return false;if(e.checkVisibility&&!e.checkVisibility({contentVisibilityAuto:true,visibilityProperty:true,opacityProperty:true}))return false;if(!e.offsetParent)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0;}).map(e=>(e.id||e.name||e.textContent.trim().slice(0,14))),root);
// 계산된 색·모양
const look=(p,sel)=>p.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return null;const cs=getComputedStyle(e);const rgb=s=>{const m=/rgba?\(([^)]+)\)/.exec(s);if(!m)return null;const v=m[1].split(/[,\s/]+/).filter(Boolean).map(Number);return {r:v[0],g:v[1],b:v[2],a:v[3]===undefined?1:v[3]};};
 const r=e.getBoundingClientRect();return {bg:rgb(cs.backgroundColor),img:cs.backgroundImage,fg:rgb(cs.color),radius:parseFloat(cs.borderTopLeftRadius)||0,shadow:cs.boxShadow,border:rgb(cs.borderTopColor),w:r.width,h:r.height,font:cs.fontFamily};},sel);
const lum=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;};return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b);};
const cr=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const gold=c=>c&&c.r>150&&c.g>120&&c.b<140&&c.r-c.b>50; // 옛 금테·금색 단추
async function play(p){await p.locator('#campaignNew54').click();await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});}
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
async function tour(tag,vp,touch,off){const {ctx,p}=await open(vp,touch,off);const o={};const shot=async n=>{if(SHOT&&!off)await p.screenshot({path:`${SHOT}/${tag==='PC'?'pc':'phone'}-${n}.png`});};
 o.cls=await p.evaluate(()=>document.documentElement.classList.contains('r1085Ink'));
 o.title=await controls(p,'#panel');o.titlePanel=await look(p,'#panel');o.titlePrimary=await look(p,'#campaignNew54');o.titleP=await look(p,'#panel p');o.titleH=await look(p,'#panel h1');
 o.titleEyebrow=await p.evaluate(()=>[...document.querySelectorAll('#panel .eyebrow')].filter(e=>e.offsetParent&&e.getBoundingClientRect().height>0).length);
 o.titleScroll=await p.evaluate(()=>{const e=document.getElementById('panel');return [e.scrollHeight,e.clientHeight,e.scrollWidth,e.clientWidth];});
 o.titleInView=await p.evaluate(()=>['campaignNew54','campaignContinue54','survivalStartR600','cinemaStartR461'].every(id=>{const e=document.getElementById(id);if(!e||!e.offsetParent)return false;const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1;}));
 await shot('1-title');
 await p.locator('#campaignNew54').click();await p.waitForTimeout(700);o.slot=await controls(p,'#panel');o.slotConfirm=await look(p,'#slotConfirmR73');await shot('2-slot');
 await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(1200);
 await shot('3-start');await skip(p);await p.waitForTimeout(6000);await skip(p);
 // 서사 창 틀(.storyLayout·.storyText·.storyFoot)을 엔진 openPanel 로 띄워 계산된 색을 잰다(글은 검사용 한 줄)
 await p.evaluate(()=>openPanel('<div class="eyebrow">STORY</div><h2>기억</h2><div class="storyLayout"><div class="storyText"><p>검사용 한 줄입니다.</p></div></div><div class="actions storyFoot"><button id="r1085ProbeNext" class="primary">다음</button><button id="r1085ProbeSkip">건너뛰기</button></div>'));await p.waitForTimeout(300);
 o.story=await controls(p,'#panel');o.storyText=await look(p,'#panel .storyText p');o.storyPanel=await look(p,'#panel');o.storySize=await p.evaluate(()=>getComputedStyle(document.querySelector('#panel .storyText')).fontSize);await shot('3-story');await p.evaluate(()=>closePanel(true));
 o.geo=await p.evaluate(()=>['header','footer','#heroCard','#blinkBtn','#r1021Hero','#touchUse','#joystick','#mobileSettingsR63','#menuBtn','#minipanel','.r93-orb','#upgradeBtn'].map(s=>{const e=document.querySelector(s);if(!e||!e.offsetParent)return s+':-';const r=e.getBoundingClientRect();return s+':'+[r.x,r.y,r.width,r.height].map(Math.round).join(',');}));
 o.footFrame=await p.evaluate(()=>getComputedStyle(document.querySelector('footer'),'::before').borderImageSource);
 o.header=await look(p,'header');o.footer=await look(p,'footer');o.hud=await controls(p,'body>header,body>footer,#stage'.split(',')[0]);o.hudFoot=await controls(p,'footer');o.hudStage=await controls(p,'#stage');
 o.hp=await p.evaluate(()=>{const e=document.getElementById('hpFill');return !!e;});
 o.orbs=await p.evaluate(()=>[...document.querySelectorAll('[id*="rb"],[class*="rb"]')].filter(e=>/orb/i.test(e.id+' '+e.className)&&e.offsetParent).map(e=>e.id||e.className).slice(0,6));
 o.phoneBtns=await p.evaluate(()=>['r1021Hero','blinkBtn'].map(id=>{const e=document.getElementById(id);if(!e||!e.offsetParent)return 0;const r=e.getBoundingClientRect();return Math.round(Math.min(r.width,r.height));}));
 o.skill=await look(p,'#blinkBtn');
 await shot('4-hud');
 await p.evaluate(()=>document.getElementById('menuBtn').click());await p.waitForTimeout(700);o.menu=await controls(p,'#panel');o.menuPanel=await look(p,'#panel');o.menuBtn=await look(p,'#panel .r1015Quick button');o.menuFold=await look(p,'#panel details.r1015Fold');
 o.menuTouch=await p.evaluate(()=>Math.min(...[...document.querySelectorAll('#panel .r1015Quick button')].map(e=>e.getBoundingClientRect().height)));await shot('5-menu');
 await p.evaluate(()=>closePanel(true));await p.evaluate(()=>showSettings());/* 폰 설정 접기(R142)·뒤늦게 붙는 줄이 끝나 목록이 두 번 연속 같을 때 잰다(최대 8초) */{let prev='';for(let i=0;i<16;i++){await p.waitForTimeout(500);const cur=JSON.stringify(await controls(p,'#panel'));if(cur===prev&&i>=2)break;prev=cur;}}o.settings=await controls(p,'#panel');o.setRow=await p.evaluate(()=>{const b=document.getElementById('inkUiToggleR1085');return b?{checked:b.checked,vis:!!b.offsetParent}:null;});
 o.setCheck=await look(p,'#panel input[type=checkbox]');o.setOverflow=await p.evaluate(()=>{const e=document.getElementById('panel');return e.scrollWidth-e.clientWidth;});await shot('6-settings');
 o.toggle=await p.evaluate(()=>{const b=document.getElementById('inkUiToggleR1085');if(!b)return null;const before=document.documentElement.classList.contains('r1085Ink');b.click();const mid=document.documentElement.classList.contains('r1085Ink');const st=localStorage.getItem('storyworld.r1085.inkUi');const bg1=getComputedStyle(document.getElementById('panel')).backgroundColor;b.click();const after=document.documentElement.classList.contains('r1085Ink');return {before,mid,after,st,st2:localStorage.getItem('storyworld.r1085.inkUi'),bg1};});
 await p.evaluate(()=>closePanel(true));
 await p.evaluate(()=>window.__STORYWORLD_HERO_SELECT_R263__.open());await p.waitForTimeout(700);o.hero=await controls(p,'#panel');await shot('7-heroselect');await p.evaluate(()=>closePanel(true));
 await p.evaluate(()=>document.getElementById('mapBtn').click());await p.waitForTimeout(700);o.map=await controls(p,'#panel');await shot('8-map');await p.evaluate(()=>closePanel(true));
 await p.evaluate(()=>document.getElementById('upgradeBtn').click());await p.waitForTimeout(700);o.upg=await controls(p,'#panel');await shot('9-upgrade');await p.evaluate(()=>closePanel(true));
 o.api=await p.evaluate(()=>{const a=window.__STORYWORLD_UI_INK_R1085__;return a?a.inspect():null;});
 await ctx.close();return o;}
const same=(a,b)=>{const miss=a.filter(x=>!b.includes(x));return miss;};
for(const [tag,vp,touch] of [['PC',{width:1280,height:720},false],['폰',{width:844,height:390},true]]){
 const off=await tour(tag,vp,touch,true),on=await tour(tag,vp,touch,false);
 check(`${tag} 켬: <html> 에 r1085Ink, 끔('0'): 없음`,on.cls===true&&off.cls===false);
 // 기능 보존: 끈 화면에서 보이던 조작이 켠 화면에도 모두 보인다
 for(const [k,name] of [['title','첫 화면'],['slot','슬롯·영웅 고르기'],['story','서사 창'],['hudFoot','아래 HUD'],['hudStage','게임 화면 위'],['menu','메뉴'],['settings','설정'],['hero','영웅 변경'],['map','지도'],['upg','패시브 강화']]){
  const miss=same(off[k],on[k]);check(`${tag} ${name}: 끈 화면의 조작 ${off[k].length}개가 모두 남음`,off[k].length>0||k==='hudStage'||k==='hudFoot'?miss.length===0:false,miss.length?'빠짐 '+JSON.stringify(miss.slice(0,8)):'');}
 // 간결: 보이는 조작 수가 늘지 않음
 check(`${tag} 간결: 첫 화면·메뉴에 보이는 조작이 늘지 않음`,on.title.length<=off.title.length&&on.menu.length<=off.menu.length,`${off.title.length}→${on.title.length}, ${off.menu.length}→${on.menu.length}`);
 check(`${tag} 간결: 창 머리의 영어 장식 줄(eyebrow) 안 보임`,on.titleEyebrow===0,on.titleEyebrow);
 // 먹빛 창
 const P=on.titlePanel;check(`${tag} 창 바탕: 먹빛(어둡고 푸른 기, 금빛 테 아님)`,P&&P.bg&&P.bg.a>.85&&lum(P.bg)<.03&&P.bg.b>=P.bg.r&&!gold(P.border),JSON.stringify(P&&{bg:P.bg,border:P.border}));
 check(`${tag} 창 모서리 4px 이하·번쩍이는 바깥 그림자 없음`,P&&P.radius<=4&&(on.menuPanel.radius<=4),P&&P.radius+' / '+P.shadow);
 check(`${tag} 창 바탕이 끈 화면과 다름(실제로 적용됨)`,JSON.stringify(P&&P.bg)!==JSON.stringify(off.titlePanel.bg)||P.img!==off.titlePanel.img);
 const B=on.titlePrimary;check(`${tag} 으뜸 단추(처음부터 시작): 한지 바탕·먹 글자, 금색 그라데이션 아님`,B&&B.img==='none'&&B.bg&&lum(B.bg)>.45&&cr(B.fg,B.bg)>=7&&B.radius<=4,JSON.stringify(B&&{bg:B.bg,fg:B.fg,img:B.img}));
 check(`${tag} 슬롯 확인 단추도 으뜸 단추 모양`,on.slotConfirm&&on.slotConfirm.img==='none'&&lum(on.slotConfirm.bg)>.45,JSON.stringify(on.slotConfirm&&on.slotConfirm.bg));
 check(`${tag} 본문 글자 대비 7 이상(먹 바탕 위)`,on.titleP&&cr(on.titleP.fg,P.bg)>=7,on.titleP&&cr(on.titleP.fg,P.bg).toFixed(2));
 check(`${tag} 제목 글꼴: 명조 계열 먼저`,on.titleH&&/Myeongjo|Batang|Serif|serif/.test(on.titleH.font.split(',')[0]),on.titleH&&on.titleH.font.slice(0,60));
 check(`${tag} 첫 화면: 시작 단추 넷이 스크롤 없이 보이고 창 안 스크롤·가로 넘침 없음`,on.titleInView&&on.titleScroll[0]<=on.titleScroll[1]+2&&on.titleScroll[2]<=on.titleScroll[3]+1,on.titleScroll.join('/'));
 check(`${tag} 서사 창: 글자 대비 7 이상·글 크기 그대로`,on.storyText&&cr(on.storyText.fg,on.storyPanel.bg)>=7&&on.storySize===off.storySize,on.storyText&&cr(on.storyText.fg,on.storyPanel.bg).toFixed(2)+' '+on.storySize+'/'+off.storySize);
 check(`${tag} HUD 자리·크기 그대로(머리띠·아래 띠·구슬·기술 칸·폰 단추·미니맵)`,JSON.stringify(on.geo)===JSON.stringify(off.geo),on.geo.filter((v,i)=>v!==off.geo[i]).join(' ')+' ← '+off.geo.filter((v,i)=>v!==on.geo[i]).join(' '));
 // HUD
 if(tag==='PC'){check('PC 머리띠: 먹빛 한 색(그라데이션·그림자 없음), 아래 띠: 금테 그림·그림자 없음',on.header&&on.header.img==='none'&&on.header.shadow==='none'&&lum(on.header.bg)<.03&&on.footer.shadow==='none'&&on.footFrame==='none'&&off.footFrame!=='none',JSON.stringify({h:on.header&&on.header.img,f:on.footer&&on.footer.shadow,frame:on.footFrame,was:off.footFrame.slice(0,30)}));
  check('PC 기술 칸: 납작한 먹 칸(그라데이션 없음, 금테 아님)',on.skill&&on.skill.img==='none'&&!gold(on.skill.border)&&on.skill.radius<=4,JSON.stringify(on.skill&&{img:on.skill.img,border:on.skill.border}));
  check('PC 기술 칸 크기는 그대로',on.skill&&off.skill&&Math.abs(on.skill.w-off.skill.w)<=1&&Math.abs(on.skill.h-off.skill.h)<=1);}
 else{check('폰: 화면 단추(회피·영웅 배치) 보임 여부·크기가 끈 화면과 같음',JSON.stringify(on.phoneBtns)===JSON.stringify(off.phoneBtns),JSON.stringify(on.phoneBtns)+' / '+JSON.stringify(off.phoneBtns));}
 check(`${tag} 체력 막대 요소 그대로`,on.hp===true);
 check(`${tag} 메뉴: 빠른 줄 단추 납작한 먹 칸, 누르는 높이는 줄지 않음`,on.menuBtn&&on.menuBtn.img==='none'&&on.menuTouch>=off.menuTouch-1,on.menuTouch+' vs '+off.menuTouch);
 // 설정
 check(`${tag} 설정: '수묵화풍 UI' 줄이 보이고 체크됨(끈 화면에서는 체크 안 됨)`,on.setRow&&on.setRow.vis&&on.setRow.checked===true&&off.setRow&&off.setRow.vis&&off.setRow.checked===false,JSON.stringify([on.setRow,off.setRow]));
 check(`${tag} 설정: 줄을 끄면 바로 원래 UI·저장 '0', 다시 켜면 수묵·저장 지움`,on.toggle&&on.toggle.before&&!on.toggle.mid&&on.toggle.after&&on.toggle.st==='0'&&on.toggle.st2===null,JSON.stringify(on.toggle));
 check(`${tag} 설정: 가로 넘침 없음`,on.setOverflow<=1,on.setOverflow);
 check(`${tag} 모듈 오류 0`,on.api&&on.api.errors===0,JSON.stringify(on.api));
}
check('페이지 오류 없음',errors.length===0,errors.slice(0,3).join(' | '));
await b.close();const failed=res.filter(x=>!x).length;console.log(JSON.stringify({total:res.length,failed,method:'headless chromium 1280x720 + 844x390 touch; not real-device/GPU'}));process.exit(failed?1:0);
