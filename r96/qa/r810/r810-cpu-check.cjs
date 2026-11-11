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
// ⑧ 등불 웅덩이 색 지키기: 채널마다 따로 누르는 어깨 곡선이 등불 밑 빨강만 눌러(2.0→1.41, 파랑 .97 그대로) 호박색이 회색으로 바래던 것 → 밤 두 지역만 밝기(최댓값)로 한 번에 눌러 색 비율 유지
{const KNEE=.92,SH=.58,sh=v=>v<=KNEE?v:KNEE+SH*(1-Math.exp(-(v-KNEE)/SH)),hueSh=L=>{const m=Math.max(...L);return m<=KNEE?L.slice():L.map(v=>v*sh(m)/m);};
 ok('R451: hue-keeping shoulder uniform r451Hue in the shader (0 = old per-channel curve)',/uniform float r451Hue;/.test(LL)&&/L=mix\(Ls,Lh,r451Hue\);/.test(LL)&&/r451Hue:\{value:0\}/.test(LL));
 ok('R451: r451Hue set per frame from the night table only',/u\.r451Hue\.value=a\.hue\?1:0;/.test(LL));
 ok('R451: CPU lightAt uses the same curve (props / mobs match the floor)',/const shoulderHue=/.test(LL)&&/a\.hue\?shoulderHue\(/.test(LL));
 if(N)for(const z of ['last302','last303']){const a=N[z];ok(z+': night table turns hue-keeping on',a.hue===1,a.hue);
  const L=[0,1,2].map(i=>a.c[i]*a.k+a.lampC[i]*1.0*1.12*a.lampK),old=L.map(sh),neu=hueSh(L),g=a.grade;
  const rb=v=>v[0]*g[0]/(v[2]*g[2]);
  ok(z+': lamp-centre amber survives the curve and the grade (red/blue ≥ 1.6, was '+rb(old).toFixed(2)+')',rb(neu)>=1.6,rb(neu).toFixed(2));
  const amb=[0,1,2].map(i=>a.c[i]*a.k);ok(z+': moonlit ground below the knee is unchanged by the new curve',JSON.stringify(hueSh(amb))===JSON.stringify(amb.map(sh)));}}
// ⑨ 등불 발밑 호박빛 웅덩이: R451 조명맵은 어깨 곡선 상한(×1.5)이라 어두운 바닥에선 등불 밑도 r≈.17 에 머문다(헤드리스 실측 따뜻한 색 화소 1.7% 중 중앙값 r .17)
//    → 밤 두 지역만 R300 의 더하기 빛 웅덩이를 R451 이 맡아도 켠다(등불 소품만, 등불 색, 작은 반지름). 다른 지역은 그대로 꺼짐.
{const AT=rd('client-source/light-atmos-r300.js');
 ok('R300: night pools read the R451 night table for the current story room',/const night=\(\(\)=>\{try\{return !samong&&window\.__STORYWORLD_LOCAL_LIGHT_R451__\?\.night\?\.\(room\.id\)\|\|null;\}catch\(_\)\{return null;\}\}\)\(\),np=!!night&&night\.pools>0;/.test(AT));
 ok('R300: old gate untouched (pools yield to R451 elsewhere); night pools are a separate branch after it',/if\(want\('pools'\)&&!sight&&!r451\)/.test(AT)&&/if\(!n&&np&&want\('pools'\)\)/.test(AT));
 ok('R300: night pools only under lamp props (no wall-torch spots), lamp colour, night gain/radius',/nearest\(lightsOf\(room\)\.filter\(l=>l\.prop\)/.test(AT)&&/const warm=night\.lampC;/.test(AT)&&/rad=\(l\.r\|\|3\)\*2\*night\.poolR,k=night\.pools\*fl;/.test(AT));
 ok('R300: dim pass stays off under R451 (night pools only)',/const dimOn=want\('pools'\)&&!samong&&!sight&&!r451;/.test(AT));
 if(N)for(const z of ['last302','last303']){const a=N[z];ok(z+': night pool gain .2–.45 and radius scale ≤ .7 (pool, not a wash)',a.pools>=.2&&a.pools<=.45&&a.poolR>0&&a.poolR<=.7,[a.pools,a.poolR]);}}
// ⑩ 길 등롱: 길잡이 길 곁에 등불이 있어야 길 위 화면에 호박빛이 든다(헤드리스: 길 가운데서 가장 가까운 등 12칸)
if(api)for(const id of ['last302','last303']){let fx=null,pf=null;try{fx=JSON.parse(rd('qa/r730/fixtures/'+id+'.json'));pf=JSON.parse(rd('qa/r810/fixtures-'+id+'-path.json'));}catch(_){}
 ok(id+': R169 path fixture exists',!!fx&&!!pf&&pf.path.length>20,pf&&pf.path.length);if(!fx||!pf)continue;
 const PS=new Set(pf.path),P=api.plan({...fx,path:PS}),pp=P.filter(p=>p.kind==='pathpost'),cells=pf.path.map(k=>k.split(',').map(Number));
 const dPath=q=>Math.min(...cells.map(c=>Math.hypot(c[0]+.5-q.x,c[1]+.5-q.y)));
 ok(id+': at least 4 path lanterns along the guide path',pp.length>=4,pp.length);
 ok(id+': each path lantern 1.15–2.6 cells off the path (not hidden by R169, still beside it)',pp.every(q=>{const d=dPath(q);return d>=1.15&&d<=2.6;}),pp.map(q=>+dPath(q).toFixed(2)));
 ok(id+': path lanterns ≥ 7 cells apart',pp.every((a,i)=>pp.every((b,j)=>i===j||Math.hypot(a.x-b.x,a.y-b.y)>=7)));
 ok(id+': path lanterns use the lantern-post art on open floor',pp.every(q=>q.path==='assets/r810/lantern-post.webp'&&fx.floorCells.some(c=>c[0]===Math.floor(q.x)&&c[1]===Math.floor(q.y))));
 const med=a=>{const s=a.slice().sort((x,y)=>x-y);return s[s.length>>1];},sample=cells.filter((_,i)=>i%5===0),nearL=c=>Math.min(...P.filter(p=>/^(lamp|post|pathpost)$/.test(p.kind)).map(q=>Math.hypot(q.x-c[0]-.5,q.y-c[1]-.5)));
 ok(id+': median distance from a path cell to the nearest lantern ≤ 6 cells',med(sample.map(nearL))<=6,med(sample.map(nearL)).toFixed(1));
 ok(id+': total props with the path stays ≤ 88',P.length<=88,P.length);}
ok('R730 apply: path lanterns light up like posts (R115 lantern)',/s\.kind==='pathpost'\)q\.r115Prop='lantern'/.test(RS));
// ⑪ Dots CX-0071BV 2차: 기와집 16B·폐가 17A, last303(한약과 불면귀) 약방 집 11A·B + 약탕기 화로 13·약재 소반 14
{let ix=null;try{ix=JSON.parse(rd('runtime-text/assets/r810/index.json'));}catch(_){}
 const need={'tiled-house-b-r':'16_tiled-house-b_B','ruined-house':'17_ruined-house_A','yakbang-house-a':'11_yakbang-house_A','yakbang-house-b':'11_yakbang-house_B','decoction-brazier':'13_decoction-brazier','herb-trays':'14_herb-trays'};
 ok('R811 Dots assets: index lists 6 new files from the Dots folder with sha256, applied',!!ix&&Object.entries(need).every(([k,src])=>ix.assets.some(a=>a.path==='assets/r810/'+k+'.webp'&&a.source.includes('cx0071bv-dots-cleaned/CX-0071BV_'+src)&&/^[0-9a-f]{64}$/.test(a.sha256)&&a.applied===true)));
 ok('R811 Dots assets: in the runtime manifest, each ≤ 64 KB',!!ix&&Object.keys(need).every(k=>{const a=ix.assets.find(a=>a.path==='assets/r810/'+k+'.webp');return a&&a.bytes<=65536&&rd('runtime-manifest.json').includes(a.path);}));
 const H=(()=>{const m=RS.match(/const HOUSE=Object\.freeze\((\[[\s\S]*?\])\);/);try{return m&&vm.runInNewContext('('+m[1].replace(/Object\.freeze/g,'')+')');}catch(_){return null;}})(),base=H&&H.find(h=>/r80-010/.test(h.path)),w=h=>h.height*h.aspect;
 ok('R811 HOUSE: 16B and ruined 17A added to the shared list, same drawn width (±12%)',!!H&&['tiled-house-b-r','ruined-house'].every(k=>H.some(h=>h.path==='assets/r810/'+k+'.webp'&&Math.abs(w(h)/w(base)-1)<=.12)));
 ok('R811 HOUSE: yakbang houses are NOT in the shared list (last303 only)',!!H&&!H.some(h=>/yakbang/.test(h.path)));
 if(api)for(const id of ['last302','last303']){let fx=null,pf=null;try{fx=JSON.parse(rd('qa/r730/fixtures/'+id+'.json'));pf=JSON.parse(rd('qa/r810/fixtures-'+id+'-path.json'));}catch(_){}if(!fx)continue;
  const P=api.plan(fx),yak=P.filter(p=>p.kind==='house'&&/yakbang/.test(p.path)),fire=P.filter(p=>p.kind==='yakfire'),tray=P.filter(p=>p.kind==='trays');
  const ruin=P.filter(p=>p.kind==='house'&&/ruined/.test(p.path)).length;ok(id+': ruined houses only in last302, 1–3 of them',id==='last302'?ruin>=1&&ruin<=3:ruin===0,ruin);
  if(id==='last302'){ok('last302: no yakbang house, fire or trays',!yak.length&&!fire.length&&!tray.length);ok('last302: total still ≤ 80 without path',P.length<=80,P.length);}
  else{ok('last303: at least 2 yakbang houses',yak.length>=2,yak.length);
   ok('last303: every yakbang house has a decoction brazier and herb trays within 4 cells',yak.every(h=>fire.some(f=>Math.hypot(f.x-h.x,f.y-h.y)<=4)&&tray.some(t=>Math.hypot(t.x-h.x,t.y-h.y)<=4)),[yak.length,fire.length,tray.length]);
   ok('last303: brazier/trays sit on the house hill (lift = house lift)',fire.concat(tray).every(q=>yak.some(h=>q.lift===h.lift&&Math.hypot(q.x-h.x,q.y-h.y)<=4)));}
  if(pf)ok(id+': total with path ≤ 92',api.plan({...fx,path:new Set(pf.path)}).length<=92);}
 ok('R811 apply: brazier glows (R115 brazier light) and both sit on the hill like houses',/s\.kind==='yakfire'\)q\.r115Prop='brazier'/.test(RS)&&/const hill=s\.kind==='house'\|\|s\.kind==='shoes'\|\|s\.kind==='jang'\|\|s\.kind==='yakfire'\|\|s\.kind==='trays';/.test(RS));}
// ⑫ Dots CX-0071BV 3차(R812): 약초 걸이 15 r2(양 끝 기둥) — last303 길가, 붉은 부적 말뚝 04 — last303, 미역·조개 무더기 09 — last302 배 곁
{let ix=null;try{ix=JSON.parse(rd('runtime-text/assets/r810/index.json'));}catch(_){}
 const need={'herb-rack':'15_herb-bundles_r2','talisman-post':'04_talisman-post','seaweed-1':'09_seaweed-shells_1','seaweed-2':'09_seaweed-shells_2','seaweed-3':'09_seaweed-shells_3'};
 ok('R812 Dots assets: index lists 5 files from the Dots folder, ≤ 64 KB, in the manifest',!!ix&&Object.entries(need).every(([k,src])=>{const a=ix.assets.find(a=>a.path==='assets/r810/'+k+'.webp');return a&&a.source.includes('cx0071bv-dots-cleaned/CX-0071BV_'+src)&&a.bytes<=65536&&/^[0-9a-f]{64}$/.test(a.sha256)&&rd('runtime-manifest.json').includes(a.path);}));
 if(api)for(const id of ['last302','last303']){let fx=null;try{fx=JSON.parse(rd('qa/r730/fixtures/'+id+'.json'));}catch(_){}if(!fx)continue;const P=api.plan(fx),k=t=>P.filter(p=>p.kind===t);
  if(id==='last303'){ok('last303: 2+ herb racks and 2+ talisman posts, same kind ≥ 9 cells apart',k('herbrack').length>=2&&k('tpost').length>=2&&['herbrack','tpost'].every(t=>k(t).every((a,i)=>k(t).every((b,j)=>i===j||Math.hypot(a.x-b.x,a.y-b.y)>=9))),[k('herbrack').length,k('tpost').length]);
   ok('last303: no seaweed (inland herbal village)',k('seaweed').length===0);}
  else{ok('last302: seaweed piles beside the beached boats (each within 4 cells of a boat), 2+',k('seaweed').length>=2&&k('seaweed').every(q=>k('boat').some(b=>Math.hypot(b.x-q.x,b.y-q.y)<=4)),k('seaweed').length);
   ok('last302: seaweed uses all three Dots variants when 3+ piles',k('seaweed').length<3||new Set(k('seaweed').map(q=>q.path)).size===3);
   ok('last302: no herb racks / talisman posts here',!k('herbrack').length&&!k('tpost').length);}}}
console.log('\nR810 '+(n-bad)+'/'+n+' passed');process.exit(bad?1:0);
