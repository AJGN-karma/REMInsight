#!/usr/bin/env bash
# simple load test using hey (install from https://github.com/rakyll/hey)
# usage: ./scripts/load_test.sh https://reminsight-api.onrender.com

API=${1:-http://127.0.0.1:8000}

hey -n 1000 -c 50 -m POST \
  -H "Content-Type: application/json" \
  -d '{"features":{"recording_id":"s1","subject_id":"u1","age":30,"sex":"male","site":"site_a","device_model":"model_x","psqi_c1":1,"psqi_c2":1,"psqi_c3":1,"psqi_c4":1,"psqi_c5":1,"psqi_c6":0,"psqi_c7":1,"psqi_global":6,"TST_min":420,"REM_total_min":90,"REM_latency_min":80,"REM_pct":0.21,"REM_density":0.18,"sleep_efficiency_pct":0.92,"micro_arousals_count":14,"mean_delta_pow":1.1,"mean_theta_pow":0.7,"mean_alpha_pow":0.5,"mean_beta_pow":0.3,"artifact_pct":2.0,"percent_epochs_missing":0.0}}' \
  $API/predict
