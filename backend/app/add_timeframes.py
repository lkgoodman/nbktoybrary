"""
Populates recurring pickup timeframes up to a cutoff date, skipping any that already exist.
Run with: docker compose exec -w /app backend python -m app.add_timeframes
"""
import asyncio
from datetime import date, datetime, timedelta

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.scheduling import Timeframe


# Recurring slots: (weekday 0=Mon, hour_start, hour_end)
SLOTS = [
    (0, 10, 12),   # Monday 10am–12pm
    (4, 16, 18),   # Friday 4pm–6pm
    (6, 16, 18),   # Sunday 4pm–6pm
]

CUTOFF = date(2026, 8, 1)


async def main() -> None:
    today = date.today()

    # Build full list of desired slots
    desired: list[datetime] = []
    current = today
    while current <= CUTOFF:
        for weekday, hour_start, _ in SLOTS:
            days_ahead = (weekday - current.weekday()) % 7
            slot_date = current + timedelta(days=days_ahead)
            if slot_date <= CUTOFF:
                desired.append(datetime(slot_date.year, slot_date.month, slot_date.day, hour_start, 0))
        current += timedelta(weeks=1)

    desired = sorted(set(desired))

    async with SessionLocal() as session:
        result = await session.execute(select(Timeframe.start_time))
        existing = {row[0].replace(second=0, microsecond=0) if hasattr(row[0], "replace") else row[0] for row in result.all()}

        to_add: list[Timeframe] = []
        for start_dt in desired:
            for weekday, hour_start, hour_end in SLOTS:
                if start_dt.hour == hour_start and start_dt.weekday() == weekday:
                    if start_dt not in existing:
                        end_dt = start_dt.replace(hour=hour_end)
                        to_add.append(Timeframe(start_time=start_dt, end_time=end_dt))

        for tf in to_add:
            session.add(tf)
        await session.commit()

    print(f"Added {len(to_add)} new timeframes (skipped {len(desired) - len(to_add)} already existing).")


asyncio.run(main())
