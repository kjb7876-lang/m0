// R274 손플레이 보상 CPU 검사: 가짜 엔진 위에서 피해·EGO·회피·공명방어·이동·끄기를 행동으로 확인한다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(path.join(__dirname,'../../client-source/manual-bonus-r274.js'),'utf8');
function world(){const store={};const ctx={window:{},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},Math,String,Number,Array,Object,JSON};ctx.window=ctx;
 vm.createContext(ctx);vm.runInContext(`var auto=true,guide=true,time=0,route=[],room={engaged:false,enemies:[{id:'m',x:5,y:0,hp:100}]};
 var player={x:0,y:0,ego:0,egoCD:0,resonance:0,attackCD:1,blinkCD:1,specialCD:1,invReason:'',guard:false,parry:0,invincible:0};var dealt=[],taken=[],moved=[];
 function hitEnemy(e,v){dealt.push(v);return true}
 function hurt(d){if(player.invincible>0)return'invulnerable';if(player.guard&&player.parry>0){gainResonance(10);return'parried'}taken.push(d);return'hit'}
 function gainResonance(v){player.resonance+=v}function moveActor(a,dx,dy){moved.push(dx)}
 function tick(dt){time+=dt;for(const k of ['attackCD','blinkCD','specialCD','ego'])player[k]=Math.max(0,player[k]-dt);moveActor(player,1,0)}`,ctx);
 vm.runInContext(src,ctx);return ctx;}
const run=(c,s)=>vm.runInContext(s,c);let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
let c=world();const M=()=>c.__STORYWORLD_MANUAL_R274__;const e='room.enemies[0]';
const hit=()=>{run(c,`dealt=[];hitEnemy(${e},100)`);return run(c,'dealt[0]');};
ok(Math.abs(hit()-100)<1e-9,'auto+guide on: no bonus');
run(c,'auto=false');ok(Math.abs(hit()-177)<1e-9,'auto off in combat: +77%');
run(c,'guide=false');ok(Math.abs(hit()-254)<1e-9,'both off: +154% additive');
run(c,`${e}.x=20`);ok(Math.abs(hit()-100)<1e-9,'out of combat (>9 tiles, not engaged): no bonus');
run(c,'room.engaged=true');ok(Math.abs(hit()-254)<1e-9,'room.engaged counts as combat');
// EGO stacks
run(c,'player.ego=3;tick(.1)');ok(M().state().ego===1,'EGO activation -> 1 stack');
ok(Math.abs(hit()-254*1.77)<1e-6,'EGO stack multiplies damage x1.77');
run(c,'player.ego=0;tick(.1);player.ego=3;tick(.1)');ok(M().state().ego===2,'second EGO -> 2 stacks');
run(c,'for(let i=0;i<69;i++)tick(.1)');ok(M().state().ego===1,'first stack expires after 7s, second remains');
run(c,'for(let i=0;i<20;i++)tick(.1)');ok(M().state().ego===0,'all EGO stacks expire');
// dodge stacks
run(c,"player.invincible=1;player.invReason='회피 무적';hurt(10);time+=.3;hurt(10);time+=.1;hurt(10)");ok(M().state().dodge===2,'dodge stacks, throttled .26s');
ok(Math.abs(M().statMult()-1.14)<1e-9,'two dodge stacks add: 1+2x.07');
run(c,"player.invReason='피격 보호';time+=1;hurt(10)");ok(M().state().dodge===2,'non-dodge invulnerability is not a dodge');
// damage reduction & cooldown & move
run(c,'player.invincible=0;taken=[];hurt(100)');ok(Math.abs(run(c,'taken[0]')-100/1.14)<1e-6,'incoming damage / stat mult');
run(c,'player.attackCD=1;moved=[];tick(.1)');ok(Math.abs(run(c,'player.attackCD')-(1-.1*1.14))<1e-6,'cooldown recovery x stat mult');ok(Math.abs(run(c,'moved[0]')-1.14)<1e-9,'manual walking speed x stat mult');
run(c,"route=[{x:1,y:1}];moved=[];tick(.01);route=[]");ok(run(c,'moved[0]')===1,'route following not sped up');
run(c,'for(let i=0;i<8;i++){player.ego=0;tick(.01);player.ego=3;tick(.01)}');ok(M().state().ego===7,'EGO stacks capped at 7');
run(c,'player.attackCD=1;moved=[];tick(.1)');ok(run(c,'moved[0]')===1.35,'move cap 1.35');ok(Math.abs(run(c,'player.attackCD')-(1-.1*2.5))<1e-6,'cooldown cap 2.5');
run(c,'player.invincible=0;taken=[];hurt(100)');ok(Math.abs(run(c,'taken[0]')-50)<1e-9,'damage reduction floor 50%');
// parry
c=world();run(c,'auto=false;guide=false;room.engaged=true;player.guard=true;player.parry=1;hurt(5)');ok(run(c,'player.resonance')===10,'parry itself not boosted');
ok(M().state().parry,'parry buff on');run(c,'gainResonance(10)');ok(Math.abs(run(c,'player.resonance')-27.7)<1e-9,'resonance +77% while parry buff');
run(c,'time+=7.1;gainResonance(10)');ok(Math.abs(run(c,'player.resonance')-37.7)<1e-9,'parry buff expires after 7s');
run(c,'guide=true;hurt(5);gainResonance(10)');ok(Math.abs(run(c,'player.resonance')-57.7)<1e-9,'parry buff needs both off');
// auto on blocks EGO/dodge stacks
c=world();run(c,'auto=true;guide=false;room.engaged=true;player.ego=3;tick(.1)');ok(M().state().ego===0,'EGO stack needs both off');
run(c,'player.invincible=1;player.invReason=\'회피\';hurt(5)');ok(M().state().dodge===0,'dodge stack needs both off');
// switch off
c=world();run(c,'auto=false;guide=false;room.engaged=true');M().set(false);ok(Math.abs(hit()-100)<1e-9,'set(false) disables');ok(run(c,"localStorage.getItem('storyworld.r274.manual')")==='0','off persisted');
// 빌드 연결: 런타임 사본·스크립트 순서·공개 검증 목록·CI.
{const R=path.join(__dirname,'../..'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8'),idx=RT('index.html');
 ok(RT('manual-bonus-r274.js')===src,'runtime copy matches');
 ok(/hwando-r271\.js"><\/script>(<script src="\.\/hwando-r277\.js"><\/script>)?<script src="\.\/manual-bonus-r274\.js"><\/script>/.test(idx)&&idx.indexOf('manual-bonus-r274.js')<idx.indexOf('combat-r118.js'),'loads after hwando-r271, before combat-r118');
 ok(/'manual-bonus-r274\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')),'in public verify list');
 {const mb=fs.readFileSync(path.join(R,'client-source','manual-bonus-r274.js'),'utf8');ok(/position:absolute;left:50%;top:2px/.test(mb)&&/font:500 10px/.test(mb)&&/querySelector\('footer'\)/.test(mb)&&!/top:84px/.test(mb),'R288: buff chip is tiny text in the HUD footer gap, not a box over the battlefield');}
 ok(/r96\/qa\/r274\/r274-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')),'in CI');}
console.log(JSON.stringify({ok:true,checks:n,revision:M().revision}));
