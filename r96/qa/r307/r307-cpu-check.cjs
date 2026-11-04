// R307 CPU check: CC0 sound effects — licenses, credits, size cap, event map, off switch, registration.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
const R=path.resolve(__dirname,'..','..'),RT=p=>path.join(R,'runtime-text',p),read=p=>fs.readFileSync(path.join(R,p),'utf8');
const checks=[];const ok=(name,v)=>{assert.ok(v,name);checks.push(name);};
const src=read('client-source/sfx-r307.js'),DIR='assets/r307/sfx/',idx=JSON.parse(fs.readFileSync(RT(DIR+'index.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');

// ---- licenses / credits / size ----
ok('every file is CC0 or CC-BY (no NC/ND/SA/unknown)',idx.files.length>=15&&idx.files.every(f=>['CC0','CC-BY 3.0','CC-BY 4.0'].includes(f.license)));
ok('every file names author, source URL, license URL, license file and original sha256',idx.files.every(f=>f.author&&/^https:\/\/opengameart\.org\/content\//.test(f.source)&&/creativecommons\.org/.test(f.licenseUrl)&&fs.existsSync(RT(DIR+f.licenseFile))&&/^[0-9a-f]{64}$/.test(f.originalSha256)&&f.originalBytes>0));
const credits=fs.readFileSync(RT(DIR+'SFX_CREDITS.md'),'utf8');
ok('credits list every source and author',idx.files.every(f=>credits.includes(f.source)&&credits.includes(f.author)));
ok('CC-BY files (if any) are credited by name',idx.files.filter(f=>f.license.startsWith('CC-BY')).every(f=>credits.includes(f.author)));
let total=0;for(const f of idx.files){const b=fs.readFileSync(RT(DIR+f.file));total+=b.length;assert.equal(sha(b),f.sha256,f.file);assert.equal(b.length,f.bytes,f.file);assert.ok(b.slice(0,4).toString()==='OggS',f.file);}
ok('file bytes and sha256 match index.json; all are Ogg',true);
ok('total under 3,000,000 bytes and each under 96KB',total<=3e6&&total===idx.totalBytes&&idx.files.every(f=>f.bytes<96*1024));
ok('no runtime API / external URL in overlay',!/https?:\/\//.test(src.replace(/^\/\/.*$/gm,''))&&!/freesound|apikey|api_key/i.test(src));

// ---- VM: event map, hooks, off switch, cap ----
function boot(store={}){
 const played=[],calls={death:0,complete:0,sound:[],close:0,tick:0};
 class Node{connect(){}disconnect(){}}
 class Ctx{constructor(){this.state='running';this.destination=new Node();}createGain(){const g=new Node();g.gain={value:1};return g;}createBufferSource(){const s=new Node();s.start=()=>played.push(s);s.stop=()=>{s.stopped=true;};return s;}decodeAudioData(a,ok){ok({duration:.5,src:a.name});}}
 const listeners={};
 const c={console,performance:{now:()=>Date.now()},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},
  document:{hidden:false,addEventListener:(t,f)=>{listeners[t]=f;},querySelector:()=>null,getElementById:()=>null},
  fetch:async u=>({ok:true,arrayBuffer:async()=>({name:u}),json:async()=>idx})};
 c.window=c;vm.createContext(c);
 c.__Ctx=Ctx;vm.runInContext(`let audioContext=new __Ctx(),masterGain=audioContext.createGain(),audioUnlocked=true,settings={sound:true,volume:.8},modal=false,soundProfiles={pickup:[]};
  let room={id:'r1',layer:'STORY',enemies:[{hp:5},{hp:3}]};
  function showDeath(){__c.death++;} function completeRegion(){__c.complete++;} function sound(k){__c.sound.push(k);} function closePanel(){__c.close++;} function tick(){__c.tick++;room.enemies=room.enemies.filter(e=>e.hp>0);} function showSettings(){}`,Object.assign(c,{__c:calls}));
 c.__STORYWORLD_WORLD_R74__={openedFor:()=>c.__doors||[]};c.__STORYWORLD_PLAY_R169__={book:()=>c.__book||[]};
 vm.runInContext(src,c,{filename:'sfx-r307.js'});
 return {c,played,calls,listeners,run:s=>vm.runInContext(s,c),api:c.__STORYWORLD_SFX_R307__,flush:()=>new Promise(r=>setTimeout(r,5))};
}
(async()=>{
 const t=boot(),A=t.api;
 const files=new Set(idx.files.map(f=>f.id));
 ok('event map: 9 events, each file exists in index.json, every applied file is used',Object.keys(A.EVENTS).length===9&&Object.values(A.EVENTS).every(e=>e.files.every(f=>files.has(f)))&&idx.files.filter(f=>f.applied).every(f=>Object.values(A.EVENTS).some(e=>e.files.includes(f.id))&&f.event in A.EVENTS));
 ok('hooks wrap showDeath, completeRegion, sound, closePanel, tick, showSettings',['showDeath','completeRegion','sound','closePanel','tick','showSettings'].every(k=>A.inspect().hooked[k]===true));
 t.run('showDeath();completeRegion();sound("pickup");sound("attack");tick();');await t.flush();
 ok('wrapped originals still run',t.calls.death===1&&t.calls.complete===1&&t.calls.sound.join()==='pickup,attack'&&t.calls.tick===1);
 const ev=A.inspect().stats.byEvent;
 ok('death→playerDeath (both layers), region complete→altar, empty pickup→pickup',ev.playerDeath.played===2&&ev.altar.played===1&&ev.pickup.played===1);
 t.c.__doors=['d0'];t.c.__book=[1];t.run('room.enemies[0].hp=0;tick();');await t.flush();
 const ev2=A.inspect().stats.byEvent;
 ok('door opened→door, new note→page, enemy hp to 0→enemyDeath (even when the engine drops it inside tick)',ev2.door?.played===1&&ev2.page?.played===1&&ev2.enemyDeath?.played===1);
 t.run('closePanel();');await t.flush();ok('note closed→pageClose',A.inspect().stats.byEvent.pageClose?.played===1);
 ok('concurrent playback capped at 3',A.MAX===3&&A.inspect().stats.capped>0&&A.inspect().active<=3);
 const t2=boot();t2.run('audioUnlocked=false;');await t2.api.play('door');ok('nothing plays before audio unlock (mobile first gesture)',t2.played.length===0);
 t2.run('audioUnlocked=true;settings.sound=false;');await t2.api.play('door');ok('respects existing sound switch',t2.played.length===0);
 t2.run('settings.sound=true;modal=true;');await t2.api.play('door');await t2.api.play('ui');ok('world sounds wait while a modal is open, UI clicks do not',t2.played.length===1);
 const store={};const t3=boot(store);t3.api.set(false);await t3.api.play('ui');ok('settings off switch stops playback and persists',t3.played.length===0&&JSON.parse(store['storyworld.r307.sfx']).on===false&&boot(store).api.inspect().prefs.on===false);
 ok('click on a close button→uiBack, other button→ui',(()=>{const t4=boot();t4.listeners.click({target:{closest:()=>({id:'x',textContent:'닫기'})}});t4.listeners.click({target:{closest:()=>({id:'y',textContent:'확인'})}});const b=t4.api.inspect().stats.byEvent;return b.uiBack.requested===1&&b.ui.requested===1;})());

 // ---- registration ----
 const html=read('runtime-text/index.html');
 ok('script tag once, right before mobile-perf-r298 and before combat-r118',html.split('"./sfx-r307.js"').length===2&&/<script src="\.\/sfx-r307\.js"><\/script>(<script src="\.\/[a-z0-9-]+\.js"><\/script>)*?<script src="\.\/mobile-perf-r298\.js">/.test(html)&&html.indexOf('"./sfx-r307.js"')<html.indexOf('"./combat-r118.js"'));
 ok('runtime copy equals client source',read('runtime-text/sfx-r307.js')===src);
 const verify=read('../scripts/verify-r96-public.py');ok('public verify lists sfx-r307.js and assets/r307/',verify.includes("'sfx-r307.js'")&&verify.includes("'assets/r307/'"));
 ok('pages.yml runs this check',read('../.github/workflows/pages.yml').includes('r96/qa/r307/r307-cpu-check.cjs'));
 const inputs=JSON.parse(read('runtime-inputs.json')),man=JSON.parse(read('runtime-manifest.json')),rows=new Map(man.files.map(r=>[r.path,r]));
 ok('manifest/inputs carry the overlay and every asset with matching sha256',['sfx-r307.js',...idx.files.map(f=>DIR+f.file),DIR+'index.json',DIR+'SFX_CREDITS.md'].every(p=>inputs.textPaths.includes(p)&&rows.get(p)?.sha256===sha(fs.readFileSync(RT(p)))));
 console.log(JSON.stringify({ok:true,checks:checks.length,totalBytes:total,files:idx.files.length,method:'CPU VM with mocked WebAudio; listening not verified'}));
})().catch(e=>{console.error(e);process.exit(1);});
