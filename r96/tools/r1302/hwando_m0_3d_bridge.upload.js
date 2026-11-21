/**
 * StoryWorld m0 — 실시간 3D 환도 영웅 연동 테스트 브리지 (hwando_m0_3d_bridge.js)
 *
 * 기능:
 *  - 기존 m0 2D 캔버스(#game) 위에 투명 Three.js 직교투영 오버레이를 띄워
 *    보정된 TRELLIS.2 환도 영웅(.glb)을 실시간으로 동기화합니다.
 *  - 기존 충돌 판정, 탄막, 스토리, 저장 로직은 일절 건드리지 않고
 *    우측 상단 [3D 환도 ON/OFF] 버튼으로 2D <-> 3D를 즉시 전환해 비교할 수 있습니다.
 *  - 8방향 회전 + Idle / Walk / 대각 베기(Attack) 프로시저럴 스키닝 내장.
 *
 * m0 적용 방법:
 *  1) hwando_hero_trellis2_fixed.glb 를 m0 저장소의 assets/models/ 폴더에 배치
 *  2) 이 파일을 client-source/hwando_m0_3d_bridge.js 로 배치
 *  3) index.html 하단에서 로드 후 initHwando3DBridge({ glbUrl: './assets/models/hwando_hero_trellis2_fixed.glb' }) 호출
 */

import * as THREE from '../vendor/three/build/three.module.js';
import { GLTFLoader } from '../vendor/three/examples/jsm/loaders/GLTFLoader.js';

const D2R = Math.PI / 180;

// m0 방향 문자열 -> Y축 회전각 (라디안, +Z가 정면)
const DIR_TO_YAW = {
  down: 0, s: 0, front: 0,
  right: Math.PI / 2, e: Math.PI / 2,
  up: Math.PI, n: Math.PI, back: Math.PI,
  left: -Math.PI / 2, w: -Math.PI / 2,
  se: Math.PI / 4,
  ne: (3 * Math.PI) / 4,
  nw: -(3 * Math.PI) / 4,
  sw: -Math.PI / 4,
};

function smoothstep(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/**
 * 정규화된 환도 영웅(1.75m, 발 Y=0) 메시를 10-본 휴머노이드 SkinnedMesh로 변환합니다.
 */
function buildSkinnedHwando(srcMesh) {
  const geo = srcMesh.geometry.clone();
  const pos = geo.attributes.position;
  const count = pos.count;

  const bRoot   = new THREE.Bone(); bRoot.position.set(0, 0, 0);
  const bPelvis = new THREE.Bone(); bPelvis.position.set(0, 0.86, 0); bRoot.add(bPelvis);
  const bChest  = new THREE.Bone(); bChest.position.set(0, 0.24, 0);  bPelvis.add(bChest);
  const bHead   = new THREE.Bone(); bHead.position.set(0, 0.36, 0);   bChest.add(bHead);
  const bRArm   = new THREE.Bone(); bRArm.position.set(-0.26, 0.24, 0); bChest.add(bRArm);
  const bLArm   = new THREE.Bone(); bLArm.position.set(0.26, 0.24, 0);  bChest.add(bLArm);
  const bRThigh = new THREE.Bone(); bRThigh.position.set(-0.11, -0.02, 0); bPelvis.add(bRThigh);
  const bRShin  = new THREE.Bone(); bRShin.position.set(0, -0.42, 0);      bRThigh.add(bRShin);
  const bLThigh = new THREE.Bone(); bLThigh.position.set(0.11, -0.02, 0);  bPelvis.add(bLThigh);
  const bLShin  = new THREE.Bone(); bLShin.position.set(0, -0.42, 0);      bLThigh.add(bLShin);

  const boneList = [bRoot, bPelvis, bChest, bHead, bRArm, bLArm, bRThigh, bRShin, bLThigh, bLShin];
  const bones = { bRoot, bPelvis, bChest, bHead, bRArm, bLArm, bRThigh, bRShin, bLThigh, bLShin };

  const skinIndices = new Uint16Array(count * 4);
  const skinWeights = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const w = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const isSword = (z > 0.18 && y < 1.18) || (x < -0.34 && y > 0.35 && y < 1.15);
    if (isSword) {
      w[4] = 1.0;
    } else if (y >= 0.84) {
      const wHead = smoothstep(1.38, 1.52, y);
      const wChestBase = smoothstep(0.84, 1.08, y);
      const wPelvis = 1.0 - wChestBase;
      const armYMask = smoothstep(0.75, 0.92, y) * (1.0 - smoothstep(1.42, 1.54, y));
      const wRArm = smoothstep(-0.20, -0.33, x) * armYMask;
      const wLArm = smoothstep(0.20, 0.33, x) * armYMask;
      const torsoRem = 1.0 - Math.min(1.0, wRArm + wLArm);

      w[4] = wRArm;
      w[5] = wLArm;
      w[3] = torsoRem * wHead;
      w[2] = torsoRem * (1.0 - wHead) * wChestBase;
      w[1] = torsoRem * (1.0 - wHead) * wPelvis;
    } else {
      const wPelvis = smoothstep(0.70, 0.86, y);
      const wLeg = 1.0 - wPelvis;
      const rightness = smoothstep(0.04, -0.04, x);
      const leftness = 1.0 - rightness;
      const shinness = smoothstep(0.46, 0.34, y);

      w[1] = wPelvis;
      w[6] = wLeg * rightness * (1.0 - shinness);
      w[7] = wLeg * rightness * shinness;
      w[8] = wLeg * leftness * (1.0 - shinness);
      w[9] = wLeg * leftness * shinness;
    }

    const pairs = w.map((val, idx) => [idx, val]).sort((a, b) => b[1] - a[1]).slice(0, 4);
    let sum = pairs.reduce((acc, p) => acc + p[1], 0);
    if (sum < 1e-6) { pairs[0] = [1, 1.0]; sum = 1.0; }
    for (let k = 0; k < 4; k++) {
      skinIndices[i * 4 + k] = pairs[k][0];
      skinWeights[i * 4 + k] = pairs[k][1] / sum;
    }
  }

  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

  const mat = srcMesh.material.clone();
  mat.side = THREE.DoubleSide;
  const skinned = new THREE.SkinnedMesh(geo, mat);
  skinned.add(bRoot);
  skinned.bind(new THREE.Skeleton(boneList));

  const group = new THREE.Group();
  group.add(skinned);
  return { group, bones };
}

function applyHwandoPose(bones, state, phase) {
  bones.bPelvis.position.set(0, 0.86, 0);
  bones.bPelvis.rotation.set(0, 0, 0);
  bones.bChest.rotation.set(0, 0, 0);
  bones.bHead.rotation.set(0, 0, 0);
  bones.bRArm.rotation.set(0, 0, 0);
  bones.bLArm.rotation.set(0, 0, 0);
  bones.bRThigh.rotation.set(0, 0, 0);
  bones.bRShin.rotation.set(0, 0, 0);
  bones.bLThigh.rotation.set(0, 0, 0);
  bones.bLShin.rotation.set(0, 0, 0);

  const s = Math.sin(phase * Math.PI * 2);
  const c = Math.cos(phase * Math.PI * 2);

  if (state === 'walk') {
    const bob = Math.abs(s);
    bones.bPelvis.position.y = 0.84 + 0.035 * bob;
    bones.bPelvis.rotation.y = (7 * s) * D2R;
    bones.bChest.rotation.set(9 * D2R, (-8 * s) * D2R, 0);
    bones.bHead.rotation.set(-4 * D2R, (5 * s) * D2R, 0);
    bones.bRThigh.rotation.x = (-26 * s) * D2R;
    bones.bRShin.rotation.x  = (Math.max(0, 28 * c) + 6) * D2R;
    bones.bLThigh.rotation.x = (26 * s) * D2R;
    bones.bLShin.rotation.x  = (Math.max(0, -28 * c) + 6) * D2R;
    bones.bRArm.rotation.set((10 + 10 * s) * D2R, -6 * D2R, 6 * D2R);
    bones.bLArm.rotation.set((-18 * s) * D2R, 0, -4 * D2R);
  } else if (state === 'attack') {
    let lunge = 0, armPitch = 0, armYaw = 0, armRoll = 0, torsoYaw = 0, torsoPitch = 0, torsoRoll = 0;
    if (phase < 0.26) {
      const k = smoothstep(0.0, 0.26, phase);
      lunge = -0.18 * k;
      armPitch = -126 * k; armYaw = -28 * k; armRoll = -32 * k;
      torsoYaw = -30 * k; torsoPitch = -10 * k; torsoRoll = -8 * k;
    } else if (phase < 0.48) {
      const k = smoothstep(0.26, 0.48, phase);
      lunge = -0.18 + 1.18 * k;
      armPitch = -126 + 108 * k; armYaw = -28 + 76 * k; armRoll = -32 + 66 * k;
      torsoYaw = -30 + 68 * k; torsoPitch = -10 + 36 * k; torsoRoll = -8 + 18 * k;
    } else if (phase < 0.72) {
      const k = smoothstep(0.48, 0.72, phase);
      lunge = 1.0 - 0.10 * k;
      armPitch = -18 + 6 * k; armYaw = 48 - 4 * k; armRoll = 34 - 4 * k;
      torsoYaw = 38 - 4 * k; torsoPitch = 26 - 3 * k; torsoRoll = 10 - 2 * k;
    } else {
      const k = smoothstep(0.72, 1.0, phase);
      lunge = 0.90 * (1 - k);
      armPitch = -12 * (1 - k); armYaw = 44 * (1 - k); armRoll = 30 * (1 - k);
      torsoYaw = 34 * (1 - k); torsoPitch = 23 * (1 - k); torsoRoll = 8 * (1 - k);
    }
    const posLunge = Math.max(0, lunge);
    bones.bPelvis.position.set(0, 0.86 - 0.14 * posLunge, 0.18 * lunge);
    bones.bPelvis.rotation.set(6 * posLunge * D2R, torsoYaw * 0.42 * D2R, 0);
    bones.bChest.rotation.set(torsoPitch * D2R, torsoYaw * 0.58 * D2R, torsoRoll * D2R);
    bones.bHead.rotation.set(-torsoPitch * 0.45 * D2R, -torsoYaw * 0.45 * D2R, 0);
    bones.bRThigh.rotation.x = (-36 * posLunge) * D2R;
    bones.bRShin.rotation.x  = (44 * posLunge) * D2R;
    bones.bLThigh.rotation.x = (30 * posLunge) * D2R;
    bones.bLShin.rotation.x  = (14 * posLunge) * D2R;
    bones.bRArm.rotation.order = 'YXZ';
    bones.bRArm.rotation.set(armPitch * D2R, armYaw * D2R, armRoll * D2R);
    bones.bLArm.rotation.set((22 * posLunge - 14 * Math.max(0, -lunge)) * D2R, (-22 * posLunge) * D2R, -16 * D2R);
  } else {
    bones.bPelvis.position.y = 0.86 + 0.015 * s;
    bones.bChest.rotation.x = (4 + 3 * s) * D2R;
    bones.bHead.rotation.x = (3 + 2 * s) * D2R;
    bones.bRArm.rotation.set((4 + 5 * s) * D2R, (-4 + 3 * c) * D2R, (4 + 2 * s) * D2R);
    bones.bLArm.rotation.set((6 - 4 * s) * D2R, 0, (-4 - 2 * s) * D2R);
  }
}

export async function initHwando3DBridge({
  stageEl = document.getElementById('stage'),
  glbUrl = './assets/models/hwando_hero_trellis2_fixed.glb',
  cameraElevDeg = 32.5,
  getHeroState = null,
} = {}) {
  if (!stageEl) throw new Error('StoryWorld #stage container not found');

  const canvas = document.createElement('canvas');
  canvas.id = 'hwando-3d-overlay';
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '4',
  });
  stageEl.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.38;

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x263547, 0.95));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.3);
  key.position.set(3.5, 5.5, 4.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9bc4f0, 1.1);
  rim.position.set(-4.0, 3.0, -3.5);
  scene.add(rim);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 30);
  const elev = cameraElevDeg * D2R;
  camera.position.set(0, Math.sin(elev) * 8, Math.cos(elev) * 8);
  camera.lookAt(0, 0.88, 0);

  const gltf = await new GLTFLoader().loadAsync(glbUrl);
  let srcMesh = null;
  gltf.scene.traverse((o) => { if (o.isMesh && !srcMesh) srcMesh = o; });
  const { group, bones } = buildSkinnedHwando(srcMesh);
  scene.add(group);

  let enabled = true;
  let currentYaw = Math.PI / 2;

  // Toggle button for side-by-side 2D vs 3D verification
  const btn = document.createElement('button');
  btn.textContent = '3D 환도: ON';
  Object.assign(btn.style, {
    position: 'absolute',
    right: '16px',
    bottom: '16px',
    zIndex: '25',
    padding: '7px 12px',
    fontSize: '12px',
    background: '#273844',
    color: '#e8e1d2',
    border: '1px solid #c6ab77',
    borderRadius: '4px',
    cursor: 'pointer',
  });
  btn.onclick = () => {
    enabled = !enabled;
    canvas.style.display = enabled ? 'block' : 'none';
    btn.textContent = enabled ? '3D 환도: ON' : '3D 환도: OFF';
  };
  stageEl.appendChild(btn);

  function syncFrame(timeSec) {
    const rect = stageEl.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      renderer.setSize(rect.width, rect.height, false);
    }
    if (!enabled) return;

    const st = getHeroState ? getHeroState(timeSec) : {
      screenX: rect.width * 0.5,
      screenY: rect.height * 0.55,
      actorPxHeight: 140,
      direction: 'right',
      action: 'idle',
      actionPhase: (timeSec % 1.6) / 1.6,
    };

    // Map 2D pixel height of m0 actor to Orthographic camera frustum
    const worldPerPx = 1.75 / Math.max(24, st.actorPxHeight || 120);
    const halfW = (rect.width * 0.5) * worldPerPx;
    const halfH = (rect.height * 0.5) * worldPerPx;
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();

    // Smoothly interpolate facing yaw across 8 directions
    const targetYaw = DIR_TO_YAW[String(st.direction || 'right').toLowerCase()] ?? Math.PI / 2;
    let diff = targetYaw - currentYaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    currentYaw += diff * 0.25;
    group.rotation.y = currentYaw;

    // Anchor hero feet (Y=0) pixel-accurately to m0 project(player.x, player.y)
    const cosE = Math.cos(elev);
    const camX = (st.screenX - rect.width * 0.5) * worldPerPx;
    const camY = (rect.height * 0.5 - st.screenY) * worldPerPx;
    group.position.set(camX, (camY + 0.88 * cosE) / cosE, 0);

    applyHwandoPose(bones, st.action || 'idle', st.actionPhase ?? ((timeSec % 1.0)));
    group.updateMatrixWorld(true);
    renderer.render(scene, camera);
  }

  return { syncFrame, setEnabled: (v) => { enabled = !!v; canvas.style.display = enabled ? 'block' : 'none'; } };
}