#!/bin/bash
cd "$(dirname "$0")"
for h in "$@"; do timeout 1500 node census.mjs $h dist00 10 > census-log-$h.txt 2>&1; done
