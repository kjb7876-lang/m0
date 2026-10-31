// R180 CPU check: 새 정본(디스토피아) 사몽 배너 문구 · 바닥 타일 격자 합치기(perf-r180) · R106 이펙트 조각 프레임 상한.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=RT('index.html');
ok('perf-r180 runtime copy matches, loaded before world-tiles-r118 (last), in the public verify list',RT('perf-r180.js')===C('perf-r180.js')&&idx.indexOf('./perf-r180.js')>0&&idx.indexOf('./perf-r180.js')<idx.indexOf('./world-tiles-r118.js')&&/perf-r180\.js/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
for(const f of ['perf-r180.js','fx-sprites-r106.js','samong-mood-r123.js'])ok('runtime copy matches · '+f,RT(f)===C(f));
// ---- gridMerge ----
const sb={window:{},localStorage:{getItem(){return null;},setItem(){}},Math,JSON,Number,Object,Array,Uint8Array,WeakSet};vm.createContext(sb);vm.runInContext(C('perf-r180.js'),sb);
const G=sb.window.__STORYWORLD_PERF_R180__.gridMerge;
const area=a=>a.reduce((s,r)=>s+r.width*r.depth,0);
const strips=[];for(let y=0;y<9;y++)strips.push({x:1,y,width:17,depth:1});
const m=G(strips,4.5);
const cell=(r,T)=>[Math.floor(r.x/T+1e-9),Math.floor(r.y/T+1e-9)];
ok('merged area equals the union area (no floor added or lost)',m&&Math.abs(area(m)-area(strips))<1e-9,m&&area(m));
ok('every merged rect sits inside one 4.5 grid cell (so the world-anchored texture is unchanged)',m.every(r=>{const [a,b]=cell(r,4.5);return r.x+r.width<=(a+1)*4.5+1e-9&&r.y+r.depth<=(b+1)*4.5+1e-9;}));
const inside=(rs,x,y)=>rs.some(r=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.depth);let same=true;for(let x=0;x<20;x+=.5)for(let y=0;y<10;y+=.5)if(inside(m,x+.25,y+.25)!==inside(strips,x+.25,y+.25))same=false;
ok('merged rects cover exactly the same cells',same);
ok('nine 1-deep strips over 4 grid columns collapse to 2 rows × 5 columns of pieces (was 9 × 5)',m.length<=10,m.length);
ok('non half-unit coordinates are left alone',G([{x:.3,y:0,width:1,depth:1}],4.5)===null);
const src=C('perf-r180.js');
ok('swap is draw-only: original rects restored in finally',/finally\{L\.floorRects=orig\.floorRects;L\.backdropRects=orig\.backdropRects;\}/.test(src));
ok('only applied when the tile count actually drops and areas match (overlaps skipped)',/after\.length>=before\.length/.test(src)&&/area\(m\)-area\(rects\)/.test(src));
// ---- R106 budget ----
const fx=C('fx-sprites-r106.js');
ok('R106 sprites: per-frame budget skips faint pieces first, never pieces drawn over the hero',/if\(FB>0&&!o\.overHero&&frameDraws>=FB&&\(alpha<\.55\|\|frameDraws>=FB\*1\.7\)\)/.test(fx)&&/frameDraws\+\+/.test(fx));
// ---- 디스토피아 배너 ----
const mood=C('samong-mood-r123.js');
ok('S-06 banner reads 디스토피아 (not 네오 서울) and stops on the DYS section number, not "연도 없음"',/b\.dys\?'디스토피아':'네오 서울'/.test(mood)&&/target=b\.year\|\|\(b\.dys\?b\.dys:'연도 없음'\)/.test(mood)&&/dys:\/\^DYS-\/\.test/.test(mood));
ok('no mid-line // comment swallowing code in the new overlay',!src.split('\n').some(l=>/;\s*\/\/[^\n]*[;{}]\s*\S/.test(l)&&!/^\s*\/\//.test(l)));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
