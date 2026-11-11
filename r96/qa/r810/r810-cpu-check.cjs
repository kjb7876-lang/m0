// R810 CPU check — 불면귀 구역(last302 잠들지 못하는 마을 · last303 한약과 불면귀)을 홍보 영상에 쓸 밤 장면으로.
//  남색 달빛 바탕빛·진한 호박색 등불(R451), 세피아 빼기(R123), 거미 모양 균열 빼기·막돌 골목(R204), 남색·먹빛 안개(R450),
//  길잡이 길에 걸려 숨겨지던 석등 자리 건너뛰기(R730). 다른 지역은 그대로(회귀).
//  R810_ROOT=<다른 r96 폴더> 로 옛 파일에 돌려 실패를 확인할 수 있다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=process.env.R810_ROOT||path.join(__dirname,'..','..'),rd=f=>{try{return fs.readFileSync(path.join(R,f),'utf8');}catch(_){return'';}};
let bad=0,n=0;const ok=(m,c,i)=>{n++;if(!c){bad++;console.log('FAIL',m,i===undefined?'':JSON.stringify(i).slice(0,300));}else console.log('ok  ',m);};
const grab=(src,name)=>{const m=src.match(new RegExp('const '+name+'=(Object\\.freeze\\()?(\\{[^;]*?\\})\\)?;'));if(!m)return null;try{return vm.runInNewContext('('+m[2]+')',{Object});}catch(e){return null;}};
const files=['local-light-r451.js','dark-r123.js','cave-r204.js','weather-r450.js','rooms-r523.js','trail-r482.js'];
ok('runtime-text copies match client-source',files.every(f=>rd('client-source/'+f)&&rd('client-source/'+f)===rd('runtime-text/'+f)));
ok('CI runs this check',/node r96\/qa\/r810\/r810-cpu-check\.cjs/.test(rd('../.github/workflows/pages.yml')));
// ① R451 바탕빛·등불
const LL=rd('client-source/local-light-r451.js'),N=grab(LL,'NIGHT_R810');
ok('R451: night table for exactly the two Bulmyeongwi zones',!!N&&Object.keys(N).sort().join()==='last302,last303',N&&Object.keys(N));
for(const z of ['last302','last303']){const a=N?.[z];
 ok(z+': moonlight ambient is navy (blue > red×1.3) and darker than coast .8',!!a&&a.c[2]>a.c[0]*1.3&&a.k<=.7&&a.k>=.55,a);
 ok(z+': lamps are deep amber (red > blue×3) and stronger',!!a&&a.lampC[0]>a.lampC[2]*3&&a.lampK>1&&a.lampK<=1.5,a);
 ok(z+': lamp reach shrunk to pools (radius × < 1) — a full-reach chain washed the whole lane beige',!!a&&a.lampR>.4&&a.lampR<1,a);
 ok(z+': hero light turns moonlit (blue ≥ red)',!!a&&Array.isArray(a.heroC)&&a.heroC[2]>=a.heroC[0],a);
 ok(z+': night grade is a mild cool multiply (each ≤ 1, red ≥ .85, red < blue)',!!a&&Array.isArray(a.grade)&&a.grade.every(v=>v<=1)&&a.grade[0]>=.85&&a.grade[0]<a.grade[2],a);}
ok('R451: night grade quad is hidden whenever R451 does not own the frame or the zone has no grade',/if\(!want\)\{o451\.owned=false;u\.r451On\.value=0;nightGrade\(r,null,false\);return;\}/.test(LL)&&/bake\(o451,r,room,lights\)\)\{o451\.owned=false;u\.r451On\.value=0;nightGrade\(r,null,false\);return;\}/.test(LL)&&/const want=on&&!!a\?\.grade;/.test(LL));
ok('R451: grade quad never writes depth, is skipped by the R451 patcher, drawn last',/name='r810-night-grade';q\.renderOrder=1e6/.test(LL)&&/depthTest:false,depthWrite:false/.test(LL)&&/userData=\{presentationOnly:true,r451:true\}/.test(LL));
ok('R451: ambientFor takes the zone id and the per-frame call passes room.id',/function ambientFor\(fam,kind,id\)/.test(LL)&&/ambientFor\(fam,lightCache\?\.place\|\|'out',room\?\.id\)/.test(LL));
ok('R451: indoor/cave places keep their own ambient (night only outside)',/if\(N&&kind!=='in'&&kind!=='cave'\)return N;/.test(LL));
// ①b R482 길 띠: R451 빛을 안 받는 재질 → 밤 구역에서만 밤 바탕빛을 곱해 바닥보다 밝게 뜨지 않게
const TR=rd('client-source/trail-r482.js');
ok('R451 exposes night(id) for other overlays',/night:id=>nightOf\(id\)/.test(LL));
ok('R482: trail tint = R451 night ambient (k×c) in the night zones only, undefined elsewhere',/const nightTint=z=>\{try\{const N=window\.__STORYWORLD_LOCAL_LIGHT_R451__\?\.night\?\.\(z\);return N&&Array\.isArray\(N\.c\)&&Number\.isFinite\(N\.k\)\?N\.c\.map\(v=>v\*N\.k\):undefined;/.test(TR)&&/tint:nightTint\(st\.zone\)/.test(TR));
if(N){for(const z of ['last302','last303']){const a=N[z],t=[.36,.34,.31].map((v,i)=>v*a.c[i]*a.k);ok(z+': night trail colour is darker than the plain trail and bluish',t.every((v,i)=>v<[.36,.34,.31][i])&&t[2]>t[0],t);}}
// ② R123 색 보정
const DK=rd('client-source/dark-r123.js'),DN=grab(DK,'NIGHT_R810');
ok('R123: night filters only for the two zones, no sepia / red hue shift',!!DN&&Object.keys(DN).sort().join()==='last302,last303'&&Object.values(DN).every(v=>!/sepia|hue-rotate/.test(v)),DN);
ok('R123: tone off still means no filter; other zones keep the tone filter',/function filter\(\)\{const T=tone\(\);if\(!T\)return'';return nightR810\(\)\|\|T\.filter;\}/.test(DK)&&/sepia\(\.1\) hue-rotate\(-8deg\)/.test(DK));
ok('R123: night filter is STORY layer only',/room\.layer==='STORY'/.test(DK));
// ③ R204 지형
const CV=rd('client-source/cave-r204.js'),zl=id=>{const i=CV.indexOf(' '+id+':{seed:');return i<0?'':CV.slice(i,CV.indexOf('\n '+(id==='last302'?'// 한약':'// 눈보라'),i));};
for(const z of ['last302','last303']){const t=zl(z),dm=t.match(/decalMix:(\{near:\[[^}]*\})/);let mix=null;try{mix=dm&&vm.runInNewContext('('+dm[1]+')');}catch(_){}
 const ks=mix?[...mix.near,...mix.open].map(q=>q[0]):[];
 ok(z+': no spider-shaped crack decal (0)',ks.length>0&&!ks.includes(0),ks);
 ok(z+': no golden desert sand floor',t.length>0&&!/sandgold/.test(t));}
ok('R204: other zones keep the crack decal (dist00 · hub)',/ dist00:\{decalMix:\{near:\[\[2,3\],\[11,3\],\[5,2\],\[6,2\]\],open:\[\[0,2\]/.test(CV)&&/ hub:\{decalMix:\{near:\[\[5,3\],\[6,3\],\[2,1\],\[11,2\]\],open:\[\[0,2\]/.test(CV));
ok('R204: decalKinds() exposed for the browser check',/decalKinds:id=>/.test(CV));
// ④ R450 안개 색
const WX=rd('client-source/weather-r450.js'),FG=(()=>{const m=WX.match(/const NIGHT_FOG_R810=Object\.freeze\((\{[^;]*\})\);/);try{return m&&vm.runInNewContext('('+m[1]+')');}catch(_){return null;}})();
ok('R450: night fog colour only for the two zones, cool and dark (blue ≥ red, all ≤ .55)',!!FG&&Object.keys(FG).sort().join()==='last302,last303'&&Object.values(FG).every(c=>c[2]>=c[0]&&Math.max(...c)<=.55),FG);
ok('R450: fog amount (k) is kept, only colour changes; dream layer untouched',/out\.fog=\{k:out\.fog\?\.k\?\?1,color:NIGHT_FOG_R810\[r\.id\]\}/.test(WX)&&/!samong&&/.test(WX));
// ⑤ R730 석등이 길잡이 길에 걸려 숨겨지지 않음
const RS=rd('client-source/rooms-r523.js');function boot(){const ctx={localStorage:{getItem:()=>null,setItem:()=>{}},console,Math,JSON,Number,String,Object,Array,Set,Map,WeakMap,Promise,Date,setInterval:()=>0,clearInterval:()=>{}};ctx.window=ctx;vm.createContext(ctx);try{vm.runInContext(RS,ctx);}catch(e){}return ctx.__STORYWORLD_VILLAGE_R730__;}
const api=boot();let FX=null;try{FX=JSON.parse(rd('qa/r730/fixtures/last303.json'));}catch(_){}
ok('R730 api + fixture',!!api&&!!FX);
if(api&&FX){const base=api.plan(FX);
 // R169 와 같은 규칙의 길: 석등 자리마다 그 칸을 지나는 길을 만든다(모든 석등이 걸리게) → 그 자리는 피해야 한다
 const lamps0=base.filter(p=>p.kind==='lamp'),pathSet=new Set();for(const l of lamps0)pathSet.add(Math.floor(l.x)+','+Math.floor(l.y));
 const fx2={...FX,path:[...pathSet]},P=api.plan(fx2),hid=q=>{const cx=Math.floor(q.x),cy=Math.floor(q.y);for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)if(pathSet.has((cx+dx)+','+(cy+dy))&&Math.hypot(cx+dx+.5-q.x,cy+dy+.5-q.y)<1.15)return true;return false;};
 const lamps=P.filter(p=>p.kind==='lamp');
 ok('R730: no lamp/tree/censer/giwa where the guide path would hide it',P.filter(p=>p.kind!=='house').every(p=>!hid(p)),P.filter(p=>p.kind!=='house'&&hid(p)).slice(0,4));
 ok('R730: lamps still placed elsewhere (≥ 6)',lamps.length>=6,lamps.length);
 ok('R730: houses unchanged by the path rule',JSON.stringify(P.filter(p=>p.kind==='house'))===JSON.stringify(base.filter(p=>p.kind==='house')));
 ok('R730: no path given → same plan as before (fixtures/other callers)',JSON.stringify(api.plan(JSON.parse(JSON.stringify(FX))))===JSON.stringify(base));
 ok('R730: apply passes the full R169 path',/path:pathOf\(r\)/.test(RS)&&/function pathOf\(r\)/.test(RS));}
// ⑥ R810 마을 소품(CX-0071BV 대체본) — 자산 표·크기·배치
{let ix=null;try{ix=JSON.parse(rd('runtime-text/assets/r810/index.json'));}catch(_){}
 const want=['lantern-post','talisman-rope-r','talisman-rope-l','shoes-stone','jangdok','fish-rack','boat'];
 ok('R810 assets: index lists the 7 props with source, sha256, size, use, applied, not final',!!ix&&want.every(k=>ix.assets.some(a=>a.path==='assets/r810/'+k+'.webp'&&/cx0071bv-el-cleaned/.test(a.source)&&/^[0-9a-f]{64}$/.test(a.sha256)&&a.applied===true&&a.final===false)));
 const crypto=require('crypto');ok('R810 assets: files exist, match the recorded sha256, each ≤ 64 KB',!!ix&&ix.assets.every(a=>{const p=path.join(R,'runtime-text',a.path);if(!fs.existsSync(p))return false;const b=fs.readFileSync(p);return b.length<=65536&&crypto.createHash('sha256').update(b).digest('hex')===a.sha256;}));
 ok('R810 assets: in the runtime manifest (sync-r99 run with the new paths)',want.every(k=>rd('runtime-manifest.json').includes('assets/r810/'+k+'.webp')));
 if(api){for(const id of ['last302','last303']){let fx=null;try{fx=JSON.parse(rd('qa/r730/fixtures/'+id+'.json'));}catch(_){}if(!fx)continue;const P=api.plan(fx),k=t=>P.filter(p=>p.kind===t);
  ok(id+': red talisman ropes on lane edges, art matches the edge axis',k('rope').length>=2&&k('rope').every(p=>p.path===(p.side==='-y'?'assets/r810/talisman-rope-r.webp':'assets/r810/talisman-rope-l.webp')),k('rope').length);
  ok(id+': lantern posts alternate with stone lanterns',k('post').length>=3&&k('lamp').length>=3,[k('post').length,k('lamp').length]);
  ok(id+': doorstone shoes in front of houses (canon: all facing out)',k('shoes').length>=2);
  ok(id+': harbour boats and fish racks only in the port village',id==='last302'?k('boat').length>=1&&k('rack').length>=1:k('boat').length===0&&k('rack').length===0,[k('boat').length,k('rack').length]);}}}
// ⑦ Dots CX-0071BV 집 16(L자 r2·일자 r1) — 집 종류에 더함, 기존 집과 같은 폭
{let ix=null;try{ix=JSON.parse(rd('runtime-text/assets/r810/index.json'));}catch(_){}
 const hs=['tiled-house-b-l','tiled-house-b-i'];
 ok('R810 Dots houses: index lists both with Dots source, sha256, applied',!!ix&&hs.every(k=>ix.assets.some(a=>a.path==='assets/r810/'+k+'.webp'&&/cx0071bv-dots-cleaned\/CX-0071BV_16_/.test(a.source)&&/^[0-9a-f]{64}$/.test(a.sha256)&&a.applied===true)));
 ok('R810 Dots houses: in the runtime manifest',hs.every(k=>rd('runtime-manifest.json').includes('assets/r810/'+k+'.webp')));
 const H=(()=>{const m=RS.match(/const HOUSE=Object\.freeze\((\[[\s\S]*?\])\);/);try{return m&&vm.runInNewContext('('+m[1].replace(/Object\.freeze/g,'')+')');}catch(_){return null;}})();
 const w=h=>h.height*h.aspect,base=H&&H.find(h=>/r80-010/.test(h.path));
 ok('R730 HOUSE: both Dots houses added, old houses kept',!!H&&hs.every(k=>H.some(h=>h.path==='assets/r810/'+k+'.webp'))&&H.filter(h=>/r80-010/.test(h.path)).length===2&&H.some(h=>/waterside-house/.test(h.path)),H&&H.map(h=>h.path));
 ok('R730 HOUSE: Dots houses drawn about as wide as the old tiled house (±12%)',!!H&&!!base&&H.filter(h=>/tiled-house-b/.test(h.path)).every(h=>Math.abs(w(h)/w(base)-1)<=.12),H&&H.map(w));
 if(api){for(const id of ['last302','last303']){let fx=null;try{fx=JSON.parse(rd('qa/r730/fixtures/'+id+'.json'));}catch(_){}if(!fx)continue;const P=api.plan(fx).filter(p=>p.kind==='house');
  ok(id+': at least one Dots house in the village',P.some(p=>/tiled-house-b/.test(p.path)),P.map(p=>p.path.split('/').pop()));}}}
console.log('\nR810 '+(n-bad)+'/'+n+' passed');process.exit(bad?1:0);
