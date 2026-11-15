#!/usr/bin/env python3
"""R1063 환도 옷 질감 통일 — 픽셀 검사(로컬용, numpy 필요. CI 는 r1063-cpu-check.cjs 가 색인 수치·연결을 본다).
기준 = 아래 걷기 v2(assets/r436/hwando/walk-s.webp). 다른 모션 파생본(assets/r1063/...)의 옷 질감 세 띠가 기준 ±6% 안인지,
알파(윤곽·크기·발 기준점)·칼날·색이 그대로인지 본다. 사용: python3 r96/qa/r1063/texture_check.py"""
import os,sys,json,hashlib,importlib.util
import numpy as np
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.join(HERE,'..','..','..');A=os.path.join(ROOT,'r96','runtime-text','assets')
spec=importlib.util.spec_from_file_location('r1063',os.path.join(ROOT,'scripts','r1063-hwando-texture.py'))
checks=[]
def ok(name,cond,detail=''):checks.append((name,bool(cond),detail))
try:
    T=importlib.util.module_from_spec(spec);spec.loader.exec_module(T)
except Exception as e:
    T=None;ok('scripts/r1063-hwando-texture.py 불러오기',False,repr(e))
REF_SHA='8d8837750e4201c1da00690c749f90ce7b672b53401225dd87c6035114a1382a'
ref_p=os.path.join(A,'r436','hwando','walk-s.webp')
ok('기준(아래 걷기 v2) 그림은 그대로',hashlib.sha256(open(ref_p,'rb').read()).hexdigest()==REF_SHA)
load=lambda p:np.array(Image.open(p).convert('RGBA')).astype(np.float64)/255
if T:
    ref=T.metrics(load(ref_p));TOL=.06;refL=T.ref_leather()
    ok('기준 신발 가죽 수치가 유한·픽셀 있음',refL['px']>200 and all(np.isfinite(v) for v in refL.values()),refL)
    ok('기준 수치가 유한',all(np.isfinite(v) for v in ref.values()),ref)
    ok('대상 목록 9장(걷기 좌·우·위, 공격 우·아래·위, 피격 우·위·아래)',len(T.CLIPS)==9 and not any('walk-s' in c for c in T.CLIPS),T.CLIPS)
    for src in T.CLIPS:
        name=src.replace('assets/','');out=os.path.join(A,T.out_path(src).replace('assets/',''));sp=os.path.join(A,name)
        if not os.path.exists(out):ok(name+' 파생본 있음',False,out);continue
        s=load(sp);d=load(out);ms=T.metrics(s);md=T.metrics(d)
        ok(name+' 크기·알파 그대로(윤곽·몸 키·발 기준점 변화 0)',s.shape==d.shape and np.array_equal(s[...,3],d[...,3]))
        for k in ('grain','fold','form'):
            ok(f'{name} {k} 기준 ±6% ({ms[k]:.4f}→{md[k]:.4f}, 기준 {ref[k]:.4f})',abs(md[k]/ref[k]-1)<=TOL)
        ok(name+' 값 유한·0~1',np.isfinite(d).all() and d.min()>=0 and d.max()<=1)
        ok(f'{name} 옷 채도 유지 ±0.015 ({ms["clothSat"]:.3f}→{md["clothSat"]:.3f})',abs(md['clothSat']-ms['clothSat'])<=.015)
        ok(f'{name} 옷 밝기 중앙 유지 ±0.03 ({ms["clothLum"]:.3f}→{md["clothLum"]:.3f})',abs(md['clothLum']-ms['clothLum'])<=.03)
        w=T.body_weight(s[...,3]);thin=(s[...,3]>.05)&(w<.02)
        ok(f'{name} 칼날·가는 조각 픽셀 그대로(R439 검끝 손질 유지, {int(thin.sum())}px)',thin.sum()>0 and np.abs(d[...,:3]-s[...,:3])[thin].max()<=1.5/255)
        ok(name+' 투명 칸 색 그대로',np.array_equal(d[...,:3][s[...,3]==0],s[...,:3][s[...,3]==0]))
        ok(name+' 실제로 바뀜(회귀: 빈 복사 금지)',np.abs(d[...,:3]-s[...,:3]).max()>2/255)
        fb=T.foot_bands(T.rec_of(src),s.shape[0]);lw=T.leather_weight(s,fb);ls=T.leather_stats(s,fb,lw);ld=T.leather_stats(d,fb,lw)# 같은 가죽 픽셀(원본에서 고른 무게)을 전후로 잰다
        ok(f'{name} 신발 가죽 밝기 기준 ±0.03 ({ls["lum"]:.3f}→{ld["lum"]:.3f}, 기준 {refL["lum"]:.3f})',abs(ld['lum']-refL['lum'])<=.03)
        ok(f'{name} 신발 가죽 채도 기준 ±0.03 ({ls["sat"]:.3f}→{ld["sat"]:.3f}, 기준 {refL["sat"]:.3f})',abs(ld['sat']-refL['sat'])<=.03)
    # 경계: 기준 자신에 돌리면 거의 그대로(이득 1 근처)
    g=T.solve(load(ref_p),ref)
    ok('경계: 기준 자신은 이득 1±0.05·밝기 밀기 0±0.01',all(abs(x-1)<=.05 for x in g[:3]) and abs(g[3])<=.01,g)
    ok('경계: 발 띠가 없는 그림은 가죽 손질이 그대로 돌려줌',T.leather_fix(np.zeros((30,30,4)),[(0,0)],refL)[1]==[1.,1.])
    # 경계: 완전 투명·단색 그림에서 NaN 없음
    z=np.zeros((40,40,4));ok('경계: 빈 그림 NaN 없음',np.isfinite(T.apply(z,(1.2,.8,1.1))).all())
    f=np.ones((40,40,4))*.5;f[...,3]=1;o=T.apply(f,(1.3,.7,1.2));ok('경계: 단색 그림 그대로·NaN 없음',np.isfinite(o).all() and np.abs(o-f).max()<1e-6)
fail=[c for c in checks if not c[1]]
for n,p,d in checks:print(('PASS ' if p else 'FAIL ')+n+('' if p or not d else ' '+str(d)))
print(f'{len(checks)-len(fail)}/{len(checks)}');sys.exit(1 if fail else 0)
