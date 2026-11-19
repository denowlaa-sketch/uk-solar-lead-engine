#!/usr/bin/env python3
"""Wipe seed, dummy, and local-test CRM rows so only new live Instant Form leads remain."""
from __future__ import annotations

import sqlite3
import sys

DB = sys.argv[1] if len(sys.argv) > 1 else "/var/lib/uk-solar/prod.db"


def main() -> int:
    conn = sqlite3.connect(DB)
    conn.execute("PRAGMA foreign_keys = OFF")
    before = conn.execute("SELECT COUNT(*) FROM Lead").fetchone()[0]
    for table in (
        "LeadAnalysis",
        "CallAttempt",
        "OwnerNotification",
        "Lead",
        "Contact",
        "Company",
        "DiscoveryProspect",
    ):
        conn.execute(f"DELETE FROM {table}")
    try:
        conn.execute("DELETE FROM sqlite_sequence")
    except sqlite3.OperationalError:
        pass
    conn.commit()
    after = conn.execute("SELECT COUNT(*) FROM Lead").fetchone()[0]
    companies = conn.execute("SELECT COUNT(*) FROM Company").fetchone()[0]
    discovery = conn.execute("SELECT COUNT(*) FROM DiscoveryProspect").fetchone()[0]
    conn.close()
    print(f"cleared {before} leads; remaining leads={after} companies={companies} discovery={discovery}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
