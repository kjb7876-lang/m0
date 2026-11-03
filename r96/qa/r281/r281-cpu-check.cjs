// R281 — 드라이브 자산 2묶음(모두 조건부·최종 아님): ① 보스 이동6(뿌리의 문지기·무의 기억포식자·늪의 뿔악마 군주) ② dist00 정원 흙띠 데칼.
// 보류(적용 안 함): 환도 Q 발도 FX(기존 Q 연출과 이중), 복원 이동 QA 묶음(M028/M029/M033/M036 제한검토, M036 v6 출처보관, M107/M121/M124 HOLD), 환도 Z/C(private) — assets/r281 에 없어야 한다.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f));
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});const H=b=>crypto.createHash('sha256').update(b).digest('hex');
const src=C('drive-r281.js'),cave=C('cave-r204.js');
ok('runtime copies match (drive-r281, cave-r204)',RT('drive-r281.js').toString('utf8')===src&&RT('cave-r204.js').toString('utf8')===cave);
const html=RT('index.html').toString('utf8'),at=s=>html.indexOf(s);
ok('loads after r104/r248/r259/r266 and right before mob-fix-r275 (R275 stays the outermost drawEnemy wrapper)',at('"./drive-r281.js"')>at('"./bosses-r104.js"')&&at('"./drive-r281.js"')>at('"./hit-center-r259.js"')&&at('"./drive-r281.js"')>at('"./mob-unique-r248.js"')&&/perf-groups-r266\.js"><\/script><script src="\.\/drive-r281\.js"><\/script><script src="\.\/mob-fix-r275\.js">/.test(html)&&at('"./bosses-r104.js"')>0);
ok('in the public verify list',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'drive-r281.js'"));
const idx=JSON.parse(RT('assets/r281/index.json'));
const B104=(()=>{const w={Object};w.window=w;vm.runInNewContext(C('bosses-r104-data.js'),w);return w.__STORYWORLD_BOSS_KEYPOSES_R104_DATA__;})();
const WANT={'dist00-boss':['1_BLoOLH2ouTWv9ilqEauIbqi_uHq2Q_R','뿌리의 문지기'],'mb-ep1a07':['13T2t1XhEzvJ7TQ8xQKnA_g2OLlX-yAET','무의 기억포식자'],'mb-dist02':['1ftH3yyLm63L-RJ2bIUcqhr4vZL2K5TmG','늪의 뿔악마 군주']};
ok('exactly three bosses, each an existing R104 boss with the same in-game name',JSON.stringify(Object.keys(idx.bosses).sort())===JSON.stringify(Object.keys(WANT).sort())&&Object.entries(WANT).every(([k,[d,n]])=>idx.bosses[k].driveSheetId===d&&idx.bosses[k].name===n&&B104[k]&&String(B104[k].name).startsWith(n)));
ok('every derived file exists with the recorded sha256/bytes, marked 조건부·최종 아님 and applied',[...Object.values(idx.bosses),...Object.values(idx.patches)].every(r=>{const b=RT(r.path);return H(b)===r.sha256&&b.length===r.bytes&&/조건부·최종 아님/.test(r.status)&&r.applied===true&&/^[0-9a-f]{64}$/.test(r.sourceSha256);}));
ok('boss rows: 6 cells, a foot pivot per cell inside the cell, visibleHeight set',Object.values(idx.bosses).every(r=>r.frames===6&&r.pivotY.length===6&&r.pivotY.every(y=>y>0&&y<=r.cell[1])&&r.pivotX>0&&r.pivotX<r.cell[0]&&r.visibleHeight>0&&r.frameMs>=100));
const dims=b=>{const j=b.indexOf('VP8X');if(j>0)return[1+b.readUIntLE(j+12,3),1+b.readUIntLE(j+15,3)];const i=b.indexOf('VP8L');if(i>0){const v=b.readUInt32LE(i+9);return[(v&0x3fff)+1,((v>>14)&0x3fff)+1];}const k=b.indexOf('VP8 ');return[b.readUInt16LE(k+14)&0x3fff,b.readUInt16LE(k+16)&0x3fff];};
ok('boss strips are 6 cells wide',Object.values(idx.bosses).every(r=>{const d=dims(RT(r.path));return d[0]===r.cell[0]*6&&d[1]===r.cell[1];}));
ok('held bundles are not shipped (no recovered M-group, no hwando Q/Z/C FX, no fx folder)',!idx.fx&&!fs.existsSync(path.join(R,'runtime-text','assets','r281','fx'))&&fs.readdirSync(path.join(R,'runtime-text','assets','r281'),{recursive:true}).every(f=>!/M0\d\d|M1\d\d|moonwheel|phantom|[-_]z[-_.]|[-_]c[-_.]/i.test(String(f))));
// ① 보스 이동 — 가짜 엔진
function make(store={}){const draws=[],imgs=[];let ready=new Set();
 const ctx={localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},console,Math,JSON,String,Array,Set,Map,WeakSet,WeakMap,Object,Number,Promise,Date,performance:{now:()=>0},time:10,
  fetch:()=>Promise.resolve({ok:true,json:()=>idx}),readyImage:p=>ready.has(p)?{image:{naturalWidth:5,src:p}}:null,ensureImages:l=>{imgs.push(...l);return Promise.resolve();},
  drawEnemy(e){draws.push(e.profile.frames.move);},project:(x,y)=>({x:x*10,y:y*10}),actorHeight:()=>60,room:{enemies:[]},player:{hero:'hwando',hp:10,x:0,y:0,specialCD:0},
  };ctx.window=ctx;
 vm.createContext(ctx);vm.runInContext(src,ctx);return {ctx,draws,imgs,ready,store};}
(async()=>{
 const t=make();await new Promise(r=>setImmediate(r));const b=idx.bosses['dist00-boss'];
 const orig={path:'p4'},fr={move:orig,idle:orig};const e={id:'b1',nativeId:'dist00-boss',hp:5,moving:true,profile:{frames:fr}};
 t.ctx.drawEnemy(e);ok('art not swapped before the strip is loaded (requested instead)',t.draws[0]===orig&&t.imgs.includes(b.path));
 t.ready.add(b.path);t.ctx.drawEnemy(e);const f=t.draws[1];
 ok('moving boss draws a walk cell from the strip (cell rect, per-cell foot pivot, bakedFacing right)',f!==orig&&f.path===b.path&&f.assetFrame.sourceRect[2]===b.cell[0]&&f.assetFrame.pivot[1]===b.pivotY[f.r281Walk]&&f.assetFrame.bakedFacing==='right'&&f.assetFrame.visibleHeight===b.visibleHeight,f);
 ok('the profile frame table is restored right after the draw',fr.move===orig&&Object.keys(fr).join()==='move,idle');
 t.ctx.time=10+b.frameMs/1000;t.ctx.drawEnemy(e);ok('cells advance with time',t.draws[2].r281Walk===(f.r281Walk+1)%6);
 const n0=t.draws.length;for(const x of [{attack:{elapsed:.1}},{rangedWindup:.2},{hitTimer:.1},{hp:0},{moving:false},{spawnState:'dead'}])t.ctx.drawEnemy({...e,...x});
 ok('attack / wind-up / hit / dead / idle keep the original R104 art',t.draws.slice(n0).every(m=>m===orig));
 t.ctx.drawEnemy({...e,nativeId:'dist06-boss'});ok('other bosses untouched',t.draws.at(-1)===orig);
 const fz=Object.freeze({move:orig});t.ctx.drawEnemy({...e,profile:{frames:fz}});ok('frozen frame tables are skipped safely',t.draws.at(-1)===orig&&!t.ctx.__STORYWORLD_DRIVE_R281__.inspect().lastError);
 t.ctx.__STORYWORLD_DRIVE_R281__.set({bossWalk:false});t.ctx.drawEnemy(e);ok('{"bossWalk":false} restores the old single pose, stored under storyworld.r281.drive',t.draws.at(-1)===orig&&JSON.parse(t.store['storyworld.r281.drive']).bossWalk===false);
 // ③ 정원 흙띠
 ok('cave-r204 dist00 gets the fringe patch by path; other names still resolve to r207/organic',/dist00:\{[^\n]*\n[^\n]*\n\s*patches:\[[^\n]*\n\s*\['assets\/r281\/garden\/garden-soil-fringe-outer-01\.png','floor'/.test(cave)&&/const orgPath=n=>n\.includes\('\/'\)\?n:'assets\/r207\/organic\/'\+n\+'\.png'/.test(cave)&&(cave.match(/orgPath\(n\)/g)||[]).length===2&&!/'assets\/r207\/organic\/'\+n\+'\.png'\)/.test(cave.replace(/const orgPath=[^;]*;/,'')));
 ok('fringe patch is the byte-identical Drive 512 derivative (RGBA 512x512 PNG)',(()=>{const b=RT('assets/r281/garden/garden-soil-fringe-outer-01.png');return H(b)==='da4e291555cfd5153d42443dadd0e77e4060df0209a922729d2792b3382d18e3'&&b.readUInt32BE(16)===512&&b.readUInt32BE(20)===512&&b[25]===6;})());
 try{new vm.Script(src);new vm.Script(cave);ok('syntax',true);}catch(err){ok('syntax',false,String(err));}
 const pass=checks.filter(x=>x.pass).length;for(const x of checks)console.log((x.pass?'PASS ':'FAIL ')+x.name+(x.pass?'':' '+JSON.stringify(x.detail).slice(0,600)));
 console.log(`R281 CPU check: ${pass}/${checks.length}`);process.exit(pass===checks.length?0:1);})();
