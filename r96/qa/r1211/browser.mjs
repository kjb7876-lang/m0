// R1211 헤드리스 확인(GPU·실기기 아님): 꿈 dist01 에서 사몽 준비(예열) → 각성 → 끝 → 지역 이동(dist02, 사본 비우기) 뒤
//  예열 참조를 돌려줬는지(prewarmReleased = prewarmUploaded), 버린 사본 캔버스가 장면 텍스처에 남지 않는지, 페이지 오류가 없는지 본다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.URL||'http://127.0.0.1:4410/m0/';let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.hospital-three-pc.maze.v11:r111.play',JSON.stringify({samongShader:false}));/* R1217: 흑백 사본 길을 본다 */});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const waitG=s=>p.evaluate(s=>new Promise(res=>{const t0=time;const f=()=>{if(modal)closePanel(true);time>=t0+s?res():setTimeout(f,25);};f();}),s);
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
const go=async z=>{await p.evaluate(z=>enterRegion(z,null,{layer:'DREAM',restore:true}),z);await p.waitForFunction(z=>!loading&&room?.id===z&&layer==='DREAM',z,{timeout:150000});await skip();};
await go('dist01');
await p.evaluate(()=>{player.samong=0;player.samongCD=0;player.hp=player.maxHp=1e7;auto=true;});await waitG(3);
const st=()=>p.evaluate(()=>{const s=window.__STORYWORLD_PLAY_R111__.inspect().samong,S=window.__STORYWORLD_PHASE1__.controller.state.three.commands;
 let grayTex=0,grayRefs=0;for(const [im,r] of S.textures)if(im?.__storyworldStaticSource?.r111SamongGray){grayTex++;grayRefs+=r.refs;}
 return{made:s.prewarmMade,up:s.prewarmUploaded,rel:s.prewarmReleased||0,gray:s.grayImages,px:s.grayPixels,grayTex,grayRefs};});
const a=await st();console.log('예열 뒤',JSON.stringify(a));ok(a.up>0,'사몽 준비 중 흑백 사본을 미리 올림('+a.up+'장)');
await p.evaluate(()=>{player.samongCD=0;awaken('story');});await waitG(4);await p.evaluate(()=>{player.samong=0;});await waitG(1);
const c=await st();console.log('각성 끝',JSON.stringify(c));
await go('dist02');await p.evaluate(()=>{player.samongCD=0;});await waitG(.5);/* 다시 준비 상태가 되면 지역이 달라 사본을 비운다 */
const d=await st();console.log('지역 이동 뒤',JSON.stringify(d));
ok(d.grayTex<=d.up-c.up,'옛 지역 흑백 사본 텍스처가 장면에 남지 않음(남은 흑백 텍스처 '+d.grayTex+'장 — 새 지역 예열 '+(d.up-c.up)+'장 이하)');
ok(d.rel>=a.up&&d.rel===c.up&&d.grayRefs<=d.up-d.rel+0,'지역을 옮겨 사본을 비우면 예열 참조를 모두 돌려줌(올림 '+c.up+'·돌려줌 '+d.rel+')');
ok(errs.length===0,'페이지 오류 없음 '+JSON.stringify(errs));
console.log(`R1211 browser ${n-bad}/${n}`);await b.close();process.exit(bad?1:0);
