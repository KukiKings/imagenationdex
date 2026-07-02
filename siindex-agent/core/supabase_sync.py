"""
SIINDEX Supabase Sync
======================
Pulls live citizen data from the IN$DEX Supabase backend.
Uses the public anon key — read-only access to permitted tables.

Tables expected:
  citizens  (citizen_id, name, balance, wisdom_score, rank, nation, role)
  transactions (citizen_id, amount, type, created_at)
"""

import os
import time
from typing import Optional

import requests

# ── Credentials (loaded from .env via main.py) ───────────────────
SUPABASE_URL      = "https://zljgthfzbalsunuoohcd.supabase.co"
SUPABASE_ANON_KEY = os.getenv(
    "SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0"
    "aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iL"
    "CJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2Mz"
    "U1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA"
)

HEADERS = {
    "apikey":        SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type":  "application/json",
}

REQUEST_TIMEOUT = 8   # seconds
CACHE_TTL       = 120 # seconds between syncs (don't hammer the DB)


class SupabaseSync:
    def __init__(self):
        self._cache:      dict = {}
        self._last_sync:  float = 0.0
        self._connected:  bool = False

    # ── Connection check ─────────────────────────────────────────
    def ping(self) -> bool:
        """Check if Supabase is reachable."""
        try:
            r = requests.get(
                f"{SUPABASE_URL}/rest/v1/",
                headers=HEADERS,
                timeout=REQUEST_TIMEOUT,
            )
            self._connected = r.status_code in (200, 400)  # 400 = reachable but no table
            return self._connected
        except Exception:
            self._connected = False
            return False

    # ── Citizen data ─────────────────────────────────────────────
    def fetch_citizen(self, citizen_id: str) -> Optional[dict]:
        """
        Fetch citizen record by citizen_id.
        Returns dict with balance, wisdom_score, rank, etc.
        Returns None if not found or offline.
        """
        now = time.time()
        cache_key = f"citizen_{citizen_id}"

        # Return cached if fresh
        if cache_key in self._cache and (now - self._last_sync) < CACHE_TTL:
            return self._cache[cache_key]

        try:
            r = requests.get(
                f"{SUPABASE_URL}/rest/v1/citizens",
                headers={**HEADERS, "Accept": "application/json"},
                params={
                    "citizen_id": f"eq.{citizen_id}",
                    "select":     "citizen_id,name,balance,wisdom_score,rank,nation,role,web3_domain",
                    "limit":      "1",
                },
                timeout=REQUEST_TIMEOUT,
            )
            if r.status_code == 200:
                data = r.json()
                if data:
                    row = data[0]
                    self._cache[cache_key] = row
                    self._last_sync = now
                    self._connected = True
                    return row
        except Exception as e:
            print(f"[Supabase] Fetch error: {e}")
            self._connected = False

        return self._cache.get(cache_key)  # return stale cache if available

    def fetch_recent_transactions(self, citizen_id: str, limit: int = 5) -> list:
        """Fetch last N transactions for a citizen."""
        try:
            r = requests.get(
                f"{SUPABASE_URL}/rest/v1/transactions",
                headers={**HEADERS, "Accept": "application/json"},
                params={
                    "citizen_id": f"eq.{citizen_id}",
                    "select":     "amount,type,created_at,to_citizen_id",
                    "order":      "created_at.desc",
                    "limit":      str(limit),
                },
                timeout=REQUEST_TIMEOUT,
            )
            if r.status_code == 200:
                return r.json()
        except Exception:
            pass
        return []

    # ── Sync to local memory ─────────────────────────────────────
    def sync_to_memory(self, memory) -> bool:
        """
        Pull latest citizen data from Supabase and update local memory.
        Returns True if sync succeeded.
        """
        citizen_id = memory.citizen.get("citizen_id") or memory.citizen.get("web3_domain")
        if not citizen_id:
            return False

        row = self.fetch_citizen(citizen_id)
        if not row:
            return False

        updates = {}
        if "balance" in row and row["balance"] is not None:
            updates["balance_indx"] = float(row["balance"])
        if "wisdom_score" in row and row["wisdom_score"] is not None:
            updates["wisdom_score"] = int(row["wisdom_score"])
        if "rank" in row and row["rank"] is not None:
            updates["rank"] = int(row["rank"])
        if "nation" in row and row["nation"]:
            updates["nation"] = row["nation"]
        if "role" in row and row["role"]:
            updates["role"] = row["role"]

        if updates:
            memory.update_citizen(**updates)
            print(f"[Supabase] Synced: {updates}")
            return True

        return False

    def format_recent_tx(self, citizen_id: str) -> str:
        """Return a human-readable string of recent transactions."""
        txs = self.fetch_recent_transactions(citizen_id, limit=3)
        if not txs:
            return "No recent transactions found."
        lines = []
        for tx in txs:
            amount = tx.get("amount", 0)
            tx_type = tx.get("type", "transfer")
            ts = tx.get("created_at", "")[:10]
            lines.append(f"{ts}: {tx_type} {amount:.4f} INDX")
        return "Recent transactions: " + "; ".join(lines)

    @property
    def online(self) -> bool:
        return self._connected
