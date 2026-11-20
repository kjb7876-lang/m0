// R1246 첫 각성 CPU 표본(헤드리스). node awaken-prof.mjs <영웅> [<영웅>…]  — 영웅마다 각성 뒤 1.5초 CDP 프로파일, 자기 시간 상위 함수(파일:줄) 출력
import {chromium,boot,go} from '../r444/lib.mjs';
const HEROES=process.argv.slice(2).length?process.argv.slice(2):['michaela'];
const b=await chromium.launch();const {ctx,p}=await boot(b,{vp:{width:960,height:540}});await go(p,process.env.ZONE||'murder01');await p.waitForTimeout(1500);
const cdp=await ctx.newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:200});
await p.evaluate(()=>{player.maxHp=player.hp=1e9;});
const waitG=s=>p.evaluate(s=>new Promise(res=>{const t0=time;const f=()=>{if(modal)closePanel(true);time>=t0+s?res():setTimeout(f,25);};f();}),s);
for(const h of HEROES){await p.evaluate(h=>{player.hero=h;player.samong=0;player.samongCD=30;},h);await waitG(2);
 await cdp.send('Profiler.start');await p.evaluate(()=>{player.samongCD=0;awaken('story');});await p.waitForTimeout(1500);const {profile}=await cdp.send('Profiler.stop');
 const byId=new Map(profile.nodes.map(n=>[n.id,n]));const self=new Map();const dt=profile.timeDeltas;let tot=0;
 for(let i=0;i<profile.samples.length;i++){const n=byId.get(profile.samples[i]);const d=(dt[i]||0)/1000;tot+=d;const cf=n.callFrame;const k=(cf.functionName||'(anon)')+' '+cf.url.split('/').pop()+':'+(cf.lineNumber+1);self.set(k,(self.get(k)||0)+d);}
 const byFile=new Map();for(const [k,v] of self){const f=k.split(' ').pop().split(':')[0]||k;byFile.set(f,(byFile.get(f)||0)+v);}
 console.log('==',h,'total ms',tot.toFixed(0));console.log([...self].sort((a,b)=>b[1]-a[1]).slice(0,18).map(([k,v])=>'  '+v.toFixed(1).padStart(7)+' '+k).join('\n'));
 const par=new Map();for(const n of profile.nodes)for(const c of (n.children||[]))par.set(c,n);const TG=/^(getImageData|texSubImage2D|texImage2D|getProgramInfoLog|getShaderInfoLog|getProgramParameter|clearPath3|linkProgram|compileShader)$/;const agg=new Map();
 for(let i=0;i<profile.samples.length;i++){const n=byId.get(profile.samples[i]);if(!TG.test(n.callFrame.functionName))continue;const ch=[];let q=par.get(n.id);for(let j=0;j<4&&q;j++){ch.push((q.callFrame.functionName||'anon')+'@'+q.callFrame.url.split('/').pop().split('?')[0]+':'+(q.callFrame.lineNumber+1));q=par.get(q.id);}const k=n.callFrame.functionName+' <- '+ch.join(' <- ');agg.set(k,(agg.get(k)||0)+(dt[i]||0)/1000);}
 console.log([...agg].sort((a,b)=>b[1]-a[1]).slice(0,14).map(([k,v])=>'  P '+v.toFixed(1).padStart(6)+' '+k).join('\n'));
 console.log('  files:',[...byFile].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>k+'='+v.toFixed(0)).join(' '));
 await p.evaluate(()=>{player.samong=0;player.samongCD=30;});await waitG(1.5);}
await b.close();
