// R269 미카엘라 스킬 날개 자세(R101 칠한 날개, 조잡한 'wing' 빼기) · 영웅별 Q/Z/C 원형 나누기 · 공명방어 영웅색 막과 둘레 문양 · EGO 무색 성광은 미카엘라만.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const files=['hero-skills-r269.js','fx-sprites-r106.js','fx-d2s-r106.js','fx-eden-r108.js','polish-r101.js'];
ok('runtime copies match',files.every(f=>RT(f)===C(f)));
ok('hero-skills-r269 is loaded',RT('index.html').includes('<script src="./hero-skills-r269.js"></script>'));
const H=C('hero-skills-r269.js');
function load(heroName){const ctx={localStorage:{getItem:()=>null,setItem(){}},console,Math,JSON,Array,Object,Number,String,Set,Map,setTimeout:()=>0,performance:{now:()=>0}};ctx.window=ctx;
 ctx.time=10;ctx.player={hero:heroName,specialCD:0,skillAnim:0,x:0,y:0};let filt=null;ctx.__STORYWORLD_FX_SPRITES_R106__={addFilter:f=>{filt=f;return 1;}};
 const frames=[];ctx.requestAnimationFrame=f=>{frames.push(f);return 1;};ctx.special=function(){ctx.player.specialCD=5;};ctx.fx=function(){};ctx.drawEffect=function(){};ctx.effects=[];
 vm.createContext(ctx);vm.runInContext(H,ctx);return {ctx,api:ctx.__STORYWORLD_HERO_SKILLS_R269__,filt:()=>filt,step:()=>{const f=frames.shift();if(f)f();}};}
{const M=load('michaela');ok('registers a sprite filter with fx-sprites-r106',typeof M.filt()==='function');
 const f=M.filt();ok('Michaela: the crude additive R106 wing and the stacked seraph back wings are filtered out',f('wing',{})===false&&f('wingback',{blend:'lighter'})===false&&f('wingback-f',{})===false);
 ok('Michaela: R101 painted aura wings (source-over) and other sprites still draw',f('wing',{blend:'source-over'})===true&&f('wingside',{})===true&&f('cross',{})===true&&f('pillar',{})===true);
 ok('no pose while idle',M.api.wingPose(M.ctx.player)===null);
 M.ctx.special();ok('Q opens a wing pose',M.api.wingPose(M.ctx.player)?.kind==='q'&&M.api.wingPose(M.ctx.player).open===true);
 M.api.start('x');const px=M.api.wingPose(M.ctx.player);ok('X (genesis) folds the wings, Z/C open them',px.kind==='x'&&px.open===false);
 M.api.start('r');M.ctx.time=10.35;const pr=M.api.wingPose(M.ctx.player);ok('C seraph grows the wings to about 2.2x',pr.kind==='r'&&pr.scale>2);
 M.ctx.time=12;ok('the pose ends after its life',M.api.wingPose(M.ctx.player)===null);}
{const N=load('hunter');ok('other heroes are not filtered',N.filt()('wing',{})===true);
 const k=(h,s)=>N.api.slotKind(h,s);
 ok('Z and C get their own archetype, different from Q, for every hero but Michaela',[['hwando','iai'],['seoha','orb'],['neon','chain'],['lauren','meteor'],['hunter','multishot'],['slayer','fissure']].every(([h,q])=>k(h,'w')&&k(h,'r')&&k(h,'w')!==q&&k(h,'r')!==q&&k(h,'w')!==k(h,'r')));
 ok('기억사수 Q (directional replay volley) uses multishot, C keeps the nova',k('gunner','q')==='multishot'&&k('gunner','r')==='nova');
 ok('user-confirmed Q visuals stay (Lauren violet meteor etc.): no q override except 기억사수',['hwando','seoha','neon','lauren','hunter','slayer','michaela'].every(h=>!k(h,'q')));}
const D=C('fx-d2s-r106.js');ok('fx-d2s SLOT_KIND keeps Michaela and falls back to the R269 slot table for other heroes',/const SLOT_KIND=new Proxy\(Object\.freeze\(\{michaela:Object\.freeze\(\{w:'aegis',e:'wingdash',r:'seraph'\}\)\}\),\{get:\(o,h\)=>o\[h\]\|\|window\.__STORYWORLD_HERO_SKILLS_R269__\?\.slotsFor\?\.\(h\)/.test(D)&&/const kind=SLOT_KIND\[hero\]\?\.\[slot\]\|\|ARCH\[hero\]/.test(D));
ok('slotsFor gives the whole per-hero table and nothing when switched off',(()=>{const N=load('hwando');const a=N.api.slotsFor('hwando')?.w==='hammer';N.api.set(false);return a&&N.api.slotsFor('hwando')===null;})());
const E=C('fx-eden-r108.js');ok('guard dome is tinted with the hero palette (falls back untinted)',/tint=F\?\{a:F\.a,b:F\.b\}:null,nm=e\.t<form\?'dome\.form':'dome\.loop'/.test(E)&&/if\(!ok\)ok=clip\(nm,tt,x,y,size,\{alpha:al,noVeil:true\}\)/.test(E));
ok('EGO untinted holy burst only for Michaela',/player\?\.hero==='michaela'\|\|!window\.__STORYWORLD_HERO_SKILLS_R269__\?\.on\?\.\(\)\)clip\('holy\.burst'/.test(E));
const P=C('polish-r101.js');ok('R101 wings take the R269 pose (scale, flap, tilt, open/folded) and show during skills at any tier',/const pose=skillPose\(p\)/.test(P)&&/\*\(pose\?pose\.scale:1\)/.test(P)&&/t>=5\|\|awake\|\|skillPose\(p\)/.test(P)&&/p\.samong>0\|\|skillPose\(p\)\)return\{on:true/.test(P));
const S=C('fx-sprites-r106.js');ok('fx-sprites draw honours filters',/if\(FILT\.length\)for\(const f of FILT\)/.test(S)&&/addFilter:f=>/.test(S));
for(const f of files)try{new vm.Script(C(f));ok('syntax '+f,true);}catch(e){ok('syntax '+f,false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R269 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
