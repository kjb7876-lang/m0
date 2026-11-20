const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {test} = require('node:test');

const code = fs.readFileSync(path.join(__dirname, '../../client-source/gunner-aim-r991.js'), 'utf8');
const degrees = value => value * Math.PI / 180;
const targetAt = value => {
  const angle = degrees(value);
  return {x: 2 * Math.sin(angle) + Math.cos(angle), y: 2 * Math.sin(angle) - Math.cos(angle)};
};
const worldAngle = value => { const {x, y} = targetAt(value); return Math.atan2(y, x); };
const actor = () => ({hero: 'gunner', x: 0, y: 0, combo: 0, attackAnim: 0, skillAnim: 0, moving: false});
const oldAttack = 'assets/r143/attack/gunner/attack-e.webp';
const oldWalk = 'assets/r128/gunner/walk-se.webp';
const newWalk = 'assets/sw0015/gunner/walk-se.webp';
const diagonal = 'assets/r1101c/gunner/attack-se9.webp';
const mirrored = command => command.points[1][0] < command.points[0][0];

function fixture() {
  const sb = {
    window: {}, document: {readyState: 'complete'}, player: actor(), ctx: {commands: []}, room: {},
    time: 1, zoom: 1, TILE: 64, actorHeight: () => 66, blocked: () => false,
    storyAim22: () => worldAngle(135), nearestEnemy: () => sb.enemy,
    project: (x, y) => ({x: (x-y)*64, y: (x+y)*32}),
    readyImage: src => sb.cold && src.startsWith('assets/sw0015/') ? null : {image: {src, naturalWidth: 1536, naturalHeight: 256}},
    ensureImages: () => Promise.resolve(),
    makeShot(x, y, angle) {
      return {x, y, vx: Math.cos(angle)*16, vy: Math.sin(angle)*16, friendly: true, damage: 12, life: .7};
    },
    basicAttack(force) {
      const enemy = sb.enemy;
      if (!enemy && !force) return null;
      sb.player.combo++;
      sb.player.attackCD = .5;
      sb.player.attackAnim = .24;
      return sb.makeShot(0, 0, enemy ? Math.atan2(enemy.y, enemy.x) : sb.storyAim22());
    },
    drawHero() { sb.ctx.commands.push(sb.command); }
  };
  vm.createContext(sb);
  vm.runInContext(code, sb);
  function draw(kind, mirror = false, frame = 1, scale = .4, src = kind === 'attack' ? oldAttack : oldWalk) {
    const f = mirror ? -1 : 1, cw = 192, ch = 256;
    const left = -f*96*scale, right = left+f*cw*scale, top = -226*scale, bottom = top+ch*scale;
    sb.command = {kind: 'image', owner: {kind: 'hero'}, sourcePath: src, sourceRect: [frame*cw, 0, cw, ch],
      points: [[left,top],[right,top],[right,bottom],[left,bottom]], r143Attack: kind === 'attack', r121Walk: kind === 'walk'};
    sb.ctx.commands = [];
    sb.drawHero();
    return sb.ctx.commands[0];
  }
  return {sb, draw, api: sb.window.__STORYWORLD_GUNNER_AIM_R991__};
}

test('new diagonal gait keeps each input frame, direction and foot pivot', () => {
  const {draw} = fixture();
  for (const mirror of [false, true]) for (let i = 0; i < 8; i++) {
    const body = draw('walk', mirror, i);
    assert.equal(body.sourcePath, newWalk);
    assert.equal(body.sourceRect[0], i*192);
    assert.equal(mirrored(body), mirror);
    assert.ok(Math.abs(body.points[0][1]+226*(body.points[3][1]-body.points[0][1])/256)<1e-9);
  }
});

test('holding a target across the .45s boundary keeps aiming while backing away', () => {
  const {sb, draw} = fixture();
  sb.enemy = targetAt(45);
  sb.basicAttack();
  sb.player.moving = true;
  sb.player.attackAnim = 0;
  sb.time += .46;
  const held = draw('walk', true, 1, .4, 'assets/r128/gunner/walk-ne.webp');
  assert.equal(held.sourcePath, newWalk);
  assert.equal(mirrored(held), false);
  assert.equal(held.sourceRect[0], 7*192);
  const fired = sb.basicAttack();
  assert.deepEqual(Array.from(fired.currentPublicMuzzle.r991.tip),[148,137]);
  sb.enemy = null;
  sb.time += .3;
  assert.equal(mirrored(draw('walk', true)), true);
});

test('an abrupt change of target is reflected by the next real shot', () => {
  const {sb, draw} = fixture();
  sb.enemy = targetAt(45);
  sb.basicAttack();
  assert.equal(mirrored(draw('attack')), false);
  sb.time += .5;
  sb.enemy = targetAt(135);
  sb.basicAttack();
  assert.equal(mirrored(draw('attack')), true);
});

test('cast overrides the prior basic shot and keeps its own direction when the nearest foe changes', () => {
  const {sb, draw, api} = fixture();
  sb.enemy = targetAt(0);
  sb.basicAttack();
  sb.player.attackAngle = worldAngle(135);
  sb.player.skillAnim = .6;
  const first = draw('attack');
  assert.equal(first.sourcePath, diagonal);
  assert.equal(mirrored(first), true);
  sb.time += .04;
  sb.enemy = targetAt(45);
  const next = draw('attack', false, 3);
  assert.equal(mirrored(next), true);
  const [tipX, tipY] = api.tip('se3', next.sourceRect[0]/192);
  const muzzle = api.skillMuzzle(worldAngle(135));
  assert.ok(Math.abs(muzzle.x-(next.points[0][0]+(next.points[1][0]-next.points[0][0])*tipX/192))<1e-9);
  assert.ok(Math.abs(muzzle.y-(next.points[0][1]+(next.points[3][1]-next.points[0][1])*tipY/256))<1e-9);
  assert.equal(api.skillMuzzle(worldAngle(45)), null);
});

test('manual fire without an enemy uses the real manual SW direction', () => {
  const {sb, draw} = fixture();
  const shot = sb.basicAttack(true);
  assert.equal(shot.damage, 12);
  assert.equal(shot.currentPublicMuzzle.r991.mirror, true);
  assert.equal(mirrored(draw('attack')), true);
});

test('first shot after changing body or room never uses the previous walking muzzle', () => {
  const {sb, draw} = fixture();
  sb.enemy = targetAt(45);
  sb.player.moving = true;
  draw('walk', false, 2, 2);
  sb.room = {};
  assert.deepEqual(Array.from(sb.basicAttack().currentPublicMuzzle.r991.tip), [148,129]);
  draw('walk', false, 2, 2);
  sb.player = {...actor(), moving: true, r720Ally: true};
  assert.deepEqual(Array.from(sb.basicAttack().currentPublicMuzzle.r991.tip), [148,129]);
});

test('cold gait fallback uses coherent approved art on the correct side', () => {
  const {sb, draw} = fixture();
  sb.cold = true;
  const cold = draw('walk', true);
  assert.equal(cold.sourcePath, diagonal);
  assert.equal(mirrored(cold), true);
  sb.cold = false;
  assert.equal(draw('walk', true).sourcePath, newWalk);
});

test('lower diagonal boundaries avoid the retired opposite-facing body', () => {
  const {api} = fixture();
  for (const angle of [45, 55, 60, 65, 114, 120, 125, 135]) {
    const pose = api.pick(degrees(angle));
    assert.equal(pose.sheet, 'se3');
    assert.equal(pose.mirror, angle > 90);
  }
});

test('last committed cast can replace a different cast without waiting for animations to finish', () => {
  const {sb, draw} = fixture();
  let cast = {slot:'q', start: 1, angle: worldAngle(45)};
  sb.window.__STORYWORLD_GUNNER_ARMS_R561__ = {castAim: () => cast};
  sb.player.skillAnim = .6;
  assert.equal(mirrored(draw('attack')), false);
  sb.time += .04;
  cast = {slot:'w', start: sb.time, angle: worldAngle(135)};
  assert.equal(mirrored(draw('attack')), true);
});

test('legacy east idle is replaced even when the separate R119 index is unavailable', () => {
  const {draw} = fixture();
  const body = draw('idle', false, 1, .4, 'assets/r93/idle/idle-gunner-e.png');
  assert.equal(body.sourcePath, 'assets/r1101b/gunner/idle-e6.webp');
  assert.equal(mirrored(body), false);
});
