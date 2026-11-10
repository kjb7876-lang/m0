import {chromium} from '/home/user/m0/r96/qa/r444/lib.mjs';import fs from 'node:fs';
const hero=process.argv[2]||'hwando',secs=+(process.argv[3]||60),zoneRe=process.argv[4]||'광장',out=process.argv[5]||'rec';
const URL=process.env.SW_URL||'http://127.0.0.1:4396/';
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));
 const R=window.__REC={chunks:[],taps:0,t0:0,sr:0,on:false};R.audios=[];const OA=window.Audio;window.Audio=function(...a){const el=new OA(...a);R.audios.push(el);return el;};window.Audio.prototype=OA.prototype;const oc=AudioNode.prototype.connect;
 R.srcs=[];AudioNode.prototype.connect=function(d,...a){if(d&&d===this.context.destination&&!this.__tap){this.__tap=1;R.srcs.push(this);}return oc.call(this,d,...a);};});
const p=await ctx.newPage();p.on('pageerror',e=>console.error('PAGEERR',String(e).slice(0,200)));
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
const z=await p.evaluate(re=>{if(re==='list')return Object.values(regionById).map(x=>[x.id,x.title,x.safe?1:0]);const d=Object.values(regionById).filter(d=>new RegExp(re).test(d.id+' '+(d.title||''))&&!d.safe);return d.map(x=>[x.id,x.title]);},zoneRe);console.log('zones',JSON.stringify(z));
if(zoneRe==='list'){await b.close();process.exit(0);}const zone=z[0][0];await p.evaluate(([z,h])=>{player.hero=h;enterRegion(z,null,{layer:'STORY',restore:true});},[zone,hero]);await p.waitForFunction(z=>!loading&&room?.id===z,zone,{timeout:150000});await skip();
const r=await p.evaluate(async secs=>{const C=window.__STORYWORLD_SFX_COMFORT__,wait=ms=>new Promise(r=>setTimeout(r,ms));try{await unlockAudio();}catch(_){}settings.sound=true;settings.volume=.8;
 guide=true;auto=true;guideTimer=0;try{window.__STORYWORLD_GUIDE_R77__?.syncGuide();}catch(_){}
 const os=sound;const calls=[];sound=function(k,...a){calls.push([+(performance.now()).toFixed(0),k]);return os.call(this,k,...a);};
 {const ac=audioContext;__REC.sr=ac.sampleRate;const code='class T extends AudioWorkletProcessor{constructor(){super();this.b=[];this.n=0;}process(i){const c=i[0];if(c&&c[0]){const m=new Float32Array(c[0].length);for(let k=0;k<m.length;k++)m[k]=c.length>1?(c[0][k]+c[1][k])/2:c[0][k];this.b.push(m);this.n+=m.length;if(this.n>=8192){this.port.postMessage(this.b);this.b=[];this.n=0;}}return true;}}registerProcessor("tap",T);';
 await ac.audioWorklet.addModule(URL.createObjectURL(new Blob([code],{type:'application/javascript'})));__REC.taps=__REC.srcs.length;
 __REC.srcs.forEach((src,i)=>{const n=new AudioWorkletNode(ac,'tap',{numberOfInputs:1,numberOfOutputs:1,channelCount:2,channelCountMode:'explicit'});n.port.onmessage=e=>{if(!__REC.on)return;const ch=(__REC.chunks[i]=__REC.chunks[i]||[]);for(const m of e.data)ch.push(m);};src.connect(n);const z=ac.createGain();z.gain.value=0;n.connect(z);z.connect(ac.destination);});}
 __REC.on=true;const t0=performance.now(),g0=time;const plays=[];let seen=0;
 while(performance.now()-t0<secs*1000){player.hp=Math.max(player.hp,maxHP()*.6);if(storyScene)advanceScene();if(modal)closePanel(true);const a=C.inspect().audit;for(const x of a){if(x.id>seen&&x.kind==='play'){seen=x.id;plays.push([+(performance.now()-t0).toFixed(0),x.role,x.path.split('/').pop().slice(0,44),+x.level.toFixed(3),x.active]);}}await wait(100);}
 __REC.on=false;sound=os;const pcm=[];for(const ch of __REC.chunks){if(!ch){pcm.push('');continue;}let n=0;for(const c of ch)n+=c.length;const all=new Float32Array(n);let o=0;for(const c of ch){all.set(c,o);o+=c.length;}
 let s='';const u=new Uint8Array(all.buffer);for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));pcm.push(btoa(s));}
 const audios=[...__REC.audios,...document.querySelectorAll('audio,video')].map(a=>[String(a.currentSrc||a.src).split('/').pop().slice(0,50),a.paused,+a.volume.toFixed(3),a.muted]);
 return {hero:player.hero,guide,gameSecs:time-g0,plays,ncalls:calls.length,kinds:calls.reduce((m,c)=>(m[c[1]]=(m[c[1]]||0)+1,m),{}),stats:C.inspect().stats,zone:room.id,kills:room.kills,sr:__REC.sr,taps:__REC.taps,recT0:__REC.t0-t0,err:__REC.err,audios,settings:JSON.parse(JSON.stringify(settings)),pcm};},secs);
r.pcm.forEach((q,i)=>fs.writeFileSync(out+'_'+i+'.f32',Buffer.from(q,'base64')));delete r.pcm;console.log('audios',JSON.stringify(r.audios.filter(a=>!a[1])),'settings',JSON.stringify(r.settings));
const by={};for(const x of r.plays){const k=x[1]+' '+x[2]+' lvl'+x[3];(by[k]=by[k]||[]).push(x[0]);}
fs.writeFileSync(out+'.json',JSON.stringify(r));console.log(JSON.stringify({taps:r.taps,recT0:r.recT0,hero:r.hero,guide:r.guide,gameSecs:+r.gameSecs.toFixed(1),zone:r.zone,kills:r.kills,sr:r.sr,err:r.err,ncalls:r.ncalls,stats:r.stats}));console.log('calls',JSON.stringify(r.kinds));
for(const[k,v]of Object.entries(by).sort((a,b)=>b[1].length-a[1].length)){const gaps=v.slice(1).map((t,i)=>t-v[i]).sort((a,b)=>a-b);console.log(String(v.length).padStart(4),k,'minGap',gaps[0]??0,'med',gaps[gaps.length>>1]||0);}
console.log('maxActive',Math.max(...r.plays.map(x=>x[4]),0));await b.close();
