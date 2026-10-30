// R154 CPU check: 그림 테두리 재기(imageCrop) 결과를 주소·크기별로 다시 쓴다 — 같은 결과, 다시 재지 않음, 끌 수 있음.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('perf-r154.js');
ok('runtime copy matches',fs.readFileSync(path.join(R,'runtime-text','perf-r154.js'),'utf8')===src);
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('index.html loads perf-r154 before audio-r98',html.indexOf('./perf-r154.js')>0&&html.indexOf('./perf-r154.js')<html.indexOf('./audio-r98.js'));
ok('public verify list includes perf-r154',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'perf-r154.js'"));
function run(stored){let calls=0;const store={};if(stored)store['storyworld.r154.perf']=JSON.stringify(stored);
 const sb={window:{},localStorage:{getItem:k=>store[k]??null,setItem(){}},imageCrop(im){calls++;return {x:im.naturalWidth*.1,y:2,w:im.naturalWidth*.8,h:im.naturalHeight-4};}};
 vm.createContext(sb);vm.runInContext(src,sb);return {sb,get calls(){return calls;},api:sb.window.__STORYWORLD_PERF_R154__};}
const A={src:'http://x/m0/assets/a.webp',naturalWidth:100,naturalHeight:200},A2={src:'http://x/m0/assets/a.webp',naturalWidth:100,naturalHeight:200},B={src:'http://x/m0/assets/b.webp',naturalWidth:100,naturalHeight:200};
{const t=run();const r1=t.sb.imageCrop(A),r2=t.sb.imageCrop(A2);ok('same address+size (a new Image after the zone cache was cleared) is measured once',t.calls===1&&JSON.stringify(r1)===JSON.stringify(r2),{calls:t.calls,r1,r2});
 r2.x=999;const r3=t.sb.imageCrop(A);ok('callers get a copy (changing it does not change the memory)',r3.x===10,r3);
 t.sb.imageCrop(B);ok('a different image is measured on its own',t.calls===2);
 t.sb.imageCrop({src:'http://x/m0/assets/a.webp',naturalWidth:50,naturalHeight:100});ok('same address but different size is measured again',t.calls===3);
 t.sb.imageCrop({src:'',naturalWidth:10,naturalHeight:10});t.sb.imageCrop({src:'',naturalWidth:10,naturalHeight:10});ok('images without an address are always measured',t.calls===5);
 const st=t.api.inspect().stats;ok('stats count hits and misses',st.hit===2&&st.miss===3&&st.skipped===2,st);}
{const t=run({cropMemo:false});t.sb.imageCrop(A);t.sb.imageCrop(A2);ok('storyworld.r154.perf {cropMemo:false} turns it off',t.calls===2);}
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
