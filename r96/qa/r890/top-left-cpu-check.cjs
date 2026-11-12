// R890 — 보스맵 서사 창·기억 조각 종이를 왼쪽 위로 옮기고, 왼쪽 위 길잡이 한 줄('다음 기억은 X입니다… → X')을 짧게 한 번만 적는다.
//  글 내용은 바꾸지 않고 위치·중복만. 헤드리스 CPU 검사(가짜 document) — 그래픽·실플레이 검증 아님.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const file=path.join(R,'client-source','top-left-r890.js');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
let src='';try{src=fs.readFileSync(file,'utf8');}catch(e){ok('top-left-r890.js 가 있다',false,String(e.message));}
function mk({questBottom=70,hasQuest=true,H=720}={}){
 const els={};const mkEl=id=>({id,textContent:'',style:{props:{},setProperty(k,v){this.props[k]=v;}},getBoundingClientRect:()=>({top:8,bottom:questBottom,height:questBottom-8})});
 els.questInlineSummary=mkEl('questInlineSummary');els.questText=mkEl('questText');els.questDestination=mkEl('questDestination');if(hasQuest)els.quest=mkEl('quest');
 const styles=[];const root={style:{props:{},setProperty(k,v){this.props[k]=v;}}};
 const timers=[];
 const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,
  localStorage:{getItem:()=>null,setItem(){}},innerHeight:H,innerWidth:1280,
  document:{documentElement:root,getElementById:id=>id==='r890Css'?styles.find(s=>s.id==='r890Css')||null:els[id]||null,createElement:()=>({style:{},id:'',textContent:''}),head:{appendChild(s){styles.push(s);}},body:{}},
  setInterval:(f,ms)=>{timers.push(f);return timers.length;},
  started:true,updateHUD:function(){els.questInlineSummary.textContent=sb.__hud||'';}};
 sb.window=sb;if(src){vm.createContext(sb);vm.runInContext(src,sb);}return {sb,els,styles,root,timers};}
const T=mk();const API=T.sb.__STORYWORLD_TOPLEFT_R890__;
ok('모듈이 __STORYWORLD_TOPLEFT_R890__ 을 연다',API&&typeof API.summarize==='function'&&typeof API.place==='function',Object.keys(API||{}));
if(API&&API.summarize){
 const S=API.summarize;
 // ① 정상 경로: 같은 목적지를 두 번 적던 문장
 ok('다음 기억 안내는 짧게 한 번만',S('다음 기억은 악마화 나무의 정원입니다. 열린 길로 이동하세요. → 악마화 나무의 정원')==='다음 기억 → 악마화 나무의 정원',S('다음 기억은 악마화 나무의 정원입니다. 열린 길로 이동하세요. → 악마화 나무의 정원'));
 for(const n of ['잠들지 못하는 마을','지옥의 문','거울의 제단','Z']){const r=S('다음 기억은 '+n+'입니다. 열린 길로 이동하세요. → '+n);ok('다른 지역('+n+')도 같은 짧은 꼴',r==='다음 기억 → '+n&&r.split(n).length===2,r);}
 // 사몽 모양(' · ')
 ok('사몽 모양 '+'(글 · 목적지)에서도 같은 목적지를 한 번만',S('다음 기억은 하늘 정원입니다. 열린 길로 이동하세요. · 하늘 정원')==='다음 기억 → 하늘 정원',S('다음 기억은 하늘 정원입니다. 열린 길로 이동하세요. · 하늘 정원'));
 // ② 경계값
 ok('빈 값·없는 값은 빈 글',S('')===''&&S(undefined)===''&&S(null)==='');
 ok('화살표 없는 글은 그대로',S('열린 지역을 살펴 다음 기억으로 향하세요.')==='열린 지역을 살펴 다음 기억으로 향하세요.');
 ok('목적지가 글에 없으면 그대로(중앙 전투실 안내)',S('두 갈래 길 돌파 · 중앙 전투실로 이동')==='두 갈래 길 돌파 · 중앙 전투실로 이동');
 ok('목적지가 다른 안내는 그대로(쉼터)',S('쉼터의 서사를 읽고 다음 기억으로 이어가세요. → 쉼터')==='쉼터의 서사를 읽고 다음 기억으로 이어가세요. → 쉼터');
 ok('다시 돌려도 같다(겹쳐 감싸도 안전)',S(S('다음 기억은 가나다입니다. 열린 길로 이동하세요. → 가나다'))===S('다음 기억은 가나다입니다. 열린 길로 이동하세요. → 가나다'));
 ok('목적지 글자수와 무관하게 24자 이내(아주 긴 이름 빼고)',S('다음 기억은 악마화 나무의 정원입니다. 열린 길로 이동하세요. → 악마화 나무의 정원').length<=24);
 // 회귀: 현재 지역 안내는 건드리지 않는다
 ok('현재 지역 안내는 그대로',S('현재 기억을 완료하면 X이(가) 열립니다. → 현재 지역 · 잠들지 못하는 마을')==='현재 기억을 완료하면 X이(가) 열립니다. → 현재 지역 · 잠들지 못하는 마을');
}
// ③ updateHUD 감싸기
{const t=mk();t.sb.__hud='다음 기억은 악마화 나무의 정원입니다. 열린 길로 이동하세요. → 악마화 나무의 정원';t.sb.updateHUD();
 ok('updateHUD 뒤 길잡이 한 줄이 짧아진다',t.els.questInlineSummary.textContent==='다음 기억 → 악마화 나무의 정원',t.els.questInlineSummary.textContent);
 t.sb.__hud='';t.sb.updateHUD();ok('빈 줄도 안 깨짐',t.els.questInlineSummary.textContent==='');}
// ④ 위치: 쪽지·서사 창이 길잡이 패널 아래 왼쪽으로
{const t=mk({questBottom:70});t.sb.__STORYWORLD_TOPLEFT_R890__?.place?.();const v=t.root.style.props['--r890-top'];ok('길잡이 패널 바닥+8px 아래에서 시작',v==='78px',v);}
{const t=mk({hasQuest:false});t.sb.__STORYWORLD_TOPLEFT_R890__?.place?.();const v=t.root.style.props['--r890-top'];ok('패널이 없으면 12px',v==='12px',v);}
{const t=mk({questBottom:900,H:720});t.sb.__STORYWORLD_TOPLEFT_R890__?.place?.();const v=t.root.style.props['--r890-top'];ok('패널이 아주 커도 화면 40% 안(288px)',v==='288px',v);}
{const t=mk();const css=(t.styles.find(s=>s.id==='r890Css')||{}).textContent||'';
 ok('R177 종이는 왼쪽(left)·right:auto',/#r177Doc\{[^}]*left:[^;}]*;[^}]*right:auto/.test(css)||/#r177Doc\{[^}]*right:auto[^}]*left:/.test(css),css.slice(0,200));
 ok('R177 종이 위치가 --r890-top',/#r177Doc\{[^}]*top:var\(--r890-top/.test(css));
 ok('R255 서사 창은 왼쪽 위(flex-start)',/#modal\.r255\{[^}]*justify-content:flex-start/.test(css)&&/#modal\.r255\{[^}]*align-items:flex-start/.test(css),css.slice(0,300));
 ok('R255 서사 종이 위 여백이 --r890-top',/#panel\.r255-doc\{[^}]*var\(--r890-top/.test(css));
 ok('폰(700px 이하)·R255 아래쪽 배치는 건드리지 않음(데스크톱 전용 미디어)',/@media\s*\(min-width:\s*701px\)/.test(css)&&!/max-width:\s*700px/.test(css));
 ok('길잡이 한 줄은 줄바꿈(잘림 없음)',/#questInlineSummary\{[^}]*white-space:normal/.test(css)&&/text-overflow:clip/.test(css));}
const bad=checks.filter(c=>!c.pass);for(const c of checks)console.log(c.pass?'PASS':'FAIL',c.name,c.pass?'':JSON.stringify(c.detail||'').slice(0,240));
console.log(checks.length-bad.length+'/'+checks.length+' passed');process.exit(bad.length?1:0);
