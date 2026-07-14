"use client";

import { useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../lib/AuthContext";
import { useBorrowRequests, useCheckouts, useUpdateCheckoutDueDate, useToys, useTimeframes, queryKeys } from "../lib/queries";
import type { BorrowRequestRead, CheckoutRead, Toy, ToyImage, TimeframeRead } from "../lib/types";

function getFeaturedImage(toy: Toy): ToyImage | null {
  return toy.images.find((img: ToyImage) => img.is_featured) ?? toy.images[0] ?? null;
}

function toDateString(iso: string): string {
  return new Date(iso).toISOString().split("T")[0];
}

interface ToyRowProps {
  checkout: CheckoutRead;
  toy: Toy | undefined;
  token: string | null;
  timeframes: TimeframeRead[];
}

function ToyRow({ checkout, toy, token, timeframes }: ToyRowProps): JSX.Element {
  const image = toy !== undefined ? getFeaturedImage(toy) : null;
  const queryClient = useQueryClient();
  const updateDueDate = useUpdateCheckoutDueDate();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<{ year: number; month: number }>(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedTimeframeId, setSelectedTimeframeId] = useState<string | null>(null);

  const todayStr = toDateString(new Date().toISOString());
  const maxDueDateStr = toDateString(
    new Date(new Date(checkout.checked_out_at).getTime() + 28 * 24 * 60 * 60 * 1000).toISOString()
  );

  // Map date string → timeframes within the valid window
  const tfByDay = new Map<string, TimeframeRead[]>();
  timeframes.forEach((tf) => {
    const d = toDateString(tf.start_time);
    if (d >= todayStr && d <= maxDueDateStr) {
      const existing = tfByDay.get(d) ?? [];
      tfByDay.set(d, [...existing, tf]);
    }
  });

  const hasAnyOpenDates = tfByDay.size > 0;

  // Calendar grid for current month
  const { year, month } = calendarMonth;
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayParts = todayStr.split("-");
  const maxParts = maxDueDateStr.split("-");
  const minCalMonth = { year: parseInt(todayParts[0]), month: parseInt(todayParts[1]) - 1 };
  const maxCalMonth = { year: parseInt(maxParts[0]), month: parseInt(maxParts[1]) - 1 };
  const canGoPrev = year > minCalMonth.year || (year === minCalMonth.year && month > minCalMonth.month);
  const canGoNext = year < maxCalMonth.year || (year === maxCalMonth.year && month < maxCalMonth.month);

  const selectedSlots = selectedDateKey !== null ? (tfByDay.get(selectedDateKey) ?? []) : [];
  const selectedTimeframe = timeframes.find((tf) => tf.id === selectedTimeframeId) ?? null;

  function startEditing(): void {
    setSelectedDateKey(null);
    setSelectedTimeframeId(null);
    const d = new Date();
    setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() });
    setIsEditing(true);
  }

  function handleSave(): void {
    if (token === null || selectedTimeframe === null) return;
    updateDueDate.mutate(
      { id: checkout.id, dueAt: selectedTimeframe.start_time, token },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.list({ returned: false }) });
          setIsEditing(false);
        },
      },
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        <Box sx={{ width: 64, height: 64, flexShrink: 0, bgcolor: "grey.100", borderRadius: 1, overflow: "hidden" }}>
          {image !== null ? (
            <Box component="img" src={image.image_url} alt={toy?.name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : null}
        </Box>
        <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="bodyStrong">{checkout.toy_name}</Typography>
            {toy !== undefined ? (
              <Button component={NextLink} href={`/toys/${toy.id}`} variant="outlined" size="small" sx={{ flexShrink: 0 }}>
                View
              </Button>
            ) : null}
          </Stack>

          {checkout.returned_at !== null ? (
            <Typography variant="label" color="text.secondary">
              Returned {new Date(checkout.returned_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </Typography>
          ) : isEditing ? (
            <Stack spacing={1.5}>
              {!hasAnyOpenDates ? (
                <Typography variant="label" color="text.secondary">No open return dates available in the allowed window.</Typography>
              ) : (
                <>
                  {/* Calendar header */}
                  <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                    <Button size="small" onClick={() => setCalendarMonth({ year: month === 0 ? year - 1 : year, month: month === 0 ? 11 : month - 1 })} disabled={!canGoPrev}>
                      ← Prev
                    </Button>
                    <Typography variant="label">
                      {new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                    </Typography>
                    <Button size="small" onClick={() => setCalendarMonth({ year: month === 11 ? year + 1 : year, month: month === 11 ? 0 : month + 1 })} disabled={!canGoNext}>
                      Next →
                    </Button>
                  </Stack>

                  {/* Calendar grid */}
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.25 }}>
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <Typography key={d} variant="label" color="text.secondary" sx={{ textAlign: "center", py: 0.25 }}>
                        {d}
                      </Typography>
                    ))}
                    {cells.map((day, i) => {
                      if (day === null) return <Box key={`empty-${i}`} />;
                      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const isOpen = tfByDay.has(dateKey);
                      const isToday = todayStr === dateKey;
                      const isSelected = selectedDateKey === dateKey;
                      return (
                        <Box
                          key={dateKey}
                          onClick={() => {
                            if (!isOpen) return;
                            setSelectedDateKey(isSelected ? null : dateKey);
                            setSelectedTimeframeId(null);
                          }}
                          sx={{
                            py: 0.5,
                            border: 1,
                            borderColor: isSelected ? "primary.main" : isToday ? "primary.light" : "divider",
                            borderRadius: 1,
                            bgcolor: isSelected ? "primary.light" : isOpen ? "grey.50" : "transparent",
                            cursor: isOpen ? "pointer" : "default",
                            opacity: isOpen ? 1 : 0.35,
                            textAlign: "center",
                            "&:hover": isOpen && !isSelected ? { borderColor: "primary.light" } : {},
                          }}
                        >
                          <Typography variant="label" color={isToday ? "primary.main" : isOpen ? "text.primary" : "text.disabled"}>
                            {day}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>

                  {/* Time slots for selected date */}
                  {selectedDateKey !== null ? (
                    <Stack spacing={0.5}>
                      <Typography variant="label" color="text.secondary">Select a drop-off time:</Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                        {selectedSlots.map((tf) => {
                          const isChosen = selectedTimeframeId === tf.id;
                          return (
                            <Chip
                              key={tf.id}
                              label={`${new Date(tf.start_time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} – ${new Date(tf.end_time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`}
                              onClick={() => setSelectedTimeframeId(isChosen ? null : tf.id)}
                              color={isChosen ? "primary" : "default"}
                              variant={isChosen ? "filled" : "outlined"}
                              size="small"
                            />
                          );
                        })}
                      </Stack>
                    </Stack>
                  ) : null}
                </>
              )}

              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Button size="small" variant="contained" onClick={handleSave} disabled={updateDueDate.isPending || selectedTimeframe === null}>
                  Save
                </Button>
                <Button size="small" variant="outlined" onClick={() => setIsEditing(false)} disabled={updateDueDate.isPending}>
                  Cancel
                </Button>
              </Stack>

              {updateDueDate.isError ? (
                <Typography variant="label" color="error">{updateDueDate.error.message}</Typography>
              ) : null}
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography variant="label" color="text.secondary">
                Due: {new Date(checkout.due_at).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </Typography>
              <Button size="small" variant="text" sx={{ p: 0, minWidth: 0, fontSize: "inherit" }} onClick={startEditing}>
                Change
              </Button>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function LoansPage(): JSX.Element {
  const { token, isMember } = useAuth();
  const { data: activeCheckouts, isPending, isError } = useCheckouts(token, { returned: false });
  const { data: pastCheckouts } = useCheckouts(token, { returned: true });
  const { data: requests } = useBorrowRequests(token);
  const { data: toys } = useToys();
  const { data: timeframes } = useTimeframes();

  const now = new Date();

  const upcomingBatches: BorrowRequestRead[][] = Object.values(
    (requests ?? []).reduce<Record<string, BorrowRequestRead[]>>(
      (groups, req) => {
        const k = req.batch_id;
        return { ...groups, [k]: [...(groups[k] ?? []), req] };
      },
      {},
    )
  ).filter(
    (b) =>
      b.every((r) => r.status === "approved") &&
      b[0].pickup_start !== null &&
      b[0].pickup_start !== undefined &&
      new Date(b[0].pickup_start) > now,
  ).sort((a, b) => new Date(a[0].pickup_start!).getTime() - new Date(b[0].pickup_start!).getTime());

  if (!isMember) {
    return (
      <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 600, mx: "auto" }}>
        <Typography variant="body1" color="text.secondary">
          Membership is required to view loans.
        </Typography>
      </Box>
    );
  }

  const toysById = new Map((toys ?? []).map((t: Toy) => [t.id, t]));
  const allTimeframes = timeframes ?? [];

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 600, mx: "auto" }}>
      <Stack spacing={4}>
        <Typography variant="pageTitle" component="h1">Loans</Typography>

        {upcomingBatches.length > 0 ? (
          <Stack spacing={2}>
            <Typography variant="sectionTitle" component="h2">Upcoming</Typography>
            {upcomingBatches.map((batch) => (
              <Paper key={batch[0].batch_id} elevation={0} sx={{ p: 3 }}>
                <Stack spacing={2}>
                  {batch[0].pickup_start !== null && batch[0].pickup_end !== null ? (
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                      <Typography variant="label" color="text.secondary">
                        Pickup: {new Date(batch[0].pickup_start).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}{" "}
                        {new Date(batch[0].pickup_start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        {" – "}
                        {new Date(batch[0].pickup_end).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Chip label="Upcoming" size="small" color="info" variant="outlined" />
                        <Button component={NextLink} href={`/requests/${batch[0].batch_id}`} variant="outlined" size="small">
                          View
                        </Button>
                      </Stack>
                    </Stack>
                  ) : null}
                  {batch.map((req: BorrowRequestRead) => {
                    const toy = toysById.get(req.toy_id);
                    const image = toy !== undefined ? getFeaturedImage(toy) : null;
                    return (
                      <Stack key={req.id} direction="row" spacing={2} sx={{ alignItems: "center" }}>
                        <Box sx={{ width: 64, height: 64, flexShrink: 0, bgcolor: "grey.100", borderRadius: 1, overflow: "hidden" }}>
                          {image !== null ? (
                            <Box component="img" src={image.image_url} alt={toy?.name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : null}
                        </Box>
                        <Typography variant="bodyStrong" sx={{ flex: 1, minWidth: 0 }}>{toy?.name ?? "Unknown toy"}</Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : null}

        {upcomingBatches.length > 0 ? <Divider /> : null}

        <Stack spacing={2}>
          <Typography variant="sectionTitle" component="h2">Current</Typography>
          {isPending ? (
            <Typography variant="body1" color="text.secondary">Loading…</Typography>
          ) : isError ? (
            <Typography variant="body1" color="error">Failed to load loans.</Typography>
          ) : (activeCheckouts ?? []).length === 0 ? (
            <Typography variant="body1" color="text.secondary">You have no toys currently checked out.</Typography>
          ) : (
            <Stack spacing={2}>
              {(activeCheckouts ?? []).map((c: CheckoutRead) => (
                <ToyRow key={c.id} checkout={c} toy={toysById.get(c.toy_id)} token={token} timeframes={allTimeframes} />
              ))}
            </Stack>
          )}
        </Stack>

        {(pastCheckouts ?? []).length > 0 ? (
          <>
            <Divider />
            <Stack spacing={2}>
              <Typography variant="sectionTitle" component="h2">History</Typography>
              <Stack spacing={2}>
                {(pastCheckouts ?? []).map((c: CheckoutRead) => (
                  <ToyRow key={c.id} checkout={c} toy={toysById.get(c.toy_id)} token={token} timeframes={allTimeframes} />
                ))}
              </Stack>
            </Stack>
          </>
        ) : null}
      </Stack>
    </Box>
  );
}
