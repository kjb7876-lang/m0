// R1086 CPU 검사: 한지 창(ui-hanji-r1086.js) — 사용자 2026-11-15 "ui조금더 동양화수묵화풍으로 개선", "세로 탄막겜참조 지금만들고있는".
//  세로 탄막 게임(합일 세로 리부트)의 수묵 UI 처럼 창을 한지 바탕·먹 글씨·먹 으뜸 단추·낙관으로. R1085(먹빛 UI) 위에 얹는다.
//  ① 연결 ② 켜고 끄기(R1085 를 따름, 따로 끄기 '0', 이상한 저장값, 저장소 오류) ③ 색·대비·눈부심 ④ CSS 범위·기능 숨김 없음·부담 없음
//  ⑤ 어두운 칸 판별 함수(경계값) ⑥ 설정 줄. 화면은 r1086-browser.mjs(헤드리스)가 잰다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..'),ROOT=path.resolve(R,'..');
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return '';}};
const res=[];const ok=(n,c,d='')=>{res.push(!!c);console.log((c?'PASS ':'FAIL ')+n+(c||d===''?'':' :: '+d));};
const done=()=>{const failed=res.filter(x=>!x).length;console.log(JSON.stringify({total:res.length,failed,method:'node vm + tiny fake DOM'}));process.exit(failed?1:0);};
const src=rd(path.join(R,'client-source','ui-hanji-r1086.js')),base=rd(path.join(R,'client-source','ui-ink-r1085.js'));
ok('client-source/ui-hanji-r1086.js exists',src.length>0);
const html=rd(path.join(R,'runtime-text','index.html'));
ok('runtime copy identical to client-source',src.length>0&&rd(path.join(R,'runtime-text','ui-hanji-r1086.js'))===src);
ok('index.html loads it exactly once',(html.match(/<script src="\.\/ui-hanji-r1086\.js"><\/script>/g)||[]).length===1);
ok('tag sits right after ui-ink-r1085.js (R1055→R1085 순서는 그대로)',/<script src="\.\/ink-wash-r1055\.js"><\/script>\s*<script src="\.\/ui-ink-r1085\.js"><\/script>\s*<script src="\.\/ui-hanji-r1086\.js"><\/script>/.test(html));
ok('before combat-r118 (끝 두 태그 규칙)',html.indexOf('ui-hanji-r1086.js')>0&&html.indexOf('<script src="./combat-r118.js">')>html.indexOf('ui-hanji-r1086.js'));
ok('verify-r96-public.py expects it',/'ui-hanji-r1086\.js'/.test(rd(path.join(ROOT,'scripts','verify-r96-public.py'))));
ok('runtime-inputs/manifest list it',/ui-hanji-r1086\.js/.test(rd(path.join(R,'runtime-inputs.json')))&&/ui-hanji-r1086\.js/.test(rd(path.join(R,'runtime-manifest.json'))));
ok('pages.yml runs this check',/node r96\/qa\/r1086\/r1086-cpu-check\.cjs/.test(rd(path.join(ROOT,'.github','workflows','pages.yml'))));
ok('R1085 파일은 그대로(이 변경이 고치지 않음)',/REV='R1085-ui-ink-1'/.test(base));
if(!src)done();
function world(st={},opt={}){const store=new Map(Object.entries(st));
 const mk=tag=>{const cls=new Set();const e={tagName:tag.toUpperCase(),children:[],parentNode:null,id:'',textContent:'',checked:false,type:'',style:{},_l:{},
  classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:(c,v)=>{(v===undefined?!cls.has(c):v)?cls.add(c):cls.delete(c);}},
  setAttribute(k,v){this[k]=String(v);},getAttribute(k){return this[k]??null;},
  appendChild(c){if(c.parentNode)c.parentNode.children=c.parentNode.children.filter(x=>x!==c);c.parentNode=this;this.children.push(c);return c;},
  insertBefore(c,r){this.appendChild(c);this.children.pop();const i=this.children.indexOf(r);this.children.splice(i<0?this.children.length:i,0,c);return c;},
  remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null;}},
  addEventListener(t,f){(this._l[t]=this._l[t]||[]).push(f);},fire(t){(this._l[t]||[]).forEach(f=>f({target:this}));},
  _all(){const o=[];const w=x=>x.children.forEach(c=>{o.push(c);w(c);});w(this);return o;},
  querySelector(s){return this.querySelectorAll(s)[0]||null;},
  querySelectorAll(s){return this._all().filter(x=>s.split(',').some(q=>{q=q.trim();return q==='*'||(q[0]==='#'?x.id===q.slice(1):q[0]==='.'?x.classList.contains(q.slice(1)):x.tagName===q.toUpperCase());}));}};return e;};
 const docEl=mk('html'),head=mk('head'),body=mk('body'),panel=mk('section');panel.id='panel';docEl.appendChild(head);docEl.appendChild(body);body.appendChild(panel);
 const document={documentElement:docEl,head,body,readyState:'complete',createElement:mk,getElementById:id=>docEl._all().find(e=>e.id===id)||null,querySelector:s=>docEl.querySelector(s),querySelectorAll:s=>docEl.querySelectorAll(s),addEventListener(){}};
 const localStorage={getItem:k=>{if(opt.throws)throw Error('denied');return store.has(k)?store.get(k):null;},setItem:(k,v)=>{if(opt.throws)throw Error('denied');store.set(k,String(v));},removeItem:k=>{if(opt.throws)throw Error('denied');store.delete(k);}};
 const timers=[];const w={document,localStorage,setTimeout:f=>{timers.push(f);return timers.length;},clearTimeout(){},console,addEventListener(){},getComputedStyle:()=>({backgroundColor:'rgba(0, 0, 0, 0)',backgroundImage:'none'}),
  showSettings(){panel.children=[];const s=mk('section');s.id='combatScreenR1021';panel.appendChild(s);return 'base';}};
 w.window=w;w.globalThis=w;const ctx=vm.createContext(w);let err=null;
 try{vm.runInContext(base,ctx,{filename:'ui-ink-r1085.js'});vm.runInContext(src,ctx,{filename:'ui-hanji-r1086.js'});}catch(e){err=e;}
 return {w,ctx,docEl,head,panel,store,err,ink:w.__STORYWORLD_UI_INK_R1085__,api:w.__STORYWORLD_UI_HANJI_R1086__,flush(){for(let i=0;i<50&&timers.length;i++)timers.shift()();}};}
const on=x=>x.docEl.classList.contains('r1086Hanji');
const A=world();ok('loads after R1085 without throwing',!A.err,String(A.err));const api=A.api;
ok('api present (revision·enabled·set·inspect·TOKENS·css·isDark)',!!api&&/^R1086/.test(api.revision||'')&&['enabled','set','inspect','isDark'].every(k=>typeof api[k]==='function')&&api.TOKENS&&typeof api.css==='string');if(!api)done();
ok('기본: 켜짐(<html> 에 r1086Hanji, style#uiHanjiR1086)',on(A)&&api.enabled()===true&&A.head.children.some(e=>e.id==='uiHanjiR1086'&&e.textContent.length>500));
ok("'storyworld.r1086.hanji'='0': 한지 꺼짐, R1085 먹빛은 그대로",(()=>{const x=world({'storyworld.r1086.hanji':'0'});return !x.err&&!on(x)&&x.docEl.classList.contains('r1085Ink')&&x.api.enabled()===false;})());
ok('R1085 를 끄면(수묵화풍 UI 끔) 한지도 붙지 않음',(()=>{const x=world({'storyworld.r1085.inkUi':'0'});return !x.err&&!on(x)&&!x.docEl.classList.contains('r1085Ink');})());
ok('R1085 를 실행 중에 끄고 켜면 한지도 따라감',(()=>{const x=world();x.ink.set(false);x.flush();const a=on(x);x.ink.set(true);x.flush();return !a&&on(x);})());
for(const bad of ['','1','{','null','off','0 ','NaN'])ok(`이상한 저장값 ${JSON.stringify(bad)}: 기본(켜짐), 오류 없음`,(()=>{const x=world({'storyworld.r1086.hanji':bad});return !x.err&&on(x)&&x.api.inspect().errors===0;})());
ok('localStorage 가 막혀도 켜진 채 오류 없이, set 도 동작',(()=>{const x=world({},{throws:true});if(x.err||!on(x))return false;x.api.set(false);return !on(x);})());
ok('set(false) → 저장 "0", set(true) → 저장값 지움',(()=>{api.set(false);const a=!on(A)&&A.store.get('storyworld.r1086.hanji')==='0';api.set(true);return a&&on(A)&&!A.store.has('storyworld.r1086.hanji');})());
ok('set(불리언 아님)은 무시',(()=>{for(const v of [undefined,null,NaN,0,'0',{}])api.set(v);return on(A);})());
ok('두 번 읽어도 한 번만',(()=>{vm.runInContext(src,A.ctx);return A.head.children.filter(e=>e.id==='uiHanjiR1086').length===1&&A.w.__STORYWORLD_UI_HANJI_R1086__===api;})());
ok('inspect 숫자는 모두 유한',Object.values(api.inspect()).every(v=>typeof v!=='number'||Number.isFinite(v)));
// 색
const T=api.TOKENS,keys=['paper','paper2','paper3','ink','muted','seal','line'];
const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const cr=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
ok('TOKENS 는 모두 #rrggbb',keys.every(k=>/^#[0-9a-f]{6}$/.test(T[k])),JSON.stringify(T));
if(keys.every(k=>/^#[0-9a-f]{6}$/.test(T[k]))){
 ok('먹 글씨/한지 대비 10 이상(칸·눌린 칸 위에서도)',cr(T.ink,T.paper)>=10&&cr(T.ink,T.paper2)>=10&&cr(T.ink,T.paper3)>=8,[cr(T.ink,T.paper),cr(T.ink,T.paper3)].map(v=>v.toFixed(1)).join('/'));
 ok('옅은 글씨/한지 대비 4.5 이상',cr(T.muted,T.paper)>=4.5&&cr(T.muted,T.paper2)>=4.5,cr(T.muted,T.paper2).toFixed(2));
 ok('으뜸 단추(먹 바탕·한지 글씨) 대비 10 이상',cr(T.paper,T.ink)>=10);
 ok('낙관(인주)/한지 대비 4.5 이상',cr(T.seal,T.paper)>=4.5,cr(T.seal,T.paper).toFixed(2));
 ok('눈부심 누름: 한지는 탄막 게임 한지(#f2e9d6)보다 한 단계 어둡고 순백 없음',lum(T.paper)<=lum('#f2e9d6')-.06&&lum(T.paper)>=.5&&!/#fff\b|#ffffff/i.test(api.css),lum(T.paper).toFixed(3));
 ok('먹은 탄막 게임과 같은 따뜻한 먹(#1e1a18)',T.ink==='#1e1a18');}
// CSS
const css=api.css.replace(/\/\*[\s\S]*?\*\//g,'');const rules=[];{const re=/([^{}]+)\{([^{}]*)\}/g;let m;while((m=re.exec(css)))rules.push({sel:m[1].trim(),dec:m[2]});}
ok('CSS 규칙 30개 이상',rules.length>=30,rules.length);
{const bad=rules.flatMap(r=>r.sel.split(',').map(s=>s.trim()).filter(s=>!/^html\.r1085Ink\.r1086Hanji([\s.#:>\[]|$)/.test(s)));ok('모든 선택자가 html.r1085Ink.r1086Hanji 아래(둘 중 하나만 꺼도 작동 안 함)',bad.length===0,bad.slice(0,4).join(' | '));}
ok('아무것도 숨기지 않음(display:none·visibility:hidden 없음)',!/display\s*:\s*none|visibility\s*:\s*hidden/.test(css));
ok('게임 캔버스는 건드리지 않음',!rules.some(r=>/#game\b|(^|[\s>,])canvas\b/.test(r.sel)));
ok('흐림·그림자 필터·backdrop-filter·움직임 없음',!/backdrop-filter|blur\(|drop-shadow\(|@keyframes|animation\s*:/.test(css));
ok('외부 주소·@import·글꼴 내려받기 없음',!/@import|https?(:|%3A)|@font-face/i.test(css.split(encodeURIComponent("xmlns='http://www.w3.org/2000/svg'")).join(''))&&!/url\((?!["']?data:image\/svg\+xml,)/.test(css));
ok('전투 HUD(머리띠·아래 띠·기술 칸·구슬)는 밝게 바꾸지 않음',!rules.some(r=>/(^|\s)(header|footer)\b|\.skill\b|#heroCard|orb|#minipanel|#bossbar|#quest\b/.test(r.sel.replace(/html\.r1085Ink\.r1086Hanji/g,''))));
ok('캔버스 그리기·키 입력 코드 없음',!/\.filter\s*=|getContext|drawImage|keydown|keyup|keypress/.test(src));
// 어두운 칸 판별
const D=api.isDark;
for(const [bg,img,want,why] of [['rgb(10, 10, 10)','none',true,'검은 칸'],['rgb(26, 31, 39)','none',true,'먹 칸'],['rgba(0, 0, 0, 0)','none',false,'투명'],['rgba(10, 10, 10, 0.3)','none',false,'옅게 비치는 칸'],['rgba(10, 10, 10, 0.6)','none',true,'반 넘게 불투명한 검은 칸'],
 ['rgb(228, 218, 194)','none',false,'한지 칸'],['rgb(128, 128, 128)','none',false,'중간 회색(밝은 쪽)'],['rgb(90, 90, 90)','none',true,'어두운 회색'],['rgba(0, 0, 0, 0)','url("a.png")',true,'사진'],['rgba(0, 0, 0, 0)','linear-gradient(rgb(0, 0, 0), rgb(1, 1, 1))',false,'그라데이션만(색 모름)'],
 ['','',false,'빈 값'],['rgb(NaN, 1, 2)','none',false,'NaN'],[undefined,undefined,false,'undefined'],['rgb(10, 10, 10)','url("data:image/svg+xml,x")',true,'검은 칸 + 무늬'],['rgba(0, 0, 0, 0)','url("data:image/svg+xml,%3Csvg%3E") 0 0 / 10px no-repeat',false,'붓 획 무늬만(사진 아님)'],['rgba(0, 0, 0, 0)','url("data:image/svg+xml,x"), url("b.webp")',true,'무늬 + 사진']])
 ok(`어두운 칸 판별: ${why} → ${want}`,(()=>{try{return D(bg,img)===want;}catch(e){return false;}})());
// 설정 줄
{const x=world();const r=x.w.showSettings();x.flush();const sec=x.docEl._all().find(e=>e.id==='inkUiR1085'),box=x.docEl._all().find(e=>e.id==='hanjiToggleR1086');
 ok('showSettings 반환값 유지',r==='base');
 ok("설정 '화면 꾸밈' 묶음 안에 '한지 창' 체크(#hanjiToggleR1086), R1085 체크도 그대로",!!sec&&!!box&&box.type==='checkbox'&&box.checked===true&&!!x.docEl._all().find(e=>e.id==='inkUiToggleR1086'||e.id==='inkUiToggleR1085')&&sec._all().includes(box)&&/한지/.test(sec._all().map(e=>e.textContent).join('')));
 if(box){box.checked=false;box.fire('change');ok('체크를 끄면 먹빛 창으로 + 저장',!on(x)&&x.docEl.classList.contains('r1085Ink')&&x.store.get('storyworld.r1086.hanji')==='0');box.checked=true;box.fire('change');ok('다시 켜면 한지',on(x));}
 x.w.showSettings();x.flush();x.w.showSettings();x.flush();ok('여러 번 열어도 줄은 하나',x.docEl._all().filter(e=>e.id==='hanjiToggleR1086').length===1);
 const y=world({'storyworld.r1086.hanji':'0'});y.w.showSettings();y.flush();const by=y.docEl._all().find(e=>e.id==='hanjiToggleR1086');ok('꺼 둔 상태에서도 줄은 보이고 체크는 꺼짐',!!by&&by.checked===false);}
done();
