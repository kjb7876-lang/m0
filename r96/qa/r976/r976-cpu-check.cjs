// R976 사몽 첫 지역(P '주인 없는 자장가') 도트 → 칠한 자산 CPU 검사.
// 빌드 연결, 자산 표(파일·해시·크기), P 구역에서만 pixelfx 도트 시트를 칠한 시트로 바꾸고 나가면 되돌리기, 기존 재생 길이 유지,
// 코드로 칠하던 '검은 뿌리' 장식에 그림 경로 주기, 화면 재·불티 점(arc)을 그림 조각으로 그리기, NaN·이상값 방어를 가짜 엔진으로 확인한다.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const CS=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8');
const FILE='samong-p-art-r976.js';
const src=CS(FILE);assert.strictEqual(src,RT(FILE));ok('client-source and runtime copies agree');
// 빌드 연결
{const idx=RT('index.html'),at=k=>idx.indexOf('"./'+k+'"');assert.strictEqual(idx.split('"./'+FILE+'"').length,2);
 for(const dep of ['samong-mood-r123.js','dark-r123.js'])assert(at(dep)>=0&&at(dep)<at(FILE),'after '+dep);
 // pixelfx 표·두 캔버스는 실행 중(tick)에 찾으므로 pixelfx-r163 보다 앞에 실려도 된다
 assert(/__STORYWORLD_PIXELFX_R163__;\s*$|=>window\.__STORYWORLD_PIXELFX_R163__/m.test(src)&&/getElementById\(id\)/.test(src));
 assert(at(FILE)<at('combat-r118.js'));ok('index.html loads it once, after mood/dark, before combat-r118; pixelfx and canvases are looked up lazily');
 assert(/asset-cdn-r615\.js"><\/script><script src="\.\/samong-p-art-r976\.js"><\/script><script src="\.\/combat-r137\.js"/.test(idx));ok('sits in the gap between asset-cdn-r615 and combat-r137 (no order regex there)');
 assert(fs.readFileSync(path.join(root,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+FILE+"'"));ok('public verify list');
 assert(fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r976/r976-cpu-check.cjs'));ok('Pages CPU step');
 const spec=JSON.parse(fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8'));
 for(const p of [FILE,'assets/r976/tendrils-blood.webp','assets/r976/portal-teal.webp','assets/r976/root-tendril.webp','assets/r976/ash-flakes.webp','assets/r976/index.json'])assert(spec.textPaths.includes(p),'runtime inputs '+p);ok('runtime inputs list the overlay and r976 assets');}
// 자산 표: 파일 크기·해시가 index.json 과 맞고, 바꿔 쓰는 원본 자산(Dots 코어·R411 시트)이 있다
{const dir=path.join(root,'runtime-text','assets','r976'),ix=JSON.parse(fs.readFileSync(path.join(dir,'index.json'),'utf8'));let total=0;
 for(const [k,r] of Object.entries(ix.files)){const b=fs.readFileSync(path.join(dir,r.file));assert.strictEqual(b.length,r.bytes,k);assert.strictEqual(crypto.createHash('sha256').update(b).digest('hex'),r.sha256,k);total+=b.length;}
 assert(total<600000,'r976 assets stay small: '+total);
 for(const p of ['assets/r600/dots/sv-core-01.webp','assets/r411/fx/boss-meteor.webp','assets/r411/fx/boss-corpse-explosion.webp','assets/r411/fx/hit-teleport.webp'])assert(fs.existsSync(path.join(root,'runtime-text',p)),p);
 ok('r976 asset table matches files (<600KB) and reused painted sheets exist');}
// ---- 가짜 엔진 -----------------------------------------------------------------------------------------
function engine(){const meta={
  'core-orb-teal':{file:'core-orb-teal.webp',frame:[136,112],pivot:[68,104],columns:6,frames:36,fps:15,loop:true},
  'portal-teal':{file:'portal-teal.webp',frame:[152,116],pivot:[76,106],columns:6,frames:36,fps:15,loop:true},
  'tendrils-blood':{file:'tendrils-blood.webp',frame:[208,130],pivot:[104,106],columns:6,frames:44,fps:15,loop:false},
  'meteor':{file:'meteor.webp',frame:[272,232],pivot:[150,208],columns:8,frames:72,fps:15,loop:false},
  'dark-explosion-blood':{file:'dark-explosion-blood.webp',frame:[280,248],pivot:[140,206],columns:7,frames:55,fps:15,loop:false},
  'collect-burst':{file:'collect-burst.webp',frame:[112,108],pivot:[56,94],columns:5,frames:17,fps:15,loop:false},
  'crit-hit':{file:'crit-hit.webp',frame:[100,100],pivot:[50,50],columns:5,frames:10,fps:15,loop:false}};
 const orig=JSON.parse(JSON.stringify(meta));
 const els={};const mkCanvas=id=>{const calls=[];const g={fillStyle:'#000',globalAlpha:1,calls,
   beginPath(){calls.push('begin');},arc(...a){calls.push(['arc',...a]);},ellipse(...a){calls.push(['ellipse',...a]);},fill(){calls.push('fill');},stroke(){calls.push('stroke');},
   drawImage(...a){calls.push(['img',...a]);},save(){},restore(){},moveTo(){},lineTo(){}};return {id,getContext:()=>g,g};};
 els.moodCv=mkCanvas('moodCv');els.darkCv=mkCanvas('darkCv');
 const doc={getElementById:id=>id==='moodR123'?{querySelector:()=>els.moodCv}:id==='darkR123'?{querySelector:()=>els.darkCv}:null,addEventListener(){}};
 const added=[];const ready=new Set();
 const g={window:{},document:doc,localStorage:{getItem:()=>null,setItem(){}},meta,orig,els,added,ready,
  room:{id:'dist05',layer:'DREAM',samongR103:{zone:'sz115-P-1'},props:[]},time:0,started:true,player:{x:0,y:0},
  addImage:p=>{added.push(p);},readyImage:p=>ready.has(p)?{image:{width:10,height:10,naturalWidth:10,naturalHeight:10,src:p}}:null,
  ticks:0,tick(){g.ticks++;}};
 g.window.__STORYWORLD_PIXELFX_R163__=Object.freeze({meta:()=>meta,has:k=>!!meta[k],dir:'assets/r163/pixelfx/'});
 return g;}
function load(g){
 // room·time 은 전역 getter 로(엔진처럼 바뀐다)
 globalThis.room=g.room;globalThis.time=g.time;globalThis.started=true;globalThis.player=g.player;globalThis.addImage=g.addImage;globalThis.readyImage=g.readyImage;
 globalThis.tick=g.tick;globalThis.actorHeight=()=>60;
 const w=g.window;const fn=new Function('window','document','localStorage',src+'\n;return {tick:()=>tick(),A:window.__STORYWORLD_SAMONG_P_ART_R976__};');
 return fn.call(globalThis,w,g.document,g.localStorage);}
const setRoom=(g,r)=>{g.room=r;globalThis.room=r;};
// 1) P 구역에서는 칠한 시트로, 다른 사몽 구역·본편에서는 원래 시트로
{const g=engine();const {tick,A}=load(g);assert(A&&A.revision&&/R976/.test(A.revision));ok('module loads with a fake engine');
 tick();const m=g.meta;
 const R=k=>A.resolve(g.window.__STORYWORLD_PIXELFX_R163__.dir+m[k].file)||m[k].file;
 for(const k of Object.keys(A.swap)){assert(!m[k].file.includes('..'),'no .. in '+m[k].file);assert(/^r976\//.test(m[k].file));}
 assert(/^assets\/r600\/dots\/sv-core-01\.webp$/.test(R('core-orb-teal')));assert(/^assets\/r976\/portal-teal\.webp$/.test(R('portal-teal')));
 assert(/^assets\/r976\/tendrils-blood\.webp$/.test(R('tendrils-blood')));assert(/^assets\/r411\/fx\/boss-meteor\.webp$/.test(R('meteor')));
 assert(/^assets\/r411\/fx\/boss-corpse-explosion\.webp$/.test(R('dark-explosion-blood')));assert(/^assets\/r411\/fx\/hit-teleport\.webp$/.test(R('collect-burst')));
 assert.strictEqual(m['crit-hit'].file,'crit-hit.webp');ok('in P: core/portal/tendrils/meteor/blood-burst/collect use painted sheets, untouched names stay');
 for(const k of Object.keys(g.orig))if(m[k].file!==g.orig[k].file){const o=g.orig[k],r=m[k],d0=o.frames/o.fps,d1=r.frames/r.fps;
  assert(Math.abs(d0-d1)/d0<.08||(o.loop&&r.loop),k+' duration '+d0+' vs '+d1);assert.strictEqual(!!r.loop,!!o.loop,k+' loop');
  assert(r.columns>0&&r.frames>0&&r.frame[0]>0&&r.frame[1]>0&&Number.isFinite(r.pivot[0]+r.pivot[1]),k);
  assert(!r.file.includes('..'),k+' alias has no ..');}
 {const al='assets/r163/pixelfx/'+m['core-orb-teal'].file;g.ready.add('assets/r600/dots/sv-core-01.webp');const row=globalThis.readyImage(al);assert(row&&row.image.src==='assets/r600/dots/sv-core-01.webp','alias resolves via readyImage');
  globalThis.addImage('assets/r163/pixelfx/r976/meteor.webp');assert(g.added.includes('assets/r411/fx/boss-meteor.webp'));globalThis.addImage('assets/x/y.webp');assert(g.added.includes('assets/x/y.webp'));assert.strictEqual(globalThis.readyImage('assets/nope.webp'),null);
  ok('engine readyImage/addImage map only the r976 aliases to the real painted sheets (engine forbids .. paths)');}
 ok('swapped sheets keep the same play length (±8%) and loop flag, sane frame/pivot');
 // 정화의 코어 그림은 받침이 바닥 가까이, 구슬 가운데에 인장(seal 1.2h)이 걸리게
 {const r=m['core-orb-teal'],H=60,s=H*1.9/r.frame[1],z=H*.35,orbY=-z+(150-r.pivot[1])*s,footY=-z+(300-r.pivot[1])*s;
  assert(orbY<-H*.9&&orbY>-H*1.25,'orb centre '+orbY);assert(footY>-H*.3&&footY<H*.15,'pedestal foot '+footY);ok('core sheet pivot puts orb at the J seal and pedestal near the floor');}
 // 다른 사몽 구역 → 되돌림
 setRoom(g,{id:'ep1a09',layer:'DREAM',samongR103:{zone:'sz115-S02-1'},props:[]});tick();
 for(const k of Object.keys(g.orig))assert.deepStrictEqual(g.meta[k],g.orig[k],k);ok('leaving P restores the original pixelfx entries exactly');
 setRoom(g,{id:'dist05',layer:'STORY',props:[]});tick();for(const k of Object.keys(g.orig))assert.deepStrictEqual(g.meta[k],g.orig[k],k);ok('story-mode dist05 (same host map) stays original');
 setRoom(g,{id:'dist05',layer:'DREAM',samongR103:{zone:'sz162-P-D'},props:[]});tick();assert(/sv-core-01/.test(g.meta['core-orb-teal'].r976Path));
 setRoom(g,{id:'dist05',layer:'DREAM',samongR103:{zone:'sz173-P-G'},props:[]});tick();assert(/sv-core-01/.test(g.meta['core-orb-teal'].r976Path));ok('P-D and P-G (core zones) count as P');
 setRoom(g,{id:'x',layer:'DREAM',samongR103:{zone:'sz115-RP-1'},props:[]});tick();assert.strictEqual(g.meta['core-orb-teal'].file,'core-orb-teal.webp');ok('zone ids that merely contain P are not P');
 A.set({on:false});setRoom(g,{id:'dist05',layer:'DREAM',samongR103:{zone:'sz115-P-2'},props:[]});tick();assert.strictEqual(g.meta['portal-teal'].file,'portal-teal.webp');ok('off switch keeps originals');A.set({on:true});tick();assert(/r976/.test(g.meta['portal-teal'].file));
 setRoom(g,null);tick();setRoom(g,undefined);tick();assert.strictEqual(g.meta['portal-teal'].file,'portal-teal.webp');ok('null room is safe and restores');}
// 2) 검은 뿌리 장식: 코드 그림(tendril) 소품에 그림 경로
{const g=engine();const {tick,A}=load(g);const t={id:'r123:P-1:tendril:0',x:3,y:4,r123Deco:{kind:'tendril',seed:2}},art={id:'a',path:'assets/x.webp',r123Deco:{kind:'teacup'}},other={id:'b',r123Deco:{kind:'veins'}};
 g.room.props=[t,art,other];tick();assert.strictEqual(t.path,'assets/r976/root-tendril.webp');assert(t.height>60&&t.height<220);assert.strictEqual(art.path,'assets/x.webp');assert(!other.path);
 assert(g.added.includes('assets/r976/root-tendril.webp'));ok('P tendril deco gets the painted root image; other deco untouched');
 A.set({on:false});assert(!t.path&&t.height===undefined&&!t.r976Root);A.set({on:true});assert.strictEqual(t.path,'assets/r976/root-tendril.webp');ok('off switch gives the code-drawn deco back (path removed, height restored)');
 const s={id:'r123:S:tendril:0',x:1,y:1,r123Deco:{kind:'tendril',seed:1}};setRoom(g,{id:'ep1a09',layer:'DREAM',samongR103:{zone:'sz115-S02-1'},props:[s]});tick();assert(!s.path);ok('tendril deco outside P is not touched');}
// 3) 화면 재·불티 점: 작은 원 하나를 칠하면 그림 조각으로
{const g=engine();const {tick,A}=load(g);g.ready.add('assets/r976/ash-flakes.webp');tick();
 const mg=g.els.moodCv.g;mg.fillStyle='rgba(160,160,160,0.400)';mg.beginPath();mg.arc(100,50,2,0,Math.PI*2);mg.fill();
 const last=mg.calls.slice(-2);assert(Array.isArray(last[1])&&last[1][0]==='img','flake drawn: '+JSON.stringify(last));assert(!mg.calls.slice(-3).includes('fill'),'no vector fill for the dot');
 const im=last[1];assert.strictEqual(im[3],32,'ash row (sy)');ok('mood ash dot (r=2) is drawn as a painted ash flake');
 const dg=g.els.darkCv.g;dg.fillStyle='rgba(255,120,40,0.500)';dg.beginPath();dg.arc(10,10,1.5,0,Math.PI*2);dg.fill();const di=dg.calls.slice(-1)[0];assert(di[0]==='img'&&di[3]===0,'ember row (sy) '+JSON.stringify(di));ok('dark ember dot is drawn from the ember row');
 // 큰 원·여러 도형·NaN 은 그대로 칠한다
 mg.beginPath();mg.arc(100,50,40,0,Math.PI*2);mg.fill();assert.strictEqual(mg.calls.slice(-1)[0],'fill');
 mg.beginPath();mg.arc(1,1,2,0,Math.PI*2);mg.arc(5,5,2,0,Math.PI*2);mg.fill();assert.strictEqual(mg.calls.slice(-1)[0],'fill');
 mg.beginPath();mg.arc(NaN,1,2,0,Math.PI*2);mg.fill();assert(!mg.calls.slice(-1).some(c=>Array.isArray(c)&&c[0]==='img'));
 mg.beginPath();mg.arc(1,1,2,0,1);mg.fill();assert.strictEqual(mg.calls.slice(-1)[0],'fill');ok('big circles, multi-arc paths, partial arcs and NaN keep the original fill');
 // P 밖에서는 원래대로
 setRoom(g,{id:'ep1a09',layer:'DREAM',samongR103:{zone:'sz115-S02-1'},props:[]});tick();mg.beginPath();mg.arc(100,50,2,0,Math.PI*2);mg.fill();assert.strictEqual(mg.calls.slice(-1)[0],'fill');ok('outside P the dots stay vector');
 // 그림이 아직 없으면 원래대로
 const g2=engine();const L2=load(g2);L2.tick();const m2=g2.els.moodCv.g;m2.fillStyle='rgba(160,160,160,.4)';m2.beginPath();m2.arc(5,5,2,0,Math.PI*2);m2.fill();assert.strictEqual(m2.calls.slice(-1)[0],'fill');ok('flake image not ready → original dot');
 const ins=A.inspect();assert(ins.stats.flakes>=2&&Number.isFinite(ins.stats.flakes));ok('inspect reports flakes');}
console.log('R976 CPU check passed:',n,'checks');
