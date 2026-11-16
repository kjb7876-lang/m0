// R1086 브라우저 검사(헤드리스): 한지 창 — 첫 화면·슬롯·서사 창·메뉴·설정·영웅 변경·지도·강화·기록을 PC 1280×720 과 폰 가로 844×390 에서 잰다.
//  실행: 빌드한 site 를 정적 서버로 올린 뒤 SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1086/r1086-browser.mjs   (SW_SHOT=폴더면 한지 켠 화면, SW_SHOT_BEFORE=폴더면 한지 끈 화면 캡처)
//  같은 화면을 '한지 끔(storyworld.r1086.hanji=0, R1085 먹빛 창)'과 '켬'으로 두 번 열어 대조한다. 헤드리스라 실기기·GPU 확인은 아니다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const SHOT=process.env.SW_SHOT||'';const BEFORE=process.env.SW_SHOT_BEFORE||''; // 한지 끈 화면(R1085 먹빛 창) 캡처 폴더
const res=[];const check=(n,ok,d='')=>{res.push(!!ok);console.log((ok?'PASS ':'FAIL ')+n+(d!==''?' :: '+d:''));};
const b=await chromium.launch();const errors=[];
async function open(vp,touch,off){const ctx=await b.newContext({viewport:vp,deviceScaleFactor:1,hasTouch:!!touch,isMobile:!!touch});
 await ctx.addInitScript(([off])=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));if(off)localStorage.setItem('storyworld.r1086.hanji','0');},[off]);
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e).slice(0,200)));await p.goto(URL);await p.locator('#campaignNew54').waitFor({timeout:180000});await p.waitForTimeout(1200);return {ctx,p};}
const controls=(p,root)=>p.evaluate(root=>[...document.querySelectorAll(root+' button,'+root+' input,'+root+' select,'+root+' summary')].filter(e=>{if(e.closest('#inkUiR1085'))return false;if(e.checkVisibility&&!e.checkVisibility({contentVisibilityAuto:true,visibilityProperty:true,opacityProperty:true}))return false;if(!e.offsetParent)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0;}).map(e=>(e.id||e.name||e.textContent.trim().slice(0,14))),root);
const look=(p,sel)=>p.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return null;const cs=getComputedStyle(e);const rgb=s=>{const m=/rgba?\(([^)]+)\)/.exec(s);if(!m)return null;const v=m[1].split(/[,\s/]+/).filter(Boolean).map(Number);return {r:v[0],g:v[1],b:v[2],a:v[3]===undefined?1:v[3]};};
 const r=e.getBoundingClientRect();return {bg:rgb(cs.backgroundColor),img:cs.backgroundImage,fg:rgb(cs.color),radius:parseFloat(cs.borderTopLeftRadius)||0,shadow:cs.boxShadow,border:rgb(cs.borderTopColor),w:r.width,h:r.height,font:cs.fontFamily};},sel);
const lum=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;};return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b);};
const cr=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
// 창 안의 보이는 글씨마다 '글씨색 / 그 뒤 실제 바탕' 대비를 잰다(모듈의 계산과 따로 다시 잰다). 사진·그림 위 글씨는 바탕을 모르므로 세지 않는다.
const audit=p=>p.evaluate(()=>{const rgb=s=>{const m=/rgba?\(([^)]+)\)/.exec(s);if(!m)return null;const v=m[1].split(/[,\s/]+/).filter(Boolean).map(Number);return {r:v[0],g:v[1],b:v[2],a:v[3]===undefined?1:v[3]};};
 const lum=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;};return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b);};
 const panel=document.getElementById('panel');const back=el=>{for(let e=el;e;e=e.parentElement){const cs=getComputedStyle(e),c=rgb(cs.backgroundColor);if(c&&c.a>=.5)return lum(c);if(/url\(/.test(cs.backgroundImage.replace(/url\(\s*["']?data:image\/svg\+xml[^)]*\)/g,'')))return null;
   if(/gradient\(/.test(cs.backgroundImage)){const ls=(cs.backgroundImage.match(/rgba?\([^)]+\)/g)||[]).map(rgb).filter(g=>g&&g.a>=.5).map(lum);if(ls.length)return ls.reduce((a,b)=>a+b,0)/ls.length;}if(e===panel)break;}return null;};
 const low=[];let n=0,worst=99;for(const el of panel.querySelectorAll('*')){if(/^(IMG|CANVAS|SVG|INPUT|SELECT|TEXTAREA|OPTION)$/i.test(el.tagName))continue;if(![...el.childNodes].some(x=>x.nodeType===3&&/\S/.test(x.nodeValue)))continue;
  if(el.checkVisibility&&!el.checkVisibility({visibilityProperty:true,opacityProperty:true}))continue;const r=el.getBoundingClientRect();if(r.width<2||r.height<2)continue;
  const cs=getComputedStyle(el);if(parseFloat(cs.opacity)<.6||el.closest('[disabled]'))continue;const fg=rgb(cs.color);const bk=back(el);if(!fg||bk===null)continue;n++;const f=lum(fg),k=(Math.max(f,bk)+.05)/(Math.min(f,bk)+.05);worst=Math.min(worst,k);
  if(k<3)low.push((el.id||el.className||el.tagName)+':'+el.textContent.trim().slice(0,10)+':'+k.toFixed(1));}
 // 덧붙인 글씨(::before·::after 의 content)도 잰다 — 단추 아래 설명 줄, 접는 줄 화살표 등
 for(const el of panel.querySelectorAll('*')){if(el.checkVisibility&&!el.checkVisibility({visibilityProperty:true,opacityProperty:true}))continue;const r=el.getBoundingClientRect();if(r.width<2||r.height<2||el.closest('[disabled]'))continue;
  for(const ps of ['::before','::after']){const cs=getComputedStyle(el,ps);if(!cs.content||cs.content==='none'||cs.content==='normal'||!/[^\s"']/.test(cs.content)||cs.display==='none'||parseFloat(cs.opacity)<.6)continue;
   const fg=rgb(cs.color),own=rgb(cs.backgroundColor);const bk=own&&own.a>=.5?lum(own):back(el);if(!fg||bk===null)continue;n++;const f=lum(fg),k=(Math.max(f,bk)+.05)/(Math.min(f,bk)+.05);worst=Math.min(worst,k);
   if(k<3)low.push((el.id||el.className||el.tagName)+ps+':'+cs.content.slice(0,10)+':'+k.toFixed(1));}}
 return {n,worst:+worst.toFixed(2),low};});
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const settle=async p=>{let prev='';for(let i=0;i<16;i++){await p.waitForTimeout(500);const cur=JSON.stringify(await controls(p,'#panel'));if(cur===prev&&i>=2)break;prev=cur;}};
async function tour(tag,vp,touch,off){const {ctx,p}=await open(vp,touch,off);const o={aud:{}};const shot=async n=>{const dir=off?BEFORE:SHOT;if(dir)await p.screenshot({path:`${dir}/${tag==='PC'?'pc':'phone'}-${n}.png`});};
 const grab=async(k,n)=>{o[k]=await controls(p,'#panel');o.aud[k]=await audit(p);await shot(n);};
 o.cls=await p.evaluate(()=>[document.documentElement.classList.contains('r1085Ink'),document.documentElement.classList.contains('r1086Hanji')]);
 o.titlePanel=await look(p,'#panel');o.titlePrimary=await look(p,'#campaignNew54');o.titleBtn=await look(p,'#survivalStartR600');o.titleP=await look(p,'#panel p');o.titleH=await look(p,'#panel h1');
 o.seal=await p.evaluate(()=>{const h=document.querySelector('#panel h1,#panel h2');if(!h)return null;const cs=getComputedStyle(h,'::after');return {c:cs.content,bg:cs.backgroundColor,d:cs.display};});
 o.titleScroll=await p.evaluate(()=>{const e=document.getElementById('panel');return [e.scrollHeight,e.clientHeight,e.scrollWidth,e.clientWidth];});
 o.titleInView=await p.evaluate(()=>['campaignNew54','campaignContinue54','survivalStartR600','cinemaStartR461'].every(id=>{const e=document.getElementById(id);if(!e||!e.offsetParent)return false;const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1;}));
 o.titleBox=await p.evaluate(()=>['panel','campaignNew54','campaignContinue54'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return [r.width,r.height].map(Math.round).join('x');}));
 await grab('title','1-title');
 await p.locator('#campaignNew54').click();await p.waitForTimeout(700);o.slotConfirm=await look(p,'#slotConfirmR73');await grab('slot','2-slot');
 await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(1200);await skip(p);await p.waitForTimeout(6000);await skip(p);
 await p.evaluate(()=>openPanel('<div class="eyebrow">STORY</div><h2>기억</h2><div class="storyLayout"><div class="storyText"><p>검사용 한 줄입니다.</p></div></div><div class="actions storyFoot"><button id="r1086ProbeNext" class="primary">다음</button><button id="r1086ProbeSkip">건너뛰기</button></div>'));await p.waitForTimeout(300);
 o.storyText=await look(p,'#panel .storyText p');o.storyPanel=await look(p,'#panel');o.storySize=await p.evaluate(()=>getComputedStyle(document.querySelector('#panel .storyText')).fontSize);await grab('story','3-story');await p.evaluate(()=>closePanel(true));
 // 어두운 칸·사진 위의 글씨는 밝게 남고, 한지 위의 밝은 글씨는 먹으로 바뀌는지(검사용 창)
 await p.evaluate(()=>openPanel('<h2>검사</h2><div id="r1086A" style="background:#101216;padding:8px"><span id="r1086A1" style="color:#f4e7c4">어두운 칸 위 밝은 글씨</span><p id="r1086A2">어두운 칸 위 문단</p></div><div id="r1086B"><span id="r1086B1" style="color:#f4e7c4">한지 위 밝은 글씨</span> <span id="r1086B2" style="color:#7a1f16">한지 위 붉은 글씨</span></div>'));await p.waitForTimeout(400);
 o.probe=await p.evaluate(()=>Object.fromEntries(['r1086A1','r1086A2','r1086B1','r1086B2'].map(id=>[id,getComputedStyle(document.getElementById(id)).color])));o.probeAud=await audit(p);await p.evaluate(()=>closePanel(true));
 o.geo=await p.evaluate(()=>['header','footer','#heroCard','#blinkBtn','#r1021Hero','#touchUse','#joystick','#mobileSettingsR63','#menuBtn','#minipanel','.r93-orb','#upgradeBtn'].map(s=>{const e=document.querySelector(s);if(!e||!e.offsetParent)return s+':-';const r=e.getBoundingClientRect();return s+':'+[r.x,r.y,r.width,r.height].map(Math.round).join(',');}));
 o.hudLook=await p.evaluate(()=>['header','footer','#blinkBtn','#menuBtn','#minipanel','#quest','#heroName'].map(s=>{const e=document.querySelector(s);if(!e)return s+':-';const cs=getComputedStyle(e);return s+':'+cs.backgroundColor+'|'+cs.color+'|'+cs.borderTopColor+'|'+cs.borderTopLeftRadius;}));
 o.hudFoot=await controls(p,'footer');o.hudStage=await controls(p,'#stage');await shot('4-hud');
 await p.evaluate(()=>document.getElementById('menuBtn').click());await p.waitForTimeout(700);o.menuBtn=await look(p,'#panel .r1015Quick button');
 o.menuTouch=await p.evaluate(()=>Math.min(...[...document.querySelectorAll('#panel .r1015Quick button')].map(e=>e.getBoundingClientRect().height)));await grab('menu','5-menu');
 await p.evaluate(()=>closePanel(true));await p.evaluate(()=>showSettings());await settle(p);
 o.setRow=await p.evaluate(()=>{const b=document.getElementById('hanjiToggleR1086'),a=document.getElementById('inkUiToggleR1085');return b?{checked:b.checked,vis:!!b.offsetParent,inSec:!!b.closest('#inkUiR1085'),base:!!(a&&a.offsetParent),h:Math.round(b.closest('label').getBoundingClientRect().height)}:null;});
 o.setOverflow=await p.evaluate(()=>{const e=document.getElementById('panel');return e.scrollWidth-e.clientWidth;});await grab('settings','6-settings');
 o.toggle=await p.evaluate(()=>{const b=document.getElementById('hanjiToggleR1086');if(!b)return null;const has=()=>document.documentElement.classList.contains('r1086Hanji'),bg=()=>getComputedStyle(document.getElementById('panel')).backgroundColor;
  const before=has(),bg0=bg();b.click();const mid=has(),st=localStorage.getItem('storyworld.r1086.hanji'),bg1=bg(),ink=document.documentElement.classList.contains('r1085Ink');b.click();return {before,mid,after:has(),st,st2:localStorage.getItem('storyworld.r1086.hanji'),bg0,bg1,bg2:bg(),ink};});
 // '수묵화풍 UI'(R1085)를 끄면 한지도 같이 꺼지고, 다시 켜면 돌아온다
 o.follow=await p.evaluate(async()=>{const a=document.getElementById('inkUiToggleR1085');if(!a)return null;const has=()=>document.documentElement.classList.contains('r1086Hanji');const w=()=>new Promise(r=>setTimeout(r,80));
  const s0=has();a.click();await w();const s1=has();a.click();await w();return {s0,s1,s2:has()};});
 await p.evaluate(()=>closePanel(true));
 await p.evaluate(()=>window.__STORYWORLD_HERO_SELECT_R263__.open());await p.waitForTimeout(900);await grab('hero','7-heroselect');await p.evaluate(()=>closePanel(true));
 await p.evaluate(()=>document.getElementById('mapBtn').click());await p.waitForTimeout(900);await grab('map','8-map');await p.evaluate(()=>closePanel(true));
 await p.evaluate(()=>document.getElementById('upgradeBtn').click());await p.waitForTimeout(900);await grab('upg','9-upgrade');await p.evaluate(()=>closePanel(true));
 o.hasJournal=await p.evaluate(()=>!!document.getElementById('journalBtn'));if(o.hasJournal){await p.evaluate(()=>document.getElementById('journalBtn').click());await p.waitForTimeout(900);await grab('journal','a-journal');await p.evaluate(()=>closePanel(true));}
 o.api=await p.evaluate(()=>{const a=window.__STORYWORLD_UI_HANJI_R1086__;return a?a.inspect():null;});
 await ctx.close();return o;}
const miss=(a,b)=>(a||[]).filter(x=>!(b||[]).includes(x));
const SCREENS=[['title','첫 화면'],['slot','슬롯·영웅 고르기'],['story','서사 창'],['menu','메뉴'],['settings','설정'],['hero','영웅 변경'],['map','지도'],['upg','패시브 강화'],['journal','기록']];
for(const [tag,vp,touch] of [['PC',{width:1280,height:720},false],['폰',{width:844,height:390},true]]){
 const off=await tour(tag,vp,touch,true),on=await tour(tag,vp,touch,false);
 check(`${tag} 켬: <html> 에 r1085Ink+r1086Hanji, 한지 끔('0'): r1085Ink 만`,on.cls[0]&&on.cls[1]&&off.cls[0]&&!off.cls[1],JSON.stringify([on.cls,off.cls]));
 for(const [k,name] of SCREENS){if(k==='journal'&&!on.hasJournal)continue;const m=miss(off[k],on[k]);check(`${tag} ${name}: 먹빛 창의 조작 ${(off[k]||[]).length}개가 한지 창에도 모두 남음(늘지도 않음)`,(off[k]||[]).length>0&&m.length===0&&on[k].length<=off[k].length,m.length?'빠짐 '+JSON.stringify(m.slice(0,8)):off[k].length+'→'+on[k].length);}
 for(const [k,name] of SCREENS){if(k==='journal'&&!on.hasJournal)continue;const a=on.aud[k],z=off.aud[k];check(`${tag} ${name}: 한지 위 글씨 대비 3 미만 0곳(잰 글씨 ${a?a.n:0}곳, 가장 낮은 대비 ${a?a.worst:'-'})`,a&&a.n>0&&a.low.length===0,a?a.low.slice(0,6).join(' | ')+(z?' (먹빛 창 '+z.low.length+'곳)':''):'');}
 const P=on.titlePanel;check(`${tag} 창 바탕: 한지(밝고 따뜻한 색, 순백 아님)`,P&&P.bg&&P.bg.a>.95&&lum(P.bg)>.5&&lum(P.bg)<.78&&P.bg.r>P.bg.b+15,JSON.stringify(P&&P.bg));
 check(`${tag} 한지 끈 화면은 R1085 먹빛 창 그대로`,off.titlePanel&&lum(off.titlePanel.bg)<.03,JSON.stringify(off.titlePanel&&off.titlePanel.bg));
 const B=on.titlePrimary;check(`${tag} 으뜸 단추(처음부터 시작): 먹 바탕·한지 글씨, 대비 10 이상`,B&&B.img==='none'&&lum(B.bg)<.03&&cr(B.fg,B.bg)>=10,JSON.stringify(B&&{bg:B.bg,fg:B.fg}));
 check(`${tag} 슬롯 확인 단추도 먹 으뜸 단추`,on.slotConfirm&&lum(on.slotConfirm.bg)<.03&&cr(on.slotConfirm.fg,on.slotConfirm.bg)>=10,JSON.stringify(on.slotConfirm&&on.slotConfirm.bg));
 const S=on.titleBtn;check(`${tag} 보통 단추: 한지 조각·먹 글씨(대비 9 이상)·붓 테 모서리(서로 다른 반지름)`,S&&lum(S.bg)>.45&&cr(S.fg,S.bg)>=9&&S.radius>=6,JSON.stringify(S&&{bg:S.bg,fg:S.fg,r:S.radius}));
 check(`${tag} 본문 글씨 대비 10 이상(한지 위 먹)`,on.titleP&&cr(on.titleP.fg,P.bg)>=10,on.titleP&&cr(on.titleP.fg,P.bg).toFixed(2));
 check(`${tag} 제목: 먹 글씨·명조 계열, 낙관 '合' 도장`,on.titleH&&lum(on.titleH.fg)<.03&&/Myeongjo|Batang|Serif|serif/.test(on.titleH.font.split(',')[0])&&on.seal&&/合/.test(on.seal.c)&&on.seal.d!=='none',JSON.stringify(on.seal));
 check(`${tag} 첫 화면: 시작 단추 넷이 스크롤 없이 보이고 창 안 스크롤·가로 넘침 없음, 창·단추 크기 그대로`,on.titleInView&&on.titleScroll[0]<=on.titleScroll[1]+2&&on.titleScroll[2]<=on.titleScroll[3]+1&&JSON.stringify(on.titleBox)===JSON.stringify(off.titleBox),on.titleScroll.join('/')+' '+on.titleBox.join(' ')+' ← '+off.titleBox.join(' '));
 check(`${tag} 서사 창: 글씨 대비 10 이상·글 크기 그대로`,on.storyText&&cr(on.storyText.fg,on.storyPanel.bg)>=10&&on.storySize===off.storySize,on.storyText&&cr(on.storyText.fg,on.storyPanel.bg).toFixed(2));
 {const c=s=>{const m=/rgba?\(([^)]+)\)/.exec(s||'');const v=m?m[1].split(/[,\s/]+/).filter(Boolean).map(Number):[0,0,0];return {r:v[0],g:v[1],b:v[2]};},q=on.probe||{};
  check(`${tag} 어두운 칸 위 글씨는 밝게 남고, 한지 위 밝은 글씨는 먹으로, 읽히는 붉은 글씨는 그대로`,q.r1086A1&&lum(c(q.r1086A1))>.6&&lum(c(q.r1086A2))>.6&&lum(c(q.r1086B1))<.05&&q.r1086B2==='rgb(122, 31, 22)'&&on.probeAud.low.length===0,JSON.stringify(q)+' '+JSON.stringify(on.probeAud.low));}
 check(`${tag} HUD 자리·크기 그대로`,JSON.stringify(on.geo)===JSON.stringify(off.geo),on.geo.filter((v,i)=>v!==off.geo[i]).join(' '));
 check(`${tag} 전투 HUD(머리띠·아래 띠·기술 칸·메뉴 단추·미니맵·쪽지) 색·모양은 먹빛 그대로`,JSON.stringify(on.hudLook)===JSON.stringify(off.hudLook),on.hudLook.filter((v,i)=>v!==off.hudLook[i]).join(' '));
 check(`${tag} HUD 위 조작 그대로`,miss(off.hudFoot,on.hudFoot).length===0&&miss(off.hudStage,on.hudStage).length===0);
 check(`${tag} 메뉴: 빠른 줄 단추 한지 조각, 누르는 높이는 줄지 않음`,on.menuBtn&&on.menuBtn.img==='none'&&lum(on.menuBtn.bg)>.45&&on.menuTouch>=off.menuTouch-1,on.menuTouch+' vs '+off.menuTouch);
 check(`${tag} 설정: '화면 꾸밈' 안에 '한지 창' 줄이 보이고 체크됨(끈 화면은 체크 안 됨), '수묵화풍 UI' 줄도 그대로`,on.setRow&&on.setRow.vis&&on.setRow.inSec&&on.setRow.base&&on.setRow.checked===true&&off.setRow&&off.setRow.vis&&off.setRow.checked===false,JSON.stringify([on.setRow,off.setRow]));
 check(`${tag} 설정: 줄을 끄면 바로 먹빛 창·저장 '0'(수묵화풍 UI 는 유지), 다시 켜면 한지·저장 지움`,on.toggle&&on.toggle.before&&!on.toggle.mid&&on.toggle.after&&on.toggle.st==='0'&&on.toggle.st2===null&&on.toggle.ink&&on.toggle.bg0!==on.toggle.bg1&&on.toggle.bg0===on.toggle.bg2,JSON.stringify(on.toggle));
 check(`${tag} 설정: '수묵화풍 UI' 를 끄면 한지도 꺼지고 다시 켜면 돌아옴`,on.follow&&on.follow.s0&&!on.follow.s1&&on.follow.s2,JSON.stringify(on.follow));
 check(`${tag} 설정: 가로 넘침 없음`,on.setOverflow<=1,on.setOverflow);
 check(`${tag} 모듈 오류 0`,on.api&&on.api.errors===0,JSON.stringify(on.api));
}
check('페이지 오류 없음',errors.length===0,errors.slice(0,3).join(' | '));
await b.close();const failed=res.filter(x=>!x).length;console.log(JSON.stringify({total:res.length,failed,method:'headless chromium 1280x720 + 844x390 touch; not real-device/GPU'}));process.exit(failed?1:0);
