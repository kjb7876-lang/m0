// R186 CPU check: 사몽 바닥 밖 빈 공간에 뇌·내장 주름 판(사몽만, 판 하나, 충돌 불변, 임시 자체 생성 텍스처, 이음매 없음).
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=RT('index.html'),src=C('samong-void-r186.js');
ok('samong-void-r186 loaded after scene3d-r183, before combat-r118/world-tiles-r118',idx.indexOf('./samong-void-r186.js')>idx.indexOf('./scene3d-r183.js')&&idx.indexOf('./samong-void-r186.js')<idx.indexOf('./combat-r118.js')&&idx.indexOf('./samong-void-r186.js')<idx.indexOf('./world-tiles-r118.js'));
ok('runtime copy matches client source',RT('samong-void-r186.js')===src);
ok('in the public verify list',/'samong-void-r186\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
const dir=path.join(R,'runtime-text','assets','r186'),ix=JSON.parse(fs.readFileSync(path.join(dir,'index.json'),'utf8')),buf=fs.readFileSync(path.join(dir,ix.file));
ok('texture listed with sha256/bytes, marked temporary and tileable',ix.temporary===true&&ix.tileable===true&&crypto.createHash('sha256').update(buf).digest('hex')===ix.sha256&&buf.length===ix.bytes&&src.includes("'assets/r186/"+ix.file+"'"));
ok('texture is a WebP under 64 KB',buf.slice(0,4).toString()==='RIFF'&&buf.slice(8,12).toString()==='WEBP'&&buf.length<65536);
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')+fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');ok('runtime manifest lists the script and texture',man.includes('samong-void-r186.js')&&man.includes('assets/r186/flesh-void.webp'));
ok('samong rooms only, solo only, togglable',/const isSamong=/.test(src)&&/if\(!prefs\.on\|\|!solo\(\)\|\|!T\|\|!r\.spatialRoot\|\|!isSamong\(frame\)\)/.test(src)&&/storyworld\.r186\.void/.test(src));
ok('one presentation-only plane under the floor (no depth write, collision unchanged)',/mesh\.position\.set\([^;]*,-\.12,/.test(src)&&/depthWrite:false/.test(src)&&/presentationOnly:true/.test(src)&&/collisionChanged:false/.test(src)&&(src.match(/new T\.Mesh\(/g)||[]).length===1);
ok('resources released on clearScene and on zone change',/C\.clearScene=function\(\.\.\.a\)\{try\{drop\(this\);\}/.test(src)&&/if\(r\.r186Key!==key\)\{drop\(r\);/.test(src));
ok('also wraps the renderer instance render (perf-r97 copies render onto the instance; load-order race)',/hasOwnProperty\.call\(r,'render'\)/.test(src)&&/w\.__r186=true/.test(src)&&/setInterval\(wrapInst,500\)/.test(src));
ok('no CSS filter / no external URLs',!/ctx\.filter|https?:\/\//.test(src.replace(/\/\/[^\n]*/g,'')));
ok('no mid-line // comment swallowing code',!src.split('\n').some(l=>/[;)}]\s*\/\/[^\n]*[;{}]\s*\S/.test(l)&&!/^\s*\/\//.test(l)));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
