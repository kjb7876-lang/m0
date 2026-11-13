// R1003 기억사수 정 아래 조준 그림(Dots s2) 적용 — CPU 검사.
//  node r96/qa/r1003/r1003-cpu-check.cjs
//  R991 은 그림이 없어 정 아래 조준이 40° 어긋났다. Dots 가 그린 attack-s2·idle-s2(7분야 심사 통과분)를 R991 모듈에 등록한다.
//  정 위(n2) 후보 2종은 심사 미달로 넣지 않았다(review.md) → 정 위 오차 33° 는 그대로이며 이 검사도 그걸 확인한다.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(R,'client-source','gunner-aim-r991.js'),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text','gunner-aim-r991.js'),'utf8'),'runtime-text 사본과 같음');
// webp 크기 읽기(VP8L/VP8X/VP8)
function webpSize(b){if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;const t=b.toString('ascii',12,16);
 if(t==='VP8L'){const v=b.readUInt32LE(21);return[(v&0x3fff)+1,((v>>14)&0x3fff)+1];}if(t==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(t==='VP8 ')return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];return null;}
const man=JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')));
for(const [f,w] of [['attack-s2.webp',1152],['idle-s2.webp',768]]){const p=path.join(R,'runtime-text','assets','r1003','gunner',f);ok(fs.existsSync(p),f+' 있음');
 const s=webpSize(fs.readFileSync(p));ok(s&&s[0]===w&&s[1]===256,f+' 크기 '+w+'×256(192×256 칸)',s);ok(man.includes('assets/r1003/gunner/'+f),f+' runtime-manifest 에 있음');ok(fs.statSync(p).size<400000,f+' 400KB 미만',fs.statSync(p).size);}
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'assets/r1003/'"),'verify-r96-public.py 가 assets/r1003/ 를 확인');
ok(/node r96\/qa\/r1003\/r1003-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(!/attack-n2|idle-n2/.test(src),'심사 미달 n2 후보는 쓰지 않음');
const win={};const sb={window:win,localStorage:{getItem:()=>null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,setTimeout:()=>0,document:{readyState:'loading'},addEventListener(){}};win.addEventListener=()=>{};
vm.createContext(sb);vm.runInContext(src,sb);const A=win.__STORYWORLD_GUNNER_AIM_R991__,D=Math.PI/180,ad=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))/D;
ok(A.SHEETS.includes('s2')&&/R1003/.test(A.revision),'s2 칸 등록·판 R1003',{rev:A.revision});
const p90=A.pick(90*D);ok(p90.sheet==='s2'&&!p90.mirror&&ad(90*D,A.gunAngle('s2',false))<=5,'정 아래 조준 → s2, 총 각도 오차 ≤5° (R991 40°)',p90);
for(let d=75;d<=105;d++){const p=A.pick(d*D);ok(p.sheet==='s2'&&!p.mirror,'정 아래 ±15° ('+d+'°) 는 반전 없는 s2',p);}
let mir=0;for(let d=-180;d<180;d++){const p=A.pick(d*D);if(p.sheet==='s2'&&p.mirror)mir++;}ok(mir===0,'s2 는 반전해 쓰지 않음(대칭 앞모습)',{mir});
const nErr=ad(-90*D,A.gunAngle(A.pick(-90*D).sheet,A.pick(-90*D).mirror));ok(nErr>30,'정 위는 그림이 없어 그대로(오차 '+nErr.toFixed(0)+'°) — 남은 Dots 과제',{nErr});
for(let f=0;f<6;f++){const t=A.tip('s2',f);ok(t[0]>=85&&t[0]<=103&&t[1]>=120&&t[1]<=140,'s2 '+f+'칸 총구 끝이 몸 가운데 가슴 높이(정면 원근)',t);}
console.log(JSON.stringify({passed:n}));
