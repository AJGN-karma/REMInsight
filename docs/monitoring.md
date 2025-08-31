# Monitoring & Drift

- Logs: use Render logs; include trace_id per request.
- Metrics: track request count, latency p50/p95, error rate.
- Drift: nightly job computes feature distribution shifts vs training using KL divergence; alert if exceeds thresholds.
- APM: optional Sentry SDK (frontend + backend).
