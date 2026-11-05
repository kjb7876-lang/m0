// R353 CPU 검사 — 설정의 배경음악 고르기(자동/고정/다음 곡, 저장) + 자동 배정 손질(바흐 토카타 줄이기·생상스 죽음의 무도 늘리기).
// R308(bgm-map) + R353 을 VM 에 가짜 Audio·localStorage 로 함께 돌려, 실제 재생 덱의 곡을 본다. 브라우저·실기기 아님.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(R,p),'utf8');
let n=0;const ok=(name,c)=>{if(!c)throw new Error('FAIL: '+name);n++;console.log('ok -',name);};
const src308=read('client-source/bgm-map-r308.js'),src=read('client-source/bgm-pick-r353.js'),IX=JSON.parse(read('runtime-text/assets/r308/bgm/index.json'));
const camp=(()=>{const h=read('runtime-text/index.html');const m=/window\.__STORYWORLD_CAMPAIGN_DATA_R54__=(\{.*?\});?\n/.exec(h);return JSON.parse(m[1]);})();
const sb={window:{},console};vm.createContext(sb);vm.runInContext(read('client-source/samong-zones-r115-data.js'),sb);
const chapters=JSON.parse(JSON.stringify(sb.window.__STORYWORLD_SAMONG_ZONES_R115_DATA__.chapters));
function boot(store){const audios=[];class Audio{constructor(){this.currentTime=0;this.duration=NaN;this.paused=true;this.volume=0;this.readyState=0;this.ls={};this._src='';audios.push(this);}
  set src(v){this._src=v;this.currentTime=0;this.readyState=4;this.duration=200;this.loads=(this.loads||0)+1;}get src(){return this._src;}
  play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}addEventListener(e,f){(this.ls[e]=this.ls[e]||[]).push(f);}}
 const c={console,Audio,performance:{now:()=>c.__t},__t:0,Date:{now:()=>c.__t},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  document:{hidden:false,addEventListener(){},getElementById:()=>null},setTimeout:()=>0,setInterval:()=>0,
  fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(JSON.stringify(IX)))}),addEventListener(){},toast(){},globalThis:{}};
 c.window=c;vm.createContext(c);
 vm.runInContext(`var started=true,loading=false,modal=null,voiceElement=null,zone='hub',room={engaged:false,enemies:[]},settings={music:true,bgm:.8},nativeLoud=0,opened=0;
  function musicTick(){if(settings.music)nativeLoud++;} function showSettings(){opened++;}`,c);
 c.window.__STORYWORLD_SAMONG_ZONES_R115__={chapters};
 vm.runInContext(src308,c,{filename:'bgm-map-r308.js'});vm.runInContext(src,c,{filename:'bgm-pick-r353.js'});
 const T=ms=>{c.__t+=ms;},tick=()=>{c.musicTick();T(100);},run=k=>{for(let i=0;i<k;i++)tick();};
 const go=z=>{vm.runInContext('zone='+JSON.stringify(z),c);run(40);};
 return{c,audios,run,go,map:c.window.__STORYWORLD_BGM_MAP_R308__,pick:c.window.__STORYWORLD_BGM_PICK_R353__,
  A:()=>c.window.__STORYWORLD_BGM_MAP_R308__.inspect().active,loads:()=>audios.reduce((a,x)=>a+(x.loads||0),0),audible:()=>audios.filter(a=>!a.paused)};}
(async()=>{
 // 1. 목록
 const store=new Map();const b=boot(store);await new Promise(r=>setTimeout(r,10));const P=b.pick;
 const ids=P.TRACKS.map(t=>t[0]);
 ok('track list = R308 index tracks ('+ids.length+')',ids.length===Object.keys(IX.tracks).length&&new Set(ids).size===ids.length&&ids.every(id=>IX.tracks[id]));
 ok('every entry has Korean title and composer',P.TRACKS.every(([,t,c])=>/[가-힣]/.test(t)&&/^[가-힣]+$/.test(c)));
 ok('UI strings Korean (자동·고정·다음 곡·배경음악)',/자동 · 지역에 맞춰/.test(src)&&/고정 · 한 곡만/.test(src)&&/다음 곡/.test(src)&&/<h3>배경음악<\/h3>/.test(src));
 ok('Korean label for toast',P.label('danse-macabre')==='생상스 · 죽음의 무도 Op.40'&&/__STORYWORLD_BGM_PICK_R353__\?\.label/.test(src308));
 ok('default mode auto',P.inspect().prefs.mode==='auto');
 // 2. 자동 배정 손질: 모든 맵을 R308 resolve → R353 choose 로
 const env={chapters};const all=[...camp.portalOrder,...Object.values(chapters).flat().map(z=>z.id)];
 const per={},before={};for(const z of all){const s=b.map.resolve(z,IX,env);before[z]=s.track;per[z]=P.choose(s,IX,null).track;}
 const early=camp.portalOrder.slice(0,camp.portalOrder.indexOf('ep1b09')+1);
 ok('Bach toccata gone from the first half (hub~ep1b09)',early.every(z=>per[z]!=='toccata'));
 ok('dist00~dist05 now Danse macabre',['dist00','dist01','dist02','dist03','dist04','dist05'].every(z=>per[z]==='danse-macabre'));
 const toc=all.filter(z=>per[z]==='toccata'),toc0=all.filter(z=>before[z]==='toccata');
 ok('toccata only on 1~2 later maps ('+toc.join(',')+'; before '+toc0.join(',')+')',toc.length>=1&&toc.length<=2&&toc.every(z=>camp.portalOrder.indexOf(z)>camp.portalOrder.length/2));
 const dm=all.filter(z=>/^danse-macabre/.test(per[z])).length,dm0=all.filter(z=>/^danse-macabre/.test(before[z])).length;
 ok('Danse macabre (both recordings) plays on more maps ('+dm0+' → '+dm+')',dm>=dm0+6);
 ok('every map still resolves to an existing track',all.every(z=>IX.tracks[per[z]]));
 const eps={};for(const z of camp.portalOrder){const e=b.map.resolve(z,IX,env).episode;(eps[e]=eps[e]||new Set()).add(per[z]);}
 ok('each main-story episode still uses 1~3 tracks',Object.values(eps).every(s=>s.size>=1&&s.size<=3));
 // 3. 자동 재생: 손질된 곡을 실제로 튼다
 b.go('dist00');ok('auto: dist00 plays Danse macabre',b.A()?.track==='danse-macabre'&&!b.A().paused);
 ok('native/R195 chain stays silent',vm.runInContext('nativeLoud',b.c)===0);
 // 4. 고정: 맵을 옮겨도 같은 곡, 다시 읽지 않고 이어서
 P.set('fixed','moonlight');b.run(40);ok('fixed: switches to Moonlight in the same map',b.A().track==='moonlight'&&b.audible().length===1);
 const L=b.loads();b.audible()[0].currentTime=55;
 for(const z of ['dist06','ep1a11','kair03','cult04','sz115-S01-5'])b.go(z);
 ok('fixed survives map changes incl. boss/climax/samong (no reload, position kept)',b.A().track==='moonlight'&&b.loads()===L&&Math.abs(b.A().time-55)<1e-6);
 vm.runInContext('room.engaged=true;room.enemies=[{boss:true,hp:100,maxHp:1000}]',b.c);b.run(30);ok('boss phase keeps fixed track',b.A().track==='moonlight');
 vm.runInContext('room.engaged=false;room.enemies=[]',b.c);
 const saved=()=>JSON.parse(store.get('storyworld.r353.bgm'));
 ok('fixed choice saved to localStorage',saved().mode==='fixed'&&saved().track==='moonlight');
 // 5. 음악 끄기 존중
 vm.runInContext('settings.music=false',b.c);b.run(5);ok('music off → silent',b.audible().length===0);
 vm.runInContext('settings.music=true',b.c);b.run(5);ok('music on → fixed track resumes',b.A().track==='moonlight'&&!b.A().paused);
 // 6. 다음 곡(고정)
 P.next();b.run(40);const nx=ids[(ids.indexOf('moonlight')+1)%ids.length];
 ok('next (fixed) → next list track, saved ('+nx+')',b.A().track===nx&&P.inspect().prefs.track===nx&&saved().track===nx&&b.audible().length===1);
 // 7. 다시 불러오기: 저장된 고정 곡이 새 세션에서도
 const b2=boot(store);await new Promise(r=>setTimeout(r,10));b2.go('dist00');
 ok('reload: persisted fixed track plays on boot',b2.A()?.track===nx&&b2.pick.inspect().prefs.mode==='fixed');
 // 8. 자동으로 되돌리기 + 자동에서 다음 곡은 지금 맵만
 b2.pick.set('auto');b2.run(40);ok('back to auto → map track',b2.A().track==='danse-macabre');
 b2.pick.next();b2.run(40);const sk=ids[(ids.indexOf('danse-macabre')+2)%ids.length];ok('next skips the other recording of the same piece',ids[ids.indexOf('danse-macabre')+1]==='danse-macabre-1925'&&sk!=='toccata');
 ok('next (auto) → plays next track in this map only ('+sk+')',b2.A().track===sk&&b2.pick.inspect().prefs.mode==='auto');
 b2.go('ep1a08');ok('leaving the map → auto again',b2.A().track===IX.maps.ep1a08.track&&!b2.pick.inspect().skip);
 b2.go('dist01');ok('skip does not stick to the old map',b2.A().track==='danse-macabre');
 // 9. 바르지 않은 저장 값이면 자동
 const b3=boot(new Map([['storyworld.r353.bgm','{"mode":"fixed","track":"nope"}']]));ok('invalid saved track → auto',b3.pick.inspect().prefs.mode==='auto');
 // 10. 연결
 const idx=read('runtime-text/index.html');
 ok('script tag right after enemy-hexagram-r341, once',idx.split('"./bgm-pick-r353.js"').length===2&&idx.includes('<script src="./enemy-hexagram-r341.js"></script><script src="./bgm-pick-r353.js"></script>'));
 ok('built copies match source',read('runtime-text/bgm-pick-r353.js')===src&&read('runtime-text/bgm-map-r308.js')===src308);
 ok('R308 hook present',/__STORYWORLD_BGM_PICK_R353__/.test(src308)&&/visit\.pkey!==pkey/.test(src308));
 ok('registered in verify-r96-public.py and pages.yml',read('../scripts/verify-r96-public.py').includes("'bgm-pick-r353.js'")&&read('../.github/workflows/pages.yml').includes('r96/qa/r353/bgm-pick-cpu-check.cjs'));
 ok('no new audio assets referenced',!/\.(mp3|ogg|wav)['"]/.test(src));
 console.log(JSON.stringify({ok:true,checks:n,toccata:toc,toccataBefore:toc0,danseMacabreMaps:[dm0,dm],method:'VM fakes (Audio/localStorage); no browser, no device'}));
})().catch(e=>{console.error(e);process.exit(1);});
