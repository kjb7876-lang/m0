/* Golden custom sword dance. Simulation owns damage; drawing only paints it. */
(()=>{'use strict';
 const C=StoryGoldenCoreR72,casts=new Map(),trailPools=new WeakMap(),events=[];let serial=0,lastResult=null;
 const coop=()=>window.__STORYWORLD_COOP_SIM_R62__,guest=()=>coop()?.mode()==='guest';
 const current=()=>coop()?.currentPlayer?.()||player,local=()=>coop()?.localPlayer?.()||player;
 const state=(p=current())=>{if(!p)return C.fresh();return p.goldenR72??=(C.fresh());};
 const withActor=(p,fn)=>coop()?.withPlayer?coop().withPlayer(p,fn):fn();
 const note=(kind,data={})=>{events.push({kind,at:time,...data});if(events.length>80)events.shift();};
 const fail=message=>{lastResult={ok:false,message};return lastResult;};
 function dispatch(command,p=local()){
  if(guest()){if(command.op==='save'){try{command={...command,strokes:C.normalize(command.strokes)};}catch(e){return fail(e.message);}}return coop().requestGolden(command)?{ok:true,pending:true}:fail('협동 명령을 보내지 못했습니다.');}
  return applyCommand(p,command);
 }
 function applyCommand(p,cmd){
  if(guest()||!p||!cmd||typeof cmd!=='object')return fail('권한을 확인하세요.');
  const s=state(p),stats=C.stats(s);let changed=true;
  if(cmd.op==='save'){
   let strokes;try{strokes=C.normalize(cmd.strokes);}catch(e){return fail(e.message);}
   const existing=s.designs.find(d=>d.id===cmd.id);if(!existing&&s.designs.length>=stats.slots)return fail('도안 저장칸을 먼저 늘려주세요.');
   if(cmd.id&&!existing)return fail('수정할 도안이 없습니다.');
   const d=existing||{id:'gold-'+Date.now().toString(36)+'-'+(++serial).toString(36)};d.name=C.name(cmd.name);d.strokes=strokes;if(!existing)s.designs.push(d);lastResult={ok:true,id:d.id};
  }else if(cmd.op==='rename'){const d=s.designs.find(v=>v.id===cmd.id);if(!d)return fail('도안을 찾을 수 없습니다.');d.name=C.name(cmd.name);
  }else if(cmd.op==='clone'){const d=s.designs.find(v=>v.id===cmd.id);if(!d||s.designs.length>=stats.slots)return fail('도안이나 빈 저장칸을 확인하세요.');s.designs.push({...d,id:'gold-'+Date.now().toString(36)+'-'+(++serial).toString(36),name:C.name(d.name+' 복제'),strokes:d.strokes.map(v=>v.map(p=>({...p})))});
  }else if(cmd.op==='delete'){if(!s.designs.some(d=>d.id===cmd.id))return fail('도안이 없습니다.');s.designs=s.designs.filter(d=>d.id!==cmd.id);s.equipped=s.equipped.filter(id=>id!==cmd.id);
  }else if(cmd.op==='learn'){
   if(s.learned)return fail('이미 습득했습니다.');if(!s.designs.length||!window.__STORYWORLD_PROGRESSION_R62__.ranks('threadDanceR63',p))return fail('도안 저장과 기존 실검무 습득이 먼저 필요합니다.');if(p.points<1)return fail('패시브 1점이 필요합니다.');p.points--;s.learned=true;
  }else if(cmd.op==='equip'){
   if(!s.learned||!s.designs.some(d=>d.id===cmd.id))return fail('습득과 도안을 확인하세요.');if(s.equipped.includes(cmd.id))s.equipped=s.equipped.filter(v=>v!==cmd.id);else if(s.equipped.length<stats.equip)s.equipped.push(cmd.id);else return fail('먼저 장착 도안을 해제하세요.');
  }else if(cmd.op==='upgrade'){
   const key=cmd.key;if(!Object.hasOwn(s.ranks,key)||!s.learned)return fail('먼저 필살검무를 습득하세요.');const cap=key==='slots'?9:key==='equip'?1:10,cost=key==='equip'?3:1;if(s.ranks[key]>=cap)return fail('최대 단계입니다.');if(p.points<cost)return fail('패시브 '+cost+'점이 필요합니다.');p.points-=cost;s.ranks[key]++;
  }else if(cmd.op==='auto'){s.autoUse=cmd.enabled===true;
  }else changed=false;
  if(!changed)return fail('지원하지 않는 명령입니다.');note('manage',{op:cmd.op,actor:p.coopIdR62||'solo'});saveGame(false);coop()?.sendSnapshot?.();return cmd.op==='save'?lastResult:{ok:true};
 }
 function interrupted(p){return p.hp<=0||p.connectedR62===false||p.disabled===true||p.stun>0||p.stunned===true||p.stunnedUntil>time||p.stunUntil>time||p.storyStatus150?.until>time&&['stun','freeze','bind'].includes(p.storyStatus150.key);}
 const safe=(q,r=room)=>!blocked(q.x,q.y,.31,r);
 const clear=(a,b,r=room)=>clearPath3(a,b,.31,r);
 function returnSafe(c){const p=c.p;if(p.hp<=0||room!==c.room)return;let q=c.origin;if(!safe(q)||!clear({x:p.x,y:p.y},q)){q=null;for(let ring=1;ring<=10&&!q;ring++)for(let i=0;i<16;i++){const a=i*Math.PI/8,v={x:c.origin.x+Math.cos(a)*ring*.22,y:c.origin.y+Math.sin(a)*ring*.22};if(safe(v)&&clear({x:p.x,y:p.y},v)){q=v;break;}}if(!q&&safe(p))q={x:p.x,y:p.y};}if(q){p.x=q.x;p.y=q.y;p.moving=false;}}
 function cancel(p,reason='cancel'){const c=casts.get(p);if(!c)return;casts.delete(p);returnSafe(c);note('cancel',{reason,id:c.id});}
 function cancelAll(reason){for(const p of [...casts.keys()])cancel(p,reason);}
 function trail(c,v){
  let pool=trailPools.get(c.p);if(!pool){pool=[];trailPools.set(c.p,pool);}const slot=(c.cursor-1)%(settings.lowFx?8:16),data={a:v.a,b:v.b,stroke:v.stroke,cast:c.id,slot,actor:c.p.coopIdR62||'solo'};let e=pool[slot];
  if(!e){fx('goldenThreadR72',v.b.x,v.b.y,{life:.4,goldenR72:data,asset:null});e=effects.at(-1);if(e?.type==='goldenThreadR72')pool[slot]=e;}else{e.x=v.b.x;e.y=v.b.y;e.age=0;e.life=.4;e.goldenR72=data;if(!effects.includes(e)){if(effects.length>=(settings.lowFx?80:160))effects.shift();effects.push(e);}}
 }
 function cast(index=0,aim=null,manual=true){
  const p=current();if(guest()){if(!coop().inspect().guestInputReady||modal||loading)return false;p.pendingInputR62??={};p.pendingInputR62[index===1?'goldenSecond':'goldenCast']=true;if(aim&&Number.isFinite(aim.x)&&Number.isFinite(aim.y))p.pendingInputR62.goldenAim={x:aim.x,y:aim.y};return true;}
  const s=state(p);if(!p||!started||loading||modal||safeRegion()||interrupted(p)||casts.has(p)||time-(p.threadDanceAtR63??-Infinity)<3.5||(p.goldenReadyAtR72||0)>time||!s.learned){if(manual)toast('필살검무의 습득·장착·재사용 상태를 확인하세요.',2);return false;}
  const d=s.designs.find(d=>d.id===s.equipped[index]);if(!d){if(manual)toast('도안을 먼저 장착하세요.',2);return false;}
  const selected=room.enemies.find(e=>e.id===target&&e.hp>0&&e.spawnState==='active'),near=liveEnemies().filter(e=>distance(p,e)<=12).sort((a,b)=>distance(p,a)-distance(p,b))[0],anchor=aim||selected||near;
  if(!anchor||!Number.isFinite(anchor.x)||!Number.isFinite(anchor.y)||distance(p,anchor)>12){if(manual)toast('12m 안의 적을 선택하거나 조준점을 지정하세요.',2);return false;}
  const stats=C.stats(s),origin={x:p.x,y:p.y},plan=C.plan(d.strokes,anchor,stats.size,q=>safe(q),clear,origin);
  if(!plan){lastResult=fail('안전한 검무 공간이 없습니다. 자원과 재사용을 소비하지 않았습니다.');if(manual)toast(lastResult.message,3);return false;}
  const progression=window.__STORYWORLD_PROGRESSION_R62__,rank=progression.ranks('threadDanceR63',p),base=withActor(p,()=>attackPower()*2*(.22+Math.min(.08,rank*.006))*Math.min(12,2+rank)),budget=Math.min(Number.MAX_SAFE_INTEGER,base*stats.damage);
  const duration=Math.max(.45,Math.min(2,Math.max(.8,plan.length/14))/stats.speed),id='g72-'+(++serial),cooldown=Math.max(6,stats.cooldown*progression.factors(p).cooldown);
  p.goldenReadyAtR72=time+cooldown;const c={id,p,room,layer,origin,path:plan.path,duration,start:time,cursor:0,targets:new Map(),hits:0,budget,name:d.name,scale:plan.scale};casts.set(p,c);route=[];command=null;p.moving=false;
  note('cast',{id,actor:p.coopIdR62||'solo',name:d.name,budget,duration,cooldown,scale:plan.scale,segments:c.path.length});lastResult={ok:true,id};sound('special');return true;
 }
 function step(c){
  const p=c.p;if(room!==c.room||layer!==c.layer||interrupted(p)){cancel(p,'lifecycle');return;}
  const end=Math.min(c.path.length,Math.floor((time-c.start)/c.duration*c.path.length)+1);
  while(c.cursor<end){const v=c.path[c.cursor++];if(!safe(v.a)||!safe(v.b)||!clear({x:p.x,y:p.y},v.a)||!clear(v.a,v.b)){cancel(p,'blocked');return;}
   p.x=v.b.x;p.y=v.b.y;p.moving=false;p.attackAngle=Math.atan2(v.b.y-v.a.y,v.b.x-v.a.x);p.skillAngle=p.attackAngle;p.direction=facing(v.b.x-v.a.x,v.b.y-v.a.y);p.attackAnim=.17;p.skillAnim=.21;
   // Only painted stroke segments strike. The jump to v.a never deals damage.
   const victims=liveEnemies().filter(e=>!e.deadRecorded&&C.distance(e,v.a,v.b)<=.65&&clearLine(v.b,e)).sort((a,b)=>distance(p,a)-distance(p,b));
   for(const e of victims){const hits=c.targets.get(e.id)||0;if(hits>=C.LIMIT.hits||c.hits>=C.LIMIT.events||!c.targets.has(e.id)&&c.targets.size>=C.LIMIT.targets)continue;c.targets.set(e.id,hits+1);c.hits++;const amount=c.budget/C.LIMIT.hits;hitEnemy(e,amount,{kind:'hero-golden-r72',ability:'goldenThreadR72',hero:p.hero,coopOwnerR62:p.coopIdR62,eventId:c.id+':'+e.id+':'+hits,angle:p.attackAngle});note('hit',{id:c.id,enemy:e.id,amount,stroke:v.stroke});}
   trail(c,v);
  }
  if(c.cursor>=c.path.length){casts.delete(p);returnSafe(c);note('finished',{id:c.id,hits:c.hits,targets:c.targets.size});}
 }
 function autoCast(){return state().autoUse&&liveEnemies().some(e=>distance(current(),e)<=10)?cast(0,null,false):false;}
 const tickBase=tick;tick=function(dt,...a){const before=time,result=tickBase.call(this,dt,...a);if(guest())return result;for(const c of [...casts.values()])withActor(c.p,()=>{if(interrupted(c.p))cancel(c.p,'interrupted');else if(time>before&&!modal&&!loading)step(c);});if(time>before&&!modal&&!loading&&settings.autoSkill===true&&(auto===true||window.__STORYWORLD_MOBILE_R63__?.isMobile()))autoCast();return result;};
 const drawBase=drawEffect;drawEffect=function(e,...a){if(e.type!=='goldenThreadR72'||!e.goldenR72)return drawBase.call(this,e,...a);const g=e.goldenR72,from=project(g.a.x,g.a.y),to=project(g.b.x,g.b.y),paint=()=>{ctx.save();ctx.globalAlpha*=.66*Math.max(0,1-e.age/e.life);ctx.lineCap='round';ctx.lineWidth=Math.max(1,1.9*zoom);ctx.strokeStyle='#e9bc52';ctx.beginPath();ctx.moveTo(from.x,from.y-3*zoom);ctx.lineTo(to.x,to.y-3*zoom);ctx.stroke();ctx.lineWidth=Math.max(.7,.85*zoom);ctx.strokeStyle='#fff1bd';ctx.beginPath();ctx.moveTo(from.x,from.y-3*zoom);ctx.lineTo(to.x,to.y-3*zoom);ctx.stroke();ctx.restore();};if(ctx.scope)return ctx.scope({id:'golden:'+g.actor+':'+g.slot,kind:'effect',x:e.x,y:e.y,alive:false,groundAligned:true},paint);return paint();};
 for(const name of ['enterRegion','restoreSave','newGame']){const base=name==='enterRegion'?enterRegion:name==='restoreSave'?restoreSave:newGame,wrapped=async function(...a){cancelAll(name);return base.apply(this,a);};if(name==='enterRegion')enterRegion=wrapped;else if(name==='restoreSave')restoreSave=wrapped;else newGame=wrapped;}
 const deathBase=showDeath;showDeath=function(...a){cancelAll('death');return deathBase.apply(this,a);};
 function availableData(){const p=local(),s=state(p);return{s,stats:C.stats(s),p};}
 let uiCleanup=()=>{};
 const closeBase=closePanel;closePanel=function(...a){uiCleanup();uiCleanup=()=>{};return closeBase.apply(this,a);};
 const openBase=openPanel;openPanel=function(...a){uiCleanup();uiCleanup=()=>{};return openBase.apply(this,a);};
 function manage(message=''){
  if(!started||loading||storyScene)return;const {p,s,stats}=availableData();
  const upgrades=[['cooldown','쿨타임'],['damage','피해'],['size','크기'],['speed','속도'],['slots','도안 저장칸'],['equip','동시장착']];
  openPanel('<button id="goldClose" class="close">닫기</button><div class="eyebrow">GOLDEN THREAD</div><h2>황금실 필살검무</h2><p>먼저 직접 그려 저장한 뒤 습득·장착하세요. 획 순서대로 순간이동하며 발도합니다.</p><p class="small">포인트 '+p.points+' · 도안 저장 '+s.designs.length+'/'+stats.slots+' · 동시장착 '+s.equipped.length+'/'+stats.equip+'<br>재사용 '+stats.cooldown.toFixed(1)+'초 (공통 강화 후 최소 6초) · 위력 '+stats.damage.toFixed(1)+'배 · 반경 '+stats.size.toFixed(1)+'m · 속도 '+stats.speed.toFixed(2)+'배<br>장착 교체는 재사용을 초기화하지 않습니다. G: 첫 도안 / Shift+G: 두 번째 / 전투 화면 우클릭 조준 후 G</p><p id="goldMessage" role="status">'+escapeHTML(message)+'</p><div class="actions"><button id="goldNew">새 도안 그리기</button><button id="goldLearn" '+(s.learned?'disabled':'')+'>'+(s.learned?'습득 완료':'필살검무 습득 · 1점')+'</button><button id="goldAuto">반자동·자동 사용 '+(s.autoUse?'켜짐':'꺼짐')+'</button><button id="goldTest">장착 도안 발동</button></div><div class="cards">'+s.designs.map(d=>'<article class="card gold-design"><canvas width="180" height="140" data-gold-preview="'+d.id+'" aria-label="'+escapeHTML(d.name)+' 도안"></canvas><strong>'+escapeHTML(d.name)+'</strong><small>'+(s.equipped.includes(d.id)?'장착 '+(s.equipped.indexOf(d.id)+1):'보관')+' · '+d.strokes.length+'획</small><div class="actions">'+[['edit','편집'],['equip',s.equipped.includes(d.id)?'해제':'장착'],['clone','복제'],['delete','삭제']].map(([op,label])=>'<button data-gold-op="'+op+'" data-gold-id="'+d.id+'">'+label+'</button>').join('')+'</div></article>').join('')+'</div><h3>독립 강화</h3><div class="actions">'+upgrades.map(([key,label])=>'<button data-gold-upgrade="'+key+'">'+label+' '+s.ranks[key]+'단계 · '+(key==='equip'?3:1)+'점</button>').join('')+'</div><p class="small">기존 실검무 1단계와 저장 도안이 습득 조건입니다. 수치 강화 최대 10단계, 저장칸 3→12개, 장착 1→2개. 도안 편집·복제·교체는 무료입니다. 자동 발동은 기존 자동 기술 설정도 켜져 있어야 합니다.</p>');
  button('goldClose',()=>closePanel(true));button('goldNew',()=>editor());
  const run=cmd=>{const r=dispatch(cmd);if(r.pending){$('goldMessage').textContent='방장 확인을 기다립니다. 잠시 뒤 이 창을 다시 열어주세요.';}else manage(r.ok?'저장했습니다.':r.message);};
  button('goldLearn',()=>run({op:'learn'}));button('goldAuto',()=>run({op:'auto',enabled:!s.autoUse}));button('goldTest',()=>{closePanel(true);cast(0);});
  document.querySelectorAll('[data-gold-upgrade]').forEach(b=>b.onclick=()=>run({op:'upgrade',key:b.dataset.goldUpgrade}));
  document.querySelectorAll('[data-gold-op]').forEach(b=>b.onclick=()=>{const id=b.dataset.goldId,op=b.dataset.goldOp;if(op==='edit')editor(id);else if(op==='delete'){const d=s.designs.find(d=>d.id===id);openPanel('<h2>도안 삭제</h2><p>'+escapeHTML(d.name)+' · 삭제하면 장착도 해제됩니다.</p><div class="actions"><button id="goldDeleteConfirm">삭제</button><button id="goldDeleteCancel">취소</button></div>');button('goldDeleteConfirm',()=>run({op,id}));button('goldDeleteCancel',()=>manage());}else run({op,id});});
  document.querySelectorAll('[data-gold-preview]').forEach(v=>paint(v,s.designs.find(d=>d.id===v.dataset.goldPreview).strokes));
 }
 function paint(canvas,strokes,progress=Infinity){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);c.fillStyle='#0c1721';c.fillRect(0,0,w,h);c.strokeStyle='#2f424b';c.lineWidth=1;c.beginPath();c.moveTo(w/2,0);c.lineTo(w/2,h);c.moveTo(0,h/2);c.lineTo(w,h/2);c.stroke();c.strokeStyle='#efc65e';c.lineWidth=2.5;c.lineCap='round';const unit=Math.min(w,h)*.42;let n=0;for(const s of strokes){c.beginPath();s.forEach((p,i)=>{if(n++>progress)return;const x=w/2+p.x*unit,y=h/2+p.y*unit;if(!i)c.moveTo(x,y);else c.lineTo(x,y);});c.stroke();}}
 function editor(id=null){
  const d=state(local()).designs.find(v=>v.id===id);let strokes=d?d.strokes.map(s=>s.map(p=>({...p}))):[],redo=[],active=null,pointer=null,frame=null;
  openPanel('<button id="goldEditorClose" class="close">닫기</button><div class="eyebrow">DRAW YOUR FINISHER</div><h2>황금실 도안 제작</h2><label for="goldName">검무 이름</label><input id="goldName" maxlength="24" value="'+escapeHTML(d?.name||'')+'" placeholder="검무 이름"><p class="small">마우스·손가락으로 그리세요. 손을 떼면 새 획입니다. 획 사이 점멸은 피해를 주지 않습니다.</p><canvas id="goldCanvas" width="600" height="600" style="display:block;width:min(100%,55vh);aspect-ratio:1;touch-action:none;margin:12px auto;border:1px solid #bd9854;border-radius:12px" aria-label="검무 도안 그리기" role="img"></canvas><p id="goldEditorStatus" role="status"></p><div class="actions"><button id="goldUndo">실행 취소</button><button id="goldRedo">다시 실행</button><button id="goldClear">모두 지우기</button><button id="goldPreview">획 순서 미리보기</button><button id="goldSave" class="primary">이름과 도안 저장</button><button id="goldBack">관리창</button></div>');
  const cv=$('goldCanvas'),status=$('goldEditorStatus'),draw=()=>{paint(cv,strokes);status.textContent=strokes.length+' / 12획 · '+strokes.reduce((n,s)=>n+s.length,0)+' / 2048 입력점';},point=e=>{const r=cv.getBoundingClientRect(),unit=Math.min(r.width,r.height)*.42;return{x:(e.clientX-r.left-r.width/2)/unit,y:(e.clientY-r.top-r.height/2)/unit};};
  const finish=()=>{if(pointer!==null){try{cv.releasePointerCapture(pointer);}catch{}pointer=null;}if(active?.length<2)strokes.pop();active=null;draw();};
  cv.onpointerdown=e=>{if(pointer!==null||strokes.length>=12||e.button>0)return;e.preventDefault();cv.setPointerCapture(e.pointerId);pointer=e.pointerId;active=[point(e)];strokes.push(active);redo=[];draw();};
  cv.onpointermove=e=>{if(pointer!==e.pointerId)return;e.preventDefault();const coalesced=e.getCoalescedEvents?.();for(const v of coalesced?.length?coalesced:[e]){if(strokes.reduce((n,s)=>n+s.length,0)>=2048)break;const p=point(v),last=active.at(-1);if(Math.hypot(p.x-last.x,p.y-last.y)>.006)active.push(p);}draw();};
  cv.onpointerup=e=>{if(pointer===e.pointerId)finish();};cv.onpointercancel=e=>{if(pointer===e.pointerId)finish();};cv.onlostpointercapture=()=>{if(pointer!==null)finish();};
  button('goldUndo',()=>{finish();if(strokes.length)redo.push(strokes.pop());draw();});button('goldRedo',()=>{finish();if(redo.length)strokes.push(redo.pop());draw();});button('goldClear',()=>{finish();strokes=[];redo=[];draw();});
  button('goldPreview',()=>{finish();let normalized;try{normalized=C.normalize(strokes);}catch(e){status.textContent=e.message;return;}if(frame)cancelAnimationFrame(frame);const start=performance.now(),total=normalized.flat().length;const animate=now=>{paint(cv,normalized,Math.min(total,(now-start)/1800*total));if(now-start<1800)frame=requestAnimationFrame(animate);else frame=null;};frame=requestAnimationFrame(animate);});
  button('goldSave',()=>{finish();const r=dispatch({op:'save',id,name:$('goldName').value,strokes});if(r.ok)manage(r.pending?'방장에게 저장을 요청했습니다.':'도안을 저장했습니다. 이제 습득·장착할 수 있습니다.');else status.textContent=r.message;});
  button('goldBack',()=>manage());button('goldEditorClose',()=>closePanel(true));uiCleanup=()=>{if(frame)cancelAnimationFrame(frame);if(pointer!==null){try{cv.releasePointerCapture(pointer);}catch{}}cv.onpointerdown=cv.onpointermove=cv.onpointerup=cv.onpointercancel=cv.onlostpointercapture=null;};draw();
 }
 const menuBase=showMenu;showMenu=function(...a){const result=menuBase.apply(this,a);if(started&&!storyScene){const actions=$('panel')?.querySelector('.actions');if(actions&&!$('goldOpen')){const b=document.createElement('button');b.id='goldOpen';b.textContent='황금실 필살검무 · 제작·관리';b.onclick=()=>manage();actions.appendChild(b);}}return result;};
 const upgradesBase=showUpgrades;showUpgrades=function(...a){const result=upgradesBase.apply(this,a),actions=$('panel')?.querySelector('.actions');if(actions){const b=document.createElement('button');b.id='goldPassiveOpen';b.textContent='황금실 필살검무';b.onclick=()=>manage();actions.appendChild(b);}return result;};
 let groundAim=null;canvas.addEventListener('pointerdown',e=>{if(e.button===0)groundAim=null;});canvas.addEventListener('contextmenu',e=>{if(started&&!modal&&!loading){e.preventDefault();const r=canvas.getBoundingClientRect();groundAim=unproject(e.clientX-r.left,e.clientY-r.top);}});
 document.addEventListener('keydown',e=>{if(e.code!=='KeyG'||e.repeat||e.target?.matches?.('input,textarea,select,[contenteditable="true"]'))return;e.preventDefault();e.stopImmediatePropagation();if(e.altKey)manage();else cast(e.shiftKey?1:0,groundAim);},true);
 const hud=document.createElement('div');hud.id='goldHudR72';hud.style.cssText='position:fixed;right:max(10px,env(safe-area-inset-right));top:80px;z-index:8;display:none;gap:4px;font-size:11px';hud.innerHTML='<button id="goldHudOpen">황금실 제작</button><button id="goldHudCast">G · 발동</button><button id="goldHudSecond">2번 도안</button>';$('stage').appendChild(hud);button('goldHudOpen',()=>manage());button('goldHudCast',()=>cast(0));button('goldHudSecond',()=>cast(1));
 const hudBase=updateHUD;updateHUD=function(...a){const result=hudBase.apply(this,a);hud.style.display=started&&!loading&&!modal?'flex':'none';if(started&&player){const p=local(),s=state(p),cd=Math.max(0,(p.goldenReadyAtR72||0)-time),b=$('goldHudCast');b.textContent=cd>0?'황금실 '+Math.ceil(cd)+'초':'황금실 발동';$('goldHudSecond').style.display=C.stats(s).equip>1?'':'none';}return result;};
 window.__STORYWORLD_GOLDEN_R72__=Object.freeze({state,stats:p=>C.stats(state(p)),manage,editor,cast,autoCast,isCasting:p=>casts.has(p),cancelAll,applyCommand,dispatch,inspect:()=>({revision:'R72-GOLDEN',active:casts.size,casts:[...casts.values()].map(c=>({id:c.id,cursor:c.cursor,hits:c.hits,budget:c.budget,scale:c.scale})),events:[...events],lastResult,player:local()?C.sanitize(state(local())):null,cooldown:Math.max(0,(local()?.goldenReadyAtR72||0)-time)})});
})();
