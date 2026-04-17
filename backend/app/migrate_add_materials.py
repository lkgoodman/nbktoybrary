"""Add materials column to toys table."""
from __future__ import annotations

import sqlite3
import pathlib

DB_PATH = pathlib.Path("/data/app.db")


def main() -> None:
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("PRAGMA table_info(toys)")
    columns = {row[1] for row in cur.fetchall()}
    if "materials" not in columns:
        cur.execute("ALTER TABLE toys ADD COLUMN materials JSON NOT NULL DEFAULT '[]'")
        con.commit()
        print("Added 'materials' column to toys.")
    else:
        print("'materials' column already exists, skipping.")
    con.close()


if __name__ == "__main__":
    main()
