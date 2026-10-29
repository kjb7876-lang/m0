// R116 CPU check: Drive 2026-10-28 '적용본 · 게임 반영 전' mob strips — hit/recovery 4 keys (29 groups) and idle 4 keys (11 groups)
// layered onto the R92/R109 rows: a hit plays the four hit cells once, a standing walker cycles idle, move/attack stay as before.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,300)));};
const r92=JSON.parse(fs.readFileSync(path.join(RT,'assets/r92/mobs/index.json'),'utf8'));
const r109=JSON.parse(fs.readFileSync(path.join(RT,'assets/r109/mobs/index.json'),'utf8'));
const r116=JSON.parse(fs.readFileSync(path.join(RT,'assets/r116/mobs/index.json'),'utf8'));
const pngSize=b=>[b.readUInt32BE(16),b.readUInt32BE(20)];
// R119 added the Drive 2026-10-29 bundles (M011/M045/M046/M069 hit, M005/M041 idle) to the same index.
check('59 Drive tracks (43 hit, 16 idle; R116 41 + R119 6 + R122 12)',r116.tracks.length===59&&r116.tracks.filter(t=>t.track==='hit').length===43&&r116.tracks.filter(t=>t.track==='idle').length===16);
let bad=[];for(const t of r116.tracks){const p=path.join(RT,t.path),b=fs.existsSync(p)?fs.readFileSync(p):null;
 if(!b||crypto.createHash('sha256').update(b).digest('hex')!==t.sha256)bad.push(t.group+t.track+':sha');
 else{const [w,h]=pngSize(b);if(w!==t.cell[0]*4||h!==t.cell[1]||t.frames!==4)bad.push(t.group+t.track+':size');}
 if(!(t.pivot[0]>0&&t.pivot[0]<t.cell[0]&&t.pivot[1]>t.cell[1]*.8&&t.pivot[1]<=t.cell[1]))bad.push(t.group+t.track+':pivot');
 if(!(t.ids.length&&t.source.frames.length===4&&t.source.frames.every(f=>/^[0-9a-f]{64}$/.test(f.sha256))&&t.source.zips.every(z=>/^[0-9a-f]{64}$/.test(z.sha256))))bad.push(t.group+t.track+':provenance');}
check('every strip: recorded sha, 4 cells, pivot at the feet, Drive provenance, mapped ids',bad.length===0,bad);
const total=r116.tracks.reduce((a,t)=>a+t.bytes,0);check('strips stay small for mobile (< 12 MB total, < 400 kB each; R122 몹 동작 추가로 상한 12MB)',total<12e6&&r116.tracks.every(t=>t.bytes<4e5),total);
const imgs=new Set();
const R52={applyBodyPose:()=>({native:true}),hasMotion:()=>'native',tickEnemy(){}};
const sb={console,Math,JSON,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Error,Promise,performance:{now:()=>0},
 localStorage:{getItem:()=>null,setItem(){}},time:1,zone:'samong-x',layer:'DREAM',settings:{},player:{x:0,y:0},room:{enemies:[]},
 actorHeight:()=>100,readyImage:p=>imgs.has(p)?{image:{}}:null,addImage:p=>imgs.add(p),Z:()=>1,__STORYWORLD_HOSPITAL_CHARGE_R52__:R52,__STORYWORLD_ENEMY_MOTION_R51__:{flip:()=>'native'},project:(x,y)=>({x:(x-y)*34,y:(x+y)*17}),
 fetch:u=>Promise.resolve({ok:true,json:()=>Promise.resolve(u.includes('r92')?r92:u.includes('r116')?r116:r109)})};
sb.window=sb;const drawn=[];sb.drawEnemy=function(e){drawn.push(e.profile.frames);return 'base';};
vm.createContext(sb);vm.runInContext(fs.readFileSync(path.join(SRC,'mobs-r109.js'),'utf8'),sb,{filename:'mobs-r109.js'});
const M=sb.__STORYWORLD_MOBS_R109__;
check('overlay revision R116',M?.revision==='R116-mobs-3');
const still={path:'still.png',assetFrame:{sourceRect:[0,0,10,10],pivot:[5,10]}};
const mk=(id,o={})=>({id:'e'+id+Math.random(),nativeId:id,hp:10,x:3,y:0,profile:{frames:{idle:still,move:still,attack:still,windup:still}},combatProfile:{attackShape:{windup:.4,active:.2}},...o});
const cellOf=f=>f.assetFrame.sourceRect[0]/(f.assetFrame.sourceRect[2]||1);
(async()=>{sb.drawEnemy(mk('x'));await new Promise(r=>setTimeout(r,20));
 check('three indexes load',M.inspect().state==='ready'&&M.inspect().r116Tracks===59,JSON.stringify(M.inspect()));
 for(const t of [...r109.tracks,...r116.tracks])imgs.add(t.path);for(const g of Object.values(r92.groups||{}))for(const t of Object.values(g.tracks||{}))if(t?.path)imgs.add(t.path);
 const tr=M.trackFor(mk('dist05-m1'));check('M003 mage keeps its move/attack and gains hit + idle',!!tr?.move&&!!tr?.attack&&tr.hit?.path.endsWith('M003-hit.png')&&tr.idle?.path.endsWith('M003-idle.png'),JSON.stringify(tr));
 // hit: four cells once across 0.36 s, then hold the last cell
 const m=mk('dist05-m1',{hitTimer:.5}),seq=[];for(let i=0;i<8;i++){sb.time=10+i*.06;m.hitTimer=.5-i*.06;drawn.length=0;sb.drawEnemy(m);seq.push(cellOf(drawn[0].idle));}
 check('hit plays 0→3 once then holds the last cell',seq.join()==='0,0,1,2,2,3,3,3'||(seq[0]===0&&seq.slice(-3).every(c=>c===3)&&new Set(seq).size===4),seq);
 check('hit cell comes from the hit strip and covers idle and move',drawn[0].idle.path.endsWith('M003-hit.png')&&drawn[0].idle===drawn[0].move);
 sb.time=10.5;m.hitTimer=.6;drawn.length=0;sb.drawEnemy(m);check('a new hit (timer jumps up) restarts at cell 0',cellOf(drawn[0].idle)===0);
 const atk=mk('dist05-m1',{hitTimer:.3,attack:{elapsed:.45}});drawn.length=0;sb.drawEnemy(atk);check('attacking mob keeps the attack strip while hit',String(drawn[0].attack.path).includes('attack'));
 const noHit=mk('dist05-s9',{hitTimer:.3,moving:true});drawn.length=0;sb.drawEnemy(noHit);check('mob without a hit strip keeps the native hit draw',drawn[0].move===still);
 // standing walker cycles idle; moving one uses move
 const st=mk('dist05-m1',{moving:false}),c=new Set();for(let i=0;i<10;i++){sb.time=20+i/3.4;drawn.length=0;sb.drawEnemy(st);c.add(cellOf(drawn[0].idle));}
 check('standing mage cycles the four idle cells',c.size===4&&drawn[0].idle.path.endsWith('M003-idle.png'),[...c]);
 const mv=mk('dist05-m1',{moving:true});drawn.length=0;sb.drawEnemy(mv);check('walking mage still uses its R109 move strip',drawn[0].move.path.includes('M003-move'));
 const sl=mk('c101-e3',{moving:false});drawn.length=0;sb.drawEnemy(sl);check('slime c101-e3 standing uses M130 idle',drawn[0].idle.path.endsWith('M130-idle.png'));
 const b=mk('dist05-m1',{boss:true,hitTimer:.3});drawn.length=0;sb.drawEnemy(b);check('bosses are not repainted',drawn[0].idle===still);
 sb.zone='ep1a08';drawn.length=0;sb.drawEnemy(mk('dist05-m1',{hitTimer:.3}));check('hospital keeps its authored poses',drawn[0].idle===still);sb.zone='samong-x';
 check('every R116 strip is requested when its mob is in the room',(()=>{imgs.clear();sb.room.enemies=[mk('c101-e3')];sb.performance.now=()=>99999;sb.drawEnemy(sb.room.enemies[0]);return imgs.has('assets/r116/mobs/M130-hit.png')&&imgs.has('assets/r116/mobs/M130-idle.png');})());
 check('no failures',M.inspect().failures===0,M.inspect().lastError);
 const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');check('runtime copy matches source',fs.readFileSync(path.join(RT,'mobs-r109.js'),'utf8')===fs.readFileSync(path.join(SRC,'mobs-r109.js'),'utf8')&&html.includes('mobs-r109.js'));
 console.log(`\n${n-failed}/${n} passed`);process.exit(failed?1:0);})().catch(e=>{console.log('FAIL crashed',e);process.exit(1);});
