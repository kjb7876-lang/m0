'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const runtime = path.join(root, 'runtime-text');
const source = fs.readFileSync(path.join(root, 'client-source/mob-gait-r613.js'), 'utf8');
const catalog = JSON.parse(fs.readFileSync(path.join(runtime, 'assets/sw0014/ordinary-walk/index.json'), 'utf8')).assets;
const wrath = catalog.find((row) => row.name === 'wrath-satan');
const pilgrim = catalog.find((row) => row.name === 'horned-swamp-demon-pilgrim');

function fixture(row, first) {
  const [mode, zone, nativeId] = row.targets[0].split(':');
  const local = { front: first !== false, Math, Date, localStorage: {getItem: () => null, setItem(){} } };
  local.window = local;
  vm.createContext(local);
  local.row = row;
  local.e = {id:'fixture', nativeId, name:'mob', x:0, y:0, hp:100, spawnState:'active', moving:false};
  vm.runInContext(`
    var time = 0, layer = ${JSON.stringify(mode)}, zone = ${JSON.stringify(zone)}, room = {id: zone};
    var shown = row.source + (row.tint ? '#' + row.tint : ''), offered = row.rect.slice(), requests = [];
    var ctx = {commands: [], drawImage(){}}, ready = front, directed = false;
    var box = [[0,0],[100,0],[100,140],[0,140]];
    function readyImage(p) { return p === row.file && ready ? {image:{naturalWidth: row.cell[0] * 4, naturalHeight: row.cell[1]}} : null; }
    function addImage(p) { requests.push(p); }
    function drawEnemy(e) {
      ctx.commands.push({kind:'image', sourcePath:shown, sourceRect:offered, r974:directed, image:{}, owner:{id:e.id, kind:'enemy', bodyPath:shown}, points:box});
    }
  `, local);
  vm.runInContext(source, local);
  const run = (cmd) => vm.runInContext(cmd, local);
  function frame(step = .11) {
    run(`time+=.11;e.x+=${step};ctx.commands.length=0;drawEnemy(e)`);
    return local.ctx.commands[0];
  }
  return {e:local.e, run, frame, get api(){return local.__STORYWORLD_MOB_GAIT_R613__;}};
}

test('ordinary walk tracks actual movement and returns to original immediately on rest or windup', () => {
  const f = fixture(wrath);
  f.frame(0);
  f.e.moving = true;
  const paths = new Set(), frames = new Set();
  for (let i = 0; i < 16; i++) {
    const drawn = f.frame();
    paths.add(drawn.sourcePath);
    frames.add(drawn.sourceRect[0]);
  }
  assert.deepEqual([...paths], [wrath.file]);
  assert.equal(frames.size, 4);
  const art = f.frame();
  assert.equal(art.owner.bodyPath, wrath.file);
  const [a, b, , d] = art.points;
  const [px, py] = wrath.pad;
  assert.ok(Math.abs(a[0] + (b[0] - a[0]) * px / (1 + 2 * px)) < 1e-9);
  assert.ok(Math.abs(a[1] + (d[1] - a[1]) * py / (1 + 2 * py)) < 1e-9);
  f.e.moving = false;
  assert.equal(f.frame(0).sourcePath, wrath.source);
  f.e.moving = true;
  assert.equal(f.frame(0).sourcePath, wrath.source);
  f.e.rangedWindup = .3;
  assert.equal(f.frame().sourcePath, wrath.source);
  f.e.rangedWindup = 0;
  assert.equal(f.frame(2).sourcePath, wrath.source);
});

test('registered source requires exact selected crop, never overrides a direction sheet or a fixed actor', () => {
  const f = fixture(wrath);
  f.frame(0);
  f.e.moving = true;
  f.run('offered = [0, 30, ...row.rect.slice(2)]');
  assert.equal(f.frame().sourcePath, wrath.source);
  f.run('offered = row.rect.slice(); directed = true');
  assert.equal(f.frame().sourcePath, wrath.source);
  f.run('directed = false');
  f.e.r75Tower = true;
  assert.equal(f.frame().sourcePath, wrath.source);
  f.e.r75Tower = false; f.e.midboss = true;
  assert.equal(f.frame().sourcePath, wrath.source);
  f.e.midboss = false;
  f.run("zone = 'cult03'; room.id = zone");
  assert.equal(f.frame().sourcePath, wrath.source);
});

test('cold sheet retains the original art and retries, then the next displacement swaps the sheet', () => {
  const f = fixture(wrath, false);
  f.frame(0);
  f.e.moving = true;
  assert.equal(f.frame().sourcePath, wrath.source);
  assert.deepEqual(Array.from(f.run('requests')), [wrath.file]);
  f.run('time+=3.15');
  assert.equal(f.frame().sourcePath, wrath.source);
  assert.deepEqual(Array.from(f.run('requests')), [wrath.file, wrath.file]);
  f.run('ready=true');
  assert.equal(f.frame().sourcePath, wrath.file);
});

test('art retains exact precolored pilgrim variant', () => {
  const f = fixture(pilgrim);
  f.frame(0);
  f.e.moving = true;
  const rendered = f.frame();
  assert.equal(rendered.sourcePath, pilgrim.file);
  assert.equal(rendered.immutableTint.r1226Tint, true);
  assert.equal(rendered.immutableTint.r1226Src, pilgrim.source);
  f.run('shown = row.source');
  assert.equal(f.frame().sourcePath, pilgrim.source);
});

test('generated catalog has 4 valid source cells and bounded dimensions for every asset', () => {
  for (const r of catalog) {
    assert.equal(r.frames, 4, r.name);
    assert.ok(r.cell.every((x)=>Number.isInteger(x)&&x>0&&x<=192), r.name);
    assert.ok(r.targets.length && r.sha256 && r.sourceSha256, r.name);
    assert.equal(fs.statSync(path.join(runtime,r.file)).size,r.bytes,r.name);
  }
});
