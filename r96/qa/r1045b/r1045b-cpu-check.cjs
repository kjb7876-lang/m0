// R1045b 기억사수 아래 조준 걷기(Dots CX-0085GA r3 walk-s2) — CPU 검사.
//  node r96/qa/r1045b/r1045b-cpu-check.cjs
//  R1003 뒤 정 아래로 쏘며 걸으면 걷기 그림이 없어 앞모습 walk-s(총이 비스듬, 40°)를 썼다. 사용자가 고른 Dots walk-s2(총구를 화면 앞으로 겨눈 8칸)를
//  F3 한 칸만 좌우 반전해(같은 다리가 F3·F7 두 번 나오던 것 → 왼발·오른발 번갈아) 넣는다. {"walkS2":false} 로 예전 walk-s.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(R,'client-source','gunner-aim-r991.js'),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text','gunner-aim-r991.js'),'utf8'),'runtime-text 사본과 같음');
function webpSize(b){if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;const t=b.toString('ascii',12,16);
 if(t==='VP8L'){const v=b.readUInt32LE(21);return[(v&0x3fff)+1,((v>>14)&0x3fff)+1];}if(t==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(t==='VP8 ')return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];return null;}
const man=JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')));
const p=path.join(R,'runtime-text','assets','r1045','gunner','walk-s2.webp');ok(fs.existsSync(p),'walk-s2.webp 있음');
const s=webpSize(fs.readFileSync(p));ok(s&&s[0]===1536&&s[1]===256,'크기 1536×256(192×256 8칸)',s);ok(man.includes('assets/r1045/gunner/walk-s2.webp'),'runtime-manifest 에 있음');ok(fs.statSync(p).size<500000,'500KB 미만',fs.statSync(p).size);
ok(/node r96\/qa\/r1045b\/r1045b-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
function load(pref){const win={};const sb={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,setTimeout:()=>0,document:{readyState:'loading'},addEventListener(){}};win.addEventListener=()=>{};
 vm.createContext(sb);vm.runInContext(src,sb);return win.__STORYWORLD_GUNNER_AIM_R991__;}
const A=load(null),I={walks:A.walks()};
ok(/R1045b/.test(A.revision)&&/R1003/.test(A.revision)&&/R1045/.test(A.revision),'판 R1045b(+R1045·R1003 유지)',{rev:A.revision});
ok(I.walks&&I.walks.s2&&I.walks.s2.path==='assets/r1045/gunner/walk-s2.webp','정 아래 걷기 사격은 Dots walk-s2',I.walks&&I.walks.s2);
ok(I.walks.s.path==='assets/r128/gunner/walk-s.webp','앞모습 보통 걷기 사격(walk-s)은 그대로',I.walks.s);
const t=I.walks.s2.tip;ok(Array.isArray(t)&&t.length===8,'8칸 총구 끝',t);
for(let f=0;f<8;f++)ok(t[f].every(Number.isFinite)&&t[f][0]>=88&&t[f][0]<=104&&t[f][1]>=120&&t[f][1]<=140,'walk-s2 '+f+'칸 총구가 몸 가운데 가슴 아래(정면 원근)',t[f]);
const B=load({walkS2:false});ok(B.walks().s2.path==='assets/r128/gunner/walk-s.webp','walkS2 끄면 예전 walk-s');
console.log(JSON.stringify({passed:n}));
