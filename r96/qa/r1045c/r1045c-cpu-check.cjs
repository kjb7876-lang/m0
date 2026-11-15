// R1045c 기억사수 좌우(동쪽) 공격·걷기 Dots r1(사용자 "괜춘한데 … 클로드 개선적용") — CPU 검사.
//  node r96/qa/r1045c/r1045c-cpu-check.cjs
//  Dots gunner-ew-r1 attack(6칸 362×724)·walk(8칸 271/272×724)을 192×256 칸으로 맞춰(공통 배율·후드 위치·발 높이) e 공격·e 걷기에 넣는다.
//  서쪽은 엔진 반전. {"e4":false} 면 R1045 e3, {"e3":false} 면 R143 그대로, {"walkE2":false} 면 R144 walk-e.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(R,'client-source','gunner-aim-r991.js'),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text','gunner-aim-r991.js'),'utf8'),'runtime-text 사본과 같음');
function webpSize(b){if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;const t=b.toString('ascii',12,16);
 if(t==='VP8L'){const v=b.readUInt32LE(21);return[(v&0x3fff)+1,((v>>14)&0x3fff)+1];}if(t==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(t==='VP8 ')return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];return null;}
const man=JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')));
for(const [f,w] of [['attack-e4.webp',1152],['walk-e2.webp',1536]]){const p=path.join(R,'runtime-text','assets','r1045c','gunner',f);ok(fs.existsSync(p),f+' 있음');
 const s=webpSize(fs.readFileSync(p));ok(s&&s[0]===w&&s[1]===256,f+' 크기 '+w+'×256',s);ok(man.includes('assets/r1045c/gunner/'+f),f+' runtime-manifest 에 있음');ok(fs.statSync(p).size<500000,f+' 500KB 미만',fs.statSync(p).size);}
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'assets/r1045c/'"),'verify-r96-public.py 가 assets/r1045c/ 를 확인');
ok(/node r96\/qa\/r1045c\/r1045c-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
function load(pref){const win={};const sb={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,setTimeout:()=>0,document:{readyState:'loading'},addEventListener(){}};win.addEventListener=()=>{};
 vm.createContext(sb);vm.runInContext(src,sb);return win.__STORYWORLD_GUNNER_AIM_R991__;}
const D=Math.PI/180,ad=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))/D;
const A=load(null);ok(/R1045c/.test(A.revision)&&/R1045b/.test(A.revision)&&/R1003/.test(A.revision),'판 R1045c(+R1045b·R1003 유지)',{rev:A.revision});
ok(A.inspect().sheets.e==='assets/r1045c/gunner/attack-e4.webp','동쪽 공격은 Dots r1',A.inspect().sheets);
ok(A.inspect().sheets.n==='assets/r1045/gunner/attack-n3.webp','사용자가 고른 정 위 n3 는 그대로');
ok((A.walks().e.path==='assets/r1045c/gunner/walk-e2.webp'||/R1045d/.test(A.revision)&&A.walks().e.path==='assets/r1045d/gunner/walk-e3.webp')&&A.walks().s2.path==='assets/r1045/gunner/walk-s2.webp','동쪽 걷기는 Dots r1, 아래 걷기 s2 그대로',A.walks());
for(let f=0;f<6;f++){const t=A.tip('e',f);ok(t[0]>=150&&t[0]<=162&&t[1]>=70&&t[1]<=84,'e '+f+'칸 총구 끝(잰 값 156·77)',t);}
const wt=A.walks().e.tip;for(let f=0;f<8;f++)ok(wt[f][0]>=158&&wt[f][0]<=172&&wt[f][1]>=72&&wt[f][1]<=86,'walk-e '+f+'칸 총구 끝(잰 값 165~166·79)',wt[f]);
for(const d of [0,180]){const p=A.pick(d*D);ok(p.sheet==='e'&&ad(d*D,A.gunAngle(p.sheet,p.mirror))<=5,'옆('+d+'°) 은 e 칸(서쪽 반전)',p);}
const B=load({e4:false,walkE2:false});ok(B.inspect().sheets.e==='assets/r1045/gunner/attack-e3.webp'&&B.walks().e.path==='assets/r144/walk/gunner/walk-e.webp','e4·walkE2 끄면 R1045 e3·R144 walk-e');
const C=load({e3:false});ok(!/r1045c/.test(C.inspect().sheets.e),'e3 끄면 R143 동쪽(옛 끄기 그대로)',C.inspect().sheets.e);
console.log(JSON.stringify({passed:n}));
