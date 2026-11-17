'use strict';
// R1124: H 본진 지휘 상태, 카메라, 기존 명령, 입력/배치 위치, 생명주기 회귀.
// VM 모델 검증이며 실제 브라우저 렌더링/터치 검증을 대신하지 않는다.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../../client-source/survival-command-r1124.js'),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
let checks=0,failures=0;
function check(name,fn){try{fn();checks++;console.log('ok',name);}catch(e){failures++;console.error('FAIL',name,'\n ',e.message);}}
function engine(opt={}){
 const nodes=new Map(),listeners=new Map(),timers=[];
 const element=(tag='DIV')=>({tagName:tag,style:{},attrs:{},children:[],hidden:false,setAttribute(k,v){this.attrs[k]=v;},appendChild(el){this.children.push(el);if(el.id)nodes.set(el.id,el);},insertBefore(el){this.appendChild(el);},closest(){return null;},set innerHTML(value){this.html=value;for(const m of value.matchAll(/id="([^"]+)"/g)){const e=element();e.id=m[1];nodes.set(e.id,e);}},get innerHTML(){return this.html||'';}});
 const stage=element(),nav=element('NAV'),stick=element(),canvas=element('CANVAS');canvas.getBoundingClientRect=()=>({left:100,top:50,width:400,height:300});
 nodes.set('stage',stage);nodes.set('stick',stick);nodes.set('game',canvas);
 const sv={here:true,starts:1,over:false},record={opens:0,closes:0,unprojects:[],paths:[],toasts:[],clears:0,gestureClears:0};
 const c={console,Math,Number,Set,Map,document:{head:element('HEAD'),hidden:false,createElement:element,getElementById:id=>nodes.get(id)||null,querySelector:s=>s==='nav.topnav'?nav:null},
  started:true,loading:false,modal:false,storyScene:null,auto:opt.auto??false,guide:!!opt.guide,time:10,
  player:{x:30,y:25,hp:100,hero:'hwando'},room:{survivalR600:{centre:{x:50,y:50}}},cam:{x:30,y:25},
  target:null,command:null,route:[],keys:new Set(),joystickVector:{x:0,y:0},joystickId:null,canvasDrag:null,
  canvas,W:800,H:600,HEROES:{hwando:{range:3}},enemies:[],blockedValue:false,
  setInterval(fn){timers.push(fn);return {unref(){}};},
  addEventListener(name,fn,capture){const rows=listeners.get(name)||[];rows.push({fn,capture});listeners.set(name,rows);},
  liveEnemies(){return c.enemies;},findPath(p,e){record.paths.push(e.id);return e.unreachable?[]:[{x:e.x,y:e.y}];},blocked(){return c.blockedValue;},
  unproject(x,y){record.unprojects.push([x,y]);return {x:50+x/100,y:50+y/100};},toast(...a){record.toasts.push(a);},guardEnd(){c.player.guard=false;},
  clearControls(){record.clears++;c.keys.clear();c.joystickVector={x:0,y:0};c.joystickId=null;},
  cameraTick(){c.cam.x=c.player.x;c.cam.y=c.player.y;return 'camera-return';},
  enterRegion(){c.loading=true;return Promise.resolve(true);},showTitle(){c.started=false;return 'title-return';}};
 c.__STORYWORLD_MOBILE_R63__={clearGesture(){record.gestureClears++;c.canvasDrag=null;c.clearControls();}};
 c.__STORYWORLD_SURVIVAL_R600__={here:()=>sv.here,state:()=>({over:sv.over,core:{stats:{range:5.5}}}),inspect:()=>({stats:{starts:sv.starts}})};
 c.__STORYWORLD_HERO_DEFENSE_R720__={open(){record.opens++;c.modal=true;nodes.set('r720Panel',element());return true;},close(){record.closes++;c.modal=false;nodes.delete('r720Panel');return true;}};
 // 엔진은 진행 중 경로를 한 칸씩 수행하며 guide OFF 정리는 auto를 끈다.
 let wasGuide=c.guide;
 c.tick=dt=>{if(wasGuide&&!c.guide)c.auto=false;wasGuide=c.guide;if(!c.started||c.modal||c.loading||c.document.hidden||c.player.hp<=0)return 'paused';c.time+=dt;if(c.route.length){const p=c.route.shift();c.player.x=p.x;c.player.y=p.y;}if(opt.afterTick)opt.afterTick(c);return 'tick-return';};
 c.window=c;vm.createContext(c);vm.runInContext(source,c);
 const api=c.__STORYWORLD_SURVIVAL_COMMAND_R1124__;
 function emit(type,options={}){const e={key:'',code:'',target:element(),repeat:false,prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...options};for(const row of listeners.get(type)||[]){row.fn(e);if(e.stopped)break;}return e;}
 return {c,api,sv,record,nodes,timers,emit};
}
check('H pins only the camera, preserves the existing move/target, and releases held controls',()=>{
 const {c,api,emit}=engine();const route=[{x:32,y:25},{x:34,y:25}];c.route=route;c.target='already-chosen';c.keys.add('ArrowRight');c.joystickVector={x:1,y:0};c.player.guard=true;
 const e=emit('keydown',{code:'KeyH',key:'h'});assert.equal(e.stopped,true);assert.equal(api.state().baseView,true);assert.equal(c.route,route);assert.equal(c.target,'already-chosen');assert.deepEqual(clone(c.cam),{x:50,y:50});assert.equal(c.player.x,30);assert.equal(c.player.y,25);assert.equal(c.keys.size,0);assert.deepEqual(clone(c.joystickVector),{x:0,y:0});assert.equal(c.player.guard,false);assert.equal(c.auto,true);
 assert.equal(c.tick(.1),'tick-return');assert.equal(c.player.x,32);assert.equal(c.route,route);assert.equal(c.route.length,1);assert.deepEqual(clone(c.cam),{x:50,y:50});
});
check('H again restores prior auto state and hero camera without discarding active orders',()=>{
 for(const original of [false,true]){const {c,api,emit}=engine({auto:original});c.command='ordered-target';const r=c.route=[{x:35,y:25}];api.setBase(true);c.player.x=33;emit('keydown',{code:'KeyH',key:'h'});assert.equal(api.state().baseView,false);assert.equal(c.auto,original);assert.deepEqual(clone(c.cam),{x:33,y:25});assert.equal(c.command,'ordered-target');assert.equal(c.route,r);}
});
check('existing attack and movement commands take precedence over automatic target selection',()=>{
 const {c,api,record}=engine();c.enemies=[{id:'near-new',x:31,y:25,hp:10}];c.command='already-ordered';api.setBase(true);api.qaThink();assert.equal(c.command,'already-ordered');assert.equal(record.paths.length,0);c.command=null;c.route=[{x:35,y:25}];api.qaThink();assert.equal(c.command,null);assert.equal(record.paths.length,0);
});
check('idle hero selects the closest reachable living visible enemy and avoids invalid targets',()=>{
 const {c,api,record}=engine();c.enemies=[{id:'dead',x:30.2,y:25,hp:0},{id:'recorded',x:30.3,y:25,hp:10,deadRecorded:true},{id:'hidden',x:30.4,y:25,hp:10,visible:false},{id:'bad',x:NaN,y:25,hp:10},{id:'far',x:99,y:25,hp:10},{id:'blocked',x:34,y:25,hp:10,unreachable:true},{id:'reachable',x:36,y:25,hp:10}];api.setBase(true);api.qaThink();assert.equal(c.command,'reachable');assert.equal(c.target,'reachable');assert.deepEqual(record.paths,['blocked','reachable']);assert.deepEqual(clone(c.route),[{x:36,y:25}]);
});
check('in-range enemy needs no path, and thinking is throttled when no eligible enemy exists',()=>{
 const {c,api,record}=engine();api.setBase(true);api.qaThink();c.enemies=[{id:'near',x:31,y:25,hp:10}];api.qaThink();assert.equal(c.command,null);c.time+=.51;api.qaThink();assert.equal(c.command,'near');assert.equal(record.paths.length,0);assert.equal(c.route.length,0);
});
check('camera tick remains pinned and reports original return value',()=>{
 const {c,api}=engine();api.setBase(true);c.player.x=10;assert.equal(c.cameraTick(.1),'camera-return');assert.deepEqual(clone(c.cam),{x:50,y:50});api.setBase(false);c.player.x=11;c.cameraTick(.1);assert.equal(c.cam.x,11);
});
check('canvas coordinates respect CSS scaling and select placement without issuing hero orders',()=>{
 const {c,api,emit,record}=engine();c.command='ordered';const r=c.route=[{x:31,y:25}];api.setBase(true);const e=emit('pointerdown',{target:c.canvas,clientX:200,clientY:100,button:0});assert.equal(e.stopped,true);assert.equal(e.prevented,true);assert.deepEqual(record.unprojects,[[200,100]]);assert.deepEqual(clone(api.placementPoint()),{x:52,y:51});assert.equal(record.opens,1);assert.equal(c.command,'ordered');assert.equal(c.route,r);assert.equal(c.player.x,30);
 const copy=api.placementPoint();copy.x=500;assert.equal(api.placementPoint().x,52);
});
check('invalid or blocked placement never opens deployment or changes hero order',()=>{
 const {c,api,emit,record}=engine();api.setBase(true);c.command='ordered';assert.equal(api.selectPoint({x:Infinity,y:50}),false);assert.equal(api.selectPoint({x:60,y:50}),false);c.blockedValue=true;const e=emit('pointerdown',{target:c.canvas,clientX:200,clientY:100});assert.equal(e.stopped,true);assert.equal(record.opens,0);assert.equal(api.placementPoint(),null);assert.equal(c.command,'ordered');assert.ok(record.toasts.length>=3);
});
check('H closes its deployment modal and returns, but unrelated modals retain control',()=>{
 const {c,api,emit,record,nodes}=engine();api.setBase(true);c.__STORYWORLD_HERO_DEFENSE_R720__.open();emit('keydown',{key:'h',code:'KeyH'});assert.equal(record.closes,1);assert.equal(c.modal,false);assert.equal(api.state().baseView,false);
 api.setBase(true);c.modal=true;nodes.delete('r720Panel');const e=emit('keydown',{key:'h',code:'KeyH'});assert.equal(e.stopped,false);assert.equal(api.state().baseView,true);assert.equal(c.modal,true);
});
check('editing fields, modifiers, and repeated H presses cannot toggle accidentally',()=>{
 const {api,emit}=engine();for(const target of [{tagName:'INPUT'},{tagName:'TEXTAREA'},{tagName:'SELECT'},{isContentEditable:true},{closest:()=>({})}]){emit('keydown',{key:'h',code:'KeyH',target});assert.equal(api.state().baseView,false);}for(const flag of ['ctrlKey','metaKey','altKey']){emit('keydown',{key:'h',code:'KeyH',[flag]:true});assert.equal(api.state().baseView,false);}emit('keydown',{key:'h',code:'KeyH',repeat:true});assert.equal(api.state().baseView,false);
 emit('keydown',{key:'ㅗ',code:'KeyH'});assert.equal(api.state().baseView,true);emit('keydown',{key:'h',code:'KeyH',repeat:true});assert.equal(api.state().baseView,true);
});
check('arrows and new joystick presses are intercepted only in base view',()=>{
 const {api,emit}=engine();assert.equal(emit('keydown',{key:'ArrowLeft'}).stopped,false);api.setBase(true);assert.equal(emit('keydown',{key:'ArrowLeft'}).stopped,true);assert.equal(emit('pointerdown',{target:{closest:s=>s==='#joystick'?{}:null}}).stopped,true);api.setBase(false);assert.equal(emit('keydown',{key:'ArrowLeft'}).stopped,false);
});
check('active joystick capture and canvas drag are cleared when switching to base',()=>{
 const {c,api}=engine();c.joystickId=7;c.canvasDrag={id:8};api.setBase(true);assert.equal(c.joystickId,null,'active pointer capture remains');assert.equal(c.canvasDrag,null,'prior canvas drag remains');
});
check('guide OFF cleanup cannot leave the autonomous base hero with auto disabled',()=>{
 const {c,api}=engine({guide:true,auto:false});api.setBase(true);c.tick(.1);assert.equal(c.auto,true);api.setBase(false);assert.equal(c.auto,false);
});
check('death, survival defeat, exit, and new run clear base mode and restore auto',()=>{
 for(const mutate of [({c})=>{c.player.hp=0;},({sv})=>{sv.over=true;},({sv})=>{sv.here=false;},({sv})=>{sv.starts++;}]){const e=engine({auto:false});e.api.setBase(true);e.api.selectPoint({x:52,y:50});mutate(e);e.c.tick(.1);assert.equal(e.api.state().baseView,false);assert.equal(e.api.placementPoint(),null);assert.equal(e.c.auto,false);}
});
check('changing the player body clears base mode without imposing old auto on the new body',()=>{
 const {c,api}=engine({auto:false});api.setBase(true);c.player={hero:'hwando',hp:100,x:10,y:10};c.auto=true;c.tick(.1);assert.equal(api.state().baseView,false);assert.equal(c.auto,true);
});
check('survival room change clears placement and pins the new core',()=>{
 const {c,api}=engine();api.setBase(true);api.selectPoint({x:52,y:50});c.room={survivalR600:{centre:{x:20,y:20}}};c.cameraTick(.1);assert.equal(api.state().baseView,true);assert.equal(api.placementPoint(),null);assert.deepEqual(clone(c.cam),{x:20,y:20});
});
check('title resets state and UI exposes a separate base and hero action',()=>{
 const {c,api,nodes,timers}=engine();timers.forEach(fn=>fn());assert.equal(nodes.get('r1124HomeBtn').attrs['aria-pressed'],'false');api.setBase(true);assert.equal(nodes.get('r1124CommandBar').hidden,false);assert.equal(nodes.get('r1124HomeBtn').attrs['aria-pressed'],'true');assert.equal(c.showTitle(),'title-return');assert.equal(api.state().baseView,false);assert.equal(nodes.get('r1124CommandBar').hidden,true);assert.equal(api.state().stats.errors,0);
});
check('touch entry is attached to the stage and restores control through the return button',()=>{
 const {c,api,nodes,timers}=engine({auto:false});timers.forEach(fn=>fn());
 const touch=nodes.get('r1124TouchHomeBtn');assert.ok(touch,'mobile base entry is missing');
 assert.ok(nodes.get('stage').children.includes(touch),'mobile entry must remain outside the hidden header');
 assert.equal(touch.hidden,false);assert.equal(touch.disabled,false);assert.equal(touch.attrs['aria-pressed'],'false');
 c.keys.add('ArrowRight');c.joystickVector={x:1,y:0};const r=c.route=[{x:35,y:25}];
 touch.onclick();assert.equal(api.state().baseView,true);assert.equal(touch.hidden,true);assert.equal(c.auto,true);assert.equal(c.route,r);assert.equal(c.keys.size,0);assert.deepEqual(clone(c.joystickVector),{x:0,y:0});
 nodes.get('r1124Return').onclick();assert.equal(api.state().baseView,false);assert.equal(c.auto,false);assert.equal(c.route,r);assert.equal(touch.hidden,false);
});
check('touch entry is disabled during modal/loading and hidden after survival ends',()=>{
 const {c,sv,nodes,timers}=engine();const refresh=()=>timers.forEach(fn=>fn());refresh();const touch=nodes.get('r1124TouchHomeBtn');assert.ok(touch);
 c.modal=true;refresh();assert.equal(touch.disabled,true);c.modal=false;c.loading=true;refresh();assert.equal(touch.disabled,true);c.loading=false;sv.here=false;refresh();assert.equal(touch.hidden,true);
});
check('non-survival, dead, loading, and modal states reject entry',()=>{
 for(const mutate of [({sv})=>{sv.here=false;},({c})=>{c.player.hp=0;},({c})=>{c.loading=true;},({c})=>{c.modal=true;},({c})=>{c.storyScene={};},({c})=>{c.started=false;}]){const e=engine();mutate(e);assert.equal(e.api.setBase(true),false);assert.equal(e.api.state().baseView,false);}
});
check('automatic dash cancellation retains only uncompleted move waypoints',()=>{
 const {c,api}=engine({afterTick(c){c.player.x=33;c.route=[];c.command=null;}});c.route=[{x:31,y:25},{x:35,y:25}];api.setBase(true);c.tick(.1);assert.deepEqual(clone(c.route),[{x:35,y:25}]);assert.equal(c.command,null);
});
check('automatic dash cancellation restores a live attack command, never a defeated target',()=>{
 for(const defeated of [false,true]){const {c,api}=engine({afterTick(c){c.command=null;c.target=null;c.route=[];if(defeated)c.enemies[0].hp=0;}});c.enemies=[{id:'ordered',hp:10,x:36,y:25}];c.command=c.target='ordered';c.route=[{x:31,y:25},{x:35,y:25}];api.setBase(true);c.tick(.1);assert.equal(c.command,defeated?null:'ordered');assert.equal(c.target,defeated?null:'ordered');assert.equal(c.route.length,defeated?0:1);}
});
check('a completed route cannot be resurrected by an automatic skill',()=>{
 const {c,api}=engine({afterTick(c){c.route=[];}});c.route=[{x:31,y:25}];api.setBase(true);c.tick(.1);assert.equal(c.player.x,31);assert.equal(c.route.length,0);
});
check('mid-tick room/body replacement never inherits previous hero commands or paths',()=>{
 for(const body of [false,true]){const {c,api}=engine({afterTick(c){if(body)c.player={x:4,y:4,hp:100,hero:'hwando'};else c.room={survivalR600:{centre:{x:9,y:9}}};c.route=[];c.command=null;}});c.command='old';c.enemies=[{id:'old',hp:100,x:36,y:25}];c.route=[{x:31,y:25},{x:35,y:25}];api.setBase(true);c.tick(.1);assert.equal(c.command,null);assert.equal(c.route.length,0);if(body)assert.equal(api.state().baseView,false);}
});
check('loading between survival stages keeps the base view and clears the selected placement',()=>{
 const {c,api}=engine();api.setBase(true);api.selectPoint({x:52,y:50});c.enterRegion('next');c.tick(.1);assert.equal(api.state().baseView,true);assert.equal(api.placementPoint(),null);c.room={survivalR600:{centre:{x:15,y:15}}};c.loading=false;c.tick(.1);assert.equal(api.state().baseView,true);assert.deepEqual(clone(c.cam),{x:15,y:15});
});
check('canvas/joystick pointermove cannot steer the hero while managing the base',()=>{
 const {c,api,emit}=engine();api.setBase(true);assert.equal(emit('pointermove',{target:c.canvas}).stopped,true);assert.equal(emit('pointermove',{target:{closest:s=>s==='#joystick'?{}:null}}).stopped,true);api.setBase(false);assert.equal(emit('pointermove',{target:c.canvas}).stopped,false);
});
console.log('R1124 command:',checks,'checks passed,',failures,'failed');if(failures)process.exitCode=1;
