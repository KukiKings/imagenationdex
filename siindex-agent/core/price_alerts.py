"""
SIINDEX Price Alerts
=====================
Citizen sets price thresholds → SIINDEX speaks when INDX hits them.
Alerts survive restarts (persisted to memory/price_alerts.json).
Polls every 60 seconds in background thread.
"""

import json
import threading
import time
from pathlib import Path
from typing import Callable, Optional

from core.indx import get_indx_price, GRAND_SYNC_TARGET_USD

BASE_DIR     = Path(__file__).resolve().parent.parent
ALERTS_FILE  = BASE_DIR / "memory" / "price_alerts.json"
POLL_INTERVAL = 60  # seconds


class PriceAlert:
    def __init__(self, alert_id: str, direction: str, target: float,
                 label: str = "", fired: bool = False):
        """
        direction: 'above' or 'below'
        target: USD price threshold
        """
        self.id        = alert_id
        self.direction = direction  # 'above' | 'below'
        self.target    = target
        self.label     = label or f"INDX {direction} ${target:.2f}"
        self.fired     = fired      # True = already triggered, don't re-fire

    def check(self, current_price: float) -> bool:
        """Return True if this alert should fire now."""
        if self.fired:
            return False
        if self.direction == "above" and current_price >= self.target:
            return True
        if self.direction == "below" and current_price <= self.target:
            return True
        return False

    def to_dict(self) -> dict:
        return {
            "id":        self.id,
            "direction": self.direction,
            "target":    self.target,
            "label":     self.label,
            "fired":     self.fired,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "PriceAlert":
        return cls(
            alert_id=  d["id"],
            direction= d["direction"],
            target=    d["target"],
            label=     d.get("label", ""),
            fired=     d.get("fired", False),
        )


class PriceAlertEngine:
    def __init__(self, on_alert: Callable[[PriceAlert, float], None]):
        """
        on_alert: callback(alert, current_price) fired when threshold hit.
        """
        self.on_alert  = on_alert
        self.alerts:   list[PriceAlert] = []
        self._running  = False
        self._thread:  Optional[threading.Thread] = None
        self._load()
        self._seed_grand_sync_alert()

    # ── Persistence ──────────────────────────────────────────────
    def _load(self):
        if ALERTS_FILE.exists():
            try:
                data = json.loads(ALERTS_FILE.read_text())
                self.alerts = [PriceAlert.from_dict(d) for d in data]
            except Exception:
                self.alerts = []

    def _save(self):
        ALERTS_FILE.parent.mkdir(exist_ok=True)
        ALERTS_FILE.write_text(json.dumps(
            [a.to_dict() for a in self.alerts], indent=2
        ))

    def _seed_grand_sync_alert(self):
        """Auto-add Grand Synchronicity alert if not already present."""
        gs_id = "grand_synchronicity"
        exists = any(a.id == gs_id for a in self.alerts)
        if not exists:
            self.alerts.append(PriceAlert(
                alert_id=  gs_id,
                direction= "above",
                target=    GRAND_SYNC_TARGET_USD,
                label=     "Grand Synchronicity — INDX reached $2.50!",
            ))
            self._save()

    # ── Alert management ─────────────────────────────────────────
    def add_alert(self, direction: str, target: float, label: str = "") -> PriceAlert:
        """Add a new price alert. direction: 'above' | 'below'."""
        alert_id = f"alert_{int(time.time())}"
        alert    = PriceAlert(alert_id, direction, target, label)
        self.alerts.append(alert)
        self._save()
        print(f"[PriceAlert] Added: INDX {direction} ${target:.2f}")
        return alert

    def remove_alert(self, alert_id: str) -> bool:
        before = len(self.alerts)
        self.alerts = [a for a in self.alerts if a.id != alert_id]
        if len(self.alerts) < before:
            self._save()
            return True
        return False

    def list_alerts(self) -> list[PriceAlert]:
        return [a for a in self.alerts if not a.fired]

    def reset_alert(self, alert_id: str):
        """Re-arm a fired alert (useful for recurring alerts)."""
        for a in self.alerts:
            if a.id == alert_id:
                a.fired = False
        self._save()

    def parse_voice_command(self, text: str) -> Optional[PriceAlert]:
        """
        Parse natural language alert commands.
        e.g. "alert me when INDX hits $0.50"
             "tell me when INDX goes above 1 dollar"
             "notify me if INDX drops below 0.20"
        """
        import re
        t = text.lower()

        # Determine direction
        direction = None
        if any(w in t for w in ["above", "hits", "reaches", "over", "exceed"]):
            direction = "above"
        elif any(w in t for w in ["below", "drops", "falls", "under", "dips"]):
            direction = "below"

        if not direction:
            return None

        # Extract price
        price_match = re.search(r'\$?([\d]+\.?[\d]*)', t)
        if not price_match:
            return None

        target = float(price_match.group(1))
        if target <= 0 or target > 10000:
            return None

        return self.add_alert(direction, target)

    def format_active_alerts(self) -> str:
        active = self.list_alerts()
        if not active:
            return "No active price alerts."
        lines = [f"INDX {a.direction} ${a.target:.2f}" for a in active]
        return f"Active alerts: {'; '.join(lines)}."

    # ── Background polling ────────────────────────────────────────
    def start(self):
        if self._running:
            return
        self._running = True
        self._thread  = threading.Thread(target=self._poll_loop, daemon=True)
        self._thread.start()
        print(f"[PriceAlert] Monitoring {len(self.list_alerts())} alert(s) — polling every {POLL_INTERVAL}s")

    def stop(self):
        self._running = False

    def _poll_loop(self):
        while self._running:
            try:
                price = get_indx_price()
                for alert in self.alerts:
                    if alert.check(price):
                        alert.fired = True
                        self._save()
                        try:
                            self.on_alert(alert, price)
                        except Exception as e:
                            print(f"[PriceAlert] Callback error: {e}")
            except Exception as e:
                print(f"[PriceAlert] Poll error: {e}")
            time.sleep(POLL_INTERVAL)
