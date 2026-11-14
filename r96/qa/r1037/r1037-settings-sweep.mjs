// R1037 설정 전수 점검(헤드리스): 사용자 2026-11-14 "그래픽설정, 효과음 배경음 등 도 키고 끄는거 점검해서 오류없도록".
//  ① 설정 창의 모든 켜고 끄기·고르기·밀대·단계 단추를 하나씩 바꿨다가 되돌린다 → 페이지 오류 0, 창이 깨지지 않음, 값이 실제로 바뀜(저장소·settings).
//  ② 주요 소리·그래픽·서사 설정을 바꾼 뒤 새로고침 → 이어하기 → 설정 창에서 그대로인지.
//  ③ 효과: 배경음 끄기·음량 0 이면 음악 멈춤, 효과음 끄면 효과음이 안 남(엔진 audioStats.played).
//  실행: SW_URL=http://127.0.0.1:4410/m0/ SW_OUT=/mnt/project-files/r1037/ node r96/qa/r1037/r1037-settings-sweep.mjs
//  헤드리스라 실제 귀로 들은 것·GPU 화면은 아니다.
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const OUT=process.env.SW_OUT||'';
const res=[];const check=(n,ok,d='')=>{res.push({n,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+n+(d!==''?' :: '+d:''));};
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const errors=[];
const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));
 // 배경음은 R195·R308 이 new Audio() 로 튼다(DOM 밖) → play() 를 지켜 재생 중인 소리 요소를 센다
 addEventListener('submit',e=>console.log('R1037NAV submit '+(e.target&&e.target.outerHTML||'').slice(0,200)),true);addEventListener('beforeunload',()=>console.log('R1037NAV beforeunload '+location.href));
 const M=window.__r1037Media=new Set();const pl=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...a){if(this.tagName==='AUDIO')M.add(this);return pl.apply(this,a);};});
const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
// 창 닫기(R176)가 history.back 을 쓰므로, 시험 첫 쪽(about:blank)으로 밀려나지 않게 같은 주소를 한 번 더 깔아 둔다. 실제 문서 새로 읽기(load)는 따로 센다.
let loads=0;p.on('load',()=>loads++);const T0=Date.now();p.on('request',r=>{if(r.isNavigationRequest()&&r.frame()===p.mainFrame())console.log('NAVREQ '+((Date.now()-T0)/1000|0)+'s '+r.method()+' '+r.url().slice(0,120));});p.on('console',m=>{if(/R1037NAV/.test(m.text()))console.log(m.text());});p.on('crash',()=>console.log('PAGE CRASH at '+((Date.now()-T0)/1000|0)+'s'));
await p.goto(URL+'?r1037=pad',{timeout:180000,waitUntil:'domcontentloaded'});await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&document.getElementById('campaignNew54'),null,{timeout:240000});
await p.click('#campaignNew54');await p.locator('button',{hasText:'새 게임 시작'}).first().click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.evaluate(()=>{while(storyScene)advanceScene();closePanel(true);});
// 어떤 설정은 바꾸면 페이지를 새로 읽는다(지역 타일 등) → 그 조작을 '새로 읽음'으로 적고 이어하기로 돌아온다
async function ensureGame(){try{await p.waitForFunction(()=>typeof booted!=='undefined'&&booted,null,{timeout:240000});}catch(e){await p.screenshot({path:'/tmp/claude-0/sweep-stuck.png'}).catch(()=>{});console.log('STUCK url='+p.url()+' body='+(await p.evaluate(()=>document.body.innerText.slice(0,300)).catch(()=>'?')));throw e;}if(await p.evaluate(()=>started&&!loading))return;
 await p.waitForFunction(()=>document.getElementById('campaignContinue54')||document.getElementById('campaignNew54'),null,{timeout:240000});
 const cont=await p.evaluate(()=>{const b=document.getElementById('campaignContinue54');return !!b&&!b.disabled;});
 if(cont){await p.click('#campaignContinue54');}else{await p.click('#campaignNew54');await p.locator('button',{hasText:'새 게임 시작'}).first().click();}
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.evaluate(()=>{while(storyScene)advanceScene();closePanel(true);});}
// 창 닫기(R176)는 history.go(-n) 을 비동기로 부른다 → 닫자마자 다시 열면 기록이 엇갈려 페이지를 떠날 수 있어 닫은 뒤 잠깐 기다린다
const openS=async()=>{await p.evaluate(()=>{if(modal)closePanel(true);});await p.waitForTimeout(250);await p.evaluate(()=>showSettings());await p.waitForTimeout(650);};
// 창을 떠나게 하거나 판을 바꾸는 단추(따로 다룸)는 뺀다
const SKIP_ID=new Set(['settingsClose','r195CreditsBtn','hospitalDirectStart','campaignMapButtonR63','r71OpenDifficulty','r1032OpenK','r1032OpenI','story-audio-preview','r370Preview','cameraResetR63','r353Next','r370Cinema','r376Real']);
await openS();
const list=await p.evaluate(()=>{const out=[];const seen=new Map();
 for(const e of document.querySelectorAll('#panel input,#panel select,#panel button')){const l=e.closest('label');const ds=Object.entries(e.dataset).map(([k,v])=>k+'='+v).join('&');
  const base=e.id?'#'+e.id:ds?'['+ds+']':'label:'+((l?l.textContent:e.textContent)||'').trim().replace(/\d+(\.\d+)?/g,'').slice(0,40);const n=seen.get(base)||0;seen.set(base,n+1);
  out.push({key:base,nth:n,tag:e.tagName,type:e.type||'',label:((l?l.textContent:e.textContent)||e.title||'').trim().replace(/\s+/g,' ').slice(0,60),sec:e.closest('section[id],details[id],div[id]')?.id||''});}
 return out;});
const find=`(k,n)=>{const all=[...document.querySelectorAll('#panel input,#panel select,#panel button')];const seen=new Map();for(const e of all){const l=e.closest('label');const ds=Object.entries(e.dataset).map(([a,v])=>a+'='+v).join('&');
 const base=e.id?'#'+e.id:ds?'['+ds+']':'label:'+((l?l.textContent:e.textContent)||'').trim().replace(/\\d+(\\.\\d+)?/g,'').slice(0,40);const m=seen.get(base)||0;seen.set(base,m+1);if(base===k&&m===n)return e;}return null;}`;
const snap=()=>p.evaluate(()=>{const ls={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/save|slot|r370\.zoneTimes|r1023\.(stats|samples)/i.test(k))continue;ls[k]=localStorage.getItem(k);}return JSON.stringify({s:typeof settings!=='undefined'?settings:null,ls,body:document.body.className});});
const rows=[];let n=0;const loads0=loads;
for(const c of list){if(process.env.SW_LOG)console.log('… '+((Date.now()-T0)/1000|0)+'s '+c.key+' '+c.nth+' '+c.label.slice(0,30));try{if(c.tag==='BUTTON'&&c.type==='submit'&&!c.key.startsWith('['))continue;if(SKIP_ID.has(c.key.replace(/^#/,'')))continue;if(c.key.startsWith('[r176='))continue;if(/현재 검사 기록 저장/.test(c.label))continue;
 n++;await openS();const e0=errors.length,before=await snap();
 const act=await p.evaluate(([f,k,nn])=>{const e=eval(f)(k,nn);if(!e)return {missing:true};const r={tag:e.tagName,type:e.type};
  if(e.tagName==='INPUT'&&e.type==='checkbox'){r.from=e.checked;e.click();r.to=e.checked;}
  else if(e.tagName==='SELECT'){r.from=e.value;const o=[...e.options].map(o=>o.value).filter(v=>v!==e.value);if(!o.length)return {...r,noop:true};e.value=o[o.length>1?1:0];r.to=e.value;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}
  else if(e.tagName==='INPUT'&&e.type==='range'){r.from=e.value;const mn=+e.min||0,mx=+e.max||1;const v=+e.value>(mn+mx)/2?mn+(mx-mn)*.25:mn+(mx-mn)*.75;e.value=String(v);r.to=e.value;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}
  else if(e.tagName==='BUTTON'){r.from=e.className;e.click();}
  return r;},[find,c.key,c.nth]);
 await p.waitForTimeout(260);const after=await snap();const changed=before!==after;const e1=errors.length;
 const panelOk=await p.evaluate(()=>!!document.getElementById('panel'));
 // 되돌리기(단계 단추는 다음 항목이 다시 정하므로 그대로)
 if(!act.missing&&!act.noop&&act.tag!=='BUTTON'){await openS();await p.evaluate(([f,k,nn,a])=>{const e=eval(f)(k,nn);if(!e)return;if(e.type==='checkbox'){if(e.checked!==a.from)e.click();}else{e.value=a.from;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}},[find,c.key,c.nth,act]);await p.waitForTimeout(150);}
 rows.push({...c,act,changed,err:e1-e0,panelOk});}
 catch(err){if(!/context was destroyed|navigation|Target closed/i.test(String(err)))throw err;rows.push({...c,act:{reload:true},changed:true,err:0,panelOk:true,reload:true});await ensureGame();
  // 새로 읽힌 뒤 되돌린다(체크 칸만)
  try{await openS();await p.evaluate(([f,k,nn])=>{const e=eval(f)(k,nn);if(e&&e.type==='checkbox'){e.click();}},[find,c.key,c.nth]);await p.waitForTimeout(400);}catch(e2){if(!/context was destroyed|navigation/i.test(String(e2)))throw e2;}await ensureGame();}}
await p.evaluate(()=>closePanel(true));
const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+.3,t0,{timeout:120000}).catch(()=>{});const t1=await p.evaluate(()=>time);
console.log('document loads during sweep: '+(loads-loads0)+' reloads by controls: '+rows.filter(r=>r.reload).map(r=>r.key).join(','));
const bad=rows.filter(r=>r.err>0||!r.panelOk||r.act.missing);const quiet=rows.filter(r=>!r.changed&&!r.act.missing&&!r.act.noop);
check(`① 설정 조작 ${rows.length}개 하나씩 바꾸고 되돌리기: 페이지 오류·창 깨짐·못 찾음 0`,rows.length>=150&&bad.length===0,JSON.stringify(bad.slice(0,5).map(r=>[r.key,r.label,r.err,r.act])));
check(`① 바꿨을 때 저장소·settings·화면 표시가 실제로 바뀐 조작 ${rows.length-quiet.length}/${rows.length}`,quiet.length<=Math.max(3,rows.length*.05),JSON.stringify(quiet.map(r=>[r.key,r.label])));
check('① 전수 뒤에도 게임 시간이 흐름(멈춤 없음)',t1>t0,t0+' → '+t1);
// ---------- ③ 효과: 배경음·효과음 ----------
await p.evaluate(()=>{settings.music=true;settings.bgm=.6;settings.sound=true;settings.volume=.8;closePanel(true);});
const musicState=()=>p.evaluate(()=>{const L=[...window.__r1037Media].filter(a=>!a.paused&&!a.muted&&a.volume>0);return {el:window.__r1037Media.size,paused:L.length===0,playing:L.map(a=>String(a.src).split('/').pop().slice(0,40)),unlocked:audioUnlocked};});
await p.mouse.click(640,360);await p.waitForFunction(()=>[...window.__r1037Media].some(a=>!a.paused),null,{timeout:60000}).catch(()=>{});const m0=await musicState();
check('③ 배경음 켜짐: 음악이 흐름',m0.el>0&&m0.paused===false,JSON.stringify(m0));
await openS();await p.evaluate(()=>{const i=document.querySelector('#panel input[data-setting="music"]');if(i.checked)i.click();closePanel(true);});await p.waitForTimeout(700);
const m1=await musicState();check('③ 배경음 끄면 음악이 멈춤',m1.paused!==false,JSON.stringify(m1));
await openS();await p.evaluate(()=>{const i=document.querySelector('#panel input[data-setting="music"]');if(!i.checked)i.click();const r=document.querySelector('#panel input[data-volume="bgm"]');r.value='0';r.dispatchEvent(new Event('input',{bubbles:true}));closePanel(true);});await p.waitForTimeout(700);
const m2=await musicState();check('③ 배경음 음량 0 이면 음악이 멈춤',m2.paused!==false,JSON.stringify(m2));
await p.evaluate(()=>{settings.bgm=.6;});await p.waitForFunction(()=>[...window.__r1037Media].some(a=>!a.paused&&a.volume>0),null,{timeout:60000}).catch(()=>{});const m3=await musicState();check('③ 음량을 되돌리면 다시 흐름',m3.paused===false,JSON.stringify(m3));
const sfx=k=>p.evaluate(on=>{settings.sound=on;closePanel(true);const a=audioStats.played;for(let i=0;i<6;i++)sound(['hit','attack','skill','enemyHit','kill','blink'][i]);return new Promise(r=>setTimeout(()=>r(audioStats.played-a),400));},k);
const s1=await sfx(true),s0=await sfx(false);
check('③ 효과음 켜짐: 효과음이 남',s1>0,'played +'+s1);check('③ 효과음 끄면 효과음이 안 남',s0===0,'played +'+s0);
await p.evaluate(()=>{settings.sound=true;});
// ---------- ② 새로고침 뒤 유지 ----------
await openS();
const plan=await p.evaluate(()=>{const P=document.getElementById('panel');const q=s=>P.querySelector(s);const did={};
 const box=(s,v)=>{const i=q(s);if(!i)return;if(i.checked!==v)i.click();did[s]=v;};const rng=(s,v)=>{const i=q(s);if(!i)return;i.value=String(v);i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));did[s]=String(v);};
 box('input[data-setting="sound"]',false);box('input[data-setting="music"]',false);box('input[data-setting="lowFx"]',true);box('input[data-setting="reducedMotion"]',true);
 rng('input[data-volume="volume"]',.35);rng('input[data-volume="bgm"]',.4);rng('input[data-volume="voice"]',.5);
 box('input[data-r1021="subs"]',false);box('input[data-r1037="story"]',false);box('input[data-r1037="fragment"]',false);
 box('#r195On',!q('#r195On')?.checked);box('input[data-r300="fog"]',false);box('input[data-r450="on"]',false);box('input[data-r125="on"]',false);box('#r114Grain',!q('#r114Grain')?.checked);box('#r93-footsteps',false);
 return did;});
await p.evaluate(()=>{const b=document.querySelector('#panel [data-r1023-tier="mid"],#panel [data-r1023tier="mid"]');b?.click();});
await p.evaluate(()=>{closePanel(true);try{saveGame(false);}catch(_){}});await p.waitForTimeout(1500);
await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&document.getElementById('campaignContinue54'),null,{timeout:240000});
await p.click('#campaignContinue54');await p.waitForTimeout(800);const slot=p.locator('button',{hasText:/이어하기|불러오기/});if(await p.evaluate(()=>!started)&&await slot.count())await slot.first().click().catch(()=>{});
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.evaluate(()=>{while(storyScene)advanceScene();});
await openS();
const got=await p.evaluate(plan=>{const P=document.getElementById('panel');const out={};for(const [s,v] of Object.entries(plan)){const i=P.querySelector(s);out[s]=i?(i.type==='checkbox'?i.checked:String(+i.value)):'missing';}return out;},plan);
const diff=Object.entries(plan).filter(([s,v])=>String(got[s])!==String(typeof v==='string'?String(+v):v));
check(`② 새로고침 → 이어하기 뒤 설정 ${Object.keys(plan).length}개가 그대로`,diff.length===0,JSON.stringify(diff.map(([s,v])=>[s,v,got[s]])));
if(OUT)await p.screenshot({path:OUT+'settings-after-reload.png'});
check('페이지 오류 0',errors.length===0,JSON.stringify(errors.slice(0,3)));
if(OUT){const md=['# R1037 설정 전수 점검 결과(헤드리스, '+new Date().toISOString()+')','','조작 '+rows.length+'개. 바꿈=값이 저장소·settings·화면 표시에 반영됐는지, 오류=그 조작 뒤 페이지 오류 수.','','| # | 묶음 | 조작 | 종류 | 바꿈 | 오류 |','|---|---|---|---|---|---|',
 ...rows.map((r,i)=>`| ${i+1} | ${r.sec||'-'} | ${r.label.replace(/\|/g,'/')||r.key} | ${r.tag==='INPUT'?r.type:r.tag.toLowerCase()} | ${r.reload?'예(새로 읽음)':r.act.noop?'-':r.changed?'예':'아니오'} | ${r.err} |`),'',
 '## 새로고침 뒤 유지','','| 설정 | 바꾼 값 | 새로고침 뒤 |','|---|---|---|',...Object.entries(plan).map(([s,v])=>`| \`${s}\` | ${v} | ${got[s]} |`),'',
 '## 결과','',...res.map(r=>(r.ok?'- 통과 ':'- 실패 ')+r.n)].join('\n');fs.writeFileSync(OUT+'settings-sweep.md',md);}
await b.close();const failed=res.filter(r=>!r.ok).length;console.log(JSON.stringify({total:res.length,failed,controls:rows.length,method:'headless chromium — not real ears/GPU'}));process.exit(failed?1:0);
