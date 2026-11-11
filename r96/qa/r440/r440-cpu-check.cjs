// R440 환도 옛 그림 튐(지역 진입 직후 엔진 캐시 공백) 막기·영웅 테 칼날 정리(피격 그림은 사용자 판단으로 그대로) — 정적·CPU 검사(GPU·실기기 아님, 헤드리스 화면은 PR 비교 그림).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const h=C('hwando-r271.js'),c=C('combat-read-r409.js');
ok('runtime copies match client-source',RT('hwando-r271.js')===h&&RT('combat-read-r409.js')===c);
ok('loaded hwando art is kept (KEEP) and reused when the engine cache is empty after entering a region',/const KEEP=new Map\(\)/.test(h)&&/KEEP\.set\(p,row\.image\)/.test(h)&&/const k=KEEP\.get\(p\);if\(k&&\(k\.naturalWidth\|\|k\.width\)\)/.test(h));
ok('hit art left as R242 (user 2026-11-09: old hit pose is fine)',!/HIT_NEW|storyworld\.r440\.hwandoHit/.test(h));
// ② 테: 환도만, 끄기, 캐시 키 분리
ok('blade cut only for hwando, pref bladeRim restores, cache key separated',/BLADE_HEROES=new Set\(\['hwando'\]\)/.test(c)&&/prefs\.bladeRim===true/.test(c)&&/bladeCut\(\)\?':b':''/.test(c)&&/'castBehind','bladeRim'(?:,'fastBake')?\]/.test(c));
ok('enemy outline untouched (blade cut only when side===hero)',/if\(side==='hero'&&bladeCut\(\)\)/.test(c));
// morph: 굵은 덩어리는 열기 뒤에도 남고, 가는 선(칼날)은 사라진다
const m=c.match(/function morph\([\s\S]*?\n return O;\}/);ok('morph() found',!!m);
if(m){const sb={};vm.createContext(sb);vm.runInContext(m[0]+';this.morph=morph;',sb);const W=60,H=40,A=new Uint8Array(W*H);
 for(let y=8;y<32;y++)for(let x=6;x<26;x++)A[y*W+x]=1;/* 몸 20×24 */for(let x=26;x<58;x++){const y=20+Math.round((x-26)*.3);A[y*W+x]=1;A[(y+1)*W+x]=1;A[(y+2)*W+x]=1;}/* 칼날 3px */
 const R=2,thick=sb.morph(sb.morph(A,W,H,R,false),W,H,R,true);let body=0,blade=0;for(let y=10;y<30;y++)for(let x=8;x<24;x++)body+=thick[y*W+x];for(let x=34;x<58;x++){const y=20+Math.round((x-26)*.3);blade+=thick[(y+1)*W+x];}
 ok('opening keeps the body and drops the thin blade',body===16*20&&blade===0,{body,blade});}
ok('CI runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r440/r440-cpu-check.cjs'));
const fail=checks.filter(x=>!x.pass);for(const x of checks)console.log((x.pass?'PASS ':'FAIL ')+x.name+(x.pass?'':' '+JSON.stringify(x.detail||'')));
console.log(`R440 ${checks.length-fail.length}/${checks.length}`);if(fail.length)process.exit(1);
