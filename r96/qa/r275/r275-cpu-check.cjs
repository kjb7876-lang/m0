// R275 — 몹·보스 전수 점검: ① 화면 밖 몹 drawEnemy 사슬 맨 바깥에서 건너뛰기(perf-r119 와 같은 조건) ② R208·R223 몹 스트립 파생본(배경 섬·밝은 테두리·잘린 단면).
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const src=C('mob-fix-r275.js');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
ok('runtime copy matches',RT('mob-fix-r275.js')===src);
const idx=RT('index.html'),at=s=>idx.indexOf(s);
ok('loads after every other drawEnemy wrapper (r248, r260, r259, r266) and before combat-r118 → outermost',at('"./mob-fix-r275.js"')>at('"./mob-preload-r260.js"')&&at('"./mob-fix-r275.js"')>at('"./hit-center-r259.js"')&&at('"./mob-fix-r275.js"')>at('"./mob-unique-r248.js"')&&at('"./mob-fix-r275.js"')>at('"./perf-groups-r266.js"')&&at('"./mob-fix-r275.js"')<at('"./combat-r118.js"')&&at('"./mob-fix-r275.js"')>0);
ok('no later overlay wraps drawEnemy',['combat-r118.js','world-tiles-r118.js'].every(f=>!/drawEnemy\s*=/.test(C(f))));
function make(store={}){const calls=[];let assets=new Set();const requested=[];
 const ctx={localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},console,Math,JSON,String,Array,Set,WeakSet,WeakMap,Object,Number,Promise,innerWidth:1280,innerHeight:504,W:1280,H:504};ctx.window=ctx;
 Object.assign(ctx,{project:(x,y)=>({x:x*100,y:y*100}),actorHeight:()=>54,room:{enemies:[]},readyImage:p=>assets.has(p)?{image:{naturalWidth:5}}:null,ensureImages:l=>{requested.push(...l);return Promise.resolve();},
  drawEnemy:e=>{calls.push(e.id);},draw:()=>{for(const e of ctx.room.enemies)ctx.drawEnemy(e);}});
 const mobs={};ctx.__STORYWORLD_STORY_MOBS_R208__={assign:e=>e.r208Mob?(mobs[e.r208Mob]??={id:e.r208Mob,path:e.p}):null};
 vm.createContext(ctx);vm.runInContext(src,ctx);return {ctx,calls,assets,requested,mobs,store};}
{const t=make();const E=[{id:'on',hp:5,x:6,y:2},{id:'far',hp:5,x:40,y:2},{id:'farUp',hp:5,x:6,y:-20},{id:'boss',hp:5,x:40,y:2,boss:true},{id:'mid',hp:5,x:40,y:2,name:'중간보스 · 진흙등 거미'},
  {id:'atk',hp:5,x:40,y:2,attack:{elapsed:.1}},{id:'wind',hp:5,x:40,y:2,rangedWindup:.3},{id:'dead',hp:0,x:40,y:2},{id:'edge',hp:5,x:13.5,y:2}];t.ctx.room.enemies.push(...E);
 t.ctx.draw();ok('off-screen ordinary mobs are skipped before any inner layer runs',!t.calls.includes('far')&&!t.calls.includes('farUp'),t.calls);
 ok('on-screen and inside the margin (body height×2+40px) are drawn',t.calls.includes('on')&&t.calls.includes('edge'),t.calls);
 ok('boss, midboss (name), attacking, ranged wind-up and dying mobs are always drawn (same exceptions as perf-r119)',['boss','mid','atk','wind','dead'].every(k=>t.calls.includes(k)),t.calls);
 t.calls.length=0;t.ctx.drawEnemy(E[1]);ok('outside a frame (tests, thumbnails) nothing is skipped',t.calls.includes('far'));
 const s=t.ctx.__STORYWORLD_MOB_FIX_R275__.inspect().stats;ok('counts culled/drawn (7 in the frame + 1 outside it)',s.culled===2&&s.drawn===8,s);
 t.ctx.__STORYWORLD_MOB_FIX_R275__.set({cull:false});t.calls.length=0;t.ctx.draw();ok('{"cull":false} draws everything',t.calls.length===E.length);
 t.ctx.__STORYWORLD_MOB_FIX_R275__.set({cull:true,on:false});t.calls.length=0;t.ctx.draw();ok('{"on":false} draws everything',t.calls.length===E.length);
 ok('off switch stored under storyworld.r275.mobfix',JSON.parse(t.store['storyworld.r275.mobfix']).on===false);}
{const store={'storyworld.hospital-three-pc.maze.v11:r119.perf':JSON.stringify({cull:false})};const t=make(store);t.ctx.room.enemies.push({id:'far',hp:5,x:40,y:2});t.ctx.draw();ok('respects the player-facing perf-r119 cull setting (off there = off here)',t.calls.includes('far'));}
// ② art
const ART=vm.runInNewContext('('+src.match(/const ART=Object\.freeze\((\{[\s\S]*?\})\);/)[1]+')');
const site=path.join(R,'runtime-text'),index=JSON.parse(fs.readFileSync(path.join(site,'assets/r275/mobs/index.json'),'utf8'));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(site,f))).digest('hex');
ok('every derived sheet is listed in assets/r275/mobs/index.json with its source, and the overlay table matches it',index.sheets.length===Object.keys(ART).length&&index.sheets.every(r=>ART[r.from]===r.path),index.sheets.map(r=>r.from));
ok('sources untouched: source sha256 still equals the recorded one, derived files match index sha256',index.sheets.every(r=>sha(r.from)===r.fromSha256&&sha(r.path)===r.sha256));
ok('each row records the fixes applied',index.sheets.every(r=>Array.isArray(r.fix)&&r.fix.length>0));
const dims=f=>{const b=fs.readFileSync(path.join(site,f));const i=b.indexOf('VP8L');if(i>0){const v=b.readUInt32LE(i+9);return[(v&0x3fff)+1,((v>>14)&0x3fff)+1];}const j=b.indexOf('VP8X');if(j>0)return[1+b.readUIntLE(j+12,3),1+b.readUIntLE(j+15,3)];const k=b.indexOf('VP8 ');return[b.readUInt16LE(k+14)&0x3fff,b.readUInt16LE(k+16)&0x3fff];};
ok('same pixel size as the source (same cells and pivots → only the path changes)',index.sheets.every(r=>{const a=dims(r.from),b=dims(r.path);return a[0]===b[0]&&a[1]===b[1];}),index.sheets.map(r=>[r.from,dims(r.from),dims(r.path)]));
{const t=make();const from=Object.keys(ART)[4],to=ART[from];const e={id:'h',hp:5,x:6,y:2,r208Mob:'ember-hound',p:from};t.ctx.room.enemies.push(e);
 t.ctx.draw();ok('derived art requested first; path is not switched before it is loaded (no size pop)',t.requested.includes(to)&&t.mobs['ember-hound'].path===from);
 t.assets.add(to);t.ctx.draw();ok('switched once loaded',t.mobs['ember-hound'].path===to);
 t.ctx.__STORYWORLD_MOB_FIX_R275__.set({art:false});ok('{"art":false} restores the original path',t.mobs['ember-hound'].path===from);}
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax',false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail).slice(0,600)));
console.log(`R275 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
