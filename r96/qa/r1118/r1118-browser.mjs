// R1118 브라우저 검사(헤드리스): ① WebGL2 없는 브라우저(--disable-webgl2)에서 타이틀 안내가 맨 위에 보이고 시작 단추가 막힘
//  ② 보통 브라우저: 안내 없음·시작 가능, 영웅 선택 무대 글씨 밝음·초상 8명 순회 때 큰 초상 유지, 설정 요약에 이동·손플레이 보너스 줄
//  실행: SW_URL=http://127.0.0.1:4396/ node r96/qa/r1118/r1118-browser.mjs  (SW_SHOT=폴더면 캡처). 헤드리스라 실기기·GPU 확인은 아니다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4396/';const SHOT=process.env.SW_SHOT||'';
const res=[];const check=(n,ok,d='')=>{res.push(!!ok);console.log((ok?'PASS ':'FAIL ')+n+(d!==''?' :: '+(typeof d==='string'?d:JSON.stringify(d)):''));};
const L=`const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};const rgb=s=>{const m=/rgba?\\(([^)]+)\\)/.exec(s);const v=m[1].split(/[,\\s/]+/).map(Number);return .2126*f(v[0])+.7152*f(v[1])+.0722*f(v[2])};`;
async function open(args){const b=await chromium.launch({args});const ctx=await b.newContext({viewport:{width:1280,height:720}});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));await p.goto(URL);await p.locator('#campaignNew54').waitFor({timeout:180000});await p.waitForTimeout(1500);return {b,p,errors};}
// ① WebGL2 없음
{const {b,p}=await open(['--disable-webgl','--disable-webgl2']);
 const o=await p.evaluate(()=>{const n=document.getElementById('webglTitleNoticeR1118');const ids=['campaignNew54','campaignContinue54','survivalStartR600','cinemaStartR461'];
  let top=false,inView=false;if(n){const r=n.getBoundingClientRect();inView=r.top>=0&&r.bottom<=innerHeight&&r.height>20;const e=document.elementFromPoint(r.left+r.width/2,r.top+Math.min(12,r.height/2));top=!!e&&n.contains(e);}
  return {gl:window.__STORYWORLD_WEBGL_FALLBACK_R221__?.probe(),notice:!!n,text:n?n.innerText.slice(0,60):'',inView,top,dis:ids.map(id=>{const e=document.getElementById(id);return e?e.disabled:null;})};});
 check('WebGL2 없음: 확인 결과 false',o.gl===false,o);
 check('WebGL2 없음: 타이틀 창에 안내 칸이 보임(화면 안·맨 위)',o.notice&&o.inView&&o.top,o);
 check('WebGL2 없음: 시작 단추 비활성',o.dis.filter(x=>x!==null).length>=2&&o.dis.every(x=>x!==false),o.dis);
 const ng=await p.evaluate(async()=>{const r=await newGame('hwando');return {r,started:!!started};});
 check('WebGL2 없음: newGame 을 불러도 시작 안 됨',ng.r===false&&ng.started===false,ng);
 if(SHOT)await p.screenshot({path:SHOT+'/nogl-title.png'});await b.close();}
// ② 보통
{const {b,p,errors}=await open(['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']);
 const o=await p.evaluate(()=>({notice:!!document.getElementById('webglTitleNoticeR1118'),dis:document.getElementById('campaignNew54').disabled,gl:window.__STORYWORLD_WEBGL_FALLBACK_R221__?.probe()}));
 check('WebGL2 있음: 안내 없음·시작 단추 살아 있음',o.gl===true&&!o.notice&&!o.dis,o);
 await p.locator('#campaignNew54').click();await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
 for(let k=0;k<2;k++){await p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await p.waitForTimeout(2500);}
 await p.evaluate(()=>window.__STORYWORLD_HERO_SELECT_R263__.open());await p.waitForTimeout(900);
 const thumbs=await p.evaluate(()=>[...document.querySelectorAll('#panel .pf, #panel [data-hero]')].length);
 const tour=[];const n=await p.evaluate(()=>{const s=document.getElementById('r263Stage');const c=s&&s.parentElement;return [...document.querySelectorAll('#panel button')].filter(b=>b.querySelector('img')&&!b.closest('#r263Stage')).length;});
 for(let i=0;i<n;i++){await p.evaluate(i=>{const bs=[...document.querySelectorAll('#panel button')].filter(b=>b.querySelector('img')&&!b.closest('#r263Stage'));bs[i]?.click();},i);await p.waitForTimeout(500);
  tour.push(await p.evaluate(L+`(()=>{const s=document.getElementById('r263Stage');if(!s)return {stage:false};const im=s.querySelector('.pt img');const r=im?im.getBoundingClientRect():{width:0,height:0};
   const row=s.querySelector('.row'),nm=s.querySelector('.nm');return {stage:true,img:!!im&&im.complete&&im.naturalWidth>0&&r.width>80&&r.height>120,row:row?+rgb(getComputedStyle(row).color).toFixed(2):null,nm:nm?+rgb(getComputedStyle(nm).color).toFixed(2):null};})()`));}
 check(`영웅 선택: 썸네일 ${n}개 순회 때마다 큰 무대·초상이 보임`,n>=8&&tour.every(t=>t.stage&&t.img),tour.filter(t=>!(t.stage&&t.img)).slice(0,3));
 check('영웅 선택: 무대 이름·패시브·Q 줄 글씨가 밝음(휘도>.6)',tour.length&&tour.every(t=>t.row>.6&&t.nm>.6),tour.map(t=>[t.row,t.nm]).slice(0,3));
 if(SHOT)await p.screenshot({path:SHOT+'/hero.png'});
 await p.evaluate(()=>closePanel(true));await p.evaluate(()=>showSettings());await p.waitForTimeout(1500);
 const s=await p.evaluate(L+`(()=>{const sk=document.getElementById('r1021Skills');if(!sk)return null;const k=[...sk.querySelectorAll('.k')].map(e=>rgb(getComputedStyle(e).color));return {tx:sk.innerText,maxK:Math.max(...k)};})()`);
 check('설정 요약: 이동·손플레이 보너스 줄',s&&/이동/.test(s.tx)&&/손플레이 보너스/.test(s.tx),s&&s.tx.slice(0,160));
 check('설정 요약: 이름표(.k) 먹 글씨(휘도<.2)',s&&s.maxK<.2,s&&s.maxK);
 const auto=await p.evaluate(()=>{const was=auto;auto=true;window.__STORYWORLD_UI_COMBAT_R1021__.skills();const before=document.getElementById('r1021Skills').innerText;auto=false;window.__STORYWORLD_UI_COMBAT_R1021__.skills();const after=document.getElementById('r1021Skills').innerText;auto=was;window.__STORYWORLD_UI_COMBAT_R1021__.skills();return {before,after};});
 check('설정 요약: 반자동 켜면 기본 공격 자동·보너스 +77%(길잡이 끔만), 끄면 직접·+154%',/기본 공격\n[^\n]*\n자동/.test(auto.before)&&/손플레이 보너스\n[^\n]*\+77%/.test(auto.before)&&/기본 공격\n[^\n]*\n직접/.test(auto.after)&&/손플레이 보너스\n[^\n]*\+154%/.test(auto.after),[auto.before.slice(0,120),auto.after.slice(-90)]);
 if(SHOT)await p.screenshot({path:SHOT+'/settings.png'});
 check('페이지 오류 없음',errors.length===0,errors.slice(0,3));await b.close();}
const bad=res.filter(x=>!x).length;console.log(`${res.length-bad}/${res.length}`);process.exit(bad?1:0);
