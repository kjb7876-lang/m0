// R1257 환도 방향별 머리 크기 맞춤 — 연결·끄기·무결성 정적 검사(GPU·실기기 아님). 픽셀 검사는 qa/r1257/head_check.py(Pillow 만).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const RT=f=>path.join(R,'runtime-text',f),rd=f=>{try{return fs.readFileSync(f);}catch(_){return null;}};
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const MAP={'assets/r1219/r436/hwando/sheathed/walk-s.webp':'assets/r1257/r1219/r436/hwando/sheathed/walk-s.webp',
 'assets/r1219/r436/hwando/sheathed/idle-s.webp':'assets/r1257/r1219/r436/hwando/sheathed/idle-s.webp',
 'assets/r1063/r283/hwando/r271/walk-n.webp':'assets/r1257/r1063/r283/hwando/r271/walk-n.webp',
 'assets/r1063/r283/hwando/r242/hit-n.webp':'assets/r1257/r1063/r283/hwando/r242/hit-n.webp',
 'assets/r1063/r283/hwando/r242/hit-e.webp':'assets/r1257/r1063/r283/hwando/r242/hit-e.webp'};
const src=fs.readFileSync(path.join(R,'client-source','hwando-r271.js'),'utf8');
ok('runtime-text 의 hwando-r271.js 사본 = client-source',rd(RT('hwando-r271.js'))?.toString()===src);
function boot(ls){const s={localStorage:{getItem:k=>ls[k]??null,setItem:(k,v)=>{ls[k]=v;}},console,fetch:()=>Promise.resolve({ok:false}),Date,Math,JSON,Promise,Map,Object};s.window=s;vm.createContext(s);try{vm.runInContext(src,s);}catch(e){return {err:String(e)};}return s.__STORYWORLD_HWANDO_R271__;}
const H=boot({}),hd=H?.pure?.head;
ok('pure.head 노출',typeof hd==='function',H?.err);
if(typeof hd==='function'){
 for(const [a,b] of Object.entries(MAP))ok('앞·뒤·옆 피격 → 머리 맞춘 파생본 '+a.split('/').slice(-2).join('/'),hd(a)===b,hd(a));
 ok('좌·우 걷기·공격(기준)·EGO 시트·R436 원본은 그대로',['assets/r1063/r283/hwando/r271/walk-e.webp','assets/r1063/r283/hwando/r271/walk-w.webp','assets/r1063/r439/hwando/attack-e.webp','assets/r1048/ego/walk-s.webp','assets/r436/hwando/walk-s.webp','assets/r1219/r436/hwando/sheathed/index.json'].every(p=>hd(p)===p));
 ok('경계: 빈 값·문자열 아님 통과',hd('')===''&&hd(undefined)===undefined&&hd(null)===null&&hd(5)===5);
 ok('두 번 거쳐도 같은 값(파생 경로는 다시 바꾸지 않음)',Object.values(MAP).every(p=>hd(p)===p));
 const off=boot({'storyworld.r1257.hwandoHead':'{"on":false}'});ok('끄기 키로 원래 그림',Object.keys(MAP).every(p=>off?.pure?.head?.(p)===p));
 const bad=boot({'storyworld.r1257.hwandoHead':'{bad'});ok('망가진 설정값이면 켜짐(기본)',bad?.pure?.head?.(Object.keys(MAP)[0])===Object.values(MAP)[0]);
 ok('R1219 sheath·R1063 tex 는 그대로(서로 독립)',H.pure.sheath('assets/r436/hwando/walk-s.webp')==='assets/r1219/r436/hwando/walk-s.webp'&&H.pure.tex('assets/r1219/r436/hwando/sheathed/walk-s.webp')==='assets/r1219/r436/hwando/sheathed/walk-s.webp');}
ok('그리기·미리 받기 모두 image() 안에서 head() 를 거친다',/function image\(p0\)\{const p=head\(p0\)/.test(src));
ok('그리는 명령의 sourcePath 도 파생 경로',/sourcePath:head\(p\)/.test(src));
ok('파생 경로가 원래 경로 꼬리(/hwando/)를 품는다 → BODY_ART·EGO 가드 정규식 그대로',Object.values(MAP).every(p=>/r436\/hwando\/|r283\/hwando\//.test(p)&&/\/hwando\//.test(p)));
for(const p of Object.values(MAP))ok('파생 시트 있음 '+p,!!rd(RT(p)));
const man=(rd(path.join(R,'runtime-manifest.json'))||'').toString(),inp=(rd(path.join(R,'runtime-inputs.json'))||'').toString();
ok('런타임 manifest·inputs 에 파생 시트·메타',[...Object.values(MAP),'assets/r1257/r1257.json'].every(f=>man.includes(f)&&inp.includes(f)));
ok('판정·피해·쿨다운 쓰기 없음(R1257 줄)',!/R1257[^\n]*(player\.hp\s*=|damage\s*=|attackCD\s*=)/.test(src));
const ego=fs.readFileSync(path.join(R,'client-source','ego-motion-r1048.js'),'utf8');ok('EGO 모션 파일은 손대지 않음',!/r1257/i.test(ego));
const wf=(rd(path.join(R,'..','.github','workflows','pages.yml'))||'').toString();ok('CI 가 이 검사를 돌린다',wf.includes('r96/qa/r1257/r1257-cpu-check.cjs')&&wf.includes('r96/qa/r1257/head_check.py'));
let n=0;for(const c of checks){if(c.pass)n++;console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass||c.detail===undefined?'':' '+JSON.stringify(c.detail)));}
console.log(`R1257 ${n}/${checks.length}`);process.exit(n===checks.length?0:1);
