import pathlib
import sqlite3

DB_PATH = pathlib.Path("/data/app.db")

conn = sqlite3.connect(DB_PATH)
try:
    conn.execute("ALTER TABLE requests ADD COLUMN return_date DATE")
    conn.commit()
    print("Added return_date column to requests table.")
except sqlite3.OperationalError as e:
    if "duplicate column" in str(e):
        print("Column already exists, skipping.")
    else:
        raise
finally:
    conn.close()
