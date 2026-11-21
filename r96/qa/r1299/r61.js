const M=window.__R1299;M.rows.length=0;M.real=player;M.base=new Set(room.enemies.filter(e=>!(e.boss||e.midboss)));
const S=window.__STORYWORLD_SUMMONS_R61__;const bs=room.enemies.filter(e=>(e.boss||e.midboss)&&e.hp>0);
room.engaged=true;player.hp=player.maxHp=9e8;player.invincible=1e9;
room.enemies=room.enemies.filter(o=>bs.includes(o)||!(o.hp>0)).concat(room.enemies.filter(o=>!bs.includes(o)&&o.hp>0).slice(0,4).map(o=>{o.x=player.x-6;o.y=player.y+4;o.speed=0;o.damage=0;return o;}));
bs.forEach((e,i)=>{e.spawnState='active';e.hidden=false;e.x=player.x+3+i*2;e.y=player.y+(i?1.5:-1);e.damage=0;});
const t0=time;const log=[];
for(let k=0;k<8;k++){for(const e of bs){if(e.hp>0){e.hp=e.maxHp*(k<4?.7:.3);try{const st=S.state(e);st.nextAt=0;S.request(e);}catch(x){log.push(String(x).slice(0,80));}}}await __waitG(1.3);}
const units=room.enemies.filter(e=>e.r61Summoned&&e.hp>0).map(e=>({id:e.id,kind:e.r61Summoned.kind,nid:e.nativeId,name:e.name,owner:e.r61Summoned.owner,ds:e.defScale,boss:!!e.boss,mid:!!e.midboss}));
await __waitG(3);const units2=room.enemies.filter(e=>e.r61Summoned&&e.hp>0).length;return {units2,t0,units,log,metrics:S.inspect().metrics,owners:bs.map(e=>({id:e.id,nid:e.nativeId,ds:e.defScale}))};
