// R1118 CPU 검사: 외부 리뷰 반영 — WebGL 불가 시 시작 차단·타이틀 안내, 조작 안내 문구, 영웅 카드 글자색(정적 CSS), 설정 요약 줄.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
// 1) 조작 안내: 개발용 문구 제거
const idx=RT('index.html');const help=(idx.match(/function showHelp\(\)\{[^\n]*/)||[''])[0];
ok('help: 개발용 문구(정규화·값 주입) 없음',help.length>500&&!/정규화/.test(help)&&!/값 주입/.test(help),help.length);
ok('help: 대각선·길잡이 안내는 남음',/대각선/.test(help)&&/길잡이/.test(help)&&/무적/.test(help));
// 2) 영웅 선택 카드: 한지 대비 검사(JS)와 별개로 정적 CSS 가 밝은 글씨를 보장
const hj=C('ui-hanji-r1086.js');
ok('hanji: #r263Stage .row/.nm 정적 밝은 글씨 규칙',/#r263Stage \.row/.test(hj)&&/#r263Stage \.nm/.test(hj)&&RT('ui-hanji-r1086.js')===hj);
// 3) 설정 요약 줄
const cb=C('ui-combat-r1021.js');
ok('settings: 이동·손플레이 보너스 줄',/\['이동'/.test(cb)&&/\['손플레이 보너스'/.test(cb)&&RT('ui-combat-r1021.js')===cb);
// 4) WebGL 게이트
const w=C('webgl-fallback-r221.js');
ok('webgl: runtime copy 일치',RT('webgl-fallback-r221.js')===w);
function mk(gl){const q=[],log={toast:[],base:[]};const mkEl=t=>({tag:t,style:{},children:[],attrs:{},disabled:false,id:'',textContent:'',setAttribute(k,v){this.attrs[k]=v;},append(...c){this.children.push(...c);},appendChild(c){this.children.push(c);return c;},insertBefore(c){this.children.unshift(c);return c;}});
 const panel=mkEl('div');panel.id='panel';panel.firstChild=null;const btns={};
 for(const id of ['campaignNew54','campaignContinue54','survivalStartR600','cinemaStartR461']){btns[id]=mkEl('button');btns[id].id=id;}
 panel.querySelector=s=>{const m=/#(\w+)/.exec(s);return m?(btns[m[1]]&&btns[m[1]].present?btns[m[1]]:(m[1]==='webglTitleNoticeR1118'?panel.children.find(c=>c.id==='webglTitleNoticeR1118')||null:null)):null;};
 let cb=null;const doc={createElement:t=>t==='canvas'?{getContext:()=>gl?{getExtension:()=>null}:null}:mkEl(t),getElementById:id=>id==='panel'?panel:null,body:mkEl('body'),addEventListener(){}};
 const sb={console,Math,JSON,String,Number,Object,RegExp,Array,window:{},document:doc,setTimeout:f=>{q.push(f);return 1;},MutationObserver:function(f){cb=f;this.observe=()=>{};},
  toast:m=>log.toast.push(m)};
 vm.createContext(sb);vm.runInContext('var newGame=async function(){return "base-new"};var restoreSave=async function(){return "base-restore"};',sb);
 vm.runInContext(w,sb);return {sb,q,panel,btns,fire:()=>cb&&cb([]),log};}
(async()=>{
 {const m=mk(false);for(const f of m.q.splice(0))f();m.fire();
  const n=await vm.runInContext('newGame()',m.sb),r=await vm.runInContext('restoreSave()',m.sb);
  ok('webgl 불가: 새 게임·불러오기가 막힘(false)',n===false&&r===false,[n,r]);
  ok('webgl 불가: 막을 때 안내가 뜸',m.log.toast.length>=1);
  for(const id of Object.keys(m.btns))m.btns[id].present=true;m.fire();
  ok('webgl 불가: 타이틀에 안내 칸이 들어감',m.panel.children.some(c=>c.id==='webglTitleNoticeR1118'));
  ok('webgl 불가: 시작 단추가 비활성',Object.values(m.btns).every(b=>b.disabled===true),Object.values(m.btns).map(b=>b.disabled));
  m.fire();ok('webgl 불가: 안내 칸 중복 없음',m.panel.children.filter(c=>c.id==='webglTitleNoticeR1118').length===1);}
 {const m=mk(true);for(const f of m.q.splice(0))f();m.fire();
  const n=await vm.runInContext('newGame()',m.sb),r=await vm.runInContext('restoreSave()',m.sb);
  ok('webgl 가능: 새 게임·불러오기 그대로',n==='base-new'&&r==='base-restore',[n,r]);
  ok('webgl 가능: 안내·비활성 없음',!m.panel.children.length&&Object.values(m.btns).every(b=>!b.disabled));}
 let bad=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' :: '+JSON.stringify(c.detail)));if(!c.pass)bad++;}
 console.log(checks.length-bad+'/'+checks.length);process.exit(bad?1:0);})();
