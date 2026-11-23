'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const crypto=require('node:crypto');
const r96=path.resolve(__dirname,'../..');
const sources=path.join(r96,'client-source'),runtime=path.join(r96,'runtime-text');
const code=fs.readFileSync(path.join(runtime,'move-dir-r974.js'),'utf8');
assert.equal(code,fs.readFileSync(path.join(sources,'move-dir-r974.js'),'utf8'));
const dirs=['up','down','right','left'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const spec=JSON.parse(fs.readFileSync(path.join(runtime,'assets/kairo-g34-serpent-v1/index.json')));
const manifest=fs.readFileSync(path.join(r96,'runtime-manifest.json'));
const inputs=JSON.parse(fs.readFileSync(path.join(r96,'runtime-inputs.json')));
assert.equal(sha(manifest),inputs.runtimeManifestSHA256);
const hashes=new Map(JSON.parse(manifest).files.map(r=>[r.path,r.sha256]));
const pack=JSON.parse(code.match(/^const G34_PACK=(.*);$/m)[1]);
for(const [d,z] of Object.entries(pack)){
 const raw=spec.directions[d],bytes=fs.readFileSync(path.join(runtime,z.path));
 assert.equal(sha(bytes),raw.sha256);assert.equal(hashes.get(z.path),raw.sha256);
 assert.equal(z.cell,raw.cell);assert.equal(z.n,raw.frames);assert.deepEqual([z.px,z.py],raw.pivot);
 assert.ok(inputs.textPaths.includes(z.path));
}
assert.equal(hashes.get('move-dir-r974.js'),sha(code));
assert.equal(hashes.get('assets/kairo-g34-serpent-v1/index.json'),sha(fs.readFileSync(path.join(runtime,'assets/kairo-g34-serpent-v1/index.json'))));
const native='assets/generated-v3125/kair-guardians/guardian_34.webp', id='kair-guardian-34';
const baked='assets/r1221/side/kair-guardian-34-side.webp';
const tests=[];let asks=new Set(), ready=new Set(), bad=new Set();
const ctx={window:{},room:{id:'kair09',layer:'STORY'},time:0,settings:{},ctx:{commands:[]},performance:{now:()=>0},
 localStorage:{getItem:()=>null},project:(x,y)=>({x:x-y,y:(x+y)*.5}),
 addImage(p){asks.add(p);},
 readyImage(p){if(p===baked)return {image:{width:2304,height:384}};if(!ready.has(p))return null;
  return {image:{width:bad.has(p)?1023:1024,height:256}};},
 drawEnemy(e){ctx.ctx.commands.push({kind:'image',owner:{kind:'enemy'},sourcePath:e.path,sourceRect:e.rect,points:e.points||[[0,0],[192,0],[192,192],[0,192]]});
 if(e.ghost)ctx.ctx.commands.push({kind:'image',owner:{kind:'enemy'},sourcePath:e.path,r620Ghost:true,points:[[0,0],[192,0],[192,192],[0,192]]});}};
vm.createContext(ctx);
for(const name of ['mob-art-variants-r306-data.js','move-dir-r974-data.js','move-side-r1221-data.js','kairo-motion-sw0022-data.js']) vm.runInContext(fs.readFileSync(path.join(sources,name),'utf8'),ctx);
vm.runInContext(code.replace(/^const G34_PACK=.*;$/m,'const G34_PACK=new Proxy({}, {get:(_,k)=>window.testPack?.[k]});'),ctx);
function draw(dir,more={}){
 const delta={up:[-.04,-.04],down:[.04,.04],right:[.04,-.04],left:[-.04,.04],idle:[0,0]}[dir];
 const e={nativeId:id,name:'시간수문장',x:10,y:10,hp:100,path:native,rect:[0,0,192,192],...more};
 const rs=[];for(let k=0;k<30;k++){ctx.time+=.05;e.x+=delta[0];e.y+=delta[1];ctx.ctx.commands=[];
  ctx.drawEnemy(e);rs.push(ctx.ctx.commands);}
 return rs;
}
function ok(label,fn){assert.ok(fn(),label);tests.push(label);}
const shown=(d,o)=>draw(d,o).filter(cs=>cs[0].kairoG34Serpent);
ok('no config, legacy side',()=>draw('right').some(cs=>cs[0].sourcePath===baked));
ctx.window.testPack={...pack,left:{...pack.right}};
ok('same asset for right and left rejected',()=>!shown('right').length);
ctx.window.testPack=pack;
ready=new Set(dirs.slice(0,3).map(d=>pack[d].path));
ok('no swap with one unavailable and missing direction is requested',()=>!shown('up').length&&asks.has(pack.left.path));
ready.add(pack.left.path);bad.add(pack.left.path);
ok('mismatched decoded size prevents every direction',()=>!shown('right').length);
bad.clear();
for(const d of dirs)ok('warm actual '+d+' and no mirror',()=>{const seq=shown(d,{ghost:true});return seq.length>15&&seq.every(cs=>cs.length===1&&cs[0].sourcePath===pack[d].path&&cs[0].points[1][0]>cs[0].points[0][0])&&new Set(seq.map(cs=>cs[0].sourceRect[0])).size===4;});
const close=(a,b)=>Math.abs(a-b)<1e-8;
for(const [label,points,center,baseline,expectedBody] of [
 ['native origin',[[0,0],[192,0],[192,192],[0,192]],95.5,145,126],
 ['mirrored source',[[500,100],[308,100],[308,292],[500,292]],404.5,245,126],
 ['mirrored reversed vertical edge',[[500,292],[308,292],[308,100],[500,100]],404.5,245,126],
 ['scaled offset',[[35,25],[131,25],[131,121],[35,121]],82.75,97.5,63]
]){
 ok(label+' preserves connected body center, scale and painted contact; new art remains unmirrored',()=>{
  const rows=shown('left',{points}),S=pack.left;
  return rows.length>15&&rows.every(cs=>{const P=cs[0].points,k=(P[1][0]-P[0][0])/S.cell;
   const f=cs[0].sourceRect[0]/S.cell,box=spec.directions.left.bounds[f];
   return k>0&&close(P[0][0]+S.px*k,center)&&close(P[0][1]+box[3]*k,baseline)
     &&close(k*S.vis,expectedBody)&&Math.abs(k*(box[3]-box[1])-expectedBody)<3;
  });
 });
}
const exclude=[[{attack:{}},'attack'],[{hitTimer:1},'hit'],[{hp:0},'dead'],[{rangedWindup:1},'windup'],[{r286:{mode:'dash'}},'dash'],[{spawnState:'spawning'},'spawn'],[{path:'assets/another/guardian_34.webp'},'wrong body'],[{rect:[192,0,192,192]},'wrong frame'],[{nativeId:'kair-guardian-33'},'wrong ID'],[{name:'뿌리 추적자'},'shared ID/art different R306 actor']];
for(const [o,n] of exclude)ok(n+' unchanged',()=>!shown('right',o).length);
ok('idle unchanged',()=>!shown('idle').length);
ctx.room.layer='DREAM';ok('DREAM unchanged',()=>!shown('right').length);
ctx.room={id:'kair10',layer:'STORY'};ok('wrong STORY map unchanged',()=>!shown('right').length);
ok('no errors',()=>ctx.window.__STORYWORLD_MOVE_DIR_R974__.inspect().stats.errors===0);
console.log(tests.length+' staged guardian34 regression checks passed');
