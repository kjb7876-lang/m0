// R110 CPU check: Drive 2026-10-27 evening mob strips — M137 cyborg move4, M119 censer priest idle4 (used standing and moving)
// and the paper figure move4 routed through the art-drive-r105 single-image path (walks swap 4 cells, standing keeps the Drive picture).
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,300)));};
const r92=JSON.parse(fs.readFileSync(path.join(RT,'assets/r92/mobs/index.json'),'utf8'));
const r109=JSON.parse(fs.readFileSync(path.join(RT,'assets/r109/mobs/index.json'),'utf8'));
const T=g=>r109.tracks.find(t=>t.group===g);
check('M137 move strip maps the cyborg enforcer c104-e1',T('M137')?.track==='move'&&T('M137').ids.includes('c104-e1'));
check('M119 idle strip maps the censer priest h102-t1',T('M119')?.track==='idle'&&T('M119').ids.includes('h102-t1'));
check('paper figure strip is routed by its Drive picture, not by id',T('PAPER')?.art==='assets/r105/drive/mob-paper-figure.webp'&&T('PAPER').ids.length===0);
check('new strips keep Drive provenance',['M137','M119','PAPER'].every(g=>/^[0-9a-f]{64}$/.test(T(g)?.source?.pngSha256||'')&&!!T(g)?.source?.driveZipId));
check('paper figure Drive picture exists',fs.existsSync(path.join(RT,'assets/r105/drive/mob-paper-figure.webp')));
const imgs=new Set();
const R52={applyBodyPose:()=>({native:true}),hasMotion:()=>'native',tickEnemy(){}};
const sb={console,Math,JSON,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Error,Promise,performance:{now:()=>0},
 localStorage:{getItem:()=>null,setItem(){}},time:1,zone:'samong-x',layer:'DREAM',settings:{},player:{x:0,y:0},room:{enemies:[]},
 actorHeight:()=>100,readyImage:p=>imgs.has(p)?{image:{}}:null,addImage:p=>imgs.add(p),Z:()=>1,__STORYWORLD_HOSPITAL_CHARGE_R52__:R52,__STORYWORLD_ENEMY_MOTION_R51__:{flip:(e,f,fb)=>'native'},project:(x,y)=>({x:(x-y)*34,y:(x+y)*17}),
 __STORYWORLD_DRIVE_ART_R105__:{artFor:e=>e.paper?'assets/r105/drive/mob-paper-figure.webp':null},
 fetch:u=>Promise.resolve({ok:true,json:()=>Promise.resolve(u.includes('r92')?r92:r109)})};
sb.window=sb;const drawn=[];sb.drawEnemy=function(e){drawn.push(e.profile.frames);return 'base';};
vm.createContext(sb);vm.runInContext(fs.readFileSync(path.join(SRC,'mobs-r109.js'),'utf8'),sb,{filename:'mobs-r109.js'});
const M=sb.__STORYWORLD_MOBS_R109__;
check('overlay revision is R110',M?.revision==='R110-mobs-2');
const MO=sb.__STORYWORLD_ENEMY_MOTION_R51__;
const still={path:'still.png',assetFrame:{sourceRect:[0,0,10,10],pivot:[5,10]}};
const mk=(id,o={})=>({id:'e'+id+Math.random(),nativeId:id,hp:10,x:3,y:0,profile:{frames:{idle:still,move:still,attack:still,windup:still}},combatProfile:{attackShape:{windup:.4,active:.2}},...o});
(async()=>{sb.drawEnemy(mk('x'));await new Promise(r=>setTimeout(r,20));
 check('indexes load with one art-routed row',M.inspect().state==='ready'&&M.inspect().artRows===1,JSON.stringify(M.inspect()));
 for(const t of r109.tracks)imgs.add(t.path);
 const cy=mk('c104-e1',{moving:true}),s1=new Set();for(let i=0;i<8;i++){sb.time=1+i/6.5;drawn.length=0;sb.drawEnemy(cy);s1.add(drawn[0].move.assetFrame.sourceRect[0]);}
 check('walking cyborg cycles four M137 cells',s1.size===4&&drawn[0].move.path.endsWith('M137-move.png'),[...s1]);
 for(const mv of [false,true]){const pr=mk('h102-t1',{moving:mv}),s2=new Set();for(let i=0;i<10;i++){sb.time=3+i/3.4;drawn.length=0;sb.drawEnemy(pr);s2.add(drawn[0].idle.assetFrame.sourceRect[0]);}
  check(`censer priest ${mv?'moving':'standing'} cycles the M119 idle strip slowly`,s2.size===4&&drawn[0].idle===drawn[0].move&&drawn[0].idle.path.endsWith('M119-idle.png'),[...s2]);}
 const pa=mk('ep13-x',{paper:true,moving:true});drawn.length=0;sb.drawEnemy(pa);
 check('art-routed mob is not repainted by the id table',drawn[0].move===still);
 const s3=new Set();for(let i=0;i<8;i++){sb.time=5+i/6.5;const p=M.artPatch(pa,'assets/r105/drive/mob-paper-figure.webp');if(p)s3.add(p.move.assetFrame.sourceRect[0]);}
 check('artPatch walks the paper figure through four cells',s3.size===4,[...s3]);
 check('artPatch keeps the Drive picture when standing, attacking or hit',[{moving:false},{attack:{elapsed:.1}},{hitTimer:.1}].every(o=>M.artPatch(mk('p',{paper:true,moving:true,...o}),'assets/r105/drive/mob-paper-figure.webp')===null));
 check('artPatch ignores bosses and other Drive pictures',M.artPatch(mk('b',{boss:true,moving:true}),'assets/r105/drive/mob-paper-figure.webp')===null&&M.artPatch(pa,'assets/r105/drive/mob-student.webp')===null);
 // attack facing (user 22:38): M004 attack strip and the STORY R54 attack cell turn toward the hero on both sides
 const strip={path:'assets/r92/mobs/M004-attack.png',r92Mob:true,assetFrame:{sourceRect:[0,0,10,10]}},cellR54={path:'assets/rc137/mob-attacks-01.png',r54StoryPose:true,flip:false,assetFrame:{sourceRect:[940,0,314,313]}};
 sb.player={x:0,y:0,hp:10};const gL=mk('a11-c1',{x:-1.2,y:1.2,attack:{elapsed:.45}}),gR=mk('a11-c1',{x:1.2,y:-1.2,attack:{elapsed:.45}});
 check('M004 attack strip faces the hero on either side',MO.flip(gL,strip,null)===false&&MO.flip(gR,strip,null)===true,[MO.flip(gL,strip,null),MO.flip(gR,strip,null)]);
 check('STORY attack cell of the tree guard faces the hero on either side',MO.flip(gL,cellR54,null)===false&&MO.flip(gR,cellR54,null)===true);
 check('other frames and non-attacking mobs keep the earlier facing chain',MO.flip(mk('x',{attack:{elapsed:.1}}),{path:'other.png',assetFrame:{sourceRect:[0,0,1,1]}},null)==='native'&&MO.flip(mk('a11-c1',{x:-1.2,y:1.2}),strip,null)==='native');
 // see-through: a mob standing in front of the hero over its body is drawn translucent, one behind is not
 check('mob in front of the hero over its body is translucent',M.seeAlpha(mk('m',{x:.4,y:.4}))<1&&M.seeAlpha(mk('m',{x:.4,y:.4}))>=.44,M.seeAlpha(mk('m',{x:.4,y:.4})));
 check('mob behind the hero stays opaque',M.seeAlpha(mk('m',{x:-.4,y:-.4}))===1&&M.seeAlpha(mk('m',{x:3,y:3}))===1);
 const play=fs.readFileSync(path.join(SRC,'play-r106.js'),'utf8');check('lower-right build line is kept on one line',/#buildText\{white-space:nowrap/.test(play));
 check('no failures',M.inspect().failures===0,M.inspect().lastError);
 const ad=fs.readFileSync(path.join(SRC,'art-drive-r105.js'),'utf8');
 check('art-drive-r105 asks mobs-r109 for move cells before drawing',/__STORYWORLD_MOBS_R109__\?\.artPatch\?\.\(e,path\)/.test(ad));
 const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');check('art-drive loads before mobs overlay (hook looked up at draw time)',html.indexOf('art-drive-r105.js')>0&&html.indexOf('art-drive-r105.js')<html.indexOf('mobs-r109.js'));
 console.log(`\n${n-failed}/${n} passed`);process.exit(failed?1:0);})().catch(e=>{console.log('FAIL crashed',e);process.exit(1);});
