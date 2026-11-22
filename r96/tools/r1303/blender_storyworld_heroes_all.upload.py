"""
StoryWorld 전 영웅 공용 — Blender 원큐 자동 리깅 · 무기 소켓 · 3종 모션 · 일괄 배치(Batch) 스크립트
(라우렌 · 미카엘라 · 슬레이어 · 헌터 · 기억사수 · 페르소나 · 히든에고 지원, Blender 4.x / 5.x 호환)

단일 실행:
  blender --background --python blender_storyworld_heroes_all.py -- \
    --hero lauren --input lauren_trellis2.glb --output assets/models/lauren_rigged.glb

전체 폴더 일괄 배치 실행 (lauren_trellis2.glb, michaela_trellis2.glb ... 자동 인식):
  blender --background --python blender_storyworld_heroes_all.py -- \
    --batch-dir ./trellis_raw --out-dir ./assets/models

지원 영웅 프리셋 (--hero):
  - lauren     (1.74m, 보라빛 창 소켓, Attack_LanceThrust)
  - michaela   (1.66m, 메딕 스태프 소켓, Attack_HealPulse)
  - slayer     (1.76m, 붉은 대검 소켓, Attack_DownCleave)
  - hunter     (1.68m, 붉은 활 소켓, Attack_BowShot)
  - gunner     (1.72m, 시안 라이플 소켓, Attack_AimFire)
  - persona    (1.70m, 붉은 오브 시전 소켓, Attack_EgoCast)
  - hidden_ego (1.76m, 각성 에고 시전 소켓, Attack_AwakenedBurst)
"""

import math
import os
import sys
import bpy
from mathutils import Vector, Euler, Euler

D2R = math.pi / 180.0
FPS = 30

HERO_PRESETS = {
    # --- 영웅 ---
    "hwando":                {"height": 1.75, "weapon": "hwando", "color": (0.82, 0.86, 0.90, 1.0), "attack": "Attack_DiagonalSlash"},
    "lauren":                {"height": 1.74, "weapon": "spear",  "color": (0.62, 0.20, 0.96, 1.0), "attack": "Attack_LanceThrust"},
    "michaela":              {"height": 1.66, "weapon": "staff",  "color": (0.98, 0.25, 0.58, 1.0), "attack": "Attack_HealPulse"},
    "slayer":                {"height": 1.76, "weapon": "sword",  "color": (0.95, 0.14, 0.18, 1.0), "attack": "Attack_DownCleave"},
    "hunter":                {"height": 1.68, "weapon": "bow",    "color": (0.88, 0.16, 0.16, 1.0), "attack": "Attack_BowShot"},
    "gunner":                {"height": 1.72, "weapon": "rifle",  "color": (0.12, 0.78, 0.98, 1.0), "attack": "Attack_AimFire"},
    "persona":               {"height": 1.70, "weapon": "none",   "color": (0.92, 0.12, 0.18, 1.0), "attack": "Attack_EgoCast"},
    "hidden_ego":            {"height": 1.76, "weapon": "none",   "color": (1.00, 0.18, 0.22, 1.0), "attack": "Attack_AwakenedBurst"},
    # --- 챕터별 막보스 (2.3m ~ 2.6m 보스 규격) ---
    "boss_lucifer":          {"height": 2.45, "weapon": "none",   "color": (0.92, 0.76, 0.42, 1.0), "attack": "Attack_BossCast"},
    "boss_controller":       {"height": 2.35, "weapon": "none",   "color": (0.88, 0.22, 0.82, 1.0), "attack": "Attack_BossCast"},
    "boss_bulmyeongwi":      {"height": 2.40, "weapon": "none",   "color": (0.65, 0.72, 0.75, 1.0), "attack": "Attack_BossHoverCast"},
    "boss_siren_mor":        {"height": 2.30, "weapon": "staff",  "color": (0.86, 0.18, 0.34, 1.0), "attack": "Attack_BossCast"},
    "boss_hando_king":       {"height": 2.55, "weapon": "none",   "color": (0.58, 0.20, 0.88, 1.0), "attack": "Attack_BossCast"},
    "boss_pride_hierophant": {"height": 2.50, "weapon": "none",   "color": (0.94, 0.14, 0.18, 1.0), "attack": "Attack_BossCast"},
    # --- 특수 보스 & 7대죄 보스 (2.25m ~ 2.85m 보스 규격) ---
    "boss_fallen_knight":    {"height": 2.45, "weapon": "sword",  "color": (0.95, 0.25, 0.22, 1.0), "attack": "Attack_DownCleave"},
    "boss_balrog":           {"height": 2.85, "weapon": "sword",  "color": (1.00, 0.36, 0.08, 1.0), "attack": "Attack_DownCleave"},
    "sin_pride":             {"height": 2.60, "weapon": "none",   "color": (0.96, 0.72, 0.20, 1.0), "attack": "Attack_BossCast"},
    "sin_greed":             {"height": 2.45, "weapon": "none",   "color": (0.92, 0.16, 0.22, 1.0), "attack": "Attack_BossCast"},
    "sin_lust":              {"height": 2.25, "weapon": "none",   "color": (0.88, 0.16, 0.30, 1.0), "attack": "Attack_BossCast"},
    "sin_envy":              {"height": 2.40, "weapon": "none",   "color": (0.14, 0.82, 0.78, 1.0), "attack": "Attack_BossHoverCast"},
    "sin_gluttony":          {"height": 2.65, "weapon": "none",   "color": (0.68, 0.84, 0.22, 1.0), "attack": "Attack_BossCast"},
    "sin_wrath":             {"height": 2.70, "weapon": "none",   "color": (1.00, 0.34, 0.06, 1.0), "attack": "Attack_BossCast"},
    "sin_sloth":             {"height": 2.50, "weapon": "none",   "color": (0.48, 0.56, 0.30, 1.0), "attack": "Attack_BossCast"},
    # --- 사몽 에피소드 (제9부 사몽 · 제10부 페르소나와 EGO) 챕터별 막보스 ---
    "samong_p_root":         {"height": 2.10, "weapon": "none",   "color": (0.18, 0.16, 0.20, 1.0), "attack": "Attack_BossCast"},
    "samong_s01_hostess":    {"height": 2.25, "weapon": "none",   "color": (0.78, 0.16, 0.24, 1.0), "attack": "Attack_BossCast"},
    "samong_s02_patroller":  {"height": 1.95, "weapon": "none",   "color": (0.28, 0.34, 0.42, 1.0), "attack": "Attack_BossCast"},
    "samong_s03_ring":       {"height": 2.35, "weapon": "none",   "color": (0.12, 0.12, 0.14, 1.0), "attack": "Attack_BossHoverCast"},
    "samong_s04_kang":       {"height": 1.92, "weapon": "none",   "color": (0.82, 0.68, 0.32, 1.0), "attack": "Attack_BossCast"},
    "samong_s05_seal":       {"height": 1.80, "weapon": "none",   "color": (0.10, 0.10, 0.12, 1.0), "attack": "Attack_BossCast"},
    "samong_s06_rival":      {"height": 2.20, "weapon": "sword",  "color": (0.95, 0.16, 0.16, 1.0), "attack": "Attack_DownCleave"},
    "samong_s06_wire":       {"height": 1.75, "weapon": "none",   "color": (0.14, 0.14, 0.16, 1.0), "attack": "Attack_BossCast"},
    # --- 제11부 사몽역행 (RA~RG) 챕터별 막보스 ---
    "samong_rb_guest":       {"height": 2.15, "weapon": "none",   "color": (0.86, 0.84, 0.78, 1.0), "attack": "Attack_BossCast"},
    "samong_rc_judge":       {"height": 2.45, "weapon": "staff",  "color": (0.36, 0.42, 0.56, 1.0), "attack": "Attack_DownCleave"},
    "samong_rd_trumpet1":    {"height": 2.50, "weapon": "none",   "color": (0.76, 0.64, 0.34, 1.0), "attack": "Attack_BossCast"},
    "samong_re_sniper":      {"height": 2.00, "weapon": "rifle",  "color": (0.94, 0.92, 0.88, 1.0), "attack": "Attack_AimFire"},
    "samong_rf_storyteller": {"height": 2.65, "weapon": "none",   "color": (0.58, 0.24, 0.20, 1.0), "attack": "Attack_BossCast"},
    "samong_rg_trumpet7":    {"height": 2.75, "weapon": "none",   "color": (0.88, 0.74, 0.32, 1.0), "attack": "Attack_BossHoverCast"},
    # --- 본편 기타 모든 보스 14종 (제1부~제8부 · 카이로노미콘 대수문장 6인 · 이단의목사) ---
    "boss_root_seraph":      {"height": 2.65, "weapon": "none",   "color": (0.72, 0.18, 0.18, 1.0), "attack": "Attack_BossCast"},
    "boss_cyborg_chairman":  {"height": 2.55, "weapon": "none",   "color": (0.94, 0.16, 0.16, 1.0), "attack": "Attack_BossCast"},
    "boss_goblin_king":      {"height": 2.10, "weapon": "staff",  "color": (0.78, 0.18, 0.24, 1.0), "attack": "Attack_DownCleave"},
    "kair_great_01":         {"height": 2.55, "weapon": "spear",  "color": (0.92, 0.22, 0.18, 1.0), "attack": "Attack_LanceThrust"},
    "kair_great_02":         {"height": 2.50, "weapon": "none",   "color": (0.92, 0.16, 0.68, 1.0), "attack": "Attack_BossCast"},
    "kair_arvelia":          {"height": 2.15, "weapon": "none",   "color": (0.68, 0.84, 0.98, 1.0), "attack": "Attack_BossHoverCast"},
    "kair_great_04":         {"height": 2.60, "weapon": "staff",  "color": (0.18, 0.48, 0.98, 1.0), "attack": "Attack_DownCleave"},
    "kair_great_05":         {"height": 2.50, "weapon": "none",   "color": (0.68, 0.24, 0.96, 1.0), "attack": "Attack_BossCast"},
    "kair_great_06":         {"height": 2.55, "weapon": "none",   "color": (0.78, 0.72, 0.96, 1.0), "attack": "Attack_BossCast"},
    "boss_oblivion_keeper":  {"height": 2.45, "weapon": "staff",  "color": (0.24, 0.78, 0.98, 1.0), "attack": "Attack_DownCleave"},
    "boss_rooftop_echo":     {"height": 2.40, "weapon": "none",   "color": (0.28, 0.56, 0.76, 1.0), "attack": "Attack_BossCast"},
    "boss_network_choir":    {"height": 2.50, "weapon": "none",   "color": (0.82, 0.74, 0.96, 1.0), "attack": "Attack_BossHoverCast"},
    "boss_heretic_han":      {"height": 1.92, "weapon": "staff",  "color": (0.88, 0.20, 0.26, 1.0), "attack": "Attack_BossCast"},
    "boss_heretic_baek":     {"height": 1.95, "weapon": "sword",  "color": (0.94, 0.78, 0.36, 1.0), "attack": "Attack_DownCleave"},
    # --- 7대죄 인간형(1페이즈) 보스 7종 ---
    "sin_human_sloth":       {"height": 1.82, "weapon": "none",   "color": (0.48, 0.54, 0.36, 1.0), "attack": "Attack_BossCast"},
    "sin_human_envy":        {"height": 1.85, "weapon": "none",   "color": (0.18, 0.64, 0.62, 1.0), "attack": "Attack_BossCast"},
    "sin_human_gluttony":    {"height": 2.15, "weapon": "sword",  "color": (0.95, 0.42, 0.12, 1.0), "attack": "Attack_DownCleave"},
    "sin_human_lust":        {"height": 1.76, "weapon": "none",   "color": (0.86, 0.14, 0.24, 1.0), "attack": "Attack_BossCast"},
    "sin_human_greed":       {"height": 1.92, "weapon": "none",   "color": (0.88, 0.72, 0.28, 1.0), "attack": "Attack_BossCast"},
    "sin_human_wrath":       {"height": 1.88, "weapon": "none",   "color": (0.98, 0.34, 0.08, 1.0), "attack": "Attack_BossCast"},
    "sin_human_pride":       {"height": 1.92, "weapon": "sword",  "color": (0.92, 0.84, 0.56, 1.0), "attack": "Attack_DownCleave"},
    # --- 제1부 스토리모드 중간보스 10종 ---
    "mb_dist01_violet":      {"height": 2.30, "weapon": "sword",  "color": (0.68, 0.24, 0.94, 1.0), "attack": "Attack_DownCleave"},
    "mb_dist02_horn":        {"height": 2.45, "weapon": "sword",  "color": (0.38, 0.58, 0.24, 1.0), "attack": "Attack_DownCleave"},
    "mb_dist03_pursuer":     {"height": 2.25, "weapon": "sword",  "color": (0.86, 0.14, 0.18, 1.0), "attack": "Attack_DownCleave"},
    "mb_dist04_comrade":     {"height": 2.15, "weapon": "sword",  "color": (0.58, 0.20, 0.92, 1.0), "attack": "Attack_DownCleave"},
    "mb_dist05_messenger":   {"height": 2.10, "weapon": "none",   "color": (0.20, 0.20, 0.24, 1.0), "attack": "Attack_BossHoverCast"},
    "mb_dist06_pillar":      {"height": 2.60, "weapon": "none",   "color": (0.96, 0.36, 0.08, 1.0), "attack": "Attack_BossCast"},
    "mb_ep1a07_devourer":    {"height": 2.00, "weapon": "none",   "color": (0.56, 0.20, 0.88, 1.0), "attack": "Attack_BossHoverCast"},
    "mb_ep1a08_supervisor":  {"height": 1.95, "weapon": "sword",  "color": (0.82, 0.82, 0.78, 1.0), "attack": "Attack_DownCleave"},
    "mb_ep1a10_ruincore":    {"height": 2.50, "weapon": "none",   "color": (0.84, 0.68, 0.30, 1.0), "attack": "Attack_BossCast"},
    "mb_ep1a11_mask":        {"height": 2.35, "weapon": "none",   "color": (0.88, 0.22, 0.26, 1.0), "attack": "Attack_BossHoverCast"},
    # --- 제2부 · 제3부 스토리모드 중간보스 14종 ---
    "mb_ep1b01_gate72":      {"height": 2.35, "weapon": "none",   "color": (0.86, 0.72, 0.34, 1.0), "attack": "Attack_BossCast"},
    "mb_ep1b02_shell":       {"height": 2.25, "weapon": "none",   "color": (0.46, 0.56, 0.34, 1.0), "attack": "Attack_BossCast"},
    "mb_ep1b03_compare":     {"height": 2.15, "weapon": "none",   "color": (0.72, 0.88, 0.98, 1.0), "attack": "Attack_BossHoverCast"},
    "mb_ep1b04_kitchen":     {"height": 2.20, "weapon": "sword",  "color": (0.96, 0.40, 0.10, 1.0), "attack": "Attack_DownCleave"},
    "mb_ep1b05_director":    {"height": 2.10, "weapon": "none",   "color": (0.86, 0.16, 0.24, 1.0), "attack": "Attack_BossCast"},
    "mb_ep1b06_vault":       {"height": 2.15, "weapon": "none",   "color": (0.82, 0.68, 0.34, 1.0), "attack": "Attack_BossCast"},
    "mb_ep1b06b_sentinel":   {"height": 2.30, "weapon": "none",   "color": (0.94, 0.72, 0.18, 1.0), "attack": "Attack_BossCast"},
    "mb_ep1b07_flame":       {"height": 2.20, "weapon": "rifle",  "color": (0.98, 0.36, 0.08, 1.0), "attack": "Attack_AimFire"},
    "mb_ep1b08_bodyguard":   {"height": 2.10, "weapon": "none",   "color": (0.28, 0.28, 0.32, 1.0), "attack": "Attack_BossCast"},
    "mb_ep1b09_orb":         {"height": 1.90, "weapon": "none",   "color": (0.38, 0.82, 0.96, 1.0), "attack": "Attack_BossHoverCast"},
    "mb_u201_war":           {"height": 2.25, "weapon": "rifle",  "color": (0.18, 0.78, 0.98, 1.0), "attack": "Attack_AimFire"},
    "mb_u202_mercy":         {"height": 2.10, "weapon": "staff",  "color": (0.78, 0.92, 0.98, 1.0), "attack": "Attack_BossCast"},
    "mb_u206_core":          {"height": 1.85, "weapon": "none",   "color": (0.14, 0.84, 0.98, 1.0), "attack": "Attack_BossHoverCast"},
    "mb_u203_frame":         {"height": 2.50, "weapon": "none",   "color": (0.72, 0.74, 0.78, 1.0), "attack": "Attack_BossCast"},
    # --- 제5부~제8부 스토리모드 중간보스 12종 (전체 완결) ---
    "mb_kair01_thrall":      {"height": 1.80, "weapon": "none",   "color": (0.24, 0.92, 0.82, 1.0), "attack": "Attack_BossCast"},
    "mb_kair04_guard50":     {"height": 2.40, "weapon": "spear",  "color": (0.22, 0.62, 0.98, 1.0), "attack": "Attack_LanceThrust"},
    "mb_hando01_devourer":   {"height": 2.45, "weapon": "none",   "color": (0.48, 0.64, 0.74, 1.0), "attack": "Attack_BossCast"},
    "mb_hando02_enforcer":   {"height": 1.92, "weapon": "sword",  "color": (0.78, 0.82, 0.86, 1.0), "attack": "Attack_DownCleave"},
    "mb_hando03_reclaim":    {"height": 2.35, "weapon": "sword",  "color": (0.64, 0.76, 0.88, 1.0), "attack": "Attack_DownCleave"},
    "mb_murder01_witness":   {"height": 2.05, "weapon": "none",   "color": (0.12, 0.86, 0.96, 1.0), "attack": "Attack_BossCast"},
    "mb_murder02_clerk":     {"height": 1.98, "weapon": "none",   "color": (0.82, 0.56, 0.24, 1.0), "attack": "Attack_BossCast"},
    "mb_murder04_alarm":     {"height": 2.25, "weapon": "none",   "color": (0.94, 0.14, 0.16, 1.0), "attack": "Attack_BossCast"},
    "mb_cult01_rose":        {"height": 2.15, "weapon": "none",   "color": (0.86, 0.18, 0.30, 1.0), "attack": "Attack_BossCast"},
    "mb_cult05_biotank":     {"height": 2.35, "weapon": "none",   "color": (0.84, 0.16, 0.24, 1.0), "attack": "Attack_BossHoverCast"},
    "mb_cult06_trial":       {"height": 2.55, "weapon": "none",   "color": (0.92, 0.14, 0.18, 1.0), "attack": "Attack_BossCast"},
    "mb_cult04_throne":      {"height": 2.10, "weapon": "none",   "color": (0.94, 0.22, 0.28, 1.0), "attack": "Attack_BossCast"},
    # --- 제1부 스토리모드 일반몹 15종 (1.2m ~ 1.9m 일반몹 규격) ---
    "mob_dist01_spider":     {"height": 1.15, "weapon": "none",   "color": (0.52, 0.22, 0.86, 1.0), "attack": "Attack_BossCast"},
    "mob_dist01_skeleton":   {"height": 1.72, "weapon": "sword",  "color": (0.78, 0.22, 0.22, 1.0), "attack": "Attack_DownCleave"},
    "mob_dist02_goat":       {"height": 1.85, "weapon": "none",   "color": (0.72, 0.18, 0.18, 1.0), "attack": "Attack_DownCleave"},
    "mob_dist02_comrade":    {"height": 1.85, "weapon": "sword",  "color": (0.62, 0.24, 0.90, 1.0), "attack": "Attack_DownCleave"},
    "mob_dist02_mage":       {"height": 1.75, "weapon": "staff",  "color": (0.86, 0.16, 0.22, 1.0), "attack": "Attack_BossCast"},
    "mob_dist03_ghoul":      {"height": 1.65, "weapon": "none",   "color": (0.58, 0.56, 0.52, 1.0), "attack": "Attack_DownCleave"},
    "mob_dist05_gargoyle":   {"height": 1.75, "weapon": "none",   "color": (0.94, 0.62, 0.14, 1.0), "attack": "Attack_BossCast"},
    "mob_ep1a07_echo":       {"height": 1.78, "weapon": "none",   "color": (0.62, 0.22, 0.94, 1.0), "attack": "Attack_BossHoverCast"},
    "mob_ep1a07_vortex":     {"height": 1.55, "weapon": "none",   "color": (0.58, 0.20, 0.92, 1.0), "attack": "Attack_BossHoverCast"},
    "mob_ep1a08_orderly":    {"height": 1.82, "weapon": "sword",  "color": (0.82, 0.82, 0.78, 1.0), "attack": "Attack_DownCleave"},
    "mob_ep1a08_scream":     {"height": 1.70, "weapon": "none",   "color": (0.72, 0.58, 0.92, 1.0), "attack": "Attack_BossHoverCast"},
    "mob_ep1a09_vial":       {"height": 1.45, "weapon": "none",   "color": (0.94, 0.16, 0.16, 1.0), "attack": "Attack_BossCast"},
    "mob_ep1a10_denial":     {"height": 1.78, "weapon": "none",   "color": (0.58, 0.60, 0.62, 1.0), "attack": "Attack_BossCast"},
    "mob_ep1a10_addict":     {"height": 1.60, "weapon": "none",   "color": (0.92, 0.14, 0.16, 1.0), "attack": "Attack_BossHoverCast"},
    "mob_ep1a11_ego":        {"height": 1.85, "weapon": "none",   "color": (0.88, 0.82, 0.62, 1.0), "attack": "Attack_BossCast"},
    # --- 제2부 스토리모드 고유 일반몹 11종 ---
    "mob_ep1b01_seal":       {"height": 1.35, "weapon": "none",   "color": (0.82, 0.16, 0.24, 1.0), "attack": "Attack_BossCast"},
    "mob_ep1b01_brain":      {"height": 1.50, "weapon": "none",   "color": (0.64, 0.24, 0.94, 1.0), "attack": "Attack_BossHoverCast"},
    "mob_ep1b01_glass":      {"height": 1.40, "weapon": "none",   "color": (0.72, 0.78, 0.84, 1.0), "attack": "Attack_BossHoverCast"},
    "mob_ep1b02_mold":       {"height": 1.25, "weapon": "none",   "color": (0.44, 0.50, 0.30, 1.0), "attack": "Attack_BossCast"},
    "mob_ep1b04_scrap":      {"height": 1.30, "weapon": "none",   "color": (0.54, 0.50, 0.24, 1.0), "attack": "Attack_BossCast"},
    "mob_ep1b05_doll":       {"height": 1.72, "weapon": "none",   "color": (0.84, 0.14, 0.22, 1.0), "attack": "Attack_BossCast"},
    "mob_ep1b06_fox":        {"height": 1.15, "weapon": "none",   "color": (0.86, 0.68, 0.26, 1.0), "attack": "Attack_DownCleave"},
    "mob_ep1b06_taxidermy":  {"height": 1.35, "weapon": "none",   "color": (0.78, 0.58, 0.24, 1.0), "attack": "Attack_DownCleave"},
    "mob_ep1b07_wolf":       {"height": 1.25, "weapon": "none",   "color": (0.98, 0.38, 0.08, 1.0), "attack": "Attack_DownCleave"},
    "mob_ep1b08_zombie":     {"height": 1.82, "weapon": "sword",  "color": (0.24, 0.78, 0.86, 1.0), "attack": "Attack_DownCleave"},
    "mob_ep1b09_hound":      {"height": 1.45, "weapon": "none",   "color": (0.92, 0.16, 0.20, 1.0), "attack": "Attack_BossCast"},
    # --- 제3부 · 제4부 스토리모드 일반몹 11종 ---
    "mob_u201_drone":        {"height": 1.15, "weapon": "none",   "color": (0.16, 0.84, 0.98, 1.0), "attack": "Attack_BossHoverCast"},
    "mob_u201_hound":        {"height": 1.20, "weapon": "none",   "color": (0.96, 0.36, 0.12, 1.0), "attack": "Attack_DownCleave"},
    "mob_u201_knight":       {"height": 1.82, "weapon": "rifle",  "color": (0.24, 0.84, 0.96, 1.0), "attack": "Attack_AimFire"},
    "mob_u202_collector":    {"height": 1.80, "weapon": "none",   "color": (0.18, 0.88, 0.96, 1.0), "attack": "Attack_BossCast"},
    "mob_u202_orb":          {"height": 1.25, "weapon": "none",   "color": (0.18, 0.82, 0.98, 1.0), "attack": "Attack_BossHoverCast"},
    "mob_u204_blue_wraith":  {"height": 1.78, "weapon": "none",   "color": (0.20, 0.68, 0.96, 1.0), "attack": "Attack_BossHoverCast"},
    "mob_u204_void_wraith":  {"height": 1.78, "weapon": "none",   "color": (0.58, 0.22, 0.94, 1.0), "attack": "Attack_BossHoverCast"},
    "mob_u204_spider":       {"height": 1.15, "weapon": "none",   "color": (0.94, 0.18, 0.24, 1.0), "attack": "Attack_BossCast"},
    "mob_l304_slime":        {"height": 0.95, "weapon": "none",   "color": (0.56, 0.94, 0.16, 1.0), "attack": "Attack_BossCast"},
    "mob_l304_wolf":         {"height": 1.15, "weapon": "none",   "color": (0.64, 0.58, 0.52, 1.0), "attack": "Attack_DownCleave"},
    "mob_l305_goblin":       {"height": 1.38, "weapon": "sword",  "color": (0.46, 0.68, 0.26, 1.0), "attack": "Attack_DownCleave"},
    # --- 일반몹 배치 4: 제5부 카이로노미콘 · 제6부 두 사람의 성 · 제7부 파란불 · 제8부 합일몽세 (13종) ---
    "mob_kair_collector":  {"height": 1.72, "weapon": "staff", "color": (0.52, 0.16, 0.24, 1.0), "attack": "Attack_BossCast"},
    "mob_kair_connector":  {"height": 1.88, "weapon": "staff", "color": (0.48, 0.28, 0.62, 1.0), "attack": "Attack_BossCast"},
    "mob_kair_guard_base": {"height": 1.96, "weapon": "spear", "color": (0.16, 0.68, 0.94, 1.0), "attack": "Attack_LanceThrust"},
    "mob_kair_elite_base": {"height": 2.12, "weapon": "spear", "color": (0.62, 0.56, 0.92, 1.0), "attack": "Attack_LanceThrust"},
    "mob_h101_guard":      {"height": 1.86, "weapon": "sword", "color": (0.42, 0.48, 0.58, 1.0), "attack": "Attack_DownCleave"},
    "mob_h101_scout":      {"height": 1.74, "weapon": "sword", "color": (0.36, 0.30, 0.52, 1.0), "attack": "Attack_DiagonalSlash"},
    "mob_h102_sentinel":   {"height": 1.94, "weapon": "spear", "color": (0.38, 0.44, 0.54, 1.0), "attack": "Attack_LanceThrust"},
    "mob_h102_connector":  {"height": 1.82, "weapon": "staff", "color": (0.46, 0.38, 0.66, 1.0), "attack": "Attack_BossCast"},
    "mob_h102_trace":      {"height": 1.80, "weapon": "sword", "color": (0.58, 0.62, 0.72, 1.0), "attack": "Attack_DiagonalSlash"},
    "mob_h103_shadow":     {"height": 1.84, "weapon": "sword", "color": (0.28, 0.30, 0.38, 1.0), "attack": "Attack_DiagonalSlash"},
    "mob_murder_executor": {"height": 1.98, "weapon": "sword", "color": (0.14, 0.78, 0.88, 1.0), "attack": "Attack_DownCleave"},
    "mob_c101_blindfold":  {"height": 1.76, "weapon": "none",  "color": (0.44, 0.22, 0.22, 1.0), "attack": "Attack_DiagonalSlash"},
    "mob_c101_earcover":   {"height": 1.76, "weapon": "none",  "color": (0.34, 0.36, 0.38, 1.0), "attack": "Attack_DiagonalSlash"},
}


def parse_args():
    argv = sys.argv
    extra = argv[argv.index("--") + 1:] if "--" in argv else []
    args = {"hero": None, "input": None, "output": None, "batch_dir": None, "out_dir": "assets/models"}
    i = 0
    while i < len(extra):
        k = extra[i]
        if k in ("--hero", "--input", "--output", "--batch-dir", "--out-dir") and i + 1 < len(extra):
            args[k.lstrip("-").replace("-", "_")] = extra[i + 1]
            i += 2
        else:
            i += 1
    return args


def make_mat(name, rgba, metallic=0.8, roughness=0.3, emit=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = rgba
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        if emit > 0.0 and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = rgba
            bsdf.inputs["Emission Strength"].default_value = emit
    return mat


def import_and_normalize(glb_path, target_height, hero_id):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = FPS
    bpy.ops.import_scene.gltf(filepath=glb_path)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not meshes:
        raise RuntimeError(f"No mesh in {glb_path}")

    bpy.ops.object.select_all(action="DESELECT")
    for m in meshes:
        m.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()

    obj = bpy.context.active_object
    obj.name = f"{hero_id}_Body"
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for o in list(bpy.context.scene.objects):
        if o != obj:
            bpy.data.objects.remove(o, do_unlink=True)

    verts = [obj.matrix_world @ v.co for v in obj.data.vertices]
    min_z, max_z = min(v.z for v in verts), max(v.z for v in verts)
    raw_h = max_z - min_z
    sc = target_height / max(raw_h, 0.01)
    core = [v for v in verts if min_z + raw_h * 0.15 <= v.z <= min_z + raw_h * 0.55]
    cx = sum(v.x for v in core) / max(len(core), 1)
    cy = sum(v.y for v in core) / max(len(core), 1)
    for v in obj.data.vertices:
        v.co.x = (v.co.x - cx) * sc
        v.co.y = (v.co.y - cy) * sc
        v.co.z = (v.co.z - min_z) * sc
    obj.data.update()
    return obj


def build_armature(hero_id, h):
    s = h / 1.70
    arm_data = bpy.data.armatures.new(f"{hero_id}_RigData")
    arm_obj = bpy.data.objects.new(f"{hero_id}_Rig", arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm_data.edit_bones

    def add(name, head, tail, parent=None, conn=False):
        b = eb.new(name)
        b.head = Vector(head) * s
        b.tail = Vector(tail) * s
        b.roll = 0.0
        if parent:
            b.parent = parent
            b.use_connect = conn
        return b

    root   = add("Root",            (0, 0, 0),          (0, 0, 0.18))
    pelvis = add("Pelvis",          (0, 0, 0.85),       (0, 0, 1.05), root)
    chest  = add("Spine_Chest",     (0, 0, 1.05),       (0, 0, 1.40), pelvis, True)
    add("Head",                     (0, 0, 1.40),       (0, 0, 1.68), chest, True)

    # 상완 + 전완 2단 분리 (팔꿈치 자연스러운 굽힘 + 어깨 찌그러짐 방지)
    arm_r  = add("Arm_R",           (-0.19, 0, 1.34),   (-0.33, 0, 1.13), chest)
    fore_r = add("Forearm_R",       (-0.33, 0, 1.13),   (-0.47, 0, 0.92), arm_r, True)
    add("Weapon_Socket_R",          (-0.47, 0, 0.92),   (-0.47, -0.30, 0.92), fore_r, True)

    arm_l  = add("Arm_L",           (0.19, 0, 1.34),    (0.33, 0, 1.13), chest)
    fore_l = add("Forearm_L",       (0.33, 0, 1.13),    (0.47, 0, 0.92), arm_l, True)
    add("Weapon_Socket_L",          (0.47, 0, 0.92),    (0.47, -0.30, 0.92), fore_l, True)

    th_r   = add("Thigh_R",         (-0.10, 0, 0.83),   (-0.10, 0, 0.42), pelvis)
    add("Shin_R",                   (-0.10, 0, 0.42),   (-0.10, -0.04, 0.03), th_r, True)
    th_l   = add("Thigh_L",         (0.10, 0, 0.83),    (0.10, 0, 0.42), pelvis)
    add("Shin_L",                   (0.10, 0, 0.42),    (0.10, -0.04, 0.03), th_l, True)

    bpy.ops.object.mode_set(mode="OBJECT")
    return arm_obj


def create_weapon_mesh(hero_id, wtype, color_rgba):
    if wtype == "none":
        return None
    m_dark = make_mat(f"{hero_id}_MatDark", (0.14, 0.15, 0.17, 1.0), 0.85, 0.30)
    m_glow = make_mat(f"{hero_id}_MatGlow", color_rgba, 0.15, 0.22, emit=3.2)
    parts = []

    if wtype == "spear":
        bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.018, depth=1.55, location=(0, -0.45, 0), rotation=(math.pi/2, 0, 0))
        o = bpy.context.active_object; o.data.materials.append(m_dark); parts.append(o)
        bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.07, radius2=0.004, depth=0.45, location=(0, -1.35, 0), rotation=(-math.pi/2, 0, math.pi/4))
        o = bpy.context.active_object; o.data.materials.append(m_glow); parts.append(o)
    elif wtype == "staff":
        bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.022, depth=1.35, location=(0, -0.35, 0), rotation=(math.pi/2, 0, 0))
        o = bpy.context.active_object; o.data.materials.append(m_dark); parts.append(o)
        bpy.ops.mesh.primitive_cube_add(size=0.14, location=(0, -1.06, 0))
        o = bpy.context.active_object; o.data.materials.append(m_glow); parts.append(o)
    elif wtype == "hwando":
        m_gold = make_mat(f"{hero_id}_MatGold", (0.72, 0.54, 0.26, 1.0), 0.75, 0.35)
        bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.016, depth=0.22, location=(0, 0.08, 0), rotation=(math.pi/2, 0, 0))
        o = bpy.context.active_object; o.data.materials.append(m_dark); parts.append(o)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.04, 0))
        o = bpy.context.active_object; o.scale = (0.07, 0.02, 0.08); o.data.materials.append(m_gold); parts.append(o)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.48, -0.06), rotation=(math.radians(-10), 0, 0))
        o = bpy.context.active_object; o.scale = (0.012, 0.88, 0.044); o.data.materials.append(m_glow); parts.append(o)
    elif wtype == "sword":
        bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.018, depth=0.30, location=(0, 0.05, 0), rotation=(math.pi/2, 0, 0))
        o = bpy.context.active_object; o.data.materials.append(m_dark); parts.append(o)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.12, 0))
        o = bpy.context.active_object; o.scale = (0.20, 0.04, 0.06); o.data.materials.append(m_dark); parts.append(o)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.64, 0))
        o = bpy.context.active_object; o.scale = (0.02, 1.02, 0.09); o.data.materials.append(m_dark); parts.append(o)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.62, 0))
        o = bpy.context.active_object; o.scale = (0.026, 0.85, 0.028); o.data.materials.append(m_glow); parts.append(o)
    elif wtype == "bow":
        bpy.ops.mesh.primitive_torus_add(major_radius=0.52, minor_radius=0.022, location=(0, -0.12, 0), rotation=(0, math.pi/2, 0))
        o = bpy.context.active_object; o.scale = (1.0, 0.45, 1.0); o.data.materials.append(m_glow); parts.append(o)
    elif wtype == "rifle":
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.32, 0.02))
        o = bpy.context.active_object; o.scale = (0.05, 0.78, 0.11); o.data.materials.append(m_dark); parts.append(o)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.36, 0.05))
        o = bpy.context.active_object; o.scale = (0.056, 0.62, 0.024); o.data.materials.append(m_glow); parts.append(o)

    bpy.ops.object.select_all(action="DESELECT")
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    if len(parts) > 1:
        bpy.ops.object.join()
    w = bpy.context.active_object
    w.name = f"{hero_id}_Weapon"
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return w


def bake_hero_animations(arm_obj, hero_id, preset):
    """
    모든 회전·이동값을 Blender 월드/아마추어 기준 축(X=좌우 피치, Y=앞뒤 롤, Z=좌우 요/비틀기,
    위치=(X좌우, Y앞뒤[-Y정면], Z상하))으로 계산한 뒤 각 본의 레스트 행렬로 정확히 로컬 변환하고,
    glTF 네이티브 쿼터니언으로 베이크합니다.
    """
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="POSE")
    for pb in arm_obj.pose.bones:
        pb.rotation_mode = "QUATERNION"

    # 각 본의 레스트 3x3 회전 행렬 캐시 (월드 축 -> 본 로컬 축 변환용)
    rest_mats = {pb.name: pb.bone.matrix_local.to_3x3() for pb in arm_obj.pose.bones}
    rest_invs = {name: m.inverted() for name, m in rest_mats.items()}

    def reset():
        for pb in arm_obj.pose.bones:
            pb.location = (0.0, 0.0, 0.0)
            pb.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)

    def key(f):
        for pb in arm_obj.pose.bones:
            pb.keyframe_insert("location", frame=f)
            pb.keyframe_insert("rotation_quaternion", frame=f)

    def wloc(name, dx, dy, dz):
        # 월드 기준 이동(dx=우, dy=뒤[-Y가 정면], dz=위) -> 본 로컬 위치로 변환
        pb = arm_obj.pose.bones[name]
        pb.location = rest_invs[name] @ Vector((dx, dy, dz))

    def rot(name, rx, ry, rz):
        # 월드 기준 오일러(rx=앞뒤 숙임, ry=좌우 기울임, rz=수평 비틀기/요) -> 본 로컬 쿼터니언 변환
        pb = arm_obj.pose.bones[name]
        r_world = Euler((rx * D2R, ry * D2R, rz * D2R), "XYZ").to_matrix()
        r_local = rest_invs[name] @ r_world @ rest_mats[name]
        pb.rotation_quaternion = r_local.to_quaternion()

    def push(name):
        act = arm_obj.animation_data.action
        act.name = name
        tr = arm_obj.animation_data.nla_tracks.new()
        tr.name = name
        strip = tr.strips.new(name, int(act.frame_range[0]), act)
        strip.action_frame_start = act.frame_range[0]
        strip.action_frame_end = act.frame_range[1]
        tr.mute = True  # NLA 트랙 간 겹침 블렌딩 방지 (glTF 익스포터는 개별 트랙별로 클립 추출)
        arm_obj.animation_data.action = None

    if not arm_obj.animation_data:
        arm_obj.animation_data_create()

    # 1. Idle (자연스러운 호흡 + A포즈에서 팔 내림)
    arm_obj.animation_data.action = bpy.data.actions.new("Idle")
    for f, s in [(1, 0.0), (24, 1.0), (48, 0.0)]:
        reset()
        wloc("Pelvis", 0, 0, -0.015 * s)
        rot("Spine_Chest", 3 + 2.5 * s, 0, 0)
        rot("Head", -2 - 1.5 * s, 0, 0)
        rot("Arm_R", 8 + 3 * s, -22, 0)
        rot("Forearm_R", -16, 0, 0)
        rot("Arm_L", 6 - 3 * s, 22, 0)
        rot("Forearm_L", -14, 0, 0)
        key(f)
    push("Idle")

    # 2. Walk (자연스러운 보행 — 상하 바운스 Z + 골반/흉부 반대 요 Z)
    arm_obj.animation_data.action = bpy.data.actions.new("Walk")
    for f, rth, rsh, lth, lsh, yaw, bob in [
        (1,  -26, 12,  24, 18,  7, 0.000),
        (7,   -4, 34,   4, 10,  0, 0.028),
        (13,  24, 18, -26, 12, -7, 0.000),
        (19,   4, 10,  -4, 34,  0, 0.028),
        (25, -26, 12,  24, 18,  7, 0.000),
    ]:
        reset()
        wloc("Pelvis", 0, 0, bob - 0.018)
        rot("Pelvis", 0, 0, yaw)
        rot("Spine_Chest", 7, 0, -yaw)
        rot("Thigh_R", rth, 0, 0); rot("Shin_R", rsh, 0, 0)
        rot("Thigh_L", lth, 0, 0); rot("Shin_L", lsh, 0, 0)
        rot("Arm_R", 8 + rth * 0.45, -22, 0); rot("Forearm_R", -18, 0, 0)
        rot("Arm_L", 8 - rth * 0.45,  22, 0); rot("Forearm_L", -18, 0, 0)
        key(f)
    push("Walk")

    # 3. Hero / Monster Attack
    atk_name = preset["attack"]
    arm_obj.animation_data.action = bpy.data.actions.new(atk_name)
    reset()
    rot("Arm_R", 8, -22, 0); rot("Forearm_R", -16, 0, 0)
    rot("Arm_L", 6,  22, 0); rot("Forearm_L", -14, 0, 0)
    key(1)

    if hero_id == "hwando" or atk_name == "Attack_DiagonalSlash":
        # 대각 베기: 상체 좌측 비틀기(와인드업) -> 전방 도약하며 우하단 큰 호로 횡/대각 베기 -> 팔로스루
        reset()
        wloc("Pelvis", 0, 0.06, -0.02)
        rot("Pelvis", 0, 0, 22)
        rot("Spine_Chest", 6, -6, 36)
        rot("Head", -4, 0, -32)
        rot("Arm_R", -78, 18, 48); rot("Forearm_R", -32, 0, 14); rot("Weapon_Socket_R", -12, 0, 0)
        rot("Arm_L", -18, 16, 14); rot("Forearm_L", -28, 0, 0)
        key(6)

        reset()
        wloc("Pelvis", 0, -0.14, -0.09)
        rot("Pelvis", 4, 0, -24)
        rot("Spine_Chest", 14, 6, -42)
        rot("Head", -8, 0, 38)
        rot("Thigh_R", -30, 0, 0); rot("Shin_R", 34, 0, 0)
        rot("Thigh_L", 24, 0, 0);  rot("Shin_L", 12, 0, 0)
        rot("Arm_R", -36, -24, -62); rot("Forearm_R", -14, 0, -18); rot("Weapon_Socket_R", -26, 0, 0)
        rot("Arm_L", 22, 26, -16);   rot("Forearm_L", -22, 0, 0)
        key(11)

        reset()
        wloc("Pelvis", 0, -0.10, -0.06)
        rot("Pelvis", 2, 0, -28)
        rot("Spine_Chest", 12, 4, -46)
        rot("Head", -6, 0, 40)
        rot("Thigh_R", -22, 0, 0); rot("Shin_R", 24, 0, 0)
        rot("Thigh_L", 18, 0, 0);  rot("Shin_L", 10, 0, 0)
        rot("Arm_R", 14, -32, -74); rot("Forearm_R", -10, 0, -12); rot("Weapon_Socket_R", -18, 0, 0)
        rot("Arm_L", 18, 24, -12)
        key(14)

    elif hero_id == "slayer" or atk_name == "Attack_DownCleave":
        # 대검 내려베기
        reset()
        wloc("Pelvis", 0, 0.05, 0.02)
        rot("Spine_Chest", -14, 0, 22)
        rot("Arm_R", -132, 16, 28); rot("Forearm_R", -24, 0, 0)
        rot("Arm_L", -118, -14, -22); rot("Forearm_L", -24, 0, 0)
        key(7)

        reset()
        wloc("Pelvis", 0, -0.16, -0.12)
        rot("Pelvis", 4, 0, -18)
        rot("Spine_Chest", 22, 0, -30)
        rot("Thigh_R", -34, 0, 0); rot("Shin_R", 40, 0, 0)
        rot("Thigh_L", 28, 0, 0);  rot("Shin_L", 12, 0, 0)
        rot("Arm_R", 24, -18, -32); rot("Forearm_R", -12, 0, 0)
        rot("Arm_L", 18, 16, 20);   rot("Forearm_L", -12, 0, 0)
        key(12)

    elif hero_id in ("gunner", "hunter") or atk_name in ("Attack_AimFire", "Attack_BowShot"):
        # 조준 사격
        reset()
        rot("Spine_Chest", 4, 0, 14)
        rot("Head", 0, 0, -14)
        rot("Arm_R", -84, -14, 8);  rot("Forearm_R", -14, 0, 0)
        rot("Arm_L", -80, 16, -12); rot("Forearm_L", -24, 0, 0)
        key(7)

        reset()
        wloc("Pelvis", 0, 0.05, -0.02)
        rot("Spine_Chest", -5, 0, 14)
        rot("Head", 3, 0, -14)
        rot("Arm_R", -92, -14, 8);  rot("Forearm_R", -16, 0, 0)
        rot("Arm_L", -86, 16, -12); rot("Forearm_L", -26, 0, 0)
        key(11)

    elif hero_id == "lauren" or atk_name == "Attack_LanceThrust":
        # 창 관통 찌르기
        reset()
        wloc("Pelvis", 0, 0.06, -0.02)
        rot("Spine_Chest", 6, 0, -28)
        rot("Head", 0, 0, 24)
        rot("Arm_R", 24, -18, -14); rot("Forearm_R", -34, 0, 0)
        rot("Arm_L", -28, 18, 12);  rot("Forearm_L", -24, 0, 0)
        key(6)

        reset()
        wloc("Pelvis", 0, -0.20, -0.12)
        rot("Pelvis", 4, 0, 16)
        rot("Spine_Chest", 18, 0, 26)
        rot("Head", -6, 0, -24)
        rot("Thigh_R", -36, 0, 0); rot("Shin_R", 42, 0, 0)
        rot("Thigh_L", 30, 0, 0);  rot("Shin_L", 12, 0, 0)
        rot("Arm_R", -86, -16, 10); rot("Forearm_R", -8, 0, 0)
        rot("Arm_L", -72, 20, -12); rot("Forearm_L", -16, 0, 0)
        key(11)

    else:
        # 시전 / 보스 방출 (Cast / Heal / Ego)
        reset()
        wloc("Pelvis", 0, 0.04, 0.02)
        rot("Spine_Chest", -8, 0, -16)
        rot("Arm_R", -46, -12, -14); rot("Forearm_R", -32, 0, 0)
        rot("Arm_L", -42,  12,  14); rot("Forearm_L", -32, 0, 0)
        key(6)

        reset()
        wloc("Pelvis", 0, -0.10, -0.06)
        rot("Spine_Chest", 14, 0, 18)
        rot("Thigh_R", -24, 0, 0); rot("Shin_R", 28, 0, 0)
        rot("Thigh_L", 20, 0, 0);  rot("Shin_L", 10, 0, 0)
        rot("Arm_R", -86, -14, 12);  rot("Forearm_R", -10, 0, 0)
        rot("Arm_L", -78,  14, -12); rot("Forearm_L", -10, 0, 0)
        key(11)

    reset()
    rot("Arm_R", 8, -22, 0); rot("Forearm_R", -16, 0, 0)
    rot("Arm_L", 6,  22, 0); rot("Forearm_L", -14, 0, 0)
    key(20)
    push(atk_name)
    bpy.ops.object.mode_set(mode="OBJECT")


def process_one(hero_id, in_glb, out_glb):
    preset = HERO_PRESETS[hero_id]
    body = import_and_normalize(in_glb, preset["height"], hero_id)
    arm = build_armature(hero_id, preset["height"])

    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True); arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")

    weapon = create_weapon_mesh(hero_id, preset["weapon"], preset["color"])
    if weapon:
        sock_name = "Weapon_Socket_L" if preset["weapon"] == "bow" else "Weapon_Socket_R"
        s = preset["height"] / 1.70
        weapon.location = Vector(((0.47 if sock_name.endswith("_L") else -0.47) * s, 0.0, 0.92 * s))
        bpy.ops.object.select_all(action="DESELECT")
        weapon.select_set(True); arm.select_set(True)
        bpy.context.view_layer.objects.active = arm
        bpy.ops.object.mode_set(mode="POSE")
        arm.data.bones.active = arm.data.bones[sock_name]
        bpy.ops.object.parent_set(type="BONE", keep_transform=True)
        bpy.ops.object.mode_set(mode="OBJECT")

    bake_hero_animations(arm, hero_id, preset)

    os.makedirs(os.path.dirname(os.path.abspath(out_glb)), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    arm.select_set(True); body.select_set(True)
    if weapon:
        weapon.select_set(True)
    export_kwargs = dict(
        filepath=os.path.abspath(out_glb),
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_force_sampling=True,
        export_yup=True,
    )
    # Blender 4.x/5.x 호환: NLA 트랙별 독립 클립 추출 (트랙 중첩 블렌딩 방지)
    props = bpy.ops.export_scene.gltf.get_rna_type().properties
    if "export_animation_mode" in props:
        export_kwargs["export_animation_mode"] = "NLA_TRACKS"
    elif "export_nla_strips" in props:
        export_kwargs["export_nla_strips"] = True
    bpy.ops.export_scene.gltf(**export_kwargs)
    print(f"[StoryWorld] Exported {hero_id} -> {os.path.abspath(out_glb)} (Idle, Walk, {preset['attack']})")


def main():
    args = parse_args()
    if args["batch_dir"]:
        for hero_id in HERO_PRESETS:
            cand = os.path.join(args["batch_dir"], f"{hero_id}_trellis2.glb")
            if not os.path.exists(cand):
                cand = os.path.join(args["batch_dir"], f"{hero_id}.glb")
            if os.path.exists(cand):
                out = os.path.join(args["out_dir"], f"{hero_id}_hero_rigged_final.glb")
                process_one(hero_id, cand, out)
    else:
        if not args["hero"] or args["hero"] not in HERO_PRESETS:
            raise ValueError(f"--hero must be one of {list(HERO_PRESETS.keys())}")
        if not args["input"] or not os.path.exists(args["input"]):
            raise FileNotFoundError(f"Input GLB not found: {args['input']}")
        out = args["output"] or f"{args['hero']}_hero_rigged_final.glb"
        process_one(args["hero"], args["input"], out)


if __name__ == "__main__":
    main()