// R92 boss dissolution fixture (QA only). finishEncounter and saveGame are
// stubbed for the capture, the boss is placed beside the hero and killed with
// killEnemy, then both stubs are restored; save keys are hashed before and
// after. Reload the page afterwards to discard the fixture state. Disclose as
// an assisted fixture, not natural play.
(()=>{
 window.__BOSSDEATH__=async(nativeId,name,opt={})=>{const Q=window.__R89QA__,B=window.__STORYWORLD_VISUAL_R92_BOSS__,gl=document.getElementById('phase1-webgl');
  const h=async s=>{const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(d)].slice(0,8).map(x=>x.toString(16).padStart(2,'0')).join('');};
  if(opt.off)B.set({bossDeath:false});
  const keys=Object.keys(localStorage).filter(k=>/save/.test(k)),before={};for(const k of keys)before[k]=await h(localStorage.getItem(k));
  const e=room.enemies.find(x=>x.nativeId===nativeId);if(!e)return{error:'no boss '+nativeId,bosses:room.enemies.filter(x=>x.boss||x.midboss).map(x=>x.nativeId)};
  const fe=finishEncounter,sg=saveGame;finishEncounter=()=>{};saveGame=()=>{};
  const S=gl.width/W,cw=Math.round(260*S),ch=Math.round(300*S),times=opt.times||[-1,0,.15,.35,.55,.75,.95,1.15,1.35,1.6,1.9,2.2];
  const out=document.createElement('canvas');out.width=times.length*cw;out.height=ch;const ox=out.getContext('2d');ox.fillStyle='#111';ox.fillRect(0,0,out.width,out.height);const log=[];let t0;
  // opt.asId borrows another boss's strip on this actor (fixture: size follows this actor).
  if(opt.asId){e.nativeId=opt.asId;const idx=await fetch('./assets/r92/boss/index.json').then(r=>r.json()),p=idx.bosses[opt.asId].path;addImage(p,'QA fixture');for(let i=0;i<40&&!readyImage(p);i++)await Q.sleep(100);}const px=player.x,py=player.y,pin=setInterval(()=>{player.x=px;player.y=py;player.moving=false;},16);
  try{e.spawnState='active';e.visible=true;e.x=player.x+(opt.dx??3.2);e.y=player.y+(opt.dy??.4);e.hp=Math.max(1,e.hp);for(const o of room.enemies)if(o!==e)o.visible=false;await Q.sleep(700);
   for(const[c,t]of times.entries()){if(t>=0){if(t0===undefined){e.hp=0;killEnemy(e);t0=performance.now();}const wait=t*1000-(performance.now()-t0);if(wait>0)await Q.sleep(wait);}
    draw();const q=project(e.x,e.y);ox.drawImage(gl,(q.x-130)*S,(q.y-250)*S,cw,ch,c*cw,0,cw,ch);ox.fillStyle='#ddd';ox.font=Math.round(11*S)+'px sans-serif';ox.fillText(t<0?'alive':'t+'+t.toFixed(2)+'s',c*cw+4,14*S);
    log.push({t,hp:Math.round(e.hp),state:e.spawnState,dead:!!e.deadRecorded,plays:B.active().map(p=>p.age)});}}
  finally{clearInterval(pin);finishEncounter=fe;saveGame=sg;if(opt.off)B.set({bossDeath:true});}
  const after={};for(const k of keys)after[k]=await h(localStorage.getItem(k));
  return{post:(await Q.post(name,out.toDataURL('image/png'))).status,stats:B.inspect().stats,err:B.inspect().lastError,savesUnchanged:keys.every(k=>before[k]===after[k]),newKeys:Object.keys(localStorage).filter(k=>/save/.test(k)&&!keys.includes(k)),log};};
})();
