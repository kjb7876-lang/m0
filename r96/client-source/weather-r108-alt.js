/* R108 날씨 · 수면 · 분위기 (alt implementation). Presentation only: damage, cooldowns, hit shapes, AI, collision,
 * spawns, saves and the story order are never written here.
 *  - Weather table: every region and every 사몽 stage maps to a weather profile taken from the canon text
 *    (story-source/hapil-canon-r107-merged.txt, line + quoted phrase per entry; qa/r108/weather-alt-cpu-check.cjs
 *    re-reads those lines). Where the text is silent the environment family default applies (R100 motes).
 *  - Screen-space layer (one 2D canvas, <= 350 live particles): rain with depth layers and landing splashes,
 *    storm gusts with lightning (flash + bolt + sky glow, thunder through the game's own audio context),
 *    hail with bouncing pellets, layered snow and blizzard, ash / embers / black sand / paper / gold motes,
 *    frozen motes for the stopped-time places, low ground-fog bands. Weather cycles per place, deterministic
 *    (hash of the place key + our clock), cross-faded, and thinner around the hero.
 *  - Water: the R99 void water and the R105 stage water get a second texture layer drifting another way, a
 *    soft wave warp, glints, rain ripples and (사몽 stages) a foam ring around the shore walls. The extra
 *    shader chains onBeforeCompile (R89 grade and the native sight hook keep working).
 *  - Mood: the carried light breathes like a torch, tints cold in storms and warm near fire; lightning lifts it.
 * lowFx halves the counts and drops ripples/glints; reducedMotion removes lightning flashes and strong sway.
 * Load only one of weather-r108.js / weather-r108-alt.js (same globals and settings id). */
(()=>{'use strict';
 if(window.__STORYWORLD_WEATHER_R108__||window.__STORYWORLD_WEATHER_R108_CORE__)return;
 const PREFIX=window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:',KEY=PREFIX+'r108.weather';
 const DEFAULTS=Object.freeze({level:'normal',flash:true,thunder:true,water:true,mood:true});
 const LEVELS=Object.freeze({off:0,low:.55,normal:1,high:1.3});
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);},TAU=Math.PI*2;
 const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};

 // ---- weather state vectors ------------------------------------------------------------------
 // rain/snow/hail/flash: precipitation (zeroed under a roof). wind -1..1, gust 0..1, fog 0..1, the rest are motes.
 // fall=1 lets embers fall slanted like fire rain. drip = ground ripples only (rain leaking in, eaves).
 const F=['rain','wind','gust','flash','snow','hail','fog','ash','ember','sand','paper','gold','glow','dust','leaf','spore','sus','drip','fall'],NF=F.length,FI={};F.forEach((k,i)=>{FI[k]=i;});
 const vec=o=>{const v=new Float32Array(NF);for(const k in o)v[FI[k]]=o[k];return v;};
 const ST={clear:vec({}),still:vec({dust:.55,fog:.1}),mist:vec({fog:.55,dust:.1}),thinMist:vec({fog:.28}),fog:vec({fog:1}),
  drizzle:vec({rain:.22,fog:.34,wind:.12}),rain:vec({rain:.6,fog:.2,wind:.28}),heavy:vec({rain:.9,fog:.22,wind:.42,gust:.35}),
  storm:vec({rain:1,fog:.2,wind:.78,gust:1,flash:1}),hail:vec({rain:.55,hail:1,fog:.18,wind:.66,gust:.85,flash:.6}),
  seaStorm:vec({rain:.85,fog:.2,wind:.6,gust:.6,flash:.5}),wet:vec({fog:.3,drip:.55}),drip:vec({drip:.6}),
  snow:vec({snow:.5,wind:.12,fog:.12}),flurry:vec({snow:.22,wind:.08}),blizzard:vec({snow:1,wind:.85,gust:.8,fog:.4}),
  ash:vec({ash:.55,wind:.1,dust:.1}),ashLow:vec({ash:.3,fog:.12}),ashHeavy:vec({ash:.9,ember:.3,wind:.2,fog:.2}),
  embers:vec({ember:.7,ash:.2,fog:.12}),embersLow:vec({ember:.38,ash:.12}),emberstorm:vec({ember:1,ash:.45,wind:.7,gust:.7,fog:.15,fall:1}),
  shell:vec({ash:.7,flash:.55,wind:.2,fog:.25}),ashSnow:vec({snow:.45,ash:.4,wind:.3,fog:.12}),
  sand:vec({sand:.6,wind:.45}),sandHeavy:vec({sand:.85,wind:.65,gust:.4}),sandStorm:vec({sand:1,wind:.9,gust:.8,fog:.2}),sandLight:vec({sand:.3,wind:.3}),
  gold:vec({gold:.8,wind:.12}),paper:vec({paper:.8,wind:.1}),susp:vec({sus:.9,flash:.3}),stars:vec({glow:.55,leaf:.12,wind:.06}),draft:vec({fog:.34,dust:.32,wind:.5})};

 // ---- profiles ------------------------------------------------------------------------------------
 // cycle: [[state, seconds]...] looped; every change is cross-faded. air: works under a roof (no precipitation).
 // still: motes hang in the air, locked to the world. warm/cool 0..1: carried-light tint. fog: fog colour.
 // veil: [r,g,b,alpha,field]. flash: lightning look (bolt | shell | window). swirl: curved rain (loop).
 const P0={
  inherit:{cycle:[['clear',60]],inherit:true},
  stillAir:{cycle:[['still',90]],still:true,air:true,fog:[150,160,175]},
  swampMist:{cycle:[['mist',50],['drizzle',45],['mist',40],['thinMist',30]],fog:[150,178,140]},
  ashfall:{cycle:[['ash',70],['ashHeavy',35],['ash',55]],fog:[128,110,100],warm:.25},
  burningNight:{cycle:[['ashHeavy',60],['embers',40],['ashHeavy',50]],fog:[130,96,80],warm:.55},
  embers:{cycle:[['embers',80],['ash',40],['embers',60]],fog:[126,98,84],warm:.4},
  emberstorm:{cycle:[['emberstorm',50],['embers',30],['emberstorm',40]],fog:[140,92,70],warm:.65,veil:[24,8,4,.1,'ember']},
  moonRuin:{cycle:[['thinMist',60],['still',50],['mist',40]],fog:[150,170,200],cool:.3},
  coldDraft:{cycle:[['draft',60],['thinMist',40]],air:true,fog:[170,190,215],cool:.35},
  blizzard:{cycle:[['blizzard',60],['snow',40],['blizzard',50],['flurry',30]],fog:[200,214,230],cool:.55,veil:[214,226,240,.1,'snow']},
  fireAir:{cycle:[['embersLow',70],['ashLow',40]],air:true,fog:[120,92,78],warm:.5},
  blackSunSnow:{cycle:[['blizzard',45],['snow',45],['flurry',25],['blizzard',45]],fog:[170,184,205],cool:.65,veil:[10,12,22,.1,'snow']},
  warAsh:{cycle:[['ash',60],['ashHeavy',30],['shell',20],['ash',45]],fog:[120,112,106],warm:.2,flash:'shell'},
  wetMeadow:{cycle:[['drizzle',70],['mist',40],['drizzle',50],['thinMist',25]],fog:[150,172,150],cool:.15},
  storm:{cycle:[['rain',30],['storm',55],['hail',10],['storm',40],['heavy',25],['rain',25]],fog:[110,126,150],cool:.7,veil:[6,10,22,.1,'rain']},
  seaDrizzle:{cycle:[['drizzle',45],['rain',50],['mist',30],['drizzle',40]],fog:[150,170,188],cool:.3},
  blackFog:{cycle:[['fog',90],['mist',40],['fog',70]],fog:[72,78,90],cool:.2,veil:[6,8,12,.12,'fog']},
  blackSand:{cycle:[['sand',60],['sandHeavy',35],['sand',50]],fog:[90,86,82]},
  blackSandLight:{cycle:[['sandLight',70],['clear',20],['sandLight',60]],fog:[96,92,88]},
  blackSandStorm:{cycle:[['sandHeavy',50],['sandStorm',40],['sandHeavy',50]],fog:[80,76,72],veil:[10,9,8,.1,'sand']},
  canalMist:{cycle:[['mist',50],['sandLight',35],['mist',45],['thinMist',25]],fog:[152,160,122]},
  graveFog:{cycle:[['mist',60],['thinMist',45],['fog',40]],fog:[140,150,170],cool:.25},
  goldMotes:{cycle:[['gold',90]],fog:[190,170,120],colors:{gold:[[255,214,120],[255,236,170]]}},
  wetStreet:{cycle:[['wet',70],['mist',40]],fog:[150,166,186],cool:.2},
  coldAsh:{cycle:[['ashLow',60],['mist',40]],air:true,fog:[130,128,126]},
  rainLoop:{cycle:[['rain',80],['heavy',45],['rain',60]],fog:[120,134,156],cool:.4,swirl:true},
  rainNight:{cycle:[['rain',70],['heavy',35],['rain',55]],fog:[116,130,152],cool:.35},
  snowNight:{cycle:[['snow',70],['flurry',40],['snow',60]],fog:[190,204,222],warm:.12,cool:.25},
  seaRain:{cycle:[['rain',40],['heavy',35],['seaStorm',24],['rain',40]],fog:[130,150,172],cool:.45,flash:'shell'},
  suspended:{cycle:[['susp',90]],air:true,still:true,fog:[150,170,200],flash:'window',colors:{sus:[[200,225,255]]}},
  dripAir:{cycle:[['drip',70],['clear',30]],air:true,fog:[140,156,176]},
  paperAir:{cycle:[['paper',90]],air:true,fog:[190,184,170]},
  ashSnow:{cycle:[['ashSnow',60],['snow',40]],fog:[150,152,160],cool:.4},
  starGarden:{cycle:[['stars',90]],fog:[150,160,190],colors:{glow:[[235,236,255],[255,240,200]]}}
 };
 const PROF={};for(const k in P0){const p={...P0[k],name:k};p.total=p.cycle.reduce((a,c)=>a+c[1],0);PROF[k]=p;}
 const offsetOf=(p,key)=>hash(p.name+'|'+key)%p.total;

 // ---- narrative table: id -> [profile, [[canon line, quoted phrase]...]] ---------------------------
 // Lines refer to story-source/hapil-canon-r107-merged.txt. "silent" entries cite the zone's own text and take the
 // environment family default (inherit = R100 family motes; indoor places get no precipitation).
 const ZONES={
  hub:['inherit',[[216,'병원 상담실을 닮은 쉼터']]],village:['inherit',[[216,'병원 상담실을 닮은 쉼터']]],
  dist00:['stillAir',[[90,'바람이 불어도 나뭇잎은 흔들리지 않았다']]],
  dist01:['inherit',[[98,'천장에 매달린 뼈들이 부딪치는 소리']]],
  dist02:['swampMist',[[106,'검은 늪이 펼쳐져'],[108,'늪 위에는 다시 하늘만 비쳤다']]],
  dist03:['ashfall',[[117,'검은 재와 끊어진 봉인 사슬'],[117,'기둥 사이에서 불길이 솟았고']]],
  dist04:['burningNight',[[125,'시체들이 되살아난 밤'],[127,'불타는 성 안에는 묘지']]],
  dist05:['embers',[[133,'불씨']]],
  dist06:['emberstorm',[[139,'하늘을 뒤덮은 불덩이가 쏟아졌다']]],
  ep1a08:['inherit',[[149,'차가운 형광등 불빛']]],ep1a09:['inherit',[[163,'펜타닐이라고 적힌 약병']]],
  ep1a09b:['inherit',[[169,'악마화 나무가 있는 궁전에 모여 있었다']]],
  ep1a10:['moonRuin',[[183,'달빛을 반사했고']]],
  ep1a11:['inherit',[[197,'병원 창문에 하나씩 불이']]],
  dreamRest:['inherit',[[216,'병원 상담실을 닮은 쉼터']]],
  ep1b01:['inherit',[[226,'지하 예배당']]],ep1b02:['inherit',[[240,'창문은 검은 비닐로 가려져']]],
  ep1b03:['inherit',[[253,'누나의 집에 가보니']]],ep1b04:['inherit',[[267,'호텔 주방에서는']]],
  ep1b05:['inherit',[[279,'붉은 조명 아래 끝없는 무대']]],
  ep1b06:['coldDraft',[[297,'금속 벽 너머에서 차가운 바람이 새어 나오며']]],
  ep1b06b:['blizzard',[[301,'눈보라 치는 숲이 드러났다'],[303,'창틈으로 들어온 눈이']]],
  ep1b07:['fireAir',[[313,'호텔에 불이 났다']]],
  ep1b08:['inherit',[[325,'거꾸로 된 십자가와 피로 그린 육망성']]],
  ep1b09:['blackSunSnow',[[338,'검은 태양 아래 설원이 펼쳐져'],[338,'눈보라를 헤치고']]],
  restEp1b:['inherit',[[356,'지하 예배당']]],
  u201:['warAsh',[[381,'폭격과 탄피, 젖은 흙의 기억']]],u202:['inherit',[[399,'기계 성벽이 더 높아졌다']]],
  u204:['warAsh',[[413,'폭격이 남긴 냄새와 비명']]],u205:['inherit',[[437,'문손잡이가 돌아가기 직전의 고요']]],
  u206:['inherit',[[445,'아이의 자아를 옮겨 담을 기계 육체']]],u203:['inherit',[[460,'기억의 문에 빙의했다']]],
  restU2:['inherit',[[477,'쉼터에서 미카엘라가 꺼내 놓은 물컵']]],
  last304:['wetMeadow',[[481,'젖은 풀숲에서 눈을 떴다'],[483,'주변에는 동유럽을 닮은 들판']]],
  last305:['inherit',[[489,'숲 깊은 곳에서 피리로 늑대를']]],
  last301:['storm',[[497,'폭풍에 휩싸인 성의 잔해와 검은 바다']]],
  last302:['seaDrizzle',[[506,'파도에 떠밀려 해안에서'],[508,'포구 마을']]],
  last303:['blackFog',[[516,'안개 속에서 앳된 남자가'],[518,'검은 안개가 빠져나와'],[522,'안개가 흩어지자']]],
  restLast3:['stillAir',[[527,'쉼터의 벽시계가 멈췄다']]],
  kair01:['blackSand',[[541,'카이로스 아카데미움'],[543,'검은 모래']]],
  kair04:['blackSand',[[559,'학교 밖에는 인간의 시간을 수확하는'],[563,'검은 모래']]],
  kair05:['blackSandLight',[[567,'일반 수문장은 마흔여덟'],[573,'검은 모래']]],
  kair06:['canalMist',[[577,'다음 층에는 상급 수문장']]],
  kair07:['fireAir',[[587,'용광로의 불빛'],[589,'잿더미']]],
  kair08:['inherit',[[595,'관문은 인간의 뇌와 아르콘을']]],
  kair09:['graveFog',[[601,'망각의 묘지']]],
  kair10:['blackSand',[[611,'검은 모래 기둥']]],
  kair02:['stillAir',[[615,'모든 초침이 멈춰 있었다'],[619,'멈춘 회랑']]],
  kair03:['blackSandStorm',[[631,'수문장들의 명령을 따라갈수록'],[637,'검은 모래가 전장을 잠식하고']]],
  restKairo:['goldMotes',[[659,'검은 모래가 금빛으로 변했다']]],
  hando01:['inherit',[[676,'두 창문 너머로 서로 다른 하늘이 보였다']]],
  hando02:['inherit',[[687,'성이 함락된 뒤 두 주인']]],hando03:['inherit',[[695,'두 주인이 되찾은 권한']]],
  restHando:['stillAir',[[712,'같은 시작과 끝을 반복하는 고리']]],
  murder01:['wetStreet',[[719,'비는 그쳤지만 도로는 아직 젖어 있었다']]],
  murder02:['coldAsh',[[738,'오래된 탄내와 젖은 콘크리트 냄새'],[742,'칠 년 전 화재로 검게 탄 건물']]],
  murder04:['inherit',[[757,'청록빌라로 향했다']]],
  murder03:['rainLoop',[[781,'비와 전조등'],[791,'비와 전조등이 둥글게 휘어졌고']]],
  cult01:['inherit',[[804,'순환에서 벗어난 뒤에야']]],cult02:['inherit',[[815,'육체는 생명공학으로 마련되고']]],
  cult05:['inherit',[[823,'내가 지키던 성을 다시 떠올렸다']]],cult06:['inherit',[[837,'마지막 코어에 도착해야']]],
  cult03:['inherit',[[841,'삼중자아 수확실에는']]],cult04:['inherit',[[853,'코어에서 교만의 사이보그 교주와 마주했다']]]
 };
 // 사몽 stages: "ep:stage" (ep 0..15 = P, S-01..S-07, RA..RG, M; stage survival|maze|ascent).
 const SEP=['P','S-01','S-02','S-03','S-04','S-05','S-06','S-07','RA','RB','RC','RD','RE','RF','RG','M'],STAGES=['survival','maze','ascent'];
 const SAMONG={};const sm=(ep,stage,prof,cites)=>{SAMONG[ep+':'+stage]=[prof,cites];};
 for(const s of STAGES){sm(0,s,'inherit',[[904,'서문 — 잠드는 사람']]);sm(1,s,'inherit',[[944,'S-01. 꿰맨 장미의 집']]);sm(7,s,'inherit',[[1843,'S-07. 페르소나 — 내 얼굴을 쓴 자']]);
  sm(4,s,'inherit',[[1240,'비가 내리고 있었다']]);sm(12,s,'inherit',[[2489,'R-10. 네 번째 나팔 — 백색 사수의 승전식']]);}
 sm(2,'survival','stillAir',[[1000,'학교 시계는 자정에서 일 분이 모자랐다']]);sm(2,'maze','inherit',[[1000,'학교 시계는 자정에서 일 분이 모자랐다']]);sm(2,'ascent','inherit',[[1000,'학교 시계는 자정에서 일 분이 모자랐다']]);
 sm(3,'survival','stillAir',[[1217,'도복들이 바람도 없이 흔들렸다']]);sm(3,'maze','rainNight',[[1135,'오래 묻어 둔 비가 기억 속에서 다시 내리기 시작했다'],[1189,'빗속에서 마주쳤다'],[1201,'피와 빗물이 섞였고']]);
 sm(3,'ascent','dripAir',[[1213,'빗소리가 잦아들자']]);
 sm(5,'survival','snowNight',[[1336,'대신 눈 냄새가 들어왔다'],[1338,'그 눈 속에 술집의 불빛이 떠 있었다']]);sm(5,'maze','snowNight',[[1401,'눈이 내리고 있었다']]);
 sm(5,'ascent','paperAir',[[1465,'눈이 아니라 잘게 찢긴 호외']]);
 sm(6,'survival','seaRain',[[1523,'서울의 빗물이 바닷물로 바뀌었다'],[1525,'기계가 비를 막아 주는 처마'],[1508,'포탄이 지나갈 자리에는 먼저 붉은 물결이 일었다']]);
 sm(6,'maze','suspended',[[1595,'물방울마다 거꾸로 선 도시가 비친 채 허공에 걸려 있었다'],[1626,'창밖의 섬광이 스칠 때마다']]);
 sm(6,'ascent','dripAir',[[1784,'처마에서 빗물이 떨어졌다']]);
 sm(8,'survival','inherit',[[1928,'검은 태양 아래에서 얼었다']]);sm(8,'maze','blackSunSnow',[[2040,'열쇠들이 눈발을 가르며 날아왔다'],[2826,'검은 태양의 설원에서는 내 발자국이 둘로 보였다']]);
 sm(8,'ascent','ashSnow',[[2040,'열쇠들이 눈발을 가르며 날아왔다']]);
 sm(9,'survival','inherit',[[2087,'그 앞에는 세 잔의 물이 놓여 있었다']]);sm(9,'maze','fireAir',[[2184,'양쪽의 불길이 처음으로 동시에 보였다']]);sm(9,'ascent','fireAir',[[2184,'양쪽의 불길이 처음으로 동시에 보였다']]);
 sm(10,'survival','dripAir',[[2227,'스물세 해 전의 비가 대련장으로 들어왔다']]);sm(10,'maze','inherit',[[2249,'비가 멎은 골목에']]);sm(10,'ascent','goldMotes',[[2312,'금박은 수련잎처럼 떠올랐다']]);
 sm(11,'survival','swampMist',[[2317,'늪 위에 다리가 놓여 있었다'],[2355,'첫 물결을 피했다']]);sm(11,'maze','inherit',[[2355,'첫 물결을 피했다']]);sm(11,'ascent','inherit',[[2443,'하늘에서 나팔 소리가 났다']]);
 for(const s of STAGES)sm(13,s,'paperAir',[[2595,'종이 모서리가 내 발목을 스쳤다']]);
 sm(14,'survival','ashfall',[[2778,'R-15. 불탄 책의 뒤편에서']]);sm(14,'maze','ashfall',[[2778,'R-15. 불탄 책의 뒤편에서']]);sm(14,'ascent','inherit',[[2663,'하늘에는 일곱 개의 나팔이 떠 있었다']]);
 sm(15,'survival','starGarden',[[2869,'가지가 사라진 자리에는 별이 걸려 있었고']]);sm(15,'maze','inherit',[[2869,'가지가 사라진 자리에는 별이 걸려 있었고']]);sm(15,'ascent','inherit',[[2869,'가지가 사라진 자리에는 별이 걸려 있었고']]);
 // Family default when a region id is not in the table (text silent): the R100 family motes, except the wet / snowy / burning families.
 const FAMILY_PROFILE={snow:'snowNight',swamp:'swampMist',coast:'seaDrizzle',ash:'ashfall',forge:'fireAir'};
 const FAMILY_MOTE={garden:'leaf',swamp:'spore',ash:'ember',forge:'ember',snow:'snow',coast:'spore',memory:'glow',neural:'glow',cave:'dust',regional:'dust'};

 // ---- budgets ---------------------------------------------------------------------------------------
 const CAP={rain:190,snow:150,hail:44,ash:80,ember:70,sand:90,paper:26,gold:34,glow:30,dust:28,leaf:24,spore:28,sus:40,splash:34,ripple:18},MAXP=350;
 const MOTE_KINDS=['ash','ember','sand','paper','gold','glow','dust','leaf','spore','sus'],PRECIP=['rain','snow','hail'];
 function budgetFor(v,level,env){env=env||{};const lv=LEVELS[level]??1,out={total:0,n:{}};if(!lv)return out;
  const k=lv*(env.lowFx?.5:1)*(env.coarse?.7:1),n=out.n;let tot=0;
  for(const kind of[...PRECIP,...MOTE_KINDS]){n[kind]=Math.round(CAP[kind]*k*clamp(v[FI[kind]],0,1));tot+=n[kind];}
  const rain=clamp(v[FI.rain],0,1),drip=clamp(v[FI.drip],0,1);
  n.splash=env.lowFx?0:Math.round(CAP.splash*k*Math.min(1,rain*1.15));n.ripple=env.lowFx?Math.round(CAP.ripple*k*.4*Math.max(rain,drip)):Math.round(CAP.ripple*k*Math.max(rain*.9,drip));
  tot+=n.splash+n.ripple;
  if(tot>MAXP){const s=MAXP/tot;tot=0;for(const q in n){n[q]=Math.floor(n[q]*s);tot+=n[q];}}
  out.total=tot;return out;}
 // Presentation switches by accessibility / device state.
 function looks(env,prefs){env=env||{};const reduced=!!env.reduced;return{flash:!!prefs.flash&&!reduced,sway:reduced?.3:1,gust:reduced?.4:1,flicker:reduced?0:1,waterSpeed:reduced?.35:1,glints:!env.lowFx,ripples:true,hailBursts:true};}
 function stateInto(out,prof,key,t){const c=prof.cycle,tot=prof.total,u=((t+offsetOf(prof,key))%tot+tot)%tot;let acc=0,i=0;for(;i<c.length;i++){if(u<acc+c[i][1])break;acc+=c[i][1];}if(i>=c.length)i=c.length-1;
  const dur=c[i][1],k=smooth(0,Math.min(9,dur*.35),u-acc),a=ST[c[(i+c.length-1)%c.length][0]],b=ST[c[i][0]];
  for(let j=0;j<NF;j++)out[j]=a[j]+(b[j]-a[j])*k;return out;}
 function tableFor(id,ep,stage){if(ep!=null&&stage){const row=SAMONG[ep+':'+stage];if(row)return{key:'sm:'+ep+':'+stage,profile:row[0],cites:row[1],source:'samong'};}
  const row=ZONES[id];return row?{key:id,profile:row[0],cites:row[1],source:'zone'}:null;}
 window.__STORYWORLD_WEATHER_R108_CORE__=Object.freeze({LEVELS,DEFAULTS,FIELDS:F.slice(),STATES:Object.freeze(Object.keys(ST)),PROFILES:Object.freeze(Object.keys(PROF)),
  zones:Object.freeze(Object.keys(ZONES)),stages:Object.freeze(Object.keys(SAMONG)),SEP,STAGES,CAP:Object.freeze({...CAP}),MAXP,FAMILY_PROFILE,FAMILY_MOTE,
  profile:n=>PROF[n]?{...PROF[n],cycle:PROF[n].cycle.map(c=>[...c])}:null,state:n=>ST[n]?Array.from(ST[n]):null,tableFor,zoneRow:id=>ZONES[id]?[ZONES[id][0],ZONES[id][1].map(c=>[...c])]:null,
  stageRow:k=>SAMONG[k]?[SAMONG[k][0],SAMONG[k][1].map(c=>[...c])]:null,budgetFor:(name,level,env)=>budgetFor(ST[name]||vec({}),level,env),budgetVec:(a,level,env)=>budgetFor(Float32Array.from(a),level,env),
  looks,stateAt:(profName,key,t)=>{const p=PROF[profName];return p?Array.from(stateInto(new Float32Array(NF),p,key,t)):null;},hash});

 // ---- runtime (skipped when the game hooks are absent, e.g. in the CPU check) ---------------------
 const A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype;
 if(typeof draw!=='function'||typeof project!=='function'||typeof unproject!=='function'||typeof settings==='undefined'||typeof document==='undefined'||!document.createElement)return;
 let prefs={...DEFAULTS},lastError=null;
 const stats={frames:0,overlayFrames:0,strikes:0,thunders:0,waterPatched:0,lightHooks:0,ripples:0,splashes:0,foamBuilds:0,errors:0};
 try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s){if(LEVELS[s.level]!==undefined)prefs.level=s.level;for(const k of['flash','thunder','water','mood'])if(typeof s[k]==='boolean')prefs[k]=s[k];}}catch(_){}
 const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,500);};
 function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 const coarseQ=window.matchMedia?.('(pointer:coarse)');
 const lowFx=()=>!!settings?.lowFx,reduced=()=>!!settings?.reducedMotion,coarse=()=>!!coarseQ?.matches;
 const live=()=>typeof started!=='undefined'&&started&&!loading&&!!room&&!!player;
 const sightOn=()=>window.__STORYWORLD_SIGHT24__?.enabled===true;
 const rnd=Math.random;

 // ---- environment of the current place -------------------------------------------------------
 let envCache={room:null,layer:null,stage:null,L:null,e:null};
 function resolveEnv(){const L=room.exploration,smg=room.samongR103,stage=smg?.stage||null;
  if(envCache.room===room&&envCache.layer===layer&&envCache.stage===stage&&envCache.L===L&&envCache.e)return envCache.e;
  const fam=L?.r98Scene?.family||L?.surface?.art?.r81Environment||L?.worldWardR81?.environment?.family||window.__STORYWORLD_ENVIRONMENT_R81__?.specs?.[zone]?.family||'regional';
  const row=smg?tableFor(zone,smg.ep,smg.stage):tableFor(zone,null,null);let name=row?.profile;
  if(!name)name=FAMILY_PROFILE[fam]||'inherit';
  const prof=PROF[name]||PROF.inherit,key=row?.key||zone+':'+layer;
  const open=L?.r98Scene?.open===true,out=L?.r99Outdoor,s105=L?.samongR105;
  const water=smg?(s105?.outdoor?.water||null):(out?.water||null);
  const e={key,prof,fam,open,water,smg:!!smg,bounds:Array.isArray(L?.bounds)?L.bounds:null,famMote:FAMILY_MOTE[fam]||'dust'};
  envCache={room,layer,stage,L,e};return e;}

 // ---- live state --------------------------------------------------------------------------------
 const cur=new Float32Array(NF),tgt=new Float32Array(NF);
 let clock=0,waterClock=0,lastT=performance.now(),fdt=.016,master=0,lastKey='',forced=null,active=false,budget=budgetFor(ST.clear,'normal',{}),budgetAt=-9,coarseNow=false,coarseAt=-9;
 let holdUntil=0,camDX=0,camDY=0,lastO=null,gustNow=0,wind=0,env=null,flash=null,thunderAt=-1,nextFlash=0,flashAmt=0,unitPx=40,heroX=0,heroY=0,shown=false;
 const gust=t=>{const a=Math.sin(t*.53)*Math.sin(t*.31+1.3);return a>0?a*a:0;};

 // ---- sprites ------------------------------------------------------------------------------------------
 function sprite(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');if(x)fn(x,w,h);return c;}
 function rng(seed){let a=seed>>>0||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 let SOFT=null,FOG=null;const tinted=new Map();
 function sprites(){if(SOFT)return;
  SOFT=sprite(32,32,(x,w,h)=>{const gr=x.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.38,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,w,h);});
  FOG=sprite(256,96,(x,w,h)=>{const r=rng(1081);for(let i=0;i<10;i++){const cx=w*(.12+.76*r()),cy=h*(.3+.4*r()),rx=w*(.13+.17*r()),sy=(h*(.22+.2*r()))/rx;x.save();x.translate(cx,cy);x.scale(1,sy);const gr=x.createRadialGradient(0,0,0,0,0,rx);gr.addColorStop(0,'rgba(255,255,255,.4)');gr.addColorStop(.6,'rgba(255,255,255,.14)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.beginPath();x.arc(0,0,rx,0,TAU);x.fill();x.restore();}});}
 function tintOf(src,c,tag){const k=tag+c[0]+','+c[1]+','+c[2];let t=tinted.get(k);if(t)return t;t=sprite(src.width,src.height,(x,w,h)=>{x.drawImage(src,0,0);x.globalCompositeOperation='source-in';x.fillStyle='rgb('+c[0]+','+c[1]+','+c[2]+')';x.fillRect(0,0,w,h);});tinted.set(k,t);return t;}

 // ---- canvas / overlay nodes ---------------------------------------------------------------------
 const cv=document.createElement('canvas');cv.id='weatherR108';cv.setAttribute('aria-hidden','true');cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;display:none';
 const flashEl=document.createElement('div');flashEl.id='flashR108';flashEl.setAttribute('aria-hidden','true');
 flashEl.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:2;display:none;opacity:0;mix-blend-mode:screen;background:radial-gradient(ellipse at 50% 12%,rgba(226,236,255,1),rgba(150,170,232,.78) 52%,rgba(98,118,196,.55))';
 const own=document.createElement('style');own.id='weatherStyleR108';own.textContent='body.r108-wx-own #ambienceR100{display:none!important}';if(document.head)document.head.appendChild(own);
 let g=null,ownOn=false;
 function mount(){const s=document.getElementById('stage');if(!s)return false;if(cv.parentNode!==s)s.appendChild(cv);if(flashEl.parentNode!==s)s.appendChild(flashEl);return true;}
 function setOwn(on){if(on===ownOn)return;ownOn=on;try{document.body?.classList.toggle('r108-wx-own',on);}catch(_){}}

 // ---- particle pools (struct of arrays, no per-frame allocation) -------------------------------------
 const NR=270,NS=180,NH=60,NB=30,NSP=40,NRP=20;
 const R_={x:new Float32Array(NR),y:new Float32Array(NR),ly:new Float32Array(NR),v:new Float32Array(NR),s:new Float32Array(NR),l:new Uint8Array(NR)};
 const S_={x:new Float32Array(NS),y:new Float32Array(NS),v:new Float32Array(NS),p:new Float32Array(NS),f:new Float32Array(NS),l:new Uint8Array(NS)};
 const H_={x:new Float32Array(NH),y:new Float32Array(NH),ly:new Float32Array(NH),v:new Float32Array(NH)};
 const B_={x:new Float32Array(NB),vx:new Float32Array(NB),vy:new Float32Array(NB),t:new Float32Array(NB),y0:new Float32Array(NB)};let bHead=0;
 const SP_={x:new Float32Array(NSP),y:new Float32Array(NSP),t:new Float32Array(NSP),l:new Uint8Array(NSP)};let spHead=0;
 const RP_={x:new Float32Array(NRP),y:new Float32Array(NRP),t:new Float32Array(NRP),k:new Uint8Array(NRP),s:new Float32Array(NRP)};let rpHead=0;
 B_.t.fill(9);SP_.t.fill(9);RP_.t.fill(9);
 // Motes: kind -> spec. fall (px/s, negative = rises), sway (px), size range, colours, add = lighter blend.
 const MK={ash:{cap:CAP.ash,c:[[158,152,144],[112,108,106]],s:[1.4,3.4],fall:[22,44],sway:20,add:false,a:.6,shape:'flake'},
  ember:{cap:CAP.ember,c:[[255,150,60],[255,205,110]],s:[1,2.6],fall:[-44,-18],sway:26,add:true,a:.85,shape:'ember'},
  sand:{cap:CAP.sand,c:[[44,42,40],[86,78,68]],s:[.9,2.1],fall:[8,20],sway:6,add:false,a:.7,shape:'streak'},
  paper:{cap:CAP.paper,c:[[228,222,206],[205,198,182]],s:[3,6],fall:[14,30],sway:34,add:false,a:.7,shape:'rect'},
  gold:{cap:CAP.gold,c:[[255,214,120],[255,236,170]],s:[1.4,3.2],fall:[-10,10],sway:12,add:true,a:.8,shape:'soft'},
  glow:{cap:CAP.glow,c:[[200,160,255],[160,200,255]],s:[1.4,2.8],fall:[-10,-3],sway:8,add:true,a:.7,shape:'soft'},
  dust:{cap:CAP.dust,c:[[230,214,170]],s:[1,2.2],fall:[2,6],sway:8,add:false,a:.55,shape:'dot'},
  leaf:{cap:CAP.leaf,c:[[176,206,96],[226,190,96]],s:[2,4],fall:[10,18],sway:28,add:false,a:.7,shape:'rect'},
  spore:{cap:CAP.spore,c:[[150,210,120],[200,230,150]],s:[1.5,3],fall:[-8,-3],sway:10,add:false,a:.55,shape:'dot'},
  sus:{cap:CAP.sus,c:[[200,225,255]],s:[1.3,2.6],fall:[0,0],sway:0,add:true,a:.9,shape:'glint'}};
 const MP={};for(const k of MOTE_KINDS){const n=MK[k].cap;MP[k]={x:new Float32Array(n),y:new Float32Array(n),p:new Float32Array(n),v:new Float32Array(n),s:new Float32Array(n),a:new Float32Array(n),c:new Uint8Array(n),ok:false};}
 function seedRain(){for(let i=0;i<NR;i++){const u=rnd();R_.l[i]=u<.45?0:u<.8?1:2;R_.s[i]=rnd();R_.v[i]=.88+rnd()*.24;R_.x[i]=rnd()*1200;R_.y[i]=-rnd()*600;R_.ly[i]=-1;}}
 function seedSnow(){for(let i=0;i<NS;i++){const u=rnd();S_.l[i]=u<.5?0:u<.83?1:2;S_.x[i]=rnd()*1200;S_.y[i]=rnd()*700;S_.v[i]=.8+rnd()*.4;S_.p[i]=rnd()*TAU;S_.f[i]=.6+rnd()*1.2;}}
 function seedHail(){for(let i=0;i<NH;i++){H_.x[i]=rnd()*1200;H_.y[i]=-rnd()*700;H_.ly[i]=-1;H_.v[i]=.85+rnd()*.3;}}
 function seedMotes(k,w,h){const m=MP[k],sp=MK[k];for(let i=0;i<sp.cap;i++){m.x[i]=rnd()*w;m.y[i]=rnd()*h;m.p[i]=rnd()*TAU;m.v[i]=rnd();m.s[i]=sp.s[0]+rnd()*(sp.s[1]-sp.s[0]);m.c[i]=(rnd()*sp.c.length)|0;}m.ok=true;}
 seedRain();seedSnow();seedHail();
 const FOGB=[];for(let i=0;i<7;i++)FOGB.push({x:rnd(),y:.45+.5*rnd(),w:.5+.45*rnd(),h:.2+.18*rnd(),v:.6+.8*rnd(),a:.6+.4*rnd(),f:rnd()<.5?1:-1});
 function resetFog(){for(const b of FOGB){b.x=rnd();b.y=.45+.5*rnd();}}
 const PAR_R=[.25,.45,.7],PAR_S=[.3,.55,.85],LAYW=[.55,.85,1.15],RAINV=[640,880,1160];

 // ---- the world on the screen ----------------------------------------------------------------------------
 function worldWater(wx,wy){if(!env?.water)return 0;const L=room.exploration,b=env.bounds;
  if(b&&(wx<b[0]-.2||wx>b[2]+.2||wy<b[1]-.2||wy>b[3]+.2))return 1;if(!env.smg)return 0;
  if(typeof A?.explorationBlocked!=='function'||!A.explorationBlocked(L,wx,wy,.04))return 0;
  for(const w of L.walls||[]){if(Math.abs(wx-w.x)<=(w.width||1)/2+.45&&Math.abs(wy-w.y)<=(w.depth||1)/2+.45)return 0;}return 1;}
 function worldGround(wx,wy){return typeof A?.explorationBlocked==='function'?!A.explorationBlocked(room.exploration,wx,wy,.04):true;}

 // ---- per-frame state (runs before the base draw so the 3D pass sees it) -------------------------------------
 function pre(){const now=performance.now(),dt=clamp((now-lastT)/1000,0,.05);lastT=now;fdt=dt;stats.frames++;
  waterClock+=dt*(reduced()?.35:1);WU.r108T.value=waterClock;
  active=false;if(!prefs.level||prefs.level==='off'||!live()||modal||(typeof storyScene!=='undefined'&&storyScene)||(layer!=='STORY'&&layer!=='DREAM')){WU.r108Rain.value=0;WU.r108Flash.value=0;return false;}
  if(now-coarseAt>1500){coarseNow=coarse();coarseAt=now;}
  env=resolveEnv();clock+=dt;
  if(env.key!==lastKey){lastKey=env.key;master=0;flash=null;thunderAt=-1;stateInto(cur,env.prof,env.key,clock);nextFlash=clock+4+rnd()*6;lastO=null;resetFog();}
  stateInto(tgt,env.prof,env.key,clock);
  // Family baseline: the R100 motes of this environment keep drifting inside any profile that takes over.
  if(!env.prof.inherit){const mi=FI[env.famMote];if(mi!=null)tgt[mi]=Math.max(tgt[mi],env.famMote==='snow'?.2:.45);}
  if(forced){if(clock>forced.until)forced=null;else for(let i=0;i<NF;i++)tgt[i]=forced.v[i];}
  if(!env.open){for(const k of PRECIP)tgt[FI[k]]=0;if(!env.prof.air){tgt[FI.flash]=0;tgt[FI.gust]*=.3;}}
  if(env.prof.still){tgt[FI.wind]=0;tgt[FI.gust]=0;}
  const k=1-Math.exp(-dt/(forced?.5:2.2));for(let i=0;i<NF;i++)cur[i]+=(tgt[i]-cur[i])*k;
  master=Math.min(1,master+dt/1.6);
  const lk=looks({lowFx:lowFx(),reduced:reduced()},prefs);
  gustNow=gust(clock)*cur[FI.gust]*lk.gust;wind=env.prof.still?0:clamp(cur[FI.wind]+gustNow*.6,-1.2,1.2);
  if(now-budgetAt>250){budget=budgetFor(cur,prefs.level,{lowFx:lowFx(),coarse:coarseNow});budgetAt=now;}
  const fl=cur[FI.flash];
  if(fl>.28&&clock>=nextFlash&&!flash){strike(env.prof.flash||'bolt');nextFlash=clock+(14-7*fl)*(.75+rnd()*.5)+3;}
  if(flash){flash.t=clock<holdUntil?.06:flash.t+dt;if(flash.t>.8)flash=null;}
  flashAmt=flash?flashCurve(flash.t)*flash.peak:0;
  if(thunderAt>=0&&clock>=thunderAt){thunderAt=-1;thunder(flash?.kind==='shell'?.55:flash?.kind==='window'?.3:1);}
  active=true;waterFrame(lk);return true;}

 // ---- lightning ------------------------------------------------------------------------------------------------
 function flashCurve(t){const p=u=>u<0?0:u<.04?u/.04:Math.exp(-(u-.04)/.09);return Math.min(1,p(t-.01)+.62*p(t-.2));}
 function strike(kind){flash={t:0,peak:kind==='window'?.28:kind==='shell'?.5:.62+rnd()*.2,x:.18+.64*rnd(),kind,bolt:null};stats.strikes++;thunderAt=clock+(kind==='window'?1.2:.35+rnd()*1.9);
  if(kind==='bolt'){const pts=[];let x=flash.x,y=-.02;const n=7+((rnd()*4)|0),bottom=.38+.22*rnd();for(let i=0;i<=n;i++){pts.push([x,y]);y+=bottom/n;x+=(rnd()-.5)*.075;}flash.bolt=pts;}}
 let noiseBuf=null;
 function thunder(strength){try{stats.thunders++;if(!prefs.thunder||typeof audioContext==='undefined'||!audioContext||typeof audioUnlocked==='undefined'||!audioUnlocked||!settings.sound||!(settings.volume>0)||document.hidden||audioContext.state!=='running'||modal)return;
   const ac=audioContext,t=ac.currentTime;
   if(!noiseBuf){const n=Math.floor(ac.sampleRate*2.8),b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);let last=0;for(let i=0;i<n;i++){last=(last+(Math.random()*2-1)*.06)/1.02;d[i]=last*3.2;}noiseBuf=b;}
   const src=ac.createBufferSource();src.buffer=noiseBuf;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(240,t);lp.frequency.exponentialRampToValueAtTime(64,t+2.3);
   const gn=ac.createGain(),v=clamp(settings.volume,0,1)*.3*strength;gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(Math.max(.0002,v),t+.1);gn.gain.exponentialRampToValueAtTime(.0001,t+2.5);
   src.connect(lp);lp.connect(gn);gn.connect(ac.destination);src.start(t);src.stop(t+2.7);}catch(e){fail(e);}}

 // ---- drawing ----------------------------------------------------------------------------------------------------
 const RCOL=[196,214,236],rgba=(c,a)=>'rgba('+c[0]+','+c[1]+','+c[2]+','+a.toFixed(3)+')',cstr=(colors,i)=>(colors.__s||(colors.__s=colors.map(c=>'rgb('+c[0]+','+c[1]+','+c[2]+')')))[i];
 function post(){if(!mount())return;
  const w=Math.max(1,Math.round(W)),h=Math.max(1,Math.round(H));if(cv.width!==w)cv.width=w;if(cv.height!==h)cv.height=h;
  if(!g)g=cv.getContext('2d');if(!g)return;sprites();
  if(!shown){cv.style.display='block';shown=true;}g.clearRect(0,0,w,h);stats.overlayFrames++;
  const dt=fdt,S=clamp(h/540,.8,1.5),lk=looks({lowFx:lowFx(),reduced:reduced()},prefs),n=budget.n,M=master;
  const hp=project(player.x,player.y);heroX=hp.x;heroY=hp.y;
  const o=project(0,0),o1=project(1,0);unitPx=Math.hypot(o1.x-o.x,o1.y-o.y);
  camDX=lastO?o.x-lastO.x:0;camDY=lastO?o.y-lastO.y:0;lastO=o;if(Math.abs(camDX)>200||Math.abs(camDY)>200){camDX=camDY=0;}
  const still=!!env.prof.still,sway=lk.sway*(still?.12:1),colors=env.prof.colors;
  g.globalAlpha=1;g.globalCompositeOperation='source-over';
  const fogA=(cur[FI.fog]*.2+(prefs.mood&&env.open?.045:0))*M;if(fogA>.004)drawFog(w,h,dt,fogA);
  for(const k of MOTE_KINDS){const c=n[k];if(c>0)drawMotes(k,c,w,h,dt,S,M,sway,still,colors?.[k]);}
  if(n.snow>0)drawSnow(n.snow,w,h,dt,S,M,sway);
  if(n.rain>0)drawRain(n.rain,w,h,dt,S,M);
  if(n.hail>0&&lk.hailBursts)drawHail(n.hail,w,h,dt,S,M);
  if(n.splash>0||n.ripple>0)drawGround(w,h,dt,S,M,n);
  const v=env.prof.veil;if(v&&!sightOn()){const a=v[3]*clamp(cur[FI[v[4]]],0,1)*M;if(a>.004){g.fillStyle='rgba('+v[0]+','+v[1]+','+v[2]+','+a.toFixed(3)+')';g.fillRect(0,0,w,h);}}
  const fa=lk.flash?flashAmt:0;
  if(fa>.01){if(flash.bolt&&flash.t<.14)drawBolt(w,h,fa);flashEl.style.display='block';flashEl.style.opacity=(fa*(flash.kind==='bolt'?.5:flash.kind==='shell'?.32:.18)).toFixed(3);}
  else if(flashEl.style.display!=='none'){flashEl.style.display='none';flashEl.style.opacity='0';}
  g.globalAlpha=1;g.globalCompositeOperation='source-over';}

 function drawFog(w,h,dt,a){const fc=env.prof.fog||[160,170,185],spr=tintOf(FOG,fc,'f'),cnt=lowFx()?4:FOGB.length;
  for(let i=0;i<cnt;i++){const b=FOGB[i],bw=b.w*w*(1+.25*wind*b.f),bh=b.h*h*1.15;
   b.x+=(b.f*.012*b.v*(env.prof.still?.05:1)+wind*.02*b.v)*dt-camDX/w*.35;b.x=((b.x%1.5)+1.5)%1.5;
   g.globalAlpha=Math.min(.34,a*b.a);g.drawImage(spr,(b.x-.25)*w-bw/2,b.y*h-bh/2,bw,bh);}
  g.globalAlpha=1;}

 function drawMotes(kind,cnt,w,h,dt,S,M,sway,still,col){const sp=MK[kind],m=MP[kind];if(!m.ok)seedMotes(kind,w,h);
  const colors=col||sp.c,cn=Math.min(cnt,sp.cap),par=still?1:.8,drift=still?.06:1,fall=sp.fall,flick=sp.shape==='ember'||sp.shape==='soft'||sp.shape==='glint';
  const wx=still?0:wind*(kind==='sand'?420:kind==='paper'||kind==='leaf'?120:60)*S,slant=kind==='ember'&&cur[FI.fall]>.4;
  for(let i=0;i<cn;i++){const z=.6+.8*m.v[i];m.p[i]+=dt*(still?.15:1);
   let vy=(fall[0]+(fall[1]-fall[0])*m.v[i])*S*drift;if(slant)vy=Math.abs(vy)*5+110*S;
   m.x[i]+=(wx*z+Math.sin(clock*.7+m.p[i])*sp.sway*sway*.4+(slant?wind*300*S:0))*dt-camDX*par*z*(still?1:.7);
   m.y[i]+=vy*dt*z-camDY*par*z*(still?1:.7);
   if(m.x[i]<-12)m.x[i]+=w+24;else if(m.x[i]>w+12)m.x[i]-=w+24;if(m.y[i]<-12)m.y[i]+=h+24;else if(m.y[i]>h+12)m.y[i]-=h+24;
   const tw=flick?.45+.55*Math.abs(Math.sin(clock*(kind==='sus'?.9:2.3)+m.p[i]*3)):.82;m.a[i]=clamp(sp.a*M*(.45+.35*z)*tw,0,1);}
  g.globalCompositeOperation=sp.add?'lighter':'source-over';
  const sprs=sp.shape==='soft'?(colors.__soft||(colors.__soft=colors.map(c=>tintOf(SOFT,c,'s')))):null;
  for(let ci=0;ci<colors.length;ci++){const cs=cstr(colors,ci);g.fillStyle=cs;g.strokeStyle=cs;
   for(let i=0;i<cn;i++){if(m.c[i]%colors.length!==ci)continue;g.globalAlpha=m.a[i];const x=m.x[i],y=m.y[i],s=m.s[i]*S*(kind==='sus'?1:.6+.8*m.v[i]);
    switch(sp.shape){
     case'rect':g.save();g.translate(x,y);g.rotate(clock*1.1+m.p[i]*4);g.fillRect(-s,-s*.45,s*2,s*.9);g.restore();break;
     case'flake':g.fillRect(x,y,s*(.6+.5*Math.abs(Math.sin(clock*1.6+m.p[i]))),s*.62);break;
     case'ember':g.beginPath();g.arc(x,y,s*.9,0,TAU);g.fill();if(slant){g.lineWidth=s*.8;g.beginPath();g.moveTo(x,y);g.lineTo(x-wind*40*S,y-48*S);g.stroke();}break;
     case'streak':g.lineWidth=Math.max(.8,s*.6);g.beginPath();g.moveTo(x,y);g.lineTo(x-wx*.03,y-1);g.stroke();break;
     case'soft':{const r=s*3.1;g.drawImage(sprs[ci],x-r,y-r,r*2,r*2);break;}
     case'glint':{const r=s*1.3;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();if(m.a[i]>.62){g.fillRect(x-r*2.4,y-.4,r*4.8,.8);g.fillRect(x-.4,y-r*2.4,.8,r*4.8);}break;}
     default:g.beginPath();g.arc(x,y,s*.9,0,TAU);g.fill();}}}
  g.globalAlpha=1;g.globalCompositeOperation='source-over';}

 function drawSnow(cnt,w,h,dt,S,M,sway){const white=env.prof.name==='ashSnow'?[226,228,232]:[240,247,255],n=Math.min(cnt,NS),wx=wind*190*S,spr=tintOf(SOFT,white,'w'),streak=wind>.55;
  for(let i=0;i<n;i++){const l=S_.l[i];S_.p[i]+=dt*S_.f[i];
   const vy=(l===0?30:l===1?56:104)*S_.v[i]*S,vx=wx*(l===0?.4:l===1?.7:1.1)+Math.sin(S_.p[i]*1.3)*(l===0?5:l===1?12:22)*S*sway;
   S_.x[i]+=vx*dt-camDX*PAR_S[l];S_.y[i]+=vy*dt-camDY*PAR_S[l];
   if(S_.y[i]>h+8){S_.y[i]=-8;S_.x[i]=rnd()*w;}else if(S_.y[i]<-12)S_.y[i]=h+8;
   if(S_.x[i]<-10)S_.x[i]+=w+20;else if(S_.x[i]>w+10)S_.x[i]-=w+20;}
  g.fillStyle='rgba(236,244,255,'+(.5*M).toFixed(3)+')';g.beginPath();for(let i=0;i<n;i++)if(S_.l[i]===0)g.rect(S_.x[i],S_.y[i],1.1*S,1.1*S);g.fill();
  g.fillStyle='rgba(244,249,255,'+(.74*M).toFixed(3)+')';g.beginPath();for(let i=0;i<n;i++)if(S_.l[i]===1){if(streak)g.rect(S_.x[i]-wind*3.5*S,S_.y[i],wind*7*S,1.5*S);else g.rect(S_.x[i],S_.y[i],1.9*S,1.9*S);}g.fill();
  g.globalAlpha=.82*M;for(let i=0;i<n;i++)if(S_.l[i]===2){const r=(2.4+1.6*S_.v[i])*S;g.drawImage(spr,S_.x[i]-r,S_.y[i]-r,r*2,r*2);}g.globalAlpha=1;}

 function rainSpawn(i,w,h,vx,v){const drop=(.5+rnd()*.5)*h*.95;R_.ly[i]=rnd()*h*1.02;R_.y[i]=R_.ly[i]-drop;R_.x[i]=rnd()*w-vx*(drop/v);}
 function drawRain(cnt,w,h,dt,S,M){const n=Math.min(cnt,NR),inten=cur[FI.rain],wx=wind*400*S,swirl=!!env.prof.swirl,a0=(.5+.5*inten)*M,sh=sightOn()?.7:1,splash=budget.n.splash>0&&inten>.12;
  for(let i=0;i<n;i++){const l=R_.l[i],v=RAINV[l]*R_.v[i]*S*(1+.12*inten);
   let vx=wx*LAYW[l];if(swirl)vx+=Math.sin(clock*.9+R_.y[i]/h*5.2)*(l===0?120:l===1?170:230)*S;
   if(R_.ly[i]<0||R_.x[i]>w+80||R_.x[i]<-80)rainSpawn(i,w,h,vx,v);
   R_.x[i]+=vx*dt-camDX*PAR_R[l];R_.y[i]+=v*dt-camDY*PAR_R[l];R_.ly[i]-=camDY*PAR_R[l];
   if(R_.y[i]>=R_.ly[i]){if(l>0&&splash)addSplash(R_.x[i],R_.ly[i],l);rainSpawn(i,w,h,vx,v);}}
  g.lineCap='round';
  for(let l=0;l<3;l++){g.strokeStyle=rgba(RCOL,a0*(l===0?.34:l===1?.5:.7)*sh);g.lineWidth=(l===0?.9:l===1?1.3:1.8)*S;g.beginPath();
   const tl=l===0?.05:l===1?.052:.056;
   for(let i=0;i<n;i++){if(R_.l[i]!==l)continue;const v=RAINV[l]*R_.v[i]*S,len=tl*(.75+.5*R_.s[i]),x1=R_.x[i],y1=R_.y[i];if(y1<-70||y1>h+10)continue;
    if(l===2&&(i&1)){const dx=x1-heroX,dy=y1-heroY;if(dx*dx+dy*dy<(78*S)*(78*S))continue;}
    let vx=wx*LAYW[l];if(swirl)vx+=Math.sin(clock*.9+y1/h*5.2)*(l===0?120:l===1?170:230)*S;
    g.moveTo(x1-vx*len,y1-v*len);g.lineTo(x1,y1);}
   g.stroke();}}
 function addSplash(x,y,l){const i=spHead++%NSP;SP_.x[i]=x;SP_.y[i]=y;SP_.t[i]=0;SP_.l[i]=l;stats.splashes++;}

 function hailSpawn(i,w,h,wx,v){const drop=(.55+rnd()*.4)*h;H_.ly[i]=rnd()*h;H_.y[i]=H_.ly[i]-drop;H_.x[i]=rnd()*w-wx*(drop/v);}
 function drawHail(cnt,w,h,dt,S,M){const n=Math.min(cnt,NH),wx=wind*320*S;
  for(let i=0;i<n;i++){const v=1500*H_.v[i]*S;
   if(H_.ly[i]<0||H_.x[i]>w+80||H_.x[i]<-80)hailSpawn(i,w,h,wx,v);
   H_.x[i]+=wx*dt-camDX*.8;H_.y[i]+=v*dt-camDY*.8;H_.ly[i]-=camDY*.8;
   if(H_.y[i]>=H_.ly[i]){const b=bHead++%NB;B_.x[b]=H_.x[i];B_.y0[b]=H_.ly[i];B_.vx[b]=(rnd()-.4)*60+wx*.15;B_.vy[b]=-(260+rnd()*220)*S;B_.t[b]=0;hailSpawn(i,w,h,wx,v);}}
  g.lineCap='round';g.strokeStyle='rgba(226,238,255,'+(.5*M).toFixed(3)+')';g.lineWidth=1.5*S;g.beginPath();
  for(let i=0;i<n;i++){if(H_.y[i]<-20)continue;const v=1500*H_.v[i]*S;g.moveTo(H_.x[i]-wx*.011,H_.y[i]-v*.011);g.lineTo(H_.x[i],H_.y[i]);}g.stroke();
  g.fillStyle='rgba(244,250,255,'+(.92*M).toFixed(3)+')';g.beginPath();for(let i=0;i<n;i++){if(H_.y[i]<-20)continue;g.rect(H_.x[i]-1.1*S,H_.y[i]-1.1*S,2.2*S,2.2*S);}g.fill();
  g.fillStyle='rgb(240,248,255)';for(let b=0;b<NB;b++){if(B_.t[b]>=.4)continue;B_.t[b]+=dt;const t=B_.t[b];if(t>=.4)continue;
   const x=B_.x[b]+B_.vx[b]*t,y=B_.y0[b]+B_.vy[b]*t+.5*1900*S*t*t;g.globalAlpha=(1-t/.4)*.9*M;g.beginPath();g.arc(x,y,1.5*S,0,TAU);g.fill();}
  g.globalAlpha=1;}

 // splashes (screen space, short) and ripples (world anchored, longer)
 function drawGround(w,h,dt,S,M,n){
  if(n.splash>0){g.lineWidth=1*S;for(let i=0;i<NSP;i++){if(SP_.t[i]>=.3)continue;SP_.t[i]+=dt;const u=SP_.t[i]/.3;if(u>=1)continue;const l=SP_.l[i],r=(l===2?2+7*u:1.2+4*u)*S;
    g.strokeStyle='rgba(206,224,244,'+((1-u)*(l===2?.55:.35)*M).toFixed(3)+')';g.beginPath();g.ellipse(SP_.x[i],SP_.y[i],r,r*.45,0,0,TAU);g.stroke();
    if(l===2&&u<.6){g.fillStyle='rgba(224,236,250,'+((1-u)*.5*M).toFixed(3)+')';const j=3*S*u;g.fillRect(SP_.x[i]-j-1,SP_.y[i]-6*S*Math.sin(u*3.1),1.4*S,1.4*S);g.fillRect(SP_.x[i]+j,SP_.y[i]-5*S*Math.sin(u*3.1),1.4*S,1.4*S);}}}
  if(n.ripple>0){spawnRipples(w,h,dt,Math.max(cur[FI.rain]*.9,cur[FI.drip])*n.ripple*.55);
   for(let i=0;i<NRP;i++){if(RP_.t[i]>=9)continue;RP_.t[i]+=dt;const life=RP_.k[i]?1.25:.55,u=RP_.t[i]/life;if(u>=1){RP_.t[i]=9;continue;}
    const q=project(RP_.x[i],RP_.y[i]),r=(RP_.k[i]?.35+1.1*u:.2+.45*u)*unitPx*RP_.s[i]*1.15,a=(1-u)*(RP_.k[i]?.5:.38)*M;
    if(q.x<-80||q.x>w+80||q.y<-40||q.y>h+40)continue;
    g.strokeStyle='rgba(200,220,240,'+a.toFixed(3)+')';g.lineWidth=(RP_.k[i]?1.2:.9)*S;g.beginPath();g.ellipse(q.x,q.y,r,r*.5,0,0,TAU);g.stroke();
    if(RP_.k[i]&&u>.25){g.strokeStyle='rgba(200,220,240,'+(a*.55).toFixed(3)+')';g.beginPath();g.ellipse(q.x,q.y,r*.62,r*.31,0,0,TAU);g.stroke();}}}}
 function spawnRipples(w,h,dt,rate){let want=rate*dt;want=rnd()<want%1?Math.floor(want)+1:Math.floor(want);let tries=0;
  while(want>0&&tries++<8){const p=unproject(rnd()*w,h*.12+rnd()*h*.86);if(!p||!isFinite(p.x+p.y))continue;
   const k=worldWater(p.x,p.y)?1:0;if(!k){if(cur[FI.drip]<.08&&!(cur[FI.rain]>.5&&rnd()<.25))continue;if(!worldGround(p.x,p.y))continue;}
   const i=rpHead++%NRP;RP_.x[i]=p.x;RP_.y[i]=p.y;RP_.t[i]=0;RP_.k[i]=k;RP_.s[i]=.7+rnd()*.7;stats.ripples++;want--;}}
 function drawBolt(w,h,a){g.globalCompositeOperation='lighter';const pts=flash.bolt,al=Math.min(1,a*1.6);
  for(const[lw,col]of[[7,'rgba(150,170,255,'+(al*.18).toFixed(3)+')'],[3,'rgba(200,215,255,'+(al*.5).toFixed(3)+')'],[1.4,'rgba(255,255,255,'+(al*.95).toFixed(3)+')']]){g.strokeStyle=col;g.lineWidth=lw;g.lineJoin='round';g.beginPath();pts.forEach((p,i)=>{i?g.lineTo(p[0]*w,p[1]*h):g.moveTo(p[0]*w,p[1]*h);});g.stroke();}
  g.globalCompositeOperation='source-over';}

 // ---- 3D: water shader, shore foam, carried light ------------------------------------------------------------------------------
 const WU={r108T:{value:0},r108Warp:{value:.004},r108Layer:{value:.85},r108Drift:{value:null},r108Gleam:{value:.55},r108Rain:{value:0},r108Flash:{value:0},r108Lite:{value:0},r108Cool:{value:null}};
 const WATER_HEAD='uniform float r108T;uniform float r108Warp;uniform float r108Layer;uniform vec2 r108Drift;uniform float r108Gleam;uniform float r108Rain;uniform float r108Flash;uniform float r108Lite;uniform vec3 r108Cool;varying vec3 r108WP;\n'+
  'float r108H(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+
  'float r108N(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(r108H(i),r108H(i+vec2(1.,0.)),u.x),mix(r108H(i+vec2(0.,1.)),r108H(i+vec2(1.,1.)),u.x),u.y);}\n'+
  'float r108Ring(vec2 p,float cellScale,float rate,float dens){vec2 q=p*cellScale,c=floor(q),f=fract(q);float h=r108H(c),on=step(h,dens);vec2 ctr=vec2(.2+.6*r108H(c+3.7),.2+.6*r108H(c+9.1));float ph=fract(r108T*rate+h*7.3);float d=length(f-ctr);float r=ph*.46;float ring=(1.-smoothstep(0.,.07,abs(d-r)))*(1.-ph)*(1.-ph);return ring*on;}\n';
 const WATER_BODY='#ifdef USE_MAP\n{vec2 w=r108WP.xz;float tt=r108T;vec2 warp=vec2(sin(w.x*1.37+tt*1.05)+sin(w.y*2.11-tt*.83),cos(w.y*1.73+tt*.91)+cos(w.x*1.19-tt*1.13))*r108Warp;\n'+
  'vec4 s1=texture2D(map,vMapUv+warp);vec2 uv2=vMapUv*vec2(.57,.66)+r108Drift*tt-warp*1.7+vec2(.31,.17);vec4 s2=texture2D(map,uv2);\n'+
  'vec3 hi=max(s2.rgb-vec3(.19),vec3(0.))*r108Layer;vec4 sampledDiffuseColor=vec4(s1.rgb*.94+hi*1.25,s1.a);diffuseColor*=sampledDiffuseColor;\n'+
  'if(r108Lite<.5){float gl=r108N(w*5.3+vec2(tt*.33,-tt*.21));gl=smoothstep(.74,.96,gl)*r108N(w*17.+vec2(-tt*.8,tt*.6));float shine=gl*r108Gleam*(1.+r108Flash*2.2);diffuseColor.rgb+=vec3(.5,.66,.8)*shine*.55;\n'+
  'float rp=(r108Ring(w,1.55,.62,r108Rain)+r108Ring(w+11.7,2.4,.9,r108Rain*.8))*r108Rain;diffuseColor.rgb+=vec3(.42,.54,.64)*rp*.55;}\n'+
  'diffuseColor.rgb*=1.+r108Flash*.7;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*r108Cool,.55);}\n#endif\n';
 const patchedWater=new WeakSet();
 function patchWater(m){if(!m||patchedWater.has(m)||!m.isMeshBasicMaterial||!m.map)return;patchedWater.add(m);
  const before=m.onBeforeCompile,prevKey=m.customProgramCacheKey;
  const wrap=function(shader,...a){if(typeof before==='function')before.call(this,shader,...a);Object.assign(shader.uniforms,WU);
   if(!shader.vertexShader.includes('r108WP'))shader.vertexShader='varying vec3 r108WP;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nr108WP=(modelMatrix*vec4(transformed,1.)).xyz;');
   if(!shader.fragmentShader.includes('r108Warp')&&shader.fragmentShader.includes('#include <map_fragment>'))shader.fragmentShader=WATER_HEAD+shader.fragmentShader.replace('#include <map_fragment>',WATER_BODY);};
  if(typeof before==='function')for(const k of Object.keys(before))wrap[k]=before[k];
  m.onBeforeCompile=wrap;m.customProgramCacheKey=function(){return(typeof prevKey==='function'?prevKey.call(this):'')+'|r108-water';};m.needsUpdate=true;stats.waterPatched++;}
 function waterMaterials(r){const out=[],v=r.voidMeshR81;if(v?.userData?.r99Ground&&/water/.test(v.material?.name||''))out.push(v.material);
  for(const k in r.r99Ground||{})if(/water/.test(k)&&r.r99Ground[k])out.push(r.r99Ground[k]);if(r.r105Water?.material)out.push(r.r105Water.material);return out;}
 function waterFrame(lk){const w=wind,rn=clamp(cur[FI.rain],0,1);
  WU.r108Rain.value=clamp(rn+cur[FI.drip]*.7,0,1)*(lk.ripples?1:0);WU.r108Warp.value=.0036+.0045*Math.abs(w)+.002*rn;
  WU.r108Layer.value=.8+.5*Math.min(1,Math.abs(w)+rn*.4);WU.r108Gleam.value=(.55+.45*rn)*(lk.glints?1:0)*(reduced()?.5:1);
  WU.r108Flash.value=lk.flash?flashAmt:0;WU.r108Lite.value=lowFx()?1:0;
  const d=WU.r108Drift.value,c=WU.r108Cool.value;if(d)d.set(-.0065*(1+w*1.1),.0046*(1+Math.abs(w)*.4));
  const cool=env?.prof?.cool||0;if(c)c.set(1-.16*cool*(.4+rn),1-.08*cool*(.4+rn),1+.04*cool);}
 // Shore foam: a thin ring around the stage's low walls, just above the stage water plane (r105) so the floor hides everything inland.
 function foamFor(r,frame){const L=frame?.exploration;if(!active||!L||!env?.smg||!env.water||!prefs.water||!r.r105Water||!L.walls?.length){if(r.r108Foam)r.r108Foam.visible=false;return;}
  const key=L.id+':'+L.walls.length;if(r.r108Foam&&r.r108FoamKey===key){r.r108Foam.visible=true;return;}
  if(r.r108Foam){r.spatialRoot.remove(r.r108Foam);r.r108Foam.geometry.dispose();r.r108Foam=null;}
  const T=r.T,pos=[],col=[],idx=[],E=.62;let q=0;
  for(const w of L.walls){if(!Number.isFinite(w.x+w.y+w.width+w.depth))continue;const hw=w.width/2,hd=w.depth/2,x0=w.x-hw,x1=w.x+hw,y0=w.y-hd,y1=w.y+hd,
   inner=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]],outer=[[x0-E,y0-E],[x1+E,y0-E],[x1+E,y1+E],[x0-E,y1+E]];
   for(const p of inner){pos.push(p[0],-.06,p[1]);col.push(1,1,1,.62);}for(const p of outer){pos.push(p[0],-.06,p[1]);col.push(1,1,1,0);}
   for(let s=0;s<4;s++){const a=s,b=(s+1)%4;idx.push(q+a,q+b,q+4+b,q+a,q+4+b,q+4+a);}q+=8;}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('color',new T.Float32BufferAttribute(col,4));geo.setIndex(idx);
  const m=new T.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false,color:0xc8d4da,opacity:.9});m.name='r108-shore-foam';
  const mesh=new T.Mesh(geo,m);mesh.name='r108-shore-foam';mesh.renderOrder=-2;mesh.layers.set(2);mesh.frustumCulled=false;mesh.userData={presentationOnly:true,collisionChanged:false};
  r.spatialRoot.add(mesh);r.spatialResources?.add(m);r.r108Foam=mesh;r.r108FoamKey=key;stats.foamBuilds++;}
 function foamPulse(r){const f=r.r108Foam;if(!f||!f.visible)return;const s=waterClock;f.material.opacity=clamp(.62+.2*Math.sin(s*1.3)+.12*Math.sin(s*2.9+1.1)+cur[FI.rain]*.12,.35,.95);}
 // Carried light (R89 quad): flicker, storm tint, fire warmth, lightning lift. Applied when that quad is about to draw.
 function lightHook(r){const mesh=r.r89Light;if(!mesh||mesh.userData.r108Hook)return;mesh.userData.r108Hook=true;const prev=mesh.onBeforeRender;stats.lightHooks++;
  mesh.onBeforeRender=function(...a){try{shadeLight(mesh);}catch(e){fail(e);}return typeof prev==='function'?prev.apply(this,a):undefined;};}
 function shadeLight(mesh){if(!active||!prefs.mood||!env)return;const u=mesh.material.uniforms;if(!u?.inner||!u.edge)return;
  if(!mesh.userData.r108Tint)mesh.userData.r108Tint=[u.tint.value.x,u.tint.value.y,u.tint.value.z];const t0=mesh.userData.r108Tint,lk=looks({lowFx:lowFx(),reduced:reduced()},prefs);
  const warm=env.prof.warm||0,cool=env.prof.cool||0,rain=clamp(cur[FI.rain],0,1),em=clamp(cur[FI.ember],0,1),tt=clock,
   fl=lk.flicker*(.011*Math.sin(tt*6.1)+.006*Math.sin(tt*14.9+1.7)+.004*Math.sin(tt*23.3)+(warm>0||em>0?.012*Math.sin(tt*9.7+.5)*Math.max(warm,em):0)),lift=lk.flash?flashAmt:0;
  u.inner.value=clamp(u.inner.value*(1+fl)+lift*.22,.1,.97);u.gain.value=clamp(u.gain.value*(1+fl*.5)+lift*.05,.5,1.2);u.edge.value=clamp(u.edge.value*(1-.05*rain)+lift*.4,.2,1);
  const c=cool*(.45+.55*rain);u.tint.value.set(clamp(t0[0]-.1*c,.4,1),clamp(t0[1]-.05*c,.4,1),clamp(t0[2]+.02*c,.4,1.1));
  if(u.warm&&(warm>0||em>0)){const k=clamp(Math.max(warm*.7,em*.5),0,.8);u.warm.value.set(u.warm.value.x,u.warm.value.y*(1-.1*k),u.warm.value.z*(1-.2*k));}
  stats.lightFrames=(stats.lightFrames||0)+1;}
 let lastR=null;
 function prepare3d(r,frame){if(!solo()||!r.spatialRoot||!r.T)return;lastR=r;
  if(!WU.r108Drift.value){WU.r108Drift.value=new r.T.Vector2(-.0065,.0046);WU.r108Cool.value=new r.T.Vector3(1,1,1);}
  if(prefs.water)for(const m of waterMaterials(r))patchWater(m);
  foamFor(r,frame);foamPulse(r);lightHook(r);}

 // ---- hooks -----------------------------------------------------------------------------------------------------------------------
 const drawBase=draw;
 draw=function(...args){let on=false;try{on=pre();}catch(e){fail(e);}
  try{return drawBase.apply(this,args);}
  finally{try{setOwn(on&&!env.prof.inherit);if(on)post();else if(shown){cv.style.display='none';shown=false;flashEl.style.display='none';}}catch(e){fail(e);}}};
 if(C?.render){const renderBase=C.render;C.render=function(frame){try{prepare3d(this,frame);}catch(e){fail(e);}return renderBase.call(this,frame);};}
 if(C?.clearScene){const clearBase=C.clearScene;C.clearScene=function(...a){try{if(this.r108Foam){this.r108Foam.geometry?.dispose?.();this.r108Foam=null;this.r108FoamKey=null;}}catch(_){}return clearBase.apply(this,a);};}

 // ---- settings section (the UI overhaul regroups it under 세부 조정) -----------------------------------------------------------------------------
 function settingsSection(){if(document.getElementById('retroSettingsR108Weather'))return;
  const host=document.getElementById('retroSettingsR100')||document.getElementById('retroSettingsR99Outdoor')||document.getElementById('retroSettingsR98World')||document.getElementById('panel');if(!host)return;
  const s=document.createElement('section');s.id='retroSettingsR108Weather';
  s.innerHTML='<h3>날씨 · 분위기 (R108)</h3><p class="small muted">비·폭풍·눈·우박, 안개와 물결 표현입니다. 서사가 말한 날씨만 나오며 전투 판정·이동·저장은 그대로입니다. 설정은 저장 슬롯과 별도로 보관됩니다.</p>'+
   '<label>날씨 효과 <select id="r108w-level"><option value="off">끔</option><option value="low">약하게</option><option value="normal">기본</option><option value="high">강하게</option></select></label> '+
   '<label>번개 섬광 <select id="r108w-flash"><option value="on">켬</option><option value="off">끔</option></select></label> '+
   '<label><input type="checkbox" id="r108w-thunder"> 천둥 소리</label> <label><input type="checkbox" id="r108w-water"> 물결·수면 반짝임·물가 거품</label> <label><input type="checkbox" id="r108w-mood"> 횃불 일렁임·안개 띠</label>'+
   '<p class="small muted">저사양 모드는 입자를 절반으로 줄이고, 움직임 줄이기는 번개 섬광과 큰 흔들림을 끕니다.</p>';
  if(host.id==='panel')host.appendChild(s);else host.parentNode.insertBefore(s,host.nextSibling);
  const q=id=>s.querySelector('#'+id),lv=q('r108w-level'),fl=q('r108w-flash');lv.value=prefs.level;fl.value=prefs.flash?'on':'off';
  q('r108w-thunder').checked=prefs.thunder;q('r108w-water').checked=prefs.water;q('r108w-mood').checked=prefs.mood;
  lv.onchange=()=>set({level:lv.value});fl.onchange=()=>set({flash:fl.value==='on'});
  for(const k of['thunder','water','mood']){const el=q('r108w-'+k);el.onchange=()=>set({[k]:el.checked});}}
 if(typeof showSettings==='function'){const sb=showSettings;showSettings=function(...a){const r=sb.apply(this,a);try{settingsSection();}catch(e){fail(e);}return r;};}
 function set(p={}){if(p.level!==undefined&&LEVELS[p.level]!==undefined)prefs.level=p.level;for(const k of['flash','thunder','water','mood'])if(typeof p[k]==='boolean')prefs[k]=p[k];save();budgetAt=-9;return{...prefs};}

 window.__STORYWORLD_WEATHER_R108__=Object.freeze({prefs:()=>({...prefs}),set,core:window.__STORYWORLD_WEATHER_R108_CORE__,
  ownsAmbience:()=>active&&!!env&&!env.prof.inherit,
  force(name,seconds=20){if(!name){forced=null;return null;}const v=ST[name];if(!v)return false;forced={v,until:clock+seconds};return name;},
  strike(kind='bolt',hold=0){strike(kind);holdUntil=clock+hold;return true;},
  profile:()=>env?{key:env.key,name:env.prof.name,open:env.open,water:env.water,fam:env.fam,smg:env.smg}:null,
  state:()=>{const o={};F.forEach((k,i)=>{o[k]=+cur[i].toFixed(3);});return o;},counts:()=>({...budget.n,total:budget.total}),renderer:()=>lastR,
  inspect:()=>({revision:'R108-weather-alt',prefs:{...prefs},active,key:env?.key||null,profile:env?.prof?.name||null,open:env?.open||false,water:env?.water||null,counts:{...budget.n,total:budget.total},
   flash:flashAmt,stats:{...stats},lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false})});
})();
