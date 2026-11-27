// R1354 보라검 추격천사(mb-dist01) 3D 를 Dots SW-R1354-11 r2(HF 시범판 정리 + 새 뼈대·동작)로 교체 — 정적 검사.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const s=String(rd('client-source/mob-3d-r1329.js')||'');ok(String(rd('runtime-text/mob-3d-r1329.js')||'')===s,'runtime-text 사본 같음');
const NEW='assets/r1329/SW-R1354-11_violet_sword_angel-r2.glb',OLD='assets/r1329/SW-R1329-02_violet_sword_angel.glb';
const line=(s.match(/\n\s*violetAngel:\{[^\n]*/)||[''])[0];
ok(line.includes("glb:'"+NEW+"'"),'보라검천사가 새 Dots r2 모델을 씀');
ok(/test:\/mb-dist01\//.test(line)&&/boss:true/.test(line),'2D 경로 줄기·중간보스 표시는 그대로');
ok(!!rd('runtime-text/'+OLD),'예전 R1329 모델 파일은 지우지 않음(원본 보존)');
const b=rd('runtime-text/'+NEW);ok(!!b,'새 모델 파일 있음');
if(b){ok(crypto.createHash('sha256').update(b).digest('hex')==='28444f31414547a556b4773b69249c8379431d797318b8fb53b33ebac36c9815','새 모델 = 손질본(webp 1024·meshopt, Dots 양자화 유지) 바이트');ok(b.length<=2500000,'2.5MB 이하('+b.length+')');
 const jl=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+jl).toString());const names=(j.animations||[]).map(a=>a.name);
 ok(['Idle','Walk','Attack','Attack_Special','Cast','Hit','Death'].every(n=>names.includes(n)),'클립 7개 '+names.join(','));
 ok((j.skins||[]).length>=1&&j.skins.every(k=>k.joints.length>=30),'스킨 있음·뼈 30개 이상');}
console.log(fail?'R1354 cpu-check FAIL '+fail:'R1354 cpu-check PASS');process.exit(fail?1:0);
