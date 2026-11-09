// R471 CPU 검사: 칠죄 보스가 정본에 적힌 물건을 던진다. 나태(ep1b02) 보스·중간보스가 조형물 던지기 차례에 정본 순서(휴지뭉치·쓰레기 → 냉장고 → 소파 → 썩은 침대)의 물건을
// 등의 쓰레기 산에서 뽑아 던지는지, 방 가구(짐수레 등)를 들어 올려 숨기지 않는지, 다른 보스·다른 지역·끄기·그림 미준비 때는 손대지 않는지.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='canon-throw-r471.js';
let exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
if(exists){
 for(const f of [F,'combat-r114.js']){ok(f+' runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',f))&&C(f)===RT(f));try{new vm.Script(C(f));ok(f+' syntax',true);}catch(e){ok(f+' syntax '+e.message,false);}}
 const html=RT('index.html');ok(F+' script tag once',html.split('"./'+F+'"').length===2);
 ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 ok('CI runs this check',/qa\/r471\/canon-throw-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
 const src=C(F);ok('no gameplay writes (hp/save/AI step)',!/\.hp\s*=[^=]|saveGame|\.attack\s*=|\.step\s*[+-]?=/.test(src));
 ok('Mammon zones not touched',!/ep1b06/.test(src));
 // R114 adoptThrow 이 R471 을 먼저 묻고, 고르면 방 조형물(propSource)·무기를 쓰지 않는다
 const r114=C('combat-r114.js'),ad=r114.slice(r114.indexOf('function adoptThrow'),r114.indexOf('function adoptShots'));
 ok('R114 adoptThrow asks R471 before propSource',ad.includes('__STORYWORLD_CANON_THROW_R471__')&&ad.indexOf('__STORYWORLD_CANON_THROW_R471__')<ad.indexOf('propSource('));
 ok('R114 skips room prop and weapon when R471 picked',/src=\w+\?null:propSource\(a\)/.test(ad)&&/w=\w+\?null:WEAP/.test(ad));
 // 단위
 function env(ready){const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console};g.window=g;vm.createContext(g);
  g.readyImage=p=>ready(p)?{image:{naturalWidth:10,naturalHeight:10}}:null;vm.runInContext('var room={id:"ep1b02",enemies:[]};',g);vm.runInContext(src,g);return g;}
 let g=env(()=>true);const A=g.__STORYWORLD_CANON_THROW_R471__;ok('API exposed',!!A&&typeof A.pick==='function');
 const boss={id:'ep1b02:b02-boss',nativeId:'b02-boss',boss:true,hp:100,maxHp:100,x:16,y:12};
 const seq=[];for(let i=0;i<7;i++){const r=A.pick(boss,{kind:'prop',token:i});seq.push(r&&r.key);}
 ok('canon order heap→fridge→sofa→(bed pending)→repeat: '+seq.join(','),seq.join(',')==='heap,fridge,sofa,heap,fridge,sofa,heap');
 const r0=A.pick({...boss,id:'x2'},{kind:'prop',token:9});ok('pick gives ready path + height',r0&&/r80-025\.webp$/.test(r0.path)&&r0.height>40&&r0.height<120);
 const mid={id:'ep1b02:mb-ep1b02',nativeId:'mb-ep1b02',hp:50,maxHp:50,x:21,y:15};ok('mid-boss of sloth also throws canon objects',A.pick(mid,{kind:'prop',token:1})?.key==='heap');
 ok('clone of the boss does not',A.pick({...boss,id:'c1',r61Clone:true},{kind:'prop',token:2})===null);
 ok('other boss in sloth room untouched',A.pick({id:'z',nativeId:'b07-boss',boss:true,hp:1,maxHp:1},{kind:'prop',token:3})===null);
 ok('echo/field action untouched',A.pick({...boss,id:'x3'},{kind:'echo',token:4})===null);
 g.room={id:'ep1b03',enemies:[]};ok('other zone untouched',A.pick({...boss,id:'x4'},{kind:'prop',token:5})===null);
 g.room={id:'ep1b02',enemies:[]};
 g.localStorage.setItem('storyworld.r471.canonThrow','{"on":false}');ok('switch off → engine default',A.pick({...boss,id:'x5'},{kind:'prop',token:6})===null);
 g=env(p=>!/r80-025/.test(p));const A2=g.__STORYWORLD_CANON_THROW_R471__;ok('art not ready → next ready object (fridge)',A2.pick({...boss},{kind:'prop',token:7})?.key==='fridge');
 g=env(()=>false);ok('no art ready → null (engine default)',g.__STORYWORLD_CANON_THROW_R471__.pick({...boss},{kind:'prop',token:8})===null);
 ok('bed slot declared, pending Dots art',g.__STORYWORLD_CANON_THROW_R471__.inspect().zones.ep1b02.sequence.some(s=>s.key==='bed'&&!s.path));
 g=env(()=>true);g.room={id:'ep1b03',enemies:[]};const A3=g.__STORYWORLD_CANON_THROW_R471__;
 const env1=A3.pick({id:'v',nativeId:'b03-boss',boss:true,hp:9,maxHp:9},{kind:'prop',token:1});ok('envy throws glass (fractured mirror)',env1?.key==='mirror'&&/r80-026\.webp$/.test(env1.path));
 ok('envy keeps throwing glass',A3.pick({id:'v',nativeId:'b03-boss'},{kind:'prop',token:2})?.key==='mirror');
 ok('sloth boss id in envy room untouched',A3.pick({id:'w',nativeId:'b02-boss'},{kind:'prop',token:3})===null);
 ok('inspect counts picks',A.inspect().stats.picks>=8);
}
console.log(`R471 canon-throw cpu check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
