// R92 mob motion fixture sheet (QA only). For one capture at a time it hides
// the other enemies and forces one enemy's display fields (moving / attack
// elapsed), draws, copies the canvas, then restores every field. It never runs
// game ticks with the forced values. Disclose as a fixture, not natural play.
(()=>{
 window.__MOBSHEET__=async(name,pred,count=4)=>{const Q=window.__R89QA__,M=window.__STORYWORLD_VISUAL_R92_MOBS__,gl=document.getElementById('phase1-webgl');
  const picks=[],seen=new Set();for(const e of room.enemies.filter(e=>e.hp>0&&!e.boss&&!e.midboss&&pred(e))){const g=M.groupFor(e);if(g&&!seen.has(g)){seen.add(g);picks.push(e);}if(picks.length>=count)break;}
  const S=gl.width/W,cell=Math.round(150*S);
  const plan=[['idle',false,null,false],['native-move',false,null,true],['native-atk',false,'s',false],['mv-a',true,null,true],['mv-b',true,null,true],['mv-c',true,null,true],['mv-d',true,null,true],['a0',true,.2],['a1',true,.75],['a2',true,'s'],['a3',true,'f']];
  const out=document.createElement('canvas');out.width=plan.length*cell;out.height=Math.max(1,picks.length)*cell;const ox=out.getContext('2d');ox.fillStyle='#111';ox.fillRect(0,0,out.width,out.height);const prev=M.prefs();
  for(const [r,e] of picks.entries()){const shape=e.combatProfile?.attackShape||{windup:.6,active:.13},wind=shape.windup,act=shape.active,g=M.groupFor(e);
   for(const [c,[label,on,el,mv]] of plan.entries()){if(label.startsWith('mv'))await Q.sleep(160);
    const saved=room.enemies.map(o=>[o,o.visible,o.x,o.y,o.moving,o.attack,o.rangedWindup,o.direction,o.hitTimer,o.flash]);
    try{for(const o of room.enemies)o.visible=o===e;e.x=player.x+2.4;e.y=player.y-1.6;e.hitTimer=0;e.flash=0;e.direction='left';M.set({mobMotion:on});e.moving=!!mv;
     const t=el==null?null:el==='s'?wind+act*.5:el==='f'?wind+act+.1:wind*el;e.attack=t==null?null:{elapsed:t,shape154:shape,angle:0};e.rangedWindup=0;
     draw();draw();const q=project(e.x,e.y);ox.drawImage(gl,(q.x-75)*S,(q.y-120)*S,cell,cell,c*cell,r*cell,cell,cell);}
    finally{for(const [o,v,x,y,m,a,rw,d,ht,fl] of saved){o.visible=v;o.x=x;o.y=y;o.moving=m;o.attack=a;o.rangedWindup=rw;o.direction=d;o.hitTimer=ht;o.flash=fl;}M.set(prev);}
    ox.fillStyle='#ddd';ox.font=Math.round(10*S)+'px sans-serif';ox.fillText(g+' '+label,c*cell+3,r*cell+12*S);}}
  draw();return{picks:picks.map(e=>e.nativeId+':'+M.groupFor(e)),post:picks.length?(await Q.post(name,out.toDataURL('image/png'))).status:'none'};};
})();
