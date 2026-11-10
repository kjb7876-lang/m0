// R597 브라우저 검사(헤드리스, 소프트웨어 렌더링, 3D 끔): 실제 빌드에서 A 키를 진짜 키 입력으로 누르고 있을 때
// Q·W·E·R·F·T 가 저절로 나가는지, S·D 는 안 나가는지, 반자동 auto 가 꺼진 채(R274 +77%)인지, A 를 떼거나 설정을 끄면 멈추는지 잰다.
// GPU·실기기·자연 플레이는 아님.
import {chromium,boot,skip} from '../r444/lib.mjs';
import fs from 'node:fs';
const OUT=process.env.SW_OUT||'/tmp/r597';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.evaluate(()=>enterRegion('dist01',null,{layer:'DREAM',restore:true}));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000});await skip(p);
const prep=()=>p.evaluate(()=>{auto=false;guide=false;route=[];player.hp=player.maxHp=99999;player.resonance=100;player.specialCD=0;player.egoCD=0;player.blinkCD=0;if(player.storyWER)player.storyWER.ready={};
 for(const e of room.enemies)e.damage=0;const live=room.enemies.filter(e=>e.hp>0);
 // 몹 몇 마리를 영웅 곁(2~4칸)으로 모아 사거리 안에 둔다
 live.slice(0,4).forEach((e,i)=>{e.x=player.x+2+i*.5;e.y=player.y+(i%2?1:-1);e.hp=e.maxHp=99999;});room.engaged=true;return live.length;});
const snap=()=>p.evaluate(()=>({t:+time.toFixed(2),stats:window.__STORYWORLD_AUTO_A_R597__.stats(),state:window.__STORYWORLD_AUTO_A_R597__.state(),auto,guide,blinkCD:player.blinkCD,guard:player.guard,ego:player.ego,specialCD:+player.specialCD.toFixed(2),dmg:window.__STORYWORLD_MANUAL_R274__?.damageMult?.()}));
const waitGame=s=>p.evaluate(s=>new Promise(res=>{const t0=time;const f=()=>time>=t0+s?res():setTimeout(f,30);f();}),s);
const out={};
out.enemies=await prep();out.hero=await p.evaluate(()=>player.hero);
out.before=await snap();
await p.keyboard.down('a');await waitGame(6);out.held=await snap();
await p.screenshot({path:OUT+'/held-a.png'});
await p.keyboard.up('a');const s1=(await snap()).stats.beats;await waitGame(2);out.released=await snap();out.beatsAfterRelease=out.released.stats.beats-s1;
// 설정 끄기: 실제 설정 창의 체크박스로
await p.evaluate(()=>showSettings());await p.waitForTimeout(300);out.settingsSection=await p.evaluate(()=>!!document.getElementById('autoAR597Toggle')&&document.getElementById('autoAR597Toggle').checked);
await p.locator('#autoAR597').screenshot({path:OUT+'/settings.png'}).catch(e=>out.shotErr=String(e).slice(0,120));
await p.locator('#autoAR597Toggle').click();out.afterToggle=await p.evaluate(()=>({on:window.__STORYWORLD_AUTO_A_R597__.enabled(),saved:localStorage.getItem('storyworld.r597.autoA')}));
await p.evaluate(()=>closePanel(true));await prep();const s2=(await snap()).stats.beats;
await p.keyboard.down('a');await waitGame(3);out.offHeld=await snap();out.beatsWhileOff=out.offHeld.stats.beats-s2;await p.keyboard.up('a');
// 프레임 시간: 켜고 A 누름 vs 끄고 A 누름
const fr=async(on)=>{await p.evaluate(on=>window.__STORYWORLD_AUTO_A_R597__.set(on),on);await prep();await p.keyboard.down('a');
 const r=await p.evaluate(()=>new Promise(res=>{const fr=[];let last=performance.now();const t0=last;const loop=t=>{fr.push(t-last);last=t;if(t-t0<6000)requestAnimationFrame(loop);else{fr.sort((a,b)=>a-b);res({frames:fr.length,avg:+(fr.reduce((a,b)=>a+b,0)/fr.length).toFixed(1),p95:+fr[Math.floor(fr.length*.95)].toFixed(1)});}};requestAnimationFrame(loop);}));
 await p.keyboard.up('a');return{on,...r};};
out.perf=[await fr(false),await fr(true),await fr(false),await fr(true)];
await p.evaluate(()=>window.__STORYWORLD_AUTO_A_R597__.set(true));
out.errors=errs.slice(0,8);console.log(JSON.stringify(out,null,1));await b.close();
