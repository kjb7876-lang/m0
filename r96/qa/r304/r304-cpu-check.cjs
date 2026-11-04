// R304 CPU 검사: 라우렌 기본공격 저퀄 VFX(사용자 2026-11-04).
//  재현: R292 이후 라우렌 기본공격 = R292 'lauren/basic' 가는 번개 띠가 재생되고 손그림 수정 창끝(VFX.slash)은 숨겨지며,
//  R163 pxf 'silver-slash' 평면 파스텔 띠가 그대로 그려졌다. 고친 뒤: 띠 재생 없음·VFX.slash 그려짐·pxf silver-slash(라우렌 공격만) 안 그림.
//  다른 영웅(환도 basic 띠·숨김)과 라우렌 블링크 띠는 그대로.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const SRC=fs.readFileSync(process.env.R304_SRC||path.join(R,'client-source/skill-fx-r292.js'),'utf8');
ok(fs.readFileSync(path.join(R,'runtime-text/skill-fx-r292.js'),'utf8')===fs.readFileSync(path.join(R,'client-source/skill-fx-r292.js'),'utf8'),'runtime copy matches');
const IDX=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r292/fx/index.json'),'utf8'));
const ENGINE=`var time=0,TILE=32,zoom=1,W=800,H=600,effects=[];var VFX={slash:'v/slash',blink:'v/blink',flare:'v/flare'};
var player={hero:'lauren',x:5,y:5,hp:100,combo:0,attackCD:0,blinkCD:0,specialCD:0};var foe={x:8,y:5};
function project(x,y){return{x:(x-y)*TILE+W/2,y:(x+y)*TILE*.5+H/2}}function actorHeight(){return 66}function storyAim22(){return 0}function nearestEnemy(){return foe}
function readyImage(p){return{image:{p}}}function ensureImages(){return Promise.resolve(1)}
function fx(type,x,y,opt={}){effects.push({type,x,y,age:0,life:.3,...opt})}
function basicAttack(){if(player.attackCD>0)return;player.combo++;player.attackCD=.4;fx('slash',player.x,player.y,{asset:VFX.slash,angle:0});
 effects.push({type:'pxfSprite',x:player.x,y:player.y,age:0,life:.3,pxfHero:player.hero,pxfKey:player.combo%2?'silver-slash':'extra-02',pxfEvent:'pxf-basic:'+player.combo,pxfStage:'attack'});}
function blink(){if(player.blinkCD>0)return;player.x+=2;player.blinkCD=4;fx('sigil',player.x,player.y,{asset:VFX.blink})}
var drawn=[];function drawEffect(e){drawn.push(e.type+(e.pxfKey?':'+e.pxfKey:''))}function tick(dt){time+=dt}async function enterRegion(){}
var ctx={save(){},restore(){},translate(){},rotate(){},scale(){},drawImage(){}};`;
function world(){const c={Math,JSON,Object,Array,String,Number,Promise,Date,Map,Set,console,localStorage:{getItem:()=>null,setItem(){}},fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve(IDX)})};c.window=c;vm.createContext(c);vm.runInContext(ENGINE,c);vm.runInContext(SRC,c);return c;}
(async()=>{const c=world();await new Promise(r=>setImmediate(r));const run=s=>vm.runInContext(s,c),X=c.__STORYWORLD_SKILL_FX_R292__;
 run(`player.hero='lauren';effects=[];drawn=[];basicAttack();for(const e of effects)drawEffect(e)`);
 const d=run('drawn');ok(!X.inspect().stats.plays['lauren:basic'],'lauren basic strip not played');
 ok(d.includes('slash'),'lauren painted VFX.slash drawn: '+d);ok(!d.some(x=>x.startsWith('pxfSprite')),'lauren pxf basic swing not drawn: '+d);
 run(`player.attackCD=0;effects=[];drawn=[];basicAttack();for(const e of effects)drawEffect(e)`);ok(!run('drawn').some(x=>x.startsWith('pxfSprite')),'lauren pxf extra-02 swing not drawn too');
 run(`player.attackCD=0;player.blinkCD=0;effects=[];drawn=[];blink();for(const e of effects)drawEffect(e)`);ok(X.inspect().stats.plays['lauren:blink']===1,'lauren blink strip kept');
 run(`player.hero='hwando';player.attackCD=0;effects=[];drawn=[];basicAttack();for(const e of effects)drawEffect(e)`);
 ok(X.inspect().stats.plays['hwando:basic']===1&&!run('drawn').includes('slash'),'hwando basic strip + generic slash hidden unchanged');ok(run('drawn').some(x=>x.startsWith('pxfSprite')),'other heroes keep pxf');
 console.log('R304 CPU check: '+n+' checks passed');})().catch(e=>{console.error(e);process.exit(1);});
