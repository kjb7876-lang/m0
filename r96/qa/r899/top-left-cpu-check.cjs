// R899 — 보스맵 서사 창·기억 조각 종이를 왼쪽 위로 옮기고, 왼쪽 위 길잡이 한 줄('다음 기억은 X입니다… → X')을 짧게 한 번만 적는다.
//  글 내용은 바꾸지 않고 위치·중복만. 헤드리스 CPU 검사(가짜 document) — 그래픽·실플레이 검증 아님.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const file=path.join(R,'client-source','top-left-r899.js');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
let src='';try{src=fs.readFileSync(file,'utf8');}catch(e){ok('top-left-r899.js 가 있다',false,String(e.message));}
function mk({questBottom=70,hasQuest=true,H=720}={}){
 const els={};const mkEl=id=>({id,textContent:'',style:{props:{},setProperty(k,v){this.props[k]=v;}},getBoundingClientRect:()=>({top:8,bottom:questBottom,height:questBottom-8})});
 els.questInlineSummary=mkEl('questInlineSummary');els.questText=mkEl('questText');els.questDestination=mkEl('questDestination');if(hasQuest)els.quest=mkEl('quest');
 const styles=[];const root={style:{props:{},setProperty(k,v){this.props[k]=v;}}};
 const timers=[];
 const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,
  localStorage:{getItem:()=>null,setItem(){}},innerHeight:H,innerWidth:1280,
  document:{documentElement:root,getElementById:id=>id==='r899Css'?styles.find(s=>s.id==='r899Css')||null:els[id]||null,createElement:()=>({style:{},id:'',textContent:''}),head:{appendChild(s){styles.push(s);}},body:{}},
  setInterval:(f,ms)=>{timers.push(f);return timers.length;},
  started:true,updateHUD:function(){els.questInlineSummary.textContent=sb.__hud||'';els.questText.textContent=sb.__goal||'';}};
 sb.window=sb;if(src){vm.createContext(sb);vm.runInContext(src,sb);}return {sb,els,styles,root,timers};}
const T=mk();const API=T.sb.__STORYWORLD_TOPLEFT_R899__;
ok('모듈이 __STORYWORLD_TOPLEFT_R899__ 을 연다',API&&typeof API.summarize==='function'&&typeof API.place==='function',Object.keys(API||{}));
if(API&&API.summarize){
 const S=API.summarize;
 // ① 정상 경로(사용자 2026-11-12 11:14Z "다음기억은 악마화나무 정원입니다. 이게 나오는게 오류 … 그냥 맵이름만 나오면") — 이 안내는 아예 내지 않는다
 ok('다음 기억 안내는 내지 않는다(빈 글)',S('다음 기억은 악마화 나무의 정원입니다. 열린 길로 이동하세요. → 악마화 나무의 정원')==='',S('다음 기억은 악마화 나무의 정원입니다. 열린 길로 이동하세요. → 악마화 나무의 정원'));
 for(const n of ['잠들지 못하는 마을','지옥의 문','거울의 제단','Z']){const r=S('다음 기억은 '+n+'입니다. 열린 길로 이동하세요. → '+n);ok('다른 지역('+n+')도 내지 않는다',r==='',r);}
 ok('사몽 모양(글 · 목적지)도 내지 않는다',S('다음 기억은 하늘 정원입니다. 열린 길로 이동하세요. · 하늘 정원')==='');
 ok('목적지 꼬리 없이 문장만 와도 내지 않는다',S('다음 기억은 악마화 나무의 정원입니다. 열린 길로 이동하세요.')==='');
 ok('R899 첫 판의 짧은 꼴(다음 기억 → X)도 내지 않는다',S('다음 기억 → 악마화 나무의 정원')==='');
 // ② 경계값
 ok('빈 값·없는 값은 빈 글',S('')===''&&S(undefined)===''&&S(null)==='');
 ok('화살표 없는 글은 그대로',S('열린 지역을 살펴 다음 기억으로 향하세요.')==='열린 지역을 살펴 다음 기억으로 향하세요.');
 ok('목적지가 글에 없으면 그대로(중앙 전투실 안내)',S('두 갈래 길 돌파 · 중앙 전투실로 이동')==='두 갈래 길 돌파 · 중앙 전투실로 이동');
 ok('목적지가 다른 안내는 그대로(쉼터)',S('쉼터의 서사를 읽고 다음 기억으로 이어가세요. → 쉼터')==='쉼터의 서사를 읽고 다음 기억으로 이어가세요. → 쉼터');
 ok('다시 돌려도 같다(겹쳐 감싸도 안전)',S(S('다음 기억은 가나다입니다. 열린 길로 이동하세요. → 가나다'))===''&&S(S('쉼터의 서사를 읽고 다음 기억으로 이어가세요. → 쉼터'))==='쉼터의 서사를 읽고 다음 기억으로 이어가세요. → 쉼터');
 ok('비슷하지만 다른 안내는 남긴다(문 앞 다음 기억으로)',S('주사실 문 앞 C · 다음 기억으로')==='주사실 문 앞 C · 다음 기억으로');
 // 회귀: 현재 지역 안내는 건드리지 않는다
 ok('현재 지역 안내는 그대로',S('현재 기억을 완료하면 X이(가) 열립니다. → 현재 지역 · 잠들지 못하는 마을')==='현재 기억을 완료하면 X이(가) 열립니다. → 현재 지역 · 잠들지 못하는 마을');
}
// ③ updateHUD 감싸기: 길잡이 한 줄과 펼친 패널의 목표 글 둘 다에서 그 안내가 사라진다(맵 이름 #questTitle 은 그대로)
{const t=mk();t.els.questTitle={textContent:'잠들지 못하는 마을'};t.sb.__hud='다음 기억은 악마화 나무의 정원입니다. 열린 길로 이동하세요. → 악마화 나무의 정원';t.sb.__goal='다음 기억은 악마화 나무의 정원입니다. 열린 길로 이동하세요.';t.sb.updateHUD();
 ok('updateHUD 뒤 길잡이 한 줄이 빈다',t.els.questInlineSummary.textContent==='',t.els.questInlineSummary.textContent);
 ok('펼친 패널의 목표 글도 빈다',t.els.questText.textContent==='',t.els.questText.textContent);
 ok('맵 이름은 그대로',t.els.questTitle.textContent==='잠들지 못하는 마을');
 t.sb.__hud='두 갈래 길 돌파 · 중앙 전투실로 이동';t.sb.__goal='두 갈래 길 돌파';t.sb.updateHUD();ok('다른 목표는 그대로 보인다',t.els.questInlineSummary.textContent==='두 갈래 길 돌파 · 중앙 전투실로 이동'&&t.els.questText.textContent==='두 갈래 길 돌파',[t.els.questInlineSummary.textContent,t.els.questText.textContent]);
 t.sb.__hud='';t.sb.__goal='';t.sb.updateHUD();ok('빈 줄도 안 깨짐',t.els.questInlineSummary.textContent==='');}
// ④ 위치: 쪽지·서사 창이 길잡이 패널 아래 왼쪽으로
{const t=mk({questBottom:70});t.sb.__STORYWORLD_TOPLEFT_R899__?.place?.();const v=t.root.style.props['--r899-top'];ok('길잡이 패널 바닥+8px 아래에서 시작',v==='78px',v);}
{const t=mk({questBottom:33});t.sb.document.querySelector=q=>q==='header'?{getBoundingClientRect:()=>({top:0,bottom:44})}:null;t.sb.__STORYWORLD_TOPLEFT_R899__?.place?.();const v=t.root.style.props['--r899-top'];ok('길잡이 줄이 비어 패널이 낮아져도 위쪽 머리 띠(44px) 아래에서 시작',v==='52px',v);}
{const t=mk({hasQuest:false});t.sb.__STORYWORLD_TOPLEFT_R899__?.place?.();const v=t.root.style.props['--r899-top'];ok('패널이 없으면 12px',v==='12px',v);}
{const t=mk({questBottom:900,H:720});t.sb.__STORYWORLD_TOPLEFT_R899__?.place?.();const v=t.root.style.props['--r899-top'];ok('패널이 아주 커도 화면 40% 안(288px)',v==='288px',v);}
{const t=mk();const css=(t.styles.find(s=>s.id==='r899Css')||{}).textContent||'';
 ok('R177 종이는 왼쪽(left)·right:auto',/#r177Doc\{[^}]*left:[^;}]*;[^}]*right:auto/.test(css)||/#r177Doc\{[^}]*right:auto[^}]*left:/.test(css),css.slice(0,200));
 ok('R177 종이 위치가 --r899-top',/#r177Doc\{[^}]*top:var\(--r899-top/.test(css));
 ok('R255 서사 창은 왼쪽 위(flex-start)',/#modal\.r255\{[^}]*justify-content:flex-start/.test(css)&&/#modal\.r255\{[^}]*align-items:flex-start/.test(css),css.slice(0,300));
 ok('R255 서사 종이 위 여백이 --r899-top',/#panel\.r255-doc\{[^}]*var\(--r899-top/.test(css));
 ok('폰(700px 이하)·R255 아래쪽 배치는 건드리지 않음(데스크톱 전용 미디어)',/@media\s*\(min-width:\s*701px\)/.test(css)&&!/max-width:\s*700px/.test(css));
 ok('빈 길잡이 줄·목표 글은 자리도 차지하지 않는다(:empty 숨김)',/#questInlineSummary:empty[^{]*#questText:empty\{display:none/.test(css));
 ok('길잡이 한 줄은 줄바꿈(잘림 없음)',/#questInlineSummary\{[^}]*white-space:normal/.test(css)&&/text-overflow:clip/.test(css));}
const bad=checks.filter(c=>!c.pass);for(const c of checks)console.log(c.pass?'PASS':'FAIL',c.name,c.pass?'':JSON.stringify(c.detail||'').slice(0,240));
console.log(checks.length-bad.length+'/'+checks.length+' passed');process.exit(bad.length?1:0);
