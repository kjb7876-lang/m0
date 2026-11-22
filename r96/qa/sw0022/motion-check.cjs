'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const runtime = path.resolve(__dirname, '../../runtime-text');
const html = fs.readFileSync(path.join(runtime, 'index.html'), 'utf8');
assert.ok(html.indexOf('kairo-motion-sw0022-data.js') >= 0 && html.indexOf('kairo-motion-sw0022-data.js') < html.indexOf('move-dir-r974.js'));
const manifest = JSON.parse(fs.readFileSync(path.resolve(runtime, '../runtime-manifest.json')));
const runtimeHashes = new Map(manifest.files.map(asset => [asset.path, asset.sha256]));
const intake = JSON.parse(fs.readFileSync(path.join(runtime, 'assets/sw0022/index.json')));
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const assets = new Map(intake.assets.map(asset => [asset.path, asset]));
const context = {
  window: {}, room: { id: 'kair04', layer: 'STORY' }, time: 0,
  localStorage: { getItem: () => null }, ctx: { commands: [] }, settings: {},
  project: (x, y) => ({ x: x-y, y: (x+y)*.5 }),
  readyImage(p) {
    const a = assets.get(p);
    return a ? {image: {width: a.size[0], height: a.size[1]}} : null;
  },
  drawEnemy(e) {
    const [,,w,h] = e.sprite.rect;
    context.ctx.commands.push({kind:'image', owner:{kind:'enemy'}, sourcePath:e.sprite.path,
      sourceRect:e.sprite.rect, points:[[0,0],[w,0],[w,h],[0,h]]});
  }
};
vm.createContext(context);
for (const script of ['kairo-motion-sw0022-data.js','move-dir-r974.js']) {
  vm.runInContext(fs.readFileSync(path.join(runtime, script),'utf8'), context, { filename: script });
}
const table = context.window.__STORYWORLD_KAIRO_SW0022__;
function draw(id, sprite, direction, options = {}) {
  const delta = {up:[-.04,-.04],down:[.04,.04],right:[.04,-.04],left:[-.04,.04],idle:[0,0]}[direction];
  const e = {id, nativeId:id, hp:100, x:10, y:10, sprite, ...options};
  const rows = [];
  for (let i=0;i<32;i++) {
    context.time += .05;
    e.x += delta[0]; e.y += delta[1];
    context.ctx.commands = [];
    context.drawEnemy(e);
    rows.push(context.ctx.commands[0]);
  }
  return rows;
}
assert.equal(intake.archives, 74);
assert.equal(assets.size, intake.assets.length);
let directions = 0;
for (const [id, animation] of Object.entries({...table.actors,...table.mobs})) {
  if (typeof animation === 'string') continue;
  for (const [direction, sprite] of Object.entries(animation.dirs)) {
    const art = assets.get(sprite.path);
    assert.ok(art);
    const file = fs.readFileSync(path.join(runtime, sprite.path));
    assert.equal(sha256(file), art.sha256);
    assert.equal(sha256(file), runtimeHashes.get(sprite.path));
    assert.ok(sprite.cell*sprite.n <= 2048);
    assert.equal(art.frames, sprite.n);
    for (const body of animation.idle) {
      const rows = draw(id, body, direction);
      const usingSheet = rows.filter(c => c.sw0022);
      assert.ok(usingSheet.length >= 15, `${id} ${direction} ${body.path}`);
      assert.ok(usingSheet.every(c => c.sourcePath===sprite.path && c.sourceRect[2]===sprite.cell));
      assert.equal(new Set(usingSheet.map(c=>c.sourceRect[0])).size, sprite.n);
      assert.ok(usingSheet.every(c => c.points[1][0] > c.points[0][0]));
    }
    directions++;
  }
}
const row = table.actors['kair-guardian-01'];
const body = row.idle[0];
for (const [direction,options] of [['left',{}],['idle',{}],['right',{attack:{}}],['right',{rangedWindup:1}],['right',{hitTimer:1}],['right',{stationary:true}],['right',{r286:{mode:'dash'}}],['right',{spawnState:'spawning'}]]) {
  assert.ok(draw('kair-guardian-01',body,direction,options).every(c => !c.sw0022));
}
for (const room of [{id:'kair04',layer:'DREAM'},{id:'u204',layer:'STORY'},{id:'kair04',layer:'STORY',samongR103:true}]) {
  context.room=room;
  assert.ok(draw('kair-guardian-01',body,'right').every(c => !c.sw0022));
}
context.room={id:'kair01',layer:'STORY'};
const mob = table.mobs['time-connector'];
assert.ok(draw('kair-academy-wave-2',mob.idle[0],'right').some(c=>c.sw0022));
assert.ok(draw('mb-copy',mob.idle[0],'right',{boss:true}).every(c=>!c.sw0022));
assert.ok(draw('kair-guardian-01',{...body,path:'another-idle.webp'},'right').every(c=>!c.sw0022));
assert.equal(context.window.__STORYWORLD_MOVE_DIR_R974__.inspect().stats.errors,0);
assert.equal(directions, assets.size);
console.log(`${intake.archives} archives, ${intake.actors} actors, ${directions} directions; every frame and fallback passed`);
