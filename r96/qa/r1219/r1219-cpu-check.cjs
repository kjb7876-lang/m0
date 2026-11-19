// R1219 환도 앞모습(아래) 걷기 칼집 — 연결·끄기·무결성 정적 검사(GPU·실기기 아님). 픽셀 검사는 qa/r1219/front_walk_check.py(Pillow 만).
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
const RT=f=>path.join(R,'runtime-text',f),rd=f=>{try{return fs.readFileSync(f);}catch(_){return null;}},sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const SRC='assets/r436/hwando/walk-s.webp',DRV='assets/r1219/r436/hwando/walk-s.webp';
const sb=rd(RT(SRC)),db=rd(RT(DRV)),meta=JSON.parse(rd(RT('assets/r1219/r436/hwando/r1219.json'))||'null');
ok('R436 원본 시트 그대로',sb&&sha(sb)==='8d8837750e4201c1da00690c749f90ce7b672b53401225dd87c6035114a1382a');
ok('파생 시트 있음·무손실 WebP',db&&db.slice(12,16).toString()==='VP8L');
ok('메타 sha·바이트·원본 sha 일치',meta&&db&&meta.sha256===sha(db)&&meta.bytes===db.length&&meta.source_sha256===sha(sb));
const dim=b=>{const v=b.readUInt32LE(21);return [(v&0x3fff)+1,((v>>14)&0x3fff)+1];};
ok('파생 시트 크기 = 원본(786×190, 6칸 131×190)',db&&String(dim(db))==='786,190'&&String(dim(sb))==='786,190');
ok('파생 경로가 원래 경로 꼬리(r436/hwando/)를 품는다 → BODY_ART 정규식 그대로 통함',/r436\/hwando\//.test(DRV)&&DRV.endsWith('/walk-s.webp'));
ok('임시본 표시(Dots 시트 전까지)',meta?.temporary===true);
for(const f of ['walk-s.webp','idle-s.webp','index.json'])ok('정식 그림 '+f+' 있음·런타임 목록',!!rd(RT('assets/r1219/r436/hwando/sheathed/'+f)));
const man=(rd(path.join(R,'runtime-manifest.json'))||'').toString(),inp=(rd(path.join(R,'runtime-inputs.json'))||'').toString();
ok('런타임 manifest·inputs 에 파생 시트·정식 그림',[DRV,'assets/r1219/r436/hwando/sheathed/walk-s.webp','assets/r1219/r436/hwando/sheathed/idle-s.webp','assets/r1219/r436/hwando/sheathed/index.json'].every(f=>man.includes(f)&&inp.includes(f)));
const src=fs.readFileSync(path.join(R,'client-source','hwando-r271.js'),'utf8');
ok('runtime-text 의 hwando-r271.js 사본 = client-source',rd(RT('hwando-r271.js'))?.toString()===src);
function boot(ls){const s={localStorage:{getItem:k=>ls[k]??null,setItem:(k,v)=>{ls[k]=v;}},console,fetch:()=>Promise.resolve({ok:false}),Date,Math,JSON,Promise,Map,Object};s.window=s;vm.createContext(s);try{vm.runInContext(src,s);}catch(e){return {err:String(e)};}return s.__STORYWORLD_HWANDO_R271__;}
const H=boot({}),sh=H?.pure?.sheath,tex=H?.pure?.tex;
ok('pure.sheath 노출',typeof sh==='function',H?.err);
if(typeof sh==='function'){
 ok('아래 걷기 v2 → 칼집 파생본',sh(SRC)===DRV);
 ok('다른 환도 시트·EGO 시트는 그대로',['assets/r283/hwando/r271/walk-e.webp','assets/r1063/r283/hwando/r271/walk-n.webp','assets/r271/hwando/walk-s.webp','assets/r1048/ego/walk-s.webp','assets/r436/hwando/index.json'].every(p=>sh(p)===p));
 ok('경계: 빈 값·문자열 아님 통과',sh('')===''&&sh(undefined)===undefined&&sh(null)===null);
 ok('R1063 tex 는 아래 걷기를 여전히 바꾸지 않는다(서로 독립)',tex(SRC)===SRC);
 const off=boot({'storyworld.r1219.hwandoSheath':'{"on":false}'});ok('끄기 키로 원래 칼 뽑은 그림',off?.pure?.sheath?.(SRC)===SRC);
 const fi=H?.pure?.frontIdle;ok('pure.frontIdle 노출(아래 방향 대기)',typeof fi==='function');
 if(typeof fi==='function'){
  ok('아래로 걷다 멈추고 적 없음 → 앞모습 서기',fi('s',null)===true);
  ok('아래로 걷다 멈추고 적이 아래쪽 → 앞모습 서기',fi('s',[10,80])===true);
  ok('적이 옆쪽(가로가 큼) → 좌·우 선 자세(R283 그대로)',fi('s',[90,20])===false&&fi('s',[-90,-20])===false);
  ok('적이 위쪽 → 좌·우 선 자세',fi('s',[5,-80])===false);
  ok('좌·우·위로 걷다 멈춤 → 앞모습 아님',['e','w','n'].every(d=>fi(d,null)===false));
  ok('경계: 잘못된 벡터·NaN 은 적 없음과 같게',fi('s',[NaN,1])===true&&fi('s','x')===true&&fi(undefined,null)===false);
  const offI=boot({'storyworld.r1219.hwandoSheath':'{"on":false}'});ok('끄기 키면 앞모습 서기도 끔',offI?.pure?.frontIdle?.('s',null)===false);}
 ok('대기에서 frontIdle 을 묻고 앞모습으로 선다',/frontIdle\(S\.lastWalk/.test(src));
 ok('R1219c: 칼집 켜짐이면 Dots 정식 걷기 색인(assets/r1219/r436/hwando/sheathed/)을 받는다',H?.pure?.walkSBase?.()==='assets/r1219/r436/hwando/sheathed/');
 {const off2=boot({'storyworld.r1219.hwandoSheath':'{"on":false}'});ok('끄기면 R436 원래 색인',off2?.pure?.walkSBase?.()==='assets/r436/hwando/');}
 ok('앞모습 서기는 Dots 서기 6칸(idle.s) 숨쉬기 루프를 쓴다',/wsIdleRes\(\)/.test(src)&&/idleS:true/.test(src));
 const bad=boot({'storyworld.r1219.hwandoSheath':'{bad'});ok('망가진 설정값이면 켜짐(기본)',bad?.pure?.sheath?.(SRC)===DRV);}
ok('그리기·미리 받기 둘 다 sheath() 를 거친다',/p=sheath\(tex\(/.test(src)&&/if\(WS\)image\(sheath\(WS_BASE\+WS\.file\)\)/.test(src));
ok('판정·피해·쿨다운 쓰기 없음(R1219 줄)',!/R1219[^\n]*(player\.hp\s*=|damage\s*=|attackCD\s*=)/.test(src));
const ego=fs.readFileSync(path.join(R,'client-source','ego-motion-r1048.js'),'utf8');ok('EGO 모션 파일은 손대지 않음',!/r1219/i.test(ego));
const wf=(rd(path.join(R,'..','.github','workflows','pages.yml'))||'').toString();ok('CI 가 이 검사를 돌린다',wf.includes('r96/qa/r1219/r1219-cpu-check.cjs'));
let n=0;for(const c of checks){if(c.pass)n++;console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass||c.detail===undefined?'':' '+JSON.stringify(c.detail)));}
console.log(`R1219 ${n}/${checks.length}`);process.exit(n===checks.length?0:1);
