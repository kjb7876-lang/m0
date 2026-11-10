const {createHarness}=require('./harness.cjs');
(async()=>{const h=createHarness();await h.boot();await h.start();
console.log(h.run(`Object.keys(window).filter(k=>/HOSPITAL|DOOR|EGO|ROUTES|PROGRESS/.test(k)).map(k=>[k,Object.keys(window[k]||{})])`));
console.log('BASE',h.run(`({room: {keys:Object.keys(room),exploration:room.exploration, enemies:room.enemies.map(e=>({id:e.id,hp:e.hp,maxHp:e.maxHp,spawnState:e.spawnState,x:e.x,y:e.y,boss:e.boss,midboss:e.midboss}))},ego:__STORYWORLD_EGO151__.inspect(),save:serializeSave().ego151})`));
})().catch(console.error);
