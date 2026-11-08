// R412 CPU check: 조형물 정돈(벽 속 조형물 빼기·등불 솎기·벽 가구 방향) + R92 등불 수·간격 + R329 그림자 늘 뒤쪽.
//  사용자 2026-11-08 "조형물들 벽에 들어가지 않도록, 조형물 각도에 맞게 배치, 전등 등이 너무 남발되어 부산스럽지 않도록, 그림자는 조형물 앞이 아닌 뒷쪽에 - 모든 맵에 적용".
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=path.join(R,'runtime-text');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const F='props-tidy-r412.js',src=C(F);
for(const f of[F,'prop-shadow-r329.js','visual-r92.js'])ok(f+' runtime copy matches',fs.readFileSync(path.join(RT,f),'utf8')===C(f));
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
ok('loaded once, right after theme-fx-r430.js (after skill-sheets-r411.js), after props-place-r406.js and before combat-r118.js',html.split('"./'+F+'"').length===2&&/<script src="\.\/skill-sheets-r411\.js"><\/script><script src="\.\/theme-fx-r430\.js"><\/script><script src="\.\/props-tidy-r412\.js"><\/script>/.test(html)&&html.indexOf('props-place-r406.js')<html.indexOf(F)&&html.indexOf(F)<html.indexOf('combat-r118.js'));
ok('listed in verify-r96-public.py',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r412/r412-cpu-check.cjs'));
const code=src.replace(/\/\/.*$/gm,'');
ok('game ctx: no blur/drop-shadow filter, no shear transform',!/filter\s*=\s*['"][^'"]*(blur|drop-shadow)/.test(code)&&!/\.transform\(/.test(code));
ok('wraps only drawProp (hold/fade, R412-9) and makeRoom (early pass) once each; never replaces sprite/drawAssetFrame3/drawImage/readyImage',!/(^|[^.\w])(sprite|drawAssetFrame3|drawImage|readyImage)\s*=(?!=)/.test(code.replace(/g\.drawImage=function/,''))&&(code.match(/(^|[^.\w])drawProp\s*=(?!=)/g)||[]).length===1&&/drawProp=function\(p,\.\.\.a\)\{if\(!p\|\|measuring\|\|/.test(code)&&(code.match(/(^|[^.\w])makeRoom\s*=(?!=)/g)||[]).length===1);
ok('3D plane model matches phase1 worldPoint (camera-facing, leaning back 30 degrees)',/BACK=\.5\*Math\.SQRT1_2,RISE=Math\.sqrt\(3\)\/2/.test(src)&&/s\*SQ-BACK\*h,-s\*SQ-BACK\*h,RISE\*h/.test(src));
// ---- 샌드박스 ----
const store={};let blockedFn=()=>false,wallsFn=()=>[];
const sb={window:{StoryPhase1:{explorationBlocked:(L,x,y,r)=>blockedFn(x,y,r)},__STORYWORLD_PROPS_PLACE_R406__:{walls:(L,x,y)=>wallsFn(x,y),indoorOf:r=>!!r.indoor}},
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},setTimeout:()=>0,Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,Error,RegExp};
vm.createContext(sb);vm.runInContext(src,sb);const X=sb.window.__STORYWORLD_PROPS_TIDY_R412__;
ok('exports revision',X&&/^R412-/.test(X.revision));
ok('lamps: R406 bulb post, R92 lamp, R74 brazier/lantern, street lamp; not altars, shrines, doors or wall torches',
 X.isLamp({path:'assets/r406/lights/lantern-bulb-post.png'})&&X.isLamp({path:'assets/r92/lights/lights_hospital_03.png'})&&X.isLamp({r74Prop:'brazier'})&&X.isLamp({r74Prop:'lantern',path:'assets/r74/props.png'})&&X.isLamp({path:'assets/props/v290/broken_street_lamp.webp'})
 &&!X.isLamp({path:'assets/props/v290/blood_altar.webp'})&&!X.isLamp({path:'assets/props/v290/corrupted_shrine.webp'})&&!X.isLamp({id:'r74:x:door-1',path:'assets/r74/props.png'})&&!X.isLamp({id:'wall-torch-3',path:'assets/x/torch.webp'}));
ok('untouchable: solid, interactive, samong function objects, clues, named narrative props, chests, doors',
 ['solid','interactive','samongR103','r115Clue','name'].every(k=>X.untouchable({[k]:true,id:'x'}))&&X.untouchable({id:'r103chest:STORY:x'})&&X.untouchable({id:'r74:a:door-0'})&&!X.untouchable({id:'r74:dist03:scenery:4'}));
// 등불 솎기: 20x20 실내 방(바닥 400칸 → 최대 4개, 6.5칸 간격), 2칸 간격으로 6개 + 상호작용 등불 1개
{const props=[];for(let i=0;i<6;i++)props.push({id:'lamp'+i,x:3+i*2,y:10,path:'assets/r406/lights/lantern-bulb-post.png'});props.push({id:'save',x:4,y:4,path:'assets/r406/lights/lantern-bulb-post.png',interactive:true});
 const cells=[];for(let x=0;x<20;x++)for(let y=0;y<20;y++)cells.push([x,y]);const r={id:'room',indoor:true,exploration:{floorCells:cells,worldR74:{doors:[]}},props};
 wallsFn=()=>[{dx:0,dy:-1,side:'-y',d:3}];X.apply(r,{samples:()=>null});const left=r.props.filter(p=>/^lamp/.test(p.id));
 ok('lamp thinning keeps at most the area cap, 6.5 tiles apart, and stores what it removed',left.length>=1&&left.length<=4&&left.every((p,i)=>left.every((q,j)=>i===j||Math.hypot(p.x-q.x,p.y-q.y)>=6.5))&&r.r412Lamps.length===6-left.length,left.map(p=>p.id));
 ok('interactive (save) lamp is never removed',r.props.some(p=>p.id==='save'));}
// 벽 빼기: x<2 가 벽. 발 (2.3,6) 에서 뒤로 기운 점(-x 쪽 0.6칸까지)이 벽에 든다 → +x 로 옮겨야
{blockedFn=(x,y,r)=>x-(r||0)<2;wallsFn=()=>[{dx:-1,dy:0,side:'-x',d:.3}];
 const S=[];for(let h=0;h<=2;h+=.25)S.push([-.354*h,-.354*h,.866*h]);
 const deco={id:'r99:tree:t:0',x:2.3,y:6,path:'assets/r99/outdoor/tree-dead-01.webp'},solid={id:'r74:t:scenery:1',x:2.3,y:9,path:'assets/x/statue.webp',solid:true};
 const r={id:'t2',indoor:true,exploration:{floorCells:[],worldR74:{doors:[]}},props:[deco,solid]};const before=X.embedded(r.exploration,deco.x,deco.y,S)/S.length;
 X.apply(r,{samples:()=>S});const after=X.embedded(r.exploration,deco.x,deco.y,S)/S.length;
 ok('a decoration sunk into a wall is moved the least distance out of it (3D samples)',before>.3&&after<=.03&&deco.x>2.3&&deco.r412Moved&&deco.r412Moved.x===2.3,{before,after,x:deco.x});
 ok('solid props never move (collision stays with the drawing)',solid.x===2.3&&!solid.r412Moved);}
// 벽 가구 방향: -x 벽에 붙은 R80 서랍장은 뒤집고, -y 벽은 그대로. R140 이 한 번 더 뒤집을 소품은 반대로 맞춰 결과가 같게.
{blockedFn=()=>false;sb.window.__STORYWORLD_PROPS_VARIETY_R140__={inspect:()=>({prefs:{flip:true}}),free:()=>true,flipOf:p=>p.id==='r224:furn:z:2'||p.id==='r224:furn:z:3'};
 const a={id:'r224:furn:z:0',x:1,y:5,path:'assets/world-r80/r80-148.webp',r224Furniture:true},b={id:'r224:furn:z:1',x:5,y:1,path:'assets/world-r80/r80-148.webp',r224Furniture:true,r303Flip:true},
  c={id:'r224:furn:z:2',x:1,y:9,path:'assets/world-r80/r80-027.webp',r224Furniture:true,r303Flip:true},d={id:'r224:furn:z:3',x:9,y:1,path:'assets/world-r80/r80-024.webp',r224Furniture:true},
  chair={id:'r80:scene:z:4',x:1,y:13,path:'assets/world-r80/r80-145.webp',r80Dressing:true};
 const r={id:'t3',exploration:{floorCells:[],worldR74:{doors:[]}},props:[a,b,c,d,chair]};wallsFn=(x,y)=>x<2?[{dx:-1,dy:0,side:'-x',d:.7}]:[{dx:0,dy:-1,side:'-y',d:.7}];X.apply(r,{samples:()=>null});
 const net=p=>!!p.r303Flip!==X.r140Flips(p);
 ok('wall furniture ends up facing away from its back wall (-x wall mirrored, -y wall not), cancelling R140 variety flips',net(a)===true&&net(b)===false&&net(c)===true&&!c.r303Flip,{a:net(a),b:net(b),c:net(c)});
 // R412 심사: 소파 r80-024 는 정면이 +x(긴 변이 오른쪽 위로) — -y 벽에서 뒤집고(R140 뒤집기와 상쇄해 결과가 뒤집힘) -x 벽에서는 그대로
 ok('sofa r80-024 (painted facing +x) is mirrored on -y walls and kept on -x walls',net(d)===true&&!d.r303Flip,{d:net(d)});
 {const e={id:'r224:furn:z:5',x:1,y:17,path:'assets/world-r80/r80-024.webp',r224Furniture:true,r303Flip:true},r2={id:'t3b',exploration:{floorCells:[],worldR74:{doors:[]}},props:[e]};X.apply(r2,{samples:()=>null});
  ok('sofa on a -x wall keeps its painted facing (no mirror)',net(e)===false&&!e.r303Flip,{e:net(e)});}
 {sb.window.__STORYWORLD_ASSETS_R80_DATA__={assets:{'r80-024':{scale:1.08,width:512,height:339,frame:{pivot:[136.117,330.511]}}}};const f={id:'r224:furn:z:7',x:9,y:1,path:'assets/world-r80/r80-024.webp',r80Art:'r80-024',r224Furniture:true},r3={id:'t3c',exploration:{floorCells:[],worldR74:{doors:[]}},props:[f]};X.apply(r3,{samples:()=>null});
  const k=(.5-136.117/512)*1.08*(512/339)*66*2/68;delete sb.window.__STORYWORLD_ASSETS_R80_DATA__;
  ok('mirroring an off-centre-pivot R80 sprite shifts its foot along screen-x so the body stays in place (sofa no longer swings behind the TV stand)',f.r303Flip===true&&Math.abs(f.x-(9+k))<.01&&Math.abs(f.y-(1-k))<.01&&Math.abs(f.r412Pivot-k)<.01,{x:f.x,y:f.y,k});}
 ok('NATIVE_X lists only the +x-painted R80 pieces (sofa 024, fallen column 021)',X.NATIVE_X.test('assets/world-r80/r80-024.webp')&&X.NATIVE_X.test('assets/world-r80/r80-021.webp')&&!X.NATIVE_X.test('assets/world-r80/r80-148.webp')&&!X.NATIVE_X.test('assets/world-r80/r80-027.webp'));
 ok('free-standing chairs/tables/beds keep their variety flip',!chair.r303Flip);
 delete sb.window.__STORYWORLD_PROPS_VARIETY_R140__;}
// R111(벽 간격)이 켜져 있으면 소품은 숨은 r111To 자리에 그려진다 → 그 자리를 기준으로 재고, 옮길 때도 r111To 만 바꾼다(x·y 배치 자료 그대로)
{blockedFn=(x,y,r)=>x-(r||0)<2;wallsFn=()=>[];const S=[];for(let h=0;h<=2;h+=.25)S.push([-.354*h,-.354*h,.866*h]);sb.window.__STORYWORLD_PLAY_R111__={prefs:()=>({props:true})};
 const a={id:'r99:tree:e:0',x:1.6,y:6,path:'assets/r99/outdoor/tree-dead-04.webp'};Object.defineProperty(a,'r111To',{value:{x:2.3,y:6},configurable:true});
 const c={id:'r99:tree:e:1',x:2.3,y:12,path:'assets/r99/outdoor/tree-dead-06.webp'},r={id:'t8',indoor:true,exploration:{floorCells:[],worldR74:{doors:[]}},props:[a,c]};X.apply(r,{samples:()=>S});
 ok('with R111 on, a prop drawn at its R111 spot is measured there and moved by that hidden spot only (x/y data untouched)',a.x===1.6&&a.y===6&&a.r111To.x>2.3&&!Object.keys(a).includes('r111To')&&a.r412Moved&&a.r412Moved.x===2.3&&a.r412Moved.via==='r111To'&&X.embedded(r.exploration,a.r111To.x,a.r111To.y,S)/S.length<=.03,{to:a.r111To,m:a.r412Moved});
 ok('...and a prop R111 left alone gets a hidden draw spot too, never its x/y',c.x===2.3&&c.y===12&&!!c.r111To&&c.r111To.x>2.3&&!Object.keys(c).includes('r111To'),{c:c.r111To});
 // 뒤집힌(R303 r303Flip) 소품: R111 밀기 (0,.7)이 화면 거울로 (.7,0)에 그려진다 → 그 자리에서 재고, 옮길 때도 거울 반대로 r111To 를 맞춘다
 const m={id:'r99:tree:e:2',x:1.6,y:18,path:'assets/r99/outdoor/tree-dead-07.webp',r303Flip:true};Object.defineProperty(m,'r111To',{value:{x:1.6,y:18.7},configurable:true});
 const v0=X.footOf(m),r9={id:'t9',indoor:true,exploration:{floorCells:[],worldR74:{doors:[]}},props:[m]};X.apply(r9,{samples:()=>S});const v1=X.footOf(m);
 ok('mirrored props (R303/R140 flip about x/y) are seen where they are really drawn and moved there, r111To set mirror-wise',Math.abs(v0.x-2.3)<1e-9&&Math.abs(v0.y-18)<1e-9&&m.x===1.6&&m.y===18&&v1.x>2.3&&Math.abs(v1.y-18)<1e-6&&Math.abs(m.r111To.x-1.6)<1e-6&&m.r111To.y>18.7&&X.embedded(r9.exploration,v1.x,v1.y,S)/S.length<=.03,{v0,v1,to:m.r111To});
 ok('footOf follows the R111 draw spot only while R111 props are on',X.footOf(a)===a.r111To&&(sb.window.__STORYWORLD_PLAY_R111__={prefs:()=>({props:false})},X.footOf(a)===a));
 delete sb.window.__STORYWORLD_PLAY_R111__;}
ok('R99 swaying trees are measured as the union of all 12 sway frames (one frame alone lets branches swing back into the wall)',/const R99_FRAMES=12;/.test(src)&&/'assets\/r99\/outdoor\/tree-'\+kind\+'-'\+String\(i\)\.padStart\(2,'0'\)\+'\.webp'/.test(src)&&/m=swayUnion\(p,b,m\)/.test(src));
ok('a prop R266 already pre-drew this frame is drawn once more when measuring (otherwise it never gets measured)',/drawProp\(p\);if\(!rec\.length\)drawProp\(p\);/.test(src));
// 벽 밖 자리가 없을 만큼 깊이 든 장식은 숨긴다(R303 숨김 표시), 조금 든 것은 그대로
{sb.window.__STORYWORLD_PLAY_R111__=undefined;blockedFn=(x,y,r)=>!(x>=2&&x<=2.6&&y>=0&&y<=40);wallsFn=()=>[];const S=[];for(let h=0;h<=2;h+=.25)S.push([-.354*h,-.354*h,.866*h]);
 const deep={id:'r99:tree:h:0',x:2.3,y:6,path:'assets/r99/outdoor/tree-dead-09.webp'},r={id:'t10',indoor:true,exploration:{floorCells:[],worldR74:{doors:[]}},props:[deep]};const rep=X.apply(r,{samples:()=>S});
 ok('a decoration sunk deep in a wall with no free spot within 1.8 tiles is hidden with the R303 hide mark (not left clipped)',deep.r303Hide==='r412-wall'&&rep.hidden===1&&rep.stuck.length===1&&deep.x===2.3,{rep});}
// 작은 조각으로 나눠 처리(유휴 시간 4~10ms): 남은 일이 있으면 pending, 다 끝나면 0. 카메라 가까운 것부터.
{blockedFn=(x,y,r)=>x-(r||0)<2;wallsFn=()=>[];const S=[];for(let h=0;h<=2;h+=.25)S.push([-.354*h,-.354*h,.866*h]);
 const ps=[];for(let i=0;i<6;i++)ps.push({id:'r99:tree:b:'+i,x:2.3,y:3+i*3,path:'assets/r99/outdoor/tree-dead-01.webp'});sb.cam={x:2.3,y:18};
 const seen=[],slow=p=>{if(p&&!seen.includes(p.id))seen.push(p.id);const t=Date.now();while(Date.now()-t<3);return S;},r={id:'t5',indoor:true,exploration:{floorCells:[],worldR74:{doors:[]}},props:ps};
 const a=X.apply(r,{samples:slow,budget:4}),firstDone=ps.filter(p=>p.r412Wall).map(p=>p.id),firstPending=a.pending;let n=1,rep=a;while(rep&&rep.pending&&n<30){rep=X.apply(r,{samples:slow,budget:4});n++;}
 ok('works in small idle slices: a 4 ms slice leaves work pending and later slices finish every prop',firstPending>0&&firstDone.length<6&&rep&&!rep.pending&&ps.every(p=>p.r412Wall&&p.x>2.3)&&n>1,{firstDone,n});
 // 재기 시작 차례(느린 기계에서 첫 조각이 아무것도 못 끝내도 같다)
 ok('props nearest the camera are measured first (what the player sees settles first)',seen.join()===[5,4,3,2,1,0].map(i=>'r99:tree:b:'+i).join(),seen);delete sb.cam;
 // 그림이 아직 안 읽힌 조형물은 20초까지 기다린다(몇 번 보고 버리지 않는다)
 const q={id:'r99:tree:c:0',x:2.3,y:6,path:'assets/r99/outdoor/tree-dead-02.webp'},r2={id:'t6',indoor:true,exploration:{floorCells:[],worldR74:{doors:[]}},props:[q]};let w;for(let i=0;i<30;i++)w=X.apply(r2,{samples:()=>null});
 ok('unread pictures are waited for (up to 20 s), not dropped after a few polls',w&&w.waiting===1&&!w.pending&&!q.r412Wall&&q.r412Since>0,w);
 w=X.apply(r2,{samples:()=>S});ok('...and moved out of the wall once the picture is read',w.waiting===0&&q.x>2.3&&!!q.r412Moved,{x:q.x,w});
 // R92 바닥 등 기둥 곁(1칸)으로는 옮기지 않는다
 const t={id:'r99:tree:d:0',x:2.3,y:6,path:'assets/r99/outdoor/tree-dead-03.webp'},r3={id:'t7',indoor:true,exploration:{floorCells:[],worldR74:{doors:[]}},props:[t]};
 sb.window.__STORYWORLD_VISUAL_R92__={plan:()=>({lights:[{x:2.8,y:6}]})};sb.room=r3;X.apply(r3,{samples:()=>S,force:true});
 ok('a prop pulled out of a wall keeps 1 tile off R92 floor lamps',!!t.r412Moved&&Math.hypot(t.x-2.8,t.y-6)>=1&&X.embedded(r3.exploration,t.x,t.y,S)/S.length<=.03,{x:t.x,y:t.y});
 delete sb.room;delete sb.window.__STORYWORLD_VISUAL_R92__;}
// 실외: 바닥 밖은 탁 트인 땅·숲 가장자리 — 그곳 나무는 벽에 든 것이 아니다(옮기지도 숨기지도 않는다). 벽 상자(L.walls)에 든 것만 뺀다.
{blockedFn=(x,y,r)=>x-(r||0)<2;wallsFn=()=>[];const S=[];for(let h=0;h<=2;h+=.25)S.push([-.354*h,-.354*h,.866*h]);
 const edge={id:'r99:tree:o:0',x:1,y:6,path:'assets/r99/outdoor/tree-living-01.webp',r99Tree:{kind:'living'}},r={id:'o1',exploration:{floorCells:[],worldR74:{doors:[]},walls:[]},props:[edge]};const rep=X.apply(r,{samples:()=>S});
 ok('outdoors, a forest-edge tree standing in open ground beyond the floor is neither moved nor hidden',edge.x===1&&!edge.r412Moved&&!edge.r303Hide&&!edge.r111To&&rep.embedded===0,{rep,edge});
 const t={id:'r99:tree:o:1',x:2.3,y:6,path:'assets/r99/outdoor/tree-living-02.webp',r99Tree:{kind:'living'}},r2={id:'o2',exploration:{floorCells:[],worldR74:{doors:[]},walls:[{x:1,y:20,width:2,depth:40,height:2.45}]},props:[t]};X.apply(r2,{samples:()=>S});
 ok('outdoors, a tree whose picture runs into a wall box is moved out of it onto open floor',!!t.r412Moved&&t.x>2.3&&X.embedded(r2.exploration,t.x,t.y,S,Infinity,false)/S.length<=.03&&X.embedded(r2.exploration,2.3,6,S,Infinity,false)/S.length>.3,{x:t.x});
 const W=[];for(let h=0;h<=2;h+=.5)for(let s=-1.2;s<=1.2;s+=.4)W.push([s*.7071-.354*h,-s*.7071-.354*h,.866*h]);blockedFn=(x,y,r)=>y+(r||0)>4&&y-(r||0)<5||y-(r||0)<5;
 const v={id:'r99:tree:o:2',x:5,y:3.6,path:'assets/r99/outdoor/tree-living-03.webp',r99Tree:{kind:'living'}},r3={id:'o3',exploration:{floorCells:[],worldR74:{doors:[]},walls:[{x:5,y:4.5,width:10,depth:1,height:2.45}],bounds:[0,0,20,20]},props:[v]};const b0=X.embedded(r3.exploration,5,3.6,W,Infinity,false);X.apply(r3,{samples:()=>W});
 ok('outdoors, a tree beyond a wall whose crown reaches into it moves further out, not onto the floor through the wall',b0>0&&!!v.r412Moved&&v.y<4-.29&&X.embedded(r3.exploration,v.x,v.y,W,Infinity,false)<=Math.floor(.03*W.length),{b0,x:v.x,y:v.y});}
// 심사 반영(R412-6)
{// 실내 가구 충돌 상자(높이 .01)는 벽 덩어리가 아니다 — explorationBlocked 가 막아도 바닥 칸·높은 벽 상자만 본다
 blockedFn=()=>true;wallsFn=()=>[];const S=[];for(let h=0;h<=2;h+=.25)S.push([-.354*h,-.354*h,.866*h]);const cells=[];for(let x=0;x<12;x++)for(let y=0;y<12;y++)cells.push([x,y]);
 const p={id:'r80:scene:f:0',x:6,y:6,path:'assets/world-r80/r80-031.webp'},L={floorCells:cells,walls:[{x:5.8,y:5.8,width:1,depth:1,height:.01},{x:9.5,y:6,width:1,depth:4,height:2.85}],worldR74:{doors:[]}},r={id:'f1',indoor:true,exploration:L,props:[p]};const rep=X.apply(r,{samples:()=>S});
 ok('indoors, furniture collision boxes are not wall mass (a prop beside a desk is not "sunk"); off-floor cells and tall wall boxes are',rep.embedded===0&&!p.r412Moved&&X.solidAt(L,5.8,5.8,.5,true)===false&&X.solidAt(L,-.5,5,.5,true)===true&&X.solidAt(L,9.5,6,2.6,true)===true&&X.solidAt(L,9.5,6,2.9,true)===false,{rep});}
{// R169 길 띠 안에 있던 조형물을 길 쪽으로 더 끌어오지 않는다
 blockedFn=(x,y,r)=>x-(r||0)<2;wallsFn=()=>[];const S=[];for(let h=0;h<=2;h+=.25)S.push([-.354*h,-.354*h,.866*h]);const path=new Set();for(let y=0;y<30;y++)path.add('3,'+y);
 sb.window.__STORYWORLD_PLAY_R169__={pathCells:()=>path};const p={id:'r99:tree:p:0',x:2.3,y:6,path:'assets/r99/outdoor/tree-dead-05.webp'},r={id:'p1',indoor:true,exploration:{floorCells:[],worldR74:{doors:[]}},props:[p]};
 const d0=X.pathD(r,2.3,6);X.apply(r,{samples:()=>S});const d1=X.pathD(r,p.x,p.y);
 ok('a prop already inside the walking-route band is never pulled closer to the route (hidden instead when no spot is left)',d0<1.45&&!(p.r412Moved&&d1<d0-1e-9)&&(p.r412Moved||p.r303Hide==='r412-wall'),{d0,d1,x:p.x,hide:p.r303Hide});delete sb.window.__STORYWORLD_PLAY_R169__;}
{// 자기 붓으로 x·y 에 그리는 R299·R317 소품, R138 벽 걸이는 옮기지도 돌리지도 않고 발 자리도 x·y 다
 blockedFn=(x,y,r)=>x-(r||0)<2;wallsFn=()=>[{dx:-1,dy:0,side:'-x',d:.3}];const S=[];for(let h=0;h<=2;h+=.25)S.push([-.354*h,-.354*h,.866*h]);sb.window.__STORYWORLD_PLAY_R111__={prefs:()=>({props:true})};
 const a={id:'r299:x:0',x:2.3,y:6,path:'assets/r299/bed.webp',r299:true},b={id:'r317:x:1',x:2.3,y:9,path:'assets/world-r80/r80-148.webp',r317:true},c={id:'r138:x:2',x:2.3,y:12,path:'assets/r138/window.webp',r138Drive:true,r138Lift:40};
 Object.defineProperty(a,'r111To',{value:{x:2.6,y:6},configurable:true});const r={id:'own',indoor:true,exploration:{floorCells:[],worldR74:{doors:[]}},props:[a,b,c]};X.apply(r,{samples:()=>S});
 ok('own-painted R299/R317 props and R138 hung pictures are left alone (they ignore r111To), and their foot is x/y',[a,b,c].every(p=>p.x===2.3&&!p.r412Moved&&!p.r412Wall&&!p.r412Face&&!p.r303Flip)&&X.footOf(a)===a&&a.r111To.x===2.6,{a:a.r111To});delete sb.window.__STORYWORLD_PLAY_R111__;}
{// 한 조형물의 자리 찾기가 길면(budget×2 넘음) 다음 차례에 처음부터 다시 — 그동안 재기 표시·합계는 남기지 않는다(두 번까지 미룬다)
 const spin=ms=>{const t=Date.now();while(Date.now()-t<ms);};blockedFn=(x,y,r)=>{if(r===.3)spin(1);return x-(r||0)<2;};wallsFn=()=>[];const S=[];for(let h=0;h<=2;h+=.25)S.push([-.354*h,-.354*h,.866*h]);
 const p={id:'r99:tree:s:0',x:2.3,y:6,path:'assets/r99/outdoor/tree-dead-08.webp'},r={id:'slow',indoor:true,exploration:{floorCells:[],worldR74:{doors:[]}},props:[p]};const m0=X.inspect().stats.embedded;
 const a=X.apply(r,{samples:()=>S,budget:2}),cut1=p.r412Tries===1&&!p.r412Wall&&a.pending===1&&X.inspect().stats.embedded===m0;let n=1,rep=a;while(rep.pending&&n<6){rep=X.apply(r,{samples:()=>S,budget:2});n++;}
 ok('a long spot search is cut at twice the slice budget and redone from scratch next slice (at most twice), stats only once it completes',cut1&&!!p.r412Wall&&!!p.r412Moved&&p.r412Tries===2&&X.inspect().stats.embedded===m0+1&&n===3,{cut1,n,tries:p.r412Tries});}
{// 그림 기다리기는 방문마다 새로 센다(지난 방문의 오래된 시각으로 바로 버리지 않는다)
 blockedFn=(x,y,r)=>x-(r||0)<2;const q={id:'r99:tree:v:0',x:2.3,y:6,path:'assets/r99/outdoor/tree-dead-10.webp',r412Since:1,r412Visit:-1},r={id:'visit',indoor:true,exploration:{floorCells:[],worldR74:{doors:[]}},props:[q]};const w=X.apply(r,{samples:()=>null});
 ok('picture waiting restarts each visit (an old timestamp from a past visit does not drop the prop at once)',w.waiting===1&&!q.r412Wall&&q.r412Since>1&&q.r412Visit===0,{q});}
{// 그림이 읽혔는데 그리기 사슬이 안 그린 조형물(숨김·덮개)은 바로 끝내고, 그림이 아직 안 읽힌 것만 기다린다
 sb.readyImage=path=>path==='assets/x/hidden-ready.webp'?{ready:true}:null;const a={id:'r80:scene:u:0',x:5,y:5,path:'assets/x/hidden-ready.webp'},b={id:'r80:scene:u:1',x:7,y:5,path:'assets/x/not-loaded.webp'};
 const r={id:'unseen',indoor:true,exploration:{floorCells:[],worldR74:{doors:[]}},props:[a,b]},u0=X.inspect().stats.unseen;const w=X.apply(r);
 ok('a prop the draw chain chose not to draw (its picture already loaded) is finished at once; one whose picture is still loading is waited for',a.r412Wall===1&&!b.r412Wall&&w.waiting===1&&X.inspect().stats.unseen===u0+1,{w});delete sb.readyImage;}
// 미러 스위치 0.25초 캐시가 실제로 쓰인다(같은 이름의 옛 함수가 덮어쓰지 않는다)
{ok('only one r140Flips (the cached one) is declared',src.split('function r140Flips(').length===2&&/function r140Flips\(p,F=flipCtx\(\)\)/.test(src));
 let calls=0;sb.window.__STORYWORLD_PROPS_VARIETY_R140__={inspect:()=>(calls++,{prefs:{flip:true}}),free:()=>true,flipOf:()=>true};calls=0;X.apply({id:'fc',exploration:{floorCells:[],worldR74:{doors:[]}},props:[]});
 let all=true;for(let i=0;i<50;i++)all=X.r140Flips({id:'a'+i})&&all;ok('mirror switches are read once for many props (cached), not per prop',all&&calls===1,{calls});delete sb.window.__STORYWORLD_PROPS_VARIETY_R140__;X.apply({id:'fc2',exploration:{floorCells:[],worldR74:{doors:[]}},props:[]});}
// 그림 픽셀 → 3D 판 점: 가짜 캔버스로 실제 재기 경로(bodyOf → mask → samplesOf)를 끝까지 돌린다
{const MW=20,MH=28,full=new Uint8ClampedArray(MW*MH*4),left=new Uint8ClampedArray(MW*MH*4);for(let j=0;j<MH;j++)for(let i=0;i<MW;i++){full[(j*MW+i)*4+3]=255;if(i<MW/2)left[(j*MW+i)*4+3]=255;}
 const mk=()=>{const c={width:0,height:0,_img:null};const x2={_t:{a:1,b:0,c:0,d:1,e:0,f:0},filter:'none',globalAlpha:1,setTransform(a,b,c2,d,e,f){this._t={a,b,c:c2,d,e,f};},getTransform(){return {...this._t};},drawImage(img){c._img=img;},clearRect(){},getImageData(){return {data:c._img?c._img.alpha:new Uint8ClampedArray(MW*MH*4)};}};c.getContext=()=>x2;return c;};
 const sb2={window:{StoryPhase1:{explorationBlocked:()=>false}},document:{createElement:()=>mk()},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,TILE:32,zoom:1,cam:{x:0,y:0},ctx:{},IMG:{naturalWidth:MW,naturalHeight:MH,alpha:full},IMG2:{naturalWidth:MW,naturalHeight:MH,alpha:left}};
 vm.createContext(sb2);vm.runInContext("function project(x,y){return {x:(x-y)*TILE*zoom-(cam.x-cam.y)*TILE*zoom+800,y:(x+y)*TILE*zoom/2-(cam.x+cam.y)*TILE*zoom/2+500};}function drawProp(p){const q=project(p.x,p.y);if(p.mirror)ctx.setTransform(-1,0,0,1,2*q.x,0);ctx.drawImage(p.half?IMG2:IMG,q.x-20,q.y-80,40,80);}",sb2);vm.runInContext(src,sb2);const Y=sb2.window.__STORYWORLD_PROPS_TIDY_R412__;
 const S=Y.samplesOf({id:'s1',x:5,y:7,path:'assets/x/a.webp'}),ppu=32*Math.SQRT2,top=S&&S[0],tan30=Math.tan(Math.PI/6);
 const mid=S?S.filter(([a,b])=>Math.abs(a-b)<.05):[];const lean=!!S&&S.every(([a,b,z])=>z<1e-9||Math.abs(-(a+b)/Math.SQRT2/z-tan30)<1e-9);
 ok('pixel → 3D plane: every opaque pixel becomes a point on the camera-facing plane leaning back 30° (phase1 worldPoint), highest first',!!S&&S.length===MW*MH&&Math.abs(top[2]-Math.sqrt(3)/2*(80*(1-.5/MH))/ppu)<1e-6&&mid.length>0&&lean,{n:S&&S.length,top});
 const A=Y.samplesOf({id:'s2',x:5,y:7,path:'assets/x/b.webp',half:true}),B=Y.samplesOf({id:'s3',x:5,y:7,path:'assets/x/b.webp',half:true,mirror:true}),side=P=>P.reduce((t,[a,b])=>t+Math.sign(a-b),0);
 ok('a mirrored draw (R303/R140 scale(-1,1)) is measured mirrored: a left-half picture lands on the right',A&&B&&A.length===B.length&&side(A)<0&&side(B)>0,{a:A&&side(A),b:B&&side(B)});}
// 심사·측정 반영(R412-7)
{// R115 가 들어온 뒤 첫 틱에 같은 벽 객체 높이를 올린다(1.3 → 2.85) → 벽 서명이 바뀌면 그 방을 다시 재고 빼낸다(한 번만 센다)
 blockedFn=()=>false;wallsFn=()=>[];const S=[];for(let h=0;h<=3;h+=.25)S.push([-.354*h,-.354*h,.866*h]);
 const W={x:1,y:10,width:2,depth:20,height:1.3},L={floorCells:[],worldR74:{doors:[]},walls:[W]};
 const t={id:'r99:tree:w:0',x:2.8,y:6,path:'assets/r99/outdoor/tree-dead-11.webp',r99Tree:{kind:'dead'}},r={id:'wh',exploration:L,props:[t]};
 const a=X.apply(r,{samples:()=>S}),low=!t.r412Moved&&!!t.r412Wall&&a.embedded===0&&X.wallSig(L)==='1:130';const n1=X.embedded(L,2.8,6,S,Infinity,false);
 W.height=2.85;const b=X.apply(r,{samples:()=>S});
 ok('when wall heights are raised in place after measuring (R115 1.3 → 2.85), the room is measured again and the prop pulled out, counted once',low&&n1===0&&X.embedded(L,2.8,6,S,Infinity,false)>Math.floor(.03*S.length)&&!!t.r412Moved&&t.x>2.8&&X.embedded(L,t.x,t.y,S,Infinity,false)<=Math.floor(.03*S.length)&&b.remeasured===1&&b.embedded===1&&b.unwalled===1&&X.wallSig(L)==='1:285',{low,n1,x:t.x,b});
 const c=X.apply(r,{samples:()=>S});ok('...and an unchanged room is not measured again',c===b&&c.remeasured===1,{c});}
{// R412-8: 잰 뒤에 보이는 발 자리가 바뀌면(사몽 구역: R111 벽 간격이 R412 보다 늦게 r111To 를 덮어씀 + R303 거울) 그 조형물만 다시 잰다
 blockedFn=(x,y,r)=>x-(r||0)<2;wallsFn=()=>[];const S=[];for(let h=0;h<=2;h+=.25)S.push([-.354*h,-.354*h,.866*h]);sb.window.__STORYWORLD_PLAY_R111__={prefs:()=>({props:true})};
 const m={id:'r115:sz-x:s:cabinet:0',x:3.5,y:24,path:'assets/r99/outdoor/tree-dead-08.webp',r303Flip:true},r={id:'t10',indoor:true,exploration:{floorCells:[],worldR74:{doors:[]}},props:[m]};
 const a=X.apply(r,{samples:()=>S}),fine=!m.r412Moved&&!!m.r412Wall&&a.embedded===0&&!m.r111To;const st0=X.inspect().stats.refooted;
 // R111 spaceProps 처럼 거울을 모르고 r111To 를 덮어씀: (+.35,-1.1) → 거울로 (-1.1,+.35) 에 그려져 벽(x<2) 속
 Object.defineProperty(m,'r111To',{value:{x:3.85,y:22.9},configurable:true});const v0=X.footOf(m),inWall=X.embedded(r.exploration,v0.x,v0.y,S)/S.length;
 const b=X.apply(r,{samples:()=>S}),v1=X.footOf(m);
 ok('a prop whose visible foot is changed after measuring (R111 spacing overwrites r111To later; R303 mirror) is measured again where it is now drawn and pulled out of the wall',fine&&Math.abs(v0.x-2.4)<1e-9&&inWall>.3&&!!m.r412Moved&&v1.x>2.3&&X.embedded(r.exploration,v1.x,v1.y,S)/S.length<=.03&&b.refooted===1&&X.inspect().stats.refooted===st0+1&&b.embedded===1&&b.unwalled===1,{v0,v1,inWall,b});
 const c=X.apply(r,{samples:()=>S});ok('...and once its foot is where R412 put it, it is not measured again',c===b&&c.refooted===1&&Math.abs(m.r412Foot[0]-v1.x)<1e-9,{c});
 // 서로 덮어쓰는 고리: 매번 다른 자리로 덮어써도 같은 방문에 세 번까지만 다시 잰다
 let last=null;for(let i=0;i<6;i++){Object.defineProperty(m,'r111To',{value:{x:3.9+i*.01,y:22.9},configurable:true});last=X.apply(r,{samples:()=>S});}
 ok('a draw spot rewritten over and over is re-measured at most three times per visit',m.r412Refoot===3&&last===b&&last.refooted===3,{n:m.r412Refoot,rep:last});}
{// R115 가 이 방 벽을 아직 손보지 않았으면(첫 게임 틱 전) 재지 않고 기다린다 — 손보면 바로, 안 손봐도 12초 뒤엔 잰다
 let T=1000,stepFn=null;const sb3={window:{StoryPhase1:{explorationBlocked:()=>false},__STORYWORLD_PLAY_R115__:{prefs:()=>({walls:true})}},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>T},
  setTimeout:f=>{stepFn=f;return 0;},loading:false,Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,Error,RegExp};
 const W={x:1,y:10,width:2,depth:20,height:1.3},r={id:'dress',exploration:{floorCells:[],worldR74:{doors:[]},walls:[W]},props:[{id:'r80:scene:d:0',x:5,y:5,path:'assets/world-r80/r80-031.webp'}]};sb3.room=r;
 vm.createContext(sb3);vm.runInContext(src,sb3);const Z=sb3.window.__STORYWORLD_PROPS_TIDY_R412__;
 stepFn();const waited=Z.inspect().stats.wallWaits===1&&Z.inspect().room===null;
 W.r115Wall=1.3;W.height=2.85;stepFn();const went=!!Z.inspect().room&&Z.inspect().room.wallSig==='1:285';
 const r2={id:'never',exploration:{floorCells:[],worldR74:{doors:[]},walls:[{x:1,y:10,width:2,depth:20,height:1.3}]},props:[]};sb3.room=r2;stepFn();const held=Z.inspect().room===null;T+=12500;stepFn();const late=!!Z.inspect().room;
 ok('waits for R115 to raise this room\'s walls before measuring (at most 12 s per visit)',waited&&went&&held&&late,{waited,went,held,late});}
{// 등불 솎기: R117 장면 등불·자기 붓 소품(R299 촛대)은 빼지 않고, 뺀 직후 R303·R406 이 소품 수를 다시 센다
 blockedFn=()=>false;wallsFn=()=>[{dx:0,dy:-1,side:'-y',d:3}];let c3=0,c6=0;const R406o=sb.window.__STORYWORLD_PROPS_PLACE_R406__;
 sb.window.__STORYWORLD_PROPS_FIT_R303__={apply:()=>{c3++;},inspect:()=>({on:true,room:'x'}),locked:()=>false};sb.window.__STORYWORLD_PROPS_PLACE_R406__={...R406o,apply:()=>{c6++;}};
 const cells=[];for(let x=0;x<20;x++)for(let y=0;y<20;y++)cells.push([x,y]);const P='assets/r406/lights/lantern-bulb-post.png';
 const A={id:'r117:scene:z:0',x:4,y:4,path:P,r117Scene:{track:'t'}},B={id:'r299:z:1',x:5,y:4,path:'assets/r299/candle.webp',r299:'prop'},C={id:'lampC',x:10,y:10,path:P},D={id:'lampD',x:12,y:10,path:P};
 const r={id:'lr',indoor:true,exploration:{floorCells:cells,worldR74:{doors:[]}},props:[A,B,C,D]};const rep=X.apply(r,{samples:()=>null});
 ok('lamp thinning never removes R117 scene lamps or own-painted R299 candles, and re-counts R303/R406 right after removing',r.props.includes(A)&&r.props.includes(B)&&(r.props.includes(C)!==r.props.includes(D))&&rep.lamps===2&&rep.lampsRemoved===1&&c3===1&&c6===1,{rep,c3,c6});
 delete sb.window.__STORYWORLD_PROPS_FIT_R303__;sb.window.__STORYWORLD_PROPS_PLACE_R406__=R406o;}
{// R406 보스 소품은 벽 밖 자리가 없어도 숨기지 않는다(옮길 수만 있다)
 blockedFn=(x,y,r)=>!(x>=2&&x<=2.6&&y>=0&&y<=40);wallsFn=()=>[];const S=[];for(let h=0;h<=2;h+=.25)S.push([-.354*h,-.354*h,.866*h]);
 const boss={id:'r406:boss:z:0',x:2.3,y:6,path:'assets/r406/boss/ring.webp',r406Boss:'ring'},r={id:'bh',indoor:true,exploration:{floorCells:[],worldR74:{doors:[]}},props:[boss]};const rep=X.apply(r,{samples:()=>S});
 ok('R406 boss props are never hidden by the deep-wall fallback',!boss.r303Hide&&rep.stuck.length===1&&rep.hidden===0,{rep});}
ok('measuring draws with flashlight sight (R24) switched off for that synchronous draw only, restoring it after',/if\(SET\)SET\.flashlight58=false;cam\.x=F\.x;/.test(src)&&/finally\{if\(SET\)\{if\(had\)SET\.flashlight58=lit;else delete SET\.flashlight58;\}ctx=saved;/.test(src));
ok('picture masks are cached per image object (no long data: URL keys)',/const masks=new WeakMap\(\);/.test(src)&&/if\(M\.size>64\)M\.clear\(\);/.test(src)&&!/img\?\.src\|\|img\?\.id/.test(src));
ok('mirror switches (R140/R303) are read once per 0.25 s, not per prop per candidate spot; candidate crowding uses precomputed feet',/if\(FC&&t-FCt<250\)return FC;/.test(src)&&/feet=feet\|\|feetOf\(r,on,F\)/.test(src)&&/crowdedF\(feet,p,x,y,\.75\)/.test(src)&&!/crowded\(r,p,/.test(src));
ok('room loop: lets R303/R406 catch up every step (late R224 furniture is placed by R406 before R412 measures or faces it), then idle slices while work remains',/try\{R303\(\)\?\.apply\?\.\(room\);\}catch\(e\)\{fail\(e\);\}try\{R406\(\)\?\.apply\?\.\(room\);\}catch\(e\)\{fail\(e\);\}\n  const left=/.test(src)&&!/if\(!ready\(room\)\)\{try\{R303/.test(src)&&/next=!rep\?150:rep\.pending>0\?0:rep\.waiting>0\?300:900/.test(src)&&/IDLE\(step,\{timeout:100\}\)/.test(src));
ok('set() persists switches',(X.set({lamps:false}),JSON.parse(store['storyworld.r412.props']).lamps===false));
ok('inspect reports no collision or save changes',X.inspect().collisionChanged===false&&X.inspect().savesTouched===false);
// R92 등불: 가구 충돌 상자는 벽으로 안 읽고, 640칸마다 1개(최대 12), 문·목표 양옆 짝 없이 7칸 간격, 조형물 1.5칸 안 금지
const r92=C('visual-r92.js');
ok('R92 lamps ignore furniture collision boxes when choosing wall spots (boss-room desks are not walls)',/const FURNITURE_WALL=w=>!!w&&\(w\.sinFurniture\|\|w\.sinArtFurniture\|\|w\.mammonFurniture/.test(r92)&&/walls:\(L0\.walls\|\|\[\]\)\.filter\(w=>!FURNITURE_WALL\(w\)\)/.test(r92));
ok('R92 lamp quota halved (640 floor cells per lamp, at most 12); doors/gates get one lamp, focal anchors keep their pair',/LIGHT_CELLS_R412=640,R412_SINGLE=true/.test(r92)&&/LIGHTS=quota\(cells\.length,LIGHT_CELLS_R412,2,12\)/.test(r92)&&/\(!R412_SINGLE\|\|FOCAL\.test\(String\(a\.kind\|\|a\.id\|\|''\)\)\)\)put\(second,'anchor'\)/.test(r92));
ok('R92 lamps keep 7 tiles apart even beside doors and stay 1.5 tiles off other props',/free=p=>!lights\.some\(q=>Math\.hypot\(p\.x-q\.x,p\.y-q\.y\)<LIGHT_GAP\)/.test(r92)&&/roomy=p=>!others\.some\(q=>Math\.hypot\(p\.x-q\.x,p\.y-q\.y\)<1\.5\)/.test(r92)&&/others=\(r\.props\|\|\[\]\)\.filter\([^;]*\)\.map\(foot\)/.test(r92));
ok('R92 focal anchors (objective/boss/altar/marker) get their lamp before doors and gates when the lamp quota is small',/const FOCAL=\/objective\|boss\|altar\|marker\/i,anchors=\[\.\.\.\[r\.objective&&\{kind:'objective'/.test(r92)&&/\.sort\(\(a,b\)=>\(FOCAL\.test/.test(r92));
{const quota=(cells,per,lo,hi)=>Math.max(lo,Math.min(hi,Math.round(cells/per)));ok('a 7,185-cell boss floor now gets 11 lamps instead of 22',quota(7185,640,2,12)===11&&quota(7185,320,3,26)===22);}
// 동굴(R204) 발밑 그늘: 보이는 발 자리를 따라가고 숨긴 장식엔 깔지 않으며, R412 가 옮기거나 숨기거나 등불을 빼면 다시 깐다
const cave=C('cave-r204.js');ok('cave floor shadows follow the visible foot (R111/R412 draw spot), skip hidden props, and are re-laid after R412 moves, hides or removes props',/const footR412=q=>/.test(cave)&&/!q\.r303Hide\)\.map\(q=>\(\{q,f:footR412\(q\)\}\)\)/.test(cave)&&/function shadowSync\(r,st,frame\)/.test(cave)&&/spriteSight\(st\);shadowSync\(r,st,frame\);/.test(cave)&&/shadowKey:shadowKey\(roomOf\(frame\)\)/.test(cave)&&fs.readFileSync(path.join(RT,'cave-r204.js'),'utf8')===cave);
// R329: 그림자는 늘 뒤쪽
const r329=C('prop-shadow-r329.js');ok('R329 shadows never fall in front (only lights clearly in front blend in; side shift ≤.3h; always up; lighter alpha)',/const w=L0&&!back\?Math\.max\(0,Math\.min\(1,\(-L0\.y-\.15\)\/\.35\)\):0/.test(r329)&&/oy=Math\.min\(oy,-h\*\.05\)/.test(r329)&&/ALPHA=\.25/.test(r329)&&!/L\.y>\.2\?-\.6:1/.test(r329)&&/R329-prop-shadow-9/.test(r329));
ok('R329 matches the shadow to the R111/R412 draw spot (r111To), not x/y, and takes light/sight from the visible foot',/s=T\.spotOf\(p\)\|\|p;f=T\.footOf\(p\)\|\|p;mir=!!T\.mirrored\(p\);/.test(r329)&&/q=project\(s\.x,s\.y\)/.test(r329)&&/wx:f\.x,wy:f\.y,self:p,flip:mir/.test(r329));
// ---- R412-9(7분야 심사 반영) ------------------------------------------------------------------------------
// ① 입장 직후: 아직 안 잰 조형물은 감추고(HOLD_MS), 잰 뒤에는 FADE_MS 동안 나타난다. 잴 때(bodyOf)는 감추지 않는다.
{let T=1000;const calls=[];const ctx={globalAlpha:1,_s:[],save(){this._s.push(this.globalAlpha);},restore(){this.globalAlpha=this._s.pop();}};
 const sb2={window:{StoryPhase1:{explorationBlocked:()=>false},__STORYWORLD_PROPS_PLACE_R406__:{walls:()=>[],indoorOf:()=>false}},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,performance:{now:()=>T},
  Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,Error,RegExp,ctx,loading:false,started:true,room:{id:'h',exploration:{floorCells:[[0,0]],worldR74:{doors:[]}},props:[]},
  drawProp:function(p){calls.push([p.id,ctx.globalAlpha]);},makeRoom:function(){return sb2.__made;}};
 vm.createContext(sb2);vm.runInContext(src,sb2);const Y=sb2.window.__STORYWORLD_PROPS_TIDY_R412__;
 const p={id:'r74:z:scenery:1',x:3,y:3,path:'assets/x/statue.webp'};sb2.room.props.push(p);
 vm.runInContext('drawProp(room.props[0])',sb2);ok('unmeasured props near the room start are held back (drawn almost invisible, HELD_ALPHA) instead of popping later',calls.length===1&&calls[0][1]===Y.HELD_ALPHA&&Y.drawState(p).held>0,{calls});
 calls.length=0;
 p.r412Wall=1;T+=10;vm.runInContext('drawProp(room.props[0])',sb2);const a1=calls[0]&&calls[0][1];
 T+=Y.FADE_MS+5;vm.runInContext('drawProp(room.props[0])',sb2);const a2=calls[1]&&calls[1][1];
 ok('once measured they fade in over FADE_MS (alpha ramps from near 0 to 1), then draw normally',a1<.2&&a2===1&&!Y.drawState(p).fadeT,{a1,a2});
 ok('drawing never writes onto the prop object (R86 door check compares props JSON before/after drawing)',JSON.stringify(p)===JSON.stringify({id:'r74:z:scenery:1',x:3,y:3,path:'assets/x/statue.webp',r412Wall:1}),p);
 const q={id:'r74:z:scenery:2',x:5,y:5,path:'assets/x/statue.webp',r412Wall:1};sb2.room.props.push(q);vm.runInContext('drawProp(room.props[1])',sb2);const n0=calls.length;
 q.r303Flip=true;Y.changed(q);T+=50;vm.runInContext('drawProp(room.props[1])',sb2);ok('a change to an already-drawn prop (move/flip) fades the new look in instead of snapping',calls.length===n0+1&&calls[n0][1]>0&&calls[n0][1]<1,{a:calls[n0]});
 T+=Y.HOLD_MS+10;const z={id:'r74:z:scenery:3',x:7,y:7,path:'assets/x/statue.webp'};sb2.room.props.push(z);vm.runInContext('drawProp(room.props[2])',sb2);ok('after HOLD_MS unmeasured props draw normally (never hidden for long)',calls[calls.length-1][0]==='r74:z:scenery:3'&&calls[calls.length-1][1]===1);
 const w={id:'r74:z:wall-banner:4',x:2,y:2,path:'assets/x/banner.webp'};T=sb2.performance.now();sb2.room={...sb2.room,props:[w]};vm.runInContext('drawProp(room.props[0])',sb2);ok('wall dressing (WALLISH) and untouchable props are never held',calls[calls.length-1][0]==='r74:z:wall-banner:4');
 ok('bodyOf measuring passes through the hold (measuring counter around its drawProp calls)',/ctx=g;measuring\+\+;/.test(src)&&/try\{drawProp\(p\);if\(!rec\.length\)drawProp\(p\);\}finally\{measuring--;\}/.test(src));
 // ② 방을 만들 때(첫 그리기 전) 방향·등불을 정한다
 const cells=[];for(let x=0;x<20;x++)for(let y=0;y<20;y++)cells.push([x,y]);const lampsP=[];for(let i=0;i<5;i++)lampsP.push({id:'lamp'+i,x:3+i*2,y:10,path:'assets/r406/lights/lantern-bulb-post.png'});
 const sofa={id:'r224:furn:m:0',x:1,y:6,path:'assets/world-r80/r80-148.webp',r224Furniture:true};sb2.window.__STORYWORLD_PROPS_PLACE_R406__={walls:(L,x,y)=>x<2?[{dx:-1,dy:0,side:'-x',d:.7}]:[{dx:0,dy:-1,side:'-y',d:3}],indoorOf:()=>true};
 sb2.__made={id:'made',exploration:{floorCells:cells,worldR74:{doors:[]}},props:[...lampsP,sofa]};const made=vm.runInContext('makeRoom()',sb2);
 ok('makeRoom hook: lamps are thinned and wall furniture faced before the first frame (no late pop)',Array.isArray(made.r412Lamps)&&made.r412Lamps.length>=1&&sofa.r303Flip===true&&Y.inspect().stats.early>=1,{lamps:made.r412Lamps&&made.r412Lamps.length,flip:sofa.r303Flip});
 sb2.started=false;const sofa2={id:'r224:furn:m:1',x:1,y:6,path:'assets/world-r80/r80-148.webp',r224Furniture:true},lp2=lampsP.map(q=>({id:q.id+'b',x:q.x,y:q.y,path:q.path}));sb2.__made={id:'made2',exploration:{floorCells:cells,worldR74:{doors:[]}},props:[...lp2,sofa2]};const before2=JSON.stringify(sb2.__made.props),made2=vm.runInContext('makeRoom()',sb2);sb2.started=true;
 ok('outside live play (test harness getRoom, game not started) makeRoom leaves props untouched',JSON.stringify(made2.props)===before2&&!made2.r412Lamps);}
// ③ 옮길 자리 앞 이웃이 그림의 1/4 넘게 덮으면 버린다
{const sb3={window:{},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,Error,RegExp,zoom:1,project:(x,y)=>({x:(x-y)*34,y:(x+y)*17})};
 vm.createContext(sb3);vm.runInContext(src,sb3);const Z=sb3.window.__STORYWORLD_PROPS_TIDY_R412__;
 const p={id:'sofa',x:5,y:5,height:60,r412Rect:[-40,40,-50,0,1]},front={id:'tv',x:6,y:6,height:90},back={id:'shelf',x:4,y:4,height:90};
 ok('covered(): a taller neighbour standing in front over the moved sprite rejects the spot; one behind does not',Z.covered(p,5,5,new Map([[front,{x:6,y:6}]]))===true&&Z.covered(p,5,5,new Map([[back,{x:4,y:4}]]))===false);
 ok('unwall rejects covered spots and searches coarser after two cut attempts',/if\(n<=lim&&\(!best\|\|n<best\.n\)&&!covered\(p,x,y,feet\)\)best=/.test(src)&&/ds=tries>=2\?\.3:\.1,D3=tries>=2\?dirs\.slice\(0,3\):dirs/.test(src));}
// ④ 야외 불빛 지역은 불꽃 하나는 남긴다(촛대·화로가 다 빠지던 dist03)
{const cells=[];for(let x=0;x<20;x++)for(let y=0;y<20;y++)cells.push([x,y]);blockedFn=()=>false;wallsFn=()=>[{dx:0,dy:-1,side:'-y',d:1}];
 const el=[0,1,2].map(i=>({id:'r74:o:scenery:'+i,x:2+i*8,y:2,path:'assets/props/v290/broken_street_lamp.webp'})),cand={id:'r80:scene:o:9',x:10,y:12,path:'assets/world-r80/r80-064.webp',r74Prop:'candle'},stone={id:'r80:scene:o:10',x:10.5,y:12.5,path:'assets/world-r80/r80-014.webp'};
 const r={id:'out',exploration:{floorCells:cells,worldR74:{doors:[]}},props:[...el,cand,stone]};X.set({lamps:true});X.apply(r,{samples:()=>null});
 {const sc={id:'r80:scene:o2:4',x:3,y:3,path:'assets/world-r80/r80-064.webp',r74Prop:'candle',r80Dressing:true},l2=[0,1,2].map(i=>({id:'r74:o2:scenery:'+i,x:4+i*8,y:4,path:'assets/props/v290/broken_street_lamp.webp'}));const r2={id:'out2',exploration:{floorCells:cells,worldR74:{doors:[]}},props:[sc,...l2]};X.apply(r2,{samples:()=>null});ok('canon scene props (R80/R81 scene dressing) are never thinned even if they are lamps',r2.props.includes(sc),{kept:r2.props.map(p=>p.id)});}
 ok('outdoor thinning keeps at least one flame (candle/brazier/torch) even when it stands beside another prop',r.props.includes(cand)&&X.isFlame(cand)&&!X.isFlame(el[0]),{kept:r.props.map(p=>p.id)});}
// ⑤ 이웃 파일 맞춤: R300 빛은 보이는 발 자리·R412 ver 로 새로 읽고, R113 은 r111To 가 있으면 자기 자리를 쓰지 않고, R92 등불 종류는 자리 씨앗으로
{const r300=C('light-atmos-r300.js'),r113=C('play-r113.js'),r92b=C('visual-r92.js');
 ok('R300 light list follows R412 moves (footOf) and is re-read whenever R412 moves props or removes lamps (ver)',/T=window\.__STORYWORLD_PROPS_TIDY_R412__,v=T\?\.ver\?\.\(\)\|\|0;/.test(r300)&&/c&&c\.n===n&&c\.v===v/.test(r300)&&/f=T\?\.footOf\?\.\(p\)\|\|p/.test(r300)&&/c=\{n,v,list\}/.test(r300)&&fs.readFileSync(path.join(RT,'light-atmos-r300.js'),'utf8')===r300);
 ok('R113 ground pass never moves a prop that has an R111/R412 draw spot (r111To), even if it cached a spot earlier',/\{const p0=propById\(id\);if\(p0&&p0\.r111To\)return null;\}/.test(r113)&&fs.readFileSync(path.join(RT,'play-r113.js'),'utf8')===r113);
 ok('R92 lamp kind is fixed by its floor-cell seed, so thinning never changes the kind of a remaining lamp',/const it=set\[\(s\.seed>>>0\)%set\.length\]/.test(r92b));
 ok('R412 idle slices yield when less than 2 ms remain (unless the idle callback timed out)',/!d\.didTimeout&&d\.timeRemaining\(\)<2\)\{IDLE\(step,\{timeout:100\}\);return;\}/.test(src));
 ok('wall grid and floor sets use numeric keys (no per-point string keys)',/GK=\(x,y\)=>\(x\+32768\)\*65536\+\(y\+32768\)/.test(src)&&!/gx\+','\+gy/.test(src)&&/F\.has\(GK\(Math\.floor\(x\),Math\.floor\(y\)\)\)/.test(src));}
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('R412 CPU '+checks.length+'/'+checks.length);
