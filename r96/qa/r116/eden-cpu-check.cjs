// R116 CPU check: Dark-Eden-style painted skill clips (fx-eden-r108.js + fx-eden-data-r108.js + assets/r108/eden)
// hooked into the R106 D2S archetypes, growing with the R102 skill tier (plain at tier 0), presentation only.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../..'),R=p=>path.join(root,p);
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+detail));};
const src=fs.readFileSync(R('r96/client-source/fx-eden-r108.js'),'utf8'),dsrc=fs.readFileSync(R('r96/client-source/fx-eden-data-r108.js'),'utf8'),d2s=fs.readFileSync(R('r96/client-source/fx-d2s-r106.js'),'utf8');
for(const f of['fx-eden-r108.js','fx-eden-data-r108.js','fx-d2s-r106.js']){let ok=true,err='';try{new vm.Script(fs.readFileSync(R('r96/client-source/'+f),'utf8'));}catch(e){ok=false;err=String(e);}check(f+' parses',ok,err);
 check(f+' runtime copy identical',fs.readFileSync(R('r96/runtime-text/'+f),'utf8')===fs.readFileSync(R('r96/client-source/'+f),'utf8'));}
const html=fs.readFileSync(R('r96/runtime-text/index.html'),'utf8');
check('data loads before the overlay, both before audio-r98.js',/fx-eden-data-r108\.js"><\/script><script src="\.\/fx-eden-r108\.js"><\/script>[\s\S]*audio-r98\.js"><\/script>/.test(html));
const sb={window:{}};vm.createContext(sb);vm.runInContext(dsrc,sb);const D=sb.window.__STORYWORLD_EDEN_DATA_R108__;
const meta=JSON.parse(fs.readFileSync(R('r96/runtime-text/assets/r108/eden/meta.json'),'utf8'));
const bad=[];for(const[k,v]of Object.entries(D.sheets)){const p=R('r96/runtime-text/assets/r108/eden/'+k+'.webp');if(!fs.existsSync(p)){bad.push(k+' missing');continue;}const b=fs.readFileSync(p);if(crypto.createHash('sha256').update(b).digest('hex')!==(v.sha256||meta.sheets[k]?.sha256))bad.push(k+' hash');if(b.length>600000)bad.push(k+' size');}
check('12 painted atlases present with the recorded sha256, each under 600 kB',Object.keys(D.sheets).length===12&&!bad.length,bad.join(','));
check('every clip names a known sheet and a frame range inside its 16 cells',Object.values(D.clips).every(c=>D.sheets[c.s]&&c.a>=0&&c.b<=15&&c.a<=c.b));
check('D2S calls pre()/post() around each archetype and keeps its own drawing as the fallback',d2s.includes('if(!(ed&&ed.pre(e,u,h,dt)))DRAW[e.kind]?.(e,u,h,dt);if(ed)ed.post(e,u,h,dt);')&&d2s.includes("const EDEN=()=>{const x=window.__STORYWORLD_EDEN_R108__;return x&&x.pre&&x.on&&x.on()?x:null;};"));
check('growth-linked: tier 0 draws at 62% size and 60% light, full from tier 5, flares only from tier 3',src.includes('const TS=[.62,.7,.78,.86,.94,1,1,1],TL=[.6,.67,.74,.81,.88,.95,1,1]')&&src.includes("if(name==='flare'&&curTier<3)return true;")&&/curTier=e\.tier\|0;try\{const f=PRE/.test(src)&&/finally\{curTier=-1;\}/.test(src));
check('memory bounded: at most 6 atlases resident, idle ones released, lowFx loads only the hero\'s own sheets',src.includes('MAX_RESIDENT=6,IDLE_MS=20000')&&src.includes('if(lowFx()&&!isCore(n)&&!force)return null;'));
check('presentation only: no damage, hp, cooldown or save writes',!/\.(hp|damage|cd|cooldown|blinkCD|egoCD)\s*[-+*]?=[^=]/.test(src)&&!/saveGame\(/.test(src));
check('every hero archetype has a painted layer',['iai','orb','chain','fist','meteor','fissure','nova','multishot'].every(k=>new RegExp('(PRE|POST)\\.'+k+'=').test(src)));
console.log((failed?'FAIL ':'PASS ')+(n-failed)+'/'+n+' r116 eden checks');process.exit(failed?1:0);
