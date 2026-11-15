// R1045 기억사수 정 위 조준(Dots attack-n3)·동쪽 무반동(Dots E r6) 적용 — CPU 검사.
//  node r96/qa/r1045/r1045-cpu-check.cjs
//  R991·R1003 뒤 정 위 조준은 그림이 없어 총 각도가 33° 어긋났다(Dots CX-0085GA r2). 사용자가 "이거좋아" 한 N3 6칸과
//  사용자가 Dots 에 직접 부탁한 동쪽 무반동 E r6(6칸 같은 그림)을 192×256 칸으로 맞춰 R991 모듈의 n·e 칸에 넣는다.
//  설정 storyworld.r991.gunnerAim {"n3":false} / {"e3":false} 로 각각 예전 R143 그림으로 돌아간다.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(R,'client-source','gunner-aim-r991.js'),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text','gunner-aim-r991.js'),'utf8'),'runtime-text 사본과 같음');
function webpSize(b){if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;const t=b.toString('ascii',12,16);
 if(t==='VP8L'){const v=b.readUInt32LE(21);return[(v&0x3fff)+1,((v>>14)&0x3fff)+1];}if(t==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(t==='VP8 ')return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];return null;}
const man=JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')));
for(const f of ['attack-n3.webp','attack-e3.webp']){const p=path.join(R,'runtime-text','assets','r1045','gunner',f);ok(fs.existsSync(p),f+' 있음');
 const s=webpSize(fs.readFileSync(p));ok(s&&s[0]===1152&&s[1]===256,f+' 크기 1152×256(192×256 6칸)',s);ok(man.includes('assets/r1045/gunner/'+f),f+' runtime-manifest 에 있음');ok(fs.statSync(p).size<400000,f+' 400KB 미만',fs.statSync(p).size);}
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'assets/r1045/'"),'verify-r96-public.py 가 assets/r1045/ 를 확인');
ok(/node r96\/qa\/r1045\/r1045-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
const D=Math.PI/180,ad=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))/D;
function load(pref){const win={};const sb={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,setTimeout:()=>0,document:{readyState:'loading'},addEventListener(){}};win.addEventListener=()=>{};
 vm.createContext(sb);vm.runInContext(src,sb);return win.__STORYWORLD_GUNNER_AIM_R991__;}
const A=load(null);
ok(/R1045/.test(A.revision)&&/R1003/.test(A.revision),'판 R1045(+R1003 유지)',{rev:A.revision});
ok(A.SHEETS.includes('s2'),'R1003 s2 그대로');
const up=A.pick(-90*D),nErr=ad(-90*D,A.gunAngle(up.sheet,up.mirror));
ok(up.sheet==='n'&&nErr<=12,'정 위 조준 → n(N3 뒷모습), 총 각도 오차 ≤12° (R1003 33°)',{up,nErr});
for(let d=-102;d<=-78;d++){const p=A.pick(d*D);ok(p.sheet==='n','정 위 ±12° ('+d+'°) 는 N3 뒷모습',p);}
let worst=0;for(let d=-180;d<180;d++){const p=A.pick(d*D);worst=Math.max(worst,ad(d*D,A.gunAngle(p.sheet,p.mirror)));}ok(worst<=25+1e-6,'모든 각도 총 각도 오차 ≤25°(R1003 33°)',{worst});
const insp=JSON.stringify(A.inspect());ok(insp.includes('r1045/gunner/attack-n3.webp')&&(insp.includes('r1045/gunner/attack-e3.webp')||/R1045c/.test(A.revision)&&insp.includes('r1045c/gunner/attack-e4.webp')),'inspect 에 쓰는 그림 경로',insp.slice(0,300));
for(let f=0;f<6;f++){const t=A.tip('n',f);ok(t[0]>=118&&t[0]<=134&&t[1]>=52&&t[1]<=70,'n '+f+'칸 총구 끝이 오른 어깨 위(N3 측정 126·60~62)',t);}
const e0=JSON.stringify(A.tip('e',0));for(let f=1;f<6;f++)ok(JSON.stringify(A.tip('e',f))===e0,'e '+f+'칸 총구 끝이 첫 칸과 같음(무반동)',A.tip('e',f));
const B=load({n3:false,e3:false}),bn=B.pick(-90*D);
ok(ad(-90*D,B.gunAngle(bn.sheet,bn.mirror))>30&&!JSON.stringify(B.inspect()).includes('r1045'),'n3·e3 끄면 예전 R143 그림(정 위 오차 33°)');
ok(!/attack-n2|idle-n2/.test(src),'심사 미달 n2 후보는 쓰지 않음');
console.log(JSON.stringify({passed:n}));
