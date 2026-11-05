// R326 미카엘라 R(세라핌) 날개·후광 검사(CPU).
const fs=require('fs'),path=require('path'),assert=require('assert');
const R=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
for(const f of ['polish-r101.js','fx-d2s-r106.js'])assert.strictEqual(fs.readFileSync(path.join(R,'client-source',f),'utf8'),fs.readFileSync(path.join(R,'runtime-text',f),'utf8'),f);ok('client-source and runtime copies agree');
const src=fs.readFileSync(path.join(R,'client-source/polish-r101.js'),'utf8');
const i=src.indexOf('function wingView(p)');assert(i>0);let d=0,j=src.indexOf('{',i),end=j;for(;end<src.length;end++){if(src[end]==='{')d++;else if(src[end]==='}'){d--;if(!d)break;}}
const body=src.slice(i,end+1);
function make(sector,pose){return new Function('wingSector','skillPose','wingHold','time',body+';return wingView;')(()=>sector,()=>pose,new WeakMap(),10);}
for(const s of ['e','w']){assert.strictEqual(make(s,null)({}).v,'side');assert.strictEqual(make(s,{kind:'q'})({}).v,'side');const r=make(s,{kind:'r'})({});assert.strictEqual(r.v,'front');assert.strictEqual(r.flip,false);}
ok('facing east/west: R pose uses the two-wing front view (other poses keep side view)');
assert.strictEqual(make('n',{kind:'r'})({}).v,'front');assert.strictEqual(make('n',null)({}).v,'back');assert.strictEqual(make('s',null)({}).v,'front');ok('north/south views unchanged outside R');
const d2=fs.readFileSync(path.join(R,'client-source/fx-d2s-r106.js'),'utf8');
assert(!d2.includes("S('halo',F,top.x,top.y+h*.3"),'old floating halo');assert(/S\('halo',F,g\.x,g\.y-h\*1\.12/.test(d2),'halo above head');ok('seraph halo sits just above the head (g.y - 1.12h), not a body height above it');
console.log(JSON.stringify({ok:true,checks:n,method:'CPU extract of wingView + source check; no WebGL or device'}));
