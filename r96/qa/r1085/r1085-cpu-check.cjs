// R1085 CPU 검사: 수묵화풍 UI(ui-ink-r1085.js) — 브라우저 없이 실제 모듈을 가짜 DOM 에서 돌린다.
//  ① 연결(태그 자리·sync·공개 확인 목록·CI 줄) ② 색은 R1055 진경산수풍(jg) 먹·중간 먹·한지에서 가져옴 ③ 글자 대비(WCAG)
//  ④ 기본 켜짐·끄기('0')·이상한 저장값·저장소 오류·두 번 읽기 ⑤ CSS 는 html.r1085Ink 아래에서만 작동(끄면 아무것도 안 함), 기능 단추를 숨기지 않음,
//  게임 캔버스·ctx.filter·흐림·움직임(키프레임)·외부 주소 없음 ⑥ 설정 창에 '수묵화풍 UI' 줄 ⑦ 새 키 입력 없음.
//  화면 배치·실제 색은 r1085-browser.mjs(헤드리스)가 잰다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..'),ROOT=path.resolve(R,'..');
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return '';}};
const res=[];const ok=(n,c,d='')=>{res.push(!!c);console.log((c?'PASS ':'FAIL ')+n+(c||d===''?'':' :: '+d));};
const done=()=>{const failed=res.filter(x=>!x).length;console.log(JSON.stringify({total:res.length,failed,method:'node vm + tiny fake DOM'}));process.exit(failed?1:0);};
const F=path.join(R,'client-source','ui-ink-r1085.js');const src=rd(F);
ok('client-source/ui-ink-r1085.js exists',src.length>0);
// ---- ① 연결 ----
const html=rd(path.join(R,'runtime-text','index.html'));
ok('runtime copy identical to client-source',src.length>0&&rd(path.join(R,'runtime-text','ui-ink-r1085.js'))===src);
ok('index.html loads ui-ink-r1085.js exactly once',(html.match(/<script src="\.\/ui-ink-r1085\.js"><\/script>/g)||[]).length===1);
ok('tag sits right after ink-wash-r1055.js (R1055 의 gear→ink 순서는 그대로)',/<script src="\.\/gear-r1032\.js"><\/script>\s*<script src="\.\/ink-wash-r1055\.js"><\/script>\s*<script src="\.\/ui-ink-r1085\.js"><\/script>/.test(html));
{const a=html.indexOf('ui-ink-r1085.js'),b=html.indexOf('<script src="./combat-r118.js">'),c=html.indexOf('ui-combat-r1021.js'),d=html.indexOf('ui-clean-r1015.js');
 ok('before combat-r118·world-tiles-r118 (끝 두 태그 규칙)',a>0&&b>a);ok('after ui-clean-r1015·ui-combat-r1021 (나중 스타일이 이김)',a>c&&c>d&&d>0);}
ok('verify-r96-public.py expects ui-ink-r1085.js',/'ui-ink-r1085\.js'/.test(rd(path.join(ROOT,'scripts','verify-r96-public.py'))));
ok('runtime-inputs/manifest list ui-ink-r1085.js',/ui-ink-r1085\.js/.test(rd(path.join(R,'runtime-inputs.json'))+rd(path.join(R,'runtime-text','runtime-inputs.json')))&&/ui-ink-r1085\.js/.test(rd(path.join(R,'runtime-manifest.json'))+rd(path.join(R,'runtime-text','runtime-manifest.json'))));
ok('pages.yml runs this check',/node r96\/qa\/r1085\/r1085-cpu-check\.cjs/.test(rd(path.join(ROOT,'.github','workflows','pages.yml'))));
if(!src)done();
// ---- 가짜 DOM ----
function world(stored,opt={}){
 const store=new Map(stored===undefined?[]:[['storyworld.r1085.inkUi',stored]]);
 const mk=tag=>{const cls=new Set();const e={tagName:tag.toUpperCase(),children:[],parentNode:null,id:'',textContent:'',checked:false,type:'',style:{},_l:{},
  classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:(c,v)=>{(v===undefined?!cls.has(c):v)?cls.add(c):cls.delete(c);}},
  get className(){return [...cls].join(' ');},set className(v){cls.clear();String(v).split(/\s+/).filter(Boolean).forEach(c=>cls.add(c));},
  setAttribute(k,v){this[k]=String(v);},getAttribute(k){return this[k]??null;},
  appendChild(c){if(c.parentNode)c.parentNode.children=c.parentNode.children.filter(x=>x!==c);c.parentNode=this;this.children.push(c);return c;},
  append(...cs){cs.forEach(c=>this.appendChild(c));},prepend(c){this.appendChild(c);this.children.unshift(this.children.pop());},
  insertBefore(c,r){this.appendChild(c);this.children.pop();const i=this.children.indexOf(r);this.children.splice(i<0?this.children.length:i,0,c);return c;},
  remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null;}},
  addEventListener(t,f){(this._l[t]=this._l[t]||[]).push(f);},fire(t){(this._l[t]||[]).forEach(f=>f({target:this}));if(t==='change'&&this.onchange)this.onchange({target:this});},
  _all(){const o=[];const w=x=>x.children.forEach(c=>{o.push(c);w(c);});w(this);return o;},
  querySelector(s){return this._all().find(x=>s.split(',').some(q=>{q=q.trim();return q[0]==='#'?x.id===q.slice(1):q[0]==='.'?x.classList.contains(q.slice(1)):x.tagName===q.toUpperCase();}))||null;},
  querySelectorAll(s){return this._all().filter(x=>s.split(',').some(q=>{q=q.trim();return q[0]==='#'?x.id===q.slice(1):q[0]==='.'?x.classList.contains(q.slice(1)):x.tagName===q.toUpperCase();}));}};return e;};
 const docEl=mk('html'),head=mk('head'),body=mk('body'),panel=mk('section');panel.id='panel';docEl.appendChild(head);docEl.appendChild(body);body.appendChild(panel);
 const document={documentElement:docEl,head,body,readyState:'complete',createElement:mk,getElementById:id=>docEl._all().find(e=>e.id===id)||null,querySelector:s=>docEl.querySelector(s),querySelectorAll:s=>docEl.querySelectorAll(s),addEventListener(){},createTextNode:t=>({textContent:String(t),children:[],parentNode:null})};
 const localStorage={getItem:k=>{if(opt.throws)throw Error('denied');return store.has(k)?store.get(k):null;},setItem:(k,v)=>{if(opt.throws)throw Error('denied');store.set(k,String(v));},removeItem:k=>{if(opt.throws)throw Error('denied');store.delete(k);}};
 const timers=[];const w={document,localStorage,setTimeout:(f)=>{timers.push(f);return timers.length;},clearTimeout(){},console,addEventListener(){},
  showSettings(){panel.children=[];const h=mk('h2');h.textContent='설정';panel.appendChild(h);const s=mk('section');s.id='combatScreenR1021';panel.appendChild(s);w.settingsCalls=(w.settingsCalls||0)+1;return 'base';}};
 w.window=w;w.globalThis=w;const ctx=vm.createContext(w);
 let err=null;try{vm.runInContext(src,ctx,{filename:'ui-ink-r1085.js'});}catch(e){err=e;}
 return {w,ctx,docEl,head,panel,store,err,api:w.__STORYWORLD_UI_INK_R1085__,flush(){while(timers.length)timers.shift()();}};}
const on=x=>x.docEl.classList.contains('r1085Ink');
// ---- ④ 켜고 끄기 ----
const A=world();ok('module loads without throwing',!A.err,String(A.err));const api=A.api;
ok('api present (revision·enabled·set·inspect·TOKENS·css)',!!api&&/^R1085/.test(api.revision||'')&&['enabled','set','inspect'].every(k=>typeof api[k]==='function')&&api.TOKENS&&typeof api.css==='string');if(!api)done();
ok('default: on (class r1085Ink on <html>, style#uiInkR1085 in <head>)',on(A)&&api.enabled()===true&&A.head.children.some(e=>e.id==='uiInkR1085'&&e.textContent.length>500));
ok("stored '0': off, no class",(()=>{const x=world('0');return !x.err&&!on(x)&&x.api.enabled()===false;})());
for(const bad of ['','1','{','null','{"on":false}','off','0 ','NaN'])ok(`이상한 저장값 ${JSON.stringify(bad)}: 기본(켜짐)으로, 오류 없음`,(()=>{const x=world(bad);return !x.err&&on(x)&&x.api.inspect().errors===0;})());
ok('localStorage 가 막혀도(예외) 켜진 채 오류 없이',(()=>{const x=world(undefined,{throws:true});if(x.err||!on(x))return false;x.api.set(false);return !on(x)&&x.api.enabled()===false;})());
ok('set(false): 클래스 제거 + 저장 "0"',(()=>{api.set(false);return !on(A)&&A.store.get('storyworld.r1085.inkUi')==='0';})());
ok('set(true): 다시 켜짐 + 저장값 지움',(()=>{api.set(true);return on(A)&&!A.store.has('storyworld.r1085.inkUi');})());
ok('set(불리언 아님)은 무시(상태 그대로)',(()=>{for(const v of [undefined,null,NaN,0,'0',{}])api.set(v);return on(A)&&api.enabled()===true;})());
ok('두 번 읽어도 한 번만(스타일 1개, API 그대로)',(()=>{vm.runInContext(src,A.ctx);return A.head.children.filter(e=>e.id==='uiInkR1085').length===1&&A.w.__STORYWORLD_UI_INK_R1085__===api;})());
ok('inspect: 숫자는 모두 유한',(()=>{const i=api.inspect();return i&&Object.values(i).every(v=>typeof v!=='number'||Number.isFinite(v));})());
// ---- ② 색: R1055 jg ----
const ink=rd(path.join(R,'client-source','ink-wash-r1055.js'));const jg=/jg:Object\.freeze\(\{[^}]*ink:\[([^\]]+)\],mid:\[([^\]]+)\],pap:\[([^\]]+)\]/.exec(ink);
const hex=s=>'#'+s.split(',').map(v=>Math.round(+v*255).toString(16).padStart(2,'0')).join('');
ok('R1055 진경산수풍(jg) 값을 읽음',!!jg);const T=api.TOKENS;
if(jg){ok('먹 = R1055 jg ink',T.ink===hex(jg[1]),T.ink+' vs '+hex(jg[1]));ok('중간 먹 = R1055 jg mid',T.mid===hex(jg[2]),T.mid+' vs '+hex(jg[2]));ok('한지 = R1055 jg pap',T.paper===hex(jg[3]),T.paper+' vs '+hex(jg[3]));}
ok('R1055 파일은 고치지 않고 읽지도 않음(값만 같음)',!/ink-wash-r1055|INK_WASH_R1055/.test(src.replace(/\/\/[^\n]*/g,'')));
// ---- ③ 대비 ----
const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const cr=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const isHex=v=>/^#[0-9a-f]{6}$/.test(v);
ok('TOKENS 는 모두 #rrggbb',['ink','ink2','mid','paper','text','muted','seal','line'].every(k=>isHex(T[k])),JSON.stringify(T));
if(['ink','ink2','mid','paper','text','muted','seal','line'].every(k=>isHex(T[k]))){
 ok('본문 글자/먹 바탕 대비 7 이상',cr(T.text,T.ink)>=7&&cr(T.text,T.ink2)>=7,cr(T.text,T.ink2).toFixed(2));
 ok('옅은 글자/먹 바탕 대비 4.5 이상',cr(T.muted,T.ink)>=4.5&&cr(T.muted,T.ink2)>=4.5,cr(T.muted,T.ink2).toFixed(2));
 ok('으뜸 단추(한지 바탕·먹 글자) 대비 7 이상',cr(T.ink,T.paper)>=7,cr(T.ink,T.paper).toFixed(2));
 ok('낙관(인주) 점/먹 바탕 대비 3 이상',cr(T.seal,T.ink)>=3&&cr(T.seal,T.ink2)>=3,cr(T.seal,T.ink2).toFixed(2));
 ok('눈 편하게: 가장 밝은 값이 한지보다 밝지 않음(순백 없음)',lum(T.text)<=lum(T.paper)+.12&&!/#fff\b|#ffffff/i.test(api.css));}
// ---- ⑤ CSS ----
const css=api.css.replace(/\/\*[\s\S]*?\*\//g,'');
const rules=[];{const body=css.replace(/@media[^{]*\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g,(_,inner)=>inner);const re=/([^{}]+)\{([^{}]*)\}/g;let m;while((m=re.exec(body)))rules.push({sel:m[1].trim(),dec:m[2]});}
ok('CSS 규칙이 충분히 있음(40개 이상)',rules.length>=40,rules.length);
{const bad=rules.flatMap(r=>r.sel.split(',').map(s=>s.trim()).filter(s=>!/^html\.r1085Ink([\s.#:>\[]|$)/.test(s)));ok('모든 선택자가 html.r1085Ink 아래(끄면 완전히 원래대로)',bad.length===0,bad.slice(0,5).join(' | '));}
{const hide=rules.filter(r=>/display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(\.0+)?\s*(!important)?\s*(;|$)/.test(r.dec));
 const bad=hide.flatMap(r=>r.sel.split(',')).filter(s=>/button|input|select|summary|details|label|Btn\b|#r1021|#touchUse|#joystick|#stick|orb|Orb|#hpFill|#resFill|#xpFill|#bossbar|#mini|#quest(?![A-Za-z])\s*(,|$)|narr|subs|\.skill(?![\w-]|\s+(kbd|span))|#panel\s*$|#modal|#toast|#hint|#banner|r1060|r1057|ego/i.test(s));
 ok('기능 요소(단추·입력·구슬 체력·회피/영웅 단추·자막·쪽지)를 숨기지 않음',bad.length===0,bad.join(' | '));
 ok('숨기는 것은 장식 글자뿐(8개 이하 규칙)',hide.length<=8,hide.length);}
ok('게임 캔버스(#game·canvas)는 건드리지 않음',!rules.some(r=>/#game\b|(^|[\s>,])canvas\b/.test(r.sel)));
ok('흐림·그림자 필터·backdrop-filter 없음(폰 최소 단계 부담 없음)',!/backdrop-filter|blur\(|drop-shadow\(/.test(css));
ok('움직임 추가 없음(@keyframes·animation 없음)',!/@keyframes|animation\s*:/.test(css));
// data URI 안의 SVG 이름공간 문자열(xmlns, 내려받지 않음)만 빼고 본다
ok('외부 주소·@import·글꼴 내려받기 없음',!/@import|https?(:|%3A)|@font-face/i.test(css.split(encodeURIComponent("xmlns='http://www.w3.org/2000/svg'")).join(''))&&!/url\((?!["']?data:image\/svg\+xml,)/.test(css));
ok('금색 그라데이션 단추 없음(옛 #65563b·#bea479·#c6ab77 을 다시 쓰지 않음)',!/#65563b|#bea479|#c6ab77/i.test(css));
{const radii=[...css.matchAll(/border-radius\s*:\s*([^;}]+)/g)].flatMap(m=>m[1].replace('!important','').trim().split(/\s+/)).map(v=>v==='0'?0:/px$/.test(v)?parseFloat(v):v==='50%'?0:99);
 ok('모서리는 4px 이하(둥근 알약 모양 없음, 원형 50% 는 구슬용으로 허용)',radii.length>0&&radii.every(v=>v<=4),radii.join(','));}
ok('ctx.filter·캔버스 그리기 코드 없음',!/\.filter\s*=|getContext|drawImage/.test(src));
// ---- ⑦ 키 입력 ----
ok('새 키 입력·스킬 키 없음(keydown/keyup 듣지 않음)',!/keydown|keyup|keypress/.test(src));
// ---- ⑥ 설정 줄 ----
{const x=world();const r=x.w.showSettings();x.flush();const sec=x.docEl._all().find(e=>e.id==='inkUiR1085'),box=x.docEl._all().find(e=>e.id==='inkUiToggleR1085');
 ok('showSettings 원래 반환값·호출 유지',r==='base'&&x.w.settingsCalls===1);
 ok("설정 창에 '수묵화풍 UI' 줄(section#inkUiR1085 + 체크 #inkUiToggleR1085)",!!sec&&!!box&&box.type==='checkbox'&&/수묵화풍 UI/.test(sec.textContent+sec._all().map(e=>e.textContent).join('')));
 ok('체크 상태 = 지금 상태(켜짐)',!!box&&box.checked===true);
 if(box){box.checked=false;box.fire('change');ok('체크를 끄면 UI 가 원래대로 + 저장',!on(x)&&x.store.get('storyworld.r1085.inkUi')==='0');box.checked=true;box.fire('change');ok('다시 켜면 수묵',on(x));}
 x.w.showSettings();x.flush();x.w.showSettings();x.flush();ok('설정을 여러 번 열어도 줄은 하나',x.docEl._all().filter(e=>e.id==='inkUiR1085').length===1);
 ok('R1021 전투 화면 묶음은 그대로 남음',!!x.docEl._all().find(e=>e.id==='combatScreenR1021'));
 const y=world('0');y.w.showSettings();y.flush();const by=y.docEl._all().find(e=>e.id==='inkUiToggleR1085');ok('꺼 둔 상태에서도 설정 줄은 보이고 체크는 꺼짐(다시 켤 수 있게)',!!by&&by.checked===false);}
done();
