"""Convert age_min from years to months in toys table."""
from __future__ import annotations

import sqlite3
import pathlib

DB_PATH = pathlib.Path("/data/app.db")


def main() -> None:
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("UPDATE toys SET age_min = age_min * 12 WHERE age_min IS NOT NULL AND age_min > 0")
    con.commit()
    print(f"Converted {cur.rowcount} toy(s) age_min from years to months.")
    con.close()


if __name__ == "__main__":
    main()
