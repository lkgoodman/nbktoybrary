"use client";

import { useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../lib/AuthContext";
import { updateCheckoutDueDate } from "../lib/api";
import { useBorrowRequests, useCheckouts, useUpdateCheckoutDueDate, useToys, useTimeframes, queryKeys } from "../lib/queries";
import type { BorrowRequestRead, CheckoutRead, Toy, ToyImage, TimeframeRead } from "../lib/types";

function getFeaturedImage(toy: Toy): ToyImage | null {
  return toy.images.find((img: ToyImage) => img.is_featured) ?? toy.images[0] ?? null;
}

function toDateString(iso: string): string {
  return new Date(iso).toISOString().split("T")[0];
}

// ── Shared calendar + time-slot picker ───────────────────────────────────────

interface ReturnCalendarPickerProps {
  timeframes: TimeframeRead[];
  todayStr: string;
  maxDueDateStr: string;
  selectedTimeframeId: string | null;
  onSelectTimeframe: (tf: TimeframeRead | null) => void;
}

function ReturnCalendarPicker({ timeframes, todayStr, maxDueDateStr, selectedTimeframeId, onSelectTimeframe }: ReturnCalendarPickerProps): JSX.Element {
  const [calendarMonth, setCalendarMonth] = useState<{ year: number; month: number }>(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const tfByDay = new Map<string, TimeframeRead[]>();
  timeframes.forEach((tf) => {
    const d = toDateString(tf.start_time);
    if (d >= todayStr && d <= maxDueDateStr) {
      tfByDay.set(d, [...(tfByDay.get(d) ?? []), tf]);
    }
  });

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

  if (tfByDay.size === 0) {
    return (
      <Typography variant="label" color="text.secondary">No open return dates available in the allowed window.</Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
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
                const next = isSelected ? null : dateKey;
                setSelectedDateKey(next);
                onSelectTimeframe(null);
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
                  onClick={() => onSelectTimeframe(isChosen ? null : tf)}
                  color={isChosen ? "primary" : "default"}
                  variant={isChosen ? "filled" : "outlined"}
                  size="small"
                />
              );
            })}
          </Stack>
        </Stack>
      ) : null}
    </Stack>
  );
}

// ── Per-toy row ───────────────────────────────────────────────────────────────

interface ToyRowProps {
  checkout: CheckoutRead;
  toy: Toy | undefined;
  token: string | null;
  timeframes: TimeframeRead[];
  isSelected: boolean;
  onToggleSelect: () => void;
}

function ToyRow({ checkout, toy, token, timeframes, isSelected, onToggleSelect }: ToyRowProps): JSX.Element {
  const image = toy !== undefined ? getFeaturedImage(toy) : null;
  const queryClient = useQueryClient();
  const updateDueDate = useUpdateCheckoutDueDate();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeRead | null>(null);

  const todayStr = toDateString(new Date().toISOString());
  const maxDueDateStr = toDateString(
    new Date(new Date(checkout.checked_out_at).getTime() + 28 * 24 * 60 * 60 * 1000).toISOString()
  );

  function handleSave(): void {
    if (token === null || selectedTimeframe === null) return;
    updateDueDate.mutate(
      { id: checkout.id, dueAt: selectedTimeframe.start_time, token },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.list({ returned: false }) });
          setIsEditing(false);
          setSelectedTimeframe(null);
        },
      },
    );
  }

  const isActive = checkout.returned_at === null;

  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        {isActive ? (
          <Checkbox
            checked={isSelected}
            onChange={onToggleSelect}
            size="small"
            sx={{ mt: -0.5, ml: -1 }}
          />
        ) : null}
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

          {!isActive ? (
            <Typography variant="label" color="text.secondary">
              Returned {new Date(checkout.returned_at!).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </Typography>
          ) : isEditing ? (
            <Stack spacing={1.5}>
              <ReturnCalendarPicker
                timeframes={timeframes}
                todayStr={todayStr}
                maxDueDateStr={maxDueDateStr}
                selectedTimeframeId={selectedTimeframe?.id ?? null}
                onSelectTimeframe={(tf) => setSelectedTimeframe(tf)}
              />
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Button size="small" variant="contained" onClick={handleSave} disabled={updateDueDate.isPending || selectedTimeframe === null}>
                  Save
                </Button>
                <Button size="small" variant="outlined" onClick={() => { setIsEditing(false); setSelectedTimeframe(null); }} disabled={updateDueDate.isPending}>
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
              <Button size="small" variant="text" sx={{ p: 0, minWidth: 0, fontSize: "inherit" }} onClick={() => setIsEditing(true)}>
                Change
              </Button>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LoansPage(): JSX.Element {
  const { token, isMember } = useAuth();
  const { data: activeCheckouts, isPending, isError } = useCheckouts(token, { returned: false });
  const { data: pastCheckouts } = useCheckouts(token, { returned: true });
  const { data: requests } = useBorrowRequests(token);
  const { data: toys } = useToys();
  const { data: timeframes } = useTimeframes();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditing, setIsBulkEditing] = useState<boolean>(false);
  const [bulkTimeframe, setBulkTimeframe] = useState<TimeframeRead | null>(null);
  const [bulkSaving, setBulkSaving] = useState<boolean>(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const now = new Date();
  const todayStr = toDateString(now.toISOString());
  const allTimeframes = timeframes ?? [];

  function toggleSelect(id: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function clearSelection(): void {
    setSelectedIds(new Set());
    setIsBulkEditing(false);
    setBulkTimeframe(null);
    setBulkError(null);
  }

  async function handleBulkSave(): Promise<void> {
    if (token === null || bulkTimeframe === null) return;
    setBulkSaving(true);
    setBulkError(null);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => updateCheckoutDueDate(id, bulkTimeframe.start_time, token))
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.list({ returned: false }) });
      clearSelection();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Failed to update return dates");
    } finally {
      setBulkSaving(false);
    }
  }

  // For the bulk picker, constrain to the earliest max date across all selected checkouts
  const selectedCheckouts = (activeCheckouts ?? []).filter((c) => selectedIds.has(c.id));
  const bulkMaxDueDateStr = selectedCheckouts.length > 0
    ? selectedCheckouts.reduce<string>((min, c) => {
        const d = toDateString(new Date(new Date(c.checked_out_at).getTime() + 28 * 24 * 60 * 60 * 1000).toISOString());
        return d < min ? d : min;
      }, toDateString(new Date(new Date(selectedCheckouts[0].checked_out_at).getTime() + 28 * 24 * 60 * 60 * 1000).toISOString()))
    : todayStr;

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
                <ToyRow
                  key={c.id}
                  checkout={c}
                  toy={toysById.get(c.toy_id)}
                  token={token}
                  timeframes={allTimeframes}
                  isSelected={selectedIds.has(c.id)}
                  onToggleSelect={() => toggleSelect(c.id)}
                />
              ))}

              {/* Bulk action bar */}
              {selectedIds.size > 0 ? (
                <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: "primary.main" }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                      <Typography variant="bodyStrong">
                        {selectedIds.size} toy{selectedIds.size > 1 ? "s" : ""} selected
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {!isBulkEditing ? (
                          <Button size="small" variant="contained" onClick={() => { setIsBulkEditing(true); setBulkTimeframe(null); }}>
                            Change return date
                          </Button>
                        ) : null}
                        <Button size="small" variant="outlined" onClick={clearSelection}>
                          Cancel
                        </Button>
                      </Stack>
                    </Stack>

                    {isBulkEditing ? (
                      <Stack spacing={1.5}>
                        <ReturnCalendarPicker
                          timeframes={allTimeframes}
                          todayStr={todayStr}
                          maxDueDateStr={bulkMaxDueDateStr}
                          selectedTimeframeId={bulkTimeframe?.id ?? null}
                          onSelectTimeframe={(tf) => setBulkTimeframe(tf)}
                        />
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => { void handleBulkSave(); }}
                            disabled={bulkSaving || bulkTimeframe === null}
                          >
                            {bulkSaving ? "Saving…" : `Save for ${selectedIds.size} toy${selectedIds.size > 1 ? "s" : ""}`}
                          </Button>
                          <Button size="small" variant="outlined" onClick={() => { setIsBulkEditing(false); setBulkTimeframe(null); }} disabled={bulkSaving}>
                            Back
                          </Button>
                        </Stack>
                        {bulkError !== null ? (
                          <Typography variant="label" color="error">{bulkError}</Typography>
                        ) : null}
                      </Stack>
                    ) : null}
                  </Stack>
                </Paper>
              ) : null}
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
                  <ToyRow
                    key={c.id}
                    checkout={c}
                    toy={toysById.get(c.toy_id)}
                    token={token}
                    timeframes={allTimeframes}
                    isSelected={false}
                    onToggleSelect={() => undefined}
                  />
                ))}
              </Stack>
            </Stack>
          </>
        ) : null}
      </Stack>
    </Box>
  );
}
