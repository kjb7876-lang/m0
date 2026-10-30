/* R90 presentation controls, target readability and combat HUD.
 * The native selectors, combat clock, actor data and save slots are read only.
 * Canonical source; copied into site by scripts/apply-r90.cjs. */
(()=>{'use strict';
 if(window.__STORYWORLD_VISUAL_R90__)return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r90.presentation';
 const DEFAULTS=Object.freeze({localLights:true,decals:true,target:true,health:true,walls:true,atmosphere:true,ui:true});
 const LABELS={localLights:'국지 광원',decals:'바닥 흔적',target:'공격 대상 강조',health:'절제된 체력 표시',walls:'벽 윗면 테두리·모서리',atmosphere:'지역 대기 효과',ui:'금속·갈색 UI 틀'};
 let prefs={...DEFAULTS},lastError=null,lastTarget=null;
 const stats={hudPaints:0,targetPaints:0,healthSamples:0,enemyBars:0,errors:0};
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(typeof saved?.[k]==='boolean')prefs[k]=saved[k];}catch(_){}
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),clock=()=>typeof time==='number'?time:0;
 const fail=e=>{stats.errors++;lastError=String(e?.stack||e);};
 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 function ui(){document.documentElement?.classList?.toggle('r90-ui',prefs.ui);}
 function set(patch={}){for(const k of Object.keys(DEFAULTS))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}ui();return{...prefs};}
 // Inset strokes add a thick frame without changing any box dimensions,
 // responsive layout, DOM IDs, key labels or existing content.
 const css=document.createElement('style');css.id='visual-r90-style';css.textContent=`
html.r90-ui #panel,html.r90-ui header,html.r90-ui footer,html.r90-ui #quest,html.r90-ui #minipanel,html.r90-ui #bossbar,html.r90-ui #hint{background:linear-gradient(135deg,rgba(39,33,27,.97),rgba(17,17,16,.96));border-color:#857057;border-radius:0;box-shadow:inset 0 0 0 2px #28231e,inset 0 0 0 3px #665847;color:#e8dfce}
html.r90-ui button,html.r90-ui .card,html.r90-ui .storyArt,html.r90-ui .settings label,html.r90-ui select{border-radius:0;border-color:#786a57;background-color:#24201b;box-shadow:inset 0 0 0 1px #3b342b}
html.r90-ui button,html.r90-ui .skill{background-image:linear-gradient(#3e382e,#1a1917)}
html.r90-ui button.primary,html.r90-ui .card.selected{background-image:linear-gradient(#62503a,#30291e);border-color:#bca477}
html.r90-ui #panel p,html.r90-ui .card small,html.r90-ui #quest p{color:#d0c8b9}
html.r90-ui .muted{color:#b8ad9c}html.r90-ui .bar{border-color:#75634e;border-radius:0;background:#171714}
`;document.head?.appendChild(css);ui();
 function settingsSection(){const host=document.getElementById('retroSettingsR89');if(!host||document.getElementById('retroSettingsR90'))return;
  const section=document.createElement('section');section.id='retroSettingsR90';
  section.innerHTML='<h3>화면 보강 (R90)</h3><p class="small muted">표현 설정은 저장 슬롯과 별도로 보관됩니다.</p>'+Object.keys(DEFAULTS).map(k=>'<label><input type="checkbox" id="r90-'+k+'"> '+LABELS[k]+'</label> ').join('');
  host.parentNode.insertBefore(section,host.nextSibling);
  for(const k of Object.keys(DEFAULTS)){const el=section.querySelector('#r90-'+k);el.checked=prefs[k];el.onchange=()=>set({[k]:el.checked});}
 }
 if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...args){const result=base.apply(this,args);try{settingsSection();}catch(e){fail(e);}return result;};}

 let healthActor=null,healthRoom=null,healthMax=null,healthHP=null,healthAt=-Infinity,healthClock=-Infinity;
 function observeHealth(){if(typeof player==='undefined'||!player)return{numbers:false};const now=clock(),max=typeof maxHP==='function'?maxHP():0;
  if(player!==healthActor||room!==healthRoom||max!==healthMax||now<healthClock){healthAt=-Infinity;healthHP=player.hp;}
  else if(Number.isFinite(healthHP)&&player.hp<healthHP)healthAt=now;
  healthActor=player;healthRoom=room;healthMax=max;healthHP=player.hp;healthClock=now;stats.healthSamples++;
  return{hp:healthHP,max,damageAt:healthAt,numbers:player.hp>0&&now-healthAt<2};
 }
 // Automatic attacks call this public native selector. Manual ranged/EGO
 // attacks use native nearestEnemy. The manual melee selector is inline and
 // private: show only an unambiguous admitted contact, never a guessed enemy.
 function targetActor(){if(!prefs.target||!solo()||typeof player==='undefined'||!player||typeof room==='undefined'||!room)return null;
  let e=null,source='none';const manual=typeof keys!=='undefined'&&keys.has('attack');
  const automatic=!manual&&((typeof auto!=='undefined'&&auto)||(typeof command!=='undefined'&&command)||(typeof guide!=='undefined'&&guide));
  if(automatic){e=window.__STORYWORLD_HANDO_FINAL_R49__?.autoTarget('a')||null;source='native-autoTarget(a)';
   // EGO narrows the subsequent basic attack to 8.3. A selector admitted
   // outside that range is not a reliable preview; avoid a false highlight.
   if(e&&window.__STORYWORLD_EGO151__?.inspect()?.state?.active&&Math.hypot(e.x-player.x,e.y-player.y)>8.3)e=null;
  }
  else{const hero=typeof HEROES!=='undefined'?HEROES[player.hero]:null,ego=window.__STORYWORLD_EGO151__?.inspect()?.state?.active;
   if(ego&&typeof nearestEnemy==='function'){e=nearestEnemy(8.3);source='native-EGO-nearestEnemy(8.3)';}
   else if(hero&&!(hero.melee||hero.type==='blade'||hero.type==='heavy')&&typeof nearestEnemy==='function'){e=nearestEnemy(hero.range);source='native-ranged-nearestEnemy(range)';}
   else if(typeof effects!=='undefined'){
    // The actor ID is written by the original attack/confirmed-hit path.
    // Read the native age/lifetime without extending or modifying either.
    const contacts=effects.filter(f=>f.age>=0&&f.age<Math.min(.6,f.life)&&f.type==='e568HeroImpact'&&f.heroIdE568===player.hero&&f.sourceActionE568==='attack'&&f.targetIdE568),latest=contacts.at(-1);
    // Cone attacks can confirm several contacts at once. Those are hit actors,
    // not a public primary-target selector: withhold an ambiguous highlight.
    const ids=new Set(latest?contacts.filter(f=>Math.abs(f.age-latest.age)<.001).map(f=>String(f.targetIdE568)):[]),contact=ids.size===1?latest:null;
    const id=contact?.targetIdE568||contact?.r40TargetId;e=id?room.enemies.find(v=>String(v.id)===String(id)):null;source='native-admitted-melee-target';
   }
  }
  if(!e||e.hp<=0||e.deadRecorded||e.visible===false||e.disabled||!Number.isFinite(e.x+e.y)||
   (typeof renderable3==='function'&&!renderable3(e))||window.__STORYWORLD_SIGHT24__?.visibleEnemy(e)===false){lastTarget=null;return null;}
  lastTarget={id:e.id,source};return e;
 }
 function paintTarget(c,e){if(!e||typeof project!=='function')return;const q=project(e.x,e.y),z=typeof zoom==='number'?zoom:1,body=(typeof actorHeight==='function'?actorHeight():66)*(e.combatProfile?.spriteRect?.height||1)*(e.defScale||1),width=clamp(54*z,42,82),ratio=clamp(e.hp/Math.max(1,e.maxHp),0,1),top=q.y-body-(e.visualLiftPx||0)-12;
  if(q.x<0||q.x>W||q.y<0||q.y-body>H)return;
  c.save();try{c.globalAlpha=.8;c.strokeStyle='#9f5146';c.lineWidth=1.25;c.beginPath();c.ellipse(q.x,q.y+1,clamp(19*z,12,32),clamp(7*z,4,12),0,0,Math.PI*2);c.stroke();
   c.globalAlpha=1;c.font='11px "Malgun Gothic",sans-serif';c.textAlign='center';c.fillStyle='#d6c8b8';c.shadowColor='#090808';c.shadowBlur=3;c.fillText(String(e.name||''),q.x,Math.max(12,top-5));c.shadowBlur=0;
   const y=Math.max(15,top);c.fillStyle='rgba(12,10,10,.9)';c.fillRect(q.x-width/2-1,y-1,width+2,4);c.fillStyle='#332826';c.fillRect(q.x-width/2,y,width,2);c.fillStyle='#865b50';c.fillRect(q.x-width/2,y,width*ratio,2);stats.targetPaints++;
  }finally{c.restore();}
 }
 function paintHUD(){const api=window.__STORYWORLD_COMBAT_HUD_R51__,s=document.querySelector('canvas#combat-hud-r51');if(!api||!s||(!prefs.health&&!prefs.target)||!solo())return;
  const m=api.model(),c=s.getContext('2d');if(!m?.visible||!c)return;const observation=observeHealth();
  c.setTransform(typeof dpr==='number'?dpr:1,0,0,typeof dpr==='number'?dpr:1,0,0);c.clearRect(0,0,W,H);
  if(!prefs.health)api.paint(c,m);else{
   // Native R51 paint draws exactly four HP rectangles (+ one shield), then
   // the arrow and R53 status chips. Only that first HP group is intercepted.
   let healthRects=4+(m.health.shieldRatio>0?1:0);const number=Math.ceil(m.health.hp)+' / '+Math.ceil(m.health.max);
   const proxy=new Proxy(c,{get(t,k){if(k==='fillRect')return(...a)=>{if(healthRects>0){healthRects--;return;}return t.fillRect(...a);};if(k==='fillText')return(text,...a)=>{if(text===number)return;return t.fillText(text,...a);};const v=t[k];return typeof v==='function'?v.bind(t):v;},set(t,k,v){t[k]=v;return true;}});
   api.paint(proxy,m);const b=m.health,x=b.x-b.width/2,y=b.y;c.save();try{c.shadowBlur=0;c.globalAlpha=1;c.fillStyle='rgba(9,12,10,.9)';c.fillRect(x-1,y-1,b.width+2,4);c.fillStyle='#26322c';c.fillRect(x,y,b.width,2);c.fillStyle=b.ratio<=.28?'#95624f':'#697e69';c.fillRect(x,y,b.width*b.ratio,2);
    if(b.shieldRatio>0){c.fillStyle='#607982';c.fillRect(x,y+4,b.width*b.shieldRatio,1);}
    if(observation.numbers){c.font='9px "Malgun Gothic",sans-serif';c.textAlign='center';c.fillStyle='#c5c9bc';c.shadowColor='#080c09';c.shadowBlur=2;c.fillText(number,b.x,b.textY??y-5);}
   }finally{c.restore();}
  }
  if(prefs.target)paintTarget(c,targetActor());stats.hudPaints++;
 }
 // Native R51 update runs inside draw; repaint its existing canvas afterwards.
 // No additional animation loop, canvas, game tick, hit handler or target write.
 if(typeof draw==='function'){const base=draw;draw=function(...args){let result;try{result=base.apply(this,args);}finally{try{observeHealth();paintHUD();}catch(e){fail(e);}}return result;};}
 if(typeof drawTargetReticle38==='function'){const base=drawTargetReticle38;drawTargetReticle38=function(...args){if(prefs.target&&targetActor())return;return base.apply(this,args);};}
 if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...args){if(!prefs.health||!solo()||!e||typeof ctx==='undefined')return base.apply(this,[e,...args]);
  const q=project(e.x,e.y),z=typeof zoom==='number'?zoom:1,w=(e.boss?82:44)*z,y=q.y+8*z,h=(e.boss?5:4)*z,body=(typeof actorHeight==='function'?actorHeight():66)*(e.combatProfile?.spriteRect?.height||1)*(e.defScale||1),nativeY=q.y-clamp(Number(e.visualLiftPx)||0,0,body*.65)+6,nativeW=(e.boss?68:35)*z,old=ctx.fillRect,own=Object.prototype.hasOwnProperty.call(ctx,'fillRect');
  // Match only the native enemy HP rectangles at their original coordinates;
  // warnings, sprites, boss labels and all other draw calls stay native.
  ctx.fillRect=function(x0,y0,w0,h0){const near=(a,b)=>Math.abs(a-b)<.01;let yy=y0,hh=h0,style=this.fillStyle;
   const border=near(x0,q.x-w/2-1.5*z)&&near(y0,y-z)&&near(w0,w+3*z)&&near(h0,h+2*z);
   const bar=near(x0,q.x-w/2)&&near(y0,y)&&w0<=w+.01&&(near(h0,h)||near(h0,Math.max(.7,.8*z)));
   const nativeBar=near(x0,q.x-nativeW/2)&&near(y0,nativeY)&&w0<=nativeW+.01&&near(h0,4)&&['#08101bdd','#ec6d8b','#d6b098','#b69aa3'].includes(style);
   if(border){yy=y-1;hh=4;this.fillStyle='rgba(10,10,9,.88)';stats.enemyBars++;}
   else if(bar){if(!near(h0,h))return;hh=2;this.fillStyle=style==='#292629'?'#302926':'#795a50';}
   else if(nativeBar){hh=2;this.fillStyle=style==='#08101bdd'?'#302926':'#795a50';stats.enemyBars++;}
   try{return old.call(this,x0,yy,w0,hh);}finally{this.fillStyle=style;}
  };
  try{return base.apply(this,[e,...args]);}finally{if(own)ctx.fillRect=old;else delete ctx.fillRect;}
 };}
 window.__STORYWORLD_VISUAL_R90__=Object.freeze({prefs:()=>({...prefs}),set,storageKey:KEY,target:targetActor,observeHealth,paintHUD,
  inspect:()=>({revision:'R90-presentation',prefs:{...prefs},stats:{...stats},lastError,lastTarget,manualMelee:'unique admitted basic-attack contact only; inline private selector is not duplicated; simultaneous multi-hit contacts are not highlighted',egoAutomatic:'no preview when native admission is outside EGO 8.3 reach',saveSlotsChanged:false,gameplayChanged:false})});
})();

/* R90 floor traces: reuse the supplied blood image without new image data.
 * Placement is a separate deterministic visual plan; it never enters room,
 * collision, hazards, route finding, progression or serialized saves. */
(()=>{'use strict';
 const A=window.StoryPhase1,CS=A?.CommandScene?.prototype,C=A?.ThreeRenderer?.prototype;
 if(!CS||typeof groundImage!=='function'||window.__STORYWORLD_DECALS_R90__)return;
 const PATH='assets/rc46/impacts/player-blood.webp',LIMIT=24;
 // Existing private marks in hospital-maze-visuals.js (not a new route).
 const HOSPITAL_MARKS=[[35,109],[51,109],[22.5,80],[62.5,80],[20,42.5],[20,22],[5,8.5]];
 const stats={plans:0,draws:0,warningFramesSkipped:0,errors:0};
 let currentRoom=null,currentLayout=null,currentZone=null,currentPlan=[],lastError=null;
 const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 const hash=text=>{let h=2166136261;for(const c of String(text))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;};
 function segment(p,a,b){const x=b.x-a.x,y=b.y-a.y,n=x*x+y*y,t=n?Math.max(0,Math.min(1,((p.x-a.x)*x+(p.y-a.y)*y)/n)):0;return Math.hypot(p.x-a.x-x*t,p.y-a.y-y*t);}
 function wallDistance(p,w){
  if(Array.isArray(w.endpoints)&&w.endpoints.length===2){const [a,b]=w.endpoints;return Math.max(0,segment(p,{x:a[0],y:a[1]},{x:b[0],y:b[1]})-(w.depth||.24)/2);}
  if(!finite(w)||!Number.isFinite(w.width+w.depth))return Infinity;
  return Math.hypot(Math.max(0,Math.abs(p.x-w.x)-w.width/2),Math.max(0,Math.abs(p.y-w.y)-w.depth/2));
 }
 function protections(r,id,dynamic=true){
  const L=r?.exploration,points=[],doors=L?.hospitalDoorsB3||L?.worldR74?.doors||[];
  const add=(p,radius,kind)=>{if(finite(p))points.push({x:p.x,y:p.y,radius,kind});};
  const props=[...(dynamic?r?.props||[]:[]),...(window.__STORYWORLD_VISUAL_TEST__?.props(r)||[])],seen=new Set();
  for(const p of props){if(!finite(p)||p.terrainWall)continue;const k=p.id||p.x+':'+p.y;if(seen.has(k))continue;seen.add(k);add(p,Math.max(2.3,(p.radius||0)+1.5),'prop');}
  if(dynamic){for(const p of r?.markers||[])add(p,3,'interaction');add(r?.objective,3.6,'objective');add(r?.altar,3.6,'altar');add(r?.r72Entry,5.8,'portal-entry');}
  // R72's public points() may repair invalid room entry fields. Do not call it
  // from a visual layer. Protect its authored sources plus its full search range.
  const source=window.__STORYWORLD_REGION_ROUTES__?.source?.(id);
  for(const p of [...(source?.landmarks||[]),...Object.values(source?.exits||{})])add(p,7.8,'portal-authored');
  add(L?.worldWardR81?.portalNext,7.8,'portal-authored');add(L?.refugeR82?.portalNext,7.8,'portal-authored');
  add(L?.entry,5.8,'entry');
  for(const p of L?.starts||[])add(p,5.8,'entry');
  if(id==='ep1a08')for(const [x,y]of HOSPITAL_MARKS)add({x,y},2.2,'guidance');
  return{points,doors};
 }
 function safe(p,guard,r,dynamic=true){
  if(guard.points.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<q.radius+p.radius))return false;
  for(const d of guard.doors){if(!finite(d))continue;const dx=Math.max(0,Math.abs(p.x-d.x)-(d.width||0)/2),dy=Math.max(0,Math.abs(p.y-d.y)-(d.depth||0)/2);if(Math.hypot(dx,dy)<2.4+p.radius)return false;}
  return dynamic?(typeof blocked!=='function'||!blocked(p.x,p.y,p.radius+.07,r)):!A.explorationBlocked(r.exploration,p.x,p.y,p.radius+.07);
 }
 function build(r,id){
  const L=r?.exploration;if(!L?.floorCells?.length||!L.walls?.length)return[];
  // Only authored geometry participates in selection. Moving props, route and
  // the current arrival entry may hide a mark but never select a different one.
  // R156: 칸마다 모든 벽과 거리를 재던 것을, 벽마다 '2칸 안' 격자 칸에만 넣어 두고 그 칸의 벽만 잰다(R155 와 같은 방법).
  //  쓰는 문턱이 1.65칸이라 2칸 안 최솟값은 그대로이고, 2칸 밖은 똑같이 '멀다'. window.__STORYWORLD_R155_NOGRID__ 이면 옛 방식.
  const NEAR=2,grid=new Map();if(!window.__STORYWORLD_R155_NOGRID__)L.walls.forEach((w,i)=>{let x0,x1,y0,y1;
   if(Array.isArray(w.endpoints)&&w.endpoints.length===2){const[a,b]=w.endpoints,m=NEAR+(w.depth||.24)/2;x0=Math.min(a[0],b[0])-m;x1=Math.max(a[0],b[0])+m;y0=Math.min(a[1],b[1])-m;y1=Math.max(a[1],b[1])+m;}
   else if(finite(w)&&Number.isFinite(w.width+w.depth)){x0=w.x-w.width/2-NEAR;x1=w.x+w.width/2+NEAR;y0=w.y-w.depth/2-NEAR;y1=w.y+w.depth/2+NEAR;}else return;
   if(![x0,x1,y0,y1].every(Number.isFinite)||(x1-x0)*(y1-y0)>40000){let a=grid.get('all');if(!a)grid.set('all',a=[]);a.push(i);return;}
   for(let gx=Math.floor(x0);gx<=Math.floor(x1);gx++)for(let gy=Math.floor(y0);gy<=Math.floor(y1);gy++){const k=gx+','+gy;let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(i);}});
  const nearWall=p=>{if(window.__STORYWORLD_R155_NOGRID__)return Math.min(...L.walls.map(w=>wallDistance(p,w)));
   let m=Infinity;for(const i of [...(grid.get(Math.floor(p.x)+','+Math.floor(p.y))||[]),...(grid.get('all')||[])]){const d=wallDistance(p,L.walls[i]);if(d<m)m=d;}return m;};
  const guard=protections(r,id,false),candidates=L.floorCells.map(([x,y])=>({x:x+.5,y:y+.5,seed:hash('r90-floor:'+id+':'+x+':'+y)})).sort((a,b)=>a.seed-b.seed||a.y-b.y||a.x-b.x),out=[];
  for(const c of candidates){
   const radius=.32+(c.seed%100)/500,p={x:c.x,y:c.y,radius,angle:((c.seed>>>8)%360)*Math.PI/180,alpha:.2+((c.seed>>>16)%5)*.02};
   const wall=nearWall(p);
   if(wall<radius+.08||wall>1.65||!safe(p,guard,r,false)||out.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<2.6))continue;
   out.push(p);if(out.length===LIMIT)break;
  }
  return out;
 }
 function plan(){
  if(currentRoom!==room||currentLayout!==room?.exploration||currentZone!==zone){currentRoom=room;currentLayout=room?.exploration;currentZone=zone;currentPlan=build(room,zone);stats.plans++;}
  return currentPlan;
 }
 function warnings(){return(typeof hazards!=='undefined'&&hazards.length>0)||(room?.enemies||[]).some(e=>e.hp>0&&(e.tell>0||e.phaseStage==='warning'));}
 function routeOverlap(p){
  if(typeof route==='undefined'||!Array.isArray(route)||!route.length)return false;
  let previous=typeof player!=='undefined'?player:null;
  for(const q of route){if(!finite(q))continue;if(Math.hypot(p.x-q.x,p.y-q.y)<p.radius+1.1||finite(previous)&&segment(p,previous,q)<p.radius+1.1)return true;previous=q;}
  return false;
 }
 const groundBase=groundImage;
 groundImage=function(...args){const result=groundBase.apply(this,args);
  try{
   if(window.__STORYWORLD_VISUAL_R90__?.prefs().decals!==true||typeof room==='undefined'||!room||typeof layer==='undefined'||layer!=='STORY'||typeof ctx==='undefined'||typeof project!=='function')return result;
   if((window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off')!=='off')return result;
   // R91 blood level (off / low / normal) also governs these reused blood traces.
   const blood=window.__STORYWORLD_VISUAL_R91__?.prefs?.().blood||'normal';if(blood==='off')return result;const bloodScale=blood==='low'?.5:1;
   const rows=plan();if(!rows.length)return result;
   // Native attack warnings always win, including shapes without public bounds.
   if(warnings()){stats.warningFramesSkipped++;return result;}
   const image=readyImage(PATH)?.image;if(!image){addImage(PATH,'R90 reuse: existing blood floor trace');return result;}
   const sight=window.__STORYWORLD_SIGHT24__,guard=protections(room,zone);
   for(let i=0;i<rows.length;i++){
    const p=rows[i];if(routeOverlap(p)||!safe(p,guard,room)||sight?.enabled&&!sight.pointVisible(p.x,p.y))continue;
    const q=project(p.x,p.y),u=project(p.x+1,p.y),v=project(p.x,p.y+1);
    if(q.x<-80||q.y<-80||q.x>W+80||q.y>H+80)continue;
    const half=p.radius/Math.SQRT2,paint=()=>{ctx.save();try{ctx.globalAlpha*=p.alpha*bloodScale;ctx.globalCompositeOperation='source-over';ctx.filter='saturate(.45) brightness(.68)';ctx.transform(u.x-q.x,u.y-q.y,v.x-q.x,v.y-q.y,q.x,q.y);ctx.rotate(p.angle);ctx.drawImage(image,0,0,image.naturalWidth,image.naturalHeight,-half,-half,half*2,half*2);stats.draws++;}finally{ctx.restore();}};
    if(typeof ctx.scope==='function')ctx.scope({id:'r90:floor:'+zone+':'+i,kind:'ground',x:p.x,y:p.y,groundAligned:true,r90Decal:true,presentationOnly:true,alive:false,sourcePath:PATH},paint);else paint();
   }
  }catch(error){stats.errors++;lastError=String(error);}
  return result;
 };
 const policyBase=CS.applySpatialPolicy;
 CS.applySpatialPolicy=function(row,command,...args){const result=policyBase.call(this,row,command,...args);if(command?.owner?.r90Decal&&row?.mesh){const m=row.mesh.material;row.mesh.layers.set(2);row.mesh.renderOrder=-1200;m.depthTest=true;m.depthWrite=false;m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-2;}return result;};
 function reset(){currentRoom=null;currentLayout=null;currentZone=null;currentPlan=[];}
 if(C?.clearScene){const base=C.clearScene;C.clearScene=function(...args){reset();return base.apply(this,args);};}
 window.__STORYWORLD_DECALS_R90__=Object.freeze({path:PATH,limit:LIMIT,plan:(r=room,id=zone)=>build(r,id).map(p=>({...p})),protections:(r=room,id=zone,dynamic=true)=>protections(r,id,dynamic),allowed:(p,r=room,id=zone)=>safe(p,protections(r,id),r),warnings,reset,
  inspect:()=>({stats:{...stats},count:currentPlan.length,zone:currentZone,lastError,path:PATH,warningPolicy:'all R90 floor traces hidden during native hazards or enemy warning',newImages:false,gameplayChanged:false})});
})();
