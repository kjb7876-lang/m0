/* R108 weather and living water. Presentation only: damage, cooldowns, hit shapes,
 * AI, collision, spawns, saves and the story order are read, never written.
 *  - A region -> weather table grounded in the canon (story-source/hapil-canon-r107-merged.txt,
 *    line + quote per row; qa/r108/weather-cpu-check.cjs re-reads the canon and checks every quote).
 *    Where the text is silent the environment family default applies (snow -> snow, swamp -> mist,
 *    coast -> rain and wind, ash/forge -> embers from the R100 motes, garden/stone -> leaves/dust).
 *  - One screen-space canvas: fog bands, rain (3 depth layers, wind gusts), storm lightning, hail
 *    bursts, snow, ash, black sand, suspended drops, ground splashes and water rings from the painted
 *    ripple sheet (assets/r108/weather/ripple.webp). <= 350 points, lowFx halves, reducedMotion drops
 *    flashes, hail and strong sway.
 *  - Living water: R99/R105 water materials get a second drifting layer, a wave warp, crest glints and a
 *    shoreline foam / wet edge (onBeforeCompile chained after the native sight and R89 patches).
 *  - Mood: torch flicker on the carried light and vignette, a cool multiply tint under rain.
 * Canonical source; the lead copies it to runtime-text and registers the script and the ripple sheet. */
(()=>{'use strict';
 if(typeof window==='undefined'||window.__STORYWORLD_WEATHER_R108__)return;
 const TEST=window.__STORYWORLD_WEATHER_R108_TEST__===true;
 const clamp=(v,a,b)=>v<a?a:v>b?b:v,TAU=Math.PI*2,finite=Number.isFinite;
 const lerp=(a,b,t)=>a+(b-a)*t;
 const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
 function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
 function rng(seed){let a=seed>>>0||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}

 // ---- weather vectors -------------------------------------------------------------------
 // Every weather name is a vector of 0..1 strengths; a phase change cross-fades two vectors.
 const KEYS=['rain','snow','ash','sand','drops','paper','fog','wind','flash','wet','tint','still'];
 const WX={
  none:{},clear:{},dust:{},glow:{},
  still:{still:1,fog:.12},
  mist:{fog:.8,wind:.1,wet:.25,tint:.2},
  fog:{fog:1,wind:.05,wet:.3,tint:.3},
  drizzle:{rain:.3,fog:.4,wind:.25,wet:.6,tint:.28},
  rain:{rain:.7,fog:.3,wind:.45,wet:1,tint:.5},
  storm:{rain:1,fog:.38,wind:.95,wet:1,tint:.8,flash:1},
  wet:{rain:.04,fog:.32,wind:.1,wet:.9,tint:.3},
  flurry:{snow:.32,fog:.15,wind:.18},
  snow:{snow:.6,fog:.22,wind:.3},
  blizzard:{snow:1,fog:.55,wind:.9},
  ash:{ash:.5,fog:.12,wind:.25},
  ashfall:{ash:.95,fog:.2,wind:.3},
  embers:{ash:.25,wind:.2},
  sand:{sand:.6,wind:.4,fog:.08},
  suspended:{drops:1,fog:.2,still:.6},
  paper:{paper:.6,wind:.35}
 };
 const vec=name=>WX[name]||WX.clear;
 const blend=(a,b,u)=>{const o={};for(const k of KEYS)o[k]=lerp(a[k]||0,b[k]||0,u);return o;};

 // ---- region -> weather (canon line, short quote) ----------------------------------------------
 // w = cycle of weather names (durations are seeded per key), c = [[canon line, quote]], n = note,
 // in = draw even in a roofed room, amb = R100 ambience family for a DREAM stage, sand = [r,g,b].
 const R=(w,c,o)=>Object.assign({w,c},o);
 const FD='no sky text: family default';
 const ZONES={
  hub:R(['clear'],[],{n:'shelter hub, no canon text'}),
  village:R(['clear'],[],{n:'no canon text'}),
  dist00:R(['still'],[[90,'나뭇잎은 흔들리지 않았다']],{n:'wind blows yet the leaves never move: dead calm, motes frozen'}),
  dist01:R(['none'],[[98,'뼈들이 부딪치는 소리']],{n:'cavern: no sky'}),
  dist02:R(['mist','drizzle','mist'],[[108,'물결이 잦아드는 곳'],[108,'하늘만 비쳤다']],{n:'black swamp: mist and a thin drizzle, the water mirrors the sky when calm',dur:[70,130]}),
  dist03:R(['ash','embers'],[[117,'검은 재와 끊어진']],{n:'black ash and broken sealing chains'}),
  dist04:R(['embers','ash'],[[127,'불타는 성 안에는']],{n:'burning castle, graveyard hill'}),
  dist05:R(['embers'],[[133,'남은 불씨']],{n:'embers left on the pillars'}),
  dist06:R(['ashfall','ash'],[[139,'불덩이가 쏟아졌다']],{n:'fire falls from the sky: heavy ash and sparks'}),
  ep1a08:R(['none'],[],{n:'indoor blood ward'}),
  ep1a09:R(['none'],[],{n:'indoor injection room'}),
  ep1a09b:R(['dust'],[],{n:'past palace courtyard: '+FD}),
  ep1a10:R(['clear'],[[183,'달빛을 반사']],{n:'moonlit ruins: a clear night, no rain'}),
  ep1a11:R(['dust'],[],{n:'false-heaven clinic arena: '+FD}),
  dreamRest:R(['none'],[],{n:'indoor rest room'}),
  ep1b01:R(['none'],[],{n:'indoor chapel'}),
  ep1b02:R(['none'],[],{n:'indoor sloth house'}),
  ep1b03:R(['none'],[],{n:'indoor mirror house'}),
  ep1b04:R(['none'],[],{n:'indoor kitchen'}),
  ep1b05:R(['none'],[],{n:'red-heel stage, spotlights'}),
  ep1b06:R(['none'],[[297,'차가운 바람이 새어 나오며']],{n:'indoor vault; the cold draft is the next zone'}),
  ep1b06b:R(['blizzard','snow','blizzard'],[[301,'눈보라 치는 숲'],[303,'창틈으로 들어온 눈']],{n:'blizzard forest around the winter lodge',dur:[60,110]}),
  ep1b07:R(['embers'],[[313,'호텔에 불이 났다'],[313,'그을음이 묻은']],{n:'the hotel is burning: soot and ash even indoors',in:true}),
  ep1b08:R(['none'],[],{n:'indoor cathedral'}),
  ep1b09:R(['snow','blizzard','snow'],[[338,'검은 태양 아래 설원'],[338,'눈보라를 헤치고']],{n:'bright, bitter snowfield under the black sun'}),
  restEp1b:R(['none'],[],{n:'indoor observation bay'}),
  u201:R(['glow'],[],{n:'neural war loop: '+FD}),
  u202:R(['glow'],[],{n:'neural prison: '+FD}),
  u204:R(['glow'],[],{n:'memory gates: '+FD}),
  u205:R(['none'],[],{n:'indoor chambers'}),
  u206:R(['none'],[],{n:'indoor core'}),
  u203:R(['glow'],[],{n:'memory nexus: '+FD}),
  restU2:R(['glow'],[],{n:'rift outpost: '+FD}),
  last304:R(['drizzle','mist','drizzle'],[[481,'젖은 풀숲에서']],{n:'wet meadow ruins: a fine drizzle',dur:[80,140]}),
  last305:R(['dust'],[],{n:'goblin forest: '+FD}),
  last301:R(['storm','storm','rain','storm'],[[497,'폭풍에 휩싸인 성의 잔해'],[502,'검은 바다가 빠르게 다가왔다']],{n:'storm-wrapped castle over the black sea: rain, lightning, hail bursts',dur:[55,95]}),
  last302:R(['drizzle','rain','drizzle'],[[506,'파도에 떠밀려 해안'],[508,'젖은 한지처럼']],{n:'wet harbour village; coast default rain and wind (text only says wet)',dur:[70,120]}),
  last303:R(['fog','mist','fog'],[[516,'안개 속에서'],[518,'검은 안개가 빠져나와'],[522,'안개가 흩어지자']],{n:'black fog duel, no rain',dur:[60,100]}),
  restLast3:R(['glow'],[],{n:'rift platform: '+FD}),
  kair01:R(['sand'],[[543,'검은 모래를 볼 수 있었다']],{n:'the black sand of dead time'}),
  kair04:R(['sand'],[[563,'검은 모래의 흐름']],{n:'black sand flows through the ruins'}),
  kair05:R(['sand'],[[573,'검은 모래가 덜 흘러들었다']],{n:'less black sand: a thin drift',sand:[132,126,120],weak:.55}),
  kair06:R(['embers'],[],{n:'polluted waterway: '+FD}),
  kair07:R(['embers'],[[587,'용광로의 불빛'],[589,'같은 잿더미로']],{n:'the workshop burns lost time into ash',in:true}),
  kair08:R(['glow'],[],{n:'neuron gate: '+FD}),
  kair09:R(['dust'],[],{n:'oblivion cemetery: '+FD}),
  kair10:R(['sand'],[[611,'검은 모래 기둥']],{n:'columns of black sand around the ritual dial'}),
  kair02:R(['none'],[],{n:'indoor clock hall'}),
  kair03:R(['sand'],[[637,'검은 모래가 전장을 잠식']],{n:'black sand floods the command arena',weak:1.25}),
  restKairo:R(['sand'],[[659,'검은 모래가 금빛으로 변했다']],{n:'the sand turns gold',sand:[222,186,98],gold:true}),
  hando01:R(['dust'],[],{n:'summoned castle: '+FD}),
  hando02:R(['dust'],[],{n:'breached ramparts: '+FD}),
  hando03:R(['glow'],[],{n:'mirror court: '+FD}),
  restHando:R(['glow'],[],{n:'time wormhole: '+FD}),
  murder01:R(['wet','wet','drizzle'],[[719,'비는 그쳤지만 도로는 아직 젖어']],{n:'the rain has stopped, the road is still wet: puddles, drips, no streaks',dur:[70,120]}),
  murder02:R(['none'],[[738,'젖은 콘크리트 냄새']],{n:'indoor burned hotel stair'}),
  murder04:R(['none'],[],{n:'indoor villa stair'}),
  murder03:R(['rain','drizzle','rain'],[[781,'비와 전조등'],[791,'비와 전조등']],{n:'rain and headlights bend into the loop on the rooftop',dur:[70,120]}),
  cult01:R(['glow'],[],{n:'chip altar: '+FD}),
  cult02:R(['glow'],[],{n:'neural choir: '+FD}),
  cult05:R(['glow'],[],{n:'biotech vat: '+FD}),
  cult06:R(['glow'],[],{n:'judgment court: '+FD}),
  cult03:R(['none'],[],{n:'indoor harvest vault'}),
  cult04:R(['glow'],[],{n:'antichrist throne: '+FD})
 };
 // 사몽 / 사몽역행 stages: '<episode key>:<stage>' (episode order of samong-r103.js).
 const EPK=['P','S-01','S-02','S-03','S-04','S-05','S-06','S-07','RA','RB','RC','RD','RE','RF','RG','M'];
 const NONE=(n)=>R(['none'],[],{n:n||'roofed stage'});
 const STAGES={};
 for(const k of EPK)for(const s of['survival','maze','ascent'])STAGES[k+':'+s]=NONE();
 Object.assign(STAGES,{
  'S-01:survival':R(['embers'],[],{n:'root plaza, forge style: R100 embers',amb:'forge',in:true}),
  'S-01:maze':R(['embers'],[],{n:'forge-style corridor: R100 embers',amb:'forge',in:true}),
  'S-02:survival':R(['still'],[[1000,'학교 시계는 자정에서 일 분이 모자랐다']],{n:'the school clock is one minute short of midnight: time holds, motes freeze',amb:'regional'}),
  'S-03:maze':R(['rain','rain','drizzle'],[[1135,'오래 묻어 둔 비가'],[1189,'빗속에서 마주쳤다']],{n:'the rain of twenty-three years ago',dur:[60,100]}),
  'S-03:ascent':R(['none'],[[1213,'빗소리가 잦아들자']],{n:'the rain has stopped (roofed tent)'}),
  'S-05:survival':R(['snow','flurry','snow'],[[1401,'눈이 내리고 있었다'],[1336,'눈 냄새가 들어왔다']],{n:'snow on the Gyeongseong crossroads'}),
  'S-05:maze':R(['snow','flurry','snow'],[[1401,'눈이 내리고 있었다'],[1336,'눈 냄새가 들어왔다']],{n:'snow in the alley'}),
  'S-05:ascent':R(['paper'],[[1463,'신문은 재가 되지 않았다'],[1465,'잘게 찢긴 호외']],{n:'torn extras fly where the snow was',in:true}),
  'S-06:survival':R(['rain','drizzle','rain'],[[1523,'서울의 빗물이 바닷물로'],[1525,'기계가 비를 막아 주는 처마']],{n:'rain over the sea bridge of Neo Tokyo',dur:[60,100]}),
  'S-06:maze':R(['suspended'],[[1593,'비가 멎어 있었다'],[1595,'허공에 걸려 있었다']],{n:'the raindrops hang in the air',in:true}),
  'RA:maze':R(['snow','flurry','snow'],[[1928,'검은 태양 아래에서 얼었다'],[2826,'검은 태양의 설원']],{n:'snowfield under the black sun'}),
  'RA:ascent':R(['flurry','snow'],[[2040,'눈발을 가르며']],{n:'snow flurries between school and hospital'}),
  'RC:survival':R(['rain','wet'],[[2227,'스물세 해 전의 비가'],[2249,'비가 멎은 골목']],{n:'the old rain comes into the arena, then stops',in:true,dur:[40,70]}),
  'RD:survival':R(['mist','drizzle','mist'],[[2317,'늪 위에 다리가 놓여'],[2375,'물 위에 떠 있던 모든 꽃']],{n:'swamp bridge: mist over lily water',amb:'swamp',dur:[70,120]}),
  'RG:survival':R(['ashfall','ash'],[[2663,'하늘에는 일곱 개의 나팔']],{n:'collapsed gallery under the seven trumpets: ash',amb:'ash'}),
  'RG:maze':R(['ash','ashfall'],[[2663,'하늘에는 일곱 개의 나팔']],{n:'the margin battlefield: ash',amb:'ash'}),
  'M:survival':R(['clear'],[[2869,'가지가 사라진 자리에는 별이']],{n:'stars hang where the branches were: a clear night',amb:'regional'})
 });
 // Rows used when a zone has no entry of its own (family defaults of the brief).
 const FAMILY_ROW={snow:R(['snow','flurry'],[],{n:'family default'}),swamp:R(['mist','drizzle'],[],{n:'family default'}),coast:R(['drizzle','rain'],[],{n:'family default'}),
  ash:R(['embers'],[],{n:'family default'}),forge:R(['embers'],[],{n:'family default'}),garden:R(['dust'],[],{n:'family default'}),stone:R(['dust'],[],{n:'family default'})};

 // ---- seeded schedule ------------------------------------------------------------------------
 // The cycle of a key is clear -> ... -> clear in order; phase lengths come from a seeded stream, so the
 // weather at a given clock value is the same every time and needs no stored state.
 const sched=new Map(),TRANS=8;
 function schedFor(key,row){let s=sched.get(key);if(!s){s={r:rng(hash(key)^0x9e3779b9),cum:[],lo:row.dur?.[0]||55,hi:row.dur?.[1]||125};sched.set(key,s);}return s;}
 function phaseAt(key,row,clock){const cyc=row.w||['none'],n=cyc.length;
  if(n<2){const v=vec(cyc[0]);return{a:v,b:v,u:0,i:0,names:[cyc[0],cyc[0]]};}
  const s=schedFor(key,row);let total=s.cum.length?s.cum[s.cum.length-1]:0;
  while(total<=clock&&s.cum.length<4096){total+=s.lo+(s.hi-s.lo)*s.r();s.cum.push(total);}
  let lo=0,hi=s.cum.length-1;while(lo<hi){const m=(lo+hi)>>1;if(s.cum[m]>clock)hi=m;else lo=m+1;}
  const i=lo,start=i?s.cum[i-1]:0,end=s.cum[i],tr=Math.min(TRANS,(end-start)*.4),u=smooth(end-tr,end,clock),a=cyc[i%n],b=cyc[(i+1)%n];
  return{a:vec(a),b:vec(b),u,i,names:[a,b]};}
 // Hail comes in short bursts inside storm phases (period 40..70 s, ~9 s long).
 function hailEnv(key,clock){const P=40+hash(key+'h')%31,off=hash(key+'o')%P,u=((clock+off)%P)/P;return smooth(0,.03,u)*(1-smooth(.12,.15,u));}
 function vectorAt(key,row,clock){const p=phaseAt(key,row,clock),v=blend(p.a,p.b,p.u);if(row.weak)for(const k of['rain','snow','ash','sand','drops','paper'])v[k]=clamp(v[k]*row.weak,0,1);
  v.hail=hailEnv(key,clock)*smooth(.55,.9,v.flash);v.phase=p;return v;}

 // ---- budgets --------------------------------------------------------------------------------------
 const CAP={rain:150,snow:130,ash:56,sand:64,drops:56,paper:26,hail:30,splash:30},TOTAL_CAP=350,LEVEL=[0,.55,1,1.3],FOG_BANDS=6;
 const LEVEL_NAMES=['끔','약하게','기본','강하게'];
 function budget(v,level,lowFx,coarse,q){const sc=(LEVEL[level]||0)*(lowFx?.5:1)*(coarse?.7:1)*(q==null?1:q),n={
   rain:CAP.rain*v.rain*sc,snow:CAP.snow*v.snow*sc,ash:CAP.ash*v.ash*sc,sand:CAP.sand*v.sand*sc,drops:CAP.drops*v.drops*sc,paper:CAP.paper*v.paper*sc,
   hail:CAP.hail*(v.hail||0)*sc,splash:CAP.splash*clamp(Math.max(v.wet*.8,v.rain,(v.hail||0)*.8),0,1)*sc};
  let total=0;for(const k in n){n[k]=Math.round(n[k]);total+=n[k];}
  if(total>TOTAL_CAP){const f=TOTAL_CAP/total;total=0;for(const k in n){n[k]=Math.floor(n[k]*f);total+=n[k];}}
  n.total=total;return n;}
 // reducedMotion: no lightning flash, no hail, a third of the wind; lowFx: half the points.
 function effective(v,o){const e={...v};if(o?.reduced){e.flash=0;e.hail=0;e.wind=(e.wind||0)*.35;}return e;}

 const core={KEYS,WX,ZONES,STAGES,FAMILY_ROW,EPK,CAP,TOTAL_CAP,LEVEL,LEVEL_NAMES,TRANS,FOG_BANDS,hash,rng,vec,blend,phaseAt,vectorAt,hailEnv,budget,effective};
 if(TEST){window.__STORYWORLD_WEATHER_R108_CORE__=core;return;}

 // ===================================================================================================
 // runtime
 // ===================================================================================================
 const A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype;
 if(!A||!C||typeof draw!=='function'||typeof project!=='function'||typeof enterRegion!=='function')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r108.weather';
 const DEFAULTS=Object.freeze({level:2,flash:true});
 let prefs={...DEFAULTS},lastError=null;
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(Number.isInteger(saved?.level)&&saved.level>=0&&saved.level<=3)prefs.level=saved.level;if(typeof saved?.flash==='boolean')prefs.flash=saved.flash;}catch(_){}
 const stats={frames:0,drawn:0,flashes:0,thunders:0,splashes:0,waterPatched:0,shoreBuilds:0,errors:0,maxPoints:0,governed:0,msMax:0};
 const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,400);};
 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 const coarse=()=>!!window.matchMedia?.('(pointer:coarse)').matches;
 const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
 const reduced=()=>!!(typeof settings!=='undefined'&&settings?.reducedMotion);
 const live=()=>typeof started!=='undefined'&&started&&!loading&&!!room&&!!player;
 function set(patch={}){if(Number.isInteger(patch.level))prefs.level=clamp(patch.level,0,3);if(typeof patch.flash==='boolean')prefs.flash=patch.flash;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 const ZERO=()=>{const o={hail:0};for(const k of KEYS)o[k]=0;return o;};
 const LV=[0,.6,1,1.25];

 const S={key:'',row:ZONES.hub,fam:'regional',room:null,V:ZERO(),n:null,clock:0,last:0,lastO:null,force:null,off:0,windDir:1,gust:.5,windPx:0,ph:[0,0,0],fl:0,
  pulses:[],hold:0,nextFlash:0,thunder:[],glow:0,shore:null,shoreRoom:null,renderer:null,gov:{ema:0,q:1},acc:0,fogs:[],noise:null,active:false};
 const rainB=[[],[],[]],snowB=[[],[],[]],ash=[],sand=[],drops=[],paper=[],hail=[],splash=[];
 const rnd=Math.random,fill=(list,n,make)=>{while(list.length<n)list.push(make());};
 const MK_RAIN=[0,1,2].map(b=>()=>({x:-.15+rnd()*1.3,y:rnd(),v:[430+rnd()*140,650+rnd()*200,900+rnd()*300][b],len:[9+rnd()*6,15+rnd()*10,26+rnd()*14][b],land:.3+rnd()*.72}));
 const MK_SNOW=[0,1,2].map(b=>()=>({x:rnd(),y:rnd(),v:[34+rnd()*26,62+rnd()*34,100+rnd()*44][b],r:[1.1+rnd()*.9,1.8+rnd(),2.8+rnd()*1.4][b],ph:rnd()*TAU,z:[.35,.7,1.05][b]}));
 const mkAsh=()=>({x:rnd(),y:rnd(),v:22+rnd()*34,r:1+rnd()*1.7,ph:rnd()*TAU,z:.5+rnd()*.7});
 const mkSand=()=>({x:rnd(),y:rnd(),r:.9+rnd(),ph:rnd()*TAU,z:.5+rnd()*.7});
 const mkDrop=()=>({x:rnd(),y:rnd(),r:1.2+rnd()*1.7,ph:rnd()*TAU,z:.4+rnd()*.8});
 const mkPaper=()=>({x:rnd(),y:rnd(),v:36+rnd()*40,w:5+rnd()*5,h:4+rnd()*4,rot:rnd()*TAU,sp:(rnd()-.5)*4,ph:rnd()*TAU});
 const mkHail=()=>({x:0,y:-50,vx:0,vy:0,land:0,st:2,t:0,hop:0});
 const ripple={img:null,ready:false,failed:false};
 function loadRipple(){if(ripple.img)return;try{const im=new Image();im.decoding='async';im.onload=()=>{ripple.ready=true;};im.onerror=()=>{ripple.failed=true;};im.src='assets/r108/weather/ripple.webp';ripple.img=im;}catch(e){fail(e);}}

 // ---- world helpers --------------------------------------------------------------------------------
 // project() maps world -> screen; this is its inverse on the ground plane.
 const unproject=(sx,sy)=>{const a=(sx-W/2)/(TILE*zoom),b=(sy-H*.52)/(TILE*.5*zoom),p=a+cam.x-cam.y,q=b+cam.x+cam.y;return{x:(p+q)/2,y:(q-p)/2};};
 function shoreAt(wx,wy){const s=S.shore;if(!s)return 99;const i=Math.floor((wx-s.x0)/s.cell),j=Math.floor((wy-s.y0)/s.cell);if(i<0||j<0||i>=s.w||j>=s.h)return 99;return s.d[j*s.w+i];}
 // 'floor' = open walkable ground with no wall right in front of it, 'water' = open water away from the shore.
 function groundKind(wx,wy){const L=room?.exploration;if(!L||typeof A.explorationBlocked!=='function')return null;
  if(S.shore){const d=shoreAt(wx,wy);if(d>=.9)return'water';if(d>0)return null;}
  const b=L.bounds;if(Array.isArray(b)&&(wx<b[0]||wx>b[2]||wy<b[1]||wy>b[3]))return null;
  if(A.explorationBlocked(L,wx,wy,.18)||A.explorationBlocked(L,wx+.9,wy+.9,.12))return null;return'floor';}

 // ---- row resolution --------------------------------------------------------------------------------
 function resolve(){const L=room?.exploration,st=layer==='DREAM'&&room?.samongR103?room.samongR103:null;let key,row;
  if(st){const ep=window.__STORYWORLD_SAMONG_R103__?.episodes?.[st.ep]?.key||EPK[st.ep];key=ep+':'+st.stage;row=STAGES[key];}
  else{key=zone;row=ZONES[zone];}
  const fam=L?.r98Scene?.family||L?.surface?.art?.r81Environment||'regional';
  if(!row)row=FAMILY_ROW[fam]||R(['none'],[],{n:'unlisted'});
  return{key,row,fam,L,stage:!!st};}
 // A DREAM stage is open air only when its blueprint is outdoor (R105 sets the R98 scene); a story zone follows its canonical profile.
 function openAir(info){if(info.row.in)return true;const sc=info.L?.r98Scene;if(info.stage)return sc?.open===true;const mode=sc?.mode||globalThis.StoryWorldProfilesR74?.profiles?.[zone]?.mode;return mode==='outdoor'||mode==='mixed';}

 // ---- shore mask: distance from the water's edge, for foam and ring placement ------------------------------
 function buildShore(r,L){const b=L.bounds,T=r.T,kind=L.samongR105?.outdoor?.water?'r105':L.r99Outdoor?.water?'r99':null;
  if(!kind||!Array.isArray(b)||!T||typeof A.explorationBlocked!=='function')return null;
  const cell=.5,M=10,x0=b[0]-M,y0=b[1]-M,w=Math.ceil((b[2]-b[0]+2*M)/cell),h=Math.ceil((b[3]-b[1]+2*M)/cell),n=w*h,d=new Float32Array(n);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const x=x0+(i+.5)*cell,y=y0+(j+.5)*cell,out=x<b[0]||x>=b[2]||y<b[1]||y>=b[3];
   d[j*w+i]=(out||(kind==='r105'&&A.explorationBlocked(L,x,y,.15)))?1e6:0;}
  const D=1,DG=1.4142;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=j*w+i;let v=d[k];if(!v)continue;if(i)v=Math.min(v,d[k-1]+D);if(j){v=Math.min(v,d[k-w]+D);if(i)v=Math.min(v,d[k-w-1]+DG);if(i<w-1)v=Math.min(v,d[k-w+1]+DG);}d[k]=v;}
  for(let j=h-1;j>=0;j--)for(let i=w-1;i>=0;i--){const k=j*w+i;let v=d[k];if(!v)continue;if(i<w-1)v=Math.min(v,d[k+1]+D);if(j<h-1){v=Math.min(v,d[k+w]+D);if(i<w-1)v=Math.min(v,d[k+w+1]+DG);if(i)v=Math.min(v,d[k+w-1]+DG);}d[k]=v;}
  const bytes=new Uint8Array(n);for(let k=0;k<n;k++){d[k]=Math.min(d[k]*cell,99);bytes[k]=Math.round(clamp(d[k]/4,0,1)*255);}
  const tex=new T.DataTexture(bytes,w,h,T.RedFormat,T.UnsignedByteType);tex.minFilter=tex.magFilter=T.LinearFilter;tex.wrapS=tex.wrapT=T.ClampToEdgeWrapping;tex.generateMipmaps=false;tex.unpackAlignment=1;tex.needsUpdate=true;
  stats.shoreBuilds++;return{kind,x0,y0,w,h,cell,d,tex};}
 let blank=null;const blankShore=T=>{if(!blank){blank=new T.DataTexture(new Uint8Array([255]),1,1,T.RedFormat,T.UnsignedByteType);blank.unpackAlignment=1;blank.needsUpdate=true;}return blank;};
 function ensureShore(r){const L=room?.exploration;if(!L||!live()||S.shoreRoom===L)return;S.shoreRoom=L;
  if(S.shore){try{S.shore.tex.dispose();}catch(_){}S.shore=null;}
  try{S.shore=buildShore(r,L);}catch(e){fail(e);S.shore=null;}
  WU.r108Shore.value=S.shore?S.shore.tex:blankShore(r.T);
  if(S.shore)WU.r108ShoreO.value.set(S.shore.x0,S.shore.y0,S.shore.w*S.shore.cell,S.shore.h*S.shore.cell);else WU.r108ShoreO.value.set(0,0,1,1);}

 // ---- living water ---------------------------------------------------------------------------------------
 const WU={r108Time:{value:0},r108On:{value:0},r108Lite:{value:0},r108Amp:{value:1},r108Glint:{value:1},r108Foam:{value:1},r108Shore:{value:null},r108ShoreO:{value:null}};
 const WHEAD='uniform float r108Time;uniform float r108On;uniform float r108Lite;uniform float r108Amp;uniform float r108Glint;uniform float r108Foam;uniform sampler2D r108Shore;uniform vec4 r108ShoreO;varying vec3 r108WP;\n'+
  'float r108h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+
  'float r108n(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(r108h(i),r108h(i+vec2(1.,0.)),u.x),mix(r108h(i+vec2(0.,1.)),r108h(i+vec2(1.,1.)),u.x),u.y);}\n';
 // Replaces #include <map_fragment>: the same single sample when off or where the shore mask says "not water"
 // (floor and caps drawn over the backing mesh); on open water a warped first layer, a second layer with its own
 // scale and drift (skipped in low-effects mode), crest glints where both layers' highlights meet, shoreline foam
 // and a darker wet edge.
 const WBODY='#ifdef USE_MAP\n vec4 sampledDiffuseColor=texture2D(map,vMapUv);\n if(r108On>.5){vec2 wp=r108WP.xz;vec2 su=(wp-r108ShoreO.xy)/r108ShoreO.zw;float d=texture2D(r108Shore,su).r*4.;\n'+
  '  if(d>.01){float t=r108Time;vec4 s1=sampledDiffuseColor;vec3 col=s1.rgb;float l1=dot(s1.rgb,vec3(.299,.587,.114)),l2=l1;\n'+
  '   if(r108Lite<.5){\n'+
  '    vec2 w1=vec2(sin(wp.y*1.15+t*.85)+sin(wp.x*.7-t*.5),cos(wp.x*1.05-t*.7)+sin(wp.y*.6+t*.45))*.0065*r108Amp;\n'+
  '    s1=texture2D(map,vMapUv+w1);\n'+
  '    vec4 s2=texture2D(map,vMapUv*1.43+vec2(-t*.0125,t*.0085)+vec2(cos(wp.x*.9+t*.4),sin(wp.y*.8-t*.35))*.004*r108Amp);\n'+
  '    l1=dot(s1.rgb,vec3(.299,.587,.114));l2=dot(s2.rgb,vec3(.299,.587,.114));col=mix(s1.rgb,s2.rgb,.4);}\n'+
  '   float crest=smoothstep(.05,.16,min(l1,l2)*1.6+max(l1,l2)*.4);\n'+
  '   float tw=.55+.45*sin(t*3.1+r108n(wp*1.7)*6.28);\n'+
  '   col+=vec3(.5,.66,.78)*crest*tw*.2*r108Glint;\n'+
  '   float edge=1.-smoothstep(0.,1.8,d);\n'+
  '   float lap=.5+.5*sin(d*5.2-t*1.15+r108n(wp*.8)*3.);\n'+
  '   float foam=edge*smoothstep(.45,.95,lap*(.55+.9*r108n(wp*2.1+vec2(t*.1,-t*.08))))*smoothstep(0.,.12,d);\n'+
  '   col*=1.-.3*edge*r108Foam;col=mix(col,vec3(.52,.6,.6),foam*.62*r108Foam);\n'+
  '   sampledDiffuseColor=vec4(col,s1.a);}}\n diffuseColor*=sampledDiffuseColor;\n#endif\n';
 const wPatched=new WeakSet();
 function patchWater(m){if(!m||wPatched.has(m)||!m.isMeshBasicMaterial)return;wPatched.add(m);
  const before=m.onBeforeCompile,key=m.customProgramCacheKey;
  const wrapper=function(shader,...rest){if(typeof before==='function')before.call(this,shader,...rest);
   Object.assign(shader.uniforms,WU);
   if(!shader.vertexShader.includes('r108WP'))shader.vertexShader='varying vec3 r108WP;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nr108WP=(modelMatrix*vec4(transformed,1.)).xyz;');
   if(!shader.fragmentShader.includes('r108Time')&&shader.fragmentShader.includes('#include <map_fragment>'))shader.fragmentShader=WHEAD+shader.fragmentShader.replace('#include <map_fragment>',WBODY);};
  if(typeof before==='function')for(const k of Object.keys(before))wrapper[k]=before[k];
  m.onBeforeCompile=wrapper;m.customProgramCacheKey=function(){return(typeof key==='function'?key.call(this):'')+'|r108-water';};m.needsUpdate=true;stats.waterPatched++;}
 function waterUniforms(){const L=prefs.level,on=L>0&&solo(),low=lowFx();WU.r108On.value=on?1:0;WU.r108Lite.value=low?1:0;WU.r108Amp.value=[0,.6,1,1.4][L]*(reduced()?.4:1);WU.r108Glint.value=[0,.6,1,1.4][L]*(low?.6:1);WU.r108Foam.value=[0,.6,1,1.2][L]*(low?.7:1);
  WU.r108Time.value=(performance.now()/1000)%2400;}

 // ---- renderer hooks: water patch, torch flicker, shore mask ----------------------------------------------------
 function flickerAt(t){return clamp(.5*Math.sin(t*9.1)+.3*Math.sin(t*15.7+1.3)+.2*Math.sin(t*23.3+.4)+.36*Math.exp(-Math.pow(((t*.37)%1-.5)*11,2))*Math.sin(t*41),-1,1);}
 function hookRenderer(r){S.renderer=r;
  // The R99 water sits on the shared backing mesh: patch it right before the mesh draws so there is no unpatched frame.
  const vm=r.voidMeshR81;if(vm&&!vm.userData.r108Hook){vm.userData.r108Hook=true;const prev=vm.onBeforeRender;vm.onBeforeRender=function(...a){try{const m=this.material;if(m&&/^r99-water/.test(m.name))patchWater(m);}catch(e){fail(e);}return prev.apply(this,a);};}
  const w5=r.r105Water;if(w5?.material&&/^r105-water/.test(w5.material.name))patchWater(w5.material);
  // The carried light (R89) sets its uniforms in its own render wrapper; this runs just before the quad draws.
  const q=r.r89Light;if(q&&!q.userData.r108Flicker){q.userData.r108Flicker=true;const prev=q.onBeforeRender;q.onBeforeRender=function(...a){try{if(prefs.level>0&&!reduced()&&this.material?.uniforms){const u=this.material.uniforms,f=S.fl;u.edge.value*=1+.04*f;u.inner.value*=1+.03*f;u.gain.value=Math.min(1,u.gain.value*(1+.012*f));}}catch(e){fail(e);}return prev.apply(this,a);};}
  if(!WU.r108ShoreO.value)WU.r108ShoreO.value=new r.T.Vector4(0,0,1,1);
  if(!WU.r108Shore.value)WU.r108Shore.value=blankShore(r.T);
  waterUniforms();ensureShore(r);}
 const renderBase=C.render;C.render=function(frame){try{hookRenderer(this);}catch(e){fail(e);}return renderBase.call(this,frame);};
 const clearBase=C.clearScene;C.clearScene=function(...a){try{if(S.shore)S.shore.tex.dispose();}catch(_){}S.shore=null;S.shoreRoom=null;return clearBase.apply(this,a);};

 // ---- overlay canvas -----------------------------------------------------------------------------------------------
 let cvs=null,cx=null,tintEl=null;
 function mount(){const s=document.getElementById('stage');if(!s)return false;
  if(!cvs){cvs=document.createElement('canvas');cvs.id='weatherR108';cvs.setAttribute('aria-hidden','true');cx=cvs.getContext('2d');
   tintEl=document.createElement('div');tintEl.id='weatherTintR108';tintEl.setAttribute('aria-hidden','true');
   const st=document.createElement('style');st.id='weatherStyleR108';st.textContent='#weatherR108{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;display:none}#weatherTintR108{position:absolute;inset:0;pointer-events:none;z-index:2;display:none;mix-blend-mode:multiply;background:#7f93b8;opacity:0;transition:opacity .9s linear}';document.head.appendChild(st);}
  if(tintEl.parentNode!==s)s.appendChild(tintEl);if(cvs.parentNode!==s)s.appendChild(cvs);return true;}
 const FOGC={swamp:[150,175,140],coast:[150,170,190],snow:[226,236,246],ash:[150,122,102],memory:[170,150,200],neural:[130,190,210],stone:[160,160,166],garden:[150,165,140],forge:[172,132,102],cave:[150,160,185],clinical:[170,185,185],domestic:[175,160,140],regional:[160,160,166]};
 const blobs=new Map();
 function blob(c){const k=c.join();let b=blobs.get(k);if(b)return b;b=document.createElement('canvas');b.width=256;b.height=96;const x=b.getContext('2d');x.translate(128,48);x.scale(1,.375);
  const g=x.createRadialGradient(0,0,0,0,0,128);g.addColorStop(0,'rgba('+c+',.6)');g.addColorStop(.5,'rgba('+c+',.24)');g.addColorStop(1,'rgba('+c+',0)');x.fillStyle=g;x.fillRect(-128,-128,256,256);blobs.set(k,b);return b;}
 function resetRoom(){for(const a of rainB)a.length=0;for(const a of snowB)a.length=0;ash.length=sand.length=drops.length=paper.length=hail.length=splash.length=0;S.fogs.length=0;S.pulses.length=0;S.thunder.length=0;S.glow=0;S.lastO=null;
  const r=rng(hash(S.key+'f'));for(let i=0;i<FOG_BANDS;i++)S.fogs.push({y:.5+.46*r(),sp:(r()-.5)*26,sc:.8+r()*.9,a:.5+.5*r(),x:r(),ph:r()*TAU});
  S.windDir=hash(S.key+'w')&1?1:-1;S.ph=[r()*TAU,r()*TAU,r()*TAU];S.off=hash(S.key)%900;S.nextFlash=performance.now()/1000+S.off+2+r()*3;}

 // ---- splashes: painted ripple sheet over open floor and open water ---------------------------------------------------------
 function spawnSplash(sx,sy,big,tries){for(let k=0;k<tries;k++){
   const x=k?sx+(rnd()-.5)*90:sx,y=k?sy+(rnd()-.5)*50:sy,p=unproject(x,y),kind=groundKind(p.x,p.y);
   if(!kind)continue;const water=kind==='water';
   splash.push({wx:p.x,wy:p.y,t:0,life:.55+rnd()*.4,size:(water?48+rnd()*34:26+rnd()*20)*(big?1.25:1),water,tri:water&&rnd()<.18});stats.splashes++;return true;}return false;}

 // ---- lightning & thunder --------------------------------------------------------------------------------------------------------
 // Thunder is synthesised with the game's own audio context (low-passed noise, long tail) and follows the game's
 // sound setting and volume; it is skipped while audio is locked or the tab is hidden.
 function rumble(g){try{if(typeof audioContext==='undefined'||!audioContext||audioContext.state!=='running'||typeof masterGain==='undefined'||!masterGain)return;
   if(!settings.sound||!(settings.volume>0)||!audioUnlocked||document.hidden||modal)return;const ac=audioContext,len=Math.floor(ac.sampleRate*2.6);
   if(!S.noise||S.noise.sampleRate!==ac.sampleRate){const b=ac.createBuffer(1,len,ac.sampleRate),d=b.getChannelData(0);let lp=0;for(let i=0;i<len;i++){lp+=(rnd()*2-1-lp)*.05;d[i]=lp*3.4*Math.pow(1-i/len,.7);}S.noise=b;}
   const src=ac.createBufferSource(),f=ac.createBiquadFilter(),gn=ac.createGain(),t0=ac.currentTime;src.buffer=S.noise;f.type='lowpass';f.frequency.setValueAtTime(240,t0);f.frequency.exponentialRampToValueAtTime(64,t0+2.3);
   gn.gain.setValueAtTime(.0001,t0);gn.gain.linearRampToValueAtTime(clamp(settings.volume,0,1)*.3*g,t0+.14);gn.gain.exponentialRampToValueAtTime(.0004,t0+2.5);src.connect(f);f.connect(gn);gn.connect(masterGain);src.start(t0);src.stop(t0+2.7);stats.thunders++;}catch(e){fail(e);}}
 function strike(now,strength){S.pulses.length=0;S.pulses.push({t:now,a:.55*strength,k:7.5},{t:now+.17,a:strength,k:3.4});S.glow=now+1;S.thunder.push({at:now+.45+rnd()*1.5,g:.5+.5*strength});stats.flashes++;}

 // ---- per-layer draw helpers -----------------------------------------------------------------------------------------------------------
 function drawFog(CW,CH,eff,lv,sc,dt,dx,spd,clock){const bl=blob(FOGC[S.fam]||FOGC.regional),bands=lowFx()?3:FOG_BANDS,fa=eff.fog*LV[lv];
  for(let i=0;i<bands;i++){const f=S.fogs[i];f.x+=(dx*.7+f.sp*sc*dt*spd)/CW;f.x-=Math.floor(f.x);
   const w=CW*(.5+.42*f.sc),h=w*.375,x=f.x*(CW+w)-w,y=f.y*CH-h*.4;cx.globalAlpha=clamp(f.a*fa*.34*(.75+.25*Math.sin(clock*.2+f.ph)),0,.6);cx.drawImage(bl,x,y,w,h);}
  cx.globalAlpha=1;}
 function drawAsh(n,CW,CH,sc,dt,dx,dy,spd,clock,sway){fill(ash,n,mkAsh);cx.fillStyle='rgba(168,158,152,.4)';cx.beginPath();
  for(let i=0;i<n;i++){const p=ash[i];p.x+=((S.windPx*.6*p.z+Math.sin(clock*.5+p.ph)*10*sway*p.z)*dt*spd+dx*p.z)/CW;p.y+=(p.v*sc*dt*spd+dy*p.z)/CH;
   if(p.y>1.03){p.y=-.03;p.x=rnd();}else if(p.y<-.05)p.y+=1.08;p.x-=Math.floor(p.x);const X=p.x*CW,Y=p.y*CH,rr=p.r*sc;cx.moveTo(X+rr,Y);cx.arc(X,Y,rr,0,TAU);}cx.fill();}
 function drawSand(n,CW,CH,eff,sc,dt,dx,dy,spd,clock,sway){fill(sand,n,mkSand);const c=S.row.sand||[150,142,136],gold=!!S.row.gold;cx.globalCompositeOperation=gold?'lighter':'source-over';cx.fillStyle='rgba('+c+','+(gold?.46:.42)+')';cx.beginPath();
  for(let i=0;i<n;i++){const p=sand[i];p.x+=((S.windDir*(26+110*eff.wind*S.gust)*p.z+Math.sin(clock*.7+p.ph)*8*sway)*dt*spd+dx*p.z)/CW;p.y+=(Math.sin(clock*.9+p.ph)*5*sway*dt*spd+dy*p.z)/CH;
   if(p.y>1.02)p.y-=1.04;else if(p.y<-.02)p.y+=1.04;p.x-=Math.floor(p.x);const X=p.x*CW,Y=p.y*CH,rr=p.r*sc;cx.moveTo(X+rr,Y);cx.arc(X,Y,rr,0,TAU);}cx.fill();cx.globalCompositeOperation='source-over';}
 function drawDrops(n,CW,CH,sc,dt,dx,dy,clock,sway){fill(drops,n,mkDrop);cx.fillStyle='rgba(188,206,226,.5)';cx.beginPath();const hi=[];
  for(let i=0;i<n;i++){const p=drops[i];p.x+=dx*p.z/CW;p.y+=(Math.sin(clock*.8+p.ph)*2.2*sway*dt+dy*p.z)/CH;p.x-=Math.floor(p.x);if(p.y>1.02)p.y-=1.04;else if(p.y<-.02)p.y+=1.04;
   const X=p.x*CW,Y=p.y*CH,rr=p.r*sc;cx.moveTo(X+rr*.8,Y);cx.ellipse(X,Y,rr*.8,rr*1.25,0,0,TAU);if(i%3===0)hi.push(X,Y,rr);}cx.fill();
  cx.fillStyle='rgba(245,250,255,.7)';cx.beginPath();for(let i=0;i<hi.length;i+=3){if(.5+.5*Math.sin(clock*2.2+i)<.35)continue;const hx=hi[i]-hi[i+2]*.2,hy=hi[i+1]-hi[i+2]*.5;cx.moveTo(hx+.8*sc,hy);cx.arc(hx,hy,.8*sc,0,TAU);}cx.fill();}
 function drawPaper(n,CW,CH,sc,dt,dx,dy,spd,clock,sway){fill(paper,n,mkPaper);
  for(let i=0;i<n;i++){const p=paper[i];p.y+=(p.v*sc*dt*spd+dy*.8)/CH;p.x+=((S.windPx*.9+Math.sin(clock*.6+p.ph)*20*sway)*dt*spd+dx*.8)/CW;p.rot+=p.sp*dt*sway;if(p.y>1.04){p.y=-.04;p.x=rnd();}p.x-=Math.floor(p.x);
   cx.save();cx.translate(p.x*CW,p.y*CH);cx.rotate(p.rot);cx.fillStyle='rgba(218,212,196,.5)';cx.fillRect(-p.w*sc*.5,-p.h*sc*.5,p.w*sc,p.h*sc);cx.fillStyle='rgba(40,36,34,.35)';cx.fillRect(-p.w*sc*.35,-p.h*sc*.1,p.w*sc*.7,Math.max(.8,sc*.8));cx.restore();}}
 function drawSnow(n,CW,CH,eff,sc,dt,dx,dy,spd,clock,sway){const p0=Math.floor(n*.4),p1=Math.floor(n*.35),per=[p0,p1,n-p0-p1],streak=eff.wind>.55&&eff.snow>.7;
  for(let b=0;b<3;b++){fill(snowB[b],per[b],MK_SNOW[b]);cx.fillStyle='rgba(240,246,255,'+[.5,.66,.82][b]+')';cx.strokeStyle='rgba(240,246,255,'+[.4,.55,.7][b]+')';cx.lineWidth=[1,1.4,1.9][b]*sc;cx.beginPath();
   for(let i=0;i<per[b];i++){const p=snowB[b][i],wv=S.windPx*(.5+p.z*.5)+Math.sin(clock*.8+p.ph)*16*sway*p.z;
    p.x+=(wv*dt*spd+dx*p.z)/CW;p.y+=(p.v*(1+eff.wind*.8)*sc*dt*spd+dy*p.z)/CH;if(p.y>1.03){p.y=-.03;p.x=rnd();}else if(p.y<-.05)p.y+=1.08;p.x-=Math.floor(p.x);
    const X=p.x*CW,Y=p.y*CH,rr=p.r*sc;if(streak){cx.moveTo(X,Y);cx.lineTo(X-wv*.06,Y-p.v*.05*sc);}else{cx.moveTo(X+rr,Y);cx.arc(X,Y,rr,0,TAU);}}
   if(streak)cx.stroke();else cx.fill();}}
 function drawRain(n,CW,CH,eff,sc,dt,dx,spd){const p0=Math.floor(n*.4),p1=Math.floor(n*.35),per=[p0,p1,n-p0-p1],slant=S.windDir*(.1+.5*S.gust*eff.wind)*(reduced()?.5:1),col=eff.flash>.5?'210,222,245':'176,196,222',k=.55+.45*Math.min(1,eff.rain);
  for(let b=0;b<3;b++){fill(rainB[b],per[b],MK_RAIN[b]);cx.strokeStyle='rgba('+col+','+([.2,.3,.44][b]*k).toFixed(3)+')';cx.lineWidth=[.9,1.2,1.7][b]*sc;cx.beginPath();
   for(let i=0;i<per[b];i++){const p=rainB[b][i];p.y+=p.v*sc*dt*spd/CH;p.x+=(p.v*sc*slant*dt*spd+dx*[.3,.6,1][b])/CW;
    if(p.y>=p.land){p.y=-.05-rnd()*.1;p.x=-.15+rnd()*1.3;p.land=.3+rnd()*.72;}if(p.x>1.2)p.x-=1.35;else if(p.x<-.2)p.x+=1.35;
    const sx=p.x*CW,sy=p.y*CH,l=p.len*sc;cx.moveTo(sx,sy);cx.lineTo(sx-slant*l,sy-l);}
   cx.stroke();}}
 function drawSplash(CW,CH,sc,dt){cx.globalCompositeOperation='lighter';const im=ripple.ready?ripple.img:null;let alive=0;
  for(let i=splash.length-1;i>=0;i--){const s=splash[i];s.t+=dt;const u=s.t/s.life;if(u>=1){splash.splice(i,1);continue;}const q=project(s.wx,s.wy);if(q.x<-90||q.x>CW+90||q.y<-90||q.y>CH+90)continue;
   const a=Math.min(1,u*7)*Math.pow(1-u,.7)*(s.water?.85:.66),sz=s.size*sc;cx.globalAlpha=a;alive++;
   if(im){const fr=s.tri?8+Math.min(7,(u*8)|0):Math.min(7,(u*8)|0);cx.drawImage(im,(fr&3)*256,(fr>>2)*256,256,256,q.x-sz*.5,q.y-sz*.56,sz,sz);}
   else{cx.strokeStyle='rgb(200,220,240)';cx.lineWidth=1;cx.beginPath();cx.ellipse(q.x,q.y,sz*.4*u+2,sz*.2*u+1,0,0,TAU);cx.stroke();}}
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over';return alive;}
 function drawHail(n,CW,CH,eff,sc,dt){if(!hail.length)fill(hail,CAP.hail,mkHail);let used=0;for(const h of hail)if(h.st!==2)used++;if(!used&&eff.hail<.03)return 0;
  const sl=S.windDir*(.18+.45*S.gust);cx.strokeStyle='rgba(236,246,255,.85)';cx.lineWidth=1.8*sc;cx.beginPath();const bounce=[];
  for(let i=0;i<hail.length;i++){const h=hail[i];
   if(h.st===2){if(eff.hail>.03&&used<n.hail&&rnd()<dt*16*Math.min(1,eff.hail*2)){h.st=0;h.x=rnd()*(CW+CH*.4)-CH*.2;h.y=-30;h.vy=1500+rnd()*500;h.vx=h.vy*sl;h.land=CH*(.35+.62*rnd());used++;}else continue;}
   if(h.st===0){h.y+=h.vy*sc*dt;h.x+=h.vx*sc*dt;if(h.y>=h.land){h.st=1;h.t=0;h.hop=14+rnd()*16;if(splash.length<n.splash+6)spawnSplash(h.x,h.land,false,1);}else{cx.moveTo(h.x,h.y);cx.lineTo(h.x-h.vx*.008*sc,h.y-h.vy*.008*sc);}}
   if(h.st===1){h.t+=dt;const u=h.t/.32;if(u>=1){h.st=2;continue;}h.x+=h.vx*.12*dt*sc;bounce.push(h.x,h.land-h.hop*4*u*(1-u)*sc);}}
  cx.stroke();cx.fillStyle='rgba(236,246,255,.85)';cx.beginPath();for(let i=0;i<bounce.length;i+=2){cx.moveTo(bounce[i]+1.8*sc,bounce[i+1]);cx.arc(bounce[i],bounce[i+1],1.8*sc,0,TAU);}cx.fill();return used;}
 function drawLightning(CW,CH,ts){while(S.thunder.length&&S.thunder[0].at<=ts)rumble(S.thunder.shift().g);
  if(S.pulses.length&&ts>S.pulses[S.pulses.length-1].t+1.4)S.pulses.length=0;
  if(!prefs.flash||reduced())return;let a=0;for(const p of S.pulses)if(ts>=p.t)a+=p.a*Math.exp(-(ts-p.t)*p.k);if(S.hold>a)a=S.hold;
  if(a>.01){const A2=Math.min(.3,a*.3);cx.globalCompositeOperation='lighter';cx.fillStyle='rgba(190,206,255,'+A2.toFixed(3)+')';cx.fillRect(0,0,CW,CH);
   const gr=cx.createLinearGradient(0,0,0,CH*.7);gr.addColorStop(0,'rgba(170,190,255,'+(A2*.9).toFixed(3)+')');gr.addColorStop(1,'rgba(170,190,255,0)');cx.fillStyle=gr;cx.fillRect(0,0,CW,CH*.7);cx.globalCompositeOperation='source-over';}
  else if(S.glow>ts){const gl=Math.min(.1,(S.glow-ts)*.1);if(gl>.004){const gr=cx.createLinearGradient(0,0,0,CH*.6);gr.addColorStop(0,'rgba(150,170,235,'+gl.toFixed(3)+')');gr.addColorStop(1,'rgba(150,170,235,0)');cx.globalCompositeOperation='lighter';cx.fillStyle=gr;cx.fillRect(0,0,CW,CH*.6);cx.globalCompositeOperation='source-over';}}}

 // ---- frame ---------------------------------------------------------------------------------------------------------------------------------
 function frame(){const t0=performance.now();stats.frames++;const dt=clamp((t0-S.last)/1000,0,.05);S.last=t0;
  const want=prefs.level>0&&live()&&!modal&&solo()&&!document.hidden&&(layer==='STORY'||(layer==='DREAM'&&!!room?.samongR103));
  if(!mount())return;
  if(!want){if(cvs.style.display!=='none'){cvs.style.display='none';tintEl.style.display='none';}S.active=false;S.V=ZERO();return;}
  const info=resolve();
  if(info.key!==S.key||room!==S.room){S.key=info.key;S.room=room;S.row=info.row;S.fam=info.fam;resetRoom();loadRipple();}
  const clock=t0/1000+S.off;S.clock=clock;
  let v;if(S.force)v=S.force;else if(openAir(info))v=vectorAt(S.key,info.row,clock);else v=ZERO();
  const eff=effective(v,{reduced:reduced()});S.V=eff;
  const g=clamp(.55+.28*Math.sin(clock*.31+S.ph[0])+.17*Math.sin(clock*.97+S.ph[1])+.12*Math.sin(clock*2.3+S.ph[2]),0,1);S.gust=g;S.windPx=S.windDir*g*eff.wind*90;
  S.fl=reduced()?0:flickerAt(clock);
  const lv=prefs.level,n=budget(eff,lv,lowFx(),coarse(),S.gov.q);S.n=n;
  const act=eff.rain+eff.snow+eff.ash+eff.sand+eff.drops+eff.paper+eff.fog+eff.wet+eff.flash+eff.still>.02;S.active=act;
  const tl=eff.tint*LV[lv]*.3;tintEl.style.display=tl>.01?'block':'none';tintEl.style.opacity=tl.toFixed(3);
  if(!act){cvs.style.display='none';return;}
  const CW=Math.max(1,Math.round(W)),CH=Math.max(1,Math.round(H));if(cvs.width!==CW)cvs.width=CW;if(cvs.height!==CH)cvs.height=CH;cvs.style.display='block';
  const o=project(0,0);let dx=S.lastO?o.x-S.lastO.x:0,dy=S.lastO?o.y-S.lastO.y:0;S.lastO=o;if(Math.abs(dx)>160||Math.abs(dy)>160){dx=0;dy=0;}
  const sc=clamp(zoom/.8,.7,1.5),sway=reduced()?.35:1,spd=1-eff.still*.92;
  cx.setTransform(1,0,0,1,0,0);cx.clearRect(0,0,CW,CH);cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
  let pts=0;
  if(eff.fog>.02)drawFog(CW,CH,eff,lv,sc,dt,dx,spd,clock);
  if(n.ash>0){drawAsh(n.ash,CW,CH,sc,dt,dx,dy,spd,clock,sway);pts+=n.ash;}
  if(n.sand>0){drawSand(n.sand,CW,CH,eff,sc,dt,dx,dy,spd,clock,sway);pts+=n.sand;}
  if(n.drops>0){drawDrops(n.drops,CW,CH,sc,dt,dx,dy,clock,sway);pts+=n.drops;}
  if(n.paper>0){drawPaper(n.paper,CW,CH,sc,dt,dx,dy,spd,clock,sway);pts+=n.paper;}
  if(n.snow>0){drawSnow(n.snow,CW,CH,eff,sc,dt,dx,dy,spd,clock,sway);pts+=n.snow;}
  if(n.rain>0){drawRain(n.rain,CW,CH,eff,sc,dt,dx,spd);pts+=n.rain;}
  const sRate=(14*eff.wet+(eff.hail>.05?22*eff.hail:0))*LV[lv]*(lowFx()?.6:1);
  if(sRate>0&&n.splash>0){S.acc+=dt*sRate;let guard=4;while(S.acc>=1&&guard-->0){S.acc-=1;if(splash.length<n.splash)spawnSplash(rnd()*CW,CH*(.2+.8*rnd()),eff.flash>.5,4);}if(S.acc>3)S.acc=0;}
  if(splash.length)pts+=drawSplash(CW,CH,sc,dt);
  pts+=drawHail(n,CW,CH,eff,sc,dt);
  // lightning: two quick pulses, a slow sky glow, at most one event per 6.5 s (storm rows only)
  if(eff.flash>.55&&clock>=S.nextFlash&&(S.row.w.includes('storm')||S.force)){strike(clock,.7+.3*rnd());S.nextFlash=clock+6.5+rnd()*10.5;}
  drawLightning(CW,CH,clock);
  stats.drawn++;if(pts>stats.maxPoints)stats.maxPoints=pts;
  // cost governor: if this layer alone keeps costing > 5 ms the point budget shrinks (never below half)
  const ms=performance.now()-t0,gv=S.gov;if(ms>stats.msMax)stats.msMax=ms;gv.ema=gv.ema?gv.ema*.93+ms*.07:ms;
  if(gv.ema>5&&gv.q>.5){gv.q=Math.max(.5,gv.q-.1);gv.ema=3.2;stats.governed++;}else if(gv.ema<1.6&&gv.q<1)gv.q=Math.min(1,gv.q+.04);}
 const drawBase=draw;draw=function(...args){try{return drawBase.apply(this,args);}finally{try{frame();}catch(e){fail(e);}}};

 // ---- hooks for polish-r100 (the R100 motes) ----------------------------------------------------------------------------------------------------
 // scale: how much of the family motes stay (my snow replaces the R100 snow; leaves and spores thin out in rain),
 // still: motes freeze (dead calm / time held), wind: sideways drift in px/s, family: R100 family for a DREAM stage.
 function ambience(fam){if(prefs.level<=0)return null;const V=S.V;let scale=1;if(fam==='snow'&&V.snow>.12)scale=0;else if(V.rain>.12||V.snow>.3)scale=clamp(1-Math.max(V.rain,V.snow)*.85,.1,1);
  return{scale,skip:scale<=.001,still:V.still>.5,wind:S.windPx};}
 function dreamAmbience(){if(prefs.level<=0||layer!=='DREAM'||!room?.samongR103)return null;const info=resolve();return info.row.amb?{family:info.row.amb}:null;}
 function flickerOpacity(){return prefs.level>0&&!reduced()?1+.05*S.fl:1;}

 // ---- settings ------------------------------------------------------------------------------------------------------------------------------------------
 function settingsSection(){const host=document.getElementById('retroSettingsR100')||document.getElementById('retroSettingsR98World')||document.getElementById('retroSettingsR93')||document.getElementById('retroSettingsR89');
  if(!host||document.getElementById('retroSettingsR108Weather'))return;
  const s=document.createElement('section');s.id='retroSettingsR108Weather';
  s.innerHTML='<h3>날씨 효과 (R108)</h3><p class="small muted">비·폭풍·눈·우박·안개와 물결 연출만 바뀌며 전투 판정·이동·저장은 그대로입니다. 설정은 저장 슬롯과 별도로 보관됩니다.</p>'+
   '<label>날씨 효과 <select id="r108WeatherLevel">'+LEVEL_NAMES.map((t,i)=>'<option value="'+i+'">'+t+'</option>').join('')+'</select></label> <label>번개 섬광 <select id="r108WeatherFlash"><option value="1">켬</option><option value="0">끔</option></select></label>';
  host.parentNode.insertBefore(s,host.nextSibling);
  const lv=s.querySelector('#r108WeatherLevel'),fl=s.querySelector('#r108WeatherFlash');lv.value=String(prefs.level);fl.value=prefs.flash?'1':'0';
  lv.onchange=()=>set({level:Number(lv.value)});fl.onchange=()=>set({flash:fl.value==='1'});}
 if(typeof showSettings==='function'){const sb=showSettings;showSettings=function(...args){const result=sb.apply(this,args);try{settingsSection();}catch(e){fail(e);}return result;};}

 window.__STORYWORLD_WEATHER_R108__=Object.freeze({prefs:()=>({...prefs}),set,ambience,dreamAmbience,flickerOpacity,core,unproject,groundKind,
  // QA aid (not used by the game): force a weather name such as 'storm' (opts.hail 0..1 forces the hail burst); force(null) clears it.
  force(name,opts){if(!name){S.force=null;return null;}const v=blend(vec(name),vec(name),0);v.hail=clamp(opts?.hail||0,0,1);if(opts?.flash)S.nextFlash=0;S.force=v;return{...v};},
  strike:()=>strike(S.clock||performance.now()/1000,1),hold:v=>{S.hold=clamp(+v||0,0,1);return S.hold;},
  state:()=>({key:S.key,note:S.row?.n,cycle:S.row?.w,fam:S.fam,V:{...S.V},n:S.n&&{...S.n},active:S.active,wind:S.windPx,gov:{...S.gov},shore:!!S.shore,splashes:splash.length,fl:S.fl}),
  inspect:()=>({revision:'R108-weather',prefs:{...prefs},stats:{...stats},key:S.key,cycle:S.row?.w,shore:S.shore&&{kind:S.shore.kind,w:S.shore.w,h:S.shore.h},ripple:{ready:ripple.ready,failed:ripple.failed},water:{on:WU.r108On.value,amp:WU.r108Amp.value,patched:stats.waterPatched},lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false})});
})();
