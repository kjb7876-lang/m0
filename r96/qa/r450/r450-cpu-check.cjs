// R450 CPU check: 지역별 날씨·입자 — 본편 63곳 실내·실외 표(정본·지역 이름 근거), 실내엔 비·눈 대신 먼지, 정본 날씨 문장, 빗줄기 양면.
const fs=require('fs'),path=require('path');const {R,C,wiring,box,load,runner}=require('../r451/r450-453-common.cjs');
const {ok,done}=runner('R450');
wiring(ok,'weather-r450.js');
const ctx=box();load(ctx,'weather-r450.js');const api=ctx.__STORYWORLD_WEATHER_R450__;
ok('api exposed',api&&api.revision.startsWith('R450')&&typeof api.placeOf==='function'&&typeof api.pick==='function');
// 본편 63곳(헤드리스 전수 조사 2026-11-09)이 모두 표에 있다 — R406 worldR74.mode 로 떨어지는 곳이 없게
const ZONES63=["cult01","cult02","cult03","cult04","cult05","cult06","dist00","dist01","dist02","dist03","dist04","dist05","dist06","dreamRest","ep1a08","ep1a09","ep1a09b","ep1a10","ep1a11","ep1b01","ep1b02","ep1b03","ep1b04","ep1b05","ep1b06b","ep1b07","ep1b08","ep1b09","hando01","hando02","hando03","hub","kair01","kair02","kair03","kair04","kair05","kair06","kair07","kair08","kair09","kair10","last301","last302","last303","last304","last305","murder01","murder02","murder03","murder04","restEp1b","restHando","restKairo","restLast3","restU2","u201","u202","u203","u204","u205","u206","village"];
const missing=ZONES63.filter(z=>!api.place[z]);ok('all 63 story zones classified in PLACE',missing.length===0,missing);
ok('every class is out / in / cave / void with a reason',Object.values(api.place).every(v=>['out','in','cave','void'].includes(v[0])&&String(v[1]).length>1));
const P=z=>api.placeOf({id:z,exploration:{}}).kind;
ok('hospital, kitchen, chapel, rest rooms are indoors',['ep1a08','ep1a09','ep1b04','ep1b01','dreamRest','restU2','restLast3','kair07'].every(z=>P(z)==='in'));
ok('garden, swamp, snow forest, storm coast are outdoors',['hub','dist00','dist02','ep1b06b','ep1b09','last301','last304'].every(z=>P(z)==='out'));
ok('spider cave = cave, memory gates = void',P('dist01')==='cave'&&P('u204')==='void'&&P('u203')==='void'&&P('kair08')==='void');
const K=z=>api.pick({id:z,exploration:{}});
ok('canon weather: blizzard forest, storm coast, drizzle field',K('ep1b06b').kind==='blizzard'&&K('last301').kind==='storm'&&K('last304').kind==='drizzle');
ok('indoors never rains or snows (dust instead)',ZONES63.filter(z=>P(z)==='in').every(z=>!['rain','drizzle','snow','blizzard','storm'].includes(K(z).kind)));
ok('burning hotel keeps falling ash indoors (canon: inside the fire)',K('ep1b07').kind==='ash');
ok('black workshop (indoor) gets no falling ash',K('kair07').kind!=='ash');
ok('hospital: dust under fluorescent light (canon line)',K('ep1a08').kind==='dust'&&/형광등/.test(K('ep1a08').why));
ok('void spaces get no precipitation',['u204','u203','kair08'].every(z=>!['rain','drizzle','snow','blizzard','storm','ash'].includes(K(z).kind)));
{const s=C('weather-r450.js');ok('rain streaks + splashes are double-sided (were culled)',(s.match(/side:T\.DoubleSide/g)||[]).length>=2);
 ok('storm spec (last301) has rain + wind + splashes',api.spec.storm&&api.spec.storm.precip==='rain'&&api.spec.storm.splash&&api.spec.storm.wind[0]>2);
 // 가볍게: 모든 개수가 미리 잡은 버퍼(한 번 그리기) 안, 모바일은 PC 의 절반 이하
 const B=api.budget||{},buf=v=>v.precip==='rain'?'streak':v.precip==='snow'||v.precip==='ash'?'flake':v.dust?'dust':null,half=c=>c.mobile<=c.pc*.5;
 ok('light: every count fits its one-draw buffer, mobile ≤ half of PC',Object.values(api.spec).every(v=>!v.count||B[buf(v)]>0&&v.count.pc<=B[buf(v)]&&half(v.count))&&
  Object.values(api.spec).every(v=>(!v.splash||v.splash.pc<=B.splash&&half(v.splash))&&(!v.gust||v.gust.count.pc<=B.gust&&half(v.gust.count))),B);}
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('node r96/qa/r450/r450-cpu-check.cjs'));
done();
