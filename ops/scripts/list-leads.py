#!/usr/bin/env python3
import sqlite3
import sys

db = sys.argv[1] if len(sys.argv) > 1 else "/var/lib/uk-solar/prod.db"
c = sqlite3.connect(db)
c.row_factory = sqlite3.Row
print("leads", c.execute("SELECT COUNT(*) FROM Lead").fetchone()[0])
print("companies", c.execute("SELECT COUNT(*) FROM Company").fetchone()[0])
print("contacts", c.execute("SELECT COUNT(*) FROM Contact").fetchone()[0])
print("calls", c.execute("SELECT COUNT(*) FROM CallAttempt").fetchone()[0])
print("analyses", c.execute("SELECT COUNT(*) FROM LeadAnalysis").fetchone()[0])
print("notifs", c.execute("SELECT COUNT(*) FROM OwnerNotification").fetchone()[0])
try:
    print("discovery", c.execute("SELECT COUNT(*) FROM DiscoveryProspect").fetchone()[0])
except Exception as exc:
    print("discovery", exc)
print("--- sources ---")
for r in c.execute("SELECT source, COUNT(*) n FROM Lead GROUP BY source"):
    print(r["source"], r["n"])
print("--- leads ---")
rows = c.execute(
    """
    SELECT l.source, l.status, l.consentToCall, l.facebookLeadId, l.facebookFormId,
           c.firstName, c.lastName, c.phone, co.name
    FROM Lead l
    LEFT JOIN Contact c ON c.id = l.contactId
    LEFT JOIN Company co ON co.id = l.companyId
    ORDER BY l.createdAt DESC
    """
)
for r in rows:
    print(
        r["source"],
        r["status"],
        "consent=" + str(r["consentToCall"]),
        "fb=" + str(r["facebookLeadId"]),
        "|",
        r["firstName"],
        r["lastName"],
        "|",
        r["phone"],
        "|",
        r["name"],
    )
