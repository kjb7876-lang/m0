// R138 CPU check: Drive 2026-10-30 static props (hanging bones, corridor window) — files, hashes, wiring, non-colliding.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),T=path.join(R,'runtime-text');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const src=fs.readFileSync(path.join(R,'client-source','drive-props-r138.js'),'utf8');
ok('runtime copy matches client-source',fs.readFileSync(path.join(T,'drive-props-r138.js'),'utf8')===src);
const idx=JSON.parse(fs.readFileSync(path.join(T,'assets/r138/props/index.json'),'utf8'));
for(const id of['bones','window','root']){const e=idx.props[id];const b=fs.readFileSync(path.join(T,e.path));
 ok(id+' derived sha256',crypto.createHash('sha256').update(b).digest('hex')===e.sha256&&b.length===e.bytes,e.path);
 ok(id+' source recorded',/^[0-9a-f]{64}$/.test(e.source.sha256)&&e.source.driveId&&e.source.drive,e.source.drive);
 ok(id+' used in overlay',src.includes(e.path));}
ok('held candidates recorded',Object.keys(idx.held||{}).length>=6);
ok('props are non-colliding & non-interactive',/solid:false/.test(src)&&/interactive:false/.test(src)&&/autoTargetEligible6:false/.test(src));
ok('planned: dist00/dist01, R145 dist02/dist03, R146 ep1a09/ep1a11/ep1b02/03/04/06b',/const PLAN=\{dist01:\[\['bones',2\]\],dist00:\[\['window',1\],\['root',2\]\],dist02:\[\['weed',2\]\],dist03:\[\['chain',2\]\],\s*ep1a09:\[\['sign',1\]\],ep1a11:\[\['hwindow',1\],\['syringe',2\]\],ep1b02:\[\['fridge',1\],\['pet',2\]\],ep1b03:\[\['glasses',1\]\],ep1b04:\[\['counter',1\],\['plate',1\]\],ep1b06b:\[\['cwindow',1\]\]\}/.test(src));
ok('uses R81 safe spacing',/E\.safe\(r,p,used/.test(src));
const html=fs.readFileSync(path.join(T,'index.html'),'utf8');
ok('script tag before audio-r98',html.indexOf('drive-props-r138.js')>0&&html.indexOf('drive-props-r138.js')<html.indexOf('./audio-r98.js'));
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'));const ms=JSON.stringify(man);
ok('manifest lists js + assets',['drive-props-r138.js','assets/r138/props/bones.webp','assets/r138/props/window.webp'].every(p=>ms.includes(p)));
const fails=checks.filter(c=>!c.pass);console.log(JSON.stringify({status:fails.length?'R138_DRIVE_PROPS_FAILED':'R138_DRIVE_PROPS_PASSED',checks:checks.length,fails},null,1));
if(fails.length)process.exit(1);
