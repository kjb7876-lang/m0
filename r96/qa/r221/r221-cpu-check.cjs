// R221 CPU check: 광폭화 보스 장판 겹침 줄이기(붉은 하이힐 서윤 광폭화 렉).
// 같은 보스의 이미 2배로 키운 장판과 겹치는 새 장판은 원래 크기로 둔다. 안 겹치는 장판·다른 보스·장판이 아닌 위험물은 그대로 2배.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('boss-r205.js');
ok('runtime copy matches client-source',RT('boss-r205.js')===src);
ok('revision R221-boss-',/const REV='R221-boss-\d+'/.test(src));
ok('in the CI workflow',/qa\/r221\/r221-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
function run(lite,hz,enemies){const sb={console,Math,JSON,String,Number,Object,Array,localStorage:{getItem:()=>lite===false?JSON.stringify({enrageLite:false}):null,setItem(){}},window:{},
  time:10,started:true,loading:false,modal:null,player:{x:0,y:0,hp:100},room:{enemies}};vm.createContext(sb);
 vm.runInContext('var hazards=[];function tick(){} function drawEnemy(){}',sb);vm.runInContext(src,sb);
 const out=[];for(const h of hz){vm.runInContext('hazards',sb).push(h);vm.runInContext('tick(1/60)',sb);out.push(h.radius);}
 return {radii:out,B:sb.window.__STORYWORLD_BOSS_R205__,area:hz.reduce((s,h)=>s+Math.PI*h.radius**2,0)};}
const boss=()=>({id:'b',boss:true,hp:10,maxHp:100,damage:10,name:'붉은 하이힐의 서윤'});
const f=(x,y,owner='b',type='field')=>({type,owner,x,y,radius:2,age:0});
// 서윤 광폭화 실측 모양: 같은 자리 근처에 장판 10개가 연달아 깔림
const cluster=()=>[f(0,0),f(1,0),f(0,1),f(1.5,1.5),f(-1,0),f(0,-1.5),f(2,-1),f(-2,1),f(1,2),f(-1,-1)];
{const a=run(true,cluster(),[boss()]),b=run(false,cluster(),[boss()]);
 ok('first enraged field is doubled (2 → 4)',a.radii[0]===4,a.radii);
 ok('fields overlapping an already-doubled field of the same boss keep their size',a.radii.slice(1).every(r=>r===2),a.radii);
 ok('overlap draw area drops at least 3× versus doubling every field',b.area/a.area>=3,{lite:+a.area.toFixed(1),full:+b.area.toFixed(1)});
 ok('enrageLite:false restores the R217 behaviour (every field doubled)',b.radii.every(r=>r===4),b.radii);
 ok('covered ground: every lite field centre lies inside the doubled field',cluster().slice(1).every(h=>Math.hypot(h.x,h.y)<4));
 ok('stats count lite fields',a.B.inspect().stats.liteFields===9,a.B.inspect().stats);}
{const a=run(true,[f(0,0),f(10,0),f(0,10)],[boss()]);ok('far-apart fields are each doubled',a.radii.every(r=>r===4),a.radii);}
{const a=run(true,[f(0,0,'b'),f(.5,0,'c')],[boss(),{...boss(),id:'c'}]);ok('another boss field next to it is still doubled',a.radii[1]===4,a.radii);}
{const a=run(true,[f(0,0),f(.5,0,'b','ring')],[boss()]);ok('non-field hazards (rings, lines) are still doubled',a.radii[1]===4,a.radii);}
{const e=boss();e.hp=90;const a=run(true,[f(0,0)],[e]);ok('not enraged above 30% HP: no change',a.radii[0]===2);}

// WebGL2 없는 브라우저 알림(webgl-fallback-r221.js)
{const w=C('webgl-fallback-r221.js');const idx=RT('index.html'),pos=f=>idx.indexOf('./'+f);
 ok('webgl notice: runtime copy matches and loads right after dist/phase1.js, before story-maps-r171',RT('webgl-fallback-r221.js')===w&&pos('dist/phase1.js')>0&&pos('webgl-fallback-r221.js')>pos('dist/phase1.js')&&pos('webgl-fallback-r221.js')<pos('story-maps-r171.js'));
 ok('webgl notice: in the public verify list',/'webgl-fallback-r221\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 const mk=()=>{const els={};const el=(tag)=>({tag,style:{},children:[],textContent:'',id:'',setAttribute(){},append(...c){this.children.push(...c);},appendChild(c){this.children.push(c);if(c.id)els[c.id]=c;}});
  els.stage=el('div');els['phase1-status']=el('div');
  return {els,document:{getElementById:id=>els[id]||null,createElement:t=>t==='canvas'?{getContext:()=>null}:el(t),body:els.stage}};};
 const run=(msg,gl)=>{const m=mk();const got={opts:null,notice:[]};const sb={console,Math,JSON,String,Number,Object,RegExp,window:{},document:m.document};
  sb.document.createElement=t=>t==='canvas'?{getContext:()=>gl?{getExtension:()=>null}:null}:mk().document.createElement(t);
  sb.window.StoryPhase1=Object.freeze({createController(h,o){got.opts=o;got.h=h;return {};}});vm.createContext(sb);vm.runInContext(w,sb);
  const api=sb.window.StoryPhase1;api.createController({notice:x=>got.notice.push(x)},{requested:'three',requiredThree:true});got.h.notice(msg);
  return {got,els:m.els,I:sb.window.__STORYWORLD_WEBGL_FALLBACK_R221__.inspect()};};
 const a=run('Three.js 시험 경로를 시작하지 못해 Legacy를 사용합니다. WebGL2 context unavailable',false);
 ok('no WebGL2: requiredThree stays true (no Canvas play substitute), original notice still called',a.got.opts.requiredThree===true&&a.got.notice.length===1);
 ok('no WebGL2: a visible notice explains why and how (WebGL2, hardware acceleration) and the status line is replaced',!!a.els.webglNoticeR221&&/WebGL2/.test(a.els['phase1-status'].textContent)&&JSON.stringify(a.els.webglNoticeR221.children.map(c=>c.textContent||c.children?.map(x=>x.textContent))).includes('하드웨어 가속'),a.I);
 const b=run('Three.js 시험 경로를 시작하지 못해 Legacy를 사용합니다. shader compile error',true);
 ok('WebGL2 present and another Three.js failure: no WebGL notice (the original failure text stays)',!b.els.webglNoticeR221&&b.I.shown===0);
 const c=run('Three.js dependency 확인 중',false);ok('ordinary notices are ignored',!c.els.webglNoticeR221);}
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`${checks.length-fail.length}/${checks.length}`);process.exit(fail.length?1:0);
