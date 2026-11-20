// R1246 첫 각성 때 처음 재는 그림 테두리(imageCrop)·텍스처 올림 조사(헤드리스). PREP=1 이면 samongCD 3→0 자연 준비 뒤 각성.
import {chromium,boot,go} from '../r444/lib.mjs';
const HEROES=process.argv.slice(2).length?process.argv.slice(2):['michaela'];const PREP=process.env.PREP==='1';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,process.env.ZONE||'murder01');await p.waitForTimeout(1500);
await p.evaluate(()=>{player.maxHp=player.hp=1e9;window.__CR=[];const base=imageCrop;imageCrop=function(im,...r){const t=performance.now();const v=base.call(this,im,...r);const d=performance.now()-t;if(d>2)window.__CR.push({src:String(im?.currentSrc||im?.src||'').replace(/^.*assets\//,'').slice(0,90),w:im?.naturalWidth,h:im?.naturalHeight,d:+d.toFixed(1)});return v;};});
const waitG=s=>p.evaluate(s=>new Promise(res=>{const t0=time;const f=()=>{if(modal)closePanel(true);time>=t0+s?res():setTimeout(f,25);};f();}),s);
const ALL={},RES={};for(const h of HEROES){await p.evaluate(h=>{const P=player,E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__,R=window.__STORYWORLD_PERSONA_HERO_R1113__;try{E?.setForm?.(false);}catch(_){}try{R?.setForm?.(false);}catch(_){}P.egoSovereignR1046=false;P.personaHeroR1113=false;
 if(h==='ego'){P.hero='hwando';try{E.unlock('secret-777');E.setForm(true);}catch(_){}P.egoSovereignR1046=true;}else if(h==='persona'){P.hero='lauren';try{R.unlock('secret-777');R.setForm(true);}catch(_){}P.personaHeroR1113=true;}else P.hero=h;player.samong=0;player.samongCD=30;},h);await waitG(2);
 if(PREP){await p.evaluate(()=>{player.samongCD=3.2;});await waitG(3.6);}
 const pre=await p.evaluate(()=>{const a=window.__CR.splice(0);return {n:a.length,ms:a.reduce((s,x)=>s+x.d,0)};});
 await p.evaluate(()=>{player.samongCD=0;window.__F=[];let on=true;const L=t=>{window.__F.push(t);if(on)requestAnimationFrame(L);};requestAnimationFrame(L);window.__stopF=()=>{on=false;};awaken('story');});
 await p.waitForTimeout(2500);const r=await p.evaluate(()=>{window.__stopF();const F=window.__F,d=[];for(let i=1;i<F.length;i++)d.push(F[i]-F[i-1]);const a=window.__CR.splice(0);return {maxFrame:Math.max(...d),frames:d.length,crops:a.length,cropMs:a.reduce((s,x)=>s+x.d,0),top:a.sort((x,y)=>y.d-x.d).slice(0,8),all:a.map(x=>x.src)};});
 ALL[h]=r.all;RES[h]={cropMs:r.cropMs,crops:r.crops};delete r.all;console.log(h,'PREP',PREP,'준비중 crop',JSON.stringify(pre),'\n 각성',JSON.stringify(r));await p.evaluate(()=>{player.samong=0;player.samongCD=30;});await waitG(1.5);}
if(process.env.JUDGE){let bad=0;for(const [h,a] of Object.entries(RES)){const c=a.cropMs<=40;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+h+': 첫 각성 장면 테두리 재기 '+a.cropMs.toFixed(0)+'ms('+a.crops+'장) ≤ 40ms');}console.log(JSON.stringify({heroes:Object.keys(RES).length,failed:bad,headless:true}));process.exitCode=bad?1:0;}
if(process.env.OUT)(await import('node:fs')).writeFileSync(process.env.OUT,JSON.stringify(ALL,null,1));await b.close();
