// R264~R266 — ① 유기 지형 지역 문틀을 어두운 바위색(흰 테두리 없앰) ② BGM 끊김 없이(로딩·설정 창에도 이어 재생, 탐색↔전투는 12초 넘게 이어질 때만 곡 전환)
//  ③ 피로 물든 병원(ep1a08) 렉: 벽 묶음의 그리기 그룹 386 → 재질 수(2), 세계 패스 그리기 호출 433 → 49(헤드리스) ④ 몹·영웅이 조형물보다 늘 위(조형물을 배우보다 먼저 그림).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const P=C('perf-groups-r266.js'),D=C('world-doors-r83.js'),B=C('bgm-classical-r195.js');
ok('runtime copies match',RT('perf-groups-r266.js')===P&&RT('world-doors-r83.js')===D&&RT('bgm-classical-r195.js')===B);
const idx=RT('index.html');ok('perf-groups-r266 is the last overlay before combat-r118 (outermost drawProp wrapper)',/hit-center-r259\.js"><\/script><script src="\.\/perf-groups-r266\.js"><\/script>(<script src="\.\/drive-r281\.js"><\/script>)?(<script src="\.\/mob-fix-r275\.js"><\/script>)?(<script src="\.\/hwando-r283\.js"><\/script>)?(<script src="\.\/stranded-r280\.js"><\/script>)?(<script src="\.\/mobile-bonus-r286\.js"><\/script>)?(<script src="\.\/mob-motion-r286\.js"><\/script>)?(<script src="\.\/mob-art-r290\.js"><\/script>)?(<script src="\.\/light-atmos-r300\.js"><\/script>)?(<script src="\.\/env-props-r299\.js"><\/script>)?(<script src="\.\/props-fit-r303\.js"><\/script>)?(<script src="\.\/mob-art-variants-r306-data\.js"><\/script><script src="\.\/mob-art-variants-r306\.js"><\/script>(?:<script src="\.\/pixel-readable-r325\.js"><\/script>)?)?<script src="\.\/hud-bgm-hwando-w-r313\.js"><\/script><script src="\.\/maps-palace-slum-r317\.js"><\/script><script src="\.\/save-transition-r320\.js"><\/script><script src="\.\/bgm-map-r308\.js"><\/script>(<script src="\.\/mobile-perf-r298\.js"><\/script>)?(<script src="\.\/keys-r291\.js"><\/script>)?(<script src="\.\/render-lod-r287\.js"><\/script>)?(<script src="\.\/skill-fx-r292\.js"><\/script>)?(<script src="\.\/hero-palette-r302\.js"><\/script>)?(<script src="\.\/terrain-readability-r323\.js"><\/script>(?:<script src="\.\/prop-shadow-r329\.js"><\/script>)?(?:<script src="\.\/mob-foot-r332\.js"><\/script>)?(?:<script src="\.\/hud-bossbar-r334\.js"><\/script>)?(?:<script src="\.\/hero-facing-r336\.js"><\/script>)?(?:<script src="\.\/samong-gate-r338\.js"><\/script>)?(?:<script src="\.\/hud-menu-r339\.js"><\/script>)?(?:<script src="\.\/enemy-hexagram-r341\.js"><\/script>)?(?:<script src="\.\/bgm-pick-r353\.js"><\/script>)?)?\s*<script src="\.\/combat-r118\.js">/.test(idx));
// ③ 그룹 합치기(가짜 three)
{class BA{constructor(a,n){this.array=a;this.itemSize=n;}}
 const geo={attributes:{position:{count:12}},index:null,groups:[],setIndex(i){this.index=i;},clearGroups(){this.groups=[];},addGroup(s,c,m){this.groups.push({start:s,count:c,materialIndex:m});}};
 for(let i=0;i<8;i++)geo.groups.push({start:i*3,count:3,materialIndex:i%2});geo.attributes.position.count=24;
 const mesh={isMesh:true,geometry:geo,material:[{},{}]},opaque=mesh;const tm={isMesh:true,geometry:{attributes:{position:{count:24}},groups:[...Array(8)].map((_,i)=>({start:i*3,count:3,materialIndex:i%2}))},material:[{transparent:true},{}]};
 const ctx={localStorage:{getItem:()=>null,setItem(){}},console,Math,JSON,Array,Map,WeakSet,Set,Object,Number,Uint16Array,Uint32Array,setInterval:()=>0};ctx.window=ctx;
 ctx.__STORYWORLD_PHASE1__={controller:{state:{three:{T:{BufferAttribute:BA},spatialRoot:{traverse(f){f(opaque);f(tm);}}}}}};
 vm.createContext(ctx);vm.runInContext(P,ctx);ctx.__STORYWORLD_PERF_GROUPS_R266__.scan();
 const ix=[...geo.index.array];ok('8 interleaved groups of 2 materials become 2 groups; same triangles, grouped by material',geo.groups.length===2&&geo.groups[0].count===12&&ix.slice(0,12).join()==='0,1,2,6,7,8,12,13,14,18,19,20',{groups:geo.groups,ix});
 ok('meshes with a transparent material are left as they were',tm.geometry.groups.length===8&&!tm.geometry.index);}
// ④ 조형물 먼저(가짜 엔진)
{const log=[];const ctx={localStorage:{getItem:()=>null,setItem(){}},console,Math,JSON,Array,Map,WeakSet,Set,Object,Number,Uint16Array,Uint32Array,setInterval:()=>0};ctx.window=ctx;
 const props=[{id:'a',x:5,y:5},{id:'b',x:1,y:1}];ctx.room={props};
 ctx.drawObjective=()=>log.push('obj');ctx.drawProp=q=>log.push('P'+q.id);vm.createContext(ctx);vm.runInContext(P,ctx);
 // 엔진의 한 프레임: drawObjective → 깊이순(b, 영웅, a)
 ctx.drawObjective();ctx.drawProp(props[1]);log.push('H');ctx.drawProp(props[0]);
 ok('all props are drawn (once, depth order) before the actors; their own slots are skipped',log.join(',')==='obj,Pb,Pa,H',log);}
ok('door frame: organic (R204) zones paint jambs/header dark stone instead of the light ward wall / #687874; detail-only zones and the hospital keep theirs',/if\(darkFrame\(r\)\)\{/.test(D)&&/st&&st\.zone===r\.id&&!st\.decorOnly&&!st\.failed/.test(D)&&/hospital\(r,\{hospitalDoorFrameB3:1\}\)/.test(D));
ok('BGM keeps playing while a map loads (ducked to 50%) and while settings are open',/function want\(\)\{return !!\(G\('started',false\)&&settings\?\.music&&settings\.bgm>0&&!document\.hidden\);\}/.test(B)&&/G\('loading',false\)\?\.5:1/.test(B)&&/return false;\}/.test(B.match(/function menuOpen\(\)\{[^\n]*/)[0]));
ok('explore↔combat flips switch tracks only after 12 s in the same zone; zone changes and bosses switch at once',/HOLD_MS=12000/.test(B)&&/!sel\.kind\.startsWith\('boss'\)&&!String\(active\.kind\|\|''\)\.startsWith\('boss'\)&&zid===hold\.zone/.test(B));
for(const [n,s] of [['perf',P],['doors',D],['bgm',B]])try{new vm.Script(s);ok('syntax '+n,true);}catch(e){ok('syntax '+n,false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R266 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
