"""Add denial_note column to requests table."""
from __future__ import annotations

import sqlite3
import pathlib

DB_PATH = pathlib.Path("/data/app.db")


def main() -> None:
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("PRAGMA table_info(requests)")
    columns = {row[1] for row in cur.fetchall()}
    if "denial_note" not in columns:
        cur.execute("ALTER TABLE requests ADD COLUMN denial_note VARCHAR(1024)")
        con.commit()
        print("Added 'denial_note' column to requests.")
    else:
        print("'denial_note' column already exists, skipping.")
    con.close()


if __name__ == "__main__":
    main()
