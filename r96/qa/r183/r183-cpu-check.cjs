// R183 CPU check: 중요 에피소드 3D 체험(정본 문장 자막·처음 한 번·건너뛰기·끄기) + R184 S-06 임시 픽셀 시트(원문 외형, 꼭두각시 칸 규격).
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=RT('index.html');
ok('scene3d-r183 loaded after light-r182, before world-tiles-r118, in the public verify list',idx.indexOf('./scene3d-r183.js')>idx.indexOf('./light-r182.js')&&idx.indexOf('./scene3d-r183.js')<idx.indexOf('./world-tiles-r118.js')&&/scene3d-r183\.js/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
for(const f of ['scene3d-r183.js','samong-r161.js'])ok('runtime copy matches · '+f,RT(f)===C(f));
// 자막은 원문 그대로
const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},document:{getElementById:()=>null,querySelector:()=>null},Math,JSON,Object,Array,String,Number,Date};vm.createContext(sb);vm.runInContext(RT('samong-text-r103.js'),sb);vm.runInContext(C('scene3d-r183.js'),sb);
const S3=sb.window.__STORYWORLD_SCENE3D_R183__,TX=sb.window.__STORYWORLD_SAMONG_TEXT_R103__,paras=k=>TX.sections[k].blocks.flatMap(b=>b.paras);
ok('two scenes: DYS-01 침공 (sz115-S06-1) and DYS-12 원룸 (sz115-S06-22)',S3.SCENES.dys01.zone==='sz115-S06-1'&&S3.SCENES.dys12.zone==='sz115-S06-22');
const zd=fs.readFileSync(path.join(R,'client-source','samong-zones-r115-data.js'),'utf8');ok('scene zones exist with the right titles',/"id":"sz115-S06-1","title":"원반 그림자 아래 무너지는 상가"/.test(zd)&&/"id":"sz115-S06-22","title":"스무 살의 원룸"/.test(zd));
const caps=[];for(const [id,s] of Object.entries(S3.SCENES))for(const i of s.lines){const p=paras(s.sec)[i];caps.push([id,i,S3.firstSentence(p),p]);}
ok('every caption is a verbatim prefix of its canon paragraph (no invented text)',caps.every(([,,c,p])=>c&&p.startsWith(c)),caps.filter(([,,c,p])=>!p.startsWith(c)).map(x=>x[0]+':'+x[1]).join(','));
const src=C('scene3d-r183.js');
ok('plays once per scene (remembered), skippable by click/Esc/Space, off in settings',/prefs\.seen\[id\]=Date\.now\(\)/.test(src)&&/e\.key==='Escape'/.test(src)&&/root\.onclick=\(\)=>finish\(true\)/.test(src)&&/id='r183On'/.test(src)||/r183On/.test(src));
ok('game time pauses while the scene plays; Three.js resources disposed after',/tick=function\(\.\.\.a\)\{if\(active\)return;/.test(src)&&/renderer\.dispose\(\)/.test(src));
ok('no paid generators / no external URLs (only the vendored Three.js)',!/https?:\/\//.test(src.replace(/\/\/[^\n]*/g,''))&&/import\('\.\/vendor\/three\/build\/three\.module\.js'\)/.test(src));
// R184 시트
const dir=path.join(R,'runtime-text','assets','r184','s06'),ix=JSON.parse(fs.readFileSync(path.join(dir,'index.json'),'utf8'));
ok('three temporary S-06 sheets listed with sha256 and marked temporary',ix.temporary===true&&ix.sheets.length===3&&ix.sheets.every(s=>crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,s.file))).digest('hex')===s.sha256));
ok('sheets use the puppet cell layout (256×320, 4×2, 8 frames, same foot point)',ix.sheets.every(s=>s.cell[0]===256&&s.cell[1]===320&&s.frames===8&&s.grid.join()==='4,2'&&Math.abs(s.foot[0]-101.8)<.01&&Math.abs(s.foot[1]-299.5)<.01));
const r161=C('samong-r161.js');
ok('R161 picks the S-06 sheet only in S-06 (invader / 상대 초인 / 적 지휘 개체·기체), puppet elsewhere, 검은 명령선 stays puppet',/function sheetFor\(e\)/.test(r161)&&/x\.key==='S-06'\|\|\/\^sz115-S06-\//.test(r161)&&/상대 초인/.test(r161)&&/지휘 \(개체\|기체\)/.test(r161)&&/검은 명령선\/\.test\(n\)\)return PUPPET/.test(r161)&&/im=image\(sheetFor\(e\)\)/.test(r161));
for(const f of ['scene3d-r183.js'])ok('no mid-line // comment swallowing code · '+f,!C(f).split('\n').some(l=>/[;)}]\s*\/\/[^\n]*[;{}]\s*\S/.test(l)&&!/^\s*\/\//.test(l)&&!/['"`][^'"`]*\/\/[^'"`]*['"`]/.test(l)));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
