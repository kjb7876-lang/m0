// R1016 CPU check: 황금실·은색실 커스텀(직접 그린 도안) — 손으로 누른 시전이 실패할 때 이유 안내, 관리 창 결과 문구, 무한생존 충돌 막기.
//  실제 모듈(client-source/thread-custom-r1016.js)을 vm 에서 가짜 R74 와 돌린다. 브라우저·GPU 검증 아님.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
let src='';try{src=C('thread-custom-r1016.js');}catch(_){}
ok('module exists',src.length>0);
{let rt='',idx='',ver='',ci='';try{rt=RT('thread-custom-r1016.js');idx=RT('index.html');ver=fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8');ci=fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8');}catch(_){}
 ok('runtime copy matches; loads right after cinema-finish-r1008; in verify list and CI',src&&rt===src&&idx.includes('<script src="./cinema-finish-r1008.js"></script>\n<script src="./thread-custom-r1016.js"></script>')&&/'thread-custom-r1016\.js'/.test(ver)&&/qa\/r1016\/r1016-cpu-check\.cjs/.test(ci));}
function el(id,text=''){return{id,textContent:text};}
function mk(o={}){
 const toasts=[],listeners=[],closed=[];const els={goldMessage:el('goldMessage',o.msg??'저장했습니다.')};
 const st={gold:{learned:o.learned??true,equipped:o.eq??['a'],designs:[{id:'a'},{id:'b'}],autoUse:false,ranks:{cooldown:2,damage:'3',size:0,speed:0,slots:0,equip:0}},silver:{learned:true,equipped:['s'],designs:[{id:'s'}],autoUse:true,ranks:{cooldown:0,damage:'0',size:0,speed:0,slots:0,equip:0}}};
 let castCalls=0;
 const D={state:(k)=>st[k],stats:()=>({equip:1}),cooldown:(k)=>o.cd??0,
  cast(k,i=0,aim=null,manual=true){castCalls++;if(o.baseToast)sb.toast(o.baseToast);return o.castOk??false;},
  command(k,p,cmd){if(o.cmdFail)return{ok:false,message:'패시브 1점이 필요합니다.'};const s=st[k];if(cmd.op==='equip'){s.equipped=s.equipped.includes(cmd.id)?s.equipped.filter(v=>v!==cmd.id):[...s.equipped,cmd.id];}if(cmd.op==='upgrade'){const r=cmd.key;s.ranks[r]=r==='damage'?String(+s.ranks[r]+1):s.ranks[r]+1;}if(cmd.op==='auto')s.autoUse=cmd.enabled===true;return{ok:true};},
  decorateManager(k,refresh){return 'base';},moving:()=>false,nativeActive:()=>false};
 const sb={console,Math,JSON,Object,Array,Set,Map,Number,String,Date,Error,isFinite,localStorage:{getItem:k=>o.ls?.[k]??null,setItem(){}},
  window:{addEventListener:(t,f,c)=>listeners.push({t,f,c})},document:{getElementById:id=>els[id]||null},performance:{now:()=>sb.__now},__now:1000,
  player:{hp:100,x:0,y:0},time:o.time??10,started:true,loading:false,modal:false,storyScene:null,target:null,room:{enemies:o.enemies??[]},
  liveEnemies:()=>(o.enemies??[]).filter(e=>e.hp>0),distance:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),safeRegion:()=>!!o.safe,
  toast:(t)=>toasts.push(String(t)),closePanel:(...a)=>closed.push(a)};
 sb.window.__STORYWORLD_DANCES_R74__=Object.freeze(D);
 if(o.survival)sb.window.__STORYWORLD_SURVIVAL_R600__={active:()=>true};
 if(o.coop)sb.window.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host'};
 sb.window.window=sb.window;vm.createContext(sb);
 for(const k of ['localStorage','document','performance','player'])sb.window[k]=sb[k];
 vm.runInContext(src,sb);
 return{sb,st,toasts,listeners,closed,els,D:sb.window.__STORYWORLD_DANCES_R74__,API:sb.window.__STORYWORLD_THREAD_CUSTOM_R1016__,calls:()=>castCalls};}
const near=[{id:'e1',x:3,y:0,hp:10,spawnState:'active'}],far=[{id:'e1',x:30,y:0,hp:10,spawnState:'active'}];
if(src){
 {const t=mk({learned:false,enemies:near});const r=t.D.cast('gold',0,null,true);ok('G before learning → false + 안내(습득·Alt+G)',r===false&&t.toasts.length===1&&/습득/.test(t.toasts[0])&&/Alt\+G/.test(t.toasts[0]),t.toasts);}
 {const t=mk({eq:[],enemies:near});t.D.cast('gold',0,null,true);ok('learned but nothing equipped → 장착 안내',t.toasts.length===1&&/장착/.test(t.toasts[0]),t.toasts);}
 {const t=mk({cd:4.2,enemies:near});t.D.cast('gold',0,null,true);ok('equipped designs on cooldown → 남은 초(올림 5초) 안내',t.toasts.length===1&&/5초/.test(t.toasts[0]),t.toasts);}
 {const t=mk({cd:NaN,enemies:near});t.D.cast('gold',0,null,true);ok('cooldown NaN never leaks into the message',!t.toasts.some(s=>/NaN|Infinity/.test(s)),t.toasts);}
 {const t=mk({enemies:far});t.D.cast('gold',0,null,true);ok('no enemy within 12m and no aim point → 12m 안내',t.toasts.length===1&&/12m/.test(t.toasts[0]),t.toasts);}
 {const t=mk({enemies:[{id:'e1',x:12,y:0,hp:10,spawnState:'active'}],baseToast:'안전한 검무 공간이 없습니다.'});t.D.cast('gold',0,null,true);ok('boundary: enemy exactly 12m counts as in range → no range message (base reason only)',t.toasts.length===1&&t.toasts[0].startsWith('안전한'),t.toasts);}
 {const t=mk({enemies:far});t.D.cast('gold',0,{x:2,y:0},true);ok('aim point given (right-click) → no range message',!t.toasts.some(s=>/12m/.test(s)),t.toasts);}
 {const t=mk({castOk:true,enemies:near});const r=t.D.cast('gold',0,null,true);ok('successful cast → passes through true, no extra toast',r===true&&t.toasts.length===0&&t.calls()===1,t.toasts);}
 {const t=mk({enemies:near,baseToast:'안전한 검무 공간이 없습니다. 재사용 시간은 소비하지 않았습니다.'});t.D.cast('gold',0,null,true);ok('base already explained the failure (plan) → no duplicate toast',t.toasts.length===1,t.toasts);}
 {const t=mk({learned:false,enemies:near});t.D.cast('gold',0,null,false);ok('auto/semi-auto (manual=false) failure stays silent (regression: no spam)',t.toasts.length===0,t.toasts);}
 {const t=mk({learned:false,enemies:near});t.D.cast('silver',0,null,true);ok('silver failure is left to R243 fallback (no R1016 toast)',t.toasts.length===0,t.toasts);}
 {const t=mk({learned:false,enemies:near});t.D.cast('gold',0,null,true);t.sb.__now+=300;t.D.cast('gold',0,null,true);ok('held/mashed G within 0.8s → one message',t.toasts.length===1,t.toasts);t.sb.__now+=900;t.D.cast('gold',0,null,true);ok('after 0.8s the message can show again',t.toasts.length===2,t.toasts);}
 {const t=mk({safe:true,enemies:near});t.D.cast('gold',0,null,true);ok('in a sanctuary → 쉼터 안내',t.toasts.length===1&&/쉼터/.test(t.toasts[0]),t.toasts);}
 {const t=mk({safe:true,learned:false,enemies:near});t.D.cast('gold',0,null,true);ok('not learned yet, standing in a sanctuary → the actionable 습득 hint comes first',t.toasts.length===1&&/습득/.test(t.toasts[0]),t.toasts);}
 {const t=mk({coop:true,learned:false,enemies:near});t.D.cast('gold',0,null,true);ok('co-op: R1016 adds nothing',t.toasts.length===0,t.toasts);}
 // 무한생존
 {const t=mk({survival:true,learned:false,enemies:near});const r=t.D.cast('gold',0,null,true);ok('survival: G → 무한생존 안내, base not called',r===false&&t.calls()===0&&t.toasts.length===1&&/무한생존/.test(t.toasts[0]),t.toasts);}
 {const t=mk({survival:true});const r=t.D.decorateManager('gold',()=>0);ok('survival: manager that opens anyway is closed with a message (drawings there would vanish)',t.closed.length===1&&t.toasts.some(s=>/무한생존/.test(s)),{closed:t.closed.length,toasts:t.toasts});}
 {const t=mk({survival:true});const h=t.listeners.find(l=>l.t==='keydown'&&l.c===true);let prevented=0,stopped=0;h&&h.f({code:'KeyG',altKey:true,repeat:false,target:{matches:()=>false},preventDefault(){prevented++;},stopImmediatePropagation(){stopped++;}});ok('survival: Alt+G (manager) is caught before the R72 document handler',!!h&&prevented===1&&stopped===1&&t.toasts.length===1,{h:!!h,prevented,stopped});}
 {const t=mk({});const h=t.listeners.find(l=>l.t==='keydown'&&l.c===true);let stopped=0;h&&h.f({code:'KeyG',altKey:true,repeat:false,target:{matches:()=>false},preventDefault(){},stopImmediatePropagation(){stopped++;}});ok('story: Alt+G untouched (regression)',stopped===0);}
 {const t=mk({survival:false});t.D.decorateManager('gold',()=>0);ok('story: manager untouched',t.closed.length===0);}
 // 관리 창 결과 문구
 const flow=(o,cmd,k='gold')=>{const t=mk(o);const r=t.D.command(k,t.sb.player,cmd);t.D.decorateManager(k,()=>0);return{t,msg:t.els.goldMessage.textContent,r};};
 {const {msg}=flow({},{op:'learn'});ok('learn → 습득했습니다',/습득했습니다/.test(msg),msg);}
 {const {msg}=flow({eq:[]},{op:'equip',id:'a'});ok('equip → 장착했습니다',/장착했습니다/.test(msg),msg);}
 {const {msg}=flow({eq:['a']},{op:'equip',id:'a'});ok('equip toggle off → 장착을 해제했습니다',/해제했습니다/.test(msg),msg);}
 {const {msg}=flow({},{op:'upgrade',key:'cooldown'});ok('upgrade → 쿨타임 3단계로 강화',/쿨타임/.test(msg)&&/3단계/.test(msg),msg);}
 {const {msg}=flow({},{op:'upgrade',key:'damage'});ok('upgrade damage (string rank) → 피해 4단계',/피해/.test(msg)&&/4단계/.test(msg),msg);}
 {const {msg}=flow({},{op:'auto',enabled:true});ok('auto on → 켰습니다',/켰습니다/.test(msg),msg);}
 {const {msg}=flow({},{op:'delete',id:'b'});ok('delete → 삭제했습니다',/삭제했습니다/.test(msg),msg);}
 {const {msg}=flow({cmdFail:true,msg:'패시브 1점이 필요합니다.'},{op:'upgrade',key:'size'});ok('failure message kept as is',msg==='패시브 1점이 필요합니다.',msg);}
 {const {msg}=flow({msg:'도안을 저장했습니다. 이제 습득·장착할 수 있습니다.'},{op:'save'});ok('save message kept as is',msg.startsWith('도안을 저장했습니다'),msg);}
 {const t=mk({});t.D.command('gold',t.sb.player,{op:'learn'});t.sb.__now+=5000;t.els.goldMessage.textContent='저장했습니다.';t.D.decorateManager('gold',()=>0);ok('stale op (re-opening the manager later) does not relabel',t.els.goldMessage.textContent==='저장했습니다.'||t.els.goldMessage.textContent==='',t.els.goldMessage.textContent);}
 {const t=mk({ls:{'storyworld.r1016.threadCustom':'0'},learned:false,enemies:near});t.D.cast('gold',0,null,true);ok('off switch (localStorage storyworld.r1016.threadCustom=0) → no change',t.toasts.length===0);}
 {const t=mk({});ok('API inspect exposes revision',t.API&&/R1016/.test(t.API.inspect().revision));}
}
const failed=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail??'')));
console.log(JSON.stringify({revision:'R1016-cpu',checks:checks.length,failed:failed.length}));process.exit(failed.length?1:0);
