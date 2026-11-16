// R1092 CPU 검사: 서사 창 장면 그림(세로판 장면 일러스트 재사용, story-art-r1092.js).
//  실제 모듈을 vm 에서 가짜 서사 창(advanceScene → #panel .storyArt img.bg)과 돌린다. 브라우저·GPU 검증 아님.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
let src='',idx='',meta=null;try{src=C('story-art-r1092.js');}catch(_){}
try{idx=RT('index.html');}catch(_){}
try{meta=JSON.parse(fs.readFileSync(path.join(R,'r1092-scene-art.json'),'utf8'));}catch(_){}
ok('모듈 있음',src.length>0);
ok('출처 기록 r1092-scene-art.json 있음',!!meta&&Array.isArray(meta.items));

// ── 지역 표(엔진 정본 데이터)와 그림 대응 ──
const regions=[...idx.matchAll(/"id":"([a-z0-9]+)","index":(\d+),"chapter":"[^"]*","chapterIndex":\d+,"title":"([^"]*)"/g)].map(m=>({id:m[1],title:m[3]}));
ok('엔진 지역 56곳을 읽음',regions.length===56,regions.length);
const items=meta?.items||[],byId=Object.fromEntries(items.map(i=>[i.region,i]));
const want=regions.filter(r=>r.id!=='ep1b06');
ok('맘몬 지역(ep1b06)을 뺀 55곳 모두 그림 있음',want.every(r=>byId[r.id]),want.filter(r=>!byId[r.id]).map(r=>r.id).join(','));
ok('맘몬 지역(ep1b06)은 그림 없음(Codex 몫, 손대지 않음)',!byId.ep1b06&&!/'ep1b06'/.test(src));
ok('그림 제목이 지역 제목과 같음(서사 불변·지어내기 없음)',items.every(i=>{const r=regions.find(x=>x.id===i.region);return r&&i.title===r.title;}),items.filter(i=>{const r=regions.find(x=>x.id===i.region);return !r||i.title!==r.title;}).map(i=>i.region).join(','));

// ── 자산 규격: 워터마크 자리 잘라냄·크기·용량 ──
let total=0;const bad=[];
for(const i of items){const p=path.join(R,'runtime-text',i.path);let b=null;try{b=fs.readFileSync(p);}catch(_){}
 if(!b){bad.push(i.region+':없음');continue;}total+=b.length;
 const webp=b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP';
 if(!webp)bad.push(i.region+':webp아님');if(b.length>160000)bad.push(i.region+':'+b.length);
 // VP8 / VP8L / VP8X 헤더에서 크기 읽기
 let w=0,h=0;const t=b.slice(12,16).toString();
 if(t==='VP8 '){w=b.readUInt16LE(26)&0x3fff;h=b.readUInt16LE(28)&0x3fff;}
 else if(t==='VP8L'){const v=b.readUInt32LE(21);w=(v&0x3fff)+1;h=((v>>14)&0x3fff)+1;}
 else if(t==='VP8X'){w=1+b.readUIntLE(24,3);h=1+b.readUIntLE(27,3);}
 if(w!==i.size?.[0]||h!==i.size?.[1])bad.push(i.region+':크기'+w+'x'+h);
 if(!(i.crop&&i.crop[3]<=1216))bad.push(i.region+':아래 잘라내기 없음');
 if(!/^[0-9a-f]{64}$/.test(i.sourceSha256||''))bad.push(i.region+':원본 해시 없음');}
ok('55장 모두 webp·기록 크기와 같음·장당 160KB 이하·워터마크 줄(y>1216) 잘라냄·원본 해시',items.length===55&&bad.length===0,bad.slice(0,8).join(' '));
ok('합계 9MB 이하(Pages 예산)',total>0&&total<=9e6,total);
ok('붉은 하이힐(ep1b05)은 위아래 이음매 아래를 잘라 한 판만',(byId.ep1b05?.crop?.[3]||9999)<=690,byId.ep1b05?.crop);

// ── 연결: 태그·검사 목록·CI·sync ──
{let rt='',ver='',ci='',man='',inp='';try{rt=RT('story-art-r1092.js');ver=fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8');ci=fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8');man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');inp=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');}catch(_){}
 ok('런타임 사본 같음',src&&rt===src);
 ok('태그 한 번, 패시브 컷인 R1033 바로 뒤',idx.split('"./story-art-r1092.js"').length===2&&idx.includes('<script src="./passive-cutin-r1033.js"></script>\n<script src="./story-art-r1092.js"></script>'));
 ok('공개 확인 목록·CI 검사 줄',/'story-art-r1092\.js'/.test(ver)&&/qa\/r1092\/r1092-cpu-check\.cjs/.test(ci));
 ok('manifest·inputs 에 모듈과 그림 55장',man.includes('"story-art-r1092.js"')&&inp.includes('story-art-r1092.js')&&items.every(i=>man.includes(i.path)&&inp.includes(i.path)));}

// ── 동작: 가짜 서사 창 ──
function run(o={}){
 const imgs=[];const mkEl=(tag,cls,s)=>{const e={tagName:tag,className:cls||'',get classList(){const self=this;return{add:(...c)=>{const a=String(self.className).split(' ').filter(Boolean);for(const x of c)if(!a.includes(x))a.push(x);self.className=a.join(' ');},remove:(...c)=>{self.className=String(self.className).split(' ').filter(x=>x&&!c.includes(x)).join(' ');},contains:x=>String(self.className).split(' ').includes(x)};},src:s||'',alt:'',style:{},dataset:{},children:[],_l:{},parentNode:null,
  addEventListener(t,f){this._l[t]=f;},removeEventListener(){},setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];},
  appendChild(c){c.parentNode=this;this.children.push(c);return c;},insertBefore(c,ref){c.parentNode=this;const i=this.children.indexOf(ref);this.children.splice(i<0?this.children.length:i,0,c);return c;},
  remove(){const p=this.parentNode;if(p){p.children.splice(p.children.indexOf(this),1);this.parentNode=null;}},
  querySelector(q){const walk=n=>{for(const c of n.children){if(q==='img'&&c.tagName==='img')return c;if(q.startsWith('.')&&String(c.className).split(' ').includes(q.slice(1)))return c;const r=walk(c);if(r)return r;}return null;};return walk(this);}};
  if(tag==='img')imgs.push(e);return e;};
 let bg=null,actor=null,root=null,panel=null,text=null;const head=mkEl('head');
 const store={};if(o.pref)store['storyworld.r1092.sceneArt']=JSON.stringify(o.pref);
 const sb={console,JSON,Math,Object,Array,String,Number,Boolean,Set,Map,WeakMap,Date,Error,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},
  urlFor:p=>'https://cdn.example/'+p,
  regionById:Object.fromEntries(regions.map(r=>[r.id,{id:r.id,title:r.title,map:'maps/'+r.id+'.webp'}])),
  storyScene:null,
  document:{head,querySelector:s=>s==='#panel .storyArt'?root:s==='#panel .storyArt img.bg'?bg:null,getElementById:id=>id==='panel'?panel:(id==='r1092Css'?head.children.find(c=>c.id==='r1092Css')||null:null),
   createElement:t=>mkEl(t),documentElement:{classList:{contains:()=>false}}},
  advanceScene:function(){const id=o.zone;sb.storyScene=o.noScene?null:{id,key:id+':pre',title:'t'};
   // 엔진처럼 창을 새로 그림(이전 핀이 남는 경우는 o.keepPanel 로 흉내)
   if(!o.keepPanel||!panel){panel=mkEl('div','');const layout=panel.appendChild(mkEl('div','storyLayout'));root=layout.appendChild(mkEl('div','storyArt'));
    bg=root.appendChild(mkEl('img','bg','maps/'+id+'.webp'));actor=root.appendChild(mkEl('img','actor','heroes/x.webp'));
    const col=layout.appendChild(mkEl('div','storyCol'));text=col.appendChild(mkEl('div','storyText'));}
   return 'r';}
 };
 if(o.ink!==undefined)sb.__STORYWORLD_INK_WASH_R1055__={wants:z=>o.ink===true||o.ink===z};
 sb.window=sb;vm.createContext(sb);
 try{vm.runInContext(src,sb,{filename:'story-art-r1092.js'});}catch(e){return{err:String(e)};}
 let r;try{r=sb.advanceScene();if(o.twice)sb.advanceScene();if(o.thenZone){o.zone=o.thenZone;sb.advanceScene();}}catch(e){return{err:String(e)};}
 const pins=[];const walk=n=>{for(const c of n.children){if(String(c.className).split(' ').includes('r1092Pin'))pins.push(c);walk(c);}};if(panel)walk(panel);
 const css=(head.children.find(c=>c.id==='r1092Css')||{}).textContent||'';
 return{r,bg,actor,text,panel,pins,css,api:sb.__STORYWORLD_SCENE_ART_R1092__,sb};
}
{const t=run({zone:'ep1a09'});const it=byId.ep1a09;
 ok('advanceScene 돌려준 값 그대로',t.r==='r',t.err);
 ok('주사실 서사 창 배경이 장면 그림으로 바뀜',it&&t.bg?.src==='https://cdn.example/'+it.path,t.bg?.src);
 ok('영웅·보스 초상(actor)은 그대로',t.actor?.src==='heroes/x.webp');
 ok('그림 못 읽으면 원래 지도 그림으로 되돌림',(()=>{if(!t.bg?._l?.error)return false;t.bg._l.error();return t.bg.src==='https://cdn.example/maps/ep1a09.webp'||t.bg.src==='maps/ep1a09.webp';})(),t.bg?.src);
 ok('API: 상태·그림 수',t.api&&t.api.count===55&&t.api.stats().applied===1,t.api&&JSON.stringify(t.api.stats()));}
{const t=run({zone:'ep1b06'});ok('맘몬 지역은 원래 지도 그림 그대로',t.bg?.src==='maps/ep1b06.webp',t.bg?.src);}
{const t=run({zone:'ep1a09',pref:{on:false}});ok('설정 끔이면 원래 그림 그대로',t.bg?.src==='maps/ep1a09.webp',t.bg?.src);}
{const t=run({zone:'ep1a09',noScene:true});ok('서사 장면이 없으면(닫힘) 아무것도 안 함',t.bg?.src==='maps/ep1a09.webp'&&!t.err,t.err);}
{const t=run({zone:'last302',ink:true});ok('수묵화풍이 켜진 지역이면 그림도 먹빛(grayscale·sepia, CSS 필터만)',/grayscale\(/.test(t.bg?.style?.filter||'')&&/sepia\(/.test(t.bg.style.filter)&&!/blur|drop-shadow/.test(t.bg.style.filter),t.bg?.style?.filter);}
{const t=run({zone:'dist01',ink:'last302'});ok('수묵화풍이 그 지역에 꺼져 있으면 원래 색',!(t.bg?.style?.filter||'').includes('grayscale'),t.bg?.style?.filter);}
{const t=run({zone:'dist01'});ok('수묵 모듈이 없어도 오류 없이 원래 색',!t.err&&t.bg?.src.endsWith(byId.dist01?.path||'??'),t.err||t.bg?.src);}
{const t=run({zone:'dist01',twice:true});ok('두 번 불러도 한 번 바꾼 그림 그대로(겹쳐 감싸지 않음)',t.bg?.src.endsWith(byId.dist01?.path||'??')&&t.api?.stats().applied===2);}
// ── R255 쪽지 모양(배경·초상 칸 숨김)에서도 보이게: 쪽지 머리에 장면 그림 한 장 ──
{const t=run({zone:'ep1a09'});const it=byId.ep1a09;const pin=t.pins[0];const im=pin&&pin.querySelector('img');
 ok('쪽지용 장면 그림 칸(.r1092Pin)이 글 상자(.storyText) 바로 앞에 하나',t.pins.length===1&&pin.parentNode===t.text.parentNode&&pin.parentNode.children.indexOf(pin)===pin.parentNode.children.indexOf(t.text)-1,t.pins.length);
 ok('그 칸의 그림 = 장면 그림, 대체글은 지역 제목',im&&it&&im.src==='https://cdn.example/'+it.path&&im.alt===it.title,im&&im.src);
 ok('CSS: 기본은 숨김, R255 쪽지 창(#panel.r255-doc)에서만 보임',/\.r1092Pin\{[^}]*display:none/.test(t.css)&&/#panel\.r255-doc \.r1092Pin\{[^}]*display:block/.test(t.css),t.css.slice(0,160));
 ok('CSS: 낮은 화면에서는 숨김(글 상자 자리 지킴)',/@media \(max-height:\s*\d+px\)\{[^{]*\.r1092Pin\{display:none/.test(t.css));
 ok('CSS: 그림 칸이 있으면(창에 r1092-pin 표시) 글 상자 높이를 줄여 창이 화면을 넘지 않음(쪽지 표식이 사이에 끼어도)',/#panel\.r255-doc\.r1092-pin \.storyText\{max-height:/.test(t.css)&&/\br1092-pin\b/.test(t.panel.className),t.panel.className);
 ok('그림 못 읽으면 칸을 치움',(()=>{if(!im?._l?.error)return false;im._l.error();return !pin.parentNode;})());}
{const t=run({zone:'ep1b06'});ok('맘몬 지역은 쪽지 그림 칸 없음',t.pins.length===0);}
{const t=run({zone:'ep1a09',pref:{on:false}});ok('설정 끔이면 쪽지 그림 칸 없음',t.pins.length===0);}
{const t=run({zone:'ep1a09',keepPanel:true,thenZone:'ep1b06'});ok('같은 창에서 그림 없는 장면으로 넘어가면 이전 칸·창 표시를 치움',t.pins.length===0&&!/r1092-pin/.test(t.panel.className),t.pins.length+' '+t.panel.className);}
{const t=run({zone:'ep1a09',keepPanel:true,twice:true});ok('같은 창에서 두 번 불러도 칸은 하나',t.pins.length===1,t.pins.length);}
{const t=run({zone:'last302',ink:true});const im=t.pins[0]?.querySelector('img');ok('수묵화풍이면 쪽지 그림도 먹빛',/grayscale\(/.test(im?.style?.filter||''),im?.style?.filter);}
ok('모듈이 two-times 로드돼도 한 번만 감쌈',/if\(window\.__STORYWORLD_SCENE_ART_R1092__/.test(src));
ok('전역 덮어쓰기 없음(tick·render 안 건드림)',!/\btick\s*=|\.render\s*=/.test(src));

const fail=checks.filter(c=>!c.pass);
for(const c of checks)console.log((c.pass?'PASS':'FAIL')+' '+c.name+(c.pass||c.detail===undefined?'':' :: '+JSON.stringify(c.detail)));
console.log(JSON.stringify({revision:'R1092',checks:checks.length,failed:fail.length}));
process.exit(fail.length?1:0);
