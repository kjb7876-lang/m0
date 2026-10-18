/* R71 progression UX and passive-point reliability patch. This fragment is
 * inserted into the campaign closure so it can use the original authority,
 * tier, save and map functions without changing their compatibility surface. */
const R71_POINT_ART='assets/vfx/v31315/spirit-orb.webp';
const r71EnterCampaignBase=enterRegion;
const r71Events=[];
const r71Difficulty={open:false,mapId:null,layer:null,selected:null,confirmed:null,cancelled:false,transitions:0};
let r71ChooseDifficultyR71=()=>false;
const r71Note=(kind,detail={})=>{r71Events.push({kind,at:Number(time)||0,...detail});if(r71Events.length>80)r71Events.shift();};
const r71DifficultyName=tier=>TIERS[validTier(tier)].name;
function r71DifficultySnapshot(){return{open:r71Difficulty.open,mapId:r71Difficulty.mapId,layer:r71Difficulty.layer,selected:r71Difficulty.selected?String(r71Difficulty.selected):null,confirmed:r71Difficulty.confirmed,cancelled:r71Difficulty.cancelled,transitions:r71Difficulty.transitions};}
function r71InstallDifficultyStyle(){
 if(document.getElementById('r71DifficultyStyles'))return;
 const style=document.createElement('style');style.id='r71DifficultyStyles';
 style.textContent='.r71-difficulty-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:10px;margin:14px 0}.r71-difficulty-card{display:grid;align-content:start;gap:6px;min-height:112px;padding:14px!important;text-align:left!important;white-space:normal!important;border:1px solid rgba(222,211,185,.36)!important;background:rgba(17,25,34,.92)!important}.r71-difficulty-card strong{font-size:1.05rem}.r71-difficulty-card small{line-height:1.4}.r71-difficulty-card[aria-checked="true"]{border:2px solid #e7d29e!important;box-shadow:0 0 0 3px rgba(231,210,158,.22),0 0 22px rgba(231,210,158,.15);background:rgba(67,60,45,.92)!important}.r71-difficulty-card:focus-visible,.r71-difficulty-confirm:focus-visible,.r71-difficulty-cancel:focus-visible{outline:3px solid #fff1bf;outline-offset:3px}.r71-difficulty-actions{display:flex;gap:10px;flex-wrap:wrap}.r71-difficulty-actions button{min-height:48px}.r71-difficulty-confirm{font-weight:750}.r71-difficulty-current{min-height:1.5em;font-weight:650;color:#f2dfb6}';
 document.head?.appendChild(style);
}
function r71DifficultyMarkup(id,l,selected){
 const values={easy:['이지','기본 적 체력 20%','받는 피해 40%','첫 클리어 +1점'],normal:['노말','기본 적 체력 25%','받는 피해 100%','첫 클리어 +3점'],hard:['하드','기본 적 체력 40%','받는 피해 120%','첫 클리어 +7점']};
 const cards=Object.entries(values).map(([tier,row])=>'<button id="r71Difficulty'+tier[0].toUpperCase()+tier.slice(1)+'" type="button" class="r71-difficulty-card" role="radio" aria-checked="'+(tier===selected)+'" tabindex="'+(tier===selected?'0':'-1')+'" data-r71-tier="'+tier+'"><strong>'+row[0]+'</strong><small>'+row[1]+' · '+row[2]+'</small><small>'+row[3]+'</small></button>').join('');
 return'<div class="eyebrow">MAP DIFFICULTY / '+escapeHTML(l)+'</div><h2>'+escapeHTML(regionById[id].title)+' · 난이도 선택</h2><p class="small">원하는 난이도를 고른 뒤 확인을 눌러 적용하세요. 적 기본 체력과 받는 피해, 첫 클리어 포인트가 표시된 값으로 적용됩니다. 기존 지역의 난이도 변경은 현재 적 체력 비율을 보존합니다.</p><div id="r71DifficultyOptions" class="r71-difficulty-options" role="radiogroup" aria-label="난이도 선택">'+cards+'</div><p id="r71DifficultyReadout" class="small r71-difficulty-current" aria-live="polite"></p><div class="actions r71-difficulty-actions"><button id="r71DifficultyConfirm" class="primary r71-difficulty-confirm" type="button"></button><button id="r71DifficultyCancel" class="r71-difficulty-cancel" type="button">취소</button></div><p class="small muted">선택은 확인을 누를 때까지 적용되지 않습니다. 첫 클리어 포인트는 난이도에 따라 1 / 3 / 7점이며, 같은 지도 보상은 다시 지급되지 않습니다.</p>';
}
function r71OpenDifficulty(id=zone,from=null,options={}){
 const map=regionById[id],l=options.layer||layer;
 if(!map)return false;
 if(coopMode()==='guest'){toast('다음 지역과 난이도는 방장만 정할 수 있습니다.',2);r71Note('difficulty-guest-block',{mapId:id,layer:l});return false;}
 const selected=validTier(mapMode(id,l));
 Object.assign(r71Difficulty,{open:true,mapId:id,layer:l,selected,confirmed:null,cancelled:false,from,options,context:this||null,transitions:r71Difficulty.transitions});
 r71InstallDifficultyStyle();
 openPanel(r71DifficultyMarkup(id,l,selected));
 const drawSelection=()=>{
  const group=document.getElementById('r71DifficultyOptions');if(!group)return;
  for(const el of group.querySelectorAll('[data-r71-tier]')){const chosen=el.dataset.r71Tier===r71Difficulty.selected;el.setAttribute('aria-checked',String(chosen));el.tabIndex=chosen?0:-1;el.classList.toggle('selected',chosen);}
  const tier=TIERS[validTier(r71Difficulty.selected)],readout=document.getElementById('r71DifficultyReadout'),confirm=document.getElementById('r71DifficultyConfirm');
  if(readout)readout.textContent='선택됨: '+tier.name+' · 첫 클리어 보상 '+tier.reward+'점';
  if(confirm)confirm.textContent=tier.name+' 난이도로 '+(id===zone&&l===layer?'적용':'입장')+' · 첫 클리어 +'+tier.reward+'점';
 };
 for(const el of document.querySelectorAll('#r71DifficultyOptions [data-r71-tier]'))el.onclick=()=>{if(!r71Difficulty.open)return;const tier=validTier(el.dataset.r71Tier);r71Difficulty.selected=tier;drawSelection();r71Note('difficulty-selected',{mapId:id,layer:l,tier});};
 r71ChooseDifficultyR71=tier=>{if(!r71Difficulty.open||coopMode()==='guest'||!TIERS[tier])return false;r71Difficulty.selected=tier;drawSelection();r71Note('difficulty-selected',{mapId:id,layer:l,tier});return true;};
 document.getElementById('r71DifficultyOptions')?.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(event.key))return;event.preventDefault();const tiers=['easy','normal','hard'],step=event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:1,index=tiers.indexOf(r71Difficulty.selected),next=tiers[(index+step+tiers.length)%tiers.length];r71ChooseDifficultyR71(next);document.querySelector('#r71DifficultyOptions [data-r71-tier="'+next+'"]')?.focus();});
 button('r71DifficultyConfirm',()=>r71ConfirmDifficulty());
 button('r71DifficultyCancel',()=>r71CancelDifficulty());
 document.querySelector('#r71DifficultyOptions [data-r71-tier="'+selected+'"]')?.focus();drawSelection();
 r71Note('difficulty-open',{mapId:id,layer:l,selected});return false;
}
function r71CancelDifficulty(){if(!r71Difficulty.open)return false;const mapId=r71Difficulty.mapId;r71Difficulty.open=false;r71Difficulty.cancelled=true;r71Difficulty.confirmed=null;r71Note('difficulty-cancel',{mapId});closePanel(true);return true;}
function r71ConfirmDifficulty(){
 if(!r71Difficulty.open||r71Difficulty.confirmed||coopMode()==='guest')return false;
 const id=r71Difficulty.mapId,l=r71Difficulty.layer,tier=validTier(r71Difficulty.selected),from=r71Difficulty.from,options=r71Difficulty.options||{},context=r71Difficulty.context;
 r71Difficulty.open=false;r71Difficulty.confirmed=tier;r71Difficulty.cancelled=false;r71Difficulty.transitions++;
 setMapMode(id,l,tier);if(world?.[roomKey(id,l)])world[roomKey(id,l)][COOP_KEY]=tier;
 closePanel(true);r71Note('difficulty-confirm',{mapId:id,layer:l,tier,reward:TIERS[tier].reward,transition:r71Difficulty.transitions});
 if(id===zone&&l===layer){if(room)applyRoom(room,tier);saveGame(false);updateHUD();toast(r71DifficultyName(tier)+' 난이도를 적용했습니다. 첫 클리어 보상 +'+TIERS[tier].reward+'점',2.5);return true;}
 const entered=r71EnterCampaignBase.call(context,id,from,{...options,layer:l,difficultyR63:tier,fastTravelR63:true});
 if(entered?.catch)entered.catch(error=>{r71Note('difficulty-transition-error',{mapId:id,error:String(error?.message||error)});toast(error?.message||String(error),4);});
 return entered;
}
picker=function(id,from,options={}){return r71OpenDifficulty.call(this,id,from,options);};
function r71DifficultyState(){return r71DifficultySnapshot();}
const r71ClosePanelBase=closePanel;closePanel=function(...args){if(r71Difficulty.open){r71Difficulty.open=false;r71Difficulty.cancelled=true;r71Difficulty.confirmed=null;r71Note('difficulty-dismiss',{mapId:r71Difficulty.mapId});}return r71ClosePanelBase.apply(this,args);};
document.addEventListener('keydown',event=>{if(r71Difficulty.open&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();r71CancelDifficulty();}},true);

function r71SafeDropPoint(x,y,r=room){
 if(!r||!Number.isFinite(x)||!Number.isFinite(y))return null;
 const bounds=r.exploration?.expanded&&Array.isArray(r.exploration.bounds)?r.exploration.bounds:[1,1,N-1,N-1],radius=.19;
 const inside=(a,b)=>a-radius>=bounds[0]&&b-radius>=bounds[1]&&a+radius<=bounds[2]&&b+radius<=bounds[3];
 const clear=(a,b)=>inside(a,b)&&!blocked(a,b,radius,r);
 if(clear(x,y))return{x,y};
 const originX=Math.max(bounds[0]+radius,Math.min(bounds[2]-radius,x)),originY=Math.max(bounds[1]+radius,Math.min(bounds[3]-radius,y));
 for(let ring=1;ring<=16;ring++){const d=ring*.24;for(let i=0;i<24;i++){const a=i*Math.PI/12,p={x:originX+Math.cos(a)*d,y:originY+Math.sin(a)*d};if(clear(p.x,p.y))return p;}}
 for(const p of [{x:N/2,y:N/2},r.objective,{x:(bounds[0]+bounds[2])/2,y:(bounds[1]+bounds[3])/2}])if(p&&clear(p.x,p.y))return{x:p.x,y:p.y};
 return null;
}
recordPointDrop=function(e,r,randomSource){
 if(!e||!r||!Number.isFinite(e.x)||!Number.isFinite(e.y))return null;
 ensurePointState(r);const killId=pointKillId(r,e);
 if(r.passivePointRollsR64.includes(killId)||r.passivePointClaimsR64.includes(killId)||r.passivePointDropsR64.some(v=>v?.source===killId))return null;
 const isBoss=!!(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.cosmicGuardianR63),map=String(e.difficultyMapR63||roomKey(r.id,r.layer)),parts=map.split(':'),tier=validTier(r[COOP_KEY]||mapMode(parts[1],parts[0])),roll=typeof randomSource==='function'?rollPointDrop(tier,isBoss,randomSource):rollPointForKill(tier,isBoss,killId);
 // Every first kill outcome is durable, including a failed chance roll. The
 // stable kill id also prevents a restored room from rolling the same enemy again.
 r.passivePointRollsR64.push(killId);r.passivePointRevisionR64++;
 if(!roll.success){r71Note('point-drop-missed',{killId,isBoss,tier,chance:roll.chance});return{killId,...roll,isBoss,tier};}
 const spot=r71SafeDropPoint(e.x,e.y,r);if(!spot){r71Note('point-drop-no-safe-cell',{killId,x:e.x,y:e.y});return{killId,...roll,isBoss,tier,success:false,reason:'no-safe-cell'};}
 const id='r64:'+r.passivePointEpochR64+':drop:'+String(++r.passivePointSpawnSeqR64),row={id,source:killId,x:spot.x,y:spot.y,amount:roll.amount,kind:isBoss?'boss':'enemy',createdAt:Number(time)||0};
 r.passivePointDropsR64.push(row);r.passivePointRevisionR64++;r71Note('point-drop-recorded',{id,killId,x:row.x,y:row.y,amount:row.amount,isBoss,tier,chance:roll.chance});return{killId,...roll,isBoss,tier,id,amount:row.amount,x:row.x,y:row.y};
};
cleanPointDrops=function(value,epoch,r=room){
 if(!Array.isArray(value))return[];const prefix='r64:'+epoch+':drop:',seen=new Set(),seenSource=new Set(),out=[];
 for(const v of value.slice(0,1024)){if(!v||!validPointId(v.id)||!v.id.startsWith(prefix)||seen.has(v.id)||!Number.isFinite(v.x)||!Number.isFinite(v.y)||!Number.isSafeInteger(v.amount)||v.amount<1||v.amount>7)continue;const source=validPointId(v.source)?v.source:'';if(source&&seenSource.has(source))continue;const spot=r71SafeDropPoint(v.x,v.y,r);if(!spot)continue;seen.add(v.id);if(source)seenSource.add(source);out.push({id:v.id,source,x:spot.x,y:spot.y,amount:v.amount,kind:v.kind==='boss'?'boss':'enemy',createdAt:Number.isFinite(v.createdAt)?v.createdAt:0});}
 return out;
};
restorePointRoom=function(r,row){
 if(!r||!row||!Number.isSafeInteger(row.epoch)||row.epoch<1)return false;if(inCoop()&&coopMode()!=='host')return false;ensurePointState(r);
 r.passivePointEpochR64=row.epoch;r.passivePointSpawnSeqR64=Number.isSafeInteger(row.spawnSeq)&&row.spawnSeq>=0?row.spawnSeq:0;r.passivePointRevisionR64=Number.isSafeInteger(row.revision)&&row.revision>=0?row.revision+1:1;
 r.passivePointDropsR64=cleanPointDrops(row.drops,row.epoch,r);
 const unique=(items)=>[...new Set((Array.isArray(items)?items:[]).filter(validPointId))].slice(0,4096);
 r.passivePointRollsR64=unique(row.rolls);r.passivePointClaimsR64=unique(row.claims);pointEpochCounterR64=Math.max(pointEpochCounterR64,row.epoch);r.passivePointRenderedRevisionR64=-1;syncPointDrops(r);return true;
};
syncPointDrops=function(r=room){
 if(!r||!Array.isArray(r.props))return 0;ensurePointState(r);
 const desired=new Map(),canonical=[],seenSource=new Set();for(const d of r.passivePointDropsR64){if(!d||!validPointId(d.id)||r.passivePointClaimsR64.includes(d.id)||!Number.isSafeInteger(d.amount)||d.amount<1||d.amount>7||!Number.isFinite(d.x)||!Number.isFinite(d.y)||desired.has(d.id))continue;const source=validPointId(d.source)?d.source:'';if(source&&seenSource.has(source))continue;const p=r71SafeDropPoint(d.x,d.y,r);if(!p)continue;if(d.x!==p.x||d.y!==p.y){d.x=p.x;d.y=p.y;r.passivePointRevisionR64++;}if(source)seenSource.add(source);desired.set(d.id,{drop:d,spot:p});canonical.push(d);}
 if(canonical.length!==r.passivePointDropsR64.length){r.passivePointDropsR64=canonical;r.passivePointRevisionR64++;}
 const existing=new Map();for(const p of r.props)if(p?.passivePointDropR64&&typeof p.pointDropIdR64==='string'&&!existing.has(p.pointDropIdR64))existing.set(p.pointDropIdR64,p);
 let changed=0;const active=new Set();
 for(const [id,{drop:d,spot}]of desired){active.add(id);let p=existing.get(id);if(!p){p={id:'point:'+id,x:spot.x,y:spot.y,path:R71_POINT_ART,height:30,solid:false,visible:true,enabled:true,passivePointDropR64:true,pointDropIdR64:id,amountR64:d.amount};r.props.push(p);changed++;}else{if(p.x!==spot.x||p.y!==spot.y||p.amountR64!==d.amount||p.path!==R71_POINT_ART||p.visible===false||p.enabled===false){p.x=spot.x;p.y=spot.y;p.amountR64=d.amount;p.path=R71_POINT_ART;p.visible=true;p.enabled=true;changed++;}}
 }
 if(existing.size||r.props.some(p=>p?.passivePointDropR64)){const next=[],seen=new Set();for(const p of r.props){if(!p?.passivePointDropR64){next.push(p);continue;}const id=p.pointDropIdR64;if(!active.has(id)||seen.has(id)){changed++;continue;}seen.add(id);next.push(p);}if(next.length!==r.props.length)r.props=next;}
 r.passivePointRenderedRevisionR64=r.passivePointRevisionR64;return changed;
};
const r71DrawBase=draw,r71DrawPropBase=drawProp,r71BeaconSelection=new Map(),r71VisualDiagnostics={captureFrames:0,lastCaptureBeaconCount:0,lastCaptureBeaconCommands:0,lastCaptureSightCulled:0,lastCaptureCandidates:0,nativeBeaconCount:0,nativeSightCulled:0};
let r71LastCommandList=null;
function r71IsCaptureContext(){const C=window.StoryPhase1?.DrawCommands;return typeof C==='function'&&ctx instanceof C;}
function r71SightPointAllowed(d){const sight=window.__STORYWORLD_SIGHT24__;if(!sight?.enabled)return true;try{return sight.pointVisible(d.x,d.y)!==false;}catch{return false;}}
function r71PrepareBeaconSelection(capturing=false){
 r71BeaconSelection.clear();if(!room||!player||!Array.isArray(room.passivePointDropsR64))return 0;
 const candidates=[];for(const d of room.passivePointDropsR64){if(!d||room.passivePointClaimsR64?.includes(d.id)||!Number.isFinite(d.x)||!Number.isFinite(d.y)||!Number.isSafeInteger(d.amount)||d.amount<1||d.amount>7)continue;const q=project(d.x,d.y);if(q.x<-36||q.x>W+36||q.y<-40||q.y>H+40)continue;candidates.push({d,q,dist:Math.hypot(d.x-player.x,d.y-player.y)});}
 candidates.sort((a,b)=>a.dist-b.dist||String(a.d.id).localeCompare(String(b.d.id)));r71VisualDiagnostics.lastCaptureCandidates=candidates.length;
 let selected=0;for(const row of candidates){if(!r71SightPointAllowed(row.d)){if(capturing)r71VisualDiagnostics.lastCaptureSightCulled++;else r71VisualDiagnostics.nativeSightCulled++;continue;}r71BeaconSelection.set(row.d.id,selected++);if(selected>=6)break;}return selected;
}
function r71PrepareCaptureIfNeeded(){if(!r71IsCaptureContext())return false;if(ctx.commands!==r71LastCommandList){r71LastCommandList=ctx.commands;r71VisualDiagnostics.captureFrames++;r71VisualDiagnostics.lastCaptureBeaconCount=0;r71VisualDiagnostics.lastCaptureBeaconCommands=0;r71VisualDiagnostics.lastCaptureSightCulled=0;r71PrepareBeaconSelection(true);}return true;}
function r71DrawPointBeacon(d,capturing){
 if(!r71SightPointAllowed(d)){if(capturing)r71VisualDiagnostics.lastCaptureSightCulled++;else r71VisualDiagnostics.nativeSightCulled++;return false;}
 const q=project(d.x,d.y);if(q.x<-36||q.x>W+36||q.y<-40||q.y>H+40)return false;
 const dropId=d.pointDropIdR64||d.id,amount=Number.isSafeInteger(d.amountR64)?d.amountR64:d.amount,index=r71BeaconSelection.get(dropId)||0,pulse=1+.08*Math.sin(time*3.2+index*.7),icon=Math.max(22,Math.min(30,26*zoom))*pulse,label='+'+amount,fy=q.y-5*zoom,iy=fy-24*zoom-(index%2)*3*zoom,ly=iy-icon*.62-11*zoom;
 const owner={id:'r71:point-drop:'+dropId,kind:'prop',x:d.x,y:d.y,bodyPath:R71_POINT_ART,renderHeight:.12,groundAligned:false,alive:false};
 const recorder=capturing?ctx:null,before=recorder?.commands?.length||0;
 const paint=()=>{ctx.save();try{ctx.globalAlpha=.92;ctx.strokeStyle='rgba(241,218,160,.72)';ctx.lineWidth=Math.max(1,1.4*zoom);ctx.shadowColor='rgba(248,218,151,.85)';ctx.shadowBlur=Math.max(4,8*zoom);ctx.beginPath();ctx.moveTo(q.x,fy);ctx.lineTo(q.x,iy+icon*.12);ctx.stroke();ctx.fillStyle='rgba(236,210,143,.22)';ctx.beginPath();ctx.ellipse(q.x,fy,Math.max(8,11*zoom),Math.max(3,4*zoom),0,0,Math.PI*2);ctx.fill();}finally{ctx.restore();}
  sprite(R71_POINT_ART,q.x,iy,icon,{alpha:.98,filter:'brightness(1.12) saturate(1.08)'});
  ctx.save();try{const font=Math.max(10,Math.min(14,11*zoom)),w=Math.max(28,Math.min(36,26+font*.42)),h=Math.max(15,font+4);ctx.fillStyle='rgba(8,14,22,.92)';ctx.strokeStyle='rgba(244,224,177,.9)';ctx.lineWidth=1;ctx.fillRect(q.x-w/2,ly-h/2,w,h);ctx.beginPath();ctx.rect(q.x-w/2,ly-h/2,w,h);ctx.stroke();ctx.font='700 '+font+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff5d5';ctx.shadowColor='rgba(0,0,0,.9)';ctx.shadowBlur=3;ctx.fillText(label,q.x,ly);}finally{ctx.restore();}
 };
 if(typeof ctx.scope==='function')ctx.scope(owner,paint);else paint();
 const added=recorder?Math.max(0,recorder.commands.length-before):0;if(capturing){if(added){r71VisualDiagnostics.lastCaptureBeaconCount++;r71VisualDiagnostics.lastCaptureBeaconCommands+=added;}}else r71VisualDiagnostics.nativeBeaconCount++;
 return added>0||!capturing;
}
drawProp=function(a,...args){const capturing=r71PrepareCaptureIfNeeded(),isDrop=!!(a?.passivePointDropR64&&typeof a.pointDropIdR64==='string');if(!isDrop)return r71DrawPropBase.apply(this,[a,...args]);const selected=r71BeaconSelection.has(a.pointDropIdR64);let result;try{a.passivePointDropR64=false;result=r71DrawPropBase.apply(this,[a,...args]);}finally{a.passivePointDropR64=true;}if(selected)r71DrawPointBeacon(a,capturing);return result;};
draw=function(...args){r71PrepareBeaconSelection(false);return r71DrawBase.apply(this,args);};
const r71KillBase=killEnemy;killEnemy=function(e,...args){const r=room,wasDead=e?.deadRecorded===true,result=r71KillBase.apply(this,[e,...args]);const mode=coopMode();if(r&&r===room&&!wasDead&&e?.deadRecorded===true&&(mode==='off'||mode==='host')){const rolled=recordPointDrop(e,r);if(rolled){syncPointDrops(r);saveGame(false);}}return result;};
function r71AwardTierBonus(info){
 if(!info||info.mode==='EGO'||coopMode()==='guest')return false;const extra=Math.max(0,reward(info)-1);if(!extra)return false;
 const c=window.__STORYWORLD_COOP_SIM_R62__,actors=c?.mode?.()==='host'?c.players().filter(p=>p?.connectedR62!==false):[player].filter(Boolean);
 for(const p of actors)p.points=Math.min(Number.MAX_SAFE_INTEGER,Math.max(0,Math.floor(Number(p.points)||0))+extra);
 r71Note('tier-clear-bonus',{key:info.key,tier:mapMode(info.regionId,info.layer),total:reward(info),bonus:extra,actors:actors.map(p=>p.coopIdR62||p.id||'solo')});
 if(actors.length)toast('지역 완료 · 패시브 포인트 +'+reward(info)+'점 · 난이도 '+r71DifficultyName(mapMode(info.regionId,info.layer)),3);
 return actors.length>0;
}
const r71Progression=window.__STORYWORLD_PROGRESSION_R62__;
const r71Unsubscribe=typeof r71Progression?.onClear==='function'?r71Progression.onClear(r71AwardTierBonus):null;
function r71AppendDifficultyButton(root,id=zone,l=layer,options={}){
 if(!root||root.querySelector('#r71OpenDifficulty'))return null;let actions=root.querySelector('.actions');if(!actions){actions=document.createElement('div');actions.className='actions r71-difficulty-entry';root.appendChild(actions);}
 const b=document.createElement('button');b.id='r71OpenDifficulty';b.type='button';b.textContent='지도 난이도 선택 · '+r71DifficultyName(mapMode(id,l));b.disabled=coopMode()==='guest';actions.appendChild(b);b.onclick=()=>r71OpenDifficulty(id,null,{...options,layer:l});return b;
}
const r71ShowSettingsBase=showSettings;showSettings=function(...args){const result=r71ShowSettingsBase.apply(this,args);r71AppendDifficultyButton($('panel'),zone,layer,{reselectR71:true});return result;};
const r71ShowRegionInfoBase=showRegionInfo;showRegionInfo=function(id,...args){const result=r71ShowRegionInfoBase.call(this,id,...args),r=regionById[id],root=$('panel');if(r&&root&&id!==zone&&coopMode()!=='guest'&&chapterOpen(r,layer)&&hasBeenVisited(id,layer))r71AppendDifficultyButton(root,id,layer,{fastTravelR63:true});return result;};
function r71Inspect(){const points=room?.passivePointDropsR64||[];return{revision:'R71-DIFFICULTY-DROPS',difficulty:r71DifficultySnapshot(),difficultyTier:mapMode(),difficultyReward:reward({regionId:zone,layer}),dropPolicy:'preserved seeded R64 chance and 1..7 amount; record every first kill outcome; host authority; pickup once by closest living actor',pointDrops:{active:points.length,attempted:room?.passivePointRollsR64?.length||0,claimed:room?.passivePointClaimsR64?.length||0,items:(room?.props||[]).filter(p=>p?.passivePointDropR64).length,renderedRevision:room?.passivePointRenderedRevisionR64??null,epoch:room?.passivePointEpochR64||0,rendering:{path:'owned drawProp commands inside captureVisual',ownerPrefix:'r71:point-drop:',beaconsCaptured:r71VisualDiagnostics.lastCaptureBeaconCount>0&&r71VisualDiagnostics.lastCaptureBeaconCommands>0,lastCaptureBeaconCount:r71VisualDiagnostics.lastCaptureBeaconCount,lastCaptureBeaconCommands:r71VisualDiagnostics.lastCaptureBeaconCommands,lastCaptureSightCulled:r71VisualDiagnostics.lastCaptureSightCulled,lastCaptureCandidates:r71VisualDiagnostics.lastCaptureCandidates,captureFrames:r71VisualDiagnostics.captureFrames,nativeBeaconCount:r71VisualDiagnostics.nativeBeaconCount,nativeSightCulled:r71VisualDiagnostics.nativeSightCulled}},events:r71Events.map(e=>({...e})),hostAuthoritative:coopMode()!=='guest',browser:false,GPU:false};}
window.__STORYWORLD_PROGRESSION_R71__=Object.freeze({revision:'R71-DIFFICULTY-DROPS',openDifficulty:r71OpenDifficulty,difficultyState:r71DifficultyState,selectDifficulty:tier=>r71ChooseDifficultyR71?.(tier)===true,confirmDifficulty:r71ConfirmDifficulty,cancelDifficulty:r71CancelDifficulty,recordPointDrop,syncPointDrops,collectPointDrops,exportPointRoom,restorePointRoom,restorePointState,pointDropChance,rollPointDrop,rollPointForKill,inspect:r71Inspect,unsubscribe:r71Unsubscribe});
