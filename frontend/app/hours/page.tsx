"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useTimeframes } from "../lib/queries";
import type { TimeframeRead } from "../lib/types";

export default function HoursPage(): JSX.Element {
  const { data: timeframes, isPending, isError } = useTimeframes(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const tfByDay = new Map<string, TimeframeRead[]>();
  (timeframes ?? []).forEach((tf) => {
    const d = new Date(tf.start_time);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    tfByDay.set(key, [...(tfByDay.get(key) ?? []), tf]);
  });

  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<{ year: number; month: number; day: number } | null>(null);

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 700, mx: "auto" }}>
      <Stack spacing={3}>
        <Typography variant="pageTitle" component="h1">Open Hours</Typography>
        <Typography variant="body1" color="text.secondary">
          Toy pickup and return times below.
        </Typography>

        {isPending ? (
          <Typography variant="body1" color="text.secondary">Loading…</Typography>
        ) : isError ? (
          <Typography variant="body1" color="error">Failed to load hours.</Typography>
        ) : (
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Button size="small" onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}>← Prev</Button>
              <Typography variant="bodyStrong">
                {calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </Typography>
              <Button size="small" onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}>Next →</Button>
            </Stack>

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <Typography key={d} variant="label" color="text.secondary" sx={{ textAlign: "center", py: 0.5 }}>
                  {d}
                </Typography>
              ))}
              {cells.map((day, i) => {
                if (day === null) return <Box key={`empty-${i}`} />;
                const key = `${year}-${month}-${day}`;
                const dayTfs = tfByDay.get(key) ?? [];
                const hasSlots = dayTfs.length > 0;
                const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                const isSelected = selectedDay !== null && selectedDay.year === year && selectedDay.month === month && selectedDay.day === day;
                return (
                  <Box
                    key={key}
                    onClick={() => hasSlots && setSelectedDay(isSelected ? null : { year, month, day })}
                    sx={{
                      minHeight: 64,
                      p: 0.75,
                      border: 1,
                      borderColor: isSelected ? "primary.main" : isToday ? "primary.light" : "divider",
                      borderRadius: 1,
                      bgcolor: isSelected ? "primary.light" : hasSlots ? "grey.50" : "grey.200",
                      cursor: hasSlots ? "pointer" : "default",
                      opacity: hasSlots ? 1 : 0.5,
                      "&:hover": hasSlots ? { borderColor: "primary.main" } : {},
                    }}
                  >
                    <Typography
                      variant="label"
                      color={isToday ? "primary.main" : hasSlots ? "text.primary" : "text.disabled"}
                      sx={{ fontWeight: isToday ? 700 : 400 }}
                    >
                      {day}
                    </Typography>
                    <Typography variant="label" sx={{ fontSize: "0.6rem", color: hasSlots ? "primary.main" : "text.disabled", display: "block", lineHeight: 1.3, mt: 0.25 }}>
                      {hasSlots ? "Open" : "Closed"}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {selectedDay !== null ? (() => {
              const key = `${selectedDay.year}-${selectedDay.month}-${selectedDay.day}`;
              const slots = tfByDay.get(key) ?? [];
              const label = new Date(selectedDay.year, selectedDay.month, selectedDay.day)
                .toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
              return (
                <Paper elevation={0} sx={{ p: 3, mt: 1 }}>
                  <Stack spacing={1}>
                    <Typography variant="bodyStrong">{label}</Typography>
                    {slots.map((tf) => (
                      <Stack key={tf.id} spacing={0.25}>
                        <Typography variant="body1">
                          {new Date(tf.start_time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                          {" – "}
                          {new Date(tf.end_time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        </Typography>
                        {tf.notes !== null ? (
                          <Typography variant="label" color="text.secondary">{tf.notes}</Typography>
                        ) : null}
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              );
            })() : null}
          </Stack>
        )}

        <Stack spacing={2}>
          <Typography variant="body1">
            Toy pickup and returns are located at 171 Calyer Street.
          </Typography>
          <Box
            component="img"
            src="/map.png"
            alt="Map showing 171 Calyer Street"
            sx={{ width: "100%", borderRadius: 2 }}
          />
        </Stack>
      </Stack>
    </Box>
  );
}
