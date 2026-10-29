// R104 CPU check: the boss key-pose data references real frames with sane pivots,
// the overlay installs onto a stub runtime, and a frame answers with the new art
// only while its own boss is drawn (logic and other enemies keep the original).
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..'),SRC=path.join(R,'client-source'),ASSET=path.join(R,'runtime-text');
const checks=[];const check=(name,ok,detail='')=>{checks.push({name,passed:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(detail?' — '+detail:''));};
const ctx={window:{},localStorage:{getItem:()=>null,setItem(){}},console};ctx.window=ctx;
vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(SRC,'bosses-r104-data.js'),'utf8'),ctx);
const DATA=ctx.__STORYWORLD_BOSS_KEYPOSES_R104_DATA__;
// R119 added the Drive 2026-10-29 pride cyborg cult leader (c104-boss) set.
check('45 key-pose sets (R104 44 + R119 c104-boss)',Object.keys(DATA).length===45&&DATA['c104-boss']?.frames.length===4,String(Object.keys(DATA).length));
check('R105 Chapter6/7 ids present',['mb-hando01','mb-hando02','mb-hando03','h103-boss','mb-murder01','mb-murder02','mb-murder03','murder04-mid'].every(id=>DATA[id]&&DATA[id].frames.length===4));
const webpSize=b=>{// VP8X canvas size, else VP8/VP8L
 const t=b.toString('ascii',12,16);if(t==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(t==='VP8L'){const v=b.readUInt32LE(21);return[1+(v&0x3fff),1+((v>>14)&0x3fff)];}return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];};
let missing=[],bad=[];
for(const [id,d] of Object.entries(DATA)){
 if(d.frames.length!==4)bad.push(id+':frames');
 for(const f of d.frames){const p=path.join(ASSET,f.path);if(!fs.existsSync(p)){missing.push(f.path);continue;}const [w,h]=webpSize(fs.readFileSync(p));if(w!==f.w||h!==f.h)bad.push(f.path+' size '+w+'x'+h);}
 const f=d.frames[3];if(!(d.pivot[0]>0&&d.pivot[0]<f.w&&d.pivot[1]>0&&d.pivot[1]<=f.h&&d.visibleHeight>100&&d.visibleHeight<=f.h))bad.push(id+':pivot');
}
check('every frame file exists',!missing.length,missing.slice(0,3).join(','));
check('frame sizes and pivots match the data',!bad.length,bad.slice(0,3).join(','));
// stub runtime
const loaded=new Set(Object.values(DATA).flatMap(d=>d.frames.map(f=>f.path)));
const oldFrame={path:'assets/old/mb-dist03.png',assetFrame:{sourceRect:[0,0,10,10],pivot:[5,10],visibleHeight:10},extraLayers150:[{path:'x'}]};
Object.assign(ctx,{portable:{majorNativePresentation150:{'mb-dist03':{poses:{idle:oldFrame,strike:{...oldFrame}}}}},regionById:{dist03:{bosses:[],midboss:{id:'mb-dist03'}}},readyImage:p=>loaded.has(p)?{image:{}}:null,addImage(){},drawn:[]});
vm.runInContext('var portable=globalThis.portable,regionById=globalThis.regionById,readyImage=globalThis.readyImage,addImage=globalThis.addImage;var drawEnemy=function(e){const f=portable.majorNativePresentation150["mb-dist03"].poses;drawn.push([e.nativeId,f.idle.path,f.strike.path,f.idle.extraLayers150]);};',ctx);
vm.runInContext(fs.readFileSync(path.join(SRC,'bosses-r104.js'),'utf8'),ctx);
const K=ctx.__STORYWORLD_BOSS_KEYPOSES_R104__;
check('overlay installs',K&&K.inspect().installed&&K.inspect().stats.failures===0,JSON.stringify(K&&K.inspect().stats));
check('logic reads the original frame',oldFrame.path==='assets/old/mb-dist03.png'&&oldFrame.extraLayers150?.length===1);
vm.runInContext('drawEnemy({nativeId:"mb-dist03",profile:{}});drawEnemy({nativeId:"mb-dist04",profile:{}});drawEnemy({nativeId:"mb-dist03",samongR103:"x",profile:{}});',ctx);
const [a,b]=ctx.drawn;
check('own draw shows recovery idle and strike poses',a[1]==='assets/r104/bosses/mb-dist03-p4.webp'&&a[2]==='assets/r104/bosses/mb-dist03-p2.webp'&&a[3]===undefined,JSON.stringify(a));
check('another enemy\'s draw keeps the original',b[1]==='assets/old/mb-dist03.png',JSON.stringify(b));
check('after drawing, logic reads the original again',oldFrame.path==='assets/old/mb-dist03.png');
const phaseOk=Object.keys(K.phases).every(id=>DATA[id]);
check('every phase-limited id has data',phaseOk);
const out={revision:'r104-bosses-cpu',checks,passed:checks.every(c=>c.passed)};
fs.writeFileSync(path.join(__dirname,'bosses-cpu-results.json'),JSON.stringify(out,null,1));
if(!out.passed){console.log('FAILED');process.exit(1);}console.log('ALL PASS',checks.length);
