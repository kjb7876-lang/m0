// R109 CPU check: mobs-r109.js — mobs move by swapping several drawn frames (R92 strips in story and dream layers,
// Drive 2026-10-27 four-key strips for M002/M003/M007/M008/M019) and no longer squash, stretch, lean or bob.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,300)));};
const r92=JSON.parse(fs.readFileSync(path.join(RT,'assets/r92/mobs/index.json'),'utf8'));
const r109=JSON.parse(fs.readFileSync(path.join(RT,'assets/r109/mobs/index.json'),'utf8'));
// assets: every strip exists, matches its recorded hash and is a PNG of 4 cells
for(const t of r109.tracks){const p=path.join(RT,t.path),b=fs.existsSync(p)?fs.readFileSync(p):null;
 const w=b?b.readUInt32BE(16):0,h=b?b.readUInt32BE(20):0;
 check(t.group+' strip exists with recorded sha256',!!b&&crypto.createHash('sha256').update(b).digest('hex')===t.sha256);
 check(t.group+' strip is 4 cells of the recorded size',w===t.cell[0]*4&&h===t.cell[1]&&t.frames===4,[w,h,t.cell]);
 check(t.group+' keeps Drive provenance (zip id, zip/png sha)',/^[0-9a-f]{64}$/.test(t.source?.zipSha256||'')&&/^[0-9a-f]{64}$/.test(t.source?.pngSha256||'')&&!!t.source?.driveZipId);
 check(t.group+' pivot inside its cell',t.pivot[0]>0&&t.pivot[0]<t.cell[0]&&t.pivot[1]>t.cell[1]*.8&&t.pivot[1]<=t.cell[1]);}
check('five Drive groups processed',['M002','M003','M007','M008','M019'].every(g=>r109.tracks.some(t=>t.group===g)));

// sandbox
const imgs=new Set();
const R52={applyBodyPose:(c,hero)=>{c.ops.push(['native',hero]);return{native:true};},hasMotion:()=>'native',tickEnemy(){}};
const sb={console,Math,JSON,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Error,Promise,performance:{now:()=>0},
 localStorage:{getItem:()=>null,setItem(){}},time:1,zone:'dist05',layer:'STORY',settings:{},player:{x:0,y:0},room:{enemies:[]},
 actorHeight:()=>100,readyImage:p=>imgs.has(p)?{image:{}}:null,addImage:p=>imgs.add(p),Z:()=>1,
 __STORYWORLD_HOSPITAL_CHARGE_R52__:R52,__STORYWORLD_POLISH_R100__:{artOf:e=>e.winged?{fly:true}:null},
 fetch:u=>Promise.resolve({ok:true,json:()=>Promise.resolve(u.includes('r92')?r92:r109)})};
sb.window=sb;const drawn=[];
sb.drawEnemy=function(e){drawn.push({frames:e.profile.frames,lift:e.visualLiftPx});const c={ops:[],translate(x,y){this.ops.push(['t',x,y]);},rotate(a){this.ops.push(['r',a]);},scale(x,y){this.ops.push(['s',x,y]);}};
 drawn[drawn.length-1].pose=sb.__STORYWORLD_HOSPITAL_CHARGE_R52__.applyBodyPose(c,false);drawn[drawn.length-1].ops=c.ops;return 'base';};
vm.createContext(sb);vm.runInContext(fs.readFileSync(path.join(SRC,'mobs-r109.js'),'utf8'),sb,{filename:'mobs-r109.js'});
const M=sb.__STORYWORLD_MOBS_R109__;
check('overlay installs',!!M&&/^R1(09|10)-mobs-/.test(M.revision));
const idle={path:'idle.png',assetFrame:{sourceRect:[0,0,10,10],pivot:[5,10]}};
const mk=(id,o={})=>({id:'e'+id+Math.random(),nativeId:id,hp:10,x:3,y:0,profile:{frames:{idle,move:idle,attack:idle,windup:idle}},combatProfile:{attackShape:{windup:.4,active:.2}},...o});
(async()=>{
 sb.drawEnemy(mk('dist05-m1'));await new Promise(r=>setTimeout(r,20));sb.drawEnemy(mk('dist05-m1'));
 check('indexes load (R92 + R109)',M.inspect().state==='ready'&&M.inspect().ids>=140,JSON.stringify(M.inspect()));
 const mage=mk('dist05-m1',{moving:true});sb.room.enemies=[mage];sb.zone='dist05-reenter';sb.drawEnemy(mage);sb.zone='dist05';
 check('needed strips are requested',imgs.has('assets/r109/mobs/M003-move.png'));
 for(const p of [...imgs])imgs.add(p);for(const t of r109.tracks)imgs.add(t.path);for(const g of Object.values(r92.groups))for(const t of Object.values(g.tracks))imgs.add(t.path);
 const seen=new Set();for(let i=0;i<8;i++){sb.time=1+i/6.5;drawn.length=0;sb.drawEnemy(mage);seen.add(drawn[0].frames.move.assetFrame.sourceRect[0]);}
 check('walking mage cycles four different R109 move cells',seen.size===4,[...seen]);
 check('profile is restored after the draw',mage.profile.frames.move===idle);
 drawn.length=0;sb.drawEnemy(mk('dist05-m1',{moving:false}));check('standing walker keeps its idle picture',drawn[0].frames.idle===idle&&drawn[0].frames.move===idle);
 // attack: R92 attack strip across windup → strike → follow-through
 const atk=mk('dist05-m1',{attack:{elapsed:.05}});const cells=[];for(const t of [.05,.3,.5,.65]){atk.attack.elapsed=t;drawn.length=0;sb.drawEnemy(atk);const f=drawn[0].frames;cells.push((f.attack!==idle?f.attack:f.move).assetFrame.sourceRect[0]);}
 check('attack walks through the R92 attack strip',new Set(cells).size>=3&&drawn[0].frames.move.path.includes('M003-attack'),cells);
 // dream layer (samong) now uses the R92 strips too
 sb.layer='DREAM';drawn.length=0;sb.drawEnemy(mk('dist04-s1',{moving:true}));check('dream layer uses R92 move strip',String(drawn[0].frames.move.path).includes('M001-move'));sb.layer='STORY';
 // flyers cycle while standing, hover small
 const gar=mk('dist05-c1',{moving:false}),hs=new Set(),lifts=[];for(let i=0;i<12;i++){sb.time=2+i/3;drawn.length=0;sb.drawEnemy(gar);hs.add(drawn[0].frames.idle.assetFrame.sourceRect[0]);lifts.push(drawn[0].lift);}
 check('standing gargoyle keeps beating its wings (frame swap)',hs.size>=3,[...hs]);
 const amp=(Math.max(...lifts)-Math.min(...lifts))/2/100;check('flyer hover amplitude ≤ 1.5% of body height',amp>0&&amp<=.015,amp);
 check('hover lift is restored after the draw',!('visualLiftPx' in gar));
 // calm pose: never scale/rotate a mob
 const all=[];for(const o of [{moving:true},{attack:{elapsed:.5}},{hitTimer:.1},{}]){drawn.length=0;sb.player={x:0,y:0};sb.drawEnemy(mk('dist02-h9',o));all.push(drawn[0]);}
 check('no scale or rotate on mobs (walk, attack, hit, idle)',all.every(d=>d.ops.every(o=>o[0]==='t')&&d.pose.scaleY===1&&d.pose.shear===0),JSON.stringify(all.map(d=>d.ops)));
 const hit=all[2].ops.find(o=>o[0]==='t');check('hit nudge is a rigid shift of at most 4px',!hit||Math.abs(hit[1])<=4.01,hit);
 const lunge=all[1].ops.find(o=>o[0]==='t');check('attack without attack frames is a short rigid step',!!lunge&&Math.abs(lunge[1])<=4.01,lunge);
 drawn.length=0;sb.drawEnemy(mk('boss-x',{boss:true,moving:true}));check('bosses keep the earlier pose chain',drawn[0].ops.some(o=>o[0]==='native'));
 sb.zone='ep1a08';drawn.length=0;sb.drawEnemy(mk('a08-o1',{moving:true}));check('hospital keeps its authored poses',drawn[0].ops.some(o=>o[0]==='native')&&drawn[0].frames.move===idle);sb.zone='dist05';
 drawn.length=0;sb.drawEnemy(mk('dist05-m1',{moving:true,r74Monster:'root'}));check('R74 world monsters keep their atlas',drawn[0].frames.move===idle);
 check('no failures',M.inspect().failures===0,M.inspect().lastError);
 // wiring
 const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');const iM=html.indexOf('<script src="./mobs-r109.js"></script>'),iP=html.indexOf('<script src="./play-r106.js"></script>'),iA=html.indexOf('<script src="./audio-r98.js"></script>');
 check('script tag after play-r106 and before audio-r98',iM>iP&&iM<iA&&iP>0);
 const sam=fs.readFileSync(path.join(SRC,'samong-r103.js'),'utf8');
 check('S-01 uses the faceless specter instead of the false-heaven angel knight',sam.includes("mobs:[['ep1a10','a10-s1'],['last302','l302-e1']]"));
 check('survival and maze alternate both mob rows',!sam.includes('ep.mobs[(S.serial+n)%ep.mobs.length]')&&(sam.match(/ep\.mobs\[S\.serial%ep\.mobs\.length\]/g)||[]).length===2);
 console.log(`\n${n-failed}/${n} passed`);process.exit(failed?1:0);})().catch(e=>{console.log('FAIL crashed',e);process.exit(1);});
