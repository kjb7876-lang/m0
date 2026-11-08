// R414 CPU check: 드라이브 건물 후보를 야외 꿈 지역의 뒤쪽 바닥 끝 너머에 영웅 2배 이상 키로 세우기 + 소품 4종(R406 행) + R299 건축물 키.
//  사용자 2026-11-08 "구글드라이브자산 적절히 크기조절해서 배치 특히 건물자산의 경우 최소영웅2배높이이상".
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const F='drive-buildings-r414.js',src=C(F);
for(const f of[F,'props-place-r406.js','env-props-r299.js'])ok(f+' runtime copy matches',RT(f)===C(f));
const html=RT('index.html');
ok('loaded once, right after doors-fit-r413.js and before access-r420.js / combat-r118.js',html.split('"./'+F+'"').length===2&&/<script src="\.\/doors-fit-r413\.js"><\/script><script src="\.\/drive-buildings-r414\.js"><\/script><script src="\.\/access-r420\.js"><\/script>/.test(html)&&html.indexOf(F)<html.indexOf('combat-r118.js'));
ok('listed in verify-r96-public.py',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r414/r414-cpu-check.cjs'));
const code=src.replace(/\/\/.*$/gm,'');
ok('presentation only: no collision, walls, floor or interaction changes',!/solid\s*:\s*true|interactive\s*:\s*true|explorationBlocked|floorCells\s*=|\.walls\.(push|splice)|floorCells\.(push|splice)/.test(code));
ok('game ctx: no blur/drop-shadow filter',!/filter\s*=\s*['"][^'"]*(blur|drop-shadow)/.test(code));

// ---- 자산 색인 ----
const IDX=JSON.parse(RT('assets/r414/buildings/index.json')),PIDX=JSON.parse(RT('assets/r414/props/index.json'));
global.window={};require(path.join(R,'client-source','samong-zones-r115-data.js'));const SZ=window.__STORYWORLD_SAMONG_ZONES_R115_DATA__;
const zones=new Map();for(const zs of Object.values(SZ.chapters))for(const z of zs)zones.set(z.id,z);
const B=Object.entries(IDX.buildings);
ok('23 buildings, every one at least 2x the hero (66 px -> >= 132 px)',B.length===23&&B.every(([,v])=>v.height>=132)&&IDX.hero?.drawnHeightPx===66,B.filter(([,v])=>!(v.height>=132)).map(([k])=>k));
ok('every building zone is an outdoor samong zone (z.outdoor)',B.every(([,v])=>zones.get(v.zone)?.outdoor),B.filter(([,v])=>!zones.get(v.zone)?.outdoor).map(([k,v])=>k+':'+v.zone));
ok('at most two buildings per zone',[...B.reduce((m,[,v])=>m.set(v.zone,(m.get(v.zone)||0)+1),new Map()).values()].every(n=>n<=2));
function webpSize(buf){// VP8X / VP8L / VP8
 const t=buf.toString('ascii',12,16);if(t==='VP8X')return[1+buf.readUIntLE(24,3),1+buf.readUIntLE(27,3)];if(t==='VP8L'){const b=buf.readUInt32LE(21);return[1+(b&0x3fff),1+((b>>14)&0x3fff)];}if(t==='VP8 ')return[buf.readUInt16LE(26)&0x3fff,buf.readUInt16LE(28)&0x3fff];return null;}
const files=[...B.map(([,v])=>v),...Object.values(PIDX.props)];
const bad=files.filter(v=>{const p=path.join(R,'runtime-text',v.path);if(!fs.existsSync(p))return true;const b=fs.readFileSync(p);const s=webpSize(b);return crypto.createHash('sha256').update(b).digest('hex')!==v.sha256||b.length!==v.bytes||!s||s[0]!==v.size[0]||s[1]!==v.size[1]||Math.max(...s)>(v.path.includes('/buildings/')?600:384);});
ok('every derived file exists, matches its sha256/bytes/size and stays within 600 px (buildings) / 384 px (props)',!bad.length,bad.map(v=>v.path));
ok('provenance: Dots id, PNG sha256 checked against MANIFEST, status and canon lines kept',files.every(v=>v.dotsId&&/^[0-9a-f]{64}$/.test(v.pngSHA256)&&v.manifestChecked===true&&v.dotsStatus&&Array.isArray(v.canonLines)));
ok('held candidates carry a reason (19)',Object.keys(IDX.held).length===19&&Object.values(IDX.held).every(h=>h.reason&&h.reason.length>6));
const raw=RT('assets/r414/buildings/index.json')+RT('assets/r414/props/index.json');
const ids=(raw.replace(/[0-9a-f]{64}/g,'').match(/[A-Za-z0-9_-]{24,}/g)||[]).filter(t=>/[0-9]/.test(t)&&/[a-z]/.test(t)&&/[A-Z]/.test(t)&&!/^[A-Za-z0-9]+(-[a-z0-9]+)+$/.test(t));
ok('no Drive file ids or URLs in the public index (Dots slugs like R02-gray-school-building-shell are fine)',!/drive\.google|docs\.google/.test(raw)&&!ids.length,ids);
const P=Object.entries(PIDX.props);
ok('3 props in the R406 row format (zone/mode/axis/height/path)',P.length===3&&P.every(([,v])=>zones.has(v.zone)&&['wall','inner'].includes(v.mode)&&v.height>0&&/^assets\/r414\/props\/[a-z0-9-]+\.webp$/.test(v.path)));
ok('prop file names avoid the door/gate/wall words other overlays snap to walls',[...P,...B].every(([,v])=>!/(^|[\W_])(gate|door|wall)s?([\W_]|$)/i.test(v.path.split('/').pop().replace('.webp',''))));
ok('R406 also reads the R414 prop index',/IDXS=\[IDX,'\.\/assets\/r408\/props\/index\.json','\.\/assets\/r414\/props\/index\.json'\]/.test(C('props-place-r406.js')));
const r299=C('env-props-r299.js');const big=k=>+(r299.match(new RegExp('\\b'+k+':\\{h:(\\d+)'))||[])[1];
ok('R299 architecture (cathedral arch, obelisk) is at least 2x the hero',big('arch')>=132&&big('obelisk')>=132,{arch:big('arch'),obelisk:big('obelisk')});

// ---- 샌드박스: 자리 계산 ----
function load(o={}){const sb={localStorage:{getItem:()=>o.pref||null,setItem(){}},Math,JSON,Object,Number,String,Array,Map,WeakMap,Set,Error,setInterval:()=>0,clearInterval(){},fetch:async()=>({ok:true,json:async()=>IDX}),
  draw:function(){return 'drawn';},started:true,loading:false,addImage(){sb.added=(sb.added||0)+1;}};
 sb.window=sb;sb.room=o.room||null;vm.createContext(sb);vm.runInContext(src,sb);return sb;}
const sb=load(),X=sb.__STORYWORLD_DRIVE_BUILDINGS_R414__;
ok('exposes plan/apply/inspect, hero 66 px, minimum 132 px',X&&typeof X.plan==='function'&&X.HERO_PX===66&&X.MIN_PX===132);
// 원판 마당(반지름 12, 중심 24,24) + 위아래 길 — yard 틀과 같은 모양
const disc=[];for(let y=0;y<60;y++)for(let x=0;x<60;x++){const inDisc=Math.hypot(x+.5-24.5,y+.5-24.5)<=12.5,path=x>=22&&x<=26&&((y>=36&&y<46)||(y>=4&&y<13));if(inDisc||path)disc.push([x,y]);}
const key=(x,y)=>x+','+y,FS=new Set(disc.map(([x,y])=>key(x,y)));
function clearOf(spot,W,cells){const c=spot.x+spot.y,s0=spot.x-spot.y,D=W/68;let worst=1e9;for(const[x,y]of cells){if(x-y+1<s0-D||x-y-1>s0+D)continue;worst=Math.min(worst,x+y-c);}return worst;}
const rows=[{name:'tower',zone:'z',height:300,aspect:133/600},{name:'hall',zone:'z',height:190,aspect:600/351}];
const route=[];for(let y=4;y<46;y++)route.push({x:24.5,y:y+.5});
const s1=X.plan(disc,rows,route),s2=X.plan(disc,rows,route);
ok('plan is deterministic',JSON.stringify(s1)===JSON.stringify(s2));
ok('both buildings found a spot behind the back edge',s1.length===2&&s1.every(s=>!s.none&&(s.side==='-x'||s.side==='-y')),s1);
ok('feet stand off the floor',s1.every(s=>!FS.has(key(Math.floor(s.x),Math.floor(s.y)))),s1);
const cl=s1.map((s,i)=>clearOf(s,rows[i].height*rows[i].aspect,disc));
ok('every floor cell under a building on screen is at least 1.5 in front of its plane (hero/enemies never hidden)',cl.every(v=>v>=1.5-1e-9),cl);
ok('the two buildings do not overlap on screen',Math.abs(s1[0].s0-s1[1].s0)>=s1[0].D+s1[1].D+.8-1e-9,s1.map(s=>[s.s0,s.D]));
ok('buildings stand close to the edge, not far out in the void (back <= 8)',s1.every(s=>s.back<=8));
// 거리(가로로 긴 길) — -y 끝 너머에 선다
const street=[];for(let y=22;y<28;y++)for(let x=4;x<70;x++)street.push([x,y]);
const s3=X.plan(street,[{name:'shop',zone:'z',height:170,aspect:520/600}],[{x:30,y:25}]);
ok('street: building stands behind the -y side of the street',s3[0]&&!s3[0].none&&s3[0].side==='-y'&&s3[0].y<22&&clearOf(s3[0],170*520/600,street)>=1.5-1e-9,s3);
// 빈 땅이 없는 곳(바닥이 지도 끝 0 까지) — 큰 건물은 자리 없음
const tight=[];for(let y=0;y<10;y++)for(let x=0;x<10;x++)tight.push([x,y]);
const s4=X.plan(tight,[{name:'big',zone:'z',height:300,aspect:1.6}],[]);
ok('no spot when there is no void behind the edge (nothing forced onto the floor)',s4[0]&&s4[0].none===true,s4);

// ---- 샌드박스: 방에 붙이기 ----
const z='sz115-S04-1',zrows=B.filter(([,v])=>v.zone===z);
function roomFor(mode,cells=disc){return{id:'ep1b08',layer:'DREAM',props:[{id:'tree',x:2,y:2,height:170,path:'assets/r99/outdoor/tree-dead-00.webp'}],exploration:{floorCells:cells,samongR115:{zone:z},worldR74:{mode,doors:[]},entry:{x:24.5,y:44}},objective:{x:24.5,y:5}};}
const r1=roomFor('outdoor'),sb1=load({room:r1});
async function run(){
 const X1=sb1.__STORYWORLD_DRIVE_BUILDINGS_R414__;sb1.draw();await new Promise(r=>setTimeout(r,0));await new Promise(r=>setTimeout(r,0));sb1.draw();
 const added=r1.props.filter(p=>p.r414Building);
 ok('outdoor zone: both S04-1 buildings are added once the index is loaded',added.length===zrows.length&&zrows.length===2,X1.inspect());
 ok('added props are drawing-only (no solid, not interactive, no auto target) and skip R412 measuring/facing and R111 spacing',added.every(p=>p.solid===undefined&&p.interactive===false&&p.autoTargetEligible6===false&&p.r412Wall===1&&p.r412Face===1&&!p.r80PresentationOnly&&/^r414:sz115-S04-1:/.test(p.id)));
 ok('heights come from the index (>= 132) and images are requested',added.every(p=>p.height>=132)&&sb1.added===added.length);
 ok('a building behind the -x edge is mirrored so its front faces the play area',added.every(p=>(p.r414Side==='-x')===!!p.r303Flip));
 sb1.draw();sb1.draw();ok('idempotent: drawing again adds nothing',r1.props.filter(p=>p.r414Building).length===added.length);
 ok('draw wrapper returns the base draw result',sb1.draw()==='drawn');
 const r2=roomFor('indoor'),sb2=load({room:r2});sb2.draw();await new Promise(r=>setTimeout(r,0));await new Promise(r=>setTimeout(r,0));sb2.draw();
 ok('indoor-mode zone (roof caps cover the void): nothing is added',!r2.props.some(p=>p.r414Building)&&sb2.__STORYWORLD_DRIVE_BUILDINGS_R414__.inspect().stats.notOutdoor===1);
 const r3=roomFor('outdoor');r3.exploration.samongR115.zone='sz115-P-1';const sb3=load({room:r3});sb3.draw();await new Promise(r=>setTimeout(r,0));await new Promise(r=>setTimeout(r,0));sb3.draw();
 ok('zones without a building row are left alone',!r3.props.some(p=>p.r414Building));
 const r4=roomFor('outdoor'),sb4=load({room:r4,pref:'{"on":false}'});sb4.draw();await new Promise(r=>setTimeout(r,0));await new Promise(r=>setTimeout(r,0));sb4.draw();
 ok('off switch storyworld.r414.buildings {"on":false} adds nothing',!r4.props.some(p=>p.r414Building));
 {const X=sb1.__STORYWORLD_DRIVE_BUILDINGS_R414__;sb1.room=r1;const ph={id:'r123:z:lift',r123Deco:{kind:'lift'}},art={id:'r123:z:t',r123Deco:{kind:'teacup'},path:'assets/r126/props/teacup.webp'};
  ok('in a room with R414 buildings, R123 code-drawn placeholders (no art path) keep their main look (not drawn); R123 art props are untouched',X.hidePlaceholder(ph)===true&&X.hidePlaceholder(art)===false&&X.hidePlaceholder({id:'tree'})===false);
  sb4.room=r4;ok('rooms without R414 buildings leave R123 placeholders alone',sb4.__STORYWORLD_DRIVE_BUILDINGS_R414__.hidePlaceholder(ph)===false);}
 const fails=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass||c.detail===undefined?'':' :: '+JSON.stringify(c.detail).slice(0,400)));
 console.log('R414 CPU '+(checks.length-fails.length)+'/'+checks.length);if(fails.length)process.exit(1);}
run().catch(e=>{console.error(e);process.exit(1);});
