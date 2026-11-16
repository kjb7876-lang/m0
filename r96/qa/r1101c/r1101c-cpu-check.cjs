// R1101c 기억사수 정 대각 조준(Dots CX-0119GD r2: GD-1 se ≈44°·GD-2 ne ≈−37°) — CPU 검사.  node r96/qa/r1101c/r1101c-cpu-check.cjs
//  ±45° 조준은 R143 se(35°)·ne(−52°)(시선 반대) 대신 se3·ne3, 낮은 각(+26°·−29°)은 R1101b se2·ne2 그대로. 왼쪽은 반전. diag3:false 면 R1101b 동작.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(R,'client-source','gunner-aim-r991.js'),'utf8');
ok(src===fs.readFileSync(path.join(R,'runtime-text','gunner-aim-r991.js'),'utf8'),'runtime-text 사본과 같음');
ok(/node r96\/qa\/r1101c\/r1101c-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
function load(pref){const win={};const sb={window:win,localStorage:{getItem:()=>pref?JSON.stringify(pref):null,setItem(){}},Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,isFinite,console,setTimeout:()=>0,document:{readyState:'loading'},addEventListener(){},player:{hero:'gunner'}};win.addEventListener=()=>{};vm.createContext(sb);vm.runInContext(src,sb);return win.__STORYWORLD_GUNNER_AIM_R991__;}
const A=load(null),D=Math.PI/180,p=d=>A.pick(d*D);
ok(/R1101c/.test(A.revision)&&/R1101b/.test(A.revision)&&/R1101-/.test(A.revision)&&/R1045d/.test(A.revision)&&/R1003/.test(A.revision),'판 R1101c(+이전 판 유지)',A.revision);
ok(p(45).sheet==='se3'&&!p(45).mirror&&p(135).sheet==='se3'&&p(135).mirror,'+45°·135° → se3(왼쪽 반전)',[p(45),p(135)]);
ok(p(-45).sheet==='ne3'&&!p(-45).mirror&&p(-135).sheet==='ne3'&&p(-135).mirror,'−45°·−135° → ne3(왼쪽 반전)',[p(-45),p(-135)]);
ok(p(26).sheet==='se2'&&p(-29).sheet==='ne2','낮은 각(+26°·−29°)은 R1101b se2·ne2 그대로',[p(26),p(-29)]);
ok(p(0).sheet==='e'&&p(90).sheet==='s2'&&p(-90).sheet==='n','옆·정 아래·정 위(사용자 승인 그림)는 그대로',[p(0),p(90),p(-90)]);
ok(A.tip('se3',0).join()==='148,129'&&A.tip('se3',7).join()==='148,137'&&A.tip('ne3',4).join()==='150,63','칸별 총구 끝(Dots 값 배율 반영)');
{const B=load({diag3:false});ok(B.pick(45*D).sheet==='se'&&B.pick(-45*D).sheet==='ne'&&!B.SHEETS.includes('se3'),'diag3:false 면 R143 se·ne(R1101b 동작)');}
{let worst=0;for(let d=-180;d<180;d++){const q=A.pick(d*D),g=A.gunAngle(q.sheet,q.mirror),e=Math.abs(Math.atan2(Math.sin(d*D-g),Math.cos(d*D-g)))/D;worst=Math.max(worst,e);}ok(worst<=41,'360° 최악 오차 41° 이하',{worst});}
const sz=f=>{const b=fs.readFileSync(path.join(R,'runtime-text','assets','r1101c','gunner',f));ok(b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP'&&b.length<200000,f+' WebP·200KB 미만',b.length);};
sz('attack-se9.webp');sz('attack-ne9.webp');
console.log(JSON.stringify({passed:n}));
