# Schedule: daily-briefing (target)

**Cron target:** `0 8 * * *` (local ops timezone TBD)  
**Action:** Internal status digest (site health, open M2M jobs, feedback counts).  
**Status:** Not always-on until heartbeat runner + AJ channel for delivery.  
**Runner:** `siindex-m2m/heartbeat.mjs` + GitHub Actions cron (partial).
