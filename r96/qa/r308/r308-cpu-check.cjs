// R308 CPU 검사 — 맵당 클래식 1곡: 모든 맵에 곡 1개, 맵 안 이벤트(쪽지·창·전투·보스 페이즈)에서 곡 변경·재시작 0,
// 같은 곡 맵 이동 시 위치 유지, 곡 끝 이음매 없는 반복, 라이선스 필드.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(R,p),'utf8');
let n=0;const ok=(name,c)=>{if(!c)throw new Error('FAIL: '+name);n++;console.log('ok -',name);};
const src=read('client-source/bgm-map-r308.js'),IX=JSON.parse(read('runtime-text/assets/r308/bgm/index.json'));
// 1. 라이선스·자산
const okLic=/^(Public domain|CC0|CC BY [0-9.]+)$/;
for(const[id,t]of Object.entries(IX.tracks)){
 ok(id+' license '+t.license,okLic.test(t.license)&&!/NC|ND/.test(t.license)&&/^https:\/\//.test(t.licenseUrl||'')&&/^https:\/\//.test(t.source||'')&&(t.licenseEvidence||'').length>40);
 ok(id+' composer/performer/title',!!(t.title&&t.composer&&t.performer));
 ok(id+' original sha256',/^[0-9a-f]{64}$/.test(t.originalSha256||''));
 const f=path.join(R,'runtime-text',t.path),b=fs.readFileSync(f);
 ok(id+' file bytes+sha256',b.length===t.bytes&&crypto.createHash('sha256').update(b).digest('hex')===t.sha256);
 if(t.origin==='R308')ok(id+' ogg 2~6분',/\.ogg$/.test(t.path)&&t.durationSec>=120&&t.durationSec<=360.5);}
const newBytes=Object.values(IX.tracks).filter(t=>t.origin==='R308').reduce((a,t)=>a+t.bytes,0);
ok('new audio total <= 40MB ('+newBytes+')',newBytes<=40e6);
// 2. 모든 맵에 곡 정확히 1개
const camp=(()=>{const h=read('runtime-text/index.html');const m=/window\.__STORYWORLD_CAMPAIGN_DATA_R54__=(\{.*?\});?\n/.exec(h);return JSON.parse(m[1]);})();
const sandbox={window:{},console};vm.createContext(sandbox);vm.runInContext(read('client-source/samong-zones-r115-data.js'),sandbox);
const chapters=JSON.parse(JSON.stringify(sandbox.window.__STORYWORLD_SAMONG_ZONES_R115_DATA__.chapters));
const s02=[...read('client-source/samong-zones-r115.js').matchAll(/id:'(sz115-S02-\d+)',title:'[^']*',kind:'([a-z]+)'/g)].map(m=>({id:m[1],kind:m[2]}));
ok('S-02 pilot zones found',s02.length===8);chapters['S-02']=s02;
for(const k of Object.keys(chapters))chapters[k]=[...chapters[k],{id:'sz162-'+k+'-D',kind:'combat'},{id:'sz173-'+k+'-G',kind:'combat'}];
// 오버레이 실행(브라우저 흉내)
function boot(){const audios=[];class Audio{constructor(){this.currentTime=0;this.duration=NaN;this.paused=true;this.volume=0;this.readyState=0;this.ls={};this._src='';audios.push(this);}
  set src(v){this._src=v;this.currentTime=0;this.readyState=4;this.duration=200;this.loads=(this.loads||0)+1;}get src(){return this._src;}
  play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}addEventListener(e,f){(this.ls[e]=this.ls[e]||[]).push(f);}}
 const c={console,Audio,performance:{now:()=>c.__t},__t:0,Date:{now:()=>c.__t},localStorage:{getItem:()=>null,setItem(){}},document:{hidden:false,addEventListener(){},getElementById:()=>null},
  fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(JSON.stringify(IX)))}),addEventListener(){},toast(){},globalThis:{}};
 c.window=c;vm.createContext(c);
 vm.runInContext(`var started=true,loading=false,modal=null,voiceElement=null,zone='hub',room={engaged:false,enemies:[]},settings={music:true,bgm:.8},nativeCalls=0,nativeLoud=0;
  function musicTick(){nativeCalls++;if(settings.music)nativeLoud++;}`,c);
 c.window.__STORYWORLD_SAMONG_ZONES_R115__={chapters};
 vm.runInContext(src,c,{filename:'bgm-map-r308.js'});return{c,audios};}
(async()=>{
 const {c,audios}=boot();await new Promise(r=>setTimeout(r,10));const api=c.window.__STORYWORLD_BGM_MAP_R308__;
 const env={chapters};const allMaps=[...camp.portalOrder,...Object.values(chapters).flat().map(z=>z.id)];
 ok('index covers every campaign map explicitly',camp.portalOrder.every(z=>IX.maps[z]));
 const per={};for(const z of allMaps){const s=api.resolve(z,IX,env);assert(s&&IX.tracks[s.track],'no track for '+z);ok;per[z]=s;}
 ok('every map ('+allMaps.length+') resolves to exactly one existing track',allMaps.every(z=>typeof per[z].track==='string'&&IX.tracks[per[z].track]));
 ok('no samong map falls back',Object.values(chapters).flat().every(z=>per[z.id].episode.startsWith('samong:')));
 const eps={};for(const z of allMaps)(eps[per[z].episode]=eps[per[z].episode]||new Set()).add(per[z].track);
 ok('each episode uses 1~3 tracks',Object.values(eps).every(s=>s.size>=1&&s.size<=3));
 ok('all '+Object.keys(IX.tracks).length+' tracks used',Object.keys(IX.tracks).every(t=>allMaps.some(z=>per[z].track===t)));
 let adj=0;for(let i=1;i<IX.episodes.length;i++)if(IX.episodes[i].main===IX.episodes[i-1].main)adj++;ok('neighbouring main-story episodes have different main tracks',adj<=1);
 // 3. 재생: 맵 안 이벤트에서 곡 변경·재시작 0
 const T=ms=>{c.__t+=ms;};const tick=()=>{c.musicTick();T(100);};const run=k=>{for(let i=0;i<k;i++)tick();};
 const A=()=>api.inspect().active,loads=()=>audios.reduce((a,x)=>a+(x.loads||0),0);
 const go=z=>{vm.runInContext('zone='+JSON.stringify(z),c);run(40);};
 go('dist00');ok('plays map track',A()?.track===IX.maps.dist00.track&&!A().paused);ok('native/R195 chain kept silent',vm.runInContext('nativeLoud',c)===0&&vm.runInContext('nativeCalls',c)>0);
 const L0=loads(),S0=api.inspect().stats.mapSwitches,tr0=A().track;
 vm.runInContext("modal={kind:'note'}",c);run(30);vm.runInContext("modal={kind:'skill'}",c);run(30);vm.runInContext('modal=null;room.engaged=true;room.enemies=[{boss:true,hp:900,maxHp:1000}]',c);run(30);
 const v1=A().volume;vm.runInContext('room.enemies[0].hp=300',c);run(30);const v2=A().volume;vm.runInContext("voiceElement={paused:false}",c);run(20);vm.runInContext('voiceElement=null;room.enemies[0].hp=0;room.engaged=false;loading=true',c);run(20);vm.runInContext('loading=false',c);run(20);
 ok('in-map events: no track change, no reload ('+(loads()-L0)+')',A().track===tr0&&loads()===L0&&api.inspect().stats.mapSwitches===S0&&!A().paused);
 ok('boss phase only raises volume',v2>v1);
 // 4. 같은 곡 맵 이동 → 위치 유지
 go('dist01');const t1=A().time;A();const before=loads();
 const pos=audios.find(a=>!a.paused);pos.currentTime=77.5;go('dist02');
 ok('same-track map move keeps position (dist01→dist02)',A().track===IX.maps.dist02.track&&loads()===before&&Math.abs(A().time-77.5)<1e-6&&api.inspect().stats.continued>=2);
 // 5. 다른 곡 맵 이동 → 교차 페이드 1번
 const S1=api.inspect().stats.mapSwitches;go('dist06');ok('different-track map move switches once with crossfade',api.inspect().stats.mapSwitches===S1+1&&A().track===IX.maps.dist06.track);
 run(40);ok('crossfade finished, single deck audible',audios.filter(a=>!a.paused).length===1);
 // 6. 끝 이음매 없는 반복
 const live=audios.find(a=>!a.paused);live.currentTime=198;const Lp=api.inspect().stats.loops;tick();if(process.env.DBG)console.log(api.inspect(),audios.map(a=>[a.paused,a.currentTime,a.duration,a._src]));
 ok('near end → same track crossfades from start',api.inspect().stats.loops===Lp+1&&A().track===IX.maps.dist06.track&&audios.filter(a=>!a.paused).length===2);run(40);
 ok('loop done, still same track',audios.filter(a=>!a.paused).length===1&&A().track===IX.maps.dist06.track);
 // 7. 사몽 에피소드 안 이동
 const sa=chapters['S-01'].filter(z=>z.kind!=='confront');go(sa[0].id);const tS=A().track;audios.find(a=>!a.paused&&a._src===IX.tracks[tS].path).currentTime=33;go(sa[1].id);
 ok('samong same-episode move keeps track+position',A().track===tS&&Math.abs(A().time-33)<1e-6);
 // 8. 음소거 존중
 vm.runInContext('settings.music=false',c);run(5);ok('music off → paused',audios.every(a=>a.paused));vm.runInContext('settings.music=true',c);run(5);ok('music back on → same track resumes',A().track===tS&&!A().paused);
 // 9. 스크립트 태그
 const idx=read('runtime-text/index.html');ok('script tag right before mobile-perf-r298',idx.includes('<script src="./hud-bgm-hwando-w-r313.js"></script><script src="./maps-palace-slum-r317.js"></script><script src="./save-transition-r320.js"></script><script src="./boss-prop-control-r314.js"></script><script src="./bgm-map-r308.js"></script><script src="./mobile-perf-r298.js"></script>')&&idx.indexOf('bgm-classical-r195.js')<idx.indexOf('bgm-map-r308.js'));
 ok('built copy matches source',read('runtime-text/bgm-map-r308.js')===src);
 require('child_process').execFileSync(process.execPath,['--test',path.join(__dirname,'r308-review-regression.cjs'),path.join(__dirname,'r308-review-r2-regression.cjs')],{stdio:'inherit'});
 console.log('R308 CPU check passed:',n,'checks');
})().catch(e=>{console.error(e);process.exit(1);});
