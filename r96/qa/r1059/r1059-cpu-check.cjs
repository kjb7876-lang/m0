// R1059 CPU 검사: 옛 불면귀 그림(회백 해골 저승사자 — 보스 엔진 그림 4장·중간보스 옛 그림·R104 자세·rc140 아틀라스·R760 톤 자세)이
//  어느 경로(엔진 기본 그림, 그림 캐시가 비워진 뒤 첫 프레임, 다른 모드, 이름 카드, R425/R700/R99 clean 사본)로 불려도 새 그림 사본(assets/r1059/…)으로 읽히는가.
//  사용자 2026-11-15 14:14Z "불면귀 아직도 예전 이미지 나오는경우있음".
//  정상: 소스에 나오는 옛 경로 전부 → assets/r1059/<원래 경로>(같은 파일 이름이라 R760 kindOf·R981 src 판별 그대로). 경계: clean 접두어·'./'·이미 불러온 캐시 행.
//  회귀: 다른 그림·새 시트·r1059 사본 자체는 그대로, 끄기 스위치면 그대로.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'../..');let n=0,bad=0;const ok=(c,m)=>{n++;if(c)console.log('ok  ',m);else{bad++;console.log('FAIL',m);}};
const read=f=>fs.readFileSync(path.join(R,f),'utf8'),has=f=>fs.existsSync(path.join(R,f));
const F='bulmyeongwi-oldart-r1059.js';
ok(has('client-source/'+F),'overlay source exists');
const src=has('client-source/'+F)?read('client-source/'+F):'';
ok(has('runtime-text/'+F)&&read('runtime-text/'+F)===src,'runtime copy matches client source');
const html=read('runtime-text/index.html');
ok(new RegExp('<script src="\\./bulmyeongwi-fog-r990\\.js"></script>\\n<script src="\\./'+F.replace(/\./g,'\\.')+'"></script>\\n').test(html),'index.html tag right after bulmyeongwi-fog-r990');
ok(read('../scripts/verify-r96-public.py').includes("'"+F+"'"),'verify-r96-public lists overlay');
ok(/r96\/qa\/r1059\/r1059-cpu-check\.cjs/.test(read('../.github/workflows/pages.yml')),'pages.yml runs this check');
const man=has('runtime-manifest.json')?read('runtime-manifest.json'):'';ok(man.includes('"'+F+'"'),'runtime-manifest has overlay');
// 옛 경로 모으기(엔진 index.html + 모든 오버레이 소스)
const OLDRE=/assets\/[A-Za-z0-9_\-\/.]*?(?:bulmyeongwi_(?:idle|attack|rain|transition|b)\.webp|mb-last302-v31231(?:-p[1-4])?\.(?:webp|png)|r760\/boss\/bulmyeongwi-(?:p[1-4]|rain|transition)\.webp)/g;
const all=new Set();for(const t of [html,...fs.readdirSync(path.join(R,'client-source')).filter(f=>f.endsWith('.js')&&f!==F).map(f=>read('client-source/'+f))])for(const m of t.matchAll(OLDRE))all.add(m[0]);
const olds=[...all].sort();ok(olds.length>=12,'found old paths in sources: '+olds.length);
// R760 톤 자세(DIR+k 로 만들어 소스에 글자 그대로는 없음)·R425 clean 사본까지: 표의 모든 옛 경로
const tableOld=()=>JSON.parse(read('r1059-bulmyeongwi-oldart.json')).rows.map(r=>r.old);
const json=has('r1059-bulmyeongwi-oldart.json')?JSON.parse(read('r1059-bulmyeongwi-oldart.json')):{rows:[]};
for(const r of json.rows){const p='runtime-text/'+r.new;ok(has(p)&&crypto.createHash('sha256').update(fs.readFileSync(path.join(R,p))).digest('hex')===r.sha256,'asset sha matches table: '+r.new);ok(man.includes('"'+r.new+'"'),'manifest has '+r.new);}
// 가짜 엔진
function world({store={},cache=null}={}){const loads=[];
 class Img{constructor(){this.naturalWidth=0;this.naturalHeight=0;}set src(v){this._s=v;loads.push(v);this.naturalWidth=10;this.naturalHeight=10;Promise.resolve().then(()=>this.onload&&this.onload());}get src(){return this._s;}decode(){return Promise.resolve();}}
 const c={console,Math,JSON,Object,Array,String,Number,Boolean,Set,Map,WeakMap,Promise,RegExp,Error,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},Image:Img,setTimeout:(f)=>{f();return 1;},
  cleanPath:p=>String(p).replace(/^\.\//,'').replace(/#.*$/,''),imageCrop:im=>({x:0,y:0,w:im.naturalWidth,h:im.naturalHeight}),imageCache:cache||new Map(),location:{protocol:'http:'}};
 c.window=c;vm.createContext(c);vm.runInContext('var urlFor=function(p){return "U:"+cleanPath(p);};',c);vm.runInContext(src,c);return {c,loads};}
const target=p=>{const q=p.replace(/^\.\//,'').replace(/#.*$/,'').replace(/^assets\/(?:r425|r700|r99)\/clean\//,'');
 let m;if(m=/bulmyeongwi_(idle|attack|rain|transition)\.webp$/.exec(q)&&!/^assets\/generated-v31224\//.test(q)){const k={idle:'692e4ae01c29',attack:'115b7fcea51e',rain:'35526bcfa1c2',transition:'de4c1414da0d'}[/bulmyeongwi_(idle|attack|rain|transition)/.exec(q)[1]];return 'assets/r1059/assets/generated-v31224/actors-normalized/'+k+'_bulmyeongwi_'+/bulmyeongwi_(\w+)\.webp/.exec(q)[1]+'.webp';}
 return 'assets/r1059/'+q;};
if(src){const {c}=world();
 for(const p of tableOld()){const t=target(p);ok(c.urlFor(p)==='U:'+t,'table row redirected '+p);}
 for(const p of olds){const t=target(p);ok(c.urlFor(p)==='U:'+t&&has('runtime-text/'+t),'redirect '+p+' → '+t);}
 const X='assets/generated-v31224/actors-normalized/115b7fcea51e_bulmyeongwi_attack.webp';
 for(const pre of ['assets/r425/clean/','assets/r700/clean/','assets/r99/clean/','./'])ok(c.urlFor(pre+X)==='U:assets/r1059/'+X,'prefix '+pre+' redirected');
 ok(c.urlFor('assets/episode1b/generated-v394/bulmyeongwi_b.webp#0,0,418,418')==='U:assets/r1059/assets/episode1b/generated-v394/bulmyeongwi_b.webp','fragment path redirected');
 ok(/bulmyeongwi_idle\.webp$/.test(c.urlFor('assets/generated-v31224/actors-normalized/692e4ae01c29_bulmyeongwi_idle.webp')),'redirected name keeps bulmyeongwi_idle (R760 kindOf/OLDART still match)');
 for(const p of ['assets/r760/boss/sheet-idle.webp','assets/r760/mid/sheet-atk.webp','assets/vfx/v31330/mb-last302-v31231/beam.webp','assets/vfx/v31323/boss/mb-last302-v31231/sleepless_soul.webp','assets/r104/bosses/mb-last304-v31231-p1.webp','assets/r1059/assets/episode1b/generated-v394/bulmyeongwi_b.webp','assets/r104/bosses/b07-boss-p1.webp'])ok(c.urlFor(p)==='U:'+c.cleanPath(p),'unchanged '+p);
 ok(c.urlFor(null)==='U:null'&&c.urlFor(42)==='U:42','non-string passes through');
 ok(!!c.__STORYWORLD_BULMYEONGWI_OLDART_R1059__&&typeof c.__STORYWORLD_BULMYEONGWI_OLDART_R1059__.inspect==='function','inspect api');}
if(src){const {c}=world({store:{'storyworld.r1059.oldart':'{"on":false}'}});const X='assets/generated-v31224/actors-normalized/692e4ae01c29_bulmyeongwi_idle.webp';ok(c.urlFor(X)==='U:'+X,'off switch passes through');}
// 이미 불러온 캐시 행(이 파일보다 먼저 실린 경우)도 새 그림으로 다시 읽는다
(async()=>{if(src){const X='assets/generated-v31224/actors-normalized/692e4ae01c29_bulmyeongwi_idle.webp',old={path:X,ready:true,image:{src:'U:'+X,naturalWidth:672,naturalHeight:384},crop:null},other={path:'assets/r760/boss/sheet-idle.webp',ready:true,image:{src:'x'}};
 const cache=new Map([[X,old],[other.path,other]]);const {c,loads}=world({cache});await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));
 ok(old.image.src==='U:assets/r1059/'+X&&old.ready===true,'cached old row re-pointed to new art');ok(other.image.src==='x','other cached rows untouched');ok(loads.length===1,'only one reload');}
 console.log(`\nR1059 ${n-bad}/${n}`);if(bad)process.exit(1);})();
