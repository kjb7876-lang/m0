// R1269 해금 전 챕터 제목 묵색 가림 — CPU 검사. 사용자 2026-11-20 "해금전에 챕터 제목 묵색으로 가려서 스포방지 시작메뉴".
//  계산 함수(splitChapter·plan·veilLen·candidates)의 정상·경계·회귀 사례, 끄기 스위치, CSS(먹 번짐·캔버스 필터 없음),
//  연결 다섯 곳(태그·sync 목록 둘·공개 확인·CI 줄), 서사 데이터·해금 판단을 바꾸지 않음을 본다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..','..','..'),R=path.join(ROOT,'r96');
let n=0,bad=0;const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined&&!c?' :: '+JSON.stringify(d):''));};
const F='chapter-veil-r1269.js',P=path.join(R,'client-source',F);
const src=fs.existsSync(P)?fs.readFileSync(P,'utf8'):'';
ok('모듈 파일이 있음 (client-source/'+F+')',src.length>0);
let cssText='';const styles=[];let store={};
const mkDoc=()=>({readyState:'complete',getElementById:id=>styles.find(s=>s.id===id)||null,createElement:()=>({id:'',textContent:''}),
 head:{appendChild:s=>{styles.push(s);cssText+=s.textContent;}},documentElement:{appendChild(){},classList:{contains:()=>false}},addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null});
let A=null;
if(src){try{const win={};const ctx={window:win,document:mkDoc(),console,setTimeout(){},setInterval(){},
 localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},MutationObserver:function(){this.observe=()=>{};this.disconnect=()=>{};}};
 ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src,ctx);A=win.__STORYWORLD_CHAPTER_VEIL_R1269__;}catch(e){ok('모듈이 가짜 문서에서 읽힘',false,String(e));}}
ok('API __STORYWORLD_CHAPTER_VEIL_R1269__ 이 있음',!!A);
const f=k=>A&&typeof A[k]==='function'?A[k]:null;
const sc=f('splitChapter'),pl=f('plan'),vl=f('veilLen'),cd=f('candidates'),en=f('enabled');
ok('splitChapter·plan·veilLen·candidates·enabled 함수가 있음',!!(sc&&pl&&vl&&cd&&en));
if(sc){
 const a=sc('제1부 — 마지막 수호자 EGO');ok('부 제목: 머리(제1부 — )와 이름을 나눔',a.head==='제1부 — '&&a.name==='마지막 수호자 EGO',a);
 const b=sc('제5부 - 카이로노미콘');ok('경계: 짧은 줄표(-)도 나눔',b.head==='제5부 - '&&b.name==='카이로노미콘',b);
 const c=sc('제6부 – 두 사람의 성');ok('경계: en 줄표(–)도 나눔',c.head==='제6부 – '&&c.name==='두 사람의 성',c);
 const d=sc('에필로그');ok('줄표 없음 → 전체가 이름',d.head===''&&d.name==='에필로그',d);
 const e=sc(null);ok('회귀: null → 빈 값, 던지지 않음',e.head===''&&e.name==='',e);
 const g=sc('제7부 — 파란불 — 아래의 사람들');ok('경계: 줄표가 둘이면 첫 줄표에서만 나눔',g.head==='제7부 — '&&g.name==='파란불 — 아래의 사람들',g);
}
const REG=[{id:'hub',title:'마수궁 피난 거점',chapterIndex:0},{id:'tree',title:'악마화 나무의 정원',chapterIndex:0},{id:'cave',title:'거미동굴',chapterIndex:0},
 {id:'p2a',title:'기억하지 못하는 사람',chapterIndex:1},{id:'p2b',title:'솔로몬의 봉인식',chapterIndex:1},{id:'p3a',title:'방어의 군단',chapterIndex:2}];
const CH=['제1부 — 마지막 수호자 EGO','제2부 — 일곱 개의 귀와 하이테크 축귀','제3부 — 통제자의 열일곱 단계','제4부 — 빈 장'];
if(pl){
 const p=pl(REG,CH,id=>id==='hub'||id==='tree');
 ok('잠긴 지역만 locked (거미동굴·2부·3부), 열린 거점·정원은 아님',p.regions.cave===true&&p.regions.p2a===true&&p.regions.p3a===true&&p.regions.hub===false&&p.regions.tree===false,p.regions);
 ok('열린 지역이 있는 1부는 열림, 2·3부는 잠김',p.chapters[0]===false&&p.chapters[1]===true&&p.chapters[2]===true,p.chapters);
 ok('경계: 지역이 하나도 없는 장(4부)은 잠김(열린 것이 없으므로)',p.chapters[3]===true,p.chapters);
 const q=pl(REG,CH,id=>id==='p2b');ok('회귀: 뒤쪽 장의 지역 하나만 열려도(777·저장 복원) 그 장은 열림',q.chapters[1]===false&&q.regions.p2a===true&&q.regions.p2b===false,q);
 const all=pl(REG,CH.slice(0,3),()=>true);ok('모두 열림(777) → 가릴 것 없음(지역이 있는 장)',Object.values(all.regions).every(v=>v===false)&&Object.values(all.chapters).every(v=>v===false));
 const th=pl(REG,CH,()=>{throw new Error('x');});ok('회귀: 해금 판단이 던지면 가리지 않음(화면을 망가뜨리지 않음)',Object.values(th.regions).every(v=>v===false)&&Object.values(th.chapters).every(v=>v===false),th);
 const nn=pl(null,null,()=>false);ok('경계: 목록 없음 → 빈 계획',nn&&Object.keys(nn.regions).length===0&&Object.keys(nn.chapters).length===0);
}
if(vl){
 ok('veilLen: 이름 길이를 따름',vl('거미동굴')===4&&vl('악마화 나무의 정원')===10);
 ok('경계: 최소 2칸',vl('성')===2&&vl('')===2&&vl(null)===2);
 ok('경계: 최대 12칸(긴 이름도 줄을 넘지 않음)',vl('가'.repeat(40))===12);
}
if(cd&&pl){
 const p=pl([{id:'a',title:'추락',chapterIndex:0},{id:'b',title:'추락한 별',chapterIndex:0}],['제1부 — 별의 장'],id=>id==='b');
 const c=cd([{id:'a',title:'추락',chapterIndex:0},{id:'b',title:'추락한 별',chapterIndex:0}],['제1부 — 별의 장'],p);
 ok('후보는 긴 이름 먼저(열린 "추락한 별"이 잠긴 "추락"보다 앞)',c.length>=2&&c[0].name==='추락한 별'&&c[0].locked===false,c);
 ok('잠긴 "추락"은 locked 후보',c.some(x=>x.name==='추락'&&x.locked===true),c);
 const c2=cd(REG,CH,pl(REG,CH,id=>id==='hub'));ok('잠긴 장 이름도 후보(일곱 개의 귀와 하이테크 축귀)',c2.some(x=>x.name==='일곱 개의 귀와 하이테크 축귀'&&x.locked===true));
 ok('회귀: 빈 이름은 후보에 없음',c2.every(x=>x.name&&x.name.length>0));
}
if(en){store={};ok('기본은 켜짐',en()===true);store['storyworld.r1269.veil']='0';ok("끄기: localStorage storyworld.r1269.veil='0'",en()===false);store={};}
// CSS
ok('먹 번짐 CSS(.r1269Veil)가 들어감',/\.r1269Veil\s*\{/.test(cssText),cssText.slice(0,200));
ok('가림 글자는 투명(color:transparent)',/\.r1269Veil[^}]*color:\s*transparent/.test(cssText));
ok('잠긴 지역 그림도 흐림(r1269Locked img)',/r1269Locked[^{]*img[^}]*filter/.test(cssText));
ok('한지 창(r1086Hanji)에서 따로 맞춤',/r1086Hanji[^{]*\.r1269Veil/.test(cssText));
ok('캔버스 ctx.filter 를 건드리지 않음',!/ctx\.filter|\.filter\s*=/.test(src));
ok('서사 데이터·해금 판단을 바꾸지 않음(regions·chapters·progress 대입 없음, isUnlocked 덮어쓰기 없음)',src&&!/\b(regions|chapters|progress|canonicalRecords)\s*=[^=]/.test(src)&&!/isUnlocked\s*=[^=]/.test(src)&&!/chapterOpen\s*=[^=]/.test(src));
// 연결
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
const t=s=>html.indexOf('<script src="./'+s+'">');
ok('runtime-text 사본이 client-source 와 같음',src.length>0&&fs.existsSync(path.join(R,'runtime-text',F))&&fs.readFileSync(path.join(R,'runtime-text',F),'utf8')===src);
ok('index.html: 자기 줄, save-guard-r1248 바로 뒤·boot-lean-r1038 앞',/\n<script src="\.\/save-guard-r1248\.js"><\/script>\n<script src="\.\/chapter-veil-r1269\.js"><\/script>\n<script src="\.\/boot-lean-r1038\.js"><\/script>/.test(html));
ok('index.html 에 한 번만',(html.match(/chapter-veil-r1269\.js/g)||[]).length===1);
ok('combat-r118 보다 앞(끝 두 태그 규칙)',t(F)>0&&t('combat-r118.js')>t(F));
ok('verify-r96-public.py 기대 목록에 있음',/'chapter-veil-r1269\.js'/.test(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8')));
ok('runtime-inputs·manifest 목록에 있음',/"chapter-veil-r1269\.js"/.test(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'))&&/"chapter-veil-r1269\.js"/.test(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')));
ok('pages.yml 에 이 CPU 검사 줄',/node r96\/qa\/r1269\/r1269-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
console.log(`\n${n-bad}/${n} 통과`);process.exit(bad?1:0);
