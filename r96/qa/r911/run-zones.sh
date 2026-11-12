#!/bin/bash
# 몹·보스 투사체 순회: 기억사수(원거리)로 지역마다 6초씩
cd "$(dirname "$0")"
timeout 3000 node census.mjs gunner "$1" 6 > "census-log-zones-$2.txt" 2>&1
