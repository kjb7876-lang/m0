// R1080·R1081 브라우저 확인(헤드리스 — 실기기·GPU 확인이 아님): 실제 게임에서 영상 모듈 일곱 편을 틀어, 영상 자리에 선 그림이 얹히고
//  영상 시계를 따라가며, 자막·건너뛰기·게임 멈춤은 영상 모듈 그대로인지 본다. 지역 선 그림 컷씬 한 곳도 수묵으로 뜨는지 본다.
// 실행: 정적 서버(포트 4410, /m0/ = 빌드 결과)를 띄우고  node r96/qa/r1080/r1080-browser.mjs [화면 저장 폴더]
import {chromium,boot,skip} from '../r613/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'/tmp/r1080-shots';fs.mkdirSync(OUT,{recursive:true});
let pass=0,total=0;const ok=(n,c,d)=>{total++;if(c)pass++;console.log(c?'PASS':'FAIL',n,d===undefined?'':JSON.stringify(d).slice(0,400));};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const V=()=>p.evaluate(()=>window.__STORYWORLD_LINEART_VIDEO_R1080__.inspect());
ok('APIs present, seven clips',await p.evaluate(()=>window.__STORYWORLD_LINEART_VIDEO_R1080__.clips().length===7&&!!window.__STORYWORLD_LINEART_INK_R1081__));
// [장면, 루트, 트는 법, 자막이 있는가]
const CASES=[['opening','r309v',()=>window.__STORYWORLD_INTRO_VIDEO_R309__.play({force:true}),()=>window.__STORYWORLD_INTRO_VIDEO_R309__.skip(),false],
 ['rootgate','r372v',()=>window.__STORYWORLD_ROOT_GATE_VIDEO_R372__.play(),()=>window.__STORYWORLD_ROOT_GATE_VIDEO_R372__.skip(),false],
 ['poison','r369v',()=>window.__STORYWORLD_POISON_CITY_VIDEO_R369__.play(),()=>window.__STORYWORLD_POISON_CITY_VIDEO_R369__.skip(),true],
 ['betrayal','r368v',()=>window.__STORYWORLD_BETRAYAL_VIDEO_R368__.play(),()=>window.__STORYWORLD_BETRAYAL_VIDEO_R368__.skip(),true],
 ['knight','r617v',()=>window.__STORYWORLD_HWANDO_FALL_VIDEO_R617__.play('knight'),()=>window.__STORYWORLD_HWANDO_FALL_VIDEO_R617__.skip(),true],
 ['fall','r617v',()=>window.__STORYWORLD_HWANDO_FALL_VIDEO_R617__.play('fall'),()=>window.__STORYWORLD_HWANDO_FALL_VIDEO_R617__.skip(),true],
 ['beach','r617v',()=>window.__STORYWORLD_HWANDO_FALL_VIDEO_R617__.play('beach'),()=>window.__STORYWORLD_HWANDO_FALL_VIDEO_R617__.skip(),true]];
for(const [id,root,play,stop,hasCap] of CASES){await skip(p);const started=await p.evaluate(play);
 const up=await p.waitForFunction(r=>!!document.querySelector('#'+r+' svg.r1080'),root,{timeout:20000}).then(()=>true).catch(()=>false);
 ok(id+': module opens and the line-art stand-in is attached',started!==false&&up,{started,v:await V()});if(!up){await p.evaluate(stop);continue;}
 const st=await p.evaluate(r=>{const R=document.getElementById(r),v=R.querySelector('video'),s=R.querySelector('svg.r1080'),vb=v.getBoundingClientRect(),sb=s.getBoundingClientRect();
  return{vop:getComputedStyle(v).opacity,src:v.currentSrc||v.src,svgW:sb.width,svgH:sb.height,vidW:vb.width,ink:R.classList.contains('r1081'),color:getComputedStyle(s).color,after:v.nextElementSibling===s,pe:getComputedStyle(s).pointerEvents};},root);
 ok(id+': video hidden but kept, svg right after it and click-through',st.vop==='0'&&st.after&&st.pe==='none'&&st.svgW>600,st);
 ok(id+': dressed in ink (dark ink colour)',st.ink&&/rgb\((\d+), (\d+), (\d+)\)/.test(st.color)&&st.color.match(/\d+/g).every(x=>+x<70),st.color);
 const t0=await p.evaluate(()=>time);
 const moved=await p.waitForFunction(r=>{const v=document.querySelector('#'+r+' video');return v&&v.currentTime>1.2;},root,{timeout:60000}).then(()=>true).catch(()=>false);
 const sync=await p.evaluate(([r,id])=>{const v=document.querySelector('#'+r+' video'),i=window.__STORYWORLD_LINEART_VIDEO_R1080__.inspect();return{vt:v?v.currentTime:null,st:i.t[id],paused:v?v.paused:null,err:i.lastError,cap:document.querySelector('#'+r+' .cap')?.textContent||'',time};},[root,id]);
 ok(id+': video clock runs (headless can decode it)',moved,sync);
 ok(id+': scene clock follows the video clock',moved&&Math.abs(sync.st-sync.vt)<0.35&&!sync.err,sync);
 if(id!=='opening')ok(id+': game time stays frozen',sync.time===t0,[t0,sync.time]);/* 오프닝(r309)은 원래 게임을 멈추지 않는다(첫 서사창이 뒤에서 기다림) — 영상 모듈 동작 그대로 */
 if(hasCap){const cap=await p.waitForFunction(r=>(document.querySelector('#'+r+' .cap.on')?.textContent||'').length>4,root,{timeout:30000}).then(()=>true).catch(()=>false);ok(id+': the module shows its own canon caption over the drawing',cap,sync.cap);}
 await p.waitForTimeout(600);await p.screenshot({path:`${OUT}/game_${id}.png`});
 await p.evaluate(stop);const gone=await p.waitForFunction(r=>!document.getElementById(r),root,{timeout:15000}).then(()=>true).catch(()=>false);
 await p.waitForTimeout(300);const v=await V();ok(id+': skip closes the module and the stand-in ends',gone&&v.active.length===0&&!v.lastError,v);}
// 끄면 원래 영상이 보인다
await p.evaluate(()=>{window.__STORYWORLD_LINEART_VIDEO_R1080__.set({on:false});window.__STORYWORLD_POISON_CITY_VIDEO_R369__.play();});await p.waitForSelector('#r369v video',{timeout:20000});await p.waitForTimeout(800);
ok('off: original video visible, no stand-in',await p.evaluate(()=>{const R=document.getElementById('r369v');return !R.querySelector('svg.r1080')&&getComputedStyle(R.querySelector('video')).opacity==='1';}));
await p.evaluate(()=>{window.__STORYWORLD_POISON_CITY_VIDEO_R369__.skip();window.__STORYWORLD_LINEART_VIDEO_R1080__.set({on:true});});await p.waitForFunction(()=>!document.getElementById('r369v'),null,{timeout:15000}).catch(()=>{});
// 지역 선 그림 컷씬도 수묵
await p.evaluate(()=>window.__STORYWORLD_LINEART_R880__.play({zone:'last303',at:8}));await p.waitForSelector('#r880 svg',{timeout:15000});await p.waitForTimeout(900);
const z=await p.evaluate(()=>{const R=document.getElementById('r880'),s=R.querySelector('svg');let dark=0,n=0;s.querySelectorAll('[fill^="#"]').forEach(e=>{n++;const v=parseInt(e.getAttribute('fill').slice(1).padEnd(6,'0'),16),l=(0.2126*(v>>16&255)+0.7152*(v>>8&255)+0.0722*(v&255))/255;if(l<0.2&&e.tagName!=='ellipse')dark++;});
 return{ink:R.classList.contains('r1081'),color:getComputedStyle(s).color,bg:getComputedStyle(R).backgroundColor,dark,n,tex:!!R.querySelector('.r1081tex'),cap:R.querySelector('.cap').textContent,err:window.__STORYWORLD_LINEART_INK_R1081__.inspect().lastError};});
ok('zone cutscene last303: ink colours, light paper, no dark mass fill left, caption unchanged',z.ink&&z.dark===0&&z.tex&&z.color.match(/\d+/g).every(x=>+x<70)&&z.bg.match(/\d+/g).slice(0,3).every(x=>+x>150)&&z.cap.length>4&&!z.err,z);
await p.screenshot({path:`${OUT}/game_zone_last303.png`});await p.evaluate(()=>window.__STORYWORLD_LINEART_R880__.skip());
ok('no page errors',errs.length===0,errs.slice(0,3));
console.log(`R1080 BROWSER ${pass}/${total}`);await b.close();process.exit(pass===total?0:1);
