/* R123 다크 판타지 호러 톤 (지시서 docs/r123-night.md B항, 2026-10-29 밤)
 * 핵앤슬래시 호러풍: 짙은 그림자, 붉은 횃불빛, 낮게 깔린 안개, 피·녹 색감, 낮은 채도.
 *  ① 색: R114 호러 색보정(cinema-r114) 필터 끝에 녹·피 쪽으로 기우는 색(세피아+색상 회전+채도 낮춤)을 덧붙인다.
 *  ② 화면: 가장자리가 피빛으로 가라앉는 비네트, 영웅이 든 횃불처럼 흔들리는 따뜻한 빛, 바닥 쪽에 천천히 흐르는 안개, 위로 오르는 불티 몇 점.
 *  ③ 세계: 화로·횃불·등불 소품 둘레 바닥에 흔들리는 붉은 불빛(화면 안 8개까지).
 * 글자·HUD 는 화면 층 위에 있어 그대로 읽히고, 영웅 둘레는 횃불빛으로 오히려 밝아진다. 세기: 끔/약/보통(기본)/강, 설정 키 r123.dark.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_DARK_R123__)return;
 const REV='R123-dark-1',LEVELS=['off','low','mid','high'],LEVEL_KO={off:'끔',low:'약',mid:'보통',high:'강'};
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r123.dark';
 const prefs={tone:'mid',torches:true,fog:true,embers:true};
 try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(LEVELS.includes(s?.tone))prefs.tone=s.tone;for(const k of['torches','fog','embers'])if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
 function set(p={}){if(LEVELS.includes(p.tone))prefs.tone=p.tone;for(const k of['torches','fog','embers'])if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}
  key='';try{window.__STORYWORLD_CINEMA_R114__?.applyGrade?.(true);}catch(e){fail(e);}return{...prefs};}
 const stats={frames:0,lights:0,lightFrames:0,cmdsMax:0};let failures=0,lastError=null;const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,300);};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2;
 const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx),reduced=()=>!!(typeof settings!=='undefined'&&settings?.reducedMotion);
 const live=()=>typeof started!=='undefined'&&started&&typeof player!=='undefined'&&!!player&&typeof room!=='undefined'&&!!room;
 const busy=()=>(typeof modal!=='undefined'&&!!modal)||(typeof storyScene!=='undefined'&&!!storyScene);
 const U=()=>(typeof TILE==='number'?TILE:34)*(typeof zoom==='number'?zoom:1);
 // 세기별 값: filter 는 R114 필터 뒤에 붙는다(녹·피 쪽 색), vig 피빛 가장자리, torch 영웅 횃불빛, fog 안개, light 화로 불빛
 const TONE={off:null,
  low:{filter:' sepia(.06) hue-rotate(-5deg) contrast(1.04)',rust:.08,shade:.08,vig:.24,torch:.10,fog:.06,light:.14,embers:6},
  mid:{filter:' sepia(.1) hue-rotate(-8deg) saturate(.9) contrast(1.08)',rust:.12,shade:.14,vig:.36,torch:.14,fog:.09,light:.20,embers:10},
  high:{filter:' sepia(.16) hue-rotate(-10deg) saturate(.82) contrast(1.12)',rust:.18,shade:.2,vig:.46,torch:.18,fog:.12,light:.26,embers:14}};
 const tone=()=>TONE[prefs.tone]||null;
 function filter(){const T=tone();return T?T.filter:'';}

 // ---- ② 화면 층 --------------------------------------------------------------------------------------
 let host=null,cv=null,key='',embers=[],lastT=0;
 function stageEl(){return typeof document!=='undefined'?document.getElementById('stage'):null;}
 function fogURL(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');if(!g)return null;let s=7;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;};
  for(let i=0;i<60;i++){const x=r()*256,y=r()*256,rr=24+r()*60;for(const[dx,dy]of[[0,0],[256,0],[-256,0],[0,256],[0,-256]]){const gr=g.createRadialGradient(x+dx,y+dy,0,x+dx,y+dy,rr);gr.addColorStop(0,'rgba(120,118,128,.16)');gr.addColorStop(1,'rgba(120,118,128,0)');g.fillStyle=gr;g.fillRect(x+dx-rr,y+dy-rr,rr*2,rr*2);}}
  return c.toDataURL('image/png');}
 function ensureHost(){if(host?.isConnected)return host;const s=stageEl();if(!s)return null;host=document.createElement('div');host.id='darkR123';host.setAttribute('aria-hidden','true');
  host.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:2;overflow:hidden';
  host.innerHTML='<div data-d="rust" style="position:absolute;inset:0;mix-blend-mode:soft-light"></div><div data-d="vig" style="position:absolute;inset:0;mix-blend-mode:multiply"></div><div data-d="torch" style="position:absolute;inset:0;mix-blend-mode:soft-light"></div>'
   +'<div data-d="fog" style="position:absolute;left:0;right:0;bottom:0;height:62%;background-repeat:repeat;background-size:768px 768px;mask-image:linear-gradient(to top,#000 0,#000 30%,transparent 100%);-webkit-mask-image:linear-gradient(to top,#000 0,#000 30%,transparent 100%)"></div>'
   +'<canvas data-d="cv" style="position:absolute;inset:0;width:100%;height:100%"></canvas>';
  if(getComputedStyle(s).position==='static')s.style.position='relative';s.appendChild(host);cv=host.querySelector('canvas');
  if(!document.getElementById('darkR123Style')){const st=document.createElement('style');st.id='darkR123Style';st.textContent='@keyframes darkR123Fog{from{background-position:0 0}to{background-position:768px 96px}}';document.head.appendChild(st);}
  return host;}
 const part=n=>host?.querySelector('[data-d="'+n+'"]');
 const moodShade=()=>{try{const m=window.__STORYWORLD_MOOD_R123__?.inspect?.();return!!(m?.theme&&window.__STORYWORLD_MOOD_R123__.themes[m.theme]?.shade);}catch(_){return false;}};
 function applyLayer(){const T=tone(),ms=moodShade(),k=prefs.tone+'|'+prefs.fog+'|'+lowFx()+'|'+reduced()+'|'+ms;if(k===key)return;key=k;if(!ensureHost())return;host.style.display=T?'block':'none';if(!T)return;
  // 사몽 구역 분위기(R123 mood)가 이미 화면을 어둡게 하면 겹쳐 너무 어두워지지 않게 절반만
  const sh=ms?T.shade*.5:T.shade;part('rust').style.background='rgba(130,40,20,'+(ms?T.rust*.6:T.rust).toFixed(3)+')';
  part('vig').style.background='radial-gradient(ellipse 80% 75% at 50% 48%,rgba(70,58,58,'+sh+') 0,rgba(70,58,58,'+sh+') 40%,rgba(60,8,6,'+T.vig+') 100%)';
  const f=part('fog');if(prefs.fog&&!lowFx()){if(!f.style.backgroundImage){const u=fogURL();if(u)f.style.backgroundImage='url('+u+')';}f.style.opacity=String(T.fog/.09*.3);f.style.animation=reduced()?'none':'darkR123Fog 90s linear infinite';}else{f.style.opacity='0';f.style.animation='none';}}
 function frame(){if(!host||host.style.display==='none')return;const T=tone();if(!T)return;const t=performance.now()/1000,dt=clamp(t-(lastT||t),0,.1);lastT=t;
  // 영웅 횃불빛: 흔들리는 따뜻한 원(가까운 곳을 오히려 밝게)
  const tc=part('torch');if(typeof project==='function'&&!busy()){const q=project(player.x,player.y),fl=reduced()?1:.85+.1*Math.sin(t*9.1)+.05*Math.sin(t*23.7),r=Math.max(140,U()*5.2)*fl,a=(T.torch*fl).toFixed(3);
   tc.style.background='radial-gradient(circle '+Math.round(r)+'px at '+Math.round(q.x)+'px '+Math.round(q.y-U()*.8)+'px,rgba(255,150,70,'+a+') 0,rgba(255,110,40,'+(a*.5).toFixed(3)+') 45%,rgba(0,0,0,0) 100%)';}else tc.style.background='none';
  // 불티
  const g=cv?.getContext?.('2d');if(!g)return;const b=host.getBoundingClientRect(),dp=Math.min(1.5,devicePixelRatio||1);if(cv.width!==Math.round(b.width*dp)||cv.height!==Math.round(b.height*dp)){cv.width=Math.round(b.width*dp);cv.height=Math.round(b.height*dp);}
  g.setTransform(dp,0,0,dp,0,0);g.clearRect(0,0,b.width,b.height);const want=prefs.embers&&!lowFx()&&!busy()?T.embers:0;
  while(embers.length<want)embers.push({x:Math.random()*b.width,y:b.height+Math.random()*b.height*.5,v:20+Math.random()*30,w:Math.random()*TAU,s:.8+Math.random()*1.4});if(embers.length>want)embers.length=want;
  for(const e of embers){e.y-=e.v*dt;e.w+=dt*1.7;e.x+=Math.sin(e.w)*12*dt;if(e.y<-10){e.y=b.height+10;e.x=Math.random()*b.width;}const a=clamp(e.y/b.height,0,1)*.7;g.fillStyle='rgba(255,'+(90+((e.s*60)|0))+',40,'+a.toFixed(3)+')';g.beginPath();g.arc(e.x,e.y,e.s,0,TAU);g.fill();}}
 function loop(){try{stats.frames++;if(live()){applyLayer();frame();}else if(host)host.style.display='none';}catch(e){fail(e);}if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);}

 // ---- ③ 세계 불빛(화로·횃불·등불 소품 둘레) ------------------------------------------------------------------
 const FIRE=/brazier|torch|candle|lantern|sconce|campfire|bonfire|altar|shrine/i,NOT=/door|beast|ailment|vfx/i;
 const isLight=p=>!!p&&p.visible!==false&&(['brazier','torch','candle','lantern'].includes(p.r74Prop||p.r105Prop||p.r115Prop)||(typeof p.path==='string'&&FIRE.test(p.path)&&!NOT.test(p.path)));
 const cache=new WeakMap();
 // 불빛 자리: 화로·횃불·제단 소품 + 뒷벽(화면 위쪽 벽)을 따라 9칸마다 벽 횃불이 바닥에 흘리는 빛(벽 그림의 횃불과 어울리게).
 function lightsOf(r){let c=cache.get(r);if(c&&c.n===(r.props?.length||0))return c.list;const list=(r.props||[]).filter(isLight).map(p=>({x:p.x,y:p.y,id:p.id,r:3}));
  const cells=r.exploration?.floorCells;if(Array.isArray(cells)&&cells.length){const set=new Set(cells.map(q=>q[0]+':'+q[1])),wall=[];
   for(const[a,b]of cells){if(set.has(a+':'+(b-1))&&set.has((a-1)+':'+b))continue;if(!set.has((a+1)+':'+b)||!set.has(a+':'+(b+1)))continue;if(((a*7+b*13)%5)!==0)continue;wall.push({x:a+.6,y:b+.6,id:'wall:'+a+':'+b,r:2.2});}
   for(const w of wall){if(list.length>=60)break;if(list.some(q=>Math.hypot(q.x-w.x,q.y-w.y)<9))continue;list.push(w);}}
  cache.set(r,{n:r.props?.length||0,list});return list;}
 function drawLights(){const T=tone();if(!T||!prefs.torches||typeof ctx==='undefined'||typeof project!=='function')return 0;const list=lightsOf(room),u=U(),t=typeof time==='number'?time:performance.now()/1000,w=typeof W==='number'?W:1280,h=typeof H==='number'?H:800;let n=0;
  for(const p of list){if(n>=8)break;const q=project(p.x,p.y);if(q.x<-200||q.x>w+200||q.y<-150||q.y>h+150)continue;const s=(p.id?String(p.id).length*7.3:0)%TAU,fl=reduced()?1:.8+.12*Math.sin(t*8.3+s)+.08*Math.sin(t*19.1+s*2),rx=(p.r||3)*u*1.414*fl;
   ctx.save();try{const gr=ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,rx);gr.addColorStop(0,'rgba(255,130,50,'+(T.light*fl).toFixed(3)+')');gr.addColorStop(.5,'rgba(200,60,20,'+(T.light*.45*fl).toFixed(3)+')');gr.addColorStop(1,'rgba(120,20,10,0)');
    ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(q.x,q.y,rx,rx*.5,0,0,TAU);ctx.fill();}finally{ctx.restore();}n++;}
  if(n){stats.lightFrames++;stats.lights=Math.max(stats.lights,n);}return n;}
 const scope=(o,fn)=>{if(typeof ctx!=='undefined'&&typeof ctx?.scope==='function')return ctx.scope(o,fn);return fn();};

 // ---- 설정 ----------------------------------------------------------------------------------------------
 function settingsSection(){if(typeof document==='undefined')return;const q=document.getElementById('quickSettingsR114');
  if(q&&!document.getElementById('r123DarkRow')){const row=document.createElement('div');row.id='r123DarkRow';row.className='r114-row';row.setAttribute('role','radiogroup');row.setAttribute('aria-label','다크 판타지 톤');
   row.innerHTML='다크 판타지 톤(붉은 횃불·안개·피빛) '+LEVELS.map(k=>'<button type="button" data-r123-tone="'+k+'" aria-pressed="'+(prefs.tone===k)+'" class="'+(prefs.tone===k?'active':'')+'">'+LEVEL_KO[k]+'</button>').join(' ');
   const anchor=q.querySelector('[aria-label="호러 분위기"]');if(anchor)anchor.after(row);else q.appendChild(row);
   row.querySelectorAll('[data-r123-tone]').forEach(b=>b.onclick=()=>{set({tone:b.dataset.r123Tone});row.querySelectorAll('[data-r123-tone]').forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});});}
  const host=document.getElementById('moodSettingsR123')?.querySelector('.settings');if(host&&!document.getElementById('r123DarkToggles')){const d=document.createElement('div');d.id='r123DarkToggles';
   d.innerHTML=[['torches','화로·횃불 둘레 붉은 불빛'],['fog','바닥에 깔리는 안개'],['embers','떠오르는 불티']].map(([k,l])=>'<label><input type="checkbox" data-r123-dark="'+k+'" '+(prefs[k]?'checked':'')+'> '+l+'</label>').join('');
   host.appendChild(d);d.querySelectorAll('[data-r123-dark]').forEach(el=>el.onchange=()=>set({[el.dataset.r123Dark]:el.checked}));}}

 function install(){
  if(typeof drawExits==='function'){const b=drawExits;drawExits=function(...a){const r=b.apply(this,a);try{if(live()){const before=ctx?.commands?.length||0;scope({id:'r123:fire',kind:'effect',x:player.x,y:player.y},()=>drawLights());const used=(ctx?.commands?.length||0)-before;if(used>stats.cmdsMax)stats.cmdsMax=used;}}catch(e){fail(e);}return r;};}
  if(typeof showSettings==='function'){const b=showSettings;showSettings=function(...a){const r=b.apply(this,a);try{settingsSection();}catch(e){fail(e);}return r;};}
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);
  try{window.__STORYWORLD_CINEMA_R114__?.applyGrade?.(true);}catch(e){fail(e);}}
 try{install();}catch(e){fail(e);}
 window.__STORYWORLD_DARK_R123__=Object.freeze({revision:REV,levels:LEVELS,tones:TONE,prefs:()=>({...prefs}),set,filter,isLight,drawLights,
  inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},failures,lastError,filter:filter(),layer:!!host&&host.style.display!=='none'})});
})();
