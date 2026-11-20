// R1253 텍스처 다시 올림 전수(헤드리스): 꿈 층에서 게임 시간 SEC 초 동안 몹을 4초마다 하나씩 쓰러뜨리며, GPU 에 같은 그림을 몇 번 올리는지(경로별 횟수·ms·화소) 센다.
//  node upload-census.mjs  env: SW_URL, ZONE(dist01), HERO(hwando), SEC(60), JUDGE=1(같은 그림 3번 이상 올림이 0건), OUT
import {chromium,boot} from '../r444/lib.mjs';
const SEC=+(process.env.SEC||60),HERO=process.env.HERO||'hwando',Z=process.env.ZONE||'dist01';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(z=>enterRegion(z,null,{layer:'DREAM',restore:true}),Z);await p.waitForFunction(z=>!loading&&room?.id===z&&layer==='DREAM',Z,{timeout:150000});
await p.evaluate(h=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);player.hero=h;player.maxHp=player.hp=1e9;player.samongCD=999;
 const R=window.__STORYWORLD_PHASE1__.controller.state.three.renderer;const gl=R.getContext();window.__U=[];
 const src=a=>{for(const x of a)if(x&&typeof x==='object'&&('width' in x)){const s=String(x.currentSrc||x.src||(x.tagName||'?'));return {px:(x.naturalWidth||x.width)*(x.naturalHeight||x.height),s:s.replace(/^.*assets\//,'').slice(0,80)};}return null;};
 for(const k of ['texImage2D','texSubImage2D']){const f=gl[k].bind(gl);gl[k]=function(...a){const t=performance.now();const v=f(...a);const i=src(a);if(i)window.__U.push({t:time,d:performance.now()-t,...i});return v;};}},HERO);
await p.waitForTimeout(1000);await p.evaluate(()=>{window.__U.length=0;});
await p.evaluate(sec=>new Promise(res=>{const t0=time;let next=t0+2;const f=()=>{if(modal)closePanel(true);if(storyScene)advanceScene();player.hp=player.maxHp;
 if(time>=next){next=time+4;const e=(room.enemies||[]).find(e=>e.hp>0&&!e.boss);if(e){e.hp=0;}}
 time>=t0+sec?res():setTimeout(f,30);};f();}),SEC);
const U=await p.evaluate(()=>window.__U);const by=new Map();for(const u of U){if(u.s==='CANVAS'||/^(HTMLCanvasElement|CANVAS)/.test(u.s))continue;const m=by.get(u.s)||{n:0,ms:0,px:u.px,t:[]};m.n++;m.ms+=u.d;m.t.push(+u.t.toFixed(1));by.set(u.s,m);}
const rows=[...by].sort((a,b)=>b[1].ms-a[1].ms);const again=rows.filter(([,m])=>m.n>=3);
console.log('올림',U.length,'번, 그림',by.size,'종, 전체',U.reduce((s,u)=>s+u.d,0).toFixed(0)+'ms');
for(const [s,m] of rows.slice(0,20))console.log(String(m.n).padStart(3)+'번 '+m.ms.toFixed(1).padStart(7)+'ms '+(m.px/1e6).toFixed(2)+'M '+s+' @'+m.t.slice(0,8).join(','));
if(process.env.JUDGE){const c=again.length===0;console.log((c?'PASS ':'FAIL ')+'같은 그림을 '+SEC+'게임초 안에 3번 이상 다시 올림 '+again.length+'건 '+JSON.stringify(again.map(([s,m])=>s+'×'+m.n)));process.exitCode=c?0:1;}
if(process.env.OUT)(await import('node:fs')).writeFileSync(process.env.OUT,JSON.stringify(rows,null,1));await b.close();
