"""
SIINDEX Scheduler
==================
Auto-fires morning briefing at configured time.
Runs in a background thread — no user interaction needed.
"""

import threading
import time
from datetime import datetime
from typing import Callable, Optional


class SIINDEXScheduler:
    def __init__(self):
        self._jobs:   list[dict] = []
        self._running = False
        self._thread: Optional[threading.Thread] = None

    def add_daily(self, hour: int, minute: int, fn: Callable, label: str = ""):
        """Schedule a function to run daily at HH:MM local time."""
        self._jobs.append({
            "type":   "daily",
            "hour":   hour,
            "minute": minute,
            "fn":     fn,
            "label":  label,
            "last_run_date": None,
        })
        print(f"[Scheduler] '{label}' scheduled daily at {hour:02d}:{minute:02d}")

    def add_interval(self, seconds: int, fn: Callable, label: str = ""):
        """Schedule a function to run every N seconds."""
        self._jobs.append({
            "type":      "interval",
            "seconds":   seconds,
            "fn":        fn,
            "label":     label,
            "last_run":  0.0,
        })
        print(f"[Scheduler] '{label}' scheduled every {seconds}s")

    def start(self):
        """Start the scheduler background thread."""
        if self._running:
            return
        self._running = True
        self._thread  = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False

    def _loop(self):
        while self._running:
            now = datetime.now()
            ts  = time.time()

            for job in self._jobs:
                try:
                    if job["type"] == "daily":
                        today = now.date()
                        if (now.hour   == job["hour"] and
                            now.minute == job["minute"] and
                            job["last_run_date"] != today):
                            job["last_run_date"] = today
                            print(f"[Scheduler] Firing '{job['label']}'")
                            threading.Thread(target=job["fn"], daemon=True).start()

                    elif job["type"] == "interval":
                        elapsed = ts - job["last_run"]
                        if elapsed >= job["seconds"]:
                            job["last_run"] = ts
                            threading.Thread(target=job["fn"], daemon=True).start()

                except Exception as e:
                    print(f"[Scheduler] Error in '{job.get('label', '?')}': {e}")

            time.sleep(30)  # check every 30s — fine-grained enough for HH:MM matching


def parse_time(time_str: str) -> tuple[int, int]:
    """Parse '07:00' or '7:30' → (hour, minute)."""
    parts = time_str.split(":")
    return int(parts[0]), int(parts[1]) if len(parts) > 1 else 0
