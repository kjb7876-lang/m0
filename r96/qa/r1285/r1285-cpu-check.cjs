// R1285 CPU 검사 — 작은 폰 가로 화면 페르소나 결전 HUD 비키기(persona-hud-clear-r1285.js): 연결·조건·몸 상자 계산.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..'),F='persona-hud-clear-r1285.js',SRC=path.join(R,'client-source',F);
let n=0,bad=0;const check=(name,ok,d)=>{n++;if(!ok)bad++;console.log((ok?'PASS ':'FAIL ')+name+(d!==undefined&&!ok?' — '+JSON.stringify(d):''));};
check('① client-source 파일 있음',fs.existsSync(SRC));if(!fs.existsSync(SRC)){console.log(`R1285 CPU: ${n-bad}/${n}`);process.exit(1);}
const src=fs.readFileSync(SRC,'utf8');
const rt=path.join(R,'runtime-text',F);check('② runtime-text 사본 = client-source',fs.existsSync(rt)&&fs.readFileSync(rt,'utf8')===src);
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');const tag=`<script src="./${F}"></script>`;
check('③ index.html 태그 1개, 페르소나 W·E·R(R1144) 뒤·R1104 뒤',html.split(tag).length===2&&html.indexOf(tag)>html.indexOf('./persona-wer-r1144.js')&&html.indexOf(tag)>html.indexOf('./persona-stride-r1104.js'));
const ver=fs.readFileSync(path.join(R,'../scripts/verify-r96-public.py'),'utf8');check('④ 공개 확인 기대 목록에 있음',ver.includes(`'${F}'`));
const yml=fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8');check('⑤ pages.yml 에 이 검사 줄',yml.includes('node r96/qa/r1285/r1285-cpu-check.cjs'));
const inputs=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');check('⑥ runtime-inputs 에 들어감',inputs.includes(F));
// 정적: 버튼·판정·카메라·몸 그림 손대지 않음
check('⑦ 몸 그림 명령을 바꾸지 않음(points·sourceRect 대입 없음)',!/\.points\s*=|\.sourceRect\s*=|splice\(/.test(src));
check('⑧ 카메라·판정·버튼 손대지 않음',!/camera|zoom\s*=|hitEnemy|damage|#dodge|#heroBtn|pointer-events/.test(src));
check('⑨ 작은 가로 화면 조건: 가로 + 높이 430 이하',/w>h&&h<=MAX_H/.test(src)&&/MAX_H=430/.test(src));
check('⑩ 반투명 값 .38 (패널을 감추지 않음, 0.3 이상)',/FADE=\.38/.test(src));
// 실행: 가짜 창
function sandbox({w=812,h=375,persona=true}={}){const cls=new Set();const els={};const mk=id=>({id,classList:{_s:new Set(),contains(c){return this._s.has(c)},toggle(c,v){v?this._s.add(c):this._s.delete(c)}},getBoundingClientRect:()=>id==='bossbar'?{left:256,top:8,right:556,bottom:40,width:300,height:32}:id==='heroCard'?{left:8,top:250,right:198,bottom:329,width:190,height:79}:{left:0,top:0,right:812,bottom:337,width:812,height:337}});
 for(const id of ['bossbar','heroCard','game'])els[id]=mk(id);
 const doc={documentElement:{classList:{toggle(c,v){v?cls.add(c):cls.delete(c)}}},head:{appendChild(){}},getElementById:id=>els[id]||null,createElement:()=>({getContext:()=>null})};
 const s={window:null,document:doc,localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>s.__t+=100},__t:0,setInterval:()=>0,W:812,
  room:{enemies:persona?[{persona:true,hp:10,x:1,y:1,kind:'enemy'}]:[]},console};s.window=s;s.innerWidth=w;s.innerHeight=h;s.addEventListener=()=>{};
 vm.createContext(s);vm.runInContext(src,s);return {s,cls,els,api:s.__STORYWORLD_PERSONA_HUD_R1285__};}
const body=(y0)=>({kind:'image',sourcePath:'assets/rc133/art/base-0.png',owner:{kind:'enemy'},points:[[480,y0],[580,y0],[580,y0+120],[480,y0+120]],sourceRect:[0,0,344,400],image:null});
{const {cls,els,api}=sandbox();api.process([body(30)]);check('⑪ 812x375 페르소나 결전: tight 켜짐',cls.has('r1285-tight'));
 check('⑫ 몸이 위 패널 근처면 위 패널만 반투명',els.bossbar.classList.contains('r1285-see')&&!els.heroCard.classList.contains('r1285-see'));
 api.process([body(140)]);check('⑬ 몸이 멀어지면 반투명 풀림',!els.bossbar.classList.contains('r1285-see'));}
{const {cls,api}=sandbox({w:1280,h:720});api.process([body(30)]);check('⑭ PC 1280x720 에선 안 켜짐',!cls.has('r1285-tight'));}
{const {cls,api}=sandbox({w:375,h:812});api.process([body(30)]);check('⑮ 세로 화면에선 안 켜짐',!cls.has('r1285-tight'));}
{const {cls,api}=sandbox({persona:false});api.process([body(30)]);check('⑯ 페르소나 결전 아니면 안 켜짐',!cls.has('r1285-tight'));}
{const {api}=sandbox();const b=api.visible(body(100));check('⑰ 그림 못 읽을 때 근사 상자(위 18%·좌우 22% 덜어 냄)',b&&Math.abs(b[1]-(100+120*.18))<.01&&Math.abs(b[0]-(480+100*.22))<.01,b);
 check('⑱ 영웅·다른 몹 명령은 몸으로 안 봄',api.bodyBox([{...body(10),owner:{kind:'hero'}},{...body(10),sourcePath:'assets/mob.png'}])===null);
 const nan={...body(10)};nan.points=[[NaN,0],[1,0],[1,1],[0,1]];check('⑲ NaN 좌표 명령은 건너뜀',api.bodyBox([nan])===null);}
{const {cls,api}=sandbox();api.set(false);api.process([body(30)]);check('⑳ 끄기 설정이면 안 켜짐',!cls.has('r1285-tight'));api.set(true);}
console.log(`R1285 CPU: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
