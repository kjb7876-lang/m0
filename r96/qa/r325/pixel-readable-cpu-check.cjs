// R325 픽셀 모드 어두운 몹 파생본 검사(CPU): 표 교체·토글·파일 규격·원본 보존.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const R=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(R,'client-source/pixel-readable-r325.js'),'utf8');
assert.strictEqual(src,fs.readFileSync(path.join(R,'runtime-text/pixel-readable-r325.js'),'utf8'));ok('client-source and runtime copies agree');
const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r325/pixel-readable/index.json'),'utf8'));
const keys=Object.keys(idx.map);assert(keys.length>=20,'derived count '+keys.length);
for(const [o,v] of Object.entries(idx.map)){const ob=fs.readFileSync(path.join(R,'runtime-text',o));assert.strictEqual(crypto.createHash('sha256').update(ob).digest('hex'),v.srcSha256,'original changed '+o);assert(fs.existsSync(path.join(R,'runtime-text',v.path)),'missing '+v.path);assert(v.meanL<45,'threshold '+o);}
ok(keys.length+' derived sheets exist; originals unchanged (sha256 match)');
assert(!JSON.stringify(idx).match(/drive\.google/)&&!(JSON.stringify(idx).match(/[A-Za-z0-9_-]{25,}/g)||[]).some(t=>/[A-Z]/.test(t)&&/[a-z]/.test(t)),'no Drive ids');ok('index has no Drive ids');
function world(stored){const ls=new Map(stored?[[ 'storyworld.r325.pixelReadable',stored]]:[]);const c={console,JSON,Object,Map,localStorage:{getItem:k=>ls.has(k)?ls.get(k):null,setItem:(k,v)=>ls.set(k,v)}};c.window=c;
 vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(R,'client-source/mob-art-variants-r306-data.js'),'utf8'),c);vm.runInContext(src,c);return c;}
const w=world();const D=w.__STORYWORLD_MOB_ART_VARIANTS_R306_DATA__;const rows=Object.values(D.rows);
const hits=rows.filter(r=>r.pixel.path.startsWith('assets/r325/'));assert(hits.length>0);
for(const r of rows){const base=Object.entries(idx.map).find(([o,v])=>v.path===r.pixel.path);if(r.pixel.path.startsWith('assets/r325/'))assert(base,'unmapped swap');}
const covered=new Set(hits.map(r=>r.pixel.path));assert.strictEqual(covered.size,keys.length,'every derived sheet used');
ok('pixel rows swapped to derived sheets: '+hits.length+' rows / '+covered.size+' sheets');
assert(!rows.some(r=>idx.map[r.pixel.path]),'some dark original still referenced');ok('no dark original left in pixel table');
w.__STORYWORLD_PIXEL_READABLE_R325__.set(false);assert(!rows.some(r=>r.pixel.path.startsWith('assets/r325/')));ok('toggle off restores original paths');
w.__STORYWORLD_PIXEL_READABLE_R325__.set(true);assert.strictEqual(rows.filter(r=>r.pixel.path.startsWith('assets/r325/')).length,hits.length);ok('toggle on re-applies');
const w2=world('{"on":false}');assert(!Object.values(w2.__STORYWORLD_MOB_ART_VARIANTS_R306_DATA__.rows).some(r=>r.pixel.path.startsWith('assets/r325/')));ok('stored off preference keeps originals');
// same canvas size as source (cell/pivot unchanged)
const {execFileSync}=require('child_process');
const dims=JSON.parse(execFileSync('python3',['-c',`import json,sys
from PIL import Image
m=json.load(open(sys.argv[1]))['map'];r=sys.argv[2]
print(json.dumps([[Image.open(r+'/'+o).size,Image.open(r+'/'+v['path']).size] for o,v in m.items()]))`,path.join(R,'runtime-text/assets/r325/pixel-readable/index.json'),path.join(R,'runtime-text')],{encoding:'utf8'}));
assert(dims.every(([a,b])=>a[0]===b[0]&&a[1]===b[1]));ok('derived sheet sizes match originals (cell/pivot valid)');
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');assert(html.includes('<script src="./mob-art-variants-r306.js"></script><script src="./pixel-readable-r325.js"></script>'));ok('script registered right after R306');
console.log(JSON.stringify({ok:true,checks:n,method:'CPU data swap + file checks; no WebGL or device'}));
