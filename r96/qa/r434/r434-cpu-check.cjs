// R434 CPU check — 등급 발밑 기운, 고요할 때 HUD 낮추기, 곡 이름 한 곳만, R409 영웅 고유색 테.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='readability-r434.js',src=C(F);
ok('runtime copy matches client source',RT(F)===src);
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html');
ok('script tag once, right after access-r420 and before combat-read-r409',html.split('"./'+F+'"').length===2&&/<script src="\.\/access-r420\.js"><\/script><script src="\.\/readability-r434\.js"><\/script>(?:<script src="\.\/surface-r435\.js"><\/script>)?(?:<script src="\.\/bossroom-tidy-r438\.js"><\/script>)?(?:<script src="\.\/props-space-r447\.js"><\/script>)?<script src="\.\/combat-read-r409\.js"><\/script>/.test(html));
ok('listed in verify-r96-public.py',/'readability-r434\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('presentation only: no damage/cooldown/hp/save writes',!/\.hp\s*=[^=]|attackCD\s*=|\.damage\s*=|saveGame|localStorage\.setItem\((?!KEY)/.test(src));
ok('no hexagram/rune sprites (enemy aura uses glow/ring only)',!/'rune'|'runecross'|'hex'/.test(src));
ok('Mammon vault skipped',/SKIP_REGION=new Set\(\['ep1b06'\]\)/.test(src));
// ---- vm run with a fake recorder ----
function env(o={}){const draws=[],scopes=[],toasts=[];const S={on:()=>true,draw:(name,F,x,y,w,h,opt)=>{draws.push({name,F,x,y,w,h,opt});return true;}};
 const store=new Map(o.store||[]);const cls=new Set(o.cls||[]);
 const e={window:{},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},performance:{now:()=>e.__now},__now:o.now??100000,
  setInterval:()=>0,addEventListener:()=>{},getComputedStyle:()=>({display:'block',visibility:'visible'}),
  document:{getElementById:()=>null,createElement:()=>({}),head:{appendChild:()=>{}},querySelector:q=>q==='header'?{getBoundingClientRect:()=>({height:o.headerH??44})}:null,body:{classList:{contains:c=>cls.has(c),toggle:(c,v)=>v?cls.add(c):cls.delete(c),remove:c=>cls.delete(c)}}},
  time:0.2,W:1280,actorHeight:()=>60,project:(x,y)=>({x:x*10,y:y*10}),ctx:{scope(meta,fn){scopes.push(meta);fn();}},
  room:{id:o.region||'dist00',engaged:true,enemies:o.enemies||[]},player:{x:0,y:0,hero:'hwando'},modal:false,storyScene:null,
  drawEnemy:function(){return 'base';},toast:function(m){toasts.push(m);}};
 e.window=e;e.window.__STORYWORLD_FX_SPRITES_R106__=S;e.window.__STORYWORLD_HUD_BGM_HWANDO_R313__={currentText:()=>o.bgm??'♪ 쇼팽 · 연습곡'};
 vm.createContext(e);vm.runInContext(src,e);return{e,draws,scopes,toasts,cls};}
{const t=env();t.e.drawEnemy({id:'a',x:1,y:1,hp:5});ok('ordinary mob: no aura',t.draws.length===0);}
{const t=env();t.e.drawEnemy({id:'m',x:1,y:1,hp:5,wardChampionR81:true});ok('midboss: dark ring, ground-aligned scope, no bright blood',t.draws.length===1&&t.draws[0].name==='ring'&&t.scopes[0]?.groundAligned===true&&t.draws.every(d=>d.F.b[0]<=160));}
{const t=env();t.e.drawEnemy({id:'b',x:1,y:1,hp:5,boss:true});ok('boss: deep ring + blood pulse, no glow (white core)',t.draws.length===2&&t.draws[1].F.b[0]===209&&!t.draws.some(d=>d.name==='glow'));}
{const t=env();t.e.drawEnemy({id:'b',x:1,y:1,hp:0,boss:true});ok('dead boss: no aura',t.draws.length===0);}
{const t=env({region:'ep1b06'});t.e.drawEnemy({id:'b',x:1,y:1,hp:5,boss:true});ok('Mammon vault: no aura',t.draws.length===0);}
{const t=env({store:[['storyworld.r434.readability','{"rank":false}']]});t.e.drawEnemy({id:'b',x:1,y:1,hp:5,boss:true});ok('rank off switch',t.draws.length===0);}
{const t=env();t.e.toast('♪ 쇼팽 — Chopin',2.6);t.e.toast('적 처치',2);ok('music toast skipped while header shows track; other toasts kept',t.toasts.length===1&&t.toasts[0]==='적 처치');}
{const t=env({headerH:0});t.e.toast('♪ 쇼팽 — Chopin',2.6);ok('music toast kept when header hidden (mobile)',t.toasts.length===1);}
// R409 hero rim uses hero palette, red heroes use silver
{const s9=C('combat-read-r409.js');ok('R409 hero rim from R302 palette, red heroes silver, off switch',/heroLook\(\)/.test(s9)&&/RED_HERO=new Set\(\['michaela','slayer','hunter'\]\)/.test(s9)&&/heroRim!==false/.test(s9)&&RT('combat-read-r409.js')===s9);}
console.log(bad?`${bad}/${n} FAILED`:`all ${n} passed`);process.exit(bad?1:0);
