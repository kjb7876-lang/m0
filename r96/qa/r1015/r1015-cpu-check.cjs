// R1015 CPU 검사: UI 깔끔 정리(ui-clean-r1015.js) — 브라우저 없이 실제 모듈을 가짜 DOM 에서 돌린다.
//  ① 첫 화면: 큰 단추(처음부터·이어하기) → 모드 카드(무한 생존·영화) → 작은 글 단추. 협동 줄·긴 안내 글은 '더 보기' 접기 안으로(삭제 아님).
//  ② 메뉴: 빠른 줄(영웅·기억·지도·진행 저장·설정·길잡이)은 원래 단추를 대신 누르고, R339 묶음은 접는 묶음으로 감싼다(단추는 그대로).
//  ③ 설정(PC): 품질·렉 줄이기·밝기·음량만 바로, 나머지는 '더 보기'. 폰은 R142 에 맡긴다.
//  ④ 두 번 돌려도 결과 같음, 끄면(storyworld.r1015.ui='0') 아무것도 안 바꿈, 연결(태그·sync·공개 확인 목록·CI 줄).
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..','..');const FILE=path.join(root,'client-source','ui-clean-r1015.js');
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name+(ok||detail===''?'':' :: '+detail));};
const done=()=>{const failed=results.filter(r=>!r.ok).length;console.log(JSON.stringify({total:results.length,failed,method:'node vm + tiny fake DOM; layout/CSS measured separately by r1015-browser.mjs (headless)'}));process.exit(failed?1:0);};
check('ui-clean-r1015.js exists',fs.existsSync(FILE));if(!fs.existsSync(FILE))done();
const src=fs.readFileSync(FILE,'utf8');
// ---- 아주 작은 가짜 DOM ----
class El{constructor(tag,doc){this.tagName=tag.toUpperCase();this.ownerDocument=doc;this.children=[];this.parentNode=null;this.attrs={};this.dataset={};this.style={};this._text='';this.disabled=false;this.hidden=false;this.open=false;this.onclick=null;
 const cls=new Set();this.classList={add:(...c)=>c.forEach(x=>cls.add(x)),remove:(...c)=>c.forEach(x=>cls.delete(x)),contains:c=>cls.has(c),toggle:(c,v)=>{const want=v===undefined?!cls.has(c):!!v;if(want)cls.add(c);else cls.delete(c);return want;}};this._cls=cls;}
 get className(){return [...this._cls].join(' ');}set className(v){this._cls.clear();String(v).split(/\s+/).filter(Boolean).forEach(c=>this._cls.add(c));}
 get id(){return this.attrs.id||'';}set id(v){this.attrs.id=v;}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}set textContent(v){this.children.forEach(c=>c.parentNode=null);this.children=[];this._text=String(v);}
 set innerHTML(v){this.children=[];this._text='';const re=/<(\w+)[^>]*><\/\1>/g;let m;while((m=re.exec(v)))this.appendChild(new El(m[1],this.ownerDocument));}
 get firstChild(){return this.children[0]||null;}get lastChild(){return this.children[this.children.length-1]||null;}
 get firstElementChild(){return this.firstChild;}get lastElementChild(){return this.lastChild;}
 setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}
 _detach(){if(this.parentNode){const p=this.parentNode;p.children=p.children.filter(c=>c!==this);this.parentNode=null;}}
 appendChild(c){c._detach();c.parentNode=this;this.children.push(c);return c;}append(...cs){cs.forEach(c=>this.appendChild(c));}
 prepend(c){c._detach();c.parentNode=this;this.children.unshift(c);return c;}
 insertBefore(c,ref){c._detach();c.parentNode=this;const i=this.children.indexOf(ref);if(i<0)this.children.push(c);else this.children.splice(i,0,c);return c;}
 contains(o){for(let x=o;x;x=x.parentNode)if(x===this)return true;return false;}
 click(){this.ownerDocument.clicks.push(this.id||this.textContent);if(this.onclick)this.onclick();}
 _all(){const out=[];const w=e=>{for(const c of e.children){out.push(c);w(c);}};w(this);return out;}
 matches(sel){return sel.split(',').some(s=>match1(this,s.trim()));}
 querySelectorAll(sel){let scope=false;if(sel.startsWith(':scope>')){scope=true;sel=sel.slice(7);}const pool=scope?this.children:this._all();return pool.filter(e=>e.matches(sel));}
 querySelector(sel){return this.querySelectorAll(sel)[0]||null;}
 compareDocumentPosition(o){const all=this.ownerDocument.body._all();return all.indexOf(o)<all.indexOf(this)?2:4;}}
function match1(e,s){// 지원: tag, #id, .cls, tag.cls, [data-x="y"], 'a>b' 는 마지막만, '.r339Grid>button'
 const parts=s.split('>');const last=parts.pop().trim();if(!simple(e,last))return false;if(parts.length){return !!e.parentNode&&e.parentNode.tagName&&simple(e.parentNode,parts.pop().trim());}return true;}
function simple(e,s){const m=/^([a-z0-9]+)?(#[\w-]+)?((?:\.[\w-]+)*)(\[[^\]]+\])?$/i.exec(s);if(!m)throw Error('selector '+s);
 if(m[1]&&e.tagName!==m[1].toUpperCase())return false;if(m[2]&&e.id!==m[2].slice(1))return false;for(const c of (m[3]||'').split('.').filter(Boolean))if(!e.classList.contains(c))return false;
 if(m[4]){const a=/\[([\w-]+)(?:="([^"]*)")?\]/.exec(m[4]);const key=a[1].startsWith('data-')?a[1].slice(5).replace(/-(\w)/g,(_,x)=>x.toUpperCase()):a[1];const v=a[1].startsWith('data-')?e.dataset[key]:e.attrs[a[1]];if(a[2]===undefined?v===undefined:v!==a[2])return false;}return true;}
function make({ls={},mobile=false}={}){const doc={clicks:[]};doc.createElement=t=>new El(t,doc);doc.body=new El('body',doc);doc.head=new El('head',doc);doc.documentElement=doc.body;
 doc.getElementById=id=>[doc.head,...doc.head._all(),...doc.body._all()].find(e=>e.id===id)||null;doc.querySelector=s=>doc.body.querySelector(s);
 const timers=[];const sb={console,Math,JSON,Object,Array,Set,Map,String,Number,Boolean,Error,Node:{DOCUMENT_POSITION_PRECEDING:2},document:doc,
  localStorage:{getItem:k=>k in ls?ls[k]:null,setItem:(k,v)=>{ls[k]=String(v);}},setTimeout:(f)=>{timers.push(f);return timers.length;},setInterval:()=>1,
  __STORYWORLD_MOBILE_R63__:{isMobile:()=>mobile}};sb.window=sb;
 sb.showTitle=function(){};sb.showMenu=function(){};sb.showSettings=function(){};
 vm.createContext(sb);vm.runInContext(src,sb,{filename:'ui-clean-r1015.js'});
 const flush=()=>{while(timers.length)timers.shift()();};return {sb,doc,flush,api:sb.__STORYWORLD_UI_CLEAN_R1015__};}
const mk=(doc,tag,id,cls,text)=>{const e=doc.createElement(tag);if(id)e.id=id;if(cls)e.className=cls;if(text)e.textContent=text;return e;};
function titleDom(doc){const panel=mk(doc,'section','panel');doc.body.appendChild(panel);const start=mk(doc,'div','','hospitalStart50');panel.appendChild(start);
 start.append(mk(doc,'div','','eyebrow','合一夢世'),mk(doc,'h1','','','합일몽세'),mk(doc,'p','','hospitalLead50','기억을 지나'),mk(doc,'p','','small','8개 부 · 62개 기억'));
 const box=mk(doc,'div','','hospitalStartButtons50');start.appendChild(box);
 const ids=[['campaignNew54','처음부터 시작','primary'],['campaignContinue54','이어하기'],['campaignImport54','저장 파일 불러오기'],['campaignHelp54','조작 안내'],['titleSettingsR84','설정'],['survivalStartR600','무한 생존으로 시작'],['cinemaStartR461','영화 모드로 시작']];
 for(const[id,t,c]of ids)box.appendChild(mk(doc,'button',id,c,t));doc.getElementById('campaignContinue54').disabled=true;
 start.appendChild(mk(doc,'p','','small','처음부터 시작하면 환도로 첫 기억 앞에서 시작합니다.'));
 const coop=mk(doc,'div','coopTitleActions62','actions coopTitleActions62');coop.append(mk(doc,'button','coopSolo62','','혼자 하기'),mk(doc,'button','coopCreate62','primary','온라인 방 만들기'),mk(doc,'button','coopJoin62','','방 코드로 참가'));panel.appendChild(coop);
 panel.appendChild(mk(doc,'button','slotsOpenTitleR73','','게임 저장 슬롯 · 현재 1'));panel.appendChild(mk(doc,'p','','small','저장 슬롯 1'));return panel;}
// ① 첫 화면
{const {doc,api,flush}=make();const panel=titleDom(doc);api.title();flush();const box=panel.querySelector('.hospitalStartButtons50');
 const allIds=['campaignNew54','campaignContinue54','campaignImport54','campaignHelp54','titleSettingsR84','survivalStartR600','cinemaStartR461','coopSolo62','coopCreate62','coopJoin62','slotsOpenTitleR73'];
 check('첫 화면: 단추 11개 모두 남음(지우지 않음)',allIds.every(id=>doc.getElementById(id)),allIds.filter(id=>!doc.getElementById(id)).join(','));
 check('첫 화면: 처음부터·이어하기 = 큰 단추',['campaignNew54','campaignContinue54'].every(id=>doc.getElementById(id).classList.contains('r1015Main')));
 check('첫 화면: 무한 생존·영화 = 모드 카드 + 짧은 설명',['survivalStartR600','cinemaStartR461'].every(id=>doc.getElementById(id).classList.contains('r1015Mode')&&doc.getElementById(id).dataset.r1015Sub.length>4));
 check('첫 화면: 불러오기·저장 슬롯·설정·조작 안내 = 작은 글 단추(같은 줄 상자 안)',['campaignImport54','slotsOpenTitleR73','titleSettingsR84','campaignHelp54'].every(id=>{const b=doc.getElementById(id);return b.classList.contains('r1015Link')&&b.parentNode===box;}));
 const more=panel.querySelector('details.r1015TitleMore');
 check('첫 화면: 협동 줄은 더 보기 접기 안',!!more&&more.contains(doc.getElementById('coopTitleActions62'))&&!more.open);
 check('첫 화면: 긴 안내 글 두 줄도 더 보기 안, 맨 위 요약 글은 그대로',more&&more.querySelectorAll('p.small').length===2&&panel.querySelector('.hospitalStart50').querySelectorAll(':scope>p.small').length===1);
 check('첫 화면: 더 보기는 창 맨 끝',panel.lastElementChild===more);
 check('첫 화면: 이어하기가 안 되면 처음부터 시작을 강조',doc.getElementById('campaignNew54').classList.contains('r1015Lead')&&!doc.getElementById('campaignContinue54').classList.contains('r1015Lead'));
 doc.getElementById('campaignContinue54').disabled=false;api.title();
 check('첫 화면: 이어하기가 되면 이어하기를 앞에·강조',doc.getElementById('campaignContinue54').classList.contains('r1015Lead')&&doc.getElementById('campaignContinue54').style.order==='9'&&!doc.getElementById('campaignNew54').classList.contains('r1015Lead'));
 const snap=()=>panel._all().map(e=>e.tagName+e.id+'.'+e.className).join('|');const a=snap();api.title();api.title();
 check('첫 화면: 여러 번 돌려도 결과 같음',a===snap());
 check('첫 화면: 창에 r1015TitlePanel 표시, 다른 창으로 바뀌면 지움',panel.classList.contains('r1015TitlePanel')&&(panel.children=[],api.title(),!panel.classList.contains('r1015TitlePanel')));
 doc.getElementById('campaignNew54')?.click?.();}
// ② 메뉴
{const {doc,api,flush,sb}=make();const panel=mk(doc,'section','panel');doc.body.appendChild(panel);panel.appendChild(mk(doc,'button','menuClose','close','계속'));
 const header=['r263HeroBtn','journalBtn','mapBtn'].map(id=>mk(doc,'button',id,'','x'));header.forEach(b=>doc.body.appendChild(b));
 const box=mk(doc,'div','','r339Menu');panel.appendChild(box);
 const groups={'진행':['menuGuide:길잡이 켜기','menuHome:쉼터 귀환'],'저장':['menuSave:진행 저장','slotsOpenR73:저장 슬롯'],'전투와 성장':['goldOpen:황금실 제작·관리'],'설정':['menuSettings:설정','menuHelp:조작 안내'],'처음으로':['menuTitle:저장 후 첫 화면으로']};
 for(const[t,items]of Object.entries(groups)){const g=mk(doc,'section','','r339Group');g.dataset.r339=t;const h=mk(doc,'h4','','',t);const grid=mk(doc,'div','','r339Grid');g.append(h,grid);for(const it of items){const[id,l]=it.split(':');grid.appendChild(mk(doc,'button',id,'',l));}box.appendChild(g);}
 const empty=mk(doc,'section','','r339Group');empty.dataset.r339='사몽';empty.hidden=true;empty.append(mk(doc,'h4','','','사몽'),mk(doc,'div','','r339Grid'));box.appendChild(empty);
 const rare=mk(doc,'details','','r339Rare');box.appendChild(rare);
 sb.showMenu();flush();
 const q=box.querySelector('.r1015Quick');const labels=q?q.children.map(b=>b.textContent):[];
 check('메뉴: 빠른 줄이 묶음 맨 앞',box.firstElementChild===q);
 check('메뉴: 빠른 줄 = 영웅·기억·지도·진행 저장·설정·길잡이',JSON.stringify(labels)===JSON.stringify(['영웅','기억','지도','진행 저장','설정','길잡이 켜기']),JSON.stringify(labels));
 doc.clicks.length=0;for(const b of q.children)b.onclick();
 check('메뉴: 빠른 줄은 원래 단추를 누름(같은 동작)',JSON.stringify(doc.clicks)===JSON.stringify(['r263HeroBtn','journalBtn','mapBtn','menuSave','menuSettings','menuGuide']),JSON.stringify(doc.clicks));
 const folds=box.querySelectorAll('details.r1015Fold');
 check('메뉴: R339 묶음 6개가 모두 접는 묶음 안(단추 2개 이상은 닫힘)',folds.length===6&&folds.every(d=>d.querySelector('section.r339Group')&&(d.classList.contains('r1015Single')||!d.open)));
 check('메뉴: 묶음 제목에 단추 수',folds[1].querySelector(':scope>summary').textContent==='저장2개');
 check('메뉴: 빈 묶음(사몽)은 숨김',folds.find(d=>d.contains(empty)).hidden===true);
 const one=folds.find(d=>d.querySelector('[data-r339="전투와 성장"]'));check('메뉴: 단추 하나뿐인 묶음은 펼친 채(제목 숨김 표시)',one.open===true&&one.classList.contains('r1015Single'));
 check('메뉴: R339 추가 도구 접기는 설정 묶음 맨 끝',folds.find(d=>d.querySelector('[data-r339="설정"]')).lastElementChild===rare);
 check('메뉴: 원래 단추는 그대로 DOM 에',['menuGuide','menuHome','menuSave','slotsOpenR73','goldOpen','menuSettings','menuHelp','menuTitle'].every(id=>doc.getElementById(id)));
 // R339 가 다시 돌아 같은 묶음을 찾을 수 있어야(접은 뒤에도 하위에서 찾음)
 check('메뉴: R339 다시 그리기가 묶음을 찾음(querySelector 하위 검색)',box.querySelector('[data-r339="저장"]')!==null);
 const s1=box._all().length;sb.showMenu();flush();check('메뉴: 다시 열어도 빠른 줄·접기 중복 없음',box._all().length===s1&&box.querySelectorAll('.r1015Quick').length===1);}
// ③ 설정 PC / 폰
for(const mobile of[false,true]){const {doc,sb,flush}=make({mobile});const panel=mk(doc,'section','panel');doc.body.appendChild(panel);
 const quick=mk(doc,'section','quickSettingsR114');panel.appendChild(quick);quick.appendChild(mk(doc,'h3','','','간이설정'));
 for(let i=0;i<6;i++)quick.appendChild(mk(doc,'div','','r114-row','row'+i));const perf=mk(doc,'div','perfRowR150');quick.appendChild(perf);const acc=mk(doc,'section','accessR420');quick.appendChild(acc);
 const vol=mk(doc,'div','','r114-volumes');quick.appendChild(vol);quick.appendChild(mk(doc,'label','','','영화 모드'));
 const det=mk(doc,'details','detailSettingsR114');det.open=true;panel.appendChild(det);
 sb.showSettings();flush();const more=doc.getElementById('moreSettingsR142');
 if(!mobile){check('설정 PC: 더 보기 접기 생김(닫힘)',!!more&&!more.open&&more.parentNode===quick&&quick.lastElementChild===more);
  check('설정 PC: 품질 줄·렉 줄이기·밝기·음량은 바로 보임',[quick.children[1],perf,acc,vol].every(e=>e.parentNode===quick));
  check('설정 PC: 품질 줄 밖 나머지 줄 5개와 영화 모드 줄은 더 보기 안',more.querySelectorAll('.r114-row').length===5&&more.querySelectorAll('label').length===1);
  check('설정 PC: 세부설정은 닫힌 채',det.open===false);
  const late=mk(doc,'div','','r114-row','late');quick.insertBefore(late,more);sb.showSettings();flush();check('설정 PC: 늦게 붙은 줄도 다시 접음',more.contains(late));}
 else check('설정 폰: R1015 는 손대지 않음(R142 몫)',!more&&det.open===true);}
// ④ 끄기
{const {doc,api}=make({ls:{'storyworld.r1015.ui':'0'}});const panel=titleDom(doc);const before=panel._all().length;api.title();api.menu();api.settings();
 check('끄기: 첫 화면을 바꾸지 않음',panel._all().length===before&&!panel.querySelector('details.r1015TitleMore')&&!panel.classList.contains('r1015TitlePanel'));
 check('끄기: 몸에 r1015On 없음',!doc.body.classList.contains('r1015On'));}
{const {doc,api}=make();check('켜기: 몸에 r1015On, 스타일 하나',doc.body.classList.contains('r1015On')&&doc.head.querySelectorAll('#r1015Style').length===1);
 check('오류 0',api.inspect().stats.errors===0,api.inspect().lastError);
 const css=api.CSS;check('CSS: 곡 이름 금색 막대 지움·쪽지 한 줄·세부 수치 마우스 올릴 때만·폰 +77% 숨김',/#r313Bgm\{background:none!important/.test(css)&&/#r331BgmNote\{white-space:nowrap!important/.test(css)&&/footer:hover #buildText/.test(css)&&/#mobileBonusR286\{display:none!important\}/.test(css));
 check('CSS: 폰 가로(높이 520 이하) 첫 화면 압축',/@media \(max-height:520px\)/.test(css));
 check('CSS: CSS filter(blur·drop-shadow) 안 씀(Three.js 기록기 함정)',!/filter\s*:/.test(css));}
// ⑤ 연결
const idx=fs.readFileSync(path.join(root,'runtime-text','index.html'),'utf8');
check('태그 한 번, 영화 마무리 R1008 바로 뒤',idx.split('"./ui-clean-r1015.js"').length===2&&/cinema-finish-r1008\.js"><\/script>\n<script src="\.\/ui-clean-r1015\.js"><\/script>/.test(idx));
const rt=path.join(root,'runtime-text','ui-clean-r1015.js');check('runtime-text 사본이 같음(sync)',fs.existsSync(rt)&&fs.readFileSync(rt,'utf8')===src);
check('runtime-inputs·manifest 에 들어감',fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8').includes('"ui-clean-r1015.js"')&&fs.readFileSync(path.join(root,'runtime-manifest.json'),'utf8').includes('"ui-clean-r1015.js"'));
check('공개 확인 목록에 들어감',fs.readFileSync(path.join(root,'..','scripts','verify-r96-public.py'),'utf8').includes("'ui-clean-r1015.js'"));
check('CI 에 이 검사 줄',fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8').includes('node r96/qa/r1015/r1015-cpu-check.cjs'));
done();
