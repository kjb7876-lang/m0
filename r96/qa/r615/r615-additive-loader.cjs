const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../../client-source/asset-cdn-r615.js'),'utf8');
const host='https://storyworld-m0-assets.pages.dev/', schema='storyworld-asset-cdn/v1';
const legacy='assets/r381/voice/a.mp3', title='assets/r667/title-video/clip.mp4';
const music='assets/audio/bgm/classical/moonlight.mp3',glb='assets/r1305/seoha-3d.glb';
function env(search=''){
 const requests=[],timer=new Map();let next=0;
 const window={location:{search},fetch:(url,opts)=>new Promise((resolve,reject)=>requests.push({url,opts,resolve,reject}))};
 vm.runInNewContext(source,{window,URLSearchParams,AbortController,setTimeout(f,t){timer.set(++next,{f,t});return next},clearTimeout(id){timer.delete(id)}});
 return {A:window.__STORYWORLD_ASSET_CDN__,requests,timer,tick(delay){const x=[...timer.entries()].find(([,q])=>q.t===delay);assert.ok(x);timer.delete(x[0]);x[1].f();}};
}
const good={schema,prefixes:['assets/r381/voice/','assets/r667/title-video/','assets/audio/bgm/classical/','assets/r1305/'],additiveVerification:{policy:'additive-only',sha256:'e'.repeat(64),files:13}};
const yieldTasks=()=>new Promise(r=>setImmediate(r));
const resolve=(v,i,body)=>v.requests[i].resolve({ok:true,json:()=>Promise.resolve(body)});
(async()=>{
 const v=env();
 assert.equal(v.requests.length,1);assert.equal(v.requests[0].url,host+'cdn-health.json');
 assert.equal(v.A.inspect().state,'pending');
 for(const p of [legacy,title,music,glb])assert.equal(v.A.url(p),p);
 resolve(v,0,good);assert.equal(await v.A.ready,true);
 assert.equal(v.A.url(legacy),host+legacy);assert.equal(v.A.url(title),host+title);
 // Even a healthy report advertising additional prefixes cannot opt users into the coverage-only cohort.
 assert.equal(v.A.url(music),music);assert.equal(v.A.url(glb),glb);
 assert.equal(v.A.local(host+legacy),legacy);
 for(let i=0;i<3;i++)v.A.fail(host+legacy,'object unavailable');
 assert.equal(v.A.inspect().state,'down');assert.equal(v.A.url(legacy),legacy);assert.equal(v.A.url(music),music);
 v.tick(15000);resolve(v,1,{...good,schema:'storyworld-asset-cdn/v0'});await yieldTasks();
 assert.equal(v.A.inspect().state,'down');
 v.tick(30000);resolve(v,2,good);await yieldTasks();assert.equal(v.A.inspect().state,'on');
 assert.equal(v.A.url(legacy),host+legacy);assert.equal(v.A.url(music),music);
 const timeout=env();timeout.tick(4000);assert.equal(await timeout.A.ready,false);assert.equal(timeout.A.url(legacy),legacy);
 assert.equal(timeout.requests[0].opts.signal.aborted,true);
 const off=env('?cdn=off');assert.equal(off.requests.length,0);assert.equal(off.A.url(music),music);
 console.log('exact existing loader: pending, healthy, wrong schema, failed object threshold, retries, recovered, timeout/abort, off, additive always local PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
