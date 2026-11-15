# R1048 CMU 모션캡처(ASF/AMC) 읽기 — 관절 위치(Blender 좌표, 미터)를 프레임마다 계산한다(정기구학).
#  CMU Graphics Lab Motion Capture Database(mocap.cs.cmu.edu): "may be copied, modified, or redistributed without permission".
#  좌표: CMU 는 Y 위 → Blender (x, -z, y). 길이 단위는 ASF ':units length'(보통 0.45 → 인치/0.45) → 미터.
import math
import numpy as np

def _rot(axis, deg):
    a = math.radians(deg); c, s = math.cos(a), math.sin(a)
    if axis == 'x': return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
    if axis == 'y': return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])

def _euler(order, vals):
    """ASF 'axis ... XYZ' 와 AMC 회전: 순서대로 곱한 행렬(R = R_z·R_y·R_x 처럼 마지막 축이 바깥)."""
    R = np.eye(3)
    for ax, v in zip(order, vals): R = _rot(ax, v) @ R
    return R

class Skeleton:
    def __init__(self, path):
        txt = open(path).read().split('\n')
        self.bones = {}; self.children = {}; self.unit = 1.0; self.root_order = ['tx', 'ty', 'tz', 'rx', 'ry', 'rz']; self.root_axis = 'XYZ'
        i = 0; mode = None; cur = None
        while i < len(txt):
            ln = txt[i].strip(); i += 1
            if not ln or ln.startswith('#'): continue
            if ln.startswith(':units'): mode = 'units'; continue
            if ln.startswith(':root'): mode = 'root'; continue
            if ln.startswith(':bonedata'): mode = 'bones'; continue
            if ln.startswith(':hierarchy'): mode = 'hier'; continue
            if ln.startswith(':'): mode = None; continue
            p = ln.split()
            if mode == 'units' and p[0] == 'length': self.unit = float(p[1])
            elif mode == 'root':
                if p[0] == 'order': self.root_order = [x.lower() for x in p[1:]]
                elif p[0] == 'axis': self.root_axis = p[1]
            elif mode == 'bones':
                if p[0] == 'begin': cur = {'dof': [], 'axis': (0, 0, 0), 'order': 'xyz'}
                elif p[0] == 'end': self.bones[cur['name']] = cur; cur = None
                elif p[0] == 'name': cur['name'] = p[1]
                elif p[0] == 'direction': cur['dir'] = np.array([float(x) for x in p[1:4]])
                elif p[0] == 'length': cur['len'] = float(p[1])
                elif p[0] == 'axis': cur['axis'] = tuple(float(x) for x in p[1:4]); cur['order'] = p[4].lower()
                elif p[0] == 'dof': cur['dof'] = p[1:]
            elif mode == 'hier':
                if p[0] in ('begin', 'end'): continue
                self.children.setdefault(p[0], []).extend(p[1:])
        for b in self.bones.values():
            b['C'] = _euler(b['order'], b['axis']); b['Ci'] = b['C'].T
        self.scale = (1.0 / self.unit) * 0.0254  # 인치 → 미터

    def fk(self, frame):
        """frame: {bone: [값…]} → {관절 이름: 끝점 위치(CMU 좌표·미터)}, 'root' 포함."""
        rv = frame.get('root', [0] * 6); vals = dict(zip(self.root_order, rv))
        t = np.array([vals.get('tx', 0), vals.get('ty', 0), vals.get('tz', 0)]) * self.scale
        Rr = _euler([c.lower() for c in self.root_axis], [vals.get('r' + c.lower(), 0) for c in self.root_axis])
        pos = {'root': t}; mat = {'root': Rr}
        stack = ['root']
        while stack:
            par = stack.pop()
            for ch in self.children.get(par, []):
                b = self.bones[ch]; d = frame.get(ch, []); ang = {'x': 0., 'y': 0., 'z': 0.}
                for k, name in enumerate(b['dof']):
                    if k < len(d): ang[name[1]] = d[k]
                M = _euler(['x', 'y', 'z'], [ang['x'], ang['y'], ang['z']])
                mat[ch] = mat[par] @ b['C'] @ M @ b['Ci']
                pos[ch] = pos[par] + mat[ch] @ b['dir'] * b['len'] * self.scale
                stack.append(ch)
        return pos, mat

def read_amc(path):
    frames = []; cur = None
    for ln in open(path):
        ln = ln.strip()
        if not ln or ln.startswith('#') or ln.startswith(':'): continue
        if ln.isdigit():
            cur = {}; frames.append(cur); continue
        p = ln.split(); cur[p[0]] = [float(x) for x in p[1:]]
    return frames

def to_blender(v):
    return np.array([v[0], -v[2], v[1]])

def positions(asf, amc, start=0, end=None, step=1):
    sk = Skeleton(asf); fr = read_amc(amc)[start:end:step]
    out = []
    for f in fr:
        p, _ = sk.fk(f); out.append({k: to_blender(v) for k, v in p.items()})
    return out
